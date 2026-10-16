#!/usr/bin/env python3
"""Malhas do Atlas 2.0: municípios, bairros, UFs e grandes regiões do Brasil.

    python3 extracao/1_malhas.py

Lê a malha de setores censitários do Censo 2022 do IBGE na forma em que o IPEA a
publica para o pacote geobr (um GeoPackage por UF nas releases do repositório
ipeaGIT/geobr no GitHub) e monta, pela união dos setores:

- os 5.570 municípios de 2022;
- os 17.575 bairros que o IBGE delimitou no Censo 2022 (em 895 municípios);
- as 27 UFs e as 5 grandes regiões.

Por que pela união dos setores: o território fica idêntico ao dos dados do Censo
2022, que o Atlas agrega pelo setor. A malha municipal de 2022 do geobr não serve
(as áreas saem 6% a 12% maiores que as do IBGE e vizinhos se sobrepõem), e a de
2024 já tem um município que não existia no Censo (Boa Esperança do Norte, MT).
A malha de bairros de 2022 do geobr entra como conferência: cada bairro montado
pelos setores tem de ter a mesma área do bairro do geobr.

O que faz depois:
- simplifica cada malha como cobertura (shapely.coverage_simplify): vizinhos
  continuam com a mesma divisa, sem fresta nem sobreposição;
- grava as divisas uma vez só (arcos compartilhados, como no TopoJSON) e confere
  que cada anel volta igual a partir dos arcos;
- grava extracao/fontes/intermediario/malhas.json, que o 4_monta.py lê.

Confere antes de gravar e para se algo não bater:
- 5.570 municípios, 17.575 bairros, 27 UFs e 5 regiões;
- área de cada setor igual à publicada pelo IBGE (área no elipsoide do SIRGAS
  2000; a mediana da diferença por UF tem de ficar abaixo de 0,05%);
- área de cada município e de cada bairro igual à soma dos seus setores (0,1%);
- bairro montado pelos setores com a mesma área do bairro do geobr;
- nenhum polígono some na simplificação.

Precisa de shapely 2.1 ou mais novo (GEOS 3.12+) e de pyarrow. Os arquivos
baixados ficam em extracao/fontes/ (não versionados) e não são baixados de novo.
"""

from __future__ import annotations

import json
import pathlib
import sqlite3
import sys
import time
import urllib.request
from collections import defaultdict

import numpy as np
import pyarrow.parquet as pq
import shapely
from shapely.geometry import MultiPolygon, Polygon

RAIZ = pathlib.Path(__file__).resolve().parent.parent          # atlas2/
FONTES = RAIZ / "extracao" / "fontes"
GEOBR = FONTES / "geobr"
CENSOBR = FONTES / "censobr"
SAIDA = FONTES / "intermediario" / "malhas.json"
URL_GEOBR = "https://github.com/ipeaGIT/geobr/releases/download/v1.7.0/{}"
URL_CENSOBR = "https://github.com/ipea/censobr_prep_data/releases/download/v1.0.0/{}"
BASICO = "2022_tracts_basico_v1.0.0.parquet"

UFS = {11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO",
       21: "MA", 22: "PI", 23: "CE", 24: "RN", 25: "PB", 26: "PE", 27: "AL", 28: "SE", 29: "BA",
       31: "MG", 32: "ES", 33: "RJ", 35: "SP", 41: "PR", 42: "SC", 43: "RS",
       50: "MS", 51: "MT", 52: "GO", 53: "DF"}
REGIOES = {1: ("N", "Norte"), 2: ("NE", "Nordeste"), 3: ("SE", "Sudeste"), 4: ("S", "Sul"),
           5: ("CO", "Centro-Oeste")}

# tolerância da simplificação, em graus (0,001 grau ≈ 110 m)
TOL_MUN = 0.0015      # ~165 m: municípios de uma região
TOL_BAI = 0.0002      # ~22 m: bairros, vistos de perto
TOL_UF = 0.01         # ~1,1 km: UFs e regiões na vista do Brasil
PREC_MUN = 10 ** 4    # coordenadas gravadas em 1/10.000 de grau (~11 m)
PREC_BAI = 5 * 10 ** 4
PREC_UF = 10 ** 3

