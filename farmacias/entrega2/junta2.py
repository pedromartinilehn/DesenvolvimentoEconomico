"""Ajustes a partir do documento estratégico: resumo executivo (slide 2) e dois slides novos na Parte 2 (28 e 30).

    python3 junta2.py base2.pptx saida.pptx analise_md.json
"""
import json
import sys

from lxml import etree
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

ENT, SAI, ARQ = sys.argv[1:4]
A = json.load(open(ARQ, encoding='utf-8'))
p = Presentation(ENT)
S = p.slides
assert len(S) == 32
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




def base(slide, kicker, titulo):
    limpa(slide, {2, 3, 15, 16})
    setp(sh(slide, 2).text_frame.paragraphs[0], [kicker])
    setp(sh(slide, 3).text_frame.paragraphs[0], [titulo])


# ── 2: resumo executivo ──
s = S[1]
base(s, 'RESUMO EXECUTIVO', 'Resumo: rentável, mas o giro prende caixa')
b = cartao(s, 0.78, 1.55, 11.77, 0.85, fill=NAVY, borda=None)
texto(s, 1.0, 1.62, 11.3, 0.72, [[('Mensagem: ', {'bold': True, 'color': 'FFFFFF'}),
      ('a operação é rentável e melhora (EBIT +30% em 2025; ROE de 9,7%), mas o estoque e o prazo curto de fornecedores mantêm o ciclo financeiro perto de 78 dias. Em set/26 a dívida foi paga com aplicações e o saldo de tesouraria ficou negativo.', {'color': 'FFFFFF'})]],
      size=12.5, anchor=MSO_ANCHOR.MIDDLE)
cards = [('Estrutura e resultado', 'Liquidez corrente ~1,7x. Receita +11,5% em 2025 e +15,7% no 2T26; EBIT cresce acima da receita. O resultado financeiro consome 42–50% do EBIT.'),
         ('Capital de giro', 'Estoque é ~78% do ciclo operacional, mas a Panvel tem o menor prazo de estoque dos três (86–97 dias). O gap está no fornecedor: 54–55 dias, contra 63–79 dos pares.'),
         ('Caixa', 'FCO de R$ 473 mi em 2025, com sobra de R$ 110 mi após capex e aluguéis. No 9M26 a sobra caiu para R$ 19 mi. T: +R$ 72 mi (dez/25) → −R$ 93 mi (set/26).')]
for i, (tt, tx) in enumerate(cards):
    x = 0.78 + i * 3.97
    cartao(s, x, 2.6, 3.8, 1.75)
    texto(s, x + 0.2, 2.72, 3.4, 1.55, [[(tt, {'bold': True, 'color': NAVY, 'size': 13})], tx], size=11, espaco=4)
texto(s, 0.78, 4.55, 6.0, 0.35, [[('Recomendação: quanto vale cada dia de capital de giro', {'bold': True, 'color': NAVY})]], size=13)
tabela(s, ['Alavanca', 'Base (LTM 2T26)', 'Caixa liberado'],
       [['+5 dias de prazo com fornecedores', 'compras R$ 4.108 mi ÷ 360 × 5', '≈ R$ 57 mi'],
        ['−1 dia de estoque', 'CMV R$ 3.992 mi ÷ 360', '≈ R$ 11 mi por dia'],
        ['−1 dia de recebíveis', 'receita bruta R$ 6.371 mi ÷ 360', '≈ R$ 18 mi por dia']],
       0.78, 4.92, [4.6, 4.2, 2.97], ['left', 'left', 'right'], size=11, rowh=0.32)
s.notes_slide.notes_text_frame.text = ('Resumo para o executivo em um minuto. Mensagem: a Panvel é rentável e melhora, mas o capital de giro prende caixa. '
                                       'A recomendação é negociar prazo com fornecedores: chegar perto do prazo da Pague Menos (63 dias) liberaria em torno de R$ 90 mi. '
                                       'Cálculos: compras, CMV e receita bruta dos últimos 12 meses até o 2T26, divididos por 360.')

