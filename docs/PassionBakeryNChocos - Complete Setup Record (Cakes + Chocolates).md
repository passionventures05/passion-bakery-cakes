# PassionBakeryNChocos - Complete Setup Record (Cakes + Chocolates)

Oct 11, 2026 · @Ruby

## 1. What we built

Two free websites, each with its own admin page where your client edits products. A saved edit goes live by itself in about 1 to 2 minutes.

The chain for every edit is: client saves in the admin page, the save becomes a commit in GitHub, GitHub Actions builds the site, GitHub Pages publishes it.

| Item | Cakes site | Chocolates site |
| --- | --- | --- |
| Live website | https://passionbakerynchocos.com | https://passionbakerynchocos.co.in |
| Admin page | https://passionbakerynchocos.com/admin/ | https://passionbakerynchocos.co.in/admin/ |
| GitHub repository | https://github.com/passionventures05/passion-bakery-cakes | https://github.com/passionventures05/passion-bakery-chocolates |
| Folder on your computer | D:\\Digital Business Website Files\\Cakes\_website\_React | D:\\Digital Business Website Files\\Chocolates\_Website\_React |
| Login worker (Cloudflare) | passion-cms-auth | passion-chocolates-cms-auth |
| Worker address | https://passion-cms-auth.passionventures.workers.dev | https://passion-chocolates-cms-auth.passionventures.workers.dev |
| GitHub OAuth app | Passion Cakes CMS | Passion Chocolates CMS |

The two sites share nothing except your GitHub account and your Cloudflare account. A mistake on one cannot break the other.

What each part does:

- **GitHub repository:** stores the code and every product as a small file.
- **GitHub Actions:** checks the files, builds the site and publishes it.
- **GitHub Pages:** serves the finished site on your domain, free.
- **Cloudflare Worker:** only handles the "Login with GitHub" step of the admin page. It does nothing when visitors browse the site.
- **GitHub OAuth app:** lets the admin page sign people in with their GitHub account.

## 2. Accounts and tools used

| What | Used for | Cost |
| --- | --- | --- |
| GitHub account passionventures05 | Stores the code, builds and hosts both sites | Free (repos must stay Public) |
| Cloudflare account | Runs the two small login workers. The workers.dev name you chose is passionventures | Free |
| Domain passionbakerynchocos.com | Address of the cakes site | Yearly renewal at your registrar |
| Domain passionbakerynchocos.co.in | Address of the chocolates site | Yearly renewal at your registrar |
| Git (on your Windows computer) | Sends your code to GitHub | Free |
| Node.js (on your Windows computer) | Runs the npx wrangler commands | Free |

Your Git identity on this computer is the name passionventures05 and your GitHub private email address. It is set once and stays saved.

## 3. Part A: Cakes site, every step

How to open a terminal in a project folder: open the folder in File Explorer, click the address bar, type `cmd` and press Enter. All commands below are typed in that black window, one line at a time, followed by Enter.

### A1. Create the GitHub repository (browser)

1. Go to github.com and sign in as passionventures05.
2. Click the + at the top right, then **New repository**.
3. Repository name: `passion-bakery-cakes`.
4. Choose **Public**. Free GitHub Pages only works with public repositories.
5. Leave README, .gitignore and licence all unticked.
6. Click **Create repository**.

### A2. Tell Git who you are (once per computer)

If you skip this, the first commit fails with the message "Author identity unknown".

```
git config --global user.name "passionventures05"
git config --global user.email "340706704+passionventures05@users.noreply.github.com"
```

### A3. Put the 4 new files in their right folders

| File | Final location inside the cakes project |
| --- | --- |
| deploy.yml | .github\\workflows\\deploy.yml |
| config.yml | public\\admin\\config.yml |
| wrangler.toml | cms-auth-worker\\wrangler.toml |
| GITHUB-PAGES-SETUP.md | docs\\GITHUB-PAGES-SETUP.md |

Open `public\admin\config.yml` and make sure this line reads:

```
repo: passionventures05/passion-bakery-cakes
```

The `base_url` line stays as it is for now. We fill it in at step A11.

### A4. Send the code to GitHub

Open a terminal in the cakes project folder (the one that contains package.json) and run these lines in this order:

