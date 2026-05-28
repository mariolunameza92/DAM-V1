// Exports: openPortal(), closePortal(), openPortalFromRow()
import { st, closeModal } from './modal.js';
import { addToTable } from './table.js';
import { FOLDERS_DATA } from '../../data.js';
import { folderSVG } from '../../utils.js';
import { uploadedAssets } from '../../session.js';
import { thumbsHTML } from '../shared/folder-card.js';
import { registerSection } from '../shared/image-registry.js';

let _portalFolders = [];
let _folderAssets  = [];
let _folderView    = 'grid';

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
  _portalFolders = folders;

  document.getElementById('p-hero-title').textContent = title;
  document.getElementById('p-hero-sub').textContent   = desc;
  document.getElementById('portalScreen').style.fontFamily = `'${font}', sans-serif`;

  _exitFolder(false);

  // Folders — real thumbnails via shared folder-card
  document.getElementById('p-folders').innerHTML = folders.map(f =>
    `<div class="p-folder" data-folder-id="${f.imageId || f.id}" data-folder-name="${f.name}">
      <div class="folder-vis">
        ${folderSVG()}
        <div class="folder-thumbs">${thumbsHTML(f.imageId || f.id)}</div>
      </div>
      <div class="p-folder-name">${f.name}</div>
    </div>`
  ).join('');

  _attachFolderClicks();

  // Archivos masonry — real images from all folders
  const allAssets = folders.flatMap(f => uploadedAssets[f.imageId || f.id] || []);
  _renderMasonry(allAssets);
}

function _attachFolderClicks() {
  document.querySelectorAll('#p-folders .p-folder').forEach(el => {
    el.addEventListener('click', () => {
      const folderId   = el.dataset.folderId;
      const folderName = el.dataset.folderName;
      _enterFolder(folderId, folderName);
    });
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

  document.getElementById('p-foldersTitle').textContent      = 'Carpetas';
  document.getElementById('p-foldersBack').style.display     = 'none';
  document.getElementById('p-folders').style.display         = 'flex';
  document.getElementById('p-section-archivos').style.display = 'block';
  document.getElementById('p-folder-files').style.display    = 'none';
  document.getElementById('p-folder-files').innerHTML        = '';
  _setToggleActive('grid');

  if (restoreAll) {
    const allAssets = _portalFolders.flatMap(f => uploadedAssets[f.imageId || f.id] || []);
    _renderMasonry(allAssets);
  }
}

function _setToggleActive(view) {
  document.getElementById('p-toggle-grid').classList.toggle('active', view === 'grid');
  document.getElementById('p-toggle-list').classList.toggle('active', view === 'list');
}

function _renderFolderContent() {
  const el = document.getElementById('p-folder-files');
  if (!el) return;

  if (_folderAssets.length === 0) {
    el.innerHTML = `<div style="color:var(--g500);font-size:14px;padding:24px 0;font-family:var(--font-ui)">Las imágenes demo cargan en un momento…</div>`;
    return;
  }

  if (_folderView === 'grid') {
    const assets = _folderAssets.map(a => ({
      src: a.preview, ext: a.ext.toUpperCase(),
      size: a.sizeStr, name: a.name,
      originalUrl: a.originalUrl || a.preview,
    }));
    registerSection('portal', assets);
    const NUM_COLS = 4;
    const cols = Array.from({ length: NUM_COLS }, () => []);
    assets.forEach((a, i) => cols[i % NUM_COLS].push({ a, i }));
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
    el.innerHTML = `<div class="p-file-list">${_folderAssets.map(a =>
      `<div class="p-file-row">
        <img class="p-file-thumb" src="${a.preview}" decoding="async">
        <span class="p-file-name">${a.name}</span>
        <span class="p-file-ext">${a.ext.toUpperCase()}</span>
        <span class="p-file-size">${a.sizeStr}</span>
        <div class="asset-dl p-file-dl" data-url="${a.originalUrl || a.preview}" data-filename="${a.name}.${a.ext.toLowerCase()}">
          <span class="msi sm">download</span>
        </div>
      </div>`
    ).join('')}</div>`;
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

  const NUM_COLS = 4;
  const cols = Array.from({ length: NUM_COLS }, () => []);
  assets.forEach((a, i) => cols[i % NUM_COLS].push({ a, i }));

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

document.getElementById('p-foldersBack').addEventListener('click', () => _exitFolder(true));

document.getElementById('p-toggle-grid').addEventListener('click', () => {
  if (_folderView === 'grid') return;
  _folderView = 'grid';
  _setToggleActive('grid');
  _renderFolderContent();
});

document.getElementById('p-toggle-list').addEventListener('click', () => {
  if (_folderView === 'list') return;
  _folderView = 'list';
  _setToggleActive('list');
  _renderFolderContent();
});

export function closePortal() {
  if (new URLSearchParams(location.search).get('portal') === '1') {
    window.close();
    return;
  }
  document.getElementById('portalScreen').classList.remove('open');
  document.getElementById('appShell').style.display = 'flex';
}
