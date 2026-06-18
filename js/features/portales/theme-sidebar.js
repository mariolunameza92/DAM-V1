// [THEME-SIDEBAR] Archivo nuevo — eliminar import en portal-screen.js para revertir.
// Exports: mountThemeSidebar(portalEl, baseConfig, reapplyFn)
// No importa nada de portal-screen.js para evitar dependencia circular.
// reapplyFn = _applyPortalTheme, pasado por referencia desde portal-screen.js.

const FONTS = ['Google Sans', 'Georgia', 'Space Mono', 'Trebuchet MS'];

let _portalEl   = null;
let _baseConfig = {};
let _custom     = {};
let _mode       = 'auto';
let _reapply    = null;

export function mountThemeSidebar(portalEl, baseConfig, reapplyFn) {
  _unmount();
  _portalEl   = portalEl;
  _baseConfig = { ...baseConfig };
  _mode       = 'auto';
  _reapply    = reapplyFn;
  _custom     = _buildInitialCustom(baseConfig);

  const panel = document.createElement('div');
  panel.id        = 'ts-panel';
  panel.className = 'ts-panel';
  document.body.appendChild(panel);
  panel.innerHTML = _buildHTML();
  _bindEvents(panel);
  requestAnimationFrame(() => panel.classList.add('ts-panel--open'));
}

function _unmount() {
  document.getElementById('ts-panel')?.remove();
  if (_portalEl) {
    delete _portalEl.dataset.custom;
    _portalEl = null;
  }
}

// Pre-llena los valores del modo manual desde el acento y tema del modo auto.
// El usuario parte de una base con contraste garantizado, no desde cero.
function _buildInitialCustom(cfg) {
  const isDark = (cfg.theme || 'light') === 'dark';
  return {
    bg:              isDark ? '#0f1117' : '#ffffff',
    titleColor:      isDark ? '#f6f7f9' : '#1a1d27',
    subtitleColor:   isDark ? '#b0b7c9' : '#515c78',
    btnPrimaryBg:    cfg.accent || '#22252f',
    btnPrimaryColor: isDark ? '#0f1117' : '#ffffff',
    btnSecBg:        isDark ? '#252934' : '#ecedf2',
    btnSecColor:     isDark ? '#d5d9e2' : '#3b4255',
    dorsalBg:        isDark ? '#1a1d24' : '#f0f2f7',
    dorsalBorder:    isDark ? '#3b4255' : '#d5d9e2',
    chipBg:          isDark ? '#252934' : '#f6f7f9',
    chipBorder:      isDark ? '#3b4255' : '#e0e3ec',
    chipColor:       isDark ? '#d5d9e2' : '#515c78',
    fontHeadline:    cfg.font || 'Google Sans',
    fontBody:        cfg.font || 'Google Sans',
  };
}

// ── HTML builders ─────────────────────────────────────────────────────────────

function _colorField(label, key, val) {
  return `
    <div class="ts-field">
      <span class="ts-label">${label}</span>
      <div class="ts-color-row">
        <div class="ts-swatch" data-swatch="${key}" style="background:${val}" title="Abrir selector"></div>
        <input type="color" class="ts-color-picker" data-key="${key}" value="${val}">
        <input type="text"  class="ts-hex-input"    data-hex="${key}"  value="${val}" maxlength="7" placeholder="#000000" spellcheck="false">
      </div>
    </div>`;
}

function _fontField(label, key, val) {
  return `
    <div class="ts-field">
      <span class="ts-label">${label}</span>
      <select class="ts-font-sel" data-key="${key}">
        ${FONTS.map(f => `<option${f === val ? ' selected' : ''}>${f}</option>`).join('')}
      </select>
    </div>`;
}

