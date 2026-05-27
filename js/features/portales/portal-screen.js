// Exports: openPortal(), closePortal(), openPortalFromRow()
import { st, closeModal } from './modal.js';
import { addToTable } from './table.js';
import { FOLDERS_DATA } from '../../data.js';
import { folderSVG } from '../../utils.js';
import { uploadedAssets } from '../../session.js';
import { thumbsHTML } from '../shared/folder-card.js';

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
}

export function openPortalFromRow(title, accent, folderIds = []) {
  const folders = folderIds.length > 0
    ? FOLDERS_DATA.filter(f => folderIds.includes(f.id))
    : FOLDERS_DATA;
  _renderPortal(title, 'Selección de recursos para compartir', accent, 'Google Sans', folders);
  document.getElementById('portalScreen').classList.add('open');
  document.getElementById('appShell').style.display = 'none';
}

function _renderPortal(title, desc, accent, font, folders) {
  document.getElementById('p-name').textContent       = title;
  document.getElementById('p-desc').textContent       = desc;
  document.getElementById('p-hero-title').textContent = title;
  document.getElementById('p-hero-sub').textContent   = desc;
  document.getElementById('p-logo-box').textContent   = title.charAt(0).toUpperCase();
  document.getElementById('p-logo-box').style.background = accent;
  document.getElementById('portalScreen').style.fontFamily = `'${font}', sans-serif`;

  // Folders — real thumbnails via shared folder-card
  document.getElementById('p-folders').innerHTML = folders.map(f =>
    `<div class="p-folder">
      <div class="folder-vis">
        ${folderSVG()}
        <div class="folder-thumbs">${thumbsHTML(f.imageId || f.id)}</div>
      </div>
      <div class="p-folder-name">${f.name}</div>
    </div>`
  ).join('');

  // Archivos masonry — real images from selected folders
  const allAssets = folders.flatMap(f => uploadedAssets[f.imageId || f.id] || []);
  const masonry = document.getElementById('p-masonry');
  if (!masonry) return;

  if (allAssets.length === 0) {
    masonry.innerHTML = `<div style="color:var(--g500);font-size:14px;padding:24px 0;font-family:var(--font-ui)">Las imágenes demo cargan en un momento…</div>`;
    return;
  }

  const NUM_COLS = 4;
  const cols = Array.from({ length: NUM_COLS }, () => []);
  allAssets.forEach((a, i) => cols[i % NUM_COLS].push(a));

  masonry.innerHTML = cols.map(col =>
    `<div class="masonry-col">${col.map(a =>
      `<div class="asset-card">
        <img src="${a.preview}" decoding="async" style="width:100%;display:block;border-radius:8px">
        <div class="asset-dl" data-url="${a.originalUrl || a.preview}" data-filename="${a.name}.${a.ext.toLowerCase()}">
          <span class="msi sm">download</span>
        </div>
        <div class="asset-hover">
          <div class="asset-name">${a.name}</div>
          <div class="asset-meta"><span>${a.ext.toUpperCase()}</span><span>${a.sizeStr}</span></div>
        </div>
      </div>`
    ).join('')}</div>`
  ).join('');
}

export function closePortal() {
  document.getElementById('portalScreen').classList.remove('open');
  document.getElementById('appShell').style.display = 'flex';
}
