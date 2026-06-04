// Exports: initContextMenu()
import { showToast } from '../../components/ui/toast.js';
import { toggleSelected, clearSelection, selectAll, isSelected, selectionStore } from './selection.js';

const DEMO_PERSONAS = [
  { name: 'Javier Ruiz',    email: 'javier.ruiz@workk.com',  color: '#4a6cf7', role: 'Editar' },
  { name: 'Cesar Lanfranco', email: 'c.lanfranco@email.com', color: '#e06b3f', role: 'Ver' },
];

const DEMO_GRUPOS = [
  {
    name: 'Marketing',
    expanded: true,
    members: [
      { name: 'Carlos Riveros', email: 'carlos.riveros@mkt100.com', color: '#3fa66b', role: 'Editar' },
      { name: 'Amy Ramirez',    email: 'amy.ramirez@mkt100.com',   color: '#9b4fe0', role: 'Ver' },
    ],
  },
  { name: 'Agencia Grey', expanded: false, members: [] },
  { name: 'Legal',        expanded: false, members: [] },
];

// ── Menu singleton ────────────────────────────────────────────────
let _menu = null;
let _target = null;
let _groupMode = false; // true when the action applies to the whole multi-selection

function _keyForTarget() {
  if (!_target) return null;
  if (_target.type === 'folder') return `folder:${_target.el.dataset.nodeId || ''}`;
  if (_target.type === 'asset')  return `asset:${_target.el.dataset.section || ''}:${_target.el.dataset.idx || ''}`;
  return null;
}

// Elements an action operates on: the whole selection (group mode) or the single target.
function _selectedEls() {
  return [...document.querySelectorAll('.folder-card.is-selected, .asset-card.is-selected')];
}
function _actionEls() {
  return _groupMode ? _selectedEls() : (_target?.el ? [_target.el] : []);
}
function _actionLabel() {
  if (_groupMode) {
    const n = _selectedEls().length;
    return `${n} elemento${n !== 1 ? 's' : ''}`;
  }
  return `"${_target?.name || ''}"`;
}

function _initMenu() {
  _menu = document.createElement('div');
  _menu.className = 'ctx-menu';
  _menu.innerHTML = `
    <div class="ctx-group-count" style="display:none"></div>
    <button class="ctx-item ctx-item--sel" data-action="select">Seleccionar</button>
    <button class="ctx-item ctx-item--selall" data-action="select-all">Seleccionar todo</button>
    <button class="ctx-item ctx-item--desel" data-action="deselect-all">Limpiar selección</button>
    <div class="ctx-divider"></div>
    <button class="ctx-item" data-action="share">Compartir</button>
    <button class="ctx-item" data-action="download">Descargar</button>
    <button class="ctx-item" data-action="duplicate">Duplicar</button>
    <div class="ctx-divider"></div>
    <button class="ctx-item" data-action="move">Mover a</button>
    <button class="ctx-item ctx-item--rename" data-action="rename">Cambiar nombre</button>
    <div class="ctx-divider ctx-divider--rename"></div>
    <button class="ctx-item ctx-item--danger" data-action="delete">Eliminar</button>
  `;
  document.body.appendChild(_menu);

  _menu.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    _close();
    const action = btn.dataset.action;
    if (action === 'select') {
      const k = _keyForTarget();
      if (k) toggleSelected(k);
    }
    if (action === 'select-all')  selectAll();
    if (action === 'deselect-all') clearSelection();
    if (action === 'share')     _openShareModal();
    if (action === 'download')  _doDownload();
    if (action === 'duplicate') _doDuplicate();
    if (action === 'move')      _openMoveModal();
    if (action === 'rename')    _openRenameModal();
    if (action === 'delete')    _doDelete();
  });
}

