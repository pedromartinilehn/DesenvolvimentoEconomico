#!/usr/bin/env python3
"""Monta o arquivo de dados do Atlas Porto Alegre: dados/poa.js.

    python3 extracao/4_monta.py

Lê o que os scripts 1, 2 e 3 gravaram em extracao/fontes/intermediario/ e grava
dados/poa.js com:
- os setores, os bairros e o contorno do município (arcos compartilhados);
- os indicadores do Censo 2022 por setor e por bairro, e os de Porto Alegre, do RS
  e do Brasil para comparar;
- as lojas Panvel, as unidades de saúde e as escolas;
- os indicadores de cobertura das lojas, calculados pelo Atlas: lojas no bairro,
  lojas por 10 mil habitantes, distância até a loja mais próxima e parte dos
  moradores a até 500 m e a até 1 km de uma loja (distâncias em linha reta, do
  ponto representativo de cada setor).

Regras de exibição, as mesmas do Atlas 2.0:
- valor do Censo calculado sobre os setores com dado; se esses setores têm menos
  da metade da população do bairro, o valor fica em branco;
- quando o sigilo do IBGE deixa um intervalo maior que a casa decimal exibida, o
  arquivo guarda o mínimo e o máximo e o Atlas mostra o intervalo;
- nada é estimado: o que a fonte não publica fica em branco.

Confere antes de gravar: os mesmos setores e bairros nos três arquivos
intermediários, valores dentro da faixa possível, colunas que voltam iguais
depois de codificadas e população dos bairros igual à do município.
"""

from __future__ import annotations

import datetime as dt
import json
import math
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
INTER = RAIZ / "extracao" / "fontes" / "intermediario"
DADOS = RAIZ / "dados"
VERSAO = "1.0"
COB_MIN = 0.5          # parte mínima da população em setores com dado para exibir o valor
RAIO_TERRA_M = 6371008.8


class Falha(Exception):
    pass


# ── fontes ──────────────────────────────────────────────────────────────────
FONTES = {
    "CENSO22": {"n": "IBGE — Censo Demográfico 2022, agregados por setores censitários", "s": "Censo 2022",
                "u": "https://www.ibge.gov.br/estatisticas/sociais/trabalho/22827-censo-demografico-2022.html",
                "d": "Agregados por setor do universo do Censo 2022 (básico, pessoas, domicílios, renda do responsável e "
                     "entorno), nos arquivos que o IPEA publica para o pacote censobr. No setor, o valor é o do próprio "
                     "setor; o bairro e o município são a soma dos seus setores."},
    "MALHA22": {"n": "IBGE — Malha de setores censitários do Censo 2022", "s": "Malha IBGE 2022",
                "u": "https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais.html",
                "d": "Polígonos dos setores de 2022, na forma publicada pelo IPEA no pacote geobr. Bairros e município "
                     "são a união dos seus setores. Os 94 bairros são os que o IBGE delimitou no Censo 2022."},
    "CNES": {"n": "Ministério da Saúde — Cadastro Nacional de Estabelecimentos de Saúde (CNES)", "s": "CNES, abr./2026",
             "u": "https://cnes.datasus.gov.br/",
             "d": "Competência de abril de 2026, na forma publicada pelo IPEA para o pacote geobr, com as coordenadas "
                  "do CNES e as do geocodebr. Lojas Panvel: estabelecimentos ativos com o CNPJ da Dimed S/A "
                  "Distribuidora de Medicamentos (raiz 92.665.611), que opera a Panvel."},
    "INEP": {"n": "INEP — Censo Escolar 2025", "s": "Censo Escolar 2025",
             "u": "https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/censo-escolar",
             "d": "Escolas em atividade, na forma publicada pelo IPEA para o pacote geobr."},
}

CATS = [
    ("lojas", "Lojas Panvel"), ("geral", "Visão geral"), ("demo", "Demografia"), ("raca", "Cor ou raça"),
    ("renda", "Renda"), ("edu", "Educação"), ("dom", "Domicílio e saneamento"),
    ("entorno", "Entorno dos domicílios"), ("vuln", "Vulnerabilidade"),
]

SIGILO = (" O IBGE omite, em cada setor, contagens de 1 e 2; quando a categoria omitida é a única que falta para "
          "fechar o total, o Atlas a recupera pela diferença. Se não dá, o valor fica entre um mínimo e um máximo, e o "
          "Atlas mostra o intervalo. No bairro, é a soma dos setores.")
