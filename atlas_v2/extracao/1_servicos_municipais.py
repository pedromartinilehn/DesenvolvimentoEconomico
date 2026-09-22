#!/usr/bin/env python3
"""Gera dados-servicos.js com indicadores municipais oficiais.

Fontes integradas:
- SICONFI/STN, DCA 2024: receitas, despesas e gasto por função;
- SSP/RS, ano fechado de 2025: ocorrências criminais por município;
- CNES 2026: estabelecimentos georreferenciados já presentes no Atlas;
- Censo 2010: indicadores municipais de trabalho e pobreza;
- PIB dos Municípios/IBGE: VAB agropecuário de 2021;
- Estimativas populacionais/IBGE: população em 01/07/2026.

O script não estima valores ausentes. Se uma fonte mudar de formato ou deixar
algum município sem dado, a execução falha. A única exceção é função contábil
omitida na própria DCA/SICONFI, tratada como zero conforme a estrutura da declaração.
"""

from __future__ import annotations

import io
import json
import pathlib
import re
import unicodedata
import urllib.parse
import urllib.request

import pandas as pd


ROOT = pathlib.Path(__file__).resolve().parents[1]
DADOS = ROOT / "dados"

MUNICIPIOS = {
    "4314902": "Porto Alegre",
    "4304606": "Canoas",
    "4309209": "Gravataí",
    "4320008": "Sapucaia do Sul",
    "4303103": "Cachoeirinha",
    "4309308": "Guaíba",
    "4307708": "Esteio",
}

POP_2026 = {
    "4314902": 1_388_791,
    "4304606": 359_845,
    "4309209": 275_432,
    "4320008": 136_573,
    "4303103": 141_506,
    "4309308": 95_946,
    "4307708": 78_143,
}

SSP_URL = (
    "https://www.ssp.rs.gov.br/upload/arquivos/202609/"
    "10160731-site-geral-e-municipios-ano-2025-atualizado-em-04-set-2026-"
    "dados-cvli-atualizado-publicacao.xlsx"
)
SICONFI_URL = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca"


def carregar_js(nome: str, variavel: str) -> dict:
    texto = (DADOS / nome).read_text(encoding="utf-8").strip()
    prefixo = f"window.{variavel}="
    if not texto.startswith(prefixo):
        raise ValueError(f"{nome}: variável {variavel} não encontrada")
    return json.loads(texto[len(prefixo) :].rstrip(";"))


def norm(texto: object) -> str:
    s = unicodedata.normalize("NFD", str(texto))
    return "".join(c for c in s if unicodedata.category(c) != "Mn").upper().strip()


def baixar_ssp() -> dict[str, dict]:
    with urllib.request.urlopen(SSP_URL, timeout=90) as resposta:
        conteudo = resposta.read()
    df = pd.read_excel(io.BytesIO(conteudo), sheet_name="2025", header=6)
    df.columns = [re.sub(r"\s+", " ", str(c)).strip() for c in df.columns]
    primeira = df.columns[0]
    df["_nome"] = df[primeira].map(norm)
    colunas = {
        "seg_homicidios": "Homicídio Doloso",
        "seg_vitimas_homicidio": "Total de vítimas de Homicidio Doloso",
        "seg_furtos": "Furtos",
        "seg_furto_veiculo": "Furto de Veículo",
        "seg_roubos": "Roubos",
        "seg_roubo_veiculo": "Roubo de Veículo",
        "seg_estelionato": "Estelionato",
        "seg_cvli": "Total de Vítimas de CVLI*",
    }
    saida: dict[str, dict] = {}
    for codigo, nome in MUNICIPIOS.items():
        linha = df.loc[df["_nome"] == norm(nome)]
        if len(linha) != 1:
            raise ValueError(f"SSP/RS: município não encontrado de forma única: {nome}")
        r = linha.iloc[0]
        saida[codigo] = {chave: int(r[coluna]) for chave, coluna in colunas.items()}
    return saida