function _open(e, targetEl, type) {
  const name = type === 'folder'
    ? (targetEl.querySelector('.folder-name')?.textContent || 'Carpeta')
    : (targetEl.querySelector('.asset-name')?.textContent || 'Archivo');

  _target = { type, el: targetEl, name };

  // Group mode: right-clicked item is part of a multi-selection.
  // Right-clicking outside the selection resets it to a single-item action.
  const k = _keyForTarget();
  const targetIsSelected = k && isSelected(k);
  if (!targetIsSelected) clearSelection();
  _groupMode = targetIsSelected && selectionStore.size > 1;

  // Visual: in group mode keep the whole selection highlighted; otherwise
  // mirror the single-item active style on the target.
  document.querySelectorAll('.ctx-active').forEach(el => el.classList.remove('ctx-active'));
  if (!_groupMode) targetEl.classList.add('ctx-active');

  // ── Toggle menu items by mode ──────────────────────────────────
  const countEl = _menu.querySelector('.ctx-group-count');
  if (_groupMode) {
    const n = selectionStore.size;
    countEl.textContent   = `${n} seleccionados`;
    countEl.style.display = '';
  } else {
    countEl.style.display = 'none';
  }

  // Single-item helpers only make sense outside group mode
  const selBtn = _menu.querySelector('.ctx-item--sel');
  selBtn.style.display = _groupMode ? 'none' : '';
  selBtn.textContent   = targetIsSelected ? 'Deseleccionar' : 'Seleccionar';

  _menu.querySelector('.ctx-item--desel').style.display = selectionStore.size > 0 ? '' : 'none';

  // Rename has no meaning for a group
  _menu.querySelector('.ctx-item--rename').style.display     = _groupMode ? 'none' : '';
  _menu.querySelector('.ctx-divider--rename').style.display  = _groupMode ? 'none' : '';

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const mw = 190, mh = 300;
  let x = e.clientX, y = e.clientY;
  if (x + mw > vw) x = vw - mw - 8;
  if (y + mh > vh) y = vh - mh - 8;

  _menu.style.left = x + 'px';
  _menu.style.top  = y + 'px';
  _menu.classList.add('open');
}

function _close() {
  _menu.classList.remove('open');
  document.querySelectorAll('.ctx-active').forEach(el => el.classList.remove('ctx-active'));
}

// ── Direct actions (operate on the group in group mode) ───────────
function _doDownload() {
  showToast(`Descargando ${_actionLabel()}…`);
}

function _doDuplicate() {
  const els = _actionEls();
  if (!els.length) return;
  els.forEach(el => {
    const clone = el.cloneNode(true);
    clone.classList.remove('is-selected', 'ctx-active');
    clone.style.opacity = '0';
    clone.style.transform = 'scale(0.94)';
    clone.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
    el.parentNode.insertBefore(clone, el.nextSibling);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      clone.style.opacity = '1';
      clone.style.transform = 'scale(1)';
    }));
  });
  showToast(`${_actionLabel()} duplicado${_groupMode ? 's' : ''}`);
}

function _doDelete() {
  const els = _actionEls();
  if (!els.length) return;
  const label = _actionLabel();
  const wasGroup = _groupMode;
  els.forEach(el => {
    el.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    el.style.opacity = '0';
    el.style.transform = 'scale(0.92)';
    setTimeout(() => el.remove(), 220);
  });
  if (wasGroup) clearSelection();
  showToast(`${label} eliminado${wasGroup ? 's' : ''}`);
}

// ── Modal system ──────────────────────────────────────────────────
function _createOverlay(html) {
  const overlay = document.createElement('div');
  overlay.className = 'ctx-overlay';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('open')));
  overlay.addEventListener('click', e => {
    if (e.target === overlay) _closeOverlay(overlay);
  });
  overlay.querySelector('.ctx-modal-close')?.addEventListener('click', () => _closeOverlay(overlay));
  return overlay;
}

function _closeOverlay(overlay) {
  overlay.classList.remove('open');
  setTimeout(() => overlay.remove(), 250);
}

// ── Person row HTML ───────────────────────────────────────────────
function _personRowHTML(p, showRole = true) {
  return `
    <div class="ctx-person-row">
      <div class="ctx-avatar-initials" style="background:${p.color}">${p.name.split(' ').map(w => w[0]).join('')}</div>
      <div class="ctx-person-info">
        <div class="ctx-person-name">${p.name}</div>
        <div class="ctx-person-email">${p.email}</div>
      </div>
      ${showRole ? `
        <button class="ctx-role-btn">
          ${p.role}<span class="msi xs">keyboard_arrow_down</span>
        </button>
      ` : ''}
    </div>
  `;
}

// ── Personas tab ──────────────────────────────────────────────────
function _personasTab() {
  return `
    <div class="ctx-search-wrap">
      <span class="msi xs">frame_inspect</span>
      <input class="ctx-search" placeholder="Ingresa un nombre o correo">
    </div>
    <div class="ctx-people-list">
      ${DEMO_PERSONAS.map(p => _personRowHTML(p)).join('')}
    </div>
  `;
}

