"""Panvel em todo o CNES (competência abr./2026): registros, situação, qualidade do cadastro e cobertura frente aos releases.

    python3 analise_cnes_panvel.py <raiz do repositório> <saida.json>

Grava também registros-cnes-panvel.csv (todos os registros da Dimed, ativos e desativados) ao lado deste script.
Busca: todo registro com a raiz de CNPJ 92.665.611 (Dimed S.A.) no CNPJ ou no CNPJ da mantenedora, e todo registro com
PANVEL ou DIMED no nome fantasia ou na razão social (para achar a rede cadastrada com outro CNPJ).
"""
import collections as C
import csv
import datetime as dt
import json
import pathlib
import re
import sys

import numpy as np
import pyarrow.parquet as pq

RAIZ = pathlib.Path(sys.argv[1]); SAIDA = pathlib.Path(sys.argv[2])
EXT = RAIZ / 'farmacias/brasil/extracao'
ARQ = EXT / 'fontes/geobr_prep/healthfacilities_202604.parquet'
REF = dt.date(2026, 4, 30)
REL_UF = {'RS': 425, 'SC': 105, 'PR': 130, 'SP': 17}          # release 3T26 da Panvel, lojas em 30/09/2026
REL_TOTAL = 677
COLS = [c for c in pq.ParquetFile(ARQ).schema_arrow.names if c != 'geometry']
T = pq.read_table(ARQ, columns=COLS).to_pylist()
R = {'competencia': '2026-04', 'registros_cnes_total': len(T)}

up = lambda s: (s or '').upper()
dimed = [r for r in T if (r['nu_cnpj'] or '')[:8] == '92665611' or (r['nu_cnpj_mantenedora'] or '')[:8] == '92665611']
ids = {r['co_unidade'] for r in dimed}
por_nome = [r for r in T if r['co_unidade'] not in ids and re.search(r'\bPANVEL\b|\bDIMED\b', up(r['no_fantasia']) + ' ' + up(r['no_razao_social']))]
R['busca_por_nome_fora_do_cnpj'] = [{'mun': r['name_muni'], 'uf': r['abbrev_state'], 'fantasia': r['no_fantasia'], 'razao': r['no_razao_social'],
                                     'cnpj': r['nu_cnpj']} for r in por_nome]
at = [r for r in dimed if r['co_motivo_desab'] is None]
de = [r for r in dimed if r['co_motivo_desab'] is not None]
fil = lambda r: int(r['nu_cnpj'][8:12])

# 1. registros e situação
R['registros'] = {'total': len(dimed), 'ativos': len(at), 'desativados': len(de), 'cnpj_distintos': len({r['nu_cnpj'] for r in dimed}),
                  'ativos_por_tipo': dict(C.Counter(int(r['tp_unidade']) for r in at)),
                  'desativados_por_motivo': {str(k): v for k, v in sorted(C.Counter(int(r['co_motivo_desab']) for r in de).items())},
                  'razao_social_grafias': len({r['no_razao_social'] for r in dimed}),
                  'fantasia': dict(C.Counter(up(r['no_fantasia']) for r in at).most_common(6))}
R['ativos_outros_tipos'] = [{'mun': r['name_muni'], 'cnes': r['co_cnes'], 'tipo': int(r['tp_unidade']), 'end': f"{r['logradouro']}, {r['numero_endereco']}"}
                            for r in at if int(r['tp_unidade']) != 43]

# 2. por UF, contra o release
R['por_uf'] = {}
for u in ('RS', 'SC', 'PR', 'SP'):
    a = [r for r in at if r['abbrev_state'] == u]
    R['por_uf'][u] = {'ativos': len(a), 'release': REL_UF[u], 'cnes_sobre_release': 100 * len(a) / REL_UF[u], 'faltam': REL_UF[u] - len(a),
                      'desativados': sum(1 for r in de if r['abbrev_state'] == u), 'municipios': len({r['code_muni'] for r in a})}
R['total'] = {'ativos': len(at), 'release': REL_TOTAL, 'cnes_sobre_release': 100 * len(at) / REL_TOTAL, 'faltam': REL_TOTAL - len(at),
              'municipios': len({r['code_muni'] for r in at})}
R['fora_das_4_ufs'] = sum(1 for r in at if r['abbrev_state'] not in REL_UF)

