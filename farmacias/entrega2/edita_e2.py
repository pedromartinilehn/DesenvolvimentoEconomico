"""Atualiza a Entrega 2 com o 3T26: 4 slides novos (16–19), benchmark, respostas, conclusões, capa e numeração."""
import copy, json, sys
from pptx import Presentation
from pptx.util import Inches, Emu
from pptx.dml.color import RGBColor

ENT, SAI, NJ = sys.argv[1], sys.argv[2], sys.argv[3]
N = json.load(open(NJ))
p = Presentation(ENT)
S = p.slides
TOTAL = len(S)
assert TOTAL == 22

def f(v, d=1, sinal=False):
    s = f'{abs(v):,.{d}f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
    neg = v < 0 and round(abs(v), d) != 0
    return ('−' if neg else ('+' if sinal and round(v, d) != 0 else '')) + s

def sh(slide, sid):
    return next(s for s in slide.shapes if s.shape_id == sid)

def setp(par, textos):
    """Troca os textos dos runs de um parágrafo, mantendo a formatação; runs a mais são removidos."""
    rs = par.runs
    for r, t in zip(rs, textos):
        r.text = t
    for r in rs[len(textos):]:
        r._r.getparent().remove(r._r)
    assert len(rs) >= len(textos), (par.text, textos)

def settxt(slide, sid, *textos):
    setp(sh(slide, sid).text_frame.paragraphs[0], list(textos))

def setcell(c, t):
    setp(c.text_frame.paragraphs[0], [t])

def tabela(slide):
    return next(s for s in slide.shapes if s.has_table).table

def notas(slide, t):
    slide.notes_slide.notes_text_frame.text = t

A, B, C, D = S[15], S[16], S[17], S[18]
s25, s26, m25, m26, t25, t26 = N['set25'], N['set26'], N['9M25'], N['9M26'], N['3T25'], N['3T26']

# ── A: indicadores set/26 × set/25 ──
settxt(A, 2, 'ATUALIZAÇÃO 3T26 · PAINEL DE INDICADORES')
settxt(A, 3, 'Indicadores · 3T26 × 3T25')
T = tabela(A)
for j, t in enumerate(['3T25 (9M)', '3T26 (9M)']):
    setcell(T.cell(0, 3 + j), t)
def var(a, b, d=2, pp=False, suf=''):
    dv = b - a
    return ('▲ ' if dv > 0 else '▼ ') + f(abs(dv), d) + (' p.p.' if pp else suf)
linhas = [
    (f(s25['LC'], 2) + 'x', f(s26['LC'], 2) + 'x', var(s25['LC'], s26['LC'])),
    (f(s25['LS'], 2) + 'x', f(s26['LS'], 2) + 'x', var(s25['LS'], s26['LS'])),
    (f(s25['end_total']) + '%', f(s26['end_total']) + '%', var(s25['end_total'], s26['end_total'], 1, True)),
    (f(s25['div_cp'], 2) + 'x', f(s26['div_cp'], 2) + 'x', var(s25['div_cp'], s26['div_cp'])),
    (f(m25['cob_juros'], 2) + 'x', f(m26['cob_juros'], 2) + 'x', var(m25['cob_juros'], m26['cob_juros'])),
    (f(m25['lucratividade']) + '%', f(m26['lucratividade']) + '%', var(m25['lucratividade'], m26['lucratividade'], 1, True)),
    (f(m25['giro'], 2) + 'x', f(m26['giro'], 2) + 'x', var(m25['giro'], m26['giro'])),
    (f(m25['ROA']) + '%', f(m26['ROA']) + '%', var(m25['ROA'], m26['ROA'], 1, True)),
    (f(m25['ROE']) + '%', f(m26['ROE']) + '%', var(m25['ROE'], m26['ROE'], 1, True)),
]
for i, (a, b, v) in enumerate(linhas, 1):
    setcell(T.cell(i, 3), a); setcell(T.cell(i, 4), b); setcell(T.cell(i, 5), v)
