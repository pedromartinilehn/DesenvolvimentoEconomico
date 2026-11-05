/* ═══════════════════════════════════════════════════════════════════════
   Atlas Porto Alegre · lojas Panvel
   Os 94 bairros e os 2.744 setores do Censo 2022, com as lojas Panvel ativas
   no CNES e o entorno de cada uma. Dados: dados/poa.js, gerado por
   extracao/4_monta.py. Nada aqui estima valor: o que a fonte não publica
   aparece em branco, e o que é cálculo do Atlas leva o selo.
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';

/* ─────────────────────────────────────────────────── 1. utilidades ── */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const nf = (d) => new Intl.NumberFormat('pt-BR', {minimumFractionDigits: d, maximumFractionDigits: d});
const NF = [0, 1, 2, 3].map(nf);
const ord = n => `${NF[0].format(n)}º`;

function fmt(v, f) {
  if (v == null || Number.isNaN(v)) return '—';
  switch (f) {
    case 'int': return NF[0].format(Math.round(v));
    case 'dec1': return NF[1].format(v);
    case 'dec2': return NF[2].format(v);
    case 'dec3': return NF[3].format(v);
    case 'pct1': return NF[1].format(v) + '%';
    case 'pct2': return NF[2].format(v) + '%';
    case 'brl': return 'R$ ' + NF[2].format(v);
    case 'brl0': return 'R$ ' + NF[0].format(Math.round(v));
    case 'm': return v >= 1000 ? (v % 1000 === 0 ? NF[0] : NF[2]).format(v / 1000) + ' km' : NF[0].format(Math.round(v)) + ' m';
    default: return NF[1].format(v);
  }
}
/* unidade que vai depois do número (as que o próprio formato já mostram ficam de fora) */
const unid = c => (/^pct|^brl/.test(c.fmt) || c.u === 'índice') ? '' : c.u;

let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3200);
}
function abreModal(id) { $('#' + id).classList.add('show'); }
function fechaModais() { $$('.modal').forEach(m => m.classList.remove('show')); }

function baixaCSV(linhas, nome) {
  const cel = c => typeof c === 'number' ? String(c).replace('.', ',') : String(c ?? '');
  const csv = '﻿' + linhas.map(l => l.map(c => `"${cel(c).replace(/"/g, '""')}"`).join(';')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
  a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Arquivo exportado.');
}

/* distância em linha reta (haversine), a mesma fórmula de extracao/4_monta.py */
const RAIO_TERRA_M = 6371008.8;
function distM(x1, y1, x2, y2) {
  const r = Math.PI / 180, p1 = y1 * r, p2 = y2 * r;
  const h = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin((x2 - x1) * r / 2) ** 2;
  return 2 * RAIO_TERRA_M * Math.asin(Math.sqrt(h));
}

/* ─────────────────────────────────────────────── 2. dados e decodificação ── */
const P = window.ATLAS_POA;
const CATALOGO = P ? P.catalogo : [];
const IND = Object.fromEntries(CATALOGO.map(c => [c.id, c]));
const FONTES = P ? P.fontes : {};
const COMP = P ? P.comp : {};

/* inteiros de tamanho variável (5 bits por caractere, a partir do '?'), em zigue-zague.
   Aritmética comum em vez de operações de bits: códigos de setor passam de 2^31. */
function decNums(s) {
  const out = []; let i = 0; const n = s.length;
  while (i < n) {
    let r = 0, m = 1, b;
    do { b = s.charCodeAt(i++) - 63; r += (b & 31) * m; m *= 32; } while (b >= 32);
    out.push(r % 2 ? -(r + 1) / 2 : r / 2);
  }
  return out;
}
function decIds(s) { let a = 0; return decNums(s).map(d => (a += d)); }
function decCol(s, esc_, n) {
  const v = decNums(s);
  if (v.length !== n) throw new Error('coluna com tamanho inesperado');
  return v.map(x => x === 0 ? null : (x > 0 ? (x - 1) / esc_ : x / esc_));
}
function decPts(s, prec) {           // [[x, y], ...] (longitude, latitude)
  const v = decNums(s), out = []; let x = 0, y = 0;
  for (let i = 0; i < v.length; i += 2) { x += v[i]; y += v[i + 1]; out.push([x / prec, y / prec]); }
  return out;
}
function decArcos(arcos, prec) {     // cada arco: [[lat, lng], ...]
  return arcos.map(s => decPts(s, prec).map(([x, y]) => [y, x]));
}
function decFeicao(str, arcos) {
  let ant = 0;
  return str.split(';').map(p => p.split(',').map(r => {
    const pts = [];
    for (const d of decNums(r)) {
      ant += d;
      const a = Math.floor(ant / 2), rev = ant % 2;
      const seq = rev ? arcos[a].slice().reverse() : arcos[a];
      if (pts.length) for (let k = 1; k < seq.length; k++) pts.push(seq[k]);
      else for (const q of seq) pts.push(q);
    }
    return pts;
  }));
}
function limites(polis) {
  let s = 90, w = 180, n = -90, e = -180;
  for (const p of polis) for (const q of p[0]) {
    if (q[0] < s) s = q[0]; if (q[0] > n) n = q[0]; if (q[1] < w) w = q[1]; if (q[1] > e) e = q[1];
  }
  return L.latLngBounds([s, w], [n, e]);
}

function preparaNivel(B, nv) {
  const n = B.n, ids = decIds(B.ids);
  if (ids.length !== n) throw new Error('códigos com tamanho inesperado');
  const arcos = decArcos(B.arcos, P.prec);
  const cache = {}, fx = {};
  const o = {
    nv, n, ids, pos: new Map(ids.map((c, i) => [c, i])), raw: B,
    geo: B.g.map(g => decFeicao(g, arcos)),
    col(id) {
      if (!(id in cache)) { const s = B.c[id]; cache[id] = s == null ? null : decCol(s, IND[id].esc, n); }
      return cache[id];
    },
    faixa(id) {                // intervalo do sigilo: {índice: [mín, máx]}
      if (!(id in fx)) {
        const t = B.fx[id]; const m = new Map();
        if (t) {
          const js = decIds(t[0]), lo = decCol(t[1], IND[id].esc, js.length), hi = decCol(t[2], IND[id].esc, js.length);
          js.forEach((j, k) => m.set(j, [lo[k], hi[k]]));
        }
        fx[id] = m;
      }
      return fx[id];
    },
  };
  o.bounds = o.geo.map(limites);
  return o;
}

function preparaPontos(Q, campos) {
  const xy = decPts(Q.xy, P.prec_pts);
  if (xy.length !== Q.n) throw new Error('pontos com tamanho inesperado');
  return xy.map(([x, y], k) => {
    const p = {k, x, y, s: Q.s[k]};
    campos.forEach(c => { p[c] = Q[c][k]; });
    return p;
  });
}

function prepara() {
  const set = preparaNivel(P.set, 'set'), bai = preparaNivel(P.bai, 'bai');
  bai.nomes = P.bai.nomes;
  bai.atip = new Map((P.bai.atip || []).map(([j, setor, media, parte, resto]) => [j, {setor, media, parte, resto}]));
  set.b = P.set.b;
  const rep = decPts(P.set.rep, P.prec_pts);
  set.rx = rep.map(p => p[0]); set.ry = rep.map(p => p[1]);
  set.atip = new Map();
  bai.setores = Array.from({length: bai.n}, () => []);
  set.b.forEach((j, i) => bai.setores[j].push(i));
  // contagens por setor (mínimo e máximo de numerador e denominador) e totais para o entorno
  set.cont = {};
  for (const [k, cols] of Object.entries(P.set.cont)) set.cont[k] = cols.map(c => decCol(c, 1, set.n).map(x => x ?? 0));
  set.base = {};
  for (const [k, c] of Object.entries(P.set.base)) set.base[k] = decCol(c, 1, set.n).map(x => x ?? 0);
  const mun = {geo: P.mun.g.map(g => decFeicao(g, decArcos(P.mun.arcos, P.prec)))};
  const lojas = preparaPontos(P.pontos.lojas, ['cnes', 'cnpj', 'fantasia', 'end', 'bairro_cnes', 'cep', 'tipo', 'classe',
    'incerteza_m', 'dist_cnes_geocodebr_m', 'atualizado', 'mesmo_end', 'perto_50m']);
  lojas.forEach((l, k) => { l.b = P.pontos.lojas.b[k]; l.nome = 'Panvel · ' + l.end; });
  bai.lojas = Array.from({length: bai.n}, () => []);
  lojas.forEach(l => bai.lojas[l.b].push(l.k));
  const saude = preparaPontos(P.pontos.saude, ['cnes', 'nome', 'tipo', 'restrito']);
  const escolas = preparaPontos(P.pontos.escolas, ['inep', 'nome', 'tipo']);
  // loja mais próxima de cada setor (em empate, a primeira da lista)
  set.perto = new Array(set.n); set.dperto = new Array(set.n);
  for (let i = 0; i < set.n; i++) {
    let best = -1, bd = Infinity;
    for (const l of lojas) { const d = distM(set.rx[i], set.ry[i], l.x, l.y); if (d < bd) { bd = d; best = l.k; } }
    set.perto[i] = best; set.dperto[i] = bd;
  }
  // a outra loja mais próxima de cada loja
  lojas.forEach(a => {
    let bd = Infinity, bk = -1;
    lojas.forEach(b => { if (b.k !== a.k) { const d = distM(a.x, a.y, b.x, b.y); if (d < bd) { bd = d; bk = b.k; } } });
    a.vizinha = bk; a.dviz = bd;
  });
  return {set, bai, mun, lojas, saude, escolas};
}

/* ─────────────────────────────────────────────────────────── 3. estado ── */
const RAIOS = [500, 1000, 2000];
const S = {nivel: 'bai', ind: 'renda_resp', sel: null, loja: null, raio: 1000, foco: null, fundo: false,
           cam: {lojas: true, raios: false, saude: false, escolas: false}, destaque: 'raio'};
let D = null;

function lerHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  return {n: h.get('n') === 'set' ? 'set' : 'bai', i: IND[h.get('i')] ? h.get('i') : null,
          u: h.get('u') ? Number(h.get('u')) : null, l: h.get('l') || null,
          r: RAIOS.includes(Number(h.get('r'))) ? Number(h.get('r')) : null};
}
function gravaHash() {
  const h = new URLSearchParams();
  if (S.nivel !== 'bai') h.set('n', S.nivel);
  h.set('i', S.ind);
  if (S.sel) h.set('u', S.sel.id);
  if (S.loja != null) { h.set('l', D.lojas[S.loja].cnes); if (S.raio !== 1000) h.set('r', S.raio); }
  history.replaceState(null, '', '#' + h.toString());
}

/* ─────────────────────────────────────────────────── 4. cores e classes ── */
const RAMPAS = {
  seq: ['#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'],
  alerta: ['#ef8a5e', '#e2663a', '#c24e21', '#963a14', '#66260a'],
  neutra: ['#a99ee3', '#8b7ed8', '#6a5bc6', '#4a3aa7', '#2b2068'],
};
const DIV = {quebras: [90, 97, 103, 110, 120], cores: ['#a8322d', '#e2716c', '#bdb8ad', '#6da7ec', '#256abf', '#0d366b']};
const SEM_DADO = '#CFC9BC';     // a fonte não publica valor
const COR_LOJA = '#15212E', COR_LOJA_INC = '#5c656d', COR_SAUDE = '#0f7a54', COR_ESCOLA = '#6a5bc6';

