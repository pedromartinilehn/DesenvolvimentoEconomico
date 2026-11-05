#!/usr/bin/env python3
"""Monta os arquivos de dados do Atlas 2.0: um para o Brasil e um por região.

    python3 extracao/4_monta.py

Lê o que os scripts 1, 2 e 3 gravaram em extracao/fontes/intermediario/ e grava:

- dados/brasil.js: regiões, UFs, catálogo de indicadores, fontes, valores de UF,
  região e Brasil para comparar e o índice de busca dos 5.570 municípios;
- dados/regiao-n.js, -ne.js, -se.js, -s.js e -co.js: municípios e bairros da
  região, com malha e valores. O Atlas carrega só a região escolhida.

Regras de exibição (as mesmas em todos os níveis):
- valor do Censo 2022 calculado sobre os setores com dado. Se esses setores têm
  menos da metade da população do bairro ou município, o valor fica em branco;
- quando o sigilo do IBGE deixa um intervalo (mínimo e máximo) maior que a casa
  decimal exibida, o arquivo guarda os dois e o Atlas mostra o intervalo;
- nada é estimado: o que a fonte não publica fica em branco.

Confere antes de gravar: os mesmos 5.570 municípios e 17.575 bairros nos três
arquivos intermediários, valores dentro da faixa possível e população de cada
região igual à soma dos seus municípios.
"""

from __future__ import annotations

import csv
import datetime as dt
import gzip
import json
import math
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
INTER = RAIZ / "extracao" / "fontes" / "intermediario"
BD = RAIZ / "extracao" / "fontes" / "basedosdados"
DADOS = RAIZ / "dados"
VERSAO = "2.0"
COB_MIN = 0.5          # parte mínima da população em setores com dado para exibir o valor

UF_SIGLA = {11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO",
            21: "MA", 22: "PI", 23: "CE", 24: "RN", 25: "PB", 26: "PE", 27: "AL", 28: "SE", 29: "BA",
            31: "MG", 32: "ES", 33: "RJ", 35: "SP", 41: "PR", 42: "SC", 43: "RS",
            50: "MS", 51: "MT", 52: "GO", 53: "DF"}


class Falha(Exception):
    pass


# ── fontes ──────────────────────────────────────────────────────────────────
BDV = "lido no espelho público da Base dos Dados (basedosdados.org), que republica a base oficial sem alterar os valores"
FONTES = {
    "CENSO22": {"n": "IBGE — Censo Demográfico 2022, agregados por setores censitários", "s": "Censo 2022",
                "u": "https://www.ibge.gov.br/estatisticas/sociais/trabalho/22827-censo-demografico-2022.html",
                "d": "Agregados por setor do universo do Censo 2022 (básico, pessoas, domicílios, renda do responsável e "
                     "entorno), nos arquivos que o IPEA publica para o pacote censobr. O Atlas soma os setores de cada "
                     "bairro, município, UF e região."},
    "MALHA22": {"n": "IBGE — Malha de setores censitários do Censo 2022", "s": "Malha IBGE 2022",
                "u": "https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais.html",
                "d": "Polígonos dos setores de 2022, na forma publicada pelo IPEA no pacote geobr. Municípios, bairros, "
                     "UFs e regiões são a união dos seus setores."},
    "ATLAS": {"n": "Atlas do Desenvolvimento Humano no Brasil — PNUD, IPEA e Fundação João Pinheiro", "s": "Atlas Brasil",
              "u": "https://www.atlasbrasil.org.br/",
              "d": "IDHM e indicadores municipais calculados a partir dos Censos de 1991, 2000 e 2010; " + BDV +
                   " (mundo_onu_adh). UF e Brasil são os valores oficiais do próprio Atlas."},
    "PIB": {"n": "IBGE — Produto Interno Bruto dos Municípios", "s": "IBGE, PIB dos Municípios",
            "u": "https://www.ibge.gov.br/estatisticas/economicas/contas-nacionais/9088-produto-interno-bruto-dos-municipios.html",
            "d": "PIB e valor adicionado por setor, 2002 a 2021; " + BDV + " (br_ibge_pib). UF, região e Brasil são a "
                 "soma dos municípios, que é como o IBGE fecha as contas."},
    "POP": {"n": "IBGE — Estimativas da população residente", "s": "IBGE, estimativas",
            "u": "https://www.ibge.gov.br/estatisticas/sociais/populacao/9103-estimativas-de-populacao.html",
            "d": "População estimada em 1º de julho de cada ano; " + BDV + " (br_ibge_populacao)."},
    "IDEB": {"n": "INEP — Índice de Desenvolvimento da Educação Básica", "s": "IDEB/INEP",
             "u": "https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/ideb",
             "d": "IDEB da rede pública (escolas municipais, estaduais e federais juntas); " + BDV +
                  " (br_inep_ideb). UF, região e Brasil são os valores oficiais do INEP."},
    "SNIS": {"n": "Ministério das Cidades — Sistema Nacional de Informações sobre Saneamento", "s": "SNIS",
             "u": "https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/saneamento/snis",
             "d": "Indicadores de água e esgoto declarados pelos prestadores de serviço; " + BDV +
                  " (br_mdr_snis). Município sem prestador declarado fica sem valor."},
    "PNI": {"n": "Ministério da Saúde — Programa Nacional de Imunizações", "s": "PNI/MS",
            "u": "https://sipni.datasus.gov.br/",
            "d": "Cobertura vacinal: doses aplicadas sobre a população-alvo; " + BDV + " (br_ms_imunizacoes)."},
    "ANATEL": {"n": "Anatel — Acessos de banda larga fixa e de telefonia móvel", "s": "Anatel",
               "u": "https://informacoes.anatel.gov.br/paineis/acessos",
               "d": "Densidade de acessos por 100 habitantes, último mês publicado em cada ano; " + BDV +
                    " (br_anatel_banda_larga_fixa e br_anatel_telefonia_movel)."},
    "ABRINQ": {"n": "Fundação Abrinq — Observatório da Criança e do Adolescente", "s": "Fundação Abrinq",
               "u": "https://observatoriocrianca.org.br/",
               "d": "Matrícula na pré-escola; " + BDV + " (br_abrinq_oca)."},
    "ANA": {"n": "Agência Nacional de Águas e Saneamento Básico — Atlas Esgotos", "s": "ANA, Atlas Esgotos",
            "u": "https://www.gov.br/ana/pt-br",
            "d": "Situação do esgotamento sanitário por município em 2013; " + BDV + " (br_ana_atlas_esgotos)."},
}

