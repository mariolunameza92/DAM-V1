// Exports: openPortal(), closePortal(), openPortalFromRow(), handleDorsalSearch(), clearDorsalSearch()
import { st, closeModal, getEditingRow, clearEditingRow } from './modal.js';
import { addToTable } from './table.js';
import { FOLDERS_DATA, FOLDER_IMAGES, findNode } from '../../data.js';
import { getNumCols, positionDropdown, generateShadeScale, hexToOklch } from '../../utils.js';
import { uploadedAssets } from '../../session.js';
import { registerSection, _registry } from '../shared/image-registry.js';
import { assetCardHTML, assetListRowHTML } from '../shared/asset-card.js';

let _portalFolders       = [];
let _activeTabIdx        = 0;
let _portalResizeHandler = null;
let _navMode             = 'masonry'; // 'masonry' | 'tabs' | 'folder-grid'
let _navItems            = [];
let _drillFolder         = null;
let _selfieUploaded      = false;
let _portalEntranceDone  = false; // entrance animation runs once per open (avoids re-render bounce)
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
function _pickSelfieShade(shades, isDark, primaryIdx) {
  const bgL = isDark ? 0.058 : 0.986;
  const dir  = isDark ? -1 : 1; // dark bg → go lighter; light bg → go darker
  for (let dist = 2; dist <= 5; dist++) {
    const idx = Math.max(0, Math.min(10, primaryIdx + dir * dist));
    const contrast = (Math.max(shades[idx].l, bgL) + 0.05) / (Math.min(shades[idx].l, bgL) + 0.05);
    if (contrast >= 3.5) return idx;
  }
  return Math.max(0, Math.min(10, primaryIdx + dir * 2));
}

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

  // Selfie button — auto-selected shade with guaranteed contrast, distinct from primary
  const selfieIdx = _pickSelfieShade(shades, isDark, isDark ? 5 : 6);
  const selfieSh  = shades[selfieIdx];
  const selfieHov = shades[Math.max(0, Math.min(10, selfieIdx + (isDark ? 1 : -1)))];
  el.style.setProperty('--portal-btn-selfie',      selfieSh.css);
  el.style.setProperty('--portal-btn-selfie-hover', selfieHov.css);
  el.style.setProperty('--portal-btn-selfie-text',  `oklch(${selfieSh.l >= 0.5 ? 0.15 : 0.99} 0 0)`);

  // Visor secondary buttons — shade-900 tinted, always dark context so icon always light
  const visorBtn = shades[9];
  el.style.setProperty('--visor-btn-bg',   `oklch(${visorBtn.l.toFixed(3)} ${visorBtn.c.toFixed(4)} ${H.toFixed(2)} / 0.72)`);
  el.style.setProperty('--visor-btn-icon', `oklch(${visorBtn.l >= 0.5 ? 0.15 : 0.95} 0 0)`);
}

// ── Public entry points ───────────────────────────────────────────────────────
export function openPortal() {
  const rawName = document.getElementById('inp-name').value.trim() || 'Mi Portal';
  const title   = rawName;
  const desc    = st.desc   || 'Selección de recursos para compartir';
  const accent  = st.accent;
  const theme   = st.theme || 'light';
  const font    = document.getElementById('font-sel').value;
  const logoSrc = document.getElementById('logo-img')?.src || '';
  const selected = FOLDERS_DATA.filter(f => st.selectedFolders.has(f.id));
  const folderIds = selected.map(f => f.id);
  const searchMethod = st.searchMethod || 'both';

  const editRow = getEditingRow();
  if (editRow) {
    // Persist changes to the row, then open the portal in a NEW TAB (consistent
    // with the table). Edit rows hold only title/accent/folders/theme — no
    // logo/font/desc — so the URL-based open loses nothing.
    editRow.dataset.portalAccent  = accent;
    editRow.dataset.portalTitle   = title;
    editRow.dataset.portalFolders = folderIds.join(',');
    editRow.dataset.portalTheme   = theme;
    editRow.dataset.portalSearch  = searchMethod;
    const nameEl = editRow.querySelector('.portal-name-cell');
    if (nameEl) nameEl.childNodes[nameEl.childNodes.length - 1].textContent = title;
    clearEditingRow();
    closeModal();
    const params = new URLSearchParams({ portal: '1', title, accent, folders: folderIds.join(','), theme, search: searchMethod });
    window.open(`${location.pathname}?${params}`, '_blank');
    return;
  }

  // Create flow: render in-app (preserves logo/font/desc that the URL can't carry).
  _renderPortal(title, desc, accent, theme, font, logoSrc, selected, searchMethod);
  closeModal();
  document.getElementById('portalScreen').classList.add('open');
  document.getElementById('appShell').style.display = 'none';
  addToTable(title, selected.length, selected.length * 4, accent, folderIds, undefined, false, searchMethod);
  _animatePortalIn();
  _attachPortalResize();
}

