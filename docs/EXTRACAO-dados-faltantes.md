# Dados faltantes do Atlas: como extrair cada um

Outubro de 2026 · Atlas versão 3.3, atualizado na 3.5 e na 3.8

> **Na versão 3.5, a central de extração do Atlas (*Mais → Extrair dados*) faz pelo navegador, sem
> R e sem instalar nada,** o que os scripts `01` (no nível município), `03`, `08`, `10` e `11` fazem,
> e conta as equipes de saúde por município a partir do ZIP da base do CNES. Também busca qualquer
> tabela do IBGE no SIDRA. O resultado fica no navegador e pode ser levado num novo arquivo do Atlas
> (*Baixar o Atlas com os dados*). Passo a passo em
> [COMO-FAZER-AS-EXTRACOES.md](COMO-FAZER-AS-EXTRACOES.md), seção 2.
>
> **Desde a versão 3.3, o Atlas busca sozinho, pelo navegador, as fontes da seção 1 e também a
> população estimada, o PIB e as finanças municipais (SICONFI), inclusive a despesa em educação.**
> Para essas fontes não é mais preciso rodar script nem gerar arquivo; os scripts seguem úteis
> para gerar um retrato embarcado (uso sem internet). Ver `atlas_v3/LEIA-ME.md`.

> **Na versão 3.8, os arquivos do pacote censobr (IPEA) no GitHub passaram a abrir neste ambiente.**
> Com eles entraram no arquivo do Atlas, prontos:
>
> - o B2, os indicadores do Censo 2010 por município;
> - o B3, o entorno dos domicílios do Censo 2022;
> - os campos de domicílio e de óbitos do Censo 2022 por setor que o catálogo previa;
> - a conferência da renda de 2010 (achado E3).
>
> O que entrou e o que continua de fora, com o motivo, está em
> [EXTRACOES-NO-HTML.md](EXTRACOES-NO-HTML.md).

Este documento responde, item por item, de onde vem cada dado que ainda falta no Atlas e como
extraí-lo, de preferência com pacotes R. A numeração (B1 a B15) é a da
[análise do template de diagnóstico](DIAGNOSTICO-REGIONAL-analise-do-template.md).

Regra mantida em todo o trabalho: nenhum valor foi estimado, interpolado ou completado. O que a
fonte não traz fica fora do Atlas, com aviso.

## 1. O que já entrou no Atlas nesta rodada

O ambiente de trabalho bloqueia os servidores do IBGE, do Tesouro, do DATASUS, do gov.br, do CRAN
e as *releases* do GitHub do IPEA. Mas a **Base dos Dados** mantém um espelho público de arquivos
CSV no Google Cloud Storage, que não exige conta, e esse espelho está acessível. O script novo
[`atlas_v3/extracao/5_base_dos_dados.py`](../atlas_v3/extracao/5_base_dos_dados.py) baixa dali só os
arquivos gratuitos (nunca os `_bdpro`, que são do plano pago):

| Dado | Fonte original | Tabela no espelho | Nível | Cobre |
|---|---|---|---|---|
| IDHM, IDHM Renda, Educação e Longevidade, esperança de vida | Atlas Brasil (PNUD, IPEA, FJP), 2010 | `mundo_onu_adh.municipio` | município | B14, em parte |
| Pessoas vulneráveis à pobreza; jovens de 15 a 24 anos que não estudam, não trabalham e são vulneráveis; mães chefes de família sem fundamental com filho menor de 15 anos; pessoas vulneráveis dependentes de idosos; vulneráveis que levam mais de uma hora até o trabalho; desocupação de 18 a 24 anos; creche de 0 a 3 anos; crianças de 4 e 5 anos fora da escola; mães de 15 a 17 anos | Atlas Brasil, Censo 2010 | `mundo_onu_adh.municipio` | município | B2, em parte |
| IDEB dos anos iniciais, dos anos finais e do ensino médio, rede pública | INEP, 2023 | `br_inep_ideb.municipio` | município | B5, complemento |
| Acessos de banda larga fixa por 100 habitantes | Anatel, junho de 2024 | `br_anatel_banda_larga_fixa.densidade_municipio` | município | B10 |
| Áreas de risco BATER (movimento de massa, inundação, enxurrada) | IBGE e CEMADEN, base 2010, via geobr | `br_geobr_mapas.area_risco_desastre` | camada do mapa | B9, em parte |

Conferências feitas antes de integrar:

- O IDHM bate com os valores oficiais conhecidos: Porto Alegre 0,805, Canoas 0,750, Gravataí 0,736,
  Sapucaia do Sul 0,726, Cachoeirinha 0,757, Guaíba 0,730, Esteio 0,754.
