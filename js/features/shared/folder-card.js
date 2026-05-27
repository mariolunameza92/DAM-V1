// Exports: thumbsHTML(folderId) — genera HTML de 4 thumbnails para una folder card (user uploads > demo images > vacío)
import { userUploadedAssets, uploadedAssets } from '../../session.js';
import { FOLDER_IMAGES } from '../../data.js';

export function thumbsHTML(id) {
  const source = (userUploadedAssets[id] && userUploadedAssets[id].length > 0)
    ? userUploadedAssets[id]
    : (uploadedAssets[id] || []);

  if (source.length > 0) {
    return [0, 1, 2, 3].map(i => {
      const a = source[i];
      return a && a.thumb
        ? `<div class="folder-thumb"><img src="${a.thumb}" decoding="async" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block"></div>`
        : '<div class="folder-thumb"></div>';
    }).join('');
  }

  const demoImgs = FOLDER_IMAGES[id] || [];
  const first = demoImgs[0]
    ? `<div class="folder-thumb"><img src="${demoImgs[0]}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block"></div>`
    : '<div class="folder-thumb"></div>';
  return first + '<div class="folder-thumb"></div>'.repeat(3);
}
