#!/usr/bin/env python3
"""Atualiza a camada de saúde com o CNES de abril de 2026 para os 7 municípios.

Requer ``pyarrow`` para ler o arquivo Parquet distribuído pelo geobr/Ipea.
O dado primário é o CNES/DATASUS; o geobr harmoniza e corrige coordenadas.

Uso:
    pip install pyarrow
    python 2_atualiza_cnes.py

Para reaproveitar um download:
    python 2_atualiza_cnes.py --arquivo healthfacilities_202604.parquet
"""

from __future__ import annotations

import argparse
import json
import pathlib
import tempfile
import urllib.request


ROOT = pathlib.Path(__file__).resolve().parents[1]
DADOS = ROOT / "dados"
URL = (
    "https://github.com/ipea/geobr_prep_data/releases/download/v2.0.0/"
    "healthfacilities_202604.parquet"
)
CODIGOS = [4314902, 4304606, 4309209, 4320008, 4303103, 4309308, 4307708]
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
    81: "Centro de dispensação de material",
    83: "Polo academia da saúde",
}


def carregar_pontos() -> dict:
    p = DADOS / "dados-pontos.js"
    texto = p.read_text(encoding="utf-8").strip()
    return json.loads(texto.removeprefix("window.ATLAS_PONTOS=").rstrip(";"))


def codificar_numero(numero: int) -> str:
    numero = ~(numero << 1) if numero < 0 else numero << 1
    saida = []
    while numero >= 0x20:
        saida.append(chr((0x20 | (numero & 0x1F)) + 63))
        numero >>= 5
    saida.append(chr(numero + 63))
    return "".join(saida)


def codificar_pontos(pontos: list[tuple[float, float]], precisao: int = 100_000) -> str:
    x_ant = y_ant = 0
    partes = []
    for x, y in pontos:
        xi, yi = round(x * precisao), round(y * precisao)
        partes.extend((codificar_numero(xi - x_ant), codificar_numero(yi - y_ant)))
        x_ant, y_ant = xi, yi
    return "".join(partes)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--arquivo", type=pathlib.Path)
    args = parser.parse_args()

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
    ]
    tabela = dataset.to_table(
        columns=colunas,
        filter=pc.field("code_muni").isin(CODIGOS),
    )
    df = tabela.to_pandas()
    df = df[df["tp_unidade"].isin(TIPOS)]
    df = df[df["co_motivo_desab"].isna()].copy()
    df["code_muni"] = df["code_muni"].astype(int)

    def coordenada(row, eixo: str) -> float:
        origem = str(row["coords_source"]).lower()
        valor = row[f"{eixo}_cnes"] if origem == "cnes" else row[f"{eixo}_geocodebr"]
        return float(valor)

    df["x"] = df.apply(lambda r: coordenada(r, "lon"), axis=1)
    df["y"] = df.apply(lambda r: coordenada(r, "lat"), axis=1)
    df = df.dropna(subset=["x", "y"]).sort_values(["code_muni", "no_fantasia"])

    pontos = carregar_pontos()
    pontos["saude"] = {
        "nomes": df["no_fantasia"].fillna("Estabelecimento de saúde").astype(str).tolist(),
        "m": [CODIGOS.index(c) for c in df["code_muni"]],
        "tipo": df["tp_unidade"].astype(int).tolist(),
        "xy": codificar_pontos(list(zip(df["x"], df["y"]))),
        "legenda": {str(k): v for k, v in TIPOS.items()},
        "fonte": "CNES/DATASUS via geobr",
        "ano": 2026,
        "competencia": "202604",
        "metodo": "estabelecimentos ativos; coordenadas harmonizadas pelo geobr",
    }
    destino = DADOS / "dados-pontos.js"
    destino.write_text(
        "window.ATLAS_PONTOS="
        + json.dumps(pontos, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(f"{destino}: {len(df)} estabelecimentos ativos nos 7 municípios")

    if temporario is not None:
        arquivo.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
