# B1, B7 e B11. Bolsa Família, emprego formal (RAIS e CAGED), MEI e SISVAN
#               pela Base dos Dados no BigQuery
#
#   Rscript extracao/R/09_basedosdados_bigquery.R <id-do-projeto-google-cloud>
#
# A Base dos Dados (basedosdados.org) mantém essas bases já tratadas no
# BigQuery. Consultar é gratuito até a cota mensal do Google Cloud, mas exige
# um projeto do Google Cloud para "faturamento" (billing). Na primeira vez o
# bigrquery abre o navegador para autorizar a conta Google.
# Hosts: bigquery.googleapis.com, oauth2.googleapis.com, accounts.google.com
#
# Os nomes de tabela e de coluna abaixo vêm do catálogo da Base dos Dados.
# Antes de cada consulta o script confere, no INFORMATION_SCHEMA do BigQuery,
# se a tabela e as colunas existem; se não existirem, ele lista o que há e
# pula a consulta, sem inventar.
#
# O que NÃO sai por aqui:
#   - Cadastro Único por bairro ou por CRAS: não é público. Por município, use
#     o VIS DATA ou o CECAD do MDS (consulta na web, exportação manual). Por
#     território, só com termo de cooperação com as prefeituras.
#
# Saída: um CSV por consulta em extracao/saida_R/bd_<nome>.csv

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
pacote("bigrquery"); pacote("dplyr")

args <- commandArgs(trailingOnly = TRUE)
# pelo botão Source do RStudio não há argumentos: o R pergunta o projeto no console
if (!length(args) && interactive()) args <- trimws(readline("Id do projeto do Google Cloud: "))
if (!length(args) || !nzchar(args[1])) stop("Informe o id do projeto do Google Cloud: Rscript ... <projeto>", call. = FALSE)
PROJETO <- args[1]
IDS <- paste0("'", COD7, "'", collapse = ", ")

consulta <- function(sql) {
  tb <- bigrquery::bq_project_query(PROJETO, sql)
  bigrquery::bq_table_download(tb)
}

colunas_de <- function(conjunto, tabela) {
  sql <- sprintf("SELECT column_name FROM `basedosdados.%s.INFORMATION_SCHEMA.COLUMNS` WHERE table_name = '%s'",
                 conjunto, tabela)
  tryCatch(consulta(sql)$column_name, error = function(e) character(0))
}

tabelas_de <- function(conjunto) {
  sql <- sprintf("SELECT table_name FROM `basedosdados.%s.INFORMATION_SCHEMA.TABLES`", conjunto)
  tryCatch(consulta(sql)$table_name, error = function(e) character(0))
}

# nome, conjunto, tabela, colunas exigidas, SQL
PEDIDOS <- list(
  list("rais_vinculos_municipio", "br_me_rais", "microdados_vinculos",
       c("ano", "id_municipio", "vinculo_ativo_3112"),
       "SELECT ano, id_municipio, COUNTIF(vinculo_ativo_3112 = '1') AS vinculos_ativos_31dez
          FROM `basedosdados.br_me_rais.microdados_vinculos`
         WHERE id_municipio IN (%s) AND ano >= 2015
         GROUP BY ano, id_municipio ORDER BY ano, id_municipio"),
  list("caged_saldo_municipio", "br_me_caged", "microdados_movimentacao",
       c("ano", "mes", "id_municipio", "saldo_movimentacao"),
       "SELECT ano, mes, id_municipio, SUM(saldo_movimentacao) AS saldo
          FROM `basedosdados.br_me_caged.microdados_movimentacao`
         WHERE id_municipio IN (%s) AND ano >= 2020
         GROUP BY ano, mes, id_municipio ORDER BY ano, mes, id_municipio"),
  list("sisvan_registros_municipio", "br_ms_sisvan", "microdados",
       c("ano", "id_municipio"),
       "SELECT ano, id_municipio, COUNT(*) AS registros
          FROM `basedosdados.br_ms_sisvan.microdados`
         WHERE id_municipio IN (%s)
         GROUP BY ano, id_municipio ORDER BY ano, id_municipio")
)

for (p in PEDIDOS) {
  nome <- p[[1]]; conj <- p[[2]]; tab <- p[[3]]; cols <- p[[4]]; sql <- p[[5]]
  message("— ", nome, " (", conj, ".", tab, ")")
  existentes <- colunas_de(conj, tab)
  if (!length(existentes)) {
    message("  tabela não encontrada. Tabelas de ", conj, ": ", paste(tabelas_de(conj), collapse = ", "))
    next
  }
  faltam <- setdiff(cols, existentes)
  if (length(faltam)) {
    message("  faltam colunas: ", paste(faltam, collapse = ", "),
            "\n  colunas existentes: ", paste(existentes, collapse = ", "))
    next
  }
  df <- consulta(sprintf(sql, IDS))
  exige_municipios(df$id_municipio, nome)
  grava(df, paste0("bd_", nome, ".csv"))
}

# Bolsa Família e MEI: os nomes das tabelas mudam com mais frequência. O
# script lista as tabelas dos conjuntos para você escolher e montar a consulta.
for (conj in c("br_cgu_beneficios_cidadao", "br_me_cnpj")) {
  message("— tabelas em ", conj, ": ", paste(tabelas_de(conj), collapse = ", "))
}
