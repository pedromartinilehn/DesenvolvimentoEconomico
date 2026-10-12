# Atlas Metropolitano RMPA — versão 3.3

Mapa socioeconômico para análise territorial e do entorno das lojas Renner em sete municípios:
Porto Alegre, Canoas, Gravataí, Sapucaia do Sul, Cachoeirinha, Guaíba e Esteio.

## Como abrir

- Mais simples: abra `atlas-rmpa.html`. É a versão standalone, com interface, dados e código embutidos.
- Para desenvolvimento: mantenha `index.html`, `atlas.css`, `atlas.js` e a pasta `dados/` juntos.
- Não abra o HTML de dentro do ZIP; extraia a pasta antes.
- O mapa-base opcional e a biblioteca Leaflet usam internet. Os dados do Atlas estão no pacote.

## O que mudou na versão 3.3: a página busca os dados sozinha

Não é mais preciso rodar script nem gerar arquivo para atualizar estas fontes. Ao abrir, o Atlas
consulta as fontes pelo próprio navegador, confere e aplica no mapa:

| fonte | o que atualiza | por onde |
|---|---|---|
| Atlas Brasil | IDHM 2010 e nove indicadores de vulnerabilidade | Base dos Dados |
| INEP | IDEB da rede pública, edição mais recente com os sete municípios | Base dos Dados |
| Anatel | banda larga fixa, último mês publicado | Base dos Dados |
| IBGE e CEMADEN | áreas de risco | Base dos Dados |
| IBGE | população estimada; PIB e valor adicionado | API de agregados do IBGE |
| Tesouro | receitas, despesas e gasto por função, **inclusive educação** | API do SICONFI |

Como funciona:

- **Primeiro uso:** a busca roda em segundo plano depois que o mapa aparece. A primeira vez baixa
  cerca de 26 MB da Base dos Dados; os arquivos são descompactados no navegador e só as linhas dos
  sete municípios são guardadas.
- **Validação:** cada fonte passa pelas mesmas conferências dos scripts:
  - os sete municípios presentes;
  - os valores dentro da faixa possível;
  - as identidades contábeis fechando (PIB = VAB + impostos; VAB = soma dos setores; receitas e
    despesas coerentes).
  O que não passa, ou não responde, fica com o dado embarcado em `dados/*.js`, e o motivo aparece
  em *Mais → Dados e fontes*.
- **Edições:** uma edição mais antiga que a carregada nunca substitui a atual.
- **Cache:** o resultado fica guardado neste navegador e vale por 30 dias. Nas aberturas seguintes,
  o Atlas usa o que foi guardado, sem baixar de novo. *Dados e fontes* tem o botão "Buscar agora",
  a opção de desligar a busca automática e a de voltar aos dados embarcados.
- **Rodapé:** o rodapé da barra lateral mostra quantas fontes estão ao vivo e a data da consulta.

Não dá para ler direto pelo navegador, e continuam pelos scripts de `extracao/`: Censo (setores e
microdados), CNES, Censo Escolar, SSP/RS, Cadastro Único e Censo SUAS. Essas fontes não permitem
leitura por outra página (CORS), exigem login, ou só existem como arquivo compactado em FTP.

A Base dos Dados libera a leitura pelo navegador, e isso foi conferido. Se o IBGE e o Tesouro
liberam, só se sabe na hora: se não liberarem, essas três fontes ficam com o dado embarcado e o
Atlas diz isso.

## O que mudou na versão 3.2

Dados que faltavam, extraídos de fonte pública e sem nenhum valor estimado:

- **IDHM de 2010** e seus componentes, e nove indicadores de vulnerabilidade do Atlas Brasil
  (jovens que não estudam, não trabalham e são vulneráveis; mães chefes de família sem fundamental;
  desocupação de 18 a 24 anos; creche de 0 a 3 anos, entre outros), por município.
- **IDEB 2023** da rede pública (anos iniciais, anos finais, ensino médio), por município.
- **Banda larga fixa** (Anatel, junho de 2024), acessos por 100 habitantes, por município.
- **Áreas de risco BATER** (IBGE e CEMADEN, base 2010): camada nova no mapa, com 18 áreas em Porto
  Alegre e 7 em Sapucaia do Sul.
- O painel *Diagnóstico regional* ganhou as tabelas "Juventude, famílias e vulnerabilidade" e
  "Educação e desenvolvimento humano".
- Favelas, áreas de risco e bolsões passam a dividir um só canvas no mapa: antes, a camada de cima
  escondia o tooltip das de baixo.

