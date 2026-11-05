#!/usr/bin/env python3
"""Setores censitários do Brasil para o entorno das lojas e a cobertura das redes.

    python3 extracao/1_setores.py

Lê:
- a malha de setores do Censo 2022 do IBGE, na forma em que o IPEA a publica para o
  pacote geobr (um GeoPackage por UF, release v1.7.0 do repositório ipeaGIT/geobr
  no GitHub);
- os agregados por setor do Censo 2022 (básico, pessoas, domicílio, renda do
  responsável e entorno), nos arquivos do pacote censobr (release v1.0.0 do
  repositório ipea/censobr_prep_data).

Grava, para cada um dos setores com município:
- o ponto representativo (um ponto dentro do polígono, shapely.point_on_surface),
  que é o ponto do setor nas distâncias até as lojas;
- município, bairro, UF e região;
- população, domicílios, as somas que dão o rendimento médio do responsável e a
  população em favelas e comunidades urbanas;
- as contagens das taxas do entorno das lojas: mínimo e máximo do numerador e do
  denominador, com as regras de sigilo do Atlas 2.0 e do Atlas Porto Alegre
  (farmacias/porto-alegre/extracao/2_censo2022.py), para os atlas darem o mesmo
  número. O total de 15 anos ou mais do analfabetismo sai das faixas de idade e é
  apertado pelas categorias da alfabetização, que também o fecham.

Os valores entram arredondados como no Atlas Porto Alegre (contagens e somas
inteiras, pontos em milionésimos de grau), para os dois atlas fazerem a mesma conta.
Os dois setores sem município (Lagoa Mirim e Lagoa dos Patos, sem moradores) ficam
de fora.

Confere e para se algo não bater: os setores da malha são os mesmos do Censo em cada
UF, o ponto representativo cai dentro do setor, a população soma 203.080.756 e as
categorias omitidas fecham o total do setor.

Grava extracao/fontes/intermediario/setores.npz.
"""

from __future__ import annotations

import json
import pathlib
import sqlite3
import sys
import time
import urllib.request

import numpy as np
import pyarrow.parquet as pq
import shapely
from shapely.geometry import MultiPolygon, Polygon

RAIZ = pathlib.Path(__file__).resolve().parent.parent          # farmacias/brasil/
FONTES = RAIZ / "extracao" / "fontes"
GEOBR = FONTES / "geobr"
CENSOBR = FONTES / "censobr"
INTER = FONTES / "intermediario"
URL_GEOBR = "https://github.com/ipeaGIT/geobr/releases/download/v1.7.0/{}"
RELEASE = "v1.0.0"
URL_CENSOBR = "https://github.com/ipea/censobr_prep_data/releases/download/" + RELEASE + "/{}"
ARQ = {k: f"2022_tracts_{k}_{RELEASE}.parquet"
       for k in ("basico", "pessoas", "domicilio", "responsavelrenda", "entorno")}
POP_BRASIL = 203_080_756
UFS = {11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO",
       21: "MA", 22: "PI", 23: "CE", 24: "RN", 25: "PB", 26: "PE", 27: "AL", 28: "SE", 29: "BA",
       31: "MG", 32: "ES", 33: "RJ", 35: "SP", 41: "PR", 42: "SC", 43: "RS",
       50: "MS", 51: "MT", 52: "GO", 53: "DF"}


class Falha(Exception):
    pass


def V(pref: str, a: int, b: int) -> list[str]:
    return [f"{pref}V{str(i).zfill(5)}" for i in range(a, b + 1)]


# grupo: (arquivo, total, categorias, as categorias somam o total?) — as do Atlas 2.0
GRUPOS = {
    "idade":   ("pessoas", "demografia_V01006", V("demografia_", 1031, 1041), True),
    "raca":    ("pessoas", "demografia_V01006", V("raca_", 1317, 1321), False),
    "alfab":   ("pessoas", "@15mais", ["alfabetizacao_V00900", "alfabetizacao_V00901"], True),
    "abast":   ("domicilio", "domicilio01_V00001", V("domicilio02_", 111, 118), True),
    "esgoto":  ("domicilio", "domicilio01_V00001", V("domicilio02_", 309, 316), True),
    "lixo":    ("domicilio", "domicilio01_V00001", V("domicilio02_", 397, 402), True),
    "pav":     ("entorno", "moradores_V05200", V("moradores_", 5206, 5208), True),
    "ilum":    ("entorno", "moradores_V05200", V("moradores_", 5212, 5214), True),
    "onibus":  ("entorno", "moradores_V05200", V("moradores_", 5215, 5217), True),
    "calcada": ("entorno", "moradores_V05200", V("moradores_", 5221, 5223), True),
}
# taxa do entorno das lojas: (grupo, categorias do numerador); denominador = total do grupo
TAXAS = {
    "pct_0a14":            ("idade", V("demografia_", 1031, 1033)),
    "pct_60mais":          ("idade", V("demografia_", 1040, 1041)),
    "pct_negra":           ("raca", ["raca_V01318", "raca_V01320"]),
    "tx_analf":            ("alfab", ["alfabetizacao_V00901"]),
    "pct_esgoto_precario": ("esgoto", V("domicilio02_", 312, 316)),
    "pct_agua_rede":       ("abast", ["domicilio02_V00111"]),
    "pct_lixo_coleta":     ("lixo", ["domicilio02_V00397", "domicilio02_V00398"]),
    "pct_onibus":          ("onibus", ["moradores_V05215"]),
    "pct_pav":             ("pav", ["moradores_V05206"]),
    "pct_ilum":            ("ilum", ["moradores_V05212"]),
    "pct_calcada":         ("calcada", ["moradores_V05221"]),
}


