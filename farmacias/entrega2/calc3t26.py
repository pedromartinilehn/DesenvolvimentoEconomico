"""Indicadores da Panvel em 30/09/2026 × 30/09/2025 (IFRS, release 3T26) e 9M26 × 9M25, no método da Entrega 2."""
import json
# Balanço IFRS (R$ mil), release 3T26, colunas IFRS
BP = {
 'set25': dict(caixa=48390, aplic=343751, clientes=484412, estoques=1132244, AC=2145644, imob=609341, du=632548, intang=106232, ANC=1437477, AT=3583121,
               forn=625486, empCP=109047, arrCP=132249, divCP=24207, PC=1124751, empLP=588310, arrLP=575184, PNC=1194200, PL=1264170, salarios=108443, impostos=48962),
 'set26': dict(caixa=29826, aplic=199581, clientes=585035, estoques=1271688, AC=2227646, imob=642083, du=708492, intang=111369, ANC=1543931, AT=3771577,
               forn=699701, empCP=131266, arrCP=141792, divCP=49276, PC=1324876, empLP=418343, arrLP=653013, PNC=1104914, PL=1341787, salarios=121137, impostos=82650),
}
# saldos de dezembro (R$ mi) da própria Entrega 2
DEZ = {'dez24': dict(estoques=1151.5, clientes=444.7, forn=630.8, imob_intang=1270.7, CCL=827.9),
       'dez25': dict(estoques=1166.6, clientes=574.2, forn=725.3, imob_intang=1443.9, CCL=976.9)}
# DRE IFRS (R$ mil)
DRE = {
 '3T25': dict(RB=1479487, RL=1373996, CMV=-926961, LB=447035, vendas=-340820, ga=-41036, outras=4104, fin=-27509, LAIR=41774, IR=-10472, LL=31302),
 '3T26': dict(RB=1705175, RL=1573534, CMV=-1063593, LB=509941, vendas=-384591, ga=-49857, outras=7327, fin=-32630, LAIR=50190, IR=-8042, LL=42148),
 '9M25': dict(RB=4249910, RL=3946430, CMV=-2664795, LB=1281635, vendas=-991137, ga=-132340, outras=19549, fin=-79055, LAIR=98652, IR=-16794, LL=81858, desp_fin=-121796),
 '9M26': dict(RB=4911282, RL=4532345, CMV=-3065791, LB=1466554, vendas=-1111909, ga=-154838, outras=17659, fin=-94741, LAIR=122725, IR=-16975, LL=105750, desp_fin=-129019),
}
# DFC IFRS 9M (R$ mil)
DFC = {'9M25': dict(FCO=346315, imob=-96779, intang=-29164, arr_princ=-99183, arr_juros=-51842, DA=173482),
       '9M26': dict(FCO=286774, imob=-81033, intang=-25626, arr_princ=-100662, arr_juros=-60592, DA=187593)}
