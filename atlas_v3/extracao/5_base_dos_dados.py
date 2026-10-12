#!/usr/bin/env python3
"""Gera dados-complementares.js com dados do espelho público da Base dos Dados.

    python3 extracao/5_base_dos_dados.py

A Base dos Dados (basedosdados.org) republica bases oficiais sem alterar os
valores. Além do BigQuery, ela mantém um espelho público de arquivos CSV
("one-click download") num bucket do Google Cloud Storage, que não exige conta:

    https://storage.googleapis.com/basedosdados-public/one-click-download/<base>/<tabela>/<tabela>.csv.gz

Este script usa só os arquivos gratuitos desse espelho. Os arquivos com sufixo
"_bdpro" pertencem ao plano pago da Base dos Dados e nunca são baixados.

O que entra no Atlas:
- Atlas do Desenvolvimento Humano (PNUD/IPEA/FJP), base mundo_onu_adh.municipio:
  indicadores municipais de 2010 que não estavam no Atlas, como os jovens que
  não estudam nem trabalham e são vulneráveis à pobreza;
- IDEB/INEP 2023 por município, rede pública (br_inep_ideb.municipio);
- densidade de banda larga fixa da Anatel, último mês publicado no espelho
  gratuito (br_anatel_banda_larga_fixa.densidade_municipio);
- áreas de risco de desastre BATER (IBGE e CEMADEN, base 2010), no formato do
  geobr (br_geobr_mapas.area_risco_desastre).

O IDHM e seus componentes também vêm de mundo_onu_adh.municipio, mas seguem o
caminho dos índices sintéticos: este script deixa o arquivo em
extracao/fontes/ e o 4_indices_municipais.py o lê, conforme o indices.json.

O script NÃO estima, NÃO interpola e NÃO completa município faltante. Se faltar
um município, uma coluna ou um ano esperado, a execução para com erro.

Precisa de `pandas` e `shapely`.
"""

from __future__ import annotations

import datetime as dt
import json
import pathlib
import shutil
import sys
import urllib.request

import pandas as pd
from shapely import wkt
from shapely.geometry import MultiPolygon, Polygon

ROOT = pathlib.Path(__file__).resolve().parents[1]
DADOS = ROOT / "dados"
FONTES = ROOT / "extracao" / "fontes"

BUCKET = "https://storage.googleapis.com/basedosdados-public/one-click-download"

MUNICIPIOS = {
    "4314902": "Porto Alegre",
    "4304606": "Canoas",
    "4309209": "Gravataí",
    "4320008": "Sapucaia do Sul",
    "4303103": "Cachoeirinha",
    "4309308": "Guaíba",
    "4307708": "Esteio",
}

# (base, tabela) -> arquivo local em extracao/fontes/
TABELAS = {
    "adh": ("mundo_onu_adh", "municipio"),
    "ideb": ("br_inep_ideb", "municipio"),
    "anatel": ("br_anatel_banda_larga_fixa", "densidade_municipio"),
    "risco": ("br_geobr_mapas", "area_risco_desastre"),
}

# Atlas Brasil, Censo 2010. Nome no Atlas -> coluna da Base dos Dados.
# As definições seguem o glossário do Atlas Brasil (atlasbrasil.org.br).
ADH_2010 = {
    "adh_nemnem_vulner": "taxa_nest_ntrab_vulner_15_24",
    "adh_maes_chefes_sem_fund": "taxa_mulheres_chefe_filho_15m",
    "adh_desloc_1h_vulner": "taxa_vulner_desloc_1_hora",
    "adh_dep_idosos_vulner": "taxa_dom_vulner_dep_idoso",
    "adh_vulner_pobreza": "prop_vulner_pobreza",
    "adh_desocup_18_24": "taxa_desocupacao_18_24",
    "adh_creche_0_3": "taxa_freq_0_3",
    "adh_fora_escola_4_5": "taxa_criancas_fora_escola_4_5",
    "adh_maes_15_17": "taxa_mulheres_com_filho_15_17",
}

# IDEB, rede pública: (ensino, anos_escolares) -> nome no Atlas
IDEB = {
    ("fundamental", "iniciais (1-5)"): "ideb_iniciais",
    ("fundamental", "finais (6-9)"): "ideb_finais",
    ("medio", "todos (1-4)"): "ideb_medio",
}
IDEB_ANO = 2023

PREC = 100000  # mesma precisão das malhas do Atlas (dados-nucleo.js, "prec")


