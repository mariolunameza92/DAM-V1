// Exports: initContextMenu()
import { showToast } from '../../components/ui/toast.js';

const DEMO_PERSONAS = [
  { name: 'Mario Luna',     email: 'mario@lendam.io',    color: '#4a6cf7', role: 'Editor' },
  { name: 'Ana Gómez',      email: 'ana@lendam.io',      color: '#e06b3f', role: 'Viewer' },
  { name: 'Carlos Rivas',   email: 'carlos@lendam.io',   color: '#3fa66b', role: 'Editor' },
  { name: 'Lucía Herrera',  email: 'lucia@lendam.io',    color: '#9b4fe0', role: 'Viewer' },
];

const DEMO_GRUPOS = [
  {
    name: 'Equipo Creativo',
    members: [
      { name: 'Mario Luna',    email: 'mario@lendam.io',   color: '#4a6cf7', role: 'Editor' },
      { name: 'Ana Gómez',     email: 'ana@lendam.io',     color: '#e06b3f', role: 'Editor' },
    ],
  },
  {
    name: 'Clientes',
    members: [
      { name: 'Carlos Rivas',  email: 'carlos@lendam.io',  color: '#3fa66b', role: 'Viewer' },
      { name: 'Lucía Herrera', email: 'lucia@lendam.io',   color: '#9b4fe0', role: 'Viewer' },
    ],
  },
];

const CREAR_GRUPO_PERSONAS = [
  { name: 'Mario Luna',    email: 'mario@lendam.io',   color: '#4a6cf7' },
  { name: 'Ana Gómez',     email: 'ana@lendam.io',     color: '#e06b3f' },
  { name: 'Carlos Rivas',  email: 'carlos@lendam.io',  color: '#3fa66b' },
];

// ── Menu singleton ────────────────────────────────────────────────
let _menu = null;
let _target = null; // { type: 'folder'|'asset', el, name }

function _initMenu() {
  _menu = document.createElement('div');
  _menu.className = 'ctx-menu';
  _menu.innerHTML = `
    <button class="ctx-item" data-action="share">
      <span class="msi xs" style="margin-right:8px">group</span>Compartir
    </button>
    <button class="ctx-item" data-action="download">
      <span class="msi xs" style="margin-right:8px">download</span>Descargar
    </button>
    <button class="ctx-item" data-action="duplicate">
      <span class="msi xs" style="margin-right:8px">content_copy</span>Duplicar
    </button>
    <div class="ctx-divider"></div>
    <button class="ctx-item" data-action="move">
      <span class="msi xs" style="margin-right:8px">drive_file_move</span>Mover a
    </button>
    <button class="ctx-item" data-action="rename">
      <span class="msi xs" style="margin-right:8px">edit</span>Cambiar nombre
    </button>
    <div class="ctx-divider"></div>
    <button class="ctx-item ctx-item--danger" data-action="delete">
      <span class="msi xs" style="margin-right:8px">delete</span>Eliminar
    </button>
  `;
  document.body.appendChild(_menu);

  _menu.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    _close();
    const action = btn.dataset.action;
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

  // Remove active state from any previously highlighted card
  document.querySelectorAll('.ctx-active').forEach(el => el.classList.remove('ctx-active'));
  targetEl.classList.add('ctx-active');

  _target = { type, el: targetEl, name };

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const mw = 200, mh = 230;
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

// ── Direct actions ────────────────────────────────────────────────
function _doDownload() {
  showToast(`Descargando "${_target.name}"…`);
}

function _doDuplicate() {
  if (!_target?.el) return;
  const clone = _target.el.cloneNode(true);
  clone.style.opacity = '0';
  clone.style.transform = 'scale(0.94)';
  clone.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
  _target.el.parentNode.insertBefore(clone, _target.el.nextSibling);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    clone.style.opacity = '1';
    clone.style.transform = 'scale(1)';
  }));
  showToast(`"${_target.name}" duplicado`);
}

