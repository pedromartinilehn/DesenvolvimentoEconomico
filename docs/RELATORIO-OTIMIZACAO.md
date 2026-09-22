# Atlas RMPA v2 — P0 e P1 implementados, com medição antes/depois

Objetivo: maximizar a velocidade de processamento.
Entrega: `Atlas_RMPA_v2_otimizado.zip` (mesma estrutura do pacote original).

## Método

Chromium headless (Playwright), duas cópias servidas por HTTP local a partir do mesmo
`dados/`: `baseline` (pacote original, intocado) e `otim` (otimizado). Tempos de JS síncrono
medidos com `performance.now()` na própria página. O tempo de carregamento usa 40 ms de RTT
simulado. Máquina de servidor — num notebook de escritório espere valores maiores.

## Antes de medir: a saída não mudou

Sonda de 16,6 KB comparando as duas versões campo a campo:

- contagem de feições nos três níveis;
- soma de 12 indicadores em bairro e em setor (inclusive derivados e estimados);
- as 7 contagens de equipamentos por bairro, e a lista completa bairro a bairro;
- quebras de classe e paleta para 4 combinações de nível × indicador, em quantis e em
  intervalos iguais, com 5 e com 7 classes;
- os 100 resultados de entorno (20 lojas × 5 raios): nº de setores, população, domicílios,
  renda, densidade, escolas, unidades de saúde, municípios e comunidades;
- resultados de busca para 7 consultas;
- textos gerados de proveniência, legenda, perfil, ranking, matriz, metodologia e fontes;
- comportamento com filtro de município ativo.

**Resultado: nenhuma diferença. Zero erros de console nas duas versões.**

Também verifiquei os dois modos de distribuição: pasta plana (sem `dados/`) e
`atlas-rmpa.html` standalone.

---

# Resultados

## Interação e carregamento

| operação | antes | depois | ganho |
|---|---:|---:|---|
| carregar a página até os dados prontos (RTT 40 ms) | 923 ms | 278 ms | **×3,3** |
| `montaGeo()` | 68,3 ms | 16,9 ms | ×4,0 |
| `agregaEquipamentosBairros()` | 24,0 ms | 7,7 ms | ×3,1 |
| `garanteSetores()` — decodificar 4.722 setores | 121,8 ms | 58,0 ms | ×2,1 |
| trocar de indicador — nível bairro | 33,2 ms | 4,0 ms | ×8,3 |
| trocar rampa de cor — nível bairro | 11,1 ms | 0,7 ms | ×15,9 |
| `setNivel('setor')` | 242,6 ms | 99,7 ms | ×2,4 |
| `desenhaMapa()` — nível setor | 191,2 ms | 69,8 ms | ×2,7 |
| **trocar de indicador — nível setor** | **137,7 ms** | **10,8 ms** | **×12,7** |
| trocar rampa de cor — nível setor | 137,2 ms | 4,5 ms | **×30,5** |
| trocar nº de classes — nível setor | 149,4 ms | 5,1 ms | ×29,3 |
| trocar método de classificação — nível setor | 139,2 ms | 5,5 ms | ×25,3 |
| clicar num setor (selecionar) | 53,7 ms | 27,7 ms | ×1,9 |
| `marcaSelecao()` com 2 comparados | 12,5 ms | 0,1 ms | **×125** |
| `buscar()` — primeira tecla | 3,6 ms | 4,0 ms | — (monta o índice) |
| `buscar()` — tecla seguinte | 2,3 ms | 0,2 ms | ×11,5 |
| `entorno()` — raio de 5 km | 3,7 ms | 3,7 ms | — |
| abrir painel de entorno da loja | 47,6 ms | 26,9 ms | ×1,8 |
| `fcuOn(true)` — favelas e comunidades | 26,8 ms | 6,5 ms | ×4,1 |
| desligar e religar a camada FCU | 28,3 ms | 3,3 ms | ×8,6 |

Heap JS ao final do roteiro: 141 MB → 125 MB.

## Camadas de pontos — onde estava o problema

| operação | antes | depois | ganho |
|---|---:|---:|---|
| ligar "Unidades de saúde" (567 pontos) | (ver abaixo) | **30,9 ms** | |
| desligar "Unidades de saúde" | | 5,4 ms | |
| religar "Unidades de saúde" | | 9,1 ms | |
| ligar "Escolas" (1.650 pontos) | (ver abaixo) | **30,7 ms** | |
| trocar de indicador com as 2 camadas ligadas | | **4,4 ms** | |

