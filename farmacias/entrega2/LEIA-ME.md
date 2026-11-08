# Entrega 2 · Panvel, atualizada com o 3T26

`Panvel_Entrega2_Analise_Demonstracoes_3T26.pptx` é a apresentação do Grupo 5 (Finanças Corporativas de Curto
Prazo), com os recortes originais (2025 × 2024 e 2T26 × 2T25) e uma atualização pelo release do 3T26.

## O que mudou

| slide | mudança |
|---|---|
| 1 e 2 | capa e fontes citam o 3T26 |
| 16 a 19 (novos) | indicadores set/26 × set/25 (fluxos 9M, sem anualizar), prazos e ciclos 9M (base 270 dias), NCG e CDG com set/25 e set/26, FCA 9M26 × 9M25 |
| 20 | benchmark com a linha do 3T26 das três redes |
| 21 e 22 | respostas e conclusões com os números de setembro |
| todos | numeração `NN / 22` |

O release do 3T26 não traz o 9M24, então não dá para montar o LTM do 3T25: os indicadores de fluxo do 3T26 usam
o acumulado de nove meses dos dois anos. Balanço e DRE em IFRS (consolidado), como no resto da apresentação.

## Principais números (IFRS, R$ milhões)

| | set/25 · 9M25 | set/26 · 9M26 |
|---|---:|---:|
| Liquidez corrente | 1,91x | 1,68x |
| Liquidez seca | 0,90x | 0,72x |
| ROE (9M, sem anualizar) | 6,5% | 7,9% |
| PMRE · PMRV · PMPC (dias) | 115,7 · 29,5 · 64,1 | 107,4 · 31,9 · 60,7 |
| Ciclo financeiro (dias) | 81,1 | 78,6 |
| NCG · CDG | 894,3 · 1.020,9 | 995,7 · 902,8 |
| Saldo de tesouraria | +126,6 | −92,9 |
| FCA (sem a variação de caixa e aplicações) | 69,2 | 55,5 |

Leitura: a Panvel usou R$ 163 milhões de caixa e aplicações para amortizar empréstimos de longo prazo. A liquidez e
o saldo de tesouraria caem por essa escolha, enquanto a rentabilidade melhora. O estoque segue como o maior consumo
de capital de giro em valor, mas o prazo de estoque continua caindo; o ciclo só não cai mais porque o prazo de
fornecedores também encurtou.

## Benchmark de prazos divulgados no 3T26 (dias)

| | estoques | recebíveis | fornecedores | ciclo | Δ a/a |
|---|---:|---:|---:|---:|---:|
| Panvel | 97 | 30 | 55 | 72 | +2 |
| RD Saúde | 102,4 | 27,6 | 75,8 | 54,2 | −2,4 |
| Pague Menos | 103 | 32 | 63 | 72 | +4 |

## Como refazer

```bash
python3 calc3t26.py                                   # grava n3t26.json com os números do release 3T26
python3 edita_e2.py entrada.pptx saida.pptx n3t26.json  # entrada: a Entrega 2 com os 4 slides duplicados após o 15
```
