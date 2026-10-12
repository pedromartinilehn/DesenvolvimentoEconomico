# Auditoria de todos os dados do Atlas RMPA (versão 3.2)

Outubro de 2026

Esta auditoria cobre os dados que o Atlas carrega e exibe, não a interface. A auditoria anterior,
sobre a versão 2, está em [AUDITORIA-arquivos-e-modelos.md](AUDITORIA-arquivos-e-modelos.md).

## Resumo

**A base censitária está íntegra.** No Censo 2022, as somas dos 4.722 setores reproduzem exatamente
os 148 bairros e os 7 municípios, em todos os campos de contagem, e a população bate com a oficial
do IBGE. O PIB e o valor adicionado conferem com o IBGE. As despesas, os crimes e as taxas por
habitante foram recalculados e batem. Os CSVs publicados em `docs/` coincidem com o que o Atlas
calcula.

**Há quatro erros de dado. Nenhum é de soma: três são de classificação ou de rótulo, e um (E3) é de definição, com provável viés de cálculo:**

| | Achado | Efeito |
|---|---|---|
| E1 | 88 dos 567 "estabelecimentos de saúde" não atendem a população: 27 centrais de regulação e 61 comunidades terapêuticas, residenciais geriátricos e academias. A legenda ainda erra o nome dos dois tipos | infla o total de estabelecimentos; em Sapucaia do Sul, 30 dos 62 são comunidades ou residenciais |
| E2 | 13 unidades de saúde prisionais ou socioeducativas contadas como UBS | infla "UBS por 10 mil habitantes": Canoas de 0,89 para 1,01 |
| E3 | A pobreza, a renda e o Gini municipais de 2010 são chamados de "valor oficial", mas são cálculo do próprio Atlas, e ficam sistematicamente acima do Atlas Brasil na pobreza e no Gini e abaixo na renda | Porto Alegre: 13,8% contra 12,5% na pobreza, Gini 0,615 contra 0,60 |
| E4 | Em 98 bairros, o Gini de 2010 é uma média de Ginis de áreas de ponderação diferentes | o número exibido não é um Gini |

**Um erro da documentação da versão 3.2, já corrigido:** a documentação e os scripts R diziam que
matrículas e equipes de saúde se ligariam às escolas e unidades do mapa pelo código INEP ou CNES.
Os pontos do mapa não guardam esses códigos.

| | quantidade |
|---|---:|
| grupos de verificação que passaram (seção 4) | 34 |
| erros de dado | 4 |
| limitações a declarar | 9 |
| não verificáveis neste ambiente | 5 |

---

## 1. Como foi feito

1. Os dados foram decodificados **pelo próprio Atlas**, no navegador, e exportados: setores, bairros,
   municípios, pontos, catálogo de indicadores, bolsões e os 80 entornos de loja. Assim a auditoria
   testa exatamente o que a tela mostra, depois de toda a decodificação e de `derivados()`.
2. Verificações internas: identidades contábeis em cada setor; somas setor → bairro → município;
   faixas de valores; geometria; posição dos pontos; contagens; catálogo.
3. Verificações externas, com o que este ambiente alcança: o espelho público da Base dos Dados
   (Atlas Brasil 2010, PIB dos Municípios do IBGE). IBGE, Tesouro, DATASUS, SSP e INEP estão
   bloqueados aqui (seção 5).

## 2. Erros de dado

### E1. "Estabelecimentos de saúde" inclui o que não é atendimento à população

O script `2_atualiza_cnes.py` seleciona os tipos de estabelecimento do CNES e, entre eles, inclui
os tipos 81 e 83, com rótulos errados:

| tipo | rótulo no Atlas | o que é no CNES | unidades | exemplos |
|---|---|---|---:|---|
| 81 | "Centro de dispensação de material" | **Central de Regulação do Acesso** | 27 | "Regulação Regional 1CRS" a "18CRS" (as 18 regionais do estado, todas com endereço em Porto Alegre), centrais estaduais de regulação |
| 83 | "Polo academia da saúde" | **Polo de Prevenção de Doenças e Agravos e Promoção da Saúde** (inclui comunidades terapêuticas) | 61 | pelo nome: 25 residenciais terapêuticos, 22 comunidades ou centros terapêuticos, 12 residenciais geriátricos ou lares de idosos e 2 academias ("PRO FITNESS ACADEMIA" e "ACADDEM") |

