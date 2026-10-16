# Bases do Atlas Brasil no Atlas Metropolitano

Outubro de 2026, versão 3.9 do Atlas.

A biblioteca do Atlas do Desenvolvimento Humano no Brasil (PNUD, IPEA e FJP),
<https://www.atlasbrasil.org.br/acervo/biblioteca>, publica bases que o Atlas Metropolitano não
tinha. Este documento faz três coisas:

- analisa os cinco arquivos recebidos e diz o que cada um traz e para que nível geográfico;
- mostra o que entrou no Atlas e como foi conferido;
- explica como trazer versões novas dessas bases, pelo navegador ou pelo script.

## 1. O que veio

| arquivo | o que é | nível geográfico | anos |
|---|---|---|---|
| `adh_radar_base_2012_2024.xlsx` | **Radar IDHM**: o IDHM e outros 78 indicadores (IDHM ajustado à desigualdade, longevidade, educação, renda, pobreza, desigualdade e população), calculados pela Fundação João Pinheiro com a PNAD Contínua. Abas Total, Sexo e Cor; as abas com "B" no nome repetem as outras célula a célula | Brasil, 5 grandes regiões, 27 UFs e 21 regiões metropolitanas. **Não há município** | 2012 a 2024 |
| `adh_radar_metadados_2012_2024.xlsx` | dicionário do Radar: 81 siglas com definição, fórmula, unidade, casas decimais, polaridade (se maior é melhor), fontes e notas | — | — |
| `censo_metadados_1991_2010.xlsx` | dicionário dos indicadores do Censo: 216 siglas, com dimensão, definição e unidade | município, UF, RM, macrorregião e Brasil | 1991, 2000 e 2010 |
| `reg_adm_metadados_2013_2017.xlsx` | dicionário dos **registros administrativos**: 78 siglas. Por dimensão: educação 28 (IDEB, distorção idade-série, evasão, docentes), saúde 16 (mortalidade por homicídio, trânsito e suicídio, pré-natal), renda 13 (PIB per capita, Bolsa Família, BPC), vulnerabilidade 7 (Cadastro Único), participação política 6, habitação 5 (SNIS), meio ambiente 2 e população 1 | município e outros recortes | 2013 a 2017 |
| `dados_pa.zip` | dois arquivos .rar da RM de Porto Alegre. Um traz as bases **UDH** (722 UDHs em 34 municípios, 237 colunas), **REGIONAL** (as 17 regiões de Porto Alegre) e **20 RMs**, mais o dicionário (247 siglas). O outro traz os shapefiles das UDHs, das regiões e da RM (WGS 84) | UDH, região de Porto Alegre e RM | 2000 e 2010 |

### “Indicadores mais recentes”: o que existe de fato

- **Município.** Nenhum dos arquivos traz IDHM municipal depois de 2010. O IDHM do município
  continua sendo o dos Censos de 1991, 2000 e 2010.
- **Radar IDHM.** Vai até 2024, mas para a RM de Porto Alegre inteira, com 34 municípios. A PNAD
  Contínua é uma pesquisa por amostra e não tem valor por município.
- **Registros administrativos.** São municipais, de 2013 a 2017, mas só o dicionário veio. A planilha
  com os valores não estava entre os arquivos. Quando for baixada, o cartão "Atlas Brasil" da
  central de extração a lê (seção 5).
- **UDH.** É o recorte mais fino: 483 UDHs nos sete municípios, com os Censos de 2000 e 2010.

## 2. O que entrou no Atlas

O `extracao/11_atlas_brasil.py` lê os cinco arquivos e grava `dados/dados-atlasbrasil.js`
(419 KB), que o `build_single.py` embute no `atlas-rmpa.html`. Ele abre os .rar com a libarchive do
sistema.

