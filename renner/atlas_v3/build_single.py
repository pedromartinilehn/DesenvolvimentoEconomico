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
        'dados-indices.js', 'dados-complementares.js', 'dados-ipea.js', 'dados-ipeadata.js', 'dados-series.js',
        'dados-censo2022.js', 'dados-extracoes.js', 'dados-atlasbrasil.js']

html = (D / 'index.html').read_text(encoding='utf-8')

# --- CSS -------------------------------------------------------------------
css = (D / 'atlas.css').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="atlas.css">',
                    '<style>\n' + css + '\n</style>')

# --- tira as tags de download paralelo ------------------------------------
# No standalone tudo fica embutido, então as tags <script defer> dos dados e o
# preload do atlas.js não têm o que fazer: saem antes de embutir o conteúdo.
html = re.sub(r'<link rel="preload" as="script" href="atlas\.js">\n', '', html)
html = re.sub(r'<!--[^>]*?Os arquivos de dados baixam.*?-->\n', '', html, flags=re.S)
html, nd = re.subn(r'<script defer src="dados/dados-[a-z0-9]+\.js"></script>\n', '', html)
if nd != len(ARQS):
    sys.exit(f'ERRO: esperava {len(ARQS)} tags defer de dados, removi {nd}')

# Leaflet embutido (vendor/leaflet, versão 1.9.4, licença BSD-2). Sem isso o arquivo depende da
# internet para abrir o mapa, e em visualizadores que bloqueiam scripts externos (como a prévia de
# arquivos do celular) o atlas para com "L is not defined" e a tela fica vazia. O script fica
# bloqueante: o atlas.js embutido roda durante a análise do documento e precisa do L já definido.
import base64
lcss = (D / 'vendor/leaflet/leaflet.css').read_text(encoding='utf-8')
for img in sorted((D / 'vendor/leaflet/images').glob('*.png')):
    lcss = lcss.replace(f'images/{img.name}', 'data:image/png;base64,' + base64.b64encode(img.read_bytes()).decode())
html, nc = re.subn(r'<link rel="stylesheet" href="vendor/leaflet/leaflet\.css">', lambda m: '<style>\n' + lcss + '\n</style>', html)
ljs = (D / 'vendor/leaflet/leaflet.js').read_text(encoding='utf-8').replace('</script', '<\\/script')
html, nl = re.subn(r'<script defer src="vendor/leaflet/leaflet\.js"></script>', lambda m: '<script>' + ljs + '</script>', html)
if nc != 1 or nl != 1:
    sys.exit(f'ERRO: esperava 1 CSS e 1 JS do Leaflet para embutir, achei {nc} e {nl}')

# --- dados + aplicação, no lugar do carregador -----------------------------
def ache(nome):
    for p in (D / 'dados' / nome, D / nome):
        if p.exists():
            return p
    sys.exit(f'ERRO: não encontrei {nome} nem em dados/ nem ao lado do index.html')

partes = ['<script>' + ache(a).read_text(encoding='utf-8') + '</script>' for a in ARQS]
# id="atlas-app": a central de extração põe os dados extraídos logo antes deste bloco
partes.append('<script id="atlas-app">' + (D / 'atlas.js').read_text(encoding='utf-8') + '</script>')
embutido = '\n'.join(partes)

html, n = re.subn(r'<script id="carregador">.*?</script>', lambda m: embutido, html, flags=re.S)
if n != 1:
    sys.exit('ERRO: não encontrei o bloco <script id="carregador"> no index.html')

# --- conferências antes de gravar ------------------------------------------
for marca, rotulo in [('ATLAS_NUCLEO', 'dados-nucleo'), ('ATLAS_SETORES', 'dados-setores'),
                      ('ATLAS_MUNICIPIOS', 'dados-municipios'),
                      ('ATLAS_EST', 'dados-estimados'), ('ATLAS_PONTOS', 'dados-pontos'),
                      ('ATLAS_SERVICOS', 'dados-servicos'),
                      ('ATLAS_COMPLEMENTOS', 'dados-complementares'), ('ATLAS_IPEA=', 'dados-ipea'),
                      ('ATLAS_IPEADATA=', 'dados-ipeadata'), ('ATLAS_SERIES=', 'dados-series'), ('ATLAS_CENSO22=', 'dados-censo2022'), ('ATLAS_PACOTE=', 'dados-extracoes'),
                      ('ATLAS_ATLASBR=', 'dados-atlasbrasil'),
                      ('function montaGeo', 'atlas.js'), ('--atlas-css-ok', 'atlas.css')]:
    if marca not in html:
        sys.exit(f'ERRO: {rotulo} não entrou no arquivo final')
if 'src="dados/' in html or 'vendor/leaflet' in html or 'leaflet.min.js' in html:
    sys.exit('ERRO: sobrou referência externa a dados/')

out = D / 'atlas-rmpa.html'
out.write_text(html, encoding='utf-8')
kb = len(html.encode()) / 1024
print(f'{out.name}: {kb:.0f} KB — tudo embutido, sem arquivo externo')
if kb > 900:
    print('AVISO: acima de 900 KB. Se o download vier cortado, use a pasta '
          'com os arquivos separados.')
