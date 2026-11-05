/**
 * Celebration sounds for the launch ceremony, like a crowd at a grand opening:
 *   - two party poppers, one from each corner, exactly when the confetti fires
 *   - champagne bottles being opened (cork pop and fizz)
 *   - a crowd clapping (the real recording in /public/applause.wav, started the instant the poppers pop;
 *     if that file can't be loaded, a synthesised round of applause plays instead)
 *   - people cheering, with a few whistles
 *
 * Everything is synthesised with the Web Audio API, so there are no sound files to download, license or host.
 *
 * Browsers only allow sound after the visitor has tapped / clicked / pressed a key on the page.
 * `unlockAudio()` is called from the first such gesture (the curtains also show a small sound button).
 * If sound is still locked when the curtains open, the celebration simply plays silently.
 */

export interface CelebrationAudioOptions {
  /** visitor prefers less motion: just the two poppers, a round of applause and a small cheer */
  reduced?: boolean;
  /** milliseconds (from the start of the celebration) at which the confetti poppers fire; the first one is used */
  volleys: readonly number[];
  /** the decoded applause recording, when it is ready. It starts at the same instant as the first popper. */
  applause?: AudioBuffer | null;
}

/* ------------------------------------------------------------------ shared context */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
const listeners = new Set<() => void>();

const MUTE_KEY = "lc-sound-muted";
const VOLUME = 0.65;

/** The applause recording. The file lives in the `public` folder, so it is served from the site root. */
const APPLAUSE_URL = "/applause.wav";
const APPLAUSE_VOLUME = 1;

let applauseBytes: Promise<ArrayBuffer | null> | null = null;
let applauseBuffer: AudioBuffer | null = null;
let applauseDecodeStarted = false;

/** Downloads the applause file in the background (while the curtains are still closed) so it is ready to play instantly. */
export function preloadApplause() {
  if (typeof window === "undefined" || applauseBytes) return;
  applauseBytes = fetch(APPLAUSE_URL)
    .then((r) => (r.ok ? r.arrayBuffer() : null))
    .catch(() => null);
}

/** Decodes the downloaded file once an audio context exists, so playback needs no waiting. */
function decodeApplause(c: AudioContext) {
  if (applauseDecodeStarted) return;
  applauseDecodeStarted = true;
  preloadApplause();
  void applauseBytes!
    .then((bytes) => (bytes ? new Promise<AudioBuffer>((res, rej) => c.decodeAudioData(bytes, res, rej)) : null))
    .then((buf) => {
      if (buf) applauseBuffer = buf;
    })
    .catch(() => {});
}

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function notify() {
  listeners.forEach((fn) => fn());
}

/** Builds the output chain: master volume -> gentle compressor -> limiter (so it never distorts) -> speakers. */
export function createOutput(c: BaseAudioContext, volume = VOLUME): GainNode {
  const gain = c.createGain();
  gain.gain.value = volume;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 14;
  comp.ratio.value = 5;
  comp.attack.value = 0.004;
  comp.release.value = 0.3;
  const limiter = c.createDynamicsCompressor();
  limiter.threshold.value = -4;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.08;
  const trim = c.createGain(); // leaves a little headroom so it is loud and festive, but not harsh
  trim.gain.value = 0.97;
  gain.connect(comp);
  comp.connect(limiter);
  limiter.connect(trim);
  trim.connect(c.destination);
  return gain;
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  muted = readMuted();
  master = createOutput(ctx, muted ? 0 : VOLUME);
  ctx.addEventListener("statechange", notify);
  return ctx;
}

/** Call from a tap / click / key press. Returns true when sound is available. */
export function unlockAudio(): boolean {
  const c = getContext();
  if (!c) return false;
  decodeApplause(c);
  if (c.state !== "running") {
    void c.resume().then(notify, () => {});
    // a silent blip: some phones only unlock audio after something has actually been played
    try {
      const b = c.createBuffer(1, 1, 22050);
      const s = c.createBufferSource();
      s.buffer = b;
      s.connect(c.destination);
      s.start(0);
    } catch {
      /* ignore */
    }
  }
  return c.state === "running";
}

export function isAudioRunning(): boolean {
  return !!ctx && ctx.state === "running";
}

export function isMuted(): boolean {
  if (!ctx) return readMuted();
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (master && ctx) master.gain.setTargetAtTime(value ? 0 : VOLUME, ctx.currentTime, 0.03);
  notify();
}

