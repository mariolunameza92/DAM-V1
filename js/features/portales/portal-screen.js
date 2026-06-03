// Exports: openPortal(), closePortal(), openPortalFromRow(), handleDorsalSearch(), clearDorsalSearch()
import { st, closeModal, getEditingRow, clearEditingRow } from './modal.js';
import { addToTable } from './table.js';
import { FOLDERS_DATA, findNode } from '../../data.js';
import { getNumCols, positionDropdown, generateShadeScale, hexToOklch } from '../../utils.js';
import { uploadedAssets } from '../../session.js';
import { registerSection } from '../shared/image-registry.js';
import { assetCardHTML, assetListRowHTML } from '../shared/asset-card.js';

let _portalFolders       = [];
let _activeTabIdx        = 0;
let _portalResizeHandler = null;
let _navMode             = 'masonry'; // 'masonry' | 'tabs' | 'folder-grid'
let _navItems            = [];
let _drillFolder         = null;
let _lbAssets = [];
let _lbIdx    = 0;

// ── SVG logo recoloring ───────────────────────────────────────────────────────
function _recolorSvg(svgText) {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  if (doc.querySelector('parsererror')) return null;

  const neutral = v => !v || v === 'none' || v === 'transparent';
  const walk = el => {
    for (const attr of ['fill', 'stroke']) {
      if (!neutral(el.getAttribute(attr))) el.setAttribute(attr, 'currentColor');
    }
    const s = el.getAttribute('style');
    if (s) el.setAttribute('style', s
      .replace(/\bfill\s*:\s*(?!none|transparent)[^;]+/gi, 'fill:currentColor')
      .replace(/\bstroke\s*:\s*(?!none|transparent)[^;]+/gi, 'stroke:currentColor'));
    for (const child of el.children) walk(child);
  };

  const root = doc.documentElement;
  walk(root);
  root.setAttribute('fill', 'currentColor');
  root.removeAttribute('width');
  root.removeAttribute('height');
  root.setAttribute('aria-hidden', 'true');
  return new XMLSerializer().serializeToString(doc);
}

// ── OKLCH accent system ───────────────────────────────────────────────────────
function _applyPortalTheme(el, accentHex, theme) {
  el.dataset.theme = theme || 'light';
  const shades    = generateShadeScale(accentHex || '#22252f');
  const { C, H }  = hexToOklch(accentHex || '#22252f');
  const isDark    = theme === 'dark';

  // Replace every --g* token with accent-tinted shades.
  // Light: 50→950 in natural order. Dark: inverted so g50=darkest, g950=lightest.
  const gNames = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  gNames.forEach((name, i) => {
    el.style.setProperty(`--g${name}`, (isDark ? shades[10 - i] : shades[i]).css);
  });

  // Semantic accent tokens (primary btn, secondary btn, subtle bg)
  const primary      = shades[isDark ? 5 : 6];   // 500 dark · 600 light
  const primaryTxt   = `oklch(${primary.l >= 0.62 ? 0.15 : 0.99} 0 0)`;
  const hover        = shades[isDark ? 4 : 7];   // 400 dark · 700 light
  const secondary    = shades[isDark ? 8 : 1];   // 800 dark · 100 light
  const secondaryTxt = shades[isDark ? 2 : 7];   // 200 dark · 700 light
  const subtle       = shades[isDark ? 10 : 0];  // 950 dark · 50 light

  el.style.setProperty('--color-accent',           primary.css);
  el.style.setProperty('--color-accent-hover',     hover.css);
  el.style.setProperty('--color-accent-text',      primaryTxt);
  el.style.setProperty('--color-accent-subtle',    subtle.css);
  el.style.setProperty('--color-accent-dark',      secondary.css);
  el.style.setProperty('--color-accent-dark-text', secondaryTxt.css);

  // Near-white and near-black with the accent hue embedded — no alpha compositing
  el.style.setProperty('--portal-bg-whisper', `oklch(0.986 ${(C * 0.05).toFixed(4)} ${H.toFixed(2)})`);
  el.style.setProperty('--portal-bg-deep',    `oklch(0.058 ${(C * 0.18).toFixed(4)} ${H.toFixed(2)})`);

  // Decorative blob — accent-tinted, different stops for light vs dark
  const blobInner = isDark ? shades[7] : shades[2];
  const blobMid   = isDark ? shades[8] : shades[3];
  el.style.setProperty('--portal-blob-inner', `oklch(${blobInner.l.toFixed(3)} ${blobInner.c.toFixed(4)} ${H.toFixed(2)} / 0.55)`);
  el.style.setProperty('--portal-blob-mid',   `oklch(${blobMid.l.toFixed(3)} ${blobMid.c.toFixed(4)} ${H.toFixed(2)} / 0.28)`);

  // Visor secondary buttons — shade-900 tinted, always dark context so icon always light
  const visorBtn = shades[9];
  el.style.setProperty('--visor-btn-bg',   `oklch(${visorBtn.l.toFixed(3)} ${visorBtn.c.toFixed(4)} ${H.toFixed(2)} / 0.72)`);
  el.style.setProperty('--visor-btn-icon', `oklch(${visorBtn.l >= 0.5 ? 0.15 : 0.95} 0 0)`);
}