```
git init
git branch -M main
git add .
git commit -m "First version"
git remote add origin https://github.com/passionventures05/passion-bakery-cakes.git
git push -u origin main
```

A browser window may ask you to sign in to GitHub. Approve it. Refresh the repository page afterwards: all files should be there.

Warnings that say "LF will be replaced by CRLF" are normal on Windows and can be ignored.

### A5. Turn on GitHub Pages (browser)

1. Open the repository, then **Settings**, then **Pages** in the left menu.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Do not click **Configure** on the Next.js card. It would add a second, conflicting workflow.
4. Under **Custom domain** type `passionbakerynchocos.com` and click **Save**.
5. Wait for the green text "DNS check successful", then tick **Enforce HTTPS**.

Your domain already pointed to GitHub, so no DNS changes were needed. For a new domain you would add four A records at your registrar: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153, plus a CNAME record named www that points to passionventures05.github.io.

### A6. Run the first deploy (browser)

1. Open the repository, then **Actions**.
2. Click **Deploy to GitHub Pages** in the left list.
3. Click **Run workflow**, keep the branch `main`, and click the green **Run workflow** button.
4. Wait about 2 minutes until both jobs, `build` and `deploy`, show a green tick.
5. Open https://passionbakerynchocos.com and press Ctrl+Shift+R.

After this, every push to the main branch deploys by itself.

### A7. Create a Cloudflare API token

The simple `npx wrangler login` failed for us, because the sign-in link opened in a different Chrome profile. A token avoids that.

1. Sign in at dash.cloudflare.com (create a free account first if needed).
2. Open https://dash.cloudflare.com/profile/api-tokens and click **Create Token**.
3. Next to **Edit Cloudflare Workers** click **Use template**.
4. Keep your account under Account Resources and choose **All zones** if asked.
5. Click **Continue to summary**, then **Create Token**.
6. Copy the token. It is shown only once. Never paste it in chat, in screenshots or in GitHub.

### A8. Deploy the cakes login worker

In a terminal opened in the cakes project folder:

```
cd cms-auth-worker
set CLOUDFLARE_API_TOKEN=PASTE_YOUR_TOKEN_HERE
npx wrangler deploy
```

- No quotes, and no spaces around the = sign.
- If it asks "Ok to proceed?" to install wrangler, type `y`.
- The first time, it asks to register a workers.dev subdomain. Type `y`, then type `passionventures` and `y` again. That name is now fixed and shared by both workers.
- It ends by printing the worker address: https://passion-cms-auth.passionventures.workers.dev

The token only lives in that terminal window. If you close the window, run the `set` line again before the next wrangler command.

### A9. Create the GitHub OAuth app (browser)

1. Open https://github.com/settings/developers, click **OAuth Apps**, then **New OAuth App**.
2. Application name: `Passion Cakes CMS`
3. Homepage URL: `https://passionbakerynchocos.com`
4. Redirect URI (called Authorization callback URL on older forms): `https://passion-cms-auth.passionventures.workers.dev/callback`
5. Leave **Allow wildcard matching** and **Enable Device Flow** unticked.
6. Untick **Expire user access tokens**. The CMS cannot renew an expired token, so editing would stop after a few hours.
7. Click **Register application**, then **Generate a new client secret**.
8. Keep that page open. The secret is shown only once.

### A10. Give the Client ID and Client Secret to the worker

Still in the cakes `cms-auth-worker` folder, with the token set. Type each command exactly as written. The names GITHUB\_CLIENT\_ID and GITHUB\_CLIENT\_SECRET stay in the command. You paste the real values only at the prompt "Enter a secret value".

```
npx wrangler secret put GITHUB_CLIENT_ID
```

At the prompt, paste the Client ID (starts with Ov23li). Expected last line: Success! Uploaded secret GITHUB\_CLIENT\_ID

```
npx wrangler secret put GITHUB_CLIENT_SECRET
```

At the prompt, paste the Client Secret (40 characters). Expected last line: Success! Uploaded secret GITHUB\_CLIENT\_SECRET

If a secret ever gets the wrong name, delete it with `npx wrangler secret delete WRONG_NAME` and put it again.

### A11. Connect the admin page to the worker

