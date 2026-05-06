# SEO and Cloudflare Web Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. ALSO INVOKE the `dicode-site-development` skill before starting — it covers the Lit/Vite/VitePress conventions used in this repo.

**Goal:** Add complete SEO meta (OpenGraph, Twitter Card, JSON-LD, canonical, robots, sitemap) to both the landing page and the docs site, plus cookieless Cloudflare Web Analytics on both surfaces.

**Architecture:** Static markup additions only. No new components, no build pipeline changes. The landing page (`site/index.html`, Vite + Lit) and the docs site (`docs-src/`, VitePress) get parallel changes. A sitemap *index* at `/sitemap.xml` stitches together a hand-written `landing-sitemap.xml` and VitePress's auto-generated `/docs/sitemap.xml`. The Cloudflare Web Analytics beacon is a single `<script>` tag added to both surfaces, with the token hardcoded (it's a public-by-design identifier).

**Tech Stack:** Vite, Lit, VitePress, Cloudflare Pages, Cloudflare Web Analytics.

**Spec:** [docs/superpowers/specs/2026-05-06-seo-and-cf-analytics-design.md](../specs/2026-05-06-seo-and-cf-analytics-design.md)

**Worktree:** `/workspaces/dicode-site-worktrees/seo-and-analytics` on branch `feat/seo-and-analytics` (already created, spec already committed).

---

## Prerequisites before Task 6

- **Cloudflare Web Analytics beacon token** must be obtained from the Cloudflare dashboard:
  - Log into Cloudflare → Analytics & Logs → Web Analytics
  - Click "Add a site" → enter `dicode.app`
  - Copy the token from the generated `<script data-cf-beacon='{"token":"..."}'>` snippet
- The implementation can land Tasks 1–5 and 7 without this token. Task 6 is blocked until the token is provided. **Pause at the start of Task 6 and ask the user for the token if it is not already available.**

---

## File Structure

**Created files:**
- `site/public/og-image.svg` — OG card source SVG (1200×630)
- `site/public/og-image.png` — PNG export of `og-image.svg`
- `site/public/robots.txt` — allow-all crawler directive + sitemap pointer
- `site/public/sitemap.xml` — sitemap *index* referencing the two branches
- `site/public/landing-sitemap.xml` — single-URL sitemap for `/`

**Modified files:**
- `site/index.html` — head additions (OG, Twitter Card, canonical, robots, JSON-LD, beacon)
- `docs-src/.vitepress/config.ts` — `sitemap` config + extended `head[]` (OG, Twitter Card, beacon)
- `README.md` — one-line note for docs contributors about per-page `description:` frontmatter

**Conventional commit prefixes used:** `feat(landing):`, `feat(docs):`, `feat(site):`, `chore(docs):`.

---

## Task 1: Create the OpenGraph image asset

**Files:**
- Create: `site/public/og-image.svg`
- Create: `site/public/og-image.png`

**Goal:** A 1200×630 PNG link-preview card committed to source. Source SVG also committed so future contributors can re-export.

- [ ] **Step 1: Write the OG image SVG**

