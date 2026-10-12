#!/usr/bin/env python3
"""Gera dados-ipea.js com dados do IPEA, a partir do espelho público da Base dos Dados.

    python3 extracao/6_ipea.py

Duas bases, ambas no espelho gratuito da Base dos Dados (sem conta):

1. Atlas do Desenvolvimento Humano no Brasil (PNUD, IPEA e Fundação João
   Pinheiro), tabela mundo_onu_adh.municipio. Traz os Censos de 1991, 2000 e
   2010. Entram a série de 1991 a 2010 de indicadores-chave dos sete
   municípios e indicadores de 2010 que o Atlas ainda não tinha. Os valores de
   renda estão em reais de agosto de 2010 nos três anos, como o Atlas Brasil
   publica.

2. Projeto Acesso a Oportunidades (IPEA), tabela
   br_ipea_acesso_oportunidades.indicadores_2019: acesso a empregos, saúde e
   escolas por hexágono (H3, resolução 9), em 2019, a pé, de bicicleta e de
   transporte público. Das sete cidades do Atlas, só Porto Alegre está no
   projeto.

   Conferência da tabela, refeita a cada execução (o script para se falhar):
   - os indicadores cumulativos (CMA) vêm em porcentagem, de 0 a 100, e são
     monótonos: o acesso em 30 minutos nunca é menor que o acesso em 15;
   - o tempo mínimo (TMI) vem MULTIPLICADO POR 100 na tabela da Base dos
     Dados. Dividido por 100, concorda com os CMA em todos os testes: quem
     alcança um equipamento em 15 minutos tem tempo mínimo de até 15, e quem
     não alcança nenhum em 60 tem tempo mínimo acima de 60. Sem a divisão,
     só 4.810 dos 73.449 testes concordam (outubro de 2026). Se a Base dos Dados
     corrigir a tabela, o teste deixa de passar com a divisão e o script para,
     em vez de dividir de novo.

   Atribuição ao território: cada setor de 2022 recebe o valor do hexágono que
   contém o seu ponto representativo (o mesmo do dados-setores.js). O bairro
   recebe a média dos setores ponderada pela população de 2022. É o mesmo
   método dos indicadores de 2010 por área de ponderação.

   Cobertura: a grade de 2019 do IPEA não alcança 134 dos 2.744 setores de
   2022 (61 mil pessoas), quase todos na periferia: extremo sul, zona leste e
   ilhas (Restinga, Lomba do Pinheiro, Belém Novo, Arquipélago). Esses setores ficam sem
   valor, e o bairro só recebe valor quando os setores cobertos somam ao menos
   metade da sua população (COBERTURA_MINIMA).

O script não estima, não interpola e não completa. Setor cujo ponto cai fora
da grade do IPEA fica sem valor. O tempo "inf" (nenhum equipamento alcançável
dentro do limite de cálculo do IPEA) não entra em média de minutos; entra só
na proporção da população a mais de 30 minutos, onde é contado como acima.

Precisa de `pandas`.
"""

from __future__ import annotations

import json
import math
import pathlib
import shutil
import sys
import urllib.request

import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parents[1]
DADOS = ROOT / "dados"
FONTES = ROOT / "extracao" / "fontes"
BUCKET = "https://storage.googleapis.com/basedosdados-public/one-click-download"

MUNICIPIOS = {
    "4314902": "Porto Alegre",
    "4304606": "Canoas",
    "4309209": "Gravataí",
    "4320008": "Sapucaia do Sul",
    "4303103": "Cachoeirinha",
    "4309308": "Guaíba",
    "4307708": "Esteio",
}
POA = "4314902"

TABELAS = {
    "adh": ("mundo_onu_adh", "municipio"),
    "aop": ("br_ipea_acesso_oportunidades", "indicadores_2019"),
}