| onde | o quê |
|---|---|
| **Mapa, nível UDH** (botão novo, entre Bairro e Setor) | 483 UDHs com 53 indicadores do Censo 2010. Na ficha de cada UDH aparece o valor de 2000 da mesma UDH embaixo do de 2010, além da região de Porto Alegre e do município |
| **Mesmo indicador em dois níveis** | 33 indicadores do Atlas Brasil que o Atlas já tinha por município ganharam o nível UDH: IDHM e componentes, renda, pobreza, mortalidade, educação, trabalho, moradia e vulnerabilidade. O IDHM de 2000 também vale para a UDH. A fonte de cada nível aparece no selo |
| **Indicadores só da UDH** | 20 indicadores: população, razão de dependência e envelhecimento (65+), fecundidade, renda do quinto mais pobre, parte da renda que vem do trabalho, rendimento dos ocupados, atividade, analfabetismo (também no município), superior e médio completos, creche e escola (0 a 5 e 15 a 17 anos), fundamental completo aos 15 a 17 anos, água encanada, banheiro, coleta de lixo, energia elétrica, domicílios sem ninguém com fundamental e meninas de 10 a 17 anos com filhos |
| **Contas do Atlas** | na UDH, a variação do IDHM e a variação real da renda per capita de 2000 a 2010. No município: o número de UDHs, o menor e o maior IDHM e a população em UDHs de IDHM abaixo de 0,700 (as faixas média, baixa e muito baixa do Atlas Brasil) |
| **Diagnóstico regional** | tabela "Desenvolvimento humano dentro dos municípios" (seção 8) e a aba **Contexto metropolitano**. A aba traz o Radar IDHM da RM de 2012 a 2024, a RM comparada com o RS e o Brasil, os recortes por sexo e por cor, a posição entre as 21 RMs do Radar e entre as 20 RMs dos Censos, e as 17 regiões de Porto Alegre. Tem 2 gráficos e exporta para CSV e para o Word |
| **Metodologia, Fontes, busca e exportação** | seção do Atlas Brasil na Metodologia; três fontes novas; busca de UDH pelo nome; CSV do nível UDH |

Alguns números que só aparecem com as bases novas:

- **Desigualdade dentro dos municípios (2010).** Em Porto Alegre, o IDHM das UDHs vai de 0,593 a
  0,958. Nos sete municípios, 583.947 pessoas (24,2%) moravam em UDHs de IDHM abaixo de 0,700. A
  parte é maior em Sapucaia do Sul (34,5%) e menor em Guaíba (18,1%).
- **RM de Porto Alegre no Radar (2024).** IDHM de 0,831. A RM é a 8ª entre as 21 RMs do Radar no
  IDHM, a 3ª na menor proporção de pobres e a 17ª no IDHM Educação. Em 2024, 2,49% eram pobres na
  RM, contra 2,29% no RS e 6,54% no Brasil.
- **Por cor (2024).** IDHM de 0,857 entre brancos e 0,777 entre negros na RM. A renda per capita é
  R$ 1.415,88 entre brancos e R$ 859,21 entre negros, em reais de agosto de 2010.
- **Regiões de Porto Alegre (2010).** O IDHM vai de 0,935 no Centro a 0,638 no Nordeste.

## 3. Conferências

O script e a central fazem as mesmas conferências e param sem gravar nada se uma falhar.

- **UDHs.** As 722 UDHs da base são as do shapefile, nos dois anos, e cada uma está no município certo.
- **População.** Em 2010, a população das UDHs (PESOTOT) soma exatamente a população de cada
  município publicada pelo Atlas Brasil, que o Atlas já tinha em `dados-ipea.js`. Em 2000, a diferença
  é de até 22 pessoas.
- **IDHM.** Em todas as linhas (as 722 UDHs nos dois anos, as regiões, as RMs e cada ano do Radar), o
  IDHM é a média geométrica dos três subíndices. Cada subíndice confere com o indicador de que sai:
  - longevidade com a esperança de vida;
  - renda com a renda per capita;
  - educação com a frequência e a escolaridade.
- **Somas.** Cada região de Porto Alegre soma a população das suas UDHs, e a RM soma as UDHs das 34
  cidades.
- **Mesmo indicador, dois níveis.** Somar as UDHs, ponderando cada taxa pelo seu denominador, chega
  perto do valor do município, mas não o reproduz. O Atlas Brasil calcula as UDHs e os municípios em
  separado, e cada nível do Atlas mostra o número publicado para ele. Em cada célula abaixo: a soma
  das UDHs · o valor do município.

| município | renda per capita (R$) | pobres (%) | extremamente pobres (%) | 18+ com fundamental (%) | analfabetismo 15+ (%) |
|---|---|---|---|---|---|
| Porto Alegre | 1.756,34 · 1.758,27 | 3,87 · 3,82 | 1,10 · 0,92 | 74,78 · 74,78 | 2,27 · 2,27 |
| Canoas | 952,13 · 952,13 | 4,37 · 4,40 | 1,12 · 0,93 | 64,61 · 64,57 | 2,62 · 2,61 |
| Gravataí | 734,79 · 737,29 | 5,41 · 5,39 | 1,55 · 1,54 | 61,04 · 61,11 | 3,20 · 3,20 |
| Sapucaia do Sul | 730,88 · 733,28 | 4,96 · 4,94 | 1,28 · 1,27 | 58,77 · 58,86 | 3,33 · 3,33 |
| Cachoeirinha | 838,66 · 844,04 | 3,98 · 3,91 | 1,41 · 1,39 | 65,78 · 65,99 | 2,94 · 2,94 |
| Guaíba | 746,81 · 758,83 | 6,34 · 6,44 | 1,65 · 1,49 | 60,46 · 59,96 | 3,83 · 3,83 |
| Esteio | 952,38 · 955,86 | 4,32 · 4,53 | 1,76 · 1,32 | 65,13 · 64,60 | 2,65 · 2,65 |

  A extrema pobreza é a que mais se afasta: em Esteio, 1,76% somando as UDHs contra 1,32% no município.
