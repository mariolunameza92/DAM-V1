// Exports: thumbsHTML(folderId), folderListRowHTML(id, label, extraAttrs?)
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

export function folderListRowHTML(id, label, extraAttrs = '') {
  const source = (userUploadedAssets[id] && userUploadedAssets[id].length > 0)
    ? userUploadedAssets[id]
    : (uploadedAssets[id] || []);
  const demoImgs = FOLDER_IMAGES[id] || [];
  const firstSrc = source[0]?.thumb || demoImgs[0] || '';
  const thumbContent = firstSrc
    ? `<img src="${firstSrc}" loading="lazy" decoding="async">`
    : '';
  return `<div class="folder-row" data-node-id="${id}"${extraAttrs ? ' ' + extraAttrs : ''}>
    <div class="folder-row-thumb">${thumbContent}</div>
    <span class="folder-row-name">${label}</span>
    <span class="folder-row-arrow"><span class="msi xs">chevron_right</span></span>
  </div>`;
}
