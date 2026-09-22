/* ══════════════════════════════════════════════════════════════════════════
   ATLAS SOCIOECONÔMICO INTERATIVO DE PORTO ALEGRE
   Organização conceitual dos módulos (equivalente a dados/*.json + src/*.js):
     FONTES        catálogo de fontes oficiais
     INDICADORES   catálogo de indicadores (id, unidade, fonte, ano, nível, status)
     DADOS         valores por território  ── censo2022.json, rais.json, ...
     GEO           malhas geográficas      ── bairros.geojson, setores.geojson
     MAPA / UI / INGESTAO
   ══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────── 1. FONTES ───── */
const FONTES = {
  CENSO22:{n:'IBGE — Censo Demográfico 2022, Agregados por Setores Censitários',s:'Censo/IBGE',
    u:'https://www.ibge.gov.br/estatisticas/sociais/populacao/22827-censo-demografico-2022.html',
    d:'Resultados do universo agregados por setor censitário: Básico, Pessoas, Domicílios, Óbitos, Indígenas, Quilombolas e Responsável/Renda. Obtidos pela distribuição do pacote censobr (IPEA), que republica os arquivos originais do IBGE.'},
  CENSO22_OP:{n:'IBGE / ObservaPOA — População por bairro, Censo 2022',s:'Censo/IBGE · ObservaPOA',
    u:'https://prefeitura.poa.br/smpg/observapoa/censo-2022',
    d:'População residente por bairro, ajustada aos limites da Lei 12.112/2016 em parceria IBGE–SMPAE. Elaboração CAPPR/DPEMR/SMPAE/PMPA.'},
  SMURB:{n:'SMUrb/PMPA — Malha de bairros de Porto Alegre',s:'SMUrb/PMPA',
    u:'https://gis-smamus.portoalegre.rs.gov.br/server/rest/services/A02_SOLO_CRIADO/bairros/MapServer',
    d:'Limites definidos pela Lei Municipal nº 12.112, de 22/08/2016. Base aerofotogramétrica 1:1.000, SIRGAS2000.'},
  IBGE_MALHA:{n:'IBGE — Malha de setores censitários 2022',s:'IBGE',
    u:'https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais',d:''},
  IBGE_CID:{n:'IBGE — Cidades@ / Panorama municipal',s:'IBGE',
    u:'https://www.ibge.gov.br/cidades-e-estados/rs/porto-alegre.html',d:''},
  PIB:{n:'IBGE — PIB dos Municípios',s:'IBGE',u:'https://cidades.ibge.gov.br/brasil/rs/porto-alegre/pesquisa/38/46996',d:''},
  SIDRA:{n:'IBGE — SIDRA',s:'SIDRA/IBGE',u:'https://sidra.ibge.gov.br/',d:''},
  CEMPRE:{n:'IBGE — CEMPRE (Cadastro Central de Empresas)',s:'CEMPRE/IBGE',u:'https://sidra.ibge.gov.br/pesquisa/cempre',d:''},
  PNADC:{n:'IBGE — PNAD Contínua',s:'PNADC/IBGE',u:'https://www.ibge.gov.br/estatisticas/sociais/trabalho/9171',d:''},
  FAVELAS:{n:'IBGE — Favelas e Comunidades Urbanas',s:'IBGE',
    u:'https://www.ibge.gov.br/geociencias/organizacao-do-territorio/tipologias-do-territorio/15788-favelas-e-comunidades-urbanas.html',d:''},
  PAM:{n:'IBGE — Produção Agrícola Municipal',s:'PAM/IBGE',u:'https://sidra.ibge.gov.br/pesquisa/pam',d:''},
  PPM:{n:'IBGE — Pesquisa Pecuária Municipal',s:'PPM/IBGE',u:'https://sidra.ibge.gov.br/pesquisa/ppm',d:''},
  CAGRO:{n:'IBGE — Censo Agropecuário',s:'IBGE',u:'https://sidra.ibge.gov.br/pesquisa/censo-agropecuario',d:''},
  CADUNICO:{n:'MDS — Cadastro Único',s:'CadÚnico/MDS',u:'https://cecad.cidadania.gov.br/',d:''},
  BOLSA:{n:'MDS — Programa Bolsa Família',s:'PBF/MDS',u:'https://aplicacoes.mds.gov.br/sagi/vis/data3/',d:''},
  SUAS:{n:'MDS — Censo SUAS',s:'Censo SUAS/MDS',u:'https://aplicacoes.mds.gov.br/snas/vigilancia/index2.php',d:''},
  BPC:{n:'INSS/MDS — Benefício de Prestação Continuada',s:'BPC',u:'https://www.gov.br/mds/',d:''},
  RAIS:{n:'MTE — RAIS',s:'RAIS/MTE',u:'https://bi.mte.gov.br/bgcaged/',d:''},
  CAGED:{n:'MTE — Novo CAGED',s:'CAGED/MTE',u:'https://pdet.mte.gov.br/novo-caged',d:''},
  INEP:{n:'INEP — Censo Escolar',s:'Censo Escolar/INEP',u:'https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/censo-escolar',d:''},
  IDEB:{n:'INEP — IDEB',s:'IDEB/INEP',u:'https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/ideb',d:''},
  SAEB:{n:'INEP — SAEB',s:'SAEB/INEP',u:'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/saeb',d:''},
  SIM:{n:'DATASUS — SIM (Mortalidade)',s:'SIM/DATASUS',u:'https://datasus.saude.gov.br/',d:''},
  SINASC:{n:'DATASUS — SINASC (Nascidos vivos)',s:'SINASC/DATASUS',u:'https://datasus.saude.gov.br/',d:''},
  SIH:{n:'DATASUS — SIH (Internações)',s:'SIH/DATASUS',u:'https://datasus.saude.gov.br/',d:''},
  SINAN:{n:'DATASUS — SINAN (Agravos de notificação)',s:'SINAN/DATASUS',u:'https://datasus.saude.gov.br/',d:''},
  CNES:{n:'DATASUS — CNES (Estabelecimentos de saúde)',s:'CNES/DATASUS',u:'https://cnes.datasus.gov.br/',d:''},
  ESUS:{n:'Ministério da Saúde — e-SUS / Atenção Básica',s:'MS',u:'https://sisab.saude.gov.br/',d:''},
  SINISA:{n:'Ministério das Cidades — SINISA',s:'SINISA/MCID',u:'https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/saneamento/sinisa',d:''},
  SICONFI:{n:'Tesouro Nacional — SICONFI / FINBRA',s:'SICONFI/STN',u:'https://siconfi.tesouro.gov.br/',d:''},
  ATLAS:{n:'PNUD / IPEA / FJP — Atlas do Desenvolvimento Humano',s:'Atlas Brasil',
    u:'https://www.atlasbrasil.org.br/perfil/municipio/431490',d:'IDHM calculado sobre Censos Demográficos de 1991, 2000 e 2010.'},
  SSPRS:{n:'SSP/RS — Indicadores criminais',s:'SSP/RS',u:'https://ssp.rs.gov.br/indicadores-criminais',d:''},
  IVS:{n:'IPEA — Atlas da Vulnerabilidade Social',s:'IVS/IPEA',u:'https://ivs.ipea.gov.br/',
    d:'Índice de Vulnerabilidade Social, construído sobre o Censo Demográfico. Três subíndices: infraestrutura urbana, capital humano, renda e trabalho. Quanto MAIOR o valor, MAIOR a vulnerabilidade.'},
  IDESE:{n:'DEE/SPGG-RS — Índice de Desenvolvimento Socioeconômico',s:'IDESE/DEE-RS',
    u:'https://dee.rs.gov.br/idese',
    d:'Índice estadual para os municípios do Rio Grande do Sul, em três blocos: educação, renda e saúde. É o índice sintético municipal com atualização mais frequente disponível para o RS.'},
  FIRJAN:{n:'Sistema FIRJAN — IFDM e IFGF',s:'FIRJAN',u:'https://www.firjan.com.br/',
    d:'IFDM: desenvolvimento municipal em emprego e renda, educação e saúde. IFGF: gestão fiscal. Fonte privada, com termos de uso próprios — confira antes de redistribuir.',
    naoOficial:true},
  SINESP:{n:'SINESP — Estatísticas de segurança pública',s:'SINESP',u:'https://www.gov.br/mj/pt-br/assuntos/sua-seguranca/seguranca-publica/estatistica',d:''},
  PMPA:{n:'Prefeitura de Porto Alegre — bases abertas',s:'PMPA',u:'https://prefeitura.poa.br/',d:''},
  DEMHAB:{n:'DEMHAB/PMPA — Habitação',s:'DEMHAB',u:'https://prefeitura.poa.br/demhab',d:''},
  GEOCLIM:{n:'Projeto geoclimate-poa (fonte não oficial)',s:'geoclimate-poa',
    u:'https://github.com/rafaelparanhoss/geoclimate-poa',
    d:'Indicadores ambientais derivados de sensoriamento remoto (temperatura de superfície, NDVI, cobertura urbana e vegetada) agregados por bairro. Trabalho de terceiro, não é fonte estatística oficial.',
    naoOficial:true},
  CENSO10:{n:'IBGE — Censo Demográfico 2010, microdados da amostra',s:'Censo/IBGE',
    u:'https://www.ibge.gov.br/estatisticas/sociais/trabalho/9662-censo-demografico-2010.html',
    d:'A amostra do Censo 2022 é de acesso controlado pelo IBGE e não tem arquivo público. Trabalho, informalidade, rendimento domiciliar, pobreza e desigualdade vêm, portanto, de 2010 — e estão sinalizados como estimados em toda a interface.'},
  CENSOBR:{n:'censobr (IPEA) — distribuição dos agregados do IBGE',s:'censobr/IPEA',
    u:'https://github.com/ipeaGIT/censobr',
    d:'Pacote do IPEA que empacota e distribui os agregados por setor censitário publicados pelo IBGE, sem alterar os valores. É a via de acesso usada por este Atlas; a fonte primária continua sendo o IBGE.'},
  ATLAS_CALC:{n:'Cálculo do Atlas sobre fontes oficiais',s:'Cálculo do Atlas',u:'',
    d:'Indicador derivado. A metodologia é explicitada na ficha do indicador.'}
};

/* ─────────────────────────────────────────────── 2. NÍVEIS GEOGRÁFICOS ─ */
const NIVEIS = {
  municipio:{n:'Municípios',ab:'MUN',plural:'municípios'},
  regiao:{n:'Regiões',ab:'REG',plural:'regiões'},
  bairro:{n:'Bairros',ab:'BAIRRO',plural:'bairros'},
  setor:{n:'Setores censitários',ab:'SETOR',plural:'setores censitários'}
};

/* ────────────────────────────────────────────── 3. RAMPAS CROMÁTICAS ─── */
const RAMPAS = {
  agua:['#EEF6FA','#C9E4EE','#96CEDF','#58AEC8','#2788A9','#086785','#084B63'],
  terra:['#F4F7E8','#DDE9B8','#BED67B','#91B84A','#648F30','#466B24','#304A1B'],
  brasa:['#FFF2E9','#FFD8C3','#F7AD87','#E77C55','#C94E35','#9F3327','#71231E']
};
const RAMPA_NOMES={agua:'Água (sequencial azul)',terra:'Terra (sequencial ocre)',brasa:'Brasa (sequencial quente)'};

/* ────────────────────────────────────────── 4. CATÁLOGO DE INDICADORES ─ */
/* status: ok = dado oficial carregado | mun = existe só no nível municipal
           pend = aguardando integração | ext = fonte não oficial            */
const CATS=[
  {id:'visao',n:'Visão Geral'},{id:'demografia',n:'Demografia'},{id:'idade',n:'Idade'},
  {id:'raca',n:'Raça e Etnia'},{id:'renda',n:'Renda'},{id:'pobreza',n:'Pobreza'},
  {id:'vulner',n:'Vulnerabilidade'},{id:'trabalho',n:'Trabalho'},{id:'economia',n:'Economia'},
  {id:'educacao',n:'Educação'},{id:'saude',n:'Saúde'},{id:'habitacao',n:'Habitação'},
  {id:'saneamento',n:'Saneamento'},{id:'assistencia',n:'Assistência Social'},
  {id:'seguranca',n:'Segurança'},{id:'idh',n:'Desenvolvimento Humano'},
  {id:'financas',n:'Finanças Públicas'},{id:'agro',n:'Produção Agropecuária'},
  {id:'ambiente',n:'Ambiente Urbano'}
];

const IND=[];
let IND_IDX=null;                       /* indice id -> indicador, ver getInd */
function ind(o){IND_IDX=null;IND.push(Object.assign({status:'pend',fmt:'int',ramp:'agua'},o));}
/* gera indicadores pendentes em lote */
function pend(cat,fonte,ano,niveis,lista,obs){
  lista.forEach(t=>{
    const [n,u]=t.split('|');
    ind({id:cat+'_'+slugId(n),cat,n,u:u||'',fonte,ano,niveis,status:'pend',obs:obs||''});
  });
}
const slugId=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  .replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,42);

