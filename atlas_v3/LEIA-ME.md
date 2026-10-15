# Atlas Metropolitano RMPA — versão 3.8

Mapa socioeconômico para análise territorial e do entorno das lojas Renner em sete municípios:
Porto Alegre, Canoas, Gravataí, Sapucaia do Sul, Cachoeirinha, Guaíba e Esteio.

## Como abrir

- Mais simples: abra `atlas-rmpa.html`. É a versão standalone, com interface, dados e código embutidos.
- Para desenvolvimento: mantenha `index.html`, `atlas.css`, `atlas.js` e a pasta `dados/` juntos.
- Não abra o HTML de dentro do ZIP; extraia a pasta antes.
- O mapa-base opcional e a biblioteca Leaflet usam internet. Os dados do Atlas estão no pacote.

## O que mudou na versão 3.8: extrações dentro do HTML

O que antes só entrava rodando uma extração agora vem pronto dentro do arquivo do Atlas. Os arquivos
do IPEA para o pacote censobr, com os dados do Censo do IBGE, passaram a abrir no ambiente em que o
pacote é montado. Dois scripts novos usam esses arquivos.

- **`extracao/9_censo2022_setores.py` → `dados/dados-censo2022.js`.** Traz 20 campos do Censo 2022 por
  setor, bairro e município:
  - os 11 indicadores que o catálogo previa e estavam sem dado: domicílios particulares e coletivos,
    casa de vila, cortiço, estrutura degradada, banheiro de uso comum, sem água encanada, óbitos de
    homens e de mulheres e densidade domiciliar;
  - o só sanitário ou buraco;
  - o entorno dos domicílios: pavimentação, iluminação, calçada, rampa, árvores, bueiro, obstáculo
    na calçada, ponto de ônibus e ciclovia.

  Antes de gravar, o script confere 12 campos com o pacote, nos 4.722 setores. Onde o IBGE omitiu o
  valor de um setor, o bairro e o município mostram a soma parcial e quantos setores faltaram.
- **`extracao/10_censo2010_amostra.py` → `dados/dados-extracoes.js`.** É o resultado do cartão
  "Censo 2010" da central, calculado com os microdados da amostra:
  - 12 indicadores por município (desocupação por sexo e idade, jovens que não estudam nem
    trabalham, chefia feminina, idosos que moram sós, deficiência, não naturais e Bolsa Família);
  - a tabela por área de ponderação;
  - a conferência da renda de 2010.

  O arquivo é um **pacote de extrações**: guarda itens no formato da central, que o Atlas aplica ao
  abrir. A central os mostra como "no pacote do Atlas", e uma extração nova do navegador vale por
  cima.
- **IDHM de 2000** nos sete municípios, da série do Atlas Brasil que já estava no pacote.
- **Correções.** "Percentual de casas" passa a contar a casa de vila, e "Percentual sem banheiro de
  uso exclusivo", o banheiro de uso comum e o só sanitário. Os dois saíam menores, porque esses
  componentes não estavam no pacote.
- **Achado E3 da auditoria, resolvido.** A conferência mostra que o cálculo de 2010 do Atlas deixa a
  renda ausente de fora e reproduz os microdados. A hipótese de viés não se confirmou, e os números
  ficam.
- **Diagnóstico regional.** Ganhou três tabelas: famílias, idosos, deficiência e migração (2010);
  trabalho e juventude por sexo e idade (2010); rua e moradia (2022).

```bash
pip install pyarrow                          # uma vez
python3 extracao/9_censo2022_setores.py      # Censo 2022 por setor
python3 extracao/10_censo2010_amostra.py     # Censo 2010, amostra
python3 build_single.py
```

Como cada caminho leva um dado para dentro do HTML, o que entrou e o que continua de fora (e por
quê) estão em [`../docs/EXTRACOES-NO-HTML.md`](../docs/EXTRACOES-NO-HTML.md).

## Versão 3.7: varredura do Ipeadata

A varredura procurou no Ipeadata as séries com valor para os sete municípios que o Atlas ainda não
tinha. O resultado está em [`../docs/VARREDURA-IPEADATA.md`](../docs/VARREDURA-IPEADATA.md) e entra
no Atlas por dois caminhos.

**38 séries novas dentro do pacote.** O script `extracao/8_series_complementares.py` lê as mesmas
bases no espelho público da Base dos Dados e grava `dados/dados-series.js`. O arquivo único já sai
com elas:

