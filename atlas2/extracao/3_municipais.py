#!/usr/bin/env python3
"""Indicadores municipais do Atlas 2.0, para os 5.570 municípios do Brasil.

    python3 extracao/3_municipais.py

Lê as tabelas gratuitas do espelho público da Base dos Dados (basedosdados.org),
que republica as bases oficiais sem alterar os valores:

    https://storage.googleapis.com/basedosdados-public/one-click-download/<base>/<tabela>/<tabela>.csv.gz

Os arquivos com sufixo "_bdpro" pertencem ao plano pago e nunca são baixados.

O que entra (o ano mais recente publicado e, quando há, a série):
- Atlas do Desenvolvimento Humano no Brasil (PNUD, IPEA e FJP): IDHM e
  indicadores dos Censos de 1991, 2000 e 2010 (mundo_onu_adh), com os valores
  oficiais de UF e Brasil para comparar;
- PIB dos Municípios (IBGE), 2002 a 2021, e população estimada (IBGE), para o
  PIB per capita do mesmo ano;
- IDEB (INEP) da rede pública, 2005 a 2023, com os valores oficiais de UF,
  região e Brasil;
- SNIS (Ministério das Cidades): atendimento de água e esgoto, coleta e perdas;
- PNI (Ministério da Saúde): cobertura vacinal;
- Anatel: densidade de banda larga fixa e de telefonia móvel;
- Fundação Abrinq: matrícula na pré-escola;
- ANA, Atlas Esgotos (2013).

Regras: não estima, não interpola, não completa município faltante. Um
município sem valor na fonte fica sem valor. Se faltar uma coluna esperada ou
um valor sair da faixa possível, a execução para.

Grava extracao/fontes/intermediario/municipais.json, que o 4_monta.py lê.
"""

from __future__ import annotations

import csv
import gzip
import json
import pathlib
import sys
import time
import urllib.request
from collections import defaultdict

RAIZ = pathlib.Path(__file__).resolve().parent.parent
BD = RAIZ / "extracao" / "fontes" / "basedosdados"
SAIDA = RAIZ / "extracao" / "fontes" / "intermediario" / "municipais.json"
BUCKET = "https://storage.googleapis.com/basedosdados-public/one-click-download"

UF_SIGLA = {11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO",
            21: "MA", 22: "PI", 23: "CE", 24: "RN", 25: "PB", 26: "PE", 27: "AL", 28: "SE", 29: "BA",
            31: "MG", 32: "ES", 33: "RJ", 35: "SP", 41: "PR", 42: "SC", 43: "RS",
            50: "MS", 51: "MT", 52: "GO", 53: "DF"}
SIGLA_UF = {v: k for k, v in UF_SIGLA.items()}
REGIAO_NOME = {"Norte": 1, "Nordeste": 2, "Sudeste": 3, "Sul": 4, "Centro-Oeste": 5}


class Falha(Exception):
    pass


def baixa(base: str, tabela: str) -> pathlib.Path:
    if tabela.endswith("_bdpro"):
        raise Falha("arquivo do plano pago da Base dos Dados: não é usado")
    destino = BD / f"{base}__{tabela}.csv.gz"
    if destino.exists() and destino.stat().st_size > 0:
        return destino
    BD.mkdir(parents=True, exist_ok=True)
    url = f"{BUCKET}/{base}/{tabela}/{tabela}.csv.gz"
    parcial = destino.with_suffix(".parcial")
    for espera in (0, 2, 4, 8, 16):
        time.sleep(espera)
        try:
            with urllib.request.urlopen(url, timeout=600) as r, open(parcial, "wb") as f:
                f.write(r.read())
            parcial.replace(destino)
            return destino
        except OSError as e:
            print(f"  falha ao baixar {url}: {e}")
    raise Falha(f"não consegui baixar {url}")


def linhas(base: str, tabela: str):
    with gzip.open(baixa(base, tabela), "rt", encoding="utf-8", newline="") as f:
        yield from csv.DictReader(f)


def num(v):
    if v is None or v == "":
        return None
    try:
        return float(v)
    except ValueError:
        return None


ADH_NOTA = "Atlas do Desenvolvimento Humano no Brasil (PNUD, IPEA e FJP), a partir dos Censos de 1991, 2000 e 2010."