def baixar_siconfi(codigo: str) -> list[dict]:
    consulta = urllib.parse.urlencode({"an_exercicio": 2024, "id_ente": codigo})
    with urllib.request.urlopen(f"{SICONFI_URL}?{consulta}", timeout=120) as resposta:
        itens = json.loads(resposta.read()).get("items", [])
    if not itens:
        raise ValueError(f"SICONFI: DCA 2024 vazia para {codigo}")
    return itens


def valor_dca(
    itens: list[dict],
    anexo: str,
    coluna: str,
    *,
    codigo_conta: str | None = None,
    conta: str | None = None,
) -> float:
    candidatos = [
        x
        for x in itens
        if x.get("anexo") == anexo
        and x.get("coluna") == coluna
        and (codigo_conta is None or x.get("cod_conta") == codigo_conta)
        and (conta is None or x.get("conta") == conta)
    ]
    if len(candidatos) != 1:
        alvo = codigo_conta or conta
        raise ValueError(f"SICONFI: esperado 1 valor em {anexo}/{alvo}; obtidos {len(candidatos)}")
    return round(float(candidatos[0]["valor"]), 2)


def extrair_financas(itens: list[dict]) -> dict:
    receita = lambda cod: valor_dca(
        itens,
        "DCA-Anexo I-C",
        "Receitas Brutas Realizadas",
        codigo_conta=cod,
    )
    despesa = lambda cod: valor_dca(
        itens,
        "DCA-Anexo I-D",
        "Despesas Empenhadas",
        codigo_conta=cod,
    )
    def funcao(nome: str) -> float:
        """Retorna o gasto funcional; linha omitida pela DCA equivale a zero."""
        candidatos = [
            x
            for x in itens
            if x.get("anexo") == "DCA-Anexo I-E"
            and x.get("coluna") == "Despesas Empenhadas"
            and x.get("conta") == nome
        ]
        if not candidatos:
            return 0.0
        if len(candidatos) != 1:
            raise ValueError(f"SICONFI: função duplicada na DCA: {nome}")
        return round(float(candidatos[0]["valor"]), 2)

    total_receita = receita("ReceitasExcetoIntraOrcamentarias")
    total_despesa = despesa("TotalDespesas")
    return {
        "fin_receita_total": total_receita,
        "fin_receita_corrente": receita("RO1.0.0.0.00.0.0"),
        "fin_receita_tributaria": receita("RO1.1.0.0.00.0.0"),
        "fin_transferencias": receita("RO1.7.0.0.00.0.0"),
        "fin_despesa_total": total_despesa,
        "fin_investimentos": despesa("DO4.4.00.00.00.00"),
        "fin_resultado_orcamentario": round(total_receita - total_despesa, 2),
        "gasto_saude": funcao("10 - Saúde"),
        "gasto_atencao_basica": funcao("10.301 - Atenção Básica"),
        "gasto_educacao": funcao("12 - Educação"),
        "gasto_ensino_fundamental": funcao("12.361 - Ensino Fundamental"),
        "gasto_educacao_infantil": funcao("12.365 - Educação Infantil"),
        "gasto_eja": funcao("12.366 - Educação de Jovens e Adultos"),
        "gasto_assistencia": funcao("08 - Assistência Social"),
        "gasto_assistencia_comunitaria": funcao("08.244 - Assistência Comunitária"),
        "gasto_seguranca": funcao("06 - Segurança Pública"),
        "gasto_trabalho": funcao("11 - Trabalho"),
        "gasto_agricultura": funcao("20 - Agricultura"),
    }


def contagens_pontos(pontos: dict, chave: str) -> dict[str, dict[str, int]]:
    bloco = pontos[chave]
    saida = {codigo: {} for codigo in MUNICIPIOS}
    codigos = list(MUNICIPIOS)
    for codigo in codigos:
        idx = codigos.index(codigo)
        posicoes = [i for i, m in enumerate(bloco.get("m", [])) if m == idx]
        tipos = [int(bloco["tipo"][i]) for i in posicoes]
        if chave == "saude":
            saida[codigo] = {
                "cnes_estabelecimentos": len(posicoes),
                "cnes_ubs": sum(t in {1, 2} for t in tipos),
                "cnes_hospitais": sum(t in {5, 7, 62} for t in tipos),
                "cnes_caps": sum(t == 70 for t in tipos),
            }
        elif chave == "escolas":
            saida[codigo] = {
                "inep_escolas": len(posicoes),
                "inep_escolas_publicas": sum(t in {1, 2, 3} for t in tipos),
                "inep_escolas_privadas": sum(t == 4 for t in tipos),
            }
    return saida