- A densidade da Anatel no espelho é **por 100 habitantes**: o valor do Brasil em dezembro de 2018
  é 14,98, o que corresponde a cerca de 31 milhões de acessos para 208 milhões de pessoas. Os
  documentos de planejamento da Anatel usam a densidade **por 100 domicílios** (cerca de 50% em
  2021); a ficha do indicador avisa que as duas medidas não se comparam.
- Áreas BATER só existem para municípios monitorados pelo CEMADEN: 18 em Porto Alegre e 7 em
  Sapucaia do Sul. A ausência de polígono nos outros cinco **não** quer dizer ausência de risco.

O que ficou **de fora** por não passar na conferência:

- **Acesso a Oportunidades (IPEA) de 2019**, também no espelho (`br_ipea_acesso_oportunidades`). Os
  tempos mínimos até saúde e escola não respeitam os limites documentados pelo IPEA (valor infinito
  acima de 90 minutos a pé e de 120 minutos de transporte público): há valores finitos acima
  desses limites, e a unidade não pôde ser confirmada. O script R `06_mobilidade_aopdata.R` busca a
  versão oficial direto do pacote do IPEA.

  **Resolvido na versão 3.5.** A tabela do espelho traz o tempo mínimo multiplicado por 100.
  Dividido por 100, ele concorda com os indicadores cumulativos do próprio IPEA em todos os 73.449
  testes; sem a divisão, só em 4.810. O `extracao/6_ipea.py` refaz essa conferência a cada execução
  e para se ela falhar. Os dados entraram por bairro e por setor de Porto Alegre, com a série
  1991–2010 do Atlas do Desenvolvimento Humano. Ver [ANALISE-IPEA.md](ANALISE-IPEA.md).

No Atlas, os novos indicadores aparecem nas categorias de pobreza, vulnerabilidade, trabalho,
educação, saúde, desenvolvimento humano e ambiente urbano. Também aparecem no painel
*Mais → Diagnóstico regional*, que ganhou duas tabelas: "Juventude, famílias e vulnerabilidade" e
"Educação e desenvolvimento humano". As áreas de risco são uma camada nova no quadro *Camadas*.

## 2. Scripts R para o que depende de servidores bloqueados aqui

Pasta [`atlas_v3/extracao/R/`](../atlas_v3/extracao/R/). Rode numa máquina com acesso normal à
internet, no terminal a partir da pasta `atlas_v3/` ou no RStudio, abrindo o script e clicando em
*Source* (os scripts acham a pasta do Atlas sozinhos):

```
Rscript extracao/R/00_instala_pacotes.R
Rscript extracao/R/01_censo2010_areas_ponderacao.R
...
```

Cada script confere colunas e municípios antes de calcular e **para com erro** se a fonte mudou de
formato, mostrando o que veio. As saídas vão para `atlas_v3/extracao/saida_R/` (não versionada).

Como foram verificados: os códigos de variável, nomes de função e argumentos foram conferidos no
código-fonte dos próprios pacotes (censobr 1.0.0, microdatasus 3.0.0, educabR 1.2, rsiconfi, aopdata,
geobr). Todos passam na checagem de sintaxe do R. O cálculo do script do Censo 2010 foi testado com
microdados sintéticos e conferido com uma conta independente: desocupação feminina, idosos que
moram sozinhos e chefia feminina deram os mesmos valores, até a quarta casa decimal. O script de
recorte foi testado com uma base nacional real (SNIS, 119 mil linhas, recortadas para as 182 dos sete
municípios). **Nenhum deles foi executado contra a fonte real neste ambiente**, porque os servidores
estão bloqueados aqui.

