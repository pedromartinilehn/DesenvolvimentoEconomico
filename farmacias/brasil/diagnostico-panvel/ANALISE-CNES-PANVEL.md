# A Panvel em todo o CNES (competência abril de 2026)

Varredura dos 615.401 registros do CNES de abril de 2026 (base do geobr/IPEA) atrás de tudo o que é da Panvel. O
objetivo é saber quantas lojas o cadastro tem, onde estão, o que falta e o quanto dá para confiar nele.
Script: `analise_cnes_panvel.py`. Todos os registros, ativos e desativados, estão em `registros-cnes-panvel.csv`.

## 1. Como foi feita a busca

- **Pelo CNPJ:** qualquer registro com a raiz 92.665.611 (Dimed S.A. Distribuidora de Medicamentos, dona da Panvel) no
  CNPJ do estabelecimento ou no CNPJ da mantenedora.
- **Pelo nome:** qualquer registro com PANVEL ou DIMED no nome fantasia ou na razão social, para achar lojas cadastradas com
  outro CNPJ.

Resultado: **todo registro da Panvel está no CNPJ da Dimed.** A busca por nome fora desse CNPJ só achou empresas sem relação
com a rede, como a "Dimed Serviços Médicos", de São Bernardo do Campo, e clínicas com "-dimed" no meio do nome. A Dimed
aparece com 14 grafias diferentes de razão social (por exemplo, "DIMED S A", "DIMED SA" e "DIMEDS A"), o que reforça buscar
pelo CNPJ e não pelo nome.

## 2. Quantos registros

| | registros |
|---|---:|
| Total da Dimed no CNES | 628 |
| Ativos | **597** |
| — farmácia (tipo 43) | 593 |
| — outros tipos | 4 |
| Desativados | 31 |
| CNPJs distintos | 618 |

Os 4 registros ativos fora do tipo farmácia têm o nome PANVEL FARMACIAS:

| município | endereço | tipo no CNES |
|---|---|---:|
| Balneário Camboriú | Av. Brasil, 2880 | 85 (centro de imunização) |
| Porto Alegre | Av. Ipiranga, 6690 | 36 |
| Rio Grande | R. Dr. Nascimento, 399 | 22 |
| Santa Maria | Av. Borges de Medeiros, 1955 | 84 |

O de Balneário Camboriú é o **único** registro da Panvel na cidade, embora ela tenha várias lojas (Google Maps, nov./2026).
Foi esse o erro da primeira versão do diagnóstico, que só contava o tipo 43. Os quatro já entram na análise de cobertura
(`lojas_extra.py`).

## 3. CNES × release do 3T26

| UF | CNES (ativos) | release (30/09/2026) | CNES ÷ release | faltam | municípios no CNES |
|---|---:|---:|---:|---:|---:|
| RS | 398 | 425 | 94% | 27 | 88 |
| SC | 85 | 105 | 81% | 20 | 27 |
| PR | 102 | 130 | 78% | 28 | 25 |
| SP | 12 | 17 | 71% | 5 | 1 |
| **Total** | **597** | **677** | **88%** | **80** | **141** |

- O CNES não tem nenhuma Panvel fora das quatro UFs do release.
- **A falta é maior onde a rede é mais nova.** O RS tem 94% das lojas no cadastro. SC, PR e SP, onde a expansão é mais
  recente, têm entre 71% e 81%.
- Em SP as 12 lojas do CNES estão todas na capital.
- A diferença de 80 lojas mistura duas coisas: lojas abertas entre abril e setembro de 2026 e lojas sem cadastro ou
  cadastradas de outra forma, como em Balneário Camboriú. Os dados não permitem separar as duas.

## 4. Onde a Panvel está

**Maiores praças:**

| município | lojas no CNES |
|---|---:|
| Porto Alegre | 130 |
| Curitiba | 44 |
| Florianópolis | 28 |
| Caxias do Sul | 18 |
| Pelotas | 17 |
| Londrina, Rio Grande e Santa Maria | 14 cada |
| São Paulo, Novo Hamburgo e Passo Fundo | 12 cada |

72 dos 141 municípios têm uma loja só.

**Por porte do município (população do Censo 2022):**

| porte | municípios | lojas |
|---|---:|---:|
| até 50 mil | 50 | 69 |
| 50 a 200 mil | 65 | 150 |
| 200 mil a 1 milhão | 23 | 192 |
| mais de 1 milhão | 3 | 186 |

**Alcance no Sul:**

| UF | municípios com Panvel | população desses municípios |
|---|---:|---:|
| RS | 88 de 497 | 75% da população do estado |
| SC | 27 de 295 | 57% |
| PR | 25 de 399 | 53% |

## 5. Concorrência no município

Contagem das farmácias da Raia Drogasil e da Pague Menos no CNES, com a mesma regra:

- A Raia está em 94 dos 141 municípios com Panvel. Nos outros 47 (42 no RS e 5 em SC) a Panvel não tem Raia ao lado; são 55
  lojas, a maior parte em cidades menores do interior gaúcho, como Santo Ângelo (3 lojas), Taquara, Santiago, Nova
  Petrópolis, Imbé e Dois Irmãos.
