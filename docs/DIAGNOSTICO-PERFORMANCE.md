# Atlas RMPA v2 — melhorias de performance

> Documento sobre a versão 2 recebida. O que ele propõe está incorporado na versão 3,
> em `atlas_v3/`; ver `atlas_v3/LEIA-ME.md`.

Objetivo: maximizar a velocidade de processamento da aplicação.

## Como os números foram obtidos

Chromium headless (Playwright), `index.html` servido por HTTP local, dados reais do pacote
(148 bairros, 4.722 setores, 1.650 escolas, 567 unidades de saúde, 20 lojas). Leaflet 1.9.4
servido localmente. Os tempos são de JS síncrono medido com `performance.now()` na própria
página. Máquina de servidor — em um notebook de escritório espere valores maiores, não menores.

## Linha de base medida

| Operação | Tempo |
|---|---|
| Boot até os dados prontos (RTT 40 ms) | 741 ms |
| `montaGeo()` | 45 ms |
| `agregaEquipamentosBairros()` | 30–34 ms |
| `garanteSetores()` (decodificar 4.722 setores) | 162 ms |
| `setNivel('setor')` | 359 ms |
| `desenhaMapa()` no nível bairro | 30 ms |
| `desenhaMapa()` no nível setor | 136 ms |
| Trocar só a rampa de cor (nenhum dado muda) | 151 ms |
| Trocar o nº de classes | 173 ms |
| `marcaSelecao()` (um clique) | 31–95 ms |
| `fcuOn(true)` | 44 ms |
| **Ligar a camada "Unidades de saúde" (567 pontos)** | **12.390 ms** |
| **Ligar a camada "Escolas" (1.650 pontos)** | **39.100–42.600 ms** |
| **Trocar de indicador com "saúde" ligada** | **74.163 ms** |

Heap após navegar por bairros e setores: 215 MB.

---

## P0 — Um renderer Leaflet por marcador (`atlas.js:1949`)

```js
PONTOS[chave].forEach((p,i)=>{
  const m=L.circleMarker([p.y,p.x],{
    renderer:loja?L.svg():L.canvas({padding:.4}),   // <-- dentro do loop
```

`L.canvas()` / `L.svg()` criam **um elemento e um renderer novos por ponto**. Ligar "Escolas"
insere 1.650 elementos `<canvas>` no mapa; "Unidades de saúde", 567. Confirmado no DOM:
`document.querySelectorAll('#map canvas').length === 2221` com as duas camadas ligadas.

Esta linha responde sozinha por quase todo o tempo de congelamento da aplicação.

**Correção:** um renderer por camada, criado fora do loop.

Medido, mesmos 1.650 pontos: **39.096 ms → 40 ms (≈ 970× mais rápido).**

O mesmo padrão está na camada de lojas (`L.svg()` por marcador). Com 20 pontos custa 1,5 ms,
mas vaza 20 painéis `<svg>` por vez que a camada é recriada — ver P1.

## P0 — As camadas de pontos vazam e são recriadas a cada redesenho (`atlas.js:586`, `1942`)

```js
function desenhaMapa(){
  ...
  setTimeout(()=>['lojas','escolas','saude'].forEach(k=>{
    if(S.camadas[k])pontosOn(k,true);}),0);
```

Duas falhas somadas:

1. `pontosOn` faz `map.removeLayer(grupo)`, mas os renderers criados em P0 **continuam no DOM**.
   Medido: ligar saúde → 567 `<canvas>`; desligar → **ainda 567 `<canvas>`**. O vazamento é
   cumulativo.
2. `desenhaMapa()` recria todas as camadas de pontos, embora elas não dependam do indicador,
   da rampa, do método de classificação nem do nº de classes.

Efeito combinado medido — trocar de indicador com a camada de saúde ligada:
**74.163 ms**, e o DOM sobe para 1.701 `<canvas>`.

**Correção:** construir cada camada de pontos uma única vez (memoizada) e apenas
`map.addLayer` / `map.removeLayer` para alternar. `desenhaMapa()` não deve tocar nelas.
Vale o mesmo para `fcuOn` (`atlas.js:2107`), recriada em todo redesenho ao custo de 44 ms.

## P1 — `desenhaMapa()` reconstrói a camada inteira para mudanças só de estilo (`atlas.js:581`)

Trocar a rampa de cor, o método de classificação ou o nº de classes não muda nenhuma geometria,
mas hoje destrói e recria os 4.722 polígonos, com tooltip e 3 listeners cada.

Medido no nível setor: **recriar a camada 315 ms × `camada.setStyle(fn)` 27 ms (≈ 12×).**

**Correção:** separar "mudou a geometria/o filtro" (reconstruir) de "mudou só a cor"
(`camada.setStyle`). Os botões de rampa (`renderProv`), de método e de nº de classes
(`renderLegenda`) devem chamar o caminho de restyle.

