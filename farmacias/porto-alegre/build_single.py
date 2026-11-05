#!/usr/bin/env python3
"""Gera atlas-poa.html: o Atlas Porto Alegre num arquivo só.

    python3 build_single.py

Junta index.html, atlas-poa.css, atlas-poa.js e dados/poa.js. O mapa base
(Leaflet) e as fontes continuam vindo da internet, como na pasta.
"""
from __future__ import annotations

import json
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent
SAIDA = RAIZ / "atlas-poa.html"


def main() -> int:
    html = (RAIZ / "index.html").read_text(encoding="utf-8")
    css = (RAIZ / "atlas-poa.css").read_text(encoding="utf-8")
    js = (RAIZ / "atlas-poa.js").read_text(encoding="utf-8")
    dados = (RAIZ / "dados" / "poa.js").read_text(encoding="utf-8")
    ini = "window.ATLAS_POA="
    if not dados.startswith(ini):
        sys.exit("dados/poa.js sem window.ATLAS_POA")
    json.loads(dados[len(ini):].rstrip().rstrip(";"))      # confere que é JSON válido
    for marca in ('<link rel="stylesheet" href="atlas-poa.css">', '<script src="dados/poa.js"></script>',
                  '<script src="atlas-poa.js"></script>'):
        if html.count(marca) != 1:
            sys.exit(f"index.html sem a marca esperada: {marca}")
    html = html.replace('<link rel="stylesheet" href="atlas-poa.css">', f"<style>\n{css}\n</style>")
    html = html.replace('<script src="dados/poa.js"></script>',
                        "<script>\n" + dados.replace("</script", "<\\/script") + "\n</script>")
    html = html.replace('<script src="atlas-poa.js"></script>',
                        "<script>\n" + js.replace("</script", "<\\/script") + "\n</script>")
    SAIDA.write_text(html, encoding="utf-8")
    print(f"{SAIDA.name}: {SAIDA.stat().st_size / 1e6:.1f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
