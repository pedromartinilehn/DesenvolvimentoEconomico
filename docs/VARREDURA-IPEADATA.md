# Varredura do Ipeadata: o que faltava no Atlas

Outubro de 2026, versão 3.7 do Atlas.

O Ipeadata, do IPEA, publica numa API aberta séries de muitas fontes: IBGE, DATASUS, Atlas do
Desenvolvimento Humano, Firjan, Bolsa Família e outras. A varredura procurou as séries que têm valor
para os sete municípios do Atlas (Porto Alegre, Canoas, Gravataí, Sapucaia do Sul, Cachoeirinha,
Guaíba e Esteio) e que o Atlas ainda não tinha.

O resultado chegou ao Atlas de duas formas:

1. **38 séries já entram no pacote.** O `extracao/8_series_complementares.py` lê as mesmas bases no
   espelho público da Base dos Dados e grava `dados/dados-series.js`. O arquivo único
   `atlas-rmpa.html` já sai com elas.
2. **Um cartão novo em *Mais → Extrair dados*: "Séries municipais do Ipeadata".** Ele varre a API do
   Ipeadata pelo próprio navegador e traz as séries que você marcar. Serve para o que não está no
   espelho, como Bolsa Família, mortes violentas do DATASUS e IFDM. A varredura só roda se o servidor
   do Ipeadata liberar a leitura pelo navegador. Se não liberar, o `extracao/7_ipeadata.py` faz o
   mesmo trabalho.

A API do Ipeadata não responde no ambiente em que o Atlas foi desenvolvido, por bloqueio de rede.
Por isso:

- o mapa do que existe no Ipeadata saiu das telas do próprio Ipeadata;
- os dados que entraram vieram do espelho da Base dos Dados;
- o cartão e o script foram testados contra uma cópia simulada da API.

## 1. O que o Ipeadata tem para os sete municípios

As listas abaixo seguem as telas do Ipeadata (temas Desenvolvimento Humano, Demografia, Bolsa
Família e fonte DATASUS). A coluna "Mun" marca as séries publicadas por município.

| grupo | séries com nível municipal | anos | no Atlas antes da 3.7 |
|---|---|---|---|
| IDHM (Atlas DH, Censo) | IDHM e os componentes educação, longevidade e renda | 1991, 2000 e 2010 | sim: IDHM e componentes de 2010; a série 1991–2010 desde a 3.5 |
| IFDM (Firjan) | Índice Firjan de Desenvolvimento Municipal | 2013–2023, anual | não: o Atlas tem o lugar do IFDM, que se preenche com a planilha da Firjan pelo `4_indices_municipais.py`; o pacote sai sem esses valores |
| Demografia (Atlas DH, Censo) | esperança de vida, mortalidade até 1 e até 5 anos, fecundidade, sobrevivência até 40 e até 60 anos | 1991, 2000 e 2010 | em parte: esperança de vida e mortalidade |
| Demografia (Atlas DH, Censo) | população total, população por faixa de idade (amostra), razão de dependência, taxa de envelhecimento | 1991–2022, decenal | população de 2022 pelo Censo; razão de dependência com outro corte de idade (ver seção 4); o Atlas tem o índice de envelhecimento, que é outro indicador |
| Trabalho e renda (Atlas DH, Censo) | rendimento médio dos ocupados | 1991–2010 | não |
| Bolsa Família | número de benefícios em dezembro; valor total dos benefícios em dezembro (R$ mil) | 2004–2025, anual | não |
| DATASUS | número de homicídios (total, de jovens de 15 a 29 anos, por sexo), de suicídios e de vítimas de acidente de trânsito (total e de jovens) | 1979 ou 1980 a 2024, anual | homicídios só pela SSP-RS, que conta registros policiais |

Não entram no mapa municipal:

- **PNAD Contínua:**
  - rendimento, desemprego, informalidade e participação saem só para Brasil e estados;
  - algumas séries de demografia marcam o nível municipal, mas a PNAD Contínua só tem resultado
    municipal para as capitais. Dos sete, teria só Porto Alegre.
- **Séries mensais e trimestrais** (por exemplo, o valor mensal do Bolsa Família, que também é só de
  Brasil e estados). O Atlas mostra um valor por ano.

## 2. O que entrou no pacote: 38 séries