ENT = (" Pesquisa do entorno do Censo 2022: faces de quadra percorridas nas áreas urbanas. A base são os moradores de "
       "domicílios com entorno pesquisado.")
LINHA_RETA = (" Distância em linha reta, do ponto representativo de cada setor (um ponto dentro do setor) até a "
              "coordenada da loja. Não é o caminho pelas ruas.")


def I(id, cat, n, u, fmt, fonte, ano, niv, esc, d, rampa="seq", calc=None):
    return {"id": id, "cat": cat, "n": n, "u": u, "fmt": fmt, "fonte": fonte, "ano": ano, "niv": niv,
            "esc": esc, "d": d, "rampa": rampa, **({"calc": calc} if calc else {})}


SB = ["set", "bai"]
B = ["bai"]
CATALOGO = [
    # lojas Panvel (cálculo do Atlas sobre o CNES e o Censo)
    I("dist_loja", "lojas", "Distância até a loja Panvel mais próxima", "m", "int", "CNES", 2026, SB, 1,
      "No setor, a distância do ponto representativo até a loja mais próxima. No bairro, a média dos moradores: "
      "cada setor pesa pela sua população." + LINHA_RETA, rampa="alerta",
      calc="distância em linha reta; no bairro, média ponderada pela população dos setores"),
    I("lojas_n", "lojas", "Lojas Panvel no bairro", "lojas", "int", "CNES", 2026, B, 1,
      "Lojas ativas no CNES em abril de 2026 cuja coordenada cai no bairro.", calc="contagem das lojas no bairro"),
    I("lojas_10mil", "lojas", "Lojas Panvel por 10 mil habitantes", "por 10 mil hab.", "dec2", "CNES", 2026, B, 100,
      "Lojas no bairro para cada 10 mil moradores do Censo 2022.", calc="lojas no bairro ÷ população × 10.000"),
    I("pop_500m", "lojas", "Moradores a até 500 m de uma loja Panvel", "%", "pct1", "CNES", 2026, B, 10,
      "Parte da população do bairro em setores cujo ponto representativo está a até 500 m de alguma loja." + LINHA_RETA,
      calc="população dos setores a até 500 m ÷ população do bairro"),
    I("pop_1km", "lojas", "Moradores a até 1 km de uma loja Panvel", "%", "pct1", "CNES", 2026, B, 10,
      "Parte da população do bairro em setores cujo ponto representativo está a até 1 km de alguma loja." + LINHA_RETA,
      calc="população dos setores a até 1 km ÷ população do bairro"),
    # visão geral
    I("pop", "geral", "População residente", "pessoas", "int", "CENSO22", 2022, SB, 1,
      "Pessoas que moravam no setor ou no bairro na data de referência do Censo 2022."),
    I("dom", "geral", "Domicílios particulares ocupados", "domicílios", "int", "CENSO22", 2022, SB, 1,
      "Domicílios particulares permanentes e improvisados ocupados."),
    I("area", "geral", "Área", "km²", "dec2", "MALHA22", 2022, SB, 1000,
      "Área do setor publicada pelo IBGE; no bairro, a soma dos setores."),
    I("dens", "geral", "Densidade demográfica", "hab./km²", "int", "CENSO22", 2022, SB, 1,
      "População dividida pela área.", calc="população do Censo 2022 ÷ área dos setores"),
    I("mor_dom", "geral", "Moradores por domicílio", "pessoas", "dec2", "CENSO22", 2022, SB, 100,
      "Média de moradores por domicílio particular permanente ocupado." + SIGILO),
    I("pct_urb", "geral", "População em setores urbanos", "%", "pct1", "CENSO22", 2022, B, 10,
      "Parte da população que mora em setores classificados como urbanos pelo IBGE.", rampa="neutra"),
    # demografia
    I("pct_0a14", "demo", "Crianças de 0 a 14 anos", "%", "pct1", "CENSO22", 2022, SB, 10, "Parte da população." + SIGILO),
    I("pct_15a29", "demo", "Jovens de 15 a 29 anos", "%", "pct1", "CENSO22", 2022, SB, 10, "Parte da população." + SIGILO),
    I("pct_60mais", "demo", "Pessoas de 60 anos ou mais", "%", "pct1", "CENSO22", 2022, SB, 10, "Parte da população." + SIGILO),
    I("ind_envelhec", "demo", "Índice de envelhecimento", "por 100", "dec1", "CENSO22", 2022, SB, 10,
      "Pessoas de 60 anos ou mais para cada 100 de 0 a 14 anos (as faixas de idade do Censo 2022 por setor não "
      "separam os 65 anos)." + SIGILO),
    I("razao_sexo", "demo", "Razão de sexo", "homens por 100 mulheres", "dec1", "CENSO22", 2022, SB, 10,
      "Homens para cada 100 mulheres." + SIGILO, rampa="div"),
    # cor ou raça
    I("pct_branca", "raca", "Pessoas brancas", "%", "pct1", "CENSO22", 2022, SB, 10, "Cor ou raça declarada." + SIGILO),
    I("pct_preta", "raca", "Pessoas pretas", "%", "pct1", "CENSO22", 2022, SB, 10, "Cor ou raça declarada." + SIGILO),
    I("pct_parda", "raca", "Pessoas pardas", "%", "pct1", "CENSO22", 2022, SB, 10, "Cor ou raça declarada." + SIGILO),
    I("pct_negra", "raca", "Pessoas pretas ou pardas", "%", "pct1", "CENSO22", 2022, SB, 10,
      "Soma de pretos e pardos, a população negra na classificação do IBGE." + SIGILO),
    I("pct_indigena", "raca", "Pessoas indígenas (cor ou raça)", "%", "pct2", "CENSO22", 2022, SB, 100,
      "Quem declarou cor ou raça indígena. Não inclui quem se declarou indígena só na pergunta de pertencimento, "
      "que o IBGE conta à parte." + SIGILO),
    I("pct_amarela", "raca", "Pessoas amarelas", "%", "pct2", "CENSO22", 2022, SB, 100, "Cor ou raça declarada." + SIGILO),
    # renda
    I("renda_resp", "renda", "Rendimento médio do responsável pelo domicílio", "R$/mês", "brl0", "CENSO22", 2022, SB, 1,
      "Rendimento nominal médio mensal das pessoas responsáveis com rendimento, em domicílios particulares permanentes "
      "ocupados. No setor, é o valor publicado pelo IBGE. No bairro e no município, o Atlas faz a média dos setores "
      "ponderada pelo número de responsáveis (o peso exato seria o de responsáveis com rendimento, que o IBGE não "
      "publica por setor); por isso, ali, aparece como cálculo do Atlas.",
      calc="no bairro, média dos setores ponderada pelos responsáveis"),
    # educação
    I("tx_analf", "edu", "Taxa de analfabetismo, 15 anos ou mais", "%", "pct1", "CENSO22", 2022, SB, 10,
      "Pessoas de 15 anos ou mais que não sabem ler e escrever." + SIGILO, rampa="alerta"),
    # domicílio e saneamento
    I("pct_agua_rede", "dom", "Domicílios com água da rede geral", "%", "pct1", "CENSO22", 2022, SB, 10,
      "Domicílios particulares permanentes ocupados cuja forma principal de abastecimento é a rede geral de "
      "distribuição." + SIGILO),
    I("pct_agua_naoenc", "dom", "Domicílios sem água encanada", "%", "pct1", "CENSO22", 2022, SB, 10,
      "A água não chega encanada ao domicílio." + SIGILO, rampa="alerta"),
    I("pct_banheiro", "dom", "Domicílios com banheiro de uso exclusivo", "%", "pct1", "CENSO22", 2022, SB, 10,
      "Pelo menos um banheiro de uso exclusivo, com chuveiro e vaso sanitário." + SIGILO),
    I("pct_sem_banheiro", "dom", "Domicílios sem banheiro nem sanitário", "%", "pct2", "CENSO22", 2022, SB, 100,
      "Não tinham banheiro nem sanitário." + SIGILO, rampa="alerta"),
    I("pct_esgoto_rede", "dom", "Esgoto pela rede geral ou pluvial", "%", "pct1", "CENSO22", 2022, SB, 10,
      "Esgoto do banheiro ou sanitário ligado à rede geral ou pluvial, ou fossa séptica ligada à rede." + SIGILO),
    I("pct_esgoto_fossa", "dom", "Esgoto em fossa séptica não ligada à rede", "%", "pct1", "CENSO22", 2022, SB, 10,
      "Fossa séptica ou fossa filtro não ligada à rede." + SIGILO, rampa="neutra"),
    I("pct_esgoto_precario", "dom", "Esgoto precário ou inexistente", "%", "pct1", "CENSO22", 2022, SB, 10,
      "Fossa rudimentar ou buraco, vala, rio, lago, córrego ou mar, outra forma, ou sem banheiro nem sanitário." + SIGILO,
      rampa="alerta"),
    I("pct_lixo_coleta", "dom", "Domicílios com lixo coletado", "%", "pct1", "CENSO22", 2022, SB, 10,
      "Lixo coletado no domicílio ou depositado em caçamba do serviço de limpeza." + SIGILO),
    I("pct_apto", "dom", "Domicílios em apartamento", "%", "pct1", "CENSO22", 2022, SB, 10,
      "Espécie do domicílio particular permanente ocupado." + SIGILO, rampa="neutra"),
    I("pct_casa", "dom", "Domicílios em casa", "%", "pct1", "CENSO22", 2022, SB, 10,
      "Espécie do domicílio particular permanente ocupado." + SIGILO, rampa="neutra"),
    I("pct_comodos", "dom", "Domicílios em casa de cômodos ou cortiço", "%", "pct2", "CENSO22", 2022, SB, 100,
      "Espécie do domicílio particular permanente ocupado." + SIGILO, rampa="alerta"),
    I("dom_improv", "dom", "Domicílios improvisados ocupados", "domicílios", "int", "CENSO22", 2022, SB, 1,
      "Tendas, barracas, estruturas em logradouro, veículos e outros abrigos improvisados com moradores. Fica em "
      "branco quando algum setor do bairro teve os dados omitidos, porque aí a soma seria parcial.", rampa="alerta"),
    # entorno
    I("pct_pav", "entorno", "Moradores em rua pavimentada", "%", "pct1", "CENSO22", 2022, SB, 10, "Face com via pavimentada." + ENT),
    I("pct_ilum", "entorno", "Moradores em rua com iluminação pública", "%", "pct1", "CENSO22", 2022, SB, 10,
      "Face com iluminação pública." + ENT),
    I("pct_calcada", "entorno", "Moradores em rua com calçada", "%", "pct1", "CENSO22", 2022, SB, 10, "Face com calçada." + ENT),
    I("pct_arvore", "entorno", "Moradores em rua arborizada", "%", "pct1", "CENSO22", 2022, SB, 10,
      "Face com pelo menos uma árvore." + ENT),
    I("pct_bueiro", "entorno", "Moradores em rua com bueiro", "%", "pct1", "CENSO22", 2022, SB, 10,
      "Face com bueiro ou boca de lobo." + ENT),
    I("pct_onibus", "entorno", "Moradores em rua com ponto de ônibus", "%", "pct1", "CENSO22", 2022, SB, 10,
      "Face com ponto de ônibus ou van." + ENT),
    I("pct_rampa", "entorno", "Moradores em rua com rampa para cadeirante", "%", "pct1", "CENSO22", 2022, SB, 10,
      "Face com rampa para cadeirante." + ENT),
    I("pct_bici", "entorno", "Moradores em rua com ciclovia ou ciclofaixa", "%", "pct1", "CENSO22", 2022, SB, 10,
      "Face com via sinalizada para bicicleta." + ENT),
    I("pct_obstaculo", "entorno", "Moradores em rua com obstáculo na calçada", "%", "pct1", "CENSO22", 2022, SB, 10,
      "Face com obstáculo na calçada." + ENT, rampa="alerta"),
    I("cob_entorno", "entorno", "Moradores com entorno pesquisado", "%", "pct1", "CENSO22", 2022, SB, 10,
      "Parte dos moradores de domicílios particulares permanentes que está em faces percorridas pela pesquisa do "
      "entorno. Mostra quanto do setor ou do bairro os outros indicadores de entorno cobrem.", rampa="neutra"),
    # vulnerabilidade
    I("pct_fcu", "vuln", "População em favelas e comunidades urbanas", "%", "pct1", "CENSO22", 2022, SB, 10,
      "Parte da população que mora em setores classificados pelo IBGE como favela ou comunidade urbana. No setor, "
      "é 100% ou 0%.", rampa="alerta"),
]
CAT_IDS = {c for c, _ in CATS}
for c in CATALOGO:
    if c["cat"] not in CAT_IDS or c["fonte"] not in FONTES:
        raise SystemExit(f"catálogo: {c['id']} com categoria ou fonte desconhecida")

