// Feature Face IDs — lista/grilla de rostros mapeados, favoritos, y CRUD básico.
// Exports: initFaceIds(), renderFaceIds()
import { getFaces, getFavoriteFaces, toggleFavorite, renameFace, identifyFace, deleteFace, createFace, subscribe } from '../../faces.js';
import { getGrupos, getGrupoForFace } from '../grupos/grupos-data.js';
import { getFaceConsent, revokeFaceConsent, subscribeFaceConsent } from './faces-consent.js';
import { showToast } from '../../components/atoms/toast.js';
import { bindStaticToggle } from '../../components/atoms/view-toggle.js';
import { resizeToDataURL } from '../carpetas/upload.js';
import { getPortals } from '../../session.js';
import { PHOTO_FACES, FOLDER_IMAGES_EVENTS } from '../../events-registry.js';
import { TREE_DATA } from '../../data.js';

let _view        = 'list';       // 'list' | 'grid'
let _tab         = 'identified'; // 'identified' | 'unnamed'
let _sort        = { col: null, dir: 'asc' };
let _groupFilter = null;         // null = todos | string = id de grupo

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// ── Portales que incluyen a un rostro (via folderIds ∩ carpetas del rostro) ────
let _pfMap = null;
function _photoFolderMap() {
  if (_pfMap) return _pfMap;
  _pfMap = {};
  for (const [fid, photos] of Object.entries(FOLDER_IMAGES_EVENTS))
    for (const p of photos) _pfMap[p] = fid;
  return _pfMap;
}
// Mapa child→parent construido desde TREE_DATA para expandir ancestros
let _parentMap = null;
function _getParentMap() {
  if (_parentMap) return _parentMap;
  _parentMap = {};
  function walk(nodes, parentId) {
    for (const n of nodes) {
      if (parentId) _parentMap[n.id] = parentId;
      walk(n.children || [], n.id);
    }
  }
  walk(TREE_DATA, null);
  return _parentMap;
}
function _portalsForFace(faceId) {
  const map = _photoFolderMap();
  const folders = new Set();
  for (const [url, ids] of Object.entries(PHOTO_FACES))
    if (ids.includes(faceId) && map[url]) folders.add(map[url]);
  if (!folders.size) return [];
  // Expandir con ancestros: lima42k-protocolares → también lima42k
  const pm = _getParentMap();
  const allFolders = new Set(folders);
  for (const fid of folders) {
    let cur = fid;
    while (pm[cur]) { allFolders.add(pm[cur]); cur = pm[cur]; }
  }
  return getPortals().filter(p => p.type !== 'master' && (p.folderIds || []).some(f => allFolders.has(f)));
}

// ── Render: favoritos ───────────────────────────────────────────────────────────
function renderFavStrip() {
  const strip = document.getElementById('faceids-fav-strip');
  if (!strip) return;
  const favs = getFavoriteFaces();
  const avs = favs.map(f =>
    `<div class="faceids-fav-av" data-fav-id="${f.id}" title="${esc(f.displayName)}">
      <img src="${f.selfieUrl}" alt="">
      <div class="faceids-fav-remove" data-fav-remove="${f.id}" title="Quitar de favoritos"><span class="msi xs">delete</span></div>
    </div>`).join('');
  const empty = `<span class="faceids-fav-empty">Aún no hay favoritos — usá el menú "⋯" o el botón +.</span>`;
  const addBtn = `<div class="faceids-fav-add" data-fav-add title="Agregar a favoritos"><span class="msi sm">add</span></div>`;
  strip.innerHTML = (favs.length ? avs : empty) + addBtn;
}

// ── Render: lista / grilla ──────────────────────────────────────────────────────
function _filtered() {
  let faces = getFaces().filter(f => _tab === 'identified' ? !f.unnamed : !!f.unnamed);
  if (_groupFilter) {
    faces = faces.filter(f => {
      const g = getGrupoForFace(f.id);
      return g && g.id === _groupFilter;
    });
  }
  return faces;
}