CATS = [
    ("geral", "Visão geral"), ("demo", "Demografia"), ("raca", "Cor ou raça"),
    ("idh", "Desenvolvimento humano"), ("renda", "Renda e pobreza"), ("trab", "Trabalho"),
    ("edu", "Educação"), ("saude", "Saúde"), ("dom", "Domicílio e saneamento"),
    ("entorno", "Entorno dos domicílios"), ("vuln", "Vulnerabilidade"), ("eco", "Economia"),
    ("conect", "Conectividade"),
]

SIGILO = (" Calculado pelo Atlas somando os setores do Censo 2022. O IBGE omite, em cada setor, contagens de 1 e 2; "
          "quando a categoria omitida é a única que falta para fechar o total, o Atlas a recupera pela diferença. "
          "Se não dá, o valor fica entre um mínimo e um máximo, e o Atlas mostra o intervalo.")
ENT = (" Pesquisa do entorno do Censo 2022: faces de quadra percorridas nas áreas urbanas. A base são os moradores de "
       "domicílios com entorno pesquisado; a zona rural, na maior parte, não entra.")
ADH_D = " Atlas Brasil, Censo de 2010; o painel mostra 1991 e 2000."


def I(id, cat, n, u, fmt, fonte, ano, niv, esc, d, rampa="seq", serie=False, calc=None):
    """serie: False, True (todos os anos da fonte) ou o primeiro ano da série."""
    return {"id": id, "cat": cat, "n": n, "u": u, "fmt": fmt, "fonte": fonte, "ano": ano, "niv": niv,
            "esc": esc, "d": d, "rampa": rampa, "serie": bool(serie),
            **({"serie_desde": serie} if isinstance(serie, int) and not isinstance(serie, bool) else {}),
            **({"calc": calc} if calc else {})}


