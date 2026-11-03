#!/usr/bin/env python3
"""Malhas do Atlas Porto Alegre: setores censitários, bairros e o município.

    python3 extracao/1_malhas.py

Lê a malha de setores do Censo 2022 do IBGE na forma em que o IPEA a publica para
o pacote geobr (o GeoPackage do RS nas releases do repositório ipeaGIT/geobr no
GitHub) e guarda os setores de Porto Alegre. Os bairros e o contorno do município
saem da união dos setores, como no Atlas 2.0: o território fica idêntico ao dos
dados do Censo, que o Atlas soma pelo setor.

O que faz depois:
- simplifica os setores como cobertura (shapely.coverage_simplify): vizinhos
  continuam com a mesma divisa, sem fresta nem sobreposição. Os bairros e o
  município são a união dos setores já simplificados, então as divisas dos três
  níveis coincidem;
- grava as divisas uma vez só (arcos compartilhados, como no TopoJSON) e confere
  que cada anel volta igual a partir dos arcos;
- guarda, para cada setor, um ponto representativo (dentro do polígono original),
  usado no entorno das lojas;
- grava extracao/fontes/intermediario/malhas.json.

Confere antes de gravar e para se algo não bater:
- os setores da malha são os mesmos dos dados do Censo 2022 (código e bairro);
- área de cada setor igual à publicada pelo IBGE (mediana da diferença abaixo de
  0,05%; área no elipsoide do SIRGAS 2000);
- área de cada bairro igual à soma dos seus setores e à do bairro do geobr (2%);
- nenhum setor some na simplificação e a área simplificada fica a menos de 1%.

Nome de bairro com caractere de controle herdado do Windows-1252 (o IBGE grava
Mont’Serrat como 'Mont\\x92Serrat') é corrigido para o caractere que era.

Precisa de shapely 2.1 ou mais novo e de pyarrow. Os arquivos baixados ficam em
extracao/fontes/ (não versionados) e não são baixados de novo.
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

RAIZ = pathlib.Path(__file__).resolve().parent.parent          # atlas_poa/
FONTES = RAIZ / "extracao" / "fontes"
GEOBR = FONTES / "geobr"
CENSOBR = FONTES / "censobr"
SAIDA = FONTES / "intermediario" / "malhas.json"
URL_GEOBR = "https://github.com/ipeaGIT/geobr/releases/download/v1.7.0/{}"
URL_CENSOBR = "https://github.com/ipea/censobr_prep_data/releases/download/v1.0.0/{}"
BASICO = "2022_tracts_basico_v1.0.0.parquet"
GPKG_RS = "43census_tract_2022.gpkg"
GPKG_BAIRROS = "neighborhoods_2022.gpkg"

MUNICIPIO = 4314902                     # Porto Alegre
TOL = 0.00003                           # ~3 m: setores vistos de perto
PREC = 10 ** 5                          # coordenadas em 1/100.000 de grau (~1 m)

A_GRS80 = 6378.137                      # km, semieixo maior do GRS80 (SIRGAS 2000)
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


def le_gpkg(arq: pathlib.Path, campos: list[str], onde: str = ""):
    con = sqlite3.connect(f"file:{arq}?mode=ro", uri=True)
    tabela, srs = con.execute("select table_name, srs_id from gpkg_contents where data_type='features'").fetchone()
    if srs != 4674:
        raise Falha(f"{arq.name}: sistema de coordenadas {srs}, esperado SIRGAS 2000 (4674)")
    for linha in con.execute(f"select geom, {', '.join(campos)} from '{tabela}' {onde}"):
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


def limpa_nome(s: str) -> str:
    """Caractere de controle herdado do Windows-1252 (0x80 a 0x9F) volta a ser o que era:
    'Mont\\x92Serrat' é Mont’Serrat. Caractere sem equivalente para o script."""
    out = []
    for c in s:
        if 0x80 <= ord(c) <= 0x9F:
            try:
                c = bytes([ord(c)]).decode("cp1252")
            except UnicodeDecodeError:
                raise Falha(f"nome com caractere de controle sem equivalente: {s!r}")
        out.append(c)
    return "".join(out)


def junta(ps: list[Polygon]):
    return ps[0] if len(ps) == 1 else MultiPolygon(ps)


def _q(phi: np.ndarray) -> np.ndarray:
    s = np.sin(phi)
    return (1 - E2) * (s / (1 - E2 * s * s) - np.log((1 - EXC * s) / (1 + EXC * s)) / (2 * EXC))


def area_km2(geoms) -> np.ndarray:
    """Área em km² no elipsoide GRS80 (SIRGAS 2000), pela projeção cilíndrica
    equivalente de Lambert com a latitude autálica."""
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
    return junta(poligonos(g))


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


def anel_int(coords) -> list[tuple[int, int]]:
    """Anel em inteiros (aberto, sem repetir o primeiro ponto no fim)."""
    pts = []
    for x, y in coords:
        p = (round(x * PREC), round(y * PREC))
        if not pts or pts[-1] != p:
            pts.append(p)
    if len(pts) > 1 and pts[0] == pts[-1]:
        pts.pop()
    return pts if len(pts) >= 3 else []


def quantiza(g) -> list:
    """Geometria -> [[anel externo, buracos...], ...] em inteiros."""
    polis = []
    for p in poligonos(g):
        ext = anel_int(p.exterior.coords)
        if not ext:
            continue
        aneis = [ext]
        for h in p.interiors:
            r = anel_int(h.coords)
            if r:
                aneis.append(r)
        polis.append(aneis)
    return polis


def topologia(feicoes: list) -> tuple[list, list]:
    """Arcos compartilhados (como no TopoJSON). Índice negativo ~i é o arco i
    percorrido ao contrário."""
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


# ── principal ───────────────────────────────────────────────────────────────
def main() -> int:
    conf = {}
    b = pq.read_table(baixa(URL_CENSOBR.format(BASICO), CENSOBR / BASICO),
                      columns=["code_tract", "code_muni", "name_muni", "code_neighborhood",
                               "name_neighborhood", "area_km2"]).to_pydict()
    area_set, bairro_set, nome_bai, area_bai = {}, {}, {}, defaultdict(float)
    for ct, cm, nm, cb, nb, a in zip(*b.values()):
        if cm is None or int(cm) != MUNICIPIO:
            continue
        ct = int(ct)
        area_set[ct] = a
        bairro_set[ct] = None if cb is None else int(cb)
        if cb is not None:
            nome_bai[int(cb)] = limpa_nome(nb)
            area_bai[int(cb)] += a
    sem_bairro = [c for c, v in bairro_set.items() if v is None]
    conf["setores_censo"] = len(area_set)
    conf["setores_sem_bairro"] = len(sem_bairro)
    if not area_set:
        raise Falha("nenhum setor de Porto Alegre nos dados do Censo 2022")

    geoms, cods = [], []
    arq = baixa(URL_GEOBR.format(GPKG_RS), GEOBR / GPKG_RS)
    for g, (ct, cm, cb) in le_gpkg(arq, ["code_tract", "code_muni", "code_neighborhood"],
                                   f"where code_muni = {MUNICIPIO}"):
        ct = int(ct)
        if ct not in area_set:
            raise Falha(f"setor {ct} da malha não está nos dados do Censo 2022")
        if bairro_set[ct] != (None if cb is None else int(cb)):
            raise Falha(f"setor {ct}: bairro {cb} na malha e {bairro_set[ct]} nos dados")
        if not g.is_valid:
            g = junta(poligonos(shapely.make_valid(g)))
        geoms.append(g)
        cods.append(ct)
    if sorted(cods) != sorted(area_set):
        raise Falha(f"{len(cods)} setores na malha e {len(area_set)} nos dados do Censo")
    ordem = np.argsort(cods)
    cods = [cods[i] for i in ordem]
    geoms = [geoms[i] for i in ordem]

    areas = area_km2(geoms)
    dif = np.array([abs(a - area_set[c]) / area_set[c] if area_set[c] > 0.001 else 0.0
                    for a, c in zip(areas, cods)])
    conf["setores_area_dif_mediana_pct"] = round(100 * float(np.median(dif)), 4)
    conf["setores_area_dif_p99_pct"] = round(100 * float(np.percentile(dif, 99)), 3)
    if np.median(dif) > 0.0005:
        raise Falha(f"área dos setores difere {np.median(dif):.2%} (mediana) da área do IBGE")

    # ponto representativo: dentro do polígono original
    rep = shapely.point_on_surface(np.asarray(geoms, dtype=object))
    if not all(shapely.contains(np.asarray(geoms, dtype=object), rep)):
        raise Falha("ponto representativo fora do setor")

    # simplificação da cobertura de setores
    arr = np.asarray(geoms, dtype=object)
    inval = shapely.coverage_invalid_edges(arr)
    n_inval = int(sum(0 if (e is None or e.is_empty) else 1 for e in inval))
    if n_inval:
        raise Falha(f"{n_inval} setores com divisa que não casa com a do vizinho")
    simp = list(shapely.coverage_simplify(arr, TOL, simplify_boundary=True))
    a_simp = area_km2(simp)
    d_simp = np.abs(a_simp - areas) / np.maximum(areas, 1e-12)
    grandes = areas > 0.01
    conf["simplificacao_area_dif_max_pct"] = round(100 * float(d_simp[grandes].max()), 3)
    if d_simp[grandes].max() > 0.01:
        raise Falha(f"simplificação muda a área de um setor em {100 * d_simp[grandes].max():.2f}%")

    # bairros e município: união dos setores simplificados
    por_b = defaultdict(list)
    for c, g in zip(cods, simp):
        if bairro_set[c] is not None:
            por_b[bairro_set[c]].append(g)
    cb = sorted(por_b)
    geo_bai = [une(por_b[c]) for c in cb]
    geo_mun = une(simp)

    # conferências de área dos bairros: soma dos setores e malha de bairros do geobr
    ab = area_km2(geo_bai)
    pior = max(abs(v - area_bai[c]) / area_bai[c] for c, v in zip(cb, ab))
    conf["bairros_area_dif_max_pct"] = round(100 * float(pior), 3)
    if pior > 0.01:
        raise Falha(f"bairro com área {100 * pior:.2f}% diferente da soma dos setores")
    arq_nb = baixa(URL_GEOBR.format(GPKG_BAIRROS), GEOBR / GPKG_BAIRROS)
    nb = {int(c): g for g, (c,) in le_gpkg(arq_nb, ["code_neighborhood"],
                                           f"where code_muni = {MUNICIPIO}")}
    if set(nb) != set(cb):
        raise Falha(f"bairros: {len(set(nb) ^ set(cb))} códigos diferentes entre os setores e o geobr")
    a_nb = area_km2([nb[c] for c in cb])
    d_nb = np.abs(a_nb - ab) / np.maximum(ab, 1e-9)
    conf["bairros_geobr_area_dif_max_pct"] = round(100 * float(d_nb.max()), 3)
    if d_nb.max() > 0.02:
        raise Falha(f"bairro do geobr com área {100 * d_nb.max():.1f}% diferente da dos setores")

    fs = [quantiza(g) for g in simp]
    vazios = [c for c, f in zip(cods, fs) if not f]
    if vazios:
        raise Falha(f"setores sem polígono depois de simplificar: {vazios[:5]}")
    fb = [quantiza(g) for g in geo_bai]
    fm = [quantiza(geo_mun)]
    conf.update({"setores": len(cods), "bairros": len(cb),
                 "pontos_setores": sum(len(r) for f in fs for p in f for r in p),
                 "pontos_bairros": sum(len(r) for f in fb for p in f for r in p),
                 "area_municipio_km2": round(float(sum(area_set.values())), 3)})

    saida = {
        "fonte": "IBGE, malha de setores censitários do Censo 2022, na forma publicada pelo IPEA no pacote "
                 "geobr; bairros e município pela união dos setores",
        "municipio": MUNICIPIO, "prec": PREC, "tol_graus": TOL,
        "setor": {"ids": cods, "bairro": [bairro_set[c] for c in cods],
                  "area": [round(float(area_set[c]), 5) for c in cods],
                  "rep": [[round(p.x, 6), round(p.y, 6)] for p in rep],
                  **codifica_topo(fs, "setores")},
        "bairro": {"ids": cb, "nomes": [nome_bai[c] for c in cb],
                   "area": [round(float(area_bai[c]), 4) for c in cb], **codifica_topo(fb, "bairros")},
        "mun": {"ids": [MUNICIPIO], "nomes": ["Porto Alegre"], **codifica_topo(fm, "município")},
        "conferencia": conf,
    }
    # geometria original dos setores, em WKB, para pôr pontos no setor certo (3_pontos.py)
    wkb = FONTES / "intermediario" / "setores_wkb.json"
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    wkb.write_text(json.dumps({"ids": cods, "wkb": [shapely.to_wkb(g, hex=True) for g in geoms]}),
                   encoding="utf-8")
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
