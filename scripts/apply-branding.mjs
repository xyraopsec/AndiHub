// apply-branding.mjs — idempotent AndiHub rebrand over the PeteZahGames fork.
// Reads branding.json, applies string rules + logo, prints a report.
// Safe to re-run: already-applied rules are skipped. Exit 1 if a required rule misses.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const B = JSON.parse(fs.readFileSync(path.join(ROOT, "branding.json"), "utf8"));
const tpl = (s) => String(s).replace(/\{\{(\w+)\}\}/g, (_, k) => B[k] ?? "");

const failures = [];
const warnings = [];
let applied = 0;
let skipped = 0;

const toLF = (s) => String(s).split("\r\n").join("\n");
const toEOL = (s, eol) => (eol === "\r\n" ? toLF(s).split("\n").join("\r\n") : toLF(s));

function rule(file, find, replace, opts = {}) {
  const { required = true, expect = 1, label = "" } = opts;
  const p = path.join(ROOT, file);
  let src;
  try {
    src = fs.readFileSync(p, "utf8");
  } catch {
    (required ? failures : warnings).push(`${required ? "FILE MISSING" : "skip"}: ${file}`);
    return;
  }
  const rep = tpl(replace);
  // EOL-agnostic matching: try find as-is, then the other line-ending style.
  const finds = [find];
  const alt = find.includes("\r\n") ? toLF(find) : toEOL(find, "\r\n");
  if (alt !== find) finds.push(alt);
  const reps = [rep];
  const repAlt = rep.includes("\r\n") ? toLF(rep) : toEOL(rep, "\r\n");
  if (repAlt !== rep) reps.push(repAlt);
  const hasRep = reps.some((v) => src.includes(v));
  const hit = finds.find((v) => src.includes(v));
  // split/join replaces every occurrence, so a present replacement means done —
  // this also covers prepend-style rules whose replacement contains the anchor.
  if (hasRep) {
    skipped++;
    return;
  }
  if (!hit) {
    (required ? failures : warnings).push(`${required ? "MISS" : "skip"}: ${file} :: ${(label || toLF(find)).slice(0, 90)}`);
    return;
  }
  const n = src.split(hit).length - 1;
  if (expect && n !== expect) warnings.push(`count ${n}!=${expect}: ${file} :: ${(label || toLF(find)).slice(0, 90)}`);
  const useRep = hit.includes("\r\n") ? toEOL(rep, "\r\n") : toLF(rep);
  fs.writeFileSync(p, src.split(hit).join(useRep));
  applied++;
}

// ── package.json ─────────────────────────────────────────────
rule("package.json", `"name": "petezah"`, `"name": "{{packageName}}"`);
rule("package.json", `"author": "PeteZah"`, `"author": "{{author}}"`);
rule("package.json", "Report questions to https://discord.gg/cYjHFDguxS.", "Report questions to {{discordInvite}}.");

// NOTE: upstream removed the default title fallback (2026-09-16) — the tab
// title now comes from server-injected SEO meta, which is branded above.

// ── wordmarks ────────────────────────────────────────────────
rule("src/components/BrowserSidebar.tsx", "PeteZah\r\n            </ObfuscatedText>", "{{brand}}\r\n            </ObfuscatedText>");
rule("src/components/ContentArea.tsx", `<ObfuscatedText as="span">PeteZah</ObfuscatedText>`, `<ObfuscatedText as="span">{{brand}}</ObfuscatedText>`);

// ── about / credit (AGPL: keep credit + offer source) ───────
rule("src/components/AccountPage.tsx", `title="About PeteZah"`, `title="About {{brand}}"`);
rule("src/components/AccountPage.tsx", ">About PeteZah</h3>", ">{{brand}}</h3>".replace("{{brand}}", "About " + B.brand));
rule(
  "src/components/AccountPage.tsx",
  "PeteZah is a glass browser built for school-friendly browsing, games, music, and more.",
  "{{brand}} is a glass browser built for school-friendly browsing, games, music, and more. {{brand}} is a fork of PeteZahGames by PeteZah (AGPL-3.0-only). Source code: {{sourceUrl}}."
);

// ── AI ───────────────────────────────────────────────────────
rule(
  "src/components/AIPage.tsx",
  "You are PeteAI, a helpful and friendly AI assistant developed by PeteZah.",
  "You are {{aiName}}, a helpful and friendly AI assistant developed by {{aiDeveloper}}."
);

// ── discord links ────────────────────────────────────────────
rule("src/components/ContentArea.tsx", `href="https://discord.gg/cYjHFDguxS"`, `href="{{discordInvite}}"`);
rule("src/components/StatusBar.tsx", `const DISCORD_INVITE = "https://discord.gg/cYjHFDguxS";`, `const DISCORD_INVITE = "{{discordInvite}}";`);
rule("src/components/DiscordPopup.tsx", `const DISCORD_URL = "https://discord.com/invite/arcgZTV9zX";`, `const DISCORD_URL = "{{discordInvite}}";`);