```
cd ..
notepad public\admin\config.yml
```

Change the base\_url line to this, with no slash at the end, then save with Ctrl+S:

```
base_url: https://passion-cms-auth.passionventures.workers.dev
```

Then send it to GitHub:

```
git add .
git commit -m "Connect CMS login worker"
git push
```

Wait about 2 minutes for the green tick in the Actions tab.

### A12. Test the admin login

1. Open https://passionbakerynchocos.com/admin/
2. Click **Login with GitHub** and approve.
3. The list of cakes should appear.

### A13. Give your client access

In the repository: **Settings**, **Collaborators**, **Add people**. Enter the client's GitHub username and pick the **Write** role. The client accepts the email invitation, then logs in at /admin/ with their own GitHub account.

## 4. Part B: Chocolates site, every step

The steps are the same as Part A. Only the names change. Do not reuse the cakes OAuth app or the cakes worker, because each GitHub OAuth app allows exactly one redirect address.

| Setting | Chocolates value |
| --- | --- |
| Project folder | D:\\Digital Business Website Files\\Chocolates\_Website\_React |
| GitHub repository | passion-bakery-chocolates |
| Custom domain | passionbakerynchocos.co.in |
| Worker name | passion-chocolates-cms-auth |
| Worker address | https://passion-chocolates-cms-auth.passionventures.workers.dev |
| OAuth app name | Passion Chocolates CMS |
| OAuth homepage URL | https://passionbakerynchocos.co.in |
| OAuth redirect URI | https://passion-chocolates-cms-auth.passionventures.workers.dev/callback |

### B1. Create the repository (browser)

Same as A1, with the name `passion-bakery-chocolates`. Choose **Public**.

### B2. Git identity

Already saved from A2 on this computer. Do not repeat it.

### B3. Put the 4 files in their right folders

| File | Final location inside the chocolates project |
| --- | --- |
| deploy.yml | .github\\workflows\\deploy.yml |
| config.yml | public\\admin\\config.yml |
| wrangler.toml | cms-auth-worker\\wrangler.toml |
| GITHUB-PAGES-SETUP.md | docs\\GITHUB-PAGES-SETUP.md |

In `public\admin\config.yml` the repo line must read:

```
repo: passionventures05/passion-bakery-chocolates
```

### B4. Send the code to GitHub

Open a terminal in the chocolates project folder and run:

```
git init
git branch -M main
git add .
git commit -m "First version"
git remote add origin https://github.com/passionventures05/passion-bakery-chocolates.git
git push -u origin main
```

Type the whole `git remote add origin ...` line in one go. If you press Enter early, Git shows its usage help, which is harmless. Just retype the full line.

### B5. Turn on GitHub Pages (browser)

Same as A5: **Settings**, **Pages**, Source **GitHub Actions**, custom domain `passionbakerynchocos.co.in`, **Save**, then tick **Enforce HTTPS** once the DNS check is green.

### B6. Run the first deploy

Same as A6: **Actions**, **Deploy to GitHub Pages**, **Run workflow**. Wait for two green ticks, then open https://passionbakerynchocos.co.in and press Ctrl+Shift+R.

### B7. Deploy the chocolates login worker

Use a Cloudflare API token. If you already deleted the old one, create a new one exactly as in A7. The workers.dev name passionventures already exists, so it will not ask for it again.

```
cd cms-auth-worker
set CLOUDFLARE_API_TOKEN=PASTE_YOUR_TOKEN_HERE
npx wrangler deploy
```

It must end by printing https://passion-chocolates-cms-auth.passionventures.workers.dev

If you get "CLOUDFLARE\_API\_TOK is not recognized", the line was cut short. Type `set CLOUDFLARE_API_TOKEN=` in full.

### B8. Create the GitHub OAuth app (browser)

Same as A9, with the chocolates values from the table above. Untick **Expire user access tokens**. Keep the page open after generating the client secret.

### B9. Give the Client ID and Client Secret to the chocolates worker

```
npx wrangler secret put GITHUB_CLIENT_ID
```

Paste the new Client ID at the prompt.

```
npx wrangler secret put GITHUB_CLIENT_SECRET
```

Paste the new Client Secret at the prompt. Both must say: Creating the secret for the Worker "passion-chocolates-cms-auth", then Success.