def baixa(url: str, destino: pathlib.Path) -> pathlib.Path:
    if destino.exists() and destino.stat().st_size > 0:
        return destino
    destino.parent.mkdir(parents=True, exist_ok=True)
    parcial = destino.with_suffix(destino.suffix + ".parcial")
    for espera in (0, 2, 4, 8, 16):
        time.sleep(espera)
        try:
            with urllib.request.urlopen(url, timeout=900) as r, open(parcial, "wb") as f:
                while True:
                    bloco = r.read(1 << 20)
                    if not bloco:
                        break
                    f.write(bloco)
            parcial.replace(destino)
            print(f"  baixado {destino.name} ({destino.stat().st_size / 1e6:.1f} MB)")
            return destino
        except OSError as e:
            print(f"  falha ao baixar {destino.name}: {e}")
    raise Falha(f"não consegui baixar {url}")


def wkb_do_gpkg(blob: bytes) -> bytes:
    """GeoPackage guarda 'GP' + versão + flags + srs + envelope antes do WKB."""
    if blob[:2] != b"GP":
        raise Falha("geometria fora do padrão GeoPackage")
    tam = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}.get((blob[3] >> 1) & 7)
    if tam is None:
        raise Falha("envelope GeoPackage desconhecido")
    return blob[8 + tam:]


def le_gpkg(arq: pathlib.Path):
    con = sqlite3.connect(f"file:{arq}?mode=ro", uri=True)
    tabela, srs = con.execute("select table_name, srs_id from gpkg_contents where data_type='features'").fetchone()
    if srs != 4674:
        raise Falha(f"{arq.name}: sistema de coordenadas {srs}, esperado SIRGAS 2000 (4674)")
    for blob, ct, cm in con.execute(f"select geom, code_tract, code_muni from '{tabela}'"):
        yield shapely.from_wkb(wkb_do_gpkg(blob)), ct, cm
    con.close()


def poligonos(g) -> list[Polygon]:
    if g is None or g.is_empty:
        return []
    if isinstance(g, Polygon):
        return [g]
    out = []
    for p in getattr(g, "geoms", []):
        out.extend(poligonos(p))
    return out


def coluna(tab, nome: str) -> np.ndarray:
    """Coluna como float64, com NaN onde o IBGE omitiu o valor."""
    if nome not in tab.column_names:
        raise Falha(f"coluna {nome} não está no arquivo (a fonte mudou?)")
    return tab[nome].to_numpy(zero_copy_only=False).astype("float64")


def parte(P: np.ndarray, sel: np.ndarray, r_lo: np.ndarray, r_hi: np.ndarray, identidade: bool,
          total: np.ndarray):
    """Mínimo e máximo da soma das categorias selecionadas, setor a setor (Atlas 2.0).

    P: matriz setores × categorias (NaN = omitida, valor 1 ou 2). r_lo/r_hi: o que
    falta para o total (soma das omitidas), quando as categorias fecham o total.
    """
    falta = np.isnan(P)
    conhecido_A = np.nansum(np.where(sel, P, np.nan), axis=1)
    kA = (falta & sel).sum(axis=1)
    kB = (falta & ~sel).sum(axis=1)
    if identidade:
        lo = conhecido_A + np.maximum(kA, r_lo - 2 * kB)
        hi = conhecido_A + np.minimum(2 * kA, r_hi - kB)
    else:
        conhecido_B = np.nansum(np.where(~sel, P, np.nan), axis=1)
        lo = conhecido_A + kA
        hi = np.minimum(conhecido_A + 2 * kA, total - conhecido_B - kB)
    return lo, hi


def inteiro(x: np.ndarray) -> np.ndarray:
    """Arredonda meio para cima, como a codificação do Atlas Porto Alegre."""
    return np.floor(np.nan_to_num(x) + 0.5 + 1e-9).astype("int64")