// ── backend: seo / home host ─────────────────────────────────
rule("backend/utils/seo-meta.js", `new Set(["petezahgames.com"])`, `new Set(["petezahgames.com", "{{domain}}"])`);
rule(
  "backend/utils/seo-meta.js",
  "export function isPeteZahHomeHost(host) {",
  `// AndiHub: the deployed origin (PUBLIC_ORIGIN) counts as a home host, so the
// AndiHub identity + manifest are served on your own domain, not the EDU cloak.
try {
  const __po = String(process.env.PUBLIC_ORIGIN || "").trim();
  if (__po && !__po.includes("example")) {
    const __h = new URL(__po.startsWith("http") ? __po : "https://" + __po).hostname
      .replace(/^www\\./, "")
      .toLowerCase();
    if (__h) HOME_HOSTS.add(__h);
  }
} catch {}
export function isPeteZahHomeHost(host) {`
);
rule("backend/utils/seo-meta.js", `title: "PeteZah Games — Unblocked Games, Proxy Browser, Movies & Music",`, `title: "{{brand}} — {{tagline}}",`);
rule(
  "backend/utils/seo-meta.js",
  "PeteZah Games is a free unblocked games site and private proxy browser. Play HTML5 games at school, unblock YouTube and Reddit, stream movies and music, and browse with a fast web proxy.",
  "{{brand}} is a free unblocked games site and private proxy browser. Play HTML5 games at school, unblock YouTube and Reddit, stream movies and music, and browse with a fast web proxy."
);
rule(
  "backend/utils/seo-meta.js",
  `"unblocked games, unblocked games at school, proxy, web proxy, proxy browser, unblock youtube, petezah, petezah games, petezahgames, unblocked proxy, private browser, html5 games, unblocked movies, unblocked music, chromebook games, school proxy"`,
  `"unblocked games, unblocked games at school, proxy, web proxy, proxy browser, unblock youtube, andihub, andi hub, unblocked proxy, private browser, html5 games, unblocked movies, unblocked music, chromebook games, school proxy"`
);
rule("backend/utils/seo-meta.js", `siteName: "PeteZah Games",`, `siteName: "{{brand}}",`);
rule("backend/utils/seo-meta.js", `author: "PeteZah",`, `author: "{{author}}",`);
rule("backend/utils/seo-meta.js", `url: "https://petezahgames.com/",`, `url: "{{siteUrl}}",`, { expect: 2 });
rule("backend/utils/seo-meta.js", `ogImage: "https://petezahgames.com/og-share.png",`, `ogImage: "{{siteUrl}}og-share.png",`);
rule("backend/utils/seo-meta.js", `ogImageAlt: "PeteZah Games — Unblocked Games and Proxy Browser",`, `ogImageAlt: "{{brand}} — {{tagline}}",`);
rule("backend/utils/seo-meta.js", `twitter: "@petezahgames",`, `twitter: "{{twitter}}",`);
rule("backend/utils/seo-meta.js", `name: "PeteZah Games",`, `name: "{{brand}}",`);
rule("backend/utils/seo-meta.js", `alternateName: ["PeteZah", "PeteZahGames"],`, `alternateName: ["{{brandShort}}", "{{brand}}"],`);
rule("backend/utils/seo-meta.js", `"Unblocked games, proxy browser, movies, and music. Play at school and browse privately.",`, `"Unblocked games, proxy browser, movies, and music. Play at school and browse privately.",`);
rule("backend/utils/seo-meta.js", `logo: "https://petezahgames.com/logo.png",`, `logo: "{{siteUrl}}logo.png",`, { expect: 1 });
rule("backend/utils/seo-meta.js", `image: "https://petezahgames.com/og-share.png",`, `image: "{{siteUrl}}og-share.png",`);
rule("backend/utils/seo-meta.js", `target: "https://petezahgames.com/?q={search_term_string}",`, `target: "{{siteUrl}}?q={search_term_string}",`);

