// Single source of truth for all repeated HTML patterns in analytics.
// Import from here — never write these patterns inline.

export function cardHead(icon, title, badge, badgeStyle) {
  if (!badge) return `<div class="an-card-head"><span class="an-card-title"><span class="msi">${icon}</span>${title}</span></div>`;
  const s = badgeStyle ? ` style="${badgeStyle}"` : '';
  return `<div class="an-card-head">
    <span class="an-card-title"><span class="msi">${icon}</span>${title}</span>
    <span class="an-card-badge"${s}>${badge}</span>
  </div>`;
}

export function statRow(icon, label, value, sub, valueColor) {
  const s  = sub        ? `<span class="an-stat-row-sub">${sub}</span>` : '';
  const vc = valueColor ? ` style="color:${valueColor}"`               : '';
  return `<div class="an-stat-row">
    <span class="an-stat-row-lbl"><span class="msi">${icon}</span>${label}</span>
    <div class="an-stat-row-right"><span class="an-stat-row-val"${vc}>${value}</span>${s}</div>
  </div>`;
}

export function statRows(content, style) {
  const s = style ? ` style="${style}"` : '';
  return `<div class="an-stat-rows"${s}>${content}</div>`;
}

export function legendItem(color, name, value, pct) {
  const p = pct != null ? `<span class="an-leg-pct">${pct}</span>` : '';
  return `<div class="an-leg-item">
    <div class="an-leg-dot" style="background:${color}"></div>
    <span class="an-leg-name">${name}</span>
    <span class="an-leg-val">${value}</span>
    ${p}
  </div>`;
}

// variant: 'blue' | 'green' | 'amber' | 'violet' | 'gray' | 'rose'
export function miniStat(variant, value, label) {
  return `<div class="an-mini ${variant}">
    <span class="an-mini-val">${value}</span>
    <span class="an-mini-lbl">${label}</span>
  </div>`;
}

export function miniGrid(cols, content, style) {
  const colStyle   = cols !== 3 ? `grid-template-columns:repeat(${cols},1fr)` : '';
  const allStyle   = [colStyle, style].filter(Boolean).join(';');
  const s = allStyle ? ` style="${allStyle}"` : '';
  return `<div class="an-mini-grid"${s}>${content}</div>`;
}

// variant: 'warm' | undefined
export function gaugeBar(labelLeft, labelRight, pct, variant) {
  const cls = variant ? ` ${variant}` : '';
  return `<div class="an-gauge-wrap">
    <div class="an-gauge-labels">
      <span class="an-gauge-lbl">${labelLeft}</span>
      <span class="an-gauge-lbl">${labelRight}</span>
    </div>
    <div class="an-gauge"><div class="an-gauge-fill${cls}" style="width:${pct}%"></div></div>
  </div>`;
}

export function bigNumber(value, label, badge, style) {
  const b = badge || '';
  const s = style ? ` style="${style}"` : '';
  return `<div class="an-big"${s}>
    <span class="an-big-val">${value}</span>
    <span class="an-big-lbl">${label}</span>
    ${b}
  </div>`;
}

// status: 'warn' | 'danger' | 'info'
export function anBadge(status, text, icon, style) {
  const ico = icon ? `<span class="msi">${icon}</span> ` : '';
  const s   = style ? ` style="${style}"` : '';
  return `<div class="an-badge ${status}"${s}>${ico}${text}</div>`;
}

export function sectionLabel(icon, label, noTop) {
  return `<div class="an-section-lbl${noTop ? ' no-top' : ''}"><span class="msi">${icon}</span>${label}</div>`;
}

// CVR hi/mid/lo calculado internamente — no se puede construir inconsistente
export function convRow(title, views, dl, cvr) {
  const cls = cvr >= 23 ? 'hi' : cvr >= 19 ? 'mid' : 'lo';
  return `<div class="an-conv-row">
    <span class="an-conv-name">${title}</span>
    <span class="an-conv-num">${views}</span>
    <span class="an-conv-num">${dl}</span>
    <span class="an-conv-badge ${cls}">${cvr}%</span>
  </div>`;
}

export function expiryItem(title, date) {
  return `<div class="an-expiry-item">
    <span class="an-expiry-name">${title}</span>
    <span class="an-expiry-date"><span class="msi">event</span> ${date}</span>
  </div>`;
}

export function radarLegItem(color, name, value) {
  return `<div class="an-radar-leg-item">
    <div class="an-radar-dot" style="background:${color}"></div>
    <span class="an-radar-leg-name">${name}</span>
    <span class="an-radar-leg-val">${value}</span>
  </div>`;
}
