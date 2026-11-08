"""Diagnóstico de localização da Panvel e oportunidades no Sul e no Sudeste.

    python3 analise_panvel.py <raiz_do_repo> <saida.json>

Usa só os dados do atlas das farmácias (CNES abr./2026 e setores do Censo 2022):
- setores: farmacias/brasil/extracao/fontes/intermediario/setores.npz
- lojas:   farmacias/brasil/extracao/fontes/intermediario/lojas.json
- nomes de municípios e bairros: atlas2/dados (decodificados com as funções de 3_monta.py)

Sem dado de venda. "Ticket alto" é aproximado pelo rendimento médio do responsável pelo domicílio.
"""
import importlib.util
import json
import pathlib
import sys

import numpy as np
from scipy.spatial import cKDTree

RAIZ = pathlib.Path(sys.argv[1])
SAIDA = pathlib.Path(sys.argv[2])
EXT = RAIZ / 'farmacias/brasil/extracao'
spec = importlib.util.spec_from_file_location('monta', EXT / '3_monta.py')
M = importlib.util.module_from_spec(spec)
spec.loader.exec_module(M)

R_TERRA = 6371008.8
UF_SIG = {31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP', 41: 'PR', 42: 'SC', 43: 'RS'}
ALVO = set(UF_SIG)
CASA = {41, 42, 43, 35}                     # UFs onde a Panvel já tem lojas

z = np.load(EXT / 'fontes/intermediario/setores.npz')
x, y, uf, mun, bai, pop = z['x'], z['y'], z['uf'], z['mun'], z['bai'], z['pop'].astype(float)
rn, rd = z['renda_num'].astype(float), z['renda_den'].astype(float)
c60 = z['cont_pct_60mais'].astype(float)
n60 = (c60[:, 0] + c60[:, 1]) / 2               # meio do intervalo do sigilo
d60 = (c60[:, 2] + c60[:, 3]) / 2
renda = np.where(rd > 0, rn / np.where(rd > 0, rd, 1), np.nan)
p60 = np.where(d60 > 0, 100 * n60 / np.where(d60 > 0, d60, 1), np.nan)
P = M.xyz(x, y)
arv = cKDTree(P)
C1, C2 = M.corda(1000), M.corda(2000)

L = json.load(open(EXT / 'fontes/intermediario/lojas.json', encoding='utf-8'))['lojas']
lx = np.array([l['x'] for l in L]); ly = np.array([l['y'] for l in L])
rede = np.array([l['rede'] for l in L]); luf = np.array([l['uf'] for l in L])
LP = M.xyz(lx, ly)
arvL = {r: cKDTree(LP[rede == r]) for r in ('panvel', 'rd', 'pm')}
idxL = {r: np.where(rede == r)[0] for r in ('panvel', 'rd', 'pm')}
assert (rede == 'panvel').sum() == 593

# nomes
regs, _ = M.le_atlas2()
nome_m, nome_b = {}, {}
for sig in regs:
    for c, n in zip(regs[sig]['mun']['ids'], regs[sig]['mun']['nomes']):
        nome_m[c] = n
    for c, n in zip(regs[sig]['bai']['ids'], regs[sig]['bai']['nomes']):
        nome_b[c] = n


def entorno(pts, corda):
    """Para cada ponto: moradores, renda média do responsável e % de 60+ dos setores a até o raio."""
    viz = arv.query_ball_point(pts, corda)
    out = []
    for v in viz:
        v = np.asarray(v, dtype=int)
        out.append((pop[v].sum(), rn[v].sum() / rd[v].sum() if rd[v].sum() else np.nan,
                    100 * n60[v].sum() / d60[v].sum() if d60[v].sum() else np.nan, len(v)))
    return np.array(out)


def q(a, p):
    return float(np.nanpercentile(a, p))


R = {'limites': 'Sem dado de venda: renda média do responsável (Censo 2022) como aproximação do poder de compra. Raio em linha reta.'}

# ── 1. perfil do entorno de 1 km das lojas, por rede, nas UFs do Sul e Sudeste ──
ufbase = {}
for u in ALVO:
    s = uf == u
    ufbase[UF_SIG[u]] = {'renda': rn[s].sum() / rd[s].sum(), 'p60': 100 * n60[s].sum() / d60[s].sum(), 'pop': pop[s].sum()}
R['uf_media'] = ufbase
perfil, ent_lojas = {}, {}
for r in ('panvel', 'rd', 'pm'):
    ii = idxL[r][np.isin(luf[idxL[r]], list(ALVO))]
    E = entorno(LP[ii], C1)
    ent_lojas[r] = (ii, E)
    rel_r = np.array([E[k, 1] / ufbase[UF_SIG[luf[i]]]['renda'] for k, i in enumerate(ii)])
    rel_6 = np.array([E[k, 2] - ufbase[UF_SIG[luf[i]]]['p60'] for k, i in enumerate(ii)])
    perfil[r] = {'lojas': int(len(ii)), 'pop1km_med': q(E[:, 0], 50), 'renda_med': q(E[:, 1], 50), 'p60_med': q(E[:, 2], 50),
                 'renda_p25': q(E[:, 1], 25), 'p60_p25': q(E[:, 2], 25), 'pop1km_p25': q(E[:, 0], 25),
                 'renda_rel_uf_med': q(rel_r, 50), 'pct_renda_acima_uf': float(100 * np.nanmean(rel_r > 1)),
                 'pct_p60_acima_uf': float(100 * np.nanmean(rel_6 > 0)), 'p60_dif_uf_med': q(rel_6, 50)}
R['perfil_1km'] = perfil

# perfil Panvel por UF
pu = {}
ii, E = ent_lojas['panvel']
for u in (43, 42, 41, 35):
    k = luf[ii] == u
    pu[UF_SIG[u]] = {'lojas': int(k.sum()), 'renda_med': q(E[k, 1], 50), 'p60_med': q(E[k, 2], 50), 'pop1km_med': q(E[k, 0], 50),
                     'uf_renda': ufbase[UF_SIG[u]]['renda'], 'uf_p60': ufbase[UF_SIG[u]]['p60']}
R['panvel_por_uf'] = pu

# ── 2. padrão revelado: cobertura da Panvel por faixa de renda e de 60+, nas UFs da casa (RS, SC, PR) ──
dP, _ = arvL['panvel'].query(P)
dR, _ = arvL['rd'].query(P)
dist_p = 2 * R_TERRA * np.arcsin(np.clip(dP / 2, 0, 1))
dist_r = 2 * R_TERRA * np.arcsin(np.clip(dR / 2, 0, 1))
casa = np.isin(uf, [41, 42, 43]) & (pop > 0) & ~np.isnan(renda) & ~np.isnan(p60)
w = pop[casa]


def faixas(v, nq):
    o = np.argsort(v); cw = np.cumsum(w[o]) / w.sum()
    f = np.empty(len(v), int); f[o] = np.minimum((cw * nq).astype(int), nq - 1)
    return f


fr, f6 = faixas(renda[casa], 5), faixas(p60[casa], 5)
cob = {'renda': [], 'p60': []}
for nome, f, val in (('renda', fr, renda[casa]), ('p60', f6, p60[casa])):
    for k in range(5):
        s = f == k
        cob[nome].append({'faixa': k + 1, 'min': float(val[s].min()), 'max': float(val[s].max()),
                          'panvel_1km': float(100 * w[s & (dist_p[casa] <= 1000)].sum() / w[s].sum()),
                          'rd_1km': float(100 * w[s & (dist_r[casa] <= 1000)].sum() / w[s].sum())})
# matriz renda × 60+ (tercis) para a Panvel
t_r, t_6 = faixas(renda[casa], 3), faixas(p60[casa], 3)
mat = [[float(100 * w[(t_r == a) & (t_6 == b) & (dist_p[casa] <= 1000)].sum() / w[(t_r == a) & (t_6 == b)].sum())
        for b in range(3)] for a in range(3)]
R['cobertura_casa'] = cob
R['matriz_renda_60_casa'] = mat

# ── 3. oportunidades: setores com o perfil típico do entorno da Panvel e sem Panvel a até 1 km ──
T_R, T_6, T_POP = perfil['panvel']['renda_med'], perfil['panvel']['p60_med'], perfil['panvel']['pop1km_p25']
R['criterio'] = {'renda_min': T_R, 'p60_min': T_6, 'pop1km_min': T_POP}
alvo = np.isin(uf, list(ALVO)) & (pop > 0)
perf = alvo & (renda >= T_R) & (p60 >= T_6)
sem = perf & (dist_p > 1000)
R['setores_perfil'] = {'pop_perfil': float(pop[perf].sum()), 'pop_perfil_sem_panvel': float(pop[sem].sum()),
                       'por_uf': {UF_SIG[u]: {'perfil': float(pop[perf & (uf == u)].sum()), 'sem_panvel': float(pop[sem & (uf == u)].sum())}
                                  for u in ALVO}}

# por município
mu = {}
lm = np.array([l['mun'] for l in L])
for m in np.unique(mun[alvo]):
    s = mun == m
    ps = float(pop[sem & s].sum())
    if ps <= 0:
        continue
    mu[int(m)] = {'mun': nome_m.get(int(m), str(m)), 'uf': UF_SIG[int(m) // 100000], 'pop': float(pop[s].sum()),
                  'renda': float(rn[s].sum() / rd[s].sum()), 'p60': float(100 * n60[s].sum() / d60[s].sum()),
                  'perfil_sem_panvel': ps, 'perfil': float(pop[perf & s].sum()),
                  'panvel': int(((lm == m) & (rede == 'panvel')).sum()), 'rd': int(((lm == m) & (rede == 'rd')).sum()),
                  'pm': int(((lm == m) & (rede == 'pm')).sum())}
R['municipios'] = sorted(mu.values(), key=lambda d: -d['perfil_sem_panvel'])[:120]

# pontos quentes: cada setor sem Panvel; soma dos moradores com perfil sem Panvel a até 1 km
cand = np.where(sem)[0]
viz = arv.query_ball_point(P[cand], C1)
score = np.array([pop[np.asarray(v, int)][sem[np.asarray(v, int)]].sum() for v in viz])
tot = np.array([pop[np.asarray(v, int)].sum() for v in viz])
ok = tot >= T_POP
ordem = cand[ok][np.argsort(-score[ok])]
sc = dict(zip(cand, score)); tt = dict(zip(cand, tot))
esc, eP = [], []
arv_esc = None
for c in ordem:
    if eP and min(np.linalg.norm(np.array(eP) - P[c], axis=1)) < C2 * 1.25:   # 2,5 km entre pontos escolhidos
        continue
    esc.append(c); eP.append(P[c])
    if len(esc) >= 3000:
        break
H = []
EN = entorno(P[esc], C1)
arvT = cKDTree(LP)
for k, c in enumerate(esc):
    near = {r: int(len(arvL[r].query_ball_point(P[c], C1))) for r in ('rd', 'pm', 'panvel')}
    dd, jj = arvT.query(P[c])
    dref = 2 * R_TERRA * np.arcsin(min(dd / 2, 1))
    ref = L[jj]['bairro_cnes'].strip().title() if dref <= 1500 and L[jj].get('bairro_cnes') else ''
    H.append({'uf': UF_SIG[int(uf[c])], 'mun': nome_m.get(int(mun[c]), ''), 'bairro': nome_b.get(int(bai[c]), '') if bai[c] > 0 else '', 'ref_cnes': ref, 'ref_dist_m': float(dref),
              'lon': float(x[c]), 'lat': float(y[c]), 'perfil_sem_panvel_1km': float(sc[c]), 'moradores_1km': float(EN[k, 0]),
              'renda_1km': float(EN[k, 1]), 'p60_1km': float(EN[k, 2]), 'rd_1km': near['rd'], 'pm_1km': near['pm'],
              'panvel_mais_proxima_km': float(dist_p[c] / 1000), 'casa': int(uf[c]) in CASA})
R['pontos'] = H

# ── 4. forças e ameaças: concentração e concorrência ──
tot_uf = {UF_SIG[u]: {r: int(((luf == u) & (rede == r)).sum()) for r in ('panvel', 'rd', 'pm')} for u in ALVO}
R['lojas_por_uf'] = tot_uf
ii, E = ent_lojas['panvel']
com_rd = np.array([len(arvL['rd'].query_ball_point(LP[i], C1)) for i in ii])
R['panvel_com_rd_1km'] = {'pct': float(100 * (com_rd > 0).mean()), 'media': float(com_rd.mean())}
# cobertura da população a até 1 km, por UF
R['cobertura_uf'] = {UF_SIG[u]: {'panvel': float(100 * pop[(uf == u) & (dist_p <= 1000)].sum() / pop[uf == u].sum()),
                                 'rd': float(100 * pop[(uf == u) & (dist_r <= 1000)].sum() / pop[uf == u].sum())} for u in ALVO}

SAIDA.write_text(json.dumps(R, ensure_ascii=False, indent=1), encoding='utf-8')
print(json.dumps({k: R[k] for k in ('perfil_1km', 'panvel_por_uf', 'criterio', 'setores_perfil', 'panvel_com_rd_1km', 'cobertura_uf',
                                    'lojas_por_uf', 'matriz_renda_60_casa')}, ensure_ascii=False, indent=1))
print(json.dumps(R['cobertura_casa'], ensure_ascii=False))
