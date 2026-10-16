#!/usr/bin/env python3
"""Gera atlas2-brasil.html: o Atlas 2.0 num arquivo só, com todas as regiões dentro.

    python3 build_single.py

Junta index.html, atlas2.css, atlas2.js e os arquivos de dados/. As regiões entram
como JSON (<script type="application/json">) e o Atlas só lê a região escolhida.
O mapa base (Leaflet) e as fontes continuam vindo da internet, como na pasta.
"""
from __future__ import annotations

import json
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent
SAIDA = RAIZ / "atlas2-brasil.html"
REGIOES = ["N", "NE", "CO", "SE", "S"]


def main() -> int:
    html = (RAIZ / "index.html").read_text(encoding="utf-8")
    css = (RAIZ / "atlas2.css").read_text(encoding="utf-8")
    js = (RAIZ / "atlas2.js").read_text(encoding="utf-8")
    br = (RAIZ / "dados" / "brasil.js").read_text(encoding="utf-8")
    for marca in ('<link rel="stylesheet" href="atlas2.css">', '<script src="dados/brasil.js"></script>',
                  '<script src="atlas2.js"></script>'):
        if html.count(marca) != 1:
            sys.exit(f"index.html sem a marca esperada: {marca}")
    blocos = []
    for sig in REGIOES:
        txt = (RAIZ / "dados" / f"regiao-{sig.lower()}.js").read_text(encoding="utf-8")
        ini = f'window.ATLAS2_REGIAO[{json.dumps(sig)}]='
        k = txt.index(ini) + len(ini)
        corpo = txt[k:].rstrip().rstrip(";")
        json.loads(corpo)                                   # confere que é JSON válido
        seguro = corpo.replace("</", "<\\/")               # "<\/" é escape válido em JSON
        blocos.append(f'<script type="application/json" data-regiao="{sig}">{seguro}</script>')
    html = html.replace('<link rel="stylesheet" href="atlas2.css">', f"<style>\n{css}\n</style>")
    html = html.replace('<script src="dados/brasil.js"></script>',
                        "<script>\n" + br.replace("</script", "<\\/script") + "\n</script>\n" + "\n".join(blocos))
    html = html.replace('<script src="atlas2.js"></script>', "<script>\n" + js.replace("</script", "<\\/script") + "\n</script>")
    SAIDA.write_text(html, encoding="utf-8")
    print(f"{SAIDA.name}: {SAIDA.stat().st_size / 1e6:.1f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
