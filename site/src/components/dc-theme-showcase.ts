import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

// ─── DATA ──────────────────────────────────────────────────────────────────

interface Swatch {
  name: string;
  value: string;
  description: string;
}

const SWATCHES: { category: string; items: Swatch[] }[] = [
  {
    category: "Backgrounds",
    items: [
      { name: "--dicode-bg", value: "var(--dicode-bg)", description: "Page background" },
      { name: "--dicode-bg-alt", value: "var(--dicode-bg-alt)", description: "Alternate section" },
      { name: "--dicode-bg-accent", value: "var(--dicode-bg-accent)", description: "Third tier / gradient stop" },
      { name: "--dicode-card-bg", value: "var(--dicode-card-bg)", description: "Card surface" },
      { name: "--dicode-overlay-bg", value: "var(--dicode-overlay-bg)", description: "Modal/sheet overlay" },
    ],
  },
  {
    category: "Foreground",
    items: [
      { name: "--dicode-text", value: "var(--dicode-text)", description: "Body text" },
      { name: "--dicode-heading", value: "var(--dicode-heading)", description: "Headings h1-h6" },
      { name: "--dicode-muted", value: "var(--dicode-muted)", description: "Secondary text / labels" },
      { name: "--dicode-lavender", value: "var(--dicode-lavender)", description: "Tertiary accent text" },
    ],
  },
  {
    category: "Brand",
    items: [
      { name: "--dicode-blue", value: "var(--dicode-blue)", description: "Primary action" },
      { name: "--dicode-blue2", value: "var(--dicode-blue2)", description: "Primary hover" },
      { name: "--dicode-sky", value: "var(--dicode-sky)", description: "Accent text, pills, tags" },
      { name: "--dicode-green", value: "var(--dicode-green)", description: "Success" },
      { name: "--dicode-yellow", value: "var(--dicode-yellow)", description: "Warning" },
      { name: "--dicode-red", value: "var(--dicode-red)", description: "Error / destructive" },
    ],
  },
  {
    category: "Borders",
    items: [
      { name: "--dicode-border", value: "var(--dicode-border)", description: "Default border" },
      { name: "--dicode-border-strong", value: "var(--dicode-border-strong)", description: "Hover/focus border" },
      { name: "--dicode-border-dashed", value: "var(--dicode-border-dashed)", description: "Special/dashed" },
    ],
  },
  {
    category: "Tints",
    items: [
      { name: "--dicode-blue-tint", value: "var(--dicode-blue-tint)", description: "Icon bg, callouts" },
      { name: "--dicode-blue-tint-strong", value: "var(--dicode-blue-tint-strong)", description: "Stronger blue tint" },
    ],
  },
  {
    category: "Code blocks",
    items: [
      { name: "--dicode-code-bg", value: "var(--dicode-code-bg)", description: "Code block background" },
      { name: "--dicode-code-text", value: "var(--dicode-code-text)", description: "Code block text" },
      { name: "--dicode-code-kw", value: "var(--dicode-code-kw)", description: "Keywords" },
      { name: "--dicode-code-str", value: "var(--dicode-code-str)", description: "Strings" },
      { name: "--dicode-code-cmt", value: "var(--dicode-code-cmt)", description: "Comments" },
      { name: "--dicode-code-fn", value: "var(--dicode-code-fn)", description: "Functions" },
      { name: "--dicode-code-num", value: "var(--dicode-code-num)", description: "Numbers" },
      { name: "--dicode-code-prop", value: "var(--dicode-code-prop)", description: "Properties" },
    ],
  },
];

const SPACING = [
  { name: "--dicode-space-xs", px: "4px" },
  { name: "--dicode-space-sm", px: "8px" },
  { name: "--dicode-space-md", px: "16px" },
  { name: "--dicode-space-lg", px: "24px" },
  { name: "--dicode-space-xl", px: "32px" },
  { name: "--dicode-space-2xl", px: "48px" },
  { name: "--dicode-space-3xl", px: "64px" },
  { name: "--dicode-space-4xl", px: "96px" },
  { name: "--dicode-space-5xl", px: "128px" },
];