// ── Public entry points ───────────────────────────────────────────────────────
export function openPortal() {
  const rawName = document.getElementById('inp-name').value.trim() || 'Mi Portal';
  const title   = st.title  || rawName;
  const desc    = st.desc   || 'Selección de recursos para compartir';
  const accent  = st.accent;
  const theme   = st.theme || 'light';
  const font    = document.getElementById('font-sel').value;
  const logoSrc = document.getElementById('logo-img')?.src || '';
  const selected = FOLDERS_DATA.filter(f => st.selectedFolders.has(f.id));

  _renderPortal(title, desc, accent, theme, font, logoSrc, selected);
  closeModal();
  document.getElementById('portalScreen').classList.add('open');
  document.getElementById('appShell').style.display = 'none';

  const editRow = getEditingRow();
  if (editRow) {
    editRow.dataset.portalAccent  = accent;
    editRow.dataset.portalTitle   = title;
    editRow.dataset.portalFolders = selected.map(f => f.id).join(',');
    const nameEl = editRow.querySelector('.portal-name-cell');
    if (nameEl) nameEl.childNodes[nameEl.childNodes.length - 1].textContent = title;
    clearEditingRow();
  } else {
    addToTable(title, selected.length, selected.length * 4, accent, selected.map(f => f.id));
  }
  _animatePortalIn();
  _attachPortalResize();
}

export function openPortalFromRow(title, accent, folderIds = [], theme = 'light') {
  const folders = folderIds.length > 0
    ? FOLDERS_DATA.filter(f => folderIds.includes(f.id))
    : FOLDERS_DATA;
  _renderPortal(title, 'Selección de recursos para compartir', accent, theme, 'Google Sans', '', folders);
  document.getElementById('portalScreen').classList.add('open');
  document.getElementById('appShell').style.display = 'none';
  _animatePortalIn();
  _attachPortalResize();
}

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

