#!/usr/bin/env python3
"""Gera dados/dados-atlasbrasil.js com as bases da biblioteca do Atlas Brasil.

    python3 extracao/11_atlas_brasil.py

O Atlas do Desenvolvimento Humano no Brasil (PNUD, IPEA e FJP) publica as suas bases em
https://www.atlasbrasil.org.br/acervo/biblioteca. Este script lê os arquivos como a
biblioteca os entrega, guardados em extracao/fontes/atlasbrasil/ (pasta não versionada):

- dados_pa.zip, da RM de Porto Alegre. Traz dois .rar:
  - "base final RM Porto Alegre.rar": as bases UDH, REGIONAL e 20 RMs, de 2000 e 2010, e o
    dicionário dos indicadores;
  - "SH RM_Porto_Alegre.rar": os shapefiles das UDHs, das regiões de Porto Alegre e da RM.
  O script abre os .rar com a libarchive do sistema, quando ela existe (Linux e macOS). Se
  não abrir, extraia os dois .rar na própria pasta, com 7-Zip, WinRAR ou The Unarchiver, e
  rode de novo: o script procura primeiro os arquivos já extraídos.
- adh_radar_base_2012_2024.xlsx e adh_radar_metadados_2012_2024.xlsx: o Radar IDHM, que o
  Atlas Brasil calcula com a PNAD Contínua para o Brasil, as grandes regiões, as UFs e as RMs.
- censo_metadados_1991_2010.xlsx e reg_adm_metadados_2013_2017.xlsx: os dicionários dos
  indicadores do censo e dos registros administrativos.

O que vai para o Atlas (window.ATLAS_ATLASBR):
- udh: as UDHs (Unidades de Desenvolvimento Humano) dos sete municípios, com a geometria do
  shapefile e os indicadores de CAMPOS_UDH em 2000 e 2010;
- regional: as 17 regiões de Porto Alegre, com os mesmos indicadores;
- rms: as 20 RMs da base do Atlas Brasil, com os mesmos indicadores;
- radar: o Radar IDHM de 2012 a 2024 para a RM de Porto Alegre, o RS e o Brasil, as abas por
  sexo e por cor da RM de Porto Alegre e os indicadores de RADAR_RMS para as 21 RMs do Radar;
- dic: nome, unidade e dimensão de cada sigla dos dicionários; a definição, só das siglas das
  UDHs e de RADAR_RMS; nos registros administrativos, o período e a fonte ("f", índice em
  dic_fontes). É o que a central de extração usa para reconhecer uma base nova.

Conferências (o script para e não grava nada se uma falhar):
- as UDHs da base são as do shapefile, nos dois anos, e cada uma está no município certo;
- em 2010, a população das UDHs (PESOTOT) soma a população de cada município publicada pelo
  Atlas Brasil, que o Atlas já tem (dados/dados-ipea.js); em 2000, a diferença é de poucas
  pessoas, porque o Atlas Brasil levou os dados de 2000 para as UDHs de 2010;
- cada região de Porto Alegre soma as suas UDHs, e a RM soma as UDHs das 34 cidades;
- o IDHM de cada UDH, região, RM e ano do Radar confere com os subíndices, e os subíndices
  conferem com os indicadores de que saem (esperança de vida, renda per capita, frequência
  escolar e escolaridade);
- as abas com "B" no nome, na base do Radar, repetem as abas sem "B" célula a célula.

Uma correção de unidade: o dicionário do censo diz "Em mil Reais de 01/08/2010" para a renda,
mas os valores estão em reais. A renda per capita de Porto Alegre em 2010 é 1.758,27 na base
de UDHs (soma ponderada) e no Atlas Brasil municipal. O script grava a unidade em reais e
guarda o texto original em "u_original".

Precisa de openpyxl (pip install openpyxl).
"""

from __future__ import annotations

import ctypes
import ctypes.util
import hashlib
import json
import math
import pathlib
import struct
import sys
import zipfile
from datetime import date

RAIZ = pathlib.Path(__file__).resolve().parent.parent          # atlas_v3/
DADOS = RAIZ / "dados"
SAIDA = DADOS / "dados-atlasbrasil.js"
FONTES = RAIZ / "extracao" / "fontes" / "atlasbrasil"
EXTRAIDO = FONTES / "extraido"
PREC = 100000                     # 1e-5 grau, a precisão das outras malhas do Atlas
TOL = 3                           # simplificação das linhas, em unidades de PREC (cerca de 3 m)

# Indicadores das UDHs, das regiões e das RMs, na ordem em que entram.
CAMPOS_UDH = [
    "IDHM", "IDHM_R", "IDHM_L", "IDHM_E", "ESPVIDA",
    "RDPC", "RDPC1", "GINI", "THEIL", "R1040", "PREN20", "PRENTRAB",
    "PIND", "PMPOB", "PPOB", "PINDCRI", "PMPOBCRI",
    "MORT1", "MORT5", "FECTOT", "RAZDEP", "T_ENV", "T_M10A17CF", "PESOTOT",
    "E_ANOSESTUDO", "T_ANALF15M", "T_FUND18M", "T_MED25M", "T_SUPER25M", "T_FREQ0A5",
    "T_FREQ15A17", "T_FUND15A17", "T_MED18A20", "T_ATRASO_2_FUND", "T_FORA6A14",
    "T_ATIV18M", "T_DES18M", "T_DES1824", "P_FORMAL", "RENOCUP",
    "T_AGUA", "T_BANAGUA", "T_LIXO", "T_LUZ", "AGUA_ESGOTO", "T_DENS",
    "T_FUNDIN18MINF", "T_CRIFUNDIN_TODOS", "T_FUNDIN_TODOS", "T_NESTUDA_NTRAB_MMEIO",
    "T_MULCHEFEFIF014", "T_RMAXIDOSO", "T_OCUPDESLOC_1",
]
# Do Radar, para as 21 RMs (a RM de Porto Alegre, o RS e o Brasil levam todas as siglas).
RADAR_RMS = ["IDHM", "IDHM_R", "IDHM_L", "IDHM_E", "ESPVIDA", "MORT1", "RDPC", "GINI",
             "PIND", "PMPOB", "PPOB", "T_FUND18M", "ANOSEST", "T_ANALF15M"]
