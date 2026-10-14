/** Party poppers: confetti and streamers fired from both bottom corners of the screen. */

interface Options {
  colors: readonly string[];
  /** visitor prefers less motion: fewer pieces, single burst */
  reduced?: boolean;
  onDone?: () => void;
}

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
  shape: 0 | 1 | 2; // 0 = paper, 1 = dot, 2 = streamer
  life: number;
  age: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function firePoppers(canvas: HTMLCanvasElement, { colors, reduced = false, onDone }: Options): () => void {
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

  const s = Math.max(0.7, Math.min(1.5, Math.max(W, H) / 900)); // size of the screen -> strength of the shot
  const small = W < 600;
  const pieces: Piece[] = [];
  const flashes: { x: number; y: number; age: number }[] = [];

  const burst = (side: -1 | 1, count: number) => {
    const x = side === -1 ? W * 0.02 : W * 0.98;
    const y = H * 0.99;
    flashes.push({ x, y, age: 0 });
    for (let i = 0; i < count; i++) {
      // aim up and in towards the middle, with a fan of spread
      const ang = side === -1 ? -Math.PI / 2 + rand(0.1, 0.7) : -Math.PI / 2 - rand(0.1, 0.7);
      const v = rand(13, 31) * s;
      const shape = (Math.random() < 0.18 ? 2 : Math.random() < 0.3 ? 1 : 0) as 0 | 1 | 2;
      pieces.push({
        x,
        y,
        vx: Math.cos(ang) * v,
        vy: Math.sin(ang) * v,
        w: shape === 2 ? rand(3, 5) : rand(6, 12),
        h: shape === 2 ? rand(18, 34) : rand(5, 10),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.3, 0.3),
        wob: rand(0, Math.PI * 2),
        vw: rand(0.12, 0.35),
        color: colors[(Math.random() * colors.length) | 0],
        shape,
        life: rand(170, 300),
        age: 0,
      });
    }
  };

  const base = reduced ? 0.25 : small ? 0.7 : 1;
  const schedule = reduced ? [0] : [0, 260, 540];
  const counts = [64, 46, 34];
  let fired = 0;
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

    while (fired < schedule.length && elapsed >= schedule[fired]) {
      const n = Math.round(counts[fired] * base);
      burst(-1, n);
      burst(1, n);
      fired++;
    }

    ctx.clearRect(0, 0, W, H);

    // the "pop" flash at each cannon
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      f.age += dt;
      const p = f.age / 14;
      if (p >= 1) {
        flashes.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = (1 - p) * 0.85;
      ctx.strokeStyle = "#fff3bf";
      ctx.lineWidth = 6 * (1 - p) + 1;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 14 + p * 110 * s, 0, Math.PI * 2);
      ctx.stroke();
    }

    const g = 0.5 * s;
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      p.age += dt;
      if (p.age >= p.life || p.y > H + 60) {
        pieces.splice(i, 1);
        continue;
      }
      const drag = Math.pow(p.shape === 2 ? 0.972 : 0.984, dt);
      p.vx *= drag;
      p.vy = p.vy * drag + g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.wob += p.vw * dt;

      const fade = p.age > p.life * 0.72 ? 1 - (p.age - p.life * 0.72) / (p.life * 0.28) : 1;
      ctx.globalAlpha = Math.max(0, fade);
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.shape === 1) {
        ctx.beginPath();
        ctx.arc(0, 0, p.w * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.scale(1, Math.cos(p.wob)); // paper flipping over as it falls
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    if (fired >= schedule.length && pieces.length === 0 && flashes.length === 0) {
      finish();
      return;
    }
    if (elapsed > 9000) {
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
