"""Monta a Parte 2 (diagnóstico de abertura de lojas da Panvel) no template da Entrega 2.

    python3 junta.py base.pptx saida.pptx analise.json mapa.png
base.pptx: a Entrega 2 atualizada com um slide de capa duplicado (23) e seis slides duplicados (24 a 29).
"""
import json
import sys

from lxml import etree
from pptx import Presentation
from pptx.chart.data import CategoryChartData
from pptx.dml.color import RGBColor
from pptx.enum.chart import XL_CHART_TYPE, XL_LABEL_POSITION
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Emu, Inches, Pt

ENT, SAI, ARQ, MAPA = sys.argv[1:5]
R = json.load(open(ARQ, encoding='utf-8'))
p = Presentation(ENT)
S = p.slides
assert len(S) == 29
FONTE = 'Nunito Sans'
NAVY, DARK, ORANGE, TEXT, GRAY, LIGHT, CARD, LINE, GREEN, RED, MID = ('143C8C', '143371', 'E8631A', '2B2F36', '5F6878', 'EEF2FA',
                                                                    'FDFDFE', 'E1E5EC', '1F6B3A', 'B4441A', '3F5FA8')


def br(v, d=0):
    s = f'{v:,.{d}f}'
    return s.replace(',', 'X').replace('.', ',').replace('X', '.')


def rgb(h):
    return RGBColor.from_string(h)


def sh(slide, sid):
    return next(s for s in slide.shapes if s.shape_id == sid)


def limpa(slide, manter):
    for s in list(slide.shapes):
        if s.shape_id not in manter:
            s._element.getparent().remove(s._element)


def setp(par, textos):
    rs = par.runs
    for r, t in zip(rs, textos):
        r.text = t
    for r in rs[len(textos):]:
        r._r.getparent().remove(r._r)


def texto(slide, x, y, w, h, runs, size=12, color=TEXT, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, espaco=0, bullets=False):
    """runs: str, ou lista de parágrafos; cada parágrafo é str ou lista de (texto, {bold, color, size})."""
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = anchor
    pars = runs if isinstance(runs, list) else [runs]
    for i, pa in enumerate(pars):
        par = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        par.alignment = align
        if espaco:
            par.space_after = Pt(espaco)
        segs = pa if isinstance(pa, list) else [(('• ' if bullets else '') + pa, {})]
        for t, o in segs:
            r = par.add_run()
            r.text = t
            f = r.font
            f.name = FONTE
            f.size = Pt(o.get('size', size))
            f.bold = o.get('bold', False)
            f.color.rgb = rgb(o.get('color', color))
    return tb


def cartao(slide, x, y, w, h, fill=CARD, borda=LINE):
    s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    s.adjustments[0] = min(0.08, 0.09 / min(w, h))
    s.fill.solid(); s.fill.fore_color.rgb = rgb(fill)
    if borda:
        s.line.color.rgb = rgb(borda); s.line.width = Pt(0.75)
    else:
        s.line.fill.background()
    s.shadow.inherit = False
    s.text_frame.text = ''
    return s


def numero(slide, x, y, d, n, cor=NAVY):
    s = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x), Inches(y), Inches(d), Inches(d))
    s.fill.solid(); s.fill.fore_color.rgb = rgb(cor); s.line.fill.background(); s.shadow.inherit = False
    tf = s.text_frame
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    par = tf.paragraphs[0]; par.alignment = PP_ALIGN.CENTER
    r = par.add_run(); r.text = str(n)
    r.font.name = FONTE; r.font.size = Pt(d * 30); r.font.bold = True; r.font.color.rgb = rgb('FFFFFF')


def leitura(slide, txt, y=5.95, h=0.55):
    texto(slide, 0.78, y, 12.13, h, [[('Leitura:', {'bold': True, 'color': ORANGE}), (' ' + txt, {})]], size=12)


def fonte(slide, txt, y=6.5):
    texto(slide, 0.78, y, 12.13, 0.3, txt, size=9, color=GRAY)