O Polo Academia da Saúde, programa público, é o tipo 74.

| município | estabelecimentos | tipo 81 | tipo 83 | sem 81 e 83 |
|---|---:|---:|---:|---:|
| Porto Alegre | 268 | 24 | 0 | 244 |
| Canoas | 70 | 2 | 9 | 59 |
| Gravataí | 64 | 1 | 21 | 42 |
| Sapucaia do Sul | 62 | 0 | 30 | 32 |
| Cachoeirinha | 32 | 0 | 1 | 31 |
| Guaíba | 24 | 0 | 0 | 24 |
| Esteio | 47 | 0 | 0 | 47 |
| **total** | **567** | **27** | **61** | **479** |

Afeta `cnes_estabelecimentos` (município e bairro), a camada de saúde, o entorno das lojas e a
coluna `estab_saude` de `docs/entorno-lojas.csv`. Não afeta UBS, hospitais nem CAPS.

**Correção proposta:** corrigir os rótulos de 81 e 83 e tirá-los da contagem de "estabelecimentos de
saúde". Se fizer sentido para o diagnóstico, mostrá-los como camada própria, porque comunidades
terapêuticas e residenciais geriátricos interessam à assistência social.

### E2. Unidades prisionais contadas como UBS

Treze unidades do tipo 2 (Centro de Saúde/UBS) ficam dentro de presídios ou de unidades de
internação socioeducativa. Os nomes no CNES: quatro do Complexo PECAN (Canoas), Saúde Prisional
CPPA, IPF Maurício Cardoso, Madre Pelletier, NUGESP e PEPOA (Porto Alegre), CASE II e CASEF (Porto
Alegre), a de Guaíba e a "Equipe de Atenção Primária Prisional" de Sapucaia do Sul. Atendem a população
privada de liberdade, não o bairro.

| município | UBS no Atlas | prisionais ou socioeducativas | UBS por 10 mil hoje | sem elas |
|---|---:|---:|---:|---:|
| Porto Alegre | 143 | 7 | 1,07 | 1,02 |
| Canoas | 35 | 4 | 1,01 | 0,89 |
| Sapucaia do Sul | 26 | 1 | 1,97 | 1,89 |
| Guaíba | 15 | 1 | 1,61 | 1,51 |

**Correção proposta:** separar essas unidades da contagem de UBS, identificando-as pelo nome ou,
melhor, pelo código CNES depois que os pontos passarem a guardá-lo (ver E5).

### E3. Renda, pobreza e Gini municipais de 2010: "oficial" que não é, e com viés provável

A versão 3.1 passou a mostrar, no nível município, os valores do bloco `municipal_2010` com o rótulo
de "valor oficial". A própria análise que motivou a mudança diz que esse bloco é "calculado sobre os
registros de cada município". É um cálculo do Atlas sobre os microdados, não um número publicado.

Comparado ao Atlas Brasil (PNUD, IPEA e FJP), que é publicação oficial, o padrão é o mesmo nos sete
municípios:

| município | abaixo de ½ SM, Atlas | vulneráveis (até R$ 255), Atlas Brasil | Gini, Atlas | Gini, Atlas Brasil | renda per capita, Atlas | Atlas Brasil |
|---|---:|---:|---:|---:|---:|---:|
| Porto Alegre | 13,76% | 12,51% | 0,6152 | 0,60 | R$ 1.730 | R$ 1.758 |
| Canoas | 16,59% | 15,72% | 0,5179 | 0,51 | R$ 932 | R$ 952 |
| Gravataí | 19,72% | 18,01% | 0,4577 | 0,44 | R$ 715 | R$ 737 |
| Sapucaia do Sul | 18,69% | 18,29% | 0,4501 | 0,44 | R$ 718 | R$ 733 |
| Cachoeirinha | 14,53% | 13,22% | 0,4494 | 0,44 | R$ 823 | R$ 844 |
| Guaíba | 19,89% | 19,29% | 0,4794 | 0,47 | R$ 743 | R$ 759 |
| Esteio | 13,91% | 13,59% | 0,4845 | 0,48 | R$ 943 | R$ 956 |

