#!/usr/bin/env python3
"""Gera dados/dados-censo2022.js: campos do Censo 2022 por setor que faltavam no Atlas.

    python3 extracao/9_censo2022_setores.py

Lê os agregados por setor do Censo 2022 (IBGE) na forma em que o IPEA os publica
para o pacote censobr (arquivos Parquet nas releases do repositório
ipea/censobr_prep_data no GitHub). Entra o que o catálogo do Atlas já previa e
estava sem dado, mais o entorno dos domicílios (item B3 dos dados faltantes):

- tipo de domicílio: casa de vila ou em condomínio, casa de cômodos ou cortiço,
  estrutura degradada ou inacabada; domicílios particulares e coletivos;
- banheiro de uso comum e só sanitário ou buraco; água que não chega encanada;
- óbitos de homens e de mulheres (janeiro de 2019 a julho de 2022);
- entorno: moradores em ruas com pavimentação, iluminação pública, calçada,
  rampa para cadeirante, árvores, bueiro, ponto de ônibus, via sinalizada para
  bicicleta e calçada com obstáculo.

Antes de gravar, o script confere os setores com o próprio pacote do Atlas: a
população, os domicílios, a área, as casas, os apartamentos, a rede de água, o
banheiro e os óbitos de cada um dos 4.722 setores têm de ser iguais aos que o
Atlas já tem. Se a fonte mudar, ele para e diz onde.

Regras (as do Atlas: não estimar, não completar):
- Setor em que o IBGE omitiu o valor (sigilo) fica sem valor.
- Bairro e município somam os setores com valor; quando algum setor com
  moradores ficou sem valor, a soma é parcial e o Atlas avisa quantos.
- Componente omitido entra como zero só nas somas que o Atlas já fazia assim
  (domicílios precários, óbitos), como no pacote original.

Precisa de pyarrow (pip install pyarrow). Os arquivos baixados ficam em
extracao/fontes/censobr/ (não versionados) e não são baixados de novo.
"""

from __future__ import annotations

import json
import pathlib
import shutil
import sys
import urllib.request
from datetime import date

RAIZ = pathlib.Path(__file__).resolve().parent.parent          # atlas_v3/
DADOS = RAIZ / "dados"
SAIDA = DADOS / "dados-censo2022.js"
CACHE = RAIZ / "extracao" / "fontes" / "censobr"
RELEASE = "v1.0.0"
URL = "https://github.com/ipea/censobr_prep_data/releases/download/" + RELEASE + "/{}"
ARQ = {k: f"2022_tracts_{k}_{RELEASE}.parquet" for k in ("basico", "domicilio", "obitos", "entorno")}

# campo do Atlas -> (arquivo, colunas somadas). Uma coluna só: valor omitido fica omitido.
CAMPOS = {
    "dom_part":      ("basico", ["V0003"]),
    "dom_colet":     ("basico", ["V0004"]),
    "dom_vila":      ("domicilio", ["domicilio01_V00048"]),
    "dom_cortico":   ("domicilio", ["domicilio01_V00050"]),
    "dom_degrad":    ("domicilio", ["domicilio01_V00052"]),
    "ban_comum":     ("domicilio", ["domicilio02_V00236"]),
    "ban_sanitario": ("domicilio", ["domicilio02_V00237"]),
    "agua_naoenc":   ("domicilio", ["domicilio02_V00201"]),
    "obitos_h":      ("obitos", ["V01226"]),
    "obitos_m":      ("obitos", ["V01227"]),
    "ent_mor":       ("entorno", ["moradores_V05200"]),
    "ent_pav":       ("entorno", ["moradores_V05206"]),
    "ent_bueiro":    ("entorno", ["moradores_V05209"]),
    "ent_ilum":      ("entorno", ["moradores_V05212"]),
    "ent_onibus":    ("entorno", ["moradores_V05215"]),
    "ent_bici":      ("entorno", ["moradores_V05218"]),
    "ent_calcada":   ("entorno", ["moradores_V05221"]),
    "ent_obstaculo": ("entorno", ["moradores_V05224"]),
    "ent_rampa":     ("entorno", ["moradores_V05227"]),
    "ent_arvore":    ("entorno", ["moradores_V05231", "moradores_V05232", "moradores_V05233"]),
}
# base de cada campo para dizer se o setor "deveria" ter o valor (soma parcial no bairro)
BASE = {c: ("ent_mor" if c.startswith("ent_") and c != "ent_mor" else "dpo") for c in CAMPOS}
BASE["dom_part"] = BASE["dom_colet"] = BASE["ent_mor"] = None