- **Mapeamento das siglas.** Os indicadores municipais que ganharam o nível UDH foram ligados pela
  sigla e pela definição nos metadados. Dez deles foram comparados pela soma ponderada das UDHs, que
  fica perto do valor do município, como na tabela acima:
  - renda per capita, pobreza, extrema pobreza e vulnerabilidade à pobreza;
  - fundamental completo (18 anos ou mais) e médio completo (18 a 20 anos);
  - densidade (mais de 2 por dormitório) e água e esgoto inadequados;
  - jovens que não estudam nem trabalham;
  - dependência de idosos.

  Os de definição parecida foram separados pelo texto dos metadados. Por exemplo,
  "T_NESTUDA_NTRAB_MMEIO" é o percentual sobre todos os jovens de 15 a 24 anos, que é o indicador
  municipal do Atlas. Já "T_VULNERA_NESTUDA_NTRAB_MMEIO" é o percentual só entre os vulneráveis.
- **Unidade da renda.** O dicionário do censo diz "Em mil Reais de 01/08/2010", mas os valores estão em
  reais. A renda per capita de Porto Alegre em 2010 é R$ 1.758,27 no Atlas Brasil municipal. O Atlas
  grava a unidade em reais e guarda o texto original.
- **Geometria.** O shapefile foi simplificado para a tela, de 34.707 para 20.516 pontos. A área de
  cada UDH muda no máximo 2% (ou 2.000 m², nas UDHs pequenas).
- **Navegador igual ao script.** O cartão da central, com os mesmos arquivos, produz exatamente o que o
  script grava:
  - geometria idêntica nas 483 UDHs;
  - 51.198 valores das UDHs, 1.802 das regiões, 2.120 das RMs e 10.257 do Radar;
  - as 361 siglas do dicionário.

## 4. Pelo navegador ou pelo script

### Pelo navegador (Mais → Extrair dados → cartão "Atlas Brasil")

1. Baixe a base na biblioteca do Atlas Brasil.
2. Solte o arquivo no cartão. Pode soltar vários de uma vez: planilhas .xlsx ou .csv, shapefile
   (.shp e .dbf) ou um .zip com eles.
3. O Atlas reconhece cada tabela pelo cabeçalho:

| cabeçalho | o que é | o que vira |
|---|---|---|
| `UDH_Atlas`, `NOME_UDH`, `ANO` | base de UDHs | nível UDH do mapa (com o shapefile, ou com a geometria que já está no Atlas para as mesmas UDHs) |
| `Cod_Reg`, `NOME_REG`, `ANO` | base das regiões de Porto Alegre | ficha da UDH e Contexto metropolitano |
| `CODRM`, `NOME_RM`, `ANO` | base das RMs | Contexto metropolitano |
| `ANO`, `AGREGACAO`, `CODIGO`, `NOME` (e `SEXO` ou `COR`) | base do Radar IDHM | Contexto metropolitano |
| `SIGLA` e nome | metadados ou dicionário | nome, unidade, definição e polaridade das siglas |
| código de município (`Codmun7`, `CODMUN6`, `cod_ibge`…) e siglas | base municipal, como a dos registros administrativos | um indicador municipal por sigla, com série quando há vários anos |

4. Ele faz as conferências da seção 3, mostra o resultado e só então oferece **Pôr no Atlas**.
5. Cada parte vira um item da central: dicionário, UDHs, regiões, RMs, Radar e cada base municipal.
   Uma base nova troca só a parte que trouxe. Os itens ficam guardados no navegador, e **Baixar o
   Atlas com os dados** gera um arquivo único com tudo dentro, para distribuir.

O navegador não abre .rar. O `dados_pa.zip` traz dois .rar. Extraia no computador (7-Zip, WinRAR ou
The Unarchiver) e solte aqui as planilhas e o shapefile de dentro, ou use o script. A planilha .xlsx
é lida sem biblioteca externa e funciona sem internet. Arquivos .xls e .ods precisam ser salvos como
.xlsx antes.

### Pelo script