function classes(vals, rampa) {
  if (rampa === 'div') return {quebras: DIV.quebras, cores: DIV.cores};
  const v = vals.filter(x => x != null).sort((a, b) => a - b);
  const cores = RAMPAS[rampa] || RAMPAS.seq;
  if (!v.length) return {quebras: [], cores: [cores[2]]};
  const uniq = [...new Set(v)];
  let q;
  if (uniq.length <= 5) q = uniq.slice(0, -1);
  else q = [...new Set([0.2, 0.4, 0.6, 0.8].map(p => v[Math.min(v.length - 1, Math.floor(p * v.length))]))];
  q = q.filter((x, i) => i === 0 || x > q[i - 1]);
  if (q.length && q[q.length - 1] >= v[v.length - 1]) q.pop();
  const k = q.length + 1;
  const pick = k >= 5 ? cores : (k === 1 ? [cores[2]] : cores.filter((_, i) => [[0, 4], [0, 2, 4], [0, 1, 3, 4]][k - 2].includes(i)));
  return {quebras: q, cores: pick};
}
function cor(v, C) {
  if (v == null) return SEM_DADO;
  let i = 0; while (i < C.quebras.length && v > C.quebras[i]) i++;
  return C.cores[Math.min(i, C.cores.length - 1)];
}

/* ─────────────────────────────────────────────────────────── 5. mapa ── */
let map, rend, rendP, rendR, camadaBai, camadaSet = null, camadaDivisas = null, camadaMun, fundo;
let camadaLojas, camadaSaude, camadaEscolas, camadaRaios, circuloLoja = null;
let classeAtual = null;

function iniciaMapa() {
  map = L.map('map', {zoomControl: false, preferCanvas: true, minZoom: 10, maxZoom: 18, zoomSnap: 0.25,
                      attributionControl: true});
  L.control.zoom({position: 'topright'}).addTo(map);
  map.attributionControl.setPrefix(false);
  map.attributionControl.addAttribution('Malhas: IBGE, setores do Censo 2022 (geobr/IPEA) · Lojas e saúde: CNES abr./2026');
  rend = L.canvas({padding: 0.4, tolerance: 2});
  // os círculos dos raios ficam numa camada que não recebe clique (o clique passa para os
  // bairros e setores); os pontos são SVG, que só captura o clique em cima do ponto
  const pr = map.createPane('raios'); pr.style.zIndex = 430; pr.style.pointerEvents = 'none';
  map.createPane('pontos').style.zIndex = 450;
  rendP = L.svg({pane: 'pontos', padding: 0.4});
  rendR = L.canvas({pane: 'raios', padding: 0.4});
  fundo = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {maxZoom: 19, attribution: '© colaboradores do OpenStreetMap'});

  camadaBai = L.featureGroup();
  D.bai.geo.forEach((g, i) => {
    const pol = L.polygon(g, {renderer: rend, weight: 0.6, color: '#ffffff', fillOpacity: 0.95, fillColor: SEM_DADO});
    pol._i = i; pol._nv = 'bai'; ligaEventos(pol); camadaBai.addLayer(pol);
  });
  camadaBai.addTo(map);
  camadaMun = L.featureGroup(D.mun.geo.map(g => L.polygon(g, {renderer: rend, weight: 1.3, color: '#46505A', fill: false, interactive: false})));
  camadaMun.addTo(map);

  camadaRaios = L.featureGroup(D.lojas.map(l => L.circle([l.y, l.x], {renderer: rendR, radius: 500, color: COR_LOJA, weight: 1,
    opacity: 0.55, dashArray: '3 4', fill: false, interactive: false})));
  camadaSaude = L.featureGroup(D.saude.map(p => {
    const m = L.circleMarker([p.y, p.x], {renderer: rendP, radius: 3.6, color: COR_SAUDE, weight: 1.7, fillColor: '#ffffff', fillOpacity: 1});
    m.on('mouseover', e => mostraDica(`<b>${esc(p.nome)}</b><br><span class="d">${esc(P.pontos.saude.tipos[p.tipo])}${p.restrito ? ' · acesso restrito' : ''} · CNES ${esc(p.cnes)}</span>`, e.originalEvent));
    m.on('mousemove', e => moveDica(e.originalEvent)); m.on('mouseout', escondeDica);
    return m;
  }));
  camadaEscolas = L.featureGroup(D.escolas.map(p => {
    const m = L.circleMarker([p.y, p.x], {renderer: rendP, radius: 3, color: COR_ESCOLA, weight: 1.5, fillColor: '#ffffff', fillOpacity: 1});
    m.on('mouseover', e => mostraDica(`<b>${esc(p.nome)}</b><br><span class="d">escola ${esc(P.pontos.escolas.tipos[p.tipo].toLowerCase())} · INEP ${esc(p.inep)}</span>`, e.originalEvent));
    m.on('mousemove', e => moveDica(e.originalEvent)); m.on('mouseout', escondeDica);
    return m;
  }));
  camadaLojas = L.featureGroup(D.lojas.map(l => {
    const m = L.circleMarker([l.y, l.x], {renderer: rendP, ...estiloLoja(l)});
    m._k = l.k;
    m.on('mouseover', e => { m.setStyle({radius: 8}); mostraDica(dicaLoja(l), e.originalEvent); });
    m.on('mousemove', e => moveDica(e.originalEvent));
    m.on('mouseout', () => { m.setStyle(estiloLoja(l)); escondeDica(); });
    m.on('click', () => selecionaLoja(l.k, false));
    l._m = m;
    return m;
  }));
  map.fitBounds(camadaMun.getBounds(), {padding: [16, 16]});
}
function estiloLoja(l) {
  const sel = S.loja === l.k, inc = l.classe === 'cnes_sem_confirmacao';
  return {radius: sel ? 8.5 : 5.5, color: '#ffffff', weight: sel ? 2.6 : 1.6,
          fillColor: inc ? COR_LOJA_INC : COR_LOJA, fillOpacity: 1};
}
const CLASSE_LOC = {     // [como fica na ficha, explicação, rótulo curto da tabela]
  endereco: ['no número do endereço', 'localizada pelo geocodebr no endereço do CNES (Cadastro de Endereços do Censo 2022)', 'endereço'],
  cnes_no_cep: ['coordenada do CNES, confirmada pelo CEP', 'a coordenada do CNES cai na área do CEP do endereço', 'CNES + CEP'],
  centro_cep: ['no centro do CEP do endereço', 'a coordenada do CNES fica longe do endereço; o ponto é o centro do CEP', 'centro do CEP'],
  cnes_sem_confirmacao: ['coordenada do CNES, sem confirmação', 'o endereço não confirma a coordenada do CNES (CEP muito extenso ou sem localização)', 'sem confirmação'],
};
function textoLoc(l) {
  const c = CLASSE_LOC[l.classe];
  const inc = l.incerteza_m != null ? (l.classe === 'cnes_no_cep' ? ` (área do CEP de até ${fmt(l.incerteza_m, 'm')})` : ` (±${fmt(l.incerteza_m, 'm')})`) : '';
  return c[0] + inc;
}
function dicaLoja(l) {
  return `<b>${esc(l.nome)}</b><br><span class="d">${esc(D.bai.nomes[l.b])} · localização: ${esc(textoLoc(l))}</span>` +
    `<br><span class="d">clique para ver o entorno</span>`;
}

function garanteSetores() {
  if (camadaSet) return;
  camadaSet = L.featureGroup();
  D.set.geo.forEach((g, i) => {
    const pol = L.polygon(g, {renderer: rend, weight: 0.25, color: '#ffffff', fillOpacity: 0.95, fillColor: SEM_DADO});
    pol._i = i; pol._nv = 'set'; ligaEventos(pol); camadaSet.addLayer(pol);
  });
  camadaDivisas = L.featureGroup(D.bai.geo.map((g, i) => {
    const p = L.polygon(g, {renderer: rend, weight: 0.9, color: '#46505A', fill: false, interactive: false, opacity: 0.8});
    p._i = i; return p;
  }));
}
function ligaEventos(pol) {
  pol.on('mouseover', e => { realca(pol, true); dicaUnidade(pol, e.originalEvent); });
  pol.on('mousemove', e => moveDica(e.originalEvent));
  pol.on('mouseout', () => { realca(pol, false); escondeDica(); });
  pol.on('click', () => seleciona(pol._nv, pol._i, false));
}
function realca(pol, on) {
  const sel = S.sel && S.sel.nv === pol._nv && S.sel.i === pol._i;
  if (sel) return;
  if (on) { pol.setStyle({weight: pol._nv === 'set' ? 1.4 : 1.8, color: '#15212E'}); pol.bringToFront(); }
  else { pol.setStyle(estilo(pol)); ordemCamadas(); }
}

/* setores que a loja selecionada destaca: os do raio ou os que a têm como a mais próxima */
let destaqueAtual = null;
function calculaDestaque() {
  destaqueAtual = null;
  if (S.loja == null || S.nivel !== 'set') return;
  const set = new Set();
  if (S.destaque === 'perto') { for (let i = 0; i < D.set.n; i++) if (D.set.perto[i] === S.loja) set.add(i); }
  else entorno(S.loja, S.raio).setores.forEach(i => set.add(i));
  destaqueAtual = set;
}
function estilo(pol) {
  const nv = pol._nv, i = pol._i;
  const sel = S.sel && S.sel.nv === nv && S.sel.i === i;
  const vals = D[nv].col(S.ind);
  let fora = false;
  if (nv === 'set') {
    if (destaqueAtual) fora = !destaqueAtual.has(i);
    else if (S.foco != null) fora = D.set.b[i] !== S.foco;
  }
  return {fillColor: vals ? cor(vals[i], classeAtual) : SEM_DADO,
          fillOpacity: fora ? 0.28 : (S.fundo ? 0.72 : 0.95),
          weight: sel ? 2.6 : (nv === 'set' ? 0.25 : 0.6), color: sel ? '#15212E' : '#ffffff'};
}
function ordemCamadas() {
  if (S.nivel === 'set' && camadaDivisas && map.hasLayer(camadaDivisas)) camadaDivisas.bringToFront();
  if (S.sel) {
    const g = S.sel.nv === 'set' ? camadaSet : camadaBai;
    if (g && map.hasLayer(g)) g.getLayers()[S.sel.i].bringToFront();
  }
  camadaMun.bringToFront();
}

function desenha() {
  const c = IND[S.ind];
  const B = D[S.nivel], vals = B.col(S.ind);
  const idx = [...Array(B.n).keys()];
  classeAtual = vals ? classes(idx.map(i => vals[i]), c.rampa) : null;
  calculaDestaque();
  if (S.nivel === 'bai') {
    if (camadaSet && map.hasLayer(camadaSet)) { map.removeLayer(camadaSet); map.removeLayer(camadaDivisas); }
    if (!map.hasLayer(camadaBai)) camadaBai.addTo(map);
    camadaBai.eachLayer(pol => pol.setStyle(estilo(pol)));
  } else {
    garanteSetores();
    if (map.hasLayer(camadaBai)) map.removeLayer(camadaBai);
    if (!map.hasLayer(camadaSet)) camadaSet.addTo(map);
    camadaSet.eachLayer(pol => pol.setStyle(estilo(pol)));
    if (!map.hasLayer(camadaDivisas)) camadaDivisas.addTo(map);
    camadaDivisas.eachLayer(p => p.setStyle(S.foco != null && p._i === S.foco ? {weight: 2.4, color: '#15212E', opacity: 1}
      : {weight: 0.9, color: '#46505A', opacity: 0.8}));
  }
  ordemCamadas();
  desenhaPontos();
  renderCard(); renderLegenda(vals ? {C: classeAtual, vals: idx.map(i => vals[i])} : null); renderCamadas(); renderPainel(); gravaHash();
}
function desenhaPontos() {
  [[camadaRaios, S.cam.raios], [camadaSaude, S.cam.saude], [camadaEscolas, S.cam.escolas], [camadaLojas, S.cam.lojas]]
    .forEach(([g, on]) => { if (on && !map.hasLayer(g)) g.addTo(map); else if (!on && map.hasLayer(g)) map.removeLayer(g); });
  D.lojas.forEach(l => l._m.setStyle(estiloLoja(l)));
  if (S.loja != null && S.cam.lojas) D.lojas[S.loja]._m.bringToFront();
  if (circuloLoja) { map.removeLayer(circuloLoja); circuloLoja = null; }
  if (S.loja != null) {
    const l = D.lojas[S.loja];
    circuloLoja = L.circle([l.y, l.x], {renderer: rendR, radius: S.raio, color: COR_LOJA, weight: 2, dashArray: '6 5',
      fillColor: COR_LOJA, fillOpacity: 0.04, interactive: false}).addTo(map);
  }
}

