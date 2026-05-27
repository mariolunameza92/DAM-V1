// Exports: renderInicio(), initFaceFilters()
import { INICIO_FOLDER_IDS, findNode } from '../../data.js';
import { uploadedAssets, userUploadedAssets } from '../../session.js';
import { folderSVG } from '../../utils.js';
import { thumbsHTML } from '../shared/folder-card.js';

const NUM_COLS = 4;

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

  const colData = Array.from({ length: NUM_COLS }, () => []);
  allAssets.forEach((a, i) => colData[i % NUM_COLS].push(a));

  ma.innerHTML = colData.map(col =>
    `<div class="masonry-col">${col.map(a =>
      `<div class="asset-card">
        <img src="${a.preview}" decoding="async" style="width:100%;display:block;border-radius:8px">
        <div class="asset-dl" data-url="${a.originalUrl || a.preview}" data-filename="${a.name}.${a.ext.toLowerCase()}"><span class="msi sm">download</span></div>
        <div class="asset-hover">
          <div class="asset-name">${a.name}</div>
          <div class="asset-meta"><span>${a.ext.toUpperCase()}</span><span>${a.sizeStr}</span></div>
        </div>
      </div>`
    ).join('')}</div>`
  ).join('');
}

// ── Face ID filter ────────────────────────────────────────────────────────────
let _activeFaceId = null;

export function initFaceFilters() {
  document.querySelectorAll('.face-av[data-face-id]').forEach(av => {
    av.addEventListener('click', () => {
      const { faceId, faceName } = av.dataset;
      const imgSrc = av.querySelector('img')?.src;
      if (_activeFaceId === faceId) { _removeFaceFilter(); return; }
      _activeFaceFilter(faceId, faceName, imgSrc);
    });
  });
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
}

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

  el.innerHTML =
    `<div class="face-results-header"><span class="msi xs">ar_on_you</span>&nbsp;${picks.length} resultados para <strong>${name}</strong></div>` +
    `<div class="face-results-grid">${picks.map(a =>
      `<div class="asset-card">
        <img src="${a.preview}" decoding="async" style="width:100%;display:block;border-radius:8px">
        <div class="asset-dl" data-url="${a.originalUrl || a.preview}" data-filename="${a.name}.${a.ext.toLowerCase()}"><span class="msi sm">download</span></div>
        <div class="asset-hover">
          <div class="asset-name">${a.name}</div>
          <div class="asset-meta"><span>${a.ext.toUpperCase()}</span><span>${a.sizeStr}</span></div>
        </div>
      </div>`
    ).join('')}</div>`;
  el.style.display = '';
}
