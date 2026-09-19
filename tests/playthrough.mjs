import { JSDOM } from 'jsdom';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const dom = new JSDOM(html, { url: 'https://example.org/', pretendToBeVisual: true });

for (const k of ['window', 'document', 'localStorage', 'HTMLElement', 'Node',
  'requestAnimationFrame', 'cancelAnimationFrame', 'getComputedStyle', 'Event', 'KeyboardEvent']) {
  try { globalThis[k] = dom.window[k]; } catch { /* read-only global */ }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const $ = (s) => dom.window.document.querySelector(s);
const $$ = (s) => Array.from(dom.window.document.querySelectorAll(s));
const body = () => $('#overlay-body');
const txt = (n) => (n.textContent || '').trim();

let failures = 0;
function check(label, ok, extra = '') {
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${label}${extra ? ' — ' + extra : ''}`);
  if (!ok) failures++;
}
const click = (n) => { if (!n) throw new Error('missing node to click'); n.click(); };
const findByText = (sel, needle) => $$(sel).find((n) => txt(n).includes(needle));

await import('../js/main.js');
const { buildBoard } = await import('../js/puzzles/generator.js');

console.log('\n— booting —');
check('title screen is active', $('#screen-title').classList.contains('is-active'));

click($('#btn-begin'));
await sleep(30);
check('story screen shows the first beat', txt($('.story-line')).startsWith('Cousin Itt'));
click($('#btn-story-next')); await sleep(10);
click($('#btn-story-next')); await sleep(10);
click($('#btn-story-next')); await sleep(30);
check('game screen is active', $('#screen-game').classList.contains('is-active'));
check('clock is running', txt($('#clock-state')) === 'Running');
check('six room seals rendered', $$('.room-seal').length === 6);
check('only room 1 is unlocked', $$('.room-seal:not([disabled])').length === 1);

async function openPuzzleHere() {
  const spot = $$('.hotspot').find((h) => !txt(h).includes('Already'));
  click(spot);
  await sleep(20);
  return body();
}
async function rewardText() { await sleep(600); return txt(body()); }
async function dismissReward() {
  await sleep(600);
  const go = findByText('#overlay-body button', 'Go to');
  if (go) { click(go); await sleep(30); }
  else { click($('.overlay-close')); await sleep(30); }
}

/* ---------------- room 1: portraits ---------------- */
console.log('\n— the portrait gallery —');
await openPuzzleHere();
check('four portraits in the pool', $$('#overlay-body .portrait-pool .portrait').length === 4);
for (const name of ['Thaddeus', 'Ophelia', 'Cornelius', 'Drusilla']) {
  const p = $$('#overlay-body .portrait-pool .portrait').find((n) => n.getAttribute('aria-label').startsWith(name));
  click(p); await sleep(5);
  const slot = $$('#overlay-body .rack-slot').find((s) => txt(s).startsWith('hook'));
  click(slot); await sleep(5);
}
click(findByText('#overlay-body button', 'Step back'));
await sleep(30);
check('gallery solved', $$('.inv-slot.is-held').length === 1);
check('curse line 1 banked in the reward', (await rewardText()).includes('From dust we came'));
await dismissReward();
check('moved to the laboratory', txt($('#hud-room')) === "Pugsley's Laboratory");

/* ---------------- room 2: the elixir ---------------- */
console.log('\n— the laboratory —');
await openPuzzleHere();
const bottle = (label) => $$('#overlay-body .bottle').find((b) => txt(b).includes(label));
click(bottle("Widow's Blood")); await sleep(5);
click(bottle('Extract of Sunshine')); await sleep(5);
click(bottle('Extract of Sunshine')); await sleep(5);
check('flask log reads back the pours', txt($('#overlay-body .pour-log')).includes('2×'));
click(findByText('#overlay-body button', 'Stopper'));
await sleep(30);
check('elixir taken', $$('.inv-slot.is-held').length === 2);
await dismissReward();

/* ---------------- room 3: the cipher ---------------- */
console.log('\n— the library —');
await openPuzzleHere();
check('ciphertext is on the desk', txt($('#overlay-body .cipher-out')).startsWith('FRXQW'));
for (let i = 0; i < 3; i++) { click(findByText('#overlay-body button', 'turn on')); await sleep(5); }
const decoded = $$('#overlay-body .cipher-out')[1];
check('wheel at 3 decodes the note', txt(decoded).startsWith('COUNT THE SPINES'), txt(decoded).slice(0, 34));
const wrongSpine = $$('#overlay-body .spine')[0];
click(wrongSpine); await sleep(10);
check('wrong book is rejected', txt($('#overlay-body .verdict')).includes('hollow'));
click($$('#overlay-body .spine').find((s) => txt(s).includes('Hemlock')));
await sleep(30);
check('nightshade taken', $$('.inv-slot.is-held').length === 3);
await dismissReward();

/* ---------------- room 4: the table ---------------- */
console.log('\n— the dining room —');
await openPuzzleHere();
const plate = (name) => $$('#overlay-body .plate').find((p) => txt(p).includes(name));
async function serve(name, n) {
  for (let i = 0; i < n; i++) {
    click($('#overlay-body .cloth-pool .spider')); await sleep(2);
    click(plate(name)); await sleep(2);
  }
}
await serve('Gomez', 8); await serve('Morticia', 4); await serve('Wednesday', 2);
check('the cloth is bare', txt($('#overlay-body .cloth-pool')).includes('bare'));
check('portions read 8 / 4 / 2', $$('#overlay-body .plate-count').map(txt).join(' ') === '(8) (4) (2)');
click(findByText('#overlay-body button', 'dinner bell'));
await sleep(30);
check('widow taken', $$('.inv-slot.is-held').length === 4);
check('reward reveals the combination', (await rewardText()).includes('8 · 4 · 2'));
await dismissReward();

/* ---------------- room 5: the cellar ---------------- */
console.log('\n— the cellar —');
await openPuzzleHere();
const ups = $$('#overlay-body .dial-btn').filter((b) => txt(b) === '▲');
for (let i = 0; i < 8; i++) { click(ups[0]); await sleep(1); }
for (let i = 0; i < 4; i++) { click(ups[1]); await sleep(1); }
for (let i = 0; i < 2; i++) { click(ups[2]); await sleep(1); }
check('dials read 842', $$('#overlay-body .dial-num').map(txt).join('') === '842');
click(findByText('#overlay-body button', 'shackle'));
await sleep(30);
check('lockbox opened into the conduit', $$('#overlay-body .cell').length === 25);
const { turns } = buildBoard();
const cells = $$('#overlay-body .cell');
for (let i = 0; i < 25; i++) {
  const need = (4 - turns[i]) % 4;
  for (let k = 0; k < need; k++) { click($$('#overlay-body .cell')[i]); await sleep(1); }
}
await sleep(400);
check('rose taken once the lamp lights', $$('.inv-slot.is-held').length === 5);
await dismissReward();

/* ---------------- room 6: the ritual ---------------- */
console.log('\n— the séance parlour —');
check('the parlour unlocked', $$('.room-seal:not([disabled])').length === 6);
check('standing in the parlour', txt($('#hud-room')) === 'The Séance Parlour');
await openPuzzleHere();
const offers = $$('#overlay-body .offer');
const points = $$('#overlay-body .point');
const STROKE = [0, 2, 4, 1, 3];
for (let step = 0; step < 5; step++) {
  click($$('#overlay-body .offer')[step]); await sleep(3);
  click($$('#overlay-body .point')[STROKE[step]]); await sleep(3);
}
check('all five points filled', $$('#overlay-body .point.filled').length === 5);
click(findByText('#overlay-body button', 'Light the circle'));
await sleep(40);
check('moved to the recitation', $$('#overlay-body .curse-line').length === 5);
const lineOrder = ['From dust', 'with chaos', 'poisoned roots', 'weaving webs', 'break the seal'];
for (const frag of lineOrder) {
  click($$('#overlay-body .curse-line').find((n) => txt(n).includes(frag)));
  await sleep(3);
}
click(findByText('#overlay-body button', 'Speak the curse'));
await sleep(60);
check('ending screen shown', $('#screen-end').classList.contains('is-active'));
check('escaped ending', txt($('#end-title')).includes('Cousin Itt is back'));
const stats = $$('#end-stats dd').map(txt);
check('stats populated', stats.length === 4 && /^\d\d:\d\d$/.test(stats[0]), stats.join(' | '));

console.log(`\n${failures ? `${failures} FAILURE(S)` : 'full playthrough passed'}\n`);
process.exit(failures ? 1 : 0);