def main() -> None:
    nucleo = carregar_js("dados-nucleo.js", "ATLAS_NUCLEO")
    pontos = carregar_js("dados-pontos.js", "ATLAS_PONTOS")
    seguranca = baixar_ssp()
    saude = contagens_pontos(pontos, "saude")
    escolas = contagens_pontos(pontos, "escolas")

    saida = {}
    for codigo, nome in MUNICIPIOS.items():
        trabalho = nucleo["municipal_2010"][codigo]
        pib = nucleo["pib"]["municipios"][nome]
        valores = {
            "pop_est_2026": POP_2026[codigo],
            **seguranca[codigo],
            **extrair_financas(baixar_siconfi(codigo)),
            **saude[codigo],
            **escolas[codigo],
            "trab_desocupacao_2010": trabalho["taxa_desocupacao"],
            "trab_participacao_2010": trabalho["taxa_participacao"],
            "trab_informalidade_2010": trabalho["pct_informalidade"],
            "trab_emprego_formal_2010": trabalho["pct_emprego_formal"],
            "trab_conta_propria_2010": trabalho["pct_conta_propria"],
            "assist_pobreza_2010": trabalho["pct_pobreza"],
            "assist_extrema_pobreza_2010": trabalho["pct_extrema_pobreza"],
            "agro_vab": pib["vab_agro"],
            "agro_participacao_vab": round(100 * pib["vab_agro"] / pib["vab"], 2),
        }
        faltantes = [k for k, v in valores.items() if v is None]
        if faltantes:
            raise ValueError(f"{nome}: valores ausentes: {faltantes}")
        # A função 12 é obrigatória: a Constituição exige aplicação mínima em
        # manutenção e desenvolvimento do ensino. Um zero aqui não é "o município
        # não gastou", é o rótulo da conta na DCA que mudou — e `funcao()` trata
        # linha ausente como zero, então o erro passaria em silêncio.
        if not valores["gasto_educacao"]:
            raise ValueError(
                f"{nome}: função '12 - Educação' não encontrada na DCA. "
                "Confira o rótulo da conta no Anexo I-E antes de aceitar o valor."
            )
        saida[codigo] = valores

    pacote = {
        "versao": "2026-09-17",
        "municipios": saida,
        "fontes": {
            "populacao": {
                "fonte": "IBGE — Estimativas da População",
                "ano": 2026,
                "url": "https://ftp.ibge.gov.br/Estimativas_de_Populacao/Estimativas_2026/estimativa_dou_2026.pdf",
            },
            "siconfi": {
                "fonte": "STN — SICONFI, Declaração das Contas Anuais",
                "ano": 2024,
                "url": SICONFI_URL,
            },
            "seguranca": {
                "fonte": "SSP/RS — Indicadores criminais por município",
                "ano": 2025,
                "url": SSP_URL,
            },
            "saude": {
                "fonte": "DATASUS — CNES",
                "ano": 2026,
                "url": "https://cnes.datasus.gov.br/",
            },
            "trabalho": {
                "fonte": "IBGE — Censo Demográfico 2010",
                "ano": 2010,
                "url": "https://censo2010.ibge.gov.br/resultados.html",
            },
            "agro": {
                "fonte": "IBGE — PIB dos Municípios",
                "ano": 2021,
                "url": "https://sidra.ibge.gov.br/pesquisa/pib-munic/tabelas",
            },
        },
    }
    destino = DADOS / "dados-servicos.js"
    destino.write_text(
        "window.ATLAS_SERVICOS="
        + json.dumps(pacote, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(f"{destino}: {len(saida)} municípios, sem valores ausentes")


if __name__ == "__main__":
    main()
