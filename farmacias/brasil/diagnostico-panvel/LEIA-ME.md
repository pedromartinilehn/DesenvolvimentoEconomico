# Panvel: o que replicar e onde crescer no Sul e no Sudeste

| arquivo | conteúdo |
|---|---|
| `APRESENTACAO-panvel-sul-sudeste.pptx` | 11 slides com notas do apresentador: resumo, matriz renda × 60+, comparação com Raia Drogasil e Pague Menos, SWOT, quatro regras de localização, mapa e pontos candidatos no RS/SC/PR, em SP e no RJ/MG/ES, prioridades |
| `pontos-oportunidade.csv` | os 442 pontos candidatos, em ordem de nota |
| `municipios-oportunidade.csv` | os 120 municípios do Sul e do Sudeste com mais moradores de perfil sem Panvel a até 1 km |
| `analise_panvel.py` | a análise (`python3 analise_panvel.py <raiz do repositório> analise.json`) |
| `mapa.py` | o mapa do Sul e do Sudeste usado nos slides |

Os dois scripts leem `../extracao/fontes/intermediario/` (setores e lojas), gerado pelos scripts do atlas
(`1_setores.py` e `2_lojas.py`), e os nomes de municípios e bairros de `atlas2/dados/`.

## Método

- **Lojas:** farmácias ativas no CNES de abril de 2026 (593 Panvel, 3.277 Raia Drogasil, 1.376 Pague Menos), as mesmas do
  atlas das farmácias.
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

- O CNES não é a lista oficial das redes: falta a loja sem registro ou aberta depois de abril de 2026.
- As regras descrevem onde a Panvel escolheu estar, não quanto cada loja vende. Antes de abrir, cruzar com venda, ticket e
  margem internos e conferir o ponto (aluguel, fluxo, estacionamento).
- Distância em linha reta, sem o caminho a pé.
