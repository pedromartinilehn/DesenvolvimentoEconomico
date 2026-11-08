// Diagnóstico de localização da Panvel e oportunidades no Sul e no Sudeste.
//   NODE_PATH=../pres/node_modules node deck_farm.js analise.json mapa_oport.png saida.pptx
const pptxgen = require('pptxgenjs');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const sharp = require('sharp');
const fa = require('react-icons/fa');
const fs = require('fs');
const { applyTheme } = require('/root/.claude/skills/synced/3f2aacf7-9f92-4181-a0a4-a64dbc7e1afd_5852a1cc-de44-4913-b1a9-72872934eb32/pptx/scripts/apply_theme.js');

const [, , ARQ, MAPA, SAIDA] = process.argv;
const R = JSON.parse(fs.readFileSync(ARQ, 'utf8'));
const HEX = { dk1: '16202B', lt1: 'FFFFFF', dk2: '13315C', lt2: 'F1F5F9', accent1: 'E4572E', accent2: '2A9D8F', accent3: 'F4A261',
  accent4: '5F6F80', accent5: '8796A5', accent6: 'B23A1B', hlink: '2A9D8F', folHlink: '6D5A7A' };
const THEME = { name: 'Panvel Sul Sudeste', headFontFace: 'Cambria', bodyFontFace: 'Calibri', colors: HEX };

const br = (v, d = 0) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const mil = v => v >= 1e6 ? br(v / 1e6, 2) + ' mi' : br(Math.round(v / 100) * 100);

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';
pres.title = 'Panvel: diagnóstico de localização e oportunidades no Sul e no Sudeste';
pres.author = 'Análise com dados do CNES e do Censo 2022';
pres.theme = { headFontFace: 'Cambria', bodyFontFace: 'Calibri' };
const C = pres.SchemeColor;

async function icone(nome, cor) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(fa[nome], { color: '#' + cor, size: 256 }));
  return 'image/png;base64,' + (await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer()).toString('base64');
}
pres.defineSlideMaster({ title: 'CAPA', background: { color: HEX.dk2 }, objects: [
  { placeholder: { options: { name: 'title', type: 'title', x: 0.7, y: 1.5, w: 7.2, h: 2.3, fontFace: 'Cambria', fontSize: 40, bold: true,
    color: C.background1, valign: 'bottom', align: 'left', margin: 0 }, text: 'Título' } },
  { placeholder: { options: { name: 'sub', type: 'body', x: 0.7, y: 4.0, w: 7.2, h: 1.2, fontSize: 20, color: 'C9D6E8', margin: 0,
    valign: 'top', align: 'left' }, text: 'Subtítulo' } },
  { placeholder: { options: { name: 'info', type: 'body', x: 0.7, y: 5.8, w: 7.2, h: 0.9, fontSize: 13, color: 'C9D6E8', margin: 0,
    valign: 'top', align: 'left' }, text: 'Fonte' } }] });
pres.defineSlideMaster({ title: 'CONTEUDO', background: { color: HEX.lt1 }, objects: [
  { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.35, w: 12.33, h: 0.95, fontFace: 'Cambria', fontSize: 30,
    bold: true, color: C.text2, valign: 'middle', align: 'left', margin: 0 }, text: 'Título' } },
  { text: { text: 'Panvel · diagnóstico de localização no Sul e no Sudeste · CNES abr./2026 e Censo 2022',
    options: { x: 0.5, y: 7.05, w: 9, h: 0.3, fontSize: 10, color: HEX.accent5, margin: 0 } } }],
  slideNumber: { x: 12.33, y: 7.05, w: 0.5, h: 0.3, fontSize: 10, color: HEX.accent5, align: 'right' } });
pres.defineSlideMaster({ title: 'FECHO', background: { color: HEX.dk2 }, objects: [
  { placeholder: { options: { name: 'title', type: 'title', x: 0.7, y: 0.5, w: 11.9, h: 0.9, fontFace: 'Cambria', fontSize: 34, bold: true,
    color: C.background1, align: 'left', margin: 0 }, text: 'Título' } }],
  slideNumber: { x: 12.33, y: 7.05, w: 0.5, h: 0.3, fontSize: 10, color: 'C9D6E8', align: 'right' } });

