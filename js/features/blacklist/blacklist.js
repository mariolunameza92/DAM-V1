// Feature Black List — vista de personas bloqueadas con CRUD básico.
// Exports: initBlacklist(), renderBlacklist()
import { getBlacklist, addToBlacklist, removeFromBlacklist, renameBlacklistItem, updateBlacklistFace, getAppearancesForId } from '../../blacklist-store.js';
import { showToast } from '../../components/ui/toast.js';
import { bindStaticToggle } from '../../components/ui/view-toggle.js';
import { resizeToDataURL } from '../carpetas/upload.js';
import { getPortals } from '../../session.js';
import { PHOTO_FACES, FOLDER_IMAGES_EVENTS } from '../../events-registry.js';
import { TREE_DATA } from '../../data.js';

let _view = 'list';
let _sort = { col: null, dir: 'asc' };

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// ── Portales que incluyen a una persona de blacklist ──────────────────────────
let _pfMap = null;
function _photoFolderMap() {
  if (_pfMap) return _pfMap;
  _pfMap = {};
  for (const [fid, photos] of Object.entries(FOLDER_IMAGES_EVENTS))
    for (const p of photos) _pfMap[p] = fid;
  return _pfMap;
}
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
  const pm = _getParentMap();
  const allFolders = new Set(folders);
  for (const fid of folders) {
    let cur = fid;
    while (pm[cur]) { allFolders.add(pm[cur]); cur = pm[cur]; }
  }
  return getPortals().filter(p => p.type !== 'master' && (p.folderIds || []).some(f => allFolders.has(f)));
}

// ── Render ────────────────────────────────────────────────────────────────────

function _sorted(items) {
  if (!_sort.col) return items;
  return [...items].sort((a, b) => {
    let va, vb;
    const appA = getAppearancesForId(a.id), appB = getAppearancesForId(b.id);
    switch (_sort.col) {
      case 'name':     va = a.name;                       vb = b.name;                       break;
      case 'photos':   va = appA.photos;                 vb = appB.photos;                 break;
      case 'portales': va = _portalsForFace(a.id).length; vb = _portalsForFace(b.id).length; break;
      case 'registro': va = a.registro;                  vb = b.registro;                  break;
      case 'addedBy':  va = a.addedBy;                   vb = b.addedBy;                   break;
      default: return 0;
    }
    const m = _sort.dir === 'asc' ? 1 : -1;
    return typeof va === 'number' ? (va - vb) * m : String(va).localeCompare(String(vb), 'es') * m;
  });
}

function _sortHead(col, label) {
  const asc  = _sort.col === col && _sort.dir === 'asc';
  const desc = _sort.col === col && _sort.dir === 'desc';
  return `<div class="col faceid-sort-col" data-bl-sort="${col}">${label}<span class="faceid-sort-arrows"><span class="msi faceid-sort-icon${asc ? ' sort-active' : ''}">arrow_upward</span><span class="msi faceid-sort-icon${desc ? ' sort-active' : ''}">arrow_downward</span></span></div>`;
}

function _listHTML(items) {
  if (!items.length) {
    return `<div class="faceids-empty">No hay personas en la lista negra.</div>`;
  }
  const head = `<div class="table-head">${_sortHead('name','Persona')}${_sortHead('photos','Apariciones')}${_sortHead('portales','Portales')}${_sortHead('registro','Registro')}${_sortHead('addedBy','Agregado por')}</div>`;
  const rows = items.map(item => {
    const app = getAppearancesForId(item.id);
    const portals = _portalsForFace(item.id);
    const portalsHtml = portals.length
      ? portals.map(p => `<span class="rel-pill rel-pill--unit faceid-portal-pill" title="${esc(p.title)}">${esc(p.title)}</span>`).join('')
      : `<span class="faceid-no-portals">—</span>`;
    return `<div class="table-row" data-bl-id="${item.id}">
      <div class="col"><div class="faceid-person-cell">
        <div class="bl-av"><img src="${item.selfieUrl}" alt=""></div>
        <span class="faceid-person-name">${esc(item.name)}</span>
      </div></div>
      <div class="col"><div class="content-cell">
        <span class="content-chip"><span class="msi xs" style="color:var(--g500)">folder</span>&nbsp;${app.folders}</span>
        <span class="content-chip"><span class="msi xs" style="color:var(--g500)">image</span>&nbsp;${app.photos.toLocaleString('es')}</span>
      </div></div>
      <div class="col col--portales"><div class="rel-pills">${portalsHtml}</div></div>
      <div class="col">${esc(item.registro)}</div>
      <div class="col" style="display:flex;align-items:center;gap:12px">
        <span style="flex:1">${esc(item.addedBy)}</span>
        <button class="more-btn" data-bl-menu="${item.id}"><span class="msi xs">more_horiz</span></button>
      </div>
    </div>`;
  }).join('');
  return `<div class="table-wrap">${head}${rows}</div>`;
}

