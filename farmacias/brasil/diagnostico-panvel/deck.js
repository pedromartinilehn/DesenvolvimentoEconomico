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
    lon = cid('Londrina'), bc = cid('Balneário Camboriú'), sp = cid('São Paulo'), stos = cid('Santos'), cps = cid('Campinas'),
    rio = cid('Rio de Janeiro'), nit = cid('Niterói'), bh = cid('Belo Horizonte');

  // 1 ─ resposta
  pres.addSection({ title: 'Onde crescer' });
  let s = pres.addSlide({ masterName: 'FECHO', sectionTitle: 'Onde crescer' });
  s.addText('Onde a Panvel deve crescer', { placeholder: 'title' });
  T(s, `Em lugares com renda alta e muitos idosos, o perfil que a rede já atende. No Sul e no Sudeste, ${br(SP.pop_perfil_sem_panvel / 1e6, 2)} milhões de pessoas vivem nesse perfil sem uma Panvel a até 1 km.`,
    { x: 0.7, y: 1.45, w: 7.3, h: 1.0, fontSize: 17, color: 'DCE6F2', objectName: 'Mensagem' });
  const fr = [['FaStoreAlt', C.accent2, '1. Desenvolver SC e PR', `Adensar Curitiba, Florianópolis, Maringá e Joinville e abrir Balneário Camboriú. A marca e a logística já estão lá.`],
    ['FaCity', C.accent3, '2. Crescer em São Paulo', `Capital (a partir das 12 lojas), Santos e Campinas: ${br(ufp('SP').sem_panvel / 1e6, 2)} mi de pessoas no perfil sem Panvel.`],
    ['FaRoute', C.accent1, '3. Avaliar nova UF', 'Rio, Niterói e Belo Horizonte: muito público, mas a mais de 340 km da Panvel mais próxima.']];
  for (let i = 0; i < 3; i++) {
    const y = 2.65 + i * 1.4;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y, w: 7.3, h: 1.22, rectRadius: 0.12, fill: { color: '1F4677' }, line: { type: 'none' }, objectName: 'Frente ' + i });
    await bolinha(s, 0.95, y + 0.24, 0.74, fr[i][0], fr[i][1], 'frente ' + i);
    T(s, [{ text: fr[i][2], options: { bold: true, fontFace: 'Cambria', fontSize: 18, color: 'FFFFFF', breakLine: true } }, { text: fr[i][3], options: { fontSize: 14, color: 'DCE6F2' } }],
      { x: 1.95, y: y + 0.12, w: 5.9, h: 1.0, valign: 'middle', objectName: 'Frente texto ' + i });
  }
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.4, y: 0.55, w: 4.5, h: 6.4, rectRadius: 0.15, fill: { color: 'FFFFFF' }, line: { type: 'none' }, objectName: 'Moldura' });
  s.addImage({ path: MAPA, x: 8.55, y: 0.65, w: 4.2, h: 4.2 * 1716 / 1538, altText: 'Mapa de oportunidades', objectName: 'Mapa' });
  T(s, 'Vermelho: Panvel · cinza: Raia Drogasil · círculos: pontos com mais público no perfil sem Panvel (verde: RS/SC/PR; laranja: SP; azul: RJ/MG/ES)',
    { x: 8.6, y: 5.45, w: 4.15, h: 1.35, fontSize: 11, color: HEX.dk1, objectName: 'Legenda mapa' });
  s.addNotes('A resposta primeiro: três frentes, em ordem de esforço. Desenvolver SC e PR, onde a Panvel já está mas ainda deixa muito público-perfil descoberto; crescer em São Paulo a partir das lojas da capital; e, por último, avaliar a entrada no Rio e em BH.');

  // 2 ─ por quê: o perfil
  s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Onde crescer' });
  s.addText('O critério: o perfil que a Panvel já atende', { placeholder: 'title' });
  T(s, 'Moradores a até 1 km de uma Panvel no RS, SC e PR (%)', { x: 0.5, y: 1.45, w: 6.8, h: 0.4, fontSize: 15, bold: true, color: C.text2, objectName: 'Título matriz' });
  const cores = v => v >= 40 ? '13315C' : v >= 20 ? '2A6F8F' : v >= 10 ? '5FA8B8' : v >= 5 ? 'A9D3DA' : 'DCEDF0';
  const rotR = ['Renda alta', 'Renda média', 'Renda baixa'], rot6 = ['Poucos idosos', 'Médio', 'Muitos idosos'];
  for (let a = 0; a < 3; a++) {
    T(s, rotR[a], { x: 0.5, y: 2.0 + a * 1.25, w: 1.4, h: 1.15, fontSize: 14, valign: 'middle', objectName: 'Linha ' + a });
    for (let b = 0; b < 3; b++) {
      const v = mat[2 - a][b];
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 2.0 + b * 1.75, y: 2.0 + a * 1.25, w: 1.65, h: 1.15, rectRadius: 0.08, fill: { color: cores(v) }, line: { type: 'none' }, objectName: `C${a}${b}` });
      T(s, br(v, 1) + '%', { x: 2.0 + b * 1.75, y: 2.0 + a * 1.25, w: 1.65, h: 1.15, fontSize: 24, bold: true, align: 'center', valign: 'middle', color: v >= 20 ? 'FFFFFF' : HEX.dk2, objectName: `V${a}${b}` });
    }
  }
  for (let b = 0; b < 3; b++) T(s, rot6[b], { x: 2.0 + b * 1.75, y: 5.8, w: 1.65, h: 0.35, fontSize: 13, align: 'center', objectName: 'Coluna ' + b });
  T(s, 'Onde mirar', { x: 7.9, y: 1.45, w: 4.9, h: 0.45, fontFace: 'Cambria', fontSize: 20, bold: true, color: C.text2, objectName: 'Onde mirar' });
  const reg = [['FaCoins', `Renda média do responsável de pelo menos R$ ${br(crit.renda_min)} no raio de 1 km`],
    ['FaUserFriends', `Pelo menos ${br(crit.p60_min, 1)}% de moradores com 60 anos ou mais`],
    ['FaUsers', `Pelo menos ${br(crit.pop1km_min)} moradores no raio de 1 km`]];
  for (let i = 0; i < 3; i++) {
    await bolinha(s, 7.9, 2.1 + i * 0.95, 0.66, reg[i][0], C.accent2, 'critério ' + i);
    T(s, reg[i][1], { x: 8.75, y: 2.1 + i * 0.95, w: 4.08, h: 0.7, fontSize: 15, valign: 'middle', objectName: 'Critério ' + i });
  }
  cartao(s, 7.9, 5.0, 4.93, 1.4, C.background2, 'Por que');
  T(s, `É o retrato da Panvel típica (medianas das 593 lojas). ${br(PV.pct_renda_acima_uf, 0)}% das lojas estão em entornos mais ricos que a média do estado.`,
    { x: 8.15, y: 5.12, w: 4.5, h: 1.2, fontSize: 14, valign: 'middle', objectName: 'Texto por que' });
  fonte(s, 'Sem dado de venda: o ticket é aproximado pela renda do responsável pelo domicílio (Censo 2022). Lojas: CNES abr./2026. Raio de 1 km em linha reta.');
  s.addNotes('Por que esses lugares: nos estados onde é forte, a Panvel cobre 45% dos moradores com renda alta e muitos idosos, e só 2,4% no extremo oposto. Os três critérios à direita são o retrato da loja Panvel típica e foram usados para achar os pontos dos próximos slides.');

  // 3 ─ SC e PR: por que adensar
  s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Onde crescer' });
  s.addText('Por que adensar SC e PR: ainda longe do nível de Porto Alegre', { placeholder: 'title' });
  const cs = [poa, lon, cwb, fln, mga, jvl, bc];
  s.addChart(pres.charts.BAR, [{ name: 'Sem Panvel', labels: cs.map(m => m.mun), values: cs.map(m => Math.round(semPct(m))) }],
    { x: 0.5, y: 1.4, w: 6.1, h: 5.1, barDir: 'bar', chartColors: [HEX.accent4, HEX.accent2, HEX.accent2, HEX.accent2, HEX.accent2, HEX.accent2, HEX.accent1],
      showTitle: true, title: 'Público no perfil sem Panvel a até 1 km (%)', titleFontFace: '+mn-lt', titleFontSize: 14, titleColor: HEX.dk1,
      showValue: true, dataLabelFormatCode: '0"%"', dataLabelFontFace: '+mn-lt', dataLabelFontSize: 13, dataLabelColor: HEX.dk1,
      valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' }, catAxisOrientation: 'maxMin', catAxisLabelFontFace: '+mn-lt',
      catAxisLabelFontSize: 13, catAxisLabelColor: '4A5868', showLegend: false, barGapWidthPct: 50, valAxisMinVal: 0, valAxisMaxVal: 115, objectName: 'Gráfico cidades' });
  const motivos = [['FaCheckCircle', 'Porto Alegre mostra o potencial', `Lá, só ${br(semPct(poa), 0)}% do público no perfil fica sem Panvel a 1 km. Em Curitiba são ${br(semPct(cwb), 0)}% (${br(cwb.perfil_sem_panvel)} pessoas).`],
    ['FaTruck', 'Marca e logística já estão lá', 'Os pontos candidatos de Curitiba, Florianópolis e Maringá ficam a 1 ou 2 km de lojas atuais.'],
    ['FaFlag', 'A Raia está ocupando o espaço', `Já tem mais lojas que a Panvel em Curitiba (${cwb.rd} × ${cwb.panvel}), Maringá (${mga.rd} × ${mga.panvel}) e Joinville (${jvl.rd} × ${jvl.panvel}).`],
    ['FaUmbrellaBeach', 'Balneário Camboriú está vazio', `${br(bc.perfil_sem_panvel)} pessoas no perfil, nenhuma Panvel e só ${bc.rd} lojas da Raia.`]];
  for (let i = 0; i < 4; i++) {
    const y = 1.45 + i * 1.27;
    await bolinha(s, 7.0, y + 0.08, 0.62, motivos[i][0], i === 2 ? C.accent1 : C.accent2, 'motivo ' + i);
    T(s, [{ text: motivos[i][1], options: { bold: true, color: C.text2, breakLine: true } }, { text: motivos[i][2] }],
      { x: 7.8, y, w: 5.03, h: 1.15, fontSize: 14, objectName: 'Motivo ' + i });
  }
  fonte(s, 'Público no perfil: moradores de setores com renda e parcela de 60+ iguais ou acima das medianas das Panvel. Censo 2022; CNES abr./2026.');
  s.addNotes(`O porquê de adensar: Porto Alegre é a prova do que a rede consegue quando está madura, com só 4% do público-perfil sem Panvel por perto. Em Curitiba, Florianópolis, Maringá e Joinville essa parcela vai de 22% a 49%. A Panvel já tem marca e logística nessas cidades, e a Raia Drogasil já tem mais lojas que ela em várias delas. Levar Curitiba ao nível de Porto Alegre significaria alcançar cerca de ${br(Math.round((cwb.perfil_sem_panvel - cwb.perfil * semPct(poa) / 100) / 1000))} mil pessoas no perfil a mais.`);

  // 4 ─ São Paulo
  s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Onde crescer' });
  s.addText('São Paulo: o maior mercado descoberto, perto das lojas atuais', { placeholder: 'title' });
  const sps = [['Capital', sp], ['Santos', stos], ['Campinas', cps]];
  for (let i = 0; i < 3; i++) {
    const x = 0.5 + i * 4.21, m = sps[i][1];
    cartao(s, x, 1.45, 3.91, 1.75, C.background2, 'SP ' + i);
    T(s, br(m.perfil_sem_panvel / 1000) + ' mil', { x: x + 0.3, y: 1.55, w: 3.4, h: 0.7, fontFace: 'Cambria', fontSize: 30, bold: true, color: C.accent2, objectName: 'SP número ' + i });
    T(s, `${sps[i][0]}: pessoas no perfil sem Panvel a 1 km (${br(semPct(m), 0)}% do perfil). Panvel ${m.panvel} · Raia ${m.rd}.`,
      { x: x + 0.3, y: 2.25, w: 3.4, h: 0.85, fontSize: 14, objectName: 'SP texto ' + i });
  }
  const ptsSP = R.pontos.filter(h => h.uf === 'SP');
  const pick = ['Santana', 'Pompeia', 'Mirandopolis', 'Gonzaga', 'Embaré', 'Cambui'].map(k => ptsSP.find(h => (h.bairro || h.ref_cnes).includes(k)));
  tabela(s, ['Ponto candidato', 'Público no perfil (1 km)', 'Renda média', '60+', 'Raia + Pague Menos (1 km)', 'Panvel mais próxima'],
    pick.map(h => [rotulo(h), br(h.perfil_sem_panvel_1km), 'R$ ' + br(h.renda_1km), br(h.p60_1km, 1) + '%', String(h.rd_1km + h.pm_1km), br(h.panvel_mais_proxima_km, 1) + ' km']),
    0.5, 3.45, [3.6, 1.85, 1.55, 1.05, 2.3, 1.98]);
  fonte(s, 'Por que: as 12 lojas da capital já dão base de marca e logística, e Santos tem mais de 30% de idosos. Cuidado: a Raia tem 482 lojas na capital. * Bairro do CNES da farmácia mais próxima.');
  s.addNotes('São Paulo concentra o maior público no perfil sem Panvel. A capital já tem 12 lojas, então os pontos próximos (Santana, Pompeia, Mirandópolis) aproveitam essa base. Santos é o caso mais forte de público idoso. A concorrência é a maior da região: escolher pontos com poucos concorrentes, como Santana.');

  // 5 ─ nova UF e sequência
  s = pres.addSlide({ masterName: 'CONTEUDO', sectionTitle: 'Onde crescer' });
  s.addText('Nova UF por último, e a sequência recomendada', { placeholder: 'title' });
  tabela(s, ['Cidade', 'Público no perfil sem Panvel', 'Lojas da Raia', 'Melhores pontos'],
    [[rio.mun, br(rio.perfil_sem_panvel), String(rio.rd), 'Copacabana, Laranjeiras, Vila Isabel'], [bh.mun, br(bh.perfil_sem_panvel), String(bh.rd), 'Sion, Barroca'],
     [nit.mun, br(nit.perfil_sem_panvel), String(nit.rd), 'Icaraí']], 0.5, 1.5, [2.2, 2.4, 1.5, 3.6], 13, ['left', 'right', 'right', 'left']);
  T(s, 'Por que por último: é o maior volume de público, mas a Panvel mais próxima fica a mais de 340 km. Exige montar logística e marca do zero.',
    { x: 10.4, y: 1.5, w: 2.43, h: 1.65, fontSize: 14, objectName: 'Por que último' });
  const seq = [['1', 'SC e PR', 'Balneário Camboriú e adensar Curitiba, Florianópolis, Maringá e Joinville', C.accent2],
    ['2', 'São Paulo', 'Pontos perto das 12 lojas da capital; testar Santos', C.accent3],
    ['3', 'RJ e MG', 'Estudo de entrada: Rio, Niterói e Belo Horizonte', C.accent1]];
  for (let i = 0; i < 3; i++) {
    const x = 0.5 + i * 4.21;
    cartao(s, x, 3.45, 3.91, 2.1, C.background2, 'Etapa ' + i);
    s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: 3.7, w: 0.6, h: 0.6, fill: { color: seq[i][3] }, line: { type: 'none' }, objectName: 'Número etapa ' + i });
    T(s, seq[i][0], { x: x + 0.3, y: 3.7, w: 0.6, h: 0.6, fontSize: 20, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', objectName: 'Etapa n ' + i });
    T(s, seq[i][1], { x: x + 1.05, y: 3.7, w: 2.7, h: 0.6, fontFace: 'Cambria', fontSize: 20, bold: true, color: C.text2, valign: 'middle', objectName: 'Etapa título ' + i });
    T(s, seq[i][2], { x: x + 0.3, y: 4.45, w: 3.4, h: 1.0, fontSize: 15, objectName: 'Etapa texto ' + i });
  }
  T(s, [{ text: 'Antes de abrir: ', options: { bold: true } }, { text: 'cruzar com venda, ticket e margem das lojas atuais e conferir o ponto (aluguel, fluxo). Lista completa: pontos-oportunidade.csv.' }],
    { x: 0.5, y: 5.8, w: 12.33, h: 0.6, fontSize: 14, objectName: 'Antes de abrir' });
  fonte(s, 'CNES abr./2026 (lojas); Censo 2022 (setores). O CNES não é a lista oficial das redes; a renda é aproximação do ticket.');
  s.addNotes('O Sudeste fora de SP tem o maior volume de público no perfil, mas a entrada exige logística nova. A sequência vai do menor para o maior esforço.');

  await pres.writeFile({ fileName: SAIDA });
  await applyTheme(SAIDA, THEME);
  console.log('gravado', SAIDA);
})().catch(e => { console.error(e); process.exit(1); });
