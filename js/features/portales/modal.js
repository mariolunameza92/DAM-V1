// Exports: st (estado del modal), openModal(), closeModal(), showStep(n), goStep(n), tryGoStep(n), selectAccess(), handleAccent(), handleTheme(), handleLogo(), toggleInline(), renderFolderList(), toggleFolder(), filterFolders(), filterUnits(), toggleUnit(), selectPortalType(), copyLink(), onNameInput(), setDoneBtn(), prepareStep4(), resetCopyBtn(), selectSearchMethod()
import { FOLDERS_DATA } from '../../data.js';
import { generateShadeScale } from '../../utils.js';
import { getUnits } from '../../session.js';

export const st = {
  accent: '#22252f', font: 'Google Sans', access: 'public',
  theme: 'light', title: '', desc: '', selectedFolders: new Set(),
  logoSvgText: '', searchMethod: 'both',
  type: 'unit', selectedUnits: new Set(),
};

let _editingRow = null;
export function getEditingRow()   { return _editingRow; }
export function clearEditingRow() { _editingRow = null; }

function _setStep4ForType(isEdit) {
  const step4 = document.getElementById('step-4');
  if (!step4) return;
  const isMaster  = st.type === 'master';
  const typeName  = isMaster ? 'Master' : 'Portal';
  const titleEl   = step4.querySelector('.modal-title');
  const chipEl    = step4.querySelector('.success-chip');
  const submitEl  = step4.querySelector('.btn-submit');
  if (titleEl)  titleEl.textContent = isEdit ? `Editar ${typeName}` : `Crear ${typeName}`;
  if (chipEl)   chipEl.innerHTML    = isEdit
    ? `<span class="msi sm" style="color:#16a34a">check_circle</span>¡Cambios guardados!`
    : `<span class="msi sm" style="color:#16a34a">check_circle</span>¡${typeName} creado exitosamente!`;
  if (submitEl) submitEl.textContent = isEdit ? 'Guardar y ver' : `Ver ${typeName}`;
}

export function selectPortalType(type) {
  st.type = type;
  const folderSec = document.getElementById('folder-section');
  const unitSec   = document.getElementById('unit-section');
  const btnUnit   = document.getElementById('type-unit');
  const btnMaster = document.getElementById('type-master');
  if (folderSec) folderSec.style.display = type === 'unit' ? '' : 'none';
  if (unitSec)   unitSec.style.display   = type === 'master' ? '' : 'none';
  if (btnUnit)   btnUnit.classList.toggle('active', type === 'unit');
  if (btnMaster) btnMaster.classList.toggle('active', type === 'master');
  if (type === 'master') renderUnitList('');
  checkStep1();
}

export function renderUnitList(filter) {
  const q     = (filter || '').toLowerCase();
  const units = getUnits().filter(u => !q || u.title.toLowerCase().includes(q));
  const list  = document.getElementById('unitList');
  if (!list) return;
  if (units.length === 0) {
    list.innerHTML = `<div style="color:var(--text-muted);font-size:13px;padding:16px 0">Crea portales primero, luego agrégalos al master.</div>`;
    return;
  }
  list.innerHTML = units.map(u => {
    const sel = st.selectedUnits.has(u.id);
    return `<div class="f-row">
      <div class="f-icon"><span class="msi xs" style="color:var(--text-muted)">captive_portal</span></div>
      <div class="f-info"><span class="f-name">${u.title}</span></div>
      <button class="f-btn${sel ? ' added' : ''}" onclick="window.toggleUnit('${u.id}')">
        ${sel ? `<span class="msi xs" style="color:white;font-size:13px">check</span>` : `<span class="msi xs">add</span>`}
      </button>
    </div>`;
  }).join('');
}

export function toggleUnit(id) {
  if (st.selectedUnits.has(id)) st.selectedUnits.delete(id);
  else st.selectedUnits.add(id);
  renderUnitList(document.getElementById('inp-unit-search')?.value || '');
  checkStep1();
}

export function filterUnits(val) { renderUnitList(val); }

export function openModal() {
  _editingRow = null;
  _setStep4ForType(false);
  st.selectedFolders = new Set();
  st.selectedUnits   = new Set();
  st.type = 'unit';
  st.accent = '#22252f'; st.font = 'Google Sans'; st.access = 'public';
  st.theme = 'light'; st.title = ''; st.desc = ''; st.searchMethod = 'both';
  selectSearchMethod('both');
  selectPortalType('unit');

  document.getElementById('inp-name').value   = '';
  document.getElementById('inp-search').value = '';
  const unitSearch = document.getElementById('inp-unit-search');
  if (unitSearch) unitSearch.value = '';
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

  // Pre-medir todos los pasos (overlay aún invisible) para fijar minHeight desde el inicio.
  // El overlay tiene opacity:0 en este punto, no hay flash visual.
  const modal = document.querySelector('.modal');
  modal.style.minHeight = '';
  let maxStepH = 0;
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById('step-' + i);
    if (!el) continue;
    el.style.display = 'block';
    [1, 2, 3, 4, 5].forEach(j => {
      const s = document.getElementById('step-' + j);
      if (s && j !== i) s.style.display = 'none';
    });
    maxStepH = Math.max(maxStepH, modal.offsetHeight);
  }
  modal.style.minHeight = maxStepH + 'px';

  showStep(1);
  checkStep1();
  _updateAccentPreview();
  document.getElementById('overlay').classList.add('open');
}