settxt(A, 7, 'Balanço em 30/09; fluxos de jan. a set. (9M), sem anualizar: comparar 9M com 9M. O release 3T26 não traz o 9M24, necessário para o LTM do 3T25.')
dcx = s26['caixa_aplic'] - s25['caixa_aplic']; dlp = s26['empLP'] - s25['empLP']
settxt(A, 8, 'Leitura:', f' a liquidez cai (corrente {f(s25["LC"],2)} → {f(s26["LC"],2)}; seca {f(s25["LS"],2)} → {f(s26["LS"],2)}) porque caixa e aplicações ({f(dcx)} mi) pagaram dívida de longo prazo ({f(dlp)} mi). A rentabilidade melhora: ROE do 9M de {f(m25["ROE"])}% para {f(m26["ROE"])}% e cobertura de juros {f(m25["cob_juros"],2)} → {f(m26["cob_juros"],2)}.')
notas(A, 'Atualização com o release do 3T26 (IFRS, consolidado). Balanço de 30/09/2026 contra 30/09/2025. Para os indicadores de fluxo, usamos o acumulado de nove meses dos dois anos, sem anualizar, porque o release não traz o 9M24 e não dá para montar o LTM do 3T25. A queda de liquidez é escolha financeira: a empresa usou aplicações para amortizar empréstimos.')

# ── B: prazos 9M ──
settxt(B, 2, 'ATUALIZAÇÃO 3T26 · PRAZOS MÉDIOS E CICLOS')
settxt(B, 3, 'Prazos e ciclos · 9M26 × 9M25')
T = tabela(B)
setcell(T.cell(0, 2), 'Cálculo 9M25'); setcell(T.cell(0, 4), 'Cálculo 9M26')
for i, frm in enumerate(['Estoque médio ÷ CMV × 270', 'Clientes médios ÷ Receita bruta × 270', 'Fornecedores médios ÷ Compras × 270'], 1):
    setcell(T.cell(i, 1), frm)
def calc(m, k):
    c = m['calc']
    return {'PMRE': f'{f(c["em"])} ÷ {f(-m["CMV"])} × 270', 'PMRV': f'{f(c["cm"])} ÷ {f(m["RB"])} × 270',
            'PMPC': f'{f(c["fm"])} ÷ {f(c["compras"])} × 270', 'CO': f'{f(m["PMRE"])} + {f(m["PMRV"])}', 'CF': f'{f(m["CO"])} − {f(m["PMPC"])}'}[k]
for i, k in enumerate(['PMRE', 'PMRV', 'PMPC', 'CO', 'CF'], 1):
    setcell(T.cell(i, 2), calc(m25, k)); setcell(T.cell(i, 3), f(m25[k])); setcell(T.cell(i, 4), calc(m26, k)); setcell(T.cell(i, 5), f(m26[k]))
    setcell(T.cell(i, 6), f(m26[k] - m25[k], 1, True))
ESC, X0 = 3.97 / 109.8, 2.31
for (ilab, ie, ir, ic, ifo), m, lab in (((8, 9, 10, 11, 12), m25, '9M25'), ((13, 14, 15, 16, 17), m26, '9M26')):
    settxt(B, ilab, lab)
    e, r, c, fo = sh(B, ie), sh(B, ir), sh(B, ic), sh(B, ifo)
    e.left, e.width = Inches(X0), Inches(m['PMRE'] * ESC); r.left, r.width = Inches(X0 + m['PMRE'] * ESC), Inches(m['PMRV'] * ESC)
    c.left, c.width = Inches(X0), Inches(m['CF'] * ESC); fo.left, fo.width = Inches(X0 + m['CF'] * ESC), Inches(m['PMPC'] * ESC)
    settxt(B, ie, f'Estoque {m["PMRE"]:.0f}d'); settxt(B, ir, f'Rec. {m["PMRV"]:.0f}d')
    settxt(B, ic, f'Ciclo financeiro {m["CF"]:.0f}d'); settxt(B, ifo, f'Fornecedores {m["PMPC"]:.0f}d')