ESPERADO = {"municipios": 5570, "bairros": 17575, "ufs": 27, "regioes": 5}
A_GRS80 = 6378.137                     # km, semieixo maior do elipsoide GRS80 (SIRGAS 2000)
F_GRS80 = 1 / 298.257222101
E2 = F_GRS80 * (2 - F_GRS80)
EXC = E2 ** 0.5


class Falha(Exception):
    pass


# ── arquivos ────────────────────────────────────────────────────────────────
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


def le_gpkg(arq: pathlib.Path, campos: list[str]):
    con = sqlite3.connect(f"file:{arq}?mode=ro", uri=True)
    tabela, srs = con.execute("select table_name, srs_id from gpkg_contents where data_type='features'").fetchone()
    if srs != 4674:
        raise Falha(f"{arq.name}: sistema de coordenadas {srs}, esperado SIRGAS 2000 (4674)")
    for linha in con.execute(f"select geom, {', '.join(campos)} from '{tabela}'"):
        yield shapely.from_wkb(wkb_do_gpkg(linha[0])), linha[1:]
    con.close()


# ── geometria ───────────────────────────────────────────────────────────────
def poligonos(g) -> list[Polygon]:
    """Partes poligonais de qualquer geometria (coleções inclusive)."""
    if g is None or g.is_empty:
        return []
    if isinstance(g, Polygon):
        return [g]
    out = []
    for p in getattr(g, "geoms", []):
        out.extend(poligonos(p))
    return out


def _q(phi: np.ndarray) -> np.ndarray:
    s = np.sin(phi)
    return (1 - E2) * (s / (1 - E2 * s * s) - np.log((1 - EXC * s) / (1 + EXC * s)) / (2 * EXC))


def area_km2(geoms) -> np.ndarray:
    """Área em km² no elipsoide GRS80 (SIRGAS 2000), pela projeção cilíndrica
    equivalente de Lambert com a latitude autálica: a área plana nessa projeção é
    a área no elipsoide."""
    qp = _q(np.array(np.pi / 2))
    rq = A_GRS80 * np.sqrt(qp / 2)

    def proj(c):
        return np.column_stack([np.radians(c[:, 0]) * rq, rq * _q(np.radians(c[:, 1])) / qp])
    return shapely.area(shapely.transform(np.asarray(geoms, dtype=object), proj))


def une(partes: list):
    """União de setores vizinhos (cobertura); se a cobertura falhar, união comum."""
    arr = np.asarray(partes, dtype=object)
    try:
        g = shapely.coverage_union_all(arr)
    except shapely.errors.GEOSException:
        g = shapely.union_all(arr)
    if not g.is_valid:
        g = shapely.make_valid(g)
    ps = poligonos(g)
    return ps[0] if len(ps) == 1 else MultiPolygon(ps)


def simplifica(geoms: list, tol: float, rotulo: str) -> list:
    arr = np.asarray(geoms, dtype=object)
    inval = shapely.coverage_invalid_edges(arr)
    n = int(sum(0 if (e is None or e.is_empty) else 1 for e in inval))
    if n:
        raise Falha(f"{rotulo}: {n} polígonos com divisa que não casa com a do vizinho")
    return list(shapely.coverage_simplify(arr, tol, simplify_boundary=True))


# ── codificação ─────────────────────────────────────────────────────────────
def enc_num(v: int, out: list) -> None:
    r = (v << 1) if v >= 0 else ((~v) << 1) | 1
    while r >= 32:
        out.append(chr((32 | (r & 31)) + 63))
        r >>= 5
    out.append(chr(r + 63))


def enc_pts(pts) -> str:
    out, px, py = [], 0, 0
    for x, y in pts:
        enc_num(x - px, out)
        enc_num(y - py, out)
        px, py = x, y
    return "".join(out)


def anel_int(coords, prec: int) -> list[tuple[int, int]]:
    """Anel em inteiros (aberto, sem repetir o primeiro ponto no fim)."""
    pts = []
    for x, y in coords:
        p = (round(x * prec), round(y * prec))
        if not pts or pts[-1] != p:
            pts.append(p)
    if len(pts) > 1 and pts[0] == pts[-1]:
        pts.pop()
    return pts if len(pts) >= 3 else []