# 3. municípios
mu = C.Counter((r['abbrev_state'], r['name_muni'], int(r['code_muni'])) for r in at)
R['municipios_top'] = [{'uf': u, 'mun': m, 'lojas': n} for (u, m, _), n in mu.most_common(15)]
R['municipios_com_1_loja'] = sum(1 for v in mu.values() if v == 1)
R['municipios_sp'] = sorted({m for (u, m, _) in mu if u == 'SP'})
# população e concorrência nos municípios com Panvel (setores do Censo 2022 e lojas do atlas)
z = np.load(EXT / 'fontes/intermediario/setores.npz')
popm = C.defaultdict(float)
for m_, p_ in zip(z['mun'], z['pop']):
    popm[int(m_)] += float(p_)
L = json.load(open(EXT / 'fontes/intermediario/lojas.json', encoding='utf-8'))['lojas']
cnt = C.Counter((l['rede'], l['mun']) for l in L)
cods = {c for (_, _, c) in mu}
faixas = [(0, 50e3, 'até 50 mil'), (50e3, 200e3, '50 a 200 mil'), (200e3, 1e6, '200 mil a 1 milhão'), (1e6, 1e9, 'mais de 1 milhão')]
R['municipios_por_porte'] = [{'faixa': n, 'municipios': sum(1 for c in cods if a <= popm[c] < b),
                              'lojas': sum(v for (_, _, c), v in mu.items() if a <= popm[c] < b)} for a, b, n in faixas]
R['municipios_concorrencia'] = {'com_raia': sum(1 for c in cods if cnt[('rd', c)] > 0), 'sem_raia': sum(1 for c in cods if cnt[('rd', c)] == 0),
                                'com_pague_menos': sum(1 for c in cods if cnt[('pm', c)] > 0),
                                'lojas_panvel_em_municipio_sem_raia': sum(v for (_, _, c), v in mu.items() if cnt[('rd', c)] == 0)}