Os dados vêm do espelho público da Base dos Dados, pelo `extracao/5_base_dos_dados.py`. Para o
que ainda falta há scripts R prontos em `extracao/R/`. Ver `docs/EXTRACAO-dados-faltantes.md`.

## O que mudou na versão 3

A versão 3 parte da versão 2 recebida e reúne quatro rodadas de trabalho, todas verificadas no
navegador sobre a base completa, comparando antes e depois:

1. **Desempenho:** abertura 3,3 vezes mais rápida e troca de indicador 12 vezes mais rápida. Detalhes em
   "Desempenho", abaixo.
2. **Correções:** os oito erros apontados em `docs/AUDITORIA-arquivos-e-modelos.md`.
3. **Interface:** redesenho completo e nenhum painel vazio. Detalhes em "Interface", abaixo.
4. **Clique:** bairros e setores voltam a ser selecionáveis com escolas, saúde ou favelas ligadas,
   com o entorno de loja aberto e no celular. Detalhes em "Seleção por clique", abaixo.

### Herdado da versão 2

- Os antigos indicadores vazios deixaram de aparecer como se fossem disponibilidade futura.
- Saúde, assistência, segurança, emprego, finanças e agro têm valores nos sete municípios.
- Escolas e estabelecimentos de saúde agora cobrem todos os sete municípios.
- O cabeçalho tem um seletor direto para analisar o entorno de cada loja.
- Raios disponíveis: 0,5 km, 1 km, 2 km, 3 km e 5 km.
- Setores censitários são decodificados somente quando necessários, reduzindo o custo da abertura.
- O visual foi redesenhado em tema claro, com hierarquia editorial e melhor contraste.

### Interface

- Nenhuma tela mostra "aguardando integração". Um indicador aparece na lista só se tem valor no
  mapa. O cartão de PIB do painel de abertura agora mostra o valor do IBGE.
- Quando o IBGE não publica um dado para um setor ou bairro (sigilo, setor especial ou sem
  moradores), o perfil mostra o valor do bairro ou do município que o contém. A linha diz de onde
  veio o número, em cinza: o valor é de referência, não do setor.
- 89 indicadores de bairro e setor com valor nos sete municípios passam a ter também o nível
  município: o mapa municipal vai de 52 para 141 indicadores. O perfil municipal lista todas as
  categorias com valor e não tem bloco vazio.
- A legenda separa as ausências por motivo: setor especial ou sem moradores, fora da cobertura
  da fonte, sob sigilo do IBGE.
- Quando os zeros são pelo menos 20% dos valores, eles ganham classe própria na legenda. Isso
  resolve o item 2.7 da auditoria. Quebras repetidas não viram mais classes vazias: favela por
  setor, onde quase todo valor é 0% ou 100%, fica com duas classes.
- Rampas azul, verde e laranja recalibradas: uma cor cada, clara para escura, com o tom mais
  claro visível sobre o fundo do mapa. Os pontos têm um anel claro em volta; as lojas ficam em
  terracota e maiores.
- Cabeçalho reorganizado, com os níveis em botões segmentados, a busca, os filtros e um menu
  "Mais" para metodologia, cobertura, fontes e integração. A lista de indicadores tem filtro por
  texto. Legenda e camadas recolhem; no celular começam recolhidas, lado a lado.
- A comparação dos sete municípios tem barras na cor da classe do mapa.
- As malhas de bairro e município perderam as frestas: buracos de menos de 5 ha deixados pela
  dissolução dos setores. Porto Alegre tinha 1.225 dessas frestas. Buracos maiores ficam.
  Com isso, 4 escolas e 2 estabelecimentos de saúde que caíam nas frestas passam a contar para
  o bairro em volta: Centro, Estância Velha e Mathias Velho (Canoas), Gravataí e Cachoeirinha.
  Nenhum outro número mudou (verificado por sonda antes/depois, incluindo os 100 entornos).

### Seleção por clique

- Escolas, saúde e favelas são desenhadas em canvas, que cobre o mapa inteiro. Com qualquer uma
  ligada, nenhum território era clicável (0 de 148 bairros). O mapa agora acha o território sob o
  cursor quando o clique não acerta um ponto, com realce e tooltip.
- O círculo do entorno da loja capturava o clique dos bairros dentro do raio; deixou de capturar.
- Até 6 px de tremor entre apertar e soltar o botão ainda contam como clique (antes, 3 px).
- Selecionar só move o mapa se o território não estiver inteiro à vista, descontando o cartão do
  indicador e, no celular, o painel, que ganhou botão de fechar.