Create `site/public/og-image.svg` with this content (uses brand colors from `site/src/styles/theme.css`: `--bg` `#0d0d1a`, `--blue` `#0d6efd`, `--heading` `#ffffff`, `--muted` `#8b93a8`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
  OG card for dicode.app, 1200×630.
  To re-export PNG after edits:
    npx -y svgexport site/public/og-image.svg site/public/og-image.png 1200:630
-->
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#0d6efd" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="#0d6efd" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#0d0d1a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#0d0d1a"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- brand mark: scaled-up version of favicon.svg, top-left -->
  <g transform="translate(80, 80)">
    <rect width="96" height="96" rx="21" fill="#0d6efd"/>
    <path d="M60 18 L30 54 L45 54 L39 78 L66 39 L51 39 Z" fill="#ffffff"/>
  </g>

  <!-- wordmark next to the brand mark -->
  <text x="200" y="148" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        font-size="56" font-weight="700" fill="#ffffff" letter-spacing="-1">dicode</text>

  <!-- main headline -->
  <text x="80" y="340" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        font-size="72" font-weight="800" fill="#ffffff" letter-spacing="-2">You describe it.</text>
  <text x="80" y="430" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        font-size="72" font-weight="800" fill="#0d6efd" letter-spacing="-2">AI builds, ships, and fixes it.</text>

  <!-- subline -->
  <text x="80" y="510" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        font-size="32" font-weight="400" fill="#8b93a8">A task kernel with AI in the loop. Open source, free forever.</text>

  <!-- footer URL -->
  <text x="80" y="580" font-family="'Fira Code', 'Cascadia Code', ui-monospace, SFMono-Regular, monospace"
        font-size="24" font-weight="500" fill="#a0c4ff">dicode.app</text>
</svg>
```

- [ ] **Step 2: Render the SVG to PNG**

From the worktree root:

```bash
cd /workspaces/dicode-site-worktrees/seo-and-analytics
npx -y svgexport site/public/og-image.svg site/public/og-image.png 1200:630
```

Expected: command completes silently, `site/public/og-image.png` exists. `svgexport` uses puppeteer under the hood, so the first run downloads Chromium (~few seconds). If puppeteer download fails in this environment, fall back to:

```bash
npx -y @resvg/resvg-js-cli site/public/og-image.svg site/public/og-image.png --width 1200 --height 630
```

If both fail, ask the user — do not commit a missing or empty PNG.

- [ ] **Step 3: Verify the PNG is valid and the right size**

```bash
file site/public/og-image.png
```

Expected output contains: `PNG image data, 1200 x 630, 8-bit/color RGBA`.

- [ ] **Step 4: Commit**

```bash
git -C /workspaces/dicode-site-worktrees/seo-and-analytics add site/public/og-image.svg site/public/og-image.png
git -C /workspaces/dicode-site-worktrees/seo-and-analytics commit -m "$(cat <<'EOF'
feat(site): add OpenGraph card image

1200x630 PNG for link previews on Slack/Discord/LinkedIn/X. Source
SVG committed alongside; re-export instructions at the top of the SVG.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Add complete SEO meta to the landing page

**Files:**
- Modify: `site/index.html`

**Goal:** Replace the existing partial `<head>` SEO block with a complete one (canonical, robots, full OG, full Twitter Card, JSON-LD SoftwareApplication).

- [ ] **Step 1: Read the current head**

```bash
sed -n '1,40p' /workspaces/dicode-site-worktrees/seo-and-analytics/site/index.html
```

Confirm the existing `<title>`, `<meta name="description">`, `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:type">`, and `<link rel="icon">` lines are present. The new block replaces those (except `<link rel="icon">`) with a fuller set.

- [ ] **Step 2: Replace the existing meta block with the complete one**

Use the Edit tool to replace this exact block in `site/index.html`:

```html
  <title>dicode — Task kernel with AI that builds, ships, and fixes your automations</title>
  <meta name="description" content="You describe it, AI builds it, ships it, monitors it, and fixes it. A single binary task kernel where everything is a task — versioned in git, replaceable, auditable." />
  <meta property="og:title" content="dicode — You describe it. AI builds, ships, and fixes it." />
  <meta property="og:description" content="A task kernel with AI in the loop. Single binary, zero infrastructure, everything versioned in git. Open source, free forever." />
  <meta property="og:type" content="website" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

with:

```html
  <title>dicode — Task kernel with AI that builds, ships, and fixes your automations</title>
  <meta name="description" content="You describe it, AI builds it, ships it, monitors it, and fixes it. A single binary task kernel where everything is a task — versioned in git, replaceable, auditable." />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="https://dicode.app/" />

  <!-- OpenGraph -->
  <meta property="og:title" content="dicode — You describe it. AI builds, ships, and fixes it." />
  <meta property="og:description" content="A task kernel with AI in the loop. Single binary, zero infrastructure, everything versioned in git. Open source, free forever." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://dicode.app/" />
  <meta property="og:site_name" content="dicode" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:image" content="https://dicode.app/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="dicode — You describe it. AI builds, ships, and fixes it. Open source, free forever." />

  <!-- Twitter / X / Slack / Discord / LinkedIn link previews -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="dicode — You describe it. AI builds, ships, and fixes it." />
  <meta name="twitter:description" content="A task kernel with AI in the loop. Single binary, zero infrastructure, everything versioned in git. Open source, free forever." />
  <meta name="twitter:image" content="https://dicode.app/og-image.png" />

  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

  <!-- Structured data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "dicode",
    "description": "A task kernel with AI in the loop. Single binary, zero infrastructure, everything versioned in git. Open source, free forever.",
    "url": "https://dicode.app/",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Linux, macOS, Windows",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "sameAs": [
      "https://github.com/dicode-ayo/dicode-core"
    ]
  }
  </script>
