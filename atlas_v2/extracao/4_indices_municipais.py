#!/usr/bin/env python3
"""Gera dados-indices.js com índices sintéticos de desenvolvimento municipal.

    python3 extracao/4_indices_municipais.py

IDHM, IVS, IDESE e FIRJAN não têm API pública: são planilhas publicadas por
cada instituição. Em vez de embutir um link que quebra a cada nova edição, este
script lê os arquivos que você baixou para `extracao/fontes/` e usa o mapa de
colunas de `extracao/indices.json`.

Quando um nome de coluna não bate, o script imprime as colunas reais do arquivo
e para. Corrija o JSON e rode de novo — não é preciso mexer no código.

O script NÃO estima, NÃO interpola e NÃO completa município faltante. O que não
vier da fonte fica de fora, e o Atlas simplesmente não exibe o indicador.

Precisa de `pandas` e, para .xlsx, de `openpyxl`.
"""

from __future__ import annotations

import json
import pathlib
import sys
import unicodedata

import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parents[1]
DADOS = ROOT / "dados"
FONTES = ROOT / "extracao" / "fontes"
CONFIG = ROOT / "extracao" / "indices.json"

MUNICIPIOS = {
    "4314902": "Porto Alegre",
    "4304606": "Canoas",
    "4309209": "Gravataí",
    "4320008": "Sapucaia do Sul",
    "4303103": "Cachoeirinha",
    "4309308": "Guaíba",
    "4307708": "Esteio",
}
# código de 6 dígitos (sem o dígito verificador) -> código de 7
CURTO = {c[:6]: c for c in MUNICIPIOS}


def norm(texto: object) -> str:
    s = unicodedata.normalize("NFD", str(texto))
    return "".join(c for c in s if unicodedata.category(c) != "Mn").upper().strip()


NOME_PARA_CODIGO = {norm(n): c for c, n in MUNICIPIOS.items()}


def le_tabela(caminho: pathlib.Path, planilha, cabecalho: int) -> pd.DataFrame:
    if caminho.suffix.lower() in {".csv", ".txt"}:
        for sep in (";", ",", "\t"):
            for enc in ("utf-8-sig", "latin-1"):
                try:
                    df = pd.read_csv(caminho, sep=sep, header=cabecalho, encoding=enc, dtype=str)
                except Exception:
                    continue
                if df.shape[1] > 1:
                    return df
        raise ValueError(f"{caminho.name}: não consegui separar as colunas do CSV")
    return pd.read_excel(caminho, sheet_name=planilha or 0, header=cabecalho, dtype=object)


def acha_arquivo(padrao: str) -> pathlib.Path | None:
    achados = sorted(p for p in FONTES.glob(padrao) if p.is_file())
    if len(achados) > 1:
        print(f"    ! mais de um arquivo casa com '{padrao}': {[p.name for p in achados]}")
        print(f"    ! usando o último: {achados[-1].name}")
    return achados[-1] if achados else None


def numero(valor: object) -> float | None:
    """Converte o valor da planilha. Vazio vira None, nunca zero."""
    if valor is None:
        return None
    s = str(valor).strip()
    if s == "" or s.lower() in {"nan", "-", "--", "...", "nd", "n/d"}:
        return None
    # planilhas brasileiras: 0,708 e 1.234,56
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def linhas_dos_municipios(df: pd.DataFrame, fonte: dict) -> dict[str, pd.Series]:
    """Localiza a linha de cada um dos 7 municípios, por código ou por nome."""
    col_cod, col_nome = fonte.get("coluna_codigo"), fonte.get("coluna_nome")

    filtro = fonte.get("filtro_ano")
    if filtro:
        if filtro["coluna"] not in df.columns:
            erro_coluna(fonte, df, filtro["coluna"], "filtro_ano")
        alvo = str(filtro["valor"]).strip()
        df = df[df[filtro["coluna"]].map(lambda v: str(v).strip().split(".")[0]) == alvo]
        if df.empty:
            raise ValueError(
                f"{fonte['id']}: nenhuma linha com {filtro['coluna']} = {filtro['valor']}"
            )

    achadas: dict[str, pd.Series] = {}

    if col_cod:
        if col_cod not in df.columns:
            erro_coluna(fonte, df, col_cod, "coluna_codigo")
        chaves = df[col_cod].map(lambda v: str(v).strip().split(".")[0])
        for codigo in MUNICIPIOS:
            alvo = chaves[(chaves == codigo) | (chaves == codigo[:6])]
            if len(alvo) == 1:
                achadas[codigo] = df.loc[alvo.index[0]]
            elif len(alvo) > 1:
                raise ValueError(f"{fonte['id']}: código {codigo} aparece {len(alvo)} vezes")

    if len(achadas) < len(MUNICIPIOS) and col_nome:
        if col_nome not in df.columns:
            erro_coluna(fonte, df, col_nome, "coluna_nome")
        nomes = df[col_nome].map(norm)
        # só municípios do RS, para não confundir homônimos de outros estados
        for codigo, nome in MUNICIPIOS.items():
            if codigo in achadas:
                continue
            alvo = nomes[nomes == norm(nome)]
            if len(alvo) == 1:
                achadas[codigo] = df.loc[alvo.index[0]]
            elif len(alvo) > 1:
                raise ValueError(
                    f"{fonte['id']}: '{nome}' aparece {len(alvo)} vezes. "
                    "Informe 'coluna_codigo' no indices.json para desambiguar."
                )
    return achadas