function _doDelete() {
  if (!_target?.el) return;
  const el = _target.el;
  el.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
  el.style.opacity = '0';
  el.style.transform = 'scale(0.92)';
  setTimeout(() => el.remove(), 220);
  showToast(`"${_target.name}" eliminado`);
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

// ── Compartir modal ───────────────────────────────────────────────
function _personasTab() {
  return `
    <div class="ctx-email-row" style="margin-bottom:12px">
      <input class="ctx-search" placeholder="Buscar o agregar personas…" style="margin-bottom:0">
      <button class="ctx-btn-sm ctx-btn-sm--primary">AGREGAR</button>
    </div>
    ${DEMO_PERSONAS.map(p => `
      <div class="ctx-person-row">
        <div class="ctx-avatar-initials" style="background:${p.color}">${p.name.split(' ').map(w=>w[0]).join('')}</div>
        <div class="ctx-person-info">
          <div class="ctx-person-name">${p.name}</div>
          <div class="ctx-person-email">${p.email}</div>
        </div>
        <select class="ctx-role-select">
          <option ${p.role==='Editor'?'selected':''}>Editor</option>
          <option ${p.role==='Viewer'?'selected':''}>Viewer</option>
          <option>Admin</option>
        </select>
      </div>
    `).join('')}
  `;
}

function _gruposTab(overlay) {
  return `
    ${DEMO_GRUPOS.map((g, gi) => `
      <div class="ctx-group" data-gi="${gi}">
        <div class="ctx-group-header">
          <span class="ctx-group-name">${g.name}</span>
          <span class="msi xs ctx-group-chevron">keyboard_arrow_up</span>
        </div>
        <div class="ctx-group-body">
          ${g.members.map(m => `
            <div class="ctx-person-row">
              <div class="ctx-avatar-initials" style="background:${m.color}">${m.name.split(' ').map(w=>w[0]).join('')}</div>
              <div class="ctx-person-info">
                <div class="ctx-person-name">${m.name}</div>
                <div class="ctx-person-email">${m.email}</div>
              </div>
              <select class="ctx-role-select">
                <option ${m.role==='Editor'?'selected':''}>Editor</option>
                <option ${m.role==='Viewer'?'selected':''}>Viewer</option>
              </select>
            </div>
          `).join('')}
          <button class="ctx-add-link" data-action="crear-grupo">
            <span class="msi xs">add</span> AGREGAR PERSONAS AL GRUPO
          </button>
        </div>
      </div>
    `).join('')}
  `;
}

function _openShareModal() {
  const overlay = _createOverlay(`
    <div class="ctx-modal">
      <div class="ctx-modal-header">
        <span class="ctx-modal-title">Compartir</span>
        <button class="ctx-modal-close"><span class="msi xs">close</span></button>
      </div>
      <div class="ctx-tabs">
        <button class="ctx-tab-btn active" data-tab="personas">
          <span class="msi xs">person</span> Personas
        </button>
        <button class="ctx-tab-btn" data-tab="grupos">
          <span class="msi xs">group</span> Grupos
        </button>
      </div>
      <div class="ctx-tab-body">
        <div class="ctx-tab-panel active" data-panel="personas">${_personasTab()}</div>
        <div class="ctx-tab-panel" data-panel="grupos"></div>
      </div>
      <div style="padding:0 20px 20px;display:flex;justify-content:flex-end">
        <button class="ctx-btn-primary" data-action="save-share">GUARDAR</button>
      </div>
    </div>
  `);

  // Render grupos tab content
  overlay.querySelector('[data-panel="grupos"]').innerHTML = _gruposTab(overlay);

  // Tab switching
  overlay.querySelectorAll('.ctx-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.ctx-tab-btn').forEach(b => b.classList.remove('active'));
      overlay.querySelectorAll('.ctx-tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      overlay.querySelector(`[data-panel="${btn.dataset.tab}"]`).classList.add('active');
    });
  });

  // Group accordion toggle
  overlay.addEventListener('click', e => {
    const header = e.target.closest('.ctx-group-header');
    if (header) { header.closest('.ctx-group').classList.toggle('collapsed'); return; }

    const addLink = e.target.closest('[data-action="crear-grupo"]');
    if (addLink) { _openCrearGrupoModal(); return; }

    if (e.target.closest('[data-action="save-share"]')) {
      _closeOverlay(overlay);
      showToast('Cambios guardados');
    }
  });
}