# renda: o dicionário do censo diz "Em mil Reais", mas os valores estão em reais
RENDA_EM_REAIS = {"RDPC", "RDPC1", "RDPC2", "RDPC3", "RDPC4", "RDPC5", "RDPC10", "RDPCT",
                  "RIND", "RMPOB", "RPOB", "RENOCUP", "CORTE1", "CORTE2", "CORTE3", "CORTE4", "CORTE9"}


def falha(msg: str) -> None:
    sys.exit(f"✗ {msg}")


def le_js(nome: str) -> dict:
    p = DADOS / nome
    if not p.exists():
        falha(f"falta {p}: rode o script de dentro do pacote do Atlas")
    t = p.read_text(encoding="utf-8")
    return json.loads(t[t.index("=") + 1:].strip().rstrip(";"))


# ---- arquivos de entrada ------------------------------------------------------------
def sha256(p: pathlib.Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def acha(padrao: str, obrigatorio: bool = True) -> pathlib.Path | None:
    """O arquivo que casa com o padrão, na pasta das fontes ou no que foi extraído."""
    achados = sorted(set(FONTES.glob(padrao)) | set(EXTRAIDO.glob("**/" + padrao)))
    if len(achados) > 1:
        falha(f"mais de um arquivo para {padrao}: {[a.name for a in achados]}. Deixe só um.")
    if not achados and obrigatorio:
        falha(f"não achei {padrao} em {FONTES}. Baixe da biblioteca do Atlas Brasil "
              "(https://www.atlasbrasil.org.br/acervo/biblioteca).")
    return achados[0] if achados else None


def libarchive():
    nome = ctypes.util.find_library("archive")
    for cand in ([nome] if nome else []) + ["libarchive.so.13", "libarchive.13.dylib", "libarchive.dylib"]:
        try:
            lib = ctypes.CDLL(cand)
            break
        except OSError:
            continue
    else:
        return None
    vp = ctypes.c_void_p
    lib.archive_read_new.restype = vp
    for f in ("archive_read_support_format_all", "archive_read_support_filter_all", "archive_read_free"):
        getattr(lib, f).argtypes = [vp]
    lib.archive_read_open_filename.argtypes = [vp, ctypes.c_char_p, ctypes.c_size_t]
    lib.archive_read_next_header.argtypes = [vp, ctypes.POINTER(vp)]
    lib.archive_entry_pathname.argtypes = [vp]
    lib.archive_entry_pathname.restype = ctypes.c_char_p
    lib.archive_entry_filetype.argtypes = [vp]
    lib.archive_entry_filetype.restype = ctypes.c_uint
    lib.archive_read_data.argtypes = [vp, vp, ctypes.c_size_t]
    lib.archive_read_data.restype = ctypes.c_ssize_t
    lib.archive_error_string.argtypes = [vp]
    lib.archive_error_string.restype = ctypes.c_char_p
    return lib


def extrai_rar(dados: bytes, nome: str, destino: pathlib.Path) -> list[str]:
    """Extrai um .rar (bytes) para destino. Só arquivos comuns; o nome perde as pastas."""
    lib = libarchive()
    if lib is None:
        falha(f"não há libarchive neste computador para abrir {nome}. Extraia o .rar na pasta "
              f"{FONTES} (7-Zip, WinRAR ou The Unarchiver) e rode de novo.")
    tmp = destino / ("_" + hashlib.sha1(nome.encode()).hexdigest()[:8] + ".rar")
    tmp.write_bytes(dados)
    a = lib.archive_read_new()
    lib.archive_read_support_format_all(a)
    lib.archive_read_support_filter_all(a)
    if lib.archive_read_open_filename(a, str(tmp).encode(), 1 << 16) != 0:
        falha(f"{nome}: {lib.archive_error_string(a)}")
    ent, buf, saidos = ctypes.c_void_p(), ctypes.create_string_buffer(1 << 20), []
    while True:
        r = lib.archive_read_next_header(a, ctypes.byref(ent))
        if r == 1:
            break
        if r < -20:
            falha(f"{nome}: {lib.archive_error_string(a)}")
        bruto = lib.archive_entry_pathname(ent) or b""
        for cod in ("utf-8", "cp850", "latin-1"):
            try:
                n = bruto.decode(cod)
                break
            except UnicodeDecodeError:
                continue
        n = n.replace("\\", "/").split("/")[-1]
        if lib.archive_entry_filetype(ent) != 0o100000 or not n or n in (".", ".."):
            continue
        with open(destino / n, "wb") as f:
            while True:
                k = lib.archive_read_data(a, buf, len(buf))
                if k < 0:
                    falha(f"{nome}: {lib.archive_error_string(a)}")
                if k == 0:
                    break
                f.write(buf.raw[:k])
        saidos.append(n)
    lib.archive_read_free(a)
    tmp.unlink()
    return saidos


def prepara_rm() -> None:
    """Se as bases da RM ainda não estão extraídas, abre o dados_pa.zip e os .rar de dentro."""
    if acha("*Base UDH*.xlsx", False) and acha("*UDH_region.shp", False):
        return
    z = acha("dados_pa*.zip")
    EXTRAIDO.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(z) as zz:
        for info in zz.infolist():
            if info.filename.lower().endswith(".rar"):
                saidos = extrai_rar(zz.read(info), info.filename, EXTRAIDO)
                print(f"  {info.filename}: {len(saidos)} arquivos extraídos")


# ---- planilhas e shapefile -----------------------------------------------------------
def planilha(p: pathlib.Path) -> dict[str, list[tuple]]:
    import openpyxl
    wb = openpyxl.load_workbook(p, read_only=True, data_only=True)
    out = {ws.title: [r for r in ws.iter_rows(values_only=True)] for ws in wb.worksheets}
    wb.close()
    return out


def tabela(linhas: list[tuple]) -> tuple[list[str], list[dict]]:
    cab = [str(c).strip() if c is not None else "" for c in linhas[0]]
    regs = [dict(zip(cab, r)) for r in linhas[1:] if any(x is not None for x in r)]
    return cab, regs


def le_dbf(p: pathlib.Path) -> list[dict]:
    b = p.read_bytes()
    n, hl, rl = struct.unpack("<IHH", b[4:12])
    campos, q = [], 32
    while b[q] != 0x0D:
        campos.append((b[q:q + 11].split(b"\0")[0].decode("ascii"), chr(b[q + 11]), b[q + 16]))
        q += 32
    cod = "utf-8"
    cpg = p.with_suffix(".cpg")
    if cpg.exists():
        cod = cpg.read_text().strip() or cod
    out, q = [], hl
    for _ in range(n):
        rec, q, k, d = b[q:q + rl], q + rl, 1, {}
        if rec[:1] == b"*":
            continue
        for nome, _tipo, tam in campos:
            bruto = rec[k:k + tam]
            k += tam
            try:
                d[nome] = bruto.decode(cod).strip()
            except UnicodeDecodeError:
                d[nome] = bruto.decode("cp1252").strip()
        out.append(d)
    return out


def le_shp(p: pathlib.Path) -> list[list[list[tuple[float, float]]]]:
    b, q, geoms = p.read_bytes(), 100, []
    while q < len(b):
        _num, clen = struct.unpack(">2i", b[q:q + 8])
        c = b[q + 8:q + 8 + clen * 2]
        q += 8 + clen * 2
        tipo = struct.unpack("<i", c[:4])[0]
        if tipo == 0:
            geoms.append([])
            continue
        if tipo not in (5, 15, 25):
            falha(f"{p.name}: forma {tipo}, esperava polígono")
        npar, npts = struct.unpack("<2i", c[36:44])
        partes = list(struct.unpack(f"<{npar}i", c[44:44 + 4 * npar])) + [npts]
        k = 44 + 4 * npar
        pts = [struct.unpack("<2d", c[k + 16 * i:k + 16 * i + 16]) for i in range(npts)]
        geoms.append([pts[partes[i]:partes[i + 1]] for i in range(npar)])
    return geoms


# ---- geometria no formato do Atlas (o mesmo de decRing/decGeom do atlas.js) ---------
def area2(r):
    return sum(r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1] for i in range(len(r) - 1))


