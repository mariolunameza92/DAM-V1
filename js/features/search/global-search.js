// Global cross-section search overlay.
// Busca en Face IDs, Carpetas y Portales. Navega al resultado al hacer click.
import { getFaces } from '../../faces.js';
import { TREE_DATA } from '../../data.js';
import { getPortals } from '../../session.js';

function _esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
}

function _searchFaces(q) {
  return getFaces()
    .filter(f => !f.unnamed && f.displayName.toLowerCase().includes(q))
    .slice(0, 5)
    .map(f => ({
      type: 'face', id: f.id, section: 'faceids',
      label: f.displayName,
      sub: `Face ID · ${f.appearances.photos} foto${f.appearances.photos !== 1 ? 's' : ''}`,
      img: f.selfieUrl,
    }));
}

function _walkFolders(nodes, q, out) {
  for (const n of nodes) {
    if (n.label.toLowerCase().includes(q)) out.push(n);
    if (out.length < 6 && n.children?.length) _walkFolders(n.children, q, out);
  }
}

function _searchFolders(q) {
  const out = [];
  _walkFolders(TREE_DATA, q, out);
  return out.slice(0, 5).map(n => ({
    type: 'folder', id: n.id, section: 'carpetas',
    label: n.label, sub: 'Carpeta',
  }));
}

function _searchPortals(q) {
  return getPortals()
    .filter(p => p.title.toLowerCase().includes(q))
    .slice(0, 4)
    .map(p => ({
      type: 'portal', id: p.id, section: 'portales',
      label: p.title,
      sub: `Portal · ${p.type === 'master' ? 'Master' : 'Regular'}`,
    }));
}

function _renderResults(q) {
  const el = document.getElementById('globalSearchResults');
  if (!el) return;

  if (!q.trim()) {
    el.innerHTML = `<div class="gs-empty">Escribe para buscar personas, carpetas o portales<br><span style="opacity:.5;font-size:11px">Atajo: ⌘K / Ctrl+K</span></div>`;
    return;
  }

  const ql = q.trim().toLowerCase();
  const faces   = _searchFaces(ql);
  const folders = _searchFolders(ql);
  const portals = _searchPortals(ql);

  if (!faces.length && !folders.length && !portals.length) {
    el.innerHTML = `<div class="gs-empty">Sin resultados para "<strong>${_esc(q)}</strong>"</div>`;
    return;
  }

  const mkSection = (title, icon, items) => {
    if (!items.length) return '';
    const rows = items.map(it => {
      const av = it.img
        ? `<div class="gs-av"><img src="${_esc(it.img)}" alt=""></div>`
        : `<div class="gs-av gs-av--icon"><span class="msi xs">${it.type === 'folder' ? 'folder' : 'captive_portal'}</span></div>`;
      return `<div class="gs-row" data-gs-section="${it.section}" data-gs-id="${it.id}" data-gs-type="${it.type}">
        ${av}
        <div class="gs-row-body">
          <div class="gs-row-label">${_esc(it.label)}</div>
          <div class="gs-row-sub">${_esc(it.sub)}</div>
        </div>
        <span class="msi xs" style="color:var(--text-faint)">arrow_forward</span>
      </div>`;
    }).join('');
    return `<div class="gs-section">
      <div class="gs-section-label"><span class="msi xs">${icon}</span>${title}</div>
      ${rows}
    </div>`;
  };

  el.innerHTML =
    mkSection('Face IDs', 'ar_on_you', faces) +
    mkSection('Carpetas', 'folder', folders) +
    mkSection('Portales', 'captive_portal', portals);

  el.querySelectorAll('.gs-row').forEach(row => {
    row.addEventListener('click', () => {
      const { gsSection, gsId, gsType } = row.dataset;
      closeGlobalSearch();
      if (gsType === 'folder' && gsId) {
        setTimeout(() => window.goToCarpeta?.(gsId), 60);
      } else {
        window.switchSection(gsSection);
      }
    });
  });
}

export function openGlobalSearch() {
  const overlay = document.getElementById('globalSearchOverlay');
  if (!overlay) return;
  overlay.style.display = '';
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    const inp = document.getElementById('globalSearchInput');
    if (inp) { inp.focus(); _renderResults(inp.value); }
  }, 50);
}

export function closeGlobalSearch() {
  const overlay = document.getElementById('globalSearchOverlay');
  if (!overlay) return;
  overlay.style.display = 'none';
  document.body.style.overflow = '';
  const inp = document.getElementById('globalSearchInput');
  if (inp) inp.value = '';
  const res = document.getElementById('globalSearchResults');
  if (res) res.innerHTML = '';
}

export function initGlobalSearch() {
  const overlay  = document.getElementById('globalSearchOverlay');
  const modal    = document.getElementById('globalSearchModal');
  const input    = document.getElementById('globalSearchInput');
  const closeBtn = document.getElementById('globalSearchClose');
  const searchBar = document.getElementById('topbarSearch');

  if (!overlay || !input) return;

  searchBar?.addEventListener('click', openGlobalSearch);
  searchBar?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openGlobalSearch(); }
  });

  closeBtn?.addEventListener('click', closeGlobalSearch);

  overlay.addEventListener('mousedown', e => {
    if (!modal?.contains(e.target)) closeGlobalSearch();
  });

  input.addEventListener('input', () => _renderResults(input.value));

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeGlobalSearch();
    if (e.key === 'Enter') {
      const first = document.querySelector('.gs-row');
      first?.click();
    }
  });

  // ⌘K / Ctrl+K shortcut
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (overlay.style.display === 'none') openGlobalSearch();
      else closeGlobalSearch();
    }
  });

  _renderResults('');
}
