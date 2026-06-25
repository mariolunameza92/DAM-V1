// Filter chip popovers for the inicio section
// Handles: Face ID, Marca, Objeto, Color, Orientación, # Personas, Consentimiento

import { activateFaceFilter } from './inicio.js';
import { getFaces } from '../../faces.js';
import { uploadedAssets, userUploadedAssets } from '../../session.js';
import { assetCardHTML, assetListRowHTML } from '../shared/asset-card.js';
import { registerSection } from '../shared/image-registry.js';
import { bindDynamicToggle, viewToggleHTML } from '../../components/atoms/view-toggle.js';
import { getNumCols } from '../../utils.js';

const MARCAS = [
  // Deportivas
  { id: 'nike',        label: 'Nike',          cat: 'sport', img: 'assets/marcas/nike.png' },
  { id: 'adidas',      label: 'Adidas',        cat: 'sport', img: 'assets/marcas/adidas.png' },
  { id: 'puma',        label: 'Puma',          cat: 'sport', img: 'assets/marcas/puma.png' },
  { id: 'asics',       label: 'ASICS',         cat: 'sport', img: 'assets/marcas/asics.png' },
  { id: 'new_balance', label: 'New Balance',   cat: 'sport', img: 'assets/marcas/new_balance.png' },
  // Automotriz
  { id: 'audi',        label: 'Audi',          cat: 'auto', img: 'assets/marcas/audi.png' },
  { id: 'volkswagen',  label: 'Volkswagen',    cat: 'auto', img: 'assets/marcas/volkswagen.png' },
  { id: 'porsche',     label: 'Porsche',       cat: 'auto', img: 'assets/marcas/porsche.png' },
  { id: 'bmw',         label: 'BMW',           cat: 'auto', img: 'assets/marcas/bmw.png' },
  { id: 'mercedes',    label: 'Mercedes-Benz', cat: 'auto', img: 'assets/marcas/mercedes.png' },
];

const OBJETOS = ['Trofeo', 'Vehículo', 'Electrónico', 'Ropa', 'Bandera', 'Comida', 'Podio', 'Micrófono'];

const COLORES = [
  { id: 'rojo',      label: 'Rojo',      hex: '#e53935' },
  { id: 'naranja',   label: 'Naranja',   hex: '#fb8c00' },
  { id: 'amarillo',  label: 'Amarillo',  hex: '#fdd835' },
  { id: 'verde',     label: 'Verde',     hex: '#43a047' },
  { id: 'celeste',   label: 'Celeste',   hex: '#29b6f6' },
  { id: 'azul',      label: 'Azul',      hex: '#3b82f6' },
  { id: 'morado',    label: 'Morado',    hex: '#8e24aa' },
  { id: 'rosa',      label: 'Rosa',      hex: '#e91e8c' },
  { id: 'blanco',    label: 'Blanco',    hex: '#f5f5f5', border: true },
  { id: 'gris',      label: 'Gris',      hex: '#9e9e9e' },
  { id: 'negro',     label: 'Negro',     hex: '#212121' },
];

const PERSONAS_OPTS = [
  { id: 'solo',      label: 'Solo (1)' },
  { id: 'dupla',     label: 'Dupla (2)' },
  { id: 'grupo',     label: 'Grupo (3–9)' },
  { id: 'multitud',  label: 'Multitud (10+)' },
  { id: 'none',      label: 'Sin personas' },
];

const CONSENT_OPTS = [
  { id: 'content',   label: 'Generación de contenido' },
  { id: 'interno',   label: 'Comunicación interna' },
  { id: 'portal',    label: 'Publicación en portal' },
  { id: 'social',    label: 'Publicación en redes sociales' },
];

// ── Filter state ──────────────────────────────────────────────────────────────

const _state = {
  marca:          new Set(),
  objeto:         new Set(),
  color:          new Set(),
  orientacion:    null,
  personas:       null,
  consentimiento: new Set(),
  allCanales:     false,
};

// ── Popover singleton ─────────────────────────────────────────────────────────

let _openChipId = null;
let _popoverEl  = null;

