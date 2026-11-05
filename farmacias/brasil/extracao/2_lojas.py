#!/usr/bin/env python3
"""Lojas das três redes no Brasil: Panvel, Raia Drogasil e Pague Menos (com a Extrafarma).

    python3 extracao/2_lojas.py

Fonte: CNES/DATASUS, competência de abril de 2026, na forma que o IPEA publica para o
pacote geobr (healthfacilities_202604.parquet, release v2.0.0 do repositório
ipea/geobr_prep_data no GitHub), com as coordenadas do próprio CNES e as do
geocodebr (IPEA), que localiza o endereço no Cadastro Nacional de Endereços do
Censo 2022.

Loja = estabelecimento ativo no CNES (sem motivo de desativação), registrado como
farmácia (tipo 43), com o CNPJ de uma destas empresas (raiz, os 8 primeiros dígitos):

- Panvel: Dimed S/A Distribuidora de Medicamentos (92.665.611);
- Raia Drogasil: Raia Drogasil S.A. (61.585.865), das marcas Droga Raia e Drogasil;
- Pague Menos: Empreendimentos Pague Menos S.A. (06.626.253) e Imifarma Produtos
  Farmacêuticos e Cosméticos S.A. (04.899.316), a empresa da Extrafarma, comprada
  pela Pague Menos em 2022.

Os outros tipos dessas empresas (clínica, consultório, centro de imunização, central
de abastecimento, laboratório) não são loja: ficam de fora e entram na conferência.
Farmácia precisa de registro no CNES quando oferece serviço de saúde; uma loja aberta
depois da competência, ou sem registro, não aparece. Por isso o número pode ser
diferente do que a empresa divulga.

Marca: lida no nome fantasia do CNES, por regra fixa. "RAIA" sem "DROGASIL" é Droga
Raia; "DROGASIL" (com as grafias erradas que aparecem no cadastro) sem "RAIA" é
Drogasil; "PAGUE MENOS" é Pague Menos; "EXTRAFARMA" ou "EXTRA FARMA" é Extrafarma.
Quando o nome fantasia é o nome da empresa ("RAIA DROGASIL S A", "IMIFARMA"), um
código de loja ou fica vazio, a marca fica "não identificada no CNES". A Dimed só
tem a marca Panvel.

Coordenada (a regra do Atlas Porto Alegre, mais estrita que a do geobr, porque o
entorno usa raios de 500 m, com uma conferência a mais: o ponto tem de cair, na
malha de setores do Censo 2022, no município do endereço do CNES):
1. o geocodebr achou o número do endereço (precisão "numero" ou
   "numero_aproximado", desvio de até 50 m): ponto do endereço;
2. senão, a coordenada do CNES, se ela cai dentro da área do CEP do endereço
   (distância até o ponto do geocodebr menor que o desvio dele, quando esse desvio
   é de até 800 m) ou a até 150 m do ponto do geocodebr;
3. senão, o centro do CEP do endereço (geocodebr), se o desvio for de até 800 m;
4. senão, a coordenada do CNES, marcada como não confirmada;
5. se a coordenada do CNES cai no mar ou em outro município, ela contradiz o próprio
   cadastro: o ponto passa a ser o do geocodebr (centro do CEP, da localidade ou do
   município do endereço), marcado como aproximado, com o desvio em metros.

Registro repetido: duas lojas da mesma rede no mesmo endereço (com grafias
diferentes) ou a menos de 50 m uma da outra continuam no Atlas, com aviso: pode ser
outra loja ou o mesmo ponto com dois registros. Loja posta no centro do CEP não
entra na conta dos 50 m: o centro do CEP não diz onde ela fica dentro dele.

Cada loja leva o setor, o município e o bairro em que o ponto cai.

Confere e para se algo não bater: CNPJ repetido, loja sem município, sem coordenada
no município do endereço, empresa sem nenhuma loja.
Grava extracao/fontes/intermediario/lojas.json.
"""

from __future__ import annotations

import json
import math
import pathlib
import re
import sqlite3
import sys
import time
import unicodedata
import urllib.request
from collections import Counter, defaultdict

import numpy as np
import pyarrow.dataset as ds
import shapely
from scipy.spatial import cKDTree

