// Exports: assetCardHTML(item, section, idx), assetListRowHTML(item, section, idx)
export function assetCardHTML(item, section, idx) {
  const url = item.originalUrl || item.src;
  const filename = `${item.name}.${(item.ext || 'jpg').toLowerCase()}`;
  return `<div class="asset-card" data-section="${section}" data-idx="${idx}">
    <img src="${item.src}" loading="lazy" decoding="async" style="width:100%;display:block;border-radius:8px">
    <div class="asset-dl" data-url="${url}" data-filename="${filename}"><span class="msi sm">download</span></div>
    <div class="asset-hover">
      <div class="asset-name">${item.name}</div>
      <div class="asset-meta"><span>${item.ext}</span><span>${item.size}</span></div>
    </div>
  </div>`;
}

export function assetListRowHTML(item, section, idx) {
  const url = item.originalUrl || item.src;
  const filename = `${item.name}.${(item.ext || 'jpg').toLowerCase()}`;
  return `<div class="file-row" data-section="${section}" data-idx="${idx}">
    <img class="file-row-thumb" src="${item.src}" loading="lazy" decoding="async">
    <span class="file-row-name">${item.name}</span>
    <span class="file-row-ext">${item.ext}</span>
    <span class="file-row-size">${item.size}</span>
    <div class="asset-dl" data-url="${url}" data-filename="${filename}"><span class="msi sm">download</span></div>
  </div>`;
}