function _gridHTML(items) {
  const addCard =
    `<div class="faceid-card faceid-card--add" id="bl-add-card-btn">
      <div class="faceid-card-av"><span class="msi" style="font-size:40px">add</span></div>
      <div class="faceid-card-name">Agregar</div>
    </div>`;
  const cards = items.map(item => {
    const app = getAppearancesForId(item.id);
    const portals = _portalsForFace(item.id);
    const portalsStr = portals.length
      ? `${portals.length} portal${portals.length === 1 ? '' : 'es'}`
      : 'Sin portales';
    return `<div class="faceid-card bl-card" data-bl-id="${item.id}">
      <div class="bl-card-badge"><span class="msi xs">person_off</span></div>
      <div class="faceid-card-av"><img src="${item.selfieUrl}" alt=""></div>
      <div class="faceid-card-name">${esc(item.name)}</div>
      <div class="bl-card-meta">${app.photos} fotos · ${portalsStr}</div>
      <button class="faceid-card-more" data-bl-menu="${item.id}"><span class="msi xs">more_horiz</span></button>
    </div>`;
  }).join('');
  const empty = !items.length
    ? `<div class="faceids-empty">No hay personas en la lista negra.</div>`
    : '';
  return `<div class="faceids-grid">${addCard}${cards}</div>${empty}`;
}

function _updateBadge() {
  const badge = document.getElementById('bl-total-badge');
  if (!badge) return;
  const n = getBlacklist().length;
  badge.textContent = n === 1 ? '1 persona' : `${n} personas`;
}

export function renderBlacklist() {
  const body = document.getElementById('bl-body');
  if (!body) return;
  const items = _sorted(getBlacklist());
  body.innerHTML = _view === 'grid' ? _gridHTML(items) : _listHTML(items);
  _updateBadge();
}

// ── Menú flotante "⋯" ────────────────────────────────────────────────────────

let _outsideArmed = false;

function closeFloating() {
  document.querySelectorAll('.bl-menu').forEach(e => e.remove());
}

function _position(el, anchor) {
  const r = anchor.getBoundingClientRect();
  let left = r.right - el.offsetWidth;
  let top  = r.bottom + 6;
  if (left < 8) left = 8;
  if (top + el.offsetHeight > window.innerHeight - 8) top = r.top - el.offsetHeight - 6;
  el.style.left = Math.max(8, left) + 'px';
  el.style.top  = Math.max(8, top)  + 'px';
}

