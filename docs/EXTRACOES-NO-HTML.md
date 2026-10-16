# Como as extrações entram no HTML

Outubro de 2026, versão 3.9 do Atlas.

O Atlas é um arquivo só, o `atlas-rmpa.html`. Um dado está no Atlas para todo mundo quando está
dentro desse arquivo. Até a versão 3.7, várias bases só entravam depois de alguém rodar uma
extração:

- um script em Python ou em R;
- a central de extração, e aí o dado ficava só no navegador de quem extraiu.

Este documento explica os três caminhos pelos quais um dado entra no HTML e como levar uma extração
nova para dentro. Depois mostra, item por item, o que passou para dentro na 3.8 e o que continua
fora, e por quê.

## 1. Três caminhos para dentro do HTML

| caminho | quem faz | onde o dado fica | quem vê |
|---|---|---|---|
| **1. Arquivo de dados do pacote** (`dados/*.js`) | um script em `extracao/`, depois o `build_single.py` | dentro do `atlas-rmpa.html` | todos |
| **2. Pacote de extrações** (`dados/dados-extracoes.js`) | um script que grava o resultado no formato da central | dentro do `atlas-rmpa.html` | todos; a central mostra o item como "no pacote do Atlas" |
| **3. Central de extração** (*Mais → Extrair dados*) | qualquer pessoa, no navegador | no navegador de quem extraiu; com *Baixar o Atlas com os dados*, num novo arquivo do Atlas | quem extraiu e quem recebe o arquivo novo |

### 1.1 Arquivo de dados do pacote

É o caminho dos dados de base, os que entram em muitos indicadores, em vários níveis (setor,
bairro, município) ou que precisam de conta do próprio Atlas, como somas por bairro e avisos de
soma parcial.

1. Um script em `extracao/` lê a fonte, confere o que leu e grava `dados/<nome>.js`, que define um
   objeto global: `window.ATLAS_<NOME>={...}`.
2. O `index.html` carrega o arquivo: uma tag `<script defer src="dados/<nome>.js">` e o nome nas
   listas `ARQS` e `GLOBAIS` do carregador.
3. O `build_single.py` embute o arquivo no `atlas-rmpa.html`: o nome na lista `ARQS` e a marca
   `ATLAS_<NOME>=` na conferência final, que impede gerar o arquivo único sem ele.
4. O `atlas.js` liga os campos. Cada indicador ganha uma linha no catálogo (`ind({...})`, com
   fonte, ano, nível e nota). Os valores entram nos territórios: setor (`garanteSetores`), bairro e
   município (`montaGeo`, `fontesDoMunicipio`).

Exemplos: `dados/dados-censo2022.js`, gravado pelo `extracao/9_censo2022_setores.py` (3.8), e
`dados/dados-atlasbrasil.js`, gravado pelo `extracao/11_atlas_brasil.py` (3.9).

- **Formato:** usa o formato compacto do pacote, o mesmo de `dados-setores.js`. As colunas estão
  na ordem dos setores, dos bairros e dos municípios do pacote.
- **Conferência:** o script lê esse formato para conferir os setores com o que o Atlas já tinha
  antes de gravar qualquer coisa.

### 1.2 Pacote de extrações

É o caminho dos resultados que a central de extração já sabe produzir. O pacote leva a extração
pronta, e a central continua podendo refazê-la com os arquivos originais.

- **Item:** cada extração da central produz um item, um objeto com tudo o que entrou (formato
  abaixo).
- **Na central:** os itens ficam guardados no navegador. *Baixar o Atlas com os dados* embute
  todos num bloco `ATLAS_EXTRAIDOS` do novo arquivo.
- **No pacote:** o item tem o mesmo formato, mas é gerado por script e gravado em
  `dados/dados-extracoes.js`, que define `window.ATLAS_PACOTE=[item, ...]`.
- **Ao abrir:** o Atlas aplica esses itens com o mesmo código que aplica uma extração do navegador
  (`xtAplica`). Uma extração mais nova do mesmo item, feita no navegador ou embutida, vale por cima.
- **Exemplo da 3.8:** o item `censo2010_amostra`, gravado pelo `extracao/10_censo2010_amostra.py`.
  É igual ao que o cartão "Censo 2010" produz com o RS.zip do IBGE.

Campos de um item:

