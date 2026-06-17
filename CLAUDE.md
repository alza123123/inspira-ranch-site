# Inspira Ranch Website — Project Context for AI Agents

## Operating Principles (Apply to Every Task)

**The Core Question: "Does it work without me?"**
Rich Dad's test for every asset, every system, every piece of work. If something requires constant manual attention, it is a liability. If it runs while you sleep, it is an asset.

**B-Quadrant Mindset**
- Don't just make tasks faster — eliminate the need for the task entirely through systems
- Build assets, not just complete tasks
- Ship imperfect, iterate fast — a launched imperfect thing beats an unlaunched perfect one

**Applied to every task:**
1. Is this building an asset or just completing a task?
2. What's the mission / clear outcome?
3. What can be systemized or automated?
4. Are we writing for benefits (outcomes) or features (descriptions)?
5. What's the 1% improvement we can make?
6. Are we shipping something real, or still perfecting? Bias toward launching.
7. Does it pass the "does it work without you?" test?

---

## Project Overview

**Client:** Inspira Ranch LLC
**Live domain:** inspiraranch.us
**Staging/CDN:** main.inspira-ranch-1ss.pages.dev (Cloudflare Pages)
**Local files:** `/Users/sebas116/Desktop/alza-workflow/clients/inspira-ranch/website/`
**Deploy command:** `cd ~/Desktop/alza-workflow/clients/inspira-ranch/website && wrangler pages deploy . --project-name inspira-ranch --commit-dirty=true`

**Previous host:** Netlify (site ID: `2589a8da-4bcc-471f-a952-c492bcf0201a`) — account exceeded credit limit, now suspended. Do NOT attempt Netlify deploys.

**Current host:** Cloudflare Pages (project: `inspira-ranch`, account: `Jkwjzccfjc@privaterel...`)

---

## DNS / Routing Architecture (LIVE as of June 10, 2026)

`inspiraranch.us` is LIVE, served via a **Worker proxy** — do not "simplify" this without understanding why:

- **Two Cloudflare accounts are involved:**
  - `alzastrategy@gmail.com` account — owns the **zone** (DNS) for inspiraranch.us, plus a stale legacy Pages project `inspira-ranch` (subdomain `inspira-ranch.pages.dev`, old June 6 content — unused, domains unbound).
  - Private-relay account (`Jkwjzccfjc@privaterel...`) — owns the **deploy target** Pages project `inspira-ranch` (subdomain `inspira-ranch-1ss.pages.dev`). Wrangler on this Mac is logged into this account.
- Cloudflare does not support Pages custom domains when the DNS zone lives in a different account, so the domain is served by Worker `inspira-ranch-proxy` (alzastrategy account) on routes `inspiraranch.us/*` and `www.inspiraranch.us/*`, which proxies all requests to `https://main.inspira-ranch-1ss.pages.dev`.
- **Gotcha:** the `-1ss` project's production branch is NOT `main` — wrangler deploys to `main` are *preview* deployments, so the canonical `inspira-ranch-1ss.pages.dev` URL 404s ("Deployment Not Found"). Only the `main.` branch alias serves content; the Worker targets that alias. If the production branch is ever set to `main` (PATCH the project in the -1ss account), the Worker could target the canonical subdomain instead.
- DNS records: `CNAME @ → inspira-ranch-1ss.pages.dev` (proxied), `CNAME www → inspira-ranch-1ss.pages.dev` (proxied), `_dmarc` TXT, `_domainconnect` CNAME. The Worker routes intercept before the CNAME targets matter — but keep records proxied (orange cloud) or the Worker won't run.
- `_redirects` file (Cloudflare Pages) 301s `/elite.html → /elite/`, `/index-pro.html → /`, `/pages/blog.html → /blog.html`, plus security blocks: `/CLAUDE.md`, `/netlify/*`, `/.netlify/*`, `/netlify.toml`, `/package.json`, `/package-lock.json`, `/.gitignore`, `/.netlifyignore`, `/compliance-footer.html` all → `/` (none of these may be publicly readable).
- **Security (June 2026 audit):** The Worker also blocks the same paths (exact list + `/netlify/`, `/.netlify/`, `/.git` prefixes + any dotfile path segment except `.well-known`) AND injects security headers on every response (HSTS, nosniff, X-Frame-Options SAMEORIGIN, Referrer-Policy, Permissions-Policy). `_headers` file duplicates the headers at Pages level. The Worker protects inspiraranch.us instantly; `_redirects`/`_headers` protect the pages.dev URLs after deploy. `netlify/functions/chat.js` uses env vars only — no hardcoded secrets anywhere in the repo (verified).
- **The Worker also rewrites HTML responses** to append `?v=20260613` to bare `style.css` / `main|lang|animations.js` references — this cache-busts stale Netlify-era CSS/JS in visitor browsers (was causing a footer-nav overlay bug in Safari). Local HTML files now have `?v=20260613` baked in, so the rewrite is a no-op after the next deploy but harmless to keep. If CSS/JS change significantly again, bump the version in BOTH the HTML files and the Worker's `V` constant (Worker `inspira-ranch-proxy`, alzastrategy account).