```bash
cd atlas_v3
pip install openpyxl                       # uma vez
# arquivos da biblioteca em extracao/fontes/atlasbrasil/ (pasta não versionada)
python3 extracao/11_atlas_brasil.py        # grava dados/dados-atlasbrasil.js
python3 build_single.py                    # embute no atlas-rmpa.html
```

O script aceita o `dados_pa.zip` como vem da biblioteca e abre os .rar com a libarchive do sistema
(Linux e macOS). No Windows, extraia os dois .rar na mesma pasta e rode de novo: o script procura
primeiro os arquivos já extraídos.

## 5. Base municipal e registros administrativos

O cartão trata qualquer base com código de município e siglas do Atlas Brasil, como a planilha dos
registros administrativos de 2013 a 2017.

- **Do cabeçalho.** As colunas cujo nome é uma sigla dos dicionários viram indicadores municipais
  (`ab_<sigla>`). Colunas de identificação (código, nome, UF, coordenadas) ficam de fora.
- **Do dicionário.** Saem o nome, a unidade, a polaridade e a categoria (pela dimensão). Nos
  registros administrativos, sai também a fonte de cada sigla: INEP, DATASUS, Ministério da
  Cidadania etc.
- **Com coluna de ano.** O indicador ganha a série. O mapa mostra o ano mais recente com os sete
  municípios, e o painel mostra a série.

A planilha dos registros administrativos não estava entre os arquivos recebidos. Por isso esse
caminho foi testado com uma tabela no mesmo formato, montada com os valores municipais do Atlas
Brasil que o pacote já tem (IDHM, renda per capita, esperança de vida e analfabetismo de 1991, 2000 e
2010). As quatro séries saíram iguais às do pacote.

## 6. Limites

- **Recortes e anos diferentes.** A UDH foi desenhada sobre os setores do Censo 2010; o bairro e o setor
  do Atlas são de 2022. Os números de um nível não se comparam diretamente com os do outro.
- **2000 nas UDHs de 2010.** A base traz as mesmas UDHs nos dois anos. Em 2000, 20 das 483 UDHs não têm
  IDHM e ficam sem valor, sem variação.
- **Radar ≠ Censo.** O Radar é amostral e da RM inteira. Em 2020 e 2021 usa a quinta visita da PNAD
  Contínua. O Atlas não junta a série do Radar à dos Censos.
- **Regiões de Porto Alegre.** Os nomes são os das 17 Regiões do Orçamento Participativo. O Atlas usa
  os dados da base REGIONAL e a região de cada UDH (do shapefile das UDHs). A malha das regiões não
  é desenhada no mapa.
- **Nomes como na fonte.** Por exemplo, "RM Grande Vitória (MG)" na base das 20 RMs; o Radar escreve
  "(ES)".
- **RAR.** O navegador não abre .rar (seção 4).

## 7. Arquivos usados

Recebidos em 15/10/2026. O script grava o tamanho e o SHA-256 completo de cada um em
`dados-atlasbrasil.js` (campo `arquivos`).

| arquivo | papel | bytes | SHA-256 |
|---|---|---|---|
| `dados_pa.zip` | RM de Porto Alegre (dois .rar) | 3.108.835 | `ce05763ce970e4ba…` |
| `RM 64300 Porto Alegre - Base UDH 2000_2010.xlsx` | base UDH (dentro do .rar) | 2.242.557 | `9334c2cc8d34a042…` |
| `RM 64300 Porto Alegre - Base REGIONAL 2000_2010.xlsx` | base das regiões | 67.676 | `aa968e789ac80039…` |
| `A - Base 20 RMs 2000_2010.xlsx` | base das RMs | 82.455 | `f06b981ff6c780d3…` |
| `A - DICIONÁRIO dos indicadores do Atlas.xlsx` | dicionário da base | 31.653 | `cecf0ad8f0017bd6…` |
| `RM_PortoAlegre_UDH_region.shp` e `.dbf` | shapefile das UDHs | 1.343.856 e 87.524 | `64ebb2ba2b642e9c…` e `9bbc13f98e856977…` |
| `adh_radar_base_2012_2024.xlsx` | Radar IDHM | 3.847.457 | `0e92237b49410e56…` |
| `adh_radar_metadados_2012_2024.xlsx` | metadados do Radar | 99.490 | `e79b639a491e0298…` |
| `censo_metadados_1991_2010.xlsx` | metadados do censo | 32.234 | `b273991a54b2dc4b…` |
| `reg_adm_metadados_2013_2017.xlsx` | metadados dos registros administrativos | 26.781 | `2e3f705bb1ee20c7…` |
