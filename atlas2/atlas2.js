/* ═══════════════════════════════════════════════════════════════════════
   Atlas 2.0 — Brasil
   Municípios e bairros do Censo 2022, uma região por vez.
   Dados: dados/brasil.js (sempre) e dados/regiao-<sigla>.js (sob demanda),
   gerados por extracao/4_monta.py. Nada aqui estima valor: o que a fonte não
   publica aparece em branco.
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
    case 'brlc': {
      const a = Math.abs(v);
      if (a >= 1e12) return 'R$ ' + NF[1].format(v / 1e12) + ' tri';
      if (a >= 1e9) return 'R$ ' + NF[1].format(v / 1e9) + ' bi';
      if (a >= 1e6) return 'R$ ' + NF[1].format(v / 1e6) + ' mi';
      return 'R$ ' + NF[0].format(v);
    }
    default: return NF[1].format(v);
  }
}
/* unidade que vai depois do número (as que o próprio formato já mostram ficam de fora) */
const unid = c => (/^pct|^brl/.test(c.fmt) || c.u === 'índice' || c.u === 'nota') ? '' : c.u;

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

/* ─────────────────────────────────────────────── 2. dados e decodificação ── */
const BR = window.ATLAS2_BR;
const CATALOGO = BR ? BR.catalogo : [];
const IND = Object.fromEntries(CATALOGO.map(c => [c.id, c]));
const FONTES = BR ? BR.fontes : {};
const UF_POR_COD = BR ? Object.fromEntries(BR.ufs.map((u, i) => { u.i = i; return [u.cod, u]; })) : {};
const REG_POR_SIG = BR ? Object.fromEntries(BR.regioes.map(r => [r.sig, r])) : {};
const REG_POR_COD = BR ? Object.fromEntries(BR.regioes.map(r => [r.cod, r])) : {};
const NOME_REG = {N: 'Norte', NE: 'Nordeste', CO: 'Centro-Oeste', SE: 'Sudeste', S: 'Sul'};

/* inteiros de tamanho variável (5 bits por caractere, a partir do '?'), em zigue-zague.
   Aritmética comum em vez de operações de bits: códigos de bairro passam de 2^31. */
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
function decCol(s, esc, n) {
  const v = decNums(s);
  if (v.length !== n) throw new Error('coluna com tamanho inesperado');
  return v.map(x => x === 0 ? null : (x > 0 ? (x - 1) / esc : x / esc));
}
function decAnel(s, prec) {           // anel simples (UF, região): [[lat, lng], ...]
  const v = decNums(s), out = []; let x = 0, y = 0;
  for (let i = 0; i < v.length; i += 2) { x += v[i]; y += v[i + 1]; out.push([y / prec, x / prec]); }
  return out;
}
function decGeoSimples(polis, prec) { return polis.map(aneis => aneis.map(r => decAnel(r, prec))); }
function decArcos(arcos, prec) { return arcos.map(s => decAnel(s, prec)); }
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

/* região carregada: colunas decodificadas sob demanda */
function preparaRegiao(R) {
  const prep = nv => {
    const B = R[nv], n = B.n, ids = decIds(B.ids);
    if (ids.length !== n) throw new Error('códigos com tamanho inesperado');
    const arcos = decArcos(B.arcos, R.prec[nv]);
    const cache = {}, fx = {};
    const o = {
      n, ids, nomes: B.nomes, pos: new Map(ids.map((c, i) => [c, i])), raw: B,
      geo: B.g.map(g => decFeicao(g, arcos)),
      col(id) {
        if (!(id in cache)) {
          const s = B.c[id], c = IND[id];
          cache[id] = s == null ? null : decCol(s, id.startsWith('_cob') ? 10 : c.esc, n);
        }
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
      serie(id, i) {             // [[ano, valor], ...] da unidade i
        const s = B.s && B.s[id]; if (!s) return null;
        s._dec = s._dec || s.c.map(c => decCol(c, IND[id].esc, n));
        return s.a.map((a, k) => [a, s._dec[k][i]]);
      },
    };
    o.bounds = o.geo.map(limites);
    o.atip = new Map((B.atip || []).map(([j, setor, media, parte, resto]) => [j, {setor, media, parte, resto}]));
    return o;
  };
  const mun = prep('mun'), bai = prep('bai');
  mun.uf = mun.ids.map(c => Math.floor(c / 100000));
  bai.mun = bai.ids.map(c => Math.floor(c / 1000));
  bai.porMun = new Map();
  bai.mun.forEach((m, i) => { if (!bai.porMun.has(m)) bai.porMun.set(m, []); bai.porMun.get(m).push(i); });
  return {sig: R.sig, nome: R.nome, mun, bai};
}

/* ─────────────────────────────────────────────────────────── 3. estado ── */
const S = {regiao: null, nivel: 'mun', ind: 'pop', uf: null, foco: null, sel: null, escala: 'regiao', fundo: false};
const DADOS = {};                     // sigla → região preparada
const CARGA = {};                     // sigla → promessa de carga

function lerHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  const r = h.get('r'), n = h.get('n'), i = h.get('i'), u = h.get('u'), uf = h.get('uf'), f = h.get('f');
  return {r: REG_POR_SIG[r] ? r : null, n: n === 'bai' ? 'bai' : 'mun', i: IND[i] ? i : null,
          u: u ? Number(u) : null, uf: uf ? Number(uf) : null, f: f ? Number(f) : null};
}
function gravaHash() {
  const h = new URLSearchParams();
  if (S.regiao) h.set('r', S.regiao);
  if (S.nivel !== 'mun') h.set('n', S.nivel);
  h.set('i', S.ind);
  if (S.uf) h.set('uf', S.uf);
  if (S.foco) h.set('f', S.foco);
  if (S.sel) h.set('u', S.sel.id);
  history.replaceState(null, '', '#' + h.toString());
}

/* ─────────────────────────────────────────────── 4. carga de região ── */
function carregaRegiao(sig) {
  if (DADOS[sig]) return Promise.resolve(DADOS[sig]);
  if (CARGA[sig]) return CARGA[sig];
  const R0 = window.ATLAS2_REGIAO && window.ATLAS2_REGIAO[sig];
  CARGA[sig] = new Promise((ok, falha) => {
    const pronto = () => {
      try { DADOS[sig] = preparaRegiao(window.ATLAS2_REGIAO[sig]); ok(DADOS[sig]); }
      catch (e) { falha(e); }
    };
    if (R0) { pronto(); return; }
    // arquivo único: a região vem embutida como JSON e só é lida quando escolhida
    const emb = document.querySelector(`script[type="application/json"][data-regiao="${sig}"]`);
    if (emb) {
      try { (window.ATLAS2_REGIAO = window.ATLAS2_REGIAO || {})[sig] = JSON.parse(emb.textContent); }
      catch (e) { falha(e); return; }
      setTimeout(pronto, 0); return;
    }
    const sc = document.createElement('script');
    sc.src = `dados/regiao-${sig.toLowerCase()}.js`;
    sc.onload = () => (window.ATLAS2_REGIAO && window.ATLAS2_REGIAO[sig]) ? pronto()
      : falha(new Error('arquivo sem os dados da região'));
    sc.onerror = () => falha(new Error(`não encontrei dados/regiao-${sig.toLowerCase()}.js`));
    document.head.appendChild(sc);
  });
  CARGA[sig].catch(() => { delete CARGA[sig]; });
  return CARGA[sig];
}

/* ─────────────────────────────────────────────────── 5. cores e classes ── */
const RAMPAS = {
  seq: ['#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'],
  alerta: ['#ef8a5e', '#e2663a', '#c24e21', '#963a14', '#66260a'],
  neutra: ['#a99ee3', '#8b7ed8', '#6a5bc6', '#4a3aa7', '#2b2068'],
};
const DIV = {quebras: [-10, -2, 2, 10, 25], cores: ['#a8322d', '#e2716c', '#bdb8ad', '#6da7ec', '#256abf', '#0d366b']};
const SEM_DADO = '#CFC9BC';     // a fonte não publica valor
const FORA = '#F4F2EC';         // fora do nível: município sem bairros, UF de outra região
const COM_BAIRRO = '#E0E5EB';   // município com bairros: área fora dos bairros

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

/* ─────────────────────────────────────────────────────────── 6. mapa ── */
let map, rend, camadaUF, camadaRegs, camadaMun, camadaBai, camadaContorno, fundo;
let classeAtual = null, conjuntoAtual = null;

function iniciaMapa() {
  map = L.map('map', {zoomControl: false, preferCanvas: true, minZoom: 3, maxZoom: 16, zoomSnap: 0.25,
                      attributionControl: true, worldCopyJump: false});
  L.control.zoom({position: 'topright'}).addTo(map);
  map.attributionControl.setPrefix(false);
  map.attributionControl.addAttribution('Malhas: IBGE, setores do Censo 2022 (geobr/IPEA)');
  rend = L.canvas({padding: 0.4, tolerance: 2});
  fundo = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {maxZoom: 18, attribution: '© colaboradores do OpenStreetMap'});
  camadaUF = L.layerGroup().addTo(map);
  camadaRegs = L.layerGroup().addTo(map);
  BR.ufs.forEach(u => {
    const pol = L.polygon(decGeoSimples(u.geo, BR.prec.uf), {renderer: rend, weight: 0.8, color: '#ffffff',
      fillColor: SEM_DADO, fillOpacity: 1, interactive: true});
    pol._uf = u; u._layer = pol; u._bounds = pol.getBounds();
    pol.on('mouseover', e => { if (!pol._oculta) { pol.setStyle({weight: 2, color: '#15212E'}); dicaUF(u, e); } });
    pol.on('mousemove', e => moveDica(e.originalEvent));
    pol.on('mouseout', () => { if (!pol._oculta) pol.setStyle({weight: 0.8, color: '#ffffff'}); escondeDica(); });
    pol.on('click', () => { if (!pol._oculta) escolheRegiao(BR.regioes.find(r => r.cod === u.r).sig); });
    camadaUF.addLayer(pol);
  });
  BR.regioes.forEach(r => {
    r._layer = L.polygon(decGeoSimples(r.geo, BR.prec.uf), {renderer: rend, weight: 1.4, color: '#15212E',
      fill: false, interactive: false, opacity: 0.85});
    r._bounds = r._layer.getBounds();
    camadaRegs.addLayer(r._layer);
  });
  map.fitBounds(L.latLngBounds(BR.ufs.map(u => u._bounds)), {padding: [20, 20]});
}

