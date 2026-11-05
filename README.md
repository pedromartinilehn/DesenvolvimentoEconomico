# Atlas socioeconômicos

Quatro mapas e os seus documentos, numa pasta por projeto:

| pasta | o que é |
|---|---|
| [`atlas2/`](atlas2/) | **Atlas 2.0 — Brasil**: os 5.570 municípios e os 17.575 bairros do Censo 2022, uma grande região por vez |
| [`farmacias/brasil/`](farmacias/brasil/) | **Farmácias do Brasil**: as 5.246 lojas Panvel, Raia Drogasil e Pague Menos (com a Extrafarma) do CNES sobre o Atlas 2.0, com o entorno de cada loja e a cobertura por município e bairro |
| [`farmacias/porto-alegre/`](farmacias/porto-alegre/) | **Atlas Porto Alegre — lojas Panvel**: os 94 bairros e os 2.744 setores de Porto Alegre, com as 129 lojas Panvel do CNES e o entorno de cada uma |
| [`renner/`](renner/) | **Atlas Metropolitano RMPA 3.9** (`renner/atlas_v3/`), em sete municípios da Região Metropolitana de Porto Alegre, e os documentos da análise do entorno das lojas Renner (`renner/docs/`) |
| [`docs/`](docs/) | levantamentos de fontes, auditorias, guias de extração e relatórios comuns aos atlas |

Em todos os atlas, cada valor mostra fonte, ano e nível. O que a fonte não publica fica em
branco: nenhum deles estima, interpola ou completa valor.

## Atlas 2.0 — Brasil

Mapa do Brasil inteiro, por município e por bairro. Escolhe-se uma região (Norte, Nordeste,
Centro-Oeste, Sudeste ou Sul) e o Atlas abre só ela. São 92 indicadores, 43 também por bairro:
- Censo 2022, somado a partir dos setores, com o sigilo do IBGE tratado sem estimativa;
- IDHM e indicadores do Atlas Brasil;
- PIB, IDEB, SNIS, vacinação, Anatel, Abrinq e ANA.

- **Arquivo único:** `atlas2/atlas2-brasil.html` (12 MB), abre direto do disco.
- **Pasta:** `atlas2/index.html` com `atlas2.css`, `atlas2.js` e `dados/`; também serve no
  GitHub Pages.

```bash
cd atlas2
python3 extracao/1_malhas.py && python3 extracao/2_censo2022.py && \
python3 extracao/3_municipais.py && python3 extracao/4_monta.py && python3 build_single.py
```

Fontes, regras, conferências e limites estão em [`atlas2/LEIA-ME.md`](atlas2/LEIA-ME.md).

## Farmácias

### Farmácias do Brasil — Panvel, Raia Drogasil e Pague Menos

As 5.246 farmácias das três redes ativas no CNES de abril de 2026, sobre o mapa do Atlas 2.0:

| rede | lojas |
|---|---:|
| Panvel | 593 |
| Raia Drogasil (Droga Raia e Drogasil) | 3.277 |
| Pague Menos, com a Extrafarma | 1.376 |

- Cada rede liga e desliga no mapa.
- A ficha de cada loja traz o entorno em raios de 500 m, 1 km e 2 km (moradores, domicílios,
  renda e 12 taxas do Censo 2022), as outras lojas no raio e a loja mais próxima de cada rede.
- Há 16 indicadores de cobertura por município, bairro, UF e região: lojas, lojas por 10 mil
  habitantes, moradores a até 1 km e distância média até a loja mais próxima.
- A lista de todas as lojas sai em CSV.

- **Arquivo único:** `farmacias/brasil/farmacias-brasil.html` (14,5 MB), abre direto do disco.
- **Pasta:** `farmacias/brasil/index.html`, que usa a interface e os dados de `atlas2/`.

```bash
cd farmacias/brasil
python3 extracao/1_setores.py && python3 extracao/2_lojas.py && \
python3 extracao/3_monta.py && python3 build_single.py
```