RAIZ = pathlib.Path(__file__).resolve().parent.parent          # farmacias/brasil/
FONTES = RAIZ / "extracao" / "fontes"
INTER = FONTES / "intermediario"
SAIDA = INTER / "lojas.json"
CNES = FONTES / "geobr_prep" / "healthfacilities_202604.parquet"
GEOBR = FONTES / "geobr"
URL_PREP = "https://github.com/ipea/geobr_prep_data/releases/download/v2.0.0/{}"
URL_GEOBR = "https://github.com/ipeaGIT/geobr/releases/download/v1.7.0/{}"
COMPETENCIA = "202604"
RAIO_TERRA_M = 6371008.8
TIPO_FARMACIA = 43

# rede: (nome, empresas: {raiz do CNPJ: razão social})
REDES = {
    "panvel": ("Panvel", {"92665611": "Dimed S/A Distribuidora de Medicamentos"}),
    "rd": ("Raia Drogasil", {"61585865": "Raia Drogasil S.A."}),
    "pm": ("Pague Menos", {"06626253": "Empreendimentos Pague Menos S.A.",
                           "04899316": "Imifarma Produtos Farmacêuticos e Cosméticos S.A. (Extrafarma)"}),
}
EMPRESA = {raiz: rede for rede, (_, emp) in REDES.items() for raiz in emp}
MARCAS = ["Panvel", "Droga Raia", "Drogasil", "Pague Menos", "Extrafarma", "não identificada no CNES"]
RE_RAIA = re.compile(r"RAIA")
RE_DROGASIL = re.compile(r"DROGR?ASIL|DOGRASIL|DROGSIL|DROSAGIL")
RE_PAGUE = re.compile(r"PAGUE MENOS|PAQUE MENOS")
RE_EXTRA = re.compile(r"EXTRA ?FARMA")
UFS = [11, 12, 13, 14, 15, 16, 17, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31, 32, 33, 35, 41, 42, 43, 50, 51, 52, 53]
PEQUENAS = {"de", "da", "do", "das", "dos", "e"}


class Falha(Exception):
    pass


def baixa(url: str, arq: pathlib.Path) -> pathlib.Path:
    if arq.exists() and arq.stat().st_size > 0:
        return arq
    arq.parent.mkdir(parents=True, exist_ok=True)
    parcial = arq.with_suffix(arq.suffix + ".parcial")
    for espera in (0, 2, 4, 8, 16):
        time.sleep(espera)
        try:
            with urllib.request.urlopen(url, timeout=900) as r, open(parcial, "wb") as f:
                while True:
                    bloco = r.read(1 << 20)
                    if not bloco:
                        break
                    f.write(bloco)
            parcial.replace(arq)
            return arq
        except OSError as e:
            print(f"  falha ao baixar {arq.name}: {e}")
    raise Falha(f"não consegui baixar {url}")


def wkb_do_gpkg(blob: bytes) -> bytes:
    """GeoPackage guarda 'GP' + versão + flags + srs + envelope antes do WKB."""
    if blob[:2] != b"GP":
        raise Falha("geometria fora do padrão GeoPackage")
    tam = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}.get((blob[3] >> 1) & 7)
    if tam is None:
        raise Falha("envelope GeoPackage desconhecido")
    return blob[8 + tam:]


def setores_dos_pontos(pontos: dict) -> dict:
    """Setor (com município e bairro) em que cada ponto cai, pela malha do Censo 2022.

    pontos: {nome: [(lon, lat) ou None, ...]}. Ponto na divisa de dois setores fica no
    de menor código; ponto fora de todos (no mar, por exemplo) fica None."""
    arr = {k: shapely.points([p if p else (0.0, 0.0) for p in v]) for k, v in pontos.items()}
    saida = {k: [None] * len(v) for k, v in pontos.items()}
    for cod_uf in UFS:
        nome = f"{cod_uf}census_tract_2022.gpkg"
        arq = baixa(URL_GEOBR.format(nome), GEOBR / nome)
        con = sqlite3.connect(f"file:{arq}?mode=ro", uri=True)
        tabela, srs = con.execute("select table_name, srs_id from gpkg_contents where data_type='features'").fetchone()
        if srs != 4674:
            raise Falha(f"{arq.name}: sistema de coordenadas {srs}, esperado SIRGAS 2000 (4674)")
        geoms, info = [], []
        for blob, ct, cm, cb in con.execute(f"select geom, code_tract, code_muni, code_neighborhood from '{tabela}'"):
            if cm is None:                      # Lagoa Mirim e Lagoa dos Patos: setores sem município
                continue
            g = shapely.from_wkb(wkb_do_gpkg(blob))
            if not g.is_valid:
                g = shapely.make_valid(g)
            geoms.append(g)
            info.append((int(ct), int(cm), None if cb is None else int(cb)))
        con.close()
        arvore = shapely.STRtree(geoms)
        for k, pts in arr.items():
            i_pt, i_g = arvore.query(pts, predicate="intersects")
            for a, b in zip(i_pt.tolist(), i_g.tolist()):
                if pontos[k][a] is None:
                    continue
                if saida[k][a] is None or info[b][0] < saida[k][a][0]:
                    saida[k][a] = info[b]
    return saida