/** Lets the curtains' sound button follow unlock / mute changes. Returns an unsubscribe function. */
export function onAudioChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Starts the celebration sounds now. Returns a function that fades them out (used if the page is left early). */
export function startCelebrationAudio(opts: CelebrationAudioOptions): () => void {
  const c = getContext();
  if (!c || !master || c.state !== "running") return () => {};
  const session = c.createGain();
  session.connect(master);
  decodeApplause(c);
  scheduleCelebration(c, session, { ...opts, applause: applauseBuffer }, c.currentTime + 0.06);
  return () => {
    try {
      session.gain.cancelScheduledValues(c.currentTime);
      session.gain.setTargetAtTime(0, c.currentTime, 0.05);
    } catch {
      /* ignore */
    }
  };
}

/* ------------------------------------------------------------------ small helpers */

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();
function noise(c: BaseAudioContext): AudioBuffer {
  let b = noiseCache.get(c);
  if (!b) {
    b = c.createBuffer(1, Math.floor(c.sampleRate * 1.5), c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noiseCache.set(c, b);
  }
  return b;
}

/** A volume + stereo position stage. */
function bus(c: BaseAudioContext, dest: AudioNode, vol: number, pan = 0): GainNode {
  const g = c.createGain();
  g.gain.value = vol;
  if (typeof c.createStereoPanner === "function") {
    const p = c.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    g.connect(p);
    p.connect(dest);
  } else {
    g.connect(dest);
  }
  return g;
}

/** Gain that jumps up fast and dies away exponentially. */
function pluck(c: BaseAudioContext, dest: AudioNode, t: number, peak: number, attack: number, decay: number): GainNode {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  g.connect(dest);
  return g;
}

interface BurstOpts {
  dur: number;
  peak: number;
  type: BiquadFilterType;
  freq: number;
  q?: number;
  attack?: number;
}

/** A short burst of filtered noise. */
function burst(c: BaseAudioContext, dest: AudioNode, t: number, o: BurstOpts) {
  const attack = o.attack ?? 0.002;
  const src = c.createBufferSource();
  src.buffer = noise(c);
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = o.type;
  f.frequency.value = o.freq;
  f.Q.value = o.q ?? 0.7;
  const g = pluck(c, dest, t, o.peak, attack, o.dur);
  src.connect(f);
  f.connect(g);
  src.start(t, rnd(0, 1));
  src.stop(t + attack + o.dur + 0.05);
}

/** A sine "thump" that falls in pitch. */
function thump(c: BaseAudioContext, dest: AudioNode, t: number, f0: number, f1: number, peak: number, sweep: number, decay: number) {
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + sweep);
  const g = pluck(c, dest, t, peak, 0.002, decay);
  o.connect(g);
  o.start(t);
  o.stop(t + decay + 0.05);
}

/* ------------------------------------------------------------------ the sounds */

/** Party popper: a clear "pop" followed by the soft rush of streamers and confetti. */
function partyPopper(c: BaseAudioContext, dest: AudioNode, t: number, vol: number, pan: number) {
  const out = bus(c, dest, vol, pan);
  thump(c, out, t, 420, 100, 1, 0.05, 0.15); // the hollow body of the pop
  burst(c, out, t, { dur: 0.07, peak: 0.95, type: "bandpass", freq: 1100, q: 1.4, attack: 0.001 }); // the "pop"
  burst(c, out, t, { dur: 0.05, peak: 0.35, type: "lowpass", freq: 2200, q: 0.5, attack: 0.001 }); // puff of air
  burst(c, out, t + 0.035, { dur: 0.45, peak: 0.24, type: "bandpass", freq: 2300, q: 0.9, attack: 0.08 }); // streamers and confetti rushing out
}

/** Champagne bottle: the cork pops with a hollow "thoomp", then the fizz hisses softly. */
function champagne(c: BaseAudioContext, dest: AudioNode, t: number, vol: number, pan: number) {
  const out = bus(c, dest, vol, pan);
  burst(c, out, t, { dur: 0.04, peak: 0.55, type: "lowpass", freq: 1800, q: 0.7, attack: 0.001 });
  thump(c, out, t, 520, 110, 0.95, 0.06, 0.13);
  burst(c, out, t + 0.004, { dur: 0.32, peak: 1, type: "bandpass", freq: 230, q: 9, attack: 0.002 }); // the bottle's hollow resonance
  burst(c, out, t + 0.004, { dur: 0.2, peak: 0.55, type: "bandpass", freq: 520, q: 6, attack: 0.002 });

  // the fizz
  const src = c.createBufferSource();
  src.buffer = noise(c);
  src.loop = true;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 4000;
  bp.Q.value = 0.4;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 5800;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.2, t + 0.18);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2.0);
  src.connect(bp);
  bp.connect(lp);
  lp.connect(g);
  g.connect(out);
  src.start(t + 0.03, rnd(0, 1));
  src.stop(t + 2.1);
}