- Teste automatizado: 148 de 148 bairros em cada cenário (padrão, cada camada ligada, todas
  ligadas, entorno aberto, mouse com tremor de 5 px, celular) e 119 de 119 setores da amostra.

### Versão 3.1: diagnóstico regional (outubro de 2026)

Implementa as sugestões de `docs/DIAGNOSTICO-REGIONAL-analise-do-template.md` que dependem só de dados
já incluídos no pacote.

- **Valores oficiais de 2010 no município.** Gini, pobreza, renda per capita, trabalho e escolaridade de
  2010 passam a usar, no nível município, o valor calculado sobre todos os registros do município. Antes
  era a média das áreas de ponderação, o que não é um Gini válido (Canoas: 0,452 antes, 0,518 agora).
  As sete versões "(histórico)" só do município, que repetiam esses números, saíram da lista.
- **Bolsões.** Nova camada com os 123 bolsões do quintil mais pobre a até 5 km de uma unidade (323.725
  pessoas), calculada no próprio Atlas com o método da análise. O clique num bolsão abre a ficha dele;
  *Mais → Bolsões* lista todos, com exportação em CSV.
- **Região e taxas por habitante.** Despesa por habitante (saúde, atenção básica, assistência,
  segurança, trabalho), CVLI, homicídios e roubos por 100 mil habitantes, transferências sobre a
  receita e UBS por 10 mil habitantes. A comparação dos municípios ganhou a linha da região.
- **Exportar mapa.** Botão no mapa e em *Mais*: PNG com título, legenda e fonte (o mapa de fundo não
  entra na imagem).
- **Diagnóstico regional.** Em *Mais*: as tabelas das seções 6, 7, 8, 10 e 11 do template do
  Instituto Renner e a matriz de priorização com notas editáveis e evidência calculada, exportáveis
  para Word e CSV.
- Verificação: sonda antes/depois sem diferença em somas, quebras, legendas, equipamentos e nos 100
  entornos; teste de clique em todos os cenários, inclusive com a camada de bolsões.

## Desempenho

Os arquivos de dados são baixados em paralelo, cada camada do mapa tem um renderer só e é
construída uma única vez, e trocar indicador, rampa ou classificação repinta a camada em vez de
reconstruí-la. Medido em Chromium sobre a base completa: abertura de 923 ms para 278 ms, troca
de indicador no nível setor de 138 ms para 11 ms, e ligar a camada de escolas de 39 s para 31 ms.
Ver `docs/RELATORIO-OTIMIZACAO.md`.

## Cobertura dos seis eixos obrigatórios

| Eixo | Indicadores principais | Fonte | Ano |
|---|---|---|---|
| Saúde | estabelecimentos, UBS, hospitais, CAPS; despesas em saúde e atenção básica | CNES/DATASUS; SICONFI/STN | 2026; 2024 |
| Educação | escolas por rede; IDEB da rede pública; creche e pré-escola em 2010. Despesas em educação: os scripts estão prontos (Python e R), mas o servidor do Tesouro estava bloqueado | Censo Escolar/INEP; IDEB/INEP; Atlas Brasil; SICONFI/STN | 2025; 2023; 2010; — |
| Assistência | despesas em assistência e assistência comunitária; pobreza histórica | SICONFI/STN; Censo/IBGE | 2024; 2010 |
| Segurança | homicídios, furtos, roubos, veículos, estelionato e CVLI | SSP/RS | 2025 |
| Emprego | desocupação, participação, informalidade, emprego formal, conta própria; despesa em trabalho | Censo/IBGE; SICONFI/STN | 2010; 2024 |
| Finanças | receitas, tributos, transferências, despesas, investimentos e resultado | SICONFI/STN | 2024 |
| Agro | VAB e participação da agropecuária; despesa em agricultura | PIB dos Municípios/IBGE; SICONFI/STN | 2021; 2024 |

Os indicadores de emprego, pobreza e informalidade de 2010 são dados observados e históricos —
não são projeções atuais. Essa defasagem é exibida de forma explícita. A próxima etapa pode
substituí-los ou complementá-los por RAIS/Novo CAGED e CadÚnico, sem alterar a arquitetura.

## Equipamentos e análise de entorno

- 1.650 escolas em atividade do Censo Escolar/INEP 2025.
- 567 estabelecimentos de saúde ativos do CNES 2026.
- As contagens por bairro usam ponto dentro do polígono.
- O entorno da loja soma os setores cujo ponto representativo cai no raio. Um setor na borda entra
  inteiro ou fica de fora; a interface explica essa aproximação.

## Estrutura