def quantiza(g, prec: int) -> list:
    """Geometria -> [[anel externo, buracos...], ...] em inteiros."""
    polis = []
    for p in poligonos(g):
        ext = anel_int(p.exterior.coords, prec)
        if not ext:
            continue
        aneis = [ext]
        for h in p.interiors:
            r = anel_int(h.coords, prec)
            if r:
                aneis.append(r)
        polis.append(aneis)
    return polis


def topologia(feicoes: list) -> tuple[list, list]:
    """Arcos compartilhados (como no TopoJSON).

    feicoes: lista de feições; feição = lista de polígonos; polígono = lista de anéis
    em inteiros. Devolve (arcos, feições em índices de arco). Índice negativo ~i é o
    arco i percorrido ao contrário.
    """
    vizinhos, juncao = {}, set()
    for polis in feicoes:
        for aneis in polis:
            for r in aneis:
                n = len(r)
                for i, p in enumerate(r):
                    a, b = r[i - 1], r[(i + 1) % n]
                    k = (a, b) if a < b else (b, a)
                    v = vizinhos.get(p)
                    if v is None:
                        vizinhos[p] = k
                    elif v != k:
                        juncao.add(p)
    arcos, indice = [], {}

    def arco(pts: list) -> int:
        t = tuple(pts)
        i = indice.get(t)
        if i is not None:
            return i
        i = indice.get(t[::-1])
        if i is not None:
            return ~i
        indice[t] = len(arcos)
        arcos.append(pts)
        return len(arcos) - 1

    saida = []
    for polis in feicoes:
        fp = []
        for aneis in polis:
            fa = []
            for r in aneis:
                js = [i for i, p in enumerate(r) if p in juncao]
                if not js:
                    i0 = min(range(len(r)), key=lambda i: r[i])
                    rot = r[i0:] + r[:i0]
                    fa.append([arco(rot + [rot[0]])])
                    continue
                s = js[0]
                rot = r[s:] + r[:s]
                partes, cur = [], [rot[0]]
                for p in rot[1:] + [rot[0]]:
                    cur.append(p)
                    if p in juncao:
                        partes.append(arco(cur))
                        cur = [p]
                fa.append(partes)
            fp.append(fa)
        saida.append(fp)
    return arcos, saida


def remonta(arcos: list, idx: list) -> list:
    pts = []
    for a in idx:
        seq = arcos[a] if a >= 0 else arcos[~a][::-1]
        pts.extend(seq if not pts else seq[1:])
    if pts and pts[0] == pts[-1]:
        pts.pop()
    return pts


def mesmo_anel(a: list, b: list) -> bool:
    if len(a) != len(b):
        return False
    if not a:
        return True
    try:
        k = b.index(a[0])
    except ValueError:
        return False
    return b[k:] + b[:k] == a


def codifica_topo(feicoes: list, rotulo: str) -> dict:
    arcos, refs = topologia(feicoes)
    for f, fr in zip(feicoes, refs):            # cada anel tem de voltar igual
        for aneis, ar in zip(f, fr):
            for r, idx in zip(aneis, ar):
                if not mesmo_anel(r, remonta(arcos, idx)):
                    raise Falha(f"{rotulo}: anel não volta igual a partir dos arcos")
    return {"arcos": [enc_pts(a) for a in arcos], "g": refs}


def codifica_simples(g, prec: int) -> list:
    return [[enc_pts(r + [r[0]]) for r in aneis] for aneis in quantiza(g, prec)]


