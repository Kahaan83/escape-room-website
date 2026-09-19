/**
 * Room 6 — The Séance Parlour.
 *
 * Two movements. First lay the five offerings on the star in the order the
 * star is *drawn* — one unbroken stroke from the crown — which is not the
 * order they were collected. Then put the curse back into verse; the rhymes
 * are the only guide.
 */

import { el } from '../ui.js';
import { ITEMS, ITEM_ORDER } from '../items.js';

// Point 0 is the crown; the rest run clockwise.
const POINTS = [
  { id: 0, x: 50, y: 8, label: 'crown' },
  { id: 1, x: 89.9, y: 37, label: 'upper right' },
  { id: 2, x: 74.7, y: 84, label: 'lower right' },
  { id: 3, x: 25.3, y: 84, label: 'lower left' },
  { id: 4, x: 10.1, y: 37, label: 'upper left' },
];

// One continuous stroke: crown → lower right → upper left → upper right → lower left.
const STROKE = [0, 2, 4, 1, 3];

export const CURSE = [
  'From dust we came, in shadows we thrive…',
  '…with chaos brewed to keep us alive.',
  '…the poisoned roots run deep and old,',
  '…weaving webs that strictly hold.',
  '…unlock the dark and break the seal!',
];

const starPath = () => {
  const seq = [...STROKE, STROKE[0]];
  return seq.map((p, i) => `${i ? 'L' : 'M'}${POINTS[p].x} ${POINTS[p].y}`).join(' ');
};

