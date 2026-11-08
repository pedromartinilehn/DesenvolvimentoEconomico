"""Mapa do Sul e Sudeste: setores (fundo), lojas Panvel e pontos de oportunidade."""
import json
import pathlib
import sys

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patheffects as pe
import numpy as np

RAIZ = pathlib.Path(sys.argv[1]); R = json.load(open(sys.argv[2], encoding='utf-8')); OUT = sys.argv[3]
EXT = RAIZ / 'farmacias/brasil/extracao/fontes/intermediario'
z = np.load(EXT / 'setores.npz')
s = np.isin(z['uf'], [31, 32, 33, 35, 41, 42, 43]) & (z['pop'] > 0)
L = json.load(open(EXT / 'lojas.json', encoding='utf-8'))['lojas']
import sys as _s; _s.path.insert(0, str(pathlib.Path(__file__).resolve().parent)); from lojas_extra import lojas_extra
L = L + [d for d in lojas_extra(EXT.parent.parent, L) if d['entra']]  # registros Panvel ativos fora do tipo 43 (ver lojas_extra.py)
pv = np.array([(l['x'], l['y']) for l in L if l['rede'] == 'panvel'])
rd = np.array([(l['x'], l['y']) for l in L if l['rede'] == 'rd' and l['uf'] in (31, 32, 33, 35, 41, 42, 43)])

fig, ax = plt.subplots(figsize=(10, 10), dpi=220)
ax.scatter(z['x'][s], z['y'][s], s=0.35, c='#B4C1CE', linewidths=0, rasterized=True)
ax.scatter(rd[:, 0], rd[:, 1], s=3, c='#5F6F80', linewidths=0, label='Raia Drogasil')
ax.scatter(pv[:, 0], pv[:, 1], s=9, c='#E4572E', linewidths=0, label='Panvel')
H = R['pontos'][:45] + [h for h in R['pontos'] if h['uf'] in ('RS', 'SC', 'PR')][:10]
cor = {'casa': '#2A9D8F', 'SP': '#F4A261', 'novas': '#13315C'}
for h in H:
    g = 'casa' if h['uf'] in ('RS', 'SC', 'PR') else 'SP' if h['uf'] == 'SP' else 'novas'
    ax.scatter(h['lon'], h['lat'], s=max(h['perfil_sem_panvel_1km'] / 110, 25), facecolors='none', edgecolors=cor[g], linewidths=1.6)
rot = [('Rio de Janeiro', -43.2, -22.95, 0.9, -0.9), ('Belo Horizonte', -43.94, -19.93, 0.3, 0.2), ('Vitória', -40.3, -20.3, -0.2, 1.4),
       ('São Paulo', -46.65, -23.57, -2.6, 0.45), ('Santos', -46.33, -23.97, 0.25, -0.45), ('Campinas', -47.06, -22.9, -2.4, 0.35),
       ('Curitiba', -49.27, -25.43, -2.0, 0.1), ('Florianópolis', -48.55, -27.6, 0.3, -0.3),
       ('Porto Alegre', -51.2, -30.03, 0.3, -0.1)]
for n, lo, la, dx, dy in rot:
    ax.annotate(n, (lo, la), (lo + dx, la + dy), fontsize=11, color='#13315C', fontfamily='DejaVu Sans', fontweight='bold',
                path_effects=[pe.withStroke(linewidth=3, foreground='white')],
                arrowprops=dict(arrowstyle='-', color='#13315C', lw=0.6))
ax.set_aspect(1 / np.cos(np.radians(-24)))
ax.set_xlim(-58.2, -38.6); ax.set_ylim(-34.0, -14.0)
ax.axis('off')
fig.savefig(OUT, bbox_inches='tight', pad_inches=0.05, facecolor='white')
print('ok', OUT)