COB_PESSOAS = {"pct_0a14", "pct_15a29", "pct_60mais", "ind_envelhec", "razao_sexo", "pct_branca", "pct_preta",
               "pct_parda", "pct_negra", "pct_indigena", "pct_amarela", "tx_analf"}
COB_DOM = {"pct_agua_rede", "pct_agua_poco", "pct_agua_naoenc", "pct_banheiro", "pct_sem_banheiro",
           "pct_esgoto_rede", "pct_esgoto_fossa", "pct_esgoto_precario", "pct_lixo_coleta", "pct_lixo_queima",
           "pct_apto", "pct_casa", "pct_comodos"}
COB_ENT = {"pct_pav", "pct_ilum", "pct_calcada", "pct_arvore", "pct_bueiro", "pct_onibus", "pct_rampa", "pct_bici",
           "pct_obstaculo"}
# contagens por setor que o entorno das lojas soma (numerador e denominador, mínimo e máximo)
CONTAGENS = ("pct_0a14", "pct_60mais", "pct_negra", "tx_analf", "pct_esgoto_precario",
             "pct_agua_rede", "pct_lixo_coleta", "pct_onibus", "pct_pav", "pct_ilum", "pct_calcada")


# ── codificação (a mesma do Atlas 2.0) ──────────────────────────────────────
def enc_num(v: int, out: list) -> None:
    r = (v << 1) if v >= 0 else ((~v) << 1) | 1
    while r >= 32:
        out.append(chr((32 | (r & 31)) + 63))
        r >>= 5
    out.append(chr(r + 63))


