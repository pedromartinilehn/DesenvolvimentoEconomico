"""Registros ativos da Dimed (Panvel) no CNES que não são do tipo farmácia (43).

O atlas só conta como loja o estabelecimento ativo do tipo 43. A Dimed tem mais quatro
registros ativos com o nome PANVEL FARMACIAS cadastrados em outros tipos (centro de
imunização, clínica, consultório, pronto atendimento). O de Balneário Camboriú é o único
registro da rede na cidade, embora a cidade tenha várias lojas abertas (Google Maps,
nov/2026). Para não marcar como vazia uma cidade onde a Panvel está, estes registros
entram na análise como pontos da Panvel, exceto quando já há uma loja tipo 43 a até 150 m.
"""
import pathlib
import numpy as np
import pyarrow.parquet as pq

COLS = ['code_muni', 'name_muni', 'co_cnes', 'nu_cnpj', 'no_fantasia', 'tp_unidade', 'co_motivo_desab',
        'logradouro', 'numero_endereco', 'bairro', 'lat_cnes', 'lon_cnes']


def lojas_extra(ext: pathlib.Path, lojas: list, raio_m: float = 150) -> list:
    t = pq.read_table(ext / 'fontes/geobr_prep/healthfacilities_202604.parquet', columns=COLS).to_pylist()
    ext_ = [r for r in t if str(r['nu_cnpj'] or '')[:8] == '92665611' and r['co_motivo_desab'] is None
            and int(r['tp_unidade']) != 43 and r['lat_cnes'] is not None]
    pv = np.array([(l['y'], l['x']) for l in lojas if l['rede'] == 'panvel'])
    out = []
    for r in ext_:
        la, lo = r['lat_cnes'], r['lon_cnes']
        dy = (pv[:, 0] - la) * 111195; dx = (pv[:, 1] - lo) * 111195 * np.cos(np.radians(la))
        dmin = float(np.sqrt(dx ** 2 + dy ** 2).min())
        mun = int(r['code_muni'])
        out.append({'cnes': r['co_cnes'], 'cnpj': r['nu_cnpj'], 'rede': 'panvel', 'marca': 'Panvel',
                    'fantasia': r['no_fantasia'], 'end': f"{r['logradouro']}, {r['numero_endereco']}",
                    'mun': mun, 'uf': mun // 100000, 'x': lo, 'y': la, 'tp_unidade': int(r['tp_unidade']),
                    'dist_loja43_m': round(dmin), 'entra': dmin > raio_m, 'nome_muni': r['name_muni']})
    return out


if __name__ == '__main__':
    import json, sys
    ext = pathlib.Path(sys.argv[1])
    L = json.load(open(ext / 'fontes/intermediario/lojas.json', encoding='utf-8'))['lojas']
    for d in lojas_extra(ext, L):
        print(d['nome_muni'], d['cnes'], d['tp_unidade'], d['end'], d['dist_loja43_m'], 'entra' if d['entra'] else 'duplicada')
