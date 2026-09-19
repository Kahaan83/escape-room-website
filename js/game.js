/** The run itself: clock, room navigation, hints, rewards and the two endings. */

import * as S from './state.js';
import * as A from './audio.js';
import { $, el, showScreen, openOverlay, closeOverlay, toast, mmss } from './ui.js';
import { ROOMS, roomById, roomIndex } from './rooms.js';
import { ITEMS, ITEM_ORDER } from './items.js';

let ticker = null;
let warned = false;

/* --- unlocking ------------------------------------------------------------ */

export function isUnlocked(room) {
  const st = S.get();
  if (room.needsAll) return ITEM_ORDER.every((i) => st.items.includes(i));
  const i = roomIndex(room.id);
  return i === 0 || st.solved.includes(ROOMS[i - 1].id);
}

/* --- clock ---------------------------------------------------------------- */

export function startClock() {
  S.update({ running: true });
  if (ticker) return;
  ticker = setInterval(() => {
    const st = S.get();
    if (!st.running) return;
    const left = st.secondsLeft - 1;
    if (left <= 0) {
      S.update({ secondsLeft: 0, running: false });
      finish('trapped');
      return;
    }
    if (left === 300 && !warned) { warned = true; toast('Five minutes. The house has started counting out loud.'); A.sfx.doom(); }
    S.update({ secondsLeft: left }, { silent: true });
    paintClock();
  }, 1000);
}

export function stopClock() {
  clearInterval(ticker);
  ticker = null;
  S.update({ running: false }, { silent: true });
}

function paintClock() {
  const st = S.get();
  const clock = $('#clock');
  clock.textContent = mmss(st.secondsLeft);
  clock.classList.toggle('is-urgent', st.secondsLeft <= 300);
  $('#clock-state').textContent = st.running ? 'Running' : 'Held';
}

/* --- painting ------------------------------------------------------------- */

export function paint() {
  const st = S.get();
  const room = roomById(st.currentRoom) || ROOMS[0];

  paintClock();
  $('#hud-room').textContent = room.name;

  // hints
  const skulls = $('#skulls');
  skulls.replaceChildren(...Array.from({ length: S.MAX_HINTS }, (_, i) =>
    el('span', { class: `skull${i < st.hintsUsed ? ' is-spent' : ''}` })));
  $('#btn-hint').disabled = S.hintsLeft() <= 0 || !!st.finished;

  // room seals
  const nav = $('#roomnav');
  nav.replaceChildren(...ROOMS.map((r, i) => {
    const unlocked = isUnlocked(r);
    const solved = st.solved.includes(r.id);
    const seal = el('button', {
      class: `room-seal${solved ? ' is-solved' : ''}`,
      type: 'button',
      disabled: !unlocked,
      'aria-current': r.id === st.currentRoom ? 'true' : 'false',
      title: unlocked ? r.name : 'Locked',
    }, r.needsAll ? '★' : String(i + 1));
    seal.addEventListener('click', () => goTo(r.id));
    return seal;
  }));

  // inventory
  $('#inventory').replaceChildren(...ITEM_ORDER.map((id) => {
    const held = st.items.includes(id);
    return el('li', {
      class: `inv-slot${held ? ' is-held' : ''}`,
      title: held ? ITEMS[id].name : 'Not yet found',
      html: ITEMS[id].icon,
    });
  }));

  $('#journal-count').textContent = String(st.journal.length);

  paintScene(room);
}

function paintScene(room) {
  const st = S.get();
  $('#scene').innerHTML = room.scene();
  $('#scene-caption').textContent = room.caption;

  const layer = $('#hotspots');
  layer.replaceChildren(...room.hotspots.map((h) => {
    const done = h.action === 'puzzle' && st.solved.includes(room.id);
    const spot = el('button', {
      class: `hotspot${done ? ' is-done' : ''}`,
      type: 'button',
      style: `left:${h.x}%; top:${h.y}%; width:${h.w}%; height:${h.h}%`,
    }, el('span', { class: 'hotspot-label' }, done ? 'Already done' : h.label));
    spot.addEventListener('click', () => {
      A.sfx.click();
      if (h.action === 'puzzle') openPuzzle(room);
      else openOverlay(h.label, el('div', { class: 'vellum' }, el('p', {}, h.text)));
    });
    return spot;
  }));
}

