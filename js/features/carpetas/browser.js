// Exports: treeState, carpetasState, renderTree(), renderFolderContent(node), navigateToFolder(id), switchTab(el), openCrearCarpetaDialog(), confirmCrearCarpeta(), cancelCrearCarpeta()
import { TREE_DATA, FOLDER_IMAGES, findNode, getAncestorIds, addUserFolder } from '../../data.js';
import { folderSVG, imgLabel } from '../../utils.js';
import { uploadedAssets, userUploadedAssets, pushUserFolder } from '../../session.js';
import { showToast } from '../../components/ui/toast.js';
import { bindStaticToggle } from '../../components/ui/view-toggle.js';
import { thumbsHTML, folderListRowHTML } from '../shared/folder-card.js';
import { registerSection } from '../shared/image-registry.js';
import { assetCardHTML, assetListRowHTML } from '../shared/asset-card.js';
import { isPhotoBlacklisted } from '../../blacklist-store.js';

export const treeState = {
  expanded: new Set(),
  selected: null,
};

export const carpetasState = { activeTab: 'recientes' };

const TAB_TITLES = {
  recientes:   'Carpetas recientes',
  creadas:     'Carpetas creadas',
  compartidas: 'Carpetas compartidas',
};

let _carpetasView = 'grid';

function _isOwned(nodeId) {
  if (!nodeId) return false;
  const ancestors = getAncestorIds(nodeId);
  const rootId = ancestors && ancestors.length > 0 ? ancestors[0] : nodeId;
  return TREE_DATA.find(n => n.id === rootId)?.owned === true;
}

function _updateActionButtons() {
  const btnCrear = document.getElementById('btnCrearCarpeta');
  const btnSubir = document.getElementById('btnSubirArchivos');
  if (!btnCrear || !btnSubir) return;
  const isOwned   = _isOwned(treeState.selected);
  const isCreadas = carpetasState.activeTab === 'creadas';
  // Crear: siempre visible en tab "Creadas" (sin selección = raíz; con selección owned = subcarpeta)
  btnCrear.style.display = (isOwned || (isCreadas && !treeState.selected)) ? '' : 'none';
  // Subir: solo cuando hay una carpeta propia seleccionada
  btnSubir.style.display = isOwned ? '' : 'none';
}


const _dispatchRendered = () => document.dispatchEvent(new CustomEvent('dam:cardsrendered'));