def tabela(slide, cab, linhas, x, y, colw, al=None, size=11, rowh=0.34):
    rows, cols = len(linhas) + 1, len(cab)
    gf = slide.shapes.add_table(rows, cols, Inches(x), Inches(y), Inches(sum(colw)), Inches(rowh * rows))
    t = gf.table
    tblPr = gf._element.graphic.graphicData.tbl.tblPr
    tblPr.set('firstRow', '0'); tblPr.set('bandRow', '0')
    for el in list(tblPr):
        tblPr.remove(el)
    for j, w in enumerate(colw):
        t.columns[j].width = Inches(w)
    al = al or (['left'] + ['right'] * (cols - 1))
    for i in range(rows):
        t.rows[i].height = Inches(rowh)
        for j in range(cols):
            c = t.cell(i, j)
            c.margin_left = c.margin_right = Inches(0.08); c.margin_top = c.margin_bottom = Inches(0.03)
            c.vertical_anchor = MSO_ANCHOR.MIDDLE
            c.fill.solid(); c.fill.fore_color.rgb = rgb(NAVY if i == 0 else (LIGHT if i % 2 == 0 else CARD))
            par = c.text_frame.paragraphs[0]
            par.alignment = {'left': PP_ALIGN.LEFT, 'right': PP_ALIGN.RIGHT, 'center': PP_ALIGN.CENTER}[al[j]]
            r = par.add_run(); r.text = cab[j] if i == 0 else linhas[i - 1][j]
            r.font.name = FONTE; r.font.size = Pt(size); r.font.bold = i == 0
            r.font.color.rgb = rgb('FFFFFF' if i == 0 else TEXT)
            tcPr = c._tc.get_or_add_tcPr()
            for tag in ('lnL', 'lnR', 'lnT', 'lnB'):
                ln = etree.SubElement(tcPr, '{http://schemas.openxmlformats.org/drawingml/2006/main}' + tag, w='6350')
                sf = etree.SubElement(ln, '{http://schemas.openxmlformats.org/drawingml/2006/main}solidFill')
                etree.SubElement(sf, '{http://schemas.openxmlformats.org/drawingml/2006/main}srgbClr', val=('143371' if i == 0 else LINE))
                tcPr.insert(0, ln) if False else None
            # a ordem do schema pede as linhas antes do preenchimento
            fill = [e for e in tcPr if e.tag.endswith('}solidFill')]
            for e in fill:
                tcPr.remove(e); tcPr.append(e)
    return gf


# ── dados ──
munis = {m['mun']: m for m in R['municipios']}
SP_ = R['setores_perfil']; LU = R['lojas_por_uf']; crit = R['criterio']; mat = R['matriz_renda_60_casa']
ufp = lambda u: SP_['por_uf'][u]
sem = lambda m: 100 * m['perfil_sem_panvel'] / m['perfil']
poa, cwb, fln, mga, jvl, lon, bc = (munis[n] for n in ('Porto Alegre', 'Curitiba', 'Florianópolis', 'Maringá', 'Joinville', 'Londrina', 'Balneário Camboriú'))
spc, stos, cps, rio, nit, bh = (munis[n] for n in ('São Paulo', 'Santos', 'Campinas', 'Rio de Janeiro', 'Niterói', 'Belo Horizonte'))
REL = {'pv': {'lojas': 677, 'uf': {'RS': 425, 'SC': 105, 'PR': 130, 'SP': 17}, 'share': {'Sul': 13.5, 'RS': 22.4, 'SC': 7.9, 'PR': 7.4},
              'venda': 837, 'vendaMad': 887, 'ticket': 101.15, 'roic': (34.3, 24.3, 13.1), 'madSP': 47.1},
       'rd': {'lojas': 3770, 'ab3t': 92, 'uf': {'SP': 1485, 'RJ': 295, 'MG': 269, 'PR': 217, 'RS': 140, 'SC': 121, 'ES': 82}, 'share': {'SP': 33.0, 'Sul': 11.5}},
       'pm': {'lojas': 1705, 'ticket': 97.39, 'share': {'Sul': 1.1, 'SE': 2.0}}}
ACENTO = {'Vl ': 'Vila ', 'Jd ': 'Jardim ', 'Mirandopolis': 'Mirandópolis', 'Cambui': 'Cambuí', ' Da ': ' da '}


def rotulo(h):
    b = h['bairro'] or h['ref_cnes'] or ''
    if not h['bairro'] and b:
        for a, c in ACENTO.items():
            b = b.replace(a, c)
        b += '*'
    return h['mun'] + (' – ' + b if b else '')


TOTAL = 29