/* --- navigation ----------------------------------------------------------- */

export function goTo(roomId) {
  const room = roomById(roomId);
  if (!room || !isUnlocked(room)) return;
  S.update({ currentRoom: roomId });
  A.sfx.open();
}

/* --- puzzles -------------------------------------------------------------- */

function openPuzzle(room) {
  const st = S.get();
  if (st.solved.includes(room.id)) {
    openOverlay(room.puzzle.title, el('div', { class: 'vellum' },
      el('p', {}, 'Done, and the house has not forgotten it. There is nothing left here for you.')));
    return;
  }

  const api = {
    sfx: A.sfx,
    say: (m) => toast(m),
    load: () => S.puzzleState(room.id),
    save: (patch) => S.puzzleState(room.id, patch),
    wrong: () => A.sfx.wrong(),
    solve: () => { closeOverlay(); solveRoom(room); },
  };

  const body = el('div', {},
    el('p', { class: 'puzzle-brief' }, room.puzzle.brief),
    room.puzzle.render(api));
  openOverlay(room.puzzle.title, body);
}

function solveRoom(room) {
  const st = S.get();
  if (st.solved.includes(room.id)) return;

  A.sfx.solved();
  const patch = { solved: [...st.solved, room.id] };
  if (room.item) patch.items = [...st.items, room.item];
  if (room.line) patch.lines = [...st.lines, room.line];
  if (room.reward) {
    patch.journal = [...st.journal, {
      id: room.id, title: room.reward.title, text: room.reward.clue,
    }];
  }
  S.update(patch);

  if (room.id === 'ritual') { finish('escaped'); return; }

  setTimeout(() => showReward(room), 420);
}

function showReward(room) {
  A.sfx.item();
  const slot = $('#inventory').children[ITEM_ORDER.indexOf(room.item)];
  if (slot) { slot.classList.add('just-got'); setTimeout(() => slot.classList.remove('just-got'), 950); }

  const next = ROOMS[roomIndex(room.id) + 1];
  const body = el('div', {},
    el('div', { class: 'vellum' },
      el('h4', {}, room.reward.title),
      el('p', {}, room.reward.text),
      el('p', {}, el('em', {}, `“${room.line}”`)),
      el('p', { class: 'muted-note' }, room.reward.clue)),
  );

  if (next) {
    const go = el('button', { class: 'btn btn-primary', type: 'button' }, `Go to ${next.name}`);
    go.addEventListener('click', () => { closeOverlay(); goTo(next.id); });
    body.append(el('div', { class: 'stack', style: 'justify-content:center; margin-top:1.2rem' }, go));
  }

  openOverlay(`${ITEMS[room.item].name} — taken`, body);
}

/* --- hints ---------------------------------------------------------------- */

export function takeHint() {
  const st = S.get();
  if (S.hintsLeft() <= 0 || st.finished) return;
  const room = roomById(st.currentRoom);
  if (st.solved.includes(room.id)) {
    toast('This room is finished. Take your hint somewhere it will do some good.');
    return;
  }

  const tier = Math.min(2, st.hintTier[room.id] || 0);
  const text = room.puzzle.hints[tier];

  S.update({
    hintsUsed: st.hintsUsed + 1,
    secondsLeft: Math.max(0, st.secondsLeft - S.HINT_PENALTY),
    hintTier: { ...st.hintTier, [room.id]: tier + 1 },
    journal: [...st.journal, { id: `${room.id}-hint-${tier}`, title: `${room.name} — the house whispers`, text }],
  });
  A.sfx.hint();
  openOverlay('The house whispers', el('div', { class: 'vellum' },
    el('p', {}, text),
    el('p', { class: 'muted-note' }, 'Three minutes, gone. It always charges.')));
}

