#!/usr/bin/env python3
"""Monta os dados do Atlas das Farmácias do Brasil: dados/farmacias.js.

    python3 extracao/3_monta.py

Lê o que o 1_setores.py e o 2_lojas.py gravaram em extracao/fontes/intermediario/ e
os municípios e bairros do Atlas 2.0 (atlas2/dados/), e grava dados/farmacias.js com:

- as lojas das três redes (Panvel, Raia Drogasil e Pague Menos com a Extrafarma),
  com o endereço do CNES, a coordenada e a classe de localização;
- o entorno de cada loja nos raios de 500 m, 1 km e 2 km: moradores, domicílios,
  rendimento médio do responsável e taxas do Censo 2022, somando os setores cujo
  ponto representativo está no raio; e as outras lojas das três redes no raio;
- a loja mais próxima da mesma rede e de cada uma das outras;
- o nome dos bairros que têm loja (para a lista e o CSV das lojas de todo o país);
- os indicadores de cobertura de cada rede e das três juntas, por município e por
  bairro (na ordem dos arquivos do Atlas 2.0) e por UF, região e Brasil: lojas,
  lojas por 10 mil habitantes, parte dos moradores a até 1 km de uma loja e
  distância média até a loja mais próxima.

Contas do Atlas, todas sobre os dados publicados (nada é estimado):
- distância em linha reta (fórmula de haversine, raio médio da Terra de 6.371.008,8 m)
  entre o ponto representativo do setor e a loja;
- no município e no bairro, a distância média e a parte a até 1 km pesam cada setor
  pela sua população;
- a loja conta no município do endereço do CNES e no bairro em que o ponto cai;
- no entorno, contagens somam e taxas são recalculadas sobre os totais, com o mínimo
  e o máximo que o sigilo do IBGE permite; se os setores com dado têm menos da
  metade dos moradores do raio, a taxa fica em branco (a mesma regra do Atlas
  Porto Alegre, que faz essa conta no navegador).

Confere antes de gravar: os mesmos 5.570 municípios e 17.575 bairros do Atlas 2.0,
população de cada município igual à do Atlas 2.0, lojas por rede iguais às do
2_lojas.py e colunas que voltam iguais depois de codificadas.
"""

from __future__ import annotations

import datetime as dt
import json
import math
import pathlib
import sys
from collections import Counter

import numpy as np
from scipy.spatial import cKDTree

RAIZ = pathlib.Path(__file__).resolve().parent.parent          # farmacias/brasil/
INTER = RAIZ / "extracao" / "fontes" / "intermediario"
ATLAS2 = RAIZ.parent.parent / "atlas2" / "dados"
DADOS = RAIZ / "dados"
VERSAO = "1.0"
RAIO_TERRA_M = 6371008.8
RAIOS = (500, 1000, 2000)
RAIO_COB = 1000                       # cobertura: moradores a até 1 km de uma loja
COB_MIN = 0.5                         # parte mínima dos moradores em setores com dado para mostrar a taxa
PREC_PTS = 10 ** 6
REDES = ["panvel", "rd", "pm"]
GRUPOS = {"todas": REDES, "panvel": ["panvel"], "rd": ["rd"], "pm": ["pm"]}
COR = {"panvel": "#2a78d6", "rd": "#eb6834", "pm": "#1baf7a"}   # paleta categórica validada (Atlas 2.0, --s1 a --s3)
SIGLAS = ["N", "NE", "CO", "SE", "S"]
# taxa do entorno: (id, base da cobertura: p = pessoas, d = domicílio, e = entorno)
TAXAS = [("pct_0a14", "p"), ("pct_60mais", "p"), ("pct_negra", "p"), ("tx_analf", "p"),
         ("pct_esgoto_precario", "d"), ("pct_agua_rede", "d"), ("pct_lixo_coleta", "d"),
         ("pct_onibus", "e"), ("pct_pav", "e"), ("pct_ilum", "e"), ("pct_calcada", "e")]
CLASSES = ["endereco", "cnes_no_cep", "centro_cep", "cnes_sem_confirmacao", "aproximada"]


class Falha(Exception):
    pass


