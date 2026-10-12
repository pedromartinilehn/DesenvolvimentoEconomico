# Dados do IPEA no Atlas: o que entrou e o que mostram

Outubro de 2026 · Atlas Metropolitano RMPA, versão 3.5

## Resumo

Duas bases do IPEA entraram no Atlas, as duas lidas do espelho público da Base dos Dados, que
republica os arquivos sem alterar os valores:

1. **Atlas do Desenvolvimento Humano no Brasil** (PNUD, IPEA e Fundação João Pinheiro). O Atlas já
   usava o IDHM e 13 indicadores de 2010. Agora tem também a **série 1991–2000–2010** dos sete
   municípios e **19 indicadores novos de 2010**: mortalidade infantil, pobreza das crianças,
   escolaridade de jovens e adultos, formalização do trabalho, desigualdade e moradia.
2. **Projeto Acesso a Oportunidades 2019** (IPEA). Traz pela primeira vez **mobilidade** ao Atlas:
   - a parte dos empregos que se alcança em uma hora de transporte público;
   - o tempo a pé até o estabelecimento de saúde e as escolas públicas mais próximos;
   - a parte da população a mais de 30 minutos a pé desses serviços.

   Cobre só Porto Alegre, entre as sete cidades, e entra por bairro e por setor censitário.

**O que os dados mostram:**

- **O acesso a empregos acompanha a renda.** Nos dois quintis mais pobres, quem usa transporte
  público alcança em uma hora, em média, cerca de 55% dos empregos de Porto Alegre; no quintil mais
  rico, 86%.
  - Nos bairros do extremo sul (Extrema, Lageado, Lami, Boa Vista do Sul), o número fica abaixo de 2%.
- **Os serviços públicos ficam perto de onde mora a população de baixa renda; os empregos, não.**
  - O tempo a pé até a saúde de baixa complexidade é parecido em todos os quintis: de 11,5 a 14,2
    minutos.
  - O tempo até a escola pública de educação infantil é *maior* nos bairros de renda alta, que usam
    escola privada.
  - Mesmo assim, **1 em cada 5 moradores do quintil mais pobre vive a mais de 30 minutos a pé de uma
    escola pública de educação infantil.**
- **Nos bolsões de baixa renda perto das unidades, o gargalo não é distância.**
  - Os 186 mil moradores dos bolsões de Porto Alegre alcançam a mesma parte dos empregos que a média
    da cidade (72,7% contra 72,1%).
  - Também chegam mais rápido à saúde (9,7 minutos contra 13,3).
  - O que separa esses territórios do resto da cidade é renda e escolaridade, não acesso físico.
- **Entre 1991 e 2010 os sete municípios se aproximaram.** A distância de IDHM entre Porto Alegre e
  o último colocado caiu de 0,147 para 0,079. Entre 2000 e 2010, a pobreza caiu de 44% (Esteio) a
  61% (Canoas).
- **A pobreza das crianças é cerca de duas vezes a da população** em todos os municípios, e duas
  vezes e meia em Porto Alegre. Em 2010, em Porto Alegre, 9,7% das crianças eram pobres, contra 3,8%
  das pessoas. Em Guaíba, 13,1% contra 6,4%.

**Ressalvas.** O Atlas Brasil para em 2010, porque depende da amostra do Censo, e a de 2022 não é
pública. O Acesso a Oportunidades é de 2019, antes da pandemia e da enchente de 2024. A grade do
IPEA não alcança 134 setores, quase todos na periferia (extremo sul, zona leste e ilhas), onde se
concentra população de baixa renda.

---

## 1. O que o IPEA publica e o que serve ao Atlas

| base do IPEA | o que traz | nos sete municípios | situação no Atlas |
|---|---|---|---|
| Atlas do Desenvolvimento Humano (com PNUD e FJP) | 230 indicadores por município, Censos de 1991, 2000 e 2010 | os sete | **entrou**: IDHM e componentes, 32 indicadores de 2010 e a série 1991–2010 |
| Acesso a Oportunidades, 2019 | empregos, saúde e escolas alcançáveis a pé, de bicicleta e de transporte público, por hexágono | só Porto Alegre | **entrou**: 6 indicadores por bairro e setor |
| Atlas da Vulnerabilidade Social (IVS) | índice e três subíndices, por município e por Unidade de Desenvolvimento Humano (UDH) nas regiões metropolitanas | os sete | **pendente**: não está no espelho público. A planilha do IVS municipal é lida pelo `4_indices_municipais.py`. As UDH exigem a malha das unidades |
| Mapa das Organizações da Sociedade Civil | organizações com endereço e área de atuação | os sete | **pendente**: base nacional de cerca de 330 MB, download manual |
| Atlas da Violência (com FBSP) | homicídios por município, série longa | os sete | **pendente**: o Atlas já tem a SSP/RS de 2025, mais recente |
| Ipeadata | séries municipais diversas | os sete | não usado: o que interessa já vem de fontes primárias (IBGE, Tesouro) |
| censobr, geobr, aopdata | pacotes que distribuem dados do IBGE e do próprio IPEA | — | são a via de acesso de parte dos dados do Atlas |