MB = ["mun", "bai"]
M = ["mun"]
CATALOGO = [
    # visão geral (Censo 2022)
    I("pop", "geral", "População residente", "pessoas", "int", "CENSO22", 2022, MB, 1,
      "Pessoas que moravam no bairro ou município na data de referência do Censo 2022. Soma exata dos setores."),
    I("dom", "geral", "Domicílios particulares ocupados", "domicílios", "int", "CENSO22", 2022, MB, 1,
      "Domicílios particulares permanentes e improvisados ocupados. Soma exata dos setores."),
    I("area", "geral", "Área", "km²", "dec2", "MALHA22", 2022, MB, 100,
      "Soma das áreas dos setores censitários publicadas pelo IBGE."),
    I("dens", "geral", "Densidade demográfica", "hab./km²", "dec1", "CENSO22", 2022, MB, 10,
      "População dividida pela área.", calc="população do Censo 2022 ÷ área dos setores"),
    I("pct_urb", "geral", "População em setores urbanos", "%", "pct1", "CENSO22", 2022, MB, 10,
      "Parte da população que mora em setores classificados como urbanos pelo IBGE."),
    I("var_pop", "geral", "Variação da população de 2010 a 2022", "%", "pct1", "CENSO22", 2022, M, 10,
      "Variação entre a população do Censo 2010 (Atlas Brasil) e a do Censo 2022. Municípios criados depois de "
      "2010 ficam em branco.", rampa="div", calc="(população 2022 ÷ população 2010 − 1) × 100"),
    I("mor_dom", "geral", "Moradores por domicílio", "pessoas", "dec2", "CENSO22", 2022, MB, 100,
      "Média de moradores por domicílio particular permanente ocupado." + SIGILO),
    # demografia
    I("pct_0a14", "demo", "Crianças de 0 a 14 anos", "%", "pct1", "CENSO22", 2022, MB, 10, "Parte da população." + SIGILO),
    I("pct_15a29", "demo", "Jovens de 15 a 29 anos", "%", "pct1", "CENSO22", 2022, MB, 10, "Parte da população." + SIGILO),
    I("pct_60mais", "demo", "Pessoas de 60 anos ou mais", "%", "pct1", "CENSO22", 2022, MB, 10, "Parte da população." + SIGILO),
    I("ind_envelhec", "demo", "Índice de envelhecimento", "por 100", "dec1", "CENSO22", 2022, MB, 10,
      "Pessoas de 60 anos ou mais para cada 100 de 0 a 14 anos (as faixas de idade do Censo 2022 por setor não "
      "separam os 65 anos)." + SIGILO),
    I("razao_sexo", "demo", "Razão de sexo", "homens por 100 mulheres", "dec1", "CENSO22", 2022, MB, 10,
      "Homens para cada 100 mulheres." + SIGILO, rampa="div"),
    I("adh_fecund", "demo", "Taxa de fecundidade total", "filhos por mulher", "dec2", "ATLAS", 2010, M, 100,
      "Número médio de filhos que uma mulher teria ao fim da idade reprodutiva." + ADH_D, serie=True),
    # cor ou raça
    I("pct_branca", "raca", "Pessoas brancas", "%", "pct1", "CENSO22", 2022, MB, 10, "Cor ou raça declarada." + SIGILO),
    I("pct_preta", "raca", "Pessoas pretas", "%", "pct1", "CENSO22", 2022, MB, 10, "Cor ou raça declarada." + SIGILO),
    I("pct_parda", "raca", "Pessoas pardas", "%", "pct1", "CENSO22", 2022, MB, 10, "Cor ou raça declarada." + SIGILO),
    I("pct_negra", "raca", "Pessoas pretas ou pardas", "%", "pct1", "CENSO22", 2022, MB, 10,
      "Soma de pretos e pardos, a população negra na classificação do IBGE." + SIGILO),
    I("pct_indigena", "raca", "Pessoas indígenas (cor ou raça)", "%", "pct2", "CENSO22", 2022, MB, 100,
      "Quem declarou cor ou raça indígena. Não inclui quem se declarou indígena só na pergunta de pertencimento, "
      "que o IBGE conta à parte." + SIGILO),
    I("pct_amarela", "raca", "Pessoas amarelas", "%", "pct2", "CENSO22", 2022, MB, 100, "Cor ou raça declarada." + SIGILO),
    # desenvolvimento humano
    I("idhm", "idh", "IDHM", "índice", "dec3", "ATLAS", 2010, M, 1000,
      "Índice de Desenvolvimento Humano Municipal: média geométrica dos índices de renda, longevidade e educação." + ADH_D,
      serie=True),
    I("idhm_r", "idh", "IDHM Renda", "índice", "dec3", "ATLAS", 2010, M, 1000, "Componente de renda do IDHM." + ADH_D, serie=True),
    I("idhm_l", "idh", "IDHM Longevidade", "índice", "dec3", "ATLAS", 2010, M, 1000,
      "Componente de longevidade do IDHM." + ADH_D, serie=True),
    I("idhm_e", "idh", "IDHM Educação", "índice", "dec3", "ATLAS", 2010, M, 1000,
      "Componente de educação do IDHM." + ADH_D, serie=True),
    # renda e pobreza
    I("renda_resp", "renda", "Rendimento médio do responsável pelo domicílio", "R$/mês", "brl0", "CENSO22", 2022, MB, 1,
      "Rendimento nominal médio mensal das pessoas responsáveis com rendimento, em domicílios particulares permanentes "
      "ocupados. O IBGE publica a média de cada setor; no bairro e no município o Atlas faz a média ponderada pelo "
      "número de responsáveis (o peso exato seria o de responsáveis com rendimento, que o IBGE não publica por setor). "
      "É aproximação, por isso aparece como cálculo do Atlas.", calc="média dos setores ponderada pelos responsáveis"),
    I("adh_renda_pc", "renda", "Renda per capita", "R$ de ago./2010", "brl", "ATLAS", 2010, M, 100,
      "Renda domiciliar per capita média, em reais de agosto de 2010." + ADH_D, serie=True),
    I("adh_gini", "renda", "Índice de Gini", "índice", "dec2", "ATLAS", 2010, M, 100,
      "Desigualdade da renda domiciliar per capita: 0 é igualdade total, 1 é desigualdade máxima." + ADH_D,
      rampa="alerta", serie=True),
    I("adh_ext_pobres", "renda", "Extremamente pobres", "%", "pct2", "ATLAS", 2010, M, 100,
      "Pessoas com renda domiciliar per capita de até R$ 70 de agosto de 2010." + ADH_D, rampa="alerta", serie=True),
    I("adh_pobres", "renda", "Pobres", "%", "pct2", "ATLAS", 2010, M, 100,
      "Pessoas com renda domiciliar per capita de até R$ 140 de agosto de 2010." + ADH_D, rampa="alerta", serie=True),
    I("adh_vulner", "renda", "Vulneráveis à pobreza", "%", "pct2", "ATLAS", 2010, M, 100,
      "Pessoas com renda domiciliar per capita de até meio salário mínimo de 2010 (R$ 255)." + ADH_D,
      rampa="alerta", serie=True),
    # trabalho
    I("adh_desocup18", "trab", "Taxa de desocupação, 18 anos ou mais", "%", "pct2", "ATLAS", 2010, M, 100,
      "Pessoas desocupadas sobre a população economicamente ativa de 18 anos ou mais." + ADH_D, rampa="alerta", serie=True),
    I("adh_formal", "trab", "Grau de formalização dos ocupados", "%", "pct2", "ATLAS", 2010, M, 100,
      "Ocupados de 18 anos ou mais com carteira, no setor público ou contribuindo para a previdência." + ADH_D, serie=True),
    I("adh_ativ18", "trab", "Taxa de atividade, 18 anos ou mais", "%", "pct2", "ATLAS", 2010, M, 100,
      "População economicamente ativa sobre a população de 18 anos ou mais." + ADH_D, serie=True),
    I("adh_renda_ocup", "trab", "Rendimento médio dos ocupados", "R$ de ago./2010", "brl", "ATLAS", 2010, M, 100,
      "Rendimento médio dos ocupados de 18 anos ou mais, em reais de agosto de 2010." + ADH_D, serie=True),
    # educação
    I("tx_analf", "edu", "Taxa de analfabetismo, 15 anos ou mais", "%", "pct1", "CENSO22", 2022, MB, 10,
      "Pessoas de 15 anos ou mais que não sabem ler e escrever." + SIGILO, rampa="alerta"),
    I("adh_analf15", "edu", "Taxa de analfabetismo, 15 anos ou mais (2010)", "%", "pct2", "ATLAS", 2010, M, 100,
      "Mesma medida no Censo de 2010, para comparar com 2022." + ADH_D, rampa="alerta", serie=True),
    I("adh_fund18", "edu", "Adultos com fundamental completo", "%", "pct2", "ATLAS", 2010, M, 100,
      "Pessoas de 18 anos ou mais com o ensino fundamental completo." + ADH_D, serie=True),
    I("adh_medio18", "edu", "Adultos com médio completo", "%", "pct2", "ATLAS", 2010, M, 100,
      "Pessoas de 18 anos ou mais com o ensino médio completo." + ADH_D, serie=True),
    I("adh_sup25", "edu", "Adultos com superior completo", "%", "pct2", "ATLAS", 2010, M, 100,
      "Pessoas de 25 anos ou mais com o ensino superior completo." + ADH_D, serie=True),
    I("adh_anos_estudo", "edu", "Expectativa de anos de estudo", "anos", "dec2", "ATLAS", 2010, M, 100,
      "Anos de estudo que uma criança que entra na escola deve completar aos 18 anos, mantidas as taxas do ano." + ADH_D,
      serie=True),
    I("adh_fora_escola_6_14", "edu", "Crianças de 6 a 14 anos fora da escola", "%", "pct2", "ATLAS", 2010, M, 100,
      "Parte das crianças de 6 a 14 anos que não frequentam a escola." + ADH_D, rampa="alerta", serie=True),
    I("ideb_ai", "edu", "IDEB, anos iniciais do fundamental", "nota", "dec1", "IDEB", 2023, M, 10,
      "Rede pública, do 1º ao 5º ano. Combina a aprovação e a nota do SAEB, de 0 a 10.", serie=True),
    I("ideb_af", "edu", "IDEB, anos finais do fundamental", "nota", "dec1", "IDEB", 2023, M, 10,
      "Rede pública, do 6º ao 9º ano. Combina a aprovação e a nota do SAEB, de 0 a 10.", serie=True),
    I("ideb_em", "edu", "IDEB, ensino médio", "nota", "dec1", "IDEB", 2023, M, 10,
      "Rede pública. Combina a aprovação e a nota do SAEB, de 0 a 10.", serie=True),
    I("abrinq_pre", "edu", "Taxa líquida de matrícula na pré-escola", "%", "pct2", "ABRINQ", 2019, M, 100,
      "Crianças de 4 e 5 anos matriculadas na pré-escola sobre a população dessa idade. Passa de 100% quando a "
      "população estimada é menor que a matriculada (limitação da fonte).", serie=True),
    # saúde
    I("adh_espvida", "saude", "Esperança de vida ao nascer", "anos", "dec2", "ATLAS", 2010, M, 100,
      "Número médio de anos que uma pessoa nascida no município deve viver." + ADH_D, serie=True),
    I("adh_mort1", "saude", "Mortalidade infantil", "por mil nascidos vivos", "dec1", "ATLAS", 2010, M, 100,
      "Mortes de crianças com menos de 1 ano por mil nascidos vivos." + ADH_D, rampa="alerta", serie=True),
    I("vac_penta", "saude", "Cobertura vacinal da pentavalente", "%", "pct2", "PNI", 2021, M, 100,
      "Doses aplicadas sobre a população-alvo. Pode passar de 100% quando o município vacina gente de fora.", serie=True),
    I("vac_polio", "saude", "Cobertura vacinal contra poliomielite", "%", "pct2", "PNI", 2021, M, 100,
      "Doses aplicadas sobre a população-alvo. Pode passar de 100% quando o município vacina gente de fora."),
    I("vac_triplice_d1", "saude", "Cobertura vacinal da tríplice viral, 1ª dose", "%", "pct2", "PNI", 2021, M, 100,
      "Sarampo, caxumba e rubéola. Doses aplicadas sobre a população-alvo.", serie=True),
    I("vac_bcg", "saude", "Cobertura vacinal de BCG", "%", "pct2", "PNI", 2021, M, 100,
      "Doses aplicadas sobre a população-alvo; a BCG é dada na maternidade, por isso o município com hospital de "
      "referência passa de 100%."),
    # domicílio e saneamento (Censo 2022)
    I("pct_agua_rede", "dom", "Domicílios com água da rede geral", "%", "pct1", "CENSO22", 2022, MB, 10,
      "Domicílios particulares permanentes ocupados cuja forma principal de abastecimento é a rede geral de "
      "distribuição." + SIGILO),
    I("pct_agua_poco", "dom", "Domicílios com água de poço", "%", "pct1", "CENSO22", 2022, MB, 10,
      "Poço profundo, artesiano, raso, freático ou cacimba como forma principal." + SIGILO, rampa="neutra"),
    I("pct_agua_naoenc", "dom", "Domicílios sem água encanada", "%", "pct1", "CENSO22", 2022, MB, 10,
      "A água não chega encanada ao domicílio." + SIGILO, rampa="alerta"),
    I("pct_banheiro", "dom", "Domicílios com banheiro de uso exclusivo", "%", "pct1", "CENSO22", 2022, MB, 10,
      "Pelo menos um banheiro de uso exclusivo, com chuveiro e vaso sanitário." + SIGILO),
    I("pct_sem_banheiro", "dom", "Domicílios sem banheiro nem sanitário", "%", "pct2", "CENSO22", 2022, MB, 100,
      "Não tinham banheiro nem sanitário." + SIGILO, rampa="alerta"),
    I("pct_esgoto_rede", "dom", "Esgoto pela rede geral ou pluvial", "%", "pct1", "CENSO22", 2022, MB, 10,
      "Esgoto do banheiro ou sanitário ligado à rede geral ou pluvial, ou fossa séptica ligada à rede." + SIGILO),
    I("pct_esgoto_fossa", "dom", "Esgoto em fossa séptica não ligada à rede", "%", "pct1", "CENSO22", 2022, MB, 10,
      "Fossa séptica ou fossa filtro não ligada à rede." + SIGILO, rampa="neutra"),
    I("pct_esgoto_precario", "dom", "Esgoto precário ou inexistente", "%", "pct1", "CENSO22", 2022, MB, 10,
      "Fossa rudimentar ou buraco, vala, rio, lago, córrego ou mar, outra forma, ou sem banheiro nem sanitário." + SIGILO,
      rampa="alerta"),
    I("pct_lixo_coleta", "dom", "Domicílios com lixo coletado", "%", "pct1", "CENSO22", 2022, MB, 10,
      "Lixo coletado no domicílio ou depositado em caçamba do serviço de limpeza." + SIGILO),
    I("pct_lixo_queima", "dom", "Domicílios que queimam o lixo", "%", "pct1", "CENSO22", 2022, MB, 10,
      "Lixo queimado na propriedade." + SIGILO, rampa="alerta"),
    I("pct_apto", "dom", "Domicílios em apartamento", "%", "pct1", "CENSO22", 2022, MB, 10,
      "Espécie do domicílio particular permanente ocupado." + SIGILO, rampa="neutra"),
    I("pct_comodos", "dom", "Domicílios em casa de cômodos ou cortiço", "%", "pct2", "CENSO22", 2022, MB, 100,
      "Espécie do domicílio particular permanente ocupado." + SIGILO, rampa="alerta"),
    I("dom_improv", "dom", "Domicílios improvisados ocupados", "domicílios", "int", "CENSO22", 2022, MB, 1,
      "Tendas, barracas, estruturas em logradouro, veículos e outros abrigos improvisados com moradores. Fica em "
      "branco quando algum setor do bairro ou município teve os dados omitidos, porque aí a soma seria parcial.",
      rampa="alerta"),
    I("snis_agua", "dom", "Atendimento total de água (SNIS)", "%", "pct2", "SNIS", 2022, M, 100,
      "Indicador IN055: população atendida com abastecimento de água sobre a população total.", serie=True),
    I("snis_esgoto", "dom", "Atendimento total de esgoto (SNIS)", "%", "pct2", "SNIS", 2022, M, 100,
      "Indicador IN056: população atendida com esgotamento sanitário sobre a população total.", serie=True),
    I("snis_coleta", "dom", "Índice de coleta de esgoto (SNIS)", "%", "pct2", "SNIS", 2022, M, 100,
      "Indicador IN015: esgoto coletado sobre a água consumida."),
    I("snis_perdas", "dom", "Perdas de água na distribuição (SNIS)", "%", "pct2", "SNIS", 2022, M, 100,
      "Indicador IN049: água produzida que não chega a ser consumida.", rampa="alerta"),
    I("ana_coleta_trat", "dom", "Esgoto coletado e tratado (ANA, 2013)", "%", "pct2", "ANA", 2013, M, 100,
      "Parte do esgoto gerado que é coletado e tratado. Os quatro índices da ANA repartem 100%."),
    I("ana_sem_coleta", "dom", "Esgoto sem coleta e sem tratamento (ANA, 2013)", "%", "pct2", "ANA", 2013, M, 100,
      "Parte do esgoto gerado que não é coletado nem tratado.", rampa="alerta"),
    # entorno
    I("pct_pav", "entorno", "Moradores em rua pavimentada", "%", "pct1", "CENSO22", 2022, MB, 10, "Face com via pavimentada." + ENT),
    I("pct_ilum", "entorno", "Moradores em rua com iluminação pública", "%", "pct1", "CENSO22", 2022, MB, 10,
      "Face com iluminação pública." + ENT),
    I("pct_calcada", "entorno", "Moradores em rua com calçada", "%", "pct1", "CENSO22", 2022, MB, 10, "Face com calçada." + ENT),
    I("pct_arvore", "entorno", "Moradores em rua arborizada", "%", "pct1", "CENSO22", 2022, MB, 10,
      "Face com pelo menos uma árvore." + ENT),
    I("pct_bueiro", "entorno", "Moradores em rua com bueiro", "%", "pct1", "CENSO22", 2022, MB, 10,
      "Face com bueiro ou boca de lobo." + ENT),
    I("pct_onibus", "entorno", "Moradores em rua com ponto de ônibus", "%", "pct1", "CENSO22", 2022, MB, 10,
      "Face com ponto de ônibus ou van." + ENT),
    I("pct_rampa", "entorno", "Moradores em rua com rampa para cadeirante", "%", "pct1", "CENSO22", 2022, MB, 10,
      "Face com rampa para cadeirante." + ENT),
    I("pct_bici", "entorno", "Moradores em rua com ciclovia ou ciclofaixa", "%", "pct1", "CENSO22", 2022, MB, 10,
      "Face com via sinalizada para bicicleta." + ENT),
    I("pct_obstaculo", "entorno", "Moradores em rua com obstáculo na calçada", "%", "pct1", "CENSO22", 2022, MB, 10,
      "Face com obstáculo na calçada." + ENT, rampa="alerta"),
    I("cob_entorno", "entorno", "Moradores com entorno pesquisado", "%", "pct1", "CENSO22", 2022, MB, 10,
      "Parte dos moradores de domicílios particulares permanentes que está em faces percorridas pela pesquisa do "
      "entorno. Mostra quanto do bairro ou município os outros indicadores de entorno cobrem.", rampa="neutra"),
    # vulnerabilidade
    I("pct_fcu", "vuln", "População em favelas e comunidades urbanas", "%", "pct1", "CENSO22", 2022, MB, 10,
      "Parte da população que mora em setores classificados pelo IBGE como favela ou comunidade urbana.", rampa="alerta"),
    I("adh_nemnem", "vuln", "Jovens que não estudam, não trabalham e são vulneráveis", "%", "pct2", "ATLAS", 2010, M, 100,
      "Pessoas de 15 a 24 anos que não estudam nem trabalham e vivem em domicílio vulnerável à pobreza." + ADH_D,
      rampa="alerta", serie=True),
    I("adh_maes_chefes", "vuln", "Mães chefes de família sem fundamental e com filho pequeno", "%", "pct2", "ATLAS", 2010, M,
      100, "Mulheres chefes de família sem fundamental completo e com ao menos um filho menor de 15 anos, sobre o total "
      "de mulheres chefes de família." + ADH_D, rampa="alerta", serie=True),
    I("adh_desloc_1h", "vuln", "Vulneráveis que gastam mais de 1 hora até o trabalho", "%", "pct2", "ATLAS", 2010, M, 100,
      "Pessoas vulneráveis à pobreza, ocupadas, que levam mais de uma hora no trajeto de casa ao trabalho." + ADH_D,
      rampa="alerta", serie=True),
    I("adh_agua_esgoto_inad", "vuln", "Pessoas com água e esgoto inadequados (2010)", "%", "pct2", "ATLAS", 2010, M, 100,
      "Pessoas em domicílios com abastecimento de água e esgotamento sanitário inadequados." + ADH_D,
      rampa="alerta", serie=True),
    # economia
    I("pib", "eco", "PIB", "R$", "brlc", "PIB", 2021, M, 0.001,
      "Produto interno bruto a preços correntes do ano."),
    I("pib_pc", "eco", "PIB per capita", "R$", "brl0", "PIB", 2021, M, 1,
      "PIB do ano dividido pela população estimada pelo IBGE para o mesmo ano.", serie=2010,
      calc="PIB ÷ população estimada do mesmo ano"),
    I("va_agro", "eco", "Peso da agropecuária no valor adicionado", "%", "pct1", "PIB", 2021, M, 10,
      "Valor adicionado da agropecuária sobre o valor adicionado total.", rampa="neutra"),
    I("va_ind", "eco", "Peso da indústria no valor adicionado", "%", "pct1", "PIB", 2021, M, 10,
      "Valor adicionado da indústria sobre o valor adicionado total. O IBGE publica valor negativo em alguns "
      "municípios, como os de produção de petróleo.", rampa="neutra"),
    I("va_serv", "eco", "Peso dos serviços no valor adicionado", "%", "pct1", "PIB", 2021, M, 10,
      "Serviços, exceto administração pública, sobre o valor adicionado total.", rampa="neutra"),
    I("va_adm", "eco", "Peso da administração pública no valor adicionado", "%", "pct1", "PIB", 2021, M, 10,
      "Administração, defesa, educação e saúde públicas e seguridade social sobre o valor adicionado total.",
      rampa="neutra"),
    # conectividade
    I("anatel_bl", "conect", "Banda larga fixa", "acessos por 100 hab.", "dec1", "ANATEL", 2024, M, 10,
      "Densidade de acessos de banda larga fixa em junho de 2024; nos anos anteriores, dezembro.", serie=2017),
    I("anatel_movel", "conect", "Telefonia móvel", "acessos por 100 hab.", "dec1", "ANATEL", 2024, M, 10,
      "Densidade de acessos de telefonia móvel em junho de 2024; nos anos anteriores, dezembro.", serie=True),
]
CAT_IDS = {c for c, _ in CATS}
for c in CATALOGO:
    if c["cat"] not in CAT_IDS or c["fonte"] not in FONTES:
        raise SystemExit(f"catálogo: {c['id']} com categoria ou fonte desconhecida")