function _getOrCreatePopover() {
  if (_popoverEl) return _popoverEl;

  _popoverEl = document.createElement('div');
  _popoverEl.id = 'chip-popover';
  _popoverEl.className = 'chip-popover';
  _popoverEl.style.display = 'none';
  document.body.appendChild(_popoverEl);

  document.addEventListener('click', e => {
    if (!_popoverEl || _popoverEl.style.display === 'none') return;
    if (_popoverEl.contains(e.target)) return;
    if (e.target.closest('.filter-chip')) return;
    _closePopover();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') _closePopover();
  });

  return _popoverEl;
}

function _positionPopover(chipEl) {
  const pop = _popoverEl;
  const rect = chipEl.getBoundingClientRect();
  pop.style.top  = `${rect.bottom + 8}px`;
  pop.style.left = `${rect.left}px`;
  pop.style.display = '';
  // Clamp right edge after paint
  requestAnimationFrame(() => {
    const pr = pop.getBoundingClientRect();
    if (pr.right > window.innerWidth - 16) {
      pop.style.left = `${window.innerWidth - 16 - pr.width}px`;
    }
  });
}

function _closePopover() {
  if (_popoverEl) _popoverEl.style.display = 'none';
  _openChipId = null;
}

// ── Chip active state ─────────────────────────────────────────────────────────

function _updateChip(chipId, count) {
  const chip = document.getElementById(chipId);
  if (!chip) return;
  if (count > 0) {
    chip.classList.add('filter-chip--active');
    let badge = chip.querySelector('.chip-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'chip-badge';
      chip.appendChild(badge);
    }
    badge.textContent = count;
  } else {
    chip.classList.remove('filter-chip--active');
    chip.querySelector('.chip-badge')?.remove();
  }
}

// ── Active filter tags bar ────────────────────────────────────────────────────

function _updateActiveBar() {
  const bar = document.getElementById('active-filters-bar');
  if (!bar) return;

  const tags = [];

  _state.marca.forEach(id => {
    const m = MARCAS.find(x => x.id === id);
    if (m) tags.push({ key: `marca:${id}`, label: m.label, icon: 'copyright', color: null });
  });

  _state.objeto.forEach(obj => {
    tags.push({ key: `objeto:${obj}`, label: obj, icon: 'toys', color: null });
  });

  _state.color.forEach(id => {
    const c = COLORES.find(x => x.id === id);
    const hex = c ? c.hex : (id.startsWith('hex_') ? `#${id.slice(4)}` : null);
    const label = c ? c.label : (id.startsWith('hex_') ? `#${id.slice(4)}` : id);
    if (hex) tags.push({ key: `color:${id}`, label, icon: null, color: hex });
  });

  if (_state.orientacion) {
    const labels = { horizontal: 'Horizontal', vertical: 'Vertical', cuadrada: 'Cuadrada' };
    tags.push({ key: `orientacion:${_state.orientacion}`, label: labels[_state.orientacion], icon: 'crop_rotate', color: null });
  }

  if (_state.personas) {
    const p = PERSONAS_OPTS.find(x => x.id === _state.personas);
    const label = p ? p.label : _state.personas;
    tags.push({ key: `personas:${_state.personas}`, label, icon: 'groups', color: null });
  }

  if (_state.allCanales) {
    tags.push({ key: 'consentimiento:all', label: 'Todos los canales', icon: 'verified_user', color: null });
  } else {
    _state.consentimiento.forEach(id => {
      const c = CONSENT_OPTS.find(x => x.id === id);
      if (c) tags.push({ key: `consentimiento:${id}`, label: c.label, icon: 'verified_user', color: null });
    });
  }

  if (tags.length === 0) {
    bar.innerHTML = '';
    bar.style.display = 'none';
    _syncFilterResultsPanel();
    return;
  }

  bar.style.display = '';
  bar.innerHTML = tags.map(tag => `
    <div class="active-filter-tag" data-key="${tag.key}">
      ${tag.color
        ? `<span class="aft-dot" style="background:${tag.color};${tag.color === '#f5f5f5' ? 'border:1px solid var(--border);' : ''}"></span>`
        : `<span class="msi xs">${tag.icon}</span>`
      }
      <span class="aft-label">${tag.label}</span>
      <button class="aft-remove" aria-label="Quitar filtro"><span class="msi xs">close</span></button>
    </div>
  `).join('');

  bar.querySelectorAll('.aft-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      _removeFilter(btn.closest('.active-filter-tag').dataset.key);
    });
  });

  _syncFilterResultsPanel();
}

