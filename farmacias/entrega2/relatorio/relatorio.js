// Relatório ao executivo · Entrega 2 · Panvel (Grupo 5)
//   node relatorio.js <pasta das imagens> <mapa.png> <saida.docx>
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, Header, Footer, AlignmentType,
  HeadingLevel, WidthType, ShadingType, BorderStyle, LevelFormat, PageNumber, PageBreak, TableOfContents, VerticalAlign,
} = require('docx');

const [, , IMG, MAPA, SAIDA] = process.argv;
const NAVY = '143C8C', ORANGE = 'E8631A', TEXT = '2B2F36', GRAY = '5F6878', LIGHT = 'EEF2FA', LINE = 'D5DDE5';
const FONT = 'Arial';
const W = 9638; // largura útil A4 com margens de 2 cm

const t = (text, o = {}) => new TextRun({ text, font: FONT, size: o.size || 21, bold: o.bold, italics: o.italics, color: o.color || TEXT });
const P = (runs, o = {}) => new Paragraph({
  children: (Array.isArray(runs) ? runs : [runs]).map(r => typeof r === 'string' ? t(r, o) : r),
  spacing: { after: o.after ?? 120, before: o.before ?? 0, line: o.line || 276 }, alignment: o.align || AlignmentType.JUSTIFIED,
  keepNext: o.keepNext, numbering: o.numbering,
});
const H1 = s => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t(s, { size: 30, bold: true, color: NAVY })] });
const H2 = s => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [t(s, { size: 24, bold: true, color: NAVY })] });
const B = (runs, o = {}) => P(runs, { ...o, numbering: { reference: 'bul', level: 0 }, after: 80 });
const leitura = s => P([t('Leitura: ', { bold: true, color: ORANGE }), t(s)], { after: 200 });
const fonte = s => P([t(s, { size: 16, italics: true, color: GRAY })], { after: 220, align: AlignmentType.LEFT });
const img = (arq, w, h) => new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 }, keepNext: true,
  children: [new ImageRun({ type: 'png', data: fs.readFileSync(arq), transformation: { width: w, height: h },
    altText: { title: 'Gráfico', description: 'Gráfico do relatório', name: 'grafico' } })],
});
const legenda = s => P([t(s, { size: 17, bold: true, color: GRAY })], { after: 60, align: AlignmentType.LEFT, keepNext: true });

const borda = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const bordas = { top: borda, bottom: borda, left: borda, right: borda };
function tabela(cab, linhas, larg, o = {}) {
  const soma = larg.reduce((a, b) => a + b, 0);
  const esc = larg.map(x => Math.round(x * W / soma));
  esc[esc.length - 1] += W - esc.reduce((a, b) => a + b, 0);
  const al = o.al || cab.map((_, j) => j === 0 ? 'left' : 'right');
  const cel = (txt, j, i, head) => new TableCell({
    width: { size: esc[j], type: WidthType.DXA }, borders: bordas, verticalAlign: VerticalAlign.CENTER,
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: head ? NAVY : (o.destaque || []).includes(i) ? 'FCEEE6' : i % 2 ? 'FFFFFF' : 'F6F8FC' },
    margins: { top: 50, bottom: 50, left: 90, right: 90 },
    children: [new Paragraph({ alignment: al[j] === 'left' ? AlignmentType.LEFT : al[j] === 'center' ? AlignmentType.CENTER : AlignmentType.RIGHT,
      children: [t(String(txt), { size: o.size || 17, bold: head || (o.negrito || []).includes(i), color: head ? 'FFFFFF' : TEXT })] })],
  });
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: esc,
    rows: [new TableRow({ tableHeader: true, children: cab.map((c, j) => cel(c, j, -1, true)) }),
      ...linhas.map((l, i) => new TableRow({ cantSplit: true, children: l.map((c, j) => cel(c, j, i, false)) }))],
  });
}
const esp = (n = 120) => new Paragraph({ spacing: { after: n }, children: [] });
function caixa(titulo, linhas, cor = NAVY, fundo = LIGHT) {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ cantSplit: true, children: [new TableCell({
      width: { size: W, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: fundo },
      borders: { top: { style: BorderStyle.SINGLE, size: 18, color: cor }, bottom: borda, left: borda, right: borda },
      margins: { top: 120, bottom: 120, left: 180, right: 180 },
      children: [P([t(titulo, { bold: true, color: cor, size: 22 })], { after: 80, align: AlignmentType.LEFT }),
        ...linhas.map(l => P(typeof l === 'string' ? [t(l)] : l, { after: 60 }))],
    })] })],
  });
}

