// Exports: initCrop(getCurrentItem)

const PLATFORMS = {
  Instagram: [
    { name: 'Feed – Landscape',  w: 1080, h: 566 },
    { name: 'Feed – Portrait',   w: 1080, h: 1350 },
    { name: 'Feed – Square',     w: 1080, h: 1080 },
    { name: 'Story',             w: 1080, h: 1920 },
    { name: 'Ad – Landscape',    w: 1080, h: 566 },
    { name: 'Ad – Story',        w: 1080, h: 1920 },
    { name: 'Profile photo',     w: 320,  h: 320 },
  ],
  TikTok: [
    { name: 'Video',   w: 1080, h: 1920 },
    { name: 'Profile', w: 200,  h: 200 },
    { name: 'Cover',   w: 1080, h: 1920 },
  ],
  Facebook: [
    { name: 'Feed',    w: 1200, h: 630 },
    { name: 'Story',   w: 1080, h: 1920 },
    { name: 'Cover',   w: 820,  h: 312 },
    { name: 'Profile', w: 170,  h: 170 },
    { name: 'Ad',      w: 1200, h: 628 },
  ],
  LinkedIn: [
    { name: 'Post',          w: 1200, h: 628 },
    { name: 'Cover',         w: 1584, h: 396 },
    { name: 'Profile',       w: 400,  h: 400 },
    { name: 'Company cover', w: 1128, h: 191 },
  ],
  YouTube: [
    { name: 'Thumbnail', w: 1280, h: 720 },
    { name: 'Banner',    w: 2560, h: 1440 },
    { name: 'Profile',   w: 800,  h: 800 },
    { name: 'Short',     w: 1080, h: 1920 },
  ],
};

// State
let _getItem   = null;
let _cropActive = false;
let _aspectRatio = null; // null = free, number = w/h
let _box = { x: 0, y: 0, w: 0, h: 0 }; // relative to rendered image rect
let _imgRenderedRect = null; // { x, y, w, h } in page coords relative to canvas area

// Drag state
let _drag = null; // { type: 'move'|handle, startX, startY, startBox, handle }

export function initCrop(getCurrentItem) {
  _getItem = getCurrentItem;

  const cropBtn = document.getElementById('imgDetailCropBtn');
  if (!cropBtn) return;

  cropBtn.addEventListener('click', _toggleFormatPanel);

  // Close panel on outside click
  document.addEventListener('click', e => {
    if (e.target.closest('.img-detail-crop-wrap')) return;
    _closeFormatPanel();
  });

  // Cancel / Confirm buttons
  document.getElementById('cropCancelBtn').addEventListener('click', _exitCropMode);
  document.getElementById('cropConfirmBtn').addEventListener('click', _doDownload);

  // Drag events on the canvas area
  const canvasArea = document.getElementById('cropCanvasArea');
  canvasArea.addEventListener('mousedown', _onMouseDown);
  document.addEventListener('mousemove', _onMouseMove);
  document.addEventListener('mouseup',   _onMouseUp);
}

// ── Format panel ────────────────────────────────────────────────────

function _toggleFormatPanel() {
  const panel = document.getElementById('cropFormatPanel');
  if (panel.classList.contains('open')) {
    _closeFormatPanel();
  } else {
    _openFormatPanel();
  }
}

function _openFormatPanel() {
  const panel = document.getElementById('cropFormatPanel');
  _buildMainMenu(panel);
  panel.classList.add('open');
}

function _closeFormatPanel() {
  document.getElementById('cropFormatPanel').classList.remove('open');
}

function _buildMainMenu(panel) {
  panel.innerHTML = `
    <div class="crop-format-col">
      <div class="crop-format-item" data-platform="free">Recorte libre</div>
      ${Object.keys(PLATFORMS).map(p =>
        `<div class="crop-format-item" data-platform="${p}">
          ${p}
          <span class="msi xs">chevron_right</span>
        </div>`
      ).join('')}
    </div>
  `;

  panel.querySelectorAll('.crop-format-item').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const platform = el.dataset.platform;
      if (platform === 'free') {
        _closeFormatPanel();
        _enterCropMode(null);
      } else {
        _buildSubMenu(panel, platform);
      }
    });
  });
}