const fonte = (s, t) => s.addText(t, { x: 0.5, y: 6.62, w: 12.33, h: 0.32, fontSize: 10, color: C.accent5, margin: 0, isTextBox: true, objectName: 'Fonte' });
const cartao = (s, x, y, w, h, cor, n) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: cor || C.background2 },
  line: { type: 'none' }, objectName: n || 'Cartão' });
async function bolinha(s, x, y, d, ic, fundo, n) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fundo || C.accent2 }, line: { type: 'none' }, objectName: 'Círculo ' + n });
  const p = d * 0.23;
  s.addImage({ data: await icone(ic, 'FFFFFF'), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p, objectName: 'Ícone ' + n });
}
const T = (s, txt, o) => s.addText(txt, Object.assign({ margin: 0, isTextBox: true, color: C.text1, valign: 'top' }, o));

// rótulos dos pontos: bairro do IBGE ou, sem bairro, o bairro do CNES da farmácia mais próxima (com *)
const ACENTO = { 'Vl ': 'Vila ', 'Jd ': 'Jardim ', 'Higienopolis': 'Higienópolis', 'Mirandopolis': 'Mirandópolis', 'Tatuape': 'Tatuapé',
  'Cambui': 'Cambuí', 'Cerqueira Cesar': 'Cerqueira César', ' Da ': ' da ', ' De ': ' de ', ' Do ': ' do ' };
const rotulo = h => {
  let b = h.bairro || h.ref_cnes || '';
  if (!h.bairro && b) { for (const [a, c] of Object.entries(ACENTO)) b = b.split(a).join(c); b += '*'; }
  return h.mun + (b ? ' – ' + b : '');
};
function escolhe(ufs, n) {
  const vistos = new Set(), out = [];
  for (const h of R.pontos) {
    if (!ufs.includes(h.uf)) continue;
    const k = rotulo(h);
    if (vistos.has(k)) continue;
    vistos.add(k); out.push(h);
    if (out.length === n) break;
  }
  return out;
}
function tabelaPontos(s, pts, y) {
  const cab = ['Local', 'UF', 'Moradores com o perfil, sem Panvel a 1 km', 'Renda média do responsável (1 km)', '60+ (1 km)',
    'Raia Drogasil + Pague Menos a 1 km', 'Panvel mais próxima'];
  const hd = cab.map(t => ({ text: t, options: { bold: true, color: 'FFFFFF', fill: { color: HEX.dk2 }, fontSize: 12, valign: 'middle' } }));
  const linhas = pts.map((h, i) => [rotulo(h), h.uf, br(h.perfil_sem_panvel_1km), 'R$ ' + br(h.renda_1km), br(h.p60_1km, 1) + '%',
    String(h.rd_1km + h.pm_1km), h.panvel_mais_proxima_km < 10 ? br(h.panvel_mais_proxima_km, 1) + ' km' : br(h.panvel_mais_proxima_km) + ' km']
    .map((t, j) => ({ text: t, options: { fontSize: 13, fill: { color: i % 2 ? 'FFFFFF' : HEX.lt2 }, align: j < 2 ? 'left' : 'right',
      bold: j === 2, color: j === 2 ? HEX.accent2 : HEX.dk1 } })));
  s.addTable([hd, ...linhas], { x: 0.5, y, w: 12.33, colW: [4.15, 0.6, 1.95, 1.75, 1.0, 1.58, 1.3], rowH: 0.42, margin: [3, 6, 3, 6],
    border: { type: 'solid', pt: 0.5, color: 'D5DDE5' }, fontFace: 'Calibri', objectName: 'Tabela de pontos' });
}

const cid = n => R.municipios.find(m => m.mun === n);
const semPct = m => 100 * m.perfil_sem_panvel / m.perfil;
function tabela(s, cab, linhas, x, y, colW, fs, al) {
  const A = j => al ? al[j] : (j ? 'right' : 'left');
  s.addTable([cab.map((t, j) => ({ text: t, options: { bold: true, color: 'FFFFFF', fill: { color: HEX.dk2 }, align: A(j), valign: 'middle' } })),
    ...linhas.map((l, i) => l.map((t, j) => ({ text: t, options: { align: A(j), fill: { color: i % 2 ? 'FFFFFF' : HEX.lt2 } } })))],
    { x, y, w: colW.reduce((a, b) => a + b, 0), colW, rowH: 0.4, fontSize: fs || 13, fontFace: 'Calibri', color: HEX.dk1,
      border: { type: 'solid', pt: 0.5, color: 'D5DDE5' }, margin: [3, 6, 3, 6], objectName: 'Tabela' });
}

