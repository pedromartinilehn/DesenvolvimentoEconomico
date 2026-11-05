#!/usr/bin/env python3
"""Pontos do Atlas Porto Alegre: lojas Panvel, unidades de saúde e escolas.

    python3 extracao/3_pontos.py

Fontes (releases do repositório ipea/geobr_prep_data no GitHub, base do pacote geobr):
- CNES/DATASUS, competência de abril de 2026 (healthfacilities_202604.parquet), com
  as coordenadas do próprio CNES e as do geocodebr (IPEA), que localiza o endereço
  no Cadastro Nacional de Endereços do Censo 2022;
- Censo Escolar 2025 do INEP (schools_2025.parquet).

Lojas Panvel: os estabelecimentos ativos no CNES com o CNPJ da Dimed S/A
Distribuidora de Medicamentos (raiz 92.665.611), a empresa que opera a Panvel, com
endereço em Porto Alegre e registrados como farmácia (tipo 43). Os outros tipos da
empresa (clínica, consultório, centro de imunização, central de abastecimento) não
são loja: ficam de fora e entram na conferência. Farmácia que oferece serviço de saúde precisa de registro
no CNES; uma loja aberta depois da competência, ou sem registro, não aparece.

Coordenada de cada loja (regra do Atlas, mais estrita que a do geobr, porque o
entorno usa raios de 500 m):
1. o geocodebr achou o número do endereço (precisão "numero" ou
   "numero_aproximado", desvio de até 50 m): ponto do endereço;
2. senão, a coordenada do CNES, se ela cai dentro da área do CEP do endereço
   (distância até o ponto do geocodebr menor que o desvio dele, quando esse desvio
   é de até 800 m) ou a até 150 m do ponto do geocodebr;
3. senão, o centro do CEP do endereço (geocodebr), se o desvio for de até 800 m;
4. senão, a coordenada do CNES, marcada como não confirmada.
Cada loja leva a classe e a incerteza em metros.

Unidades de saúde: as mesmas regras da camada da RMPA (renner/atlas_v3/extracao/2_atualiza_cnes.py):
tipos de atendimento à população, ativos, unidades prisionais e socioeducativas
marcadas. Escolas: em atividade. Nessas duas camadas a coordenada é a que o geobr
escolheu.

Confere e para se algo não bater: CNPJ repetido, loja fora dos setores de Porto
Alegre, tipo de estabelecimento sem regra.
Grava extracao/fontes/intermediario/pontos.json.
"""

from __future__ import annotations

import json
import math
import pathlib
import re
import sys
import unicodedata
from collections import Counter

import numpy as np
import pyarrow.compute as pc
import pyarrow.dataset as ds
import shapely

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FONTES = RAIZ / "extracao" / "fontes"
INTER = FONTES / "intermediario"
SAIDA = INTER / "pontos.json"
CNES = FONTES / "geobr_prep" / "healthfacilities_202604.parquet"
ESCOLAS = FONTES / "geobr_prep" / "schools_2025.parquet"
URL_PREP = "https://github.com/ipea/geobr_prep_data/releases/download/v2.0.0/{}"
COMPETENCIA = "202604"
ANO_ESCOLAS = 2025
MUNICIPIO = 4314902
RAIZ_CNPJ = "92665611"                  # Dimed S/A Distribuidora de Medicamentos (Panvel)

TIPOS_SAUDE = {
    1: "Posto de saúde", 2: "Centro de saúde / UBS", 4: "Policlínica", 5: "Hospital geral",
    7: "Hospital especializado", 15: "Unidade mista", 20: "Pronto-socorro geral",
    21: "Pronto-socorro especializado", 62: "Hospital-dia", 70: "CAPS",
    71: "Centro de apoio à saúde da família", 72: "Unidade de atenção à saúde indígena",
    73: "Pronto atendimento",
}
TIPOS_LOJA = {43: "Farmácia"}          # loja = farmácia; os outros tipos da empresa ficam de fora, contados
RESTRITO = re.compile(r"PRISION|PENITENC|PRESIDI|SOCIOEDUC|\bCASE\b|\bCASEF\b")
DEPENDENCIA = {1: "Federal", 2: "Estadual", 3: "Municipal", 4: "Privada"}
PEQUENAS = {"de", "da", "do", "das", "dos", "e"}


class Falha(Exception):
    pass