function _buildSubMenu(panel, platform) {
  const formats = PLATFORMS[platform];
  panel.innerHTML = `
    <div class="crop-format-col">
      <div class="crop-format-back">
        <span class="msi xs">arrow_back</span>
        ${platform}
      </div>
      ${formats.map((f, i) =>
        `<div class="crop-format-sub-item" data-idx="${i}" data-platform="${platform}">
          <span class="crop-format-sub-name">${f.name}</span>
          <span class="crop-format-sub-dims">${f.w} × ${f.h}</span>
        </div>`
      ).join('')}
    </div>
  `;

  panel.querySelector('.crop-format-back').addEventListener('click', e => {
    e.stopPropagation();
    _buildMainMenu(panel);
  });

  panel.querySelectorAll('.crop-format-sub-item').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const fmt = PLATFORMS[el.dataset.platform][+el.dataset.idx];
      _closeFormatPanel();
      _enterCropMode(fmt.w / fmt.h);
    });
  });
}

// ── Crop mode ────────────────────────────────────────────────────────

function _enterCropMode(aspectRatio) {
  _cropActive  = true;
  _aspectRatio = aspectRatio;

  const left    = document.querySelector('.img-detail-left');
  const overlay = document.getElementById('cropOverlay');
  left.classList.add('crop-mode');
  overlay.classList.add('active');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Push image up so it never goes behind the action buttons
      const actions = document.querySelector('.crop-actions');
      const imgWrap = document.querySelector('.img-detail-img-wrap');
      if (actions && imgWrap) {
        imgWrap.style.paddingBottom = `${actions.getBoundingClientRect().height}px`;
      }
      _computeImgRect();
      _initBox();
      _renderBox();
    });
  });
}

function _exitCropMode() {
  _cropActive = false;
  const left    = document.querySelector('.img-detail-left');
  const overlay = document.getElementById('cropOverlay');
  left.classList.remove('crop-mode');
  overlay.classList.remove('active');
  document.querySelector('.img-detail-img-wrap').style.paddingBottom = '';
}

// Compute the rendered image rect inside the canvas area
function _computeImgRect() {
  const img       = document.getElementById('imgDetailMainImg');
  const canvasArea = document.getElementById('cropCanvasArea');
  const areaRect  = canvasArea.getBoundingClientRect();
  const imgRect   = img.getBoundingClientRect();

  // Image uses object-fit: contain, so actual rendered area is centered
  const natW = img.naturalWidth  || imgRect.width;
  const natH = img.naturalHeight || imgRect.height;
  const scaleX = imgRect.width  / natW;
  const scaleY = imgRect.height / natH;
  const scale  = Math.min(scaleX, scaleY);
  const rendW  = natW * scale;
  const rendH  = natH * scale;

  _imgRenderedRect = {
    x: imgRect.left - areaRect.left + (imgRect.width  - rendW) / 2,
    y: imgRect.top  - areaRect.top  + (imgRect.height - rendH) / 2,
    w: rendW,
    h: rendH,
    natW,
    natH,
    scale,
  };
}

function _initBox() {
  const { w, h } = _imgRenderedRect;
  const padding  = Math.min(w, h) * 0.1;

  if (_aspectRatio) {
    // Fit the aspect ratio box inside the image with some padding
    let bw = w - padding * 2;
    let bh = bw / _aspectRatio;
    if (bh > h - padding * 2) {
      bh = h - padding * 2;
      bw = bh * _aspectRatio;
    }
    _box = {
      x: (w - bw) / 2,
      y: (h - bh) / 2,
      w: bw,
      h: bh,
    };
  } else {
    _box = {
      x: padding,
      y: padding,
      w: w - padding * 2,
      h: h - padding * 2,
    };
  }
}