// ── Core render ───────────────────────────────────────────────────────────────
function _renderPortal(title, desc, accent, theme, font, logoSrc, folders) {
  _portalFolders = folders;
  _activeTabIdx  = 0;

  const portalEl = document.getElementById('portalScreen');
  document.getElementById('p-hero-title').textContent = title;
  document.getElementById('p-hero-sub').textContent   = desc;
  portalEl.style.fontFamily = `'${font}', sans-serif`;
  _applyPortalTheme(portalEl, accent, theme);

  const logoArea     = portalEl.querySelector('#p-header-logo');
  const logoImg      = portalEl.querySelector('#p-logo-img');
  const logoSvgWrap  = portalEl.querySelector('#p-logo-svg');

  if (logoSrc && logoSrc !== window.location.href && logoArea) {
    if (st.logoSvgText && logoSvgWrap) {
      const recolored = _recolorSvg(st.logoSvgText);
      if (recolored) {
        logoSvgWrap.innerHTML = recolored;
        logoSvgWrap.style.display = 'flex';
        if (logoImg) logoImg.style.display = 'none';
        logoArea.style.display = 'block';
      }
    } else if (logoImg) {
      logoImg.src = logoSrc;
      logoImg.style.display = 'block';
      if (logoSvgWrap) logoSvgWrap.style.display = 'none';
      logoArea.style.display = 'block';
    }
  } else if (logoArea) {
    logoArea.style.display = 'none';
  }

  _clearFacePortalChip();
  _clearDorsalState();
  document.getElementById('p-face-results').style.display = 'none';
  document.getElementById('p-face-results').innerHTML     = '';
  document.getElementById('p-active-chip-area').style.display = 'none';
  document.getElementById('p-content-section').style.display  = '';

  _renderNavigation();
}

// ── Navigation — 3-state smart detection ─────────────────────────────────────
function _getChildrenOf(folderId) {
  const node   = findNode(folderId);
  if (!node?.children?.length) return [];
  const parent = FOLDERS_DATA.find(f => f.id === folderId);
  return node.children.map(child => ({
    id:      child.id,
    name:    child.label,
    imageId: parent?.imageId || folderId,
  }));
}

function _resolveNav(folders) {
  if (!folders.length) return { mode: 'masonry', items: folders };
  if (folders.length === 1) {
    const children = _getChildrenOf(folders[0].id);
    if (!children.length) return { mode: 'masonry', items: folders };
    return { mode: children.length > 6 ? 'folder-grid' : 'tabs', items: children };
  }
  return { mode: folders.length > 6 ? 'folder-grid' : 'tabs', items: folders };
}

function _renderNavigation() {
  const { mode, items } = _resolveNav(_portalFolders);
  _navMode     = mode;
  _navItems    = items;
  _drillFolder = null;

  const tabsSec  = document.getElementById('p-tabs-section');
  const grid     = document.getElementById('p-folder-grid');
  const masonry  = document.getElementById('p-masonry');
  const drillBar = document.getElementById('p-drill-back');
  drillBar.style.display = 'none';

  if (mode === 'masonry') {
    tabsSec.style.display = 'none';
    grid.style.display    = 'none';
    masonry.style.display = '';
    const f = _portalFolders[0];
    _renderMasonry(f ? (uploadedAssets[f.imageId || f.id] || []) : []);

  } else if (mode === 'tabs') {
    tabsSec.style.display = '';
    grid.style.display    = 'none';
    masonry.style.display = '';
    _activeTabIdx = 0;
    const bar = document.getElementById('p-tabs-bar');
    bar.innerHTML = items.map((item, i) =>
      `<button class="p-tab${i === 0 ? ' active' : ''}" data-tab-idx="${i}">${item.name}</button>`
    ).join('');
    bar.querySelectorAll('.p-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.tabIdx);
        if (idx === _activeTabIdx) return;
        _activeTabIdx = idx;
        bar.querySelectorAll('.p-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _renderActiveItem();
      });
    });
    _renderActiveItem();

  } else {
    tabsSec.style.display = 'none';
    grid.style.display    = '';
    masonry.style.display = 'none';
    _renderFolderGrid(items);
  }
}

function _renderActiveItem() {
  const item = _navMode === 'masonry' ? _portalFolders[0] : _navItems[_activeTabIdx];
  if (!item) return;
  _renderMasonry(uploadedAssets[item.imageId || item.id] || []);
}

