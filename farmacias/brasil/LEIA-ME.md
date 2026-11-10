# Farmácias do Brasil — Panvel, Raia Drogasil e Pague Menos

Mapa das 5.246 farmácias das três redes ativas no CNES de abril de 2026, sobre os 5.570
municípios e os 17.575 bairros do Censo 2022 do Atlas 2.0 (`atlas2/`):

| rede | empresa no CNES | lojas |
|---|---|---:|
| Panvel | Dimed S/A Distribuidora de Medicamentos | 593 |
| Raia Drogasil | Raia Drogasil S.A. (Droga Raia e Drogasil) | 3.277 |
| Pague Menos | Empreendimentos Pague Menos S.A. e Imifarma (Extrafarma) | 1.376 |

Cada loja tem uma ficha com o entorno em raios de 500 m, 1 km e 2 km, e cada município, bairro,
UF e região tem 16 indicadores de cobertura das redes. Os outros 92 indicadores do Atlas 2.0
continuam no catálogo.

Todo valor mostra a fonte, o ano e o nível. O que a fonte não publica fica em branco: o atlas
não estima, não interpola e não completa valor.

## Como abrir

- **Arquivo único:** `farmacias-brasil.html` (14,5 MB), com o Atlas 2.0, as cinco regiões e as
  lojas dentro. Abre direto do disco. A biblioteca do mapa (Leaflet) vem embutida; só as fontes
  tipográficas e o mapa de fundo vêm da internet.
- **Pasta:** `index.html`, com `farmacias-brasil.js`, `farmacias-brasil.css` e
  `dados/farmacias.js`. A interface e os dados do Censo vêm de `../../atlas2/`, então a pasta
  precisa estar dentro do repositório, ao lado de `atlas2/`. Também abre direto do disco.

O endereço guarda o estado. `index.html#l=0269832` abre a loja de CNES 0269832 (Panvel da Rua
Silveiro, em Porto Alegre), com a região e o entorno.

## Celular e acessibilidade (novembro de 2026)

- **No iPhone, use o link:** a prévia de arquivos do celular não executa JavaScript, então o arquivo .html não abre o
  mapa ali (aparece um aviso). Versão publicada, privada, que abre no navegador do celular: https://claude.ai/artifact/BgxRy4r2nRPtfcht4J5LHo
  Nela, os botões que baixam arquivos (CSV, PNG) não funcionam; para exportar, use o arquivo no computador.
- **Abre sem internet.** O Leaflet passou a vir dentro do arquivo único (`vendor/leaflet` na raiz do repositório,
  versão 1.9.4, licença BSD-2, embutido por `vendor/embute_leaflet.py`). Antes, onde o script externo não carregava
  (como na prévia de arquivos do app no celular), o atlas parava com "L is not defined" e a tela ficava vazia.
- **Topo em duas linhas no celular**, sem nada passando da borda em telas de 320 a 390 px.
- **Alvos de toque de 44 px** (níveis, zoom, menu, caixas das camadas) e **campos com 16 px**, para o iOS não dar
  zoom ao tocar na busca; no celular o campo de busca mostra só "Buscar".
- **Painéis do mapa compactos:** legenda com altura máxima; o cartão de camadas começa recolhido.
- **Leitor de tela e teclado:** gaveta e painel fechados saem da ordem de foco, o botão do menu informa se a gaveta
  está aberta (`aria-expanded`) e o foco fica visível.

## O que tem

| | |
|---|---|
| Mapa | as lojas sobre o mapa do Atlas 2.0, uma cor por rede; o cartão *Lojas no mapa* liga e desliga cada rede |
| Ficha da loja | rede, marca, nome fantasia, CNES, CNPJ, endereço e bairro; como a loja foi localizada e com que incerteza; o entorno no raio escolhido, comparado com o município e a UF; as outras lojas das três redes no raio; a loja mais próxima de cada rede |
| Fichas de município e bairro | as lojas das três redes ali, por rede e marca, com os moradores no raio de cada uma |
| Indicadores | 16 indicadores de cobertura, por município, bairro, UF e região, nas categorias *Farmácias: as três redes*, *Panvel*, *Raia Drogasil* e *Pague Menos e Extrafarma* |
| Lista das lojas | todas as lojas, com filtro por texto, rede, região e município, ordenável; CSV com o entorno nos três raios |
| Busca | município, bairro ou loja (endereço, CNES, nome fantasia) |