# ── 28: interior do Sul ──
cm = A['cidades_medias']
s = S[27]
base(s, 'DIAGNÓSTICO DE LOJAS · INTERIOR', 'Interior do Sul: nas cidades médias, a Raia chegou primeiro')
for i, u in enumerate(('RS', 'SC', 'PR')):
    n, c = cm['por_uf'][u]
    x = 0.78 + i * 2.08
    cartao(s, x, 1.55, 1.95, 1.1)
    texto(s, x + 0.18, 1.62, 1.65, 0.55, [[(f'{c} de {n}', {'bold': True, 'color': GRAY if c == n else NAVY, 'size': 22})]])
    texto(s, x + 0.18, 2.18, 1.7, 0.42, f'cidades médias de {u} com Panvel', size=10, color=GRAY)
cartao(s, 7.1, 1.55, 5.45, 1.1, fill='FCEEE6', borda='F2C2A5')
texto(s, 7.3, 1.63, 5.1, 0.95, [[(f'{cm["sem_panvel_com_rd"]} das {cm["sem_panvel"]} cidades médias sem Panvel no CNES já têm Raia', {'bold': True, 'color': ORANGE})],
      'O vácuo existe em SC e no PR; no RS a Panvel já está em todas.'], size=11.5)
lin = []
for d in cm['top'][:8]:
    lin.append([d['nome'] + ('*' if d['nome'] == 'Indaial' else ''), d['uf'], br(d['pop']), ('+' if d['var_pop'] > 0 else '') + br(d['var_pop'], 1) + '%', 'R$ ' + br(d['renda_resp']),
                br(d['pct_60mais'], 1) + '%', 'R$ ' + br(d['pib_pc'] / 1000) + ' mil', str(d['rd'])])
tabela(s, ['Cidade sem Panvel no CNES', 'UF', 'População 2022', 'Cresc. 2010–22', 'Renda do responsável', '60+', 'PIB per capita', 'Lojas da Raia'],
       lin, 0.78, 2.85, [2.75, 0.55, 1.45, 1.45, 1.75, 0.9, 1.5, 1.42], ['left', 'left'] + ['right'] * 6, size=10.5, rowh=0.31)
leitura(s, 'quase todas as cidades médias sem Panvel têm Raia, e as melhores ficam em SC. Mas a lista vem do CNES, que não registra toda a rede (Balneário Camboriú saiu por isso): conferir cada cidade antes de decidir. Ordem: média dos percentis de renda, 60+ e crescimento.', y=5.75, h=0.6)
fonte(s, 'Cidades médias: 50 a 200 mil hab. (Censo 2022). Indicadores: Atlas 2.0 (Censos 2022 e 2010, PIB 2021). Lojas: CNES abr./2026, qualquer tipo de registro. * Um diretório na web lista uma Panvel em Indaial (não confirmado).', y=6.45)
s.notes_slide.notes_text_frame.text = (f'O documento estratégico sugere ocupar as cidades médias antes da chegada da Raia. No Sul ela já chegou: das {cm["sem_panvel"]} cidades médias sem Panvel no CNES, {cm["sem_panvel_com_rd"]} têm Raia. '
                                       'No RS todas as 33 cidades médias têm Panvel; o espaço está em SC e no PR. Cuidado com a base: o CNES tem 88% das lojas da Panvel. Balneário Camboriú tem várias lojas, mas só um registro, como centro de imunização, e saiu da lista. Antes de levar uma cidade adiante, conferir no localizador de lojas da Panvel.')

# ── 30: cobertura e aglomeração ──
um, pr_, vz, mi, pf = A['ultima_milha'], A['panvel_ate_raia'], A['vizinho_mesma_rede'], A['micro_500m'], A['perfis']
s = S[29]
base(s, 'DIAGNÓSTICO DE LOJAS · ÚLTIMA MILHA', 'Onde a entrega rápida tem buracos')
lin = [[n, br(v['pop_top10']), br(v['panvel_1500'], 0) + '%', br(v['rd_1500'], 0) + '%', f"{v['lojas_panvel']} × {v['lojas_rd']}"]
       for n, v in um.items()]
