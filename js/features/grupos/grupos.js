// Feature: Gestión de Grupos — sección de grupos corporativos.
// Exports: initGrupos()
import { getGrupos, getGrupoById, createGrupo, updateGrupo, deleteGrupo, addMember, removeMember, subscribeGrupos } from './grupos-data.js';
import { getFaces } from '../../faces.js';
import { showToast } from '../../components/ui/toast.js';

const COLORS = ['var(--cat-1)','var(--cat-2)','var(--cat-3)','var(--cat-4)','var(--cat-5)','var(--cat-6)','var(--cat-7)','var(--cat-8)'];

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
}

// ── Render sección ───────────────────────────────────────────────────────────────
function _renderSection() {
  const sec = document.getElementById('sec-grupos');
  if (!sec) return;
  sec.innerHTML = `
    <div class="grupos-wrap">
      <div class="grupos-header">
        <div>
          <div class="grupos-summary" id="grupos-summary"></div>
        </div>
        <button class="btn btn-primary" id="btn-nuevo-grupo">
          <span class="msi sm">add</span> Nuevo grupo
        </button>
      </div>
      <div class="grupos-grid" id="grupos-grid"></div>
    </div>
    <div class="grupo-detail-overlay" id="grupo-detail-overlay">
      <div class="grupo-detail-panel" id="grupo-detail-panel"></div>
    </div>`;

  document.getElementById('btn-nuevo-grupo').addEventListener('click', _openNewGrupoModal);
  document.getElementById('grupo-detail-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('grupo-detail-overlay')) _closeDetail();
  });

  _renderGrid();
  subscribeGrupos(_renderGrid);
}

function _renderGrid() {
  const grupos = getGrupos();
  const faces  = getFaces();
  const byId   = Object.fromEntries(faces.map(f => [f.id, f]));

  const summary = document.getElementById('grupos-summary');
  if (summary) {
    const totalMembers = grupos.reduce((acc, g) => acc + g.memberIds.length, 0);
    summary.textContent = `${grupos.length} grupo${grupos.length !== 1 ? 's' : ''} · ${totalMembers} miembro${totalMembers !== 1 ? 's' : ''}`;
  }

  const grid = document.getElementById('grupos-grid');
  if (!grid) return;

  if (!grupos.length) {
    grid.innerHTML = `
      <div class="grupos-empty">
        <span class="msi">groups</span>
        <p>Aún no hay grupos.<br>Creá uno para organizar a tu equipo.</p>
      </div>`;
    return;
  }

  grid.innerHTML = grupos.map(g => {
    const members = g.memberIds.map(id => byId[id]).filter(Boolean);
    const shown = members.slice(0, 4);
    const extra = members.length - shown.length;
    const avs = shown.map(f => `<img class="grupo-av" src="${esc(f.selfieUrl)}" alt="${esc(f.displayName)}" title="${esc(f.displayName)}">`).join('');
    const moreChip = extra > 0 ? `<div class="grupo-av-more">+${extra}</div>` : '';

    return `
      <div class="grupo-card" data-gid="${g.id}" style="--grupo-color:${g.color}">
        <div class="grupo-card-head">
          <div class="grupo-card-name">${esc(g.name)}</div>
          <button class="icon-btn xs grupo-card-menu" data-menu-gid="${g.id}" title="Opciones">
            <span class="msi xs">more_vert</span>
          </button>
        </div>
        <div class="grupo-card-desc">${esc(g.description)}</div>
        <div class="grupo-avatars">${avs}${moreChip}</div>
        <div class="grupo-card-meta">
          <span><span class="msi xs">group</span>${members.length} miembro${members.length !== 1 ? 's' : ''}</span>
          <span><span class="msi xs">calendar_today</span>${g.createdAt}</span>
        </div>
      </div>`;
  }).join('');

  grid.querySelectorAll('.grupo-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.grupo-card-menu')) return;
      _openDetail(card.dataset.gid);
    });
  });

  grid.querySelectorAll('.grupo-card-menu').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      _openCardMenu(btn.dataset.menuGid, btn);
    });
  });
}

