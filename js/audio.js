/**
 * Every sound in the mansion is generated at runtime with the Web Audio API,
 * so the project ships with no binary assets at all. The ambience is a slow
 * detuned drone plus an occasional harpsichord-ish pluck; effects are short
 * envelopes on oscillators and filtered noise.
 */

let ctx = null;
let master = null;
let ambience = null;
let muted = false;
let motifTimer = null;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.5;
  master.connect(ctx.destination);
  return ctx;
}

export function setMuted(value) {
  muted = value;
  if (master) master.gain.setTargetAtTime(muted ? 0 : 0.5, ctx.currentTime, 0.08);
}

export function isMuted() { return muted; }

/** Must be called from a user gesture — browsers block audio otherwise. */
export function unlock() {
  const c = ensure();
  if (c && c.state === 'suspended') c.resume();
}

function env(node, { attack = 0.01, decay = 0.25, peak = 0.5 } = {}) {
  const g = ctx.createGain();
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  node.connect(g);
  g.connect(master);
  return { g, stopAt: t + attack + decay + 0.05 };
}

function tone(freq, opts = {}) {
  const c = ensure();
  if (!c) return;
  const osc = c.createOscillator();
  osc.type = opts.type || 'triangle';
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (opts.glide) {
    osc.frequency.exponentialRampToValueAtTime(opts.glide, c.currentTime + (opts.decay || 0.25));
  }
  const { stopAt } = env(osc, opts);
  osc.start();
  osc.stop(stopAt);
}

function noise({ decay = 0.3, peak = 0.25, freq = 900, type = 'lowpass' } = {}) {
  const c = ensure();
  if (!c) return;
  const len = Math.max(1, Math.floor(c.sampleRate * decay));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  src.connect(filter);
  const { stopAt } = env(filter, { attack: 0.005, decay, peak });
  src.start();
  src.stop(stopAt);
}

/* --- the ambient bed ------------------------------------------------------ */

const MOTIF = [293.66, 349.23, 440.00, 349.23, 293.66, 261.63]; // D minor wander

export function startAmbience() {
  const c = ensure();
  if (!c || ambience) return;
  const bus = c.createGain();
  bus.gain.value = 0.10;
  bus.connect(master);

  const drone = [73.42, 110.00, 146.83].map((f, i) => {
    const o = c.createOscillator();
    o.type = i === 2 ? 'sine' : 'sawtooth';
    o.frequency.value = f;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    const g = c.createGain();
    g.gain.value = i === 0 ? 0.5 : 0.18;
    o.connect(lp); lp.connect(g); g.connect(bus);
    o.start();
    return o;
  });

  // a slow breath so the drone never sits perfectly still
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.frequency.value = 0.07;
  lfoGain.gain.value = 0.05;
  lfo.connect(lfoGain); lfoGain.connect(bus.gain);
  lfo.start();

  ambience = { bus, drone, lfo };

  let step = 0;
  motifTimer = setInterval(() => {
    if (muted || !ctx) return;
    if (Math.random() < 0.55) {
      tone(MOTIF[step % MOTIF.length] * 2, { type: 'triangle', peak: 0.07, decay: 1.4, attack: 0.02 });
      step++;
    }
  }, 2600);
}

export function stopAmbience() {
  clearInterval(motifTimer);
  motifTimer = null;
  if (!ambience) return;
  try {
    ambience.drone.forEach((o) => o.stop());
    ambience.lfo.stop();
  } catch { /* already stopped */ }
  ambience = null;
}

/* --- effects -------------------------------------------------------------- */

export const sfx = {
  click:   () => tone(420, { type: 'square', peak: 0.06, decay: 0.05 }),
  pick:    () => tone(660, { type: 'sine', peak: 0.1, decay: 0.09 }),
  place:   () => tone(330, { type: 'sine', peak: 0.12, decay: 0.14 }),
  open:    () => { noise({ decay: 0.5, peak: 0.12, freq: 1600, type: 'highpass' }); tone(196, { peak: 0.1, decay: 0.5 }); },
  wrong:   () => tone(150, { type: 'sawtooth', peak: 0.14, decay: 0.3, glide: 80 }),
  solved:  () => { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => setTimeout(() => tone(f, { type: 'triangle', peak: 0.16, decay: 0.7 }), i * 110)); },
  hint:    () => { noise({ decay: 0.9, peak: 0.1, freq: 700 }); tone(233, { peak: 0.09, decay: 0.9, glide: 466 }); },
  item:    () => { tone(880, { type: 'sine', peak: 0.14, decay: 0.5 }); setTimeout(() => tone(1174, { type: 'sine', peak: 0.1, decay: 0.8 }), 90); },
  tick:    () => tone(1200, { type: 'square', peak: 0.03, decay: 0.03 }),
  thunder: () => { noise({ decay: 2.4, peak: 0.5, freq: 260 }); tone(48, { type: 'sawtooth', peak: 0.3, decay: 2.2 }); },
  victory: () => { [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => setTimeout(() => tone(f, { type: 'triangle', peak: 0.18, decay: 1.4 }), i * 150)); },
  doom:    () => { [220, 207.65, 196, 164.81].forEach((f, i) => setTimeout(() => tone(f, { type: 'sawtooth', peak: 0.2, decay: 1.2 }), i * 260)); },
};