function dicaUF(u, e) {
  const c = IND[S.ind], arr = BR.comp.uf[S.ind];
  const outra = S.regiao && u.r !== REG_POR_SIG[S.regiao].cod;
  const v = arr ? arr[u.i] : null;
  mostraDica(`<b>${esc(u.nome)}</b><br>` +
    (outra ? `<span class="d">Clique para trocar para a região ${esc(NOME_REG[BR.regioes.find(r => r.cod === u.r).sig])}</span>`
      : (arr ? `<span class="v">${fmt(v, c.fmt)}</span> <span class="d">${esc(unid(c))}</span><br><span class="d">${esc(c.n)} · UF</span>`
             : `<span class="d">Sem valor por UF para este indicador. Clique para abrir a região.</span>`)), e.originalEvent);
}

function estiloUFs() {
  const c = IND[S.ind], arr = BR.comp.uf[S.ind];
  const C = arr ? classes(arr, c.rampa) : null;
  const codR = S.regiao ? REG_POR_SIG[S.regiao].cod : null;
  BR.ufs.forEach(u => {
    const pol = u._layer, daRegiao = codR && u.r === codR;
    pol._oculta = !!daRegiao;
    if (daRegiao) { pol.setStyle({fillOpacity: 0, opacity: 0}); return; }
    pol.setStyle({opacity: 1, weight: 0.8, color: '#ffffff', fillOpacity: 1,
      fillColor: S.regiao ? FORA : (C ? cor(arr[u.i], C) : SEM_DADO)});
  });
  BR.regioes.forEach(r => r._layer.setStyle({opacity: r.cod === codR ? 1 : 0.85, weight: r.cod === codR ? 2 : 1.4}));
  return C;
}

/* camadas da região */
function montaCamadas(D) {
  [camadaMun, camadaBai, camadaContorno].forEach(l => l && map.removeLayer(l));
  camadaMun = L.featureGroup(); camadaBai = null; camadaContorno = null;
  D.mun.geo.forEach((g, i) => {
    const pol = L.polygon(g, {renderer: rend, weight: 0.35, color: '#ffffff', fillOpacity: 0.95, fillColor: SEM_DADO});
    pol._i = i; pol._nv = 'mun';
    ligaEventos(pol);
    camadaMun.addLayer(pol);
  });
  camadaMun.addTo(map);
}
function garanteBairros(D) {
  if (camadaBai && camadaBai._sig === D.sig) return;
  camadaBai = L.featureGroup(); camadaBai._sig = D.sig;
  D.bai.geo.forEach((g, i) => {
    const pol = L.polygon(g, {renderer: rend, weight: 0.3, color: '#ffffff', fillOpacity: 0.95, fillColor: SEM_DADO});
    pol._i = i; pol._nv = 'bai';
    ligaEventos(pol);
    camadaBai.addLayer(pol);
  });
  camadaContorno = L.featureGroup(); camadaContorno._sig = D.sig;
  D.mun.geo.forEach((g, i) => {
    if (!D.bai.porMun.has(D.mun.ids[i])) return;
    camadaContorno.addLayer(L.polygon(g, {renderer: rend, weight: 0.9, color: '#46505A', fill: false, interactive: false}));
  });
}
function ligaEventos(pol) {
  pol.on('mouseover', e => { realca(pol, true); dicaUnidade(pol, e.originalEvent); });
  pol.on('mousemove', e => moveDica(e.originalEvent));
  pol.on('mouseout', () => { realca(pol, false); escondeDica(); });
  pol.on('click', () => {
    const D = DADOS[S.regiao];
    // longe, um bairro é pequeno demais: o clique aproxima o município e mostra os bairros dele
    if (S.nivel === 'bai') {
      const cm = pol._nv === 'bai' ? D.bai.mun[pol._i] : D.mun.ids[pol._i];
      if (D.bai.porMun.has(cm) && (map.getZoom() < 9.5 || pol._nv === 'mun') && S.foco !== cm) { verBairros(cm); return; }
    }
    seleciona(pol._nv, pol._i, false);
  });
}
function realca(pol, on) {
  const sel = S.sel && S.sel.nv === pol._nv && S.sel.i === pol._i;
  if (sel) return;
  if (on) {
    if (S.nivel === 'bai' && pol._nv === 'mun' && DADOS[S.regiao].bai.porMun.has(DADOS[S.regiao].mun.ids[pol._i])) return;
    pol.setStyle({weight: 1.6, color: '#15212E'}); pol.bringToFront();
  } else {
    pol.setStyle(estilo(pol));
    if (S.nivel === 'bai' && camadaContorno && map.hasLayer(camadaContorno)) camadaContorno.bringToFront();
  }
}
/* estilo de um polígono da região, conforme o estado */
function estilo(pol) {
  const D = DADOS[S.regiao], nv = pol._nv, i = pol._i;
  const sel = S.sel && S.sel.nv === nv && S.sel.i === i;
  if (nv === 'mun' && S.nivel === 'bai') {
    const tem = D.bai.porMun.has(D.mun.ids[i]);
    // selecionado, vem para a frente: só o contorno, para não cobrir os bairros
    return {fillColor: tem ? COM_BAIRRO : FORA, fillOpacity: (sel && tem) ? 0 : (S.fundo ? 0.5 : 1), weight: sel ? 2.6 : 0.35,
            color: sel ? '#15212E' : (tem ? 'rgba(0,0,0,0)' : '#d8d3c8')};
  }
  const vals = D[nv].col(S.ind);
  const dentro = conjuntoAtual && conjuntoAtual.nv === nv ? conjuntoAtual.set.has(i) : true;
  return {fillColor: vals ? cor(vals[i], classeAtual) : SEM_DADO, fillOpacity: dentro ? (S.fundo ? 0.72 : 0.95) : 0.22,
          weight: sel ? 2.6 : (nv === 'bai' ? 0.3 : 0.35), color: sel ? '#15212E' : '#ffffff'};
}

/* conjunto de unidades que entram nas classes, no ranking e na legenda */
function conjunto() {
  const D = DADOS[S.regiao]; if (!D) return null;
  if (S.nivel === 'mun') {
    const idx = [];
    for (let i = 0; i < D.mun.n; i++) if (!S.uf || D.mun.uf[i] === S.uf) idx.push(i);
    return {nv: 'mun', idx, set: new Set(idx), rot: S.uf ? UF_POR_COD[S.uf].nome : `região ${D.nome}`};
  }
  let idx = [];
  if (S.foco && S.escala === 'foco' && D.bai.porMun.has(S.foco)) idx = D.bai.porMun.get(S.foco).slice();
  else for (let i = 0; i < D.bai.n; i++) if (!S.uf || Math.floor(D.bai.mun[i] / 100000) === S.uf) idx.push(i);
  const rot = (S.foco && S.escala === 'foco') ? nomeMun(S.foco) : (S.uf ? UF_POR_COD[S.uf].nome : `região ${D.nome}`);
  return {nv: 'bai', idx, set: new Set(idx), rot};
}
function nomeMun(cod) {
  const D = DADOS[S.regiao];
  if (D && D.mun.pos.has(cod)) return D.mun.nomes[D.mun.pos.get(cod)];
  const k = BR.busca.ids.indexOf(cod); return k >= 0 ? BR.busca.nomes[k] : String(cod);
}

function desenha() {
  const c = IND[S.ind];
  if (!S.regiao) {
    const C = estiloUFs(); classeAtual = C; conjuntoAtual = null;
    renderCard(); renderLegenda(C ? {C, vals: BR.comp.uf[S.ind]} : null); renderPainel(); gravaHash();
    return;
  }
  estiloUFs();
  const D = DADOS[S.regiao];
  const K = conjunto(); conjuntoAtual = K;
  const B = D[K.nv], vals = B.col(S.ind);
  const C = vals ? classes(K.idx.map(i => vals[i]), c.rampa) : null;
  classeAtual = C;
  if (S.nivel === 'mun') {
    if (camadaBai) { map.removeLayer(camadaBai); map.removeLayer(camadaContorno); }
    if (!map.hasLayer(camadaMun)) camadaMun.addTo(map);
    camadaMun.eachLayer(pol => pol.setStyle(estilo(pol)));
  } else {
    garanteBairros(D);
    if (!map.hasLayer(camadaMun)) camadaMun.addTo(map);
    camadaMun.eachLayer(pol => pol.setStyle(estilo(pol)));
    if (!map.hasLayer(camadaBai)) camadaBai.addTo(map);
    camadaBai.eachLayer(pol => pol.setStyle(estilo(pol)));
    if (!map.hasLayer(camadaContorno)) camadaContorno.addTo(map);
    camadaContorno.bringToFront();
    if (S.sel && S.sel.nv === 'bai') camadaBai.getLayers()[S.sel.i].bringToFront();
  }
  if (S.sel && S.sel.nv === 'mun') camadaMun.getLayers()[S.sel.i].bringToFront();
  renderCard(); renderLegenda(C ? {C, vals: K.idx.map(i => vals[i])} : null); renderPainel(); gravaHash();
}