def dentro(x, y, r):
    d = False
    for i in range(len(r) - 1):
        (x1, y1), (x2, y2) = r[i], r[i + 1]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            d = not d
    return d


def dp(pts, tol):
    """Douglas-Peucker sobre uma linha aberta de pontos inteiros."""
    if len(pts) < 3:
        return pts[:]
    manter, pilha = {0, len(pts) - 1}, [(0, len(pts) - 1)]
    while pilha:
        i, j = pilha.pop()
        (x1, y1), (x2, y2) = pts[i], pts[j]
        dx, dy = x2 - x1, y2 - y1
        l2 = dx * dx + dy * dy
        dmax, kmax = -1.0, -1
        for k in range(i + 1, j):
            x, y = pts[k]
            if l2 == 0:
                d = math.hypot(x - x1, y - y1)
            else:
                d = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / math.sqrt(l2)
            if d > dmax:
                dmax, kmax = d, k
        if dmax > tol:
            manter.add(kmax)
            pilha += [(i, kmax), (kmax, j)]
    return [pts[k] for k in sorted(manter)]


def simplifica_anel(anel):
    pts = []
    for x, y in anel:
        p = (round(x * PREC), round(y * PREC))
        if not pts or p != pts[-1]:
            pts.append(p)
    if pts[0] != pts[-1]:
        pts.append(pts[0])
    if len(pts) < 5:
        return pts
    # anel fechado: corta no ponto mais distante do primeiro e simplifica as duas metades
    x0, y0 = pts[0]
    k = max(range(len(pts)), key=lambda i: (pts[i][0] - x0) ** 2 + (pts[i][1] - y0) ** 2)
    a, b = dp(pts[:k + 1], TOL), dp(pts[k:], TOL)
    s = a[:-1] + b
    return s if len(s) >= 4 else pts