settxt(B, 18, 'Compras = CMV + Estoque final − Estoque inicial · 9 meses = 270 dias')
settxt(B, 19, 'Leitura:', f' o estoque gira {f(m25["PMRE"]-m26["PMRE"])} dias mais rápido, mas fornecedores encurtam {f(m25["PMPC"]-m26["PMPC"])} dias e recebíveis alongam {f(m26["PMRV"]-m25["PMRV"])}: o ciclo cai só {f(m25["CF"]-m26["CF"])} dias. Repete o padrão do 2T26.')
notas(B, 'Mesmo método dos slides de prazos, com fluxos de nove meses e base de 270 dias. Saldos médios de dezembro a setembro. A companhia divulga ciclo de caixa de 72 dias no 3T26 (controladora, saldo final), 2 dias acima do 3T25.')

# ── C: NCG e CDG ──
settxt(C, 2, 'ATUALIZAÇÃO 3T26 · NCG E CDG')
settxt(C, 3, 'NCG e CDG em set/26: o saldo de tesouraria virou')
T = tabela(C)
dez25 = ['1.867,1', '962,7', '904,4', '976,9', '72,5', '59 d', 'Sólida']
jun26 = ['1.890,1', '915,4', '974,7', '935,4', '-39,3', '59 d', 'Insatisfatória']
def col(s, rl):
    dias = s['NCG'] / rl * 360
    return [f(s['ACO']), f(s['PCO']), f(s['NCG']), f(s['CDG']), f(s['T']).replace('−', '-'), f'{dias:.0f} d*', 'Sólida' if s['T'] > 0 else 'Insatisfatória']
cols = [('Dez/25', dez25), ('Jun/26', jun26), ('Set/25', col(s25, m25['RL'] * 4 / 3)), ('Set/26', col(s26, m26['RL'] * 4 / 3))]
for j, (h, vals) in enumerate(cols, 1):
    setcell(T.cell(0, j), h)
    for i, v in enumerate(vals, 1):
        setcell(T.cell(i, j), v)
ESC_B, BASE = 1.88 / 901.5, 2.38 + 1.88
barras = [((12, 13), (14, 15), 904.4, 976.9, 'Dez/25', 72.5), ((16, 17), (18, 19), 974.7, 935.4, 'Jun/26', -39.3),
          ((20, 21), (22, 23), s25['NCG'], s25['CDG'], 'Set/25', s25['T']), ((24, 25), (26, 27), s26['NCG'], s26['CDG'], 'Set/26', s26['T'])]
for (bn, bc), (ll, lt), ncg, cdg, lab, tt in barras:
    for sid, v in ((bn, ncg), (bc, cdg)):
        b = sh(C, sid); b.height = Inches(v * ESC_B); b.top = Inches(BASE - v * ESC_B)
    settxt(C, ll, lab); settxt(C, lt, 'T ' + f(tt, 1, True))
    sh(C, lt).text_frame.paragraphs[0].runs[0].font.color.rgb = RGBColor.from_string('1F6B3A' if tt > 0 else 'B4441A')
dn = s26['NCG'] - s25['NCG']; de = s26['estoques'] - s25['estoques']; dc = s26['clientes'] - s25['clientes']; dcdg = s26['CDG'] - s25['CDG']
settxt(C, 28, 'Leitura:', f' em 12 meses a NCG sobe {f(dn)} mi (estoques {f(de,1,True)} mi; clientes {f(dc,1,True)} mi) e o CDG cai {f(-dcdg)} mi com a amortização da dívida de longo prazo: T passa de +R$ {f(s25["T"])} mi para −R$ {f(-s26["T"])} mi. * Dias sobre a receita líquida do 9M anualizada.')
notas(C, 'Mesmo modelo Fleuriet do slide anterior, com os balanços de setembro. A diferença em relação a junho é o CDG: a empresa trocou aplicações por amortização de empréstimos de longo prazo, o que reduz o passivo não circulante e, com ele, o capital de giro de longo prazo. Fornecedores (+R$ 74 mi) e impostos a pagar (+R$ 34 mi) compensaram só parte do aumento de estoques e clientes.')