## P1 — Tooltip e 3 listeners por feição (`atlas.js:608-613`)

```js
onEachFeature:(f,l)=>{
  l.bindTooltip(()=>tooltipHTML(f.properties),...);
  l.on('mouseover',...); l.on('mouseout',...); l.on('click',...);
}
```

4.722 objetos Tooltip + 14.166 listeners por desenho.

Medido: **348 ms com listener por feição × 194 ms com delegação no grupo (−44%).**

**Correção:** um `bindTooltip` e os handlers no próprio `L.geoJSON` (o Leaflet propaga
`e.layer`/`e.propagatedFrom` do filho para o grupo).

## P1 — `marcaSelecao()` varre as 4.722 camadas a cada clique (`atlas.js:619`)

`camada.eachLayer(...)` com `setStyle`/`resetStyle` em todas as feições para destacar uma.
Medido: **31–95 ms por clique.**

**Correção:** guardar a referência da camada selecionada e das comparadas; restaurar só a
anterior e estilizar só a nova. Custo passa a ser O(1).

## P1 — Carregamento serial dos 8 scripts (`index.html:123-150`)

O carregador encadeia `onload` → próximo script. Cada arquivo espera o anterior terminar:
8 idas e voltas em série. Medido com RTT de 40 ms:

```
leaflet.js       início   55 ms  fim  109 ms
dados-nucleo     início  147 ms  fim  193 ms
dados-bairros    início  195 ms  fim  241 ms
dados-municipios início  244 ms  fim  290 ms
dados-setores    início  293 ms  fim  341 ms
dados-estimados  início  348 ms  fim  396 ms
dados-servicos   início  398 ms  fim  444 ms
dados-pontos     início  446 ms  fim  492 ms
atlas.js         início  495 ms  fim  541 ms
```

**Correção:** `<script defer>` para os 8 arquivos. `defer` baixa em paralelo e **preserva a
ordem de execução**, que é a razão de existir o carregador atual.

Medido: **741 ms → 327 ms (−56%).** Em rede móvel (RTT ~150 ms) a diferença passa de 1 s.

O fallback `dados/x.js` → `x.js` do carregador exige uma requisição falhada antes de acertar no
layout plano; se esse layout ainda for suportado, resolva por um `<base>` ou por dois conjuntos
de tags, não por tentativa e erro em série.

## P1 — Decodificar 61 colunas quando 1 é exibida (`atlas.js:2352-2353`)

`garanteSetores()` decodifica as 49 colunas do núcleo + 12 estimadas para os 4.722 setores.

Medido: 49 colunas **7,8 ms** × 1 coluna isolada **0,1 ms**.

**Correção:** decodificar a coluna sob demanda, com cache por campo. O perfil do território e a
análise de entorno pedem muitas colunas — então mantenha o caminho em lote para eles e deixe o
caminho preguiçoso para a pintura do mapa.

## P2 — Alocações dentro dos laços de decodificação

- `atlas.js:2360` e `2288`: `C.concat(CE)` cria um array novo a cada feição — 4.722 e 148
  arrays descartados. Medido: **2,5 ms** só nos setores. Basta içar para fora do `map`.
- `atlas.js:2361`: `slugId()` (NFD + 2 regex) por setor. Medido: **2,6 ms**. O número de bairros
  distintos é ~148; memoize por nome.
- `atlas.js:534`: `corDe()` chama `escalaCores()` por feição, reconstruindo a mesma paleta
  4.722 vezes por desenho. Medido: **1,8 ms**. Calcule a paleta uma vez em `desenhaMapa`.

## P2 — Cinco varreduras completas por redesenho

`desenhaMapa` monta `vals` e `quebras()` ordena; `renderProv` (`atlas.js:646-652`) varre duas
vezes para a cobertura; `renderLegenda` (`atlas.js:690`) **ordena o vetor completo de novo**.

Medido junto: **2,6 ms** por redesenho no nível setor. É pequeno perto da camada Leaflet, mas
é trabalho puramente duplicado: uma varredura só, com o resultado compartilhado.

## P2 — `entorno()` faz 33 reduces separados (`atlas.js:2414`)

```js
SOMAR.forEach(k=>{soma[k]=fs.reduce((a,f)=>a+(f.properties[k]??0),0);});
```

33 passagens sobre os setores do raio onde cabe uma. Medido: 0,6 ms para ~600 setores — baixo,
mas `abreEntorno` roda a cada troca de raio.

`entornoHTML` (`atlas.js:1990`) recalcula o agregado `CIDADE` dos 148 bairros a cada abertura;
esse valor é constante — calcule uma vez e guarde.

## P2 — `buscar()` normaliza tudo a cada tecla (`atlas.js:1902`)

`norm()` (NFD + regex) sobre 148 bairros e 4.722 setores a cada digitação, com `setTimeout` de
140 ms de debounce. Medido: **2,6–5,1 ms por tecla.**

