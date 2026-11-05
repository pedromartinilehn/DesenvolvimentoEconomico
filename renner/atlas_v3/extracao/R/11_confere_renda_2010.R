# Auditoria: por que a pobreza e o Gini de 2010 do Atlas ficam acima do Atlas Brasil?
#
#   Rscript extracao/R/11_confere_renda_2010.R               (na pasta atlas_v3/)
#
# Contexto (docs/AUDITORIA-DADOS-v3.2.md, achado E3): nos sete municípios, a
# pobreza de 2010 do Atlas (renda domiciliar per capita abaixo de ½ salário
# mínimo) fica 0,3 a 1,7 ponto acima dos "vulneráveis à pobreza" do Atlas
# Brasil, a extrema pobreza fica acima mesmo com linha de corte menor, o Gini
# fica acima e a renda média fica 1% a 2% abaixo. É o padrão esperado se
# pessoas sem rendimento domiciliar declarado tiverem entrado como renda zero.
#
# Este script recalcula os quatro números de três jeitos e mostra qual
# reproduz o Atlas e qual reproduz o Atlas Brasil:
#   A. renda ausente conta como zero
#   B. renda ausente fica de fora
#   C. como B, e sem pensionistas, empregados domésticos e seus parentes
#      (V0502 = 17, 18, 19), que é o universo usual do Atlas Brasil
#
# Variáveis (conferir com censobr::data_dictionary(2010, "microdata")):
#   V6531 rendimento domiciliar per capita, em reais de julho de 2010
#   V6532 o mesmo, em salários mínimos (R$ 510)
#   V0010 peso; V0502 relação com o responsável
#
# Saída: extracao/saida_R/confere_renda_2010.csv

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

COLS <- c("code_muni", "V0010", "V0502", "V6531", "V6532")
pop <- censobr::read_population(year = 2010, columns = COLS, as_data_frame = FALSE)
exige_colunas(names(pop), COLS, "censobr 2010")
p <- pop |> filter(code_muni %in% as.integer(COD7)) |> collect()
exige_municipios(p$code_muni, "censobr 2010")

# confere a escala antes de usar: a mediana per capita de 2010 nesses
# municípios fica na casa das centenas de reais; se não ficar, a variável
# não é a que se pensa
med <- stats::median(p$V6531, na.rm = TRUE)
message("mediana de V6531: R$ ", round(med), " | ausentes: ", round(100 * mean(is.na(p$V6531)), 2), "%")
if (!is.finite(med) || med < 100 || med > 5000) stop("V6531 fora da escala esperada; confira o dicionário.", call. = FALSE)

gini_pond <- function(x, w) {
  o <- order(x); x <- x[o]; w <- w[o]
  cw <- cumsum(w) / sum(w); cx <- cumsum(x * w) / sum(x * w)
  1 - sum((cw - c(0, head(cw, -1))) * (cx + c(0, head(cx, -1))))
}

mede <- function(d, versao) {
  d |> group_by(code_muni) |> summarise(
    versao = versao,
    pct_abaixo_meio_sm  = 100 * sum(V0010[sm < 0.5]) / sum(V0010),
    pct_abaixo_quarto_sm = 100 * sum(V0010[sm < 0.25]) / sum(V0010),
    renda_pc_media = sum(V0010 * rpc) / sum(V0010),
    gini = gini_pond(rpc, V0010),
    .groups = "drop")
}

A <- p |> mutate(rpc = coalesce(V6531, 0), sm = coalesce(V6532, 0)) |> mede("A: ausente = zero")
B <- p |> filter(!is.na(V6531)) |> mutate(rpc = V6531, sm = V6532) |> mede("B: ausente fora")
C <- p |> filter(!is.na(V6531), !V0502 %in% c(17, 18, 19)) |> mutate(rpc = V6531, sm = V6532) |>
  mede("C: universo Atlas Brasil")

saida <- bind_rows(A, B, C) |>
  mutate(municipio = MUNICIPIOS[as.character(code_muni)], .after = code_muni) |>
  arrange(code_muni, versao)
print(as.data.frame(saida), digits = 4)
message("\nCompare com o Atlas (dados-nucleo.js, municipal_2010) e com o Atlas Brasil:")
message("Porto Alegre: Atlas 13,76% abaixo de ½ SM, Gini 0,615, renda R$ 1.730 | ",
        "Atlas Brasil 12,51% vulneráveis (até R$ 255), Gini 0,60, renda R$ 1.758")
grava(saida, "confere_renda_2010.csv")
