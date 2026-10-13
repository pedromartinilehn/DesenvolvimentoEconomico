# Como fazer as extrações

Passo a passo para atualizar os dados do Atlas e para extrair os que ainda faltam. Vale para a
versão 3.6.

Os dados entram no Atlas por quatro caminhos:

| caminho | quem faz | o que cobre | onde fica o resultado |
|---|---|---|---|
| **1. Automático, no navegador** | a própria página, ao abrir | Atlas Brasil, IDEB, Anatel, áreas de risco, população estimada, PIB, finanças municipais | no navegador de quem abriu, por 30 dias |
| **2. Central de extração, no navegador** | qualquer pessoa, sem instalar nada (*Mais → Extrair dados*) | OpenStreetMap, tabelas do IBGE (SIDRA), matrículas do INEP, amostra do Censo 2010, equipes do CNES e qualquer arquivo nacional com código de município | no navegador de quem extraiu, até ser removido; com *Baixar o Atlas com os dados*, num novo arquivo do Atlas para distribuir |
| **3. Scripts Python** | quem mantém o Atlas | os arquivos `dados/*.js` que vão dentro do pacote: pontos de saúde e escolas, serviços municipais, índices, dados do IPEA e séries do Ipeadata | no pacote, para todos |
| **4. Scripts R e downloads manuais** | quem precisa de um dado que a central ainda não extrai | Censo 2022 por setor, enchente de 2024, RAIS, CAGED e outras consultas da Base dos Dados; também refazem o que a central faz | CSV em `extracao/saida_R/`, que se carrega no Atlas |

Regra que vale para os quatro: **nenhum passo estima, interpola ou completa valor**. Quando a fonte
muda de formato ou deixa de trazer um município, o passo para com erro e diz o que veio. O que a
fonte não traz fica vazio no Atlas.

---

## 1. O que o Atlas atualiza sozinho

Nada a fazer. Ao abrir, a página consulta as fontes que aceitam leitura direta por uma página,
confere cada uma e aplica no mapa o que passar:

| fonte | o que atualiza | por onde |
|---|---|---|
| Atlas Brasil | IDHM 2010, nove indicadores de vulnerabilidade, renda, Gini, pobreza e extrema pobreza | espelho público da Base dos Dados |
| INEP | IDEB da rede pública, edição mais recente | Base dos Dados |
| Anatel | banda larga fixa, último mês publicado | Base dos Dados |
| IBGE e CEMADEN | áreas de risco | Base dos Dados |
| IBGE | população estimada; PIB e valor adicionado | API de agregados do IBGE |
| Tesouro Nacional | receitas, despesas por função e despesa em educação (DCA) | API do SICONFI |

**Onde acompanhar:** *Mais → Dados e fontes*, no quadro "Atualização direta pelas fontes". Cada fonte
aparece como "ao vivo" (com a data da consulta) ou "embarcado". Quando uma fonte falha, o quadro diz
por quê:

- **Sem acesso:** a rede bloqueou ou a fonte não respondeu. Vale o dado embarcado.
- **Sem edição nova:** a fonte ainda traz uma edição anterior à que o Atlas já tem.
- **Recusado na conferência:** a fonte respondeu, mas um teste falhou (um município faltando, uma
  identidade contábil que não fecha, um valor fora da faixa). Nada dela entra.

**Botões:** *Buscar agora* refaz a consulta; *Voltar aos dados embarcados* apaga o que veio das
fontes; a caixa *buscar automaticamente ao abrir* liga ou desliga a busca. Os dados ficam guardados
no navegador por 30 dias e só valem para quem abriu a página naquele computador.

Ficam de fora, porque a fonte não deixa uma página ler direto: Censo (setores e microdados), CNES,
Censo Escolar, SSP/RS, Cadastro Único e Censo SUAS. Para esses, os caminhos 2 e 3.

---

## 2. Extrair pelo navegador, sem instalar nada

Para quem não vai usar R nem Python. Abra o `atlas-rmpa.html` e vá em *Mais → Extrair dados*. Tudo
roda dentro do arquivo do Atlas, no navegador: os arquivos que você soltar não são enviados a
servidor nenhum. Na central, a internet só é usada para as buscas diretas (OpenStreetMap e IBGE) e,
na primeira planilha aberta, para baixar o leitor de planilhas (SheetJS, do cdnjs). O mapa em si
continua precisando de internet para a biblioteca Leaflet, como antes.

