#!/usr/bin/env python3
"""Atualiza as camadas de saúde com o CNES de abril de 2026 para os 7 municípios.

Requer ``pyarrow`` para ler o arquivo Parquet distribuído pelo geobr/Ipea.
O dado primário é o CNES/DATASUS; o geobr harmoniza e corrige coordenadas.

Uso:
    pip install pyarrow
    python 2_atualiza_cnes.py

Para reaproveitar um download, ou usar uma competência mais nova:
    python 2_atualiza_cnes.py --arquivo healthfacilities_202604.parquet

A competência gravada no Atlas sai do nome do arquivo (healthfacilities_AAAAMM).
Se o arquivo tiver outro nome, informe com --competencia AAAAMM.

Para só reaplicar as regras de classificação abaixo ao arquivo de pontos que
já está em dados/, sem baixar nada:
    python 2_atualiza_cnes.py --reclassificar

Regras de classificação (auditoria de outubro de 2026, achados E1 e E2):
- Tipo 81 do CNES é "Central de Regulação do Acesso": unidade administrativa,
  sem atendimento ao público. Fica de fora.
- Tipo 83 é "Polo de Prevenção de Doenças e Agravos e Promoção da Saúde", que
  na região reúne comunidades terapêuticas, residenciais terapêuticos e
  geriátricos. Sai da camada de saúde e vai para a camada própria
  "acolhimento", que interessa à assistência social.
- Unidades dentro de presídios e de unidades socioeducativas atendem só a
  população da unidade. Ficam na camada de saúde, marcadas como de acesso
  restrito, e não entram nas contagens de estabelecimentos nem de UBS. A
  marcação é pelo nome (expressão RESTRITO abaixo); confira a lista impressa
  a cada atualização.
"""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import tempfile
import urllib.request


ROOT = pathlib.Path(__file__).resolve().parents[1]
DADOS = ROOT / "dados"
URL = (
    "https://github.com/ipea/geobr_prep_data/releases/download/v2.0.0/"
    "healthfacilities_202604.parquet"
)
CODIGOS = [4314902, 4304606, 4309209, 4320008, 4303103, 4309308, 4307708]
PRECISAO = 100_000

# camada "Unidades de saúde": atendimento à população
TIPOS = {
    1: "Posto de saúde",
    2: "Centro de saúde / UBS",
    4: "Policlínica",
    5: "Hospital geral",
    7: "Hospital especializado",
    15: "Unidade mista",
    20: "Pronto-socorro geral",
    21: "Pronto-socorro especializado",
    62: "Hospital-dia",
    70: "CAPS",
    71: "Centro de apoio à saúde da família",
    72: "Unidade de atenção à saúde indígena",
    73: "Pronto atendimento",
}
# camada "Comunidades terapêuticas e residenciais"
ACOLHIMENTO = {
    83: "Polo de prevenção de doenças e promoção da saúde (comunidade terapêutica ou residencial)",
}
# fora do Atlas
DESCARTADOS = {
    81: "Central de regulação do acesso",
}
RESTRITO = re.compile(r"PRISION|PENITENC|PRESIDI|SOCIOEDUC|\bCASE\b|\bCASEF\b")
# nomes possíveis da coluna do código CNES no Parquet do geobr
COLUNAS_CODIGO = ("code_cnes", "co_cnes", "cnes", "co_unidade")


def carregar_pontos() -> dict:
    p = DADOS / "dados-pontos.js"
    texto = p.read_text(encoding="utf-8").strip()
    return json.loads(texto.removeprefix("window.ATLAS_PONTOS=").rstrip(";"))