O Atlas Brasil publica o Gini com duas casas decimais, mas a diferença passa do arredondamento
em todos os municípios. A extrema pobreza reforça o sinal: o Atlas dá 5,45% abaixo de ¼ de salário mínimo (R$ 127,50) em
Porto Alegre, enquanto o Atlas Brasil dá 3,82% abaixo de R$ 140, uma linha **mais alta**. A ordem
deveria ser a inversa.

Pobreza para cima, Gini para cima e média para baixo, todos ao mesmo tempo, é o que acontece quando
pessoas sem rendimento domiciliar declarado entram como renda zero. Com cerca de 1,5% delas, os três
desvios ficam do tamanho observado. É uma **hipótese**: o processamento que gerou o bloco não está
no repositório. O script [`11_confere_renda_2010.R`](../atlas_v3/extracao/R/11_confere_renda_2010.R)
resolve a dúvida. Ele recalcula os números contando a renda ausente como zero, excluindo-a, e no
universo do Atlas Brasil, e mostra qual versão reproduz cada fonte.

Os indicadores de trabalho divergem por definição, não por erro. A desocupação do Atlas Brasil é de
18 anos ou mais e difere até 0,4 ponto. A "formalização" do Atlas Brasil inclui conta própria que
contribui para a previdência, por isso fica cerca de 11 pontos acima do "vínculo formal". O ensino
superior aos 25 anos bate exatamente.

**Correção proposta:**

- trocar "valor oficial" por "calculado pelo Atlas com os microdados do IBGE" em toda a interface e
  na documentação;
- rodar o script 11. Se a hipótese se confirmar, refazer os indicadores de renda de 2010
  (municípios, áreas de ponderação, setores e bairros) excluindo a renda ausente;
- até lá, exibir ao lado o número do Atlas Brasil, que já está no pacote
  (`dados-complementares.js`).

### E4. Gini de bairro como média de áreas de ponderação

No setor, o valor de 2010 é o da área de ponderação que o contém. No bairro, é a média dos setores
ponderada pela população, o que está de acordo com a documentação. Mas 98 dos 143 bairros com setores
cruzam duas a sete áreas de ponderação. Para proporções, a média ponderada é uma aproximação
razoável. **Para o Gini, não**: a média de Ginis não é o Gini do conjunto. É o mesmo problema que a
versão 3.1 corrigiu no município, de 0,452 para 0,518 em Canoas.

| áreas de ponderação no bairro | 1 | 2 | 3 | 4 | 5 a 7 |
|---|---:|---:|---:|---:|---:|
| bairros | 45 | 44 | 35 | 14 | 5 |

**Correção proposta:** no bairro, mostrar o Gini só quando ele está numa única área de ponderação.
Nos demais, mostrar a faixa entre o menor e o maior valor das áreas, ou não mostrar.

### E5. Pontos sem código INEP ou CNES (erro de documentação, corrigido)

Os scripts `3_atualiza_escolas.py` e `2_atualiza_cnes.py` guardam nome, município, tipo e
coordenada, mas não o código. Os textos novos da rodada anterior diziam que matrículas (B5) e equipes
(B6) se ligariam aos pontos por esse código. Foram corrigidos: os scripts R 03 e 04 e o
`EXTRACAO-dados-faltantes.md` agora avisam que é preciso incluir o código e regenerar os pontos
antes. Sem o código também não dá para confirmar duplicatas (L6).

## 3. Limitações a declarar

