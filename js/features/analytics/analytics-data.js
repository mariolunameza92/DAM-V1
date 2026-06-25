// Mock data + live data helpers for analytics.
// Exports: M, RAMP, faceStats, totalFiles, sparkHTML, fmt

import { getFaces } from '../../faces.js';
import { uploadedAssets, userUploadedAssets } from '../../session.js';

// Data-viz grayscale ramp → tokens --viz-N (fuerte→faint, dark-aware).
export const RAMP = ['var(--viz-1)', 'var(--viz-2)', 'var(--viz-3)', 'var(--viz-4)', 'var(--viz-5)', 'var(--viz-6)'];

// ── Mock data (static mockup) ─────────────────────────────────────────────

export const M = {
  storage: {
    usedTB: 2.4, totalTB: 5.0, projectionDate: 'ago 2027',
    avgFileMB: 8.4,
    types: [
      { ext: 'JPG',   pct: 62, gb: 1.49, color: 'var(--viz-1)' },
      { ext: 'RAW',   pct: 18, gb: 0.43, color: 'var(--viz-2)' },
      { ext: 'PNG',   pct: 10, gb: 0.24, color: 'var(--viz-3)' },
      { ext: 'VIDEO', pct:  6, gb: 0.14, color: 'var(--viz-4)' },
      { ext: 'TIFF',  pct:  3, gb: 0.07, color: 'var(--viz-5)' },
      { ext: 'PDF',   pct:  1, gb: 0.02, color: 'var(--viz-6)' },
    ],
    growthData:   [0.30, 0.50, 0.78, 1.05, 1.28, 1.55, 1.80, 2.10, 2.40],
    growthLabels: ['Oct','Nov','Dic','Ene','Feb','Mar','Abr','May','Jun'],
  },
  structure: {
    heavyFolders: [
      { name: 'Lima 42K 2026',    gb: 420 },
      { name: 'Wings for Life',   gb: 310 },
      { name: 'Rimac Bienestar',  gb: 280 },
      { name: 'Color Run 2026',   gb: 195 },
      { name: 'Trail Perú',       gb: 142 },
    ],
    duplicates: 247, orphans: 183, noTags: 629, noMeta: 412,
    nesting: [
      { label: 'Superficial (1-2)',  pct: 45, color: 'var(--viz-5)' },
      { label: 'Medio (3-4)',        pct: 38, color: 'var(--viz-3)' },
      { label: 'Profundo (5+)',      pct: 17, color: 'var(--viz-1)' },
    ],
  },
  activity: {
    active: 5, inactive: 2, guests: 8,
    topUploaders: [
      { name: 'María L.',  uploads: 1840 },
      { name: 'Carlos V.', uploads: 1420 },
      { name: 'Ana R.',    uploads:  980 },
      { name: 'Luis P.',   uploads:  760 },
      { name: 'Sofía M.',  uploads:  540 },
    ],
    actions: [
      { label: 'Subidas',       n: 5820, color: 'var(--viz-1)' },
      { label: 'Descargas',     n: 3940, color: 'var(--viz-2)' },
      { label: 'Movimientos',   n: 1280, color: 'var(--viz-3)' },
      { label: 'Ediciones',     n:  720, color: 'var(--viz-4)' },
      { label: 'Eliminaciones', n:  184, color: 'var(--viz-5)' },
    ],
    heatDays:  ['Lu','Ma','Mi','Ju','Vi','Sá','Do'],
    heatHours: ['8am','10am','12pm','2pm','4pm','6pm'],
    heatData: [
      [2,4,8,6,5,3],
      [3,7,9,8,6,2],
      [2,5,10,9,7,3],
      [4,8,10,9,6,2],
      [3,6,8,7,4,1],
      [1,2,4,3,2,1],
      [1,1,2,1,1,0],
    ],
  },
  quality: {
    processed: 8420, pending: 1240, matchRate: 87.4,
    deletions: [
      { folder: 'Lima 42K 2025',  n: 48, date: 'Jun 12' },
      { folder: 'Wings for Life', n: 31, date: 'Jun 10' },
      { folder: 'Rimac Press',    n: 17, date: 'Jun 8'  },
    ],
  },
  portales: {
    active: 14, expired: 8, draft: 5,
    masters: 4, regulars: 23,
    avgAgeDays: 18,
    byFolder: [
      { name: 'Lima 42K 2026',   count: 6 },
      { name: 'Rimac Bienestar', count: 4 },
      { name: 'Wings for Life',  count: 5 },
      { name: 'Color Run 2026',  count: 3 },
      { name: 'Trail Perú',      count: 3 },
      { name: 'Otros',           count: 6 },
    ],
    topViews: [
      { title: 'Lima 42K 2026',      views: 1840, dl: 420,  cvr: 22.8 },
      { title: 'Rimac Bienestar',    views: 1240, dl: 310,  cvr: 25.0 },
      { title: 'Wings for Life',     views:  980, dl: 187,  cvr: 19.1 },
      { title: 'Color Run 2026',     views:  720, dl: 143,  cvr: 19.9 },
      { title: 'Trail Perú',         views:  460, dl:  82,  cvr: 17.8 },
    ],
    engagement: {
      avgTime: '3:42',
      assetsPerSession: 8.4,
      mobile: 62, desktop: 38,
      sources: [
        { label: 'Link directo', pct: 54, color: 'var(--viz-1)' },
        { label: 'QR',           pct: 31, color: 'var(--viz-3)' },
        { label: 'Otros',        pct: 15, color: 'var(--viz-5)' },
      ],
      radarAxes:   ['Vistas','Conversión','Tiempo','Assets/ses.','Retorno'],
      radarValues: [0.85, 0.72, 0.65, 0.80, 0.45],
    },
    viewsOverTime:   [180, 320, 580, 740, 920, 1050, 1240, 1580, 1840],
    viewsLabels:     ['Oct','Nov','Dic','Ene','Feb','Mar','Abr','May','Jun'],
    inactive: 3,
    security: {
      withPwd: 18, public: 9, failed: 24,
      expiring: [
        { title: 'Lima 42K VIP',     expires: 'Jun 18' },
        { title: 'Rimac Press Kit',  expires: 'Jun 20' },
        { title: 'Color Run Media',  expires: 'Jun 22' },
      ],
    },
  },
};