```

- [ ] **Step 3: Verify the file still parses as HTML**

```bash
npx -y html-validate /workspaces/dicode-site-worktrees/seo-and-analytics/site/index.html 2>&1 | head -20
```

Expected: no fatal errors. Warnings about Lit custom elements (e.g. `<dc-nav>`) are fine and pre-existing — those are not introduced by this change. If `html-validate` is not installable in this environment, skip this step (Task 8 builds the project end-to-end).

- [ ] **Step 4: Commit**

```bash
git -C /workspaces/dicode-site-worktrees/seo-and-analytics add site/index.html
git -C /workspaces/dicode-site-worktrees/seo-and-analytics commit -m "$(cat <<'EOF'
feat(landing): complete OG, Twitter Card, canonical, JSON-LD

Adds canonical URL, robots directive, full OpenGraph meta (image, url,
site_name, locale), Twitter Card (summary_large_image, no twitter:site
since dicode has no X account), and JSON-LD SoftwareApplication
schema. Reuses og-image.png from the previous commit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Add robots.txt, sitemap index, and landing-page sitemap

**Files:**
- Create: `site/public/robots.txt`
- Create: `site/public/sitemap.xml`
- Create: `site/public/landing-sitemap.xml`

**Goal:** Crawler-discoverability files in the static `public/` directory. Vite copies these verbatim into the build root.

- [ ] **Step 1: Create `site/public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://dicode.app/sitemap.xml
```

- [ ] **Step 2: Create `site/public/sitemap.xml` (the sitemap *index*)**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://dicode.app/landing-sitemap.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://dicode.app/docs/sitemap.xml</loc>
  </sitemap>
</sitemapindex>
```

- [ ] **Step 3: Create `site/public/landing-sitemap.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://dicode.app/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

- [ ] **Step 4: Verify the XML is well-formed**

```bash
xmllint --noout /workspaces/dicode-site-worktrees/seo-and-analytics/site/public/sitemap.xml \
                /workspaces/dicode-site-worktrees/seo-and-analytics/site/public/landing-sitemap.xml
```

Expected: no output, exit code 0. If `xmllint` is unavailable, fall back to:

```bash
node -e "const x=require('fs').readFileSync(process.argv[1],'utf8'); new (require('xml2js')).Parser().parseString(x, e=>process.exit(e?1:0))" \
  /workspaces/dicode-site-worktrees/seo-and-analytics/site/public/sitemap.xml
```

If neither is available, skip — Task 8 catches malformed files when they 404 in the build output.

- [ ] **Step 5: Commit**

```bash
git -C /workspaces/dicode-site-worktrees/seo-and-analytics add site/public/robots.txt site/public/sitemap.xml site/public/landing-sitemap.xml
git -C /workspaces/dicode-site-worktrees/seo-and-analytics commit -m "$(cat <<'EOF'
feat(site): add robots.txt and sitemap index

Adds /robots.txt allowing all crawlers and pointing to /sitemap.xml,
which is a sitemap-index file referencing both /landing-sitemap.xml
(this single page) and /docs/sitemap.xml (auto-generated by VitePress
in Task 4).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Add VitePress sitemap generation

**Files:**
- Modify: `docs-src/.vitepress/config.ts`

**Goal:** Have VitePress emit `docs/docs/sitemap.xml` at build time. Served at `https://dicode.app/docs/sitemap.xml`.

