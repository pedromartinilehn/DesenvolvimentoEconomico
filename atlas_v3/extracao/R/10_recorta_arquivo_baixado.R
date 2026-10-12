# B1, B4, B12 e B15. Recorte de bases nacionais baixadas à mão
#
#   Rscript extracao/R/10_recorta_arquivo_baixado.R <arquivo> [coluna_do_codigo] [aba]
#
# Algumas fontes não têm pacote R nem API aberta e são baixadas pela página:
#   - Censo SUAS (MDS): CRAS, CREAS, Centro POP, RH e gestão municipal (B4, B15)
#   - VIS DATA e CECAD (MDS): Cadastro Único e Bolsa Família por município (B1)
#   - Mapa das Organizações da Sociedade Civil (IPEA): base completa em CSV,
#     cerca de 330 MB, em mapaosc.ipea.gov.br/base-dados (B12)
#   - MUNIC (IBGE): conselhos, fundos e planos municipais (B15)
#   - IVS (IPEA), IDESE (DEE/RS) e IFDM (FIRJAN): estes vão direto para
#     extracao/fontes/ e são lidos pelo 4_indices_municipais.py
#
# Este script lê o arquivo nacional (CSV, TXT ou XLSX), acha a coluna do
# código do município (7 ou 6 dígitos) e grava só as linhas dos sete
# municípios do Atlas. Se não achar a coluna sozinho, lista as colunas para
# você indicar qual é.
#
# Saída: extracao/saida_R/recorte_<nome do arquivo>.csv

source("extracao/R/_comum.R")
pacote("data.table")

args <- commandArgs(trailingOnly = TRUE)
if (!length(args)) stop("Uso: Rscript extracao/R/10_recorta_arquivo_baixado.R <arquivo> [coluna] [aba]", call. = FALSE)
ARQ <- args[1]; COL <- if (length(args) >= 2) args[2] else NA; ABA <- if (length(args) >= 3) args[3] else 1
if (!file.exists(ARQ)) stop("Arquivo não encontrado: ", ARQ, call. = FALSE)

if (grepl("\\.xlsx?$", ARQ, ignore.case = TRUE)) {
  pacote("readxl")
  df <- as.data.frame(readxl::read_excel(ARQ, sheet = if (grepl("^[0-9]+$", ABA)) as.integer(ABA) else ABA,
                                         col_types = "text"))
} else {
  df <- as.data.frame(data.table::fread(ARQ, colClasses = "character", encoding = "UTF-8"))
}
message(basename(ARQ), ": ", nrow(df), " linhas, ", ncol(df), " colunas")

casa <- function(v) {
  v <- trimws(as.character(v))
  v %in% COD7 | v %in% COD6
}

if (is.na(COL)) {
  # candidata = coluna em que quase todo valor tem forma de código de município
  # (6 ou 7 dígitos) e algum valor é um dos sete; o nome desempata
  forma <- vapply(df, function(v) {
    v <- trimws(as.character(v)); v <- v[!is.na(v) & v != ""]
    length(v) > 0 && mean(grepl("^[0-9]{6,7}$", v)) >= 0.95
  }, logical(1))
  cand <- names(df)[forma & vapply(df, function(v) any(casa(v), na.rm = TRUE), logical(1))]
  if (length(cand) > 1) {
    pelo_nome <- cand[grepl("mun|ibge|ente", cand, ignore.case = TRUE)]
    if (length(pelo_nome)) cand <- pelo_nome
  }
  if (length(cand) != 1) {
    stop("Não consegui escolher a coluna do código do município. Candidatas: ",
         if (length(cand)) paste(cand, collapse = ", ") else "nenhuma",
         ".\nColunas: ", paste(names(df), collapse = ", "),
         "\nRode de novo informando a coluna.", call. = FALSE)
  }
  COL <- cand
}
exige_colunas(df, COL, basename(ARQ))
rec <- df[casa(df[[COL]]), , drop = FALSE]
exige_municipios(trimws(rec[[COL]]), basename(ARQ))
message("  coluna do código: ", COL, " — ", nrow(rec), " linhas dos sete municípios")

nome <- sub("\\.[^.]+$", "", basename(ARQ))
grava(rec, paste0("recorte_", gsub("[^A-Za-z0-9_-]+", "_", nome), ".csv"))
