// Exports: openPortal(), closePortal(), openPortalFromRow()
import { st, closeModal } from './modal.js';
import { addToTable } from './table.js';
import { FOLDERS_DATA, FOLDER_IMAGES } from '../../data.js';
import { folderSVG } from '../../utils.js';
import { uploadedAssets, userUploadedAssets } from '../../session.js';
import { thumbsHTML } from '../shared/folder-card.js';
import { registerSection } from '../shared/image-registry.js';
import { assetCardHTML, assetListRowHTML } from '../shared/asset-card.js';

let _portalFolders      = [];
let _folderAssets       = [];
let _folderView         = 'grid';
let _topFoldersView     = 'grid';
let _archivosView       = 'grid';
let _activePortalFaceId = null;
let _faceActiveInFolder = false;

function getNumCols() {
  const w = window.innerWidth;
  if (w <= 1024) return 2;
  if (w <= 1440) return 3;
  if (w <= 1920) return 4;
  if (w < 2300)  return 5;
  return 6;
}

let _portalResizeHandler = null;

export function openPortal() {
  const rawName  = document.getElementById('inp-name').value.trim() || 'Mi Portal';
  const title    = st.title  || rawName;
  const desc     = st.desc   || 'Selección de recursos para compartir';
  const accent   = st.accent;
  const font     = document.getElementById('font-sel').value;
  const selected = FOLDERS_DATA.filter(f => st.selectedFolders.has(f.id));

  _renderPortal(title, desc, accent, font, selected);

  closeModal();
  document.getElementById('portalScreen').classList.add('open');
  document.getElementById('appShell').style.display = 'none';
  addToTable(title, selected.length, selected.length * 4, accent, selected.map(f => f.id));
  _animatePortalIn();
  _attachPortalResize(selected);
}

export function openPortalFromRow(title, accent, folderIds = []) {
  const folders = folderIds.length > 0
    ? FOLDERS_DATA.filter(f => folderIds.includes(f.id))
    : FOLDERS_DATA;
  _renderPortal(title, 'Selección de recursos para compartir', accent, 'Google Sans', folders);
  document.getElementById('portalScreen').classList.add('open');
  document.getElementById('appShell').style.display = 'none';
  _animatePortalIn();
  _attachPortalResize(folders);
}

function _attachPortalResize(folders) {
  if (_portalResizeHandler) window.removeEventListener('resize', _portalResizeHandler);
  let _cols = getNumCols();
  _portalResizeHandler = () => {
    const next = getNumCols();
    if (next !== _cols) {
      _cols = next;
      const allAssets = folders.flatMap(f => uploadedAssets[f.imageId || f.id] || []);
      _renderMasonry(allAssets);
      if (_folderView === 'grid') _renderFolderContent();
    }
  };
  window.addEventListener('resize', _portalResizeHandler);
}

function _renderPortal(title, desc, accent, font, folders) {
  _portalFolders   = folders;
  _topFoldersView  = 'grid';
  _folderView      = 'grid';
  _archivosView    = 'grid';

  document.getElementById('p-hero-title').textContent = title;
  document.getElementById('p-hero-sub').textContent   = desc;
  document.getElementById('portalScreen').style.fontFamily = `'${font}', sans-serif`;

  _removeFacePortal();
  _exitFolder(false);
  _renderTopFolders();

  // Archivos masonry — real images from all folders
  const allAssets = folders.flatMap(f => uploadedAssets[f.imageId || f.id] || []);
  _renderMasonry(allAssets);

  // Reset archivos toggle
  document.getElementById('p-toggle-archivos-grid')?.classList.add('active');
  document.getElementById('p-toggle-archivos-list')?.classList.remove('active');
}

