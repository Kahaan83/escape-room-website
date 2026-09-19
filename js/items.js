/** The five offerings. Every icon is inline SVG — no image files anywhere. */

const wrap = (inner) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;

export const ITEMS = {
  dust: {
    name: 'Pouch of Grave Dust',
    icon: wrap(`
      <path d="M17 16h14l4 20a4 4 0 0 1-4 5H17a4 4 0 0 1-4-5Z" fill="#241a1f" stroke="#8d7a52" stroke-width="1.6"/>
      <path d="M17 16c2-4 4-6 7-6s5 2 7 6" fill="none" stroke="#8d7a52" stroke-width="1.6"/>
      <path d="M14 20q10 4 20 0" fill="none" stroke="#c8a24a" stroke-width="1.8"/>
      <circle cx="21" cy="30" r="1.2" fill="#a2988a"/><circle cx="27" cy="34" r="1" fill="#a2988a"/>
      <circle cx="24" cy="27" r=".8" fill="#a2988a"/>
    `),
  },
  elixir: {
    name: 'Elixir of Chaos',
    icon: wrap(`
      <path d="M20 7h8v9l6 16a5 5 0 0 1-5 7H19a5 5 0 0 1-5-7l6-16Z" fill="#0f1a10" stroke="#8d7a52" stroke-width="1.6"/>
      <path d="M16.5 26h15l2.5 6a5 5 0 0 1-5 7H19a5 5 0 0 1-5-7Z" fill="#7fa05f"/>
      <path d="M18 8h12" stroke="#c8a24a" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="22" cy="32" r="1.6" fill="#b6d69a" opacity=".8"/>
      <circle cx="27" cy="35" r="1.1" fill="#b6d69a" opacity=".7"/>
    `),
  },
  leaf: {
    name: 'Deadly Nightshade',
    icon: wrap(`
      <path d="M24 42C9 34 9 15 24 6c15 9 15 28 0 36Z" fill="#1a0f1e" stroke="#8d7a52" stroke-width="1.6"/>
      <path d="M24 8v32" stroke="#c8a24a" stroke-width="1.4"/>
      <path d="M24 16 16 13M24 22l-10-2M24 29l-9 1M24 16l8-3M24 22l10-2M24 29l9 1" stroke="#6b5a3a" stroke-width="1.1" fill="none"/>
    `),
  },
  spider: {
    name: "The Widow's Pet",
    icon: wrap(`
      <g stroke="#8d7a52" stroke-width="1.7" fill="none" stroke-linecap="round">
        <path d="M18 22 7 14M18 26 6 25M19 30 8 36M21 33l-6 8M30 22l11-8M30 26l12-1M29 30l11 6M27 33l6 8"/>
      </g>
      <ellipse cx="24" cy="28" rx="7" ry="9" fill="#1a0f1e" stroke="#8d7a52" stroke-width="1.6"/>
      <circle cx="24" cy="19" r="4.6" fill="#241a1f" stroke="#8d7a52" stroke-width="1.4"/>
      <path d="M24 24v8M21 28h6" stroke="#8d2230" stroke-width="2" stroke-linecap="round"/>
      <circle cx="22.2" cy="18" r="1" fill="#c8a24a"/><circle cx="25.8" cy="18" r="1" fill="#c8a24a"/>
    `),
  },
  rose: {
    name: "Morticia's Black Rose",
    icon: wrap(`
      <path d="M24 26v18" stroke="#3f4a32" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M24 34c-4 0-7-2-8-5 4-1 7 1 8 5ZM24 38c4 0 7-2 8-5-4-1-7 1-8 5Z" fill="#3f4a32"/>
      <circle cx="24" cy="17" r="11" fill="#150c17" stroke="#8d7a52" stroke-width="1.5"/>
      <circle cx="24" cy="17" r="7" fill="none" stroke="#5a4a63" stroke-width="1.3"/>
      <circle cx="24" cy="17" r="3.4" fill="none" stroke="#8d2230" stroke-width="1.4"/>
      <path d="M24 6v22M13 17h22M16 9l16 16M32 9 16 25" stroke="#2a1b2e" stroke-width="1"/>
    `),
  },
};

export const ITEM_ORDER = ['dust', 'elixir', 'leaf', 'spider', 'rose'];
