'use strict';
/* =====================================================================
   CLINISYS — Module Rapprochement bancaire (réplique fonctionnelle)
   Fonctionnalités reprises de la vidéo : menus Fichier / Injection des
   extraits bancaires / Rapprochement / Editions, onglets, grilles,
   boutons latéraux, boîtes de dialogue.
   ===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const el = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
const norm = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/* ---------- Icônes (SVG en trait, couleur héritée) ---------- */
const PATHS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  print: '<path d="M7 9V4h10v5M7 17H4v-7h16v7h-3"/><path d="M7 14h10v6H7z"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  import: '<path d="M12 3v12m-5-5 5 5 5-5M5 21h14"/>',
  upload: '<path d="M12 16V4m-5 5 5-5 5 5M5 20h14"/>',
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>',
  cash: '<path d="M12 3v18M16.5 7.5H10a2.5 2.5 0 0 0 0 5h4a2.5 2.5 0 0 1 0 5H7"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  home: '<path d="m3 11 9-8 9 8M5 10v10h14V10"/>',
  bank: '<path d="M3 10 12 4l9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18"/>',
  zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  scale: '<path d="M12 4v16M6 20h12M4 8h16"/><path d="m4 8-2.5 6a3 3 0 0 0 5 0zM20 8l-2.5 6a3 3 0 0 0 5 0z"/>',
  calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5"/>',
  letter: '<path d="M8 5v14h9"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17v.5"/>',
  cancel: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  building: '<path d="M4 21V5l8-2 8 2v16M9 9h2M13 9h2M9 13h2M13 13h2M10 21v-4h4v4"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  tick: '<path d="m4 12 5 5L20 6"/>',
  folder: '<path d="M3 6h6l2 2h10v11H3z"/>',
};
const ic = n => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[n] || ''}</svg>`;
const fillIcons = (root = document) => $$('[data-ic]', root).forEach(e => { if (!e.firstChild) e.innerHTML = ic(e.dataset.ic); });

/* ---------- Formats ---------- */
const pad = (n, l = 5) => String(n).padStart(l, '0');
const fmt = n => (+n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const toFr = iso => iso ? iso.split('-').reverse().join('/') : '';
function fromFr(s) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((s || '').trim()); if (!m) return null;
  const d = new Date(+m[3], +m[2] - 1, +m[1]);
  if (d.getFullYear() !== +m[3] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[1]) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}
function maskDate(i) {
  i.addEventListener('input', () => {
    let v = i.value.replace(/\D/g, '').slice(0, 8);
    if (v.length > 4) v = v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4);
    else if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    i.value = v;
  });
}
const parseNum = s => { const n = parseFloat(String(s ?? '').replace(/[\s\u00a0]/g, '').replace(',', '.')); return isNaN(n) ? 0 : n; };
const TODAY = new Date().toISOString().slice(0, 10);
const MONTH_START = TODAY.slice(0, 8) + '01';

/* ---------- Données de démonstration (reprises de la vidéo) ---------- */
const S = {
  company: 'CLINIQUE INTERNATIONALE IBN SINA TANGER', exercice: '2026', user: 'ADMIN',
  banks: [
    { code: '51410004', label: 'BANQUE AL YOUSR' },
    { code: '51410003', label: 'BANQUE Banque Populaire' },
    { code: '51410001', label: 'BANQUE BMCI' },
    { code: '51410002', label: 'BANQUE Crédit du Maroc' },
  ],
  injections: [
    ['51410003', '00376', '2026-11-13', 'IKRAM C', '2026-11-11', '2026-11-12'],
    ['51410001', '00375', '2026-11-11', 'IKRAM C', '2026-11-09', '2026-11-10'],
    ['51410003', '00374', '2026-11-11', 'IKRAM C', '2026-11-09', '2026-11-10'],
    ['51410001', '00373', '2026-11-06', 'IKRAM C', '2026-11-02', '2026-11-05'],
    ['51410003', '00372', '2026-11-06', 'IKRAM C', '2026-10-27', '2026-10-30'],
    ['51410003', '00371', '2026-11-06', 'IKRAM C', '2026-11-02', '2026-11-05'],
    ['51410003', '00370', '2026-11-06', 'IKRAM C', '2026-10-27', '2026-10-31'],
    ['51410001', '00369', '2026-10-27', 'IKRAM C', '2026-10-26', '2026-10-26'],
    ['51410003', '00368', '2026-10-27', 'IKRAM C', '2026-10-26', '2026-10-26'],
    ['51410004', '00367', '2026-10-26', 'IKRAM C', '2026-08-31', '2026-10-06'],
    ['51410003', '00366', '2026-10-26', 'IKRAM C', '2026-10-22', '2026-10-23'],
    ['51410001', '00365', '2026-10-26', 'IKRAM C', '2026-10-15', '2026-10-23'],
    ['51410003', '00364', '2026-10-22', 'IKRAM C', '2026-10-19', '2026-10-21'],
    ['51410001', '00363', '2026-10-19', 'IKRAM C', '2026-10-14', '2026-10-16'],
    ['51410003', '00362', '2026-10-19', 'IKRAM C', '2026-10-14', '2026-10-16'],
    ['51410004', '00328', '2026-08-18', 'IKRAM C', '2026-07-02', '2026-07-31'],
    ['51410004', '00327', '2026-08-18', 'IKRAM C', '2026-06-29', '2026-06-30'],
    ['51410004', '00315', '2026-07-20', 'IKRAM C', '2026-03-03', '2026-05-26'],
    ['51410004', '00268', '2026-03-07', 'IKRAM C', '2026-01-30', '2026-02-27'],
  ].map(r => ({ bank: r[0], n: r[1], dateInj: r[2], user: r[3], du: r[4], au: r[5] })),
  acc: [], bnk: [], matches: [], models: {}, soldes: {}, seq: { id: 0, match: 0 },
  motifs: [
    { code: '01', label: 'Frais bancaires non comptabilisés' },
    { code: '02', label: 'Commission de change' },
    { code: '03', label: 'Erreur de saisie' },
    { code: '04', label: 'Agios' },
  ],
  tabs: [], active: null,
};
(function seed() {
  const A = (bank, libelle, date, ref, montant) => S.acc.push({ id: 'A' + (++S.seq.id), bank, libelle, date, ref, montant, status: 'open' });
  const B = (bank, op, date, ref, montant, frais = false, inj = '') => S.bnk.push({ id: 'B' + (++S.seq.id), bank, op, date, ref, montant, frais, inj, status: 'open', lettre: '' });
  const P = '51410003', M = '51410001';
  A(P, 'BORD CHQ N°9094XXXXXXXX Banque', '2026-01-22', '0001/24', 59834.35);
  A(P, 'VIREMENT CLIENT MUTUELLE', '2026-11-03', '0412/26', 128500);
  A(P, 'REG FOURNISSEUR PHARMACIE', '2026-11-04', '0413/26', -45200);
  A(P, 'REMISE ESPECES', '2026-11-05', '0414/26', 12000);
  A(P, 'REG FOURNISSEUR MATERIEL', '2026-11-06', '0415/26', -78640.5);
  A(P, 'PAIEMENT CNSS', '2026-11-09', '0416/26', -23150);
  B(P, 'REMISE CHQ 9094', '2026-01-25', 'RC9094', 59834.35, false, '00376');
  B(P, 'VIR RECU MUTUELLE', '2026-11-04', 'VIR0412', 128500, false, '00376');
  B(P, 'CHEQUE 0413 PHARMACIE', '2026-11-05', 'CHQ0413', -45200, false, '00376');
  B(P, 'VERSEMENT ESPECES', '2026-11-06', 'VRS0414', 12000, false, '00376');
  B(P, 'CHEQUE 0415 MATERIEL', '2026-11-10', 'CHQ0415', -78640.5, false, '00376');
  B(P, 'FRAIS DE TENUE DE COMPTE', '2026-11-10', '', -150, true, '00376');
  A(M, 'VIREMENT CLIENT ASSURANCE', '2026-11-02', '0420/26', 96000);
  A(M, 'REG FOURNISSEUR LABO', '2026-11-03', '0421/26', -31250);
  B(M, 'VIR RECU ASSURANCE', '2026-11-03', 'VIR0420', 96000, false, '00375');
  B(M, 'CHEQUE 0421 LABO', '2026-11-05', 'CHQ0421', -31250, false, '00375');
  B(M, 'COMMISSION BANCAIRE', '2026-11-05', '', -75, true, '00375');
})();
const bankLabel = c => (S.banks.find(b => b.code === c) || {}).label || '';
const bankOptions = (sel = '') => S.banks.map(b => `<option value="${b.code}" ${b.code === sel ? 'selected' : ''}>${esc(b.label)}</option>`).join('');

/* ---------- Boîtes de dialogue ---------- */
function dialog({ title, width = 520, body = '', buttons = [], mount }) {
  const root = el(`<div class="bank-modal-backdrop"><div class="bank-modal" style="width:min(${width}px,92vw)" role="dialog"><div class="bank-modal-head"><b>${esc(title)}</b><button type="button" data-x aria-label="Fermer">${ic('x')}</button></div><div class="bank-modal-body">${body}</div><div class="bank-modal-foot"></div></div></div>`);
  const close = () => root.remove();
  const foot = $('.bank-modal-foot', root);
  buttons.forEach(b => {
    const n = el(`<button type="button" class="${b.primary ? 'primary' : ''}">${b.icon ? ic(b.icon) : ''}<span>${b.label}</span></button>`);
    n.onclick = () => { if (!b.action || b.action(close, root) !== false) close(); };
    foot.append(n);
  });
  $('[data-x]', root).onclick = close;
  document.body.append(root);
  fillIcons(root);
  mount && mount(root, close);
  const first = $('.bank-modal-foot .primary', root); if (first && !$('input,select', root)) first.focus();
  return { root, close };
}
const msg = (text, cb) => dialog({ title: 'CliniSYS', width: 360, body: `<div class="msg"><span class="msg-ic">${ic('info')}</span><p>${text}</p></div>`, buttons: [{ label: 'OK', primary: true, action: () => { cb && cb(); } }] });
const ask = (text, onYes) => dialog({ title: 'CliniSYS', width: 380, body: `<div class="msg"><span class="msg-ic">${ic('help')}</span><p>${text}</p></div>`, buttons: [{ label: 'Oui', icon: 'check', primary: true, action: () => { onYes(); } }, { label: 'Non', icon: 'x' }] });
function tableDialog(title, heads, rows, foot = '') {
  dialog({
    title, width: 760,
    body: `<div class="bank-table-wrap"><table class="data-table bank-table"><thead><tr>${heads.map(h => `<th class="${h.num ? 'num' : ''}">${h.t}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map(r => `<tr>${r.map((c, i) => `<td class="${heads[i].num ? 'num' : ''}">${c}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${heads.length}" class="empty-row">Aucune donnée</td></tr>`}</tbody></table></div>${foot}`,
    buttons: [{ label: 'Fermer', icon: 'x' }],
  });
}
function bankPicker(cb) {
  let sel = null;
  dialog({
    title: 'Recherche compte bancaire', width: 460,
    body: `<div class="bank-table-wrap"><table class="data-table bank-table"><thead><tr><th>Code</th><th>Libellé</th></tr></thead><tbody>${S.banks.map(b => `<tr data-id="${b.code}"><td>${b.code}</td><td>${esc(b.label)}</td></tr>`).join('')}</tbody></table></div>`,
    buttons: [{ label: 'Valider', icon: 'check', primary: true, action: () => { if (!sel) { msg('Veuillez sélectionner un compte bancaire.'); return false; } cb(sel); } }, { label: 'Fermer', icon: 'x' }],
    mount: (root, close) => {
      $('tbody', root).addEventListener('click', e => { const tr = e.target.closest('tr'); if (!tr) return; $$('tr', root).forEach(x => x.classList.remove('row-selected')); tr.classList.add('row-selected'); sel = tr.dataset.id; });
      $('tbody', root).addEventListener('dblclick', e => { const tr = e.target.closest('tr'); if (!tr) return; cb(tr.dataset.id); close(); });
    },
  });
}

/* ---------- Aperçu avant impression ---------- */
function preview(title, subtitle, inner) {
  const o = el(`<div class="pdf-overlay"><div class="pdf-head"><b>${esc(title)}</b><span class="pv-actions"><button type="button" class="pv-btn" data-print>${ic('print')} Imprimer</button><button type="button" class="pv-btn" data-x aria-label="Fermer">${ic('x')}</button></span></div><div class="pdf-toolbar"><b>Aperçu</b><span>1 / 1</span></div><div class="pdf-body"><aside><div class="thumb">${esc(title)}<small>1</small></div></aside><article class="paper"><h4>${esc(S.company)} <span>CLINISYS Erp</span></h4><hr/><h1>${esc(title)}</h1><p>${subtitle}</p>${inner}</article></div></div>`);
  $('#shellView').append(o);
  $('[data-x]', o).onclick = () => o.remove();
  $('[data-print]', o).onclick = () => window.print();
}

/* ---------- États des mouvements bancaires ---------- */
function etatDialog(preset = {}) {
  dialog({
    title: 'ETAT DES MOUVEMENTS BANCAIRES', width: 520,
    body: `<div class="form-grid">
      <label>Compte bancaire</label><div class="inline"><select id="eBank"><option value=""></option>${bankOptions(preset.bank)}</select><button type="button" class="icon-btn" id="ePick" title="Rechercher">${ic('search')}</button></div>
      <label>Date opération</label><div class="inline">Du <input id="eDu" class="date-in" maxlength="10" value="${toFr(MONTH_START)}"/> Au <input id="eAu" class="date-in" maxlength="10" value="${toFr(TODAY)}"/></div>
      <label></label><div class="radios"><label><input type="radio" name="eSt" value="all" ${!preset.st ? 'checked' : ''}/> Tous</label><label><input type="radio" name="eSt" value="matched" ${preset.st === 'matched' ? 'checked' : ''}/> Rapproché</label><label><input type="radio" name="eSt" value="open" ${preset.st === 'open' ? 'checked' : ''}/> Non rapproché</label></div>
      <label></label><div class="radios"><label><input type="radio" name="eSens" value="all" checked/> Tous</label><label><input type="radio" name="eSens" value="enc"/> Encaissement</label><label><input type="radio" name="eSens" value="dec"/> Décaissement</label></div>
    </div>`,
    buttons: [{
      label: 'Imprimer', icon: 'print', primary: true, action: (close, root) => {
        const bank = $('#eBank', root).value, du = fromFr($('#eDu', root).value), au = fromFr($('#eAu', root).value);
        if (!bank) { msg('Veuillez sélectionner un compte bancaire.'); return false; }
        if (!du || !au || du > au) { msg('Date invalide'); return false; }
        const st = $('[name=eSt]:checked', root).value, sens = $('[name=eSens]:checked', root).value;
        const rows = S.bnk.filter(x => x.bank === bank && x.date >= du && x.date <= au && (st === 'all' || x.status === st) && (sens === 'all' || (sens === 'enc' ? x.montant > 0 : x.montant < 0)));
        const tot = rows.reduce((s, x) => s + x.montant, 0);
        preview('ETAT DES MOUVEMENTS BANCAIRES', `Compte : ${esc(bankLabel(bank))}　·　Du ${toFr(du)} au ${toFr(au)}　·　${{ all: 'Tous', matched: 'Rapprochés', open: 'Non rapprochés' }[st]}　·　${{ all: 'Encaissements et décaissements', enc: 'Encaissements', dec: 'Décaissements' }[sens]}`,
          `<table><tr><th>Date</th><th>Opération</th><th>Référence</th><th>Montant</th><th>Statut</th></tr>${rows.map(x => `<tr><td>${toFr(x.date)}</td><td>${esc(x.op)}</td><td>${esc(x.ref)}</td><td style="text-align:right">${fmt(x.montant)}</td><td>${x.status === 'matched' ? 'Rapproché' : 'Non rapproché'}</td></tr>`).join('') || '<tr><td colspan="5">Aucun mouvement</td></tr>'}<tr><th colspan="3">Total</th><th style="text-align:right">${fmt(tot)}</th><th></th></tr></table>`);
      }
    }, { label: 'Fermer', icon: 'x' }],
    mount: root => { maskDate($('#eDu', root)); maskDate($('#eAu', root)); $('#ePick', root).onclick = () => bankPicker(c => { $('#eBank', root).value = c; }); },
  });
}

/* ---------- Menus ---------- */
function changeExercice(onDone) {
  dialog({
    title: 'Exercice', width: 420,
    body: `<div class="form-grid"><label>Société <i class="req">*</i></label><div class="inline"><select id="xCompany"><option>${esc(S.company)}</option></select><span class="icon-btn static">${ic('search')}</span></div><label>Exercice <i class="req">*</i></label><div class="inline"><select id="xYear">${['2026', '2025', '2024'].map(y => `<option ${y === S.exercice ? 'selected' : ''}>${y}</option>`).join('')}</select></div></div>`,
    buttons: [{ label: 'Valider', icon: 'check', primary: true, action: (c, r) => { S.exercice = $('#xYear', r).value; $('#exerciceLabel').textContent = 'Exercice ' + S.exercice; refreshAll(); onDone && onDone(); } }, { label: 'Fermer', icon: 'x' }],
  });
}
function quit() { ask('Voulez-vous quitter le module Rapprochement bancaire ?', () => location.reload()); }
const MENUS = [
  { label: 'Fichier', icon: 'folder', items: [
    { label: 'Gestion des comptes bancaires', tab: 'accounts', act: () => openTab('accounts') },
    { label: 'Paramétrage des motifs de rapprochement avec écart', tab: 'motifs', act: () => openTab('motifs') },
    { label: 'Changer d’exercice', act: () => changeExercice() },
    { sep: true },
    { label: 'Quitter', act: quit },
  ] },
  { label: 'Injection des extraits bancaires', icon: 'upload', tab: 'inject', act: () => openTab('inject') },
  { label: 'Rapprochement', icon: 'scale', items: [
    { label: 'Rapprochement', tab: 'rapp', act: () => openTab('rapp') },
    { label: 'Ecritures rapprochées', tab: 'matched', act: () => openTab('matched') },
    { label: 'Mouvements bancaires lettrés', tab: 'lettres', act: () => openTab('lettres') },
    { label: 'Marquage des frais bancaires', tab: 'frais', act: () => openTab('frais') },
  ] },
  { label: 'Editions', icon: 'print', items: [
    { label: 'Etat des mouvements bancaires', act: () => etatDialog() },
    { label: 'Etat de rapprochement', act: () => { openTab('rapp'); msg('Sélectionnez le compte bancaire et la date, puis utilisez « Imprimer état de rapprochement ».'); } },
  ] },
];
function buildSideMenu() {
  const nav = $('#sideNav'), side = $('#sidebar');
  const item = (it, i, j) => it.sep ? '<hr/>' :
    `<button type="button" class="sub-btn" data-i="${i}" data-j="${j}" ${it.tab ? `data-tab="${it.tab}"` : ''}>${it.label}</button>`;
  const home = `<button type="button" class="nav-btn" data-home="1" title="Accueil"><span class="nav-ic">${ic('home')}</span><span class="nav-label">Accueil</span></button>`;
  const groups = MENUS.map((m, i) => m.items
    ? `<div class="nav-group" data-g="${i}"><button type="button" class="nav-btn nav-head" data-g="${i}" title="${m.label}"><span class="nav-ic">${ic(m.icon)}</span><span class="nav-label">${m.label}</span><span class="nav-caret">${ic('chevron')}</span></button><div class="nav-sub">${m.items.map((it, j) => item(it, i, j)).join('')}</div></div>`
    : `<button type="button" class="nav-btn" data-i="${i}" ${m.tab ? `data-tab="${m.tab}"` : ''} title="${m.label}"><span class="nav-ic">${ic(m.icon)}</span><span class="nav-label">${m.label}</span></button>`).join('');
  const refresh = `<button type="button" class="nav-btn" data-refresh="1" title="Actualiser"><span class="nav-ic">${ic('refresh')}</span><span class="nav-label">Actualiser</span></button>`;
  nav.innerHTML = home + groups + refresh;
  const toggle = g => g.classList.toggle('open');
  nav.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.home) { S.active = null; renderTabs(); return; }
    if (b.dataset.refresh) { refreshAll(); return; }
    if (b.classList.contains('sub-btn')) { MENUS[+b.dataset.i].items[+b.dataset.j].act(); return; }
    const m = MENUS[+b.dataset.i];
    if (b.classList.contains('nav-head')) {
      const g = b.parentElement;
      // barre réduite : on la déplie d'abord pour afficher les sous-menus
      if (!side.classList.contains('expanded')) { side.classList.add('expanded'); g.classList.add('open'); return; }
      toggle(g); return;
    }
    m.act();
  };
}
const COMMANDS = [
  { label: 'Gestion des comptes bancaires', hint: 'Fichier', act: () => openTab('accounts') },
  { label: 'Paramétrage des motifs de rapprochement avec écart', hint: 'Fichier', act: () => openTab('motifs') },
  { label: 'Changer d’exercice', hint: 'Fichier', act: () => changeExercice() },
  { label: 'Injection des extraits bancaires', hint: 'Injection', act: () => openTab('inject') },
  { label: 'Rapprochement', hint: 'Rapprochement', act: () => openTab('rapp') },
  { label: 'Rapprochement automatique', hint: 'Rapprochement', act: () => { openTab('rapp'); S.tabs.find(t => t.id === 'rapp').view.auto(); } },
  { label: 'Ecritures rapprochées', hint: 'Rapprochement', act: () => openTab('matched') },
  { label: 'Mouvements bancaires lettrés', hint: 'Rapprochement', act: () => openTab('lettres') },
  { label: 'Marquage des frais bancaires', hint: 'Rapprochement', act: () => openTab('frais') },
  { label: 'Etat des mouvements bancaires', hint: 'Editions', act: () => etatDialog() },
];

/* ---------- Onglets ---------- */
const VIEWS = {
  accounts: { title: 'GESTION DES COMPTES BANCAIRES', build: buildAccounts },
  inject: { title: 'INJECTION DES EXTRAITS BANCAIRES', build: buildInject },
  rapp: { title: 'RAPPROCHEMENT', build: buildRapp },
  motifs: { title: 'MOTIFS DE RAPPROCHEMENT AVEC ÉCART', build: buildMotifs },
  matched: { title: 'ECRITURES RAPPROCHÉES', build: buildMatched },
  lettres: { title: 'MOUVEMENTS BANCAIRES LETTRÉS', build: buildLettres },
  frais: { title: 'MARQUAGE DES FRAIS BANCAIRES', build: buildFrais },
};
function renderTabs() {
  $('#tabs').innerHTML = S.tabs.map(t => `<button type="button" class="tab ${t.id === S.active ? 'active' : ''}" data-id="${t.id}"><span>${VIEWS[t.id].title}</span><i data-close="${t.id}" title="Fermer">×</i></button>`).join('') + '<button type="button" class="tab" id="addTab" title="Ouvrir une fenêtre">+</button>';
  $('#splash').classList.toggle('hidden', S.tabs.length > 0);
  S.tabs.forEach(t => t.view.el.classList.toggle('hidden', t.id !== S.active));
  $$('#sideNav button').forEach(b => b.classList.toggle('active', b.dataset.home ? !S.active : (!!b.dataset.tab && b.dataset.tab === S.active)));
  $$('#sideNav .nav-group').forEach(g => g.classList.toggle('has-active', !!$('.sub-btn.active', g)));
}
function openTab(id) {
  let t = S.tabs.find(x => x.id === id);
  if (!t) { const view = VIEWS[id].build(); view.el.classList.add('hidden'); $('#mainContent').append(view.el); t = { id, view }; S.tabs.push(t); }
  S.active = id; renderTabs(); t.view.refresh && t.view.refresh();
}
function closeTab(id) {
  const i = S.tabs.findIndex(x => x.id === id); if (i < 0) return;
  S.tabs[i].view.el.remove(); S.tabs.splice(i, 1);
  if (S.active === id) S.active = S.tabs.length ? S.tabs[Math.min(i, S.tabs.length - 1)].id : null;
  renderTabs();
}
const refreshAll = () => S.tabs.forEach(t => t.view.refresh && t.view.refresh());

/* ---------- Briques communes aux fenêtres ---------- */
const sbtn = (act, icon, label, extra = '') => `<button type="button" class="sbtn ${extra}" data-act="${act}"><span class="sic">${ic(icon)}</span><span>${label}</span></button>`;
const closeBtn = () => '<div class="side-spacer"></div>' + sbtn('close', 'x', 'Fermer', 'sbtn-close');
function viewShell(id, main, actions, cls = '') {
  const el_ = el(`<div class="view ${cls}"><h2 class="view-title">${VIEWS[id].title}</h2><div class="mod-layout"><div class="mod-main">${main}</div><div class="side-actions">${actions}</div></div></div>`);
  return el_;
}
function wire(root, id, handlers) {
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const a = b.dataset.act; if (a === 'close') return closeTab(id);
    handlers[a] && handlers[a](b, e);
  });
}
function gridSelect(wrap, onChange) {
  wrap.addEventListener('click', e => {
    const tr = e.target.closest('tbody tr'); if (!tr || !tr.dataset.id) return;
    $$('tr.row-selected', wrap).forEach(x => x.classList.remove('row-selected')); tr.classList.add('row-selected'); onChange && onChange(tr.dataset.id);
  });
  wrap.addEventListener('keydown', e => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault(); const rows = $$('tbody tr[data-id]', wrap); if (!rows.length) return;
    let i = rows.findIndex(r => r.classList.contains('row-selected')); i = Math.max(0, Math.min(rows.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)));
    rows[i].click(); rows[i].scrollIntoView({ block: 'nearest' });
  });
}
const selId = wrap => { const r = $('tr.row-selected', wrap); return r && r.dataset.id; };
const emptyRow = n => `<tr><td colspan="${n}" class="empty-row">Aucune donnée</td></tr>`;

/* ===================== GESTION DES COMPTES BANCAIRES ===================== */
function buildAccounts() {
  const v = viewShell('accounts',
    `<div class="bank-table-wrap grid" tabindex="0"><table class="data-table bank-table"><thead><tr><th>Code</th><th>Libellé</th></tr></thead><tbody></tbody></table></div>`,
    sbtn('model', 'doc', 'Modèle extrait') + sbtn('solde', 'cash', 'Solde de départ') + sbtn('instC', 'list', 'Instance comptable') + sbtn('instB', 'list', 'Instance bancaire') + closeBtn());
  const wrap = $('.grid', v);
  const refresh = () => { const keep = selId(wrap) || S.banks[0].code; $('tbody', v).innerHTML = S.banks.map(b => `<tr data-id="${b.code}" class="${b.code === keep ? 'row-selected' : ''}"><td>${b.code}</td><td>${esc(b.label)}</td></tr>`).join(''); };
  gridSelect(wrap);
  const cur = () => { const c = selId(wrap); return S.banks.find(b => b.code === c); };
  wire(v, 'accounts', {
    model() {
      const b = cur(), m = S.models[b.code] || { sep: 'auto', pos: [1, 2, 3, 4, 5] };
      dialog({
        title: 'MODÈLE D’EXTRAIT — ' + b.label, width: 480,
        body: `<div class="form-grid"><label>Séparateur</label><div class="inline"><select id="mSep">${[['auto', 'Automatique'], [';', 'Point-virgule ( ; )'], [',', 'Virgule ( , )'], ['\t', 'Tabulation']].map(o => `<option value="${o[0]}" ${o[0] === m.sep ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div>
        ${['Référence', 'Libellé', 'Date opération', 'Débit', 'Crédit'].map((l, i) => `<label>N° colonne — ${l}</label><div class="inline"><input type="number" min="1" max="9" class="num-in" data-p="${i}" value="${m.pos[i]}"/></div>`).join('')}</div>`,
        buttons: [{ label: 'Valider', icon: 'check', primary: true, action: (c, r) => { S.models[b.code] = { sep: $('#mSep', r).value, pos: $$('[data-p]', r).map(i => +i.value || 1) }; } }, { label: 'Fermer', icon: 'x' }],
      });
    },
    solde() {
      const b = cur(), s = S.soldes[b.code] || { date: `01/01/${S.exercice}`, d: '', c: '' };
      dialog({
        title: 'SOLDE DE DÉPART — ' + b.label, width: 440,
        body: `<div class="form-grid"><label>Date</label><div class="inline"><input id="sDate" class="date-in" maxlength="10" value="${s.date}"/></div><label>Débit</label><div class="inline"><input id="sD" value="${s.d}"/></div><label>Crédit</label><div class="inline"><input id="sC" value="${s.c}"/></div></div>`,
        buttons: [{ label: 'Valider', icon: 'check', primary: true, action: (c, r) => { if (!fromFr($('#sDate', r).value)) { msg('Date invalide'); return false; } S.soldes[b.code] = { date: $('#sDate', r).value, d: $('#sD', r).value, c: $('#sC', r).value }; } }, { label: 'Fermer', icon: 'x' }],
        mount: r => maskDate($('#sDate', r)),
      });
    },
    instC() { const b = cur(); const r = S.acc.filter(x => x.bank === b.code && x.status === 'open'); tableDialog('INSTANCE COMPTABLE — ' + b.label, [{ t: 'Libellé' }, { t: 'Date opération' }, { t: 'Référence' }, { t: 'Montant', num: 1 }], r.map(x => [esc(x.libelle), toFr(x.date), esc(x.ref), fmt(x.montant)]), `<div class="dlg-total">Total : <b>${fmt(r.reduce((s, x) => s + x.montant, 0))}</b></div>`); },
    instB() { const b = cur(); const r = S.bnk.filter(x => x.bank === b.code && x.status === 'open'); tableDialog('INSTANCE BANCAIRE — ' + b.label, [{ t: 'Opération' }, { t: 'Date' }, { t: 'Référence' }, { t: 'Montant', num: 1 }], r.map(x => [esc(x.op), toFr(x.date), esc(x.ref), fmt(x.montant)]), `<div class="dlg-total">Total : <b>${fmt(r.reduce((s, x) => s + x.montant, 0))}</b></div>`); },
  });
  refresh();
  return { el: v, refresh };
}