export default {
  id: 'ritual',
  title: 'The Grand Ritual',
  hotspotLabel: 'Begin the ritual',
  brief: 'Five offerings, five points, and a curse that has come apart in your pocket. Cousin Itt is listening.',
  hints: [
    'The star is drawn in one stroke without lifting the hand. Lay the first offering where the stroke begins, the second where it goes next, and so on.',
    'From the crown, a single stroke travels to the lower right, then across to the upper left, then to the upper right, then to the lower left.',
    'Crown: grave dust. Lower right: elixir. Upper left: nightshade. Upper right: spider. Lower left: rose. Then read the curse so the lines rhyme in pairs — thrive/alive, old/hold — and end on the seal.',
  ],

  render(api) {
    const saved = api.load();
    let onStar = saved.onStar || {};     // pointId -> itemId
    let order = saved.order || [];       // indices into CURSE, in chosen order
    let phase = saved.phase || 'place';
    let picked = null;

    const root = el('div', { class: 'puzzle-grid' });
    const verdict = el('p', { class: 'verdict' }, '\u00a0');

    /* --- movement one: the offerings ------------------------------------- */

    function drawPlacing() {
      const wrap = el('div', { class: 'puzzle-grid' });
      wrap.append(el('div', { class: 'vellum', html: `
        <h4>The rite, as Grandmama left it</h4>
        <p>Lay the offerings <em>as the star is drawn</em> — one stroke, never lifting
        the hand, beginning at the crown. Lay them in the order the house gave them
        to you.</p>` }));

      const board = el('div', { class: 'pentagram' });
      board.innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="50" cy="50" r="46" fill="rgba(12,7,16,.6)" stroke="#4a3a20" stroke-width=".6"/>
        <path d="${starPath()}" fill="none" stroke="#c8a24a" stroke-width=".8" opacity=".75"/>
      </svg>`;

      for (const p of POINTS) {
        const held = onStar[p.id];
        const node = el('button', {
          class: `point${held ? ' filled' : ''}`, type: 'button',
          style: `left:${p.x}%; top:${p.y}%`,
          'aria-label': held ? `${p.label}: ${ITEMS[held].name}` : `${p.label}, empty`,
        });
        node.innerHTML = held ? ITEMS[held].icon : `<span>${p.label}</span>`;
        node.addEventListener('click', () => {
          if (held) {
            const next = { ...onStar }; delete next[p.id];
            onStar = next; api.sfx.click();
          } else if (picked) {
            onStar = { ...onStar, [p.id]: picked };
            picked = null; api.sfx.place();
          } else { return; }
          api.save({ onStar });
          draw();
        });
        board.append(node);
      }

      const offers = el('div', { class: 'offer-row' });
      for (const id of ITEM_ORDER) {
        const used = Object.values(onStar).includes(id);
        const node = el('button', {
          class: `offer${used ? ' used' : ''}${picked === id ? ' picked' : ''}`,
          type: 'button', disabled: used, 'aria-label': ITEMS[id].name, title: ITEMS[id].name,
          html: ITEMS[id].icon,
        });
        node.addEventListener('click', () => { picked = picked === id ? null : id; api.sfx.pick(); draw(); });
        offers.append(node);
      }

      const speak = el('button', { class: 'btn btn-primary', type: 'button' }, 'Light the circle');
      speak.addEventListener('click', () => {
        if (Object.keys(onStar).length < 5) {
          verdict.className = 'verdict is-no';
          verdict.textContent = 'Five points. Five offerings. The star is not interested in a partial effort.';
          return;
        }
        const ok = STROKE.every((pointId, step) => onStar[pointId] === ITEM_ORDER[step]);
        if (ok) {
          api.sfx.open();
          phase = 'recite';
          api.save({ phase });
          verdict.className = 'verdict is-ok';
          verdict.textContent = 'The candles bend inward. Something on the other side turns to face you.';
          draw();
        } else {
          verdict.className = 'verdict is-no';
          verdict.textContent = 'The circle spits everything back. The stroke was broken somewhere.';
          onStar = {}; api.save({ onStar });
          api.wrong();
          draw();
        }
      });

      wrap.append(board, el('p', { class: 'muted-note', style: 'text-align:center' }, 'Click an offering, then a point of the star.'), offers, el('div', { class: 'stack', style: 'justify-content:center' }, speak));
      return wrap;
    }

    /* --- movement two: the curse ------------------------------------------ */

    function drawReciting() {
      const wrap = el('div', { class: 'puzzle-grid' });
      wrap.append(el('div', { class: 'vellum', html: `
        <h4>The Ancestral Curse</h4>
        <p>Five lines, shuffled by five pockets. Click them into the order they were
        meant to be spoken — it is verse, and verse gives itself away.</p>` }));

      // A fixed shuffle so the puzzle is the same for everyone.
      const shuffled = [2, 4, 0, 3, 1];
      const list = el('div', { class: 'curse-lines' });
      for (const i of shuffled) {
        const pos = order.indexOf(i);
        const node = el('button', { class: 'curse-line', type: 'button' },
          el('span', { class: 'curse-ord' }, pos >= 0 ? String(pos + 1) : '·'),
          el('span', {}, CURSE[i]));
        node.addEventListener('click', () => {
          order = pos >= 0 ? order.filter((x) => x !== i) : [...order, i];
          api.save({ order });
          api.sfx.pick();
          draw();
        });
        list.append(node);
      }

      const recite = el('button', { class: 'btn btn-primary', type: 'button' }, 'Speak the curse');
      recite.addEventListener('click', () => {
        if (order.length < 5) {
          verdict.className = 'verdict is-no';
          verdict.textContent = 'You trail off. All five lines, or none.';
          return;
        }
        if (order.join() === '0,1,2,3,4') {
          api.solve();
        } else {
          verdict.className = 'verdict is-no';
          verdict.textContent = 'The words come out in the wrong order and the room gets colder in protest.';
          order = []; api.save({ order });
          api.wrong();
          draw();
        }
      });

      wrap.append(list, el('div', { class: 'stack', style: 'justify-content:center' }, recite));
      return wrap;
    }

    function draw() {
      root.replaceChildren(phase === 'place' ? drawPlacing() : drawReciting(), verdict);
    }

    draw();
    return root;
  },
};