- **No PR, todo município com Panvel também tem Raia.**
- A Panvel tem mais lojas que a Raia em 86 municípios, e a Raia tem mais em 33. Os maiores déficits da Panvel são:
  - São Paulo: 12 contra 482
  - Curitiba: 44 contra 62
  - Joinville: 5 contra 14
  - Ponta Grossa: 3 contra 11
  - Londrina: 14 contra 20
  - Cascavel: 4 contra 9
  - Foz do Iguaçu: 3 contra 8
  - Maringá: 9 contra 14
- A Pague Menos está em só 12 dos municípios com Panvel.

## 6. O histórico que o CNPJ conta

**Ordem de abertura.** A Dimed numera as filiais no CNPJ (os 4 dígitos depois da raiz). O maior número ativo é 742. A
mediana do número de filial por UF repete a ordem da expansão:

| UF | mediana do número de filial |
|---|---:|
| RS | 276 |
| PR | 476 |
| SC | 517 |
| SP | 573 |

Até o número 249 quase tudo é RS. O PR aparece a partir de 250–349, e SC cresce de novo em 600–649.

**CNPJs novos faltam mais.** De cada faixa de 50 números de filial, entre 35 e 47 estão ativos no CNES. Na faixa 700–742,
só 18 de 43 estão. Os CNPJs mais novos são os que mais faltam, o que é coerente com o cadastro atrasar nas lojas recentes.

**CNPJ reaproveitado.** Dez CNPJs aparecem em dois registros: um desativado em um endereço antigo e um ativo em outra
cidade. Por exemplo, o CNPJ da loja fechada na Marquês do Pombal, 565, em Porto Alegre, hoje é de uma loja em Foz do Iguaçu.
Por isso o CNPJ identifica a filial, mas não o ponto.

**Desativações (31).**

| | desativações |
|---|---:|
| Porto Alegre | 12, todas em 2021–2022, no Centro e em eixos como Independência, Voluntários da Pátria e Ipiranga |
| Curitiba | 6 (5 com data de 29/05/2024) |
| Outras cidades | 1 cada: Maringá, Florianópolis, Lages, São Paulo e mais 9 cidades do RS |

| ano | desativações |
|---|---:|
| 2020 | 1 |
| 2021 | 11 |
| 2022 | 6 |
| 2023 | 3 |
| 2024 | 8 |
| 2025 | 2 |

Códigos de motivo: 11 (14 casos), 4 (6), 8 (5), 6 (3) e 10 (3). A base não traz a descrição dos códigos.

## 7. Qualidade do cadastro

| item | resultado |
|---|---|
| Última atualização dos 597 ativos | 189 antes de 2023, 134 em 2023–2024, 274 em 2025–2026 |
| Validade da licença sanitária informada | 72 válidas em abr./2026, 338 vencidas, 187 sem data |
| Mesmo endereço em dois registros ativos | 2 casos em Porto Alegre: Av. Severo Dullius, 90010 (área do aeroporto) e R. 24 de Outubro, 742 (bairros diferentes no cadastro). Podem ser duas lojas ou duplicidade |
| Coordenada | 512 do próprio CNES e 85 geocodificadas pelo endereço; distância mediana de 268 m entre o ponto do CNES e o endereço; 49 a mais de 2 km; 13 com ponto do CNES fora do município |
| Abertas 24 horas | 16 (11 RS, 3 SC, 1 PR, 1 SP) |

A licença vencida no CNES quer dizer só que o campo não foi atualizado. Não é prova de loja irregular.

## 8. O que isso muda para o diagnóstico

1. **"Cidade sem Panvel" quer dizer "sem Panvel no CNES".** Com 88% das lojas e a falta concentrada em SC, PR e SP, toda
   cidade candidata precisa ser conferida no localizador de lojas da rede. Balneário Camboriú mostrou o risco.
2. **O argumento de SC e PR fica de pé.** Ele vem do market share da IQVIA nos releases, não do CNES. O CNES até subestima a
   presença atual nesses estados, onde a Panvel é mais nova.
3. **A cobertura a 1 km está um pouco subestimada em SC, PR e SP**, onde faltam 19% a 29% das lojas. A ordem dos lugares
   tende a se manter, mas pontos perto de lojas novas podem já estar atendidos.
4. **O PR é o estado mais disputado:** a Raia está em todas as cidades onde a Panvel está e tem mais lojas nas maiores.
5. **O fechamento no Centro de Porto Alegre em 2021–2022** (12 lojas) mostra que a rede também enxuga praça madura. Adensar
   tem limite, e Porto Alegre serve de teto, como no slide 27.

## Arquivos

| arquivo | conteúdo |
|---|---|
| `analise_cnes_panvel.py` | gera os números deste documento (`python3 analise_cnes_panvel.py <raiz> saida.json`) |
| `registros-cnes-panvel.csv` | os 628 registros da Dimed: situação, tipo, endereço, atualização, licença, coordenada |