function _renderFolderGrid(items) {
  const grid = document.getElementById('p-folder-grid');
  grid.innerHTML = items.map(item => {
    const assets = uploadedAssets[item.imageId || item.id] || [];
    const thumb  = assets[0]?.preview || '';
    const count  = assets.length;
    return `<div class="p-folder-card" data-folder-id="${item.id}">
      <div class="p-folder-card-thumb">
        ${thumb
          ? `<img src="${thumb}" alt="" decoding="async" loading="lazy">`
          : `<div class="p-folder-card-empty"><span class="msi">photo_library</span></div>`}
      </div>
      <div class="p-folder-card-info">
        <span class="p-folder-card-name">${item.name}</span>
        <span class="p-folder-card-count">${count > 0 ? `${count} foto${count !== 1 ? 's' : ''}` : 'Próximamente'}</span>
      </div>
    </div>`;
  }).join('');
  grid.querySelectorAll('.p-folder-card').forEach((card, i) => {
    card.addEventListener('click', () => _drillInto(items[i]));
  });
}

function _drillInto(folder) {
  _drillFolder = folder;
  document.getElementById('p-folder-grid').style.display     = 'none';
  document.getElementById('p-masonry').style.display         = '';
  document.getElementById('p-drill-back').style.display      = 'flex';
  document.getElementById('p-drill-folder-name').textContent = folder.name;
  _renderMasonry(uploadedAssets[folder.imageId || folder.id] || []);
}

function _drillBack() {
  _drillFolder = null;
  document.getElementById('p-masonry').style.display     = 'none';
  document.getElementById('p-folder-grid').style.display = '';
  document.getElementById('p-drill-back').style.display  = 'none';
  _renderFolderGrid(_navItems);
}

function _renderMasonry(rawAssets) {
  const masonry = document.getElementById('p-masonry');
  if (!masonry) return;

  if (rawAssets.length === 0) {
    masonry.innerHTML = `<div style="color:var(--g500);font-size:14px;padding:24px 0;font-family:var(--font-ui)">Las imágenes demo cargan en un momento…</div>`;
    return;
  }

  const assets = rawAssets.map(a => ({
    src: a.preview, ext: a.ext.toUpperCase(), size: a.sizeStr,
    name: a.name, originalUrl: a.originalUrl || a.preview,
  }));
  registerSection('portal', assets);

  const numCols = getNumCols();
  const cols    = Array.from({ length: numCols }, () => []);
  assets.forEach((a, i) => cols[i % numCols].push({ a, i }));

  masonry.innerHTML = cols.map(col =>
    `<div class="p-masonry-col">${col.map(({ a, i }) =>
      `<div class="p-img-card" data-idx="${i}">
        <img src="${a.src}" decoding="async" loading="lazy">
        <button class="p-dl-btn asset-dl" data-url="${a.originalUrl}" data-filename="${a.name}.${a.ext.toLowerCase()}">
          <span class="msi">download</span>
        </button>
      </div>`
    ).join('')}</div>`
  ).join('');

  masonry.querySelectorAll('.p-img-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.p-dl-btn')) return;
      _openLightbox(assets, parseInt(card.dataset.idx));
    });
  });
}

// ── Resize ────────────────────────────────────────────────────────────────────
function _attachPortalResize() {
  if (_portalResizeHandler) window.removeEventListener('resize', _portalResizeHandler);
  let _cols = getNumCols();
  _portalResizeHandler = () => {
    const next = getNumCols();
    if (next !== _cols) {
      _cols = next;
      if (_drillFolder) {
        _renderMasonry(uploadedAssets[_drillFolder.imageId || _drillFolder.id] || []);
      } else if (_navMode !== 'folder-grid') {
        _renderActiveItem();
      }
    }
  };
  window.addEventListener('resize', _portalResizeHandler);
}

