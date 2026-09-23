# Auditoria do Atlas RMPA v2 — arquivos, dados e modelos

Revisão completa do pacote: o que cada arquivo faz, se os dados são consistentes com o que o
Atlas afirma sobre eles, se os modelos de cálculo estão corretos, e o que a tela efetivamente
mostra. Cada problema abaixo foi reproduzido no navegador, sobre a base completa.

## Resumo

**A base de dados está sólida.** As somas batem exatamente, a supressão do IBGE é residual e o
modelo que leva as taxas de 2010 aos setores de 2022 reproduz os valores municipais oficiais.

**A interface tem erros visíveis, e quase todos têm a mesma causa:** o Atlas foi ampliado de
Porto Alegre para sete municípios, mas partes do código ainda tratam "todos os bairros" como
se fossem Porto Alegre. O resultado são números da região inteira exibidos com rótulo de POA,
um percentual de 178,6% e um "NaN" no painel de abertura.

> **Atualização:** os seis itens pontuais da seção 7 foram corrigidos — ver lá. Restam a
> classificação por quantis (2.7), os resquícios de "Atlas de POA" (2.8) e os itens estruturais.

| | achados |
|---|---:|
| erros visíveis na interface | 8 (6 corrigidos) |
| problemas de dados e cadastro | 4 |
| limitações de modelo a declarar | 4 |
| lacunas no pipeline de extração | 6 |
| verificações que passaram | 10 |

---

## 1. Inventário

| arquivo | tamanho | papel |
|---|---:|---|
| `index.html` | 14 KB | casca da aplicação; carrega os 8 arquivos de dados em paralelo |
| `atlas.js` | 175 KB | toda a lógica: catálogo, decodificação, mapa, painéis, entorno |
| `atlas.css` | 20 KB | estilos |
| `atlas-rmpa.html` | 1,3 MB | versão standalone, gerada por `build_single.py` |
| `dados/dados-setores.js` | 687 KB | 4.722 setores: geometria, 49 campos do Censo 2022, dicionários |
| `dados/dados-estimados.js` | 171 KB | 12 taxas do Censo 2010 por setor e por bairro |
| `dados/dados-pontos.js` | 93 KB | 1.650 escolas, 567 estabelecimentos de saúde, 20 unidades Renner |
| `dados/dados-bairros.js` | 90 KB | 148 bairros: geometria, campos, pirâmide, favelas, omissões |
| `dados/dados-municipios.js` | 53 KB | 7 municípios dissolvidos a partir dos setores |
| `dados/dados-servicos.js` | 8 KB | indicadores municipais: SICONFI 2024, SSP/RS 2025, contagens |
| `dados/dados-nucleo.js` | 5 KB | metadados, escalas, municípios, taxas municipais 2010, PIB |
| `dados/dados-indices.js` | < 1 KB | índices sintéticos (vazio até rodar o script 4) |
| `extracao/1_…4_*.py` | — | pipeline de atualização (seção 6) |

**Modelo de dados.** Os arquivos são JavaScript com um objeto literal. Geometrias e colunas
numéricas vêm codificadas como *polyline* (inteiros com sinal em base 64, com escala por
campo); zero codifica "célula ausente". É compacto e decodifica em ~11 ms para os 4.722 setores.

**Modelo de cálculo.** Razões e percentuais nunca são armazenados: `derivados()` os calcula a
partir das contagens. Bairros e municípios são somas de setores; a renda de bairro é média
ponderada pelo número de responsáveis. O entorno de loja soma setores cujo ponto representativo
cai no raio.

---

## 2. Erros visíveis na interface

### 2.1 Números da região inteira exibidos como de Porto Alegre — **alta**

O objeto `MUN` (`atlas.js:491`) nasce com os valores corretos de Porto Alegre. No boot
(`atlas.js:2690–2700`), três campos são preenchidos ou **sobrescritos** por somas feitas sobre os
148 bairros — que hoje cobrem os 7 municípios, não só POA:

| campo | valor de POA | valor exibido | o que é |
|---|---:|---:|---|
| `fcu_pop` | 175.519 (constante original) | **222.113** | favelas dos 7 municípios |
| `pop_reportada` | 1.330.054 (constante original) | **2.379.939** | população dos 7 municípios |
| `m_resp_renda` | R$ 5.317 (recalculado sobre os setores de POA) | **R$ 4.373,96** | média da RMPA |

O painel de abertura diz "Somas dos 94 bairros" e mostra, sob esse título, 566.589 pessoas
pretas ou pardas, 2.645 indígenas, 2.449 quilombolas e 222.113 moradores em favelas — todos
totais dos sete municípios. A renda de R$ 4.373,96 aparece ao lado do IDHM de Porto Alegre.

### 2.2 "NaN moradores" no painel de abertura — **alta**

`atlas.js:1000` usa `MUN.pop`, campo que não existe (o nome correto é `pop_2022`). O texto
exibido é: *"com NaN moradores no total — por isso alguns denominadores ficam em 2.379.939, e
não em NaN."*

### 2.3 Cobertura de 178,6% da população — **alta**

O selo de cobertura (`renderProv`) divide a população coberta por `MUN.pop_2022` — a de Porto
Alegre — também nos níveis bairro e setor, que abrangem os sete municípios. Exemplo real, nível
setor, População masculina: *"4.634 de 4.722 setores com dado · 178,6% da população"*.

### 2.4 "Participação na população do município" errada fora de POA — **média**

`derivados()` calcula `pop_pct_mun` sempre sobre a população de Porto Alegre. O bairro que
representa Gravataí inteiro aparece com 19,9%; Cachoeirinha inteira, 10,2%.

### 2.5 Painel de entorno diz "vs. POA", mas compara com a RMPA — **alta**

O termo de comparação (`refsCidade`, antes o `CIDADE` de `entornoHTML`) soma os 148 bairros, ou
seja, os sete municípios. O rótulo diz "vs. POA", o rodapé diz "as comparações são contra o
total de Porto Alegre" e a ficha de metodologia repete. Os três estão errados.

E o termo de comparação útil nem é esse. A LJ Guaíba aparece como **−22% de renda "vs. POA"**;
contra o próprio município ela está **+25%** — a loja fica no centro de Guaíba, e a pobreza do
município está em outro lugar. Com o rótulo atual, a leitura sai invertida.

### 2.6 "Equipamentos públicos no raio" inclui privados — **média**

O bloco soma escolas privadas (listadas como "Privada" logo abaixo) e todos os
estabelecimentos de saúde. O CNES extraído não traz vínculo com o SUS, então não há como separar.

### 2.7 Classificação por quantis colapsa em indicadores com muitos zeros — **média**

No nível setor, 91% dos setores têm zero morador em favela. As quebras por quantil saem
`[0, 0, 0, 0]`: o mapa perde as classes e a legenda repete "0 – 0". O mesmo ocorre com
domicílios sem banheiro (99,7% zeros), precários (96,8%), indígenas (90,8%) e quilombolas (97,5%).

### 2.8 Resquícios de "Atlas de Porto Alegre" — **baixa** · ✅ corrigido (set/2026)

Enquadramento inicial e botão "Enquadrar Porto Alegre" só cobrem POA; a atribuição do mapa cita
apenas SMUrb/PMPA e ObservaPOA; a tela de erro diz "Atlas POA"; a observação do indicador de
área diz que os bairros somam 472,81 km² — hoje somam 1.577,75 km², porque incluem os outros
municípios; mensagem de indicador municipal diz "disponível apenas para Porto Alegre".

*Situação:* botão "Enquadrar o mapa"; atribuição com IBGE, SMUrb/PMPA, INEP, DATASUS, SICONFI e
SSP/RS; tela de erro "Atlas RMPA"; a observação de área diz que 472,81 km² são os 94 bairros de
Porto Alegre; indicadores só de Porto Alegre saíram da lista do mapa e ficam no painel de abertura.