O `extracao/8_series_complementares.py` lê as tabelas abaixo no espelho público da Base dos Dados,
sem conta e só com a biblioteca padrão do Python. Cada série entra na sua categoria do Atlas, no ano
mais recente em que os sete municípios têm valor. O painel mostra os outros anos, e o botão *Baixar
a série em CSV* baixa a série toda.

| fonte e tabela | séries | anos | ano no mapa |
|---|---|---|---|
| Atlas do Desenvolvimento Humano (`mundo_onu_adh.municipio`) | 19: fecundidade; sobrevivência até 40 e até 60 anos; frequência líquida à pré-escola e aos ensinos fundamental, médio e superior; jovens de 15 a 17 e de 18 a 24 anos na escola; renda per capita do quinto mais pobre e do mais rico; parte da renda que vem do trabalho; rendimento médio dos ocupados; ocupados na indústria de transformação, no comércio, nos serviços e na construção; ocupados com até 1 salário mínimo; ocupados com superior completo | 1991, 2000 e 2010 (as de ocupação, 2000 e 2010; o rendimento dos ocupados, só 2010) | 2010 |
| Programa Nacional de Imunizações (`br_ms_imunizacoes.municipio`) | 6 coberturas vacinais: BCG, poliomielite, pentavalente, tríplice viral (1ª e 2ª dose) e pneumocócica | 2012–2021 | 2021 |
| SNIS (`br_mdr_snis.municipio_agua_esgoto`) | 7: atendimento de água (IN055) e de esgoto (IN056), coleta de esgoto (IN015), esgoto tratado sobre a água consumida (IN046), perdas na distribuição (IN049), consumo por habitante (IN022) e investimento do prestador (FN033) | 2013–2022 | 2022 |
| Atlas Esgotos da ANA (`br_ana_atlas_esgotos.municipio`) | 4: esgoto coletado e tratado, coletado e não tratado, por solução individual, e sem coleta nem tratamento | 2013 | 2013 |
| Fundação Abrinq (`br_abrinq_oca.municipio_primeira_infancia`) | 2: taxa líquida e taxa bruta de matrícula na pré-escola | 2010–2019 | 2019 |

Regras e conferências do script:

- **Valores como a fonte publica.** A única conversão é a dos índices da ANA, publicados de 0 a 1 e
  mostrados em %. Ano sem valor fica vazio.
- **O script para se:**
  - faltar um dos sete municípios no ano do mapa;
  - um valor sair da faixa possível da variável, o que mostra uma mudança de unidade na fonte;
  - os quatro índices da ANA não somarem 100% num município.
- **Conferência no Atlas.** Os 38 indicadores foram conferidos contra os arquivos da fonte: valores,
  painel, CSV, metodologia e lista de fontes.

## 3. O que vem pelo cartão do Ipeadata ou pelo script

Estes dados não estão no espelho da Base dos Dados:

- o espelho não tem o Bolsa Família nem o IFDM;
- o SIM do espelho traz só o total de óbitos por município, sem a causa;
- o Anuário de Segurança Pública do espelho é só por estado.

Por isso, homicídios, suicídios e mortes no trânsito por município só vêm do Ipeadata. Há dois
caminhos.

### 3.1 Pelo navegador: *Mais → Extrair dados → Séries municipais do Ipeadata*

1. Escolha o primeiro ano (o padrão é 2000) e clique em *Varrer o Ipeadata*. A leitura leva alguns
   minutos.
2. O cartão:
   - confere os sete municípios na tabela de territórios do Ipeadata;
   - lê todos os valores de cada um;
   - lê o catálogo de séries;
   - aplica as regras do `7_ipeadata.py`: um valor por ano, ano do mapa com os sete municípios e
     nada completado.
3. A lista mostra cada série com os anos que tem, o ano que iria para o mapa e a situação:
   - **sugerida:** Bolsa Família (benefícios e valor em dezembro), homicídios, suicídios, mortes no
     trânsito e IFDM. O botão *Marcar as sugeridas* marca todas.
   - **nova:** pode ir para o mapa e o Atlas não tem.
   - **já no Atlas:** tem os mesmos valores de um indicador do Atlas nos sete municípios, num ano em
     comum. É o mesmo dado.
   - **o Atlas tem:** tem o mesmo nome de um indicador do Atlas. Quando a definição ou a fonte muda,
     a linha diz qual é a diferença, como no caso dos homicídios (SSP-RS e DATASUS) e da razão de
     dependência (60 ou 65 anos).
   - **motivo:** para as que não podem ir para o mapa, a lista diz por quê.
