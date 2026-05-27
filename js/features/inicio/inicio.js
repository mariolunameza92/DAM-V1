// Exports: renderInicio() — renderiza carpetas recientes y archivos recientes en la sección Inicio
import { INICIO_FOLDER_IDS, INICIO_ASSETS, findNode } from '../../data.js';
import { folderSVG } from '../../utils.js';
import { thumbsHTML } from '../shared/folder-card.js';

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
  if (ma) {
    ma.innerHTML = INICIO_ASSETS.map(col =>
      `<div class="masonry-col">${col.map(a =>
        `<div class="asset-card" style="height:${a.h}px">
          <div style="width:100%;height:100%;background:${a.g};border-radius:8px"></div>
          <div class="asset-hover">
            <div class="asset-name">${a.name}</div>
            <div class="asset-meta"><span>${a.type}</span><span>${a.size}</span></div>
          </div>
        </div>`
      ).join('')}</div>`
    ).join('');
  }
}
