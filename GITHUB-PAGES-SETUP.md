# Deploy on GitHub Pages + connect the CMS

Host the cakes website for free on **GitHub Pages**, on your own domain (`passionbakerynchocos.com`), and let the
client add or edit cakes at `https://passionbakerynchocos.com/admin/`.

> This guide replaces the Cloudflare Pages parts of `docs/CMS-SETUP.md`.
> The only Cloudflare piece still used is the tiny **login worker** (free), because GitHub Pages cannot do the GitHub sign-in step by itself.

## How it works

```
Client ──> /admin (Decap CMS) ──sign in──> Cloudflare Worker ──> GitHub
                │ Publish                                         │
                └──────────── commit to repo (main) ──────────────┘
                                   │
                        GitHub Actions: check + build
                                   │
                         GitHub Pages (live site, your domain)
```

Every cake is one small file in `content/products/`. Saving in the CMS commits that file. The commit starts the
deploy workflow, and the site updates in about 1–2 minutes.

---

## Part A. One-time setup

### Step 1. Accounts you need (all free)
- A **GitHub** account (yours). The client also needs their own free GitHub account.
- A **Cloudflare** account (only for the login worker).
- **Node.js 22** and **Git** installed on your computer.
- Access to your domain's DNS settings (where you bought the domain).

### Step 2. Copy the changed files into the project
Copy these three files from this package into your project, replacing the old ones. Create folders if missing.

| File | What changed |
|---|---|
| `.github/workflows/deploy.yml` | **New.** Checks, builds and publishes to GitHub Pages. |
| `public/admin/config.yml` | New header only. You fill in two values in Step 9. |
| `cms-auth-worker/wrangler.toml` | Allows your domain (with and without `www`) and uses the `public_repo` permission. |

### Step 3. Create the GitHub repository
1. GitHub → **New repository**. Name it e.g. `passion-bakery-cakes`.
2. Set it to **Public**. Free GitHub Pages only works from public repositories. Your cake data, email and UPI ID will be visible in the repo, but they are already visible on the website.
3. Do not add a README, .gitignore or licence (the project has them).

### Step 4. Push the project
In the project folder:
```bash
git init
git branch -M main
git add .
git commit -m "First version"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```
`node_modules`, `out`, `.next` and `android` are ignored automatically.
The first run of the workflow will fail or have nowhere to deploy until Step 5 is done. That is expected.

### Step 5. Turn on GitHub Pages
1. Repo → **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Under **Custom domain**, type `passionbakerynchocos.com` and press **Save**.
   (GitHub may show a DNS warning until Step 6 is finished. That is normal.)

### Step 6. Point your domain to GitHub
At your domain registrar's DNS page:

1. **Remove** any old `A`, `AAAA` or `CNAME` records for the bare domain (`@`) that point to a previous host.
2. Add these **A** records for `@`:
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```
3. Optional, recommended **AAAA** records for `@`:
   ```
   2606:50c0:8000::153
   2606:50c0:8001::153
   2606:50c0:8002::153
   2606:50c0:8003::153
   ```
4. Add a **CNAME** record: name `www`, value `YOUR_USERNAME.github.io`.
5. If your DNS is on Cloudflare, set these records to **DNS only** (grey cloud), not proxied.

(Double-check the addresses on GitHub's page "Managing a custom domain for your GitHub Pages site", in case they have changed.)

DNS can take from a few minutes to a few hours. In **Settings → Pages**, when the check turns green, tick **Enforce HTTPS**. The certificate can take up to about 24 hours the first time.

Recommended: GitHub profile → **Settings → Pages → Add a domain** to verify your domain, so nobody else can claim it.

### Step 7. Run the first deploy
1. Repo → **Actions** tab → **Deploy to GitHub Pages** → **Run workflow** → branch `main`.
2. Wait for both jobs (`build`, `deploy`) to turn green. This takes about 2 minutes.
3. Open `https://passionbakerynchocos.com`. The site should load.

If the build fails, open the failed step. The messages are in plain language (for example, "cake X has no price").

> Do not judge the site at `username.github.io/repository`. Images and the cake list use root paths, so they only work on your domain.

### Step 8. Deploy the sign-in worker (Cloudflare, free)
On your computer:
```bash
cd cms-auth-worker
npx wrangler login          # opens a browser, sign in to Cloudflare
npx wrangler deploy
```
It prints an address like `https://passion-cms-auth.<your-name>.workers.dev`. **Copy it.** Do not add a slash at the end.

### Step 9. Create the GitHub OAuth app (lets the client sign in)
1. GitHub → your profile picture → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Fill in:
   - Application name: `PassionBakery CMS`
   - Homepage URL: `https://passionbakerynchocos.com`
   - Authorization callback URL: `https://passion-cms-auth.<your-name>.workers.dev/callback`
3. Press **Register application**. Copy the **Client ID**. Press **Generate a new client secret** and copy it right away.
4. Give both to the worker:
   ```bash
   cd cms-auth-worker
   npx wrangler secret put GITHUB_CLIENT_ID
   npx wrangler secret put GITHUB_CLIENT_SECRET
   ```
   Paste each value when asked.

### Step 10. Tell the CMS which repo and worker to use
Open `public/admin/config.yml` and edit these two lines near the top:
```yaml
  repo: YOUR_USERNAME/YOUR_REPOSITORY
  base_url: https://passion-cms-auth.<your-name>.workers.dev
```
Then:
```bash
git add public/admin/config.yml
git commit -m "Connect CMS"
git push
```
The site redeploys automatically.