// ── Fake filter results panel ─────────────────────────────────────────────────

let _otherFilterView = 'grid';

function _hasOtherFilters() {
  return _state.marca.size > 0 || _state.objeto.size > 0 || _state.color.size > 0 ||
         _state.orientacion !== null || _state.personas !== null ||
         _state.consentimiento.size > 0 || _state.allCanales;
}

function _seededShuffle(arr, seed) {
  const copy = [...arr];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = copy.length - 1; i > 0; i--) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const j = h % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function _buildFilterLabel() {
  const parts = [];
  if (_state.marca.size)
    parts.push(MARCAS.filter(m => _state.marca.has(m.id)).map(m => m.label).join(', '));
  if (_state.objeto.size)
    parts.push([..._state.objeto].join(', '));
  if (_state.color.size) {
    const labels = [..._state.color].map(id => {
      const c = COLORES.find(x => x.id === id);
      return c ? c.label : `#${id.slice(4)}`;
    });
    parts.push(labels.join(', '));
  }
  if (_state.orientacion)
    parts.push({ horizontal: 'Horizontal', vertical: 'Vertical', cuadrada: 'Cuadrada' }[_state.orientacion]);
  if (_state.personas) {
    const p = PERSONAS_OPTS.find(x => x.id === _state.personas);
    parts.push(p ? p.label : _state.personas.replace('rango_', '').replace('-', '–') + ' personas');
  }
  if (_state.allCanales) parts.push('Todos los canales');
  else _state.consentimiento.forEach(id => {
    const c = CONSENT_OPTS.find(x => x.id === id);
    if (c) parts.push(c.label);
  });
  return parts.join(' · ');
}

function _drawOtherFilterResults(el, assets) {
  if (!assets.length) {
    el.innerHTML = `<p class="face-results-header" style="margin-top:32px">No hay imágenes cargadas aún.</p>`;
    return;
  }
  const label = _buildFilterLabel();
  const numCols = getNumCols();
  const colData = Array.from({ length: numCols }, () => []);
  assets.forEach((a, i) => colData[i % numCols].push({ a, i }));

  const contentHTML = _otherFilterView === 'grid'
    ? `<div class="masonry-cols">${colData.map(col =>
        `<div class="masonry-col">${col.map(({ a, i }) => assetCardHTML(a, 'filter-results', i)).join('')}</div>`
      ).join('')}</div>`
    : `<div class="file-list">${assets.map((a, i) => assetListRowHTML(a, 'filter-results', i)).join('')}</div>`;

  el.innerHTML =
    `<div class="face-results-header-row">
      <div class="face-results-header">
        <span class="msi xs">filter_list</span>&nbsp;${assets.length} resultados&nbsp;·&nbsp;<strong>${label}</strong>
      </div>
      ${viewToggleHTML(_otherFilterView)}
    </div>` + contentHTML;

  bindDynamicToggle(el, v => { _otherFilterView = v; _drawOtherFilterResults(el, assets); });
}

function _syncFilterResultsPanel() {
  const el  = document.getElementById('other-filter-results');
  const sec = document.getElementById('sec-inicio');
  if (!el || !sec) return;

  const faceActive  = !!document.querySelector('.face-chip-active');
  const otherActive = _hasOtherFilters();

  if (!otherActive || faceActive) {
    el.style.display = 'none';
    el.innerHTML = '';
    if (!faceActive) {
      sec.querySelector('.face-stats-row')?.style.setProperty('display', '');
      sec.querySelectorAll('.inicio-section').forEach(s => s.style.setProperty('display', ''));
    }
    return;
  }

  // Hide regular sections while filter is active
  sec.querySelector('.face-stats-row').style.display = 'none';
  sec.querySelectorAll('.inicio-section').forEach(s => { s.style.display = 'none'; });

  const allAssets = [
    ...Object.values(uploadedAssets).flat(),
    ...Object.values(userUploadedAssets).flat(),
  ];

  const seed     = [..._state.marca, ..._state.objeto, ..._state.color,
                    _state.orientacion || '', _state.personas || ''].join('|');
  const shuffled = _seededShuffle(allAssets, seed);
  const picks    = shuffled.slice(0, Math.min(12, shuffled.length));

  const normalized = picks.map(a => ({
    src:         a.preview,
    ext:         (a.ext || 'jpg').toUpperCase(),
    size:        a.sizeStr || '',
    name:        a.name || '',
    originalUrl: a.originalUrl || a.preview,
    faceIds:     a.faceIds || [],
    modTime:     a.modTime || null,
  }));

  registerSection('filter-results', normalized);
  _drawOtherFilterResults(el, normalized);
  el.style.display = '';
  // Animate in
  el.style.animation = 'resultsIn .22s ease both';
}

