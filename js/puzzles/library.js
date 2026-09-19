/**
 * Room 3 — Wednesday's Library.
 *
 * A Caesar-shifted note, a working brass cipher wheel, and a shelf of
 * eighteen books. Decoding the note is only half of it: the instruction it
 * gives is itself a counting puzzle, with one title planted to be miscounted.
 */

import { el } from '../ui.js';

const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const shiftText = (text, n) => text.replace(/[A-Z]/g, (c) => A[(A.indexOf(c) + n + 26) % 26]);

const PLAIN = 'COUNT THE SPINES BOUND IN BLACK THEN TAKE THAT BOOK FROM THE LEFT';
const KEY = 3;
const CIPHER = shiftText(PLAIN, KEY);

const BLACK = '#15101a';
const BOOKS = [
  ['Poisons of the Kitchen Garden', '#4a1d26'],
  ['A History of Regrettable Weather', '#3f2c1c'],
  ['Knots for the Impatient', BLACK],
  ['On the Breeding of Vultures', '#243a2a'],
  ['The Compleat Embalmer', BLACK],
  ['Manners for the Recently Dead', '#6b5a3a'],
  ['Hemlock: A Memoir', '#1f3352'],
  ['Bells, Books & Candles', BLACK],
  ['Grave Soil & Its Uses', BLACK],
  ['The Lament of Aunt Prudence', '#342244'],
  ['Anatomy for Enthusiasts', BLACK],
  ['Rope, Volume II', '#3f2c1c'],
  ['Seventeen Ways to Weep', BLACK],
  ["The Gardener's Black Book", '#243a2a'],
  ['Nightshade & Nightcaps', '#4a1d26'],
  ['A Treatise on Screaming', BLACK],
  ['Taxidermy for Children', '#6b5a3a'],
  ['The Second Funeral', '#1f3352'],
];

const ANSWER_INDEX = 6; // seven black bindings → the seventh book from the left

function wheelSvg(shift) {
  const ring = (radius, rotate, fill, size) => `
    <g class="wheel-ring" transform="rotate(${rotate} 120 120)">
      ${A.split('').map((c, i) => {
        const ang = (i * 360) / 26;
        return `<g transform="rotate(${ang} 120 120)">
          <text x="120" y="${120 - radius}" text-anchor="middle" fill="${fill}"
                font-family="Cinzel, serif" font-size="${size}"
                transform="rotate(${-ang + ang} 120 ${120 - radius})">${c}</text></g>`;
      }).join('')}
    </g>`;
  return `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="120" cy="120" r="116" fill="#140d19" stroke="#6b5a3a" stroke-width="2"/>
    <circle cx="120" cy="120" r="92" fill="#1d1022" stroke="#4a3a20" stroke-width="1.5"/>
    <circle cx="120" cy="120" r="64" fill="#0f0913" stroke="#6b5a3a" stroke-width="2"/>
    <circle cx="120" cy="120" r="6" fill="#c8a24a"/>
    ${ring(104, 0, '#a2988a', 13)}
    ${ring(78, -shift * (360 / 26), '#c8a24a', 13)}
    <path d="M120 4v18" stroke="#8d2230" stroke-width="3"/>
  </svg>`;
}

export default {
  id: 'library',
  title: "Wednesday's Library",
  hotspotLabel: 'Read the note',
  brief: 'A slip of paper on the reading desk, written in a hand that does not want to be read, and a brass wheel that was clearly built for exactly this.',
  hints: [
    'The wheel is a Caesar wheel: line the inner ring up against the outer one and every letter moves by the same amount. The bookmark tells you how far.',
    'Decoded, the note asks you to count something on the shelf and then count again from the left. Judge the bindings by their colour, not by what the titles claim.',
    'Seven books are bound in black. Take the seventh book from the left: “Hemlock: A Memoir”.',
  ],

  render(api) {
    const saved = api.load();
    let shift = saved.shift ?? 0;

    const root = el('div', { class: 'puzzle-grid' });

    const note = el('div', { class: 'vellum', html: `
      <h4>Slipped inside the blotter</h4>
      <p class="cipher-out" style="color:#5c3b1f">${CIPHER}</p>
      <p class="muted-note" style="color:#5c3b1f">And a bookmark, in a child's hand:
      “Wednesday buries everything three deep.”</p>` });

    const wheelWrap = el('div', { class: 'wheel-wrap' });
    const wheel = el('div', { class: 'wheel' });
    const readout = el('p', { class: 'cipher-out' });
    const shiftLabel = el('p', { class: 'muted-note' });

    function turn(by) {
      shift = (shift + by + 26) % 26;
      api.save({ shift });
      api.sfx.click();
      draw();
    }

    function draw() {
      wheel.innerHTML = wheelSvg(shift);
      readout.textContent = shiftText(CIPHER, -shift);
      shiftLabel.textContent = `The wheel stands at ${shift}.`;
    }

    wheelWrap.append(
      wheel,
      el('div', { class: 'stack' },
        el('button', { class: 'btn btn-small', type: 'button', onClick: () => turn(-1) }, '← turn back'),
        el('button', { class: 'btn btn-small', type: 'button', onClick: () => turn(1) }, 'turn on →')),
      shiftLabel,
      readout,
    );

    const shelf = el('div', { class: 'shelf' });
    BOOKS.forEach(([title, colour], i) => {
      const spine = el('button', {
        class: 'spine', type: 'button', title,
        style: `background:${colour}; color:${colour === '#6b5a3a' ? '#241a10' : '#d9cbb0'}; height:${112 + ((i * 7) % 22)}px`,
      }, title);
      spine.addEventListener('click', () => {
        if (i === ANSWER_INDEX) {
          api.solve();
        } else {
          api.sfx.wrong();
          verdict.className = 'verdict is-no';
          verdict.textContent = `“${title}” is hollow, but only of ideas.`;
          api.wrong();
        }
      });
      shelf.append(spine);
    });

    const verdict = el('p', { class: 'verdict' }, '\u00a0');

    draw();
    root.append(
      el('div', { class: 'puzzle-grid puzzle-split' }, note, wheelWrap),
      el('div', {}, el('p', { class: 'muted-note' }, 'The shelf. Pull a book to look behind it.'), shelf),
      verdict,
    );
    return root;
  },
};
