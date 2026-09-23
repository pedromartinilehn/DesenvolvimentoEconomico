# Atlas Metropolitano RMPA — versão 2

Mapa socioeconômico para análise territorial e do entorno das lojas Renner em sete municípios:
Porto Alegre, Canoas, Gravataí, Sapucaia do Sul, Cachoeirinha, Guaíba e Esteio.

## Como abrir

- Mais simples: abra `atlas-rmpa.html`. É a versão standalone, com interface, dados e código embutidos.
- Para desenvolvimento: mantenha `index.html`, `atlas.css`, `atlas.js` e a pasta `dados/` juntos.
- Não abra o HTML de dentro do ZIP; extraia a pasta antes.
- O mapa-base opcional e a biblioteca Leaflet usam internet. Os dados do Atlas estão no pacote.

## O que mudou na versão 2

- Os antigos indicadores vazios deixaram de aparecer como se fossem disponibilidade futura.
- Saúde, assistência, segurança, emprego, finanças e agro têm valores nos sete municípios.
- Escolas e estabelecimentos de saúde agora cobrem todos os sete municípios.
- O cabeçalho tem um seletor direto para analisar o entorno de cada loja.
- Raios disponíveis: 0,5 km, 1 km, 2 km, 3 km e 5 km.
- Setores censitários são decodificados somente quando necessários, reduzindo o custo da abertura.
- O visual foi redesenhado em tema claro, com hierarquia editorial e melhor contraste.

### Interface (revisão de setembro de 2026)

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
| Educação | escolas por rede; despesas em educação, ensino fundamental, educação infantil e EJA | Censo Escolar/INEP; SICONFI/STN | 2025; 2024 |
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
atlas_v2/
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
│   └── dados-indices.js
└── extracao/
    ├── 1_servicos_municipais.py
    ├── 2_atualiza_cnes.py
    ├── 3_atualiza_escolas.py
    ├── 4_indices_municipais.py
    ├── indices.json
    └── fontes/            (planilhas baixadas, não versionadas)
```

## Atualização dos dados

Os scripts em `extracao/` regeneram os dados integrados:

```bash
python3 extracao/2_atualiza_cnes.py --arquivo /caminho/healthfacilities_YYYYMM.parquet
python3 extracao/3_atualiza_escolas.py --arquivo /caminho/schools_YYYY.parquet
python3 extracao/1_servicos_municipais.py
python3 extracao/4_indices_municipais.py
python3 build_single.py
```

Os dois scripts de pontos precisam de `pandas` e `pyarrow`. O script municipal usa a API pública
do SICONFI e os arquivos oficiais de segurança; consulte o cabeçalho de cada script.

### Índices sintéticos municipais

IDHM, IVS, IDESE e FIRJAN não têm API pública — são planilhas publicadas por cada instituição.
O script `4_indices_municipais.py` lê os arquivos que você baixar para `extracao/fontes/`,
guiado pelo mapa de colunas em `extracao/indices.json`:

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
