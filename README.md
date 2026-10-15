# Atlas Metropolitano RMPA

Mapa socioeconômico para análise territorial e do entorno das lojas Renner em sete municípios
da Região Metropolitana de Porto Alegre: Porto Alegre, Canoas, Gravataí, Sapucaia do Sul,
Cachoeirinha, Guaíba e Esteio.

## Como abrir

- **Mais simples:** `atlas_v3/atlas-rmpa.html` — versão standalone, com interface, dados e
  código embutidos.
- **Para desenvolvimento:** mantenha `index.html`, `atlas.css`, `atlas.js` e a pasta `dados/`
  juntos, e sirva a pasta por HTTP.

**Atualização:** ao abrir, a página busca sozinha, pelo navegador, as fontes que permitem isso:

- Atlas Brasil, IDEB, Anatel e áreas de risco, pela Base dos Dados;
- população estimada e PIB, pela API do IBGE;
- finanças municipais, inclusive a despesa em educação, pela API do Tesouro (SICONFI).

Cada fonte é conferida antes de entrar, e o que não passar continua com o dado embarcado. Não é
preciso rodar script nem gerar arquivo; o status aparece em *Mais → Dados e fontes*.

**Extrair dados sem instalar nada:** em *Mais → Extrair dados*, qualquer pessoa traz dados novos
para o Atlas pelo próprio navegador, sem R nem Python: busca direta no OpenStreetMap e nas tabelas
do IBGE (SIDRA), varredura das séries municipais do Ipeadata, e leitura dos arquivos baixados do
INEP (matrículas), do IBGE (amostra do Censo 2010), do CNES (equipes de saúde) ou de qualquer arquivo
nacional com código de município. Para distribuir, *Baixar o Atlas com os dados* gera um novo arquivo
único com tudo dentro.

Detalhes de estrutura, fontes, regra editorial e atualização dos dados em
[`atlas_v3/LEIA-ME.md`](atlas_v3/LEIA-ME.md).

## Documentos

| arquivo | o que é |
|---|---|
| [`docs/ANALISE-DESENVOLVIMENTO-entorno-lojas.md`](docs/ANALISE-DESENVOLVIMENTO-entorno-lojas.md) | análise do entorno das 20 unidades para desenho de projetos de desenvolvimento comunitário: bolsões de baixa renda, carências, frentes de projeto e lacunas de dados (versão 2) |
| [`docs/DIAGNOSTICO-REGIONAL-template-secoes-3-4-5.docx`](docs/DIAGNOSTICO-REGIONAL-template-secoes-3-4-5.docx) | template de diagnóstico regional do Instituto Renner com as seções 3, 4 e 5 respondidas (apresentação, escopo e metodologia) |
| [`docs/DIAGNOSTICO-REGIONAL-respostas-guardadas-completas.docx`](docs/DIAGNOSTICO-REGIONAL-respostas-guardadas-completas.docx) | respostas guardadas de todas as seções do template (nome da regional e seções 6 a 15: tabelas por município, 5 mapas, rede de serviços, orçamento, atores, SWOT e priorização) |
| [`docs/COMO-FAZER-AS-EXTRACOES.md`](docs/COMO-FAZER-AS-EXTRACOES.md) | passo a passo de todas as extrações: o que o Atlas atualiza sozinho, a central de extração no navegador, os scripts Python e R, os downloads manuais e como o resultado entra no Atlas |
| [`docs/EXTRACOES-NO-HTML.md`](docs/EXTRACOES-NO-HTML.md) | como as extrações entram no arquivo do Atlas (arquivos de dados, pacote de extrações, central); o que entrou na 3.8 (Censo 2022 por setor e entorno, Censo 2010 por município, conferência E3) e o que continua de fora, com o motivo |
| [`docs/VARREDURA-IPEADATA.md`](docs/VARREDURA-IPEADATA.md) | varredura do Ipeadata: o que ele tem para os sete municípios, as 38 séries que entraram no pacote, o que vem pelo cartão do navegador (Bolsa Família, mortes violentas do DATASUS, IFDM) e o que não é municipal |
| [`docs/ANALISE-IPEA.md`](docs/ANALISE-IPEA.md) | dados do IPEA no Atlas: série 1991–2010 do Atlas do Desenvolvimento Humano e Acesso a Oportunidades 2019 em Porto Alegre, com as conferências feitas e o que os dados mostram |
| [`docs/EXTRACAO-dados-faltantes.md`](docs/EXTRACAO-dados-faltantes.md) | de onde vem cada dado que falta no Atlas e como extraí-lo, com scripts R prontos; o que já entrou pelo espelho público da Base dos Dados (IDHM, Atlas Brasil 2010, IDEB, banda larga, áreas de risco) |
| [`docs/DIAGNOSTICO-REGIONAL-analise-do-template.md`](docs/DIAGNOSTICO-REGIONAL-analise-do-template.md) | análise das perguntas do template, cobertura do Atlas por seção e sugestões de dados e funções para completar o diagnóstico |
| [`docs/APRESENTACAO-entorno-lojas.pptx`](docs/APRESENTACAO-entorno-lojas.pptx) | a análise em 21 slides de PowerPoint, com gráficos e tabelas editáveis e notas do apresentador |
| [`docs/AUDITORIA-DADOS-v3.2.md`](docs/AUDITORIA-DADOS-v3.2.md) | auditoria de todos os dados da versão 3.2: somas, identidades, geometria, pontos, catálogo e comparação com IBGE e Atlas Brasil; quatro erros de classificação e rótulo, com correções propostas |
| [`docs/AUDITORIA-arquivos-e-modelos.md`](docs/AUDITORIA-arquivos-e-modelos.md) | auditoria dos arquivos, dos dados e dos modelos de cálculo, com os erros visíveis na interface |
| [`docs/entorno-lojas.csv`](docs/entorno-lojas.csv) | 20 unidades × 4 raios × 34 colunas, com comparação ao próprio município e quintil de renda |
| [`docs/bolsoes-quintil-inferior.csv`](docs/bolsoes-quintil-inferior.csv) | 123 bolsões do quintil mais pobre a até 5 km de alguma unidade, com coordenadas e loja mais próxima |
| [`docs/DIAGNOSTICO-PERFORMANCE.md`](docs/DIAGNOSTICO-PERFORMANCE.md) | diagnóstico que originou as otimizações |
| [`docs/RELATORIO-OTIMIZACAO.md`](docs/RELATORIO-OTIMIZACAO.md) | otimizações aplicadas, com medição antes/depois |

## Cobertura

203 indicadores no catálogo, em três níveis: município (191), bairro (110) e setor censitário (94).
São 4.722 setores nos sete municípios e bairros em Porto Alegre, Canoas, Guaíba e Esteio; Gravataí,
Sapucaia do Sul e Cachoeirinha não têm divisão de bairros no IBGE. Todo valor exibido informa fonte,
ano e nível geográfico.

Indicadores de trabalho, renda domiciliar, pobreza e escolaridade adulta vêm do **Censo 2010** —
são dados observados e históricos, identificados como tais em toda a interface. A amostra do
Censo 2022 é de acesso controlado e não tem arquivo público.

## Atualização

```bash
cd atlas_v3
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
python3 build_single.py                        # regenera o atlas-rmpa.html
```

O passo a passo completo, com a central de extração, os scripts R e os downloads manuais, está em
[`docs/COMO-FAZER-AS-EXTRACOES.md`](docs/COMO-FAZER-AS-EXTRACOES.md).

Nenhum script estima valor ausente. Se uma fonte mudar de formato ou deixar município sem dado,
a execução falha em vez de completar por conta própria.