FONTES = {
    "CNES": {"n": "Ministério da Saúde — Cadastro Nacional de Estabelecimentos de Saúde (CNES)", "s": "CNES, abr./2026",
             "u": "https://cnes.datasus.gov.br/",
             "d": "Competência de abril de 2026, na forma publicada pelo IPEA para o pacote geobr, com as coordenadas do "
                  "CNES e as do geocodebr. Lojas: farmácias (tipo 43) ativas com o CNPJ da Dimed (Panvel), da Raia "
                  "Drogasil, da Empreendimentos Pague Menos e da Imifarma (Extrafarma). As contas de cobertura usam também "
                  "a população e os pontos dos setores do Censo 2022."},
}
CATS = [("farm", "Farmácias: as três redes"), ("farm_panvel", "Panvel"), ("farm_rd", "Raia Drogasil"),
        ("farm_pm", "Pague Menos e Extrafarma")]
NOME_G = {"todas": ("das três redes", "uma loja das três redes", "a loja mais próxima das três redes"),
          "panvel": ("Panvel", "uma Panvel", "a Panvel mais próxima"),
          "rd": ("Raia Drogasil", "uma Raia Drogasil", "a Raia Drogasil mais próxima"),
          "pm": ("Pague Menos e Extrafarma", "uma Pague Menos ou Extrafarma", "a Pague Menos ou Extrafarma mais próxima")}
CAT_G = {"todas": "farm", "panvel": "farm_panvel", "rd": "farm_rd", "pm": "farm_pm"}
LINHA_RETA = (" Distância em linha reta do ponto representativo de cada setor do Censo 2022 (um ponto dentro do "
              "setor) até a loja.")


def I(id, cat, n, u, fmt, esc, d, calc, zero=True):
    """zero: muitos municípios e bairros sem loja; o mapa separa o zero e divide o resto em quartis."""
    return {"id": id, "cat": cat, "n": n, "u": u, "fmt": fmt, "fonte": "CNES", "ano": 2026, "niv": ["mun", "bai"],
            "esc": esc, "d": d, "rampa": "neutra", "serie": False, "calc": calc, "zero": zero}


CATALOGO = []
for g, (rot, uma, mais) in NOME_G.items():
    c = CAT_G[g]
    CATALOGO += [
        I(f"f_n_{g}", c, f"Lojas {rot}" if g != "todas" else "Lojas das três redes", "lojas", "int", 1,
          "Farmácias ativas no CNES em abril de 2026. No município, as do endereço do CNES; no bairro, as que caem nele.",
          "contagem das lojas"),
        I(f"f_10k_{g}", c, f"Lojas {rot} por 10 mil habitantes" if g != "todas"
          else "Lojas das três redes por 10 mil habitantes", "por 10 mil hab.", "dec2", 100,
          "Lojas para cada 10 mil moradores do Censo 2022.", "lojas ÷ população do Censo 2022 × 10.000"),
        I(f"f_1km_{g}", c, f"Moradores a até 1 km de {uma}", "%", "pct1", 10,
          "Parte da população em setores cujo ponto representativo está a até 1 km de " + uma + "." + LINHA_RETA,
          "população dos setores a até 1 km ÷ população"),
        I(f"f_dist_{g}", c, f"Distância média até {mais}", "km", "dec1", 10,
          "Média da distância de cada morador até " + mais + ": cada setor pesa pela sua população." + LINHA_RETA,
          "distância em linha reta; média ponderada pela população dos setores", zero=False),
    ]
ESC = {c["id"]: c["esc"] for c in CATALOGO}


# ── codificação (a do Atlas 2.0) ───────────────────────────────────────────
def enc_num(v: int, out: list) -> None:
    r = (v << 1) if v >= 0 else ((~v) << 1) | 1
    while r >= 32:
        out.append(chr((32 | (r & 31)) + 63))
        r >>= 5
    out.append(chr(r + 63))


def dec_nums(s: str) -> list[int]:
    out, i, n = [], 0, len(s)
    while i < n:
        r = sh = 0
        while True:
            b = ord(s[i]) - 63
            i += 1
            r |= (b & 31) << sh
            sh += 5
            if b < 32:
                break
        out.append(~(r >> 1) if r & 1 else r >> 1)
    return out


def dec_ids(s: str) -> list[int]:
    a, out = 0, []
    for d in dec_nums(s):
        a += d
        out.append(a)
    return out


def arred(x: float, esc: float) -> int:
    """Arredonda meio para cima (a margem evita que 17,45 guardado como 17,4499… caia para baixo)."""
    return math.floor(x * esc + 0.5 + 1e-9)


