# Desenvolvimento socioeconômico no entorno das lojas — RMPA

**Versão 2.** Substitui a primeira análise. Refeita sobre a base completa, com um modelo que não
depende da média de cada raio. A seção 2 lista o que mudou. Apresentação correspondente: o deck
"Entorno das lojas — desenvolvimento socioeconômico na RMPA".

## 1. Base e método

**Base.** 4.722 setores censitários do Censo 2022 nos sete municípios (2.383.002 habitantes); 1.650
escolas (Censo Escolar 2025); 567 estabelecimentos de saúde (CNES 2026); indicadores municipais do
SICONFI 2024 e da SSP/RS 2025. Trabalho, renda domiciliar, pobreza e escolaridade de adultos vêm do
**Censo 2010**, levados aos setores de 2022 pela área de ponderação — servem para ordenar
territórios, não para dimensionar programas.

**Por que não a média.** A mediana da renda do responsável entre os setores, ponderada pela
população, é **R$ 2.825**; a média, **R$ 4.374** — 55% acima, puxada por poucos setores muito
ricos. Os 20 entornos de 2 km têm renda média acima da mediana regional. Comparar entornos pela
média faz todas as lojas parecerem estar em área de renda média ou alta.

**O modelo.**

1. **Quintil de renda.** Cada setor é classificado pela renda do responsável. Os limites, ponderados
   pela população da região: Q1 até R$ 1.947 · Q2 até R$ 2.497 · Q3 até R$ 3.387 · Q4 até
   R$ 5.795 · Q5 acima.
2. **Bolsões.** Setores do Q1 a até 600 m uns dos outros formam um bolsão.
3. **Loja mais próxima.** Cada bolsão conta uma vez, atribuído à loja de venda mais próxima
   (aeroporto e unidade administrativa excluídos). Isso evita a dupla contagem: 22 pares de
   unidades estão a menos de 4 km entre si, e os 20 raios de 2 km somados dariam 1,4 milhão de
   pessoas, 59% da região.

## 2. O que mudou em relação à primeira versão

| primeira versão | o que a reanálise mostra |
|---|---|
| Saneamento não é problema no entorno | Não é na média do raio. **Nos setores do Q1, 10,4% dos domicílios têm esgoto inadequado, contra 0,4% no Q5**; 104 mil pessoas vivem em setores do Q1 com menos de 80% de esgoto adequado |
| O público dos programas mora no anel de 2 a 5 km | Vale para 11 das 20 unidades. Em Barrasul, Teresópolis, Center Lar e na unidade administrativa, o anel é *mais rico* que o núcleo — a comunidade está dentro dos 2 km |
| Todos os anéis têm mais população preta ou parda | 15 de 20 |
| 14 de 20 entornos acima da renda média regional | 13 de 20 — e os 20 acima da mediana |
| Agrupamento "Arco Norte de Porto Alegre" | Barrasul e Teresópolis ficam na zona sul. O agrupamento por loja deu lugar aos bolsões |

A causa comum: a primeira versão media cada entorno pela média do raio, que mistura setores ricos e
pobres e esconde os bolsões.

## 3. Onde a rede está

Moradores a até 2, 3 e 5 km das 18 lojas de venda, contados uma vez, por quintil de renda da região:

| raio | moradores | Q1 | Q2 | Q3 | Q4 | Q5 |
|---|---:|---:|---:|---:|---:|---:|
| 2 km | 874.621 | 8,4% | 8,5% | 15,6% | 30,5% | 37,0% |
| 3 km | 1.349.636 | 11,8% | 13,2% | 18,9% | 26,0% | 30,1% |
| 5 km | 1.948.800 | 16,1% | 18,0% | 20,8% | 22,5% | 22,7% |

**A 2 km, 67% dos moradores estão nos dois quintis mais ricos.** Os dois mais pobres somam 148 mil
pessoas a 2 km e 663 mil a 5 km. Na região, cada quintil tem 20% da população.