/* dica do mapa */
function mostraDica(html, ev) { const t = $('#tip'); t.innerHTML = html; t.hidden = false; moveDica(ev); }
function moveDica(ev) {
  const t = $('#tip'); if (t.hidden || !ev) return;
  const x = ev.clientX + 14, y = ev.clientY + 14, w = t.offsetWidth, h = t.offsetHeight;
  t.style.left = Math.min(x, innerWidth - w - 8) + 'px'; t.style.top = Math.min(y, innerHeight - h - 8) + 'px';
}
function escondeDica() { $('#tip').hidden = true; }
function nomeUnidade(nv, i) { return nv === 'bai' ? D.bai.nomes[i] : `Setor ${D.set.ids[i]}`; }
function dicaUnidade(pol, ev) {
  const c = IND[S.ind], nv = pol._nv, i = pol._i, B = D[nv], vals = B.col(S.ind);
  const titulo = nv === 'bai' ? `<b>${esc(B.nomes[i])}</b>` : `<b>${esc(D.bai.nomes[D.set.b[i]])}</b><br><span class="d">setor ${D.set.ids[i]}</span>`;
  const v = vals ? vals[i] : null, fx = B.faixa(S.ind).get(i);
  const pos = posicao(nv, i);
  const corpo = `<span class="v">${fmt(v, c.fmt)}</span> <span class="d">${esc(unid(c))}</span>` +
    (fx ? `<br><span class="d">entre ${fmt(fx[0], c.fmt)} e ${fmt(fx[1], c.fmt)} (sigilo do IBGE)</span>` : '') +
    (v == null ? `<br><span class="d">${esc(motivoSemValor(c, nv, i))}</span>` : '') +
    (pos ? `<br><span class="d">${ord(pos[0])} maior de ${NF[0].format(pos[1])} ${nv === 'bai' ? 'bairros' : 'setores'}</span>` : '');
  mostraDica(titulo + '<br>' + corpo, ev);
}
function motivoSemValor(c, nv, i) {
  if (c.fonte !== 'CENSO22') return 'Sem valor para esta unidade.';
  if (nv === 'set') {
    const p = D.set.col('pop')[i];
    if (!p) return 'Setor sem moradores no Censo 2022.';
    return 'O IBGE omitiu os dados deste setor (sigilo) ou o indicador não se aplica.';
  }
  return 'Sem valor: o IBGE omitiu os setores deste bairro (sigilo) ou o indicador não se aplica.';
}
const _posCache = new Map();
function posicao(nv, i) {
  const chave = `${nv}|${S.ind}`;
  let m = _posCache.get(chave);
  if (!m) {
    const vals = D[nv].col(S.ind); if (!vals) return null;
    const ord_ = [...Array(D[nv].n).keys()].filter(j => vals[j] != null).sort((a, b) => vals[b] - vals[a]);
    m = {pos: new Map(), n: ord_.length};
    let r = 0, ant = null;
    ord_.forEach((j, k) => { if (vals[j] !== ant) { r = k + 1; ant = vals[j]; } m.pos.set(j, r); });
    _posCache.clear(); _posCache.set(chave, m);
  }
  return m.pos.has(i) ? [m.pos.get(i), m.n] : null;
}

/* ─────────────────────────────────────── 6. cartão, legenda e camadas ── */
/* nome curto da fonte com o ano, sem repetir o ano que o nome já traz ("Censo 2022", "CNES, abr./2026") */
function rotFonte(c, sep = ' · ') {
  const f = FONTES[c.fonte];
  return f ? (f.s.includes(String(c.ano)) ? f.s : `${f.s}${sep}${c.ano}`) : c.fonte;
}
function seloFonte(c) {
  const f = FONTES[c.fonte], calc = !!c.calc;
  const s = rotFonte(c);
  return `<span class="selo ${calc ? 'calc' : ''}" title="${esc(calc ? 'Cálculo do Atlas: ' + c.calc : f.n)}"><span class="dot"></span>${esc(s)}${calc ? ' · cálculo do Atlas' : ''}</span>`;
}
function renderCard() {
  const c = IND[S.ind], el = $('#cardMapa'), B = D[S.nivel], vals = B.col(S.ind);
  const com = vals ? vals.filter(v => v != null).length : 0;
  const meta = [seloFonte(c), `${S.nivel === 'bai' ? 'bairros' : 'setores censitários'} · ${NF[0].format(com)} de ${NF[0].format(B.n)} com dado`];
  if (S.loja != null) meta.push(`entorno de ${esc(D.lojas[S.loja].nome)}`);
  else if (S.nivel === 'set' && S.foco != null) meta.push(`destaque: ${esc(D.bai.nomes[S.foco])}`);
  el.innerHTML = `<h1>${esc(c.n)}${unid(c) ? ` <span class="muted" style="font-weight:400">(${esc(c.u)})</span>` : ''}</h1>
    <div class="meta">${meta.join('<span aria-hidden="true">·</span>')}</div>`;
}
function renderLegenda(L_) {
  const el = $('#legenda'), c = IND[S.ind];
  if (!L_) { el.innerHTML = `<h3>${esc(c.n)}</h3><div class="lin"><span class="sw" style="background:${SEM_DADO}"></span>sem valor neste nível</div>`; return; }
  const {C} = L_;
  const vals = L_.vals.filter(v => v != null);
  const mn = vals.length ? Math.min(...vals) : null, mx = vals.length ? Math.max(...vals) : null;
  const q = C.quebras, linhas = [];
  for (let k = 0; k < C.cores.length; k++) {
    let rot;
    if (q.length === 0) rot = vals.length ? `${fmt(mn, c.fmt)}${mx !== mn ? ' a ' + fmt(mx, c.fmt) : ''}` : '—';
    else if (k === 0) rot = `até ${fmt(q[0], c.fmt)}`;
    else if (k === C.cores.length - 1) rot = `acima de ${fmt(q[q.length - 1], c.fmt)}`;
    else rot = `${fmt(q[k - 1], c.fmt)} a ${fmt(q[k], c.fmt)}`;
    linhas.push(`<div class="lin"><span class="sw" style="background:${C.cores[k]}"></span>${rot}</div>`);
  }
  linhas.push(`<div class="lin"><span class="sw" style="background:${SEM_DADO}"></span>sem dado</div>`);
  const tipo = c.rampa === 'div' ? 'faixas fixas em torno de 100' : `quintis dos ${S.nivel === 'bai' ? 'bairros' : 'setores'}`;
  el.innerHTML = `<h3>${tipo}${unid(c) ? ` <span class="muted" style="font-weight:400">(${esc(c.u)})</span>` : ''}</h3>${linhas.join('')}`;
}
function renderCamadas() {
  const el = $('#camadas'), fechado = el.classList.contains('fechado');
  const n = (k, txt, simb, nota) => `<label><input type="checkbox" data-cam="${k}" ${S.cam[k] ? 'checked' : ''}>
    <span class="simb ${simb}"></span><span>${txt}${nota ? `<small>${nota}</small>` : ''}</span></label>`;
  const inc = D.lojas.filter(l => l.classe === 'cnes_sem_confirmacao').length;
  el.innerHTML = `<h3>Camadas <button type="button" id="camX">${fechado ? 'mostrar' : 'ocultar'}</button></h3>
    ${n('lojas', `Lojas Panvel (${D.lojas.length})`, 'loja', `cinza: posição sem confirmação (${inc})`)}
    ${n('raios', 'Raio de 500 m das lojas', 'raio')}
    ${n('saude', `Unidades de saúde (${D.saude.length})`, 'saude', 'CNES: UBS, hospitais, CAPS, pronto atendimento')}
    ${n('escolas', `Escolas (${D.escolas.length})`, 'escola', 'Censo Escolar 2025, públicas e privadas')}`;
  $$('[data-cam]', el).forEach(x => x.onchange = () => { S.cam[x.dataset.cam] = x.checked; desenhaPontos(); });
  $('#camX').onclick = () => { el.classList.toggle('fechado'); renderCamadas(); };
}

/* ─────────────────────────────────────────────────── 7. seleção ── */
function seleciona(nv, i, zoom) {
  S.loja = null; $('#selLoja').value = '';
  S.sel = {nv, i, id: D[nv].ids[i]};
  if (nv === 'bai') S.foco = i;
  else S.foco = D.set.b[i];
  if (zoom) map.fitBounds(D[nv].bounds[i], {padding: [40, 40], maxZoom: nv === 'set' ? 17 : 15});
  desenha();
  abrePainelMobile();
}
function selecionaLoja(k, zoom) {
  S.loja = k; S.sel = null; S.foco = null;
  const l = D.lojas[k];
  $('#selLoja').value = String(k);
  if (zoom || !map.getBounds().contains([l.y, l.x])) map.setView([l.y, l.x], Math.max(map.getZoom(), S.raio >= 2000 ? 13 : 14));
  desenha();
  abrePainelMobile();
}
function limpaSelecao() {
  S.sel = null; S.loja = null; S.foco = null; $('#selLoja').value = ''; desenha();
}