# indicadores do Censo por setor: grupo de cobertura
COB_PESSOAS = {"pct_0a14", "pct_15a29", "pct_60mais", "ind_envelhec", "razao_sexo", "pct_branca", "pct_preta",
               "pct_parda", "pct_negra", "pct_indigena", "pct_amarela", "tx_analf"}
COB_DOM = {"pct_agua_rede", "pct_agua_poco", "pct_agua_naoenc", "pct_banheiro", "pct_sem_banheiro",
           "pct_esgoto_rede", "pct_esgoto_fossa", "pct_esgoto_precario", "pct_lixo_coleta", "pct_lixo_queima",
           "pct_apto", "pct_comodos"}
COB_ENT = {"pct_pav", "pct_ilum", "pct_calcada", "pct_arvore", "pct_bueiro", "pct_onibus", "pct_rampa", "pct_bici",
           "pct_obstaculo"}
FAIXA = {"pct": (0, 100.0001)}


# ── codificação ─────────────────────────────────────────────────────────────
def enc_num(v: int, out: list) -> None:
    r = (v << 1) if v >= 0 else ((~v) << 1) | 1
    while r >= 32:
        out.append(chr((32 | (r & 31)) + 63))
        r >>= 5
    out.append(chr(r + 63))


def arred(x: float, esc: float) -> int:
    """Arredonda meio para cima (17,45 → 17,5 com uma casa); a margem evita que 17,45
    guardado em binário como 17,4499… caia para baixo."""
    return math.floor(x * esc + 0.5 + 1e-9)