function _buildHTML() {
  const acc    = _baseConfig.accent || '#22252f';
  const isDark = (_baseConfig.theme || 'light') === 'dark';
  const c      = _custom;

  return `
    <div class="ts-head">
      <span class="ts-title">Diseño del portal</span>
      <button class="ts-close" id="ts-close"><span class="msi xs">close</span></button>
    </div>

    <div class="ts-mode-toggle">
      <button class="ts-mode-btn ts-mode-btn--active" data-mode="auto">Auto</button>
      <button class="ts-mode-btn" data-mode="manual">Personalizado</button>
    </div>

    <!-- AUTO -->
    <div class="ts-body" id="ts-body-auto">
      <div class="ts-section">
        <div class="ts-section-title">Color de acento</div>
        <div class="ts-color-row">
          <div class="ts-swatch" id="ts-auto-swatch" style="background:${acc}" title="Abrir selector"></div>
          <input type="color" id="ts-auto-picker" value="${acc}">
          <input type="text"  id="ts-auto-hex"    value="${acc}" maxlength="7" placeholder="#22252f" class="ts-hex-input" spellcheck="false">
        </div>
      </div>
      <div class="ts-section">
        <div class="ts-section-title">Modo</div>
        <div class="ts-theme-row">
          <button class="ts-theme-btn${!isDark ? ' ts-theme-btn--active' : ''}" data-theme="light">
            <span class="msi xs">light_mode</span>Light
          </button>
          <button class="ts-theme-btn${isDark ? ' ts-theme-btn--active' : ''}" data-theme="dark">
            <span class="msi xs">dark_mode</span>Dark
          </button>
        </div>
      </div>
    </div>

    <!-- MANUAL -->
    <div class="ts-body ts-body--hidden" id="ts-body-manual">
      <div class="ts-section">
        <div class="ts-section-title">Fondo</div>
        ${_colorField('Color de fondo', 'bg', c.bg)}
      </div>
      <div class="ts-section">
        <div class="ts-section-title">Título</div>
        ${_fontField('Tipo de letra', 'fontHeadline', c.fontHeadline)}
        ${_colorField('Color de texto', 'titleColor', c.titleColor)}
      </div>
      <div class="ts-section">
        <div class="ts-section-title">Subtítulo, tabs y footer</div>
        ${_fontField('Tipo de letra', 'fontBody', c.fontBody)}
        ${_colorField('Color de texto', 'subtitleColor', c.subtitleColor)}
      </div>
      <div class="ts-section">
        <div class="ts-section-title">Botón primario</div>
        ${_colorField('Color de fondo', 'btnPrimaryBg', c.btnPrimaryBg)}
        ${_colorField('Color de texto', 'btnPrimaryColor', c.btnPrimaryColor)}
      </div>
      <div class="ts-section">
        <div class="ts-section-title">Botón secundario</div>
        ${_colorField('Color de fondo', 'btnSecBg', c.btnSecBg)}
        ${_colorField('Color de texto', 'btnSecColor', c.btnSecColor)}
      </div>
      <div class="ts-section">
        <div class="ts-section-title">Campo # dorsal</div>
        ${_colorField('Color de fondo', 'dorsalBg', c.dorsalBg)}
        ${_colorField('Color de borde', 'dorsalBorder', c.dorsalBorder)}
      </div>
      <div class="ts-section">
        <div class="ts-section-title">Chips</div>
        ${_colorField('Color de texto', 'chipColor', c.chipColor)}
        ${_colorField('Color de fondo', 'chipBg', c.chipBg)}
        ${_colorField('Color de borde', 'chipBorder', c.chipBorder)}
      </div>
    </div>

    <div class="ts-footer">
      <button class="ts-save-btn" id="ts-save">
        <span class="msi xs">check</span>Guardar cambios
      </button>
    </div>`;
}

// ── Event binding ─────────────────────────────────────────────────────────────

function _bindEvents(panel) {
  // Cerrar
  panel.querySelector('#ts-close').addEventListener('click', _unmount);

  // Toggle de modo
  panel.querySelectorAll('.ts-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => _switchMode(panel, btn.dataset.mode));
  });

  // AUTO: swatch abre el picker nativo
  panel.querySelector('#ts-auto-swatch').addEventListener('click', () => {
    panel.querySelector('#ts-auto-picker').click();
  });

  // AUTO: color picker
  const autoPicker = panel.querySelector('#ts-auto-picker');
  const autoHex    = panel.querySelector('#ts-auto-hex');
  const autoSwatch = panel.querySelector('#ts-auto-swatch');

  autoPicker.addEventListener('input', e => {
    const v = e.target.value;
    autoHex.value = v;
    autoSwatch.style.background = v;
    _baseConfig.accent = v;
    _reapply?.(_portalEl, v, _baseConfig.theme || 'light');
  });

  autoHex.addEventListener('input', e => {
    const v = e.target.value;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      autoPicker.value = v;
      autoSwatch.style.background = v;
      _baseConfig.accent = v;
      _reapply?.(_portalEl, v, _baseConfig.theme || 'light');
    }
  });

  // AUTO: tema light/dark
  panel.querySelectorAll('.ts-theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      panel.querySelectorAll('.ts-theme-btn').forEach(b => b.classList.remove('ts-theme-btn--active'));
      btn.classList.add('ts-theme-btn--active');
      _baseConfig.theme = btn.dataset.theme;
      _reapply?.(_portalEl, _baseConfig.accent, _baseConfig.theme);
    });
  });

  // MANUAL: swatches abren su picker
  panel.querySelectorAll('.ts-swatch[data-swatch]').forEach(swatch => {
    swatch.addEventListener('click', () => {
      panel.querySelector(`.ts-color-picker[data-key="${swatch.dataset.swatch}"]`)?.click();
    });
  });

  // MANUAL: color pickers
  panel.querySelectorAll('.ts-color-picker').forEach(picker => {
    picker.addEventListener('input', e => {
      const key = e.target.dataset.key;
      const v   = e.target.value;
      _custom[key] = v;
      const hex    = panel.querySelector(`.ts-hex-input[data-hex="${key}"]`);
      const swatch = panel.querySelector(`.ts-swatch[data-swatch="${key}"]`);
      if (hex)    hex.value = v;
      if (swatch) swatch.style.background = v;
      _applyManual(_portalEl, _custom);
    });
  });

  // MANUAL: hex text inputs
  panel.querySelectorAll('.ts-hex-input[data-hex]').forEach(input => {
    input.addEventListener('input', e => {
      const v   = e.target.value;
      const key = e.target.dataset.hex;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        _custom[key] = v;
        const picker = panel.querySelector(`.ts-color-picker[data-key="${key}"]`);
        const swatch = panel.querySelector(`.ts-swatch[data-swatch="${key}"]`);
        if (picker) picker.value = v;
        if (swatch) swatch.style.background = v;
        _applyManual(_portalEl, _custom);
      }
    });
  });

  // MANUAL: font selectors
  panel.querySelectorAll('.ts-font-sel').forEach(sel => {
    sel.addEventListener('change', e => {
      _custom[e.target.dataset.key] = e.target.value;
      _applyManual(_portalEl, _custom);
    });
  });

  // Guardar
  panel.querySelector('#ts-save').addEventListener('click', () => {
    const btn  = panel.querySelector('#ts-save');
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="msi xs">check_circle</span>¡Guardado!';
    btn.classList.add('ts-save-btn--ok');
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.classList.remove('ts-save-btn--ok');
    }, 2000);
  });
}