function _removeFilter(key) {
  const [type, ...rest] = key.split(':');
  const id = rest.join(':');
  switch (type) {
    case 'marca':
      _state.marca.delete(id);
      _updateChip('chip-marca', _state.marca.size);
      break;
    case 'objeto':
      _state.objeto.delete(id);
      _updateChip('chip-objeto', _state.objeto.size);
      break;
    case 'color':
      _state.color.delete(id);
      _updateChip('chip-color', _state.color.size);
      break;
    case 'orientacion':
      _state.orientacion = null;
      _updateChip('chip-orientacion', 0);
      break;
    case 'personas':
      _state.personas = null;
      _updateChip('chip-personas', 0);
      break;
    case 'consentimiento':
      if (id === 'all') _state.allCanales = false;
      else _state.consentimiento.delete(id);
      _updateChip('chip-consentimiento', _state.allCanales ? 1 : _state.consentimiento.size);
      break;
  }
  _updateActiveBar();
  // Re-render popover if it's currently open for this filter
  if (_openChipId === `chip-${type}`) {
    const chip = document.getElementById(_openChipId);
    if (chip) _RENDERERS[_openChipId]?.(chip);
  }
}

// ── Popover renderers ─────────────────────────────────────────────────────────

const _CAT_LABELS = { sport: 'Deportivas', auto: 'Automotriz' };

function _renderMarca(chipEl) {
  const pop = _getOrCreatePopover();
  let q = '';

  function draw() {
    const matches = q
      ? MARCAS.filter(m => m.label.toLowerCase().includes(q.toLowerCase()))
      : MARCAS;

    // Group by category when not searching
    let listHTML;
    if (!q && matches.length) {
      const groups = {};
      matches.forEach(m => { (groups[m.cat] = groups[m.cat] || []).push(m); });
      listHTML = Object.entries(groups).map(([cat, items]) => `
        <div class="cp-group-label">${_CAT_LABELS[cat] || cat}</div>
        ${items.map(m => _marcaRowHTML(m)).join('')}
      `).join('');
    } else if (matches.length) {
      listHTML = matches.map(m => _marcaRowHTML(m)).join('');
    } else {
      listHTML = `<div class="cp-empty">Sin resultados para "${_esc(q)}"</div>`;
    }

    pop.innerHTML = `
      <div class="cp-header">LOGO / MARCA</div>
      <div class="cp-search-wrap">
        <span class="msi xs" style="color:var(--text-faint)">search</span>
        <input class="cp-search" type="text" placeholder="Filtrar por marca..." value="${_esc(q)}" autocomplete="off">
      </div>
      <div class="cp-list">${listHTML}</div>
    `;

    const inp = pop.querySelector('.cp-search');
    inp?.addEventListener('input', e => { q = e.target.value; draw(); pop.querySelector('.cp-search')?.focus(); });
    inp?.focus();

    pop.querySelectorAll('.cp-row[data-id]').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.dataset.id;
        _state.marca.has(id) ? _state.marca.delete(id) : _state.marca.add(id);
        _updateChip('chip-marca', _state.marca.size);
        _updateActiveBar();
        draw();
        pop.querySelector('.cp-search')?.focus();
      });
    });
  }

  draw();
  _positionPopover(chipEl);
}

function _marcaRowHTML(m) {
  const sel = _state.marca.has(m.id);
  const avatarHTML = m.img
    ? `<div class="cp-avatar cp-avatar--logo"><img src="${m.img}" alt="${_esc(m.label)}"></div>`
    : `<div class="cp-avatar cp-avatar--initial">${m.label.slice(0, 2).toUpperCase()}</div>`;
  return `
    <div class="cp-row${sel ? ' cp-row--sel' : ''}" data-id="${m.id}">
      ${avatarHTML}
      <span class="cp-row-label">${m.label}</span>
      ${sel ? '<span class="msi xs" style="color:var(--text-muted)">check</span>' : ''}
    </div>`;
}

