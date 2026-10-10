// Tiny OAuth proxy that lets Decap CMS sign in with GitHub. Runs on Cloudflare Workers (free tier).
// Endpoints:  /auth  (starts the GitHub login)   /callback  (GitHub sends the user back here)
const GITHUB_AUTHORIZE = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN = "https://github.com/login/oauth/access_token";
const STATE_COOKIE = "decap_oauth_state";

export const allowedOrigins = (env) =>
  String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean);

// JSON that is safe to embed inside an inline <script>
const safe = (v) => JSON.stringify(v).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");

const readCookie = (request, name) => {
  const header = request.headers.get("cookie") || "";
  const hit = header.split(";").map((c) => c.trim()).find((c) => c.startsWith(name + "="));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : "";
};

/** Page that hands the result back to the CMS window (the format Decap expects). */
export function resultPage(status, payload, origins) {
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  const text = status === "success" ? "Signed in. You can close this window." : "Sign-in failed. You can close this window and try again.";
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>CMS sign-in</title></head><body><p>${text}</p><script>
(function () {
  var allowed = ${safe(origins)};
  var message = ${safe(message)};
  function receive(e) {
    if (allowed.indexOf(e.origin) === -1) return;
    window.opener.postMessage(message, e.origin);
    window.removeEventListener("message", receive, false);
  }
  window.addEventListener("message", receive, false);
  if (window.opener) window.opener.postMessage("authorizing:github", "*");
})();
</script></body></html>`;
  return new Response(html, {
    status: status === "success" ? 200 : 400,
    headers: {
      "content-type": "text/html;charset=UTF-8",
      "set-cookie": `${STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
      "cache-control": "no-store",
    },
  });
}

async function handleAuth(url, env) {
  if (!env.GITHUB_CLIENT_ID) return new Response("GITHUB_CLIENT_ID is not set", { status: 500 });
  const state = crypto.randomUUID();
  const authorize = new URL(GITHUB_AUTHORIZE);
  authorize.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authorize.searchParams.set("redirect_uri", `${url.origin}/callback`);
  authorize.searchParams.set("scope", env.GITHUB_SCOPE || "repo,user");
  authorize.searchParams.set("state", state);
  return new Response(null, {
    status: 302,
    headers: {
      location: authorize.toString(),
      "set-cookie": `${STATE_COOKIE}=${state}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
      "cache-control": "no-store",
    },
  });
}

async function handleCallback(url, request, env) {
  const origins = allowedOrigins(env);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || state !== readCookie(request, STATE_COOKIE)) {
    return resultPage("error", { message: "Sign-in expired or was tampered with. Please try again." }, origins);
  }
  try {
    const res = await fetch(GITHUB_TOKEN, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", "user-agent": "decap-cms-auth-worker" },
      body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code }),
    });
    const data = await res.json();
    if (!data.access_token) return resultPage("error", { message: data.error_description || data.error || "No token received" }, origins);
    return resultPage("success", { token: data.access_token, provider: "github" }, origins);
  } catch (e) {
    return resultPage("error", { message: "Could not reach GitHub" }, origins);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/auth") return handleAuth(url, env);
    if (url.pathname === "/callback") return handleCallback(url, request, env);
    return new Response("PasssionBakeryNChocos CMS sign-in service is running.", { status: 200 });
  },
};
