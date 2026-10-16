# Atlas 2.0 — Brasil, municípios e bairros

Mapa socioeconômico do Brasil inteiro: os 5.570 municípios e os 17.575 bairros que o IBGE
delimitou no Censo 2022. Cada grande região tem o seu arquivo, e o Atlas abre uma por vez:
Norte, Nordeste, Centro-Oeste, Sudeste ou Sul. Trocar de região fecha a anterior.

Todo valor mostra a fonte, o ano e o nível. O que a fonte não publica aparece em branco: o
Atlas não estima, não interpola e não completa valor.

Esta versão é independente do Atlas Metropolitano (`atlas_v3/`): não tem lojas e não mostra
setores censitários como nível. Os setores entram só por dentro, para somar bairros e
municípios.

## Como abrir

- **Arquivo único:** `atlas2-brasil.html` (12 MB), com interface, código e as cinco regiões
  dentro. Abre direto do disco. Só a biblioteca do mapa (Leaflet, do cdnjs) e as fontes
  tipográficas vêm da internet.
- **Pasta:** `index.html`, `atlas2.css`, `atlas2.js` e `dados/`. Também abre direto do disco,
  e cada região só é lida quando escolhida.
- **GitHub Pages:** a pasta é estática. Com o Pages ligado no repositório, o endereço fica
  `https://<usuário>.github.io/<repositório>/atlas2/`.

O endereço guarda o estado e serve para compartilhar uma vista. Por exemplo,
`index.html#r=S&i=idhm&u=4314902` abre a região Sul, o IDHM e a ficha de Porto Alegre.

## O que tem

| | |
|---|---|
| Brasil | as 27 UFs coloridas pelo indicador, quando ele tem valor por UF |
| Região | os municípios da região; filtro por UF |
| Bairro | os bairros da região, num município (botão *Ver os bairros*) ou em todos |
| Ficha | valor, posição na região, comparação com UF, região e Brasil, série histórica e todos os indicadores da unidade |
| Ranking | todas as unidades da região ou da UF, com busca e CSV |
| CSV | a tabela inteira do nível (todos os indicadores), a ficha e o ranking |

Bairros existem em 895 municípios e cobrem 41% da população. Onde a prefeitura não tem divisão
oficial, o IBGE não delimitou bairros, e o município aparece em cinza no nível de bairro. A
capital paulista é um exemplo: lá a divisão oficial é por distrito.

| região | municípios | bairros (em quantos municípios) | arquivo |
|---|---:|---:|---:|
| Norte | 450 | 1.417 (105) | 1,2 MB |
| Nordeste | 1.794 | 3.830 (236) | 2,9 MB |
| Centro-Oeste | 467 | 963 (64) | 1,1 MB |
| Sudeste | 1.668 | 6.427 (161) | 3,8 MB |
| Sul | 1.191 | 4.938 (329) | 2,7 MB |

### Indicadores

São 92 indicadores, 43 também por bairro:

| categoria | n | categoria | n |
|---|---:|---|---:|
| Visão geral | 7 | Saúde | 6 |
| Demografia | 6 | Domicílio e saneamento | 19 |
| Cor ou raça | 6 | Entorno dos domicílios | 10 |
| Desenvolvimento humano | 4 | Vulnerabilidade | 5 |
| Renda e pobreza | 6 | Economia | 6 |
| Trabalho | 4 | Conectividade | 2 |
| Educação | 11 | | |

| fonte | indicadores | ano | nível |
|---|---:|---|---|
| IBGE, Censo 2022, agregados por setor (via censobr, IPEA) | 43 | 2022 | município e bairro |
| IBGE, malha de setores do Censo 2022 (via geobr, IPEA) | 1 (área) | 2022 | município e bairro |
| Atlas do Desenvolvimento Humano (PNUD, IPEA e FJP) | 26 | 2010, com 1991 e 2000 na série | município |
| IBGE, PIB dos Municípios e estimativas de população | 6 | 2021 | município |
| INEP, IDEB da rede pública | 3 | 2023 | município |
| SNIS, água e esgoto | 4 | 2022 | município |
| PNI, cobertura vacinal | 4 | 2021 | município |
| Anatel, banda larga fixa e telefonia móvel | 2 | 2024 (junho) | município |
| Fundação Abrinq, pré-escola | 1 | 2019 | município |
| ANA, Atlas Esgotos | 2 | 2013 | município |