/** Plays the real applause recording, starting at time `t`. */
function playRecording(c: BaseAudioContext, dest: AudioNode, t: number, buffer: AudioBuffer, vol: number) {
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(g);
  g.connect(dest);
  src.start(t);
}

/**
 * A crowd clapping. Every clap is a short, warm "pat" of hands (noise shaped by a resonance somewhere between
 * 0.9 and 2.6 kHz, so each one has its own pitch), and hundreds of them overlap: a few at first, then the whole
 * room, then it dies away.
 */
function applause(c: BaseAudioContext, dest: AudioNode, t: number, dur: number, vol: number) {
  const sr = c.sampleRate;
  const len = Math.floor(dur * sr);
  const buf = c.createBuffer(2, len, sr);
  const rise = Math.min(1.6, dur * 0.25);
  const fall = Math.min(2.8, dur * 0.45);
  const density = (x: number) => {
    const up = Math.min(1, x / rise);
    const down = Math.min(1, (dur - x) / fall);
    return Math.max(0, Math.min(up, down)) ** 1.1;
  };
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    const n = Math.floor(dur * 80);
    for (let k = 0; k < n; k++) {
      let x = 0;
      let tries = 0;
      do {
        x = Math.random() * dur;
        tries++;
      } while (Math.random() > density(x) && tries < 30);
      const start = Math.floor(x * sr);
      const cl = Math.floor(sr * rnd(0.02, 0.045));
      const amp = rnd(0.35, 1) * Math.sqrt(density(x)) * 4.5;
      const tau = cl * 0.3;
      // resonant band-pass (RBJ biquad), so each clap has its own tone
      const w0 = (2 * Math.PI * rnd(900, 2600)) / sr;
      const alpha = Math.sin(w0) / (2 * rnd(1.8, 3.6));
      const a0 = 1 + alpha;
      const a1 = (-2 * Math.cos(w0)) / a0;
      const a2 = (1 - alpha) / a0;
      const b0 = alpha / a0;
      const b2 = -alpha / a0;
      let x1 = 0;
      let x2 = 0;
      let y1 = 0;
      let y2 = 0;
      for (let i = 0; i < cl && start + i < len; i++) {
        const x0 = Math.random() * 2 - 1;
        const y0 = b0 * x0 + b2 * x2 - a1 * y1 - a2 * y2;
        x2 = x1;
        x1 = x0;
        y2 = y1;
        y1 = y0;
        d[start + i] += y0 * amp * Math.exp(-i / tau);
      }
    }
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 320;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 4300;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(hp);
  hp.connect(lp);
  lp.connect(g);
  g.connect(dest);
  src.start(t);
}

/** One person cheering ("woo!" / "yay!"): a buzzing voice shaped by vowel formants, with a little breath. */
function voice(c: BaseAudioContext, dest: AudioNode, t: number, base: number, dur: number, vol: number, pan: number, kind: "woo" | "yay") {
  const out = bus(c, dest, vol, pan);
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(base * rnd(0.74, 0.86), t);
  osc.frequency.exponentialRampToValueAtTime(base * rnd(1.2, 1.4), t + rnd(0.16, 0.28));
  osc.frequency.linearRampToValueAtTime(base * rnd(0.95, 1.15), t + dur);
  const lfo = c.createOscillator();
  lfo.frequency.value = rnd(4.8, 6.6);
  const lg = c.createGain();
  lg.gain.value = base * rnd(0.015, 0.035);
  lfo.connect(lg);
  lg.connect(osc.frequency);

  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(1, t + rnd(0.06, 0.12));
  env.gain.setValueAtTime(1, t + dur * 0.5);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const soft = c.createBiquadFilter(); // takes the buzz off the top
  soft.type = "lowpass";
  soft.frequency.value = 3600;
  env.connect(soft);
  soft.connect(out);

  const f1 = kind === "woo" ? [400, 780] : [600, 720];
  const f2 = kind === "woo" ? [820, 1250] : [1550, 1900];
  const formants: [number, number, number, number][] = [
    [f1[0], f1[1], 5, 1.0],
    [f2[0], f2[1], 7, 0.55],
    [2600, 2750, 9, 0.18],
  ];
  const breath = c.createBufferSource();
  breath.buffer = noise(c);
  breath.loop = true;
  for (const [a, b, q, amp] of formants) {
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = q;
    f.frequency.setValueAtTime(a, t);
    f.frequency.linearRampToValueAtTime(b, t + 0.25);
    const g = c.createGain();
    g.gain.value = amp;
    osc.connect(f);
    f.connect(g);
    g.connect(env);
    const bg = c.createGain();
    bg.gain.value = amp * 0.22;
    breath.connect(f);
    f.connect(bg);
    bg.connect(env);
  }
  osc.start(t);
  lfo.start(t);
  breath.start(t, rnd(0, 1));
  osc.stop(t + dur + 0.05);
  lfo.stop(t + dur + 0.05);
  breath.stop(t + dur + 0.05);
}

