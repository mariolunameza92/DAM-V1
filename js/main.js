// Entry point: routing, session restore, event listeners globales, window.* bridge, init
import { getNumCols } from './utils.js';
import { loadUploadsFromSession, loadPortalsFromSession } from './session.js';
import { navigateToFolder, switchTab, showRecentFolders } from './features/carpetas/browser.js';
import { initDemoImages, processUpload } from './features/carpetas/upload.js';
import { renderInicio, initFaceFilters, initSearch, typingWelcome, initSectionReveal } from './features/inicio/inicio.js';
import { st, openModal, closeModal, goStep, tryGoStep, selectAccess, handleAccent, handleTheme, handleLogo, toggleInline, filterFolders, toggleFolder, copyLink, onNameInput, renderFolderList } from './features/portales/modal.js';
import { openPortal, closePortal, openPortalFromRow, handleDorsalSearch, clearDorsalSearch, handlePortalSearch } from './features/portales/portal-screen.js';
import { addToTable } from './features/portales/table.js';
import { initImageDetail } from './features/carpetas/image-detail.js';
import { initContextMenu } from './features/shared/context-menu.js';

const TITLES = {
  inicio: 'Inicio', carpetas: 'Carpetas', faceids: 'Face IDs',
  blacklist: 'Black List', portales: 'Portales', analytics: 'Analytics', perfil: 'Perfil',
};

// ── Routing ──────────────────────────────────────────────────────
export function switchSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const sec = document.getElementById('sec-' + id);
  if (sec) sec.classList.add('active');
  const btn = document.querySelector(`.nav-item[data-sec="${id}"]`);
  if (btn) btn.classList.add('active');
  document.getElementById('pageTitle').textContent = TITLES[id] || id;
  const sb = document.getElementById('topbarSearch');
  if (sb) sb.style.display = id === 'inicio' ? 'none' : '';
  if (id === 'inicio') animateWelcome();
  if (id === 'carpetas') showRecentFolders();
  location.hash = id;
}

let _introPlayed = false;
export function animateWelcome() {
  if (_introPlayed) return;
  _introPlayed = true;
  setTimeout(typingWelcome, 250);
}

export function goToCarpeta(nodeId) {
  switchSection('carpetas');
  navigateToFolder(nodeId);
}

// ── Session restore ───────────────────────────────────────────────
function restoreSession() {
  loadUploadsFromSession();
  loadPortalsFromSession().forEach(p => addToTable(p.title, p.fCount, p.photoCount || 0, p.accent, p.folderIds || [], p.dateStr, true));
}

// ── Event listeners ───────────────────────────────────────────────
document.getElementById('uploadInput').addEventListener('change', e => {
  processUpload(e.target.files);
  e.target.value = '';
});

document.getElementById('inp-title').addEventListener('input', e => { st.title = e.target.value; });
document.getElementById('inp-desc').addEventListener('input',  e => { st.desc  = e.target.value; });
document.getElementById('font-sel').addEventListener('change', e => { st.font  = e.target.value; });

document.getElementById('overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('overlay')) closeModal();
});

document.getElementById('foldersRow').addEventListener('click', e => {
  const card = e.target.closest('[data-node-id]');
  if (card) navigateToFolder(card.dataset.nodeId);
});

document.getElementById('portalsTable').addEventListener('click', e => {
  const cell = e.target.closest('.portal-name-cell');
  if (!cell) return;
  const row = cell.closest('.table-row');
  if (!row) return;
  const title     = row.dataset.portalTitle   || '';
  const accent    = row.dataset.portalAccent  || '';
  const theme     = row.dataset.portalTheme   || 'light';
  const folderIds = row.dataset.portalFolders ? row.dataset.portalFolders.split(',').filter(Boolean) : [];
  const params = new URLSearchParams({ portal: '1', title, accent, folders: folderIds.join(','), theme });
  window.open(`${location.pathname}?${params}`, '_blank');
});

document.addEventListener('click', e => {
  const dl = e.target.closest('.asset-dl[data-url]');
  if (!dl) return;
  const a = document.createElement('a');
  a.href = dl.dataset.url;
  a.download = dl.dataset.filename || 'download';
  a.click();
});

// ── Panel splitter ────────────────────────────────────────────────
(function () {
  const TREE_MIN_W = 180;
  const TREE_MAX_W = 360;
  const resizer    = document.getElementById('treeResizer');
  const treePanel  = document.querySelector('.tree-panel');
  let dragging = false, startX = 0, startW = 0;

  resizer.addEventListener('mousedown', e => {
    dragging = true;
    startX   = e.clientX;
    startW   = treePanel.offsetWidth;
    resizer.classList.add('dragging');
    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const newW = Math.min(TREE_MAX_W, Math.max(TREE_MIN_W, startW + (e.clientX - startX)));
    treePanel.style.width = newW + 'px';
  });
  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    resizer.classList.remove('dragging');
    document.body.style.cursor     = '';
    document.body.style.userSelect = '';
  });
})();

// ── Expose to window (inline HTML handlers) ───────────────────────
Object.assign(window, {
  switchSection,
  switchTab,
  goToCarpeta,
  openModal,
  closeModal,
  goStep,
  tryGoStep,
  selectAccess,
  handleAccent,
  handleTheme,
  handleLogo,
  toggleInline,
  filterFolders,
  toggleFolder,
  copyLink,
  onNameInput,
  openPortal,
  closePortal,
  openPortalFromRow,
  handleDorsalSearch,
  clearDorsalSearch,
  handlePortalSearch,
});

// ── Init ──────────────────────────────────────────────────────────
restoreSession();
initImageDetail();

const _portalTab = new URLSearchParams(location.search).get('portal') === '1';

if (_portalTab) {
  const _p        = new URLSearchParams(location.search);
  const _title     = _p.get('title') || 'Mi Portal';
  const _accent    = _p.get('accent') || '#333';
  const _theme     = _p.get('theme') || 'light';
  const _folderIds = _p.get('folders') ? _p.get('folders').split(',').filter(Boolean) : [];
  openPortalFromRow(_title, _accent, _folderIds, _theme);
  initDemoImages().then(() => openPortalFromRow(_title, _accent, _folderIds, _theme));
} else {
  initContextMenu();
  showRecentFolders();
  renderInicio();
  let _iniColCount = null;
  window.addEventListener('resize', () => {
    const cols = getNumCols();
    if (cols !== _iniColCount) { _iniColCount = cols; renderInicio(); }
  });
  switchSection(location.hash.replace('#', '') || 'inicio');
  initDemoImages();
  initFaceFilters();
  initSearch();
  initSectionReveal();

  // Hide topbar on scroll down, reveal on scroll up
  (function(){
    const scroller = document.querySelector('.content-scroll');
    const topbar   = document.querySelector('.topbar');
    if (!scroller || !topbar) return;
    let lastY = 0;
    scroller.addEventListener('scroll', () => {
      const y = scroller.scrollTop;
      const hide = y > lastY && y > 40;
      topbar.style.marginTop = hide ? `-${topbar.offsetHeight}px` : '';
      lastY = y;
    }, { passive: true });
  }());
}
