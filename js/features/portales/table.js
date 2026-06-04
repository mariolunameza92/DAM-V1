// Exports: addToTable(title, fCount, photoCount, accent, folderIds, dateStr?, silent?, searchMethod?) — inserta fila en tabla de portales y persiste en session
import { pushPortal } from '../../session.js';
import { showToast } from '../../components/ui/toast.js';
import { openModalEdit } from './modal.js';

export function addToTable(title, fCount, photoCount, accent, folderIds, dateStr, silent, searchMethod) {
  const today = new Date();
  const d = dateStr || `${today.getDate()}/${today.toLocaleString('es', { month: 'short' })}/${today.getFullYear()}`;
  const ids = Array.isArray(folderIds) ? folderIds : [];
  const photos = photoCount || 0;
  const search = searchMethod || 'both';

  if (!silent) pushPortal({ title, fCount, photoCount: photos, accent, folderIds: ids, dateStr: d, searchMethod: search });

  const row = document.createElement('div');
  row.className = 'table-row';
  row.style.animation = 'fadeIn .3s ease';
  row.dataset.portalTitle = title;
  row.dataset.portalAccent = accent;
  row.dataset.portalFolders = ids.join(',');
  row.dataset.portalSearch = search;
  row.innerHTML = `
    <div class="col"><div class="portal-name-cell" style="cursor:pointer">
      <div class="portal-icon-box">
        <span class="msi xs" style="color:var(--g500)">captive_portal</span>
      </div>${title}
    </div></div>
    <div class="col"><div class="content-cell">
      <span class="content-chip"><span class="msi xs" style="color:var(--g500)">folder</span>&nbsp;${fCount}</span>
      <span class="content-chip"><span class="msi xs" style="color:var(--g500)">image</span>&nbsp;${photos}</span>
    </div></div>
    <div class="col">${d}</div>
    <div class="col" style="display:flex;align-items:center;gap:12px">
      <span style="flex:1">Tú</span>
      <button class="more-btn portal-more-btn"><span class="msi xs">more_horiz</span></button>
    </div>`;
  document.querySelector('#portalsTable .table-head').after(row);
}

// ── Portal row dropdown (event delegation — one listener for all rows) ────────
let _portalMenu      = null;
let _portalMenuAnchor = null;

function _initPortalMenu() {
  _portalMenu = document.createElement('div');
  _portalMenu.className = 'ctx-menu';
  _portalMenu.innerHTML = `
    <button class="ctx-item" data-action="view"><span class="msi xs" style="vertical-align:middle;margin-right:6px">open_in_new</span>Ver portal</button>
    <button class="ctx-item" data-action="edit"><span class="msi xs" style="vertical-align:middle;margin-right:6px">edit</span>Editar</button>
    <button class="ctx-item" data-action="share"><span class="msi xs" style="vertical-align:middle;margin-right:6px">share</span>Compartir</button>
    <button class="ctx-item" data-action="duplicate"><span class="msi xs" style="vertical-align:middle;margin-right:6px">content_copy</span>Duplicar</button>
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
      if (row) {
        const folderIds = (row.dataset.portalFolders || '').split(',').filter(Boolean);
        addToTable(`${row.dataset.portalTitle || 'Portal'} (copia)`, folderIds.length, 0, row.dataset.portalAccent || '#22252f', folderIds, undefined, false, row.dataset.portalSearch || 'both');
        showToast('Portal duplicado');
      }
    } else if (btn.dataset.action === 'delete') {
      _deletePortalRow(anchor);
    }
  });
}

function _openPortalMenu(anchorBtn) {
  _portalMenuAnchor = anchorBtn;

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