/* ===================== INJECTION DES EXTRAITS BANCAIRES ===================== */
function buildInject() {
  const v = viewShell('inject', `
    <div class="inj-filters">
      <fieldset><legend>RECHERCHE</legend><div class="inj-grid"><label>N°Injection</label><input id="iNum"/><label>Utilisateur</label><input id="iUser"/></div><button type="button" class="primary big-search" id="iGo" title="Rechercher">${ic('search')}</button></fieldset>
      <fieldset><legend>FILTRE</legend><div class="inline"><label>Compte bancaire</label><select id="iBank"><option value=""></option>${bankOptions()}</select><button type="button" class="icon-btn" id="iPick" title="Rechercher un compte">${ic('search')}</button></div></fieldset>
      <fieldset><div class="inline"><label>Exercice</label><select id="iYear">${['2026', '2025', '2024'].map(y => `<option>${y}</option>`).join('')}</select></div></fieldset>
      <div class="inj-btns"><button type="button" class="primary small" id="iRefresh">Actualiser</button><button type="button" class="primary small" id="iReset">Réinitialiser</button></div>
    </div>
    <div class="bank-table-wrap grid" tabindex="0"><table class="data-table bank-table"><thead><tr><th>Compte bancaire</th><th>N°Injection</th><th>Date injection</th><th>Utilisateur</th><th>Du</th><th>Au</th></tr></thead><tbody></tbody></table></div>`,
    sbtn('add', 'plus', 'Ajouter') + sbtn('print', 'print', 'Imprimer') + sbtn('etatR', 'print', 'Etat des mouvements rapprochés') + sbtn('etatN', 'print', 'Etat des mouvements non rapprochés') + sbtn('cancel', 'cancel', 'Annuler injection') + closeBtn());
  const wrap = $('.grid', v), q = s => $(s, v);
  q('#iYear').value = S.exercice;
  const rows = () => {
    const n = q('#iNum').value.trim(), u = norm(q('#iUser').value.trim()), b = q('#iBank').value, y = q('#iYear').value;
    return S.injections.filter(i => (!n || i.n.includes(n)) && (!u || norm(i.user).includes(u)) && (!b || i.bank === b) && i.dateInj.startsWith(y)).sort((a, c) => c.n.localeCompare(a.n));
  };
  const refresh = () => {
    const r = rows(); const k0 = selId(wrap); const keep = r.some(i => i.n === k0) ? k0 : (r[0] && r[0].n); let prev = '';
    q('tbody').innerHTML = r.length ? r.map((i, k) => { const lab = i.bank !== prev ? esc(bankLabel(i.bank)) : ''; prev = i.bank; return `<tr data-id="${i.n}" class="${keep === i.n ? 'row-selected' : ''}"><td>${lab}</td><td>${i.n}</td><td>${toFr(i.dateInj)}</td><td>${esc(i.user)}</td><td>${toFr(i.du)}</td><td>${toFr(i.au)}</td></tr>`; }).join('') : emptyRow(6);
  };
  gridSelect(wrap);
  ['#iBank', '#iYear'].forEach(s => q(s).onchange = refresh);
  ['#iNum', '#iUser'].forEach(s => q(s).oninput = refresh);
  q('#iGo').onclick = q('#iRefresh').onclick = refresh;
  q('#iReset').onclick = () => { q('#iNum').value = ''; q('#iUser').value = ''; q('#iBank').value = ''; q('#iYear').value = S.exercice; refresh(); };
  q('#iPick').onclick = () => bankPicker(c => { q('#iBank').value = c; refresh(); });
  wire(v, 'inject', {
    add: () => importDialog(refresh),
    print() { const r = rows(); preview('INJECTION DES EXTRAITS BANCAIRES', `Exercice ${q('#iYear').value}${q('#iBank').value ? '　·　' + esc(bankLabel(q('#iBank').value)) : ''}`, `<table><tr><th>Compte bancaire</th><th>N°Injection</th><th>Date injection</th><th>Utilisateur</th><th>Du</th><th>Au</th></tr>${r.map(i => `<tr><td>${esc(bankLabel(i.bank))}</td><td>${i.n}</td><td>${toFr(i.dateInj)}</td><td>${esc(i.user)}</td><td>${toFr(i.du)}</td><td>${toFr(i.au)}</td></tr>`).join('')}</table>`); },
    etatR: () => etatDialog({ bank: q('#iBank').value, st: 'matched' }),
    etatN: () => etatDialog({ bank: q('#iBank').value, st: 'open' }),
    cancel() {
      const n = selId(wrap); if (!n) return msg('Veuillez sélectionner une injection.');
      const inj = S.injections.find(i => i.n === n);
      if (S.bnk.some(x => x.inj === n && x.status === 'matched')) return msg('Annulation impossible : des mouvements de cette injection sont déjà rapprochés.');
      ask(`Voulez-vous annuler l’injection N° ${n} ?`, () => { S.injections = S.injections.filter(i => i !== inj); S.bnk = S.bnk.filter(x => x.inj !== n); refresh(); refreshAll(); });
    },
  });
  refresh();
  return { el: v, refresh };
}
function parseExtract(text, bank) {
  const m = S.models[bank] || { sep: 'auto', pos: [1, 2, 3, 4, 5] };
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return [];
  const sep = m.sep !== 'auto' ? m.sep : [';', '\t', ','].map(s => [s, (lines[0].match(new RegExp(s === '\t' ? '\t' : '\\' + s, 'g')) || []).length]).sort((a, b) => b[1] - a[1])[0][0];
  const dt = s => { s = (s || '').trim(); let r = fromFr(s); if (r) return r; const x = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); return x ? s : null; };
  return lines.map(l => l.split(sep).map(c => c.trim().replace(/^"|"$/g, ''))).map(c => ({ ref: c[m.pos[0] - 1] || '', lib: c[m.pos[1] - 1] || '', date: dt(c[m.pos[2] - 1]), deb: parseNum(c[m.pos[3] - 1]), cred: parseNum(c[m.pos[4] - 1]) })).filter(r => r.date);
}
function importDialog(done) {
  let parsed = [];
  dialog({
    title: 'IMPORTATION EXTRAIT BANCAIRE', width: 820,
    body: `<div class="imp-top"><div class="form-grid"><label>Compte bancaire</label><div class="inline"><select id="pBank"><option value=""></option>${bankOptions()}</select><button type="button" class="icon-btn" id="pPick" title="Rechercher">${ic('search')}</button></div><label>Fichier</label><div class="inline"><input id="pFile" readonly placeholder="Aucun fichier sélectionné"/><button type="button" class="primary small" id="pBrowse">Parcourir</button><input type="file" id="pReal" accept=".csv,.txt,.tsv" hidden/></div></div>
      <div class="imp-period"><div><label>Exercice</label><input id="pEx" readonly/></div><div><label>Du</label><input id="pDu" readonly/></div><div><label>Au</label><input id="pAu" readonly/></div></div></div>
      <div class="bank-table-wrap imp-grid"><table class="data-table bank-table"><thead><tr><th>Référence</th><th>Libellé</th><th>Date opération</th><th class="num">Débit</th><th class="num">Crédit</th></tr></thead><tbody id="pBody">${emptyRow(5)}</tbody></table></div>
      <div class="imp-solde"><span>Solde fin de période</span><label>Débit <input id="pSD" readonly/></label><label>Crédit <input id="pSC" readonly/></label></div>`,
    buttons: [{
      label: 'Valider', icon: 'check', primary: true, action: (c, r) => {
        const bank = $('#pBank', r).value;
        if (!bank) { msg('Veuillez sélectionner un compte bancaire.'); return false; }
        if (!parsed.length) { msg('Veuillez sélectionner un fichier d’extrait bancaire valide.'); return false; }
        const n = pad(Math.max(0, ...S.injections.map(i => +i.n)) + 1, 5), ds = parsed.map(p => p.date).sort();
        S.injections.push({ bank, n, dateInj: TODAY, user: S.user, du: ds[0], au: ds[ds.length - 1] });
        parsed.forEach(p => S.bnk.push({ id: 'B' + (++S.seq.id), bank, op: p.lib, date: p.date, ref: p.ref, montant: p.cred - p.deb, frais: false, inj: n, status: 'open', lettre: '' }));
        done && done(); refreshAll(); msg(`Injection N° ${n} enregistrée : ${parsed.length} mouvement(s) importé(s).`);
      }
    }, { label: 'Fermer', icon: 'x' }],
    mount: r => {
      $('#pPick', r).onclick = () => bankPicker(c => { $('#pBank', r).value = c; });
      $('#pBrowse', r).onclick = () => $('#pReal', r).click();
      $('#pReal', r).onchange = e => {
        const f = e.target.files[0]; if (!f) return; $('#pFile', r).value = f.name;
        const rd = new FileReader();
        rd.onload = () => {
          parsed = parseExtract(String(rd.result), $('#pBank', r).value);
          $('#pBody', r).innerHTML = parsed.length ? parsed.map(p => `<tr><td>${esc(p.ref)}</td><td>${esc(p.lib)}</td><td>${toFr(p.date)}</td><td class="num">${p.deb ? fmt(p.deb) : ''}</td><td class="num">${p.cred ? fmt(p.cred) : ''}</td></tr>`).join('') : emptyRow(5);
          if (!parsed.length) return msg('Aucune ligne exploitable dans ce fichier. Vérifiez le modèle d’extrait du compte.');
          const ds = parsed.map(p => p.date).sort(); $('#pEx', r).value = ds[0].slice(0, 4); $('#pDu', r).value = toFr(ds[0]); $('#pAu', r).value = toFr(ds[ds.length - 1]);
          const net = parsed.reduce((s, p) => s + p.cred - p.deb, 0); $('#pSD', r).value = net < 0 ? fmt(-net) : ''; $('#pSC', r).value = net >= 0 ? fmt(net) : '';
        };
        rd.readAsText(f);
      };
    },
  });
}