- [ ] **Step 1: Edit `docs-src/.vitepress/config.ts` to add the `sitemap` field**

Use the Edit tool. Replace:

```ts
export default defineConfig({
  title: "dicode",
  description: "Documentation for the dicode task orchestrator",
  base: "/docs/",
  outDir: "../docs/docs",
  cleanUrls: true,
```

with:

```ts
export default defineConfig({
  title: "dicode",
  description: "Documentation for the dicode task orchestrator",
  base: "/docs/",
  outDir: "../docs/docs",
  cleanUrls: true,
  sitemap: {
    hostname: "https://dicode.app/docs/",
  },
```

- [ ] **Step 2: Build the docs site to verify the sitemap is emitted**

```bash
cd /workspaces/dicode-site-worktrees/seo-and-analytics
npm run build:docs
```

Expected: build completes; `docs/docs/sitemap.xml` exists.

- [ ] **Step 3: Confirm the sitemap is well-formed and lists pages**

```bash
ls -la /workspaces/dicode-site-worktrees/seo-and-analytics/docs/docs/sitemap.xml
head -20 /workspaces/dicode-site-worktrees/seo-and-analytics/docs/docs/sitemap.xml
```

Expected: file exists, starts with `<?xml version="1.0" encoding="UTF-8"?>`, contains `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` and at least one `<url><loc>https://dicode.app/docs/...` entry per markdown page under `docs-src/`.

- [ ] **Step 4: Commit**

```bash
git -C /workspaces/dicode-site-worktrees/seo-and-analytics add docs-src/.vitepress/config.ts
git -C /workspaces/dicode-site-worktrees/seo-and-analytics commit -m "$(cat <<'EOF'
feat(docs): emit sitemap.xml at build time

VitePress's built-in sitemap generation, scoped to dicode.app/docs/.
Served at https://dicode.app/docs/sitemap.xml and referenced by the
top-level sitemap index added in the previous commit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Add global OpenGraph + Twitter Card meta to the docs site

**Files:**
- Modify: `docs-src/.vitepress/config.ts`

**Goal:** Every docs page emits site-wide OG and Twitter Card meta. Per-page `<title>` and meta `description` continue to come from VitePress frontmatter — only the OG image and card type are global.

- [ ] **Step 1: Edit the `head` array in `docs-src/.vitepress/config.ts`**

Use the Edit tool. Replace:

```ts
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
  ],
```

with:

```ts
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    // OpenGraph (per-page og:title and og:description come from frontmatter)
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "dicode docs" }],
    ["meta", { property: "og:locale", content: "en_US" }],
    ["meta", { property: "og:image", content: "https://dicode.app/og-image.png" }],
    ["meta", { property: "og:image:width", content: "1200" }],
    ["meta", { property: "og:image:height", content: "630" }],
    ["meta", { property: "og:image:alt", content: "dicode — You describe it. AI builds, ships, and fixes it. Open source, free forever." }],
    // Twitter / X / Slack / Discord / LinkedIn link previews
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:image", content: "https://dicode.app/og-image.png" }],
  ],
```

- [ ] **Step 2: Rebuild docs and confirm a sample page contains the new tags**

```bash
cd /workspaces/dicode-site-worktrees/seo-and-analytics
npm run build:docs
grep -E '(og:image|twitter:card)' docs/docs/index.html | head -10
```

Expected output includes lines like:

```
<meta property="og:image" content="https://dicode.app/og-image.png">
<meta name="twitter:card" content="summary_large_image">
```

- [ ] **Step 3: Commit**

```bash
git -C /workspaces/dicode-site-worktrees/seo-and-analytics add docs-src/.vitepress/config.ts
git -C /workspaces/dicode-site-worktrees/seo-and-analytics commit -m "$(cat <<'EOF'
feat(docs): add global OG and Twitter Card meta

Adds site-wide og:type, og:site_name, og:locale, og:image (+width/
height/alt), twitter:card, and twitter:image to every docs page.
Per-page og:title and og:description are intentionally not set here —
VitePress emits them from each page's frontmatter, which is the
desired behavior for individual docs pages.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Add Cloudflare Web Analytics beacon to both surfaces