A origem das lojas, a marca, a regra de localização, o entorno, a cobertura, a auditoria e os
limites estão em [`farmacias/brasil/LEIA-ME.md`](farmacias/brasil/LEIA-ME.md).

### Atlas Porto Alegre — lojas Panvel

Mapa de Porto Alegre por bairro e por setor censitário. Mostra as 129 lojas Panvel ativas no
CNES de abril de 2026, que são os estabelecimentos com o CNPJ da Dimed S/A. A ficha de cada loja
traz:

- o entorno em raios de 500 m, 1 km e 2 km;
- os moradores que têm a loja como a Panvel mais próxima;
- os equipamentos de saúde e as escolas do raio.

Há também cinco indicadores de cobertura por bairro, entre eles a distância até a loja mais
próxima e os moradores a até 500 m e a até 1 km. Os indicadores do Censo 2022 seguem as regras do
Atlas 2.0.

- **Arquivo único:** `farmacias/porto-alegre/atlas-poa.html` (1,1 MB), abre direto do disco.
- **Pasta:** `farmacias/porto-alegre/index.html` com `atlas-poa.css`, `atlas-poa.js` e `dados/`.

```bash
cd farmacias/porto-alegre
python3 extracao/1_malhas.py && python3 extracao/2_censo2022.py && \
python3 extracao/3_pontos.py && python3 extracao/4_monta.py && python3 build_single.py
```

A origem das lojas, a regra de localização, o entorno, as conferências e os limites estão em
[`farmacias/porto-alegre/LEIA-ME.md`](farmacias/porto-alegre/LEIA-ME.md).

## Renner

### Atlas Metropolitano RMPA

Mapa socioeconômico para análise territorial e do entorno das lojas Renner em sete municípios
da Região Metropolitana de Porto Alegre: Porto Alegre, Canoas, Gravataí, Sapucaia do Sul,
Cachoeirinha, Guaíba e Esteio.

**Como abrir.**

- **Mais simples:** `renner/atlas_v3/atlas-rmpa.html` — versão standalone, com interface, dados e
  código embutidos.
- **Para desenvolvimento:** mantenha `index.html`, `atlas.css`, `atlas.js` e a pasta `dados/`
  juntos, e sirva a pasta por HTTP.

**Atualização no navegador.** Ao abrir, a página busca sozinha, pelo navegador, as fontes que
permitem isso:

- Atlas Brasil, IDEB, Anatel e áreas de risco, pela Base dos Dados;
- população estimada e PIB, pela API do IBGE;
- finanças municipais, inclusive a despesa em educação, pela API do Tesouro (SICONFI).

Cada fonte é conferida antes de entrar, e o que não passar continua com o dado embarcado. Não é
preciso rodar script nem gerar arquivo; o status aparece em *Mais → Dados e fontes*.

**Extrair dados sem instalar nada.** Em *Mais → Extrair dados*, qualquer pessoa traz dados novos
para o Atlas pelo próprio navegador, sem R nem Python:

- busca direta no OpenStreetMap e nas tabelas do IBGE (SIDRA);
- varredura das séries municipais do Ipeadata;
- leitura dos arquivos baixados do INEP (matrículas), do IBGE (amostra do Censo 2010) e do CNES
  (equipes de saúde);
- leitura da biblioteca do Atlas Brasil (UDHs, Radar IDHM, regiões, RMs e bases municipais) ou
  de qualquer arquivo nacional com código de município.

Para distribuir, *Baixar o Atlas com os dados* gera um novo arquivo único com tudo dentro.

Detalhes de estrutura, fontes, regra editorial e atualização dos dados estão em
[`renner/atlas_v3/LEIA-ME.md`](renner/atlas_v3/LEIA-ME.md).

**Cobertura.** São 302 indicadores no catálogo, em quatro níveis:

| nível | indicadores |
|---|---:|
| município | 269 |
| bairro | 132 |
| UDH | 56 |
| setor censitário | 116 |