def enc_col(vals, esc: float) -> str:
    """0 = sem valor; valor v ≥ 0 vira round(v·esc)+1; negativo, round(v·esc) (nunca 0)."""
    out = []
    for x in vals:
        if x is None or (isinstance(x, float) and math.isnan(x)):
            enc_num(0, out)
            continue
        k = arred(x, esc)
        enc_num(k + 1 if k >= 0 else k, out)
    return "".join(out)


def dec_col(s: str, esc: float, n: int) -> list:
    out, i = [], 0
    for _ in range(n):
        r = sh = 0
        while True:
            b = ord(s[i]) - 63
            i += 1
            r |= (b & 31) << sh
            sh += 5
            if b < 32:
                break
        v = ~(r >> 1) if r & 1 else r >> 1
        out.append(None if v == 0 else ((v - 1) / esc if v > 0 else v / esc))
    if i != len(s):
        raise Falha("coluna codificada com sobra")
    return out


def enc_ids(ids) -> str:
    """Inteiros em ordem crescente: o primeiro e as diferenças."""
    out, ant = [], 0
    for x in ids:
        if x < ant:
            raise Falha("códigos fora de ordem")
        enc_num(x - ant, out)
        ant = x
    return "".join(out)


def enc_g(feicao) -> str:
    """Arcos de uma feição: anéis separados por ',' e polígonos por ';'.

    Cada arco vira código (2i, ou 2i+1 se percorrido ao contrário) e grava-se a
    diferença para o código anterior da mesma feição.
    """
    polis, ant = [], 0
    for aneis in feicao:
        rs = []
        for anel in aneis:
            out = []
            for a in anel:
                cod = (a << 1) if a >= 0 else ((~a) << 1) | 1
                enc_num(cod - ant, out)
                ant = cod
            rs.append("".join(out))
        polis.append(",".join(rs))
    return ";".join(polis)


