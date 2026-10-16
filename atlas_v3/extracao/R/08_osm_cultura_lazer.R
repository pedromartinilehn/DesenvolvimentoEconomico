# B13. Cultura, lazer e espaços públicos (OpenStreetMap)
#
#   Rscript extracao/R/08_osm_cultura_lazer.R               (na pasta atlas_v3/)
#
# Fonte: OpenStreetMap, colaborativo (licença ODbL; cite "© colaboradores do
#        OpenStreetMap"). Não é cadastro oficial: a cobertura varia de bairro
#        para bairro e a ausência de um ponto não prova a ausência do lugar.
# Função: osmdata::opq() + add_osm_feature() + osmdata_sf()
# Host: overpass-api.de (ou outro servidor Overpass)
#
# Saída: extracao/saida_R/osm_cultura_lazer.csv (tipo, nome, lon, lat, id OSM)

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
pacote("osmdata"); pacote("sf"); pacote("dplyr")
suppressPackageStartupMessages({ library(sf); library(dplyr) })

# caixa que cobre os sete municípios (oeste, sul, leste, norte)
CAIXA <- c(-51.35, -30.30, -50.85, -29.78)

TIPOS <- list(
  leisure = c("park", "playground", "pitch", "sports_centre", "fitness_station"),
  amenity = c("library", "community_centre", "theatre", "arts_centre", "cinema", "social_centre")
)

busca <- function(chave, valores) {
  q <- osmdata::opq(bbox = CAIXA, timeout = 180) |>
    osmdata::add_osm_feature(key = chave, value = valores)
  r <- osmdata::osmdata_sf(q)
  partes <- list(r$osm_points, r$osm_polygons, r$osm_multipolygons)
  partes <- Filter(function(x) !is.null(x) && nrow(x), partes)
  # pontos isolados só valem se tiverem a etiqueta (os vértices de polígono não têm)
  partes <- lapply(partes, function(x) {
    x <- x[!is.na(x[[chave]]) & x[[chave]] %in% valores, ]
    if (!nrow(x)) return(NULL)
    p <- suppressWarnings(st_point_on_surface(st_make_valid(x)))
    xy <- st_coordinates(p)
    data.frame(osm_id = x$osm_id, chave = chave, tipo = x[[chave]],
               nome = if ("name" %in% names(x)) x$name else NA_character_,
               lon = round(xy[, 1], 6), lat = round(xy[, 2], 6))
  })
  do.call(rbind, partes)
}

message("OpenStreetMap: cultura e lazer na região…")
saida <- do.call(rbind, Map(busca, names(TIPOS), TIPOS)) |> distinct(osm_id, .keep_all = TRUE)
message("  ", nrow(saida), " lugares; por tipo:")
print(table(saida$tipo))
grava(saida, "osm_cultura_lazer.csv")