function _sorted(faces) {
  if (!_sort.col) return faces;
  if (_tab === 'unnamed' && _sort.col === 'name') return faces;
  return [...faces].sort((a, b) => {
    let va, vb;
    switch (_sort.col) {
      case 'name':     va = a.displayName;              vb = b.displayName;              break;
      case 'photos':   va = a.appearances.photos;        vb = b.appearances.photos;        break;
      case 'portales': va = _portalsForFace(a.id).length; vb = _portalsForFace(b.id).length; break;
      case 'registro': va = a.registro;                 vb = b.registro;                 break;
      case 'addedBy':  va = a.addedBy;                  vb = b.addedBy;                  break;
      default: return 0;
    }
    const m = _sort.dir === 'asc' ? 1 : -1;
    return typeof va === 'number' ? (va - vb) * m : String(va).localeCompare(String(vb), 'es') * m;
  });
}

function _sortHead(col, label) {
  const asc  = _sort.col === col && _sort.dir === 'asc';
  const desc = _sort.col === col && _sort.dir === 'desc';
  return `<div class="col faceid-sort-col" data-sort="${col}">${label}<span class="faceid-sort-arrows"><span class="msi faceid-sort-icon${asc ? ' sort-active' : ''}">arrow_upward</span><span class="msi faceid-sort-icon${desc ? ' sort-active' : ''}">arrow_downward</span></span></div>`;
}

function renderTabCounts() {
  const faces = getFaces();
  const sec = document.getElementById('sec-faceids');
  if (!sec) return;
  sec.querySelectorAll('.faceids-tab').forEach(btn => {
    const badge = btn.querySelector('.faceids-tab-count');
    if (badge) badge.textContent = btn.dataset.tab === 'identified'
      ? faces.filter(f => !f.unnamed).length
      : faces.filter(f => !!f.unnamed).length;
  });
}