// ── Grupos tab ────────────────────────────────────────────────────
function _gruposTab() {
  return `
    <div class="ctx-search-wrap">
      <span class="msi xs">frame_inspect</span>
      <input class="ctx-search" placeholder="Ingresa un grupo">
    </div>
    <button class="ctx-btn-primary" data-action="abrir-crear-grupo">CREAR GRUPO</button>
    <div class="ctx-groups-list">
      ${DEMO_GRUPOS.map((g, gi) => `
        <div class="ctx-group${g.expanded ? '' : ' collapsed'}" data-gi="${gi}">
          <div class="ctx-group-header">
            <span class="ctx-group-name">${g.name}</span>
            <span class="msi xs ctx-group-chevron">keyboard_arrow_up</span>
          </div>
          <div class="ctx-group-body">
            ${g.members.map(m => _personRowHTML(m)).join('')}
            <button class="ctx-add-link" data-action="agregar-al-grupo" data-gi="${gi}">
              <span class="msi xs">add</span> AGREGAR PERSONAS AL GRUPO
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Compartir modal ───────────────────────────────────────────────
function _openShareModal() {
  const overlay = _createOverlay(`
    <div class="ctx-modal">
      <div class="ctx-modal-close-wrap">
        <button class="ctx-modal-close"><span class="msi xs">close</span></button>
      </div>
      <div class="ctx-modal-head">
        <span class="ctx-modal-title">Compartir</span>
        <div class="ctx-tabs">
          <button class="ctx-tab-btn active" data-tab="personas">
            <span class="msi xs">account_circle</span> Personas
          </button>
          <button class="ctx-tab-btn" data-tab="grupos">
            <span class="msi xs">group</span> Grupos
          </button>
        </div>
      </div>
      <div class="ctx-tab-body">
        <div class="ctx-tab-panel active" data-panel="personas">${_personasTab()}</div>
        <div class="ctx-tab-panel" data-panel="grupos">${_gruposTab()}</div>
      </div>
    </div>
  `);

  overlay.querySelectorAll('.ctx-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.ctx-tab-btn').forEach(b => b.classList.remove('active'));
      overlay.querySelectorAll('.ctx-tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      overlay.querySelector(`[data-panel="${btn.dataset.tab}"]`).classList.add('active');
    });
  });

  overlay.addEventListener('click', e => {
    const header = e.target.closest('.ctx-group-header');
    if (header) { header.closest('.ctx-group').classList.toggle('collapsed'); return; }

    if (e.target.closest('[data-action="abrir-crear-grupo"]')) {
      _closeOverlay(overlay);
      _openCrearGrupoModal();
      return;
    }
    if (e.target.closest('[data-action="agregar-al-grupo"]')) {
      _closeOverlay(overlay);
      _openCrearGrupoModal();
    }
  });
}

// ── Crear grupo modal ─────────────────────────────────────────────
function _openCrearGrupoModal() {
  const overlay = _createOverlay(`
    <div class="ctx-modal">
      <div class="ctx-modal-close-wrap">
        <button class="ctx-modal-close"><span class="msi xs">close</span></button>
      </div>
      <div class="ctx-modal-head">
        <span class="ctx-modal-title">Crear grupo</span>
      </div>
      <div class="ctx-form-body">
        <input class="ctx-form-input" id="ctxGrupoName" placeholder="Ingresa un nombre del grupo" autocomplete="off">
        <div class="ctx-email-row">
          <input class="ctx-form-input" id="ctxGrupoEmail" placeholder="Ingresa un nombre o correo" autocomplete="off" style="flex:1">
          <button class="ctx-btn-primary" id="ctxGrupoAddBtn">AGREGAR</button>
        </div>
        <div class="ctx-divider-or">
          <div class="ctx-divider-or-line"></div>
          <span class="ctx-divider-or-text">O</span>
          <div class="ctx-divider-or-line"></div>
        </div>
        <div class="ctx-import-row">
          <button class="ctx-btn-outline">
            <span class="msi xs">download</span>DESCARGAR PLANTILLA
          </button>
          <button class="ctx-btn-outline">
            <span class="msi xs">upload</span>IMPORTAR CSV/EXCEL
          </button>
        </div>
        <div class="ctx-people-list" id="ctxGrupoList">
          ${[
            { name: 'Carlos Riveros',  email: 'carlos.riveros@mkt100.com', color: '#3fa66b', role: 'Ver' },
            { name: 'Cesar Lanfranco', email: 'c.lanfranco@mkt100.com',    color: '#e06b3f', role: 'Ver' },
          ].map(p => _personRowHTML(p)).join('')}
        </div>
        <button class="ctx-btn-primary" id="ctxCrearGrupoBtn">CREAR GRUPO</button>
      </div>
    </div>
  `);

  overlay.querySelector('#ctxGrupoAddBtn').addEventListener('click', () => {
    const input = overlay.querySelector('#ctxGrupoEmail');
    const email = input.value.trim();
    if (!email) return;
    const colors = ['#4a6cf7','#e06b3f','#3fa66b','#9b4fe0','#c0a030'];
    const color  = colors[Math.floor(Math.random() * colors.length)];
    const name   = email.split('@')[0];
    const row = document.createElement('div');
    row.innerHTML = _personRowHTML({ name, email, color, role: 'Ver' });
    overlay.querySelector('#ctxGrupoList').appendChild(row.firstElementChild);
    input.value = '';
  });

  overlay.querySelector('#ctxCrearGrupoBtn').addEventListener('click', () => {
    const name = overlay.querySelector('#ctxGrupoName').value.trim() || 'Nuevo grupo';
    _closeOverlay(overlay);
    showToast(`Grupo "${name}" creado`);
  });
}