| Item | Dado | Pacote R e função | Servidor que precisa estar acessível | Script |
|---|---|---|---|---|
| B2 | Desocupação por sexo e idade, jovens que não estudam nem trabalham (todos), chefia feminina, idosos que moram sós, pessoas com deficiência, não naturais do município, Bolsa Família/PETI; por área de ponderação, 2010 | `censobr::read_population(year = 2010, columns = ...)` | github.com (releases `ipea/censobr_prep_data`) | `01_censo2010_areas_ponderacao.R`. **No Atlas desde a 3.8**, por município, pelo `10_censo2010_amostra.py` |
| B3 | Entorno dos domicílios por setor (pavimentação, iluminação, calçada, arborização, rampa), Censo 2022 | `censobr::read_tracts(year = 2022, dataset = "Entorno")` | github.com | `02_censo2022_setores_e_amostra.R`. **No Atlas desde a 3.8**, pelo `9_censo2022_setores.py` |
| B3 | Resultados da amostra de 2022 (trabalho, rendimento, deslocamento, família) por município | `sidrar::search_sidra()` e `sidrar::get_sidra()` | apisidra.ibge.gov.br | `02_…` (lista as tabelas) |
| B3 | Amostra de 2022 por área de ponderação | microdados de **acesso controlado**: pedir em microdados.ibge.gov.br e importar com `censobr::import_microdata22()` | microdados.ibge.gov.br | `02_…` (instruções) |
| B5 | Matrículas por etapa (creche, pré-escola, fundamental, médio, EJA) por escola, com código INEP | `educabR::get_censo_escolar(year, uf = "RS")` | download.inep.gov.br | `03_censo_escolar_matriculas.R` |
| B6 | Equipes de saúde por unidade e por município | `microdatasus::fetch_datasus(..., information_system = "CNES-EP")` | ftp.datasus.gov.br | `04_cnes_equipes.R` |
| B14 | Despesa em educação e por subfunção (fundamental, médio, infantil, EJA) | `rsiconfi::get_dca(year, annex = "I-E", entity = ...)` | apidatalake.tesouro.gov.br | `05_siconfi_educacao.R` (ou o `1_servicos_municipais.py`, que já faz o mesmo) |
| B8 | Acesso a empregos, saúde e escolas por transporte público (só Porto Alegre) | `aopdata::read_access(city = "poa", mode = "public_transport", year = 2019)` | github.com (releases `ipeaGIT/aopdata`) | `06_mobilidade_aopdata.R` (os dados de 2019 já estão no Atlas desde a 3.5, pelo `6_ipea.py`) |
| B9 | Mancha da enchente de maio de 2024 sobre os setores | Zenodo, registro 11185049 (IPH/UFRGS), mais `geobr::read_census_tract(year = 2022)` | zenodo.org, github.com | `07_enchente_2024.R` |
| B13 | Parques, praças, quadras, bibliotecas, centros comunitários, teatros | `osmdata::opq()` e `osmdata_sf()` | overpass-api.de | `08_osm_cultura_lazer.R` |
| B7 | Vínculos formais (RAIS) e saldo de empregos (CAGED) por município | BigQuery da Base dos Dados (`bigrquery`), conjuntos `br_me_rais` e `br_me_caged` | bigquery.googleapis.com, com projeto do Google Cloud | `09_basedosdados_bigquery.R` |
| Auditoria | Conferência da renda, pobreza e Gini de 2010 (achado E3 de [AUDITORIA-DADOS-v3.2.md](AUDITORIA-DADOS-v3.2.md)) | `censobr::read_population(year = 2010)` | github.com | `11_confere_renda_2010.R`. **Feita na 3.8** pelo `10_censo2010_amostra.py`: o cálculo do Atlas está certo |
| B11 | Registros do SISVAN por município | BigQuery da Base dos Dados, `br_ms_sisvan` | idem | `09_…` |
| B1, B7 | Bolsa Família (pagamentos) e MEI | BigQuery da Base dos Dados (`br_cgu_beneficios_cidadao`, `br_me_cnpj`): o script lista as tabelas para escolher | idem | `09_…` |

Antes de cada consulta ao BigQuery, o script `09` confere no `INFORMATION_SCHEMA` se a tabela e as
colunas existem. Se não existirem, ele lista o que há e pula a consulta.

## 3. O que não tem pacote nem API aberta

Baixe na página da fonte e solte o arquivo na central de extração do Atlas (*Mais → Extrair dados*,
cartão "Qualquer arquivo nacional"), ou recorte para os sete municípios com
`Rscript extracao/R/10_recorta_arquivo_baixado.R <arquivo>`. Os dois acham sozinhos a coluna do
código do município.

| Item | Dado | Onde | Observação |
|---|---|---|---|
| B1 | Cadastro Único e Bolsa Família por município | VIS DATA e CECAD (MDS) | consulta na web com exportação. Por bairro ou por CRAS **não é público**: depende de termo de cooperação com as prefeituras. A API do Portal da Transparência traz pagamentos e exige chave gratuita |
| B4, B15 | CRAS, CREAS, Centro POP, equipes e gestão municipal | Censo SUAS (MDS, área de Vigilância Socioassistencial) | não confirmei o endereço atual do download nacional; o portal de dados do Recife republica as bases de 2024 (CRAS, CREAS, RH, dicionário) |
| B12 | Organizações da sociedade civil | Mapa das OSCs (IPEA), página "Base de dados" | CSV nacional de cerca de 330 MB, atualizado todo mês, com dicionário |
| B15 | Conselhos, fundos e planos municipais | MUNIC (IBGE) | planilhas por edição |
| B8 | Linhas e paradas de ônibus de Porto Alegre | GTFS da EPTC no portal de dados abertos de Porto Alegre | a última versão listada no MobilityDatabase cobre setembro a dezembro de 2025; não há GTFS metropolitano publicado pela Metroplan |
| B9 | Setorização de risco geológico | Serviço Geológico do Brasil (RIGeo e GeoSGB) | Porto Alegre tem arquivo vetorial de 2013 no RIGeo e um relatório de atualização de 2022 no site da Defesa Civil municipal |
| B14 | IVS, IDESE e IFDM | IPEA, DEE/RS e FIRJAN | planilhas para `extracao/fontes/`, lidas pelo `4_indices_municipais.py`. O IFDM tem termos de uso próprios |

