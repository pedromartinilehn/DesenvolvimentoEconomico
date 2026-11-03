# Atlas Porto Alegre — bairros, setores e lojas Panvel

Mapa socioeconômico de Porto Alegre com:

- os 94 bairros e os 2.744 setores censitários do Censo 2022;
- as 129 lojas Panvel ativas no CNES de abril de 2026;
- o entorno de cada loja, com raios de 500 m, 1 km e 2 km;
- os moradores que têm cada loja como a Panvel mais próxima;
- a cobertura das lojas por bairro;
- as unidades de saúde e as escolas da cidade.

Todo valor mostra a fonte, o ano e o nível. O que a fonte não publica aparece em branco: o
Atlas não estima, não interpola e não completa valor. O que é conta do próprio Atlas leva o
selo "cálculo do Atlas".

Esta versão é independente do Atlas Metropolitano (`renner/atlas_v3/`) e do Atlas 2.0 (`atlas2/`).
Ela usa as mesmas definições e regras do Atlas 2.0 para o Censo 2022, e os bairros de Porto
Alegre dão os mesmos números nos dois.

## Como abrir

- **Arquivo único:** `atlas-poa.html` (1,1 MB), com interface, código e dados dentro. Abre
  direto do disco. Só a biblioteca do mapa (Leaflet, do cdnjs) e as fontes tipográficas vêm
  da internet.
- **Pasta:** `index.html`, `atlas-poa.css`, `atlas-poa.js` e `dados/poa.js`. Também abre
  direto do disco e serve no GitHub Pages
  (`https://<usuário>.github.io/<repositório>/farmacias/porto-alegre/`).

O endereço guarda o estado e serve para compartilhar uma vista. Exemplos:

- `index.html#i=pop_1km` mostra os moradores a até 1 km de uma loja, por bairro;
- `index.html#l=0671029&r=2000` abre a loja da Av. Ipiranga, 5200 com o raio de 2 km;
- `index.html#n=set&i=renda_resp` mostra o rendimento por setor.

## O que tem

| | |
|---|---|
| Bairro e setor | os dois níveis do mapa; o setor é o do próprio Censo, com o sigilo do IBGE tratado |
| Ficha do bairro | valor, posição entre os 94 bairros, comparação com Porto Alegre, RS e Brasil, lojas do bairro e todos os indicadores |
| Ficha do setor | o mesmo, com a comparação com o bairro e a loja Panvel mais próxima |
| Ficha da loja | entorno em três raios, "mais próximos", Porto Alegre ao lado, equipamentos no raio e avisos de localização |
| Lista das lojas | as 129 lojas com o entorno no raio escolhido, ordenáveis, e CSV com os três raios |
| Camadas | lojas Panvel, raio de 500 m de cada loja, unidades de saúde (CNES) e escolas (Censo Escolar 2025) |
| Ranking e CSV | ranking do nível, tabela inteira de bairros ou setores, ficha e entorno de uma loja |

### Indicadores (47)

| Categoria | Indicadores | Fonte |
|---|---|---|
| Lojas Panvel | distância até a loja mais próxima; lojas no bairro; lojas por 10 mil habitantes; moradores a até 500 m e a até 1 km de uma loja | CNES abr./2026 e Censo 2022, cálculo do Atlas |
| Visão geral | população, domicílios, área, densidade, moradores por domicílio, população em setores urbanos | Censo 2022 |
| Demografia | 0 a 14 anos, 15 a 29, 60 ou mais, índice de envelhecimento, razão de sexo | Censo 2022 |
| Cor ou raça | brancas, pretas, pardas, pretas ou pardas, indígenas, amarelas | Censo 2022 |
| Renda | rendimento médio do responsável pelo domicílio | Censo 2022 |
| Educação | analfabetismo de 15 anos ou mais | Censo 2022 |
| Domicílio e saneamento | água, banheiro, esgoto, lixo, casa, apartamento, cortiço, domicílios improvisados | Censo 2022 |
| Entorno | pavimentação, iluminação, calçada, árvores, bueiro, ponto de ônibus, rampa, ciclovia, obstáculo, cobertura da pesquisa | Censo 2022 |
| Vulnerabilidade | população em favelas e comunidades urbanas | Censo 2022 |

## Lojas Panvel

**De onde vêm.** São os estabelecimentos do Cadastro Nacional de Estabelecimentos de Saúde
(CNES) que atendem a três condições:

- estão ativos na competência de abril de 2026;
- têm o CNPJ da Dimed S/A Distribuidora de Medicamentos, a empresa que opera a Panvel (raiz
  92.665.611);
- têm endereço em Porto Alegre.