**Files:**
- Modify: `site/index.html`
- Modify: `docs-src/.vitepress/config.ts`

**Goal:** A single CF Web Analytics beacon `<script>` tag on both the landing page and every docs page. Token hardcoded.

- [ ] **Step 1: Confirm the beacon token**

If the user has not already provided the Cloudflare Web Analytics beacon token in the conversation, **stop here and ask for it.** The token is the value inside `data-cf-beacon='{"token":"..."}'` in the snippet on the Cloudflare dashboard. Do not invent or guess a token. Below, `<TOKEN>` is the placeholder — substitute the real value before saving.

- [ ] **Step 2: Add the beacon to `site/index.html`**

Use the Edit tool to replace:

```html
  <script type="module" src="/src/main.ts"></script>
</head>
```

with:

```html
  <script type="module" src="/src/main.ts"></script>
  <!-- Cloudflare Web Analytics — cookieless, no consent banner needed -->
  <script defer src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token":"<TOKEN>"}'></script>
</head>
```

- [ ] **Step 3: Add the beacon to the docs `head[]`**

Use the Edit tool on `docs-src/.vitepress/config.ts`. Replace:

```ts
    ["meta", { name: "twitter:image", content: "https://dicode.app/og-image.png" }],
  ],
```

with:

```ts
    ["meta", { name: "twitter:image", content: "https://dicode.app/og-image.png" }],
    // Cloudflare Web Analytics — cookieless, no consent banner needed
    [
      "script",
      {
        defer: "",
        src: "https://static.cloudflareinsights.com/beacon.min.js",
        "data-cf-beacon": '{"token":"<TOKEN>"}',
      },
    ],
  ],
```