function _renderObjeto(chipEl) {
  const pop = _getOrCreatePopover();
  let customVal = '';

  function draw() {
    pop.innerHTML = `
      <div class="cp-header">OBJETO / PRODUCTO</div>
      <p class="cp-subtitle">Categorías detectadas por Rekognition</p>
      <div class="cp-tags">
        ${OBJETOS.map(obj => `
          <button class="cp-tag${_state.objeto.has(obj) ? ' cp-tag--sel' : ''}" data-obj="${obj}">${obj}</button>
        `).join('')}
      </div>
      <div class="cp-custom-row">
        <input class="cp-custom-input" type="text" placeholder="Otro objeto..." value="${_esc(customVal)}" autocomplete="off">
        <button class="cp-add-small${customVal.trim() ? '' : ' cp-add-small--disabled'}">
          <span class="msi xs">add</span>Agregar
        </button>
      </div>
    `;

    pop.querySelectorAll('.cp-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        const obj = tag.dataset.obj;
        _state.objeto.has(obj) ? _state.objeto.delete(obj) : _state.objeto.add(obj);
        _updateChip('chip-objeto', _state.objeto.size);
        _updateActiveBar();
        draw();
      });
    });

    const inp = pop.querySelector('.cp-custom-input');
    inp?.addEventListener('input', e => { customVal = e.target.value; draw(); pop.querySelector('.cp-custom-input')?.focus(); });

    pop.querySelector('.cp-add-small')?.addEventListener('click', () => {
      if (!customVal.trim()) return;
      _state.objeto.add(customVal.trim());
      customVal = '';
      _updateChip('chip-objeto', _state.objeto.size);
      _updateActiveBar();
      draw();
    });
  }

  draw();
  _positionPopover(chipEl);
}

function _renderColor(chipEl) {
  const pop = _getOrCreatePopover();
  let hexVal = '';

  function draw() {
    const previewHex = hexVal.length === 6 ? `#${hexVal}` : '#3b82f6';
    pop.innerHTML = `
      <div class="cp-header">COLOR PREDOMINANTE</div>
      <p class="cp-subtitle">Color más presente en la imagen</p>
      <div class="cp-swatches">
        ${COLORES.map(c => `
          <button class="cp-swatch${_state.color.has(c.id) ? ' cp-swatch--sel' : ''}"
                  data-id="${c.id}" title="${c.label}"
                  style="background:${c.hex};${c.border ? 'border:1.5px solid var(--border);' : ''}">
          </button>
        `).join('')}
      </div>
      <div class="cp-subheader">O elegí un color exacto</div>
      <div class="cp-hex-row">
        <div class="cp-hex-preview" style="background:${previewHex}"></div>
        <span class="cp-hex-hash">#</span>
        <input class="cp-hex-input" type="text" maxlength="6" placeholder="3B82F6" value="${_esc(hexVal)}" autocomplete="off" spellcheck="false">
        <button class="cp-add-small${hexVal.length === 6 ? '' : ' cp-add-small--disabled'}">
          <span class="msi xs">add</span>Agregar
        </button>
      </div>
      ${_state.color.size === 0 ? '<p class="cp-hint">Ningún color seleccionado</p>' : ''}
    `;

    pop.querySelectorAll('.cp-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        const id = sw.dataset.id;
        _state.color.has(id) ? _state.color.delete(id) : _state.color.add(id);
        _updateChip('chip-color', _state.color.size);
        _updateActiveBar();
        draw();
      });
    });

    const inp = pop.querySelector('.cp-hex-input');
    inp?.addEventListener('input', e => {
      hexVal = e.target.value.replace(/[^0-9a-fA-F]/g, '');
      draw();
      pop.querySelector('.cp-hex-input')?.focus();
    });

    pop.querySelector('.cp-add-small')?.addEventListener('click', () => {
      if (hexVal.length !== 6) return;
      _state.color.add(`hex_${hexVal.toLowerCase()}`);
      hexVal = '';
      _updateChip('chip-color', _state.color.size);
      _updateActiveBar();
      draw();
    });
  }

  draw();
  _positionPopover(chipEl);
}

