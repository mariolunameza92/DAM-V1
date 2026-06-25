// Pure SVG chart generators + horizontal-bar list builder.
// No external state — safe to import from any analytics sub-module.

let _gid = 0; // gradient ID counter — persists across renders within a session

export function svgDonut(segments, opts = {}) {
  const { size = 120, sw = 16 } = opts;
  const r  = (size - sw) / 2;
  const cx = size / 2, cy = size / 2;
  const C  = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let acc = 0;
  const circles = segments.map(seg => {
    const pct   = seg.value / total;
    const dash  = Math.max(0, pct * C - 1.5);
    const start = -90 + (acc / total) * 360;
    acc += seg.value;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      style="stroke:${seg.color}" stroke-width="${sw}"
      stroke-dasharray="${dash.toFixed(2)} ${(C - dash + 1.5).toFixed(2)}"
      transform="rotate(${start.toFixed(2)} ${cx} ${cy})"
      stroke-linecap="butt"/>`;
  });
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" style="stroke:var(--border-subtle)" stroke-width="${sw}"/>
    ${circles.join('\n    ')}
  </svg>`;
}

export function svgLine(data, labels, opts = {}) {
  const { w = 320, h = 80, color = 'var(--text)', showDots = true } = opts;
  const pl = 4, pr = 4, pt = 10, pb = labels ? 20 : 8;
  const W = w - pl - pr, H = h - pt - pb;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const n = data.length;
  const xp = i => pl + (i / (n - 1)) * W;
  const yp = v => pt + H - ((v - min) / range) * H;

  const pathD = data.map((v, i) => {
    if (i === 0) return `M ${xp(0).toFixed(1)} ${yp(v).toFixed(1)}`;
    const cpx = ((xp(i) + xp(i-1)) / 2).toFixed(1);
    return `C ${cpx} ${yp(data[i-1]).toFixed(1)}, ${cpx} ${yp(v).toFixed(1)}, ${xp(i).toFixed(1)} ${yp(v).toFixed(1)}`;
  }).join(' ');

  const gid = `alg${++_gid}`;
  const areaD = `${pathD} L ${xp(n-1).toFixed(1)} ${(pt+H).toFixed(1)} L ${xp(0).toFixed(1)} ${(pt+H).toFixed(1)} Z`;
  const dots = showDots ? data.map((v, i) =>
    `<circle cx="${xp(i).toFixed(1)}" cy="${yp(v).toFixed(1)}" r="2.5" style="fill:${color}" opacity=".8"/>`
  ).join('') : '';
  const lblEl = labels ? labels.map((l, i) => {
    if (i % Math.ceil(n / 7) !== 0 && i !== n - 1) return '';
    const anchor = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
    return `<text x="${xp(i).toFixed(1)}" y="${h - 4}" text-anchor="${anchor}" font-size="8" style="fill:var(--text-faint)" font-family="sans-serif">${l}</text>`;
  }).join('') : '';

  return `<svg width="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" style="stop-color:${color}" stop-opacity=".25"/>
        <stop offset="100%" style="stop-color:${color}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${areaD}" fill="url(#${gid})"/>
    <path d="${pathD}" fill="none" style="stroke:${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    ${dots}
    ${lblEl}
  </svg>`;
}

export function svgRadar(axes, values, opts = {}) {
  const { size = 160, levels = 4, color = 'var(--text-body)' } = opts;
  const cx = size / 2, cy = size / 2;
  const r  = size / 2 - 22;
  const n  = axes.length;
  const ang = i => (Math.PI * 2 * i / n) - Math.PI / 2;

  const grids = Array.from({ length: levels }, (_, lv) => {
    const rf = r * (lv + 1) / levels;
    const pts = Array.from({ length: n }, (_, i) =>
      `${(cx + rf * Math.cos(ang(i))).toFixed(1)},${(cy + rf * Math.sin(ang(i))).toFixed(1)}`
    ).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="var(--surface-neutral)" stroke-width="1"/>`;
  });

  const axLines = Array.from({ length: n }, (_, i) =>
    `<line x1="${cx}" y1="${cy}" x2="${(cx + r * Math.cos(ang(i))).toFixed(1)}" y2="${(cy + r * Math.sin(ang(i))).toFixed(1)}" stroke="var(--surface-neutral)" stroke-width="1"/>`
  );

  const dataPts = values.map((v, i) => {
    const rf = r * v;
    return `${(cx + rf * Math.cos(ang(i))).toFixed(1)},${(cy + rf * Math.sin(ang(i))).toFixed(1)}`;
  }).join(' ');

  const lblDist = r + 14;
  const lbls = axes.map((ax, i) => {
    const lx = cx + lblDist * Math.cos(ang(i));
    const ly = cy + lblDist * Math.sin(ang(i));
    const anchor = Math.cos(ang(i)) > 0.15 ? 'start' : Math.cos(ang(i)) < -0.15 ? 'end' : 'middle';
    return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle" font-size="8" fill="var(--text-muted)" font-family="sans-serif">${ax}</text>`;
  });

  const dotPts = values.map((v, i) => {
    const rf = r * v;
    return `<circle cx="${(cx + rf * Math.cos(ang(i))).toFixed(1)}" cy="${(cy + rf * Math.sin(ang(i))).toFixed(1)}" r="3" style="fill:${color}"/>`;
  });

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    ${grids.join('\n    ')}
    ${axLines.join('\n    ')}
    <polygon points="${dataPts}" style="fill:${color};fill-opacity:.15;stroke:${color}" stroke-width="2" stroke-linejoin="round"/>
    ${dotPts.join('\n    ')}
    ${lbls.join('\n    ')}
  </svg>`;
}

export function hbarListHTML(items, maxVal, colorFn) {
  return `<div class="an-hbar-list">${items.map((it, i) => {
    const pct  = Math.max(4, (it.val / maxVal) * 100);
    const fill = colorFn ? colorFn(it, i) : 'var(--text)';
    return `<div class="an-hbar-item">
      <div class="an-hbar-top">
        <span class="an-hbar-name">${it.name}</span>
        <span class="an-hbar-val">${it.label}</span>
      </div>
      <div class="an-hbar-track">
        <div class="an-hbar-fill" style="width:${pct.toFixed(1)}%;background:${fill}"></div>
      </div>
    </div>`;
  }).join('')}</div>`;
}
