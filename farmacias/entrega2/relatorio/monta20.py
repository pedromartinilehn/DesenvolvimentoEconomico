"""Versão de 20 minutos: 19 slides principais e o restante como apêndice.
    python3 monta20.py base33.pptx saida.pptx
base33.pptx: o deck de 32 slides com a divisória duplicada no fim (slide 33)."""
import sys
from pptx import Presentation
ENT, SAI = sys.argv[1:3]
p = Presentation(ENT)
assert len(p.slides) == 33
PRINC = [1, 2, 4, 5, 7, 8, 10, 11, 17, 18, 19, 16, 21, 22, 23, 24, 25, 27, 31]
APEND = [3, 6, 9, 12, 13, 14, 15, 20, 26, 28, 29, 30, 32]
ordem = PRINC + [33] + APEND
assert sorted(ordem) == list(range(1, 34))
# divisória do apêndice
s = p.slides[32]
sh = {x.shape_id: x for x in s.shapes}
def troca(sid, novo):
    tf = sh[sid].text_frame
    ps = tf.paragraphs
    ps[0].runs[0].text = novo[0]
    for r in ps[0].runs[1:]: r.text = ''
    for k, par in enumerate(ps[1:], 1):
        for j, r in enumerate(par.runs): r.text = novo[k] if (j == 0 and k < len(novo)) else ''
troca(6, ['APÊNDICE · MATERIAL DE APOIO'])
troca(7, ['Para perguntas'])
troca(8, ['Premissas, tabelas completas do 2T26, fluxo de caixa do semestre e do 9M, prazos e NCG de cada recorte, critério e detalhes do diagnóstico de lojas'])
troca(21, ['Os slides seguintes não são apresentados nos 20 minutos.', 'Ficam disponíveis para responder ao executivo.'])
s.notes_slide.notes_text_frame.text = 'Fim da apresentação. Daqui em diante, material de apoio para perguntas.'
# reordenar
lst = p.slides._sldIdLst
ids = list(lst)
for e in ids: lst.remove(e)
for k in ordem: lst.append(ids[k - 1])
# numeração
tot = len(p.slides)
for i, sl in enumerate(p.slides, 1):
    for x in sl.shapes:
        if x.has_text_frame and x.text_frame.text.strip().endswith('/ 32'):
            r = x.text_frame.paragraphs[0].runs
            r[0].text = f'{i:02d} / {tot}'
            for rr in r[1:]: rr.text = ''
# notas de tempo no slide 1
n = p.slides[0].notes_slide.notes_text_frame
n.text = n.text + ' Roteiro de 20 minutos: slides 1 a 15 na Parte 1 (cerca de 15 min) e 16 a 19 na Parte 2 (cerca de 4 min). Do 20 em diante, apêndice.'
p.save(SAI); print('ok', SAI, tot)