def baixa(arq: pathlib.Path) -> pathlib.Path:
    if arq.exists() and arq.stat().st_size > 0:
        return arq
    import urllib.request
    arq.parent.mkdir(parents=True, exist_ok=True)
    parcial = arq.with_suffix(".parcial")
    with urllib.request.urlopen(URL_PREP.format(arq.name), timeout=900) as r, open(parcial, "wb") as f:
        while True:
            bloco = r.read(1 << 20)
            if not bloco:
                break
            f.write(bloco)
    parcial.replace(arq)
    return arq


def distancia_m(lat1, lon1, lat2, lon2) -> float:
    r = 6371008.8
    p1, p2 = math.radians(lat1), math.radians(lat2)
    h = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def titulo(s: str | None) -> str:
    if not s:
        return ""
    palavras = re.sub(r"\s+", " ", str(s).strip()).lower().split(" ")
    return " ".join(p if (i and p in PEQUENAS) else p[:1].upper() + p[1:] for i, p in enumerate(palavras))


def sem_acento(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def chave_endereco(e: str) -> str:
    """Endereço sem acento, tipo de via, títulos e preposições: 'Av Dr X, 12' = 'Doutor X, 12'."""
    s = sem_acento(e).lower()
    s = re.sub(r"\b(rua|r|av|avenida|al|alameda|ac|acesso|estrada|estr|tv|travessa|praca|pc|dr|doutor|prof|"
               r"professor|cel|coronel|gen|general|de|da|do|dos|das|e)\b", " ", s)
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def ok(v) -> bool:
    return v is not None and not (isinstance(v, float) and math.isnan(v))


def coordenada_loja(r: dict) -> tuple[float, float, str, int | None, float | None]:
    """(lon, lat, classe, incerteza em m, distância CNES × geocodebr em m)."""
    lc, oc, lg, og = r["lat_cnes"], r["lon_cnes"], r["lat_geocodebr"], r["lon_geocodebr"]
    prec, desvio = r["precisao_geocodebr"], r["desvio_metros_geocodebr"]
    tem_c, tem_g = ok(lc) and ok(oc), ok(lg) and ok(og)
    d = distancia_m(lc, oc, lg, og) if tem_c and tem_g else None
    if tem_g and prec in ("numero", "numero_aproximado") and ok(desvio) and desvio <= 50:
        return og, lg, "endereco", int(desvio), d
    # um CEP espalhado por mais de 800 m não confirma nada; perto do ponto dele (150 m), confirma
    if tem_c and tem_g and ok(desvio) and (d <= 150 or (desvio <= 800 and d <= desvio)):
        return oc, lc, "cnes_no_cep", int(min(max(desvio, 150), 800)), d
    if tem_g and ok(desvio) and desvio <= 800:
        return og, lg, "centro_cep", int(desvio), d
    if tem_c:
        return oc, lc, "cnes_sem_confirmacao", None, d
    raise Falha(f"loja {r['co_cnes']} sem coordenada")


def le_setores():
    s = json.loads((INTER / "setores_wkb.json").read_text(encoding="utf-8"))
    m = json.loads((INTER / "malhas.json").read_text(encoding="utf-8"))
    geoms = [shapely.from_wkb(bytes.fromhex(w)) for w in s["wkb"]]
    if s["ids"] != m["setor"]["ids"]:
        raise Falha("setores_wkb.json e malhas.json com setores diferentes")
    return s["ids"], dict(zip(m["setor"]["ids"], m["setor"]["bairro"])), geoms, shapely.STRtree(geoms)


def no_setor(x: float, y: float, ids, arvore, geoms):
    p = shapely.Point(x, y)
    for i in arvore.query(p, predicate="intersects"):
        return ids[int(i)]
    # fora de todos: setor mais próximo, com a distância
    i = int(arvore.nearest(p))
    return None if shapely.distance(geoms[i], p) > 0 else ids[i]


def main() -> int:
    conf = {}
    ids, bairro_de, geoms, arvore = le_setores()
    tab = ds.dataset(baixa(CNES), format="parquet").to_table(
        columns=["code_muni", "co_cnes", "nu_cnpj", "no_fantasia", "no_razao_social", "logradouro",
                 "numero_endereco", "bairro", "cep", "tp_unidade", "co_motivo_desab", "lat_cnes", "lon_cnes",
                 "lat_geocodebr", "lon_geocodebr", "precisao_geocodebr", "desvio_metros_geocodebr",
                 "coords_source", "to_char_dt_atualizacao_dd_mm_yyyy", "abbrev_state", "geometry"]).to_pylist()
    conf["cnes_estabelecimentos"] = len(tab)

    # ── lojas Panvel ──────────────────────────────────────────────────────
    dimed = [r for r in tab if (r["nu_cnpj"] or "").startswith(RAIZ_CNPJ)]
    ativos = [r for r in dimed if r["co_motivo_desab"] is None]
    conf["dimed_cnes_brasil"] = {"total": len(dimed), "ativos": len(ativos),
                                 "ativos_por_uf": dict(Counter(r["abbrev_state"] for r in ativos).most_common())}
    poa = [r for r in ativos if ok(r["code_muni"]) and int(r["code_muni"]) == MUNICIPIO]
    conf["dimed_poa_desativados"] = sorted(r["co_cnes"] for r in dimed
                                           if ok(r["code_muni"]) and int(r["code_muni"]) == MUNICIPIO
                                           and r["co_motivo_desab"] is not None)
    rep = [c for c, k in Counter(r["nu_cnpj"] for r in poa).items() if k > 1]
    if rep:
        raise Falha(f"CNPJ repetido entre as lojas: {rep}")
    conf["dimed_poa_outros_tipos"] = [{"cnes": r["co_cnes"], "tipo": int(r["tp_unidade"]), "end": titulo(r["logradouro"])
                                        + (f", {str(r['numero_endereco']).strip()}" if r["numero_endereco"] else "")}
                                       for r in poa if r["tp_unidade"] not in TIPOS_LOJA]
    poa = [r for r in poa if r["tp_unidade"] in TIPOS_LOJA]
    tipos = Counter(r["tp_unidade"] for r in poa)
    lojas = []
    for r in poa:
        x, y, classe, incerteza, d = coordenada_loja(r)
        setor = no_setor(x, y, ids, arvore, geoms)
        if setor is None:
            raise Falha(f"loja {r['co_cnes']} fora dos setores de Porto Alegre ({y:.5f}, {x:.5f})")
        num = str(r["numero_endereco"] or "").strip()
        lojas.append({
            "cnes": r["co_cnes"], "cnpj": r["nu_cnpj"], "fantasia": (r["no_fantasia"] or "").strip(),
            "end": titulo(r["logradouro"]) + (f", {num}" if num else ""),
            "bairro_cnes": titulo(r["bairro"]), "cep": f"{int(r['cep']):08d}" if ok(r["cep"]) else None,
            "tipo": int(r["tp_unidade"]), "x": round(x, 6), "y": round(y, 6), "classe": classe,
            "incerteza_m": incerteza, "dist_cnes_geocodebr_m": None if d is None else round(d),
            "setor": setor, "bairro": bairro_de[setor],
            "atualizado": r["to_char_dt_atualizacao_dd_mm_yyyy"],
        })
    lojas.sort(key=lambda l: (sem_acento(l["end"]).lower(), l["cnes"]))
    # mesmo endereço (com grafias diferentes) ou a menos de 50 m: o CNES mantém os dois
    # registros ativos; o Atlas mostra os dois e avisa, porque pode ser registro repetido.
    # Loja posta no centro do CEP fica fora da conta dos 50 m: o centro do CEP não diz onde
    # ela fica dentro dele (a mesma regra do atlas das farmácias do Brasil)
    por_end = {}
    for l in lojas:
        por_end.setdefault(chave_endereco(l["end"]), []).append(l["cnes"])
    for l in lojas:
        l["mesmo_end"] = [c for c in por_end[chave_endereco(l["end"])] if c != l["cnes"]]
        l["perto_50m"] = [o["cnes"] for o in lojas if o is not l and "centro_cep" not in (l["classe"], o["classe"])
                          and distancia_m(l["y"], l["x"], o["y"], o["x"]) < 50]
    conf["lojas_poa"] = len(lojas)
    conf["lojas_por_tipo"] = {TIPOS_LOJA[k]: v for k, v in tipos.items()}
    conf["lojas_por_classe"] = dict(Counter(l["classe"] for l in lojas))
    conf["lojas_mesmo_endereco"] = sorted({" / ".join(sorted({l["end"], *(o["end"] for o in lojas if o["cnes"] in l["mesmo_end"])}))
                                          for l in lojas if l["mesmo_end"]})
    conf["lojas_a_menos_de_50m"] = sorted({" e ".join(sorted([l["end"]] + [o["end"] for o in lojas if o["cnes"] in l["perto_50m"]]))
                                           for l in lojas if l["perto_50m"]})
    conf["lojas_bairros"] = len({l["bairro"] for l in lojas})

    # ── unidades de saúde (regras da RMPA) ───────────────────────────────
    saude = []
    for r in tab:
        if not ok(r["code_muni"]) or int(r["code_muni"]) != MUNICIPIO or r["co_motivo_desab"] is not None:
            continue
        if r["tp_unidade"] not in TIPOS_SAUDE:
            continue
        pt = shapely.from_wkb(r["geometry"])
        setor = no_setor(pt.x, pt.y, ids, arvore, geoms)
        nome = (r["no_fantasia"] or "Estabelecimento de saúde").strip()
        saude.append({"cnes": r["co_cnes"], "nome": nome, "tipo": int(r["tp_unidade"]),
                      "x": round(pt.x, 6), "y": round(pt.y, 6), "setor": setor,
                      "bairro": bairro_de.get(setor), "restrito": 1 if RESTRITO.search(nome.upper()) else 0,
                      "fonte_coord": r["coords_source"]})
    saude.sort(key=lambda s: (s["tipo"], sem_acento(s["nome"]).lower()))
    conf["saude"] = len(saude)
    conf["saude_fora_dos_setores"] = sum(1 for s in saude if s["setor"] is None)
    conf["saude_por_tipo"] = {TIPOS_SAUDE[k]: v for k, v in sorted(Counter(s["tipo"] for s in saude).items())}
    conf["saude_restritas"] = [s["nome"] for s in saude if s["restrito"]]

    # ── escolas (Censo Escolar 2025) ─────────────────────────────────────
    esc_tab = ds.dataset(baixa(ESCOLAS), format="parquet").to_table(
        columns=["code_muni", "code_school", "name_school", "tp_dependencia", "tp_situacao_funcionamento",
                 "geometry"], filter=pc.field("code_muni") == MUNICIPIO).to_pylist()
    escolas = []
    for r in esc_tab:
        if r["tp_situacao_funcionamento"] != 1:
            continue
        pt = shapely.from_wkb(r["geometry"])
        if pt.is_empty:
            continue
        setor = no_setor(pt.x, pt.y, ids, arvore, geoms)
        escolas.append({"inep": str(r["code_school"]).split(".")[0], "nome": (r["name_school"] or "Escola").strip(),
                        "tipo": int(r["tp_dependencia"]), "x": round(pt.x, 6), "y": round(pt.y, 6),
                        "setor": setor, "bairro": bairro_de.get(setor)})
    escolas.sort(key=lambda e: (e["tipo"], sem_acento(e["nome"]).lower()))
    conf["escolas"] = len(escolas)
    conf["escolas_fora_dos_setores"] = sum(1 for e in escolas if e["setor"] is None)
    conf["escolas_por_dependencia"] = {DEPENDENCIA[k]: v for k, v in sorted(Counter(e["tipo"] for e in escolas).items())}

    saida = {
        "lojas": {"itens": lojas, "tipos": {str(k): v for k, v in TIPOS_LOJA.items()},
                  "fonte": "CNES/DATASUS via geobr (IPEA)", "competencia": COMPETENCIA, "raiz_cnpj": RAIZ_CNPJ,
                  "empresa": "Dimed S/A Distribuidora de Medicamentos (Panvel)"},
        "saude": {"itens": saude, "tipos": {str(k): v for k, v in TIPOS_SAUDE.items()},
                  "fonte": "CNES/DATASUS via geobr (IPEA)", "competencia": COMPETENCIA},
        "escolas": {"itens": escolas, "tipos": {str(k): v for k, v in DEPENDENCIA.items()},
                    "fonte": "Censo Escolar/INEP via geobr (IPEA)", "ano": ANO_ESCOLAS},
        "conferencia": conf,
    }
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(saida, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(json.dumps(conf, ensure_ascii=False, indent=1))
    print(f"gravado {SAIDA} ({SAIDA.stat().st_size / 1e6:.2f} MB)")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Falha as e:
        print(f"PAROU: {e}", file=sys.stderr)
        sys.exit(1)