// ── Menú contextual de tarjeta ───────────────────────────────────────────────────
function _openCardMenu(gid, anchor) {
  const existing = document.getElementById('grupo-ctx-menu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.id = 'grupo-ctx-menu';
  menu.className = 'ctx-menu';
  menu.innerHTML = `
    <button class="ctx-item" data-action="edit"><span class="msi xs">edit</span> Editar</button>
    <button class="ctx-item ctx-item--danger" data-action="delete"><span class="msi xs">delete</span> Eliminar</button>`;

  document.body.appendChild(menu);
  const r = anchor.getBoundingClientRect();
  menu.style.position = 'fixed';
  menu.style.top  = r.bottom + 4 + 'px';
  menu.style.left = r.left - menu.offsetWidth + anchor.offsetWidth + 'px';
  menu.style.zIndex = '500';

  const close = () => menu.remove();
  document.addEventListener('click', close, { once: true });

  menu.querySelector('[data-action=edit]').addEventListener('click', () => { close(); _openEditModal(gid); });
  menu.querySelector('[data-action=delete]').addEventListener('click', () => { close(); _confirmDelete(gid); });
}

function _confirmDelete(gid) {
  const g = getGrupoById(gid);
  if (!g) return;
  if (!confirm(`¿Eliminar el grupo "${g.name}"? Esta acción no se puede deshacer.`)) return;
  deleteGrupo(gid);
  _closeDetail();
  showToast(`Grupo "${g.name}" eliminado`);
  _renderGrid();
}

// ── Panel de detalle ─────────────────────────────────────────────────────────────
let _currentGid = null;

function _openDetail(gid) {
  _currentGid = gid;
  _renderDetail();
  const overlay = document.getElementById('grupo-detail-overlay');
  if (overlay) overlay.classList.add('open');
}

function _closeDetail() {
  _currentGid = null;
  const overlay = document.getElementById('grupo-detail-overlay');
  if (overlay) overlay.classList.remove('open');
}

function _renderDetail() {
  const panel = document.getElementById('grupo-detail-panel');
  if (!panel || !_currentGid) return;

  const g = getGrupoById(_currentGid);
  if (!g) return;

  const faces = getFaces();
  const byId  = Object.fromEntries(faces.map(f => [f.id, f]));
  const members = g.memberIds.map(id => byId[id]).filter(Boolean);

  panel.innerHTML = `
    <div class="grupo-detail-top">
      <div class="grupo-detail-color-dot" style="background:${g.color}"></div>
      <div>
        <div class="grupo-detail-title">${esc(g.name)}</div>
        ${g.description ? `<div class="grupo-detail-desc-sub">${esc(g.description)}</div>` : ''}
      </div>
      <button class="icon-btn grupo-detail-close" id="btn-close-detail" title="Cerrar">
        <span class="msi sm">close</span>
      </button>
    </div>
    <div class="grupo-detail-actions">
      <span class="grupo-detail-count">${members.length} miembro${members.length !== 1 ? 's' : ''}</span>
      <button class="btn btn-sm" id="btn-add-member">
        <span class="msi xs">person_add</span> Agregar
      </button>
      <button class="icon-btn" id="btn-edit-grupo" title="Editar grupo">
        <span class="msi sm">edit</span>
      </button>
    </div>
    <div class="grupo-detail-body" id="grupo-detail-body">
      ${members.length
        ? members.map(f => `
          <div class="grupo-member-row" data-fid="${f.id}">
            <img class="grupo-member-av" src="${esc(f.selfieUrl)}" alt="">
            <div class="grupo-member-info">
              <div class="grupo-member-name">${esc(f.displayName)}</div>
              <div class="grupo-member-meta">Registrado ${f.registro}</div>
            </div>
            <button class="icon-btn xs grupo-member-remove" data-remove-fid="${f.id}" title="Quitar del grupo">
              <span class="msi xs">person_remove</span>
            </button>
          </div>`).join('')
        : `<div class="grupo-members-empty">
            <span class="msi">group_add</span>
            <p>Este grupo no tiene miembros aún.</p>
          </div>`
      }
    </div>`;

  panel.querySelector('#btn-close-detail').addEventListener('click', _closeDetail);

  panel.querySelector('#btn-edit-grupo').addEventListener('click', () => _openEditModal(_currentGid));

  panel.querySelector('#btn-add-member').addEventListener('click', () => _openMemberPicker(_currentGid));

  panel.querySelectorAll('.grupo-member-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      removeMember(_currentGid, btn.dataset.removeFid);
      _renderDetail();
      _renderGrid();
    });
  });
}

// ── Modal nuevo / editar grupo ───────────────────────────────────────────────────
function _openNewGrupoModal() {
  _openGrupoModal(null);
}

function _openEditModal(gid) {
  _openGrupoModal(gid);
}