const RADII = [
  { name: "--dicode-radius-sm", px: "6px" },
  { name: "--dicode-radius-md", px: "10px" },
  { name: "--dicode-radius", px: "14px" },
  { name: "--dicode-radius-lg", px: "20px" },
  { name: "--dicode-radius-pill", px: "9999px" },
];

const CONTROL_SIZES = [
  { name: "--dicode-control-size-sm", px: "28px", icon: "--dicode-icon-size-sm" },
  { name: "--dicode-control-size", px: "32px", icon: "--dicode-icon-size" },
  { name: "--dicode-control-size-lg", px: "40px", icon: "--dicode-icon-size-lg" },
];

const SHADOWS = [
  { name: "--dicode-shadow-sm" },
  { name: "--dicode-shadow" },
  { name: "--dicode-shadow-card" },
  { name: "--dicode-shadow-strong" },
  { name: "--dicode-shadow-glow" },
  { name: "--dicode-shadow-glow-lg" },
];

const TYPOGRAPHY = [
  { name: "--dicode-text-xs", size: "11.5px" },
  { name: "--dicode-text-sm", size: "13px" },
  { name: "--dicode-text-base", size: "14.4px" },
  { name: "--dicode-text-md", size: "16px" },
  { name: "--dicode-text-lg", size: "18.4px" },
  { name: "--dicode-text-xl", size: "22.4px" },
  { name: "--dicode-text-2xl", size: "28.8px" },
  { name: "--dicode-text-3xl", size: "38.4px" },
];

// ─── COMPONENT ─────────────────────────────────────────────────────────────