/* ---- 4.1 INDICADORES DO CENSO 2022 — CARREGADOS ----------------------- */
ind({id:'pop',cat:'visao',n:'População residente',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua',obs:'Total de pessoas recenseadas. Soma exatamente 1.332.845 no município.'});
ind({id:'dens_hab',cat:'visao',n:'Densidade demográfica',u:'hab/km²',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'dec1',ramp:'brasa',obs:'População dividida pela área do polígono do território.'});
ind({id:'area_km2',cat:'visao',n:'Área do polígono',u:'km²',fonte:'SMURB',ano:2016,niveis:['bairro','setor'],status:'ok',fmt:'dec2',ramp:'terra',obs:'Bairros: malha SMUrb (Lei 12.112/2016), 472,81 km² no total. Setores: área do IBGE, 495,39 km². A área municipal do IBGE é 496,83 km² — a malha de bairros não recobre toda a lâmina d’água. Medidas de produtores distintos, nunca somadas entre si.'});
ind({id:'pop_pct_mun',cat:'visao',n:'Participação na população do município',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro'],status:'ok',fmt:'pct2',ramp:'agua'});
ind({id:'pop_h',cat:'demografia',n:'População masculina',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'pop_m',cat:'demografia',n:'População feminina',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'pct_homens',cat:'demografia',n:'Percentual de homens',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'agua'});
ind({id:'pct_mulheres',cat:'demografia',n:'Percentual de mulheres',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'brasa'});
ind({id:'razao_sexo',cat:'demografia',n:'Razão de sexo',u:'homens por 100 mulheres',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'dec1',ramp:'terra'});
ind({id:'moradores_dom',cat:'demografia',n:'Média de moradores por domicílio',u:'pessoas/dom.',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'dec2',ramp:'brasa'});
ind({id:'idx_envelhecimento',cat:'demografia',n:'Índice de envelhecimento',u:'idosos por 100 crianças',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'dec1',ramp:'brasa',obs:'População de 60 anos ou mais dividida pela de 0 a 14 anos.'});
ind({id:'razao_dependencia',cat:'demografia',n:'Razão de dependência',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'terra',obs:'(0 a 14 anos + 60 anos ou mais) ÷ (15 a 59 anos) × 100.'});
ind({id:'id0',cat:'idade',n:'População de 0 a 4 anos',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'id1',cat:'idade',n:'População de 5 a 9 anos',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'id2',cat:'idade',n:'População de 10 a 14 anos',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'id3',cat:'idade',n:'População de 15 a 19 anos',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'id4',cat:'idade',n:'População de 20 a 24 anos',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'id5',cat:'idade',n:'População de 25 a 29 anos',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'id6',cat:'idade',n:'População de 30 a 39 anos',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'id7',cat:'idade',n:'População de 40 a 49 anos',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'id8',cat:'idade',n:'População de 50 a 59 anos',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'id9',cat:'idade',n:'População de 60 a 69 anos',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'id10',cat:'idade',n:'População de 70 anos ou mais',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'criancas_0_14',cat:'idade',n:'Crianças e adolescentes (0 a 14 anos)',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'jovens_15_29',cat:'idade',n:'Jovens (15 a 29 anos)',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'adultos_30_59',cat:'idade',n:'Adultos (30 a 59 anos)',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'idosos_60',cat:'idade',n:'Idosos (60 anos ou mais)',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'pct_criancas_0_14',cat:'idade',n:'Percentual de 0 a 14 anos',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'agua'});
ind({id:'pct_jovens_15_29',cat:'idade',n:'Percentual de 15 a 29 anos',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'agua'});
ind({id:'pct_adultos_30_59',cat:'idade',n:'Percentual de 30 a 59 anos',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'agua'});
ind({id:'pct_idosos_60',cat:'idade',n:'Percentual de idosos (60+)',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'brasa'});
ind({id:'raca_branca',cat:'raca',n:'População branca',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'raca_preta',cat:'raca',n:'População preta',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'raca_parda',cat:'raca',n:'População parda',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'raca_amarela',cat:'raca',n:'População amarela',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'raca_indigena',cat:'raca',n:'População indígena (cor ou raça)',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua',obs:'Quesito cor ou raça. O IBGE omite células com poucos casos, então a soma por bairro é um piso.'});
ind({id:'raca_preta_parda',cat:'raca',n:'População preta ou parda',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'pct_branca',cat:'raca',n:'Percentual de população branca',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'agua'});
ind({id:'pct_preta',cat:'raca',n:'Percentual de população preta',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'brasa'});
ind({id:'pct_parda',cat:'raca',n:'Percentual de população parda',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'terra'});
ind({id:'pct_preta_parda',cat:'raca',n:'Percentual de população preta ou parda',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'brasa'});
ind({id:'pct_amarela',cat:'raca',n:'Percentual de população amarela',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct2',ramp:'agua'});
ind({id:'pct_indigena',cat:'raca',n:'Percentual de população indígena',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct2',ramp:'terra'});
ind({id:'indigenas',cat:'raca',n:'Pessoas indígenas (quesito específico)',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua',obs:'Bloco Indígenas do Censo 2022, distinto do quesito cor ou raça. Total municipal: 2.004 pessoas.'});
ind({id:'quilombolas',cat:'raca',n:'Pessoas quilombolas',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua',obs:'Bloco Quilombolas do Censo 2022. Total municipal: 2.189 pessoas.'});
ind({id:'alfab_15',cat:'educacao',n:'Pessoas alfabetizadas de 15 anos ou mais',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'pop_15',cat:'educacao',n:'População de 15 anos ou mais',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'taxa_alfabetizacao',cat:'educacao',n:'Taxa de alfabetização (15 anos ou mais)',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'agua',obs:'Pessoas alfabetizadas de 15 anos ou mais ÷ população de 15 anos ou mais.'});
ind({id:'taxa_analfabetismo',cat:'educacao',n:'Taxa de analfabetismo (15 anos ou mais)',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'brasa'});
ind({id:'resp_renda',cat:'renda',n:'Rendimento nominal médio da pessoa responsável',u:'R$/mês',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'brl',ramp:'terra',obs:'Rendimento nominal médio mensal das pessoas responsáveis com rendimentos, em domicílios particulares permanentes ocupados. No nível de bairro é a média ponderada pelo número de responsáveis em cada setor — cálculo do Atlas, não um valor publicado pelo IBGE.'});
ind({id:'resp_n',cat:'renda',n:'Pessoas responsáveis por domicílio',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'dom_total',cat:'habitacao',n:'Domicílios recenseados (total)',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'dom_part',cat:'habitacao',n:'Domicílios particulares',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'dom_colet',cat:'habitacao',n:'Domicílios coletivos',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'dpo',cat:'habitacao',n:'Domicílios particulares ocupados',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'dppo',cat:'habitacao',n:'Domicílios particulares permanentes ocupados',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'dens_dom',cat:'habitacao',n:'Densidade domiciliar',u:'dom./km²',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'dec1',ramp:'agua'});
ind({id:'dom_casa',cat:'habitacao',n:'Domicílios do tipo casa',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'dom_vila',cat:'habitacao',n:'Domicílios em casa de vila ou condomínio',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'dom_apto',cat:'habitacao',n:'Domicílios do tipo apartamento',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'dom_cortico',cat:'habitacao',n:'Domicílios em casa de cômodos ou cortiço',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'dom_degrad',cat:'habitacao',n:'Estruturas residenciais degradadas ou inacabadas',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'pct_casa',cat:'habitacao',n:'Percentual de casas',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'terra'});
ind({id:'pct_apto',cat:'habitacao',n:'Percentual de apartamentos',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'agua'});
ind({id:'pct_cortico_degrad',cat:'habitacao',n:'Percentual em cortiço ou estrutura degradada',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct2',ramp:'brasa'});
ind({id:'ban_nenhum',cat:'habitacao',n:'Domicílios sem banheiro nem sanitário',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa'});
ind({id:'ban_comum',cat:'habitacao',n:'Domicílios apenas com banheiro de uso comum',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa'});
ind({id:'pct_sem_banheiro',cat:'habitacao',n:'Percentual sem banheiro de uso exclusivo',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct2',ramp:'brasa'});
ind({id:'agua_rede',cat:'saneamento',n:'Domicílios com água de rede geral',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'pct_agua_rede',cat:'saneamento',n:'Abastecimento de água por rede geral',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'agua'});
ind({id:'agua_naoenc',cat:'saneamento',n:'Domicílios sem água encanada',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa'});
ind({id:'pct_agua_naoenc',cat:'saneamento',n:'Percentual sem água encanada',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct2',ramp:'brasa'});
ind({id:'esg_rede',cat:'saneamento',n:'Domicílios com esgoto em rede geral ou pluvial',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'pct_esgoto_rede',cat:'saneamento',n:'Esgoto em rede geral ou pluvial',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'agua'});
ind({id:'esg_adequado',cat:'saneamento',n:'Domicílios com esgotamento adequado',u:'domicílios',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua',obs:'Rede geral ou pluvial + fossa séptica ou filtro, ligada ou não à rede.'});
ind({id:'pct_esgoto_adequado',cat:'saneamento',n:'Esgotamento sanitário adequado',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'agua'});
ind({id:'esg_inadeq',cat:'saneamento',n:'Domicílios com esgotamento inadequado',u:'domicílios',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa',obs:'Fossa rudimentar ou buraco + vala + outra forma + destinação inexistente.'});
ind({id:'pct_esgoto_inadequado',cat:'saneamento',n:'Esgotamento sanitário inadequado',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'brasa'});
ind({id:'lixo_coletado',cat:'saneamento',n:'Domicílios com coleta de lixo',u:'domicílios',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua',obs:'Coletado no domicílio por serviço de limpeza + depositado em caçamba do serviço.'});
ind({id:'pct_lixo_coletado',cat:'saneamento',n:'Coleta de lixo por serviço de limpeza',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'agua'});
ind({id:'lixo_inadequado',cat:'saneamento',n:'Domicílios com destino inadequado do lixo',u:'domicílios',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa',obs:'Lixo queimado na propriedade + jogado em terreno baldio, encosta ou área pública.'});
ind({id:'pct_lixo_inadequado',cat:'saneamento',n:'Destino inadequado do lixo',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct2',ramp:'brasa'});
ind({id:'obitos',cat:'saude',n:'Óbitos de moradores (jan/2019 a jul/2022)',u:'óbitos',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa',obs:'Óbitos declarados de pessoas que moravam no domicílio, no período de janeiro de 2019 a julho de 2022. Cobre 43 meses e não é uma taxa anual.'});
ind({id:'obitos_h',cat:'saude',n:'Óbitos de homens (jan/2019 a jul/2022)',u:'óbitos',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa'});
ind({id:'obitos_m',cat:'saude',n:'Óbitos de mulheres (jan/2019 a jul/2022)',u:'óbitos',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa'});
ind({id:'obitos_por_mil',cat:'saude',n:'Óbitos por mil habitantes (jan/2019 a jul/2022)',u:'por mil hab.',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'dec2',ramp:'brasa',obs:'Acumulado de 43 meses sobre a população de 2022. Não comparável a taxas anuais de mortalidade.'});
ind({id:'fcu_pop',cat:'vulner',n:'População em favelas e comunidades urbanas',u:'pessoas',fonte:'FAVELAS',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa',obs:'Recorte oficial Favelas e Comunidades Urbanas do Censo 2022. Em Porto Alegre são 125 FCU, com 175.519 moradores (13,2% da cidade).'});
ind({id:'fcu_dom',cat:'vulner',n:'Domicílios em favelas e comunidades urbanas',u:'domicílios',fonte:'FAVELAS',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa'});
ind({id:'pct_fcu',cat:'vulner',n:'Percentual da população em favelas e comunidades urbanas',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'brasa'});
ind({id:'fcu_n',cat:'vulner',n:'Favelas e comunidades urbanas no território',u:'unidades',fonte:'FAVELAS',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa'});

/* ---- 4.2 FONTE NÃO OFICIAL (sinalizada em toda a interface) ----------- */
ind({id:'amb_pct_urbana',cat:'ambiente',n:'Cobertura urbanizada do território',u:'% da área seca',
  fonte:'GEOCLIM',ano:2024,niveis:['bairro'],status:'ext',fmt:'pct1',ramp:'brasa'});
ind({id:'amb_pct_vegetacao',cat:'ambiente',n:'Cobertura vegetada do território',u:'% da área seca',
  fonte:'GEOCLIM',ano:2024,niveis:['bairro'],status:'ext',fmt:'pct1',ramp:'agua'});
ind({id:'amb_lst_c',cat:'ambiente',n:'Temperatura de superfície (mediana)',u:'°C',fonte:'GEOCLIM',
  ano:2024,niveis:['bairro'],status:'ext',fmt:'dec1',ramp:'brasa'});
ind({id:'amb_ndvi',cat:'ambiente',n:'NDVI mediano',u:'índice',fonte:'GEOCLIM',ano:2024,
  niveis:['bairro'],status:'ext',fmt:'dec3',ramp:'agua'});

/* ---- 4.3 INDICADORES MUNICIPAIS (não desagregáveis) ------------------- */
ind({id:'m_pop_est',cat:'visao',n:'População estimada',u:'pessoas',fonte:'IBGE_CID',ano:2026,
  niveis:['municipio'],status:'mun',fmt:'int'});
ind({id:'m_dens',cat:'visao',n:'Densidade demográfica do município',u:'hab/km²',fonte:'IBGE_CID',
  ano:2022,niveis:['municipio'],status:'mun',fmt:'dec2'});
ind({id:'m_pib_pc',cat:'economia',n:'PIB per capita',u:'R$',fonte:'PIB',ano:2023,
  niveis:['municipio'],status:'mun',fmt:'brl'});
ind({id:'m_escol',cat:'educacao',n:'Taxa de escolarização de 6 a 14 anos',u:'%',fonte:'IBGE_CID',
  ano:2022,niveis:['municipio'],status:'mun',fmt:'pct2'});
ind({id:'m_mortinf',cat:'saude',n:'Mortalidade infantil',u:'por mil nascidos vivos',fonte:'IBGE_CID',
  ano:2025,niveis:['municipio'],status:'mun',fmt:'dec2'});
ind({id:'m_receita',cat:'financas',n:'Receitas brutas realizadas',u:'R$',fonte:'IBGE_CID',ano:2025,
  niveis:['municipio'],status:'mun',fmt:'brl'});
ind({id:'m_despesa',cat:'financas',n:'Despesas brutas empenhadas',u:'R$',fonte:'IBGE_CID',ano:2025,
  niveis:['municipio'],status:'mun',fmt:'brl'});
ind({id:'m_idhm',cat:'idh',n:'IDHM',u:'índice',fonte:'ATLAS',ano:2010,niveis:['municipio'],
  status:'mun',fmt:'dec3',obs:'Último IDHM publicado é o do Censo 2010. Não existe IDHM oficial para 2022.'});
ind({id:'m_idhm00',cat:'idh',n:'IDHM (Censo 2000)',u:'índice',fonte:'ATLAS',ano:2000,
  niveis:['municipio'],status:'mun',fmt:'dec3'});

/* ---- 4.3.1 ÍNDICES SINTÉTICOS MUNICIPAIS ------------------------------
   Vêm de dados/dados-indices.js, gerado por extracao/4_indices_municipais.py
   a partir das planilhas oficiais. O ano é o da edição efetivamente carregada,
   não um valor fixo no código. Enquanto o arquivo estiver vazio, verificaCatalogo()
   remove estes indicadores da interface — nenhuma ficha vazia é exibida. */
const IDX_META=((window.ATLAS_INDICES||{}).fontes)||{};
const anoIdx=k=>(IDX_META[k]&&IDX_META[k].ano)||null;

munInd('idhm','idh','IDHM','índice','ATLAS',anoIdx('idhm'),'dec3','agua',
  'Índice de Desenvolvimento Humano Municipal. Só existe para 1991, 2000 e 2010: é calculado sobre o Censo Demográfico e não há edição baseada no Censo 2022. Compara municípios entre si; não descreve a situação atual.');
munInd('idhm_renda','idh','IDHM Renda','índice','ATLAS',anoIdx('idhm'),'dec3','terra');
munInd('idhm_educacao','idh','IDHM Educação','índice','ATLAS',anoIdx('idhm'),'dec3','agua');
munInd('idhm_longevidade','idh','IDHM Longevidade','índice','ATLAS',anoIdx('idhm'),'dec3','agua');
munInd('idhm_esperanca_vida','idh','Esperança de vida ao nascer','anos','ATLAS',anoIdx('idhm'),'dec1','agua');

munInd('ivs','idh','Índice de Vulnerabilidade Social','índice','IVS',anoIdx('ivs'),'dec3','brasa',
  'Quanto MAIOR, MAIOR a vulnerabilidade — a escala é invertida em relação ao IDHM. Mesma limitação temporal: é calculado sobre o Censo Demográfico.');
munInd('ivs_infraestrutura','idh','IVS Infraestrutura urbana','índice','IVS',anoIdx('ivs'),'dec3','brasa');
munInd('ivs_capital_humano','idh','IVS Capital humano','índice','IVS',anoIdx('ivs'),'dec3','brasa');
munInd('ivs_renda_trabalho','idh','IVS Renda e trabalho','índice','IVS',anoIdx('ivs'),'dec3','brasa');

munInd('idese','idh','IDESE','índice','IDESE',anoIdx('idese'),'dec4','agua',
  'Índice estadual do RS, com atualização mais frequente que o IDHM. É a melhor leitura sintética recente do desenvolvimento destes sete municípios.');
munInd('idese_educacao','idh','IDESE Educação','índice','IDESE',anoIdx('idese'),'dec4','agua');
munInd('idese_renda','idh','IDESE Renda','índice','IDESE',anoIdx('idese'),'dec4','terra');
munInd('idese_saude','idh','IDESE Saúde','índice','IDESE',anoIdx('idese'),'dec4','agua');

munInd('ifdm','idh','IFDM','índice','FIRJAN',anoIdx('firjan'),'dec4','agua');
munInd('ifdm_emprego_renda','idh','IFDM Emprego e renda','índice','FIRJAN',anoIdx('firjan'),'dec4','terra');
munInd('ifdm_educacao','idh','IFDM Educação','índice','FIRJAN',anoIdx('firjan'),'dec4','agua');
munInd('ifdm_saude','idh','IFDM Saúde','índice','FIRJAN',anoIdx('firjan'),'dec4','agua');



/* ---- 4.7 ECONOMIA: PIB e VAB por município ---------------------------- */
function eco(id,n,u,fmt,ramp,fonte,ano,obs){
  ind({id,cat:'economia',n,u,fonte,ano,niveis:['municipio'],status:'ok',fmt,ramp,obs});
}
eco('pib','PIB a preços correntes','R$ mil','int','terra','PIB',2023);
eco('pib_pc','PIB per capita','R$','brl','terra','ATLAS_CALC',2023,
  'PIB de 2023 dividido pela população do Censo 2022. O IBGE usa estimativa populacional própria, então pode divergir levemente do valor publicado.');
eco('pib_cresc','Crescimento nominal do PIB, 2013 a 2023','%','pct1','brasa','ATLAS_CALC',2023,
  'Variação nominal, sem deflacionar. Serve para comparar municípios entre si, não para medir crescimento real.');
eco('vab','Valor adicionado bruto total','R$ mil','int','terra','PIB',2021);
eco('vab_ind','VAB da indústria','R$ mil','int','brasa','PIB',2021);
eco('vab_serv','VAB dos serviços','R$ mil','int','agua','PIB',2021);
eco('vab_adm','VAB da administração pública','R$ mil','int','terra','PIB',2021);
eco('vab_agro','VAB da agropecuária','R$ mil','int','terra','PIB',2021);
eco('impostos','Impostos líquidos sobre produtos','R$ mil','int','terra','PIB',2021);
eco('pct_vab_ind','Participação da indústria no VAB','%','pct1','brasa','ATLAS_CALC',2021);
eco('pct_vab_serv','Participação dos serviços no VAB','%','pct1','agua','ATLAS_CALC',2021);
eco('pct_vab_adm','Participação da administração pública no VAB','%','pct1','terra','ATLAS_CALC',2021);
eco('pct_vab_agro','Participação da agropecuária no VAB','%','pct2','terra','ATLAS_CALC',2021);

/* ---- 4.8 SERVIÇOS PÚBLICOS E INDICADORES MUNICIPAIS INTEGRADOS -------- */
function munInd(id,cat,n,u,fonte,ano,fmt='int',ramp='agua',obs=''){
  ind({id,cat,n,u,fonte,ano,niveis:['municipio'],status:'ok',fmt,ramp,obs});
}
function equipInd(id,cat,n,u,fonte,ano,fmt='int',ramp='agua',obs=''){
  ind({id,cat,n,u,fonte,ano,niveis:['municipio','bairro'],status:'ok',fmt,ramp,obs});
}

munInd('pop_est_2026','visao','População estimada em 2026','pessoas','IBGE_CID',2026,'int','agua',
  'Estimativa oficial com data de referência em 1º de julho de 2026.');

equipInd('cnes_estabelecimentos','saude','Estabelecimentos de saúde ativos','unidades','CNES',2026);
equipInd('cnes_ubs','saude','Postos, centros de saúde e UBS ativos','unidades','CNES',2026);
equipInd('cnes_hospitais','saude','Hospitais e hospitais-dia ativos','unidades','CNES',2026);
equipInd('cnes_caps','saude','Centros de Atenção Psicossocial (CAPS)','unidades','CNES',2026);
munInd('gasto_saude','saude','Despesa empenhada em saúde','R$','SICONFI',2024,'brl','agua');
munInd('gasto_atencao_basica','saude','Despesa empenhada em atenção básica','R$','SICONFI',2024,'brl','agua');

munInd('gasto_assistencia','assistencia','Despesa empenhada em assistência social','R$','SICONFI',2024,'brl','brasa');
munInd('gasto_assistencia_comunitaria','assistencia','Despesa em assistência comunitária','R$','SICONFI',2024,'brl','brasa');
munInd('assist_pobreza_2010','assistencia','População abaixo de ½ salário mínimo per capita (histórico)','%','CENSO10',2010,'pct1','brasa',
  'Dado municipal publicado no Censo 2010. É histórico e não representa a situação atual.');
munInd('assist_extrema_pobreza_2010','assistencia','População abaixo de ¼ de salário mínimo per capita (histórico)','%','CENSO10',2010,'pct1','brasa',
  'Dado municipal publicado no Censo 2010. É histórico e não representa a situação atual.');

munInd('seg_homicidios','seguranca','Homicídios dolosos consumados','ocorrências','SSPRS',2025,'int','brasa');
munInd('seg_vitimas_homicidio','seguranca','Vítimas de homicídio doloso','vítimas','SSPRS',2025,'int','brasa');
munInd('seg_furtos','seguranca','Furtos','ocorrências','SSPRS',2025,'int','brasa');
munInd('seg_furto_veiculo','seguranca','Furtos de veículo','ocorrências','SSPRS',2025,'int','brasa');
munInd('seg_roubos','seguranca','Roubos','ocorrências','SSPRS',2025,'int','brasa');
munInd('seg_roubo_veiculo','seguranca','Roubos de veículo','ocorrências','SSPRS',2025,'int','brasa');
munInd('seg_estelionato','seguranca','Estelionatos','ocorrências','SSPRS',2025,'int','brasa');
munInd('seg_cvli','seguranca','Vítimas de crimes violentos letais intencionais','vítimas','SSPRS',2025,'int','brasa');
munInd('gasto_seguranca','seguranca','Despesa municipal empenhada em segurança pública','R$','SICONFI',2024,'brl','terra');

munInd('trab_desocupacao_2010','trabalho','Taxa de desocupação (histórico)','%','CENSO10',2010,'pct1','brasa',
  'Último dado censitário municipal aberto e comparável. Não é projeção para 2026.');
munInd('trab_participacao_2010','trabalho','Participação na força de trabalho (histórico)','%','CENSO10',2010,'pct1','agua');
munInd('trab_informalidade_2010','trabalho','Grau de informalidade (histórico)','%','CENSO10',2010,'pct1','brasa');
munInd('trab_emprego_formal_2010','trabalho','Ocupados com vínculo formal (histórico)','%','CENSO10',2010,'pct1','agua');
munInd('trab_conta_propria_2010','trabalho','Ocupados por conta própria (histórico)','%','CENSO10',2010,'pct1','terra');
munInd('gasto_trabalho','trabalho','Despesa municipal empenhada na função trabalho','R$','SICONFI',2024,'brl','terra');

munInd('fin_receita_total','financas','Receitas brutas realizadas','R$','SICONFI',2024,'brl','agua');
munInd('fin_receita_corrente','financas','Receitas correntes brutas','R$','SICONFI',2024,'brl','agua');
munInd('fin_receita_tributaria','financas','Receita tributária bruta','R$','SICONFI',2024,'brl','agua');
munInd('fin_transferencias','financas','Transferências correntes brutas','R$','SICONFI',2024,'brl','terra');
munInd('fin_despesa_total','financas','Despesas empenhadas','R$','SICONFI',2024,'brl','brasa');
munInd('fin_investimentos','financas','Investimentos empenhados','R$','SICONFI',2024,'brl','terra');
munInd('fin_resultado_orcamentario','financas','Resultado orçamentário simplificado','R$','ATLAS_CALC',2024,'brl','brasa',
  'Receitas brutas realizadas menos despesas empenhadas, ambas da DCA/SICONFI.');

munInd('agro_vab','agro','Valor adicionado bruto da agropecuária','R$ mil','PIB',2021,'int','terra');
munInd('agro_participacao_vab','agro','Participação da agropecuária no VAB','%','ATLAS_CALC',2021,'pct2','terra');
munInd('gasto_agricultura','agro','Despesa municipal empenhada em agricultura','R$','SICONFI',2024,'brl','terra');

munInd('gasto_educacao','educacao','Despesa empenhada em educação','R$','SICONFI',2024,'brl','agua',
  'Função 12 da DCA. É a maior rubrica social dos municípios e a contrapartida pública direta de programas de qualificação.');
munInd('gasto_ensino_fundamental','educacao','Despesa empenhada em ensino fundamental','R$','SICONFI',2024,'brl','agua');
munInd('gasto_educacao_infantil','educacao','Despesa empenhada em educação infantil','R$','SICONFI',2024,'brl','agua',
  'Subfunção 12.365: creche e pré-escola. Determinante direto da participação das mulheres no mercado de trabalho.');
munInd('gasto_eja','educacao','Despesa empenhada em educação de jovens e adultos','R$','SICONFI',2024,'brl','terra',
  'Subfunção 12.366. Zero significa que o município não declarou a linha na DCA — não que não haja EJA na rede estadual do território.');
equipInd('inep_escolas','educacao','Escolas em atividade','unidades','INEP',2025);
equipInd('inep_escolas_publicas','educacao','Escolas públicas em atividade','unidades','INEP',2025);
equipInd('inep_escolas_privadas','educacao','Escolas privadas em atividade','unidades','INEP',2025);

/* ---- 4.5 ESTIMADOS: taxa de 2010 atribuída ao território de 2022 ------- */
const OBS_EST='Taxa do Censo 2010, por área de ponderação, atribuída ao setor de 2022 cujo '
  +'ponto representativo cai dentro dela. Não é projeção nem interpolação: não capta nenhuma '
  +'mudança entre 2010 e 2022. No nível de bairro é a média ponderada pela população dos setores.';
function est(id,cat,n,u,fmt,ramp){
  ind({id,cat,n,u,fonte:'CENSO10',ano:2010,niveis:['bairro','setor'],status:'est',
    fmt,ramp,obs:OBS_EST});
}
est('est_desocupacao','trabalho','Taxa de desocupação','%','pct1','brasa');
est('est_participacao','trabalho','Taxa de participação na força de trabalho','%','pct1','agua');
est('est_informalidade','trabalho','Grau de informalidade da ocupação','%','pct1','brasa');
est('est_emprego_formal','trabalho','Ocupados com vínculo formal','%','pct1','agua');
est('est_conta_propria','trabalho','Ocupados por conta própria','%','pct1','terra');
est('est_sem_previdencia','trabalho','Ocupados sem contribuição previdenciária','%','pct1','brasa');
est('est_rdpc','renda','Rendimento domiciliar per capita médio','R$/mês (jul/2010)','brl','terra');
est('est_pobreza','pobreza','População abaixo de ½ salário mínimo per capita','%','pct1','brasa');
est('est_extrema_pobreza','pobreza','População abaixo de ¼ de salário mínimo per capita','%','pct1','brasa');
est('est_gini','renda','Índice de Gini do rendimento domiciliar per capita','índice','dec3','brasa');
est('est_superior_25','educacao','Pessoas de 25 anos ou mais com superior completo','%','pct1','agua');
est('est_sem_fundamental_25','educacao','Pessoas de 25 anos ou mais sem fundamental completo','%','pct1','brasa');

/* ---- 4.6 CATÁLOGO AGUARDANDO INTEGRAÇÃO ------------------------------ */
/* O catálogo antigo listava 178 indicadores sem valor. Eles são mantidos no
   código como roteiro de expansão, mas não entram mais na interface: o Atlas
   agora só anuncia o que possui dado, fonte, ano e nível geográfico. */
if(false){
pend('raca','CENSO22',2022,['municipio','bairro'],[
'Território quilombola|delimitação',
 'Etnia ou povo indígena|distribuição','Línguas indígenas faladas|distribuição',
 'População residente em terras indígenas|pessoas']);
pend('raca','CADUNICO',2025,['municipio'],[
 'Famílias indígenas cadastradas|famílias','Famílias quilombolas cadastradas|famílias',
 'Outras comunidades tradicionais|famílias','População em situação de rua cadastrada|pessoas']);
pend('renda','ATLAS',2010,['municipio'],['Razão 10% mais ricos / 40% mais pobres|razão']);
pend('pobreza','CADUNICO',2025,['bairro'],[
 'Famílias em situação de pobreza|famílias','Famílias em extrema pobreza|famílias',
 'Percentual de famílias em pobreza|%','Pessoas em extrema pobreza|pessoas',
 'Famílias de baixa renda inscritas|famílias']);
pend('pobreza','CENSO22',2022,['bairro','setor'],[
 'Domicílios abaixo da linha de pobreza|%','Pessoas abaixo da linha de extrema pobreza|%']);
pend('vulner','CADUNICO',2025,['bairro'],[
 'Famílias inscritas no Cadastro Único|famílias','Pessoas inscritas no Cadastro Único|pessoas',
 'Cobertura do Cadastro Único|%','Famílias unipessoais cadastradas|famílias',
 'Crianças em famílias vulneráveis|pessoas','Idosos em famílias vulneráveis|pessoas',
 'Pessoas com deficiência em famílias vulneráveis|pessoas']);
pend('vulner','ATLAS_CALC',0,['bairro','setor'],[
 'Índice Sintético de Vulnerabilidade Socioeconômica|índice 0–100'],
 'Índice experimental do Atlas. Requer baixa renda, pobreza, escolaridade, saneamento, desemprego e dependência de programas sociais — nenhum desses insumos está integrado ainda, portanto o índice não é calculado.');
pend('trabalho','CENSO22',2022,['bairro','setor'],[
 'População economicamente ativa|pessoas','População ocupada|pessoas',
 'População desocupada|pessoas',
 'Trabalhadores por conta própria|pessoas','Empregadores|pessoas','Empregados|pessoas',
 'Servidores públicos|pessoas','Informalidade|%']);
pend('trabalho','RAIS',2024,['bairro','municipio'],[
 'Vínculos formais ativos|vínculos','Salário médio dos vínculos|R$','Massa salarial|R$',
 'Empregos por sexo|distribuição','Empregos por faixa etária|distribuição',
 'Empregos por raça/cor|distribuição','Empregos por escolaridade|distribuição',
 'Empregos por seção CNAE|distribuição','Empregos por ocupação (CBO)|distribuição']);
pend('trabalho','CAGED',2026,['municipio'],[
 'Admissões|vínculos','Desligamentos|vínculos','Saldo de empregos|vínculos',
 'Salário médio de admissão|R$','Saldo por setor de atividade|distribuição']);
pend('economia','PIB',2023,['municipio'],[
 
 
 'Série histórica do PIB|R$']);
pend('economia','CEMPRE',2023,['municipio'],[
 'Número de empresas e outras organizações|unidades','Unidades locais|unidades',
 'Pessoal ocupado total|pessoas','Pessoal ocupado assalariado|pessoas',
 'Salários e outras remunerações|R$','Estabelecimentos por seção CNAE|distribuição',
 'Porte dos estabelecimentos|distribuição']);
pend('educacao','INEP',2025,['bairro','municipio'],[
 'Matrículas totais|matrículas','Número de escolas|escolas','Escolas municipais|escolas',
 'Escolas estaduais|escolas','Escolas federais|escolas','Escolas privadas|escolas',
 'Matrículas em creche|matrículas','Matrículas em pré-escola|matrículas',
 'Matrículas no ensino fundamental|matrículas','Matrículas no ensino médio|matrículas',
 'Matrículas em educação profissional|matrículas','Matrículas em educação especial|matrículas',
 'Matrículas em tempo integral|matrículas','Número de docentes|docentes',
 'Alunos por docente|razão','Infraestrutura escolar|distribuição',
 'Taxa de aprovação|%','Taxa de reprovação|%','Taxa de abandono|%','Distorção idade-série|%']);
pend('educacao','IDEB',2023,['municipio'],['IDEB anos iniciais|índice','IDEB anos finais|índice','IDEB ensino médio|índice']);
pend('educacao','SAEB',2023,['municipio'],['Proficiência SAEB em língua portuguesa|escala','Proficiência SAEB em matemática|escala']);
pend('saude','SINASC',2024,['bairro','municipio'],['Nascidos vivos|nascimentos','Taxa de natalidade|por mil habitantes','Baixo peso ao nascer|%','Pré-natal adequado|%']);
pend('saude','SIM',2024,['bairro','municipio'],['Óbitos totais|óbitos','Taxa de mortalidade geral|por mil habitantes','Mortalidade infantil por bairro|por mil nascidos vivos','Mortalidade materna|por 100 mil nascidos vivos','Principais causas de óbito|distribuição','Óbitos por causas externas|óbitos']);
pend('saude','SIH',2024,['municipio'],['Internações|internações','Principais causas de internação|distribuição','Taxa de internação|por mil habitantes']);
pend('saude','SINAN',2024,['municipio'],['Doenças de notificação compulsória|casos','Doenças transmissíveis|casos','Notificações de violência interpessoal|casos','Acidentes de trabalho notificados|casos']);
pend('saude','CNES',2026,['bairro'],['Estabelecimentos de saúde|unidades','Unidades básicas de saúde|unidades','Hospitais|unidades','Leitos totais|leitos','Leitos por mil habitantes|leitos','Médicos|profissionais','Enfermeiros|profissionais','Profissionais de saúde|profissionais']);
pend('saude','ESUS',2025,['municipio'],['Cobertura da atenção básica|%','Equipes de Saúde da Família|equipes','Cobertura vacinal|%']);
pend('habitacao','DEMHAB',2024,['municipio'],['Déficit habitacional|domicílios','Inadequação domiciliar|domicílios']);
pend('saneamento','SINISA',2024,['municipio'],[
 'Cobertura de abastecimento de água|%','Cobertura de coleta de esgoto|%',
 'Tratamento de esgoto|%','Índice de perdas na distribuição|%',
 'Consumo médio per capita de água|L/hab/dia','Resíduos sólidos coletados|t/ano',
 'Drenagem urbana|indicador']);
pend('assistencia','CADUNICO',2025,['bairro','municipio'],[
 'Famílias cadastradas|famílias','Famílias de baixa renda|famílias']);
pend('assistencia','BOLSA',2026,['bairro','municipio'],[
 'Famílias beneficiárias do Bolsa Família|famílias','Valor total transferido|R$',
 'Valor médio do benefício|R$','Cobertura do programa|%']);
pend('assistencia','BPC',2025,['municipio'],['Beneficiários do BPC — idosos|pessoas','Beneficiários do BPC — pessoas com deficiência|pessoas']);
pend('assistencia','SUAS',2024,['bairro'],['CRAS|unidades','CREAS|unidades','Unidades de acolhimento|unidades','Capacidade de atendimento|vagas','Serviços socioassistenciais|serviços','Equipes de referência|equipes']);
pend('seguranca','SSPRS',2026,['municipio'],['Homicídios dolosos|ocorrências','Roubos|ocorrências','Furtos|ocorrências','Crimes contra o patrimônio|ocorrências','Violência doméstica|ocorrências','Feminicídios|ocorrências'],
 'Somente dados agregados e públicos. O Atlas não geolocaliza vítimas nem endereços individuais.');
pend('seguranca','SINESP',2025,['municipio'],['Taxa de homicídios por 100 mil habitantes|taxa','Mortes violentas intencionais|ocorrências'],
 'Somente dados agregados e públicos. O Atlas não geolocaliza vítimas nem endereços individuais.');
pend('idh','ATLAS',2010,['municipio'],['IDHM Renda|índice','IDHM Educação|índice','IDHM Longevidade|índice','Esperança de vida ao nascer|anos','Índice de vulnerabilidade social|índice']);
pend('financas','SICONFI',2025,['municipio'],[
 'Receita corrente|R$','Receita tributária|R$','Receita própria|R$','Transferências correntes|R$',
 'FPM|R$','Transferências de ICMS|R$','Despesa com saúde|R$','Despesa com educação|R$',
 'Despesa com assistência social|R$','Despesa com urbanismo|R$','Despesa com saneamento|R$',
 'Despesa com transporte|R$','Investimentos|R$','Despesa com pessoal|R$','Dívida consolidada|R$',
 'Resultado orçamentário|R$','Resultado primário|R$','Receita per capita|R$',
 'Despesa per capita|R$','Investimento per capita|R$','Grau de dependência de transferências|%'],
 'Finanças públicas são informação estritamente municipal. O Atlas não rateia esses valores entre bairros.');
pend('agro','CAGRO',2017,['municipio'],['Estabelecimentos agropecuários|estabelecimentos','Área dos estabelecimentos|ha','Estabelecimentos de agricultura familiar|estabelecimentos','Produtores|pessoas','Pessoal ocupado na agropecuária|pessoas']);
pend('agro','PAM',2024,['municipio'],['Área plantada|ha','Quantidade produzida|t','Rendimento médio|kg/ha','Valor da produção agrícola|R$','Principais culturas|distribuição']);
pend('agro','PPM',2024,['municipio'],['Efetivo de bovinos|cabeças','Efetivo de suínos|cabeças','Efetivo de aves|cabeças','Produção de leite|mil litros']);
}

/* ─────────────────────────────────────────────── 5. DADOS MUNICIPAIS ─── */
const MUN={
  nome:'Porto Alegre',uf:'RS',cod:'4314902',
  pop_2022:1332845, area_km2:496.827,
  m_pop_est:1388791, m_dens:2690.50, m_pib_pc:78586.94, m_escol:96.69,
  m_mortinf:7.32, m_receita:11109224367.43, m_despesa:12061040035.33,
  m_idhm:0.805, m_idhm00:0.744,
  m_resp_renda:null, fcu_pop:175519, fcu_n:125, pop_reportada:1330054, setores_sem_pessoas:49
};
/* série histórica com metodologia homogênea (§24) */
const SERIES={
  idhm:{n:'IDHM — Porto Alegre',fonte:'ATLAS',u:'índice',
    obs:'Série calculada com metodologia homogênea sobre os Censos Demográficos. Não existe IDHM oficial posterior a 2010.',
    pts:[[2000,0.744],[2010,0.805]]}
};

/* ─────────────────────────────────────────────────────── 6. ESTADO ───── */
const S={
  nivel:'bairro', indId:'pop', cat:'visao', ramp:null, classes:5, metodo:'quantil',
  sel:null, cmp:[], geo:{bairro:null,setor:null}, dados:{bairro:{},setor:{}},
  camadas:{base:false,fcu:false,lojas:true,escolas:false,saude:false},
  loja:null, raio:1, muniFiltro:null, importados:[]
};

/* ─────────────────────────────────────────────────── 7. UTILITÁRIOS ──── */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const nf=new Intl.NumberFormat('pt-BR');
const fmtN=(v,f)=>{
  if(v==null||v===''||Number.isNaN(v))return '—';
  switch(f){
    case 'int': return nf.format(Math.round(v));
    case 'dec0':return nf.format(Math.round(v));
    case 'dec1':return v.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
    case 'dec2':return v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
    case 'dec3':return v.toLocaleString('pt-BR',{minimumFractionDigits:3,maximumFractionDigits:3});
    case 'pct1':return v.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
    case 'pct2':return v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
    case 'brl': return 'R$ '+v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
    default:    return nf.format(v);
  }
};
function parseNum(x){
  if(x==null)return NaN;
  let s=String(x).trim().replace(/\s|R\$|%|hab|km²/gi,'');
  if(!s||s==='-')return NaN;
  const p=s.includes('.'), v=s.includes(',');
  if(p&&v){ s = s.lastIndexOf(',')>s.lastIndexOf('.')
      ? s.replace(/\./g,'').replace(',','.') : s.replace(/,/g,''); }
  else if(v){ s = /^-?\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g,'') : s.replace(',','.'); }
  else if(p){ if(/^-?\d{1,3}(\.\d{3})+$/.test(s)) s=s.replace(/\./g,''); }
  const n=parseFloat(s);
  return Number.isFinite(n)?n:NaN;
}
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* antes: IND.find() linear sobre 156 indicadores, chamado a cada tooltip */
const getInd=id=>{
  if(!IND_IDX){IND_IDX=new Map();for(const i of IND)IND_IDX.set(i.id,i);}
  return IND_IDX.get(id);
};
/* nunca devolve undefined: cai no primeiro indicador com dado carregado */
function indAtual(){
  let i=getInd(S.indId);
  if(!i){ i=IND.find(x=>x.status==='ok')||IND[0]; S.indId=i.id; }
  return i;
}
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();

function selo(i,nivel){
  const chave=(nivel&&i.fontePorNivel&&i.fontePorNivel[nivel])||i.fonte;
  const f=FONTES[chave]||{s:chave};
  const st=i.status;
  const lbl=st==='ok'?`${f.s} · ${i.ano||'—'}`
    :st==='mun'?`${f.s} · ${i.ano} · só município`
    :st==='ext'?`${f.s} · ${i.ano} · não oficial`
    :st==='imp'?`${f.s||'sem fonte declarada'} · ${i.ano||'s/ ano'} · arquivo do usuário`
    :st==='est'?`${f.s} · ${i.ano} · referência histórica`
    :`${f.s} · ${i.ano||'s/ ano'} · aguardando`;
  return `<span class="selo s-${st}"><i class="dot"></i>${esc(lbl)}</span>`;
}
function toast(msg,tipo){
  const t=$('#toast'); t.textContent=msg; t.className='show '+(tipo||'');
  clearTimeout(t._t); t._t=setTimeout(()=>t.className='',3600);
}

/* ─────────────────────────────────────────────────── 8. CLASSIFICAÇÃO ── */
function quebras(vals,k,metodo){
  return quebrasDe(vals.filter(x=>x!=null&&!Number.isNaN(x)).sort((a,b)=>a-b),k,metodo);
}
/* recebe o vetor ja filtrado e ordenado, para nao ordenar duas vezes por desenho */
function quebrasDe(v,k,metodo){
  if(!v.length)return [];
  const out=[];
  if(metodo==='igual'){
    const mn=v[0],mx=v[v.length-1],st=(mx-mn)/k;
    for(let i=1;i<k;i++)out.push(mn+st*i);
  }else{ /* quantil */
    for(let i=1;i<k;i++){
      const p=(v.length-1)*i/k, lo=Math.floor(p), hi=Math.ceil(p);
      out.push(v[lo]+(v[hi]-v[lo])*(p-lo));
    }
  }
  return out;
}
function corDe(v,brk,ramp,cores){
  if(v==null||Number.isNaN(v))return null;
  cores=cores||escalaCores(ramp,brk.length+1);
  let i=0; while(i<brk.length&&v>brk[i])i++;
  return cores[i];
}
function escalaCores(ramp,k){
  const base=RAMPAS[ramp]||RAMPAS.agua, out=[];
  for(let i=0;i<k;i++)out.push(base[Math.round(i*(base.length-1)/Math.max(1,k-1))]);
  return out;
}

/* ─────────────────────────────────────────────────────── 9. O MAPA ───── */
let map,camada,camadaBase=null,camadaFCU=null,ATLAS_DB=null;
let MUNICIPAL_2010={}, METODO_EST='';
let PONTOS=null, MUNIS_LISTA=null, camadasPonto={}, focoLoja=null, camadaRaio=null;
let RAW_SETORES=null, RAW_NUCLEO=null, RAW_EST=null;
let POP_MUNI={};                       /* população do Censo 2022 por município */
let camadaPorId=null, destacadas=[];   /* id -> camada, e as camadas realçadas */
const estaDestacada=l=>destacadas.indexOf(l)>=0;
function iniciaMapa(){
  map=L.map('map',{zoomControl:false,attributionControl:true,minZoom:9,maxZoom:18,
    preferCanvas:false});
  /* Ordem de empilhamento por pane. Antes os pontos eram recriados depois de
     cada desenho, num setTimeout, só para ficarem por cima do coropleto. */
  map.createPane('atlasSobre').style.zIndex=460;   /* FCU e raio da loja */
  map.createPane('atlasPontos').style.zIndex=480;  /* escolas, saúde, lojas */
  map.fitBounds([[-30.2694,-51.3032],[-29.9308,-51.0114]]);
  L.control.zoom({position:'topright'}).addTo(map);
  const Fit=L.Control.extend({options:{position:'topright'},
    onAdd(){const a=L.DomUtil.create('a','leaflet-bar leaflet-control fit-btn');
      a.href='#'; a.title='Enquadrar Porto Alegre'; a.setAttribute('role','button');
      a.innerHTML='⤢';
      L.DomEvent.on(a,'click',e=>{L.DomEvent.stop(e);ajustaMapa(true);});
      return a;}});
  map.addControl(new Fit());
  map.attributionControl.setPrefix('');
  map.attributionControl.addAttribution(
    'Malhas: SMUrb/PMPA (Lei 12.112/2016) · IBGE 2022 — Dados: IBGE/ObservaPOA');
}
function baseOn(on){
  if(on&&!camadaBase){
    camadaBase=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      {maxZoom:19,opacity:.78,attribution:'© OpenStreetMap, © CARTO'});
    camadaBase.on('tileerror',()=>{ if(camadaBase){map.removeLayer(camadaBase);camadaBase=null;
      $('#lay-base').checked=false;
      toast('Mapa base indisponível neste ambiente — camadas de dados seguem ativas.');}});
    camadaBase.addTo(map); camadaBase.bringToBack();
  }else if(!on&&camadaBase){ map.removeLayer(camadaBase); camadaBase=null; }
}

function valor(p){
  const v=p[S.indId];
  return (v===undefined||v===null||v==='')?null:+v;
}

/* Uma única varredura dos valores, compartilhada por desenhaMapa, renderProv e
   renderLegenda — antes cada um varria por conta própria e dois ordenavam. */
function calculaEscala(g){
  const i=indAtual(), fs=g.features, n=fs.length;
  const vals=new Array(n), ord=[];
  for(let k=0;k<n;k++){
    const v=valor(fs[k].properties); vals[k]=v;
    if(v!=null&&!Number.isNaN(v))ord.push(v);
  }
  ord.sort((a,b)=>a-b);
  S._vals=vals; S._ord=ord;
  S._brk=quebrasDe(ord,S.classes,S.metodo);
  S._ramp=S.ramp||i.ramp||'agua';
  S._cores=escalaCores(S._ramp,S._brk.length+1);   /* antes: por feição */
  return vals;
}
function estiloFeicao(f){
  const setor=S.nivel==='setor';
  const c=corDe(valor(f.properties),S._brk,S._ramp,S._cores);
  return {fillColor:c||'#CAD5D9', fillOpacity:c?.88:.42,
    color: setor?'#A6B5BA':'#7F939A',
    weight: setor?.35:.8, opacity:.9,
    dashArray: c?null:'2,2'};
}
function geoDoNivel(){
  const nivel=S.nivel;
  if(nivel==='municipio'&&!S.geo.municipio)return null;
  let g=S.geo[nivel];
  if(!g)return null;
  if(nivel!=='municipio'&&S.muniFiltro!=null)
    g={type:'FeatureCollection',features:g.features.filter(f=>f.properties.muni_id===S.muniFiltro)};
  return g;
}
/* Mantém as camadas de pontos e a de FCU em sincronia com S.camadas.
   Elas não dependem do indicador, então nunca são reconstruídas aqui. */
function sincronizaCamadas(){
  ['lojas','escolas','saude'].forEach(k=>pontosOn(k,!!S.camadas[k]));
  fcuOn(!!S.camadas.fcu);
}
/* Reconstrói a camada — só quando muda a geometria exibida (nível ou filtro). */
function desenhaMapa(){
  const nivel=S.nivel;
  if(camada){map.removeLayer(camada);camada=null;}
  camadaPorId=null; destacadas=[];
  sincronizaCamadas();
  const g=geoDoNivel();
  S._g=g;
  if(!g){renderProv();renderLegenda();return;}

  calculaEscala(g);
  camadaPorId=new Map();
  camada=L.geoJSON(g,{
    renderer: nivel==='setor'?L.canvas({padding:.4}):L.svg({padding:.3}),
    style:estiloFeicao,
    onEachFeature:(f,l)=>camadaPorId.set(f.properties.id,l)
  }).addTo(map);

  /* Um tooltip e três listeners no grupo, e não 4.722 vezes cada um.
     O Leaflet entrega a feição filha em e.propagatedFrom. */
  camada.bindTooltip(l=>tooltipHTML((l.feature||l).properties||{}),
    {className:'tt',sticky:true,direction:'top'});
  camada.on('mouseover',e=>{
    const l=e.propagatedFrom||e.layer;
    if(!l||!l.setStyle||estaDestacada(l))return;
    /* no nível setor, realçar obrigaria o canvas a redesenhar os 4.722 polígonos
       a cada passagem do mouse; ali o tooltip já dá o retorno visual */
    if(S.nivel!=='setor'){l.setStyle({weight:2.2,color:'#0057B8'});l.bringToFront&&l.bringToFront();}
  });
  camada.on('mouseout',e=>{
    const l=e.propagatedFrom||e.layer;
    if(!l||!l.setStyle||estaDestacada(l))return;
    if(S.nivel!=='setor')camada.resetStyle(l);
  });
  camada.on('click',e=>{
    const l=e.propagatedFrom||e.layer;
    if(l&&l.feature)selecionar(l.feature.properties.id);
  });

  if(!S._fit){ enquadra(); S._fit=true; }
  renderProv(); renderLegenda(); marcaSelecao();
}
/* Repinta sem reconstruir: troca de indicador, de rampa, de método ou de
   número de classes não muda nenhuma geometria. */
function repintaMapa(){
  const g=camada?(S._g||geoDoNivel()):null;
  if(!g){desenhaMapa();return;}
  calculaEscala(g);
  camada.setStyle(estiloFeicao);
  destacadas=[];
  renderProv(); renderLegenda(); marcaSelecao();
}
/* antes: varria as 4.722 camadas a cada clique para realçar uma */
function marcaSelecao(){
  if(!camada||!camadaPorId)return;
  destacadas.forEach(l=>{if(camada.hasLayer(l))camada.resetStyle(l);});
  destacadas=[];
  const destaca=(id,est)=>{
    const l=camadaPorId.get(id);
    if(l&&l.setStyle){l.setStyle(est);destacadas.push(l);}
  };
  if(S.sel)destaca(S.sel,{color:'#7FE3F5',weight:2.6,opacity:1});
  S.cmp.forEach(id=>{if(id!==S.sel)destaca(id,{color:'#D9A036',weight:2,opacity:1});});
}
function tooltipHTML(p){
  const i=indAtual(), v=valor(p);
  const linhas=[[i.n, v==null?'sem dado':fmtN(v,i.fmt)+(i.u&&!/^%/.test(i.u)?' '+i.u.replace('%',''):'')]];
  const extras = S.nivel==='bairro'
    ? [['População (2022)','pop_2022','int'],['Densidade','dens_hab_km2','dec1'],['Área','area_km2','dec2']]
    : [['População (2022)','pop_2022','int'],['Domicílios','dom_total','int'],['Moradores/dom.','moradores_dom','dec2']];
  extras.forEach(([n,k,f])=>{ if(k!==S.indId) linhas.push([n, p[k]==null?'sem dado':fmtN(+p[k],f)]); });
  return `<b>${esc(p.nome)}${p.bairro&&S.nivel==='setor'?` <span style="color:#94A8B7;font-weight:400">· ${esc(p.bairro)}</span>`:''}</b>`+
    linhas.map(([k,val])=>`<div class="kv"><span>${esc(k)}</span><span class="num">${esc(val)}</span></div>`).join('')+
    `<div class="hint">clique para o perfil completo</div>`;
}

/* ──────────────────────────────────────────── 10. PROVENIÊNCIA + LEGENDA */
function renderProv(){
  const i=indAtual(), f=FONTES[i.fonte]||{}, n=NIVEIS[S.nivel];
  /* o conjunto desenhado (já com o filtro de município), não a camada inteira */
  const g=S._g||S.geo[S.nivel];
  let cob='';
  if(g&&i.status!=='pend'&&S.nivel!=='municipio'){
    const tot=g.features.length;
    let com=0,pc=0,pt=0;                  /* antes: duas varreduras separadas */
    for(let k=0;k<tot;k++){
      const q=g.features[k].properties, pq=+q.pop_2022||0;
      pt+=pq;
      if(valor(q)!=null){com++;pc+=pq;}
    }
    /* denominador: a população desse mesmo conjunto. Antes era a de Porto Alegre,
       o que dava até 178,6% nos níveis que cobrem os sete municípios. */
    let extra='';
    if(com<tot&&pc>0&&pt>0)extra=` · ${fmtN(100*pc/pt,'pct1')} da população`;
    cob=`<span class="selo ${com===tot?'s-ok':'s-pend'}"><i class="dot"></i>${nf.format(com)} de ${nf.format(tot)} ${n.plural} com dado${extra}</span>`;
  }
  const alerta = i.status==='pend'
    ? `<span class="warn">◆ indicador aguardando integração — nada é exibido no mapa</span>`
    : i.status==='mun'
    ? `<span class="warn">◆ disponível apenas para Porto Alegre — sem desagregação territorial</span>`
    : i.status==='ext'
    ? `<span class="warn">◆ fonte não oficial (${esc(f.s)}) — usar apenas como leitura exploratória</span>`
    : i.status==='imp'
    ? `<span class="warn" style="color:var(--imp)">◆ carregado de arquivo do usuário — o Atlas não valida a origem</span>`
    : i.status==='est'
    ? `<span class="warn" style="color:var(--est)">◆ REFERÊNCIA HISTÓRICA 2010 — atribuída espacialmente ao território de 2022. Ver Metodologia.</span>`:'';
  $('#prov').innerHTML=`
    <span class="ttl">${esc(i.n)}</span>
    <div class="meta">${selo(i,S.nivel)}<span class="chip">${esc(n.ab)}</span>${cob}</div>
    ${alerta}
    <span class="spacer"></span>
    <div class="ramp-sel">${Object.keys(RAMPAS).map(r=>{
      const cs=escalaCores(r,5);
      return `<button data-ramp="${r}" title="${esc(RAMPA_NOMES[r])}" aria-pressed="${(S.ramp||i.ramp)===r}"
        style="background:linear-gradient(90deg,${cs.join(',')})"></button>`;}).join('')}</div>`;
  $$('#prov .ramp-sel button').forEach(b=>b.onclick=()=>{S.ramp=b.dataset.ramp;repintaMapa();});
}
function renderLegenda(){
  const i=indAtual(), el=$('#legend');
  if(S.nivel==='regiao'||i.status==='pend'||i.status==='mun'){
    el.innerHTML=`<h4>${esc(i.n)}</h4><div class="un">sem representação cartográfica</div>
      <div style="font-size:11px;color:var(--txt3);line-height:1.55">${
        S.nivel==='regiao'?'A malha das 17 Regiões do Orçamento Participativo ainda não foi integrada.'
        :i.status==='mun'?'Indicador municipal. Consulte o painel à direita.'
        :i.status==='pend'?'Carregue o arquivo da fonte em <b>Integrar dados</b> para ativar o mapa.'
        :'Selecione o nível bairro ou setor censitário.'}</div>`;
    return;
  }
  const brk=S._brk||[], cores=S._cores||escalaCores(S._ramp||i.ramp,brk.length+1);
  const g=S.geo[S.nivel]||{features:[]};
  /* sem filtro de município a camada desenhada é esta mesma, e calculaEscala
     já ordenou os valores — antes a legenda ordenava tudo de novo */
  const vals=(S.muniFiltro==null&&S._ord&&S._g===g)?S._ord
    :g.features.map(f=>valor(f.properties)).filter(v=>v!=null).sort((a,b)=>a-b);
  const semDado=g.features.length-vals.length;
  const rot=[];
  for(let k=0;k<cores.length;k++){
    const lo=k===0?vals[0]:brk[k-1], hi=k===cores.length-1?vals[vals.length-1]:brk[k];
    rot.push(`<div class="lrow"><i class="lsw" style="background:${cores[k]}"></i>
      <span>${fmtN(lo,i.fmt)} – ${fmtN(hi,i.fmt)}</span></div>`);
  }
  el.innerHTML=`<h4>${esc(i.n)}</h4><div class="un">${esc(i.u||'')} · ${NIVEIS[S.nivel].ab} · ${i.ano}</div>
    ${rot.reverse().join('')}
    ${semDado?`<div class="lrow"><i class="lsw" style="background:#26333F;border-style:dashed"></i>
      <span>sem dado (${nf.format(semDado)})</span></div>
      <div style="font-size:10px;color:var(--txt3);line-height:1.5;margin-top:5px">
        Vazios concentrados na periferia — ver <b>Fontes</b>.</div>`:''}
    <div class="foot"><span class="eyebrow">Classificação</span>
      <div class="class-sel">
        <button data-m="quantil" aria-pressed="${S.metodo==='quantil'}">quantis</button>
        <button data-m="igual" aria-pressed="${S.metodo==='igual'}">int. iguais</button>
      </div>
      <div class="class-sel" style="margin-top:4px">
        ${[4,5,6,7].map(k=>`<button data-k="${k}" aria-pressed="${S.classes===k}">${k}</button>`).join('')}
      </div></div>`;
  $$('#legend [data-m]').forEach(b=>b.onclick=()=>{S.metodo=b.dataset.m;repintaMapa();});
  $$('#legend [data-k]').forEach(b=>b.onclick=()=>{S.classes=+b.dataset.k;repintaMapa();});
}

/* ───────────────────────────────────────────────── 11. SIDEBAR / CATS ── */
function renderCats(){
  $('#cats').innerHTML=CATS.map(c=>{
    const inds=IND.filter(i=>i.cat===c.id);
    const ok=inds.filter(i=>i.status!=='pend').length;
    return `<div class="cat${c.id===S.cat?' open':''}" data-cat="${c.id}">
      <button><span>${esc(c.n)}</span>
        <span class="cnt">${ok}/${inds.length}</span><span class="chev">▶</span></button>
      <div class="inds">${inds.map(i=>{
        const dis=i.status==='pend'||i.status==='mun';
        return `<button class="ind${i.id===S.indId?' on':''}${dis?' dis':''}" data-ind="${i.id}">
          <span class="nm">${esc(i.n)}</span>${selo(i)}
          <span class="lvl">${i.niveis.map(n=>NIVEIS[n].ab[0]).join('')}</span></button>`;
      }).join('')}</div></div>`;
  }).join('');
  $$('.cat>button').forEach(b=>b.onclick=()=>{
    const c=b.parentElement; const wasOpen=c.classList.contains('open');
    $$('.cat').forEach(x=>x.classList.remove('open'));
    if(!wasOpen){c.classList.add('open');S.cat=c.dataset.cat;}
  });
  $$('.ind').forEach(b=>b.onclick=()=>escolheIndicador(b.dataset.ind));
}
function escolheIndicador(id){
  const i=getInd(id); if(!i)return;
  S.indId=id; S.ramp=null;
  let mudouNivel=false;
  if(!i.niveis.includes(S.nivel)){
    const alvo=i.niveis.find(n=>S.geo[n])||i.niveis.find(n=>n==='municipio')||i.niveis[0];
    setNivel(alvo,true); mudouNivel=true;
  }
  $$('.ind').forEach(b=>b.classList.toggle('on',b.dataset.ind===id));
  /* a geometria só muda se o nível mudou junto */
  if(mudouNivel)desenhaMapa(); else repintaMapa();
  renderPainel();
  if(window.innerWidth<=960)fecharSide();
}
function setNivel(n,silent){
  if(NIVEIS[n]===undefined)return;
  if(n==='setor')garanteSetores();
  S.nivel=n; S.sel=null; S.cmp=[]; S._fit=false;
  $$('#segNivel button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.nivel===n));
  if(!silent){desenhaMapa();renderPainel();}
}

/* ──────────────────────────────────────────────────── 12. PAINEL ─────── */
function renderPainel(){
  const b=$('#panelBody');
  if(S.nivel==='municipio') b.innerHTML=painelMunicipiosHTML();
  else if(S.sel) b.innerHTML=perfilHTML(S.sel);
  else if(S.nivel==='municipio'||S.nivel==='regiao') b.innerHTML=aberturaHTML();
  else b.innerHTML=aberturaHTML()+distribuicaoHTML();
  ligaPainel();
}

function painelMunicipiosHTML(){
  const g=S.geo.municipio||{features:[]}, i=indAtual();
  if(S.sel){
    const f=feature(S.sel);if(!f)return aberturaHTML();
    const p=f.properties;
    const blocos=[
      ['Saúde','saude'],['Assistência social','assistencia'],['Segurança','seguranca'],
      ['Emprego e trabalho','trabalho'],['Finanças públicas','financas'],['Agro','agro']
    ];
    return `<div class="terr-h"><button class="btn" id="btnVoltar">← Sete municípios</button>
      <span class="eyebrow">Perfil municipal</span><h2>${esc(p.nome)}</h2>
      <div class="sub"><span class="chip acc">${fmtN(p.pop_est_2026,'int')} habitantes · 2026</span></div></div>
      ${blocos.map(([titulo,cat])=>{
        const itens=IND.filter(x=>x.cat===cat&&x.niveis.includes('municipio')&&x.status!=='pend'&&p[x.id]!=null);
        return `<h3 class="sec">${titulo}<span class="chip tag">${itens.length}</span></h3>`+
          itens.map(x=>`<div class="row"><div class="k">${esc(x.n)}${selo(x,'municipio')}</div>
            <div class="v"><span class="num">${fmtN(+p[x.id],x.fmt)}</span><span class="u">${esc(x.u)}</span></div></div>`).join('');
      }).join('')}`;
  }
  const fs=g.features.filter(f=>S.muniFiltro==null||f.properties.muni_id===S.muniFiltro);
  const arr=fs.map(f=>({f,v:valor(f.properties)})).sort((a,b)=>(b.v??-Infinity)-(a.v??-Infinity));
  return `<div class="terr-h"><span class="eyebrow">Comparação metropolitana</span>
    <h2>Sete municípios da RMPA</h2><div class="sub"><span class="chip acc">dados com fonte e ano</span></div></div>
    <h3 class="sec">${esc(i.n)}</h3>
    ${arr.map(({f,v})=>`<button class="row muni-row" data-goto="${esc(f.properties.id)}">
      <div class="k"><b>${esc(f.properties.nome)}</b></div><div class="v"><span class="num">${fmtN(v,i.fmt)}</span>
      <span class="u">${esc(i.u)}</span></div></button>`).join('')}
    <div class="note" style="margin-top:14px">Clique em um município para ver, em uma única ficha,
      saúde, assistência, segurança, emprego, finanças e agro.</div>`;
}
function ligaPainel(){
  const v=$('#btnVoltar'); if(v)v.onclick=()=>{S.sel=null;marcaSelecao();renderPainel();};
  const c=$('#btnAddCmp'); if(c)c.onclick=()=>{addCmp(S.sel);abreModal('mdAnalise');};
  const r=$('#btnRankAqui'); if(r)r.onclick=()=>abreRanking();
  $$('[data-goto]').forEach(x=>x.onclick=()=>selecionar(x.dataset.goto));
}

function aberturaHTML(){
  const kpis=[
    ['População','pop_2022',MUN.pop_2022,'int','Censo/IBGE · 2022'],
    ['Área','area_km2',MUN.area_km2,'dec2','SMUrb/IBGE · 2016',' km²'],
    ['PIB','__pib',null,null,'IBGE · 2023'],
    ['PIB per capita','m_pib_pc',MUN.m_pib_pc,'brl','IBGE · 2023'],
    ['Rendimento médio do responsável','m_resp_renda',MUN.m_resp_renda,'brl','Censo/IBGE · 2022'],
    ['IDHM','m_idhm',MUN.m_idhm,'dec3','Atlas Brasil · 2010']
  ];
  const cards=kpis.map(([lb,id,val,f,src,suf])=>{
    if(val==null)return `<div class="kpi pend"><span class="lb">${esc(lb)}</span>
      <span class="vl">Aguardando integração</span>
      <span class="selo s-pend"><i class="dot"></i>${esc(src)}</span></div>`;
    return `<div class="kpi"><span class="lb">${esc(lb)}</span>
      <span class="vl">${fmtN(val,f)}${suf?`<small>${suf}</small>`:''}</span>
      <span class="selo s-ok"><i class="dot"></i>${esc(src)}</span></div>`;
  }).join('');

  const municipais=IND.filter(i=>i.status==='mun');
  return `
  <div class="terr-h">
    <span class="eyebrow">Atlas socioeconômico interativo</span>
    <h2>Porto Alegre</h2>
    <div class="sub"><span class="chip acc">RS · 4314902</span>
      <span class="chip">94 bairros</span><span class="chip">2.744 setores</span></div>
  </div>
  <div class="hero-kpi">${cards}</div>
  <p style="font-size:12px;color:var(--txt2);line-height:1.6">
    Selecione um indicador na coluna à esquerda para explorar as desigualdades socioeconômicas
    dentro do município, ou clique em um território no mapa para abrir seu perfil completo.</p>

  <h3 class="sec">Indicadores só do município <span class="chip tag">${municipais.length}</span></h3>
  <p style="font-size:11.5px;color:var(--txt3);margin-bottom:8px;line-height:1.55">
    Estes indicadores não têm representatividade abaixo do município e por isso
    <b>não são rateados entre bairros</b>.</p>
  ${municipais.map(i=>`<div class="row"><div class="k">${esc(i.n)}${selo(i)}</div>
     <div class="v"><span class="num">${fmtN(MUN[i.id],i.fmt)}</span><span class="u">${esc(i.u)}</span></div></div>`).join('')}

  <h3 class="sec">Evolução histórica</h3>
  ${serieHTML('idhm')}

  <h3 class="sec">Retrato do município — Censo 2022</h3>
  ${retratoHTML()}

  <h3 class="sec">Cobertura do Atlas</h3>
  ${coberturaHTML()}`;
}

/* agregados do município calculados a partir dos 94 bairros de Porto Alegre
   (a camada de bairros também traz os outros seis municípios) */
function retratoHTML(){
  const f=S.geo.bairro.features.filter(x=>x.properties.muni===MUN.nome),
    T=k=>f.reduce((a,x)=>a+(x.properties[k]||0),0);
  const rc=T('raca_branca')+T('raca_preta')+T('raca_amarela')+T('raca_parda')+T('raca_indigena');
  const dp=T('dppo');
  const linhas=[
    ['População feminina', T('pop_m'), 'int', 100*T('pop_m')/(T('pop_h')+T('pop_m'))],
    ['Idosos (60 anos ou mais)', T('idosos_60'), 'int', 100*T('idosos_60')/T('pop')],
    ['Crianças e adolescentes (0 a 14)', T('criancas_0_14'), 'int', 100*T('criancas_0_14')/T('pop')],
    ['População preta ou parda', T('raca_preta_parda'), 'int', 100*T('raca_preta_parda')/rc],
    ['População indígena (quesito específico)', T('indigenas'), 'int', null],
    ['População quilombola', T('quilombolas'), 'int', null],
    ['Em favelas e comunidades urbanas', T('fcu_pop'), 'int', 100*T('fcu_pop')/T('pop')],
    ['Domicílios com esgoto adequado', T('esg_adequado'), 'int', 100*T('esg_adequado')/dp],
    ['Domicílios com água de rede geral', T('agua_rede'), 'int', 100*T('agua_rede')/dp],
    ['Domicílios com coleta de lixo', T('lixo_coletado'), 'int', 100*T('lixo_coletado')/dp],
    ['Taxa de alfabetização (15+)', 100*T('alfab_15')/T('pop_15'), 'pct1', null]
  ];
  return linhas.map(([k,v,fm,pc])=>`<div class="row"><div class="k">${esc(k)}</div>
    <div class="v"><span class="num">${fmtN(v,fm)}</span>
    <span class="u">${pc!=null?fmtN(pc,'pct1'):''}</span></div></div>`).join('')+
    `<p style="font-size:11px;color:var(--txt3);line-height:1.6;margin-top:9px">
      Somas dos 94 bairros, calculadas sobre os agregados por setor censitário do Censo 2022.
      Os blocos de pessoas e domicílios não são publicados para ${MUN.setores_sem_pessoas} setores
      especiais (quartel, unidade prisional, alojamento, convento, hospital), com
      ${nf.format(MUN.pop_2022-MUN.pop_reportada)} moradores no total — por isso alguns denominadores
      ficam em ${nf.format(MUN.pop_reportada)}, e não em ${nf.format(MUN.pop_2022)}.</p>`;
}
function coberturaHTML(){
  const t=IND.length, ok=IND.filter(i=>i.status==='ok').length,
    ext=IND.filter(i=>i.status==='ext').length, imp=IND.filter(i=>i.status==='imp').length,
    mun=IND.filter(i=>i.status==='mun').length, p=t-ok-ext-mun-imp;
  const seg=[[ok,'var(--ok)','oficial territorial'],[mun,'var(--mun)','só município'],
    [imp,'var(--imp)','arquivo do usuário'],[ext,'var(--sim)','não oficial'],
    [p,'rgba(183,106,0,.25)','sem valor carregado']].filter(x=>x[0]>0);
  return `<div style="display:flex;height:9px;border-radius:5px;overflow:hidden;margin-bottom:9px">
    ${seg.map(([n,c])=>`<div style="width:${100*n/t}%;background:${c}"></div>`).join('')}</div>
    ${seg.map(([n,c,l])=>`<div class="row" style="padding:4px 0"><div class="k">
      <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${c};
      margin-right:6px"></span>${esc(l)}</div>
      <div class="v"><span class="num">${n}</span></div></div>`).join('')}
    <p style="font-size:11px;color:var(--txt3);margin-top:9px;line-height:1.55">
      ${t} indicadores com fonte, ano e nível geográfico explícitos — ver <b>Cobertura</b> no topo.</p>`;
}

function serieHTML(k){
  const s=SERIES[k]; if(!s)return '';
  const w=300,h=112,pad={l:36,r:10,t:10,b:20};
  const xs=s.pts.map(p=>p[0]), ys=s.pts.map(p=>p[1]);
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys)*.97,y1=Math.max(...ys)*1.02;
  const px=v=>pad.l+(v-x0)/((x1-x0)||1)*(w-pad.l-pad.r);
  const py=v=>h-pad.b-(v-y0)/((y1-y0)||1)*(h-pad.t-pad.b);
  const d=s.pts.map((p,i)=>(i?'L':'M')+px(p[0])+' '+py(p[1])).join(' ');
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(s.n)}">
    <line x1="${pad.l}" y1="${h-pad.b}" x2="${w-pad.r}" y2="${h-pad.b}" stroke="#22323F"/>
    <path d="${d}" fill="none" stroke="#34A0B8" stroke-width="2"/>
    ${s.pts.map(p=>`<circle cx="${px(p[0])}" cy="${py(p[1])}" r="3.4" fill="#34A0B8"/>
      <text x="${px(p[0])}" y="${py(p[1])-9}" text-anchor="middle" class="val">${fmtN(p[1],'dec3')}</text>
      <text x="${px(p[0])}" y="${h-6}" text-anchor="middle">${p[0]}</text>`).join('')}
  </svg>
  <div class="row"><div class="k">${esc(s.n)}${selo({fonte:s.fonte,ano:2010,status:'mun'})}</div></div>
  <p style="font-size:11px;color:var(--txt3);line-height:1.55">${esc(s.obs)}</p>`;
}

function distribuicaoHTML(){
  const i=indAtual(), g=S.geo[S.nivel];
  if(!g||i.status==='pend'||i.status==='mun')return '';
  const arr=g.features.map(f=>({id:f.properties.id,n:f.properties.nome,v:valor(f.properties)}))
    .filter(o=>o.v!=null).sort((a,b)=>b.v-a.v);
  if(!arr.length)return '';
  const top=arr.slice(0,8), bot=arr.slice(-5).reverse(), mx=top[0].v;
  const barra=o=>`<div class="row" style="padding:5px 0;cursor:pointer" data-goto="${esc(o.id)}">
      <div class="k" style="flex:1">
        <div style="display:flex;justify-content:space-between;gap:9px;margin-bottom:3px">
          <span>${esc(o.n)}</span><span class="num" style="color:var(--txt)">${fmtN(o.v,i.fmt)}</span></div>
        <div style="height:5px;background:#16222C;border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${Math.max(1,100*o.v/mx)}%;background:${corDe(o.v,S._brk||[],S._ramp||i.ramp)}"></div>
        </div></div></div>`;
  const soma=arr.reduce((a,o)=>a+o.v,0), med=arr[Math.floor(arr.length/2)].v;
  return `<h3 class="sec">Distribuição — ${esc(i.n)}</h3>
    <div class="row"><div class="k">Mediana entre ${NIVEIS[S.nivel].plural}</div>
      <div class="v"><span class="num">${fmtN(med,i.fmt)}</span><span class="u">${esc(i.u)}</span></div></div>
    <div class="row"><div class="k">Amplitude (máx ÷ mín)</div>
      <div class="v"><span class="num">${arr[arr.length-1].v?fmtN(arr[0].v/arr[arr.length-1].v,'dec1')+'×':'—'}</span></div></div>
    ${/pessoas|domic|vínculos/.test(i.u)?`<div class="row"><div class="k">Soma</div>
      <div class="v"><span class="num">${fmtN(soma,'int')}</span><span class="u">${esc(i.u)}</span></div></div>`:''}
    <h3 class="sec">Maiores valores</h3>${top.map(barra).join('')}
    <h3 class="sec">Menores valores</h3>${bot.map(barra).join('')}
    <div class="btn-row"><button class="btn" id="btnRankAqui">Ver ranking completo</button></div>`;
}

/* ─────────────────────────────────────── 13. PERFIL DO TERRITÓRIO ────── */
function feature(id){
  const g=S.geo[S.nivel]; if(!g)return null;
  return g.features.find(f=>f.properties.id===id)||null;
}
function selecionar(id){
  const f=feature(id); if(!f)return;
  S.sel=id; marcaSelecao(); renderPainel();
  if(window.innerWidth<=960)$('#panel').classList.add('open');
  try{
    const l=L.geoJSON(f.geometry); map.fitBounds(l.getBounds(),{padding:[60,60],maxZoom:15});
  }catch(e){}
}
const BLOCOS=[
  {t:'Perfil populacional',cats:['visao','demografia','idade']},
  {t:'Perfil racial',cats:['raca']},
  {t:'Perfil econômico',cats:['renda','pobreza','trabalho','economia']},
  {t:'Educação',cats:['educacao']},
  {t:'Saúde',cats:['saude']},
  {t:'Habitação',cats:['habitacao']},
  {t:'Saneamento',cats:['saneamento']},
  {t:'Vulnerabilidade e assistência',cats:['vulner','assistencia']},
  {t:'Ambiente urbano',cats:['ambiente']}
];
function perfilHTML(id){
  const f=feature(id); if(!f)return aberturaHTML();
  const p=f.properties, isSetor=S.nivel==='setor';
  const pctMun=p.pop_pct_mun??null;

  let html=`<div class="terr-h">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
      <button class="btn" id="btnVoltar" style="padding:3px 8px;font-size:11px">← Porto Alegre</button>
      <span class="eyebrow">${isSetor?'Setor censitário':'Bairro'}</span></div>
    <h2>${esc(p.nome)}</h2>
    <div class="sub">
      ${isSetor?`<span class="chip acc">${esc(p.bairro)}</span><span class="chip mono">${esc(p.id)}</span>`
        :`<span class="chip acc">${fmtN(pctMun,'pct2')} de ${esc(p.muni||'—')}</span>`}
      ${p.area_km2!=null?`<span class="chip">${fmtN(+p.area_km2,'dec2')} km²</span>`:''}
    </div>
    <div class="btn-row">
      <button class="btn pri" id="btnAddCmp">Comparar com outro território</button>
    </div></div>`;

  BLOCOS.forEach(b=>{
    const inds=IND.filter(i=>b.cats.includes(i.cat)&&i.niveis.includes(S.nivel));
    if(!inds.length)return;
    const disp=inds.filter(i=>i.status!=='pend'&&p[i.id]!=null);
    const falt=inds.filter(i=>!disp.includes(i));
    html+=`<h3 class="sec">${esc(b.t)}<span class="chip tag">${disp.length}/${inds.length}</span></h3>`;
    if(disp.length){
      html+=disp.map(i=>{
        const om=p._omit&&p._omit[i.id];
        return `<div class="row"><div class="k">${esc(i.n)}${selo(i,S.nivel)}
          ${om?`<div style="font-size:10px;color:var(--pend);margin-top:2px">
            soma parcial — IBGE omitiu ${om} setor${om>1?'es':''}</div>`:''}</div>
        <div class="v"><span class="num">${fmtN(+p[i.id],i.fmt)}</span>
        <span class="u">${esc(i.u)}</span></div></div>`;}).join('');
    }
    if(b.t==='Perfil populacional')html+=piramideHTML(p);
    if(b.t==='Perfil racial')html+=racaHTML(p);
    if(falt.length){
      const porFonte={};
      falt.forEach(i=>{const k=i.fonte;(porFonte[k]=porFonte[k]||[]).push(i);});
      html+=`<div class="empty" style="margin-top:9px"><div class="hd">
        <span class="selo s-pend"><i class="dot"></i>aguardando integração</span>
        <b style="margin-left:auto;font-family:var(--mono);font-size:11px">${falt.length}</b></div>
        <p>${esc(falt.slice(0,6).map(i=>i.n).join(' · '))}${falt.length>6?` e mais ${falt.length-6}`:''}</p>
        <div class="src">${Object.keys(porFonte).map(k=>
          `${esc((FONTES[k]||{}).s||k)} · ${porFonte[k].length} indicador${porFonte[k].length>1?'es':''}`).join('<br>')}</div></div>`;
    }
  });

  html+=fcuHTML(p);

  /* vizinhança / contexto */
  if(isSetor){
    const irmaos=S.geo.setor.features.filter(x=>x.properties.bairro_id===p.bairro_id);
    const somaPop=irmaos.reduce((a,x)=>a+(+x.properties.pop_2022||0),0);
    html+=`<h3 class="sec">Contexto no bairro</h3>
      <div class="row"><div class="k">Setores no bairro ${esc(p.bairro)}</div>
        <div class="v"><span class="num">${irmaos.length}</span></div></div>
      <div class="row"><div class="k">Soma da população dos setores com dado
        <span class="selo s-ok"><i class="dot"></i>Censo/IBGE · 2022</span></div>
        <div class="v"><span class="num">${fmtN(somaPop,'int')}</span><span class="u">pessoas</span></div></div>`;
  }
  html+=`<h3 class="sec">Ficha do território</h3>
    <p style="font-size:11.5px;color:var(--txt3);line-height:1.6">
      Geometria: ${isSetor?'malha de setores censitários do IBGE (Censo 2022)'
      :'malha de bairros da SMUrb/PMPA, Lei Municipal nº 12.112/2016'}.
      Geometria generalizada para uso em tela; áreas e cálculos usam os valores originais.</p>`;
  return html;
}
const FAIXAS_ID=['0-4','5-9','10-14','15-19','20-24','25-29','30-39','40-49','50-59','60-69','70+'];

/* pirâmide etária — bairros têm sexo × idade; setores, só idade */
function piramideHTML(p){
  const temPir=Array.isArray(p._pir)&&p._pir.some(v=>v>0);
  const idade=FAIXAS_ID.map((_,i)=>p['id'+i]);
  if(!temPir&&idade.every(v=>v==null))
    return graficoVazio('Pirâmide etária','Censo 2022 — bloco não publicado para este setor');
  const w=340,h=190,pad={l:34,r:6,t:14,b:16},bh=(h-pad.t-pad.b)/11-2;
  const meio=(w-pad.l-pad.r)/2+pad.l;
  const H=temPir?p._pir.slice(0,11):idade.map(()=>0);
  const M=temPir?p._pir.slice(11):idade;
  const mx=Math.max(...H,...M,1), esc=(w-pad.l-pad.r)/2/mx;
  const barras=FAIXAS_ID.map((f,i)=>{
    const y=pad.t+(11-1-i)*(bh+2);
    const wh=(H[i]||0)*esc, wm=(M[i]||0)*esc;
    return `<rect x="${meio-wh}" y="${y}" width="${wh}" height="${bh}" fill="#34A0B8" rx="1">
        <title>Homens ${f}: ${nf.format(H[i]||0)}</title></rect>
      <rect x="${meio}" y="${y}" width="${wm}" height="${bh}" fill="#C4A369" rx="1">
        <title>${temPir?'Mulheres':'Pessoas'} ${f}: ${nf.format(M[i]||0)}</title></rect>
      <text x="0" y="${y+bh-1}" class="lbl">${f}</text>`;
  }).join('');
  return `<div style="margin-top:9px">
    <div style="display:flex;justify-content:space-between;align-items:baseline">
      <span class="eyebrow">${temPir?'Pirâmide etária':'Distribuição por idade'}</span>
      ${temPir?`<span class="eyebrow" style="letter-spacing:.06em">
        <i style="display:inline-block;width:7px;height:7px;background:#34A0B8;border-radius:2px"></i> homens
        &nbsp;<i style="display:inline-block;width:7px;height:7px;background:#C4A369;border-radius:2px"></i> mulheres
      </span>`:''}
    </div>
    <svg class="chart" viewBox="0 0 ${w} ${h}" style="margin-top:5px">
      ${barras}<line x1="${meio}" y1="${pad.t-3}" x2="${meio}" y2="${h-pad.b}" stroke="#22323F"/>
    </svg>
    <div class="selo s-ok"><i class="dot"></i>Censo/IBGE · 2022${temPir?'':' · sem recorte por sexo neste nível'}</div>
  </div>`;
}

/* composição por cor ou raça */
const CORES_RACA={raca_branca:['Branca','#8FB3C4'],raca_preta:['Preta','#6B4A38'],
  raca_parda:['Parda','#C4A369'],raca_amarela:['Amarela','#D9C293'],
  raca_indigena:['Indígena','#A9834A']};
function racaHTML(p){
  const ks=Object.keys(CORES_RACA), tot=p._raca_total;
  if(!tot)return graficoVazio('Composição por cor ou raça','Censo 2022 — bloco não publicado para este setor');
  const seg=ks.map(k=>({k,n:CORES_RACA[k][0],c:CORES_RACA[k][1],v:p[k]||0}))
    .filter(o=>o.v>0).sort((a,b)=>b.v-a.v);
  const om=p._omit&&(p._omit.raca_branca||p._omit.raca_indigena||p._omit.raca_amarela);
  return `<div style="margin-top:9px"><span class="eyebrow">Composição por cor ou raça</span>
    <div style="display:flex;height:16px;border-radius:4px;overflow:hidden;margin:6px 0 8px">
      ${seg.map(o=>`<div title="${esc(o.n)}: ${fmtN(100*o.v/tot,'pct1')}"
        style="width:${100*o.v/tot}%;background:${o.c}"></div>`).join('')}</div>
    ${seg.map(o=>`<div class="row" style="padding:4px 0"><div class="k">
      <i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${o.c};
        margin-right:6px"></i>${esc(o.n)}</div>
      <div class="v"><span class="num">${fmtN(o.v,'int')}</span>
      <span class="u">${fmtN(100*o.v/tot,'pct1')}</span></div></div>`).join('')}
    <div class="selo s-ok" style="margin-top:5px"><i class="dot"></i>Censo/IBGE · 2022 · quesito cor ou raça</div>
    ${om?`<p style="font-size:10.5px;color:var(--pend);line-height:1.5;margin-top:5px">
      O IBGE omitiu a célula em ${om} setor${om>1?'es':''} deste bairro por controle de divulgação;
      a soma é um piso, não o total exato.</p>`:''}</div>`;
}

/* favelas e comunidades urbanas do território */
function fcuHTML(p){
  const lista=p._fcu||(p._fcuNome?[p._fcuNome]:[]);
  if(!lista.length&&!p.fcu_pop)return '';
  return `<h3 class="sec">Favelas e comunidades urbanas
    <span class="chip tag">${lista.length||1}</span></h3>
    <div class="row"><div class="k">População residente em FCU
      <span class="selo s-ok"><i class="dot"></i>IBGE · 2022</span></div>
      <div class="v"><span class="num">${fmtN(p.fcu_pop||0,'int')}</span>
      <span class="u">${p.pct_fcu!=null?fmtN(p.pct_fcu,'pct1')+' do território':''}</span></div></div>
    <div class="row"><div class="k">Domicílios em FCU</div>
      <div class="v"><span class="num">${fmtN(p.fcu_dom||0,'int')}</span>
      <span class="u">domicílios</span></div></div>
    ${lista.length?`<p style="font-size:11px;color:var(--txt3);line-height:1.6;margin-top:7px">
      ${esc(lista.join(' · '))}</p>`:''}`;
}

function graficoVazio(t,s){
  return `<div style="margin-top:9px"><span class="eyebrow">${esc(t)}</span>
    <div class="frame-empty" style="margin-top:6px;height:104px">
      <div class="t">não disponível</div><div class="s">${esc(s)}</div></div></div>`;
}

/* ────────────────────────────────────────────────── 14. COMPARAÇÃO ───── */
function addCmp(id){
  if(!id)return;
  if(S.cmp.includes(id))return;
  if(S.cmp.length>=4){toast('Máximo de 4 territórios na comparação.');return;}
  S.cmp.push(id); marcaSelecao(); if($('#analiseBody'))renderAnalise();
}

/* ── painel único: ranking à esquerda, comparação à direita ───────────── */
function renderAnalise(){
  const b=$('#analiseBody');
  if(S.nivel==='municipio'){
    b.innerHTML=`<div class="note warn">Selecione <b>Bairros</b> ou <b>Setores</b> no topo
      para ranquear e comparar territórios.</div>`;return;}
  const disp=IND.filter(i=>i.niveis.includes(S.nivel)&&i.status!=='pend'&&i.status!=='mun');
  if(!disp.length){b.innerHTML='<div class="note warn">Nenhum indicador com dado neste nível.</div>';return;}
  const cur=indAtual();
  const i=disp.find(x=>x.id===cur.id)||disp[0];
  const g=S.geo[S.nivel];
  let feats=g.features;
  if(S.nivel==='setor'&&S.muniFiltro!=null)feats=feats.filter(f=>f.properties.muni_id===S.muniFiltro);
  const arr=feats.map(f=>({id:f.properties.id,n:f.properties.nome,b:f.properties.bairro,
      m:f.properties.muni,v:f.properties[i.id]==null?null:+f.properties[i.id]}))
    .filter(o=>o.v!=null).sort((a,c)=>S._rankAsc?a.v-c.v:c.v-a.v);
  const sel=S.cmp.map(feature).filter(Boolean);

  b.innerHTML=`
  <div style="display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-bottom:12px">
    <select id="anInd" class="btn" style="padding:6px 9px;background:var(--bg3);max-width:340px">
      ${CATS.map(c=>{const l=disp.filter(x=>x.cat===c.id);
        return l.length?`<optgroup label="${esc(c.n)}">${l.map(x=>
          `<option value="${x.id}"${x.id===i.id?' selected':''}>${esc(x.n)}</option>`).join('')}</optgroup>`:'';
      }).join('')}
    </select>
    <div class="seg"><button id="anDesc" aria-pressed="${!S._rankAsc}">Maior → menor</button>
      <button id="anAsc" aria-pressed="${!!S._rankAsc}">Menor → maior</button></div>
    <span class="chip">${NIVEIS[S.nivel].n}</span>
    ${S.nivel==='setor'&&S.muniFiltro!=null?`<span class="chip acc">${esc(MUNIS_LISTA.nomes[S.muniFiltro])}</span>`:''}
    ${selo(i,S.nivel)}
    <button class="btn" id="anCsv" style="margin-left:auto">Exportar CSV</button>
  </div>
  ${i.status==='est'?`<div class="note warn" style="border-left-color:var(--est)">
    <b>Referência histórica com atribuição espacial.</b> ${esc(i.obs)}</div>`:''}
  <div class="grid2" style="grid-template-columns:1fr 1fr;gap:16px;align-items:start">
    <div>
      <h3 class="sec">Ranking <span class="chip tag">${nf.format(arr.length)}</span></h3>
      <p style="font-size:11px;color:var(--txt3);margin-bottom:7px">
        Clique para adicionar à comparação (até 4). Territórios já escolhidos ficam em âmbar.</p>
      <div style="max-height:52vh;overflow:auto">
      <table class="tb"><thead><tr><th style="width:38px">#</th><th>Território</th>
        <th style="text-align:right">${esc(i.u||'valor')}</th></tr></thead><tbody>
        ${arr.slice(0,300).map((o,k)=>`<tr style="cursor:pointer" data-add="${esc(o.id)}"
          ${S.cmp.includes(o.id)?'class="best"':''}>
          <td class="n" style="color:var(--txt3)">${k+1}</td>
          <td>${esc(o.n)}${o.b&&S.nivel==='setor'?`<br><span style="color:var(--txt3);font-size:10.5px">${esc(o.b)} · ${esc(o.m)}</span>`:''}</td>
          <td class="n">${fmtN(o.v,i.fmt)}</td></tr>`).join('')}
      </tbody></table></div>
      ${arr.length>300?`<p style="font-size:11px;color:var(--txt3);margin-top:7px">
        Exibindo 300 de ${nf.format(arr.length)} — use a exportação para a lista completa.</p>`:''}
    </div>
    <div>
      <h3 class="sec">Comparação <span class="chip tag">${sel.length}/4</span></h3>
      ${sel.length?comparaHTML(sel,i,arr):`<div class="note">
        Escolha territórios no ranking ao lado para montar a comparação.
        O objetivo é achar onde a atuação tem mais efeito: ordene pelo indicador que importa,
        selecione os piores colocados e compare o perfil completo deles.</div>`}
    </div>
  </div>`;

  $('#anInd').onchange=e=>{escolheIndicador(e.target.value);renderAnalise();};
  $('#anDesc').onclick=()=>{S._rankAsc=false;renderAnalise();};
  $('#anAsc').onclick=()=>{S._rankAsc=true;renderAnalise();};
  $('#anCsv').onclick=()=>baixaCSV(
    [['posicao','territorio','municipio','valor','indicador','unidade','fonte','ano','nivel','status']]
      .concat(arr.map((o,k)=>[k+1,o.n,o.m||'',o.v,i.n,i.u,(FONTES[i.fonte]||{}).n||i.fonte,
        i.ano,S.nivel,i.status==='est'?'HISTÓRICO 2010':'oficial'])),
    'ranking_atlas_rs1.csv');
  $$('#analiseBody [data-add]').forEach(tr=>tr.onclick=()=>{
    const id=tr.dataset.add;
    if(S.cmp.includes(id))S.cmp=S.cmp.filter(x=>x!==id);
    else addCmp(id);
    renderAnalise();});
  $$('#analiseBody [data-rm]').forEach(x=>x.onclick=e=>{
    e.stopPropagation();
    S.cmp=S.cmp.filter(v=>v!==x.dataset.rm);marcaSelecao();renderAnalise();});
  const lim=$('#anClear'); if(lim)lim.onclick=()=>{S.cmp=[];marcaSelecao();renderAnalise();};
  const ir=$('#anGo'); if(ir)ir.onclick=()=>{fechaModais();selecionar(S.cmp[0]);};
}

function comparaHTML(feats,ind0,arr){
  const inds=IND.filter(x=>x.niveis.includes(S.nivel)&&x.status!=='pend'
    &&feats.some(f=>f.properties[x.id]!=null));
  const pos=id=>{const k=arr.findIndex(o=>o.id===id);return k<0?null:k+1;};
  return `
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
    ${feats.map(f=>`<span class="chip acc" style="display:inline-flex;gap:5px;align-items:center">
      ${esc(f.properties.nome)}
      <button data-rm="${esc(f.properties.id)}" style="color:inherit;font-size:13px;padding:0 2px">×</button>
    </span>`).join('')}
    <button class="btn" id="anClear" style="padding:2px 8px;font-size:11px">limpar</button>
    <button class="btn pri" id="anGo" style="padding:2px 8px;font-size:11px">abrir no mapa</button>
  </div>
  <div style="max-height:52vh;overflow:auto">
  <table class="tb"><thead><tr><th>Indicador</th>
    ${feats.map(f=>`<th style="text-align:right">${esc(f.properties.nome)}</th>`).join('')}</tr></thead>
  <tbody>
    <tr><td><b>Posição no ranking atual</b></td>
      ${feats.map(f=>`<td class="n">${pos(f.properties.id)?'#'+pos(f.properties.id):'—'}</td>`).join('')}</tr>
    ${inds.map(x=>{
      const vs=feats.map(f=>f.properties[x.id]==null?null:+f.properties[x.id]);
      const val=vs.filter(v=>v!=null);
      const mx=Math.max(...val), mn=Math.min(...val);
      return `<tr><td>${esc(x.n)}<br>${selo(x,S.nivel)}</td>${vs.map(v=>
        `<td class="n ${val.length>1&&v===mx?'best':val.length>1&&v===mn?'worst':''}">
          ${v==null?'<span style="color:var(--txt3)">—</span>':fmtN(v,x.fmt)}</td>`).join('')}</tr>`;
    }).join('')}
  </tbody></table></div>`;
}

function renderCmp(){
  $('#cmpLvl').textContent=NIVEIS[S.nivel].n;
  const b=$('#cmpBody');
  if(S.nivel==='municipio'||S.nivel==='regiao'){
    b.innerHTML=`<div class="note warn">A comparação exige um nível intramunicipal.
      Selecione <b>Bairros</b> ou <b>Setores</b> no topo.</div>`;return;
  }
  const feats=S.cmp.map(feature).filter(Boolean);
  const slots=[0,1,2,3].map(k=>{
    const f=feats[k];
    return f?`<div class="cmp-slot"><span class="chip mono">${k+1}</span>
      <span class="n">${esc(f.properties.nome)}</span>
      <button class="rm" data-rm="${esc(f.properties.id)}" aria-label="Remover">×</button></div>`
    :`<div class="cmp-slot ph">vazio — clique em um território no mapa</div>`;
  }).join('');

  let tabela='';
  if(feats.length>=1){
    const inds=IND.filter(i=>i.niveis.includes(S.nivel)&&i.status!=='pend'
      &&feats.some(f=>f.properties[i.id]!=null));
    tabela=`<table class="tb"><thead><tr><th>Indicador</th>
      ${feats.map(f=>`<th style="text-align:right">${esc(f.properties.nome)}</th>`).join('')}</tr></thead>
      <tbody>${inds.map(i=>{
        const vs=feats.map(f=>f.properties[i.id]==null?null:+f.properties[i.id]);
        const val=vs.filter(v=>v!=null); const mx=Math.max(...val),mn=Math.min(...val);
        return `<tr><td>${esc(i.n)}<br>${selo(i,S.nivel)}</td>${vs.map(v=>
          `<td class="n ${v===mx&&val.length>1?'best':v===mn&&val.length>1?'worst':''}">
            ${v==null?'<span style="color:var(--txt3)">sem dado</span>':fmtN(v,i.fmt)}</td>`).join('')}</tr>`;
      }).join('')}</tbody></table>
      ${barrasCmp(feats)}`;
    const pendCount=IND.filter(i=>i.niveis.includes(S.nivel)&&i.status==='pend').length;
    tabela+=`<div class="note warn" style="margin-top:14px">
      Mais <b>${pendCount} indicadores</b> deste nível geográfico estão catalogados e
      aguardando integração — quando os arquivos forem carregados, entram automaticamente nesta tabela.</div>`;
  }else{
    tabela=`<div class="note">Clique nos territórios no mapa (até 4) para montar a comparação.
      Os selecionados ficam destacados em âmbar.</div>`;
  }
  b.innerHTML=`<div class="grid2" style="grid-template-columns:1fr 1fr;margin-bottom:14px">${slots}</div>
    <div style="display:flex;gap:7px;margin-bottom:13px">
      <button class="btn" id="cmpClear">Limpar seleção</button>
      <button class="btn" id="cmpCsv">Exportar CSV</button></div>${tabela}`;
  $$('[data-rm]').forEach(x=>x.onclick=()=>{S.cmp=S.cmp.filter(i=>i!==x.dataset.rm);marcaSelecao();renderCmp();});
  $('#cmpClear').onclick=()=>{S.cmp=[];marcaSelecao();renderCmp();};
  $('#cmpCsv').onclick=()=>exportaCmp(feats);
}
function barrasCmp(feats){
  const i=indAtual();
  if(i.status==='pend'||!feats.length)return '';
  const vs=feats.map(f=>({n:f.properties.nome,v:f.properties[i.id]==null?null:+f.properties[i.id]}));
  const mx=Math.max(...vs.map(o=>o.v||0))||1, w=560,bh=26,h=vs.length*(bh+9)+26;
  return `<h3 class="sec" style="margin-top:18px">${esc(i.n)} ${selo(i,S.nivel)}</h3>
    <svg class="chart" viewBox="0 0 ${w} ${h}" style="max-height:${h}px">
      ${vs.map((o,k)=>{
        const y=k*(bh+9)+4, bw=o.v==null?0:Math.max(2,(o.v/mx)*(w-190));
        return `<text x="0" y="${y+17}" class="lbl">${esc(o.n.slice(0,24))}</text>
          <rect x="150" y="${y}" width="${bw}" height="${bh}" rx="3"
            fill="${corDe(o.v,S._brk||[],S._ramp||i.ramp)||'#26333F'}"/>
          <text x="${155+bw}" y="${y+17}" class="val">${o.v==null?'sem dado':fmtN(o.v,i.fmt)}</text>`;
      }).join('')}</svg>`;
}
function exportaCmp(feats){
  const inds=IND.filter(i=>i.niveis.includes(S.nivel)&&i.status!=='pend');
  const linhas=[['codigo','territorio','indicador','valor','unidade','fonte','ano','nivel_geografico','observacao']];
  feats.forEach(f=>inds.forEach(i=>{
    const v=f.properties[i.id]; if(v==null)return;
    linhas.push([`${f.properties.id}::${i.id}`,f.properties.nome,i.n,v,i.u,
      (FONTES[i.fonte]||{}).n||i.fonte,i.ano,S.nivel,i.obs||'']);
  }));
  baixaCSV(linhas,'comparacao_atlas_poa.csv');
}
function baixaCSV(linhas,nome){
  const cel=c=>typeof c==='number'?String(c).replace('.',','):String(c??'');
  const csv='\uFEFF'+linhas.map(l=>l.map(c=>`"${cel(c).replace(/"/g,'""')}"`).join(';')).join('\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  a.download=nome; a.click(); URL.revokeObjectURL(a.href);
  toast('Arquivo exportado.','ok');
}

/* ──────────────────────────────────────────────────── 15. RANKING ────── */
function abreRanking(){abreModal('mdAnalise');}
function renderRank(){
  const b=$('#rankBody');
  if(S.nivel==='municipio'||S.nivel==='regiao'){
    b.innerHTML=`<div class="note warn">Ranking exige nível de bairro ou setor censitário.</div>`;return;}
  const disp=IND.filter(i=>i.niveis.includes(S.nivel)&&i.status!=='pend'&&i.status!=='mun');
  const g=S.geo[S.nivel]; if(!g)return;
  if(!disp.length){b.innerHTML='<div class="note warn">Nenhum indicador com dado carregado neste nível.</div>';return;}
  const cur=indAtual();
  const i=cur.niveis.includes(S.nivel)&&cur.status!=='pend'?cur:disp[0];
  const ordem=S._rankAsc?1:-1;
  const arr=g.features.map(f=>({id:f.properties.id,n:f.properties.nome,
      b:f.properties.bairro,v:f.properties[i.id]==null?null:+f.properties[i.id]}))
    .filter(o=>o.v!=null).sort((a,c)=>(a.v-c.v)*ordem);
  b.innerHTML=`
    <div style="display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-bottom:13px">
      <select id="rankInd" class="btn" style="padding:6px 9px;background:var(--bg3)">
        ${disp.map(x=>`<option value="${x.id}"${x.id===i.id?' selected':''}>${esc(x.n)}</option>`).join('')}
      </select>
      <div class="seg"><button id="rkDesc" aria-pressed="${!S._rankAsc}">Maior → menor</button>
        <button id="rkAsc" aria-pressed="${!!S._rankAsc}">Menor → maior</button></div>
      <span class="chip">${NIVEIS[S.nivel].n}</span>
      <button class="btn" id="rkCsv" style="margin-left:auto">Exportar CSV</button></div>
    ${selo(i,S.nivel)}
    <table class="tb" style="margin-top:9px"><thead><tr><th style="width:44px">#</th><th>Território</th>
      ${S.nivel==='setor'?'<th>Bairro</th>':''}
      <th style="text-align:right">${esc(i.u||'valor')}</th></tr></thead><tbody>
      ${arr.slice(0,200).map((o,k)=>`<tr style="cursor:pointer" data-goto2="${esc(o.id)}">
        <td class="n" style="color:var(--txt3)">${k+1}</td><td>${esc(o.n)}</td>
        ${S.nivel==='setor'?`<td style="color:var(--txt3)">${esc(o.b||'')}</td>`:''}
        <td class="n">${fmtN(o.v,i.fmt)}</td></tr>`).join('')}
    </tbody></table>
    ${arr.length>200?`<p style="font-size:11px;color:var(--txt3);margin-top:9px">
      Exibindo 200 de ${arr.length} — use a exportação para a lista completa.</p>`:''}`;
  $('#rankInd').onchange=e=>{escolheIndicador(e.target.value);renderRank();};
  $('#rkDesc').onclick=()=>{S._rankAsc=false;renderRank();};
  $('#rkAsc').onclick=()=>{S._rankAsc=true;renderRank();};
  $('#rkCsv').onclick=()=>baixaCSV(
    [['posicao','territorio','valor','indicador','unidade','fonte','ano','nivel_geografico']].concat(
      arr.map((o,k)=>[k+1,o.n,o.v,i.n,i.u,(FONTES[i.fonte]||{}).n||i.fonte,i.ano,S.nivel])),
    'ranking_atlas_poa.csv');
  $$('[data-goto2]').forEach(x=>x.onclick=()=>{fechaModais();selecionar(x.dataset.goto2);});
}

/* ────────────────────────────────────── 16. MATRIZ DE DISPONIBILIDADE ── */
function renderMatriz(){
  const nv=['municipio','regiao','bairro','setor'];
  const st=i=>{
    const out={};
    nv.forEach(n=>{
      if(!i.niveis.includes(n))out[n]='na';
      else if(n==='regiao')out[n]='pend';
      else out[n]=i.status==='ok'?'ok':i.status==='imp'?'imp':i.status==='ext'?'ext'
        :i.status==='est'?'est':i.status==='mun'?'mun':'pend';
    });
    return out;
  };
  $('#matrizBody').innerHTML=`
    <div class="note">Cada linha é um indicador com valor; cada coluna, um nível geográfico.
      A cor indica se o dado está <b>carregado</b>, se existe <b>apenas para o município</b>,
      se é uma <b>referência histórica</b> ou se vem de <b>fonte não oficial</b>.
      Células vazias significam que o indicador não é publicado naquele nível.</div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:13px;font-size:11.5px;color:var(--txt2)">
      <span><i class="mcell ok"></i> carregado</span>
      <span><i class="mcell mun"></i> só município</span>
      <span><i class="mcell est"></i> histórico 2010</span>
      <span><i class="mcell ext"></i> fonte não oficial</span>
      <span><i class="mcell imp"></i> arquivo do usuário</span>
      <span><i class="mcell na"></i> não se aplica</span></div>
    ${CATS.map(c=>{
      const inds=IND.filter(i=>i.cat===c.id); if(!inds.length)return '';
      return `<h3 class="sec">${esc(c.n)} <span class="chip tag">${inds.length}</span></h3>
      <table class="matrix"><thead><tr><th>Indicador</th>
        ${nv.map(n=>`<th>${NIVEIS[n].ab}</th>`).join('')}<th>Fonte · ano</th></tr></thead><tbody>
        ${inds.map(i=>{const s=st(i);return `<tr><td>${esc(i.n)}</td>
          ${nv.map(n=>`<td><i class="mcell ${s[n]}" title="${s[n]}"></i></td>`).join('')}
          <td style="text-align:right">${selo(i)}</td></tr>`;}).join('')}
      </tbody></table>`;
    }).join('')}`;
}

/* ─────────────────────────────────────── 17. FONTES E METODOLOGIA ────── */

/* ══════════════════════ METODOLOGIA ABERTA ═══════════════════════════════ */
const FORMULAS=[
 ['Densidade demográfica','hab/km²','população residente ÷ área do polígono do território',
  'Censo 2022 (população) e malha SMUrb/IBGE (área)','ok'],
 ['Participação na população do município','%','população do bairro ÷ 1.332.845 × 100','Censo 2022','ok'],
 ['Razão de sexo','homens por 100 mulheres','população masculina ÷ população feminina × 100','Censo 2022','ok'],
 ['Índice de envelhecimento','idosos por 100 crianças','população de 60+ ÷ população de 0 a 14 × 100','Censo 2022','ok'],
 ['Razão de dependência','%','(0 a 14 + 60 ou mais) ÷ (15 a 59) × 100','Censo 2022','ok'],
 ['Percentuais de cor ou raça','%','cada grupo ÷ soma dos cinco grupos DECLARADOS × 100. O denominador não é a população total: exclui os setores em que o IBGE omitiu a célula.','Censo 2022','ok'],
 ['Taxa de alfabetização','%','pessoas alfabetizadas de 15 anos ou mais ÷ população de 15 anos ou mais × 100','Censo 2022','ok'],
 ['Percentuais de domicílio e saneamento','%','categoria ÷ domicílios particulares permanentes ocupados (DPPO) × 100','Censo 2022','ok'],
 ['Esgotamento adequado','domicílios','rede geral ou pluvial + fossa séptica ou filtro (ligada ou não à rede)','Censo 2022','ok'],
 ['Esgotamento inadequado','domicílios','fossa rudimentar ou buraco + vala + outra forma + destinação inexistente','Censo 2022','ok'],
 ['Coleta de lixo','domicílios','coletado no domicílio por serviço de limpeza + depositado em caçamba do serviço','Censo 2022','ok'],
 ['Destino inadequado do lixo','domicílios','queimado na propriedade + jogado em terreno baldio','Censo 2022','ok'],
 ['Rendimento médio do responsável — nível bairro','R$/mês','média ponderada dos setores, peso = número de responsáveis em DPPO. O peso correto seria o número de responsáveis COM rendimento, que o IBGE não publica em separado. É aproximação, identificada como cálculo do Atlas.','Censo 2022','ok'],
 ['Óbitos por mil habitantes','por mil','óbitos declarados ÷ população × 1.000. Acumulado de 43 meses (jan/2019 a jul/2022), NÃO é taxa anual.','Censo 2022','ok'],
 ['Entorno da loja','—','soma dos setores cujo ponto representativo cai dentro do raio. Setor cortado pela borda entra inteiro ou fica de fora. Taxas são recalculadas sobre os totais somados, nunca é média de taxas.','Censo 2022','ok'],
 ['Comparações no painel de entorno','%','(valor do entorno − valor de referência) ÷ valor de referência × 100. Duas referências: o município da loja e a região (sete municípios), ambas somadas sobre os setores censitários.','Censo 2022','ok'],
 ['Indicadores de trabalho, renda, pobreza e desigualdade','vários','taxa da área de ponderação do Censo 2010 atribuída ao setor de 2022 cujo ponto representativo cai dentro dela. No nível de bairro, média ponderada pela população dos setores.','Censo 2010, amostra','est'],
 ['Índice de Gini','índice','Gini ponderado do rendimento domiciliar per capita, calculado sobre os registros da amostra de cada área de ponderação.','Censo 2010, amostra','est'],
 ['Linhas de pobreza','%','½ e ¼ do salário mínimo de julho/2010 (R$ 510,00) de rendimento domiciliar per capita.','Censo 2010, amostra','est'],
 ['Informalidade','%','(empregados sem carteira + conta própria + não remunerados) ÷ ocupados × 100','Censo 2010, amostra','est'],
];

function renderMetodo(){
  const nEst=IND.filter(i=>i.status==='est').length;
  const nOk=IND.filter(i=>i.status==='ok').length;
  $('#metodoBody').innerHTML=`
  <div class="note"><b>Regra editorial.</b> Todo número exibido é (a) publicado por fonte oficial,
  (b) calculado a partir dela por uma fórmula descrita aqui, ou (c) atribuído espacialmente e
  marcado como <b style="color:var(--est)">REFERÊNCIA HISTÓRICA</b>. Não há número inventado, rateado sem
  método ou apresentado sem ano. Indicadores de anos diferentes nunca são somados nem tratados
  como série.</div>

  <h3 class="sec">Os quatro estados de um indicador</h3>
  <div class="row"><div class="k"><span class="selo s-ok"><i class="dot"></i>oficial</span>
    &nbsp;publicado pela fonte ou somado diretamente dela</div>
    <div class="v"><span class="num">${nOk}</span></div></div>
  <div class="row"><div class="k"><span class="selo s-est"><i class="dot"></i>histórico 2010</span>
    &nbsp;taxa observada em 2010 atribuída ao território de 2022 — sempre com alerta na barra do mapa</div>
    <div class="v"><span class="num">${nEst}</span></div></div>
  <div class="row"><div class="k"><span class="selo s-mun"><i class="dot"></i>só município</span>
    &nbsp;sem representatividade abaixo do município; nunca rateado entre bairros</div>
    <div class="v"><span class="num">${IND.filter(i=>i.status==='mun').length}</span></div></div>
  <div class="row"><div class="k"><span class="selo s-imp"><i class="dot"></i>arquivo do usuário</span>
    &nbsp;valor adicional importado localmente, sem validação automática da origem</div>
    <div class="v"><span class="num">${IND.filter(i=>i.status==='imp').length}</span></div></div>

  <h3 class="sec">Por que trabalho e pobreza vêm de 2010</h3>
  <div class="note warn" style="border-left-color:var(--est)">
    O universo do Censo 2022 — que sustenta o resto do Atlas — <b>não pergunta</b> trabalho,
    rendimento domiciliar nem posição na ocupação. Essas perguntas estão na <b>amostra</b>, e a
    amostra de 2022 é de <b>acesso controlado pelo IBGE</b>: não existe arquivo público.
    O dado aberto mais recente é o de <b>2010</b>, publicado por área de ponderação.
    <br><br>
    <b>O que fizemos:</b> ${esc(METODO_EST||'ponto representativo do setor de 2022 dentro da área de ponderação de 2010; taxas copiadas, contagens não')}.
    <br><br>
    <b>O que isso não é:</b> não é projeção para 2022, não é interpolação e não capta nenhuma
    mudança ocorrida na década. Um setor que se transformou entre 2010 e 2022 carrega a taxa
    antiga. Use como ordenação relativa do território, não como medida do presente.
  </div>

  <h3 class="sec">Fórmulas, uma a uma</h3>
  <table class="tb"><thead><tr><th style="width:30%">Indicador</th><th style="width:12%">Unidade</th>
    <th>Cálculo</th><th style="width:16%">Fonte</th></tr></thead><tbody>
    ${FORMULAS.map(([n,u,f,fo,st])=>`<tr>
      <td><b>${esc(n)}</b>${st==='est'?' <span class="selo s-est"><i class="dot"></i>est</span>':''}</td>
      <td style="color:var(--txt3)">${esc(u)}</td>
      <td>${esc(f)}</td>
      <td style="color:var(--txt3)">${esc(fo)}</td></tr>`).join('')}
  </tbody></table>

  <h3 class="sec">Omissão de células pelo IBGE</h3>
  <p style="font-size:12px;color:var(--txt2);line-height:1.7">
    Para proteger o sigilo estatístico o IBGE omite células com poucos casos. Isso aparece de duas
    formas. Primeiro, <b>49 setores especiais</b> de Porto Alegre — quartel, unidade prisional,
    alojamento, convento, hospital — não têm os blocos de pessoas e domicílios publicados: são
    2.791 moradores que entram na população total mas não nos recortes por sexo, idade ou cor.
    Segundo, células isoladas somem em setores pequenos: a cor indígena é omitida em 764 dos 2.744
    setores da capital, e por isso a soma por bairro (1.757) fica abaixo do total do bloco
    Indígenas (2.004). <b>Nada é imputado.</b> Onde a célula falta, o valor aparece como ausente e
    a soma por bairro exibe o aviso “soma parcial — IBGE omitiu N setores”.</p>

  <h3 class="sec">Duas medidas de área, dois produtores</h3>
  <p style="font-size:12px;color:var(--txt2);line-height:1.7">
    A área dos bairros vem do polígono da malha SMUrb e os 94 bairros somam <b>472,81 km²</b>.
    A área dos setores vem do IBGE e soma <b>495,39 km²</b>. A área municipal publicada pelo IBGE
    é <b>496,83 km²</b>. A diferença é a lâmina d’água dentro do limite municipal que a malha de
    bairros não recobre. Por isso o indicador se chama “área do polígono”, e não “área territorial
    oficial”, e as duas medidas nunca são somadas entre si.</p>

  <h3 class="sec">Código de extração</h3>
  <p style="font-size:12px;color:var(--txt2);line-height:1.7">
    Todo dado deste Atlas é reproduzível. Os scripts de extração acompanham a distribuição, na
    pasta <b>extracao/</b>: download da fonte, filtro, cálculo e gravação dos arquivos de dados.
    São Python puro, sem dependência de serviço pago, e cada um traz no cabeçalho a fonte, o
    motivo das escolhas e o que a saída não significa.</p>
  <pre style="background:var(--bg3);border:1px solid var(--line);border-radius:6px;padding:12px;
    font-family:var(--mono);font-size:10.5px;color:var(--txt2);line-height:1.8">extracao/
├── 1_censo2022_setores.py     universo 2022 por setor (7 municípios)
├── 2_pib_municipios.py        PIB e VAB, Tabela 5938 do IBGE
├── 3_equipamentos.py          escolas do INEP e unidades do CNES
├── 4_censo2010_amostra.py     trabalho, renda, pobreza e Gini (2010)
├── 5_junta_2010_setores.py    atribuição espacial 2010 → setores de 2022
└── 6_monta_dados.py           gera os arquivos dados/*.js</pre>`;
}

function renderFontes(){
  const usos={};
  IND.forEach(i=>{(usos[i.fonte]=usos[i.fonte]||[]).push(i);});
  $('#fontesBody').innerHTML=`
    <div class="note"><b>Regra editorial do Atlas.</b> Nenhum número é inventado. Cada valor carrega
    fonte, ano e nível geográfico; referências históricas são sinalizadas. Indicadores de anos diferentes
    nunca são somados nem apresentados como uma mesma série, e dados municipais não são
    divididos entre bairros.</div>

    <h3 class="sec">O que já está carregado</h3>
    <div class="src-card"><div class="hd"><b>Seis eixos municipais — sete municípios</b>
      <span class="selo s-ok"><i class="dot"></i>cobertura completa</span></div>
      <p><b>Saúde:</b> estabelecimentos ativos do CNES (2026) e despesas do SICONFI (2024).
      <b>Assistência:</b> despesas municipais (2024) e referências históricas do Censo 2010.
      <b>Segurança:</b> ocorrências da SSP/RS (2025). <b>Emprego:</b> indicadores históricos
      observados no Censo 2010 e despesa em trabalho (2024). <b>Finanças:</b> receitas, despesas,
      investimentos e resultado da DCA/SICONFI (2024). <b>Agro:</b> VAB do PIB Municipal (2021)
      e despesa municipal em agricultura (2024).</p></div>

    <div class="src-card"><div class="hd"><b>Equipamentos georreferenciados</b>
      <span class="selo s-ok"><i class="dot"></i>CNES 2026 · INEP 2025</span></div>
      <p><b>567 estabelecimentos de saúde ativos</b> e <b>1.650 escolas em atividade</b>, com
      cobertura de Porto Alegre, Canoas, Gravataí, Sapucaia do Sul, Cachoeirinha, Guaíba e
      Esteio. As contagens por bairro são calculadas por ponto dentro do polígono.</p></div>

    <div class="src-card"><div class="hd"><b>Censo Demográfico 2022 — agregados por setor censitário</b>
      <span class="selo s-ok"><i class="dot"></i>Censo/IBGE · 2022</span></div>
      <p>Resultados do universo por setor censitário, nos blocos Básico, Pessoas, Domicílios,
      Óbitos, Indígenas, Quilombolas e Responsável/Renda. Cobrem os
      <b>2.744 setores</b> de Porto Alegre e somam exatamente <b>1.332.845</b> pessoas,
      idêntico ao total municipal publicado. Daí saem sexo, faixas etárias, cor ou raça,
      alfabetização, rendimento do responsável, tipo e condição do domicílio, água, esgoto,
      lixo e óbitos.</p>
      <p style="margin-top:5px">O acesso foi feito pela distribuição do pacote
      <b>censobr</b>, do IPEA, que republica os arquivos do IBGE sem alterar valores.
      A fonte primária continua sendo o IBGE e é assim que o Atlas a identifica.</p>
      <a href="https://github.com/ipeaGIT/censobr" target="_blank" rel="noopener">censobr ↗</a></div>

    <div class="src-card"><div class="hd"><b>Omissão de células pelo IBGE</b>
      <span class="selo s-pend"><i class="dot"></i>controle de divulgação</span></div>
      <p>Para proteger o sigilo estatístico, o IBGE omite células com poucos casos. Isso aparece
      de duas formas no Atlas. Primeiro, <b>49 setores especiais</b> — quartel, unidade prisional,
      alojamento, convento, hospital — não têm os blocos de pessoas e domicílios publicados;
      são 2.791 moradores que entram na população total mas não nos recortes por sexo, idade
      ou cor. Segundo, células isoladas somem em setores pequenos: a cor indígena, por exemplo,
      é omitida em 764 dos 2.744 setores, e por isso a soma por bairro (1.757) fica abaixo do
      total do bloco Indígenas (2.004).</p>
      <p style="margin-top:5px">O Atlas <b>não imputa nada</b>. Onde a célula falta o valor é
      exibido como ausente, e nas somas por bairro aparece o aviso
      <b>“soma parcial — IBGE omitiu N setores”</b>.</p></div>

    <div class="src-card"><div class="hd"><b>Malha de bairros</b>
      <span class="selo s-ok"><i class="dot"></i>SMUrb/PMPA · 2016</span></div>
      <p>94 bairros com limites da Lei Municipal nº 12.112, de 22/08/2016. Base aerofotogramétrica
      1:1.000, SIRGAS2000. Geometria generalizada para uso em tela; áreas e cálculos usam o valor
      original. A atribuição de cada setor ao seu bairro vem do próprio IBGE (campo NM_BAIRRO),
      e a população por bairro assim obtida coincide número a número com a série
      ObservaPOA/SMPAE do Censo 2022.</p>
      <a href="https://prefeitura.poa.br/smpg/observapoa/censo-2022" target="_blank" rel="noopener">ObservaPOA ↗</a></div>

    <div class="src-card"><div class="hd"><b>Malha de setores censitários</b>
      <span class="selo s-ok"><i class="dot"></i>IBGE · 2022</span></div>
      <p>2.744 setores censitários, todos com dados do Censo 2022 e vinculados ao bairro
      correspondente.</p></div>

    <div class="src-card"><div class="hd"><b>Favelas e Comunidades Urbanas</b>
      <span class="selo s-ok"><i class="dot"></i>IBGE · 2022</span></div>
      <p>Recorte oficial do IBGE, identificado setor a setor. Porto Alegre tem
      <b>125 favelas e comunidades urbanas</b>, com <b>175.519 moradores</b> — 13,2% da cidade.
      A camada pode ser ligada no painel de camadas do mapa.</p>
      <a href="https://www.ibge.gov.br/geociencias/organizacao-do-territorio/tipologias-do-territorio/15788-favelas-e-comunidades-urbanas.html" target="_blank" rel="noopener">metodologia ↗</a></div>

    <div class="src-card"><div class="hd"><b>Indicadores ambientais por bairro</b>
      <span class="selo s-ext"><i class="dot"></i>geoclimate-poa · não oficial</span></div>
      <p>Temperatura de superfície, NDVI e cobertura urbana/vegetada derivadas de sensoriamento
      remoto por um projeto de terceiro. Não é fonte estatística oficial e está sinalizada como
      tal em toda a interface.</p>
      <a href="https://github.com/rafaelparanhoss/geoclimate-poa" target="_blank" rel="noopener">repositório ↗</a></div>

    <h3 class="sec">Fontes ativas no Atlas</h3>
    ${Object.keys(FONTES).map(k=>{
      const f=FONTES[k], u=usos[k]||[];
      if(!u.length)return '';
      const nOk=u.filter(i=>i.status==='ok'||i.status==='ext'||i.status==='mun').length;
      return `<div class="src-card"><div class="hd"><b>${esc(f.n)}</b>
        <span class="chip">${nOk}/${u.length} ativos</span></div>
        ${f.d?`<p>${esc(f.d)}</p>`:''}
        <p style="margin-top:5px;color:var(--txt3)">${esc(u.slice(0,10).map(i=>i.n).join(' · '))}${u.length>10?` e mais ${u.length-10}`:''}</p>
        ${f.u?`<a href="${f.u}" target="_blank" rel="noopener">${esc(f.u.replace(/^https?:\/\//,'').slice(0,58))} ↗</a>`:''}</div>`;
    }).join('')}

    <h3 class="sec">Notas metodológicas</h3>
    <div class="src-card"><div class="hd"><b>Densidade demográfica</b></div>
      <p>População residente do Censo 2022 dividida pela área do polígono oficial do território.
      É um cálculo do Atlas, identificado como tal, e não um número publicado pelo IBGE.
      Para o município, o Atlas exibe o valor publicado pelo IBGE (2.690,50 hab/km²) em vez do cálculo próprio.</p></div>
    <div class="src-card"><div class="hd"><b>Rendimento do responsável: setor é oficial, bairro é calculado</b></div>
      <p>O IBGE publica, por setor, o rendimento nominal médio mensal das pessoas responsáveis
      com rendimentos. No nível de setor o Atlas exibe esse valor tal como publicado.
      No nível de bairro não existe valor publicado, então o Atlas calcula a
      <b>média ponderada pelo número de responsáveis</b> de cada setor. É uma aproximação
      identificada como cálculo do Atlas — o peso correto seria o número de responsáveis
      <i>com rendimento</i>, que não é publicado separadamente. É também um rendimento de
      responsáveis, não renda domiciliar per capita.</p></div>
    <div class="src-card"><div class="hd"><b>Óbitos do Censo não são estatística vital</b></div>
      <p>O Censo pergunta sobre falecimentos de moradores entre janeiro de 2019 e julho de 2022.
      São 43 meses acumulados, declarados por quem ficou no domicílio. Não substituem o SIM/DATASUS
      e não devem ser lidos como taxa anual de mortalidade.</p></div>
    <div class="src-card"><div class="hd"><b>Duas medidas de área, dois produtores</b></div>
      <p>A área dos bairros vem do polígono da malha SMUrb e os 94 bairros somam <b>472,81 km²</b>.
      A área dos setores vem do IBGE e soma <b>495,39 km²</b>. A área municipal publicada pelo IBGE
      é <b>496,83 km²</b>. A diferença é a lâmina d’água dentro do limite municipal que a malha de
      bairros não recobre. O Atlas exibe cada medida com seu produtor e nunca soma uma com a outra;
      por isso o indicador se chama “área do polígono”, e não “área territorial oficial”.</p></div>
    <div class="src-card"><div class="hd"><b>Uma única série de população</b></div>
      <p>Bairro e setor vêm do mesmo arquivo de agregados do Censo 2022: o bairro é a soma dos seus
      setores, usando a atribuição do próprio IBGE. Não há duas séries concorrentes, e a soma dos
      94 bairros reproduz exatamente o total municipal.</p></div>
    <div class="src-card"><div class="hd"><b>Índice sintético de vulnerabilidade</b></div>
      <p>Está no catálogo, com metodologia definida — normalização e média ponderada de baixa renda,
      pobreza, escolaridade, saneamento precário, desemprego e dependência de programas sociais.
      Como nenhum desses insumos está integrado, <b>o índice não é calculado nem exibido</b>.
      Um índice sintético é sempre uma construção analítica, não um dado observado.</p></div>
    <div class="src-card"><div class="hd"><b>Segurança pública</b></div>
      <p>Somente informação agregada e pública. O Atlas não geolocaliza vítimas nem endereços individuais.</p></div>
    <div class="src-card"><div class="hd"><b>Representatividade</b></div>
      <p>A PNAD Contínua não tem representatividade intramunicipal para Porto Alegre; seus indicadores
      ficam restritos ao painel municipal. Finanças públicas, PIB, CEMPRE e IDHM também são
      exclusivamente municipais e não são rateados entre bairros.</p></div>`;
}

/* ──────────────────────────────────────────────── 18. INGESTÃO DE DADOS  */
function renderDados(){
  $('#dadosBody').innerHTML=`
    <div class="note">Carregue arquivos <b>GeoJSON</b> (malhas) ou <b>CSV</b> (indicadores).
      O arquivo fica apenas no seu navegador — nada é enviado para servidor.</div>
    <div class="drop" id="drop">
      <b>Arraste um arquivo aqui</b>
      <p>ou <button class="btn" id="pick" style="display:inline-flex">escolher arquivo</button><br>
      <span style="font-family:var(--mono);font-size:10.5px">.geojson · .json · .csv</span></p>
      <input type="file" id="file" accept=".geojson,.json,.csv,.txt" hidden multiple>
    </div>

    <h3 class="sec">Malhas já embutidas</h3>
    <p style="font-size:12px;color:var(--txt2);line-height:1.6;margin-bottom:9px">
      <span class="selo s-ok"><i class="dot"></i>${nf.format(S.geo.bairro.features.length)} bairros</span>
      &nbsp;<span class="selo s-ok"><i class="dot"></i>${nf.format(S.geo.setor?S.geo.setor.features.length:RAW_SETORES.geom.length)} setores censitários</span><br>
      Geometria embutida e decodificada sob demanda — nada precisa ser baixado à parte.
      Carregue GeoJSON aqui só para <b>substituir</b> uma malha ou acrescentar outra.</p>

    <h3 class="sec">Formato longo — o modelo do próprio Atlas</h3>
    <p style="font-size:11.5px;color:var(--txt3);line-height:1.6;margin-bottom:7px">
      Uma linha por par território × indicador. É o formato exportado pelos botões abaixo,
      então o arquivo exportado <b>volta a ser lido</b> por aqui. Se o
      <code>codigo</code> vier no padrão <code>territorio::indicador</code>, o Atlas reconhece o
      indicador e <b>preenche a lacuna correspondente do catálogo</b> em vez de criar um novo.
      A coluna <code>nivel_geografico</code> roteia cada linha para bairro ou setor.</p>
    <pre style="background:var(--bg3);border:1px solid var(--line);border-radius:6px;padding:11px;
      font-family:var(--mono);font-size:10.5px;color:var(--txt2);overflow:auto;line-height:1.7">codigo;territorio;indicador;valor;unidade;fonte;ano;nivel_geografico
restinga::renda_renda_domiciliar_per_capita;Restinga;Renda domiciliar per capita;987,40;R$;IBGE — Censo 2022;2022;bairro</pre>

    <h3 class="sec">Formato largo — uma coluna por indicador</h3>
    <p style="font-size:11.5px;color:var(--txt3);line-height:1.6;margin-bottom:7px">
      Separador <b>;</b> ou <b>,</b>. Uma coluna identifica o território (<code>territorio</code>,
      <code>bairro</code>, <code>nome</code> ou <code>cd_setor</code>); as demais colunas numéricas
      viram indicadores novos. Nomes casam ignorando acentos e caixa. Números aceitam
      <code>987,40</code> e <code>1.234,50</code> tanto quanto <code>987.4</code>.</p>
    <pre style="background:var(--bg3);border:1px solid var(--line);border-radius:6px;padding:11px;
      font-family:var(--mono);font-size:10.5px;color:var(--txt2);overflow:auto;line-height:1.7">territorio;renda_dom_per_capita;pct_esgoto_adequado
Restinga;987,40;71,2
Moinhos de Vento;7412,90;99,8</pre>

    <h3 class="sec">Modelo de dados do Atlas</h3>
    <pre style="background:var(--bg3);border:1px solid var(--line);border-radius:6px;padding:11px;
      font-family:var(--mono);font-size:10.5px;color:var(--txt2);overflow:auto;line-height:1.7">{ codigo, territorio, indicador, valor, unidade,
  fonte, ano, nivel_geografico, observacao }</pre>

    <h3 class="sec">Exportar o que está carregado</h3>
    <div style="display:flex;gap:7px;flex-wrap:wrap">
      <button class="btn" id="expBairro">Bairros (CSV longo)</button>
      <button class="btn" id="expSetor">Setores (CSV longo)</button>
      <button class="btn" id="expCat">Catálogo de indicadores</button></div>

    ${S.importados.length?`<h3 class="sec">Importado nesta sessão</h3>
      ${S.importados.map(x=>`<div class="row"><div class="k">${esc(x.nome)}
        <span class="selo s-imp"><i class="dot"></i>${esc(x.formato?'formato '+x.formato:'arquivo do usuário')}</span>
        ${x.criados!=null?`<div style="font-size:10.5px;color:var(--txt3);margin-top:3px">
          ${x.preenchidos} lacunas preenchidas · ${x.criados} indicadores criados
          ${x.avisos&&x.avisos.length?'<br>⚠ '+esc(x.avisos.join(' · ')):''}</div>`:''}</div>
        <div class="v"><span class="num">${nf.format(x.n)}</span><span class="u">valores</span></div></div>`).join('')}`:''}`;

  const fi=$('#file'), dp=$('#drop');
  $('#pick').onclick=()=>fi.click();
  fi.onchange=e=>[...e.target.files].forEach(leArquivo);
  ['dragenter','dragover'].forEach(ev=>dp.addEventListener(ev,e=>{e.preventDefault();dp.classList.add('over');}));
  ['dragleave','drop'].forEach(ev=>dp.addEventListener(ev,e=>{e.preventDefault();dp.classList.remove('over');}));
  dp.addEventListener('drop',e=>[...e.dataTransfer.files].forEach(leArquivo));
  $('#expBairro').onclick=()=>exportaNivel('bairro');
  $('#expSetor').onclick=()=>{garanteSetores();exportaNivel('setor');};
  $('#expCat').onclick=()=>baixaCSV(
    [['id','categoria','indicador','unidade','fonte','ano','niveis','status','observacao']].concat(
      IND.map(i=>[i.id,(CATS.find(c=>c.id===i.cat)||{}).n,i.n,i.u,(FONTES[i.fonte]||{}).n||i.fonte,
        i.ano,i.niveis.join('|'),i.status,i.obs||''])),'catalogo_indicadores_atlas_poa.csv');
}
function exportaNivel(nivel){
  const g=S.geo[nivel]; if(!g)return;
  const inds=IND.filter(i=>i.niveis.includes(nivel)&&i.status!=='pend');
  const l=[['codigo','territorio','indicador','valor','unidade','fonte','ano','nivel_geografico','observacao']];
  g.features.forEach(f=>inds.forEach(i=>{
    const v=f.properties[i.id];
    const fk=(i.fontePorNivel&&i.fontePorNivel[nivel])||i.fonte;
    l.push([`${f.properties.id}::${i.id}`,f.properties.nome,i.n,v??'',i.u,
      (FONTES[fk]||{}).n||fk,i.ano,nivel,
      v==null?'sem correspondência na fonte':(i.obs||'')]);
  }));
  baixaCSV(l,`indicadores_${nivel}_atlas_poa.csv`);
}
function leArquivo(file){
  const r=new FileReader();
  r.onload=()=>{
    try{
      if(/\.(geojson|json)$/i.test(file.name))aplicaGeoJSON(JSON.parse(r.result),file.name);
      else aplicaCSV(r.result,file.name);
    }catch(e){toast('Não foi possível ler '+file.name+': '+e.message,'err');}
  };
  r.onerror=()=>toast('Falha ao ler o arquivo.','err');
  r.readAsText(file,'utf-8');
}
function aplicaGeoJSON(gj,nome){
  if(!gj||gj.type!=='FeatureCollection'||!Array.isArray(gj.features))
    throw new Error('esperado um FeatureCollection');
  const p0=gj.features[0]?.properties||{};
  const alvo = ('bairro_id' in p0 || /setor/i.test(gj.name||nome)) ? 'setor' : 'bairro';
  gj.features.forEach((f,k)=>{ f.properties=f.properties||{};
    if(f.properties.id==null)f.properties.id=String(f.properties.CD_SETOR||f.properties.cd_setor||k);
    if(f.properties.nome==null)f.properties.nome=f.properties.NM_BAIRRO||f.properties.bairro||('Território '+k);
  });
  S.geo[alvo]=gj; S._fit=false;
  S.importados.push({nome,n:gj.features.length});
  toast(`${gj.features.length} feições carregadas no nível ${NIVEIS[alvo].n.toLowerCase()}.`,'ok');
  setNivel(alvo); renderDados();
}
function aplicaCSV(txt,nome){
  const linhas=txt.replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n').filter(l=>l.trim());
  if(linhas.length<2)throw new Error('o arquivo não tem linhas de dados');
  const sep=(linhas[0].match(/;/g)||[]).length>=(linhas[0].match(/,/g)||[]).length?';':',';
  const corta=l=>l.split(sep).map(x=>x.trim().replace(/^"|"$/g,'').replace(/""/g,'"'));
  const head=corta(linhas[0]).map(h=>h.replace(/^\uFEFF/,''));
  const col=re=>head.findIndex(h=>re.test(norm(h)));
  const cTerr=col(/^(territorio|bairro|nome|cd_setor|setor|municipio|nm_bairro)$/),
        cInd =col(/^(indicador|variavel)$/), cVal=col(/^(valor|value)$/),
        cCod =col(/^(codigo|cod|id)$/), cUn=col(/^(unidade|unit)$/),
        cFon =col(/^fonte$/), cAno=col(/^ano$/), cNiv=col(/^(nivel_geografico|nivel)$/);
  const rows=linhas.slice(1).map(corta);
  const longo = cInd>=0 && cVal>=0 && (cTerr>=0||cCod>=0);
  const r = longo
    ? importaLongo(rows,{cTerr,cInd,cVal,cCod,cUn,cFon,cAno,cNiv},nome)
    : importaLargo(rows,head,cTerr>=0?cTerr:cCod,nome);
  relatorio(r,nome,longo);
}

/* índice de territórios de um nível: aceita nome, id e código do setor */
function indice(nivel){
  const g=S.geo[nivel]; if(!g)return null;
  const idx={};
  g.features.forEach(f=>{
    const p=f.properties;
    idx[norm(p.nome)]=f; idx[String(p.id)]=f;
    if(p.bairro)idx[norm(p.bairro)+'|'+String(p.id)]=f;
  });
  return idx;
}

/* ---- formato longo: o modelo de dados do próprio Atlas (§32) ----------- */
function importaLongo(rows,c,nome){
  const r={lidas:rows.length,casadas:0,semTerritorio:new Set(),semValor:0,
    municipais:0,semMalha:new Set(),criados:[],preenchidos:[],conflitos:[],niveis:new Set()};
  const idx={bairro:indice('bairro'),setor:indice('setor')};
  const pacote={};                       /* nivel::indId -> {meta, valores} */

  rows.forEach(row=>{
    const cod=c.cCod>=0?row[c.cCod]||'':'';
    const parte=cod.split('::');
    let nivel=c.cNiv>=0?norm(row[c.cNiv]):'';
    if(!/^(bairro|setor|municipio|regiao)$/.test(nivel))
      nivel = /^\d{15}$/.test((row[c.cTerr]||'').replace(/\D/g,''))?'setor':'bairro';
    r.niveis.add(nivel);
    if(nivel==='municipio'||nivel==='regiao'){r.municipais++;return;}
    if(!idx[nivel]){r.semMalha.add(nivel);return;}

    const chave=c.cTerr>=0?row[c.cTerr]:parte[0];
    const f=idx[nivel][norm(chave)]||idx[nivel][String(chave).trim()]
          ||(parte[0]?idx[nivel][norm(parte[0])]||idx[nivel][parte[0]]:null);
    if(!f){ if(r.semTerritorio.size<6)r.semTerritorio.add(chave); return; }

    const v=parseNum(row[c.cVal]);
    if(Number.isNaN(v)){r.semValor++;return;}

    const rotulo=row[c.cInd]||'indicador sem nome';
    const idBase=parte.length>1&&parte[1]?parte[1]:'imp_'+slugId(rotulo);
    const k=nivel+'::'+idBase;
    (pacote[k]=pacote[k]||{nivel,idBase,n:rotulo,
      u:c.cUn>=0?row[c.cUn]:'', fonte:c.cFon>=0?row[c.cFon]:'',
      ano:c.cAno>=0?(parseInt(row[c.cAno],10)||''):'', vals:[]}).vals.push([f,v]);
    r.casadas++;
  });

  Object.values(pacote).forEach(pk=>{
    const cat=getInd(pk.idBase);
    let alvo=pk.idBase;
    if(cat){
      if(cat.status==='pend'){                       /* preenche uma lacuna */
        cat.status='imp';
        if(!cat.niveis.includes(pk.nivel))cat.niveis.push(pk.nivel);
        cat.fonteDeclarada=pk.fonte; cat.fonteImp=pk.fonte;
        if(pk.ano)cat.ano=pk.ano;
        cat.obs=(cat.obs?cat.obs+' ':'')+'Valores carregados do arquivo '+nome+' nesta sessão.';
        r.preenchidos.push(cat.n);
      }else{                                    /* não sobrescreve o oficial */
        alvo='imp_'+pk.idBase; r.conflitos.push(cat.n);
      }
    }
    if(!getInd(alvo)){
      registraImportado(alvo,pk,nome); r.criados.push(pk.n);
    }else if(alvo!==pk.idBase){
      const e=getInd(alvo); if(!e.niveis.includes(pk.nivel))e.niveis.push(pk.nivel);
    }
    pk.vals.forEach(([f,v])=>{f.properties[alvo]=v;});
  });
  return r;
}

/* ---- formato largo: uma coluna por indicador -------------------------- */
function importaLargo(rows,head,cTerr,nome){
  if(cTerr<0)throw new Error(
    'nenhuma coluna de território encontrada. Esperado território, bairro, nome ou cd_setor. Colunas lidas: '+head.join(', '));
  const nivel=S.geo[S.nivel]?S.nivel:'bairro';
  const idx=indice(nivel);
  if(!idx)throw new Error('carregue antes uma malha geográfica');
  const r={lidas:rows.length,casadas:0,semTerritorio:new Set(),semValor:0,municipais:0,
    semMalha:new Set(),criados:[],preenchidos:[],conflitos:[],niveis:new Set([nivel])};
  const cols=head.map((h,k)=>k===cTerr?null:{h,k,id:'imp_'+slugId(h),usada:false}).filter(Boolean);
  rows.forEach(row=>{
    const f=idx[norm(row[cTerr])]||idx[String(row[cTerr]).trim()];
    if(!f){ if(r.semTerritorio.size<6)r.semTerritorio.add(row[cTerr]); return; }
    let algum=false;
    cols.forEach(c=>{
      const v=parseNum(row[c.k]);
      if(Number.isNaN(v)){return;}
      f.properties[c.id]=v; c.usada=true; algum=true;
    });
    if(algum)r.casadas++; else r.semValor++;
  });
  cols.filter(c=>c.usada).forEach(c=>{
    if(getInd(c.id))return;
    registraImportado(c.id,{nivel,n:c.h,u:'importado',fonte:'',ano:''},nome);
    r.criados.push(c.h);
  });
  return r;
}

function registraImportado(id,pk,nome){
  FONTES['USR_'+id]={n:pk.fonte||('Arquivo do usuário: '+nome),
    s:pk.fonte?pk.fonte.split('—')[0].trim().slice(0,28):'arquivo do usuário',
    u:'',d:'Carregado pelo usuário nesta sessão. Confira fonte, ano e método antes de publicar.',
    naoOficial:true};
  ind({id,cat:'visao',n:pk.n,u:pk.u||'importado',fonte:'USR_'+id,
    ano:pk.ano||new Date().getFullYear(),niveis:[pk.nivel],status:'imp',
    fmt:'dec2',ramp:'terra',
    obs:'Importado de '+nome+' nesta sessão. O Atlas não valida a origem de arquivos carregados pelo usuário.'});
}

function relatorio(r,nome,longo){
  const av=[];
  if(r.semMalha.size)av.push('malha de '+[...r.semMalha].join(' e ')+' não carregada');
  if(r.municipais)av.push(r.municipais+' linhas municipais ignoradas');
  if(r.semTerritorio.size)av.push('territórios não reconhecidos (ex.: '+[...r.semTerritorio].slice(0,2).join(', ')+')');
  if(r.semValor)av.push(r.semValor+' linhas sem valor numérico');
  if(r.conflitos.length)av.push(r.conflitos.length+' indicadores oficiais preservados');
  S.importados.push({nome,n:r.casadas,formato:longo?'longo':'largo',
    criados:r.criados.length,preenchidos:r.preenchidos.length,avisos:av});

  if(!r.casadas){
    toast('Nenhuma linha casou com um território. '+(av[0]||'Verifique a coluna de território.'),'err');
  }else{
    toast(`${nf.format(r.casadas)} valores carregados · ${r.preenchidos.length} indicadores preenchidos · ${r.criados.length} criados`,'ok');
  }
  renderCats(); renderDados(); desenhaMapa(); renderPainel();
}

/* ──────────────────────────────────────────────────────── 19. BUSCA ──── */
/* Índice montado uma vez. Antes cada tecla digitada rodava norm() — NFD mais
   duas regex — sobre os 148 bairros e os 4.722 setores. */
let IDX_BUSCA=null;
function indiceBusca(){
  if(IDX_BUSCA)return IDX_BUSCA;
  const out=[];
  (PONTOS&&PONTOS.lojas||[]).forEach((p,i)=>
    out.push({id:'loja:'+i,n:p.nome,sub:'loja Renner',nivel:'loja',
      kn:norm(p.nome),kb:'',ki:String(p.num)}));
  ['bairro','setor'].forEach(n=>{
    const g=S.geo[n]; if(!g)return;
    g.features.forEach(f=>{
      const p=f.properties;
      out.push({id:p.id,n:p.nome,sub:n==='setor'?p.bairro:'bairro',nivel:n,
        kn:norm(p.nome),kb:p.bairro?norm(p.bairro):'',ki:String(p.id)});
    });
  });
  IDX_BUSCA=out;
  return out;
}
function buscar(t){
  const s=$('#sugg');
  if(!t||t.length<2){s.style.display='none';return;}
  const q=norm(t), idx=indiceBusca(), out=[];
  for(let k=0;k<idx.length&&out.length<40;k++){
    const o=idx[k];
    if(o.kn.includes(q)||(o.kb&&o.kb.includes(q))||o.ki.includes(q))out.push(o);
  }
  if(!out.length){s.innerHTML=`<div style="color:var(--txt3);cursor:default">Nada encontrado</div>`;
    s.style.display='block';return;}
  s.innerHTML=out.map(o=>`<div data-id="${esc(o.id)}" data-n="${o.nivel}">
    <span>${esc(o.n)}</span><small>${esc(o.sub||'')}</small></div>`).join('');
  s.style.display='block';
  $$('#sugg div[data-id]').forEach(d=>d.onclick=()=>{
    if(d.dataset.n==='loja'){
      s.style.display='none'; $('#q').value='';
      if(!S.camadas.lojas){S.camadas.lojas=true;pontosOn('lojas',true);renderCamadas();}
      abreEntorno(+d.dataset.id.split(':')[1]); return;
    }
    if(d.dataset.n!==S.nivel)setNivel(d.dataset.n);
    selecionar(d.dataset.id); s.style.display='none'; $('#q').value='';
  });
}

/* ─────────────────────────────────────────────────────── 20. CAMADAS ── */

/* ────────────────────────────── camadas de pontos ────────────────────── */
const ESTILO_PONTO={
  escolas:{cor:'#4FB477',r:3.4,rot:'Escolas'},
  saude:{cor:'#34A0B8',r:3.8,rot:'Saúde'},
  lojas:{cor:'#D94F4F',r:7,rot:'Lojas Renner'}
};
/* Um renderer por camada — jamais um por marcador.
   Criar L.canvas()/L.svg() dentro do laço inseria um elemento <canvas> por
   ponto: 1.650 só para as escolas, 567 para a saúde. E eles ficavam órfãos no
   DOM quando a camada era desligada, acumulando a cada redesenho. */
const rendererPonto={};
function rendererDe(chave){
  if(!rendererPonto[chave])
    rendererPonto[chave]= chave==='lojas'
      ? L.svg({padding:.3,pane:'atlasPontos'})
      : L.canvas({padding:.4,pane:'atlasPontos'});
  return rendererPonto[chave];
}
/* montado sob demanda, na primeira vez que o tooltip abre */
function tooltipPontoHTML(p,loja){
  return `<b>${esc(p.nome)}</b>`+
    (p.rot?`<div class="kv"><span>${esc(loja?'Formato':'Tipo')}</span><span>${esc(loja?FORMATO[p.tipo]||p.tipo:p.rot)}</span></div>`:'')+
    (p.muni?`<div class="kv"><span>Município</span><span>${esc(p.muni)}</span></div>`:'')+
    (p.end?`<div style="font-size:10.5px;color:var(--txt3);margin-top:4px">${esc(p.end)}</div>`:'')+
    (loja?`<div class="hint">clique para analisar o entorno</div>`:'');
}
/* A camada é construída uma única vez; depois só entra e sai do mapa. */
function constroiPontos(chave){
  const e=ESTILO_PONTO[chave], loja=chave==='lojas', rend=rendererDe(chave);
  const g=L.layerGroup();
  PONTOS[chave].forEach((p,i)=>{
    const m=L.circleMarker([p.y,p.x],{
      renderer:rend,
      radius:e.r, fillColor:e.cor, color:loja?'#fff':'#4D636B',
      weight:loja?2:.6, fillOpacity:loja?1:.85, opacity:1, className:loja?'mk-loja':''
    });
    m.bindTooltip(()=>tooltipPontoHTML(p,loja),{className:'tt',sticky:true,direction:'top'});
    if(loja)m.on('click',()=>abreEntorno(i));
    g.addLayer(m);
  });
  return g;
}
function pontosOn(chave,on){
  if(!PONTOS||!PONTOS[chave])return;
  if(!camadasPonto[chave])camadasPonto[chave]=constroiPontos(chave);
  const g=camadasPonto[chave];
  if(on){ if(!map.hasLayer(g))g.addTo(map); }
  else if(map.hasLayer(g)) map.removeLayer(g);
}
const FORMATO={loja:'Loja de rua',shopping:'Shopping',aeroporto:'Aeroporto',adm:'Administrativo'};

/* ───────────── painel: perfil socioeconômico do entorno da loja ───────── */
function abreEntorno(i,raio){
  garanteSetores();
  const L0=PONTOS.lojas[i];
  S.loja=i; S.raio=raio||S.raio||1;
  focoLoja=L0;
  if(camadaRaio){map.removeLayer(camadaRaio);camadaRaio=null;}
  camadaRaio=L.circle([L0.y,L0.x],{radius:S.raio*1000,color:'#D94F4F',weight:1.6,
    fillColor:'#D94F4F',fillOpacity:.07,dashArray:'4,4',pane:'atlasSobre'}).addTo(map);
  map.fitBounds(camadaRaio.getBounds(),{padding:[40,40]});
  S.sel=null;
  $('#panelBody').innerHTML=entornoHTML(i);
  ligaPainel();
  $$('#panelBody [data-raio]').forEach(b=>b.onclick=()=>abreEntorno(i,+b.dataset.raio));
  const v=$('#btnVoltar'); if(v)v.onclick=()=>{
    S.loja=null;focoLoja=null;
    if(camadaRaio){map.removeLayer(camadaRaio);camadaRaio=null;}
    renderPainel();
  };
  if(window.innerWidth<=960)$('#panel').classList.add('open');
}
/* Termos de comparação do painel de entorno, somados sobre os setores:
   o município da loja e a região (os sete municípios). Constantes: calculados
   uma vez por chave. Antes havia um só termo, rotulado "POA" mas somado sobre
   os bairros dos sete municípios. */
const REFS={};
function refs(muni){
  const chave=muni||'__regiao';
  if(REFS[chave])return REFS[chave];
  const fs=garanteSetores().features.filter(f=>!muni||f.properties.muni===muni);
  const a=fs.reduce((a,f)=>{
    const q=f.properties;
    a.pop+=q.pop||0; a.pp+=q.raca_preta_parda||0; a.rc+=q._raca_total||0;
    a.id+=q.idosos_60||0; a.cr+=q.criancas_0_14||0;
    a.dppo+=q.dppo||0; a.esg+=q.esg_adequado||0; a.fcu+=q.fcu_pop||0;
    if(q.resp_renda!=null&&q.resp_n){a.rn+=q.resp_renda*q.resp_n; a.rd+=q.resp_n;}
    a.a15+=q.alfab_15||0; a.p15+=q.pop_15||0;
    return a;},{pop:0,pp:0,rc:0,id:0,cr:0,dppo:0,esg:0,fcu:0,rn:0,rd:0,a15:0,p15:0});
  if(!a.pop)return null;
  return REFS[chave]={
    pct_preta_parda:100*a.pp/a.rc, pct_idosos_60:100*a.id/a.pop,
    pct_criancas_0_14:100*a.cr/a.pop, pct_esgoto_adequado:100*a.esg/a.dppo,
    pct_fcu:100*a.fcu/a.pop, resp_renda:a.rn/a.rd,
    taxa_alfabetizacao:100*a.a15/a.p15
  };
}
function entornoHTML(i){
  const L0=PONTOS.lojas[i], R=entorno(L0.x,L0.y,S.raio), p=R.soma;
  const refMun=L0.muni?refs(L0.muni):null, refReg=refs(null);
  const linha=(rot,id,fmt,inverso)=>{
    const v=p[id];
    if(v==null)return '';
    const rm=refMun&&refMun[id], rr=refReg&&refReg[id];
    /* diferença arredondada; zero sai "0%", nunca "-0%" */
    const pct=r=>{const d=Math.round(100*(v-r)/r); return (d>0?'+':'')+nf.format(d||0)+'%';};
    let dif='';
    if(rm){
      /* a cor segue a comparação com o município da loja, a leitura principal;
         cada comparação numa linha, para não espremer a coluna do rótulo */
      const d=100*(v-rm)/rm, bom=inverso?d<0:d>0;
      dif=`<span class="u" style="color:${Math.abs(d)<5?'var(--txt3)':(bom?'var(--ok)':'var(--pend)')}">${pct(rm)} vs. ${esc(L0.muni)}</span>`+
        (rr?`<span class="u">${pct(rr)} vs. região</span>`:'');
    }else if(rr){
      dif=`<span class="u">${pct(rr)} vs. região</span>`;
    }
    return `<div class="row"><div class="k">${esc(rot)}</div>
      <div class="v"><span class="num">${fmtN(v,fmt)}</span>${dif}</div></div>`;
  };
  return `<div class="terr-h">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
      <button class="btn" id="btnVoltar" style="padding:3px 8px;font-size:11px">← Visão geral</button>
      <span class="eyebrow">Entorno da loja</span></div>
    <h2>${esc(L0.nome)}</h2>
    <div class="sub"><span class="chip acc">nº ${L0.num}</span>
      <span class="chip">${esc(FORMATO[L0.tipo]||L0.tipo)}</span>
      <span class="chip">${esc(L0.muni||'')}</span></div>
    <p style="font-size:11px;color:var(--txt3);margin-top:6px;line-height:1.5">${esc(L0.end||'')}</p>
    <div class="class-sel" style="margin-top:11px">
      ${RAIOS.map(r=>`<button data-raio="${r}" aria-pressed="${S.raio===r}">${r} km</button>`).join('')}
    </div></div>

  <h3 class="sec">População no raio de ${fmtN(S.raio,'dec1')} km</h3>
  ${p._n?`
  <div class="hero-kpi">
    <div class="kpi"><span class="lb">Moradores</span>
      <span class="vl">${fmtN(p.pop,'int')}</span>
      <span class="selo s-ok"><i class="dot"></i>Censo/IBGE · 2022</span></div>
    <div class="kpi"><span class="lb">Domicílios</span>
      <span class="vl">${fmtN(p.dppo,'int')}</span>
      <span class="selo s-ok"><i class="dot"></i>Censo/IBGE · 2022</span></div>
  </div>
  ${linha('Rendimento médio do responsável','resp_renda','brl')}
  ${linha('População preta ou parda','pct_preta_parda','pct1')}
  ${linha('Crianças e adolescentes (0 a 14)','pct_criancas_0_14','pct1')}
  ${linha('Idosos (60 anos ou mais)','pct_idosos_60','pct1')}
  ${linha('Taxa de alfabetização (15+)','taxa_alfabetizacao','pct1',true)}
  ${linha('Em favelas e comunidades urbanas','pct_fcu','pct1')}
  ${linha('Esgotamento sanitário adequado','pct_esgoto_adequado','pct1',true)}
  <div class="row"><div class="k">Domicílios em cortiço ou estrutura degradada</div>
    <div class="v"><span class="num">${fmtN(p.dom_precario,'int')}</span></div></div>
  <div class="row"><div class="k">Domicílios sem banheiro</div>
    <div class="v"><span class="num">${fmtN(p.ban_nenhum,'int')}</span></div></div>

  <h3 class="sec">Equipamentos no raio <span class="chip tag">públicos e privados</span></h3>
  <div class="row"><div class="k">Escolas
    <span class="selo s-ok"><i class="dot"></i>Censo Escolar/INEP · 2025</span></div>
    <div class="v"><span class="num">${R.escolas.length}</span></div></div>
  ${['Municipal','Estadual','Federal','Privada'].map(r=>{
    const n=R.escolas.filter(e=>e.rot===r).length;
    return n?`<div class="row" style="padding:3px 0"><div class="k"
      style="padding-left:14px;color:var(--txt3)">${r}</div>
      <div class="v"><span class="num">${n}</span></div></div>`:'';}).join('')}
  <div class="row"><div class="k">Unidades de saúde
    <span class="selo s-ok"><i class="dot"></i>CNES/DATASUS · 2026</span></div>
    <div class="v"><span class="num">${R.saude.length}</span></div></div>
  ${Object.entries(R.saude.reduce((a,e)=>{a[e.rot]=(a[e.rot]||0)+1;return a;},{}))
    .sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,n])=>
    `<div class="row" style="padding:3px 0"><div class="k"
      style="padding-left:14px;color:var(--txt3)">${esc(k)}</div>
      <div class="v"><span class="num">${n}</span></div></div>`).join('')}

  ${R.soma._fcu.length?`<h3 class="sec">Comunidades no raio
    <span class="chip tag">${R.soma._fcu.length}</span></h3>
    <p style="font-size:11.5px;color:var(--txt2);line-height:1.6">${esc(R.soma._fcu.join(' · '))}</p>
    <div class="selo s-ok" style="margin-top:5px"><i class="dot"></i>Favelas e Comunidades Urbanas · IBGE · 2022</div>`:''}

  <h3 class="sec">Base do cálculo</h3>
  <p style="font-size:11px;color:var(--txt3);line-height:1.6">
    Soma de <b>${p._n} setores censitários</b> cujo ponto representativo cai dentro do raio,
    em ${esc(R.soma._munis.join(', '))}. É uma aproximação por setor inteiro: setores cortados
    pela borda entram por completo ou ficam de fora. As comparações são contra o município
    da loja e contra a região — os sete municípios —, ambos somados sobre os setores.</p>
  `:`<div class="note warn">Nenhum setor censitário dentro do raio.
    Esta loja está fora dos 7 municípios com base censitária carregada
    (${MUNIS_LISTA?esc(MUNIS_LISTA.nomes.join(', ')):''}).</div>`}`;
}

function renderCamadas(){
  const n=k=>PONTOS&&PONTOS[k]?PONTOS[k].length:0;
  $('#layers').innerHTML=`<span class="eyebrow">Camadas</span>
    <label class="lay"><input type="checkbox" id="lay-lojas" ${S.camadas.lojas?'checked':''}>
      <b style="color:#E88">Lojas Renner</b>
      <span class="selo s-ok"><i class="dot"></i>${n('lojas')}</span></label>
    <label class="lay"><input type="checkbox" id="lay-escolas" ${S.camadas.escolas?'checked':''}>
      Escolas<span class="selo s-ok"><i class="dot"></i>${nf.format(n('escolas'))}</span></label>
    <label class="lay"><input type="checkbox" id="lay-saude" ${S.camadas.saude?'checked':''}>
      Unidades de saúde<span class="selo s-ok"><i class="dot"></i>${n('saude')}</span></label>
    <label class="lay"><input type="checkbox" id="lay-fcu" ${S.camadas.fcu?'checked':''}>
      Favelas e comunidades<span class="selo s-ok"><i class="dot"></i>IBGE</span></label>
    <div style="height:1px;background:var(--line);margin:6px 0"></div>
    <label class="lay"><input type="checkbox" id="lay-base" ${S.camadas.base?'checked':''}>
      Mapa base<span class="selo s-mun"><i class="dot"></i>opcional</span></label>`;
  $('#lay-base').onchange=e=>{S.camadas.base=e.target.checked;baseOn(e.target.checked);};
  $('#lay-fcu').onchange=e=>{S.camadas.fcu=e.target.checked;fcuOn(e.target.checked);};
  ['lojas','escolas','saude'].forEach(k=>{
    $('#lay-'+k).onchange=e=>{S.camadas[k]=e.target.checked;pontosOn(k,e.target.checked);};
  });
}
/* contorno dos setores classificados como Favela ou Comunidade Urbana.
   Construída uma vez, depois só alternada — antes era refeita a cada desenho. */
function fcuOn(on){
  if(!on){ if(camadaFCU&&map.hasLayer(camadaFCU))map.removeLayer(camadaFCU); return; }
  garanteSetores();
  if(!S.geo.setor)return;
  if(!camadaFCU){
    const fs=S.geo.setor.features.filter(f=>f.properties._fcuNome);
    camadaFCU=L.geoJSON({type:'FeatureCollection',features:fs},{
      renderer:L.canvas({padding:.4,pane:'atlasSobre'}),
      style:{fillColor:'#C0559B',fillOpacity:.2,color:'#E081BE',weight:1,opacity:.85}
    });
    camadaFCU.bindTooltip(l=>{
      const p=(l.feature||l).properties||{};
      return `<b>${esc(p._fcuNome)}</b>
       <div class="kv"><span>Setor</span><span class="num">${esc(String(p.id).slice(-6))}</span></div>
       <div class="kv"><span>População</span><span class="num">${fmtN(p.pop,'int')}</span></div>
       <div class="kv"><span>Domicílios</span><span class="num">${fmtN(p.dpo,'int')}</span></div>`;
    },{className:'tt',sticky:true,direction:'top'});
  }
  if(!map.hasLayer(camadaFCU))camadaFCU.addTo(map);
}

/* ─────────────────────────────────────────────────────── 21. MODAIS ─── */
function renderLojas(){
  garanteSetores();
  const L=PONTOS&&PONTOS.lojas||[];
  $('#lojasBody').innerHTML=`
    <div class="note">Clique em uma loja para abrir o perfil socioeconômico do entorno.
      O raio é ajustável entre 0,5 e 5 km e agrega os setores censitários que caem dentro dele.</div>
    <table class="tb"><thead><tr><th style="width:52px">Nº</th><th>Unidade</th>
      <th>Formato</th><th>Município</th>
      <th style="text-align:right">Moradores em 1 km</th></tr></thead><tbody>
    ${L.map((p,i)=>{
      const e=entorno(p.x,p.y,1);
      return `<tr style="cursor:pointer" data-loja="${i}">
        <td class="n" style="color:var(--txt3)">${p.num}</td>
        <td><b>${esc(p.nome)}</b></td>
        <td style="color:var(--txt3)">${esc(FORMATO[p.tipo]||p.tipo)}</td>
        <td style="color:var(--txt3)">${esc(p.muni||'')}</td>
        <td class="n">${e.soma._n?fmtN(e.soma.pop,'int'):'<span style="color:var(--pend)">fora da base</span>'}</td>
      </tr>`;}).join('')}
    </tbody></table>
    <p style="font-size:11px;color:var(--txt3);margin-top:10px;line-height:1.6">
      Coordenadas obtidas via Google Places e conferidas contra o endereço de cada unidade.
      A base censitária cobre ${MUNIS_LISTA?esc(MUNIS_LISTA.nomes.join(', ')):''}.</p>`;
  $$('#lojasBody [data-loja]').forEach(tr=>tr.onclick=()=>{
    fechaModais(); abreEntorno(+tr.dataset.loja);});
}
function abreModal(id){
  if(id==='mdLojas')renderLojas();
  if(id==='mdAnalise')renderAnalise();
  if(id==='mdMetodo')renderMetodo();
  if(id==='mdMatriz')renderMatriz();
  if(id==='mdFontes')renderFontes();
  if(id==='mdDados')renderDados();
  $('#'+id).classList.add('show');
}
function fechaModais(){$$('.modal').forEach(m=>m.classList.remove('show'));}
function fecharSide(){$('#side').classList.remove('open');$('#backdrop').classList.remove('show');}

/* ──────────────────────────────────────────────────────── 22. BOOT ──── */
function decRing(str,prec){
  let i=0,x=0,y=0,b,r,sh; const out=[],n=str.length;
  while(i<n){
    r=0;sh=0; do{b=str.charCodeAt(i++)-63;r|=(b&31)<<sh;sh+=5}while(b>=32);
    x+=(r&1)?~(r>>1):(r>>1);
    r=0;sh=0; do{b=str.charCodeAt(i++)-63;r|=(b&31)<<sh;sh+=5}while(b>=32);
    y+=(r&1)?~(r>>1):(r>>1);
    out.push([x/prec,y/prec]);
  }
  return out;
}
function decGeom(mp,prec){
  const polys=mp.map(poly=>poly.map(r=>decRing(r,prec)));
  return polys.length===1?{type:'Polygon',coordinates:polys[0]}
                         :{type:'MultiPolygon',coordinates:polys};
}
/* coluna numérica: 0 = célula ausente/omitida pelo IBGE */
function decCol(str,escala,n){
  const out=new Array(n); let i=0,k=0,b,r,sh;
  while(k<n){
    r=0;sh=0; do{b=str.charCodeAt(i++)-63;r|=(b&31)<<sh;sh+=5}while(b>=32);
    const v=(r&1)?~(r>>1):(r>>1);
    out[k++]= v===0?null:(v-1)/escala;
  }
  return out;
}

/* razões e percentuais — calculados aqui, nunca armazenados */
const raz=(a,b)=>(a==null||b==null||!b)?null:Math.round(1000*a/b)/10;
const raz2=(a,b)=>(a==null||b==null||!b)?null:Math.round(100*a/b)/100;
function derivados(p){
  p.pop_2022=p.pop; p.dens_hab_km2=p.dens_hab; p.dens_dom_km2=p.dens_dom;
  /* sobre o município do próprio território — antes era sempre Porto Alegre */
  const popMun=POP_MUNI[p.muni]||(p.muni===MUN.nome?MUN.pop_2022:null);
  p.pop_pct_mun = (p.pop==null||!popMun)?null:Math.round(1e5*p.pop/popMun)/1000;
  const sx=(p.pop_h??0)+(p.pop_m??0);
  if(p.pop_h!=null&&p.pop_m!=null){
    p.pct_homens=raz(p.pop_h,sx); p.pct_mulheres=raz(p.pop_m,sx);
    p.razao_sexo=raz(p.pop_h,p.pop_m);
  }
  const idd=(p.criancas_0_14??null)!=null&&(p.idosos_60??null)!=null;
  p.pct_criancas_0_14=raz(p.criancas_0_14,p.pop);
  p.pct_jovens_15_29=raz(p.jovens_15_29,p.pop);
  p.pct_adultos_30_59=raz(p.adultos_30_59,p.pop);
  p.pct_idosos_60=raz(p.idosos_60,p.pop);
  if(idd)p.idx_envelhecimento=raz(p.idosos_60,p.criancas_0_14);
  const pea=(p.jovens_15_29??0)+(p.adultos_30_59??0);
  if(idd&&pea)p.razao_dependencia=raz((p.criancas_0_14||0)+(p.idosos_60||0),pea);
  const rc=['raca_branca','raca_preta','raca_amarela','raca_parda','raca_indigena']
    .reduce((a,k)=>a+(p[k]??0),0);
  if(rc){
    p.pct_branca=raz(p.raca_branca,rc); p.pct_preta=raz(p.raca_preta,rc);
    p.pct_amarela=raz(p.raca_amarela,rc); p.pct_parda=raz(p.raca_parda,rc);
    p.pct_indigena=raz(p.raca_indigena,rc); p.pct_preta_parda=raz(p.raca_preta_parda,rc);
    p._raca_total=rc;
  }
  p.taxa_alfabetizacao=raz(p.alfab_15,p.pop_15);
  if(p.taxa_alfabetizacao!=null)p.taxa_analfabetismo=Math.round(1000-10*p.taxa_alfabetizacao)/10;
  const d=p.dppo;
  p.pct_casa=raz((p.dom_casa??0)+(p.dom_vila??0),d);
  if(p.dom_precario==null&&(p.dom_cortico!=null||p.dom_degrad!=null))
    p.dom_precario=(p.dom_cortico??0)+(p.dom_degrad??0);
  p.pct_apto=raz(p.dom_apto,d);
  p.pct_cortico_degrad=raz(p.dom_precario!=null?p.dom_precario:(p.dom_cortico??0)+(p.dom_degrad??0),d);
  p.pct_sem_banheiro=raz((p.ban_nenhum??0)+(p.ban_comum??0),d);
  if(p.obitos==null&&(p.obitos_h!=null||p.obitos_m!=null))
    p.obitos=(p.obitos_h??0)+(p.obitos_m??0);
  p.pct_agua_rede=raz(p.agua_rede,d);
  p.pct_agua_naoenc=raz(p.agua_naoenc,d);
  p.pct_esgoto_rede=raz(p.esg_rede,d);
  /* só recompõe o que NÃO veio pronto dos dados: recalcular por cima de um
     valor armazenado, com componentes ausentes, produz número errado em
     silêncio — foi o que aconteceu com esgoto adequado. */
  if(p.esg_adequado==null&&(p.esg_rede!=null||p.esg_fossa_l!=null||p.esg_fossa_n!=null))
    p.esg_adequado=(p.esg_rede??0)+(p.esg_fossa_l??0)+(p.esg_fossa_n??0);
  p.pct_esgoto_adequado=raz(p.esg_adequado,d);
  p.pct_esgoto_inadequado=raz(p.esg_inadeq,d);
  p.pct_lixo_coletado=raz(p.lixo_coletado,d);
  if(p.lixo_inadequado==null&&(p.lixo_queim!=null||p.lixo_baldio!=null))
    p.lixo_inadequado=(p.lixo_queim??0)+(p.lixo_baldio??0);
  p.pct_lixo_inadequado=raz(p.lixo_inadequado,d);
  p.pct_fcu=raz(p.fcu_pop,p.pop);
  p.pct_quilombola=p.quilombolas==null?null:raz2(100*p.quilombolas,p.pop);
  p.obitos_por_mil=p.obitos==null?null:raz2(1000*p.obitos,p.pop);
  return p;
}

function decDic(str,dic,n){
  const out=new Array(n); let i=0,k=0,b,r,sh;
  while(k<n){
    r=0;sh=0; do{b=str.charCodeAt(i++)-63;r|=(b&31)<<sh;sh+=5}while(b>=32);
    const v=(r&1)?~(r>>1):(r>>1);
    out[k++]= dic ? (v>0?dic[v-1]:'') : v;
  }
  return out;
}
function decPts(str,prec,n){
  let i=0,x=0,y=0,b,r,sh; const out=new Array(n);
  for(let k=0;k<n;k++){
    r=0;sh=0; do{b=str.charCodeAt(i++)-63;r|=(b&31)<<sh;sh+=5}while(b>=32);
    x+=(r&1)?~(r>>1):(r>>1);
    r=0;sh=0; do{b=str.charCodeAt(i++)-63;r|=(b&31)<<sh;sh+=5}while(b>=32);
    y+=(r&1)?~(r>>1):(r>>1);
    out[k]=[x/prec,y/prec];
  }
  return out;
}

function montaGeo(){
  const N=window.ATLAS_NUCLEO, B=window.ATLAS_BAIRROS, T=window.ATLAS_SETORES;
  if(!N||!B||!T)throw new Error('arquivos de dados não carregados (dados-*.js)');
  ATLAS_DB={nucleo:N,bairros:B,setores:T,pontos:window.ATLAS_PONTOS||null};
  const P=N.prec, C=N.campos, E=N.escalas;
  MUNIS_LISTA=N.munis;

  /* população de cada município, antes dos bairros: derivados() precisa dela */
  POP_MUNI={};
  const MM=window.ATLAS_MUNICIPIOS, ip=C.indexOf('pop');
  if(MM&&ip>=0){
    const pops=decCol(MM.valores.pop,E[ip],MM.nomes.length);
    MM.nomes.forEach((n,i)=>{if(pops[i])POP_MUNI[n]=pops[i];});
  }

  /* --- bairros de Porto Alegre --- */
  const XE=window.ATLAS_EST||{campos:[],escalas:[],setores:{},bairros:{}};
  const CE=XE.campos||[], EE=XE.escalas||[];
  MUNICIPAL_2010=N.municipal_2010||{}; METODO_EST=XE.metodo||'';
  RAW_SETORES=T; RAW_NUCLEO=N; RAW_EST=XE;
  const nb=B.nomes.length, colB={};
  C.forEach((c,i)=>colB[c]=decCol(B.valores[c],E[i],nb));
  CE.forEach((c,i)=>{if(XE.bairros[c])colB[c]=decCol(XE.bairros[c],EE[i],nb);});
  const TODOS_B=C.concat(CE).filter(c=>colB[c]);   /* içado do laço */
  S.geo.bairro={type:'FeatureCollection',name:'bairros_poa',features:B.nomes.map((nome,i)=>{
    const p={id:B.ids[i],nome,
      muni:(B.muni&&B.muni[i])||'Porto Alegre',
      muni_id:(B.muni_id&&B.muni_id[i])||0};
    for(let k=0;k<TODOS_B.length;k++){const c=TODOS_B[k],v=colB[c][i]; if(v!=null)p[c]=v;}
    const a=B.amb[i];
    p.amb_pct_urbana=a[0];p.amb_pct_vegetacao=a[1];p.amb_lst_c=a[2];p.amb_ndvi=a[3];
    p._pir=B.piramide[i]; p._fcu=B.fcu_nomes[i]; p.fcu_n=B.fcu_nomes[i].length;
    p._omit={};
    for(const k in (B.omissoes||{})){const v=B.omissoes[k][i]; if(v)p._omit[k]=v;}
    return {type:'Feature',properties:derivados(p),geometry:decGeom(B.geom[i],P)};
  })};

  /* Setores são decodificados apenas quando o usuário abre o nível setor,
     uma FCU ou um entorno de loja. Isso corta o custo de CPU e memória da
     primeira tela sem remover nenhum dado do pacote. */

  /* --- municípios (dissolvidos a partir dos setores) --- */
  const M=window.ATLAS_MUNICIPIOS;
  if(M){
    const nm=M.nomes.length, colM={}, colME={};
    C.forEach((c,i)=>colM[c]=decCol(M.valores[c],E[i],nm));
    CE.forEach((c,i)=>{if(M.estimados&&M.estimados[c])colME[c]=decCol(M.estimados[c],EE[i],nm);});
    const PIB=(N.pib&&N.pib.municipios)||{};
    S.geo.municipio={type:'FeatureCollection',name:'municipios',features:M.nomes.map((nome,i)=>{
      const p={id:M.ids[i],nome,muni:nome,muni_id:M.muni_id[i]};
      C.forEach(c=>{const v=colM[c][i]; if(v!=null)p[c]=v;});
      CE.forEach(c=>{const v=colME[c]&&colME[c][i]; if(v!=null)p[c]=v;});
      const b=PIB[nome];
      if(b){
        p.pib=b.pib; p.vab=b.vab; p.vab_ind=b.vab_ind; p.vab_serv=b.vab_serv;
        p.vab_adm=b.vab_adm; p.vab_agro=b.vab_agro; p.impostos=b.impostos;
        p.pib_pc=Math.round(b.pib*1000/p.pop);
        p.pib_cresc=Math.round(1000*(b.pib/b.pib_ant-1))/10;
        p.pct_vab_ind=raz(b.vab_ind,b.vab); p.pct_vab_serv=raz(b.vab_serv,b.vab);
        p.pct_vab_adm=raz(b.vab_adm,b.vab); p.pct_vab_agro=raz(b.vab_agro,b.vab);
      }
      const codMun=String(N.munis.ids[M.muni_id[i]]);
      Object.assign(p,((window.ATLAS_SERVICOS||{}).municipios||{})[codMun]||{});
      Object.assign(p,((window.ATLAS_INDICES||{}).municipios||{})[codMun]||{});
      return {type:'Feature',properties:derivados(p),geometry:decGeom(M.geom[i],P)};
    })};
  }

  /* --- camadas de pontos --- */
  const PT=window.ATLAS_PONTOS;
  if(PT){
    PONTOS={};
    ['escolas','saude','lojas'].forEach(k=>{
      const d=PT[k]; if(!d)return;
      const n=d.nomes.length, xy=decPts(d.xy,P,n);
      PONTOS[k]=d.nomes.map((nome,i)=>({
        nome, x:xy[i][0], y:xy[i][1],
        muni: d.m? N.munis.nomes[d.m[i]] : null,
        tipo: d.tipo?d.tipo[i]:null,
        rot: d.legenda? (d.legenda[String(d.tipo[i])]||'—') : (d.tipo?d.tipo[i]:''),
        num: d.num?d.num[i]:null, end: d.end?d.end[i]:null
      }));
      PONTOS[k].meta={fonte:d.fonte,ano:d.ano,legenda:d.legenda||null};
    });
    agregaEquipamentosBairros();
  }
}

function garanteSetores(){
  if(S.geo.setor||!RAW_SETORES)return S.geo.setor;
  const T=RAW_SETORES,N=RAW_NUCLEO,XE=RAW_EST;
  const P=N.prec,C=N.campos,E=N.escalas,CE=XE.campos||[],EE=XE.escalas||[];
  const ns=T.geom.length,colS={};
  C.forEach((c,i)=>colS[c]=decCol(T.valores[c],E[i],ns));
  CE.forEach((c,i)=>{if(XE.setores[c])colS[c]=decCol(XE.setores[c],EE[i],ns);});
  const sufixo=decDic(T.ids,null,ns),muni=decDic(T.m,null,ns);
  const bairroS=decDic(T.bairro,T.bairro_dic,ns),fcuS=decDic(T.fcu,T.fcu_dic,ns);
  const cent=decPts(T.cent,P,ns);
  /* içados do laço: antes eram 4.722 arrays descartados e 4.722 slugId() */
  const TODOS=C.concat(CE).filter(c=>colS[c]);
  const PREF=N.munis.ids.map(x=>String(x));
  const slugCache=new Map();
  const slugDe=n=>{let v=slugCache.get(n);if(v===undefined){v=slugId(n);slugCache.set(n,v);}return v;};
  IDX_BUSCA=null;
  S.geo.setor={type:'FeatureCollection',name:'setores_rmpa',features:T.geom.map((g,i)=>{
    const mi=muni[i],cod=PREF[mi]+String(sufixo[i]).padStart(8,'0');
    const p={id:cod,nome:'Setor '+cod.slice(-6),muni:N.munis.nomes[mi],muni_id:mi};
    for(let k=0;k<TODOS.length;k++){const c=TODOS[k],v=colS[c][i];if(v!=null)p[c]=v;}
    if(bairroS[i]){p.bairro=bairroS[i];p.bairro_id=slugDe(bairroS[i]);}
    if(fcuS[i]){p._fcuNome=fcuS[i];p.fcu_n=1;}
    p._cx=cent[i][0];p._cy=cent[i][1];
    return {type:'Feature',properties:derivados(p),geometry:decGeom(g,P)};
  })};
  return S.geo.setor;
}

function pontoNoAnel(x,y,anel){
  let dentro=false;
  for(let i=0,j=anel.length-1;i<anel.length;j=i++){
    const a=anel[i],b=anel[j];
    if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))dentro=!dentro;
  }
  return dentro;
}
function pontoNaGeometria(x,y,g){
  const polys=g.type==='Polygon'?[g.coordinates]:g.coordinates;
  return polys.some(p=>pontoNoAnel(x,y,p[0])&&!p.slice(1).some(f=>pontoNoAnel(x,y,f)));
}
/* caixa envolvente do polígono, para descartar o ponto antes do teste caro */
function caixaDe(g){
  const polys=g.type==='Polygon'?[g.coordinates]:g.coordinates;
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(const poly of polys)for(const a of poly[0]){
    if(a[0]<x0)x0=a[0]; if(a[0]>x1)x1=a[0];
    if(a[1]<y0)y0=a[1]; if(a[1]>y1)y1=a[1];
  }
  return [x0,y0,x1,y1];
}
function agregaEquipamentosBairros(){
  if(!S.geo.bairro||!PONTOS)return;
  const esc=PONTOS.escolas||[],sau=PONTOS.saude||[];
  S.geo.bairro.features.forEach(f=>{
    const p=f.properties, cx=caixaDe(f.geometry);
    const dentro=q=>q.muni===p.muni&&q.x>=cx[0]&&q.x<=cx[2]&&q.y>=cx[1]&&q.y<=cx[3]
      &&pontoNaGeometria(q.x,q.y,f.geometry);
    const e=esc.filter(dentro);
    const s=sau.filter(dentro);
    p.inep_escolas=e.length;
    p.inep_escolas_publicas=e.filter(q=>+q.tipo!==4).length;
    p.inep_escolas_privadas=e.filter(q=>+q.tipo===4).length;
    p.cnes_estabelecimentos=s.length;
    p.cnes_ubs=s.filter(q=>[1,2].includes(+q.tipo)).length;
    p.cnes_hospitais=s.filter(q=>[5,7,62].includes(+q.tipo)).length;
    p.cnes_caps=s.filter(q=>+q.tipo===70).length;
  });
}

/* ══════════════════════ ANÁLISE DE ENTORNO (raio a partir de um ponto) ═══ */
const RAIOS=[0.5,1,2,3,5];
function distKm(x1,y1,x2,y2){
  const R=6371, r=Math.PI/180;
  const dx=(x2-x1)*r*Math.cos((y1+y2)/2*r), dy=(y2-y1)*r;
  return R*Math.sqrt(dx*dx+dy*dy);
}
/* agrega os setores cujo ponto representativo cai dentro do raio */
function entorno(x,y,raioKm){
  const fs=(S.geo.setor?S.geo.setor.features:[]).filter(f=>
    f.properties._cx!=null && distKm(x,y,f.properties._cx,f.properties._cy)<=raioKm);
  const soma={}, SOMAR=['pop','pop_h','pop_m','criancas_0_14','jovens_15_29','adultos_30_59',
    'idosos_60','pop_15','alfab_15','raca_branca','raca_preta','raca_parda','raca_amarela',
    'raca_indigena','raca_preta_parda','indigenas','quilombolas','dppo','dpo','dom_apto',
    'dom_casa','dom_precario','ban_nenhum','agua_rede','esg_rede','esg_adequado','esg_inadeq',
    'lixo_coletado','lixo_inadequado','obitos','fcu_pop','fcu_dom','area_km2'];
  /* antes: 33 reduces separados, ou seja 33 passagens sobre os mesmos setores */
  for(let k=0;k<SOMAR.length;k++)soma[SOMAR[k]]=0;
  let rn=0,rd=0;
  for(let j=0;j<fs.length;j++){
    const p=fs[j].properties;
    for(let k=0;k<SOMAR.length;k++){const c=SOMAR[k];soma[c]+=p[c]??0;}
    if(p.resp_renda!=null&&p.resp_n){rn+=p.resp_renda*p.resp_n;rd+=p.resp_n;}
  }
  soma.resp_renda=rd?Math.round(100*rn/rd)/100:null;
  soma.moradores_dom=soma.dpo?Math.round(100*soma.pop/soma.dpo)/100:null;
  soma.dens_hab=soma.area_km2?Math.round(10*soma.pop/soma.area_km2)/10:null;
  soma._n=fs.length;
  soma._munis=[...new Set(fs.map(f=>f.properties.muni))];
  soma._fcu=[...new Set(fs.map(f=>f.properties._fcuNome).filter(Boolean))];
  soma._pir=Array(22).fill(0);
  derivados(soma);
  const esc=(PONTOS&&PONTOS.escolas||[]).filter(p=>distKm(x,y,p.x,p.y)<=raioKm);
  const sau=(PONTOS&&PONTOS.saude||[]).filter(p=>distKm(x,y,p.x,p.y)<=raioKm);
  return {soma,setores:fs,escolas:esc,saude:sau};
}

/* --- dimensionamento do mapa: o contêiner pode existir antes do layout --- */
function enquadra(){
  if(!map||!camada||!camada.getBounds)return;
  const b=camada.getBounds();
  if(b&&b.isValid())map.fitBounds(b,{padding:[24,24]});
}
function ajustaMapa(refit){
  if(!map)return;
  map.invalidateSize({animate:false});
  if(refit)enquadra();
}
function vigiaTamanho(){
  const alvo=$('#mapwrap'); let w=0,h=0;
  const checa=()=>{
    const r=alvo.getBoundingClientRect();
    if(Math.abs(r.width-w)>1||Math.abs(r.height-h)>1){
      const primeiro=!w&&!h; w=r.width; h=r.height;
      ajustaMapa(primeiro||!S._fit);
    }
  };
  if(window.ResizeObserver)new ResizeObserver(checa).observe(alvo);
  window.addEventListener('resize',()=>ajustaMapa(false));
  [0,120,400,900].forEach(t=>setTimeout(checa,t));
}
function ligaEventos(){
  $$('#segNivel button').forEach(b=>b.onclick=()=>{
    const i=indAtual();
    if(!i.niveis.includes(b.dataset.nivel)){
      const alt=IND.find(x=>x.status!=='pend'&&x.niveis.includes(b.dataset.nivel));
      if(alt){S.indId=alt.id;S.ramp=null;$$('.ind').forEach(x=>x.classList.toggle('on',x.dataset.ind===alt.id));}
    }
    setNivel(b.dataset.nivel);
  });
  const sm=$('#selMuni');
  if(sm&&MUNIS_LISTA){
    sm.innerHTML='<option value="">Todos os municípios</option>'+
      MUNIS_LISTA.nomes.map((n,i)=>`<option value="${i}">${esc(n)}</option>`).join('');
    sm.onchange=e=>{S.muniFiltro=e.target.value===''?null:+e.target.value;
      S._fit=false; desenhaMapa(); renderPainel();};
  }
  const sl=$('#selLoja');
  if(sl&&PONTOS&&PONTOS.lojas){
    sl.innerHTML='<option value="">Entorno de uma loja…</option>'+PONTOS.lojas.map((p,i)=>
      `<option value="${i}">${esc(p.nome)} · ${esc(p.muni||'')}</option>`).join('');
    sl.onchange=e=>{if(e.target.value!==''){abreEntorno(+e.target.value);e.target.value='';}};
  }
  const bl=$('#btnLojas'); if(bl)bl.onclick=()=>{renderLojas();abreModal('mdLojas');};
  $('#btnAnalise').onclick=()=>abreModal('mdAnalise');
  $('#btnMetodo').onclick=()=>abreModal('mdMetodo');
  $('#btnMatriz').onclick=()=>abreModal('mdMatriz');
  $('#btnFontes').onclick=()=>abreModal('mdFontes');
  $('#btnDados').onclick=()=>abreModal('mdDados');
  $$('[data-close]').forEach(b=>b.onclick=fechaModais);
  $$('.modal').forEach(m=>m.onclick=e=>{if(e.target===m)fechaModais();});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){fechaModais();$('#sugg').style.display='none';fecharSide();}
  });
  let t; $('#q').oninput=e=>{clearTimeout(t);t=setTimeout(()=>buscar(e.target.value),140);};
  $('#q').onblur=()=>setTimeout(()=>$('#sugg').style.display='none',180);
  $('#btnSide').onclick=()=>{
    const s=$('#side'); s.classList.toggle('open');
    $('#backdrop').classList.toggle('show',s.classList.contains('open'));
  };
  $('#backdrop').onclick=()=>{fecharSide();$('#panel').classList.remove('open');};
}
(function boot(){
  try{ montaGeo(); }
  catch(err){ telaDeErro(err); return; }
  (function(){                    /* agregados do município derivados da própria base */
    /* A camada de bairros cobre os sete municípios; MUN descreve só Porto Alegre.
       Somar todos os bairros aqui gravava totais da região com rótulo de POA. */
    const f=S.geo.bairro.features.filter(x=>x.properties.muni===MUN.nome);
    let num=0,den=0,fcu=0,fcuN=new Set(),pop=0,rep=0,semP=0;
    f.forEach(x=>{const p=x.properties;
      pop+=p.pop||0; fcu+=p.fcu_pop||0; (p._fcu||[]).forEach(n=>fcuN.add(n));
      rep+=(p.pop_h||0)+(p.pop_m||0);
      if(p.resp_renda!=null&&p.resp_n){num+=p.resp_renda*p.resp_n;den+=p.resp_n;}});
    semP=49;
    MUN.m_resp_renda=den?Math.round(100*num/den)/100:null;
    MUN.fcu_pop=fcu; MUN.fcu_n=fcuN.size;
    MUN.pop_reportada=rep; MUN.setores_sem_pessoas=semP;
  })();
  iniciaMapa();
  verificaCatalogo();
  renderCats(); renderCamadas(); ligaEventos();
  desenhaMapa(); renderPainel(); vigiaTamanho();
  ['lojas','escolas','saude'].forEach(k=>{if(S.camadas[k])pontosOn(k,true);});
})();

/* Integridade do catálogo: um indicador que se declara carregado mas não tem
   nenhum valor é removido da interface. O Atlas não anuncia ficha vazia como
   disponibilidade; o roteiro de expansão continua documentado no código. */
function verificaCatalogo(){
  const removidos=[];
  IND.forEach(i=>{
    if(i.status!=='ok'&&i.status!=='est')return;
    const temDado=i.niveis.some(n=>{
      const g=S.geo[n];
      if(!g){
        if(n==='municipio')return true;
        if(n==='setor'&&RAW_SETORES){
          return Boolean((RAW_SETORES.valores||{})[i.id]||((RAW_EST||{}).setores||{})[i.id]);
        }
        return false;
      }
      return g.features.some(f=>f.properties[i.id]!=null);
    });
    if(!temDado){
      removidos.push(i.id);
    }
  });
  const fora=new Set(removidos);
  for(let k=IND.length-1;k>=0;k--)if(fora.has(IND[k].id))IND.splice(k,1);
  IND_IDX=null;
  if(removidos.length)console.info('Atlas — indicadores vazios omitidos:',removidos.join(', '));
  return removidos;
}

/* primeira execução: diz exatamente qual arquivo não chegou */
function telaDeErro(err){
  const esperado=[['dados/dados-nucleo.js','ATLAS_NUCLEO'],
    ['dados/dados-bairros.js','ATLAS_BAIRROS'],['dados/dados-municipios.js','ATLAS_MUNICIPIOS'],
    ['dados/dados-setores.js','ATLAS_SETORES'],
    ['dados/dados-estimados.js','ATLAS_EST'],['dados/dados-servicos.js','ATLAS_SERVICOS'],
    ['dados/dados-pontos.js','ATLAS_PONTOS']];
  const faltando=esperado.filter(([,v])=>!window[v]);
  document.body.innerHTML=`<div style="max-width:640px;margin:8vh auto;padding:26px;
      font-family:var(--sans);color:var(--txt)">
    <span class="eyebrow">Atlas POA</span>
    <h1 style="font-size:22px;margin:8px 0 14px;letter-spacing:-.02em">
      Os dados não foram carregados</h1>
    ${faltando.length?`<div class="note warn">
      Não encontrei ${faltando.length===1?'este arquivo':'estes arquivos'}:
      <ul style="margin:8px 0 0 18px;font-family:var(--mono);font-size:12px">
        ${faltando.map(([f])=>`<li>${f}</li>`).join('')}</ul></div>
    <p style="font-size:12.5px;line-height:1.7;color:var(--txt2)">
      Verifique se a pasta <b>dados/</b> está ao lado do <b>index.html</b>, com esta estrutura:</p>
    <pre style="background:var(--bg3);border:1px solid var(--line);border-radius:6px;padding:13px;
      font-family:var(--mono);font-size:11.5px;color:var(--txt2);line-height:1.7">atlas/
├── index.html
├── atlas.css
├── atlas.js
└── dados/
    ├── dados-nucleo.js
    ├── dados-bairros.js
    ├── dados-setores.js
    └── dados-pontos.js</pre>
    <p style="font-size:12px;color:var(--txt3);line-height:1.6;margin-top:12px">
      Duas causas comuns: a pasta <b>dados/</b> não está ao lado do index.html, ou o
      arquivo chegou cortado — <b>dados-setores.js</b> tem 687 KB e
      <b>dados-estimados.js</b> tem 169 KB.</p>`
    :`<div class="note warn">${esc(err&&err.message||err)}</div>`}
  </div>`;
}