function escolheNivel(n) {
  if (n === S.nivel) return;
  S.nivel = n;
  $$('#segNivel button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.n === n)));
  if (n === 'bai' && S.sel && S.sel.nv === 'set') { const j = D.set.b[S.sel.i]; S.sel = {nv: 'bai', i: j, id: D.bai.ids[j]}; }
  if (!IND[S.ind].niv.includes(n)) {
    toast(`“${IND[S.ind].n}” só existe por bairro. Mostrando o rendimento médio.`);
    S.ind = 'renda_resp';
  }
  _posCache.clear();
  renderCats(); desenha();
}
function verSetores(j) {
  S.foco = j; S.sel = {nv: 'bai', i: j, id: D.bai.ids[j]};
  if (S.nivel !== 'set') {
    S.nivel = 'set';
    $$('#segNivel button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.n === 'set')));
    if (!IND[S.ind].niv.includes('set')) S.ind = 'renda_resp';
    renderCats();
  }
  map.fitBounds(D.bai.bounds[j], {padding: [30, 30]});
  desenha();
}
function escolheIndicador(id) {
  if (!IND[id]) return;
  if (!IND[id].niv.includes(S.nivel)) { toast('Este indicador só existe por bairro.'); return; }
  S.ind = id;
  $$('.ind').forEach(b => b.classList.toggle('on', b.dataset.id === id));
  desenha();
}

/* ───────────────────────────────────────────── 8. catálogo lateral ── */
function renderCats() {
  const filtro = norm($('#filtro').value);
  const fechadas = new Set($$('.cat.fechada').map(c => c.dataset.cat));
  const nv = S.nivel;
  let total = 0;
  $('#cats').innerHTML = P.cats.map(cat => {
    const lista = CATALOGO.filter(c => c.cat === cat.id && (!filtro || norm(c.n + ' ' + c.d).includes(filtro)));
    if (!lista.length) return '';
    total += lista.length;
    return `<div class="cat ${fechadas.has(cat.id) && !filtro ? 'fechada' : ''}" data-cat="${cat.id}">
      <button type="button" aria-expanded="${!(fechadas.has(cat.id) && !filtro)}">${esc(cat.n)} <span class="n">${lista.length}
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" fill="none"/></svg></span></button>
      <div class="lista">${lista.map(c => {
        const ok = c.niv.includes(nv);
        return `<button type="button" class="ind ${c.id === S.ind ? 'on' : ''}" data-id="${c.id}" ${ok ? '' : 'disabled'}>
          <span class="nm">${esc(c.n)}</span>
          <span class="mt">${esc(rotFonte(c))} · ${c.niv.includes('set') ? 'setor e bairro' : 'bairro'}${ok ? '' : ' (troque para bairro)'}${c.calc ? ' · cálculo do Atlas' : ''}</span></button>`;
      }).join('')}</div></div>`;
  }).join('');
  $('#nInd').textContent = `${total}`;
  $('#sideNota').textContent = nv === 'set'
    ? 'No setor, o valor é o do próprio setor do Censo 2022; o que o IBGE omitiu (sigilo) fica em branco ou como intervalo.'
    : 'No bairro, os valores do Censo somam os setores. As lojas vêm do CNES de abril de 2026.';
  $$('.cat > button').forEach(b => b.onclick = () => { b.parentElement.classList.toggle('fechada'); b.setAttribute('aria-expanded', String(!b.parentElement.classList.contains('fechada'))); });
  $$('.ind').forEach(b => b.onclick = () => { escolheIndicador(b.dataset.id); fechaSideMobile(); });
}

/* ───────────────────────────────────────────── 9. entorno das lojas ── */
/* Soma dos setores cujo ponto representativo cai no raio (ou que têm a loja como a
   mais próxima). Contagens somam; taxas são recalculadas sobre os totais somados,
   com o mínimo e o máximo que o sigilo do IBGE permite. */
const TAXAS_ENTORNO = [
  ['pct_0a14', 'p'], ['pct_60mais', 'p'], ['pct_negra', 'p'], ['tx_analf', 'p'],
  ['pct_esgoto_precario', 'd'], ['pct_agua_rede', 'd'], ['pct_lixo_coleta', 'd'],
  ['pct_onibus', 'e'], ['pct_pav', 'e'], ['pct_ilum', 'e'], ['pct_calcada', 'e'],
];
const _entCache = new Map();
function entorno(k, raio) {
  const chave = `${k}|${raio}`;
  if (_entCache.has(chave)) return _entCache.get(chave);
  const l = D.lojas[k], lista = [];
  for (let i = 0; i < D.set.n; i++) if (distM(D.set.rx[i], D.set.ry[i], l.x, l.y) <= raio) lista.push(i);
  const r = {setores: lista, ...somaSetores(lista)};
  r.lojas = D.lojas.filter(o => o.k !== k && distM(o.x, o.y, l.x, l.y) <= raio).map(o => o.k);
  r.saude = D.saude.filter(p => distM(p.x, p.y, l.x, l.y) <= raio);
  r.escolas = D.escolas.filter(p => distM(p.x, p.y, l.x, l.y) <= raio);
  _entCache.set(chave, r);
  return r;
}
function maisProximos(k) {
  const chave = `${k}|perto`;
  if (_entCache.has(chave)) return _entCache.get(chave);
  const lista = [];
  for (let i = 0; i < D.set.n; i++) if (D.set.perto[i] === k) lista.push(i);
  const r = {setores: lista, ...somaSetores(lista)};
  _entCache.set(chave, r);
  return r;
}
function somaSetores(lista) {
  const B = D.set.base, pop = D.set.col('pop'), dom = D.set.col('dom'), area = D.set.col('area');
  const s = {pop: 0, dom: 0, area: 0, renda_num: 0, renda_den: 0, cob_p: 0, cob_d: 0, cob_r: 0, pop_fcu: 0};
  const t = {};
  TAXAS_ENTORNO.forEach(([k]) => { t[k] = [0, 0, 0, 0]; });
  for (const i of lista) {
    s.pop += pop[i] || 0; s.dom += dom[i] || 0; s.area += area[i] || 0;
    s.renda_num += B.renda_num[i]; s.renda_den += B.renda_den[i];
    s.cob_p += B.cob_p[i]; s.cob_d += B.cob_d[i]; s.cob_r += B.cob_r[i]; s.pop_fcu += B.pop_fcu[i];
    TAXAS_ENTORNO.forEach(([k]) => { const c = D.set.cont[k], a = t[k]; a[0] += c[0][i]; a[1] += c[1][i]; a[2] += c[2][i]; a[3] += c[3][i]; });
  }
  const regra = P.regra.cob_min;
  const v = {pop: s.pop, dom: s.dom, area: s.area,
             renda_resp: s.renda_den && s.pop && s.cob_r / s.pop >= regra ? s.renda_num / s.renda_den : null,
             pct_fcu: s.pop ? 100 * s.pop_fcu / s.pop : null};
  const fx = {};
  TAXAS_ENTORNO.forEach(([k, g]) => {
    const [nl, nh, dl, dh] = t[k];
    const cob = g === 'p' ? s.cob_p : (g === 'd' ? s.cob_d : s.pop);
    if (!s.pop || cob / s.pop < regra || !(dh > 0) || !(dl > 0)) { v[k] = null; return; }
    const lo = 100 * nl / dh, hi = 100 * nh / dl;
    v[k] = (lo + hi) / 2;
    if (fmt(lo, IND[k].fmt) !== fmt(hi, IND[k].fmt)) fx[k] = [lo, hi];
  });
  return {v, fx, cob_p: s.pop ? s.cob_p / s.pop : 0};
}
/* indicadores do quadro do entorno: [id, rótulo] */
const LINHAS_ENTORNO = [
  ['pop', 'Moradores'], ['dom', 'Domicílios'], ['renda_resp', 'Rendimento médio do responsável'],
  ['pct_0a14', 'Crianças de 0 a 14 anos'], ['pct_60mais', 'Pessoas de 60 anos ou mais'],
  ['pct_negra', 'Pessoas pretas ou pardas'], ['tx_analf', 'Analfabetismo, 15 anos ou mais'],
  ['pct_fcu', 'Em favelas e comunidades urbanas'], ['pct_esgoto_precario', 'Esgoto precário ou inexistente'],
  ['pct_agua_rede', 'Água da rede geral'], ['pct_lixo_coleta', 'Lixo coletado'],
  ['pct_onibus', 'Moradores em rua com ponto de ônibus'], ['pct_pav', 'Moradores em rua pavimentada'],
  ['pct_calcada', 'Moradores em rua com calçada'],
];

/* ───────────────────────────────────────────────────────── 10. fichas ── */
function linhaComp(rot, v, c, eu, maxAbs, fx) {
  const w = (v != null && maxAbs) ? Math.max(2, Math.round(70 * Math.abs(v) / maxAbs)) : 0;
  return `<tr class="${eu ? 'eu' : ''}"><td>${esc(rot)}</td><td>${fx ? '≈ ' : ''}${fmt(v, c.fmt)}${w ? `<span class="bar" style="width:${w}px;${eu ? 'background:var(--acc)' : ''}"></span>` : ''}</td></tr>`;
}
const CONTAGEM = new Set(['pop', 'dom', 'area', 'dom_improv', 'lojas_n']);   // somas: sem barra nem RS e Brasil
function valorComp(nv, id) { const o = COMP[nv]; return o && o.v[id] != null ? o.v[id] : null; }
function blocoDestaque(nv, i) {
  const c = IND[S.ind], B = D[nv];
  if (!c.niv.includes(nv)) return `<div class="bloco"><div class="nota">“${esc(c.n)}” só existe por bairro.</div></div>`;
  const v = B.col(S.ind)[i], fx = B.faixa(S.ind).get(i);
  const linhas = [[nomeUnidade(nv, i), v, true, fx]];
  if (nv === 'set') { const j = D.set.b[i]; linhas.push([D.bai.nomes[j] + ' (bairro)', D.bai.col(S.ind)?.[j], false, D.bai.faixa(S.ind).get(j)]); }
  linhas.push(['Porto Alegre', valorComp('mun', S.ind), false]);
  if (c.fonte === 'CENSO22' && !CONTAGEM.has(S.ind)) {
    linhas.push(['Rio Grande do Sul', valorComp('uf', S.ind), false]);
    linhas.push(['Brasil', valorComp('br', S.ind), false]);
  }
  const vis = linhas.filter(l => l[1] != null || l[2]);
  const maxAbs = CONTAGEM.has(S.ind) ? 0 : Math.max(...vis.map(l => Math.abs(l[1] ?? 0)));
  const pos = posicao(nv, i);
  let notas = '';
  if (fx) notas += `<div class="nota">Entre ${fmt(fx[0], c.fmt)} e ${fmt(fx[1], c.fmt)}: o IBGE omite contagens de 1 e 2 em cada setor e, aqui, não dá para recuperar todas pela diferença. O mapa usa o meio do intervalo.</div>`;
  if (c.calc) notas += `<div class="nota">Cálculo do Atlas: ${esc(c.calc)}.</div>`;
  if (S.ind === 'renda_resp' && nv === 'bai' && D.bai.atip.has(i)) notas += notaAtipico(D.bai.atip.get(i));
  if (v == null) notas += `<div class="nota warn">${esc(motivoSemValor(c, nv, i))}</div>`;
  return `<div class="bloco destaque">
    <div class="rot">${esc(c.n)}</div>
    <div class="val">${fx ? '≈ ' : ''}${fmt(v, c.fmt)}${unid(c) ? `<small>${esc(c.u)}</small>` : ''}</div>
    ${seloFonte(c)}
    ${pos ? `<div class="rank">${ord(pos[0])} maior valor entre ${NF[0].format(pos[1])} ${nv === 'bai' ? 'bairros' : 'setores'} com dado</div>` : ''}
    <table class="comp">${vis.map(l => linhaComp(l[0], l[1], c, l[2], maxAbs, l[3])).join('')}</table>
    ${notas}
  </div>`;
}
function notaAtipico(a) {
  return `<div class="nota warn">Um setor sozinho puxa esta média: o setor ${a.setor} tem rendimento médio de ${fmt(a.media, 'brl0')} e responde por ${NF[0].format(100 * a.parte)}% da renda somada. Sem ele, a média dos outros setores é ${fmt(a.resto, 'brl0')}. O Atlas mostra o valor como o IBGE publica.</div>`;
}
function listaIndicadores(nv, i) {
  const B = D[nv];
  return P.cats.map(cat => {
    const lista = CATALOGO.filter(c => c.cat === cat.id && c.niv.includes(nv));
    if (!lista.length) return '';
    return `<div class="grupo"><h4>${esc(cat.n)}</h4>${lista.map(c => {
      const v = B.col(c.id)?.[i], fx = B.faixa(c.id).get(i);
      return `<button type="button" class="linha ${c.id === S.ind ? 'on' : ''}" data-id="${c.id}">
        <span class="n">${esc(c.n)}</span><span class="v ${v == null ? 'nd' : ''}">${v == null ? 'sem dado' : (fx ? '≈ ' : '') + fmt(v, c.fmt)}</span>
        <span class="m">${esc(rotFonte(c))}${unid(c) ? ' · ' + esc(c.u) : ''}${fx ? ` · entre ${fmt(fx[0], c.fmt)} e ${fmt(fx[1], c.fmt)}` : ''}${c.calc ? ' · cálculo do Atlas' : ''}</span></button>`;
    }).join('')}</div>`;
  }).join('');
}
function listaLojas(ks, rot) {
  if (!ks.length) return '';
  return `<div class="bloco"><h3>${rot}</h3><table class="top5">${ks.map((k, n) => {
    const l = D.lojas[k];
    return `<tr data-loja="${k}"><td>${n + 1}</td><td>${esc(l.end)}${l.classe === 'cnes_sem_confirmacao' ? ' <span class="tag">posição sem confirmação</span>' : ''}</td><td>entorno</td></tr>`;
  }).join('')}</table></div>`;
}
function fichaBairro(i) {
  const B = D.bai, v = id => B.col(id)?.[i];
  const nl = B.lojas[i].length;
  const chips = [`<span class="chip"><b>${fmt(v('pop'), 'int')}</b> pessoas (2022)</span>`,
    `<span class="chip"><b>${fmt(v('area'), 'dec2')}</b> km²</span>`,
    v('renda_resp') != null ? `<span class="chip">rendimento do responsável <b>${fmt(v('renda_resp'), 'brl0')}</b></span>` : '',
    `<span class="chip">${nl ? `<b>${nl}</b> loja${nl > 1 ? 's' : ''} Panvel` : 'sem loja Panvel'}</span>`,
    `<span class="chip">loja mais próxima, média dos moradores: <b>${fmt(v('dist_loja'), 'm')}</b></span>`].join('');
  const acoes = [`<button type="button" class="btn pri" data-acao="setores">Ver os ${B.setores[i].length} setores</button>`,
    `<button type="button" class="btn" data-acao="zoom">Aproximar</button>`,
    `<button type="button" class="btn" data-acao="csvficha">Baixar a ficha (CSV)</button>`,
    `<button type="button" class="btn" data-acao="limpa">Voltar à cidade</button>`].join('');
  return `<div class="eyebrow f-eyebrow">Bairro · Porto Alegre</div>
    <h2 class="f-nome">${esc(B.nomes[i])}</h2>
    <div class="f-sub">Código IBGE ${B.ids[i]} · um dos ${B.n} bairros do Censo 2022</div>
    <div class="chips">${chips}</div><div class="acoes">${acoes}</div>
    ${blocoDestaque('bai', i)}
    ${listaLojas(B.lojas[i], `Lojas Panvel no bairro (${nl})`)}
    ${listaIndicadores('bai', i)}`;
}
function fichaSetor(i) {
  const B = D.set, v = id => B.col(id)?.[i], j = B.b[i], l = D.lojas[B.perto[i]];
  const chips = [`<span class="chip"><b>${fmt(v('pop'), 'int')}</b> pessoas (2022)</span>`,
    `<span class="chip"><b>${fmt(v('dom'), 'int')}</b> domicílios</span>`,
    `<span class="chip"><b>${fmt(v('area'), 'dec2')}</b> km²</span>`,
    v('renda_resp') != null ? `<span class="chip">rendimento do responsável <b>${fmt(v('renda_resp'), 'brl0')}</b></span>` : '',
    v('pct_fcu') ? '<span class="chip">favela ou comunidade urbana</span>' : ''].join('');
  const acoes = [`<button type="button" class="btn" data-acao="bairro">Ficha de ${esc(D.bai.nomes[j])}</button>`,
    `<button type="button" class="btn" data-acao="lojaperto">Loja mais próxima</button>`,
    `<button type="button" class="btn" data-acao="zoom">Aproximar</button>`,
    `<button type="button" class="btn" data-acao="csvficha">Baixar a ficha (CSV)</button>`].join('');
  return `<div class="eyebrow f-eyebrow">Setor censitário · ${esc(D.bai.nomes[j])}</div>
    <h2 class="f-nome">Setor ${B.ids[i]}</h2>
    <div class="f-sub">Loja Panvel mais próxima: ${esc(l.end)}, a ${fmt(B.dperto[i], 'm')} em linha reta</div>
    <div class="chips">${chips}</div><div class="acoes">${acoes}</div>
    ${blocoDestaque('set', i)}
    ${listaIndicadores('set', i)}`;
}
function celEntorno(id, v, fx) {
  const c = IND[id] || {fmt: 'int'};
  const f = (id === 'pop' || id === 'dom') ? 'int' : c.fmt;
  return `<td class="eu">${fx ? '≈ ' : ''}${fmt(v, f)}${fx ? `<span class="fx">${fmt(fx[0], f)} a ${fmt(fx[1], f)}</span>` : ''}</td>`;
}
function fichaLoja(k) {
  const l = D.lojas[k], R = entorno(k, S.raio), Pp = maisProximos(k), Vz = D.lojas[l.vizinha];
  const poaPop = COMP.mun.v.pop;
  const tab = LINHAS_ENTORNO.map(([id, rot]) => `<tr><td>${esc(rot)}</td>${celEntorno(id, R.v[id], R.fx[id])}${celEntorno(id, Pp.v[id], Pp.fx[id])}
      <td>${['pop', 'dom'].includes(id) ? '' : fmt(valorComp('mun', id), (IND[id] || {}).fmt)}</td></tr>`).join('');
  const grupos = {'UBS e postos de saúde': [1, 2, 71], 'Hospitais': [5, 7, 15, 62], 'Pronto atendimento e pronto-socorro': [20, 21, 73],
    'CAPS': [70], 'Policlínicas e outras': [4, 72]};
  const saude = Object.entries(grupos).map(([g, ts]) => [g, R.saude.filter(p => ts.includes(p.tipo)).length]).filter(x => x[1]);
  const pub = R.escolas.filter(p => p.tipo !== 4).length, priv = R.escolas.length - pub;
  const cnpj = String(l.cnpj).replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  const avisos = [];
  if (l.classe === 'cnes_sem_confirmacao') avisos.push(`A posição desta loja vem só do CNES: o endereço não a confirma (${esc(CLASSE_LOC[l.classe][1])}). O entorno pode estar deslocado.`);
  if (l.classe === 'centro_cep') avisos.push(`A coordenada do CNES fica a ${fmt(l.dist_cnes_geocodebr_m, 'm')} do endereço; o Atlas usa o centro do CEP do endereço (incerteza de ${fmt(l.incerteza_m, 'm')}).`);
  const outra = cs => cs.map(c => D.lojas.find(o => o.cnes === c)).filter(Boolean).map(o => `${esc(o.end)} (CNES ${esc(o.cnes)})`).join('; ');
  if (l.mesmo_end.length) avisos.push(`O CNES tem outra loja ativa da Panvel no mesmo endereço: ${outra(l.mesmo_end)}, com outro CNPJ. Pode ser outra loja ou um registro repetido; o Atlas mostra as duas.`);
  else if (l.perto_50m.length) avisos.push(`Há outra loja da Panvel a menos de 50 m: ${outra(l.perto_50m)}. Pode ser outra loja ou o mesmo prédio com dois registros; o Atlas mostra as duas.`);
  if (!Pp.v.pop) avisos.push('Nenhum setor tem esta loja como a Panvel mais próxima: para todos os setores em volta, outra loja fica mais perto (ou à mesma distância e antes na lista).');
  if (R.cob_p < 0.9999 && R.pop) avisos.push(`Os setores com dado de pessoas somam ${NF[1].format(100 * R.cob_p)}% dos moradores do raio; o IBGE omitiu os outros (sigilo).`);
  return `<div class="eyebrow f-eyebrow">Loja Panvel · ${esc(D.bai.nomes[l.b])}</div>
    <h2 class="f-nome">${esc(l.end)}</h2>
    <div class="f-sub">CNES ${esc(l.cnes)} · CNPJ ${esc(cnpj)} · ${esc(P.pontos.lojas.tipos[l.tipo])}${l.bairro_cnes && norm(l.bairro_cnes) !== norm(D.bai.nomes[l.b]) ? ` · no CNES, bairro ${esc(l.bairro_cnes)}` : ''}</div>
    <div class="chips"><span class="chip">localização: <b>${esc(textoLoc(l))}</b></span>
      <span class="chip">outra Panvel mais perto: <b>${fmt(l.dviz, 'm')}</b> (${esc(Vz.end)})</span></div>
    <div class="acoes"><button type="button" class="btn pri" data-acao="setoresloja">Ver os setores no mapa</button>
      <button type="button" class="btn" data-acao="zoomloja">Aproximar</button>
      <button type="button" class="btn" data-acao="csvloja">Baixar o entorno (CSV)</button>
      <button type="button" class="btn" data-acao="limpa">Voltar à cidade</button></div>
    <div class="bloco">
      <h3>Entorno da loja</h3>
      <div class="raios"><span>Raio</span><div class="seg" role="radiogroup" aria-label="Raio do entorno">${RAIOS.map(r =>
        `<button type="button" role="radio" data-raio="${r}" aria-checked="${S.raio === r}">${fmt(r, 'm')}</button>`).join('')}</div></div>
      <div class="kpis">
        <div><span>Moradores no raio de ${fmt(S.raio, 'm')}</span><b>${fmt(R.v.pop, 'int')}</b></div>
        <div><span>Moradores que têm esta loja como a Panvel mais próxima</span><b>${fmt(Pp.v.pop, 'int')}</b></div>
        <div><span>Setores no raio</span><b>${NF[0].format(R.setores.length)}</b></div>
        <div><span>Parte da cidade mais próxima desta loja</span><b>${fmt(100 * Pp.v.pop / poaPop, 'pct1')}</b></div>
      </div>
      <table class="ent"><thead><tr><th>Indicador (Censo 2022)</th><th>Raio de ${fmt(S.raio, 'm')}</th><th>Mais próximos</th><th>Porto Alegre</th></tr></thead>
        <tbody>${tab}</tbody></table>
      <div class="nota">“Mais próximos” são os setores cujo ponto representativo está mais perto desta loja do que de qualquer outra Panvel, em linha reta. Taxas recalculadas sobre a soma dos setores; “≈” marca o meio do intervalo que o sigilo do IBGE permite.</div>
      ${avisos.map(a => `<div class="nota warn">${a}</div>`).join('')}
    </div>
    <div class="bloco"><h3>No raio de ${fmt(S.raio, 'm')}</h3>
      <table class="comp">
        <tr><td>Outras lojas Panvel</td><td>${NF[0].format(R.lojas.length)}</td></tr>
        ${saude.map(([g, n]) => `<tr><td>${esc(g)}</td><td>${NF[0].format(n)}</td></tr>`).join('') || '<tr><td>Unidades de saúde do CNES</td><td>0</td></tr>'}
        <tr><td>Escolas públicas</td><td>${NF[0].format(pub)}</td></tr>
        <tr><td>Escolas privadas</td><td>${NF[0].format(priv)}</td></tr>
      </table>
      <div class="nota">Unidades de saúde ativas no CNES de abril de 2026 (tipos de atendimento à população) e escolas em atividade no Censo Escolar 2025. Distâncias em linha reta.</div>
    </div>`;
}
function resumoCidade() {
  const c = IND[S.ind], B = D[S.nivel], vals = B.col(S.ind), cf = P.conferencia, cl = cf.cobertura_lojas;
  let blocoInd = '';
  if (vals) {
    const v = [...Array(B.n).keys()].filter(i => vals[i] != null).sort((a, b) => vals[b] - vals[a]);
    const med = v.length ? vals[v[Math.floor(v.length / 2)]] : null;
    const top = v.slice(0, 5), fim = v.slice(-5).reverse();
    const nome = j => S.nivel === 'bai' ? esc(B.nomes[j]) : `${esc(D.bai.nomes[D.set.b[j]])} <span class="muted">${D.set.ids[j]}</span>`;
    const tab = (lista, inv) => `<table class="top5">${lista.map((j, k) => `<tr data-nv="${S.nivel}" data-i="${j}"><td>${inv ? NF[0].format(v.length - k) : k + 1}</td><td>${nome(j)}</td><td>${fmt(vals[j], c.fmt)}</td></tr>`).join('')}</table>`;
    const comp = [['Porto Alegre', valorComp('mun', S.ind)], ...(c.fonte !== 'CENSO22' || CONTAGEM.has(S.ind) ? [] : [['Rio Grande do Sul', valorComp('uf', S.ind)], ['Brasil', valorComp('br', S.ind)]])].filter(x => x[1] != null);
    blocoInd = `<div class="bloco"><h3>${esc(c.n)}</h3>${seloFonte(c)}
      <div class="dist"><div><span>menor</span><b>${fmt(v.length ? vals[v[v.length - 1]] : null, c.fmt)}</b></div>
        <div><span>mediana</span><b>${fmt(med, c.fmt)}</b></div><div><span>maior</span><b>${fmt(v.length ? vals[v[0]] : null, c.fmt)}</b></div></div>
      ${comp.length ? `<table class="comp">${comp.map(x => `<tr><td>${esc(x[0])}</td><td>${fmt(x[1], c.fmt)}</td></tr>`).join('')}</table>` : ''}
      <h3 style="margin-top:14px">Maiores valores</h3>${tab(top)}
      <h3 style="margin-top:14px">Menores valores</h3>${tab(fim, true)}
      <div class="acoes"><button type="button" class="btn" data-acao="ranking">Ranking completo</button></div></div>`;
  } else blocoInd = `<div class="bloco"><div class="nota">“${esc(c.n)}” só existe por bairro.</div></div>`;
  const loc = cf.lojas_por_classe;
  return `<div class="eyebrow f-eyebrow">Município · RS</div><h2 class="f-nome">Porto Alegre</h2>
    <div class="f-sub">Censo 2022 · ${NF[0].format(D.bai.n)} bairros e ${NF[0].format(D.set.n)} setores censitários</div>
    <div class="chips"><span class="chip"><b>${fmt(COMP.mun.v.pop, 'int')}</b> pessoas (2022)</span>
      <span class="chip"><b>${D.lojas.length}</b> lojas Panvel no CNES</span>
      <span class="chip"><b>${cf.bairros_com_loja}</b> bairros com loja, <b>${cf.bairros_sem_loja}</b> sem</span></div>
    <div class="bloco"><h3>Lojas Panvel e moradores</h3>
      <div class="kpis">
        <div><span>Moradores a até 500 m de uma loja</span><b>${fmt(cl.pop_500m, 'pct1')}</b></div>
        <div><span>Moradores a até 1 km de uma loja</span><b>${fmt(cl.pop_1km, 'pct1')}</b></div>
        <div><span>Distância média até a loja mais próxima</span><b>${fmt(cl.dist_loja, 'm')}</b></div>
        <div><span>Lojas por 10 mil habitantes</span><b>${fmt(cl.lojas_10mil, 'dec2')}</b></div>
      </div>
      <div class="nota">Distâncias em linha reta, do ponto representativo de cada setor. Localização das lojas: ${loc.endereco} pelo número do endereço, ${loc.cnes_no_cep} pela coordenada do CNES confirmada pelo CEP, ${loc.centro_cep} pelo centro do CEP e ${loc.cnes_sem_confirmacao} só pela coordenada do CNES (em cinza no mapa).</div>
      <div class="acoes"><button type="button" class="btn" data-acao="lojas">Lista das lojas</button></div></div>
    <p class="muted" style="font-size:12.5px;margin-top:10px">Clique num ${S.nivel === 'bai' ? 'bairro' : 'setor'} para ver a ficha, ou numa loja para ver o entorno.</p>
    ${blocoInd}`;
}
function renderPainel() {
  const b = $('#panelBody');
  if (S.loja != null) b.innerHTML = fichaLoja(S.loja);
  else if (S.sel && S.sel.nv === 'bai') b.innerHTML = fichaBairro(S.sel.i);
  else if (S.sel && S.sel.nv === 'set') b.innerHTML = fichaSetor(S.sel.i);
  else b.innerHTML = resumoCidade();
  $$('.linha', b).forEach(x => x.onclick = () => {
    const id = x.dataset.id;
    if (!IND[id].niv.includes(S.nivel)) escolheNivel('bai');
    escolheIndicador(id);
  });
  $$('.top5 tr[data-i]', b).forEach(x => x.onclick = () => seleciona(x.dataset.nv, +x.dataset.i, true));
  $$('[data-loja]', b).forEach(x => x.onclick = () => selecionaLoja(+x.dataset.loja, true));
  $$('[data-raio]', b).forEach(x => x.onclick = () => { S.raio = +x.dataset.raio; desenha(); });
  $$('[data-acao]', b).forEach(x => x.onclick = () => acao(x.dataset.acao));
}
function acao(a) {
  if (a === 'zoom' && S.sel) map.fitBounds(D[S.sel.nv].bounds[S.sel.i], {padding: [40, 40], maxZoom: S.sel.nv === 'set' ? 17 : 15});
  else if (a === 'setores' && S.sel) verSetores(S.sel.i);
  else if (a === 'bairro' && S.sel) { const j = D.set.b[S.sel.i]; escolheNivel('bai'); seleciona('bai', j, false); }
  else if (a === 'lojaperto' && S.sel) selecionaLoja(D.set.perto[S.sel.i], true);
  else if (a === 'limpa') limpaSelecao();
  else if (a === 'csvficha') csvFicha();
  else if (a === 'ranking') abreRanking();
  else if (a === 'lojas') abreLojas();
  else if (a === 'zoomloja' && S.loja != null) { const l = D.lojas[S.loja]; map.setView([l.y, l.x], S.raio >= 2000 ? 13 : 14.5); }
  else if (a === 'setoresloja' && S.loja != null) {
    if (S.nivel !== 'set') escolheNivel('set');
    const R = entorno(S.loja, S.raio);
    if (R.setores.length) map.fitBounds(L.latLngBounds(R.setores.flatMap(i => [D.set.bounds[i].getSouthWest(), D.set.bounds[i].getNorthEast()])), {padding: [30, 30]});
  }
  else if (a === 'csvloja') csvLoja(S.loja);
}

/* ─────────────────────────────────────────────── 11. ranking e CSV ── */
let rkOrdem = -1;
function abreRanking() { renderRanking(); abreModal('mdRanking'); }
function renderRanking() {
  const c = IND[S.ind], nv = S.nivel, B = D[nv], vals = B.col(S.ind);
  const filtro = norm(($('#rkBusca') || {}).value || '');
  const nomeBai = i => nv === 'bai' ? B.nomes[i] : D.bai.nomes[D.set.b[i]];
  const lin = [...Array(B.n).keys()].filter(i => !filtro || norm(nomeBai(i) + ' ' + B.ids[i]).includes(filtro));
  lin.sort((a, b) => { const x = vals ? vals[a] : null, y = vals ? vals[b] : null;
    if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return rkOrdem * (x - y); });
  const mostra = lin.slice(0, 800);
  $('#ttRanking').textContent = `Ranking · ${c.n}`;
  $('#rankBody').innerHTML = `<div class="rk-top"><input id="rkBusca" type="search" placeholder="Filtrar pelo bairro${nv === 'set' ? ' ou pelo código' : ''}" value="${esc(filtro)}">
      <button type="button" class="btn" id="rkOrd">${rkOrdem < 0 ? 'Maior primeiro' : 'Menor primeiro'}</button>
      <button type="button" class="btn" id="rkCSV">Baixar CSV</button>
      <span class="muted" style="font-size:12.5px">${nv === 'bai' ? 'Bairros' : 'Setores'} de Porto Alegre · ${seloFonte(c)}${lin.length > mostra.length ? ` · mostrando ${mostra.length} de ${lin.length}; o CSV traz todos` : ''}</span></div>
    <div class="rk-wrap"><table class="tabela"><thead><tr><th class="r">#</th>${nv === 'set' ? '<th>Setor</th>' : ''}<th>Bairro</th><th class="r">${esc(c.n)}${unid(c) ? ` (${esc(c.u)})` : ''}</th></tr></thead>
    <tbody>${mostra.map((i, k) => `<tr data-i="${i}"><td class="r">${vals && vals[i] != null ? k + 1 : ''}</td>${nv === 'set' ? `<td>${B.ids[i]}</td>` : ''}<td>${esc(nomeBai(i))}</td><td class="r">${fmt(vals ? vals[i] : null, c.fmt)}</td></tr>`).join('')}</tbody></table></div>`;
  const bus = $('#rkBusca');
  bus.oninput = () => { const p = bus.selectionStart; renderRanking(); const n = $('#rkBusca'); n.focus(); n.setSelectionRange(p, p); };
  $('#rkOrd').onclick = () => { rkOrdem = -rkOrdem; renderRanking(); };
  $('#rkCSV').onclick = () => baixaCSV([['posição', 'código IBGE', ...(nv === 'set' ? ['bairro'] : ['bairro']),
    `${c.n} (${c.u}, ${rotFonte(c, ' ')})`], ...lin.map((i, k) => [vals && vals[i] != null ? k + 1 : '', String(B.ids[i]), nomeBai(i), vals && vals[i] != null ? vals[i] : ''])],
    `ranking_${S.ind}_${nv === 'bai' ? 'bairros' : 'setores'}_poa.csv`);
  $$('#rankBody tbody tr').forEach(tr => tr.onclick = () => { fechaModais(); seleciona(nv, +tr.dataset.i, true); });
}
function csvNivel() {
  const nv = S.nivel, B = D[nv];
  const inds = CATALOGO.filter(c => c.niv.includes(nv));
  const cab = ['código IBGE', ...(nv === 'set' ? ['bairro'] : ['bairro'])];
  const cols = [];
  inds.forEach(c => {
    cab.push(`${c.n} (${c.u}; ${rotFonte(c, ' ')}${c.calc ? '; cálculo do Atlas' : ''})`); cols.push([c.id, 'v']);
    if (B.faixa(c.id).size) { cab.push(`${c.n}: mínimo pelo sigilo`); cols.push([c.id, 'lo']); cab.push(`${c.n}: máximo pelo sigilo`); cols.push([c.id, 'hi']); }
  });
  const linhas = [cab];
  for (let i = 0; i < B.n; i++) {
    const l = [String(B.ids[i]), nv === 'bai' ? B.nomes[i] : D.bai.nomes[D.set.b[i]]];
    cols.forEach(([id, t]) => {
      if (t === 'v') { const v = B.col(id)?.[i]; l.push(v == null ? '' : v); }
      else { const f = B.faixa(id).get(i); l.push(f ? f[t === 'lo' ? 0 : 1] : ''); }
    });
    linhas.push(l);
  }
  baixaCSV(linhas, `atlas_poa_${nv === 'bai' ? 'bairros' : 'setores'}.csv`);
}
function csvFicha() {
  if (!S.sel) return;
  const nv = S.sel.nv, i = S.sel.i, B = D[nv];
  const linhas = [['indicador', 'valor', 'unidade', 'mínimo pelo sigilo', 'máximo pelo sigilo', 'fonte', 'ano', 'cálculo do Atlas']];
  CATALOGO.filter(c => c.niv.includes(nv)).forEach(c => {
    const v = B.col(c.id)?.[i], f = B.faixa(c.id).get(i);
    linhas.push([c.n, v == null ? '' : v, c.u, f ? f[0] : '', f ? f[1] : '', FONTES[c.fonte].n, c.ano, c.calc || '']);
  });
  baixaCSV(linhas, `ficha_${B.ids[i]}.csv`);
}
function linhaLojaCSV(l) {
  const out = [l.cnes, l.cnpj, l.end, D.bai.nomes[l.b], l.bairro_cnes, l.cep || '', P.pontos.lojas.tipos[l.tipo],
    l.y, l.x, CLASSE_LOC[l.classe][0], l.incerteza_m ?? '', Math.round(l.dviz)];
  RAIOS.forEach(r => {
    const R = entorno(l.k, r);
    out.push(R.v.pop, R.v.dom, R.v.renda_resp ?? '', R.v.pct_60mais ?? '', R.v.pct_0a14 ?? '', R.v.pct_negra ?? '', R.v.pct_fcu ?? '',
      R.lojas.length, R.saude.length, R.escolas.length);
  });
  const Pp = maisProximos(l.k);
  out.push(Pp.v.pop, Pp.v.renda_resp ?? '', Pp.v.pct_60mais ?? '');
  return out;
}
function cabLojaCSV() {
  const cab = ['CNES', 'CNPJ', 'endereço (CNES)', 'bairro (IBGE 2022)', 'bairro no CNES', 'CEP', 'tipo no CNES', 'latitude', 'longitude',
    'localização', 'incerteza da localização (m)', 'outra Panvel mais perto (m)'];
  RAIOS.forEach(r => cab.push(`moradores a até ${r} m`, `domicílios a até ${r} m`, `rendimento médio do responsável a até ${r} m (R$)`,
    `60 anos ou mais a até ${r} m (%)`, `0 a 14 anos a até ${r} m (%)`, `pretos ou pardos a até ${r} m (%)`, `em favelas e comunidades urbanas a até ${r} m (%)`,
    `outras Panvel a até ${r} m`, `unidades de saúde a até ${r} m`, `escolas a até ${r} m`));
  cab.push('moradores mais próximos desta loja', 'rendimento médio dos mais próximos (R$)', '60 anos ou mais entre os mais próximos (%)');
  return cab;
}
function csvLojas() { baixaCSV([cabLojaCSV(), ...D.lojas.map(linhaLojaCSV)], 'lojas_panvel_poa_entorno.csv'); }
function csvLoja(k) {
  const l = D.lojas[k], R = entorno(k, S.raio);
  const linhas = [['setor', 'bairro', 'distância até a loja (m)', 'moradores', 'domicílios', 'rendimento médio do responsável (R$)']];
  R.setores.map(i => [i, distM(D.set.rx[i], D.set.ry[i], l.x, l.y)]).sort((a, b) => a[1] - b[1]).forEach(([i, d]) => {
    linhas.push([String(D.set.ids[i]), D.bai.nomes[D.set.b[i]], Math.round(d), D.set.col('pop')[i] ?? '', D.set.col('dom')[i] ?? '', D.set.col('renda_resp')[i] ?? '']);
  });
  baixaCSV(linhas, `entorno_${l.cnes}_${S.raio}m.csv`);
}

/* ──────────────────────────────────────────────────── 12. lista das lojas ── */
let ljOrdem = {col: 'end', dir: 1};
function abreLojas() { renderLojas(); abreModal('mdLojas'); }
function renderLojas() {
  const filtro = norm(($('#ljBusca') || {}).value || '');
  const lin = D.lojas.filter(l => !filtro || norm(l.end + ' ' + D.bai.nomes[l.b] + ' ' + l.cnes).includes(filtro)).map(l => {
    const R = entorno(l.k, S.raio), Pp = maisProximos(l.k);
    return {l, end: l.end, bairro: D.bai.nomes[l.b], loc: l.classe, pop: R.v.pop, renda: R.v.renda_resp, idoso: R.v.pct_60mais,
            perto: Pp.v.pop, viz: l.dviz};
  });
  const {col, dir} = ljOrdem;
  lin.sort((a, b) => {
    const x = a[col], y = b[col];
    if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1;
    return typeof x === 'string' ? dir * x.localeCompare(y, 'pt-BR') : dir * (x - y);
  });
  const th = (c, rot, r) => `<th class="${r ? 'r' : ''}" data-ord="${c}">${rot}${col === c ? ` <span class="seta">${dir > 0 ? '↑' : '↓'}</span>` : ''}</th>`;
  $('#lojasBody').innerHTML = `<div class="rk-top"><input id="ljBusca" type="search" placeholder="Filtrar pelo endereço, bairro ou CNES" value="${esc(filtro)}">
      <div class="seg" role="radiogroup" aria-label="Raio">${RAIOS.map(r => `<button type="button" role="radio" data-ljraio="${r}" aria-checked="${S.raio === r}">${fmt(r, 'm')}</button>`).join('')}</div>
      <button type="button" class="btn" id="ljCSV">Baixar CSV (três raios)</button>
      <span class="muted" style="font-size:12.5px">${lin.length} de ${D.lojas.length} lojas · CNES abr./2026 · clique no título da coluna para ordenar</span></div>
    <div class="rk-wrap"><table class="tabela"><thead><tr>${th('end', 'Loja (endereço no CNES)')}${th('bairro', 'Bairro')}${th('loc', 'Localização')}
      ${th('pop', `Moradores até ${fmt(S.raio, 'm')}`, 1)}${th('renda', 'Rendimento médio', 1)}${th('idoso', '60 anos ou +', 1)}
      ${th('perto', 'Mais próximos', 1)}${th('viz', 'Outra Panvel', 1)}</tr></thead>
    <tbody>${lin.map(x => `<tr data-k="${x.l.k}"><td>${esc(x.end)}${x.l.mesmo_end.length ? ' <span class="tag">mesmo endereço</span>' : ''}</td><td>${esc(x.bairro)}</td><td class="nw" title="${esc(CLASSE_LOC[x.loc][0] + ': ' + CLASSE_LOC[x.loc][1])}">${esc(CLASSE_LOC[x.loc][2])}</td>
      <td class="r">${fmt(x.pop, 'int')}</td><td class="r">${fmt(x.renda, 'brl0')}</td><td class="r">${fmt(x.idoso, 'pct1')}</td>
      <td class="r">${fmt(x.perto, 'int')}</td><td class="r">${fmt(x.viz, 'm')}</td></tr>`).join('')}</tbody></table></div>
    <p class="muted" style="font-size:12px;margin-top:10px">Entorno: soma dos setores cujo ponto representativo cai no raio, em linha reta. “Moradores mais próximos”: setores mais perto desta loja do que de qualquer outra Panvel. As ${D.lojas.filter(l => l.classe === 'cnes_sem_confirmacao').length} lojas “sem confirmação” têm só a coordenada do CNES.</p>`;
  const bus = $('#ljBusca');
  bus.oninput = () => { const p = bus.selectionStart; renderLojas(); const n = $('#ljBusca'); n.focus(); n.setSelectionRange(p, p); };
  $$('#lojasBody th[data-ord]').forEach(h => h.onclick = () => {
    const c = h.dataset.ord; ljOrdem = {col: c, dir: ljOrdem.col === c ? -ljOrdem.dir : (['end', 'bairro', 'loc'].includes(c) ? 1 : -1)}; renderLojas();
  });
  $$('[data-ljraio]').forEach(b => b.onclick = () => { S.raio = +b.dataset.ljraio; renderLojas(); if (S.loja != null) desenha(); });
  $('#ljCSV').onclick = csvLojas;
  $$('#lojasBody tbody tr').forEach(tr => tr.onclick = () => { fechaModais(); selecionaLoja(+tr.dataset.k, true); });
}

/* ─────────────────────────────────────────────────────────── 13. busca ── */
let sugAtual = [], sugIdx = -1;
function buscar(q) {
  const s = $('#sugg'), t = norm(q.trim());
  if (t.length < 2) { s.hidden = true; return; }
  const bai = [];
  for (let i = 0; i < D.bai.n; i++) if (norm(D.bai.nomes[i]).includes(t)) bai.push(i);
  bai.sort((a, b) => (norm(D.bai.nomes[a]).startsWith(t) ? 0 : 1) - (norm(D.bai.nomes[b]).startsWith(t) ? 0 : 1) || D.bai.nomes[a].localeCompare(D.bai.nomes[b], 'pt-BR'));
  const lojas = D.lojas.filter(l => norm(l.end + ' ' + l.cnes).includes(t)).slice(0, 8);
  const setores = /^\d{6,}$/.test(t) ? D.set.ids.map((c, i) => [String(c), i]).filter(([c]) => c.includes(t)).slice(0, 6).map(([, i]) => i) : [];
  sugAtual = [...bai.slice(0, 8).map(i => ({tipo: 'bai', i})), ...lojas.map(l => ({tipo: 'loja', k: l.k})), ...setores.map(i => ({tipo: 'set', i}))];
  sugIdx = -1;
  s.innerHTML = sugAtual.length ? sugAtual.map((x, k) => x.tipo === 'bai'
    ? `<div role="option" data-k="${k}"><span>${esc(D.bai.nomes[x.i])}</span><small>bairro</small></div>`
    : x.tipo === 'loja' ? `<div role="option" data-k="${k}"><span>${esc(D.lojas[x.k].end)}</span><small>loja Panvel · ${esc(D.bai.nomes[D.lojas[x.k].b])}</small></div>`
    : `<div role="option" data-k="${k}"><span>Setor ${D.set.ids[x.i]}</span><small>${esc(D.bai.nomes[D.set.b[x.i]])}</small></div>`).join('')
    : '<div class="vazio">Nada encontrado</div>';
  s.hidden = false;
  $$('#sugg [data-k]').forEach(d => d.onmousedown = e => { e.preventDefault(); vaiPara(sugAtual[+d.dataset.k]); });
}
function vaiPara(x) {
  $('#sugg').hidden = true; $('#q').blur();
  if (x.tipo === 'loja') { selecionaLoja(x.k, true); return; }
  S.loja = null; $('#selLoja').value = '';
  if (x.tipo === 'set' && S.nivel !== 'set') escolheNivel('set');
  seleciona(x.tipo, x.i, true);
}

/* ─────────────────────────────────────────── 14. metodologia e fontes ── */
function renderMetodo() {
  const cf = P.conferencia, m = cf.malha, c = cf.censo, cl = cf.cobertura_lojas, lp = cf.lojas_por_classe;
  const br = cf.dimed_cnes_brasil;
  $('#metodoBody').innerHTML = `
    <h3>O que é</h3>
    <p>Mapa socioeconômico de Porto Alegre com os ${NF[0].format(m.bairros)} bairros e os ${NF[0].format(m.setores)} setores censitários do Censo 2022 e as ${cf.lojas_poa} lojas Panvel ativas no CNES. Todo valor mostra a fonte, o ano e o nível. O que a fonte não publica aparece em branco: o Atlas não estima, não interpola e não completa valor. O que é conta do Atlas leva o selo “cálculo do Atlas”.</p>
    <h3>Lojas Panvel</h3>
    <p>As lojas são os estabelecimentos ativos no Cadastro Nacional de Estabelecimentos de Saúde (CNES, competência de abril de 2026) com o CNPJ da Dimed S/A Distribuidora de Medicamentos, a empresa que opera a Panvel (raiz 92.665.611), endereço em Porto Alegre e registro de farmácia (tipo 43 do CNES): ${cf.lojas_poa} lojas em ${cf.lojas_bairros} bairros.${(cf.dimed_poa_outros_tipos || []).length ? ` Outros ${cf.dimed_poa_outros_tipos.length} estabelecimento(s) da empresa na cidade têm outro tipo no CNES e não contam como loja (${cf.dimed_poa_outros_tipos.map(o => `${esc(o.end)}, tipo ${o.tipo}`).join('; ')}).` : ''} No Brasil, o CNES tem ${br.ativos} estabelecimentos ativos com esse CNPJ (${Object.entries(br.ativos_por_uf).map(([u, n]) => `${u} ${n}`).join(', ')}). Farmácia que oferece serviço de saúde precisa de registro no CNES; uma loja aberta depois de abril de 2026, ou sem registro, não aparece. A lista oficial de lojas do site da Panvel não pôde ser aberta no ambiente em que o Atlas é montado; se ela for anexada, o Atlas confere loja por loja.</p>
    <p><b>Registros parecidos.</b> ${cf.lojas_mesmo_endereco.length} endereços aparecem em duas lojas ativas, com CNPJs diferentes (${esc(cf.lojas_mesmo_endereco.join('; '))}), e ${cf.lojas_a_menos_de_50m.length ? `${cf.lojas_a_menos_de_50m.length} par${cf.lojas_a_menos_de_50m.length > 1 ? 'es' : ''} de lojas fica${cf.lojas_a_menos_de_50m.length > 1 ? 'm' : ''} a menos de 50 m (${esc(cf.lojas_a_menos_de_50m.join('; '))})` : 'nenhum par de lojas fica a menos de 50 m um do outro'}; a conta dos 50 m deixa de fora a loja posta no centro do CEP, porque esse ponto não diz onde ela fica dentro dele. Pode ser loja distinta ou registro repetido no CNES; o Atlas mostra todas e avisa na ficha da loja. ${cf.dimed_poa_desativados.length} registros da Dimed em Porto Alegre estão desativados no CNES e ficam de fora.</p>
    <p><b>Onde fica cada loja.</b> O CNES traz a coordenada declarada pelo estabelecimento, e o arquivo do geobr traz também a do geocodebr (IPEA), que localiza o endereço no Cadastro Nacional de Endereços do Censo 2022. As duas nem sempre concordam. Como o entorno usa raios de 500 m, o Atlas aplica esta regra, na ordem:</p>
    <table><tr><th>Regra</th><th class="r">Lojas</th></tr>
      <tr><td>O geocodebr achou o número do endereço (incerteza de até 50 m): ponto do endereço</td><td class="r">${lp.endereco}</td></tr>
      <tr><td>A coordenada do CNES cai na área do CEP do endereço (ou a até 150 m do ponto do geocodebr): coordenada do CNES</td><td class="r">${lp.cnes_no_cep}</td></tr>
      <tr><td>A coordenada do CNES fica fora da área do CEP: centro do CEP do endereço (incerteza de até 800 m)</td><td class="r">${lp.centro_cep}</td></tr>
      <tr><td>O endereço não confirma nada (CEP muito extenso ou sem localização): coordenada do CNES, em cinza no mapa</td><td class="r">${lp.cnes_sem_confirmacao}</td></tr></table>
    <h3>Entorno de cada loja</h3>
    <p>O entorno soma os setores cujo ponto representativo (um ponto dentro do setor) está a até 500 m, 1 km ou 2 km da loja, em linha reta. Um setor cortado pela borda entra inteiro ou fica de fora. Contagens somam; taxas são recalculadas sobre os totais somados, nunca como média de taxas, e o sigilo do IBGE vira um mínimo e um máximo, mostrados quando mudam a casa decimal.</p>
    <p>“Mais próximos” são os setores cujo ponto representativo está mais perto desta loja do que de qualquer outra Panvel: cada setor da cidade entra numa loja só (em empate, na primeira da lista). Não é área de venda nem de atendimento; é só a divisão da cidade pela loja mais próxima em linha reta.</p>
    <h3>Indicadores das lojas por bairro</h3>
    <p>Lojas no bairro e por 10 mil habitantes; distância até a loja mais próxima (no setor, do ponto representativo; no bairro, a média dos moradores, com cada setor pesando pela população); e a parte dos moradores a até 500 m e a até 1 km de uma loja. Em Porto Alegre: ${fmt(cl.pop_500m, 'pct1')} dos moradores estão a até 500 m de uma loja, ${fmt(cl.pop_1km, 'pct1')} a até 1 km, e a distância média é de ${fmt(cl.dist_loja, 'm')}. ${cf.bairros_sem_loja} dos ${m.bairros} bairros não têm loja.</p>
    <h3>Malhas</h3>
    <p>Setores do Censo 2022 do IBGE, na forma publicada pelo IPEA no pacote geobr. Bairros e o contorno do município são a união dos setores, então o território é o mesmo dos dados. A área de cada setor confere com a publicada pelo IBGE (diferença mediana de ${m.setores_area_dif_mediana_pct}%), e a de cada bairro com a soma dos seus setores e com a malha de bairros do geobr (até ${m.bairros_geobr_area_dif_max_pct}%). As linhas foram simplificadas como cobertura (tolerância de cerca de 3 m), sem fresta entre vizinhos; as áreas dos cálculos são as do IBGE.</p>
    <h3>Censo 2022 por setor e por bairro</h3>
    <p>Agregados por setor do IBGE (arquivos do pacote censobr, IPEA), com as mesmas definições e regras do Atlas 2.0. A população soma ${NF[0].format(c.populacao_poa)}, a do Censo.</p>
    <p><b>Sigilo.</b> Em cada setor, o IBGE omite as contagens de 1 e 2 (os zeros ficam). Quando as categorias de uma variável fecham o total e só uma foi omitida, ela é o total menos as outras: conta exata. Quando duas ou mais foram omitidas, cada uma fica entre 1 e 2; o Atlas guarda o mínimo e o máximo, mostra o intervalo e pinta o mapa pelo meio dele. Cor ou raça não fecha o total (há quem não declarou), então ali só há mínimo e máximo. Em ${c.setores_sem_dado_pessoas} setores pequenos o IBGE omitiu tudo menos o básico; eles ficam sem valor. ${c.setores_sem_moradores} setores não têm moradores.</p>
    <p><b>Rendimento do responsável.</b> No setor, o valor do IBGE. No bairro, a média dos setores ponderada pelo número de responsáveis (o peso exato seria o de responsáveis com rendimento, que o IBGE não publica por setor), por isso aparece como cálculo do Atlas.</p>
    <h3>Unidades de saúde e escolas</h3>
    <p>Unidades de saúde: ${cf.saude} estabelecimentos ativos no CNES de abril de 2026, dos tipos de atendimento à população (UBS e postos, hospitais, CAPS, pronto atendimento, policlínicas), as mesmas regras do Atlas Metropolitano. Escolas: ${cf.escolas} escolas em atividade no Censo Escolar 2025 do INEP. Nas duas camadas, a coordenada é a que o geobr escolheu.</p>
    <h3>Classes do mapa</h3>
    <p>Quintis: cinco grupos com o mesmo número de bairros ou de setores da cidade. A razão de sexo usa faixas fixas em torno de 100.</p>
    <h3>Como atualizar</h3>
    <p>Na pasta <code>farmacias/porto-alegre/</code>: <code>python3 extracao/1_malhas.py</code>, <code>2_censo2022.py</code>, <code>3_pontos.py</code>, <code>4_monta.py</code> e <code>build_single.py</code>. Cada script baixa o que falta, confere e para se algo não bater.</p>
    <p class="muted">Gerado em ${esc(P.gerado_em)} · Atlas Porto Alegre ${esc(P.v)}.</p>`;
}
function renderFontes() {
  const uso = {};
  CATALOGO.forEach(c => { (uso[c.fonte] = uso[c.fonte] || []).push(c); });
  $('#fontesBody').innerHTML = Object.entries(FONTES).map(([k, f]) => `<h3>${esc(f.n)}</h3>
    <p>${esc(f.d)}</p><p><a href="${esc(f.u)}" target="_blank" rel="noopener">${esc(f.u)}</a></p>
    ${uso[k] ? `<p class="muted">${uso[k].length} indicador${uso[k].length > 1 ? 'es' : ''}: ${uso[k].map(c => esc(c.n)).join('; ')}.</p>` : ''}`).join('') +
    `<h3>IPEA — geobr e geocodebr</h3><p>Malhas, CNES e Censo Escolar nas releases do repositório ipea/geobr_prep_data e ipeaGIT/geobr no GitHub; Censo 2022 por setor nas do ipea/censobr_prep_data. O geocodebr localiza endereços no Cadastro Nacional de Endereços para Fins Estatísticos do Censo 2022.</p>
    <p><a href="https://ipeagit.github.io/geobr/" target="_blank" rel="noopener">https://ipeagit.github.io/geobr/</a></p>`;
}

/* ───────────────────────────────────────────────── 15. celular ── */
const ehCelular = () => matchMedia('(max-width:900px)').matches;
function abrePainelMobile() { if (ehCelular()) $('#panel').classList.add('open'); }
function fechaSideMobile() { $('#side').classList.remove('open'); $('#backdrop').classList.remove('show'); }

/* ─────────────────────────────────────────────────────────── 16. início ── */
function liga() {
  $('.brand').onclick = () => { limpaSelecao(); map.fitBounds(camadaMun.getBounds(), {padding: [16, 16]}); };
  $$('#segNivel button').forEach(b => b.onclick = () => escolheNivel(b.dataset.n));
  const sl = $('#selLoja');
  sl.innerHTML = '<option value="">Entorno de uma loja…</option>' + [...D.lojas].sort((a, b) =>
    D.bai.nomes[a.b].localeCompare(D.bai.nomes[b.b], 'pt-BR') || a.end.localeCompare(b.end, 'pt-BR'))
    .map(l => `<option value="${l.k}">${esc(D.bai.nomes[l.b])} · ${esc(l.end)}</option>`).join('');
  sl.onchange = e => { if (e.target.value === '') limpaSelecao(); else selecionaLoja(+e.target.value, true); };
  $('#btnLojas').onclick = abreLojas;
  $('#filtro').oninput = renderCats;
  const q = $('#q');
  q.oninput = () => buscar(q.value);
  q.onfocus = () => q.value && buscar(q.value);
  q.onblur = () => setTimeout(() => { $('#sugg').hidden = true; }, 150);
  q.onkeydown = e => {
    const itens = $$('#sugg [data-k]');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); if (!itens.length) return;
      sugIdx = (sugIdx + (e.key === 'ArrowDown' ? 1 : -1) + itens.length) % itens.length;
      itens.forEach((d, k) => d.classList.toggle('on', k === sugIdx));
    } else if (e.key === 'Enter') { if (sugAtual.length) vaiPara(sugAtual[Math.max(0, sugIdx)]); }
    else if (e.key === 'Escape') { $('#sugg').hidden = true; }
  };
  const bm = $('#btnMais'), mm = $('#menuMais');
  bm.onclick = e => { e.stopPropagation(); mm.hidden = !mm.hidden; bm.setAttribute('aria-expanded', String(!mm.hidden)); };
  document.addEventListener('click', e => { if (!mm.hidden && !mm.contains(e.target)) { mm.hidden = true; bm.setAttribute('aria-expanded', 'false'); } });
  $$('#menuMais button').forEach(b => b.onclick = () => {
    mm.hidden = true;
    const a = b.dataset.acao;
    if (a === 'ranking') abreRanking();
    else if (a === 'csv') csvNivel();
    else if (a === 'csvlojas') csvLojas();
    else if (a === 'metodo') { renderMetodo(); abreModal('mdMetodo'); }
    else if (a === 'fontes') { renderFontes(); abreModal('mdFontes'); }
    else if (a === 'fundo') {
      S.fundo = !S.fundo; b.setAttribute('aria-pressed', String(S.fundo));
      if (S.fundo) fundo.addTo(map).bringToBack(); else map.removeLayer(fundo);
      desenha();
    }
  });
  $$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m || e.target.closest('.mx')) fechaModais(); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fechaModais(); });
  $('#btnSide').onclick = () => { $('#side').classList.toggle('open'); $('#backdrop').classList.toggle('show', $('#side').classList.contains('open')); };
  $('#backdrop').onclick = () => { fechaSideMobile(); $('#panel').classList.remove('open'); };
  $('#btnFechaPainel').onclick = () => $('#panel').classList.remove('open');
}