function _renderBox() {
  const cropBox   = document.getElementById('cropBox');
  const { x, y } = _imgRenderedRect;
  cropBox.style.left   = `${x + _box.x}px`;
  cropBox.style.top    = `${y + _box.y}px`;
  cropBox.style.width  = `${_box.w}px`;
  cropBox.style.height = `${_box.h}px`;
}

// ── Drag / Resize ─────────────────────────────────────────────────────

function _onMouseDown(e) {
  if (!_cropActive) return;
  const handle = e.target.closest('.crop-handle');
  const box    = e.target.closest('#cropBox');

  if (handle) {
    e.preventDefault();
    _drag = {
      type: 'handle',
      handle: handle.dataset.h,
      startX: e.clientX,
      startY: e.clientY,
      startBox: { ..._box },
    };
  } else if (box) {
    e.preventDefault();
    _drag = {
      type: 'move',
      startX: e.clientX,
      startY: e.clientY,
      startBox: { ..._box },
    };
  }
}

function _onMouseMove(e) {
  if (!_drag || !_cropActive) return;
  const dx = e.clientX - _drag.startX;
  const dy = e.clientY - _drag.startY;
  const sb = _drag.startBox;
  const ir = _imgRenderedRect;
  const MIN = 40;

  if (_drag.type === 'move') {
    _box.x = Math.max(0, Math.min(ir.w - sb.w, sb.x + dx));
    _box.y = Math.max(0, Math.min(ir.h - sb.h, sb.y + dy));
  } else {
    let { x, y, w, h } = sb;
    const h_ = _drag.handle;

    if (h_.includes('e')) w = Math.max(MIN, sb.w + dx);
    if (h_.includes('s')) h = Math.max(MIN, sb.h + dy);
    if (h_.includes('w')) { w = Math.max(MIN, sb.w - dx); x = sb.x + sb.w - w; }
    if (h_.includes('n')) { h = Math.max(MIN, sb.h - dy); y = sb.y + sb.h - h; }

    // Enforce aspect ratio if set
    if (_aspectRatio) {
      if (h_.includes('e') || h_.includes('w')) h = w / _aspectRatio;
      else w = h * _aspectRatio;
      if (h_.includes('n')) y = sb.y + sb.h - h;
      if (h_.includes('w')) x = sb.x + sb.w - w;
    }

    // Clamp to image bounds
    x = Math.max(0, x);
    y = Math.max(0, y);
    w = Math.min(ir.w - x, w);
    h = Math.min(ir.h - y, h);

    _box = { x, y, w, h };
  }

  _renderBox();
}

function _onMouseUp() {
  _drag = null;
}

// ── Download ──────────────────────────────────────────────────────────

function _doDownload() {
  const item = _getItem?.();
  if (!item || !_imgRenderedRect) return;

  const { natW, natH, w: rendW, h: rendH } = _imgRenderedRect;
  const scaleX = natW / rendW;
  const scaleY = natH / rendH;

  const cropX = Math.round(_box.x * scaleX);
  const cropY = Math.round(_box.y * scaleY);
  const cropW = Math.round(_box.w * scaleX);
  const cropH = Math.round(_box.h * scaleY);

  const canvas = document.createElement('canvas');
  canvas.width  = cropW;
  canvas.height = cropH;
  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    const url = canvas.toDataURL('image/jpeg', 0.92);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `crop_${item.name || 'image'}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    _exitCropMode();
  };
  img.onerror = () => {
    // CORS fallback: download original
    const a   = document.createElement('a');
    a.href     = item.originalUrl || item.src;
    a.download = `crop_${item.name || 'image'}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    _exitCropMode();
  };
  img.src = item.originalUrl || item.src;
}
