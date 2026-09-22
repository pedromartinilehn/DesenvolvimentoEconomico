# Desenvolvimento socioeconômico no entorno das lojas — RMPA

Análise da base do Atlas RMPA v2 para desenhar projetos de desenvolvimento comunitário
no entorno das 20 unidades.

## Base e método

- **Censo 2022 (IBGE), por setor censitário** — população, cor/raça, idade, alfabetização,
  domicílios, saneamento, rendimento da pessoa responsável, favelas e comunidades urbanas.
  São 90 indicadores no nível setor, que é a base do cálculo de entorno.
- **Censo 2010 (IBGE)** — trabalho, informalidade, previdência, renda domiciliar per capita,
  pobreza, Gini e escolaridade de 25+. São taxas de 2010 atribuídas ao território de 2022.
- **CNES 2026 e Censo Escolar/INEP 2025** — 567 estabelecimentos de saúde e 1.650 escolas
  georreferenciados.
- **SICONFI/STN 2024 e SSP/RS 2025** — finanças e segurança, nível municipal.

Agreguei por raio somando os setores cujo ponto representativo cai dentro do círculo. As
taxas de 2010 eu agreguei por **média ponderada pela população de 2022** — é um cálculo meu,
não um valor publicado. Os clusters usam **união de setores**, sem dupla contagem.

**Três limites que valem para tudo o que segue:**

1. Os indicadores de trabalho, renda domiciliar, pobreza e escolaridade adulta são de **2010**.
   Servem para **ordenar** territórios, não para dimensionar programas hoje.
2. O raio é euclidiano. Acessibilidade real (ônibus, Trensurb, barreiras físicas) não está na base.
3. Setores de borda entram inteiros ou ficam de fora.

---

## Retrato: os 20 entornos contra a região

Raio de 2 km. Referência: soma dos 4.722 setores dos 7 municípios.

| | RMPA | menor entorno | maior entorno |
|---|---:|---|---|
| renda da pessoa responsável | R$ 4.374 | R$ 2.865 (LJ Sapucaia) | R$ 8.453 (SH Iguatemi) |
| % preta ou parda | 23,8% | 10,4% (Wallig) | 32,3% (Loja Adm POA) |
| % crianças 0–14 | 17,0% | 7,2% (Otávio Rocha) | 17,0% (Sapucaia, do Vale, Adm) |
| % 60 anos ou mais | 20,0% | 18,7% (do Vale) | 29,9% (SH Total) |
| % em favelas e comunidades | 9,3% | 0,0% | 24,2% (SH Barrasul) |
| pobreza 2010 | 15,8% | 4,6% (Wallig) | 17,6% (Sapucaia) |
| sem fundamental, 25+ (2010) | 34,3% | 10,5% (SH Total) | 45,0% (Sapucaia) |
| superior completo, 25+ (2010) | 16,4% | 4,6% | 49,1% (SH Total) |

**14 dos 20 entornos têm renda acima da média regional.** A rede está, em regra, no lado
mais rico do território.

---

## Achado 1 — onde o problema **não** está

Isto é o mais importante para não desenhar o projeto errado.

| indicador | faixa nos 20 entornos | RMPA |
|---|---|---:|
| esgotamento sanitário adequado | 95,7% – 99,8% | 96,1% |
| domicílios em cortiço ou estrutura degradada | 0,0% – 0,7% | 0,1% |
| analfabetismo (15+) | 0,5% – 2,7% | 1,9% |
| abastecimento de água por rede | acima de 98% em todos | — |

Saneamento, moradia precária e alfabetização **não são o gargalo** em nenhum dos 20 entornos,
nem nos mais pobres. Projetos de infraestrutura sanitária ou de alfabetização de adultos
resolveriam um problema que já está resolvido.

Vale para equipamentos também: as UBS por habitante são **maiores** nos entornos pobres
(Barrasul 2,04/10 mil, Esteio 1,88, Sapucaia 1,78) do que nos ricos (Praia de Belas 0,12,
João Pessoa 0,29, SH Total 0,38). A atenção básica do SUS está onde deve estar. Há 58 CAPS
e 111 UBS no conjunto dos raios.

---

## Achado 2 — onde o problema **está**

A carência é de **capital humano e de inserção no trabalho**, não de infraestrutura.