// ── capa ──
const capa = [
  esp(1400),
  P([t('PUCRS · ESCOLA DE NEGÓCIOS', { bold: true, color: NAVY, size: 22 })], { align: AlignmentType.LEFT }),
  P([t('Finanças Corporativas de Curto Prazo · Projeto Extensionista · 2º semestre de 2026', { color: GRAY, size: 20 })], { align: AlignmentType.LEFT, after: 600 }),
  P([t('Relatório ao Executivo', { bold: true, color: ORANGE, size: 26 })], { align: AlignmentType.LEFT, after: 80 }),
  P([t('Análise das demonstrações financeiras e diagnóstico de lojas', { bold: true, color: NAVY, size: 48 })], { align: AlignmentType.LEFT, after: 200, line: 600 }),
  P([t('Dimed S.A. / Panvel · 2025 × 2024, 2T26 × 2T25 e atualização pelo 3T26', { color: TEXT, size: 24 })], { align: AlignmentType.LEFT, after: 900 }),
  P([t('Entrega 2 · Grupo 5', { bold: true, color: NAVY, size: 22 })], { align: AlignmentType.LEFT, after: 60 }),
  P([t('Eduardo de Abreu Meyer · Hemily da Silva Amaral · Lucas Duarte Sbruzzi · Pedro Martini Lehn · Thiago Carboni Reiter', { size: 20 })], { align: AlignmentType.LEFT, after: 200 }),
  P([t('Professor: ', { bold: true, size: 20 }), t('Prof. Msc. Rafael Disconzi Rodrigues', { size: 20 })], { align: AlignmentType.LEFT, after: 60 }),
  P([t('Porto Alegre, novembro de 2026', { size: 20, color: GRAY })], { align: AlignmentType.LEFT }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ── sumário ──
const sumario = [
  P([t('Sumário', { bold: true, color: NAVY, size: 30 })], { align: AlignmentType.LEFT, after: 200 }),
  new TableOfContents('Sumário', { hyperlink: true, headingStyleRange: '1-2' }),
  P([t('Para atualizar o sumário no Word: clique com o botão direito sobre ele e escolha "Atualizar campo".', { size: 16, italics: true, color: GRAY })], { before: 200 }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ── corpo ──
const corpo = [
  H1('Sumário executivo'),
  caixa('Mensagem central', [
    'A Panvel é rentável e melhora: o EBIT cresceu 30,4% em 2025, acima da receita (+11,5%), e o ROE subiu de 8,5% para 9,7%. O que segura o caixa é o capital de giro. O estoque e o prazo curto com fornecedores mantêm o ciclo financeiro perto de 78 dias. Em setembro de 2026 a empresa usou aplicações para amortizar dívida de longo prazo, e o saldo de tesouraria ficou negativo (−R$ 92,9 milhões).',
  ]),
  esp(160),
  B([t('Estrutura e resultado. ', { bold: true }), t('Liquidez corrente perto de 1,7x. Receita +11,5% em 2025 e +15,7% no 2T26. O resultado financeiro, que inclui os juros de arrendamento do IFRS 16, consome de 42% a 50% do EBIT, e a margem líquida fica entre 1,9% e 2,3%.')]),
  B([t('Capital de giro. ', { bold: true }), t('O estoque responde por cerca de 78% do ciclo operacional. Mesmo assim, a Panvel tem o menor prazo de estoque entre as três redes comparadas (86 a 97 dias). A diferença está no fornecedor: 54 a 55 dias, contra 63 a 79 dias de RD Saúde e Pague Menos.')]),
  B([t('Caixa. ', { bold: true }), t('O caixa operacional da DFC foi de R$ 473 milhões em 2025, com sobra de R$ 110 milhões após capex e aluguéis. No 9M26 a sobra caiu para R$ 19 milhões.')]),
  B([t('Expansão. ', { bold: true }), t('O market share da Panvel em SC (7,9%) e no PR (7,4%) é um terço do gaúcho (22,4%), e a margem acompanha a maturidade da rede: EBITDA LTM de 12,6% no RS contra 11,2% em SC e 9,2% no PR. O adensamento de SC e PR é a frente de crescimento mais próxima.')]),
  esp(80),
  legenda('Recomendação: quanto vale cada dia de capital de giro'),
  tabela(['Alavanca', 'Base (LTM 2T26)', 'Caixa liberado'], [
    ['+5 dias de prazo com fornecedores', 'compras R$ 4.108 mi ÷ 360 × 5', '≈ R$ 57 mi'],
    ['−1 dia de estoque', 'CMV R$ 3.992 mi ÷ 360', '≈ R$ 11 mi por dia'],
    ['−1 dia de recebíveis', 'receita bruta R$ 6.371 mi ÷ 360', '≈ R$ 18 mi por dia']], [4, 4, 2.2], { al: ['left', 'left', 'right'], size: 18 }),
  esp(120),
  P('Chegar perto do prazo de fornecedores da Pague Menos (63 dias) liberaria em torno de R$ 90 milhões, mais que a sobra de caixa do 9M26 inteiro.'),

  H1('1. Base de dados e premissas'),
  B('Demonstrações consolidadas (IFRS) dos releases de resultados 4T25, 2T25, 2T26 e 3T26: balanço, DRE e DFC. Saldos de 31/12/2023 do release 4T24, para médias e variações de 2024.'),
  B('IFRS 16: arrendamentos no passivo e direito de uso no imobilizado. Isso eleva o endividamento e os gastos de capital.'),
  B('Três recortes. Exercício: 31/12/2025 × 31/12/2024. Trimestre: 30/06/2026 × 30/06/2025, com indicadores de fluxo em 12 meses (LTM 2T26 = 2025 + 1S26 − 1S25) e fluxo de caixa do semestre. Atualização: 30/09/2026 × 30/09/2025, com fluxos de nove meses sem anualizar, porque o release do 3T26 não traz o 9M24 necessário para o LTM do 3T25.'),
  B('Valores em R$ milhões. Ano comercial de 360 dias (270 dias no 9M). Saldos médios = (inicial + final) ÷ 2. EBIT = LAIR + resultado financeiro líquido.'),

  H1('2. Análise gráfica do balanço patrimonial'),
  legenda('Gráfico 1 · Composição do ativo e do passivo + PL (análise vertical dos grandes grupos)'),
  img(`${IMG}/g1_bp.png`, 620, 234),
  leitura('o ativo é cerca de 60% circulante e estável, como se espera de um varejo farmacêutico (estoque e recebíveis). Do lado do financiamento, o patrimônio líquido perde peso em 2025 (de 36,6% para 33,5%) porque o passivo não circulante cresce com captações de longo prazo e novos contratos de aluguel.'),

  H1('3. Análise horizontal e vertical'),
  H2('3.1 Balanço patrimonial · 31/12/2025 × 31/12/2024'),
  tabela(['R$ milhões', 'Dez/24', 'AV', 'Dez/25', 'AV', 'AH'], [
    ['Caixa e aplicações', '213,4', '6,3%', '430,5', '11,2%', '+101,7%'], ['Clientes', '444,7', '13,2%', '574,2', '15,0%', '+29,1%'],
    ['Estoques', '1.151,5', '34,1%', '1.166,6', '30,5%', '+1,3%'], ['Outros AC', '203,0', '6,0%', '126,4', '3,3%', '−37,7%'],
    ['Ativo circulante', '2.012,6', '59,6%', '2.297,6', '60,0%', '+14,2%'], ['Imobilizado + direito de uso', '1.174,1', '34,8%', '1.335,4', '34,9%', '+13,7%'],
    ['Intangível', '96,7', '2,9%', '108,5', '2,8%', '+12,3%'], ['Outros ANC', '94,1', '2,8%', '89,0', '2,3%', '−5,4%'],
    ['Ativo não circulante', '1.364,9', '40,4%', '1.532,9', '40,0%', '+12,3%'], ['Ativo total', '3.377,5', '100,0%', '3.830,5', '100,0%', '+13,4%'],
    ['Fornecedores', '630,8', '18,7%', '725,3', '18,9%', '+15,0%'], ['Empréstimos CP', '162,9', '4,8%', '191,8', '5,0%', '+17,7%'],
    ['Arrendamento CP', '129,8', '3,8%', '136,9', '3,6%', '+5,5%'], ['Outros PC', '261,1', '7,7%', '266,7', '7,0%', '+2,1%'],
    ['Passivo circulante', '1.184,7', '35,1%', '1.320,7', '34,5%', '+11,5%'], ['Empréstimos LP', '391,7', '11,6%', '520,2', '13,6%', '+32,8%'],
    ['Arrendamento LP', '551,3', '16,3%', '657,4', '17,2%', '+19,2%'], ['Outros PNC', '15,0', '0,4%', '50,4', '1,3%', '+236,1%'],
    ['Passivo não circulante', '958,1', '28,4%', '1.228,0', '32,1%', '+28,2%'], ['Patrimônio líquido', '1.234,7', '36,6%', '1.281,9', '33,5%', '+3,8%'],
    ['Passivo + PL', '3.377,5', '100,0%', '3.830,5', '100,0%', '+13,4%']], [3.2, 1.2, 1, 1.2, 1, 1.1], { negrito: [4, 8, 9, 14, 18, 19, 20] }),
  fonte('AV = conta ÷ ativo total × 100. AH = (atual ÷ base × 100) − 100.'),
  leitura('os estoques ficam estáveis (+1,3%) com a receita crescendo 11,5%, um ganho de giro. A pressão veio de clientes (+29,1%). Caixa e aplicações dobram, financiados por fornecedores (+15,0%) e dívida de longo prazo (+32,8%).'),
  H2('3.2 Balanço patrimonial · 30/06/2026 × 30/06/2025'),
  tabela(['R$ milhões', 'Jun/25', 'AV', 'Jun/26', 'AV', 'AH'], [
    ['Caixa e aplicações', '194,1', '5,8%', '295,2', '8,0%', '+52,1%'], ['Clientes', '457,8', '13,8%', '555,9', '15,0%', '+21,4%'],
    ['Estoques', '1.088,3', '32,7%', '1.204,5', '32,5%', '+10,7%'], ['Ativo circulante', '1.914,0', '57,5%', '2.185,3', '58,9%', '+14,2%'],
    ['Ativo não circulante', '1.412,4', '42,5%', '1.524,6', '41,1%', '+7,9%'], ['Ativo total', '3.326,4', '100,0%', '3.709,9', '100,0%', '+11,5%'],
    ['Fornecedores', '600,2', '18,0%', '644,3', '17,4%', '+7,3%'], ['Outros PC', '242,3', '7,3%', '319,4', '8,6%', '+31,8%'],
    ['Passivo circulante', '1.091,1', '32,8%', '1.249,9', '33,7%', '+14,6%'], ['Empréstimos LP', '395,1', '11,9%', '468,1', '12,6%', '+18,5%'],
    ['Passivo não circulante', '1.001,3', '30,1%', '1.143,0', '30,8%', '+14,2%'], ['Patrimônio líquido', '1.234,1', '37,1%', '1.317,0', '35,5%', '+6,7%']],
    [3.2, 1.2, 1, 1.2, 1, 1.1], { negrito: [3, 5, 8, 10, 11] }),
  fonte('Principais contas; a tabela completa está na apresentação (slide 6 da versão de 32 slides).'),
  leitura('em 12 meses, estoques +10,7% (R$ 116 milhões) e clientes +21,4%, com receita +15,7%. Fornecedores sobem só 7,3%, abaixo das compras: o fornecedor passou a financiar uma parte menor do giro.'),
  H2('3.3 Demonstração do resultado'),
  tabela(['R$ milhões', '2024', '2025', 'AV 25', 'AH', '2T25', '2T26', 'AV 2T26', 'AH'], [
    ['Receita bruta', '5.322,9', '5.935,0', '107,7%', '+11,5%', '1.413,7', '1.635,3', '108,4%', '+15,7%'],
    ['Receita líquida', '4.942,5', '5.512,1', '100,0%', '+11,5%', '1.313,7', '1.509,2', '100,0%', '+14,9%'],
    ['(−) CMV', '−3.371,2', '−3.727,6', '−67,6%', '+10,6%', '−880,2', '−1.015,2', '−67,3%', '+15,3%'],
    ['Lucro bruto', '1.571,3', '1.784,5', '32,4%', '+13,6%', '433,5', '493,9', '32,7%', '+13,9%'],
    ['(−) Despesas com vendas', '−1.235,0', '−1.364,8', '−24,8%', '+10,5%', '−329,7', '−377,0', '−25,0%', '+14,3%'],
    ['(−) Despesas gerais e adm.', '−159,9', '−183,5', '−3,3%', '+14,8%', '−48,4', '−57,0', '−3,8%', '+17,8%'],
    ['EBIT', '195,3', '254,7', '4,6%', '+30,4%', '55,1', '66,5', '4,4%', '+20,7%'],
    ['Resultado financeiro', '−82,7', '−109,2', '−2,0%', '+32,0%', '−27,5', '−31,1', '−2,1%', '+13,2%'],
    ['LAIR', '112,6', '145,5', '2,6%', '+29,3%', '27,6', '35,4', '2,3%', '+28,1%'],
    ['(−) IR e CSLL', '−7,1', '−20,9', '−0,4%', '+196,7%', '−2,5', '−5,0', '−0,3%', '+98,3%'],
    ['Lucro líquido', '105,5', '124,6', '2,3%', '+18,1%', '25,1', '30,4', '2,0%', '+21,0%']],
    [2.6, 1, 1, .9, .95, .9, .95, .95, .9], { size: 15.5, negrito: [3, 6, 10] }),
  fonte('AV = conta ÷ receita líquida × 100. Outras receitas e despesas operacionais estão no EBIT e foram omitidas da tabela.'),
  leitura('a margem bruta fica estável perto de 32%. O EBIT cresce acima da receita (+30,4% em 2025; +20,7% no 2T26) pela diluição de despesas. O ponto de atenção é o resultado financeiro, que consome de 42% a 50% do EBIT.'),

  H1('4. Análise do fluxo de caixa'),
  H2('4.1 Fluxo de caixa dos ativos (metodologia de aula)'),
  P('FCO = EBIT + depreciação − impostos. Gastos de capital (GC) = imobilizado final − imobilizado inicial + depreciação. ΔCCL = variação de (AC − PC). FCA = FCO − GC − ΔCCL.'),
  tabela(['R$ milhões', '2024', '2025', '1S25', '1S26', '9M25', '9M26'], [
    ['EBIT', '195,3', '254,7', '108,4', '134,6', '177,7', '217,5'], ['(+) Depreciação e amortização', '210,2', '232,5', '114,9', '124,5', '173,5', '187,6'],
    ['(−) IR e CSLL', '−7,1', '−20,9', '−6,3', '−8,9', '−16,8', '−17,0'], ['= FCO', '398,4', '466,3', '217,0', '250,2', '334,4', '388,1'],
    ['= Gastos de capital (GC)', '316,8', '405,7', '164,5', '122,4', '250,9', '205,6'], ['= ΔCCL', '122,3', '149,0', '−4,9', '−41,5', '193,0', '−74,1'],
    ['FCA = FCO − GC − ΔCCL', '−40,7', '−88,4', '57,4', '169,3', '−109,5', '256,6'],
    ['Variação de caixa e aplicações (no CCL)', '−32,0', '+217,1', '−19,4', '−135,3', '+178,7', '−201,1'],
    ['FCA sem a variação de caixa e aplicações', '−72,7', '128,7', '38,1', '34,0', '69,2', '55,5']],
    [3.4, 1, 1, 1, 1, 1, 1], { negrito: [3, 6, 8], destaque: [8] }),
  fonte('Semestre e nove meses medidos a partir do balanço de dezembro.'),
  leitura('o FCO cresce em todos os recortes. O FCA "cru" oscila porque o ΔCCL inclui o caixa guardado em aplicações (2025) ou resgatado para pagar dívida (1S26 e 9M26). Sem esse efeito, o FCA vai de −R$ 72,7 milhões para +R$ 128,7 milhões em 2025 e fica estável no recorte recente (R$ 55 milhões no 9M26 contra R$ 69 milhões no 9M25).'),
  H2('4.2 Caixa efetivo pela DFC'),
  tabela(['R$ milhões', '2024', '2025', '1S25', '1S26'], [
    ['Caixa operacional (DFC)', '224', '473', '221', '169'], ['Capex: imobilizado + intangível', '158', '160', '69', '62'],
    ['Arrendamentos pagos', '182', '203', '100', '107'], ['Sobra = FCO − capex − arrendamentos', '−115', '110', '53', '1']],
    [4, 1.2, 1.2, 1.2, 1.2], { negrito: [3] }),
  fonte('No IFRS 16 o aluguel sai do caixa operacional e vai para o financiamento; por isso subtraímos os arrendamentos pagos. No 9M26 (DFC): caixa operacional R$ 286,8 mi, capex R$ 106,7 mi e arrendamentos R$ 161,3 mi, sobra de R$ 19 mi.'),
  leitura('em 2025 o caixa operacional dobra e cobre capex e aluguéis com sobra de R$ 110 milhões. Em 2026 a sobra praticamente zera, porque estoques e fornecedores consomem caixa.'),

  H1('5. Painel de indicadores de desempenho'),
  tabela(['Indicador', 'Fórmula', '2024', '2025', '2T25 LTM', '2T26 LTM', '3T25 9M', '3T26 9M'], [
    ['Liquidez corrente', 'AC ÷ PC', '1,70x', '1,74x', '1,75x', '1,75x', '1,91x', '1,68x'],
    ['Liquidez seca', '(AC − estoques) ÷ PC', '0,73x', '0,86x', '0,76x', '0,78x', '0,90x', '0,72x'],
    ['Endividamento total', '(PC + PNC) ÷ AT', '63,4%', '66,5%', '62,9%', '64,5%', '64,7%', '64,4%'],
    ['Dívida / capital próprio', '(PC + PNC) ÷ PL', '1,74x', '1,99x', '1,70x', '1,82x', '1,83x', '1,81x'],
    ['Cobertura de juros', 'EBIT ÷ desp. fin.', '1,35x', '1,49x', '1,45x', '1,59x', '1,46x', '1,69x'],
    ['Lucratividade', 'LL ÷ RL', '2,1%', '2,3%', '2,3%', '2,3%', '2,1%', '2,3%'],
    ['Giro do ativo', 'RL ÷ AT', '1,46x', '1,44x', '1,55x', '1,59x', '1,10x', '1,20x'],
    ['ROA', 'LL ÷ AT', '3,1%', '3,3%', '3,5%', '3,7%', '2,3%', '2,8%'],
    ['ROE', 'LL ÷ PL', '8,5%', '9,7%', '9,5%', '10,5%', '6,5%', '7,9%']],
    [2.2, 2.1, .9, .9, 1, 1, 1, 1], { size: 16, al: ['left', 'left', 'right', 'right', 'right', 'right', 'right', 'right'] }),
  fonte('Balanço no fim de cada período. Fluxos: exercício; LTM no 2T; nove meses sem anualizar no 3T (giro, ROA e ROE do 9M não são comparáveis com os anuais).'),
  B([t('Liquidez. ', { bold: true }), t('Corrente estável perto de 1,75x até junho de 2026; a seca sobe em 2025 (0,73 → 0,86) porque o ativo circulante cresceu com clientes e aplicações. Em setembro de 2026 ambas caem (1,68x e 0,72x) porque R$ 162,7 milhões de caixa e aplicações pagaram dívida de longo prazo. Liquidez seca abaixo de 1 é normal no varejo farmacêutico.')]),
  B([t('Endividamento. ', { bold: true }), t('Cerca de 64% a 66% do ativo, incluindo perto de R$ 794 milhões de arrendamentos (2025). A dívida sobre o capital próprio sobe em 2025 (1,99x) e recua em 2026, e a cobertura de juros melhora em todos os recortes (1,35x → 1,69x).')]),
  B([t('Rentabilidade. ', { bold: true }), t('Margem líquida estreita (2,1% a 2,3%), compensada pelo giro do ativo. O ROE melhora em todos os recortes: 8,5% → 9,7% (ano), 9,5% → 10,5% (LTM) e 6,5% → 7,9% (9M).')]),

  H1('6. Análise do capital de giro'),
  H2('6.1 Prazos médios, ciclo operacional e ciclo financeiro'),
  legenda('Gráfico 2 · Prazos médios e ciclo financeiro (CF), cálculo do grupo'),
  img(`${IMG}/g2_prazos.png`, 620, 234),
  tabela(['Dias', '2024', '2025', '2T25 LTM', '2T26 LTM', '9M25', '9M26'], [
    ['PMRE = estoque médio ÷ CMV × 360', '114,8', '111,9', '109,8', '103,4', '115,7', '107,4'],
    ['PMRV = clientes médios ÷ receita bruta × 360', '30,3', '30,9', '27,4', '28,6', '29,5', '31,9'],
    ['PMPC = fornecedores médios ÷ compras × 360', '67,0', '65,2', '58,9', '54,5', '64,1', '60,7'],
    ['Ciclo operacional = PMRE + PMRV', '145,2', '142,8', '137,2', '132,0', '145,2', '139,2'],
    ['Ciclo financeiro = CO − PMPC', '78,2', '77,6', '78,3', '77,5', '81,1', '78,6']],
    [3.8, .9, .9, 1, 1, .9, .9], { negrito: [4], size: 16.5 }),
  fonte('Compras = CMV + estoque final − estoque inicial. No 9M a base é 270 dias. A companhia divulga prazos da controladora por saldo final (ciclo de caixa de 72 dias no 3T26), por isso os níveis diferem; a direção é a mesma.'),
  leitura('o estoque é o maior prazo do ciclo e vem caindo em todos os recortes (−3 dias em 2025, −6 no 2T26, −8 no 9M26). O ciclo financeiro, porém, quase não muda (cerca de 78 dias), porque o prazo de fornecedores encurta junto e os recebíveis alongam: o ganho de estoque está sendo devolvido ao fornecedor.'),
  H2('6.2 Necessidade de capital de giro (NCG) e capital de giro (CDG)'),
  legenda('Gráfico 3 · NCG × CDG e saldo de tesouraria (T = CDG − NCG), R$ milhões'),
  img(`${IMG}/g3_ncg.png`, 620, 227),
  tabela(['R$ milhões', 'Dez/24', 'Jun/25', 'Set/25', 'Dez/25', 'Jun/26', 'Set/26'], [
    ['ACO = AC − (caixa + aplicações + instrumentos)', '1.779,5', '1.720,0', '1.753,5', '1.867,1', '1.890,1', '1.998,2'],
    ['PCO = PC − (empréstimos + arrendamentos + dividendos)', '878,0', '817,9', '859,2', '962,7', '915,4', '1.002,5'],
    ['NCG = ACO − PCO', '901,5', '902,0', '894,3', '904,4', '974,7', '995,7'],
    ['CDG = (PL + PNC) − ANC', '827,9', '823,0', '1.020,9', '976,9', '935,4', '902,8'],
    ['Saldo de tesouraria T = CDG − NCG', '−73,6', '−79,1', '+126,6', '+72,5', '−39,3', '−92,9'],
    ['Situação (modelo Fleuriet)', 'Insatisfatória', 'Insatisfatória', 'Sólida', 'Sólida', 'Insatisfatória', 'Insatisfatória']],
    [3.6, 1, 1, 1, 1, 1, 1], { negrito: [2, 3, 4], size: 15.5 }),
  esp(80),
  leitura('em 2025 a NCG fica estável (R$ 904 milhões) com vendas +11,5% e o CDG passa a cobri-la. Em setembro de 2026 a NCG sobe R$ 101 milhões em 12 meses (estoques +R$ 139 milhões; clientes +R$ 101 milhões) e o CDG cai R$ 118 milhões com a amortização da dívida de longo prazo: o saldo de tesouraria vira de +R$ 126,6 milhões para −R$ 92,9 milhões.'),
  H2('6.3 O que moveu a NCG'),
  tabela(['Variação da conta (R$ milhões)', 'Dez/25 × Dez/24', 'Jun/26 × Jun/25'], [
    ['Clientes', '+129,5', '+98,1'], ['Estoques', '+15,0', '+116,1'], ['Outros ACO', '−56,9', '−44,2'], ['Fornecedores', '−94,5', '−44,1'],
    ['Salários', '−0,6', '−10,3'], ['Impostos a pagar', '−7,9', '−46,4'], ['Outros PCO', '+18,3', '+3,4'], ['= Δ NCG', '+2,9', '+72,6']],
    [4, 2, 2], { negrito: [7] }),
  fonte('Sinal positivo consome caixa (eleva a NCG); negativo libera caixa.'),
  leitura('a hipótese da Entrega 1, de que o estoque pressiona a NCG, é parcialmente confirmada. Em 2025 o estoque foi quase neutro e a pressão veio de clientes; em 12 meses até junho de 2026 o estoque é o maior consumo (+R$ 116 milhões), mas por volume de vendas: o prazo de estoque caiu.'),

  H1('7. Comparação com as concorrentes'),
  legenda('Gráfico 4 · Prazos divulgados pelas companhias no 3T26 (dias)'),
  img(`${IMG}/g4_bench.png`, 620, 207),
  tabela(['Empresa · período', 'Estoques', 'Recebíveis', 'Fornecedores', 'Ciclo de caixa', 'Δ a/a'], [
    ['Panvel · 4T25', '86', '30', '55', '61', '−9'], ['RD Saúde · 4T25', '102,0', '29,4', '73,8', '57,6', '−2,8'], ['Pague Menos · 4T25', '103', '32', '74', '62', '+1'],
    ['Panvel · 3T26', '97', '30', '55', '72', '+2'], ['RD Saúde · 3T26', '102,4', '27,6', '75,8', '54,2', '−2,4'], ['Pague Menos · 3T26', '103', '32', '63', '72', '+4']],
    [2.6, 1, 1, 1.1, 1.2, .8], { destaque: [0, 3] }),
  fonte('Fonte: releases 4T25 e 3T26 de cada companhia. As metodologias diferem (Panvel: controladora; RD e Pague Menos: com ajustes de antecipação e AVP); compare direção e ordem de grandeza.'),
  leitura('o estoque não é a desvantagem da Panvel: ela tem o menor prazo de estoque dos três. O que alonga o ciclo é pagar o fornecedor de 8 a 25 dias antes que os pares, um reflexo de menor escala de compra.'),

  H1('8. Respostas às perguntas centrais'),
  tabela(['Pergunta', 'Resposta'], [
    ['Como evoluiu a estrutura financeira de curto prazo?', 'Liquidez corrente perto de 1,7x e seca em alta até jun/26 (0,73 → 0,86 em 2025). Em set/26 caem (1,68x; 0,72x) porque o caixa foi usado para amortizar dívida.'],
    ['Qual o impacto dos estoques sobre a NCG?', 'Neutro em 2025 (+R$ 15 mi). Principal pressão em jun/26 (+R$ 116 mi) e set/26 (+R$ 139 mi), por volume de vendas: o prazo de estoque caiu.'],
    ['O ciclo financeiro é explicado por estoques, recebíveis ou fornecedores?', 'Em nível, por estoques (103 a 116 dias, ~78% do ciclo operacional). Na variação e contra os pares, por fornecedores: o prazo encurtou e é 8 a 25 dias menor.'],
    ['A empresa gera caixa para sustentar operação e expansão?', 'Sim em 2025 (caixa operacional de R$ 473 mi; sobra de R$ 110 mi após capex e aluguéis). No 9M26 a sobra caiu para R$ 19 mi.'],
    ['O CDG é suficiente para financiar a NCG?', 'Em dez/25 sim (T = +R$ 72 mi). Em jun/26 e set/26 não (T de −R$ 39 mi e −R$ 93 mi).']],
    [3.2, 6.4], { al: ['left', 'left'], size: 17.5 }),

  H1('9. Conclusões e recomendação'),
  caixa('Recomendação de melhoria', [
    [t('Negociar prazo com fornecedores. ', { bold: true }), t('Cada 5 dias de prazo liberam cerca de R$ 57 milhões de caixa (compras LTM de R$ 4.108 milhões ÷ 360 × 5). Chegar aos 63 dias da Pague Menos liberaria em torno de R$ 90 milhões e levaria o saldo de tesouraria de set/26 (−R$ 92,9 milhões) para perto de zero.')],
    [t('Manter a disciplina de estoque. ', { bold: true }), t('O prazo de estoque caiu em todos os recortes; o desafio é segurar o ganho no pico de junho e com as lojas novas.')],
    [t('Acompanhar recebíveis. ', { bold: true }), t('Clientes cresceram 29% em 2025, acima das vendas: monitorar mix (GLP-1, convênios) e antecipações.')],
  ], ORANGE, 'FDF3EC'),
  esp(160),
  P('A hipótese de que o estoque pressiona a NCG vale no recorte recente, mas a comparação setorial mostra que a alavanca mais barata é o prazo de fornecedor. Cada dia a menos de estoque vale cerca de R$ 11 milhões; cada dia a menos de recebíveis, cerca de R$ 18 milhões.'),

  H1('10. Diagnóstico de lojas: onde a Panvel deve crescer'),
  P('Esta parte complementa a análise financeira pelo lado da expansão: onde abrir as próximas lojas e por quê. Bases: lojas ativas no CNES (abril de 2026), setores do Censo 2022 (IBGE) e releases do 3T26 da Panvel, da RD Saúde e da Pague Menos. Não há dado de venda por loja; a renda do responsável pelo domicílio é a aproximação do ticket.'),
  H2('10.1 A resposta: três frentes'),
  B([t('Desenvolver SC e PR. ', { bold: true }), t('Market share de 7,9% em SC e 7,4% no PR, contra 22,4% no RS. Marca e logística já estão lá.')]),
  B([t('Crescer em São Paulo com seletividade. ', { bold: true }), t('17 lojas hoje e 1,94 milhão de pessoas no perfil sem Panvel a até 1 km; escolher pontos com pouca Raia.')]),
  B([t('Avaliar nova UF. ', { bold: true }), t('Rio, Niterói e Belo Horizonte têm muito público, mas ficam a mais de 340 km da loja Panvel mais próxima.')]),
  legenda('Mapa · Lojas Panvel (laranja) e pontos com mais público no perfil sem Panvel (círculos)'),
  img(MAPA, 330, 368),
  fonte('CNES abr./2026 e Censo 2022. Círculos azuis: RS/SC/PR; verdes: SP; cinza: RJ/MG/ES.'),
  H2('10.2 O critério: renda alta e idosos'),
  P('Nos estados onde a Panvel é forte, ela já está a até 1 km de 46% dos moradores com renda alta e muitos idosos, e de só 2,4% no extremo oposto. O padrão vira critério de busca: renda do responsável de pelo menos R$ 5.760, ao menos 24,6% de moradores com 60 anos ou mais e 9.538 moradores a 1 km (medianas e quartil das lojas atuais).'),
  tabela(['Moradores a até 1 km de uma Panvel (RS, SC e PR)', 'Poucos idosos', 'Médio', 'Muitos idosos'], [
    ['Renda alta', '13,0%', '26,1%', '45,7%'], ['Renda média', '2,2%', '5,5%', '11,6%'], ['Renda baixa', '2,4%', '3,9%', '5,9%']], [3.6, 1.4, 1.4, 1.4]),
  fonte('Terços da população por renda do responsável e por parcela de 60+. Os releases confirmam: ticket médio de R$ 101,15 (Pague Menos: R$ 97,39), R$ 837 mil por loja por mês e ROIC das safras de 34,3% (2023), 24,3% (2024) e 13,1% (2025).'),
  H2('10.3 Por que adensar SC e PR'),
  img(`${IMG}/g5_ebitda.png`, 600, 187),
  B([t('Porto Alegre mostra o teto. ', { bold: true }), t('Só 4% do público no perfil fica sem Panvel a 1 km. Em Curitiba, 22% (46.762 pessoas); em Joinville, 49%.')]),
  B([t('A Raia tem mais lojas. ', { bold: true }), t('PR: 217 da Raia contra 130 da Panvel; SC: 121 contra 105. No RS, 425 da Panvel contra 140.')]),
  B([t('Abrir perto custa menos. ', { bold: true }), t('Os pontos de Curitiba, Florianópolis e Maringá ficam a 1 ou 2 km de lojas atuais. No 3T26 a Panvel abriu 5 lojas no PR e 2 em SC.')]),
  B([t('Rede madura e densa dá mais margem. ', { bold: true }), t('EBITDA LTM de 12,6% no RS (83,7% das lojas maduras), 11,2% em SC, 9,2% no PR e 6,2% em SP (47,1% maduras). Lojas maduras: ROIC de 60,1%.')]),
  fonte('Share (IQVIA), lojas, EBITDA LTM e maturidade por UF: release e apresentação de resultados do 3T26 da Panvel.'),
  H2('10.4 Interior do Sul, São Paulo e última milha'),
  P('No interior do Sul a Raia chegou primeiro: das 19 cidades médias (50 a 200 mil habitantes) sem Panvel no CNES, 18 já têm Raia. No RS a Panvel está nas 33 cidades médias; o espaço fica em SC (14 de 24 com Panvel) e no PR (18 de 27). As melhores candidatas por renda, idosos e crescimento são Imbituba, São Francisco do Sul, Rio do Sul, Marechal Cândido Rondon e Navegantes; cada cidade deve ser conferida no localizador da rede antes de decidir, porque o CNES não registra todas as lojas.'),
  tabela(['Ponto candidato em SP', 'Público no perfil (1 km)', 'Renda média', '60+', 'Raia + Pague Menos', 'Panvel mais próxima'], [
    ['São Paulo – Santana', '35.085', 'R$ 9.303', '29,1%', '4', '5,7 km'], ['São Paulo – Pompeia', '32.084', 'R$ 11.424', '25,4%', '8', '1,8 km'],
    ['São Paulo – Mirandópolis', '29.465', 'R$ 8.843', '28,7%', '5', '1,7 km'], ['Santos – Gonzaga', '40.850', 'R$ 7.729', '31,8%', '13', '48,6 km']],
    [2.6, 1.5, 1.2, .8, 1.3, 1.3], { size: 16.5 }),
  esp(120),
  tabela(['Alta renda a até 1,5 km', 'Moradores de alta renda', 'Panvel', 'Raia', 'Lojas Panvel × Raia'], [
    ['Porto Alegre', '132.075', '97%', '94%', '129 × 46'], ['Curitiba', '176.662', '86%', '94%', '44 × 62'], ['Florianópolis', '53.171', '88%', '83%', '28 × 22'],
    ['Joinville', '61.335', '50%', '89%', '5 × 14'], ['Londrina', '55.220', '80%', '88%', '14 × 20'], ['São Paulo', '1.143.712', '41%', '100%', '12 × 482']],
    [2.2, 1.8, 1, 1, 1.6]),
  fonte('Alta renda: os 10% mais ricos de cada cidade, pelos setores censitários. Raio em linha reta.'),
  leitura('em Porto Alegre e Florianópolis a Panvel cobre a alta renda melhor que a Raia; em Curitiba, Joinville e São Paulo ficam buracos que a Raia já cobre, justamente onde o adensamento é recomendado.'),
  H2('10.5 Sequência recomendada'),
  tabela(['Etapa', 'Onde', 'Como'], [
    ['1', 'SC e PR', 'Adensar Curitiba, Florianópolis, Maringá e Joinville; depois, cidades médias de SC já conferidas.'],
    ['2', 'São Paulo', 'Pontos perto das 17 lojas, com pouca Raia; testar Santos.'],
    ['3', 'RJ e MG', 'Estudo de entrada: exige logística nova (a mais de 340 km).']], [.7, 1.6, 7.3], { al: ['center', 'left', 'left'], size: 18 }),
  esp(120),
  P('A Raia é a concorrente que importa: 3.770 lojas, meta de 330 a 350 aberturas por ano e mais lojas que a Panvel em SC e no PR. A Pague Menos tem share de 1,1% no Sul e não disputa a região. A expansão se conecta à análise financeira: abrir lojas consome capital de giro e capex justamente quando a sobra de caixa caiu, o que reforça a recomendação de alongar o prazo com fornecedores antes de acelerar.'),

  H1('11. Limitações'),
  B('Dados dos releases de resultados, não das notas explicativas completas.'),
  B('Os prazos divulgados pela companhia usam a controladora e saldo final; os do grupo usam o consolidado e saldos médios.'),
  B('O IFRS 16 eleva o endividamento e os gastos de capital; o 2T tem sazonalidade de estoques; no 3T26 os fluxos são de nove meses, sem anualizar.'),
  B('O CNES tem 88% das lojas da Panvel (597 de 677): 94% no RS, 81% em SC, 78% no PR e 71% em SP. Há lojas cadastradas com outro tipo (em Balneário Camboriú, o único registro da Panvel é um centro de vacinação). Toda cidade candidata deve ser conferida antes de decidir.'),
  B('Sem venda, ticket e margem por loja: o diagnóstico de localização indica onde procurar, e a decisão final depende dos dados internos e da visita ao ponto.'),

  H1('Fontes'),
  B('Dimed S.A. (Panvel): releases de resultados 4T24, 2T25, 4T25, 2T26 e 3T26; apresentação de resultados do 3T26.'),
  B('RD Saúde e Pague Menos: releases de resultados 4T25, 2T26 e 3T26.'),
  B('IBGE: Censo Demográfico 2022 (setores censitários) e 2010; PIB dos Municípios 2021.'),
  B('Ministério da Saúde: Cadastro Nacional de Estabelecimentos de Saúde (CNES), competência abril de 2026, via geobr (IPEA).'),
  B('Market share: IQVIA, conforme os releases das companhias.'),
];

const doc = new Document({
  creator: 'Grupo 5', title: 'Relatório ao Executivo · Panvel · Entrega 2',
  styles: {
    default: { document: { run: { font: FONT, size: 21, color: TEXT } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: 30, bold: true, color: NAVY }, paragraph: { spacing: { before: 360, after: 160 }, keepNext: true, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: 24, bold: true, color: NAVY }, paragraph: { spacing: { before: 240, after: 120 }, keepNext: true, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [{ reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 360, hanging: 240 } }, run: { color: ORANGE } } }] }] },
  sections: [
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: capa },
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 }, pageNumbers: { start: 2 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 4 } },
        children: [t('Panvel · Relatório ao Executivo · Entrega 2 · Grupo 5', { size: 16, color: GRAY })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
        children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: GRAY })] })] }) },
      children: corpo,
    },
  ],
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(SAIDA, b); console.log('ok', SAIDA); });