# Atlas Brasil: coluna da Base dos Dados -> (mínimo, máximo) aceitos.
# O catálogo do atlas.js dá nome, unidade e definição de cada uma.
ANOS_ADH = ("1991", "2000", "2010")
COLUNAS_ADH = {
    "idhm": (0, 1), "idhm_e": (0, 1), "idhm_l": (0, 1), "idhm_r": (0, 1),
    "expectativa_vida": (40, 95),
    "mortalidade_1": (0, 200), "mortalidade_5": (0, 250),
    "renda_pc": (0, 20000),
    "indice_gini": (0, 1), "indice_theil": (0, 2),
    "razao_10_ricos_40_pobres": (0, 200), "prop_renda_20_pobres": (0, 100),
    "prop_pobreza": (0, 100), "prop_pobreza_extrema": (0, 100),
    "prop_pobreza_criancas": (0, 100), "prop_pobreza_extrema_criancas": (0, 100),
    "prop_vulner_pobreza": (0, 100),
    "taxa_analfabetismo_15_mais": (0, 100),
    "expectativa_anos_estudo": (0, 20),
    "taxa_fundamental_18_mais": (0, 100), "taxa_medio_18_20": (0, 100),
    "taxa_criancas_fora_escola_6_14": (0, 100), "taxa_atraso_2_fundamental": (0, 100),
    "prop_ocupados_formalizacao": (0, 100), "taxa_desocupacao_18_mais": (0, 100),
    "taxa_agua_esgoto_inadequados": (0, 100), "taxa_densidade_2_mais": (0, 100),
    "taxa_sem_fund_informal": (0, 100), "taxa_criancas_dom_sem_fund": (0, 100),
    "taxa_mulheres_com_filho_10_14": (0, 100),
    # população recenseada: a central de extração do Atlas confere com ela a
    # soma dos pesos da amostra de 2010 que o usuário carregar
    "populacao": (10_000, 3_000_000),
}

# Acesso a Oportunidades: id no Atlas -> (modo, horário de pico, coluna, tipo)
# Pico = 1 (manhã de dia útil). tipo "cma": % das oportunidades da cidade;
# tipo "tmi": minutos até a mais próxima.
AOP = {
    "aop_emprego_tp60": ("tp", "1", "CMATT60", "cma"),
    "aop_saude_pe": ("caminhada", "1", "TMISB", "tmi"),
    "aop_infantil_pe": ("caminhada", "1", "TMIEI", "tmi"),
    "aop_fundamental_pe": ("caminhada", "1", "TMIEF", "tmi"),
}
# proporção da população a mais de LIMITE minutos a pé (o "inf" conta como acima)
AOP_ACIMA = {
    "aop_saude_30pe": "aop_saude_pe",
    "aop_infantil_30pe": "aop_infantil_pe",
}
LIMITE = 30
COBERTURA_MINIMA = 0.5   # parte da população do bairro em setores com valor
GRUPOS_CMA = ["TT", "TQ", "TD", "ST", "SB", "SM", "SA", "ET", "EI", "EF", "EM"]
LIMIARES = [15, 30, 45, 60, 90, 120]
ESCALA = 100   # duas casas decimais nos valores por setor


# --------------------------------------------------------------- utilidades
def baixa(chave: str) -> pathlib.Path:
    base, tabela = TABELAS[chave]
    destino = FONTES / "basedosdados" / f"{base}__{tabela}.csv.gz"
    if destino.exists() and destino.stat().st_size > 0:
        return destino
    destino.parent.mkdir(parents=True, exist_ok=True)
    url = f"{BUCKET}/{base}/{tabela}/{tabela}.csv.gz"
    assert "_bdpro" not in url
    print(f"  ↓ {url}")
    tmp = destino.with_suffix(".parcial")
    with urllib.request.urlopen(url, timeout=900) as r, open(tmp, "wb") as f:
        shutil.copyfileobj(r, f)
    tmp.rename(destino)
    return destino


def numero(v: object) -> float | None:
    """None para vazio; math.inf para 'inf' (o IPEA usa para 'não alcança')."""
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    s = str(v).strip().lower()
    if s in {"", "nan", "none", "na"}:
        return None
    if s in {"inf", "+inf", "infinity"}:
        return math.inf
    return float(s)


def para(msg: str) -> None:
    sys.exit(f"✗ {msg}")