| | O quê | Tamanho | Efeito na tela |
|---|---|---|---|
| L1 | Sigilo estatístico do IBGE: os grandes grupos de idade somam menos que a população em 210 setores, e as cores ou raças em 17 | 555 pessoas (0,02%) na idade; 6.005 (0,25%) contando as cores suprimidas | nenhum na raça, cujo percentual usa a soma das cores como base; desprezível na idade |
| L2 | Esgoto: domicílios que não estão em "adequado" nem em "inadequado" | 9.118 de 959.615 (0,95%); não são os sem banheiro, que são 68 | adequado e inadequado somam cerca de 99%, não 100% |
| L3 | "Moradores por domicílio" muda de definição: no setor é a média do IBGE (só domicílios particulares permanentes, uma casa decimal); no bairro, no município e no entorno é população ÷ domicílios ocupados, que inclui quem mora em domicílio coletivo | até 0,03 no município; maior em setores com presídio ou abrigo | pequeno |
| L4 | Geometria simplificada: 1 bairro (Estância Velha, Canoas) e 1 setor com autointerseção; 1.873 pares de setores com sobreposição acima de 1%; municípios com até 0,15 km² de sobreposição na divisa | — | nenhum nas contas: densidade usa a área oficial do IBGE; entorno e bolsões usam o ponto representativo do setor |
| L5 | Área do bairro é a do polígono legal (Lei 12.112/2016) e difere da soma dos setores em 4 bairros | Arquipélago: 43,6 km² no polígono, 66,1 km² nos setores (água) | a densidade do bairro usa o polígono legal, o que é correto |
| L6 | Coordenadas repetidas: 22 locais com duas ou três escolas e 6 com duas a seis unidades de saúde. Uma escola parece duplicada (EEI Bilíngue Tarsila, mesmo nome e lugar) | — | duas bolinhas no mesmo ponto; sem o código INEP não dá para confirmar a duplicata |
| L7 | Catálogo: quatro nomes repetidos ("IDHM", "PIB per capita", "Receitas brutas realizadas", "Participação da agropecuária no VAB"). Cinco dos nove indicadores antigos, só de Porto Alegre, duplicam versões dos sete municípios. Os campos `trab_*_2010` e `assist_*_2010` de `dados-servicos.js` repetem os valores de 2010 e não são usados | — | confunde na busca |
| L8 | Despesa em saúde de Cachoeirinha (R$ 736 por habitante; 14% da despesa) e de Esteio (R$ 788; 12%) é cerca de metade da dos vizinhos | — | **a conferir**: pode haver saúde executada por fundação ou consórcio fora da DCA da prefeitura |
| L9 | Taxas por habitante misturam anos, como documentado: despesa 2024 e crimes 2025 sobre a população de 2026; UBS 2026 sobre a população de 2022 | — | já explicado na ficha |

## 4. Verificações que passaram

**Censo 2022, setores:**

- homens + mulheres = população, nos 4.722 setores;
- as 11 faixas etárias somam a população, nos 4.722 setores;
- preta + parda = "preta ou parda";
- alfabetizados ≤ população de 15 anos ou mais ≤ população;
- domicílios: particulares permanentes ≤ ocupados ≤ total;
- casa + apartamento + precário ≤ domicílios; água de rede ≤ domicílios; esgoto de rede ≤ adequado
  ≤ domicílios; lixo ≤ domicílios;
- população em favela ≤ população; responsáveis ≤ domicílios; indígenas e quilombolas ≤ população;
- densidade = população ÷ área oficial;
- nenhum valor negativo; renda do responsável entre R$ 500 e R$ 49.760 (o mínimo é um setor com
  12 moradores).

**Agregação:**

- soma dos setores = valor do município, em todos os campos de contagem, nos 7 municípios;
- renda média do responsável no município = média dos setores ponderada pelos responsáveis;
- soma dos setores = valor do bairro, em todos os campos de contagem, nos 148 bairros;
- população dos municípios = Censo 2022 (2.383.002 no total), e soma dos bairros = município;
- nenhum setor de Porto Alegre sem bairro.

**Censo 2010:**

- valores por setor entre 0 e 100 (Gini entre 0 e 1), 4.722 setores preenchidos;
- 42, 19, 15, 7, 6, 5 e 5 combinações distintas por município, compatíveis com o número de áreas de
  ponderação;
- município = bloco `municipal_2010`, em todos os 12 indicadores;
- `trab_*_2010` e `assist_*_2010` = bloco `municipal_2010`;
- bairro = média dos setores ponderada pela população, sem exceção.

**Fontes externas:**