---

## 3. Dados e cadastro

**3.1 Unidades Renner sem município.** O bloco `lojas` de `dados-pontos.js` não tem o campo `m`,
ao contrário de escolas e saúde. Consequência: chip de município vazio no painel, e o painel não
tem como comparar com o município. Recalculado por ponto-no-polígono, todas caem nos 7
municípios, exceto a **Loja Adm Porto Alegre, que fica fora do polígono** (a 170 m do setor mais
próximo — provavelmente na margem, onde a malha dissolvida dos setores não cobre).

**3.2 Unidades não comerciais tratadas como lojas.** O aeroporto e a unidade administrativa entram
nas análises de entorno. Para desenvolvimento territorial podem ficar como presença; para
qualquer leitura de consumo, não são pontos de venda.

**3.3 Fonte das coordenadas: Google Places.** O cadastro interno de lojas é a fonte primária
natural — mais confiável e sem dependência de termos de uso de terceiros.

**3.4 A renda do Atlas é a média, e a média engana nesta base.** Mediana da renda do responsável
entre os setores (ponderada pela população): **R$ 2.825**. Média: **R$ 4.374**, 55% acima.
Todos os 20 entornos têm renda média acima da mediana regional. Métricas de distribuição
(quintis) descrevem o território muito melhor — ver a análise de entorno.

---

## 4. Modelos — o que foi verificado e está correto

| verificação | resultado |
|---|---|
| soma dos setores = população municipal, nos 7 municípios | exata |
| população de POA = 1.332.845, como afirma o catálogo | exata |
| favelas em POA: 125 comunidades, 175.519 moradores | batem |
| indígenas (2.004) e quilombolas (2.189) em POA | batem |
| população sem dado de renda por supressão do IBGE | 0,13% |
| soma de cor/raça sobre a população | 99,75% |
| agregação dos bairros por nome IBGE dentro do município | consistente; recomputação espacial diverge > 15% só em Vila Conceição |
| taxas de 2010 levadas aos setores, reponderadas pela população de 2022 | reproduzem o municipal oficial com diferença ≤ 1 p.p., exceto escolaridade em POA (~2,5 p.p.) |
| razão de dependência acima de 100 em 75 setores | legítima: mais dependentes que pessoas em idade ativa |
| códigos de tipo de estabelecimento e de rede escolar | batem com as legendas |

A diferença de escolaridade em POA na reponderação não é erro: a população cresceu mais onde a
escolaridade era menor, então pesar 2010 pela população de 2022 puxa a média para baixo.

## 5. Modelos — limitações a declarar

**5.1 Raio por ponto representativo tem incerteza grande.** Estimei a população de setores que
cruzam a circunferência do raio. No raio de 2 km ela vai de **12% (LJ Otávio Rocha) a 69%
(Aeroporto)**, com mediana de 28%. Valores de um raio isolado são frágeis; o que é robusto é o
padrão entre raios. A correção é interpolação areal (ponderar cada setor pela fração da área
dentro do círculo).

**5.2 As taxas de 2010 têm resolução de área de ponderação, não de setor.** São ~99 valores
distintos para 4.722 setores. Guaíba e Esteio têm 5 áreas cada; Cachoeirinha, 6; Sapucaia, 7.
Um raio de 2 km contém de 3 a 10 valores distintos. Diferenças entre lojas nesses indicadores
refletem poucas áreas.

**5.3 As taxas de 2010 ainda ordenam, mas não substituem.** Correlação de postos (Spearman),
setor a setor, entre renda de 2022 e indicadores de 2010: 0,70 com renda per capita, 0,69 com
escolaridade, 0,65 com pobreza. Boa para ordenar territórios; insuficiente para dimensionar.

