// Exports: addToTable(title, fCount, photoCount, accent, folderIds, dateStr?, silent?, searchMethod?, opts?) — inserta fila en tabla de portales y persiste en session
import { pushPortal, getPortalById } from '../../session.js';
import { showToast } from '../../components/atoms/toast.js';
import { openModalEdit } from './modal.js';
import { openPortalFromRow } from './portal-screen.js'; // [THEME-SIDEBAR]

export function addToTable(title, fCount, photoCount, accent, folderIds, dateStr, silent, searchMethod, opts = {}) {
  const today = new Date();
  const d = dateStr || `${today.getDate()}/${today.toLocaleString('es', { month: 'short' })}/${today.getFullYear()}`;
  const ids    = Array.isArray(folderIds) ? folderIds : [];
  const photos = photoCount || 0;
  const search = searchMethod || 'both';
  const portalType = opts.type || 'unit';
  const masterIds  = Array.isArray(opts.masterIds) ? opts.masterIds : [];
  const unitIds    = Array.isArray(opts.unitPortalIds) ? opts.unitPortalIds : [];

  let resolvedId = opts.id || '';
  if (!silent) {
    resolvedId = pushPortal({
      title, fCount, photoCount: photos, accent,
      theme: opts.theme || 'light',
      folderIds: ids, dateStr: d, searchMethod: search,
      id: opts.id || undefined,
      type: portalType, masterIds, unitPortalIds: unitIds,
    });
  }

  const isMaster = portalType === 'master';

  const row = document.createElement('div');
  row.className = 'table-row' + (isMaster ? ' table-row--master' : '');
  row.style.animation = 'fadeIn .3s ease';
  row.dataset.portalTitle   = title;
  row.dataset.portalAccent  = accent;
  row.dataset.portalFolders = ids.join(',');
  row.dataset.portalSearch  = search;
  row.dataset.portalType    = portalType;
  row.dataset.portalTheme   = opts.theme || 'light';
  if (resolvedId)     row.dataset.portalId      = resolvedId;
  if (unitIds.length) row.dataset.unitPortalIds = unitIds.join(',');

  const icon = isMaster ? 'hub' : 'captive_portal';
  const countCells = isMaster
    ? `<span class="content-chip"><span class="msi xs" style="color:var(--text-muted)">captive_portal</span>&nbsp;${fCount}</span>`
    : `<span class="content-chip"><span class="msi xs" style="color:var(--text-muted)">folder</span>&nbsp;${fCount}</span>
       <span class="content-chip"><span class="msi xs" style="color:var(--text-muted)">image</span>&nbsp;${photos}</span>`;

  const typeChip = isMaster
    ? `<span class="portal-type-chip portal-type-chip--master">Master</span>`
    : `<span class="portal-type-chip portal-type-chip--regular">Regular</span>`;

  const vinculosHTML = isMaster
    ? unitIds.map(uid => { const u = getPortalById(uid); return u ? `<span class="rel-pill rel-pill--unit">${u.title}</span>` : ''; }).filter(Boolean).join('')
    : masterIds.map(mid => { const m = getPortalById(mid); return m ? `<span class="rel-pill rel-pill--master">${m.title}</span>` : ''; }).filter(Boolean).join('');

  const portalUrl = isMaster
    ? `${location.pathname}?${new URLSearchParams({ portal:'1', type:'master', masterId: resolvedId, title, accent, theme: opts.theme||'light' })}`
    : `${location.pathname}?${new URLSearchParams({ portal:'1', title, accent, folders: ids.join(','), theme: opts.theme||'light', search })}`;
  const nameOpen  = `<a class="portal-name-cell" href="${portalUrl}" target="_blank" rel="noopener">`;
  const nameClose = `</a>`;

  row.innerHTML = `
    <div class="col col--portal">${nameOpen}<div class="portal-icon-box"><span class="msi xs">${icon}</span></div><span class="portal-name-text">${title}</span>${nameClose}</div>
    <div class="col col--tipo">${typeChip}</div>
    <div class="col col--rel"><div class="rel-pills">${vinculosHTML}</div></div>
    <div class="col col--contenido"><div class="content-cell">${countCells}</div></div>
    <div class="col col--registro">${d}</div>
    <div class="col col--autor" style="display:flex;align-items:center;gap:12px">
      <span style="flex:1">Tú</span>
      ${!isMaster ? `<button class="palette-btn" title="Personalizar diseño"><span class="msi xs">palette</span></button>` : ''}
      <button class="more-btn portal-more-btn"><span class="msi xs">more_horiz</span></button>
    </div>`;
  // Masters insert right after the header; units insert after the last master row (or after header if no masters)
  if (isMaster) {
    document.querySelector('#portalsTable .table-head').after(row);
  } else {
    const lastMaster = [...document.querySelectorAll('#portalsTable .table-row--master')].at(-1);
    const anchor = lastMaster || document.querySelector('#portalsTable .table-head');
    anchor.after(row);
  }
  return row;
}

// ── Portal row dropdown (event delegation — one listener for all rows) ────────
let _portalMenu      = null;
let _portalMenuAnchor = null;

