// Exports: treeState, carpetasState, renderTree(), renderFolderContent(node), navigateToFolder(id), switchTab(el)
import { TREE_DATA, FOLDER_IMAGES, findNode, getAncestorIds } from '../../data.js';
import { folderSVG, imgLabel } from '../../utils.js';
import { uploadedAssets, userUploadedAssets } from '../../session.js';
import { thumbsHTML } from '../shared/folder-card.js';

export const treeState = {
  expanded: new Set(['campana2025', 'briefing', 'planmedios', 'creaciones']),
  selected: 'artesfinales',
};

export const carpetasState = { activeTab: 'recientes' };

const TAB_TITLES = {
  recientes:   'Carpetas recientes',
  creadas:     'Carpetas creadas',
  compartidas: 'Carpetas compartidas',
};

export function renderFolderContent(node) {
  const nameEl = document.getElementById('masonryFolderName');
  const row    = document.getElementById('foldersRow');
  const cols   = document.getElementById('masonryCols');
  if (!nameEl || !row) return;

  nameEl.textContent = node.label;

  if (node.children && node.children.length > 0) {
    row.style.display = '';
    row.innerHTML = node.children.map(child => `<div class="folder-card" data-node-id="${child.id}">
      <div class="folder-vis">
        ${folderSVG()}
        <div class="folder-thumbs">${thumbsHTML(child.id)}</div>
      </div>
      <div class="folder-name">${child.label}</div>
    </div>`).join('');
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
      ...uploadedList.map(u => ({ src: u.preview, ext: u.ext, size: u.sizeStr, name: u.name })),
      ...demoImgs.map((src, i) => ({
        src, name: imgLabel(src),
        ext:  FAKE_EXTS[i  % FAKE_EXTS.length],
        size: FAKE_SIZES[i % FAKE_SIZES.length],
      })),
    ];

    if (allItems.length > 0) {
      cols.style.display = '';
      const colData = [[], [], []];
      allItems.forEach((item, i) => colData[i % 3].push(item));
      cols.innerHTML = colData.map(col =>
        `<div class="masonry-col">${col.map(({ src, ext, size, name }) =>
          `<div class="asset-card">
            <img src="${src}" loading="lazy" decoding="async" style="width:100%;display:block;border-radius:8px">
            <div class="asset-hover">
              <div class="asset-name">${name}</div>
              <div class="asset-meta"><span>${ext}</span><span>${size}</span></div>
            </div>
          </div>`
        ).join('')}</div>`
      ).join('');
    } else {
      cols.style.display = 'none';
    }
  }
}

export function renderTree() {
  const panel = document.getElementById('treePanel');
  if (!panel) return;
  panel.innerHTML = '';
  const rootNodes = carpetasState.activeTab === 'recientes'
    ? [...TREE_DATA].sort((a, b) => (b.lastEdited || 0) - (a.lastEdited || 0))
    : TREE_DATA;
  _renderNodes(rootNodes, panel, 0);
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
  const key = { 'Recientes': 'recientes', 'Creadas': 'creadas', 'Compartidas': 'compartidas' }[el.textContent.trim()] || 'recientes';
  carpetasState.activeTab = key;
  const titleEl = document.querySelector('#sec-carpetas .sec-title');
  if (titleEl) titleEl.textContent = TAB_TITLES[key];
  renderTree();
}
