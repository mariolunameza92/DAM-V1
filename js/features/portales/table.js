// Exports: addToTable(title, fCount, photoCount, accent, folderIds, dateStr?, silent?) — inserta fila en tabla de portales y persiste en session
import { pushPortal } from '../../session.js';

export function addToTable(title, fCount, photoCount, accent, folderIds, dateStr, silent) {
  const today = new Date();
  const d = dateStr || `${today.getDate()}/${today.toLocaleString('es', { month: 'short' })}/${today.getFullYear()}`;
  const ids = Array.isArray(folderIds) ? folderIds : [];
  const photos = photoCount || 0;

  if (!silent) pushPortal({ title, fCount, photoCount: photos, accent, folderIds: ids, dateStr: d });

  const row = document.createElement('div');
  row.className = 'table-row';
  row.style.animation = 'fadeIn .3s ease';
  row.dataset.portalTitle = title;
  row.dataset.portalAccent = accent;
  row.dataset.portalFolders = ids.join(',');
  row.innerHTML = `
    <div class="col"><div class="portal-name-cell" style="cursor:pointer">
      <div class="portal-icon-box" style="background:${accent};border-color:${accent}">
        <span class="msi xs" style="color:white">captive_portal</span>
      </div>${title}
    </div></div>
    <div class="col"><div class="content-cell">
      <span class="content-chip"><span class="msi xs" style="color:var(--g500)">folder</span>&nbsp;${fCount}</span>
      <span class="content-chip"><span class="msi xs" style="color:var(--g500)">image</span>&nbsp;${photos}</span>
    </div></div>
    <div class="col">${d}</div>
    <div class="col" style="display:flex;align-items:center;gap:12px">
      <span style="flex:1">Tú</span>
      <button class="more-btn"><span class="msi xs">more_horiz</span></button>
    </div>`;
  document.querySelector('#portalsTable .table-head').after(row);
}
