"""Grava pontos-oportunidade.csv e municipios-oportunidade.csv a partir do analise.json.

    python3 exporta_csv.py analise.json
"""
import csv, json, sys

R = json.load(open(sys.argv[1], encoding='utf-8'))
with open('pontos-oportunidade.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['ordem', 'uf', 'municipio', 'bairro_ibge', 'bairro_cnes_farmacia_mais_proxima', 'lat', 'lon', 'moradores_perfil_sem_panvel_1km',
                'moradores_1km', 'renda_media_responsavel_1km', 'pct_60mais_1km', 'raia_drogasil_1km', 'pague_menos_1km', 'panvel_mais_proxima_km'])
    for i, h in enumerate(R['pontos'], 1):
        w.writerow([i, h['uf'], h['mun'], h['bairro'], h['ref_cnes'], h['lat'], h['lon'], round(h['perfil_sem_panvel_1km']), round(h['moradores_1km']),
                    round(h['renda_1km'], 2), round(h['p60_1km'], 2), h['rd_1km'], h['pm_1km'], round(h['panvel_mais_proxima_km'], 2)])
with open('municipios-oportunidade.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['uf', 'municipio', 'populacao_2022', 'renda_media_responsavel', 'pct_60mais', 'moradores_perfil', 'moradores_perfil_sem_panvel_1km',
                'lojas_panvel', 'lojas_raia_drogasil', 'lojas_pague_menos'])
    for m in R['municipios']:
        w.writerow([m['uf'], m['mun'], round(m['pop']), round(m['renda'], 2), round(m['p60'], 2), round(m['perfil']), round(m['perfil_sem_panvel']),
                    m['panvel'], m['rd'], m['pm']])
print(len(R['pontos']), len(R['municipios']))