# id, coluna do Atlas Brasil, faixa possível
ADH = [
    ("idhm", "idhm", (0, 1)), ("idhm_r", "idhm_r", (0, 1)), ("idhm_l", "idhm_l", (0, 1)),
    ("idhm_e", "idhm_e", (0, 1)),
    ("adh_espvida", "expectativa_vida", (40, 90)), ("adh_mort1", "mortalidade_1", (0, 200)),
    ("adh_fecund", "fecundidade_total", (0.5, 10)),
    ("adh_renda_pc", "renda_pc", (0, 10000)), ("adh_gini", "indice_gini", (0, 1)),
    ("adh_ext_pobres", "prop_pobreza_extrema", (0, 100)), ("adh_pobres", "prop_pobreza", (0, 100)),
    ("adh_vulner", "prop_vulner_pobreza", (0, 100)),
    ("adh_analf15", "taxa_analfabetismo_15_mais", (0, 100)), ("adh_fund18", "taxa_fundamental_18_mais", (0, 100)),
    ("adh_medio18", "taxa_medio_18_mais", (0, 100)), ("adh_sup25", "taxa_superior_25_mais", (0, 100)),
    ("adh_anos_estudo", "expectativa_anos_estudo", (0, 20)),
    ("adh_fora_escola_6_14", "taxa_criancas_fora_escola_6_14", (0, 100)),
    ("adh_desocup18", "taxa_desocupacao_18_mais", (0, 100)), ("adh_formal", "prop_ocupados_formalizacao", (0, 100)),
    ("adh_ativ18", "taxa_atividade_18_mais", (0, 100)), ("adh_renda_ocup", "renda_media_ocupados", (0, 20000)),
    ("adh_nemnem", "taxa_nest_ntrab_vulner_15_24", (0, 100)),
    ("adh_maes_chefes", "taxa_mulheres_chefe_filho_15m", (0, 100)),
    ("adh_desloc_1h", "taxa_vulner_desloc_1_hora", (0, 100)),
    ("adh_agua_esgoto_inad", "taxa_agua_esgoto_inadequados", (0, 100)),
    ("adh_coleta_lixo", "taxa_coleta_lixo", (0, 100)), ("adh_energia", "taxa_energia_eletrica", (0, 100)),
    ("adh_pop", "populacao", (0, 2e7)),
]

SNIS = [("snis_agua", "indice_atendimento_total_agua"), ("snis_esgoto", "indice_atendimento_esgoto_agua"),
        ("snis_coleta", "indice_coleta_esgoto"), ("snis_perdas", "indice_perda_distribuicao_agua")]
PNI = [("vac_penta", "cobertura_penta"), ("vac_polio", "cobertura_poliomielite"),
       ("vac_triplice_d1", "cobertura_triplice_viral_d1"), ("vac_bcg", "cobertura_bcg")]
# séries: anos mais antigos de algumas fontes têm cobertura irregular (a 3.7 usou os mesmos cortes)
ANO_MIN = {"pni": 2012, "snis": 2013}

IDEB = [("ideb_ai", "fundamental", "iniciais (1-5)"), ("ideb_af", "fundamental", "finais (6-9)"),
        ("ideb_em", "medio", "todos (1-4)")]


