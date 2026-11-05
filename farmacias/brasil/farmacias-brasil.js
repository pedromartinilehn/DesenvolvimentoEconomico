/* ═══════════════════════════════════════════════════════════════════════
   Farmácias do Brasil — extensão do Atlas 2.0
   Lojas Panvel, Raia Drogasil e Pague Menos (com a Extrafarma) ativas no CNES
   de abril de 2026, sobre o mapa de municípios e bairros do Atlas 2.0.

   Ordem dos arquivos: atlas2/dados/brasil.js, dados/farmacias.js, este
   arquivo e, por último, atlas2/atlas2.js. Ao carregar, junta os indicadores
   das redes ao catálogo do Atlas 2.0; depois, o atlas2.js chama os ganchos de
   window.ATLAS2_EXT (camada das lojas, ficha da loja, busca, lista e CSV).
   Dados de extracao/3_monta.py. Nada aqui estima valor.
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';
(function () {
  const FA = window.ATLAS2_FARM, B0 = window.ATLAS2_BR;
  if (!FA || !B0) return;

  /* ───────────────────────────── 1. indicadores das redes no catálogo ── */
  B0.cats.unshift(...FA.cats);
  B0.catalogo.unshift(...FA.catalogo);
  Object.assign(B0.fontes, FA.fontes);
  for (const nv of ['uf', 'reg', 'br']) Object.assign(B0.comp[nv], FA.comp[nv]);

  const REDES = FA.redes;                                   // [{id, nome, cor, empresas, n}]
  const RID = REDES.map(r => r.id);
  const REDE = Object.fromEntries(REDES.map(r => [r.id, r]));
  const RAIOS = FA.raios;
  const F = {on: Object.fromEntries(RID.map(r => [r, true])), loja: null, raio: FA.raio_cob, ultima: null,
             lista: {texto: '', redes: Object.fromEntries(RID.map(r => [r, true])), mun: null, regiao: false,
                     col: 'mun', dir: 1}};
  let LJ = null, ENT = null, PERTO = null, camadas = null, rendP = null, rendR = null, circulo = null;

  const CLASSE_LOC = {     // [como fica na ficha, explicação, rótulo curto]
    endereco: ['no número do endereço', 'localizada pelo geocodebr no endereço do CNES (Cadastro Nacional de Endereços do Censo 2022)', 'endereço'],
    cnes_no_cep: ['coordenada do CNES, confirmada pelo CEP', 'a coordenada do CNES cai na área do CEP do endereço', 'CNES + CEP'],
    centro_cep: ['no centro do CEP do endereço', 'a coordenada do CNES fica longe do endereço; o ponto é o centro do CEP', 'centro do CEP'],
    cnes_sem_confirmacao: ['coordenada do CNES, sem confirmação', 'o endereço não confirma a coordenada do CNES (CEP muito extenso ou sem localização)', 'sem confirmação'],
    aproximada: ['aproximada, pelo endereço', 'a coordenada do CNES cai no mar ou em outro município; o ponto é o do geocodebr para o endereço (centro do CEP, da localidade ou do município)', 'aproximada'],
  };
  const PREC_TXT = {numero: 'o número do endereço', numero_aproximado: 'o número aproximado do endereço', logradouro: 'o meio da rua',
                    cep: 'o centro do CEP', localidade: 'o centro da localidade', municipio: 'o centro do município'};
  /* quadro do entorno: [id, rótulo]; as taxas são as do Atlas 2.0 */
  const LINHAS = [
    ['pop', 'Moradores'], ['dom', 'Domicílios'], ['renda_resp', 'Rendimento médio do responsável'],
    ['pct_0a14', 'Crianças de 0 a 14 anos'], ['pct_60mais', 'Pessoas de 60 anos ou mais'],
    ['pct_negra', 'Pessoas pretas ou pardas'], ['tx_analf', 'Analfabetismo, 15 anos ou mais'],
    ['pct_fcu', 'Em favelas e comunidades urbanas'], ['pct_esgoto_precario', 'Esgoto precário ou inexistente'],
    ['pct_agua_rede', 'Água da rede geral'], ['pct_lixo_coleta', 'Lixo coletado'],
    ['pct_onibus', 'Moradores em rua com ponto de ônibus'], ['pct_pav', 'Moradores em rua pavimentada'],
    ['pct_ilum', 'Moradores em rua com iluminação pública'], ['pct_calcada', 'Moradores em rua com calçada'],
  ];
  const CONTAGEM = new Set(['pop', 'dom']);

  /* ───────────────────────────────────────────── 2. utilidades ── */
  const fmtD = m => m == null ? '—' : (m < 1000 ? `${NF[0].format(Math.round(m))} m` : `${NF[1].format(m / 1000)} km`);
  const fmtCNPJ = c => String(c).replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  const sigla = l => UF_POR_COD[l.uf].sigla;
  const rotMarca = l => (l.marca === REDE[l.rede].nome || l.marca.startsWith('não')) ? '' : l.marca;
  const nomeRede = l => REDE[l.rede].nome + (rotMarca(l) ? ` · ${rotMarca(l)}` : '');
  const nomeBairro = l => l.bai ? (FA.bairros[l.bai] || String(l.bai)) : null;
  function decPts(s, prec) {
    const v = decNums(s), out = []; let x = 0, y = 0;
    for (let i = 0; i < v.length; i += 2) { x += v[i]; y += v[i + 1]; out.push([x / prec, y / prec]); }
    return out;
  }
  function textoLoc(l) {
    const c = CLASSE_LOC[l.classe];
    const inc = l.inc != null ? (l.classe === 'cnes_no_cep' ? ` (área do CEP de até ${fmtD(l.inc)})` : ` (±${fmtD(l.inc)})`) : '';
    return c[0] + inc;
  }

  /* ─────────────────────────────────────────── 3. decodificação ── */
  function prepara() {
    const Q = FA.lojas, n = Q.n, xy = decPts(Q.xy, FA.prec_pts);
    const posMun = new Map(BR.busca.ids.map((id, k) => [id, k]));
    LJ = [];
    for (let k = 0; k < n; k++) {
      const mun = Q.mun[k], uf = Math.floor(mun / 100000);
      LJ.push({k, x: xy[k][0], y: xy[k][1], rede: RID[Q.rede[k]], marca: FA.marcas[Q.marca[k]], classe: FA.classes[Q.classe[k]],
        cnes: Q.cnes[k], cnpj: Q.cnpj[k], fantasia: Q.fantasia[k], end: Q.end[k], bairro_cnes: Q.bairro_cnes[k], cep: Q.cep[k],
        mun, uf, sig: REG_POR_COD[Math.floor(uf / 10)].sig, nomeMun: BR.busca.nomes[posMun.get(mun)], bai: Q.bai[k] || null,
        inc: Q.incerteza_m[k], dcg: Q.dist_cnes_geocodebr_m[k], prec: Q.precisao_geocodebr[k], atualizado: Q.atualizado[k],
        cnesFora: !!Q.cnes_fora[k], mesmo: Q.mesmo_end[k], perto50: Q.perto_50m[k]});
    }
    ENT = {};
    for (const r of RAIOS) {
      const E = FA.entorno[r], col = {}, fx = {};
      for (const [id, s] of Object.entries(E.c)) col[id] = decCol(s, E.esc[id], n);
      for (const [id, t] of Object.entries(E.fx)) {
        const js = decIds(t[0]), lo = decCol(t[1], 10, js.length), hi = decCol(t[2], 10, js.length);
        fx[id] = new Map(js.map((j, i) => [j, [lo[i], hi[i]]]));
      }
      ENT[r] = {col, fx, lojas: Object.fromEntries(RID.map(rd => [rd, decCol(E.lojas[rd], 1, n)]))};
    }
    PERTO = Object.fromEntries(RID.map(rd => [rd, {k: FA.perto[rd].k, d: decCol(FA.perto[rd].d, 1, n)}]));
  }
  const ent = (k, r, id) => ENT[r].col[id][k];
  const entFx = (k, r, id) => (ENT[r].fx[id] && ENT[r].fx[id].get(k)) || null;
  const outrasNoRaio = (k, r) => RID.reduce((a, rd) => a + ENT[r].lojas[rd][k], 0);

  /* ───────────────────────────────────────────────── 4. mapa ── */
  const raioPt = z => z < 5 ? 2.2 : z < 7 ? 3 : z < 10 ? 4 : z < 13 ? 5 : 6.5;
  function raioLoja(l) { return raioPt(map.getZoom()) + (F.loja === l.k ? 3 : 0); }
  function estiloLoja(l) {
    const sel = F.loja === l.k;
    return {radius: raioLoja(l), color: sel ? '#15212E' : '#ffffff', weight: sel ? 2.6 : (map.getZoom() < 7 ? 0.8 : 1.4),
            fillColor: REDE[l.rede].cor, fillOpacity: 1};
  }
  function dicaLoja(l) {
    return `<b>${esc(nomeRede(l))}</b><br>${esc(l.end)}<br><span class="d">${esc(l.nomeMun)} (${sigla(l)}) · ${esc(textoLoc(l))}</span>` +
      `<br><span class="d">clique para ver o entorno</span>`;
  }
  function iniciaCamadas(m) {
    prepara();
    m.createPane('farmRaios'); m.getPane('farmRaios').style.zIndex = 440; m.getPane('farmRaios').style.pointerEvents = 'none';
    m.createPane('farmPontos'); m.getPane('farmPontos').style.zIndex = 450;
    rendP = L.svg({pane: 'farmPontos', padding: 0.3});
    rendR = L.svg({pane: 'farmRaios', padding: 0.3});
    camadas = Object.fromEntries(RID.map(r => [r, L.layerGroup()]));
    for (const l of LJ) {
      const mk = L.circleMarker([l.y, l.x], {...estiloLoja(l), renderer: rendP, pane: 'farmPontos', bubblingMouseEvents: false});
      mk.on('mouseover', e => { if (F.loja !== l.k) mk.setStyle({weight: 2.4, color: '#15212E'}); mostraDica(dicaLoja(l), e.originalEvent); });
      mk.on('mousemove', e => moveDica(e.originalEvent));
      mk.on('mouseout', () => { mk.setStyle(estiloLoja(l)); escondeDica(); });
      mk.on('click', () => { escondeDica(); selecionaLoja(l.k, true); });
      l._mk = mk;
      camadas[l.rede].addLayer(mk);
    }
    RID.forEach(r => { if (F.on[r]) camadas[r].addTo(m); });
    m.on('zoomend', () => LJ.forEach(l => l._mk.setStyle(estiloLoja(l))));
    m.attributionControl.addAttribution('Lojas: CNES/DATASUS, abr./2026');
    renderCardRedes();
  }
  function desenhaCirculo() {
    if (circulo) { map.removeLayer(circulo); circulo = null; }
    if (F.loja == null) return;
    const l = LJ[F.loja];
    circulo = L.circle([l.y, l.x], {radius: F.raio, renderer: rendR, pane: 'farmRaios', interactive: false,
      color: '#15212E', weight: 1.5, dashArray: '5 4', fillColor: '#15212E', fillOpacity: 0.05}).addTo(map);
  }
  function renderCardRedes() {
    const el = $('#cardRedes'); if (!el) return;
    const fechado = el.classList.contains('fechado');
    el.innerHTML = `<h3>Lojas no mapa <button type="button" id="redesX" aria-expanded="${!fechado}">${fechado ? 'mostrar' : 'ocultar'}</button></h3>
      ${REDES.map(r => `<label><input type="checkbox" data-rede="${r.id}" ${F.on[r.id] ? 'checked' : ''}>
        <span class="pt" style="background:${r.cor}"></span><span>${esc(r.nome)}<small>${NF[0].format(r.n)} lojas</small></span></label>`).join('')}
      <p class="nc">Farmácias ativas no CNES, abr./2026. Clique numa loja para ver o entorno.</p>`;
    $$('[data-rede]', el).forEach(x => x.onchange = () => {
      F.on[x.dataset.rede] = x.checked;
      if (x.checked) camadas[x.dataset.rede].addTo(map); else map.removeLayer(camadas[x.dataset.rede]);
    });
    $('#redesX', el).onclick = () => { el.classList.toggle('fechado'); renderCardRedes(); };
  }

  /* ─────────────────────────────────────────────── 5. seleção ── */
  function selecionaLoja(k, zoom) {
    const l = LJ[k];
    if (!F.on[l.rede]) { F.on[l.rede] = true; camadas[l.rede].addTo(map); renderCardRedes(); }
    const fixa = () => {
      F.loja = k; S.sel = null;
      if (zoom) map.setView([l.y, l.x], Math.max(14, Math.min(map.getZoom(), 16)));
      abrePainelMobile();
    };
    if (S.regiao !== l.sig || !DADOS[l.sig]) { escolheRegiao(l.sig, fixa); return; }
    fixa(); desenha();
  }
  function soltaLoja() { F.loja = null; desenha(); }

  /* ───────────────────────────────────────────── 6. ficha da loja ── */
  function celula(v, f, fx) {
    return `<td class="eu">${fx ? '≈ ' : ''}${fmt(v, f)}${fx ? `<span class="fx">${fmt(fx[0], f)} a ${fmt(fx[1], f)}</span>` : ''}</td>`;
  }
  function linhaPerto(l, rd) {
    const o = LJ[PERTO[rd].k[l.k]], d = PERTO[rd].d[l.k];
    return `<tr data-loja="${o.k}" class="clic"><td><span class="pt" style="background:${REDE[rd].cor}"></span>${esc(REDE[rd].nome)}${rd === l.rede ? ' (outra)' : ''}</td>
      <td>${esc(o.end)}<small>${esc(o.nomeMun)} (${sigla(o)})</small></td><td class="r">${fmtD(d)}</td></tr>`;
  }
  function avisos(l) {
    const out = [], n = ent(l.k, F.raio, 'n'), cob = ent(l.k, F.raio, 'cob_p');
    if (l.classe === 'aproximada') out.push(`A coordenada do CNES cai fora de ${esc(l.nomeMun)} (no mar ou em outro município) e contradiz o endereço do próprio cadastro. O ponto é ${esc(PREC_TXT[l.prec] || 'o do geocodebr para o endereço')}${l.inc != null ? `, com desvio de ${fmtD(l.inc)}` : ''}: o entorno é só aproximado.`);
    if (l.classe === 'cnes_sem_confirmacao') out.push(`A posição desta loja vem só do CNES: o endereço não a confirma (${esc(CLASSE_LOC[l.classe][1])}). O entorno pode estar deslocado.`);
    if (l.classe === 'centro_cep') out.push(`A coordenada do CNES fica a ${fmtD(l.dcg)} do endereço; o Atlas usa o centro do CEP (incerteza de ${fmtD(l.inc)}).`);
    const lista = ks => ks.map(j => `${esc(LJ[j].end)} (CNES ${esc(LJ[j].cnes)})`).join('; ');
    if (l.mesmo.length) out.push(`O CNES tem outra loja ativa da ${esc(REDE[l.rede].nome)} no mesmo endereço: ${lista(l.mesmo)}, com outro CNPJ. Pode ser outra loja ou um registro repetido; o Atlas mostra as duas.`);
    else if (l.perto50.length) out.push(`Há outra loja da ${esc(REDE[l.rede].nome)} a menos de 50 m: ${lista(l.perto50)}. Pode ser outra loja ou o mesmo prédio com dois registros; o Atlas mostra as duas.`);
    if (!n) out.push(`Nenhum setor do Censo 2022 tem o ponto representativo a até ${fmtD(F.raio)} desta loja. Aumente o raio.`);
    else if (cob != null && cob < 99.95) out.push(`Os setores com dado de pessoas somam ${NF[1].format(cob)}% dos moradores do raio; o IBGE omitiu os outros (sigilo).`);
    return out;
  }
  function fichaLoja(l) {
    const D = DADOS[l.sig], k = l.k, r = F.raio, ufo = UF_POR_COD[l.uf];
    const im = D.mun.pos.get(l.mun), ib = l.bai ? D.bai.pos.get(l.bai) : undefined;
    const tab = LINHAS.map(([id, rot]) => {
      const c = IND[id] || {fmt: 'int'}, f = CONTAGEM.has(id) ? 'int' : c.fmt;
      const vm = CONTAGEM.has(id) ? null : (D.mun.col(id) || [])[im];
      const vu = CONTAGEM.has(id) ? null : valorComp('uf', id, ufo.i);
      return `<tr><td>${esc(rot)}</td>${celula(ent(k, r, id), f, entFx(k, r, id))}<td>${CONTAGEM.has(id) ? '' : fmt(vm, f)}</td><td>${CONTAGEM.has(id) ? '' : fmt(vu, f)}</td></tr>`;
    }).join('');
    const noRaio = RID.map(rd => `<tr><td><span class="pt" style="background:${REDE[rd].cor}"></span>${esc(REDE[rd].nome)}${rd === l.rede ? ' (outras)' : ''}</td><td class="r">${NF[0].format(ENT[r].lojas[rd][k])}</td></tr>`).join('');
    const bai = nomeBairro(l);
    const sub = [`CNES ${esc(l.cnes)}`, `CNPJ ${esc(fmtCNPJ(l.cnpj))}`, l.fantasia ? `nome fantasia no CNES: “${esc(l.fantasia)}”` : 'sem nome fantasia no CNES'];
    const onde = [bai ? `bairro ${esc(bai)} (IBGE)` : 'fora dos bairros do IBGE', l.bairro_cnes ? `no CNES, bairro ${esc(l.bairro_cnes)}` : '', l.cep ? `CEP ${esc(l.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2'))}` : ''].filter(Boolean);
    return `<div class="eyebrow f-eyebrow">${esc(nomeRede(l))} · ${esc(l.nomeMun)} (${sigla(l)})</div>
      <h2 class="f-nome">${esc(l.end)}</h2>
      <div class="f-sub">${sub.join(' · ')}</div>
      <div class="f-sub">${onde.join(' · ')}</div>
      <div class="chips"><span class="chip">localização: <b>${esc(textoLoc(l))}</b></span>
        <span class="chip">atualizado no CNES em <b>${esc(l.atualizado || '—')}</b></span></div>
      <div class="acoes"><button type="button" class="btn pri" data-farm="zoom">Aproximar</button>
        <button type="button" class="btn" data-farm="mun">Ficha de ${esc(l.nomeMun)}</button>
        ${ib != null ? `<button type="button" class="btn" data-farm="bai">Ficha do bairro</button>` : ''}
        <button type="button" class="btn" data-farm="csvloja">Baixar o entorno (CSV)</button>
        <button type="button" class="btn" data-farm="solta">Voltar</button></div>
      <div class="bloco">
        <h3>Entorno da loja</h3>
        <div class="raios"><span>Raio</span><div class="seg" role="radiogroup" aria-label="Raio do entorno">${RAIOS.map(x =>
          `<button type="button" role="radio" data-raio="${x}" aria-checked="${r === x}">${fmtD(x)}</button>`).join('')}</div></div>
        <div class="kpis">
          <div><span>Moradores a até ${fmtD(r)}</span><b>${fmt(ent(k, r, 'pop'), 'int')}</b></div>
          <div><span>Domicílios a até ${fmtD(r)}</span><b>${fmt(ent(k, r, 'dom'), 'int')}</b></div>
          <div><span>Setores do Censo no raio</span><b>${NF[0].format(ent(k, r, 'n'))}</b></div>
          <div><span>Outras lojas das três redes no raio</span><b>${NF[0].format(outrasNoRaio(k, r))}</b></div>
        </div>
        <table class="ent"><thead><tr><th>Indicador (Censo 2022)</th><th>Raio de ${fmtD(r)}</th><th>${esc(l.nomeMun)}</th><th>${esc(ufo.sigla)}</th></tr></thead>
          <tbody>${tab}</tbody></table>
        <div class="nota">Soma dos setores do Censo 2022 cujo ponto representativo está a até ${fmtD(r)} da loja, em linha reta. Taxas recalculadas sobre a soma dos setores; “≈” marca o meio do intervalo que o sigilo do IBGE permite. Município e UF: valores do Atlas 2.0.</div>
        ${avisos(l).map(a => `<div class="nota warn">${a}</div>`).join('')}
      </div>
      <div class="bloco"><h3>Lojas das três redes a até ${fmtD(r)}</h3><table class="comp">${noRaio}</table></div>
      <div class="bloco"><h3>Loja mais próxima de cada rede</h3>
        <table class="perto">${[l.rede, ...RID.filter(x => x !== l.rede)].map(rd => linhaPerto(l, rd)).join('')}</table>
        <div class="nota">Distância em linha reta entre as lojas. Clique para abrir a loja.</div></div>`;
  }

  /* ───────────────────────────────── 7. lojas no município, bairro, região ── */
  function contagem(ls) {
    return REDES.map(r => {
      const d = ls.filter(l => l.rede === r.id);
      const marcas = {};
      if (r.id !== 'panvel') d.forEach(l => { const m = l.marca.startsWith('não') ? 'marca não identificada no CNES' : l.marca; marcas[m] = (marcas[m] || 0) + 1; });
      const det = Object.entries(marcas).sort((a, b) => b[1] - a[1]).map(([m, n]) => `${NF[0].format(n)} ${esc(m)}`).join(', ');
      return `<tr><td><span class="pt" style="background:${r.cor}"></span>${esc(r.nome)}${det && d.length ? `<small>${det}</small>` : ''}</td><td class="r">${NF[0].format(d.length)}</td></tr>`;
    }).join('');
  }
  const MAX_LISTA = 30;
  function blocoLojas(ls, rot, mun) {
    const lista = ls.slice().sort((a, b) => a.rede.localeCompare(b.rede) || a.end.localeCompare(b.end, 'pt-BR'));
    const linhas = lista.slice(0, MAX_LISTA).map(l => `<tr data-loja="${l.k}" class="clic"><td><span class="pt" style="background:${REDE[l.rede].cor}"></span>${esc(l.end)}<small>${esc(nomeRede(l))}${l.classe !== 'endereco' && l.classe !== 'cnes_no_cep' ? ' · localização ' + esc(CLASSE_LOC[l.classe][2]) : ''}</small></td><td class="r">${fmt(ent(l.k, F.raio, 'pop'), 'int')}</td></tr>`).join('');
    return `<div class="bloco"><h3>Lojas das três redes ${esc(rot)}</h3>
      <table class="comp">${contagem(ls)}<tr class="eu"><td>Total</td><td class="r">${NF[0].format(ls.length)}</td></tr></table>
      ${ls.length ? `<table class="perto lista"><thead><tr><th>Loja</th><th class="r">Moradores a até ${fmtD(F.raio)}</th></tr></thead><tbody>${linhas}</tbody></table>
        ${ls.length > MAX_LISTA ? `<div class="nota">Mostrando ${MAX_LISTA} de ${NF[0].format(ls.length)}. A lista completa ordena e filtra todas.</div>` : ''}`
        : '<div class="nota">Nenhuma loja das três redes no CNES de abril de 2026.</div>'}
      <div class="acoes"><button type="button" class="btn" data-farm="lista"${mun ? ` data-mun="${mun}"` : ''}>Lista das lojas${mun ? ' do município' : ''}</button></div></div>`;
  }
  function blocoResumo(ls, rot) {
    return `<div class="bloco"><h3>Lojas das três redes ${esc(rot)}</h3>
      <table class="comp">${contagem(ls)}<tr class="eu"><td>Total</td><td class="r">${NF[0].format(ls.length)}</td></tr></table>
      <div class="nota">Farmácias ativas no CNES em abril de 2026. Clique num ponto do mapa para ver o entorno da loja.</div>
      <div class="acoes"><button type="button" class="btn" data-farm="lista">Lista das lojas</button></div></div>`;
  }

  /* ──────────────────────────────────────────── 8. lista e CSV ── */
  function nomeBusca(l) {
    if (l._n === undefined) l._n = norm(`${l.end} ${l.fantasia} ${l.cnes} ${l.nomeMun} ${l.bairro_cnes} ${nomeBairro(l) || ''} ${l.marca}`);
    return l._n;
  }
  function filtradas() {
    const t = norm(F.lista.texto.trim()), Fl = F.lista;
    return LJ.filter(l => Fl.redes[l.rede] && (!Fl.mun || l.mun === Fl.mun) && (!Fl.regiao || !S.regiao || l.sig === S.regiao)
      && (!t || nomeBusca(l).includes(t)));
  }
  function abreLista(mun) {
    F.lista.mun = mun || null;
    renderLista(); abreModal('mdLojas');
  }
  function renderLista() {
    const Fl = F.lista, r = F.raio, lin = filtradas();
    const val = {rede: l => nomeRede(l), end: l => l.end, mun: l => `${l.nomeMun} ${sigla(l)}`, loc: l => CLASSE_LOC[l.classe][2],
                 pop: l => ent(l.k, r, 'pop'), renda: l => ent(l.k, r, 'renda_resp'), outras: l => outrasNoRaio(l.k, r),
                 perto: l => PERTO[l.rede].d[l.k]};
    const f = val[Fl.col], dir = Fl.dir;
    lin.sort((a, b) => {
      const x = f(a), y = f(b);
      if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1;
      const c = typeof x === 'string' ? x.localeCompare(y, 'pt-BR') : x - y;
      return dir * c || a.k - b.k;
    });
    const MAX = 400;
    const th = (c, rot, num) => `<th class="${num ? 'r' : ''}" data-ord="${c}" aria-sort="${Fl.col === c ? (dir > 0 ? 'ascending' : 'descending') : 'none'}">${rot}${Fl.col === c ? ` <span class="seta">${dir > 0 ? '↑' : '↓'}</span>` : ''}</th>`;
    $('#lojasBody').innerHTML = `<div class="rk-top">
        <input id="ljBusca" type="search" placeholder="Filtrar: endereço, município, bairro, CNES, nome fantasia" value="${esc(Fl.texto)}">
        ${REDES.map(x => `<label class="chk"><input type="checkbox" data-ljrede="${x.id}" ${Fl.redes[x.id] ? 'checked' : ''}><span class="pt" style="background:${x.cor}"></span>${esc(x.nome)}</label>`).join('')}
        ${S.regiao ? `<label class="chk"><input type="checkbox" id="ljRegiao" ${Fl.regiao ? 'checked' : ''}>só a região ${esc(REG_POR_SIG[S.regiao].nome)}</label>` : ''}
        ${Fl.mun ? `<button type="button" class="btn" id="ljMun" title="Tirar o filtro do município">${esc(nomeMun(Fl.mun))} ×</button>` : ''}
      </div>
      <div class="rk-top">
        <div class="seg" role="radiogroup" aria-label="Raio do entorno">${RAIOS.map(x => `<button type="button" role="radio" data-ljraio="${x}" aria-checked="${r === x}">${fmtD(x)}</button>`).join('')}</div>
        <button type="button" class="btn" id="ljCSV">Baixar CSV (${NF[0].format(lin.length)} lojas, três raios)</button>
        <span class="muted" style="font-size:12.5px">${NF[0].format(lin.length)} de ${NF[0].format(LJ.length)} lojas · CNES abr./2026 · clique no título da coluna para ordenar${lin.length > MAX ? ` · a tabela mostra as ${MAX} primeiras; o CSV traz todas` : ''}</span>
      </div>
      <div class="rk-wrap"><table class="tabela"><thead><tr>${th('rede', 'Rede · marca')}${th('end', 'Endereço no CNES')}${th('mun', 'Município')}${th('loc', 'Localização')}
        ${th('pop', `Moradores até ${fmtD(r)}`, 1)}${th('renda', 'Rendimento médio', 1)}${th('outras', 'Outras lojas no raio', 1)}${th('perto', 'Mesma rede mais perto', 1)}</tr></thead>
      <tbody>${lin.slice(0, MAX).map(l => `<tr data-k="${l.k}"><td class="nw"><span class="pt" style="background:${REDE[l.rede].cor}"></span>${esc(nomeRede(l))}</td>
        <td>${esc(l.end)}${l.mesmo.length ? ' <span class="tag">mesmo endereço</span>' : ''}</td><td>${esc(l.nomeMun)} <span class="muted">${sigla(l)}</span></td>
        <td class="nw" title="${esc(CLASSE_LOC[l.classe][0] + ': ' + CLASSE_LOC[l.classe][1])}">${esc(CLASSE_LOC[l.classe][2])}</td>
        <td class="r">${fmt(ent(l.k, r, 'pop'), 'int')}</td><td class="r">${fmt(ent(l.k, r, 'renda_resp'), 'brl0')}</td>
        <td class="r">${NF[0].format(outrasNoRaio(l.k, r))}</td><td class="r">${fmtD(PERTO[l.rede].d[l.k])}</td></tr>`).join('')}</tbody></table></div>
      <p class="muted" style="font-size:12px;margin-top:10px">Entorno: soma dos setores do Censo 2022 cujo ponto representativo cai no raio, em linha reta. Lojas com localização “sem confirmação” ou “aproximada” podem ter o entorno deslocado.</p>`;
    const bus = $('#ljBusca');
    bus.oninput = () => { const p = bus.selectionStart; Fl.texto = bus.value; renderLista(); const n = $('#ljBusca'); n.focus(); n.setSelectionRange(p, p); };
    $$('[data-ljrede]').forEach(x => x.onchange = () => { Fl.redes[x.dataset.ljrede] = x.checked; renderLista(); });
    const rg = $('#ljRegiao'); if (rg) rg.onchange = () => { Fl.regiao = rg.checked; renderLista(); };
    const mb = $('#ljMun'); if (mb) mb.onclick = () => { Fl.mun = null; renderLista(); };
    $$('#lojasBody th[data-ord]').forEach(h => h.onclick = () => {
      const c = h.dataset.ord;
      Fl.dir = Fl.col === c ? -Fl.dir : (['rede', 'end', 'mun', 'loc', 'perto'].includes(c) ? 1 : -1); Fl.col = c; renderLista();
    });
    $$('[data-ljraio]').forEach(b => b.onclick = () => { F.raio = +b.dataset.ljraio; renderLista(); if (F.loja != null) desenha(); });
    $('#ljCSV').onclick = () => csvLojas(lin);
    $$('#lojasBody tbody tr').forEach(tr => tr.onclick = () => { fechaModais(); selecionaLoja(+tr.dataset.k, true); });
  }
  const TAXAS_CSV = ['renda_resp', 'pct_0a14', 'pct_60mais', 'pct_negra', 'tx_analf', 'pct_fcu', 'pct_esgoto_precario',
                     'pct_agua_rede', 'pct_lixo_coleta', 'pct_onibus', 'pct_pav', 'pct_ilum', 'pct_calcada'];
  const rotCSV = id => (LINHAS.find(x => x[0] === id) || [id, id])[1].toLowerCase();
  function cabCSV() {
    const cab = ['rede', 'marca (pelo nome fantasia)', 'nome fantasia no CNES', 'CNES', 'CNPJ', 'endereço (CNES)', 'bairro no CNES', 'CEP',
      'município', 'UF', 'código IBGE do município', 'bairro do IBGE (pelo ponto)', 'código do bairro', 'latitude', 'longitude',
      'localização', 'incerteza da localização (m)', 'distância entre a coordenada do CNES e o endereço (m)', 'atualizado no CNES',
      'outra loja da rede no mesmo endereço (CNES)', 'outra loja da rede a menos de 50 m (CNES)'];
    RID.forEach(rd => cab.push(`${REDE[rd].nome} mais próxima (CNES)`, `${REDE[rd].nome} mais próxima (m)`));
    RAIOS.forEach(r => {
      cab.push(`setores a até ${r} m`, `moradores a até ${r} m`, `domicílios a até ${r} m`);
      TAXAS_CSV.forEach(id => cab.push(`${rotCSV(id)} a até ${r} m (${id === 'renda_resp' ? 'R$' : '%'})`));
      cab.push(`moradores com dado de pessoas a até ${r} m (%)`);
      RID.forEach(rd => cab.push(`outras ${REDE[rd].nome} a até ${r} m`));
    });
    return cab;
  }
  function linhaCSV(l) {
    const out = [REDE[l.rede].nome, l.marca, l.fantasia, l.cnes, l.cnpj, l.end, l.bairro_cnes, l.cep || '', l.nomeMun, sigla(l), String(l.mun),
      nomeBairro(l) || '', l.bai ? String(l.bai) : '', l.y, l.x, CLASSE_LOC[l.classe][0], l.inc ?? '', l.dcg ?? '', l.atualizado || '',
      l.mesmo.map(j => LJ[j].cnes).join(' '), l.perto50.map(j => LJ[j].cnes).join(' ')];
    RID.forEach(rd => out.push(LJ[PERTO[rd].k[l.k]].cnes, PERTO[rd].d[l.k]));
    RAIOS.forEach(r => {
      out.push(ent(l.k, r, 'n'), ent(l.k, r, 'pop'), ent(l.k, r, 'dom'));
      TAXAS_CSV.forEach(id => out.push(ent(l.k, r, id) ?? ''));
      out.push(ent(l.k, r, 'cob_p') ?? '');
      RID.forEach(rd => out.push(ENT[r].lojas[rd][l.k]));
    });
    return out;
  }
  function csvLojas(ls) { baixaCSV([cabCSV(), ...ls.map(linhaCSV)], 'farmacias_tres_redes_entorno.csv'); }
  function csvLoja(l) {
    const linhas = [['indicador', ...RAIOS.flatMap(r => [`a até ${r} m`, `mínimo pelo sigilo (${r} m)`, `máximo pelo sigilo (${r} m)`]), l.nomeMun, UF_POR_COD[l.uf].nome]];
    const D = DADOS[l.sig], im = D ? D.mun.pos.get(l.mun) : undefined;
    LINHAS.forEach(([id, rot]) => {
      const lin = [rot];
      RAIOS.forEach(r => { const f = entFx(l.k, r, id); lin.push(ent(l.k, r, id) ?? '', f ? f[0] : '', f ? f[1] : ''); });
      lin.push(CONTAGEM.has(id) || !D ? '' : ((D.mun.col(id) || [])[im] ?? ''), CONTAGEM.has(id) ? '' : (valorComp('uf', id, UF_POR_COD[l.uf].i) ?? ''));
      linhas.push(lin);
    });
    linhas.push(['setores do Censo no raio', ...RAIOS.flatMap(r => [ent(l.k, r, 'n'), '', '']), '', '']);
    RID.forEach(rd => linhas.push([`outras lojas ${REDE[rd].nome} no raio`, ...RAIOS.flatMap(r => [ENT[r].lojas[rd][l.k], '', '']), '', '']));
    linhas.push([], ['loja', `${nomeRede(l)} · ${l.end} · ${l.nomeMun} (${sigla(l)}) · CNES ${l.cnes} · CNPJ ${fmtCNPJ(l.cnpj)}`],
      ['localização', textoLoc(l)], ['fonte', 'CNES/DATASUS abr./2026 (lojas); IBGE, Censo 2022 por setor (entorno); cálculo do Atlas']);
    baixaCSV(linhas, `entorno_${l.cnes}.csv`);
  }

  /* ─────────────────────────────────────────── 9. metodologia ── */
  function metodo() {
    const cf = FA.conferencia, lj = cf.lojas, cl = lj.lojas_por_classe, emp = lj.empresas;
    const linhaEmp = Object.entries(emp).map(([raiz, e]) => `<tr><td>${esc(e.rede)}</td><td>${esc(e.empresa)}</td><td class="r">${raiz.replace(/^(\d{2})(\d{3})(\d{3})$/, '$1.$2.$3')}</td>
      <td class="r">${NF[0].format(e.ativos_farmacia)}</td><td class="r">${NF[0].format(Object.values(e.ativos_outros_tipos).reduce((a, b) => a + b, 0))}</td><td class="r">${NF[0].format(e.desativados_farmacia)}</td></tr>`).join('');
    const marcas = Object.entries(lj.lojas_por_marca).map(([rede, m]) => `${esc(rede)}: ${Object.entries(m).map(([k, n]) => `${esc(k)} ${NF[0].format(n)}`).join(', ')}`).join('; ');
    const br = cf.brasil;
    return `<h3>Farmácias das três redes</h3>
      <p>As lojas são as farmácias (tipo 43 do CNES) ativas no Cadastro Nacional de Estabelecimentos de Saúde de abril de 2026 com o CNPJ das empresas abaixo (os 8 primeiros dígitos, a raiz). O arquivo é o que o IPEA publica para o pacote geobr. Os outros tipos de estabelecimento dessas empresas (clínica, consultório, centro de imunização, central de abastecimento) não são loja e ficam de fora. Farmácia precisa de registro no CNES quando oferece serviço de saúde; uma loja aberta depois de abril de 2026, ou sem registro, não aparece. Por isso o número pode ser diferente do que a empresa divulga.</p>
      <table><thead><tr><th>Rede</th><th>Empresa no CNES</th><th class="r">Raiz do CNPJ</th><th class="r">Farmácias ativas</th><th class="r">Outros tipos, ativos</th><th class="r">Farmácias desativadas</th></tr></thead><tbody>${linhaEmp}</tbody></table>
      <p>A Imifarma, empresa da Extrafarma, foi comprada pela Pague Menos em 2022; o Atlas a conta na rede Pague Menos. <b>Marca</b>: lida no nome fantasia do CNES por regra fixa (“RAIA” sem “DROGASIL” é Droga Raia; “DROGASIL”, com as grafias erradas do cadastro, sem “RAIA” é Drogasil; “PAGUE MENOS” é Pague Menos; “EXTRAFARMA” é Extrafarma). Quando o nome fantasia é o da empresa (“RAIA DROGASIL S A”, “IMIFARMA”), um código de loja ou fica vazio, a marca fica não identificada. ${marcas}.</p>
      <p><b>Onde fica cada loja.</b> O CNES traz a coordenada declarada pelo estabelecimento, e o arquivo do geobr traz também a do geocodebr (IPEA), que localiza o endereço no Cadastro Nacional de Endereços do Censo 2022. A regra, na ordem, é a do Atlas Porto Alegre, com uma conferência a mais: o ponto tem de cair, na malha de setores do Censo 2022, no município do endereço do CNES.</p>
      <table><tbody>
        <tr><td>O geocodebr achou o número do endereço (incerteza de até 50 m): ponto do endereço</td><td class="r">${NF[0].format(cl.endereco || 0)}</td></tr>
        <tr><td>A coordenada do CNES cai na área do CEP do endereço (desvio do CEP de até 800 m), ou a até 150 m do ponto do geocodebr: coordenada do CNES</td><td class="r">${NF[0].format(cl.cnes_no_cep || 0)}</td></tr>
        <tr><td>Senão, o centro do CEP do endereço, se o CEP tem até 800 m de desvio</td><td class="r">${NF[0].format(cl.centro_cep || 0)}</td></tr>
        <tr><td>Senão, a coordenada do CNES, sem confirmação (o endereço não a confirma)</td><td class="r">${NF[0].format(cl.cnes_sem_confirmacao || 0)}</td></tr>
        <tr><td>A coordenada do CNES cai no mar ou em outro município: o ponto do geocodebr para o endereço, aproximado (centro do CEP, da localidade ou do município)</td><td class="r">${NF[0].format(cl.aproximada || 0)}</td></tr>
      </tbody></table>
      <p><b>Registros parecidos.</b> ${NF[0].format(lj.lojas_mesmo_endereco)} lojas têm outra loja ativa da mesma rede no mesmo endereço (escrito de formas diferentes, com outro CNPJ), e ${NF[0].format(lj.lojas_a_menos_de_50m)} ficam a menos de 50 m de outra da mesma rede. Pode ser loja distinta ou registro repetido; o Atlas mostra todas e avisa na ficha. Loja posta no centro do CEP fica fora da conta dos 50 m, porque esse ponto não diz onde ela fica dentro do CEP.</p>
      <p><b>Entorno.</b> Soma dos setores do Censo 2022 cujo ponto representativo (um ponto dentro do setor) está a até 500 m, 1 km ou 2 km da loja, em linha reta. Contagens somam; taxas são recalculadas sobre a soma, com o mínimo e o máximo que o sigilo do IBGE permite (as regras do Atlas 2.0). Se os setores com dado têm menos da metade dos moradores do raio, a taxa fica em branco. O município e a UF do quadro são os do Atlas 2.0.</p>
      <p><b>Cobertura por município, bairro, UF e região</b> (cálculo do Atlas): lojas (no município, pelo endereço do CNES; no bairro, pelo ponto), lojas por 10 mil habitantes, parte dos moradores a até 1 km de uma loja e distância média até a loja mais próxima, em que cada setor pesa pela sua população. No Brasil: ${NF[1].format(br.f_1km_todas)}% dos moradores estão a até 1 km de uma loja das três redes (Panvel ${NF[1].format(br.f_1km_panvel)}%, Raia Drogasil ${NF[1].format(br.f_1km_rd)}%, Pague Menos ${NF[1].format(br.f_1km_pm)}%). As lojas estão em ${NF[0].format(cf.municipios_com_loja.todas)} dos ${NF[0].format(cf.municipios)} municípios.</p>
      <p><b>Como atualizar.</b> Na pasta <code>farmacias/brasil/</code>: <code>python3 extracao/1_setores.py</code>, <code>2_lojas.py</code> e <code>3_monta.py</code>; depois <code>python3 build_single.py</code> para o arquivo único. Os municípios, bairros e indicadores do Censo vêm do Atlas 2.0 (<code>atlas2/dados/</code>).</p>
      <p class="muted">Dados das farmácias gerados em ${esc(FA.gerado_em)}.</p>`;
  }

  /* ───────────────────────────────────────────── 10. ganchos ── */
  window.ATLAS2_EXT = {
    mapa: m => iniciaCamadas(m),
    regiao: (R, sig) => {
      const X = FA.regioes[sig]; if (!X) return;
      for (const nv of ['mun', 'bai']) {
        const ids = decIds(R[nv].ids);
        if (R[nv].n !== X[nv].n || ids[0] !== X[nv].ids0 || ids[ids.length - 1] !== X[nv].ids1) {
          console.error(`farmácias: ${sig} ${nv} não bate com o Atlas 2.0`);
          toast('Os dados das farmácias não batem com os do Atlas 2.0 nesta região: rode extracao/3_monta.py.');
          continue;
        }
        Object.assign(R[nv].c, X[nv].c);
      }
    },
    trocaRegiao: sig => { if (F.loja != null && (!sig || LJ[F.loja].sig !== sig)) F.loja = null; },
    seleciona: () => { F.loja = null; },
    desenha: () => {
      if (!LJ) return;
      if (F.ultima != null && F.ultima !== F.loja) LJ[F.ultima]._mk.setStyle(estiloLoja(LJ[F.ultima]));
      if (F.loja != null) { const l = LJ[F.loja]; l._mk.setStyle(estiloLoja(l)); l._mk.bringToFront(); }
      F.ultima = F.loja;
      desenhaCirculo();
    },
    painel: () => {
      if (F.loja == null || !LJ) return null;
      const l = LJ[F.loja];
      return (S.regiao === l.sig && DADOS[l.sig]) ? fichaLoja(l) : null;
    },
    painelPronto: b => {
      $$('[data-raio]', b).forEach(x => x.onclick = () => { F.raio = +x.dataset.raio; desenha(); });
      $$('[data-loja]', b).forEach(x => x.onclick = () => selecionaLoja(+x.dataset.loja, true));
      $$('[data-farm]', b).forEach(x => x.onclick = () => {
        const a = x.dataset.farm, l = F.loja != null ? LJ[F.loja] : null, D = DADOS[S.regiao];
        if (a === 'zoom' && l) map.setView([l.y, l.x], 15);
        else if (a === 'solta') soltaLoja();
        else if (a === 'csvloja' && l) csvLoja(l);
        else if (a === 'lista') abreLista(x.dataset.mun ? Number(x.dataset.mun) : null);
        else if (a === 'mun' && l && D) { if (S.nivel === 'bai' && !D.bai.porMun.has(l.mun)) escolheNivel('mun'); seleciona('mun', D.mun.pos.get(l.mun), true); }
        else if (a === 'bai' && l && D) { if (S.nivel !== 'bai') escolheNivel('bai'); S.foco = l.mun; S.escala = 'foco'; seleciona('bai', D.bai.pos.get(l.bai), true); }
      });
    },
    bloco: (nv, i) => {
      if (!LJ) return '';
      if (nv === 'brasil') return blocoResumo(LJ, 'no Brasil');
      const D = DADOS[S.regiao]; if (!D) return '';
      if (nv === 'regiao') {
        const ls = LJ.filter(l => l.sig === S.regiao && (!S.uf || l.uf === S.uf));
        return blocoResumo(ls, S.uf ? `em ${UF_POR_COD[S.uf].nome}` : `na região ${REG_POR_SIG[S.regiao].nome}`);
      }
      if (nv === 'mun') { const cod = D.mun.ids[i]; return blocoLojas(LJ.filter(l => l.mun === cod), `em ${D.mun.nomes[i]}`, cod); }
      if (nv === 'bai') { const cod = D.bai.ids[i]; return blocoLojas(LJ.filter(l => l.bai === cod), 'no bairro', null); }
      return '';
    },
    busca: t => {
      if (!LJ || t.length < 3) return [];
      const out = [];
      for (const l of LJ) { if (nomeBusca(l).includes(t)) { out.push(l); if (out.length >= 6) break; } }
      return out.map(l => ({tipo: 'ext', ir: () => selecionaLoja(l.k, true),
        html: `<span><span class="pt" style="background:${REDE[l.rede].cor}"></span>${esc(l.end)}</span><small>${esc(REDE[l.rede].nome)} · ${esc(l.nomeMun)} (${sigla(l)})</small>`}));
    },
    hash: h => { if (F.loja != null && LJ) h.set('l', LJ[F.loja].cnes); },
    aplicaHash: () => {
      const c = new URLSearchParams(location.hash.slice(1)).get('l');
      if (!c || !LJ) return false;
      const l = LJ.find(x => x.cnes === c);
      if (!l) return false;
      selecionaLoja(l.k, true);
      return true;
    },
    menu: a => { if (a === 'lojas') abreLista(null); else if (a === 'csvlojas') csvLojas(LJ); },
    metodo: () => metodo(),
    motivo: c => c.fonte === 'CNES' ? 'Sem valor: a unidade não tem moradores no Censo 2022.' : null,
  };
  window.__farmacias = {F, get LJ() { return LJ; }, get ENT() { return ENT; }, get PERTO() { return PERTO; }, selecionaLoja, abreLista};
})();