## 2. Conferência dos dados

### 2.1 Atlas do Desenvolvimento Humano

- Sete municípios, três Censos e 30 indicadores conferidos contra faixas plausíveis. O script para
  se um valor sair da faixa.
- Em 2010, os sete municípios têm valor em todos os 30.
- Quatro indicadores não existem para 1991 e 2000 e aparecem só em 2010:
  - grau de formalização;
  - desocupação de 18 anos ou mais;
  - pessoas sem fundamental e em ocupação informal;
  - crianças em domicílios em que ninguém tem fundamental.
- Os valores de renda e a linha de pobreza (R$ 140) estão em reais de agosto de 2010 nos três anos,
  como o Atlas Brasil publica. Por isso se comparam entre si.

### 2.2 Acesso a Oportunidades

Tabela `br_ipea_acesso_oportunidades.indicadores_2019` da Base dos Dados, Porto Alegre:

| conferência | resultado |
|---|---|
| hexágonos de Porto Alegre | 3.338, em quatro combinações: a pé, bicicleta e transporte público no pico, e transporte público fora do pico |
| indicadores cumulativos (CMA): o acesso em 30 minutos nunca é menor que em 15 | **0 violações** em 146.872 séries |
| unidade dos CMA | porcentagem, de 0 a 100: o máximo é 100,0 |
| tempo mínimo (TMI), como está na tabela | **incoerente**: só 4.810 de 73.449 testes concordam com os CMA |
| tempo mínimo dividido por 100 | **coerente em 73.449 de 73.449 testes** |

O teste do tempo mínimo funciona assim:
- quem alcança um estabelecimento em 15 minutos tem de ter tempo mínimo de até 15;
- quem não alcança nenhum em 60 tem de ter tempo mínimo acima de 60.

Na tabela da Base dos Dados, o tempo mínimo vem **multiplicado por 100**. É provável que a conversão
dos indicadores para porcentagem tenha atingido também os tempos. Dividido por 100, o resultado bate
em todos os casos. O script refaz o teste a cada execução e para se ele deixar de passar, por
exemplo, se a Base dos Dados corrigir a tabela.

A versão 3.2 do Atlas tinha deixado esta base de fora justamente por esse problema, sem ter achado a
causa.

**Cobertura.** A grade de 2019 do IPEA não alcança 134 dos 2.744 setores de 2022, com 61.079
moradores (4,6% da cidade), em 41 bairros. Eles ficam quase todos na periferia: extremo sul, zona
leste e ilhas. Os bairros com mais moradores fora da grade:

| bairro | setores fora da grade | moradores |
|---|---:|---:|
| Restinga | 10 | 7.014 |
| Lomba do Pinheiro | 10 | 6.525 |
| Mário Quintana | 4 | 5.377 |
| Belém Novo | 6 | 3.931 |
| Pitinga | 5 | 3.170 |
| Belém Velho | 4 | 3.034 |
| outros 35 bairros | 95 | 32.028 |

O Arquipélago tem o maior número de setores fora da grade (19), mas com poucos moradores (1.153).

- Esses setores ficam sem valor.
- O bairro só recebe valor quando os setores cobertos somam ao menos metade da sua população. Só
  São Caetano fica abaixo e aparece sem dado.
- A cobertura é menor nos quintis de renda mais baixos: 92% da população no quintil mais pobre,
  98% nos dois mais ricos. Como os setores que faltam ficam na periferia, as médias dos quintis mais
  pobres provavelmente estão um pouco acima do que seriam com a cidade inteira.

## 3. O que os dados mostram

### 3.1 Desenvolvimento humano, 1991 a 2010

| | IDHM 1991 | IDHM 2000 | IDHM 2010 | pobres 2000 (%) | pobres 2010 (%) | crianças pobres 2010 (%) | mortalidade infantil 2010 (por mil) |
|---|---:|---:|---:|---:|---:|---:|---:|
| Porto Alegre | 0,660 | 0,744 | 0,805 | 8,49 | 3,82 | 9,70 | 11,6 |
| Canoas | 0,556 | 0,665 | 0,750 | 11,27 | 4,40 | 9,67 | 10,6 |
| Gravataí | 0,540 | 0,661 | 0,736 | 11,83 | 5,39 | 10,85 | 11,3 |
| Sapucaia do Sul | 0,513 | 0,633 | 0,726 | 12,20 | 4,94 | 10,05 | 11,9 |
| Cachoeirinha | 0,546 | 0,672 | 0,757 | 9,88 | 3,91 | 7,73 | 11,6 |
| Guaíba | 0,522 | 0,654 | 0,730 | 12,79 | 6,44 | 13,12 | 12,8 |
| Esteio | 0,589 | 0,693 | 0,754 | 8,14 | 4,53 | 9,64 | 12,0 |