## 4. Como os resultados voltam para o Atlas

As saídas dos scripts R são tabelas por município, por área de ponderação, por setor ou por ponto.
A integração segue o caminho que o Atlas já usa:

- **por município**: os valores entram em `dados-complementares.js` (o `5_base_dos_dados.py` pode ser
  estendido para ler `extracao/saida_R/`), e cada indicador ganha uma linha no catálogo do
  `atlas.js`;
- **por área de ponderação (2010)**: mesmo método dos indicadores de 2010 que o Atlas já tem. Cada
  setor de 2022 recebe o valor da sua área de ponderação, e no município vale o número calculado
  para o município inteiro. Desde a versão 3.4, o script `01` já grava os dois arquivos prontos;
- **por setor (2022, enchente)**: entram como colunas novas de `dados-setores.js` e se somam por
  bairro e por bolsão como as demais;
- **por ponto (escolas, unidades de saúde, OSM, OSC)**: viram camada nova ou se ligam às camadas
  existentes pelo código INEP ou CNES. Atenção: a auditoria de outubro de 2026 mostrou que as escolas
  e as unidades de saúde do mapa **não guardam esses códigos**. Desde a versão 3.4, os scripts
  `3_atualiza_escolas.py` e `2_atualiza_cnes.py` guardam o código; basta rodá-los de novo antes de
  ligar matrículas (B5) ou equipes (B6). Ver [AUDITORIA-DADOS-v3.2.md](AUDITORIA-DADOS-v3.2.md).

Desde a versão 3.5, a central de extração leva os resultados para um novo arquivo do Atlas, sem
mexer no pacote (*Baixar o Atlas com os dados*). Desde a versão 3.4, boa parte das saídas dos
scripts R carrega direto no Atlas, em *Mais → Dados e fontes*: o
Atlas reconhece o nível pelo código do setor ou pelo município e ignora as colunas de código. O passo
a passo de cada script, com o que carrega direto e o que precisa de ajuste antes, está em
[COMO-FAZER-AS-EXTRACOES.md](COMO-FAZER-AS-EXTRACOES.md).

## 5. Fontes consultadas

Pacotes, conferidos no código-fonte (GitHub):
[censobr](https://github.com/ipeaGIT/censobr) ·
[microdatasus](https://github.com/rfsaldanha/microdatasus) ·
[educabR](https://github.com/SidneyBissoli/educabR) ·
[rsiconfi](https://github.com/tchiluanda/rsiconfi) ·
[aopdata](https://github.com/ipeaGIT/aopdata) ·
[geobr](https://github.com/ipeaGIT/geobr).

Dados e páginas:

- [Base dos Dados](https://basedosdados.org/) e o espelho público usado aqui:
  `https://storage.googleapis.com/basedosdados-public/one-click-download/`.
- [IBGE: População em áreas de risco no Brasil](https://www.ibge.gov.br/geociencias/informacoes-ambientais/estudos-ambientais/21538-populacao-em-areas-de-risco-no-brasil.html).
- [IBGE: Censo 2022, Deslocamentos para trabalho e estudo](https://biblioteca.ibge.gov.br/visualizacao/livros/liv102210.pdf)
  e o [calendário de divulgações da amostra](https://www.ibge.gov.br/novo-portal-destaques/44424-ibge-divulgara-em-9-de-outubro-de-2025-censo-demografico-2022-deslocamentos-para-trabalho-e-para-estudo-resultados-preliminares-da-amostra.html).
- [Banco de dados das cheias na Região Hidrográfica do Lago Guaíba, maio de 2024 (Zenodo)](https://zenodo.org/records/11185049).
- [SGB, RIGeo: delimitação de áreas de risco de Porto Alegre](https://rigeo.sgb.gov.br/handle/doc/19424.1?locale=en)
  e o [relatório SGB de 2022 na Defesa Civil de Porto Alegre](https://prefeitura.poa.br/sites/default/files/usu_doc/sites/defesa-civil/Relat%C3%B3rio_SGB__PortoAlegre.pdf).
- [Mapa das OSCs: base de dados](https://mapaosc.ipea.gov.br/base-dados).
- [GTFS de Porto Alegre no MobilityDatabase](https://mobilitydatabase.org/feeds/gtfs/mdb-7).
- [Censo Socioassistencial 2024 republicado pelo Recife](https://dados.recife.pe.gov.br/dataset/censo-socioassistencial-2024).
