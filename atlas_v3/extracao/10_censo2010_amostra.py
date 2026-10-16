#!/usr/bin/env python3
"""Gera dados/dados-extracoes.js com a extração do Censo 2010 (amostra) já feita.

    python3 extracao/10_censo2010_amostra.py

Faz o mesmo que o cartão "Censo 2010" de Mais → Extrair dados, que lê o RS.zip do
IBGE, e com o mesmo resultado: 12 indicadores por município e a conferência da
renda de 2010 (achado E3 da auditoria). A diferença é a fonte: aqui os
microdados da amostra vêm na versão que o IPEA publica para o pacote censobr
(releases do repositório ipea/censobr_prep_data no GitHub), com as variáveis e os
códigos originais do IBGE.

O resultado sai no formato das extrações do navegador (um item da central) e é
gravado em dados/dados-extracoes.js. O Atlas aplica esse item ao abrir, como se a
extração tivesse sido feita no navegador; a central mostra o item como "no pacote
do Atlas".

Também confere, com os mesmos microdados, a taxa de escolarização de 6 a 14 anos
que o IBGE Cidades publica para Porto Alegre. Se o cálculo reproduz o número do
IBGE, o indicador entra para os sete municípios.

Conferências que param o script: os sete municípios presentes; a soma dos pesos
igual à população de 2010 de cada município (Atlas Brasil); a mediana da renda
per capita na escala de 2010.

Precisa de pyarrow (pip install pyarrow). O arquivo baixado (820 MB) fica em
extracao/fontes/censobr/ (não versionado) e não é baixado de novo.
"""

from __future__ import annotations

import json
import pathlib
import shutil
import sys
import urllib.request
from datetime import datetime, timezone

RAIZ = pathlib.Path(__file__).resolve().parent.parent          # atlas_v3/
DADOS = RAIZ / "dados"
SAIDA = DADOS / "dados-extracoes.js"
CACHE = RAIZ / "extracao" / "fontes" / "censobr"
RELEASE = "v1.0.0"
ARQUIVO = f"2010_population_{RELEASE}.parquet"
URL = f"https://github.com/ipea/censobr_prep_data/releases/download/{RELEASE}/{ARQUIVO}"
VARS = ["code_muni", "code_state", "V0011", "V0300", "V0010", "V0502", "V0601", "V6036", "V0628", "V6910",
        "V0614", "V0615", "V0616", "V0617", "V0618", "V0657", "V6531", "V6532"]

# os 12 indicadores do cartão do navegador (atlas.js, C10_TAXAS): id, nome, numerador, denominador, categoria
TAXAS = [
    ("c10_desocup_homens", "Taxa de desocupação dos homens", "desoc_h", "pea_h", "trabalho"),
    ("c10_desocup_mulheres", "Taxa de desocupação das mulheres", "desoc_m", "pea_m", "trabalho"),
    ("c10_desocup_18_24", "Taxa de desocupação de 18 a 24 anos", "desoc_18_24", "pea_18_24", "trabalho"),
    ("c10_desocup_25_29", "Taxa de desocupação de 25 a 29 anos", "desoc_25_29", "pea_25_29", "trabalho"),
    ("c10_desocup_30_59", "Taxa de desocupação de 30 a 59 anos", "desoc_30_59", "pea_30_59", "trabalho"),
    ("c10_nem_nem_15_24", "Jovens de 15 a 24 anos que não estudam nem trabalham", "nem_nem", "jovens", "vulner"),
    ("c10_dom_chefia_feminina", "Domicílios chefiados por mulheres", "dom_chefe_mulher", "domicilios", "demografia"),
    ("c10_idosos_sos", "Pessoas de 60 anos ou mais que moram sozinhas", "idosos_sos", "idosos", "vulner"),
    ("c10_deficiencia", "Pessoas com deficiência", "deficiencia", "pop", "saude"),
    ("c10_nao_naturais", "Pessoas que não nasceram no município", "nao_natural", "pop", "demografia"),
    ("c10_pessoas_bolsa", "Pessoas com rendimento do Bolsa Família ou PETI", "pessoas_bolsa", "pop", "assistencia"),
    ("c10_dom_bolsa", "Domicílios com rendimento do Bolsa Família ou PETI", "dom_com_bolsa", "domicilios", "assistencia"),
]
ESCOL_POA_IBGE = 96.69          # IBGE Cidades, Porto Alegre: taxa de escolarização de 6 a 14 anos (no atlas.js, MUN.m_escol)