| | Trensurb Norte | Vale/Gravataí | Guaíba | Centro-sul POA |
|---|---:|---:|---:|---:|
| sem fundamental, 25+ (2010) | 39,6% | 39,3% | **42,9%** | 24,8% |
| superior completo, 25+ (2010) | 9,2% | **6,3%** | 7,4% | 28,6% |
| desocupação (2010) | 6,5% | **7,4%** | 7,1% | 5,5% |
| sem previdência (2010) | 22,8% | 24,0% | **25,5%** | 22,6% |
| pobreza (2010) | 16,6% | 16,7% | **18,4%** | 11,8% |
| renda da pessoa responsável (2022) | R$ 3.355 | **R$ 2.920** | R$ 3.001 | R$ 6.094 |

Clusters em raio de 5 km, união de setores.

A distância em escolaridade superior é de **6,3% a 28,6% — quase cinco vezes**. Em
escolaridade fundamental incompleta, de 24,8% a 42,9%.

**Informalidade é a armadilha analítica desta base.** A taxa é quase plana: 32% a 38% em
todos os entornos, e o valor mais alto é do **SH Total** (38,6%), o mais rico. O que muda não
é a taxa, é a natureza: no entorno rico, "conta própria" é profissional autônomo; no
periférico, é trabalho precário. A base de 2010 não distingue os dois. **Não use
informalidade para priorizar território.**

---

## Achado 3 — a rede está no lado rico de uma fronteira

O dado mais acionável do conjunto. Comparando a renda no raio de 1 km e no de 5 km:

| loja | R$ 1 km | R$ 5 km | Δ | pop. no anel 2–5 km | renda no anel |
|---|---:|---:|---:|---:|---:|
| SH Park Canoas | 9.850 | 3.818 | **−61%** | 233 mil | R$ 3.275 |
| CC Canoas | 6.962 | 3.882 | **−44%** | 220 mil | R$ 3.481 |
| LJ Guaíba | 5.060 | 3.001 | **−41%** | 51 mil | R$ 2.837 |
| SH Iguatemi POA | 10.585 | 7.134 | −33% | 418 mil | R$ 6.847 |
| LJ Esteio | 4.380 | 3.048 | −30% | 150 mil | R$ 2.900 |
| SH Canoas | 5.605 | 3.902 | −30% | 205 mil | R$ 3.572 |

Essas unidades têm um anel imediato de renda alta cercado por território muito mais pobre.
**Todos os 20 anéis de 2–5 km são mais pobres que o núcleo de 2 km em composição racial**
(19% a 27% de população preta ou parda, contra 10% a 32% no núcleo).

Ou seja: o público dos programas **não mora no raio de 2 km — mora no anel seguinte.**
Desenhar o alcance pelo raio curto exclui exatamente quem se quer alcançar.

---

## Achado 4 — a capacidade municipal é inversa à necessidade

Despesa empenhada em assistência social por habitante, SICONFI/STN 2024:

| município | R$/hab | pobreza 2010 no entorno |
|---|---:|---:|
| **Sapucaia do Sul** | **57** | 17,6% (a maior de todas) |
| Gravataí | 117 | 11,2% |
| Cachoeirinha | 120 | — |
| Canoas | 134 | 10,0–10,5% |
| Esteio | 252 | 10,9% |
| Porto Alegre | 284 | 8,4–15,4% |
| Guaíba | 421 | 15,4% |

**Sapucaia do Sul tem o entorno mais pobre da rede e o menor gasto em assistência social por
habitante — sete vezes abaixo de Guaíba.** É onde um programa privado tem o maior valor
marginal, porque há menos estrutura pública para complementar. É também onde há menos
contraparte institucional para se apoiar — os dois lados da mesma moeda.

---

## Clusters e as comunidades nomeadas

União de setores, sem dupla contagem. Os raios das lojas se sobrepõem muito: 22 pares de
unidades estão a menos de 4 km entre si, e a soma dos 20 entornos de 2 km dá 1,4 milhão de
pessoas — 59% da população regional, com repetição.

### 1. Eixo Trensurb Norte — Esteio, Sapucaia do Sul, Canoas
5 unidades · **520.040 moradores** em 5 km · R$ 3.355 · 93.924 crianças de 0–14
Pior escolaridade adulta do conjunto (39,6% sem fundamental, 9,2% com superior).
2,12 escolas públicas por mil crianças. 16 comunidades, 11.340 moradores.
Conectado por trilho — o único cluster com transporte de alta capacidade.