def url_de(chave: str) -> str:
    base, tabela = TABELAS[chave]
    return f"{BUCKET}/{base}/{tabela}/{tabela}.csv.gz"


def baixa(chave: str) -> pathlib.Path:
    base, tabela = TABELAS[chave]
    nome = f"{base}__{tabela}.csv.gz"
    destino = FONTES / "basedosdados" / nome
    if destino.exists() and destino.stat().st_size > 0:
        return destino
    destino.parent.mkdir(parents=True, exist_ok=True)
    url = url_de(chave)
    assert "_bdpro" not in url
    print(f"  ↓ {url}")
    tmp = destino.with_suffix(".parcial")
    with urllib.request.urlopen(url, timeout=600) as r, open(tmp, "wb") as f:
        shutil.copyfileobj(r, f)
    tmp.rename(destino)
    return destino


def le(chave: str, **kw) -> pd.DataFrame:
    df = pd.read_csv(baixa(chave), dtype=str, **kw)
    if "id_municipio" not in df.columns:
        sys.exit(f"✗ {chave}: a tabela não tem id_municipio. Colunas: {list(df.columns)}")
    return df[df["id_municipio"].isin(MUNICIPIOS)].copy()


def numero(v: object) -> float | None:
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return None
    s = str(v).strip()
    if s == "" or s.lower() in {"nan", "none", "inf", "-inf"}:
        return None
    return float(s)


def exige_todos(chave: str, achados: set[str]) -> None:
    faltam = [MUNICIPIOS[c] for c in MUNICIPIOS if c not in achados]
    if faltam:
        sys.exit(f"✗ {chave}: municípios ausentes na fonte: {faltam}")


# ------------------------------------------------------------------ Atlas Brasil
def atlas_brasil(saida: dict) -> dict:
    df = le("adh")
    df = df[df["ano"] == "2010"]
    exige_todos("adh", set(df["id_municipio"]))
    for campo, coluna in ADH_2010.items():
        if coluna not in df.columns:
            sys.exit(f"✗ adh: coluna {coluna} não existe. Colunas: {list(df.columns)}")
    for _, linha in df.iterrows():
        for campo, coluna in ADH_2010.items():
            v = numero(linha[coluna])
            if v is None:
                continue
            if not 0 <= v <= 100:
                sys.exit(f"✗ adh: {MUNICIPIOS[linha['id_municipio']]}/{coluna} = {v}, fora de 0–100")
            saida[linha["id_municipio"]][campo] = round(v, 2)
    print(f"  ✓ Atlas Brasil 2010: {len(ADH_2010)} indicadores × {len(df)} municípios")
    return {"fonte": "Atlas do Desenvolvimento Humano no Brasil (PNUD, IPEA, FJP)", "ano": 2010,
            "via": "Base dos Dados, mundo_onu_adh.municipio",
            "url": url_de("adh")}


# --------------------------------------------------------------------------- IDEB
def ideb(saida: dict) -> dict:
    df = le("ideb")
    df = df[(df["ano"] == str(IDEB_ANO)) & (df["rede"] == "publica")]
    achados = set()
    for (ensino, anos), campo in IDEB.items():
        sel = df[(df["ensino"] == ensino) & (df["anos_escolares"] == anos)]
        for _, linha in sel.iterrows():
            v = numero(linha["ideb"])
            if v is None:
                continue
            if not 0 <= v <= 10:
                sys.exit(f"✗ ideb: {linha['id_municipio']}/{campo} = {v}, fora de 0–10")
            cod = linha["id_municipio"]
            if campo in saida[cod]:
                sys.exit(f"✗ ideb: {MUNICIPIOS[cod]}/{campo} aparece duas vezes")
            saida[cod][campo] = v
            achados.add(cod)
    exige_todos("ideb", achados)
    print(f"  ✓ IDEB {IDEB_ANO}, rede pública: {sum(len([k for k in v if k.startswith('ideb_')]) for v in saida.values())} valores")
    return {"fonte": "INEP — Índice de Desenvolvimento da Educação Básica", "ano": IDEB_ANO,
            "via": "Base dos Dados, br_inep_ideb.municipio", "url": url_de("ideb")}