### Quatro tipos de entorno

| tipo | critério (raio de 2 km) | unidades |
|---|---|---|
| 1 · Comunidade colada à loja | 16% a 26% dos moradores no Q1 | SH Barrasul, Loja Adm Porto Alegre, SH Bourbon Teresópolis, SH Center Lar |
| 2 · Bolsão grande a 2–5 km | até 5% no Q1; bolsão de 14 mil ou mais adiante | SH Bourbon Ipiranga, SH Park Canoas, SH Canoas, SH Iguatemi POA |
| 3 · Renda baixa-média difusa | renda média 8% a 34% abaixo da região | LJ Sapucaia do Sul, SH do Vale, LJ Guaíba, LJ Esteio, SH Gravataí |
| 4 · Centro de renda alta | no máximo 2% no Q1 | LJ Otávio Rocha, SH Praia de Belas, SH João Pessoa, SH Total, SH Bourbon Wallig, CC Canoas |

### Cada unidade, raio de 2 km

Comparada ao **próprio município** e à região. "Setores de borda" é a parcela dos moradores em
setores que a circunferência corta — a incerteza do número daquele raio.

| unidade | município | moradores | renda média | vs. município | vs. região | no quintil mais pobre | setores de borda | tipo |
|---|---|---:|---:|---:|---:|---:|---:|---|
| SH Barrasul | Porto Alegre | 49.111 | R$ 4.881 | -8% | +12% | 26% | 30% | 1 |
| Loja Adm Porto Alegre | Porto Alegre | 84.986 | R$ 4.826 | -9% | +10% | 25% | 28% | 1 |
| SH Bourbon Teresópolis | Porto Alegre | 82.122 | R$ 4.271 | -20% | -2% | 20% | 25% | 1 |
| SH Center Lar | Porto Alegre | 75.305 | R$ 4.330 | -19% | -1% | 16% | 31% | 1 |
| LJ Guaíba | Guaíba | 19.298 | R$ 3.423 | +25% | -22% | 14% | 34% | 3 |
| LJ Sapucaia do Sul | Sapucaia do Sul | 72.924 | R$ 2.865 | +8% | -34% | 14% | 28% | 3 |
| LJ Esteio | Esteio | 37.168 | R$ 3.625 | +15% | -17% | 11% | 22% | 3 |
| SH do Vale | Cachoeirinha | 63.083 | R$ 2.996 | 0% | -32% | 9% | 36% | 3 |
| Aero Salgado Filho | Porto Alegre | 28.738 | R$ 5.183 | -3% | +18% | 8% | 69% | — |
| SH Bourbon Ipiranga | Porto Alegre | 104.927 | R$ 6.992 | +31% | +60% | 5% | 28% | 2 |
| SH Canoas | Canoas | 57.183 | R$ 5.006 | +41% | +14% | 4% | 32% | 2 |
| SH Gravataí | Gravataí | 19.421 | R$ 4.039 | +47% | -8% | 4% | 62% | 3 |
| SH Iguatemi POA | Porto Alegre | 91.301 | R$ 8.453 | +59% | +93% | 2% | 28% | 2 |
| LJ Otávio Rocha | Porto Alegre | 85.449 | R$ 7.102 | +34% | +62% | 2% | 12% | 4 |
| SH Total | Porto Alegre | 105.225 | R$ 8.361 | +57% | +91% | 1% | 20% | 4 |
| CC Canoas | Canoas | 55.262 | R$ 5.353 | +50% | +22% | 1% | 41% | 4 |
| SH Park Canoas | Canoas | 49.017 | R$ 6.261 | +76% | +43% | 1% | 41% | 2 |
| SH Praia de Belas | Porto Alegre | 86.536 | R$ 7.063 | +33% | +61% | 1% | 17% | 4 |
| SH Bourbon Wallig | Porto Alegre | 93.875 | R$ 7.217 | +36% | +65% | 1% | 20% | 4 |
| SH João Pessoa | Porto Alegre | 138.728 | R$ 7.352 | +38% | +68% | 0% | 19% | 4 |

