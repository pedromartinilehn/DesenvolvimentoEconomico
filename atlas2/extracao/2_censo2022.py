#!/usr/bin/env python3
"""Censo 2022 por município e por bairro, a partir dos agregados por setor censitário.

    python3 extracao/2_censo2022.py

Lê os agregados por setor do Censo 2022 (IBGE) na forma em que o IPEA os publica
para o pacote censobr (arquivos Parquet nas releases do repositório
ipea/censobr_prep_data no GitHub): básico, pessoas, domicílio, renda do
responsável e entorno. Soma os setores por bairro, município, UF, região e Brasil.

Sigilo do IBGE: no setor, o IBGE omite as contagens de 1 e 2 (os zeros ficam) e,
nos setores com poucos domicílios, omite tudo menos o básico. Regras do Atlas,
que não estima nem completa valor:

- quando as categorias de uma variável somam o total do setor (idade, sexo,
  alfabetização, espécie do domicílio, água, banheiro, esgoto, lixo, entorno) e
  só uma delas foi omitida, ela é o total menos as outras: conta exata;
- quando duas ou mais foram omitidas, cada uma fica entre 1 e 2 e a soma delas é
  conhecida; o Atlas guarda o mínimo e o máximo possíveis;
- cor ou raça não fecha o total (há pessoas sem declaração): só mínimo e máximo;
- setor com tudo omitido fica de fora, e o Atlas guarda a cobertura (a parte da
  população do bairro ou município que está nos setores com dado).

Confere antes de gravar e para se algo não bater:
- a população dos 5.570 municípios soma 203.080.756 (Censo 2022);
- cada setor está nos cinco arquivos com o mesmo município;
- nas categorias que fecham o total, o que falta está entre 1 e 2 por categoria
  omitida (se não estiver, a fonte mudou de regra);
- a população dos bairros não passa a do município.

Grava extracao/fontes/intermediario/censo2022.json, que o 4_monta.py lê.
Precisa de numpy e pyarrow. Os arquivos baixados ficam em extracao/fontes/censobr/.
"""

from __future__ import annotations

import json
import pathlib
import sys
import time
import urllib.request

import numpy as np
import pyarrow.parquet as pq

RAIZ = pathlib.Path(__file__).resolve().parent.parent
CENSOBR = RAIZ / "extracao" / "fontes" / "censobr"
SAIDA = RAIZ / "extracao" / "fontes" / "intermediario" / "censo2022.json"
RELEASE = "v1.0.0"
URL = "https://github.com/ipea/censobr_prep_data/releases/download/" + RELEASE + "/{}"
ARQ = {k: f"2022_tracts_{k}_{RELEASE}.parquet"
       for k in ("basico", "pessoas", "domicilio", "responsavelrenda", "entorno")}
POP_BRASIL = 203_080_756


class Falha(Exception):
    pass


def V(pref: str, a: int, b: int) -> list[str]:
    return [f"{pref}V{str(i).zfill(5)}" for i in range(a, b + 1)]


# grupo: (arquivo, total, categorias, as categorias somam o total?)
GRUPOS = {
    "idade":    ("pessoas", "demografia_V01006", V("demografia_", 1031, 1041), True),
    "sexo":     ("pessoas", "demografia_V01006", V("demografia_", 1007, 1008), True),
    "raca":     ("pessoas", "demografia_V01006", V("raca_", 1317, 1321), False),
    "alfab":    ("pessoas", "@15mais", ["alfabetizacao_V00900", "alfabetizacao_V00901"], True),
    "especie":  ("domicilio", "domicilio01_V00001", V("domicilio01_", 47, 52), True),
    "abast":    ("domicilio", "domicilio01_V00001", V("domicilio02_", 111, 118), True),
    "aguaenc":  ("domicilio", "domicilio01_V00001", V("domicilio02_", 199, 201), True),
    "banheiro": ("domicilio", "domicilio01_V00001", V("domicilio02_", 232, 238), True),
    "esgoto":   ("domicilio", "domicilio01_V00001", V("domicilio02_", 309, 316), True),
    "lixo":     ("domicilio", "domicilio01_V00001", V("domicilio02_", 397, 402), True),
    "pav":      ("entorno", "moradores_V05200", V("moradores_", 5206, 5208), True),
    "bueiro":   ("entorno", "moradores_V05200", V("moradores_", 5209, 5211), True),
    "ilum":     ("entorno", "moradores_V05200", V("moradores_", 5212, 5214), True),
    "onibus":   ("entorno", "moradores_V05200", V("moradores_", 5215, 5217), True),
    "bici":     ("entorno", "moradores_V05200", V("moradores_", 5218, 5220), True),
    "calcada":  ("entorno", "moradores_V05200", V("moradores_", 5221, 5223), True),
    "obst":     ("entorno", "moradores_V05200", V("moradores_", 5224, 5226), True),
    "rampa":    ("entorno", "moradores_V05200", V("moradores_", 5227, 5229), True),
    "arvore":   ("entorno", "moradores_V05200", V("moradores_", 5230, 5234), True),
}

