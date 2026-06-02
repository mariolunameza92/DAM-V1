// Exports: initImageDetail(), openImageDetail(item, siblings?)
// Sections register their items via registerSection() from shared/image-registry.js
import { _registry } from '../shared/image-registry.js';
import { assetCardHTML } from '../shared/asset-card.js';
import { initCrop } from './crop.js';
import { FACE_REGISTRY } from '../../events-registry.js';

const CAMERAS = [
  { marca: 'SONY',     modelo: 'ILCE-7M4', exp: '1/500',  apertura: 'ƒ/3.2', focal: '70.0 mm', iso: '200' },
  { marca: 'CANON',    modelo: 'EOS R5',   exp: '1/800',  apertura: 'ƒ/2.8', focal: '50.0 mm', iso: '400' },
  { marca: 'NIKON',    modelo: 'Z9',       exp: '1/1000', apertura: 'ƒ/4.0', focal: '85.0 mm', iso: '100' },
  { marca: 'FUJIFILM', modelo: 'X-T5',     exp: '1/640',  apertura: 'ƒ/2.0', focal: '35.0 mm', iso: '320' },
  { marca: 'GOPRO',    modelo: 'HERO12',   exp: '1/2000', apertura: 'ƒ/2.8', focal: '14.0 mm', iso: '800' },
];

function _facesForItem(item) {
  if (!item.faceIds || item.faceIds.length === 0) return [];
  return item.faceIds
    .map(id => {
      const f = FACE_REGISTRY[id];
      return f ? { id, name: f.name, src: f.selfieUrl } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (a.name ? 0 : 1) - (b.name ? 0 : 1));
}

const TAGS_POOL = [
  'ar','adidas','runners','spiderman','gorra','lima','palmera',
  'semáforo','lentes','reloj','zapatillas','calle','pista',
  'evento','deportes','exterior','urbano','personas','maratón','verano',
  'fotografía','día','sol','multitud','deporte','branding',
];

const UPLOAD_DATES = [
  '14/05/2026 · 21:05', '13/05/2026 · 09:30',
  '15/05/2026 · 14:22', '16/05/2026 · 08:01',
  '17/05/2026 · 11:45', '18/05/2026 · 16:33',
];

const DIMS = ['2190 x 1080', '4032 x 3024', '5472 x 3648', '3840 x 2160', '6000 x 4000', '2560 x 1440'];
const CAM_DATES = ['13/05/2026', '14/05/2026', '01/04/2026', '22/03/2026', '10/05/2026'];
const CAM_TIMES = ['08:01', '09:30', '12:15', '14:22', '17:45'];

const SMART_SUMMARIES = [
  'Fotografía tomada durante una maratón urbana en Lima. Se observa un grupo de corredores en plena carrera, luciendo dorsales numerados y ropa deportiva técnica. El ambiente es dinámico, con espectadores animando a los participantes desde los laterales de la pista.',
  'Imagen que captura el momento de cruce de meta en una competencia de running. Los atletas muestran expresiones de esfuerzo y determinación. Se aprecian elementos de branding de los patrocinadores del evento en el fondo.',
  'Escena grupal en una carrera de calle con múltiples participantes en diferentes momentos de su recorrido. La iluminación natural y el entorno urbano generan un encuadre vibrante y lleno de energía competitiva.',
  'Toma de campo abierto durante una jornada de atletismo. Corredores de distintas categorías avanzan en formación, con vestimenta deportiva y accesorios de hidratación visibles. El recorrido transcurre por una avenida principal de la ciudad.',
  'Fotografía de evento deportivo masivo con decenas de participantes. La composición muestra la diversidad de los corredores en edad y género. Al fondo se distinguen carpas de organización y vallas publicitarias del evento.',
  'Imagen tomada en los primeros kilómetros de una carrera popular. El pelotón aún está compacto y el ritmo es elevado. Se identifican corredores de élite en la parte delantera, separados del grupo general.',
  'Captura del ambiente previo a la largada oficial. Los atletas realizan calentamiento y estiramiento en la zona de partida. El escenario refleja la expectativa y concentración típicas de un evento de alto rendimiento.',
];

function _hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (((h << 5) + h) ^ str.charCodeAt(i)) >>> 0;
  return h;
}

function _pick(arr, seed) { return arr[seed % arr.length]; }

let _currentItem = null;
let _siblingItems = [];

