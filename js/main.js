// Entry point: routing, session restore, event listeners globales, window.* bridge, init
import { getNumCols } from './utils.js';
import { loadUploadsFromSession, loadPortalsFromSession, loadUserFoldersFromSession, pushPortal } from './session.js';
import { addUserFolder } from './data.js';
import { navigateToFolder, switchTab, showRecentFolders, openCrearCarpetaDialog, confirmCrearCarpeta, cancelCrearCarpeta } from './features/carpetas/browser.js';
import { initDemoImages, processUpload } from './features/carpetas/upload.js';
import { renderInicio, initFaceFilters, initSearch, typingWelcome, initSectionReveal } from './features/inicio/inicio.js';
import { initFilters } from './features/inicio/filters.js';
import { initFaceIds } from './features/faceids/faceids.js';
import { st, openModal, closeModal, goStep, tryGoStep, selectAccess, handleAccent, handleTheme, handleLogo, toggleInline, filterFolders, toggleFolder, filterUnits, toggleUnit, selectPortalType, copyLink, onNameInput, renderFolderList, selectSearchMethod } from './features/portales/modal.js';
import { openPortal, closePortal, openPortalFromRow, openMasterFromRow, handleDorsalSearch, clearDorsalSearch, handlePortalSearch, refreshPortalImages } from './features/portales/portal-screen.js';
import { addToTable } from './features/portales/table.js';
import { initImageDetail } from './features/carpetas/image-detail.js';
import { initContextMenu } from './features/shared/context-menu.js';
import { initSelection } from './features/shared/selection.js';
import { renderAnalytics } from './features/analytics/analytics.js';
import { renderPerfil } from './features/perfil/perfil.js';

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
  if (id === 'analytics') renderAnalytics();
  if (id === 'perfil') renderPerfil();
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

// ── Demo seed — runs once when session is empty ───────────────────
const _DEMO = [
  // Masters
  { id:'pm_carreras', type:'master', title:'Carreras LEN 2026',     accent:'#1d4ed8', theme:'light', dateStr:'10/Jun/2026', searchMethod:'both',   fCount:3, photoCount:0,  folderIds:[],         unitPortalIds:['pu_lima42k','pu_cusco','pu_colorrun'], masterIds:[] },
  { id:'pm_eventos',  type:'master', title:'Eventos Corporativos',  accent:'#7c3aed', theme:'dark',  dateStr:'12/Jun/2026', searchMethod:'both',   fCount:2, photoCount:0,  folderIds:[],         unitPortalIds:['pu_colorrun','pu_rimac'],               masterIds:[] },
  // Units — en 1 master
  { id:'pu_lima42k',  type:'unit',   title:'Lima 42K 2026',         accent:'#D5FF22', theme:'dark',  dateStr:'1/Jun/2026',  searchMethod:'both',   fCount:7, photoCount:42, folderIds:['lima42k'],   unitPortalIds:[], masterIds:['pm_carreras'] },
  { id:'pu_cusco',    type:'unit',   title:'Cusco Trail 50K',       accent:'#d97706', theme:'light', dateStr:'3/Jun/2026',  searchMethod:'dorsal', fCount:4, photoCount:28, folderIds:['lima42k'],   unitPortalIds:[], masterIds:['pm_carreras'] },
  { id:'pu_rimac',    type:'unit',   title:'Rimac Bienestar Fest',  accent:'#E8183C', theme:'light', dateStr:'5/Jun/2026',  searchMethod:'faceid', fCount:3, photoCount:18, folderIds:['rimac'],     unitPortalIds:[], masterIds:['pm_eventos']  },
  // Unit en 2 masters
  { id:'pu_colorrun', type:'unit',   title:'Color Run 2026',        accent:'#C026D3', theme:'dark',  dateStr:'8/Jun/2026',  searchMethod:'both',   fCount:5, photoCount:34, folderIds:['colorrun'],  unitPortalIds:[], masterIds:['pm_carreras','pm_eventos'] },
  // Unit standalone
  { id:'pu_andes',    type:'unit',   title:'Andes Ultra Run',       accent:'#22252f', theme:'dark',  dateStr:'14/Jun/2026', searchMethod:'dorsal', fCount:2, photoCount:11, folderIds:['lima42k'],   unitPortalIds:[], masterIds:[] },
];

