// Feature: Configuración — 3 tabs: Módulos, Pricing, Equipo.
// Exports: initConfiguracion()
import {
  MODULE_DEFS, PRICING_PLANS, DAM_TYPES,
  getEnabledModules, isModuleEnabled, setModuleEnabled, subscribeConfig,
  getDamType, setDamType,
  getTeam, inviteMember, updateMemberRole, removeMember, ROLES, subscribeTeam,
} from './configuracion-data.js';
import { showToast } from '../../components/ui/toast.js';

const PLAN_CURRENT = 'professional'; // demo: plan actual

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
}

let _activeTab = 'modulos';

// ── Render sección ───────────────────────────────────────────────────────────────
function _renderSection() {
  const sec = document.getElementById('sec-configuracion');
  if (!sec) return;
  sec.innerHTML = `
    <div class="config-wrap">
      <div class="dam-type-selector-wrap">
        <div class="config-section-title">Tipo de DAM</div>
        <p class="config-section-desc">Cambia la vista para simular cómo se ve la plataforma según el tipo de cliente.</p>
        <div class="dam-type-selector" id="dam-type-selector"></div>
      </div>
      <div class="config-tabs">
        <button class="config-tab active" data-tab="modulos">Módulos</button>
        <button class="config-tab" data-tab="pricing">Pricing demo</button>
        <button class="config-tab" data-tab="equipo">Equipo y roles</button>
      </div>
      <div class="config-pane active" id="config-pane-modulos"></div>
      <div class="config-pane" id="config-pane-pricing"></div>
      <div class="config-pane" id="config-pane-equipo"></div>
    </div>`;

  sec.querySelectorAll('.config-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      _activeTab = tab.dataset.tab;
      sec.querySelectorAll('.config-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === _activeTab));
      sec.querySelectorAll('.config-pane').forEach(p => p.classList.toggle('active', p.id === `config-pane-${_activeTab}`));
    });
  });

  _renderDamTypeSelector();
  _renderModulos();
  _renderPricing();
  _renderEquipo();

  subscribeConfig(() => _renderModulos());
  subscribeTeam(() => _renderEquipo());
}

// ── Selector de tipo de DAM ───────────────────────────────────────────────────────
function _renderDamTypeSelector() {
  const container = document.getElementById('dam-type-selector');
  if (!container) return;
  const current = getDamType();
  container.innerHTML = DAM_TYPES.map(t => `
    <button class="dam-type-card ${t.id === current ? 'dam-type-card--active' : ''}" data-type="${t.id}">
      <div class="dam-type-card-inner">
        <span class="msi dam-type-icon">${esc(t.icon)}</span>
        <div>
          <div class="dam-type-label">${esc(t.label)}</div>
          <div class="dam-type-desc">${esc(t.desc)}</div>
        </div>
      </div>
      ${t.id === current ? '<span class="dam-type-badge">Activo</span>' : ''}
    </button>`).join('');

  container.querySelectorAll('[data-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.type === getDamType()) return;
      setDamType(btn.dataset.type);
      _renderDamTypeSelector();
      const label = DAM_TYPES.find(t => t.id === btn.dataset.type)?.label;
      showToast(`Vista cambiada a ${label}`);
    });
  });
}

// ── Tab: Módulos ─────────────────────────────────────────────────────────────────
function _renderModulos() {
  const pane = document.getElementById('config-pane-modulos');
  if (!pane) return;

  const enabled = getEnabledModules();

  const rows = MODULE_DEFS.map(m => {
    const on = enabled.has(m.id);
    return `
      <div class="config-module-row ${on ? '' : 'config-module-row--disabled'}">
        <div class="config-module-icon ${on ? 'config-module-icon--active' : ''}">
          <span class="msi">${m.icon}</span>
        </div>
        <div class="config-module-info">
          <div class="config-module-label">
            ${esc(m.label)}
            ${m.required ? '<span class="config-required-chip">Requerido</span>' : ''}
          </div>
          <div class="config-module-desc">${esc(m.desc)}</div>
        </div>
        <label class="config-module-toggle ${m.required ? 'config-module-toggle--disabled' : ''}">
          <input type="checkbox" data-mid="${m.id}" ${on ? 'checked' : ''} ${m.required ? 'disabled' : ''}>
          <span class="config-toggle-track"></span>
        </label>
      </div>`;
  }).join('');

  pane.innerHTML = `
    <div class="config-section">
      <div class="config-section-title">Módulos habilitados</div>
      <div class="config-section-desc">
        Activa o desactiva módulos según las necesidades de tu organización. Los módulos requeridos no pueden deshabilitarse.
        Los cambios se reflejan inmediatamente en la navegación.
      </div>
      ${rows}
    </div>`;

  pane.querySelectorAll('[data-mid]').forEach(inp => {
    inp.addEventListener('change', () => {
      setModuleEnabled(inp.dataset.mid, inp.checked);
      const label = MODULE_DEFS.find(m => m.id === inp.dataset.mid)?.label || inp.dataset.mid;
      showToast(`${label} ${inp.checked ? 'habilitado' : 'deshabilitado'}`);
    });
  });
}