// ── Crear grupo modal ─────────────────────────────────────────────
function _openCrearGrupoModal() {
  const overlay = _createOverlay(`
    <div class="ctx-modal">
      <div class="ctx-modal-header">
        <span class="ctx-modal-title">Crear grupo</span>
        <button class="ctx-modal-close"><span class="msi xs">close</span></button>
      </div>
      <div class="ctx-form-body">
        <input class="ctx-form-input" id="ctxGrupoName" placeholder="Nombre del grupo" autocomplete="off">
        <div class="ctx-email-row">
          <input class="ctx-search" id="ctxGrupoEmail" placeholder="Correo electrónico" style="margin-bottom:0" autocomplete="off">
          <button class="ctx-btn-sm ctx-btn-sm--secondary" id="ctxGrupoAddBtn">AGREGAR</button>
        </div>
        <div id="ctxGrupoList">
          ${CREAR_GRUPO_PERSONAS.map(p => `
            <div class="ctx-person-row">
              <div class="ctx-avatar-initials" style="background:${p.color}">${p.name.split(' ').map(w=>w[0]).join('')}</div>
              <div class="ctx-person-info">
                <div class="ctx-person-name">${p.name}</div>
                <div class="ctx-person-email">${p.email}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="ctx-secondary-actions">
          <button class="ctx-btn-sm ctx-btn-sm--secondary">
            <span class="msi xs" style="margin-right:4px">download</span>DESCARGAR PLANTILLA
          </button>
          <button class="ctx-btn-sm ctx-btn-sm--secondary">
            <span class="msi xs" style="margin-right:4px">upload_file</span>IMPORTAR CSV
          </button>
        </div>
        <button class="ctx-btn-primary" id="ctxCrearGrupoBtn" style="align-self:flex-end">CREAR GRUPO</button>
      </div>
    </div>
  `);

  // Add person on click
  overlay.querySelector('#ctxGrupoAddBtn').addEventListener('click', () => {
    const input = overlay.querySelector('#ctxGrupoEmail');
    const email = input.value.trim();
    if (!email) return;
    const colors = ['#4a6cf7','#e06b3f','#3fa66b','#9b4fe0','#c0a030'];
    const color  = colors[Math.floor(Math.random() * colors.length)];
    const name   = email.split('@')[0];
    const row = document.createElement('div');
    row.className = 'ctx-person-row';
    row.innerHTML = `
      <div class="ctx-avatar-initials" style="background:${color}">${name[0].toUpperCase()}</div>
      <div class="ctx-person-info">
        <div class="ctx-person-name">${name}</div>
        <div class="ctx-person-email">${email}</div>
      </div>
    `;
    overlay.querySelector('#ctxGrupoList').appendChild(row);
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
      <div class="ctx-modal-header">
        <span class="ctx-modal-title">Mover a</span>
        <button class="ctx-modal-close"><span class="msi xs">close</span></button>
      </div>
      <div class="ctx-form-body">
        <input class="ctx-form-input" id="ctxMoveInput" placeholder="Nombre de la carpeta destino" autocomplete="off">
        <button class="ctx-btn-primary" id="ctxMoveBtn" style="align-self:flex-end">MOVER</button>
      </div>
    </div>
  `);

  overlay.querySelector('#ctxMoveBtn').addEventListener('click', () => {
    const dest = overlay.querySelector('#ctxMoveInput').value.trim();
    _closeOverlay(overlay);
    showToast(dest ? `"${_target.name}" movido a "${dest}"` : `"${_target.name}" movido`);
  });
}

// ── Cambiar nombre modal ──────────────────────────────────────────
function _openRenameModal() {
  const overlay = _createOverlay(`
    <div class="ctx-modal">
      <div class="ctx-modal-header">
        <span class="ctx-modal-title">Cambiar nombre</span>
        <button class="ctx-modal-close"><span class="msi xs">close</span></button>
      </div>
      <div class="ctx-form-body">
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
    // Update DOM label
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

  // Dismiss on outside click / scroll
  document.addEventListener('click', e => {
    if (!_menu.classList.contains('open')) return;
    if (!_menu.contains(e.target)) _close();
  });
  document.addEventListener('scroll', _close, true);

  document.addEventListener('contextmenu', e => {
    // Don't intercept inside the image detail overlay
    if (e.target.closest('#imgDetailOverlay')) return;

    const folderCard = e.target.closest('.folder-card');
    const assetCard  = e.target.closest('.asset-card[data-section]');

    if (!folderCard && !assetCard) return;

    e.preventDefault();
    _open(e, folderCard || assetCard, folderCard ? 'folder' : 'asset');
  });
}