# ── capa geral e divisória ──
setp(sh(S[0], 8).text_frame.paragraphs[0], ['Parte 1: 2025 × 2024 · 2T26 × 2T25 · atualização 3T26   |   Parte 2: diagnóstico de lojas'])
D = S[22]
limpa(D, {2, 3, 4, 5, 6, 7, 8, 19, 20})
setp(sh(D, 5).text_frame.paragraphs[0], ['PUCRS · ESCOLA DE NEGÓCIOS'])
setp(sh(D, 6).text_frame.paragraphs[0], ['PARTE 2 · DIAGNÓSTICO DE LOJAS'])
t = sh(D, 7).text_frame
setp(t.paragraphs[0], ['Onde a Panvel deve crescer'])
for pa in t.paragraphs[1:]:
    pa._p.getparent().remove(pa._p)
setp(sh(D, 8).text_frame.paragraphs[0], ['Localização das lojas, perfil do entorno e oportunidades no Sul e no Sudeste'])
texto(D, 0.78, 4.45, 8.2, 1.2, [
    [('Bases: ', {'bold': True, 'color': 'FFFFFF'}), ('lojas ativas no CNES (abr./2026), setores do Censo 2022 (IBGE) e releases do 3T26 da Panvel, da RD Saúde e da Pague Menos.', {})],
    [('Sem dado de venda por loja: ', {'bold': True, 'color': 'FFFFFF'}), ('a renda do responsável pelo domicílio é a aproximação do ticket.', {})]], size=14, espaco=8, color='D5DEF0')
D.notes_slide.notes_text_frame.text = 'Segunda parte: a mesma empresa vista pelo lado da expansão. Onde abrir as próximas lojas e por quê.'


def base(slide, kicker, titulo):
    limpa(slide, {2, 3, 15, 16})
    setp(sh(slide, 2).text_frame.paragraphs[0], [kicker])
    setp(sh(slide, 3).text_frame.paragraphs[0], [titulo])


# ── 24: resposta ──
s = S[23]
base(s, 'DIAGNÓSTICO DE LOJAS · RESPOSTA', 'Três frentes para as próximas lojas')
texto(s, 0.78, 1.6, 7.0, 0.8, f'A rede voltou a acelerar: 14 aberturas no 3T26 e 677 lojas. O alvo: lugares com renda alta e muitos idosos, onde {br(SP_["pop_perfil_sem_panvel"] / 1e6, 2)} milhões de pessoas no Sul e no Sudeste não têm uma Panvel a até 1 km.', size=13)
frentes = [(NAVY, '1 · Desenvolver SC e PR', f'Market share de {br(7.9, 1)}% em SC e {br(7.4, 1)}% no PR, contra {br(22.4, 1)}% no RS. Marca e logística já estão lá.'),
           (GREEN, '2 · Crescer em São Paulo', f'17 lojas hoje e {br(ufp("SP")["sem_panvel"] / 1e6, 2)} mi de pessoas no perfil sem Panvel. Escolher pontos com pouca Raia.'),
           (GRAY, '3 · Avaliar nova UF', 'Rio, Niterói e Belo Horizonte: muito público, mas a mais de 340 km da loja Panvel mais próxima.')]
for i, (cor, tt, tx) in enumerate(frentes):
    y = 2.55 + i * 1.12
    cartao(s, 0.78, y, 7.0, 0.98)
    numero(s, 0.98, y + 0.25, 0.48, i + 1, cor)
    texto(s, 1.65, y + 0.1, 5.95, 0.8, [[(tt, {'bold': True, 'color': NAVY, 'size': 14})], tx], size=12, anchor=MSO_ANCHOR.MIDDLE)
cartao(s, 8.05, 1.55, 4.5, 5.0)
s.shapes.add_picture(MAPA, Inches(8.05 + (4.5 - 4.1 * 1538 / 1716) / 2), Inches(1.65), height=Inches(4.1))
texto(s, 8.25, 5.82, 4.1, 0.65, 'Laranja: Panvel · cinza: Raia Drogasil · círculos: pontos com mais público no perfil sem Panvel (azul: RS/SC/PR; verde: SP; cinza: RJ/MG/ES)', size=9, color=GRAY)
fonte(s, 'CNES abr./2026 (lojas), Censo 2022 (setores) e release 3T26 da Panvel (aberturas, lojas e market share, IQVIA).')
s.notes_slide.notes_text_frame.text = 'A resposta primeiro: três frentes em ordem de esforço. Desenvolver SC e PR, onde o market share é um terço do gaúcho; crescer em SP com seletividade; avaliar a entrada no Rio e em BH.'