// ── Face ID search ────────────────────────────────────────────────────────────
function initPortalSearch() {
  const input         = document.getElementById('p-search-input');
  const suggestionsEl = document.getElementById('p-search-suggestions');
  if (!input || !suggestionsEl) return;

  document.body.appendChild(suggestionsEl);

  let activeIdx = -1;
  function items() { return Array.from(suggestionsEl.querySelectorAll('.search-suggestion')); }
  function highlight(idx) { items().forEach((el, i) => el.classList.toggle('kb-active', i === idx)); activeIdx = idx; }
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
    positionDropdown(suggestionsEl, document.getElementById('p-search-wrap'));
    suggestionsEl.style.display = '';
    suggestionsEl.querySelectorAll('.search-suggestion').forEach((el, i) => {
      el.addEventListener('mousedown', e => { e.preventDefault(); select(matches[i]); });
    });
  });

  input.addEventListener('keydown', e => {
    const list = items();
    if (!list.length) return;
    if (e.key === 'ArrowDown')    { e.preventDefault(); highlight(Math.min(activeIdx + 1, list.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(Math.max(activeIdx - 1, 0)); }
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
  const active = document.querySelector('#portalScreen .face-chip-active:not(#p-dorsal-chip)');
  if (!active) return;
  const btn = document.createElement('button');
  btn.id = 'p-chip-faceid'; btn.className = 'p-filter-chip';
  btn.innerHTML = '<span class="msi xs">ar_on_you</span>Face ID';
  active.replaceWith(btn);
}

function _activeFacePortal(id, name, imgSrc) {
  _clearDorsalState();
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
  document.getElementById('p-active-chip-area').style.display = 'flex';
  _renderPortalFaceResults(id, name);
}

function _removeFacePortal() {
  _clearFacePortalChip();
  document.getElementById('p-active-chip-area').style.display = 'none';
  const results = document.getElementById('p-face-results');
  if (results) { results.style.display = 'none'; results.innerHTML = ''; }
  document.getElementById('p-content-section').style.display = '';
  _renderNavigation();
}

let _portalFaceAssets = [];
let _portalFaceName   = '';
let _portalFaceView   = 'grid';

function _renderPortalFaceResults(id, name) {
  const source = _portalFolders.flatMap(f => uploadedAssets[f.imageId || f.id] || []);
  const picks  = source.filter(a => a.faceIds && a.faceIds.includes(id));
  _portalFaceName   = name;
  _portalFaceView   = 'grid';
  _portalFaceAssets = picks.map(a => ({
    src: a.preview, ext: a.ext.toUpperCase(), size: a.sizeStr,
    name: a.name, originalUrl: a.originalUrl || a.preview,
  }));
  if (_portalFaceAssets.length > 0) registerSection('portal-faces', _portalFaceAssets);

  document.getElementById('p-tabs-section').style.display    = 'none';
  document.getElementById('p-content-section').style.display = 'none';

  const el = document.getElementById('p-face-results');
  if (!el) return;
  if (_portalFaceAssets.length === 0) {
    el.innerHTML = `<div class="face-results-header">No hay imágenes cargadas aún.</div>`;
  } else {
    _drawPortalFaceResults(el);
  }
  el.style.display = '';
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

// ── Dorsal search ─────────────────────────────────────────────────────────────
export function handleDorsalSearch() {
  const input = document.getElementById('p-dorsal-input');
  const val   = input?.value.trim();
  if (!val) return;
  input.value = '';

  _clearFacePortalChip();

  const chip = document.getElementById('p-dorsal-chip');
  if (chip) {
    chip.style.display = 'flex';
    chip.innerHTML =
      `<span class="msi xs" style="color:var(--g600)">tag</span>` +
      `<span class="face-chip-name">Dorsal #${val}</span>` +
      `<button class="face-chip-remove" onclick="clearDorsalSearch()"><span class="msi xs">close</span></button>`;
  }
  document.getElementById('p-active-chip-area').style.display = 'flex';
  document.getElementById('p-tabs-section').style.display    = 'none';
  document.getElementById('p-content-section').style.display = 'none';

  const allAssets = _portalFolders.flatMap(f => uploadedAssets[f.imageId || f.id] || []);
  const assets = allAssets.map(a => ({
    src: a.preview, ext: a.ext.toUpperCase(), size: a.sizeStr,
    name: a.name, originalUrl: a.originalUrl || a.preview,
  }));
  if (assets.length > 0) registerSection('portal-dorsal', assets);

  const el = document.getElementById('p-face-results');
  if (!el) return;
  if (assets.length === 0) {
    el.innerHTML = `<div class="face-results-header">No hay imágenes cargadas aún.</div>`;
  } else {
    el.innerHTML =
      `<div class="face-results-header-row">
        <div class="face-results-header"><span class="msi xs">tag</span>&nbsp;${assets.length} resultados para dorsal <strong>#${val}</strong></div>
      </div>
      <div class="face-results-grid">${assets.map((a, i) => assetCardHTML(a, 'portal-dorsal', i)).join('')}</div>`;
  }
  el.style.display = '';
}

function _clearDorsalState() {
  const chip = document.getElementById('p-dorsal-chip');
  if (chip) { chip.style.display = 'none'; chip.innerHTML = ''; }
}

export function clearDorsalSearch() {
  _clearDorsalState();
  document.getElementById('p-active-chip-area').style.display = 'none';
  const results = document.getElementById('p-face-results');
  if (results) { results.style.display = 'none'; results.innerHTML = ''; }
  document.getElementById('p-content-section').style.display = '';
  _renderNavigation();
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function _openLightbox(assets, idx) {
  _lbAssets = assets;
  _lbIdx    = idx;
  _lbUpdate();
  document.getElementById('p-lightbox').style.display = 'flex';
}

function _closeLightbox() {
  document.getElementById('p-lightbox').style.display = 'none';
}

function _lbUpdate() {
  const a = _lbAssets[_lbIdx];
  if (!a) return;
  document.getElementById('p-lb-img').src = a.src;
  const dlBtn = document.getElementById('p-lb-dl');
  dlBtn.dataset.url      = a.originalUrl;
  dlBtn.dataset.filename = `${a.name}.${a.ext.toLowerCase()}`;
  document.getElementById('p-lb-prev').disabled = false;
  document.getElementById('p-lb-next').disabled = false;
}

function _initPortalLightbox() {
  document.getElementById('p-lb-backdrop').addEventListener('click', _closeLightbox);
  document.getElementById('p-lb-close').addEventListener('click', _closeLightbox);
  document.getElementById('p-lb-prev').addEventListener('click', () => {
    _lbIdx = (_lbIdx - 1 + _lbAssets.length) % _lbAssets.length;
    _lbUpdate();
  });
  document.getElementById('p-lb-next').addEventListener('click', () => {
    _lbIdx = (_lbIdx + 1) % _lbAssets.length;
    _lbUpdate();
  });
  document.getElementById('p-lb-dl').addEventListener('click', () => {
    const btn = document.getElementById('p-lb-dl');
    const a = document.createElement('a');
    a.href = btn.dataset.url;
    a.download = btn.dataset.filename || 'download';
    a.click();
  });
  document.addEventListener('keydown', e => {
    if (document.getElementById('p-lightbox').style.display === 'none') return;
    if (e.key === 'ArrowLeft')  { _lbIdx = (_lbIdx - 1 + _lbAssets.length) % _lbAssets.length; _lbUpdate(); }
    if (e.key === 'ArrowRight') { _lbIdx = (_lbIdx + 1) % _lbAssets.length; _lbUpdate(); }
    if (e.key === 'Escape') _closeLightbox();
  });
}

// ── Animation ─────────────────────────────────────────────────────────────────
function _animatePortalIn() {
  const screen = document.getElementById('portalScreen');
  const blocks = [
    screen.querySelector('.p-header-section'),
    screen.querySelector('.p-tabs-section'),
    ...Array.from(screen.querySelectorAll('.p-section')),
  ].filter(Boolean);
  gsap.fromTo(blocks,
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.5, ease: 'power1.out', stagger: 0.25 }
  );
}

initPortalSearch();
_initPortalLightbox();
document.getElementById('p-drill-back-btn')?.addEventListener('click', _drillBack);
