// Exports: FOLDERS_DATA, TREE_DATA, FOLDER_IMAGES, INICIO_FOLDER_IDS, findNode(), getAncestorIds()
import { FOLDER_IMAGES_EVENTS } from './events-registry.js';

export const FOLDERS_DATA = [
  { id: 'colorrun',    name: 'Color Run 2026',           count: '4 archivos',   imageId: 'colorrun' },
  { id: 'lima42k',     name: 'Lima 42K 2026',            count: '32 archivos',  imageId: 'lima42k' },
  { id: 'masmujeres',  name: 'Más mujeres en meta 2026', count: '4 archivos',   imageId: 'masmujeres' },
  { id: 'onsquad',     name: 'On Squad Race Lima 2026',  count: '4 archivos',   imageId: 'onsquad' },
  { id: 'rimac',       name: 'Rimac Bienestar Fest',     count: '5 archivos',   imageId: 'rimac' },
  { id: 'wingslife',   name: 'Wings for Life 2026',      count: '4 archivos',   imageId: 'wingslife' },
];

export const TREE_DATA = [
  { id: 'colorrun',   label: 'Color Run 2026',           owned: true,  lastEdited: new Date('2026-04-15').getTime(), children: [
    { id: 'colorrun-salida',     label: 'Salida',      children: [] },
    { id: 'colorrun-recorrido',  label: 'Recorrido',   children: [] },
    { id: 'colorrun-meta',       label: 'Meta',        children: [] },
  ]},
  { id: 'lima42k',    label: 'Lima 42K 2026',            owned: true,  lastEdited: new Date('2026-03-10').getTime(), children: [
    { id: 'lima42k-highlights',   label: '01. Highlights',                 children: [] },
    { id: 'lima42k-protocolares', label: '02. Protocolares',               children: [] },
    { id: 'lima42k-todo',         label: '03. Todo L42K',                  children: [] },
    { id: 'lima42k-activaciones', label: '04. Activaciones Adidas',        children: [] },
    { id: 'lima42k-conferencia',  label: '05. Conferencia de prensa',      children: [] },
    { id: 'lima42k-kits',         label: '06. Entrega de Kits',            children: [] },
    { id: 'lima42k-shakeout',     label: '07. Shake Out Run Adidas L42K',  children: [] },
    { id: 'lima42k-socialrun',    label: '08. Social Run',                 children: [] },
  ]},
  { id: 'masmujeres', label: 'Más mujeres en meta 2026', owned: true,  lastEdited: new Date('2026-02-20').getTime(), children: [] },
  { id: 'onsquad',    label: 'On Squad Race Lima 2026',  owned: false, lastEdited: new Date('2026-05-01').getTime(), children: [] },
  { id: 'rimac',      label: 'Rimac Bienestar Fest',     owned: false, lastEdited: new Date('2026-01-28').getTime(), children: [] },
  { id: 'wingslife',  label: 'Wings for Life 2026',      owned: true,  lastEdited: new Date('2026-05-10').getTime(), children: [] },
];

export const FOLDER_IMAGES = FOLDER_IMAGES_EVENTS;

export const INICIO_FOLDER_IDS = ['colorrun', 'lima42k', 'masmujeres', 'onsquad', 'rimac', 'wingslife'];

export function findNode(id, nodes = TREE_DATA) {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(id, n.children);
    if (found) return found;
  }
  return null;
}

export function getAncestorIds(targetId, nodes = TREE_DATA, path = []) {
  for (const n of nodes) {
    if (n.id === targetId) return path;
    const result = getAncestorIds(targetId, n.children, [...path, n.id]);
    if (result) return result;
  }
  return null;
}

// Adds a user-created folder at runtime. Returns the generated/provided id.
// parentId=null → root folder (also added to FOLDERS_DATA for portales).
// parentId set  → subfolder under that node (portal drill-down picks it up automatically).
export function addUserFolder(parentId, label, existingId = null) {
  const slug = label.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/, '') || 'carpeta';
  const id   = existingId || `ucf-${slug}-${Date.now()}`;
  const node = { id, label, owned: true, lastEdited: Date.now(), children: [], userCreated: true };

  if (parentId) {
    const parent = findNode(parentId);
    if (parent) parent.children.push(node);
  } else {
    TREE_DATA.push(node);
    FOLDERS_DATA.push({ id, name: label, count: '0 archivos', imageId: null, userCreated: true });
  }

  return id;
}
