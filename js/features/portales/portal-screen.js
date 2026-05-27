// Exports: openPortal(), closePortal()
import { st, closeModal } from './modal.js';
import { addToTable } from './table.js';
import { FOLDERS_DATA } from '../../data.js';
import { lighten } from '../../utils.js';

export function openPortal() {
  const rawName = document.getElementById('inp-name').value.trim() || 'Mi Portal';
  const title   = st.title  || rawName;
  const desc    = st.desc   || 'Selección de recursos para compartir';
  const accent  = st.accent;
  const font    = document.getElementById('font-sel').value;

  document.getElementById('p-name').textContent       = title;
  document.getElementById('p-desc').textContent       = desc;
  document.getElementById('p-hero-title').textContent = title;
  document.getElementById('p-hero-sub').textContent   = desc;
  document.getElementById('p-logo-box').textContent   = title.charAt(0).toUpperCase();
  document.getElementById('p-logo-box').style.background  = accent;
  document.getElementById('p-hero-bg').style.background   = `linear-gradient(135deg,${accent} 0%,${lighten(accent, 45)} 100%)`;
  document.getElementById('p-hero-btn').style.background  = accent;
  document.getElementById('p-access-badge').textContent   = st.access === 'public' ? '🌐 Acceso público' : '🔒 Acceso con clave';
  document.getElementById('portalScreen').style.fontFamily = `'${font}', sans-serif`;

  const selected = FOLDERS_DATA.filter(f => st.selectedFolders.has(f.id));
  document.getElementById('p-folders').innerHTML = selected.map(f => {
    const bg = `linear-gradient(90deg,rgba(255,255,255,.45),rgba(255,255,255,.45)),linear-gradient(141deg,${lighten(accent, 60)} 0%,${accent} 100%)`;
    return `<div class="p-folder">
      <div class="p-folder-vis" style="background:${bg}">
        <div class="pfph"></div><div class="pfph" style="background:rgba(255,255,255,.25)"></div>
        <div class="pfph" style="background:rgba(255,255,255,.3)"></div><div class="pfph" style="background:rgba(255,255,255,.15)"></div>
      </div>
      <div class="p-folder-name">${f.name}</div>
    </div>`;
  }).join('');

  closeModal();
  document.getElementById('portalScreen').classList.add('open');
  document.getElementById('appShell').style.display = 'none';
  addToTable(title, selected.length, accent);
}

export function closePortal() {
  document.getElementById('portalScreen').classList.remove('open');
  document.getElementById('appShell').style.display = 'flex';
}