| estado do DOM | antes | depois |
|---|---:|---:|
| elementos `<canvas>` com as duas camadas ligadas | 2.221 | **2** |
| `<canvas>` restantes após desligar a camada | 567 (órfãos) | 1 |
| elementos dentro de `#map` ao final | milhares | 200 |
| heap JS | — | 15 MB |

---

# O que foi alterado

## P0-1 — Um renderer por camada, não um por marcador

`atlas.js`, dentro do laço de `pontosOn`:

```js
renderer: loja ? L.svg() : L.canvas({padding:.4}),   // um renderer NOVO por ponto
```

`L.canvas()`/`L.svg()` criam um elemento e um renderer a cada chamada. Ligar "Escolas"
inseria 1.650 elementos `<canvas>` no mapa.

Agora há um renderer por camada, criado uma vez (`rendererDe`), e o tooltip de cada ponto
é montado sob demanda em vez de 2.217 strings de HTML construídas de antemão.

## P0-2 — Camadas de pontos e FCU construídas uma vez

Duas falhas somadas:

1. `pontosOn` fazia `map.removeLayer(grupo)`, mas os renderers criados no laço ficavam no
   DOM. Desligar a camada de saúde deixava os 567 `<canvas>` para trás, e o vazamento era
   cumulativo.
2. `desenhaMapa()` recriava todas as camadas de pontos num `setTimeout`, embora elas não
   dependam do indicador, da rampa, do método nem do nº de classes.

Agora cada camada é construída uma vez (`constroiPontos`) e só entra e sai do mapa.
`fcuOn` recebeu o mesmo tratamento. Para manter os pontos acima do coroplético sem
recriá-los, criei dois *panes* — `atlasSobre` (z 460, FCU e raio da loja) e `atlasPontos`
(z 480) —, que é a forma que o Leaflet oferece para ordenar camadas.

## P1-3 — Carregamento paralelo preservando ordem e fallback

O carregador encadeava `onload` → próximo script: oito idas e voltas em série. Agora são
`<script defer>`, que baixam em paralelo e **preservam a ordem de execução** — que era a
única razão de o carregador existir.

O fallback de pasta plana foi mantido: um bloco que roda no `DOMContentLoaded` (depois dos
`defer`) confere os sete globais e, se algum faltar, cai no carregamento em série como
antes. O `atlas.js` entra por `<link rel="preload">`, para não custar mais uma ida e volta.

Verificado: no layout plano os sete arquivos carregam, 148 bairros e 4.722 setores.

## P1-4 — Repintar sem reconstruir

Trocar indicador, rampa, método ou nº de classes não muda nenhuma geometria, mas destruía e
recriava os 4.722 polígonos. Agora `desenhaMapa()` reconstrói (mudou o nível ou o filtro de
município) e `repintaMapa()` só recalcula a escala e chama `camada.setStyle`.

## P1-5 — Um tooltip e três listeners no grupo, não 4.722 vezes cada

`onEachFeature` criava um objeto Tooltip e três listeners por feição. Agora o tooltip e os
handlers ficam no próprio `L.geoJSON`, que entrega a feição filha em `e.propagatedFrom`.

Um efeito colateral corrigido: no nível setor, `mouseover` chamava `bringToFront()`, o que
obrigava o canvas a redesenhar os 4.722 polígonos **a cada passagem do mouse**. No nível
setor o realce visual não era aplicado de qualquer forma, então esse redesenho era trabalho
puro. A seleção também deixou de ser apagada ao passar o mouse por cima dela.

## P1-6 — `marcaSelecao()` em O(1)

Varria as 4.722 camadas a cada clique. Agora guarda um índice `id → camada` e um registro
das camadas realçadas; restaura só a anterior e estiliza só a nova.

## P1-7 — reformulado, com base em medição

O item previa "decodificar coluna sob demanda". Ao perfilar `garanteSetores()` por dentro,
o custo não estava ali:

| parte de `garanteSetores()` (184 ms) | |
|---|---:|
| decodificar as 49 colunas do núcleo | 1,8 ms |
| decodificar as 12 colunas estimadas | 0,6 ms |
| dicionários e centroides | 1,4 ms |
| decodificar a geometria dos 4.722 setores | 7,7 ms |
| **montar os 4.722 objetos de propriedades** | **54,2 ms** |
| **`derivados()` nos 4.722 setores** | **75,4 ms** |