### 2.1 Busca direta na fonte

| cartão | o que fazer | o que entra |
|---|---|---|
| Cultura, lazer e espaços públicos | clique em *Buscar no OpenStreetMap* | parques, parquinhos, quadras, centros esportivos, academias ao ar livre, bibliotecas, centros comunitários, teatros, centros culturais, cinemas e centros sociais. Viram uma camada de pontos e quatro indicadores por bairro e município: lugares de lazer, lugares de cultura e os dois por 10 mil habitantes. O OpenStreetMap é colaborativo: o que ninguém mapeou não aparece |
| Qualquer tabela do IBGE por município | procure pelo assunto, escolha a tabela, o período, a variável e as categorias | o valor dos sete municípios, inclusive dos resultados do Censo 2022 já publicados no SIDRA. Valor "-" do IBGE entra como zero; "X" (sigilo) e "..." ficam sem valor |

### 2.2 Arquivo baixado da fonte

Baixe o arquivo no site da fonte (o cartão traz o link) e solte-o no cartão, **sem descompactar**.
O Atlas lê o arquivo aos poucos, sem carregá-lo inteiro na memória, e guarda só as linhas dos sete
municípios. Arquivos grandes, como o do Censo 2010, demoram mais; a barra mostra o andamento.

| cartão | arquivo | o que entra |
|---|---|---|
| Matrículas por etapa e rede | `microdados_censo_escolar_AAAA.zip` do INEP, com o arquivo `microdados_ed_basica_AAAA.csv` dentro (até a edição de 2024; a partir de 2025 o INEP separou as tabelas, e a receita recusa o arquivo dizendo por quê) | 12 indicadores por município: matrículas na educação básica, creche, pré-escola, fundamental, médio e EJA, nas redes pública e privada. Mesmo cálculo do script R `03` |
| Censo 2010 | `RS.zip` e `Documentacao.zip` do IBGE, soltos juntos | os 12 indicadores do script R `01` por município (desocupação por sexo e idade, jovens que não estudam nem trabalham, chefia feminina, idosos que moram sós, deficiência, não naturais e Bolsa Família) e a conferência da renda de 2010 do script `11` (seção 5.2), com a tabela do achado E3 na tela. Antes de calcular, o Atlas confere a soma dos pesos com a população de 2010 do Atlas Brasil, município a município |
| Equipes de saúde | ZIP da base de dados do CNES do mês | o assistente abre o arquivo de equipes e já sugere: contar as equipes ativas (data de desativação vazia), separadas por tipo |
| Qualquer arquivo nacional | CSV, TXT, XLSX, XLS ou ZIP com código de município (Censo SUAS, VIS DATA, CECAD, MUNIC, Novo CAGED, Mapa das OSCs, IVS e outros) | veja abaixo |

**O assistente do arquivo qualquer** faz três perguntas:

1. **Qual coluna tem o código do município.** Ele acha sozinho pelo nome ou pela forma dos valores
   (6 ou 7 dígitos); confira na prévia.
2. **O que fazer com as linhas dos sete municípios:** usar os valores (quando há uma linha por
   município), contar as linhas (escolas, CRAS, organizações) ou somar colunas. A contagem pode ser
   separada por uma coluna de categoria e filtrada ("só as linhas em que...").
3. **Nome da fonte e ano dos dados**, que aparecem no catálogo.

Com colunas de latitude e longitude, as linhas viram uma camada de pontos e uma contagem por bairro.
*Baixar o recorte (CSV)* entrega as linhas dos sete municípios, para conferir ou usar em outro
programa.

### 2.3 Guardar e distribuir

- O que se extrai entra na hora no catálogo e no mapa, e fica guardado **no navegador de quem
  extraiu**, mesmo depois de fechar a página. Some se os dados de navegação do site forem apagados.
  Em *Já extraído*, cada item tem *CSV* e *Remover*.
- **Baixar o Atlas com os dados** gera um novo `atlas-rmpa-com-dados-AAAA-MM-DD.html`, com o Atlas
  inteiro e os dados extraídos dentro. É esse arquivo que se envia: quem o abre vê tudo sem extrair
  de novo, em qualquer computador. Gerar de novo a partir de um arquivo que já tem dados leva os
  antigos e os novos, sem duplicar.