If the output names "passion-cms-auth", you are in the cakes folder. Stop and change folders.

### B10. Connect the admin page to the worker

```
cd ..
notepad public\admin\config.yml
```

Set this line, with no slash at the end, then save with Ctrl+S:

```
base_url: https://passion-chocolates-cms-auth.passionventures.workers.dev
```

```
git add .
git commit -m "Connect CMS login worker"
git push
```

### B11. Test and give client access

Open https://passionbakerynchocos.co.in/admin/, click **Login with GitHub** and check that the 22 products appear. Then add the client as a collaborator with the **Write** role in this repository, as in A13.

## 5. Everyday use: updating the live sites

### Add or change products (no commands)

1. Open the admin page of the site (/admin/) and click **Login with GitHub**.
2. Open a product, or click **+ Cake** or **+ Product**. Change the price, photo, description, or switch **Show on website** off.
3. Click **Publish**, then **Publish now**.
4. Wait 1 to 2 minutes, then press Ctrl+Shift+R on the live site.

Keep photos under 1.5 MB. To remove a product without losing it, switch off **Show on website** instead of deleting it.

If the site does not change, open the repository's **Actions** tab. A green tick means the edit is live and your browser shows an old copy. A red cross means one product has a mistake, and the log names it. The live site stays as it was until the mistake is fixed.

### Change the code (design, text, phone number)

Always pull first. The client's CMS saves are commits that your computer does not have yet. Run these in the project folder of the site you are changing:

```
git pull
npm install
npm run dev
```

Open http://localhost:3000 to preview. Press Ctrl+C in the terminal to stop it. When you are happy:

```
npm run check
git add .
git commit -m "Describe what you changed"
git push
```

About 2 minutes later the change is live. Business details such as phone, email, UPI and delivery pincodes are in `src\lib\site.ts`.

Never edit `public\cake_products.json` (cakes) or `public\products.json` (chocolates) by hand. They are rebuilt on every deploy.

If `git push` is rejected, the client saved something in between. Run these two lines:

```
git pull --rebase
git push
```

### Redeploy without any change

Repository, then **Actions**, then **Deploy to GitHub Pages**, then **Run workflow**.

### Undo a bad change

```
git pull
git log --oneline
git revert COMMIT_ID
git push
```

Replace COMMIT\_ID with the short code at the start of the bad line in the log. Press `q` to leave the log view. This also undoes a CMS edit, because those are commits too.

### Android app

The app holds a copy of the website from the day it was built. It does not update when you publish products. To ship changes, run these in the project folder, then build and upload a new app version:

```
git pull
npm install
npm run cap:sync
npm run cap:open
```

## 6. What you must renew or keep an eye on

Only the two domain names cost money and need a yearly payment. Everything else is free and has no renewal date, but a few things can stop the setup if they change.

| Item | Needs renewal? | What breaks if missed | What you do |
| --- | --- | --- | --- |
| passionbakerynchocos.com | Yes, yearly, at the registrar where you bought it | The cakes site and its admin page go offline | Turn on auto-renew. Keep the payment card valid |
| passionbakerynchocos.co.in | Yes, yearly, at its registrar | The chocolates site and its admin page go offline | Turn on auto-renew. Keep the payment card valid |
| HTTPS certificate | No, GitHub renews it by itself | Browser shows a security warning | Never remove the DNS records pointing to GitHub. If you ever change DNS, recheck **Settings, Pages** |
| GitHub OAuth app secrets | No expiry date | Admin login fails with an error | Only if you regenerate a secret or delete the app: run `npx wrangler secret put GITHUB_CLIENT_SECRET` again for that site |
| Cloudflare workers | No | Admin login stops if the worker or account is deleted | Keep the Cloudflare account and its email. Free limit is 100,000 requests a day, far above what logins need |
| Cloudflare API token | No. You deleted it after setup | Nothing, the sites do not need it | Create a new one (step A7) only when you want to redeploy a worker or change its secrets |
| GitHub repositories | No | Free Pages stops working if a repository is made private | Keep both repositories Public |
| Client as collaborator | No | Client cannot save in the admin page | Re-add them with the **Write** role if they change their GitHub account |

