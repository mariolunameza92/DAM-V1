// Exports: openPortal(), closePortal(), openPortalFromRow(), handleDorsalSearch(), clearDorsalSearch()
import { st, closeModal } from './modal.js';
import { addToTable } from './table.js';
import { FOLDERS_DATA } from '../../data.js';
import { getNumCols, positionDropdown } from '../../utils.js';
import { uploadedAssets } from '../../session.js';
import { registerSection } from '../shared/image-registry.js';
import { assetCardHTML, assetListRowHTML } from '../shared/asset-card.js';

let _portalFolders      = [];
let _activeTabIdx       = 0;
let _portalResizeHandler = null;

// ── OKLCH accent system ───────────────────────────────────────────────────────
function hexToOklch(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return { L: 0.20, C: 0.02, H: 240 };

  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const lin = v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  const rl = lin(r), gl = lin(g), bl = lin(b);

  const X = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl;
  const Y = 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl;
  const Z = 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl;

  const lms  = v => Math.sign(v) * Math.pow(Math.abs(v), 1 / 3);
  const l_ = lms(0.8189330101 * X + 0.3618667424 * Y - 0.1288597137 * Z);
  const m_ = lms(0.0329845436 * X + 0.9293118715 * Y + 0.0361456387 * Z);
  const s_ = lms(0.0482003018 * X + 0.2643662691 * Y + 0.6338517070 * Z);

  const La = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a  = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bk = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  const C = Math.sqrt(a * a + bk * bk);
  let H = (Math.atan2(bk, a) * 180 / Math.PI) % 360;
  if (H < 0) H += 360;
  return { L: La, C, H };
}

function _applyPortalTheme(el, accentHex, theme) {
  el.dataset.theme = theme || 'light';

  let { L, C, H } = hexToOklch(accentHex || '#22252f');

  // Ensure accent is visible against the theme background
  if (theme === 'dark') {
    if (L < 0.55) {
      L = 0.65;
      C = Math.max(C, 0.10); // chroma floor: ensures visible color, not just gray
    }
  } else {
    if (L > 0.80) L = 0.70;
  }

  // Text on accent: light text for dark accent, dark text for light accent
  const textL = L >= 0.62 ? 0.15 : 0.99;

  el.style.setProperty('--brand-l', L.toFixed(4));
  el.style.setProperty('--brand-c', C.toFixed(4));
  el.style.setProperty('--brand-h', H.toFixed(2));
  el.style.setProperty('--brand-text-l', textL.toFixed(2));
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
  addToTable(title, selected.length, selected.length * 4, accent, selected.map(f => f.id));
  _animatePortalIn();
  _attachPortalResize();
}

export function openPortalFromRow(title, accent, folderIds = []) {
  const folders = folderIds.length > 0
    ? FOLDERS_DATA.filter(f => folderIds.includes(f.id))
    : FOLDERS_DATA;
  _renderPortal(title, 'Selección de recursos para compartir', accent, 'light', 'Google Sans', '', folders);
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

  const logoArea = portalEl.querySelector('#p-header-logo');
  const logoImg  = portalEl.querySelector('#p-logo-img');
  if (logoSrc && logoSrc !== window.location.href && logoArea && logoImg) {
    logoImg.src = logoSrc;
    logoArea.style.display = 'block';
  } else if (logoArea) {
    logoArea.style.display = 'none';
  }

  _clearFacePortalChip();
  _clearDorsalState();
  document.getElementById('p-face-results').style.display = 'none';
  document.getElementById('p-face-results').innerHTML     = '';
  document.getElementById('p-active-chip-area').style.display = 'none';
  document.getElementById('p-content-section').style.display  = '';

  _renderTabs();
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function _renderTabs() {
  const tabsSection = document.getElementById('p-tabs-section');
  const tabsBar     = document.getElementById('p-tabs-bar');

  if (_portalFolders.length <= 1) {
    tabsSection.style.display = 'none';
    const folder = _portalFolders[0];
    const assets = folder ? (uploadedAssets[folder.imageId || folder.id] || []) : [];
    _renderMasonry(assets);
    return;
  }

  tabsSection.style.display = '';
  tabsBar.innerHTML = _portalFolders.map((f, i) =>
    `<button class="p-tab${i === 0 ? ' active' : ''}" data-tab-idx="${i}">${f.name}</button>`
  ).join('');

  tabsBar.querySelectorAll('.p-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.tabIdx);
      if (idx === _activeTabIdx) return;
      _activeTabIdx = idx;
      tabsBar.querySelectorAll('.p-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _renderActiveTab();
    });
  });

  _renderActiveTab();
}

function _renderActiveTab() {
  const folder = _portalFolders[_activeTabIdx];
  if (!folder) return;
  const assets = uploadedAssets[folder.imageId || folder.id] || [];
  _renderMasonry(assets);
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

// ── Resize ────────────────────────────────────────────────────────────────────
function _attachPortalResize() {
  if (_portalResizeHandler) window.removeEventListener('resize', _portalResizeHandler);
  let _cols = getNumCols();
  _portalResizeHandler = () => {
    const next = getNumCols();
    if (next !== _cols) { _cols = next; _renderActiveTab(); }
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
  _renderTabs();
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
  _renderTabs();
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