- **Convergência.** A distância entre Porto Alegre e o menor IDHM (Sapucaia do Sul) caiu de 0,147
  em 1991 para 0,079 em 2010.
- **Pobreza.** Entre 2000 e 2010, caiu 44% em Esteio, 50% em Guaíba, 54% em Gravataí, 55% em Porto
  Alegre, 60% em Sapucaia do Sul e em Cachoeirinha, e 61% em Canoas.
- **Crianças.** Em 2010, a pobreza entre crianças era de 2,0 a 2,5 vezes a da população. Em Porto
  Alegre, ela subiu de 1991 para 2000 (de 16,7% para 18,2%), enquanto a pobreza geral caía (de 9,8%
  para 8,5%).
- **Desigualdade.** Porto Alegre tem a maior de longe:
  - os 10% mais ricos têm renda 23,7 vezes a dos 40% mais pobres, contra 9 a 13 vezes nos outros
    seis;
  - o índice de Theil é 0,69, contra 0,34 a 0,46.
- **Trabalho e escolaridade.** Os adultos sem fundamental e em ocupação informal são 17,3% dos
  adultos em Porto Alegre e de 24% a 29% nos outros seis. Os maiores valores estão em Gravataí,
  Sapucaia do Sul e Guaíba, todos acima de 27%.
- **Escolaridade adulta.** A parte dos adultos com fundamental completo vai de 58,9% em Sapucaia do
  Sul a 74,8% em Porto Alegre.

### 3.2 Acesso a oportunidades em Porto Alegre, 2019

Na cidade inteira, com média ponderada pela população dos setores cobertos:

| indicador | Porto Alegre |
|---|---:|
| empregos alcançáveis em até 60 minutos de transporte público | 72,2% dos empregos da cidade |
| tempo a pé até a saúde de baixa complexidade | 12,8 minutos |
| tempo a pé até a escola pública de educação infantil | 19,8 minutos |
| tempo a pé até a escola pública de ensino fundamental | 10,4 minutos |
| população a mais de 30 minutos a pé da saúde de baixa complexidade | 4,0% |
| população a mais de 30 minutos a pé de escola pública de educação infantil | 20,7% |

Por quintil de renda do setor (rendimento médio do responsável, Censo 2022, quintis da região
ponderados pela população; os mesmos dos bolsões):

| quintil | moradores em Porto Alegre | cobertura da grade | empregos em 60 min de transporte público | minutos a pé até saúde | minutos a pé até educação infantil | a mais de 30 min da educação infantil |
|---|---:|---:|---:|---:|---:|---:|
| 1 (mais pobre) | 296.639 | 92,1% | 56,1% | 11,6 | 17,5 | 20,5% |
| 2 | 175.553 | 92,3% | 54,9% | 12,4 | 16,6 | 16,3% |
| 3 | 151.959 | 94,2% | 66,8% | 11,5 | 18,0 | 13,1% |
| 4 | 289.179 | 98,4% | 80,2% | 12,7 | 18,5 | 14,2% |
| 5 (mais rico) | 416.724 | 97,5% | 86,2% | 14,2 | 24,1 | 29,9% |

- **Empregos.** O acesso fica em cerca de 55% nos dois quintis mais pobres e sobe para 80% e 86%
  nos dois mais ricos. Os bairros com menos acesso ficam no extremo sul:
  | bairro | empregos alcançáveis em 60 min |
  |---|---:|
  | Extrema | 0,9% |
  | Lageado | 1,4% |
  | Lami | 1,5% |
  | Boa Vista do Sul | 1,6% |
  | Belém Novo | 6,3% |
  | Restinga | 8,6% |
  | Pitinga | 9,5% |
- **Serviços públicos.** A rede de saúde que atende pelo SUS e as escolas públicas de educação
  infantil estão mais perto da população de baixa renda do que da de renda alta. A distância maior
  no quintil mais rico reflete o uso da rede privada, não falta de serviço.
- **Educação infantil.** É o serviço mais distante a pé. Em 14 bairros, toda a população coberta
  está a mais de 30 minutos de uma escola pública de educação infantil:
  - oito têm renda abaixo da mediana dos bairros e ficam na zona sul: Aberta dos Morros, Belém Novo,
    Belém Velho, Boa Vista do Sul, Extrema, Lageado, Lami e Serraria;
  - seis são de renda acima da mediana: Boa Vista, Guarujá, Pedra Redonda, Sétimo Céu, Três Figueiras
    e Vila Conceição.