/* ===================== RAPPROCHEMENT ===================== */
function buildRapp() {
  const v = viewShell('rapp', `
    <div class="rapp-top">
      <label>Compte bancaire <i class="req">*</i></label><select id="rBank"><option value=""></option>${bankOptions()}</select><button type="button" class="icon-btn" id="rPick" title="Rechercher un compte">${ic('search')}</button>
      <label>Jusqu’au <i class="req">*</i></label><input id="rUntil" class="date-in" placeholder="jj/mm/aaaa" maxlength="10"/>
      <div class="seg" id="rSide"><button type="button" class="selected" data-side="all">Tous</button><button type="button" data-side="dec">Décaissement</button><button type="button" data-side="enc">Encaissement</button></div>
    </div>
    <div class="rapp-search">
      <fieldset class="rs-mode"><legend>RECHERCHE</legend><label><input type="radio" name="rMode" value="both" checked/> Comptable/Bancaire</label><label><input type="radio" name="rMode" value="A"/> Comptable</label><label><input type="radio" name="rMode" value="B"/> Bancaire</label></fieldset>
      <fieldset class="rs-fields"><div class="rs-grid"><label>Référence</label><input id="rRef"/><label>Date opération</label><input id="rDate" class="date-in" placeholder="__/__/____" maxlength="10"/><label>Montant</label><input id="rMt"/></div></fieldset>
      <div class="inj-btns"><button type="button" class="primary small" id="rRefresh">Actualiser</button><button type="button" class="primary small" id="rReset">Réinitialiser</button><button type="button" class="primary small auto-btn" id="rAuto" title="Rapprochement automatique">${ic('zap')} Automatique</button></div>
    </div>
    <div class="rapp-panes">
      <section class="pane"><header>Partie comptable</header><div class="pane-grid"><table class="data-table bank-table"><thead><tr><th class="cb"><input type="checkbox" data-all="A" title="Tout sélectionner"/></th><th>Libellé</th><th>Date Opération</th><th>Référence</th><th class="num">Montant</th></tr></thead><tbody id="tA"></tbody></table></div><footer><span>Sélection</span><b id="fA">0,00</b></footer></section>
      <section class="pane"><header>Partie bancaire <label class="chk"><input type="checkbox" id="rFrais"/> Frais bancaire</label></header><div class="pane-grid"><table class="data-table bank-table"><thead><tr><th class="cb"><input type="checkbox" data-all="B" title="Tout sélectionner"/></th><th>Opération</th><th>Date</th><th>Référence</th><th class="num">Montant</th></tr></thead><tbody id="tB"></tbody></table></div><footer><span class="pane-btns"><button type="button" class="pbtn" data-act="bAdd">${ic('plus')} Ajouter</button><button type="button" class="pbtn" data-act="bEdit">${ic('edit')} Modifier</button><button type="button" class="pbtn" data-act="bDel">${ic('trash')} Supprimer</button></span><span>Sélection</span><b id="fB">0,00</b></footer></section>
    </div>
    <div class="rapp-foot"><label>Ecart</label><output id="rEcart">0,00</output></div>`,
    sbtn('match', 'tick', 'Rapprocher', 'ok') + sbtn('auto', 'zap', 'Rapprochement automatique', 'ok') + sbtn('asstD', 'arrow', 'Assistant décaissement', 'ok') + sbtn('asstE', 'arrow', 'Assistant encaissement', 'ok') + sbtn('lettrer', 'letter', 'Lettrer') + sbtn('ecart', 'tick', 'Valider avec écart', 'warn') + sbtn('printR', 'print', 'Imprimer état de rapprochement') + closeBtn(), 'rapp');
  const q = s => $(s, v);
  const sel = { A: new Set(), B: new Set() }; let side = 'all';
  maskDate(q('#rUntil')); maskDate(q('#rDate'));
  const ctx = () => ({ bank: q('#rBank').value, until: fromFr(q('#rUntil').value) });
  const need = () => { const c = ctx(); if (!c.bank) { msg('Veuillez sélectionner un compte bancaire.'); return null; } if (!c.until) { msg('Date invalide'); return null; } return c; };
  function visible() {
    const c = ctx(); if (!c.bank || !c.until) return { A: [], B: [] };
    const mode = $('[name=rMode]:checked', v).value, ref = norm(q('#rRef').value.trim()), mt = q('#rMt').value.trim(), d = fromFr(q('#rDate').value);
    const test = (x, lab) => (!ref || norm(x.ref + ' ' + lab).includes(ref)) && (!mt || Math.abs(Math.abs(x.montant) - Math.abs(parseNum(mt))) < 0.005) && (!d || x.date === d);
    const sd = x => side === 'all' || (side === 'enc' ? x.montant > 0 : x.montant < 0);
    let A = S.acc.filter(x => x.bank === c.bank && x.status === 'open' && x.date <= c.until && sd(x));
    let B = S.bnk.filter(x => x.bank === c.bank && x.status === 'open' && x.date <= c.until && sd(x));
    if (mode !== 'B') A = A.filter(x => test(x, x.libelle)); if (mode !== 'A') B = B.filter(x => test(x, x.op));
    if (q('#rFrais').checked) B = B.filter(x => x.frais);
    return { A, B };
  }
  const rowHtml = (x, k, lab, set) => `<tr data-id="${x.id}" class="${set.has(x.id) ? 'row-selected' : ''}"><td class="cb"><input type="checkbox" ${set.has(x.id) ? 'checked' : ''}/></td><td>${esc(lab)}${x.lettre ? ` <b class="lt">${x.lettre}</b>` : ''}${x.frais ? ' <b class="fr">Frais</b>' : ''}</td><td>${toFr(x.date)}</td><td>${esc(x.ref)}</td><td class="num ${x.montant < 0 ? 'debit' : 'credit'}">${fmt(x.montant)}</td></tr>`;
  const sum = (arr, set) => arr.filter(x => set.has(x.id)).reduce((s, x) => s + x.montant, 0);
  let cur = { A: [], B: [] };
  function render() {
    cur = visible();
    ['A', 'B'].forEach(k => { const ids = new Set(cur[k].map(x => x.id)); [...sel[k]].forEach(i => { if (!ids.has(i)) sel[k].delete(i); }); });
    q('#tA').innerHTML = cur.A.length ? cur.A.map((x, i) => rowHtml(x, i, x.libelle, sel.A)).join('') : '';
    q('#tB').innerHTML = cur.B.length ? cur.B.map((x, i) => rowHtml(x, i, x.op, sel.B)).join('') : '';
    ['A', 'B'].forEach(k => { const all = $(`[data-all=${k}]`, v); all.checked = cur[k].length > 0 && cur[k].every(x => sel[k].has(x.id)); });
    totals();
  }
  function totals() {
    const a = sum(cur.A, sel.A), b = sum(cur.B, sel.B), e = a - b;
    q('#fA').textContent = fmt(a); q('#fB').textContent = fmt(b);
    const o = q('#rEcart'); o.textContent = fmt(e); o.className = Math.abs(e) < 0.005 ? 'credit' : 'debit';
    $('[data-act=lettrer]', v).disabled = sel.B.size < 2;
  }
  ['A', 'B'].forEach(k => {
    q('#t' + k).addEventListener('click', e => { const tr = e.target.closest('tr'); if (!tr) return; const id = tr.dataset.id; sel[k].has(id) ? sel[k].delete(id) : sel[k].add(id); tr.classList.toggle('row-selected', sel[k].has(id)); $('input', tr).checked = sel[k].has(id); $(`[data-all=${k}]`, v).checked = cur[k].every(x => sel[k].has(x.id)); totals(); });
    $(`[data-all=${k}]`, v).onchange = e => { e.target.checked ? cur[k].forEach(x => sel[k].add(x.id)) : sel[k].clear(); render(); };
  });
  const go = () => { const c = ctx(); if (!c.bank) return msg('Veuillez sélectionner un compte bancaire.'); if (!c.until) return msg('Date invalide'); render(); };
  q('#rBank').onchange = () => { sel.A.clear(); sel.B.clear(); if (ctx().until) render(); else render(); };
  q('#rUntil').addEventListener('input', () => { if (q('#rUntil').value.length === 10 && fromFr(q('#rUntil').value) && q('#rBank').value) render(); });
  q('#rPick').onclick = () => bankPicker(c => { q('#rBank').value = c; q('#rBank').onchange(); });
  q('#rRefresh').onclick = go;
  q('#rAuto').onclick = () => autoDialog();
  q('#rReset').onclick = () => { q('#rRef').value = ''; q('#rMt').value = ''; q('#rDate').value = ''; $('[name=rMode][value=both]', v).checked = true; q('#rFrais').checked = false; side = 'all'; $$('#rSide button', v).forEach(b => b.classList.toggle('selected', b.dataset.side === 'all')); sel.A.clear(); sel.B.clear(); render(); };
  q('#rFrais').onchange = render;
  q('#rSide').onclick = e => { const b = e.target.closest('button'); if (!b) return; side = b.dataset.side; $$('#rSide button', v).forEach(x => x.classList.toggle('selected', x === b)); render(); };
  ['#rRef', '#rMt'].forEach(s => q(s).oninput = () => { if (ctx().bank && ctx().until) render(); });
  $$('[name=rMode]', v).forEach(r => r.onchange = render);

  const record = (accIds, bnkIds, ecart, motif, bank) => {
    const id = 'R' + pad(++S.seq.match, 4); S.matches.push({ id, date: TODAY, bank, accIds, bnkIds, ecart, motif });
    S.acc.forEach(x => { if (accIds.includes(x.id)) { x.status = 'matched'; x.matchId = id; } });
    S.bnk.forEach(x => { if (bnkIds.includes(x.id)) { x.status = 'matched'; x.matchId = id; } });
  };
  const chosen = () => ({ a: [...sel.A], b: [...sel.B], e: sum(cur.A, sel.A) - sum(cur.B, sel.B) });
  const bankForm = (title, x, ok) => dialog({
    title, width: 460,
    body: `<div class="form-grid"><label>Opération <i class="req">*</i></label><div class="inline"><input id="oLib" value="${esc(x ? x.op : '')}"/></div><label>Date <i class="req">*</i></label><div class="inline"><input id="oDate" class="date-in" maxlength="10" value="${x ? toFr(x.date) : toFr(TODAY)}"/></div><label>Référence</label><div class="inline"><input id="oRef" value="${esc(x ? x.ref : '')}"/></div><label>Montant <i class="req">*</i></label><div class="inline"><input id="oMt" value="${x ? Math.abs(x.montant).toFixed(2).replace('.', ',') : ''}"/></div><label>Sens</label><div class="radios"><label><input type="radio" name="oSens" value="enc" ${!x || x.montant >= 0 ? 'checked' : ''}/> Encaissement</label><label><input type="radio" name="oSens" value="dec" ${x && x.montant < 0 ? 'checked' : ''}/> Décaissement</label></div><label></label><label class="chk"><input type="checkbox" id="oFr" ${x && x.frais ? 'checked' : ''}/> Frais bancaire</label></div>`,
    buttons: [{ label: 'Valider', icon: 'check', primary: true, action: (c, r) => { const lib = $('#oLib', r).value.trim(), d = fromFr($('#oDate', r).value), m = Math.abs(parseNum($('#oMt', r).value)); if (!lib || !m) { msg('Veuillez renseigner l’opération et le montant.'); return false; } if (!d) { msg('Date invalide'); return false; } ok({ op: lib, date: d, ref: $('#oRef', r).value.trim(), montant: $('[name=oSens]:checked', r).value === 'dec' ? -m : m, frais: $('#oFr', r).checked }); } }, { label: 'Fermer', icon: 'x' }],
    mount: r => maskDate($('#oDate', r)),
  });
  wire(v, 'rapp', {
    match() {
      const c = need(); if (!c) return; const s = chosen();
      if (!s.a.length || !s.b.length) return msg('Veuillez sélectionner au moins une écriture comptable et une opération bancaire.');
      if (Math.abs(s.e) >= 0.005) return msg(`Rapprochement impossible : écart de ${fmt(s.e)}.<br>Utilisez « Valider avec écart ».`);
      ask('Confirmer le rapprochement des lignes sélectionnées ?', () => { record(s.a, s.b, 0, '', c.bank); sel.A.clear(); sel.B.clear(); render(); refreshAll(); });
    },
    ecart() {
      const c = need(); if (!c) return; const s = chosen();
      if (!s.a.length || !s.b.length) return msg('Veuillez sélectionner au moins une écriture comptable et une opération bancaire.');
      if (Math.abs(s.e) < 0.005) return msg('Aucun écart : utilisez « Rapprocher ».');
      dialog({
        title: 'VALIDER AVEC ÉCART', width: 480,
        body: `<div class="form-grid"><label>Ecart</label><div class="inline"><output class="debit">${fmt(s.e)}</output></div><label>Motif <i class="req">*</i></label><div class="inline"><select id="vMotif"><option value=""></option>${S.motifs.map(m => `<option value="${m.code}">${esc(m.label)}</option>`).join('')}</select></div></div>`,
        buttons: [{ label: 'Valider', icon: 'check', primary: true, action: (cl, r) => { const mo = $('#vMotif', r).value; if (!mo) { msg('Veuillez choisir un motif.'); return false; } record(s.a, s.b, s.e, S.motifs.find(m => m.code === mo).label, c.bank); sel.A.clear(); sel.B.clear(); render(); refreshAll(); } }, { label: 'Fermer', icon: 'x' }],
      });
    },
    lettrer() {
      const used = new Set(S.bnk.map(x => x.lettre).filter(Boolean)); let L = 'A'; while (used.has(L)) L = String.fromCharCode(L.charCodeAt(0) + 1);
      S.bnk.forEach(x => { if (sel.B.has(x.id)) x.lettre = L; }); sel.B.clear(); render(); refreshAll();
    },
    auto: () => autoDialog(),
    asstD: () => assistant(-1), asstE: () => assistant(1),
    printR() {
      const c = need(); if (!c) return;
      const A = S.acc.filter(x => x.bank === c.bank && x.status === 'open' && x.date <= c.until), B = S.bnk.filter(x => x.bank === c.bank && x.status === 'open' && x.date <= c.until);
      const ta = A.reduce((s, x) => s + x.montant, 0), tb = B.reduce((s, x) => s + x.montant, 0), sd = S.soldes[c.bank];
      const t = (h, r, tot) => `<table><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr>${r.map(x => `<tr><td>${esc(x[0])}</td><td>${toFr(x[1])}</td><td>${esc(x[2])}</td><td style="text-align:right">${fmt(x[3])}</td></tr>`).join('') || '<tr><td colspan="4">Aucune ligne</td></tr>'}<tr><th colspan="3">Total</th><th style="text-align:right">${fmt(tot)}</th></tr></table>`;
      preview('ETAT DE RAPPROCHEMENT', `Compte : ${esc(bankLabel(c.bank))}　·　Jusqu’au ${toFr(c.until)}${sd ? `　·　Solde de départ : ${esc(sd.d || '0,00')} (D) / ${esc(sd.c || '0,00')} (C)` : ''}`,
        `<h3 style="font-size:13px">Écritures comptables non rapprochées</h3>${t(['Libellé', 'Date', 'Référence', 'Montant'], A.map(x => [x.libelle, x.date, x.ref, x.montant]), ta)}<h3 style="font-size:13px">Opérations bancaires non rapprochées</h3>${t(['Opération', 'Date', 'Référence', 'Montant'], B.map(x => [x.op, x.date, x.ref, x.montant]), tb)}<p><b>Écart : ${fmt(ta - tb)}</b></p>`);
    },
    bAdd() { const c = need(); if (!c) return; bankForm('AJOUTER UNE OPÉRATION BANCAIRE', null, o => { S.bnk.push({ id: 'B' + (++S.seq.id), bank: c.bank, inj: '', status: 'open', lettre: '', ...o }); render(); refreshAll(); }); },
    bEdit() { if (sel.B.size !== 1) return msg('Veuillez sélectionner une seule opération bancaire.'); const x = S.bnk.find(b => b.id === [...sel.B][0]); bankForm('MODIFIER L’OPÉRATION BANCAIRE', x, o => { Object.assign(x, o); render(); refreshAll(); }); },
    bDel() { if (!sel.B.size) return msg('Veuillez sélectionner au moins une opération bancaire.'); ask(`Supprimer ${sel.B.size} opération(s) bancaire(s) ?`, () => { S.bnk = S.bnk.filter(x => !sel.B.has(x.id)); sel.B.clear(); render(); refreshAll(); }); },
  });
  function assistant(sign) {
    const c = need(); if (!c) return;
    const used = new Set(), pairs = [];
    cur.A.filter(x => Math.sign(x.montant) === sign).forEach(a => { const b = cur.B.find(y => !used.has(y.id) && Math.abs(y.montant - a.montant) < 0.005); if (b) { used.add(b.id); pairs.push([a, b]); } });
    if (!pairs.length) return msg('Aucune correspondance trouvée.');
    dialog({
      title: sign < 0 ? 'ASSISTANT DÉCAISSEMENT' : 'ASSISTANT ENCAISSEMENT', width: 780,
      body: `<div class="bank-table-wrap"><table class="data-table bank-table"><thead><tr><th class="cb"></th><th>Écriture comptable</th><th>Date</th><th>Opération bancaire</th><th>Date</th><th class="num">Montant</th></tr></thead><tbody>${pairs.map((p, i) => `<tr><td class="cb"><input type="checkbox" data-i="${i}" checked/></td><td>${esc(p[0].libelle)}</td><td>${toFr(p[0].date)}</td><td>${esc(p[1].op)}</td><td>${toFr(p[1].date)}</td><td class="num">${fmt(p[0].montant)}</td></tr>`).join('')}</tbody></table></div>`,
      buttons: [{ label: 'Valider', icon: 'check', primary: true, action: (cl, r) => { const ch = $$('[data-i]:checked', r).map(i => pairs[+i.dataset.i]); if (!ch.length) { msg('Aucune ligne cochée.'); return false; } ch.forEach(p => record([p[0].id], [p[1].id], 0, '', c.bank)); sel.A.clear(); sel.B.clear(); render(); refreshAll(); } }, { label: 'Fermer', icon: 'x' }],
    });
  }

  /* ---------- Rapprochement automatique ---------- */
  const dayDiff = (d1, d2) => Math.abs(Date.parse(d1) - Date.parse(d2)) / 864e5;
  const tokens = t => (norm(t).match(/\d{3,}/g) || []).map(x => x.replace(/^0+/, '') || '0');
  const refMatch = (a, b) => { const tb = tokens(b.ref + ' ' + b.op); return tokens(a.ref + ' ' + a.libelle).some(t => tb.includes(t)); };
  const cents = n => Math.round(n * 100);
  function autoSearch(c, o) {
    const A = S.acc.filter(x => x.bank === c.bank && x.status === 'open' && x.date <= c.until);
    const B = S.bnk.filter(x => x.bank === c.bank && x.status === 'open' && x.date <= c.until);
    const usedA = new Set(), usedB = new Set(), out = [];
    // 1) correspondances 1 ↔ 1 : même montant, même sens, dates proches (référence en bonus ou exigée)
    const cand = [];
    A.forEach(a => B.forEach(b => {
      if (cents(a.montant) !== cents(b.montant)) return;
      const d = dayDiff(a.date, b.date); if (d > o.days) return;
      const rm = refMatch(a, b); if (o.needRef && !rm) return;
      cand.push({ a, b, d, rm, score: (rm ? 0 : 1000) + d });
    }));
    cand.sort((x, y) => x.score - y.score);
    cand.forEach(p => { if (usedA.has(p.a.id) || usedB.has(p.b.id)) return; usedA.add(p.a.id); usedB.add(p.b.id); out.push({ type: '1↔1', a: [p.a], b: [p.b], days: p.d, level: p.rm ? 'strong' : 'mid' }); });
    // 2) regroupements : 1 opération ↔ 2 ou 3 écritures (et inversement), somme identique
    if (o.groups) {
      const search = (singles, pool, usedS, usedP, singleIsBank) => {
        singles.filter(x => !usedS.has(x.id)).forEach(sg => {
          const cs = pool.filter(p => !usedP.has(p.id) && Math.sign(p.montant) === Math.sign(sg.montant) && Math.abs(p.montant) < Math.abs(sg.montant) && dayDiff(p.date, sg.date) <= o.days)
            .sort((x, y) => dayDiff(x.date, sg.date) - dayDiff(y.date, sg.date)).slice(0, 20);
          const tgt = cents(sg.montant); let found = null;
          for (let i = 0; i < cs.length && !found; i++) for (let j = i + 1; j < cs.length && !found; j++) {
            if (cents(cs[i].montant) + cents(cs[j].montant) === tgt) found = [cs[i], cs[j]];
            else for (let k = j + 1; k < cs.length && !found; k++) if (cents(cs[i].montant) + cents(cs[j].montant) + cents(cs[k].montant) === tgt) found = [cs[i], cs[j], cs[k]];
          }
          if (!found) return;
          usedS.add(sg.id); found.forEach(p => usedP.add(p.id));
          out.push({ type: singleIsBank ? '1↔N' : 'N↔1', a: singleIsBank ? found : [sg], b: singleIsBank ? [sg] : found, days: Math.max(...found.map(p => dayDiff(p.date, sg.date))), level: 'check' });
        });
      };
      search(B, A, usedB, usedA, true);
      search(A, B, usedA, usedB, false);
    }
    return out;
  }
  function autoDialog() {
    const c = need(); if (!c) return;
    let props = [];
    const lvl = { strong: ['Forte', 'ok'], mid: ['Moyenne', 'mid'], check: ['À vérifier', 'warn'] };
    const body = `<div class="auto-info">Compte : <b>${esc(bankLabel(c.bank))}</b> · Jusqu’au <b>${toFr(c.until)}</b></div>
      <div class="auto-params">
        <label>Tolérance de date <input type="number" id="auDays" min="0" max="60" value="5"/> jours</label>
        <label class="chk"><input type="checkbox" id="auRef"/> Exiger une référence concordante</label>
        <label class="chk"><input type="checkbox" id="auGrp" checked/> Autoriser les regroupements (1 opération ↔ 2 à 3 écritures)</label>
        <button type="button" class="primary small" id="auRun">Relancer la recherche</button>
      </div>
      <div class="auto-sum" id="auSum"></div>
      <div class="bank-table-wrap auto-res"><table class="data-table bank-table"><thead><tr><th class="cb"><input type="checkbox" id="auAll" title="Tout sélectionner"/></th><th>Type</th><th>Écritures comptables</th><th>Opérations bancaires</th><th class="num">Montant</th><th class="num">Écart (j)</th><th>Fiabilité</th></tr></thead><tbody id="auBody"></tbody></table></div>`;
    dialog({
      title: 'RAPPROCHEMENT AUTOMATIQUE', width: 980, body,
      buttons: [{
        label: 'Valider la sélection', icon: 'check', primary: true,
        action: (close, r) => {
          const ch = $$('[data-p]:checked', r).map(i => props[+i.dataset.p]);
          if (!ch.length) { msg('Aucune proposition sélectionnée.'); return false; }
          ch.forEach(p => record(p.a.map(x => x.id), p.b.map(x => x.id), 0, '', c.bank));
          sel.A.clear(); sel.B.clear(); render(); refreshAll();
          setTimeout(() => msg(`${ch.length} rapprochement(s) automatique(s) effectué(s).`), 0);
        },
      }, { label: 'Fermer', icon: 'x' }],
      mount: r => {
        const run = () => {
          props = autoSearch(c, { days: Math.max(0, +$('#auDays', r).value || 0), needRef: $('#auRef', r).checked, groups: $('#auGrp', r).checked });
          const nA = props.reduce((s, p) => s + p.a.length, 0), nB = props.reduce((s, p) => s + p.b.length, 0);
          $('#auSum', r).innerHTML = props.length ? `<b>${props.length}</b> proposition(s) : ${nA} écriture(s) comptable(s) et ${nB} opération(s) bancaire(s). Décochez les lignes à ne pas rapprocher.` : 'Aucune correspondance trouvée avec ces critères. Essayez d’augmenter la tolérance de date ou de décocher l’exigence de référence.';
          const line = (x, lab) => `${esc(lab)} <small>${toFr(x.date)}${x.ref ? ' · ' + esc(x.ref) : ''}</small>`;
          $('#auBody', r).innerHTML = props.map((p, i) => `<tr><td class="cb"><input type="checkbox" data-p="${i}" ${p.level === 'check' ? '' : 'checked'}/></td><td>${p.type}</td><td>${p.a.map(x => line(x, x.libelle)).join('<br>')}</td><td>${p.b.map(x => line(x, x.op)).join('<br>')}</td><td class="num ${p.b[0].montant < 0 ? 'debit' : 'credit'}">${fmt(p.b.reduce((s, x) => s + x.montant, 0))}</td><td class="num">${Math.round(p.days)}</td><td><span class="lvl ${lvl[p.level][1]}">${lvl[p.level][0]}</span></td></tr>`).join('');
          $('#auAll', r).checked = props.length > 0 && props.every(p => p.level !== 'check');
        };
        $('#auRun', r).onclick = run;
        $('#auAll', r).onchange = e => $$('[data-p]', r).forEach(i => { i.checked = e.target.checked; });
        run();
      },
    });
  }
  render();
  return { el: v, refresh: render, auto: autoDialog };
}