function _renderOrientacion(chipEl) {
  const pop = _getOrCreatePopover();
  const OPTS = [
    { id: 'horizontal', label: 'Horizontal', icon: 'crop_landscape' },
    { id: 'vertical',   label: 'Vertical',   icon: 'crop_portrait' },
    { id: 'cuadrada',   label: 'Cuadrada',   icon: 'crop_square' },
  ];

  pop.innerHTML = `
    <div class="cp-header">ORIENTACIÓN</div>
    <div class="cp-radio-list">
      ${OPTS.map(o => `
        <button class="cp-radio-row${_state.orientacion === o.id ? ' cp-radio-row--sel' : ''}" data-id="${o.id}">
          <span class="cp-orient-icon"><span class="msi sm">${o.icon}</span></span>
          <span class="cp-row-label">${o.label}</span>
        </button>
      `).join('')}
    </div>
    <p class="cp-footnote">Relación de aspecto detectada en EXIF</p>
  `;

  pop.querySelectorAll('.cp-radio-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.dataset.id;
      _state.orientacion = (_state.orientacion === id) ? null : id;
      _updateChip('chip-orientacion', _state.orientacion ? 1 : 0);
      _updateActiveBar();
      pop.querySelectorAll('.cp-radio-row').forEach(r =>
        r.classList.toggle('cp-radio-row--sel', r.dataset.id === _state.orientacion)
      );
    });
  });

  _positionPopover(chipEl);
}

function _renderPersonas(chipEl) {
  const pop = _getOrCreatePopover();
  let minVal = '';
  let maxVal = '';

  function draw() {
    pop.innerHTML = `
      <div class="cp-header">CANTIDAD DE PERSONAS</div>
      <div class="cp-radio-list">
        ${PERSONAS_OPTS.map(o => `
          <button class="cp-radio-row${_state.personas === o.id ? ' cp-radio-row--sel' : ''}" data-id="${o.id}">
            <span class="cp-row-label">${o.label}</span>
          </button>
        `).join('')}
      </div>
      <div class="cp-divider"></div>
      <p class="cp-range-label">O definir rango exacto</p>
      <div class="cp-range-row">
        <input class="cp-range-input" type="number" min="0" placeholder="Mín." value="${_esc(minVal)}">
        <span class="cp-range-dash">–</span>
        <input class="cp-range-input" type="number" min="0" placeholder="Máx." value="${_esc(maxVal)}">
        <span class="cp-range-unit">personas</span>
      </div>
    `;

    pop.querySelectorAll('.cp-radio-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.dataset.id;
        _state.personas = (_state.personas === id) ? null : id;
        if (_state.personas) { minVal = ''; maxVal = ''; }
        _updateChip('chip-personas', _state.personas ? 1 : 0);
        _updateActiveBar();
        draw();
      });
    });

    const [minInp, maxInp] = pop.querySelectorAll('.cp-range-input');
    minInp?.addEventListener('input', e => { minVal = e.target.value; });
    maxInp?.addEventListener('input', e => {
      maxVal = e.target.value;
      if (minVal || maxVal) {
        _state.personas = `rango_${minVal || '0'}-${maxVal || 'inf'}`;
        _updateChip('chip-personas', 1);
        _updateActiveBar();
      }
    });
  }

  draw();
  _positionPopover(chipEl);
}