A LJ Guaíba ilustra por que o termo de comparação importa: contra a região está 22% abaixo; contra
o próprio município, 25% acima. A loja fica no centro de Guaíba, e a pobreza do município está em
outro lugar.

## 4. Onde estão as comunidades

**323.725 pessoas em setores do Q1 vivem a até 5 km de alguma unidade**, em 123 bolsões — 68% de
toda a população do Q1 da região (476.553). Os 25 bolsões com 2 mil moradores ou mais somam
264.346 pessoas. É uma população jovem: 25% tem de 15 a 29 anos e 23%, até 14.

### Os 25 bolsões com 2 mil moradores ou mais

| # | território | município | moradores | crianças 0–14 | jovens 15–29 | renda média | em favela | sem fund. 25+ (2010) | loja de venda mais próxima |
|---:|---|---|---:|---:|---:|---:|---:|---:|---|
| 1 | Mário Quintana, Rubem Berta, Passo das Pedras | Porto Alegre | 38.555 | 8.951 | 9.805 | R$ 1.623 | 45% | 39% | SH Center Lar · 3,9 km |
| 2 | Vila São José, Coronel Aparício Borges, Partenon | Porto Alegre | 34.346 | 8.223 | 8.958 | R$ 1.669 | 76% | 40% | SH Bourbon Ipiranga · 3,0 km |
| 3 | Guajuviras | Canoas | 21.514 | 5.646 | 5.512 | R$ 1.490 | 18% | 52% | SH Park Canoas · 4,1 km |
| 4 | Santa Tereza, Cristal, Nonoai | Porto Alegre | 20.987 | 4.902 | 5.509 | R$ 1.578 | 82% | 21% | SH Barrasul · 2,0 km |
| 5 | Harmonia, Mathias Velho | Canoas | 16.094 | 3.352 | 3.874 | R$ 1.803 | 2% | 58% | SH Canoas · 3,3 km |
| 6 | Santa Rosa de Lima, Sarandi | Porto Alegre | 15.821 | 3.318 | 3.736 | R$ 1.639 | 8% | 42% | SH Center Lar · 2,6 km |
| 7 | Bom Jesus, Jardim Carvalho | Porto Alegre | 14.778 | 3.799 | 3.933 | R$ 1.560 | 98% | 30% | SH Iguatemi POA · 2,4 km |
| 8 | Vila Anair A, Caí | Cachoeirinha | 13.674 | 2.847 | 3.272 | R$ 1.676 | 44% | 42% | SH do Vale · 2,1 km |
| 9 | Farrapos, Humaitá | Porto Alegre | 12.940 | 3.207 | 3.522 | R$ 1.562 | 52% | 43% | SH Bourbon Wallig · 4,7 km |
| 10 | — | Sapucaia do Sul | 11.983 | 2.899 | 3.101 | R$ 1.693 | 0% | 57% | LJ Sapucaia do Sul · 2,0 km |
| 11 | Sarandi | Porto Alegre | 7.877 | 1.618 | 1.691 | R$ 1.715 | 100% | 51% | SH Center Lar · 1,6 km |
| 12 | Fátima | Canoas | 6.173 | 1.570 | 1.605 | R$ 1.755 | 33% | 39% | CC Canoas · 3,9 km |
| 13 | Parque Primavera, Jardim Planalto, Santo Inácio | Esteio | 5.659 | 1.400 | 1.507 | R$ 1.632 | 15% | 59% | LJ Esteio · 4,1 km |
| 14 | Tom Jobim | Gravataí | 4.534 | 1.198 | 1.206 | R$ 1.571 | 89% | 41% | SH do Vale · 4,2 km |
| 15 | Santa Rita | Guaíba | 4.470 | 927 | 1.014 | R$ 1.764 | 34% | 46% | LJ Guaíba · 2,5 km |
| 16 | Rincão da Madalena | Gravataí | 4.442 | 1.203 | 1.240 | R$ 1.508 | 100% | 43% | SH Gravataí · 3,9 km |
| 17 | Sarandi | Porto Alegre | 4.165 | 976 | 1.068 | R$ 1.544 | 76% | 46% | SH Center Lar · 1,4 km |
| 18 | Morro Santana | Porto Alegre | 4.048 | 982 | 1.077 | R$ 1.678 | 86% | 44% | SH Iguatemi POA · 3,9 km |
| 19 | Niterói | Canoas | 3.925 | 911 | 952 | R$ 1.815 | 0% | 54% | SH Park Canoas · 4,9 km |
| 20 | São José, Liberdade | Esteio | 3.666 | 774 | 887 | R$ 1.788 | 0% | 36% | LJ Esteio · 2,1 km |
| 21 | Rio Branco | Canoas | 3.364 | 741 | 815 | R$ 1.738 | 0% | 51% | CC Canoas · 5,4 km |
| 22 | Jardim Carvalho, Agronomia | Porto Alegre | 3.039 | 770 | 769 | R$ 1.583 | 100% | 45% | SH Bourbon Ipiranga · 4,4 km |
| 23 | Canarinho | Cachoeirinha + Gravataí | 2.946 | 719 | 740 | R$ 1.502 | 45% | 43% | SH do Vale · 4,6 km |
| 24 | Partenon | Porto Alegre | 2.825 | 600 | 685 | R$ 1.652 | 98% | 29% | SH Bourbon Ipiranga · 1,3 km |
| 25 | Costa e Silva | Porto Alegre | 2.521 | 657 | 677 | R$ 1.508 | 65% | 36% | SH Center Lar · 1,8 km |