/* ===================== ECRITURES RAPPROCHÉES ===================== */
function buildMatched() {
  const v = viewShell('matched', `<div class="rapp-top"><label>Compte bancaire</label><select id="mBank"><option value="">Tous les comptes</option>${bankOptions()}</select></div><div class="bank-table-wrap grid" tabindex="0"><table class="data-table bank-table"><thead><tr><th>N°</th><th>Date</th><th>Compte bancaire</th><th>Écritures comptables</th><th class="num">Montant comptable</th><th>Opérations bancaires</th><th class="num">Montant bancaire</th><th class="num">Écart</th><th>Motif</th></tr></thead><tbody></tbody></table></div>`,
    sbtn('undo', 'cancel', 'Annuler rapprochement') + closeBtn());
  const wrap = $('.grid', v);
  const refresh = () => {
    const b = $('#mBank', v).value, keep = selId(wrap);
    const r = S.matches.filter(m => !b || m.bank === b).slice().reverse();
    $('tbody', v).innerHTML = r.length ? r.map(m => { const a = S.acc.filter(x => m.accIds.includes(x.id)), k = S.bnk.filter(x => m.bnkIds.includes(x.id)); return `<tr data-id="${m.id}" class="${keep === m.id ? 'row-selected' : ''}"><td>${m.id}</td><td>${toFr(m.date)}</td><td>${esc(bankLabel(m.bank))}</td><td>${a.map(x => esc(x.libelle)).join(' ; ')}</td><td class="num">${fmt(a.reduce((s, x) => s + x.montant, 0))}</td><td>${k.map(x => esc(x.op)).join(' ; ')}</td><td class="num">${fmt(k.reduce((s, x) => s + x.montant, 0))}</td><td class="num ${m.ecart ? 'debit' : ''}">${fmt(m.ecart)}</td><td>${esc(m.motif)}</td></tr>`; }).join('') : emptyRow(9);
  };
  gridSelect(wrap); $('#mBank', v).onchange = refresh;
  wire(v, 'matched', {
    undo() {
      const id = selId(wrap); if (!id) return msg('Veuillez sélectionner un rapprochement.');
      ask(`Annuler le rapprochement ${id} ?`, () => { const m = S.matches.find(x => x.id === id); S.acc.forEach(x => { if (x.matchId === id) { x.status = 'open'; delete x.matchId; } }); S.bnk.forEach(x => { if (x.matchId === id) { x.status = 'open'; delete x.matchId; } }); S.matches = S.matches.filter(x => x !== m); refreshAll(); });
    },
  });
  refresh(); return { el: v, refresh };
}