**5.4 Raios se sobrepõem.** 22 pares de unidades estão a menos de 4 km. A soma dos 20 entornos de
2 km dá 1,4 milhão de pessoas, 59% da região, com repetição. Qualquer total entre lojas precisa
ser por união de setores.

---

## 6. Pipeline de extração

| script | o que faz | lacuna |
|---|---|---|
| `1_servicos_municipais.py` | SICONFI, SSP/RS, contagens de equipamentos | população 2026 fixa no código; URL da SSP com nome de arquivo datado; exercício 2024 fixo |
| `2_atualiza_cnes.py` | CNES via geobr, 15 tipos | não guarda gestão nem vínculo SUS — impede separar público de privado |
| `3_atualiza_escolas.py` | Censo Escolar via geobr | **não guarda o código INEP da escola** — impede juntar IDEB, matrículas e etapas |
| `4_indices_municipais.py` | IDHM, IVS, IDESE, FIRJAN | pronto; nenhuma planilha baixada ainda |
| `build_single.py` | gera o standalone | ok |

Duas pendências operacionais: **a despesa em educação foi adicionada ao script 1, mas o script
não foi executado** (o ambiente não tem acesso à API do Tesouro) — `dados-servicos.js` ainda não
tem os campos. E a ordem importa: o script 1 lê `dados-pontos.js`, então roda depois do 2 e do 3.

Não há teste automatizado no repositório. A sonda de 16,6 KB usada para validar as otimizações
(contagens, somas, quebras, 100 entornos, buscas, painéis) poderia virar um script de regressão.

---

## 7. Correções recomendadas, por ordem

1. ✅ **Corrigido.** Os agregados de `MUN` no boot e o retrato do painel de abertura passam a somar
   só os 94 bairros de Porto Alegre — resolve 2.1. O painel mostra agora R$ 5.317,39 de renda,
   175.519 moradores em favela (13,2%) e 2.004 indígenas, os valores de POA.
2. ✅ **Corrigido.** `MUN.pop` → `MUN.pop_2022` — resolve 2.2. O texto passa a dizer "2.791
   moradores… ficam em 1.330.054, e não em 1.332.845".
3. ✅ **Corrigido.** O selo de cobertura usa como denominador a população do conjunto desenhado,
   já com o filtro de município; a participação no município (`pop_pct_mun`) usa a população do
   município do próprio território — resolve 2.3 e 2.4. As participações somam 100% em cada um
   dos sete municípios.
4. ✅ **Corrigido.** O painel de entorno compara com o município da loja **e** com a região, cada
   comparação na sua linha, ambas somadas sobre os setores — resolve 2.5. LJ Guaíba: "+25% vs.
   Guaíba · −22% vs. região". Texto de rodapé e ficha de metodologia atualizados.
5. ✅ **Corrigido.** O bloco `lojas` de `dados-pontos.js` ganhou o campo `m`, por ponto-no-polígono;
   a Loja Adm Porto Alegre, fora da malha, recebe o município do setor mais próximo — resolve 3.1.
6. ✅ **Corrigido.** "Equipamentos no raio — públicos e privados" — resolve 2.6.
7. ✅ **Corrigido (set/2026).** Classe própria para zero quando os zeros são ≥20% dos valores, e
   quantis só entre os positivos — resolve 2.7. Quebras repetidas são descartadas: favela no
   nível setor, quase toda em 0% ou 100%, fica com as classes "0,0%" e "acima de 0 até 100,0%".
8. Guardar o código INEP no script 3 e a gestão/vínculo SUS no script 2.
9. Interpolação areal no entorno.
10. Métrica de mediana ou de quintil ao lado da média de renda.

Verificação das correções: sonda de 16,6 KB comparando antes e depois — contagens, somas de
indicadores, quebras de classe, os 100 resultados de entorno, buscas e painéis. As únicas
diferenças são os quatro textos de interface corrigidos; nenhum número de dado mudou. Zero erros
de página, na versão com pasta e no `atlas-rmpa.html`.
