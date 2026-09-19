/**
 * Room 5 — The Cellar.
 *
 * Two stages. The lockbox takes the combination the dinner table produced.
 * Inside is the generator key, and the generator itself is a rotation puzzle:
 * turn the conduit segments until current runs from the mains to the lamp.
 */

import { el } from '../ui.js';

const N = 1, E = 2, S = 4, W = 8;
const SIZE = 5;
const SRC = { r: 2, c: 0 };
const DST = { r: 2, c: 4 };
const CODE = '842';

const idx = (r, c) => r * SIZE + c;
const rotate = (mask, times) => {
  let m = mask;
  for (let i = 0; i < ((times % 4) + 4) % 4; i++) m = ((m << 1) | (m >> 3)) & 0b1111; // N→E→S→W
  return m;
};

function mulberry32(seed) {
  return function rand() {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A randomised spanning tree, generated from a fixed seed so every player
 *  gets the same board and the board is always solvable. */
export function buildBoard(seed = 20261031) {
  const rand = mulberry32(seed);
  const masks = new Array(SIZE * SIZE).fill(0);
  const seen = new Set([idx(SRC.r, SRC.c)]);
  const stack = [{ ...SRC }];
  const dirs = [
    { bit: N, opp: S, dr: -1, dc: 0 },
    { bit: E, opp: W, dr: 0, dc: 1 },
    { bit: S, opp: N, dr: 1, dc: 0 },
    { bit: W, opp: E, dr: 0, dc: -1 },
  ];

  while (stack.length) {
    const cur = stack[stack.length - 1];
    const options = dirs
      .map((d) => ({ d, r: cur.r + d.dr, c: cur.c + d.dc }))
      .filter((o) => o.r >= 0 && o.r < SIZE && o.c >= 0 && o.c < SIZE && !seen.has(idx(o.r, o.c)));
    if (!options.length) { stack.pop(); continue; }
    const pick = options[Math.floor(rand() * options.length)];
    masks[idx(cur.r, cur.c)] |= pick.d.bit;
    masks[idx(pick.r, pick.c)] |= pick.d.opp;
    seen.add(idx(pick.r, pick.c));
    stack.push({ r: pick.r, c: pick.c });
  }

  masks[idx(SRC.r, SRC.c)] |= W;   // the mains come in here
  masks[idx(DST.r, DST.c)] |= E;   // and the lamp hangs off here

  // Scramble, making sure nothing starts already in place.
  const turns = masks.map((m, i) => {
    if (!m) return 0;
    let t = Math.floor(rand() * 4);
    if (t === 0 && i !== idx(SRC.r, SRC.c)) t = 1 + Math.floor(rand() * 3);
    return t;
  });
  return { masks, turns };
}

/** Which cells currently carry current, walking out from the mains. */
export function energised(masks, turns) {
  const live = new Set();
  const at = (r, c) => rotate(masks[idx(r, c)], turns[idx(r, c)]);
  if (!(at(SRC.r, SRC.c) & W)) return live;
  const queue = [SRC];
  live.add(idx(SRC.r, SRC.c));
  const steps = [
    { bit: N, opp: S, dr: -1, dc: 0 },
    { bit: E, opp: W, dr: 0, dc: 1 },
    { bit: S, opp: N, dr: 1, dc: 0 },
    { bit: W, opp: E, dr: 0, dc: -1 },
  ];
  while (queue.length) {
    const { r, c } = queue.shift();
    for (const s of steps) {
      const nr = r + s.dr, nc = c + s.dc;
      if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) continue;
      if (live.has(idx(nr, nc))) continue;
      if ((at(r, c) & s.bit) && (at(nr, nc) & s.opp)) {
        live.add(idx(nr, nc));
        queue.push({ r: nr, c: nc });
      }
    }
  }
  return live;
}

export const isPowered = (masks, turns) =>
  energised(masks, turns).has(idx(DST.r, DST.c)) && (rotate(masks[idx(DST.r, DST.c)], turns[idx(DST.r, DST.c)]) & E);

function cellSvg(mask) {
  const arms = [
    mask & N ? 'M24 24V0' : '',
    mask & E ? 'M24 24H48' : '',
    mask & S ? 'M24 24V48' : '',
    mask & W ? 'M24 24H0' : '',
  ].filter(Boolean).map((d) => `<path class="wire" d="${d}"/>`).join('');
  const cap = [N, E, S, W].filter((b) => mask & b).length === 1
    ? '<circle class="node" cx="24" cy="24" r="7"/>' : '<circle class="node" cx="24" cy="24" r="4"/>';
  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${arms}${cap}</svg>`;
}

export default {
  id: 'generator',
  title: 'The Cellar',
  hotspotLabel: 'Open the lockbox',
  brief: 'A lockbox bolted to a crate, and behind it a generator that has not run since the last funeral.',
  hints: [
    'The dinner table already gave you three digits. Dial them in the order they were served, left to right.',
    'In the conduit, click a segment to turn it a quarter turn. Lit segments are carrying current — build outward from the live end rather than guessing at the far side.',
    'The combination is 842. For the conduit, work from the mains on the left and follow the lit wire; every dead end you create is a segment pointing at a wall.',
  ],

  render(api) {
    const saved = api.load();
    const board = buildBoard();
    let turns = saved.turns || board.turns.slice();
    let unlocked = saved.unlocked || false;
    let dials = saved.dials || [0, 0, 0];

    const root = el('div', { class: 'puzzle-grid' });
    const verdict = el('p', { class: 'verdict' }, '\u00a0');

    function drawLock() {
      const wrap = el('div', { class: 'puzzle-grid' });
      wrap.append(el('div', { class: 'vellum', html: `
        <h4>Bolted to the crate</h4>
        <p>A steel lockbox with three brass dials. Scratched into the lid:
        <em>“Left to right, as they were served.”</em></p>` }));

      const row = el('div', { class: 'dials' });
      dials.forEach((v, i) => {
        const num = el('div', { class: 'dial-num' }, String(v));
        const bump = (by) => {
          dials = dials.map((d, j) => (j === i ? (d + by + 10) % 10 : d));
          num.textContent = String(dials[i]);
          api.save({ dials });
          api.sfx.click();
        };
        row.append(el('div', { class: 'dial' },
          el('button', { class: 'dial-btn', type: 'button', 'aria-label': `Dial ${i + 1} up`, onClick: () => bump(1) }, '▲'),
          num,
          el('button', { class: 'dial-btn', type: 'button', 'aria-label': `Dial ${i + 1} down`, onClick: () => bump(-1) }, '▼')));
      });

      const open = el('button', { class: 'btn btn-primary', type: 'button' }, 'Pull the shackle');
      open.addEventListener('click', () => {
        if (dials.join('') === CODE) {
          unlocked = true;
          api.save({ unlocked });
          api.sfx.open();
          api.say('The shackle drops. Inside: one brass key, warm for no good reason.');
          draw();
        } else {
          verdict.className = 'verdict is-no';
          verdict.textContent = 'The shackle does not move. Somewhere upstairs, something laughs.';
          api.wrong();
        }
      });

      wrap.append(row, el('div', { class: 'stack' }, open));
      return wrap;
    }

    function drawCircuit() {
      const wrap = el('div', { class: 'puzzle-grid' });
      wrap.append(el('div', { class: 'vellum', html: `
        <h4>Generator, front panel</h4>
        <p>The key turns. Behind the plate is a nest of conduit, every segment
        loose on its collar. Current enters on the left and the house lamp hangs
        on the right.</p>
        <p class="muted-note" style="color:#5c3b1f">Click a segment to turn it a quarter turn.</p>` }));

      const grid = el('div', { class: 'circuit', style: `grid-template-columns: repeat(${SIZE}, auto)` });
      const cells = [];

      const paint = () => {
        const live = energised(board.masks, turns);
        cells.forEach((node, i) => {
          node.classList.toggle('live', live.has(i));
          node.innerHTML = cellSvg(rotate(board.masks[i], turns[i]));
        });
      };

      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          const i = idx(r, c);
          const cell = el('button', { class: 'cell', type: 'button', 'aria-label': `Conduit ${r + 1}, ${c + 1}` });
          cell.addEventListener('click', () => {
            turns = turns.map((t, j) => (j === i ? (t + 1) % 4 : t));
            api.save({ turns });
            api.sfx.click();
            paint();
            if (isPowered(board.masks, turns)) {
              setTimeout(() => api.solve(), 260);
            }
          });
          cells.push(cell);
          grid.append(cell);
        }
      }
      paint();

      wrap.append(
        el('div', { class: 'stack', style: 'justify-content:center' },
          el('span', { class: 'muted-note' }, '⚡ mains'), grid, el('span', { class: 'muted-note' }, 'lamp 💡')),
      );
      return wrap;
    }

    function draw() {
      root.replaceChildren(unlocked ? drawCircuit() : drawLock(), verdict);
    }

    draw();
    return root;
  },
};