Territórios sem bairro são municípios para os quais o IBGE não publica divisão de bairros.

### Por loja de venda mais próxima, sem dupla contagem

| loja | moradores | bolsões | crianças 0–14 | jovens 15–29 |
|---|---:|---:|---:|---:|
| SH Center Lar | 68.939 | 5 | 15.520 | 16.977 |
| SH Bourbon Ipiranga | 40.210 | 3 | 9.593 | 10.412 |
| SH Park Canoas | 25.439 | 2 | 6.557 | 6.464 |
| SH do Vale | 21.154 | 3 | 4.764 | 5.218 |
| SH Barrasul | 20.987 | 1 | 4.902 | 5.509 |
| SH Iguatemi POA | 18.826 | 2 | 4.781 | 5.010 |
| SH Canoas | 16.094 | 1 | 3.352 | 3.874 |
| SH Bourbon Wallig | 12.940 | 1 | 3.207 | 3.522 |
| LJ Sapucaia do Sul | 11.983 | 1 | 2.899 | 3.101 |
| CC Canoas | 9.537 | 2 | 2.311 | 2.420 |
| LJ Esteio | 9.325 | 2 | 2.174 | 2.394 |
| LJ Guaíba | 4.470 | 1 | 927 | 1.014 |
| SH Gravataí | 4.442 | 1 | 1.203 | 1.240 |

### Dois perfis de carência

| | Porto Alegre (12 bolsões) | Canoas, Sapucaia e Esteio (8 bolsões) |
|---|---|---|
| moradores em favela | 8% a 100% — 11 dos 12 com 45% ou mais | 0% a 33% |
| adultos sem fundamental (2010) | 21% a 51% | 36% a 59% — 6 dos 8 com 51% ou mais |
| população preta ou parda | 32% a 61% | 27% a 39% |
| desocupação (2010) | 5% a 8% | 4% a 11% — Guajuviras, 10,6%, a maior dos 123 bolsões |
| natureza da carência | concentrada em favelas: moradia, regularização, serviços | escolaridade e trabalho, fora das favelas |

