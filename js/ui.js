/** Small DOM helpers plus the overlay and toast controllers. */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

/* --- screens -------------------------------------------------------------- */

export function showScreen(id) {
  $$('.screen').forEach((s) => {
    if (s.id === id) {
      s.classList.add('is-active');
      requestAnimationFrame(() => s.classList.add('is-visible'));
    } else {
      s.classList.remove('is-visible');
      setTimeout(() => { if (!s.classList.contains('is-visible')) s.classList.remove('is-active'); }, 500);
    }
  });
}

/* --- overlay -------------------------------------------------------------- */

let onOverlayClose = null;
let lastFocus = null;

export function openOverlay(title, body, { onClose } = {}) {
  const overlay = $('#overlay');
  lastFocus = document.activeElement;
  $('#overlay-title').textContent = title;
  const host = $('#overlay-body');
  host.replaceChildren();
  host.append(body);
  overlay.hidden = false;
  onOverlayClose = onClose || null;
  const focusable = host.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  (focusable || $('.overlay-close')).focus();
}

export function closeOverlay() {
  const overlay = $('#overlay');
  if (overlay.hidden) return;
  overlay.hidden = true;
  $('#overlay-body').replaceChildren();
  const cb = onOverlayClose;
  onOverlayClose = null;
  if (lastFocus && lastFocus.isConnected) lastFocus.focus();
  if (cb) cb();
}

export function overlayIsOpen() { return !$('#overlay').hidden; }

export function initOverlay() {
  $('#overlay').addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeOverlay();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlayIsOpen()) closeOverlay();
    if (e.key === 'Tab' && overlayIsOpen()) trapFocus(e);
  });
}

function trapFocus(e) {
  const panel = $('#overlay-panel');
  const items = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', panel)
    .filter((n) => !n.disabled && n.offsetParent !== null);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/* --- toast ---------------------------------------------------------------- */

let toastTimer = null;
export function toast(message, ms = 3200) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('is-up');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('is-up'), ms);
}

/* --- misc ----------------------------------------------------------------- */

export function mmss(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** Click-to-select interaction shared by the ordering puzzles. */
export function makeSelector() {
  let picked = null;
  let pickedNode = null;
  return {
    get value() { return picked; },
    pick(value, node) {
      if (pickedNode) pickedNode.classList.remove('picked');
      if (picked === value) { picked = null; pickedNode = null; return null; }
      picked = value; pickedNode = node;
      if (node) node.classList.add('picked');
      return picked;
    },
    clear() {
      if (pickedNode) pickedNode.classList.remove('picked');
      picked = null; pickedNode = null;
    },
  };
}
