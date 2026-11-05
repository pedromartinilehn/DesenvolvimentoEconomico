# Instala os pacotes usados pelos scripts de extracao/R/.
#
#   Rscript extracao/R/00_instala_pacotes.R
#
# Todos estão no CRAN, exceto o rsiconfi, que vem do GitHub (tchiluanda/rsiconfi).
# Precisa de acesso a cloud.r-project.org e, para o rsiconfi, a github.com.

cran <- c(
  "censobr",      # IPEA: microdados e agregados por setor dos Censos (B2, B3)
  "geobr",        # IPEA: malhas oficiais, inclusive áreas de ponderação (B2, B9)
  "aopdata",      # IPEA: Projeto Acesso a Oportunidades (B8)
  "educabR",      # microdados do Censo Escolar do INEP (B5)
  "microdatasus", # arquivos do DATASUS, inclusive CNES-EP (B6)
  "osmdata",      # OpenStreetMap pela Overpass API (B13)
  "bigrquery",    # BigQuery, para a Base dos Dados (B1, B7, B11)
  "sidrar",       # IBGE: tabelas do SIDRA, amostra do Censo 2022 (B3)
  "arrow", "dplyr", "sf", "jsonlite", "httr2", "remotes", "readxl", "data.table"
)
faltam <- setdiff(cran, rownames(installed.packages()))
if (length(faltam)) install.packages(faltam, repos = "https://cloud.r-project.org")

if (!requireNamespace("rsiconfi", quietly = TRUE)) {
  remotes::install_github("tchiluanda/rsiconfi")  # despesa por função (B14)
}

message("Pacotes prontos.")