// ── Top-level folders render ──────────────────────────────────────────────────
function _renderTopFolders() {
  const el = document.getElementById('p-folders');
  if (!el) return;

  if (_topFoldersView === 'grid') {
    el.style.display = '';
    el.style.overflowX = '';   // restaura overflow-x:auto del CSS
    el.className = 'p-folders';
    el.innerHTML = _portalFolders.map(f => {
      const id = f.imageId || f.id;
      return `<div class="p-folder" data-folder-id="${id}" data-folder-name="${f.name}">
        <div class="folder-vis">
          ${folderSVG()}
          <div class="folder-thumbs">${thumbsHTML(id)}</div>
        </div>
        <div class="p-folder-name">${f.name}</div>
      </div>`;
    }).join('');
  } else {
    el.style.display = 'block';
    el.style.overflowX = 'clip';  // clip sin crear scroll container (evita forzar overflow-y:auto)
    el.className = 'p-folders p-folders--list';
    el.innerHTML = _portalFolders.map(f => {
      const id = f.imageId || f.id;
      const source = (userUploadedAssets[id] && userUploadedAssets[id].length > 0)
        ? userUploadedAssets[id] : (uploadedAssets[id] || []);
      const demoImgs = FOLDER_IMAGES[id] || [];
      const firstSrc = source[0]?.thumb || demoImgs[0] || '';
      return `<div class="folder-row" data-folder-id="${id}" data-folder-name="${f.name}">
        <div class="folder-row-thumb">${firstSrc ? `<img src="${firstSrc}" loading="lazy" decoding="async">` : ''}</div>
        <span class="folder-row-name">${f.name}</span>
        <span class="folder-row-arrow"><span class="msi xs">chevron_right</span></span>
      </div>`;
    }).join('');
  }
  _attachFolderClicks();
}

function _attachFolderClicks() {
  document.querySelectorAll('#p-folders [data-folder-id]').forEach(el => {
    el.addEventListener('click', () => _enterFolder(el.dataset.folderId, el.dataset.folderName));
  });
}

function _enterFolder(folderId, folderName) {
  _folderAssets = uploadedAssets[folderId] || [];
  _folderView   = 'grid';

  document.getElementById('p-foldersTitle').textContent      = folderName;
  document.getElementById('p-foldersBack').style.display     = 'flex';
  document.getElementById('p-folders').style.display         = 'none';
  document.getElementById('p-section-archivos').style.display = 'none';
  document.getElementById('p-folder-files').style.display    = 'block';

  _setToggleActive('grid');
  _renderFolderContent();
}

function _exitFolder(restoreAll = true) {
  _folderAssets = [];

  if (_faceActiveInFolder) {
    _activePortalFaceId = null; _portalFaceAssets = []; _portalFaceName = '';
    _faceActiveInFolder = false;
    _clearFacePortalChip();
    document.getElementById('p-face-folder-count').style.display = 'none';
  }

  document.getElementById('p-foldersTitle').textContent       = 'Carpetas';
  document.getElementById('p-foldersBack').style.display      = 'none';
  document.getElementById('p-section-archivos').style.display = 'block';
  document.getElementById('p-section-carpetas').style.display = 'block';
  document.getElementById('p-folder-files').style.display     = 'none';
  document.getElementById('p-folder-files').innerHTML         = '';
  document.getElementById('p-folder-view-toggle').style.display = 'flex';
  _setToggleActive(_topFoldersView);

  if (restoreAll) {
    _renderTopFolders();
    const allAssets = _portalFolders.flatMap(f => uploadedAssets[f.imageId || f.id] || []);
    _renderMasonry(allAssets);
  }
}

function _setToggleActive(view) {
  document.getElementById('p-toggle-grid').classList.toggle('active', view === 'grid');
  document.getElementById('p-toggle-list').classList.toggle('active', view === 'list');
}

function _setArchivosToggleActive(view) {
  document.getElementById('p-toggle-archivos-grid')?.classList.toggle('active', view === 'grid');
  document.getElementById('p-toggle-archivos-list')?.classList.toggle('active', view === 'list');
}

function _renderFolderContent() {
  const el = document.getElementById('p-folder-files');
  if (!el) return;

  if (_folderAssets.length === 0) {
    el.innerHTML = `<div style="color:var(--g500);font-size:14px;padding:24px 0;font-family:var(--font-ui)">Las imágenes demo cargan en un momento…</div>`;
    return;
  }

  const assets = _folderAssets.map(a => ({
    src: a.preview, ext: a.ext.toUpperCase(),
    size: a.sizeStr, name: a.name,
    originalUrl: a.originalUrl || a.preview,
  }));
  registerSection('portal', assets);

  if (_folderView === 'grid') {
    const numCols = getNumCols();
    const cols = Array.from({ length: numCols }, () => []);
    assets.forEach((a, i) => cols[i % numCols].push({ a, i }));
    el.innerHTML = `<div class="p-masonry">${cols.map(col =>
      `<div class="masonry-col">${col.map(({ a, i }) =>
        `<div class="asset-card" data-section="portal" data-idx="${i}">
          <img src="${a.src}" decoding="async" style="width:100%;display:block;border-radius:8px">
          <div class="asset-dl" data-url="${a.originalUrl}" data-filename="${a.name}.${a.ext.toLowerCase()}">
            <span class="msi sm">download</span>
          </div>
          <div class="asset-hover">
            <div class="asset-name">${a.name}</div>
            <div class="asset-meta"><span>${a.ext}</span><span>${a.size}</span></div>
          </div>
        </div>`
      ).join('')}</div>`
    ).join('')}</div>`;
  } else {
    el.innerHTML = `<div class="file-list">${assets.map((a, i) => assetListRowHTML(a, 'portal', i)).join('')}</div>`;
  }
}