# ── 25: critério ──
s = S[24]
base(s, 'DIAGNÓSTICO DE LOJAS · CRITÉRIO', 'Renda alta e idosos: onde a loja Panvel rende')
cartao(s, 0.78, 1.55, 6.55, 4.25)
texto(s, 0.98, 1.68, 6.2, 0.35, 'Moradores a até 1 km de uma Panvel no RS, SC e PR (%)', size=12, color=NAVY, bold=None) if False else \
    texto(s, 0.98, 1.68, 6.2, 0.35, [[('Moradores a até 1 km de uma Panvel no RS, SC e PR (%)', {'bold': True, 'color': NAVY})]], size=12)
cores = lambda v: DARK if v >= 40 else NAVY if v >= 20 else MID if v >= 10 else 'BFCBE6' if v >= 5 else LINE
for a, lab in enumerate(['Renda alta', 'Renda média', 'Renda baixa']):
    texto(s, 0.98, 2.15 + a * 1.05, 1.3, 0.95, lab, size=12, anchor=MSO_ANCHOR.MIDDLE)
    for b in range(3):
        v = mat[2 - a][b]
        c = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(2.35 + b * 1.6), Inches(2.15 + a * 1.05), Inches(1.5), Inches(0.95))
        c.adjustments[0] = 0.08; c.fill.solid(); c.fill.fore_color.rgb = rgb(cores(v)); c.line.fill.background(); c.shadow.inherit = False
        tf = c.text_frame; tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        r = tf.paragraphs[0].add_run(); tf.paragraphs[0].alignment = PP_ALIGN.CENTER
        r.text = br(v, 1) + '%'; r.font.name = FONTE; r.font.size = Pt(20); r.font.bold = True
        r.font.color.rgb = rgb('FFFFFF' if v >= 10 else DARK)
for b, lab in enumerate(['Poucos idosos', 'Médio', 'Muitos idosos']):
    texto(s, 2.35 + b * 1.6, 5.35, 1.5, 0.3, lab, size=11, align=PP_ALIGN.CENTER)
texto(s, 7.6, 1.55, 5.0, 0.35, [[('O que os releases confirmam', {'bold': True, 'color': NAVY})]], size=14)
ev = [(f'Ticket médio de R$ {br(101.15, 2)}', f'Acima da Pague Menos (R$ {br(97.39, 2)}). Higiene e beleza tem "grande penetração entre os consumidores de maior renda".'),
      ('R$ 837 mil por loja por mês', 'R$ 887 mil nas lojas maduras; vendas nas mesmas lojas +13,3% no 3T26.'),
      ('Lojas novas dão retorno', 'ROIC das safras: 34,3% (2023), 24,3% (2024) e 13,1% (2025, ainda em maturação).')]
for i, (tt, tx) in enumerate(ev):
    y = 2.0 + i * 1.27
    cartao(s, 7.6, y, 4.95, 1.13)
    numero(s, 7.78, y + 0.33, 0.45, i + 1, NAVY)
    texto(s, 8.4, y + 0.1, 4.0, 0.95, [[(tt, {'bold': True, 'color': NAVY})], tx], size=11, anchor=MSO_ANCHOR.MIDDLE)
leitura(s, f'nos estados onde a Panvel é forte, ela cobre 45% dos moradores com renda alta e muitos idosos, e só 2,4% no extremo oposto. Critério de busca (mediana das lojas): renda do responsável ≥ R$ {br(crit["renda_min"])}, 60+ ≥ {br(crit["p60_min"], 1)}% e ≥ {br(crit["pop1km_min"])} moradores a 1 km.')
fonte(s, 'Matriz: Censo 2022 e lojas do CNES (abr./2026), terços da população por renda do responsável e por 60+. Evidências: releases 3T26 da Panvel e da Pague Menos.')
s.notes_slide.notes_text_frame.text = 'O critério sai do padrão que a própria Panvel já segue. Os releases reforçam: ticket mais alto, higiene e beleza puxada pelo público de maior renda e lojas novas com ROIC de dois dígitos.'

# ── 26: SC e PR ──
s = S[25]
base(s, 'DIAGNÓSTICO DE LOJAS · SUL', 'Por que adensar SC e PR: share de um terço do RS')
for i, (u, cor) in enumerate((('RS', GRAY), ('SC', NAVY), ('PR', NAVY))):
    x = 0.78 + i * 2.08
    cartao(s, x, 1.55, 1.95, 1.1)
    texto(s, x + 0.18, 1.62, 1.6, 0.55, [[(br(REL['pv']['share'][u], 1) + '%', {'bold': True, 'color': cor, 'size': 24})]])
    texto(s, x + 0.18, 2.18, 1.7, 0.4, f'share em {u} · {REL["pv"]["uf"][u]} lojas', size=10, color=GRAY)
