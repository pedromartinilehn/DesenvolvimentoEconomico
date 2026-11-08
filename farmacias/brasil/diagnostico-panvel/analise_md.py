"""Análises sugeridas no documento estratégico, com os dados do atlas das farmácias.

    python3 analise_md.py <raiz> <saida.json>

A. Cidades médias (50 a 200 mil hab.) do Sul sem Panvel no CNES (qualquer tipo de registro da Dimed): renda, 60+, crescimento 2010–2022, PIB per capita, Raia.
B. Última milha: parte dos moradores de alta renda (10% mais ricos de cada cidade, por setor) a até 1,5 km de uma Panvel e de uma Raia.
C. Aglomeração (Hotelling): distância de cada Panvel à Raia mais próxima; distância de cada loja à loja mais próxima da mesma rede.
D. Microestrutura do entorno de 500 m: ponto de ônibus, calçada e pavimentação.
E. Perfis de loja Panvel (k-médias com renda, 60+ e moradores a 1 km).
"""
import importlib.util, json, pathlib, sys
import numpy as np
from scipy.spatial import cKDTree

RAIZ = pathlib.Path(sys.argv[1]); SAIDA = pathlib.Path(sys.argv[2])
EXT = RAIZ / 'farmacias/brasil/extracao'
spec = importlib.util.spec_from_file_location('m', EXT / '3_monta.py'); M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
RT = 6371008.8
z = np.load(EXT / 'fontes/intermediario/setores.npz')
x, y, uf, mun, pop = z['x'], z['y'], z['uf'], z['mun'], z['pop'].astype(float)
rn, rd_ = z['renda_num'].astype(float), z['renda_den'].astype(float)
renda = np.where(rd_ > 0, rn / np.where(rd_ > 0, rd_, 1), np.nan)
c60 = z['cont_pct_60mais'].astype(float); n60, d60 = c60[:, :2].mean(1), c60[:, 2:].mean(1)
P = M.xyz(x, y); arv = cKDTree(P)
L = json.load(open(EXT / 'fontes/intermediario/lojas.json', encoding='utf-8'))['lojas']
import sys as _s; _s.path.insert(0, str(pathlib.Path(__file__).resolve().parent)); from lojas_extra import lojas_extra
L = L + [d for d in lojas_extra(EXT, L) if d['entra']]  # registros Panvel ativos fora do tipo 43 (ver lojas_extra.py)
rede = np.array([l['rede'] for l in L]); LP = M.xyz([l['x'] for l in L], [l['y'] for l in L]); lmun = np.array([l['mun'] for l in L]); luf = np.array([l['uf'] for l in L])
farm43 = np.array(['tp_unidade' not in l for l in L])  # A e B usam todos os pontos da Panvel; C, D e E (perfil das lojas) só as farmácias tipo 43
T = {r: cKDTree(LP[rede == r]) for r in ('panvel', 'rd', 'pm')}
T43 = {r: cKDTree(LP[(rede == r) & farm43]) for r in ('panvel', 'rd', 'pm')}
dist = lambda c: 2 * RT * np.arcsin(np.clip(c / 2, 0, 1))
R = {}

# nomes e indicadores municipais do Atlas 2.0
s = open(RAIZ / 'atlas2/dados/brasil.js', encoding='utf-8').read(); BR = json.loads(s[s.index('=') + 1:].rstrip().rstrip(';'))
esc = {c['id']: c.get('esc', 1) for c in BR['catalogo']}
MU = {}
for sig in ('S', 'SE'):
    t = open(RAIZ / f'atlas2/dados/regiao-{sig.lower()}.js', encoding='utf-8').read(); G = json.loads(t[t.index(f'["{sig}"]=') + len(sig) + 5:].rstrip().rstrip(';'))
    ids = M.dec_ids(G['mun']['ids']); nomes = G['mun']['nomes'] if isinstance(G['mun']['nomes'], list) else json.loads(G['mun']['nomes'].replace("'", '"'))
    cols = {k: M.dec_nums(G['mun']['c'][k]) for k in ('pop', 'var_pop', 'pib_pc', 'renda_resp', 'pct_60mais', 'pct_onibus', 'pct_calcada', 'pct_pav')}
    for i, c in enumerate(ids):
        MU[c] = {'nome': nomes[i], **{k: (None if v[i] == 0 else (v[i] - 1) / esc[k]) for k, v in cols.items()}}