- O botão só funciona no arquivo único (`atlas-rmpa.html`). Na versão em pasta (`index.html`), ele
  avisa e não gera.

### 2.4 O que a central não faz

- Não estima, não interpola e não completa: município sem linha no arquivo fica sem valor, e não
  zero. Os indicadores do Censo 2010 entram como referência histórica.
- Não alcança fontes que só abrem com login ou por FTP, como o BigQuery da Base dos Dados (RAIS,
  CAGED por consulta) e o FTP do DATASUS: para essas, use os scripts R da seção 5.
- Não divide valor municipal entre bairros. Na central, dado por bairro só entra quando o arquivo
  traz coordenadas (vira contagem de pontos por bairro). Um CSV já organizado por bairro, com o nome
  do bairro, carrega-se em *Mais → Dados e fontes* (seção 7.1).

---

## 3. Preparar a máquina

Use um computador com acesso normal à internet. Redes corporativas costumam bloquear alguns dos
servidores da tabela da seção 5. Os comandos deste guia partem da pasta **`atlas_v3/`** (a que tem
`index.html`); os scripts Python precisam ser rodados dali.

**Os scripts R rodam de qualquer pasta.** Cada um acha a pasta do Atlas pelo próprio local e grava
o resultado em `atlas_v3/extracao/saida_R/`. Há dois jeitos de rodar:

- **No RStudio:** abra o script numerado (por exemplo, `extracao/R/01_censo2010_areas_ponderacao.R`)
  e clique em **Source**, no canto de cima do editor. Rode o script inteiro: linha a linha (*Run*),
  o R não sabe onde o arquivo está, e só funciona com a pasta de trabalho em `atlas_v3/`. O
  `_comum.R` não se roda: os scripts numerados o carregam sozinhos. Pelo *Source*, o `10` abre uma
  janela para escolher o arquivo baixado, e o `09` pergunta o projeto do Google Cloud no console. O
  `03` e o `05` usam 2024, e o `04`, o mês de dois meses atrás; para outra edição, use o terminal.
- **No terminal** (Prompt de Comando, PowerShell ou o *Terminal* do RStudio): entre na pasta
  `atlas_v3` (`cd` seguido do caminho da pasta) e rode `Rscript extracao/R/<script>.R`, com os
  argumentos da tabela da seção 5. No Windows, se o terminal não reconhecer `Rscript`, use o
  caminho completo, como `"C:\Program Files\R\R-4.4.1\bin\Rscript.exe"` (troque pela versão
  instalada).

Para os trechos de R escritos à mão neste guia (as receitas da seção 5.1), a pasta de trabalho
precisa ser a `atlas_v3/`. No RStudio: *Session → Set Working Directory → Choose Directory...* e
escolha a pasta `atlas_v3`. Confira com `file.exists("index.html")`, que deve dar `TRUE`.

**Python 3.10 ou mais novo**, com:

```bash
pip install pandas pyarrow openpyxl shapely
```

**R 4.2 ou mais novo** (para os scripts R). Instale os pacotes uma vez:

```bash
Rscript extracao/R/00_instala_pacotes.R
```

Ele instala do CRAN os pacotes das fontes (`censobr`, `geobr`, `aopdata`, `educabR`,
`microdatasus`, `osmdata`, `bigrquery`, `sidrar`) e os de apoio (`arrow`, `dplyr`, `sf`, `readxl`,
`data.table` e outros), e do GitHub o `rsiconfi`.
Precisa de acesso a `cloud.r-project.org` e `github.com`. No Linux, o `sf` precisa das bibliotecas
GDAL, GEOS e PROJ do sistema (no Ubuntu: `sudo apt install libgdal-dev libgeos-dev libproj-dev`).

---

## 4. Atualizar os dados que vão dentro do pacote (Python)

Rode nesta ordem. Cada script imprime o que fez; leia a saída antes de passar ao seguinte.

### 4.1 Unidades de saúde (CNES)

```bash
python3 extracao/2_atualiza_cnes.py
```

Baixa do geobr (cerca de 100 MB) o arquivo do CNES de abril de 2026, já georreferenciado. Quando o
geobr publicar uma competência mais nova, o arquivo `healthfacilities_AAAAMM.parquet` aparece na
página de *releases* do repositório `ipea/geobr_prep_data` no GitHub. Baixe-o e passe-o ao script:

```bash
python3 extracao/2_atualiza_cnes.py --arquivo healthfacilities_202609.parquet
```

A competência gravada no Atlas sai do nome do arquivo. Se o arquivo tiver outro nome, informe:
`--competencia 202609`.

**Confira na saída:**

- quantas unidades de saúde, quantas comunidades terapêuticas e residenciais e quantas centrais
  de regulação ficaram de fora;
- a **lista de unidades de acesso restrito**. São as que estão em presídios e unidades
  socioeducativas, marcadas pelo nome. Se aparecer uma que não é, ou faltar uma que é, ajuste a
  expressão `RESTRITO` no início do script;
- se aparecer `tipos sem regra: [...]`, o CNES passou a trazer um tipo de estabelecimento novo.
  Decida em qual grupo ele entra (`TIPOS`, `ACOLHIMENTO` ou `DESCARTADOS`) e rode de novo.

Para só reaplicar as regras ao arquivo de pontos atual, sem baixar nada:
`python3 extracao/2_atualiza_cnes.py --reclassificar`.

### 4.2 Escolas (Censo Escolar)

```bash
python3 extracao/3_atualiza_escolas.py
python3 extracao/3_atualiza_escolas.py --arquivo schools_2026.parquet   # edição mais nova
```

O ano gravado sai do nome do arquivo (`schools_AAAA`); se não sair, use `--ano 2026`.

Os dois scripts guardam agora o código CNES e o código INEP de cada ponto. É isso que permite ligar
depois as matrículas e as equipes de saúde (seção 5).

### 4.3 Serviços e finanças municipais

```bash
python3 extracao/1_servicos_municipais.py
```

Lê o SICONFI (despesas por função, receitas), o arquivo de indicadores criminais da SSP/RS e conta
os pontos de saúde e escolas por município e por bairro. **Rode depois de 4.1 e 4.2**, porque conta
os pontos que eles gravaram.

O arquivo da SSP/RS muda de endereço a cada publicação. Quando sair um ano novo, copie no site da
SSP/RS o link da planilha anual de indicadores criminais por município e troque o `SSP_URL` no início
do script. Se a planilha mudar de leiaute, o script para e mostra o que encontrou.

### 4.4 Base dos Dados e índices sintéticos

```bash
python3 extracao/5_base_dos_dados.py
python3 extracao/4_indices_municipais.py
```

O primeiro baixa do espelho público da Base dos Dados (sem conta) o Atlas Brasil, o IDEB, a Anatel
e as áreas de risco, e deixa o arquivo do Atlas Brasil em `extracao/fontes/basedosdados/`. O
segundo lê esse arquivo para o IDHM e as planilhas de IVS e IDESE que você baixar (seção 6). Por
isso o `5` roda antes do `4`.

Se o `4` disser que uma coluna não existe, ele mostra as colunas reais do arquivo. Corrija o nome em
`extracao/indices.json` e rode de novo; não é preciso mexer no código.

### 4.5 Dados do IPEA

```bash
python3 extracao/6_ipea.py
```

Lê no mesmo espelho da Base dos Dados o Atlas do Desenvolvimento Humano (1991, 2000 e 2010) e o
Acesso a Oportunidades de 2019 (só Porto Alegre), confere as duas tabelas e grava
`dados/dados-ipea.js`. Se uma conferência falhar (por exemplo, se a Base dos Dados corrigir a escala
do tempo mínimo), o script para e diz qual. O que foi conferido e o que os dados mostram estão em
[`ANALISE-IPEA.md`](ANALISE-IPEA.md).

### 4.6 Séries do Ipeadata

```bash
python3 extracao/7_ipeadata.py
python3 extracao/7_ipeadata.py --temas "emprego,educação"     # só alguns temas
python3 extracao/7_ipeadata.py --incluir COD1,COD2             # só algumas séries
```

Lê na API pública do Ipeadata (`www.ipeadata.gov.br/api/odata4`, sem chave) os valores dos sete
municípios em todas as séries e grava `dados/dados-ipeadata.js`. Só usa a biblioteca padrão do Python.