### 2. Arco Norte de Porto Alegre — Center Lar, Barrasul, Bourbon Teresópolis, Loja Adm
4 unidades · **291.524 moradores** em 2 km, 938.663 em 5 km
**42 comunidades e 59.291 moradores em favelas dentro de 2 km — 20,3% do entorno.**
Em 5 km são 87 comunidades e 129.837 moradores.
Menor oferta de escola pública por criança de toda a rede: **1,82 por mil**.
É a maior concentração de população em comunidades a curta distância de uma unidade.

Comunidades dentro de 2 km, por unidade:
- **SH Barrasul** (12, 11.880 moradores): Vila Gaúcha · Vila Figueira · Vila Cruzeiro do Sul · Vila Arapeí · Ecológica · Vila Cristal · Vila N. Sra. das Graças · Arabutã Pedreira · Vila Mato Grosso · Vila Orfanatrófio II · Vila Caí · Irmã Ermelinda
- **Loja Adm POA** (12, 18.806): Vila Divinéia/Vila Pinto/Vila Mato Sampaio · Colina do Prado · Vila Sudeste · Ceres · Ocup. Ernesto Pellanda · Beco da Aquiles · Beco Vila da Paz · Vila Santa Helena · Vila Brasília I e II · Vila Juliano Moreira · Vila São Judas Tadeu
- **SH Bourbon Teresópolis** (11, 16.673): Vila Santa Clara · Colina Verde · Vila Maria da Conceição · Vila Tronco · Vila Orfanatrófio I · Vila Glorinha · Vila Graciliano · Vila Jardim Marabá · Vila Jardim Europa II · Vila Chácara Sperb · Vila Mariano de Matos II
- **SH Center Lar** (7, 11.932): Vila Minuano · Dique do Sarandi · Vila Nova Brasília · Vila Asa Branca · Vila Ipê/São Borja · Vila Esperança Cordeiro · Vila Amazônia

### 3. Vale / Gravataí — SH do Vale, SH Gravataí
2 unidades · **335.859 moradores** em 5 km · **R$ 2.920, a menor renda de todos os clusters**
Maior desocupação (7,4%) e menor escolaridade superior (6,3%) da rede.

### 4. Guaíba
1 unidade · 70.219 moradores em 5 km · R$ 3.001
Maior pobreza (18,4%) e pior escolaridade fundamental (42,9%). **17,2% do entorno de 2 km
mora em comunidades** — 5 comunidades, 3.315 moradores: Chega Mais · Ipê · Vila Esperança ·
Mato Alto · Vila dos Brigadianos.
Escala pequena, carência aguda, e o município com o **maior** gasto em assistência por
habitante (R$ 421) — ou seja, há contraparte pública forte.

---

## Frentes de projeto que os dados sustentam

Derivadas do Achado 2, na ordem em que a base as sustenta.

**1. Conclusão da educação básica de adultos.** 39% a 43% dos adultos de 25+ nos clusters
periféricos não concluíram o fundamental (2010). É o maior desnível medido e o que mais
trava a entrada em emprego formal. Público: EJA, certificação, ENCCEJA.

**2. Qualificação técnica e profissionalizante — não superior.** Escolaridade superior de
6,3% a 9,2% nos clusters periféricos. Fechar essa distância via universidade é um horizonte
de década; qualificação técnica opera em meses. Faltam dados para dizer *em quê* — ver lacuna 9.

**3. Formalização e previdência.** 22,8% a 25,5% sem contribuição previdenciária, 18% a 25%
por conta própria. Apoio a MEI, regularização e acesso a crédito.

**4. Primeira infância e contraturno.** 93.924 crianças de 0–14 no Trensurb Norte, 140.434 no
Arco Norte, 60.407 no Vale/Gravataí. A oferta de escola pública por criança é a mais baixa
justamente onde há mais crianças (1,73 a 2,12 por mil, contra 2,29 no centro-sul de POA).
**Atenção:** é contagem de estabelecimentos, não de vagas — ver lacuna 5.

**5. Jovens de 15 a 29.** 19% a 21% da população em todos os clusters — cerca de 110 mil no
Trensurb Norte em 5 km. É a faixa de transição escola-trabalho, e a base não permite
identificar quem está fora de ambos — ver lacuna 11.

---

## Alinhamento comercial

