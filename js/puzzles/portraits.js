/**
 * Room 1 — The Portrait Gallery.
 *
 * Four ancestors, four plaques. Hang them in the order they died, earliest
 * nearest the door. The years are Roman numerals; one plaque was hung by a
 * ghost and reads backwards; one gives no year at all and must be worked out
 * from a sibling's date of birth.
 */

import { el, makeSelector } from '../ui.js';

const face = (hair, skin = '#463a4a') => `
  <svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="100" height="130" fill="#150d1a"/>
    <ellipse cx="50" cy="104" rx="34" ry="30" fill="#2a1f31"/>
    <ellipse cx="50" cy="58" rx="21" ry="26" fill="${skin}"/>
    ${hair}
    <circle cx="43" cy="55" r="2.6" fill="#0d0710"/><circle cx="57" cy="55" r="2.6" fill="#0d0710"/>
    <path d="M44 74q6 4 12 0" fill="none" stroke="#2a2030" stroke-width="1.6"/>
  </svg>`;

const ANCESTORS = [
  {
    id: 'thaddeus',
    name: 'Thaddeus',
    epitaph: 'Choked, laughing, on a bee.',
    year: 1789,
    plaque: 'DIED MDCCLXXXIX',
    art: face(`<path d="M27 46q23-30 46 0-8 40-23 6-15 34-23-6Z" fill="#171220"/><path d="M34 84q16 16 32 0l8 18H26Z" fill="#241a2c"/>`),
  },
  {
    id: 'ophelia',
    name: 'Ophelia',
    epitaph: 'Drowned in the lily pond. Smiling.',
    year: 1812,
    plaque: 'BORN MDCCXCI · DIED MDCCCXII',
    mirrored: true,
    art: face(`<path d="M26 50q24-32 48 0l7 62q-31-20-62 0Z" fill="#100c14"/>`, '#50425c'),
  },
  {
    id: 'cornelius',
    name: 'Cornelius',
    epitaph: 'Struck by lightning. Twice.',
    year: 1844,
    plaque: "DIED THE YEAR OPHELIA WAS BORN, PLUS FIFTY-THREE",
    art: face(`<path d="M28 44q22-24 44 0-22-10-44 0Z" fill="#12101a"/><path d="M22 60q-6-22 6-28M78 60q6-22-6-28" fill="none" stroke="#12101a" stroke-width="5"/>`),
  },
  {
    id: 'drusilla',
    name: 'Drusilla',
    epitaph: 'Never did recover from the spring.',
    year: 1907,
    plaque: 'DIED MCMVII',
    art: face(`<path d="M30 48h40v12H30Z" fill="#171220"/><path d="M30 48q20-24 40 0Z" fill="#171220"/><path d="M22 96q28-12 56 0l6 16H16Z" fill="#241a2c"/>`, '#4c4054'),
  },
];

const SOLUTION = ['thaddeus', 'ophelia', 'cornelius', 'drusilla'];

export default {
  id: 'gallery',
  title: 'The Portrait Gallery',
  hotspotLabel: 'Straighten the portraits',
  brief: 'Four ancestors, taken down for dusting and never put back. The wall plate below them is quite specific about how they are meant to hang.',
  hints: [
    'The plaques are dated in Roman numerals. M = 1000, D = 500, C = 100, L = 50, X = 10, V = 5, I = 1 — a smaller letter placed before a larger one subtracts.',
    'One plaque was hung by something that reads right to left, so its date is mirrored. Another gives no date at all — but Ophelia’s plaque tells you when she was born.',
    'Left to right: Thaddeus (1789), Ophelia (1812), Cornelius (1844), Drusilla (1907).',
  ],

  render(api) {
    const saved = api.load();
    let rack = saved.rack || [null, null, null, null];
    const sel = makeSelector();

    const root = el('div', { class: 'puzzle-grid' });

    const plate = el('div', { class: 'vellum' }, el('div', {
      html: `<h4>A house rule</h4>
      <p>Hang us as we fell — the first to die nearest the door, the last to die
      farthest from it. Any other arrangement is considered <em>rude</em>.</p>
      <p class="muted-note">The door is on your left.</p>`,
    }));

    const poolWrap = el('div');
    const rackWrap = el('div');
    const verdict = el('p', { class: 'verdict' }, '\u00a0');

    const portraitNode = (a, { compact = false } = {}) => {
      const node = el('button', {
        class: 'portrait',
        type: 'button',
        'aria-label': `${a.name}. ${a.epitaph} ${a.plaque}`,
      });
      node.innerHTML = `${a.art}
        <span class="portrait-name">${a.name}</span>
        ${compact ? '' : `<span class="portrait-year${a.mirrored ? ' mirrored' : ''}">${a.plaque}</span>`}`;
      return node;
    };

    function draw() {
      poolWrap.replaceChildren();
      rackWrap.replaceChildren();

      const pool = el('div', { class: 'portrait-pool' });
      for (const a of ANCESTORS) {
        if (rack.includes(a.id)) continue;
        const node = portraitNode(a);
        node.addEventListener('click', () => { api.sfx.pick(); sel.pick(a.id, node); });
        pool.append(node);
      }
      if (!pool.children.length) pool.append(el('p', { class: 'muted-note' }, 'All four are on the wall.'));
      poolWrap.append(
        el('p', { class: 'muted-note' }, 'Leaning against the wainscot — click one, then click a hook.'),
        pool,
      );

      const row = el('div', { class: 'portrait-rack' });
      rack.forEach((id, i) => {
        const slot = el('button', { class: 'rack-slot', type: 'button', 'aria-label': `Hook ${i + 1}` });
        if (id) {
          slot.append(portraitNode(ANCESTORS.find((a) => a.id === id), { compact: true }));
        } else {
          slot.append(el('span', {}, `hook ${i + 1}`));
        }
        slot.addEventListener('click', () => {
          if (id) {
            rack[i] = null;
            api.sfx.click();
          } else if (sel.value) {
            rack[i] = sel.value;
            sel.clear();
            api.sfx.place();
          } else {
            return;
          }
          api.save({ rack });
          draw();
        });
        row.append(slot);
      });
      rackWrap.replaceChildren(
        el('p', { class: 'muted-note' }, 'The hooks, left (nearest the door) to right.'),
        row,
      );
    }

    const check = el('button', { class: 'btn btn-primary', type: 'button' }, 'Step back and look');
    check.addEventListener('click', () => {
      if (rack.some((x) => !x)) {
        verdict.className = 'verdict is-no';
        verdict.textContent = 'Four hooks, four ancestors. Somebody is still on the floor.';
        return;
      }
      if (rack.join() === SOLUTION.join()) {
        api.solve();
      } else {
        verdict.className = 'verdict is-no';
        verdict.textContent = 'The wall shudders and spits them back onto the floor. Somebody is out of order.';
        rack = [null, null, null, null];
        api.save({ rack });
        draw();
        root.classList.add('shake');
        setTimeout(() => root.classList.remove('shake'), 450);
        api.wrong();
      }
    });

    draw();
    root.append(plate, poolWrap, rackWrap, el('div', { class: 'stack' }, check), verdict);
    return root;
  },
};