@customElement("dc-theme-showcase")
export class DcThemeShowcase extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-theme-showcase .ts-header {
          padding: 100px 2rem 60px; text-align: center;
          border-bottom: 1px solid var(--dicode-border);
        }
        dc-theme-showcase .ts-header h1 {
          font-size: var(--dicode-text-5xl); font-weight: var(--dicode-font-extrabold);
          color: var(--dicode-heading); letter-spacing: var(--dicode-tracking-tight);
          margin-bottom: 1rem;
        }
        dc-theme-showcase .ts-header p {
          color: var(--dicode-muted); font-size: var(--dicode-text-lg);
          max-width: 640px; margin: 0 auto 2rem;
        }
        dc-theme-showcase .ts-header .ts-actions {
          display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;
        }

        dc-theme-showcase .ts-section {
          padding: var(--dicode-space-4xl) var(--dicode-space-xl);
          border-bottom: 1px solid var(--dicode-border);
        }
        dc-theme-showcase .ts-section:nth-child(even) {
          background: var(--dicode-bg-alt);
        }
        dc-theme-showcase .ts-section > .container { max-width: 1120px; margin: 0 auto; }
        dc-theme-showcase .ts-label {
          font-size: var(--dicode-text-xs); font-weight: var(--dicode-font-bold);
          color: var(--dicode-blue); text-transform: uppercase;
          letter-spacing: var(--dicode-tracking-wider); margin-bottom: var(--dicode-space-sm);
        }
        dc-theme-showcase .ts-title {
          font-size: var(--dicode-text-3xl); font-weight: var(--dicode-font-extrabold);
          color: var(--dicode-heading); letter-spacing: var(--dicode-tracking-tight);
          margin-bottom: var(--dicode-space-sm);
        }
        dc-theme-showcase .ts-sub {
          color: var(--dicode-muted); font-size: var(--dicode-text-md);
          max-width: 640px; margin-bottom: var(--dicode-space-2xl);
        }

        /* Swatches */
        dc-theme-showcase .ts-swatch-category {
          margin-bottom: var(--dicode-space-2xl);
        }
        dc-theme-showcase .ts-swatch-category h3 {
          font-size: var(--dicode-text-lg); font-weight: var(--dicode-font-bold);
          color: var(--dicode-heading); margin-bottom: var(--dicode-space-md);
        }
        dc-theme-showcase .ts-swatch-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: var(--dicode-space-md);
        }
        dc-theme-showcase .ts-swatch {
          background: var(--dicode-card-bg); border: 1px solid var(--dicode-border);
          border-radius: var(--dicode-radius); overflow: hidden;
          transition: var(--dicode-transition);
          cursor: pointer;
        }
        dc-theme-showcase .ts-swatch:hover {
          border-color: var(--dicode-border-strong);
          transform: translateY(-2px);
          box-shadow: var(--dicode-shadow);
        }
        dc-theme-showcase .ts-swatch-preview {
          height: 80px;
          border-bottom: 1px solid var(--dicode-border);
        }
        dc-theme-showcase .ts-swatch-info {
          padding: var(--dicode-space-md);
        }
        dc-theme-showcase .ts-swatch-name {
          font-family: var(--dicode-font-mono); font-size: var(--dicode-text-sm);
          color: var(--dicode-sky); font-weight: var(--dicode-font-semibold);
          margin-bottom: var(--dicode-space-xs);
        }
        dc-theme-showcase .ts-swatch-desc {
          font-size: var(--dicode-text-xs); color: var(--dicode-muted);
        }

        /* Spacing ruler */
        dc-theme-showcase .ts-spacing-row {
          display: flex; align-items: center; gap: var(--dicode-space-md);
          margin-bottom: var(--dicode-space-sm);
        }
        dc-theme-showcase .ts-spacing-label {
          font-family: var(--dicode-font-mono); font-size: var(--dicode-text-sm);
          color: var(--dicode-sky); min-width: 140px;
        }
        dc-theme-showcase .ts-spacing-px {
          color: var(--dicode-muted); font-size: var(--dicode-text-xs);
          font-family: var(--dicode-font-mono); min-width: 60px;
        }
        dc-theme-showcase .ts-spacing-bar {
          height: 20px; background: var(--dicode-blue-tint-strong);
          border: 1px solid var(--dicode-blue);
          border-radius: var(--dicode-radius-sm);
        }

        /* Radii */
        dc-theme-showcase .ts-radius-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: var(--dicode-space-lg);
        }
        dc-theme-showcase .ts-radius-item { text-align: center; }
        dc-theme-showcase .ts-radius-box {
          width: 100%; height: 100px;
          background: var(--dicode-blue-tint);
          border: 1px solid var(--dicode-blue);
          margin-bottom: var(--dicode-space-sm);
        }
        dc-theme-showcase .ts-radius-name {
          font-family: var(--dicode-font-mono); font-size: var(--dicode-text-xs);
          color: var(--dicode-sky);
        }
        dc-theme-showcase .ts-radius-px {
          color: var(--dicode-muted); font-size: var(--dicode-text-xs); display: block;
        }

        /* Controls, borders & focus */
        dc-theme-showcase .ts-control-row {
          display: flex; flex-wrap: wrap; align-items: flex-end;
          gap: var(--dicode-space-xl);
        }
        dc-theme-showcase .ts-control-item { text-align: center; }
        dc-theme-showcase .ts-control-btn {
          display: flex; align-items: center; justify-content: center;
          padding: 0; cursor: pointer;
          background: var(--dicode-card-bg);
          border: var(--dicode-border-width) solid var(--dicode-border);
          border-radius: var(--dicode-radius-md);
          color: var(--dicode-muted);
          margin-bottom: var(--dicode-space-sm);
          transition: border-color var(--dicode-duration-fast) var(--dicode-ease);
        }
        dc-theme-showcase .ts-control-btn:hover {
          border-color: var(--dicode-border-strong);
        }
        dc-theme-showcase .ts-control-btn:focus-visible {
          outline: var(--dicode-focus-ring);
          outline-offset: var(--dicode-focus-ring-offset);
        }
        dc-theme-showcase .ts-control-dot {
          display: block;
          background: var(--dicode-sky);
          border-radius: var(--dicode-radius-full);
        }
        dc-theme-showcase .ts-border-demo {
          inline-size: 100px; block-size: var(--dicode-control-size);
          background: var(--dicode-blue-tint);
          border-radius: var(--dicode-radius-md);
          margin-bottom: var(--dicode-space-sm);
        }
        dc-theme-showcase .ts-border-thin {
          border: var(--dicode-border-width) solid var(--dicode-blue);
        }
        dc-theme-showcase .ts-border-thick {
          border: var(--dicode-border-width-thick) solid var(--dicode-blue);
        }

        /* Shadows */
        dc-theme-showcase .ts-shadow-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: var(--dicode-space-xl);
        }
        dc-theme-showcase .ts-shadow-item {
          background: var(--dicode-card-bg);
          border: 1px solid var(--dicode-border);
          padding: var(--dicode-space-xl);
          border-radius: var(--dicode-radius);
          text-align: center;
        }
        dc-theme-showcase .ts-shadow-name {
          font-family: var(--dicode-font-mono); font-size: var(--dicode-text-sm);
          color: var(--dicode-sky);
        }

        /* Typography scale */
        dc-theme-showcase .ts-type-row {
          display: flex; align-items: baseline; gap: var(--dicode-space-lg);
          padding: var(--dicode-space-sm) 0;
          border-bottom: 1px solid var(--dicode-border);
        }
        dc-theme-showcase .ts-type-name {
          font-family: var(--dicode-font-mono); font-size: var(--dicode-text-sm);
          color: var(--dicode-sky); min-width: 140px;
        }
        dc-theme-showcase .ts-type-size {
          color: var(--dicode-muted); font-size: var(--dicode-text-xs);
          font-family: var(--dicode-font-mono); min-width: 60px;
        }
        dc-theme-showcase .ts-type-sample {
          color: var(--dicode-heading); font-weight: var(--dicode-font-semibold);
          flex: 1;
        }

        /* Components */
        dc-theme-showcase .ts-components {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: var(--dicode-space-xl);
        }
        dc-theme-showcase .ts-component-demo {
          background: var(--dicode-card-bg);
          border: 1px solid var(--dicode-border);
          border-radius: var(--dicode-radius);
          padding: var(--dicode-space-xl);
        }
        dc-theme-showcase .ts-component-demo h4 {
          font-size: var(--dicode-text-sm); color: var(--dicode-muted);
          font-weight: var(--dicode-font-semibold); text-transform: uppercase;
          letter-spacing: var(--dicode-tracking-wider);
          margin-bottom: var(--dicode-space-md);
        }
        dc-theme-showcase .ts-component-demo-row {
          display: flex; gap: var(--dicode-space-sm); flex-wrap: wrap;
          align-items: center;
        }

        /* Code snippet */
        dc-theme-showcase .ts-snippet {
          background: var(--dicode-code-bg);
          border: 1px solid var(--dicode-code-border);
          border-radius: var(--dicode-radius);
          padding: var(--dicode-space-lg);
          overflow-x: auto;
          margin-top: var(--dicode-space-xl);
        }
        dc-theme-showcase .ts-snippet pre {
          font-family: var(--dicode-font-mono);
          font-size: var(--dicode-text-sm);
          color: var(--dicode-code-text);
          line-height: var(--dicode-leading-normal);
        }
        dc-theme-showcase .ts-snippet .hl {
          color: var(--dicode-code-kw);
        }
        dc-theme-showcase .ts-snippet .str {
          color: var(--dicode-code-str);
        }

        @media (max-width: 640px) {
          dc-theme-showcase .ts-header { padding: 80px 1rem 40px; }
          dc-theme-showcase .ts-section { padding: var(--dicode-space-3xl) var(--dicode-space-md); }
          dc-theme-showcase .ts-header h1 { font-size: 2rem; }
          dc-theme-showcase .ts-spacing-label { min-width: 100px; font-size: var(--dicode-text-xs); }
          dc-theme-showcase .ts-type-name { min-width: 80px; }
        }
      </style>

      <!-- HEADER -->
      <div class="ts-header">
        <h1>Design System</h1>
        <p>
          The complete set of tokens behind dicode — colors, spacing, typography,
          radii, shadows, and transitions. Drop <code>theme.css</code> into any
          project and everything stays consistent.
        </p>
        <div class="ts-actions">
          <a class="btn-primary" href="/theme.css" download>Download theme.css</a>
          <a class="btn-ghost" href="/">Back to landing</a>
        </div>
      </div>

      <!-- COLORS -->
      <section class="ts-section">
        <div class="container">
          <p class="ts-label">Tokens</p>
          <h2 class="ts-title">Colors</h2>
          <p class="ts-sub">
            All colors are defined as CSS custom properties and have light-mode overrides.
            Toggle the theme in the nav to see both variants.
          </p>

          ${SWATCHES.map(
            (cat) => html`
              <div class="ts-swatch-category">
                <h3>${cat.category}</h3>
                <div class="ts-swatch-grid">
                  ${cat.items.map(
                    (s) => html`
                      <div class="ts-swatch">
                        <div
                          class="ts-swatch-preview"
                          style="background: ${s.value}"
                        ></div>
                        <div class="ts-swatch-info">
                          <div class="ts-swatch-name">${s.name}</div>
                          <div class="ts-swatch-desc">${s.description}</div>
                        </div>
                      </div>
                    `,
                  )}
                </div>
              </div>
            `,
          )}
        </div>
      </section>

      <!-- SPACING -->
      <section class="ts-section">
        <div class="container">
          <p class="ts-label">Tokens</p>
          <h2 class="ts-title">Spacing</h2>
          <p class="ts-sub">
            Based on a 4px / 0.25rem grid. Use these for padding, margin, and gap.
          </p>
          ${SPACING.map(
            (s) => html`
              <div class="ts-spacing-row">
                <span class="ts-spacing-label">${s.name}</span>
                <span class="ts-spacing-px">${s.px}</span>
                <div class="ts-spacing-bar" style="width: var(${s.name})"></div>
              </div>
            `,
          )}
        </div>
      </section>

      <!-- TYPOGRAPHY -->
      <section class="ts-section">
        <div class="container">
          <p class="ts-label">Tokens</p>
          <h2 class="ts-title">Typography</h2>
          <p class="ts-sub">
            Font stack: <code>system-ui</code> for sans, <code>Fira Code</code> for mono.
            Sizes are based on a <code>0.9rem</code> body size.
          </p>
          ${TYPOGRAPHY.map(
            (t) => html`
              <div class="ts-type-row">
                <span class="ts-type-name">${t.name}</span>
                <span class="ts-type-size">${t.size}</span>
                <span
                  class="ts-type-sample"
                  style="font-size: var(${t.name})"
                  >Automate anything</span
                >
              </div>
            `,
          )}
        </div>
      </section>

      <!-- RADII -->
      <section class="ts-section">
        <div class="container">
          <p class="ts-label">Tokens</p>
          <h2 class="ts-title">Border radii</h2>
          <p class="ts-sub">Five radius values for everything from tags to modals.</p>
          <div class="ts-radius-grid">
            ${RADII.map(
              (r) => html`
                <div class="ts-radius-item">
                  <div
                    class="ts-radius-box"
                    style="border-radius: var(${r.name})"
                  ></div>
                  <span class="ts-radius-name">${r.name}</span>
                  <span class="ts-radius-px">${r.px}</span>
                </div>
              `,
            )}
          </div>
        </div>
      </section>

      <!-- CONTROLS, BORDERS & FOCUS -->
      <section class="ts-section">
        <div class="container">
          <p class="ts-label">Tokens</p>
          <h2 class="ts-title">Controls, borders &amp; focus</h2>
          <p class="ts-sub">
            Hit-target and icon sizes, border widths, and the shared focus ring.
            Tab into a button below to see the ring — it is
            <code>:focus-visible</code> only, so a click never triggers it.
          </p>
          <div class="ts-control-row">
            ${CONTROL_SIZES.map(
              (c) => html`
                <div class="ts-control-item">
                  <button
                    class="ts-control-btn"
                    style="inline-size: var(${c.name}); block-size: var(${c.name})"
                    aria-label="${c.name} example"
                  >
                    <span
                      class="ts-control-dot"
                      style="inline-size: var(${c.icon}); block-size: var(${c.icon})"
                    ></span>
                  </button>
                  <span class="ts-radius-name">${c.name}</span>
                  <span class="ts-radius-px">${c.px}</span>
                </div>
              `,
            )}
            <div class="ts-control-item">
              <div class="ts-border-demo ts-border-thin"></div>
              <span class="ts-radius-name">--dicode-border-width</span>
              <span class="ts-radius-px">1px</span>
            </div>
            <div class="ts-control-item">
              <div class="ts-border-demo ts-border-thick"></div>
              <span class="ts-radius-name">--dicode-border-width-thick</span>
              <span class="ts-radius-px">2px</span>
            </div>
          </div>
        </div>
      </section>

      <!-- SHADOWS -->
      <section class="ts-section">
        <div class="container">
          <p class="ts-label">Tokens</p>
          <h2 class="ts-title">Shadows</h2>
          <p class="ts-sub">
            Theme-aware — darker offset on light backgrounds, glow on dark.
          </p>
          <div class="ts-shadow-grid">
            ${SHADOWS.map(
              (s) => html`
                <div
                  class="ts-shadow-item"
                  style="box-shadow: var(${s.name})"
                >
                  <span class="ts-shadow-name">${s.name}</span>
                </div>
              `,
            )}
          </div>
        </div>
      </section>

      <!-- COMPONENTS -->
      <section class="ts-section">
        <div class="container">
          <p class="ts-label">Examples</p>
          <h2 class="ts-title">Components</h2>
          <p class="ts-sub">
            Reusable patterns built from the tokens above.
          </p>
          <div class="ts-components">
            <div class="ts-component-demo">
              <h4>Buttons</h4>
              <div class="ts-component-demo-row">
                <a class="btn-primary" href="#">Primary</a>
                <a class="btn-ghost" href="#">Ghost</a>
              </div>
            </div>
            <div class="ts-component-demo">
              <h4>Pills & tags</h4>
              <div class="ts-component-demo-row">
                <span class="pill">TypeScript</span>
                <span class="pill">Docker</span>
                <span class="tag">cron</span>
                <span class="tag">webhook</span>
              </div>
            </div>
            <div class="ts-component-demo">
              <h4>Code block</h4>
              <div class="code-block" style="margin-top: .5rem;">
                <div class="code-header">
                  <div class="dot"></div>
                  <div class="dot"></div>
                  <div class="dot"></div>
                  <span class="filename">task.ts</span>
                </div>
                <pre><code><span class="kw">const</span> <span class="fn">greet</span> = (<span class="prop">name</span>: <span class="kw">string</span>) => <span class="str">\`hello \${name}\`</span>;</code></pre>
              </div>
            </div>
            <div class="ts-component-demo">
              <h4>Feature card</h4>
              <div class="feature-card">
                <div class="feature-icon">★</div>
                <h3>Card title</h3>
                <p>Card body content using semantic tokens throughout.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- USAGE -->
      <section class="ts-section">
        <div class="container">
          <p class="ts-label">Integration</p>
          <h2 class="ts-title">How to use</h2>
          <p class="ts-sub">
            Three ways to bring dicode's design system into your project.
          </p>

          <h3 style="color: var(--dicode-heading); font-size: var(--dicode-text-lg); margin-bottom: var(--dicode-space-sm);">
            1. Import from the CDN
          </h3>
          <div class="ts-snippet">
            <pre>&lt;<span class="hl">link</span> <span class="hl">rel</span>=<span class="str">"stylesheet"</span>
      <span class="hl">href</span>=<span class="str">"https://dicode-ayo.github.io/dicode-site/theme.css"</span>&gt;</pre>
          </div>

          <h3 style="color: var(--dicode-heading); font-size: var(--dicode-text-lg); margin: var(--dicode-space-xl) 0 var(--dicode-space-sm);">
            2. Set the theme on <code>&lt;html&gt;</code>
          </h3>
          <div class="ts-snippet">
            <pre><span class="hl">document</span>.documentElement.setAttribute(<span class="str">"data-theme"</span>, <span class="str">"dark"</span>);
<span class="hl">document</span>.documentElement.setAttribute(<span class="str">"data-theme"</span>, <span class="str">"light"</span>);</pre>
          </div>

          <h3 style="color: var(--dicode-heading); font-size: var(--dicode-text-lg); margin: var(--dicode-space-xl) 0 var(--dicode-space-sm);">
            3. Use the tokens in your CSS
          </h3>
          <div class="ts-snippet">
            <pre>.my-button {
  <span class="hl">background</span>: <span class="str">var(--dicode-blue)</span>;
  <span class="hl">color</span>: <span class="str">var(--dicode-heading)</span>;
  <span class="hl">padding</span>: <span class="str">var(--dicode-space-sm) var(--dicode-space-lg)</span>;
  <span class="hl">border-radius</span>: <span class="str">var(--dicode-radius-md)</span>;
  <span class="hl">transition</span>: <span class="str">var(--dicode-transition)</span>;
  <span class="hl">box-shadow</span>: <span class="str">var(--dicode-shadow-glow)</span>;
}</pre>
          </div>
        </div>
      </section>
    `;
  }
}