# ── principal ───────────────────────────────────────────────────────────────
def main() -> int:
    conf = {}
    arq_b = baixa(URL_CENSOBR.format(BASICO), CENSOBR / BASICO)
    b = pq.read_table(arq_b, columns=["code_tract", "code_muni", "name_muni", "code_neighborhood",
                                      "name_neighborhood", "code_state", "code_region", "area_km2"]).to_pydict()
    area_set, setor_mun, nome_mun, nome_bai, uf_mun, reg_mun = {}, {}, {}, {}, {}, {}
    area_mun, area_bai = defaultdict(float), defaultdict(float)
    for ct, cm, nm, cb, nb, cu, cr, a in zip(*b.values()):
        ct = int(ct)
        area_set[ct] = a
        if cm is None:                     # Lagoa Mirim e Lagoa dos Patos: setores sem município
            continue
        cm = int(cm)
        setor_mun[ct] = cm
        nome_mun[cm], uf_mun[cm], reg_mun[cm] = nm, int(cu), int(cr)
        area_mun[cm] += a
        if cb is not None:
            nome_bai[int(cb)] = (nb, cm)
            area_bai[int(cb)] += a
    if len(nome_mun) != ESPERADO["municipios"] or len(nome_bai) != ESPERADO["bairros"]:
        raise Falha(f"Censo 2022: {len(nome_mun)} municípios e {len(nome_bai)} bairros nos setores")

    geo_mun, geo_bai = {}, {}
    pior_setor = []
    for cod_uf, sigla in UFS.items():
        arq = baixa(URL_GEOBR.format(f"{cod_uf}census_tract_2022.gpkg"), GEOBR / f"{cod_uf}census_tract_2022.gpkg")
        geoms, cods, munis, bairros = [], [], [], []
        for g, (ct, cm, cb) in le_gpkg(arq, ["code_tract", "code_muni", "code_neighborhood"]):
            ct = int(ct)
            if ct not in area_set:
                raise Falha(f"setor {ct} da malha não está nos dados do Censo 2022")
            if cm is None:
                continue
            if setor_mun.get(ct) != int(cm):
                raise Falha(f"setor {ct}: município {cm} na malha e {setor_mun.get(ct)} nos dados")
            if not g.is_valid:
                g = shapely.make_valid(g)
                ps = poligonos(g)
                g = ps[0] if len(ps) == 1 else MultiPolygon(ps)
            geoms.append(g); cods.append(ct); munis.append(int(cm))
            bairros.append(None if cb is None else int(cb))
        esperado = sum(1 for ct, cm in setor_mun.items() if uf_mun[cm] == cod_uf)
        if len(geoms) != esperado:
            raise Falha(f"{sigla}: {len(geoms)} setores na malha e {esperado} nos dados")
        areas = area_km2(geoms)
        dif = np.array([abs(a - area_set[c]) / area_set[c] if area_set[c] > 0.01 else 0.0
                        for a, c in zip(areas, cods)])
        pior_setor.append(float(np.median(dif)))
        if np.median(dif) > 0.0005:
            raise Falha(f"{sigla}: área dos setores difere {np.median(dif):.2%} (mediana) da área do IBGE")
        por_m, por_b = defaultdict(list), defaultdict(list)
        for g, cm, cb in zip(geoms, munis, bairros):
            por_m[cm].append(g)
            if cb is not None:
                por_b[cb].append(g)
        for cm, gs in por_m.items():
            geo_mun[cm] = une(gs)
        for cb, gs in por_b.items():
            geo_bai[cb] = une(gs)
        print(f"{sigla}: {len(geoms):>6} setores, {len(por_m):>4} municípios, {len(por_b):>5} bairros")
    conf["setores_area_dif_mediana_pct"] = round(100 * max(pior_setor), 4)
    if len(geo_mun) != ESPERADO["municipios"] or len(geo_bai) != ESPERADO["bairros"]:
        raise Falha(f"malha: {len(geo_mun)} municípios e {len(geo_bai)} bairros")

    # área de município e bairro = soma dos setores (IBGE)
    def confere_area(geo: dict, ref: dict, rotulo: str, tol: float) -> float:
        cods = list(geo)
        a = area_km2([geo[c] for c in cods])
        pior = 0.0
        for c, v in zip(cods, a):
            if ref[c] < 0.05:
                continue
            d = abs(v - ref[c]) / ref[c]
            pior = max(pior, d)
            if d > tol:
                raise Falha(f"{rotulo} {c}: área {v:.2f} km² e soma dos setores {ref[c]:.2f} km²")
        return round(100 * pior, 3)
    conf["municipios_area_dif_max_pct"] = confere_area(geo_mun, area_mun, "município", 0.001)
    conf["bairros_area_dif_max_pct"] = confere_area(geo_bai, area_bai, "bairro", 0.001)

    # conferência com a malha de bairros do geobr
    arq_nb = baixa(URL_GEOBR.format("neighborhoods_2022.gpkg"), GEOBR / "neighborhoods_2022.gpkg")
    nb = {int(c): g for g, (c,) in le_gpkg(arq_nb, ["code_neighborhood"])}
    if set(nb) != set(geo_bai):
        raise Falha(f"bairros: {len(set(nb) ^ set(geo_bai))} códigos diferentes entre os setores e o geobr")
    cods = list(nb)
    a1, a2 = area_km2([nb[c] for c in cods]), area_km2([geo_bai[c] for c in cods])
    d = np.abs(a1 - a2) / np.maximum(a2, 1e-9)
    grandes = a2 > 0.05
    conf["bairros_geobr_area_dif_max_pct"] = round(100 * float(d[grandes].max()), 3)
    if d[grandes].max() > 0.02:
        raise Falha(f"bairro do geobr com área {100 * d[grandes].max():.1f}% diferente da dos setores")

    # simplificação
    smun = {}
    for cod_r, (sig, nome) in REGIOES.items():
        cods = sorted(c for c in geo_mun if reg_mun[c] == cod_r)
        smun.update(zip(cods, simplifica([geo_mun[c] for c in cods], TOL_MUN, f"municípios do {nome}")))
    sbai = {}
    por_mun = defaultdict(list)
    for cb, (_, cm) in nome_bai.items():
        por_mun[cm].append(cb)
    for cm, cods in por_mun.items():
        cods.sort()
        sbai.update(zip(cods, simplifica([geo_bai[c] for c in cods], TOL_BAI, f"bairros de {nome_mun[cm]}")))
    geo_uf = {u: une([geo_mun[c] for c in geo_mun if uf_mun[c] == u]) for u in UFS}
    suf = dict(zip(UFS, simplifica([geo_uf[u] for u in UFS], TOL_UF, "UFs")))
    sreg = {r: une([suf[u] for u in UFS if u // 10 == r]) for r in REGIOES}

    # grava
    saida = {"fonte": "IBGE, malha de setores censitários do Censo 2022, na forma publicada pelo IPEA "
                      "no pacote geobr; municípios, bairros, UFs e regiões pela união dos setores",
             "prec": {"mun": PREC_MUN, "bai": PREC_BAI, "uf": PREC_UF},
             "tol_graus": {"mun": TOL_MUN, "bai": TOL_BAI, "uf": TOL_UF},
             "regioes": {}, "uf": {}, "conferencia": conf}
    pts = {"mun": 0, "bai": 0}
    for cod_r, (sig, nome) in REGIOES.items():
        cm = sorted(c for c in geo_mun if reg_mun[c] == cod_r)
        fm = [quantiza(smun[c], PREC_MUN) for c in cm]
        vazios = [c for c, f in zip(cm, fm) if not f]
        if vazios:
            raise Falha(f"municípios sem polígono depois de simplificar: {vazios[:5]}")
        cb = sorted(c for c in geo_bai if reg_mun[nome_bai[c][1]] == cod_r)
        fb = [quantiza(sbai[c], PREC_BAI) for c in cb]
        vazios = [c for c, f in zip(cb, fb) if not f]
        if vazios:
            raise Falha(f"bairros sem polígono depois de simplificar: {vazios[:5]}")
        pts["mun"] += sum(len(r) for f in fm for p in f for r in p)
        pts["bai"] += sum(len(r) for f in fb for p in f for r in p)
        saida["regioes"][sig] = {
            "cod": cod_r, "nome": nome, "geo": codifica_simples(sreg[cod_r], PREC_UF),
            "mun": {"ids": cm, "nomes": [nome_mun[c] for c in cm], "uf": [uf_mun[c] for c in cm],
                    "area": [round(area_mun[c], 3) for c in cm], **codifica_topo(fm, f"municípios {sig}")},
            "bai": {"ids": cb, "nomes": [nome_bai[c][0] for c in cb], "mun": [nome_bai[c][1] for c in cb],
                    "area": [round(area_bai[c], 4) for c in cb], **codifica_topo(fb, f"bairros {sig}")},
        }
        print(f"região {nome}: {len(cm)} municípios, {len(cb)} bairros")
    for u, sigla in UFS.items():
        saida["uf"][u] = {"sigla": sigla, "r": u // 10, "geo": codifica_simples(suf[u], PREC_UF),
                          "area": round(sum(area_mun[c] for c in area_mun if uf_mun[c] == u), 1)}
    conf.update({"municipios": len(geo_mun), "bairros": len(geo_bai), "ufs": len(UFS), "regioes": len(REGIOES),
                 "pontos_municipios": pts["mun"], "pontos_bairros": pts["bai"],
                 "municipios_com_bairro": len(por_mun)})
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