As tabelas municipais vêm do espelho público da Base dos Dados, que republica as bases
oficiais sem alterar os valores. Os arquivos do plano pago (`_bdpro`) nunca são usados. Por
isso o Censo 2022 municipal sai da soma dos setores: as tabelas municipais do Censo 2022 no
espelho só existem no plano pago.

## Regras dos dados

**Malhas.** Municípios, bairros, UFs e regiões são a união dos setores do Censo 2022, e o
território fica idêntico ao dos dados. Duas malhas ficaram de fora:
- a malha municipal de 2022 do geobr tem áreas 6% a 12% maiores que as do IBGE, e vizinhos se
  sobrepõem;
- a de 2024 já traz um município criado depois do Censo, Boa Esperança do Norte (MT).

O desenho é simplificado como cobertura, para que vizinhos mantenham a mesma divisa. A
tolerância é de cerca de 165 m nos municípios e 22 m nos bairros. As áreas usadas nas contas
são as do IBGE.

**Sigilo do Censo 2022.** Em cada setor, o IBGE omite as contagens de 1 e 2; os zeros ficam.
- Quando as categorias de uma variável fecham o total do setor e só uma foi omitida, ela é o
  total menos as outras: conta exata. Isso vale para idade, sexo, alfabetização, espécie do
  domicílio, água, banheiro, esgoto, lixo e entorno.
- Quando duas ou mais foram omitidas, cada uma fica entre 1 e 2. O Atlas guarda o mínimo e o
  máximo, mostra o intervalo na ficha e pinta o mapa pelo meio dele.
- Cor ou raça não fecha o total, porque há quem não declarou. Ali só há mínimo e máximo.

Nos indicadores em percentual, o intervalo fica abaixo de 0,3 ponto em 95% dos municípios e
bairros.

**Setores omitidos.** Em 8.684 setores pequenos o IBGE omitiu tudo menos o básico. Eles ficam
de fora das contas, e a ficha informa que parte da população os setores com dado cobrem. Se
essa parte não chega à metade, o valor fica em branco.

**Rendimento do responsável.** O IBGE publica a média de cada setor. No bairro e no município o
Atlas faz a média ponderada pelo número de responsáveis. O peso exato seria o de responsáveis
com rendimento, que não é publicado por setor. Por isso o indicador aparece como cálculo do
Atlas.

Quando um setor sozinho domina a média, o Atlas mostra o valor como o IBGE publica e avisa na
ficha. Isso acontece em 49 bairros e 13 municípios. O critério:
- o setor tem mais da metade da renda somada;
- tem menos de um terço dos responsáveis;
- a média dele é mais de 4 vezes a dos outros setores.

Exemplo: em Senhor dos Passos (Belo Horizonte), um setor publica R$ 170.418 para 186
responsáveis; sem ele, a média do bairro é R$ 1.909.

**Entorno.** A pesquisa do entorno percorreu as faces de quadra das áreas urbanas. Os
percentuais são dos moradores com entorno pesquisado, e a ficha diz quanto do bairro ou
município isso cobre.

**Indicadores municipais.** Cada indicador entra no ano mais recente publicado. O painel mostra
a série quando há, com UF e Brasil quando a fonte publica esses valores.
- Ficam em branco os 5 municípios criados depois de 2010 (no Atlas Brasil), os municípios sem
  prestador declarado (no SNIS) e as etapas não publicadas pelo INEP (no IDEB).
- Valores acima de 100% que a fonte publica, como cobertura vacinal ou matrícula na
  pré-escola, entram como publicados, e a descrição do indicador explica. No SNIS, atendimento
  acima de 100% ficaria de fora; nesta versão não há nenhum.
- Os valores com duas casas na fonte aparecem com duas casas, sem arredondar.

**Classes do mapa.** Quintis: cinco grupos com o mesmo número de unidades da região, da UF
escolhida ou do município, no nível de bairro. A variação da população usa faixas fixas em
torno de zero. As rampas de cor têm um tom só, do claro ao escuro, e passaram no validador de
paleta: monotonia de luminosidade, distância entre passos e contraste do tom mais claro com o
fundo.