# conferência com o pacote: campo do Atlas -> função sobre a linha do censobr
def _soma0(*xs):
    return None if all(x is None for x in xs) else sum(x or 0 for x in xs)
CONFERE = {
    "pop":           lambda b, d, o: b["V0001"],
    "dom_total":     lambda b, d, o: b["V0002"],
    "dpo":           lambda b, d, o: b["V0007"],
    "moradores_dom": lambda b, d, o: b["V0005"],
    "area_km2":      lambda b, d, o: b["area_km2"],
    "dppo":          lambda b, d, o: d.get("domicilio01_V00001"),
    "dom_casa":      lambda b, d, o: d.get("domicilio01_V00047"),
    "dom_apto":      lambda b, d, o: d.get("domicilio01_V00049"),
    "ban_nenhum":    lambda b, d, o: d.get("domicilio02_V00238"),
    "agua_rede":     lambda b, d, o: d.get("domicilio02_V00111"),
    "dom_precario":  lambda b, d, o: _soma0(d.get("domicilio01_V00050"), d.get("domicilio01_V00052")) if d else None,
    "obitos":        lambda b, d, o: _soma0(o.get("V01226"), o.get("V01227")) if o else None,
}


def falha(msg: str) -> None:
    sys.exit(f"✗ {msg}")


# ---- formato compacto do Atlas (o mesmo de decCol/decDic do atlas.js) -------------
def dec_ints(s: str, n: int) -> list[int]:
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
        out.append(~(r >> 1) if r & 1 else r >> 1)
    return out


def dec_col(s: str, escala: float, n: int) -> list:
    return [None if v == 0 else (v - 1) / escala for v in dec_ints(s, n)]


def enc_col(vals: list, escala: float) -> str:
    out = []
    for x in vals:
        v = 0 if x is None else int(round(x * escala)) + 1
        r = (v << 1) if v >= 0 else ((~v) << 1) | 1
        while r >= 32:
            out.append(chr((32 | (r & 31)) + 63))
            r >>= 5
        out.append(chr(r + 63))
    return "".join(out)


def le_js(nome: str) -> dict:
    p = DADOS / nome
    if not p.exists():
        falha(f"falta {p}: rode o script de dentro do pacote do Atlas")
    t = p.read_text(encoding="utf-8")
    return json.loads(t[t.index("=") + 1:].strip().rstrip(";"))


# ---- download -----------------------------------------------------------------------
def baixa(nome: str) -> pathlib.Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    p = CACHE / nome
    if p.exists() and p.stat().st_size > 0:
        return p
    print(f"  baixando {nome}…", flush=True)
    tmp = p.with_suffix(".parte")
    try:
        with urllib.request.urlopen(URL.format(nome), timeout=600) as r, open(tmp, "wb") as f:
            shutil.copyfileobj(r, f, 1 << 20)
    except Exception as e:                                       # noqa: BLE001
        tmp.unlink(missing_ok=True)
        falha(f"não consegui baixar {URL.format(nome)}: {e}")
    tmp.rename(p)
    return p


