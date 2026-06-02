// Exports: folderSVG(), lighten(), imgLabel(), formatBytes(), fileExt(), getNumCols(), positionDropdown(), hexToOklch(), generateShadeScale()
let _fIdx = 0;

export function folderSVG() {
  const id = _fIdx++;
  const a = `fg1_${id}`, b = `fg2_${id}`;
  return `<svg class="folder-svg" width="168" height="158" viewBox="0 0 169 158" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M80.8717 8.307C82.837 10.6691 85.7507 12.0352 88.8235 12.0352H157.749C163.462 12.0354 168.093 16.6671 168.093 22.3799V55.7998C168.093 61.5124 163.462 66.1433 157.749 66.1436H10.3438C4.63116 66.1433 0.000240495 61.5124 0 55.7998V10.3451C0 4.63222 4.63124 0.000976562 10.3442 0.000976562H69.1111C72.1838 0.000976562 75.0975 1.36706 77.0628 3.72913L80.8717 8.307Z" fill="url(#${a})"/>
    <path d="M80.8717 8.307C82.837 10.6691 85.7507 12.0352 88.8235 12.0352H157.749C163.462 12.0354 168.093 16.6671 168.093 22.3799V55.7998C168.093 61.5124 163.462 66.1433 157.749 66.1436H10.3438C4.63116 66.1433 0.000240495 61.5124 0 55.7998V10.3451C0 4.63222 4.63124 0.000976562 10.3442 0.000976562H69.1111C72.1838 0.000976562 75.0975 1.36706 77.0628 3.72913L80.8717 8.307Z" fill="white" fill-opacity="0.5"/>
    <rect y="23.2744" width="168.093" height="134.474" rx="10.3442" fill="url(#${b})"/>
    <rect y="23.2744" width="168.093" height="134.474" rx="10.3442" fill="white" fill-opacity="0.5"/>
    <defs>
      <linearGradient id="${a}" x1="84.0464" y1="-16.3698" x2="84.0464" y2="66.1435" gradientUnits="userSpaceOnUse">
        <stop stop-color="#b0b7c9"/><stop offset="1" stop-color="#515c78"/>
      </linearGradient>
      <linearGradient id="${b}" x1="0" y1="23.2744" x2="131.194" y2="187.267" gradientUnits="userSpaceOnUse">
        <stop stop-color="#b0b7c9"/><stop offset="1" stop-color="#515c78"/>
      </linearGradient>
    </defs>
  </svg>`;
}

export function lighten(hex, amt) {
  let r = parseInt(hex.slice(1, 3), 16) || 0;
  let g = parseInt(hex.slice(3, 5), 16) || 0;
  let b = parseInt(hex.slice(5, 7), 16) || 0;
  r = Math.min(255, r + amt);
  g = Math.min(255, g + amt);
  b = Math.min(255, b + amt);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

export function imgLabel(src) {
  return src.split('/').pop()
    .replace(/\.[^.]+$/, '')
    .replace(/-[A-Za-z0-9]{10,12}-unsplash$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  if (bytes >= 1024)        return Math.round(bytes / 1024) + ' KB';
  return bytes + ' B';
}

export function fileExt(filename) {
  const m = filename.match(/\.([^.]+)$/);
  return m ? m[1].toUpperCase() : 'IMG';
}

// Breakpoints: 1024 / 1440 / 1920 / 2300. Usada en masonry de inicio, portal y resize de main.
export function getNumCols() {
  const w = window.innerWidth;
  if (w <= 1024) return 2;
  if (w <= 1440) return 3;
  if (w <= 1920) return 4;
  if (w < 2300)  return 5;
  return 6;
}

// Posiciona un dropdown de sugerencias justo debajo de anchorEl.
export function positionDropdown(suggestionsEl, anchorEl) {
  const rect = anchorEl.getBoundingClientRect();
  suggestionsEl.style.top   = (rect.bottom + 8) + 'px';
  suggestionsEl.style.left  = rect.left + 'px';
  suggestionsEl.style.width = rect.width + 'px';
}

// ── OKLCH color utilities ─────────────────────────────────────────────────────
export function hexToOklch(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return { L: 0.20, C: 0.02, H: 240 };
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const lin = v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  const rl = lin(r), gl = lin(g), bl = lin(b);
  const X = 0.4124564*rl + 0.3575761*gl + 0.1804375*bl;
  const Y = 0.2126729*rl + 0.7151522*gl + 0.0721750*bl;
  const Z = 0.0193339*rl + 0.1191920*gl + 0.9503041*bl;
  const lms = v => Math.sign(v) * Math.pow(Math.abs(v), 1/3);
  const l_ = lms(0.8189330101*X + 0.3618667424*Y - 0.1288597137*Z);
  const m_ = lms(0.0329845436*X + 0.9293118715*Y + 0.0361456387*Z);
  const s_ = lms(0.0482003018*X + 0.2643662691*Y + 0.6338517070*Z);
  const La = 0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_;
  const a  = 1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_;
  const bk = 0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_;
  const C  = Math.sqrt(a*a + bk*bk);
  let H    = (Math.atan2(bk, a) * 180 / Math.PI) % 360;
  if (H < 0) H += 360;
  return { L: La, C, H };
}

// Genera 11 stops (50→950) preservando matiz; C sigue campana con pico en 500.
export function generateShadeScale(hex) {
  const { C, H } = hexToOklch(hex);
  const lStops   = [0.970, 0.940, 0.882, 0.790, 0.680, 0.570, 0.460, 0.360, 0.260, 0.170, 0.110];
  const cFactors = [0.12,  0.22,  0.38,  0.62,  0.85,  1.00,  0.95,  0.85,  0.72,  0.58,  0.45];
  const names    = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  return names.map((name, i) => {
    const l = lStops[i];
    const c = Math.min(C * cFactors[i], 0.32);
    return { name, l, c, h: H, css: `oklch(${l.toFixed(3)} ${c.toFixed(4)} ${H.toFixed(2)})` };
  });
}
