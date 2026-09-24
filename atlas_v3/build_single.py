#!/usr/bin/env python3
"""Junta index.html + atlas.css + atlas.js + dados/*.js num arquivo só.

    python3 build_single.py            -> atlas-rmpa.html

O index.html carrega os dados por um carregador dinâmico, que aceita tanto
dados/x.js quanto x.js solto. Aqui esse carregador é substituído pelo conteúdo
dos arquivos embutido, na ordem certa, para que o resultado funcione sozinho.
"""
import re, pathlib, sys

D = pathlib.Path(__file__).parent
ARQS = ['dados-nucleo.js', 'dados-bairros.js', 'dados-municipios.js',
        'dados-setores.js', 'dados-estimados.js', 'dados-servicos.js', 'dados-pontos.js',
        'dados-indices.js']

html = (D / 'index.html').read_text(encoding='utf-8')

# --- CSS -------------------------------------------------------------------
css = (D / 'atlas.css').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="atlas.css">',
                    '<style>\n' + css + '\n</style>')

# --- tira as tags de download paralelo ------------------------------------
# No standalone tudo fica embutido, então as tags <script defer> dos dados e o
# preload do atlas.js não têm o que fazer: saem antes de embutir o conteúdo.
html = re.sub(r'<link rel="preload" as="script" href="atlas\.js">\n', '', html)
html = re.sub(r'<!--[^>]*?Os sete arquivos de dados.*?-->\n', '', html, flags=re.S)
html, nd = re.subn(r'<script defer src="dados/dados-[a-z]+\.js"></script>\n', '', html)
if nd != len(ARQS):
    sys.exit(f'ERRO: esperava {len(ARQS)} tags defer de dados, removi {nd}')

# O Leaflet precisa voltar a ser bloqueante: no standalone o atlas.js fica
# embutido e roda durante a análise do documento, antes de qualquer script
# `defer`. Com defer no Leaflet, o atlas.js rodaria sem o L definido.
html, nl = re.subn(r'<script defer (src="[^"]*leaflet[^"]*")></script>',
                   r'<script \1></script>', html)
if nl != 1:
    sys.exit(f'ERRO: esperava 1 tag do Leaflet para tirar o defer, achei {nl}')

# --- dados + aplicação, no lugar do carregador -----------------------------
def ache(nome):
    for p in (D / 'dados' / nome, D / nome):
        if p.exists():
            return p
    sys.exit(f'ERRO: não encontrei {nome} nem em dados/ nem ao lado do index.html')

partes = ['<script>' + ache(a).read_text(encoding='utf-8') + '</script>' for a in ARQS]
partes.append('<script>' + (D / 'atlas.js').read_text(encoding='utf-8') + '</script>')
embutido = '\n'.join(partes)

html, n = re.subn(r'<script id="carregador">.*?</script>', lambda m: embutido, html, flags=re.S)
if n != 1:
    sys.exit('ERRO: não encontrei o bloco <script id="carregador"> no index.html')

# --- conferências antes de gravar ------------------------------------------
for marca, rotulo in [('ATLAS_NUCLEO', 'dados-nucleo'), ('ATLAS_SETORES', 'dados-setores'),
                      ('ATLAS_MUNICIPIOS', 'dados-municipios'),
                      ('ATLAS_EST', 'dados-estimados'), ('ATLAS_PONTOS', 'dados-pontos'),
                      ('ATLAS_SERVICOS', 'dados-servicos'),
                      ('function montaGeo', 'atlas.js'), ('--atlas-css-ok', 'atlas.css')]:
    if marca not in html:
        sys.exit(f'ERRO: {rotulo} não entrou no arquivo final')
if 'src="dados/' in html:
    sys.exit('ERRO: sobrou referência externa a dados/')

out = D / 'atlas-rmpa.html'
out.write_text(html, encoding='utf-8')
kb = len(html.encode()) / 1024
print(f'{out.name}: {kb:.0f} KB — tudo embutido, sem arquivo externo')
if kb > 900:
    print('AVISO: acima de 900 KB. Se o download vier cortado, use a pasta '
          'com os arquivos separados.')
