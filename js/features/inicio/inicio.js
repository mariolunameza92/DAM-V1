// Exports: renderInicio() — renderiza carpetas recientes y archivos recientes en la sección Inicio
// Lógica "archivos recientes": cuando exista el feature de abrir imagen, mostrar los últimos vistos.
// Por ahora usa todas las imágenes disponibles en uploadedAssets (carpetas creadas + compartidas).
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