def arred(x: float, esc: float) -> int:
    """Arredonda meio para cima; a margem evita que 17,45 guardado como 17,4499… caia para baixo."""
    return math.floor(x * esc + 0.5 + 1e-9)


def enc_col(vals, esc: float) -> str:
    """0 = sem valor; valor v ≥ 0 vira round(v·esc)+1; negativo, round(v·esc) (nunca 0)."""
    out = []
    for x in vals:
        if x is None or (isinstance(x, float) and math.isnan(x)):
            enc_num(0, out)
            continue
        k = arred(x, esc)
        enc_num(k + 1 if k >= 0 else k, out)
    return "".join(out)


def dec_col(s: str, esc: float, n: int) -> list:
    out, i = [], 0
    for _ in range(n):
        r = sh = 0
        while True:
            b = ord(s[i]) - 63
            i += 1
            r |= (b & 31) << sh
            sh += 5
            if b < 32:
                break
        v = ~(r >> 1) if r & 1 else r >> 1
        out.append(None if v == 0 else ((v - 1) / esc if v > 0 else v / esc))
    if i != len(s):
        raise Falha("coluna codificada com sobra")
    return out


def enc_ids(ids) -> str:
    out, ant = [], 0
    for x in ids:
        if x < ant:
            raise Falha("códigos fora de ordem")
        enc_num(x - ant, out)
        ant = x
    return "".join(out)