*Seção separada, como combinado — não entra nos critérios da análise acima.*

O Achado 3 é onde as duas lógicas convergem. As unidades com queda acentuada de renda entre
1 km e 5 km têm, no anel de 2–5 km, uma população grande, próxima e de baixa renda que ainda
não é base de consumo:

| unidade | pop. no anel 2–5 km | renda no anel | sem fundamental |
|---|---:|---:|---:|
| SH Iguatemi POA | 418 mil | R$ 6.847 | 21,5% |
| SH Park Canoas | 233 mil | R$ 3.275 | 37,7% |
| CC Canoas | 220 mil | R$ 3.481 | 37,0% |
| SH Canoas | 205 mil | R$ 3.572 | 37,0% |
| SH do Vale | 185 mil | R$ 2.769 | 40,4% |
| LJ Esteio | 150 mil | R$ 2.900 | 41,9% |

**O Eixo Trensurb Norte é onde as duas lógicas mais se sobrepõem:** 520 mil pessoas, cinco
unidades já instaladas, pior escolaridade da rede, e transporte de trilho que torna o
deslocamento até as lojas viável. Renda e consumo crescendo ali chegam à loja por um caminho
que já existe.

**Onde elas divergem, e vale dizer com clareza:** Guaíba tem a maior carência relativa e o
menor retorno comercial — 70 mil pessoas, uma unidade. Sapucaia do Sul tem o entorno mais
pobre e a menor capacidade pública de contraparte. Um programa escolhido só por retorno de
consumo não iria a nenhum dos dois; um escolhido só por impacto iria aos dois primeiro. A
decisão é de peso entre os dois critérios, e é melhor que seja explícita.

---

## Lacunas de dados

### Bloqueadores — sem isto não se dimensiona nem se avalia um programa

**1. Todo o bloco de trabalho e renda é de 2010 — 16 anos de defasagem.**
Desocupação, informalidade, emprego formal, conta própria, previdência, renda domiciliar
per capita, pobreza, Gini e escolaridade de 25+. Entre 2010 e hoje passaram duas recessões,
a pandemia e a enchente de 2024. **Ordenam territórios; não medem nada hoje.**
→ RAIS e Novo CAGED (município, CNAE, ocupação, faixa salarial, admissões e desligamentos
mensais); PNAD Contínua (recorte metropolitano); amostra do Censo 2022 quando o IBGE liberar.

**2. Não há CadÚnico.** É *a* base operacional de focalização: famílias cadastradas, renda
declarada, composição familiar, por CRAS e por bairro. Sem ela não há lista de beneficiários,
linha de base nem medição de resultado.
→ CECAD/VIS Data (municipal, público); desagregação por setor mediante acordo com o município.

**3. Não há Bolsa Família nem BPC.** Beneficiários e valores por município e bairro.
→ VIS Data/MDS.

**4. Não há a rede socioassistencial.** CRAS, CREAS, centros de convivência, equipes e
serviços. Sem isso não se sabe quais comunidades têm cobertura nem com quem fazer parceria.
→ Censo SUAS/MDS.

**5. Escolas são pontos, sem matrícula nem etapa.** "Escolas por mil crianças" conta prédios,
não vagas — uma escola grande e uma pequena pesam igual. Também não há separação de creche,
pré-escola, fundamental, médio e EJA. **Creche é o determinante mais direto da participação
das mulheres no mercado de trabalho**, e é justamente o que falta ver.
→ Microdados do Censo Escolar/INEP, que o Atlas já usa para os pontos: basta trazer matrículas
por etapa e a lista de turmas de EJA.

**6. Não há resultado educacional.** IDEB, SAEB, abandono, reprovação, distorção idade-série.
Sem isso não se distingue falta de escola de escola que não funciona.
→ INEP, por código de escola — junção direta com os pontos que já existem na base.

**7. A renda de 2022 é só a da pessoa responsável.** Não há distribuição de renda domiciliar
nem faixas de rendimento por setor. A média esconde a dispersão, e é a dispersão que importa.
→ Tabelas de classes de rendimento do Censo 2022 por setor.

### Importantes — mudam o desenho dos projetos

**8. Não há onde estão os empregos.** Estabelecimentos por CNAE e porte, por bairro. Sem isso,
qualificação profissional é chute: não se sabe qual setor contrata ali.
→ CEMPRE/IBGE e RAIS por município e CNAE.