**Bolsões de baixa renda perto das unidades.** São 51 bolsões com setores em Porto Alegre: 347
setores e 186.338 moradores.

| | bolsões | resto de Porto Alegre |
|---|---:|---:|
| empregos em 60 min de transporte público | 72,7% | 72,1% |
| minutos a pé até saúde | 9,7 | 13,3 |
| minutos a pé até educação infantil | 17,5 | 20,2 |
| a mais de 30 min da educação infantil | 14,0% | 21,8% |

Os bolsões ficam a até 5 km das unidades, em áreas consolidadas e bem servidas de transporte.
Neles, o acesso físico a empregos e serviços é igual ou melhor que a média da cidade. Para projetos
de trabalho e renda nesses bolsões, o obstáculo está em outras dimensões, como escolaridade e
renda, e não na distância. Já a periferia sul, fora desse raio, tem o pior acesso a empregos da
cidade.

**Entorno de 2 km das unidades em Porto Alegre:**

| unidade | moradores | empregos em 60 min | minutos até saúde | minutos até educação infantil | a mais de 30 min da educação infantil |
|---|---:|---:|---:|---:|---:|
| LJ Otávio Rocha | 85.449 | 96,7% | 8,6 | 12,0 | 0,0% |
| SH Praia de Belas | 86.536 | 94,7% | 9,9 | 15,7 | 8,7% |
| SH João Pessoa | 138.728 | 96,1% | 9,8 | 15,6 | 4,2% |
| SH Iguatemi POA | 91.301 | 90,9% | 10,7 | 26,7 | 33,2% |
| SH Barrasul | 49.111 | 74,0% | 9,5 | 13,1 | 6,2% |
| SH Bourbon Ipiranga | 104.927 | 95,1% | 13,8 | 21,8 | 23,7% |
| SH Bourbon Wallig | 93.875 | 87,8% | 11,5 | 24,8 | 30,1% |
| SH Total | 105.225 | 96,6% | 11,2 | 16,2 | 3,4% |
| SH Center Lar | 75.305 | 76,7% | 12,6 | 19,9 | 10,2% |
| SH Bourbon Teresópolis | 82.122 | 86,9% | 12,4 | 18,3 | 5,5% |
| Aeroporto Salgado Filho | 28.738 | 88,4% | 17,8 | 25,3 | 35,5% |
| Unidade administrativa | 84.986 | 91,4% | 10,5 | 15,9 | 2,5% |

## 4. Como os dados entraram no Atlas

- **Script:** `atlas_v3/extracao/6_ipea.py`, que grava `atlas_v3/dados/dados-ipea.js` (60 KB). Ele
  baixa as duas tabelas do espelho da Base dos Dados, refaz as conferências da seção 2 e para se
  alguma falhar.
- **Catálogo:** 19 indicadores novos do Atlas Brasil, por município, nas categorias de cada tema.
  Mais 6 indicadores de acessibilidade na categoria nova **Mobilidade e acesso**: 4 por bairro e
  setor, 2 só por bairro.
- **Painel do município:** gráficos da série 1991–2010 (IDHM, renda per capita, pobreza e
  mortalidade infantil) para cada um dos sete. Em Porto Alegre, também os números de acesso da
  cidade.
- **Entorno da loja e ficha do bolsão:** novo bloco "Acesso a oportunidades", com a média dos
  setores cobertos e a comparação com a cidade.

**Atribuição ao território.**
- Cada setor de 2022 recebe o valor do hexágono do IPEA que contém o seu ponto representativo.
- O bairro recebe a média dos setores, ponderada pela população.
- É o mesmo método já usado para os indicadores de 2010 por área de ponderação: valores copiados do
  território maior para o setor, sem estimativa.
- O tempo "inf" do IPEA significa nenhum estabelecimento alcançável no limite de cálculo. Ele não
  entra em média de minutos, só na parte da população a mais de 30 minutos.

## 5. O que mais do IPEA vale trazer

1. **IVS por Unidade de Desenvolvimento Humano.** As UDH dividem a região metropolitana em áreas
   menores que o município, com IDHM e IVS de 2010.
   - Precisa da planilha das UDH e da malha das unidades, que não estão no espelho público.
   - Com a central de extração no navegador (versão 3.5), a planilha municipal do IVS já pode ser
     carregada direto.
2. **Mapa das OSCs.** Camada de pontos de organizações da sociedade civil, útil para identificar
   parceiros locais por bairro.
3. **Outros indicadores do Acesso a Oportunidades,** que já estão na mesma tabela: bicicleta,
   horário fora do pico, saúde de média e alta complexidade, ensino médio. Basta acrescentar uma
   linha no dicionário `AOP` do `6_ipea.py`.
4. **Atlas da Violência,** para a série de homicídios desde 1980, como contexto da SSP/RS.
