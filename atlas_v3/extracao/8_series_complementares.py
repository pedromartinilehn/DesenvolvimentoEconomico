#!/usr/bin/env python3
"""Gera dados/dados-series.js: séries municipais que faltavam no Atlas.

    python3 extracao/8_series_complementares.py

Resultado da varredura das bases que o Ipeadata republica, feita sobre o
espelho público da Base dos Dados (sem conta, os mesmos arquivos do
5_base_dos_dados.py e do 6_ipea.py). Entram só tabelas gratuitas, com os sete
municípios, e só o que o Atlas ainda não tinha:

- Atlas do Desenvolvimento Humano (PNUD, IPEA e FJP), Censos de 1991, 2000 e
  2010 (mundo_onu_adh.municipio): fecundidade, sobrevivência, frequência
  escolar líquida, renda por quinto, rendimento e setor dos ocupados;
- cobertura vacinal do Programa Nacional de Imunizações (br_ms_imunizacoes);
- água e esgoto do SNIS (br_mdr_snis.municipio_agua_esgoto), com os códigos
  de indicador do próprio SNIS;
- situação do esgotamento sanitário em 2013, do Atlas Esgotos da ANA
  (br_ana_atlas_esgotos);
- matrícula na pré-escola, do Observatório da Criança e do Adolescente da
  Fundação Abrinq (br_abrinq_oca.municipio_primeira_infancia).

Regras (as do Atlas: não estimar, não completar):
- Cada série entra no ano mais recente em que os sete municípios têm valor; o
  painel do Atlas mostra os outros anos. Ano sem valor fica vazio.
- Os valores vão como a fonte publica. A única conversão é a dos índices da
  ANA, publicados de 0 a 1 e mostrados em %.
- Conferências que param o script: os sete municípios no ano do mapa; cada
  valor dentro da faixa possível da variável (uma mudança de unidade na fonte
  aparece aqui); os quatro índices da ANA somando 100% em cada município.

Usa só a biblioteca padrão do Python. Os arquivos baixados ficam em
extracao/fontes/basedosdados/ (não versionados) e não são baixados de novo.
"""

from __future__ import annotations

import csv
import gzip
import json
import pathlib
import shutil
import sys
import urllib.request
from datetime import date

RAIZ = pathlib.Path(__file__).resolve().parent.parent          # atlas_v3/
SAIDA = RAIZ / "dados" / "dados-series.js"
CACHE = RAIZ / "extracao" / "fontes" / "basedosdados"
BUCKET = "https://storage.googleapis.com/basedosdados-public/one-click-download"

MUN = {"4314902": "Porto Alegre", "4304606": "Canoas", "4309209": "Gravataí",
       "4320008": "Sapucaia do Sul", "4303103": "Cachoeirinha", "4309308": "Guaíba",
       "4307708": "Esteio"}
COD = list(MUN)

# tabela -> (base, tabela, primeiro ano que entra, ano fixo quando a tabela não tem coluna de ano)
TABELAS = {
    "adh": ("mundo_onu_adh", "municipio", 1991, None),
    "pni": ("br_ms_imunizacoes", "municipio", 2012, None),
    "snis": ("br_mdr_snis", "municipio_agua_esgoto", 2013, None),
    "ana": ("br_ana_atlas_esgotos", "municipio", 2013, 2013),
    "abrinq": ("br_abrinq_oca", "municipio_primeira_infancia", 2010, None),
}

FONTES = {
    "PNI": {"n": "Ministério da Saúde — Programa Nacional de Imunizações (cobertura vacinal)", "s": "PNI/MS",
            "u": "https://sipni.datasus.gov.br/",
            "d": "Doses aplicadas e cobertura vacinal por município, lidas no espelho público da Base dos Dados "
                 "(br_ms_imunizacoes.municipio)."},
    "SNIS": {"n": "Ministério das Cidades — SNIS, Sistema Nacional de Informações sobre Saneamento", "s": "SNIS",
             "u": "https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/saneamento/snis",
             "d": "Informações e indicadores de água e esgoto declarados pelos prestadores de serviço, consolidados "
                  "por município; lidos no espelho público da Base dos Dados (br_mdr_snis.municipio_agua_esgoto)."},
    "ANA": {"n": "Agência Nacional de Águas e Saneamento Básico — Atlas Esgotos (2013)", "s": "ANA",
            "u": "http://atlasesgotos.ana.gov.br/",
            "d": "Situação do esgotamento sanitário por município em 2013, lida no espelho público da Base dos Dados "
                 "(br_ana_atlas_esgotos.municipio)."},
    "ABRINQ": {"n": "Fundação Abrinq — Observatório da Criança e do Adolescente", "s": "Fundação Abrinq",
               "u": "https://observatoriocrianca.org.br/",
               "d": "Indicadores de primeira infância por município, lidos no espelho público da Base dos Dados "
                    "(br_abrinq_oca.municipio_primeira_infancia)."},
}