export function openPortalFromRow(title, accent, folderIds = [], theme = 'light', searchMethod = 'both') {
  const folders = folderIds.length > 0
    ? FOLDERS_DATA.filter(f => folderIds.includes(f.id))
    : FOLDERS_DATA;
  _renderPortal(title, 'Selección de recursos para compartir', accent, theme, 'Google Sans', '', folders, searchMethod);
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
  _portalEntranceDone = false; // next open animates fresh
  if (_portalResizeHandler) {
    window.removeEventListener('resize', _portalResizeHandler);
    _portalResizeHandler = null;
  }
}

// ── Core render ───────────────────────────────────────────────────────────────
function _applySearchMethod(method) {
  const ctas = document.getElementById('p-hero-ctas');
  if (!ctas) return;
  ctas.classList.remove('p-hero-ctas--faceid', 'p-hero-ctas--dorsal');
  if (method === 'faceid') ctas.classList.add('p-hero-ctas--faceid');
  else if (method === 'dorsal') ctas.classList.add('p-hero-ctas--dorsal');
}

function _renderPortal(title, desc, accent, theme, font, logoSrc, folders, searchMethod) {
  _portalFolders = folders;
  _activeTabIdx  = 0;

  const portalEl = document.getElementById('portalScreen');
  document.getElementById('p-hero-title').textContent = title;
  document.getElementById('p-hero-sub').textContent   = desc;
  portalEl.style.fontFamily = `'${font}', sans-serif`;
  _applyPortalTheme(portalEl, accent, theme);
  _applySearchMethod(searchMethod || 'both');

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
  _resetSelfie();
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
    // Subcarpeta con fotos propias → usa su id; si no, hereda el set del padre.
    imageId: FOLDER_IMAGES[child.id] ? child.id : (parent?.imageId || folderId),
  }));
}

