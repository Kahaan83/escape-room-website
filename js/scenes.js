/**
 * Every room is drawn as inline SVG — no bitmaps, no external art.
 * Each scene shares a backdrop (wall, wainscot, floorboards, candle glow) so
 * the mansion feels like one continuous house rather than six unrelated images.
 */

const VB = 'viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"';

const DEFS = `
<defs>
  <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#241430"/><stop offset="1" stop-color="#140c1b"/>
  </linearGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3a2618"/><stop offset="1" stop-color="#1e1410"/>
  </linearGradient>
  <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2b1c22"/><stop offset="1" stop-color="#0e080f"/>
  </linearGradient>
  <radialGradient id="glow" cx="50%" cy="40%" r="60%">
    <stop offset="0" stop-color="#c8a24a" stop-opacity=".22"/>
    <stop offset="1" stop-color="#c8a24a" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="flame" cx="50%" cy="60%" r="50%">
    <stop offset="0" stop-color="#ffe6a8"/><stop offset="1" stop-color="#c8721a" stop-opacity="0"/>
  </radialGradient>
  <pattern id="damask" width="60" height="80" patternUnits="userSpaceOnUse">
    <path d="M30 6c12 10 12 26 0 34-12-8-12-24 0-34Zm0 40c12 10 12 26 0 34-12-8-12-24 0-34Z"
          fill="none" stroke="#3a2445" stroke-width="1.1"/>
  </pattern>
</defs>`;