def enc_g(feicao) -> str:
    """Arcos de uma feição: anéis separados por ',' e polígonos por ';' (código 2i ou 2i+1, em diferenças)."""
    polis, ant = [], 0
    for aneis in feicao:
        rs = []
        for anel in aneis:
            out = []
            for a in anel:
                cod = (a << 1) if a >= 0 else ((~a) << 1) | 1
                enc_num(cod - ant, out)
                ant = cod
            rs.append("".join(out))
        polis.append(",".join(rs))
    return ";".join(polis)


def confere_col(vals, esc, rotulo):
    s = enc_col(vals, esc)
    for a, b in zip(vals, dec_col(s, esc, len(vals))):
        if (a is None) != (b is None) or (a is not None and arred(a, esc) != arred(b, esc)):
            raise Falha(f"{rotulo}: coluna não volta igual ({a} → {b})")
    return s


PREC_PTS = 10 ** 6       # pontos (lojas, setores) em 1/1.000.000 de grau, como nos arquivos intermediários


def enc_pts(pts, prec: int = PREC_PTS) -> str:
    out, px, py = [], 0, 0
    for x, y in pts:
        xi, yi = round(x * prec), round(y * prec)
        enc_num(xi - px, out)
        enc_num(yi - py, out)
        px, py = xi, yi
    return "".join(out)