function _openGrupoModal(gid) {
  const editing = gid ? getGrupoById(gid) : null;
  const title   = editing ? 'Editar grupo' : 'Nuevo grupo';

  let selectedColor = editing?.color || COLORS[0];

  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.style.cssText = 'position:fixed;inset:0;z-index:600;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5);backdrop-filter:blur(4px)';

  modal.innerHTML = `
    <div class="modal-box" style="width:min(440px,92vw);background:var(--surface-0);border-radius:var(--radius-lg);padding:var(--space-6);border:1px solid var(--border)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4)">
        <strong style="font-size:var(--text-lg)">${title}</strong>
        <button class="icon-btn" id="gm-close"><span class="msi sm">close</span></button>
      </div>
      <div class="grupo-new-form">
        <div>
          <label>Nombre *</label>
          <input id="gm-name" type="text" placeholder="Ej: Equipo Comercial" value="${esc(editing?.name || '')}">
        </div>
        <div>
          <label>Descripción</label>
          <textarea id="gm-desc" placeholder="Descripción del grupo">${esc(editing?.description || '')}</textarea>
        </div>
        <div>
          <label>Color</label>
          <div class="grupo-color-row" id="gm-colors">
            ${COLORS.map(c => `<div class="grupo-color-swatch${c === selectedColor ? ' selected' : ''}" data-color="${c}" style="background:${c}" title="${c}"></div>`).join('')}
          </div>
        </div>
        <div style="display:flex;gap:var(--space-2);justify-content:flex-end;margin-top:var(--space-2)">
          <button class="btn btn-ghost" id="gm-cancel">Cancelar</button>
          <button class="btn btn-primary" id="gm-save">${editing ? 'Guardar' : 'Crear'}</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(modal);

  modal.querySelectorAll('.grupo-color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      modal.querySelectorAll('.grupo-color-swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      selectedColor = sw.dataset.color;
    });
  });

  const close = () => modal.remove();
  modal.querySelector('#gm-close').addEventListener('click', close);
  modal.querySelector('#gm-cancel').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  modal.querySelector('#gm-save').addEventListener('click', () => {
    const name = modal.querySelector('#gm-name').value.trim();
    if (!name) { modal.querySelector('#gm-name').focus(); return; }
    const description = modal.querySelector('#gm-desc').value;
    if (editing) {
      updateGrupo(gid, { name, description, color: selectedColor });
      showToast('Grupo actualizado');
      _renderDetail();
    } else {
      createGrupo({ name, description, color: selectedColor });
      showToast(`Grupo "${name}" creado`);
    }
    _renderGrid();
    close();
  });
}

// ── Picker de miembros ───────────────────────────────────────────────────────────
function _openMemberPicker(gid) {
  const g     = getGrupoById(gid);
  if (!g) return;
  const faces = getFaces().filter(f => !f.unnamed);

  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.style.cssText = 'position:fixed;inset:0;z-index:700;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5);backdrop-filter:blur(4px)';

  const rows = faces.map(f => {
    const checked  = g.memberIds.includes(f.id);
    return `
      <label class="grupo-picker-row">
        <input type="checkbox" data-pid="${f.id}" ${checked ? 'checked' : ''}>
        <img class="grupo-picker-av" src="${esc(f.selfieUrl)}" alt="">
        <span class="grupo-picker-name">${esc(f.displayName)}</span>
      </label>`;
  }).join('');

  modal.innerHTML = `
    <div class="modal-box" style="width:min(400px,92vw);background:var(--surface-0);border-radius:var(--radius-lg);padding:var(--space-5);border:1px solid var(--border)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3)">
        <strong style="font-size:var(--text-base)">Agregar miembros</strong>
        <button class="icon-btn" id="mp-close"><span class="msi sm">close</span></button>
      </div>
      <input class="grupo-picker-search" id="mp-search" type="text" placeholder="Buscar…">
      <div class="grupo-picker-list" id="mp-list">${rows}</div>
      <div style="display:flex;justify-content:flex-end;gap:var(--space-2);margin-top:var(--space-3)">
        <button class="btn btn-ghost" id="mp-cancel">Cancelar</button>
        <button class="btn btn-primary" id="mp-apply">Aplicar</button>
      </div>
    </div>`;

  document.body.appendChild(modal);

  const list   = modal.querySelector('#mp-list');
  const search = modal.querySelector('#mp-search');
  search.addEventListener('input', () => {
    const q = search.value.toLowerCase();
    list.querySelectorAll('.grupo-picker-row').forEach(row => {
      const name = row.querySelector('.grupo-picker-name').textContent.toLowerCase();
      row.style.display = name.includes(q) ? '' : 'none';
    });
  });

  const close = () => modal.remove();
  modal.querySelector('#mp-close').addEventListener('click', close);
  modal.querySelector('#mp-cancel').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  modal.querySelector('#mp-apply').addEventListener('click', () => {
    const checked = [...modal.querySelectorAll('input[data-pid]:checked')].map(i => i.dataset.pid);
    const all     = [...modal.querySelectorAll('input[data-pid]')].map(i => i.dataset.pid);

    checked.forEach(fid => { if (!g.memberIds.includes(fid)) addMember(gid, fid); });
    all.filter(fid => !checked.includes(fid)).forEach(fid => removeMember(gid, fid));

    _renderDetail();
    _renderGrid();
    showToast('Miembros actualizados');
    close();
  });
}

// ── Init ─────────────────────────────────────────────────────────────────────────
export function initGrupos() {
  _renderSection();
}
