// Feature: Gestión de Consentimientos — plantillas + historial de versiones.
// Exports: initConsentimientos()
import {
  getTemplates, getTemplateById, getStats,
  createTemplate, updateDraft, publishTemplate, newVersion, archiveTemplate,
  subscribeConsent, MODULE_META,
} from './consentimientos-data.js';
import { showToast } from '../../components/ui/toast.js';

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
}

const STATUS_LABEL = { active: 'Activo', draft: 'Borrador', archived: 'Archivado' };

// ── Render sección ───────────────────────────────────────────────────────────────
function _renderSection() {
  const sec = document.getElementById('sec-consentimientos');
  if (!sec) return;
  sec.innerHTML = `
    <div class="consent-wrap">
      <div class="consent-header">
        <div class="consent-header-left">
          <div id="consent-stats" class="consent-stats"></div>
        </div>
        <button class="btn btn-primary" id="btn-nueva-plantilla">
          <span class="msi sm">add</span> Nueva plantilla
        </button>
      </div>
      <div class="consent-list" id="consent-list"></div>
    </div>
    <div class="consent-detail-overlay" id="consent-detail-overlay">
      <div class="consent-detail-panel" id="consent-detail-panel"></div>
    </div>`;

  document.getElementById('btn-nueva-plantilla').addEventListener('click', _openNewTemplateModal);
  document.getElementById('consent-detail-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('consent-detail-overlay')) _closeDetail();
  });

  _renderList();
  subscribeConsent(_renderList);
}