**Correção:** um índice de busca com os nomes já normalizados, montado uma vez.

## P2 — `getInd()` é uma busca linear (`atlas.js:490`)

`IND.find(...)` sobre 156 indicadores, chamado por `indAtual()` dentro de `tooltipHTML` — ou
seja, a cada tooltip. Troque por um `Map` id → indicador, reconstruído após `verificaCatalogo()`.

## P2 — Compressão no servidor

| | bruto | gzip -9 |
|---|---|---|
| `dados/` (7 arquivos) | 1.106 KB | 539 KB |
| `dados-setores.js` | 687 KB | 384 KB |
| `atlas.js` | 165 KB | 47 KB |
| `atlas-rmpa.html` | 1.302 KB | 594 KB |

Se o Atlas for servido por HTTP, ligue gzip/brotli: são ~570 KB a menos no caminho crítico.
Isso não vale para o uso via `file://`, que é o modo descrito no LEIA-ME.

---

## O que NÃO vale a pena

**Trocar o objeto literal por `JSON.parse`.** É a recomendação padrão para payloads grandes, mas
aqui não se aplica: o conteúdo é quase todo string longa (polyline), não estrutura aninhada.

Medido em `dados-setores.js` (687 KB): objeto literal **2,1 ms** × `JSON.parse` **1,2 ms**.
Menos de 1 ms. Não compensa mexer no formato nem nos scripts de extração.

**Os scripts de `extracao/`.** Rodam fora da aplicação, sob demanda, sobre 1.650 e 567 linhas.
`df.apply(..., axis=1)` em `2_atualiza_cnes.py:122` e `3_atualiza_escolas.py:97` é lento por
linha, mas nessa escala é irrelevante. Não é onde está o problema.

---

## Sobre remover a seleção de escolas e unidades de saúde

Remover **as caixas de seleção das camadas** já elimina os dois piores números medidos
(12,4 s e 39,1 s de congelamento, mais os 74 s do redesenho). É a maior vitória isolada do
pacote — mas convém separar duas decisões, porque os pontos alimentam mais coisas além do mapa:

| Onde os pontos são usados | `atlas.js` |
|---|---|
| As camadas do mapa | `pontosOn` (1942) · `renderCamadas` (2085) |
| 7 indicadores por bairro (`inep_escolas` ×3, `cnes_*` ×4) | `agregaEquipamentosBairros` (2381) |
| Bloco "Equipamentos públicos no raio" do painel da loja | `entorno` (2426) · `entornoHTML` (2044) |

**Opção A — tirar só as camadas do mapa.** Os 7 indicadores por bairro e o painel de entorno
continuam funcionando. Some o congelamento; continuam os 30–34 ms de
`agregaEquipamentosBairros` no boot e os 92 KB de `dados-pontos.js`.

**Opção B — tirar também os indicadores e o bloco de equipamentos.** Aí dá para cortar os
arrays `nomes` (53 KB em escolas, 16 KB em saúde) e `end`, que só existiam para os tooltips do
mapa, e eliminar `agregaEquipamentosBairros` por completo.

| | bruto | gzip |
|---|---|---|
| `dados-pontos.js` hoje | 92 KB | 32 KB |
| só lojas | 2 KB | 1 KB |
| escolas+saúde sem `nomes`/`end` (mantendo contagens) | 22 KB | 10 KB |

Ou seja: mesmo guardando as contagens por bairro e por raio, dá para ir de 92 KB para ~24 KB
descartando apenas os nomes e endereços — que, sem as camadas no mapa, não são mais exibidos
em lugar nenhum.

Vale notar que `agregaEquipamentosBairros` custa 30–34 ms porque faz 148 × 2.217 testes de
ponto-em-polígono. Se a Opção A for a escolhida e esses 34 ms incomodarem, um filtro por
bounding box do bairro antes do teste ponto-em-polígono resolve sem mudar nenhum resultado.

---

## Ordem sugerida

1. Renderer único por camada de pontos (P0) — 39.100 ms → 40 ms
2. Camadas de pontos e FCU criadas uma vez, sem recriação em `desenhaMapa` (P0) — mata os 74 s
   e o vazamento de elementos
3. `defer` nos scripts (P1) — 741 ms → 327 ms
4. Caminho de restyle separado da reconstrução (P1) — 315 ms → 27 ms
5. Delegação de tooltip/eventos (P1) — 348 ms → 194 ms
6. `marcaSelecao` em O(1) (P1) — até 95 ms → ~0
7. Decodificação de coluna sob demanda (P1) — 7,8 ms → 0,1 ms
8. Itens P2, que somados valem ~10 ms por interação

Os itens 1 e 2 são os únicos com efeito visível a olho nu; o resto é a diferença entre uma
interface que responde em ~30 ms e uma que responde em ~300 ms.
