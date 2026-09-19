import { JSDOM } from 'jsdom';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const dom = new JSDOM(html, { url: 'https://example.org/', pretendToBeVisual: true });
for (const k of ['window', 'document', 'localStorage', 'HTMLElement', 'Node',
  'requestAnimationFrame', 'cancelAnimationFrame', 'getComputedStyle', 'Event', 'KeyboardEvent']) {
  try { globalThis[k] = dom.window[k]; } catch { /* read-only */ }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const $ = (s) => dom.window.document.querySelector(s);
const $$ = (s) => Array.from(dom.window.document.querySelectorAll(s));
const txt = (n) => (n?.textContent || '').trim();
const findByText = (sel, needle) => $$(sel).find((n) => txt(n).includes(needle));

let failures = 0;
const check = (l, ok, extra = '') => { console.log(`${ok ? '  ok  ' : ' FAIL '} ${l}${extra ? ' — ' + extra : ''}`); if (!ok) failures++; };

await import('../js/main.js');
const S = await import('../js/state.js');

$('#btn-begin').click(); await sleep(20);
for (let i = 0; i < 3; i++) { $('#btn-story-next').click(); await sleep(10); }

console.log('\n— hints —');
const before = S.get().secondsLeft;
$('#btn-hint').click(); await sleep(20);
check('hint charges three minutes', before - S.get().secondsLeft === 180, `${before} → ${S.get().secondsLeft}`);
check('first hint is the gentlest tier', txt($('#overlay-body')).includes('Roman numerals'));
check('one skull spent', $$('.skull.is-spent').length === 1);
$('.overlay-close').click(); await sleep(10);
$('#btn-hint').click(); await sleep(20);
check('second hint escalates', txt($('#overlay-body')).includes('mirrored'));
$('.overlay-close').click(); await sleep(10);
$('#btn-hint').click(); await sleep(20);
check('third hint gives the answer', txt($('#overlay-body')).includes('Thaddeus (1789)'));
$('.overlay-close').click(); await sleep(10);
check('hint button now disabled', $('#btn-hint').disabled === true);
check('hints logged to the journal', S.get().journal.length === 3);

console.log('\n— wrong answers —');
$$('.hotspot')[0].click(); await sleep(20);
// hang them backwards on purpose
for (const name of ['Drusilla', 'Cornelius', 'Ophelia', 'Thaddeus']) {
  $$('#overlay-body .portrait-pool .portrait').find((n) => n.getAttribute('aria-label').startsWith(name)).click();
  await sleep(3);
  $$('#overlay-body .rack-slot').find((s) => txt(s).startsWith('hook')).click(); await sleep(3);
}
findByText('#overlay-body button', 'Step back').click(); await sleep(20);
check('wrong order is rejected', txt($('#overlay-body .verdict')).includes('out of order'));
check('the rack is emptied on failure', $$('#overlay-body .rack-slot').filter((s) => txt(s).startsWith('hook')).length === 4);
check('still unsolved', S.get().solved.length === 0);

// now solve it properly
for (const name of ['Thaddeus', 'Ophelia', 'Cornelius', 'Drusilla']) {
  $$('#overlay-body .portrait-pool .portrait').find((n) => n.getAttribute('aria-label').startsWith(name)).click();
  await sleep(3);
  $$('#overlay-body .rack-slot').find((s) => txt(s).startsWith('hook')).click(); await sleep(3);
}
findByText('#overlay-body button', 'Step back').click(); await sleep(700);
$('.overlay-close').click(); await sleep(20);

console.log('\n— persistence —');
check('a run is saved', S.hasSave() === true);
const snapshot = S.get();
S.update({ secondsLeft: 1234 });
await sleep(320); // let the debounced write land
S.load();
check('reload restores solved rooms', S.get().solved.includes('gallery'));
check('reload restores the inventory', S.get().items.includes('dust'));
check('reload restores the clock', S.get().secondsLeft === 1234);
check('reload holds the clock rather than resuming it', S.get().running === false);
check('lab puzzle state survives independently', typeof S.puzzleState('lab') === 'object');

console.log('\n— running out of time —');
S.update({ secondsLeft: 2 });
const Game = await import('../js/game.js');
Game.startClock();
await sleep(2400);
check('the trapped ending fires', $('#screen-end').classList.contains('is-active'));
check('ending copy matches the loss', txt($('#end-title')).includes('candles go out'));
check('save is cleared after an ending', S.hasSave() === false);
check('rank for a loss', txt($$('#end-stats dd')[3]) === 'Houseguest');

console.log('\n— the game-master timer —');
$('#btn-again').click(); await sleep(20);
$('#btn-gm').click(); await sleep(20);
check('gm screen opens at 40:00', txt($('#gm-clock')) === '40:00');
$('#gm-hint').click(); await sleep(10);
check('gm hint charges three minutes', txt($('#gm-clock')) === '37:00');
$('#gm-escaped').click(); await sleep(10);
check('gm marks an escape', txt($('#gm-status')) === 'Escaped');
$('#gm-reset').click(); await sleep(10);
check('gm resets cleanly', txt($('#gm-clock')) === '40:00' && txt($('#gm-status')) === 'Ready');

console.log(`\n${failures ? `${failures} FAILURE(S)` : 'edge cases passed'}\n`);
process.exit(failures ? 1 : 0);