# indicador: (grupo, categorias do numerador, denominador, multiplicador)
# denominador "total" = total do grupo; (grupo, categorias) = razão entre partes
IND = {
    "pct_0a14":        ("idade", V("demografia_", 1031, 1033), "total", 100),
    "pct_15a29":       ("idade", V("demografia_", 1034, 1036), "total", 100),
    "pct_60mais":      ("idade", V("demografia_", 1040, 1041), "total", 100),
    "ind_envelhec":    ("idade", V("demografia_", 1040, 1041), ("idade", V("demografia_", 1031, 1033)), 100),
    "razao_sexo":      ("sexo", ["demografia_V01007"], ("sexo", ["demografia_V01008"]), 100),
    "pct_branca":      ("raca", ["raca_V01317"], "total", 100),
    "pct_preta":       ("raca", ["raca_V01318"], "total", 100),
    "pct_parda":       ("raca", ["raca_V01320"], "total", 100),
    "pct_negra":       ("raca", ["raca_V01318", "raca_V01320"], "total", 100),
    "pct_indigena":    ("raca", ["raca_V01321"], "total", 100),
    "pct_amarela":     ("raca", ["raca_V01319"], "total", 100),
    "tx_analf":        ("alfab", ["alfabetizacao_V00901"], "total", 100),
    "pct_agua_rede":   ("abast", ["domicilio02_V00111"], "total", 100),
    "pct_agua_poco":   ("abast", ["domicilio02_V00112", "domicilio02_V00113"], "total", 100),
    "pct_agua_dentro": ("aguaenc", ["domicilio02_V00199"], "total", 100),
    "pct_agua_naoenc": ("aguaenc", ["domicilio02_V00201"], "total", 100),
    "pct_banheiro":    ("banheiro", V("domicilio02_", 232, 235), "total", 100),
    "pct_sem_banheiro": ("banheiro", ["domicilio02_V00238"], "total", 100),
    "pct_esgoto_rede": ("esgoto", ["domicilio02_V00309", "domicilio02_V00310"], "total", 100),
    "pct_esgoto_fossa": ("esgoto", ["domicilio02_V00311"], "total", 100),
    "pct_esgoto_precario": ("esgoto", V("domicilio02_", 312, 316), "total", 100),
    "pct_lixo_coleta": ("lixo", ["domicilio02_V00397", "domicilio02_V00398"], "total", 100),
    "pct_lixo_queima": ("lixo", ["domicilio02_V00399"], "total", 100),
    "pct_casa":        ("especie", ["domicilio01_V00047"], "total", 100),
    "pct_apto":        ("especie", ["domicilio01_V00049"], "total", 100),
    "pct_comodos":     ("especie", ["domicilio01_V00050"], "total", 100),
    "pct_pav":         ("pav", ["moradores_V05206"], "total", 100),
    "pct_bueiro":      ("bueiro", ["moradores_V05209"], "total", 100),
    "pct_ilum":        ("ilum", ["moradores_V05212"], "total", 100),
    "pct_onibus":      ("onibus", ["moradores_V05215"], "total", 100),
    "pct_bici":        ("bici", ["moradores_V05218"], "total", 100),
    "pct_calcada":     ("calcada", ["moradores_V05221"], "total", 100),
    "pct_obstaculo":   ("obst", ["moradores_V05224"], "total", 100),
    "pct_rampa":       ("rampa", ["moradores_V05227"], "total", 100),
    "pct_arvore":      ("arvore", V("moradores_", 5231, 5233), "total", 100),
}


