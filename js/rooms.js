/** The mansion, room by room. Rooms unlock in order; the parlour needs all five offerings. */

import { SCENES } from './scenes.js';
import { CURSE } from './puzzles/ritual.js';
import portraits from './puzzles/portraits.js';
import lab from './puzzles/lab.js';
import library from './puzzles/library.js';
import dining from './puzzles/dining.js';
import generator from './puzzles/generator.js';
import ritual from './puzzles/ritual.js';

export const STORY = [
  'Cousin Itt went to answer the door at half past eight and has not been seen since. Neither has the door.',
  'Grandmama says he is caught between two dimensions, which is no excuse for the state of the hallway.',
  'Five offerings. Five lines of the Ancestral Curse. Bring them to the parlour floor and pull him back — before the house decides you would make better company.',
];

export const ROOMS = [
  {
    id: 'gallery',
    name: 'The Portrait Gallery',
    scene: SCENES.gallery,
    puzzle: portraits,
    item: 'dust',
    line: CURSE[0],
    caption: 'Four ancestors, propped against the wainscot, waiting to be put back where they belong.',
    hotspots: [
      { x: 10, y: 14, w: 80, h: 34, label: 'Straighten the portraits', action: 'puzzle' },
      { x: 38, y: 68, w: 24, h: 20, label: 'The console table', action: 'flavour',
        text: 'A brass plate, polished daily by nobody: “Hang us as we fell.” Beneath it, two candles that were lit before you arrived.' },
    ],
    reward: {
      title: 'A pouch, taped to the back of a frame',
      text: 'The wall swings out four inches. Inside: a black pouch of grave dust, and a tag in copperplate.',
      clue: 'Gomez is allergic to normalcy. He keeps his antidote where the beakers bubble and the fumes are thick.',
    },
  },
  {
    id: 'lab',
    name: "Pugsley's Laboratory",
    scene: SCENES.lab,
    puzzle: lab,
    item: 'elixir',
    line: CURSE[1],
    caption: 'Something on the burner has been simmering since the summer. It is still optimistic.',
    hotspots: [
      { x: 24, y: 55, w: 62, h: 22, label: 'Work the bench', action: 'puzzle' },
      { x: 6, y: 14, w: 40, h: 31, label: 'The shelves', action: 'flavour',
        text: 'Two dozen bottles, every one of them labelled in the same neat hand. Pugsley writes beautifully and lies constantly.' },
    ],
    reward: {
      title: 'Bottled, stoppered, sealed',
      text: 'The flask turns the exact green of a held grudge. You decant it and a tag floats up out of nowhere.',
      clue: 'Seek your next ingredient where knowledge rots on the vine.',
    },
  },
  {
    id: 'library',
    name: "Wednesday's Library",
    scene: SCENES.library,
    puzzle: library,
    item: 'leaf',
    line: CURSE[2],
    caption: 'Four hundred books. One of them is not a book.',
    hotspots: [
      { x: 68, y: 48, w: 26, h: 26, label: 'The reading desk', action: 'puzzle' },
      { x: 8, y: 11, w: 52, h: 60, label: 'The shelves', action: 'flavour',
        text: 'The bindings are colour-sorted by somebody with a system and no intention of explaining it.' },
    ],
    reward: {
      title: 'Hollowed out, quite recently',
      text: 'The cover lifts on a hinge of dried glue. A single black leaf lies inside, pressed flat, still faintly damp.',
      clue: 'The solitary leaf has been plucked. Now join the family for a feast — find the widows who wait for dinner.',
    },
  },
  {
    id: 'dining',
    name: 'The Dining Room',
    scene: SCENES.dining,
    puzzle: dining,
    item: 'spider',
    line: CURSE[3],
    caption: 'Three places set. Fourteen guests already seated, and none of them at the table.',
    hotspots: [
      { x: 12, y: 62, w: 76, h: 34, label: 'Set the table', action: 'puzzle' },
      { x: 42, y: 42, w: 16, h: 20, label: 'The candelabra', action: 'flavour',
        text: 'Lit. Dripping. Nobody in this house will admit to owning matches.' },
    ],
    reward: {
      title: 'She was under the tureen the whole time',
      text: 'The portions balance. A fat black widow walks out from under the lid, drops a tag at your feet, and waits to be carried.',
      clue: 'Take the largest widow and bring the numbers to the place where power hums: 8 · 4 · 2.',
    },
  },
  {
    id: 'generator',
    name: 'The Cellar',
    scene: SCENES.generator,
    puzzle: generator,
    item: 'rose',
    line: CURSE[4],
    caption: 'The house has been running on spite for three days and it is beginning to show.',
    hotspots: [
      { x: 15, y: 47, w: 18, h: 26, label: 'The lockbox', action: 'puzzle' },
      { x: 43, y: 30, w: 23, h: 41, label: 'The generator', action: 'flavour',
        text: 'Cold, keyed, and humming anyway. Whatever is powering the lamps upstairs, it is not this.' },
    ],
    reward: {
      title: 'Every lamp in the house comes on at once',
      text: 'Current finds the lamp. The generator door falls open and a black rose lies across the terminals, unburnt.',
      clue: 'The parlour floor is marked. Bring all five. Speak all five.',
    },
  },
  {
    id: 'ritual',
    name: 'The Séance Parlour',
    scene: SCENES.ritual,
    puzzle: ritual,
    caption: 'A star in black tape, five candles, and a shape at the far end of the room that is politely waiting.',
    needsAll: true,
    hotspots: [
      { x: 30, y: 38, w: 40, h: 56, label: 'Begin the ritual', action: 'puzzle' },
      { x: 44, y: 10, w: 12, h: 26, label: 'Something in the corner', action: 'flavour',
        text: 'Hair, roughly your height, thin as a rumour. It raises what might be a hand.' },
    ],
  },
];

export const roomById = (id) => ROOMS.find((r) => r.id === id);
export const roomIndex = (id) => ROOMS.findIndex((r) => r.id === id);
