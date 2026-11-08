"""Correção da Parte 2: lojas da Panvel que o CNES não registra como farmácia (caso de Balneário Camboriú).

    python3 corrige_cnes.py entrada.pptx saida.pptx analise.json analise_md.json mapa.png

O CNES de Balneário Camboriú só tem um registro da Panvel (Av. Brasil, 2880), cadastrado como centro de
imunização (tipo 85), e a análise anterior só usava farmácias (tipo 43). A cidade tem várias lojas abertas
(Google Maps, nov./2026). A análise agora inclui os 4 registros ativos da Dimed em outros tipos e tira
Balneário Camboriú das listas de oportunidade. O perfil de loja (critério) continua com as 593 farmácias.
"""
import json
import sys

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.chart.data import CategoryChartData

ENT, SAI, ARQ, ARQ_MD, MAPA = sys.argv[1:6]
R = json.load(open(ARQ, encoding='utf-8'))
A = json.load(open(ARQ_MD, encoding='utf-8'))
p = Presentation(ENT)
S = p.slides
assert len(S) == 32
NAVY, GRAY = '143C8C', '5F6878'


def br(v, d=0):
    s = f'{v:,.{d}f}'
    return s.replace(',', 'X').replace('.', ',').replace('X', '.')


def sh(slide, sid):
    return next(s for s in slide.shapes if s.shape_id == sid)


def run(slide, sid, par, k, txt, antes=None):
    r = sh(slide, sid).text_frame.paragraphs[par].runs[k]
    if antes is not None:
        assert antes in r.text, (sid, r.text)
    r.text = txt


def celula(c, txt):
    rs = c.text_frame.paragraphs[0].runs
    rs[0].text = txt
    for r in rs[1:]:
        r.text = ''


munis = {m['mun']: m for m in R['municipios']}
assert 'Balneário Camboriú' not in munis
SP_, LU, mat, cm = R['setores_perfil'], R['lojas_por_uf'], R['matriz_renda_60_casa'], A['cidades_medias']
sem = lambda m: 100 * m['perfil_sem_panvel'] / m['perfil']

# ── 25: frentes (total sem Panvel) e mapa ──
s = S[24]
r = sh(s, 17).text_frame.paragraphs[0].runs[0]
assert '3,99 milhões' in r.text
r.text = r.text.replace('3,99 milhões', f'{br(SP_["pop_perfil_sem_panvel"] / 1e6, 2)} milhões')
pic = next(x for x in s.shapes if x.shape_type == 13)
pic.part.related_part(pic._element.blipFill.blip.rEmbed)._blob = open(MAPA, 'rb').read()

# ── 26: matriz renda × 60+ ──
s = S[25]
for sid, v in ((28, mat[0][0]), (29, mat[0][1]), (30, mat[0][2]), (24, mat[1][0]), (25, mat[1][1]), (26, mat[1][2]),
               (20, mat[2][0]), (21, mat[2][1]), (22, mat[2][2])):
    run(s, sid, 0, 0, br(v, 1) + '%')
run(s, 44, 0, 1, sh(s, 44).text_frame.paragraphs[0].runs[1].text.replace('cobre 45%', f'cobre {br(mat[2][2])}%'), 'cobre 45%')

# ── 27: SC e PR ──
s = S[26]
cs = [munis[n] for n in ('Porto Alegre', 'Londrina', 'Curitiba', 'Florianópolis', 'Maringá', 'Joinville')]
ch = sh(s, 27).chart
cd = CategoryChartData(); cd.categories = [m['mun'] for m in cs]; cd.add_series('Sem Panvel', [round(sem(m)) for m in cs])
ch.replace_data(cd)
ser = ch.plots[0].series[0]
for k in range(len(cs)):
    pt = ser.points[k]; pt.format.fill.solid(); pt.format.fill.fore_color.rgb = RGBColor.from_string(GRAY if k == 0 else NAVY)
run(s, 39, 0, 0, 'O CNES não registra toda a rede', 'Balneário')
run(s, 39, 1, 0, f'SC: {LU["SC"]["panvel"]} lojas no CNES, 105 no release. Em Balneário Camboriú há várias Panvel e só 1 registro, como vacinação.')
s.notes_slide.notes_text_frame.text += (' Balneário Camboriú saiu do gráfico: a cidade tem várias lojas Panvel, mas o CNES só tem um registro da rede, '
                                        'cadastrado como centro de imunização, e por isso ela aparecia como vazia.')