def enc_col(vals, esc: float) -> str:
    """0 = sem valor; valor v ≥ 0 vira round(v·esc)+1; negativo, round(v·esc) (nunca 0)."""
    out = []
    for x in vals:
        if x is None or (isinstance(x, float) and math.isnan(x)):
            enc_num(0, out)
            continue
        k = arred(x, esc)
        enc_num(k + 1 if k >= 0 else k, out)
    return "".join(out)


def confere_col(vals, esc, rotulo) -> str:
    s = enc_col(vals, esc)
    volta = dec_nums(s)
    if len(volta) != len(vals):
        raise Falha(f"{rotulo}: coluna com tamanho diferente depois de codificada")
    for a, v in zip(vals, volta):
        b = None if v == 0 else ((v - 1) / esc if v > 0 else v / esc)
        if (a is None) != (b is None) or (a is not None and arred(a, esc) != arred(b, esc)):
            raise Falha(f"{rotulo}: coluna não volta igual ({a} → {b})")
    return s


def enc_ids(ids) -> str:
    out, ant = [], 0
    for x in ids:
        if x < ant:
            raise Falha("códigos fora de ordem")
        enc_num(x - ant, out)
        ant = x
    return "".join(out)


def enc_pts(pts) -> str:
    out, px, py = [], 0, 0
    for x, y in pts:
        xi, yi = round(x * PREC_PTS), round(y * PREC_PTS)
        enc_num(xi - px, out)
        enc_num(yi - py, out)
        px, py = xi, yi
    return "".join(out)


# ── geometria ───────────────────────────────────────────────────────────────
def xyz(lon, lat) -> np.ndarray:
    lo, la = np.radians(np.asarray(lon, dtype=float)), np.radians(np.asarray(lat, dtype=float))
    return np.column_stack([np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)])


def hav(x1, y1, x2, y2):
    """Distância em metros, a mesma fórmula do Atlas Porto Alegre (distM)."""
    r = math.pi / 180
    p1, p2 = np.asarray(y1) * r, np.asarray(y2) * r
    h = np.sin((p2 - p1) / 2) ** 2 + np.cos(p1) * np.cos(p2) * np.sin((np.asarray(x2) - np.asarray(x1)) * r / 2) ** 2
    return 2 * RAIO_TERRA_M * np.arcsin(np.sqrt(h))


def corda(raio_m: float) -> float:
    """Raio da busca na esfera unitária, com folga; a distância exata é conferida depois."""
    return 2 * math.sin(raio_m / RAIO_TERRA_M / 2) * (1 + 1e-6) + 1e-12


# ── Atlas 2.0 ───────────────────────────────────────────────────────────────
def le_atlas2() -> tuple[dict, dict]:
    regs = {}
    for sig in SIGLAS:
        txt = (ATLAS2 / f"regiao-{sig.lower()}.js").read_text(encoding="utf-8")
        ini = f"window.ATLAS2_REGIAO[{json.dumps(sig)}]="
        R = json.loads(txt[txt.index(ini) + len(ini):].rstrip().rstrip(";"))
        regs[sig] = {}
        for nv in ("mun", "bai"):
            ids = dec_ids(R[nv]["ids"])
            if len(ids) != R[nv]["n"]:
                raise Falha(f"Atlas 2.0, {sig} {nv}: códigos com tamanho inesperado")
            pop = dec_nums(R[nv]["c"]["pop"])
            regs[sig][nv] = {"ids": ids, "pop": [None if v == 0 else v - 1 for v in pop], "nomes": R[nv]["nomes"]}
    txt = (ATLAS2 / "brasil.js").read_text(encoding="utf-8")
    br = json.loads(txt[txt.index("=") + 1:].rstrip().rstrip(";"))
    return regs, br