assert abs(MU[4314902]['pop'] - 1332845) < 2

# A. cidades médias do Sul
cont = lambda r, m: int(((rede == r) & (lmun == m)).sum())
med = []
for c, m in MU.items():
    if c // 100000 in (41, 42, 43) and m['pop'] and 50000 <= m['pop'] <= 200000:
        med.append({'cod': c, 'uf': {41: 'PR', 42: 'SC', 43: 'RS'}[c // 100000], **m, 'panvel': cont('panvel', c), 'rd': cont('rd', c), 'pm': cont('pm', c)})
def pr(v, k):
    a = np.array([d[k] for d in med], float); return float((a < v).mean())
for d in med:
    d['score'] = (pr(d['renda_resp'], 'renda_resp') + pr(d['pct_60mais'], 'pct_60mais') + pr(d['var_pop'], 'var_pop')) / 3
semP = sorted([d for d in med if d['panvel'] == 0], key=lambda d: -d['score'])
R['cidades_medias'] = {'n': len(med), 'com_panvel': sum(d['panvel'] > 0 for d in med), 'sem_panvel': len(semP),
                       'sem_panvel_com_rd': sum(d['rd'] > 0 for d in semP), 'com_panvel_sem_rd': sum(d['panvel'] > 0 and d['rd'] == 0 for d in med),
                       'por_uf': {u: [sum(1 for d in med if d['uf'] == u), sum(1 for d in med if d['uf'] == u and d['panvel'] > 0)] for u in ('RS', 'SC', 'PR')},
                       'top': semP[:12]}

# B. última milha: alta renda a até 1,5 km
dP, dR = dist(T['panvel'].query(P)[0]), dist(T['rd'].query(P)[0])
cid = {'Porto Alegre': 4314902, 'Curitiba': 4106902, 'Florianópolis': 4205407, 'Joinville': 4209102, 'Londrina': 4113700, 'São Paulo': 3550308}
B = {}
for n, c in cid.items():
    s_ = (mun == c) & (pop > 0) & ~np.isnan(renda)
    o = np.argsort(-renda[s_]); w = pop[s_][o]; cw = np.cumsum(w) / w.sum()
    top = np.zeros(s_.sum(), bool); top[o[cw <= 0.10]] = True
    idx = np.where(s_)[0][top]
    B[n] = {'pop_top10': float(pop[idx].sum()), 'renda_corte': float(renda[idx].min()),
            'panvel_1500': float(100 * pop[idx][dP[idx] <= 1500].sum() / pop[idx].sum()), 'rd_1500': float(100 * pop[idx][dR[idx] <= 1500].sum() / pop[idx].sum()),
            'lojas_panvel': int(((rede == 'panvel') & (lmun == c) & farm43).sum()), 'lojas_rd': cont('rd', c)}
R['ultima_milha'] = B

# C. aglomeração
iP = np.where((rede == 'panvel') & farm43)[0]
dPR = dist(T['rd'].query(LP[iP])[0])
R['panvel_ate_raia'] = {'mediana_m': float(np.median(dPR)), 'ate_200': float(100 * (dPR <= 200).mean()), 'ate_500': float(100 * (dPR <= 500).mean()),
                        'ate_1000': float(100 * (dPR <= 1000).mean())}
viz = {}
for r in ('panvel', 'rd'):
    ii = np.where((rede == r) & farm43)[0]
    dd = dist(T43[r].query(LP[ii], k=2)[0][:, 1])
    for n, c in (('Porto Alegre', 4314902), ('Curitiba', 4106902), ('São Paulo', 3550308)):
        k = lmun[ii] == c
        if k.sum() >= 5:
            viz.setdefault(n, {})[r] = {'lojas': int(k.sum()), 'mediana_m': float(np.median(dd[k]))}
R['vizinho_mesma_rede'] = viz

# D. microestrutura (entorno de 500 m)
C5 = M.corda(500)
def micro(ii):
    out = {}
    for k in ('pct_onibus', 'pct_calcada', 'pct_pav'):
        c = z['cont_' + k].astype(float); vals = []
        for v in arv.query_ball_point(LP[ii], C5):
            v = np.asarray(v, int); d = c[v, 2:].mean(1).sum()
            if d: vals.append(100 * c[v, :2].mean(1).sum() / d)
        out[k] = float(np.median(vals))
    return out
ufs_casa = np.isin(luf, [41, 42, 43])
R['micro_500m'] = {'panvel': micro(np.where((rede == 'panvel') & ufs_casa & farm43)[0]), 'rd': micro(np.where((rede == 'rd') & ufs_casa)[0]),
                   'media_RS_SC_PR': {k: float(np.mean([MU[c][k] for c in MU if c // 100000 in (41, 42, 43) and MU[c][k] is not None])) for k in ('pct_onibus', 'pct_calcada', 'pct_pav')}}
# média ponderada pela população (mais justa)
for k in ('pct_onibus', 'pct_calcada', 'pct_pav'):
    c = z['cont_' + k].astype(float); s_ = np.isin(uf, [41, 42, 43])
    R['micro_500m'].setdefault('pop_RS_SC_PR', {})[k] = float(100 * c[s_, :2].mean(1).sum() / c[s_, 2:].mean(1).sum())

# E. perfis de loja (k-médias)
C1 = M.corda(1000)
F = []
for v in arv.query_ball_point(LP[iP], C1):
    v = np.asarray(v, int); F.append((rn[v].sum() / rd_[v].sum(), 100 * n60[v].sum() / d60[v].sum(), pop[v].sum()))
F = np.array(F); okF = np.isfinite(F).all(1) & (F > 0).all(1); F = F[okF]; Xs = (np.log(F) - np.log(F).mean(0)) / np.log(F).std(0)
rng = np.random.default_rng(7); best = None
for _ in range(20):
    cen = Xs[rng.choice(len(Xs), 3, replace=False)]
    for _ in range(100):
        lab = np.argmin(((Xs[:, None] - cen[None]) ** 2).sum(2), 1)
        novo = np.array([Xs[lab == k].mean(0) if (lab == k).any() else cen[k] for k in range(3)])
        if np.allclose(novo, cen): break
        cen = novo
    sse = ((Xs - cen[lab]) ** 2).sum()
    if best is None or sse < best[0]: best = (sse, lab)
lab = best[1]
R['perfis'] = sorted([{'lojas': int((lab == k).sum()), 'renda': float(np.median(F[lab == k, 0])), 'p60': float(np.median(F[lab == k, 1])),
                       'pop1km': float(np.median(F[lab == k, 2]))} for k in range(3)], key=lambda d: -d['renda'])
SAIDA.write_text(json.dumps(R, ensure_ascii=False, indent=1, default=float), encoding='utf-8')
print(json.dumps({k: v for k, v in R.items() if k != 'cidades_medias'}, ensure_ascii=False, indent=1))
cm = R['cidades_medias']; print({k: v for k, v in cm.items() if k != 'top'})
for d in cm['top']:
    print(f"{d['uf']} {d['nome'][:22]:22s} pop={d['pop']:>7.0f} var={d['var_pop']:5.1f} renda={d['renda_resp']:5.0f} 60+={d['pct_60mais']:4.1f} pibpc={d['pib_pc']} rd={d['rd']} pm={d['pm']} score={d['score']:.2f}")