ADH = ("Atlas do Desenvolvimento Humano no Brasil (PNUD, IPEA e FJP), Censos de 1991, 2000 e 2010; "
       "coluna {c} da Base dos Dados. O painel traz a série.")
REAIS = " Em reais de agosto de 2010, nos três anos."
PNI = ("Cobertura vacinal publicada pelo Programa Nacional de Imunizações: doses aplicadas sobre a população-alvo. "
       "Pode passar de 100% quando o município vacina pessoas de fora. Coluna {c} da Base dos Dados; o painel traz a série.")
SNIS = ("{cod} do SNIS, informado pelo prestador do serviço de água e esgoto (CORSAN, DMAE e outros). "
        "Coluna {c} da Base dos Dados; o painel traz a série.")
ANA = ("Atlas Esgotos (ANA), situação de 2013. Os quatro índices da ANA repartem 100% entre: sem coleta e sem "
       "tratamento, solução individual, coleta sem tratamento e coleta com tratamento. Publicados de 0 a 1, aqui em %. "
       "Coluna {c} da Base dos Dados.")
ABRINQ = ("Fundação Abrinq, Observatório da Criança e do Adolescente. A taxa líquida conta só as crianças na idade "
          "certa (4 e 5 anos); a bruta conta todas as matrículas da etapa. Coluna {c} da Base dos Dados; o painel traz a série.")