def baixa(nome: str) -> pathlib.Path:
    destino = CENSOBR / nome
    if destino.exists() and destino.stat().st_size > 0:
        return destino
    CENSOBR.mkdir(parents=True, exist_ok=True)
    parcial = destino.with_suffix(".parcial")
    for espera in (0, 2, 4, 8, 16):
        time.sleep(espera)
        try:
            with urllib.request.urlopen(URL.format(nome), timeout=900) as r, open(parcial, "wb") as f:
                while True:
                    bloco = r.read(1 << 20)
                    if not bloco:
                        break
                    f.write(bloco)
            parcial.replace(destino)
            return destino
        except OSError as e:
            print(f"  falha ao baixar {nome}: {e}")
    raise Falha(f"não consegui baixar {URL.format(nome)}")


def coluna(tab, nome: str) -> np.ndarray:
    """Coluna como float64, com NaN onde o IBGE omitiu o valor."""
    if nome not in tab.column_names:
        raise Falha(f"coluna {nome} não está no arquivo (a fonte mudou?)")
    return tab[nome].to_numpy(zero_copy_only=False).astype("float64")


def parte(P: np.ndarray, sel: np.ndarray, r_lo: np.ndarray, r_hi: np.ndarray, identidade: bool,
          total: np.ndarray):
    """Mínimo e máximo da soma das categorias selecionadas, setor a setor.

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


def main() -> int:
    tabs = {}
    for k, nome in ARQ.items():
        tabs[k] = pq.read_table(baixa(nome))
    base = tabs["basico"]
    setor = base["code_tract"].to_numpy().astype("int64")
    ordem = np.argsort(setor)
    if len(np.unique(setor)) != len(setor):
        raise Falha("setor repetido no arquivo básico")
    mun = base["code_muni"].to_numpy(zero_copy_only=False)
    tem_mun = np.array([m is not None and not (isinstance(m, float) and np.isnan(m)) for m in mun])
    mun = np.where(tem_mun, mun, 0).astype("float64").astype("int64")
    bai_raw = base["code_neighborhood"].to_numpy(zero_copy_only=False).astype("float64")
    tem_bai = ~np.isnan(bai_raw)
    bai = np.where(tem_bai, bai_raw, 0).astype("int64")
    uf = base["code_state"].to_numpy().astype("int64")
    reg = base["code_region"].to_numpy().astype("int64")
    pop = coluna(base, "V0001")
    if np.isnan(pop).any():
        raise Falha("população omitida em algum setor: a fonte mudou")
    if int(pop[tem_mun].sum()) != POP_BRASIL:
        raise Falha(f"população dos municípios soma {int(pop[tem_mun].sum()):,}, esperado {POP_BRASIL:,}")
    n = len(setor)

    # alinha cada arquivo com o básico, pelo código do setor
    def alinha(k: str) -> np.ndarray:
        t = tabs[k]
        s = t["code_tract"].to_numpy().astype("int64")
        pos = np.searchsorted(setor, s, sorter=ordem)
        pos = ordem[np.clip(pos, 0, n - 1)]
        if not np.array_equal(setor[pos], s):
            raise Falha(f"{k}: setor que não está no arquivo básico")
        m = t["code_muni"].to_numpy(zero_copy_only=False).astype("float64")
        ok = np.isnan(m) | (m.astype("int64", copy=False) == mun[pos]) | ~tem_mun[pos]
        if not ok.all():
            raise Falha(f"{k}: setor com município diferente do básico")
        return pos
    pos = {k: alinha(k) for k in tabs if k != "basico"}

    def col(k: str, nome: str) -> np.ndarray:
        """Coluna de um arquivo, na ordem do básico; setor ausente no arquivo = NaN."""
        out = np.full(n, np.nan)
        out[pos[k]] = coluna(tabs[k], nome)
        return out

    # ── grupos: mínimo e máximo de cada categoria ───────────────────────────
    cache_P, cache_T, cache_R = {}, {}, {}
    conf = {"setores": int(n), "populacao": int(pop[tem_mun].sum())}
    ordem_grupos = ["idade"] + [g for g in GRUPOS if g != "idade"]
    for g in ordem_grupos:
        arq, total, cats, ident = GRUPOS[g]
        P = np.column_stack([col(arq, c) for c in cats])
        if total == "@15mais":                  # pessoas de 15 anos ou mais = faixas 15-19 a 70+
            sel = np.array([c in V("demografia_", 1034, 1041) for c in GRUPOS["idade"][2]])
            t_lo, t_hi = parte(cache_P["idade"], sel, *cache_R["idade"], True, cache_T["idade"])
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
        conf[f"setores_omitidos_{g}"] = int((~valido & (pop > 0)).sum())

    # ── unidades ────────────────────────────────────────────────────────────
    niveis = {}
    chaves = {
        "mun": np.where(tem_mun, mun, -1),
        "bai": np.where(tem_bai & tem_mun, bai, -1),
        "uf": np.where(tem_mun, uf, -1),
        "reg": np.where(tem_mun, reg, -1),
        "br": np.where(tem_mun, 0, -1),
    }
    for nv, ch in chaves.items():
        ids, inv = np.unique(ch, return_inverse=True)
        keep = ids >= 0
        mapa = np.full(len(ids), -1)
        mapa[keep] = np.arange(keep.sum())
        idx = mapa[inv]
        niveis[nv] = {"ids": ids[keep], "idx": idx, "m": int(keep.sum())}

    def soma(nv: str, v: np.ndarray, mascara: np.ndarray | None = None) -> np.ndarray:
        d = niveis[nv]
        ok = d["idx"] >= 0
        if mascara is not None:
            ok = ok & mascara
        return np.bincount(d["idx"][ok], weights=np.nan_to_num(v[ok]), minlength=d["m"])

    saida = {"fonte": "IBGE, Censo Demográfico 2022, agregados por setores censitários "
                      "(arquivos do pacote censobr, IPEA)", "niveis": {}, "conferencia": conf}
    area = coluna(base, "area_km2")
    dpo = coluna(base, "V0007")
    tipo = coluna(base, "code_type")
    urb = np.array([s == "Urbana" for s in base["situacao"].to_pylist()], dtype=bool)
    dppo = col("domicilio", "domicilio01_V00001")
    mor_dppo = col("domicilio", "domicilio01_V00005")
    resp = col("responsavelrenda", "V06001")
    renda = col("responsavelrenda", "V06004")
    ent_tot = col("entorno", "moradores_V05200")

    # setor que sozinho puxa a média do rendimento: o valor é o que o IBGE publica,
    # o Atlas só avisa (mais da metade da massa de renda com menos de um terço dos
    # responsáveis, e média mais de 4 vezes a dos outros setores)
    cob_r0 = ~np.isnan(resp) & ~np.isnan(renda)
    massa = np.where(cob_r0, np.nan_to_num(renda) * np.nan_to_num(resp), 0.0)
    atipico = {}
    for nv in ("mun", "bai"):
        d = niveis[nv]
        idx = d["idx"]
        ok = (idx >= 0) & cob_r0
        tot_m = np.bincount(idx[ok], weights=massa[ok], minlength=d["m"])
        tot_r = np.bincount(idx[ok], weights=resp[ok], minlength=d["m"])
        maior = {}
        for j in np.flatnonzero(ok):
            u = idx[j]
            if u not in maior or massa[j] > massa[maior[u]]:
                maior[u] = j
        out = [None] * d["m"]
        for u, j in maior.items():
            if tot_m[u] <= 0 or tot_r[u] <= resp[j]:
                continue
            sm, sr = massa[j] / tot_m[u], resp[j] / tot_r[u]
            resto = (tot_m[u] - massa[j]) / (tot_r[u] - resp[j])
            if sm > 0.5 and sr < 1 / 3 and resto > 0 and renda[j] > 4 * resto:
                out[u] = [int(setor[j]), round(float(renda[j]), 2), round(float(sm), 3), round(float(resto), 2)]
        atipico[nv] = out
        conf[f"renda_setor_atipico_{nv}"] = sum(1 for x in out if x)

    for nv, d in niveis.items():
        o = {"ids": d["ids"].tolist()}
        if nv in atipico:
            o["renda_atipico"] = atipico[nv]
        p = soma(nv, pop)
        o["pop"] = p.round().astype(int).tolist()
        o["dom"] = soma(nv, dpo).round().astype(int).tolist()
        o["area"] = soma(nv, area).round(4).tolist()
        o["pop_fcu"] = soma(nv, pop, tipo == 1).round().astype(int).tolist()
        o["pop_urb"] = soma(nv, pop, urb).round().astype(int).tolist()
        cob_dom = ~np.isnan(dppo) & ~np.isnan(mor_dppo)
        o["mor_dppo"] = soma(nv, mor_dppo, cob_dom).tolist()
        o["dppo"] = soma(nv, dppo, cob_dom).tolist()
        o["dom_improv"] = soma(nv, dpo - dppo, ~np.isnan(dppo)).round().astype(int).tolist()
        cob_r = ~np.isnan(resp) & ~np.isnan(renda)
        o["renda_num"] = soma(nv, renda * resp, cob_r).tolist()
        o["renda_den"] = soma(nv, resp, cob_r).tolist()
        o["ent_mor"] = soma(nv, ent_tot, ~np.isnan(ent_tot)).round().astype(int).tolist()
        o["cob"] = {
            "pessoas": soma(nv, pop, ~np.isnan(cache_T["idade"])).round().astype(int).tolist(),
            "domicilio": soma(nv, pop, ~np.isnan(dppo)).round().astype(int).tolist(),
            "renda": soma(nv, pop, cob_r).round().astype(int).tolist(),
        }
        o["ind"] = {}
        for ind, (g, cats, den, mult) in IND.items():
            arq, total, todas, ident = GRUPOS[g]
            P, T, (R_lo, R_hi) = cache_P[g], cache_T[g], cache_R[g]
            sel = np.array([c in cats for c in todas])
            n_lo, n_hi = parte(P, sel, R_lo, R_hi, ident, T)
            ok = ~np.isnan(T)
            if den == "total":
                if total == "@15mais":
                    sel15 = np.array([c in V("demografia_", 1034, 1041) for c in GRUPOS["idade"][2]])
                    d_lo, d_hi = parte(cache_P["idade"], sel15, *cache_R["idade"], True, cache_T["idade"])
                else:
                    d_lo = d_hi = T
            else:
                g2, cats2 = den
                P2, T2, (R2l, R2h) = cache_P[g2], cache_T[g2], cache_R[g2]
                sel2 = np.array([c in cats2 for c in GRUPOS[g2][2]])
                d_lo, d_hi = parte(P2, sel2, R2l, R2h, GRUPOS[g2][3], T2)
            NL, NH = soma(nv, n_lo, ok), soma(nv, n_hi, ok)
            DL, DH = soma(nv, d_lo, ok), soma(nv, d_hi, ok)
            with np.errstate(divide="ignore", invalid="ignore"):
                lo = np.where(DH > 0, mult * NL / DH, np.nan)
                hi = np.where(DL > 0, mult * NH / DL, np.nan)
            o["ind"][ind] = [[None if np.isnan(x) else round(float(x), 4) for x in lo],
                             [None if np.isnan(x) else round(float(x), 4) for x in hi]]
        saida["niveis"][nv] = o

    # ── conferências ───────────────────────────────────────────────────────
    m, b = saida["niveis"]["mun"], saida["niveis"]["bai"]
    if len(m["ids"]) != 5570 or len(b["ids"]) != 17575:
        raise Falha(f"{len(m['ids'])} municípios e {len(b['ids'])} bairros")
    if sum(m["pop"]) != POP_BRASIL or saida["niveis"]["br"]["pop"][0] != POP_BRASIL:
        raise Falha("a soma dos municípios não dá a população do Brasil")
    pop_m = dict(zip(m["ids"], m["pop"]))
    soma_b = {}
    for cb, pb in zip(b["ids"], b["pop"]):
        soma_b[cb // 1000] = soma_b.get(cb // 1000, 0) + pb
    excede = [c for c, v in soma_b.items() if v > pop_m[c]]
    if excede:
        raise Falha(f"bairros com mais gente que o município: {excede[:5]}")
    br = saida["niveis"]["br"]
    conf["brasil"] = {k: br["ind"][k] for k in ("tx_analf", "pct_parda", "pct_branca", "pct_preta",
                                               "pct_indigena", "pct_amarela", "pct_esgoto_rede",
                                               "pct_agua_rede", "pct_lixo_coleta")}
    # largura dos intervalos: quantas unidades têm mínimo e máximo distantes
    larg = {}
    for nv in ("mun", "bai"):
        o = saida["niveis"][nv]
        larg[nv] = {}
        for ind, (lo, hi) in o["ind"].items():
            w = [h - l for l, h in zip(lo, hi) if l is not None and h is not None]
            larg[nv][ind] = {"p50": round(float(np.median(w)), 3) if w else None,
                             "p95": round(float(np.percentile(w, 95)), 3) if w else None,
                             "acima_0_1": int(sum(1 for x in w if x > 0.1))}
    conf["largura_intervalo"] = larg
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(saida, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(json.dumps({k: v for k, v in conf.items() if k != "largura_intervalo"}, ensure_ascii=False, indent=1))
    print(f"gravado {SAIDA} ({SAIDA.stat().st_size / 1e6:.1f} MB)")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Falha as e:
        print(f"PAROU: {e}", file=sys.stderr)
        sys.exit(1)