def main() -> int:
    conf = {}
    L_ = json.loads((INTER / "lojas.json").read_text(encoding="utf-8"))
    L = L_["lojas"]
    z = np.load(INTER / "setores.npz")
    regs, br2 = le_atlas2()
    nl = len(L)
    X, Y, pop = z["x"], z["y"], z["pop"].astype(float)
    mun_s, bai_s, uf_s, reg_s = z["mun"], z["bai"], z["uf"], z["reg"]
    lx = np.array([l["x"] for l in L])
    ly = np.array([l["y"] for l in L])
    rede = np.array([l["rede"] for l in L])

    # unidades: as do Atlas 2.0
    ids_m = [c for s in SIGLAS for c in regs[s]["mun"]["ids"]]
    ids_b = [c for s in SIGLAS for c in regs[s]["bai"]["ids"]]
    if len(set(ids_m)) != 5570 or len(set(ids_b)) != 17575:
        raise Falha(f"Atlas 2.0 com {len(set(ids_m))} municípios e {len(set(ids_b))} bairros")
    if set(np.unique(mun_s).tolist()) != set(ids_m):
        raise Falha("os municípios dos setores não são os do Atlas 2.0")
    if set(np.unique(bai_s[bai_s > 0]).tolist()) != set(ids_b):
        raise Falha("os bairros dos setores não são os do Atlas 2.0")
    if any(l["mun"] not in set(ids_m) for l in L):
        raise Falha("loja em município que não está no Atlas 2.0")

    ufs = [u["cod"] for u in br2["ufs"]]
    reg_cod = [r["cod"] for r in br2["regioes"]]

    # ── distância de cada setor até a loja mais próxima de cada grupo ─────────
    P3 = xyz(X, Y)
    dist = {}
    for g, rs in GRUPOS.items():
        k = np.flatnonzero(np.isin(rede, rs))
        _, j = cKDTree(xyz(lx[k], ly[k])).query(P3, k=1)
        dist[g] = hav(X, Y, lx[k][j], ly[k][j])

    def agrega(chave: np.ndarray, ids: list) -> dict:
        """Somas por unidade: população, população × distância e população a até 1 km."""
        pos = {c: i for i, c in enumerate(ids)}
        idx = np.array([pos.get(int(c), -1) for c in chave])
        ok = idx >= 0
        n = len(ids)
        o = {"pop": np.bincount(idx[ok], weights=pop[ok], minlength=n)}
        for g in GRUPOS:
            o[f"pd_{g}"] = np.bincount(idx[ok], weights=(pop * dist[g])[ok], minlength=n)
            o[f"p1_{g}"] = np.bincount(idx[ok], weights=(pop * (dist[g] <= RAIO_COB))[ok], minlength=n)
        return o

    def contagem(chaves: list, ids: list) -> dict:
        """Lojas por unidade, por grupo. chaves: a unidade de cada loja (None = nenhuma)."""
        pos = {c: i for i, c in enumerate(ids)}
        out = {}
        for g, rs in GRUPOS.items():
            v = [0] * len(ids)
            for l, c in zip(L, chaves):
                if c is not None and l["rede"] in rs:
                    v[pos[c]] += 1
            out[g] = v
        return out

    def valores(A: dict, cont: dict, i: int) -> dict:
        p = A["pop"][i]
        v = {}
        for g in GRUPOS:
            n = cont[g][i]
            v[f"f_n_{g}"] = n
            v[f"f_10k_{g}"] = 1e4 * n / p if p else None
            v[f"f_1km_{g}"] = 100 * A[f"p1_{g}"][i] / p if p else None
            v[f"f_dist_{g}"] = A[f"pd_{g}"][i] / p / 1000 if p else None
        return v

    # municípios e bairros, na ordem de cada região do Atlas 2.0
    am, ab = agrega(mun_s, ids_m), agrega(bai_s, ids_b)
    cm = contagem([l["mun"] for l in L], ids_m)
    cb = contagem([l["bai"] for l in L], ids_b)
    pos_m, pos_b = {c: i for i, c in enumerate(ids_m)}, {c: i for i, c in enumerate(ids_b)}
    regioes = {}
    for sig in SIGLAS:
        bloco = {}
        for nv, A, C, pos in (("mun", am, cm, pos_m), ("bai", ab, cb, pos_b)):
            ids = regs[sig][nv]["ids"]
            for c, p in zip(ids, regs[sig][nv]["pop"]):
                if int(round(A["pop"][pos[c]])) != p:
                    raise Falha(f"{nv} {c}: população {A['pop'][pos[c]]} nos setores e {p} no Atlas 2.0")
            linhas = [valores(A, C, pos[c]) for c in ids]
            bloco[nv] = {"n": len(ids), "ids0": ids[0], "ids1": ids[-1],
                         "c": {k: confere_col([x[k] for x in linhas], ESC[k], f"{sig} {nv} {k}") for k in ESC}}
        regioes[sig] = bloco
    conf["municipios"] = len(ids_m)
    conf["bairros"] = len(ids_b)
    conf["municipios_com_loja"] = {g: sum(1 for v in cm[g] if v) for g in GRUPOS}
    conf["bairros_com_loja"] = {g: sum(1 for v in cb[g] if v) for g in GRUPOS}
    conf["lojas_fora_de_bairro"] = sum(1 for l in L if not l["bai"])

    # UF, região e Brasil (valores para comparar)
    au, ar_, abr = agrega(uf_s, ufs), agrega(reg_s, reg_cod), agrega(np.zeros(len(X), dtype=int), [0])
    cu = contagem([l["uf"] for l in L], ufs)
    cr = contagem([l["uf"] // 10 for l in L], reg_cod)
    cbr = contagem([0] * nl, [0])
    comp = {"uf": {}, "reg": {}, "br": {}}
    lin = {"uf": [valores(au, cu, i) for i in range(len(ufs))],
           "reg": [valores(ar_, cr, i) for i in range(len(reg_cod))],
           "br": [valores(abr, cbr, 0)]}
    for nv, ls in lin.items():
        for k in ESC:
            comp[nv][k] = [None if x[k] is None else round(x[k], 4) for x in ls]
    if comp["br"]["f_n_todas"][0] != nl or sum(comp["uf"]["f_n_todas"]) != nl:
        raise Falha("lojas do Brasil diferentes da soma das UFs")
    for g, rs in GRUPOS.items():
        if comp["br"][f"f_n_{g}"][0] != sum(1 for l in L if l["rede"] in rs):
            raise Falha(f"lojas de {g} diferentes das do 2_lojas.py")
    conf["brasil"] = {k: comp["br"][k][0] for k in ESC}

    # ── entorno de cada loja ──────────────────────────────────────────────────
    arvore = cKDTree(P3)
    Q = xyz(lx, ly)
    base = {k: z[k].astype(float) for k in ("pop", "dom", "renda_num", "renda_den", "cob_p", "cob_d", "cob_r", "pop_fcu")}
    cont = {k: z[f"cont_{k}"].astype(float) for k, _ in TAXAS}
    arv_r = {r_: cKDTree(xyz(lx[rede == r_], ly[rede == r_])) for r_ in REDES}
    k_r = {r_: np.flatnonzero(rede == r_) for r_ in REDES}
    entorno = {}
    for raio in RAIOS:
        viz = arvore.query_ball_point(Q, corda(raio))
        col = {k: [None] * nl for k in ("n", "pop", "dom", "renda_resp", "pct_fcu", "cob_p", *[t for t, _ in TAXAS])}
        fx = {t: [] for t, _ in TAXAS}
        for k in range(nl):
            j = np.asarray(viz[k], dtype=int)
            if len(j):
                j = j[hav(X[j], Y[j], lx[k], ly[k]) <= raio]
            s = {nm: float(v[j].sum()) for nm, v in base.items()}
            col["n"][k] = len(j)
            col["pop"][k] = s["pop"]
            col["dom"][k] = s["dom"]
            p = s["pop"]
            col["renda_resp"][k] = (s["renda_num"] / s["renda_den"]
                                    if s["renda_den"] and p and s["cob_r"] / p >= COB_MIN else None)
            col["pct_fcu"][k] = 100 * s["pop_fcu"] / p if p else None
            col["cob_p"][k] = 100 * s["cob_p"] / p if p else None
            for t, gb in TAXAS:
                nl_, nh, dl, dh = (float(x) for x in cont[t][j].sum(axis=0)) if len(j) else (0, 0, 0, 0)
                cob = s["cob_p"] if gb == "p" else (s["cob_d"] if gb == "d" else p)
                if not p or cob / p < COB_MIN or not dh > 0 or not dl > 0:
                    continue
                lo, hi = 100 * nl_ / dh, 100 * nh / dl
                col[t][k] = (lo + hi) / 2
                if arred(lo, 10) != arred(hi, 10):
                    fx[t].append((k, lo, hi))
        # outras lojas das três redes no raio
        lojas = {}
        for r_ in REDES:
            vz = arv_r[r_].query_ball_point(Q, corda(raio))
            v = []
            for k in range(nl):
                o = k_r[r_][np.asarray(vz[k], dtype=int)] if vz[k] else np.array([], dtype=int)
                o = o[o != k]
                v.append(int((hav(lx[o], ly[o], lx[k], ly[k]) <= raio).sum()) if len(o) else 0)
            lojas[r_] = confere_col(v, 1, f"lojas no raio {raio} {r_}")
        esc_e = {"n": 1, "pop": 1, "dom": 1, "renda_resp": 1, "pct_fcu": 10, "cob_p": 10, **{t: 10 for t, _ in TAXAS}}
        entorno[str(raio)] = {
            "c": {k: confere_col(v, esc_e[k], f"entorno {raio} {k}") for k, v in col.items()},
            "fx": {t: [enc_ids([a for a, _, _ in f]), confere_col([b for _, b, _ in f], 10, f"fx {t}"),
                       confere_col([c for _, _, c in f], 10, f"fx {t}")] for t, f in fx.items() if f},
            "lojas": lojas, "esc": esc_e}
        print(f"entorno de {raio} m: mediana de {int(np.median([len(x) for x in viz]))} setores candidatos por loja")

    # loja mais próxima de cada rede (da mesma rede: a outra mais perto)
    perto = {}
    for r_ in REDES:
        dd, jj = arv_r[r_].query(Q, k=2)
        ks, ds = [], []
        for k in range(nl):
            cand = [int(k_r[r_][j]) for j in jj[k] if int(k_r[r_][j]) != k]
            o = cand[0]
            ks.append(o)
            ds.append(float(hav(lx[o], ly[o], lx[k], ly[k])))
        perto[r_] = {"k": ks, "d": confere_col(ds, 1, f"perto {r_}")}

    # ── lojas ──────────────────────────────────────────────────────────────────
    pos_cnes = {l["cnes"]: k for k, l in enumerate(L)}
    marcas = L_["marcas"]
    lojas = {
        "n": nl, "xy": enc_pts([(l["x"], l["y"]) for l in L]),
        "rede": [REDES.index(l["rede"]) for l in L], "marca": [marcas.index(l["marca"]) for l in L],
        "classe": [CLASSES.index(l["classe"]) for l in L],
        **{k: [l[k] for l in L] for k in ("cnes", "cnpj", "fantasia", "end", "bairro_cnes", "cep", "mun", "incerteza_m",
                                           "dist_cnes_geocodebr_m", "precisao_geocodebr", "atualizado")},
        "bai": [l["bai"] or 0 for l in L], "cnes_fora": [1 if l["cnes_fora_do_municipio"] else 0 for l in L],
        "mesmo_end": [[pos_cnes[c] for c in l["mesmo_end"]] for l in L],
        "perto_50m": [[pos_cnes[c] for c in l["perto_50m"]] for l in L],
    }
    nome_bai = {c: n for s_ in SIGLAS for c, n in zip(regs[s_]["bai"]["ids"], regs[s_]["bai"]["nomes"])}
    bairros = {str(b): nome_bai[b] for b in sorted({l["bai"] for l in L if l["bai"]})}
    conf["lojas"] = L_["conferencia"]
    conf["setores"] = json.loads((INTER / "setores_conferencia.json").read_text(encoding="utf-8"))

    redes = [{"id": r_, "nome": L_["redes"][r_]["nome"], "cor": COR[r_],
              "empresas": [{"raiz": k, "nome": v} for k, v in L_["redes"][r_]["empresas"].items()],
              "n": int((rede == r_).sum())} for r_ in REDES]
    saida = {"v": VERSAO, "gerado_em": dt.date.today().isoformat(), "fontes": FONTES,
             "cats": [{"id": c, "n": n} for c, n in CATS], "catalogo": CATALOGO, "comp": comp,
             "redes": redes, "marcas": marcas, "classes": CLASSES, "prec_pts": PREC_PTS,
             "raios": list(RAIOS), "raio_cob": RAIO_COB, "regra": {"cob_min": COB_MIN},
             "taxas": [t for t, _ in TAXAS], "competencia": L_["competencia"],
             "lojas": lojas, "bairros": bairros, "entorno": entorno, "perto": perto, "regioes": regioes, "conferencia": conf}
    DADOS.mkdir(parents=True, exist_ok=True)
    arq = DADOS / "farmacias.js"
    arq.write_text("window.ATLAS2_FARM=" + json.dumps(saida, ensure_ascii=False, separators=(",", ":")) + ";\n",
                   encoding="utf-8")
    print(json.dumps({"lojas": nl, "por_rede": Counter(l["rede"] for l in L), "brasil": conf["brasil"],
                      "municipios_com_loja": conf["municipios_com_loja"]}, ensure_ascii=False, indent=1))
    print(f"gravado {arq} ({arq.stat().st_size / 1e6:.2f} MB)")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Falha as e:
        print(f"PAROU: {e}", file=sys.stderr)
        sys.exit(1)
