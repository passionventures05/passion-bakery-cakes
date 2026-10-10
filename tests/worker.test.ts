import { afterEach, describe, expect, it, vi } from "vitest";
// @ts-ignore plain JS worker without types
import worker from "../cms-auth-worker/src/index.js";

const env = { GITHUB_CLIENT_ID: "cid", GITHUB_CLIENT_SECRET: "sec", ALLOWED_ORIGINS: "https://shop.example, https://other.example/" };
const call = (path: string, init?: RequestInit) => worker.fetch(new Request(`https://auth.example${path}`, init), env) as Promise<Response>;

afterEach(() => vi.restoreAllMocks());

describe("CMS auth worker", () => {
  it("/auth redirects to GitHub with state cookie and callback url", async () => {
    const res = await call("/auth?provider=github");
    expect(res.status).toBe(302);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.origin + loc.pathname).toBe("https://github.com/login/oauth/authorize");
    expect(loc.searchParams.get("client_id")).toBe("cid");
    expect(loc.searchParams.get("redirect_uri")).toBe("https://auth.example/callback");
    expect(loc.searchParams.get("scope")).toBe("repo,user");
    const state = loc.searchParams.get("state")!;
    expect(res.headers.get("set-cookie")).toContain(`decap_oauth_state=${state}`);
  });

  it("/callback rejects a wrong state", async () => {
    const res = await call("/callback?code=abc&state=bad", { headers: { cookie: "decap_oauth_state=good" } });
    expect(res.status).toBe(400);
    expect(await res.text()).toContain("authorization:github:error");
  });

  it("/callback exchanges the code and only posts the token to allowed origins", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ access_token: "tok123" }))));
    const res = await call("/callback?code=abc&state=s1", { headers: { cookie: "decap_oauth_state=s1" } });
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("authorization:github:success:");
    expect(html).toContain("tok123");
    expect(html).toContain('"https://shop.example","https://other.example"'); // trailing slash trimmed
    expect(html).toContain("allowed.indexOf(e.origin)");
  });

  it("/callback reports GitHub errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "bad_verification_code" }))));
    const res = await call("/callback?code=abc&state=s1", { headers: { cookie: "decap_oauth_state=s1" } });
    expect(res.status).toBe(400);
    expect(await res.text()).toContain("bad_verification_code");
  });
});