// ── Mover a modal ─────────────────────────────────────────────────
function _openMoveModal() {
  const overlay = _createOverlay(`
    <div class="ctx-modal">
      <div class="ctx-modal-close-wrap">
        <button class="ctx-modal-close"><span class="msi xs">close</span></button>
      </div>
      <div class="ctx-modal-head">
        <span class="ctx-modal-title">Mover a</span>
      </div>
      <div class="ctx-simple-form">
        <input class="ctx-form-input" id="ctxMoveInput" placeholder="Nombre de la carpeta destino" autocomplete="off">
        <button class="ctx-btn-primary" id="ctxMoveBtn" style="align-self:flex-end">MOVER</button>
      </div>
    </div>
  `);

  const label    = _actionLabel();
  const wasGroup = _groupMode;
  overlay.querySelector('#ctxMoveBtn').addEventListener('click', () => {
    const dest = overlay.querySelector('#ctxMoveInput').value.trim();
    _closeOverlay(overlay);
    if (wasGroup) clearSelection();
    showToast(dest ? `${label} movido${wasGroup ? 's' : ''} a "${dest}"` : `${label} movido${wasGroup ? 's' : ''}`);
  });
}

// ── Cambiar nombre modal ──────────────────────────────────────────
function _openRenameModal() {
  const overlay = _createOverlay(`
    <div class="ctx-modal">
      <div class="ctx-modal-close-wrap">
        <button class="ctx-modal-close"><span class="msi xs">close</span></button>
      </div>
      <div class="ctx-modal-head">
        <span class="ctx-modal-title">Cambiar nombre</span>
      </div>
      <div class="ctx-simple-form">
        <input class="ctx-form-input" id="ctxRenameInput" value="${_target.name}" autocomplete="off">
        <button class="ctx-btn-primary" id="ctxRenameBtn" style="align-self:flex-end">CAMBIAR NOMBRE</button>
      </div>
    </div>
  `);

  const input = overlay.querySelector('#ctxRenameInput');
  input.select();

  const doRename = () => {
    const newName = input.value.trim();
    if (!newName) return;
    const labelEl = _target.type === 'folder'
      ? _target.el.querySelector('.folder-name')
      : _target.el.querySelector('.asset-name');
    if (labelEl) labelEl.textContent = newName;
    _target.name = newName;
    _closeOverlay(overlay);
    showToast(`Nombre cambiado a "${newName}"`);
  };

  overlay.querySelector('#ctxRenameBtn').addEventListener('click', doRename);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doRename(); });
}

// ── Init ──────────────────────────────────────────────────────────
export function initContextMenu() {
  _initMenu();

  document.addEventListener('click', e => {
    if (!_menu.classList.contains('open')) return;
    if (!_menu.contains(e.target)) _close();
  });
  document.addEventListener('scroll', _close, true);

  document.addEventListener('contextmenu', e => {
    if (e.target.closest('#imgDetailOverlay')) return;

    const folderCard = e.target.closest('.folder-card');
    const assetCard  = e.target.closest('.asset-card[data-section]');

    if (!folderCard && !assetCard) return;

    e.preventDefault();
    _open(e, folderCard || assetCard, folderCard ? 'folder' : 'asset');
  });
}