O entorno de cada loja traz moradores, domicílios, setores do Censo no raio, rendimento médio
do responsável e 12 taxas do Censo 2022:
- crianças de 0 a 14 anos, pessoas de 60 anos ou mais, pretos ou pardos, analfabetismo;
- moradores em favelas e comunidades urbanas;
- esgoto precário, água da rede geral, lixo coletado;
- moradores em rua com ponto de ônibus, pavimentação, iluminação pública e calçada.

## As lojas

Loja é o estabelecimento ativo no Cadastro Nacional de Estabelecimentos de Saúde (CNES,
competência de abril de 2026), registrado como farmácia (tipo 43), com o CNPJ de uma das quatro
empresas. Conta a raiz do CNPJ, os 8 primeiros dígitos. O arquivo é o que o IPEA publica para o
pacote geobr (`healthfacilities_202604.parquet`).

| empresa | raiz do CNPJ | farmácias ativas | outros tipos, ativos | farmácias desativadas |
|---|---|---:|---:|---:|
| Dimed S/A Distribuidora de Medicamentos (Panvel) | 92.665.611 | 593 | 4 | 31 |
| Raia Drogasil S.A. | 61.585.865 | 3.277 | 23 | 68 |
| Empreendimentos Pague Menos S.A. | 06.626.253 | 1.167 | 20 | 56 |
| Imifarma Produtos Farmacêuticos e Cosméticos S.A. (Extrafarma) | 04.899.316 | 209 | 1 | 3 |

- Os outros tipos das empresas não são loja e ficam de fora: clínica, consultório, centro de
  imunização, central de abastecimento, laboratório.
- A Imifarma, empresa da Extrafarma, foi comprada pela Pague Menos em 2022. O atlas a conta na
  rede Pague Menos.
- Farmácia precisa de registro no CNES quando oferece serviço de saúde. Uma loja aberta depois
  de abril de 2026, ou sem registro, não aparece. Por isso o número pode diferir do que a
  empresa divulga.
- A lista de lojas dos sites das redes não pôde ser aberta no ambiente em que o atlas é
  montado: o acesso a esses sites é bloqueado. Se ela for anexada, o atlas confere loja por loja.

**Marca.** O atlas lê a marca no nome fantasia do CNES, por regra fixa:
- "RAIA" sem "DROGASIL" é Droga Raia;
- "DROGASIL" sem "RAIA" é Drogasil (a regra aceita as grafias erradas do cadastro, como
  "DROGRASIL");
- "PAGUE MENOS" é Pague Menos;
- "EXTRAFARMA" ou "EXTRA FARMA" é Extrafarma.

Quando o nome fantasia é o da empresa ("RAIA DROGASIL S A", "IMIFARMA"), um código de loja ou
fica vazio, a marca fica *não identificada no CNES*. A Dimed só tem a marca Panvel.

| rede | marcas |
|---|---|
| Raia Drogasil | Drogasil 1.337 · Droga Raia 1.121 · não identificada 819 |
| Pague Menos | Pague Menos 1.168 · Extrafarma 142 · não identificada 66 |

**Onde estão.** Panvel no RS (395), PR (102), SC (84) e SP (12); Raia Drogasil e Pague Menos nas
27 UFs. As lojas estão em 802 municípios: Panvel em 140, Raia Drogasil em 622 e Pague Menos
em 360.

## Onde fica cada loja

O CNES traz a coordenada declarada pelo estabelecimento. O arquivo do geobr traz também a do
geocodebr (IPEA), que localiza o endereço no Cadastro Nacional de Endereços do Censo 2022. As
duas nem sempre concordam.

A regra é a do Atlas Porto Alegre, mais estrita que a do geobr, porque o entorno usa raios de
500 m. Há uma conferência a mais: o ponto tem de cair, na malha de setores do Censo 2022, no
município do endereço do CNES. A regra segue esta ordem:

| regra | lojas |
|---|---:|
| O geocodebr achou o número do endereço (desvio de até 50 m): ponto do endereço | 2.638 |
| A coordenada do CNES cai na área do CEP do endereço (CEP com desvio de até 800 m), ou a até 150 m do ponto do geocodebr: coordenada do CNES | 1.049 |
| Senão, o centro do CEP do endereço, se o CEP tem até 800 m de desvio | 929 |
| Senão, a coordenada do CNES, sem confirmação | 613 |
| A coordenada do CNES cai no mar ou em outro município: ponto do geocodebr para o endereço, aproximado | 17 |