```text
atlas_v3/
├── index.html
├── atlas.css
├── atlas.js
├── atlas-rmpa.html
├── build_single.py
├── dados/
│   ├── dados-nucleo.js
│   ├── dados-bairros.js
│   ├── dados-municipios.js
│   ├── dados-setores.js
│   ├── dados-estimados.js
│   ├── dados-servicos.js
│   ├── dados-pontos.js
│   ├── dados-indices.js
│   └── dados-complementares.js
└── extracao/
    ├── 1_servicos_municipais.py
    ├── 2_atualiza_cnes.py
    ├── 3_atualiza_escolas.py
    ├── 4_indices_municipais.py
    ├── 5_base_dos_dados.py
    ├── indices.json
    ├── R/                 (scripts R para os dados que faltam; ver docs/EXTRACAO-dados-faltantes.md)
    ├── saida_R/           (saídas dos scripts R, não versionadas)
    └── fontes/            (planilhas baixadas, não versionadas)
```

## Atualização dos dados

Os scripts em `extracao/` regeneram os dados integrados:

```bash
python3 extracao/2_atualiza_cnes.py --arquivo /caminho/healthfacilities_YYYYMM.parquet
python3 extracao/3_atualiza_escolas.py --arquivo /caminho/schools_YYYY.parquet
python3 extracao/1_servicos_municipais.py
python3 extracao/5_base_dos_dados.py
python3 extracao/4_indices_municipais.py
python3 build_single.py
```

O `5_base_dos_dados.py` baixa do espelho público da Base dos Dados (Google Cloud Storage, sem
conta) os arquivos gratuitos do Atlas Brasil, do IDEB, da Anatel e das áreas de risco do geobr, e
grava `dados/dados-complementares.js`. Ele também deixa em `extracao/fontes/basedosdados/` o
arquivo do Atlas Brasil que o `4_indices_municipais.py` usa para o IDHM, por isso roda antes.

Os dois scripts de pontos precisam de `pandas` e `pyarrow`. O script municipal usa a API pública
do SICONFI e os arquivos oficiais de segurança; consulte o cabeçalho de cada script.

### Índices sintéticos municipais

IVS, IDESE e FIRJAN não têm API pública: são planilhas publicadas por cada instituição. O IDHM
vem do espelho da Base dos Dados (ver acima), e a planilha do Atlas Brasil continua aceita. O
script `4_indices_municipais.py` lê os arquivos de `extracao/fontes/`, guiado pelo mapa de colunas
em `extracao/indices.json`:

| índice | publicador | onde obter | periodicidade |
|---|---|---|---|
| IDHM | PNUD, IPEA e FJP | atlasbrasil.org.br | Censos de 1991, 2000 e 2010 |
| IVS | IPEA | ivs.ipea.gov.br | Censos de 2000 e 2010 |
| IDESE | DEE/SPGG-RS | dee.rs.gov.br | anual, só municípios do RS |
| IFDM e IFGF | Sistema FIRJAN | firjan.com.br | conforme a edição |

Quando um nome de coluna não bate, o script imprime as colunas reais do arquivo e para —
ajuste o `indices.json` e rode de novo, sem mexer no código. Ele não estima, não interpola e
não completa município faltante: o que não vier da fonte fica de fora, e o Atlas simplesmente
não exibe o indicador.

**IDHM e IVS são calculados sobre o Censo Demográfico e o último disponível é o de 2010.**
Servem para comparar municípios entre si, não para descrever a situação atual. O IDESE é o
índice sintético municipal com atualização mais frequente para o Rio Grande do Sul.

Os dados da FIRJAN têm termos de uso próprios. Confira antes de redistribuir os valores dentro
do pacote — por isso a fonte vem desligada no `indices.json`.

`extracao/fontes/` não é versionada: guarda planilhas grandes e, em alguns casos, licenciadas.

## Fontes

- IBGE: Censo Demográfico 2022, Estimativas da População 2026 e PIB dos Municípios.
- DATASUS: Cadastro Nacional de Estabelecimentos de Saúde (CNES).
- INEP: Microdados do Censo Escolar 2025.
- Tesouro Nacional: DCA do SICONFI/FINBRA 2024.
- Secretaria da Segurança Pública do RS: indicadores criminais municipais de 2025.
- SMUrb/PMPA e IBGE: malhas de bairros e setores censitários.

## Regra editorial

Todo valor exibido informa fonte, ano e nível geográfico. Valores municipais não são rateados por
bairro. Ausência contábil de uma função na DCA é mantida como zero quando a própria declaração não
traz a linha correspondente. Estimativas temporais futuras devem entrar como uma camada separada,
nunca substituindo o dado oficial ou histórico.