/* estado do endereço (#n=…&i=…&u=…&l=…&r=…): na abertura e quando o endereço muda */
function aplicaHash(h) {
  S.ind = h.i && IND[h.i].niv.includes(h.n) ? h.i : (h.i && h.n === 'set' ? 'renda_resp' : (h.i || S.ind));
  if (h.n !== S.nivel) { S.nivel = h.n; $$('#segNivel button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.n === h.n))); }
  if (h.r) S.raio = h.r;
  S.sel = null; S.loja = null; S.foco = null;
  if (h.l) { const l = D.lojas.find(x => x.cnes === h.l); if (l) S.loja = l.k; }
  if (S.loja == null && h.u) {
    const nv = D.set.pos.has(h.u) ? 'set' : (D.bai.pos.has(h.u) ? 'bai' : null);
    if (nv) { const i = D[nv].pos.get(h.u); S.sel = {nv, i, id: h.u}; S.foco = nv === 'bai' ? i : D.set.b[i]; }
  }
  $('#selLoja').value = S.loja != null ? String(S.loja) : '';
  _posCache.clear(); renderCats(); desenha();
  if (S.loja != null) { const l = D.lojas[S.loja]; map.setView([l.y, l.x], S.raio >= 2000 ? 13 : 14); }
  else if (S.sel) map.fitBounds(D[S.sel.nv].bounds[S.sel.i], {padding: [40, 40], maxZoom: S.sel.nv === 'set' ? 17 : 15});
  if (S.loja != null || S.sel) abrePainelMobile();
}

function inicia() {
  if (!P) { document.body.innerHTML = '<p style="padding:24px">Não encontrei dados/poa.js. Rode extracao/4_monta.py.</p>'; return; }
  if (!window.L) { document.body.innerHTML = '<p style="padding:24px">O mapa (Leaflet) não carregou. Ele vem da internet (cdnjs): confira a conexão.</p>'; return; }
  D = prepara();
  if (ehCelular()) $('#camadas').classList.add('fechado');
  iniciaMapa(); liga();
  aplicaHash(lerHash());
  window.addEventListener('hashchange', () => { const h = lerHash(); const atual = new URLSearchParams(location.hash.slice(1)).toString(); if (atual) aplicaHash(h); });
  window.__atlasPoa = {S, get D() { return D; }, P, escolheNivel, escolheIndicador, seleciona, selecionaLoja, limpaSelecao,
    entorno, maisProximos, somaSetores, distM, buscar, classes, decNums, verSetores};
}
document.addEventListener('DOMContentLoaded', inicia);
