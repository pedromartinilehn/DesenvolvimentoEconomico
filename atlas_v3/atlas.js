/* ══════════════════════════════════════════════════════════════════════════
   ATLAS SOCIOECONÔMICO INTERATIVO DE PORTO ALEGRE
   Organização conceitual dos módulos (equivalente a dados/*.json + src/*.js):
     FONTES        catálogo de fontes oficiais
     INDICADORES   catálogo de indicadores (id, unidade, fonte, ano, nível, status)
     DADOS         valores por território  ── censo2022.json, rais.json, ...
     GEO           malhas geográficas      ── bairros.geojson, setores.geojson
     MAPA / UI / INGESTAO
   ══════════════════════════════════════════════════════════════════════════ */

/* O texto deste arquivo como chegou, antes de o Atlas mexer na página. A central de
   extração (seção 27) parte dele para gerar o Atlas com os dados extraídos dentro. */
const HTML_ORIGINAL=(()=>{try{return document.documentElement.outerHTML;}catch(e){return null;}})();

/* ─────────────────────────────────── 0. DADOS QUE JÁ VIERAM DAS FONTES ─── */
/* O Atlas busca parte dos dados direto nas fontes, pelo próprio navegador
   (seção 26), sem script nem arquivo intermediário. O que já foi baixado e
   validado fica guardado neste navegador e entra aqui, antes de tudo, por cima
   dos arquivos dados/*.js. Sem nada guardado, valem os arquivos embarcados. */
const AO_VIVO_CHAVE='atlas_rmpa_ao_vivo_v1';
function aoVivoLe(){
  try{const x=JSON.parse(localStorage.getItem(AO_VIVO_CHAVE)||'{}');return x&&typeof x==='object'?x:{};}
  catch(e){return {};}
}
function aoVivoGrava(c){try{localStorage.setItem(AO_VIVO_CHAVE,JSON.stringify(c));return true;}catch(e){return false;}}
/* põe o resultado validado de uma fonte nos objetos que o resto do Atlas lê */
function aoVivoMescla(id,r){
  if(!r||!r.dados)return;
  const W=window, d=r.dados, m=r.meta||{};
  const obj=(nome,base)=>W[nome]||(W[nome]=base);
  const em=(o,k)=>o[k]||(o[k]={});
  const porMun=(alvo,dados)=>{for(const c in dados)Object.assign(em(alvo,c),dados[c]);};
  if(d.indices){const I=obj('ATLAS_INDICES',{municipios:{},fontes:{}});
    porMun(em(I,'municipios'),d.indices); em(I,'fontes').idhm=m.indices; I.versao=r.quando;}
  if(d.complementos||d.risco){const X=obj('ATLAS_COMPLEMENTOS',{municipios:{},fontes:{},risco:[],prec:1e5});
    if(d.complementos)porMun(em(X,'municipios'),d.complementos);
    if(d.risco)X.risco=d.risco;
    em(X,'fontes')[id]=m;}
  if(d.servicos){const V=obj('ATLAS_SERVICOS',{municipios:{},fontes:{}});
    porMun(em(V,'municipios'),d.servicos); if(m.chave)em(V,'fontes')[m.chave]=m;}
  if(d.pib){const N=W.ATLAS_NUCLEO; if(N){const P=em(N,'pib');
    porMun(em(P,'municipios'),d.pib);
    Object.assign(P,{ano_pib:m.ano,ano_vab:m.ano,ano_pib_ant:m.ano_base,fonte:m.fonte,via:m.via});}}
}
(function(){const c=aoVivoLe(); for(const id in c)if(c[id]&&c[id].ok!==false)aoVivoMescla(id,c[id]);})();

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
  IDEB:{n:'INEP — IDEB',s:'IDEB/INEP',u:'https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/ideb',
    d:'Valores por município lidos do espelho público da Base dos Dados (br_inep_ideb.municipio).'},
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
    u:'https://www.atlasbrasil.org.br/perfil/municipio/431490',d:'IDHM calculado sobre Censos Demográficos de 1991, 2000 e 2010. O IDHM dos sete municípios e os indicadores de vulnerabilidade de 2010 foram lidos do espelho público da Base dos Dados (tabela mundo_onu_adh.municipio), que republica o Atlas Brasil sem alterar os valores.'},
  IPEA_AOP:{n:'IPEA — Projeto Acesso a Oportunidades (2019)',s:'IPEA',
    u:'https://www.ipea.gov.br/acessooportunidades/',
    d:'Tempo de viagem e oportunidades alcançáveis a pé, de bicicleta e de transporte público, calculados pelo IPEA por hexágono para as maiores cidades do país, com dados de 2019. Lido do espelho público da Base dos Dados (br_ipea_acesso_oportunidades.indicadores_2019). Na tabela da Base dos Dados o tempo mínimo vem multiplicado por 100; o Atlas divide por 100 depois de conferir a coerência com os indicadores cumulativos (ver Metodologia).'},
  ANATEL:{n:'Anatel — Acessos de banda larga fixa',s:'Anatel',
    u:'https://storage.googleapis.com/basedosdados-public/one-click-download/br_anatel_banda_larga_fixa/densidade_municipio/densidade_municipio.csv.gz',
    d:'Densidade de banda larga fixa calculada pela Anatel: acessos por 100 habitantes. Lida do espelho público da Base dos Dados (br_anatel_banda_larga_fixa.densidade_municipio).'},
  BATER:{n:'IBGE e CEMADEN — População em áreas de risco no Brasil (BATER)',s:'IBGE/CEMADEN',
    u:'https://www.ibge.gov.br/geociencias/informacoes-ambientais/estudos-ambientais/21538-populacao-em-areas-de-risco-no-brasil.html',
    d:'Áreas de risco de movimento de massa, inundação e enxurrada monitoradas pelo CEMADEN, ajustadas pelo IBGE à malha do Censo 2010 (setores ou faces de quadra). Só existem para os municípios monitorados pelo CEMADEN. Geometria do geobr (IPEA), lida do espelho público da Base dos Dados.'},
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
    d:'Indicador que não aparece pronto em nenhuma publicação: o Atlas o calcula a partir de contagens oficiais (Censo 2022 por setor, PIB do IBGE, CNES), pela fórmula descrita na Metodologia. O ano é o dos dados de origem, não o do cálculo. No bairro e no município, as contagens são somadas antes de calcular a taxa; nunca é média de percentuais.'}
};

/* ─────────────────────────────────────────────── 2. NÍVEIS GEOGRÁFICOS ─ */
const NIVEIS = {
  municipio:{n:'Municípios',ab:'MUN',plural:'municípios'},
  regiao:{n:'Regiões',ab:'REG',plural:'regiões'},
  bairro:{n:'Bairros',ab:'BAIRRO',plural:'bairros'},
  setor:{n:'Setores censitários',ab:'SETOR',plural:'setores censitários'}
};

/* ────────────────────────────────────────────── 3. RAMPAS CROMÁTICAS ─── */
/* Um matiz por rampa, luminosidade crescente (OKLCH) e a cor mais clara com
   contraste ≥ 2:1 sobre o fundo do mapa: nenhuma classe some no fundo.
   Validadas com o validate_palette da skill de visualização (--ordinal). */
const RAMPAS = {
  agua:['#73ace7','#5398dd','#3284d0','#1271be','#025ea4','#004d87','#003c6b'],
  terra:['#7fb880','#62a765','#46954c','#2e8237','#1b6f26','#115b1c','#0c4715'],
  brasa:['#e09074','#d47756','#c55f3a','#b14a22','#9a380f','#802c06','#652104']
};
const RAMPA_NOMES={agua:'Azul',terra:'Verde',brasa:'Laranja'};
/* cores de interface fixas do mapa (as mesmas variáveis do atlas.css) */
const COR={tinta:'#15212E',terracota:'#C2502A',papel:'#FBFAF7',semdado:'#DAD6CC',contorno:'#B9B4A8',
  cat:['#2a78d6','#eb6834','#1baf7a','#eda100','#e87ba4']};

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
  {id:'ambiente',n:'Ambiente Urbano'},{id:'mobilidade',n:'Mobilidade e acesso'}
];

const IND=[];
let IND_IDX=null;                       /* indice id -> indicador, ver getInd */
const IND_FORA=new Map();               /* tirados por falta de dado: id -> {i, pos} */
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
ind({id:'area_km2',cat:'visao',n:'Área do polígono',u:'km²',fonte:'SMURB',ano:2016,niveis:['bairro','setor'],status:'ok',fmt:'dec2',ramp:'terra',obs:'Nos outros seis municípios, a área do bairro é a soma dos setores do IBGE que o formam. Porto Alegre — bairros: malha SMUrb (Lei 12.112/2016), 94 bairros, 472,81 km² no total. Setores: área do IBGE, 495,39 km². A área municipal do IBGE é 496,83 km² — a malha de bairros não recobre toda a lâmina d’água. Medidas de produtores distintos, nunca somadas entre si.'});
ind({id:'pop_pct_mun',cat:'visao',n:'Participação na população do município',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro'],status:'ok',fmt:'pct2',ramp:'agua'});
ind({id:'pop_h',cat:'demografia',n:'População masculina',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'pop_m',cat:'demografia',n:'População feminina',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'pct_homens',cat:'demografia',n:'Percentual de homens',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'agua'});
ind({id:'pct_mulheres',cat:'demografia',n:'Percentual de mulheres',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'brasa'});
ind({id:'razao_sexo',cat:'demografia',n:'Razão de sexo',u:'homens por 100 mulheres',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'dec1',ramp:'terra'});
ind({id:'moradores_dom',cat:'demografia',n:'Média de moradores por domicílio',u:'pessoas/dom.',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'dec2',ramp:'brasa',
  obs:'No setor, é a média publicada pelo IBGE: moradores de domicílios particulares permanentes ÷ esses domicílios (uma casa decimal). No bairro, no município e no entorno das lojas, é a população ÷ domicílios ocupados, que inclui quem vive em domicílio coletivo; a diferença fica em até 0,03 morador, maior onde há presídio ou abrigo.'});
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
ind({id:'dom_part',cat:'habitacao',n:'Domicílios particulares',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua',obs:'Domicílios particulares ocupados, vagos e de uso ocasional (variável V0003).'});
ind({id:'dom_colet',cat:'habitacao',n:'Domicílios coletivos',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua',obs:'Domicílios coletivos com e sem morador, como asilos, hotéis, alojamentos e presídios (variável V0004).'});
ind({id:'dpo',cat:'habitacao',n:'Domicílios particulares ocupados',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'dppo',cat:'habitacao',n:'Domicílios particulares permanentes ocupados',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'dens_dom',cat:'habitacao',n:'Densidade domiciliar',u:'dom./km²',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'dec1',ramp:'agua',obs:'Domicílios particulares (ocupados, vagos e de uso ocasional) divididos pela área do polígono do território.'});
ind({id:'dom_casa',cat:'habitacao',n:'Domicílios do tipo casa',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'dom_vila',cat:'habitacao',n:'Domicílios em casa de vila ou condomínio',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua',obs:'Domicílios particulares permanentes ocupados do tipo casa de vila ou em condomínio.'});
ind({id:'dom_apto',cat:'habitacao',n:'Domicílios do tipo apartamento',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'dom_cortico',cat:'habitacao',n:'Domicílios em casa de cômodos ou cortiço',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'dom_degrad',cat:'habitacao',n:'Estruturas residenciais degradadas ou inacabadas',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'pct_casa',cat:'habitacao',n:'Percentual de casas',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'terra',obs:'Casas e casas de vila ou em condomínio, sobre os domicílios particulares permanentes ocupados. Até a versão 3.7 a casa de vila ficava de fora, porque não estava no pacote: o percentual saía menor.'});
ind({id:'pct_apto',cat:'habitacao',n:'Percentual de apartamentos',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'agua'});
ind({id:'pct_cortico_degrad',cat:'habitacao',n:'Percentual em cortiço ou estrutura degradada',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct2',ramp:'brasa'});
ind({id:'ban_nenhum',cat:'habitacao',n:'Domicílios sem banheiro nem sanitário',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa'});
ind({id:'ban_comum',cat:'habitacao',n:'Domicílios apenas com banheiro de uso comum',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa',obs:'Domicílios particulares permanentes ocupados que só têm banheiro de uso comum a mais de um domicílio.'});
ind({id:'ban_sanitario',cat:'habitacao',n:'Domicílios apenas com sanitário ou buraco para dejeções',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa',obs:'Domicílios particulares permanentes ocupados sem banheiro, só com sanitário ou buraco para dejeções, inclusive no terreno.'});
ind({id:'pct_sem_banheiro',cat:'habitacao',n:'Percentual sem banheiro de uso exclusivo',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct2',ramp:'brasa',obs:'Domicílios só com banheiro de uso comum, só com sanitário ou buraco, ou sem banheiro nem sanitário, sobre os domicílios particulares permanentes ocupados. Até a versão 3.7 a conta usava só os sem banheiro nem sanitário, porque os outros dois grupos não estavam no pacote: o percentual saía menor.'});
ind({id:'agua_rede',cat:'saneamento',n:'Domicílios com água de rede geral',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'pct_agua_rede',cat:'saneamento',n:'Abastecimento de água por rede geral',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'agua'});
ind({id:'agua_naoenc',cat:'saneamento',n:'Domicílios sem água encanada',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa',obs:'Domicílios particulares permanentes ocupados em que a água não chega encanada. Não inclui aqueles em que a água chega encanada só até o terreno.'});
ind({id:'pct_agua_naoenc',cat:'saneamento',n:'Percentual sem água encanada',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct2',ramp:'brasa'});
ind({id:'esg_rede',cat:'saneamento',n:'Domicílios com esgoto em rede geral ou pluvial',u:'domicílios',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua'});
ind({id:'pct_esgoto_rede',cat:'saneamento',n:'Esgoto em rede geral ou pluvial',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'agua'});
ind({id:'esg_adequado',cat:'saneamento',n:'Domicílios com esgotamento adequado',u:'domicílios',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua',obs:'Rede geral ou pluvial + fossa séptica ou filtro, ligada ou não à rede.'});
ind({id:'pct_esgoto_adequado',cat:'saneamento',n:'Esgotamento sanitário adequado',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'agua',obs:'Adequado e inadequado somam cerca de 99% dos domicílios: perto de 1% (9.118 nos sete municípios) não está em nenhuma das duas categorias publicadas, por sigilo do IBGE ou por categoria não classificada. Não são os domicílios sem banheiro, que são 68.'});
ind({id:'esg_inadeq',cat:'saneamento',n:'Domicílios com esgotamento inadequado',u:'domicílios',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa',obs:'Fossa rudimentar ou buraco + vala + outra forma + destinação inexistente.'});
ind({id:'pct_esgoto_inadequado',cat:'saneamento',n:'Esgotamento sanitário inadequado',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'brasa',obs:'Adequado e inadequado somam cerca de 99% dos domicílios: perto de 1% (9.118 nos sete municípios) não está em nenhuma das duas categorias publicadas, por sigilo do IBGE ou por categoria não classificada. Não são os domicílios sem banheiro, que são 68.'});
ind({id:'lixo_coletado',cat:'saneamento',n:'Domicílios com coleta de lixo',u:'domicílios',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua',obs:'Coletado no domicílio por serviço de limpeza + depositado em caçamba do serviço.'});
ind({id:'pct_lixo_coletado',cat:'saneamento',n:'Coleta de lixo por serviço de limpeza',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'agua'});
ind({id:'lixo_inadequado',cat:'saneamento',n:'Domicílios com destino inadequado do lixo',u:'domicílios',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa',obs:'Lixo queimado na propriedade + jogado em terreno baldio, encosta ou área pública.'});
ind({id:'pct_lixo_inadequado',cat:'saneamento',n:'Destino inadequado do lixo',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct2',ramp:'brasa'});
ind({id:'obitos',cat:'saude',n:'Óbitos de moradores (jan/2019 a jul/2022)',u:'óbitos',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa',obs:'Óbitos declarados de pessoas que moravam no domicílio, no período de janeiro de 2019 a julho de 2022. Cobre 43 meses e não é uma taxa anual.'});
ind({id:'obitos_h',cat:'saude',n:'Óbitos de homens (jan/2019 a jul/2022)',u:'óbitos',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa',obs:'Óbitos declarados de homens que moravam no domicílio, de janeiro de 2019 a julho de 2022 (43 meses). O IBGE omite o valor nos setores com poucos casos: aí a soma do bairro é parcial.'});
ind({id:'obitos_m',cat:'saude',n:'Óbitos de mulheres (jan/2019 a jul/2022)',u:'óbitos',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa',obs:'Óbitos declarados de mulheres que moravam no domicílio, de janeiro de 2019 a julho de 2022 (43 meses). O IBGE omite o valor nos setores com poucos casos: aí a soma do bairro é parcial.'});
ind({id:'obitos_por_mil',cat:'saude',n:'Óbitos por mil habitantes (jan/2019 a jul/2022)',u:'por mil hab.',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'dec2',ramp:'brasa',obs:'Acumulado de 43 meses sobre a população de 2022. Não comparável a taxas anuais de mortalidade.'});
ind({id:'fcu_pop',cat:'vulner',n:'População em favelas e comunidades urbanas',u:'pessoas',fonte:'FAVELAS',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa',obs:'Recorte oficial Favelas e Comunidades Urbanas do Censo 2022. Em Porto Alegre são 125 FCU, com 175.519 moradores (13,2% da cidade).'});
ind({id:'fcu_dom',cat:'vulner',n:'Domicílios em favelas e comunidades urbanas',u:'domicílios',fonte:'FAVELAS',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa'});
ind({id:'pct_fcu',cat:'vulner',n:'Percentual da população em favelas e comunidades urbanas',u:'%',fonte:'ATLAS_CALC',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp:'brasa'});
ind({id:'fcu_n',cat:'vulner',n:'Favelas e comunidades urbanas no território',u:'unidades',fonte:'FAVELAS',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'brasa'});
/* Entorno dos domicílios (Censo 2022): o IBGE percorreu as faces de quadra dos setores
   urbanos e registrou o que há na rua de cada domicílio. Os percentuais são sobre os
   moradores com entorno pesquisado; "não declarado" fica no total. */
/* campos de dados/dados-censo2022.js (extracao/9_censo2022_setores.py): por setor, bairro e município */
const C22=window.ATLAS_CENSO22&&Array.isArray(window.ATLAS_CENSO22.campos)?window.ATLAS_CENSO22:null;
const ENT_CAMPOS=['ent_pav','ent_ilum','ent_calcada','ent_rampa','ent_arvore','ent_bueiro','ent_obstaculo','ent_onibus','ent_bici'];
/* soma parcial: o percentual herda o aviso do componente que o IBGE omitiu em algum setor */
const OMIT_DERIVADO={pct_agua_naoenc:['agua_naoenc'],pct_sem_banheiro:['ban_nenhum','ban_comum','ban_sanitario'],pct_casa:['dom_vila']};
function omissoesC22(p,origem,i){
  if(!C22||!origem)return;
  p._omit=p._omit||{};
  for(const k in origem){const v=origem[k][i]; if(v)p._omit[k]=v;}
  for(const k in OMIT_DERIVADO){const v=Math.max(0,...OMIT_DERIVADO[k].map(c=>p._omit[c]||0)); if(v)p._omit[k]=v;}
}
const OBS_ENT='Moradores de domicílios particulares permanentes ocupados em face de quadra com a característica, sobre os moradores com entorno pesquisado. O entorno só foi pesquisado nos setores urbanos; "não declarado" conta no total, então o percentual é um piso.';
ind({id:'ent_mor',cat:'ambiente',n:'Moradores com entorno pesquisado',u:'pessoas',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'int',ramp:'agua',obs:'Moradores de domicílios particulares permanentes ocupados nos setores em que o IBGE pesquisou o entorno (variável V05200). É a base dos percentuais do entorno.'});
[['pct_ent_pav','ambiente','Moradores em rua pavimentada','agua'],['pct_ent_ilum','ambiente','Moradores em rua com iluminação pública','agua'],
 ['pct_ent_calcada','ambiente','Moradores em rua com calçada','agua'],['pct_ent_rampa','ambiente','Moradores em rua com rampa para cadeirante','agua'],
 ['pct_ent_arvore','ambiente','Moradores em rua com árvores','agua'],['pct_ent_bueiro','ambiente','Moradores em rua com bueiro','agua'],
 ['pct_ent_obstaculo','ambiente','Moradores em rua com obstáculo na calçada','brasa'],
 ['pct_ent_onibus','mobilidade','Moradores em rua com ponto de ônibus','agua'],['pct_ent_bici','mobilidade','Moradores em rua com via sinalizada para bicicleta','agua']]
  .forEach(([id,cat,n,ramp])=>ind({id,cat,n,u:'%',fonte:'CENSO22',ano:2022,niveis:['bairro','setor'],status:'ok',fmt:'pct1',ramp,obs:OBS_ENT}));

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
ind({id:'m_dens',cat:'visao',n:'Densidade demográfica do município',u:'hab/km²',fonte:'IBGE_CID',
  ano:2022,niveis:['municipio'],status:'mun',fmt:'dec2'});
ind({id:'m_escol',cat:'educacao',n:'Taxa de escolarização de 6 a 14 anos',u:'%',fonte:'IBGE_CID',
  ano:2022,niveis:['municipio'],status:'mun',fmt:'pct2'});
ind({id:'m_mortinf',cat:'saude',n:'Mortalidade infantil',u:'por mil nascidos vivos',fonte:'IBGE_CID',
  ano:2025,niveis:['municipio'],status:'mun',fmt:'dec2'});
ind({id:'m_receita',cat:'financas',n:'Receitas brutas realizadas (IBGE Cidades)',u:'R$',fonte:'IBGE_CID',ano:2025,
  niveis:['municipio'],status:'mun',fmt:'brl'});
ind({id:'m_despesa',cat:'financas',n:'Despesas brutas empenhadas (IBGE Cidades)',u:'R$',fonte:'IBGE_CID',ano:2025,
  niveis:['municipio'],status:'mun',fmt:'brl'});
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

/* ---- 4.3.2 COMPLEMENTOS MUNICIPAIS ------------------------------------
   Vêm de dados/dados-complementares.js, gerado por extracao/5_base_dos_dados.py
   a partir do espelho público da Base dos Dados. Valores oficiais, sem
   estimativa: o que a fonte não traz, verificaCatalogo() tira da interface. */
const COMP_F=((window.ATLAS_COMPLEMENTOS||{}).fontes)||{};
const ADH10='Censo 2010, valor oficial do Atlas Brasil para o município. ';
const ADH_OFICIAL='Número publicado pelo Atlas do Desenvolvimento Humano no Brasil (PNUD, IPEA, FJP) para o município, Censo 2010. '
  +'Serve de referência para os valores de 2010 calculados pelo Atlas, que ficam acima na pobreza e no Gini.';
munInd('adh_renda_pc','renda','Renda per capita (Atlas Brasil)','R$/mês (ago/2010)','ATLAS',2010,'brl','terra',ADH_OFICIAL);
munInd('adh_gini','renda','Índice de Gini (Atlas Brasil)','índice','ATLAS',2010,'dec2','brasa',
  ADH_OFICIAL+' Publicado com duas casas decimais.');
munInd('adh_pobreza','pobreza','Pessoas pobres, renda per capita até R$ 140 (Atlas Brasil)','%','ATLAS',2010,'pct2','brasa',ADH_OFICIAL);
munInd('adh_extrema_pobreza','pobreza','Pessoas extremamente pobres, renda per capita até R$ 70 (Atlas Brasil)','%','ATLAS',2010,'pct2','brasa',ADH_OFICIAL);
munInd('adh_vulner_pobreza','pobreza','Pessoas vulneráveis à pobreza','%','ATLAS',2010,'pct1','brasa',
  ADH10+'Renda domiciliar per capita de até R$ 255 (meio salário mínimo de agosto de 2010). Inclui os pobres e os extremamente pobres.');
munInd('adh_nemnem_vulner','vulner','Jovens de 15 a 24 anos que não estudam, não trabalham e são vulneráveis à pobreza','%','ATLAS',2010,'pct1','brasa',
  ADH10+'Percentual sobre todos os jovens de 15 a 24 anos. Só conta quem também é vulnerável à pobreza: não é o total de jovens que não estudam nem trabalham.');
munInd('adh_maes_chefes_sem_fund','vulner','Mães chefes de família sem fundamental completo e com filho menor de 15 anos','% das mães chefes de família','ATLAS',2010,'pct1','brasa',
  ADH10+'Percentual sobre o total de mães chefes de família.');
munInd('adh_dep_idosos_vulner','vulner','Pessoas em domicílios vulneráveis à pobreza e dependentes de idosos','%','ATLAS',2010,'pct2','brasa',ADH10);
munInd('adh_desloc_1h_vulner','vulner','Pessoas vulneráveis à pobreza que levam mais de uma hora até o trabalho','%','ATLAS',2010,'pct2','brasa',
  ADH10+'Percentual sobre as pessoas ocupadas que voltam do trabalho todos os dias.');
munInd('adh_desocup_18_24','trabalho','Taxa de desocupação de 18 a 24 anos','%','ATLAS',2010,'pct1','brasa',ADH10);
munInd('adh_creche_0_3','educacao','Crianças de 0 a 3 anos que frequentam creche ou escola','%','ATLAS',2010,'pct1','agua',ADH10);
munInd('adh_fora_escola_4_5','educacao','Crianças de 4 e 5 anos fora da escola','%','ATLAS',2010,'pct1','brasa',
  ADH10+'A pré-escola passou a ser obrigatória a partir de 2016: o valor de 2010 não descreve a situação atual.');
munInd('adh_maes_15_17','saude','Mulheres de 15 a 17 anos que tiveram filhos','%','ATLAS',2010,'pct1','brasa',ADH10);

const OBS_IDEB='Rede pública: escolas municipais, estaduais e federais. Escala de 0 a 10; combina a aprovação escolar com a nota do SAEB.';
munInd('ideb_iniciais','educacao','IDEB dos anos iniciais do fundamental, rede pública','índice','IDEB',(COMP_F.ideb||{}).ano||null,'dec1','agua',OBS_IDEB);
munInd('ideb_finais','educacao','IDEB dos anos finais do fundamental, rede pública','índice','IDEB',(COMP_F.ideb||{}).ano||null,'dec1','agua',OBS_IDEB);
munInd('ideb_medio','educacao','IDEB do ensino médio, rede pública','índice','IDEB',(COMP_F.ideb||{}).ano||null,'dec1','agua',OBS_IDEB);

munInd('banda_larga_100hab','ambiente','Acessos de banda larga fixa por 100 habitantes','acessos por 100 hab.','ANATEL',(COMP_F.anatel||{}).ano||null,'dec1','agua',
  `Densidade calculada pela Anatel com a sua própria base populacional${COMP_F.anatel?`, referente a ${String(COMP_F.anatel.mes).padStart(2,'0')}/${COMP_F.anatel.ano}`:''}. A Anatel também divulga a densidade por 100 domicílios, que dá valores maiores: as duas medidas não se comparam. Mede contratos de internet fixa, não o acesso pelo celular.`);

/* ---- 4.3.3 DADOS DO IPEA ----------------------------------------------
   Vêm de dados/dados-ipea.js, gerado por extracao/6_ipea.py a partir do
   espelho público da Base dos Dados. Duas bases: o Atlas do Desenvolvimento
   Humano (PNUD, IPEA e FJP), com os Censos de 1991, 2000 e 2010, e o projeto
   Acesso a Oportunidades (IPEA), de 2019, que entre as sete cidades só cobre
   Porto Alegre. Sem o arquivo, verificaCatalogo() tira estes indicadores. */
const IPEA=window.ATLAS_IPEA||{}, ADH_IPEA=IPEA.adh||null, AOP=IPEA.aop||null;
/* IDHM de 2000 nos sete municípios: a série 1991–2010 do Atlas Brasil traz, para Porto Alegre, o
   mesmo número do IBGE Cidades (MUN.m_idhm00). Se bater, o indicador deixa de ser só de Porto
   Alegre. Calculado na primeira chamada, depois que MUN existe. */
let IDHM00_CACHE;
function idhm2000(){
  if(IDHM00_CACHE!==undefined)return IDHM00_CACHE;
  IDHM00_CACHE=null;
  const j=ADH_IPEA&&ADH_IPEA.valores.idhm?ADH_IPEA.anos.indexOf(2000):-1;
  if(j<0)return null;
  const v={}; for(const c in ADH_IPEA.valores.idhm){const x=ADH_IPEA.valores.idhm[c][j]; if(x!=null)v[c]=x;}
  if(Object.keys(v).length===7&&Math.abs((v[MUN.cod]??-1)-MUN.m_idhm00)<0.0005){
    IDHM00_CACHE=v; const i=getInd('m_idhm00');
    if(i){i.status='ok'; i.obs='IDHM do Censo 2000, do Atlas do Desenvolvimento Humano (PNUD, IPEA e FJP). O valor de Porto Alegre é o mesmo do IBGE Cidades; os dos outros seis municípios vêm da mesma série do Atlas Brasil, que o Atlas já tinha.';}
  }
  return IDHM00_CACHE;
}
/* id no Atlas -> coluna do Atlas Brasil (mundo_onu_adh.municipio) */
const ADH_NOVOS={
  adh_expectativa_estudo:'expectativa_anos_estudo', adh_fora_escola_6_14:'taxa_criancas_fora_escola_6_14',
  adh_atraso_fund:'taxa_atraso_2_fundamental', adh_fund_18_mais:'taxa_fundamental_18_mais',
  adh_medio_18_20:'taxa_medio_18_20', adh_mort_infantil:'mortalidade_1', adh_mort_5:'mortalidade_5',
  adh_theil:'indice_theil', adh_razao_10_40:'razao_10_ricos_40_pobres', adh_renda_20_pobres:'prop_renda_20_pobres',
  adh_pobreza_criancas:'prop_pobreza_criancas', adh_extrema_criancas:'prop_pobreza_extrema_criancas',
  adh_formalizacao:'prop_ocupados_formalizacao', adh_desocup_18_mais:'taxa_desocupacao_18_mais',
  adh_densidade_2:'taxa_densidade_2_mais', adh_agua_esgoto_inadeq:'taxa_agua_esgoto_inadequados',
  adh_sem_fund_informal:'taxa_sem_fund_informal', adh_criancas_dom_sem_fund:'taxa_criancas_dom_sem_fund',
  adh_maes_10_14:'taxa_mulheres_com_filho_10_14'
};
const ADHC=c=>`Atlas do Desenvolvimento Humano no Brasil (PNUD, IPEA e FJP), Censo 2010; coluna ${c} da Base dos Dados. A série 1991-2010 está no painel do município. `;
munInd('adh_expectativa_estudo','educacao','Expectativa de anos de estudo','anos','ATLAS',2010,'dec2','agua',
  ADHC('expectativa_anos_estudo')+'Anos de estudo que uma geração de crianças que entra na escola deve completar até os 18 anos, se os padrões de 2010 se mantiverem.');
munInd('adh_fora_escola_6_14','educacao','Crianças de 6 a 14 anos fora da escola','%','ATLAS',2010,'pct2','brasa',ADHC('taxa_criancas_fora_escola_6_14'));
munInd('adh_atraso_fund','educacao','Alunos do fundamental com 2 anos ou mais de atraso idade-série','%','ATLAS',2010,'pct1','brasa',
  ADHC('taxa_atraso_2_fundamental')+'Percentual sobre os que frequentam o ensino fundamental regular.');
munInd('adh_fund_18_mais','educacao','Pessoas de 18 anos ou mais com fundamental completo','%','ATLAS',2010,'pct1','agua',ADHC('taxa_fundamental_18_mais'));
munInd('adh_medio_18_20','educacao','Jovens de 18 a 20 anos com ensino médio completo','%','ATLAS',2010,'pct1','agua',ADHC('taxa_medio_18_20'));
munInd('adh_mort_infantil','saude','Mortalidade infantil, até 1 ano (Atlas Brasil, 2010)','por mil nascidos vivos','ATLAS',2010,'dec1','brasa',
  ADHC('mortalidade_1')+'Estimativa do Atlas Brasil sobre o Censo, comparável entre 1991, 2000 e 2010. Não é a taxa do registro civil.');
munInd('adh_mort_5','saude','Mortalidade até 5 anos de idade (Atlas Brasil, 2010)','por mil nascidos vivos','ATLAS',2010,'dec1','brasa',ADHC('mortalidade_5'));
munInd('adh_theil','renda','Índice de Theil-L da renda (Atlas Brasil)','índice','ATLAS',2010,'dec2','brasa',
  ADHC('indice_theil')+'Desigualdade da renda domiciliar per capita: zero quando todos têm a mesma renda; cresce com a desigualdade.');
munInd('adh_razao_10_40','renda','Renda dos 10% mais ricos ÷ renda dos 40% mais pobres','vezes','ATLAS',2010,'dec1','brasa',
  ADHC('razao_10_ricos_40_pobres')+'Compara a renda per capita média do décimo mais rico com a dos dois quintos mais pobres.');
munInd('adh_renda_20_pobres','renda','Parte da renda total que fica com os 20% mais pobres','%','ATLAS',2010,'pct2','agua',ADHC('prop_renda_20_pobres'));
munInd('adh_pobreza_criancas','pobreza','Crianças pobres (Atlas Brasil)','%','ATLAS',2010,'pct1','brasa',
  ADHC('prop_pobreza_criancas')+'Crianças em domicílios com renda per capita de até R$ 140 (agosto de 2010), na definição do Atlas Brasil.');
munInd('adh_extrema_criancas','pobreza','Crianças extremamente pobres (Atlas Brasil)','%','ATLAS',2010,'pct2','brasa',
  ADHC('prop_pobreza_extrema_criancas')+'Crianças em domicílios com renda per capita de até R$ 70 (agosto de 2010).');
munInd('adh_formalizacao','trabalho','Grau de formalização dos ocupados de 18 anos ou mais','%','ATLAS',2010,'pct1','agua',
  ADHC('prop_ocupados_formalizacao')+'Ocupados com carteira assinada, militares, servidores estatutários, e empregadores e trabalhadores por conta própria que contribuem para a previdência, sobre o total de ocupados de 18 anos ou mais.');
munInd('adh_desocup_18_mais','trabalho','Taxa de desocupação de 18 anos ou mais (Atlas Brasil)','%','ATLAS',2010,'pct1','brasa',
  ADHC('taxa_desocupacao_18_mais')+'Número publicado; serve de referência para a desocupação de 2010 calculada pelo Atlas.');
munInd('adh_densidade_2','habitacao','Pessoas em domicílios com mais de 2 moradores por dormitório','%','ATLAS',2010,'pct2','brasa',ADHC('taxa_densidade_2_mais'));
munInd('adh_agua_esgoto_inadeq','saneamento','Pessoas em domicílios com água e esgoto inadequados','%','ATLAS',2010,'pct2','brasa',
  ADHC('taxa_agua_esgoto_inadequados')+'Abastecimento de água e esgotamento sanitário inadequados ao mesmo tempo, na definição do Atlas Brasil.');
munInd('adh_sem_fund_informal','vulner','Pessoas de 18 anos ou mais sem fundamental completo e em ocupação informal','%','ATLAS',2010,'pct1','brasa',ADHC('taxa_sem_fund_informal'));
munInd('adh_criancas_dom_sem_fund','vulner','Crianças em domicílios em que ninguém tem fundamental completo','%','ATLAS',2010,'pct1','brasa',ADHC('taxa_criancas_dom_sem_fund'));
munInd('adh_maes_10_14','saude','Meninas de 10 a 14 anos que tiveram filhos','%','ATLAS',2010,'pct2','brasa',ADHC('taxa_mulheres_com_filho_10_14'));

/* Acesso a Oportunidades: só Porto Alegre. Setor e bairro. */
const OBS_AOP='Projeto Acesso a Oportunidades (IPEA), 2019: rotas calculadas pelo IPEA sobre a malha viária do OpenStreetMap e, no transporte público, sobre a programação publicada das linhas (GTFS), no pico da manhã de um dia útil. Empregos são os vínculos formais da RAIS; escolas e estabelecimentos de saúde, os da rede pública. Cada setor de 2022 recebe o valor do hexágono do IPEA que contém o seu ponto representativo; o bairro, a média dos setores ponderada pela população. Entre as sete cidades, só Porto Alegre está no projeto. A grade de 2019 não alcança 134 setores, quase todos na periferia (extremo sul, zona leste e ilhas): eles ficam sem valor, e o bairro só tem valor se os setores cobertos somam ao menos metade da sua população.';
const aop=(id,n,u,fmt,ramp,niveis,obs)=>ind({id,cat:'mobilidade',n,u,fonte:'IPEA_AOP',ano:2019,niveis,status:'ok',fmt,ramp,obs:(obs?obs+' ':'')+OBS_AOP});
aop('aop_emprego_tp60','Empregos alcançáveis em até 60 minutos de transporte público','% dos empregos da cidade','pct1','agua',['bairro','setor'],
  'Parte dos empregos formais de Porto Alegre que se alcança em até uma hora, combinando transporte público e caminhada.');
aop('aop_saude_pe','Tempo a pé até o estabelecimento de saúde de baixa complexidade mais próximo','min','dec1','brasa',['bairro','setor'],
  'Baixa complexidade na classificação do IPEA. Setor que não alcança nenhum estabelecimento no limite de cálculo fica sem valor e entra na população a mais de 30 minutos.');
aop('aop_infantil_pe','Tempo a pé até a escola pública de educação infantil mais próxima','min','dec1','brasa',['bairro','setor'],
  'Setor que não alcança nenhuma escola no limite de cálculo fica sem valor e entra na população a mais de 30 minutos.');
aop('aop_fundamental_pe','Tempo a pé até a escola pública de ensino fundamental mais próxima','min','dec1','brasa',['bairro','setor']);
aop('aop_saude_30pe','População a mais de 30 minutos a pé da saúde de baixa complexidade','%','pct1','brasa',['bairro'],
  'Moradores de setores cujo tempo a pé passa de 30 minutos ou que não alcançam nenhum estabelecimento no limite de cálculo, sobre os moradores dos setores cobertos.');
aop('aop_infantil_30pe','População a mais de 30 minutos a pé de escola pública de educação infantil','%','pct1','brasa',['bairro'],
  'Moradores de setores cujo tempo a pé passa de 30 minutos ou que não alcançam nenhuma escola no limite de cálculo, sobre os moradores dos setores cobertos.');


/* ---- 4.3.4 IPEADATA ----------------------------------------------------
   Vêm de dados/dados-ipeadata.js, gerado por extracao/7_ipeadata.py a partir da
   API pública do Ipeadata (IPEA). Cada série é um indicador do nível município,
   no ano mais recente em que os sete municípios têm valor; os outros anos ficam
   na tabela do painel. O Ipeadata republica outras fontes (IBGE, Tesouro, MTE):
   a fonte original vai no selo e na nota. Arquivo sem séries (o de partida, antes
   de rodar o script): a categoria não aparece. */
const IPD=window.ATLAS_IPEADATA&&Array.isArray(window.ATLAS_IPEADATA.series)?window.ATLAS_IPEADATA:null;
const IPD_SERIES=IPD?IPD.series:[];
const ipdUnidade=s=>{const u=[s.unidade,s.mult].filter(Boolean).join(' ').trim(); return /^\(?%\)?$/.test(u)?'%':u;};
/* a Firjan (IFDM) tem termos de uso próprios, como na fonte FIRJAN das planilhas */
const ipdAvisoUso=(sigla,nome)=>/firjan/i.test(`${sigla||''} ${nome||''}`)?' A Firjan tem termos de uso próprios: confira antes de redistribuir estes valores.':'';
function ipdFmt(s){
  const vs=[].concat(...s.v).filter(x=>x!=null);
  if(/%/.test(ipdUnidade(s)))return 'pct1';
  if(vs.every(Number.isInteger))return 'int';
  const mx=Math.max(...vs.map(Math.abs));
  return mx>=1000?'dec0':mx>=10?'dec1':'dec2';
}
function ipdObs(s){
  const dt=d=>d.split('-').reverse().join('/');
  return `Série ${s.cod} do Ipeadata${s.tema?', tema '+s.tema:''}. Fonte original: ${s.fonte_nome||s.fonte||'não informada'}. `
    +`O mapa mostra ${s.ano}, o ano mais recente em que os sete municípios têm valor`
    +(s.anos.length>1?`; o painel traz a série de ${s.anos[0]} a ${s.anos[s.anos.length-1]}`:'')+'. '
    +'Valores como o Ipeadata publica, sem conversão e sem completar ano vazio.'
    +(s.atualizada?` Atualizada no Ipeadata em ${dt(s.atualizada)}.`:'')+(s.status==='I'?' Série encerrada no Ipeadata.':'')
    +(s.obs?` Nota do Ipeadata: ${s.obs}`:'');
}
/* Séries municipais com vários anos: as do Ipeadata e as do dados-series.js. Cada uma vira um
   indicador do nível município, no ano do mapa; i.serie guarda os anos para o painel e o CSV. */
const SERIES_REG=[];
function registraSerie(s,o){
  const serie={anos:s.anos,v:s.v,ano:s.ano,mun:o.mun,cod:s.cod,titulo:o.titulo};
  ind({id:s.id,cat:o.cat,n:s.nome,u:o.u,fonte:o.fonte,ano:s.ano,niveis:['municipio'],status:'ok',
    fmt:o.fmt,ramp:o.ramp||'agua',obs:o.obs,serie});
  SERIES_REG.push({id:s.id,serie});
}
if(IPD_SERIES.length){
  CATS.push({id:'ipeadata',n:'Ipeadata (IPEA)'});
  IPD_SERIES.forEach(s=>{
    const fk='IPD_'+(slugId(s.fonte||'')||'outras');
    if(!FONTES[fk])FONTES[fk]={n:`Ipeadata (IPEA) — séries de ${s.fonte_nome||s.fonte||'outras fontes'}`,
      s:`Ipeadata · ${s.fonte||'IPEA'}`,u:'https://www.ipeadata.gov.br/',
      d:`Séries republicadas pelo Ipeadata e lidas na API pública (${IPD.api}) por extracao/7_ipeadata.py, em ${IPD.gerado_em}. `
        +`Fonte original: ${s.fonte_nome||s.fonte||'não informada'}${s.fonte_url?` (${s.fonte_url})`:''}.`+ipdAvisoUso(s.fonte,s.fonte_nome)};
    registraSerie(s,{cat:'ipeadata',u:ipdUnidade(s),fonte:fk,fmt:ipdFmt(s),obs:ipdObs(s)+ipdAvisoUso(s.fonte,s.fonte_nome),mun:IPD.municipios,titulo:'Série no Ipeadata'});
  });
}

/* ---- 4.3.5 SÉRIES COMPLEMENTARES ----------------------------------------
   Vêm de dados/dados-series.js, gerado por extracao/8_series_complementares.py a partir do
   espelho público da Base dos Dados: as bases que o Ipeadata republica e que ainda não estavam
   no Atlas (Atlas Brasil, vacinação, SNIS, ANA e Fundação Abrinq). Cada série entra na sua
   categoria, no ano mais recente em que os sete municípios têm valor. */
const SCOMP=window.ATLAS_SERIES&&Array.isArray(window.ATLAS_SERIES.series)?window.ATLAS_SERIES:null;
if(SCOMP){
  for(const k in (SCOMP.fontes||{}))if(!FONTES[k])FONTES[k]=SCOMP.fontes[k];
  SCOMP.series.forEach(s=>registraSerie(s,{cat:s.cat,u:s.unidade,fonte:s.fonte,fmt:s.fmt,ramp:s.ramp,
    obs:s.obs+` O mapa mostra ${s.ano}, o ano mais recente em que os sete municípios têm valor.`,mun:SCOMP.municipios,
    titulo:'Série histórica'}));
}

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

const OBS_CNES='Unidades de atendimento à população. Ficam de fora as centrais de regulação (CNES tipo 81) e as '
  +'unidades de acesso restrito, dentro de presídios e de unidades socioeducativas, que continuam no mapa com aviso. '
  +'Comunidades terapêuticas e residenciais (tipo 83) têm indicador próprio.';
equipInd('cnes_estabelecimentos','saude','Estabelecimentos de saúde ativos','unidades','CNES',2026,'int','agua',OBS_CNES);
equipInd('cnes_ubs','saude','Postos, centros de saúde e UBS ativos','unidades','CNES',2026,'int','agua',OBS_CNES);
equipInd('cnes_acolhimento','assistencia','Comunidades terapêuticas e residenciais registradas no CNES','unidades','CNES',2026,'int','brasa',
  'Estabelecimentos do tipo 83 do CNES ("polo de prevenção de doenças e agravos e promoção da saúde"): na região, '
  +'comunidades terapêuticas, residenciais terapêuticos e residenciais geriátricos. Não são unidades de saúde de atendimento geral.');
equipInd('cnes_hospitais','saude','Hospitais e hospitais-dia ativos','unidades','CNES',2026);
equipInd('cnes_caps','saude','Centros de Atenção Psicossocial (CAPS)','unidades','CNES',2026);
munInd('gasto_saude','saude','Despesa empenhada em saúde','R$','SICONFI',2024,'brl','agua');
const ANO={siconfi:2024,pop:2026,pib:2023,vab:2021,base:2013};   /* atualizado por aplicaAnosCatalogo() */
const OBS_HAB=x=>`${x} empenhada em ${ANO.siconfi} (SICONFI) dividida pela população estimada de ${ANO.pop} (IBGE).`;
const HAB_ROTULO={gasto_saude_hab:'Despesa em saúde',gasto_atencao_basica_hab:'Despesa em atenção básica',
  gasto_assistencia_hab:'Despesa em assistência social',gasto_seguranca_hab:'Despesa em segurança pública',
  gasto_trabalho_hab:'Despesa na função trabalho'};
munInd('gasto_saude_hab','saude','Despesa em saúde por habitante','R$/hab.','ATLAS_CALC',2024,'brl0','agua',OBS_HAB('Despesa em saúde'));
munInd('gasto_atencao_basica_hab','saude','Despesa em atenção básica por habitante','R$/hab.','ATLAS_CALC',2024,'brl0','agua',OBS_HAB('Despesa em atenção básica'));
ind({id:'ubs_10mil',cat:'saude',n:'UBS e postos de saúde por 10 mil habitantes',u:'por 10 mil hab.',fonte:'ATLAS_CALC',ano:2026,
  niveis:['municipio','bairro'],status:'ok',fmt:'dec2',ramp:'agua',
  obs:'Postos, centros de saúde e UBS ativos no CNES (2026) por 10 mil moradores do Censo 2022, sem as unidades prisionais e socioeducativas. Conta unidades, não equipes nem horas de atendimento.'});
munInd('gasto_atencao_basica','saude','Despesa empenhada em atenção básica','R$','SICONFI',2024,'brl','agua');

munInd('gasto_assistencia','assistencia','Despesa empenhada em assistência social','R$','SICONFI',2024,'brl','brasa');
munInd('gasto_assistencia_comunitaria','assistencia','Despesa em assistência comunitária','R$','SICONFI',2024,'brl','brasa');
munInd('gasto_assistencia_hab','assistencia','Despesa em assistência social por habitante','R$/hab.','ATLAS_CALC',2024,'brl0','brasa',OBS_HAB('Despesa em assistência social'));
/* pobreza de 2010 no município: est_pobreza e est_extrema_pobreza, com o valor municipal calculado (ver VALOR_OFICIAL_2010) */

munInd('seg_homicidios','seguranca','Homicídios dolosos consumados','ocorrências','SSPRS',2025,'int','brasa');
munInd('seg_vitimas_homicidio','seguranca','Vítimas de homicídio doloso','vítimas','SSPRS',2025,'int','brasa');
munInd('seg_furtos','seguranca','Furtos','ocorrências','SSPRS',2025,'int','brasa');
munInd('seg_furto_veiculo','seguranca','Furtos de veículo','ocorrências','SSPRS',2025,'int','brasa');
munInd('seg_roubos','seguranca','Roubos','ocorrências','SSPRS',2025,'int','brasa');
munInd('seg_roubo_veiculo','seguranca','Roubos de veículo','ocorrências','SSPRS',2025,'int','brasa');
munInd('seg_estelionato','seguranca','Estelionatos','ocorrências','SSPRS',2025,'int','brasa');
munInd('seg_cvli','seguranca','Vítimas de crimes violentos letais intencionais','vítimas','SSPRS',2025,'int','brasa');
munInd('gasto_seguranca','seguranca','Despesa municipal empenhada em segurança pública','R$','SICONFI',2024,'brl','terra');
const OBS_100MIL=x=>`${x} em 2025 (SSP/RS) por 100 mil habitantes da população estimada de 2026 (IBGE).`;
munInd('cvli_100mil','seguranca','Vítimas de CVLI por 100 mil habitantes','por 100 mil hab.','ATLAS_CALC',2025,'dec1','brasa',OBS_100MIL('Vítimas de crimes violentos letais intencionais'));
munInd('homicidio_100mil','seguranca','Vítimas de homicídio doloso por 100 mil habitantes','por 100 mil hab.','ATLAS_CALC',2025,'dec1','brasa',OBS_100MIL('Vítimas de homicídio doloso'));
munInd('roubos_100mil','seguranca','Roubos por 100 mil habitantes','por 100 mil hab.','ATLAS_CALC',2025,'dec0','brasa',OBS_100MIL('Roubos registrados'));
munInd('gasto_seguranca_hab','seguranca','Despesa municipal em segurança por habitante','R$/hab.','ATLAS_CALC',2024,'brl0','terra',OBS_HAB('Despesa em segurança pública'));

/* trabalho de 2010 no município: os indicadores est_* abaixo, com o valor municipal calculado (ver VALOR_OFICIAL_2010).
   As versões "(histórico)" só do município duplicavam o mesmo número. */
munInd('gasto_trabalho','trabalho','Despesa municipal empenhada na função trabalho','R$','SICONFI',2024,'brl','terra');
munInd('gasto_trabalho_hab','trabalho','Despesa municipal na função trabalho por habitante','R$/hab.','ATLAS_CALC',2024,'brl0','terra',OBS_HAB('Despesa na função trabalho'));

munInd('fin_receita_total','financas','Receitas brutas realizadas','R$','SICONFI',2024,'brl','agua');
munInd('fin_receita_corrente','financas','Receitas correntes brutas','R$','SICONFI',2024,'brl','agua');
munInd('fin_receita_tributaria','financas','Receita tributária bruta','R$','SICONFI',2024,'brl','agua');
munInd('fin_transf_pct','financas','Transferências correntes sobre a receita bruta','%','ATLAS_CALC',2024,'pct1','agua',
  'Transferências correntes brutas sobre as receitas brutas realizadas em 2024 (SICONFI). Mede a dependência de recursos de outros entes.');
munInd('fin_transferencias','financas','Transferências correntes brutas','R$','SICONFI',2024,'brl','terra');
munInd('fin_despesa_total','financas','Despesas empenhadas','R$','SICONFI',2024,'brl','brasa');
munInd('fin_investimentos','financas','Investimentos empenhados','R$','SICONFI',2024,'brl','terra');
munInd('fin_resultado_orcamentario','financas','Resultado orçamentário simplificado','R$','ATLAS_CALC',2024,'brl','brasa',
  'Receitas brutas realizadas menos despesas empenhadas, ambas da DCA/SICONFI.');

munInd('agro_vab','agro','Valor adicionado bruto da agropecuária','R$ mil','PIB',2021,'int','terra');
/* a participação da agropecuária no VAB já está no catálogo como pct_vab_agro (economia) */
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
  +'mudança entre 2010 e 2022. No nível de bairro é a média ponderada pela população dos setores. '
  +'No nível município é o valor que o Atlas calculou sobre todos os registros da amostra do município '
  +'(para o Gini, a média das áreas não seria um Gini válido). Não é número publicado pelo IBGE: na renda, '
  +'na pobreza e no Gini fica acima do Atlas Brasil (ver os indicadores do Atlas Brasil e '
  +'docs/AUDITORIA-DADOS-v3.2.md, achado E3).';
/* valores municipais de 2010 calculados pelo Atlas sobre os microdados (bloco municipal_2010
   de dados-nucleo.js). O nome VALOR_OFICIAL_2010 é histórico: não são números publicados. */
const VALOR_OFICIAL_2010={est_desocupacao:'taxa_desocupacao',est_participacao:'taxa_participacao',
  est_informalidade:'pct_informalidade',est_emprego_formal:'pct_emprego_formal',est_conta_propria:'pct_conta_propria',
  est_sem_previdencia:'pct_sem_previdencia',est_rdpc:'rdpc_media',est_pobreza:'pct_pobreza',
  est_extrema_pobreza:'pct_extrema_pobreza',est_gini:'gini_rdpc',est_superior_25:'pct_superior_25',
  est_sem_fundamental_25:'pct_sem_fundamental_25'};
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
IND.find(i=>i.id==='est_gini').obs=OBS_EST+' No bairro, o Gini só aparece quando o bairro cabe numa única área de ponderação '
  +'(45 bairros): a média de Ginis de áreas diferentes não é um Gini. Nos demais, a ficha mostra o valor do município.';
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

/* ─────────────────────────────────────────────────────── 6. ESTADO ───── */
const S={
  nivel:'bairro', indId:'pop', cat:'visao', ramp:null, classes:5, metodo:'quantil',
  sel:null, cmp:[], geo:{bairro:null,setor:null}, dados:{bairro:{},setor:{}},
  camadas:{base:false,fcu:false,risco:false,bolsoes:false,lojas:true,escolas:false,saude:false,acolhimento:false},
  loja:null, raio:1, muniFiltro:null, importados:[]
};

/* ─────────────────────────────────────────────────── 7. UTILITÁRIOS ──── */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const nf=new Intl.NumberFormat('pt-BR');
const NIVEL_CURTO={municipio:'município',bairro:'bairro',setor:'setor'};
/* unidade ao lado de um valor já formatado em reais: tira o "R$" repetido */
const unid=i=>!i.u?'':(/^brl/.test(i.fmt||'')&&/^R\$/.test(i.u))
  ?i.u.replace(/^R\$\s*/,'').replace(/^\//,'por ')
  :(/^pct/.test(i.fmt||'')&&i.u==='%')?'':i.u;
const listaPt=a=>a.length<2?(a[0]||''):a.slice(0,-1).join(', ')+' e '+a[a.length-1];
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
    case 'brl0':return 'R$ '+nf.format(Math.round(v));
    case 'brlc':{ /* compacto, para valores da ordem de milhões e bilhões */
      const a=Math.abs(v), d1=x=>x.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
      return a>=1e9?'R$ '+d1(v/1e9)+' bi':a>=1e6?'R$ '+d1(v/1e6)+' mi':'R$ '+nf.format(Math.round(v));}
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
let map,camada,camadaBase=null,camadaFCU=null,camadaRisco=null,ATLAS_DB=null;
/* Um só canvas para as camadas de área sobre o mapa (favelas, áreas de risco e
   bolsões). Com um canvas por camada, o de cima recebia todos os eventos do
   mouse e o tooltip das camadas de baixo nunca aparecia. */
let RENDER_SOBRE=null, sobreCamada=false;
const rendererSobre=()=>RENDER_SOBRE||(RENDER_SOBRE=L.canvas({padding:.4,pane:'atlasSobre'}));
/* com o cursor sobre uma dessas camadas, vale só o tooltip dela: o do
   território de baixo (a reserva do mousemove do mapa) sai de cena */
function marcaSobre(c){
  c.on('mouseover',()=>{sobreCamada=true;limpaHoverReserva();});
  c.on('mouseout remove',()=>{sobreCamada=false;});
}
let MUNICIPAL_2010={}, METODO_EST='';
let PONTOS=null, MUNIS_LISTA=null, camadasPonto={}, focoLoja=null, camadaRaio=null;
let RAW_SETORES=null, RAW_NUCLEO=null, RAW_EST=null;
let POP_MUNI={};                       /* população do Censo 2022 por município */
let camadaPorId=null, destacadas=[];   /* id -> camada, e as camadas realçadas */
const estaDestacada=l=>destacadas.indexOf(l)>=0;
function iniciaMapa(){
  /* Até 3 px de deslocamento entre apertar e soltar o botão o Leaflet conta como
     clique; acima disso vira arrasto e o clique se perde. Mouse trêmulo e touchpad
     passam de 3 px com facilidade. */
  L.Draggable.prototype.options.clickTolerance=6;
  map=L.map('map',{zoomControl:false,attributionControl:true,minZoom:9,maxZoom:18,
    preferCanvas:false});
  /* Ordem de empilhamento por pane. Antes os pontos eram recriados depois de
     cada desenho, num setTimeout, só para ficarem por cima do coropleto. */
  map.createPane('atlasSobre').style.zIndex=460;   /* FCU e raio da loja */
  map.createPane('atlasPontos').style.zIndex=480;  /* escolas, saúde, lojas */
  map.fitBounds([[-30.2694,-51.3032],[-29.9308,-51.0114]]);
  L.control.zoom({position:'topright'}).addTo(map);
  ligaCliqueDoMapa();
  const Fit=L.Control.extend({options:{position:'topright'},
    onAdd(){const a=L.DomUtil.create('a','leaflet-bar leaflet-control fit-btn');
      a.href='#'; a.title='Enquadrar o mapa'; a.setAttribute('role','button');
      a.innerHTML='⤢';
      L.DomEvent.on(a,'click',e=>{L.DomEvent.stop(e);ajustaMapa(true);});
      return a;}});
  map.addControl(new Fit());
  const Exp=L.Control.extend({options:{position:'topright'},
    onAdd(){const a=L.DomUtil.create('a','leaflet-bar leaflet-control fit-btn exp-btn');
      a.href='#'; a.title='Exportar mapa (PNG)'; a.setAttribute('role','button'); a.setAttribute('aria-label','Exportar mapa em PNG');
      a.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14"/></svg>';
      L.DomEvent.on(a,'click',e=>{L.DomEvent.stop(e);exportaMapa();});
      return a;}});
  map.addControl(new Exp());
  map.attributionControl.setPrefix('');
  map.attributionControl.addAttribution(
    'Malhas: IBGE 2022 · SMUrb/PMPA — Dados: IBGE, INEP, DATASUS, SICONFI, SSP/RS');
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
  /* Com muitos zeros (favelas por setor: 91%), os quantis colapsam em 0,0,0,0.
     Zero vira uma classe própria e as quebras são feitas entre os positivos. */
  const zeros=ord.length?ord.filter(v=>v===0).length:0;
  if(zeros>=0.2*ord.length&&ord.length-zeros>=S.classes)
    S._brk=[0].concat(quebrasDe(ord.slice(zeros),S.classes-1,S.metodo));
  else S._brk=quebrasDe(ord,S.classes,S.metodo);
  /* quebras repetidas ou iguais ao máximo só criam classes vazias na legenda
     (favela por setor: quase todo valor é 0% ou 100%) */
  const mx=ord.length?ord[ord.length-1]:null;
  S._brk=S._brk.filter((b,k,a)=>(k===0||b!==a[k-1])&&(mx==null||b<mx));
  S._ramp=S.ramp||i.ramp||'agua';
  S._cores=escalaCores(S._ramp,S._brk.length+1);   /* antes: por feição */
  return vals;
}
function estiloFeicao(f){
  const setor=S.nivel==='setor';
  const c=corDe(valor(f.properties),S._brk,S._ramp,S._cores);
  return {fillColor:c||COR.semdado, fillOpacity:c?.92:.7,
    color: c?COR.papel:COR.contorno,
    weight: setor?.4:1, opacity:setor?.75:1,
    dashArray: c?null:'2,3'};
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
  chavesPonto().forEach(k=>pontosOn(k,!!S.camadas[k]));
  fcuOn(!!S.camadas.fcu);
  riscoOn(!!S.camadas.risco);
}
/* Reconstrói a camada — só quando muda a geometria exibida (nível ou filtro). */
function desenhaMapa(){
  const nivel=S.nivel;
  if(camada){map.removeLayer(camada);camada=null;}
  camadaPorId=null; destacadas=[]; hoverReserva=null;
  if(ttReserva&&map.hasLayer(ttReserva))map.closeTooltip(ttReserva);
  sincronizaCamadas();
  const g=geoDoNivel();
  S._g=g;
  if(!g){renderProv();renderLegenda();return;}

  calculaEscala(g);
  camadaPorId=new Map();
  camada=L.geoJSON(g,{
    renderer: nivel==='setor'?L.canvas({padding:.4}):L.svg({padding:.3}),
    style:estiloFeicao, bubblingMouseEvents:false,
    onEachFeature:(f,l)=>camadaPorId.set(f.properties.id,l)
  }).addTo(map);

  /* Um tooltip e três listeners no grupo, e não 4.722 vezes cada um.
     O Leaflet entrega a feição filha em e.propagatedFrom. */
  camada.bindTooltip(l=>tooltipHTML((l.feature||l).properties||{}),
    {className:'tt',sticky:true,direction:'top'});
  camada.on('mouseover',e=>{
    limpaHoverReserva();
    const l=e.propagatedFrom||e.layer;
    if(!l||!l.setStyle||estaDestacada(l))return;
    /* no nível setor, realçar obrigaria o canvas a redesenhar os 4.722 polígonos
       a cada passagem do mouse; ali o tooltip já dá o retorno visual */
    if(S.nivel!=='setor'){l.setStyle({weight:2.4,color:COR.tinta,opacity:1});l.bringToFront&&l.bringToFront();}
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
  if(S.sel)destaca(S.sel,{color:COR.tinta,weight:3,opacity:1});
  S.cmp.forEach(id=>{if(id!==S.sel)destaca(id,{color:COR.terracota,weight:2.6,opacity:1});});
}
function tooltipHTML(p){
  const i=indAtual(), v=valor(p);
  const linhas=[[i.n, v==null?'sem dado':fmtN(v,i.fmt)+(i.u&&!/^%/.test(i.u)?' '+i.u.replace('%',''):'')]];
  const extras = S.nivel==='bairro'
    ? [['População (2022)','pop_2022','int'],['Densidade','dens_hab_km2','dec1'],['Área','area_km2','dec2']]
    : [['População (2022)','pop_2022','int'],['Domicílios','dom_total','int'],['Moradores/dom.','moradores_dom','dec2']];
  extras.forEach(([n,k,f])=>{ if(k!==S.indId) linhas.push([n, p[k]==null?'sem dado':fmtN(+p[k],f)]); });
  return `<b>${esc(p.nome)}${p.bairro&&S.nivel==='setor'?` <span class="tt-sub">· ${esc(p.bairro)}</span>`:''}</b>`+
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
    if(com<tot&&pc>0&&pt>0){const r=100*pc/pt;
      extra=` · ${r>=99.95?'mais de 99,9%':fmtN(r,'pct1')} da população`;}
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
    ? `<span class="warn" style="color:var(--est)">◆ Referência histórica do Censo 2010, atribuída ao território de 2022 — ver Metodologia</span>`:'';
  $('#prov').innerHTML=`
    <div class="prov-hd"><span class="ttl">${esc(i.n)}</span>
    <div class="ramp-sel" role="group" aria-label="Cor do mapa">${Object.keys(RAMPAS).map(r=>{
      const cs=escalaCores(r,5);
      return `<button data-ramp="${r}" title="${esc(RAMPA_NOMES[r])}" aria-label="${esc(RAMPA_NOMES[r])}" aria-pressed="${(S.ramp||i.ramp)===r}"
        style="background:linear-gradient(90deg,${cs.join(',')})"></button>`;}).join('')}</div></div>
    <div class="meta">${selo(i,S.nivel)}<span class="chip">${esc(n.ab)}</span>${cob}</div>
    ${alerta}`;
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
  /* faixas e motivos de ausência: mesmo cálculo usado na exportação do mapa */
  const {faixas,motivos}=rotulosLegenda();
  const rot=faixas.map(r=>`<div class="lrow"><i class="lsw" style="background:${r.cor}"></i><span>${r.txt}</span></div>`);
  el.classList.toggle('min',!!S.legMin);
  el.innerHTML=`<button class="lg-hd" id="lgToggle" aria-expanded="${!S.legMin}"><h4>${esc(i.n)}</h4><span class="lg-chev" aria-hidden="true"></span></button>
    <div class="lg-body"><div class="un">${esc(i.u||'')} · ${esc(NIVEIS[S.nivel].n.toLowerCase())} · ${i.ano||'s/ ano'}</div>
    ${rot.reverse().join('')}
    ${motivos.map(([n,t])=>`<div class="lrow nd"><i class="lsw nodata"></i>
      <span>${esc(t)} · ${nf.format(n)}</span></div>`).join('')}
    <div class="foot"><span class="eyebrow">Classificação</span>
      <div class="class-sel">
        <button data-m="quantil" aria-pressed="${S.metodo==='quantil'}">quantis</button>
        <button data-m="igual" aria-pressed="${S.metodo==='igual'}">int. iguais</button>
      </div>
      <div class="class-sel" style="margin-top:4px">
        ${[4,5,6,7].map(k=>`<button data-k="${k}" aria-pressed="${S.classes===k}">${k}</button>`).join('')}
      </div></div></div>`;
  $('#lgToggle').onclick=()=>{S.legMin=!S.legMin;el.classList.toggle('min',S.legMin);
    $('#lgToggle').setAttribute('aria-expanded',String(!S.legMin));};
  $$('#legend [data-m]').forEach(b=>b.onclick=()=>{S.metodo=b.dataset.m;repintaMapa();});
  $$('#legend [data-k]').forEach(b=>b.onclick=()=>{S.classes=+b.dataset.k;repintaMapa();});
}

/* ───────────────────────────────────────────────── 11. SIDEBAR / CATS ── */
function renderCats(){
  $('#cats').innerHTML=CATS.map(c=>{
    /* status "mun" (valor só de Porto Alegre) e "pend" não têm mapa: ficam fora da lista */
    const inds=IND.filter(i=>i.cat===c.id&&i.status!=='mun'&&i.status!=='pend');
    if(!inds.length)return '';
    const ok=inds.length;
    return `<div class="cat${c.id===S.cat?' open':''}" data-cat="${c.id}">
      <button aria-expanded="${c.id===S.cat}"><span class="cn">${esc(c.n)}</span>
        <span class="cnt">${ok}</span><span class="chev" aria-hidden="true"></span></button>
      <div class="inds">${inds.map(i=>{
        const f=(FONTES[i.fonte]||{}).s||i.fonte;
        return `<button class="ind${i.id===S.indId?' on':''} st-${i.status}" data-ind="${i.id}"
          data-busca="${esc(norm(i.n+' '+c.n))}">
          <span class="nm">${esc(i.n)}</span>
          <span class="meta"><i class="dot"></i>${esc(f)}${i.ano?' · '+i.ano:''}${i.status==='est'?' · histórico':''}${i.status==='ext'?' · não oficial':''}
            <span class="lvl">${listaPt(['municipio','bairro','setor'].filter(n=>i.niveis.includes(n)).map(n=>NIVEL_CURTO[n]))}</span></span></button>`;
      }).join('')}</div></div>`;
  }).join('');
  $$('.cat>button').forEach(b=>b.onclick=()=>{
    const c=b.parentElement; const wasOpen=c.classList.contains('open');
    $$('.cat').forEach(x=>{x.classList.remove('open');x.firstElementChild.setAttribute('aria-expanded','false');});
    if(!wasOpen){c.classList.add('open');b.setAttribute('aria-expanded','true');S.cat=c.dataset.cat;}
  });
  const n=$('#nInd'); if(n)n.textContent=nf.format($$('.ind').length);
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
  S.nivel=n; S.sel=null; S.cmp=[]; S._fit=false; S.bolsao=null;
  $$('#segNivel button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.nivel===n));
  if(!silent){desenhaMapa();renderPainel();}
}

/* ──────────────────────────────────────────────────── 12. PAINEL ─────── */
function renderPainel(){
  const b=$('#panelBody');
  if(S.bolsao!=null&&!S.sel&&BOLSOES){abreBolsao(S.bolsao);return;}
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
    /* todas as categorias com valor para este município; nenhum bloco vazio */
    const hab=p.pop_est_2026!=null?`${fmtN(p.pop_est_2026,'int')} habitantes · 2026`
      :p.pop!=null?`${fmtN(p.pop,'int')} habitantes · 2022`:'';
    return `<div class="terr-h"><div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
      <button class="btn" id="btnVoltar" style="padding:3px 8px;font-size:11px">← Sete municípios</button>
      <span class="eyebrow">Perfil municipal</span></div><h2>${esc(p.nome)}</h2>
      ${hab?`<div class="sub"><span class="chip acc">${hab}</span></div>`:''}</div>
      ${CATS.map(c=>{
        const itens=IND.filter(x=>x.cat===c.id&&x.niveis.includes('municipio')&&x.status!=='pend'&&p[x.id]!=null);
        if(!itens.length)return '';
        return `<h3 class="sec">${esc(c.n)}<span class="chip tag">${itens.length}</span></h3>`+
          itens.map(x=>`<div class="row"><div class="k">${esc(x.n)}${selo(x,'municipio')}</div>
            <div class="v"><span class="num">${fmtN(+p[x.id],x.fmt)}</span><span class="u">${esc(unid(x))}</span></div></div>`).join('');
      }).join('')}`;
  }
  const fs=g.features.filter(f=>S.muniFiltro==null||f.properties.muni_id===S.muniFiltro);
  const arr=fs.map(f=>({f,v:valor(f.properties)})).sort((a,b)=>(b.v??-Infinity)-(a.v??-Infinity));
  const mx=Math.max(0,...arr.map(a=>a.v??0));
  return `<div class="terr-h"><span class="eyebrow">Comparação metropolitana</span>
    <h2>Sete municípios da RMPA</h2><div class="sub"><span class="chip acc">dados com fonte e ano</span></div></div>
    <h3 class="sec">${esc(i.n)}</h3>
    ${arr.map(({f,v})=>{
      /* barra de magnitude na cor da classe do mapa: liga a lista ao mapa */
      const w=v!=null&&mx>0&&v>0?Math.max(2,100*v/mx):0, cor=corDe(v,S._brk||[],S._ramp||i.ramp,S._cores);
      return `<button class="row muni-row" data-goto="${esc(f.properties.id)}">
      <div class="k"><b>${esc(f.properties.nome)}</b>
        ${v!=null?`<span class="barra" aria-hidden="true"><i style="width:${w.toFixed(1)}%;background:${cor||COR.semdado}"></i></span>`:''}</div>
      <div class="v"><span class="num">${fmtN(v,i.fmt)}</span>
      <span class="u">${esc(unid(i))}</span></div></button>`;}).join('')}
    ${S.muniFiltro==null?`<div class="row muni-row regiao"><div class="k"><b>Região (7 municípios)</b>
      <span class="ref-note">${valor(regiaoProps())==null?(i.ano===2010?'o valor de 2010 é calculado só por município':'a fonte publica por município; o valor não se soma entre eles'):'somas e taxas recalculadas a partir das contagens'}</span></div>
      <div class="v"><span class="num">${fmtN(valor(regiaoProps()),i.fmt)}</span><span class="u">${esc(unid(i))}</span></div></div>`:''}
    ${i.serie?serieMunHTML(i):''}
    <div class="note" style="margin-top:14px">Clique em um município para ver, em uma única ficha,
      saúde, assistência, segurança, emprego, finanças e agro.</div>`;
}
/* Série municipal (Ipeadata, complementares ou extraída): até quatro anos (os mais recentes,
   sempre com o ano do mapa), nos sete municípios; a série toda vai no CSV. Quatro colunas
   cabem na largura do painel. */
function serieMunHTML(i){
  const s=i.serie;
  let js=s.anos.map((a,j)=>j).slice(-4);
  const jm=s.anos.indexOf(s.ano);
  if(jm>=0&&!js.includes(jm))js=[jm].concat(js.slice(-3));
  return `<h3 class="sec">${esc(s.titulo||'Série histórica')} <span class="chip tag">${s.anos[0]}${s.anos.length>1?'–'+s.anos[s.anos.length-1]:''}</span></h3>
  <div class="tb-scroll"><table class="tb ipd"><thead><tr><th>Município</th>${js.map(j=>`<th class="n${s.anos[j]===s.ano?' destaque':''}">${s.anos[j]}</th>`).join('')}</tr></thead>
  <tbody>${s.mun.map((c,k)=>`<tr><td>${esc(nomeDoCod(c)||c)}</td>${js.map(j=>{const v=s.v[j][k];
    return `<td class="n${s.anos[j]===s.ano?' destaque':''}">${v==null?'—':esc(fmtN(v,i.fmt))}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div>
  <p class="ref-note" style="margin-top:6px">Em destaque, ${s.ano}: o ano do mapa, o mais recente com os sete municípios.
    “—”: a fonte não tem o valor. ${unid(i)?`Unidade: ${esc(unid(i))}.`:''}</p>
  <div class="btn-row"><button class="btn" id="btnSerieCsv" data-serie="${esc(i.id)}">Baixar a série${s.anos.length>js.length?` toda (${s.anos.length} anos)`:''} em CSV</button></div>`;
}
function ligaPainel(){
  const v=$('#btnVoltar'); if(v)v.onclick=()=>{S.sel=null;marcaSelecao();renderPainel();};
  const c=$('#btnAddCmp'); if(c)c.onclick=()=>{addCmp(S.sel);abreModal('mdAnalise');};
  const r=$('#btnRankAqui'); if(r)r.onclick=()=>abreRanking();
  $$('[data-goto]').forEach(x=>x.onclick=()=>selecionar(x.dataset.goto));
  $$('[data-filtra]').forEach(x=>x.onclick=()=>filtraMunicipio(+x.dataset.filtra));
  const fm=$('#btnFichaMun');
  if(fm)fm.onclick=()=>{const p=muniSelecionado(); if(!p)return; setNivel('municipio',true); selecionar(p.id);};
  const ic=$('#btnSerieCsv');
  if(ic)ic.onclick=()=>{const i=getInd(ic.dataset.serie); if(!i||!i.serie)return; const s=i.serie;
    baixaCSV([['ano'].concat(s.mun.map(c=>nomeDoCod(c)||c))].concat(s.anos.map((a,j)=>[a].concat(s.v[j].map(v=>v??'')))),
      `serie-${i.id}.csv`);};
}

/* ── Painel de abertura: o município escolhido no seletor do topo ou, sem
   escolha, a região. Até a versão 3.4 mostrava sempre Porto Alegre, mesmo com
   outro município filtrado no mapa. */
function muniSelecionado(){
  if(S.muniFiltro==null)return null;
  const f=((S.geo.municipio||{}).features||[]).find(x=>x.properties.muni_id===S.muniFiltro);
  return f?f.properties:null;
}
/* indicador só municipal; os do IBGE Cidades (estado "mun") existem só para Porto Alegre */
function valorMunicipal(p,i){
  if(p[i.id]!=null&&p[i.id]!=='')return p[i.id];
  return p.nome===MUN.nome&&MUN[i.id]!=null?MUN[i.id]:null;
}
/* setores por município e os que o IBGE publica sem os blocos de pessoas */
let CONTA_SET=null;
function contaSetores(){
  if(CONTA_SET)return CONTA_SET;
  const T=RAW_SETORES,N=RAW_NUCLEO; if(!T||!N)return CONTA_SET={};
  const ns=T.geom.length, muni=decDic(T.m,null,ns), C=N.campos, E=N.escalas;
  const col=k=>{const i=C.indexOf(k);return i<0||!T.valores[k]?null:decCol(T.valores[k],E[i],ns);};
  const pop=col('pop'),ph=col('pop_h'),pm=col('pop_m'), r={};
  for(let i=0;i<ns;i++){
    const o=r[muni[i]]||(r[muni[i]]={setores:0,semBloco:0,popSem:0});
    o.setores++;
    if(ph&&pm&&ph[i]==null&&pm[i]==null){o.semBloco++; if(pop&&pop[i]>0)o.popSem+=pop[i];}
  }
  return CONTA_SET=r;
}
function filtraMunicipio(k){
  S.muniFiltro=k; const sm=$('#selMuni'); if(sm)sm.value=k==null?'':String(k);
  S.sel=null; S._fit=false; desenhaMapa(); renderPainel();
}
function aberturaHTML(){
  const p=muniSelecionado(), R=p?null:regiaoProps(), q=p||R||{};
  const cs=contaSetores(), soma=k=>Object.values(cs).reduce((a,o)=>a+(o[k]||0),0);
  const info=p?(cs[p.muni_id]||{}):{setores:soma('setores'),semBloco:soma('semBloco'),popSem:soma('popSem')};
  const bs=S.geo.bairro.features.filter(f=>!p||f.properties.muni_id===p.muni_id);
  const semBairros=p&&bs.length===1&&/sem divisão de bairros/i.test(bs[0].properties.nome);
  const cod=p&&MUNIS_LISTA?String(MUNIS_LISTA.ids[p.muni_id]):null;
  const kpis=[
    ['População',q.pop,'int','Censo/IBGE · 2022'],
    ['Área',q.area_km2,'dec2','setores IBGE · 2022',' km²'],
    ['PIB',q.pib!=null?q.pib*1000:null,'brlc',(p?'IBGE · ':'IBGE · soma dos sete · ')+ANO.pib],
    ['PIB per capita',q.pib_pc,'brl0','Cálculo do Atlas · '+ANO.pib],
    ['Rendimento médio do responsável',q.resp_renda,'brl0','Cálculo do Atlas · 2022'],
    ['IDHM',p?p.idhm:null,'dec3','Atlas Brasil · 2010']
  ];
  /* só entra o que tem valor: o painel nunca exibe cartão vazio */
  const cards=kpis.filter(k=>k[1]!=null).map(([lb,val,f,src,suf])=>`<div class="kpi"><span class="lb">${esc(lb)}</span>
      <span class="vl">${fmtN(val,f)}${suf?`<small>${suf}</small>`:''}</span>
      <span class="selo s-ok"><i class="dot"></i>${esc(src)}</span></div>`).join('');

  /* indicadores que só existem por município, agrupados por tema */
  const soMun=IND.filter(i=>i.niveis.includes('municipio')&&!i.niveis.includes('bairro')
    &&!i.niveis.includes('setor')&&i.status!=='pend');
  const itens=soMun.map(i=>({i,v:p?valorMunicipal(p,i):q[i.id]}))
    .filter(o=>o.v!=null&&o.v!==''&&!isNaN(+o.v));
  const grupos=CATS.map(c=>({c,l:itens.filter(o=>o.i.cat===c.id)})).filter(g=>g.l.length);
  const linhaMun=({i,v})=>`<div class="row"><div class="k">${esc(i.n)}${selo(i,'municipio')}</div>
     <div class="v"><span class="num">${fmtN(+v,i.fmt)}</span><span class="u">${esc(unid(i))}</span></div></div>`;

  const munis=((S.geo.municipio||{}).features||[]).map(f=>f.properties);
  const aopM=p&&AOP?(AOP.municipio||{})[cod]:null;
  return `
  <div class="terr-h">
    <span class="eyebrow">${p?'Município selecionado':'Atlas socioeconômico interativo'}</span>
    <h2>${esc(p?p.nome:'Região metropolitana')}</h2>
    <div class="sub">${p?`<span class="chip acc">RS · ${esc(cod)}</span>`:'<span class="chip acc">7 municípios</span>'}
      <span class="chip">${semBairros?'sem divisão de bairros no IBGE':nf.format(bs.length)+' bairros'}</span>
      <span class="chip">${nf.format(info.setores||0)} setores</span></div>
  </div>
  <div class="hero-kpi">${cards}</div>
  <p style="font-size:12px;color:var(--txt2);line-height:1.6">
    ${p?`Selecione um indicador na coluna à esquerda para explorar as desigualdades dentro de
    ${esc(p.nome)}, ou clique em um território no mapa para abrir o perfil completo.`
    :`Selecione um indicador na coluna à esquerda para comparar os territórios dos sete municípios,
    ou escolha um município no seletor do topo.`}</p>

  ${p?'':`<h3 class="sec">Os sete municípios</h3>
  ${munis.map(m=>`<button class="row muni-row" data-filtra="${m.muni_id}"><div class="k"><b>${esc(m.nome)}</b>
      ${m.idhm!=null?`<span class="ref-note">IDHM ${fmtN(m.idhm,'dec3')} · Atlas Brasil 2010</span>`:''}</div>
    <div class="v"><span class="num">${fmtN(m.pop,'int')}</span><span class="u">moradores · 2022</span></div></button>`).join('')}
  <p class="ref-note" style="margin-top:6px">Clique em um município para ver o painel dele.</p>`}

  <h3 class="sec">${p?'Indicadores só do município':'Indicadores municipais, somados na região'}
    <span class="chip tag">${itens.length}</span></h3>
  <p style="font-size:12px;color:var(--txt3);margin-bottom:8px;line-height:1.55">
    ${p?`Estes indicadores não têm representatividade abaixo do município e por isso
    <b>não são rateados entre bairros</b>.`:`Somas dos sete municípios, ou taxas recalculadas sobre as somas.
    Índices como o IDHM não se somam e ficam de fora.`}</p>
  ${grupos.map((g,k)=>`<details class="grupo"${k===0?' open':''}><summary>${esc(g.c.n)}<span class="chip tag">${g.l.length}</span></summary>
    ${g.l.map(linhaMun).join('')}</details>`).join('')}
  ${p?`<div class="btn-row"><button class="btn" id="btnFichaMun">Abrir a ficha completa de ${esc(p.nome)}</button></div>`:''}

  ${aopM?`<h3 class="sec">Acesso a oportunidades <span class="chip tag">IPEA · 2019</span></h3>
  ${Object.keys(aopM).map(k=>{const i=getInd(k);return i&&aopM[k]!=null?`<div class="row"><div class="k">${esc(i.n)}</div>
    <div class="v"><span class="num">${fmtN(aopM[k],i.fmt)}</span><span class="u">${esc(unid(i))}</span></div></div>`:'';}).join('')}
  <p class="ref-note" style="margin-top:6px">Média da cidade ponderada pela população dos setores cobertos.
    Mapa por bairro e setor em <b>Mobilidade e acesso</b>.</p>`:''}

  ${p?seriesMunicipioHTML(cod):''}

  <h3 class="sec">Retrato ${p?'do município':'da região'} — Censo 2022</h3>
  ${retratoHTML(q,info,p)}

  <h3 class="sec">Cobertura do Atlas</h3>
  ${coberturaHTML()}`;
}

/* agregados do Censo 2022 do município (ou da região): são as somas dos setores */
function retratoHTML(q,info,p){
  const T=k=>+q[k]||0;
  const rc=T('raca_branca')+T('raca_preta')+T('raca_amarela')+T('raca_parda')+T('raca_indigena');
  const dp=T('dppo'), pc=(a,b)=>b?100*a/b:null;
  const linhas=[
    ['População feminina', T('pop_m'), 'int', pc(T('pop_m'),T('pop_h')+T('pop_m'))],
    ['Idosos (60 anos ou mais)', T('idosos_60'), 'int', pc(T('idosos_60'),T('pop'))],
    ['Crianças e adolescentes (0 a 14)', T('criancas_0_14'), 'int', pc(T('criancas_0_14'),T('pop'))],
    ['População preta ou parda', T('raca_preta_parda'), 'int', pc(T('raca_preta_parda'),rc)],
    ['População indígena (quesito específico)', T('indigenas'), 'int', null],
    ['População quilombola', T('quilombolas'), 'int', null],
    ['Em favelas e comunidades urbanas', T('fcu_pop'), 'int', pc(T('fcu_pop'),T('pop'))],
    ['Domicílios com esgoto adequado', T('esg_adequado'), 'int', pc(T('esg_adequado'),dp)],
    ['Domicílios com água de rede geral', T('agua_rede'), 'int', pc(T('agua_rede'),dp)],
    ['Domicílios com coleta de lixo', T('lixo_coletado'), 'int', pc(T('lixo_coletado'),dp)],
    ['Taxa de alfabetização (15+)', pc(T('alfab_15'),T('pop_15')), 'pct1', null]
  ];
  const sem=info.semBloco||0, morad=info.popSem||0;
  return linhas.map(([k,v,fm,pcv])=>`<div class="row"><div class="k">${esc(k)}</div>
    <div class="v"><span class="num">${fmtN(v,fm)}</span>
    <span class="u">${pcv!=null?fmtN(pcv,'pct1'):''}</span></div></div>`).join('')+
    `<p style="font-size:11px;color:var(--txt3);line-height:1.6;margin-top:9px">
      Somas dos setores censitários do Censo 2022${p?' de '+esc(p.nome):' dos sete municípios'}.
      ${sem?`O IBGE não publica os blocos de pessoas e domicílios de ${nf.format(sem)} setores
      (quartéis, unidades prisionais, alojamentos, conventos, hospitais e setores sem moradores)${morad?`, onde
      moram ${nf.format(morad)} pessoas. Por isso alguns denominadores ficam em ${nf.format(T('pop')-morad)},
      e não em ${nf.format(T('pop'))}`:''}.`:'O IBGE publica os blocos de pessoas e domicílios de todos os setores.'}</p>`;
}
function coberturaHTML(){
  const t=IND.length, ok=IND.filter(i=>i.status==='ok').length,
    ext=IND.filter(i=>i.status==='ext').length, imp=IND.filter(i=>i.status==='imp').length,
    mun=IND.filter(i=>i.status==='mun').length, est=IND.filter(i=>i.status==='est').length;
  const seg=[[ok,'var(--ok)','oficial, Censo 2022 e fontes recentes'],[est,'var(--est)','histórico, Censo 2010'],
    [mun,'var(--mun)','só Porto Alegre (IBGE Cidades)'],[imp,'var(--imp)','arquivo do usuário'],
    [ext,'var(--sim)','não oficial']].filter(x=>x[0]>0);
  return `<div style="display:flex;height:9px;border-radius:5px;overflow:hidden;margin-bottom:9px">
    ${seg.map(([n,c])=>`<div style="width:${100*n/t}%;background:${c}"></div>`).join('')}</div>
    ${seg.map(([n,c,l])=>`<div class="row" style="padding:4px 0"><div class="k">
      <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${c};
      margin-right:6px"></span>${esc(l)}</div>
      <div class="v"><span class="num">${n}</span></div></div>`).join('')}
    <p style="font-size:11px;color:var(--txt3);margin-top:9px;line-height:1.55">
      ${t} indicadores com fonte, ano e nível geográfico explícitos — ver <b>Cobertura</b> no topo.</p>`;
}

/* Série 1991-2000-2010 do Atlas Brasil para o município: quatro gráficos pequenos,
   um por indicador, cada um na própria escala (nunca dois eixos no mesmo gráfico). */
const SERIES_ADH=[['IDHM','idhm','dec3'],['Renda per capita, R$ de ago/2010','renda_pc','brl0'],
  ['Pessoas pobres','prop_pobreza','pct1'],['Mortalidade infantil, por mil','mortalidade_1','dec1']];
function seriesMunicipioHTML(cod){
  if(!ADH_IPEA||!cod)return '';
  const V=ADH_IPEA.valores, anos=ADH_IPEA.anos;
  const graf=SERIES_ADH.map(([t,c,f])=>{const v=(V[c]||{})[cod]; if(!v)return '';
    const pts=anos.map((a,k)=>[a,v[k]]).filter(x=>x[1]!=null); return pts.length>1?serieMini(t,pts,f):'';}).join('');
  if(!graf)return '';
  return `<h3 class="sec">Evolução de 1991 a 2010 <span class="chip tag">Atlas Brasil</span></h3>
    <div class="series">${graf}</div>
    <p class="ref-note" style="margin-top:6px">Atlas do Desenvolvimento Humano no Brasil (PNUD, IPEA e FJP),
      Censos de 1991, 2000 e 2010. Renda e linha de pobreza (R$ 140) em reais de agosto de 2010 nos três anos.
      Não há IDHM oficial posterior a 2010.</p>`;
}
function serieMini(titulo,pts,fmt){
  const w=170,h=100,pad={l:30,r:30,t:20,b:18};
  const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
  const x0=Math.min(...xs),x1=Math.max(...xs), lo=Math.min(...ys),hi=Math.max(...ys);
  const m=(hi-lo)*.18||Math.abs(hi)*.05||1, y0=lo-m, y1=hi+m;
  const px=v=>pad.l+(v-x0)/((x1-x0)||1)*(w-pad.l-pad.r);
  const py=v=>h-pad.b-(v-y0)/((y1-y0)||1)*(h-pad.t-pad.b);
  const d=pts.map((p,i)=>(i?'L':'M')+px(p[0]).toFixed(1)+' '+py(p[1]).toFixed(1)).join(' ');
  return `<figure class="mini"><figcaption>${esc(titulo)}</figcaption>
    <svg class="chart" viewBox="0 0 ${w} ${h}" role="img"
      aria-label="${esc(titulo)}: ${esc(pts.map(p=>p[0]+', '+fmtN(p[1],fmt)).join('; '))}">
    <line x1="4" y1="${h-pad.b}" x2="${w-4}" y2="${h-pad.b}" stroke="var(--line2)"/>
    <path d="${d}" fill="none" stroke="${COR.cat[0]}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${pts.map(p=>`<g><title>${p[0]}: ${esc(fmtN(p[1],fmt))}</title>
      <circle cx="${px(p[0]).toFixed(1)}" cy="${py(p[1]).toFixed(1)}" r="4" fill="${COR.cat[0]}" stroke="var(--bg2)" stroke-width="2"/>
      <text x="${px(p[0]).toFixed(1)}" y="${(py(p[1])-8).toFixed(1)}" text-anchor="middle" class="val">${esc(fmtN(p[1],fmt))}</text>
      <text x="${px(p[0]).toFixed(1)}" y="${h-4}" text-anchor="middle">${p[0]}</text></g>`).join('')}
  </svg></figure>`;
}

function distribuicaoHTML(){
  const i=indAtual(), g=geoDoNivel();
  if(!g||i.status==='pend'||i.status==='mun')return '';
  const arr=g.features.map(f=>({id:f.properties.id,n:f.properties.nome,v:valor(f.properties)}))
    .filter(o=>o.v!=null).sort((a,b)=>b.v-a.v);
  if(!arr.length)return '';
  const top=arr.slice(0,8), bot=arr.slice(-5).reverse(), mx=top[0].v;
  const barra=o=>`<div class="row" style="padding:5px 0;cursor:pointer" data-goto="${esc(o.id)}">
      <div class="k" style="flex:1">
        <div style="display:flex;justify-content:space-between;gap:9px;margin-bottom:3px">
          <span>${esc(o.n)}</span><span class="num" style="color:var(--txt)">${fmtN(o.v,i.fmt)}</span></div>
        <div class="trilho">
          <div style="height:100%;width:${Math.max(1,100*o.v/mx)}%;background:${corDe(o.v,S._brk||[],S._ramp||i.ramp)}"></div>
        </div></div></div>`;
  const soma=arr.reduce((a,o)=>a+o.v,0), med=arr[Math.floor(arr.length/2)].v;
  return `<h3 class="sec">Distribuição — ${esc(i.n)}</h3>
    <div class="row"><div class="k">Mediana entre ${NIVEIS[S.nivel].plural}</div>
      <div class="v"><span class="num">${fmtN(med,i.fmt)}</span><span class="u">${esc(unid(i))}</span></div></div>
    <div class="row"><div class="k">Amplitude (máx ÷ mín)</div>
      <div class="v"><span class="num">${arr[arr.length-1].v?fmtN(arr[0].v/arr[arr.length-1].v,'dec1')+'×':'—'}</span></div></div>
    ${/pessoas|domic|vínculos/.test(i.u)?`<div class="row"><div class="k">Soma</div>
      <div class="v"><span class="num">${fmtN(soma,'int')}</span><span class="u">${esc(unid(i))}</span></div></div>`:''}
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
  S.sel=id; S.bolsao=null; marcaSelecao(); renderPainel();
  if(window.innerWidth<=960)$('#panel').classList.add('open');
  try{ enquadraTerritorio(L.geoJSON(f.geometry).getBounds()); }catch(e){}
}
/* Área do mapa que não fica sob o cartão do indicador nem, no celular, sob o
   painel. Se o território já está inteiro nela, o mapa não se mexe: antes cada
   clique dava zoom, e o próximo bairro saía de baixo do cursor. */
function areaLivre(){
  const c=map.getSize(), prov=$('#prov'), pan=$('#panel');
  const top=(prov&&prov.offsetParent?prov.offsetTop+prov.offsetHeight:0)+12;
  const bottom=(window.innerWidth<=960&&pan&&pan.classList.contains('open'))?pan.offsetHeight+12:24;
  return {x0:24,y0:top,x1:c.x-24,y1:c.y-bottom};
}
function enquadraTerritorio(b,forca){
  const A=areaLivre();
  const p0=map.latLngToContainerPoint(b.getNorthWest()), p1=map.latLngToContainerPoint(b.getSouthEast());
  const cabe=p0.x>=A.x0&&p0.y>=A.y0&&p1.x<=A.x1&&p1.y<=A.y1, visivel=(p1.x-p0.x)>24||(p1.y-p0.y)>24;
  if(cabe&&visivel&&!forca)return;
  const c=map.getSize();
  map.fitBounds(b,{paddingTopLeft:[A.x0,A.y0],paddingBottomRight:[c.x-A.x1,c.y-A.y1],maxZoom:15});
}

/* ───── clique e realce quando outra camada está por cima do coropleto ─────
   Escolas, saúde e favelas são desenhadas em <canvas>. O canvas cobre o mapa
   inteiro e recebe todo clique: com qualquer uma dessas camadas ligada,
   nenhum bairro era clicável. O Leaflet repassa ao mapa o que não acerta um
   ponto do canvas; aqui o mapa acha o território sob o cursor. */
function bboxFeicao(f){
  if(!f._bb){const b=L.geoJSON(f.geometry).getBounds();
    f._bb=[b.getWest(),b.getSouth(),b.getEast(),b.getNorth()];}
  return f._bb;
}
function dentroDoPoligono(x,y,polys){
  for(const poly of polys){
    let d=false;
    for(const r of poly)for(let i=0,j=r.length-1;i<r.length;j=i++){
      const xi=r[i][0],yi=r[i][1],xj=r[j][0],yj=r[j][1];
      if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)d=!d;
    }
    if(d)return true;
  }
  return false;
}
function territorioEm(ll){
  const g=S._g; if(!g||!camada)return null;
  const x=ll.lng,y=ll.lat;
  for(const f of g.features){
    const b=bboxFeicao(f); if(x<b[0]||x>b[2]||y<b[1]||y>b[3])continue;
    const geo=f.geometry, polys=geo.type==='Polygon'?[geo.coordinates]:geo.coordinates;
    if(dentroDoPoligono(x,y,polys))return f;
  }
  return null;
}
let ttReserva=null, hoverReserva=null, quadroHover=0;
function limpaHoverReserva(){
  if(hoverReserva&&camada&&S.nivel!=='setor'&&!estaDestacada(hoverReserva)&&camada.hasLayer(hoverReserva))camada.resetStyle(hoverReserva);
  hoverReserva=null;
  if(ttReserva&&map.hasLayer(ttReserva))map.closeTooltip(ttReserva);
}
function ligaCliqueDoMapa(){
  map.on('click',e=>{
    /* com a camada de bolsões ligada, o clique dentro de um bolsão abre a ficha
       dele, qualquer que seja a ordem das camadas de canvas */
    const k=bolsaoEm(e.latlng);
    if(k!=null){abreBolsao(k);return;}
    const f=territorioEm(e.latlng);
    if(f)selecionar(f.properties.id);
  });
  /* realce e tooltip do território quando o cursor está sobre um canvas vazio */
  map.on('mousemove',e=>{
    if(quadroHover)return;
    quadroHover=requestAnimationFrame(()=>{
      quadroHover=0;
      if(sobreCamada){limpaHoverReserva();return;}
      const f=territorioEm(e.latlng), l=f&&camadaPorId&&camadaPorId.get(f.properties.id);
      if(l!==hoverReserva){
        limpaHoverReserva();
        if(l&&S.nivel!=='setor'&&!estaDestacada(l)){l.setStyle({weight:2.4,color:COR.tinta,opacity:1});l.bringToFront&&l.bringToFront();}
        hoverReserva=l||null;
      }
      if(f){
        if(!ttReserva)ttReserva=L.tooltip({className:'tt',direction:'top',offset:[0,-8]});
        ttReserva.setLatLng(e.latlng).setContent(tooltipHTML(f.properties));
        if(!map.hasLayer(ttReserva))ttReserva.addTo(map);
      }
    });
  });
  map.on('mouseout',limpaHoverReserva);
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
/* A fonte cobre este município neste nível? (ex.: o geoclimate só cobre POA).
   Indicador que a fonte não cobre não é "faltante": nem aparece no perfil. */
const COBRE={};
function cobre(nivel,muni,id){
  const k=nivel+'|'+muni+'|'+id;
  if(!(k in COBRE)){const g=S.geo[nivel];
    COBRE[k]=!!g&&g.features.some(f=>f.properties.muni===muni&&f.properties[id]!=null);}
  return COBRE[k];
}
/* Territórios que contêm este: setor → bairro → município. Onde falta um valor,
   o perfil mostra o do território que o contém, com o nome dele no rótulo. */
function continentes(p){
  const out=[];
  if(S.nivel==='setor'&&p.bairro&&S.geo.bairro){
    const b=S.geo.bairro.features.find(x=>x.properties.muni===p.muni&&x.properties.nome===p.bairro);
    if(b)out.push({p:b.properties,rot:'do bairro '+b.properties.nome});
  }
  if(S.nivel!=='municipio'&&S.geo.municipio){
    const m=S.geo.municipio.features.find(x=>x.properties.nome===p.muni);
    if(m)out.push({p:m.properties,rot:'de '+p.muni});
  }
  return out;
}
function perfilHTML(id){
  const f=feature(id); if(!f)return aberturaHTML();
  const p=f.properties, isSetor=S.nivel==='setor';
  const pctMun=p.pop_pct_mun??null;

  let html=`<div class="terr-h">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
      <button class="btn" id="btnVoltar" style="padding:3px 8px;font-size:11px">← Visão geral</button>
      <span class="eyebrow">${isSetor?'Setor censitário':'Bairro'}</span></div>
    <h2>${esc(p.nome)}</h2>
    <div class="sub">
      ${isSetor?`<span class="chip acc">${esc(p.bairro||p.muni||'')}</span><span class="chip mono">${esc(p.id)}</span>`
        :`<span class="chip acc">${fmtN(pctMun,'pct2')} de ${esc(p.muni||'—')}</span>`}
      ${p.area_km2!=null?`<span class="chip">${fmtN(+p.area_km2,'dec2')} km²</span>`:''}
    </div>
    <div class="btn-row">
      <button class="btn pri" id="btnAddCmp">Comparar com outro território</button>
    </div></div>`;

  if(isSetor&&!p.pop){
    const c=continentes(p)[0];
    html+=`<div class="note">${p.pop===0
        ?'O Censo 2022 não registrou moradores neste setor.'
        :'O IBGE não publica os dados de pessoas deste setor: é um setor especial (quartel, hospital, alojamento) ou está sob sigilo.'}
      Onde falta o dado do setor, a linha mostra o valor ${c?esc(c.rot):'do município'} e traz essa indicação.</div>`;
  }
  BLOCOS.forEach(b=>{
    const inds=IND.filter(i=>b.cats.includes(i.cat)&&i.niveis.includes(S.nivel));
    if(!inds.length)return;
    const disp=inds.filter(i=>i.status!=='pend'&&p[i.id]!=null);
    /* faltantes que a fonte cobre neste município: recebem o valor do continente */
    const falt=inds.filter(i=>!disp.includes(i)&&i.status!=='pend'&&cobre(S.nivel,p.muni,i.id));
    if(!disp.length&&!falt.length)return;
    html+=`<h3 class="sec">${esc(b.t)}<span class="chip tag">${disp.length+falt.length}</span></h3>`;
    if(disp.length){
      html+=disp.map(i=>{
        const om=p._omit&&p._omit[i.id];
        return `<div class="row"><div class="k">${esc(i.n)}${selo(i,S.nivel)}
          ${om?`<div style="font-size:10px;color:var(--pend);margin-top:2px">
            soma parcial — IBGE omitiu ${om} setor${om>1?'es':''}</div>`:''}</div>
        <div class="v"><span class="num">${fmtN(+p[i.id],i.fmt)}</span>
        <span class="u">${esc(unid(i))}</span></div></div>`;}).join('');
    }
    if(b.t==='Perfil populacional')html+=piramideHTML(p);
    if(b.t==='Perfil racial')html+=racaHTML(p);
    if(falt.length){
      const cont=continentes(p), aqui=isSetor?'este setor':S.nivel==='bairro'?'este bairro':'este município';
      html+=falt.map(i=>{
        let ref=null; for(const c of cont){if(c.p[i.id]!=null){ref=c;break;}}
        return ref
          ?`<div class="row ref"><div class="k">${esc(i.n)}${selo(i,S.nivel)}
              <span class="ref-note">IBGE não publica para ${aqui} · valor ${esc(ref.rot)}</span></div>
            <div class="v"><span class="num">${fmtN(+ref.p[i.id],i.fmt)}</span>
            <span class="u">${esc(unid(i))}</span></div></div>`
          :`<div class="row ref"><div class="k">${esc(i.n)}${selo(i,S.nivel)}
              <span class="ref-note">IBGE não publica para ${aqui} nem para o território que o contém</span></div>
            <div class="v"><span class="num">—</span></div></div>`;
      }).join('');
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
      :p.muni==='Porto Alegre'?'malha de bairros da SMUrb/PMPA, Lei Municipal nº 12.112/2016'
      :/sem divisão de bairros/i.test(p.nome||'')?'o município inteiro: o IBGE não divide este município em bairros'
      :'bairros do IBGE no Censo 2022, formados pelos setores com o mesmo nome de bairro'}.
      Geometria generalizada para uso em tela; áreas e cálculos usam os valores originais.</p>`;
  return html;
}
const FAIXAS_ID=['0-4','5-9','10-14','15-19','20-24','25-29','30-39','40-49','50-59','60-69','70+'];

/* pirâmide etária — bairros têm sexo × idade; setores, só idade */
function piramideHTML(p,deOnde){
  const temPir=Array.isArray(p._pir)&&p._pir.some(v=>v>0);
  const idade=FAIXAS_ID.map((_,i)=>p['id'+i]);
  if(!temPir&&idade.every(v=>v==null)){
    /* bloco não publicado: mostra o do território que contém, com o nome dele */
    for(const c of continentes(p)){
      const ok=(Array.isArray(c.p._pir)&&c.p._pir.some(v=>v>0))||FAIXAS_ID.some((_,i)=>c.p['id'+i]!=null);
      if(ok)return piramideHTML(c.p,c.rot);
    }
    return '';
  }
  const w=340,h=190,pad={l:34,r:6,t:14,b:16},bh=(h-pad.t-pad.b)/11-2;
  const meio=(w-pad.l-pad.r)/2+pad.l;
  const H=temPir?p._pir.slice(0,11):idade.map(()=>0);
  const M=temPir?p._pir.slice(11):idade;
  const mx=Math.max(...H,...M,1), kx=(w-pad.l-pad.r)/2/mx;
  const barras=FAIXAS_ID.map((f,i)=>{
    const y=pad.t+(11-1-i)*(bh+2);
    const wh=(H[i]||0)*kx, wm=(M[i]||0)*kx;
    return `<rect x="${meio-wh}" y="${y}" width="${wh}" height="${bh}" fill="${COR.cat[0]}" rx="2">
        <title>Homens ${f}: ${nf.format(H[i]||0)}</title></rect>
      <rect x="${meio}" y="${y}" width="${wm}" height="${bh}" fill="${temPir?COR.cat[1]:COR.cat[0]}" rx="2">
        <title>${temPir?'Mulheres':'Pessoas'} ${f}: ${nf.format(M[i]||0)}</title></rect>
      <text x="0" y="${y+bh-1}" class="lbl">${f}</text>`;
  }).join('');
  return `<div style="margin-top:9px">
    <div style="display:flex;justify-content:space-between;align-items:baseline">
      <span class="eyebrow">${temPir?'Pirâmide etária':'Distribuição por idade'}${deOnde?' '+esc(deOnde):''}</span>
      ${temPir?`<span class="leg-mini"><i style="background:${COR.cat[0]}"></i>homens
        <i style="background:${COR.cat[1]}"></i>mulheres</span>`:''}
    </div>
    <svg class="chart" viewBox="0 0 ${w} ${h}" style="margin-top:5px">
      ${barras}<line x1="${meio}" y1="${pad.t-3}" x2="${meio}" y2="${h-pad.b}" stroke="var(--line2)"/>
    </svg>
    <div class="selo s-ok"><i class="dot"></i>Censo/IBGE · 2022${temPir?'':' · sem recorte por sexo neste nível'}</div>
  </div>`;
}

/* composição por cor ou raça */
/* Paleta categórica da skill de visualização, em ordem fixa: a cor segue o grupo,
   nunca a posição. Antes eram tons de pele, uma codificação que não se usa. */
const CORES_RACA={raca_branca:['Branca',COR.cat[0]],raca_preta:['Preta',COR.cat[1]],
  raca_parda:['Parda',COR.cat[2]],raca_amarela:['Amarela',COR.cat[3]],
  raca_indigena:['Indígena',COR.cat[4]]};
function racaHTML(p,deOnde){
  const ks=Object.keys(CORES_RACA), tot=p._raca_total;
  if(!tot){
    for(const c of continentes(p))if(c.p._raca_total)return racaHTML(c.p,c.rot);
    return '';
  }
  /* ordem fixa (a validada para vizinhos), não por tamanho */
  const seg=ks.map(k=>({k,n:CORES_RACA[k][0],c:CORES_RACA[k][1],v:p[k]||0})).filter(o=>o.v>0);
  const om=p._omit&&(p._omit.raca_branca||p._omit.raca_indigena||p._omit.raca_amarela);
  return `<div style="margin-top:9px"><span class="eyebrow">Composição por cor ou raça${deOnde?' '+esc(deOnde):''}</span>
    <div class="empilhada">
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
  /* a malha das regiões do OP não está no pacote: coluna sem nenhum dado, fica de fora */
  const nv=['municipio','bairro','setor'];
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
 ['Participação na população do município','%','população do bairro ÷ população do município do bairro × 100','Censo 2022','ok'],
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

  <h3 class="sec">O que quer dizer “Cálculo do Atlas”</h3>
  <p style="font-size:12px;color:var(--txt2);line-height:1.7">
    O selo <b>Cálculo do Atlas · 2022</b> quer dizer que o número não aparece pronto em nenhuma
    publicação: o Atlas o calculou a partir de contagens oficiais, por uma fórmula descrita nesta
    página. <b>O ano é o dos dados de origem, não o do cálculo</b>: “2022” significa que as contagens
    vêm do Censo 2022; “${ANO.pib}”, do PIB dos Municípios daquele ano.</p>
  <ul style="font-size:12px;color:var(--txt2);line-height:1.7;margin:6px 0 10px 18px">
    <li><b>Os insumos são oficiais</b> e estão no próprio Atlas: contagens por setor do Censo 2022,
      PIB do IBGE, estabelecimentos do CNES.</li>
    <li><b>Primeiro soma, depois divide.</b> No bairro, no município, na região e no entorno das lojas,
      o Atlas soma as contagens dos setores e só então calcula a taxa. Nunca faz média de percentuais.</li>
    <li><b>A fórmula de cada um</b> está na tabela “Fórmulas, uma a uma”, abaixo, e na ficha do indicador.</li>
  </ul>
  <p style="font-size:12px;color:var(--txt2);line-height:1.7">
    Por isso esses indicadores levam o selo verde: o dado de origem é oficial e a conta é direta e
    reproduzível. Podem diferir de um número publicado pelo IBGE quando o denominador é outro. Por
    exemplo, os percentuais de cor ou raça usam só as respostas declaradas. São estes:</p>
  ${(()=>{const c=IND.filter(i=>i.fonte==='ATLAS_CALC'&&i.status!=='pend'), anos=[...new Set(c.map(i=>i.ano))].sort();
    /* de onde vêm os dados de cada linha, pelo tipo de indicador (os anos mudam com as fontes ao vivo) */
    const de=a=>{const ids=c.filter(i=>i.ano===a).map(i=>i.id);
      const todos=re=>ids.every(id=>re.test(id));
      if(todos(/^(pib|pct_vab)/))return 'PIB dos Municípios (IBGE)';
      if(todos(/^(fin_|gasto_)|_hab$/))return 'Finanças municipais (DCA/SICONFI)';
      if(todos(/_100mil$/))return 'Ocorrências da SSP/RS';
      if(todos(/_10mil$/))return 'Estabelecimentos do CNES';
      return a===2022?'Censo 2022, contagens por setor':'';};
    return `<table class="tb"><thead><tr><th style="width:16%">Ano dos dados</th><th>Indicadores</th></tr></thead><tbody>
      ${anos.map(a=>`<tr><td><b>${a}</b><div style="color:var(--txt3);font-size:11px">${esc(de(a))}</div></td>
        <td>${c.filter(i=>i.ano===a).map(i=>esc(i.n)).join(' · ')}</td></tr>`).join('')}</tbody></table>
      <p style="font-size:11.5px;color:var(--txt3);line-height:1.6;margin-top:6px">Nas taxas por habitante,
        a população usada como denominador está na ficha de cada indicador.</p>`;})()}

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

  ${AOP?`<h3 class="sec">Acesso a oportunidades (IPEA, 2019)</h3>
  <p style="font-size:12px;color:var(--txt2);line-height:1.7">
    O projeto Acesso a Oportunidades, do IPEA, calcula por hexágono quanto tempo se leva a pé, de
    bicicleta e de transporte público até empregos, estabelecimentos de saúde e escolas, com dados de
    2019. Entre as sete cidades, só Porto Alegre está no projeto. O Atlas usa a tabela publicada no
    espelho da Base dos Dados.</p>
  <ul style="font-size:12px;color:var(--txt2);line-height:1.7;margin:6px 0 10px 18px">
    <li><b>Do hexágono ao território.</b> Cada setor de 2022 recebe o valor do hexágono que contém o seu
      ponto representativo; o bairro, a média dos setores ponderada pela população. É o mesmo método dos
      indicadores de 2010.</li>
    <li><b>Correção da unidade.</b> Na tabela da Base dos Dados, o tempo mínimo vem multiplicado por 100.
      Dividido por 100, ele concorda com os indicadores cumulativos em ${nf.format(AOP.conferencia.tmi_coerentes_div100)}
      de ${nf.format(AOP.conferencia.tmi_testes)} testes; sem a divisão, só em ${nf.format(AOP.conferencia.tmi_coerentes_sem_divisao)}.
      O teste: quem alcança um estabelecimento em 15 minutos tem de ter tempo mínimo de até 15.</li>
    <li><b>Cobertura.</b> A grade de 2019 não alcança ${nf.format(AOP.conferencia.setores_fora_da_grade)} setores, com
      ${nf.format(AOP.conferencia.pop_fora_da_grade)} moradores, quase todos na periferia (extremo sul, zona leste e ilhas).
      Eles ficam sem valor, e o bairro só tem valor quando os setores cobertos somam ao menos metade
      da sua população.</li>
    <li><b>“Sem estabelecimento no limite”.</b> Onde o IPEA não acha nenhum estabelecimento no tempo máximo
      de cálculo, o tempo não entra em média; entra na parte da população a mais de 30 minutos.</li>
  </ul>`:''}

  <h3 class="sec">Extrações que vêm no pacote</h3>
  <p style="font-size:12px;color:var(--txt2);line-height:1.7">
    Parte do que antes só entrava rodando um script ou a central de extração agora vem pronta, dentro do arquivo do Atlas.
    Os dados vêm do Censo do IBGE, nos arquivos que o IPEA publica para o pacote censobr.</p>
  <ul style="font-size:12px;color:var(--txt2);line-height:1.7;margin:6px 0 10px 18px">
    <li><b>Censo 2022 por setor</b> (dados/dados-censo2022.js, gerado por extracao/9_censo2022_setores.py):
      ${C22?`casa de vila ou em condomínio, cortiço, estrutura degradada, domicílios particulares e coletivos, banheiro de uso comum,
      só sanitário, água que não chega encanada, óbitos por sexo e o entorno dos domicílios (pavimentação, iluminação, calçada,
      rampa, árvores, bueiro, ponto de ônibus, ciclovia). Antes de gravar, o script confere os ${nf.format(C22.conferencia.setores)}
      setores com o que o Atlas já tinha: ${C22.conferencia.campos_iguais_ao_pacote.length} campos iguais em todos.
      Onde o IBGE omitiu o valor de um setor (sigilo), o bairro e o município mostram a soma parcial e quantos setores ficaram de fora.`
      :'o arquivo não está neste pacote.'}</li>
    <li><b>Censo 2010, amostra</b> (dados/dados-extracoes.js, gerado por extracao/10_censo2010_amostra.py):
      ${XT_APLICADOS.get('censo2010_amostra')?'os 12 indicadores do cartão “Censo 2010” da central, por município, e a conferência da renda de 2010 (abaixo).'
        :'o arquivo não está neste pacote.'} O resultado é o mesmo que a central dá com os arquivos do IBGE; ela mostra o item como “no pacote do Atlas”.</li>
    <li><b>IDHM de 2000</b> nos sete municípios, da série do Atlas Brasil que o Atlas já tinha: o valor de Porto Alegre é o mesmo do IBGE Cidades.</li>
    <li><b>Correções:</b> “Percentual de casas” passou a contar a casa de vila ou em condomínio, e “Percentual sem banheiro de uso exclusivo”
      passou a contar o banheiro de uso comum e o só sanitário. Na versão 3.7 os dois saíam menores, porque esses componentes não estavam no pacote.</li>
    <li><b>Continuam de fora</b>, porque a fonte não abre no ambiente em que o pacote é montado: a despesa em educação (SICONFI, que o Atlas
      busca ao vivo, no navegador), o IFDM, o IDESE e o IVS (planilhas), o Bolsa Família e as mortes por causa do DATASUS (Ipeadata),
      o OpenStreetMap, as equipes do CNES e as matrículas do INEP. Entram pela central de extração ou pelos scripts.</li>
  </ul>
  ${(()=>{const c=XT_APLICADOS.get('censo2010_amostra'); return c&&c.e3?xtE3HTML(c,'metodo'):'';})()}

  <h3 class="sec">Séries complementares e Ipeadata</h3>
  <p style="font-size:12px;color:var(--txt2);line-height:1.7">
    O Ipeadata, do IPEA, reúne numa API pública séries de várias fontes (IBGE, Ministério da Saúde, Tesouro,
    Ministério do Trabalho, Atlas Brasil e outras). A varredura dessas bases procurou o que tem valor para os
    sete municípios e ainda não estava no Atlas. Entrou por dois caminhos:</p>
  <ul style="font-size:12px;color:var(--txt2);line-height:1.7;margin:6px 0 10px 18px">
    <li><b>Séries complementares</b> (dados/dados-series.js, gerado por extracao/8_series_complementares.py a partir do
      espelho público da Base dos Dados):
      ${SCOMP?`${nf.format(SCOMP.series.length)} séries de ${listaPt([...new Set(SCOMP.series.map(x=>(FONTES[x.fonte]||{}).s||x.fonte))])}`
        :'o arquivo não está neste pacote'}. Cada uma está na sua categoria (saúde, saneamento, educação, trabalho, renda, demografia).</li>
    <li><b>Ipeadata</b> (dados/dados-ipeadata.js, gerado por extracao/7_ipeadata.py, ou pelo cartão <b>Séries municipais
      do Ipeadata</b> em <b>Mais → Extrair dados</b>, que faz a mesma varredura pelo próprio navegador quando o servidor
      do Ipeadata permite):
      ${IPD_SERIES.length?`${nf.format(IPD_SERIES.length)} séries na categoria <b>Ipeadata (IPEA)</b>, de
        ${esc(IPD.gerado_em.split('-').reverse().join('/'))}.`:'o arquivo deste pacote ainda não tem séries.'}
      ${(()=>{const x=XT_APLICADOS.get('ipeadata_navegador'); const n=x?(x.indicadores||[]).length:0;
        return n?` Trazidas pelo navegador: ${nf.format(n)} série${n===1?'':'s'}.`:'';})()}</li>
  </ul>
  <ul style="font-size:12px;color:var(--txt2);line-height:1.7;margin:6px 0 10px 18px">
    <li><b>Um ano no mapa.</b> Cada série aparece no ano mais recente em que os sete municípios têm valor.
      Série sem esse ano fica de fora, em vez de comparar municípios de anos diferentes. Os outros anos estão
      na tabela do painel e no CSV.</li>
    <li><b>Sem conversão.</b> Os valores vão como a fonte publica, com a unidade e o multiplicador da série
      (por exemplo, “mil”). A exceção são os índices da ANA, publicados de 0 a 1 e mostrados em %. Ano sem
      valor fica vazio; nada é completado.</li>
    <li><b>Ficam de fora</b> as séries com mais de um valor por ano (mensais, trimestrais), as não numéricas e
      as que trazem a mesma data com dois valores. O 7_ipeadata.py lista cada uma, com o motivo, em
      extracao/fontes/ipeadata/inventario.csv.</li>
    <li><b>Fonte original.</b> O selo de cada indicador mostra a fonte de origem. Quando o Atlas já tem o mesmo
      dado lido direto na fonte, vale o da fonte.</li>
    <li><b>O que o Atlas já tem.</b> Na varredura pelo navegador, a série com os mesmos valores de um indicador do
      Atlas nos sete municípios, num ano em comum, aparece como “já no Atlas”. As sugeridas são as que o Atlas
      não tem por outra fonte: Bolsa Família, homicídios, suicídios e mortes no trânsito do DATASUS e o IFDM.</li>
  </ul>

  <h3 class="sec">Áreas de risco (2010)</h3>
  <p style="font-size:12px;color:var(--txt2);line-height:1.7">
    A camada vem da <b>BATER</b>, a Base Territorial Estatística de Áreas de Risco do IBGE e do CEMADEN,
    do estudo <i>População em áreas de risco no Brasil</i>. As áreas de risco de deslizamento, inundação
    e enxurrada dos municípios monitorados pelo CEMADEN foram ajustadas pelo IBGE à malha do Censo 2010,
    por setor censitário ou por face de quadra, para contar quem morava nelas.</p>
  <ul style="font-size:12px;color:var(--txt2);line-height:1.7;margin:6px 0 10px 18px">
    <li><b>No Atlas:</b> ${nf.format(AREAS_RISCO.length)} áreas, ${(()=>{const c={};AREAS_RISCO.forEach(a=>{const k=MUNIS_LISTA?MUNIS_LISTA.ids.indexOf(+a.muni):-1;const n=k>=0?MUNIS_LISTA.nomes[k]:a.muni;c[n]=(c[n]||0)+1;});return Object.entries(c).map(([n,v])=>`${v} em ${esc(n)}`).join(' e ');})()}.
      Os outros municípios não têm área na BATER.</li>
    <li><b>Cada área traz</b> o código, o recorte usado (setor ou face de quadra) e o grau de ajuste ao
      recorte, de ótimo a regular.</li>
    <li><b>O que ela não é:</b> não é a setorização de risco atual do Serviço Geológico do Brasil e não
      inclui a enchente de 2024. A ausência de polígono não quer dizer ausência de risco. O Atlas
      desenha as áreas; não calcula a população de 2022 dentro delas.</li>
  </ul>

  <h3 class="sec">Bolsões do quintil mais pobre</h3>
  ${(()=>{const Q=quintisSetores(), B=calculaBolsoes(), pop=B.reduce((a,b)=>a+b.pop,0);
  return `<p style="font-size:12px;color:var(--txt2);line-height:1.7">
    Os bolsões mostram onde se concentra a população de menor renda perto das unidades Renner, o recorte
    territorial da análise do entorno. São ${nf.format(B.length)} bolsões, com ${nf.format(pop)} moradores.</p>
  <ul style="font-size:12px;color:var(--txt2);line-height:1.7;margin:6px 0 10px 18px">
    <li><b>Quintis de renda.</b> Os ${nf.format(Q.com.length)} setores dos sete municípios com renda publicada são
      ordenados pelo rendimento médio do responsável (Censo 2022) e divididos em cinco grupos com a mesma
      população. O quintil mais pobre vai até ${fmtN(Q.lim[0],'brl0')} por mês.</li>
    <li><b>Bolsão.</b> Setores do quintil mais pobre a até 5 km, em linha reta, de uma unidade Renner,
      agrupados quando o centro de um setor fica a até 600 m do centro de outro do grupo.</li>
    <li><b>Ficha do bolsão.</b> Moradores, domicílios, crianças e jovens somados dos setores; renda média
      do responsável ponderada pelo número de responsáveis; desocupação e escolaridade de 2010 como
      referência histórica; acesso a oportunidades do IPEA, só nos setores de Porto Alegre.</li>
    <li><b>Limites.</b> O rendimento do responsável não é renda domiciliar per capita. O setor entra
      inteiro: a parte pobre de um setor de renda média não aparece. Os 5 km e os 600 m são parâmetros
      da análise, não definições oficiais.</li>
  </ul>`;})()}

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
    Para proteger o sigilo estatístico o IBGE omite células com poucos casos. Nos sete municípios,
    ${(()=>{const c=Object.values(contaSetores());return `${nf.format(c.reduce((a,o)=>a+o.semBloco,0))} setores não têm os blocos de pessoas e domicílios publicados, com ${nf.format(c.reduce((a,o)=>a+o.popSem,0))} moradores`;})()}.
    Em Porto Alegre, isso aparece de duas formas. Primeiro, <b>49 setores especiais</b> — quartel, unidade prisional,
    alojamento, convento, hospital — não têm os blocos de pessoas e domicílios publicados: são
    2.791 moradores que entram na população total mas não nos recortes por sexo, idade ou cor.
    Segundo, células isoladas somem em setores pequenos: a cor indígena é omitida em 764 dos 2.744
    setores da capital, e por isso a soma por bairro (1.757) fica abaixo do total do bloco
    Indígenas (2.004). <b>Nada é imputado.</b> Onde a célula falta, o valor aparece como ausente e
    a soma por bairro exibe o aviso “soma parcial — IBGE omitiu N setores”.</p>

  <h3 class="sec">Duas medidas de área, dois produtores</h3>
  <p style="font-size:12px;color:var(--txt2);line-height:1.7">
    Em Porto Alegre, a área dos bairros vem do polígono da malha SMUrb e os 94 bairros somam <b>472,81 km²</b>.
    A área dos setores vem do IBGE e soma <b>495,39 km²</b>. A área municipal publicada pelo IBGE
    é <b>496,83 km²</b>. A diferença é a lâmina d’água dentro do limite municipal que a malha de
    bairros não recobre. Por isso o indicador se chama “área do polígono”, e não “área territorial
    oficial”, e as duas medidas nunca são somadas entre si.</p>

  <h3 class="sec">Código de extração</h3>
  <p style="font-size:12px;color:var(--txt2);line-height:1.7">
    Parte da atualização roda no próprio navegador: em <b>Mais → Dados e fontes</b>, o Atlas busca e
    confere as fontes que permitem leitura direta, e em <b>Mais → Extrair dados</b> qualquer pessoa
    traz dados novos sem instalar programa (OpenStreetMap, tabelas do IBGE e arquivos baixados do
    INEP, do IBGE, do CNES ou de outra fonte nacional). O resto está nos scripts da pasta
    <b>extracao/</b>, que acompanham o pacote. Cada um traz no cabeçalho a fonte, as conferências e o que
    a saída não significa, e para com erro em vez de completar dado que falta. O passo a passo está em
    <b>docs/COMO-FAZER-AS-EXTRACOES.md</b>.</p>
  <pre style="background:var(--bg3);border:1px solid var(--line);border-radius:6px;padding:12px;
    font-family:var(--mono);font-size:10.5px;color:var(--txt2);line-height:1.8">extracao/
├── 1_servicos_municipais.py   finanças (SICONFI), segurança (SSP/RS), contagens de equipamentos
├── 2_atualiza_cnes.py         unidades de saúde (CNES, via geobr)
├── 3_atualiza_escolas.py      escolas (Censo Escolar, via geobr)
├── 4_indices_municipais.py    IDHM, IVS, IDESE e FIRJAN
├── 5_base_dos_dados.py        Atlas Brasil 2010, IDEB, Anatel e áreas de risco
├── 6_ipea.py                  Atlas Brasil 1991–2010 e Acesso a Oportunidades (IPEA)
├── 7_ipeadata.py              séries municipais do Ipeadata (API do IPEA)
├── 8_series_complementares.py vacinação, SNIS, ANA, Abrinq e mais Atlas Brasil (Base dos Dados)
├── 9_censo2022_setores.py     Censo 2022 por setor: domicílio, óbitos e entorno (censobr, IPEA)
├── 10_censo2010_amostra.py    Censo 2010, amostra: 12 indicadores e conferência da renda (censobr)
└── R/                         Censo 2010 por área de ponderação, Censo Escolar, equipes do
                               CNES, BigQuery e recorte de arquivos baixados</pre>
  <p style="font-size:11.5px;color:var(--txt3);line-height:1.6">A base censitária (agregados por setor
    de 2022 e amostra de 2010 por área de ponderação) foi montada na primeira versão do Atlas; os
    scripts daquela etapa não acompanham o pacote. Os scripts R 01 e 11 refazem a parte de 2010.</p>`;
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
      <p><b>479 unidades de saúde de atendimento</b>, <b>61 comunidades terapêuticas e
      residenciais</b> e <b>1.650 escolas em atividade</b>, com cobertura de Porto Alegre, Canoas,
      Gravataí, Sapucaia do Sul, Cachoeirinha, Guaíba e Esteio. As centrais de regulação ficam de
      fora; as 13 unidades em presídios e unidades socioeducativas aparecem no mapa, mas não entram
      nas contagens. As contagens por bairro são calculadas por ponto dentro do polígono.</p></div>

    <div class="src-card"><div class="hd"><b>Censo Demográfico 2022 — agregados por setor censitário</b>
      <span class="selo s-ok"><i class="dot"></i>Censo/IBGE · 2022</span></div>
      <p>Resultados do universo por setor censitário, nos blocos Básico, Pessoas, Domicílios,
      Óbitos, Indígenas, Quilombolas e Responsável/Renda. Cobrem os
      <b>4.722 setores</b> dos sete municípios e somam exatamente <b>2.383.002</b> pessoas; em cada
      município, a soma é idêntica ao total municipal publicado (Porto Alegre: 1.332.845). Daí saem sexo, faixas etárias, cor ou raça,
      alfabetização, rendimento do responsável, tipo e condição do domicílio, água, esgoto,
      lixo e óbitos.</p>
      <p style="margin-top:5px">O acesso foi feito pela distribuição do pacote
      <b>censobr</b>, do IPEA, que republica os arquivos do IBGE sem alterar valores.
      A fonte primária continua sendo o IBGE e é assim que o Atlas a identifica.</p>
      <a href="https://github.com/ipeaGIT/censobr" target="_blank" rel="noopener">censobr ↗</a></div>

    <div class="src-card"><div class="hd"><b>Omissão de células pelo IBGE</b>
      <span class="selo s-pend"><i class="dot"></i>controle de divulgação</span></div>
      <p>Para proteger o sigilo estatístico, o IBGE omite células com poucos casos. Isso aparece
      de duas formas no Atlas. Em Porto Alegre, por exemplo: primeiro, <b>49 setores especiais</b> — quartel, unidade prisional,
      alojamento, convento, hospital — não têm os blocos de pessoas e domicílios publicados;
      são 2.791 moradores que entram na população total mas não nos recortes por sexo, idade
      ou cor. Segundo, células isoladas somem em setores pequenos: a cor indígena, por exemplo,
      é omitida em 764 dos 2.744 setores, e por isso a soma por bairro (1.757) fica abaixo do
      total do bloco Indígenas (2.004).</p>
      <p style="margin-top:5px">O Atlas <b>não imputa nada</b>. Onde a célula falta o valor é
      exibido como ausente, e nas somas por bairro aparece o aviso
      <b>“soma parcial — IBGE omitiu N setores”</b>.</p></div>

    <div class="src-card"><div class="hd"><b>Malha de bairros</b>
      <span class="selo s-ok"><i class="dot"></i>SMUrb/PMPA · 2016 · IBGE · 2022</span></div>
      <p>Canoas, Guaíba e Esteio: bairros do IBGE no Censo 2022, formados pelos setores com o mesmo
      nome de bairro. Gravataí, Sapucaia do Sul e Cachoeirinha não têm divisão em bairros no IBGE e
      aparecem como um território só.</p>
      <p style="margin-top:5px">Porto Alegre: 94 bairros com limites da Lei Municipal nº 12.112, de 22/08/2016. Base aerofotogramétrica
      1:1.000, SIRGAS2000. Geometria generalizada para uso em tela; áreas e cálculos usam o valor
      original. A atribuição de cada setor ao seu bairro vem do próprio IBGE (campo NM_BAIRRO),
      e a população por bairro assim obtida coincide número a número com a série
      ObservaPOA/SMPAE do Censo 2022.</p>
      <a href="https://prefeitura.poa.br/smpg/observapoa/censo-2022" target="_blank" rel="noopener">ObservaPOA ↗</a></div>

    <div class="src-card"><div class="hd"><b>Malha de setores censitários</b>
      <span class="selo s-ok"><i class="dot"></i>IBGE · 2022</span></div>
      <p>4.722 setores censitários nos sete municípios (2.744 em Porto Alegre), todos com dados do
      Censo 2022 e vinculados ao bairro correspondente.</p></div>

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
      Para Porto Alegre, o Atlas também exibe o valor publicado pelo IBGE Cidades (2.690,50 hab/km²).</p></div>
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
      bairros reproduz exatamente o total de cada município.</p></div>
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
  $('#dadosBody').innerHTML=`<div class="note"><b>Mais dados, sem instalar nada.</b> Censo Escolar, Censo 2010,
      equipes do CNES, tabelas do IBGE, OpenStreetMap e qualquer arquivo nacional com código de município:
      <button class="btn" id="btnIrExtrair" style="margin-left:6px">Extrair dados</button></div>`+aoVivoHTML()+`
    <h3 class="sec">Carregar um arquivo seu</h3>
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
      <code>bairro</code>, <code>nome</code>, <code>municipio</code>, <code>cd_setor</code> ou
      <code>code_tract</code>); as demais colunas numéricas viram indicadores novos. Com código de
      setor, o arquivo vai para o nível setor; com <code>municipio</code>, para o nível município;
      nos outros casos, para o nível da tela. Colunas de código (<code>code_muni</code>,
      <code>id_municipio</code>…) e o <code>ano</code> não viram indicador, e o ano, se for um só,
      vira o ano do indicador. Uma linha por território: arquivo com território repetido é recusado.
      Assim os CSVs dos scripts de <code>extracao/R/</code> entram como saem. Nomes casam ignorando
      acentos e caixa. Números aceitam <code>987,40</code> e <code>1.234,50</code> tanto quanto
      <code>987.4</code>.</p>
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

  ligaAoVivoHTML();
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
  /* o código do setor vem antes do nome do município: os CSVs dos scripts R
     trazem os dois, e o setor é o nível mais fino */
  const cSet=col(/^(cd_setor|code_tract|cod_setor)$/);
  const cTerr=cSet>=0?cSet:col(/^(territorio|bairro|nome|setor|municipio|nome_municipio|nm_bairro)$/),
        cInd =col(/^(indicador|variavel)$/), cVal=col(/^(valor|value)$/),
        cCod =col(/^(codigo|cod|id)$/), cUn=col(/^(unidade|unit)$/),
        cFon =col(/^fonte$/), cAno=col(/^ano$/), cNiv=col(/^(nivel_geografico|nivel)$/);
  const rows=linhas.slice(1).map(corta);
  const longo = cInd>=0 && cVal>=0 && (cTerr>=0||cCod>=0);
  /* no formato largo sem nome, serve o código IBGE do município (6 ou 7 dígitos) */
  const cLargo = cTerr>=0 ? cTerr : cCod>=0 ? cCod : col(COLUNA_MUN);
  const r = longo
    ? importaLongo(rows,{cTerr,cInd,cVal,cCod,cUn,cFon,cAno,cNiv},nome)
    : importaLargo(rows,head,cLargo,nome);
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
    /* município: também pelo código IBGE, com 7 e com 6 dígitos (DATASUS) */
    if(nivel==='municipio'&&RAW_NUCLEO&&p.muni_id!=null){
      const c=String(RAW_NUCLEO.munis.ids[p.muni_id]); idx[c]=f; idx[c.slice(0,6)]=f;
    }
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
/* nível do arquivo largo: setor pelo código de 15 dígitos, município pela
   coluna de município; nos demais casos, o nível que está na tela */
function nivelDoLargo(head,cTerr,rows){
  const h=norm(head[cTerr]), v=String((rows[0]||[])[cTerr]||'').replace(/\D/g,'');
  if(/^(cd_setor|code_tract|cod_setor|setor)$/.test(h)||/^\d{15}$/.test(v))return 'setor';
  if(/^(municipio|nome_municipio)$/.test(h)||COLUNA_MUN.test(h))return 'municipio';
  return S.geo[S.nivel]?S.nivel:'bairro';
}
const COLUNA_MUN=/^(id_municipio|code_muni|co_municipio|codufmun|cod_ibge|cd_mun)$/;
/* colunas de identificação, que não são indicador: códigos (code_muni,
   id_municipio, co_entidade, CODUFMUN...), tipos codificados (tp_unidade,
   TIPO_EQP...), ano e mês de referência */
const COLUNA_ID=/^(code_|cod_|co_|cd_|id_|tp_|tipo_|codufmun$|codigo|cnes$|inep$|ano$|year$|mes$|competencia$|municipio$|nome_municipio$|bairro$|territorio$|nome$)/;
function importaLargo(rows,head,cTerr,nome){
  if(cTerr<0)throw new Error(
    'nenhuma coluna de território encontrada. Esperado território, bairro, nome, município ou cd_setor. Colunas lidas: '+head.join(', '));
  const nivel=nivelDoLargo(head,cTerr,rows);
  if(nivel==='setor')garanteSetores();
  const idx=indice(nivel);
  if(!idx)throw new Error('carregue antes uma malha geográfica');
  /* uma linha por território: com duas (por exemplo, rede pública e privada),
     a segunda apagaria a primeira sem aviso */
  const vistos={};
  rows.forEach(row=>{const k=norm(row[cTerr]||'');if(k)(vistos[k]=vistos[k]||{n:0,t:row[cTerr]}).n++;});
  const rep=Object.values(vistos).find(x=>x.n>1);
  if(rep)throw new Error(`"${rep.t}" aparece em ${rep.n} linhas. Deixe uma linha por território `
    +'(filtre, ou passe a categoria para colunas) antes de carregar.');
  const r={lidas:rows.length,casadas:0,semTerritorio:new Set(),semValor:0,municipais:0,
    semMalha:new Set(),criados:[],preenchidos:[],conflitos:[],niveis:new Set([nivel])};
  const cols=head.map((h,k)=>k===cTerr||COLUNA_ID.test(norm(h))?null:{h,k,id:'imp_'+slugId(h),usada:false}).filter(Boolean);
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
  /* ano de referência: o da coluna "ano", quando o arquivo traz um só */
  const cAno=head.findIndex(h=>/^(ano|year)$/.test(norm(h)));
  const anos=cAno<0?[]:[...new Set(rows.map(row=>parseInt(row[cAno],10)).filter(Number.isFinite))];
  const ano=anos.length===1?anos[0]:'';
  cols.filter(c=>c.usada).forEach(c=>{
    if(getInd(c.id))return;
    registraImportado(c.id,{nivel,n:c.h,u:'importado',fonte:'',ano},nome);
    r.criados.push(c.h);
  });
  if(nivel!==S.nivel)setNivel(nivel,true);
  return r;
}

function registraImportado(id,pk,nome){
  FONTES['USR_'+id]={n:pk.fonte||('Arquivo do usuário: '+nome),
    s:pk.fonte?pk.fonte.split('—')[0].trim().slice(0,28):'arquivo do usuário',
    u:'',d:'Carregado pelo usuário nesta sessão. Confira fonte, ano e método antes de publicar.',
    naoOficial:true};
  ind({id,cat:'visao',n:pk.n,u:pk.u||'importado',fonte:'USR_'+id,
    /* sem ano no arquivo, fica "s/ ano": o ano da importação não é o do dado */
    ano:pk.ano||'',niveis:[pk.nivel],status:'imp',
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
  escolas:{cor:'#4a3aa7',r:3.6,rot:'Escolas'},
  saude:{cor:'#1baf7a',r:3.8,rot:'Saúde'},
  acolhimento:{cor:'#b07a12',r:3.6,rot:'Comunidades terapêuticas e residenciais'},
  lojas:{cor:'#C2502A',r:7,rot:'Lojas Renner'}
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
    (p.cod?`<div class="kv"><span>Código</span><span class="num">${esc(p.cod)}</span></div>`:'')+
    (p.restrito?`<div class="hint">Acesso restrito: atende só a população da unidade prisional ou socioeducativa. Não entra nas contagens de saúde do território.</div>`:'')+
    (p.end?`<div style="font-size:10.5px;color:var(--txt3);margin-top:4px">${esc(p.end)}</div>`:'')+
    (loja?`<div class="hint">clique para analisar o entorno</div>`:'');
}
/* A camada é construída uma única vez; depois só entra e sai do mapa. */
function constroiPontos(chave){
  const e=ESTILO_PONTO[chave], loja=chave==='lojas', rend=rendererDe(chave);
  /* featureGroup: os eventos dos pontos chegam ao grupo, e marcaSobre faz o
     tooltip do território de baixo sair de cena enquanto o cursor está no ponto
     (sem isso, o mousemove do mapa o reabria por cima do tooltip do ponto) */
  const g=L.featureGroup();
  PONTOS[chave].forEach((p,i)=>{
    const m=L.circleMarker([p.y,p.x],{
      renderer:rend,
      /* anel da cor do papel em volta do ponto: separa do polígono embaixo */
      radius:e.r, fillColor:e.cor, color:COR.papel,
      weight:loja?2.5:1.2, fillOpacity:1, opacity:1, className:loja?'mk-loja':'',
      bubblingMouseEvents:!loja
    });
    m.bindTooltip(()=>tooltipPontoHTML(p,loja),{className:'tt',sticky:true,direction:'top'});
    if(loja)m.on('click',()=>abreEntorno(i));
    g.addLayer(m);
  });
  marcaSobre(g);
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
  S.loja=i; S.raio=raio||S.raio||1; S.bolsao=null;
  focoLoja=L0;
  if(camadaRaio){map.removeLayer(camadaRaio);camadaRaio=null;}
  camadaRaio=L.circle([L0.y,L0.x],{radius:S.raio*1000,color:COR.terracota,weight:2,
    fillColor:COR.terracota,fillOpacity:.06,dashArray:'6,5',pane:'atlasSobre',
    interactive:false}).addTo(map);
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
  const aopRef=AOP&&muni&&MUNIS_LISTA?((AOP.municipio||{})[String(MUNIS_LISTA.ids[MUNIS_LISTA.nomes.indexOf(muni)])]||{}):{};
  return REFS[chave]={...aopRef,
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
  ${p.aop_emprego_tp60!=null?`<h3 class="sec">Acesso a oportunidades <span class="chip tag">IPEA · 2019</span></h3>
  ${linha('Empregos alcançáveis em até 60 min de transporte público (% da cidade)','aop_emprego_tp60','pct1')}
  ${linha('Tempo a pé até saúde de baixa complexidade (min)','aop_saude_pe','dec1',true)}
  ${linha('Tempo a pé até escola pública de educação infantil (min)','aop_infantil_pe','dec1',true)}
  ${linha('Moradores a mais de 30 min a pé de educação infantil','aop_infantil_30pe','pct1',true)}
  <p style="font-size:11px;color:var(--txt3);line-height:1.55;margin-top:6px">Média dos setores do raio
    ponderada pela população; só os setores de Porto Alegre cobertos pela grade do IPEA de 2019
    (${fmtN(p._aop_pop,'int')} moradores). Para tempos, valor menor é melhor.</p>`:''}

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
  const item=(id,rot,qtd,amostra)=>`<label class="lay"><input type="checkbox" id="lay-${id}" ${S.camadas[id]?'checked':''}>
      ${amostra}<span class="lay-n">${rot}</span><span class="lay-q">${qtd}</span></label>`;
  const pt=c=>`<i class="sw-pt" style="background:${c}"></i>`;
  const el=$('#layers'); el.classList.toggle('min',!!S.layMin);
  el.innerHTML=`<button class="lg-hd" id="layToggle" aria-expanded="${!S.layMin}"><span class="eyebrow">Camadas</span><span class="lg-chev" aria-hidden="true"></span></button>
    <div class="lg-body">
    ${item('lojas','Lojas Renner',n('lojas'),pt(ESTILO_PONTO.lojas.cor))}
    ${item('escolas','Escolas',nf.format(n('escolas')),pt(ESTILO_PONTO.escolas.cor))}
    ${item('saude','Unidades de saúde',n('saude'),pt(ESTILO_PONTO.saude.cor))}
    ${n('acolhimento')?item('acolhimento','Comunidades terapêuticas e residenciais',n('acolhimento'),pt(ESTILO_PONTO.acolhimento.cor)):''}
    ${chavesPonto().filter(k=>k.startsWith('xt_')).map(k=>item(k,ESTILO_PONTO[k].rot,nf.format(n(k)),pt(ESTILO_PONTO[k].cor))).join('')}
    ${item('fcu','Favelas e comunidades','IBGE','<i class="sw-area"></i>')}
    ${AREAS_RISCO.length?item('risco','Áreas de risco (2010)',AREAS_RISCO.length,'<i class="sw-area risco"></i>'):''}
    ${item('bolsoes','Bolsões do quintil mais pobre',BOLSOES?nf.format(BOLSOES.length):'123','<i class="sw-area bol"></i>')}
    <div class="lay-sep"></div>
    ${item('base','Mapa de fundo','opcional','<i class="sw-base"></i>')}</div>`;
  $('#layToggle').onclick=()=>{S.layMin=!S.layMin;el.classList.toggle('min',S.layMin);
    $('#layToggle').setAttribute('aria-expanded',String(!S.layMin));};
  $('#lay-base').onchange=e=>{S.camadas.base=e.target.checked;baseOn(e.target.checked);};
  $('#lay-fcu').onchange=e=>{S.camadas.fcu=e.target.checked;fcuOn(e.target.checked);};
  if($('#lay-risco'))$('#lay-risco').onchange=e=>{S.camadas.risco=e.target.checked;riscoOn(e.target.checked);};
  $('#lay-bolsoes').onchange=e=>{S.camadas.bolsoes=e.target.checked;bolsoesOn(e.target.checked);};
  chavesPonto().forEach(k=>{
    if($('#lay-'+k))$('#lay-'+k).onchange=e=>{S.camadas[k]=e.target.checked;pontosOn(k,e.target.checked);};
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
      renderer:rendererSobre(),
      style:{fillColor:'#9B2C6F',fillOpacity:.16,color:'#9B2C6F',weight:1.2,opacity:.9}
    });
    camadaFCU.bindTooltip(l=>{
      const p=(l.feature||l).properties||{};
      return `<b>${esc(p._fcuNome)}</b>
       <div class="kv"><span>Setor</span><span class="num">${esc(String(p.id).slice(-6))}</span></div>
       <div class="kv"><span>População</span><span class="num">${fmtN(p.pop,'int')}</span></div>
       <div class="kv"><span>Domicílios</span><span class="num">${fmtN(p.dpo,'int')}</span></div>`;
    },{className:'tt',sticky:true,direction:'top'});
    marcaSobre(camadaFCU);
  }
  if(!map.hasLayer(camadaFCU))camadaFCU.addTo(map);
}

/* Áreas de risco BATER (IBGE e CEMADEN, base 2010), de dados-complementares.js.
   Só existem para municípios monitorados pelo CEMADEN: aqui, Porto Alegre e
   Sapucaia do Sul. A ausência de polígono não quer dizer ausência de risco. */
let AREAS_RISCO=((window.ATLAS_COMPLEMENTOS||{}).risco)||[];
const ESTILO_RISCO={fillColor:'#7A1F12',fillOpacity:.14,color:'#7A1F12',weight:1.6,opacity:.95,dashArray:'5 3'};
const RECORTE_RISCO={face:'faces de quadra',setor:'setores censitários'};
const AJUSTE_RISCO={otima:'ótimo',boa:'bom',regular:'regular'};
function riscoOn(on){
  if(!on){ if(camadaRisco&&map.hasLayer(camadaRisco))map.removeLayer(camadaRisco); return; }
  if(!AREAS_RISCO.length)return;
  if(!camadaRisco){
    const P=(window.ATLAS_COMPLEMENTOS||{}).prec||1e5;
    const nomeMun=c=>{const k=MUNIS_LISTA?MUNIS_LISTA.ids.indexOf(+c):-1;return k>=0?MUNIS_LISTA.nomes[k]:c;};
    camadaRisco=L.geoJSON({type:'FeatureCollection',features:AREAS_RISCO.map(a=>({type:'Feature',
      properties:{cod:a.cod,muni:nomeMun(a.muni),origem:a.origem,acuracia:a.acuracia,obs:a.obs},
      geometry:a.gj||decGeom(a.geom,P)}))},{
      renderer:rendererSobre(),style:ESTILO_RISCO});
    camadaRisco.bindTooltip(l=>{
      const p=(l.feature||l).properties||{};
      return `<b>Área de risco ${esc(p.cod)}</b>
       <div class="kv"><span>Município</span><span>${esc(p.muni)}</span></div>
       <div class="kv"><span>Recorte</span><span>${esc(RECORTE_RISCO[p.origem]||p.origem||'—')}</span></div>
       <div class="kv"><span>Ajuste</span><span>${esc(AJUSTE_RISCO[p.acuracia]||p.acuracia||'—')}</span></div>
       ${p.obs?`<div class="kv"><span>Observação</span><span>${esc(p.obs)}</span></div>`:''}
       <div class="hint">IBGE e CEMADEN · malha do Censo 2010</div>`;
    },{className:'tt tt-risco',sticky:true,direction:'top'});
    marcaSobre(camadaRisco);
  }
  if(!map.hasLayer(camadaRisco))camadaRisco.addTo(map);
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
  if(id==='mdDiag')renderDiag();
  if(id==='mdBolsoes')renderBolsoes();
  if(id==='mdExtrair')renderExtrair();
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
/* área aproximada de um anel, em km² (latitude da RMPA, ~30° S) */
function areaKm2(r){
  let a=0; for(let i=0,j=r.length-1;i<r.length;j=i++)a+=r[j][0]*r[i][1]-r[i][0]*r[j][1];
  return Math.abs(a/2)*111.32*111.32*0.866;
}
/* frestas: buracos com menos de 5 ha que a dissolução dos setores deixa nas malhas
   de bairro e município. Só servem para desenhar pontos brancos no mapa; os buracos
   maiores (que podem ser território sem setor) ficam como estão. */
const FRESTA_KM2=0.05;
function decGeom(mp,prec,semFrestas){
  const polys=mp.map(poly=>{
    const rs=poly.map(r=>decRing(r,prec));
    return semFrestas?rs.filter((r,k)=>k===0||areaKm2(r)>=FRESTA_KM2):rs;
  });
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
/* taxas por habitante do município: gastos de 2024 e crimes de 2025 sobre a população
   estimada de 2026; UBS de 2026 sobre a população do Censo 2022 */
function porHabitante(p){
  const hab=p.pop_est_2026||null, por=(k,f)=>p[k]==null||!hab?null:Math.round(100*f*p[k]/hab)/100;
  p.gasto_saude_hab=por('gasto_saude',1); p.gasto_atencao_basica_hab=por('gasto_atencao_basica',1);
  p.gasto_assistencia_hab=por('gasto_assistencia',1); p.gasto_seguranca_hab=por('gasto_seguranca',1);
  p.gasto_trabalho_hab=por('gasto_trabalho',1);
  p.cvli_100mil=por('seg_cvli',1e5); p.homicidio_100mil=por('seg_vitimas_homicidio',1e5);
  p.roubos_100mil=por('seg_roubos',1e5);
  p.fin_transf_pct=raz(p.fin_transferencias,p.fin_receita_total);
  p.ubs_10mil=p.cnes_ubs==null||!p.pop?null:Math.round(1e6*p.cnes_ubs/p.pop)/100;
  return p;
}
function derivados(p){
  if(p.dens_dom==null&&p.dom_part!=null&&p.area_km2)p.dens_dom=Math.round(10*p.dom_part/p.area_km2)/10;
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
  p.pct_sem_banheiro=raz((p.ban_nenhum??0)+(p.ban_comum??0)+(p.ban_sanitario??0),d);
  /* entorno: sobre os moradores com entorno pesquisado */
  if(p.ent_mor)ENT_CAMPOS.forEach(k=>{p['pct_'+k]=raz(p[k],p.ent_mor);});
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

/* Valores municipais que não vêm dos setores: PIB, serviços, índices e
   complementos. Usada na montagem e de novo quando chega dado das fontes. */
function fontesDoMunicipio(p,codMun){
  const N=window.ATLAS_NUCLEO, b=((N.pib&&N.pib.municipios)||{})[p.nome];
  if(b){
    p.pib=b.pib; p.vab=b.vab; p.vab_ind=b.vab_ind; p.vab_serv=b.vab_serv;
    p.vab_adm=b.vab_adm; p.vab_agro=b.vab_agro; p.impostos=b.impostos;
    p.pib_pc=Math.round(b.pib*1000/p.pop);
    p.pib_cresc=b.pib_ant?Math.round(1000*(b.pib/b.pib_ant-1))/10:null;
    p.pct_vab_ind=raz(b.vab_ind,b.vab); p.pct_vab_serv=raz(b.vab_serv,b.vab);
    p.pct_vab_adm=raz(b.vab_adm,b.vab); p.pct_vab_agro=raz(b.vab_agro,b.vab);
  }
  Object.assign(p,((window.ATLAS_SERVICOS||{}).municipios||{})[codMun]||{});
  Object.assign(p,((window.ATLAS_INDICES||{}).municipios||{})[codMun]||{});
  Object.assign(p,((window.ATLAS_COMPLEMENTOS||{}).municipios||{})[codMun]||{});
  const i00=idhm2000(); if(i00&&i00[codMun]!=null)p.m_idhm00=i00[codMun];
  if(ADH_IPEA)for(const id in ADH_NOVOS){
    const s=(ADH_IPEA.valores[ADH_NOVOS[id]]||{})[codMun]; if(s&&s[2]!=null)p[id]=s[2];
  }
  /* séries municipais (Ipeadata e complementares): o valor do ano do mapa */
  SERIES_REG.forEach(({id,serie:s})=>{const k=s.mun.indexOf(codMun), j=s.anos.indexOf(s.ano);
    const v=k>=0&&j>=0?s.v[j][k]:null; if(v!=null)p[id]=v;});
  /* 2010 no município: o valor calculado sobre todos os registros do município, e não a
     média das áreas de ponderação (em Canoas, o Gini médio das áreas dá 0,452; o do município, 0,518) */
  const of=MUNICIPAL_2010[codMun]||{};
  for(const k in VALOR_OFICIAL_2010){const v=of[VALOR_OFICIAL_2010[k]]; if(v!=null)p[k]=v;}
  porHabitante(p);
  return p;
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
  if(C22)C22.campos.forEach((c,i)=>{if(C22.bairros[c])colB[c]=decCol(C22.bairros[c],C22.escalas[i],nb);});
  const TODOS_B=C.concat(CE,C22?C22.campos:[]).filter(c=>colB[c]);   /* içado do laço */
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
    if(C22)omissoesC22(p,C22.omissoes_bairro,i);
    if(AOP&&AOP.bairro){
      for(const k in AOP.bairro){const v=AOP.bairro[k][i]; if(v!=null)p[k]=v;}
      if(AOP.cobertura_bairro&&AOP.cobertura_bairro[i]!=null)p._aop_cob=AOP.cobertura_bairro[i];
    }
    return {type:'Feature',properties:derivados(p),geometry:decGeom(B.geom[i],P,true)};
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
    const colM22={};
    if(C22)C22.campos.forEach((c,i)=>{if(C22.municipios[c])colM22[c]=decCol(C22.municipios[c],C22.escalas[i],nm);});
    S.geo.municipio={type:'FeatureCollection',name:'municipios',features:M.nomes.map((nome,i)=>{
      const p={id:M.ids[i],nome,muni:nome,muni_id:M.muni_id[i]};
      C.forEach(c=>{const v=colM[c][i]; if(v!=null)p[c]=v;});
      CE.forEach(c=>{const v=colME[c]&&colME[c][i]; if(v!=null)p[c]=v;});
      for(const c in colM22){const v=colM22[c][i]; if(v!=null)p[c]=v;}
      if(C22)omissoesC22(p,C22.omissoes_municipio,i);
      fontesDoMunicipio(p,String(N.munis.ids[M.muni_id[i]]));
      /* sem as frestas da dissolução dos setores (Porto Alegre tinha 1.225) */
      return {type:'Feature',properties:derivados(p),geometry:decGeom(M.geom[i],P,true)};
    })};
  }

  /* --- camadas de pontos --- */
  const PT=window.ATLAS_PONTOS;
  if(PT){
    PONTOS={};
    ['escolas','saude','acolhimento','lojas'].forEach(k=>{
      const d=PT[k]; if(!d)return;
      const n=d.nomes.length, xy=decPts(d.xy,P,n);
      PONTOS[k]=d.nomes.map((nome,i)=>({
        nome, x:xy[i][0], y:xy[i][1],
        muni: d.m? N.munis.nomes[d.m[i]] : null,
        tipo: d.tipo?d.tipo[i]:null,
        rot: d.legenda? (d.legenda[String(d.tipo[i])]||'—') : (d.tipo?d.tipo[i]:''),
        num: d.num?d.num[i]:null, end: d.end?d.end[i]:null,
        restrito: d.restrito?!!d.restrito[i]:false, cod: d.cod?d.cod[i]:null
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
  /* IPEA: valor do hexágono que contém o ponto do setor; "_aop_..._30pe" é 1 quando passa de 30 min */
  const EXTRA=[];
  if(AOP&&AOP.setor){
    for(const k in AOP.setor){colS[k]=decCol(AOP.setor[k],AOP.escala||100,ns);EXTRA.push(k);}
    for(const k in (AOP.setor_acima||{})){colS['_'+k]=decCol(AOP.setor_acima[k],1,ns);EXTRA.push('_'+k);}
  }
  if(C22)C22.campos.forEach((c,i)=>{if(C22.setores[c]){colS[c]=decCol(C22.setores[c],C22.escalas[i],ns);EXTRA.push(c);}});
  const sufixo=decDic(T.ids,null,ns),muni=decDic(T.m,null,ns);
  const bairroS=decDic(T.bairro,T.bairro_dic,ns),fcuS=decDic(T.fcu,T.fcu_dic,ns);
  const cent=decPts(T.cent,P,ns);
  /* içados do laço: antes eram 4.722 arrays descartados e 4.722 slugId() */
  const TODOS=C.concat(CE,EXTRA).filter(c=>colS[c]);
  const PREF=N.munis.ids.map(x=>String(x));
  const slugCache=new Map();
  const slugDe=n=>{let v=slugCache.get(n);if(v===undefined){v=slugId(n);slugCache.set(n,v);}return v;};
  IDX_BUSCA=null;
  S.geo.setor={type:'FeatureCollection',name:'setores_rmpa',features:T.geom.map((g,i)=>{
    const mi=muni[i],cod=PREF[mi]+String(sufixo[i]).padStart(8,'0');
    const p={id:cod,nome:'Setor '+cod.slice(-6),muni:N.munis.nomes[mi],muni_id:mi};
    for(let k=0;k<TODOS.length;k++){const c=TODOS[k],v=colS[c][i];if(v!=null)p[c]=v;}
    if(bairroS[i]){p.bairro=bairroS[i];p.bairro_id=slugDe(bairroS[i]);}
    if(fcuS[i]){p._fcuNome=fcuS[i];p.fcu_n=1;} else p.fcu_n=0;
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
  const esc=PONTOS.escolas||[],sau=(PONTOS.saude||[]).filter(q=>!q.restrito),aco=PONTOS.acolhimento||[];
  const conta=(p,e,s,a)=>{
    p.inep_escolas=e.length;
    p.inep_escolas_publicas=e.filter(q=>+q.tipo!==4).length;
    p.inep_escolas_privadas=e.filter(q=>+q.tipo===4).length;
    p.cnes_estabelecimentos=s.length;
    p.cnes_ubs=s.filter(q=>[1,2].includes(+q.tipo)).length;
    p.cnes_hospitais=s.filter(q=>[5,7,62].includes(+q.tipo)).length;
    p.cnes_caps=s.filter(q=>+q.tipo===70).length;
    p.cnes_acolhimento=a.length;
    p.ubs_10mil=p.pop?Math.round(1e6*p.cnes_ubs/p.pop)/100:null;
  };
  /* município: contado dos mesmos pontos, com as mesmas regras do bairro */
  ((S.geo.municipio||{}).features||[]).forEach(f=>{const p=f.properties,eh=q=>q.muni===p.nome;
    conta(p,esc.filter(eh),sau.filter(eh),aco.filter(eh));});
  S.geo.bairro.features.forEach(f=>{
    const p=f.properties, cx=caixaDe(f.geometry);
    const dentro=q=>q.muni===p.muni&&q.x>=cx[0]&&q.x<=cx[2]&&q.y>=cx[1]&&q.y<=cx[3]
      &&pontoNaGeometria(q.x,q.y,f.geometry);
    conta(p,esc.filter(dentro),sau.filter(dentro),aco.filter(dentro));
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
  if(AOP)Object.assign(soma,mediaAOP(fs.map(f=>f.properties)));
  const esc=(PONTOS&&PONTOS.escolas||[]).filter(p=>distKm(x,y,p.x,p.y)<=raioKm);
  const sau=(PONTOS&&PONTOS.saude||[]).filter(p=>!p.restrito&&distKm(x,y,p.x,p.y)<=raioKm);
  return {soma,setores:fs,escolas:esc,saude:sau};
}

/* Acesso a oportunidades (IPEA) de um conjunto de setores: tempos e empregos pela
   média ponderada pela população; a parte acima de 30 minutos pela soma dos moradores. */
const AOP_MEDIA=['aop_emprego_tp60','aop_saude_pe','aop_infantil_pe','aop_fundamental_pe'];
const AOP_ACIMA=['aop_saude_30pe','aop_infantil_30pe'];
function mediaAOP(setores){
  const r={}, ac={};
  AOP_MEDIA.concat(AOP_ACIMA).forEach(k=>ac[k]=[0,0]);
  for(const q of setores){
    const w=q.pop||0; if(!w)continue;
    for(const k of AOP_MEDIA)if(q[k]!=null){ac[k][0]+=q[k]*w;ac[k][1]+=w;}
    for(const k of AOP_ACIMA){const v=q['_'+k]; if(v!=null){ac[k][0]+=v*w;ac[k][1]+=w;}}
  }
  for(const k of AOP_MEDIA)r[k]=ac[k][1]?Math.round(100*ac[k][0]/ac[k][1])/100:null;
  for(const k of AOP_ACIMA)r[k]=ac[k][1]?Math.round(1000*ac[k][0]/ac[k][1])/10:null;
  r._aop_pop=ac.aop_saude_30pe[1];
  return r;
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
      const alt=IND.find(x=>x.status!=='pend'&&x.status!=='mun'&&x.niveis.includes(b.dataset.nivel));
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
  /* menu "Mais": metodologia, cobertura, fontes, integrar dados */
  const bm=$('#btnMais'), mm=$('#menuMais');
  if(bm&&mm){
    const fecha=()=>{mm.classList.remove('show');bm.setAttribute('aria-expanded','false');};
    bm.onclick=e=>{e.stopPropagation();const ab=!mm.classList.contains('show');
      mm.classList.toggle('show',ab);bm.setAttribute('aria-expanded',String(ab));};
    mm.querySelectorAll('button').forEach(b=>b.addEventListener('click',fecha));
    document.addEventListener('click',e=>{if(!mm.contains(e.target)&&e.target!==bm)fecha();});
  }
  /* filtro da lista de indicadores: abre as categorias que têm resultado */
  const fi=$('#filtroInd');
  if(fi)fi.oninput=()=>{
    const q=norm(fi.value);
    $$('.cat').forEach(c=>{
      let tem=0;
      c.querySelectorAll('.ind').forEach(b=>{const ok=!q||b.dataset.busca.includes(q);b.hidden=!ok;if(ok)tem++;});
      c.hidden=!!q&&!tem; c.classList.toggle('open',q?tem>0:c.dataset.cat===S.cat);
    });
  };
  /* no celular, legenda e camadas começam recolhidas para o mapa aparecer */
  if(window.innerWidth<=620){S.legMin=true;S.layMin=true;renderCamadas();}
  $('#btnAnalise').onclick=()=>abreModal('mdAnalise');
  $('#btnMetodo').onclick=()=>abreModal('mdMetodo');
  $('#btnMatriz').onclick=()=>abreModal('mdMatriz');
  $('#btnFontes').onclick=()=>abreModal('mdFontes');
  $('#btnDados').onclick=()=>abreModal('mdDados');
  const bx=$('#btnExtrair'); if(bx)bx.onclick=()=>abreModal('mdExtrair');
  $('#btnDiag').onclick=()=>abreModal('mdDiag');
  $('#btnBolsoes').onclick=()=>abreModal('mdBolsoes');
  $('#btnExportar').onclick=exportaMapa;
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
  /* no celular o painel cobre 64% do mapa: precisa de um jeito de fechar */
  $('#btnFechaPainel').onclick=()=>$('#panel').classList.remove('open');
}
/* ═══════════════════ 25. REGIÃO, BOLSÕES, EXPORTAÇÃO E DIAGNÓSTICO ═══════
   Sugestões do template de diagnóstico regional (docs/DIAGNOSTICO-REGIONAL-
   analise-do-template.md): linha "Região", bolsões como camada, exportação
   do mapa, tabelas do diagnóstico e matriz de priorização. Tudo calculado
   sobre os dados já carregados; nada é estimado. */

/* ── Região: soma dos sete municípios. Contagens somam; taxas são recalculadas
   a partir das contagens; os valores de 2010 não se agregam (ficam vazios). */
let REGIAO=null;
const ADITIVOS=/^(pop|pop_h|pop_m|pop_15|pop_est_2026|id\d+|criancas_0_14|jovens_15_29|adultos_30_59|idosos_60|raca_[a-z_]+|indigenas|quilombolas|alfab_15|dom_[a-z_]+|dpo|dppo|agua_[a-z_]+|esg_[a-z_]+|lixo_[a-z_]+|ban_[a-z_]+|fcu_pop|fcu_dom|obitos(_[hm])?|resp_n|area_km2|inep_[a-z_]+|cnes_[a-z_]+|seg_[a-z_]+|fin_(receita_total|receita_corrente|receita_tributaria|transferencias|despesa_total|investimentos|resultado_orcamentario)|pib|vab(_[a-z]+)?|impostos|agro_vab|gasto_[a-z_]+|ent_[a-z]+)$/;
function regiaoProps(){
  if(REGIAO)return REGIAO;
  const fs=((S.geo.municipio||{}).features||[]).map(f=>f.properties);
  const r={id:'regiao',nome:'Região (7 municípios)',muni:null,muni_id:null};
  if(!fs.length)return REGIAO=r;
  const ks=new Set();
  fs.forEach(p=>Object.keys(p).forEach(k=>{if(ADITIVOS.test(k)&&!/_hab$/.test(k))ks.add(k);}));
  ks.forEach(k=>{if(fs.every(p=>p[k]!=null&&p[k]!==''&&!isNaN(+p[k])))r[k]=fs.reduce((a,p)=>a+(+p[k]),0);});
  let n=0,d=0;
  fs.forEach(p=>{if(p.resp_renda!=null&&p.resp_n){n+=p.resp_renda*p.resp_n;d+=p.resp_n;}});
  r.resp_renda=d?Math.round(100*n/d)/100:null;
  if(r.pop&&r.area_km2)r.dens_hab=Math.round(10*r.pop/r.area_km2)/10;
  if(r.pib&&r.pop)r.pib_pc=Math.round(r.pib*1000/r.pop);
  if(r.vab){
    r.pct_vab_ind=raz(r.vab_ind,r.vab); r.pct_vab_serv=raz(r.vab_serv,r.vab);
    r.pct_vab_adm=raz(r.vab_adm,r.vab); r.pct_vab_agro=raz(r.vab_agro,r.vab);
    if(r.agro_vab!=null)r.agro_participacao_vab=raz(r.agro_vab,r.vab);
  }
  derivados(r); porHabitante(r);
  r.pop_pct_mun=null;
  return REGIAO=r;
}

/* ── Quintis de renda dos setores, ponderados pela população (como na análise) */
let QUINTIS=null;
function quintisSetores(){
  if(QUINTIS)return QUINTIS;
  garanteSetores();
  const com=(S.geo.setor?S.geo.setor.features:[]).map(f=>f.properties)
    .filter(q=>q.resp_renda!=null&&q.pop>0).sort((a,b)=>a.resp_renda-b.resp_renda);
  const tot=com.reduce((a,q)=>a+q.pop,0), lim=[];
  let acc=0,k=1;
  for(const q of com){acc+=q.pop; while(k<5&&acc>=k*0.2*tot){lim.push(q.resp_renda);k++;}}
  return QUINTIS={lim,com};      /* lim[0] = teto do quintil mais pobre */
}

/* ── Bolsões: setores do quintil mais pobre a até 5 km de uma unidade Renner,
   agrupados quando a distância entre seus centros é de até 600 m. Mesmo método
   de docs/ANALISE-DESENVOLVIMENTO-entorno-lojas.md (123 bolsões, 323.725 pessoas). */
let BOLSOES=null, camadaBolsoes=null;
const ESTILO_BOLSAO={fillColor:'#FBFAF7',fillOpacity:.42,color:'#15212E',weight:1.3,opacity:.95}, ESTILO_BOLSAO_SEL={fillColor:'#FBFAF7',fillOpacity:.6,color:'#C2502A',weight:2.8,opacity:1};
function calculaBolsoes(){
  if(BOLSOES)return BOLSOES;
  const {lim,com}=quintisSetores();
  const LJ=(PONTOS&&PONTOS.lojas)||[];
  if(!lim.length||!LJ.length)return BOLSOES=[];
  const venda=LJ.filter(l=>l.tipo==='loja'||l.tipo==='shopping');
  const perto=(lista,x,y)=>{let m=null;for(const l of lista){const d=distKm(l.x,l.y,x,y);if(!m||d<m.d)m={l,d};}return m;};
  const alvo=com.filter(q=>q.resp_renda<=lim[0]&&q._cx!=null&&perto(LJ,q._cx,q._cy).d<=5);
  const vis=new Uint8Array(alvo.length), grupos=[];
  for(let a=0;a<alvo.length;a++){
    if(vis[a])continue; vis[a]=1; const g=[a];
    for(let k=0;k<g.length;k++){const u=alvo[g[k]];
      for(let c=0;c<alvo.length;c++)if(!vis[c]&&distKm(u._cx,u._cy,alvo[c]._cx,alvo[c]._cy)<=0.6){vis[c]=1;g.push(c);}}
    grupos.push(g.map(k=>alvo[k]));
  }
  BOLSOES=grupos.map(g=>{
    const s={pop:0,dppo:0,cri:0,jov:0,fcu:0,rn:0,rd:0,sf:0,de:0,np:0,pp:0,rc:0};
    g.forEach(q=>{
      s.pop+=q.pop||0; s.dppo+=q.dppo||0; s.cri+=q.criancas_0_14||0; s.jov+=q.jovens_15_29||0; s.fcu+=q.fcu_pop||0;
      if(q.resp_renda!=null&&q.resp_n){s.rn+=q.resp_renda*q.resp_n;s.rd+=q.resp_n;}
      if(q.est_sem_fundamental_25!=null&&q.est_desocupacao!=null){s.sf+=q.est_sem_fundamental_25*q.pop;s.de+=q.est_desocupacao*q.pop;s.np+=q.pop;}
      s.pp+=q.raca_preta_parda||0; s.rc+=q._raca_total||0;
    });
    const cx=g.reduce((a,q)=>a+q._cx*(q.pop||0),0)/s.pop, cy=g.reduce((a,q)=>a+q._cy*(q.pop||0),0)/s.pop;
    const bai={}; g.forEach(q=>{if(q.bairro)bai[q.bairro]=(bai[q.bairro]||0)+(q.pop||0);});
    const munis=[...new Set(g.map(q=>q.muni))];
    const bairros=Object.entries(bai).sort((a,b)=>b[1]-a[1]).map(x=>x[0]).filter(n=>!/sem divisão/i.test(n));
    const u=perto(LJ,cx,cy), v=perto(venda,cx,cy);
    const ac=AOP?mediaAOP(g):{};
    return {...ac, ids:g.map(q=>q.id), setores:g.length, pop:s.pop, dppo:s.dppo, cri:s.cri, jov:s.jov,
      pct_fcu:s.pop?100*s.fcu/s.pop:null, renda:s.rd?s.rn/s.rd:null,
      sem_fund10:s.np?s.sf/s.np:null, desoc10:s.np?s.de/s.np:null, pct_pp:s.rc?100*s.pp/s.rc:null,
      fcu_nomes:[...new Set(g.map(q=>q._fcuNome).filter(Boolean))], bairros, munis,
      nome:(bairros.length?bairros.slice(0,2).join(', '):munis.join(' + ')),
      unidade:u.l.nome, dist_unidade:u.d, venda:v.l.nome, dist_venda:v.d, cx, cy};
  }).sort((a,b)=>b.pop-a.pop);
  BOLSOES.forEach((b,k)=>b.ordem=k+1);
  const porId=new Map(); BOLSOES.forEach((b,k)=>b.ids.forEach(id=>porId.set(id,k)));
  BOLSOES.porId=porId;
  return BOLSOES;
}
function bolsoesOn(on){
  if(!on){if(camadaBolsoes&&map.hasLayer(camadaBolsoes))map.removeLayer(camadaBolsoes);return;}
  const B=calculaBolsoes(); if(!B.length)return;
  if(!camadaBolsoes){
    const fs=S.geo.setor.features.filter(f=>B.porId.has(f.properties.id));
    camadaBolsoes=L.geoJSON({type:'FeatureCollection',features:fs},{
      renderer:rendererSobre(),
      style:()=>Object.assign({},ESTILO_BOLSAO)
    });
    camadaBolsoes.bindTooltip(l=>{
      const b=B[B.porId.get(((l.feature||l).properties||{}).id)]; if(!b)return '';
      return `<b>Bolsão ${b.ordem} · ${esc(b.nome)}</b>
        <div class="kv"><span>Moradores</span><span class="num">${fmtN(b.pop,'int')}</span></div>
        <div class="kv"><span>Renda média do responsável</span><span class="num">${fmtN(b.renda,'brl0')}</span></div>
        <div class="kv"><span>Loja de venda mais próxima</span><span>${esc(b.venda)} · ${fmtN(b.dist_venda,'dec1')} km</span></div>
        <div class="hint">clique para a ficha do bolsão</div>`;
    },{className:'tt',sticky:true,direction:'top'});
    marcaSobre(camadaBolsoes);
    camadaBolsoes.on('click',e=>{
      const l=e.propagatedFrom||e.layer, k=l&&l.feature?B.porId.get(l.feature.properties.id):null;
      if(k!=null){L.DomEvent.stop(e);abreBolsao(k);}
    });
  }
  if(!map.hasLayer(camadaBolsoes))camadaBolsoes.addTo(map);
}
function bolsaoHTML(k){
  const b=calculaBolsoes()[k];
  const linha=(rot,val,u,nota)=>`<div class="row"><div class="k">${esc(rot)}${nota?`<span class="ref-note">${esc(nota)}</span>`:''}</div>
    <div class="v"><span class="num">${val}</span>${u?`<span class="u">${esc(u)}</span>`:''}</div></div>`;
  return `<div class="terr-h"><div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
      <button class="btn" id="btnVoltar" style="padding:3px 8px;font-size:11px">← Visão geral</button>
      <span class="eyebrow">Bolsão ${b.ordem} de ${BOLSOES.length}</span></div>
    <h2>${esc(b.nome)}</h2>
    <div class="sub">${b.munis.map(m=>`<span class="chip acc">${esc(m)}</span>`).join('')}
      <span class="chip">${nf.format(b.setores)} setores</span></div></div>
  <div class="hero-kpi">
    <div class="kpi"><span class="lb">Moradores</span><span class="vl">${fmtN(b.pop,'int')}</span><span class="selo s-ok"><i class="dot"></i>Censo/IBGE · 2022</span></div>
    <div class="kpi"><span class="lb">Domicílios</span><span class="vl">${fmtN(b.dppo,'int')}</span><span class="selo s-ok"><i class="dot"></i>Censo/IBGE · 2022</span></div>
    <div class="kpi"><span class="lb">Crianças de 0 a 14 anos</span><span class="vl">${fmtN(b.cri,'int')}</span><span class="selo s-ok"><i class="dot"></i>Censo/IBGE · 2022</span></div>
    <div class="kpi"><span class="lb">Jovens de 15 a 29 anos</span><span class="vl">${fmtN(b.jov,'int')}</span><span class="selo s-ok"><i class="dot"></i>Censo/IBGE · 2022</span></div>
  </div>
  <h3 class="sec">Perfil</h3>
  ${linha('Rendimento médio do responsável',fmtN(b.renda,'brl0'),'por mês','Censo 2022 · média ponderada pelos responsáveis')}
  ${linha('Em favelas e comunidades urbanas',fmtN(b.pct_fcu,'pct1'),'','Censo 2022')}
  ${linha('População preta ou parda',fmtN(b.pct_pp,'pct1'),'','Censo 2022')}
  ${linha('Adultos de 25 anos ou mais sem fundamental completo',fmtN(b.sem_fund10,'pct1'),'','Censo 2010 · referência histórica por área de ponderação')}
  ${linha('Taxa de desocupação',fmtN(b.desoc10,'pct1'),'','Censo 2010 · referência histórica por área de ponderação')}
  ${b.aop_emprego_tp60!=null?`<h3 class="sec">Acesso a oportunidades <span class="chip tag">IPEA · 2019</span></h3>
  ${linha('Empregos alcançáveis em até 60 min de transporte público',fmtN(b.aop_emprego_tp60,'pct1'),'dos empregos da cidade','Porto Alegre inteira: '+fmtN(((AOP.municipio||{})['4314902']||{}).aop_emprego_tp60,'pct1'))}
  ${linha('Tempo a pé até saúde de baixa complexidade',fmtN(b.aop_saude_pe,'dec1'),'min','média ponderada pela população')}
  ${linha('Tempo a pé até escola pública de educação infantil',fmtN(b.aop_infantil_pe,'dec1'),'min','média ponderada pela população')}
  ${linha('Moradores a mais de 30 min a pé de educação infantil',fmtN(b.aop_infantil_30pe,'pct1'),'','Porto Alegre inteira: '+fmtN(((AOP.municipio||{})['4314902']||{}).aop_infantil_30pe,'pct1'))}
  ${b.munis.length>1?`<p class="ref-note" style="margin-top:6px">Média só dos setores de Porto Alegre: o projeto do IPEA não cobre ${esc(b.munis.filter(m=>m!=='Porto Alegre').join(', '))}.</p>`:''}`:''}
  <h3 class="sec">Unidades Renner</h3>
  ${linha('Loja de venda mais próxima',esc(b.venda),fmtN(b.dist_venda,'dec1')+' km')}
  ${b.unidade!==b.venda?linha('Unidade mais próxima (inclui aeroporto e administrativa)',esc(b.unidade),fmtN(b.dist_unidade,'dec1')+' km'):''}
  ${b.bairros.length?`<h3 class="sec">Bairros</h3><p style="font-size:13px;color:var(--txt2);line-height:1.6">${b.bairros.map(esc).join(' · ')}</p>`:''}
  ${b.fcu_nomes.length?`<h3 class="sec">Favelas e comunidades urbanas<span class="chip tag">${b.fcu_nomes.length}</span></h3>
    <p style="font-size:13px;color:var(--txt2);line-height:1.6">${b.fcu_nomes.map(esc).join(' · ')}</p>`:''}
  <div class="note" style="margin-top:14px">Bolsão: setores do quintil de renda mais pobre da região
    (renda média do responsável até ${fmtN(quintisSetores().lim[0],'brl0')}) a até 600 m uns dos outros e a até 5 km
    de uma unidade Renner. Distâncias em linha reta.</div>`;
}
/* o bolsão aberto ganha contorno terracota; os demais ficam com o realce neutro */
function realceBolsao(k){
  if(!camadaBolsoes)return;
  const B=calculaBolsoes();
  camadaBolsoes.eachLayer(l=>{const sel=k!=null&&B.porId.get(l.feature.properties.id)===k;
    l.setStyle(sel?ESTILO_BOLSAO_SEL:ESTILO_BOLSAO); if(sel&&l.bringToFront)l.bringToFront();});
}
function bolsaoEm(ll){
  if(!S.camadas.bolsoes||!camadaBolsoes||!map.hasLayer(camadaBolsoes))return null;
  const x=ll.lng,y=ll.lat; let k=null;
  camadaBolsoes.eachLayer(l=>{
    if(k!=null)return; const f=l.feature, b=bboxFeicao(f);
    if(x<b[0]||x>b[2]||y<b[1]||y>b[3])return;
    const g=f.geometry, polys=g.type==='Polygon'?[g.coordinates]:g.coordinates;
    if(dentroDoPoligono(x,y,polys))k=BOLSOES.porId.get(f.properties.id);
  });
  return k;
}
function abreBolsao(k){
  const B=calculaBolsoes(), b=B[k]; if(!b)return;
  if(!S.camadas.bolsoes){S.camadas.bolsoes=true;renderCamadas();}
  bolsoesOn(true); realceBolsao(k);
  S.sel=null; S.bolsao=k; marcaSelecao();
  $('#panelBody').innerHTML=bolsaoHTML(k);
  const v=$('#btnVoltar'); if(v)v.onclick=()=>{S.bolsao=null;realceBolsao(null);renderPainel();};
  if(window.innerWidth<=960)$('#panel').classList.add('open');
  const ids=new Set(b.ids), fs=S.geo.setor.features.filter(f=>ids.has(f.properties.id));
  try{enquadraTerritorio(L.geoJSON({type:'FeatureCollection',features:fs}).getBounds(),true);}catch(e){}
}
function renderBolsoes(){
  const B=calculaBolsoes(), tot=B.reduce((a,b)=>a+b.pop,0);
  $('#bolsoesBody').innerHTML=`
    <div class="note">${nf.format(B.length)} bolsões do quintil de renda mais pobre a até 5 km de uma unidade Renner,
      com ${fmtN(tot,'int')} moradores. Clique em um bolsão para abrir a ficha e vê-lo no mapa.</div>
    <div class="btn-row" style="margin:10px 0"><button class="btn" id="bolCSV">Baixar tabela (CSV)</button></div>
    <table class="tb"><thead><tr><th style="width:40px">#</th><th>Bolsão</th><th>Município</th>
      <th style="text-align:right">Moradores</th><th style="text-align:right">0–14 anos</th>
      <th style="text-align:right">Renda média</th><th style="text-align:right">Em favela</th>
      <th>Loja de venda mais próxima</th><th style="text-align:right">km</th></tr></thead><tbody>
    ${B.map((b,k)=>`<tr style="cursor:pointer" data-bol="${k}"><td class="n" style="color:var(--txt3)">${b.ordem}</td>
      <td><b>${esc(b.nome)}</b></td><td style="color:var(--txt3)">${esc(b.munis.join(' + '))}</td>
      <td class="n">${fmtN(b.pop,'int')}</td><td class="n">${fmtN(b.cri,'int')}</td>
      <td class="n">${fmtN(b.renda,'brl0')}</td><td class="n">${fmtN(b.pct_fcu,'pct1')}</td>
      <td>${esc(b.venda)}</td><td class="n">${fmtN(b.dist_venda,'dec1')}</td></tr>`).join('')}
    </tbody></table>`;
  $$('#bolsoesBody [data-bol]').forEach(tr=>tr.onclick=()=>{fechaModais();abreBolsao(+tr.dataset.bol);});
  $('#bolCSV').onclick=()=>baixaCSV([['ordem','bolsao','municipios','setores','moradores','domicilios','criancas_0_14',
      'jovens_15_29','renda_media_resp','pct_fcu','pct_preta_parda','sem_fundamental_25_2010','desocupacao_2010',
      'loja_venda_mais_proxima','dist_venda_km','unidade_mais_proxima','dist_unidade_km','lat','lon']].concat(
    B.map(b=>[b.ordem,b.nome,b.munis.join(' | '),b.setores,b.pop,b.dppo,b.cri,b.jov,r2(b.renda),r2(b.pct_fcu),r2(b.pct_pp),
      r2(b.sem_fund10),r2(b.desoc10),b.venda,r2(b.dist_venda),b.unidade,r2(b.dist_unidade),r2(b.cy,5),r2(b.cx,5)])),
    'bolsoes-atlas-rmpa.csv');
}
const r2=(v,d=2)=>v==null?'':Math.round(v*10**d)/10**d;

/* ── Exportação do mapa em PNG: o desenho é refeito num canvas, com título,
   legenda e fonte. O mapa de fundo (OpenStreetMap) não entra na imagem. */
function rotulosLegenda(){
  const i=indAtual();
  const brk=S._brk||[], cores=S._cores||escalaCores(S._ramp||i.ramp,brk.length+1);
  const g=S._g||S.geo[S.nivel]||{features:[]};
  const vals=(S._ord&&S._g===g)?S._ord
    :g.features.map(f=>valor(f.properties)).filter(v=>v!=null).sort((a,b)=>a-b);
  const faixas=[];
  for(let k=0;k<cores.length;k++){
    const lo=k===0?vals[0]:brk[k-1], hi=k===cores.length-1?vals[vals.length-1]:brk[k];
    /* reais em faixas: sem centavos, que só poluem a leitura */
    const fl=i.fmt==='brl'?'brl0':i.fmt, zero=brk[0]===0;
    const faixa=(lo===hi||(k===0&&zero))?fmtN(k===0&&zero?0:lo,fl)
      :k===1&&zero&&lo===0?`acima de 0 até ${fmtN(hi,fl)}`:`${fmtN(lo,fl)} – ${fmtN(hi,fl)}`;
    faixas.push({cor:cores[k],txt:faixa});
  }
  /* por que falta valor: sem moradores, fonte que não cobre o município, ou sigilo */
  const nulos=g.features.filter(f=>valor(f.properties)==null);
  const nSemMor=nulos.filter(f=>!f.properties.pop).length;
  const nForaFonte=nulos.filter(f=>f.properties.pop&&!cobre(S.nivel,f.properties.muni,i.id)).length;
  const nResto=nulos.length-nSemMor-nForaFonte;
  /* o resto só é sigilo quando o dado é do Censo; nas outras fontes, a razão é da própria fonte */
  const resto=/^(CENSO|FAVELAS|ATLAS_CALC)/.test(i.fonte)?'sob sigilo estatístico do IBGE'
    :i.fonte==='IPEA_AOP'?'fora da grade do IPEA ou com cobertura insuficiente':'sem valor na fonte';
  const motivos=[[nSemMor,'setor especial ou sem moradores'],[nForaFonte,'fora da cobertura da fonte'],
    [nResto,resto]].filter(x=>x[0]>0);
  return {faixas,motivos};
}
function exportaMapa(){
  if(!map||!camada){toast('Nada para exportar.','err');return;}
  const i=indAtual(), sz=map.getSize(), W=sz.x, H=sz.y, K=2, TOPO=84, PE=50;
  const cv=document.createElement('canvas'); cv.width=W*K; cv.height=(H+TOPO+PE)*K;
  const c=cv.getContext('2d'); c.scale(K,K);
  const SANS='"IBM Plex Sans", Arial, sans-serif';
  const quebra=(t,max)=>{const ws=String(t).split(' '),out=[];let l='';
    ws.forEach(w=>{const n=l?l+' '+w:w; if(c.measureText(n).width>max&&l){out.push(l);l=w;}else l=n;}); if(l)out.push(l); return out;};
  c.fillStyle='#FCFBF8'; c.fillRect(0,0,W,H+TOPO+PE);
  const pt=(lng,lat)=>map.latLngToContainerPoint([lat,lng]);
  const caminho=geo=>{
    const polys=geo.type==='Polygon'?[geo.coordinates]:geo.type==='MultiPolygon'?geo.coordinates:[];
    c.beginPath();
    for(const poly of polys)for(const r of poly){r.forEach((q,k)=>{const p=pt(q[0],q[1]);k?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y);});c.closePath();}
  };
  const pinta=(geo,st)=>{
    caminho(geo);
    c.globalAlpha=st.fillOpacity??1; c.fillStyle=st.fillColor; c.fill('evenodd');
    if(st.weight){c.globalAlpha=st.opacity??1; c.strokeStyle=st.color; c.lineWidth=st.weight; c.stroke();}
    c.globalAlpha=1;
  };
  /* título */
  c.fillStyle='#15212E'; c.font=`600 19px ${SANS}`; c.fillText(quebra(i.n,W-40)[0]+(quebra(i.n,W-40).length>1?'…':''),20,34);
  const f=FONTES[i.fonte]||{}, mf=S.muniFiltro!=null&&MUNIS_LISTA?' · '+MUNIS_LISTA.nomes[S.muniFiltro]:'';
  c.fillStyle='#46505A'; c.font=`13px ${SANS}`;
  c.fillText(`${f.s||i.fonte} · ${i.ano||'s/ ano'} · ${NIVEIS[S.nivel].n.toLowerCase()}${mf}`+(i.status==='est'?' · referência histórica (Censo 2010)':''),20,58);
  /* mapa */
  c.save(); c.translate(0,TOPO); c.beginPath(); c.rect(0,0,W,H); c.clip();
  c.fillStyle='#F1EFEA'; c.fillRect(0,0,W,H);
  (S._g||{features:[]}).features.forEach(ft=>pinta(ft.geometry,estiloFeicao(ft)));
  if(S.camadas.fcu&&camadaFCU)camadaFCU.eachLayer(l=>pinta(l.feature.geometry,{fillColor:'#9B2C6F',fillOpacity:.16,color:'#9B2C6F',weight:1.2,opacity:.9}));
  if(S.camadas.risco&&camadaRisco){c.setLineDash([5,3]);camadaRisco.eachLayer(l=>pinta(l.feature.geometry,ESTILO_RISCO));c.setLineDash([]);}
  if(S.camadas.bolsoes&&camadaBolsoes)camadaBolsoes.eachLayer(l=>pinta(l.feature.geometry,l.options));
  if(camadaRaio&&map.hasLayer(camadaRaio)){
    const ll=camadaRaio.getLatLng(), p0=map.latLngToContainerPoint(ll);
    const p1=map.latLngToContainerPoint([ll.lat,ll.lng+camadaRaio.getRadius()/(111320*Math.cos(ll.lat*Math.PI/180))]);
    c.beginPath(); c.arc(p0.x,p0.y,Math.abs(p1.x-p0.x),0,2*Math.PI); c.setLineDash([6,5]);
    c.strokeStyle=COR.terracota; c.lineWidth=2; c.stroke(); c.setLineDash([]);
  }
  ['escolas','saude','acolhimento','lojas'].forEach(k=>{
    if(!S.camadas[k]||!PONTOS||!PONTOS[k])return;
    const e=ESTILO_PONTO[k], anel=k==='lojas'?2.5:1.2;
    PONTOS[k].forEach(q=>{const p=pt(q.x,q.y);
      if(p.x<-10||p.y<-10||p.x>W+10||p.y>H+10)return;
      c.beginPath(); c.arc(p.x,p.y,e.r+anel/2,0,2*Math.PI); c.fillStyle=COR.papel; c.fill();
      c.beginPath(); c.arc(p.x,p.y,e.r-anel/2,0,2*Math.PI); c.fillStyle=e.cor; c.fill();});
  });
  /* legenda */
  const {faixas,motivos}=rotulosLegenda(), linhas=faixas.slice().reverse();
  c.font=`12px ${SANS}`;
  const larg=Math.max(...linhas.map(r=>c.measureText(r.txt).width),...motivos.map(([n,t])=>c.measureText(`${t} · ${nf.format(n)}`).width));
  const lw=Math.min(Math.max(240,larg+62),W-28);
  c.font=`600 13px ${SANS}`; const tit=quebra(i.n,lw-28).slice(0,3);
  const lh=40+17*tit.length+22*(linhas.length+motivos.length), lx=14, ly=H-lh-14;
  c.fillStyle='rgba(252,251,248,.96)'; c.strokeStyle='#D9D5CB'; c.lineWidth=1;
  c.beginPath(); (c.roundRect?c.roundRect(lx,ly,lw,lh,10):c.rect(lx,ly,lw,lh)); c.fill(); c.stroke();
  c.fillStyle='#15212E'; tit.forEach((t,k)=>c.fillText(t,lx+14,ly+24+17*k));
  let yy=ly+24+17*tit.length;
  c.fillStyle='#636A70'; c.font=`12px ${SANS}`; c.fillText(`${i.u||''} · ${i.ano||'s/ ano'}`,lx+14,yy); yy+=14;
  linhas.forEach(r=>{c.fillStyle=r.cor; c.fillRect(lx+14,yy,22,13); c.fillStyle='#15212E'; c.font=`12px ${SANS}`; c.fillText(r.txt,lx+44,yy+11); yy+=22;});
  motivos.forEach(([n,t])=>{c.fillStyle=COR.semdado; c.fillRect(lx+14,yy,22,13); c.fillStyle='#636A70'; c.fillText(`${t} · ${nf.format(n)}`,lx+44,yy+11); yy+=22;});
  c.restore();
  /* rodapé */
  c.fillStyle='#636A70'; c.font=`11.5px ${SANS}`;
  quebra(`Fonte: ${f.n||i.fonte}. Malhas: IBGE 2022 · SMUrb/PMPA. Atlas Metropolitano RMPA, versão 3.`,W-40).slice(0,2)
    .forEach((t,k)=>c.fillText(t,20,TOPO+H+20+15*k));
  const a=document.createElement('a');
  a.href=cv.toDataURL('image/png');
  a.download=`atlas-rmpa-${i.id}-${S.nivel}.png`; a.click();
  toast(S.camadas.base?'Mapa exportado (o mapa de fundo não entra na imagem).':'Mapa exportado.','ok');
}

/* ── Diagnóstico regional: as tabelas do template do Instituto Renner,
   montadas a partir dos indicadores, com fonte e ano em cada uma. */
const TABELAS_DIAG=[
  {sec:'6',t:'População, densidade e estrutura etária',c:['pop','pop_est_2026','dens_hab','pct_criancas_0_14','pct_jovens_15_29','pct_idosos_60','idx_envelhecimento']},
  {sec:'6',t:'Composição e grupos populacionais',c:['pct_mulheres','pct_preta_parda','pct_preta','indigenas','quilombolas','pct_fcu']},
  {sec:'6',t:'Famílias, idosos, deficiência e migração (Censo 2010, amostra, cálculo do Atlas)',c:['c10_dom_chefia_feminina','c10_idosos_sos','c10_deficiencia','c10_nao_naturais','c10_dom_bolsa','c10_pessoas_bolsa']},
  {sec:'7',t:'Pobreza, renda, desigualdade e trabalho (Censo 2010, cálculo do Atlas sobre os microdados)',c:['est_pobreza','est_extrema_pobreza','est_rdpc','est_gini','est_desocupacao','est_informalidade','est_conta_propria']},
  {sec:'7',t:'Renda e pobreza de 2010 publicadas pelo Atlas Brasil (referência)',c:['adh_renda_pc','adh_gini','adh_pobreza','adh_extrema_pobreza','adh_vulner_pobreza']},
  {sec:'7',t:'Juventude, famílias e vulnerabilidade (Atlas Brasil, Censo 2010)',c:['adh_vulner_pobreza','adh_nemnem_vulner','adh_desocup_18_24','adh_maes_chefes_sem_fund','adh_dep_idosos_vulner','adh_desloc_1h_vulner']},
  {sec:'7',t:'Trabalho e juventude por sexo e idade (Censo 2010, amostra, cálculo do Atlas)',c:['c10_desocup_mulheres','c10_desocup_homens','c10_desocup_18_24','c10_desocup_25_29','c10_nem_nem_15_24']},
  {sec:'7',t:'Renda e economia: dados recentes',c:['resp_renda','pib_pc','pct_vab_ind','pct_vab_serv','pct_vab_adm']},
  {sec:'8',t:'Dimensões da vulnerabilidade: indicadores-chave',c:['pct_fcu','pct_agua_rede','pct_esgoto_inadequado','taxa_analfabetismo','est_sem_fundamental_25','ubs_10mil','cvli_100mil','banda_larga_100hab']},
  {sec:'8',t:'Educação e desenvolvimento humano',c:['idhm','idhm_educacao','ideb_iniciais','ideb_finais','ideb_medio','adh_creche_0_3','adh_fora_escola_4_5']},
  {sec:'8',t:'Rua e moradia (Censo 2022)',c:['pct_ent_pav','pct_ent_ilum','pct_ent_calcada','pct_ent_rampa','pct_ent_arvore','pct_ent_onibus','pct_agua_naoenc','pct_sem_banheiro']},
  {sec:'10',t:'Rede de serviços registrada',c:['cnes_ubs','ubs_10mil','cnes_caps','cnes_hospitais','cnes_acolhimento','inep_escolas_publicas','inep_escolas_privadas']},
  {sec:'11',t:'Orçamento municipal para políticas sociais',c:['fin_receita_total','fin_transf_pct','gasto_saude_hab','gasto_atencao_basica_hab','gasto_assistencia_hab','gasto_seguranca_hab','gasto_trabalho_hab','gasto_educacao','gasto_educacao_infantil']},
];
const AUSENTES_DIAG={
  get '6'(){return getInd('c10_dom_chefia_feminina')
    ?'Chefia feminina, idosos que moram sós, deficiência, migração e Bolsa Família estão no Atlas só para 2010 (Censo, amostra). Não estão no Atlas: famílias monoparentais, população em situação de rua, famílias no Cadastro Único e o Bolsa Família atual.'
    :'Não estão no Atlas: total de famílias chefiadas por mulheres (há só as mães chefes sem fundamental, de 2010), famílias monoparentais, idosos que vivem sozinhos, pessoas com deficiência, migrantes, população em situação de rua, famílias no Cadastro Único e no Bolsa Família.';},
  get '7'(){return getInd('c10_desocup_mulheres')
    ?'A desocupação por sexo e idade e os jovens que não estudam nem trabalham estão no Atlas só para 2010 (Censo, amostra). Não estão no Atlas: dependência de transferências, microempreendedores, renda e pobreza de 2022 (os microdados de 2022 por município são de acesso controlado).'
    :'Não estão no Atlas: desocupação de mulheres, total de jovens que não estudam nem trabalham (há só os vulneráveis à pobreza, de 2010), dependência de transferências, microempreendedores, renda e pobreza de 2022.';},
  '8':'Mobilidade só em parte: o acesso a empregos, saúde e escolas do IPEA (2019) cobre Porto Alegre, por bairro e setor. Não estão no Atlas: segurança alimentar, documentação e acesso a direitos, cultura e lazer. Riscos climáticos só em parte: a camada de áreas de risco é a BATER de 2010 (Porto Alegre e Sapucaia do Sul); faltam a setorização do Serviço Geológico do Brasil e a mancha da enchente de 2024.',
  '10':'Não estão no Atlas: CRAS, CREAS, Centro POP, creches e vagas, transferências de renda por família, restaurantes populares, programas habitacionais, organizações comunitárias.',
  get '11'(){return 'Não estão no Atlas: '+(getInd('gasto_educacao')?'':'despesa em educação, ')+'equipes técnicas, conselhos e sistemas de informação.';}
};
function diagLinhas(){
  const fs=((S.geo.municipio||{}).features||[]).map(f=>f.properties)
    .filter(p=>S.muniFiltro==null||p.muni_id===S.muniFiltro);
  return fs.concat([regiaoProps()]);
}
function diagTabela(t){
  const cols=t.c.map(id=>getInd(id)).filter(Boolean);
  const fontes=[...new Set(cols.map(i=>`${(FONTES[i.fonte]||{}).s||i.fonte} (${i.ano})`))];
  /* "R$/mês (jul/2010)" vira "(R$/mês, jul/2010)", sem parêntese dentro de parêntese */
  const cab=['Município'].concat(cols.map(i=>i.n+(i.u&&!/^%$/.test(i.u)?` (${i.u.replace(/\s*\((.+)\)$/,', $1')})`:'')));
  const linhas=diagLinhas().map(p=>[p.nome].concat(cols.map(i=>{
    const v=p[i.id]; if(v==null)return '—';
    return i.id==='fin_receita_total'?fmtN(v/1e6,'dec0')+' mi':fmtN(+v,i.fmt);})));
  return {cab,linhas,fontes,cols};
}
let MATRIZ=null;
const CHAVE_MATRIZ='atlas_rmpa_matriz_v1';
function matrizPadrao(){
  const R=regiaoProps(), B=calculaBolsoes(), fs=((S.geo.municipio||{}).features||[]).map(f=>f.properties);
  const mx=(k)=>fs.reduce((a,p)=>p[k]!=null&&(a==null||p[k]>a[k])?p:a,null);
  const mn=(k)=>fs.reduce((a,p)=>p[k]!=null&&(a==null||p[k]<a[k])?p:a,null);
  const somaB=k=>B.reduce((a,b)=>a+(b[k]||0),0);
  /* saneamento: setores do quintil mais pobre contra os do mais rico */
  const {lim,com}=quintisSetores(), q1=com.filter(q=>q.resp_renda<=lim[0]), q5=com.filter(q=>q.resp_renda>lim[3]);
  const inad=g=>{const d=g.reduce((a,q)=>a+(q.dppo||0),0);return d?100*g.reduce((a,q)=>a+(q.esg_inadeq||0),0)/d:null;};
  const pop80=q1.filter(q=>q.pct_esgoto_adequado!=null&&q.pct_esgoto_adequado<80).reduce((a,q)=>a+q.pop,0);
  const fcuM=mx('pct_fcu'), sfB=B.reduce((a,b)=>b.sem_fund10!=null&&(a==null||b.sem_fund10>a.sem_fund10)?b:a,null);
  const deB=B.reduce((a,b)=>b.desoc10!=null&&(a==null||b.desoc10>a.desoc10)?b:a,null);
  const sfMin=mn('est_sem_fundamental_25'), sfMax=mx('est_sem_fundamental_25');
  const cv=mx('cvli_100mil'), asMin=mn('gasto_assistencia_hab'), asMax=mx('gasto_assistencia_hab');
  return [
    {p:'Moradia precária em favelas e comunidades urbanas',g:5,u:4,t:3,a:5,
     e:`${fmtN(R.fcu_pop,'int')} pessoas (${fmtN(R.pct_fcu,'pct1')}) em favelas e comunidades urbanas; maior parcela em ${fcuM.nome} (${fmtN(fcuM.pct_fcu,'pct1')}). Censo 2022.`},
    {p:'Saneamento inadequado nos setores pobres',g:5,u:4,t:3,a:4,
     e:`Esgoto inadequado em ${fmtN(inad(q1),'pct1')} dos domicílios dos setores mais pobres, contra ${fmtN(inad(q5),'pct1')} nos mais ricos; ${fmtN(pop80,'int')} pessoas em setores pobres com menos de 80% de esgoto adequado. Censo 2022.`},
    {p:'Baixa escolaridade de adultos',g:4,u:3,t:3,a:5,
     e:`Adultos sem fundamental completo: de ${fmtN(sfMin.est_sem_fundamental_25,'pct1')} (${sfMin.nome}) a ${fmtN(sfMax.est_sem_fundamental_25,'pct1')} (${sfMax.nome}); até ${fmtN(sfB.sem_fund10,'pct1')} no bolsão ${sfB.nome}. Censo 2010.`},
    {p:'Inserção no trabalho e renda, sobretudo de jovens',g:4,u:4,t:3,a:4,
     e:`${fmtN(somaB('jov'),'int')} jovens de 15 a 29 anos nos bolsões (2022); maior desocupação entre os bolsões: ${fmtN(deB.desoc10,'pct1')} em ${deB.nome} (2010).`},
    {p:'Primeira infância e cuidado',g:4,u:4,t:3,a:4,
     e:`${fmtN(somaB('cri'),'int')} crianças de 0 a 14 anos nos bolsões (2022). A oferta de creche ainda não está no Atlas.`},
    {p:'Violência letal',g:5,u:4,t:3,a:3,
     e:`${fmtN(R.seg_cvli,'int')} vítimas de CVLI em 2025; maior taxa em ${cv.nome} (${fmtN(cv.cvli_100mil,'dec1')} por 100 mil). SSP/RS.`},
    {p:'Rede de proteção social com capacidade desigual',g:3,u:3,t:3,a:4,
     e:`Despesa em assistência social por habitante de ${fmtN(asMin.gasto_assistencia_hab,'brl0')} (${asMin.nome}) a ${fmtN(asMax.gasto_assistencia_hab,'brl0')} (${asMax.nome}). SICONFI 2024.`},
  ];
}
function matrizCarrega(){
  if(MATRIZ)return MATRIZ;
  try{const s=JSON.parse(localStorage.getItem(CHAVE_MATRIZ)||'null'); if(Array.isArray(s)&&s.length)return MATRIZ=s;}catch(e){}
  return MATRIZ=matrizPadrao();
}
function matrizGuarda(){try{localStorage.setItem(CHAVE_MATRIZ,JSON.stringify(MATRIZ));}catch(e){}}
const totalM=r=>(+r.g||0)+(+r.u||0)+(+r.t||0)+(+r.a||0);
function renderDiag(aba){
  S.diagAba=aba||S.diagAba||'tabelas';
  const mf=S.muniFiltro!=null&&MUNIS_LISTA?MUNIS_LISTA.nomes[S.muniFiltro]:null;
  const abas=`<div class="seg diag-abas" role="tablist">
    <button data-aba="tabelas" aria-pressed="${S.diagAba==='tabelas'}">Tabelas do diagnóstico</button>
    <button data-aba="matriz" aria-pressed="${S.diagAba==='matriz'}">Matriz de priorização</button></div>`;
  let corpo='';
  if(S.diagAba==='tabelas'){
    corpo=`<div class="note">Tabelas das seções 6, 7, 8, 10 e 11 do template de diagnóstico regional, para
      ${mf?`<b>${esc(mf)}</b> (com a região como referência)`:'os <b>sete municípios</b> e a região'}.
      Para outro recorte, use o filtro de município no topo. Os valores de 2010 não se somam: na linha da região, ficam vazios.</div>
      <div class="btn-row" style="margin:10px 0"><button class="btn pri" id="diagDoc">Baixar para Word (.doc)</button>
      <button class="btn" id="diagCSV">Baixar planilha (CSV)</button></div>`+
      TABELAS_DIAG.map((t,k)=>{const d=diagTabela(t);
        const ult=k===TABELAS_DIAG.length-1||TABELAS_DIAG[k+1].sec!==t.sec;
        return `<h3 class="sec">Seção ${t.sec} · ${esc(t.t)}</h3>
        <div class="tb-scroll"><table class="tb diag"><thead><tr>${d.cab.map((h,j)=>`<th${j?' style="text-align:right"':''}>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${d.linhas.map((l,j)=>`<tr${j===d.linhas.length-1?' class="tot"':''}>${l.map((v,c)=>c?`<td class="n">${esc(v)}</td>`:`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <p class="diag-fonte">Fonte: ${esc(d.fontes.join('; '))}, via Atlas Metropolitano RMPA.</p>
        ${ult&&AUSENTES_DIAG[t.sec]?`<p class="diag-falta">${esc(AUSENTES_DIAG[t.sec])}</p>`:''}`;}).join('');
  }else{
    const M=matrizCarrega(), ord=M.map((r,k)=>({r,k})).sort((a,b)=>totalM(b.r)-totalM(a.r));
    const sel=(k,c,v)=>`<select data-k="${k}" data-c="${c}" aria-label="${c}">${[1,2,3,4,5].map(n=>`<option${+v===n?' selected':''}>${n}</option>`).join('')}</select>`;
    corpo=`<div class="note">Notas de 1 (baixo) a 5 (alto). A evidência de cada problema vem do Atlas e é recalculada
      com os dados. As notas iniciais são a proposta do grupo; mudanças ficam salvas <b>só neste navegador</b> —
      use "Baixar" para compartilhar. Tendência: 3 (neutra) enquanto o Atlas não comparar 2010 com 2022.</div>
      <div class="btn-row" style="margin:10px 0"><button class="btn pri" id="mxNovo">Adicionar problema</button>
      <button class="btn" id="mxCSV">Baixar (CSV)</button><button class="btn" id="diagDoc2">Baixar para Word (.doc)</button>
      <button class="btn" id="mxReset">Voltar às notas iniciais</button></div>
      <div class="tb-scroll"><table class="tb diag mx"><thead><tr><th>Problema</th><th>Gravidade</th><th>Urgência</th><th>Tendência</th>
      <th>Pessoas afetadas</th><th style="text-align:right">Total</th><th>Evidência no Atlas</th><th></th></tr></thead><tbody>
      ${ord.map(({r,k})=>`<tr><td>${r.novo?`<input class="mx-p" data-k="${k}" value="${esc(r.p)}" aria-label="Problema">`:`<b>${esc(r.p)}</b>`}</td>
        <td>${sel(k,'g',r.g)}</td><td>${sel(k,'u',r.u)}</td><td>${sel(k,'t',r.t)}</td><td>${sel(k,'a',r.a)}</td>
        <td class="n"><b>${totalM(r)}</b></td>
        <td style="font-size:12px;color:var(--txt2)">${r.novo?`<input class="mx-e" data-k="${k}" value="${esc(r.e||'')}" placeholder="evidência e fonte" aria-label="Evidência">`:esc(r.e)}</td>
        <td>${r.novo?`<button class="btn" data-del="${k}" title="Remover">×</button>`:''}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="diag-fonte">Pessoas afetadas: 1 = menos de 5 mil; 2 = 5 a 20 mil; 3 = 20 a 50 mil; 4 = 50 a 150 mil; 5 = mais de 150 mil.</p>`;
  }
  $('#diagBody').innerHTML=abas+corpo;
  $$('#diagBody [data-aba]').forEach(b=>b.onclick=()=>renderDiag(b.dataset.aba));
  const docB=$('#diagDoc')||$('#diagDoc2'); if(docB)docB.onclick=exportaDiagDoc;
  const csv=$('#diagCSV'); if(csv)csv.onclick=()=>{
    const L=[];
    TABELAS_DIAG.forEach(t=>{const d=diagTabela(t);L.push([`Seção ${t.sec} - ${t.t}`]);L.push(d.cab);d.linhas.forEach(l=>L.push(l));
      L.push(['Fonte: '+d.fontes.join('; ')]);L.push([]);});
    baixaCSV(L,'diagnostico-regional-tabelas.csv');};
  if(S.diagAba==='matriz'){
    $$('#diagBody select[data-k]').forEach(s=>s.onchange=()=>{MATRIZ[+s.dataset.k][s.dataset.c]=+s.value;matrizGuarda();renderDiag();});
    $$('#diagBody .mx-p').forEach(x=>x.onchange=()=>{MATRIZ[+x.dataset.k].p=x.value;matrizGuarda();});
    $$('#diagBody .mx-e').forEach(x=>x.onchange=()=>{MATRIZ[+x.dataset.k].e=x.value;matrizGuarda();});
    $$('#diagBody [data-del]').forEach(b=>b.onclick=()=>{MATRIZ.splice(+b.dataset.del,1);matrizGuarda();renderDiag();});
    $('#mxNovo').onclick=()=>{MATRIZ.push({p:'Novo problema',g:3,u:3,t:3,a:3,e:'',novo:true});matrizGuarda();renderDiag();};
    $('#mxReset').onclick=()=>{MATRIZ=matrizPadrao();matrizGuarda();renderDiag();};
    $('#mxCSV').onclick=()=>baixaCSV([['problema','gravidade','urgencia','tendencia','pessoas_afetadas','total','evidencia']].concat(
      matrizCarrega().slice().sort((a,b)=>totalM(b)-totalM(a)).map(r=>[r.p,r.g,r.u,r.t,r.a,totalM(r),r.e||''])),'matriz-priorizacao.csv');
  }
}
function exportaDiagDoc(){
  const mf=S.muniFiltro!=null&&MUNIS_LISTA?MUNIS_LISTA.nomes[S.muniFiltro]:null;
  const tab=(cab,linhas,dir)=>`<table><tr>${cab.map((h,j)=>`<th${dir&&j?' class="n"':''}>${esc(h)}</th>`).join('')}</tr>${
    linhas.map(l=>`<tr>${l.map((v,j)=>`<td${dir&&j?' class="n"':''}>${esc(String(v))}</td>`).join('')}</tr>`).join('')}</table>`;
  let h='';
  TABELAS_DIAG.forEach((t,k)=>{const d=diagTabela(t);
    h+=`<h3>Seção ${t.sec} – ${esc(t.t)}</h3>${tab(d.cab,d.linhas,true)}<p class="f">Fonte: ${esc(d.fontes.join('; '))}, via Atlas Metropolitano RMPA.</p>`;
    if((k===TABELAS_DIAG.length-1||TABELAS_DIAG[k+1].sec!==t.sec)&&AUSENTES_DIAG[t.sec])h+=`<p class="f"><i>${esc(AUSENTES_DIAG[t.sec])}</i></p>`;});
  const M=matrizCarrega().slice().sort((a,b)=>totalM(b)-totalM(a));
  h+=`<h3>Seção 15 – Matriz de priorização</h3>`+tab(['Problema','Gravidade','Urgência','Tendência','Pessoas afetadas','Total','Evidência no Atlas'],
    M.map(r=>[r.p,r.g,r.u,r.t,r.a,totalM(r),r.e||'']),false)+
    `<p class="f">Notas de 1 (baixo) a 5 (alto). Pessoas afetadas: 1 = menos de 5 mil; 2 = 5 a 20 mil; 3 = 20 a 50 mil; 4 = 50 a 150 mil; 5 = mais de 150 mil.</p>`;
  const doc=`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8">
<title>Diagnóstico regional</title><style>body{font-family:"Times New Roman",serif;font-size:11pt}h2{font-size:14pt}h3{font-size:12pt;margin:14pt 0 4pt}
table{border-collapse:collapse;width:100%;font-size:9pt}th,td{border:1px solid #8c8c8c;padding:2pt 4pt;vertical-align:top}th{background:#e7e6e6;text-align:left}
.n{text-align:right}.f{font-size:8.5pt;color:#404040;margin:3pt 0 8pt}</style></head><body>
<h2>Diagnóstico regional – tabelas geradas pelo Atlas Metropolitano RMPA</h2>
<p>Recorte: ${esc(mf||'sete municípios (Porto Alegre, Canoas, Gravataí, Sapucaia do Sul, Cachoeirinha, Guaíba e Esteio)')} e região. Gerado em ${new Date().toLocaleDateString('pt-BR')}.</p>
${h}</body></html>`;
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob(['﻿'+doc],{type:'application/msword'}));
  a.download='diagnostico-regional-atlas-rmpa.doc'; a.click(); URL.revokeObjectURL(a.href);
  toast('Arquivo exportado.','ok');
}

/* ═══════════════════════ 26. DADOS AO VIVO: EXTRAÇÃO PELO NAVEGADOR ═══════
   O Atlas busca os dados direto nas fontes, sem script e sem arquivo
   intermediário. Cada fonte passa pelas mesmas conferências dos scripts de
   extracao/: os sete municípios presentes, cada valor na faixa possível,
   identidades contábeis fechando. Se a fonte não responder, se o navegador
   não puder ler (CORS) ou se o formato mudar, o Atlas mantém o dado embarcado
   em dados/*.js e diz o motivo. Nada é estimado nem completado.

   Base dos Dados: espelho público no Google Cloud Storage, lido pela API JSON,
   que libera o acesso a partir de qualquer página (inclusive arquivo local).
   IBGE e Tesouro: APIs públicas; o acesso direto depende de o servidor
   permitir. Se não permitir, a fonte aparece como bloqueada e nada muda. */
const AO_VIVO={validadeDias:30, rodando:false, progresso:'', auto:true};
try{AO_VIVO.auto=localStorage.getItem(AO_VIVO_CHAVE+'_auto')!=='0';}catch(e){}
const COD7=()=>MUNIS_LISTA.ids.map(String);
const nomeDoCod=c=>MUNIS_LISTA.nomes[MUNIS_LISTA.ids.map(String).indexOf(String(c))];
class ErroFonte extends Error{constructor(tipo,msg){super(msg);this.tipo=tipo;}}
const falhaFormato=msg=>{throw new ErroFonte('formato',msg);};

async function buscaFonte(url,opc){
  let r;
  try{r=await fetch(url,Object.assign({cache:'no-store'},opc||{}));}
  catch(e){throw new ErroFonte('rede','o navegador não conseguiu acessar a fonte (sem internet, ou a fonte não permite leitura direta pelo navegador)');}
  if(!r.ok)throw new ErroFonte('rede',`a fonte respondeu HTTP ${r.status}`);
  return r;
}

/* uma linha de CSV com aspas (RFC 4180) */
function csvCampos(l){
  const out=[]; let cur='',q=false;
  for(let i=0;i<l.length;i++){
    const ch=l[i];
    if(q){ if(ch==='"'){ if(l[i+1]==='"'){cur+='"';i++;} else q=false; } else cur+=ch; }
    else if(ch==='"')q=true;
    else if(ch===','){out.push(cur);cur='';}
    else cur+=ch;
  }
  out.push(cur); return out;
}
/* Lê um .csv.gz do espelho da Base dos Dados em fluxo: descompacta no próprio
   navegador e só monta as linhas dos sete municípios. Arquivos de dezenas de
   MB passam sem ocupar memória inteira. */
async function linhasBD(objeto,rotulo){
  const url='https://storage.googleapis.com/storage/v1/b/basedosdados-public/o/'+
    encodeURIComponent('one-click-download/'+objeto)+'?alt=media';
  const r=await buscaFonte(url);
  if(typeof DecompressionStream==='undefined')throw new ErroFonte('rede','este navegador não descompacta arquivos .gz');
  const total=+r.headers.get('content-length')||0; let lidos=0;
  const conta=new TransformStream({transform(ch,c){lidos+=ch.byteLength;
    AO_VIVO.progresso=`${rotulo}: ${Math.round(lidos/1e6)}${total?' de '+Math.round(total/1e6):''} MB`;aoVivoStatus();c.enqueue(ch);}});
  const rd=r.body.pipeThrough(conta).pipeThrough(new DecompressionStream('gzip'))
    .pipeThrough(new TextDecoderStream()).getReader();
  const cods=COD7(); let resto='',cab=null; const linhas=[];
  const trata=l=>{
    if(!l)return;
    if(!cab){cab=csvCampos(l);return;}
    if(!cods.some(c=>l.includes(c)))return;
    const v=csvCampos(l), o={}; cab.forEach((c,k)=>o[c]=v[k]);
    if(cods.includes(o.id_municipio))linhas.push(o);
  };
  for(;;){
    const {value,done}=await rd.read();
    if(value){resto+=value; let i;
      while((i=resto.indexOf('\n'))>=0){trata(resto.slice(0,i).replace(/\r$/,''));resto=resto.slice(i+1);}}
    if(done)break;
  }
  trata(resto.trim());
  if(!cab)falhaFormato('arquivo vazio');
  return {cab,linhas};
}
const num=v=>{if(v==null)return null;const s=String(v).trim();if(!s||/^(nan|none|inf|-inf)$/i.test(s))return null;
  const x=Number(s);return Number.isFinite(x)?x:null;};
function exigeColunas(cab,cols,fonte){const f=cols.filter(c=>!cab.includes(c));
  if(f.length)falhaFormato(`${fonte}: faltam as colunas ${f.join(', ')}`);}
function exigeSete(cods,fonte){const f=COD7().filter(c=>!cods.has(c)).map(nomeDoCod);
  if(f.length)falhaFormato(`${fonte}: sem dados para ${f.join(', ')}`);}
const metaBD=(fonte,ano,obj,extra)=>Object.assign({fonte,ano,via:'Base dos Dados, consulta direta pelo navegador',
  url:'https://storage.googleapis.com/basedosdados-public/one-click-download/'+obj},extra||{});

/* ---- Atlas Brasil 2010: IDHM e indicadores de vulnerabilidade ---- */
const ADH_CAMPOS={adh_nemnem_vulner:['taxa_nest_ntrab_vulner_15_24',0,100],adh_maes_chefes_sem_fund:['taxa_mulheres_chefe_filho_15m',0,100],
  adh_desloc_1h_vulner:['taxa_vulner_desloc_1_hora',0,100],adh_dep_idosos_vulner:['taxa_dom_vulner_dep_idoso',0,100],
  adh_vulner_pobreza:['prop_vulner_pobreza',0,100],adh_desocup_18_24:['taxa_desocupacao_18_24',0,100],adh_creche_0_3:['taxa_freq_0_3',0,100],
  adh_fora_escola_4_5:['taxa_criancas_fora_escola_4_5',0,100],adh_maes_15_17:['taxa_mulheres_com_filho_15_17',0,100],
  adh_renda_pc:['renda_pc',0,20000],adh_gini:['indice_gini',0,1],adh_pobreza:['prop_pobreza',0,100],
  adh_extrema_pobreza:['prop_pobreza_extrema',0,100]};
const IDHM_CAMPOS={idhm:['idhm',0,1],idhm_renda:['idhm_r',0,1],idhm_educacao:['idhm_e',0,1],
  idhm_longevidade:['idhm_l',0,1],idhm_esperanca_vida:['expectativa_vida',40,95]};
async function extraiADH(){
  const obj='mundo_onu_adh/municipio/municipio.csv.gz';
  const {cab,linhas}=await linhasBD(obj,'Atlas Brasil');
  exigeColunas(cab,['ano','id_municipio',...Object.values(ADH_CAMPOS).map(x=>x[0]),...Object.values(IDHM_CAMPOS).map(x=>x[0])],'Atlas Brasil');
  const l10=linhas.filter(r=>r.ano==='2010'); const vistos=new Set();
  const indices={}, complementos={};
  l10.forEach(r=>{
    if(vistos.has(r.id_municipio))falhaFormato('Atlas Brasil: município repetido em 2010');
    vistos.add(r.id_municipio);
    const I=indices[r.id_municipio]={idhm_ano:2010}, C=complementos[r.id_municipio]={};
    for(const k in IDHM_CAMPOS){const [col,lo,hi]=IDHM_CAMPOS[k],v=num(r[col]);
      if(v==null)continue; if(v<lo||v>hi)falhaFormato(`Atlas Brasil: ${col} = ${v}, fora de ${lo}–${hi}`); I[k]=Math.round(v*1e4)/1e4;}
    for(const k in ADH_CAMPOS){const [col,lo,hi]=ADH_CAMPOS[k],v=num(r[col]);
      if(v==null)continue; if(v<lo||v>hi)falhaFormato(`Atlas Brasil: ${col} = ${v}, fora de ${lo}–${hi}`);
      C[k]=hi===1?Math.round(v*1e4)/1e4:Math.round(v*100)/100;}
  });
  exigeSete(vistos,'Atlas Brasil');
  return {dados:{indices,complementos},meta:Object.assign(metaBD('Atlas do Desenvolvimento Humano no Brasil (PNUD, IPEA, FJP)',2010,obj),
    {indices:{fonte:'IDHM — Atlas do Desenvolvimento Humano no Brasil',publicador:'PNUD, IPEA e Fundação João Pinheiro',ano:2010,
      url:'Base dos Dados, mundo_onu_adh.municipio, consulta direta pelo navegador'}}),resumo:'2010 · IDHM e 13 indicadores'};
}

/* ---- IDEB da rede pública: a edição mais recente com os sete municípios ---- */
const IDEB_ETAPAS={'fundamental|iniciais (1-5)':'ideb_iniciais','fundamental|finais (6-9)':'ideb_finais','medio|todos (1-4)':'ideb_medio'};
async function extraiIDEB(){
  const obj='br_inep_ideb/municipio/municipio.csv.gz';
  const {cab,linhas}=await linhasBD(obj,'IDEB');
  exigeColunas(cab,['ano','id_municipio','rede','ensino','anos_escolares','ideb'],'IDEB');
  const pub=linhas.filter(r=>r.rede==='publica'&&num(r.ideb)!=null);
  const anos=[...new Set(pub.map(r=>+r.ano))].sort((a,b)=>b-a);
  const ano=anos.find(a=>new Set(pub.filter(r=>+r.ano===a&&r.anos_escolares==='iniciais (1-5)').map(r=>r.id_municipio)).size===7);
  if(!ano)falhaFormato('IDEB: nenhuma edição com os sete municípios');
  const out={}, vistos=new Set();
  pub.filter(r=>+r.ano===ano).forEach(r=>{
    const k=IDEB_ETAPAS[r.ensino+'|'+r.anos_escolares]; if(!k)return;
    const v=num(r.ideb); if(v<0||v>10)falhaFormato(`IDEB: ${v} fora de 0–10`);
    const o=out[r.id_municipio]||(out[r.id_municipio]={});
    if(k in o)falhaFormato('IDEB: valor repetido para '+nomeDoCod(r.id_municipio));
    o[k]=v; vistos.add(r.id_municipio);
  });
  exigeSete(vistos,'IDEB');
  return {dados:{complementos:out},meta:metaBD('INEP — Índice de Desenvolvimento da Educação Básica',ano,obj),resumo:`edição ${ano}`};
}

/* ---- Anatel: densidade de banda larga fixa no último mês com os sete ---- */
async function extraiAnatel(){
  const obj='br_anatel_banda_larga_fixa/densidade_municipio/densidade_municipio.csv.gz';
  const {cab,linhas}=await linhasBD(obj,'Anatel');
  exigeColunas(cab,['ano','mes','id_municipio','densidade'],'Anatel');
  const per=r=>(+r.ano)*100+(+r.mes);
  const pers=[...new Set(linhas.map(per))].sort((a,b)=>b-a);
  const ult=pers.find(p=>new Set(linhas.filter(r=>per(r)===p&&num(r.densidade)!=null).map(r=>r.id_municipio)).size===7);
  if(!ult)falhaFormato('Anatel: nenhum mês com os sete municípios');
  const out={};
  linhas.filter(r=>per(r)===ult).forEach(r=>{const v=num(r.densidade);
    if(v==null||v<0||v>100)falhaFormato(`Anatel: densidade inválida (${r.densidade})`);
    if(out[r.id_municipio])falhaFormato('Anatel: município repetido no mesmo mês');
    out[r.id_municipio]={banda_larga_100hab:Math.round(v*100)/100};});
  const ano=Math.floor(ult/100), mes=ult%100;
  return {dados:{complementos:out},meta:metaBD('Anatel — Acessos de banda larga fixa (densidade por 100 habitantes)',ano,obj,{mes}),
    resumo:`${String(mes).padStart(2,'0')}/${ano}`};
}

/* ---- áreas de risco BATER (geometria em WKT) ---- */
function wktParaGeoJSON(w){
  const t=w.trim(), tipo=t.slice(0,t.indexOf('(')).trim().toUpperCase();
  const corpo=t.slice(t.indexOf('('));
  const anel=s=>s.replace(/[()]/g,'').split(',').map(par=>par.trim().split(/\s+/).map(Number));
  const aneis=s=>s.match(/\([^()]*\)/g).map(anel);
  if(tipo==='POLYGON')return {type:'Polygon',coordinates:aneis(corpo)};
  if(tipo==='MULTIPOLYGON'){
    const polys=[]; let prof=0,ini=-1;
    for(let i=1;i<corpo.length-1;i++){const ch=corpo[i];
      if(ch==='('){if(prof===0)ini=i;prof++;}
      else if(ch===')'){prof--;if(prof===0)polys.push(aneis(corpo.slice(ini,i+1)));}}
    return {type:'MultiPolygon',coordinates:polys};
  }
  falhaFormato('área de risco com geometria '+tipo);
}
async function extraiBATER(){
  const obj='br_geobr_mapas/area_risco_desastre/area_risco_desastre.csv.gz';
  const {cab,linhas}=await linhasBD(obj,'Áreas de risco');
  exigeColunas(cab,['geocodigo_bater','origem','acuracia','observacao','id_municipio','geometria'],'Áreas de risco');
  const risco=linhas.sort((a,b)=>a.geocodigo_bater.localeCompare(b.geocodigo_bater)).map(r=>{
    const gj=wktParaGeoJSON(r.geometria);
    const coords=gj.type==='Polygon'?[gj.coordinates]:gj.coordinates;
    if(!coords.length||coords.some(p=>!p.length||p[0].length<4||p[0].some(c=>c.length<2||c.some(x=>!Number.isFinite(x)))))
      falhaFormato('Áreas de risco: geometria inválida em '+r.geocodigo_bater);
    return {cod:r.geocodigo_bater,muni:r.id_municipio,origem:r.origem,acuracia:r.acuracia,obs:r.observacao||null,gj};
  });
  return {dados:{risco},meta:metaBD('IBGE e CEMADEN — População em áreas de risco no Brasil (BATER)',2010,obj),resumo:`${risco.length} áreas`};
}

/* ---- IBGE, API de agregados (SIDRA): população estimada e PIB ---- */
async function agregadoIBGE(tabela,periodos,variaveis){
  const url=`https://servicodados.ibge.gov.br/api/v3/agregados/${tabela}/periodos/${periodos}/variaveis/${variaveis}`+
    `?localidades=N6[${COD7().join(',')}]`;
  const j=await (await buscaFonte(url)).json().catch(()=>falhaFormato(`IBGE ${tabela}: resposta não é JSON`));
  if(!Array.isArray(j))falhaFormato(`IBGE ${tabela}: formato inesperado`);
  const out={};                             /* variavel -> ano -> cod -> valor */
  j.forEach(v=>(v.resultados||[]).forEach(r=>(r.series||[]).forEach(s=>{
    const cod=String((s.localidade||{}).id);
    for(const ano in (s.serie||{})){const x=num(s.serie[ano]); if(x==null)continue;
      ((out[v.id]||(out[v.id]={}))[ano]||(out[v.id][ano]={}))[cod]=x;}
  })));
  return out;
}
async function extraiPopIBGE(){
  const d=(await agregadoIBGE(6579,-1,9324))['9324']||falhaFormato('IBGE 6579: sem a variável 9324');
  const ano=Math.max(...Object.keys(d).map(Number)); const v=d[ano];
  exigeSete(new Set(Object.keys(v)),'IBGE 6579');
  const out={};
  for(const c of COD7()){
    const p22=POP_MUNI[nomeDoCod(c)], x=v[c];
    if(!Number.isInteger(x)||x<=0)falhaFormato(`IBGE 6579: população inválida para ${nomeDoCod(c)}`);
    if(p22&&(x/p22<0.9||x/p22>1.25))falhaFormato(`IBGE 6579: ${nomeDoCod(c)} com ${x}, longe do Censo 2022 (${p22})`);
    out[c]={pop_est_2026:x};
  }
  return {dados:{servicos:out},meta:{chave:'populacao',fonte:'IBGE — Estimativas da População (SIDRA, tabela 6579)',ano,
    via:'API de agregados do IBGE, consulta direta pelo navegador',url:'https://sidra.ibge.gov.br/tabela/6579'},resumo:`estimativa de ${ano}`};
}
/* PIB: as variáveis são conferidas pelas identidades das contas regionais —
   PIB = VAB + impostos e VAB = soma dos setores. Código de variável errado
   não passa. */
const PIB_VAR={37:'pib',498:'vab',513:'vab_agro',517:'vab_ind',6575:'vab_serv',525:'vab_adm',543:'impostos'};
async function extraiPIB(){
  const d=await agregadoIBGE(5938,-1,Object.keys(PIB_VAR).join('|'));
  const anos=Object.keys(d['37']||{}).map(Number); if(!anos.length)falhaFormato('IBGE 5938: sem PIB');
  const ano=Math.max(...anos);
  const base=(await agregadoIBGE(5938,2013,37))['37']; const b13=(base||{})['2013']||falhaFormato('IBGE 5938: sem o PIB de 2013');
  const out={}, serv={};
  for(const c of COD7()){
    const o={}; for(const id in PIB_VAR){const v=((d[id]||{})[ano]||{})[c]; if(v==null)falhaFormato(`IBGE 5938: falta ${PIB_VAR[id]} de ${nomeDoCod(c)}`); o[PIB_VAR[id]]=v;}
    const tol=x=>Math.max(2,Math.abs(x)*0.002);
    if(Math.abs(o.vab+o.impostos-o.pib)>tol(o.pib))falhaFormato(`IBGE 5938: PIB ≠ VAB + impostos em ${nomeDoCod(c)}`);
    if(Math.abs(o.vab_agro+o.vab_ind+o.vab_serv+o.vab_adm-o.vab)>tol(o.vab))falhaFormato(`IBGE 5938: VAB ≠ soma dos setores em ${nomeDoCod(c)}`);
    if(b13[c]==null)falhaFormato('IBGE 5938: sem PIB de 2013 de '+nomeDoCod(c));
    o.pib_ant=b13[c]; out[nomeDoCod(c)]=o;
    serv[c]={agro_vab:o.vab_agro,agro_participacao_vab:Math.round(10000*o.vab_agro/o.vab)/100};
  }
  return {dados:{pib:out,servicos:serv},meta:{chave:'agro',fonte:'IBGE — PIB dos Municípios (SIDRA, tabela 5938)',ano,ano_base:2013,
    via:'API de agregados do IBGE, consulta direta pelo navegador',url:'https://sidra.ibge.gov.br/tabela/5938'},resumo:`${ano}`};
}

/* ---- Tesouro, SICONFI: Declaração de Contas Anuais ---- */
const SICONFI_URL='https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca';
async function dcaDe(cod,ano){
  let url=`${SICONFI_URL}?an_exercicio=${ano}&id_ente=${cod}`, itens=[], voltas=0;
  while(url&&voltas++<20){
    const j=await (await buscaFonte(url)).json().catch(()=>falhaFormato('SICONFI: resposta não é JSON'));
    itens=itens.concat(j.items||[]);
    const prox=(j.links||[]).find(l=>l.rel==='next');
    url=j.hasMore&&prox?prox.href:null;
  }
  return itens;
}
const SICONFI_FUNCOES={gasto_saude:'10 - Saúde',gasto_atencao_basica:'10.301 - Atenção Básica',gasto_educacao:'12 - Educação',
  gasto_ensino_fundamental:'12.361 - Ensino Fundamental',gasto_educacao_infantil:'12.365 - Educação Infantil',
  gasto_eja:'12.366 - Educação de Jovens e Adultos',gasto_assistencia:'08 - Assistência Social',
  gasto_assistencia_comunitaria:'08.244 - Assistência Comunitária',gasto_seguranca:'06 - Segurança Pública',
  gasto_trabalho:'11 - Trabalho',gasto_agricultura:'20 - Agricultura'};
function financasDaDCA(it,nome){
  const um=(anexo,coluna,f)=>{const c=it.filter(x=>x.anexo===anexo&&x.coluna===coluna&&f(x));
    if(c.length!==1)falhaFormato(`SICONFI ${nome}: esperado 1 valor em ${anexo}, obtidos ${c.length}`);
    const v=num(c[0].valor); if(v==null)falhaFormato(`SICONFI ${nome}: valor vazio`); return Math.round(v*100)/100;};
  const rec=cod=>um('DCA-Anexo I-C','Receitas Brutas Realizadas',x=>x.cod_conta===cod);
  const desp=cod=>um('DCA-Anexo I-D','Despesas Empenhadas',x=>x.cod_conta===cod);
  const fun=conta=>{const c=it.filter(x=>x.anexo==='DCA-Anexo I-E'&&x.coluna==='Despesas Empenhadas'&&x.conta===conta);
    if(c.length>1)falhaFormato(`SICONFI ${nome}: função duplicada ${conta}`);
    return c.length?Math.round(num(c[0].valor)*100)/100:0;};      /* linha omitida na DCA = zero, como no script */
  const o={fin_receita_total:rec('ReceitasExcetoIntraOrcamentarias'),fin_receita_corrente:rec('RO1.0.0.0.00.0.0'),
    fin_receita_tributaria:rec('RO1.1.0.0.00.0.0'),fin_transferencias:rec('RO1.7.0.0.00.0.0'),
    fin_despesa_total:desp('TotalDespesas'),fin_investimentos:desp('DO4.4.00.00.00.00')};
  o.fin_resultado_orcamentario=Math.round(100*(o.fin_receita_total-o.fin_despesa_total))/100;
  for(const k in SICONFI_FUNCOES)o[k]=fun(SICONFI_FUNCOES[k]);
  if(!o.gasto_educacao)falhaFormato(`SICONFI ${nome}: função '12 - Educação' não encontrada`);
  if(o.fin_receita_corrente>o.fin_receita_total||o.fin_receita_tributaria>o.fin_receita_corrente||
     o.fin_transferencias>o.fin_receita_corrente||o.gasto_atencao_basica>o.gasto_saude||
     o.gasto_assistencia_comunitaria>o.gasto_assistencia)falhaFormato(`SICONFI ${nome}: contas incoerentes`);
  return o;
}
async function extraiSICONFI(){
  const hoje=new Date().getFullYear();
  for(const ano of [hoje-1,hoje-2]){
    const out={}; let completo=true;
    for(const c of COD7()){
      AO_VIVO.progresso=`SICONFI ${ano}: ${nomeDoCod(c)}`; aoVivoStatus();
      const it=await dcaDe(c,ano);
      if(!it.length){completo=false;break;}
      out[c]=financasDaDCA(it,nomeDoCod(c));
    }
    if(completo)return {dados:{servicos:out},meta:{chave:'siconfi',fonte:'STN — SICONFI, Declaração das Contas Anuais',ano,
      via:'API do SICONFI, consulta direta pelo navegador',url:SICONFI_URL},resumo:`DCA ${ano}`};
  }
  falhaFormato('SICONFI: nenhum exercício recente com os sete municípios');
}

const FONTES_AO_VIVO=[
  {id:'adh',nome:'Atlas Brasil 2010: IDHM e vulnerabilidade',via:'Base dos Dados',f:extraiADH},
  {id:'ideb',nome:'IDEB da rede pública',via:'Base dos Dados',f:extraiIDEB},
  {id:'anatel',nome:'Banda larga fixa (Anatel)',via:'Base dos Dados',f:extraiAnatel},
  {id:'bater',nome:'Áreas de risco (IBGE e CEMADEN)',via:'Base dos Dados',f:extraiBATER},
  {id:'ibge_pop',nome:'População estimada (IBGE)',via:'API do IBGE',f:extraiPopIBGE},
  {id:'ibge_pib',nome:'PIB dos Municípios (IBGE)',via:'API do IBGE',f:extraiPIB},
  {id:'siconfi',nome:'Finanças municipais, com educação (SICONFI)',via:'API do Tesouro',f:extraiSICONFI}
];

/* Edição carregada hoje de cada fonte (embarcada ou de consulta anterior).
   Resultado mais antigo que isso não substitui nada. */
function edicaoAtual(id){
  const W=window, cf=((W.ATLAS_COMPLEMENTOS||{}).fontes)||{}, sv=((W.ATLAS_SERVICOS||{}).fontes)||{};
  const am=x=>x&&x.ano?x.ano*100+(x.mes||0):0;
  return {ideb:am(cf.ideb),anatel:am(cf.anatel),ibge_pop:am(sv.populacao),siconfi:am(sv.siconfi),
    ibge_pib:((W.ATLAS_NUCLEO||{}).pib||{}).ano_pib*100||0}[id]||0;
}
/* roda as fontes em sequência; só grava o que passou na conferência */
async function aoVivoAtualiza(ids,forca){
  if(AO_VIVO.rodando)return;
  AO_VIVO.rodando=true; aoVivoStatus();
  const cache=aoVivoLe(), agora=Date.now(), mudou=[];
  const vencida=r=>!r||!r.quando||(agora-Date.parse(r.quando))>AO_VIVO.validadeDias*864e5;
  for(const F of FONTES_AO_VIVO){
    if(ids&&!ids.includes(F.id))continue;
    const atual=cache[F.id];
    if(!forca&&!vencida(atual)&&atual.ok!==false)continue;
    if(!forca&&atual&&atual.falha&&(agora-Date.parse(atual.falha.quando))<864e5)continue;   /* não insiste no mesmo dia */
    AO_VIVO.progresso=F.nome; aoVivoStatus();
    try{
      const r=await F.f();
      const nova=(r.meta.ano||0)*100+(r.meta.mes||0), tem=edicaoAtual(F.id);
      if(nova&&tem&&nova<tem)throw new ErroFonte('antiga',
        `a fonte ainda traz ${r.resumo}, anterior à edição já carregada`);
      cache[F.id]={ok:true,quando:new Date().toISOString(),dados:r.dados,meta:r.meta,resumo:r.resumo};
      mudou.push(F.id);
    }catch(e){
      const falha={quando:new Date().toISOString(),tipo:e.tipo||'formato',msg:e.message||String(e)};
      cache[F.id]=Object.assign({},atual||{ok:false},{falha});
      if(!atual||atual.ok===false)cache[F.id].ok=false;
    }
    aoVivoGrava(cache);
    if(document.querySelector('#mdDados.show'))renderDados();
  }
  AO_VIVO.rodando=false; AO_VIVO.progresso='';
  if(mudou.length){mudou.forEach(id=>aoVivoMescla(id,cache[id])); aplicaAoVivoNoMapa();
    toast(`Dados atualizados pelas fontes: ${mudou.map(id=>FONTES_AO_VIVO.find(f=>f.id===id).nome).join(' · ')}`);}
  aoVivoStatus();
  if(document.querySelector('#mdDados.show'))renderDados();
  return mudou;
}
/* leva o que chegou para os municípios na tela, sem recarregar a página */
function aplicaAoVivoNoMapa(){
  const M=S.geo.municipio;
  if(M)M.features.forEach(f=>{const p=f.properties;
    fontesDoMunicipio(p,String(MUNIS_LISTA.ids[p.muni_id])); derivados(p);});
  if(PONTOS)agregaEquipamentosBairros();     /* contagens de equipamentos vêm dos pontos */
  AREAS_RISCO=((window.ATLAS_COMPLEMENTOS||{}).risco)||[];
  if(camadaRisco){if(map.hasLayer(camadaRisco))map.removeLayer(camadaRisco);camadaRisco=null;}
  reativaCatalogo(); aplicaAnosCatalogo();
  for(const k in COBRE)delete COBRE[k];
  renderCats(); renderCamadas(); riscoOn(!!S.camadas.risco);
  if(S.nivel==='municipio')desenhaMapa();
  renderPainel();
}
function aoVivoStatus(){
  const el=$('#aoVivoStatus'); if(!el)return;
  const c=aoVivoLe(), ok=FONTES_AO_VIVO.filter(F=>c[F.id]&&c[F.id].ok);
  const ult=ok.map(F=>c[F.id].quando).sort().pop();
  el.innerHTML=AO_VIVO.rodando?`<span class="pulso"></span>Buscando nas fontes… ${esc(AO_VIVO.progresso)}`
    :ok.length?`Fontes ao vivo: ${ok.length} de ${FONTES_AO_VIVO.length} · ${new Date(ult).toLocaleDateString('pt-BR')}`
    :`Dados embarcados · <u>buscar nas fontes</u>`;
}
function aoVivoAuto(){
  aoVivoStatus();
  if(!AO_VIVO.auto)return;
  const con=navigator.connection; if(con&&con.saveData)return;   /* economia de dados: só manual */
  aoVivoAtualiza(null,false);
}
function aoVivoHTML(){
  const c=aoVivoLe(), dt=x=>new Date(x).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
  const linha=F=>{const r=c[F.id];
    let st;
    if(AO_VIVO.rodando&&AO_VIVO.progresso&&AO_VIVO.progresso.startsWith(F.nome.split(':')[0]))st='<span class="selo s-imp"><i class="dot"></i>buscando…</span>';
    else if(r&&r.ok)st=`<span class="selo s-ok"><i class="dot"></i>ao vivo · ${esc(r.resumo||'')}</span><div class="av-sub">consultado em ${dt(r.quando)}</div>`;
    else st='<span class="selo s-mun"><i class="dot"></i>embarcado</span>';
    if(r&&r.falha)st+=`<div class="av-sub av-falha">${{rede:'Sem acesso',antiga:'Sem edição nova',formato:'Recusado na conferência'}[r.falha.tipo]||'Falha'} em ${dt(r.falha.quando)}: ${esc(r.falha.msg.replace(/\.?$/,'.'))}${r.ok?' Valem os dados da consulta anterior.':' Vale o dado embarcado.'}</div>`;
    return `<tr><td><b>${esc(F.nome)}</b><div class="av-sub">${esc(F.via)}</div></td><td>${st}</td></tr>`;};
  return `<h3 class="sec">Atualização direta pelas fontes</h3>
    <p style="font-size:12px;color:var(--txt2);line-height:1.6;margin-bottom:9px">
      O Atlas busca estes dados nas fontes pelo próprio navegador, sem script e sem arquivo para importar.
      Cada fonte passa pelas mesmas conferências dos scripts de extração. O que não passa, ou não responde,
      fica com o dado embarcado. A busca se repete sozinha a cada ${AO_VIVO.validadeDias} dias.</p>
    <div class="tb-scroll"><table class="tb av"><tbody>${FONTES_AO_VIVO.map(linha).join('')}</tbody></table></div>
    <div style="display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin:10px 0 4px">
      <button class="btn" id="avAgora" ${AO_VIVO.rodando?'disabled':''}>${AO_VIVO.rodando?'Buscando…':'Buscar agora'}</button>
      <label style="font-size:12px;color:var(--txt2);display:flex;gap:6px;align-items:center">
        <input type="checkbox" id="avAuto" ${AO_VIVO.auto?'checked':''}> buscar automaticamente ao abrir</label>
      ${Object.keys(c).length?'<button class="btn" id="avLimpa">Voltar aos dados embarcados</button>':''}</div>
    <p style="font-size:11px;color:var(--txt3);line-height:1.6">Ficam de fora, porque a fonte não pode ser lida
      direto por uma página: Censo (setores e microdados), CNES, Censo Escolar, SSP/RS, Cadastro Único e Censo SUAS.
      Para esses, os scripts de <code>extracao/</code> continuam valendo.</p>`;
}
function ligaAoVivoHTML(){
  const ir=$('#btnIrExtrair'); if(ir)ir.onclick=()=>{fechaModais();abreModal('mdExtrair');};
  const a=$('#avAgora'); if(a)a.onclick=()=>aoVivoAtualiza(null,true);
  const t=$('#avAuto'); if(t)t.onchange=e=>{AO_VIVO.auto=e.target.checked;
    try{localStorage.setItem(AO_VIVO_CHAVE+'_auto',e.target.checked?'1':'0');}catch(err){}};
  const l=$('#avLimpa'); if(l)l.onclick=()=>{try{localStorage.removeItem(AO_VIVO_CHAVE);}catch(e){}
    toast('Dados das fontes apagados deste navegador. A página volta aos dados embarcados.');setTimeout(()=>location.reload(),900);};
}

/* ═════════════════════ 27. CENTRAL DE EXTRAÇÃO NO NAVEGADOR ═════════════════════
   Faz aqui, no navegador de quem usa o Atlas, o que os scripts de extracao/R/
   fazem: sem instalar R nem Python, e sem enviar nada para servidor.
   - Fonte que deixa uma página ler direto (IBGE/SIDRA, OpenStreetMap): um botão.
   - Fonte que só entrega arquivo (INEP, microdados do IBGE, CNES, MDS, IPEA): a
     pessoa baixa na página oficial e solta o arquivo aqui. O Atlas abre o ZIP, o
     CSV ou a planilha e recorta os sete municípios.
   As regras são as dos scripts: confere colunas e municípios, para com mensagem
   clara quando a fonte muda, não estima e não completa. O resultado fica guardado
   neste navegador (IndexedDB) e entra num novo arquivo do Atlas pelo botão
   "Baixar o Atlas com os dados", que é o arquivo que se distribui. */

/* ---- 27.1 guarda e aplica o que foi extraído ------------------------------ */
const XT_BANCO='atlas_rmpa_extracoes', XT_LOJA='itens';
const XT_APLICADOS=new Map();                 /* id -> item já aplicado ao mapa */
function xtAbreBanco(){
  return new Promise((ok,erro)=>{
    try{
      const r=indexedDB.open(XT_BANCO,1);
      r.onupgradeneeded=()=>r.result.createObjectStore(XT_LOJA,{keyPath:'id'});
      r.onsuccess=()=>ok(r.result); r.onerror=()=>erro(r.error||new Error('IndexedDB indisponível'));
    }catch(e){erro(e);}
  });
}
async function xtLista(){
  try{
    const db=await xtAbreBanco();
    return await new Promise((ok,erro)=>{const q=db.transaction(XT_LOJA,'readonly').objectStore(XT_LOJA).getAll();
      q.onsuccess=()=>ok(q.result||[]); q.onerror=()=>erro(q.error);});
  }catch(e){return [];}
}
async function xtGrava(item){
  try{
    const db=await xtAbreBanco();
    await new Promise((ok,erro)=>{const t=db.transaction(XT_LOJA,'readwrite');t.objectStore(XT_LOJA).put(item);
      t.oncomplete=()=>ok(); t.onerror=()=>erro(t.error);});
    return true;
  }catch(e){return false;}            /* janela anônima ou bloqueio: vale só nesta sessão */
}
async function xtApaga(id){
  try{
    const db=await xtAbreBanco();
    await new Promise((ok,erro)=>{const t=db.transaction(XT_LOJA,'readwrite');t.objectStore(XT_LOJA).delete(id);
      t.oncomplete=()=>ok(); t.onerror=()=>erro(t.error);});
  }catch(e){}
}
/* chaves das camadas de pontos: as fixas e as que vêm de extração (xt_...) */
const chavesPonto=()=>['lojas','escolas','saude','acolhimento']
  .concat(Object.keys(ESTILO_PONTO).filter(k=>k.startsWith('xt_')));

/* Põe um item extraído no Atlas: fonte, indicadores, valores e pontos. */
function xtAplica(item){
  const fk='XT_'+item.id;
  FONTES[fk]={n:item.fonte.n,s:item.fonte.s||item.fonte.n,u:item.fonte.u||'',
    d:(item.fonte.d||'')+(item.pacote?` Calculado para o pacote do Atlas em ${new Date(item.quando).toLocaleDateString('pt-BR')}`
      :` Extraído no navegador em ${new Date(item.quando).toLocaleDateString('pt-BR')}`)+
      (item.origem?`, de ${item.origem}`:'')+'.',naoOficial:item.status==='ext'};
  /* fontes próprias de alguns indicadores do item (Ipeadata: a fonte original de cada série) */
  const fx=item.fontesExtra||{};
  for(const k in fx)FONTES[k]=Object.assign({},fx[k],{d:(fx[k].d||'')+` Extraído no navegador em ${new Date(item.quando).toLocaleDateString('pt-BR')}.`});
  if((item.indicadores||[]).some(d=>d.cat==='ipeadata')&&!CATS.some(c=>c.id==='ipeadata'))CATS.push({id:'ipeadata',n:'Ipeadata (IPEA)'});
  (item.indicadores||[]).forEach(d=>{
    const o=Object.assign({},d,{fonte:d.fonte&&fx[d.fonte]?d.fonte:fk,ano:d.ano??item.ano,status:d.status||item.status||'ok'});
    const ex=getInd(d.id);
    if(ex)Object.assign(ex,o); else ind(o);
  });
  const V=item.valores||{};
  ((S.geo.municipio||{}).features||[]).forEach(f=>{
    const c=String(MUNIS_LISTA.ids[f.properties.muni_id]);
    if(V.municipio&&V.municipio[c])Object.assign(f.properties,V.municipio[c]);
  });
  if(V.bairro)S.geo.bairro.features.forEach(f=>{const v=V.bairro[f.properties.id]; if(v)Object.assign(f.properties,v);});
  if(item.pontos&&PONTOS){
    const P=item.pontos;
    PONTOS[P.chave]=P.itens.map(q=>Object.assign({},q));
    PONTOS[P.chave].meta={fonte:item.fonte.n,ano:item.ano};
    ESTILO_PONTO[P.chave]={cor:P.cor||'#7d5ba6',r:3.6,rot:P.rot};
    if(camadasPonto[P.chave]){if(map.hasLayer(camadasPonto[P.chave]))map.removeLayer(camadasPonto[P.chave]);delete camadasPonto[P.chave];}
    if(S.camadas[P.chave]==null)S.camadas[P.chave]=false;
  }
  XT_APLICADOS.set(item.id,item);
  REGIAO=null; IND_IDX=null;
}
function xtRedesenha(){renderCats(); renderCamadas(); desenhaMapa(); renderPainel();}
/* um item novo: guarda, aplica e avisa */
async function xtConclui(item){
  item.quando=new Date().toISOString();
  xtAplica(item); xtRedesenha();
  const ok=await xtGrava(item);
  toast(ok?`${item.titulo}: pronto, e guardado neste navegador.`
    :`${item.titulo}: pronto. O navegador não deixou guardar; vale só até fechar a página.`,'ok');
  if($('#mdExtrair')&&$('#mdExtrair').classList.contains('show'))xtListaHTML();
  return item;
}
/* No boot: o que veio embutido no arquivo (ATLAS_EXTRAIDOS) e o que está neste navegador. */
async function xtInicia(){
  /* ATLAS_PACOTE: extrações já feitas que vêm no pacote (dados/dados-extracoes.js), no mesmo formato
     das da central. Uma extração mais nova do mesmo item, embutida ou deste navegador, vale por cima. */
  const pac=Array.isArray(window.ATLAS_PACOTE)?window.ATLAS_PACOTE:[];
  const emb=Array.isArray(window.ATLAS_EXTRAIDOS)?window.ATLAS_EXTRAIDOS:[];
  const loc=await xtLista();
  const porId=new Map();
  const maisNovo=(i,marca)=>{const e=porId.get(i.id); if(!e||String(i.quando)>String(e.quando))porId.set(i.id,marca?Object.assign({},i,marca):i);};
  pac.forEach(i=>porId.set(i.id,Object.assign({},i,{_pacote:true})));
  emb.forEach(i=>maisNovo(i,{_embutido:true}));
  loc.forEach(i=>maisNovo(i));
  if(!porId.size)return;
  porId.forEach(i=>{try{xtAplica(i);}catch(e){console.warn('extração',i.id,e);}});
  xtRedesenha();
}

/* ---- 27.2 o Atlas com os dados extraídos, num arquivo só ------------------
   O texto do arquivo foi guardado no início do atlas.js, antes de qualquer
   mudança na página (HTML_ORIGINAL). O novo arquivo é esse texto com um bloco
   bloco de script com id atlas-extraidos antes do código do Atlas. */
/* As marcas são montadas em partes para não aparecerem literalmente neste código:
   assim a busca só acha as tags de verdade do arquivo. */
const XT_TAG_APP='<scr'+'ipt id="atlas-app">', XT_TAG_EXT='<scr'+'ipt id="atlas-extraidos">', XT_FIM='</scr'+'ipt>';
function xtArquivoUnico(){return !!HTML_ORIGINAL&&HTML_ORIGINAL.indexOf(XT_TAG_APP)>=0;}
async function xtBaixaAtlas(){
  if(!xtArquivoUnico()){
    toast('Abra o arquivo único (atlas-rmpa.html) para gerar o Atlas com os dados. Nesta versão em pasta, use "Baixar CSV".','err');
    return;
  }
  const itens=[...XT_APLICADOS.values()].filter(i=>!i._pacote).map(i=>{const c=Object.assign({},i);delete c._embutido;return c;});
  if(!itens.length){toast('Nada extraído ainda neste navegador: o que está no pacote já vai no arquivo do Atlas.','err');return;}
  /* tudo o que vem antes do código do Atlas, sem o bloco de dados de uma geração anterior */
  const k=HTML_ORIGINAL.indexOf(XT_TAG_APP);
  let antes=HTML_ORIGINAL.slice(0,k);
  const e=antes.indexOf(XT_TAG_EXT);
  if(e>=0){const f=antes.indexOf(XT_FIM,e); antes=antes.slice(0,e)+antes.slice(f+XT_FIM.length).replace(/^\s+/,'');}
  const bloco=XT_TAG_EXT+'window.ATLAS_EXTRAIDOS='+JSON.stringify(itens).replace(/<\//g,'<\\/')+';'+XT_FIM+'\n';
  const h=antes+bloco+HTML_ORIGINAL.slice(k);
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob(['<!DOCTYPE html>\n'+h],{type:'text/html;charset=utf-8'}));
  a.download=`atlas-rmpa-com-dados-${new Date().toISOString().slice(0,10)}.html`;
  a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  toast(`Atlas com ${itens.length} extraç${itens.length>1?'ões':'ão'} baixado. É este arquivo que se distribui.`,'ok');
}

/* ---- 27.3 leitura de arquivos no navegador -------------------------------- */
const XT_CODS=()=>COD7();
/* código de município com 7 ou 6 dígitos -> código de 7, se for um dos sete */
function xtMuni(v){
  const s=String(v==null?'':v).replace(/\D/g,'');
  if(s.length!==7&&s.length!==6)return null;
  return XT_CODS().find(c=>c===s||c.slice(0,6)===s)||null;
}
/* filtro rápido de linha: só passa se tiver o código (6 dígitos) de um dos sete */
const xtTemCodigo=()=>new RegExp(XT_CODS().map(c=>c.slice(0,6)).join('|'));
function xtSemDescompressao(){return typeof DecompressionStream==='undefined';}

/* Lista os arquivos de um ZIP lendo só o diretório do fim do arquivo (aceita ZIP64). */
async function zipEntradas(file){
  const n=file.size, tam=Math.min(n,65557);
  const dv=new DataView(await file.slice(n-tam).arrayBuffer());
  let fim=-1;
  for(let i=tam-22;i>=0;i--)if(dv.getUint32(i,true)===0x06054b50){fim=i;break;}
  if(fim<0)throw new Error(`${file.name} não é um ZIP válido (ou está incompleto: confira se o download terminou)`);
  let total=dv.getUint16(fim+10,true), cdTam=dv.getUint32(fim+12,true), cdIni=dv.getUint32(fim+16,true);
  if(cdIni===0xFFFFFFFF||total===0xFFFF||cdTam===0xFFFFFFFF){
    const loc=fim-20;
    if(loc<0||dv.getUint32(loc,true)!==0x07064b50)throw new Error(`${file.name}: ZIP64 sem localizador`);
    const p64=Number(dv.getBigUint64(loc+8,true));
    const z=new DataView(await file.slice(p64,p64+56).arrayBuffer());
    if(z.getUint32(0,true)!==0x06064b50)throw new Error(`${file.name}: ZIP64 corrompido`);
    total=Number(z.getBigUint64(32,true)); cdTam=Number(z.getBigUint64(40,true)); cdIni=Number(z.getBigUint64(48,true));
  }
  const cd=new DataView(await file.slice(cdIni,cdIni+cdTam).arrayBuffer());
  const out=[]; let p=0;
  for(let k=0;k<total;k++){
    if(cd.getUint32(p,true)!==0x02014b50)throw new Error(`${file.name}: diretório do ZIP corrompido`);
    const flags=cd.getUint16(p+8,true), metodo=cd.getUint16(p+10,true);
    let comp=cd.getUint32(p+20,true), tam2=cd.getUint32(p+24,true);
    const nl=cd.getUint16(p+28,true), el=cd.getUint16(p+30,true), cl=cd.getUint16(p+32,true);
    let off=cd.getUint32(p+42,true);
    const nome=new TextDecoder(flags&0x800?'utf-8':'windows-1252')
      .decode(new Uint8Array(cd.buffer,cd.byteOffset+p+46,nl));
    let e=p+46+nl; const fe=e+el;
    while(e+4<=fe){
      const id=cd.getUint16(e,true), sz=cd.getUint16(e+2,true);
      if(id===1){let q=e+4;
        if(tam2===0xFFFFFFFF){tam2=Number(cd.getBigUint64(q,true));q+=8;}
        if(comp===0xFFFFFFFF){comp=Number(cd.getBigUint64(q,true));q+=8;}
        if(off===0xFFFFFFFF){off=Number(cd.getBigUint64(q,true));}}
      e+=4+sz;
    }
    if(!nome.endsWith('/'))out.push({nome,metodo,comp,tam:tam2,off,zip:file});
    p+=46+nl+el+cl;
  }
  return out;
}
/* bytes de um arquivo de dentro do ZIP, já descomprimidos, como stream */
async function zipAbre(ent){
  const h=new DataView(await ent.zip.slice(ent.off,ent.off+30).arrayBuffer());
  if(h.getUint32(0,true)!==0x04034b50)throw new Error(`${ent.nome}: cabeçalho do ZIP corrompido`);
  const ini=ent.off+30+h.getUint16(26,true)+h.getUint16(28,true);
  const s=ent.zip.slice(ini,ini+ent.comp).stream();
  if(ent.metodo===0)return s;
  if(ent.metodo===8){
    if(xtSemDescompressao())throw new Error('este navegador não descompacta arquivos; use Chrome, Edge, Firefox ou Safari atualizados');
    return s.pipeThrough(new DecompressionStream('deflate-raw'));
  }
  throw new Error(`${ent.nome} usa um tipo de compressão (${ent.metodo}) que o navegador não abre. Extraia o ZIP no computador e solte o arquivo de dentro.`);
}
async function zipBytes(ent){return new Uint8Array(await new Response(await zipAbre(ent)).arrayBuffer());}
/* um arquivo solto ou de dentro de ZIP, com nome e tamanho descomprimido */
function xtFonteDe(file){return {nome:file.name,tam:file.size,abre:async()=>{
  const s=file.stream();
  if(/\.gz$/i.test(file.name)){
    if(xtSemDescompressao())throw new Error('este navegador não descompacta arquivos .gz');
    return s.pipeThrough(new DecompressionStream('gzip'));
  }
  return s;}, bytes:async()=>new Uint8Array(await file.arrayBuffer())};}
function xtFonteZip(ent){return {nome:ent.nome,tam:ent.tam,abre:()=>zipAbre(ent),bytes:()=>zipBytes(ent)};}

/* UTF-8 se decodificar sem erro; senão, Windows-1252 (o comum em arquivos do governo) */
function xtCodificacao(bytes){
  let n=bytes.length; const q=bytes.lastIndexOf(10); if(q>0)n=q;
  try{new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,n));return 'utf-8';}
  catch(e){return 'windows-1252';}
}
/* Lê o texto em pedaços e chama porLinha(linha) para cada registro. Junta as linhas
   que uma aspa deixou abertas (campo com quebra de linha, RFC 4180). progresso(fração)
   é chamado a cada pedaço. porLinha devolvendo false interrompe a leitura. */
async function xtLinhas(fonte,porLinha,progresso){
  const rd=(await fonte.abre()).getReader();
  let dec=null, resto='', lidos=0, pend=null, parar=false;
  const entrega=l=>{
    if(l.endsWith('\r'))l=l.slice(0,-1);
    if(pend!==null){pend+='\n'+l; if(((pend.match(/"/g)||[]).length&1)===1)return; l=pend; pend=null;}
    else if(l.indexOf('"')>=0&&((l.match(/"/g)||[]).length&1)===1){pend=l;return;}
    if(porLinha(l)===false)parar=true;
  };
  for(;;){
    const {done,value}=await rd.read();
    if(done)break;
    lidos+=value.length;
    if(!dec)dec=new TextDecoder(xtCodificacao(value));
    resto+=dec.decode(value,{stream:true});
    let i, ini=0;
    while(!parar&&(i=resto.indexOf('\n',ini))>=0){entrega(resto.slice(ini,i)); ini=i+1;}
    resto=resto.slice(ini);
    if(progresso)progresso(fonte.tam?Math.min(1,lidos/fonte.tam):0);
    if(parar){try{await rd.cancel();}catch(e){} break;}
  }
  if(!parar){
    if(dec)resto+=dec.decode();
    if(resto)entrega(resto);
    if(pend!==null)porLinha(pend);
  }
}
/* separa os campos de uma linha, respeitando aspas */
function xtCampos(l,sep){
  if(l.indexOf('"')<0)return l.split(sep);
  const out=[]; let cur='', q=false;
  for(let i=0;i<l.length;i++){
    const c=l[i];
    if(q){ if(c==='"'){ if(l[i+1]==='"'){cur+='"';i++;} else q=false; } else cur+=c; }
    else if(c==='"')q=true; else if(c===sep){out.push(cur);cur='';} else cur+=c;
  }
  out.push(cur); return out.map(x=>x.trim());
}
function xtSeparador(cab){
  const c=s=>(cab.split(s).length-1);
  return [';',',','\t','|'].map(s=>[s,c(s)]).sort((a,b)=>b[1]-a[1])[0][0];
}
/* planilhas: o leitor (SheetJS) só baixa quando alguém solta uma planilha */
let XT_XLSX=null;
function xtCarregaScript(src){
  return new Promise((ok,erro)=>{const s=document.createElement('script');s.src=src;
    s.onload=()=>ok(); s.onerror=()=>erro(new Error('não consegui baixar o leitor de planilhas: confira a internet'));
    document.head.appendChild(s);});
}
async function xtPlanilha(bytes){
  if(!XT_XLSX){
    if(!window.XLSX)await xtCarregaScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
    if(!window.XLSX)throw new Error('o leitor de planilhas não carregou');
    XT_XLSX=window.XLSX;
  }
  const wb=XT_XLSX.read(bytes,{type:'array'});
  return wb.SheetNames.map(n=>({nome:n,linhas:XT_XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:true,defval:null})}));
}
const xtEhPlanilha=n=>/\.(xlsx|xls|ods)$/i.test(n);
const xtEhTexto=n=>/\.(csv|txt|tsv)(\.gz)?$/i.test(n);

/* ---- 27.4 assistente para qualquer arquivo nacional ------------------------
   Equivale ao 10_recorta_arquivo_baixado.R: acha a coluna do código do
   município, guarda só as linhas dos sete e transforma em indicador municipal:
   usar os valores (uma linha por município), contar linhas ou somar colunas
   (uma linha por unidade: escola, CRAS, organização...). Com latitude e
   longitude, as linhas também viram pontos no mapa e contagem por bairro. */
const XT_COL_MUN=/^(co_?municipio(_ibge)?|cod_?municipio|codigo_?municipio|id_?municipio|code_?muni|codufmun|cod_?ibge|ibge|cd_?mun(icipio)?|cod_?mun|municipio_?codigo|co_?ibge|codmun7?|cod_?mun_?ibge)$/;
const XT_COL_LAT=/^(lat|latitude|nu_?latitude|lat_?(y|dec)?)$/, XT_COL_LON=/^(lon|lng|long|longitude|nu_?longitude|lon_?(x|dec)?)$/;
const XT_COL_ANO=/^(ano|year|nu_?ano(_censo)?|ano_?referencia|competencia)$/;
const xtNorm=s=>norm(s).replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
/* colunas que têm algarismos mas não são medidas: datas, sequenciais e documentos */
const XT_COL_DATA=/^(dt|data|dh)(_|$)|_(dt|data)$/;
const XT_COL_SEQ=/^(seq|sq|nu_?seq|nr_?seq|id|uid|cpf|cnpj|nu_?cpf|nu_?cnpj|cep|nu_?cep|telefone|nu_?telefone|fone)(_|$)|_(id|seq|cpf|cnpj|cep)$/;
const XT_VAL_DATA=/^(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}|\d{4}[\/.\-]\d{1,2}[\/.\-]\d{1,2})([ T]\d{1,2}:\d{2}(:\d{2}(\.\d+)?)?)?$/;
/* número só quando o valor inteiro é número (parseNum aceita prefixo: "01/02/2015" daria 1) */
function xtNumero(x){
  const s=String(x).trim();
  if(XT_VAL_DATA.test(s))return NaN;
  if(!/^[-+]?(R\$)?\s*\d[\d.,\s]*%?$/.test(s)&&!/^[-+]?\d+(\.\d+)?[eE][-+]?\d+$/.test(s))return NaN;
  return parseNum(s);
}
const xtSlug=s=>xtNorm(s).slice(0,40)||'col';
const XT={geral:null};                      /* estado do assistente aberto */

function xtProgresso(el,frac,msg){
  if(!el)return;
  el.innerHTML=`<div class="xt-prog"><i style="width:${(100*Math.max(0,Math.min(1,frac||0))).toFixed(1)}%"></i></div>
    <p class="xt-msg">${esc(msg||'')}</p>`;
}
function xtErro(el,msg){if(el)el.innerHTML=`<div class="note warn">${esc(msg)}</div>`;}

/* tabela de amostra: cabeçalho + linhas, de texto (CSV) ou planilha */
async function xtAmostra(fonte,limite=400){
  if(xtEhPlanilha(fonte.nome)){
    const abas=await xtPlanilha(await fonte.bytes());
    return {tipo:'planilha',abas};
  }
  const linhas=[];
  await xtLinhas(fonte,l=>{if(l.trim())linhas.push(l); return linhas.length<limite;});
  if(!linhas.length)throw new Error(`${fonte.nome} está vazio`);
  const sep=xtSeparador(linhas.slice(0,20).join('\n'));
  const contagens=linhas.map(l=>xtCampos(l,sep).length);
  const freq={}; contagens.forEach(c=>freq[c]=(freq[c]||0)+1);
  const moda=+Object.entries(freq).sort((a,b)=>b[1]-a[1])[0][0];
  const iCab=contagens.findIndex(c=>c===moda);
  return {tipo:'texto',sep,iCab,cab:xtCampos(linhas[iCab],sep),linhas:linhas.slice(iCab+1).map(l=>xtCampos(l,sep))};
}
/* em planilha: o cabeçalho é a primeira linha com mais de metade das células preenchidas com texto */
function xtCabPlanilha(linhas){
  const larg=Math.max(...linhas.slice(0,50).map(r=>r?r.length:0));
  const i=linhas.findIndex(r=>r&&r.filter(c=>typeof c==='string'&&c.trim()).length>=Math.max(2,larg/2));
  const iCab=i<0?0:i;
  return {iCab,cab:(linhas[iCab]||[]).map(c=>String(c??'').trim()),linhas:linhas.slice(iCab+1).map(r=>(r||[]).map(c=>c==null?'':String(c)))};
}
/* coluna do município: pelo nome, ou pela forma dos valores (6 ou 7 dígitos) */
function xtAchaColMun(cab,linhas){
  const n=cab.map(xtNorm);
  let k=n.findIndex(h=>XT_COL_MUN.test(h));
  if(k>=0)return k;
  const cand=cab.map((_,j)=>{
    const v=linhas.map(r=>String(r[j]??'').trim()).filter(Boolean);
    return v.length&&v.filter(x=>/^\d{6,7}$/.test(x)).length/v.length>=0.95?j:-1;
  }).filter(j=>j>=0);
  if(cand.length>1){const p=cand.find(j=>/mun|ibge/.test(n[j]));if(p!=null)return p;}
  return cand.length?cand[0]:-1;
}

/* recorte: todas as linhas dos sete municípios */
async function xtRecorta(fonte,amostra,col,prog){
  const cods=new Set(XT_CODS()), linhas=[], porMun={};
  const guarda=r=>{const c=xtMuni(r[col]); if(c&&cods.has(c)){linhas.push(r);porMun[c]=(porMun[c]||0)+1;}};
  if(amostra.tipo==='planilha'){amostra.tab.linhas.forEach(guarda);}
  else{
    const tem=xtTemCodigo(); let i=-1;
    await xtLinhas(fonte,l=>{i++; if(i<=amostra.iCab)return; if(!tem.test(l))return; guarda(xtCampos(l,amostra.sep));},prog);
  }
  return {linhas,porMun};
}

/* tipos de coluna no recorte */
function xtPerfilColunas(cab,linhas,colMun){
  return cab.map((h,j)=>{
    const v=linhas.map(r=>r[j]).filter(x=>x!=null&&String(x).trim()!=='');
    const nums=v.map(x=>xtNumero(x)).filter(x=>!Number.isNaN(x));
    const dist=new Set(v.map(x=>String(x).trim()));
    const nh=xtNorm(h);
    const data=XT_COL_DATA.test(nh)||(v.length>0&&v.filter(x=>XT_VAL_DATA.test(String(x).trim())).length/v.length>=0.9);
    return {j,h,nh,preench:v.length,data,num:!data&&!XT_COL_SEQ.test(nh)&&v.length>0&&nums.length/v.length>=0.9,
      codigo:j===colMun||COLUNA_ID.test(nh)||XT_COL_MUN.test(nh),
      categorias:dist.size>=2&&dist.size<=15?[...dist].sort():null,
      distintos:dist.size<=60?[...dist].sort():null,
      lat:XT_COL_LAT.test(nh), lon:XT_COL_LON.test(nh), ano:XT_COL_ANO.test(nh)};
  });
}

/* ---- telas do assistente ---- */
async function xtGeralInicia(files,el){
  XT.geral={el,files};
  try{
    const fontes=[];
    for(const f of files){
      if(/\.zip$/i.test(f.name)){
        (await zipEntradas(f)).filter(e=>xtEhTexto(e.nome)||xtEhPlanilha(e.nome)).forEach(e=>fontes.push(xtFonteZip(e)));
      }else if(xtEhTexto(f.name)||xtEhPlanilha(f.name))fontes.push(xtFonteDe(f));
    }
    if(!fontes.length)return xtErro(el,'Nenhum arquivo CSV, TXT ou planilha (XLSX, XLS, ODS) encontrado. Solte o arquivo da fonte, ou o ZIP que o contém.');
    XT.geral.fontes=fontes.sort((a,b)=>b.tam-a.tam);
    if(fontes.length===1)return xtGeralAbre(0);
    el.innerHTML=`<p class="xt-msg">O ZIP tem ${fontes.length} arquivos de dados. Qual deles?</p>
      ${fontes.slice(0,40).map((f,i)=>`<button class="btn xt-esc" data-i="${i}">${esc(f.nome.split('/').pop())}
        <small>${(f.tam/1048576).toFixed(1)} MB</small></button>`).join('')}`;
    el.querySelectorAll('.xt-esc').forEach(b=>b.onclick=()=>xtGeralAbre(+b.dataset.i));
  }catch(e){xtErro(el,e.message);}
}
async function xtGeralAbre(i){
  const G=XT.geral, el=G.el, fonte=G.fontes[i];
  G.fonte=fonte;
  xtProgresso(el,0,`Abrindo ${fonte.nome.split('/').pop()}…`);
  try{
    const am=await xtAmostra(fonte);
    if(am.tipo==='planilha'){
      /* a aba com mais linhas de código de município */
      const abas=am.abas.map(a=>{const t=xtCabPlanilha(a.linhas);return {nome:a.nome,t,col:xtAchaColMun(t.cab,t.linhas)};});
      const a=abas.find(x=>x.col>=0)||abas[0];
      G.amostra={tipo:'planilha',tab:a.t,sheet:a.nome,abas};
      G.cab=a.t.cab; G.col=a.col;
    }else{
      G.amostra=am; G.cab=am.cab; G.col=xtAchaColMun(am.cab,am.linhas);
    }
    xtGeralConfirma();
  }catch(e){xtErro(el,e.message);}
}
function xtGeralConfirma(){
  const G=XT.geral, el=G.el, am=G.amostra;
  const prev=am.tipo==='planilha'?am.tab.linhas.slice(0,3):am.linhas.slice(0,3);
  const nCol=Math.min(G.cab.length,6);
  el.innerHTML=`
    <p class="xt-msg"><b>${esc(G.fonte.nome.split('/').pop())}</b> · ${G.cab.length} colunas
      ${am.tipo==='planilha'?`· aba ${esc(am.sheet)}`:`· separador “${am.sep==='\t'?'tab':esc(am.sep)}”`}</p>
    <label class="xt-campo">Coluna com o código IBGE do município
      <select id="xtColMun">${G.cab.map((h,j)=>`<option value="${j}" ${j===G.col?'selected':''}>${esc(h||'(sem nome) '+(j+1))}</option>`).join('')}</select></label>
    ${G.col<0?'<div class="note warn">Não achei sozinho a coluna do código do município. Escolha acima a que tem códigos de 6 ou 7 dígitos (4314902 é Porto Alegre).</div>':''}
    <div class="tb-scroll"><table class="tb xt-prev"><thead><tr>${G.cab.slice(0,nCol).map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${prev.map(r=>`<tr>${r.slice(0,nCol).map(c=>`<td>${esc(String(c??'').slice(0,24))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <div class="btn-row"><button class="btn pri" id="xtRecortar">Recortar os sete municípios</button></div>`;
  $('#xtColMun').onchange=e=>{G.col=+e.target.value;};
  $('#xtRecortar').onclick=async()=>{
    if(G.col<0)G.col=+$('#xtColMun').value;
    xtProgresso(el,0,'Lendo o arquivo inteiro…');
    try{
      const r=await xtRecorta(G.fonte,G.amostra,G.col,f=>xtProgresso(el,f,`Lendo… ${Math.round(100*f)}%`));
      if(!r.linhas.length)return xtErro(el,'Nenhuma linha dos sete municípios. Confira se a coluna escolhida tem o código IBGE do município.');
      G.rec=r; G.perfil=xtPerfilColunas(G.cab,r.linhas,G.col);
      xtGeralOpcoes();
    }catch(e){xtErro(el,e.message);}
  };
}
function xtGeralOpcoes(){
  const G=XT.geral, el=G.el, P=G.perfil, r=G.rec;
  const maxPorMun=Math.max(...Object.values(r.porMun));
  const faltam=XT_CODS().filter(c=>!r.porMun[c]).map(nomeDoCod);
  const nums=P.filter(c=>c.num&&!c.codigo&&!c.ano&&!c.lat&&!c.lon);
  const cats=P.filter(c=>c.categorias&&!c.lat&&!c.lon&&c.j!==G.col);
  const filtraveis=P.filter(c=>c.distintos&&c.j!==G.col);
  const anoCol=P.find(c=>c.ano&&c.distintos&&c.distintos.length===1);
  const lat=P.find(c=>c.lat), lon=P.find(c=>c.lon);
  /* receitas conhecidas: equipes do CNES (contar as ativas por tipo) */
  const cnesTipo=P.find(c=>/^(tp|co_tipo|tipo)_?equipe$/.test(c.nh)), cnesDesat=P.find(c=>/^dt_?desativacao$/.test(c.nh));
  const modo=maxPorMun<=1&&nums.length?'valores':'contar';
  const semNum=nums.length?'':'disabled';
  el.innerHTML=`
    <p class="xt-msg"><b>${nf.format(r.linhas.length)} linhas</b> dos sete municípios:
      ${XT_CODS().filter(c=>r.porMun[c]).map(c=>`${esc(nomeDoCod(c))} ${nf.format(r.porMun[c])}`).join(' · ')}.</p>
    ${faltam.length?`<div class="note warn">Sem linhas para ${esc(faltam.join(', '))}: esses municípios ficam sem valor.</div>`:''}
    <fieldset class="xt-ops"><legend>O que fazer com as linhas</legend>
      <label><input type="radio" name="xtModo" value="valores" ${modo==='valores'?'checked':''} ${maxPorMun>1?'disabled':semNum}>
        Usar os valores das colunas <small>${maxPorMun>1?'(indisponível: há mais de uma linha por município)':nums.length?'(uma linha por município)':'(indisponível: nenhuma coluna numérica)'}</small></label>
      <label><input type="radio" name="xtModo" value="contar" ${modo==='contar'?'checked':''}> Contar as linhas de cada município <small>(escolas, CRAS, organizações…)</small></label>
      <label><input type="radio" name="xtModo" value="somar" ${semNum}> Somar colunas por município
        ${nums.length?'':'<small>(indisponível: nenhuma coluna numérica)</small>'}</label>
    </fieldset>
    <div id="xtColsNum" class="xt-cols">${nums.length?`<p class="xt-msg">Colunas numéricas:</p>${nums.map(c=>
      `<label><input type="checkbox" value="${c.j}" ${nums.length<=12?'checked':''}> ${esc(c.h)}</label>`).join('')}`:'<p class="xt-msg">Nenhuma coluna numérica.</p>'}</div>
    <label class="xt-campo">Separar a contagem por
      <select id="xtSepara"><option value="">— não separar —</option>
      ${cats.map(c=>`<option value="${c.j}" ${cnesTipo&&c.j===cnesTipo.j?'selected':''}>${esc(c.h)} (${c.categorias.length} valores)</option>`).join('')}</select></label>
    <div class="xt-filtro"><label class="xt-campo">Só as linhas em que
      <select id="xtFiltroCol"><option value="">— todas as linhas —</option>
      ${filtraveis.map(c=>`<option value="${c.j}" ${cnesDesat&&c.j===cnesDesat.j?'selected':''}>${esc(c.h)}</option>`).join('')}
      ${cnesDesat&&!filtraveis.includes(cnesDesat)?`<option value="${cnesDesat.j}" selected>${esc(cnesDesat.h)}</option>`:''}</select></label>
      <select id="xtFiltroOp"><option value="igual">é igual a</option><option value="vazio" ${cnesDesat?'selected':''}>está vazio</option>
        <option value="preenchido">está preenchido</option></select>
      <select id="xtFiltroVal"></select></div>
    ${lat&&lon?`<label class="xt-check"><input type="checkbox" id="xtPontos" checked> Mostrar as linhas como pontos no mapa e contar por bairro
      <small>(colunas ${esc(lat.h)} e ${esc(lon.h)})</small></label>`:''}
    <label class="xt-campo">Nome da fonte <input type="text" id="xtFonteNome" value="${esc(G.fonte.nome.split('/').pop().replace(/\.(csv|txt|tsv|xlsx|xls|ods|gz)$/gi,''))}"></label>
    <label class="xt-campo">Ano dos dados <input type="number" id="xtAno" min="1990" max="2100" value="${anoCol?esc(anoCol.distintos[0]):''}" placeholder="ex.: 2024"></label>
    <div class="btn-row"><button class="btn pri" id="xtCriar">Criar os indicadores</button>
      <button class="btn" id="xtBaixaRecorte">Baixar o recorte (CSV)</button></div>`;
  const atualizaVal=()=>{
    const j=$('#xtFiltroCol').value, op=$('#xtFiltroOp').value, sv=$('#xtFiltroVal');
    const c=j===''?null:P[+j];
    sv.style.display=c&&op==='igual'?'':'none';
    sv.innerHTML=c&&c.distintos?c.distintos.map(v=>`<option>${esc(v)}</option>`).join(''):'';
  };
  $('#xtFiltroCol').onchange=atualizaVal; $('#xtFiltroOp').onchange=atualizaVal; atualizaVal();
  $('#xtBaixaRecorte').onclick=()=>baixaCSV([G.cab].concat(r.linhas),`recorte-${xtSlug($('#xtFonteNome').value)}.csv`);
  $('#xtCriar').onclick=()=>xtGeralCria();
}
function xtGeralCria(){
  const G=XT.geral, el=G.el, P=G.perfil, cab=G.cab;
  const modo=(document.querySelector('input[name="xtModo"]:checked')||{}).value||'contar';
  const cols=[...document.querySelectorAll('#xtColsNum input:checked')].map(x=>+x.value);
  const sepJ=$('#xtSepara').value===''?null:+$('#xtSepara').value;
  const fj=$('#xtFiltroCol').value===''?null:+$('#xtFiltroCol').value, fop=$('#xtFiltroOp').value, fval=$('#xtFiltroVal').value;
  const nomeFonte=$('#xtFonteNome').value.trim()||'arquivo carregado';
  const ano=parseInt($('#xtAno').value,10)||null;
  if((modo==='valores'||modo==='somar')&&!cols.length)return toast('Marque ao menos uma coluna numérica.','err');
  const passa=r=>{
    if(fj==null)return true;
    const v=String(r[fj]??'').trim();
    return fop==='vazio'?v==='':fop==='preenchido'?v!=='':v===fval;
  };
  const linhas=G.rec.linhas.filter(passa);
  if(!linhas.length)return toast('O filtro não deixou nenhuma linha.','err');
  const base='xt_'+xtSlug(nomeFonte);
  const filtroTxt=fj==null?'':` Só as linhas em que ${cab[fj]} ${fop==='vazio'?'está vazio':fop==='preenchido'?'está preenchido':'= '+fval}.`;
  const indicadores=[], valores={municipio:{}};
  XT_CODS().forEach(c=>valores.municipio[c]={});
  const temDados=new Set(Object.keys(G.rec.porMun));
  const novo=(id,n,u,obs,fmt)=>{indicadores.push({id,cat:'visao',n,u,fmt:fmt||'dec2',ramp:'agua',niveis:['municipio'],
    obs:`${obs}${filtroTxt} Recorte dos sete municípios feito no navegador a partir de ${G.fonte.nome.split('/').pop()}.`});};
  if(modo==='valores'){
    cols.forEach(j=>{const id=`${base}_${xtSlug(cab[j])}`;
      novo(id,cab[j],'valor',`Coluna “${cab[j]}” de ${nomeFonte}, uma linha por município.`);
      linhas.forEach(r=>{const c=xtMuni(r[G.col]), v=parseNum(r[j]); if(c&&!Number.isNaN(v))valores.municipio[c][id]=v;});});
  }else{
    const grupos=sepJ==null?[null]:P[sepJ].categorias;
    const metricas=modo==='contar'?[null]:cols;
    grupos.forEach(g=>metricas.forEach(j=>{
      const id=`${base}_${modo==='contar'?'n':xtSlug(cab[j])}${g==null?'':'_'+xtSlug(g)}`;
      const n=(modo==='contar'?`${nomeFonte}: número de registros`:`${nomeFonte}: soma de ${cab[j]}`)+(g==null?'':` (${cab[sepJ]} = ${g})`);
      novo(id,n,modo==='contar'?'registros':'soma',modo==='contar'?`Linhas contadas por município.`:`Soma da coluna “${cab[j]}” por município.`,modo==='contar'?'int':'dec2');
      temDados.forEach(c=>{valores.municipio[c][id]=0;});
      linhas.forEach(r=>{
        if(g!=null&&String(r[sepJ]??'').trim()!==g)return;
        const c=xtMuni(r[G.col]); if(!c)return;
        if(modo==='contar')valores.municipio[c][id]+=1;
        else{const v=parseNum(r[j]); if(!Number.isNaN(v))valores.municipio[c][id]+=v;}
      });
    }));
  }
  const item={id:base,titulo:nomeFonte,ano,status:'ok',origem:G.fonte.nome.split('/').pop(),
    fonte:{n:nomeFonte+(ano?` (${ano})`:''),s:nomeFonte.slice(0,28),d:'Arquivo baixado da fonte pelo usuário e recortado no navegador.'},
    indicadores,valores,resumo:`${indicadores.length} indicador${indicadores.length>1?'es':''} por município`};
  /* pontos: latitude e longitude dentro dos sete municípios */
  const pt=$('#xtPontos');
  if(pt&&pt.checked){
    const lat=P.find(c=>c.lat), lon=P.find(c=>c.lon);
    const itens=xtPontosDe(linhas,lat.j,lon.j,G.col,cab);
    if(itens.length){
      const chave=base;
      item.pontos={chave,rot:nomeFonte,cor:'#7d5ba6',itens};
      const idB=`${base}_pontos`;
      indicadores.push({id:idB,cat:'visao',n:`${nomeFonte}: pontos no território`,u:'pontos',fmt:'int',ramp:'agua',
        niveis:['municipio','bairro'],obs:`Linhas com latitude e longitude dentro do território, contadas por ponto dentro do polígono.${filtroTxt}`});
      xtContaPorBairro(itens,idB,valores,Object.keys(G.rec.porMun).map(nomeDoCod));
      item.resumo+=` e ${nf.format(itens.length)} pontos no mapa`;
    }
  }
  xtConclui(item).then(()=>{el.innerHTML=`<div class="note">Pronto: ${esc(item.resumo)}. Os indicadores estão no catálogo, em Visão Geral.</div>`;});
}
/* pontos com coordenadas válidas dentro dos sete municípios */
function xtPontosDe(linhas,jLat,jLon,jMun,cab){
  const fs=(S.geo.municipio||{}).features||[], out=[];
  const jNome=cab.findIndex(h=>/^(no|nm|nome|name|razao_social|nome_fantasia|tx_nome)/i.test(xtNorm(h)));
  linhas.forEach(r=>{
    const y=parseNum(r[jLat]), x=parseNum(r[jLon]);
    if(Number.isNaN(x)||Number.isNaN(y)||Math.abs(y)>90||Math.abs(x)>180)return;
    const f=fs.find(m=>pontoNaGeometria(x,y,m.geometry)); if(!f)return;
    out.push({nome:jNome>=0?String(r[jNome]||'—'):'—',x,y,muni:f.properties.nome,tipo:null,rot:''});
  });
  return out;
}
/* conta pontos por bairro e município; zero só onde a fonte cobre o município
   (munis: nomes dos municípios com dado na fonte; sem lista, os sete) */
function xtContaPorBairro(itens,id,valores,munis){
  valores.bairro=valores.bairro||{};
  const cobre=new Set(munis||XT_CODS().map(nomeDoCod));
  const bs=S.geo.bairro.features, cx=bs.map(f=>caixaDe(f.geometry));
  bs.forEach(f=>{if(cobre.has(f.properties.muni))(valores.bairro[f.properties.id]=valores.bairro[f.properties.id]||{})[id]=0;});
  itens.forEach(q=>{
    for(let k=0;k<bs.length;k++){const b=cx[k];
      if(q.x<b[0]||q.x>b[2]||q.y<b[1]||q.y>b[3])continue;
      if(pontoNaGeometria(q.x,q.y,bs[k].geometry)){
        const o=(valores.bairro[bs[k].properties.id]=valores.bairro[bs[k].properties.id]||{}); o[id]=(o[id]||0)+1;
        q.bairro=bs[k].properties.nome; break;}}
  });
  XT_CODS().forEach(c=>{const m=nomeDoCod(c); if(!cobre.has(m))return;
    (valores.municipio[c]=valores.municipio[c]||{})[id]=itens.filter(q=>q.muni===m).length;});
}

/* ---- 27.5 receitas para fontes conhecidas --------------------------------- */
async function xtFontesDe(files){
  const out=[];
  for(const f of files){
    if(/\.zip$/i.test(f.name))(await zipEntradas(f)).forEach(e=>out.push(Object.assign(xtFonteZip(e),{ent:e})));
    else out.push(xtFonteDe(f));
  }
  return out;
}
const xtBase=n=>n.split('/').pop();

/* Censo Escolar (INEP): matrículas por etapa e rede, por município.
   Mesmo cálculo do extracao/R/03_censo_escolar_matriculas.R. */
const INEP_ETAPAS=[
  ['bas',['QT_MAT_BAS'],'Matrículas na educação básica'],
  ['creche',['QT_MAT_INF_CRE'],'Matrículas em creche'],
  ['pre',['QT_MAT_INF_PRE'],'Matrículas na pré-escola'],
  ['fund',['QT_MAT_FUND_AI','QT_MAT_FUND_AF'],'Matrículas no ensino fundamental'],
  ['med',['QT_MAT_MED'],'Matrículas no ensino médio'],
  ['eja',['QT_MAT_EJA'],'Matrículas na educação de jovens e adultos (EJA)']];
async function xtInep(files,el){
  const fontes=await xtFontesDe(files);
  const fonte=fontes.find(f=>/microdados_ed_basica_\d{4}\.csv$/i.test(xtBase(f.nome)))
    ||fontes.find(f=>/ed_basica.*\.csv$/i.test(xtBase(f.nome)));
  if(!fonte)throw new Error('Não achei o arquivo microdados_ed_basica_AAAA.csv. Solte o ZIP dos microdados do Censo Escolar da educação básica. '
    +(fontes.length?`Arquivos encontrados: ${fontes.slice(0,8).map(f=>xtBase(f.nome)).join(', ')}.`:''));
  const ano=+((xtBase(fonte.nome).match(/(\d{4})\.csv$/i)||[])[1])||null;
  let cab=null, sep=';', ix={}, n=0, ativas=0;
  const tem=xtTemCodigo(), acc={}, esc_={};
  XT_CODS().forEach(c=>{acc[c]={pub:{},priv:{}};esc_[c]={pub:0,priv:0};});
  const precisa=['CO_MUNICIPIO','TP_DEPENDENCIA','TP_SITUACAO_FUNCIONAMENTO'].concat(...INEP_ETAPAS.map(e=>e[1]));
  await xtLinhas(fonte,l=>{
    if(!cab){
      sep=xtSeparador(l); cab=xtCampos(l,sep).map(h=>h.toUpperCase());
      const falta=precisa.filter(c=>!cab.includes(c));
      if(falta.length)throw new Error(`O arquivo de escolas do INEP${ano?' de '+ano:''} não tem as colunas ${falta.join(', ')}. `
        +'A partir de 2025 o INEP separou as matrículas numa tabela própria; para essas edições, use o recorte geral, mais abaixo.');
      precisa.forEach(c=>ix[c]=cab.indexOf(c));
      return;
    }
    if(!tem.test(l))return;
    const r=xtCampos(l,sep), c=xtMuni(r[ix.CO_MUNICIPIO]);
    if(!c||!acc[c])return;
    n++;
    if(String(r[ix.TP_SITUACAO_FUNCIONAMENTO]).trim()!=='1')return;
    ativas++;
    const rede=String(r[ix.TP_DEPENDENCIA]).trim()==='4'?'priv':'pub';
    esc_[c][rede]++;
    INEP_ETAPAS.forEach(([k,cols])=>{
      let s=0; cols.forEach(col=>{const v=parseNum(r[ix[col]]); if(!Number.isNaN(v))s+=v;});
      acc[c][rede][k]=(acc[c][rede][k]||0)+s;
    });
  },f=>xtProgresso(el,f,`Lendo ${xtBase(fonte.nome)}… ${Math.round(100*f)}%`));
  const faltam=XT_CODS().filter(c=>!esc_[c].pub&&!esc_[c].priv);
  if(faltam.length)throw new Error(`O arquivo não tem escolas em atividade de ${faltam.map(nomeDoCod).join(', ')}. Confira se é o arquivo nacional (ou do RS) do Censo Escolar.`);
  const indicadores=[], valores={municipio:{}};
  INEP_ETAPAS.forEach(([k,cols,rot])=>['pub','priv'].forEach(rede=>{
    const id=`inep_mat_${k}_${rede}`;
    indicadores.push({id,cat:'educacao',n:`${rot}, rede ${rede==='pub'?'pública':'privada'}`,u:'matrículas',fmt:'int',ramp:'agua',
      niveis:['municipio'],obs:`Soma de ${cols.join(' + ')} das escolas em atividade (TP_SITUACAO_FUNCIONAMENTO = 1), por município. `
        +`Rede ${rede==='pub'?'pública: federal, estadual e municipal':'privada: TP_DEPENDENCIA = 4'}. Mesmo cálculo do script extracao/R/03_censo_escolar_matriculas.R.`});
    XT_CODS().forEach(c=>{(valores.municipio[c]=valores.municipio[c]||{})[id]=acc[c][rede][k]||0;});
  }));
  const item={id:'inep_matriculas',titulo:`Matrículas do Censo Escolar${ano?' '+ano:''}`,ano,status:'ok',origem:xtBase(fonte.nome),
    fonte:{n:`INEP — Censo Escolar${ano?' '+ano:''}, microdados`,s:'INEP',
      u:'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-escolar',
      d:'Matrículas por etapa e rede das escolas em atividade, somadas por município.'},
    indicadores,valores,resumo:`${nf.format(ativas)} escolas em atividade nos sete municípios; 12 indicadores de matrícula`};
  await xtConclui(item);
  el.innerHTML=`<div class="note">Pronto: ${esc(item.resumo)}. Estão em <b>Educação</b>, no nível município.</div>
    <div class="tb-scroll"><table class="tb"><thead><tr><th>Município</th><th style="text-align:right">Creche pública</th>
      <th style="text-align:right">Pré-escola pública</th><th style="text-align:right">Fundamental público</th><th style="text-align:right">Médio público</th></tr></thead>
    <tbody>${XT_CODS().map(c=>`<tr><td>${esc(nomeDoCod(c))}</td>${['creche','pre','fund','med'].map(k=>
      `<td class="num" style="text-align:right">${fmtN(acc[c].pub[k]||0,'int')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

/* Censo 2010, amostra (IBGE): os indicadores do extracao/R/01 e a conferência
   do 11 (achado E3 da auditoria), lendo o leiaute do próprio IBGE. */
const C10_VARS=['V0001','V0002','V0011','V0300','V0010','V0502','V0601','V6036','V0628','V6910',
  'V0614','V0615','V0616','V0617','V0618','V0657','V6531'];
const C10_TAXAS=[
  ['c10_desocup_homens','Taxa de desocupação dos homens','desoc_h','pea_h','trabalho'],
  ['c10_desocup_mulheres','Taxa de desocupação das mulheres','desoc_m','pea_m','trabalho'],
  ['c10_desocup_18_24','Taxa de desocupação de 18 a 24 anos','desoc_18_24','pea_18_24','trabalho'],
  ['c10_desocup_25_29','Taxa de desocupação de 25 a 29 anos','desoc_25_29','pea_25_29','trabalho'],
  ['c10_desocup_30_59','Taxa de desocupação de 30 a 59 anos','desoc_30_59','pea_30_59','trabalho'],
  ['c10_nem_nem_15_24','Jovens de 15 a 24 anos que não estudam nem trabalham','nem_nem','jovens','vulner'],
  ['c10_dom_chefia_feminina','Domicílios chefiados por mulheres','dom_chefe_mulher','domicilios','demografia'],
  ['c10_idosos_sos','Pessoas de 60 anos ou mais que moram sozinhas','idosos_sos','idosos','vulner'],
  ['c10_deficiencia','Pessoas com deficiência','deficiencia','pop','saude'],
  ['c10_nao_naturais','Pessoas que não nasceram no município','nao_natural','pop','demografia'],
  ['c10_pessoas_bolsa','Pessoas com rendimento do Bolsa Família ou PETI','pessoas_bolsa','pop','assistencia'],
  ['c10_dom_bolsa','Domicílios com rendimento do Bolsa Família ou PETI','dom_com_bolsa','domicilios','assistencia']];
/* leiaute: a aba com as variáveis de pessoas; colunas de nome, início, fim e decimais */
async function xtLeiaute(bytes){
  const abas=await xtPlanilha(bytes);
  for(const a of abas){
    const L=a.linhas;
    const iCab=L.findIndex(r=>r&&r.some(c=>/inicial/i.test(String(c??'')))&&r.some(c=>/final/i.test(String(c??''))));
    if(iCab<0)continue;
    const cab=L[iCab].map(c=>norm(String(c??'')));
    const jIni=cab.findIndex(h=>/inicial/.test(h)), jFim=cab.findIndex(h=>/final/.test(h)), jDec=cab.findIndex(h=>/^dec/.test(h));
    const mapa={};
    L.slice(iCab+1).forEach(r=>{
      if(!r)return;
      const v=r.map(c=>String(c??'').trim()).find(c=>/^V\d{4}$/i.test(c));
      const ini=parseInt(r[jIni],10), fim=parseInt(r[jFim],10);
      if(v&&ini>0&&fim>=ini)mapa[v.toUpperCase()]={ini:ini-1,fim,dec:jDec>=0?(parseInt(r[jDec],10)||0):0};
    });
    if(mapa.V0601&&mapa.V0010)return mapa;
  }
  throw new Error('Não achei, na planilha, o leiaute das pessoas (colunas de posição inicial e final, com V0601 e V0010). Solte a planilha Layout_microdados_Amostra que vem na Documentacao.zip do IBGE.');
}
function xtGini(xs,ws){
  const o=xs.map((x,i)=>i).sort((a,b)=>xs[a]-xs[b]);
  let W=0,X=0; o.forEach(i=>{W+=ws[i];X+=xs[i]*ws[i];});
  if(!W||!X)return null;
  let cw=0,cx=0,g=0;
  o.forEach(i=>{const nw=cw+ws[i]/W, nx=cx+xs[i]*ws[i]/X; g+=(nw-cw)*(nx+cx); cw=nw; cx=nx;});
  return 1-g;
}
async function xtCenso2010(files,el){
  const fontes=await xtFontesDe(files);
  const fLei=fontes.find(f=>xtEhPlanilha(f.nome)&&/(layout|leiaute).*(amostra|pess)/i.test(xtBase(f.nome)))
    ||fontes.find(f=>xtEhPlanilha(f.nome)&&/(layout|leiaute)/i.test(xtBase(f.nome)));
  const fMic=fontes.find(f=>/amostra_pessoas_43\.txt$/i.test(xtBase(f.nome)))||fontes.find(f=>/amostra_pessoas.*\.txt$/i.test(xtBase(f.nome)));
  if(!fLei||!fMic)throw new Error('Faltam arquivos. Solte os dois ZIPs do IBGE juntos: '
    +(fMic?'':'RS.zip (com Amostra_Pessoas_43.txt) ')+(fLei?'':'e Documentacao.zip (com a planilha de leiaute)')+'.');
  xtProgresso(el,0,'Lendo o leiaute do IBGE…');
  const L=await xtLeiaute(await fLei.bytes());
  const falta=C10_VARS.filter(v=>!L[v]);
  if(falta.length)throw new Error(`O leiaute não tem as variáveis ${falta.join(', ')}.`);
  const temSM=!!L.V6532;
  const pega=(l,v)=>{const p=L[v]; const s=l.slice(p.ini,p.fim).trim(); if(!s)return null;
    let x=+s; if(Number.isNaN(x))return null; if(p.dec&&s.indexOf('.')<0)x/=10**p.dec; return x;};
  const cods=XT_CODS(), idx=new Map(cods.map((c,i)=>[c,i]));
  const P=[];                                              /* pessoas dos sete municípios */
  const pUF=L.V0001, pMu=L.V0002;
  await xtLinhas(fMic,l=>{
    const c=l.slice(pUF.ini,pUF.fim).trim()+l.slice(pMu.ini,pMu.fim).trim();
    const m=idx.get(c); if(m==null)return;
    const g=v=>pega(l,v);
    P.push({m,ap:l.slice(L.V0011.ini,L.V0011.fim).trim(),dom:l.slice(L.V0300.ini,L.V0300.fim).trim(),
      w:g('V0010'),rel:g('V0502'),sexo:g('V0601'),idade:g('V6036'),freq:g('V0628'),ocup:g('V6910'),
      dif:[g('V0614'),g('V0615'),g('V0616')].some(x=>x===1||x===2)||g('V0617')===1,
      nn:g('V0618')===3,bolsa:g('V0657')===1,rpc:g('V6531'),sm:temSM?g('V6532'):null});
  },f=>xtProgresso(el,f,`Lendo os microdados… ${Math.round(100*f)}%`));
  xtProgresso(el,1,`Conferindo ${nf.format(P.length)} pessoas…`);
  /* conferências: os sete municípios, a escala da renda e a soma dos pesos */
  const nPor=cods.map((_,i)=>P.filter(p=>p.m===i).length);
  const faltam=cods.filter((_,i)=>!nPor[i]).map(nomeDoCod);
  if(faltam.length)throw new Error(`Os microdados não têm ${faltam.join(', ')}. Confira se é o arquivo do Rio Grande do Sul (RS.zip).`);
  const rendas=P.map(p=>p.rpc).filter(x=>x!=null).sort((a,b)=>a-b);
  const med=rendas[Math.floor(rendas.length/2)];
  if(!(med>=100&&med<=5000))throw new Error(`A mediana da renda per capita (V6531) deu R$ ${fmtN(med,'dec2')}, fora da escala de 2010. Confira o leiaute.`);
  const popPeso=cods.map((_,i)=>P.reduce((a,p)=>a+(p.m===i?p.w||0:0),0));
  const pop10=ADH_IPEA&&ADH_IPEA.valores.populacao?cods.map(c=>(ADH_IPEA.valores.populacao[c]||[])[2]):null;
  if(pop10){
    const ruim=cods.map((c,i)=>({c,d:pop10[i]?Math.abs(popPeso[i]/pop10[i]-1):0})).filter(x=>x.d>0.01);
    if(ruim.length)throw new Error(`A soma dos pesos (V0010) não reproduz a população de 2010 em ${ruim.map(x=>nomeDoCod(x.c)+` (${fmtN(100*x.d,'dec1')}% de diferença)`).join(', ')}. Confira o leiaute: o peso tem casas decimais implícitas.`);
  }
  /* domicílios particulares: moradores, peso do responsável, chefia, Bolsa Família */
  const doms=new Map();
  P.forEach(p=>{if(p.rel===20)return; const k=p.ap+'|'+p.dom;
    const d=doms.get(k)||{m:p.m,ap:p.ap,mor:0,peso:null,chefeM:false,bolsa:false}; d.mor++;
    if(p.rel===1&&d.peso==null)d.peso=p.w; if(p.rel===1&&p.sexo===2)d.chefeM=true; if(p.bolsa)d.bolsa=true; doms.set(k,d);});
  const novo=()=>({pea_h:0,desoc_h:0,pea_m:0,desoc_m:0,pea_18_24:0,desoc_18_24:0,pea_25_29:0,desoc_25_29:0,pea_30_59:0,desoc_30_59:0,
    jovens:0,nem_nem:0,idosos:0,idosos_sos:0,pop:0,deficiencia:0,nao_natural:0,pessoas_bolsa:0,domicilios:0,dom_chefe_mulher:0,dom_com_bolsa:0,n:0});
  const porM=cods.map(novo), porAP=new Map();
  const soma=(o,p,d)=>{
    const w=p.w||0, pea=p.ocup===1||p.ocup===2, des=p.ocup===2, priv=p.rel!==20, id=p.idade;
    o.n++; o.pop+=w;
    if(pea&&p.sexo===1)o.pea_h+=w; if(des&&p.sexo===1)o.desoc_h+=w;
    if(pea&&p.sexo===2)o.pea_m+=w; if(des&&p.sexo===2)o.desoc_m+=w;
    const fx=id>=18&&id<=24?'18_24':id>=25&&id<=29?'25_29':id>=30&&id<=59?'30_59':null;
    if(fx){if(pea)o['pea_'+fx]+=w; if(des)o['desoc_'+fx]+=w;}
    const jovem=id>=15&&id<=24; if(jovem){o.jovens+=w; if(!(p.freq===1||p.freq===2)&&p.ocup!==1)o.nem_nem+=w;}
    if(id>=60&&priv){o.idosos+=w; if(d&&d.mor===1)o.idosos_sos+=w;}
    if(p.dif)o.deficiencia+=w; if(p.nn)o.nao_natural+=w; if(p.bolsa)o.pessoas_bolsa+=w;
  };
  P.forEach(p=>{const d=p.rel===20?null:doms.get(p.ap+'|'+p.dom);
    soma(porM[p.m],p,d); const a=porAP.get(p.ap)||Object.assign(novo(),{m:p.m}); soma(a,p,d); porAP.set(p.ap,a);});
  doms.forEach(d=>{if(d.peso==null)return; [porM[d.m],porAP.get(d.ap)].forEach(o=>{o.domicilios+=d.peso;
    if(d.chefeM)o.dom_chefe_mulher+=d.peso; if(d.bolsa)o.dom_com_bolsa+=d.peso;});});
  const taxa=(o,a,b)=>o[b]>0?100*o[a]/o[b]:null;
  const indicadores=C10_TAXAS.map(([id,n,a,b,cat])=>({id,cat,n,u:'%',fmt:'pct1',ramp:'brasa',niveis:['municipio'],status:'est',
    obs:`Censo 2010, amostra: ${a} ÷ ${b}, com o peso amostral (V0010), somando todos os registros do município. Mesmo cálculo do script extracao/R/01_censo2010_areas_ponderacao.R. Cálculo do Atlas sobre os microdados do IBGE.`}));
  const valores={municipio:{}};
  cods.forEach((c,i)=>{valores.municipio[c]={}; C10_TAXAS.forEach(([id,,a,b])=>{const v=taxa(porM[i],a,b); if(v!=null)valores.municipio[c][id]=Math.round(100*v)/100;});});
  /* conferência E3: três versões da renda (extracao/R/11_confere_renda_2010.R) */
  const versoes={A:p=>true,B:p=>p.rpc!=null,C:p=>p.rpc!=null&&![17,18,19].includes(p.rel)};
  const E3=[];
  cods.forEach((c,i)=>{
    const muni=P.filter(p=>p.m===i);
    Object.entries(versoes).forEach(([v,f])=>{
      const g=muni.filter(f), W=g.reduce((a,p)=>a+(p.w||0),0);
      const rpc=p=>p.rpc==null?0:p.rpc, sm=p=>p.sm!=null?p.sm:rpc(p)/510;
      const pc=t=>W?100*g.reduce((a,p)=>a+(t(p)?p.w||0:0),0)/W:null;
      E3.push({cod:c,versao:v,meio_lt:pc(p=>sm(p)<0.5),meio_le:pc(p=>sm(p)<=0.5),quarto_lt:pc(p=>sm(p)<0.25),
        quarto_le:pc(p=>sm(p)<=0.25),ate140:pc(p=>rpc(p)<=140),ate70:pc(p=>rpc(p)<=70),
        renda:W?g.reduce((a,p)=>a+(p.w||0)*rpc(p),0)/W:null,gini:xtGini(g.map(rpc),g.map(p=>p.w||0))});
    });
  });
  const veredito=xtVeredito(E3);
  /* tabela por área de ponderação, para quem quiser levar ao setor */
  const apTab=[['codigo_municipio','municipio','area_ponderacao','registros'].concat(C10_TAXAS.map(t=>t[0]))];
  porAP.forEach((o,ap)=>apTab.push([cods[o.m],nomeDoCod(cods[o.m]),ap,o.n].concat(C10_TAXAS.map(([,,a,b])=>{const v=taxa(o,a,b);return v==null?'':Math.round(100*v)/100;}))));
  const item={id:'censo2010_amostra',titulo:'Censo 2010, amostra: novos recortes e conferência da renda',ano:2010,status:'est',
    origem:`${xtBase(fMic.nome)} e ${xtBase(fLei.nome)}`,
    fonte:{n:'IBGE — Censo 2010, amostra (cálculo do Atlas sobre os microdados)',s:'Censo 2010',
      u:'https://ftp.ibge.gov.br/Censos/Censo_Demografico_2010/Resultados_Gerais_da_Amostra/Microdados/',
      d:'Microdados da amostra do Censo Demográfico 2010, lidos com o leiaute publicado pelo IBGE.'},
    indicadores,valores,e3:{linhas:E3,veredito},ap:apTab,
    resumo:`${nf.format(P.length)} pessoas na amostra; 12 indicadores por município e a conferência da renda (achado E3)`};
  await xtConclui(item);
  el.innerHTML=xtE3HTML(item)+`<div class="btn-row"><button class="btn" id="xtBaixaAP">Baixar por área de ponderação (CSV)</button>
    <button class="btn" id="xtBaixaE3">Baixar a conferência da renda (CSV)</button></div>`;
  $('#xtBaixaAP').onclick=()=>baixaCSV(apTab,'censo2010-areas-de-ponderacao.csv');
  $('#xtBaixaE3').onclick=()=>baixaCSV([Object.keys(E3[0])].concat(E3.map(r=>Object.values(r))),'censo2010-conferencia-renda.csv');
}
/* qual versão reproduz o Atlas e qual reproduz o Atlas Brasil */
function xtVeredito(E3){
  const M=Object.fromEntries(((S.geo.municipio||{}).features||[]).map(f=>[String(MUNIS_LISTA.ids[f.properties.muni_id]),f.properties]));
  const at=c=>MUNICIPAL_2010[c]||{};
  const testes=[
    ['Atlas','pobreza (½ salário mínimo)',c=>at(c).pct_pobreza,['meio_lt','meio_le']],
    ['Atlas','extrema pobreza (¼ de salário mínimo)',c=>at(c).pct_extrema_pobreza,['quarto_lt','quarto_le']],
    ['Atlas','renda per capita média',c=>at(c).rdpc_media,['renda']],
    ['Atlas','Gini',c=>at(c).gini_rdpc,['gini']],
    ['Atlas Brasil','vulneráveis à pobreza (até R$ 255)',c=>(M[c]||{}).adh_vulner_pobreza,['meio_le']],
    ['Atlas Brasil','pobres (até R$ 140)',c=>(M[c]||{}).adh_pobreza,['ate140']],
    ['Atlas Brasil','extremamente pobres (até R$ 70)',c=>(M[c]||{}).adh_extrema_pobreza,['ate70']],
    ['Atlas Brasil','renda per capita',c=>(M[c]||{}).adh_renda_pc,['renda']],
    ['Atlas Brasil','Gini',c=>(M[c]||{}).adh_gini,['gini']]];
  return testes.map(([quem,o,ref,campos])=>{
    let melhor=null;
    ['A','B','C'].forEach(v=>campos.forEach(k=>{
      const d=E3.filter(r=>r.versao===v).map(r=>{const a=ref(r.cod);return a==null||r[k]==null?null:Math.abs(r[k]-a);}).filter(x=>x!=null);
      if(d.length<5)return;
      const m=d.reduce((a,b)=>a+b,0)/d.length;
      if(!melhor||m<melhor.dif)melhor={versao:v,campo:k,dif:m};
    }));
    return {quem,o,melhor};
  }).filter(t=>t.melhor);
}
const XT_VERSAO={A:'A — renda ausente conta como zero',B:'B — renda ausente fica de fora',C:'C — como B, sem pensionistas e empregados domésticos'};
/* modo: '' depois de extrair no cartão; 'pacote' no cartão, quando o resultado já vem no pacote;
   'metodo' na tela de metodologia */
function xtE3HTML(item,modo=''){
  const v=item.e3.veredito, fm=o=>/Gini/.test(o)?'dec3':/renda/.test(o)?'brl':'dec2';
  const atl=v.filter(t=>t.quem==='Atlas'), bra=v.filter(t=>t.quem==='Atlas Brasil');
  const conta=l=>{const c={};l.forEach(t=>c[t.melhor.versao]=(c[t.melhor.versao]||0)+1);return Object.entries(c).sort((a,b)=>b[1]-a[1])[0];};
  const va=atl.length?conta(atl):null, vb=bra.length?conta(bra):null;
  const topo=modo==='metodo'?'':modo==='pacote'
    ?`<div class="note"><b>Já no pacote do Atlas:</b> ${esc(item.resumo)}, calculados por extracao/10_censo2010_amostra.py com os
      microdados da amostra na versão do pacote censobr (IPEA). Os indicadores estão no catálogo, no nível município, como referência
      histórica de 2010. Soltar aqui o RS.zip e a Documentacao.zip do IBGE refaz o cálculo com os arquivos originais.</div>`
    :`<div class="note">Pronto: ${esc(item.resumo)}. Os 12 indicadores estão no catálogo, no nível município, como referência histórica de 2010.</div>`;
  return `${topo}
  <h4 class="xt-sub">Conferência da renda de 2010 (achado E3 da auditoria)</h4>
  <p class="xt-msg">A pobreza, a renda e o Gini de 2010 foram recalculados de três jeitos. A tabela mostra, para cada número,
    qual versão chega mais perto, e a diferença média nos sete municípios.</p>
  <div class="tb-scroll"><table class="tb"><thead><tr><th>Comparado com</th><th>Indicador</th><th>Versão mais próxima</th><th style="text-align:right">Diferença média</th></tr></thead>
  <tbody>${v.map(t=>`<tr><td>${esc(t.quem)}</td><td>${esc(t.o)}</td><td>${esc(t.melhor.versao)}${/_le$/.test(t.melhor.campo)?' (com “até”)':/_lt$/.test(t.melhor.campo)?' (com “abaixo de”)':''}</td>
    <td class="num" style="text-align:right">${fmtN(t.melhor.dif,fm(t.o))}${/pobre|vulner|pobreza/.test(t.o)?' ponto':''}</td></tr>`).join('')}</tbody></table></div>
  ${va&&vb?`<p class="xt-msg"><b>Leitura.</b> O cálculo do Atlas fica mais perto da versão ${esc(XT_VERSAO[va[0]])};
    o Atlas Brasil, da versão ${esc(XT_VERSAO[vb[0]])}.
    ${va[0]!==vb[0]?'As duas diferem: os números de 2010 do Atlas devem ser refeitos pela versão do Atlas Brasil, e o achado E3 se confirma.'
      :'As duas coincidem: a diferença entre o Atlas e o Atlas Brasil não vem da renda ausente.'}</p>`:''}`;
}

/* OpenStreetMap: cultura, lazer e espaços públicos (extracao/R/08). A Overpass
   API deixa uma página ler direto. Dado colaborativo: entra como não oficial. */
const OSM_TIPOS={park:'Parque',playground:'Parquinho',pitch:'Quadra ou campo',sports_centre:'Centro esportivo',
  fitness_station:'Academia ao ar livre',library:'Biblioteca',community_centre:'Centro comunitário',theatre:'Teatro',
  arts_centre:'Centro cultural',cinema:'Cinema',social_centre:'Centro social'};
const OSM_LAZER=['park','playground','pitch','sports_centre','fitness_station'];
async function xtOSM(el){
  const caixa='-30.30,-51.35,-29.78,-50.85';
  const q=`[out:json][timeout:180];(nwr["leisure"~"^(${OSM_LAZER.join('|')})$"](${caixa});`+
    `nwr["amenity"~"^(library|community_centre|theatre|arts_centre|cinema|social_centre)$"](${caixa}););out center tags;`;
  const servidores=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
  let j=null, ult=null;
  for(const s of servidores){
    xtProgresso(el,0.15,`Consultando o OpenStreetMap (${new URL(s).host})…`);
    try{const r=await fetch(s,{method:'POST',body:'data='+encodeURIComponent(q),
        headers:{'Content-Type':'application/x-www-form-urlencoded'}});
      if(!r.ok)throw new Error('HTTP '+r.status); j=await r.json(); break;}
    catch(e){ult=e;}
  }
  if(!j)throw new Error(`O OpenStreetMap não respondeu (${ult&&ult.message}). Tente de novo em alguns minutos.`);
  if(!Array.isArray(j.elements))throw new Error('Resposta do OpenStreetMap em formato inesperado.');
  xtProgresso(el,0.7,`Separando ${nf.format(j.elements.length)} lugares por município e bairro…`);
  const vistos=new Set(), brutos=[];
  j.elements.forEach(e=>{
    const t=(e.tags||{}), tipo=OSM_TIPOS[t.leisure]?t.leisure:OSM_TIPOS[t.amenity]?t.amenity:null;
    const lat=e.lat??(e.center||{}).lat, lon=e.lon??(e.center||{}).lon;
    if(!tipo||lat==null||lon==null||vistos.has(e.type+e.id))return;
    vistos.add(e.type+e.id);
    brutos.push({nome:t.name||OSM_TIPOS[tipo],x:+lon,y:+lat,tipo,rot:OSM_TIPOS[tipo],grupo:OSM_LAZER.includes(tipo)?'lazer':'cultura'});
  });
  const fs=(S.geo.municipio||{}).features||[], itens=[];
  brutos.forEach(q=>{const f=fs.find(m=>pontoNaGeometria(q.x,q.y,m.geometry)); if(f){q.muni=f.properties.nome;itens.push(q);}});
  if(!itens.length)throw new Error('O OpenStreetMap não devolveu nenhum lugar dentro dos sete municípios.');
  const valores={municipio:{},bairro:{}};
  ['lazer','cultura'].forEach(g=>xtContaPorBairro(itens.filter(q=>q.grupo===g),'osm_'+g,valores));
  /* por 10 mil habitantes, com a população do Censo 2022 */
  const por10=(o,p)=>{['lazer','cultura'].forEach(g=>{const v=o['osm_'+g]; if(v!=null&&p.pop>0)o[`osm_${g}_10mil`]=Math.round(1e6*v/p.pop)/100;});};
  ((S.geo.municipio||{}).features||[]).forEach(f=>{const c=String(MUNIS_LISTA.ids[f.properties.muni_id]); if(valores.municipio[c])por10(valores.municipio[c],f.properties);});
  S.geo.bairro.features.forEach(f=>{const o=valores.bairro[f.properties.id]; if(o)por10(o,f.properties);});
  const OBS='OpenStreetMap, mapa colaborativo (licença ODbL; © colaboradores do OpenStreetMap). Não é cadastro oficial: a cobertura varia de bairro para bairro e a ausência de um ponto não prova a ausência do lugar. Contagem por ponto dentro do polígono; áreas (parques, quadras) entram pelo centro do contorno.';
  const LZ='parques, parquinhos, quadras e campos, centros esportivos e academias ao ar livre', CT='bibliotecas, centros comunitários, teatros, centros culturais, cinemas e centros sociais';
  const ind_=(id,n,u,fmt,obs)=>({id,cat:'ambiente',n,u,fmt,ramp:'agua',niveis:['municipio','bairro'],status:'ext',obs:obs+' '+OBS});
  const item={id:'osm_cultura_lazer',titulo:'Cultura e lazer (OpenStreetMap)',ano:new Date().getFullYear(),status:'ext',origem:'Overpass API',
    fonte:{n:'OpenStreetMap — cultura, lazer e espaços públicos',s:'OpenStreetMap',u:'https://www.openstreetmap.org/',d:'Dado colaborativo, não oficial.'},
    indicadores:[ind_('osm_lazer','Espaços de lazer e esporte (OpenStreetMap)','lugares','int',`Conta ${LZ}.`),
      ind_('osm_cultura','Equipamentos culturais e comunitários (OpenStreetMap)','lugares','int',`Conta ${CT}.`),
      ind_('osm_lazer_10mil','Espaços de lazer e esporte por 10 mil habitantes (OpenStreetMap)','por 10 mil hab.','dec2',`${LZ}; população do Censo 2022.`),
      ind_('osm_cultura_10mil','Equipamentos culturais e comunitários por 10 mil habitantes (OpenStreetMap)','por 10 mil hab.','dec2',`${CT}; população do Censo 2022.`)],
    valores,pontos:{chave:'xt_osm',rot:'Cultura e lazer (OpenStreetMap)',cor:'#2f7d8c',itens},
    resumo:`${nf.format(itens.length)} lugares nos sete municípios`};
  await xtConclui(item);
  const porTipo={}; itens.forEach(q=>porTipo[q.rot]=(porTipo[q.rot]||0)+1);
  el.innerHTML=`<div class="note">Pronto: ${esc(item.resumo)} (${Object.entries(porTipo).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${esc(k)} ${nf.format(n)}`).join(' · ')}).
    A camada está no painel de camadas do mapa, e os indicadores em <b>Ambiente Urbano</b>, por município e bairro.</div>`;
}

/* IBGE: qualquer tabela do SIDRA com dado por município (API de agregados). */
let XT_SIDRA=null;
async function xtSidraLista(){
  if(XT_SIDRA)return XT_SIDRA;
  const j=await (await buscaFonte('https://servicodados.ibge.gov.br/api/v3/agregados?nivel=N6')).json();
  if(!Array.isArray(j))throw new Error('Resposta do IBGE em formato inesperado.');
  const out=[]; j.forEach(p=>(p.agregados||[]).forEach(a=>out.push({id:String(a.id),nome:a.nome,pesquisa:p.nome,chave:norm(a.nome+' '+p.nome+' '+a.id)})));
  return XT_SIDRA=out;
}
function xtSidraValor(s){
  if(s==null)return null; const t=String(s).trim();
  if(t==='-')return 0;                         /* no SIDRA, "-" é zero absoluto */
  if(/^(\.\.\.?|x|)$/i.test(t))return null;     /* "...", "..", "X": não disponível, não se aplica, sigilo */
  const v=+t; return Number.isNaN(v)?null:v;
}
async function xtSidraBusca(texto,el){
  const lista=await xtSidraLista();
  const ps=norm(texto).split(/\s+/).filter(Boolean);
  const r=lista.filter(a=>ps.every(p=>a.chave.includes(p))).slice(0,30);
  el.innerHTML=r.length?r.map(a=>`<button class="xt-res" data-t="${esc(a.id)}"><b>${esc(a.id)}</b> ${esc(a.nome)}
      <small>${esc(a.pesquisa)}</small></button>`).join('')
    :'<p class="xt-msg">Nenhuma tabela com essas palavras e dado por município. Tente outras palavras (ex.: “rendimento”, “alfabetização”, “domicílios”).</p>';
  el.querySelectorAll('.xt-res').forEach(b=>b.onclick=()=>xtSidraTabela(b.dataset.t,el));
}
async function xtSidraTabela(id,el){
  xtProgresso(el,0.3,`Lendo a descrição da tabela ${id}…`);
  try{
    const base=`https://servicodados.ibge.gov.br/api/v3/agregados/${id}`;
    const [meta,pers]=await Promise.all([(await buscaFonte(base+'/metadados')).json(),(await buscaFonte(base+'/periodos')).json()]);
    const nivs=((meta.nivelTerritorial||{}).Administrativo)||[];
    if(!nivs.includes('N6'))return xtErro(el,`A tabela ${id} não tem dado por município.`);
    const cl=meta.classificacoes||[];
    el.innerHTML=`<p class="xt-msg"><b>${esc(id)} · ${esc(meta.nome)}</b></p>
      <label class="xt-campo">Período <select id="xtSP">${pers.map(p=>`<option value="${esc(p.id)}">${esc(p.literals?p.literals[0]:p.id)}</option>`).reverse().join('')}</select></label>
      <label class="xt-campo">Variável <select id="xtSV">${(meta.variaveis||[]).map(v=>`<option value="${v.id}">${esc(v.nome)}${v.unidade?' ('+esc(v.unidade)+')':''}</option>`).join('')}</select></label>
      ${cl.map(c=>{const tot=(c.categorias||[]).find(k=>/^total$/i.test(k.nome))||(c.categorias||[])[0]||{};
        return `<label class="xt-campo">${esc(c.nome)} <select class="xtSC" data-c="${c.id}">${(c.categorias||[]).map(k=>
          `<option value="${k.id}" ${k.id===tot.id?'selected':''}>${esc(k.nome)}</option>`).join('')}</select></label>`;}).join('')}
      <div class="btn-row"><button class="btn pri" id="xtSBusca">Buscar os sete municípios</button></div><div id="xtSRes"></div>`;
    $('#xtSBusca').onclick=()=>xtSidraValores(id,meta,el).catch(e=>xtErro($('#xtSRes'),e.message));
  }catch(e){xtErro(el,e.message||'O IBGE não respondeu.');}
}
async function xtSidraValores(id,meta,el){
  const p=$('#xtSP').value, v=$('#xtSV').value;
  const cls=[...document.querySelectorAll('.xtSC')].map(s=>({c:s.dataset.c,k:s.value,nome:s.options[s.selectedIndex].text,
    cl:(meta.classificacoes||[]).find(x=>String(x.id)===s.dataset.c)}));
  const url=`https://servicodados.ibge.gov.br/api/v3/agregados/${id}/periodos/${encodeURIComponent(p)}/variaveis/${v}`+
    `?localidades=N6[${XT_CODS().join(',')}]`+(cls.length?`&classificacao=${cls.map(x=>`${x.c}[${x.k}]`).join('|')}`:'');
  xtProgresso($('#xtSRes'),0.5,'Buscando no IBGE…');
  const j=await (await buscaFonte(url)).json();
  const res=Array.isArray(j)&&j[0]&&j[0].resultados&&j[0].resultados[0];
  if(!res)throw new Error('O IBGE respondeu sem resultados para essa combinação.');
  const vals={}; (res.series||[]).forEach(s=>{const c=String((s.localidade||{}).id);const x=xtSidraValor((s.serie||{})[p]); if(x!=null)vals[c]=x;});
  const faltam=XT_CODS().filter(c=>vals[c]==null).map(nomeDoCod);
  if(faltam.length===7)throw new Error('O IBGE não tem valor para nenhum dos sete municípios nessa combinação.');
  const vv=(meta.variaveis||[]).find(x=>String(x.id)===String(v))||{nome:'variável '+v,unidade:''};
  const cats=cls.filter(x=>!/^total$/i.test(x.nome)).map(x=>x.nome);
  const ident=`sidra_${id}_${v}`+(cls.length?'_'+cls.map(x=>x.k).join('_'):'');
  const inteiros=Object.values(vals).every(x=>Number.isInteger(x));
  const ano=/^\d{4}$/.test(p)?+p:null;
  const n=vv.nome+(cats.length?` (${cats.join(', ')})`:'');
  const item={id:ident,titulo:`IBGE ${id}: ${n}`,ano,status:'ok',origem:'API de agregados do IBGE',
    fonte:{n:`IBGE — tabela ${id} do SIDRA: ${meta.nome}`,s:'IBGE/SIDRA',u:`https://sidra.ibge.gov.br/tabela/${id}`,
      d:'Lido da API de agregados do IBGE (servicodados.ibge.gov.br). No SIDRA, “-” é zero; “...”, “..” e “X” ficam sem valor.'},
    indicadores:[{id:ident,cat:'visao',n,u:vv.unidade||'valor',fmt:/^%$/.test(vv.unidade||'')?'pct2':inteiros?'int':'dec2',ramp:'agua',
      niveis:['municipio'],obs:`Tabela ${id} do SIDRA, período ${p}${cls.length?', '+cls.map(x=>`${x.cl?x.cl.nome:x.c}: ${x.nome}`).join('; '):''}.`}],
    valores:{municipio:Object.fromEntries(Object.entries(vals).map(([c,x])=>[c,{[ident]:x}]))},
    resumo:`${n}, ${p}${faltam.length?` (sem valor para ${faltam.join(', ')})`:''}`};
  await xtConclui(item);
  $('#xtSRes').innerHTML=`<div class="note">Pronto: ${esc(item.resumo)}. Está em <b>Visão Geral</b>, no nível município.</div>`;
}

/* ---- 27.6 Ipeadata pelo navegador -----------------------------------------
   A varredura das séries do Ipeadata (IPEA) com valor para os sete municípios, com as
   mesmas regras do extracao/7_ipeadata.py. Funciona se o servidor do Ipeadata liberar a
   leitura por páginas (CORS). Se não liberar, o cartão diz isso e indica o script, que faz
   o mesmo trabalho e grava o arquivo de dados do Atlas. O endereço ?ipeadata=... troca a
   API (serve para testes). */
const IPD_API=(new URLSearchParams(location.search).get('ipeadata')||'https://www.ipeadata.gov.br/api/odata4').replace(/\/+$/,'');
const XT_IPD={series:null,aspas:true,nivel:null,anoMin:2000,filtro:{q:'',tema:'',so:true},marcadas:new Set(),rodando:false};
/* a tela pode ser fechada e aberta de novo durante a leitura: escreve sempre no cartão da tela aberta */
const ipdCorpo=el=>document.getElementById('xt-corpo-ipeadata')||el;
/* GET com tempo-limite; separa o bloqueio do navegador (CORS) da falta de rede */
async function ipdPega(url){
  const ctl=new AbortController(), t0=setTimeout(()=>ctl.abort(),120000);
  let r;
  try{r=await fetch(url,{signal:ctl.signal});}
  catch(e){
    clearTimeout(t0);
    if(e.name==='AbortError')throw Object.assign(new Error('o Ipeadata não respondeu em 2 minutos'),{tipo:'tempo'});
    let cors=false; try{await fetch(url,{mode:'no-cors'}); cors=true;}catch(e2){}
    throw Object.assign(new Error(cors?'o servidor do Ipeadata responde, mas não libera a leitura pelo navegador (CORS)'
      :'sem acesso ao Ipeadata (rede ou firewall)'),{tipo:cors?'cors':'rede'});
  }
  clearTimeout(t0);
  const txt=await r.text(); let j=null; try{j=JSON.parse(txt);}catch(e){}
  if(!r.ok)throw Object.assign(new Error(`o Ipeadata respondeu HTTP ${r.status}${j&&j.error&&j.error.message?': '+j.error.message:''}`),{status:r.status});
  if(!j)throw new Error('a resposta do Ipeadata não é JSON');
  return j;
}
/* segue as páginas (@odata.nextLink); com a API em https, a página seguinte também vai por https */
async function ipdOdata(caminho,params){
  let url=`${IPD_API}/${caminho}`+(params?'?'+params:''), n=0; const out=[];
  while(url){
    const j=await ipdPega(url);
    if(!Array.isArray(j.value))throw new Error('resposta do Ipeadata sem a lista "value"');
    for(const v of j.value)out.push(v);
    const prox=j['@odata.nextLink'];
    url=prox?new URL(prox,url).href:null;
    if(url&&/^https:/.test(IPD_API))url=url.replace(/^http:/,'https:');
    if(++n>2000)throw new Error('resposta do Ipeadata grande demais');
  }
  return out;
}
/* com $select; se a API recusar o $select, repete sem ele */
async function ipdCampos(caminho,params,campos){
  try{return await ipdOdata(caminho,(params?params+'&':'')+'$select='+campos);}
  catch(e){if(e.status===400)return ipdOdata(caminho,params);throw e;}
}
const ipdFiltro=c=>'$filter='+encodeURIComponent(`TERCODIGO eq ${XT_IPD.aspas?`'${c}'`:c}`);
const ipdNome=s=>String(s||'').replace(/\s+/g,' ').trim();
/* O que o Atlas já tem. Primeiro pelos valores: se os sete municípios têm o mesmo valor
   (até o arredondamento) num ano em comum com um indicador municipal do Atlas, é o mesmo
   dado. Depois pelo nome da série no Ipeadata; com nota, o Atlas tem algo parecido, mas
   com outra definição ou de outra fonte. */
const IPD_NO_ATLAS=[
  [/^IDHM\b.*educação/i,'idhm_educacao'],[/^IDHM\b.*longevidade/i,'idhm_longevidade'],[/^IDHM\b.*renda/i,'idhm_renda'],
  [/^IDHM\b/i,'idhm'],[/^Esperança de vida ao nascer \(Atlas DH/i,'idhm_esperanca_vida'],
  [/mortalidade até um ano de idade \(Atlas DH/i,'adh_mort_infantil'],[/mortalidade até cinco anos de idade \(Atlas DH/i,'adh_mort_5'],
  [/^Taxa de fecundidade total \(Atlas DH/i,'adh_fecundidade'],[/sobrevivência até 40 anos \(Atlas DH/i,'adh_sobrev_40'],
  [/sobrevivência até 60 anos \(Atlas DH/i,'adh_sobrev_60'],[/^Rendimento médio dos ocupados \(Atlas DH/i,'adh_renda_ocupados'],
  [/^População total \(/i,'pop'],[/^Índice de Gini.*\(Atlas DH/i,'adh_gini'],
  [/^PIB\b.*per capita/i,'pib_pc'],[/^PIB\b.*preços correntes/i,'pib'],[/^IFDM\b/i,'ifdm'],
  [/^Razão de dependência \(Atlas DH/i,'razao_dependencia','com outro corte de idade: o Atlas usa 60 anos; o Atlas DH, 65'],
  [/^Número de homicídios\b/i,'seg_vitimas_homicidio','de outra fonte: a SSP-RS conta registros policiais; o DATASUS, óbitos']];
/* vetores dos sete municípios por ano, de cada indicador municipal do Atlas */
function ipdVetoresAtlas(){
  const cods=XT_CODS(), pr={}, out=[];
  ((S.geo.municipio||{}).features||[]).forEach(f=>pr[String(MUNIS_LISTA.ids[f.properties.muni_id])]=f.properties);
  const num=x=>x==null||x===''||isNaN(+x)?null:+x;
  IND.forEach(i=>{
    if(!(i.niveis||[]).includes('municipio')||/^ipdn?_/.test(i.id))return;
    if(i.serie){
      const mun=i.serie.mun.map(String);
      i.serie.anos.forEach((a,j)=>out.push({ano:+a,n:i.n,v:cods.map(c=>{const k=mun.indexOf(c);return k>=0?num(i.serie.v[j][k]):null;})}));
    }else if(i.ano!=null)out.push({ano:+i.ano,n:i.n,v:cods.map(c=>num((pr[c]||{})[i.id]))});
  });
  /* só vetores completos e com valores diferentes entre si: sete zeros não identificam nada */
  return out.filter(x=>x.v.every(y=>y!=null)&&new Set(x.v.map(y=>y.toFixed(4))).size>=3);
}
const ipdPerto=(a,b)=>Math.abs(a-b)<=Math.max(0.003*Math.abs(b),0.006);
function ipdNoAtlas(cod,nome,r,vet){
  if(IPD_SERIES.some(s=>s.cod===cod))return {k:'mesmo',t:'no arquivo do Ipeadata do pacote'};
  if(getInd('ipdn_'+slugId(String(cod))))return {k:'mesmo',t:'trazida desta varredura'};
  if(r)for(const x of vet){
    const j=r.anos.indexOf(x.ano); if(j<0)continue;
    if(r.v[j].every((y,k)=>y!=null&&ipdPerto(y,x.v[k])))return {k:'mesmo',t:`${x.n} (mesmos valores em ${x.ano})`};
  }
  const m=IPD_NO_ATLAS.find(([re])=>re.test(ipdNome(nome))), i=m&&getInd(m[1]);
  return i?(m[2]?{k:'outro',t:`${i.n}, ${m[2]}`}:{k:'nome',t:i.n}):null;
}
const ipdJaTem=s=>!!s.noAtlas&&s.noAtlas.k!=='outro';
/* sugeridas: Bolsa Família, mortes violentas do DATASUS e IFDM, que o Atlas não tem por outra fonte */
const IPD_SUGERIDAS=/^(Programa Bolsa Família \(PBF\) - (número de benefícios|valor total dos benefícios) em dezembro|Número de (homicídios|suicídios|vítimas a óbito em acidente de trânsito)|IFDM)/i;
const ipdSugerida=s=>IPD_SUGERIDAS.test(ipdNome(s.m.SERNOME));
/* as regras do 7_ipeadata.py: um valor por ano, ano do mapa com os sete, nada completado */
function ipdAvalia(porMun,m,anoMin){
  if(!m)return [null,'sem metadado no Ipeadata'];
  if(m.SERNUMERICA===false)return [null,'série não numérica'];
  const tab={}, cods=XT_CODS();
  for(const mun in porMun){
    const porDia={}, cont={};
    for(const [d,v] of porMun[mun]){
      if(v==null)continue;
      if(typeof v!=='number'||!isFinite(v))return [null,'valor não numérico'];
      const dia=d.slice(0,10);
      if(dia in porDia&&porDia[dia]!==v)return [null,`a mesma data veio com dois valores (${nomeDoCod(mun)}, ${dia})`];
      porDia[dia]=v;
    }
    for(const dia in porDia){const a=dia.slice(0,4); cont[a]=(cont[a]||0)+1;
      if(cont[a]>1)return [null,`mais de um valor por ano (${m.PERNOME||'frequência menor que anual'})`];}
    for(const dia in porDia)(tab[+dia.slice(0,4)]=tab[+dia.slice(0,4)]||{})[mun]=porDia[dia];
  }
  const anos=Object.keys(tab).map(Number).filter(a=>a>=anoMin).sort((a,b)=>a-b);
  if(!anos.length)return [null,`sem valor desde ${anoMin}`];
  const comp=anos.filter(a=>cods.every(c=>tab[a][c]!=null));
  if(!comp.length)return [null,`nenhum ano desde ${anoMin} com os sete municípios`];
  return [{ano:comp[comp.length-1],anos,v:anos.map(a=>cods.map(c=>tab[a][c]??null))},'entrou'];
}
async function xtIpeadata(el){
  const anoMin=+(($('#xtIpdAno')||{}).value)||2000, cods=XT_CODS();
  XT_IPD.anoMin=anoMin; XT_IPD.aspas=true;
  xtProgresso(ipdCorpo(el),0.03,'Conferindo os sete municípios na API do Ipeadata…');
  const niveis={};
  for(const c of cods){
    let t;
    try{t=await ipdOdata('Territorios',ipdFiltro(c));}
    catch(e){if(e.status===400&&XT_IPD.aspas){XT_IPD.aspas=false;t=await ipdOdata('Territorios',ipdFiltro(c));}else throw e;}
    if(!t.length)throw new Error(`${nomeDoCod(c)} não está na tabela de territórios do Ipeadata`);
    niveis[c]=new Set(t.map(x=>x.NIVNOME));
  }
  let comuns=[...niveis[cods[0]]].filter(n=>cods.every(c=>niveis[c].has(n)));
  if(comuns.length>1)comuns=comuns.filter(n=>/munic/.test(norm(n)));
  if(comuns.length!==1)throw new Error('não achei um nível único para os sete municípios na tabela de territórios do Ipeadata');
  XT_IPD.nivel=comuns[0];
  const porSerie={};
  for(let k=0;k<cods.length;k++){
    const c=cods[k];
    xtProgresso(ipdCorpo(el),0.08+0.67*k/cods.length,`Lendo todos os valores de ${nomeDoCod(c)} no Ipeadata (${k+1} de ${cods.length})…`);
    const vs=await ipdCampos('Valores',ipdFiltro(c),'SERCODIGO,VALDATA,VALVALOR,NIVNOME,TERCODIGO');
    for(const v of vs){
      if(v.NIVNOME!=null&&v.NIVNOME!==XT_IPD.nivel)continue;
      if(v.TERCODIGO!=null&&String(v.TERCODIGO)!==c)continue;
      const s=porSerie[v.SERCODIGO]=porSerie[v.SERCODIGO]||{};
      (s[c]=s[c]||[]).push([String(v.VALDATA),v.VALVALOR]);
    }
  }
  if(!Object.keys(porSerie).length)throw new Error('o Ipeadata não trouxe nenhum valor para os sete municípios');
  xtProgresso(ipdCorpo(el),0.8,'Lendo o catálogo do Ipeadata…');
  const md=await ipdCampos('Metadados','',
    'SERCODIGO,SERNOME,SERCOMENTARIO,SERATUALIZACAO,BASNOME,FNTSIGLA,FNTNOME,FNTURL,PERNOME,UNINOME,MULNOME,SERSTATUS,SERNUMERICA,TEMCODIGO');
  const meta=new Map(md.map(m=>[m.SERCODIGO,m])), temas={};
  try{(await ipdOdata('Temas')).forEach(t=>temas[t.TEMCODIGO]=t.TEMNOME);}catch(e){}
  xtProgresso(ipdCorpo(el),0.95,'Conferindo o que o Atlas já tem…');
  const vet=ipdVetoresAtlas();
  XT_IPD.series=Object.keys(porSerie).map(cod=>{
    const m=meta.get(cod), [r,motivo]=ipdAvalia(porSerie[cod],m,anoMin);
    const anosTodos=[...new Set(Object.values(porSerie[cod]).flat().filter(x=>x[1]!=null).map(x=>+x[0].slice(0,4)))].sort((a,b)=>a-b);
    return {cod,m:m||{},tema:(m&&(m.TEMNOME||temas[m.TEMCODIGO]))||'',r,motivo,anosTodos,noAtlas:ipdNoAtlas(cod,m&&m.SERNOME,r,vet)};
  }).sort((a,b)=>String(a.tema).localeCompare(String(b.tema),'pt-BR')||ipdNome(a.m.SERNOME||a.cod).localeCompare(ipdNome(b.m.SERNOME||b.cod),'pt-BR'));
  XT_IPD.marcadas=new Set();
  xtIpdLista(ipdCorpo(el));
}
function xtIpdSituacao(s){
  const a=s.noAtlas, sug=s.r&&ipdSugerida(s);
  if(a&&a.k==='mesmo')return `já no Atlas: ${esc(a.t)}`;
  if(a&&a.k==='nome')return `o Atlas tem: ${esc(a.t)}`;
  const base=s.r?(sug?'<b>sugerida</b>':'nova'):esc(s.motivo);
  return a?`${base} · o Atlas tem ${esc(a.t)}`:base;
}
function xtIpdLista(el,aviso){
  const L=XT_IPD.series, F=XT_IPD.filtro, marcadas=XT_IPD.marcadas, entram=L.filter(s=>s.r), jaTem=entram.filter(ipdJaTem);
  const temas=[...new Set(L.map(s=>s.tema).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  el.innerHTML=`${aviso?`<div class="note">${aviso}</div>`:''}
    <div class="note">${nf.format(L.length)} séries do Ipeadata têm valor para algum dos sete municípios no nível
      “${esc(XT_IPD.nivel)}”. <b>${nf.format(entram.length)}</b> têm um ano com os sete desde ${XT_IPD.anoMin} e podem ir para o mapa;
      ${nf.format(jaTem.length)} delas o Atlas já tem.</div>
    <div class="xt-busca xt-ipd-busca"><input type="search" id="xtIpdQ" placeholder="filtrar por nome, tema, fonte ou código" value="${esc(F.q)}">
      <select id="xtIpdTema"><option value="">todos os temas</option>${temas.map(t=>`<option${t===F.tema?' selected':''}>${esc(t)}</option>`).join('')}</select></div>
    <label class="xt-check"><input type="checkbox" id="xtIpdSoMapa"${F.so?' checked':''}> só as que podem ir para o mapa</label>
    <div class="btn-row"><button class="btn" id="xtIpdSug">Marcar as sugeridas</button><button class="btn" id="xtIpdNada">Desmarcar todas</button>
      <button class="btn" id="xtIpdCsv">Baixar a varredura (CSV)</button></div>
    <p class="ref-note" id="xtIpdConta"></p>
    <div class="tb-scroll xt-ipd"><table class="tb"><thead><tr><th></th><th>Série</th><th>Anos</th><th>No mapa</th><th>Situação</th></tr></thead>
      <tbody id="xtIpdCorpo"></tbody></table></div>
    <div class="btn-row"><button class="btn pri" id="xtIpdTraz">Trazer as marcadas para o Atlas</button></div>`;
  const linha=s=>`<tr><td>${s.r?`<input type="checkbox" data-ipd="${esc(s.cod)}" aria-label="marcar ${esc(ipdNome(s.m.SERNOME||s.cod))}"${marcadas.has(s.cod)?' checked':''}>`:''}</td>
    <td>${esc(ipdNome(s.m.SERNOME||s.cod))}<br><small class="ref-note">${esc([s.tema,s.m.FNTSIGLA||s.m.FNTNOME,s.m.PERNOME].filter(Boolean).join(' · '))} · ${esc(s.cod)}</small></td>
    <td>${s.anosTodos.length?s.anosTodos[0]+(s.anosTodos.length>1?'–'+s.anosTodos[s.anosTodos.length-1]:''):'—'}</td><td>${s.r?s.r.ano:'—'}</td>
    <td>${xtIpdSituacao(s)}</td></tr>`;
  const MAX=1500;
  const desenha=()=>{
    F.q=$('#xtIpdQ').value||''; F.tema=$('#xtIpdTema').value; F.so=$('#xtIpdSoMapa').checked;
    const q=norm(F.q);
    const f=L.filter(s=>(!F.so||s.r)&&(!F.tema||s.tema===F.tema)&&(!q||norm([s.m.SERNOME,s.tema,s.m.FNTSIGLA,s.m.FNTNOME,s.cod].join(' ')).includes(q)));
    $('#xtIpdCorpo').innerHTML=f.slice(0,MAX).map(linha).join('')||'<tr><td colspan="5" class="ref-note">Nada com esse filtro.</td></tr>';
    $('#xtIpdConta').textContent=`${f.length>MAX?`Mostrando ${nf.format(MAX)} de ${nf.format(f.length)}; use o filtro para achar as outras. `:`${nf.format(f.length)} na lista. `}`
      +`${nf.format(marcadas.size)} marcada${marcadas.size===1?'':'s'}.`;
    $$('#xtIpdCorpo input[data-ipd]').forEach(x=>x.onchange=()=>{x.checked?marcadas.add(x.dataset.ipd):marcadas.delete(x.dataset.ipd);
      $('#xtIpdConta').textContent=$('#xtIpdConta').textContent.replace(/[\d.]+ marcadas?\.$/,`${nf.format(marcadas.size)} marcada${marcadas.size===1?'':'s'}.`);});
  };
  $('#xtIpdQ').oninput=desenha; $('#xtIpdTema').onchange=desenha; $('#xtIpdSoMapa').onchange=desenha;
  $('#xtIpdSug').onclick=()=>{const sug=entram.filter(s=>!ipdJaTem(s)&&ipdSugerida(s)); sug.forEach(s=>marcadas.add(s.cod)); desenha();
    toast(sug.length?`${sug.length} série${sug.length===1?'':'s'} sugerida${sug.length===1?'':'s'} marcada${sug.length===1?'':'s'}.`
      :'Nenhuma das sugeridas (Bolsa Família, mortes violentas do DATASUS, IFDM) pode ir para o mapa nesta varredura.',sug.length?'ok':'err');};
  $('#xtIpdNada').onclick=()=>{marcadas.clear();desenha();};
  $('#xtIpdCsv').onclick=()=>baixaCSV([['codigo','serie','tema','fonte','frequencia','unidade','anos_com_dado','ano_no_mapa','situacao']]
    .concat(L.map(s=>[s.cod,ipdNome(s.m.SERNOME),s.tema,s.m.FNTSIGLA||s.m.FNTNOME||'',s.m.PERNOME||'',[s.m.UNINOME,s.m.MULNOME].filter(Boolean).join(' '),
      s.anosTodos.length?s.anosTodos[0]+'-'+s.anosTodos[s.anosTodos.length-1]:'',s.r?s.r.ano:'',
      xtIpdSituacao(s).replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')])),
    'ipeadata-varredura.csv');
  $('#xtIpdTraz').onclick=()=>xtIpdTraz(el).catch(e=>xtIpdErro(ipdCorpo(el),e));
  desenha();
}
/* As marcadas viram uma extração: indicadores do nível município, na categoria Ipeadata,
   com a série para o painel. A fonte original de cada série vai no selo. */
async function xtIpdTraz(el){
  const marcadas=XT_IPD.marcadas, sel=XT_IPD.series.filter(s=>s.r&&marcadas.has(s.cod));
  if(!sel.length)return toast('Marque ao menos uma série que pode ir para o mapa.','err');
  const cods=XT_CODS(), ant=XT_APLICADOS.get('ipeadata_navegador'), hoje=new Date().toISOString().slice(0,10);
  const inds=new Map(((ant&&ant.indicadores)||[]).map(i=>[i.id,i])), fontes=Object.assign({},ant&&ant.fontesExtra), vals={municipio:{}};
  cods.forEach(c=>vals.municipio[c]=Object.assign({},ant&&ant.valores&&ant.valores.municipio&&ant.valores.municipio[c]||{}));
  sel.forEach(s=>{
    const id='ipdn_'+slugId(String(s.cod)), m=s.m, fk='XT_IPD_'+(slugId(String(m.FNTSIGLA||''))||'outras');
    if(!fontes[fk])fontes[fk]={n:`Ipeadata (IPEA) — séries de ${m.FNTNOME||m.FNTSIGLA||'outras fontes'}`,s:`Ipeadata · ${m.FNTSIGLA||'IPEA'}`,
      u:'https://www.ipeadata.gov.br/',d:`Séries republicadas pelo Ipeadata e lidas pelo navegador na API pública (${IPD_API}). `
        +`Fonte original: ${m.FNTNOME||m.FNTSIGLA||'não informada'}${m.FNTURL?` (${m.FNTURL})`:''}.`+ipdAvisoUso(m.FNTSIGLA,m.FNTNOME)};
    const base={cod:s.cod,tema:s.tema,fonte:m.FNTSIGLA||'',fonte_nome:m.FNTNOME||'',ano:s.r.ano,anos:s.r.anos,v:s.r.v,
      unidade:m.UNINOME||'',mult:m.MULNOME||'',atualizada:String(m.SERATUALIZACAO||'').slice(0,10),status:m.SERSTATUS||'',
      obs:String(m.SERCOMENTARIO||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,500)};
    inds.set(id,{id,cat:'ipeadata',n:ipdNome(m.SERNOME||s.cod),u:ipdUnidade(base),ano:s.r.ano,fonte:fk,
      niveis:['municipio'],fmt:ipdFmt(base),ramp:'agua',obs:ipdObs(base)+` Lida pelo navegador em ${hoje.split('-').reverse().join('/')}.`+ipdAvisoUso(m.FNTSIGLA,m.FNTNOME),
      serie:{anos:s.r.anos,v:s.r.v,ano:s.r.ano,mun:cods,cod:s.cod,titulo:'Série no Ipeadata'}});
    const j=s.r.anos.indexOf(s.r.ano);
    cods.forEach((c,k)=>{const v=s.r.v[j][k]; if(v!=null)vals.municipio[c][id]=v;});
  });
  const item={id:'ipeadata_navegador',titulo:'Séries do Ipeadata',ano:null,status:'ok',origem:'API do Ipeadata',
    fonte:{n:'Ipeadata (IPEA) — séries trazidas pelo navegador',s:'Ipeadata',u:'https://www.ipeadata.gov.br/',
      d:`Séries escolhidas na varredura do Ipeadata e lidas na API pública (${IPD_API}). A fonte original de cada série está no selo e na nota do indicador.`},
    fontesExtra:fontes,indicadores:[...inds.values()],valores:vals,resumo:`${nf.format(inds.size)} série${inds.size===1?'':'s'} do Ipeadata`};
  await xtConclui(item);
  sel.forEach(s=>{s.noAtlas={k:'mesmo',t:'trazida desta varredura'}; marcadas.delete(s.cod);});
  xtIpdLista(ipdCorpo(el),`Pronto: ${sel.length} série${sel.length===1?'':'s'} na categoria <b>Ipeadata (IPEA)</b>, no nível município.
    O painel mostra a série nos sete municípios.`);
}
function xtIpdErro(el,e){
  if(e&&e.tipo==='cors')el.innerHTML=`<div class="note warn"><b>O navegador não pôde ler a API do Ipeadata.</b> O servidor responde,
    mas não libera a leitura pelo navegador (CORS). O mesmo trabalho sai pelo script
    <code>python3 extracao/7_ipeadata.py</code>, seguido de <code>python3 build_single.py</code>: as séries passam a vir dentro do arquivo do Atlas.</div>`;
  else xtErro(el,'Ipeadata: '+((e&&e.message)||String(e))+(e&&e.tipo==='rede'?'. Sem acesso pelo navegador, rode o script extracao/7_ipeadata.py.':''));
}

/* ---- 27.7 a tela "Extrair dados" ------------------------------------------ */
const XT_RECEITAS={inep:xtInep,censo2010:xtCenso2010,
  cnes:(files,el)=>xtGeralInicia(files,el), geral:(files,el)=>xtGeralInicia(files,el)};
function xtCartao(id,titulo,sub,passos,zona){
  return `<div class="xt-card" id="xt-${id}">
    <div class="xt-hd"><b>${titulo}</b><span class="ref-note">${sub}</span></div>
    ${passos}
    ${zona?`<label class="drop xt-drop" data-receita="${id}"><b>Solte aqui o arquivo baixado</b>
      <span>ou clique para escolher · ${zona}</span><input type="file" hidden multiple></label>`:''}
    <div class="xt-corpo" id="xt-corpo-${id}"></div></div>`;
}
const xtLink=(u,t)=>`<a href="${u}" target="_blank" rel="noopener">${t} ↗</a>`;
function renderExtrair(){
  const naoAbre=xtSemDescompressao();
  $('#extrairBody').innerHTML=`
  <div class="note"><b>Tudo roda neste arquivo, no seu navegador.</b> Nada é enviado para servidor e não é
    preciso instalar programa. O que for extraído entra no mapa na hora e fica guardado neste navegador.
    Para entregar a outras pessoas, use <b>Baixar o Atlas com os dados</b>, no fim desta tela: sai um novo
    arquivo do Atlas com tudo dentro.</div>
  ${naoAbre?'<div class="note warn">Este navegador não descompacta arquivos. Use Chrome, Edge, Firefox ou Safari atualizados.</div>':''}

  <h3 class="sec">Busca direta na fonte <span class="chip tag">um clique</span></h3>
  ${xtCartao('osm','Cultura, lazer e espaços públicos','OpenStreetMap · mapa colaborativo, não oficial',
    `<p class="xt-msg">Parques, parquinhos, quadras, academias ao ar livre, bibliotecas, centros comunitários, teatros e cinemas dos sete municípios.
      Viram uma camada de pontos e contagens por bairro.</p>
    <div class="btn-row"><button class="btn pri" id="xtOsmBusca">Buscar no OpenStreetMap</button></div>`)}
  ${xtCartao('sidra','Qualquer tabela do IBGE por município','IBGE · SIDRA, inclusive os resultados do Censo 2022',
    `<p class="xt-msg">Procure pelo assunto, escolha a tabela, a variável e as categorias. O valor dos sete municípios entra como indicador.</p>
    <div class="xt-busca"><input type="search" id="xtSidraTxt" placeholder="ex.: rendimento domiciliar, alfabetização, deslocamento">
      <button class="btn" id="xtSidraBtn">Procurar</button></div>`)}
  ${xtCartao('ipeadata','Séries municipais do Ipeadata','IPEA · API pública do Ipeadata, que republica IBGE, DATASUS, Firjan e outras fontes',
    `<p class="xt-msg">Lê na API do Ipeadata todas as séries com valor para os sete municípios e mostra quais podem ir para o mapa:
      as que têm um ano com os sete e um valor por ano. Você escolhe quais trazer. As sugeridas são as que o Atlas não tem por outra fonte:
      Bolsa Família (benefícios e valor em dezembro), homicídios, suicídios e mortes no trânsito do DATASUS e o IFDM.</p>
    <div class="xt-busca xt-ipd-ano"><label for="xtIpdAno">Anos a partir de</label><input type="number" id="xtIpdAno" value="2000" min="1900" max="2100" step="1">
      <button class="btn pri" id="xtIpdVarre">Varrer o Ipeadata</button></div>
    <p class="ref-note">A leitura leva alguns minutos. Se o servidor do Ipeadata não liberar a leitura pelo navegador,
      o mesmo trabalho sai pelo script <code>extracao/7_ipeadata.py</code>.</p>`)}

  <h3 class="sec">Arquivo baixado da fonte <span class="chip tag">baixe e solte aqui</span></h3>
  ${xtCartao('inep','Matrículas por etapa e rede','INEP · microdados do Censo Escolar (até a edição de 2024)',
    `<ol class="xt-passos"><li>Baixe os microdados do Censo Escolar no site do INEP: ${xtLink('https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-escolar','microdados do Censo Escolar')}.
      O arquivo é microdados_censo_escolar_AAAA.zip.</li><li>Solte o ZIP aqui, sem descompactar.</li></ol>`,'ZIP do INEP')}
  ${xtCartao('censo2010','Censo 2010: trabalho, família, deficiência, Bolsa Família e conferência da renda','IBGE · microdados da amostra do Censo 2010',
    `<ol class="xt-passos"><li>No site do IBGE, baixe <b>RS.zip</b> e <b>Documentacao.zip</b>: ${xtLink('https://ftp.ibge.gov.br/Censos/Censo_Demografico_2010/Resultados_Gerais_da_Amostra/Microdados/','microdados da amostra de 2010')}.</li>
      <li>Solte os dois aqui, juntos. A leitura leva alguns minutos.</li></ol>
    <p class="xt-msg">Calcula, por município, a desocupação por sexo e idade, os jovens que não estudam nem trabalham,
      a chefia feminina, os idosos que moram sós, a deficiência e o Bolsa Família. E refaz a pobreza, a renda e o Gini de 2010
      de três jeitos, para fechar o achado E3 da auditoria.</p>`,'RS.zip e Documentacao.zip')}
  ${xtCartao('cnes','Equipes de saúde por município','CNES · base de dados do mês',
    `<ol class="xt-passos"><li>Baixe a base de dados do CNES do mês desejado na área de downloads do CNES
      (${xtLink('https://cnes.datasus.gov.br/','cnes.datasus.gov.br')}, Downloads, arquivos da base de dados).</li>
      <li>Solte o ZIP aqui e escolha o arquivo de equipes. O Atlas sugere contar as equipes ativas por tipo.</li></ol>`,'ZIP do CNES')}
  ${xtCartao('geral','Qualquer arquivo nacional com código de município','CSV, TXT, XLSX, XLS ou ZIP',
    `<p class="xt-msg">Para Censo SUAS (CRAS, CREAS), VIS DATA e CECAD (Cadastro Único e Bolsa Família), MUNIC, Novo CAGED,
      ${xtLink('https://mapaosc.ipea.gov.br/base-dados','Mapa das OSCs')}, ${xtLink('https://ivs.ipea.gov.br/','IVS')} e outros.
      O Atlas acha a coluna do código do município, guarda só as linhas dos sete e pergunta o que fazer com elas:
      usar os valores, contar as linhas ou somar colunas. Com latitude e longitude, as linhas viram pontos no mapa.</p>`,'qualquer arquivo')}

  <h3 class="sec">Já extraído</h3>
  <div id="xtLista"></div>
  <div class="btn-row"><button class="btn pri" id="xtBaixaAtlas">Baixar o Atlas com os dados</button></div>
  <p class="ref-note">${xtArquivoUnico()?'Gera um novo atlas-rmpa.html com os dados extraídos dentro. Quem abrir esse arquivo vê tudo, sem precisar extrair de novo.'
    :'Nesta versão em pasta, o botão não está disponível: abra o arquivo único atlas-rmpa.html para gerar o Atlas com os dados.'}</p>`;
  xtListaHTML();
  /* zonas de arquivo */
  $$('#extrairBody .xt-drop').forEach(z=>{
    const inp=z.querySelector('input'), rec=z.dataset.receita, corpo=$('#xt-corpo-'+rec);
    const roda=async files=>{
      if(!files.length)return;
      xtProgresso(corpo,0,`Abrindo ${files.map(f=>f.name).join(' e ')}…`);
      try{await XT_RECEITAS[rec](files,corpo);}catch(e){xtErro(corpo,e.message||String(e));}
    };
    inp.onchange=()=>{roda([...inp.files]); inp.value='';};
    z.ondragover=e=>{e.preventDefault();z.classList.add('over');};
    z.ondragleave=()=>z.classList.remove('over');
    z.ondrop=e=>{e.preventDefault();z.classList.remove('over');roda([...e.dataTransfer.files]);};
  });
  $('#xtOsmBusca').onclick=async()=>{const c=$('#xt-corpo-osm');
    try{await xtOSM(c);}catch(e){xtErro(c,e.message);}};
  const sb=async()=>{const c=$('#xt-corpo-sidra'), t=$('#xtSidraTxt').value.trim(); if(!t)return;
    xtProgresso(c,0.2,'Procurando nas tabelas do IBGE…');
    try{await xtSidraBusca(t,c);}catch(e){xtErro(c,e instanceof ErroFonte?'O IBGE não respondeu: '+e.message:e.message);}};
  $('#xtSidraBtn').onclick=sb;
  $('#xtIpdVarre').onclick=async()=>{const c=$('#xt-corpo-ipeadata'); $('#xtIpdVarre').disabled=true; XT_IPD.rodando=true;
    try{await xtIpeadata(c);}catch(e){xtIpdErro(ipdCorpo(c),e);}
    finally{XT_IPD.rodando=false; const b=$('#xtIpdVarre'); if(b)b.disabled=false;}};
  /* a última varredura continua na tela; durante uma leitura, o botão fica desligado */
  if(XT_IPD.rodando){$('#xtIpdVarre').disabled=true; xtProgresso($('#xt-corpo-ipeadata'),0.5,'Varredura do Ipeadata em andamento…');}
  else if(XT_IPD.series)xtIpdLista($('#xt-corpo-ipeadata'));
  $('#xtSidraTxt').onkeydown=e=>{if(e.key==='Enter')sb();};
  $('#xtBaixaAtlas').onclick=xtBaixaAtlas;
  const c10=XT_APLICADOS.get('censo2010_amostra');
  if(c10&&c10._pacote&&c10.e3){
    $('#xt-corpo-censo2010').innerHTML=xtE3HTML(c10,'pacote')+`<div class="btn-row">
      ${c10.ap?'<button class="btn" id="xtPacAP">Baixar por área de ponderação (CSV)</button>':''}
      <button class="btn" id="xtPacE3">Baixar a conferência da renda (CSV)</button></div>`;
    if(c10.ap)$('#xtPacAP').onclick=()=>baixaCSV(c10.ap,'censo2010-areas-de-ponderacao.csv');
    const L=c10.e3.linhas; $('#xtPacE3').onclick=()=>baixaCSV([Object.keys(L[0])].concat(L.map(r=>Object.values(r))),'censo2010-conferencia-renda.csv');
  }
}
function xtListaHTML(){
  const el=$('#xtLista'); if(!el)return;
  const itens=[...XT_APLICADOS.values()];
  el.innerHTML=itens.length?itens.map(i=>`<div class="row"><div class="k"><b>${esc(i.titulo)}</b>
      <span class="ref-note">${esc(i.resumo||'')} · ${esc(i.fonte.s||i.fonte.n)} · ${i._pacote?'no pacote do Atlas':i._embutido?'embutido neste arquivo':'extraído em '+new Date(i.quando).toLocaleDateString('pt-BR')}</span></div>
      <div class="v xt-acoes"><button class="btn" data-xtcsv="${esc(i.id)}">CSV</button>
      ${i._embutido||i._pacote?'':`<button class="btn" data-xtdel="${esc(i.id)}">Remover</button>`}</div></div>`).join('')
    :'<p class="xt-msg">Nada extraído ainda neste navegador.</p>';
  el.querySelectorAll('[data-xtcsv]').forEach(b=>b.onclick=()=>xtCSV(XT_APLICADOS.get(b.dataset.xtcsv)));
  el.querySelectorAll('[data-xtdel]').forEach(b=>b.onclick=async()=>{
    await xtApaga(b.dataset.xtdel);
    toast('Removido deste navegador. A página vai recarregar para tirar os dados do mapa.','ok');
    setTimeout(()=>location.reload(),1200);
  });
}
/* CSV de um item: uma linha por município (e por bairro, quando houver) */
function xtCSV(item){
  if(!item)return;
  const ids=item.indicadores.map(i=>i.id), V=item.valores||{};
  const L=[['nivel','codigo','territorio'].concat(item.indicadores.map(i=>i.n))];
  XT_CODS().forEach(c=>{const v=(V.municipio||{})[c]; if(v)L.push(['municipio',c,nomeDoCod(c)].concat(ids.map(k=>v[k]??'')));});
  if(V.bairro)S.geo.bairro.features.forEach(f=>{const v=V.bairro[f.properties.id]; if(v)L.push(['bairro',f.properties.id,f.properties.nome].concat(ids.map(k=>v[k]??'')));});
  baixaCSV(L,`extracao-${item.id}.csv`);
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
  estendeAoMunicipio();
  aplicaAnosCatalogo();
  verificaCatalogo();
  renderCats(); renderCamadas(); ligaEventos();
  desenhaMapa(); renderPainel(); vigiaTamanho();
  ['lojas','escolas','saude','acolhimento'].forEach(k=>{if(S.camadas[k])pontosOn(k,true);});
  /* busca nas fontes depois que a primeira tela já está pronta */
  const st=$('#aoVivoStatus'); if(st){st.onclick=()=>abreModal('mdDados');}
  setTimeout(aoVivoAuto,1500);
  xtInicia();
})();

/* Os municípios são somas dos setores e trazem os mesmos campos do Censo e as
   taxas de 2010. Onde os sete têm valor, o indicador passa a ter mapa também no
   nível município — em vez de a troca de nível levar a um indicador vazio. */
function estendeAoMunicipio(){
  const M=S.geo.municipio; if(!M)return;
  IND.forEach(i=>{
    if(i.niveis.includes('municipio')||!i.niveis.includes('bairro'))return;
    if(i.status!=='ok'&&i.status!=='est')return;
    if(i.id==='pop_pct_mun')return;             /* seria 100% nos sete */
    if(M.features.every(f=>f.properties[i.id]!=null))i.niveis=i.niveis.concat('municipio');
  });
}

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
          return Boolean((RAW_SETORES.valores||{})[i.id]||((RAW_EST||{}).setores||{})[i.id]||(C22&&C22.setores[i.id]));
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
  for(let k=IND.length-1;k>=0;k--)if(fora.has(IND[k].id)){IND_FORA.set(IND[k].id,{i:IND[k],pos:k});IND.splice(k,1);}
  IND_IDX=null;
  if(removidos.length)console.info('Atlas — indicadores vazios omitidos:',removidos.join(', '));
  return removidos;
}

/* Indicador tirado por falta de dado volta quando o dado chega das fontes
   (seção 26). Só vale para o nível município, o único que as fontes ao vivo
   atualizam. */
function reativaCatalogo(){
  const M=S.geo.municipio; if(!M)return 0;
  const volta=[...IND_FORA.values()].filter(({i})=>M.features.some(f=>f.properties[i.id]!=null))
    .sort((a,b)=>a.pos-b.pos);
  volta.forEach(({i,pos})=>{IND.splice(Math.min(pos,IND.length),0,i);IND_FORA.delete(i.id);});
  IND_IDX=null;
  return volta.length;
}
/* Anos, nomes e notas que dependem da edição carregada de cada fonte */
function aplicaAnosCatalogo(){
  const W=window, sv=((W.ATLAS_SERVICOS||{}).fontes)||{}, pb=((W.ATLAS_NUCLEO||{}).pib)||{},
    cf=((W.ATLAS_COMPLEMENTOS||{}).fontes)||{};
  if((sv.siconfi||{}).ano)ANO.siconfi=sv.siconfi.ano;
  if((sv.populacao||{}).ano)ANO.pop=sv.populacao.ano;
  if(pb.ano_pib)ANO.pib=pb.ano_pib;
  if(pb.ano_vab)ANO.vab=pb.ano_vab;
  if(pb.ano_pib_ant)ANO.base=pb.ano_pib_ant;
  const todos=IND.concat([...IND_FORA.values()].map(x=>x.i));
  const em=(ids,f)=>todos.forEach(i=>{if(ids.includes(i.id))f(i);});
  todos.forEach(i=>{if(i.fonte==='SICONFI')i.ano=ANO.siconfi;});
  em(Object.keys(HAB_ROTULO),i=>{i.ano=ANO.siconfi;i.obs=OBS_HAB(HAB_ROTULO[i.id]);});
  em(['fin_transf_pct','fin_resultado_orcamentario'],i=>{i.ano=ANO.siconfi;});
  em(['pop_est_2026'],i=>{i.ano=ANO.pop;i.n='População estimada em '+ANO.pop;
    i.obs=`Estimativa oficial do IBGE com data de referência em 1º de julho de ${ANO.pop}.`;});
  em(['pib','pib_pc','pib_cresc'],i=>{i.ano=ANO.pib;});
  em(['pib_pc'],i=>{i.obs=`PIB de ${ANO.pib} dividido pela população do Censo 2022. O IBGE usa estimativa populacional própria, então pode divergir levemente do valor publicado.`;});
  em(['pib_cresc'],i=>{i.n=`Crescimento nominal do PIB, ${ANO.base} a ${ANO.pib}`;});
  em(['vab','vab_ind','vab_serv','vab_adm','vab_agro','impostos','pct_vab_ind','pct_vab_serv','pct_vab_adm',
      'pct_vab_agro','agro_vab','agro_participacao_vab'],i=>{i.ano=ANO.vab;});
  if((cf.ideb||{}).ano)em(['ideb_iniciais','ideb_finais','ideb_medio'],i=>{i.ano=cf.ideb.ano;});
  if((cf.anatel||{}).ano)em(['banda_larga_100hab'],i=>{i.ano=cf.anatel.ano;
    i.obs=i.obs.replace(/referente a \d{2}\/\d{4}/,`referente a ${String(cf.anatel.mes).padStart(2,'0')}/${cf.anatel.ano}`);});
  if(((W.ATLAS_INDICES||{}).fontes||{}).idhm)em(['idhm','idhm_renda','idhm_educacao','idhm_longevidade','idhm_esperanca_vida'],
    i=>{i.ano=W.ATLAS_INDICES.fontes.idhm.ano||i.ano;});
  IND_IDX=null;
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
    <span class="eyebrow">Atlas RMPA</span>
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