| campo | o que é |
|---|---|
| `id` | identificador único do item. Um item novo com o mesmo `id` substitui o anterior |
| `titulo`, `resumo` | nome e resumo mostrados na lista *Já extraído* |
| `ano`, `status` | ano de referência e situação: `ok` (dado oficial), `est` (cálculo ou referência histórica) ou `ext` (não oficial) |
| `origem`, `quando` | arquivo ou endereço de onde veio e data e hora da extração |
| `pacote` | `true` nos itens gravados por script para o pacote |
| `fonte` | `{n, s, u, d}`: nome, selo curto, endereço e descrição da fonte |
| `fontesExtra` | opcional: fontes próprias de alguns indicadores (o cartão do Ipeadata usa para mostrar a fonte original de cada série) |
| `indicadores` | lista no formato do catálogo: `id`, `cat`, `n`, `u`, `fmt`, `ramp`, `niveis`, `status`, `obs` e, se houver, `ano` e `serie` (anos para a tabela do painel) |
| `valores` | `{municipio: {código IBGE: {id: valor}}, bairro: {id do bairro: {id: valor}}}` |
| `pontos` | opcional: `{chave, itens: [{nome, x, y, ...}], cor, rot}`, para uma camada de pontos |
| `atlasbr` | opcional, nos itens do cartão "Atlas Brasil": as partes `udh`, `regional`, `rms`, `radar` e `dic`, no mesmo formato de `dados/dados-atlasbrasil.js`. O Atlas troca só a parte que veio (`abAplica`) |
| outros | o item pode levar o que a sua tela precisar: o do Censo 2010 leva `e3` (a conferência da renda) e `ap` (a tabela por área de ponderação) |

O script 10 troca só o próprio item. Outros scripts podem acrescentar itens ao mesmo arquivo, desde
que façam o mesmo.

### 1.3 Central de extração e o Atlas com os dados

O passo a passo está em [`COMO-FAZER-AS-EXTRACOES.md`](COMO-FAZER-AS-EXTRACOES.md), seção 2.
Na 3.8, o que já vem no pacote não é copiado de novo no bloco do arquivo baixado, porque já está
no arquivo. Por isso *Baixar o Atlas com os dados* só gera um arquivo novo quando há alguma
extração feita no navegador.

### 1.4 Como levar uma extração nova para dentro do HTML

1. **Escreva o script.** Ele fica em `extracao/`, lê a fonte e confere o que leu: os sete
   municípios, as faixas de valor, as somas. Se algo não bater, ele para com uma mensagem e não
   grava nada. Nunca completa valor ausente.
2. **Escolha o caminho.**
   - Dado de base: grave `dados/<nome>.js`, registre-o no `index.html` e no `build_single.py` e
     ligue os campos no `atlas.js`.
   - Resultado no formato da central: grave o item em `dados/dados-extracoes.js`, trocando só o
     item de mesmo `id`.
3. **Gere e confira.** Rode `python3 build_single.py`. Depois confira em *Mais → Dados e fontes*,
   em *Mais → Metodologia* e no painel de um município.

## 2. O que estava fora e onde está agora

### Entrou na 3.9: bases do Atlas Brasil

As bases da biblioteca do Atlas Brasil entram pelos dois caminhos. No pacote, vêm por
`dados/dados-atlasbrasil.js`, gravado pelo `extracao/11_atlas_brasil.py`. No navegador, pelo cartão
"Atlas Brasil" da central, que lê os mesmos arquivos e produz o mesmo resultado. O detalhe está em
[`ATLAS-BRASIL-bases.md`](ATLAS-BRASIL-bases.md).

| item | antes | agora |
|---|---|---|
| UDHs (Unidades de Desenvolvimento Humano), Censos 2000 e 2010 | não existia | nível UDH no mapa: 483 UDHs, 53 indicadores de 2010 e o valor de 2000 na ficha; 33 indicadores municipais do Atlas Brasil ganharam o nível UDH |
| Desigualdade dentro do município | não existia | número de UDHs, menor e maior IDHM e população em UDHs de IDHM abaixo de 0,700, por município e na região |
| Radar IDHM (PNAD Contínua), 2012 a 2024 | não existia | aba "Contexto metropolitano" do Diagnóstico: RM de Porto Alegre, RS, Brasil, sexo, cor e posição entre as 21 RMs |
| RM de Porto Alegre entre as 20 RMs e as 17 regiões de Porto Alegre (Censos 2000 e 2010) | não existia | a mesma aba e a ficha da UDH |
| Taxa de analfabetismo de 15 anos ou mais (Atlas Brasil, 2010) | estava em `dados-ipea.js`, sem indicador | indicador no município e na UDH |

### Entrou na 3.8

