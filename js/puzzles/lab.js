/**
 * Room 2 — Pugsley's Laboratory.
 *
 * Pour pigments until the flask matches the wax seal. Pigments mix
 * subtractively (weighted geometric mean per channel), so the result behaves
 * like paint rather than light. The trick is that two of the labels have been
 * swapped, and the recipe names contents, not labels.
 */

import { el } from '../ui.js';

const BOTTLES = [
  { key: 'a', label: 'Tears of Joy',        truth: 'blood',  rgb: [0.55, 0.13, 0.19], glass: '#8d2230' },
  { key: 'b', label: 'Extract of Sunshine', truth: 'sun',    rgb: [0.91, 0.79, 0.23], glass: '#e8c93a' },
  { key: 'c', label: "Widow's Blood",       truth: 'tears',  rgb: [0.18, 0.44, 0.82], glass: '#2f6fd0' },
];

const byTruth = (t) => BOTTLES.find((b) => b.truth === t);

/** Subtractive mix: each pigment attenuates the light by its own share. */
function mix(counts) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (!total) return null;
  return [0, 1, 2].map((ch) => {
    let acc = 0;
    for (const b of BOTTLES) {
      const n = counts[b.key] || 0;
      if (!n) continue;
      acc += (n / total) * Math.log(Math.max(b.rgb[ch], 0.02));
    }
    return Math.exp(acc);
  });
}

const css = (rgb) => `rgb(${rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255)).join(',')})`;

// One part Tears of Joy to two parts Extract of Sunshine — whatever the labels claim.
const TARGET = mix({ [byTruth('tears').key]: 1, [byTruth('sun').key]: 2 });

const bottleSvg = (color) => `
  <svg viewBox="0 0 60 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="24" y="4" width="12" height="16" fill="#6b5a3a"/>
    <path d="M22 20h16l10 22v56a8 8 0 0 1-8 8H20a8 8 0 0 1-8-8V42Z" fill="#101016" stroke="#7a6a52" stroke-width="2"/>
    <path d="M13 56h34v42a8 8 0 0 1-8 8H21a8 8 0 0 1-8-8Z" fill="${color}" opacity=".9"/>
    <path d="M17 62q13 6 26 0" stroke="#fff" stroke-opacity=".25" stroke-width="2" fill="none"/>
  </svg>`;

const flaskSvg = (color, fill) => `
  <svg viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M46 8h28v44l26 58a14 14 0 0 1-13 22H33a14 14 0 0 1-13-22l26-58Z" fill="#0f0a14" stroke="#7a6a52" stroke-width="2.5"/>
    ${fill > 0 ? `<path d="M${34 - fill * 6} ${118 - fill * 30}h${52 + fill * 12}l4 8a14 14 0 0 1-13 6H33a14 14 0 0 1-13-6Z" fill="${color}"/>` : ''}
    <path d="M42 8h36" stroke="#c8a24a" stroke-width="4" stroke-linecap="round"/>
  </svg>`;

export default {
  id: 'lab',
  title: "Pugsley's Laboratory",
  hotspotLabel: 'Work the bench',
  brief: 'A recipe, three bottles and an empty flask. The recipe is honest. The bottles are not.',
  hints: [
    'Read the recipe again. It asks for substances — the labels only claim to describe them.',
    "Pugsley's diary is on the bench, behind the burner. Something has been swapped, and it is not the sunshine.",
    'Pour one part from the bottle marked “Widow’s Blood” and two parts from “Extract of Sunshine”.',
  ],

  render(api) {
    const saved = api.load();
    let counts = saved.counts || { a: 0, b: 0, c: 0 };

    const root = el('div', { class: 'puzzle-grid' });

    const recipe = el('div', { class: 'vellum', html: `
      <h4>To synthesise Chaos</h4>
      <p>Normalcy is a disease. We must brew the cure.</p>
      <p>Take <em>one part Tears of Joy</em>. Add <em>two parts Extract of Sunshine</em>.
      Stopper it the moment it turns the colour of greed.</p>
      <p class="muted-note">Diary, same bench, under the burner: “Wednesday has been at my labels
      again. Whatever claims to weep is in fact bleeding, and whatever claims to bleed is only crying.
      The sunshine she left alone. She says it was already a lie.”</p>` });

    const bench = el('div', { class: 'bench' });
    for (const b of BOTTLES) {
      const node = el('button', { class: 'bottle', type: 'button' });
      node.innerHTML = `${bottleSvg(b.glass)}<span class="bottle-label">${b.label}</span>`;
      node.addEventListener('click', () => {
        counts = { ...counts, [b.key]: (counts[b.key] || 0) + 1 };
        api.save({ counts });
        api.sfx.place();
        draw();
      });
      bench.append(node);
    }

    const flaskCol = el('div', { class: 'flask-col' });
    const targetCol = el('div', { class: 'flask-col' }, el('div', {
      class: 'swatch', style: `background:${css(TARGET)}`,
    }), el('p', { class: 'pour-log' }, 'The wax seal'));
    const log = el('p', { class: 'pour-log' });
    const verdict = el('p', { class: 'verdict' }, '\u00a0');

    function draw() {
      const total = counts.a + counts.b + counts.c;
      const current = mix(counts);
      flaskCol.innerHTML = flaskSvg(current ? css(current) : 'transparent', Math.min(3, total));
      flaskCol.append(log);
      log.textContent = total
        ? BOTTLES.filter((b) => counts[b.key]).map((b) => `${counts[b.key]}× ${b.label}`).join('  ·  ')
        : 'Empty';
    }

    const drain = el('button', { class: 'btn', type: 'button' }, 'Tip it down the sink');
    drain.addEventListener('click', () => {
      counts = { a: 0, b: 0, c: 0 };
      api.save({ counts });
      api.sfx.click();
      verdict.textContent = '\u00a0';
      verdict.className = 'verdict';
      draw();
    });

    const stopper = el('button', { class: 'btn btn-primary', type: 'button' }, 'Stopper the flask');
    stopper.addEventListener('click', () => {
      const current = mix(counts);
      if (!current) {
        verdict.className = 'verdict is-no';
        verdict.textContent = 'There is nothing in it but disappointment.';
        return;
      }
      const off = current.reduce((m, v, i) => Math.max(m, Math.abs(v - TARGET[i])), 0);
      if (off < 0.02) {
        api.solve();
      } else {
        verdict.className = 'verdict is-no';
        verdict.textContent = off < 0.13
          ? 'Close. The colour is wrong in the way a polite lie is wrong.'
          : 'It curdles, hisses, and refuses to be that colour.';
        api.wrong();
      }
    });

    draw();
    root.append(
      recipe,
      el('div', {}, el('p', { class: 'muted-note' }, 'Click a bottle to pour one part.'), bench),
      el('div', { class: 'flask-row' }, flaskCol, targetCol),
      el('div', { class: 'stack' }, stopper, drain),
      verdict,
    );
    return root;
  },
};