- Primeiro confere os sete municípios na tabela de territórios e acha o nome do nível municipal.
- Tenta baixar os valores por município, em sete consultas. Se a API recusar esse filtro, consulta
  série a série, o que leva mais tempo. As respostas ficam guardadas por sete dias em
  `extracao/fontes/ipeadata/`, e uma nova rodada não baixa de novo (`--sem-cache` força).
- Cada série entra no ano mais recente em que os sete municípios têm valor. As que ficam de fora vão
  para `extracao/fontes/ipeadata/inventario.csv`, com o motivo.
- Se o Python reclamar do certificado HTTPS, use `--base http://www.ipeadata.gov.br/api/odata4`.

### 4.7 Gerar o arquivo único e conferir

```bash
python3 build_single.py
python3 -m http.server 8000
```

Abra `http://localhost:8000/index.html` e confira em *Mais → Dados e fontes* e em
*Mais → Diagnóstico regional*. O `atlas-rmpa.html` regerado é o arquivo único para distribuir.

---

## 5. Extrair o que falta (scripts R)

Cada script confere colunas e municípios antes de calcular e grava o resultado em
`extracao/saida_R/`. Os comandos abaixo partem de `atlas_v3/`; no RStudio, abra o script e clique em
*Source* (seção 3):

| script | comando | servidor que precisa estar liberado | o que sai | entra no Atlas como |
|---|---|---|---|---|
| 01 Censo 2010 por área de ponderação | `Rscript extracao/R/01_censo2010_areas_ponderacao.R` | github.com (baixa cerca de 1 GB na primeira vez) | desocupação por sexo e idade, jovens que não estudam nem trabalham, chefia feminina, idosos que moram sós, deficiência, não naturais, Bolsa Família | **direto**: `censo2010_complemento_municipios.csv` (município) e `censo2010_complemento_setores2022.csv` (setor). Por município, a central faz o mesmo sem R (seção 2.2) |
| 02 Censo 2022 | `Rscript extracao/R/02_censo2022_setores_e_amostra.R` | github.com, apisidra.ibge.gov.br | entorno dos domicílios por setor (pavimentação, iluminação, calçada, arborização); lista das tabelas da amostra no SIDRA | **direto**: `censo2022_entorno_setores.csv` (setor). As colunas vêm com o código da variável do IBGE; o significado está em `censobr::data_dictionary(year = 2022, dataset = "tracts")` |
| 03 Matrículas | `Rscript extracao/R/03_censo_escolar_matriculas.R 2024` | download.inep.gov.br | matrículas por etapa, por escola e por município | **depois de ajustar** (receita A). A central faz o mesmo sem ajuste (seção 2.2) |
| 04 Equipes de saúde | `Rscript extracao/R/04_cnes_equipes.R 2026 4` | ftp.datasus.gov.br (FTP, porta 21) | equipes por unidade e por município, por tipo | **depois de ajustar** (receita B). A central conta as equipes ativas por tipo a partir do ZIP do CNES baixado no site (seção 2.2) |
| 05 Despesa em educação | `Rscript extracao/R/05_siconfi_educacao.R 2024` | apidatalake.tesouro.gov.br | despesa empenhada por subfunção | **direto** (município). O Atlas já busca isso sozinho; use se o navegador não alcançar o SICONFI |
| 06 Mobilidade (só Porto Alegre) | `Rscript extracao/R/06_mobilidade_aopdata.R` | github.com | acesso a empregos, saúde e escolas por transporte público, por hexágono | os dados de 2019 **já estão no Atlas** desde a 3.5, pelo `extracao/6_ipea.py` (ver `docs/ANALISE-IPEA.md`) |
| 07 Enchente de 2024 | `Rscript extracao/R/07_enchente_2024.R` | zenodo.org, github.com | área alagada por setor | **direto**: `enchente2024_setores.csv` (setor) |
| 08 Cultura e lazer | `Rscript extracao/R/08_osm_cultura_lazer.R` | overpass-api.de | parques, quadras, bibliotecas e outros pontos do OpenStreetMap (11 tipos) | a central busca o mesmo com um clique e cria a camada de pontos (seção 2.1) |
| 09 RAIS, CAGED, SISVAN, Bolsa Família, MEI | `Rscript extracao/R/09_basedosdados_bigquery.R <id-do-projeto>` | BigQuery, com projeto do Google Cloud | um CSV por consulta, por município e ano | **depois de ajustar** (receita C) |
| 10 Arquivo baixado à mão | `Rscript extracao/R/10_recorta_arquivo_baixado.R <arquivo>` | nenhum | as linhas dos sete municípios | depende do arquivo (seção 6). A central faz o recorte sem R (seção 2.2) |
| 11 Conferência da renda de 2010 | `Rscript extracao/R/11_confere_renda_2010.R` | github.com | pobreza, renda e Gini de 2010 calculados de três jeitos | **não se carrega**: é a conferência do achado E3 (seção 5.2). A central refaz a mesma conta com o `RS.zip` (seção 2.2) |

