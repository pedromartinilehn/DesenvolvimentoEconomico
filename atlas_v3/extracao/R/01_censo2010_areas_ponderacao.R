# B2. Novos recortes do Censo 2010 por área de ponderação
#
#   Rscript extracao/R/01_censo2010_areas_ponderacao.R      (na pasta atlas_v3/)
#
# Fonte: microdados da amostra do Censo Demográfico 2010 (IBGE), distribuídos
# pelo pacote censobr (IPEA) em Parquet, sem alteração dos valores.
# Função: censobr::read_population(year = 2010, columns = ...)
# Hosts: github.com e objects.githubusercontent.com (releases do repositório
#        ipea/censobr_prep_data). Na primeira execução baixa cerca de 1 GB.
#
# O Atlas já usa a amostra de 2010 por área de ponderação (renda, pobreza,
# desocupação, informalidade, escolaridade). Este script calcula o que faltava,
# com o mesmo recorte e o mesmo peso amostral (V0010):
#   - desocupação por sexo e por faixa etária
#   - jovens de 15 a 24 anos que não estudam nem trabalham (todos, não só os vulneráveis)
#   - domicílios chefiados por mulheres
#   - pessoas de 60 anos ou mais que moram sozinhas
#   - pessoas com deficiência (grande dificuldade ou não consegue, ou deficiência mental)
#   - pessoas que não nasceram no município
#   - pessoas e domicílios com rendimento do Bolsa Família ou PETI
#
# Os códigos das variáveis foram conferidos no próprio censobr (rótulos de
# add_labels_population.R e esquema de data_prep/R/get_schema.R, versão 1.0.0).
# Em caso de dúvida, abra o dicionário com:
#   censobr::data_dictionary(year = 2010, dataset = "microdata")
#
# Fica de fora: famílias monoparentais. Em 2010 a informação está nas
# variáveis de família (V5040, V5090, V5100), que o censobr ainda não rotula.
# Calcular sem conferir o código seria arriscar um número errado.
#
# Saída: extracao/saida_R/censo2010_areas_ponderacao_complemento.csv
#        uma linha por área de ponderação, com numerador e denominador
#        ponderados (para somar áreas sem erro) e o tamanho da amostra.

source("extracao/R/_comum.R")
pacote("censobr"); pacote("dplyr"); pacote("arrow")
suppressPackageStartupMessages(library(dplyr))

COLUNAS <- c(
  "code_muni", "code_weighting",
  "V0300",  # identificação do domicílio
  "V0010",  # peso amostral
  "V0502",  # relação com o responsável (1 = responsável; 20 = domicílio coletivo)
  "V0601",  # sexo (1 masculino, 2 feminino)
  "V6036",  # idade em anos
  "V0628",  # frequenta escola ou creche (1, 2 = sim; 3, 4 = não)
  "V6910",  # condição de ocupação (1 ocupada, 2 desocupada)
  "V0614", "V0615", "V0616",  # dificuldade de enxergar, ouvir, caminhar (1 não consegue, 2 grande, 3 alguma, 4 nenhuma)
  "V0617",  # deficiência mental ou intelectual (1 sim)
  "V0618",  # nasceu neste município (1 sim e sempre morou, 2 sim mas morou fora, 3 não)
  "V0657"   # rendimento do Bolsa Família ou PETI (1 sim, 0 não, 9 ignorado)
)

message("Lendo os microdados de 2010 (censobr)…")
pop <- censobr::read_population(year = 2010, columns = COLUNAS,
                                as_data_frame = FALSE, showProgress = TRUE)
exige_colunas(names(pop), COLUNAS, "censobr 2010")

p <- pop |>
  filter(code_muni %in% as.integer(COD7)) |>
  collect()
exige_municipios(p$code_muni, "censobr 2010")
message("  ", nrow(p), " pessoas na amostra dos sete municípios")

# indicadores pessoa a pessoa ------------------------------------------------
p <- p |>
  mutate(
    # %in% e não ==: V6910 e outras vêm vazias (NA) para quem não responde
    # ao quesito, e NA dentro de um sum() estragaria a área inteira
    privado     = !(V0502 %in% 20),
    pea         = V6910 %in% c(1, 2),
    desocupado  = V6910 %in% 2,
    estuda      = V0628 %in% c(1, 2),
    ocupado     = V6910 %in% 1,
    jovem       = V6036 >= 15 & V6036 <= 24,
    nem_nem     = jovem & !estuda & !ocupado,
    deficiencia = V0614 %in% c(1, 2) | V0615 %in% c(1, 2) |
                  V0616 %in% c(1, 2) | V0617 %in% 1,
    nao_natural = V0618 %in% 3,
    bolsa       = V0657 %in% 1,
    faixa       = cut(V6036, c(14, 17, 24, 29, 59, Inf),
                      labels = c("15_17", "18_24", "25_29", "30_59", "60m"))
  )