# ------------------------------------------------------------------------- Anatel
def anatel(saida: dict) -> dict:
    df = le("anatel")
    df["periodo"] = df["ano"].astype(int) * 100 + df["mes"].astype(int)
    ultimo = int(df["periodo"].max())
    df = df[df["periodo"] == ultimo]
    exige_todos("anatel", set(df["id_municipio"]))
    if df["id_municipio"].duplicated().any():
        sys.exit("✗ anatel: município repetido no mesmo mês")
    for _, linha in df.iterrows():
        v = numero(linha["densidade"])
        if v is None or not 0 <= v <= 100:
            sys.exit(f"✗ anatel: densidade inválida em {linha['id_municipio']}: {v}")
        saida[linha["id_municipio"]]["banda_larga_100hab"] = round(v, 2)
    ano, mes = divmod(ultimo, 100)
    print(f"  ✓ Anatel, banda larga fixa: {mes:02d}/{ano}")
    return {"fonte": "Anatel — Acessos de banda larga fixa (densidade por 100 habitantes)",
            "ano": ano, "mes": mes, "via": "Base dos Dados, br_anatel_banda_larga_fixa.densidade_municipio",
            "url": url_de("anatel")}


# ------------------------------------------------------------- áreas de risco
def zigzag(v: int) -> str:
    v = ~(v << 1) if v < 0 else v << 1
    out = []
    while v >= 0x20:
        out.append(chr((0x20 | (v & 0x1F)) + 63))
        v >>= 5
    out.append(chr(v + 63))
    return "".join(out)


def anel(coords) -> str:
    """Mesmo formato do decRing() do atlas.js: x = longitude, y = latitude."""
    x0 = y0 = 0
    partes = []
    for lng, lat in list(coords)[:-1]:          # o anel fecha sozinho no mapa
        x, y = round(lng * PREC), round(lat * PREC)
        partes.append(zigzag(x - x0) + zigzag(y - y0))
        x0, y0 = x, y
    return "".join(partes)


def poligonos(g) -> list[Polygon]:
    if isinstance(g, Polygon):
        return [g]
    if isinstance(g, MultiPolygon):
        return list(g.geoms)
    if hasattr(g, "geoms"):
        return [p for q in g.geoms for p in poligonos(q)]
    return []


def risco() -> tuple[list, dict]:
    df = le("risco")
    itens = []
    for _, linha in df.sort_values("geocodigo_bater").iterrows():
        g = wkt.loads(linha["geometria"])
        if not g.is_valid:
            g = g.buffer(0)
        mp = [[anel(p.exterior.coords)] + [anel(i.coords) for i in p.interiors] for p in poligonos(g)]
        if not mp:
            sys.exit(f"✗ risco: {linha['geocodigo_bater']} sem polígono")
        obs = linha.get("observacao")
        itens.append({
            "cod": linha["geocodigo_bater"],
            "muni": linha["id_municipio"],
            "origem": linha["origem"],
            "acuracia": linha["acuracia"],
            "obs": None if pd.isna(obs) else obs,
            "geom": mp,
        })
    por_muni = {MUNICIPIOS[c]: sum(1 for i in itens if i["muni"] == c) for c in MUNICIPIOS}
    print(f"  ✓ BATER: {len(itens)} áreas — {', '.join(f'{k} {v}' for k, v in por_muni.items() if v)}")
    sem = [k for k, v in por_muni.items() if not v]
    if sem:
        print(f"    sem área BATER (o que NÃO quer dizer sem risco): {', '.join(sem)}")
    return itens, {"fonte": "IBGE e CEMADEN — População em áreas de risco no Brasil (BATER)", "ano": 2010,
                   "via": "Base dos Dados, br_geobr_mapas.area_risco_desastre (geobr, IPEA)",
                   "url": url_de("risco")}


def main() -> None:
    print(f"espelho público da Base dos Dados → {FONTES / 'basedosdados'}")
    municipios: dict[str, dict] = {c: {} for c in MUNICIPIOS}
    fontes = {
        "adh": atlas_brasil(municipios),
        "ideb": ideb(municipios),
        "anatel": anatel(municipios),
    }
    areas, fontes["bater"] = risco()

    pacote = {
        "versao": dt.date.today().isoformat(),
        "prec": PREC,
        "municipios": municipios,
        "risco": areas,
        "fontes": fontes,
    }
    destino = DADOS / "dados-complementares.js"
    destino.write_text(
        "window.ATLAS_COMPLEMENTOS="
        + json.dumps(pacote, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(f"\n{destino.name}: {sum(len(v) for v in municipios.values())} valores municipais, "
          f"{len(areas)} áreas de risco. Rode build_single.py para atualizar o atlas-rmpa.html.")
    print("O IDHM ficou em extracao/fontes/basedosdados/: rode também 4_indices_municipais.py.")


if __name__ == "__main__":
    main()
