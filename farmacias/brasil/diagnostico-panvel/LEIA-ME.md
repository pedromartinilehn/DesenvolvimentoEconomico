# Panvel: o que replicar e onde crescer no Sul e no Sudeste

| arquivo | conteúdo |
|---|---|
| `APRESENTACAO-panvel-sul-sudeste.pptx` | 5 slides e 1 anexo, com notas: onde crescer, o critério (renda e 60+) com a economia da loja nos releases, por que adensar SC e PR (market share por UF), São Paulo, concorrência e sequência, e o anexo que compara o CNES com as lojas dos releases do 3T26 |
| `deck.js` | gera a apresentação a partir de `analise.json` e do mapa (pptxgenjs) |
| `pontos-oportunidade.csv` | os 442 pontos candidatos, em ordem de nota |
| `municipios-oportunidade.csv` | os 120 municípios do Sul e do Sudeste com mais moradores de perfil sem Panvel a até 1 km |
| `analise_panvel.py` | a análise (`python3 analise_panvel.py <raiz do repositório> analise.json`) |
| `mapa.py` | o mapa do Sul e do Sudeste usado nos slides |
| `lojas_extra.py` | registros ativos da Panvel no CNES fora do tipo farmácia |
| `exporta_csv.py` | grava os dois CSVs a partir do `analise.json` |

Os dois scripts leem `../extracao/fontes/intermediario/` (setores e lojas), gerado pelos scripts do atlas
(`1_setores.py` e `2_lojas.py`), e os nomes de municípios e bairros de `atlas2/dados/`.

## Método

- **Lojas:** farmácias ativas no CNES de abril de 2026 (593 Panvel, 3.277 Raia Drogasil, 1.376 Pague Menos), as mesmas do
  atlas das farmácias. Na cobertura e na busca de pontos entram também os 4 registros ativos da Dimed (Panvel) cadastrados em
  outros tipos: Balneário Camboriú (Av. Brasil, 2880, centro de imunização), Porto Alegre (Av. Ipiranga, 6690), Rio Grande
  (R. Dr. Nascimento, 399) e Santa Maria (Av. Borges de Medeiros, 1955) (`lojas_extra.py`). O perfil de loja continua com
  as 593 farmácias.
- **Entorno:** setores do Censo 2022 com o ponto representativo a até 1 km da loja, em linha reta.
- **Ticket:** não há dado de venda. O poder de compra é aproximado pela renda média do responsável pelo domicílio.
- **Perfil Panvel:** setor com renda média do responsável de pelo menos R$ 5.760 e pelo menos 24,6% de moradores com 60 anos
  ou mais. São as medianas do entorno de 1 km das 593 lojas Panvel.
- **Ponto candidato:** setor de perfil sem Panvel a até 1 km, com pelo menos 9.538 moradores a até 1 km (primeiro quartil das
  Panvel). A nota do ponto é a soma dos moradores de perfil sem Panvel a até 1 km. Os pontos são escolhidos em ordem de nota,
  a pelo menos 2,5 km uns dos outros.
- **Rótulo do ponto:** o bairro do IBGE do setor. Sem bairro do IBGE (caso de São Paulo), o bairro que o CNES informa para a
  farmácia das três redes mais próxima, se estiver a até 1,5 km; na apresentação, esses rótulos levam asterisco.
- **Matriz renda × 60+:** setores do RS, SC e PR divididos em terços da população por renda média do responsável e por parcela
  de 60+; em cada célula, a parte dos moradores a até 1 km de uma Panvel.

## Limites

- O CNES não é a lista oficial das redes: falta a loja sem registro ou aberta depois de abril de 2026. Exemplo: Balneário
  Camboriú tem várias lojas Panvel abertas (Google Maps, nov./2026), mas o CNES só tem um registro da rede na cidade, como
  centro de imunização. Por isso a primeira versão marcou a cidade como vazia. A cidade agora fica fora das listas de
  oportunidade (`PRESENCA_FORA_CNES` em `analise_panvel.py`).
- "Cidade sem Panvel" quer dizer sem registro da Panvel no CNES. Antes de levar uma cidade adiante, conferir no localizador
  de lojas da Panvel. Na busca na web (nov./2026), um diretório lista uma Panvel em Indaial (R. Dr. Oswaldo Cruz, 75), sem
  confirmação. Para Imbituba, São Francisco do Sul, Rio do Sul, Marechal Cândido Rondon, Navegantes, Biguaçu, Gaspar, Rolândia,
  Ibiporã e Mafra a busca não achou loja, o que não prova que não exista.
- As regras descrevem onde a Panvel escolheu estar, não quanto cada loja vende. Antes de abrir, cruzar com venda, ticket e
  margem internos e conferir o ponto (aluguel, fluxo, estacionamento).
- Distância em linha reta, sem o caminho a pé.

## Releases do 3T26

Os números de lojas por UF, market share (IQVIA), ticket, venda por loja, ROIC das safras e expansão das concorrentes
vêm dos releases do 3T26 da Panvel (05/11/2026), da RD Saúde (03/11/2026) e da Pague Menos (04/11/2026). O CNES de
abril de 2026 tem 88% das lojas Panvel (593 farmácias e 4 registros de outros tipos, de 677) e 89% das lojas da Raia no Sul e no Sudeste que os releases informam.