Um mesmo projeto não serve aos dois.

## 5. O que falta

### Saneamento, dentro dos bolsões

| indicador (Censo 2022) | setores do Q1 | setores do Q5 | região |
|---|---:|---:|---:|
| esgoto inadequado | 10,4% | 0,4% | 3,0% |
| sem abastecimento pela rede geral | 6,3% | 0,6% | 4,5% |
| analfabetismo, 15 anos ou mais | 4,1% | 0,5% | 1,9% |
| moradores por domicílio | 2,83 | 2,22 | 2,48 |

104.221 pessoas vivem em setores do Q1 com menos de 80% de esgoto adequado; nos 10% piores setores
do Q1 o esgoto adequado não passa de 45%. Nos setores de favela, o esgoto inadequado é 12,1%.

### Capital humano

A distância está na escolaridade de adultos: nos bolsões de Canoas, Sapucaia e Esteio, de 36% a 59%
dos adultos de 25 anos ou mais não concluíram o fundamental (2010); na região, 34,3%.

### Os sete municípios

| município | população | renda média | no Q1 | em favela | sem fund. 25+ (2010) | assistência R$/hab | trabalho R$/hab |
|---|---:|---:|---:|---:|---:|---:|---:|
| Porto Alegre | 1.332.845 | R$ 5.317 | 22% | 13,2% | 26,5% | 284 | 2 |
| Canoas | 347.657 | R$ 3.560 | 18% | 2,3% | 38,3% | 134 | 107 |
| Gravataí | 265.074 | R$ 2.740 | 14% | 4,2% | 42,8% | 117 | 0 |
| Sapucaia do Sul | 132.107 | R$ 2.648 | 18% | 1,2% | 45,7% | **57** | 1 |
| Cachoeirinha | 136.258 | R$ 3.008 | 16% | 6,9% | 37,5% | 120 | 2 |
| Guaíba | 92.924 | R$ 2.728 | 25% | 14,9% | 44,3% | 421 | 0 |
| Esteio | 76.137 | R$ 3.139 | 16% | 3,5% | 38,3% | 252 | 14 |

Sem fundamental: valor municipal oficial de 2010. Assistência e trabalho: despesa empenhada em 2024
(SICONFI) sobre a população estimada de 2026; gasto classificado em outras funções não aparece.

**Sapucaia do Sul tem o entorno de loja mais pobre da rede e o menor gasto em assistência social
por habitante** — sete vezes menos que Guaíba. Na função trabalho, só Canoas gasta de forma
relevante. Onde a rede pública é mais fina, um programa privado pesa mais — e encontra menos
contraparte.

## 6. Frentes de projeto

| frente | onde | o número que a sustenta |
|---|---|---|
| Educação de adultos | bolsões de Canoas, Sapucaia e Esteio | 36% a 59% dos adultos sem fundamental (2010) |
| Trabalho e renda | Guajuviras, Canoas | 10,6% de desocupação em 2010, a maior dos 123 bolsões |
| Primeira infância | todos os bolsões | 23% dos moradores têm até 14 anos; falta o dado de creche |
| Saneamento nas favelas | bolsões de Porto Alegre | 104 mil pessoas em setores do Q1 com menos de 80% de esgoto adequado |
| Juventude de 15 a 29 anos | todos os bolsões | 25% dos moradores; falta saber quantos estão fora da escola e do trabalho |

### Territórios candidatos

Critério: os quatro maiores bolsões.

| território | município | moradores | destaque | loja de venda |
|---|---|---:|---|---|
| Mário Quintana e Rubem Berta | Porto Alegre | 38.555 | 8.951 crianças; 45% em favela | SH Center Lar, 3,9 km |
| Vila São José e Partenon | Porto Alegre | 34.346 | 8.223 crianças; 76% em favela | SH Bourbon Ipiranga, 3,0 km |
| Guajuviras | Canoas | 21.514 | 52% sem fundamental; 10,6% de desocupação (2010) | SH Park Canoas, 4,1 km |
| Santa Tereza e Cristal | Porto Alegre | 20.987 | 82% em favela | SH Barrasul, 2,0 km |