// ── Live data helpers ─────────────────────────────────────────────────────

export function faceStats() {
  const faces = getFaces();
  const identified = faces.filter(f => !f.unnamed).length;
  const unnamed    = faces.filter(f =>  f.unnamed).length;
  const all = faces.map(f => ({ ...f, photos: f.appearances?.photos || 0 }))
    .sort((a, b) => b.photos - a.photos);
  return { total: faces.length, identified, unnamed, top: all.slice(0, 6), all };
}

const BASE_TOTAL = 20_976;
export function totalFiles() {
  const demo = Object.values(uploadedAssets).reduce((s, a) => s + a.length, 0);
  const user = Object.values(userUploadedAssets).reduce((s, a) => s + a.length, 0);
  return BASE_TOTAL + demo + user;
}

const SPARKS = {
  total:       { '7d':[55,72,48,90,65,88,100], '30d':[40,58,52,71,65,83,100], '3m':[30,45,60,55,72,85,100], 'all':[20,35,50,65,72,88,100] },
  uploads:     { '7d':[30,80,45,95,55,70,100], '30d':[45,60,38,82,70,90,100], '3m':[25,50,70,45,85,75,100], 'all':[15,30,55,68,72,85,100] },
  portalViews: { '7d':[60,40,75,55,85,65,100], '30d':[50,65,45,78,60,88,100], '3m':[35,55,65,50,80,75,100], 'all':[20,40,55,70,65,85,100] },
  downloads:   { '7d':[50,70,35,85,60,75,100], '30d':[40,55,65,70,75,85,100], '3m':[30,45,60,72,68,90,100], 'all':[25,38,55,65,75,85,100] },
};

export function sparkHTML(key, period) {
  const vals = SPARKS[key]?.[period] || SPARKS[key]?.['30d'];
  return vals.map((h, i) =>
    `<div class="an-spark-bar${i === vals.length - 1 ? ' last' : ''}" style="height:${h}%"></div>`
  ).join('');
}

export function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0','') + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1).replace('.0','') + 'K';
  return String(n);
}