O `09` pede, na primeira vez, autorização da conta Google no navegador e um projeto do Google
Cloud com faturamento ativo. A consulta é gratuita dentro da cota mensal.

### 5.1 Receitas para os arquivos que precisam de ajuste

O Atlas recusa arquivo com mais de uma linha por território, porque a segunda linha apagaria a
primeira sem aviso. Estes três trazem uma linha por município **e** por categoria; deixe uma só.
Rode no R, com a pasta de trabalho em `atlas_v3/` (no RStudio, *Session → Set Working Directory*;
ver seção 3):

**A. Matrículas (script 03): só a rede pública**

```r
d <- data.table::fread("extracao/saida_R/censo_escolar_2024_matriculas_municipios.csv")
data.table::fwrite(d[rede == "publica"], "extracao/saida_R/matriculas_2024_rede_publica.csv")
```

**B. Equipes de saúde (script 04): uma coluna por tipo de equipe**

```r
d <- data.table::fread("extracao/saida_R/cnes_equipes_202604_municipios.csv")
d[, tipo := paste0("equipes_", TIPO_EQP)]
l <- data.table::dcast(d, CODUFMUN + municipio ~ tipo, value.var = "equipes", fill = 0)
data.table::fwrite(l, "extracao/saida_R/equipes_202604_por_tipo.csv")
```

Aqui `fill = 0` não inventa dado: o arquivo conta todas as equipes ativas, e um tipo que não
aparece num município tem zero equipes ali. O nome de cada tipo está na tabela `equipe` do pacote
microdatasus.

**C. RAIS, CAGED e demais consultas do script 09: um ano só**

```r
d <- data.table::fread("extracao/saida_R/bd_rais_vinculos.csv")
data.table::fwrite(d[ano == 2023], "extracao/saida_R/rais_vinculos_2023.csv")
```

No CAGED, que vem por mês, escolha também o mês (`d[ano == 2025 & mes == 12]`), ou some o ano antes.

### 5.2 Conferência da pobreza de 2010 (script 11)

A auditoria (achado E3) mostrou que a pobreza e o Gini de 2010 calculados pelo Atlas ficam acima
dos publicados pelo Atlas Brasil. O script 11 refaz a conta de três jeitos:

- **A:** renda ausente conta como zero;
- **B:** renda ausente fica de fora;
- **C:** como B, sem pensionistas, empregados domésticos e seus parentes (o universo do Atlas Brasil).

Leia o `confere_renda_2010.csv` assim: se a versão A reproduz os números do Atlas e a B ou a C
reproduz os do Atlas Brasil, a causa está confirmada. Nesse caso, os indicadores de 2010 do Atlas
precisam ser recalculados pela versão que reproduz o Atlas Brasil. Esse recálculo mexe em
`dados/dados-estimados.js` (seção 7.2). Envie o CSV para quem mantém o Atlas.

---

## 6. O que se baixa à mão

Estas fontes não têm pacote nem API aberta. Baixe na página da fonte e solte o arquivo na central
de extração (seção 2.2), que recorta, conta ou soma sem R. Para recortar pelo R:

```bash
Rscript extracao/R/10_recorta_arquivo_baixado.R ~/Downloads/arquivo_nacional.csv
```

O script acha sozinho a coluna do código do município (com 6 ou 7 dígitos). Se não achar, lista as
colunas para você indicar: `... arquivo.csv cod_ibge`. Para planilha com várias abas, informe a aba:
`... arquivo.xlsx cod_ibge Municipios`. O recorte sai em `extracao/saida_R/recorte_<nome>.csv`, com o
nome do município na primeira coluna, que é por onde o Atlas casa o arquivo. Se o arquivo trouxer
vários anos, deixe um só antes de carregar (receita C da seção 5.1).