**Deploys still work unchanged** (wrangler → -1ss project → `main` alias → Worker serves it live immediately; no cache purge needed).

- **Analytics (June 2026):** Cloudflare Web Analytics (cookieless RUM) is live — the Worker injects the beacon before `</body>` on every HTML response (site registered for host inspiraranch.us in the alzastrategy account; auto-install doesn't work through the Worker, hence manual injection). View stats: Cloudflare dashboard → Analytics & Logs → Web Analytics.
- **Monitoring:** a weekly scheduled task ("inspira-ranch-health-check", Mondays 8 AM, runs in Claude's Cowork app on this Mac) checks uptime, key pages, security blocks, the analytics beacon, and the i18n system on the live site.
- **AI chatbot (June 2026):** bilingual venue assistant live at `POST /api/chat` on the Worker — Cloudflare Workers AI (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`, `AI` binding, free tier), using the full system prompt + 40 Q&A from the legacy `netlify/functions/chat.js` (lazy-loaded by the Worker from the immutable pre-`_redirects` deployment URL `b9d6b391.inspira-ranch-1ss.pages.dev` — do NOT delete that deployment). Front-end widget: `js/chat.js` (the chatbot/widget.js from the client folder, endpoint repointed to `/api/chat`), auto-injected on every page by the Worker before `</body>`. To upgrade the model to Claude later: add an `ANTHROPIC_API_KEY` secret binding and swap the `env.AI.run` call.
- **Lead capture (June 2026):** every form submit also POSTs a JSON copy to `/api/lead` (capture-phase listener at the top of `js/main.js`, fire-and-forget — never blocks EmailJS). The Worker stores leads in KV namespace `inspira-ranch-leads` (alzastrategy account, binding `LEADS`, 1-year TTL, honeypot field `_hp` ignored). `GET /api/leads?since_ms=...` returns recent leads — requires a Bearer token (stored in the Worker code and in the "inspira-ranch-lead-digest" scheduled task, Mondays 8:15 AM). EmailJS remains the primary notification path; KV is the never-lose-a-lead backup log.

---

## Tech Stack

- **Pure static site** — HTML/CSS/JS, no build step, no framework
- **CSS:** `css/style.css` (custom, ~2000 lines) + Tailwind CDN JIT (compliance components only)
- **Fonts:** Playfair Display + Inter (Google Fonts)
- **JS:** `js/main.js` (nav, forms, reviews filter), `js/lang.js` (bilingual i18n), `js/animations.js`
- **Email:** EmailJS v4 — service `service_cl8m9x2`, templates `template_79emf1y` (notification) + `template_k8rstei` (autoreply), public key `lN5yVQBZhXHScSNmF`
- **Netlify function (legacy):** `netlify/functions/chat.js` — not used in production

**Brand colors:**
- Navy: `#0D1B3E`
- Gold: `#C9A02E`
- Dark: `#080C14`
- Light/Off-white: `#F5F0E8`

---

## Bilingual System

Three i18n systems coexist — all must be maintained:

**System 1 — `data-key` attributes** (most page content)
- Resolved by `js/lang.js` which has a `translations` object with `{ en, es }` for every key
- Elements: `<span data-key="hero.h1">`, `<input data-key-placeholder="contact.form.name.placeholder">`

**System 2 — Inline `lang` CSS classes** (testimonials, compliance footer)
- Elements: `<span class="lang en">English text</span><span class="lang es">Spanish text</span>`
- CSS in `style.css` lines 162–164: `body.show-en .lang.es { display:none }` / `body.show-es .lang.en { display:none }`
- `lang.js` adds `show-en` or `show-es` to `<body>` on load and on toggle

**System 3 — dictionary i18n** (everything else: cookie banner, a11y toolbar, compliance footer chrome, blog post bodies not in spans, image `alt`s, `aria-label`s, `placeholder`s, `title` attrs, `<title>` tags)
- Three EN→ES dictionaries at the bottom of `js/lang.js`: `textI18n` (text nodes), `attrI18n` (attributes), `titleI18n` (document titles)
- `applyLang()` runs `translateTextNodes/translateAttrs/translateDocTitle`: a TreeWalker swaps any text node whose trimmed content matches a `textI18n` key (originals memoized in `__i18nTextOrig`); attributes get originals stored in `data-i18n-<attr>`; `<title>` original stored in `data-i18n-doctitle` on `<html>`
- Walker skips nodes inside `[data-key]` elements and `.lang` spans, so the three systems never fight
- **When adding ANY new English text to a page:** either give it a `data-key` + translations entry, wrap it in `.lang en/es` spans, or add the exact string to the right dictionary. The audit rule: no visible English string may exist outside all three systems.
- Form `value` attributes (option values like `platino`, `wedding`) are machine data — never translate them; translate the visible option label instead.
- Redirect stubs (`elite.html`, `index-pro.html`, `pages/blog.html`) load no JS — their text is statically bilingual ("Redirecting to / Redirigiendo a").

**Language toggle:** Button `id="langBtn"` in nav, calls `toggleLang()` from `lang.js`. Persists to `localStorage` key `ir_lang`. Also sets `document.documentElement.lang`.

---

## File Map

### Root
| File | Purpose |
|------|---------|
| `index.html` | Homepage — hero, services grid, packages, testimonials (3 real video reviews), contact form with EmailJS |
| `blog.html` | Blog listing page — 4 post cards with filter |
| `compliance-footer.html` | Standalone compliance footer template (reference only, not served) |
| `elite.html` | Legacy placeholder — redirects to elite/index.html |
| `elite/index.html` | Premium "Elite" landing page — GSAP + ScrollTrigger + Lenis animations, white birds + water shimmer effects. DO NOT modify layout. |
| `index-pro.html` | Legacy pro page — not in active use |
| `sitemap.xml` | XML sitemap for SEO |
| `robots.txt` | Crawler rules |
| `netlify.toml` | Netlify build config (legacy, still present) — `publish = "."`, `functions = "netlify/functions"` |
| `.netlifyignore` | Excludes node_modules, .netlify, .DS_Store from Netlify deploys |
| `.gitignore` | Standard git ignores |
| `package.json` | Node deps for Netlify function only |

### `pages/`
| File | Purpose |
|------|---------|
| `pages/about.html` | About page — team (Melecio, Claudia, Bianca, Sebastian Ortega), story, values, property gallery |
| `pages/services.html` | Services & packages — Platino, Oro, Plata, Bronce packages; Konfronta conferences; lodging |
| `pages/contact.html` | Contact page — EmailJS form (service_cl8m9x2 / template_79emf1y / template_k8rstei), FAQ |
| `pages/booking.html` | Booking form with package selector |
| `pages/reviews.html` | Reviews page — 5 real video testimonials at top + 45 existing review cards; Schema.org Review JSON-LD; `reviewCount: 50` |
| `pages/houston-venue.html` | SEO landing page for Houston-area searches — distances, why us, events |
| `pages/privacy-policy.html` | Privacy policy (fully bilingual via data-key) |
| `pages/terms.html` | Terms of service (fully bilingual via data-key) |
| `pages/blog.html` | Blog index (pages/ version) |

### `posts/`
| File | Purpose |
|------|---------|
| `posts/best-livingston-event-venue.html` | Blog post: Best Livingston Event Venue |
| `posts/top-wedding-venues-near-houston.html` | Blog post: Top Wedding Venues Near Houston |
| `posts/quinceanera-venues-east-texas.html` | Blog post: Best Quinceañera Venues East Texas |
| `posts/event-venue-livingston-tx.html` | Blog post: Planning an Event in Livingston TX |
| `posts/post-template.html` | Template for new posts — copy this when adding posts |

### `css/`
| File | Purpose |
|------|---------|
| `css/style.css` | Main stylesheet (~2000+ lines). Contains nav, footer, all page sections, lang system, mobile responsive. Key rule: `footer nav, nav.footer-nav { position: static !important }` prevents compliance footer navs from inheriting `nav { position: fixed }` |

### `js/`
| File | Purpose |
|------|---------|
| `js/main.js` | Nav scroll behavior, hamburger menu, form validation fallback, package selector, reviews filter, hero scroll hint |
| `js/lang.js` | Full bilingual system — `translations` object with all EN/ES strings, `applyLang()`, `toggleLang()`, DOMContentLoaded init, localStorage persistence |
| `js/animations.js` | Scroll-triggered fade-in animations (IntersectionObserver) |

### `img/`
| Directory | Contents |
|-----------|---------|
| `img/live/` | **Production images** — venue photos (`venue-02.jpg` through `venue-20.jpg`), casa photos (`casa-00.jpg` through `casa-11.jpg`), apartment photos (`Apartamento-01.JPG` through `Apartamento-10.jpg`), gallery photos (`A-8.jpg` through `A-75.jpg`), testimonial/event photos (`T-1.jpg` through `T-62.jpg`), `Venue-01.JPG` |
| `img/Downloads/` | Raw downloaded photos — not yet organized/optimized for production. Contains ~80 PHOTO-2026-05-17 JPGs and `event-carriage.jpg` |
| `img/album-d460253150-downloads-pt1/` | Original album downloads — `A-1.jpg` through `A-38.jpg`, sub-album `album-d460900028-downloads/T-1.jpg` through `T-62.jpg`, `inspiraimg/` with 6 DSC/Mill Gate photos |
| `img/logo-full.png` | Full logo (used in nav and footer) |
| `img/logo-monogram.png` | Monogram logo |

### `netlify/functions/`
| File | Purpose |
|------|---------|
| `netlify/functions/chat.js` | Legacy Netlify function — AI chat handler. Not actively used in production. |

---

## Compliance Footer (All Pages)

Every page has the same compliance footer block marked with:
`<!-- ════ COMPLIANCE FOOTER — WCAG 2.1 AA · ADA · GDPR · CCPA ════ -->`

Structure: 4-column grid (Brand/Address, Quick Links, Legal, Privacy Rights) + Compliance Disclosures + Bottom Bar.

All text is bilingual using System 2 (`<span class="lang en">` / `<span class="lang es">`).

**Critical CSS rule in `style.css`:**
```css
footer nav, nav.footer-nav {
  position: static !important;
  /* ... */
}
```
This prevents the global `nav { position: fixed }` from breaking footer nav elements.

Compliance components also include:
- Cookie consent banner (`id="cookie-banner"`) — GDPR Art.7 / CCPA §1798.120
- A11Y toolbar (`id="a11y-toolbar"`) — high contrast, font size controls
- GPC signal detection (`navigator.globalPrivacyControl`)
- Inline compliance JS before `</body>` on every page

---

## Real Video Testimonials (Added June 2026)

Source: `Livingston_Venue_Reviews_Portfolio.pdf`

**Homepage (`index.html`)** — 3 testimonials replacing placeholders:
1. Carla H. & Carlos M. — Houston, TX (traveled from Houston, amazed by venue)
2. Edmundo H. & Vianey C. — first video testimonial, spacious/pool/fountain
3. Adelayda Rivas — beautiful place in Livingston, perfect for events

**Reviews page (`pages/reviews.html`)** — 5 cards at top of grid + Schema.org JSON-LD:
1. Rogelio de Jesús — Livingston, TX
2. Carla Hurtado & Carlos Macías — Houston, TX
3. Adelayda Rivas
4. Edmundo Hernández & Vianey Conner
5. Leticia

`reviewCount` in JSON-LD updated from 45 → 50.

---

## Schema.org / SEO

`index.html` has `EventVenue + LocalBusiness` JSON-LD.
`pages/reviews.html` has `Review` objects for all 5 video testimonials.
All pages have canonical, og:*, meta description tags.

---

## Known Issues / Pending

All previous pending items resolved June 10, 2026:
1. ~~DNS not switched~~ — DONE. Live via Worker proxy (see DNS/Routing Architecture above).
2. ~~Translation verification~~ — DONE. Verified on live site: all 414 lang.js keys have EN+ES; Spanish toggle shows 35/35 footer `.lang.es` spans, 0 EN leaks.
3. ~~pages/blog.html footer~~ — N/A. File is a meta-redirect to `/blog.html` (which has the compliance footer); `_redirects` also 301s it.
4. ~~elite.html (root)~~ — DONE. Converted to redirect stub → `/elite/` + 301 in `_redirects`.
5. ~~index-pro.html~~ — DONE. Converted to redirect stub → `/` + 301 in `_redirects`.

Remaining (optional, low priority):
- Set the -1ss Pages project's production branch to `main` (requires API/dashboard access to the private-relay account) so the canonical pages.dev URL works; Worker proxy makes this non-urgent.
- Consider migrating the Pages project into the alzastrategy account long-term so the Worker proxy can be retired (one account for zone + Pages).

---

## Deployment Workflow

**Every deploy:**
```bash
cd ~/Desktop/alza-workflow/clients/inspira-ranch/website
wrangler pages deploy . --project-name inspira-ranch --commit-dirty=true
```

**Wrangler is logged in** on the local Mac (OAuth via `wrangler login`, private-relay account). Token stored at `~/Library/Preferences/.wrangler/config/default.toml` (macOS path; the old `~/.wrangler/...` path no longer exists). Note: the wrangler OAuth token has `pages:write` + `zone:read` only — it canNOT edit DNS records.

**After deploy:** The deploy lands on the `main` branch alias (`main.inspira-ranch-1ss.pages.dev`), which the `inspira-ranch-proxy` Worker serves at inspiraranch.us immediately. No cache purge needed. If something looks stale, purge via Cloudflare dashboard (alzastrategy@gmail.com login) → inspiraranch.us → Caching → Purge Everything.

---

## Business Info

- **Venue:** 638 Mill Gate Rd, Entrance 2, Livingston, TX 77351
- **Phone:** +1 (832) 451-5923
- **Email:** marketing@konfronta.mx
- **Owner/Founder:** Melecio Ortega
- **Team:** Claudia Ortega (Operative Director), Bianca Ortega (Head of Marketing), Sebastian Ortega (Social Media)
- **Capacity:** 14 private acres
- **Packages:** Platino, Oro, Plata, Bronce (pricing by consultation)
- **Conferences:** Konfronta Business Conferences (Retiro Empresarial, Ventas con IA, Konfronta Mindset)
