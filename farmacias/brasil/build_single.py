#!/usr/bin/env python3
"""Gera farmacias-brasil.html: o atlas das farmácias num arquivo só.

    python3 build_single.py

Junta index.html, os estilos e os scripts do Atlas 2.0 (atlas2/atlas2.css e
atlas2/atlas2.js), os dados do Atlas 2.0 (atlas2/dados/) e os das farmácias
(dados/farmacias.js, farmacias-brasil.css e farmacias-brasil.js). As regiões do
Atlas 2.0 entram como JSON (<script type="application/json">) e o atlas só lê a
região escolhida. O Leaflet vem embutido (vendor/leaflet); só as fontes e o mapa de fundo vêm da internet,
como na pasta.
"""
from __future__ import annotations

import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent.parent / "vendor"))
from embute_leaflet import leaflet_css, leaflet_js  # noqa: E402

RAIZ = pathlib.Path(__file__).resolve().parent                # farmacias/brasil/
ATLAS2 = RAIZ.parent.parent / "atlas2"
SAIDA = RAIZ / "farmacias-brasil.html"
REGIOES = ["N", "NE", "CO", "SE", "S"]


def script(js: str) -> str:
    return "<script>\n" + js.replace("</script", "<\\/script") + "\n</script>"


def main() -> int:
    html = (RAIZ / "index.html").read_text(encoding="utf-8")
    marcas = {
        '<link rel="stylesheet" href="../../vendor/leaflet/leaflet.css">': leaflet_css(),
        '<script src="../../vendor/leaflet/leaflet.js"></script>': leaflet_js(),
        '<link rel="stylesheet" href="../../atlas2/atlas2.css">':
            "<style>\n" + (ATLAS2 / "atlas2.css").read_text(encoding="utf-8") + "\n</style>",
        '<link rel="stylesheet" href="farmacias-brasil.css">':
            "<style>\n" + (RAIZ / "farmacias-brasil.css").read_text(encoding="utf-8") + "\n</style>",
        '<script src="dados/farmacias.js"></script>': script((RAIZ / "dados" / "farmacias.js").read_text(encoding="utf-8")),
        '<script src="farmacias-brasil.js"></script>': script((RAIZ / "farmacias-brasil.js").read_text(encoding="utf-8")),
        '<script src="../../atlas2/atlas2.js"></script>': script((ATLAS2 / "atlas2.js").read_text(encoding="utf-8")),
    }
    blocos = []
    for sig in REGIOES:
        txt = (ATLAS2 / "dados" / f"regiao-{sig.lower()}.js").read_text(encoding="utf-8")
        ini = f"window.ATLAS2_REGIAO[{json.dumps(sig)}]="
        corpo = txt[txt.index(ini) + len(ini):].rstrip().rstrip(";")
        json.loads(corpo)                                   # confere que é JSON válido
        seguro = corpo.replace("</", "<\\/")              # "<\/" é escape válido em JSON
        blocos.append(f'<script type="application/json" data-regiao="{sig}">{seguro}</script>')
    marcas['<script src="../../atlas2/dados/brasil.js"></script>'] = (
        script((ATLAS2 / "dados" / "brasil.js").read_text(encoding="utf-8")) + "\n" + "\n".join(blocos))
    for marca, novo in marcas.items():
        if html.count(marca) != 1:
            sys.exit(f"index.html sem a marca esperada: {marca}")
        html = html.replace(marca, novo)
    SAIDA.write_text(html, encoding="utf-8")
    print(f"{SAIDA.name}: {SAIDA.stat().st_size / 1e6:.1f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