def main() -> int:
    conf = {}
    tabs = {k: pq.read_table(baixa(URL_CENSOBR.format(nome), CENSOBR / nome)) for k, nome in ARQ.items()}
    base = tabs["basico"]
    setor_all = base["code_tract"].to_numpy().astype("int64")
    if len(np.unique(setor_all)) != len(setor_all):
        raise Falha("setor repetido no arquivo básico")
    mun_raw = base["code_muni"].to_numpy(zero_copy_only=False)
    tem_mun = np.array([m is not None and not (isinstance(m, float) and np.isnan(m)) for m in mun_raw])
    pop_all = coluna(base, "V0001")
    if np.isnan(pop_all).any():
        raise Falha("população omitida em algum setor: a fonte mudou")
    if int(pop_all[tem_mun].sum()) != POP_BRASIL:
        raise Falha(f"população dos municípios soma {int(pop_all[tem_mun].sum()):,}, esperado {POP_BRASIL:,}")
    conf["setores_sem_municipio"] = int((~tem_mun).sum())
    conf["populacao_sem_municipio"] = int(pop_all[~tem_mun].sum())

    # só os setores com município, em ordem de código
    sel_m = np.flatnonzero(tem_mun)
    sel_m = sel_m[np.argsort(setor_all[sel_m])]
    setor = setor_all[sel_m]
    n = len(setor)
    pos_basico = sel_m                                  # linha do básico de cada setor
    mun = np.array([int(mun_raw[j]) for j in sel_m], dtype="int64")
    bai_raw = base["code_neighborhood"].to_numpy(zero_copy_only=False).astype("float64")[sel_m]
    bai = np.where(np.isnan(bai_raw), 0, bai_raw).astype("int64")
    uf = base["code_state"].to_numpy().astype("int64")[sel_m]
    reg = base["code_region"].to_numpy().astype("int64")[sel_m]
    if not np.array_equal(mun // 100000, uf):
        raise Falha("setor com município de outra UF")
    pop = pop_all[sel_m]
    dom = coluna(base, "V0007")[sel_m]
    tipo = coluna(base, "code_type")[sel_m]

    # alinha cada arquivo com os setores, pelo código
    def col(k: str, nome: str) -> np.ndarray:
        t = tabs[k]
        s = t["code_tract"].to_numpy().astype("int64")
        p = np.searchsorted(setor, s)
        dentro = (p < n) & (setor[np.clip(p, 0, n - 1)] == s)
        out = np.full(n, np.nan)
        out[p[dentro]] = coluna(t, nome)[dentro]
        return out

    for k in ("pessoas", "domicilio", "responsavelrenda", "entorno"):
        s = tabs[k]["code_tract"].to_numpy().astype("int64")
        if not np.isin(s, setor_all).all():
            raise Falha(f"{k}: setor que não está no arquivo básico")

    # ── grupos: mínimo e máximo de cada categoria (regras do Atlas 2.0) ────────
    cache_P, cache_T, cache_R, cache_15 = {}, {}, {}, {}
    for g in ["idade"] + [g for g in GRUPOS if g != "idade"]:
        arq, total, cats, ident = GRUPOS[g]
        P = np.column_stack([col(arq, c) for c in cats])
        if total == "@15mais":                  # pessoas de 15 anos ou mais = faixas 15-19 a 70+
            sel = np.array([c in V("demografia_", 1034, 1041) for c in GRUPOS["idade"][2]])
            t_lo, t_hi = parte(cache_P["idade"], sel, *cache_R["idade"], True, cache_T["idade"])
            conhecido, k_omit = np.nansum(P, axis=1), np.isnan(P).sum(axis=1)
            t_lo = np.maximum(t_lo, conhecido + k_omit)
            t_hi = np.minimum(t_hi, conhecido + 2 * k_omit)
            if (t_lo > t_hi).any():
                i = np.flatnonzero(t_lo > t_hi)[:3]
                raise Falha(f"grupo {g}: idade e alfabetização não fecham o mesmo total (setores {setor[i].tolist()})")
            cache_15[g] = (t_lo, t_hi)
        else:
            t_lo = t_hi = col(arq, total)
        R_lo = t_lo - np.nansum(P, axis=1)
        R_hi = t_hi - np.nansum(P, axis=1)
        k = np.isnan(P).sum(axis=1)
        valido = ~np.isnan(t_lo)
        if ident:
            ruim = valido & ((R_hi < k) | (R_lo > 2 * k))
            if ruim.any():
                i = np.flatnonzero(ruim)[:3]
                raise Falha(f"grupo {g}: categorias omitidas não fecham o total do setor "
                            f"(setores {setor[i].tolist()}); a regra de sigilo da fonte mudou?")
        cache_P[g], cache_T[g], cache_R[g] = P, t_lo, (R_lo, R_hi)

    cont = {}
    for ind, (g, cats) in TAXAS.items():
        arq, total, todas, ident = GRUPOS[g]
        P, T, (R_lo, R_hi) = cache_P[g], cache_T[g], cache_R[g]
        sel = np.array([c in cats for c in todas])
        n_lo, n_hi = parte(P, sel, R_lo, R_hi, ident, T)
        d_lo, d_hi = cache_15[g] if total == "@15mais" else (T, T)
        ok = ~np.isnan(T)
        cont[ind] = np.column_stack([inteiro(np.where(ok, v, 0)) for v in (n_lo, n_hi, d_lo, d_hi)])
        if (cont[ind][:, 0] > cont[ind][:, 1]).any() or (cont[ind][:, 2] > cont[ind][:, 3]).any():
            raise Falha(f"{ind}: mínimo maior que o máximo")

    dppo = col("domicilio", "domicilio01_V00001")
    resp = col("responsavelrenda", "V06001")
    renda = col("responsavelrenda", "V06004")
    cob_r0 = ~np.isnan(resp) & ~np.isnan(renda)
    valores = {
        "pop": inteiro(pop), "dom": inteiro(dom),
        "renda_num": inteiro(np.where(cob_r0, renda * resp, 0)),
        "renda_den": inteiro(np.where(cob_r0, resp, 0)),
        "cob_p": inteiro(np.where(~np.isnan(cache_T["idade"]), pop, 0)),
        "cob_d": inteiro(np.where(~np.isnan(dppo), pop, 0)),
        "cob_r": inteiro(np.where(cob_r0, pop, 0)),
        "pop_fcu": inteiro(np.where(tipo == 1, pop, 0)),
    }
    conf["setores"] = n
    conf["populacao"] = int(valores["pop"].sum())
    if conf["populacao"] != POP_BRASIL:
        raise Falha("população dos setores com município diferente da do Censo")

    # ── malha: ponto representativo de cada setor ─────────────────────────────
    rep_x, rep_y = np.full(n, np.nan), np.full(n, np.nan)
    pos = {int(c): i for i, c in enumerate(setor)}
    for cod_uf, sigla in UFS.items():
        arq = baixa(URL_GEOBR.format(f"{cod_uf}census_tract_2022.gpkg"), GEOBR / f"{cod_uf}census_tract_2022.gpkg")
        geoms, cods = [], []
        for g, ct, cm in le_gpkg(arq):
            if cm is None:                      # Lagoa Mirim e Lagoa dos Patos: setores sem município
                continue
            ct = int(ct)
            if ct not in pos:
                raise Falha(f"setor {ct} da malha não está nos dados do Censo 2022 (ou está sem município)")
            if mun[pos[ct]] != int(cm):
                raise Falha(f"setor {ct}: município {cm} na malha e {mun[pos[ct]]} nos dados")
            if not g.is_valid:
                ps = poligonos(shapely.make_valid(g))
                g = ps[0] if len(ps) == 1 else MultiPolygon(ps)
            geoms.append(g)
            cods.append(ct)
        esperado = int((uf == cod_uf).sum())
        if len(set(cods)) != esperado or len(cods) != esperado:
            raise Falha(f"{sigla}: {len(cods)} setores na malha e {esperado} nos dados")
        arr = np.asarray(geoms, dtype=object)
        rep = shapely.point_on_surface(arr)
        if not shapely.contains(arr, rep).all():
            raise Falha(f"{sigla}: ponto representativo fora do setor")
        ix = np.array([pos[c] for c in cods])
        # arredondamento decimal do Python, o mesmo do Atlas Porto Alegre (np.round arredonda pelo
        # produto em ponto flutuante e às vezes difere em 1 milionésimo de grau)
        rep_x[ix] = [round(float(v), 6) for v in shapely.get_x(rep)]
        rep_y[ix] = [round(float(v), 6) for v in shapely.get_y(rep)]
        print(f"{sigla}: {len(cods):>6} setores")
    if np.isnan(rep_x).any():
        raise Falha("setor sem ponto representativo")
    conf["setores_com_bairro"] = int((bai > 0).sum())
    conf["setores_sem_moradores"] = int((valores["pop"] == 0).sum())
    conf["setores_sem_dado_pessoas"] = int(((valores["pop"] > 0) & (valores["cob_p"] == 0)).sum())

    INTER.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(INTER / "setores.npz", setor=setor, x=rep_x, y=rep_y, mun=mun, bai=bai, uf=uf, reg=reg,
                        **valores, **{f"cont_{k}": v for k, v in cont.items()})
    (INTER / "setores_conferencia.json").write_text(json.dumps(conf, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps(conf, ensure_ascii=False, indent=1))
    print(f"gravado {INTER / 'setores.npz'} ({(INTER / 'setores.npz').stat().st_size / 1e6:.1f} MB)")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Falha as e:
        print(f"PAROU: {e}", file=sys.stderr)
        sys.exit(1)