def enc_num(v: int, out: list) -> None:
    r = (v << 1) if v >= 0 else ((~v) << 1) | 1
    while r >= 32:
        out.append(chr((32 | (r & 31)) + 63))
        r >>= 5
    out.append(chr(r + 63))


def enc_anel(pts) -> str:
    out, px, py = [], 0, 0
    for x, y in pts:
        enc_num(x - px, out)
        enc_num(y - py, out)
        px, py = x, y
    return "".join(out)


def geom_atlas(aneis):
    """Anéis do shapefile -> lista de polígonos [externo, buracos...] codificados."""
    ext, bur = [], []
    for r in aneis:
        if len(r) < 4:
            continue
        (ext if area2(r) < 0 else bur).append(r)      # shapefile: externo no sentido horário
    if not ext:
        ext, bur = bur, []
    polis = [[e] for e in ext]
    for h in bur:
        alvo = next((p for p in polis if dentro(h[0][0], h[0][1], p[0])), None)
        (alvo if alvo is not None else polis).append(h if alvo is not None else [h])
    return [[enc_anel(simplifica_anel(r)) for r in p] for p in polis], sum(len(r) for r in aneis)


def dec_anel(s: str) -> list[tuple[int, int]]:
    out, i, x, y = [], 0, 0, 0
    while i < len(s):
        vs = []
        for _ in range(2):
            r = sh = 0
            while True:
                b = ord(s[i]) - 63
                i += 1
                r |= (b & 31) << sh
                sh += 5
                if b < 32:
                    break
            vs.append(~(r >> 1) if r & 1 else r >> 1)
        x, y = x + vs[0], y + vs[1]
        out.append((x, y))
    return out


def area_mp(polis) -> float:
    """Área (em graus², sem sinal) de polígonos com buracos: externos menos buracos."""
    return sum(abs(area2(p[0])) - sum(abs(area2(h)) for h in p[1:]) for p in polis) / 2


def geom_atlas_cru(aneis):
    """Os mesmos polígonos de geom_atlas, sem simplificar (para conferir a área)."""
    ext = [r for r in aneis if len(r) >= 4 and area2(r) < 0]
    bur = [r for r in aneis if len(r) >= 4 and area2(r) >= 0]
    if not ext:
        ext, bur = bur, []
    polis = [[e] for e in ext]
    for h in bur:
        alvo = next((p for p in polis if dentro(h[0][0], h[0][1], p[0])), None)
        (alvo if alvo is not None else polis).append(h if alvo is not None else [h])
    return polis


def pontos_enc(mp) -> int:
    n = 0
    for p in mp:
        for r in p:
            i = 0
            while i < len(r):
                for _ in range(2):
                    while ord(r[i]) - 63 >= 32:
                        i += 1
                    i += 1
                n += 1
    return n


# ---- colunas no formato compacto do Atlas (o mesmo de decCol do atlas.js) -----------
def casas(v) -> int:
    for k in range(5):
        if abs(v * 10 ** k - round(v * 10 ** k)) < 1e-6:
            return k
    return 4


def dec_col(s: str, escala: float, n: int) -> list:
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
        out.append(None if v == 0 else (v - 1) / escala)
    return out


def enc_col(vals, escala) -> str:
    out = []
    for x in vals:
        enc_num(0 if x is None else int(round(x * escala)) + 1, out)
    return "".join(out)


def num(v):
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip().replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


# ---- dicionários ---------------------------------------------------------------------
FONTES_DIC: list[str] = []        # fontes dos registros administrativos; "f" é o índice aqui


def dicionarios(usadas: set[str]) -> dict:
    dic = {}

    def poe(s, n, u, dim, d, origem, **extra):
        s = str(s).strip()
        if not s:
            return
        if s in dic:                                  # já veio de um dicionário anterior: só a dimensão, se faltava
            if not dic[s]["dim"] and dim:
                dic[s]["dim"] = " ".join(str(dim).split())
            return
        o = {"n": " ".join(str(n or "").split()), "u": " ".join(str(u or "").split()),
             "dim": " ".join(str(dim or "").split()), "origem": origem}
        if s in RENDA_EM_REAIS and "mil" in o["u"].lower():
            o["u_original"], o["u"] = o["u"], "R$ de 01/08/2010"
        if s in usadas and d:
            o["d"] = " ".join(str(d).split())[:700]
        o.update({k: v for k, v in extra.items() if v not in (None, "")})
        dic[s] = o

    _, rad = tabela(planilha(acha("adh_radar_metadados_*.xlsx"))["Metadados"])
    for r in rad:
        if r.get("SIGLA"):
            pol = str(r.get("POLARIDADE") or "")
            poe(r["SIGLA"], r.get("DENOMINAÇÃO"), r.get("UNIDADE DE MEDIDA"), None,
                f"{r.get('DESCRIÇÃO') or ''} {r.get('FÓRMULA DE CÁLCULO') or ''}", "radar",
                dec=r.get("CASAS DECIMAIS"),
                pol=("+" if pol.lower().startswith("quanto maior") else "-" if pol.lower().startswith("quanto menor") else None))
    ce = list(planilha(acha("censo_metadados_*.xlsx")).values())[0]
    _, cen = tabela(ce)
    for r in cen:
        if r.get("SIGLA"):
            poe(r["SIGLA"], r.get("NOME DO INDICADOR"), r.get("UNIDADE"), r.get("Dimensão"),
                r.get("DEFINIÇÃO"), "censo")
    ra = list(planilha(acha("reg_adm_metadados_*.xlsx")).values())[0]
    _, reg = tabela(ra)
    for r in reg:
        if r.get("SIGLA"):
            f = " ".join(str(r.get("FONTE") or "").split())[:400]
            if f and f not in FONTES_DIC:
                FONTES_DIC.append(f)
            poe(r["SIGLA"], r.get("NOME DO INDICADOR"), r.get("UNIDADE"), r.get("DIMENSÃO"),
                r.get("DEFINIÇÃO"), "regadm", per=r.get("PERIODICIDADE"),
                f=FONTES_DIC.index(f) if f else None)
    base_dic = acha("*DICION*.xlsx")
    _, bd = tabela(list(planilha(base_dic).values())[0])
    for r in bd:
        if r.get("SIGLA"):
            poe(r["SIGLA"], r.get("NOME"), None, None, r.get("DEFINIÇÃO"), "base")
    # a polaridade do Radar vale para a mesma sigla do censo
    return dic