O arquivo é o que o IPEA publica para o pacote geobr. Farmácia que oferece serviço de saúde
precisa de registro no CNES.

- Só conta como loja o estabelecimento registrado como farmácia (tipo 43 do CNES), a mesma regra
  das farmácias do Brasil (`farmacias/brasil/`).
- Em Porto Alegre são 129 lojas, em 52 bairros. Uma unidade da empresa registrada como clínica
  (Av. Ipiranga, 6690) fica de fora.
- No Brasil, o CNES tem 597 estabelecimentos ativos com esse CNPJ: RS 398, PR 102, SC 85 e
  SP 12.
- Uma loja aberta depois de abril de 2026, ou sem registro no CNES, não aparece.
- A lista oficial do site da Panvel não abriu no ambiente em que o Atlas foi montado. Se ela
  for anexada, as lojas podem ser conferidas uma a uma.

**Registros parecidos.** O Atlas mostra todos os registros abaixo e avisa na ficha da loja.
Ele não decide se são lojas distintas ou registros repetidos no CNES.

- Dois endereços têm duas lojas ativas cada, com CNPJs diferentes:
  - Av. Severo Dullius, 90.010, o endereço do aeroporto;
  - Rua Vinte e Quatro de Outubro, 742, escrito de duas formas no CNES.
- Dois pares de lojas ficam a menos de 50 m uma da outra:
  - Rua dos Andradas, 1238 e 1401;
  - Felipe de Oliveira, 465 e Vicente da Fontoura, 2759.
- Doze registros da Dimed em Porto Alegre estão desativados no CNES e ficam de fora.

**Onde fica cada loja.** O CNES traz a coordenada declarada pelo estabelecimento. O arquivo do
geobr traz também a do geocodebr (IPEA), que localiza o endereço no Cadastro Nacional de
Endereços do Censo 2022. As duas nem sempre concordam: a distância mediana entre elas é de
265 m. Como o entorno usa raios de 500 m, a regra é mais estrita que a do geobr, que aceita a
coordenada do CNES a até 800 m do endereço:

| Regra, na ordem | Lojas |
|---|---:|
| O geocodebr achou o número do endereço (incerteza de até 50 m): ponto do endereço | 26 |
| A coordenada do CNES cai na área do CEP do endereço (desvio do CEP de até 800 m), ou a até 150 m do ponto do geocodebr: coordenada do CNES | 53 |
| A coordenada do CNES fica fora da área do CEP: centro do CEP do endereço (incerteza de até 800 m) | 34 |
| O endereço não confirma nada (CEP muito extenso ou sem localização): coordenada do CNES, em cinza no mapa | 16 |

Cada loja mostra a sua classe e a incerteza em metros.

## Entorno, "mais próximos" e cobertura

- **Entorno.** É a soma dos setores cujo ponto representativo está a até 500 m, 1 km ou 2 km
  da loja, em linha reta. O ponto representativo é um ponto dentro do setor, calculado no
  polígono original.
  - Um setor cortado pela borda entra inteiro ou fica de fora.
  - Contagens somam. Taxas são recalculadas sobre os totais somados, nunca como média de
    taxas.
  - Onde o sigilo do IBGE deixa dúvida, a taxa vira um mínimo e um máximo, e a ficha mostra o
    intervalo.
- **Mais próximos.** São os setores cujo ponto representativo está mais perto desta loja do
  que de qualquer outra Panvel. Cada setor entra numa loja só; em empate, na primeira da
  lista. Não é área de venda nem de atendimento.
- **Cobertura por bairro.** São cinco indicadores:
  - lojas no bairro;
  - lojas por 10 mil habitantes;
  - distância até a loja mais próxima: no setor, a do ponto representativo; no bairro, a
    média dos moradores, com cada setor pesando pela sua população;
  - parte dos moradores a até 500 m de uma loja;
  - parte dos moradores a até 1 km de uma loja.
- **Porto Alegre inteira.** 32,9% dos moradores estão a até 500 m de uma loja e 57,4% a até
  1 km. A distância média é de 1,31 km. 42 dos 94 bairros não têm loja.

Distâncias pela fórmula de haversine (raio médio da Terra de 6.371.008,8 m). A mesma conta
roda no script e no navegador.

## Regras dos dados

- **Malhas.** Os setores são os do Censo 2022 do IBGE, na forma publicada pelo IPEA no pacote
  geobr.
  - Bairros e município são a união dos setores.
  - A área de cada setor confere com a do IBGE (diferença mediana de 0,0001%).
  - A de cada bairro confere com a soma dos setores e com a malha de bairros do geobr (até
    0,009%).
  - As linhas foram simplificadas como cobertura, com cerca de 3 m de tolerância e sem fresta
    entre vizinhos.