def erro_coluna(fonte: dict, df: pd.DataFrame, coluna: str, onde: str) -> None:
    print(f"\n  ✗ {fonte['id']}: coluna '{coluna}' ({onde}) não existe no arquivo.")
    print(f"    Colunas disponíveis ({len(df.columns)}):")
    for c in df.columns:
        print(f"      · {c}")
    print(f"\n    Ajuste '{onde}' em {CONFIG.name} e rode de novo.\n")
    sys.exit(1)


def processa(fonte: dict) -> tuple[dict[str, dict], dict | None]:
    caminho = acha_arquivo(fonte["arquivo"])
    if caminho is None:
        print(f"  – {fonte['id']}: nenhum arquivo casa com '{fonte['arquivo']}' em extracao/fontes/")
        print(f"    onde obter: {fonte['onde_obter']}")
        return {}, None
    if fonte.get("licenca"):
        print(f"    {fonte['licenca']}")

    df = le_tabela(caminho, fonte.get("planilha"), fonte.get("cabecalho", 0))
    df.columns = [str(c).strip() for c in df.columns]

    for campo, coluna in fonte["campos"].items():
        if coluna not in df.columns:
            erro_coluna(fonte, df, coluna, f"campos.{campo}")

    linhas = linhas_dos_municipios(df, fonte)
    ausentes = [MUNICIPIOS[c] for c in MUNICIPIOS if c not in linhas]
    if ausentes:
        raise ValueError(f"{fonte['id']}: municípios não encontrados no arquivo: {ausentes}")

    faixas = fonte.get("faixas", {})
    saida: dict[str, dict] = {}
    vazios: list[str] = []
    for codigo, linha in linhas.items():
        valores = {}
        for campo, coluna in fonte["campos"].items():
            v = numero(linha[coluna])
            if v is None:
                vazios.append(f"{MUNICIPIOS[codigo]}/{campo}")
                continue
            lo, hi = faixas.get(campo, (None, None))
            if lo is not None and not (lo <= v <= hi):
                raise ValueError(
                    f"{fonte['id']}: {MUNICIPIOS[codigo]}/{campo} = {v}, fora da faixa [{lo}, {hi}]. "
                    "Provável coluna trocada ou escala diferente (ex.: índice em 0–1.000)."
                )
            valores[campo] = round(v, 4)
        if fonte.get("ano"):
            valores[fonte["id"] + "_ano"] = fonte["ano"]
        saida[codigo] = valores

    if vazios:
        print(f"    ! sem valor na fonte (ficam de fora): {', '.join(vazios)}")
    print(f"  ✓ {fonte['id']}: {caminho.name} → {len(saida)} municípios, "
          f"{len(fonte['campos'])} indicadores")
    meta = {
        "fonte": fonte["rotulo"],
        "publicador": fonte["publicador"],
        "ano": fonte.get("ano"),
        "arquivo": caminho.name,
        "url": fonte["onde_obter"],
    }
    return saida, meta


def main() -> None:
    FONTES.mkdir(exist_ok=True)
    config = json.loads(CONFIG.read_text(encoding="utf-8"))

    municipios: dict[str, dict] = {c: {} for c in MUNICIPIOS}
    metadados: dict[str, dict] = {}
    usadas = 0

    print(f"lendo de {FONTES}")
    for fonte in config["fontes"]:
        if not fonte.get("ativo", True):
            print(f"  – {fonte['id']}: desligado no indices.json")
            continue
        valores, meta = processa(fonte)
        if not valores:
            continue
        usadas += 1
        metadados[fonte["id"]] = meta
        for codigo, campos in valores.items():
            municipios[codigo].update(campos)

    # Sempre grava, mesmo vazio: o index.html espera o arquivo, e o Atlas
    # simplesmente não exibe os indicadores que não têm valor.
    pacote = {"versao": None if not usadas else pd.Timestamp.today().strftime("%Y-%m-%d"),
              "municipios": municipios, "fontes": metadados}
    destino = DADOS / "dados-indices.js"
    destino.write_text(
        "window.ATLAS_INDICES="
        + json.dumps(pacote, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    total = sum(len(v) for v in municipios.values())
    if usadas:
        print(f"\n{destino.name}: {usadas} fonte(s), {total} valores. "
              "Rode build_single.py para atualizar o atlas-rmpa.html.")
    else:
        print(f"\n{destino.name}: gravado vazio — nenhuma fonte encontrada em extracao/fontes/.")
        print("O Atlas continua funcionando; os índices apenas não aparecem.")


if __name__ == "__main__":
    main()