# ── 28: interior do Sul ──
s = S[27]
for sid, u in ((18, 'RS'), (21, 'SC'), (24, 'PR')):
    n, c = cm['por_uf'][u]
    run(s, sid, 0, 0, f'{c} de {n}')
run(s, 27, 0, 0, f'{cm["sem_panvel_com_rd"]} das {cm["sem_panvel"]} cidades médias sem Panvel no CNES já têm Raia')
tb = sh(s, 28).table
celula(tb.cell(0, 0), 'Cidade sem Panvel no CNES')
for i, d in enumerate(cm['top'][:8], 1):
    val = [d['nome'] + ('*' if d['nome'] == 'Indaial' else ''), d['uf'], br(d['pop']), ('+' if d['var_pop'] > 0 else '') + br(d['var_pop'], 1) + '%',
           'R$ ' + br(d['renda_resp']), br(d['pct_60mais'], 1) + '%', 'R$ ' + br(d['pib_pc'] / 1000) + ' mil', str(d['rd'])]
    for j, v in enumerate(val):
        celula(tb.cell(i, j), v)
run(s, 29, 0, 1, ' quase todas as cidades médias sem Panvel têm Raia, e as melhores ficam em SC. Mas a lista vem do CNES, que não registra toda '
                 'a rede (Balneário Camboriú saiu por isso): conferir cada cidade antes de decidir. Ordem: média dos percentis de renda, 60+ e crescimento.')
run(s, 30, 0, 0, 'Cidades médias: 50 a 200 mil hab. (Censo 2022). Indicadores: Atlas 2.0 (Censos 2022 e 2010, PIB 2021). Lojas: CNES abr./2026, '
                 'qualquer tipo de registro. * Um diretório na web lista uma Panvel em Indaial (não confirmado).')
s.notes_slide.notes_text_frame.text = (
    f'O documento estratégico sugere ocupar as cidades médias antes da chegada da Raia. No Sul ela já chegou: das {cm["sem_panvel"]} cidades médias '
    f'sem Panvel no CNES, {cm["sem_panvel_com_rd"]} têm Raia. No RS todas as 33 cidades médias têm Panvel; o espaço está em SC e no PR. '
    'Cuidado com a base: o CNES tem 88% das lojas da Panvel. Balneário Camboriú tem várias lojas, mas só um registro, como centro de imunização, '
    'e saiu da lista. Antes de levar uma cidade adiante, conferir no localizador de lojas da Panvel.')

# ── 31: sequência ──
s = S[30]
run(s, 26, 0, 0, 'Adensar Curitiba, Florianópolis, Maringá e Joinville; depois, cidades médias de SC já conferidas', 'Balneário')

# ── 32: anexo ──
s = S[31]
tb = sh(s, 17).table
for i in range(1, len(tb.rows)):
    rede, u = tb.cell(i, 0).text, tb.cell(i, 1).text
    rel = int(tb.cell(i, 3).text.replace('.', ''))
    a = LU[u]['panvel' if rede == 'Panvel' else 'rd']
    celula(tb.cell(i, 2), br(a)); celula(tb.cell(i, 4), br(100 * a / rel) + '%')
tot = sum(LU[u]['panvel'] for u in LU)
assert round(100 * tot / 677) == 88
run(s, 19, 1, 0, 'O CNES tem 88% das lojas Panvel e 89% das da Raia no Sul e no Sudeste. Falta loja aberta depois de abril ou sem registro de '
                 'farmácia: em Balneário Camboriú, o único registro da Panvel é um centro de vacinação.', 'O CNES tem 88%')
run(s, 20, 0, 0, 'CNES abr./2026 (geobr/IPEA): farmácias ativas; na Panvel, mais 4 registros ativos da Dimed em outros tipos (vacinação, clínica). '
                 'Releases 3T26: lojas em 30/09/2026. Raia Drogasil = Droga Raia + Drogasil.')
p.save(SAI)
print('ok', SAI)