# ── valores ─────────────────────────────────────────────────────────────────
def valores_censo(o: dict, i: int, esc: dict) -> tuple[dict, dict]:
    """Valores do Censo 2022 de uma unidade (setor, bairro, município, UF ou Brasil)."""
    v, faixa = {}, {}
    pop, area = o["pop"][i], o["area"][i]
    v["pop"], v["dom"], v["area"] = pop, o["dom"][i], area
    v["dens"] = pop / area if area else None
    v["pct_urb"] = 100 * o["pop_urb"][i] / pop if pop else None
    v["pct_fcu"] = 100 * o["pop_fcu"][i] / pop if pop else None
    cp = o["cob"]["pessoas"][i] / pop if pop else 0.0
    cd = o["cob"]["domicilio"][i] / pop if pop else 0.0
    cr = o["cob"]["renda"][i] / pop if pop else 0.0
    v["mor_dom"] = o["mor_dppo"][i] / o["dppo"][i] if o["dppo"][i] and cd >= COB_MIN else None
    v["dom_improv"] = o["dom_improv"][i] if pop and cd >= 0.99995 else None
    v["renda_resp"] = o["renda_num"][i] / o["renda_den"][i] if o["renda_den"][i] and cr >= COB_MIN else None
    ent, mor = o["ent_mor"][i], o["mor_dppo"][i]
    v["cob_entorno"] = min(100.0, 100 * ent / mor) if mor and cd >= COB_MIN else None
    for k, (lo, hi) in ((k, (x[0][i], x[1][i])) for k, x in o["ind"].items() if k in esc):
        if lo is None or hi is None:
            v[k] = None
            continue
        if k in COB_PESSOAS and cp < COB_MIN or k in COB_DOM and cd < COB_MIN or k in COB_ENT and not ent:
            v[k] = None
            continue
        v[k] = (lo + hi) / 2
        if arred(hi, esc[k]) != arred(lo, esc[k]):
            faixa[k] = (lo, hi)
    return v, faixa


def distancia_m(x1, y1, x2, y2) -> float:
    p1, p2 = math.radians(y1), math.radians(y2)
    h = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(x2 - x1) / 2) ** 2
    return 2 * RAIO_TERRA_M * math.asin(math.sqrt(h))


