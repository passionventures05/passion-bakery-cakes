/**
 * RE-LAUNCH CEREMONY (curtains + ribbon + countdown + party poppers)
 * ------------------------------------------------------------------
 * To run it again for a new launch, change `launchAt` below (India time) and save.
 * A new date automatically counts as a brand-new ceremony, so it plays again.
 *
 * Quick tests without touching code (open the site on your laptop with these):
 *   /?studio                        -> shows a small box where you can type a date & time
 *   /?launch=2026-11-01T18:00       -> pretend the launch is at this IST date & time
 *   /?replay                        -> play the ceremony again right now
 *   /?ceremony=live                 -> preview what visitors on the live website see
 */
export const launch = {
  /** Switch the whole ceremony off by setting this to false. */
  enabled: true,

  /** Launch date & time in INDIA time (IST). Format: YYYY-MM-DDTHH:mm:ss+05:30 */
  launchAt: "2026-10-20T15:00:00+05:30",

  /** Words shown on the curtains. */
  title: "Grand Re-Launch",
  tagline: "Something sweet is about to begin",

  /** On YOUR laptop: the ribbon can be cut during the last N seconds of the countdown. */
  cutWindowSeconds: 30,

  /**
   * On the LIVE website the ribbon opens by itself, gracefully, after this many milliseconds
   * (the bow gives a little tug first). Visitors see it once per browser for each launch date.
   */
  autoOpenDelayMs: 2200,

  /**
   * false = live visitors always get the auto-opening ceremony (what you asked for).
   * true  = live visitors must wait for the real countdown to hit zero; then it opens by itself.
   */
  lockLiveSite: false,

  /** Colours. Gold is shared; only the curtain colours change per brand. */
  theme: {
    curtainDark: "#040920",
    curtainMid: "#0b1750",
    curtainSheen: "#2a3d9c",
    ink: "#0a1138", // text colour on the gold ribbon
    glow: "rgba(255, 215, 0, 0.6)",
    confetti: ["#d8b45a", "#f6e7b4", "#ffffff", "#fea3aa", "#5a6bd6", "#9fe8f0"] as readonly string[],
  },
} as const;

/* ------------------------------------------------------------------ helpers */

export const IST = "+05:30";

/**
 * Turns "2026-11-01T18:00", "2026-11-01 18:00", "2026-11-01" or a full ISO string into a timestamp.
 * Anything without a time zone is read as India time. Returns NaN if it can't be understood.
 */
export function parseLaunchTime(input: string): number {
  let v = String(input).trim().replace(/^(\d{4}-\d{2}-\d{2})[ T]/, "$1T");
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) v += "T00:00:00";
  v = v.replace(/(T\d{2}:\d{2}(?::\d{2})?)\s(\d{2}:?\d{2})$/, "$1+$2"); // a "+" turned into a space by a URL
  v = v.replace(/(T\d{2}:\d{2}(?::\d{2})?[+-]\d{2})(\d{2})$/, "$1:$2");
  if (!/(Z|[+-]\d{2}:\d{2})$/i.test(v)) v += IST;
  return Date.parse(v);
}

export interface ResolvedLaunch {
  launchAt: number;
  replay: boolean;
  studio: boolean;
  /** "auto" = opens by itself (live site), "manual" = someone taps the ribbon, null = decide from the host */
  ceremony: "auto" | "manual" | null;
}

/** Reads the config plus any ?launch= / ?replay / ?studio / ?ceremony= in the address bar. */
export function resolveLaunch(search: string): ResolvedLaunch {
  const p = new URLSearchParams(search);
  const override = p.get("launch");
  let launchAt = override ? parseLaunchTime(override) : NaN;
  if (Number.isNaN(launchAt)) launchAt = parseLaunchTime(launch.launchAt);
  const c = p.get("ceremony");
  return {
    launchAt,
    replay: p.has("replay"),
    studio: p.has("studio"),
    ceremony: c === "live" ? "auto" : c === "local" ? "manual" : null,
  };
}

export const doneKey = (launchAt: number) => `lc-done:${launchAt}`;

/** True when the page is running on your own computer (not the published website). */
export function isLocalHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "" ||
    h === "localhost" ||
    h === "0.0.0.0" ||
    h === "[::1]" ||
    h.endsWith(".local") ||
    /^127\./.test(h) ||
    /^10\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h)
  );
}

/** "Sunday 1 November 2026 at 6:00 PM IST", always in India time. */
export function formatLaunchLabel(ms: number): string {
  const d = new Date(ms);
  const date = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
  const time = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(d)
    .toUpperCase();
  return `${date} at ${time} IST`;
}

/** Timestamp -> "YYYY-MM-DDTHH:mm:ss" on the India clock (what a date-time field wants). */
export const toIstInput = (ms: number) => new Date(ms + 330 * 60000).toISOString().slice(0, 19);

/**
 * Tiny script that runs before the page paints, so a returning visitor never sees a flash of curtains
 * and a first-time visitor never sees the site before the curtains. Mirrors the logic above in plain ES5.
 */
export function bootScript(): string {
  const cfg = JSON.stringify({ e: launch.enabled, at: launch.launchAt });
  return (
    "(function(){var d=document.documentElement;try{var c=" +
    cfg +
    ";if(!c.e){d.setAttribute('data-launch','done');return}" +
    "function P(v){v=String(v).replace(/^\\s+|\\s+$/g,'').replace(/^(\\d{4}-\\d{2}-\\d{2})[ T]/,'$1T');" +
    "if(/^\\d{4}-\\d{2}-\\d{2}$/.test(v))v+='T00:00:00';" +
    "v=v.replace(/(T\\d{2}:\\d{2}(?::\\d{2})?)\\s(\\d{2}:?\\d{2})$/,'$1+$2');" +
    "v=v.replace(/(T\\d{2}:\\d{2}(?::\\d{2})?[+-]\\d{2})(\\d{2})$/,'$1:$2');" +
    "if(!/(Z|[+-]\\d{2}:\\d{2})$/i.test(v))v+='" +
    IST +
    "';return Date.parse(v)}" +
    "var q=location.search,m=/[?&]launch=([^&]*)/.exec(q),t=NaN;" +
    "if(m)t=P(decodeURIComponent(m[1].replace(/\\+/g,' ')));if(t!==t)t=P(c.at);" +
    "var r=/[?&]replay(=|&|$)/.test(q),done=false;" +
    "try{done=!!localStorage.getItem('lc-done:'+t)}catch(e){}" +
    "d.setAttribute('data-launch',(t!==t||(done&&!r))?'done':'pending')}catch(e){d.setAttribute('data-launch','done')}})()"
  );
}