- Em 111 lojas a coordenada do CNES cai fora do município do endereço. Em 94 delas, o ponto
  do endereço (41) ou o centro do CEP (53) já põe a loja no município certo.
- As outras 17 ficam *aproximadas*. O ponto é o do geocodebr para o endereço (em 16, o centro
  do CEP), com desvio de 907 m a 2,7 km.
- Doze dessas 17 ficam em São Luís (MA). Lá, a coordenada do CNES cai no mar ou em outro
  município, de 10 a 74 km do endereço.

A ficha mostra a classe de cada loja e avisa quando o entorno pode estar deslocado ("sem
confirmação" ou "aproximada").

**Registros parecidos.** O atlas mostra todas as lojas abaixo e avisa na ficha. Pode ser loja
distinta ou registro repetido no CNES; o atlas não decide.
- 30 lojas têm outra loja ativa da mesma rede no mesmo endereço, escrito de formas diferentes,
  com outro CNPJ.
- 107 ficam a menos de 50 m de outra loja da mesma rede.
- Loja posta no centro do CEP fica fora da conta dos 50 m, porque esse ponto não diz onde ela
  fica dentro do CEP.

## Entorno

O entorno é a soma dos setores censitários do Censo 2022 cujo ponto representativo está a até
500 m, 1 km ou 2 km da loja, em linha reta. O ponto representativo é um ponto dentro do
polígono do setor (`shapely.point_on_surface`). A distância é calculada pela fórmula de
haversine, com raio médio da Terra de 6.371.008,8 m.

- Contagens somam: moradores, domicílios, setores.
- Taxas são recalculadas sobre a soma dos setores.
- O sigilo do IBGE segue as regras do Atlas 2.0. Quando o sigilo deixa um intervalo maior que
  a casa decimal mostrada, a ficha mostra o meio do intervalo com "≈" e o mínimo e o máximo.
- O analfabetismo usa o total de 15 anos ou mais apertado pelas categorias da alfabetização,
  como no Atlas Porto Alegre.
- Se os setores com dado têm menos da metade dos moradores do raio, a taxa fica em branco.
- O município e a UF do quadro são os valores do Atlas 2.0.

## Cobertura por município, bairro, UF e região

São quatro indicadores para cada rede e para as três juntas, todos cálculo do atlas:

| indicador | conta |
|---|---|
| Lojas | no município, pelo endereço do CNES; no bairro, pelo ponto (3.080 lojas caem num bairro do IBGE) |
| Lojas por 10 mil habitantes | lojas ÷ população do Censo 2022 × 10.000 |
| Moradores a até 1 km de uma loja | população dos setores com o ponto representativo a até 1 km de uma loja da rede ÷ população |
| Distância média até a loja mais próxima | média da distância de cada setor até a loja mais próxima da rede, com peso da população |

No Brasil, 23,9% dos moradores estão a até 1 km de uma loja das três redes:
- Panvel 2,2%;
- Raia Drogasil 19,6%;
- Pague Menos 8,9%.

Por região, a parte a até 1 km de uma das três é de 28,7% no Sudeste, 21,8% no Centro-Oeste,
21,6% no Nordeste, 20,4% no Sul e 15,4% no Norte.

**Classes do mapa.** Muitos municípios e bairros não têm loja, e com quintis o mapa ficaria
só "zero ou mais". Por isso os indicadores de contagem e cobertura usam uma classe só para o
zero e quartis dos valores acima de zero. A distância média usa quintis, como o Atlas 2.0.

## Conferências

Os scripts conferem antes de gravar e param se algo não bater:
- a lista de lojas, sem CNPJ nem código CNES repetido;
- todo ponto no município do endereço;
- os 468.097 setores da malha iguais aos do Censo em cada UF, e o ponto representativo dentro
  do setor;
- a população somando 203.080.756 (Censo 2022);
- os 5.570 municípios e os 17.575 bairros iguais aos do Atlas 2.0, e a população de cada um
  igual à dele;
- cada coluna decodificada de volta e comparada.

**Auditoria independente.** Um segundo programa refaz tudo a partir dos arquivos brutos (CNES,
censobr e malhas). Ele usa código próprio e outro algoritmo: força bruta por produto escalar na
esfera, em vez da árvore de busca dos scripts.

Ele refaz:
- a lista e a localização das lojas;
- o entorno nos três raios;
- as outras lojas no raio e a mais próxima de cada rede;
- os 16 indicadores em todos os municípios e bairros e nas UFs, regiões e Brasil.

O resultado foi comparado com o que o navegador decodifica, na pasta e no arquivo único: 716.401
de 716.401 comparações iguais. As taxas do entorno entram na comparação quando nenhum setor do
raio tem categoria omitida pelo sigilo. Isso vale para 5.361 dos 15.738 entornos no caso da
idade, e para todos nas taxas do entorno das ruas.

Essa auditoria achou um defeito, que já foi corrigido. O ponto representativo era arredondado
com `np.round` e às vezes ficava um milionésimo de grau (cerca de 0,1 m) diferente do
arredondamento decimal. Com isso, um setor a exatos 1.000,0 m de uma loja entrava ou saía do raio.

**Cruzamento com o Atlas Porto Alegre.** As 129 lojas Panvel de Porto Alegre saem com a mesma
coordenada, a mesma classe e o mesmo bairro, e os 2.744 pontos dos setores são os mesmos. Dos 387
entornos dessas lojas, 386 ficam dentro de Porto Alegre e dão exatamente os mesmos moradores,
domicílios, setores, rendimento e lojas no raio. O que passa a divisa inclui, aqui, os setores do
município vizinho.

**Navegador** (Chromium, Playwright), na pasta e no arquivo único:
- abre em menos de um segundo, com as 5.246 lojas;
- as cinco regiões carregam com as colunas das redes;
- o clique numa loja abre a ficha, e o clique fora das lojas abre o município;
- raios, lista ordenável, CSV (5.246 linhas, 87 colunas), busca, link `#l=` e metodologia;
- celular de 390 px, sem rolagem lateral;
- nenhum erro na página.

## Como atualizar

```bash
cd farmacias/brasil
python3 extracao/1_setores.py    # setores do Censo 2022: ponto representativo e contagens (geobr, censobr)
python3 extracao/2_lojas.py      # lojas das três redes no CNES, com a posição conferida pela malha
python3 extracao/3_monta.py      # entorno, cobertura e dados/farmacias.js
python3 build_single.py          # farmacias-brasil.html
```

Os scripts baixam o que falta para `extracao/fontes/` (não versionado, cerca de 1,9 GB):
- as 27 malhas de setores do geobr;
- os cinco arquivos do censobr;
- o CNES do geobr_prep.

Requisitos: Python 3.11, `shapely` 2.1 ou mais novo, `pyarrow`, `numpy` e `scipy`. Os
municípios, os bairros e os indicadores do Censo vêm de `atlas2/dados/`. Se o Atlas 2.0 for
regenerado, rode de novo o `3_monta.py`.

Para outra competência do CNES, troque `COMPETENCIA` e o nome do arquivo em `2_lojas.py`.

## Estrutura

```
farmacias/brasil/
├── index.html                     página (usa ../../atlas2/atlas2.js, atlas2.css e dados/)
├── farmacias-brasil.js            extensão do Atlas 2.0: lojas, ficha, lista, CSV, busca
├── farmacias-brasil.css
├── farmacias-brasil.html          arquivo único (gerado por build_single.py)
├── build_single.py
├── dados/farmacias.js             lojas, entorno, cobertura por região, comparações e conferências
└── extracao/
    ├── 1_setores.py  2_lojas.py  3_monta.py
    └── fontes/                    arquivos baixados e intermediários (não versionados)
```

A extensão entra pelos ganchos de `atlas2/atlas2.js` (`window.ATLAS2_EXT`) e pela configuração
`window.ATLAS2_CFG` (pasta dos dados e indicador inicial). Sem eles, o Atlas 2.0 fica igual.

## Limites

- O CNES não é a lista de lojas das empresas: falta a loja sem registro ou aberta depois de
  abril de 2026.
- Entorno e cobertura usam o ponto representativo do setor e distância em linha reta, não o
  caminho a pé.
- 613 lojas têm só a coordenada do CNES, sem confirmação pelo endereço, e 17 são aproximadas:
  nelas, o entorno pode estar deslocado.
- A marca vem do nome fantasia. Em 819 lojas da Raia Drogasil e 66 da Pague Menos o cadastro
  não a informa.
- Os indicadores do Censo por município e bairro são os do Atlas 2.0, com os limites descritos
  em `atlas2/LEIA-ME.md`.
