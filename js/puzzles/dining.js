/**
 * Room 4 — The Deadly Dining Table.
 *
 * Fourteen spiders, three plates, four rules that only one arrangement
 * satisfies. The resulting counts read left to right as the combination for
 * the cellar lockbox.
 */

import { el } from '../ui.js';

const TOTAL = 14;
const PLATES = [
  { key: 'gomez', name: 'Gomez', want: 8 },
  { key: 'morticia', name: 'Morticia', want: 4 },
  { key: 'wednesday', name: 'Wednesday', want: 2 },
];

const SPIDER = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g stroke="#b5a893" stroke-width="1.4" fill="none" stroke-linecap="round">
    <path d="M9 10 3 6M9 12H2M9 15l-6 4M18 10l3-4M18 12h4M18 15l3 4"/>
  </g>
  <ellipse cx="13.5" cy="13" rx="4.2" ry="5.2" fill="#15101a" stroke="#b5a893" stroke-width="1.2"/>
  <circle cx="13.5" cy="8" r="2.6" fill="#241a1f" stroke="#b5a893" stroke-width="1"/>
</svg>`;

const WIDOW = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g stroke="#c8a24a" stroke-width="1.8" fill="none" stroke-linecap="round">
    <path d="M18 22 7 14M18 26 6 25M19 30 8 36M21 33l-6 8M30 22l11-8M30 26l12-1M29 30l11 6M27 33l6 8"/>
  </g>
  <ellipse cx="24" cy="28" rx="7.5" ry="9.5" fill="#15101a" stroke="#c8a24a" stroke-width="1.6"/>
  <circle cx="24" cy="19" r="4.6" fill="#241a1f" stroke="#c8a24a" stroke-width="1.4"/>
  <path d="M24 24v8M21 28h6" stroke="#8d2230" stroke-width="2.2" stroke-linecap="round"/>
</svg>`;

export default {
  id: 'dining',
  title: 'The Deadly Dining Table',
  hotspotLabel: 'Set the table',
  brief: 'Dinner is served, and the guests have opinions about portion sizes. Serve every spider on the cloth without breaking a single rule.',
  hints: [
    'Work backwards from Wednesday. Her portion is the only number the menu states outright.',
    'Doubling from Wednesday gives you Morticia, and doubling again gives you Gomez. Check the three portions add up to everything on the cloth.',
    'Gomez 8, Morticia 4, Wednesday 2 — fourteen spiders, no leftovers.',
  ],

  render(api) {
    const saved = api.load();
    let placed = saved.placed || { gomez: 0, morticia: 0, wednesday: 0 };
    let picked = false;

    const root = el('div', { class: 'puzzle-grid' });
    const verdict = el('p', { class: 'verdict' }, '\u00a0');

    const menu = el('div', { class: 'vellum', html: `
      <h4>Tonight — Arachnid Stew</h4>
      <p>The Master takes twice what the Mistress takes.<br>
      The Mistress takes twice what the Daughter takes.<br>
      The Daughter takes two; she is watching her figure.<br>
      Nothing is left on the cloth — the house does not tolerate leftovers.</p>
      <p class="muted-note" style="color:#5c3b1f">Beneath, in pencil: “Serve left to right and the
      numbers will open something in the cellar.”</p>` });

    const cloth = el('div', { class: 'table-cloth' });
    const platesRow = el('div', { class: 'plates' });
    const pool = el('div', { class: 'cloth-pool' });
    cloth.append(platesRow, pool);

    function remaining() {
      return TOTAL - PLATES.reduce((n, p) => n + placed[p.key], 0);
    }

    function draw() {
      platesRow.replaceChildren();
      for (const p of PLATES) {
        const dish = el('div', { class: 'plate-dish' });
        for (let i = 0; i < placed[p.key]; i++) {
          dish.append(el('span', { class: 'spider', html: SPIDER, style: `transform:rotate(${(i * 47) % 360}deg)` }));
        }
        const plate = el('div', {
          class: 'plate', role: 'button', tabindex: '0',
          'aria-label': `${p.name}'s plate, ${placed[p.key]} spiders. Click to serve or take one back.`,
        }, dish, el('span', { class: 'plate-name' }, p.name, ' ', el('span', { class: 'plate-count' }, `(${placed[p.key]})`)));

        const act = () => {
          if (picked) {
            if (remaining() <= 0) return;
            placed = { ...placed, [p.key]: placed[p.key] + 1 };
            picked = false;
            api.sfx.place();
          } else if (placed[p.key] > 0) {
            placed = { ...placed, [p.key]: placed[p.key] - 1 };
            api.sfx.click();
          } else {
            return;
          }
          api.save({ placed });
          draw();
        };
        plate.addEventListener('click', act);
        plate.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
        platesRow.append(plate);
      }

      pool.replaceChildren();
      const left = remaining();
      for (let i = 0; i < left; i++) {
        const s = el('button', {
          class: `spider${picked && i === 0 ? ' picked' : ''}`, type: 'button',
          html: SPIDER, 'aria-label': 'A spider on the cloth',
          style: `transform:rotate(${(i * 61) % 360}deg)`,
        });
        s.addEventListener('click', () => { picked = !picked; api.sfx.pick(); draw(); });
        pool.append(s);
      }
      if (!left) pool.append(el('p', { class: 'muted-note' }, 'The cloth is bare.'));
      hint.textContent = picked
        ? 'A spider is in your hand. Click a plate to serve it.'
        : `${left} still on the cloth. Click one to pick it up, or click a plate to take one back.`;
    }

    const hint = el('p', { class: 'muted-note' });

    const ring = el('button', { class: 'btn btn-primary', type: 'button' }, 'Ring the dinner bell');
    ring.addEventListener('click', () => {
      if (remaining() > 0) {
        verdict.className = 'verdict is-no';
        verdict.textContent = 'Leftovers. The chandelier makes a noise you do not like.';
        api.wrong();
        return;
      }
      if (PLATES.every((p) => placed[p.key] === p.want)) {
        api.solve();
      } else {
        verdict.className = 'verdict is-no';
        verdict.textContent = 'Somebody is insulted. The portions are wrong and everything scuttles back onto the cloth.';
        placed = { gomez: 0, morticia: 0, wednesday: 0 };
        api.save({ placed });
        draw();
        api.wrong();
      }
    });

    draw();
    root.append(menu, hint, cloth, el('div', { class: 'stack' }, ring), verdict);
    return root;
  },

  /** Shown once the table is correct — the reward screen reveals the combination. */
  reward: { widow: WIDOW, code: '842' },
};