def distancia_m(lat1, lon1, lat2, lon2) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    h = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2
    return 2 * RAIO_TERRA_M * math.asin(math.sqrt(h))


def titulo(s: str | None) -> str:
    if not s:
        return ""
    palavras = re.sub(r"\s+", " ", str(s).strip()).lower().split(" ")
    return " ".join(p if (i and p in PEQUENAS) else p[:1].upper() + p[1:] for i, p in enumerate(palavras))


def sem_acento(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def chave_endereco(e: str) -> str:
    """Endereço sem acento, tipo de via, títulos e preposições: 'Av Dr X, 12' = 'Doutor X, 12'."""
    s = sem_acento(e).lower()
    s = re.sub(r"\b(rua|r|av|avenida|al|alameda|ac|acesso|estrada|estr|rod|rodovia|tv|travessa|praca|pc|dr|doutor|"
               r"prof|professor|cel|coronel|gen|general|de|da|do|dos|das|e)\b", " ", s)
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def ok(v) -> bool:
    return v is not None and not (isinstance(v, float) and math.isnan(v))


def ponto_cnes(r: dict):
    return (r["lon_cnes"], r["lat_cnes"]) if ok(r["lat_cnes"]) and ok(r["lon_cnes"]) else None


def ponto_geocodebr(r: dict):
    return (r["lon_geocodebr"], r["lat_geocodebr"]) if ok(r["lat_geocodebr"]) and ok(r["lon_geocodebr"]) else None


def coordenada_loja(r: dict, no_mun_c: bool, no_mun_g: bool) -> tuple[float, float, str, int | None, float | None, str]:
    """(lon, lat, classe, incerteza em m, distância CNES × geocodebr em m, ponto usado).

    no_mun_c / no_mun_g: a coordenada do CNES / o ponto do geocodebr cai no município
    do endereço."""
    pc, pg = ponto_cnes(r), ponto_geocodebr(r)
    prec, desvio = r["precisao_geocodebr"], r["desvio_metros_geocodebr"]
    d = distancia_m(pc[1], pc[0], pg[1], pg[0]) if pc and pg else None
    if pg and no_mun_g and prec in ("numero", "numero_aproximado") and ok(desvio) and desvio <= 50:
        return pg[0], pg[1], "endereco", int(desvio), d, "geocodebr"
    # um CEP espalhado por mais de 800 m não confirma nada; perto do ponto dele (150 m), confirma
    if pc and pg and no_mun_c and ok(desvio) and (d <= 150 or (desvio <= 800 and d <= desvio)):
        return pc[0], pc[1], "cnes_no_cep", int(min(max(desvio, 150), 800)), d, "cnes"
    if pg and no_mun_g and ok(desvio) and desvio <= 800:
        return pg[0], pg[1], "centro_cep", int(desvio), d, "geocodebr"
    if pc and no_mun_c:
        return pc[0], pc[1], "cnes_sem_confirmacao", None, d, "cnes"
    # a coordenada do CNES cai no mar ou em outro município: contradiz o próprio cadastro
    if pg and no_mun_g:
        return pg[0], pg[1], "aproximada", int(desvio) if ok(desvio) else None, d, "geocodebr"
    raise Falha(f"loja {r['co_cnes']} sem coordenada no município do endereço ({r['code_muni']})")


def marca(rede: str, raiz: str, fantasia: str) -> str:
    f = sem_acento(fantasia).upper()
    if rede == "panvel":
        return "Panvel"
    if rede == "rd":
        raia, dsil = bool(RE_RAIA.search(f)), bool(RE_DROGASIL.search(f))
        if raia and not dsil:
            return "Droga Raia"
        if dsil and not raia:
            return "Drogasil"
        return "não identificada no CNES"
    pague, extra = bool(RE_PAGUE.search(f)), bool(RE_EXTRA.search(f))
    if pague and not extra:
        return "Pague Menos"
    if extra and not pague:
        return "Extrafarma"
    return "não identificada no CNES"


def xyz(lon, lat) -> np.ndarray:
    lo, la = np.radians(np.asarray(lon, dtype=float)), np.radians(np.asarray(lat, dtype=float))
    return np.column_stack([np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)])