// Assets de una carpeta de portal: los propios + los de todas sus subcarpetas
// (recursivo). La búsqueda Face ID/dorsal debe abarcar todo el árbol.
function _collectAssets(folder) {
  const out  = [...(uploadedAssets[folder.imageId || folder.id] || [])];
  const node = findNode(folder.id);
  const walk = children => {
    for (const c of children || []) {
      out.push(...(uploadedAssets[c.id] || []));
      walk(c.children);
    }
  };
  if (node) walk(node.children);
  return out;
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
    const count  = assets.length;
    // 2×2 mosaic: 4 cells — fill with the first photos, empty cells get a placeholder tint
    const cells = Array.from({ length: 4 }, (_, i) => {
      const src = assets[i]?.preview;
      return src
        ? `<div class="p-fc-cell"><img src="${src}" alt="" decoding="async" loading="lazy"></div>`
        : `<div class="p-fc-cell p-fc-cell--empty"></div>`;
    }).join('');
    return `<div class="p-folder-card" data-folder-id="${item.id}">
      <div class="p-folder-card-mosaic">
        ${count > 0 ? cells : `<div class="p-folder-card-empty"><span class="msi">photo_library</span></div>`}
      </div>
      <div class="p-folder-card-info">
        <span class="p-folder-card-name">${item.name}</span>
        <span class="p-folder-card-count">${count > 0 ? `<span class="msi xs">image</span>${count}` : 'Próximamente'}</span>
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

// ── Selfie & search ───────────────────────────────────────────────────────────
function _resetSelfie() {
  const img    = document.getElementById('p-selfie-img');
  const avatar = document.getElementById('p-selfie-avatar');
  const btn    = document.getElementById('p-selfie-btn');
  if (img)    img.src = '';
  if (avatar) avatar.style.display = 'none';
  if (btn)    btn.style.display    = '';
  _selfieUploaded = false;
}

function _restorePortalDefault() {
  const results = document.getElementById('p-face-results');
  if (results) { results.style.display = 'none'; results.innerHTML = ''; }
  document.getElementById('p-content-section').style.display = '';
  _renderNavigation();
}

function _removeSelfieSearch() {
  _resetSelfie();
  _clearDorsalState();
  _restorePortalDefault();
}

function _searchBySelfie() {
  _clearDorsalState();
  document.getElementById('p-tabs-section').style.display     = 'none';
  document.getElementById('p-content-section').style.display  = 'none';

  const allAssets = _portalFolders.flatMap(_collectAssets);
  const assets = allAssets.map(a => ({
    src: a.preview, ext: a.ext.toUpperCase(), size: a.sizeStr,
    name: a.name, originalUrl: a.originalUrl || a.preview,
  }));
  if (assets.length > 0) registerSection('portal-faces', assets);

  const el = document.getElementById('p-face-results');
  if (!el) return;
  el.innerHTML = assets.length === 0
    ? `<div class="face-results-header">No hay imágenes cargadas aún.</div>`
    : `<div class="face-results-header-row">
        <div class="face-results-header"><span class="msi xs">ar_on_you</span>&nbsp;${assets.length} resultado${assets.length !== 1 ? 's' : ''} encontrados</div>
       </div>
       <div class="face-results-grid">${assets.map((a, i) => assetCardHTML(a, 'portal-faces', i)).join('')}</div>`;
  el.style.display = '';
}

// Combined selfie + dorsal: keeps both the selfie avatar and the dorsal input
// (with its clear X) visible, and labels results with both icons joined by "+".
function _searchCombined(val) {
  const clearBtn = document.getElementById('p-dorsal-clear');
  if (clearBtn) clearBtn.style.display = 'flex';
  document.getElementById('p-dorsal-wrap')?.classList.add('has-clear');

  document.getElementById('p-tabs-section').style.display    = 'none';
  document.getElementById('p-content-section').style.display = 'none';

  const allAssets = _portalFolders.flatMap(_collectAssets);
  const assets = allAssets.map(a => ({
    src: a.preview, ext: a.ext.toUpperCase(), size: a.sizeStr,
    name: a.name, originalUrl: a.originalUrl || a.preview,
  }));
  if (assets.length > 0) registerSection('portal-faces', assets);

  const el = document.getElementById('p-face-results');
  if (!el) return;
  el.innerHTML = assets.length === 0
    ? `<div class="face-results-header">No hay imágenes cargadas aún.</div>`
    : `<div class="face-results-header-row">
        <div class="face-results-header"><span class="msi xs">ar_on_you</span>&nbsp;+&nbsp;<span class="msi xs">scoreboard</span>&nbsp;${assets.length} resultado${assets.length !== 1 ? 's' : ''} para dorsal <strong>#${val}</strong></div>
       </div>
       <div class="face-results-grid">${assets.map((a, i) => assetCardHTML(a, 'portal-faces', i)).join('')}</div>`;
  el.style.display = '';
}

export function handlePortalSearch() {
  const dorsalVal = document.getElementById('p-dorsal-input')?.value.trim();
  if (dorsalVal && _selfieUploaded) _searchCombined(dorsalVal);
  else if (dorsalVal)               handleDorsalSearch();
  else if (_selfieUploaded)         _searchBySelfie();
}

// Re-render the portal after demo images finish loading WITHOUT discarding an
// active selfie/dorsal search. main.js calls openPortalFromRow twice (once
// before images load, once after); the second pass used to reset the selfie.
export function refreshPortalImages() {
  const results = document.getElementById('p-face-results');
  const searchActive = results && results.style.display !== 'none' && results.innerHTML.length > 0;
  if (!searchActive) { _renderNavigation(); return; }
  const dorsalVal = document.getElementById('p-dorsal-input')?.value.trim();
  if (dorsalVal && _selfieUploaded) _searchCombined(dorsalVal);
  else if (dorsalVal)               handleDorsalSearch();
  else if (_selfieUploaded)         _searchBySelfie();
}

function _initSelfieSearch() {
  const selfieBtn    = document.getElementById('p-selfie-btn');
  const selfieFile   = document.getElementById('p-selfie-file');
  const selfieAvatar = document.getElementById('p-selfie-avatar');
  const selfieRemove = document.getElementById('p-selfie-remove');
  const buscarBtn    = document.getElementById('p-buscar-btn');

  selfieBtn?.addEventListener('click', () => selfieFile?.click());

  selfieFile?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    document.getElementById('p-selfie-img').src = URL.createObjectURL(file);
    selfieBtn.style.display    = 'none';
    selfieAvatar.style.display = 'flex';
    _selfieUploaded = true;
    selfieFile.value = '';
  });

  selfieRemove?.addEventListener('click', _removeSelfieSearch);
  buscarBtn?.addEventListener('click', handlePortalSearch);

  document.getElementById('p-dorsal-clear')?.addEventListener('click', clearDorsalSearch);
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
  const source = _portalFolders.flatMap(_collectAssets);
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

  _resetSelfie();
  const clearBtn = document.getElementById('p-dorsal-clear');
  if (clearBtn) clearBtn.style.display = 'flex';
  document.getElementById('p-dorsal-wrap')?.classList.add('has-clear');

  document.getElementById('p-tabs-section').style.display    = 'none';
  document.getElementById('p-content-section').style.display = 'none';

  const allAssets = _portalFolders.flatMap(_collectAssets);
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
        <div class="face-results-header"><span class="msi xs">scoreboard</span>&nbsp;${assets.length} resultados para dorsal <strong>#${val}</strong></div>
      </div>
      <div class="face-results-grid">${assets.map((a, i) => assetCardHTML(a, 'portal-dorsal', i)).join('')}</div>`;
  }
  el.style.display = '';
}