export function closeModal() {
  document.getElementById('overlay').classList.remove('open');
  document.querySelector('.modal').style.minHeight = '';
}

export function showStep(n) {
  [1, 2, 3, 4, 5].forEach(i => {
    const el = document.getElementById('step-' + i);
    if (el) el.style.display = i === n ? 'block' : 'none';
  });
  for (let p = 1; p <= 5; p++) for (let d = 1; d <= 5; d++) {
    const el = document.getElementById(`d${p}-${d}`);
    if (el) el.className = 'step-dot' + (d === n ? ' active' : '');
  }
  // Modal solo crece: offsetHeight fuerza reflow síncrono, no requiere rAF
  const modal = document.querySelector('.modal');
  const h = modal.offsetHeight;
  const current = parseFloat(modal.style.minHeight) || 0;
  if (h > current) modal.style.minHeight = h + 'px';
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
  const hasName = document.getElementById('inp-name').value.trim().length > 0;
  if (st.type === 'master') return hasName; // units are optional for masters
  return hasName && st.selectedFolders.size > 0;
}

export function checkStep1() {
  const ok  = _canContinueStep1();
  const btn = document.getElementById('btn1next');
  btn.disabled      = !ok;
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
      <div class="f-icon"><span class="msi xs" style="color:var(--text-muted)">folder</span></div>
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

export function selectSearchMethod(method) {
  st.searchMethod = method;
  ['both', 'faceid', 'dorsal'].forEach(m =>
    document.getElementById('search-' + m)?.classList.toggle('active', m === method)
  );
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
  _setStep4ForType(!!_editingRow);
  resetCopyBtn();
}

export function resetCopyBtn() {
  const btn = document.getElementById('copy-btn');
  if (!btn) return;
  btn.className = 's-btn';
  btn.innerHTML = `<span class="msi xs">content_copy</span>`;
}

export function openModalEdit(rowEl) {
  _editingRow = rowEl;
  const accent     = rowEl.dataset.portalAccent  || '#22252f';
  const title      = rowEl.dataset.portalTitle   || '';
  const theme      = rowEl.dataset.portalTheme   || 'light';
  const portalType = rowEl.dataset.portalType    || 'unit';
  const folderIds  = (rowEl.dataset.portalFolders  || '').split(',').filter(Boolean);
  const unitIds    = (rowEl.dataset.unitPortalIds   || '').split(',').filter(Boolean);

  st.selectedFolders = new Set(folderIds);
  st.selectedUnits   = new Set(unitIds);
  st.type = portalType;
  st.accent = accent; st.font = 'Google Sans'; st.access = 'public';
  st.theme = theme; st.title = title; st.desc = ''; st.logoSvgText = '';
  st.searchMethod = rowEl.dataset.portalSearch || 'both';
  selectSearchMethod(st.searchMethod);

  document.getElementById('inp-name').value   = title;
  document.getElementById('inp-search').value = '';
  const unitSearch = document.getElementById('inp-unit-search');
  if (unitSearch) unitSearch.value = '';
  document.getElementById('inp-pwd').value    = '';
  document.getElementById('inp-title').value  = '';
  document.getElementById('inp-desc').value   = '';
  document.getElementById('inp-accent').value = '';
  document.getElementById('pwd-wrap').style.display    = 'none';
  document.getElementById('title-wrap').style.display  = 'none';
  document.getElementById('desc-wrap').style.display   = 'none';
  document.getElementById('accent-wrap').style.display = 'none';
  document.getElementById('logo-preview').style.display = 'none';
  document.getElementById('color-dot').style.background = accent;
  document.getElementById('color-picker').value = /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : '#22252f';
  document.getElementById('font-sel').value = 'Google Sans';
  document.getElementById('rc-pub').classList.add('sel');
  document.getElementById('rc-priv').classList.remove('sel');
  document.getElementById('theme-light').classList.toggle('active', theme === 'light');
  document.getElementById('theme-dark').classList.toggle('active', theme === 'dark');
  setDoneBtn('logo-add', false); setDoneBtn('accent-add', false);
  setDoneBtn('title-add', false); setDoneBtn('desc-add', false);

  resetCopyBtn();
  renderFolderList('');
  selectPortalType(portalType);
  _setStep4ForType(true);
  showStep(1);
  checkStep1();
  _checkContrastWarning();
  _updateAccentPreview();
  document.getElementById('overlay').classList.add('open');
}

export function copyLink() {
  const slug = document.getElementById('url-slug').textContent;
  if (navigator.clipboard) navigator.clipboard.writeText('https://len.pe/portal/' + slug);
  const btn = document.getElementById('copy-btn');
  btn.className = 's-btn done';
  btn.innerHTML = `<span class="msi xs" style="color:white;font-size:13px">check</span>`;
}
