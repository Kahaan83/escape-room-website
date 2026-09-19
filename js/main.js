/** Boot, screen flow, and the game-master timer the original event used. */

import * as S from './state.js';
import * as A from './audio.js';
import { $, el, showScreen, initOverlay, closeOverlay, toast, mmss } from './ui.js';
import { STORY } from './rooms.js';
import * as Game from './game.js';

initOverlay();
S.subscribe(() => { if ($('#screen-game').classList.contains('is-active')) Game.paint(); });

/* --- title ---------------------------------------------------------------- */

if (S.hasSave()) $('#btn-resume').hidden = false;

$('#btn-begin').addEventListener('click', () => {
  A.unlock();
  S.reset();
  runStory(0);
});

$('#btn-resume').addEventListener('click', () => {
  A.unlock();
  if (S.load()) enterGame();
});

$('#btn-gm').addEventListener('click', () => { A.unlock(); showScreen('screen-gm'); });
$('#gm-back').addEventListener('click', () => showScreen('screen-title'));

/* --- story ---------------------------------------------------------------- */

function runStory(i) {
  const line = $('.story-line');
  line.textContent = STORY[i];
  $('#btn-story-next').textContent = i === STORY.length - 1 ? 'Step inside' : 'Continue';
  showScreen('screen-story');
  $('#btn-story-next').onclick = () => {
    A.sfx.click();
    if (i < STORY.length - 1) runStory(i + 1);
    else enterGame();
  };
}

/* --- the game ------------------------------------------------------------- */

function enterGame() {
  showScreen('screen-game');
  A.startAmbience();
  Game.paint();
  Game.startClock();
  toast('Click anything that glows.', 4200);
}

$('#btn-hint').addEventListener('click', () => Game.takeHint());
$('#btn-journal').addEventListener('click', () => Game.openJournal());
$('#btn-menu').addEventListener('click', () => Game.openMenu(quit));

$('#btn-sound').addEventListener('click', () => {
  const next = !A.isMuted();
  A.setMuted(next);
  S.update({ muted: next }, { silent: true });
  $('#btn-sound').setAttribute('aria-pressed', String(!next));
  document.body.classList.toggle('is-muted', next);
});

$('#btn-again').addEventListener('click', () => {
  S.reset();
  showScreen('screen-title');
  $('#btn-resume').hidden = true;
});

function quit() {
  Game.stopClock();
  A.stopAmbience();
  S.clearSave();
  S.reset();
  $('#btn-resume').hidden = true;
  showScreen('screen-title');
}

// The clock should not keep running while the tab is in another dimension.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && S.get().running && !S.get().finished) {
    S.update({ running: false }, { silent: true });
    toast('Clock held while you were away.');
  }
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && $('#screen-game').classList.contains('is-active') && !S.get().finished) {
    S.update({ running: true }, { silent: true });
  }
});

/* --- game-master timer ---------------------------------------------------- */

const GM_START = 40 * 60;
const gm = { left: GM_START, running: false, hints: 0, timer: null, ended: null };

function gmPaint() {
  const clock = $('#gm-clock');
  clock.textContent = mmss(gm.left);
  clock.classList.toggle('is-urgent', gm.left <= 300 && !gm.ended);
  $('#gm-toggle').textContent = gm.running ? 'Pause' : 'Start';
  $('#gm-status').textContent = gm.ended === 'escaped' ? 'Escaped'
    : gm.ended === 'out' ? 'Time is up'
    : gm.running ? 'Running' : 'Ready';
  $('#gm-skulls').replaceChildren(...Array.from({ length: S.MAX_HINTS }, (_, i) =>
    el('span', { class: `skull${i < gm.hints ? ' is-spent' : ''}` })));
  $('#gm-hint').disabled = gm.hints >= S.MAX_HINTS || !!gm.ended;
}

function gmStop() { clearInterval(gm.timer); gm.timer = null; gm.running = false; }

$('#gm-toggle').addEventListener('click', () => {
  if (gm.ended) return;
  A.unlock();
  if (gm.running) { gmStop(); } else {
    gm.running = true;
    gm.timer = setInterval(() => {
      gm.left -= 1;
      if (gm.left <= 0) { gm.left = 0; gmStop(); gm.ended = 'out'; A.sfx.thunder(); }
      gmPaint();
    }, 1000);
  }
  gmPaint();
});

$('#gm-escaped').addEventListener('click', () => { gmStop(); gm.ended = 'escaped'; A.sfx.victory(); gmPaint(); });
$('#gm-reset').addEventListener('click', () => { gmStop(); Object.assign(gm, { left: GM_START, hints: 0, ended: null }); gmPaint(); });
$('#gm-hint').addEventListener('click', () => {
  if (gm.hints >= S.MAX_HINTS || gm.ended) return;
  gm.hints += 1;
  gm.left = Math.max(0, gm.left - S.HINT_PENALTY);
  A.sfx.hint();
  gmPaint();
});

/* --- go ------------------------------------------------------------------- */

gmPaint();
showScreen('screen-title');