# ---- conferências ---------------------------------------------------------------------
def confere_idhm(rotulo: str, r: dict, completos: bool) -> None:
    """IDHM = média geométrica dos subíndices, e cada subíndice sai do seu indicador."""
    pub = {k: num(r.get(k)) for k in ("IDHM", "IDHM_L", "IDHM_R", "IDHM_E", "ESPVIDA", "RDPC",
                                     "I_FREQ_PROP", "I_ESCOLARIDADE")}
    if pub["IDHM"] is None:
        return
    L, R, E = pub["IDHM_L"], pub["IDHM_R"], pub["IDHM_E"]
    if None in (L, R, E):
        falha(f"{rotulo}: IDHM sem os três subíndices")
    if abs(round((L * R * E) ** (1 / 3), 3) - pub["IDHM"]) > 0.0015:
        falha(f"{rotulo}: IDHM {pub['IDHM']} não é a média geométrica de {L}, {R} e {E}")
    if pub["ESPVIDA"] is not None and abs(min(1, (pub["ESPVIDA"] - 25) / 60) - L) > 0.0015:
        falha(f"{rotulo}: IDHM Longevidade {L} não confere com a esperança de vida {pub['ESPVIDA']}")
    if pub["RDPC"] is not None and abs(min(1, math.log(pub["RDPC"] / 8) / math.log(4033 / 8)) - R) > 0.0015:
        falha(f"{rotulo}: IDHM Renda {R} não confere com a renda per capita {pub['RDPC']}")
    if completos and pub["I_FREQ_PROP"] is not None and pub["I_ESCOLARIDADE"] is not None:
        e = (pub["I_FREQ_PROP"] ** 2 * pub["I_ESCOLARIDADE"]) ** (1 / 3)
        if abs(e - E) > 0.0015:
            falha(f"{rotulo}: IDHM Educação {E} não confere com os subíndices de frequência e escolaridade")
        f4 = [num(r.get(k)) for k in ("T_FREQ5A6", "T_FUND11A13", "T_FUND15A17", "T_MED18A20")]
        if None not in f4 and abs(sum(f4) / 400 - pub["I_FREQ_PROP"]) > 0.0015:
            falha(f"{rotulo}: subíndice de frequência não é a média dos quatro indicadores")
        t18 = num(r.get("T_FUND18M"))
        if t18 is not None and abs(t18 / 100 - pub["I_ESCOLARIDADE"]) > 0.0015:
            falha(f"{rotulo}: subíndice de escolaridade não é o % de 18+ com fundamental")