/* ===================== MOUVEMENTS BANCAIRES LETTRÉS ===================== */
function buildLettres() {
  const v = viewShell('lettres', `<div class="rapp-top"><label>Compte bancaire</label><select id="lBank"><option value="">Tous les comptes</option>${bankOptions()}</select></div><div class="bank-table-wrap grid" tabindex="0"><table class="data-table bank-table"><thead><tr><th>Lettre</th><th>Compte bancaire</th><th>Opération</th><th>Date</th><th>Référence</th><th class="num">Montant</th></tr></thead><tbody></tbody></table></div>`,
    sbtn('unlet', 'cancel', 'Délettrer') + closeBtn());
  const wrap = $('.grid', v);
  const refresh = () => {
    const b = $('#lBank', v).value, keep = selId(wrap);
    const r = S.bnk.filter(x => x.lettre && (!b || x.bank === b)).sort((a, c) => a.lettre.localeCompare(c.lettre));
    $('tbody', v).innerHTML = r.length ? r.map(x => `<tr data-id="${x.id}" class="${keep === x.id ? 'row-selected' : ''}"><td><b class="lt">${x.lettre}</b></td><td>${esc(bankLabel(x.bank))}</td><td>${esc(x.op)}</td><td>${toFr(x.date)}</td><td>${esc(x.ref)}</td><td class="num ${x.montant < 0 ? 'debit' : 'credit'}">${fmt(x.montant)}</td></tr>`).join('') : emptyRow(6);
  };
  gridSelect(wrap); $('#lBank', v).onchange = refresh;
  wire(v, 'lettres', { unlet() { const id = selId(wrap); if (!id) return msg('Veuillez sélectionner un mouvement lettré.'); const L = S.bnk.find(x => x.id === id).lettre; S.bnk.forEach(x => { if (x.lettre === L) x.lettre = ''; }); refreshAll(); } });
  refresh(); return { el: v, refresh };
}