### Step 11. Give the client access
1. Repo → **Settings → Collaborators → Add people** → the client's GitHub username → role **Write**.
2. The client accepts the email invitation.
3. The client opens `https://passionbakerynchocos.com/admin/` and presses **Login with GitHub**.

### Step 12. Test everything
1. Sign in at `/admin/`. You should see the list of cakes.
2. Open one cake, change the price, press **Publish**.
3. Go to the repo's **Actions** tab. A new run starts.
4. After it turns green (1–2 minutes), refresh the site with **Ctrl+Shift+R** (phone: close and reopen the tab). The new price should show.

---

## Part B. Updating the live website later

### Option 1. Adding or changing cakes (the CMS)
There is nothing to deploy by hand.
1. Open `https://passionbakerynchocos.com/admin/` and log in.
2. Add, edit or hide a cake, upload a photo, press **Publish**.
3. Wait 1–2 minutes and hard-refresh the site.

Tips:
- Keep photos under 1.5 MB. Bigger ones give a warning.
- To remove a cake without losing it, switch off its **available** option instead of deleting it.
- If the site does not change: repo → **Actions** → open the latest run. A red cross means a cake had a mistake, and the message says which one. Fix it in the CMS and Publish again. The live site stays as it was until it is fixed.

### Option 2. Changing the code (design, text, settings)
Do this on your computer. **Always pull first**, because the client's CMS saves are commits that your computer does not have yet.
```bash
git pull                     # get the client's latest cake changes
npm install                  # only needed if packages changed
npm run dev                  # preview at http://localhost:3000
# ... make your changes ...
npm run check                # type-check + tests (the deploy runs this too)
git add .
git commit -m "Describe what you changed"
git push                     # this starts the deploy automatically
```
About 2 minutes later it is live. Watch progress in the **Actions** tab.

Things to remember:
- Never edit `public/cake_products.json` by hand. It is regenerated from `content/products/` on every build.
- Business details (phone, email, UPI, delivery pincodes, featured cakes) are in `src/lib/site.ts`.
- If `git push` is rejected, the client saved something in between. Run `git pull --rebase`, then `git push` again.

### Option 3. Redeploy without any change
Repo → **Actions → Deploy to GitHub Pages → Run workflow**.

### Option 4. Undo a bad change
```bash
git pull
git log --oneline            # find the bad commit
git revert COMMIT_ID         # makes a new commit that undoes it
git push
```
This also undoes a cake edit made in the CMS, because those are commits too.

### Option 5. Android app
The APK contains a copy of the website from the moment it was built. It does **not** update when you publish cakes or push code. To ship changes to the app:
```bash
git pull
npm install
npm run cap:sync             # builds the site and copies it into the Android project
npm run cap:open             # opens Android Studio, then build the new APK / bundle
```
Upload the new build to the Play Store (or share the new APK). Customers get the new cakes when they update the app.

---

## Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| Actions run is red at **Check** | A cake file is invalid, or a test failed. Read the message in the log, fix and push again. |
| Site shows no images or no cakes at `github.io/repo` | Expected. The site only works on the custom domain. |
| Domain shows a GitHub 404 | The first deploy has not run, or DNS has not finished. Run the workflow (Step 7) and wait for DNS. |
| "Enforce HTTPS" is greyed out | DNS is not verified yet, or the certificate is still being issued. Wait and retry. |
| Login window opens and closes, nothing happens | `ALLOWED_ORIGINS` in the worker does not match the address you use (`www` or not), or the OAuth callback URL is wrong. Fix it, then run `npx wrangler deploy` again. |
| "Failed to persist entry" or 404 when publishing | The client is not a collaborator with **Write** access, or `repo:` in `config.yml` is wrong. |
| Login error from GitHub (redirect_uri mismatch) | The OAuth app callback must be exactly `https://<worker>.workers.dev/callback`. |
| Saved in the CMS but the site is the same | Check **Actions**. If it is green, hard-refresh (the browser cache). If it is red, read the error. |
| Repo is private and Pages is unavailable | Free GitHub Pages needs a public repo. Make it public (Settings → General → Danger Zone). |
| `git push` rejected | Run `git pull --rebase` first. |

## Free-plan limits (comfortable for this business)
- GitHub Pages: site up to about 1 GB, about 100 GB bandwidth per month (soft limits).
- GitHub Actions: unlimited minutes on public repos.
- Cloudflare Workers: 100,000 requests per day. The worker is only used when someone logs in to the CMS.
- Keep the repo light: compress photos before uploading. `source-images/` is about 13 MB and can be moved out of the repo if the repo gets large.
- The `public/_headers` file only applies on Cloudflare Pages and is ignored on GitHub Pages. That is harmless; `/admin` still has a "noindex" tag and is blocked in `robots.txt`.

## Quick checklist
- [ ] Repo is public, code pushed to `main`
- [ ] Pages source = GitHub Actions, custom domain saved, HTTPS enforced
- [ ] DNS A records and `www` CNAME added
- [ ] First workflow run is green, the site opens on your domain
- [ ] Worker deployed, OAuth app created, two secrets set
- [ ] `repo:` and `base_url:` filled in `config.yml` and pushed
- [ ] Client added as collaborator with Write access
- [ ] Test edit in `/admin/` goes live
