"""Leaflet embutido nos atlases de arquivo único (vendor/leaflet, versão 1.9.4, licença BSD-2).

Sem isso o arquivo depende da internet para abrir o mapa, e em visualizadores que bloqueiam scripts
externos (como a prévia de arquivos do app no celular) o atlas para com "L is not defined" e a tela
fica vazia. Uso nos build_single.py:

    from embute_leaflet import leaflet_css, leaflet_js
"""
import base64
import pathlib

D = pathlib.Path(__file__).resolve().parent / 'leaflet'


def leaflet_css() -> str:
    css = (D / 'leaflet.css').read_text(encoding='utf-8')
    for img in sorted((D / 'images').glob('*.png')):
        css = css.replace(f'images/{img.name}', 'data:image/png;base64,' + base64.b64encode(img.read_bytes()).decode())
    return '<style>\n' + css + '\n</style>'


def leaflet_js() -> str:
    return '<script>\n' + (D / 'leaflet.js').read_text(encoding='utf-8').replace('</script', '<\\/script') + '\n</script>'