/** A crowd cheering: lots of voices, men and women, starting a little apart. */
function cheer(c: BaseAudioContext, dest: AudioNode, t: number, voices: number, vol: number) {
  const each = vol / Math.sqrt(voices);
  for (let i = 0; i < voices; i++) {
    const low = Math.random() < 0.45;
    voice(
      c,
      dest,
      t + rnd(0, 0.5),
      low ? rnd(115, 170) : rnd(200, 330),
      rnd(0.7, 1.5),
      each * rnd(0.55, 1),
      rnd(-0.9, 0.9),
      Math.random() < 0.6 ? "woo" : "yay",
    );
  }
}

/** Somebody in the crowd whistling with delight. */
function whistle(c: BaseAudioContext, dest: AudioNode, t: number, vol: number, pan: number) {
  const out = bus(c, dest, vol, pan);
  const dur = rnd(0.5, 0.95);
  const f = rnd(2300, 2900);
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(f, t);
  o.frequency.exponentialRampToValueAtTime(f * 1.3, t + 0.22);
  o.frequency.linearRampToValueAtTime(f * 1.15, t + dur);
  const lfo = c.createOscillator();
  lfo.frequency.value = rnd(6, 8);
  const lg = c.createGain();
  lg.gain.value = f * 0.012;
  lfo.connect(lg);
  lg.connect(o.frequency);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(1, t + 0.06);
  g.gain.setValueAtTime(1, t + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(out);
  o.start(t);
  lfo.start(t);
  o.stop(t + dur + 0.05);
  lfo.stop(t + dur + 0.05);
}

/* ------------------------------------------------------------------ the whole celebration */

/**
 * Schedules every sound of the celebration on an audio context, starting at time `t0` (seconds).
 * The two party poppers fire at the same moment as the first confetti volley (the one from each bottom corner).
 */
export function scheduleCelebration(c: BaseAudioContext, dest: AudioNode, o: CelebrationAudioOptions, t0: number) {
  const at = (ms: number) => t0 + ms / 1000;
  const fire = o.volleys[0] ?? 0;

  // the applause: the real recording starts exactly when the poppers pop; the synthesised one is only a fallback
  const crowdClap = (fallbackMs: number, fallbackDur: number, fallbackVol: number) => {
    if (o.applause) playRecording(c, dest, at(fire), o.applause, APPLAUSE_VOLUME);
    else applause(c, dest, at(fallbackMs), fallbackDur, fallbackVol);
  };

  // two party poppers, one from each corner, in sync with the confetti
  partyPopper(c, dest, at(fire), 1, -0.7);
  partyPopper(c, dest, at(fire + 25), 1, 0.7);

  if (o.reduced) {
    crowdClap(500, 3.5, 0.9);
    cheer(c, dest, at(700), 8, 0.6);
    return;
  }

  // champagne bottles being opened
  champagne(c, dest, at(750), 0.8, -0.25);
  champagne(c, dest, at(2500), 0.75, 0.3);

  // the crowd: clapping, cheering and a few whistles
  crowdClap(350, 9, 1.0);
  cheer(c, dest, at(300), 18, 0.9);
  cheer(c, dest, at(1750), 14, 0.75);
  cheer(c, dest, at(3300), 22, 1.0);
  cheer(c, dest, at(5300), 12, 0.6);
  [1000, 2200, 2900, 4300].forEach((ms, i) => whistle(c, dest, at(ms), 0.1, i % 2 ? 0.55 : -0.55));
}
