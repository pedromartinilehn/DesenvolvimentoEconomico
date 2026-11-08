"""Slide 27 (SC e PR): o motivo 4 passa a ser a margem por UF (EBITDA LTM 3T26 e maturidade das lojas).

    python3 motivo_ebitda.py entrada.pptx saida.pptx

Fonte: apresentação de resultados do 3T26 da Panvel, slide 16 (EBITDA LTM por UF e maturidade por UF; a
maturidade também está no release). A ressalva do CNES que ocupava o motivo 4 continua no anexo (slide 32) e vai
para as notas do slide 27.
"""
import sys
from pptx import Presentation

ENT, SAI = sys.argv[1:3]
EB = {'RS': 12.6, 'SC': 11.2, 'PR': 9.2, 'SP': 6.2}          # EBITDA LTM 3T26, % (apresentação 3T26, slide 16)
MAD = {'RS': 83.7, 'SC': 75.2, 'PR': 72.3, 'SP': 47.1}       # lojas maduras, % (release e apresentação 3T26)
br = lambda v: f'{v:.1f}'.replace('.', ',')
p = Presentation(ENT)
s = p.slides[26]
sh = {x.shape_id: x for x in s.shapes}
tf = sh[39].text_frame
assert 'CNES' in tf.paragraphs[0].runs[0].text or 'margem' in tf.paragraphs[0].runs[0].text.lower(), tf.text
tf.paragraphs[0].runs[0].text = 'Rede madura e densa dá mais margem'
tf.paragraphs[1].runs[0].text = (f'EBITDA LTM: RS {br(EB["RS"])}% ({br(MAD["RS"])}% das lojas maduras), SC {br(EB["SC"])}%, '
                                 f'PR {br(EB["PR"])}% e SP {br(EB["SP"])}% ({br(MAD["SP"])}% maduras).')
f = sh[41].text_frame.paragraphs[0].runs[0]
if 'EBITDA' not in f.text:
    f.text = f.text.replace('Share e lojas por UF: releases 3T26 (IQVIA).', 'Share, lojas, EBITDA LTM e maturidade por UF: release e apresentação 3T26 da Panvel (IQVIA).')
n = s.notes_slide.notes_text_frame
if 'EBITDA' not in n.text:
    n.text += (f' Margem por UF (apresentação 3T26, slide 16): EBITDA LTM de {br(EB["RS"])}% no RS, {br(EB["SC"])}% em SC, {br(EB["PR"])}% no PR e '
               f'{br(EB["SP"])}% em SP. A margem acompanha a parcela de lojas maduras ({br(MAD["RS"])}%, {br(MAD["SC"])}%, {br(MAD["PR"])}% e '
               f'{br(MAD["SP"])}%): onde a rede é mais densa e madura, a margem é maior. Lojas maduras: ROIC de 60,1% e EBITDA de 12,1%. '
               'Adensar SC e PR leva escala (logística, marca, despesas centrais) a estados onde a margem ainda está abaixo da do RS. '
               'Ressalva da base: o CNES tem 85 das 105 lojas de SC; em Balneário Camboriú só há um registro da Panvel, como centro de vacinação (ver anexo).')
p.save(SAI)
print('ok', SAI)