function _armOutside() {
  if (_outsideArmed) return;
  _outsideArmed = true;
  const scroller = document.querySelector('.content-scroll');
  const close = e => {
    if (e?.type === 'mousedown' && e.target.closest('.bl-menu')) return;
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
  const item = getBlacklist().find(i => i.id === id);
  if (!item) return;
  const menu = document.createElement('div');
  menu.className = 'faceid-menu bl-menu';
  menu.innerHTML =
    `<button class="faceid-menu-item" data-act="edit"><span class="msi xs">edit</span>Editar</button>
     <div class="faceid-menu-divider"></div>
     <button class="faceid-menu-item faceid-menu-item--danger" data-act="remove"><span class="msi xs">person_off</span>Quitar de lista negra</button>`;
  document.body.appendChild(menu);
  _position(menu, anchor);
  menu.addEventListener('click', ev => {
    const it = ev.target.closest('[data-act]');
    if (!it) return;
    closeFloating();
    if (it.dataset.act === 'edit')   openEditDialog(item);
    if (it.dataset.act === 'remove') openRemoveDialog(item);
  });
  _armOutside();
}

// ── Diálogo: agregar a lista negra ────────────────────────────────────────────

let _addPhoto = null;

function openAddDialog() {
  _addPhoto = null;
  document.getElementById('bl-add-name').value = '';
  document.getElementById('bl-add-hint').textContent = '';
  document.getElementById('bl-add-preview').style.display = 'none';
  document.getElementById('bl-add-icon').style.display = '';
  document.getElementById('bl-add-droptext').textContent = 'Subir foto del rostro';
  document.getElementById('bl-add-dlg').style.display = '';
  setTimeout(() => document.getElementById('bl-add-name').focus(), 50);
}

function closeAddDialog() {
  document.getElementById('bl-add-dlg').style.display = 'none';
  _addPhoto = null;
}

function _initAddDialog() {
  const dlg  = document.getElementById('bl-add-dlg');
  if (!dlg) return;
  const drop = document.getElementById('bl-add-drop');
  const file = document.getElementById('bl-add-file');
  const name = document.getElementById('bl-add-name');
  const hint = document.getElementById('bl-add-hint');

  drop.addEventListener('click', () => file.click());
  file.addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      _addPhoto = await resizeToDataURL(f, 200, 0.8);
      document.getElementById('bl-add-img').src = _addPhoto;
      document.getElementById('bl-add-preview').style.display = '';
      document.getElementById('bl-add-icon').style.display = 'none';
      document.getElementById('bl-add-droptext').textContent = 'Cambiar foto';
      hint.textContent = '';
    } catch { hint.textContent = 'No se pudo procesar la imagen'; }
    e.target.value = '';
  });

  const confirm = () => {
    const nm = name.value.trim();
    if (!nm)      { hint.textContent = 'Ingresá un nombre'; name.classList.add('inp-error'); setTimeout(() => name.classList.remove('inp-error'), 350); return; }
    if (!_addPhoto) { hint.textContent = 'Subí una foto del rostro'; return; }
    const item = addToBlacklist({ name: nm, selfieUrl: _addPhoto });
    closeAddDialog();
    renderBlacklist();
    showToast(`${item.name} agregado/a a la lista negra`);
  };

  document.getElementById('bl-add-cancel').addEventListener('click', closeAddDialog);
  document.getElementById('bl-add-confirm').addEventListener('click', confirm);
  dlg.addEventListener('mousedown', e => { if (e.target === dlg) closeAddDialog(); });
  name.addEventListener('keydown', e => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') closeAddDialog(); });
}

// ── Diálogo: editar (renombrar + actualizar foto) ─────────────────────────────

let _editId   = null;
let _editPhoto = null;

function openEditDialog(item) {
  _editId    = item.id;
  _editPhoto = null;
  const name = document.getElementById('bl-edit-name');
  name.value = item.name || '';
  document.getElementById('bl-edit-hint').textContent = '';
  document.getElementById('bl-edit-img').src = item.selfieUrl;
  document.getElementById('bl-edit-preview').style.display = '';
  document.getElementById('bl-edit-droptext').textContent = 'Cambiar foto';
  document.getElementById('bl-edit-dlg').style.display = '';
  setTimeout(() => { name.focus(); name.select(); }, 50);
}

function closeEditDialog() {
  document.getElementById('bl-edit-dlg').style.display = 'none';
  _editId = null;
  _editPhoto = null;
}