export function renderFolderContent(node) {
  if (!node) return;
  const row  = document.getElementById('foldersRow');
  const cols = document.getElementById('masonryCols');
  if (!row) return;
  _updateActionButtons();

  if (node.children && node.children.length > 0) {
    row.style.display = '';
    if (_carpetasView === 'grid') {
      row.innerHTML = node.children.map(child => `<div class="folder-card" data-node-id="${child.id}">
        <div class="folder-vis">
          ${folderSVG()}
          <div class="folder-thumbs">${thumbsHTML(child.id)}</div>
        </div>
        <div class="folder-name">${child.label}</div>
      </div>`).join('');
    } else {
      row.innerHTML = `<div class="folder-list">${node.children.map(child =>
        folderListRowHTML(child.id, child.label)
      ).join('')}</div>`;
    }
  } else {
    row.style.display = 'none';
  }

  if (cols) {
    const FAKE_EXTS  = ['JPG', 'WEBP', 'PNG', 'JPG', 'PNG', 'WEBP', 'TIFF', 'AI'];
    const FAKE_SIZES = ['2.4 MB', '1.8 MB', '3.1 MB', '980 KB', '2.7 MB', '4.4 MB', '8.2 MB', '1.2 MB'];
    const userList     = userUploadedAssets[node.id] || [];
    const demoList     = uploadedAssets[node.id] || [];
    const uploadedList = [...userList, ...demoList];
    const demoImgs     = uploadedList.length === 0 ? (FOLDER_IMAGES[node.id] || []) : [];
    const allItems = [
      ...uploadedList.map(u => ({ src: u.preview, ext: u.ext, size: u.sizeStr, name: u.name, originalUrl: u.originalUrl || null, faceIds: u.faceIds || [], modTime: u.modTime || null })),
      ...demoImgs.map((src, i) => ({
        src, name: imgLabel(src), originalUrl: src,
        ext:  FAKE_EXTS[i  % FAKE_EXTS.length],
        size: FAKE_SIZES[i % FAKE_SIZES.length],
      })),
    ];

    const visibleItems = allItems.filter(item => !isPhotoBlacklisted(item.originalUrl || item.src));
    const hiddenItems  = allItems.filter(item =>  isPhotoBlacklisted(item.originalUrl || item.src));

    if (visibleItems.length > 0 || hiddenItems.length > 0) {
      if (visibleItems.length > 0) registerSection('carpetas', visibleItems);
      cols.style.display = '';

      let mainHTML = '';
      if (visibleItems.length > 0) {
        if (_carpetasView === 'grid') {
          const colData = [[], [], []];
          visibleItems.forEach((item, i) => colData[i % 3].push({ item, i }));
          mainHTML = colData.map(col =>
            `<div class="masonry-col">${col.map(({ item, i }) => assetCardHTML(item, 'carpetas', i)).join('')}</div>`
          ).join('');
        } else {
          mainHTML = `<div class="file-list">${visibleItems.map((item, i) => assetListRowHTML(item, 'carpetas', i)).join('')}</div>`;
        }
      }

      let bannerHTML = '';
      if (hiddenItems.length > 0) {
        const n = hiddenItems.length;
        let hiddenGrid;
        if (_carpetasView === 'grid') {
          const colData = [[], [], []];
          hiddenItems.forEach((item, i) => colData[i % 3].push({ item, i }));
          hiddenGrid = colData.map(col =>
            `<div class="masonry-col">${col.map(({ item, i }) =>
              assetCardHTML(item, 'carpetas-bl', i)
                .replace('class="asset-card"', 'class="asset-card asset-card--bl"')
                .replace('<img ', '<div class="bl-card-overlay"><span class="msi sm">person_off</span></div><img ')
            ).join('')}</div>`
          ).join('');
        } else {
          hiddenGrid = `<div class="file-list">${hiddenItems.map((item, i) => assetListRowHTML(item, 'carpetas-bl', i)).join('')}</div>`;
        }
        bannerHTML = `
          <div class="bl-hidden-banner">
            <span class="msi xs">person_off</span>
            <span class="bl-hidden-banner-text">${n} foto${n !== 1 ? 's' : ''} oculta${n !== 1 ? 's' : ''} · personas en blacklist</span>
            <button class="bl-hidden-toggle" data-bl-toggle><span class="bl-toggle-text">ver</span> <span class="msi xs bl-toggle-icon">expand_more</span></button>
          </div>
          <div class="bl-hidden-section" data-bl-section style="display:none">
            <div class="masonry-cols">${hiddenGrid}</div>
          </div>`;
      }

      cols.innerHTML = mainHTML + bannerHTML;

      if (hiddenItems.length > 0) {
        const toggleBtn = cols.querySelector('[data-bl-toggle]');
        const section   = cols.querySelector('[data-bl-section]');
        if (toggleBtn && section) {
          toggleBtn.addEventListener('click', () => {
            const open = section.style.display !== 'none';
            section.style.display = open ? 'none' : '';
            toggleBtn.querySelector('.bl-toggle-text').textContent = open ? 'ver' : 'ocultar';
            const icon = toggleBtn.querySelector('.bl-toggle-icon');
            if (icon) icon.textContent = open ? 'expand_more' : 'expand_less';
          });
        }
      }
    } else {
      cols.style.display = 'none';
    }
  }
  _dispatchRendered();
}

function _getFilteredRoots() {
  switch (carpetasState.activeTab) {
    case 'creadas':     return TREE_DATA.filter(n => n.owned === true);
    case 'compartidas': return TREE_DATA.filter(n => n.owned === false);
    default:            return [...TREE_DATA].sort((a, b) => (b.lastEdited || 0) - (a.lastEdited || 0));
  }
}

export function renderTree() {
  const panel = document.getElementById('treePanel');
  if (!panel) return;
  panel.innerHTML = '';
  _renderNodes(_getFilteredRoots(), panel, 0);
}

function _renderNodes(nodes, container, level) {
  nodes.forEach(node => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded  = treeState.expanded.has(node.id);
    const isSelected  = treeState.selected === node.id;

    const item = document.createElement('div');
    item.className = `tree-item${isSelected ? ' sel' : ''}`;
    item.style.paddingLeft = `${4 + level * 16}px`;

    const icon = document.createElement('span');
    icon.className = `msi xs tree-icon${hasChildren ? ' expandable' : ''}`;
    icon.textContent = hasChildren && isExpanded ? 'keyboard_arrow_down' : 'chevron_right';
    if (!hasChildren) icon.style.opacity = '0.25';
    if (hasChildren) {
      icon.addEventListener('click', e => {
        e.stopPropagation();
        if (treeState.expanded.has(node.id)) treeState.expanded.delete(node.id);
        else treeState.expanded.add(node.id);
        renderTree();
      });
    }

    const label = document.createElement('span');
    label.className = 'tree-label';
    label.textContent = node.label;
    label.addEventListener('click', () => {
      treeState.selected = node.id;
      renderFolderContent(node);
      renderTree();
    });

    item.appendChild(icon);
    item.appendChild(label);
    container.appendChild(item);

    if (hasChildren && isExpanded) _renderNodes(node.children, container, level + 1);
  });
}