| fonte | séries | ano no mapa | categorias |
|---|---|---|---|
| Atlas do Desenvolvimento Humano | 19: fecundidade, sobrevivência, frequência escolar, renda por quinto, ocupação | 2010 | demografia, saúde, educação, renda, trabalho |
| Programa Nacional de Imunizações | 6 coberturas vacinais | 2021 | saúde |
| SNIS | 7 de água e esgoto, com o código do SNIS | 2022 | saneamento |
| ANA, Atlas Esgotos | 4 sobre o destino do esgoto | 2013 | saneamento |
| Fundação Abrinq | 2 de matrícula na pré-escola | 2019 | educação |

- **Ano do mapa:** cada série fica na sua categoria, no ano mais recente com os sete municípios.
- **Painel:** a tabela *Série histórica* mostra os últimos anos, com o ano do mapa em destaque. O
  botão baixa a série toda em CSV. A tabela vale também para as séries do Ipeadata.

**Cartão novo em *Mais → Extrair dados*: "Séries municipais do Ipeadata".** Varre a API do
Ipeadata pelo navegador, com as regras do `7_ipeadata.py`, e lista cada série com os anos, o ano que
iria para o mapa e a situação: sugerida, nova, já no Atlas ou fora do mapa (com o motivo).

- **Sugeridas:** o que só o Ipeadata traz por município. São o Bolsa Família (benefícios e valor em
  dezembro, 2004–2025), os homicídios, suicídios e mortes no trânsito do DATASUS (até 2024) e o IFDM.
- **Já no Atlas:** a série que repete um indicador do Atlas, com os mesmos valores nos sete
  municípios. Quando o Atlas tem algo parecido com outra definição ou de outra fonte, a lista diz qual
  é a diferença. Exemplos: homicídios da SSP-RS e do DATASUS; razão de dependência com 60 ou 65 anos.
- **Trazer:** as marcadas entram na categoria **Ipeadata (IPEA)**, com a fonte original no selo, e
  ficam guardadas no navegador. *Baixar o Atlas com os dados* leva as séries no arquivo.
- **Limite:** a varredura só roda se o servidor do Ipeadata liberar a leitura pelo navegador (CORS).
  Se não liberar, o cartão avisa e indica o `7_ipeadata.py`, que faz o mesmo e põe as séries no
  pacote.

O cartão foi testado contra uma cópia simulada da API, porque o ambiente de desenvolvimento não
alcança o Ipeadata. O `8_series_complementares.py` rodou contra o espelho real da Base dos Dados.

## Versão 3.6: séries do Ipeadata

O script novo `extracao/7_ipeadata.py` lê na API pública do Ipeadata (IPEA) as séries que têm valor
para os sete municípios e grava `dados/dados-ipeadata.js`. O Atlas carrega esse arquivo como os
demais: não é preciso abrir extração nenhuma. As séries aparecem na categoria **Ipeadata (IPEA)**, no
nível município.

```bash
python3 extracao/7_ipeadata.py          # depois: python3 build_single.py
```

- **Um ano no mapa:** cada série aparece no ano mais recente em que os sete municípios têm valor.
  A série desde 2000 (`--ano-minimo`) fica numa tabela no painel e num CSV.
- **Ficam de fora**, com o motivo listado em `extracao/fontes/ipeadata/inventario.csv`: séries sem
  ano com os sete municípios, mensais ou trimestrais, não numéricas e com a mesma data repetida com
  valores diferentes.
- **Sem conversão:** os valores vão como o Ipeadata publica, com a unidade e o multiplicador da
  série. O selo de cada indicador mostra o Ipeadata e a fonte original (IBGE, Tesouro, MTE...).
- Para levar só parte das séries: `--temas "emprego,educação"`, `--incluir COD1,COD2` ou
  `--excluir COD3`.
- Precisa só do Python, sem pacotes extras, e de acesso a `www.ipeadata.gov.br`. As respostas da
  API ficam guardadas por sete dias em `extracao/fontes/ipeadata/`; `--sem-cache` baixa de novo.

O pacote sai com o arquivo de partida, sem séries: a categoria só aparece depois de rodar o script.
O script foi testado contra uma cópia simulada da API, porque o ambiente de desenvolvimento não
alcança o Ipeadata.