| item | antes | agora | de onde vem |
|---|---|---|---|
| Censo 2022 por setor: domicílios particulares e coletivos, casa de vila ou em condomínio, cortiço, estrutura degradada, banheiro de uso comum, sem água encanada e óbitos de homens e de mulheres | 11 indicadores no catálogo, sem dado (não apareciam) | por setor, bairro e município | `9_censo2022_setores.py` |
| Densidade domiciliar | no catálogo, sem dado | domicílios particulares por km² | cálculo do Atlas sobre o item acima |
| Só sanitário ou buraco para dejeções | não existia | indicador novo, componente do percentual sem banheiro | `9_censo2022_setores.py` |
| Entorno dos domicílios, Censo 2022 (item B3): pavimentação, iluminação, calçada, rampa, árvores, bueiro, obstáculo na calçada, ponto de ônibus, ciclovia | fora (só pelo script R 02, que não rodava aqui) | 10 indicadores por setor, bairro e município | `9_censo2022_setores.py` |
| Censo 2010, amostra (item B2): desocupação por sexo e idade, jovens que não estudam nem trabalham, chefia feminina, idosos que moram sós, deficiência, não naturais do município, Bolsa Família ou PETI | só pela central (RS.zip do IBGE) ou pelo script R 01 | 12 indicadores por município; a tabela por área de ponderação sai em CSV no cartão "Censo 2010" | `10_censo2010_amostra.py` (pacote de extrações) |
| Conferência da renda de 2010 (achado E3) | pendente | feita; resultado em *Mais → Metodologia*, no cartão "Censo 2010" e na [auditoria](AUDITORIA-DADOS-v3.2.md) | `10_censo2010_amostra.py` |
| IDHM de 2000 | só Porto Alegre (IBGE Cidades) | os sete municípios | série do Atlas Brasil que já estava no pacote; o valor de Porto Alegre é o mesmo do IBGE Cidades |

Duas correções vieram junto. Os dois percentuais usavam componentes que não estavam no pacote e
por isso saíam menores:

- **"Percentual de casas"** passa a contar a casa de vila ou em condomínio. Subiu de 0,2 a 3,7
  pontos por município; na região, foi de 61,3% para 63,9%.
- **"Percentual sem banheiro de uso exclusivo"** passa a contar o banheiro de uso comum e o só
  sanitário. Foi de 0% para 0,1% a 0,4% nos municípios e chega a 2,7% no bairro Arquipélago.

O que mudou na conferência da renda de 2010 está na seção E3 da auditoria. Em resumo: o cálculo do
Atlas está certo e os números ficam.

### Continua fora

A fonte não abre no ambiente em que o pacote é montado. Quando o servidor estiver acessível, cada
item entra por um dos caminhos abaixo.

| item | por que ficou fora | como entra |
|---|---|---|
| Despesa em educação (SICONFI) | API do Tesouro bloqueada aqui | o Atlas busca ao vivo, no navegador de quem abre; ou `1_servicos_municipais.py` |
| IFDM, IDESE e IVS | sites da Firjan, do DEE/RS e do IPEA bloqueados; não há espelho | planilhas em `extracao/fontes/`, lidas pelo `4_indices_municipais.py`. O IFDM tem termos de uso próprios |
| Bolsa Família atual (pagamentos) e Cadastro Único | MDS, CGU e Ipeadata bloqueados; no espelho da Base dos Dados não há a tabela gratuita | cartão do Ipeadata na central ou `7_ipeadata.py`; arquivos do VIS DATA e do CECAD no cartão "Qualquer arquivo nacional". O Bolsa Família declarado no Censo 2010 já entrou |
| Mortes por homicídio, suicídio e trânsito (DATASUS) | DATASUS e Ipeadata bloqueados; o SIM do espelho só tem o total de óbitos | cartão do Ipeadata ou `7_ipeadata.py` |
| Matrículas do INEP (item B5) | INEP bloqueado; a sinopse do espelho da Base dos Dados é do plano pago (`_bdpro`), que o projeto não usa | cartão do INEP na central; script R 03 |
| Equipes do CNES (item B6) | DATASUS bloqueado; o espelho da Base dos Dados não tem a tabela de equipes (leitos e habilitações estão lá, mas só no plano pago) | cartão do CNES na central; script R 04 |
| Cultura e lazer do OpenStreetMap (item B13) | Overpass e Geofabrik bloqueados | cartão do OpenStreetMap na central; script R 08 |
| Trabalho, renda e deslocamento da amostra de 2022 por município (item B3) | SIDRA bloqueado | cartão do SIDRA na central |
| Renda e pobreza de 2022 a partir de microdados | os microdados públicos de 2022 só identificam a UF; os que têm o município são de acesso controlado no IBGE | pedido ao IBGE e `censobr::import_microdata22()` (script R 02) |
| RAIS, CAGED, SISVAN e MEI (itens B7 e B11) | BigQuery da Base dos Dados, que pede projeto no Google Cloud | script R 09 |
| Censo SUAS, MUNIC, Mapa das OSCs, GTFS de Porto Alegre e setorização do SGB (itens B4, B8, B9, B12 e B15) | sites bloqueados aqui | arquivo baixado no cartão "Qualquer arquivo nacional" |
| Mancha da enchente de maio de 2024 (item B9) | Zenodo bloqueado | script R 07 |
| Taxa de escolarização de 6 a 14 anos nos sete municípios | o cálculo com os microdados de 2010 dá 96,63% em Porto Alegre e o IBGE Cidades publica 96,69%; como não reproduz, não entra | continua só Porto Alegre, com o número do IBGE |
| Mortalidade infantil, receita e despesa do IBGE Cidades | IBGE Cidades e DATASUS bloqueados | continuam só Porto Alegre |
| Registros administrativos do Atlas Brasil (2013 a 2017) | dos arquivos recebidos, só veio o dicionário (78 siglas); a planilha com os valores não estava entre eles, e o atlasbrasil.org.br não abre aqui | cartão "Atlas Brasil" na central, com a planilha baixada da biblioteca |
| IDHM municipal depois de 2010 | não existe: o Radar IDHM vai até 2024, mas só para a RM, as UFs e o Brasil | — |