(VitePress's `head` schema is `[tag, attrs]` tuples; `defer: ""` renders as the boolean attribute `defer`.)

- [ ] **Step 4: Build both surfaces and confirm the script is emitted**

```bash
cd /workspaces/dicode-site-worktrees/seo-and-analytics
npm run build
grep -l 'cloudflareinsights.com' docs/index.html docs/docs/index.html
```

Expected output: both files printed (each contains the beacon script). If only one is printed, the corresponding edit is missing.

- [ ] **Step 5: Commit**

```bash
git -C /workspaces/dicode-site-worktrees/seo-and-analytics add site/index.html docs-src/.vitepress/config.ts
git -C /workspaces/dicode-site-worktrees/seo-and-analytics commit -m "$(cat <<'EOF'
feat(site): add Cloudflare Web Analytics beacon

Adds the CF Web Analytics beacon script to both the landing page
(site/index.html) and the docs site (VitePress head[]). Cookieless,
no consent banner required. Token hardcoded — it's a public-by-design
identifier visible in any visitor's network tab.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Document the per-page description convention

**Files:**
- Modify: `README.md`

**Goal:** One-line note in the existing "Docs (`docs-src/`)" section telling contributors to set `description:` in frontmatter for new pages, so the docs site emits good per-page meta.

- [ ] **Step 1: Edit `README.md`**

Use the Edit tool to replace:

```
Standard VitePress conventions. Add a new concept page under `concepts/`, then list it in `.vitepress/config.ts` under the appropriate sidebar group.
```

with:

```
Standard VitePress conventions. Add a new concept page under `concepts/`, then list it in `.vitepress/config.ts` under the appropriate sidebar group. Set a `description:` field in the page's YAML frontmatter — VitePress emits it as `<meta name="description">` and `<meta property="og:description">`, which is what search engines and link previews use.
```

- [ ] **Step 2: Commit**

```bash
git -C /workspaces/dicode-site-worktrees/seo-and-analytics add README.md
git -C /workspaces/dicode-site-worktrees/seo-and-analytics commit -m "$(cat <<'EOF'
chore(docs): note per-page description frontmatter convention

VitePress emits the page's frontmatter description as both
meta description and og:description. Calling this out for new
contributors so the SEO meta added in this branch stays useful as
docs grow.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: End-to-end build verification

**Files:**
- None (verification only)

**Goal:** Confirm the full `npm run build` succeeds and emits all the expected files and tags.

- [ ] **Step 1: Clean build from a known-empty state**

```bash
cd /workspaces/dicode-site-worktrees/seo-and-analytics
rm -rf docs/docs docs/assets docs/index.html docs/og-image.png docs/og-image.svg docs/robots.txt docs/sitemap.xml docs/landing-sitemap.xml docs/favicon.svg
npm run build
```

Expected: both `vite build site` and `vitepress build docs-src` complete without errors.

- [ ] **Step 2: Verify static `public/` assets landed in the build**

```bash
ls -la docs/og-image.png docs/og-image.svg docs/robots.txt docs/sitemap.xml docs/landing-sitemap.xml docs/favicon.svg
```

Expected: all six files present (Vite copies `site/public/*` to the build root).

- [ ] **Step 3: Verify landing-page meta in the built `index.html`**

```bash
grep -cE 'og:image|twitter:card|application/ld\+json|cloudflareinsights\.com|rel="canonical"' docs/index.html
```

Expected: at least 5 (one match per category — there will likely be more because of og:image:width/height/alt).

- [ ] **Step 4: Verify VitePress sitemap and meta in the built docs**

```bash
ls -la docs/docs/sitemap.xml
grep -cE 'og:image|twitter:card|cloudflareinsights\.com' docs/docs/index.html
```

Expected: `sitemap.xml` exists; grep prints at least 3.

- [ ] **Step 5: Verify the sitemap index references both branches**

```bash
cat docs/sitemap.xml
```

Expected output exactly:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://dicode.app/landing-sitemap.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://dicode.app/docs/sitemap.xml</loc>
  </sitemap>
</sitemapindex>
```

- [ ] **Step 6: Spot-check the OG image renders correctly (manual)**

```bash
file docs/og-image.png
```

Expected: `PNG image data, 1200 x 630, ...`. Then optionally open the file in an image viewer or share the build preview URL into a Slack DM and confirm the link unfurl shows the card. This is a manual visual check; if it looks broken, return to Task 1 and adjust the SVG.

- [ ] **Step 7: No commit needed**

Verification only. If everything passed, the branch is ready for PR. If anything failed, return to the corresponding task.

---

## Post-implementation (manual, out of plan scope)

- Open a PR against `main`. The Cloudflare Pages preview workflow auto-comments with a URL.
- On the preview URL, run external validators:
  - [Twitter/X Card Validator](https://cards-dev.twitter.com/validator)
  - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
  - [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
  - [Google Rich Results Test](https://search.google.com/test/rich-results)
- After merge to `main` and production deploy, in CF dashboard → Web Analytics, confirm the beacon is firing (typically <5 min latency).
- Submit `https://dicode.app/sitemap.xml` to Google Search Console (one-time, separate task).

---

## Self-Review Checklist

Run after writing the plan, before handoff. (Done by the plan author, not the executor.)

**1. Spec coverage:**
- ✅ Section 1 (landing page SEO meta) → Task 2
- ✅ Section 2 (OG image asset) → Task 1
- ✅ Section 3 (docs sitemap + global head meta) → Tasks 4 & 5
- ✅ Section 4 (robots.txt + sitemap stitching) → Task 3
- ✅ Section 5 (CF Web Analytics) → Task 6
- ✅ Prerequisites note (CF beacon token) → called out in Task 6 Step 1 and at top of plan
- ✅ README contributor note → Task 7
- ✅ Testing section in spec → Task 8 covers build-output assertions; external validators listed in post-implementation section

**2. Placeholder scan:** `<TOKEN>` appears intentionally in Task 6 with explicit instruction to substitute the real value or stop and ask. No "TBD"/"TODO"/"implement later" remains.

**3. Type consistency:** Same OG image URL (`https://dicode.app/og-image.png`) used in Tasks 2, 5, 6. Same beacon URL (`https://static.cloudflareinsights.com/beacon.min.js`) used in Task 6 in both surfaces. File paths consistent throughout.