def confere_col(vals, esc, rotulo):
    s = enc_col(vals, esc)
    volta = dec_col(s, esc, len(vals))
    for a, b in zip(vals, volta):
        if (a is None) != (b is None) or (a is not None and arred(a, esc) != arred(b, esc)):
            raise Falha(f"{rotulo}: coluna não volta igual ({a} → {b})")
    return s


# ── valores ─────────────────────────────────────────────────────────────────
def cobertura(o, i):
    pop = o["pop"][i]
    if not pop:
        return 0.0, 0.0, 0.0
    return o["cob"]["pessoas"][i] / pop, o["cob"]["domicilio"][i] / pop, o["cob"]["renda"][i] / pop


def valores_censo(o: dict, i: int, esc: dict) -> tuple[dict, dict]:
    """Valores do Censo 2022 de uma unidade (bairro, município, UF, região ou Brasil)."""
    v, faixa = {}, {}
    pop, area = o["pop"][i], o["area"][i]
    v["pop"], v["dom"], v["area"] = pop, o["dom"][i], area
    v["dens"] = pop / area if area else None
    v["pct_urb"] = 100 * o["pop_urb"][i] / pop if pop else None
    v["pct_fcu"] = 100 * o["pop_fcu"][i] / pop if pop else None
    cp, cd, cr = cobertura(o, i)
    v["mor_dom"] = o["mor_dppo"][i] / o["dppo"][i] if o["dppo"][i] and cd >= COB_MIN else None
    v["dom_improv"] = o["dom_improv"][i] if cd >= 0.99995 else None
    v["renda_resp"] = o["renda_num"][i] / o["renda_den"][i] if o["renda_den"][i] and cr >= COB_MIN else None
    ent = o["ent_mor"][i]
    mor = o["mor_dppo"][i]
    v["cob_entorno"] = min(100.0, 100 * ent / mor) if mor and cd >= COB_MIN else None
    for k, (lo, hi) in ((k, (x[0][i], x[1][i])) for k, x in o["ind"].items() if k in esc):
        if lo is None or hi is None:
            v[k] = None
            continue
        if k in COB_PESSOAS and cp < COB_MIN or k in COB_DOM and cd < COB_MIN or k in COB_ENT and not ent:
            v[k] = None
            continue
        v[k] = (lo + hi) / 2
        if arred(hi, esc[k]) != arred(lo, esc[k]):
            faixa[k] = (lo, hi)
    v["_cob_p"], v["_cob_d"] = cp, cd
    return v, faixa