| dado | onde baixar | depois do recorte |
|---|---|---|
| Cadastro Único e Bolsa Família por município | VIS DATA e CECAD, do Ministério do Desenvolvimento Social (consulta na web, com exportação) | uma linha por município: carrega direto. Por bairro ou por CRAS, o dado **não é público**: depende de termo de cooperação com cada prefeitura |
| CRAS, CREAS, Centro POP, recursos humanos | Censo SUAS, do mesmo Ministério (Vigilância Socioassistencial) | vem uma linha **por unidade**: conte por município antes (`d[, .N, by = municipio]`) |
| Organizações da sociedade civil | Mapa das OSCs, do IPEA (página "Base de dados"; CSV de cerca de 330 MB) | uma linha por organização: conte por município, ou leve como camada de pontos (seção 7.2) |
| Conselhos, fundos e planos municipais | MUNIC, do IBGE (planilhas por edição) | uma linha por município: carrega direto |
| IVS | ivs.ipea.gov.br, base de municípios | **não recorte**: salve em `extracao/fontes/` com nome que comece por `ivs` e rode o `4_indices_municipais.py` |
| IDESE | dee.rs.gov.br, planilha por município | salve em `extracao/fontes/` com nome que comece por `idese` e rode o `4` |
| IFDM | firjan.com.br | idem, com nome que comece por `firjan`; ligue a fonte no `indices.json`. Confira os termos de uso antes de redistribuir |

---

## 7. Como o resultado entra no Atlas

### 7.1 Carregar o CSV na tela (qualquer pessoa, na hora)

1. Abra o Atlas e vá em *Mais → Dados e fontes*.
2. Arraste o CSV para a área "Carregar um arquivo seu", ou clique em *escolher arquivo*.
3. O Atlas avisa quantos valores casaram e quantos indicadores criou. Os indicadores novos aparecem
   em *Visão Geral*, marcados como "arquivo do usuário".

O Atlas decide sozinho o nível de cada arquivo:

- com coluna `code_tract` ou `cd_setor`, vai para o nível **setor**;
- com coluna `municipio`, ou só com o código IBGE (`id_municipio`, `code_muni`, `CODUFMUN`), vai
  para o nível **município**;
- nos demais casos, para o nível que está na tela (por exemplo, bairro, se a coluna for `bairro`).

Colunas de código (`code_muni`, `id_municipio`, `code_weighting`, `TIPO_EQP`...) e a coluna `ano` não
viram indicador. Se o arquivo tiver um só ano, ele vira o ano do indicador; sem coluna `ano`, o
indicador aparece como "s/ ano". Colunas de texto (como `rede`) são ignoradas.

**Limite:** o que se carrega fica só naquela aba do navegador. Ao recarregar a página, some. Serve
para olhar, comparar e exportar, não para distribuir. Para ficar no pacote, veja 7.2.

### 7.2 Integrar ao pacote (quem mantém o Atlas)

Para que um dado novo fique no `atlas-rmpa.html` de todos, ele precisa entrar num arquivo de
`dados/`, ganhar uma linha no catálogo de indicadores do `atlas.js` (nome, unidade, fonte, ano,
nível) e passar pelo `build_single.py`. É o que foi feito com os dados da Base dos Dados pelo
`5_base_dos_dados.py`. Casos que só se resolvem assim:

- **hexágonos de mobilidade (06):** feito na 3.5 pelo `extracao/6_ipea.py` para os dados de 2019.
  Cada setor recebe o hexágono que contém o seu ponto representativo, e o bairro recebe a média dos
  setores ponderada pela população;
- **pontos do OpenStreetMap (08) e das OSCs:** a central de extração já cria a camada e a leva no
  arquivo baixado (seção 2.3). Para que fique no pacote de todos, vira camada embarcada, como as de
  saúde e escolas;
- **matrículas e equipes por unidade (03 e 04):** ligam-se aos pontos do mapa pelo código INEP e
  pelo código CNES. Os pontos embarcados hoje ainda não têm esses códigos; eles chegam na próxima
  vez que os scripts 4.1 e 4.2 rodarem;
