# Definições comuns aos scripts R de extração do Atlas.
#
# Cada script faz source() deste arquivo. Nada aqui baixa dado: só define os
# municípios, a pasta de saída e duas verificações que fazem o script parar
# quando a fonte muda de formato. É a regra do Atlas: não estimar e não
# completar. O que a fonte não trouxer fica de fora, com aviso.

MUNICIPIOS <- c(
  "4314902" = "Porto Alegre",
  "4304606" = "Canoas",
  "4309209" = "Gravataí",
  "4320008" = "Sapucaia do Sul",
  "4303103" = "Cachoeirinha",
  "4309308" = "Guaíba",
  "4307708" = "Esteio"
)
Encoding(MUNICIPIOS) <- "UTF-8"
COD7 <- names(MUNICIPIOS)
COD6 <- substr(COD7, 1, 6)   # DATASUS e alguns arquivos do MDS usam 6 dígitos

# Os scripts rodam a partir da pasta atlas_v3/:
#   Rscript extracao/R/01_censo2010_areas_ponderacao.R
if (!file.exists("extracao/R/_comum.R")) {
  stop("Rode os scripts a partir da pasta atlas_v3/ (a que tem index.html).", call. = FALSE)
}
SAIDA <- file.path("extracao", "saida_R")
dir.create(SAIDA, showWarnings = FALSE, recursive = TRUE)

grava <- function(df, nome) {
  caminho <- file.path(SAIDA, nome)
  if (requireNamespace("data.table", quietly = TRUE)) {
    data.table::fwrite(df, caminho, na = "")          # sempre UTF-8, qualquer que seja o locale
  } else {
    utils::write.csv(df, caminho, row.names = FALSE, fileEncoding = "UTF-8", na = "")
  }
  message("  gravado: ", caminho, " (", nrow(df), " linhas)")
  invisible(caminho)
}

# Para se faltar coluna, mostrando as que existem. Melhor parar do que
# calcular com a variável errada.
# Aceita um data frame ou o vetor de nomes (útil para Datasets do arrow).
exige_colunas <- function(df, colunas, origem) {
  nomes <- if (is.character(df)) df else names(df)
  faltam <- setdiff(colunas, nomes)
  if (length(faltam)) {
    stop(
      origem, ": faltam as colunas ", paste(faltam, collapse = ", "),
      ".\nColunas disponíveis: ", paste(nomes, collapse = ", "),
      "\nConfira o dicionário da fonte e ajuste o script.",
      call. = FALSE
    )
  }
  invisible(TRUE)
}

# Para se algum dos sete municípios não aparecer.
exige_municipios <- function(codigos, origem) {
  codigos <- unique(substr(as.character(codigos), 1, 6))
  faltam <- MUNICIPIOS[!COD6 %in% codigos]
  if (length(faltam)) {
    stop(origem, ": sem dados para ", paste(faltam, collapse = ", "), call. = FALSE)
  }
  invisible(TRUE)
}

pacote <- function(nome) {
  if (!requireNamespace(nome, quietly = TRUE)) {
    stop("Falta o pacote '", nome, "'. Rode antes extracao/R/00_instala_pacotes.R", call. = FALSE)
  }
}