function _switchMode(panel, newMode) {
  if (newMode === _mode) return;
  _mode = newMode;

  panel.querySelectorAll('.ts-mode-btn').forEach(b =>
    b.classList.toggle('ts-mode-btn--active', b.dataset.mode === newMode)
  );

  const bodyAuto   = panel.querySelector('#ts-body-auto');
  const bodyManual = panel.querySelector('#ts-body-manual');

  if (newMode === 'auto') {
    bodyAuto.classList.remove('ts-body--hidden');
    bodyManual.classList.add('ts-body--hidden');
    delete _portalEl.dataset.custom;
    // Restaura el tema auto desde los valores actuales del sidebar
    _reapply?.(_portalEl, _baseConfig.accent, _baseConfig.theme || 'light');
  } else {
    bodyAuto.classList.add('ts-body--hidden');
    bodyManual.classList.remove('ts-body--hidden');
    _portalEl.dataset.custom = '1';
    _applyManual(_portalEl, _custom);
  }
}

// ── _applyManual — setea CSS vars directo en el portal ───────────────────────

function _applyManual(el, c) {
  // Fondo — los tres vars de bg para cubrir light, dark y hero gradient
  el.style.setProperty('--portal-bg',          c.bg);
  el.style.setProperty('--portal-bg-whisper',   c.bg);
  el.style.setProperty('--portal-bg-deep',      c.bg);
  // Hero overlays: tinted versions del bg (8-digit hex válido en CSS Color Level 4)
  el.style.setProperty('--portal-hero-tint',      c.bg + '40');
  el.style.setProperty('--portal-hero-grad-top',  c.bg + '9a');
  el.style.setProperty('--portal-hero-grad-end',  c.bg + 'eb');

  // Título (CSS rules en theme-sidebar.css leen estos vars vía [data-custom="1"])
  el.style.setProperty('--portal-title-color', c.titleColor);
  el.style.setProperty('--portal-title-font',  `'${c.fontHeadline}', sans-serif`);

  // Subtítulo, tabs, footer
  el.style.setProperty('--portal-sub-color', c.subtitleColor);
  el.style.setProperty('--portal-sub-font',  `'${c.fontBody}', sans-serif`);

  // Botón primario (vars existentes — ya leídas por .p-buscar-btn, .p-selfie-btn)
  el.style.setProperty('--color-accent',       c.btnPrimaryBg);
  el.style.setProperty('--color-accent-hover', c.btnPrimaryBg);
  el.style.setProperty('--color-accent-text',  c.btnPrimaryColor);

  // Botón secundario (vars existentes — leídas por .p-secondary-cta)
  el.style.setProperty('--color-accent-dark',      c.btnSecBg);
  el.style.setProperty('--color-accent-dark-text', c.btnSecColor);

  // Campo dorsal (vars existentes — leídas por .p-dorsal-input-wrap)
  el.style.setProperty('--portal-glass-bg',     c.dorsalBg);
  el.style.setProperty('--portal-glass-border', c.dorsalBorder);

  // Chips (vars nuevas — leídas por reglas [data-custom="1"] en theme-sidebar.css)
  el.style.setProperty('--portal-chip-bg',     c.chipBg);
  el.style.setProperty('--portal-chip-border', c.chipBorder);
  el.style.setProperty('--portal-chip-color',  c.chipColor);
}
