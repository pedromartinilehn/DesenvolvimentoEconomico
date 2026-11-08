# Entrega 2 · Panvel, atualizada com o 3T26, e diagnóstico de lojas

`Panvel_Entrega2_e_Diagnostico_de_Lojas.pptx` junta as duas apresentações no template do Grupo 5 (Finanças
Corporativas de Curto Prazo), com 29 slides:

- **Parte 1 (slides 1 a 22):** análise das demonstrações, com os recortes originais (2025 × 2024 e 2T26 × 2T25) e a
  atualização pelo release do 3T26.
- **Parte 2 (slides 23 a 29):** diagnóstico de abertura de lojas (divisória, três frentes, critério, SC e PR, São
  Paulo, concorrência e sequência, anexo CNES × releases), refeito no mesmo visual (Nunito Sans, azul 143C8C,
  laranja E8631A). O mapa `mapa_oportunidades.png` usa as cores do template.

A versão da Parte 2 no visual próprio continua em `../brasil/diagnostico-panvel/`.

## O que mudou

| slide | mudança |
|---|---|
| 1 e 2 | capa e fontes citam o 3T26 |
| 16 a 19 (novos) | indicadores set/26 × set/25 (fluxos 9M, sem anualizar), prazos e ciclos 9M (base 270 dias), NCG e CDG com set/25 e set/26, FCA 9M26 × 9M25 |
| 20 | benchmark com a linha do 3T26 das três redes |
| 21 e 22 | respostas e conclusões com os números de setembro |
| 23 a 29 (novos) | Parte 2: diagnóstico de lojas |
| todos | numeração `NN / 29` |

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
python3 junta.py base.pptx final.pptx analise.json mapa_oportunidades.png  # base: saída acima com a capa e 6 slides duplicados no fim
```

## Correção: lojas fora do CNES (Balneário Camboriú)

A primeira versão dizia que Balneário Camboriú não tinha Panvel. A cidade tem várias lojas (Google Maps, nov./2026), mas
o CNES só tem um registro da rede lá (Av. Brasil, 2880), cadastrado como centro de imunização (tipo 85), e a análise só
usava farmácias (tipo 43). A análise agora inclui os 4 registros ativos da Dimed em outros tipos e tira Balneário
Camboriú das listas de oportunidade. O perfil de loja (critério de renda e 60+) não muda. Slides alterados: 25 (total sem
Panvel e mapa), 26 (matriz), 27 (gráfico e motivo 4), 28 (cidades médias), 31 (sequência) e 32 (anexo).

```bash
python3 corrige_cnes.py antes.pptx final.pptx analise.json analise_md.json mapa_oportunidades.png  # só sobre a versão anterior; junta.py e junta2.py já geram o texto corrigido
```