def le_js(nome: str) -> dict:
    texto = (DADOS / nome).read_text(encoding="utf-8").strip()
    return json.loads(texto[texto.index("=") + 1:].rstrip(";"))


# decodificadores: os mesmos do atlas.js (decCol, decDic, decPts)
def _varints(s: str):
    i = 0
    while i < len(s):
        r = sh = 0
        while True:
            b = ord(s[i]) - 63
            i += 1
            r |= (b & 31) << sh
            sh += 5
            if b < 32:
                break
        yield ~(r >> 1) if r & 1 else r >> 1


def dec_col(s: str, escala: float, n: int) -> list:
    out = []
    for v in _varints(s):
        out.append(None if v == 0 else (v - 1) / escala)
        if len(out) == n:
            break
    return out


def dec_dic(s: str, dic: list | None, n: int) -> list:
    out = []
    for v in _varints(s):
        out.append((dic[v - 1] if v > 0 else "") if dic is not None else v)
        if len(out) == n:
            break
    return out


def dec_pts(s: str, prec: float, n: int) -> list:
    it = _varints(s)
    x = y = 0
    out = []
    for _ in range(n):
        x += next(it)
        y += next(it)
        out.append((x / prec, y / prec))
    return out


def zigzag(v: int) -> str:
    v = ~(v << 1) if v < 0 else v << 1
    out = []
    while v >= 0x20:
        out.append(chr((0x20 | (v & 0x1F)) + 63))
        v >>= 5
    out.append(chr(v + 63))
    return "".join(out)


def cod_col(valores: list, escala: int = ESCALA) -> str:
    """Inverso do decCol(): valor -> round(valor*escala)+1; 0 = sem dado."""
    return "".join(zigzag(0 if v is None else round(v * escala) + 1) for v in valores)


# ------------------------------------------------------------- Atlas Brasil
def atlas_brasil() -> dict:
    df = pd.read_csv(baixa("adh"), dtype=str)
    falta = [c for c in ["ano", "id_municipio", *COLUNAS_ADH] if c not in df.columns]
    if falta:
        para(f"Atlas Brasil: faltam as colunas {falta}")
    df = df[df["id_municipio"].isin(MUNICIPIOS) & df["ano"].isin(ANOS_ADH)]
    valores: dict[str, dict[str, list]] = {c: {} for c in COLUNAS_ADH}
    for cod in MUNICIPIOS:
        for i, ano in enumerate(ANOS_ADH):
            linha = df[(df["id_municipio"] == cod) & (df["ano"] == ano)]
            if len(linha) != 1:
                para(f"Atlas Brasil {ano}: {len(linha)} linhas para {MUNICIPIOS[cod]}")
            for col, (lo, hi) in COLUNAS_ADH.items():
                v = numero(linha.iloc[0][col])
                if v is not None and not (lo <= v <= hi):
                    para(f"Atlas Brasil {ano}, {MUNICIPIOS[cod]}: {col} = {v} fora de [{lo}, {hi}]")
                if ano == "2010" and v is None:
                    para(f"Atlas Brasil 2010, {MUNICIPIOS[cod]}: {col} sem valor")
                valores[col].setdefault(cod, [None, None, None])[i] = v
    sem_serie = [c for c in COLUNAS_ADH if any(v[0] is None or v[1] is None for v in valores[c].values())]
    print(f"Atlas Brasil: {len(COLUNAS_ADH)} indicadores, 1991–2010, sete municípios")
    if sem_serie:
        print(f"  sem valor em 1991 ou 2000 (só 2010 no gráfico): {sem_serie}")
    return {"anos": [int(a) for a in ANOS_ADH], "valores": valores,
            "fonte": "Atlas do Desenvolvimento Humano no Brasil (PNUD, IPEA e FJP), via Base dos Dados",
            "tabela": "mundo_onu_adh.municipio"}