function _renderList() {
  const templates = getTemplates();
  const stats     = getStats();

  const statsEl = document.getElementById('consent-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="consent-stat">
        <div class="consent-stat-dot consent-stat-dot--signed"></div>
        <span class="consent-stat-num">${stats.signed}</span>
        <span class="consent-stat-lbl">firmados</span>
      </div>
      <div class="consent-stats-div"></div>
      <div class="consent-stat">
        <div class="consent-stat-dot consent-stat-dot--pending"></div>
        <span class="consent-stat-num">${stats.pending}</span>
        <span class="consent-stat-lbl">pendientes</span>
      </div>
      <div class="consent-stats-div"></div>
      <div class="consent-stat">
        <div class="consent-stat-dot consent-stat-dot--revoked"></div>
        <span class="consent-stat-num">${stats.revoked}</span>
        <span class="consent-stat-lbl">revocados</span>
      </div>
      <div class="consent-stats-div"></div>
      <div class="consent-stat">
        <span class="consent-stat-num">${stats.total}</span>
        <span class="consent-stat-lbl">plantilla${stats.total !== 1 ? 's' : ''}</span>
      </div>`;
  }

  const list = document.getElementById('consent-list');
  if (!list) return;

  if (!templates.length) {
    list.innerHTML = `
      <div class="consent-empty">
        <span class="msi">verified_user</span>
        <p>No hay plantillas de consentimiento.<br>Creá una para gestionar los permisos de imagen.</p>
      </div>`;
    return;
  }

  list.innerHTML = templates.map(t => {
    const moduleHtml = Object.entries(MODULE_META).map(([key, m]) => `
      <div class="consent-module-pill ${t.modules[key] ? '' : 'consent-module-pill--off'}">
        <span class="msi xs">${m.icon}</span>${m.label}
      </div>`).join('');

    const countHtml = t.status === 'active' || t.signedCount > 0 ? `
      <div class="consent-card-counts">
        <span class="consent-count consent-count--signed">${t.signedCount} firmados</span>
        <span class="consent-count consent-count--pending">${t.pendingCount} pendientes</span>
        ${t.revokedCount ? `<span class="consent-count consent-count--revoked">${t.revokedCount} revocados</span>` : ''}
      </div>` : '';

    return `
      <div class="consent-card" data-tid="${t.id}">
        <div class="consent-card-body">
          <div class="consent-card-top">
            <span class="consent-status-chip consent-status-chip--${t.status}">${STATUS_LABEL[t.status]}</span>
            <span class="consent-version-chip">v${t.version}</span>
          </div>
          <div class="consent-card-title">${esc(t.title)}</div>
          <div class="consent-card-desc">${esc(t.description)}</div>
          <div class="consent-modules">${moduleHtml}</div>
          ${countHtml}
          <div class="consent-card-meta">
            <span><span class="msi xs">edit</span>Modificado ${t.lastModified}</span>
            <span><span class="msi xs">calendar_today</span>Creado ${t.createdAt}</span>
          </div>
        </div>
        <button class="icon-btn xs consent-card-menu" data-menu-tid="${t.id}" title="Opciones">
          <span class="msi xs">more_vert</span>
        </button>
      </div>`;
  }).join('');

  list.querySelectorAll('.consent-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.consent-card-menu')) return;
      _openDetail(card.dataset.tid);
    });
  });

  list.querySelectorAll('.consent-card-menu').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      _openCardMenu(btn.dataset.menuTid, btn);
    });
  });

  if (_currentTid) _renderDetail();
}

// ── Menú contextual ──────────────────────────────────────────────────────────────
function _openCardMenu(tid, anchor) {
  const t = getTemplateById(tid);
  if (!t) return;
  const existing = document.getElementById('consent-ctx-menu');
  if (existing) existing.remove();

  const items = [];
  if (t.status === 'draft')    items.push(`<button class="ctx-item" data-action="publish"><span class="msi xs">publish</span> Publicar</button>`);
  if (t.status === 'active')   items.push(`<button class="ctx-item" data-action="newver"><span class="msi xs">upgrade</span> Nueva versión</button>`);
  if (t.status !== 'archived') items.push(`<button class="ctx-item ctx-item--danger" data-action="archive"><span class="msi xs">archive</span> Archivar</button>`);

  const menu = document.createElement('div');
  menu.id = 'consent-ctx-menu';
  menu.className = 'ctx-menu';
  menu.innerHTML = items.join('');
  document.body.appendChild(menu);

  const r = anchor.getBoundingClientRect();
  menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${r.left - menu.offsetWidth + anchor.offsetWidth}px;z-index:500`;

  const close = () => menu.remove();
  document.addEventListener('click', close, { once: true });

  menu.querySelector('[data-action=publish]')?.addEventListener('click', () => { close(); _doPublish(tid); });
  menu.querySelector('[data-action=newver]')?.addEventListener('click', () => { close(); _openNewVersionModal(tid); });
  menu.querySelector('[data-action=archive]')?.addEventListener('click', () => { close(); _doArchive(tid); });
}

function _doPublish(tid) {
  const t = getTemplateById(tid);
  if (!t) return;
  publishTemplate(tid, `Publicado v${t.version}`);
  showToast(`"${t.title}" publicada`);
  _renderList();
}

function _doArchive(tid) {
  const t = getTemplateById(tid);
  if (!t) return;
  if (!confirm(`¿Archivar "${t.title}"? Dejará de estar disponible para nuevos consentimientos.`)) return;
  archiveTemplate(tid);
  showToast(`"${t.title}" archivada`);
  _closeDetail();
  _renderList();
}

// ── Panel de detalle ─────────────────────────────────────────────────────────────
let _currentTid = null;

function _openDetail(tid) {
  _currentTid = tid;
  _renderDetail();
  document.getElementById('consent-detail-overlay')?.classList.add('open');
}

function _closeDetail() {
  _currentTid = null;
  document.getElementById('consent-detail-overlay')?.classList.remove('open');
}

function _renderDetail() {
  const panel = document.getElementById('consent-detail-panel');
  if (!panel || !_currentTid) return;
  const t = getTemplateById(_currentTid);
  if (!t) return;

  const isDraft    = t.status === 'draft';
  const isActive   = t.status === 'active';
  const isArchived = t.status === 'archived';

  const moduleRows = Object.entries(MODULE_META).map(([key, m]) => `
    <div class="consent-module-row">
      <div class="consent-module-icon"><span class="msi">${m.icon}</span></div>
      <div class="consent-module-text">
        <div class="consent-module-label">${m.label}</div>
        <div class="consent-module-desc">${m.desc}</div>
      </div>
      <label class="consent-module-toggle ${isDraft ? '' : 'consent-module-toggle--readonly'}">
        <input type="checkbox" data-mod="${key}" ${t.modules[key] ? 'checked' : ''} ${isDraft ? '' : 'disabled'}>
        <span class="consent-toggle-track"></span>
      </label>
    </div>`).join('');

  const historyRows = [...t.history].reverse().map((h, i) => {
    const isCurrent = i === 0;
    return `
      <div class="consent-history-row">
        <div class="consent-history-dot ${isCurrent ? 'consent-history-dot--current' : ''}">
          <span class="msi">${isCurrent ? 'check' : 'history'}</span>
        </div>
        <div class="consent-history-info">
          <div class="consent-history-top">
            <span class="consent-history-ver">v${h.version}</span>
            <span class="consent-history-date">${h.date}</span>
          </div>
          <div class="consent-history-note">${esc(h.note)}</div>
          <div class="consent-history-author">Por ${esc(h.author)}</div>
        </div>
      </div>`;
  }).join('');

  const actionButtons = [
    isDraft    ? `<button class="btn btn-primary" id="cd-publish"><span class="msi xs">publish</span> Publicar</button>` : '',
    isActive   ? `<button class="btn" id="cd-newver"><span class="msi xs">upgrade</span> Nueva versión</button>` : '',
    !isArchived ? `<button class="btn btn-ghost" id="cd-archive"><span class="msi xs">archive</span> Archivar</button>` : '',
  ].filter(Boolean).join('');

  panel.innerHTML = `
    <div class="consent-detail-header">
      <div class="consent-detail-header-info">
        <div class="consent-detail-chips">
          <span class="consent-status-chip consent-status-chip--${t.status}">${STATUS_LABEL[t.status]}</span>
          <span class="consent-version-chip">v${t.version}</span>
        </div>
        <div class="consent-detail-title">${esc(t.title)}</div>
        <div class="consent-detail-desc">${esc(t.description)}</div>
      </div>
      <button class="icon-btn" id="cd-close"><span class="msi sm">close</span></button>
    </div>
    <div class="consent-detail-actions">
      ${actionButtons}
      <div class="consent-detail-actions-spacer"></div>
    </div>
    <div class="consent-detail-body">
      <div class="consent-panel-section">
        <div class="consent-panel-section-title">Módulos habilitados</div>
        ${moduleRows}
        ${isDraft ? '<p style="font-size:11px;color:var(--text-muted);margin-top:var(--space-2)">Los módulos definen qué tipo de uso queda autorizado para los activos con este consentimiento.</p>' : ''}
      </div>
      <div class="consent-panel-section">
        <div class="consent-panel-section-title">Historial de versiones</div>
        <div class="consent-history-list">${historyRows}</div>
      </div>
    </div>`;

  panel.querySelector('#cd-close').addEventListener('click', _closeDetail);

  panel.querySelector('#cd-publish')?.addEventListener('click', () => {
    _doPublish(_currentTid);
    _renderDetail();
  });

  panel.querySelector('#cd-newver')?.addEventListener('click', () => {
    _openNewVersionModal(_currentTid);
  });

  panel.querySelector('#cd-archive')?.addEventListener('click', () => {
    _doArchive(_currentTid);
  });

  if (isDraft) {
    panel.querySelectorAll('[data-mod]').forEach(inp => {
      inp.addEventListener('change', () => {
        updateDraft(_currentTid, { modules: { [inp.dataset.mod]: inp.checked } });
        _renderList();
      });
    });
  }
}

// ── Modal nueva versión ──────────────────────────────────────────────────────────
function _openNewVersionModal(tid) {
  const t = getTemplateById(tid);
  if (!t) return;
  const [major, minor] = t.version.split('.').map(Number);
  const minorVer = `${major}.${minor + 1}`;
  const majorVer = `${major + 1}.0`;
  let bumpMinor  = true;

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;z-index:600;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5);backdrop-filter:blur(4px)';
  modal.innerHTML = `
    <div style="width:min(460px,92vw);background:var(--surface-0);border-radius:var(--radius-lg);padding:var(--space-6);border:1px solid var(--border)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4)">
        <strong style="font-size:var(--text-lg)">Nueva versión</strong>
        <button class="icon-btn" id="nv-close"><span class="msi sm">close</span></button>
      </div>
      <div class="consent-newver-form">
        <div>
          <label>Tipo de cambio</label>
          <div class="consent-bump-row">
            <div class="consent-bump-opt selected" data-bump="minor">
              <strong>${minorVer}</strong>Cambio menor
            </div>
            <div class="consent-bump-opt" data-bump="major">
              <strong>${majorVer}</strong>Cambio mayor
            </div>
          </div>
        </div>
        <div>
          <label>Nota de cambio *</label>
          <textarea id="nv-note" placeholder="Describe brevemente qué cambió en esta versión…"></textarea>
        </div>
        <div style="display:flex;gap:var(--space-2);justify-content:flex-end">
          <button class="btn btn-ghost" id="nv-cancel">Cancelar</button>
          <button class="btn btn-primary" id="nv-save">Crear versión</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(modal);

  modal.querySelectorAll('.consent-bump-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      modal.querySelectorAll('.consent-bump-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      bumpMinor = opt.dataset.bump === 'minor';
    });
  });

  const close = () => modal.remove();
  modal.querySelector('#nv-close').addEventListener('click', close);
  modal.querySelector('#nv-cancel').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  modal.querySelector('#nv-save').addEventListener('click', () => {
    const note = modal.querySelector('#nv-note').value.trim();
    if (!note) { modal.querySelector('#nv-note').focus(); return; }
    newVersion(tid, note, bumpMinor);
    _renderList();
    showToast(`Nueva versión creada`);
    close();
  });
}

// ── Modal nueva plantilla ────────────────────────────────────────────────────────
function _openNewTemplateModal() {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;z-index:600;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5);backdrop-filter:blur(4px)';

  const moduleToggles = Object.entries(MODULE_META).map(([key, m]) => `
    <label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;padding:var(--space-1) 0">
      <input type="checkbox" data-nmod="${key}" style="accent-color:var(--accent)">
      <span class="msi xs">${m.icon}</span>
      <span style="font-size:var(--text-sm)">${m.label}</span>
    </label>`).join('');

  modal.innerHTML = `
    <div style="width:min(480px,92vw);background:var(--surface-0);border-radius:var(--radius-lg);padding:var(--space-6);border:1px solid var(--border)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4)">
        <strong style="font-size:var(--text-lg)">Nueva plantilla</strong>
        <button class="icon-btn" id="np-close"><span class="msi sm">close</span></button>
      </div>
      <div class="consent-newver-form">
        <div>
          <label>Nombre *</label>
          <input id="np-title" type="text" placeholder="Ej: Consentimiento Deportivo">
        </div>
        <div>
          <label>Descripción</label>
          <textarea id="np-desc" placeholder="Descripción del alcance del consentimiento…"></textarea>
        </div>
        <div>
          <label>Módulos habilitados</label>
          ${moduleToggles}
        </div>
        <div style="display:flex;gap:var(--space-2);justify-content:flex-end;margin-top:var(--space-2)">
          <button class="btn btn-ghost" id="np-cancel">Cancelar</button>
          <button class="btn btn-primary" id="np-save">Crear borrador</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('#np-close').addEventListener('click', close);
  modal.querySelector('#np-cancel').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  modal.querySelector('#np-save').addEventListener('click', () => {
    const title = modal.querySelector('#np-title').value.trim();
    if (!title) { modal.querySelector('#np-title').focus(); return; }
    const description = modal.querySelector('#np-desc').value;
    const modules = {};
    modal.querySelectorAll('[data-nmod]').forEach(inp => { modules[inp.dataset.nmod] = inp.checked; });
    createTemplate({ title, description, modules });
    showToast(`Plantilla "${title}" creada`);
    _renderList();
    close();
  });
}

// ── Init ─────────────────────────────────────────────────────────────────────────
export function initConsentimientos() {
  _renderSection();
}