cs = [poa, lon, cwb, fln, mga, jvl, bc]
cd = CategoryChartData(); cd.categories = [m['mun'] for m in cs]; cd.add_series('Sem Panvel', [round(sem(m)) for m in cs])
cartao(s, 0.78, 2.8, 6.1, 3.0)
gf = s.shapes.add_chart(XL_CHART_TYPE.BAR_CLUSTERED, Inches(0.9), Inches(2.85), Inches(5.9), Inches(2.9), cd)
ch = gf.chart
ch.has_legend = False; ch.has_title = True
ch.chart_title.text_frame.text = 'Público no perfil sem Panvel a até 1 km (%)'
tr = ch.chart_title.text_frame.paragraphs[0].runs[0]; tr.font.name = FONTE; tr.font.size = Pt(11); tr.font.bold = True; tr.font.color.rgb = rgb(NAVY)
pl = ch.plots[0]; pl.gap_width = 45; pl.has_data_labels = True
dl = pl.data_labels; dl.number_format = '0"%"'; dl.number_format_is_linked = False; dl.position = XL_LABEL_POSITION.OUTSIDE_END
dl.font.name = FONTE; dl.font.size = Pt(10); dl.font.color.rgb = rgb(TEXT)
ser = pl.series[0]
for k in range(len(cs)):
    pt = ser.points[k]; pt.format.fill.solid(); pt.format.fill.fore_color.rgb = rgb(GRAY if k == 0 else ORANGE if k == len(cs) - 1 else NAVY)
ca = ch.category_axis; ca.reverse_order = True; ca.tick_labels.font.name = FONTE; ca.tick_labels.font.size = Pt(10); ca.tick_labels.font.color.rgb = rgb(TEXT)
ca.format.line.fill.background(); ca.has_major_gridlines = False
va = ch.value_axis; va.visible = False; va.has_major_gridlines = False; va.maximum_scale = 118; va.minimum_scale = 0
mot = [('Porto Alegre mostra o teto', f'Só {br(sem(poa))}% do público no perfil fica sem Panvel a 1 km. Em Curitiba, {br(sem(cwb))}% ({br(cwb["perfil_sem_panvel"])} pessoas); em Joinville, {br(sem(jvl))}%.'),
       ('A Raia tem mais lojas', f'PR: {REL["rd"]["uf"]["PR"]} da Raia contra {REL["pv"]["uf"]["PR"]} da Panvel; SC: {REL["rd"]["uf"]["SC"]} contra {REL["pv"]["uf"]["SC"]}. No RS, {REL["pv"]["uf"]["RS"]} contra {REL["rd"]["uf"]["RS"]}.'),
       ('Abrir perto custa menos', 'Os pontos de Curitiba, Florianópolis e Maringá ficam a 1 ou 2 km de lojas atuais. No 3T26 a Panvel abriu 5 lojas no PR e 2 em SC.'),
       ('Balneário Camboriú está vazio', f'{br(bc["perfil_sem_panvel"])} pessoas no perfil, nenhuma Panvel e só {bc["rd"]} lojas da Raia.')]
for i, (tt, tx) in enumerate(mot):
    y = 1.55 + i * 1.08
    cartao(s, 7.1, y, 5.45, 0.96)
    numero(s, 7.27, y + 0.26, 0.44, i + 1, ORANGE if i == 1 else NAVY)
    texto(s, 7.88, y + 0.07, 4.55, 0.85, [[(tt, {'bold': True, 'color': NAVY})], tx], size=10.5, anchor=MSO_ANCHOR.MIDDLE)
leitura(s, 'Porto Alegre mostra até onde a rede chega quando madura. Em SC e no PR a marca e a logística já existem, o share é um terço do gaúcho e a Raia ocupa o espaço. O release da Panvel aponta "muitas oportunidades" no Sul, em especial no interior.')
fonte(s, 'Share e lojas por UF: releases 3T26 (IQVIA). Gráfico: Censo 2022 e lojas do CNES (abr./2026). Público no perfil: renda e 60+ acima das medianas das Panvel.')
s.notes_slide.notes_text_frame.text = f'Levar Curitiba ao nível de Porto Alegre alcançaria cerca de {br(round((cwb["perfil_sem_panvel"] - cwb["perfil"] * sem(poa) / 100) / 1000))} mil pessoas no perfil a mais.'