/* --- journal -------------------------------------------------------------- */

export function openJournal() {
  const st = S.get();
  const list = el('div', { class: 'journal-list' });
  if (!st.journal.length) {
    list.append(el('p', { class: 'journal-empty' }, 'Nothing written down yet. Solve something.'));
  } else {
    for (const entry of st.journal) {
      list.append(el('div', { class: 'journal-entry' },
        el('h4', {}, entry.title), el('p', {}, entry.text)));
    }
  }
  if (st.lines.length) {
    list.append(el('div', { class: 'journal-entry' },
      el('h4', {}, 'The Ancestral Curse, so far'),
      ...st.lines.map((l) => el('p', {}, el('em', {}, l)))));
  }
  openOverlay('Journal', list);
}

/* --- endings -------------------------------------------------------------- */

export function finish(how) {
  stopClock();
  const st = S.get();
  S.update({ finished: how });
  S.clearSave();
  A.stopAmbience();

  const spent = S.START_SECONDS - st.secondsLeft;
  const escaped = how === 'escaped';
  escaped ? A.sfx.victory() : A.sfx.thunder();

  $('#end-title').textContent = escaped ? 'Cousin Itt is back, and so is the door' : 'The candles go out together';
  $('#end-blurb').textContent = escaped
    ? 'He steps through the circle, shakes himself like a wet dog, and says something nobody catches. The front door reappears in the hall, slightly offended. Morticia offers you tea. It would be rude to refuse, but you have a train.'
    : 'Time runs out mid-syllable. The pentagram closes like an eye, and the house adds five more places to the dinner table. You are welcome to try again — the Addamses are very forgiving about that sort of thing.';

  $('#end-stats').replaceChildren(
    el('div', {}, el('dt', {}, 'Time taken'), el('dd', {}, mmss(spent))),
    el('div', {}, el('dt', {}, 'Hints used'), el('dd', {}, `${st.hintsUsed} of ${S.MAX_HINTS}`)),
    el('div', {}, el('dt', {}, 'Rooms cleared'), el('dd', {}, `${st.solved.length} of ${ROOMS.length}`)),
    el('div', {}, el('dt', {}, 'Rank'), el('dd', {}, rank(escaped, spent, st.hintsUsed))),
  );
  showScreen('screen-end');
}

function rank(escaped, spent, hints) {
  if (!escaped) return 'Houseguest';
  if (spent <= 15 * 60 && hints === 0) return 'Family';
  if (spent <= 25 * 60 && hints <= 1) return 'Kin';
  if (hints <= 2) return 'Invited';
  return 'Tolerated';
}

/* --- menu ----------------------------------------------------------------- */

export function openMenu(onQuit) {
  const body = el('div', {},
    el('div', { class: 'vellum' },
      el('h4', {}, 'How the house works'),
      el('p', {}, 'Click anything that glows. Rooms open one at a time, and each one gives you an offering and a line of the curse. Your progress is saved as you go.'),
      el('p', {}, 'Asking the house for help costs three minutes and gives you a nudge for the room you are standing in — three nudges per room, each one plainer than the last.')),
    el('div', { class: 'stack', style: 'justify-content:center; margin-top:1.2rem' },
      el('button', { class: 'btn', type: 'button', onClick: () => { closeOverlay(); S.update({ running: !S.get().running }); paintClock(); toast(S.get().running ? 'The clock resumes.' : 'The clock is held.'); } },
        S.get().running ? 'Hold the clock' : 'Resume the clock'),
      el('button', { class: 'btn', type: 'button', onClick: () => { closeOverlay(); onQuit(); } }, 'Abandon this run')));
  openOverlay('Menu', body);
}
