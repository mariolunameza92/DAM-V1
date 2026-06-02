// Exports: st (estado del modal), openModal(), closeModal(), showStep(n), goStep(n), tryGoStep(n), selectAccess(), handleAccent(), handleLogo(), toggleInline(), renderFolderList(), toggleFolder(), filterFolders(), copyLink(), onNameInput(), setDoneBtn(), prepareStep4(), resetCopyBtn()
import { FOLDERS_DATA } from '../../data.js';
import { generateShadeScale } from '../../utils.js';

export const st = {
  accent: '#22252f', font: 'Google Sans', access: 'public',
  theme: 'light', title: '', desc: '', selectedFolders: new Set(),
  logoSvgText: '',
};

export function openModal() {
  st.selectedFolders = new Set();
  st.accent = '#22252f'; st.font = 'Google Sans'; st.access = 'public';
  st.theme = 'light'; st.title = ''; st.desc = '';

  document.getElementById('inp-name').value   = '';
  document.getElementById('inp-search').value = '';
  document.getElementById('inp-pwd').value    = '';
  document.getElementById('inp-title').value  = '';
  document.getElementById('inp-desc').value   = '';
  document.getElementById('inp-accent').value = '';
  document.getElementById('pwd-wrap').style.display    = 'none';
  document.getElementById('title-wrap').style.display  = 'none';
  document.getElementById('desc-wrap').style.display   = 'none';
  document.getElementById('accent-wrap').style.display = 'none';
  document.getElementById('logo-preview').style.display = 'none';
  st.logoSvgText = '';
  document.getElementById('color-dot').style.background = '#22252f';
  document.getElementById('color-picker').value = '#22252f';
  document.getElementById('font-sel').value = 'Google Sans';
  document.getElementById('rc-pub').classList.add('sel');
  document.getElementById('rc-priv').classList.remove('sel');
  document.getElementById('theme-light').classList.add('active');
  document.getElementById('theme-dark').classList.remove('active');
  setDoneBtn('logo-add', false);
  setDoneBtn('accent-add', false);
  setDoneBtn('title-add', false);
  setDoneBtn('desc-add', false);

  resetCopyBtn();
  renderFolderList('');
  showStep(1);
  checkStep1();
  _updateAccentPreview();
  document.getElementById('overlay').classList.add('open');
}

export function closeModal() {
  document.getElementById('overlay').classList.remove('open');
}

export function showStep(n) {
  [1, 2, 3, 4].forEach(i => {
    document.getElementById('step-' + i).style.display = i === n ? 'block' : 'none';
  });
  for (let p = 1; p <= 4; p++) for (let d = 1; d <= 4; d++) {
    const el = document.getElementById(`d${p}-${d}`);
    if (el) el.className = 'step-dot' + (d === n ? ' active' : '');
  }
}

export function goStep(n) {
  if (n === 4) prepareStep4();
  showStep(n);
}

export function tryGoStep(n) {
  if (n === 2 && !_canContinueStep1()) return;
  goStep(n);
}

function _canContinueStep1() {
  return document.getElementById('inp-name').value.trim().length > 0 && st.selectedFolders.size > 0;
}

export function checkStep1() {
  const ok  = _canContinueStep1();
  const btn = document.getElementById('btn1next');
  btn.disabled    = !ok;
  btn.style.opacity = ok ? '1' : '.4';
  btn.style.cursor  = ok ? 'pointer' : 'default';
}

export function onNameInput() { checkStep1(); }

export function renderFolderList(filter) {
  const q = filter.toLowerCase();
  const items = FOLDERS_DATA.filter(f => !q || f.name.toLowerCase().includes(q));
  document.getElementById('folderList').innerHTML = items.map(f => {
    const sel = st.selectedFolders.has(f.id);
    return `<div class="f-row">
      <div class="f-icon"><span class="msi xs" style="color:var(--g500)">folder</span></div>
      <div class="f-info"><span class="f-name">${f.name}</span><span class="f-count">${f.count}</span></div>
      <button class="f-btn${sel ? ' added' : ''}" onclick="window.toggleFolder('${f.id}')">
        ${sel ? `<span class="msi xs" style="color:white;font-size:13px">check</span>` : `<span class="msi xs">add</span>`}
      </button>
    </div>`;
  }).join('');
}

export function toggleFolder(id) {
  if (st.selectedFolders.has(id)) st.selectedFolders.delete(id);
  else st.selectedFolders.add(id);
  renderFolderList(document.getElementById('inp-search').value);
  checkStep1();
}