mi = lambda v: v / 1000
R = {}
for k, b in BP.items():
    b = {x: mi(v) for x, v in b.items()}
    g = {}
    g['caixa_aplic'] = b['caixa'] + b['aplic']
    g['clientes'], g['estoques'] = b['clientes'], b['estoques']
    g['outros_AC'] = b['AC'] - g['caixa_aplic'] - b['clientes'] - b['estoques']
    g['AC'] = b['AC']; g['imob_du'] = b['imob'] + b['du']; g['intang'] = b['intang']
    g['outros_ANC'] = b['ANC'] - g['imob_du'] - b['intang']; g['ANC'] = b['ANC']; g['AT'] = b['AT']
    g['forn'], g['empCP'], g['arrCP'] = b['forn'], b['empCP'], b['arrCP']
    g['outros_PC'] = b['PC'] - b['forn'] - b['empCP'] - b['arrCP']; g['PC'] = b['PC']
    g['empLP'], g['arrLP'] = b['empLP'], b['arrLP']; g['outros_PNC'] = b['PNC'] - b['empLP'] - b['arrLP']; g['PNC'] = b['PNC']; g['PL'] = b['PL']
    g['ACO'] = b['AC'] - g['caixa_aplic']; g['PCO'] = b['PC'] - b['empCP'] - b['arrCP'] - b['divCP']
    g['NCG'] = g['ACO'] - g['PCO']; g['CDG'] = b['PL'] + b['PNC'] - b['ANC']; g['T'] = g['CDG'] - g['NCG']
    g['LC'] = b['AC'] / b['PC']; g['LS'] = (b['AC'] - b['estoques']) / b['PC']
    g['end_total'] = 100 * (b['PC'] + b['PNC']) / b['AT']; g['div_cp'] = (b['PC'] + b['PNC']) / b['PL']
    g['CCL'] = b['AC'] - b['PC']; g['imob_intang'] = b['imob'] + b['du'] + b['intang']
    g['salarios'], g['impostos'] = b['salarios'], b['impostos']
    R[k] = g
for k, d in DRE.items():
    d = {x: mi(v) for x, v in d.items()}
    d['EBIT'] = d['LAIR'] - d['fin']
    R[k] = d
# indicadores 9M (não anualizados)
for y, s, dz in (('9M25', 'set25', 'dez24'), ('9M26', 'set26', 'dez25')):
    d, b, z = R[y], R[s], DEZ[dz]
    d['lucratividade'] = 100 * d['LL'] / d['RL']; d['giro'] = d['RL'] / b['AT']; d['ROA'] = 100 * d['LL'] / b['AT']; d['ROE'] = 100 * d['LL'] / b['PL']
    d['cob_juros'] = d['EBIT'] / -d['desp_fin']
    em, cm, fm = (z['estoques'] + b['estoques']) / 2, (z['clientes'] + b['clientes']) / 2, (z['forn'] + b['forn']) / 2
    compras = -d['CMV'] + b['estoques'] - z['estoques']
    d['PMRE'] = em / -d['CMV'] * 270; d['PMRV'] = cm / d['RB'] * 270; d['PMPC'] = fm / compras * 270
    d['CO'] = d['PMRE'] + d['PMRV']; d['CF'] = d['CO'] - d['PMPC']
    d['calc'] = dict(em=em, cm=cm, fm=fm, compras=compras)
    f = {x: mi(v) for x, v in DFC[y].items()}
    d['FCO_aula'] = d['EBIT'] + f['DA'] + d['IR']
    d['GC'] = b['imob_intang'] - z['imob_intang'] + f['DA']
    d['dCCL'] = b['CCL'] - z['CCL']
    d['FCA'] = d['FCO_aula'] - d['GC'] - d['dCCL']
    d['DA'] = f['DA']
    d['DFC_FCO'] = f['FCO']; d['capex'] = -(f['imob'] + f['intang']); d['arrend'] = -(f['arr_princ'] + f['arr_juros'])
    d['livre'] = f['FCO'] - d['capex'] - d['arrend']
R['dez_caixa'] = {'dez24': 213.4, 'dez25': 430.5}
for y, s, dz in (('9M25', 'set25', 'dez24'), ('9M26', 'set26', 'dez25')):
    d = R[y]; d['dcaixa'] = R[s]['caixa_aplic'] - R['dez_caixa'][dz]; d['FCA_sem_caixa'] = d['FCA'] + d['dcaixa']
json.dump(R, open('n3t26.json', 'w'), indent=1)
for k in ('set25', 'set26'):
    print(k, {x: round(v, 2) for x, v in R[k].items()})
for k in ('3T25', '3T26', '9M25', '9M26'):
    print(k, {x: (round(v, 2) if isinstance(v, float) else v) for x, v in R[k].items() if x != 'calc'})
print(R['9M25']['calc'], R['9M26']['calc'])