function _switchToTab(t) {
  _tab = t;
  const sec = document.getElementById('sec-faceids');
  if (sec) sec.querySelectorAll('.faceids-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === t));
}

function _listHTML(faces) {
  if (!faces.length) {
    const msg = _tab === 'identified' ? 'No se encontraron personas identificadas.' : 'No hay personas sin identificar.';
    return `<div class="faceids-empty">${msg}</div>`;
  }
  const head = _tab === 'identified'
    ? `<div class="table-head">${_sortHead('name','Persona')}${_sortHead('photos','Apariciones')}${_sortHead('portales','Portales')}${_sortHead('registro','Registro')}${_sortHead('addedBy','Agregado por')}</div>`
    : `<div class="table-head"><div class="col">Persona</div>${_sortHead('photos','Apariciones')}${_sortHead('portales','Portales')}${_sortHead('registro','Registro')}${_sortHead('addedBy','Agregado por')}</div>`;
  const rows = faces.map(f => {
    const grupo = !f.unnamed ? getGrupoForFace(f.id) : null;
    const grupoBadge = grupo ? `<span class="faceid-group-badge" style="background:${grupo.color}20;color:${grupo.color};border-color:${grupo.color}40">${esc(grupo.name)}</span>` : '';
    const consentRec = !f.unnamed ? getFaceConsent(f.id) : null;
    const consentBadge = consentRec
      ? `<span class="faceid-consent-badge faceid-consent-badge--${consentRec.state}">${consentRec.state === 'signed' ? '<span class="msi xs">verified</span>Firmado' : '<span class="msi xs">schedule</span>Pendiente'}</span>`
      : '';
    const nameEl = f.unnamed
      ? `<input class="field field--inline" data-inline-rename="${f.id}" placeholder="Agregar nombre" autocomplete="off" spellcheck="false">`
      : `<span class="faceid-person-name">${esc(f.displayName)}</span>${grupoBadge}${consentBadge}`;
    const starBtn = f.fav
      ? `<button class="faceid-fav-star" data-fav-toggle="${f.id}" title="Quitar de favoritos"><span class="msi xs faceid-star-icon">star</span><span class="msi xs faceid-trash-icon">delete</span></button>`
      : '';
    const portals = _portalsForFace(f.id);
    const portalsHtml = portals.length
      ? portals.map(p => `<span class="rel-pill rel-pill--unit faceid-portal-pill" title="${esc(p.title)}">${esc(p.title)}</span>`).join('')
      : `<span class="faceid-no-portals">—</span>`;
    return `<div class="table-row" data-face-id="${f.id}">
      <div class="col"><div class="faceid-person-cell">
        <div class="faceid-av"><img src="${f.selfieUrl}" alt=""></div>
        ${nameEl}${starBtn}
      </div></div>
      <div class="col"><div class="content-cell">
        <span class="content-chip"><span class="msi xs" style="color:var(--text-muted)">folder</span>&nbsp;${f.appearances.folders}</span>
        <span class="content-chip"><span class="msi xs" style="color:var(--text-muted)">image</span>&nbsp;${f.appearances.photos.toLocaleString('es')}</span>
      </div></div>
      <div class="col col--portales"><div class="rel-pills">${portalsHtml}</div></div>
      <div class="col">${f.registro}</div>
      <div class="col" style="display:flex;align-items:center;gap:12px">
        <span style="flex:1">${f.unnamed ? 'IA' : esc(f.addedBy)}</span>
        <button class="more-btn" data-face-menu="${f.id}"><span class="msi xs">more_horiz</span></button>
      </div>
    </div>`;
  }).join('');
  return `<div class="table-wrap">${head}${rows}</div>`;
}

function _gridHTML(faces) {
  const addCard =
    `<div class="faceid-card faceid-card--add" data-faceid-add>
      <div class="faceid-card-av"><span class="msi" style="font-size:40px">add</span></div>
      <div class="faceid-card-name">Agregar</div>
    </div>`;
  const cards = faces.map(f => {
    const portals = _portalsForFace(f.id);
    const portalsStr = portals.length
      ? `${portals.length} portal${portals.length === 1 ? '' : 'es'}`
      : 'Sin portales';
    const grupo = !f.unnamed ? getGrupoForFace(f.id) : null;
    const grupoBadge = grupo ? `<div class="faceid-card-group" style="background:${grupo.color}20;color:${grupo.color}">${esc(grupo.name)}</div>` : '';
    const consentRecCard = !f.unnamed ? getFaceConsent(f.id) : null;
    const consentBadgeCard = consentRecCard
      ? `<div class="faceid-consent-badge faceid-consent-badge--${consentRecCard.state}" style="margin-top:2px">${consentRecCard.state === 'signed' ? '<span class="msi xs">verified</span>Firmado' : '<span class="msi xs">schedule</span>Pendiente'}</div>`
      : '';
    return `<div class="faceid-card" data-face-id="${f.id}">
      ${f.fav ? `<button class="faceid-card-star" data-fav-toggle="${f.id}" title="Quitar de favoritos"><span class="msi xs faceid-star-icon">star</span><span class="msi xs faceid-trash-icon">delete</span></button>` : ''}
      <div class="faceid-card-av"><img src="${f.selfieUrl}" alt=""></div>
      <div class="faceid-card-name${f.unnamed ? ' faceid-card-name--unnamed' : ''}">${esc(f.displayName)}</div>
      ${grupoBadge}${consentBadgeCard}
      <div class="faceid-card-meta">${f.appearances.photos} fotos · ${portalsStr}</div>
      <button class="faceid-card-more" data-face-menu="${f.id}"><span class="msi xs">more_horiz</span></button>
    </div>`;
  }).join('');
  const empty = !faces.length
    ? `<div class="faceids-empty">${_tab === 'identified' ? 'No se encontraron personas identificadas.' : 'No hay personas sin identificar.'}</div>`
    : '';
  return `<div class="faceids-grid">${addCard}${cards}</div>` + empty;
}

function _renderGroupFilters() {
  const el = document.getElementById('faceids-group-filters');
  if (!el) return;
  if (_tab !== 'identified') { el.innerHTML = ''; return; }

  const allIdentified = getFaces().filter(f => !f.unnamed);
  const grupos = getGrupos();
  const present = grupos.filter(g => g.memberIds.some(id => allIdentified.find(f => f.id === id)));

  if (!present.length) { el.innerHTML = ''; return; }

  const chips = present.map(g => {
    const active = _groupFilter === g.id;
    return `<button class="faceid-group-chip${active ? ' active' : ''}" data-gchip="${g.id}" style="--gc:${g.color}">${esc(g.name)}</button>`;
  }).join('');
  el.innerHTML = `<div class="faceid-group-filters-bar">${chips}</div>`;

  el.querySelectorAll('[data-gchip]').forEach(btn => {
    btn.addEventListener('click', () => {
      _groupFilter = _groupFilter === btn.dataset.gchip ? null : btn.dataset.gchip;
      _renderGroupFilters();
      renderBody();
    });
  });
}

function renderBody() {
  _renderGroupFilters();
  const body = document.getElementById('faceids-body');
  if (!body) return;
  const faces = _sorted(_filtered());
  body.innerHTML = _view === 'grid' ? _gridHTML(faces) : _listHTML(faces);
  renderTabCounts();
}

export function renderFaceIds() {
  renderFavStrip();
  renderBody();
}

// ── Popovers flotantes (menú "⋯" y picker de favoritos) ─────────────────────────
let _outsideArmed = false;
function closeFloating() {
  document.querySelectorAll('.faceid-menu, .faceid-picker').forEach(e => e.remove());
}
function _position(el, anchor) {
  const r = anchor.getBoundingClientRect();
  const w = el.offsetWidth, h = el.offsetHeight;
  let left = r.right - w;
  let top = r.bottom + 6;
  if (left < 8) left = 8;
  if (top + h > window.innerHeight - 8) top = r.top - h - 6;
  el.style.left = Math.max(8, left) + 'px';
  el.style.top = Math.max(8, top) + 'px';
}
function _armOutside() {
  if (_outsideArmed) return;
  _outsideArmed = true;
  const scroller = document.querySelector('.content-scroll');
  const close = e => {
    if (e && e.type === 'mousedown' && e.target.closest('.faceid-menu, .faceid-picker')) return;
    closeFloating();
    document.removeEventListener('mousedown', close, true);
    scroller?.removeEventListener('scroll', close, true);
    window.removeEventListener('resize', close, true);
    _outsideArmed = false;
  };
  setTimeout(() => document.addEventListener('mousedown', close, true), 0);
  scroller?.addEventListener('scroll', close, true);
  window.addEventListener('resize', close, true);
}

function openMenu(anchor, id) {
  closeFloating();
  const f = getFaces().find(x => x.id === id);
  if (!f) return;
  const menu = document.createElement('div');
  menu.className = 'faceid-menu';
  const consentRec = !f.unnamed ? getFaceConsent(f.id) : null;
  const revokeItem = consentRec
    ? `<div class="faceid-menu-divider"></div>
       <button class="faceid-menu-item faceid-menu-item--danger" data-act="revoke-consent"><span class="msi xs">gpp_bad</span>Revocar consentimiento</button>`
    : '';
  menu.innerHTML =
    `<button class="faceid-menu-item" data-act="fav"><span class="msi xs">star</span>${f.fav ? 'Quitar de favoritos' : 'Marcar como favorito'}</button>
     <button class="faceid-menu-item" data-act="rename"><span class="msi xs">edit</span>Renombrar</button>
     ${revokeItem}
     <div class="faceid-menu-divider"></div>
     <button class="faceid-menu-item faceid-menu-item--danger" data-act="delete"><span class="msi xs">delete</span>Eliminar Face ID</button>`;
  document.body.appendChild(menu);
  _position(menu, anchor);
  menu.addEventListener('click', ev => {
    const it = ev.target.closest('[data-act]');
    if (!it) return;
    closeFloating();
    if (it.dataset.act === 'fav') {
      const now = toggleFavorite(id);
      showToast(now ? 'Agregado a favoritos' : 'Quitado de favoritos');
    } else if (it.dataset.act === 'rename') {
      openRenameDialog(f);
    } else if (it.dataset.act === 'revoke-consent') {
      revokeFaceConsent(id, { name: f.displayName, selfieUrl: f.selfieUrl });
      showToast('Consentimiento revocado — persona añadida a Black List');
    } else if (it.dataset.act === 'delete') {
      deleteFace(id);
      showToast('Face ID eliminado');
    }
  });
  _armOutside();
}

function openFavPicker(anchor) {
  closeFloating();
  const faces = getFaces().filter(f => !f.fav);
  const pick = document.createElement('div');
  pick.className = 'faceid-picker';
  const rows = faces.map(f =>
    `<div class="faceid-picker-row" data-pick="${f.id}">
      <div class="faceid-picker-av"><img src="${f.selfieUrl}" alt=""></div>
      <span style="flex:1">${esc(f.displayName)}</span>
    </div>`).join('') || `<div class="cp-empty">Todos los rostros ya son favoritos.</div>`;
  pick.innerHTML = `<div class="cp-header">Agregar a favoritos</div><div class="faceid-picker-list">${rows}</div>`;
  document.body.appendChild(pick);
  _position(pick, anchor);
  pick.addEventListener('click', ev => {
    const r = ev.target.closest('[data-pick]');
    if (!r) return;
    toggleFavorite(r.dataset.pick);
    showToast('Agregado a favoritos');
    closeFloating();
  });
  _armOutside();
}

// ── Diálogo: crear Face ID ──────────────────────────────────────────────────────
let _createPhoto = null;

function openCreateDialog() {
  _createPhoto = null;
  document.getElementById('faceid-create-name').value = '';
  document.getElementById('faceid-create-hint').textContent = '';
  document.getElementById('faceid-create-preview').style.display = 'none';
  document.getElementById('faceid-create-icon').style.display = '';
  document.getElementById('faceid-create-droptext').textContent = 'Subir foto del rostro';
  document.getElementById('faceid-create-dlg').style.display = '';
  setTimeout(() => document.getElementById('faceid-create-name').focus(), 50);
}
function closeCreateDialog() { document.getElementById('faceid-create-dlg').style.display = 'none'; }

function _initCreateDialog() {
  const dlg = document.getElementById('faceid-create-dlg');
  if (!dlg) return;
  const drop = document.getElementById('faceid-create-drop');
  const file = document.getElementById('faceid-create-file');
  const name = document.getElementById('faceid-create-name');
  const hint = document.getElementById('faceid-create-hint');

  drop.addEventListener('click', () => file.click());
  file.addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      _createPhoto = await resizeToDataURL(f, 200, 0.8);
      document.getElementById('faceid-create-img').src = _createPhoto;
      document.getElementById('faceid-create-preview').style.display = '';
      document.getElementById('faceid-create-icon').style.display = 'none';
      document.getElementById('faceid-create-droptext').textContent = 'Cambiar foto';
      hint.textContent = '';
    } catch (err) { hint.textContent = 'No se pudo procesar la imagen'; }
    e.target.value = '';
  });

  const confirm = () => {
    const nm = name.value.trim();
    if (!nm) { hint.textContent = 'Ingresá un nombre'; name.classList.add('inp-error'); setTimeout(() => name.classList.remove('inp-error'), 350); return; }
    if (!_createPhoto) { hint.textContent = 'Subí una foto del rostro'; return; }
    createFace({ name: nm, selfieUrl: _createPhoto });
    closeCreateDialog();
    showToast('Face ID creado: ' + nm);
  };

  document.getElementById('faceid-create-cancel').addEventListener('click', closeCreateDialog);
  document.getElementById('faceid-create-confirm').addEventListener('click', confirm);
  dlg.addEventListener('mousedown', e => { if (e.target === dlg) closeCreateDialog(); });
  name.addEventListener('keydown', e => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') closeCreateDialog(); });
}