def main() -> int:
    conf = {}
    dir_mun = {int(r["id_municipio"]): r for r in linhas("br_bd_diretorios_brasil", "municipio")}
    if len(dir_mun) != 5570:
        raise Falha(f"diretório de municípios com {len(dir_mun)} linhas")
    ids = sorted(dir_mun)
    pos = {c: i for i, c in enumerate(ids)}
    uf_de = {c: int(dir_mun[c]["id_uf"]) for c in ids}
    reg_de = {c: REGIAO_NOME[dir_mun[c]["nome_regiao"]] for c in ids}
    ind = {}

    def novo(i: str) -> dict:
        ind[i] = {"anos": [], "v": {}, "uf": {}, "reg": {}, "br": {}}
        return ind[i]

    def poe(i: str, ano: int, cod: int, valor, faixa=None):
        if valor is None or cod not in pos:
            return
        if faixa and not (faixa[0] <= valor <= faixa[1]):
            raise Falha(f"{i} {ano} município {cod}: valor {valor} fora da faixa {faixa}")
        d = ind[i]
        a = str(ano)
        if a not in d["v"]:
            d["v"][a] = [None] * len(ids)
            d["anos"].append(ano)
        d["v"][a][pos[cod]] = valor

    # ── Atlas do Desenvolvimento Humano ─────────────────────────────────────
    for i, _, _ in ADH:
        novo(i)
    for r in linhas("mundo_onu_adh", "municipio"):
        for i, c, faixa in ADH:
            if c not in r:
                raise Falha(f"Atlas Brasil: coluna {c} não existe")
            poe(i, int(r["ano"]), int(r["id_municipio"]), num(r[c]), faixa)
    for r in linhas("mundo_onu_adh", "uf"):
        for i, c, _ in ADH:
            v = num(r[c])
            if v is not None:
                ind[i]["uf"].setdefault(r["ano"], {})[str(SIGLA_UF[r["sigla_uf"]])] = v
    for r in linhas("mundo_onu_adh", "brasil"):
        for i, c, _ in ADH:
            v = num(r[c])
            if v is not None:
                ind[i]["br"][r["ano"]] = v
    conf["atlas_brasil_municipios_2010"] = sum(1 for v in ind["idhm"]["v"]["2010"] if v is not None)

    # ── PIB e população estimada ────────────────────────────────────────────
    pop_est = defaultdict(dict)
    for r in linhas("br_ibge_populacao", "municipio"):
        v = num(r["populacao"])
        if v is not None:
            pop_est[int(r["ano"])][int(r["id_municipio"])] = v
    for i in ("pib", "pib_pc", "va_agro", "va_ind", "va_serv", "va_adm", "pop_est"):
        novo(i)
    pib = defaultdict(dict)
    for r in linhas("br_ibge_pib", "municipio"):
        a, c = int(r["ano"]), int(r["id_municipio"])
        p, va = num(r["pib"]), num(r["va"])
        if p is None:
            continue
        pib[a][c] = (p, va, num(r["va_agropecuaria"]), num(r["va_industria"]), num(r["va_servicos"]),
                     num(r["va_adespss"]))
    for a in sorted(pib):
        for c, (p, va, agro, ind_, serv, adm) in pib[a].items():
            poe("pib", a, c, p)
            pe = pop_est.get(a, {}).get(c)
            if pe:
                poe("pib_pc", a, c, round(p / pe, 2), (-1e7, 1e7))   # há PIB negativo publicado (petróleo)
            if va and va > 0:
                for k, x in (("va_agro", agro), ("va_ind", ind_), ("va_serv", serv), ("va_adm", adm)):
                    if x is not None:
                        poe(k, a, c, round(100 * x / va, 2), (-1000, 1000))   # o IBGE publica VA negativo em alguns municípios
        # UF, região e Brasil: soma dos municípios (o PIB dos municípios soma o da UF)
        for nv, chave in (("uf", uf_de), ("reg", reg_de)):
            som, spop = defaultdict(float), defaultdict(float)
            for c, (p, *_) in pib[a].items():
                som[chave[c]] += p
                pe = pop_est.get(a, {}).get(c)
                spop[chave[c]] += pe or 0
            ind["pib"][nv][str(a)] = {str(k): v for k, v in som.items()}
            ind["pib_pc"][nv][str(a)] = {str(k): round(som[k] / spop[k], 2) for k in som if spop[k]}
        tot = sum(p for p, *_ in pib[a].values())
        tpop = sum(pop_est.get(a, {}).get(c, 0) for c in pib[a])
        ind["pib"]["br"][str(a)] = tot
        if tpop:
            ind["pib_pc"]["br"][str(a)] = round(tot / tpop, 2)
    for a in sorted(pop_est):
        for c, v in pop_est[a].items():
            poe("pop_est", a, c, v)
    conf["pib_ano"] = max(pib)
    conf["pib_municipios"] = len(pib[max(pib)])
    conf["pib_brasil_ultimo_ano"] = ind["pib"]["br"][str(max(pib))]

    # ── IDEB, rede pública ──────────────────────────────────────────────────
    for i, *_ in IDEB:
        novo(i)
    for r in linhas("br_inep_ideb", "municipio"):
        if r["rede"] != "publica":
            continue
        for i, ens, anos in IDEB:
            if r["ensino"] == ens and r["anos_escolares"] == anos:
                poe(i, int(r["ano"]), int(r["id_municipio"]), num(r["ideb"]), (0, 10))
    for tab, nv, chave in (("uf", "uf", "sigla_uf"), ("regiao", "reg", "regiao"), ("brasil", "br", None)):
        for r in linhas("br_inep_ideb", tab):
            if r["rede"] != "publica":
                continue
            v = num(r["ideb"])
            if v is None:
                continue
            for i, ens, anos in IDEB:
                if r["ensino"] == ens and r["anos_escolares"] == anos:
                    if nv == "br":
                        ind[i]["br"][r["ano"]] = v
                    else:
                        k = SIGLA_UF[r[chave]] if nv == "uf" else REGIAO_NOME.get(r[chave])
                        if k is None:
                            raise Falha(f"IDEB: região {r[chave]} desconhecida")
                        ind[i][nv].setdefault(r["ano"], {})[str(k)] = v

    # ── SNIS, PNI, Anatel, Abrinq, ANA ──────────────────────────────────────
    for i, _ in SNIS + PNI:
        novo(i)
    fora_faixa = defaultdict(int)
    for r in linhas("br_mdr_snis", "municipio_agua_esgoto"):
        if int(r["ano"]) < ANO_MIN["snis"]:
            continue
        for i, c in SNIS:
            faixa = (-100, 100.5) if i == "snis_perdas" else (0, 100.5)
            v = num(r[c])
            if v is not None and not (faixa[0] <= v <= faixa[1]):
                fora_faixa[f"{i} {r['ano']}"] += 1   # valor impossível declarado ao SNIS: fica de fora
                continue
            poe(i, int(r["ano"]), int(r["id_municipio"]), v)
    conf["snis_valores_fora_da_faixa"] = dict(sorted(fora_faixa.items()))
    for r in linhas("br_ms_imunizacoes", "municipio"):
        if int(r["ano"]) < ANO_MIN["pni"]:
            continue
        for i, c in PNI:
            poe(i, int(r["ano"]), int(r["id_municipio"]), num(r[c]), (0, 100000))
    for i, tab in (("anatel_bl", "br_anatel_banda_larga_fixa"), ("anatel_movel", "br_anatel_telefonia_movel")):
        novo(i)
        ultimo = {}
        for r in linhas(tab, "densidade_municipio"):
            k = (int(r["ano"]), int(r["id_municipio"]))
            m = int(r["mes"])
            if k not in ultimo or m > ultimo[k][0]:
                ultimo[k] = (m, num(r["densidade"]))
        meses = defaultdict(set)
        for (a, c), (m, v) in ultimo.items():
            poe(i, a, c, v, (0, 1000))
            meses[a].add(m)
        conf[f"{i}_mes_por_ano"] = {str(a): sorted(ms) for a, ms in sorted(meses.items())}
    novo("abrinq_pre")
    for r in linhas("br_abrinq_oca", "municipio_primeira_infancia"):
        # passa de 100% quando a população estimada da idade é menor que a matriculada (limitação da fonte)
        poe("abrinq_pre", int(r["ano"]), int(r["id_municipio"]), num(r["taxa_liquida_matricula_pre_escola"]), (0, 1000))
    for i in ("ana_coleta_trat", "ana_sem_coleta"):
        novo(i)
    for r in linhas("br_ana_atlas_esgotos", "municipio"):
        c = int(r["id_municipio"])
        for i, col in (("ana_coleta_trat", "indice_atendimento_com_coleta_com_tratamento"),
                       ("ana_sem_coleta", "indice_sem_atendimento_sem_coleta_sem_tratamento")):
            v = num(r[col])
            if v is not None:
                if not 0 <= v <= 1:
                    raise Falha(f"ANA {col}: {v} fora de 0 a 1")
                poe(i, 2013, c, round(100 * v, 2))

    for i, d in ind.items():
        d["anos"].sort()
        conf.setdefault("cobertura_ultimo_ano", {})[i] = [d["anos"][-1] if d["anos"] else None,
                                                         sum(1 for v in d["v"][str(d["anos"][-1])] if v is not None) if d["anos"] else 0]
    saida = {"ids": ids, "uf": [uf_de[c] for c in ids], "ind": ind, "conferencia": conf}
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(saida, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(json.dumps(conf, ensure_ascii=False, indent=1))
    print(f"gravado {SAIDA} ({SAIDA.stat().st_size / 1e6:.1f} MB)")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Falha as e:
        print(f"PAROU: {e}", file=sys.stderr)
        sys.exit(1)