# id, categoria, nome, unidade, formato, rampa, fonte, tabela, coluna, faixa possível, nota, fator
SERIES = [
    # Atlas do Desenvolvimento Humano
    ("adh_fecundidade", "demografia", "Taxa de fecundidade total (Atlas Brasil)", "filhos por mulher", "dec2", "agua",
     "ATLAS", "adh", "fecundidade_total", (0.5, 8), ADH + " Número médio de filhos que uma mulher teria ao fim da idade reprodutiva."),
    ("adh_sobrev_40", "saude", "Probabilidade de sobrevivência até 40 anos (Atlas Brasil)", "%", "pct1", "agua",
     "ATLAS", "adh", "prob_sobrevivencia_40", (50, 100), ADH),
    ("adh_sobrev_60", "saude", "Probabilidade de sobrevivência até 60 anos (Atlas Brasil)", "%", "pct1", "agua",
     "ATLAS", "adh", "prob_sobrevivencia_60", (40, 100), ADH),
    ("adh_freq_liq_pre", "educacao", "Frequência líquida à pré-escola (Atlas Brasil)", "%", "pct1", "agua",
     "ATLAS", "adh", "taxa_freq_liquida_pre", (0, 100), ADH + " Crianças na idade da etapa que a frequentam."),
    ("adh_freq_liq_fund", "educacao", "Frequência líquida ao ensino fundamental (Atlas Brasil)", "%", "pct1", "agua",
     "ATLAS", "adh", "taxa_freq_liquida_fundamental", (0, 100), ADH),
    ("adh_freq_liq_medio", "educacao", "Frequência líquida ao ensino médio (Atlas Brasil)", "%", "pct1", "agua",
     "ATLAS", "adh", "taxa_freq_liquida_medio", (0, 100), ADH),
    ("adh_freq_liq_superior", "educacao", "Frequência líquida ao ensino superior (Atlas Brasil)", "%", "pct1", "agua",
     "ATLAS", "adh", "taxa_freq_liquida_superior", (0, 100), ADH),
    ("adh_freq_15_17", "educacao", "Jovens de 15 a 17 anos que frequentam a escola (Atlas Brasil)", "%", "pct1", "agua",
     "ATLAS", "adh", "taxa_freq_15_17", (0, 100), ADH + " Taxa de atendimento escolar."),
    ("adh_freq_18_24", "educacao", "Jovens de 18 a 24 anos que frequentam a escola (Atlas Brasil)", "%", "pct1", "agua",
     "ATLAS", "adh", "taxa_freq_18_24", (0, 100), ADH + " Taxa de atendimento escolar."),
    ("adh_renda_q1", "renda", "Renda per capita média do quinto mais pobre (Atlas Brasil)", "R$", "brl", "terra",
     "ATLAS", "adh", "renda_pc_quintil_1", (0, 5000), ADH + REAIS),
    ("adh_renda_q5", "renda", "Renda per capita média do quinto mais rico (Atlas Brasil)", "R$", "brl", "terra",
     "ATLAS", "adh", "renda_pc_quintil_5", (0, 50000), ADH + REAIS),
    ("adh_renda_trabalho", "renda", "Parte da renda que vem do trabalho (Atlas Brasil)", "%", "pct1", "agua",
     "ATLAS", "adh", "prop_renda_trabalho", (0, 100), ADH),
    ("adh_renda_ocupados", "trabalho", "Rendimento médio dos ocupados (Atlas Brasil)", "R$", "brl", "terra",
     "ATLAS", "adh", "renda_media_ocupados", (0, 50000), ADH + REAIS),
    ("adh_ocup_transformacao", "trabalho", "Ocupados na indústria de transformação (Atlas Brasil)", "%", "pct1", "agua",
     "ATLAS", "adh", "prop_ocupados_transformacao", (0, 100), ADH + " Percentual dos ocupados de 18 anos ou mais."),
    ("adh_ocup_comercio", "trabalho", "Ocupados no comércio (Atlas Brasil)", "%", "pct1", "agua",
     "ATLAS", "adh", "prop_ocupados_comercio", (0, 100), ADH + " Percentual dos ocupados de 18 anos ou mais."),
    ("adh_ocup_servicos", "trabalho", "Ocupados nos serviços (Atlas Brasil)", "%", "pct1", "agua",
     "ATLAS", "adh", "prop_ocupados_servicos", (0, 100), ADH + " Percentual dos ocupados de 18 anos ou mais."),
    ("adh_ocup_construcao", "trabalho", "Ocupados na construção (Atlas Brasil)", "%", "pct1", "agua",
     "ATLAS", "adh", "prop_ocupados_construcao", (0, 100), ADH + " Percentual dos ocupados de 18 anos ou mais."),
    ("adh_ocup_ate_1sm", "trabalho", "Ocupados com rendimento de até 1 salário mínimo (Atlas Brasil)", "%", "pct1", "brasa",
     "ATLAS", "adh", "prop_ocupados_renda_1_sm", (0, 100), ADH + " Percentual dos ocupados de 18 anos ou mais."),
    ("adh_ocup_superior", "trabalho", "Ocupados com superior completo (Atlas Brasil)", "%", "pct1", "agua",
     "ATLAS", "adh", "prop_ocupados_superior", (0, 100), ADH + " Percentual dos ocupados de 18 anos ou mais."),
    # Programa Nacional de Imunizações
    ("vac_bcg", "saude", "Cobertura vacinal de BCG", "%", "pct1", "agua", "PNI", "pni", "cobertura_bcg", (0, 250), PNI),
    ("vac_polio", "saude", "Cobertura vacinal contra poliomielite", "%", "pct1", "agua", "PNI", "pni", "cobertura_poliomielite", (0, 250), PNI),
    ("vac_penta", "saude", "Cobertura vacinal da pentavalente", "%", "pct1", "agua", "PNI", "pni", "cobertura_penta", (0, 250),
     PNI + " Pentavalente: difteria, tétano, coqueluche, hepatite B e Haemophilus influenzae b."),
    ("vac_triplice_d1", "saude", "Cobertura vacinal da tríplice viral, 1ª dose", "%", "pct1", "agua", "PNI", "pni",
     "cobertura_triplice_viral_d1", (0, 250), PNI + " Tríplice viral: sarampo, caxumba e rubéola."),
    ("vac_triplice_d2", "saude", "Cobertura vacinal da tríplice viral, 2ª dose", "%", "pct1", "agua", "PNI", "pni",
     "cobertura_triplice_viral_d2", (0, 250), PNI + " Tríplice viral: sarampo, caxumba e rubéola."),
    ("vac_pneumo", "saude", "Cobertura vacinal contra pneumococo", "%", "pct1", "agua", "PNI", "pni", "cobertura_pneumococica", (0, 250), PNI),
    # SNIS
    ("snis_atend_agua", "saneamento", "Atendimento total de água (SNIS IN055)", "%", "pct1", "agua", "SNIS", "snis",
     "indice_atendimento_total_agua", (0, 100.5), SNIS.replace("{cod}", "Indicador IN055") + " Parte da população total atendida com abastecimento de água."),
    ("snis_atend_esgoto", "saneamento", "Atendimento total de esgoto (SNIS IN056)", "%", "pct1", "agua", "SNIS", "snis",
     "indice_atendimento_esgoto_agua", (0, 100.5), SNIS.replace("{cod}", "Indicador IN056") + " Parte da população total atendida com esgotamento sanitário, referida aos municípios atendidos com água."),
    ("snis_coleta_esgoto", "saneamento", "Índice de coleta de esgoto (SNIS IN015)", "%", "pct1", "agua", "SNIS", "snis",
     "indice_coleta_esgoto", (0, 100.5), SNIS.replace("{cod}", "Indicador IN015") + " Esgoto coletado em relação à água consumida."),
    ("snis_esgoto_tratado", "saneamento", "Esgoto tratado em relação à água consumida (SNIS IN046)", "%", "pct1", "agua", "SNIS", "snis",
     "indice_esgotamento_agua_consumida", (0, 100.5), SNIS.replace("{cod}", "Indicador IN046")),
    ("snis_perdas", "saneamento", "Perdas de água na distribuição (SNIS IN049)", "%", "pct1", "brasa", "SNIS", "snis",
     "indice_perda_distribuicao_agua", (-50, 100), SNIS.replace("{cod}", "Indicador IN049") + " Parte da água produzida que não chega a ser consumida."),
    ("snis_consumo_pc", "saneamento", "Consumo médio de água por habitante (SNIS IN022)", "litros por habitante por dia", "dec1", "agua",
     "SNIS", "snis", "indice_consumo_agua_per_capita", (20, 1000), SNIS.replace("{cod}", "Indicador IN022")),
    ("snis_investimento", "saneamento", "Investimentos do prestador de água e esgoto (SNIS FN033)", "R$", "brlc", "terra",
     "SNIS", "snis", "investimento_total_prestador", (0, 1e10), SNIS.replace("{cod}", "Informação FN033") + " Valores correntes do ano."),
    # ANA
    ("ana_sem_coleta", "saneamento", "Esgoto sem coleta e sem tratamento (ANA, 2013)", "%", "pct1", "brasa", "ANA", "ana",
     "indice_sem_atendimento_sem_coleta_sem_tratamento", (0, 1), ANA),
    ("ana_solucao_individual", "saneamento", "Esgoto por solução individual (ANA, 2013)", "%", "pct1", "agua", "ANA", "ana",
     "indice_atendimento_solucao_individual", (0, 1), ANA),
    ("ana_coleta_sem_trat", "saneamento", "Esgoto coletado e não tratado (ANA, 2013)", "%", "pct1", "brasa", "ANA", "ana",
     "indice_atendimento_com_coleta_sem_tratamento", (0, 1), ANA),
    ("ana_coleta_com_trat", "saneamento", "Esgoto coletado e tratado (ANA, 2013)", "%", "pct1", "agua", "ANA", "ana",
     "indice_atendimento_com_coleta_com_tratamento", (0, 1), ANA),
    # Fundação Abrinq
    ("abrinq_pre_liquida", "educacao", "Taxa líquida de matrícula na pré-escola (Fundação Abrinq)", "%", "pct1", "agua",
     "ABRINQ", "abrinq", "taxa_liquida_matricula_pre_escola", (0, 150), ABRINQ),
    ("abrinq_pre_bruta", "educacao", "Taxa bruta de matrícula na pré-escola (Fundação Abrinq)", "%", "pct1", "agua",
     "ABRINQ", "abrinq", "taxa_bruta_matricula_pre_escola", (0, 200), ABRINQ),
]
FATOR = {"ana": 100.0}             # índices da ANA: de 0 a 1 na fonte, em % no Atlas


