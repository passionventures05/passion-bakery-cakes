# CMS setup (one time, about 30 minutes)

How it works: the client signs in at `https://YOUR-SITE/admin/` with GitHub, adds or edits a cake and presses
**Publish**. Decap CMS saves it as a small file in your GitHub repo → GitHub Actions checks it and rebuilds the
site → Cloudflare Pages serves it. About 1–2 minutes later the change is live. **Cost: $0.**

```
Client ──> /admin (Decap CMS) ──sign in──> Cloudflare Worker ──> GitHub
                 │ Publish                                          │
                 └────────── commit to repo ────────────────────────┘
                                   │
                          GitHub Actions: check + build
                                   │
                          Cloudflare Pages (live site)
```

## 0. Try it on your own computer first (no accounts needed)
```bash
npm install
npm run dev:cms          # starts the website and the local CMS helper
```
Open http://localhost:3000/admin/index.html and press **Login**. Changes are written straight into
`content/products/` and `public/uploads/products/` in your project folder (commit them with git afterwards).

## 1. Put the project on GitHub
Push this folder to a repository, branch `main`. A **private** repo works (GitHub Actions gives 2,000 free
minutes a month, roughly 1,300 saves). A public repo has unlimited minutes.

## 2. Cloudflare Pages project
```bash
npx wrangler login
npx wrangler pages project create passion-bakery-cakes --production-branch main
```
In the Cloudflare dashboard → **Workers & Pages** → your project → **Custom domains**, add your domain.

## 3. Let GitHub deploy to Cloudflare
1. Cloudflare → **My Profile → API Tokens → Create Token → Custom token**. Permission: *Account → Cloudflare Pages → Edit*. Copy the token.
2. Copy your **Account ID** (Workers & Pages overview page, right side).
3. GitHub repo → **Settings → Secrets and variables → Actions**:
   - *Secrets:* `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
   - *Variables:* `CF_PAGES_PROJECT` = `passion-bakery-cakes`, `SITE_URL` = `https://your-domain.com`

## 4. Deploy the sign-in worker
```bash
cd cms-auth-worker
# edit wrangler.toml: ALLOWED_ORIGINS = "https://your-domain.com"
npx wrangler deploy
```
It prints an address like `https://passion-cms-auth.<your-name>.workers.dev`. Keep it.

## 5. GitHub OAuth app (lets the client sign in)
GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
- Homepage URL: `https://your-domain.com`
- Authorization callback URL: `https://passion-cms-auth.<your-name>.workers.dev/callback`

Create it, copy the **Client ID**, press **Generate a new client secret**, then:
```bash
cd cms-auth-worker
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
```

## 6. Point the CMS at your repo
Edit the two marked lines at the top of `public/admin/config.yml`:
```yaml
repo: your-github-username/your-repository
base_url: https://passion-cms-auth.<your-name>.workers.dev
```
Also set `site_url` / `display_url`. Commit and push → the first deploy runs.

## 7. Give the client access
GitHub repo → **Settings → Collaborators → Add people** → the client's GitHub account with **Write** access.
They open `https://your-domain.com/admin/`, press **Login with GitHub**, and they are in.
(Tell them to create a free GitHub account first. See `CLIENT-GUIDE.md` for what to do inside.)

## Safety net
Before every deploy, GitHub Actions runs `npm run check`, which validates every cake (name, price, sizes,
category, duplicate names). If an edit is invalid, **the deploy stops and the live site stays as it was**.
Open the repo's **Actions** tab to see the plain-language reason. Photos over 1.5 MB are flagged as warnings.

## Troubleshooting
| Problem | Likely cause |
|---|---|
| Sign-in window opens then closes, no login | `ALLOWED_ORIGINS` in the worker doesn't match the site address, or the OAuth *callback URL* is wrong |
| "Failed to persist entry" / 404 | The client's GitHub account isn't a collaborator with Write access, or `repo:` in config.yml is wrong |
| Saved, but the site doesn't change | Open the GitHub **Actions** tab: the check failed (read the message) or the Cloudflare secrets are missing |
| Photo doesn't appear | The cake's photo field is empty, or the file was deleted; the default cake photo is shown instead |

## Where things live
| What | Where |
|---|---|
| One file per cake | `content/products/*.json` (edited by the CMS) |
| Uploaded photos | `public/uploads/products/` |
| CMS form (fields, labels, hints) | `public/admin/config.yml` |
| Rules / validation | `scripts/products-lib.mjs` |
| Deploy pipeline | `.github/workflows/deploy.yml` |
| Sign-in worker | `cms-auth-worker/` |

`public/cake_products.json` is **generated** from `content/products` on every build. Never edit it by hand.