### Conferências feitas antes de gravar

- Área de cada setor igual à do IBGE no elipsoide do SIRGAS 2000 (diferença mediana de 0,0001%).
- Área de cada município e de cada bairro igual à soma dos seus setores (até 0,017% e 0,034%).
- Bairros montados pelos setores iguais aos da malha de bairros do geobr.
- População do Brasil igual à do Censo, 203.080.756, e a de cada região igual à soma dos seus
  municípios.
- Brasil calculado pelo Atlas contra o publicado pelo IBGE:

  | indicador | Atlas | IBGE |
  |---|---:|---:|
  | analfabetismo de 15 anos ou mais | 6,99% | 7,0% |
  | pardos | 45,33% | 45,3% |
  | brancos | 43,49% | 43,5% |
  | pretos | 10,16% | 10,2% |

- Nas categorias que fecham o total, o que falta está sempre entre 1 e 2 por categoria omitida.
  Se a regra de sigilo da fonte mudar, o script para.
- IDHM de 2010 igual ao do Atlas Brasil (Porto Alegre 0,805; RS 0,746; Brasil 0,727). PIB per
  capita do Brasil em 2021 igual ao do IBGE (R$ 42.247,52).
- Cada coluna gravada é decodificada de volta e comparada antes de gravar.

## Como atualizar

```bash
cd atlas2
python3 extracao/1_malhas.py        # setores do Censo 2022 (geobr) → municípios, bairros, UFs e regiões
python3 extracao/2_censo2022.py     # agregados por setor (censobr) → bairro, município, UF, região e Brasil
python3 extracao/3_municipais.py    # Atlas Brasil, PIB, IDEB, SNIS, PNI, Anatel, Abrinq, ANA (Base dos Dados)
python3 extracao/4_monta.py         # dados/brasil.js e dados/regiao-*.js
python3 build_single.py             # atlas2-brasil.html
```

Cada script baixa o que falta para `extracao/fontes/` (não versionado, cerca de 3 GB), confere e
para se algo não bater. Requisitos: Python 3.11, `shapely` 2.1 ou mais novo (GEOS 3.12+),
`pyarrow` e `numpy`. Os arquivos intermediários ficam em `extracao/fontes/intermediario/`.

## Estrutura

```
atlas2/
├── index.html, atlas2.css, atlas2.js   interface
├── atlas2-brasil.html                  arquivo único (gerado por build_single.py)
├── build_single.py
├── dados/
│   ├── brasil.js                       UFs, regiões, catálogo, fontes, comparações e busca
│   └── regiao-n.js … regiao-s.js       municípios e bairros de cada região
└── extracao/
    ├── 1_malhas.py  2_censo2022.py  3_municipais.py  4_monta.py
    └── fontes/                         arquivos baixados (não versionados)
```

Os arquivos de dados guardam números como inteiros de tamanho variável e as malhas como arcos
compartilhados: cada divisa entre vizinhos é gravada uma vez só.

## Testes

No Chromium (Playwright), na pasta e no arquivo único (aberto também direto do disco):
- as cinco regiões carregam em menos de um segundo cada, com uma só marcada por vez;
- a busca acha qualquer município do Brasil e troca de região sozinha;
- os 6.427 bairros do Sudeste são pintados em cerca de meio segundo;
- ficha com série (município, UF e Brasil), ranking, CSV do ranking e da tabela, metodologia;
- celular de 390 px, sem rolagem lateral.

Auditoria de ponta a ponta: 300 unidades sorteadas por região, comparando o que o navegador
decodifica com os valores calculados pelos scripts. São 108.164 comparações (valores,
intervalos do sigilo e contornos), todas iguais, na pasta e no arquivo único.

## Limites

- Bairros só onde o IBGE os delimitou (895 municípios).
- O Censo 2022 por setor não traz trabalho nem renda per capita. A renda por bairro é a do
  responsável pelo domicílio, e renda per capita, pobreza e desigualdade municipais são do
  Atlas Brasil (Censo 2010).
- Os dados municipais mais recentes do espelho gratuito são de 2021 (PIB), 2022 (SNIS), 2023
  (IDEB) e 2024 (Anatel).
- O desenho é simplificado. Para medir distância ou área no mapa, use a malha original do IBGE.