function _initPortalMenu() {
  _portalMenu = document.createElement('div');
  _portalMenu.className = 'ctx-menu';
  _portalMenu.innerHTML = `
    <button class="ctx-item" data-action="view"><span class="msi xs" style="vertical-align:middle;margin-right:6px">open_in_new</span><span class="menu-view-label">Ver portal</span></button>
    <button class="ctx-item" data-action="edit"><span class="msi xs" style="vertical-align:middle;margin-right:6px">edit</span>Editar</button>
    <button class="ctx-item" data-action="share"><span class="msi xs" style="vertical-align:middle;margin-right:6px">share</span>Compartir</button>
    <button class="ctx-item ctx-item--dup" data-action="duplicate"><span class="msi xs" style="vertical-align:middle;margin-right:6px">content_copy</span>Duplicar</button>
    <div class="ctx-divider"></div>
    <button class="ctx-item ctx-item--danger" data-action="delete"><span class="msi xs" style="color:#e53e3e;vertical-align:middle;margin-right:6px">delete</span>Eliminar</button>`;
  document.body.appendChild(_portalMenu);

  _portalMenu.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const anchor = _portalMenuAnchor;
    _closePortalMenu();
    const row = anchor?.closest('.table-row');

    if (btn.dataset.action === 'view') {
      row?.querySelector('.portal-name-cell')?.click();
    } else if (btn.dataset.action === 'edit') {
      if (row) openModalEdit(row);
    } else if (btn.dataset.action === 'share') {
      const slug = (row?.dataset.portalTitle || 'portal').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (navigator.clipboard) navigator.clipboard.writeText(`https://len.pe/portal/${slug}`);
      showToast('Link copiado al portapapeles');
    } else if (btn.dataset.action === 'duplicate') {
      if (row && row.dataset.portalType !== 'master') {
        const folderIds = (row.dataset.portalFolders || '').split(',').filter(Boolean);
        addToTable(`${row.dataset.portalTitle || 'Portal'} (copia)`, folderIds.length, 0, row.dataset.portalAccent || '#22252f', folderIds, undefined, false, row.dataset.portalSearch || 'both', { theme: row.dataset.portalTheme || 'light' });
        showToast('Portal duplicado');
      }
    } else if (btn.dataset.action === 'delete') {
      _deletePortalRow(anchor);
    }
  });
}

function _openPortalMenu(anchorBtn) {
  _portalMenuAnchor = anchorBtn;
  const row      = anchorBtn.closest('.table-row');
  const isMaster = row?.dataset.portalType === 'master';

  // Adapt labels and visibility for the portal type
  const viewLabel = _portalMenu.querySelector('.menu-view-label');
  if (viewLabel) viewLabel.textContent = isMaster ? 'Ver master' : 'Ver portal';
  const dupBtn = _portalMenu.querySelector('.ctx-item--dup');
  if (dupBtn) dupBtn.style.display = isMaster ? 'none' : '';

  const rect = anchorBtn.getBoundingClientRect();
  const mw = 180, mh = 200;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let x = rect.right - mw;
  let y = rect.bottom + 4;
  if (x < 8) x = 8;
  if (y + mh > vh) y = rect.top - mh - 4;

  _portalMenu.style.left = x + 'px';
  _portalMenu.style.top  = y + 'px';
  _portalMenu.classList.add('open');
}

function _closePortalMenu() {
  _portalMenu?.classList.remove('open');
  _portalMenuAnchor = null;
}

function _deletePortalRow(anchor) {
  const row = anchor?.closest('.table-row');
  if (!row) return;
  const title = row.dataset.portalTitle || 'Portal';
  row.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
  row.style.opacity    = '0';
  row.style.transform  = 'scale(0.97)';
  setTimeout(() => row.remove(), 220);
  showToast(`"${title}" eliminado`);
}

// Single delegated listener on document — handles all .portal-more-btn clicks
document.addEventListener('click', e => {
  // Close menu if click is outside it
  if (_portalMenu?.classList.contains('open') && !_portalMenu.contains(e.target)) {
    const isMoreBtn = e.target.closest('.portal-more-btn');
    if (!isMoreBtn || isMoreBtn !== _portalMenuAnchor) {
      _closePortalMenu();
      if (isMoreBtn) return; // will be handled below
    }
  }

  const btn = e.target.closest('.portal-more-btn');
  if (!btn) return;
  e.stopPropagation();

  if (!_portalMenu) _initPortalMenu();

  if (_portalMenu.classList.contains('open') && _portalMenuAnchor === btn) {
    _closePortalMenu();
  } else {
    _openPortalMenu(btn);
  }
});

// Also mark static HTML rows' more-btns with the portal class on load
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#portalsTable .table-row .more-btn:not(.portal-more-btn)').forEach(btn => {
    btn.classList.add('portal-more-btn');
  });
});

// [THEME-SIDEBAR] — Palette button: abre portal + sidebar de diseño desde la tabla
document.getElementById('portalsTable').addEventListener('click', e => {
  const btn = e.target.closest('.palette-btn');
  if (!btn) return;
  e.stopPropagation();
  const row = btn.closest('.table-row');
  if (!row) return;
  const title     = row.dataset.portalTitle  || '';
  const accent    = row.dataset.portalAccent || '#22252f';
  const theme     = row.dataset.portalTheme  || 'light';
  const search    = row.dataset.portalSearch || 'both';
  const folderIds = row.dataset.portalFolders ? row.dataset.portalFolders.split(',').filter(Boolean) : [];
  openPortalFromRow(title, accent, folderIds, theme, search, true);
});