# moradores por domicílio particular: o domicílio entra inteiro na amostra
dom <- p |>
  filter(privado) |>
  group_by(code_weighting, V0300) |>
  summarise(
    moradores = n(),
    peso_dom  = first(V0010[V0502 %in% 1]),
    chefe_mulher = any(V0502 %in% 1 & V0601 %in% 2),
    tem_bolsa = any(bolsa),
    .groups = "drop"
  )

razao <- function(num, den) ifelse(den > 0, 100 * num / den, NA_real_)

# por área de ponderação ------------------------------------------------------
pessoas <- p |>
  left_join(select(dom, code_weighting, V0300, moradores), by = c("code_weighting", "V0300")) |>
  group_by(code_muni, code_weighting) |>
  summarise(
    n_amostra = n(),
    pea_h = sum(V0010[pea & V0601 == 1]),  desoc_h = sum(V0010[desocupado & V0601 == 1]),
    pea_m = sum(V0010[pea & V0601 == 2]),  desoc_m = sum(V0010[desocupado & V0601 == 2]),
    pea_18_24 = sum(V0010[pea & faixa %in% "18_24"]), desoc_18_24 = sum(V0010[desocupado & faixa %in% "18_24"]),
    pea_25_29 = sum(V0010[pea & faixa %in% "25_29"]), desoc_25_29 = sum(V0010[desocupado & faixa %in% "25_29"]),
    pea_30_59 = sum(V0010[pea & faixa %in% "30_59"]), desoc_30_59 = sum(V0010[desocupado & faixa %in% "30_59"]),
    jovens = sum(V0010[jovem]), nem_nem = sum(V0010[nem_nem]), n_jovens = sum(jovem),
    idosos = sum(V0010[V6036 >= 60 & privado]),
    idosos_sos = sum(V0010[V6036 >= 60 & privado & moradores %in% 1]),
    n_idosos = sum(V6036 >= 60 & privado),
    pop = sum(V0010),
    deficiencia = sum(V0010[deficiencia]),
    nao_natural = sum(V0010[nao_natural]),
    pessoas_bolsa = sum(V0010[bolsa]),
    .groups = "drop"
  )

domicilios <- dom |>
  group_by(code_weighting) |>
  summarise(
    n_domicilios = n(),
    domicilios = sum(peso_dom, na.rm = TRUE),
    dom_chefe_mulher = sum(peso_dom[chefe_mulher], na.rm = TRUE),
    dom_com_bolsa = sum(peso_dom[tem_bolsa], na.rm = TRUE),
    .groups = "drop"
  )

saida <- pessoas |>
  left_join(domicilios, by = "code_weighting") |>
  mutate(
    municipio = MUNICIPIOS[as.character(code_muni)],
    desocupacao_homens   = razao(desoc_h, pea_h),
    desocupacao_mulheres = razao(desoc_m, pea_m),
    desocupacao_18_24    = razao(desoc_18_24, pea_18_24),
    desocupacao_25_29    = razao(desoc_25_29, pea_25_29),
    desocupacao_30_59    = razao(desoc_30_59, pea_30_59),
    pct_nem_nem_15_24    = razao(nem_nem, jovens),
    pct_dom_chefia_feminina = razao(dom_chefe_mulher, domicilios),
    pct_idosos_sos       = razao(idosos_sos, idosos),
    pct_deficiencia      = razao(deficiencia, pop),
    pct_nao_naturais     = razao(nao_natural, pop),
    pct_pessoas_bolsa_familia = razao(pessoas_bolsa, pop),
    pct_dom_bolsa_familia     = razao(dom_com_bolsa, domicilios)
  ) |>
  relocate(code_muni, municipio, code_weighting, n_amostra, n_domicilios, n_jovens, n_idosos) |>
  arrange(code_muni, code_weighting)

# Aviso de amostra pequena: com menos de 100 jovens ou idosos na amostra,
# o percentual da área oscila muito. O valor vai, mas sinalizado.
pequenas <- saida |> filter(n_jovens < 100 | n_idosos < 100)
if (nrow(pequenas)) {
  message("  atenção: ", nrow(pequenas), " áreas com menos de 100 jovens ou idosos na amostra")
}

grava(saida, "censo2010_areas_ponderacao_complemento.csv")
