# B6. Equipes de saúde (Saúde da Família e outras) por unidade e município
#
#   Rscript extracao/R/04_cnes_equipes.R [ano] [mes]        (na pasta atlas_v3/)
#
# Fonte: CNES, arquivo EP (equipes), do DATASUS.
# Função: microdatasus::fetch_datasus(..., information_system = "CNES-EP")
# Host: ftp.datasus.gov.br (FTP, porta 21)
#
# O process_cnes() do microdatasus trata só os arquivos ST e PF; o EP é lido
# cru. O tipo de equipe vem em código; a tabela de rótulos é o conjunto
# `equipe` do próprio microdatasus (INE_EQUIPE_BR.dbf das tabelas do TabWin).
#
# Ligação com o mapa: desde a versão 3.4, o 2_atualiza_cnes.py guarda o código
# CNES quando o arquivo do geobr traz a coluna. Rode-o antes de juntar; os
# pontos embarcados hoje ainda não têm o código (auditoria, E5).
#
# Saída: extracao/saida_R/cnes_equipes_<aaaamm>_unidades.csv
#        extracao/saida_R/cnes_equipes_<aaaamm>_municipios.csv

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
pacote("microdatasus"); pacote("dplyr")
suppressPackageStartupMessages(library(dplyr))

args <- commandArgs(trailingOnly = TRUE)
ANO <- if (length(args) >= 1) as.integer(args[1]) else as.integer(format(Sys.Date(), "%Y"))
MES <- if (length(args) >= 2) as.integer(args[2]) else as.integer(format(Sys.Date(), "%m")) - 2L
if (MES < 1) { MES <- MES + 12L; ANO <- ANO - 1L }   # o DATASUS publica com uns dois meses de atraso
ref <- sprintf("%04d%02d", ANO, MES)

message("CNES-EP ", ref, " (microdatasus)…")
ep <- microdatasus::fetch_datasus(year_start = ANO, month_start = MES, year_end = ANO, month_end = MES,
                                  uf = "RS", information_system = "CNES-EP")
if (is.null(ep) || !nrow(ep)) stop("CNES-EP ", ref, ": nenhum arquivo lido. Tente um mês anterior.", call. = FALSE)

# Nomes do layout do arquivo EP. Se o DATASUS mudar o layout, o script para
# e mostra as colunas que vieram.
COLUNAS <- c("CNES", "CODUFMUN", "TIPO_EQP", "DT_DESAT")
exige_colunas(ep, COLUNAS, paste("CNES-EP", ref))

ep <- ep |> filter(as.character(CODUFMUN) %in% COD6)
exige_municipios(ep$CODUFMUN, paste("CNES-EP", ref))

# equipe ativa = sem data de desativação
ativas <- ep |> filter(is.na(DT_DESAT) | trimws(as.character(DT_DESAT)) == "")
message("  ", nrow(ativas), " equipes ativas de ", nrow(ep), " registradas")

rotulos <- tryCatch(get("equipe", envir = asNamespace("microdatasus")), error = function(e) NULL)
if (is.null(rotulos)) rotulos <- tryCatch({ utils::data("equipe", package = "microdatasus", envir = environment()); equipe },
                                          error = function(e) NULL)
if (!is.null(rotulos)) message("  rótulos de tipo de equipe: colunas ", paste(names(rotulos), collapse = ", "),
                               " — junte por TIPO_EQP depois de conferir o nome da coluna de código")

por_unidade <- ativas |>
  count(CODUFMUN, CNES, TIPO_EQP, name = "equipes") |>
  mutate(municipio = MUNICIPIOS[match(as.character(CODUFMUN), COD6)], .after = CODUFMUN)
grava(por_unidade, sprintf("cnes_equipes_%s_unidades.csv", ref))

por_municipio <- ativas |>
  count(CODUFMUN, TIPO_EQP, name = "equipes") |>
  mutate(municipio = MUNICIPIOS[match(as.character(CODUFMUN), COD6)], .after = CODUFMUN)
grava(por_municipio, sprintf("cnes_equipes_%s_municipios.csv", ref))
