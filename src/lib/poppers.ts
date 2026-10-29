/**
 * Grand celebration, played when the curtains open:
 *   - party-popper cannons in both bottom corners (glitter confetti, stars, curly streamers, shockwave + flash)
 *   - a confetti shower from the top of the screen
 *   - fireworks bursting in the upper half
 *   - glossy balloons floating up from the bottom of the screen
 * Everything is drawn on one full-screen canvas.
 */

interface Options {
  /** confetti / streamer colours */
  colors: readonly string[];
  /** balloon colours (falls back to `colors`) */
  balloonColors?: readonly string[];
  /** visitor prefers less motion: a single small burst, no fireworks, no balloons */
  reduced?: boolean;
  onDone?: () => void;
}

type Shape = 0 | 1 | 2 | 3; // 0 = paper, 1 = dot, 2 = streamer, 3 = star

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vr: number;
  wob: number;
  vw: number;
  color: string;
  shape: Shape;
  glitter: boolean;
  tv: number; // terminal fall speed (paper floats down, it doesn't drop)
  life: number;
  age: number;
  trail?: { x: number; y: number }[];
}

interface Spark {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  age: number;
}

interface Balloon {
  baseX: number;
  x: number;
  y: number;
  r: number;
  vy: number;
  amp: number;
  phase: number;
  age: number;
  spawnAt: number;
  light: string;
  mid: string;
  dark: string;
  started: boolean;
}

