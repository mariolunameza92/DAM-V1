// Feature: Gestión de Grupos
// Exports: initGrupos()
import { getGrupos, getGrupoById, createGrupo, updateGrupo, deleteGrupo, addMember, removeMember, subscribeGrupos, resetGruposForType, getGrupoForFace } from './grupos-data.js';
import { getFaces } from '../../faces.js';
import { showToast } from '../../components/atoms/toast.js';
import { getDamType, subscribeConfig } from '../configuracion/configuracion-data.js';

function _terms() {
  if (getDamType() === 'schools') return {
    unit: 'sección', units: 'secciones', member: 'alumno', members: 'alumnos',
    newBtn: 'Nuevo grupo', addBtn: 'Agregar alumnos',
    placeholder: 'Ej: 5to Año B',
    emptyMsg: 'Aún no hay grupos.<br>Creá uno para organizar a tus alumnos.',
  };
  return {
    unit: 'grupo', units: 'grupos', member: 'miembro', members: 'miembros',
    newBtn: 'Nuevo grupo', addBtn: 'Agregar miembros',
    placeholder: 'Ej: Equipo Comercial',
    emptyMsg: 'Aún no hay grupos.<br>Creá uno para organizar a tu equipo.',
  };
}

// Colores de identidad categórica — tokens user-color que funcionan en light y dark
const COLORS = [
  'var(--user-color-1)',
  'var(--user-color-2)',
  'var(--user-color-3)',
  'var(--user-color-4)',
  'var(--user-color-5)',
  'var(--user-color-6)',
];

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
}