## Versão 3.5.1: os scripts R rodam de qualquer pasta

Os scripts de `extracao/R/` acham sozinhos a pasta do Atlas pelo próprio local. Rodam pelo botão
*Source* do RStudio ou pelo `Rscript` com o caminho completo, sem precisar mudar a pasta de
trabalho, e gravam sempre em `atlas_v3/extracao/saida_R/`. Pelo *Source*, o script `10` abre uma
janela para escolher o arquivo, e o `09` pergunta o projeto do Google Cloud. O `_comum.R` não se
roda sozinho; se for rodado, diz qual script abrir. O mapa não mudou.

## O que mudou na versão 3.5: extração pelo navegador, painel por município e dados do IPEA

### Extrair dados sem instalar nada

*Mais → Extrair dados* abre a central de extração. Tudo roda no navegador, dentro do próprio
arquivo do Atlas: não é preciso instalar R nem Python, e os arquivos não são enviados a servidor.

| como | fonte | o que entra no Atlas |
|---|---|---|
| um clique | OpenStreetMap | parques, parquinhos, quadras, academias ao ar livre, bibliotecas, centros comunitários, teatros, cinemas e outros (11 tipos): camada de pontos e contagem por bairro e município |
| busca por assunto | IBGE, tabelas do SIDRA (inclusive o Censo 2022) | o valor dos sete municípios na variável e na categoria escolhidas |
| soltar o ZIP baixado | INEP, microdados do Censo Escolar (edições até 2024) | 12 indicadores de matrícula por etapa e rede |
| soltar `RS.zip` e `Documentacao.zip` | IBGE, microdados da amostra do Censo 2010 | 12 indicadores do script R `01` (desocupação por sexo e idade, jovens que não estudam nem trabalham, chefia feminina, idosos sós, deficiência, não naturais, Bolsa Família) e a conferência da renda de 2010 de três jeitos, que fecha o achado E3 |
| soltar o ZIP do mês | CNES, base de dados | equipes de saúde ativas por tipo; o Atlas já sugere a receita |
| soltar qualquer arquivo | CSV, TXT, XLSX, XLS ou ZIP com código de município (Censo SUAS, VIS DATA, CECAD, MUNIC, CAGED, Mapa das OSCs, IVS…) | o Atlas acha a coluna do código, guarda só os sete municípios e pergunta o que fazer: usar os valores, contar as linhas ou somar colunas. Com latitude e longitude, as linhas viram pontos no mapa |

Os indicadores novos entram na hora no catálogo, à esquerda, e no mapa. Ficam guardados no
navegador de quem extraiu, até serem removidos na mesma tela. Para entregar a outras pessoas,
**Baixar o Atlas com os dados** gera um novo `atlas-rmpa.html` com tudo dentro: quem abre esse
arquivo vê os dados sem extrair de novo. O botão só funciona no arquivo único, não na versão em
pasta.

O que a central não faz: não estima, não interpola e não completa. Município sem linha no arquivo
fica sem valor, e não zero. Os resultados do Censo 2010 entram como referência histórica.

### Painel por município

O painel da direita segue o município escolhido no seletor do topo: nome, código, bairros,
setores, população, área, PIB, IDHM, renda, indicadores do município por tema, retrato do Censo
2022 e série 1991–2010. A distribuição de valores usa só os territórios do município. Gravataí,
Sapucaia do Sul e Cachoeirinha aparecem como "sem divisão de bairros no IBGE". Sem município
escolhido, o painel mostra a região. Até a 3.4 mostrava sempre Porto Alegre.

### Dados do IPEA

O `extracao/6_ipea.py` lê duas bases do IPEA no espelho público da Base dos Dados e grava
`dados/dados-ipea.js`:

- **Atlas do Desenvolvimento Humano:** série 1991–2000–2010 dos sete municípios, no painel, e 19
  indicadores novos de 2010.
- **Acesso a Oportunidades 2019:** empregos alcançáveis em uma hora de transporte público e tempo
  a pé até saúde e escolas públicas, por bairro e por setor, na categoria nova *Mobilidade e
  acesso*. Só Porto Alegre está no projeto. Os dados entram também no entorno das lojas e na ficha
  dos bolsões.

A análise, com as conferências feitas, está em [`docs/ANALISE-IPEA.md`](../docs/ANALISE-IPEA.md).

### Metodologia