/* ===================== MARQUAGE DES FRAIS BANCAIRES ===================== */
function buildFrais() {
  const v = viewShell('frais', `<div class="rapp-top"><label>Compte bancaire</label><select id="fBank"><option value="">Tous les comptes</option>${bankOptions()}</select></div><div class="bank-table-wrap grid" tabindex="0"><table class="data-table bank-table"><thead><tr><th class="cb">Frais</th><th>Compte bancaire</th><th>Opération</th><th>Date</th><th>Référence</th><th class="num">Montant</th></tr></thead><tbody></tbody></table></div>`,
    sbtn('mark', 'tick', 'Marquer la sélection') + sbtn('unmark', 'cancel', 'Démarquer la sélection') + closeBtn());
  const wrap = $('.grid', v);
  const refresh = () => {
    const b = $('#fBank', v).value, keep = selId(wrap);
    const r = S.bnk.filter(x => x.status === 'open' && (!b || x.bank === b));
    $('tbody', v).innerHTML = r.length ? r.map(x => `<tr data-id="${x.id}" class="${keep === x.id ? 'row-selected' : ''}"><td class="cb"><input type="checkbox" ${x.frais ? 'checked' : ''}/></td><td>${esc(bankLabel(x.bank))}</td><td>${esc(x.op)}</td><td>${toFr(x.date)}</td><td>${esc(x.ref)}</td><td class="num ${x.montant < 0 ? 'debit' : 'credit'}">${fmt(x.montant)}</td></tr>`).join('') : emptyRow(6);
  };
  gridSelect(wrap); $('#fBank', v).onchange = refresh;
  wrap.addEventListener('change', e => { if (e.target.type !== 'checkbox') return; const id = e.target.closest('tr').dataset.id; S.bnk.find(x => x.id === id).frais = e.target.checked; refreshAll(); });
  const set = val => { const id = selId(wrap); if (!id) return msg('Veuillez sélectionner une opération bancaire.'); S.bnk.find(x => x.id === id).frais = val; refreshAll(); };
  wire(v, 'frais', { mark: () => set(true), unmark: () => set(false) });
  refresh(); return { el: v, refresh };
}

