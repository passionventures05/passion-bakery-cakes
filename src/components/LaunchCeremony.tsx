"use client";

import { Capacitor } from "@capacitor/core";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { doneKey, formatLaunchLabel, isLocalHost, launch, resolveLaunch, toIstInput } from "@/lib/launch";
import { firePoppers } from "@/lib/poppers";
import { site } from "@/lib/site";

/** Keep these in step with --lc-cut-ms / --lc-open-ms / --lc-fade-ms in launch.css */
const TIMING = { cut: 1150, open: 2700, fade: 900 };
const TIMING_REDUCED = { cut: 350, open: 900, fade: 400 };

type Phase = "locked" | "cutting" | "opening" | "open" | "gone";

const pad = (n: number) => String(n).padStart(2, "0");
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** While the curtains are closed nothing behind them can be tabbed to or clicked. */
function lockPage(on: boolean) {
  for (const el of Array.from(document.body.children)) {
    if (el.hasAttribute("data-lc") || el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
    if (on) el.setAttribute("inert", "");
    else el.removeAttribute("inert");
  }
}


/* ---- stage valance: a gold-edged heading with draped swags and tassels ---- */
const SW = { tile: 200, count: 8, top: 28, y0: 36, c1: 148, w: 1600, h: 132 };
const bez = (u: number, a: number, b: number, c: number, d: number) =>
  (1 - u) ** 3 * a + 3 * (1 - u) ** 2 * u * b + 3 * (1 - u) * u ** 2 * c + u ** 3 * d;
const f1 = (n: number) => n.toFixed(1);

function Swag({ i }: { i: number }) {
  const t = SW.tile;
  const edge = `M0 ${SW.y0} C${t * 0.17} ${SW.c1} ${t * 0.83} ${SW.c1} ${t} ${SW.y0}`;
  const folds = [0.14, 0.27, 0.4, 0.5, 0.6, 0.73, 0.86].map((u) => {
    const bx = bez(u, 0, t * 0.17, t * 0.83, t);
    const by = bez(u, SW.y0, SW.c1, SW.c1, SW.y0);
    const sx = u < 0.5 ? 5 : t - 5;
    return `M${f1(sx)} ${SW.top + 6} Q${f1((sx + bx) / 2 + (u < 0.5 ? -4 : 4))} ${f1(by * 0.72)} ${f1(bx)} ${f1(by)}`;
  });
  return (
    <g transform={`translate(${i * t} 0)`}>
      <path className="lc-sw-body" d={`M0 ${SW.top} H${t} V${SW.y0} C${t * 0.83} ${SW.c1} ${t * 0.17} ${SW.c1} 0 ${SW.y0} Z`} />
      <path className="lc-sw-hi" d={`M0 ${SW.top} H${t} V${SW.y0 + 14} C${t * 0.8} ${SW.y0 + 60} ${t * 0.2} ${SW.y0 + 60} 0 ${SW.y0 + 14} Z`} />
      {folds.map((d, k) => (
        <g key={k}>
          <path className="lc-sw-fd" d={d} />
          <path className="lc-sw-fl" d={d} transform="translate(2.6 0)" />
        </g>
      ))}
      {/* gold bullion fringe along the swag's lower edge */}
      <path className="lc-sw-fringe" d={edge} transform="translate(0 6)" />
      <path className="lc-sw-edge" d={edge} />
    </g>
  );
}

function Tassel({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path d="M0 40 V62" stroke="#b8923c" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="0" cy="62" rx="5.2" ry="6.6" fill="url(#lcSg)" stroke="#6b4e18" strokeWidth="0.9" />
      <path d="M-7 69 L7 69 L12 106 Q0 111 -12 106 Z" fill="url(#lcSg)" stroke="#6b4e18" strokeWidth="0.9" strokeLinejoin="round" />
      <path d="M-4.6 72 L-7.4 107 M0 72 V109 M4.6 72 L7.4 107" stroke="#6b4e18" strokeOpacity="0.55" strokeWidth="1" />
      <circle cx="0" cy="38" r="8.5" fill="url(#lcSg)" stroke="#6b4e18" strokeWidth="1" />
      <circle cx="0" cy="38" r="3.4" fill="#f6e7b4" stroke="#6b4e18" strokeWidth="0.7" />
    </g>
  );
}

function Valance() {
  return (
    <div className="lc-valance" aria-hidden="true">
      <svg viewBox={`0 0 ${SW.w} ${SW.h}`} width="100%" focusable="false">
        <defs>
          <linearGradient id="lcSb" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--lc-c1)" }} />
            <stop offset="0.55" style={{ stopColor: "var(--lc-c2)" }} />
            <stop offset="1" style={{ stopColor: "var(--lc-c1)" }} />
          </linearGradient>
          <linearGradient id="lcSh" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--lc-c3)", stopOpacity: 0.55 }} />
            <stop offset="1" style={{ stopColor: "var(--lc-c3)", stopOpacity: 0 }} />
          </linearGradient>
          <linearGradient id="lcSg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f6e7b4" />
            <stop offset="0.45" stopColor="#d3ad55" />
            <stop offset="1" stopColor="#7a5a1c" />
          </linearGradient>
          <pattern id="lcSp" width="26" height="4" patternUnits="userSpaceOnUse">
            <rect width="26" height="4" fill="none" />
            <rect x="0" width="8" height="4" fill="#000" fillOpacity="0.28" />
            <rect x="13" width="5" height="4" fill="#fff" fillOpacity="0.07" />
          </pattern>
          <linearGradient id="lcSt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--lc-c2)" }} />
            <stop offset="1" style={{ stopColor: "var(--lc-c1)" }} />
          </linearGradient>
        </defs>
        {/* heading board */}
        <rect x="0" y="0" width={SW.w} height={SW.top} fill="url(#lcSt)" />
        <rect x="0" y="0" width={SW.w} height={SW.top} fill="url(#lcSp)" />
        <rect x="0" y={SW.top - 1} width={SW.w} height="6" fill="url(#lcSg)" />
        {Array.from({ length: SW.count }, (_, i) => (
          <Swag key={i} i={i} />
        ))}
        {Array.from({ length: SW.count + 1 }, (_, i) => (
          <Tassel key={i} x={i * SW.tile} />
        ))}
      </svg>
    </div>
  );
}

