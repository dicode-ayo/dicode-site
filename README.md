# dicode-site

Source for **[dicode.app](https://dicode.app)** — the marketing landing page and developer documentation for [dicode](https://github.com/dicode-ayo/dicode-core), the GitOps-native task orchestrator with AI generation.

- 🌐 **Live site:** https://dicode.app
- 📚 **Docs:** https://dicode.app/docs/
- 🛠 **Core repo:** https://github.com/dicode-ayo/dicode-core

## What's in here

```
site/         # marketing landing page (Vite + Lit web components)
docs-src/     # developer documentation (VitePress)
docs/         # production build output (deployed to Cloudflare Pages)
```

The landing page is a static set of [Lit](https://lit.dev) custom elements assembled in `site/index.html`. The docs site is a [VitePress](https://vitepress.dev) build of the markdown under `docs-src/`. Both ship from the same repo and deploy together.

## Running locally

You'll need **Node.js 22+** and **npm**.

```sh
git clone git@github.com:dicode-ayo/dicode-site.git
cd dicode-site
npm install
```

Then pick what you want to work on:

```sh
npm run dev          # landing page  → http://localhost:5173
npm run dev:docs     # docs site     → http://localhost:5173/docs/
```

Both have hot reload. Edits to component files, markdown, or theme tokens show up instantly.

To build the same artifact CI builds:

```sh
npm run build        # both, into ./docs/
npm run build:site   # landing page only
npm run build:docs   # docs only
```

## Project layout

### Landing page (`site/`)

```
site/
├── index.html              # element composition: <dc-hero>, <dc-runtimes>, …
├── src/
│   ├── main.ts             # entry: registers components, kicks off scroll reveal
│   ├── components/         # one Lit element per visual section
│   │   ├── dc-hero.ts
│   │   ├── dc-ai-control.ts
│   │   └── …
│   ├── styles/
│   │   ├── theme.css       # design tokens (colors, spacing, type, radii, shadows)
│   │   └── global.css      # global classes (.container, .section-title, .feature-card)
│   └── utils/
│       └── reveal.ts       # IntersectionObserver-driven scroll reveal
└── public/                 # static assets copied verbatim into the build
```

Components currently render into the **light DOM** (each component's `createRenderRoot` returns `this`) so document-level classes from `global.css` apply directly. The trade-off and the path forward are discussed in [issue #7](https://github.com/dicode-ayo/dicode-site/issues/7) — read it before introducing a new component CSS pattern.

### Docs (`docs-src/`)

```
docs-src/
├── index.md                # docs landing
├── getting-started/
├── concepts/
├── examples/
└── .vitepress/
    └── config.ts           # nav + sidebar
```

Standard VitePress conventions. Add a new concept page under `concepts/`, then list it in `.vitepress/config.ts` under the appropriate sidebar group.

## Deployment

- **Production** (`main` branch) → [Cloudflare Pages](https://dicode-site.pages.dev) → `https://dicode.app`. Workflow: `.github/workflows/production.yml`. Runs on every push to `main` that touches `site/`, `docs-src/`, or the workflow itself.
- **PR previews** → automatic per-branch URL like `https://<branch-slug>.dicode-site.pages.dev`. Workflow: `.github/workflows/preview.yml`. Posts a sticky comment with the URL on every PR push.

Both deployments use the same Cloudflare Pages project (`dicode-site`) and the same secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`).

## Contributing

PRs welcome. The flow:

1. **Fork or branch.** External contributors fork; maintainers branch directly off `main` (e.g. `feat/add-pricing-tier`, `docs/clarify-quickstart`).
2. **Make changes.** Use `npm run dev` to see them live.
3. **Commit using [Conventional Commits](https://www.conventionalcommits.org)** — e.g. `feat(landing): add comparison section`, `docs(concepts): rewrite the triggers page`, `fix(theme): correct dark-mode card border`. The history is consistent on this convention; please follow it.
4. **Open a PR** against `main`. The preview workflow will post a Cloudflare Pages URL on the PR within ~30 seconds. Use it to share visual changes with reviewers.
5. **Respond to review.** Push more commits to the same branch; the preview comment auto-updates in place.

### What kinds of changes need extra care

- **Adding a new landing-page section** — please add it to `site/index.html`'s element composition explicitly. Don't sneak in side-effect imports.
- **Adding tokens to `theme.css`** — keep the existing scale (`--space-*`, `--text-*`, `--radius*`). Don't introduce hardcoded `rem`/`px` in component CSS; reach for a token first.
- **Touching the scroll-reveal mechanism** — `src/utils/reveal.ts` runs a `document.querySelectorAll`. Anything that moves elements behind a shadow root will break it; see [issue #7](https://github.com/dicode-ayo/dicode-site/issues/7).
- **Editing CI workflows** — never interpolate user-controlled inputs (`github.head_ref`, PR titles, commit messages) directly into shell commands. Pass them through `env:` and sanitize first. The existing `preview.yml` shows the pattern.

### What's out of scope here

- **Product changes to dicode itself** belong in [dicode-core](https://github.com/dicode-ayo/dicode-core).
- **OAuth broker / relay changes** belong in [dicode-relay](https://github.com/dicode-ayo/dicode-relay).
- **Long-form docs about how dicode works** belong in `docs-src/concepts/` here, but **internal architecture / design docs** for the core product live in `dicode-core/docs/`.

## License

See the [dicode-core LICENSE](https://github.com/dicode-ayo/dicode-core/blob/main/LICENSE).