export function navigateToFolder(nodeId) {
  const node = findNode(nodeId);
  if (!node) return;
  const ancestors = getAncestorIds(nodeId);
  if (ancestors) ancestors.forEach(id => treeState.expanded.add(id));
  treeState.selected = nodeId;
  renderTree();
  renderFolderContent(node);
}

export function switchTab(el) {
  el.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const key = { 'Recientes': 'recientes', 'Creadas': 'creadas', 'Compartidas conmigo': 'compartidas' }[el.textContent.trim()] || 'recientes';
  carpetasState.activeTab = key;
  treeState.selected = null;
  treeState.expanded = new Set();
  const titleEl = document.querySelector('#sec-carpetas .sec-title');
  if (titleEl) titleEl.textContent = TAB_TITLES[key];
  renderTree();
  _renderRecentFoldersView();
  _updateActionButtons();
}

export function showRecentFolders() {
  treeState.selected = null;
  treeState.expanded = new Set();
  carpetasState.activeTab = 'recientes';

  document.querySelectorAll('#sec-carpetas .tab').forEach(t =>
    t.classList.toggle('active', t.textContent.trim() === 'Recientes')
  );
  const titleEl = document.querySelector('#sec-carpetas .sec-title');
  if (titleEl) titleEl.textContent = TAB_TITLES.recientes;

  renderTree();
  _renderRecentFoldersView();
  _updateActionButtons();
}

function _renderRecentFoldersView() {
  const row  = document.getElementById('foldersRow');
  const cols = document.getElementById('masonryCols');
  const sorted = _getFilteredRoots();

  if (row) {
    row.style.display = '';
    if (_carpetasView === 'grid') {
      row.innerHTML = sorted.map(node => `<div class="folder-card" data-node-id="${node.id}">
        <div class="folder-vis">
          ${folderSVG()}
          <div class="folder-thumbs">${thumbsHTML(node.id)}</div>
        </div>
        <div class="folder-name">${node.label}</div>
      </div>`).join('');
    } else {
      row.innerHTML = `<div class="folder-list">${sorted.map(node =>
        folderListRowHTML(node.id, node.label)
      ).join('')}</div>`;
    }
  }

  if (cols) cols.style.display = 'none';
  _dispatchRendered();
}

// ── Crear Carpeta dialog ──────────────────────────────────────────────────────
export function openCrearCarpetaDialog() {
  const dlg  = document.getElementById('crear-carpeta-dlg');
  const inp  = document.getElementById('crear-carpeta-inp');
  const hint = document.getElementById('crear-carpeta-hint');
  if (!dlg) return;
  inp.value = '';
  const parentNode = treeState.selected ? findNode(treeState.selected) : null;
  hint.textContent = parentNode
    ? `Subcarpeta dentro de "${parentNode.label}"`
    : 'Nueva carpeta raíz (visible en Portales)';
  dlg.style.display = 'flex';
  setTimeout(() => inp.focus(), 50);
}

export function confirmCrearCarpeta() {
  const inp  = document.getElementById('crear-carpeta-inp');
  const name = inp?.value?.trim();
  if (!name) {
    inp?.classList.add('inp-error');
    setTimeout(() => inp?.classList.remove('inp-error'), 600);
    return;
  }

  const parentId = treeState.selected || null;
  const newId    = addUserFolder(parentId, name);
  pushUserFolder(newId, parentId, name);

  document.getElementById('crear-carpeta-dlg').style.display = 'none';

  if (parentId) {
    const parent = findNode(parentId);
    treeState.expanded.add(parentId);
    renderTree();
    if (parent) renderFolderContent(parent);
  } else {
    renderTree();
    _renderRecentFoldersView();
    _updateActionButtons();
  }

  showToast(`Carpeta "${name}" creada`);
}

export function cancelCrearCarpeta() {
  document.getElementById('crear-carpeta-dlg').style.display = 'none';
}

// ── View toggle ───────────────────────────────────────────────────────────────
bindStaticToggle('c-toggle-grid', 'c-toggle-list', () => _carpetasView, v => {
  _carpetasView = v;
  if (treeState.selected) {
    const node = findNode(treeState.selected);
    if (node) renderFolderContent(node);
  } else {
    _renderRecentFoldersView();
  }
});