tabela(s, ['Cidade', 'Moradores de alta renda', 'Panvel a 1,5 km', 'Raia a 1,5 km', 'Lojas Panvel × Raia'], lin, 0.78, 1.55,
       [1.7, 1.75, 1.4, 1.35, 1.6], ['left'] + ['right'] * 4, size=11, rowh=0.36)
texto(s, 0.78, 4.15, 7.8, 0.5, 'Alta renda: os 10% mais ricos de cada cidade, pelos setores censitários. A Raia diz ter 95% da classe A do país a até 1,5 km de uma loja.', size=9.5, color=GRAY)
st = [(f'{br(pr_["mediana_m"])} m', 'distância mediana de uma Panvel até a Raia mais próxima; 46% das Panvel têm uma Raia a até 500 m'),
      (f'{br(vz["Porto Alegre"]["panvel"]["mediana_m"])} m', f'entre uma Panvel e a Panvel mais próxima em Porto Alegre: rede mais densa que a da Raia em SP ({br(vz["São Paulo"]["rd"]["mediana_m"])} m)')]
for i, (n, tx) in enumerate(st):
    y = 1.55 + i * 1.3
    cartao(s, 8.85, y, 3.7, 1.18)
    texto(s, 9.05, y + 0.08, 3.35, 0.45, [[(n, {'bold': True, 'color': NAVY, 'size': 18})]])
    texto(s, 9.05, y + 0.52, 3.35, 0.62, tx, size=10)
cartao(s, 8.85, 4.15, 3.7, 1.45)
texto(s, 9.05, 4.23, 3.35, 1.3, [[('Três perfis de loja Panvel (mix)', {'bold': True, 'color': NAVY})],
      f'Premium: {pf[0]["lojas"]} lojas, renda R$ {br(pf[0]["renda"])}, 60+ {br(pf[0]["p60"], 0)}%',
      f'Renda alta, mais jovem: {pf[1]["lojas"]}, R$ {br(pf[1]["renda"])}, 60+ {br(pf[1]["p60"], 0)}%',
      f'Bairro: {pf[2]["lojas"]}, R$ {br(pf[2]["renda"])}, 60+ {br(pf[2]["p60"], 0)}%'], size=10)
leitura(s, 'em Porto Alegre e Florianópolis a Panvel cobre a alta renda melhor que a Raia; em Curitiba, Joinville e São Paulo ficam buracos que a Raia já cobre. Ônibus, calçada e pavimento no entorno das lojas são iguais nas duas redes: não diferenciam.', y=5.75, h=0.6)
fonte(s, 'Censo 2022 (setores) e lojas do CNES (abr./2026); raio em linha reta, não isócrona. Perfis: k-médias com renda, 60+ e moradores a 1 km das 591 lojas com dado.', y=6.45)
s.notes_slide.notes_text_frame.text = ('Teste das ideias de última milha e de aglomeração. Sem malha viária, usamos o raio de 1,5 km, a mesma métrica que a Raia divulga. '
                                       'A Panvel faz em Porto Alegre o "paredão" que o documento atribui à Raia: a loja Panvel mais próxima fica, na mediana, a 352 m. '
                                       f'Entorno de 500 m (RS, SC e PR): ponto de ônibus {br(mi["panvel"]["pct_onibus"], 1)}% Panvel e {br(mi["rd"]["pct_onibus"], 1)}% Raia, contra {br(mi["pop_RS_SC_PR"]["pct_onibus"], 1)}% na média da população.')

# ── numeração ──
TOTAL = len(S)
for k, sl in enumerate(S, 1):
    for x in sl.shapes:
        if x.has_text_frame and x.text_frame.text.strip().endswith('/ 29'):
            setp(x.text_frame.paragraphs[0], [f'{k:02d} / {TOTAL}'])
p.save(SAI)
print('ok', SAI)