def ultimo(d: dict, i_pos: int):
    a = d["anos"][-1]
    return d["v"][str(a)][i_pos]


def main() -> int:
    malhas = json.loads((INTER / "malhas.json").read_text(encoding="utf-8"))
    censo = json.loads((INTER / "censo2022.json").read_text(encoding="utf-8"))
    muni = json.loads((INTER / "municipais.json").read_text(encoding="utf-8"))
    cat = {c["id"]: c for c in CATALOGO}
    esc = {c["id"]: c["esc"] for c in CATALOGO}
    conf = {"malhas": malhas["conferencia"], "censo2022": {k: v for k, v in censo["conferencia"].items()
                                                         if k != "largura_intervalo"},
            "municipais": {k: v for k, v in muni["conferencia"].items() if k != "cobertura_ultimo_ano"}}

    cm, cb = censo["niveis"]["mun"], censo["niveis"]["bai"]
    pos_cm = {c: i for i, c in enumerate(cm["ids"])}
    pos_cb = {c: i for i, c in enumerate(cb["ids"])}
    pos_mu = {c: i for i, c in enumerate(muni["ids"])}
    ids_malha_m = {c for r in malhas["regioes"].values() for c in r["mun"]["ids"]}
    ids_malha_b = {c for r in malhas["regioes"].values() for c in r["bai"]["ids"]}
    if not (ids_malha_m == set(pos_cm) == set(pos_mu)) or len(ids_malha_m) != 5570:
        raise Falha("os municípios das malhas, do Censo e das tabelas municipais não são os mesmos")
    if ids_malha_b != set(pos_cb) or len(ids_malha_b) != 17575:
        raise Falha("os bairros das malhas e do Censo não são os mesmos")
    ind_mu = muni["ind"]
    so_mun = [c for c in CATALOGO if c["niv"] == M and c["id"] in ind_mu]
    falta = [c["id"] for c in CATALOGO if c["niv"] == M and c["id"] not in ind_mu and c["id"] != "var_pop"]
    if falta:
        raise Falha(f"indicadores municipais sem dado nas tabelas: {falta}")
    censo_ids = [c["id"] for c in CATALOGO if c["fonte"] in ("CENSO22", "MALHA22") and c["id"] != "var_pop"]

    def faixa_ok(k, x):
        c = cat[k]
        if x is None:
            return
        if c["u"] == "%" and c["fonte"] == "CENSO22" and not (-0.0001 <= x <= 100.0001):
            raise Falha(f"{k}: {x} fora de 0 a 100")
        if c["u"] == "índice" and not (0 <= x <= 1):
            raise Falha(f"{k}: {x} fora de 0 a 1")

    pop2010 = ind_mu["adh_pop"]["v"]["2010"]
    DADOS.mkdir(parents=True, exist_ok=True)
    resumo_reg = []
    tamanhos = {}
    for sig, R in malhas["regioes"].items():
        saida = {"v": VERSAO, "sig": sig, "nome": R["nome"], "prec": {"mun": malhas["prec"]["mun"],
                                                                      "bai": malhas["prec"]["bai"]}}
        for nv in ("mun", "bai"):
            G = R[nv]
            ids = G["ids"]
            o = cm if nv == "mun" else cb
            pos = pos_cm if nv == "mun" else pos_cb
            cols, lo_c, hi_c = {k: [] for k in censo_ids}, {}, {}
            cob_p, cob_d = [], []
            for c in ids:
                v, fx = valores_censo(o, pos[c], esc)
                for k in censo_ids:
                    faixa_ok(k, v.get(k))
                    cols[k].append(v.get(k))
                for k, (lo, hi) in fx.items():
                    lo_c.setdefault(k, [None] * len(ids))
                    hi_c.setdefault(k, [None] * len(ids))
                    j = len(cols[k]) - 1
                    lo_c[k][j], hi_c[k][j] = lo, hi
                cob_p.append(None if v["_cob_p"] >= 0.99995 else 100 * v["_cob_p"])
                cob_d.append(None if v["_cob_d"] >= 0.99995 else 100 * v["_cob_d"])
            if nv == "mun" and any(u != c // 100000 for c, u in zip(ids, G["uf"])):
                raise Falha(f"{sig}: código de município que não começa pelo da UF")
            if nv == "bai" and any(m != c // 1000 for c, m in zip(ids, G["mun"])):
                raise Falha(f"{sig}: código de bairro que não começa pelo do município")
            bloco = {"n": len(ids), "ids": enc_ids(ids), "nomes": G["nomes"],
                     "arcos": G["arcos"], "g": [enc_g(f) for f in G["g"]], "c": {}, "fx": {}, "s": {}}
            for k in censo_ids:
                bloco["c"][k] = confere_col(cols[k], esc[k], f"{sig} {nv} {k}")
            for k in lo_c:            # intervalo do sigilo, só nas unidades que têm
                js = [j for j, x in enumerate(lo_c[k]) if x is not None]
                bloco["fx"][k] = [enc_ids(js), confere_col([lo_c[k][j] for j in js], esc[k], f"{k} mínimo"),
                                  confere_col([hi_c[k][j] for j in js], esc[k], f"{k} máximo")]
            # rendimento puxado por um único setor (o Atlas mostra o valor do IBGE e avisa)
            bloco["atip"] = [[j, *o["renda_atipico"][pos[c]]] for j, c in enumerate(ids) if o["renda_atipico"][pos[c]]]
            bloco["c"]["_cob_p"] = enc_col(cob_p, 10)
            bloco["c"]["_cob_d"] = enc_col(cob_d, 10)
            if nv == "mun":
                pm = [pos_mu[c] for c in ids]
                vp = []
                for c, j in zip(ids, pm):
                    p10 = pop2010[j]
                    p22 = cm["pop"][pos_cm[c]]
                    vp.append(100 * (p22 / p10 - 1) if p10 else None)
                bloco["c"]["var_pop"] = confere_col(vp, esc["var_pop"], f"{sig} var_pop")
                for c in so_mun:
                    d = ind_mu[c["id"]]
                    a = str(d["anos"][-1])
                    if int(a) != c["ano"]:
                        raise Falha(f"{c['id']}: último ano {a}, o catálogo diz {c['ano']}")
                    vals = [d["v"][a][j] for j in pm]
                    for x in vals:
                        faixa_ok(c["id"], x)
                    bloco["c"][c["id"]] = confere_col(vals, c["esc"], f"{sig} {c['id']}")
                    anos = [y for y in d["anos"] if y >= c.get("serie_desde", 0)]
                    if c["serie"] and len(anos) > 1:
                        bloco["s"][c["id"]] = {"a": anos,
                                               "c": [enc_col([d["v"][str(y)][j] for j in pm], c["esc"]) for y in anos]}
            saida[nv] = bloco
        pop_reg = sum(cm["pop"][pos_cm[c]] for c in R["mun"]["ids"])
        pop_ref = censo["niveis"]["reg"]["pop"][censo["niveis"]["reg"]["ids"].index(R["cod"])]
        if pop_reg != pop_ref:
            raise Falha(f"{sig}: municípios somam {pop_reg} e a região tem {pop_ref}")
        arq = DADOS / f"regiao-{sig.lower()}.js"
        texto = ("window.ATLAS2_REGIAO=window.ATLAS2_REGIAO||{};window.ATLAS2_REGIAO[" + json.dumps(sig) + "]=" +
                 json.dumps(saida, ensure_ascii=False, separators=(",", ":")) + ";\n")
        arq.write_text(texto, encoding="utf-8")
        tamanhos[arq.name] = round(arq.stat().st_size / 1e6, 2)
        resumo_reg.append({"sig": sig, "cod": R["cod"], "nome": R["nome"], "geo": R["geo"],
                           "ufs": sorted({u for u in R["mun"]["uf"]}), "n_mun": len(R["mun"]["ids"]),
                           "n_bai": len(R["bai"]["ids"]), "pop": pop_reg,
                           "n_mun_bai": len({m for m in R["bai"]["mun"]})})
        resumo_reg[-1]["mb"] = tamanhos[arq.name]
        print(f"{arq.name}: {tamanhos[arq.name]} MB")

    # ── Brasil: UFs, regiões, comparações, busca ────────────────────────────
    with gzip.open(BD / "br_bd_diretorios_brasil__uf.csv.gz", "rt", encoding="utf-8") as f:
        nome_uf = {int(r["id_uf"]): r["nome"] for r in csv.DictReader(f)}
    comp = {"uf": {}, "reg": {}, "br": {}}
    niveis_c = {"uf": censo["niveis"]["uf"], "reg": censo["niveis"]["reg"], "br": censo["niveis"]["br"]}
    ordem = {"uf": sorted(UF_SIGLA), "reg": [1, 2, 3, 4, 5], "br": [0]}
    for nv, o in niveis_c.items():
        pos = {c: i for i, c in enumerate(o["ids"])}
        linhas = [valores_censo(o, pos[c], esc) for c in ordem[nv]]
        for k in censo_ids:
            comp[nv][k] = [None if v[k] is None else round(v[k], 4) for v, _ in linhas]
        if nv in ("uf", "br"):         # variação da população: Censo 2010 do Atlas Brasil (oficial) e Censo 2022
            p10 = ind_mu["adh_pop"][nv].get("2010", {})
            comp[nv]["var_pop"] = []
            for c, (v, _) in zip(ordem[nv], linhas):
                base = p10.get(str(c)) if nv == "uf" else p10
                comp[nv]["var_pop"].append(round(100 * (v["pop"] / base - 1), 4) if base else None)
    for c in so_mun:
        d = ind_mu[c["id"]]
        a = str(c["ano"])
        for nv in ("uf", "reg"):
            t = d[nv].get(a, {})
            comp[nv][c["id"]] = [t.get(str(k)) for k in ordem[nv]]
        comp["br"][c["id"]] = [d["br"].get(a)]
    for nv in comp:
        for k in list(comp[nv]):
            if all(x is None for x in comp[nv][k]):
                del comp[nv][k]
    # séries de UF, região e Brasil (valores oficiais ou somas), para o gráfico da ficha
    comp_s = {}
    for c in so_mun:
        if not c["serie"]:
            continue
        d = ind_mu[c["id"]]
        anos = [y for y in d["anos"] if y >= c.get("serie_desde", 0)]
        s = {"a": anos, "uf": {}, "reg": {}, "br": {}}
        for y in anos:
            a = str(y)
            for nv in ("uf", "reg"):
                t = d[nv].get(a)
                if t:
                    s[nv][a] = [t.get(str(k)) for k in ordem[nv]]
            if a in d["br"]:
                s["br"][a] = d["br"][a]
        if s["uf"] or s["br"]:
            comp_s[c["id"]] = s
    todos = sorted(pos_cm)
    nome = {}
    for R in malhas["regioes"].values():
        nome.update(zip(R["mun"]["ids"], R["mun"]["nomes"]))
    br = {
        "v": VERSAO, "gerado_em": dt.date.today().isoformat(),
        "fontes": FONTES, "cats": [{"id": c, "n": n} for c, n in CATS], "catalogo": CATALOGO,
        "regioes": resumo_reg,
        "ufs": [{"cod": u, "sigla": UF_SIGLA[u], "nome": nome_uf[u], "r": u // 10, "geo": malhas["uf"][str(u)]["geo"]}
                for u in sorted(UF_SIGLA)],
        "prec": {"uf": malhas["prec"]["uf"]},
        "comp": comp, "comp_s": comp_s,
        "busca": {"ids": todos, "nomes": [nome[c] for c in todos], "uf": [c // 100000 for c in todos]},
        "conferencia": conf,
        "regra": {"cobertura_minima": COB_MIN},
    }
    arq = DADOS / "brasil.js"
    arq.write_text("window.ATLAS2_BR=" + json.dumps(br, ensure_ascii=False, separators=(",", ":")) + ";\n",
                   encoding="utf-8")
    tamanhos[arq.name] = round(arq.stat().st_size / 1e6, 2)
    print(f"{arq.name}: {tamanhos[arq.name]} MB")
    print(json.dumps({"regioes": [{k: r[k] for k in ("sig", "n_mun", "n_bai", "n_mun_bai", "pop")} for r in resumo_reg],
                      "indicadores": len(CATALOGO), "tamanhos_MB": tamanhos}, ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Falha as e:
        print(f"PAROU: {e}", file=sys.stderr)
        sys.exit(1)