Sapucaia do Sul (11.983 moradores, 57% sem fundamental, a 2,0 km da loja) sobe se o peso for a baixa
capacidade pública local. A escolha final depende de três dados que faltam: famílias no CadÚnico
por bolsão, localização dos CRAS e vagas de creche e EJA.

## 7. Lacunas de dados e melhorias possíveis

### Bloqueadores — sem eles não se dimensiona nem se avalia um projeto

1. **Trabalho e renda só existem para 2010.** → RAIS e Novo CAGED (município, atividade, ocupação,
   salário, admissões e desligamentos); PNAD Contínua (recorte metropolitano); amostra do Censo 2022
   quando liberada.
2. **Sem CadÚnico, Bolsa Família e BPC.** É a base de focalização: famílias, renda declarada,
   composição, por CRAS. → CECAD e VIS Data (MDS); desagregação por setor mediante acordo municipal.
3. **Sem a rede de assistência.** CRAS, CREAS, serviços e equipes. → Censo SUAS.
4. **Escolas sem matrícula, sem etapa e sem creche.** "Escolas por criança" conta prédios, não vagas.
   → Censo Escolar; o script de extração precisa passar a guardar o código INEP de cada escola.
5. **Sem resultado educacional.** → IDEB e SAEB por escola, pela mesma chave.
6. **Renda só como média do responsável.** → faixas de rendimento do Censo 2022 por setor.

### Importantes — mudam o desenho do projeto

7. Onde estão os empregos, por atividade → RAIS e CEMPRE.
8. Acesso real por ônibus e Trensurb → GTFS e estações; isócronas no lugar do raio.
9. Internet e computador nos domicílios → agregados do Censo 2022.
10. Jovens fora da escola e do trabalho → PNAD Contínua.
11. Recortes por sexo em trabalho, renda e escolaridade.
12. Violência por bairro → SSP/RS e prefeituras (a base só tem o municipal).
13. Habitação: déficit e regularização fundiária → prefeituras.
14. Saúde de desfecho: mortalidade infantil, mães adolescentes, internações evitáveis → SIM, SINASC,
    SIH, SISAB.
15. Vínculo SUS dos estabelecimentos de saúde → CNES (o script atual não extrai).

### Desejáveis

16. Série histórica 2000–2010–2022, para saber se cada território melhora ou piora.
17. Efeito da enchente de 2024 por setor.
18. Polígonos oficiais das comunidades.
19. Organizações comunitárias e lideranças por bolsão.

### Já preparado no código

- Despesa municipal em educação, com educação infantil, fundamental e EJA — falta executar o script.
- IDHM, IVS, IDESE e FIRJAN — faltam as planilhas oficiais.

## 8. Limites

- **Borda do raio.** De 12% a 69% dos moradores de um raio de 2 km vivem em setores cortados pela
  borda (mediana 28%). Vale o padrão entre raios, não o número de um raio isolado.
- **Resolução de 2010.** As taxas de 2010 vêm de cerca de 100 áreas de ponderação; um raio de 2 km
  contém de 3 a 10.
- **2010 ordena, não mede.** Correlação de postos entre a renda de 2022 e os indicadores de 2010, setor
  a setor: 0,70 (renda per capita), 0,69 (escolaridade), 0,65 (pobreza).
- **Distância em linha reta.** O raio e a atribuição de bolsões ignoram o Guaíba, a BR-116 e a
  ferrovia.
- **Os indicadores de 2010 são anteriores à pandemia e à enchente de 2024.**

Bases tabuladas: `entorno-lojas.csv` (20 unidades × 4 raios × 34 colunas) e
`bolsoes-quintil-inferior.csv` (123 bolsões, com coordenadas).
