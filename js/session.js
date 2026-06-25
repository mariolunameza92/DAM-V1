// Exports: uploadedAssets{}, userUploadedAssets{}, saveUploadsSession(), savePortalsSession(), loadUploadsFromSession(), loadPortalsFromSession(), pushPortal(), getPortalById(), getMasters(), getUnits(), getPortals(), addUnitToMaster(), removeUnitFromMaster(), pushUserFolder(), loadUserFoldersFromSession()
import { showToast } from './components/atoms/toast.js';

const SS_PORTALS = 'len_portals';
const SS_UPLOADS = 'len_uploads';
const SS_FOLDERS = 'len_user_folders';

export const uploadedAssets     = {}; // demo assets — set by initDemoImages
export const userUploadedAssets = {}; // user uploads — persisted to sessionStorage

const _portals = [];

function _genId() {
  return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

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
      // Backward compat: add missing fields added in Propuesta B
      saved.forEach(p => {
        if (!p.id)        p.id        = _genId();
        if (!p.type)      p.type      = 'unit';
        if (!p.masterIds) p.masterIds = [];
      });
      _portals.push(...saved);
      return saved;
    }
  } catch (e) {}
  return [];
}

// Returns the generated/assigned ID
export function pushPortal(portal) {
  if (!portal.id)        portal.id        = _genId();
  if (!portal.type)      portal.type      = 'unit';
  if (!portal.masterIds) portal.masterIds = [];
  _portals.push(portal);
  savePortalsSession();
  return portal.id;
}

export function getPortalById(id) { return _portals.find(p => p.id === id) || null; }
export function getMasters()      { return _portals.filter(p => p.type === 'master'); }
export function getUnits()        { return _portals.filter(p => p.type !== 'master'); }
export function getPortals()      { return _portals.slice(); }

export function addUnitToMaster(masterId, unitId) {
  const master = _portals.find(p => p.id === masterId);
  const unit   = _portals.find(p => p.id === unitId);
  if (!master || !unit) return;
  if (!master.unitPortalIds) master.unitPortalIds = [];
  if (!master.unitPortalIds.includes(unitId)) master.unitPortalIds.push(unitId);
  if (!unit.masterIds.includes(masterId)) unit.masterIds.push(masterId);
  savePortalsSession();
}

export function removeUnitFromMaster(masterId, unitId) {
  const master = _portals.find(p => p.id === masterId);
  const unit   = _portals.find(p => p.id === unitId);
  if (master) master.unitPortalIds = (master.unitPortalIds || []).filter(id => id !== unitId);
  if (unit)   unit.masterIds       = unit.masterIds.filter(id => id !== masterId);
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