# ── 27: São Paulo ──
s = S[26]
base(s, 'DIAGNÓSTICO DE LOJAS · SÃO PAULO', 'São Paulo: o maior mercado, com a Raia dominante')
for i, (lab, m) in enumerate((('Capital', spc), ('Santos', stos), ('Campinas', cps))):
    x = 0.78 + i * 2.72
    cartao(s, x, 1.55, 2.58, 1.3)
    texto(s, x + 0.2, 1.62, 2.3, 0.55, [[(br(m['perfil_sem_panvel'] / 1000) + ' mil', {'bold': True, 'color': NAVY, 'size': 22})]])
    texto(s, x + 0.2, 2.17, 2.3, 0.6, f'{lab}: no perfil sem Panvel a 1 km', size=11, color=GRAY)
cartao(s, 8.95, 1.55, 3.6, 1.3, fill='FCEEE6', borda='F2C2A5')
texto(s, 9.1, 1.62, 3.35, 1.18, [[(f'Raia: 1.485 lojas e 33,0% de share em SP', {'bold': True, 'color': ORANGE})],
                                  '35% das aberturas da Raia no último ano foram em SP. A Panvel tem 17 lojas, 47,1% maduras.'], size=10.5)
pts = [h for h in R['pontos'] if h['uf'] == 'SP']
pick = [next(h for h in pts if k in (h['bairro'] or h['ref_cnes'])) for k in ('Santana', 'Pompeia', 'Mirandopolis', 'Gonzaga', 'Embaré', 'Cambui')]
tabela(s, ['Ponto candidato', 'Público no perfil (1 km)', 'Renda média', '60+', 'Raia + Pague Menos (1 km)', 'Panvel mais próxima'],
       [[rotulo(h), br(h['perfil_sem_panvel_1km']), 'R$ ' + br(h['renda_1km']), br(h['p60_1km'], 1) + '%', str(h['rd_1km'] + h['pm_1km']),
         br(h['panvel_mais_proxima_km'], 1) + ' km'] for h in pick], 0.78, 3.05, [3.55, 1.9, 1.5, 1.0, 2.25, 1.57])
leitura(s, 'crescer com seletividade: pontos perto das 17 lojas e com pouca concorrência, como Santana. Santos tem a maior parcela de idosos da lista (acima de 30%).', y=5.65)
fonte(s, 'Pontos: Censo 2022 e CNES (abr./2026); * bairro informado no CNES pela farmácia mais próxima. Raia e Panvel em SP: releases 3T26 (IQVIA).')
s.notes_slide.notes_text_frame.text = 'São Paulo tem o maior público no perfil sem Panvel, mas é o mercado mais disputado. A Panvel tem 17 lojas, metade em maturação.'

# ── 28: concorrência e sequência ──
s = S[27]
base(s, 'DIAGNÓSTICO DE LOJAS · CONCORRÊNCIA', 'Concorrência e sequência recomendada')
conc = [(ORANGE, 'Raia Drogasil', '3.770 lojas, 92 aberturas no 3T26 e meta de 330 a 350 por ano. 16 CDs; share de 11,5% no Sul, contra 13,5% da Panvel.'),
        (GRAY, 'Pague Menos', '1.705 lojas, 62% no Nordeste, expansão no Norte, Nordeste e Centro-Oeste. Share de 1,1% no Sul e 2,0% no Sudeste: não disputa o Sul.'),
        (MID, 'RJ e MG', f'Rio ({br(rio["perfil_sem_panvel"] / 1000)} mil no perfil), BH ({br(bh["perfil_sem_panvel"] / 1000)} mil) e Niterói ({br(nit["perfil_sem_panvel"] / 1000)} mil); 295 lojas da Raia no RJ e 269 em MG.')]
for i, (cor, tt, tx) in enumerate(conc):
    x = 0.78 + i * 3.97
    cartao(s, x, 1.55, 3.8, 1.8)
    texto(s, x + 0.2, 1.67, 3.4, 1.6, [[(tt, {'bold': True, 'color': cor, 'size': 14})], tx], size=11, espaco=4)