Decodificação inteira: 11,5 ms de 184 ms. A decodificação preguiçosa renderia ~2 ms e
exigiria materializar colunas sob demanda em nove pontos de leitura (`exportaNivel`,
`comparaHTML`, `renderRank`, `perfilHTML`…) — qualquer um esquecido zera um indicador em
silêncio. Não vale o risco.

Ataquei o que de fato custa, sem mudar semântica: `C.concat(CE)` içado do laço (eram 4.722
arrays descartados), `slugId()` memoizado por nome de bairro (~148 nomes, não 4.722
chamadas) e os prefixos de código de município pré-calculados. **121,8 ms → 58,0 ms.**

## Itens P2 que estavam nas mesmas funções

- `escalaCores()` era reconstruída por feição dentro de `corDe()`; agora a paleta é
  calculada uma vez por repintura.
- Cinco varreduras e duas ordenações por redesenho viraram uma: `calculaEscala()` monta o
  vetor de valores e o vetor ordenado, e `renderProv`/`renderLegenda` reaproveitam.
- `getInd()` era `IND.find()` linear sobre 156 indicadores, chamado a cada tooltip; virou
  um `Map`, invalidado quando o catálogo muda.
- `buscar()` normalizava 4.870 feições a cada tecla; agora há um índice com os nomes já
  normalizados, montado na primeira busca.
- `entorno()` fazia 33 `reduce` separados sobre os mesmos setores; virou uma passagem.
- O agregado de Porto Alegre em `entornoHTML` é constante e era recalculado a cada abertura
  de loja; agora é memoizado.
- `agregaEquipamentosBairros()` testa a caixa envolvente do bairro antes do ponto-em-polígono.
  Conferido: as contagens por bairro são idênticas às anteriores.

## Um bug que apareceu no caminho

`build_single.py` monta o `atlas-rmpa.html` embutindo tudo inline. Com `defer` no Leaflet, o
`atlas.js` inline passou a rodar **antes** do Leaflet — `L is not defined`, tela de erro. O
`build_single.py` agora remove o `defer` da tag do Leaflet ao gerar o standalone, já que ali
todo o resto é inline e síncrono. Standalone reconferido: 148 bairros, 4.722 setores, mapa
desenhado, zero erros.

---

# O que não foi feito, e por quê

**Decodificação de coluna sob demanda** — ver P1-7: 2 ms de ganho contra risco de zerar
indicadores em silêncio.

**`JSON.parse` no lugar do objeto literal** — medido em `dados-setores.js` (687 KB):
2,1 ms × 1,2 ms. Menos de 1 ms; o conteúdo é quase todo string longa de polyline, não
estrutura aninhada.

**`derivados()` e a montagem dos objetos de propriedades** — juntos são 130 ms dos 184 ms
de `garanteSetores()`, que roda **uma vez por sessão**. Reduzi-los de verdade exige trocar
os 4.722 objetos por colunas tipadas com acesso por índice, o que mexe em todo o código que
lê `f.properties`. É a próxima fronteira, mas é uma refatoração de arquitetura, não um ajuste.

**Os scripts de `extracao/`** — rodam fora da aplicação, sobre 1.650 e 567 linhas.

---

# Sobre tirar escolas e unidades de saúde

A decisão continua de pé e agora é só de produto, não de performance: com o P0 aplicado,
ligar as duas camadas custa ~31 ms cada e trocar de indicador com elas ligadas custa 4,4 ms.

Se ainda assim forem removidas, o que dá para cortar junto:

| | bruto | gzip |
|---|---:|---:|
| `dados-pontos.js` hoje | 92 KB | 32 KB |
| só lojas | 2 KB | 1 KB |
| escolas+saúde sem `nomes`/`end`, mantendo as contagens | 22 KB | 10 KB |

Os arrays `nomes` (53 KB em escolas, 16 KB em saúde) e `end` só existem para os tooltips do
mapa. Sem as camadas, não são exibidos em lugar nenhum — mas os pontos continuam alimentando
os 7 indicadores por bairro (`inep_escolas` ×3, `cnes_*` ×4) e o bloco "Equipamentos públicos
no raio" do painel da loja, que seguem funcionando.