// ── Tab: Pricing ─────────────────────────────────────────────────────────────────
function _renderPricing() {
  const pane = document.getElementById('config-pane-pricing');
  if (!pane) return;

  const cards = PRICING_PLANS.map(p => {
    const isCurrent = p.id === PLAN_CURRENT;
    const modulePills = p.modules.map(mid => {
      const def = MODULE_DEFS.find(m => m.id === mid);
      return def ? `<span class="config-plan-module-chip">${def.label}</span>` : '';
    }).join('');
    const features = p.features.map(f => `<li>${esc(f)}</li>`).join('');

    return `
      <div class="config-plan-card ${p.highlight ? 'config-plan-card--highlight' : ''}">
        ${p.highlight ? '<div class="config-plan-badge">Más popular</div>' : ''}
        <div class="config-plan-name">${esc(p.name)}</div>
        <div class="config-plan-price">
          <span class="config-plan-price-num">${esc(p.price)}</span>
          ${p.period ? `<span class="config-plan-price-period">${esc(p.period)}</span>` : ''}
        </div>
        <div class="config-plan-desc">${esc(p.desc)}</div>
        <div class="config-plan-modules">${modulePills}</div>
        <ul class="config-plan-features">${features}</ul>
        <div class="config-plan-cta">
          ${isCurrent
            ? `<button class="btn" disabled style="width:100%;justify-content:center;opacity:.5;cursor:default">Plan actual</button>`
            : `<button class="btn btn-primary" style="width:100%;justify-content:center" onclick="alert('En producción esto abriría el flujo de upgrade.')">Seleccionar</button>`
          }
        </div>
      </div>`;
  }).join('');

  pane.innerHTML = `
    <div class="config-section">
      <div class="config-section-title">Planes disponibles</div>
      <div class="config-section-desc">Seleccioná el plan que mejor se adapte a tu organización. Los precios son en USD.</div>
      <div class="config-pricing-grid">${cards}</div>
      <p class="config-pricing-note">¿Necesitás algo personalizado? <strong>Contactanos</strong> para armar una propuesta a medida.</p>
    </div>`;
}

// ── Tab: Equipo ──────────────────────────────────────────────────────────────────
function _renderEquipo() {
  const pane = document.getElementById('config-pane-equipo');
  if (!pane) return;

  const team = getTeam();

  const roleOptions = ROLES.map(r => `<option value="${r}">${r}</option>`).join('');

  const rows = team.map(m => {
    const isSelf = m.id === 'u_mario';
    return `
      <div class="config-member-row">
        <div class="config-member-av" style="background:${m.color}">${esc(m.initials)}</div>
        <div class="config-member-info">
          <div class="config-member-name">${esc(m.name)} ${isSelf ? '<span style="font-size:10px;color:var(--text-muted)">(tú)</span>' : ''}</div>
          <div class="config-member-email">${esc(m.email)}</div>
        </div>
        <select class="config-role-select" data-uid="${m.id}" ${isSelf ? 'disabled' : ''}>
          ${ROLES.map(r => `<option value="${r}" ${m.role === r ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
        <span class="config-member-joined">Desde ${m.joinedAt}</span>
        ${isSelf ? '<div style="width:32px"></div>' : `<button class="icon-btn xs config-member-remove" data-remove="${m.id}" title="Eliminar miembro"><span class="msi xs">person_remove</span></button>`}
      </div>`;
  }).join('');

  pane.innerHTML = `
    <div class="config-section">
      <div class="config-section-title">Miembros del equipo</div>
      <div class="config-team-header">
        <button class="btn btn-primary" id="btn-invite"><span class="msi xs">person_add</span> Invitar miembro</button>
      </div>
      ${rows}
    </div>`;

  pane.querySelector('#btn-invite').addEventListener('click', _openInviteModal);

  pane.querySelectorAll('[data-uid]').forEach(sel => {
    sel.addEventListener('change', () => {
      updateMemberRole(sel.dataset.uid, sel.value);
      showToast('Rol actualizado');
    });
  });

  pane.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const m = getTeam().find(t => t.id === btn.dataset.remove);
      if (!m || !confirm(`¿Eliminar a ${m.name} del equipo?`)) return;
      removeMember(btn.dataset.remove);
      showToast(`${m.name} eliminado del equipo`);
    });
  });
}

function _openInviteModal() {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;z-index:600;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5);backdrop-filter:blur(4px)';
  modal.innerHTML = `
    <div style="width:min(420px,92vw);background:var(--surface-0);border-radius:var(--radius-lg);padding:var(--space-6);border:1px solid var(--border)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4)">
        <strong style="font-size:var(--text-lg)">Invitar miembro</strong>
        <button class="icon-btn" id="inv-close"><span class="msi sm">close</span></button>
      </div>
      <div class="config-invite-form">
        <div>
          <label>Nombre completo *</label>
          <input id="inv-name" type="text" placeholder="Ej: Sofía Ramos">
        </div>
        <div>
          <label>Email *</label>
          <input id="inv-email" type="email" placeholder="sofia@empresa.com">
        </div>
        <div>
          <label>Rol</label>
          <select id="inv-role">
            ${ROLES.map(r => `<option value="${r}">${r}</option>`).join('')}
          </select>
        </div>
        <div style="display:flex;gap:var(--space-2);justify-content:flex-end;margin-top:var(--space-2)">
          <button class="btn btn-ghost" id="inv-cancel">Cancelar</button>
          <button class="btn btn-primary" id="inv-save">Invitar</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('#inv-close').addEventListener('click', close);
  modal.querySelector('#inv-cancel').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  modal.querySelector('#inv-save').addEventListener('click', () => {
    const name  = modal.querySelector('#inv-name').value.trim();
    const email = modal.querySelector('#inv-email').value.trim();
    const role  = modal.querySelector('#inv-role').value;
    if (!name)  { modal.querySelector('#inv-name').focus(); return; }
    if (!email) { modal.querySelector('#inv-email').focus(); return; }
    inviteMember({ name, email, role });
    showToast(`Invitación enviada a ${name}`);
    close();
  });
}

// ── Init ─────────────────────────────────────────────────────────────────────────
export function initConfiguracion() {
  _renderSection();
}