// ── backend: mail / auth / legal ─────────────────────────────
rule("backend/legal/version.js", `export const LEGAL_CONTACT_EMAIL = 'contact@petezahgames.com';`, `export const LEGAL_CONTACT_EMAIL = '{{contactEmail}}';`);
rule("backend/legal/version.js", `export const LEGAL_DMCA_EMAIL = 'petezahgames@gmail.com';`, `export const LEGAL_DMCA_EMAIL = '{{dmcaEmail}}';`);
rule("backend/legal/version.js", `export const LEGAL_DISCORD = 'https://discord.petezahgames.com';`, `export const LEGAL_DISCORD = '{{discordLegal}}';`);
rule("backend/utils/mail.js", `const FROM = 'PeteZah <no-reply@verify.petezahgames.com>';`, `const FROM = '{{mailFrom}}';`);
rule("backend/utils/mail.js", `subject: 'Verify your PeteZah email',`, `subject: 'Verify your {{brand}} email',`);
rule("backend/utils/mail.js", "Confirm this address to finish setting up your PeteZah account and unlock Get Links.", "Confirm this address to finish setting up your {{brand}} account and unlock Get Links.");
rule("backend/utils/mail.js", "text: `Verify your PeteZah email:", "text: `Verify your {{brand}} email:");
rule("backend/utils/totp.js", `issuer: 'PeteZah',`, `issuer: '{{brand}}',`);
rule("backend/api/achievements.js", "Create a PeteZah account", "Create a {{brand}} account");
rule("backend/api/achievements.js", "Use PeteZah for 7 consecutive days", "Use {{brand}} for 7 consecutive days");
rule("backend/api/achievements.js", "Spend 10 hours on PeteZah", "Spend 10 hours on {{brand}}");
rule("backend/api/achievements.js", "Spend 100 hours on PeteZah", "Spend 100 hours on {{brand}}");
rule("backend/legal/pages.js", "← Exit to PeteZah", "← Exit to {{brand}}");
rule("backend/legal/pages.js", `aria-label="PeteZah"`, `aria-label="{{brand}}"`);
rule("backend/legal/pages.js", `alt="PeteZah"`, `alt="{{brand}}"`);
rule("backend/legal/pages.js", `PeteZah <span class="labs-badge">Legal</span>`, `{{brand}} <span class="labs-badge">Legal</span>`);
rule("backend/legal/pages.js", `<p class="eyebrow">PeteZah Legal</p>`, `<p class="eyebrow">{{brand}} Legal</p>`);

// ── account / auth copy ──────────────────────────────────────
rule("src/components/AccountPage.tsx", `label: "PeteZah",`, `label: "{{brand}}",`);
rule("src/components/AccountPage.tsx", `a.download = "petezah-data.json"`, `a.download = "andihub-data.json"`);
rule("src/components/AccountPage.tsx", `document.title = "PeteZah";`, `document.title = "{{brand}}";`);
rule("src/components/AccountPage.tsx", ">PeteZah</span>", ">{{brand}}</span>");
rule("src/components/AccountPage.tsx", "Sign in to PeteZah below", "Sign in to {{brand}} below");
rule("src/components/AccountPage.tsx", `placeholder="petezah"`, `placeholder="andihub"`);
rule("src/components/AccountPage.tsx", "as you use PeteZah", "as you use {{brand}}");
rule("src/components/AccountPage.tsx", "Any PeteZah link ending in", "Any {{brand}} link ending in");

// ── feature copy ─────────────────────────────────────────────
rule("src/components/ExtensionsPage.tsx", `"[PeteZah extension]"`, `"[{{brand}} extension]"`);
rule("src/lib/bookmarklets.ts", `"[PeteZah bookmarklet]"`, `"[{{brand}} bookmarklet]"`);
rule("src/components/FirefoxVmPage.tsx", "PeteZah VM", "{{brand}} VM");
rule("src/components/FirefoxVmPage.tsx", "a real Gecko browser inside PeteZah.", "a real Gecko browser inside {{brand}}.");
rule("src/components/FirefoxVmPage.tsx", "PeteZah VMs", "{{brand}} VMs");
rule("src/components/FirefoxVmPage.tsx", "Use Exit on the VM splash to return to PeteZah", "Use Exit on the VM splash to return to {{brand}}");
// NOTE: upstream replaced the GameLaunchSplash + InterstitialAdGate brand lines
// with brand-neutral copy (2026-09-16) — no rules needed.
rule("src/components/SharedAiPage.tsx", "Open PeteZah", "Open {{brand}}");
rule("src/components/SvgAccessGate.tsx", `<p className="eyebrow">PeteZah</p>`, `<p className="eyebrow">{{brand}}</p>`);
rule("src/components/SvgAccessGate.tsx", "Secure access · PeteZah", "Secure access · {{brand}}");
rule("src/components/AppsPage.tsx", `label: "PeteAI"`, `label: "{{aiName}}"`);
rule("src/components/AppsPage.tsx", `label: "PeteChat"`, `label: "AndiChat"`);
rule("src/components/AdReportsPanel.tsx", "PeteZah overlay starts vs ExoClick", "{{brand}} overlay starts vs ExoClick");

