// Exports: renderInicio(), initFaceFilters(), initSearch(), typingWelcome(), initSectionReveal()
import { INICIO_FOLDER_IDS, findNode } from '../../data.js';
import { uploadedAssets, userUploadedAssets } from '../../session.js';
import { folderSVG, getNumCols, positionDropdown } from '../../utils.js';
import { thumbsHTML, folderListRowHTML } from '../shared/folder-card.js';
import { registerSection } from '../shared/image-registry.js';
import { assetCardHTML, assetListRowHTML } from '../shared/asset-card.js';
import { bindStaticToggle, viewToggleHTML, bindDynamicToggle } from '../../components/ui/view-toggle.js';
import { getFavoriteFaces, subscribe as subscribeFaces } from '../../faces.js';

let _inicioFoldersView = 'grid';
let _inicioAssetsView  = 'grid';

// ── Section reveal ───────────────────────────────────────────────────────────
export function initSectionReveal() {
  const sec = document.getElementById('sec-inicio');
  const blocks = [
    sec.querySelector('.inicio-hero'),
    sec.querySelector('.face-stats-row'),
    ...Array.from(sec.querySelectorAll('.inicio-section')),
  ].filter(Boolean);

  blocks.forEach((el, i) => {
    setTimeout(() => el.classList.add('inicio-reveal'), i * 250);
  });
}

// ── Typing effect ─────────────────────────────────────────────────────────────
export function typingWelcome() {
  const el = document.querySelector('.inicio-welcome');
  if (!el) return;
  const text = el.textContent.trim();

  el.innerHTML = Array.from(text).map(c =>
    c === ' ' ? ' ' : `<span class="typing-char">${c}</span>`
  ).join('');

  // Desvela el contenedor — los chars individuales siguen en opacity:0
  el.style.opacity = '1';

  const spans = el.querySelectorAll('.typing-char');
  spans.forEach((span, i) => {
    setTimeout(() => span.classList.add('typing-visible'), i * 25 + Math.random() * 10);
  });
}

function _renderInicioFolders() {
  const fr = document.getElementById('inicio-folders');
  if (!fr) return;

  if (_inicioFoldersView === 'grid') {
    fr.innerHTML = INICIO_FOLDER_IDS.map(id => {
      const node = findNode(id);
      if (!node) return '';
      return `<div class="folder-card" onclick="window.goToCarpeta('${id}')">
        <div class="folder-vis">
          ${folderSVG()}
          <div class="folder-thumbs">${thumbsHTML(id)}</div>
        </div>
        <div class="folder-name">${node.label}</div>
      </div>`;
    }).join('');
  } else {
    fr.innerHTML = `<div class="folder-list">${INICIO_FOLDER_IDS.map(id => {
      const node = findNode(id);
      if (!node) return '';
      return folderListRowHTML(id, node.label, `onclick="window.goToCarpeta('${id}')"`);
    }).join('')}</div>`;
  }
}

function _renderInicioAssets() {
  const ma = document.getElementById('inicio-assets');
  if (!ma) return;

  const allAssets = [
    ...Object.values(uploadedAssets).flat(),
    ...Object.values(userUploadedAssets).flat(),
  ];

  if (allAssets.length === 0) { ma.innerHTML = ''; return; }

  const normalizedAssets = allAssets.map(a => ({
    src: a.preview,
    ext: a.ext.toUpperCase(),
    size: a.sizeStr,
    name: a.name,
    originalUrl: a.originalUrl || a.preview,
    faceIds: a.faceIds || [],
    modTime: a.modTime || null,
  }));
  registerSection('inicio-main', normalizedAssets);

  if (_inicioAssetsView === 'grid') {
    const numCols = getNumCols();
    const colData = Array.from({ length: numCols }, () => []);
    normalizedAssets.forEach((a, i) => colData[i % numCols].push({ a, i }));
    ma.innerHTML = colData.map(col =>
      `<div class="masonry-col">${col.map(({ a, i }) => assetCardHTML(a, 'inicio-main', i)).join('')}</div>`
    ).join('');
  } else {
    ma.innerHTML = `<div class="file-list">${normalizedAssets.map((a, i) => assetListRowHTML(a, 'inicio-main', i)).join('')}</div>`;
  }
}