function _renderMasonry(rawAssets) {
  const masonry = document.getElementById('p-masonry');
  if (!masonry) return;

  if (rawAssets.length === 0) {
    masonry.innerHTML = `<div style="color:var(--g500);font-size:14px;padding:24px 0;font-family:var(--font-ui)">Las imágenes demo cargan en un momento…</div>`;
    return;
  }

  const assets = rawAssets.map(a => ({
    src: a.preview,
    ext: a.ext.toUpperCase(),
    size: a.sizeStr,
    name: a.name,
    originalUrl: a.originalUrl || a.preview,
  }));
  registerSection('portal', assets);

  if (_archivosView === 'list') {
    masonry.innerHTML = `<div class="file-list">${assets.map((a, i) => assetListRowHTML(a, 'portal', i)).join('')}</div>`;
    return;
  }

  const numCols = getNumCols();
  const cols = Array.from({ length: numCols }, () => []);
  assets.forEach((a, i) => cols[i % numCols].push({ a, i }));

  masonry.innerHTML = cols.map(col =>
    `<div class="masonry-col">${col.map(({ a, i }) =>
      `<div class="asset-card" data-section="portal" data-idx="${i}">
        <img src="${a.src}" decoding="async" style="width:100%;display:block;border-radius:8px">
        <div class="asset-dl" data-url="${a.originalUrl}" data-filename="${a.name}.${a.ext.toLowerCase()}">
          <span class="msi sm">download</span>
        </div>
        <div class="asset-hover">
          <div class="asset-name">${a.name}</div>
          <div class="asset-meta"><span>${a.ext}</span><span>${a.size}</span></div>
        </div>
      </div>`
    ).join('')}</div>`
  ).join('');
}

// ── Portal search & Face ID filter ───────────────────────────────────────────
function initPortalSearch() {
  const input        = document.getElementById('p-search-input');
  const suggestionsEl = document.getElementById('p-search-suggestions');
  if (!input || !suggestionsEl) return;

  document.body.appendChild(suggestionsEl);

  let activeIdx = -1;

  function items() { return Array.from(suggestionsEl.querySelectorAll('.search-suggestion')); }
  function highlight(idx) { items().forEach((el, i) => el.classList.toggle('kb-active', i === idx)); activeIdx = idx; }

  function positionDropdown() {
    const rect = document.getElementById('p-search-wrap').getBoundingClientRect();
    suggestionsEl.style.top   = (rect.bottom + 8) + 'px';
    suggestionsEl.style.left  = rect.left + 'px';
    suggestionsEl.style.width = rect.width + 'px';
  }

  function hide() { suggestionsEl.style.display = 'none'; suggestionsEl.innerHTML = ''; activeIdx = -1; }

  function select(face) { input.value = ''; hide(); _activeFacePortal(face.id, face.name, face.imgSrc); }

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { hide(); return; }

    const faces = Array.from(document.querySelectorAll('.face-av[data-face-id]')).map(el => ({
      id: el.dataset.faceId, name: el.dataset.faceName, imgSrc: el.querySelector('img')?.src,
    }));
    const matches = faces.filter(f => f.name.toLowerCase().includes(q));
    if (!matches.length) { hide(); return; }

    activeIdx = -1;
    suggestionsEl.innerHTML = matches.map(f =>
      `<div class="search-suggestion" data-face-id="${f.id}">
        <div class="search-sug-avatar"><img src="${f.imgSrc}" alt="${f.name}"></div>
        <span class="search-sug-name">${f.name}</span>
        <span class="search-sug-tag"><span class="msi xs">ar_on_you</span>Face ID</span>
      </div>`
    ).join('');
    positionDropdown();
    suggestionsEl.style.display = '';
    suggestionsEl.querySelectorAll('.search-suggestion').forEach((el, i) => {
      el.addEventListener('mousedown', e => { e.preventDefault(); select(matches[i]); });
    });
  });

  input.addEventListener('keydown', e => {
    const list = items();
    if (!list.length) return;
    if (e.key === 'ArrowDown')  { e.preventDefault(); highlight(Math.min(activeIdx + 1, list.length - 1)); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); highlight(Math.max(activeIdx - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const idx    = activeIdx >= 0 ? activeIdx : 0;
      const faceId = list[idx]?.dataset.faceId;
      const faces  = Array.from(document.querySelectorAll('.face-av[data-face-id]')).map(el => ({
        id: el.dataset.faceId, name: el.dataset.faceName, imgSrc: el.querySelector('img')?.src,
      }));
      const face = faces.find(f => f.id === faceId);
      if (face) select(face);
    } else if (e.key === 'Escape') { input.value = ''; hide(); }
  });

  input.addEventListener('blur', () => setTimeout(hide, 150));
}

