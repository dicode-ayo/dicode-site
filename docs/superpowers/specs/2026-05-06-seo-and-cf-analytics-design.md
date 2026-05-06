# SEO and Cloudflare Web Analytics for dicode-site

**Status:** Draft
**Date:** 2026-05-06
**Scope:** `dicode-site` (landing page + docs)

## Goal

Make `dicode.app` discoverable and shareable, and add lightweight, cookieless visitor analytics — without introducing a consent banner.

## Surfaces affected

`dicode-site` ships two surfaces from one repo, both deployed to Cloudflare Pages:

- **Landing page** — Vite + Lit, source in `site/`, served at `/`.
- **Docs** — VitePress, source in `docs-src/`, served at `/docs/`.

Both need SEO meta and analytics coverage.

## Non-goals

- Google Analytics 4 (deferred — no current need for funnels/conversions/ad attribution).
- Cookie consent banner (not needed without cookies).
- Programmatic per-page OpenGraph cards (one global card is enough at this stage).
- Twitter `twitter:site` handle (no account exists).
- Search Console / Bing Webmaster verification (separate task; just DNS TXT records when chosen).

## Prerequisites

- **Cloudflare Web Analytics beacon token** — must be obtained from the Cloudflare dashboard (Analytics → Web Analytics → add site `dicode.app`) before implementation. The token is a public identifier (visible in any visitor's network tab) and will be hardcoded into source. Without it, section 5 below cannot land.
- **OG image asset** — produced as part of section 2 below. No external dependency.

## Design

### 1. Landing page SEO (`site/index.html`)

Add to `<head>` alongside the existing `<title>` / `<meta name="description">` / partial OG tags:

- `<link rel="canonical" href="https://dicode.app/">`
- `<meta name="robots" content="index,follow">`
- Complete OpenGraph:
  - `og:url` — `https://dicode.app/`
  - `og:site_name` — `dicode`
  - `og:locale` — `en_US`
  - `og:image` — `https://dicode.app/og-image.png`
  - `og:image:width` — `1200`
  - `og:image:height` — `630`
  - `og:image:alt` — short alt text describing the card
- Twitter Card:
  - `twitter:card` — `summary_large_image`
  - `twitter:title` — same as `og:title`
  - `twitter:description` — same as `og:description`
  - `twitter:image` — same as `og:image`
  - **No** `twitter:site` (no handle).
- Single JSON-LD `<script type="application/ld+json">` with **SoftwareApplication** schema:
  - `name` — `dicode`
  - `description` — same line as `og:description`
  - `url` — `https://dicode.app/`
  - `applicationCategory` — `DeveloperApplication`
  - `operatingSystem` — `Linux, macOS, Windows`
  - `offers` — `{ "@type": "Offer", "price": "0", "priceCurrency": "USD" }`
  - `sameAs` — `["https://github.com/dicode-ayo/dicode-core"]`

### 2. OpenGraph image asset

Produce two committed files in `site/public/`:

- `og-image.svg` — source, 1200×630, dark background using `theme.css` tokens (`--color-bg`, `--color-fg`), dicode wordmark, tagline "You describe it. AI builds, ships, and fixes it."
- `og-image.png` — 1200×630 PNG export of the SVG.

Re-export instructions go in an XML comment (`<!-- ... -->`) at the top of the SVG so future contributors know how to refresh the PNG (e.g. `npx svg-to-img og-image.svg og-image.png --width 1200`).

### 3. Docs SEO (`docs-src/.vitepress/config.ts`)

Two changes:

- **Sitemap** — add to `defineConfig`:
  ```ts
  sitemap: { hostname: "https://dicode.app/docs/" }
  ```
  VitePress generates `docs/docs/sitemap.xml` on build, listing every markdown page. No plugin needed.

- **Global head meta** — extend the existing `head` array with site-wide tags. Mirror the landing page set, scoped to the docs surface:
  - `og:type` (`website`), `og:site_name` (`dicode docs`), `og:locale` (`en_US`)
  - `og:image` (absolute: `https://dicode.app/og-image.png`), `og:image:width`, `og:image:height`, `og:image:alt`
  - `twitter:card` (`summary_large_image`), `twitter:image` (same absolute URL)
  - `og:title` and `og:description` are intentionally **not** set globally — VitePress emits per-page values from frontmatter, which is what we want for docs pages.

Add one short README note in `docs-src/` (or update the main README) telling contributors to set `description:` in the frontmatter for new pages.

### 4. robots.txt + sitemap stitching

Three new files under `site/public/` (copied verbatim into the build):

- **`robots.txt`**:
  ```
  User-agent: *
  Allow: /
  Sitemap: https://dicode.app/sitemap.xml
  ```

- **`sitemap.xml`** — sitemap *index* file (not a urlset):
  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap><loc>https://dicode.app/landing-sitemap.xml</loc></sitemap>
    <sitemap><loc>https://dicode.app/docs/sitemap.xml</loc></sitemap>
  </sitemapindex>
  ```

- **`landing-sitemap.xml`** — single-URL urlset for the landing page:
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

VitePress's auto-generated `docs/sitemap.xml` provides the docs branch automatically.

### 5. Cloudflare Web Analytics

Add the CF Web Analytics beacon `<script>` tag in two places:

- **Landing page** — just before `</head>` in `site/index.html`:
  ```html
  <script defer src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token":"<TOKEN>"}'></script>
  ```

- **Docs** — added to the `head` array in `docs-src/.vitepress/config.ts` so VitePress emits the same script on every docs page.

The token is a public-by-design identifier (visible in any user's network tab on page load). It is **hardcoded** into the source — no env var, no build-time injection. If it is ever rotated, both call sites update together in a single PR.

The Cloudflare Pages "Web Analytics" auto-injection toggle is intentionally **left off** to keep the integration tracked in git and reproducible across project re-creations.

### What CF Web Analytics gives us

- Pageviews, unique visitors, top pages, referrers, countries, devices, browsers, OS.
- Core Web Vitals (LCP, CLS, INP) per page, from real visitors.
- Page load timings (DNS, TCP, TLS, TTFB, render).
- No cookies, no fingerprinting → no consent banner required.
- Less ad-block evasion than GA — more accurate visitor counts.

### What it doesn't give us (and we accept)

- No funnels, custom events, audience segments, or retention cohorts. If/when we run paid acquisition or A/B tests, we revisit with GA4.

## File-level change summary

| File | Action | Purpose |
|---|---|---|
| `site/index.html` | edit | Complete OG, Twitter Card, canonical, JSON-LD, CF beacon |
| `site/public/og-image.svg` | new | OG card source |
| `site/public/og-image.png` | new | OG card 1200×630 PNG export |
| `site/public/robots.txt` | new | Allow all, point at sitemap index |
| `site/public/sitemap.xml` | new | Sitemap index referencing both branches |
| `site/public/landing-sitemap.xml` | new | Single-URL sitemap for `/` |
| `docs-src/.vitepress/config.ts` | edit | Add `sitemap`, extend `head` with OG/Twitter/beacon |
| `README.md` | edit | One-line note on per-page `description:` frontmatter |

## Testing

- `npm run build` — both surfaces build without warnings.
- Open `docs/` build output and grep for the new tags + beacon script in both `index.html` and a sample docs page.
- Verify `docs/docs/sitemap.xml` (auto-generated by VitePress) exists and is reachable at `/docs/sitemap.xml`; verify `docs/sitemap.xml` (the index) references it correctly.
- Manual: deploy a preview, then:
  - Run [Twitter/X Card Validator](https://cards-dev.twitter.com/validator), [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/), [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) against the preview URL — all should render the OG image.
  - Run [Google Rich Results Test](https://search.google.com/test/rich-results) — JSON-LD should parse as SoftwareApplication.
  - Open `/<preview>/sitemap.xml` and `/<preview>/robots.txt` in browser — both reachable, both well-formed.
  - In CF dashboard → Web Analytics → confirm beacon is firing for the preview URL within ~5 minutes.

## Rollout

Single PR. No flags, no migration. After merge: production deploy picks up automatically, and within a day search engines will see the sitemap. Submit `https://dicode.app/sitemap.xml` to Google Search Console as a follow-up (separate, manual step — not part of this work).
