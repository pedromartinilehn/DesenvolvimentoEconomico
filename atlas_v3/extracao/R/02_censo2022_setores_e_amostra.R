# B3. Resultados do Censo 2022 que ainda não estão no Atlas
#
#   Rscript extracao/R/02_censo2022_setores_e_amostra.R      (na pasta atlas_v3/)
#
# Parte 1, por setor censitário (automática):
#   O Atlas já usa as tabelas Básico, Pessoas, Domicílio, Óbitos, Indígenas,
#   Quilombolas e Responsável/Renda. Falta a tabela "Entorno": características
#   do entorno dos domicílios (pavimentação, iluminação, calçada, arborização,
#   bueiro, rampa e outras), útil para a seção 8 do diagnóstico.
#   Função: censobr::read_tracts(year = 2022, dataset = "Entorno")
#   Hosts: github.com e objects.githubusercontent.com (releases ipea/censobr_prep_data).
#
# Parte 2, resultados da amostra de 2022 (trabalho, rendimento, deslocamento,
# família, deficiência, migração):
#   - Por município: o IBGE publicou os resultados preliminares da amostra em
#     2025 (educação em fevereiro, trabalho e rendimento e deslocamentos em
#     outubro, família em novembro). As tabelas estão no SIDRA. O script só
#     LISTA as tabelas com sidrar::search_sidra(); confira o número da tabela
#     e as variáveis antes de baixar com sidrar::get_sidra().
#   - Por área de ponderação: os microdados da amostra de 2022 são de acesso
#     controlado. É preciso pedir ao IBGE em microdados.ibge.gov.br e, com o
#     .zip em mãos, importar com censobr::import_microdata22(zip_path = ...).
#     Depois disso, read_population(year = 2022) lê os dados completos.
#     Sem a importação, o censobr baixa a versão pública, com menos variáveis.
#
# Saída: extracao/saida_R/censo2022_entorno_setores.csv
#        extracao/saida_R/censo2022_tabelas_sidra_amostra.csv (lista de tabelas)

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
pacote("censobr"); pacote("dplyr"); pacote("arrow")
suppressPackageStartupMessages(library(dplyr))

# Parte 1 ---------------------------------------------------------------------
message("Tabela Entorno do Censo 2022, por setor (censobr)…")
ent <- censobr::read_tracts(year = 2022, dataset = "Entorno", showProgress = TRUE)
exige_colunas(names(ent), c("code_muni", "code_tract"), "censobr 2022 Entorno")
# code_muni pode vir como texto ou número, conforme a versão dos dados
ent <- ent |>
  filter(as.character(code_muni) %in% COD7) |>
  collect()
exige_municipios(ent$code_muni, "censobr 2022 Entorno")
message("  ", nrow(ent), " setores; ", ncol(ent), " colunas")
message("  O significado de cada variável está em:")
message("  censobr::data_dictionary(year = 2022, dataset = 'tracts')")
grava(ent, "censo2022_entorno_setores.csv")

# Parte 2 ---------------------------------------------------------------------
if (requireNamespace("sidrar", quietly = TRUE)) {
  termos <- c("deslocamento", "rendimento", "ocupadas", "nupcialidade", "deficiência", "migração")
  achadas <- lapply(termos, function(t) {
    r <- tryCatch(sidrar::search_sidra(t), error = function(e) NULL)
    if (is.null(r) || !length(r)) return(NULL)
    data.frame(termo = t, tabela = as.character(r))
  })
  achadas <- do.call(rbind, achadas)
  if (!is.null(achadas)) {
    achadas <- achadas[grepl("2022", achadas$tabela), , drop = FALSE]
    grava(achadas, "censo2022_tabelas_sidra_amostra.csv")
    message("  Confira as tabelas listadas e baixe com sidrar::get_sidra(api = '/t/<tabela>/n6/",
            paste(COD7, collapse = ","), "/v/all/p/all')")
  }
} else {
  message("Parte 2: instale o pacote sidrar para listar as tabelas da amostra de 2022 no SIDRA.")
}
