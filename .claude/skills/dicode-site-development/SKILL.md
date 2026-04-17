---
name: dicode-site-development
description: Use when building, modifying, or debugging the dicode marketing site — Lit web components, Vite dev server, VitePress docs, theme system, visual verification with Playwright MCP
---

# dicode-site Development

## Overview

dicode-site is a static marketing/landing page built with **Lit 3 web components** and **Vite**, plus **VitePress** for `/docs/`. All components render into the light DOM (no Shadow DOM) and share a global design system via CSS custom properties.

## Project Structure

```
site/
  index.html              # Single-page landing — custom elements in order
  theme.html              # Design system showcase page
  public/favicon.svg
  src/
    main.ts               # Imports all components + init theme/reveal
    theme-main.ts         # Theme showcase page entry
    styles/
      theme.css           # Design system tokens (colors, spacing, radii, shadows, z-index)
      global.css          # Shared layout, buttons, cards, code blocks, reveal animations
    utils/
      theme.ts            # Dark/light toggle, localStorage persistence
      reveal.ts           # IntersectionObserver scroll-reveal
      icon.ts             # renderIcon() — renders @iconify-icons as inline SVG
    components/
      dc-*.ts             # One file per section (dc-hero, dc-download, dc-nav, etc.)
docs-src/                 # VitePress docs source
```

## Component Pattern

Every component follows the same pattern:

```typescript
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("dc-example")
export class DcExample extends LitElement {
  // Light DOM — no shadow root, styles use global CSS + scoped selectors
  protected createRenderRoot() { return this; }

  render() {
    return html`
      <style>
        dc-example .my-class { /* scoped via element name prefix */ }
      </style>
      <section id="example">
        <div class="container">
          <p class="section-label reveal">Label</p>
          <h2 class="section-title reveal">Title</h2>
          <p class="section-sub reveal">Subtitle</p>
          <!-- content -->
        </div>
      </section>
    `;
  }
}
```

**Key conventions:**
- Light DOM (`createRenderRoot` returns `this`) — no Shadow DOM
- Styles scoped by prefixing selectors with the element name: `dc-download .download-card`
- Section layout: `section > .container > .section-label + .section-title + .section-sub + content`
- Scroll reveal: add `reveal` class for fade-up, `stagger` on grids for sequential entrance
- Icons: use `renderIcon(iconData, { adaptive: true })` for brand icons that need dark-mode inversion
- Register in `site/src/main.ts` and add `<dc-example>` to `site/index.html`

## Design System

All tokens live in `site/src/styles/theme.css`. Use CSS custom properties — never hardcode colors.

| Token | Purpose |
|-------|---------|
| `--bg`, `--bg-alt` | Page backgrounds |
| `--card-bg` | Card surfaces |
| `--heading`, `--text`, `--muted` | Text hierarchy |
| `--blue`, `--sky` | Primary / accent |
| `--border`, `--border-strong` | Borders |
| `--radius` | Card border radius (14px) |
| `--code-bg`, `--code-text`, `--code-*` | Code block theming |

Dark mode is default. Light mode via `[data-theme="light"]` override block in theme.css.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server on :5173 (landing page) |
| `npm run dev:docs` | VitePress dev server (docs) |
| `npm run build` | Build both site + docs |
| `npm run build:site` | Build landing page only |
| `npm run build:docs` | Build VitePress docs only |

## Visual Verification with Playwright MCP

Chrome is pre-installed in the devcontainer. Use Playwright MCP tools to verify visual changes:

```
1. Start dev server:     npm run dev  (or npm run dev:docs)
2. Navigate:             browser_navigate → http://localhost:5173/#section-id
3. Snapshot (preferred): browser_snapshot — accessibility tree, fast, actionable
4. Screenshot:           browser_take_screenshot — visual proof (use jpeg for speed)
5. Interact:             browser_click, browser_fill_form — test interactive elements
```

**Navigate to sections** using hash anchors matching section `id` attributes:
`#hero`, `#how`, `#gitops`, `#code`, `#runtimes`, `#security`, `#download`, `#deploy`

**Snapshot is preferred over screenshot** — it returns the accessibility tree which is structured, searchable, and doesn't time out on font loading.

## Adding a New Section

1. Create `site/src/components/dc-my-section.ts` following the component pattern above
2. Import in `site/src/main.ts`
3. Add `<dc-my-section>` in `site/index.html` at the desired position
4. Add `dc-my-section` to the custom elements display block rule in `global.css`
5. Start dev server, navigate to the section, and verify with `browser_snapshot`
