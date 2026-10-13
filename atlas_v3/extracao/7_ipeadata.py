#!/usr/bin/env python3
"""Gera dados/dados-ipeadata.js com as séries do Ipeadata (IPEA) para os sete municípios.

    python3 extracao/7_ipeadata.py                         # todas as séries que servem
    python3 extracao/7_ipeadata.py --temas "emprego,educação"
    python3 extracao/7_ipeadata.py --incluir COD1,COD2     # só estas séries
    python3 extracao/7_ipeadata.py --excluir COD3 --ano-minimo 2005

Fonte: API OData 4 do Ipeadata, https://www.ipeadata.gov.br/api/odata4, pública,
sem chave. O Ipeadata republica séries de outras fontes (IBGE, Tesouro, MTE e
outras); cada série guarda a fonte original, que vai junto para o Atlas.

O que o script faz:
1. Confere que os sete municípios estão na tabela Territorios e acha o nome do
   nível municipal (campo NIVNOME), em vez de supor.
2. Baixa os valores dos sete municípios em todas as séries. Primeiro tenta a
   tabela Valores filtrada por município (sete consultas). Se a API recusar o
   filtro, consulta série a série (ValoresSerie), o que leva mais tempo; as
   respostas ficam guardadas em extracao/fontes/ipeadata/ e uma nova rodada
   não baixa de novo o que já tem (--sem-cache força).
3. Junta nome, fonte, unidade, frequência e tema de cada série (Metadados e
   Temas) e escolhe, para cada uma, o ano do mapa.

Regras, as mesmas do Atlas (não estimar, não completar):
- O ano do mapa é o mais recente, a partir de --ano-minimo (padrão 2000), em
  que os sete municípios têm valor. Série sem esse ano fica de fora.
- Série com mais de um valor no mesmo ano para o mesmo município (mensal,
  trimestral) fica de fora: o mapa do Atlas tem um valor por ano.
- Série não numérica, sem metadado ou com o mesmo dado repetido com números
  diferentes fica de fora.
- Os valores vão como a API entrega: sem conversão, sem preencher ano vazio.
  A unidade e o multiplicador (por exemplo, "mil") são os da própria série.

O motivo de cada série que ficou de fora vai para
extracao/fontes/ipeadata/inventario.csv. O script só lê a API; não envia nada.
Precisa só da biblioteca padrão do Python.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import html
import json
import pathlib
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from datetime import date, datetime

RAIZ = pathlib.Path(__file__).resolve().parent.parent          # atlas_v3/
SAIDA = RAIZ / "dados" / "dados-ipeadata.js"
PASTA = RAIZ / "extracao" / "fontes" / "ipeadata"              # cache e inventário (não versionados)
BASE_PADRAO = "https://www.ipeadata.gov.br/api/odata4"

MUN = {"4314902": "Porto Alegre", "4304606": "Canoas", "4309209": "Gravataí",
       "4320008": "Sapucaia do Sul", "4303103": "Cachoeirinha", "4309308": "Guaíba",
       "4307708": "Esteio"}
COD = list(MUN)

CAMPOS_META = ("SERCODIGO,SERNOME,SERCOMENTARIO,SERATUALIZACAO,BASNOME,FNTSIGLA,FNTNOME,FNTURL,"
               "PERNOME,UNINOME,MULNOME,SERSTATUS,SERNUMERICA,TEMCODIGO")
CAMPOS_VALOR = "SERCODIGO,VALDATA,VALVALOR,NIVNOME,TERCODIGO"
VALIDADE_CACHE_DIAS = 7
AVISO_TAMANHO_KB = 1500


class ErroAPI(Exception):
    """A API respondeu com erro, não respondeu ou mudou de formato."""

    def __init__(self, msg: str, status: int | None = None):
        super().__init__(msg)
        self.status = status


# ---------------------------------------------------------------- acesso à API
class API:
    def __init__(self, base: str, usar_cache: bool):
        self.base = base.rstrip("/")
        self.usar_cache = usar_cache
        self.consultas = 0
        self.do_cache = 0
        self.aspas = True        # TERCODIGO comparado como texto; a API pode exigir número
        (PASTA / "cache").mkdir(parents=True, exist_ok=True)

    def _cache(self, url: str) -> pathlib.Path:
        return PASTA / "cache" / (hashlib.sha1(url.encode()).hexdigest() + ".json")

    def pega(self, url: str) -> dict:
        """GET com cache, tempo-limite e até três novas tentativas em falha de rede ou 5xx."""
        arq = self._cache(url)
        if self.usar_cache and arq.exists() and time.time() - arq.stat().st_mtime < VALIDADE_CACHE_DIAS * 86400:
            self.do_cache += 1
            return json.loads(arq.read_text(encoding="utf-8"))
        espera = 2
        for tentativa in range(4):
            try:
                req = urllib.request.Request(url, headers={"Accept": "application/json",
                                                           "User-Agent": "atlas-rmpa/7_ipeadata.py"})
                with urllib.request.urlopen(req, timeout=180) as r:
                    dados = json.load(r)
                self.consultas += 1
                arq.write_text(json.dumps(dados, ensure_ascii=False), encoding="utf-8")
                return dados
            except urllib.error.HTTPError as e:
                corpo = e.read().decode("utf-8", "replace")[:400]
                if e.code < 500 or tentativa == 3:
                    raise ErroAPI(f"HTTP {e.code} em {url}\n  {corpo}", e.code) from None
            except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
                motivo = str(getattr(e, "reason", e))
                if "CERTIFICATE_VERIFY_FAILED" in motivo:
                    raise ErroAPI(f"o Python deste computador não reconheceu o certificado HTTPS de {url}. "
                                  "No Mac, rode 'Install Certificates.command' na pasta do Python; ou use "
                                  f"--base {BASE_PADRAO.replace('https://', 'http://')}") from None
                if tentativa == 3:
                    raise ErroAPI(f"sem resposta de {url}: {motivo}") from None
            except json.JSONDecodeError:
                raise ErroAPI(f"a resposta de {url} não é JSON") from None
            time.sleep(espera)
            espera *= 2
        raise ErroAPI(f"sem resposta de {url}")

    def odata(self, caminho: str, params: dict | None = None) -> list[dict]:
        """Consulta OData seguindo as páginas (@odata.nextLink)."""
        url = f"{self.base}/{caminho}"
        if params:
            url += "?" + urllib.parse.urlencode(params, quote_via=urllib.parse.quote, safe="$,'()")
        linhas: list[dict] = []
        paginas = 0
        while url:
            j = self.pega(url)
            if not isinstance(j.get("value"), list):
                raise ErroAPI(f"a resposta de {url} não tem a lista 'value'")
            linhas.extend(j["value"])
            url = j.get("@odata.nextLink")
            paginas += 1
            if paginas > 2000:
                raise ErroAPI(f"mais de 2000 páginas em {caminho}; a consulta precisa de filtro")
        return linhas

    def odata_campos(self, caminho: str, params: dict, campos: str) -> list[dict]:
        """Com $select; se a API recusar o $select (400), repete sem ele."""
        try:
            return self.odata(caminho, dict(params, **{"$select": campos}))
        except ErroAPI as e:
            if e.status != 400:
                raise
            return self.odata(caminho, params)

    def filtro_ter(self, cods: list[str]) -> str:
        q = (lambda c: f"'{c}'") if self.aspas else (lambda c: c)
        return " or ".join(f"TERCODIGO eq {q(c)}" for c in cods)


def exige_campos(linha: dict, campos: list[str], origem: str) -> None:
    faltam = [c for c in campos if c not in linha]
    if faltam:
        raise ErroAPI(f"{origem}: faltam os campos {', '.join(faltam)}. "
                      f"Campos que vieram: {', '.join(linha)}. Confira se a API mudou.")


# ---------------------------------------------------------------- etapas
def nivel_municipal(api: API) -> str:
    """Os sete municípios em Territorios; devolve o NIVNOME do nível municipal."""
    niveis: dict[str, set[str]] = {}
    for cod, nome in MUN.items():
        try:
            t = api.odata("Territorios", {"$filter": api.filtro_ter([cod])})
        except ErroAPI as e:
            if e.status != 400 or not api.aspas:
                raise
            api.aspas = False                       # o código é número nesta API
            t = api.odata("Territorios", {"$filter": api.filtro_ter([cod])})
        if not t:
            raise ErroAPI(f"{nome} ({cod}) não está na tabela Territorios do Ipeadata")
        exige_campos(t[0], ["TERCODIGO", "NIVNOME"], "Territorios")
        niveis[cod] = {str(x["NIVNOME"]) for x in t}
    comuns = set.intersection(*niveis.values())
    if len(comuns) > 1:
        comuns = {n for n in comuns if re.search(r"munic", sem_acento(n), re.I)}
    if len(comuns) != 1:
        raise ErroAPI("não achei um nível único para os sete municípios em Territorios: "
                      + "; ".join(f"{MUN[c]}: {', '.join(sorted(n))}" for c, n in niveis.items()))
    return comuns.pop()


def valores_por_municipio(api: API, nivel: str) -> dict[str, dict[str, list]]:
    """Caminho rápido: a tabela Valores filtrada por município (sete consultas)."""
    dados: dict[str, dict[str, list]] = {}
    for cod, nome in MUN.items():
        linhas = api.odata_campos("Valores", {"$filter": api.filtro_ter([cod])}, CAMPOS_VALOR)
        if linhas:
            exige_campos(linhas[0], ["SERCODIGO", "VALDATA", "VALVALOR"], "Valores")
        usadas = 0
        for v in linhas:
            if v.get("NIVNOME") not in (None, nivel) or str(v.get("TERCODIGO", cod)) != cod:
                continue
            dados.setdefault(v["SERCODIGO"], {}).setdefault(cod, []).append((str(v["VALDATA"]), v["VALVALOR"]))
            usadas += 1
        print(f"  {nome}: {usadas} valores")
    return dados


def valores_por_serie(api: API, nivel: str, metas: dict[str, dict]) -> dict[str, dict[str, list]]:
    """Caminho lento: série a série, quando a API não filtra a tabela Valores."""
    candidatas = [c for c, m in metas.items()
                  if m.get("SERNUMERICA") is not False and m.get("BASNOME") != "Macroeconômico"]
    print(f"  {len(candidatas)} séries para consultar uma a uma (as respostas ficam no cache)")
    dados: dict[str, dict[str, list]] = {}
    filtro = api.filtro_ter(COD)
    sem_filtro = False
    for k, cod_serie in enumerate(candidatas, 1):
        caminho = urllib.parse.quote(f"ValoresSerie(SERCODIGO='{cod_serie}')", safe="()='")
        if not sem_filtro:
            try:
                linhas = api.odata(caminho, {"$filter": filtro})
            except ErroAPI as e:
                if e.status != 400:
                    raise
                sem_filtro = True
                print("  a função ValoresSerie não aceita filtro: baixando cada série inteira")
        if sem_filtro:
            linhas = api.odata(caminho)
        for v in linhas:
            cod = str(v.get("TERCODIGO", ""))
            if cod not in MUN or v.get("NIVNOME") not in (None, nivel):
                continue
            dados.setdefault(cod_serie, {}).setdefault(cod, []).append((str(v["VALDATA"]), v["VALVALOR"]))
        if k % 100 == 0:
            print(f"    {k} de {len(candidatas)} séries; {len(dados)} com dado dos sete")
    return dados


def metadados(api: API) -> dict[str, dict]:
    md = api.odata_campos("Metadados", {}, CAMPOS_META)
    if not md:
        raise ErroAPI("a tabela Metadados veio vazia")
    exige_campos(md[0], ["SERCODIGO", "SERNOME"], "Metadados")
    return {m["SERCODIGO"]: m for m in md}


def temas(api: API) -> dict[str, str]:
    try:
        return {str(t["TEMCODIGO"]): t.get("TEMNOME", "") for t in api.odata("Temas")}
    except ErroAPI:
        return {}


# ---------------------------------------------------------------- regras
def sem_acento(s: str) -> str:
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower()


def texto_limpo(s, limite: int = 500) -> str:
    t = html.unescape(re.sub(r"<[^>]+>", " ", str(s or "")))
    t = re.sub(r"\s+", " ", t).strip()
    return t if len(t) <= limite else t[:limite].rsplit(" ", 1)[0] + "…"


def avalia(cod_serie: str, por_mun: dict[str, list], meta: dict | None, ano_minimo: int):
    """Devolve (série para o Atlas ou None, motivo)."""
    if not meta:
        return None, "sem metadado no Ipeadata"
    if meta.get("SERNUMERICA") is False:
        return None, "série não numérica"
    tabela: dict[int, dict[str, float]] = {}
    for mun, obs in por_mun.items():
        por_data: dict[str, float] = {}          # chave: só a data (AAAA-MM-DD), sem hora nem fuso
        for data, valor in obs:
            if valor is None:
                continue
            if isinstance(valor, bool) or not isinstance(valor, (int, float)):
                return None, "valor não numérico"
            dia = data[:10]
            if dia in por_data and por_data[dia] != valor:
                return None, f"a mesma data veio com dois valores ({MUN[mun]}, {dia})"
            por_data[dia] = valor
        if any(n > 1 for n in Counter(d[:4] for d in por_data).values()):
            return None, f"mais de um valor por ano ({meta.get('PERNOME') or 'frequência menor que anual'})"
        for data, valor in por_data.items():
            tabela.setdefault(int(data[:4]), {})[mun] = valor
    anos = sorted(a for a in tabela if a >= ano_minimo)
    if not anos:
        return None, f"sem valor desde {ano_minimo}"
    completos = [a for a in anos if len(tabela[a]) == len(COD)]
    if not completos:
        ult = anos[-1]
        return None, f"nenhum ano desde {ano_minimo} com os sete municípios (em {ult}: {len(tabela[ult])} de 7)"
    return {"ano": completos[-1], "anos": anos, "v": [[tabela[a].get(m) for m in COD] for a in anos]}, "entrou"


def id_atlas(cod_serie: str, usados: set[str]) -> str:
    base = "ipd_" + (re.sub(r"[^a-z0-9]+", "_", sem_acento(cod_serie)).strip("_")[:40] or "serie")
    i, novo = 2, base
    while novo in usados:
        novo = f"{base}_{i}"
        i += 1
    usados.add(novo)
    return novo


def lista(arg: str | None) -> list[str]:
    return [x.strip() for x in (arg or "").split(",") if x.strip()]


# ---------------------------------------------------------------- principal
def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--ano-minimo", type=int, default=2000, help="primeiro ano que entra (padrão 2000)")
    ap.add_argument("--temas", help="só séries destes temas, separados por vírgula (parte do nome basta)")
    ap.add_argument("--incluir", help="só estas séries (códigos do Ipeadata, separados por vírgula)")
    ap.add_argument("--excluir", help="tira estas séries (códigos, separados por vírgula)")
    ap.add_argument("--metodo", choices=["auto", "municipio", "serie"], default="auto",
                    help="auto: tenta por município e, se a API recusar, série a série")
    ap.add_argument("--sem-cache", action="store_true", help="baixa tudo de novo")
    ap.add_argument("--base", default=BASE_PADRAO,
                    help=f"endereço da API (padrão {BASE_PADRAO}; se o HTTPS falhar, use o mesmo com http://)")
    a = ap.parse_args()

    api = API(a.base, usar_cache=not a.sem_cache)
    print(f"Ipeadata: {api.base}")
    nivel = nivel_municipal(api)
    print(f"  os sete municípios estão em Territorios (nível '{nivel}'; código {'como texto' if api.aspas else 'como número'})")

    metas = metadados(api)
    nomes_tema = temas(api)
    print(f"  {len(metas)} séries no catálogo")

    metodo = a.metodo
    dados = None
    if metodo in ("auto", "municipio"):
        try:
            dados = valores_por_municipio(api, nivel)
            metodo = "municipio"
        except ErroAPI as e:
            if a.metodo == "municipio" or e.status is None:
                raise
            print(f"  a tabela Valores não aceitou o filtro por município (HTTP {e.status}); indo série a série")
    if dados is None:
        dados = valores_por_serie(api, nivel, metas)
        metodo = "serie"
    print(f"  {len(dados)} séries com valor para algum dos sete municípios")

    incluir, excluir = set(lista(a.incluir)), set(lista(a.excluir))
    temas_q = [sem_acento(t) for t in lista(a.temas)]
    faltam = incluir - set(dados)
    if faltam:
        print(f"  atenção: sem valor dos sete municípios nas séries pedidas: {', '.join(sorted(faltam))}")

    series, inventario, usados = [], [], set()
    motivos: Counter = Counter()
    for cod_serie in sorted(dados):
        m = metas.get(cod_serie)
        tema = (m or {}).get("TEMNOME") or nomes_tema.get(str((m or {}).get("TEMCODIGO", "")), "")
        r, motivo = avalia(cod_serie, dados[cod_serie], m, a.ano_minimo)
        if r and incluir and cod_serie not in incluir:
            r, motivo = None, "fora de --incluir"
        if r and cod_serie in excluir:
            r, motivo = None, "em --excluir"
        if r and temas_q and not any(t in sem_acento(tema) for t in temas_q):
            r, motivo = None, "fora de --temas"
        motivos[motivo if r is None else "entrou"] += 1
        anos_todos = sorted({int(d[:4]) for obs in dados[cod_serie].values() for d, v in obs if v is not None})
        inventario.append({
            "codigo": cod_serie, "serie": (m or {}).get("SERNOME", ""), "tema": tema,
            "fonte": (m or {}).get("FNTSIGLA") or (m or {}).get("FNTNOME") or "",
            "frequencia": (m or {}).get("PERNOME", ""),
            "unidade": " ".join(x for x in ((m or {}).get("UNINOME"), (m or {}).get("MULNOME")) if x),
            "anos_com_dado": f"{anos_todos[0]}-{anos_todos[-1]}" if anos_todos else "",
            "ano_no_atlas": r["ano"] if r else "", "entrou": "sim" if r else "não",
            "motivo": "" if r else motivo})
        if not r:
            continue
        series.append({
            "cod": cod_serie, "id": id_atlas(cod_serie, usados), "nome": texto_limpo(m.get("SERNOME"), 200),
            "tema": tema, "grande_tema": m.get("BASNOME") or "",
            "fonte": m.get("FNTSIGLA") or "", "fonte_nome": texto_limpo(m.get("FNTNOME"), 200),
            "fonte_url": m.get("FNTURL") or "", "unidade": m.get("UNINOME") or "", "mult": m.get("MULNOME") or "",
            "freq": m.get("PERNOME") or "", "atualizada": str(m.get("SERATUALIZACAO") or "")[:10],
            "status": m.get("SERSTATUS") or "", "obs": texto_limpo(m.get("SERCOMENTARIO")), **r})
    series.sort(key=lambda s: (sem_acento(s["tema"]), sem_acento(s["nome"])))

    saida = {
        "gerado_em": date.today().isoformat(), "api": api.base, "metodo": metodo, "nivel": nivel,
        "ano_minimo": a.ano_minimo, "municipios": COD,
        "filtros": {"temas": lista(a.temas), "incluir": sorted(incluir), "excluir": sorted(excluir)},
        "conferencia": {"series_com_dado": len(dados), "series_no_atlas": len(series),
                        "fora": {k: v for k, v in motivos.items() if k != "entrou"}},
        "series": series,
    }
    texto = ("// Gerado por extracao/7_ipeadata.py em " + datetime.now().strftime("%Y-%m-%d %H:%M")
             + ". Não edite à mão: rode o script de novo.\n"
             + "window.ATLAS_IPEADATA=" + json.dumps(saida, ensure_ascii=False, separators=(",", ":")) + ";\n")
    SAIDA.write_text(texto, encoding="utf-8")

    PASTA.mkdir(parents=True, exist_ok=True)
    inv = PASTA / "inventario.csv"
    with inv.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=list(inventario[0]) if inventario else ["codigo"], delimiter=";")
        w.writeheader()
        w.writerows(sorted(inventario, key=lambda r: (r["entrou"] != "sim", sem_acento(r["tema"]), sem_acento(r["serie"]))))

    kb = len(texto.encode()) / 1024
    print(f"\nGravado {SAIDA.relative_to(RAIZ)}: {len(series)} séries, {kb:.0f} KB")
    for motivo, n in motivos.most_common():
        if motivo != "entrou":
            print(f"  fora: {n} — {motivo}")
    print(f"Inventário de todas as séries, com o motivo das que ficaram de fora: {inv.relative_to(RAIZ)}")
    print(f"Consultas à API: {api.consultas}; respostas do cache: {api.do_cache}")
    if kb > AVISO_TAMANHO_KB:
        print(f"AVISO: o arquivo passou de {AVISO_TAMANHO_KB} KB. Use --temas ou --incluir para levar só o que interessa.")
    print("Depois: python3 build_single.py, para o atlas-rmpa.html levar estas séries.")


if __name__ == "__main__":
    try:
        main()
    except ErroAPI as e:
        sys.exit(f"Parou: {e}")
