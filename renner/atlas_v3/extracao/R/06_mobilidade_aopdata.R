# B8. Mobilidade: acesso a empregos, saúde e escolas por transporte público
#
#   Rscript extracao/R/06_mobilidade_aopdata.R              (na pasta atlas_v3/)
#
# Fonte: Projeto Acesso a Oportunidades (IPEA), hexágonos H3 de resolução 9.
# Funções: aopdata::read_access(city = "poa", mode = "public_transport",
#                               peak = TRUE, year = 2019, geometry = TRUE)
#          aopdata::read_population(city = "poa", year = 2010)  (peso por hexágono)
# Host: github.com (releases ipeaGIT/aopdata)
#
# Cobertura: das sete cidades do Atlas, só Porto Alegre está no projeto.
#
# Por que este script e não a tabela da Base dos Dados: o espelho público da
# Base dos Dados tem uma tabela de 2019 (br_ipea_acesso_oportunidades), mas os
# tempos mínimos (TMI) dela não respeitam os limites documentados pelo IPEA
# (Inf acima de 90 minutos a pé e 120 minutos de transporte público) e a
# unidade não pôde ser confirmada. O Atlas não usa essa tabela.
#
# Indicadores (dicionário do aopdata):
#   CMATT60  empregos acessíveis em até 60 minutos
#   TMISB    tempo até o estabelecimento de saúde de baixa complexidade mais próximo
#   TMIEF    tempo até a escola pública de ensino fundamental mais próxima
#   TMIEI    tempo até a escola pública de educação infantil mais próxima
#
# Saída: extracao/saida_R/aop_poa_2019_transporte_publico_hexagonos.csv
#        (id do hexágono, centroide, população, indicadores). Para levar ao
#        Atlas, atribua cada setor ao hexágono que contém o seu centroide e
#        agregue por bairro com peso populacional.

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
pacote("aopdata"); pacote("dplyr"); pacote("sf")
suppressPackageStartupMessages({ library(dplyr); library(sf) })

message("aopdata: acessibilidade em Porto Alegre, transporte público, pico, 2019…")
acc <- aopdata::read_access(city = "poa", mode = "public_transport", peak = TRUE,
                            year = 2019, geometry = TRUE, showProgress = TRUE)
INDIC <- c("CMATT60", "TMISB", "TMIEF", "TMIEI")
exige_colunas(acc, c("id_hex", INDIC), "aopdata read_access")

pop <- aopdata::read_population(city = "poa", year = 2010, geometry = FALSE, showProgress = TRUE)
exige_colunas(pop, c("id_hex", "P001"), "aopdata read_population")

cent <- suppressWarnings(st_coordinates(st_centroid(st_geometry(acc))))
saida <- acc |>
  st_drop_geometry() |>
  select(id_hex, all_of(INDIC)) |>
  mutate(lon = round(cent[, 1], 6), lat = round(cent[, 2], 6)) |>
  left_join(select(pop, id_hex, populacao_2010 = P001), by = "id_hex") |>
  # Inf = acima do limite de tempo do IPEA; fica como texto para não virar número
  mutate(across(starts_with("TMI"), ~ ifelse(is.infinite(.x), "acima_do_limite", format(round(.x, 1)))))

grava(saida, "aop_poa_2019_transporte_publico_hexagonos.csv")