- São 4.722 setores nos sete municípios.
- Há bairros em Porto Alegre, Canoas, Guaíba e Esteio. Gravataí, Sapucaia do Sul e Cachoeirinha
  não têm divisão de bairros no IBGE.
- As 483 UDHs (Unidades de Desenvolvimento Humano do Atlas Brasil) cobrem os sete municípios,
  com os Censos de 2000 e 2010.

Indicadores de trabalho, renda domiciliar, pobreza e escolaridade adulta vêm do **Censo 2010**:
são dados observados e históricos, identificados como tais em toda a interface. A amostra do
Censo 2022 é de acesso controlado e não tem arquivo público.

**Atualização pelos scripts.**

```bash
cd renner/atlas_v3
python3 extracao/2_atualiza_cnes.py --arquivo /caminho/healthfacilities_AAAAMM.parquet
python3 extracao/3_atualiza_escolas.py --arquivo /caminho/schools_AAAA.parquet
python3 extracao/1_servicos_municipais.py      # SICONFI, SSP/RS, contagens de equipamentos
python3 extracao/5_base_dos_dados.py           # Atlas Brasil, IDEB, Anatel, áreas de risco
python3 extracao/4_indices_municipais.py       # IDHM, IVS, IDESE, FIRJAN
python3 extracao/6_ipea.py                     # Atlas do Desenvolvimento Humano e Acesso a Oportunidades
python3 extracao/7_ipeadata.py                 # séries municipais do Ipeadata (API do IPEA)
python3 extracao/8_series_complementares.py    # 38 séries que faltavam: Atlas DH, PNI, SNIS, ANA, Abrinq
python3 extracao/9_censo2022_setores.py        # Censo 2022 por setor: domicílio, óbitos e entorno (censobr)
python3 extracao/10_censo2010_amostra.py       # Censo 2010, amostra: 12 indicadores e conferência E3 (censobr)
python3 extracao/11_atlas_brasil.py            # Atlas Brasil: UDHs, regiões, RMs e Radar IDHM (biblioteca)
python3 build_single.py                        # regenera o atlas-rmpa.html
```

O passo a passo completo, com a central de extração, os scripts R e os downloads manuais, está em
[`docs/COMO-FAZER-AS-EXTRACOES.md`](docs/COMO-FAZER-AS-EXTRACOES.md).

Nenhum script estima valor ausente. Se uma fonte mudar de formato ou deixar município sem dado,
a execução falha em vez de completar por conta própria.

### Documentos da análise das lojas Renner

| arquivo | o que é |
|---|---|
| [`renner/docs/ANALISE-DESENVOLVIMENTO-entorno-lojas.md`](renner/docs/ANALISE-DESENVOLVIMENTO-entorno-lojas.md) | análise do entorno das 20 unidades para desenho de projetos de desenvolvimento comunitário: bolsões de baixa renda, carências, frentes de projeto e lacunas de dados (versão 2) |
| [`renner/docs/APRESENTACAO-entorno-lojas.pptx`](renner/docs/APRESENTACAO-entorno-lojas.pptx) | a análise em 21 slides de PowerPoint, com gráficos e tabelas editáveis e notas do apresentador |
| [`renner/docs/entorno-lojas.csv`](renner/docs/entorno-lojas.csv) | 20 unidades × 4 raios × 34 colunas, com comparação ao próprio município e quintil de renda |
| [`renner/docs/bolsoes-quintil-inferior.csv`](renner/docs/bolsoes-quintil-inferior.csv) | 123 bolsões do quintil mais pobre a até 5 km de alguma unidade, com coordenadas e loja mais próxima |
| [`renner/docs/DIAGNOSTICO-REGIONAL-template-secoes-3-4-5.docx`](renner/docs/DIAGNOSTICO-REGIONAL-template-secoes-3-4-5.docx) | template de diagnóstico regional do Instituto Renner com as seções 3, 4 e 5 respondidas (apresentação, escopo e metodologia) |
| [`renner/docs/DIAGNOSTICO-REGIONAL-respostas-guardadas-completas.docx`](renner/docs/DIAGNOSTICO-REGIONAL-respostas-guardadas-completas.docx) | respostas guardadas de todas as seções do template (nome da regional e seções 6 a 15: tabelas por município, 5 mapas, rede de serviços, orçamento, atores, SWOT e priorização) |
| [`renner/docs/DIAGNOSTICO-REGIONAL-analise-do-template.md`](renner/docs/DIAGNOSTICO-REGIONAL-analise-do-template.md) | análise das perguntas do template, cobertura do Atlas por seção e sugestões de dados e funções para completar o diagnóstico |