Seções novas em *Mais → Metodologia*: o que quer dizer "Cálculo do Atlas", áreas de risco (2010),
bolsões do quintil mais pobre e acesso a oportunidades. Os textos de fontes e da ficha do
território deixaram de tratar os sete municípios como se fossem Porto Alegre. Na legenda, a falta
de valor só é atribuída a sigilo do IBGE quando o dado é do Censo.

## O que mudou na versão 3.4: erros da auditoria corrigidos

Correções dos achados de `docs/AUDITORIA-DADOS-v3.2.md`:

- **E1:** as 27 centrais de regulação do CNES (tipo 81) saíram da camada de saúde. As 61
  comunidades terapêuticas, residenciais terapêuticos e residenciais geriátricos (tipo 83) foram para
  a camada própria "Comunidades terapêuticas e residenciais", com indicador próprio na assistência
  social. A legenda dos dois tipos foi corrigida.
- **E2:** as 13 unidades de saúde dentro de presídios e de unidades socioeducativas continuam no
  mapa, com aviso de acesso restrito, e saem das contagens de estabelecimentos e de UBS.
  Estabelecimentos de saúde: 567 → 466 contáveis (479 na camada). UBS por 10 mil habitantes em Canoas:
  1,01 → 0,89.
- **E3:** os valores municipais de 2010 deixam de ser chamados de "oficiais", porque são cálculo do
  Atlas sobre os microdados. Ao lado deles entram os números publicados pelo Atlas Brasil: renda per
  capita, Gini, pobreza (até R$ 140) e extrema pobreza (até R$ 70). Fica pendente o recálculo; o
  script `extracao/R/11_confere_renda_2010.R` diz se a renda ausente foi contada como zero.
- **E4:** o Gini de bairro só aparece nos 45 bairros que cabem numa única área de ponderação.
- **E5:** os scripts 2 e 3 passam a guardar os códigos CNES e INEP na próxima atualização dos pontos.
- **Limitações:** notas sobre o resíduo do esgoto (≈1%) e a definição de moradores por domicílio;
  quatro duplicatas saíram do catálogo.
- **Mapa:** com escolas ou saúde ligadas, o tooltip do bairro reabria por cima do tooltip do ponto e
  escondia o aviso de acesso restrito. Agora, com o cursor no ponto, só aparece o do ponto.
- **Extrações:** os CSVs dos scripts R carregam direto em *Mais → Dados e fontes*. O Atlas reconhece
  o nível pelo código do setor ou pelo município, ignora as colunas de código e recusa arquivo com
  território repetido, em vez de ficar com a última linha. Sem coluna de ano, o indicador aparece
  como "s/ ano", e não mais com o ano corrente. O script R `01` grava também os arquivos por
  município e por setor de 2022, e o `10` põe o nome do município no recorte. Os scripts de CNES e
  de escolas tiram a competência e o ano do nome do arquivo, em vez de gravar sempre 202604 e 2025.

O passo a passo de todas as extrações, automáticas e manuais, está em
[`docs/COMO-FAZER-AS-EXTRACOES.md`](../docs/COMO-FAZER-AS-EXTRACOES.md).

## O que mudou na versão 3.3: a página busca os dados sozinha

Não é mais preciso rodar script nem gerar arquivo para atualizar estas fontes. Ao abrir, o Atlas
consulta as fontes pelo próprio navegador, confere e aplica no mapa:

| fonte | o que atualiza | por onde |
|---|---|---|
| Atlas Brasil | IDHM 2010, nove indicadores de vulnerabilidade e, desde a 3.4, renda, Gini, pobreza e extrema pobreza | Base dos Dados |
| INEP | IDEB da rede pública, edição mais recente com os sete municípios | Base dos Dados |
| Anatel | banda larga fixa, último mês publicado | Base dos Dados |
| IBGE e CEMADEN | áreas de risco | Base dos Dados |
| IBGE | população estimada; PIB e valor adicionado | API de agregados do IBGE |
| Tesouro | receitas, despesas e gasto por função, **inclusive educação** | API do SICONFI |

Como funciona:

- **Primeiro uso:** a busca roda em segundo plano depois que o mapa aparece. A primeira vez baixa
  cerca de 26 MB da Base dos Dados; os arquivos são descompactados no navegador e só as linhas dos
  sete municípios são guardadas.