- **Censo 2022.** Agregados por setor (pacote censobr, IPEA), com as mesmas definições do
  Atlas 2.0. A população soma 1.332.845.
- **Sigilo.** O IBGE omite as contagens de 1 e 2.
  - Quando a categoria omitida é a única que falta para fechar o total, ela é recuperada pela
    diferença.
  - Senão, o valor fica entre um mínimo e um máximo. O mapa usa o meio, e a ficha mostra o
    intervalo.
  - No analfabetismo, o total de 15 anos ou mais vem das faixas de idade e também das duas
    categorias de alfabetização, que o fecham. Quando nenhuma das duas foi omitida, o total
    é exato.
  - 18 setores pequenos têm tudo omitido menos o básico. 31 setores não têm moradores.
- **Rendimento do responsável.** No setor, é o valor do IBGE. No bairro, é a média dos setores
  ponderada pelos responsáveis, por isso aparece como cálculo do Atlas.
- **Nomes.** O IBGE grava Mont’Serrat com um caractere de controle do Windows-1252
  (`Mont\x92Serrat`). O script devolve o apóstrofo.
- **Unidades de saúde.** São 244 estabelecimentos ativos dos tipos de atendimento à população,
  com as mesmas regras do Atlas Metropolitano. As unidades prisionais e socioeducativas ficam
  marcadas como de acesso restrito.
- **Escolas.** São 955 escolas em atividade no Censo Escolar 2025. Uma delas tem coordenada
  fora dos setores da cidade.

## Como atualizar

```bash
cd farmacias/porto-alegre
python3 extracao/1_malhas.py      # setores, bairros e município (geobr)
python3 extracao/2_censo2022.py   # Censo 2022 por setor e bairro, RS e Brasil (censobr)
python3 extracao/3_pontos.py      # lojas Panvel, unidades de saúde e escolas (CNES e INEP, via geobr)
python3 extracao/4_monta.py       # dados/poa.js
python3 build_single.py           # atlas-poa.html
```

Precisa de Python 3.10 ou mais novo, com `numpy`, `pyarrow` e `shapely` 2.1 ou mais novo.

- Os arquivos baixados ficam em `extracao/fontes/`, que não é versionada, e não são baixados
  de novo.
- Cada script confere o que leu e para se algo não bater.
- Para um CNES mais novo, troque o nome do arquivo em `3_pontos.py`: `healthfacilities_AAAAMM`
  nas releases de `ipea/geobr_prep_data`.

## Estrutura

```
farmacias/porto-alegre/
├── atlas-poa.html     arquivo único
├── index.html  atlas-poa.css  atlas-poa.js
├── dados/poa.js       malhas, valores, lojas e pontos (gerado)
├── build_single.py
└── extracao/          1_malhas.py · 2_censo2022.py · 3_pontos.py · 4_monta.py
```

## Testes

Feitos no Chromium, na pasta e no arquivo único aberto direto do disco.

- **Auditoria: 21.648 de 21.648 valores iguais.** Os valores do navegador foram comparados com
  um cálculo independente, feito direto nos Parquet do Censo e nas coordenadas:
  - população, domicílios, rendimento, 60 anos ou mais e analfabetismo, nos setores e bairros
    onde o valor é exato;
  - distância até a loja mais próxima e loja mais próxima de cada setor;
  - cobertura de cada bairro;
  - entorno das 129 lojas nos três raios: setores, moradores, domicílios, rendimento, favelas
    e outras lojas;
  - "mais próximos".
- **Atlas 2.0.** Os 41 indicadores em comum batem nos 94 bairros. As únicas diferenças são de
  arredondamento, na área e na densidade, que sai dela: a área é guardada com duas casas lá e
  com três aqui. Fora isso, só o nome Mont’Serrat difere, e ele foi corrigido aqui.
- **Cliques reais com o mouse: 30 de 30.**
  - bairro e setor no mapa;
  - marcador de loja;
  - raios;
  - CSV do entorno, com um setor por linha;
  - endereço compartilhável;
  - ranking, CSV do nível, metodologia, fontes e camadas;
  - busca por código de setor;
  - volta à cidade;
  - no celular de 390 px: lista das lojas, ficha, catálogo e nenhuma rolagem lateral.

## Limites

- **Lojas.** A lista vem do CNES. Uma loja sem registro ou aberta depois de abril de 2026
  fica de fora.
- **Posição.** 16 lojas têm só a coordenada do CNES, que o endereço não confirma. O entorno
  delas pode estar deslocado.
- **Distâncias.** São em linha reta, não pelo caminho das ruas. O entorno trabalha com setores
  inteiros.
- **Datas.** Os dados do Censo são de 2022 e as lojas, de 2026.