## Documentos gerais

| arquivo | o que é |
|---|---|
| [`docs/LEVANTAMENTO-FONTES-ESTADUAIS-MUNICIPAIS.md`](docs/LEVANTAMENTO-FONTES-ESTADUAIS-MUNICIPAIS.md) | fontes estaduais e municipais (segurança, índices estaduais, portais das prefeituras) avaliadas antes de extrair, com o que já foi conferido e o que depende de acesso |
| [`docs/COMO-FAZER-AS-EXTRACOES.md`](docs/COMO-FAZER-AS-EXTRACOES.md) | passo a passo de todas as extrações: o que o Atlas atualiza sozinho, a central de extração no navegador, os scripts Python e R, os downloads manuais e como o resultado entra no Atlas |
| [`docs/ATLAS-BRASIL-bases.md`](docs/ATLAS-BRASIL-bases.md) | bases da biblioteca do Atlas Brasil: o que veio (UDHs, Radar IDHM, regiões, RMs, metadados), o nível UDH do mapa, o Contexto metropolitano, as conferências e como trazer versões novas pelo navegador ou pelo script |
| [`docs/EXTRACOES-NO-HTML.md`](docs/EXTRACOES-NO-HTML.md) | como as extrações entram no arquivo do Atlas (arquivos de dados, pacote de extrações, central); o que entrou na 3.8 (Censo 2022 por setor e entorno, Censo 2010 por município, conferência E3) e o que continua de fora, com o motivo |
| [`docs/VARREDURA-IPEADATA.md`](docs/VARREDURA-IPEADATA.md) | varredura do Ipeadata: o que ele tem para os sete municípios, as 38 séries que entraram no pacote, o que vem pelo cartão do navegador (Bolsa Família, mortes violentas do DATASUS, IFDM) e o que não é municipal |
| [`docs/ANALISE-IPEA.md`](docs/ANALISE-IPEA.md) | dados do IPEA no Atlas: série 1991–2010 do Atlas do Desenvolvimento Humano e Acesso a Oportunidades 2019 em Porto Alegre, com as conferências feitas e o que os dados mostram |
| [`docs/EXTRACAO-dados-faltantes.md`](docs/EXTRACAO-dados-faltantes.md) | de onde vem cada dado que falta no Atlas e como extraí-lo, com scripts R prontos; o que já entrou pelo espelho público da Base dos Dados (IDHM, Atlas Brasil 2010, IDEB, banda larga, áreas de risco) |
| [`docs/AUDITORIA-DADOS-v3.2.md`](docs/AUDITORIA-DADOS-v3.2.md) | auditoria de todos os dados da versão 3.2: somas, identidades, geometria, pontos, catálogo e comparação com IBGE e Atlas Brasil; quatro erros de classificação e rótulo, com correções propostas |
| [`docs/AUDITORIA-arquivos-e-modelos.md`](docs/AUDITORIA-arquivos-e-modelos.md) | auditoria dos arquivos, dos dados e dos modelos de cálculo, com os erros visíveis na interface |
| [`docs/DIAGNOSTICO-PERFORMANCE.md`](docs/DIAGNOSTICO-PERFORMANCE.md) | diagnóstico que originou as otimizações |
| [`docs/RELATORIO-OTIMIZACAO.md`](docs/RELATORIO-OTIMIZACAO.md) | otimizações aplicadas, com medição antes/depois |