- **Validação:** cada fonte passa pelas mesmas conferências dos scripts:
  - os sete municípios presentes;
  - os valores dentro da faixa possível;
  - as identidades contábeis fechando (PIB = VAB + impostos; VAB = soma dos setores; receitas e
    despesas coerentes).
  O que não passa, ou não responde, fica com o dado embarcado em `dados/*.js`, e o motivo aparece
  em *Mais → Dados e fontes*.
- **Edições:** uma edição mais antiga que a carregada nunca substitui a atual.
- **Cache:** o resultado fica guardado neste navegador e vale por 30 dias. Nas aberturas seguintes,
  o Atlas usa o que foi guardado, sem baixar de novo. *Dados e fontes* tem o botão "Buscar agora",
  a opção de desligar a busca automática e a de voltar aos dados embarcados.
- **Rodapé:** o rodapé da barra lateral mostra quantas fontes estão ao vivo e a data da consulta.

Não dá para ler direto pelo navegador, e continuam pelos scripts de `extracao/`: Censo (setores e
microdados), CNES, Censo Escolar, SSP/RS, Cadastro Único e Censo SUAS. Essas fontes não permitem
leitura por outra página (CORS), exigem login, ou só existem como arquivo compactado em FTP.

A Base dos Dados libera a leitura pelo navegador, e isso foi conferido. Se o IBGE e o Tesouro
liberam, só se sabe na hora: se não liberarem, essas três fontes ficam com o dado embarcado e o
Atlas diz isso.

## O que mudou na versão 3.2

Dados que faltavam, extraídos de fonte pública e sem nenhum valor estimado:

- **IDHM de 2010** e seus componentes, e nove indicadores de vulnerabilidade do Atlas Brasil
  (jovens que não estudam, não trabalham e são vulneráveis; mães chefes de família sem fundamental;
  desocupação de 18 a 24 anos; creche de 0 a 3 anos, entre outros), por município.
- **IDEB 2023** da rede pública (anos iniciais, anos finais, ensino médio), por município.
- **Banda larga fixa** (Anatel, junho de 2024), acessos por 100 habitantes, por município.
- **Áreas de risco BATER** (IBGE e CEMADEN, base 2010): camada nova no mapa, com 18 áreas em Porto
  Alegre e 7 em Sapucaia do Sul.
- O painel *Diagnóstico regional* ganhou as tabelas "Juventude, famílias e vulnerabilidade" e
  "Educação e desenvolvimento humano".
- Favelas, áreas de risco e bolsões passam a dividir um só canvas no mapa: antes, a camada de cima
  escondia o tooltip das de baixo.

Os dados vêm do espelho público da Base dos Dados, pelo `extracao/5_base_dos_dados.py`. Para o
que ainda falta há scripts R prontos em `extracao/R/`. Ver `docs/EXTRACAO-dados-faltantes.md`.

## O que mudou na versão 3

A versão 3 parte da versão 2 recebida e reúne quatro rodadas de trabalho, todas verificadas no
navegador sobre a base completa, comparando antes e depois:

1. **Desempenho:** abertura 3,3 vezes mais rápida e troca de indicador 12 vezes mais rápida. Detalhes em
   "Desempenho", abaixo.
2. **Correções:** os oito erros apontados em `docs/AUDITORIA-arquivos-e-modelos.md`.
3. **Interface:** redesenho completo e nenhum painel vazio. Detalhes em "Interface", abaixo.
4. **Clique:** bairros e setores voltam a ser selecionáveis com escolas, saúde ou favelas ligadas,
   com o entorno de loja aberto e no celular. Detalhes em "Seleção por clique", abaixo.

### Herdado da versão 2

- Os antigos indicadores vazios deixaram de aparecer como se fossem disponibilidade futura.
- Saúde, assistência, segurança, emprego, finanças e agro têm valores nos sete municípios.
- Escolas e estabelecimentos de saúde agora cobrem todos os sete municípios.
- O cabeçalho tem um seletor direto para analisar o entorno de cada loja.
- Raios disponíveis: 0,5 km, 1 km, 2 km, 3 km e 5 km.
- Setores censitários são decodificados somente quando necessários, reduzindo o custo da abertura.
- O visual foi redesenhado em tema claro, com hierarquia editorial e melhor contraste.

### Interface

- Nenhuma tela mostra "aguardando integração". Um indicador aparece na lista só se tem valor no
  mapa. O cartão de PIB do painel de abertura agora mostra o valor do IBGE.