# ---- montagem ---------------------------------------------------------------------------
def main() -> None:
    if not FONTES.exists():
        falha(f"crie {FONTES} e ponha nela os arquivos da biblioteca do Atlas Brasil")
    print("· Atlas Brasil: lendo as bases da biblioteca")
    prepara_rm()
    nucleo = le_js("dados-nucleo.js")
    cods = [str(c) for c in nucleo["munis"]["ids"]]
    nomes_mun = nucleo["munis"]["nomes"]
    cod6 = {c[:6]: c for c in cods}
    adh = le_js("dados-ipea.js")["adh"]
    j2000, j2010 = adh["anos"].index(2000), adh["anos"].index(2010)

    arqs = {
        "udh": acha("*Base UDH*.xlsx"), "regional": acha("*Base REGIONAL*.xlsx"),
        "rms": acha("*Base 20 RMs*.xlsx"), "dicionario": acha("*DICION*.xlsx"),
        "shp_udh": acha("*UDH_region.shp"), "dbf_udh": acha("*UDH_region.dbf"),
        "radar": acha("adh_radar_base_*.xlsx"), "radar_meta": acha("adh_radar_metadados_*.xlsx"),
        "censo_meta": acha("censo_metadados_*.xlsx"), "regadm_meta": acha("reg_adm_metadados_*.xlsx"),
    }

    # ---- UDH ----
    cab_u, U = tabela(list(planilha(arqs["udh"]).values())[0])
    falt = [c for c in CAMPOS_UDH + ["UDH_Atlas", "NOME_UDH", "CODMUN6", "ANO"] if c not in cab_u]
    if falt:
        falha(f"base UDH sem as colunas {falt}")
    por_ano = {2000: {}, 2010: {}}
    for r in U:
        a = int(num(r["ANO"]))
        if a not in por_ano:
            falha(f"base UDH com o ano {a}; esperava 2000 e 2010")
        uid = str(r["UDH_Atlas"]).split(".")[0]
        if uid in por_ano[a]:
            falha(f"UDH {uid} repetida em {a}")
        por_ano[a][uid] = r
    if set(por_ano[2000]) != set(por_ano[2010]):
        falha("as UDHs de 2000 não são as mesmas de 2010")
    dbf = le_dbf(arqs["dbf_udh"])
    shp = le_shp(arqs["shp_udh"])
    if len(dbf) != len(shp):
        falha("shapefile das UDHs: .dbf e .shp com números de feições diferentes")
    feicao = {}
    for d, g in zip(dbf, shp):
        uid = d.get("UDH_ATLAS", "").split(".")[0]
        if uid in feicao:
            falha(f"UDH {uid} repetida no shapefile")
        feicao[uid] = (d, g)
    if set(feicao) != set(por_ano[2010]):
        falha(f"UDHs do shapefile ({len(feicao)}) diferentes das da base ({len(por_ano[2010])})")
    print(f"  {len(feicao)} UDHs na base e no shapefile, iguais nos dois anos")

    ids = []
    for c in cods:
        us = sorted(u for u, r in por_ano[2010].items() if str(r["CODMUN6"]).split(".")[0] == c[:6])
        if not us:
            falha(f"nenhuma UDH de {c}")
        for u in us:
            if feicao[u][0].get("CD_GEOCODM") != c:
                falha(f"UDH {u}: município {feicao[u][0].get('CD_GEOCODM')} no shapefile, {c} na base")
        ids += us
    dif2000 = 0
    for k, c in enumerate(cods):
        for a, j in ((2010, j2010), (2000, j2000)):
            soma = sum(num(por_ano[a][u]["PESOTOT"]) or 0 for u in ids if cod6[u[1:7]] == c)
            ref = adh["valores"]["populacao"][c][j]
            dif = abs(soma - ref)
            if (a == 2010 and dif > 0.5) or (a == 2000 and dif > 0.0002 * ref):
                falha(f"{nomes_mun[k]} {a}: UDHs somam {soma:,.0f} pessoas, o Atlas Brasil publica {ref:,.0f}")
            if a == 2000:
                dif2000 = max(dif2000, dif)
    print(f"  {len(ids)} UDHs nos sete municípios; a população soma a do município em 2010 (exata) e em 2000 "
          f"(diferença máxima de {dif2000:,.0f} pessoas)")
    # A soma ponderada das UDHs (pelo denominador de cada taxa) contra o valor municipal publicado pelo
    # Atlas Brasil. Não é conferência de igualdade: o Atlas Brasil calcula as UDHs e os municípios em
    # separado. Fica registrada para a Metodologia mostrar a diferença.
    AGREGA = [("RDPC", "POP", "renda_pc"), ("PMPOB", "POP", "prop_pobreza"), ("PIND", "POP", "prop_pobreza_extrema"),
              ("T_FUND18M", "PESO18", "taxa_fundamental_18_mais"), ("T_ANALF15M", "PESO15", "taxa_analfabetismo_15_mais")]
    agregado = []
    for s, peso, col in AGREGA:
        for c in cods:
            us = [por_ano[2010][u] for u in ids if cod6[u[1:7]] == c]
            pares = [(num(r[s]), num(r[peso])) for r in us if num(r[s]) is not None and num(r[peso])]
            d = sum(w for _, w in pares)
            ref = (adh["valores"].get(col) or {}).get(c, [None] * 3)[j2010]
            if d and ref is not None:
                agregado.append({"sigla": s, "peso": peso, "muni": c, "udh": round(sum(v * w for v, w in pares) / d, 2), "municipio": ref})
    sem_idhm_2000 = sum(1 for u in ids if num(por_ano[2000][u]["IDHM"]) is None)
    for a in (2000, 2010):
        for u in por_ano[a]:                          # a base inteira, não só os sete municípios
            confere_idhm(f"UDH {u} ({a})", por_ano[a][u], True)

    geoms, n_orig = [], 0
    for u in ids:
        mp, n = geom_atlas(feicao[u][1])
        geoms.append(mp)
        n_orig += n
    n_simpl = sum(pontos_enc(g) for g in geoms)
    # área em km² (a ~30° S): 1 grau² ≈ 111,32² × cos(30°) km²
    km2 = 111.32 * 111.32 * 0.866
    pior, pior_abs = 0.0, 0.0
    for u, mp in zip(ids, geoms):
        orig = geom_atlas_cru(feicao[u][1])
        a0 = area_mp(orig) * km2
        a1 = area_mp([[[(x / PREC, y / PREC) for x, y in dec_anel(r)] for r in p] for p in mp]) * km2
        if a0 <= 0:
            falha(f"UDH {u}: geometria sem área no shapefile")
        d = abs(a1 - a0)
        # limite: 2% da área ou 0,002 km² (2.000 m², o que 3 m de borda movem numa UDH pequena)
        if d > max(0.02 * a0, 0.002):
            falha(f"UDH {u}: a simplificação mudou a área de {a0:.4f} para {a1:.4f} km²")
        pior, pior_abs = max(pior, d / a0), max(pior_abs, d)
    print(f"  geometria: {n_orig:,} pontos no shapefile, {n_simpl:,} depois de simplificar; "
          f"área de cada UDH muda no máximo {100 * pior:.1f}% ({1e6 * pior_abs:,.0f} m²)")

    # ---- regiões de Porto Alegre e RMs ----
    _, R = tabela(list(planilha(arqs["regional"]).values())[0])
    regs = {}
    for r in R:
        regs.setdefault(str(r["Cod_Reg"]).split(".")[0], {})[int(num(r["ANO"]))] = r
    reg_de = {u: feicao[u][0].get("REGIONAL", "") for u in ids}
    for cr, anos in regs.items():
        for a in (2000, 2010):
            if a not in anos:
                falha(f"região {cr} sem {a}")
            soma = sum(num(por_ano[a][u]["PESOTOT"]) or 0 for u in ids if reg_de[u] == cr)
            ref = num(anos[a]["PESOTOT"])
            if (a == 2010 and abs(soma - ref) > 0.5) or abs(soma - ref) > 0.0005 * ref:
                falha(f"região {anos[a]['NOME_REG']} {a}: UDHs somam {soma:,.0f}, a base da região diz {ref:,.0f}")
            confere_idhm(f"região {anos[a]['NOME_REG']} ({a})", anos[a], False)
    sem_reg = [u for u in ids if u[1:7] == "431490" and reg_de[u] not in regs]
    if sem_reg:
        falha(f"UDHs de Porto Alegre sem região: {sem_reg[:5]}")
    print(f"  {len(regs)} regiões de Porto Alegre; cada uma soma as suas UDHs")

    _, M = tabela(list(planilha(arqs["rms"]).values())[0])
    rms = {}
    for r in M:
        rms.setdefault(str(r["CODRM"]).split(".")[0], {})[int(num(r["ANO"]))] = r
    for cr, anos in rms.items():
        for a, r in anos.items():
            confere_idhm(f"{r['NOME_RM']} ({a})", r, False)
    rm_poa = next((c for c, an in rms.items() if "Porto Alegre" in str(an[2010]["NOME_RM"])), None)
    if not rm_poa:
        falha("a base das RMs não tem a RM de Porto Alegre")
    for a in (2000, 2010):
        soma = sum(num(r["PESOTOT"]) or 0 for r in por_ano[a].values())
        ref = num(rms[rm_poa][a]["PESOTOT"])
        if (a == 2010 and abs(soma - ref) > 0.5) or abs(soma - ref) > 0.0005 * ref:
            falha(f"RM de Porto Alegre {a}: as UDHs das 34 cidades somam {soma:,.0f}, a base diz {ref:,.0f}")
    print(f"  {len(rms)} RMs; a de Porto Alegre soma as UDHs das 34 cidades")

    # ---- colunas compactas ----
    escalas = []
    for c in CAMPOS_UDH:
        vs = [num(r[c]) for a in (2000, 2010) for r in por_ano[a].values()]
        vs += [num(an[a].get(c)) for an in list(regs.values()) + list(rms.values()) for a in an]
        escalas.append(10 ** max([casas(v) for v in vs if v is not None] or [0]))

    def colunas(linhas_por_ano):
        out = {}
        for a, ls in linhas_por_ano.items():
            out[str(a)] = []
            for k, c in enumerate(CAMPOS_UDH):
                orig = [num(r.get(c)) for r in ls]
                s = enc_col(orig, escalas[k])
                volta = dec_col(s, escalas[k], len(orig))
                for x, y in zip(orig, volta):
                    if (x is None) != (y is None) or (x is not None and abs(x - y) > 0.5 / escalas[k]):
                        falha(f"{c} {a}: o formato compacto não devolve o valor {x} ({y})")
                out[str(a)].append(s)
        return out

    udh = {"anos": [2000, 2010], "prec": PREC, "campos": CAMPOS_UDH, "escalas": escalas, "ids": ids,
           "nomes": [" ".join(str(por_ano[2010][u]["NOME_UDH"]).split()) for u in ids],
           "muni": [cod6[u[1:7]] for u in ids], "reg": [reg_de[u] if u[1:7] == "431490" else "" for u in ids],
           "geom": geoms, "v": colunas({a: [por_ano[a][u] for u in ids] for a in (2000, 2010)})}
    ordem_reg = sorted(regs)
    regional = {"anos": [2000, 2010], "campos": CAMPOS_UDH, "escalas": escalas, "ids": ordem_reg,
                "nomes": [" ".join(str(regs[c][2010]["NOME_REG"]).split()) for c in ordem_reg],
                "muni": "4314902", "v": colunas({a: [regs[c][a] for c in ordem_reg] for a in (2000, 2010)})}
    ordem_rm = sorted(rms, key=lambda c: int(c))
    rms_out = {"anos": [2000, 2010], "campos": CAMPOS_UDH, "escalas": escalas, "ids": ordem_rm,
               "nomes": [" ".join(str(rms[c][2010]["NOME_RM"]).split()) for c in ordem_rm], "poa": rm_poa,
               "v": colunas({a: [rms[c][a] for c in ordem_rm] for a in (2000, 2010)})}

    # ---- Radar IDHM ----
    abas = planilha(arqs["radar"])
    for nome in ("Total", "Sexo", "Cor"):
        if nome not in abas:
            falha(f"base do Radar sem a aba {nome}")
        if nome + " B" in abas and abas[nome + " B"] != abas[nome]:
            falha(f"Radar: a aba '{nome} B' não repete a aba '{nome}'")
    cab_t, T = tabela(abas["Total"])
    anos_r = sorted({int(num(r["ANO"])) for r in T})
    campos_r = [c for c in cab_t if c and c not in ("ANO", "AGREGACAO", "CODIGO", "NOME")]

    def chave(r):
        ag, nome = str(r["AGREGACAO"]), str(r["NOME"])
        if ag == "Brasil":
            return "br"
        if ag.startswith("Unidade") and str(r["CODIGO"]).split(".")[0] == "43":
            return "rs"
        if ag.startswith("Região Metropolitana") and "Porto Alegre" in nome:
            return "rm_poa"
        if ag.startswith("Região Metropolitana"):
            return "rm_" + str(r["CODIGO"]).split(".")[0]
        return None

    nomes_r, serie = {}, {}
    for r in T:
        k = chave(r)
        if not k:
            continue
        nomes_r[k] = " ".join(str(r["NOME"]).split())
        a = anos_r.index(int(num(r["ANO"])))
        cs = campos_r if k in ("br", "rs", "rm_poa") else RADAR_RMS
        for c in cs:
            serie.setdefault(k, {}).setdefault(c, [None] * len(anos_r))[a] = num(r.get(c))
        confere_idhm(f"Radar {nomes_r[k]} {anos_r[a]}", r, False)
    for k in ("br", "rs", "rm_poa"):
        if k not in serie or any(v is None for v in serie[k]["IDHM"]):
            falha(f"Radar sem o IDHM de {k} em todos os anos")

    def desagregado(aba, col):
        cab, L = tabela(abas[aba])
        cs = [c for c in cab if c and c not in ("ANO", "AGREGACAO", "CODIGO", "NOME", col)]
        out = {}
        for r in L:
            k = chave(r)
            if k != "rm_poa":
                continue
            a = anos_r.index(int(num(r["ANO"])))
            g = str(r[col]).strip()
            for c in cs:
                out.setdefault(k, {}).setdefault(g, {}).setdefault(c, [None] * len(anos_r))[a] = num(r.get(c))
            confere_idhm(f"Radar {aba} {g} {k} {anos_r[a]}", r, False)
        if len(out.get("rm_poa", {})) != 2:
            falha(f"Radar, aba {aba}: a RM de Porto Alegre sem os dois grupos")
        return out

    radar = {"anos": anos_r, "campos": campos_r, "rms_campos": RADAR_RMS, "nomes": nomes_r, "v": serie,
             "sexo": desagregado("Sexo", "SEXO"), "cor": desagregado("Cor", "COR")}
    print(f"  Radar IDHM: {anos_r[0]} a {anos_r[-1]}, {len(campos_r)} indicadores, "
          f"{sum(1 for k in serie if k.startswith('rm_'))} RMs; IDHM confere com os subíndices")

    # ---- dicionário ----
    usadas = set(CAMPOS_UDH) | set(campos_r) | set(RADAR_RMS)
    dic = dicionarios(set(CAMPOS_UDH) | set(RADAR_RMS))
    sem_nome = sorted(c for c in usadas if c not in dic)
    if sem_nome:
        falha(f"siglas sem entrada nos dicionários: {sem_nome}")

    arquivos = [{"papel": k, "nome": p.name, "bytes": p.stat().st_size, "sha256": sha256(p)} for k, p in arqs.items()]
    z = acha("dados_pa*.zip", False)
    if z:
        arquivos.append({"papel": "zip_rm", "nome": z.name, "bytes": z.stat().st_size, "sha256": sha256(z)})
    conferencia = {
        "udh_rm": len(feicao), "udh_sete": len(ids), "regioes": len(regs), "rms": len(rms),
        "pop2010_exata": True, "pop2000_dif_max": round(dif2000), "sem_idhm_2000": sem_idhm_2000,
        "pontos_shapefile": n_orig, "pontos_atlas": n_simpl, "area_dif_max_pct": round(100 * pior, 2),
        "idhm_formula": "IDHM, subíndices, esperança de vida e renda per capita conferidos em todas as linhas (UDH, região, RM e Radar)",
        "agregado": agregado,
    }
    saida = {
        "versao": 1, "gerado_em": date.today().isoformat(), "conferencia": conferencia,
        "fonte": {"n": "Atlas do Desenvolvimento Humano no Brasil (PNUD, IPEA e FJP)",
                  "u": "https://www.atlasbrasil.org.br/acervo/biblioteca"},
        "arquivos": arquivos, "dic": dic, "dic_fontes": FONTES_DIC, "udh": udh, "regional": regional, "rms": rms_out, "radar": radar,
    }
    texto = "window.ATLAS_ATLASBR=" + json.dumps(saida, ensure_ascii=False, separators=(",", ":")) + ";\n"
    SAIDA.write_text(texto, encoding="utf-8")
    partes = {k: len(json.dumps(saida[k], ensure_ascii=False, separators=(",", ":"))) for k in ("dic", "udh", "regional", "rms", "radar")}
    print(f"✓ {SAIDA.relative_to(RAIZ)}: {len(texto.encode()) / 1024:,.0f} KB "
          f"({', '.join(f'{k} {v / 1024:,.0f} KB' for k, v in partes.items())})")


if __name__ == "__main__":
    main()