# ── D: FCA 9M ──
settxt(D, 2, 'ATUALIZAÇÃO 3T26 · FLUXO DE CAIXA')
settxt(D, 3, 'Fluxo de Caixa dos Ativos · 9M26 × 9M25')
T = tabela(D)
setcell(T.cell(0, 1), '9M25'); setcell(T.cell(0, 2), '9M26')
dz = {'9M25': (1270.7, 827.9), '9M26': (1443.9, 976.9)}
def rows(m, k, s):
    ii, cc = dz[k]
    return [m['EBIT'], m['DA'], m['IR'], m['FCO_aula'], s['imob_intang'], -ii, m['DA'], m['GC'], s['CCL'], -cc, m['dCCL'], m['FCA']]
r25, r26 = rows(m25, '9M25', s25), rows(m26, '9M26', s26)
assert len(T.rows) == 13
for i, (a, b) in enumerate(zip(r25, r26), 1):
    setcell(T.cell(i, 1), f(a)); setcell(T.cell(i, 2), f(b))
    dlt = b - a
    setcell(T.cell(i, 3), ('+' if dlt > 0 else '−') + f(abs(dlt)))
settxt(D, 21, f'9M25: {f(m25["FCA_sem_caixa"])} · 9M26: {f(m26["FCA_sem_caixa"])}')
settxt(D, 22, f'Δ caixa + aplic.: {f(m25["dcaixa"],1,True)} · {f(m26["dcaixa"],1,True)}')
settxt(D, 26, 'Leitura:', f' FCA de R$ {f(m26["FCA"],0)} mi inflado pelo ', 'resgate de aplicações', f' ({f(m26["dcaixa"])} mi, usado para amortizar dívida). Sem esse efeito: R$ {f(m26["FCA_sem_caixa"],0)} mi contra R$ {f(m25["FCA_sem_caixa"],0)} mi no 9M25. Pela DFC, a sobra após capex e aluguéis cai de R$ {f(m25["livre"],0)} mi para R$ {f(m26["livre"],0)} mi.')
notas(D, f'Mesmo método do FCA de aula, de dezembro a setembro. Pela DFC oficial do 9M: caixa operacional de R$ {f(m26["DFC_FCO"])} mi (R$ {f(m25["DFC_FCO"])} mi no 9M25), capex de R$ {f(m26["capex"])} mi e arrendamentos pagos de R$ {f(m26["arrend"])} mi. O caixa operacional cai porque estoques consumiram R$ 105 mi e fornecedores R$ 49 mi.')

# ── benchmark (slide 20): linhas do 3T26 ──
Bm = S[19]
T = tabela(Bm)
tbl = T._tbl
novos = [('Panvel', '3T26', '97', '30', '55', '72', '+2'), ('RD Saúde', '3T26', '102,4', '27,6', '75,8', '54,2', '−2,4'), ('Pague Menos', '3T26', '103', '32', '63', '72', '+4')]
for vals in novos:
    tr = copy.deepcopy(tbl.tr_lst[-1]); tbl.append(tr)
for i, vals in enumerate(novos):
    for j, v in enumerate(vals):
        setcell(T.cell(7 + i, j), v)
for r in T.rows:
    r.height = Inches(0.27)
gf = next(s for s in Bm.shapes if s.has_table); gf.height = Inches(0.27 * 10)
for sid in (4, 5):
    sh(Bm, sid).height = Inches(0.27 * 10 + 0.02)
settxt(Bm, 9, 'A Panvel tem o menor PME dos três (86–97 dias contra 102–104).')
settxt(Bm, 12, 'PMP de 54–55 dias contra 63–79 dos pares: 8 a 25 dias a menos de financiamento.')
settxt(Bm, 15, 'No 3T26 a RD segue com o maior PMP (75,8); a Pague Menos caiu para 63.')
settxt(Bm, 16, 'Fonte: releases 4T25, 2T26 e 3T26 de cada companhia. Metodologias diferem (Panvel: controladora; RD e Pague Menos: ajustes de antecipações/AVP) — comparar direção e ordem de grandeza.')

