// Exports: renderInicio(), initFaceFilters(), initSearch(), typingWelcome(), initSectionReveal()
import { INICIO_FOLDER_IDS, findNode } from '../../data.js';
import { uploadedAssets, userUploadedAssets } from '../../session.js';
import { folderSVG } from '../../utils.js';
import { thumbsHTML } from '../shared/folder-card.js';
import { registerSection } from '../shared/image-registry.js';
import { assetCardHTML } from '../shared/asset-card.js';

const NUM_COLS = 4;

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

export function renderInicio() {
  const fr = document.getElementById('inicio-folders');
  if (fr) {
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
  }

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
  }));
  registerSection('inicio-main', normalizedAssets);

  const colData = Array.from({ length: NUM_COLS }, () => []);
  normalizedAssets.forEach((a, i) => colData[i % NUM_COLS].push({ a, i }));

  ma.innerHTML = colData.map(col =>
    `<div class="masonry-col">${col.map(({ a, i }) => assetCardHTML(a, 'inicio-main', i)).join('')}</div>`
  ).join('');
}

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

  function positionDropdown() {
    const wrap = input.closest('.inicio-search-wrap') || input.parentElement;
    const rect = wrap.getBoundingClientRect();
    suggestionsEl.style.top = (rect.bottom + 8) + 'px';
    suggestionsEl.style.left = rect.left + 'px';
    suggestionsEl.style.width = rect.width + 'px';
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
    positionDropdown();
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

export function initFaceFilters() {
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

    // Clicks en favoritos o recientes solo activan el filtro.
    // Solo el buscador (initSearch) actualiza el strip de recientes.
    _activeFaceFilter(faceId, faceName, imgSrc);
  });
}

function _pushToRecents(id) {
  const strips = document.querySelectorAll('.face-strip');
  const recientes = strips[1];
  if (!recientes) return;

  // Captura source ANTES de eliminar, por si solo existe en recientes
  const source = document.querySelector(`.face-av[data-face-id="${id}"]`);
  if (!source) return;
  const clone = source.cloneNode(true);

  // Ahora sí elimina el existente en recientes (si lo hay)
  recientes.querySelector(`.face-av[data-face-id="${id}"]`)?.remove();

  clone.classList.add('face-av-recent');
  clone.addEventListener('animationend', () => clone.classList.remove('face-av-recent'), { once: true });
  recientes.prepend(clone);

  // Máximo 8 items en recientes
  const all = recientes.querySelectorAll('.face-av');
  if (all.length > 8) all[all.length - 1].remove();
}

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

  _renderFaceResults(name);
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

function _renderFaceResults(name) {
  const el = document.getElementById('face-filter-results');
  if (!el) return;

  const all = [...Object.values(uploadedAssets).flat(), ...Object.values(userUploadedAssets).flat()];
  const picks = all.sort(() => Math.random() - 0.5).slice(0, 3);

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
    : `<div class="p-file-list">${assets.map(a =>
        `<div class="p-file-row">
          <img class="p-file-thumb" src="${a.src}" decoding="async">
          <span class="p-file-name">${a.name}</span>
          <span class="p-file-ext">${a.ext}</span>
          <span class="p-file-size">${a.size}</span>
          <div class="asset-dl p-file-dl" data-url="${a.originalUrl}" data-filename="${a.name}.${a.ext.toLowerCase()}">
            <span class="msi sm">download</span>
          </div>
        </div>`
      ).join('')}</div>`;

  el.innerHTML =
    `<div class="face-results-header-row">
      <div class="face-results-header"><span class="msi xs">ar_on_you</span>&nbsp;${assets.length} resultados para <strong>${name}</strong></div>
      <div class="p-view-toggle">
        <button class="p-view-btn ${_faceResultsView === 'grid' ? 'active' : ''}" data-fv="grid"><span class="msi xs">grid_view</span></button>
        <button class="p-view-btn ${_faceResultsView === 'list' ? 'active' : ''}" data-fv="list"><span class="msi xs">lists</span></button>
      </div>
    </div>` + contentHTML;

  el.querySelectorAll('.p-view-btn[data-fv]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (_faceResultsView === btn.dataset.fv) return;
      _faceResultsView = btn.dataset.fv;
      _drawFaceResults(el);
    });
  });
}