- **recálculo dos indicadores de 2010 (11):** regera `dados/dados-estimados.js`.

---

## 8. Quando algo dá errado

| mensagem ou sintoma | o que quer dizer | o que fazer |
|---|---|---|
| `faltam as colunas ... Colunas disponíveis: ...` | a fonte mudou o nome de uma variável | procure no dicionário da fonte o nome novo e ajuste o script. Não troque por uma variável parecida sem conferir |
| `sem dados para <município>` | a fonte não trouxe um dos sete municípios | não complete. Confira se é falha da fonte ou do filtro, e espere a correção da fonte |
| `Falta o pacote '...'` | pacote R não instalado | `Rscript extracao/R/00_instala_pacotes.R` |
| `Rode os scripts a partir da pasta atlas_v3/` | mensagem dos scripts até a versão 3.5: o `_comum.R` foi rodado com a pasta de trabalho fora de `atlas_v3/` | o `_comum.R` não se roda sozinho. Abra um script numerado e rode-o inteiro, com a pasta de trabalho em `atlas_v3/` (seção 3). Ou use os scripts da 3.5.1, que acham a pasta sozinhos |
| `Este arquivo não se roda sozinho` | o `_comum.R` foi rodado direto | abra um script numerado (por exemplo, o `01`) e clique em *Source* |
| `Não achei a pasta do Atlas` | o script foi rodado linha a linha, ou foi tirado da pasta `extracao/R/` | rode o script inteiro (*Source*), sem tirá-lo da pasta `extracao/R/` |
| `cannot open the connection`, logo no começo | script de até a versão 3.5 rodado de fora da pasta `atlas_v3/` | escolha a pasta `atlas_v3` em *Session → Set Working Directory*, ou use os scripts da 3.5.1 |
| erro de conexão, *timeout*, `403` | a rede bloqueou o servidor | confira o servidor na tabela da seção 5 e rode em outra rede |
| acentos trocados nos CSVs (Windows) | R antigo, sem UTF-8 nativo | use R 4.2 ou mais novo; os scripts gravam sempre em UTF-8 |
| `Informe a competência do arquivo` (CNES) ou `Informe o ano` (escolas) | o nome do arquivo não diz a edição | passe `--competencia AAAAMM` ou `--ano AAAA` |
| "aparece em 2 linhas", ao carregar no Atlas | o CSV tem mais de uma linha por território | use as receitas da seção 5.1 |
| "Nenhuma linha casou com um território" | os nomes ou códigos não batem com os do Atlas | confira a grafia (acentos e caixa não importam) ou use o código IBGE |
| central de extração: "Não achei o arquivo ..." ou "Faltam arquivos" | o ZIP solto não é o da fonte esperada, ou falta um dos dois do Censo 2010 | confira o nome do arquivo no cartão; no Censo 2010, solte `RS.zip` e `Documentacao.zip` juntos |
| central de extração: "A soma dos pesos (V0010) não reproduz a população de 2010" | o leiaute lido não corresponde ao arquivo de microdados | use o `Documentacao.zip` da mesma pasta do IBGE que o `RS.zip`. O Atlas não calcula nada nesse caso |
| central de extração: "Nenhuma linha dos sete municípios" | a coluna escolhida não tem o código IBGE do município | escolha, na prévia, a coluna com códigos de 6 ou 7 dígitos (4314902 é Porto Alegre) |
| central de extração: "O OpenStreetMap não respondeu" ou "O IBGE não respondeu" | a fonte está fora do ar ou a rede bloqueou o endereço | tente de novo mais tarde, ou em outra rede |
| central de extração: "este navegador não descompacta arquivos" | navegador antigo | use Chrome, Edge, Firefox ou Safari atualizados |
| fonte "Recusado na conferência", em *Dados e fontes* | a fonte respondeu com dado que não passou num teste | nada a fazer na hora: vale o dado embarcado. Se persistir, a fonte mudou de formato e o extrator do `atlas.js` precisa de ajuste |

Mais contexto sobre cada fonte (o que é, por que falta, alternativas) em
[`EXTRACAO-dados-faltantes.md`](EXTRACAO-dados-faltantes.md). Os erros encontrados nos dados e o
que foi corrigido estão em [`AUDITORIA-DADOS-v3.2.md`](AUDITORIA-DADOS-v3.2.md).