**9. Não há acessibilidade real.** Linhas de ônibus, estações da Trensurb, tempo de
deslocamento. O raio de 2 km é euclidiano e ignora o Guaíba, a BR-116 e a ferrovia como
barreiras. Uma comunidade a 1,5 km em linha reta pode estar a 40 minutos.
→ GTFS da EPTC e das prefeituras; estações da Trensurb; isócronas em vez de círculos.

**10. Não há acesso digital.** Domicílios com internet e com computador, por setor —
está no Censo 2022 e não foi trazido. Determina se um programa pode ter componente digital.
→ Agregados do Censo 2022 por setor.

**11. Não há jovens fora da escola e fora do trabalho.** Os 15–29 são 19% a 21% da população
dos clusters, mas não dá para saber quem está estudando, trabalhando, ambos ou nenhum.
→ PNAD Contínua (metropolitano) e amostra do Censo 2022.

**12. Nada é desagregado por sexo além da contagem populacional.** Participação, ocupação,
renda e escolaridade por sexo mudariam completamente o desenho de um programa de renda.
→ Censo 2010 já traz; RAIS e PNADC também.

**13. Segurança só existe no nível municipal.** Porto Alegre com 173 homicídios e 28.283
furtos em 2025 não diz nada sobre a Vila Tronco ou o Dique do Sarandi. A SSP/RS e o
Observatório da PMPA publicam por bairro e por região.
→ Indicadores criminais por bairro.

**14. Falta a despesa municipal em educação.** O Atlas traz saúde, assistência, segurança,
trabalho e agricultura, mas não educação (função 12 do SICONFI). É a maior rubrica social
dos municípios e a que mais importa para as frentes 1 e 4.
→ Mesma chamada de API que já busca as demais funções — acréscimo trivial.

**15. Não há habitação.** Déficit, regularização fundiária, programas em curso.
→ DEMHAB/PMPA e secretarias municipais.

**16. Não há saúde de desfecho.** Mortalidade infantil, nascidos vivos de mães adolescentes,
internações sensíveis à atenção básica, cobertura da Estratégia Saúde da Família. Há a rede
instalada (CNES), não o resultado.
→ SIM, SINASC, SIH e e-SUS/SISAB, por município e por bairro.

### Desejáveis

**17.** Série histórica: a base é uma fotografia. Sem 2000–2010–2022 não se sabe se um
território está melhorando ou piorando — e isso muda onde investir.
**18.** Impacto da enchente de 2024 por setor: atingiu diretamente vários dos territórios
deste recorte e não aparece em lugar nenhum da base.
**19.** Contorno das comunidades: o Atlas tem os setores classificados como FCU, mas não os
polígonos oficiais das 125 comunidades de POA.
**20.** Associações, ONGs e lideranças por comunidade — não é dado estatístico, é o que
viabiliza a execução.

### Limitações que dado novo não resolve

**21.** Setor de borda entra inteiro ou fica de fora do raio.
**22.** As taxas de 2010 foram copiadas da área de ponderação para o setor de 2022: o método
é do próprio Atlas e está documentado. Contagens não foram copiadas, só taxas.
**23.** O IBGE omite células com poucos casos: as contagens de indígenas e quilombolas por
setor são piso, não total.
**24.** Os raios se sobrepõem fortemente. Qualquer soma entre unidades conta gente duas vezes —
por isso os clusters aqui usam união de setores.

---

## O que não dá para decidir com esta base

Dá para dizer **onde** atuar: a ordenação dos territórios é robusta, porque combina renda de
2022 (atual), composição racial e etária de 2022 e localização de comunidades de 2022.

Não dá para dizer **quanto** nem **em quê**, com a base atual:

- quantas famílias em cada comunidade, e em que faixa de renda — falta CadÚnico;
- quantas vagas de creche faltam — falta matrícula por etapa;
- quais ocupações contratam no território — falta RAIS/CEMPRE;
- quantos jovens estão fora da escola e do trabalho — falta PNADC/amostra 2022;
- se a situação melhorou ou piorou desde 2010 — falta série histórica.

**As lacunas 1, 2 e 5 são as que mais rendem por esforço:** RAIS/CAGED e CadÚnico são
públicas e de obtenção direta, e as matrículas do Censo Escolar vêm do mesmo arquivo que o
Atlas já processa para os pontos das escolas.