// ── Render sección ───────────────────────────────────────────────────────────────
function _renderSection() {
  const sec = document.getElementById('sec-grupos');
  if (!sec) return;
  const t0 = _terms();
  sec.innerHTML = `
    <div class="grupos-wrap">
      <div class="grupos-header">
        <div class="grupos-summary" id="grupos-summary"></div>
        <button class="btn btn-primary" id="btn-nuevo-grupo">
          <span class="msi sm">add</span> ${esc(t0.newBtn)}
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

  // ESC global cierra el panel de detalle
  document.addEventListener('keydown', _handleGlobalKey);

  _renderGrid();
  subscribeGrupos(_renderGrid);
  subscribeConfig(() => resetGruposForType(getDamType()));
}

function _handleGlobalKey(e) {
  if (e.key !== 'Escape') return;
  const overlay = document.getElementById('grupo-detail-overlay');
  if (overlay?.classList.contains('open')) _closeDetail();
}

function _renderGrid() {
  const t      = _terms();
  const grupos = getGrupos();
  const faces  = getFaces();
  const byId   = Object.fromEntries(faces.map(f => [f.id, f]));

  const btn = document.getElementById('btn-nuevo-grupo');
  if (btn) btn.innerHTML = `<span class="msi sm">add</span> ${esc(t.newBtn)}`;

  const summary = document.getElementById('grupos-summary');
  if (summary) {
    const totalMembers = grupos.reduce((acc, g) => acc + g.memberIds.length, 0);
    summary.textContent = `${grupos.length} ${grupos.length !== 1 ? t.units : t.unit} · ${totalMembers} ${totalMembers !== 1 ? t.members : t.member}`;
  }

  const grid = document.getElementById('grupos-grid');
  if (!grid) return;

  if (!grupos.length) {
    grid.innerHTML = `
      <div class="grupos-empty">
        <span class="msi">groups</span>
        <p>${t.emptyMsg}</p>
      </div>`;
    return;
  }

  grid.innerHTML = grupos.map(g => {
    const members = g.memberIds.map(id => byId[id]).filter(Boolean);
    const shown   = members.slice(0, 4);
    const extra   = members.length - shown.length;
    const avs     = shown.map(f => `<img class="grupo-av" src="${esc(f.selfieUrl)}" alt="${esc(f.displayName)}" title="${esc(f.displayName)}">`).join('');
    const more    = extra > 0 ? `<div class="grupo-av-more">+${extra}</div>` : '';

    return `
      <div class="grupo-card" data-gid="${g.id}" style="--grupo-color:${g.color}">
        <div class="grupo-card-head">
          <div class="grupo-card-name">${esc(g.name)}</div>
          <button class="icon-btn xs grupo-card-menu" data-menu-gid="${g.id}" title="Opciones" aria-label="Opciones de ${esc(g.name)}">
            <span class="msi xs">more_vert</span>
          </button>
        </div>
        <div class="grupo-card-desc">${esc(g.description)}</div>
        <div class="grupo-avatars">${avs}${more}</div>
        <div class="grupo-card-meta">
          <span><span class="msi xs">group</span>${members.length} ${members.length !== 1 ? t.members : t.member}</span>
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
  // Cierra cualquier ctx-menu abierto (incluyendo los de otras secciones)
  document.querySelectorAll('.ctx-menu').forEach(m => m.remove());

  const menu = document.createElement('div');
  menu.id = 'grupo-ctx-menu';
  menu.className = 'ctx-menu';
  menu.innerHTML = `
    <button class="ctx-item" data-action="edit"><span class="msi xs">edit</span> Editar</button>
    <button class="ctx-item ctx-item--danger" data-action="delete"><span class="msi xs">delete</span> Eliminar</button>`;

  document.body.appendChild(menu);
  const r = anchor.getBoundingClientRect();
  menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${r.right - menu.offsetWidth}px;z-index:500`;
  requestAnimationFrame(() => menu.classList.add('open'));

  // Defer para que el click que abrió el menú no lo cierre de inmediato
  const close = () => { menu.classList.remove('open'); setTimeout(() => menu.remove(), 140); };
  setTimeout(() => document.addEventListener('click', close, { once: true }), 0);

  menu.querySelector('[data-action=edit]').addEventListener('click', () => { close(); _openEditModal(gid); });
  menu.querySelector('[data-action=delete]').addEventListener('click', () => { close(); _openDeleteModal(gid); });
}

// ── Modal de confirmación de eliminación ─────────────────────────────────────────
function _openDeleteModal(gid) {
  const g = getGrupoById(gid);
  if (!g) return;

  const modal = _createBackdrop(550);
  modal.innerHTML = `
    <div class="gm-box gm-box--sm">
      <div class="gm-header">
        <strong class="gm-title">Eliminar grupo</strong>
      </div>
      <p class="gm-body-text">
        ¿Eliminar <strong>${esc(g.name)}</strong>?
        Los miembros quedarán sin grupo asignado. Esta acción no se puede deshacer.
      </p>
      <div class="gm-footer">
        <button class="btn btn-ghost" id="del-cancel">Cancelar</button>
        <button class="btn btn-primary" id="del-confirm">Eliminar</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  // Focus en el botón destructivo para que ESC funcione inmediatamente
  requestAnimationFrame(() => modal.querySelector('#del-cancel').focus());

  const close = () => modal.remove();
  modal.querySelector('#del-cancel').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  modal.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  modal.querySelector('#del-confirm').addEventListener('click', () => {
    deleteGrupo(gid);
    _closeDetail();
    showToast(`Grupo "${g.name}" eliminado`);
    close();
  });
}

// ── Panel de detalle ─────────────────────────────────────────────────────────────
let _currentGid = null;

function _openDetail(gid) {
  _currentGid = gid;
  _renderDetail();
  document.getElementById('grupo-detail-overlay')?.classList.add('open');
}

function _closeDetail() {
  _currentGid = null;
  document.getElementById('grupo-detail-overlay')?.classList.remove('open');
}

