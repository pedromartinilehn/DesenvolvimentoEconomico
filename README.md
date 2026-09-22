# Atlas Metropolitano RMPA

Mapa socioeconômico para análise territorial e do entorno das lojas Renner em sete municípios
da Região Metropolitana de Porto Alegre: Porto Alegre, Canoas, Gravataí, Sapucaia do Sul,
Cachoeirinha, Guaíba e Esteio.

## Como abrir

- **Mais simples:** `atlas_v2/atlas-rmpa.html` — versão standalone, com interface, dados e
  código embutidos.
- **Para desenvolvimento:** mantenha `index.html`, `atlas.css`, `atlas.js` e a pasta `dados/`
  juntos, e sirva a pasta por HTTP.

Detalhes de estrutura, fontes, regra editorial e atualização dos dados em
[`atlas_v2/LEIA-ME.md`](atlas_v2/LEIA-ME.md).

## Documentos

| arquivo | o que é |
|---|---|
| [`docs/ANALISE-DESENVOLVIMENTO-entorno-lojas.md`](docs/ANALISE-DESENVOLVIMENTO-entorno-lojas.md) | análise do entorno das 20 unidades para desenho de projetos de desenvolvimento comunitário: bolsões de baixa renda, carências, frentes de projeto e lacunas de dados (versão 2) |
| [`docs/AUDITORIA-arquivos-e-modelos.md`](docs/AUDITORIA-arquivos-e-modelos.md) | auditoria dos arquivos, dos dados e dos modelos de cálculo, com os erros visíveis na interface |
| [`docs/entorno-lojas.csv`](docs/entorno-lojas.csv) | 20 unidades × 4 raios × 34 colunas, com comparação ao próprio município e quintil de renda |
| [`docs/bolsoes-quintil-inferior.csv`](docs/bolsoes-quintil-inferior.csv) | 123 bolsões do quintil mais pobre a até 5 km de alguma unidade, com coordenadas e loja mais próxima |
| [`docs/DIAGNOSTICO-PERFORMANCE.md`](docs/DIAGNOSTICO-PERFORMANCE.md) | diagnóstico que originou as otimizações |
| [`docs/RELATORIO-OTIMIZACAO.md`](docs/RELATORIO-OTIMIZACAO.md) | otimizações aplicadas, com medição antes/depois |

## Cobertura

131 indicadores oficiais carregados, em três níveis: município, bairro (Porto Alegre) e setor
censitário (4.722 setores nos sete municípios). Todo valor exibido informa fonte, ano e nível
geográfico.

Indicadores de trabalho, renda domiciliar, pobreza e escolaridade adulta vêm do **Censo 2010** —
são dados observados e históricos, identificados como tais em toda a interface. A amostra do
Censo 2022 é de acesso controlado e não tem arquivo público.

## Atualização

```bash
cd atlas_v2
python3 extracao/2_atualiza_cnes.py --arquivo /caminho/healthfacilities_YYYYMM.parquet
python3 extracao/3_atualiza_escolas.py --arquivo /caminho/schools_YYYY.parquet
python3 extracao/1_servicos_municipais.py      # SICONFI, SSP/RS, contagens de equipamentos
python3 extracao/4_indices_municipais.py       # IDHM, IVS, IDESE, FIRJAN
python3 build_single.py                        # regenera o atlas-rmpa.html
```

Nenhum script estima valor ausente. Se uma fonte mudar de formato ou deixar município sem dado,
a execução falha em vez de completar por conta própria.