seq = [(NAVY, 'SC e PR', 'Balneário Camboriú e adensar Curitiba, Florianópolis, Maringá e Joinville'),
       (GREEN, 'São Paulo', 'Pontos perto das 17 lojas, com pouca Raia; testar Santos'),
       (GRAY, 'RJ e MG', 'Estudo de entrada: exige logística nova (a mais de 340 km)')]
for i, (cor, tt, tx) in enumerate(seq):
    x = 0.78 + i * 3.97
    cartao(s, x, 3.55, 3.8, 1.75, fill=NAVY, borda=None)
    numero(s, x + 0.2, 3.72, 0.48, i + 1, ORANGE if i == 0 else '3F5FA8')
    texto(s, x + 0.82, 3.72, 2.8, 0.48, [[(tt, {'bold': True, 'color': 'FFFFFF', 'size': 15})]], anchor=MSO_ANCHOR.MIDDLE)
    texto(s, x + 0.2, 4.35, 3.4, 0.85, tx, size=11.5, color='E1E5EC')
leitura(s, 'a Raia é a concorrente que importa: cresce mais de 300 lojas por ano e já lidera SC e PR em número de lojas. Antes de abrir, cruzar com venda, ticket e margem internos e conferir o ponto (aluguel, fluxo). Lista completa: pontos-oportunidade.csv.', y=5.5, h=0.75)
fonte(s, 'Releases de resultados do 3T26 (Panvel, RD Saúde, Pague Menos); market share: IQVIA, conforme os releases. Público no perfil: Censo 2022.')
s.notes_slide.notes_text_frame.text = 'A ordem vai do menor para o maior esforço: ocupar SC e PR, depois SP com seletividade, e só então estudar novas UFs.'

# ── 29: anexo ──
s = S[28]
base(s, 'DIAGNÓSTICO DE LOJAS · ANEXO', 'As bases batem? CNES × releases')
lin = [('Panvel', 'RS', LU['RS']['panvel'], 425), ('Panvel', 'SC', LU['SC']['panvel'], 105), ('Panvel', 'PR', LU['PR']['panvel'], 130), ('Panvel', 'SP', LU['SP']['panvel'], 17),
       ('Raia', 'SP', LU['SP']['rd'], 1485), ('Raia', 'RJ', LU['RJ']['rd'], 295), ('Raia', 'MG', LU['MG']['rd'], 269), ('Raia', 'PR', LU['PR']['rd'], 217),
       ('Raia', 'RS', LU['RS']['rd'], 140), ('Raia', 'SC', LU['SC']['rd'], 121), ('Raia', 'ES', LU['ES']['rd'], 82)]
tabela(s, ['Rede', 'UF', 'CNES (abr./2026)', 'Release (set./2026)', 'CNES ÷ release'],
       [[r, u, br(a), br(b), br(100 * a / b) + '%'] for r, u, a, b in lin], 0.78, 1.55, [1.2, 0.75, 1.75, 1.85, 1.6], ['left', 'left', 'right', 'right', 'right'], size=10.5, rowh=0.36)
cartao(s, 8.2, 1.55, 4.35, 4.3)
texto(s, 8.4, 1.7, 4.0, 4.05, [[('Como ler', {'bold': True, 'color': NAVY, 'size': 14})],
      'O CNES tem 88% das lojas Panvel e 89% das da Raia no Sul e no Sudeste que os releases informam. Falta loja sem registro de serviço de saúde ou aberta depois de abril.',
      'A cobertura a 1 km e o "público sem Panvel" ficam um pouco superestimados; a ordem dos lugares tende a se manter.',
      'O argumento de SC e PR não depende do CNES: o market share da IQVIA vem dos releases.',
      'Sem venda por loja: a renda do responsável (Censo 2022) aproxima o ticket. Raio em linha reta.'], size=11, espaco=7)
fonte(s, 'CNES: farmácias ativas, competência abr./2026 (geobr/IPEA). Releases 3T26: lojas em operação em 30/09/2026. Raia Drogasil = Droga Raia + Drogasil.')
s.notes_slide.notes_text_frame.text = 'Anexo para perguntas sobre a base de lojas.'

# ── numeração ──
for k, sl in enumerate(S, 1):
    for x in sl.shapes:
        if x.has_text_frame and x.text_frame.text.strip().endswith('/ 22'):
            setp(x.text_frame.paragraphs[0], [f'{k:02d} / {TOTAL}'])
p.save(SAI)
print('ok', SAI)