// ── backend manifest / legal docs / verify mail / embed ──────
rule("backend/server.js", `name: 'PeteZah Games',`, `name: '{{brand}}',`);
rule("backend/server.js", `short_name: 'PeteZah',`, `short_name: '{{brand}}',`);
rule("backend/legal/pages.js", "<title>${escapeHtml(doc.title)} · PeteZah</title>", "<title>${escapeHtml(doc.title)} · {{brand}}</title>");
rule("backend/legal/documents.js", "the operators of PeteZah and related domains", "the operators of {{brand}} and related domains");
rule("backend/legal/documents.js", "1.1 PeteZah is offered as an anti-censorship", "1.1 {{brand}} is offered as an anti-censorship");
rule("backend/legal/documents.js", 'explains what information PeteZah (the "Service,"', 'explains what information {{brand}} (the "Service,"');
rule("backend/legal/documents.js", 'describes how PeteZah (the "Service,"', 'describes how {{brand}} (the "Service,"');
rule("backend/api/verify-email.js", `return 'https://petezahgames.com';`, `return '{{siteUrl}}';`);
rule("backend/api/verify-email.js", "Back to PeteZah", "Back to {{brand}}");
rule("public/embed.html", "<title>PeteZah</title>", "<title>{{brand}}</title>");
rule("public/embed.html", `|| "PeteZah"`, `|| "{{brand}}"`);
rule("backend/api/ad-reports.js", "restart PeteZah", "restart {{brand}}");
rule("backend/api/ad-reports.js", "Local PeteZah counts below still work.", "Local {{brand}} counts below still work.");
rule("backend/api/ad-reports.js", "Neither PeteZah nor ExoClick has counted", "Neither {{brand}} nor ExoClick has counted");
rule("backend/api/ad-reports.js", "PeteZah recorded ${oursToday}", "{{brand}} recorded ${oursToday}");
rule("backend/api/ad-reports.js", "`PeteZah ${oursToday} vs ExoClick", "`{{brand}} ${oursToday} vs ExoClick");
rule("public/firefox-wasm/README.md", "pm2 restart PeteZahGames", "pm2 restart {{brand}}", { required: false });
rule("public/firefox-wasm/README.md", "restores PeteZah shell UI", "restores {{brand}} shell UI", { required: false });

// ── README: fork notice + rebrand ────────────────────────────
{
  const p = "README.md";
  const fp = path.join(ROOT, p);
  let src = fs.readFileSync(fp, "utf8");
  const marker = "<!-- ANDIHUB-FORK-NOTICE -->";
  if (!src.includes(marker)) {
    const notice =
      `${marker}\n> **AndiHub** — modified fork of [PeteZahGames](${B.upstreamUrl}) by PeteZah, ` +
      `rebranded ${new Date().toISOString().slice(0, 10)}. Licensed **AGPL-3.0-only** (see LISCENSE). ` +
      `Upstream fixes are merged automatically via the sync-upstream workflow. Source: ${B.sourceUrl}.\n\n`;
    src = notice + src;
    fs.writeFileSync(fp, src);
    applied++;
  } else skipped++;
  for (const [find, rep] of [
    ["# **PeteZahGames**", `# **${B.brand}**`],
    ["PeteZah-Games/PeteZahGames", "xyraopsec/AndiHub"],
    ["PeteZah-Games/petezahgames", "xyraopsec/AndiHub"],
    ["PeteZah-G/PeteZahGames", "xyraopsec/AndiHub"],
    ["petezahgames.com", B.domain],
    ["discord.gg/unrestricted", B.discordInvite.replace("https://", "")],
    ["cd PeteZahGames", "cd AndiHub"],
    ["&name=petezahgames", "&name=andihub"],
  ]) {
    const cur = fs.readFileSync(fp, "utf8");
    if (!cur.includes(find)) {
      if (cur.includes(rep)) skipped++;
      else warnings.push(`skip README (not found): ${find.slice(0, 60)}`);
      continue;
    }
    fs.writeFileSync(fp, cur.split(find).join(rep));
    applied++;
  }
}

// ── logo ─────────────────────────────────────────────────────
{
  const src = path.join(ROOT, "branding", "logo.png");
  const dst = path.join(ROOT, "public", "logo.png");
  if (!fs.existsSync(src)) {
    warnings.push("skip logo: branding/logo.png missing");
  } else if (fs.existsSync(dst) && fs.readFileSync(src).equals(fs.readFileSync(dst))) {
    skipped++;
  } else {
    fs.copyFileSync(src, dst);
    applied++;
  }
}

console.log(`branding: applied=${applied} skipped=${skipped}`);
for (const w of warnings) console.log("warn:", w);
if (failures.length) {
  for (const f of failures) console.log("FAIL:", f);
  process.exit(1);
}
console.log("branding: OK");