def falha(msg: str) -> None:
    sys.exit(f"✗ {msg}")


def le_js(nome: str) -> dict:
    p = DADOS / nome
    if not p.exists():
        falha(f"falta {p}: rode o script de dentro do pacote do Atlas")
    t = p.read_text(encoding="utf-8")
    return json.loads(t[t.index("=") + 1:].strip().rstrip(";"))


def baixa() -> pathlib.Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    p = CACHE / ARQUIVO
    if p.exists() and p.stat().st_size > 0:
        return p
    print(f"  baixando {ARQUIVO} (820 MB)…", flush=True)
    tmp = p.with_suffix(".parte")
    try:
        with urllib.request.urlopen(URL, timeout=1800) as r, open(tmp, "wb") as f:
            shutil.copyfileobj(r, f, 1 << 20)
    except Exception as e:                                       # noqa: BLE001
        tmp.unlink(missing_ok=True)
        falha(f"não consegui baixar {URL}: {e}")
    tmp.rename(p)
    return p


def gini(xs: list[float], ws: list[float]) -> float | None:
    """Mesmo cálculo de xtGini no atlas.js (área sob a curva de Lorenz)."""
    o = sorted(range(len(xs)), key=lambda i: xs[i])
    W = sum(ws[i] for i in o)
    X = sum(xs[i] * ws[i] for i in o)
    if not W or not X:
        return None
    cw = cx = g = 0.0
    for i in o:
        nw, nx = cw + ws[i] / W, cx + xs[i] * ws[i] / X
        g += (nw - cw) * (nx + cx)
        cw, cx = nw, nx
    return 1 - g