/* dica do mapa */
function mostraDica(html, ev) { const t = $('#tip'); t.innerHTML = html; t.hidden = false; moveDica(ev); }
function moveDica(ev) {
  const t = $('#tip'); if (t.hidden || !ev) return;
  const x = ev.clientX + 14, y = ev.clientY + 14, w = t.offsetWidth, h = t.offsetHeight;
  t.style.left = Math.min(x, innerWidth - w - 8) + 'px'; t.style.top = Math.min(y, innerHeight - h - 8) + 'px';
}
function escondeDica() { $('#tip').hidden = true; }
function dicaUnidade(pol, ev) {
  const D = DADOS[S.regiao], c = IND[S.ind], nv = pol._nv, i = pol._i;
  if (S.nivel === 'bai' && nv === 'mun') {
    const tem = D.bai.porMun.has(D.mun.ids[i]);
    const nb = tem ? D.bai.porMun.get(D.mun.ids[i]).length : 0;
    mostraDica(`<b>${esc(D.mun.nomes[i])}</b> · ${UF_POR_COD[D.mun.uf[i]].sigla}<br><span class="d">${tem
      ? (S.foco === D.mun.ids[i] ? 'Área do município fora dos bairros.' : `Clique para ver os ${nb} bairros.`)
      : 'O IBGE não delimitou bairros neste município. Clique para ver a ficha do município.'}</span>`, ev);
    return;
  }
  const B = D[nv], vals = B.col(S.ind);
  const titulo = nv === 'mun' ? `<b>${esc(B.nomes[i])}</b> · ${UF_POR_COD[D.mun.uf[i]].sigla}`
    : `<b>${esc(B.nomes[i])}</b><br><span class="d">${esc(nomeMun(D.bai.mun[i]))} · ${UF_POR_COD[Math.floor(D.bai.mun[i] / 100000)].sigla}</span>`;
  let corpo;
  if (!c.niv.includes(nv)) corpo = `<span class="d">Indicador só existe por município.</span>`;
  else {
    const v = vals ? vals[i] : null, fx = B.faixa(S.ind).get(i);
    const pos = posicao(nv, i);
    corpo = `<span class="v">${fmt(v, c.fmt)}</span> <span class="d">${esc(unid(c))}</span>` +
      (fx ? `<br><span class="d">entre ${fmt(fx[0], c.fmt)} e ${fmt(fx[1], c.fmt)} (sigilo do IBGE)</span>` : '') +
      (v == null ? `<br><span class="d">${esc(motivoSemValor(c, nv))}</span>` : '') +
      (S.ind === 'renda_resp' && B.atip.has(i) ? `<br><span class="d">puxado por um setor atípico; sem ele, ${fmt(B.atip.get(i).resto, 'brl0')}</span>` : '') +
      (pos ? `<br><span class="d">${ord(pos[0])} maior de ${NF[0].format(pos[1])} (${esc(conjuntoAtual.rot)})</span>` : '');
  }
  mostraDica(titulo + '<br>' + corpo, ev);
}
function motivoSemValor(c, nv) {
  if (c.fonte === 'CENSO22') return nv === 'bai'
    ? 'Sem valor: o IBGE omitiu os setores deste bairro (sigilo) ou o indicador não se aplica.'
    : 'Sem valor: setores com dado omitido pelo IBGE ou indicador que não se aplica.';
  if (c.fonte === 'ATLAS') return 'O Atlas Brasil não publica este município (criado depois de 2010).';
  if (c.fonte === 'SNIS') return 'O município não informou este indicador ao SNIS.';
  if (c.fonte === 'IDEB') return 'O INEP não publicou o IDEB desta etapa no município.';
  return 'A fonte não publica valor para esta unidade.';
}
const _posCache = new Map();
function posicao(nv, i) {
  const K = conjuntoAtual; if (!K || K.nv !== nv) return null;
  const chave = `${S.regiao}|${nv}|${S.ind}|${S.uf}|${S.foco}|${S.escala}`;
  let m = _posCache.get(chave);
  if (!m) {
    const vals = DADOS[S.regiao][nv].col(S.ind); if (!vals) return null;
    const ord_ = K.idx.filter(j => vals[j] != null).sort((a, b) => vals[b] - vals[a]);
    m = {pos: new Map(), n: ord_.length};
    let r = 0, ant = null;
    ord_.forEach((j, k) => { if (vals[j] !== ant) { r = k + 1; ant = vals[j]; } m.pos.set(j, r); });
    _posCache.clear(); _posCache.set(chave, m);
  }
  return m.pos.has(i) ? [m.pos.get(i), m.n] : null;
}

/* ───────────────────────────────────────────── 7. cartão e legenda ── */
function seloFonte(c) {
  const f = FONTES[c.fonte], calc = !!c.calc;
  return `<span class="selo ${calc ? 'calc' : ''}" title="${esc(calc ? 'Cálculo do Atlas: ' + c.calc : f.n)}"><span class="dot"></span>${esc(f ? f.s : c.fonte)} · ${c.ano}${calc ? ' · cálculo do Atlas' : ''}</span>`;
}
function renderCard() {
  const c = IND[S.ind], el = $('#cardMapa');
  let meta = [seloFonte(c)];
  if (!S.regiao) {
    meta.push(BR.comp.uf[S.ind] ? 'por UF · escolha uma região para ver municípios e bairros'
      : 'sem valor por UF: escolha uma região para ver o indicador');
  } else {
    const K = conjuntoAtual, vals = DADOS[S.regiao][K.nv].col(S.ind);
    const com = vals ? K.idx.filter(i => vals[i] != null).length : 0;
    meta.push(`${S.nivel === 'mun' ? 'municípios' : 'bairros'} · ${esc(K.rot)}`);
    meta.push(`${NF[0].format(com)} de ${NF[0].format(K.idx.length)} com dado`);
    if (S.nivel === 'bai' && map.getZoom() < 9.5) meta.push('aproxime ou clique num município para ver os bairros');
  }
  el.innerHTML = `<h1>${esc(c.n)}${unid(c) ? ` <span class="muted" style="font-weight:400">(${esc(c.u)})</span>` : ''}</h1>
    <div class="meta">${meta.join('<span aria-hidden="true">·</span>')}</div>`;
}
function renderLegenda(L_) {
  const el = $('#legenda'), c = IND[S.ind];
  if (!L_) { el.innerHTML = `<h3>${esc(c.n)}</h3><div class="lin"><span class="sw" style="background:${SEM_DADO}"></span>sem valor neste nível</div>`; return; }
  const {C} = L_;
  const vals = L_.vals.filter(v => v != null);
  const mn = vals.length ? Math.min(...vals) : null, mx = vals.length ? Math.max(...vals) : null;
  const linhas = [];
  const q = C.quebras;
  for (let k = 0; k < C.cores.length; k++) {
    let rot;
    if (q.length === 0) rot = vals.length ? `${fmt(mn, c.fmt)}${mx !== mn ? ' a ' + fmt(mx, c.fmt) : ''}` : '—';
    else if (k === 0) rot = `até ${fmt(q[0], c.fmt)}`;
    else if (k === C.cores.length - 1) rot = `acima de ${fmt(q[q.length - 1], c.fmt)}`;
    else rot = `${fmt(q[k - 1], c.fmt)} a ${fmt(q[k], c.fmt)}`;
    linhas.push(`<div class="lin"><span class="sw" style="background:${C.cores[k]}"></span>${rot}</div>`);
  }
  linhas.push(`<div class="lin"><span class="sw" style="background:${SEM_DADO}"></span>sem dado</div>`);
  if (S.regiao && S.nivel === 'bai') {
    linhas.push(`<div class="lin"><span class="sw" style="background:${COM_BAIRRO}"></span>município com bairros, fora deles</div>`);
    linhas.push(`<div class="lin"><span class="sw" style="background:${FORA}"></span>município sem bairros no IBGE</div>`);
  }
  const tipo = c.rampa === 'div' ? 'faixas fixas em torno de zero' : 'quintis (cinco grupos com o mesmo número de unidades)';
  let escala = '';
  if (S.regiao && S.nivel === 'bai' && S.foco && DADOS[S.regiao].bai.porMun.has(S.foco)) {
    escala = `<div class="esc" role="group" aria-label="Unidades que entram nas classes">
      <button type="button" data-esc="foco" aria-pressed="${S.escala === 'foco'}">${esc(nomeMun(S.foco))}</button>
      <button type="button" data-esc="regiao" aria-pressed="${S.escala !== 'foco'}">${S.uf ? esc(UF_POR_COD[S.uf].sigla) : 'região'}</button></div>`;
  }
  el.innerHTML = `<h3>${S.regiao ? '' : 'UFs · '}${tipo}</h3>${linhas.join('')}${escala}`;
  $$('[data-esc]', el).forEach(b => b.onclick = () => { S.escala = b.dataset.esc; desenha(); });
}

/* ─────────────────────────────────────────────────── 8. seleção ── */
function seleciona(nv, i, zoom) {
  const D = DADOS[S.regiao]; if (!D) return;
  S.sel = {nv, i, id: D[nv].ids[i]};
  // bairro de outro município: o foco das classes passa a ser o município dele
  if (nv === 'bai' && S.foco && S.foco !== D.bai.mun[i]) S.foco = D.bai.mun[i];
  if (zoom) map.fitBounds(D[nv].bounds[i], {padding: [40, 40], maxZoom: nv === 'bai' ? 15 : 11});
  desenha();
  abrePainelMobile();
}
function limpaSelecao() { S.sel = null; desenha(); }

