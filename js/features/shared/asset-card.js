// Exports: assetCardHTML(item, section, idx)
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