export function filterFolders(val) { renderFolderList(val); }

export function selectAccess(type) {
  st.access = type;
  document.getElementById('rc-pub').className  = 'radio-circle' + (type === 'public'  ? ' sel' : '');
  document.getElementById('rc-priv').className = 'radio-circle' + (type === 'private' ? ' sel' : '');
  document.getElementById('pwd-wrap').style.display = type === 'private' ? 'block' : 'none';
}

export function handleAccent(val) {
  st.accent = val;
  const dot    = document.getElementById('color-dot');
  const picker = document.getElementById('color-picker');
  if (dot) dot.style.background = val;
  if (picker && /^#[0-9a-fA-F]{6}$/.test(val)) picker.value = val;
  _checkContrastWarning();
  _updateAccentPreview();
}

export function handleTheme(val) {
  st.theme = val;
  document.getElementById('theme-light').classList.toggle('active', val === 'light');
  document.getElementById('theme-dark').classList.toggle('active', val === 'dark');
  _checkContrastWarning();
  _updateAccentPreview();
}

function _relativeLuminance(hex) {
  hex = hex.replace(/^#/, '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return 1;
  const r = parseInt(hex.slice(0,2),16)/255;
  const g = parseInt(hex.slice(2,4),16)/255;
  const b = parseInt(hex.slice(4,6),16)/255;
  const lin = v => v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
  return 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);
}

function _checkContrastWarning() {
  const warn = document.getElementById('contrast-warn');
  if (!warn) return;
  const show = st.theme === 'dark' && _relativeLuminance(st.accent) < 0.20;
  warn.style.display = show ? '' : 'none';
}

function _updateAccentPreview() {
  const strip = document.getElementById('ap-swatches');
  if (!strip) return;

  const shades = generateShadeScale(st.accent || '#22252f');

  strip.innerHTML = shades.map(s =>
    `<div style="flex:1;background:${s.css}"></div>`
  ).join('');

  // Light context always uses 600/100 stops
  const lp = shades[6], ls = shades[1], lsT = shades[7];
  _apPreviewBtn('ap-lp', lp.css,  `oklch(${lp.l >= 0.62 ? 0.15 : 0.99} 0 0)`);
  _apPreviewBtn('ap-ls', ls.css,  lsT.css);

  // Dark context always uses 500/800 stops
  const dp = shades[5], ds = shades[8], dsT = shades[2];
  _apPreviewBtn('ap-dp', dp.css,  `oklch(${dp.l >= 0.62 ? 0.15 : 0.99} 0 0)`);
  _apPreviewBtn('ap-ds', ds.css,  dsT.css);
}

function _apPreviewBtn(id, bg, color) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.background = bg;
  el.style.color      = color;
}

export function handleLogo(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  document.getElementById('logo-img').src = URL.createObjectURL(file);
  document.getElementById('logo-preview').style.display = 'block';
  setDoneBtn('logo-add', true);

  const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
  if (isSvg) {
    const reader = new FileReader();
    reader.onload = e => { st.logoSvgText = e.target.result; };
    reader.readAsText(file);
  } else {
    st.logoSvgText = '';
  }
}

export function toggleInline(wrapId, btnId, inputId) {
  const wrap = document.getElementById(wrapId);
  const open = wrap.style.display === 'block';
  wrap.style.display = open ? 'none' : 'block';
  setDoneBtn(btnId, !open);
  if (!open) document.getElementById(inputId).focus();
}

export function setDoneBtn(id, done) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.className = 't-add' + (done ? ' done' : '');
  btn.innerHTML = done
    ? `<span class="msi xs" style="color:white;font-size:13px">check</span>`
    : `<span class="msi xs">add</span>`;
}

export function prepareStep4() {
  const raw = document.getElementById('inp-name').value.trim();
  document.getElementById('url-slug').textContent =
    raw.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'mi-portal';
  resetCopyBtn();
}

export function resetCopyBtn() {
  const btn = document.getElementById('copy-btn');
  if (!btn) return;
  btn.className = 's-btn';
  btn.innerHTML = `<span class="msi xs">content_copy</span>`;
}

export function copyLink() {
  const slug = document.getElementById('url-slug').textContent;
  if (navigator.clipboard) navigator.clipboard.writeText('https://len.pe/portal/' + slug);
  const btn = document.getElementById('copy-btn');
  btn.className = 's-btn done';
  btn.innerHTML = `<span class="msi xs" style="color:white;font-size:13px">check</span>`;
}