- Quando o IBGE não publica um dado para um setor ou bairro (sigilo, setor especial ou sem
  moradores), o perfil mostra o valor do bairro ou do município que o contém. A linha diz de onde
  veio o número, em cinza: o valor é de referência, não do setor.
- 89 indicadores de bairro e setor com valor nos sete municípios passam a ter também o nível
  município: o mapa municipal vai de 52 para 141 indicadores. O perfil municipal lista todas as
  categorias com valor e não tem bloco vazio.
- A legenda separa as ausências por motivo: setor especial ou sem moradores, fora da cobertura
  da fonte, sob sigilo do IBGE.
- Quando os zeros são pelo menos 20% dos valores, eles ganham classe própria na legenda. Isso
  resolve o item 2.7 da auditoria. Quebras repetidas não viram mais classes vazias: favela por
  setor, onde quase todo valor é 0% ou 100%, fica com duas classes.
- Rampas azul, verde e laranja recalibradas: uma cor cada, clara para escura, com o tom mais
  claro visível sobre o fundo do mapa. Os pontos têm um anel claro em volta; as lojas ficam em
  terracota e maiores.
- Cabeçalho reorganizado, com os níveis em botões segmentados, a busca, os filtros e um menu
  "Mais" para metodologia, cobertura, fontes e integração. A lista de indicadores tem filtro por
  texto. Legenda e camadas recolhem; no celular começam recolhidas, lado a lado.
- A comparação dos sete municípios tem barras na cor da classe do mapa.
- As malhas de bairro e município perderam as frestas: buracos de menos de 5 ha deixados pela
  dissolução dos setores. Porto Alegre tinha 1.225 dessas frestas. Buracos maiores ficam.
  Com isso, 4 escolas e 2 estabelecimentos de saúde que caíam nas frestas passam a contar para
  o bairro em volta: Centro, Estância Velha e Mathias Velho (Canoas), Gravataí e Cachoeirinha.
  Nenhum outro número mudou (verificado por sonda antes/depois, incluindo os 100 entornos).

### Seleção por clique

- Escolas, saúde e favelas são desenhadas em canvas, que cobre o mapa inteiro. Com qualquer uma
  ligada, nenhum território era clicável (0 de 148 bairros). O mapa agora acha o território sob o
  cursor quando o clique não acerta um ponto, com realce e tooltip.
- O círculo do entorno da loja capturava o clique dos bairros dentro do raio; deixou de capturar.
- Até 6 px de tremor entre apertar e soltar o botão ainda contam como clique (antes, 3 px).
- Selecionar só move o mapa se o território não estiver inteiro à vista, descontando o cartão do
  indicador e, no celular, o painel, que ganhou botão de fechar.
- Teste automatizado: 148 de 148 bairros em cada cenário (padrão, cada camada ligada, todas
  ligadas, entorno aberto, mouse com tremor de 5 px, celular) e 119 de 119 setores da amostra.

### Versão 3.1: diagnóstico regional (outubro de 2026)

Implementa as sugestões de `docs/DIAGNOSTICO-REGIONAL-analise-do-template.md` que dependem só de dados
já incluídos no pacote.

- **Valores de 2010 do município inteiro.** Gini, pobreza, renda per capita, trabalho e escolaridade de
  2010 passam a usar, no nível município, o valor calculado sobre todos os registros do município. Antes
  era a média das áreas de ponderação, o que não é um Gini válido (Canoas: 0,452 antes, 0,518 agora).
  As sete versões "(histórico)" só do município, que repetiam esses números, saíram da lista.
- **Bolsões.** Nova camada com os 123 bolsões do quintil mais pobre a até 5 km de uma unidade (323.725
  pessoas), calculada no próprio Atlas com o método da análise. O clique num bolsão abre a ficha dele;
  *Mais → Bolsões* lista todos, com exportação em CSV.
- **Região e taxas por habitante.** Despesa por habitante (saúde, atenção básica, assistência,
  segurança, trabalho), CVLI, homicídios e roubos por 100 mil habitantes, transferências sobre a
  receita e UBS por 10 mil habitantes. A comparação dos municípios ganhou a linha da região.
- **Exportar mapa.** Botão no mapa e em *Mais*: PNG com título, legenda e fonte (o mapa de fundo não
  entra na imagem).