# ---------------------------------------------------- Acesso a Oportunidades
def poligono_wkt(w: str) -> list[tuple[float, float]]:
    w = w.strip()
    if not w.upper().startswith("POLYGON"):
        para(f"Acesso a Oportunidades: geometria inesperada: {w[:40]}")
    corpo = w[w.index("((") + 2:w.index(")")]
    return [tuple(map(float, p.split())) for p in corpo.split(",")]


def dentro(x: float, y: float, anel: list) -> bool:
    d = False
    j = len(anel) - 1
    for i in range(len(anel)):
        xi, yi = anel[i]
        xj, yj = anel[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            d = not d
        j = i
    return d


def confere_aop(df: pd.DataFrame) -> dict:
    """Testes da tabela. Devolve as contagens para gravar junto com os dados."""
    conf = {"hexagonos": int(df["id_grid_h3"].nunique())}
    viol = 0
    maximo = 0.0
    for _, r in df.iterrows():
        for g in GRUPOS_CMA:
            seq = [numero(r[f"CMA{g}{t}"]) for t in LIMIARES]
            seq = [v for v in seq if v is not None]
            if seq:
                maximo = max(maximo, max(seq))
            if any(b < a - 1e-9 for a, b in zip(seq, seq[1:])):
                viol += 1
    if viol:
        para(f"Acesso a Oportunidades: {viol} séries de CMA não monótonas")
    if maximo > 100.0001:
        para(f"Acesso a Oportunidades: CMA acima de 100 ({maximo}); a unidade mudou")
    conf["cma_series_nao_monotonas"] = 0
    conf["cma_maximo"] = round(maximo, 2)

    def coerencia(divisor: float) -> tuple[int, int]:
        ok = mal = 0
        for _, r in df.iterrows():
            curto = 15 if r["modo_transporte"] in ("caminhada", "bicicleta") else 30
            for g in ["ST", "SB", "SM", "SA", "ET", "EI", "EF", "EM"]:
                t = numero(r[f"TMI{g}"])
                if t is None or math.isinf(t):
                    continue
                t /= divisor
                c_curto, c60 = numero(r[f"CMA{g}{curto}"]), numero(r[f"CMA{g}60"])
                if c_curto and c_curto > 0:
                    ok += t <= curto
                    mal += t > curto
                elif c60 == 0:
                    ok += t > 60
                    mal += t <= 60
        return ok, mal

    ok100, mal100 = coerencia(100)
    ok1, mal1 = coerencia(1)
    if mal100 or not ok100:
        para(f"Acesso a Oportunidades: TMI ÷ 100 incoerente em {mal100} de {ok100 + mal100} testes. "
             "A tabela mudou; confira a unidade antes de usar.")
    conf["tmi_testes"] = ok100 + mal100
    conf["tmi_coerentes_div100"] = ok100
    conf["tmi_coerentes_sem_divisao"] = ok1
    print(f"  CMA: {conf['hexagonos']} hexágonos, nenhuma série fora de ordem, máximo {conf['cma_maximo']}")
    print(f"  TMI: ÷100 coerente em {ok100}/{ok100 + mal100} testes; sem divisão, {ok1}/{ok1 + mal1}")
    return conf


def acesso_oportunidades(setores: dict, bairros: dict) -> dict:
    cols = ["id_municipio", "id_grid_h3", "geometria", "modo_transporte", "horario_pico"]
    cols += [f"CMA{g}{t}" for g in GRUPOS_CMA for t in LIMIARES]
    cols += [f"TMI{g}" for g in ["ST", "SB", "SM", "SA", "ET", "EI", "EF", "EM"]]
    df = pd.read_csv(baixa("aop"), dtype=str)
    falta = [c for c in cols if c not in df.columns]
    if falta:
        para(f"Acesso a Oportunidades: faltam as colunas {falta}")
    df = df[df["id_municipio"] == POA][cols]
    if df.empty:
        para("Acesso a Oportunidades: Porto Alegre não está na tabela")
    print(f"Acesso a Oportunidades: {len(df)} linhas de Porto Alegre")
    conf = confere_aop(df)

    # grade: hexágono -> polígono, com índice por célula de 0,01 grau
    hexes: dict[str, list] = {}
    for _, r in df.drop_duplicates("id_grid_h3").iterrows():
        hexes[r["id_grid_h3"]] = poligono_wkt(r["geometria"])
    cel = 0.01
    indice: dict[tuple, list] = {}
    for h, anel in hexes.items():
        xs = [p[0] for p in anel]
        ys = [p[1] for p in anel]
        for cx in range(int(math.floor(min(xs) / cel)), int(math.floor(max(xs) / cel)) + 1):
            for cy in range(int(math.floor(min(ys) / cel)), int(math.floor(max(ys) / cel)) + 1):
                indice.setdefault((cx, cy), []).append(h)

    def hex_de(x: float, y: float) -> str | None:
        achados = [h for h in indice.get((int(math.floor(x / cel)), int(math.floor(y / cel))), [])
                   if dentro(x, y, hexes[h])]
        if len(achados) > 1:
            para(f"ponto ({x}, {y}) em {len(achados)} hexágonos")
        return achados[0] if achados else None

    # valor de cada hexágono para cada indicador
    por_hex: dict[str, dict[str, float | None]] = {k: {} for k in AOP}
    for k, (modo, pico, col, tipo) in AOP.items():
        sub = df[(df["modo_transporte"] == modo) & (df["horario_pico"] == pico)]
        if sub["id_grid_h3"].duplicated().any():
            para(f"Acesso a Oportunidades: hexágono repetido em {modo}/{pico}")
        for _, r in sub.iterrows():
            v = numero(r[col])
            if v is not None and not math.isinf(v) and tipo == "tmi":
                v = v / 100          # ver a conferência no cabeçalho
            por_hex[k][r["id_grid_h3"]] = v

    n = len(setores["codigo"])
    valores = {k: [None] * n for k in AOP}
    acima = {k: [None] * n for k in AOP_ACIMA}
    fora = pop_fora = 0
    infs = {k: 0 for k in AOP if AOP[k][3] == "tmi"}
    for i in range(n):
        if setores["muni"][i] != 0:            # só Porto Alegre está no projeto
            continue
        x, y = setores["cent"][i]
        h = hex_de(x, y)
        if h is None:
            fora += 1
            pop_fora += setores["pop"][i] or 0
            continue
        for k in AOP:
            v = por_hex[k].get(h)
            if v is not None and math.isinf(v):
                infs[k] += 1
            valores[k][i] = None if v is None or math.isinf(v) else round(v, 2)
        for k, base in AOP_ACIMA.items():
            v = por_hex[base].get(h)
            acima[k][i] = None if v is None else (1 if math.isinf(v) or v > LIMITE else 0)
    poa = [i for i in range(n) if setores["muni"][i] == 0]
    pop_poa = sum(setores["pop"][i] or 0 for i in poa)
    conf["setores_poa"] = len(poa)
    conf["setores_fora_da_grade"] = fora
    conf["pop_fora_da_grade"] = int(pop_fora)
    conf["pop_coberta_pct"] = round(100 * (1 - pop_fora / pop_poa), 2) if pop_poa else None
    conf["setores_sem_equipamento_no_limite"] = infs
    print(f"  setores de Porto Alegre: {len(poa)}; fora da grade do IPEA: {fora} ({int(pop_fora)} pessoas)")

    # bairros: média ponderada pela população; proporção acima do limite
    nb = len(bairros["nomes"])
    idx_bairro = {(bairros["muni_id"][j], bairros["nomes"][j]): j for j in range(nb)}
    soma = {k: [0.0] * nb for k in list(AOP) + list(AOP_ACIMA)}
    peso = {k: [0.0] * nb for k in list(AOP) + list(AOP_ACIMA)}
    pop_bairro = [0.0] * nb
    pop_coberta = [0.0] * nb
    sem_bairro = 0
    for i in poa:
        j = idx_bairro.get((0, setores["bairro"][i]))
        if j is None:
            sem_bairro += 1
            continue
        p = setores["pop"][i] or 0
        pop_bairro[j] += p
        if valores["aop_emprego_tp60"][i] is not None or any(acima[k][i] is not None for k in AOP_ACIMA):
            pop_coberta[j] += p
        for k in AOP:
            if valores[k][i] is not None and p:
                soma[k][j] += valores[k][i] * p
                peso[k][j] += p
        for k in AOP_ACIMA:
            if acima[k][i] is not None and p:
                soma[k][j] += acima[k][i] * p
                peso[k][j] += p
    if sem_bairro:
        print(f"  ! {sem_bairro} setores de Porto Alegre sem bairro: ficam fora da média do bairro")
    cobertura = [round(100 * pop_coberta[j] / pop_bairro[j], 1) if pop_bairro[j] else None for j in range(nb)]
    baixa_cob = [bairros["nomes"][j] for j in range(nb)
                 if cobertura[j] is not None and cobertura[j] < 100 * COBERTURA_MINIMA]
    por_bairro = {}
    for k in soma:
        fator = 100 if k in AOP_ACIMA else 1
        por_bairro[k] = [round(fator * soma[k][j] / peso[k][j], 2)
                         if peso[k][j] and cobertura[j] is not None and cobertura[j] >= 100 * COBERTURA_MINIMA
                         else None for j in range(nb)]
    conf["bairros_sem_valor_por_cobertura"] = baixa_cob
    print(f"  bairros com menos de {int(100 * COBERTURA_MINIMA)}% da população coberta (ficam sem valor): {baixa_cob}")

    # Porto Alegre inteira, com o mesmo critério
    municipio = {}
    for k in AOP:
        s = w = 0.0
        for i in poa:
            p = setores["pop"][i] or 0
            if valores[k][i] is not None and p:
                s += valores[k][i] * p
                w += p
        municipio[k] = round(s / w, 2) if w else None
    for k in AOP_ACIMA:
        s = w = 0.0
        for i in poa:
            p = setores["pop"][i] or 0
            if acima[k][i] is not None and p:
                s += acima[k][i] * p
                w += p
        municipio[k] = round(100 * s / w, 2) if w else None
    print("  Porto Alegre:", municipio)

    return {
        "fonte": "IPEA, Projeto Acesso a Oportunidades, via Base dos Dados",
        "tabela": "br_ipea_acesso_oportunidades.indicadores_2019",
        "ano": 2019, "limite_min": LIMITE, "escala": ESCALA,
        "setor": {k: cod_col(valores[k]) for k in AOP},
        "setor_acima": {k: cod_col(acima[k], 1) for k in AOP_ACIMA},
        "bairro": por_bairro,
        "cobertura_bairro": cobertura,
        "municipio": {POA: municipio},
        "conferencia": conf,
    }


def setores_do_atlas() -> tuple[dict, dict]:
    nucleo, setores, bairros = le_js("dados-nucleo.js"), le_js("dados-setores.js"), le_js("dados-bairros.js")
    n = len(setores["geom"])
    escala = dict(zip(nucleo["campos"], nucleo["escalas"]))
    sufixo = dec_dic(setores["ids"], None, n)
    muni = dec_dic(setores["m"], None, n)
    pref = [str(c) for c in nucleo["munis"]["ids"]]
    s = {
        "codigo": [pref[m] + str(sfx).zfill(8) for m, sfx in zip(muni, sufixo)],
        "muni": muni,
        "bairro": dec_dic(setores["bairro"], setores["bairro_dic"], n),
        "cent": dec_pts(setores["cent"], nucleo["prec"], n),
        "pop": dec_col(setores["valores"]["pop"], escala["pop"], n),
    }
    return s, bairros


def main() -> None:
    setores, bairros = setores_do_atlas()
    saida = {
        "gerado_em": pd.Timestamp.now().strftime("%Y-%m-%d"),
        "adh": atlas_brasil(),
        "aop": acesso_oportunidades(setores, bairros),
    }
    destino = DADOS / "dados-ipea.js"
    destino.write_text("window.ATLAS_IPEA=" + json.dumps(saida, ensure_ascii=False, separators=(",", ":")) + ";\n",
                       encoding="utf-8")
    print(f"{destino}: {destino.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