function _renderConsentimiento(chipEl) {
  const pop = _getOrCreatePopover();

  function draw() {
    pop.innerHTML = `
      <div class="cp-header">CANAL DE CONSENTIMIENTO</div>
      <p class="cp-subtitle">Mostrar fotos donde todos tienen autorización para el canal</p>
      <div class="cp-check-list">
        ${CONSENT_OPTS.map(o => {
          const sel = _state.consentimiento.has(o.id) && !_state.allCanales;
          return `
            <button class="cp-check-row${sel ? ' cp-check-row--sel' : ''}${_state.allCanales ? ' cp-check-row--dim' : ''}" data-id="${o.id}">
              <span class="cp-check-box${sel ? ' cp-check-box--on' : ''}">${sel ? '<span class="msi xs">check</span>' : ''}</span>
              <span class="cp-row-label">${o.label}</span>
            </button>
          `;
        }).join('')}
      </div>
      <div class="cp-divider"></div>
      <button class="cp-all-row${_state.allCanales ? ' cp-all-row--sel' : ''}">
        <span class="cp-check-box${_state.allCanales ? ' cp-check-box--on' : ''}">${_state.allCanales ? '<span class="msi xs">check</span>' : ''}</span>
        Solo fotos con <strong>&nbsp;todos los canales&nbsp;</strong> autorizados
      </button>
    `;

    pop.querySelectorAll('.cp-check-row').forEach(row => {
      row.addEventListener('click', () => {
        if (_state.allCanales) return;
        const id = row.dataset.id;
        _state.consentimiento.has(id) ? _state.consentimiento.delete(id) : _state.consentimiento.add(id);
        _updateChip('chip-consentimiento', _state.consentimiento.size);
        _updateActiveBar();
        draw();
      });
    });

    pop.querySelector('.cp-all-row')?.addEventListener('click', () => {
      _state.allCanales = !_state.allCanales;
      if (_state.allCanales) _state.consentimiento.clear();
      _updateChip('chip-consentimiento', _state.allCanales ? 1 : _state.consentimiento.size);
      _updateActiveBar();
      draw();
    });
  }

  draw();
  _positionPopover(chipEl);
}

// ── Face ID popover ───────────────────────────────────────────────────────────

function _renderFaceId(chipEl) {
  const pop = _getOrCreatePopover();
  let q = '';

  // Lista completa y en vivo desde el store compartido (js/faces.js) — incluye todos
  // los rostros de la sección Face IDs, no solo los visibles en las tiras del home.
  const faces = getFaces().map(f => ({ id: f.id, name: f.displayName, imgSrc: f.selfieUrl }));

  function draw() {
    const matches = q
      ? faces.filter(f => f.name.toLowerCase().includes(q.toLowerCase()))
      : faces;

    pop.innerHTML = `
      <div class="cp-header">PERSONAS</div>
      <div class="cp-search-wrap">
        <span class="msi xs" style="color:var(--text-faint)">search</span>
        <input class="cp-search" type="text" placeholder="Filtrar por nombre..." value="${_esc(q)}" autocomplete="off">
      </div>
      <div class="cp-list">
        ${matches.length ? matches.map(f => `
          <div class="cp-row" data-face-id="${f.id}" data-face-name="${_esc(f.name)}" data-face-img="${_esc(f.imgSrc)}">
            <div class="cp-avatar"><img src="${f.imgSrc}" alt="${_esc(f.name)}" style="width:100%;height:100%;object-fit:cover;display:block"></div>
            <span class="cp-row-label">${f.name}</span>
          </div>
        `).join('') : `<div class="cp-empty">Sin resultados para "${_esc(q)}"</div>`}
      </div>
    `;

    const inp = pop.querySelector('.cp-search');
    inp?.addEventListener('input', e => { q = e.target.value; draw(); pop.querySelector('.cp-search')?.focus(); });
    inp?.focus();

    pop.querySelectorAll('.cp-row[data-face-id]').forEach(row => {
      row.addEventListener('click', () => {
        activateFaceFilter(row.dataset.faceId, row.dataset.faceName, row.dataset.faceImg);
        _closePopover();
      });
    });
  }

  draw();
  _positionPopover(chipEl);
}

// ── Renderer map (used by _removeFilter re-render) ────────────────────────────

const _RENDERERS = {
  'chip-faceid':         _renderFaceId,
  'chip-marca':          _renderMarca,
  'chip-objeto':         _renderObjeto,
  'chip-color':          _renderColor,
  'chip-orientacion':    _renderOrientacion,
  'chip-personas':       _renderPersonas,
  'chip-consentimiento': _renderConsentimiento,
};

// ── Utility ───────────────────────────────────────────────────────────────────

function _esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
}

// ── Init ──────────────────────────────────────────────────────────────────────

export function initFilters() {
  // Event delegation — handles chips that are recreated dynamically (e.g. chip-faceid)
  document.addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip[id], .filter-chip--active[id]');
    if (!chip) return;
    const renderer = _RENDERERS[chip.id];
    if (!renderer) return;

    if (_openChipId === chip.id) {
      _closePopover();
    } else {
      _openChipId = chip.id;
      _getOrCreatePopover();
      renderer(chip);
    }
  }, true); // capture phase so we run before other listeners
}
