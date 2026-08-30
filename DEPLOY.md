# Build, deploy and test

Everything below is copy-pasteable. Steps 1–3 need a computer; step 4 onward is how the
kids actually get it.

## 1. One-time setup on your computer

You need Node 20 or newer (`node -v` to check; get it from https://nodejs.org if missing)
and git.

```bash
git clone https://github.com/Bosonaa/learn-afaan-oromo.git
cd learn-afaan-oromo
npm install
```

`npm install` is the only setup step — the word lists and the audio clips are committed, so
there is nothing to download or generate before the app runs.

## 2. Run it locally

```bash
npm run dev
```

Open http://localhost:3000. Pick a unit, answer ten prompts, and the home page should show
XP, a streak and a "words to review" count. Progress lives in the browser's `localStorage`,
so a different browser or an incognito window starts from zero — that is also how you
reset: DevTools → Application → Local Storage → delete `learn-afaan-oromo:progress:v1`.

Stop it with `Ctrl+C`.

## 3. Check the real production build before deploying

```bash
npm run typecheck   # types, app + scripts
npm run lint
npm run build       # the same build Vercel runs
npm start           # serves the built app on http://localhost:3000
```

If `npm run build` fails, deployment will fail the same way — fix it here first. Note that
`/record` deliberately does nothing in a production build (see step 6).

## 4. Test on the kids' devices over your Wi-Fi (no deploy needed)

Fastest way to try it on a phone or tablet. Both devices must be on the same network.

```bash
npm run dev          # or: npm run build && npm start
```

Find your computer's local address:

- macOS: `ipconfig getifaddr en0`
- Linux: `hostname -I | awk '{print $1}'`
- Windows: `ipconfig` → "IPv4 Address"

Then open `http://<that-address>:3000` on the phone, e.g. `http://192.168.1.24:3000`.

Caveats: it only works while your computer is on and the command is running, and because
it is plain `http` the phone will not offer a proper "install as app" — it is a browser tab.
For real use, deploy (step 5).

## 5. Deploy so it works without your computer

The app is fully static apart from the dev-only recording route, so any host works. Vercel
is the least effort.

### Option A — Vercel dashboard (about two minutes, no CLI)

1. Sign in at https://vercel.com with your GitHub account.
2. https://vercel.com/new → **Import** `Bosonaa/learn-afaan-oromo`.
3. Change nothing (framework auto-detects as Next.js) → **Deploy**.
4. You get a URL like `https://learn-afaan-oromo.vercel.app`. Every later push to `main`
   redeploys automatically; pull requests get their own preview URL.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod        # first run asks a few questions, then prints the URL
```

### Keeping it private

A Vercel URL is public. If you would rather the kids' app not be, either enable Vercel
Authentication (Project → Settings → Deployment Protection, requires a Pro plan) or add a
simple shared password later — say the word and I will wire one up.

### Turning on "this looks wrong" reports

Reports are filed as GitHub issues in this repo, so there is no database to run. Set two
environment variables on the deployment (Vercel → Project → Settings → Environment Variables,
or a local `.env.local`):

| Variable | Value |
| --- | --- |
| `REPORTS_GITHUB_TOKEN` | a fine-grained GitHub token with **Issues: read and write** on `Bosonaa/learn-afaan-oromo` only — https://github.com/settings/personal-access-tokens/new |
| `REPORTS_REPO` | optional; defaults to `Bosonaa/learn-afaan-oromo` |

Without the token the flag button never appears and the app behaves exactly as before. With it,
each report opens an issue labelled `word-report` containing the unit, the English prompt, the
word being taught, the category and the note — GitHub emails you, and the fix goes into
`content/overrides.yaml` as usual. The token is never sent to the browser.

Reports are deliberately open to anyone using the app (it is your family's URL); a bad report
costs one click to close. Say the word if you later want it restricted to named reviewers.

## 6. Install it on a phone or tablet

Open the `https://…vercel.app` URL on the device, then:

- **iPhone / iPad (Safari):** Share button → **Add to Home Screen** → Add.
- **Android (Chrome):** ⋮ menu → **Install app** (or "Add to Home screen").

It then opens full-screen with no browser chrome, like a normal app. Each device keeps its
own progress, so two kids on two devices do not overwrite each other. On a shared device, add
a profile per child from "Who is learning" at the top of the unit list: each profile keeps its
own XP, streak and review schedule, and switching is one tap.

The installed app has a real icon and works offline: a service worker (`public/sw.js`, only
registered in production builds) caches the shell, the built JS/CSS and every audio clip that
has been played once, so units you have already opened keep working on a plane or in the car.
Something never opened while online shows the "You are offline" page instead. Icons are
committed under `public/icons`; regenerate them with `scripts/make-icons.sh` (needs
ImageMagick + librsvg) after editing `assets/icon.svg`.

## 7. Recording missing pronunciations (local only)

About half the words have no Wikimedia clip. To add your own voice:

```bash
npm run dev
```

Open http://localhost:3000/record, type who is speaking, then Record / Stop and save per
word. Each take is written to `public/audio/recorded/<word>.mp3` with a row in
`content/recordings.json` — both are files in the repo, so commit and push them and the
next deploy picks them up:

```bash
git add public/audio/recorded content/recordings.json
git commit -m "Add recordings for <words>"
git push
```

Install `ffmpeg` first (`brew install ffmpeg`, or `apt install ffmpeg`) so takes are
transcoded to mp3 that iOS can play. This page only works locally, and the API refuses to
run in production, because a deployed instance has a read-only filesystem.

## 8. Correcting words

Never edit `content/units/*.yaml` by hand — it is regenerated. Put verdicts in
`content/overrides.yaml`:

```yaml
unit-01-family:
  mother:
    oromo: ayyoo
    alternates: [haadha]
    reviewer: Kitesso
```

Then:

```bash
npm run draft:units     # applies overrides, marks those words verified
npm run mirror:audio    # re-fetches audio for corrected spellings
npm run typecheck && npm run lint && npm run build
```

`npm run fetch:lexicon` / `build:lexicon` are only needed to refresh the upstream
dictionary (~92 MB download) and are not part of normal work.

## 9. If something goes wrong

| Symptom | Fix |
| --- | --- |
| `next: not found` | `npm install` in the repo directory |
| Build fails on Vercel but not locally | Node version — set Node 20+ in Project → Settings → General |
| Phone can't reach `http://192.168.…:3000` | Different Wi-Fi network, or the laptop firewall is blocking the port |
| No audio on a word | That word has no clip yet; record it (step 7) |
| Progress won't reset | Clear the site's local storage, or use a private window |
| `/record` shows only "run npm run dev" | You are on a deployed build; recording is local-only by design |