function _seedDemoPortals() {
  // Push all to _portals first so getPortalById works during rendering
  _DEMO.forEach(p => pushPortal({ ...p }));
  // Render: masters first (top of table), then units (after last master)
  _DEMO.filter(p => p.type === 'master').forEach(p =>
    addToTable(p.title, p.unitPortalIds.length, 0, p.accent, [], p.dateStr, true, p.searchMethod, {
      id: p.id, type: 'master', theme: p.theme, unitPortalIds: p.unitPortalIds,
    })
  );
  _DEMO.filter(p => p.type !== 'master').forEach(p =>
    addToTable(p.title, p.fCount, p.photoCount, p.accent, p.folderIds, p.dateStr, true, p.searchMethod, {
      id: p.id, type: 'unit', theme: p.theme, masterIds: p.masterIds,
    })
  );
}

// ── Session restore ───────────────────────────────────────────────
function restoreSession() {
  loadUploadsFromSession();
  loadUserFoldersFromSession().forEach(f => addUserFolder(f.parentId, f.label, f.id));
  const portals = loadPortalsFromSession();
  if (portals.length === 0) {
    _seedDemoPortals();
    return;
  }
  // Render masters first so unit pills can resolve master titles
  portals.filter(p => p.type === 'master').forEach(p =>
    addToTable(p.title, (p.unitPortalIds || []).length, 0, p.accent, [], p.dateStr, true, p.searchMethod || 'both', {
      id: p.id, type: 'master', theme: p.theme || 'light', unitPortalIds: p.unitPortalIds || [],
    })
  );
  portals.filter(p => p.type !== 'master').forEach(p =>
    addToTable(p.title, p.fCount, p.photoCount || 0, p.accent, p.folderIds || [], p.dateStr, true, p.searchMethod || 'both', {
      id: p.id, type: 'unit', theme: p.theme || 'light', masterIds: p.masterIds || [],
    })
  );
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
  const portalType = row.dataset.portalType || 'unit';

  if (portalType === 'master') {
    e.preventDefault(); // block <a> navigation — open in-app instead; right-click still works via href
    openMasterFromRow(
      row.dataset.portalId    || '',
      row.dataset.portalTitle  || '',
      row.dataset.portalAccent || '',
      row.dataset.portalTheme  || 'light'
    );
  }
  // unit portals: the <a> tag handles navigation natively (left-click + right-click → open in new tab)
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
  openCrearCarpetaDialog,
  confirmCrearCarpeta,
  cancelCrearCarpeta,
  openModal,
  closeModal,
  goStep,
  tryGoStep,
  selectAccess,
  handleAccent,
  handleTheme,
  selectSearchMethod,
  handleLogo,
  toggleInline,
  filterFolders,
  toggleFolder,
  copyLink,
  onNameInput,
  selectPortalType,
  toggleUnit,
  filterUnits,
  openPortal,
  closePortal,
  openPortalFromRow,
  openMasterFromRow,
  handleDorsalSearch,
  clearDorsalSearch,
  handlePortalSearch,
});

// ── Init ──────────────────────────────────────────────────────────
restoreSession();
initImageDetail();

const _portalTab = new URLSearchParams(location.search).get('portal') === '1';

if (_portalTab) {
  const _p      = new URLSearchParams(location.search);
  const _title  = _p.get('title')  || 'Mi Portal';
  const _accent = _p.get('accent') || '#333';
  const _theme  = _p.get('theme')  || 'light';
  if (_p.get('type') === 'master') {
    openMasterFromRow(_p.get('masterId') || '', _title, _accent, _theme);
    initDemoImages().then(() => refreshPortalImages());
  } else {
    const _search    = _p.get('search') || 'both';
    const _folderIds = _p.get('folders') ? _p.get('folders').split(',').filter(Boolean) : [];
    openPortalFromRow(_title, _accent, _folderIds, _theme, _search);
    initDemoImages().then(() => refreshPortalImages());
  }
} else {
  initContextMenu();
  initSelection();
  showRecentFolders();
  renderInicio();
  let _iniColCount = null;
  window.addEventListener('resize', () => {
    const cols = getNumCols();
    if (cols !== _iniColCount) { _iniColCount = cols; renderInicio(); }
  });
  switchSection(location.hash.replace('#', '') || 'inicio');
  initDemoImages().then(() => {
    if (document.getElementById('portalScreen')?.classList.contains('open')) refreshPortalImages();
  });
  initFaceFilters();
  initFaceIds();
  initFilters();
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
