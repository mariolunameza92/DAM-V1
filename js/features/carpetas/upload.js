// Exports: processUpload(files), initDemoImages(), resizeToDataURL(file, maxDim, quality)
import { formatBytes, fileExt, imgLabel } from '../../utils.js';
import { userUploadedAssets, uploadedAssets, saveUploadsSession } from '../../session.js';
import { showToast } from '../../components/atoms/toast.js';
import { idbGet, idbSet } from '../../image-cache.js';
import { FOLDER_IMAGES } from '../../data.js';
import { treeState, renderTree, renderFolderContent } from './browser.js';
import { renderInicio } from '../inicio/inicio.js';
import { findNode } from '../../data.js';
import { annotateDemoFaces } from '../../events-registry.js';

export function resizeToDataURL(file, maxDim, quality) {
  return new Promise(resolve => {
    const img     = new Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const cw = Math.max(1, Math.round(img.naturalWidth  * scale));
      const ch = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = cw; canvas.height = ch;
      canvas.getContext('2d').drawImage(img, 0, 0, cw, ch);
      URL.revokeObjectURL(blobUrl);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(null); };
    img.src = blobUrl;
  });
}

export async function processUpload(files) {
  const folderId = treeState.selected;
  if (!folderId) { showToast('Selecciona una carpeta primero'); return; }
  const imgFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (!imgFiles.length) return;

  showToast(`Procesando ${imgFiles.length} imagen${imgFiles.length > 1 ? 'es' : ''}…`, 0);
  if (!userUploadedAssets[folderId]) userUploadedAssets[folderId] = [];

  for (const file of imgFiles) {
    const [thumb, preview] = await Promise.all([
      resizeToDataURL(file, 200, 0.65),
      resizeToDataURL(file, 900, 0.82),
    ]);
    if (!thumb || !preview) continue;
    userUploadedAssets[folderId].push({
      name:    file.name.replace(/\.[^/.]+$/, ''),
      ext:     fileExt(file.name),
      sizeStr: formatBytes(file.size),
      thumb,
      preview,
    });
  }

  saveUploadsSession();
  showToast(`✓ ${imgFiles.length} imagen${imgFiles.length > 1 ? 'es subidas' : ' subida'}`);
  const node = findNode(folderId);
  if (node) renderFolderContent(node);
}

async function _processDemoFromUrl(url) {
  const cached = await idbGet(url);
  if (cached) {
    // Backfill modTime for cached entries that predate this field
    if (!cached.modTime) {
      try {
        const head = await fetch(url, { method: 'HEAD' });
        const lm = head.headers.get('Last-Modified');
        if (lm) { cached.modTime = new Date(lm).getTime(); idbSet(url, cached); }
      } catch {}
    }
    return cached;
  }

  let resp;
  try { resp = await fetch(url); }
  catch (e) { return null; }

  const lm = resp.headers.get('Last-Modified');
  const modTime = lm ? new Date(lm).getTime() : null;
  const blob = await resp.blob();

  const blobUrl = URL.createObjectURL(blob);
  const imgEl = await new Promise(res => {
    const img = new Image();
    img.onload  = () => res(img);
    img.onerror = () => res(null);
    img.src = blobUrl;
  });
  URL.revokeObjectURL(blobUrl);
  if (!imgEl) return null;

  const resizeTo = (maxDim, quality) => {
    const sc = Math.min(1, maxDim / Math.max(imgEl.naturalWidth, imgEl.naturalHeight));
    const c  = document.createElement('canvas');
    c.width  = Math.max(1, Math.round(imgEl.naturalWidth  * sc));
    c.height = Math.max(1, Math.round(imgEl.naturalHeight * sc));
    c.getContext('2d').drawImage(imgEl, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', quality);
  };

  const result = {
    name:        imgLabel(url),
    ext:         fileExt(url.split('/').pop()),
    sizeStr:     formatBytes(blob.size),
    thumb:       resizeTo(200, 0.65),
    preview:     resizeTo(900, 0.82),
    originalUrl: url,
    modTime,
  };

  idbSet(url, result);
  return result;
}

export async function initDemoImages() {
  await Promise.all(
    Object.entries(FOLDER_IMAGES).map(async ([folderId, urls]) => {
      const assets = [];
      for (const url of urls) {
        const asset = await _processDemoFromUrl(url);
        if (asset) assets.push(asset);
      }
      uploadedAssets[folderId] = assets;
    })
  );
  annotateDemoFaces(uploadedAssets);
  renderTree();
  renderFolderContent(findNode(treeState.selected));
  renderInicio();
}