/* ===================== MOTIFS DE RAPPROCHEMENT AVEC ÉCART ===================== */
function buildMotifs() {
  const v = viewShell('motifs', `<div class="bank-table-wrap grid" tabindex="0"><table class="data-table bank-table"><thead><tr><th>Code</th><th>Libellé</th></tr></thead><tbody></tbody></table></div>`,
    sbtn('add', 'plus', 'Ajouter') + sbtn('edit', 'edit', 'Modifier') + sbtn('del', 'trash', 'Supprimer') + closeBtn());
  const wrap = $('.grid', v);
  const refresh = () => { const keep = selId(wrap) || (S.motifs[0] && S.motifs[0].code); $('tbody', v).innerHTML = S.motifs.length ? S.motifs.map(m => `<tr data-id="${m.code}" class="${m.code === keep ? 'row-selected' : ''}"><td>${m.code}</td><td>${esc(m.label)}</td></tr>`).join('') : emptyRow(2); };
  gridSelect(wrap);
  const form = (m, ok) => dialog({
    title: m ? 'MODIFIER LE MOTIF' : 'AJOUTER UN MOTIF', width: 460,
    body: `<div class="form-grid"><label>Code <i class="req">*</i></label><div class="inline"><input id="mCode" value="${m ? m.code : pad(S.motifs.length + 1, 2)}" ${m ? 'readonly' : ''}/></div><label>Libellé <i class="req">*</i></label><div class="inline"><input id="mLib" value="${esc(m ? m.label : '')}"/></div></div>`,
    buttons: [{ label: 'Valider', icon: 'check', primary: true, action: (c, r) => { const code = $('#mCode', r).value.trim(), lib = $('#mLib', r).value.trim(); if (!code || !lib) { msg('Veuillez renseigner le code et le libellé.'); return false; } if (!m && S.motifs.some(x => x.code === code)) { msg('Ce code existe déjà.'); return false; } ok(code, lib); } }, { label: 'Fermer', icon: 'x' }],
  });
  wire(v, 'motifs', {
    add: () => form(null, (code, label) => { S.motifs.push({ code, label }); refreshAll(); }),
    edit() { const m = S.motifs.find(x => x.code === selId(wrap)); if (!m) return msg('Veuillez sélectionner un motif.'); form(m, (c, l) => { m.label = l; refreshAll(); }); },
    del() { const m = S.motifs.find(x => x.code === selId(wrap)); if (!m) return msg('Veuillez sélectionner un motif.'); ask(`Supprimer le motif « ${esc(m.label)} » ?`, () => { S.motifs = S.motifs.filter(x => x !== m); refreshAll(); }); },
  });
  refresh(); return { el: v, refresh };
}

