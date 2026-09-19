/**
 * Single source of truth for a run. Everything the UI draws comes from here,
 * and every change is persisted so a refresh mid-séance is survivable.
 */

const KEY = 'addams-mansion-run-v1';
export const START_SECONDS = 45 * 60;
export const HINT_PENALTY = 3 * 60;
export const MAX_HINTS = 3;

function blank() {
  return {
    v: 1,
    secondsLeft: START_SECONDS,
    running: false,
    hintsUsed: 0,
    hintTier: {},        // roomId -> how many hints revealed for that room
    currentRoom: 'gallery',
    solved: [],          // roomIds
    items: [],           // itemIds, in the order collected
    lines: [],           // curse lines earned
    journal: [],         // { id, title, text }
    puzzles: {},         // roomId -> puzzle-local persisted state
    muted: false,
    finished: null,      // 'escaped' | 'trapped'
  };
}

let state = blank();
const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  for (const fn of listeners) fn(state);
}

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
  }, 250);
}

/** Mutate state through here so persistence and redraws never drift apart. */
export function update(patch, { silent = false } = {}) {
  state = typeof patch === 'function' ? patch(state) : { ...state, ...patch };
  save();
  if (!silent) emit();
  return state;
}

export function get() { return state; }

export function hasSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed && parsed.v === 1 && !parsed.finished && parsed.secondsLeft > 0
      && (parsed.solved.length > 0 || parsed.secondsLeft < START_SECONDS);
  } catch { return false; }
}

export function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    if (parsed && parsed.v === 1) {
      state = { ...blank(), ...parsed, running: false };
      emit();
      return true;
    }
  } catch { /* fall through */ }
  return false;
}

export function reset() {
  const muted = state.muted;
  state = { ...blank(), muted };
  save();
  emit();
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/* --- convenience readers -------------------------------------------------- */

export const isSolved = (roomId) => state.solved.includes(roomId);
export const hasItem = (itemId) => state.items.includes(itemId);
export const hintsLeft = () => MAX_HINTS - state.hintsUsed;

/** Puzzle modules stash their own progress here without knowing about storage. */
export function puzzleState(roomId, patch) {
  if (patch === undefined) return state.puzzles[roomId] || {};
  const next = { ...(state.puzzles[roomId] || {}), ...patch };
  update({ puzzles: { ...state.puzzles, [roomId]: next } }, { silent: true });
  return next;
}