# ── respostas (21) e conclusões (22) ──
R_ = S[20]
settxt(R_, 7, 'Liquidez corrente ~1,7x e seca em alta até jun/26 (0,73 → 0,86 em 2025; 0,76 → 0,79). Em set/26 caem (1,68x; 0,72x): caixa usado para amortizar dívida.')
settxt(R_, 11, 'Neutro em 2025 (+R$ 15 mi). Principal pressão em jun/26 (+R$ 116 mi) e set/26 (+R$ 139 mi), mas por volume de vendas: o PMRE caiu.')
settxt(R_, 19, 'Sim em 2025 (FCO DFC R$ 473 mi; sobra de R$ 110 mi após capex e aluguéis). No 9M26 a sobra caiu para R$ 19 mi e a dívida foi paga com aplicações.')
settxt(R_, 23, 'Em dez/25 sim (T = +R$ 72 mi). Em jun/26 e set/26 não (T de −R$ 39 mi e −R$ 93 mi).')
Cc = S[21]
par = sh(Cc, 4).text_frame.paragraphs[0]
for r in par.runs:
    if 'jun/26' in r.text:
        r.text = r.text.replace('em jun/26', 'em jun/26 e set/26')
notas(R_, 'Respostas atualizadas com o 3T26: a liquidez e o saldo de tesouraria pioram em setembro por decisão de amortizar dívida com aplicações; o estoque segue como o maior consumo de capital de giro em valor, mas o prazo de estoque continua caindo.')

# ── capa, premissas e numeração ──
settxt(S[0], 8, '2025 × 2024 (exercício) · 2T26 × 2T25 (trimestre) · atualização 3T26')
for k, sl in enumerate(S, 1):
    for s in sl.shapes:
        if s.has_text_frame and s.text_frame.text.strip().endswith('/ 18'):
            setp(s.text_frame.paragraphs[0], [f'{k:02d} / {TOTAL}'])
for s in S[1].shapes:
    if s.has_text_frame and 'Releases de Resultados 4T25, 2T25 e 2T26' in s.text_frame.text:
        for pa in s.text_frame.paragraphs:
            for r in pa.runs:
                r.text = r.text.replace('4T25, 2T25 e 2T26', '4T25, 2T25, 2T26 e 3T26')
from pptx.util import Pt
def sem_encolher(shape):
    for el in shape.text_frame._txBody.iter():
        if el.tag.endswith('}normAutofit') and el.get('fontScale'):
            el.attrib.pop('fontScale', None); el.attrib.pop('lnSpcReduction', None)
for r in T.rows:
    for c in r.cells:
        c.margin_top = c.margin_bottom = Inches(0.02)
        for pa in c.text_frame.paragraphs:
            for ru in pa.runs:
                ru.font.size = Pt(10)
for sid, dy in ((7, .2), (8, .2), (9, .2), (10, .2), (11, .2), (12, .2), (13, .2), (14, .2), (15, .2)):
    x = sh(Bm, sid); x.top = x.top + Inches(dy)
for sid in (9, 12, 15):
    sem_encolher(sh(Bm, sid))
for sid in (7, 11, 15, 19, 23):
    sem_encolher(sh(R_, sid))
settxt(R_, 15, 'Em nível, por estoques (~103–116 dias, ~78% do CO). Na variação e contra os pares, por fornecedores: o PMPC encurtou e é 8–25 dias menor.')
for r in sh(Cc, 10).text_frame.paragraphs[0].runs:
    r.text = r.text.replace('nos dois recortes', 'em todos os recortes')
for r in sh(Cc, 14).text_frame.paragraphs[0].runs:
    if r.text.rstrip().endswith('estoques.'):
        r.text = r.text.rstrip()[:-1] + '; no 3T26, fluxos em 9M sem anualizar (falta o 9M24 para o LTM).'
sem_encolher(sh(Cc, 10))
for sl in (S[13], C):
    x = sh(sl, 28); x.top = x.top + Inches(0.32)
p.save(SAI)
print('ok', SAI)