function _renderDetail() {
  const panel = document.getElementById('grupo-detail-panel');
  if (!panel || !_currentGid) return;

  const g = getGrupoById(_currentGid);
  if (!g) return;

  const t       = _terms();
  const byId    = Object.fromEntries(getFaces().map(f => [f.id, f]));
  const members = g.memberIds.map(id => byId[id]).filter(Boolean);

  panel.innerHTML = `
    <div class="grupo-detail-top">
      <div class="grupo-detail-color-dot" style="background:${g.color}"></div>
      <div class="grupo-detail-title-block">
        <div class="grupo-detail-title">${esc(g.name)}</div>
        ${g.description ? `<div class="grupo-detail-desc-sub">${esc(g.description)}</div>` : ''}
      </div>
      <button class="icon-btn grupo-detail-close" id="btn-close-detail" title="Cerrar" aria-label="Cerrar panel">
        <span class="msi sm">close</span>
      </button>
    </div>
    <div class="grupo-detail-actions">
      <span class="grupo-detail-count">${members.length} ${members.length !== 1 ? t.members : t.member}</span>
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
            <button class="icon-btn xs grupo-member-remove" data-remove-fid="${f.id}" title="Quitar del grupo" aria-label="Quitar a ${esc(f.displayName)}">
              <span class="msi xs">person_remove</span>
            </button>
          </div>`).join('')
        : `<div class="grupo-members-empty">
            <span class="msi">group_add</span>
            <p>Este grupo no tiene ${t.members} aún.</p>
            <button class="btn btn-sm" id="btn-add-member-empty">
              <span class="msi xs">person_add</span> Agregar ${t.members}
            </button>
          </div>`
      }
    </div>`;

  panel.querySelector('#btn-close-detail').addEventListener('click', _closeDetail);
  panel.querySelector('#btn-edit-grupo').addEventListener('click', () => _openEditModal(_currentGid));
  panel.querySelector('#btn-add-member').addEventListener('click', () => _openMemberPicker(_currentGid));
  panel.querySelector('#btn-add-member-empty')?.addEventListener('click', () => _openMemberPicker(_currentGid));

  panel.querySelectorAll('.grupo-member-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const face = getFaces().find(f => f.id === btn.dataset.removeFid);
      removeMember(_currentGid, btn.dataset.removeFid);
      if (face) showToast(`${face.displayName} quitado del grupo`);
      _renderDetail();
      _renderGrid();
    });
  });
}

// ── Modal nuevo / editar grupo ───────────────────────────────────────────────────
function _openNewGrupoModal() { _openGrupoModal(null); }
function _openEditModal(gid)  { _openGrupoModal(gid); }

function _openGrupoModal(gid) {
  const t       = _terms();
  const editing = gid ? getGrupoById(gid) : null;
  const title   = editing ? `Editar ${t.unit}` : t.newBtn;
  let selectedColor = editing?.color || COLORS[0];

  const modal = _createBackdrop(600);
  modal.innerHTML = `
    <div class="gm-box gm-box--md">
      <div class="gm-header">
        <strong class="gm-title">${title}</strong>
        <button class="icon-btn" id="gm-close" aria-label="Cerrar"><span class="msi sm">close</span></button>
      </div>
      <div class="grupo-new-form">
        <div class="gm-field">
          <label class="gm-label" for="gm-name">Nombre <span class="gm-required">*</span></label>
          <input id="gm-name" class="gm-input" type="text" placeholder="${esc(t.placeholder)}" value="${esc(editing?.name || '')}" autocomplete="off">
          <span class="gm-field-error" id="gm-name-error" hidden>El nombre es obligatorio</span>
        </div>
        <div class="gm-field">
          <label class="gm-label" for="gm-desc">Descripción</label>
          <textarea id="gm-desc" class="gm-input gm-textarea" placeholder="Descripción del grupo">${esc(editing?.description || '')}</textarea>
        </div>
        <div class="gm-field">
          <label class="gm-label">Color de identificación</label>
          <div class="grupo-color-row" id="gm-colors" role="radiogroup" aria-label="Color del grupo">
            ${COLORS.map(c => `<div class="grupo-color-swatch${c === selectedColor ? ' selected' : ''}" data-color="${c}" style="background:${c}" role="radio" aria-checked="${c === selectedColor}" tabindex="0"></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="gm-footer">
        <button class="btn btn-ghost" id="gm-cancel">Cancelar</button>
        <button class="btn btn-primary" id="gm-save">${editing ? 'Guardar cambios' : 'Crear grupo'}</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.querySelector('#gm-name').focus());

  modal.querySelectorAll('.grupo-color-swatch').forEach(sw => {
    const select = () => {
      modal.querySelectorAll('.grupo-color-swatch').forEach(s => {
        s.classList.remove('selected');
        s.setAttribute('aria-checked', 'false');
      });
      sw.classList.add('selected');
      sw.setAttribute('aria-checked', 'true');
      selectedColor = sw.dataset.color;
    };
    sw.addEventListener('click', select);
    sw.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); select(); }
    });
  });

  const close = () => modal.remove();
  modal.querySelector('#gm-close').addEventListener('click', close);
  modal.querySelector('#gm-cancel').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  modal.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  const save = () => {
    const nameEl  = modal.querySelector('#gm-name');
    const errorEl = modal.querySelector('#gm-name-error');
    const name    = nameEl.value.trim();
    if (!name) {
      nameEl.classList.add('gm-input--error');
      errorEl.removeAttribute('hidden');
      nameEl.focus();
      nameEl.animate(
        [{ transform:'translateX(0)' },{ transform:'translateX(-5px)' },{ transform:'translateX(5px)' },{ transform:'translateX(-3px)' },{ transform:'translateX(3px)' },{ transform:'translateX(0)' }],
        { duration: 280, easing: 'ease-out' }
      );
      return;
    }
    nameEl.classList.remove('gm-input--error');
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
  };

  modal.querySelector('#gm-save').addEventListener('click', save);
  modal.querySelector('#gm-name').addEventListener('keydown', e => { if (e.key === 'Enter') save(); });
}

// ── Picker de miembros ───────────────────────────────────────────────────────────
function _openMemberPicker(gid) {
  const g     = getGrupoById(gid);
  if (!g) return;
  const t     = _terms();
  const faces = getFaces().filter(f => !f.unnamed);

  const modal = _createBackdrop(700);

  const rows = faces.map(f => {
    const checked   = g.memberIds.includes(f.id);
    const otherG    = getGrupoForFace(f.id);
    const inOther   = otherG && otherG.id !== gid;
    const badge     = inOther
      ? `<span class="grupo-picker-badge" title="Se moverá desde ${esc(otherG.name)}">en ${esc(otherG.name)}</span>`
      : '';
    return `
      <label class="grupo-picker-row${inOther && !checked ? ' grupo-picker-row--other' : ''}">
        <input type="checkbox" data-pid="${f.id}" ${checked ? 'checked' : ''}>
        <img class="grupo-picker-av" src="${esc(f.selfieUrl)}" alt="">
        <span class="grupo-picker-name">${esc(f.displayName)}</span>
        ${badge}
      </label>`;
  }).join('');

  modal.innerHTML = `
    <div class="gm-box gm-box--md">
      <div class="gm-header">
        <strong class="gm-title">${esc(t.addBtn)}</strong>
        <button class="icon-btn" id="mp-close" aria-label="Cerrar"><span class="msi sm">close</span></button>
      </div>
      <input class="grupo-picker-search" id="mp-search" type="text" placeholder="Buscar por nombre…" autocomplete="off">
      ${faces.length
        ? `<div class="grupo-picker-list" id="mp-list">${rows}</div>`
        : `<div class="grupo-picker-empty">
            <span class="msi">person_off</span>
            <p>No hay personas registradas aún.</p>
          </div>`
      }
      <div class="gm-footer">
        <button class="btn btn-ghost" id="mp-cancel">Cancelar</button>
        <button class="btn btn-primary" id="mp-apply">Aplicar</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.querySelector('#mp-search').focus());

  const list = modal.querySelector('#mp-list');
  if (list) {
    modal.querySelector('#mp-search').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      list.querySelectorAll('.grupo-picker-row').forEach(row => {
        const name = row.querySelector('.grupo-picker-name').textContent.toLowerCase();
        row.style.display = name.includes(q) ? '' : 'none';
      });
    });
  }

  const close = () => modal.remove();
  modal.querySelector('#mp-close').addEventListener('click', close);
  modal.querySelector('#mp-cancel').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  modal.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

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

// ── Helper: crea el backdrop del modal ──────────────────────────────────────────
function _createBackdrop(zIndex = 600) {
  const el = document.createElement('div');
  el.className = 'gm-backdrop';
  el.style.zIndex = zIndex;
  return el;
}

// ── Init ─────────────────────────────────────────────────────────────────────────
export function initGrupos() {
  _renderSection();
}
