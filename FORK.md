# AndiHub — fork of PeteZahGames

**AndiHub** is a rebranded fork of [PeteZahGames](https://github.com/PeteZah-Games/PeteZahGames)
by PeteZah. Upstream fixes flow in automatically (see *Auto-updates* below).

## License (read this — it has teeth)

Upstream ships its license as `LISCENSE` (their spelling): **GNU AGPL-3.0-only**
(`package.json` confirms `"license": "AGPL-3.0-only"`). That means:

- This fork stays AGPL-3.0-only. `LISCENSE` is kept untouched.
- Modifications are declared: `README.md` header notice + `branding.json` + this file.
- Credit is kept: the in-app About section names PeteZahGames as the upstream
  project and links this repo's source.
- **If you host this publicly, AGPL §13 requires offering every user the
  Corresponding Source** — the About → source link covers this. Don't remove it.

## How the rebrand works

All branding lives in `branding.json` (single source of truth) and is applied by
`scripts/apply-branding.mjs` (idempotent — safe to re-run; `npm run brand`):

- Visible strings only: titles, SEO meta, manifest, legal pages, mail sender,
  achievements, auth/about/feature copy, logo (`branding/logo.png` → `public/logo.png`).
- The sync workflow re-runs the script after every upstream merge, so upstream
  overwrites get re-branded automatically.

### Intentionally NOT renamed (renaming these breaks the app)

- `petezah://` internal URL scheme + `petezah-*` DOM events + `petezah-*`
  localStorage keys (routing, history, settings sync — invisible to users).
- `/petezah/` UV proxy prefix + `public/petezah/*` service-worker bundle.
- `isPeteZahHomeHost` / `HOME_HOSTS` identifiers (your domain was *added* to the
  set in `backend/utils/seo-meta.js`, so server meta + manifest serve the
  AndiHub identity on your host).
- Obfuscated `src/lib/uiMarks.ts` (anti-tamper string table — functional, untouched).
- `LINKBOT_STORAGE_PATH` default path, `ChatPage` third-party embed URL,
  `YOUTUBE_URL` in `DiscordPopup.tsx` (upstream creator's channel — swap in yours).
- `packages/rivet/NOTICE` (license attribution — must stay).

## Deploying (your own server required)

Static hosts (GitHub Pages, Netlify, Vercel, Cloudflare Pages) can **not** run
this — the proxy needs the Node backend. Use Railway, Render, a VPS, etc.:

```bash
npm install
cp backend/.env.example backend/.env.production   # then fill it out
npm start
```

Environment (`backend/.env.example` — nothing branded in there, just fill in):

| Var | What |
| --- | ---- |
| `JWT_SECRET`, `SESSION_SECRET` | long random strings |
| `ADMIN_EMAIL` | your email (owner account) |
| `PUBLIC_ORIGIN` | your public URL, e.g. `https://andihub.gg` |
| `RESEND_API_KEY` | resend.com key (verification mails) |
| `GROQ_API_KEY` | AI chat |
| `TMDB_API_KEY` | movies |
| `BOT_TOKEN`, `TOKEN_SECRET`, `CAP_SECRET` | rate-limit / captcha hardening |
| `EXOCLICK_*` | ads (optional) |
| `LINKBOT_STORAGE_PATH` | override for the links data file |

## Auto-updates

`.github/workflows/sync-upstream.yml` runs daily (04:00 UTC, plus manual
*Run workflow*): merges `PeteZah-Games/PeteZahGames@main` into this repo's
`main`, re-applies branding, pushes. Conflict handling:
- Pure display-copy files auto-resolve (take upstream, re-brand after).
- Fork-structural files (`package.json`, `seo-meta.js`, `secrets.js`,
  `apply-branding.mjs`, `branding/*`, workflow, `FORK.md`, `railway.json`)
  fail the run loudly — resolve those in the GitHub web editor (rare).
- If upstream rewrites a branded sentence entirely, the branding script misses
  it and fails loudly too — port the rule to the new wording (see script).

> **One-time setting:** repo → Settings → Actions → General → *Workflow
> permissions* → **Read and write permissions**, otherwise the bot can't push.
> Scheduled workflows on forks pause after 60 days without activity — hit
> *Run workflow* manually if syncs stop.

## Fork-specific fixes (not upstream)

- `backend/utils/secrets.js` (new file): upstream ships only `secrets.ts` while
  the server imports `./secrets.js`, so `npm start` crashes on a fresh clone.
  The shim re-exports the `.ts` (plain erasable JS — runs on Node 22.6+).
  If upstream ever adds their own `secrets.js`, the sync merge will conflict —
  keep this file in that case.
- `PUBLIC_ORIGIN` doubles as the home-host signal: whatever domain you deploy
  is added to `HOME_HOSTS`, so your domain serves the AndiHub SEO identity +
  manifest. Unknown hosts still get the EDU cloak. Client tab title is always
  AndiHub now.
- `TMDB_API_KEY` is **required to boot** (upstream `assertProductionSecrets`
  throws without it). Free key: `https://www.themoviedb.org/settings/api`.
- First visit shows a bot-verification gate (`/verify`, Cap.js) by design —
  humans pass once, then browse. `curl` will only ever see the 302.

## UX clarity changes (AndiHub-only)

Non-technical users found the navbar cryptic, so on top of upstream:
- Sidebar starts **expanded** (`useBrowserState.ts`) with a labeled
  *"What can I do here?"* feature list incl. one-line plain descriptions.
- First-run **guide overlay** + capability cards on every new tab
  (`src/components/AndiHubGuide.tsx` — new file, zero conflict risk) with a
  permanent Guide button in the sidebar.
- These files are in the sync workflow's protected list, so upstream conflicts
  there fail loudly instead of silently dropping the clarity work:
  `BrowserSidebar.tsx`, `ContentArea.tsx`, `useBrowserState.ts`.

## TODO before going public

- [ ] Real domain in `branding.json` (`domain`, `siteUrl`, mails) + `PUBLIC_ORIGIN`
- [ ] Real Discord invite in `branding.json` (`discordInvite`, `discordLegal`)
- [ ] Your YouTube channel in `src/components/DiscordPopup.tsx` (`YOUTUBE_URL`)
- [ ] Better `branding/logo.png` (current one is a minimal placeholder; keep filename)
- [ ] Re-run `node scripts/apply-branding.mjs` after editing `branding.json`