function _clearFacePortalChip() {
  const active = document.querySelector('#portalScreen .face-chip-active');
  if (!active) return;
  const btn = document.createElement('button');
  btn.id = 'p-chip-faceid'; btn.className = 'p-filter-chip';
  btn.innerHTML = '<span class="msi xs">ar_on_you</span>Face ID';
  active.replaceWith(btn);
}

function _activeFacePortal(id, name, imgSrc) {
  _activePortalFaceId = id;
  _faceActiveInFolder = _folderAssets.length > 0;

  const chip = document.getElementById('p-chip-faceid');
  if (!chip) return;
  const active = document.createElement('div');
  active.className = 'face-chip-active';
  active.innerHTML =
    `<div class="face-chip-avatar"><img src="${imgSrc}" alt="${name}"></div>` +
    `<span class="face-chip-name">${name}</span>` +
    `<button class="face-chip-remove"><span class="msi xs">close</span></button>`;
  active.querySelector('.face-chip-remove').addEventListener('click', _removeFacePortal);
  chip.replaceWith(active);

  _renderPortalFaceResults(id, name);
}

function _removeFacePortal() {
  const wasInFolder   = _faceActiveInFolder;
  _activePortalFaceId = null;
  _portalFaceAssets   = [];
  _portalFaceName     = '';
  _faceActiveInFolder = false;

  _clearFacePortalChip();

  if (wasInFolder) {
    document.getElementById('p-folder-view-toggle').style.display = 'flex';
    const countEl = document.getElementById('p-face-folder-count');
    countEl.style.display = 'none'; countEl.innerHTML = '';
    _renderFolderContent();
  } else {
    document.getElementById('p-section-carpetas').style.display = 'block';
    document.getElementById('p-section-archivos').style.display = 'block';
    const results = document.getElementById('p-face-results');
    if (results) { results.style.display = 'none'; results.innerHTML = ''; }
  }
}

let _portalFaceAssets = [];
let _portalFaceName   = '';
let _portalFaceView   = 'grid';

function _renderPortalFaceResults(id, name) {
  const source = _faceActiveInFolder
    ? _folderAssets
    : _portalFolders.flatMap(f => uploadedAssets[f.imageId || f.id] || []);
  const picks = source.filter(a => a.faceIds && a.faceIds.includes(id));

  _portalFaceName   = name;
  _portalFaceView   = 'grid';
  _portalFaceAssets = picks.map(a => ({
    src: a.preview, ext: a.ext.toUpperCase(), size: a.sizeStr,
    name: a.name, originalUrl: a.originalUrl || a.preview,
  }));
  if (_portalFaceAssets.length > 0) registerSection('portal-faces', _portalFaceAssets);

  _faceActiveInFolder ? _showPortalFaceInFolder() : _showPortalFaceDefault();
}

function _showPortalFaceDefault() {
  document.getElementById('p-section-carpetas').style.display = 'none';
  document.getElementById('p-section-archivos').style.display = 'none';
  const el = document.getElementById('p-face-results');
  if (!el) return;
  if (_portalFaceAssets.length === 0) {
    el.innerHTML = `<div class="face-results-header">No hay imágenes cargadas aún.</div>`;
  } else {
    _drawPortalFaceResults(el);
  }
  el.style.display = '';
}

