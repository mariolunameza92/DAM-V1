// Exports: folderSVG(), lighten(), imgLabel(), formatBytes(), fileExt()
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
  return src.split('/').pop().replace(/-[A-Za-z0-9]{10,12}-unsplash\.jpg$/, '').replace(/-/g, ' ');
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