/* ──────────────────────────────────────────── 9. troca de região/nível ── */
async function escolheRegiao(sig, depois) {
  if (!REG_POR_SIG[sig]) return;
  if (S.regiao === sig && !depois) { map.fitBounds(REG_POR_SIG[sig]._bounds, {padding: [20, 20]}); return; }
  const mudou = S.regiao !== sig;
  marcaRegiao(sig);
  const R = REG_POR_SIG[sig];
  $('#carregando').textContent = `Carregando a região ${R.nome}: ${NF[0].format(R.n_mun)} municípios e ${NF[0].format(R.n_bai)} bairros` +
    (R.mb ? ` (${NF[1].format(R.mb)} MB)…` : '…');
  $('#carregando').hidden = false; $('#convite').hidden = true;
  try {
    const D = await carregaRegiao(sig);
    if (mudou) {
      liberaOutras(sig);
      S.regiao = sig; S.sel = null; S.uf = null; S.foco = null; S.escala = 'regiao';
      montaCamadas(D);
      camadaBai = null;
      preencheUFs();
      map.fitBounds(R._bounds, {padding: [20, 20]});
    }
    if (depois) depois(D);
    if (S.nivel === 'bai' && !IND[S.ind].niv.includes('bai')) S.ind = 'pop';
    renderCats(); desenha();
  } catch (e) {
    marcaRegiao(S.regiao);
    toast(`Não consegui abrir a região ${R.nome}: ${e.message}. Rode extracao/4_monta.py.`);
  } finally { $('#carregando').hidden = true; }
}
/* uma região por vez também na memória: as outras saem ao trocar */
function liberaOutras(sig) {
  for (const k of Object.keys(DADOS)) if (k !== sig) delete DADOS[k];
  for (const k of Object.keys(CARGA)) if (k !== sig) delete CARGA[k];
  if (window.ATLAS2_REGIAO) for (const k of Object.keys(window.ATLAS2_REGIAO)) if (k !== sig) delete window.ATLAS2_REGIAO[k];
  _posCache.clear();
}
function marcaRegiao(sig) {
  $$('#segRegiao button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.r === sig)));
  $('#selRegiaoMob').value = sig || '';
}
function preencheUFs() {
  const s = $('#selUF');
  if (!S.regiao) { s.innerHTML = '<option value="">Todas as UFs</option>'; s.disabled = true; return; }
  const R = REG_POR_SIG[S.regiao];
  s.innerHTML = `<option value="">Todas as UFs da região</option>` +
    R.ufs.map(u => `<option value="${u}">${esc(UF_POR_COD[u].nome)}</option>`).join('');
  s.disabled = false; s.value = S.uf || '';
}
function escolheNivel(n) {
  if (n === S.nivel) return;
  if (n === 'bai' && !S.regiao) { toast('Escolha uma região para ver os bairros.'); return; }
  S.nivel = n;
  $$('#segNivel button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.n === n)));
  if (n === 'mun') { S.foco = null; S.escala = 'regiao'; if (S.sel && S.sel.nv === 'bai') S.sel = null; }
  if (n === 'bai' && !IND[S.ind].niv.includes('bai')) {
    toast(`“${IND[S.ind].n}” só existe por município. Mostrando a população.`);
    S.ind = 'pop';
  }
  renderCats(); desenha();
}
function verBairros(codMun) {
  const D = DADOS[S.regiao]; if (!D || !D.bai.porMun.has(codMun)) return;
  S.foco = codMun; S.escala = 'foco';
  const i = D.mun.pos.get(codMun);
  if (S.nivel !== 'bai') {
    S.nivel = 'bai';
    $$('#segNivel button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.n === 'bai')));
    if (!IND[S.ind].niv.includes('bai')) S.ind = 'pop';
    renderCats();
  }
  S.sel = {nv: 'mun', i, id: codMun};
  map.fitBounds(D.mun.bounds[i], {padding: [30, 30]});
  desenha();
}
function escolheIndicador(id) {
  if (!IND[id]) return;
  if (S.nivel === 'bai' && !IND[id].niv.includes('bai')) { toast('Este indicador só existe por município.'); return; }
  S.ind = id;
  $$('.ind').forEach(b => b.classList.toggle('on', b.dataset.id === id));
  desenha();
}

/* ───────────────────────────────────────────── 10. catálogo lateral ── */
function renderCats() {
  const filtro = norm($('#filtro').value);
  const fechadas = new Set($$('.cat.fechada').map(c => c.dataset.cat));
  const nv = S.nivel;
  let total = 0;
  $('#cats').innerHTML = BR.cats.map(cat => {
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
          <span class="mt">${esc(FONTES[c.fonte].s)} · ${c.ano} · ${c.niv.includes('bai') ? 'município e bairro' : 'município'}${ok ? '' : ' (troque para município)'}</span></button>`;
      }).join('')}</div></div>`;
  }).join('');
  $('#nInd').textContent = `${total}`;
  $('#sideNota').textContent = nv === 'bai'
    ? 'No nível de bairro só entram os indicadores do Censo 2022 por setor.'
    : 'Valores do município; os do Censo 2022 também existem por bairro.';
  $$('.cat > button').forEach(b => b.onclick = () => { b.parentElement.classList.toggle('fechada'); b.setAttribute('aria-expanded', String(!b.parentElement.classList.contains('fechada'))); });
  $$('.ind').forEach(b => b.onclick = () => { escolheIndicador(b.dataset.id); fechaSideMobile(); });
}

/* ───────────────────────────────────────────────────────── 11. ficha ── */
function valorComp(nv, id, idx) {
  const a = BR.comp[nv] && BR.comp[nv][id];
  return a ? a[idx] : null;
}
function linhaComp(rot, v, c, eu, maxAbs) {
  const w = (v != null && maxAbs) ? Math.max(2, Math.round(70 * Math.abs(v) / maxAbs)) : 0;
  return `<tr class="${eu ? 'eu' : ''}"><td>${esc(rot)}</td><td>${fmt(v, c.fmt)}${w ? `<span class="bar" style="width:${w}px;${eu ? 'background:var(--s1)' : ''}"></span>` : ''}</td></tr>`;
}
function blocoDestaque(nv, i) {
  const D = DADOS[S.regiao], c = IND[S.ind], B = D[nv];
  if (!c.niv.includes(nv)) return `<div class="bloco"><div class="nota">“${esc(c.n)}” só existe por município.</div></div>`;
  const v = B.col(S.ind)[i], fx = B.faixa(S.ind).get(i);
  const uf = nv === 'mun' ? D.mun.uf[i] : Math.floor(D.bai.mun[i] / 100000);
  const ufo = UF_POR_COD[uf], reg = REG_POR_SIG[S.regiao];
  const linhas = [];
  linhas.push([nv === 'mun' ? B.nomes[i] : B.nomes[i], v, true]);
  if (nv === 'bai') {
    const im = D.mun.pos.get(D.bai.mun[i]);
    if (c.niv.includes('mun')) linhas.push([D.mun.nomes[im], D.mun.col(S.ind)[im], false]);
  }
  linhas.push([`${ufo.nome} (UF)`, valorComp('uf', S.ind, ufo.i), false]);
  linhas.push([`Região ${reg.nome}`, valorComp('reg', S.ind, reg.cod - 1), false]);
  linhas.push(['Brasil', valorComp('br', S.ind, 0), false]);
  const vis = linhas.filter(l => l[1] != null || l[2]);
  const maxAbs = Math.max(...vis.map(l => Math.abs(l[1] ?? 0)));
  const pos = posicao(nv, i);
  const cobp = B.col('_cob_p')?.[i], cobd = B.col('_cob_d')?.[i];
  let notas = '';
  if (fx) notas += `<div class="nota">Entre ${fmt(fx[0], c.fmt)} e ${fmt(fx[1], c.fmt)}: o IBGE omite contagens de 1 e 2 em cada setor e, aqui, não dá para recuperar todas pela diferença. O mapa usa o meio do intervalo.</div>`;
  if (c.fonte === 'CENSO22' && v != null) {
    const cob = ['pct_agua_rede', 'pct_agua_poco', 'pct_agua_naoenc', 'pct_banheiro', 'pct_sem_banheiro', 'pct_esgoto_rede',
      'pct_esgoto_fossa', 'pct_esgoto_precario', 'pct_lixo_coleta', 'pct_lixo_queima', 'pct_apto', 'pct_comodos', 'mor_dom', 'cob_entorno'].includes(S.ind) ? cobd : cobp;
    if (cob != null && !['pop', 'dom', 'area', 'dens', 'pct_urb', 'pct_fcu'].includes(S.ind) && !c.cat.startsWith('entorno'))
      notas += `<div class="nota">Calculado sobre os setores com dado, que somam ${NF[1].format(cob)}% da população; o IBGE omitiu os outros (sigilo).</div>`;
    if (c.cat === 'entorno' && S.ind !== 'cob_entorno') {
      const ce = B.col('cob_entorno')?.[i];
      if (ce != null && ce < 99.95) notas += `<div class="nota">A pesquisa do entorno cobre ${NF[1].format(ce)}% dos moradores daqui; o resto, em geral zona rural, não entra.</div>`;
    }
  }
  if (S.ind === 'renda_resp' && B.atip.has(i)) notas += notaAtipico(B.atip.get(i));
  if (v == null) notas += `<div class="nota warn">${esc(motivoSemValor(c, nv))}</div>`;
  return `<div class="bloco destaque">
    <div class="rot">${esc(c.n)}</div>
    <div class="val">${fmt(v, c.fmt)}${unid(c) ? `<small>${esc(c.u)}</small>` : ''}</div>
    ${seloFonte(c)}
    ${pos ? `<div class="rank">${ord(pos[0])} maior valor entre ${NF[0].format(pos[1])} ${nv === 'mun' ? 'municípios' : 'bairros'} com dado (${esc(conjuntoAtual.rot)})</div>` : ''}
    <table class="comp">${vis.map(l => linhaComp(l[0], l[1], c, l[2], maxAbs)).join('')}</table>
    ${notas}
    ${graficoSerie(nv, i)}
  </div>`;
}

function notaAtipico(a) {
  return `<div class="nota warn">Um setor sozinho puxa esta média: o setor ${a.setor} tem rendimento médio de ${fmt(a.media, 'brl0')} e responde por ${NF[0].format(100 * a.parte)}% da renda somada. Sem ele, a média dos outros setores é ${fmt(a.resto, 'brl0')}. O Atlas mostra o valor como o IBGE publica.</div>`;
}

/* gráfico da série: município, UF e Brasil (cores validadas, rótulo na ponta, cruz ao passar o mouse) */
function graficoSerie(nv, i) {
  const c = IND[S.ind]; if (nv !== 'mun' || !c.serie) return '';
  const D = DADOS[S.regiao], s = D.mun.serie(S.ind, i); if (!s || s.filter(p => p[1] != null).length < 2) return '';
  const uf = UF_POR_COD[D.mun.uf[i]], cs = BR.comp_s[S.ind];
  const series = [{rot: D.mun.nomes[i], cor: 'var(--s1)', pts: s}];
  if (cs) {
    const pu = s.map(([a]) => [a, cs.uf[a] ? cs.uf[a][uf.i] : null]);
    if (pu.some(p => p[1] != null)) series.push({rot: uf.sigla, cor: 'var(--s2)', pts: pu});
    const pb = s.map(([a]) => [a, cs.br[a] ?? null]);
    if (pb.some(p => p[1] != null)) series.push({rot: 'Brasil', cor: 'var(--s3)', pts: pb});
  }
  const W = 340, H = 150, m = {l: 40, r: 64, t: 10, b: 22};
  const anos = s.map(p => p[0]);
  const todos = series.flatMap(x => x.pts.map(p => p[1])).filter(v => v != null);
  let lo = Math.min(...todos), hi = Math.max(...todos);
  if (lo === hi) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
  if (lo > 0 && lo < (hi - lo) * 0.5) lo = 0;
  const X = a => m.l + (anos.length === 1 ? 0 : (a - anos[0]) / (anos[anos.length - 1] - anos[0]) * (W - m.l - m.r));
  const Y = v => m.t + (1 - (v - lo) / (hi - lo)) * (H - m.t - m.b);
  const ticks = [lo, (lo + hi) / 2, hi];
  const fmtEixo = v => c.fmt === 'brlc' ? fmt(v, 'brlc') : (c.fmt.startsWith('brl') ? NF[0].format(v) : fmt(v, c.fmt.replace('pct', 'dec')));
  const linhas = series.map(se => {
    const seg = []; let cur = [];
    se.pts.forEach(([a, v]) => { if (v == null) { if (cur.length) seg.push(cur); cur = []; } else cur.push(`${X(a).toFixed(1)},${Y(v).toFixed(1)}`); });
    if (cur.length) seg.push(cur);
    return seg.map(p => `<polyline points="${p.join(' ')}" fill="none" stroke="${se.cor}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`).join('') +
      se.pts.filter(p => p[1] != null).map(([a, v]) => `<circle cx="${X(a).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="3.5" fill="${se.cor}" stroke="var(--bg2)" stroke-width="1.5"/>`).join('');
  }).join('');
  // rótulos na ponta direita, sem sobreposição
  const ult = series.map(se => { const p = se.pts.filter(q => q[1] != null).pop(); return p ? {se, y: Y(p[1]), v: p[1]} : null; }).filter(Boolean).sort((a, b) => a.y - b.y);
  for (let k = 1; k < ult.length; k++) if (ult[k].y - ult[k - 1].y < 12) ult[k].y = ult[k - 1].y + 12;
  const rots = ult.map(u => `<text class="lab" x="${W - m.r + 6}" y="${(u.y + 4).toFixed(1)}">${esc(u.se.rot.length > 12 ? u.se.rot.slice(0, 11) + '…' : u.se.rot)}</text>`).join('');
  const eixoX = anos.filter((a, k) => k === 0 || k === anos.length - 1 || anos.length <= 4 || k === Math.floor(anos.length / 2))
    .map(a => `<text class="ax" x="${X(a).toFixed(1)}" y="${H - 6}" text-anchor="middle">${a}</text>`).join('');
  const eixoY = ticks.map(t => `<line class="gr" x1="${m.l}" x2="${W - m.r}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}"/>` +
    `<text class="ax" x="${m.l - 6}" y="${(Y(t) + 3.5).toFixed(1)}" text-anchor="end">${fmtEixo(t)}</text>`).join('');
  const dados = encodeURIComponent(JSON.stringify(series.map(se => ({rot: se.rot, pts: se.pts}))));
  return `<div class="serie" data-serie="${dados}" data-fmt="${c.fmt}" data-x0="${anos[0]}" data-x1="${anos[anos.length - 1]}" data-ml="${m.l}" data-mr="${m.r}" data-w="${W}" data-h="${H}">
    <div class="leg">${series.map(se => `<span><i style="background:${se.cor}"></i>${esc(se.rot)}</span>`).join('')}</div>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Série de ${esc(c.n)}">
      ${eixoY}${eixoX}${linhas}${rots}
      <line class="cross" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" visibility="hidden"/>
      <rect x="${m.l}" y="0" width="${W - m.l - m.r}" height="${H}" fill="transparent" class="hit"/>
    </svg></div>`;
}
function ligaSeries(raiz) {
  $$('.serie', raiz).forEach(el => {
    const svg = $('svg', el), cross = $('.cross', el), hit = $('.hit', el);
    const series = JSON.parse(decodeURIComponent(el.dataset.serie));
    const f = el.dataset.fmt, x0 = +el.dataset.x0, x1 = +el.dataset.x1, ml = +el.dataset.ml, mr = +el.dataset.mr, W = +el.dataset.w;
    const anos = series[0].pts.map(p => p[0]);
    const X = a => ml + (a - x0) / (x1 - x0 || 1) * (W - ml - mr);
    hit.addEventListener('mousemove', ev => {
      const r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) * W / r.width;
      let a = anos[0];
      for (const y of anos) if (Math.abs(X(y) - x) < Math.abs(X(a) - x)) a = y;
      const cx = X(a);
      cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.setAttribute('visibility', 'visible');
      mostraDica(`<b>${a}</b><br>` + series.map(se => { const p = se.pts.find(q => q[0] === a); return `${esc(se.rot)}: <span class="v">${fmt(p ? p[1] : null, f)}</span>`; }).join('<br>'), ev);
    });
    hit.addEventListener('mouseleave', () => { cross.setAttribute('visibility', 'hidden'); escondeDica(); });
  });
}

function fichaMunicipio(i) {
  const D = DADOS[S.regiao], M = D.mun, cod = M.ids[i], uf = UF_POR_COD[M.uf[i]];
  const nb = D.bai.porMun.has(cod) ? D.bai.porMun.get(cod).length : 0;
  const v = id => M.col(id)?.[i];
  const chips = [`<span class="chip"><b>${fmt(v('pop'), 'int')}</b> pessoas (2022)</span>`,
    `<span class="chip"><b>${fmt(v('area'), 'dec1')}</b> km²</span>`,
    v('idhm') != null ? `<span class="chip">IDHM 2010 <b>${fmt(v('idhm'), 'dec3')}</b></span>` : '',
    `<span class="chip">${nb ? `<b>${nb}</b> bairros no IBGE` : 'sem bairros no IBGE'}</span>`].join('');
  const acoes = [nb ? `<button type="button" class="btn pri" data-acao="bairros">Ver os ${nb} bairros</button>` : '',
    `<button type="button" class="btn" data-acao="zoom">Aproximar</button>`,
    `<button type="button" class="btn" data-acao="csvficha">Baixar a ficha (CSV)</button>`,
    `<button type="button" class="btn" data-acao="limpa">Voltar à região</button>`].join('');
  return `<div class="eyebrow f-eyebrow">Município · ${esc(uf.nome)}</div>
    <h2 class="f-nome">${esc(M.nomes[i])}</h2>
    <div class="f-sub">Código IBGE ${cod} · região ${esc(D.nome)}</div>
    <div class="chips">${chips}</div><div class="acoes">${acoes}</div>
    ${blocoDestaque('mun', i)}
    ${listaIndicadores('mun', i)}`;
}
function fichaBairro(i) {
  const D = DADOS[S.regiao], B = D.bai, cm = B.mun[i], uf = UF_POR_COD[Math.floor(cm / 100000)];
  const v = id => B.col(id)?.[i];
  const nb = D.bai.porMun.get(cm).length;
  const chips = [`<span class="chip"><b>${fmt(v('pop'), 'int')}</b> pessoas (2022)</span>`,
    `<span class="chip"><b>${fmt(v('area'), 'dec2')}</b> km²</span>`,
    v('renda_resp') != null ? `<span class="chip">rendimento do responsável <b>${fmt(v('renda_resp'), 'brl0')}</b></span>` : ''].join('');
  const acoes = [`<button type="button" class="btn" data-acao="municipio">Ficha de ${esc(nomeMun(cm))}</button>`,
    `<button type="button" class="btn" data-acao="zoom">Aproximar</button>`,
    `<button type="button" class="btn" data-acao="csvficha">Baixar a ficha (CSV)</button>`].join('');
  return `<div class="eyebrow f-eyebrow">Bairro · ${esc(nomeMun(cm))} (${uf.sigla})</div>
    <h2 class="f-nome">${esc(B.nomes[i])}</h2>
    <div class="f-sub">Código IBGE ${B.ids[i]} · um dos ${nb} bairros do município</div>
    <div class="chips">${chips}</div><div class="acoes">${acoes}</div>
    ${blocoDestaque('bai', i)}
    ${listaIndicadores('bai', i)}`;
}
function listaIndicadores(nv, i) {
  const B = DADOS[S.regiao][nv];
  return BR.cats.map(cat => {
    const lista = CATALOGO.filter(c => c.cat === cat.id && c.niv.includes(nv));
    if (!lista.length) return '';
    return `<div class="grupo"><h4>${esc(cat.n)}</h4>${lista.map(c => {
      const v = B.col(c.id)?.[i], fx = B.faixa(c.id).get(i);
      const at = c.id === 'renda_resp' && B.atip.has(i) ? ' · puxado por um setor atípico' : '';
      return `<button type="button" class="linha ${c.id === S.ind ? 'on' : ''}" data-id="${c.id}">
        <span class="n">${esc(c.n)}</span><span class="v ${v == null ? 'nd' : ''}">${v == null ? 'sem dado' : (fx ? '≈ ' : '') + fmt(v, c.fmt)}</span>
        <span class="m">${esc(FONTES[c.fonte].s)} · ${c.ano}${unid(c) ? ' · ' + esc(c.u) : ''}${fx ? ` · entre ${fmt(fx[0], c.fmt)} e ${fmt(fx[1], c.fmt)}` : ''}${at}</span></button>`;
    }).join('')}</div>`;
  }).join('');
}
function resumoRegiao() {
  const D = DADOS[S.regiao], R = REG_POR_SIG[S.regiao], c = IND[S.ind], K = conjuntoAtual;
  const B = D[K.nv], vals = B.col(S.ind);
  let blocoInd = '';
  if (vals) {
    const v = K.idx.filter(i => vals[i] != null).sort((a, b) => vals[b] - vals[a]);
    const med = v.length ? vals[v[Math.floor(v.length / 2)]] : null;
    const top = v.slice(0, 5), fim = v.slice(-5).reverse();
    const atip = j => S.ind === 'renda_resp' && B.atip.has(j) ? ' <span class="tag">setor atípico</span>' : '';
    const nome = j => (K.nv === 'mun' ? `${esc(B.nomes[j])} <span class="muted">${UF_POR_COD[D.mun.uf[j]].sigla}</span>`
      : `${esc(B.nomes[j])} <span class="muted">${esc(nomeMun(D.bai.mun[j]))}</span>`) + atip(j);
    const tab = (lista, inv) => `<table class="top5">${lista.map((j, k) => `<tr data-nv="${K.nv}" data-i="${j}"><td>${inv ? NF[0].format(v.length - k) : k + 1}</td><td>${nome(j)}</td><td>${fmt(vals[j], c.fmt)}</td></tr>`).join('')}</table>`;
    const comp = [[`Região ${R.nome}`, valorComp('reg', S.ind, R.cod - 1)], ['Brasil', valorComp('br', S.ind, 0)]].filter(x => x[1] != null);
    blocoInd = `<div class="bloco"><h3>${esc(c.n)}</h3>${seloFonte(c)}
      <div class="dist"><div><span>menor</span><b>${fmt(v.length ? vals[v[v.length - 1]] : null, c.fmt)}</b></div>
        <div><span>mediana</span><b>${fmt(med, c.fmt)}</b></div><div><span>maior</span><b>${fmt(v.length ? vals[v[0]] : null, c.fmt)}</b></div></div>
      ${comp.length ? `<table class="comp">${comp.map(x => `<tr><td>${esc(x[0])}</td><td>${fmt(x[1], c.fmt)}</td></tr>`).join('')}</table>` : ''}
      <h3 style="margin-top:14px">Maiores valores</h3>${tab(top)}
      <h3 style="margin-top:14px">Menores valores</h3>${tab(fim, true)}
      <div class="acoes"><button type="button" class="btn" data-acao="ranking">Ranking completo</button></div></div>`;
  } else blocoInd = `<div class="bloco"><div class="nota">“${esc(c.n)}” só existe por município.</div></div>`;
  return `<div class="eyebrow f-eyebrow">Região</div><h2 class="f-nome">${esc(R.nome)}</h2>
    <div class="f-sub">${R.ufs.map(u => UF_POR_COD[u].sigla).join(', ')}</div>
    <div class="chips"><span class="chip"><b>${fmt(R.pop, 'int')}</b> pessoas (2022)</span>
      <span class="chip"><b>${NF[0].format(R.n_mun)}</b> municípios</span>
      <span class="chip"><b>${NF[0].format(R.n_bai)}</b> bairros em ${R.n_mun_bai} municípios</span></div>
    <p class="muted" style="font-size:12.5px;margin-top:8px">Clique num ${S.nivel === 'mun' ? 'município' : 'bairro'} para ver a ficha. ${S.nivel === 'bai' ? 'Municípios em cinza não têm bairros delimitados pelo IBGE.' : ''}</p>
    ${blocoInd}`;
}
function resumoBrasil() {
  const c = IND[S.ind], arr = BR.comp.uf[S.ind];
  const tot = BR.regioes.reduce((a, r) => a + r.pop, 0), nb = BR.regioes.reduce((a, r) => a + r.n_bai, 0),
    nmb = BR.regioes.reduce((a, r) => a + r.n_mun_bai, 0);
  let blocoInd = '';
  if (arr) {
    const ord_ = BR.ufs.filter(u => arr[u.i] != null).sort((a, b) => arr[b.i] - arr[a.i]);
    blocoInd = `<div class="bloco"><h3>${esc(c.n)} por UF</h3>${seloFonte(c)}
      <table class="comp"><tr class="eu"><td>Brasil</td><td>${fmt(valorComp('br', S.ind, 0), c.fmt)}</td></tr>
      ${ord_.map((u, k) => `<tr><td>${k + 1}. ${esc(u.nome)}</td><td>${fmt(arr[u.i], c.fmt)}</td></tr>`).join('')}</table></div>`;
  } else blocoInd = `<div class="bloco"><div class="nota">Não há valor por UF para “${esc(c.n)}”. Escolha uma região para ver os municípios.</div></div>`;
  return `<div class="eyebrow f-eyebrow">Brasil</div><h2 class="f-nome">Uma região por vez</h2>
    <p class="f-sub" style="margin-top:8px">O Atlas 2.0 cobre os ${NF[0].format(BR.busca.ids.length)} municípios e os ${NF[0].format(nb)} bairros que o IBGE delimitou no Censo 2022 (em ${nmb} municípios). Escolha uma região no topo ou clique no mapa: só ela é carregada.</p>
    <div class="chips"><span class="chip"><b>${fmt(tot, 'int')}</b> pessoas (Censo 2022)</span></div>
    <div class="regs-lista">${BR.regioes.map(r => `<button type="button" data-regiao="${r.sig}"><b>${esc(r.nome)}</b>
      <span>${NF[0].format(r.n_mun)} municípios · ${NF[0].format(r.n_bai)} bairros · ${fmt(r.pop, 'int')} pessoas</span></button>`).join('')}</div>
    ${blocoInd}`;
}
function renderPainel() {
  const b = $('#panelBody');
  if (!S.regiao) b.innerHTML = resumoBrasil();
  else if (S.sel && S.sel.nv === 'mun') b.innerHTML = fichaMunicipio(S.sel.i);
  else if (S.sel && S.sel.nv === 'bai') b.innerHTML = fichaBairro(S.sel.i);
  else b.innerHTML = resumoRegiao();
  $$('[data-regiao]', b).forEach(x => x.onclick = () => escolheRegiao(x.dataset.regiao));
  $$('.linha', b).forEach(x => x.onclick = () => {
    const id = x.dataset.id;
    if (S.nivel === 'bai' && !IND[id].niv.includes('bai')) { escolheNivel('mun'); }
    escolheIndicador(id);
  });
  $$('.top5 tr', b).forEach(x => x.onclick = () => seleciona(x.dataset.nv, +x.dataset.i, true));
  $$('[data-acao]', b).forEach(x => x.onclick = () => acao(x.dataset.acao));
  ligaSeries(b);
}
function acao(a) {
  const D = DADOS[S.regiao];
  if (a === 'bairros' && S.sel) verBairros(S.sel.id);
  else if (a === 'zoom' && S.sel) map.fitBounds(D[S.sel.nv].bounds[S.sel.i], {padding: [40, 40], maxZoom: S.sel.nv === 'bai' ? 15 : 11});
  else if (a === 'limpa') limpaSelecao();
  else if (a === 'municipio' && S.sel) { const cm = D.bai.mun[S.sel.i]; seleciona('mun', D.mun.pos.get(cm), false); }
  else if (a === 'csvficha') csvFicha();
  else if (a === 'ranking') abreRanking();
}

/* ─────────────────────────────────────────────── 12. ranking e CSV ── */
let rkOrdem = -1;
function abreRanking() {
  if (!S.regiao) { toast('Escolha uma região para ver o ranking.'); return; }
  renderRanking(); abreModal('mdRanking');
}
function renderRanking() {
  const D = DADOS[S.regiao], c = IND[S.ind], K = conjuntoAtual, B = D[K.nv], vals = B.col(S.ind);
  const filtro = norm(($('#rkBusca') || {}).value || '');
  const lin = K.idx.filter(i => !filtro || norm(B.nomes[i]).includes(filtro));
  lin.sort((a, b) => { const x = vals ? vals[a] : null, y = vals ? vals[b] : null;
    if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return rkOrdem * (x - y); });
  const lugar = K.nv === 'mun' ? (i => UF_POR_COD[D.mun.uf[i]].sigla) : (i => `${nomeMun(D.bai.mun[i])} (${UF_POR_COD[Math.floor(D.bai.mun[i] / 100000)].sigla})`);
  $('#ttRanking').textContent = `Ranking · ${c.n}`;
  $('#rankBody').innerHTML = `<div class="rk-top"><input id="rkBusca" type="search" placeholder="Filtrar pelo nome" value="${esc(filtro)}">
      <button type="button" class="btn" id="rkOrd">${rkOrdem < 0 ? 'Maior primeiro' : 'Menor primeiro'}</button>
      <button type="button" class="btn" id="rkCSV">Baixar CSV</button>
      <span class="muted" style="font-size:12.5px">${esc(K.nv === 'mun' ? 'Municípios' : 'Bairros')} da ${esc(K.rot)} · ${seloFonte(c)}</span></div>
    <div class="rk-wrap"><table class="tabela"><thead><tr><th class="r">#</th><th>${K.nv === 'mun' ? 'Município' : 'Bairro'}</th><th>${K.nv === 'mun' ? 'UF' : 'Município'}</th><th class="r">${esc(c.n)}${unid(c) ? ` (${esc(c.u)})` : ''}</th></tr></thead>
    <tbody>${lin.map((i, k) => `<tr data-i="${i}"><td class="r">${vals && vals[i] != null ? k + 1 : ''}</td><td>${esc(B.nomes[i])}${S.ind === 'renda_resp' && B.atip.has(i) ? ' <span class="tag">setor atípico</span>' : ''}</td><td>${esc(lugar(i))}</td><td class="r">${fmt(vals ? vals[i] : null, c.fmt)}</td></tr>`).join('')}</tbody></table></div>`;
  const bus = $('#rkBusca');
  bus.oninput = () => { const p = bus.selectionStart; renderRanking(); const n = $('#rkBusca'); n.focus(); n.setSelectionRange(p, p); };
  $('#rkOrd').onclick = () => { rkOrdem = -rkOrdem; renderRanking(); };
  $('#rkCSV').onclick = () => baixaCSV([['posição', 'código IBGE', K.nv === 'mun' ? 'município' : 'bairro', K.nv === 'mun' ? 'UF' : 'município',
    `${c.n} (${c.u}, ${FONTES[c.fonte].s} ${c.ano})`], ...lin.map((i, k) => [vals && vals[i] != null ? k + 1 : '', String(B.ids[i]), B.nomes[i], lugar(i), vals ? vals[i] : ''])],
    `ranking_${S.ind}_${K.nv === 'mun' ? 'municipios' : 'bairros'}_${S.regiao.toLowerCase()}.csv`);
  $$('#rankBody tbody tr').forEach(tr => tr.onclick = () => { fechaModais(); seleciona(K.nv, +tr.dataset.i, true); });
}
function csvNivel() {
  if (!S.regiao) { toast('Escolha uma região para baixar a tabela.'); return; }
  const D = DADOS[S.regiao], K = conjuntoAtual, B = D[K.nv];
  const inds = CATALOGO.filter(c => c.niv.includes(K.nv));
  const cab = ['código IBGE', K.nv === 'mun' ? 'município' : 'bairro', 'UF', ...(K.nv === 'bai' ? ['município'] : [])];
  const cols = [];
  inds.forEach(c => {
    cab.push(`${c.n} (${c.u}; ${FONTES[c.fonte].s} ${c.ano})`); cols.push([c.id, 'v']);
    if (B.faixa(c.id).size) { cab.push(`${c.n}: mínimo pelo sigilo`); cols.push([c.id, 'lo']); cab.push(`${c.n}: máximo pelo sigilo`); cols.push([c.id, 'hi']); }
  });
  const linhas = [cab];
  K.idx.forEach(i => {
    const uf = K.nv === 'mun' ? D.mun.uf[i] : Math.floor(D.bai.mun[i] / 100000);
    const l = [String(B.ids[i]), B.nomes[i], UF_POR_COD[uf].sigla, ...(K.nv === 'bai' ? [nomeMun(D.bai.mun[i])] : [])];
    cols.forEach(([id, t]) => {
      if (t === 'v') { const v = B.col(id)?.[i]; l.push(v == null ? '' : v); }
      else { const f = B.faixa(id).get(i); l.push(f ? f[t === 'lo' ? 0 : 1] : ''); }
    });
    linhas.push(l);
  });
  baixaCSV(linhas, `atlas2_${K.nv === 'mun' ? 'municipios' : 'bairros'}_${S.regiao.toLowerCase()}${S.uf ? '_' + UF_POR_COD[S.uf].sigla.toLowerCase() : ''}.csv`);
}
function csvFicha() {
  const D = DADOS[S.regiao]; if (!S.sel) return;
  const nv = S.sel.nv, i = S.sel.i, B = D[nv];
  const linhas = [['indicador', 'valor', 'unidade', 'mínimo pelo sigilo', 'máximo pelo sigilo', 'fonte', 'ano']];
  CATALOGO.filter(c => c.niv.includes(nv)).forEach(c => {
    const v = B.col(c.id)?.[i], f = B.faixa(c.id).get(i);
    linhas.push([c.n, v == null ? '' : v, c.u, f ? f[0] : '', f ? f[1] : '', FONTES[c.fonte].n, c.ano]);
  });
  baixaCSV(linhas, `ficha_${B.ids[i]}.csv`);
}

/* ─────────────────────────────────────────────────────────── 13. busca ── */
const BUSCA_MUN = BR ? BR.busca.ids.map((id, k) => ({id, nome: BR.busca.nomes[k], n: norm(BR.busca.nomes[k]), uf: BR.busca.uf[k]})) : [];
let sugAtual = [], sugIdx = -1;
function buscar(q) {
  const s = $('#sugg'), t = norm(q.trim());
  if (t.length < 2) { s.hidden = true; return; }
  const mun = BUSCA_MUN.filter(m => m.n.includes(t))
    .sort((a, b) => (a.n.startsWith(t) ? 0 : 1) - (b.n.startsWith(t) ? 0 : 1) || a.n.localeCompare(b.n)).slice(0, 8);
  const D = S.regiao ? DADOS[S.regiao] : null;
  const bai = [];
  if (D) for (let i = 0; i < D.bai.n && bai.length < 8; i++) if (norm(D.bai.nomes[i]).includes(t)) bai.push(i);
  sugAtual = [...mun.map(m => ({tipo: 'mun', m})), ...bai.map(i => ({tipo: 'bai', i}))];
  sugIdx = -1;
  s.innerHTML = sugAtual.length ? sugAtual.map((x, k) => x.tipo === 'mun'
    ? `<div role="option" data-k="${k}"><span>${esc(x.m.nome)}</span><small>município · ${UF_POR_COD[x.m.uf].sigla}</small></div>`
    : `<div role="option" data-k="${k}"><span>${esc(D.bai.nomes[x.i])}</span><small>bairro · ${esc(nomeMun(D.bai.mun[x.i]))}</small></div>`).join('')
    : `<div class="vazio">Nada encontrado${S.regiao ? '' : '. Bairros aparecem depois de escolher a região.'}</div>`;
  s.hidden = false;
  $$('#sugg [data-k]').forEach(d => d.onmousedown = e => { e.preventDefault(); vaiPara(sugAtual[+d.dataset.k]); });
}
function vaiPara(x) {
  $('#sugg').hidden = true; $('#q').blur();
  if (x.tipo === 'mun') {
    const sig = REG_POR_COD[Math.floor(x.m.uf / 10)].sig;
    const ir = D => { const i = D.mun.pos.get(x.m.id); if (S.nivel === 'bai' && !D.bai.porMun.has(x.m.id)) escolheNivel('mun'); seleciona('mun', i, true); };
    if (S.regiao === sig) ir(DADOS[sig]); else escolheRegiao(sig, ir);
  } else {
    if (S.nivel !== 'bai') escolheNivel('bai');
    const D = DADOS[S.regiao]; S.foco = D.bai.mun[x.i]; S.escala = 'foco';
    seleciona('bai', x.i, true);
  }
}

/* ─────────────────────────────────────────── 14. metodologia e fontes ── */
function renderMetodo() {
  const cf = BR.conferencia, m = cf.malhas, c = cf.censo2022;
  const nb = BR.regioes.reduce((a, r) => a + r.n_bai, 0), nmb = BR.regioes.reduce((a, r) => a + r.n_mun_bai, 0);
  const br = c.brasil;
  const p = (k) => br[k] ? `${NF[2].format(br[k][0][0])}%` : '—';
  $('#metodoBody').innerHTML = `
    <h3>O que é</h3>
    <p>Mapa socioeconômico do Brasil com os ${NF[0].format(m.municipios)} municípios e os ${NF[0].format(nb)} bairros que o IBGE delimitou no Censo 2022, em ${nmb} municípios. Todo valor mostra a fonte, o ano e o nível. O que a fonte não publica aparece em branco: o Atlas não estima, não interpola e não completa valor.</p>
    <h3>Uma região por vez</h3>
    <p>O país inteiro, com bairros, passa de 12 MB. Por isso cada grande região (Norte, Nordeste, Centro-Oeste, Sudeste e Sul) tem o seu arquivo, e o Atlas abre só a escolhida. Trocar de região descarta a anterior do mapa.</p>
    <h3>Malhas</h3>
    <p>Municípios, bairros, UFs e regiões são a união dos setores censitários do Censo 2022 (malha do IBGE na forma publicada pelo IPEA no pacote geobr). Assim o território é o mesmo dos dados. Antes de gravar, o script confere a área de cada setor com a publicada pelo IBGE (diferença mediana de até ${m.setores_area_dif_mediana_pct}% por UF), a de cada município (até ${m.municipios_area_dif_max_pct}%) e a de cada bairro (até ${m.bairros_area_dif_max_pct}%) com a soma dos seus setores, e cada bairro com a malha de bairros do geobr (diferença máxima de ${m.bairros_geobr_area_dif_max_pct}%).</p>
    <p>A malha municipal de 2022 do geobr ficou de fora: as áreas saem de 6% a 12% maiores que as do IBGE e municípios vizinhos se sobrepõem. A de 2024 já traz um município criado depois do Censo (Boa Esperança do Norte, MT).</p>
    <p>Para o mapa abrir rápido, as linhas foram simplificadas como cobertura: dois vizinhos continuam com a mesma divisa, sem fresta. A tolerância é de cerca de 165 m nos municípios e 22 m nos bairros; as áreas usadas nos cálculos são as do IBGE, não as do desenho.</p>
    <h3>Censo 2022 por bairro e município</h3>
    <p>Os indicadores do Censo 2022 somam os agregados por setor do IBGE (arquivos do pacote censobr, IPEA): básico, pessoas, domicílios, renda do responsável e entorno. A população soma exatamente ${NF[0].format(c.populacao)}, a do Censo.</p>
    <p><b>Sigilo.</b> Em cada setor, o IBGE omite as contagens de 1 e 2 (os zeros ficam). Quando as categorias de uma variável fecham o total do setor (idade, sexo, alfabetização, espécie do domicílio, água, banheiro, esgoto, lixo e entorno) e só uma foi omitida, ela é o total menos as outras: conta exata. Quando duas ou mais foram omitidas, cada uma fica entre 1 e 2; o Atlas guarda o mínimo e o máximo possíveis, mostra o intervalo na ficha e pinta o mapa pelo meio dele. Cor ou raça não fecha o total (há quem não declarou), então ali só há mínimo e máximo.</p>
    <p>Em ${NF[0].format(c.setores_omitidos_idade)} setores pequenos o IBGE omitiu tudo menos o básico. Eles ficam de fora das contas, e a ficha diz que parte da população os outros setores cobrem. Se os setores com dado têm menos da metade da população do bairro ou município, o valor fica em branco.</p>
    <p>Conferência com o Brasil publicado pelo IBGE: analfabetismo de 15 anos ou mais ${p('tx_analf')}, pardos ${p('pct_parda')}, brancos ${p('pct_branca')}, pretos ${p('pct_preta')}.</p>
    <p><b>Rendimento do responsável.</b> O IBGE publica a média de cada setor. No bairro e no município o Atlas faz a média ponderada pelo número de responsáveis; o peso exato seria o de responsáveis com rendimento, que não é publicado por setor. Por isso o indicador aparece como cálculo do Atlas.</p>
    <p><b>Entorno.</b> A pesquisa do entorno percorreu as faces de quadra das áreas urbanas. Os percentuais são dos moradores com entorno pesquisado, e a ficha diz quanto do bairro ou município isso cobre.</p>
    <h3>Indicadores municipais de outras fontes</h3>
    <p>Atlas do Desenvolvimento Humano (Censos de 1991, 2000 e 2010), PIB dos Municípios (até ${cf.municipais.pib_ano}), IDEB, SNIS, PNI, Anatel, Fundação Abrinq e ANA, lidos no espelho público da Base dos Dados, que republica as bases oficiais sem alterar os valores (arquivos do plano pago nunca são usados). Cada indicador entra no ano mais recente publicado; o painel mostra a série quando há. UF e Brasil são os valores oficiais da fonte (Atlas Brasil, IDEB) ou a soma dos municípios (PIB).</p>
    <p>O Atlas Brasil não publica os 5 municípios criados depois de 2010; o SNIS só tem quem informou; o IDEB só sai onde o INEP publicou. Esses ficam em branco.</p>
    <h3>Classes do mapa</h3>
    <p>Quintis: cinco grupos com o mesmo número de unidades da região (ou da UF escolhida, ou do município, no nível de bairro). A variação da população usa faixas fixas em torno de zero.</p>
    <h3>Como atualizar</h3>
    <p>Na pasta <code>atlas2/</code>: <code>python3 extracao/1_malhas.py</code>, <code>2_censo2022.py</code>, <code>3_municipais.py</code> e <code>4_monta.py</code>. Cada script baixa o que falta, confere e para se algo não bater.</p>
    <p class="muted">Gerado em ${esc(BR.gerado_em)} · Atlas ${esc(BR.v)}.</p>`;
}
function renderFontes() {
  const uso = {};
  CATALOGO.forEach(c => { (uso[c.fonte] = uso[c.fonte] || []).push(c); });
  $('#fontesBody').innerHTML = Object.entries(FONTES).map(([k, f]) => `<h3>${esc(f.n)}</h3>
    <p>${esc(f.d)}</p><p><a href="${esc(f.u)}" target="_blank" rel="noopener">${esc(f.u)}</a></p>
    ${uso[k] ? `<p class="muted">${uso[k].length} indicador${uso[k].length > 1 ? 'es' : ''}: ${uso[k].map(c => esc(c.n)).join('; ')}.</p>` : ''}`).join('');
}

/* ───────────────────────────────────────────────── 15. celular ── */
const ehCelular = () => matchMedia('(max-width:900px)').matches;
function abrePainelMobile() { if (ehCelular()) { $('#panel').classList.add('open'); } }
function fechaSideMobile() { $('#side').classList.remove('open'); $('#backdrop').classList.remove('show'); }

/* ─────────────────────────────────────────────────────────── 16. início ── */
function liga() {
  $$('#segRegiao button').forEach(b => b.onclick = () => escolheRegiao(b.dataset.r));
  $('.brand').onclick = () => { if (S.regiao) voltaBrasil(); };
  $('#selRegiaoMob').onchange = e => e.target.value && escolheRegiao(e.target.value);
  $$('#segNivel button').forEach(b => b.onclick = () => escolheNivel(b.dataset.n));
  $('#selUF').onchange = e => {
    S.uf = e.target.value ? Number(e.target.value) : null;
    if (S.foco && S.uf && Math.floor(S.foco / 100000) !== S.uf) { S.foco = null; S.escala = 'regiao'; }
    if (S.uf) map.fitBounds(UF_POR_COD[S.uf]._bounds, {padding: [20, 20]});
    else if (S.regiao) map.fitBounds(REG_POR_SIG[S.regiao]._bounds, {padding: [20, 20]});
    desenha();
  };
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

function voltaBrasil() {
  [camadaMun, camadaBai, camadaContorno].forEach(l => l && map.removeLayer(l));
  camadaMun = camadaBai = camadaContorno = null;
  S.regiao = null; S.sel = null; S.uf = null; S.foco = null; S.escala = 'regiao';
  liberaOutras(null);
  if (S.nivel === 'bai') { S.nivel = 'mun'; $$('#segNivel button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.n === 'mun'))); }
  marcaRegiao(null); preencheUFs(); renderCats();
  map.fitBounds(L.latLngBounds(BR.ufs.map(u => u._bounds)), {padding: [20, 20]});
  desenha(); convite();
}

/* estado do endereço (#r=…&i=…): na abertura e quando o endereço muda */
function aplicaHash(h) {
  if (h.i) S.ind = h.i;
  const nivel = h.n === 'bai' && h.r ? 'bai' : 'mun';
  if (nivel !== S.nivel) { S.nivel = nivel; $$('#segNivel button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.n === nivel))); }
  renderCats();
  if (!h.r) { if (S.regiao) voltaBrasil(); else { desenha(); convite(); } return; }
  escolheRegiao(h.r, D => {
    S.uf = null; S.foco = null; S.escala = 'regiao'; S.sel = null;
    if (h.uf && REG_POR_SIG[h.r].ufs.includes(h.uf)) { S.uf = h.uf; $('#selUF').value = h.uf; map.fitBounds(UF_POR_COD[h.uf]._bounds, {padding: [20, 20]}); }
    if (h.f && D.bai.porMun.has(h.f)) { S.foco = h.f; S.escala = 'foco'; }
    if (h.u) {
      const nv = D.mun.pos.has(h.u) ? 'mun' : (D.bai.pos.has(h.u) ? 'bai' : null);
      if (nv) { const i = D[nv].pos.get(h.u); S.sel = {nv, i, id: h.u}; map.fitBounds(D[nv].bounds[i], {padding: [40, 40], maxZoom: nv === 'bai' ? 15 : 11}); }
    }
  });
}

function convite() {
  const el = $('#convite');
  el.innerHTML = `<h2>Escolha uma região</h2><p>O Atlas abre uma região por vez, com os seus municípios e bairros. Clique no mapa ou escolha aqui:</p>
    <div class="regs">${BR.regioes.map(r => `<button type="button" data-r="${r.sig}">${esc(r.nome)}</button>`).join('')}</div>`;
  el.hidden = false;
  $$('[data-r]', el).forEach(b => b.onclick = () => escolheRegiao(b.dataset.r));
}

function inicia() {
  if (!BR) { document.body.innerHTML = '<p style="padding:24px">Não encontrei dados/brasil.js. Rode extracao/4_monta.py.</p>'; return; }
  if (!window.L) { document.body.innerHTML = '<p style="padding:24px">O mapa (Leaflet) não carregou. Ele vem da internet (cdnjs): confira a conexão.</p>'; return; }
  iniciaMapa(); liga();
  map.on('zoomend', () => { if (S.regiao && S.nivel === 'bai') renderCard(); });
  aplicaHash(lerHash());
  window.addEventListener('hashchange', () => aplicaHash(lerHash()));
  window.__atlas2 = {S, DADOS, voltaBrasil, escolheRegiao, escolheNivel, escolheIndicador, seleciona, verBairros, buscar, conjunto, classes, decNums};
}
document.addEventListener('DOMContentLoaded', inicia);
