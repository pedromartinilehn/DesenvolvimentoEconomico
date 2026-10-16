#!/usr/bin/env python3
"""Atualiza a camada de escolas do Censo Escolar 2025 para os 7 municípios.

Requer ``pyarrow``. O arquivo georreferenciado é distribuído pelo geobr/Ipea
com base nos microdados oficiais do Inep.
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
    "schools_2025.parquet"
)
CODIGOS = [4314902, 4304606, 4309209, 4320008, 4303103, 4309308, 4307708]
DEPENDENCIA = {1: "Federal", 2: "Estadual", 3: "Municipal", 4: "Privada"}


def carregar_pontos() -> dict:
    texto = (DADOS / "dados-pontos.js").read_text(encoding="utf-8").strip()
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
    parser.add_argument("--ano", type=int, help="ano do Censo Escolar, se o nome do arquivo não disser")
    args = parser.parse_args()
    # ano: do argumento, do nome do arquivo (schools_AAAA) ou, no download padrão, da URL
    nome_ano = re.search(r"schools_(\d{4})", (args.arquivo or pathlib.Path(URL)).name)
    ano = args.ano or (int(nome_ano.group(1)) if nome_ano else None)
    if not ano:
        raise SystemExit("Informe o ano do Censo Escolar do arquivo: --ano AAAA")

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
        print("Baixando Censo Escolar/geobr 2025 (aprox. 19 MB)...")
        urllib.request.urlretrieve(URL, arquivo)

    dataset = ds.dataset(arquivo, format="parquet")
    # código INEP da escola: permite ligar matrículas e outros dados do Censo
    # Escolar (auditoria de outubro de 2026, achado E5)
    disponiveis = set(dataset.schema.names)
    col_codigo = next((c for c in ("code_school", "co_entidade", "cod_escola") if c in disponiveis), None)
    if col_codigo is None:
        print(f"  ! nenhuma coluna de código INEP encontrada; os pontos ficam sem código.")
        print(f"    colunas do arquivo: {sorted(disponiveis)}")
    colunas = [
        "code_muni",
        "name_school",
        "tp_dependencia",
        "tp_situacao_funcionamento",
        "lat_inep",
        "lon_inep",
        "lat_geocodebr",
        "lon_geocodebr",
        "coords_source",
    ] + ([col_codigo] if col_codigo else [])
    tabela = dataset.to_table(
        columns=colunas,
        filter=pc.field("code_muni").isin(CODIGOS),
    )
    df = tabela.to_pandas()
    df = df[df["tp_situacao_funcionamento"] == 1].copy()
    df["code_muni"] = df["code_muni"].astype(int)

    def coordenada(row, eixo: str) -> float:
        origem = str(row["coords_source"]).lower()
        valor = row[f"{eixo}_inep"] if origem == "inep" else row[f"{eixo}_geocodebr"]
        return float(valor)

    df["x"] = df.apply(lambda r: coordenada(r, "lon"), axis=1)
    df["y"] = df.apply(lambda r: coordenada(r, "lat"), axis=1)
    df = df.dropna(subset=["x", "y"]).sort_values(["code_muni", "name_school"])

    pontos = carregar_pontos()
    pontos["escolas"] = {
        "nomes": df["name_school"].fillna("Escola").astype(str).tolist(),
        "m": [CODIGOS.index(c) for c in df["code_muni"]],
        "tipo": df["tp_dependencia"].astype(int).tolist(),
        "xy": codificar_pontos(list(zip(df["x"], df["y"]))),
        "legenda": {str(k): v for k, v in DEPENDENCIA.items()},
        "fonte": "Censo Escolar/Inep via geobr",
        "ano": ano,
        "metodo": "escolas em atividade; coordenadas harmonizadas pelo geobr",
    }
    if col_codigo:
        pontos["escolas"]["cod"] = [str(v).split(".")[0] if v is not None else None for v in df[col_codigo]]
    destino = DADOS / "dados-pontos.js"
    destino.write_text(
        "window.ATLAS_PONTOS="
        + json.dumps(pontos, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(f"{destino}: {len(df)} escolas em atividade nos 7 municípios")

    if temporario is not None:
        arquivo.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