## 3. Como foi conferido

**`9_censo2022_setores.py`.** O script para se qualquer uma destas conferências falhar:

- antes de gravar, confere 12 campos com o pacote do Atlas (população, domicílios, área, casas,
  apartamentos, rede de água, banheiro, domicílios precários e óbitos): são iguais nos 4.722
  setores;
- a população de cada um dos 148 bairros e dos 7 municípios é igual à soma dos seus setores, como
  no pacote;
- em todos os setores, domicílios particulares mais coletivos dá o total;
- o entorno nunca passa do total de moradores pesquisados.

**`10_censo2010_amostra.py`.**

- A soma dos pesos reproduz a população de 2010 dos sete municípios.
- Cinco indicadores foram refeitos com uma implementação independente: 35 de 35 valores iguais.
- Rodar o script de novo dá o mesmo resultado.

**No navegador (Chromium), na pasta e no arquivo único:**

- **Censo 2022:** o bairro bate com a soma dos setores em 584 de 584 comparações e o município
  também; os indicadores novos estão no catálogo, inclusive no nível município; a região soma o
  entorno; o aviso de soma parcial aparece onde o IBGE omitiu setores.
- **Pacote de extrações:** é aplicado ao abrir, com os valores iguais aos do arquivo (84 de 84).
  O IDHM de 2000 aparece nos sete municípios, e a central e a metodologia mostram o pacote. No
  arquivo baixado com os dados, o pacote continua e só a extração do navegador vai no bloco
  embutido.
- **Regressão contra a 3.7:** só mudam o catálogo (de 241 para 275 indicadores), o texto do
  perfil, o ranking e a matriz, todos pelos indicadores novos. Somas, escalas de cor, entorno das
  lojas e busca ficaram iguais.

**`11_atlas_brasil.py` e o cartão "Atlas Brasil".**

- As UDHs da base são as do shapefile, nos dois anos.
- A população das UDHs soma a de cada município publicada pelo Atlas Brasil: exata em 2010, com
  diferença de até 22 pessoas em 2000.
- O IDHM confere com os subíndices em todas as linhas: as 722 UDHs, as regiões, as RMs e o Radar.
- As regiões de Porto Alegre e a RM somam as suas UDHs.
- No navegador, o cartão produz exatamente o que o script grava: geometria idêntica nas 483 UDHs e
  65.377 valores iguais (UDHs, regiões, RMs e Radar), além das 361 siglas do dicionário.
- Uma base de UDHs com um IDHM adulterado é recusada sem mudar nada no Atlas.
- No arquivo único, o ciclo extrair, *Baixar o Atlas com os dados* e abrir em outro navegador leva
  as extrações do Atlas Brasil embutidas.

## 4. Fontes

- [censobr](https://github.com/ipeaGIT/censobr), do IPEA. Os arquivos estão nas *releases* do
  repositório `ipea/censobr_prep_data`, versão `v1.0.0`:
  - agregados por setores censitários do Censo 2022 (Básico, Domicílio, Óbitos e Entorno);
  - microdados da amostra do Censo 2010.

  Os dois são do IBGE. Nas versões anteriores, esses arquivos estavam bloqueados neste ambiente;
  na 3.8 passaram a abrir.
- [Biblioteca do Atlas Brasil](https://www.atlasbrasil.org.br/acervo/biblioteca) (PNUD, IPEA e FJP):
  bases UDH, REGIONAL e 20 RMs da RM de Porto Alegre, Radar IDHM e metadados. Os arquivos foram
  recebidos em 15/10/2026; o site não abre neste ambiente. Tamanho e SHA-256 em
  [`ATLAS-BRASIL-bases.md`](ATLAS-BRASIL-bases.md).
- Dicionários do `censobr` (release `censo_docs`): `2022_dictionary_tracts.xlsx` e
  `2010_dictionary_microdata.xlsx`. Deles saem os códigos das variáveis usadas, que estão listados
  em `dados/dados-censo2022.js` e no cabeçalho dos scripts.
