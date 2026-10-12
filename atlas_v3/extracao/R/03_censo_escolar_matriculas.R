# B5. Matrículas por etapa, creche e EJA, por escola
#
#   Rscript extracao/R/03_censo_escolar_matriculas.R [ano]   (na pasta atlas_v3/)
#
# Fonte: microdados do Censo Escolar (INEP), pelo pacote educabR.
# Função: educabR::get_censo_escolar(year, uf = "RS")
# Host: download.inep.gov.br (um .zip nacional por ano)
#
# Até 2024 o arquivo de escolas traz as quantidades de matrícula por etapa.
# A partir de 2025 o INEP separou as tabelas (Escola, Matricula, Docente,
# Turma...): para esses anos, use educabR::list_censo_files(ano) e o argumento
# file = "Matricula", e refaça a agregação por escola.
#
# Ligação com o mapa: desde a versão 3.4, o 3_atualiza_escolas.py guarda o
# código INEP de cada escola quando o arquivo do geobr traz a coluna. Rode-o
# antes deste script; depois, junte pelo código (co_entidade). Os pontos
# embarcados hoje ainda não têm o código (ver docs/AUDITORIA-DADOS-v3.2.md, E5).
#
# Saída: extracao/saida_R/censo_escolar_<ano>_matriculas_escolas.csv
#        extracao/saida_R/censo_escolar_<ano>_matriculas_municipios.csv

# Acha a pasta do Atlas pelo local deste arquivo: o script roda de qualquer
# pasta, pelo Rscript ou pelo botão Source do RStudio.
local({
  arq <- tryCatch(sys.frame(1)$ofile, error = function(e) NULL)
  if (!is.character(arq)) {   # Rscript; no Linux e no Mac ele troca os espaços do caminho por ~+~
    arq <- gsub("~+~", " ", sub("^--file=", "", grep("^--file=", commandArgs(FALSE), value = TRUE)), fixed = TRUE)
  }
  r <- if (length(arq)) dirname(arq[1]) else file.path("extracao", "R")
  if (!file.exists(file.path(r, "_comum.R"))) {
    stop("Não achei a pasta do Atlas. No RStudio, rode o script inteiro pelo botão Source ",
         "(não linha a linha), ou escolha antes a pasta atlas_v3 em Session > Set Working Directory.",
         call. = FALSE)
  }
  assign("PASTA_ATLAS", normalizePath(file.path(r, "..", "..")), envir = globalenv())
})
source(file.path(PASTA_ATLAS, "extracao", "R", "_comum.R"))
pacote("educabR"); pacote("dplyr")
suppressPackageStartupMessages(library(dplyr))

args <- commandArgs(trailingOnly = TRUE)
ANO <- if (length(args)) as.integer(args[1]) else 2024L
if (ANO >= 2025) stop("Para 2025 em diante o INEP separou as tabelas; veja o cabeçalho do script.", call. = FALSE)

message("Censo Escolar ", ANO, " (educabR)…")
esc <- educabR::get_censo_escolar(year = ANO, uf = "RS")

# educabR padroniza os nomes em minúsculas. Nomes do dicionário do INEP:
COLUNAS <- c(
  "co_entidade", "no_entidade", "co_municipio", "tp_dependencia", "tp_situacao_funcionamento",
  "qt_mat_bas",       # total da educação básica
  "qt_mat_inf_cre",   # creche
  "qt_mat_inf_pre",   # pré-escola
  "qt_mat_fund_ai",   # fundamental, anos iniciais
  "qt_mat_fund_af",   # fundamental, anos finais
  "qt_mat_med",       # ensino médio
  "qt_mat_eja"        # educação de jovens e adultos
)
exige_colunas(esc, COLUNAS, paste("Censo Escolar", ANO))

esc <- esc |>
  filter(as.character(co_municipio) %in% COD7) |>
  select(all_of(COLUNAS))
exige_municipios(esc$co_municipio, paste("Censo Escolar", ANO))

# só escolas em atividade (tp_situacao_funcionamento = 1 no dicionário do INEP)
ativas <- esc |> filter(tp_situacao_funcionamento == 1)
message("  ", nrow(ativas), " escolas em atividade de ", nrow(esc))
grava(ativas, sprintf("censo_escolar_%d_matriculas_escolas.csv", ANO))

# tp_dependencia: 1 federal, 2 estadual, 3 municipal, 4 privada
mun <- ativas |>
  mutate(rede = ifelse(tp_dependencia == 4, "privada", "publica")) |>
  group_by(co_municipio, rede) |>
  summarise(across(starts_with("qt_mat_"), ~ sum(.x, na.rm = TRUE)), escolas = n(), .groups = "drop") |>
  mutate(municipio = MUNICIPIOS[as.character(co_municipio)], .after = co_municipio)
grava(mun, sprintf("censo_escolar_%d_matriculas_municipios.csv", ANO))