/* ===================== Coquille de l'application ===================== */
function initShell() {
  $('#mainContent').innerHTML = `<div id="splash" class="splash"><img class="splash-logo" src="logo.png" alt="CLINISYS — Powered by Experts, Driven by Digital"><h1>Module Rapprochement Bancaire</h1><div class="splash-powered">Powered by: <b>COMPUTER SYSTEMS.TN</b></div></div>`;
  buildSideMenu(); $('#sidebar').classList.add('expanded'); renderTabs(); fillIcons();
  $('#hamburger').onclick = () => $('#sidebar').classList.toggle('expanded');
  $('#tabs').onclick = e => {
    const c = e.target.closest('[data-close]'); if (c) { e.stopPropagation(); return closeTab(c.dataset.close); }
    const t = e.target.closest('.tab'); if (!t) return;
    if (t.id === 'addTab') { popup(t); return; }
    S.active = t.dataset.id; renderTabs();
  };
  const tick = () => { const d = new Date(); $('#clock').textContent = d.toLocaleDateString('fr-FR', { weekday: 'short' }) + ' ' + d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); };
  tick(); setInterval(tick, 30000);
}
function popup(anchor) {
  $$('.popup-menu').forEach(p => p.remove());
  const r = anchor.getBoundingClientRect();
  const p = el(`<div class="popup-menu" style="left:${r.left}px;top:${r.bottom}px">${Object.keys(VIEWS).map(k => `<button type="button" data-v="${k}">${VIEWS[k].title}</button>`).join('')}</div>`);
  p.onclick = e => { const b = e.target.closest('button'); if (b) { p.remove(); openTab(b.dataset.v); } };
  document.body.append(p);
  setTimeout(() => document.addEventListener('click', function h() { p.remove(); document.removeEventListener('click', h); }, { once: true }), 0);
}
function enterModule() {
  S.company = $('#company').selectedOptions[0].textContent; S.exercice = $('#fiscalYear').value;
  $('#loginView').classList.add('hidden'); $('#shellView').classList.remove('hidden');
  $('#companyLabel').textContent = '— ' + S.company; $('#exerciceLabel').textContent = 'Exercice ' + S.exercice;
  S.tabs = []; S.active = null; initShell();
}

/* ---------- Connexion ---------- */
fillIcons();
$('#username').onfocus = () => $('#credentialSuggestions').style.display = 'block';
$('#username').oninput = e => { if (e.target.value === 'admin') $('#credentialSuggestions').style.display = 'none'; };
$('#username').onblur = () => setTimeout(() => $('#credentialSuggestions').style.display = 'none', 150);
$('#credentialSuggestions').onmousedown = () => { $('#username').value = 'admin'; $('#credentialSuggestions').style.display = 'none'; };
$('#togglePassword').onclick = () => { const p = $('#password'); if (p.value === '••••••••' && p.type === 'password') { p.type = 'text'; } else p.type = p.type === 'password' ? 'text' : 'password'; };
$('#forgotLink').onclick = e => { e.preventDefault(); msg('Veuillez contacter l’administrateur du système pour réinitialiser votre mot de passe.'); };
$('#helpBtn').onclick = () => msg('Module Rapprochement bancaire — pour toute assistance, contactez le support CLINISYS.');
$('#langBtn').onclick = () => msg('Seule la langue française est disponible dans ce module.');
$('#credentialsBtn').onclick = () => {
  if (!$('#username').value.trim() || !$('#password').value.trim()) return msg('Veuillez saisir votre identifiant et votre mot de passe.');
  $('#authStep1').classList.add('hidden'); $('#authStep2').classList.remove('hidden');
  $('#authTitle').textContent = 'Choisir l’environnement'; $('#authSubtitle').textContent = 'Sélectionnez la société et l’exercice'; $('#company').focus();
};
$('#backToCredentials').onclick = () => { $('#authStep2').classList.add('hidden'); $('#authStep1').classList.remove('hidden'); $('#authTitle').textContent = 'Connexion'; $('#authSubtitle').textContent = 'Accédez à votre espace de travail'; $('#username').focus(); };
$('#loginForm').onsubmit = e => {
  e.preventDefault();
  if (!$('#authStep1').classList.contains('hidden')) return $('#credentialsBtn').click();
  if (!$('#company').value || !$('#fiscalYear').value) return msg('Veuillez sélectionner la société et l’exercice.');
  enterModule();
};

/* ---------- Barre supérieure : profil, recherche, raccourcis ---------- */
$('#profileBtn').onclick = e => { e.stopPropagation(); $('#profileMenu').classList.toggle('hidden'); };
document.addEventListener('click', e => { if (!e.target.closest('#profileMenu') && !e.target.closest('#profileBtn')) $('#profileMenu').classList.add('hidden'); });
$('#logoutBtn').onclick = () => { $('#profileMenu').classList.add('hidden'); quit(); };
$('#changeExerciceBtn').onclick = () => { $('#profileMenu').classList.add('hidden'); changeExercice(); };
$('#textSize').onclick = e => { const b = e.target.closest('button'); if (!b) return; $$('#textSize button').forEach(x => x.classList.toggle('selected', x === b)); document.body.style.fontSize = b.dataset.size + 'px'; };
$('#fullscreenToggle').onchange = e => { if (e.target.checked) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => { e.target.checked = false; }); else document.fullscreenElement && document.exitFullscreen(); };
document.addEventListener('fullscreenchange', () => { $('#fullscreenToggle').checked = !!document.fullscreenElement; });

let searchIdx = 0, searchList = [];
function renderSearch() {
  const t = norm($('#searchInput').value.trim());
  searchList = COMMANDS.filter(c => !t || norm(c.label + ' ' + c.hint).includes(t)); searchIdx = Math.min(searchIdx, Math.max(0, searchList.length - 1));
  $('#searchResults').innerHTML = searchList.length ? searchList.map((c, i) => `<button type="button" class="${i === searchIdx ? 'active' : ''}" data-i="${i}"><span>${c.label}</span><small>${c.hint}</small></button>`).join('') : '<div class="empty-row">Aucun résultat</div>';
}
const openSearch = () => { $('#searchModal').classList.remove('hidden'); $('#searchInput').value = ''; searchIdx = 0; renderSearch(); $('#searchInput').focus(); };
const closeSearch = () => $('#searchModal').classList.add('hidden');
const runSearch = i => { const c = searchList[i]; if (!c) return; closeSearch(); c.act(); };
$('#globalSearch').onclick = openSearch;
$('.close-modal').onclick = closeSearch;
$('#searchModal').onclick = e => { if (e.target.id === 'searchModal') closeSearch(); };
$('#searchInput').oninput = () => { searchIdx = 0; renderSearch(); };
$('#searchInput').onkeydown = e => {
  if (e.key === 'ArrowDown') { searchIdx = Math.min(searchList.length - 1, searchIdx + 1); renderSearch(); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { searchIdx = Math.max(0, searchIdx - 1); renderSearch(); e.preventDefault(); }
  else if (e.key === 'Enter') runSearch(searchIdx);
};
$('#searchResults').onclick = e => { const b = e.target.closest('button'); if (b) runSearch(+b.dataset.i); };
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !$('#shellView').classList.contains('hidden')) { e.preventDefault(); openSearch(); return; }
  if (e.key !== 'Escape') return;
  const dlgs = $$('.bank-modal-backdrop'); if (dlgs.length) return dlgs[dlgs.length - 1].remove();
  if (!$('#searchModal').classList.contains('hidden')) return closeSearch();
  const pv = $$('.pdf-overlay'); if (pv.length) return pv[pv.length - 1].remove();
  $('#profileMenu').classList.add('hidden');
});