### Limits of the free plans

- GitHub Pages: site size about 1 GB and about 100 GB of visitor traffic a month. Both sites are far below that.
- GitHub Actions: no minute limit on public repositories.
- Keep product photos under 1.5 MB each so the repositories stay small.

### Maintenance to expect

- **Node version in the deploy file.** The file `.github\workflows\deploy.yml` says `node-version: 22`. Around April 2027 that version stops getting security updates. Change 22 to the current even-numbered version in both repositories, push, and check the Actions tab goes green.
- **GitHub Actions warnings.** If the Actions page ever shows a yellow warning that an action is deprecated, raise its version number in deploy.yml (for example `@v4` to the next number).
- **Your own accounts.** Turn on two-factor sign-in for GitHub and Cloudflare, and keep the recovery codes somewhere safe. Losing the GitHub account means losing both sites.
- **Play Store (only if you publish the Android app).** Google charges a one-time developer registration fee. It is separate from everything above.

## 7. Problems we hit and how they were fixed

| What you see | Cause | Fix |
| --- | --- | --- |
| `Author identity unknown` when committing | Git does not know your name yet | Run the two `git config --global` lines from step A2, then commit again |
| `src refspec main does not match any` | The commit failed, so there is nothing to push | Fix the commit problem first, then run `git push -u origin main` |
| `OAuth error: request_forbidden` during `npx wrangler login` | The sign-in link opened in a different Chrome profile | Use an API token instead (step A7) |
| `'CLOUDFLARE_API_TOK' is not recognized` | The `set` line was cut short | Type `set CLOUDFLARE_API_TOKEN=` in full, then paste the token |
| Wrangler asks to register a workers.dev subdomain | First deploy on a new Cloudflare account | Type `y`, then a short name, then `y`. Only once per account |
| Wrangler says `Uploaded secret Ov23li...` instead of `GITHUB_CLIENT_ID` | The value was typed as the secret's name | Delete it with `npx wrangler secret delete THAT_NAME`, then redo step A10 |
| `git remote add origin` shows usage help | The address was missing from the line | Retype the full line with the https address |
| Actions run shows a red cross | A product file has a mistake, or a test failed | Open the failed step. The message names the product. Fix it and push |
| Domain shows a GitHub 404 page | First deploy has not run yet, or DNS is still updating | Run the workflow (step A6) and wait |
| Login window opens and closes, nothing happens | `ALLOWED_ORIGINS` in the worker does not match the site address, or the redirect URI is wrong | Check the OAuth app redirect URI ends in /callback. Redeploy the worker with `npx wrangler deploy` |
| "Failed to persist entry" or 404 on Publish | The person is not a collaborator with **Write** access, or the repo line in config.yml is wrong | Re-add them with **Write**. Check `repo:` in `public\admin\config.yml` |
| Saved in the admin page but the site looks the same | Browser is showing an old copy, or the deploy failed | Check **Actions**. If green, press Ctrl+Shift+R |
| `git push` is rejected | The client saved something in between | `git pull --rebase`, then `git push` |
| Site works only on the domain, not on the github.io address | Images and product list use root paths | Expected. Always test on your own domain |

## 8. Checklist: done and still to do

Done on 11 October 2026:

- [x] Both repositories created, Public, code pushed
- [x] GitHub Pages on for both, custom domains saved, HTTPS enforced
- [x] Both sites deployed and live
- [x] Both login workers deployed with their secrets
- [x] Both admin pages connect to their worker and show the product list

Still to do:

- [ ] Delete the Cloudflare API token at dash.cloudflare.com/profile/api-tokens (it appeared in a screenshot and in terminal output)
- [ ] Make one test edit on each site, wait for the green tick in Actions, check the live site, then change it back
- [ ] Add your client as a collaborator with **Write** access on both repositories
- [ ] Turn on auto-renew for both domain names at their registrars
- [ ] Turn on two-factor sign-in for GitHub and Cloudflare, and save the recovery codes
- [ ] Optional: fix the spelling "Passsion" (three s) in the site name and the admin page title, and delete the duplicate cake file rasgulla-cake-second-listing-649-check

Keep this document. Steps A1 to A13 and B1 to B11 are all you need to rebuild either site from zero.