def main() -> int:
    M = json.loads((INTER / "malhas.json").read_text(encoding="utf-8"))
    C = json.loads((INTER / "censo2022.json").read_text(encoding="utf-8"))
    P = json.loads((INTER / "pontos.json").read_text(encoding="utf-8"))
    cs, cb, cm = C["niveis"]["set"], C["niveis"]["bai"], C["niveis"]["mun"]
    if cs["ids"] != M["setor"]["ids"] or cb["ids"] != M["bairro"]["ids"]:
        raise Falha("setores ou bairros diferentes entre a malha e o Censo")
    esc = {c["id"]: c["esc"] for c in CATALOGO}
    ns, nb = len(cs["ids"]), len(cb["ids"])
    conf = {"setores": ns, "bairros": nb, "populacao": cm["pop"][0]}

    # ── cobertura das lojas (cálculo do Atlas) ──────────────────────────────
    lojas = P["lojas"]["itens"]
    rep = M["setor"]["rep"]
    dist = []
    for x, y in rep:
        dist.append(min(distancia_m(x, y, l["x"], l["y"]) for l in lojas))
    pos_b = {c: j for j, c in enumerate(cb["ids"])}
    bai_do_setor = [pos_b[b] for b in M["setor"]["bairro"]]
    pop_s = cs["pop"]
    acc = [[0.0, 0.0, 0, 0] for _ in range(nb)]          # Σ pop·d, Σ pop, pop ≤ 500 m, pop ≤ 1 km
    for i in range(ns):
        a = acc[bai_do_setor[i]]
        a[0] += pop_s[i] * dist[i]
        a[1] += pop_s[i]
        a[2] += pop_s[i] if dist[i] <= 500 else 0
        a[3] += pop_s[i] if dist[i] <= 1000 else 0
    lojas_b = [0] * nb
    for l in lojas:
        lojas_b[pos_b[l["bairro"]]] += 1
    tot = [sum(a[k] for a in acc) for k in range(4)]
    if tot[1] != cm["pop"][0]:
        raise Falha("população dos setores diferente da do município na cobertura das lojas")

    def cob_lojas(j: int | None) -> dict:
        a = tot if j is None else acc[j]
        n = len(lojas) if j is None else lojas_b[j]
        p = cm["pop"][0] if j is None else cb["pop"][j]
        return {"lojas_n": n, "lojas_10mil": 1e4 * n / p if p else None,
                "dist_loja": a[0] / a[1] if a[1] else None,
                "pop_500m": 100 * a[2] / a[1] if a[1] else None,
                "pop_1km": 100 * a[3] / a[1] if a[1] else None}

    # ── valores por nível ───────────────────────────────────────────────────
    def nivel(o: dict, n: int, extra) -> tuple[dict, dict, dict]:
        cols = {c["id"]: [None] * n for c in CATALOGO}
        fx = {}
        for i in range(n):
            v, faixa = valores_censo(o, i, esc)
            v.update(extra(i))
            for k in cols:
                x = v.get(k)
                if x is not None and x == x:
                    cols[k][i] = x
            for k, (lo, hi) in faixa.items():
                fx.setdefault(k, []).append((i, lo, hi))
        return cols, fx

    cols_s, fx_s = nivel(cs, ns, lambda i: {"dist_loja": dist[i]})
    cols_b, fx_b = nivel(cb, nb, cob_lojas)

    def bloco(cols: dict, fx: dict, niv: str, n: int) -> tuple[dict, dict]:
        c, f = {}, {}
        for ind in CATALOGO:
            k = ind["id"]
            if niv not in ind["niv"]:
                continue
            vals = cols[k]
            if all(x is None for x in vals):
                continue
            if ind["u"] == "%":
                fora = [x for x in vals if x is not None and not (-1e-9 <= x <= 100 + 1e-6)]
                if fora:
                    raise Falha(f"{niv} {k}: valor fora de 0 a 100: {fora[:3]}")
            c[k] = confere_col(vals, ind["esc"], f"{niv} {k}")
            if k in fx:
                js = [i for i, _, _ in fx[k]]
                f[k] = [enc_ids(js), confere_col([lo for _, lo, _ in fx[k]], ind["esc"], f"{niv} {k} mínimo"),
                        confere_col([hi for _, _, hi in fx[k]], ind["esc"], f"{niv} {k} máximo")]
        return c, f

    c_s, f_s = bloco(cols_s, fx_s, "set", ns)
    c_b, f_b = bloco(cols_b, fx_b, "bai", nb)

    # referências: Porto Alegre, RS e Brasil
    comp = {}
    for nv, rot in (("mun", "Porto Alegre"), ("uf", "Rio Grande do Sul"), ("br", "Brasil")):
        o = C["niveis"][nv]
        v, faixa = valores_censo(o, 0, esc)
        if nv == "mun":
            v.update(cob_lojas(None))
        comp[nv] = {"nome": rot, "v": {k: (None if v.get(k) is None else round(v[k], 6)) for k in esc
                                       if v.get(k) is not None},
                    "fx": {k: [round(lo, 6), round(hi, 6)] for k, (lo, hi) in faixa.items()}}

    # contagens por setor para o entorno das lojas (mínimo e máximo de numerador e denominador)
    cont = {}
    for k in CONTAGENS:
        NL, NH, DL, DH = cs["cont"][k]
        cont[k] = [confere_col(NL, 1, f"cont {k}"), confere_col(NH, 1, f"cont {k}"),
                   confere_col(DL, 1, f"cont {k}"), confere_col(DH, 1, f"cont {k}")]
    base_set = {
        "renda_num": confere_col(cs["renda_num"], 1, "renda_num"),
        "renda_den": confere_col(cs["renda_den"], 1, "renda_den"),
        "pop_fcu": confere_col(cs["pop_fcu"], 1, "pop_fcu"),
        "cob_p": confere_col(cs["cob"]["pessoas"], 1, "cob_p"),
        "cob_d": confere_col(cs["cob"]["domicilio"], 1, "cob_d"),
        "cob_r": confere_col(cs["cob"]["renda"], 1, "cob_r"),
        "ent_mor": confere_col(cs["ent_mor"], 1, "ent_mor"),
    }

    # ── pontos ──────────────────────────────────────────────────────────────
    pos_s = {c: i for i, c in enumerate(cs["ids"])}

    def camada(itens, campos):
        return {"n": len(itens), "xy": enc_pts([(p["x"], p["y"]) for p in itens]),
                **{k: [p.get(k) for p in itens] for k in campos},
                "s": [pos_s.get(p["setor"], -1) if p.get("setor") else -1 for p in itens]}

    pontos = {
        "lojas": {**camada(lojas, ["cnes", "cnpj", "fantasia", "end", "bairro_cnes", "cep", "tipo", "classe",
                                   "incerteza_m", "dist_cnes_geocodebr_m", "atualizado", "mesmo_end", "perto_50m"]),
                  "b": [pos_b[l["bairro"]] for l in lojas],
                  **{k: P["lojas"][k] for k in ("tipos", "fonte", "competencia", "raiz_cnpj", "empresa")}},
        "saude": {**camada(P["saude"]["itens"], ["cnes", "nome", "tipo", "restrito"]),
                  **{k: P["saude"][k] for k in ("tipos", "fonte", "competencia")}},
        "escolas": {**camada(P["escolas"]["itens"], ["inep", "nome", "tipo"]),
                    **{k: P["escolas"][k] for k in ("tipos", "fonte", "ano")}},
    }
    conf.update({k: P["conferencia"][k] for k in ("lojas_poa", "lojas_por_tipo", "lojas_por_classe",
                                                   "lojas_mesmo_endereco", "lojas_a_menos_de_50m", "lojas_bairros",
                                                   "dimed_cnes_brasil",
                                                   "dimed_poa_desativados", "dimed_poa_outros_tipos", "saude", "escolas",
                                                   "escolas_fora_dos_setores")})
    conf["malha"] = M["conferencia"]
    conf["censo"] = {k: C["conferencia"][k] for k in ("populacao_poa", "populacao_rs", "setores_sem_dado_pessoas",
                                                      "setores_sem_dado_renda", "setores_sem_moradores")}
    conf["cobertura_lojas"] = {k: (round(v, 2) if isinstance(v, float) else v) for k, v in cob_lojas(None).items()}
    conf["bairros_sem_loja"] = sum(1 for n in lojas_b if n == 0)
    conf["bairros_com_loja"] = sum(1 for n in lojas_b if n > 0)

    saida = {
        "v": VERSAO, "gerado_em": dt.date.today().isoformat(), "fontes": FONTES,
        "cats": [{"id": c, "n": n} for c, n in CATS], "catalogo": CATALOGO,
        "prec": M["prec"], "prec_pts": PREC_PTS, "regra": {"cob_min": COB_MIN},
        "set": {"n": ns, "ids": enc_ids(cs["ids"]), "b": bai_do_setor, "rep": enc_pts(rep),
                "arcos": M["setor"]["arcos"], "g": [enc_g(f) for f in M["setor"]["g"]],
                "c": c_s, "fx": f_s, "cont": cont, "base": base_set},
        "bai": {"n": nb, "ids": enc_ids(cb["ids"]), "nomes": M["bairro"]["nomes"],
                "arcos": M["bairro"]["arcos"], "g": [enc_g(f) for f in M["bairro"]["g"]],
                "c": c_b, "fx": f_b,
                "atip": [[j, *a] for j, a in enumerate(cb.get("renda_atipico") or []) if a]},
        "mun": {"arcos": M["mun"]["arcos"], "g": [enc_g(f) for f in M["mun"]["g"]]},
        "comp": comp, "pontos": pontos, "conferencia": conf,
    }
    DADOS.mkdir(parents=True, exist_ok=True)
    destino = DADOS / "poa.js"
    destino.write_text("window.ATLAS_POA=" + json.dumps(saida, ensure_ascii=False, separators=(",", ":")) + ";\n",
                       encoding="utf-8")
    print(json.dumps({k: v for k, v in conf.items() if k not in ("malha", "dimed_poa_desativados")},
                     ensure_ascii=False, indent=1))
    print(f"gravado {destino} ({destino.stat().st_size / 1e6:.2f} MB)")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Falha as e:
        print(f"PAROU: {e}", file=sys.stderr)
        sys.exit(1)