function _clearDorsalState() {
  const input = document.getElementById('p-dorsal-input');
  if (input) input.value = '';
  const clearBtn = document.getElementById('p-dorsal-clear');
  if (clearBtn) clearBtn.style.display = 'none';
  document.getElementById('p-dorsal-wrap')?.classList.remove('has-clear');
}

export function clearDorsalSearch() {
  _clearDorsalState();
  _resetSelfie();
  _restorePortalDefault();
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
  document.getElementById('p-face-results')?.addEventListener('click', e => {
    if (e.target.closest('.asset-dl')) return;
    const card = e.target.closest('.asset-card[data-section], .file-row[data-section]');
    if (!card) return;
    const assets = _registry.get(card.dataset.section) || [];
    const idx = +card.dataset.idx;
    if (assets[idx]) _openLightbox(assets, idx);
  });
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
// Runs once per open. The portal re-renders when demo images finish loading;
// guarding here prevents that second render from re-triggering the entrance
// (which reset blocks to y:16 → the visible "bounce").
function _animatePortalIn() {
  if (_portalEntranceDone) return;
  _portalEntranceDone = true;
  const screen = document.getElementById('portalScreen');
  const blocks = [
    screen.querySelector('.p-header-section'),
    screen.querySelector('.p-tabs-section'),
    ...Array.from(screen.querySelectorAll('.p-section')),
  ].filter(Boolean);
  gsap.fromTo(blocks,
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.08 }
  );
}

_initSelfieSearch();
_initPortalLightbox();
document.getElementById('p-drill-back-btn')?.addEventListener('click', _drillBack);