(async () => {
  const PV = R.perfil_1km.panvel, SP = R.setores_perfil, LU = R.lojas_por_uf, CU = R.cobertura_uf, crit = R.criterio, mat = R.matriz_renda_60_casa;
  const ufp = u => SP.por_uf[u];
  const poa = cid('Porto Alegre'), cwb = cid('Curitiba'), fln = cid('Florianópolis'), mga = cid('Maringá'), jvl = cid('Joinville'),
    lon = cid('Londrina'), sp = cid('São Paulo'), stos = cid('Santos'), cps = cid('Campinas'),
    rio = cid('Rio de Janeiro'), nit = cid('Niterói'), bh = cid('Belo Horizonte');

  // números dos releases do 3T26 (Panvel 05/11/2026; RD Saúde 03/11/2026; Pague Menos 04/11/2026)
  const REL = { pv: { lojas: 677, uf: { RS: 425, SC: 105, PR: 130, SP: 17 }, ab3t: 14, abUF: 'RS 5, SC 2, PR 5, SP 2', share: { Sul: 13.5, RS: 22.4, SC: 7.9, PR: 7.4 },
      venda: 837, vendaMad: 887, ticket: 101.15, roic: { 2023: 34.3, 2024: 24.3, 2025: 13.1 }, madSP: 47.1, madRS: 83.7, capexAb: 20.1 },
    rd: { lojas: 3770, ab3t: 92, abLTM: 333, guid: '330 a 350', uf: { SP: 1485, RJ: 295, MG: 269, PR: 217, RS: 140, SC: 121, ES: 82 }, share: { SP: 33.0, Sul: 11.5, SE: 14.3 }, spPct: 35, cds: 16 },
    pm: { lojas: 1705, ticket: 97.39, venda: 868, ne: 62, share: { Sul: 1.1, SE: 2.0 } } };
  const FR = 'Releases de resultados do 3T26 (Panvel, RD Saúde, Pague Menos); market share: IQVIA, conforme os releases.';

  // 1 ─ resposta
  pres.addSection({ title: 'Onde crescer' });
  let s = pres.addSlide({ masterName: 'FECHO', sectionTitle: 'Onde crescer' });
  s.addText('Onde a Panvel deve crescer', { placeholder: 'title' });
  T(s, `A rede voltou a acelerar: ${REL.pv.ab3t} aberturas no 3T26 e ${REL.pv.lojas} lojas. O alvo das próximas: lugares com renda alta e muitos idosos, onde ${br(SP.pop_perfil_sem_panvel / 1e6, 2)} milhões de pessoas no Sul e no Sudeste ainda não têm uma Panvel a até 1 km.`,
    { x: 0.7, y: 1.4, w: 7.3, h: 1.1, fontSize: 16, color: 'DCE6F2', objectName: 'Mensagem' });
  const fr = [['FaStoreAlt', C.accent2, '1. Desenvolver SC e PR', `Market share de ${br(REL.pv.share.SC, 1)}% em SC e ${br(REL.pv.share.PR, 1)}% no PR, contra ${br(REL.pv.share.RS, 1)}% no RS. Marca e logística já estão lá.`],
    ['FaCity', C.accent3, '2. Crescer em São Paulo', `${REL.pv.uf.SP} lojas hoje e ${br(ufp('SP').sem_panvel / 1e6, 2)} mi de pessoas no perfil sem Panvel. Escolher pontos com pouca Raia.`],
    ['FaRoute', C.accent1, '3. Avaliar nova UF', 'Rio, Niterói e BH: muito público, mas a mais de 340 km da loja Panvel mais próxima.']];
  for (let i = 0; i < 3; i++) {
    const y = 2.7 + i * 1.38;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y, w: 7.3, h: 1.22, rectRadius: 0.12, fill: { color: '1F4677' }, line: { type: 'none' }, objectName: 'Frente ' + i });
    await bolinha(s, 0.95, y + 0.24, 0.74, fr[i][0], fr[i][1], 'frente ' + i);
    T(s, [{ text: fr[i][2], options: { bold: true, fontFace: 'Cambria', fontSize: 18, color: 'FFFFFF', breakLine: true } }, { text: fr[i][3], options: { fontSize: 14, color: 'DCE6F2' } }],
      { x: 1.95, y: y + 0.1, w: 5.9, h: 1.02, valign: 'middle', objectName: 'Frente texto ' + i });
  }
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.4, y: 0.55, w: 4.5, h: 6.4, rectRadius: 0.15, fill: { color: 'FFFFFF' }, line: { type: 'none' }, objectName: 'Moldura' });
  s.addImage({ path: MAPA, x: 8.55, y: 0.65, w: 4.2, h: 4.2 * 1716 / 1538, altText: 'Mapa de oportunidades', objectName: 'Mapa' });
  T(s, 'Vermelho: Panvel · cinza: Raia Drogasil · círculos: pontos com mais público no perfil sem Panvel (verde: RS/SC/PR; laranja: SP; azul: RJ/MG/ES)',
    { x: 8.6, y: 5.45, w: 4.15, h: 1.35, fontSize: 11, color: HEX.dk1, objectName: 'Legenda mapa' });
  s.addNotes(`A resposta primeiro. A própria Panvel retomou a aceleração no 3T26 (${REL.pv.ab3t} inaugurações: ${REL.pv.abUF}). Três frentes, em ordem de esforço: desenvolver SC e PR, onde o market share é um terço do gaúcho; crescer em SP com seletividade; avaliar a entrada no Rio e em BH.`);

  // 2 ─ por quê: o perfil e a economia da loja
  s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Onde crescer' });
  s.addText('O critério: renda alta e idosos, onde a loja Panvel rende', { placeholder: 'title' });
  T(s, 'Moradores a até 1 km de uma Panvel no RS, SC e PR (%)', { x: 0.5, y: 1.45, w: 6.6, h: 0.4, fontSize: 15, bold: true, color: C.text2, objectName: 'Título matriz' });
  const cores = v => v >= 40 ? '13315C' : v >= 20 ? '2A6F8F' : v >= 10 ? '5FA8B8' : v >= 5 ? 'A9D3DA' : 'DCEDF0';
  const rotR = ['Renda alta', 'Renda média', 'Renda baixa'], rot6 = ['Poucos idosos', 'Médio', 'Muitos idosos'];
  for (let a = 0; a < 3; a++) {
    T(s, rotR[a], { x: 0.5, y: 2.0 + a * 1.2, w: 1.35, h: 1.1, fontSize: 14, valign: 'middle', objectName: 'Linha ' + a });
    for (let b = 0; b < 3; b++) {
      const v = mat[2 - a][b];
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 1.9 + b * 1.7, y: 2.0 + a * 1.2, w: 1.6, h: 1.1, rectRadius: 0.08, fill: { color: cores(v) }, line: { type: 'none' }, objectName: `C${a}${b}` });
      T(s, br(v, 1) + '%', { x: 1.9 + b * 1.7, y: 2.0 + a * 1.2, w: 1.6, h: 1.1, fontSize: 22, bold: true, align: 'center', valign: 'middle', color: v >= 20 ? 'FFFFFF' : HEX.dk2, objectName: `V${a}${b}` });
    }
  }
  for (let b = 0; b < 3; b++) T(s, rot6[b], { x: 1.9 + b * 1.7, y: 5.65, w: 1.6, h: 0.35, fontSize: 13, align: 'center', objectName: 'Coluna ' + b });
  T(s, `Critério de busca (mediana das lojas): renda média do responsável ≥ R$ ${br(crit.renda_min)}, 60+ ≥ ${br(crit.p60_min, 1)}% e ≥ ${br(crit.pop1km_min)} moradores no raio de 1 km.`,
    { x: 0.5, y: 6.05, w: 6.6, h: 0.5, fontSize: 12, color: C.text2, objectName: 'Critério' });
  T(s, 'O que os releases confirmam', { x: 7.6, y: 1.45, w: 5.2, h: 0.45, fontFace: 'Cambria', fontSize: 20, bold: true, color: C.text2, objectName: 'Releases' });
  const ev = [['FaReceipt', `Ticket médio de R$ ${br(REL.pv.ticket, 2)}`, `Acima da Pague Menos (R$ ${br(REL.pm.ticket, 2)}). Higiene e beleza tem "grande penetração entre os consumidores de maior renda".`],
    ['FaStore', `R$ ${REL.pv.venda} mil por loja por mês`, `R$ ${REL.pv.vendaMad} mil nas lojas maduras; venda nas mesmas lojas +13,3% no 3T26.`],
    ['FaChartLine', 'Lojas novas dão retorno', `ROIC das safras: ${br(REL.pv.roic[2023], 1)}% (2023), ${br(REL.pv.roic[2024], 1)}% (2024) e ${br(REL.pv.roic[2025], 1)}% (2025, ainda em maturação).`]];
  for (let i = 0; i < 3; i++) {
    const y = 2.05 + i * 1.45;
    cartao(s, 7.6, y, 5.23, 1.3, C.background2, 'Evidência ' + i);
    await bolinha(s, 7.8, y + 0.3, 0.66, ev[i][0], C.accent2, 'evidência ' + i);
    T(s, [{ text: ev[i][1], options: { bold: true, color: C.text2, breakLine: true } }, { text: ev[i][2] }], { x: 8.65, y: y + 0.12, w: 4.05, h: 1.1, fontSize: 13, valign: 'middle', objectName: 'Evidência texto ' + i });
  }
  fonte(s, 'Matriz: Censo 2022 e lojas do CNES (abr./2026); terços da população por renda do responsável e por 60+. Evidências: release 3T26 da Panvel e da Pague Menos.');
  s.addNotes('Por que esses lugares: nos estados onde é forte, a Panvel cobre 46% dos moradores com renda alta e muitos idosos, e só 2,4% no extremo oposto. O release reforça o critério: o ticket da Panvel é o maior entre as redes comparadas, a categoria de higiene e beleza depende do público de maior renda e as lojas abertas desde 2023 já dão ROIC de dois dígitos.');

  // 3 ─ SC e PR
  s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Onde crescer' });
  s.addText('Por que adensar SC e PR: share de um terço do RS', { placeholder: 'title' });
  [['RS', C.accent4], ['SC', C.accent2], ['PR', C.accent2]].forEach(([u, cor], i) => {
    const x = 0.5 + i * 2.1;
    cartao(s, x, 1.45, 1.95, 1.25, C.background2, 'Share ' + u);
    T(s, br(REL.pv.share[u], 1) + '%', { x: x + 0.2, y: 1.5, w: 1.6, h: 0.65, fontFace: 'Cambria', fontSize: 28, bold: true, color: cor, objectName: 'Share n ' + u });
    T(s, `share em ${u} · ${REL.pv.uf[u]} lojas`, { x: x + 0.2, y: 2.15, w: 1.65, h: 0.45, fontSize: 12, objectName: 'Share t ' + u });
  });
  const cs = [poa, lon, cwb, fln, mga, jvl];
  s.addChart(pres.charts.BAR, [{ name: 'Sem Panvel', labels: cs.map(m => m.mun), values: cs.map(m => Math.round(semPct(m))) }],
    { x: 0.5, y: 2.85, w: 6.1, h: 3.7, barDir: 'bar', chartColors: [HEX.accent4, HEX.accent2, HEX.accent2, HEX.accent2, HEX.accent2, HEX.accent2],
      showTitle: true, title: 'Público no perfil sem Panvel a até 1 km (%)', titleFontFace: '+mn-lt', titleFontSize: 13, titleColor: HEX.dk1,
      showValue: true, dataLabelFormatCode: '0"%"', dataLabelFontFace: '+mn-lt', dataLabelFontSize: 12, dataLabelColor: HEX.dk1,
      valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' }, catAxisOrientation: 'maxMin', catAxisLabelFontFace: '+mn-lt',
      catAxisLabelFontSize: 12, catAxisLabelColor: '4A5868', showLegend: false, barGapWidthPct: 45, valAxisMinVal: 0, valAxisMaxVal: 118, objectName: 'Gráfico cidades' });
  const motivos = [['FaCheckCircle', 'Porto Alegre mostra o teto', `Só ${br(semPct(poa), 0)}% do público no perfil fica sem Panvel a 1 km. Em Curitiba, ${br(semPct(cwb), 0)}% (${br(cwb.perfil_sem_panvel)} pessoas); em Joinville, ${br(semPct(jvl), 0)}%.`],
    ['FaFlag', 'A Raia tem mais lojas', `PR: ${REL.rd.uf.PR} da Raia contra ${REL.pv.uf.PR} da Panvel; SC: ${REL.rd.uf.SC} contra ${REL.pv.uf.SC}. No RS a Panvel tem ${REL.pv.uf.RS} contra ${REL.rd.uf.RS}.`],
    ['FaTruck', 'Abrir perto custa menos', 'Os pontos de Curitiba, Florianópolis e Maringá ficam a 1 ou 2 km de lojas atuais. A Panvel já abriu 5 lojas no PR e 2 em SC no 3T26.'],
    ['FaChartLine', 'Rede madura e densa dá mais margem', 'EBITDA LTM: RS 12,6% (83,7% das lojas maduras), SC 11,2%, PR 9,2% e SP 6,2% (47,1% maduras).']];
  for (let i = 0; i < 4; i++) {
    const y = 1.45 + i * 1.28;
    await bolinha(s, 7.0, y + 0.08, 0.62, motivos[i][0], i === 1 ? C.accent1 : C.accent2, 'motivo ' + i);
    T(s, [{ text: motivos[i][1], options: { bold: true, color: C.text2, breakLine: true } }, { text: motivos[i][2] }], { x: 7.8, y, w: 5.03, h: 1.18, fontSize: 13.5, objectName: 'Motivo ' + i });
  }
  fonte(s, 'Share, lojas, EBITDA LTM e maturidade por UF: release e apresentação 3T26 da Panvel (IQVIA). Gráfico: Censo 2022 e lojas do CNES (abr./2026). Público no perfil: renda e 60+ acima das medianas das Panvel.');
  s.addNotes(`O porquê de adensar, agora com os números da própria empresa: no RS a Panvel tem ${br(REL.pv.share.RS, 1)}% do mercado; em SC e no PR, cerca de um terço disso. Porto Alegre mostra até onde a rede chega quando madura. A Raia Drogasil tem mais lojas que a Panvel no PR e em SC. O release da Panvel diz que a empresa vê muitas oportunidades na Região Sul, em especial no interior dos estados. A margem acompanha a maturidade: EBITDA LTM de 12,6% no RS, 11,2% em SC, 9,2% no PR e 6,2% em SP (apresentação 3T26, slide 16). Levar Curitiba ao nível de Porto Alegre alcançaria cerca de ${br(Math.round((cwb.perfil_sem_panvel - cwb.perfil * semPct(poa) / 100) / 1000))} mil pessoas no perfil a mais.`);

  // 4 ─ São Paulo
  s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Onde crescer' });
  s.addText('São Paulo: o maior mercado, com a Raia dominante', { placeholder: 'title' });
  const sps = [['Capital', sp], ['Santos', stos], ['Campinas', cps]];
  for (let i = 0; i < 3; i++) {
    const x = 0.5 + i * 2.75, m = sps[i][1];
    cartao(s, x, 1.45, 2.6, 1.55, C.background2, 'SP ' + i);
    T(s, br(m.perfil_sem_panvel / 1000) + ' mil', { x: x + 0.2, y: 1.52, w: 2.3, h: 0.6, fontFace: 'Cambria', fontSize: 26, bold: true, color: C.accent2, objectName: 'SP n ' + i });
    T(s, `${sps[i][0]}: no perfil sem Panvel a 1 km`, { x: x + 0.2, y: 2.12, w: 2.3, h: 0.8, fontSize: 13, objectName: 'SP t ' + i });
  }
  cartao(s, 8.85, 1.45, 3.98, 1.55, 'FBEAE5', 'Raia SP');
  T(s, [{ text: `Raia: ${br(REL.rd.uf.SP)} lojas e ${br(REL.rd.share.SP, 1)}% de share em SP`, options: { bold: true, color: C.accent6, breakLine: true } },
    { text: `${REL.rd.spPct}% das aberturas da Raia no último ano foram em SP. A Panvel tem ${REL.pv.uf.SP} lojas, ${br(REL.pv.madSP, 1)}% delas maduras.` }],
    { x: 9.05, y: 1.55, w: 3.6, h: 1.4, fontSize: 13, objectName: 'Texto Raia SP' });
  const ptsSP = R.pontos.filter(h => h.uf === 'SP');
  const pick = ['Santana', 'Pompeia', 'Mirandopolis', 'Gonzaga', 'Embaré', 'Cambui'].map(k => ptsSP.find(h => (h.bairro || h.ref_cnes).includes(k)));
  tabela(s, ['Ponto candidato', 'Público no perfil (1 km)', 'Renda média', '60+', 'Raia + Pague Menos (1 km)', 'Panvel mais próxima'],
    pick.map(h => [rotulo(h), br(h.perfil_sem_panvel_1km), 'R$ ' + br(h.renda_1km), br(h.p60_1km, 1) + '%', String(h.rd_1km + h.pm_1km), br(h.panvel_mais_proxima_km, 1) + ' km']),
    0.5, 3.25, [3.6, 1.85, 1.55, 1.05, 2.3, 1.98]);
  fonte(s, 'Pontos: Censo 2022 e CNES (abr./2026); * bairro do CNES da farmácia mais próxima. Raia e Panvel em SP: releases 3T26 (IQVIA).');
  s.addNotes('São Paulo tem o maior público no perfil sem Panvel, mas é o mercado mais disputado: a Raia tem 33% de share no estado e concentra lá um terço das aberturas. A Panvel tem 17 lojas, metade ainda em maturação. Crescer com seletividade: pontos perto das lojas da capital e com pouca concorrência, como Santana; Santos é o caso mais forte de público idoso.');

  // 5 ─ concorrência e sequência
  s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Onde crescer' });
  s.addText('Concorrência e sequência recomendada', { placeholder: 'title' });
  const conc = [['FaFlag', C.accent1, 'Raia Drogasil', `${br(REL.rd.lojas)} lojas, ${REL.rd.ab3t} aberturas no 3T26 e guidance de ${REL.rd.guid} por ano. ${REL.rd.cds} CDs; share de ${br(REL.rd.share.Sul, 1)}% no Sul, contra ${br(REL.pv.share.Sul, 1)}% da Panvel.`],
    ['FaMapMarkerAlt', C.accent4, 'Pague Menos', `${br(REL.pm.lojas)} lojas, ${REL.pm.ne}% no Nordeste e expansão no Norte, Nordeste e Centro-Oeste. Share de ${br(REL.pm.share.Sul, 1)}% no Sul e ${br(REL.pm.share.SE, 1)}% no Sudeste: não disputa o Sul.`],
    ['FaCity', C.accent3, 'RJ e MG', `Rio (${br(rio.perfil_sem_panvel / 1000)} mil no perfil), BH (${br(bh.perfil_sem_panvel / 1000)} mil) e Niterói (${br(nit.perfil_sem_panvel / 1000)} mil), com ${REL.rd.uf.RJ} lojas da Raia no RJ e ${REL.rd.uf.MG} em MG.`]];
  for (let i = 0; i < 3; i++) {
    const x = 0.5 + i * 4.21;
    cartao(s, x, 1.45, 3.91, 1.95, C.background2, 'Concorrente ' + i);
    await bolinha(s, x + 0.25, 1.65, 0.6, conc[i][0], conc[i][1], 'conc ' + i);
    T(s, conc[i][2], { x: x + 1.0, y: 1.65, w: 2.8, h: 0.6, fontFace: 'Cambria', fontSize: 18, bold: true, color: C.text2, valign: 'middle', objectName: 'Conc título ' + i });
    T(s, conc[i][3], { x: x + 0.25, y: 2.32, w: 3.45, h: 1.0, fontSize: 12.5, objectName: 'Conc texto ' + i });
  }
  const seq = [['1', 'SC e PR', 'Adensar Curitiba, Florianópolis, Maringá e Joinville; depois, cidades médias de SC já conferidas', C.accent2],
    ['2', 'São Paulo', 'Pontos perto das 17 lojas, com pouca Raia; testar Santos', C.accent3],
    ['3', 'RJ e MG', 'Estudo de entrada: exige logística nova (a mais de 340 km)', C.accent1]];
  for (let i = 0; i < 3; i++) {
    const x = 0.5 + i * 4.21;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 3.65, w: 3.91, h: 1.85, rectRadius: 0.12, fill: { color: HEX.dk2 }, line: { type: 'none' }, objectName: 'Etapa ' + i });
    s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: 3.85, w: 0.55, h: 0.55, fill: { color: seq[i][3] }, line: { type: 'none' }, objectName: 'Número etapa ' + i });
    T(s, seq[i][0], { x: x + 0.25, y: 3.85, w: 0.55, h: 0.55, fontSize: 18, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', objectName: 'Etapa n ' + i });
    T(s, seq[i][1], { x: x + 0.95, y: 3.85, w: 2.8, h: 0.55, fontFace: 'Cambria', fontSize: 19, bold: true, color: 'FFFFFF', valign: 'middle', objectName: 'Etapa título ' + i });
    T(s, seq[i][2], { x: x + 0.25, y: 4.55, w: 3.45, h: 0.85, fontSize: 13.5, color: 'DCE6F2', objectName: 'Etapa texto ' + i });
  }
  T(s, [{ text: 'Antes de abrir: ', options: { bold: true } }, { text: 'cruzar com venda, ticket e margem internos e conferir o ponto (aluguel, fluxo). Lista completa: pontos-oportunidade.csv.' }],
    { x: 0.5, y: 5.75, w: 12.33, h: 0.5, fontSize: 13, objectName: 'Antes de abrir' });
  fonte(s, FR + ' Público no perfil: Censo 2022.');
  s.addNotes('A Raia é a concorrente que importa: cresce mais de 300 lojas por ano e já tem mais lojas que a Panvel em SC e no PR. A Pague Menos está concentrada no Norte e no Nordeste e quase não aparece no Sul. Por isso a ordem: primeiro defender e ocupar SC e PR, depois SP com seletividade, e só então estudar novas UFs.');

  // 6 ─ anexo: validação
  pres.addSection({ title: 'Anexo' });
  s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Anexo' });
  s.addText('Anexo: as bases batem? CNES × releases', { placeholder: 'title' });
  const linhasV = [['Panvel', 'RS', LU.RS.panvel, REL.pv.uf.RS], ['Panvel', 'SC', LU.SC.panvel, REL.pv.uf.SC], ['Panvel', 'PR', LU.PR.panvel, REL.pv.uf.PR], ['Panvel', 'SP', LU.SP.panvel, REL.pv.uf.SP],
    ['Raia', 'SP', LU.SP.rd, REL.rd.uf.SP], ['Raia', 'RJ', LU.RJ.rd, REL.rd.uf.RJ], ['Raia', 'MG', LU.MG.rd, REL.rd.uf.MG], ['Raia', 'PR', LU.PR.rd, REL.rd.uf.PR],
    ['Raia', 'RS', LU.RS.rd, REL.rd.uf.RS], ['Raia', 'SC', LU.SC.rd, REL.rd.uf.SC], ['Raia', 'ES', LU.ES.rd, REL.rd.uf.ES]];
  tabela(s, ['Rede', 'UF', 'CNES (abr./2026)', 'Release (set./2026)', 'CNES ÷ release'],
    linhasV.map(([r, u, a, b]) => [r, u, br(a), br(b), br(100 * a / b, 0) + '%']), 0.5, 1.45, [1.3, 0.8, 1.7, 1.8, 1.6], 12, ['left', 'left', 'right', 'right', 'right']);
  T(s, 'Como ler', { x: 8.0, y: 1.45, w: 4.8, h: 0.45, fontFace: 'Cambria', fontSize: 20, bold: true, color: C.text2, objectName: 'Como ler' });
  T(s, [
    { text: 'O CNES tem 88% das lojas Panvel e 89% das da Raia no Sul e no Sudeste que os releases informam. Falta loja aberta depois de abril ou sem registro de farmácia: em Balneário Camboriú, o único registro da Panvel é um centro de vacinação.', options: { bullet: true, breakLine: true } },
    { text: 'Efeito: a cobertura a 1 km e o "público sem Panvel" estão um pouco superestimados; a ordem dos lugares tende a se manter.', options: { bullet: true, breakLine: true } },
    { text: 'O argumento de SC e PR não depende do CNES: o market share da IQVIA vem dos releases.', options: { bullet: true, breakLine: true } },
    { text: 'Sem dado de venda por loja: a renda do responsável (Censo 2022) é aproximação do ticket. Raio em linha reta.', options: { bullet: true } }],
    { x: 8.0, y: 2.0, w: 4.83, h: 4.4, fontSize: 14, paraSpaceAfter: 8, objectName: 'Notas validação' });
  fonte(s, 'CNES abr./2026 (geobr/IPEA): farmácias ativas; na Panvel, mais 4 registros ativos da Dimed em outros tipos (vacinação, clínica). Releases 3T26: lojas em operação em 30/09/2026. Raia Drogasil = Droga Raia + Drogasil.');
  s.addNotes('Anexo para perguntas sobre a base. As lojas foram localizadas pelo CNES, que tem cerca de 88% das lojas que as empresas informam. Isso não muda as conclusões: o argumento central de SC e PR vem do market share publicado pela própria Panvel.');

  await pres.writeFile({ fileName: SAIDA });
  await applyTheme(SAIDA, THEME);
  console.log('gravado', SAIDA);
})().catch(e => { console.error(e); process.exit(1); });
