# B14. Despesa municipal em educação, por subfunção
#
#   Rscript extracao/R/05_siconfi_educacao.R [ano]          (na pasta atlas_v3/)
#
# Fonte: Tesouro Nacional, SICONFI, Declaração de Contas Anuais (DCA),
#        Anexo I-E (despesa por função e subfunção), coluna "Despesas Empenhadas".
# Função: rsiconfi::get_dca(year, annex = "I-E", entity = <código IBGE>)
# Host: apidatalake.tesouro.gov.br
#
# É o mesmo critério do extracao/1_servicos_municipais.py, que faz isto em
# Python. Os dois existem porque o host do Tesouro pode estar bloqueado num
# ambiente e liberado no outro. Os rótulos de conta são os da DCA; se o
# Tesouro mudar o texto, o script para em vez de devolver zero.
#
# Saída: extracao/saida_R/siconfi_<ano>_educacao.csv

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
pacote("rsiconfi"); pacote("dplyr")
suppressPackageStartupMessages(library(dplyr))

args <- commandArgs(trailingOnly = TRUE)
ANO <- if (length(args)) as.integer(args[1]) else 2024L

CONTAS <- c(
  gasto_educacao           = "12 - Educação",
  gasto_ensino_fundamental = "12.361 - Ensino Fundamental",
  gasto_ensino_medio       = "12.362 - Ensino Médio",
  gasto_educacao_infantil  = "12.365 - Educação Infantil",
  gasto_eja                = "12.366 - Educação de Jovens e Adultos"
)

message("SICONFI, DCA ", ANO, ", Anexo I-E (rsiconfi)…")
dca <- rsiconfi::get_dca(year = ANO, annex = "I-E", entity = COD7)
exige_colunas(dca, c("cod_ibge", "coluna", "conta", "valor"), "SICONFI DCA I-E")
exige_municipios(dca$cod_ibge, "SICONFI DCA I-E")

emp <- dca |> filter(coluna == "Despesas Empenhadas")
if (!"12 - Educação" %in% emp$conta) {
  stop("A conta '12 - Educação' não apareceu no Anexo I-E. Rótulos de educação encontrados: ",
       paste(unique(grep("^12", emp$conta, value = TRUE)), collapse = " | "), call. = FALSE)
}

saida <- lapply(COD7, function(cod) {
  d <- emp |> filter(as.character(cod_ibge) == cod)
  # subfunção sem linha na DCA = sem despesa declarada nela (zero). A função 12
  # inteira ausente faz o script parar, acima.
  v <- vapply(CONTAS, function(conta) {
    x <- d$valor[d$conta == conta]
    if (length(x) > 1) stop(MUNICIPIOS[cod], ": conta duplicada: ", conta, call. = FALSE)
    if (length(x)) as.numeric(x) else 0
  }, numeric(1))
  data.frame(id_municipio = cod, municipio = MUNICIPIOS[[cod]], ano = ANO, t(v), check.names = FALSE)
})
saida <- do.call(rbind, saida)
grava(saida, sprintf("siconfi_%d_educacao.csv", ANO))