def para(msg: str) -> None:
    sys.exit(f"✗ {msg}")


def baixa(base: str, tabela: str) -> pathlib.Path:
    destino = CACHE / f"{base}__{tabela}.csv.gz"
    if destino.exists() and destino.stat().st_size > 0:
        return destino
    CACHE.mkdir(parents=True, exist_ok=True)
    url = f"{BUCKET}/{base}/{tabela}/{tabela}.csv.gz"
    assert "_bdpro" not in url
    print(f"  ↓ {url}")
    parcial = destino.with_suffix(".parcial")
    with urllib.request.urlopen(url, timeout=600) as r, open(parcial, "wb") as f:
        shutil.copyfileobj(r, f)
    parcial.rename(destino)
    return destino


def le(chave: str) -> dict[str, dict[int, dict[str, str]]]:
    """Linhas dos sete municípios: coluna -> ano -> município -> texto."""
    base, tabela, _, ano_fixo = TABELAS[chave]
    colunas = {s[8] for s in SERIES if s[7] == chave}
    out: dict[str, dict[int, dict[str, str]]] = {c: {} for c in colunas}
    vistos: set[str] = set()
    with gzip.open(baixa(base, tabela), "rt", encoding="utf-8", newline="") as h:
        r = csv.DictReader(h)
        faltam = [c for c in colunas | {"id_municipio"} if c not in (r.fieldnames or [])]
        if ano_fixo is None and "ano" not in (r.fieldnames or []):
            faltam.append("ano")
        if faltam:
            para(f"{base}.{tabela}: faltam as colunas {faltam}. Colunas que vieram: {r.fieldnames}")
        for linha in r:
            m = linha["id_municipio"]
            if m not in MUN:
                continue
            vistos.add(m)
            ano = ano_fixo or int(linha["ano"])
            for c in colunas:
                if (linha.get(c) or "").strip():
                    if ano in out[c] and m in out[c][ano] and out[c][ano][m] != linha[c].strip():
                        para(f"{base}.{tabela}: {MUN[m]} aparece duas vezes em {ano} com valores diferentes em {c}")
                    out[c].setdefault(ano, {})[m] = linha[c].strip()
    if len(vistos) != len(MUN):
        para(f"{base}.{tabela}: municípios ausentes: {[MUN[c] for c in COD if c not in vistos]}")
    return out


