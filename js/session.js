// Exports: uploadedAssets{}, userUploadedAssets{}, saveUploadsSession(), savePortalsSession(), loadUploadsFromSession(), loadPortalsFromSession(), pushPortal(), pushUserFolder(), loadUserFoldersFromSession()
import { showToast } from './components/ui/toast.js';

const SS_PORTALS = 'len_portals';
const SS_UPLOADS = 'len_uploads';
const SS_FOLDERS = 'len_user_folders';

export const uploadedAssets     = {}; // demo assets — set by initDemoImages
export const userUploadedAssets = {}; // user uploads — persisted to sessionStorage

const _portals = [];

export function saveUploadsSession() {
  const toSave = {};
  for (const [id, arr] of Object.entries(userUploadedAssets)) {
    toSave[id] = arr.map(({ name, ext, sizeStr, thumb, preview }) => ({ name, ext, sizeStr, thumb, preview }));
  }
  try { sessionStorage.setItem(SS_UPLOADS, JSON.stringify(toSave)); }
  catch (e) { showToast('⚠️ Sesión casi llena — algunos archivos no guardados'); }
}

export function savePortalsSession() {
  try { sessionStorage.setItem(SS_PORTALS, JSON.stringify(_portals)); } catch (e) {}
}

export function loadUploadsFromSession() {
  try {
    const raw = sessionStorage.getItem(SS_UPLOADS);
    if (raw) {
      const saved = JSON.parse(raw);
      for (const [id, arr] of Object.entries(saved)) {
        userUploadedAssets[id] = arr;
      }
    }
  } catch (e) {}
}

export function loadPortalsFromSession() {
  try {
    const raw = sessionStorage.getItem(SS_PORTALS);
    if (raw) {
      const saved = JSON.parse(raw);
      _portals.push(...saved);
      return saved;
    }
  } catch (e) {}
  return [];
}

export function pushPortal(portal) {
  _portals.push(portal);
  savePortalsSession();
}

// ── User-created folders ──────────────────────────────────────────────────────
const _userFolders = []; // { id, parentId, label }

export function pushUserFolder(id, parentId, label) {
  _userFolders.push({ id, parentId: parentId || null, label });
  try { sessionStorage.setItem(SS_FOLDERS, JSON.stringify(_userFolders)); } catch(e) {}
}

export function loadUserFoldersFromSession() {
  try {
    const raw = sessionStorage.getItem(SS_FOLDERS);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return [];
}