- VAB por setor e impostos de 2021 = IBGE (diferença máxima de 0,003%, compatível com revisão da série);
- PIB de 2013, base do crescimento 2013–2023 = IBGE, nos 7 municípios;
- IDHM 2010 e componentes = Atlas Brasil;
- superior completo aos 25 anos = Atlas Brasil, nos 7 municípios.

**Serviços:**

- receita tributária ≤ corrente ≤ total; transferências ≤ corrente;
- resultado = receita − despesa; atenção básica ≤ saúde; assistência comunitária ≤ assistência;
- despesas por habitante e taxas por 100 mil recalculadas e iguais;
- vítimas de homicídio ≥ homicídios; CVLI ≥ vítimas de homicídio;
- contagens municipais de escolas e de unidades de saúde = pontos do mapa, por tipo e por município.

**Pontos, áreas de risco e documentos:**

- todos os pontos dentro do município declarado;
- nenhum código INEP ou CNES repetido (não há códigos; ver E5);
- 25 áreas de risco válidas e dentro dos seus municípios;
- `docs/entorno-lojas.csv`: 80 entornos idênticos ao Atlas em setores, população, renda, escolas e
  saúde; percentuais com até 0,05 ponto de diferença, por arredondamento;
- `docs/bolsoes-quintil-inferior.csv`: 123 bolsões e 323.725 pessoas, iguais ao Atlas.

**Catálogo:** todo indicador tem fonte existente e ano, e todo indicador declarado num nível tem
dado nesse nível.

## 5. O que não deu para verificar aqui

| Dado | Por quê | Como verificar |
|---|---|---|
| População estimada de 2026 | servidor do IBGE bloqueado | conferir no PDF da estimativa citado em `dados-servicos.js` |
| SICONFI 2024 (receitas e despesas) | servidor do Tesouro bloqueado | rodar `1_servicos_municipais.py` ou `05_siconfi_educacao.R` e comparar |
| SSP/RS 2025 | servidor da SSP bloqueado | planilha citada em `dados-servicos.js` |
| CNES e Censo Escolar (lista de pontos) | servidores bloqueados | regenerar os pontos com o código (E5) e conferir o total por tipo |
| Renda de 2010 (E3) | microdados no GitHub do IPEA, bloqueado | `11_confere_renda_2010.R` |

## 6. Correções propostas, por prioridade

1. **E3:** trocar "valor oficial" por "calculado pelo Atlas" e rodar o script 11. É o achado com mais
   peso no diagnóstico: a pobreza de 2010 aparece em fichas, tabelas e na matriz de priorização.
2. **E1 e E2:** reclassificar os tipos 81 e 83 e as unidades prisionais. Muda as contagens de saúde
   de quatro municípios.
3. **E4:** Gini de bairro só onde há uma área de ponderação.
4. **E5:** guardar o código INEP e CNES nos pontos (pré-requisito para B5, B6 e para checar
   duplicatas).
5. **L2, L3, L7:** declarar o resíduo do esgoto, unificar a definição de moradores por domicílio e
   limpar o catálogo.

Nenhuma dessas correções foi aplicada aos dados nesta auditoria: elas mudam números que aparecem nos
documentos de diagnóstico e pedem decisão antes.

### Fontes externas usadas

- [Atlas Brasil, via espelho da Base dos Dados](https://storage.googleapis.com/basedosdados-public/one-click-download/mundo_onu_adh/municipio/municipio.csv.gz)
- [PIB dos Municípios, via espelho da Base dos Dados](https://storage.googleapis.com/basedosdados-public/one-click-download/br_ibge_pib/municipio/municipio.csv.gz)
- Tipos de estabelecimento do CNES:
  - tipo 81, portaria resumida pelo [CONASS](https://www.conass.org.br/?p=3209);
  - tipo 83, [Portaria SAS/MS 1.482/2016](https://saude.campinas.sp.gov.br/saude/lista_legislacoes/legis_2016/U_PT-MS-SAS-1482_251016.pdf);
  - tipo 74, [Portaria SAS/MS 24/2014](https://saude.sp.gov.br/resources/cve-centro-de-vigilancia-epidemiologica/areas-de-vigilancia/doencas-cronicas-nao-transmissiveis/observatorio-promocao-a-saude/portarias/u_pt-ms-sas-24_140114.pdf).