function _initEditDialog() {
  const dlg  = document.getElementById('bl-edit-dlg');
  if (!dlg) return;
  const drop = document.getElementById('bl-edit-drop');
  const file = document.getElementById('bl-edit-file');
  const name = document.getElementById('bl-edit-name');
  const hint = document.getElementById('bl-edit-hint');

  drop.addEventListener('click', () => file.click());
  file.addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      _editPhoto = await resizeToDataURL(f, 200, 0.8);
      document.getElementById('bl-edit-img').src = _editPhoto;
      document.getElementById('bl-edit-preview').style.display = '';
      document.getElementById('bl-edit-droptext').textContent = 'Foto actualizada ✓';
      hint.textContent = '';
    } catch { hint.textContent = 'No se pudo procesar la imagen'; }
    e.target.value = '';
  });

  const confirm = () => {
    if (!_editId) return;
    const nm = name.value.trim();
    if (!nm) { hint.textContent = 'Ingresá un nombre'; name.classList.add('inp-error'); setTimeout(() => name.classList.remove('inp-error'), 350); return; }
    renameBlacklistItem(_editId, nm);
    if (_editPhoto) updateBlacklistFace(_editId, _editPhoto);
    closeEditDialog();
    renderBlacklist();
    showToast('Entrada actualizada');
  };

  document.getElementById('bl-edit-cancel').addEventListener('click', closeEditDialog);
  document.getElementById('bl-edit-confirm').addEventListener('click', confirm);
  dlg.addEventListener('mousedown', e => { if (e.target === dlg) closeEditDialog(); });
  name.addEventListener('keydown', e => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') closeEditDialog(); });
}

// ── Modal: advertencia quitar de lista negra ──────────────────────────────────

let _removeId = null;

function openRemoveDialog(item) {
  _removeId = item.id;
  const nameEl = document.getElementById('bl-remove-name');
  if (nameEl) nameEl.textContent = item.name;
  document.getElementById('bl-remove-dlg').style.display = '';
}

function closeRemoveDialog() {
  document.getElementById('bl-remove-dlg').style.display = 'none';
  _removeId = null;
}

function _initRemoveDialog() {
  const dlg = document.getElementById('bl-remove-dlg');
  if (!dlg) return;
  document.getElementById('bl-remove-cancel').addEventListener('click', closeRemoveDialog);
  document.getElementById('bl-remove-confirm').addEventListener('click', () => {
    if (!_removeId) return;
    const item = getBlacklist().find(i => i.id === _removeId);
    const nm = item?.name || 'Persona';
    removeFromBlacklist(_removeId);
    closeRemoveDialog();
    renderBlacklist();
    showToast(`${nm} quitado/a de la lista negra`);
  });
  dlg.addEventListener('mousedown', e => { if (e.target === dlg) closeRemoveDialog(); });
}

// ── Delegación de clicks ──────────────────────────────────────────────────────

function _onSecClick(e) {
  const sc = e.target.closest('[data-bl-sort]');
  if (sc) {
    const col = sc.dataset.blSort;
    _sort.dir = _sort.col === col ? (_sort.dir === 'asc' ? 'desc' : 'asc') : 'asc';
    _sort.col = col;
    renderBlacklist();
    return;
  }
  if (e.target.closest('#bl-add-card-btn')) { openAddDialog(); return; }
  const menuBtn = e.target.closest('[data-bl-menu]');
  if (menuBtn) { openMenu(menuBtn, menuBtn.dataset.blMenu); return; }
}

// ── Init ──────────────────────────────────────────────────────────────────────

let _inited = false;

export function initBlacklist() {
  if (_inited) { renderBlacklist(); return; }
  _inited = true;

  const sec = document.getElementById('sec-blacklist');
  if (!sec) return;

  bindStaticToggle('bl-grid-btn', 'bl-list-btn', () => _view, v => { _view = v; renderBlacklist(); });
  sec.addEventListener('click', _onSecClick);
  document.getElementById('bl-add-btn')?.addEventListener('click', openAddDialog);

  _initAddDialog();
  _initEditDialog();
  _initRemoveDialog();

  renderBlacklist();
}