def main() -> None:
    print("Séries complementares (espelho público da Base dos Dados)")
    lidas = {chave: le(chave) for chave in TABELAS}
    series = []
    for (sid, cat, nome, unid, fmt, ramp, fonte, chave, col, (lo, hi), nota) in SERIES:
        ano_min = TABELAS[chave][2]
        fator = FATOR.get(chave, 1.0)
        por_ano = lidas[chave][col]
        anos = sorted(a for a in por_ano if a >= ano_min)
        tabela: dict[int, list] = {}
        for a in anos:
            linha = []
            for m in COD:
                txt = por_ano[a].get(m)
                if txt is None:
                    linha.append(None)
                    continue
                v = float(txt)
                if not (lo <= v <= hi):
                    para(f"{sid}: {MUN[m]} em {a} tem {v}, fora da faixa possível ({lo} a {hi}). A fonte mudou de unidade?")
                linha.append(round(v * fator, 2))
            tabela[a] = linha
        completos = [a for a in anos if all(x is not None for x in tabela[a])]
        if not completos:
            para(f"{sid}: nenhum ano desde {ano_min} com os sete municípios")
        series.append({"id": sid, "cat": cat, "nome": nome, "unidade": unid, "fmt": fmt, "ramp": ramp,
                       "fonte": fonte, "cod": col, "tabela": ".".join(TABELAS[chave][:2]), "ano": completos[-1],
                       "anos": anos, "v": [tabela[a] for a in anos], "obs": nota.replace("{c}", col)})
        print(f"  {sid:24s} {completos[-1]}  ({anos[0]}–{anos[-1]})")

    # ANA: os quatro índices repartem 100% em cada município
    ana = [s for s in series if s["tabela"].startswith("br_ana_atlas_esgotos")]
    for k, m in enumerate(COD):
        soma = sum(s["v"][-1][k] for s in ana)
        if abs(soma - 100) > 0.2:
            para(f"ANA: em {MUN[m]} os quatro índices somam {soma:.2f}%, e não 100%")

    saida = {"gerado_em": date.today().isoformat(), "origem": BUCKET, "municipios": COD,
             "fontes": FONTES, "series": series,
             "conferencia": {"series": len(series), "tabelas": {k: ".".join(v[:2]) for k, v in TABELAS.items()},
                             "ana_soma_100": True}}
    texto = ("// Gerado por extracao/8_series_complementares.py. Não edite à mão: rode o script de novo.\n"
             "window.ATLAS_SERIES=" + json.dumps(saida, ensure_ascii=False, separators=(",", ":")) + ";\n")
    SAIDA.write_text(texto, encoding="utf-8")
    print(f"Gravado {SAIDA.relative_to(RAIZ)}: {len(series)} séries, {len(texto.encode()) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