interface Flash {
  x: number;
  y: number;
  age: number;
  max: number;
  size: number;
  color: string;
  ring: boolean;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

/** Mixes a #rrggbb colour towards white (amt > 0) or black (amt < 0). */
function shade(hex: string, amt: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const t = amt < 0 ? 0 : 255;
  const k = Math.abs(amt);
  const c = (v: number) => Math.round(v + (t - v) * k);
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

/** Rough brightness of a #rrggbb colour, 0 (black) to 1 (white). */
function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 0.5;
  const n = parseInt(m[1], 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

function starPath(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const px = Math.cos(a) * rad;
    const py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function firePoppers(canvas: HTMLCanvasElement, { colors, balloonColors, reduced = false, onDone }: Options): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    onDone?.();
    return () => {};
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0;
  let H = 0;
  const resize = () => {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  const s = clamp(Math.max(W, H) / 900, 0.7, 1.5); // size of the screen -> strength of the shot
  const small = W < 600;
  const pieces: Piece[] = [];
  const sparks: Spark[] = [];
  const flashes: Flash[] = [];
  const balloons: Balloon[] = [];
  const palette = colors.length ? colors : ["#ffd23f", "#ff3d6e", "#ffffff"];
  const bpalette = balloonColors && balloonColors.length ? balloonColors : palette;
  const pick = (arr: readonly string[]) => arr[(Math.random() * arr.length) | 0];

  /* ------------------------------------------------------------- confetti */
  const makePiece = (x: number, y: number, vx: number, vy: number, life: number, tv: number): Piece => {
    const roll = Math.random();
    const shape: Shape = roll < 0.09 ? 2 : roll < 0.25 ? 3 : roll < 0.42 ? 1 : 0;
    const k = shape === 2 ? 0.55 : 1; // streamers are lighter, so they don't shoot as far
    return {
      x,
      y,
      vx: vx * k,
      vy: vy * k,
      w: shape === 2 ? rand(3, 4.5) : shape === 3 ? rand(6, 10) : rand(7, 13),
      h: shape === 2 ? 0 : rand(5, 11),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.3, 0.3),
      wob: rand(0, Math.PI * 2),
      vw: rand(0.12, 0.38),
      color: pick(palette),
      shape,
      glitter: Math.random() < 0.55,
      tv,
      life,
      age: 0,
      trail: shape === 2 ? [] : undefined,
    };
  };

  /** One party-popper shot from a bottom corner. */
  const burst = (side: -1 | 1, count: number) => {
    const x = side === -1 ? W * 0.015 : W * 0.985;
    const y = H * 0.995;
    flashes.push({ x, y, age: 0, max: 16, size: 170 * s, color: "#fff3bf", ring: true });
    flashes.push({ x, y, age: 0, max: 26, size: 95 * s, color: "#ffffff", ring: false });
    for (let i = 0; i < count; i++) {
      // aim up and in towards the middle, with a wide fan
      const ang = side === -1 ? -Math.PI / 2 + rand(0.05, 0.85) : -Math.PI / 2 - rand(0.05, 0.85);
      const v = rand(15, 36) * s;
      pieces.push(makePiece(x, y, Math.cos(ang) * v, Math.sin(ang) * v, rand(230, 380), rand(3.4, 6.2) * s));
    }
  };

  /** Confetti drifting down from above. */
  const shower = (n: number) => {
    for (let i = 0; i < n; i++) {
      const p = makePiece(rand(-20, W + 20), rand(-40, -8), rand(-1.4, 1.4), rand(1, 4) * s, 900, rand(2.2, 4.2) * s);
      if (p.shape === 2) p.shape = 0; // streamers only come out of the cannons
      p.trail = undefined;
      pieces.push(p);
    }
  };

  /* ------------------------------------------------------------ fireworks */
  const vivid = palette.filter((c) => luminance(c) < 0.75);
  const fwColors = vivid.length ? vivid : palette;
  const firework = () => {
    const x = rand(W * 0.14, W * 0.86);
    const y = rand(H * 0.12, H * 0.46);
    const c1 = pick(fwColors);
    const c2 = pick(fwColors);
    const ring = Math.random() < 0.4;
    const n = Math.round((small ? 46 : 78) * (ring ? 0.8 : 1));
    flashes.push({ x, y, age: 0, max: 14, size: 150 * s, color: c1, ring: false });
    for (let i = 0; i < n; i++) {
      const a = ring ? (i / n) * Math.PI * 2 : rand(0, Math.PI * 2);
      const v = ring ? 6.2 * s : rand(1.5, 8.5) * s;
      sparks.push({
        x,
        y,
        px: x,
        py: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        color: i % 3 === 0 ? c2 : c1,
        size: rand(1.8, 3.4),
        life: rand(55, 95),
        age: 0,
      });
    }
  };

  /* -------------------------------------------------------------- balloons */
  const bsc = clamp(W / 1000, 0.8, 1.25);
  const makeBalloon = (spawnAt: number): Balloon => {
    const color = pick(bpalette);
    const r = rand(27, 45) * bsc;
    const baseX = rand(W * 0.03, W * 0.97);
    return {
      baseX,
      x: baseX,
      y: H + r * 3,
      r,
      vy: rand(2.0, 3.5) * clamp(H / 900, 0.7, 1.4),
      amp: rand(10, 30),
      phase: rand(0, Math.PI * 2),
      age: 0,
      spawnAt,
      light: shade(color, 0.62),
      mid: color,
      dark: shade(color, -0.38),
      started: false,
    };
  };

  const drawBalloon = (b: Balloon) => {
    const r = b.r;
    const h = r * 1.22;
    const sway = Math.sin(b.age * 0.045 + b.phase);
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(Math.cos(b.age * 0.045 + b.phase) * 0.1);

    // string
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, h + 7);
    const len = r * 2.6;
    for (let k = 1; k <= 8; k++) {
      ctx.lineTo(Math.sin(b.age * 0.07 + b.phase + k * 0.9) * 6 * (k / 8) + sway * 3 * (k / 8), h + 7 + (len * k) / 8);
    }
    ctx.stroke();

    // knot
    ctx.fillStyle = b.dark;
    ctx.beginPath();
    ctx.moveTo(0, h - 1);
    ctx.lineTo(-r * 0.14, h + r * 0.2);
    ctx.lineTo(r * 0.14, h + r * 0.2);
    ctx.closePath();
    ctx.fill();

    // body
    const g = ctx.createRadialGradient(-r * 0.35, -h * 0.38, r * 0.08, 0, 0, h * 1.12);
    g.addColorStop(0, b.light);
    g.addColorStop(0.5, b.mid);
    g.addColorStop(1, b.dark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.bezierCurveTo(r * 1.3, -h, r * 1.12, h * 0.72, 0, h);
    ctx.bezierCurveTo(-r * 1.12, h * 0.72, -r * 1.3, -h, 0, -h);
    ctx.fill();

    // glossy highlights
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.ellipse(-r * 0.42, -h * 0.5, r * 0.17, h * 0.3, -0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc(-r * 0.1, -h * 0.82, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  /* -------------------------------------------------------------- timeline */
  const base = reduced ? 0.25 : small ? 0.72 : 1;
  const volleys = reduced ? [0] : [0, 190, 430, 720, 1080];
  const counts = [78, 60, 50, 42, 36];
  const fwTimes = reduced ? [] : [650, 1050, 1450, 1900, 2400, 2950, 3500];
  const balloonCount = reduced ? 0 : small ? 16 : 30;
  const showerFrom = 450;
  const showerTo = reduced ? 0 : 4600;
  let fired = 0;
  let fwFired = 0;
  let showerAcc = 0;
  for (let i = 0; i < balloonCount; i++) balloons.push(makeBalloon(200 + (i / balloonCount) * 3400 + rand(-80, 80)));

  const t0 = performance.now();
  let last = t0;
  let raf = 0;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    ctx.clearRect(0, 0, W, H);
    onDone?.();
  };

  const frame = (now: number) => {
    const dt = Math.min(2.5, (now - last) / 16.667);
    last = now;
    const elapsed = now - t0;

    while (fired < volleys.length && elapsed >= volleys[fired]) {
      const n = Math.round(counts[fired] * base);
      burst(-1, n);
      burst(1, n);
      fired++;
    }
    while (fwFired < fwTimes.length && elapsed >= fwTimes[fwFired]) {
      firework();
      fwFired++;
    }
    if (elapsed >= showerFrom && elapsed <= showerTo) {
      showerAcc += (small ? 1.5 : 2.4) * dt;
      const n = Math.floor(showerAcc);
      showerAcc -= n;
      if (n > 0) shower(n);
    }

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";

    /* balloons (behind the confetti) */
    for (let i = balloons.length - 1; i >= 0; i--) {
      const b = balloons[i];
      if (!b.started) {
        if (elapsed < b.spawnAt) continue;
        b.started = true;
      }
      b.age += dt;
      b.y -= b.vy * dt;
      b.x = b.baseX + Math.sin(b.age * 0.03 + b.phase) * b.amp;
      if (b.y < -b.r * 5) {
        balloons.splice(i, 1);
        continue;
      }
      drawBalloon(b);
    }

    /* confetti, streamers, stars */
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      p.age += dt;
      if (p.age >= p.life || p.y > H + 60) {
        pieces.splice(i, 1);
        continue;
      }
      const drag = Math.pow(p.shape === 2 ? 0.975 : 0.984, dt);
      p.vx *= drag;
      p.vy = p.vy * drag + 0.5 * s * dt;
      if (p.vy > p.tv) p.vy += (p.tv - p.vy) * Math.min(1, 0.12 * dt); // settle to a floating fall
      p.wob += p.vw * dt;
      p.x += (p.vx + Math.sin(p.wob) * 0.55) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;

      const fade = p.age > p.life * 0.74 ? 1 - (p.age - p.life * 0.74) / (p.life * 0.26) : 1;
      ctx.globalAlpha = Math.max(0, fade);

      if (p.shape === 2 && p.trail) {
        p.trail.push({ x: p.x + Math.sin(p.wob * 1.3) * 3, y: p.y });
        if (p.trail.length > 11) p.trail.shift();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.w;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        p.trail.forEach((pt, k) => (k === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
        ctx.stroke();
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      const flip = Math.cos(p.wob);
      ctx.fillStyle = p.glitter && Math.abs(flip) > 0.9 ? "#ffffff" : p.color; // glitter: catches the light as it turns
      if (p.shape === 1) {
        ctx.beginPath();
        ctx.arc(0, 0, p.w * 0.42, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 3) {
        ctx.scale(1, 0.35 + Math.abs(flip) * 0.65);
        starPath(ctx, p.w);
        ctx.fill();
      } else {
        ctx.scale(1, flip); // paper flipping over as it falls
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    /* fireworks + flashes glow on top of everything */
    ctx.globalCompositeOperation = "lighter";
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      f.age += dt;
      const p = f.age / f.max;
      if (p >= 1) {
        flashes.splice(i, 1);
        continue;
      }
      const rad = f.size * (0.25 + p * 0.75);
      if (f.ring) {
        ctx.globalAlpha = (1 - p) * 0.9;
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 7 * (1 - p) + 1;
        ctx.beginPath();
        ctx.arc(f.x, f.y, rad, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, rad);
        g.addColorStop(0, f.color);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.globalAlpha = (1 - p) * 0.75;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(f.x, f.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.lineCap = "round";
    for (let i = sparks.length - 1; i >= 0; i--) {
      const k = sparks[i];
      k.age += dt;
      if (k.age >= k.life) {
        sparks.splice(i, 1);
        continue;
      }
      k.px = k.x;
      k.py = k.y;
      const drag = Math.pow(0.962, dt);
      k.vx *= drag;
      k.vy = k.vy * drag + 0.07 * s * dt;
      k.x += k.vx * dt;
      k.y += k.vy * dt;
      const left = 1 - k.age / k.life;
      ctx.globalAlpha = Math.min(1, left * 1.6);
      ctx.strokeStyle = k.color;
      ctx.lineWidth = k.size * (0.4 + left * 0.6);
      ctx.beginPath();
      ctx.moveTo(k.px, k.py);
      ctx.lineTo(k.x, k.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    const idle =
      fired >= volleys.length &&
      fwFired >= fwTimes.length &&
      elapsed > showerTo &&
      pieces.length === 0 &&
      sparks.length === 0 &&
      flashes.length === 0 &&
      balloons.length === 0;
    if (idle || elapsed > 15000) {
      finish();
      return;
    }
    raf = requestAnimationFrame(frame);
  };

  raf = requestAnimationFrame(frame);

  return () => {
    finished = true;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
  };
}