export function renderInicio() {
  _renderInicioFolders();
  _renderInicioAssets();
}

// ── View toggle wiring ────────────────────────────────────────────────────────
bindStaticToggle('inicio-folders-grid', 'inicio-folders-list', () => _inicioFoldersView, v => { _inicioFoldersView = v; _renderInicioFolders(); });
bindStaticToggle('inicio-assets-grid',  'inicio-assets-list',  () => _inicioAssetsView,  v => { _inicioAssetsView  = v; _renderInicioAssets();  });

// ── Search autocomplete ───────────────────────────────────────────────────────
export function initSearch() {
  const input = document.getElementById('inicio-search-input');
  const suggestionsEl = document.getElementById('search-suggestions');
  if (!input || !suggestionsEl) return;

  // Mueve el dropdown al <body> para escapar cualquier transform/overflow ancestor
  document.body.appendChild(suggestionsEl);

  const faces = Array.from(document.querySelectorAll('.face-av[data-face-id]')).map(el => ({
    id: el.dataset.faceId,
    name: el.dataset.faceName,
    imgSrc: el.querySelector('img')?.src,
  }));

  let activeIdx = -1;

  function items() { return Array.from(suggestionsEl.querySelectorAll('.search-suggestion')); }

  function highlight(idx) {
    items().forEach((el, i) => el.classList.toggle('kb-active', i === idx));
    activeIdx = idx;
  }

  function hide() {
    suggestionsEl.style.display = 'none';
    suggestionsEl.innerHTML = '';
    activeIdx = -1;
  }

  function select(face) {
    input.value = '';
    hide();
    _pushToRecents(face.id);
    _activeFaceFilter(face.id, face.name, face.imgSrc);
  }

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { hide(); return; }
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
    positionDropdown(suggestionsEl, input.closest('.inicio-search-wrap') || input.parentElement);
    suggestionsEl.style.display = '';

    suggestionsEl.querySelectorAll('.search-suggestion').forEach((el, i) => {
      el.addEventListener('mousedown', e => { e.preventDefault(); select(matches[i]); });
    });
  });

  input.addEventListener('keydown', e => {
    const list = items();
    if (!list.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlight(Math.min(activeIdx + 1, list.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlight(Math.max(activeIdx - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = activeIdx >= 0 ? activeIdx : 0;
      const faceId = list[idx]?.dataset.faceId;
      const face = faces.find(f => f.id === faceId);
      if (face) select(face);
    } else if (e.key === 'Escape') {
      input.value = '';
      hide();
    }
  });

  input.addEventListener('blur', () => setTimeout(hide, 150));
}

// ── Face ID filter ────────────────────────────────────────────────────────────
let _activeFaceId = null;

const _AV_W    = 54;    // face-av width px
const _AV_STEP = 40.3;  // effective step after negative margin overlap
const _STRIP_PAD = 24;  // 12px * 2 sides

function _trimFaceStrips() {
  const strips = Array.from(document.querySelectorAll('#sec-inicio .face-strip'));
  if (!strips.length) return;

  // Measure the face-group (parent), not the strip — strip is align-self:flex-start so its
  // clientWidth reflects only current visible avatars, not available space
  const innerW = strips[0].parentElement.clientWidth - _STRIP_PAD;
  if (innerW <= 0) return;

  // Max avatars that fit: (N-1)*step + AV_W ≤ innerW
  const maxFit = Math.max(1, Math.floor((innerW - _AV_W) / _AV_STEP) + 1);

  // Collect real avatars per strip
  const data = strips.map(strip => ({
    strip,
    avatars: Array.from(strip.querySelectorAll('.face-av:not(.face-av-more)')),
  }));

  // Decide the SHARED visible count so both strips grow/shrink in sync
  const maxTotal     = Math.max(...data.map(d => d.avatars.length));
  const needsClip    = maxTotal > maxFit;
  const sharedVisible = needsClip ? Math.max(1, maxFit - 1) : Infinity;

  data.forEach(({ strip, avatars }) => {
    strip.querySelector('.face-av-more')?.remove();

    if (!needsClip || avatars.length <= sharedVisible) {
      avatars.forEach(av => { av.style.display = ''; });
      return;
    }

    const hidden = avatars.length - sharedVisible;
    avatars.forEach((av, i) => { av.style.display = i < sharedVisible ? '' : 'none'; });

    const more = document.createElement('div');
    more.className   = 'face-av face-av-more';
    more.textContent = `+${hidden}`;
    more.title       = `${hidden} personas más`;
    strip.appendChild(more);
  });
}

let _trimDebounce = null;

// Strip "Face ID Favoritos" del home — renderizado dinámico desde el store compartido
// (js/faces.js) para que marcar/desmarcar en la sección Face IDs se refleje aquí.
function _escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function renderHomeFavorites() {
  const sec = document.getElementById('sec-inicio');
  const strip = sec?.querySelector('.face-strip'); // primer .face-strip = Favoritos
  if (!strip) return;
  strip.innerHTML = getFavoriteFaces().map(f =>
    `<div class="face-av" data-face-id="${f.id}" data-face-name="${_escAttr(f.displayName)}"><img src="${f.selfieUrl}" alt=""></div>`
  ).join('');
}

export function initFaceFilters() {
  renderHomeFavorites();

  const sec = document.getElementById('sec-inicio');
  const strips = sec.querySelectorAll('.face-strip');
  const favoritosStrip = strips[0];
  const recientesStrip = strips[1];

  sec.addEventListener('click', e => {
    const av = e.target.closest('.face-av[data-face-id]');
    if (!av) return;

    const fromFavoritos = favoritosStrip?.contains(av);
    const fromRecientes = recientesStrip?.contains(av);
    if (!fromFavoritos && !fromRecientes) return;

    const { faceId, faceName } = av.dataset;
    const imgSrc = av.querySelector('img')?.src;

    if (_activeFaceId === faceId) { _removeFaceFilter(); return; }

    _activeFaceFilter(faceId, faceName, imgSrc);
  });

  _trimFaceStrips();

  // Re-render cuando cambian los favoritos en la sección Face IDs (sync cross-feature).
  subscribeFaces(() => { renderHomeFavorites(); _trimFaceStrips(); });

  window.addEventListener('resize', () => {
    clearTimeout(_trimDebounce);
    _trimDebounce = setTimeout(_trimFaceStrips, 150);
  });
}

function _pushToRecents(id) {
  const strips = document.querySelectorAll('.face-strip');
  const recientes = strips[1];
  if (!recientes) return;

  // Source: look in favoritos strip (strips[0]) to avoid cloning a hidden duplicate
  const source = strips[0].querySelector(`.face-av[data-face-id="${id}"]`)
               || document.querySelector(`.face-av[data-face-id="${id}"]`);
  if (!source) return;
  const clone = source.cloneNode(true);
  clone.style.display = ''; // ensure visible regardless of trim state

  recientes.querySelector(`.face-av[data-face-id="${id}"]`)?.remove();
  recientes.querySelector('.face-av-more')?.remove(); // remove bubble before prepend

  clone.classList.add('face-av-recent');
  clone.addEventListener('animationend', () => clone.classList.remove('face-av-recent'), { once: true });
  recientes.prepend(clone);

  // Keep DOM lean — max 20 real avatars in recientes
  const all = Array.from(recientes.querySelectorAll('.face-av:not(.face-av-more)'));
  if (all.length > 20) all[all.length - 1].remove();

  _trimFaceStrips();
}

export function activateFaceFilter(id, name, imgSrc) { _activeFaceFilter(id, name, imgSrc); }

function _activeFaceFilter(id, name, imgSrc) {
  _activeFaceId = id;

  const target = document.getElementById('chip-faceid') || document.querySelector('.face-chip-active');
  const chip = document.createElement('div');
  chip.className = 'face-chip-active';
  chip.innerHTML =
    `<div class="face-chip-avatar"><img src="${imgSrc}" alt="${name}"></div>` +
    `<span class="face-chip-name">${name}</span>` +
    `<button class="face-chip-remove" aria-label="Quitar filtro"><span class="msi xs">close</span></button>`;
  chip.querySelector('.face-chip-remove').addEventListener('click', _removeFaceFilter);
  target.replaceWith(chip);

  const sec = document.getElementById('sec-inicio');
  sec.querySelector('.face-stats-row').style.display = 'none';
  sec.querySelectorAll('.inicio-section').forEach(el => { el.style.display = 'none'; });

  _renderFaceResults(id, name);
}

function _removeFaceFilter() {
  _activeFaceId = null;
  const chip = document.querySelector('.face-chip-active');
  const faceIdChip = document.createElement('button');
  faceIdChip.id = 'chip-faceid';
  faceIdChip.className = 'filter-chip';
  faceIdChip.innerHTML = '<span class="msi sm">ar_on_you</span>Face ID';
  chip.replaceWith(faceIdChip);
  const el = document.getElementById('face-filter-results');
  if (el) { el.style.display = 'none'; el.innerHTML = ''; }

  const sec = document.getElementById('sec-inicio');
  sec.querySelector('.face-stats-row').style.display = '';
  sec.querySelectorAll('.inicio-section').forEach(el => { el.style.display = ''; });
}

let _faceResultsAssets = [];
let _faceResultsName   = '';
let _faceResultsView   = 'grid';

function _renderFaceResults(id, name) {
  const el = document.getElementById('face-filter-results');
  if (!el) return;

  const all = [...Object.values(uploadedAssets).flat(), ...Object.values(userUploadedAssets).flat()];
  const picks = all.filter(a => a.faceIds && a.faceIds.includes(id));

  if (picks.length === 0) {
    el.innerHTML = `<p class="face-results-header">No hay imágenes cargadas aún.</p>`;
    el.style.display = '';
    return;
  }

  _faceResultsName   = name;
  _faceResultsView   = 'grid';
  _faceResultsAssets = picks.map(a => ({
    src: a.preview, ext: a.ext.toUpperCase(),
    size: a.sizeStr, name: a.name, originalUrl: a.originalUrl || a.preview,
    faceIds: a.faceIds,
    modTime: a.modTime || null,
  }));
  registerSection('inicio-faces', _faceResultsAssets);

  _drawFaceResults(el);
  el.style.display = '';
}

function _drawFaceResults(el) {
  const assets = _faceResultsAssets;
  const name   = _faceResultsName;

  const contentHTML = _faceResultsView === 'grid'
    ? `<div class="face-results-grid">${assets.map((a, i) => assetCardHTML(a, 'inicio-faces', i)).join('')}</div>`
    : `<div class="file-list">${assets.map((a, i) => assetListRowHTML(a, 'inicio-faces', i)).join('')}</div>`;

  el.innerHTML =
    `<div class="face-results-header-row">
      <div class="face-results-header"><span class="msi xs">ar_on_you</span>&nbsp;${assets.length} resultados para <strong>${name}</strong></div>
      ${viewToggleHTML(_faceResultsView)}
    </div>` + contentHTML;

  bindDynamicToggle(el, v => { _faceResultsView = v; _drawFaceResults(el); });
}