function Bow() {
  return (
    <svg className="lc-bow-svg" viewBox="0 0 300 220" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="lcG1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbf0cc" />
          <stop offset="0.28" stopColor="#e6c777" />
          <stop offset="0.62" stopColor="#b8923c" />
          <stop offset="1" stopColor="#f2dfa6" />
        </linearGradient>
        <linearGradient id="lcG2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a98230" />
          <stop offset="0.5" stopColor="#dcbb68" />
          <stop offset="1" stopColor="#6b4e18" />
        </linearGradient>
        <linearGradient id="lcG3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6e7b4" />
          <stop offset="0.5" stopColor="#d3ad55" />
          <stop offset="1" stopColor="#8f6a22" />
        </linearGradient>
        <radialGradient id="lcG4" cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff7de" />
          <stop offset="0.45" stopColor="#e2c066" />
          <stop offset="1" stopColor="#7a5a1c" />
        </radialGradient>
      </defs>

      {/* tails */}
      <path d="M138 104 L164 108 L136 211 L127 192 L108 201 Z" fill="url(#lcG3)" stroke="#6b4e18" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M162 104 L136 108 L164 211 L173 192 L192 201 Z" fill="url(#lcG1)" stroke="#6b4e18" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M128 150 L140 112" stroke="#fbf0cc" strokeOpacity="0.7" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M172 150 L160 112" stroke="#fbf0cc" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" fill="none" />

      {/* loops (the butterfly wings) */}
      <path d="M140 100 C110 40 40 20 18 55 C0 85 20 135 60 140 C95 145 125 118 140 100 Z" fill="url(#lcG1)" stroke="#6b4e18" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M160 100 C190 40 260 20 282 55 C300 85 280 135 240 140 C205 145 175 118 160 100 Z" fill="url(#lcG1)" stroke="#6b4e18" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M138 100 C115 62 70 50 48 70 C36 86 50 118 76 122 C102 126 124 112 138 100 Z" fill="url(#lcG2)" opacity="0.9" />
      <path d="M162 100 C185 62 230 50 252 70 C264 86 250 118 224 122 C198 126 176 112 162 100 Z" fill="url(#lcG2)" opacity="0.9" />
      {/* satin sheen */}
      <path d="M126 92 C104 54 62 36 34 56" stroke="#fff7de" strokeOpacity="0.75" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M174 92 C196 54 238 36 266 56" stroke="#fff7de" strokeOpacity="0.75" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M60 134 C90 138 116 122 134 104" stroke="#6b4e18" strokeOpacity="0.35" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M240 134 C210 138 184 122 166 104" stroke="#6b4e18" strokeOpacity="0.35" strokeWidth="1.6" strokeLinecap="round" fill="none" />

      {/* knot */}
      <path d="M132 88 Q150 81 168 88 Q175 100 168 114 Q150 121 132 114 Q125 100 132 88 Z" fill="url(#lcG4)" stroke="#6b4e18" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M137 93 Q150 88 163 93" stroke="#fff7de" strokeOpacity="0.8" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function LaunchCeremony() {
  const [phase, setPhase] = useState<Phase>("locked");
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [secs, setSecs] = useState<number | null>(null);
  const [label, setLabel] = useState("");
  const [tug, setTug] = useState(false);
  const [poppers, setPoppers] = useState(false);
  const [studio, setStudio] = useState(false);
  const [studioValue, setStudioValue] = useState("");

  const phaseRef = useRef<Phase>("locked");
  const launchAtRef = useRef(0);
  const clockOffset = useRef(0); // visitor's clock vs the website server's clock
  const firstSecs = useRef<number | null>(null);
  const tickRef = useRef<number | undefined>(undefined);
  const timers = useRef<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const go = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  /* ---- decide whether the ceremony applies, start the live countdown ---- */
  useEffect(() => {
    const root = document.documentElement;
    const r = resolveLaunch(window.location.search);

    let seen = false;
    try {
      seen = !!localStorage.getItem(doneKey(r.launchAt));
    } catch {
      /* private mode: just play it */
    }
    if (!launch.enabled || Number.isNaN(r.launchAt) || (seen && !r.replay)) {
      root.setAttribute("data-launch", "done");
      go("gone");
      return;
    }

    launchAtRef.current = r.launchAt;
    const m = r.ceremony ?? (Capacitor.isNativePlatform() || !isLocalHost(window.location.hostname) ? "auto" : "manual");
    setMode(m);
    setStudio(r.studio && m === "manual");
    setStudioValue(toIstInput(r.launchAt));
    setLabel(formatLaunchLabel(r.launchAt));
    root.setAttribute("data-launch", "pending");
    lockPage(true);

    const tick = () => {
      const s = Math.max(0, Math.ceil((launchAtRef.current - (Date.now() + clockOffset.current)) / 1000));
      setSecs((prev) => (prev === s ? prev : s));
    };
    tick();
    tickRef.current = window.setInterval(tick, 250);

    // A visitor's own clock can be wrong. Ask the website's server what time it is and follow that instead.
    (async () => {
      try {
        const t0 = Date.now();
        const res = await fetch(window.location.pathname, { method: "HEAD", cache: "no-store" });
        const header = res.headers.get("date");
        const t1 = Date.now();
        const server = header ? Date.parse(header) : NaN;
        if (!Number.isNaN(server)) {
          const off = server + 500 + (t1 - t0) / 2 - t1; // the Date header is rounded down to the second
          if (Math.abs(off) > 2000) {
            clockOffset.current = off;
            tick();
          }
        }
      } catch {
        /* offline or blocked: keep the visitor's own clock */
      }
    })();

    return () => {
      window.clearInterval(tickRef.current);
      lockPage(false);
    };
  }, []);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  /* ---- the cut: ribbon parts -> curtains draw open -> poppers ---- */
  const startCut = useCallback(() => {
    if (phaseRef.current !== "locked") return;
    const t = reducedMotion() ? TIMING_REDUCED : TIMING;
    try {
      localStorage.setItem(doneKey(launchAtRef.current), "1");
    } catch {
      /* ignore */
    }
    window.clearInterval(tickRef.current);
    setTug(false);
    go("cutting");
    const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
    later(() => go("opening"), t.cut);
    later(() => {
      go("open");
      lockPage(false);
      document.documentElement.setAttribute("data-launch", "done");
      setPoppers(true);
    }, t.cut + t.open);
    later(() => go("gone"), t.cut + t.open + t.fade);
  }, []);

  const ready = mode === "manual" && phase === "locked" && secs !== null && secs <= launch.cutWindowSeconds;

  useEffect(() => {
    if (secs !== null && firstSecs.current === null) firstSecs.current = secs;
  }, [secs]);

  /* live website, "no waiting" version: a little tug on the bow, then it opens by itself */
  useEffect(() => {
    if (mode !== "auto" || launch.lockLiveSite || phase !== "locked" || secs === null) return;
    setTug(true);
    const t = window.setTimeout(startCut, launch.autoOpenDelayMs);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, phase, secs === null, startCut]);

  /* live website, locked version: wait for the real launch time, tug just before, then open on its own */
  useEffect(() => {
    if (mode !== "auto" || !launch.lockLiveSite || phase !== "locked" || secs === null) return;
    const late = firstSecs.current === 0; // the visitor arrived after the launch time
    if (secs === 0) {
      if (!late) {
        startCut();
        return;
      }
      setTug(true);
      const t = window.setTimeout(startCut, launch.autoOpenDelayMs);
      return () => window.clearTimeout(t);
    }
    setTug(secs <= Math.ceil(launch.autoOpenDelayMs / 1000));
  }, [mode, phase, secs, startCut]);

  useEffect(() => {
    if (!poppers || !canvasRef.current) return;
    return firePoppers(canvasRef.current, {
      colors: launch.theme.confetti,
      reduced: reducedMotion(),
      onDone: () => setPoppers(false),
    });
  }, [poppers]);

  const cut = () => {
    if (ready) startCut();
  };

  const rehearse = (at: string) => {
    window.location.href = `${window.location.pathname}?launch=${encodeURIComponent(at)}&replay=1&studio=1`;
  };

  const d = secs === null ? null : Math.floor(secs / 86400);
  const h = secs === null ? null : Math.floor((secs % 86400) / 3600);
  const m = secs === null ? null : Math.floor((secs % 3600) / 60);
  const s = secs === null ? null : secs % 60;
  const show = (n: number | null) => (n === null ? "--" : pad(n));

  const th = launch.theme;
  const vars = {
    "--lc-c1": th.curtainDark,
    "--lc-c2": th.curtainMid,
    "--lc-c3": th.curtainSheen,
    "--lc-ink": th.ink,
    "--lc-glow": th.glow,
  } as CSSProperties;

  const units = (items: [string, number | null][]) =>
    items.map(([name, value]) => (
      <span className="lc-unit" key={name}>
        <span className="lc-num">{show(value)}</span>
        <span className="lc-lab">{name}</span>
      </span>
    ));

  return (
    <>
      {phase !== "gone" && (
        <div
          className="lc"
          data-lc=""
          data-phase={phase}
          data-mode={mode}
          data-ready={ready ? "1" : "0"}
          data-tug={tug ? "1" : "0"}
          style={vars}
          role="dialog"
          aria-modal="true"
          aria-label={`${site.name} ${launch.title}`}
        >
          <div className="lc-curtain lc-curtain--l">
            <div className="lc-drape">
              <div className="lc-silk" />
              <div className="lc-hem" />
            </div>
            <div className="lc-ribbon lc-ribbon--l" onClick={cut}>
              <div className="lc-units" role="timer" aria-label="Time left until the launch">
                {units([
                  ["days", d],
                  ["hours", h],
                ])}
              </div>
            </div>
          </div>
          <div className="lc-curtain lc-curtain--r">
            <div className="lc-drape">
              <div className="lc-silk" />
              <div className="lc-hem" />
            </div>
            <div className="lc-ribbon lc-ribbon--r" onClick={cut}>
              <div className="lc-units">
                {units([
                  ["minutes", m],
                  ["seconds", s],
                ])}
              </div>
            </div>
          </div>

          <Valance />

          <div className="lc-bow">
            <button
              type="button"
              className="lc-bow-btn"
              onClick={cut}
              disabled={!ready}
              aria-label="Cut the ribbon to open the website"
            >
              <span className="lc-bow-art">
                <Bow />
              </span>
            </button>
            <span className="lc-sparks" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => (
                <i key={i} style={{ "--a": `${i * 30}deg`, "--d": `${0.5 + (i % 3) * 0.12}` } as CSSProperties} />
              ))}
            </span>
          </div>

          <div className="lc-ui lc-ui--top">
            <p className="lc-brand">{site.name}</p>
            <h1 className="lc-title">{launch.title}</h1>
            <span className="lc-orn" aria-hidden="true" />
            <p className="lc-tagline">{launch.tagline}</p>
          </div>

          <div className="lc-ui lc-ui--bottom">
            <p className="lc-when">{label}</p>
            <p className="lc-hint" aria-live="polite">
              {mode === "auto" && (!launch.lockLiveSite || secs === 0 || phase !== "locked")
                ? "Opening the doors\u2026"
                : ready
                  ? "Tap the ribbon to cut it"
                  : mode === "auto"
                    ? "Counting down to our grand re-launch"
                    : "Counting down to the ribbon cutting"}
            </p>
          </div>

          {studio && (
            <form
              className="lc-studio lc-ui"
              onSubmit={(e) => {
                e.preventDefault();
                if (studioValue) rehearse(studioValue);
              }}
            >
              <label htmlFor="lc-studio-at">Launch date &amp; time (India)</label>
              <input id="lc-studio-at" type="datetime-local" step={1} value={studioValue} onChange={(e) => setStudioValue(e.target.value)} />
              <div className="lc-studio-row">
                <button type="submit">Preview</button>
                <button type="button" onClick={() => rehearse(toIstInput(Date.now() + 45_000))}>
                  Cut in 45 sec
                </button>
                <button type="button" onClick={() => rehearse(toIstInput(Date.now() + 5 * 60_000))}>
                  In 5 min
                </button>
              </div>
            </form>
          )}
        </div>
      )}
      {poppers && <canvas ref={canvasRef} className="lc-confetti" aria-hidden="true" data-lc="" />}
    </>
  );
}