def main() -> None:
    try:
        import pyarrow as pa
        import pyarrow.compute as pc
        import pyarrow.parquet as pq
    except ImportError:
        falha("precisa do pyarrow: pip install pyarrow")

    N, T, B, M = le_js("dados-nucleo.js"), le_js("dados-setores.js"), le_js("dados-bairros.js"), le_js("dados-municipios.js")
    cods = [str(c) for c in N["munis"]["ids"]]
    nomes = N["munis"]["nomes"]
    ns = len(T["geom"])
    suf, mi = dec_ints(T["ids"], ns), dec_ints(T["m"], ns)
    ids = [cods[m] + str(s).zfill(8) for m, s in zip(mi, suf)]
    bdic = T["bairro_dic"]
    bairro_set = [bdic[v - 1] if v > 0 else None for v in dec_ints(T["bairro"], ns)]
    esc = dict(zip(N["campos"], N["escalas"]))
    atlas = {c: dec_col(T["valores"][c], esc[c], ns) for c in CONFERE}

    print("Lendo os agregados por setor do Censo 2022 (censobr)…")
    # além dos campos novos, as colunas que a conferência com o pacote usa
    extra = {"basico": {"V0001", "V0002", "V0003", "V0004", "V0005", "V0007", "area_km2"},
             "domicilio": {"domicilio01_V00001", "domicilio01_V00047", "domicilio01_V00049",
                           "domicilio02_V00111", "domicilio02_V00238"}}
    linhas = {}
    for k, nome in ARQ.items():
        p = baixa(nome)
        cols = sorted({c for (a, cs) in CAMPOS.values() if a == k for c in cs} | extra.get(k, set()))
        nomes_arq = pq.read_schema(p).names
        falta = [c for c in cols if c not in nomes_arq]
        if falta:
            falha(f"{nome} não tem as colunas {', '.join(falta)}")
        t = pq.read_table(p, columns=["code_muni", "code_tract"] + cols)
        t = t.filter(pc.is_in(pc.cast(t["code_muni"], pa.string()), value_set=pa.array(cods)))
        linhas[k] = {str(int(r["code_tract"])): r for r in t.to_pylist()}
        print(f"  {k}: {len(linhas[k])} setores dos sete municípios")

    if set(linhas["basico"]) != set(ids):
        falha(f"os setores não batem com os do Atlas: {len(set(ids) - set(linhas['basico']))} faltam na fonte, "
              f"{len(set(linhas['basico']) - set(ids))} sobram")

    # conferência setor a setor com o pacote
    print("Conferindo os setores com o pacote do Atlas…")
    conf = {}
    for c, f in CONFERE.items():
        dif = []
        for k, i in enumerate(ids):
            b, d, o = linhas["basico"][i], linhas["domicilio"].get(i, {}), linhas["obitos"].get(i, {})
            a, x = atlas[c][k], f(b, d, o)
            if c in ("dom_precario", "obitos") and a is None and x == 0:
                x = None                                    # zero e omitido são o mesmo no pacote
            if a is None and x is None:
                continue
            tol = 0.051 if c == "moradores_dom" else (5e-4 * max(1, abs(x or 0)) if c == "area_km2" else 1e-6)
            if a is None or x is None or abs(a - x) > tol:
                dif.append((i, a, x))
        conf[c] = len(dif)
        if dif:
            falha(f"o campo {c} não bate com o pacote em {len(dif)} setores (ex.: {dif[:3]}). "
                  "A fonte mudou: confira a versão do censobr antes de seguir.")
    print(f"  {len(CONFERE)} campos iguais nos {ns} setores")

    # valores novos por setor, na ordem do pacote
    novo = {}
    for c, (a, cs) in CAMPOS.items():
        col = []
        for i in ids:
            r = linhas[a].get(i)
            xs = [None if r is None else r.get(x) for x in cs]
            col.append(None if all(x is None for x in xs) else sum(x or 0 for x in xs) if len(xs) > 1 else xs[0])
        novo[c] = col
    dpo = atlas["dpo"]

    # coerência interna: particulares + coletivos = total; entorno não passa do total pesquisado
    for k, i in enumerate(ids):
        b = linhas["basico"][i]
        if b["V0003"] + b["V0004"] != b["V0002"]:
            falha(f"setor {i}: particulares + coletivos ({b['V0003']}+{b['V0004']}) não somam o total ({b['V0002']})")
        m = novo["ent_mor"][k]
        for c in CAMPOS:
            if c.startswith("ent_") and c != "ent_mor" and novo[c][k] is not None and (m is None or novo[c][k] > m):
                falha(f"setor {i}: {c} = {novo[c][k]} passa do total de moradores com entorno pesquisado ({m})")

    def deveria(c, k):
        base = BASE[c]
        if base is None:
            return False
        v = dpo[k] if base == "dpo" else novo["ent_mor"][k]
        return bool(v)

    # bairros, pela ordem do pacote: o setor entra no bairro do mesmo nome no seu município;
    # o "(sem divisão de bairros no IBGE)" reúne os setores do município que não têm bairro
    nb = len(B["nomes"])
    bmun = B.get("muni") or ["Porto Alegre"] * nb
    idx_b = {(mu, nm): j for j, (nm, mu) in enumerate(zip(B["nomes"], bmun))}
    sem_div = {mu: j for j, (nm, mu) in enumerate(zip(B["nomes"], bmun)) if "sem divisão de bairros" in nm}
    membros = [[] for _ in range(nb)]
    for k in range(ns):
        mu, nm = nomes[mi[k]], bairro_set[k]
        if nm and (mu, nm) in idx_b:
            membros[idx_b[(mu, nm)]].append(k)
        elif not nm and mu in sem_div:
            membros[sem_div[mu]].append(k)
    # conferência: a população do bairro é a soma dos seus setores, como no pacote
    pop_b = dec_col(B["valores"]["pop"], esc["pop"], nb)
    ruins = [B["nomes"][j] for j in range(nb) if pop_b[j] is not None and abs(sum(atlas["pop"][k] or 0 for k in membros[j]) - pop_b[j]) > 0.5]
    if ruins:
        falha(f"a soma dos setores não reproduz a população de {len(ruins)} bairros do pacote: {ruins[:5]}")

    def agrega(grupos):
        val, omi = {}, {}
        for c in CAMPOS:
            vs, os_ = [], []
            for ks in grupos:
                tem = [novo[c][k] for k in ks if novo[c][k] is not None]
                vs.append(sum(tem) if tem else None)
                os_.append(sum(1 for k in ks if novo[c][k] is None and deveria(c, k)))
            val[c], omi[c] = vs, os_
        return val, omi

    vb, ob = agrega(membros)
    grupos_m = [[k for k in range(ns) if mi[k] == M["muni_id"][j]] for j in range(len(M["nomes"]))]
    pop_m = dec_col(M["valores"]["pop"], esc["pop"], len(M["nomes"]))
    for j, ks in enumerate(grupos_m):
        if abs(sum(atlas["pop"][k] or 0 for k in ks) - (pop_m[j] or 0)) > 0.5:
            falha(f"a soma dos setores não reproduz a população de {M['nomes'][j]} no pacote")
    vm, om = agrega(grupos_m)

    escalas = [1] * len(CAMPOS)
    saida = {
        "gerado_em": date.today().isoformat(),
        "fonte": {"origem": URL.format(""), "release": RELEASE,
                  "arquivos": list(ARQ.values()),
                  "descricao": "Agregados por setores censitários do Censo Demográfico 2022 (IBGE), "
                               "na versão publicada pelo IPEA para o pacote censobr."},
        "campos": list(CAMPOS), "escalas": escalas,
        "variaveis": {c: {"arquivo": a, "colunas": cs} for c, (a, cs) in CAMPOS.items()},
        "setores": {c: enc_col(novo[c], 1) for c in CAMPOS},
        "bairros": {c: enc_col(vb[c], 1) for c in CAMPOS},
        "municipios": {c: enc_col(vm[c], 1) for c in CAMPOS},
        "omissoes_bairro": {c: ob[c] for c in CAMPOS if any(ob[c])},
        "omissoes_municipio": {c: om[c] for c in CAMPOS if any(om[c])},
        "conferencia": {"setores": ns, "campos_iguais_ao_pacote": sorted(conf),
                        "omitidos_por_campo": {c: sum(1 for k in range(ns) if novo[c][k] is None and deveria(c, k)) for c in CAMPOS}},
    }
    texto = json.dumps(saida, ensure_ascii=False, separators=(",", ":"))
    SAIDA.write_text("// Gerado por extracao/9_censo2022_setores.py. Não edite à mão: rode o script de novo.\n"
                     f"window.ATLAS_CENSO22={texto};\n", encoding="utf-8")
    print(f"Gravado {SAIDA.relative_to(RAIZ)}: {len(CAMPOS)} campos, {ns} setores, {nb} bairros, "
          f"{SAIDA.stat().st_size // 1024} KB")
    for c in CAMPOS:
        tot = sum(x for x in vm[c] if x is not None)
        print(f"  {c:<14} {tot:>12,.0f} nos sete municípios; setores omitidos: {saida['conferencia']['omitidos_por_campo'][c]}"
              .replace(",", "."))


if __name__ == "__main__":
    main()
