# The Addams Mansion — A Cryptic Quest

A point-and-click escape room in the browser. Six rooms, five ritual offerings, a
forty-five minute clock, and a house that charges three minutes for every hint.

This started life as a countdown timer I built to run a real Addams Family escape
room event. The event's puzzle design is still the backbone — the portraits, the
mislabelled chemistry set, the spiders on the dinner plates, the pentagram finale —
but each puzzle has been rebuilt as something you actually play rather than something
a game master narrates. The original timer is still in here, under **Open
game-master timer** on the title screen.

**No frameworks. No build step required. No asset files at all** — every room, icon,
and sound is generated at runtime.

---

## Playing it

```bash
git clone <this repo> && cd escape-room-website
npm start                 # serves on http://localhost:8080
```

Any static server works. ES modules need to be served over HTTP, so opening
`index.html` straight off the filesystem won't work — use `dist/index.html` for
that (see *Building* below), or just push to GitHub Pages.

---

## The rooms

| # | Room | Mechanic | Reward |
|---|------|----------|--------|
| 1 | The Portrait Gallery | Ordering puzzle — sort four ancestors by date of death. Roman numerals, one plaque hung backwards, one date that has to be derived from a sibling's birth year | Grave dust |
| 2 | Pugsley's Laboratory | Colour mixing against a target swatch, with a subtractive pigment model. Two of the three labels have been swapped, so following the recipe literally gives you orange instead of green | Elixir of Chaos |
| 3 | Wednesday's Library | A working Caesar cipher wheel. Decoding the note only gets you a second instruction: count the black bindings, then count that far from the left. One title is planted to be miscounted | Deadly nightshade |
| 4 | The Dining Room | A constraint puzzle. Fourteen spiders, three plates, four rules with exactly one solution. The portions read out as a three-digit combination | The widow |
| 5 | The Cellar | Two stages: a combination lock, then a 5×5 conduit-rotation puzzle. Live wires light up as you connect them | The black rose |
| 6 | The Séance Parlour | Place the five offerings in the order the pentagram is *drawn* — one unbroken stroke, not the order you collected them — then reassemble the curse from its rhyme scheme | Escape |

Rooms unlock in sequence. Each one hands you an offering and a line of the
Ancestral Curse, both of which the finale needs.

---

## How it's put together

```
index.html            markup shell — screens, HUD, overlay
css/styles.css        design tokens and all layout
js/
  main.js             boot, screen flow, game-master timer
  game.js             clock, room navigation, hints, rewards, endings
  state.js            single state object, pub/sub, localStorage persistence
  rooms.js            room definitions: scene, hotspots, rewards, story beats
  scenes.js           inline SVG art for all six rooms
  items.js            the five offerings and their icons
  audio.js            Web Audio synthesis — drone, motif, effects
  ui.js               DOM helpers, focus-trapped overlay, toasts
  puzzles/*.js        one module per puzzle, uniform interface
tests/                headless playthroughs driven through jsdom
build.js              bundles everything into dist/index.html
```

**State.** One object, mutated only through `update()`, which persists and notifies
subscribers in the same step so the UI can't drift out of sync with the model.
Puzzle modules stash their own progress via `puzzleState(roomId, patch)` without
knowing that storage exists, which is why a refresh mid-puzzle puts every dial,
pour, and portrait back where you left it.

**Puzzles** all implement the same shape:

```js
export default {
  id, title, brief,
  hints: [gentle, firmer, the answer],
  render(api) { /* returns a DOM node */ },
}
```

`api` gives a puzzle exactly five things — `solve`, `wrong`, `say`, `sfx`, and a
`load`/`save` pair. It knows nothing about the clock, the inventory, or what room
comes next. Adding a seventh room means writing one module and one entry in
`rooms.js`.

**No assets.** Rooms are inline SVG built from shared primitives (backdrop,
candle, cobweb, picture frame) so the mansion reads as one continuous house.
Sound is synthesised with the Web Audio API — a detuned three-oscillator drone
with a slow LFO breath, a D-minor motif that wanders in at random intervals, and
short envelope-shaped effects. Nothing is loaded over the network except two
Google fonts.

**The conduit puzzle** generates a randomised spanning tree from a fixed seed, so
the board is identical for every player and guaranteed solvable, then scrambles
the rotations and verifies the scramble isn't accidentally already correct.
Connectivity is a BFS from the mains on every click, which is also what drives the
live-wire highlighting.

**Accessibility.** Everything is a real `<button>` — no drag-and-drop anywhere, so
the whole game is playable by keyboard and works properly on touch. The overlay
traps focus and closes on Escape, hotspots have visible focus rings, and
`prefers-reduced-motion` is respected.

---

## Tests

```bash
npm test
```

Three jsdom suites:

- **playthrough** — solves all six rooms by clicking through the real UI, then
  asserts the ending, the stats and the rank.
- **edges** — hint tiers and their time cost, wrong answers, save/resume across a
  reload, the timeout ending, and the game-master timer.
- **dist-playthrough** — the same full run against the bundled single file.

The bundle test earns its keep: it caught a build bug where `String.replace`
interpreted `$$` in the bundle as a substitution pattern and quietly collapsed a
DOM helper.

---

## Building

```bash
npm install
npm run build     # → dist/index.html, ~118 kB, everything inlined
```

One file, openable by double-click, droppable into any host. The multi-file
version under `js/` is the one to read and edit.

---

## Credits

Puzzle design adapted from an Addams Family escape room I ran as a live event.
Built with no dependencies; esbuild and jsdom are dev-only.