4. Filtre por nome, tema ou fonte, marque as séries e clique em *Trazer as marcadas para o Atlas*.
   - As séries entram na categoria **Ipeadata (IPEA)**, no nível município.
   - O selo mostra a fonte original, como "Ipeadata · DATASUS".
   - O painel mostra a série nos sete municípios.
5. O que foi trazido fica guardado no navegador. Para distribuir, use *Baixar o Atlas com os dados*
   (no arquivo único): sai um novo `atlas-rmpa.html` com as séries dentro.
6. *Baixar a varredura (CSV)* baixa a lista inteira, com a situação de cada série.

**Se o servidor do Ipeadata não liberar a leitura pelo navegador (CORS),** o cartão avisa e indica o
script. Sem rede, o cartão diz que não alcança o Ipeadata.

### 3.2 Pelo script: `extracao/7_ipeadata.py`

```bash
python3 extracao/7_ipeadata.py                              # todas as séries que passam nas regras
python3 extracao/7_ipeadata.py --incluir COD1,COD2          # só algumas, pelo código do Ipeadata
python3 build_single.py                                     # põe o resultado no arquivo único
```

Faz a mesma varredura e grava `dados/dados-ipeadata.js`, que vai dentro do pacote. As séries que
ficam de fora vão para `extracao/fontes/ipeadata/inventario.csv`, com o motivo. O passo a passo está
em [`COMO-FAZER-AS-EXTRACOES.md`](COMO-FAZER-AS-EXTRACOES.md), seção 4.6.

## 4. Cuidados na leitura

- **Homicídios.** O Atlas tem os homicídios dolosos da SSP-RS (2025), contados por registro
  policial. O DATASUS conta óbitos pela declaração de óbito. Os números não precisam bater. O
  critério de cada série do Ipeadata está na nota do indicador, copiada do Ipeadata.
- **Razão de dependência.** O Atlas calcula com 60 anos ou mais e 15 a 59 anos, pelo Censo 2022. O
  Atlas do Desenvolvimento Humano usa 65 anos ou mais e 15 a 64 anos. São medidas diferentes.
- **Valores absolutos.** Número de benefícios e número de óbitos são contagens. O Atlas não calcula
  taxa por habitante com elas, porque não tem a população de cada ano da série. A região também não
  soma as séries do Ipeadata.
- **Anos diferentes.** Cada série fica no seu ano: SNIS em 2022, vacinação em 2021, Abrinq em 2019,
  ANA em 2013, Atlas DH em 2010. O ano está no selo de cada indicador.
- **IFDM.** A Firjan tem termos de uso próprios. Confira antes de redistribuir um Atlas com esses
  valores dentro. A nota do indicador e a lista de fontes repetem o aviso.
- **Séries encerradas.** As que o Ipeadata marca como INATIVA podem ir para o mapa se passarem nas
  regras. A nota do indicador avisa que a série foi encerrada, e elas não estão entre as sugeridas.

## 5. Como foi testado

**Cartão do navegador.** Foi testado no Chromium contra uma cópia simulada da API. A cópia tem as
séries de teste do `7_ipeadata.py` e séries com os nomes reais do Ipeadata e valores inventados. O
IDHM simulado tem os valores reais do Atlas, para testar o reconhecimento por valor. O cartão foi
testado:

- na pasta e no arquivo único, inclusive aberto direto do disco;
- com a API que libera o navegador, com a que não libera e sem rede;
- com a API que recusa o `$select` e com código de município numérico.

Conferido:

- o ano do mapa de cada série e o motivo de cada série que fica de fora (as mesmas regras do
  `7_ipeadata.py`);
- o que o Atlas já tem, pelos valores e pelo nome;
- marcar, filtrar, trazer, selo, painel e CSV;
- a volta das séries depois de recarregar a página;
- o arquivo baixado com os dados, aberto num navegador limpo.

**Séries complementares.** O `8_series_complementares.py` rodou contra o espelho real da Base dos
Dados. Os valores no Atlas batem com os arquivos da fonte.

**Pendente:** rodar a varredura contra o Ipeadata real, num computador com acesso a
`www.ipeadata.gov.br`, e revisar quais séries entram.