- **Diagnóstico regional.** Em *Mais*: as tabelas das seções 6, 7, 8, 10 e 11 do template do
  Instituto Renner e a matriz de priorização com notas editáveis e evidência calculada, exportáveis
  para Word e CSV.
- Verificação: sonda antes/depois sem diferença em somas, quebras, legendas, equipamentos e nos 100
  entornos; teste de clique em todos os cenários, inclusive com a camada de bolsões.

## Desempenho

Os arquivos de dados são baixados em paralelo, cada camada do mapa tem um renderer só e é
construída uma única vez, e trocar indicador, rampa ou classificação repinta a camada em vez de
reconstruí-la. Medido em Chromium sobre a base completa: abertura de 923 ms para 278 ms, troca
de indicador no nível setor de 138 ms para 11 ms, e ligar a camada de escolas de 39 s para 31 ms.
Ver `docs/RELATORIO-OTIMIZACAO.md`.

## Cobertura dos seis eixos obrigatórios

| Eixo | Indicadores principais | Fonte | Ano |
|---|---|---|---|
| Saúde | estabelecimentos, UBS, hospitais, CAPS; despesas em saúde e atenção básica | CNES/DATASUS; SICONFI/STN | 2026; 2024 |
| Educação | escolas por rede; IDEB da rede pública; creche e pré-escola em 2010. Despesas em educação: os scripts estão prontos (Python e R), mas o servidor do Tesouro estava bloqueado | Censo Escolar/INEP; IDEB/INEP; Atlas Brasil; SICONFI/STN | 2025; 2023; 2010; — |
| Assistência | despesas em assistência e assistência comunitária; pobreza histórica | SICONFI/STN; Censo/IBGE | 2024; 2010 |
| Segurança | homicídios, furtos, roubos, veículos, estelionato e CVLI | SSP/RS | 2025 |
| Emprego | desocupação, participação, informalidade, emprego formal, conta própria; despesa em trabalho | Censo/IBGE; SICONFI/STN | 2010; 2024 |
| Finanças | receitas, tributos, transferências, despesas, investimentos e resultado | SICONFI/STN | 2024 |
| Agro | VAB e participação da agropecuária; despesa em agricultura | PIB dos Municípios/IBGE; SICONFI/STN | 2021; 2024 |

Os indicadores de emprego, pobreza e informalidade de 2010 são dados observados e históricos —
não são projeções atuais. Essa defasagem é exibida de forma explícita. A próxima etapa pode
substituí-los ou complementá-los por RAIS/Novo CAGED e CadÚnico, sem alterar a arquitetura.

## Equipamentos e análise de entorno

- 1.650 escolas em atividade do Censo Escolar/INEP 2025.
- 479 unidades de saúde de atendimento do CNES 2026 (abril). As centrais de regulação ficam de fora,
  e as 61 comunidades terapêuticas e residenciais formam uma camada própria. As 13 unidades em
  presídios e unidades socioeducativas aparecem no mapa, mas não entram nas contagens.
- As contagens por bairro usam ponto dentro do polígono.
- O entorno da loja soma os setores cujo ponto representativo cai no raio. Um setor na borda entra
  inteiro ou fica de fora; a interface explica essa aproximação.

## Estrutura

```text
atlas_v3/
├── index.html
├── atlas.css
├── atlas.js
├── atlas-rmpa.html
├── build_single.py
├── dados/
│   ├── dados-nucleo.js
│   ├── dados-bairros.js
│   ├── dados-municipios.js
│   ├── dados-setores.js
│   ├── dados-estimados.js
│   ├── dados-servicos.js
│   ├── dados-pontos.js
│   ├── dados-indices.js
│   ├── dados-complementares.js
│   ├── dados-ipea.js
│   ├── dados-ipeadata.js
│   ├── dados-series.js
│   ├── dados-censo2022.js
│   └── dados-extracoes.js
└── extracao/
    ├── 1_servicos_municipais.py
    ├── 2_atualiza_cnes.py
    ├── 3_atualiza_escolas.py
    ├── 4_indices_municipais.py
    ├── 5_base_dos_dados.py
    ├── 6_ipea.py
    ├── 7_ipeadata.py
    ├── 8_series_complementares.py
    ├── 9_censo2022_setores.py
    ├── 10_censo2010_amostra.py
    ├── indices.json
    ├── R/                 (scripts R para os dados que faltam; ver docs/EXTRACAO-dados-faltantes.md)
    ├── saida_R/           (saídas dos scripts R, não versionadas)
    └── fontes/            (planilhas baixadas, não versionadas)
```