const backdrop = (wainscotY = 430) => `
  <rect width="1000" height="620" fill="url(#wall)"/>
  <rect width="1000" height="620" fill="url(#damask)" opacity=".55"/>
  <rect y="${wainscotY}" width="1000" height="${620 - wainscotY}" fill="url(#floor)"/>
  <rect y="${wainscotY - 14}" width="1000" height="16" fill="url(#wood)"/>
  ${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 125} 620 L${380 + i * 33} ${wainscotY}" stroke="#0b060c" stroke-width="1.4" opacity=".7"/>`).join('')}
  <ellipse cx="500" cy="300" rx="560" ry="360" fill="url(#glow)"/>`;

const candle = (x, y, s = 1) => `
  <g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-5" y="-34" width="10" height="34" fill="#e9e0cd" opacity=".85"/>
    <rect x="-11" y="0" width="22" height="7" rx="2" fill="#6b5a3a"/>
    <path d="M0 -36v-6" stroke="#4a3a20" stroke-width="1.5"/>
    <ellipse cx="0" cy="-48" rx="11" ry="18" fill="url(#flame)">
      <animate attributeName="ry" values="18;22;17;20;18" dur="3.1s" repeatCount="indefinite"/>
    </ellipse>
    <ellipse cx="0" cy="-45" rx="3.4" ry="7" fill="#fff4cf" opacity=".95"/>
  </g>`;

const cobweb = (x, y, r, flip = 1) => `
  <g transform="translate(${x} ${y}) scale(${flip} 1)" stroke="#6a6270" stroke-width="1" fill="none" opacity=".45">
    <path d="M0 0 L${r} 0 M0 0 L${r * 0.93} ${r * 0.38} M0 0 L${r * 0.7} ${r * 0.7} M0 0 L${r * 0.38} ${r * 0.93} M0 0 L0 ${r}"/>
    ${[0.35, 0.6, 0.85].map((k) => `<path d="M${r * k} 0 Q${r * k * 0.8} ${r * k * 0.8} 0 ${r * k}"/>`).join('')}
  </g>`;

const frame = (x, y, w, h, inner) => `
  <g transform="translate(${x} ${y})">
    <rect x="-9" y="-9" width="${w + 18}" height="${h + 18}" fill="#3b2c12" stroke="#5e4a1e" stroke-width="2"/>
    <rect width="${w}" height="${h}" fill="#150d1a"/>
    ${inner}
    <rect width="${w}" height="${h}" fill="none" stroke="#0a060c" stroke-width="2"/>
  </g>`;

const bust = (w, h, hair) => `
  <ellipse cx="${w / 2}" cy="${h * 0.72}" rx="${w * 0.36}" ry="${h * 0.3}" fill="#2a1f31"/>
  <ellipse cx="${w / 2}" cy="${h * 0.42}" rx="${w * 0.2}" ry="${h * 0.24}" fill="#463a4a"/>
  ${hair}
  <circle cx="${w / 2 - w * 0.08}" cy="${h * 0.4}" r="2.4" fill="#0d0710"/>
  <circle cx="${w / 2 + w * 0.08}" cy="${h * 0.4}" r="2.4" fill="#0d0710"/>`;

/* --- the six rooms -------------------------------------------------------- */

export const SCENES = {

  gallery: () => `<svg ${VB}>${DEFS}${backdrop(440)}
    ${frame(120, 120, 130, 170, bust(130, 170, `<path d="M45 30q20-22 40 0v16q-20-14-40 0Z" fill="#141017"/><path d="M52 44q13 10 26 0" stroke="#2a2030" fill="none"/>`))}
    ${frame(330, 100, 130, 170, bust(130, 170, `<path d="M42 34q23-26 46 0l6 60q-29-16-58 0Z" fill="#100c14"/>`))}
    ${frame(540, 120, 130, 170, bust(130, 170, `<path d="M44 26h42v20H44Z" fill="#171220"/>`))}
    ${frame(750, 100, 130, 170, bust(130, 170, `<path d="M40 40q25-30 50 0-25-8-50 0Z" fill="#12101a"/>`))}
    <rect x="380" y="440" width="260" height="14" fill="url(#wood)"/>
    <rect x="400" y="454" width="16" height="90" fill="#2a1c12"/>
    <rect x="604" y="454" width="16" height="90" fill="#2a1c12"/>
    ${candle(440, 440, 0.9)} ${candle(560, 440, 0.9)}
    ${cobweb(0, 0, 150)} ${cobweb(1000, 0, 150, -1)}
    <text x="500" y="70" text-anchor="middle" fill="#5a4a63" font-family="Cinzel, serif" font-size="17" letter-spacing="7">THE DEPARTED</text>
  </svg>`,

  lab: () => `<svg ${VB}>${DEFS}${backdrop(450)}
    <rect x="60" y="150" width="380" height="10" fill="url(#wood)"/>
    <rect x="60" y="250" width="380" height="10" fill="url(#wood)"/>
    ${[90, 150, 210, 270, 330, 380].map((x, i) => `
      <rect x="${x}" y="${108 - (i % 3) * 8}" width="26" height="${42 + (i % 3) * 8}" rx="4"
            fill="${['#3d2430', '#22402f', '#3f3a1c', '#2b2340', '#402226', '#1f3340'][i]}" stroke="#6a5a48" stroke-width="1.2"/>`).join('')}
    ${[100, 170, 240, 310, 370].map((x, i) => `
      <rect x="${x}" y="${212 - (i % 2) * 6}" width="22" height="${40 + (i % 2) * 6}" rx="3"
            fill="${['#2d3f22', '#3a2230', '#3b3520', '#24354a', '#3a2440'][i]}" stroke="#6a5a48" stroke-width="1.1"/>`).join('')}
    <rect x="240" y="360" width="620" height="18" fill="url(#wood)"/>
    <rect x="260" y="378" width="580" height="80" fill="#1a1016" opacity=".85"/>
    <g transform="translate(560 250)">
      <path d="M-26 0h52l-14 60a14 14 0 0 1-24 0Z" fill="#101a12" stroke="#7a6a52" stroke-width="2"/>
      <path d="M-19 40h38l-6 22a12 12 0 0 1-26 0Z" fill="#7fa05f" opacity=".9"/>
      <circle cx="-6" cy="52" r="4" fill="#cfe6b4" opacity=".7"><animate attributeName="cy" values="60;24" dur="2.6s" repeatCount="indefinite"/><animate attributeName="opacity" values=".8;0" dur="2.6s" repeatCount="indefinite"/></circle>
      <circle cx="8" cy="52" r="3" fill="#cfe6b4" opacity=".6"><animate attributeName="cy" values="58;20" dur="3.4s" repeatCount="indefinite"/><animate attributeName="opacity" values=".7;0" dur="3.4s" repeatCount="indefinite"/></circle>
      <rect x="-9" y="-16" width="18" height="18" fill="none" stroke="#7a6a52" stroke-width="2"/>
    </g>
    <g transform="translate(720 300)">
      <path d="M0 0h70M0 0v-40" stroke="#5a4a3a" stroke-width="3" fill="none"/>
      <rect x="54" y="-56" width="32" height="42" rx="4" fill="#2a2340" stroke="#6a5a48" stroke-width="1.5"/>
    </g>
    ${candle(880, 360, 1)}
    ${cobweb(1000, 60, 130, -1)}
    <text x="500" y="70" text-anchor="middle" fill="#5a4a63" font-family="Cinzel, serif" font-size="17" letter-spacing="7">THE LABORATORY</text>
  </svg>`,

  library: () => `<svg ${VB}>${DEFS}${backdrop(470)}
    <rect x="80" y="70" width="600" height="400" fill="#100a14" stroke="#3a2618" stroke-width="10"/>
    ${[150, 250, 350, 450].map((y) => `<rect x="80" y="${y}" width="600" height="12" fill="url(#wood)"/>`).join('')}
    ${[0, 1, 2, 3].map((row) => Array.from({ length: 22 }, (_, i) => {
      const colors = ['#3a1f28', '#243a2a', '#3a3320', '#26223f', '#3a2440', '#1f3140', '#432a1c'];
      const h = 62 + ((i * 7 + row * 5) % 18);
      const x = 96 + i * 26;
      return `<rect x="${x}" y="${150 + row * 100 - h}" width="${18 + (i % 3)}" height="${h}" fill="${colors[(i + row) % 7]}" stroke="#0b060c" stroke-width="1"/>`;
    }).join('')).join('')}
    <g transform="translate(760 330)">
      <rect x="-70" y="0" width="230" height="16" fill="url(#wood)"/>
      <rect x="-56" y="16" width="14" height="120" fill="#2a1c12"/>
      <rect x="132" y="16" width="14" height="120" fill="#2a1c12"/>
      <g transform="rotate(-8 20 -10)">
        <rect x="-20" y="-16" width="86" height="18" fill="#c9b88f" stroke="#8d7a52"/>
        ${[0, 1, 2].map((i) => `<path d="M-12 ${-11 + i * 5}h70" stroke="#6b5a3a" stroke-width="1"/>`).join('')}
      </g>
    </g>
    ${candle(880, 330, 0.95)}
    ${cobweb(0, 40, 160)}
    <text x="500" y="45" text-anchor="middle" fill="#5a4a63" font-family="Cinzel, serif" font-size="17" letter-spacing="7">THE LIBRARY</text>
  </svg>`,

  dining: () => `<svg ${VB}>${DEFS}${backdrop(400)}
    <path d="M110 420 L890 420 L960 600 L40 600Z" fill="#c9b88f" opacity=".14"/>
    <path d="M110 420 L890 420 L960 600 L40 600Z" fill="none" stroke="#6b5a3a" stroke-width="2"/>
    <rect x="150" y="410" width="700" height="16" fill="url(#wood)"/>
    ${[200, 400, 600, 790].map((x) => `
      <g transform="translate(${x} 300)">
        <rect x="-4" y="0" width="8" height="112" fill="#2a1c12"/>
        <rect x="-34" y="-72" width="68" height="76" rx="8" fill="#241730" stroke="#3a2618" stroke-width="4"/>
        <rect x="-26" y="-60" width="52" height="52" fill="#1a1020"/>
      </g>`).join('')}
    ${[320, 500, 680].map((x) => `
      <g transform="translate(${x} 470)">
        <ellipse cx="0" cy="0" rx="62" ry="20" fill="#3a3038" stroke="#58484f" stroke-width="2"/>
        <ellipse cx="0" cy="-3" rx="44" ry="13" fill="#241b28"/>
      </g>`).join('')}
    <g transform="translate(500 400)">
      <rect x="-7" y="-4" width="14" height="10" fill="#6b5a3a"/>
      <path d="M0 -4v-46M0 -30h-34v-14M0 -30h34v-14" stroke="#6b5a3a" stroke-width="4" fill="none"/>
    </g>
    ${candle(500, 350, 0.85)} ${candle(466, 364, 0.7)} ${candle(534, 364, 0.7)}
    ${cobweb(0, 0, 170)} ${cobweb(1000, 20, 150, -1)}
    <text x="500" y="70" text-anchor="middle" fill="#5a4a63" font-family="Cinzel, serif" font-size="17" letter-spacing="7">THE DINING ROOM</text>
  </svg>`,

  generator: () => `<svg ${VB}>${DEFS}
    <rect width="1000" height="620" fill="#100a14"/>
    <rect y="450" width="1000" height="170" fill="#1a1016"/>
    ${Array.from({ length: 16 }, (_, i) => `<rect x="${i * 64}" y="0" width="58" height="450" fill="#170f1c" stroke="#0b060c" stroke-width="2"/>`).join('')}
    <path d="M0 120h1000M0 170h1000" stroke="#2e2434" stroke-width="14" fill="none"/>
    <path d="M140 120v330M760 170v280" stroke="#2e2434" stroke-width="12"/>
    <g transform="translate(430 190)">
      <rect width="230" height="250" rx="6" fill="#1d2228" stroke="#46505c" stroke-width="4"/>
      <rect x="18" y="20" width="194" height="110" fill="#0d1116" stroke="#46505c" stroke-width="2"/>
      ${Array.from({ length: 6 }, (_, i) => `<rect x="${30 + i * 31}" y="${34}" width="18" height="82" rx="3" fill="#161c22" stroke="#2e3740"/>`).join('')}
      <rect x="18" y="150" width="194" height="76" fill="#161c22" stroke="#46505c" stroke-width="2"/>
      <text x="115" y="196" text-anchor="middle" fill="#8d2230" font-family="Cinzel, serif" font-size="19" letter-spacing="3">HIGH VOLTAGE</text>
      <circle cx="205" cy="140" r="6" fill="#8d2230"><animate attributeName="opacity" values="1;.2;1" dur="1.8s" repeatCount="indefinite"/></circle>
    </g>
    <g transform="translate(160 360)">
      <rect width="150" height="90" fill="url(#wood)" stroke="#2a1c12" stroke-width="3"/>
      <rect x="18" y="-58" width="110" height="60" rx="5" fill="#2e3740" stroke="#5a6672" stroke-width="3"/>
      <circle cx="73" cy="-28" r="13" fill="#0d1116" stroke="#8d7a52" stroke-width="3"/>
      <path d="M73 -41v8" stroke="#c8a24a" stroke-width="3"/>
    </g>
    ${candle(840, 440, 1.1)}
    <ellipse cx="500" cy="300" rx="520" ry="330" fill="url(#glow)"/>
    <text x="500" y="70" text-anchor="middle" fill="#5a4a63" font-family="Cinzel, serif" font-size="17" letter-spacing="7">THE CELLAR</text>
  </svg>`,

  ritual: () => `<svg ${VB}>${DEFS}${backdrop(210)}
    <g transform="translate(500 400)">
      <circle r="185" fill="none" stroke="#4a3a20" stroke-width="3" opacity=".8"/>
      <path d="M0 -175 L166 56 L-103 -142 L103 -142 L-166 56Z" fill="none" stroke="#c8a24a" stroke-width="3" opacity=".65"
            transform="scale(1 .62)"/>
      <circle r="185" fill="none" stroke="#c8a24a" stroke-width="1" opacity=".3" transform="scale(1 .62)"/>
    </g>
    ${candle(230, 330, 1.1)} ${candle(770, 330, 1.1)} ${candle(500, 250, 1.1)}
    ${candle(310, 520, 0.95)} ${candle(690, 520, 0.95)}
    <g transform="translate(500 150)" opacity=".5">
      <ellipse cx="0" cy="0" rx="60" ry="86" fill="#2a2030"/>
      <path d="M-58 -10q58-70 116 0-10 90-58 96-48-6-58-96Z" fill="#1a1420"/>
      <circle cx="-12" cy="10" r="3" fill="#c8a24a" opacity=".7"><animate attributeName="opacity" values=".7;.15;.7" dur="4s" repeatCount="indefinite"/></circle>
      <circle cx="12" cy="10" r="3" fill="#c8a24a" opacity=".7"><animate attributeName="opacity" values=".7;.15;.7" dur="4s" repeatCount="indefinite"/></circle>
    </g>
    ${cobweb(0, 0, 190)} ${cobweb(1000, 0, 190, -1)}
    <text x="500" y="70" text-anchor="middle" fill="#5a4a63" font-family="Cinzel, serif" font-size="17" letter-spacing="7">THE SÉANCE PARLOUR</text>
  </svg>`,
};