casa = [c for c in popm if c // 100000 in (41, 42, 43)]
R['sul'] = {u: {'municipios': sum(1 for c in casa if c // 100000 == k), 'com_panvel': sum(1 for c in cods if c // 100000 == k),
                'pop_municipios_com_panvel_pct': 100 * sum(popm[c] for c in cods if c // 100000 == k) / sum(popm[c] for c in casa if c // 100000 == k)}
            for u, k in (('RS', 43), ('SC', 42), ('PR', 41))}

# 4. CNPJ de filial: ordem de abertura e reaproveitamento
dup = C.defaultdict(list)
for r in dimed:
    dup[r['nu_cnpj']].append(r)
reuso = [v for v in dup.values() if len(v) > 1]
R['cnpj_reaproveitado'] = {'n': len(reuso), 'exemplos': [{'cnpj': v[0]['nu_cnpj'], 'registros': [
    {'mun': r['name_muni'], 'end': f"{r['logradouro']}, {r['numero_endereco']}", 'ativo': r['co_motivo_desab'] is None} for r in v]} for v in reuso]}
pres = {fil(r) for r in at}
mx = max(pres)
R['cnpj_filial'] = {'maior_numero_ativo': mx, 'faixas': [{'faixa': f'{a}-{a + 49}', 'ativos': sum(1 for x in range(max(a, 1), a + 50) if x in pres),
                                                          'uf': dict(C.Counter(r['abbrev_state'] for r in at if a <= fil(r) < a + 50))}
                                                         for a in range(0, mx + 1, 50)],
                    'mediana_por_uf': {u: float(np.median([fil(r) for r in at if r['abbrev_state'] == u])) for u in REL_UF}}

# 5. desativações
R['desativados'] = [{'uf': r['abbrev_state'], 'mun': r['name_muni'], 'end': f"{r['logradouro']}, {r['numero_endereco']}", 'motivo': int(r['co_motivo_desab']),
                     'atualizado': r['to_char_dt_atualizacao_dd_mm_yyyy']} for r in de]
R['desativados_por_ano'] = dict(sorted(C.Counter(r['to_char_dt_atualizacao_dd_mm_yyyy'][-4:] for r in de).items()))
R['desativados_por_municipio'] = dict(C.Counter(r['name_muni'] for r in de).most_common(6))


# 6. qualidade do cadastro
def data(s):
    try:
        return dt.datetime.strptime(s, '%d/%m/%Y').date()
    except (TypeError, ValueError):
        return None


MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']


def lic(s):
    m = re.match(r'(\d+)-(\w+)-(\d+)', s or '')
    return dt.date(int(m[3]), MES.index(m[2]) + 1, int(m[1])) if m and m[2] in MES else None


ua = [data(r['to_char_dt_atualizacao_dd_mm_yyyy']) for r in at]
lv = [lic(r['dt_val_lic_sani']) for r in at]
end = C.Counter((r['code_muni'], re.sub(r'\W', '', up(r['logradouro']))[-12:], (r['numero_endereco'] or '').strip()) for r in at)
pv = [l for l in L if l['rede'] == 'panvel']
dd = np.array([l['dist_cnes_geocodebr_m'] for l in pv if l.get('dist_cnes_geocodebr_m') is not None], float)
R['qualidade'] = {
    'ultima_atualizacao': {'antes_de_2023': sum(1 for x in ua if x and x.year < 2023), '2023_2024': sum(1 for x in ua if x and 2023 <= x.year <= 2024),
                           '2025_2026': sum(1 for x in ua if x and x.year >= 2025)},
    'licenca_sanitaria': {'sem_data': sum(x is None for x in lv), 'vencida_em_abr26': sum(1 for x in lv if x and x < REF), 'valida': sum(1 for x in lv if x and x >= REF)},
    'mesmo_endereco_dois_registros': [{'mun': k[0], 'logradouro': k[1], 'numero': k[2]} for k, v in end.items() if v > 1],
    'coordenada': {'fonte_cnes': sum(1 for r in at if r['coords_source'] == 'cnes'), 'fonte_geocodebr': sum(1 for r in at if r['coords_source'] == 'geocodebr'),
                   'dist_cnes_endereco_mediana_m': float(np.median(dd)), 'dist_mais_500m': int((dd > 500).sum()), 'dist_mais_2km': int((dd > 2000).sum()),
                   'cnes_fora_do_municipio': sum(1 for l in pv if l.get('cnes_fora_do_municipio')),
                   'classe_no_atlas': dict(C.Counter(l['classe'] for l in pv))},
    'fantasia_com_numero_de_filial': sum(1 for r in at if re.search(r'FILIAL\s*\d+', up(r['no_fantasia']))),
    'aberta_24h': sum(1 for r in at if r['tp_estab_sempre_aberto'] == 'S'),
    'aberta_24h_por_uf': dict(C.Counter(r['abbrev_state'] for r in at if r['tp_estab_sempre_aberto'] == 'S'))}

# 7. comparação com as concorrentes (mesma regra: farmácia ativa do CNPJ da rede, S e SE)
R['concorrentes_cnes'] = {r: int(sum(1 for l in L if l['rede'] == r and l['uf'] in (31, 32, 33, 35, 41, 42, 43))) for r in ('panvel', 'rd', 'pm')}

with open(pathlib.Path(__file__).resolve().parent / 'registros-cnes-panvel.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['cnes', 'cnpj', 'filial_cnpj', 'situacao', 'motivo_desativacao', 'tipo_unidade', 'uf', 'municipio', 'cod_municipio', 'fantasia',
                'logradouro', 'numero', 'bairro', 'cep', 'aberta_24h', 'ultima_atualizacao', 'validade_licenca_sanitaria', 'lat', 'lon', 'fonte_coordenada'])
    for r in sorted(dimed, key=lambda r: (r['abbrev_state'], r['name_muni'], r['co_cnes'])):
        w.writerow([r['co_cnes'], r['nu_cnpj'], fil(r), 'ativo' if r['co_motivo_desab'] is None else 'desativado', r['co_motivo_desab'] or '',
                    int(r['tp_unidade']), r['abbrev_state'], r['name_muni'], int(r['code_muni']), r['no_fantasia'], r['logradouro'], r['numero_endereco'],
                    r['bairro'], r['cep'], r['tp_estab_sempre_aberto'], r['to_char_dt_atualizacao_dd_mm_yyyy'], (r['dt_val_lic_sani'] or '')[:11],
                    r['lat_cnes'], r['lon_cnes'], r['coords_source']])
SAIDA.write_text(json.dumps(R, ensure_ascii=False, indent=1, default=float), encoding='utf-8')
print(json.dumps({k: v for k, v in R.items() if k not in ('desativados', 'cnpj_reaproveitado', 'busca_por_nome_fora_do_cnpj')}, ensure_ascii=False, indent=1))
print('busca por nome fora do CNPJ:', [(x['fantasia'], x['uf']) for x in R['busca_por_nome_fora_do_cnpj']])
