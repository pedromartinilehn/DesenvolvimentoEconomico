# B9. Mancha da enchente de maio de 2024 sobre os setores censitários
#
#   Rscript extracao/R/07_enchente_2024.R                   (na pasta atlas_v3/)
#
# Fonte: "Banco de dados das cheias na Região Hidrográfica do Lago Guaíba em
#        maio de 2024", publicado no Zenodo (registro 11185049) por
#        pesquisadores do IPH/UFRGS. Geopackage com a mancha de inundação
#        observada por sensoriamento remoto. Os autores pedem que os dados
#        sejam conferidos na fonte original; o Zenodo guarda versões, e o
#        script lista os arquivos da versão indicada antes de baixar.
# Malha dos setores: geobr::read_census_tract(code_tract = <município>, year = 2022)
# Hosts: zenodo.org e github.com (geobr)
#
# A setorização de risco geológico do Serviço Geológico do Brasil (SGB) não
# tem pacote R: o arquivo vetorial de Porto Alegre está no RIGeo
# (rigeo.sgb.gov.br) e o relatório da atualização de 2022 no site da
# Defesa Civil de Porto Alegre. Baixe à mão e leia com sf::st_read().
#
# Saída: extracao/saida_R/enchente2024_setores.csv
#        (código do setor, área do setor e área alagada, em km²)

source("extracao/R/_comum.R")
pacote("sf"); pacote("geobr"); pacote("jsonlite"); pacote("dplyr")
suppressPackageStartupMessages({ library(sf); library(dplyr) })

REGISTRO <- "11185049"
api <- jsonlite::fromJSON(sprintf("https://zenodo.org/api/records/%s", REGISTRO))
arqs <- api$files
message("Zenodo ", REGISTRO, " — ", api$metadata$title, " (versão ", api$metadata$version, ")")
print(data.frame(arquivo = arqs$key, mb = round(arqs$size / 1e6, 1)))

gpkg <- arqs[grepl("\\.gpkg$", arqs$key, ignore.case = TRUE), ]
if (!nrow(gpkg)) stop("Nenhum .gpkg neste registro; escolha o arquivo na lista acima.", call. = FALSE)
destino <- file.path(SAIDA, gpkg$key[1])
if (!file.exists(destino)) utils::download.file(gpkg$links$self[1], destino, mode = "wb")

camadas <- sf::st_layers(destino)
print(camadas)
alvo <- grep("mancha|inund|flood", camadas$name, ignore.case = TRUE, value = TRUE)
if (length(alvo) != 1) {
  stop("Não consegui escolher sozinho a camada da mancha. Camadas: ",
       paste(camadas$name, collapse = ", "), ". Ajuste a variável 'alvo'.", call. = FALSE)
}
mancha <- st_read(destino, layer = alvo, quiet = TRUE) |> st_make_valid() |> st_union()

setores <- do.call(rbind, lapply(COD7, function(c) geobr::read_census_tract(code_tract = as.numeric(c), year = 2022,
                                                                            simplified = FALSE, showProgress = FALSE)))
exige_colunas(setores, c("code_tract", "code_muni"), "geobr setores 2022")

# área em projeção métrica (SIRGAS 2000 / UTM 22S, EPSG:31982)
setores <- st_transform(setores, 31982); mancha <- st_transform(mancha, 31982)
inter <- st_intersection(select(setores, code_tract), mancha)
alag <- data.frame(code_tract = inter$code_tract, area_alagada_km2 = as.numeric(st_area(inter)) / 1e6) |>
  group_by(code_tract) |> summarise(area_alagada_km2 = sum(area_alagada_km2), .groups = "drop")

saida <- setores |>
  st_drop_geometry() |>
  transmute(code_tract = as.character(code_tract), code_muni,
            area_setor_km2 = as.numeric(st_area(setores)) / 1e6) |>
  left_join(mutate(alag, code_tract = as.character(code_tract)), by = "code_tract") |>
  mutate(area_alagada_km2 = coalesce(area_alagada_km2, 0),
         pct_area_alagada = 100 * area_alagada_km2 / area_setor_km2)
grava(saida, "enchente2024_setores.csv")