function _showPortalFaceInFolder() {
  document.getElementById('p-folder-view-toggle').style.display = 'none';
  const countEl = document.getElementById('p-face-folder-count');
  countEl.innerHTML = `<span class="msi xs">ar_on_you</span>&nbsp;${_portalFaceAssets.length} resultados para <strong>${_portalFaceName}</strong>`;
  countEl.style.display = 'flex';

  const el = document.getElementById('p-folder-files');
  el.style.display = 'block';
  el.innerHTML = _portalFaceAssets.length > 0
    ? `<div class="face-results-grid">${_portalFaceAssets.map((a, i) => assetCardHTML(a, 'portal-faces', i)).join('')}</div>`
    : `<div style="color:var(--g500);font-size:14px;padding:24px 0;font-family:var(--font-ui)">No hay imágenes disponibles.</div>`;
}

function _drawPortalFaceResults(el) {
  const assets = _portalFaceAssets;
  const name   = _portalFaceName;

  const contentHTML = _portalFaceView === 'grid'
    ? `<div class="face-results-grid">${assets.map((a, i) => assetCardHTML(a, 'portal-faces', i)).join('')}</div>`
    : `<div class="file-list">${assets.map((a, i) => assetListRowHTML(a, 'portal-faces', i)).join('')}</div>`;

  el.innerHTML =
    `<div class="face-results-header-row">
      <div class="face-results-header"><span class="msi xs">ar_on_you</span>&nbsp;${assets.length} resultados para <strong>${name}</strong></div>
      <div class="p-view-toggle">
        <button class="p-view-btn ${_portalFaceView === 'grid' ? 'active' : ''}" data-pfv="grid"><span class="msi xs">grid_view</span></button>
        <button class="p-view-btn ${_portalFaceView === 'list' ? 'active' : ''}" data-pfv="list"><span class="msi xs">lists</span></button>
      </div>
    </div>` + contentHTML;

  el.querySelectorAll('.p-view-btn[data-pfv]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (_portalFaceView === btn.dataset.pfv) return;
      _portalFaceView = btn.dataset.pfv;
      _drawPortalFaceResults(el);
    });
  });
}

function _animatePortalIn() {
  const screen = document.getElementById('portalScreen');
  const blocks = [
    screen.querySelector('.p-header-section'),
    ...Array.from(screen.querySelectorAll('.p-section')),
  ].filter(Boolean);

  gsap.fromTo(blocks,
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.5, ease: 'power1.out', stagger: 0.25 }
  );
}

initPortalSearch();
document.getElementById('p-foldersBack').addEventListener('click', () => _exitFolder(true));

// ── Carpetas section toggle (context-aware: top folders vs folder content) ────
document.getElementById('p-toggle-grid').addEventListener('click', () => {
  const inFolder = document.getElementById('p-folder-files').style.display !== 'none';
  if (inFolder) {
    if (_folderView === 'grid') return;
    _folderView = 'grid';
    _setToggleActive('grid');
    _renderFolderContent();
  } else {
    if (_topFoldersView === 'grid') return;
    _topFoldersView = 'grid';
    _setToggleActive('grid');
    _renderTopFolders();
  }
});

document.getElementById('p-toggle-list').addEventListener('click', () => {
  const inFolder = document.getElementById('p-folder-files').style.display !== 'none';
  if (inFolder) {
    if (_folderView === 'list') return;
    _folderView = 'list';
    _setToggleActive('list');
    _renderFolderContent();
  } else {
    if (_topFoldersView === 'list') return;
    _topFoldersView = 'list';
    _setToggleActive('list');
    _renderTopFolders();
  }
});

// ── Archivos section toggle ───────────────────────────────────────────────────
document.getElementById('p-toggle-archivos-grid').addEventListener('click', () => {
  if (_archivosView === 'grid') return;
  _archivosView = 'grid';
  _setArchivosToggleActive('grid');
  const allAssets = _portalFolders.flatMap(f => uploadedAssets[f.imageId || f.id] || []);
  _renderMasonry(allAssets);
});

document.getElementById('p-toggle-archivos-list').addEventListener('click', () => {
  if (_archivosView === 'list') return;
  _archivosView = 'list';
  _setArchivosToggleActive('list');
  const allAssets = _portalFolders.flatMap(f => uploadedAssets[f.imageId || f.id] || []);
  _renderMasonry(allAssets);
});

export function closePortal() {
  if (new URLSearchParams(location.search).get('portal') === '1') {
    window.close();
    return;
  }
  document.getElementById('portalScreen').classList.remove('open');
  document.getElementById('appShell').style.display = 'flex';
  if (_portalResizeHandler) {
    window.removeEventListener('resize', _portalResizeHandler);
    _portalResizeHandler = null;
  }
}