def main() -> None:
    try:
        import pyarrow as pa
        import pyarrow.compute as pc
        import pyarrow.parquet as pq
    except ImportError:
        falha("precisa do pyarrow: pip install pyarrow")

    N = le_js("dados-nucleo.js")
    cods = [str(c) for c in N["munis"]["ids"]]
    nomes = dict(zip(cods, N["munis"]["nomes"]))
    ipea = le_js("dados-ipea.js")["adh"]
    j10 = ipea["anos"].index(2010)
    pop10 = {c: ipea["valores"]["populacao"][c][j10] for c in cods}
    compl = le_js("dados-complementares.js").get("municipios", {})
    m2010 = N.get("municipal_2010", {})

    p = baixa()
    print("Lendo os microdados da amostra de 2010 (censobr)…")
    f = pq.ParquetFile(p)
    falta = [v for v in VARS if v not in f.schema_arrow.names]
    if falta:
        falha(f"{ARQUIVO} não tem as variáveis {', '.join(falta)}")
    alvo = pa.array([int(c) for c in cods], pa.int32())
    partes = []
    for g in range(f.metadata.num_row_groups):
        t = f.read_row_group(g, columns=VARS)
        t = t.filter(pc.equal(t["code_state"], 43))
        if t.num_rows:
            t = t.filter(pc.is_in(t["code_muni"], value_set=alvo))
        if t.num_rows:
            partes.append(t)
    if not partes:
        falha("os microdados não têm nenhum dos sete municípios")
    linhas = pa.concat_tables(partes).to_pylist()
    idx = {c: i for i, c in enumerate(cods)}
    P = []
    for r in linhas:
        dif = any(r[v] in (1, 2) for v in ("V0614", "V0615", "V0616")) or r["V0617"] == 1
        P.append({"m": idx[str(r["code_muni"])], "ap": str(int(r["V0011"])), "dom": str(r["V0300"]), "w": r["V0010"] or 0,
                  "rel": r["V0502"], "sexo": r["V0601"], "idade": r["V6036"], "freq": r["V0628"], "ocup": r["V6910"],
                  "dif": dif, "nn": r["V0618"] == 3, "bolsa": r["V0657"] == 1, "rpc": r["V6531"], "sm": r["V6532"]})
    print(f"  {len(P):,} pessoas na amostra dos sete municípios".replace(",", "."))

    # conferências do cartão: os sete municípios, a escala da renda e a soma dos pesos
    n_por = [sum(1 for x in P if x["m"] == i) for i in range(len(cods))]
    if not all(n_por):
        falha("faltam municípios nos microdados: " + ", ".join(nomes[c] for c, n in zip(cods, n_por) if not n))
    rendas = sorted(x["rpc"] for x in P if x["rpc"] is not None)
    med = rendas[len(rendas) // 2]
    if not 100 <= med <= 5000:
        falha(f"a mediana da renda per capita (V6531) deu {med}, fora da escala de 2010")
    for i, c in enumerate(cods):
        s = sum(x["w"] for x in P if x["m"] == i)
        if abs(s / pop10[c] - 1) > 0.01:
            falha(f"a soma dos pesos em {nomes[c]} ({s:.0f}) não reproduz a população de 2010 ({pop10[c]})")

    # domicílios particulares: moradores, peso do responsável, chefia e Bolsa Família (como no cartão)
    doms = {}
    for x in P:
        if x["rel"] == 20:
            continue
        d = doms.setdefault(x["ap"] + "|" + x["dom"], {"m": x["m"], "ap": x["ap"], "mor": 0, "peso": None, "chefeM": False, "bolsa": False})
        d["mor"] += 1
        if x["rel"] == 1 and d["peso"] is None:
            d["peso"] = x["w"]
        if x["rel"] == 1 and x["sexo"] == 2:
            d["chefeM"] = True
        if x["bolsa"]:
            d["bolsa"] = True

    def novo():
        return dict.fromkeys(["pea_h", "desoc_h", "pea_m", "desoc_m", "pea_18_24", "desoc_18_24", "pea_25_29", "desoc_25_29",
                              "pea_30_59", "desoc_30_59", "jovens", "nem_nem", "idosos", "idosos_sos", "pop", "deficiencia",
                              "nao_natural", "pessoas_bolsa", "domicilios", "dom_chefe_mulher", "dom_com_bolsa", "n",
                              "esc_6_14", "pop_6_14"], 0.0)

    por_m, por_ap = [novo() for _ in cods], {}

    def soma(o, x, d):
        w, pea, des, priv, ida = x["w"], x["ocup"] in (1, 2), x["ocup"] == 2, x["rel"] != 20, x["idade"]
        o["n"] += 1
        o["pop"] += w
        if pea and x["sexo"] == 1: o["pea_h"] += w
        if des and x["sexo"] == 1: o["desoc_h"] += w
        if pea and x["sexo"] == 2: o["pea_m"] += w
        if des and x["sexo"] == 2: o["desoc_m"] += w
        fx = "18_24" if 18 <= ida <= 24 else "25_29" if 25 <= ida <= 29 else "30_59" if 30 <= ida <= 59 else None
        if fx:
            if pea: o["pea_" + fx] += w
            if des: o["desoc_" + fx] += w
        if 15 <= ida <= 24:
            o["jovens"] += w
            if x["freq"] not in (1, 2) and x["ocup"] != 1:
                o["nem_nem"] += w
        if ida >= 60 and priv:
            o["idosos"] += w
            if d and d["mor"] == 1:
                o["idosos_sos"] += w
        if x["dif"]: o["deficiencia"] += w
        if x["nn"]: o["nao_natural"] += w
        if x["bolsa"]: o["pessoas_bolsa"] += w
        if 6 <= ida <= 14:
            o["pop_6_14"] += w
            if x["freq"] in (1, 2):
                o["esc_6_14"] += w

    for x in P:
        d = None if x["rel"] == 20 else doms.get(x["ap"] + "|" + x["dom"])
        soma(por_m[x["m"]], x, d)
        a = por_ap.setdefault(x["ap"], dict(novo(), m=x["m"]))
        soma(a, x, d)
    for d in doms.values():
        if d["peso"] is None:
            continue
        for o in (por_m[d["m"]], por_ap[d["ap"]]):
            o["domicilios"] += d["peso"]
            if d["chefeM"]: o["dom_chefe_mulher"] += d["peso"]
            if d["bolsa"]: o["dom_com_bolsa"] += d["peso"]

    def taxa(o, a, b):
        return 100 * o[a] / o[b] if o[b] > 0 else None

    # taxa de escolarização de 6 a 14 anos: reproduz o IBGE Cidades em Porto Alegre?
    escol = {c: round(taxa(por_m[i], "esc_6_14", "pop_6_14"), 2) for i, c in enumerate(cods)}
    escol_ok = abs(escol["4314902"] - ESCOL_POA_IBGE) < 0.005
    print(f"  escolarização de 6 a 14 anos em Porto Alegre: {escol['4314902']} (IBGE Cidades: {ESCOL_POA_IBGE}) "
          + ("— reproduz; entra para os sete" if escol_ok else "— não reproduz; fica de fora"))

    obs = ("Censo 2010, amostra: {a} ÷ {b}, com o peso amostral (V0010), somando todos os registros do município. "
           "Mesmo cálculo do cartão Censo 2010 da central de extração e do script extracao/R/01_censo2010_areas_ponderacao.R. "
           "Cálculo do Atlas sobre os microdados do IBGE, na versão do pacote censobr (IPEA).")
    indicadores = [{"id": i, "cat": cat, "n": n, "u": "%", "fmt": "pct1", "ramp": "brasa", "niveis": ["municipio"], "status": "est",
                    "obs": obs.format(a=a, b=b)} for i, n, a, b, cat in TAXAS]
    valores = {"municipio": {c: {} for c in cods}}
    for i, c in enumerate(cods):
        for ident, _, a, b, _ in TAXAS:
            v = taxa(por_m[i], a, b)
            if v is not None:
                valores["municipio"][c][ident] = round(v, 2)
    if escol_ok:
        indicadores.append({"id": "m_escol", "cat": "educacao", "n": "Taxa de escolarização de 6 a 14 anos", "u": "%", "fmt": "pct2",
                            "ramp": "agua", "niveis": ["municipio"], "status": "ok", "ano": 2010,
                            "obs": "Pessoas de 6 a 14 anos que frequentam escola ou creche ÷ pessoas de 6 a 14 anos, com o peso amostral, "
                                   "no Censo 2010. Reproduz o número que o IBGE Cidades publica para Porto Alegre "
                                   f"({str(ESCOL_POA_IBGE).replace('.', ',')}%), que é de 2010 e não de 2022, como o Atlas dizia até a versão 3.7."})
        for c in cods:
            valores["municipio"][c]["m_escol"] = escol[c]

    # conferência E3: três versões da renda (como no cartão e no extracao/R/11_confere_renda_2010.R)
    versoes = {"A": lambda x: True, "B": lambda x: x["rpc"] is not None,
               "C": lambda x: x["rpc"] is not None and x["rel"] not in (17, 18, 19)}
    E3 = []
    for i, c in enumerate(cods):
        muni = [x for x in P if x["m"] == i]
        for v, filtro in versoes.items():
            g = [x for x in muni if filtro(x)]
            W = sum(x["w"] for x in g)
            rpc = lambda x: 0 if x["rpc"] is None else x["rpc"]                 # noqa: E731
            sm = lambda x: x["sm"] if x["sm"] is not None else rpc(x) / 510     # noqa: E731
            pc_ = lambda t: 100 * sum(x["w"] for x in g if t(x)) / W if W else None  # noqa: E731
            E3.append({"cod": c, "versao": v, "meio_lt": pc_(lambda x: sm(x) < 0.5), "meio_le": pc_(lambda x: sm(x) <= 0.5),
                       "quarto_lt": pc_(lambda x: sm(x) < 0.25), "quarto_le": pc_(lambda x: sm(x) <= 0.25),
                       "ate140": pc_(lambda x: rpc(x) <= 140), "ate70": pc_(lambda x: rpc(x) <= 70),
                       "renda": sum(x["w"] * rpc(x) for x in g) / W if W else None,
                       "gini": gini([rpc(x) for x in g], [x["w"] for x in g])})
    # veredito (como xtVeredito): qual versão chega mais perto de cada número do Atlas e do Atlas Brasil
    testes = [("Atlas", "pobreza (½ salário mínimo)", lambda c: m2010.get(c, {}).get("pct_pobreza"), ["meio_lt", "meio_le"]),
              ("Atlas", "extrema pobreza (¼ de salário mínimo)", lambda c: m2010.get(c, {}).get("pct_extrema_pobreza"), ["quarto_lt", "quarto_le"]),
              ("Atlas", "renda per capita média", lambda c: m2010.get(c, {}).get("rdpc_media"), ["renda"]),
              ("Atlas", "Gini", lambda c: m2010.get(c, {}).get("gini_rdpc"), ["gini"]),
              ("Atlas Brasil", "vulneráveis à pobreza (até R$ 255)", lambda c: compl.get(c, {}).get("adh_vulner_pobreza"), ["meio_le"]),
              ("Atlas Brasil", "pobres (até R$ 140)", lambda c: compl.get(c, {}).get("adh_pobreza"), ["ate140"]),
              ("Atlas Brasil", "extremamente pobres (até R$ 70)", lambda c: compl.get(c, {}).get("adh_extrema_pobreza"), ["ate70"]),
              ("Atlas Brasil", "renda per capita", lambda c: compl.get(c, {}).get("adh_renda_pc"), ["renda"]),
              ("Atlas Brasil", "Gini", lambda c: compl.get(c, {}).get("adh_gini"), ["gini"])]
    veredito = []
    for quem, o, ref, campos in testes:
        melhor = None
        for v in "ABC":
            for k in campos:
                ds = [abs(r[k] - ref(r["cod"])) for r in E3 if r["versao"] == v and ref(r["cod"]) is not None and r[k] is not None]
                if len(ds) < 5:
                    continue
                m = sum(ds) / len(ds)
                if melhor is None or m < melhor["dif"]:
                    melhor = {"versao": v, "campo": k, "dif": m}
        if melhor:
            veredito.append({"quem": quem, "o": o, "melhor": melhor})

    ap = [["codigo_municipio", "municipio", "area_ponderacao", "registros"] + [t[0] for t in TAXAS]]
    for cod_ap, o in sorted(por_ap.items()):
        ap.append([cods[o["m"]], nomes[cods[o["m"]]], cod_ap, int(o["n"])]
                  + [("" if taxa(o, a, b) is None else round(taxa(o, a, b), 2)) for _, _, a, b, _ in TAXAS])

    quando = datetime.now(timezone.utc).isoformat(timespec="seconds")
    item = {"id": "censo2010_amostra", "titulo": "Censo 2010, amostra: novos recortes e conferência da renda", "ano": 2010,
            "status": "est", "origem": f"{ARQUIVO} (censobr, IPEA)", "quando": quando, "pacote": True,
            "fonte": {"n": "IBGE — Censo 2010, amostra (cálculo do Atlas sobre os microdados)", "s": "Censo 2010",
                      "u": URL,
                      "d": "Microdados da amostra do Censo Demográfico 2010 (IBGE), na versão publicada pelo IPEA para o pacote censobr, "
                           "com as variáveis e os códigos originais do IBGE. Calculado por extracao/10_censo2010_amostra.py."},
            "indicadores": indicadores, "valores": valores, "e3": {"linhas": E3, "veredito": veredito}, "ap": ap,
            "resumo": f"{len(P):,} pessoas na amostra; {len(TAXAS)} indicadores por município".replace(",", ".")
                      + (", a escolarização de 6 a 14 anos" if escol_ok else "") + " e a conferência da renda (achado E3)"}

    # o pacote pode ter itens de outros scripts: troca só este (mesmo id) e mantém os demais
    pacote = []
    if SAIDA.exists():
        t = SAIDA.read_text(encoding="utf-8")
        k = t.find("window.ATLAS_PACOTE=")
        if k >= 0:
            pacote = [i for i in json.loads(t[k + len("window.ATLAS_PACOTE="):].strip().rstrip(";")) if i.get("id") != item["id"]]
    pacote.append(item)
    SAIDA.write_text("// Gerado por extracao/10_censo2010_amostra.py. Não edite à mão: rode o script de novo.\n"
                     "// Extrações já feitas que o Atlas aplica ao abrir, no formato da central de extração.\n"
                     f"window.ATLAS_PACOTE={json.dumps(pacote, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    print(f"Gravado {SAIDA.relative_to(RAIZ)} ({len(pacote)} item(ns) no pacote): {len(indicadores)} indicadores, {len(por_ap)} áreas de ponderação, "
          f"{SAIDA.stat().st_size // 1024} KB")
    print("\nIndicadores por município (%):")
    print(f"  {'':<44}" + "".join(f"{nomes[c][:9]:>10}" for c in cods))
    for ident, n, *_ in TAXAS:
        print(f"  {n[:44]:<44}" + "".join(f"{valores['municipio'][c].get(ident, float('nan')):>10.2f}" for c in cods))
    print("\nConferência da renda de 2010 (E3): versão mais próxima e diferença média nos sete")
    for t in veredito:
        m = t["melhor"]
        print(f"  {t['quem']:<13} {t['o']:<38} versão {m['versao']} ({m['campo']}), diferença média {m['dif']:.4f}")


if __name__ == "__main__":
    main()