def main() -> int:
    conf = {}
    tab = ds.dataset(baixa(URL_PREP.format(CNES.name), CNES), format="parquet").to_table(
        columns=["code_muni", "code_state", "abbrev_state", "co_cnes", "nu_cnpj", "no_fantasia", "no_razao_social",
                 "logradouro", "numero_endereco", "bairro", "cep", "tp_unidade", "co_motivo_desab", "lat_cnes",
                 "lon_cnes", "lat_geocodebr", "lon_geocodebr", "precisao_geocodebr", "desvio_metros_geocodebr",
                 "to_char_dt_atualizacao_dd_mm_yyyy"]).to_pylist()
    conf["cnes_estabelecimentos"] = len(tab)

    das_empresas = [r for r in tab if (r["nu_cnpj"] or "")[:8] in EMPRESA]
    conf["empresas"] = {}
    for raiz, rede in EMPRESA.items():
        rs = [r for r in das_empresas if r["nu_cnpj"][:8] == raiz]
        at = [r for r in rs if r["co_motivo_desab"] is None]
        conf["empresas"][raiz] = {
            "rede": REDES[rede][0], "empresa": REDES[rede][1][raiz], "registros": len(rs), "ativos": len(at),
            "ativos_farmacia": sum(1 for r in at if r["tp_unidade"] == TIPO_FARMACIA),
            "ativos_outros_tipos": dict(sorted(Counter(int(r["tp_unidade"]) for r in at
                                                       if r["tp_unidade"] != TIPO_FARMACIA).items())),
            "desativados_farmacia": sum(1 for r in rs if r["co_motivo_desab"] is not None
                                        and r["tp_unidade"] == TIPO_FARMACIA)}
        if not conf["empresas"][raiz]["ativos_farmacia"]:
            raise Falha(f"nenhuma farmácia ativa com a raiz de CNPJ {raiz}: a fonte mudou?")

    regs = [r for r in das_empresas if r["co_motivo_desab"] is None and r["tp_unidade"] == TIPO_FARMACIA]
    for r in regs:
        if not ok(r["code_muni"]):
            raise Falha(f"loja {r['co_cnes']} sem município no CNES")
    # em que setor (e município) caem a coordenada do CNES e o ponto do geocodebr
    st = setores_dos_pontos({"cnes": [ponto_cnes(r) for r in regs], "geo": [ponto_geocodebr(r) for r in regs]})
    lojas = []
    for r, sc, sg in zip(regs, st["cnes"], st["geo"]):
        raiz = r["nu_cnpj"][:8]
        rede = EMPRESA[raiz]
        cm = int(r["code_muni"])
        x, y, classe, incerteza, d, usado = coordenada_loja(r, bool(sc and sc[1] == cm), bool(sg and sg[1] == cm))
        setor = sc if usado == "cnes" else sg
        num = str(r["numero_endereco"] or "").strip()
        fantasia = re.sub(r"\s+", " ", (r["no_fantasia"] or "").strip())
        lojas.append({
            "cnes": r["co_cnes"], "cnpj": r["nu_cnpj"], "rede": rede, "marca": marca(rede, raiz, fantasia),
            "fantasia": fantasia, "empresa": raiz,
            "end": titulo(r["logradouro"]) + (f", {num}" if num else ""),
            "bairro_cnes": titulo(r["bairro"]), "cep": f"{int(r['cep']):08d}" if ok(r["cep"]) else None,
            "mun": int(r["code_muni"]), "uf": int(r["code_state"]),
            "x": round(x, 6), "y": round(y, 6), "classe": classe,
            "incerteza_m": incerteza, "dist_cnes_geocodebr_m": None if d is None else round(d),
            "precisao_geocodebr": r["precisao_geocodebr"],
            "setor": setor[0], "bai": setor[2],
            "cnes_fora_do_municipio": bool(ponto_cnes(r)) and not (sc and sc[1] == cm),
            "atualizado": r["to_char_dt_atualizacao_dd_mm_yyyy"],
        })
        if setor[1] != cm:
            raise Falha(f"loja {r['co_cnes']}: ponto fora do município do endereço")
    rep = [c for c, k in Counter(l["cnpj"] for l in lojas).items() if k > 1]
    if rep:
        raise Falha(f"CNPJ repetido entre as lojas: {rep[:5]}")
    rep = [c for c, k in Counter(l["cnes"] for l in lojas).items() if k > 1]
    if rep:
        raise Falha(f"código CNES repetido entre as lojas: {rep[:5]}")
    if any(l["mun"] // 100000 != l["uf"] for l in lojas):
        raise Falha("loja com município de outra UF")
    lojas.sort(key=lambda l: (l["mun"], sem_acento(l["end"]).lower(), l["cnes"]))

    # mesmo endereço (com grafias diferentes) na mesma rede e no mesmo município, ou a menos de 50 m
    por_end = defaultdict(list)
    for l in lojas:
        por_end[(l["rede"], l["mun"], chave_endereco(l["end"]))].append(l["cnes"])
    for l in lojas:
        l["mesmo_end"] = [c for c in por_end[(l["rede"], l["mun"], chave_endereco(l["end"]))] if c != l["cnes"]]
        l["perto_50m"] = []
    for rede in REDES:
        idx = [i for i, l in enumerate(lojas) if l["rede"] == rede]
        P = xyz([lojas[i]["x"] for i in idx], [lojas[i]["y"] for i in idx])
        corda = 2 * math.sin(60 / RAIO_TERRA_M / 2)          # folga: confere depois em 50 m exatos
        for a, b in sorted(cKDTree(P).query_pairs(corda)):
            la, lb = lojas[idx[a]], lojas[idx[b]]
            # o centro do CEP não diz onde a loja fica dentro dele: duas lojas no mesmo CEP
            # ficariam "a 0 m" sem que isso diga nada
            if {"centro_cep", "aproximada"} & {la["classe"], lb["classe"]}:
                continue
            if distancia_m(la["y"], la["x"], lb["y"], lb["x"]) < 50:
                la["perto_50m"].append(lb["cnes"])
                lb["perto_50m"].append(la["cnes"])

    conf["lojas"] = len(lojas)
    conf["lojas_por_rede"] = {REDES[k][0]: sum(1 for l in lojas if l["rede"] == k) for k in REDES}
    conf["lojas_por_marca"] = {REDES[k][0]: dict(Counter(l["marca"] for l in lojas if l["rede"] == k).most_common())
                               for k in REDES}
    conf["lojas_por_uf"] = {REDES[k][0]: dict(sorted(Counter(l["uf"] for l in lojas if l["rede"] == k).items()))
                            for k in REDES}
    conf["lojas_por_classe"] = dict(Counter(l["classe"] for l in lojas).most_common())
    conf["lojas_coordenada_cnes_fora_do_municipio"] = sum(1 for l in lojas if l["cnes_fora_do_municipio"])
    conf["lojas_aproximadas"] = [{"cnes": l["cnes"], "mun": l["mun"], "end": l["end"], "desvio_m": l["incerteza_m"],
                                  "precisao": l["precisao_geocodebr"]} for l in lojas if l["classe"] == "aproximada"]
    conf["lojas_em_bairro"] = sum(1 for l in lojas if l["bai"])
    conf["lojas_mesmo_endereco"] = sum(1 for l in lojas if l["mesmo_end"])
    conf["lojas_a_menos_de_50m"] = sum(1 for l in lojas if l["perto_50m"])
    conf["municipios_com_loja"] = len({l["mun"] for l in lojas})

    saida = {"lojas": lojas, "redes": {k: {"nome": n, "empresas": e} for k, (n, e) in REDES.items()},
             "marcas": MARCAS, "fonte": "CNES/DATASUS via geobr (IPEA)", "competencia": COMPETENCIA,
             "tipo": {"cod": TIPO_FARMACIA, "nome": "Farmácia"}, "conferencia": conf}
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(saida, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(json.dumps(conf, ensure_ascii=False, indent=1))
    print(f"gravado {SAIDA} ({SAIDA.stat().st_size / 1e6:.2f} MB)")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Falha as e:
        print(f"PAROU: {e}", file=sys.stderr)
        sys.exit(1)