## Atualização dos dados

Os scripts em `extracao/` regeneram os dados integrados:

```bash
python3 extracao/2_atualiza_cnes.py --arquivo /caminho/healthfacilities_AAAAMM.parquet
python3 extracao/3_atualiza_escolas.py --arquivo /caminho/schools_AAAA.parquet
python3 extracao/1_servicos_municipais.py
python3 extracao/5_base_dos_dados.py
python3 extracao/4_indices_municipais.py
python3 extracao/6_ipea.py
python3 extracao/7_ipeadata.py
python3 extracao/8_series_complementares.py
python3 extracao/9_censo2022_setores.py
python3 extracao/10_censo2010_amostra.py
python3 build_single.py
```

O `5_base_dos_dados.py` baixa do espelho público da Base dos Dados (Google Cloud Storage, sem
conta) os arquivos gratuitos do Atlas Brasil, do IDEB, da Anatel e das áreas de risco do geobr, e
grava `dados/dados-complementares.js`. Ele também deixa em `extracao/fontes/basedosdados/` o
arquivo do Atlas Brasil que o `4_indices_municipais.py` usa para o IDHM, por isso roda antes.

Os dois scripts de pontos precisam de `pandas` e `pyarrow`. A competência do CNES e o ano do Censo
Escolar saem do nome do arquivo; se o nome não disser, informe `--competencia AAAAMM` ou `--ano AAAA`. O script municipal usa a API pública
do SICONFI e os arquivos oficiais de segurança; consulte o cabeçalho de cada script.

### Índices sintéticos municipais

IVS, IDESE e FIRJAN não têm API pública: são planilhas publicadas por cada instituição. O IDHM
vem do espelho da Base dos Dados (ver acima), e a planilha do Atlas Brasil continua aceita. O
script `4_indices_municipais.py` lê os arquivos de `extracao/fontes/`, guiado pelo mapa de colunas
em `extracao/indices.json`:

| índice | publicador | onde obter | periodicidade |
|---|---|---|---|
| IDHM | PNUD, IPEA e FJP | atlasbrasil.org.br | Censos de 1991, 2000 e 2010 |
| IVS | IPEA | ivs.ipea.gov.br | Censos de 2000 e 2010 |
| IDESE | DEE/SPGG-RS | dee.rs.gov.br | anual, só municípios do RS |
| IFDM e IFGF | Sistema FIRJAN | firjan.com.br | conforme a edição |

Quando um nome de coluna não bate, o script imprime as colunas reais do arquivo e para —
ajuste o `indices.json` e rode de novo, sem mexer no código. Ele não estima, não interpola e
não completa município faltante: o que não vier da fonte fica de fora, e o Atlas simplesmente
não exibe o indicador.

**IDHM e IVS são calculados sobre o Censo Demográfico e o último disponível é o de 2010.**
Servem para comparar municípios entre si, não para descrever a situação atual. O IDESE é o
índice sintético municipal com atualização mais frequente para o Rio Grande do Sul.

Os dados da FIRJAN têm termos de uso próprios. Confira antes de redistribuir os valores dentro
do pacote — por isso a fonte vem desligada no `indices.json`.

`extracao/fontes/` não é versionada: guarda planilhas grandes e, em alguns casos, licenciadas.

## Fontes

- IBGE: Censo Demográfico 2022, Estimativas da População 2026 e PIB dos Municípios.
- DATASUS: Cadastro Nacional de Estabelecimentos de Saúde (CNES).
- INEP: Microdados do Censo Escolar 2025.
- Tesouro Nacional: DCA do SICONFI/FINBRA 2024.
- Secretaria da Segurança Pública do RS: indicadores criminais municipais de 2025.
- SMUrb/PMPA e IBGE: malhas de bairros e setores censitários.

## Regra editorial

Todo valor exibido informa fonte, ano e nível geográfico. Valores municipais não são rateados por
bairro. Ausência contábil de uma função na DCA é mantida como zero quando a própria declaração não
traz a linha correspondente. Estimativas temporais futuras devem entrar como uma camada separada,
nunca substituindo o dado oficial ou histórico.