// ── Diálogo: renombrar ──────────────────────────────────────────────────────────
let _renameId = null;

function openRenameDialog(face) {
  _renameId = face.id;
  const name = document.getElementById('faceid-rename-name');
  name.value = face.name || '';
  document.getElementById('faceid-rename-hint').textContent = '';
  document.getElementById('faceid-rename-dlg').style.display = '';
  setTimeout(() => { name.focus(); name.select(); }, 50);
}
function closeRenameDialog() { document.getElementById('faceid-rename-dlg').style.display = 'none'; _renameId = null; }

function _initRenameDialog() {
  const dlg = document.getElementById('faceid-rename-dlg');
  if (!dlg) return;
  const name = document.getElementById('faceid-rename-name');
  const hint = document.getElementById('faceid-rename-hint');

  const confirm = () => {
    if (!_renameId) return;
    const nm = name.value.trim();
    if (!nm) { hint.textContent = 'Ingresá un nombre'; name.classList.add('inp-error'); setTimeout(() => name.classList.remove('inp-error'), 350); return; }
    renameFace(_renameId, nm);
    showToast('Nombre actualizado');
    closeRenameDialog();
  };

  document.getElementById('faceid-rename-cancel').addEventListener('click', closeRenameDialog);
  document.getElementById('faceid-rename-confirm').addEventListener('click', confirm);
  dlg.addEventListener('mousedown', e => { if (e.target === dlg) closeRenameDialog(); });
  name.addEventListener('keydown', e => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') closeRenameDialog(); });
}

// ── Delegación de clicks de la sección ──────────────────────────────────────────
function _onSecClick(e) {
  // Ordenar columnas
  const sc = e.target.closest('[data-sort]');
  if (sc) {
    const col = sc.dataset.sort;
    _sort.dir = _sort.col === col ? (_sort.dir === 'asc' ? 'desc' : 'asc') : 'asc';
    _sort.col = col;
    renderBody();
    return;
  }
  if (e.target.closest('[data-faceid-add]')) { openCreateDialog(); return; }
  const favRemove = e.target.closest('[data-fav-remove]');
  if (favRemove) { toggleFavorite(favRemove.dataset.favRemove); showToast('Quitado de favoritos'); return; }
  const favToggle = e.target.closest('[data-fav-toggle]');
  if (favToggle) { toggleFavorite(favToggle.dataset.favToggle); showToast('Quitado de favoritos'); return; }
  if (e.target.closest('[data-fav-add]')) { openFavPicker(e.target.closest('[data-fav-add]')); return; }
  const menuBtn = e.target.closest('[data-face-menu]');
  if (menuBtn) { openMenu(menuBtn, menuBtn.dataset.faceMenu); return; }
}

// ── Init ────────────────────────────────────────────────────────────────────────
export function initFaceIds() {
  const sec = document.getElementById('sec-faceids');
  if (!sec) return;

  bindStaticToggle('faceids-grid-btn', 'faceids-list-btn', () => _view, v => { _view = v; renderBody(); });

  sec.addEventListener('click', _onSecClick);

  // Rename inline: escribir nombre + Enter → mueve a "Personas identificadas"
  sec.addEventListener('keydown', e => {
    const inp = e.target.closest('[data-inline-rename]');
    if (!inp) return;
    if (e.key === 'Enter') {
      const nm = inp.value.trim();
      if (nm) {
        _switchToTab('identified');
        identifyFace(inp.dataset.inlineRename, nm);
        showToast(`${nm} identificado/a`);
      }
      e.preventDefault();
    } else if (e.key === 'Escape') {
      inp.value = '';
      inp.blur();
    }
  });

  sec.querySelectorAll('.faceids-tab').forEach(btn => {
    btn.addEventListener('click', () => { _switchToTab(btn.dataset.tab); renderBody(); });
  });

  _initCreateDialog();
  _initRenameDialog();

  subscribe(() => { renderFavStrip(); renderBody(); });
  subscribeFaceConsent(() => renderBody());
  renderFaceIds();
}