export function initImageDetail() {
  const overlay = document.getElementById('imgDetailOverlay');
  if (!overlay) return;

  document.getElementById('imgDetailClose').addEventListener('click', _close);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) _close();
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const fsOverlay = document.getElementById('imgFullscreenOverlay');
    if (fsOverlay.classList.contains('open')) { _closeFullscreen(); return; }
    if (overlay.classList.contains('open')) _close();
  });

  // Fullscreen
  document.getElementById('imgDetailFullscreenBtn').addEventListener('click', _openFullscreen);
  document.getElementById('imgFullscreenClose').addEventListener('click', _closeFullscreen);
  document.getElementById('imgFullscreenOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('imgFullscreenOverlay')) _closeFullscreen();
  });

  // Identify unknown person on Enter
  overlay.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const input = e.target;
    if (!input.classList.contains('img-detail-person-input')) return;
    const name = input.value.trim();
    if (!name) return;
    e.preventDefault();
    _identifyPerson(input, name);
  });

  // Smart Summary expand/collapse
  overlay.addEventListener('click', e => {
    const link = e.target.closest('.img-detail-meta-link');
    if (!link) return;
    const text = link.previousElementSibling;
    if (!text || !text.classList.contains('img-detail-meta-text')) return;
    const collapsed = text.classList.toggle('is-clamped');
    link.textContent = collapsed ? 'Ver más' : 'Ver menos';
  });

  // Accordion toggle
  overlay.addEventListener('click', e => {
    const header = e.target.closest('.img-detail-section-header');
    if (!header) return;
    header.closest('.img-detail-section').classList.toggle('collapsed');
  });

  // Click similar image → navigate within modal
  // stopPropagation is critical: _populate() re-renders #imgDetailSimilarCols innerHTML,
  // which detaches e.target from the DOM. Without stopPropagation, the document handler
  // below would fire, find the detached card's section ('__similar__'), and overwrite
  // _siblingItems with the current (shrinking) similar set — reducing it every click.
  document.getElementById('imgDetailSimilarCols').addEventListener('click', e => {
    e.stopPropagation();
    if (e.target.closest('.asset-dl')) return;
    const card = e.target.closest('.asset-card[data-section]');
    if (!card) return;
    const item = (_registry.get(card.dataset.section) || [])[+card.dataset.idx];
    if (item) _populate(item);
  });

  // Click any asset-card across all sections → open modal
  document.addEventListener('click', e => {
    if (e.target.closest('.asset-dl')) return;
    if (e.target.closest('#imgDetailSimilarCols')) return;
    const card = e.target.closest('.asset-card[data-section]');
    if (!card) return;
    const section = card.dataset.section;
    const idx = +card.dataset.idx;
    const items = _registry.get(section) || [];
    const item = items[idx];
    if (!item) return;
    _siblingItems = items;
    openImageDetail(item);
  });

  // Info toggle — show/hide right panel
  document.getElementById('imgDetailInfoBtn').addEventListener('click', () => {
    const modal = document.querySelector('.img-detail-modal');
    const isHiding = !modal.classList.contains('info-hidden');
    modal.classList.toggle('info-hidden', isHiding);
    _renderSimilar(_currentItem, isHiding ? 4 : 3);
    _animateRightPanel(isHiding);
  });

  // Topbar download
  document.getElementById('imgDetailDownloadBtn').addEventListener('click', () => {
    if (!_currentItem) return;
    const a = document.createElement('a');
    a.href = _currentItem.originalUrl || _currentItem.src;
    a.download = `${_currentItem.name}.${(_currentItem.ext || 'jpg').toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  initCrop(() => _currentItem);
}

export function openImageDetail(item, siblings) {
  _currentItem = item;
  if (siblings) _siblingItems = siblings;
  const modal = document.querySelector('.img-detail-modal');
  modal.classList.remove('info-hidden');
  modal.style.gridTemplateColumns = '';
  modal.style.transition = '';
  _populate(item);
  const overlay = document.getElementById('imgDetailOverlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function _identifyPerson(input, name) {
  input.disabled = true;
  input.classList.add('is-leaving');
  let done = false;
  const swap = () => {
    if (done) return;
    done = true;
    const nameSpan = document.createElement('span');
    nameSpan.className = 'img-detail-person-name is-entering';
    nameSpan.textContent = name;
    input.replaceWith(nameSpan);
  };
  input.addEventListener('animationend', swap, { once: true });
  setTimeout(swap, 350);
}

function _animateRightPanel(isHiding) {
  const modal = document.querySelector('.img-detail-modal');
  const wrap  = document.getElementById('imgDetailRightWrap');
  if (!modal || !wrap) return;

  const modalW = modal.getBoundingClientRect().width;
  const rightW = wrap.getBoundingClientRect().width;
  const leftW  = modalW - rightW;

  // Snapshot current state as px (disables fr-based sizing temporarily)
  modal.style.transition         = 'none';
  modal.style.gridTemplateColumns = `${leftW}px ${rightW}px`;
  modal.offsetWidth; // force reflow

  const targetRight = isHiding ? 0 : 364;
  const targetLeft  = modalW - targetRight;

  modal.style.transition         = 'grid-template-columns 0.32s ease';
  modal.style.gridTemplateColumns = `${targetLeft}px ${targetRight}px`;

  setTimeout(() => {
    modal.style.transition         = '';
    modal.style.gridTemplateColumns = isHiding ? `1fr 0px` : '';
  }, 360);
}

function _openFullscreen() {
  if (!_currentItem) return;
  const fsOverlay = document.getElementById('imgFullscreenOverlay');
  const fsImg     = document.getElementById('imgFullscreenImg');
  fsImg.src = _currentItem.originalUrl || _currentItem.src;
  fsOverlay.classList.add('open');
}

function _closeFullscreen() {
  document.getElementById('imgFullscreenOverlay').classList.remove('open');
}

function _close() {
  const overlay = document.getElementById('imgDetailOverlay');
  if (!overlay || !overlay.classList.contains('open')) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function _populate(item) {
  _currentItem = item;
  const h = _hash(item.name || item.src);

  const mainImg = document.getElementById('imgDetailMainImg');
  mainImg.src = '';
  mainImg.src = item.originalUrl || item.src;

  const faces = _facesForItem(item);
  document.getElementById('imgDetailFaces').innerHTML = faces.map(f =>
    `<div class="img-detail-face-dot" title="${f.name}">
       <img src="${f.src}" alt="${f.name}">
     </div>`
  ).join('');

  document.getElementById('imgDetailRight').innerHTML = _buildRight(item, h, faces);

  const summaryText = document.querySelector('#imgDetailRight .img-detail-meta-text.is-clamped');
  if (summaryText) {
    const link = summaryText.nextElementSibling;
    if (link && summaryText.scrollHeight <= summaryText.clientHeight) link.style.display = 'none';
  }

  _renderSimilar(item);

  document.getElementById('imgDetailRight').scrollTop = 0;
  document.getElementById('imgDetailRightWrap').scrollTop = 0;
  document.querySelector('.img-detail-left').scrollTop = 0;
}

function _buildRight(item, h, faces) {
  const cam        = _pick(CAMERAS, h);
  const dims       = _pick(DIMS, h);
  const uploadDate = _pick(UPLOAD_DATES, h);
  const camDate       = _pick(CAM_DATES, h);
  const camTime       = _pick(CAM_TIMES, h + 1);
  const summary       = _pick(SMART_SUMMARIES, h);

  const numTags = 7 + (h % 7);
  const tags = [];
  const usedTags = new Set();
  let ti = h;
  while (tags.length < numTags) {
    const tag = TAGS_POOL[ti % TAGS_POOL.length];
    if (!usedTags.has(tag)) { tags.push(tag); usedTags.add(tag); }
    ti++;
  }

  return `
    <div class="img-detail-name-block">
      <p class="img-detail-filename">${item.name}</p>
      <div class="img-detail-basic-meta">
        <span>${item.ext}</span>
        <span>${item.size}</span>
        <span>${dims}</span>
      </div>
    </div>

    <div class="img-detail-sections">

      <div class="img-detail-section">
        <div class="img-detail-section-header">
          <span class="img-detail-section-title">Personas identificadas</span>
          <span class="msi xs img-detail-section-chevron">keyboard_arrow_up</span>
        </div>
        <div class="img-detail-section-body">
          ${faces.length > 0
            ? faces.map(f => `
            <div class="img-detail-person">
              <img class="img-detail-person-avatar" src="${f.src}" alt="${f.name || '?'}">
              ${f.name
                ? `<span class="img-detail-person-name">${f.name}</span>`
                : `<input class="img-detail-person-input" type="text" placeholder="Asignar nombre…" autocomplete="off">`
              }
            </div>
          `).join('')
            : `<p style="color:var(--g500);font-size:13px;font-family:var(--font-ui)">Sin personas identificadas</p>`
          }
        </div>
      </div>

      <div class="img-detail-section">
        <div class="img-detail-section-header">
          <span class="img-detail-section-title">Smart Metadata</span>
          <span class="msi xs img-detail-section-chevron">keyboard_arrow_up</span>
        </div>
        <div class="img-detail-section-body">
          <div class="img-detail-meta-section">
            <p class="img-detail-meta-label">Smart Summary</p>
            <p class="img-detail-meta-text is-clamped">${summary}</p>
            <span class="img-detail-meta-link">Ver más</span>
          </div>
          <div class="img-detail-meta-section">
            <p class="img-detail-meta-label">Smart Tags</p>
            <div class="img-detail-tags">
              ${tags.map(t => `
                <div class="img-detail-tag">
                  <span>${t}</span>
                  <span class="msi xs img-detail-tag-remove">close</span>
                </div>
              `).join('')}
            </div>
          </div>
          <p class="img-detail-ai-label">Generados por IA</p>
        </div>
      </div>

      <div class="img-detail-section">
        <div class="img-detail-section-header">
          <span class="img-detail-section-title">Información del archivo</span>
          <span class="msi xs img-detail-section-chevron">keyboard_arrow_up</span>
        </div>
        <div class="img-detail-section-body">
          <div class="img-detail-info-rows">
            ${_row('Subido por',      'Mario Luna')}
            ${_row('Fecha de subida', uploadDate)}
            ${_row('Formato',         item.ext)}
            ${_row('Peso',            item.size)}
            ${_row('Dimensiones',     dims)}
          </div>
        </div>
      </div>

      <div class="img-detail-section">
        <div class="img-detail-section-header">
          <span class="img-detail-section-title">Detalles de la cámara</span>
          <span class="msi xs img-detail-section-chevron">keyboard_arrow_up</span>
        </div>
        <div class="img-detail-section-body">
          <div class="img-detail-info-rows">
            ${_row('Fecha',           `${camDate} · ${camTime} · GMT-5`)}
            ${_row('Marca',           cam.marca)}
            ${_row('Modelo',          cam.modelo)}
            ${_row('Exposición',      cam.exp)}
            ${_row('Apertura',        cam.apertura)}
            ${_row('Distancia focal', cam.focal)}
            ${_row('ISO',             cam.iso)}
          </div>
        </div>
      </div>

      <div class="img-detail-section collapsed">
        <div class="img-detail-section-header">
          <span class="img-detail-section-title">Tags personalizados</span>
          <span class="msi xs img-detail-section-chevron">keyboard_arrow_up</span>
        </div>
        <div class="img-detail-section-body">
          <div class="img-detail-tags"></div>
        </div>
      </div>

    </div>
  `;
}

function _row(label, value) {
  return `<div class="img-detail-info-row">
    <span class="img-detail-info-label">${label}</span>
    <span class="img-detail-info-value">${value}</span>
  </div>`;
}

function _renderSimilar(currentItem, numCols = 3) {
  const cols = document.getElementById('imgDetailSimilarCols');
  if (!cols) return;
  let pool = _siblingItems.filter(it => it.src !== currentItem.src);

  // Group by shoot time: photos within 60 s of each other are from the same burst/session.
  // Falls back to same-event-folder filter when modTime is not available.
  if (currentItem.modTime) {
    const t = currentItem.modTime;
    const burst = pool.filter(it => it.modTime != null && Math.abs(it.modTime - t) <= 60_000);
    if (burst.length > 0) pool = burst;
  } else if (currentItem.originalUrl) {
    const folder = currentItem.originalUrl.slice(0, currentItem.originalUrl.lastIndexOf('/'));
    const sameFolder = pool.filter(it => it.originalUrl && it.originalUrl.startsWith(folder + '/'));
    if (sameFolder.length > 0) pool = sameFolder;
  }

  if (pool.length === 0) { cols.innerHTML = ''; return; }
  const maxItems = numCols === 4 ? 8 : 6;
  const items = pool.slice(0, maxItems);
  _registry.set('__similar__', items);
  const colData = Array.from({ length: numCols }, () => []);
  items.forEach((it, i) => colData[i % numCols].push({ it, i }));
  cols.className = `img-detail-similar-cols${numCols === 4 ? ' cols-4' : ''}`;
  cols.innerHTML = colData.map(col =>
    `<div class="img-detail-similar-col">${col.map(({ it, i }) => assetCardHTML(it, '__similar__', i)).join('')}</div>`
  ).join('');
}