def gravar_pontos(pontos: dict) -> pathlib.Path:
    destino = DADOS / "dados-pontos.js"
    destino.write_text(
        "window.ATLAS_PONTOS="
        + json.dumps(pontos, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    return destino


def codificar_numero(numero: int) -> str:
    numero = ~(numero << 1) if numero < 0 else numero << 1
    saida = []
    while numero >= 0x20:
        saida.append(chr((0x20 | (numero & 0x1F)) + 63))
        numero >>= 5
    saida.append(chr(numero + 63))
    return "".join(saida)


def codificar_pontos(pontos: list[tuple[float, float]], precisao: int = PRECISAO) -> str:
    x_ant = y_ant = 0
    partes = []
    for x, y in pontos:
        xi, yi = round(x * precisao), round(y * precisao)
        partes.extend((codificar_numero(xi - x_ant), codificar_numero(yi - y_ant)))
        x_ant, y_ant = xi, yi
    return "".join(partes)


def decodificar_pontos(texto: str, n: int, precisao: int = PRECISAO) -> list[tuple[float, float]]:
    i = 0

    def um() -> int:
        nonlocal i
        r = sh = 0
        while True:
            b = ord(texto[i]) - 63
            i += 1
            r |= (b & 31) << sh
            sh += 5
            if b < 32:
                break
        return ~(r >> 1) if r & 1 else r >> 1

    x = y = 0
    saida = []
    for _ in range(n):
        x += um()
        y += um()
        saida.append((x / precisao, y / precisao))
    return saida


def monta_camadas(registros: list[dict], meta: dict) -> tuple[dict, dict, dict]:
    """registros: nome, m (índice do município), tipo, x, y e, se houver, codigo."""
    saude = [r for r in registros if r["tipo"] in TIPOS]
    acolh = [r for r in registros if r["tipo"] in ACOLHIMENTO]
    fora = [r for r in registros if r["tipo"] in DESCARTADOS]
    outros = [r for r in registros if r["tipo"] not in TIPOS | ACOLHIMENTO | DESCARTADOS]
    if outros:
        raise SystemExit(f"tipos sem regra: {sorted({r['tipo'] for r in outros})}")

    def camada(lista: list[dict], legenda: dict, extra: dict) -> dict:
        lista = sorted(lista, key=lambda r: (r["m"], r["nome"]))
        d = {
            "nomes": [r["nome"] for r in lista],
            "m": [r["m"] for r in lista],
            "tipo": [r["tipo"] for r in lista],
            "xy": codificar_pontos([(r["x"], r["y"]) for r in lista]),
            "legenda": {str(k): v for k, v in legenda.items()},
            **meta,
            **extra,
        }
        if any(r.get("codigo") for r in lista):
            d["cod"] = [r.get("codigo") or None for r in lista]
        return d, lista

    saude_d, saude_l = camada(saude, TIPOS, {})
    saude_d["restrito"] = [1 if RESTRITO.search(r["nome"].upper()) else 0 for r in saude_l]
    saude_d["metodo"] = (
        "estabelecimentos ativos de atendimento; sem centrais de regulação (tipo 81); "
        "comunidades terapêuticas e residenciais (tipo 83) na camada própria; "
        "unidades prisionais e socioeducativas marcadas como de acesso restrito"
    )
    acolh_d, _ = camada(acolh, ACOLHIMENTO, {
        "metodo": "CNES tipo 83: comunidades terapêuticas, residenciais terapêuticos e geriátricos",
    })
    resumo = {
        "saude": len(saude),
        "acolhimento": len(acolh),
        "descartados": len(fora),
        "restritos": [n for n, f in zip(saude_d["nomes"], saude_d["restrito"]) if f],
    }
    return saude_d, acolh_d, resumo


def imprime(resumo: dict) -> None:
    print(f"  unidades de saúde: {resumo['saude']}")
    print(f"  comunidades terapêuticas e residenciais: {resumo['acolhimento']}")
    print(f"  centrais de regulação deixadas de fora: {resumo['descartados']}")
    print(f"  de acesso restrito (confira): {len(resumo['restritos'])}")
    for n in resumo["restritos"]:
        print(f"    · {n}")


def reclassificar() -> None:
    pontos = carregar_pontos()
    antigos = [pontos["saude"]] + ([pontos["acolhimento"]] if "acolhimento" in pontos else [])
    registros = []
    for d in antigos:
        xy = decodificar_pontos(d["xy"], len(d["nomes"]))
        cods = d.get("cod") or [None] * len(d["nomes"])
        for nome, m, tipo, (x, y), cod in zip(d["nomes"], d["m"], d["tipo"], xy, cods):
            registros.append({"nome": nome, "m": m, "tipo": int(tipo), "x": x, "y": y, "codigo": cod})
    base = pontos["saude"]
    meta = {k: base[k] for k in ("fonte", "ano", "competencia") if k in base}
    pontos["saude"], pontos["acolhimento"], resumo = monta_camadas(registros, meta)
    destino = gravar_pontos(pontos)
    print(f"{destino}: regras reaplicadas")
    imprime(resumo)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--arquivo", type=pathlib.Path)
    parser.add_argument("--competencia", help="AAAAMM do arquivo, se o nome não disser")
    parser.add_argument("--reclassificar", action="store_true",
                        help="só reaplica as regras ao dados-pontos.js atual, sem baixar")
    args = parser.parse_args()
    if args.reclassificar:
        reclassificar()
        return

    # competência: do argumento, do nome do arquivo ou, no download padrão, da URL
    nome_comp = re.search(r"healthfacilities_(\d{6})", (args.arquivo or pathlib.Path(URL)).name)
    competencia = args.competencia or (nome_comp.group(1) if nome_comp else None)
    if not competencia or not re.fullmatch(r"20\d{2}(0[1-9]|1[0-2])", competencia):
        raise SystemExit("Informe a competência do arquivo: --competencia AAAAMM")

    try:
        import pyarrow.compute as pc
        import pyarrow.dataset as ds
    except ImportError as exc:
        raise SystemExit("Instale pyarrow: pip install pyarrow") from exc

    temporario = None
    arquivo = args.arquivo
    if arquivo is None:
        temporario = tempfile.NamedTemporaryFile(suffix=".parquet", delete=False)
        temporario.close()
        arquivo = pathlib.Path(temporario.name)
        print("Baixando CNES/geobr 202604 (aprox. 100 MB)...")
        urllib.request.urlretrieve(URL, arquivo)

    dataset = ds.dataset(arquivo, format="parquet")
    disponiveis = set(dataset.schema.names)
    col_codigo = next((c for c in COLUNAS_CODIGO if c in disponiveis), None)
    if col_codigo is None:
        print(f"  ! nenhuma coluna de código CNES entre {COLUNAS_CODIGO}; os pontos ficam sem código.")
        print(f"    colunas do arquivo: {sorted(disponiveis)}")
    colunas = [
        "code_muni",
        "no_fantasia",
        "tp_unidade",
        "co_motivo_desab",
        "lat_cnes",
        "lon_cnes",
        "lat_geocodebr",
        "lon_geocodebr",
        "coords_source",
    ] + ([col_codigo] if col_codigo else [])
    tabela = dataset.to_table(
        columns=colunas,
        filter=pc.field("code_muni").isin(CODIGOS),
    )
    df = tabela.to_pandas()
    df = df[df["tp_unidade"].isin(TIPOS | ACOLHIMENTO | DESCARTADOS)]
    df = df[df["co_motivo_desab"].isna()].copy()
    df["code_muni"] = df["code_muni"].astype(int)

    def coordenada(row, eixo: str) -> float:
        origem = str(row["coords_source"]).lower()
        valor = row[f"{eixo}_cnes"] if origem == "cnes" else row[f"{eixo}_geocodebr"]
        return float(valor)

    df["x"] = df.apply(lambda r: coordenada(r, "lon"), axis=1)
    df["y"] = df.apply(lambda r: coordenada(r, "lat"), axis=1)
    df = df.dropna(subset=["x", "y"])

    registros = [
        {
            "nome": str(r.no_fantasia) if r.no_fantasia else "Estabelecimento de saúde",
            "m": CODIGOS.index(int(r.code_muni)),
            "tipo": int(r.tp_unidade),
            "x": float(r.x),
            "y": float(r.y),
            "codigo": str(getattr(r, col_codigo)).split(".")[0] if col_codigo and getattr(r, col_codigo) is not None else None,
        }
        for r in df.itertuples()
    ]
    pontos = carregar_pontos()
    meta = {"fonte": "CNES/DATASUS via geobr", "ano": int(competencia[:4]), "competencia": competencia}
    pontos["saude"], pontos["acolhimento"], resumo = monta_camadas(registros, meta)
    destino = gravar_pontos(pontos)
    print(f"{destino}: CNES {competencia} nos 7 municípios")
    imprime(resumo)

    if temporario is not None:
        arquivo.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
