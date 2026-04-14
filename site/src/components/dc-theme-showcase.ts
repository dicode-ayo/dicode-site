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
      { name: "--bg", value: "var(--bg)", description: "Page background" },
      { name: "--bg-alt", value: "var(--bg-alt)", description: "Alternate section" },
      { name: "--bg-accent", value: "var(--bg-accent)", description: "Third tier / gradient stop" },
      { name: "--card-bg", value: "var(--card-bg)", description: "Card surface" },
      { name: "--overlay-bg", value: "var(--overlay-bg)", description: "Modal/sheet overlay" },
    ],
  },
  {
    category: "Foreground",
    items: [
      { name: "--text", value: "var(--text)", description: "Body text" },
      { name: "--heading", value: "var(--heading)", description: "Headings h1-h6" },
      { name: "--muted", value: "var(--muted)", description: "Secondary text / labels" },
      { name: "--lavender", value: "var(--lavender)", description: "Tertiary accent text" },
    ],
  },
  {
    category: "Brand",
    items: [
      { name: "--blue", value: "var(--blue)", description: "Primary action" },
      { name: "--blue2", value: "var(--blue2)", description: "Primary hover" },
      { name: "--sky", value: "var(--sky)", description: "Accent text, pills, tags" },
      { name: "--green", value: "var(--green)", description: "Success" },
      { name: "--yellow", value: "var(--yellow)", description: "Warning" },
      { name: "--red", value: "var(--red)", description: "Error / destructive" },
    ],
  },
  {
    category: "Borders",
    items: [
      { name: "--border", value: "var(--border)", description: "Default border" },
      { name: "--border-strong", value: "var(--border-strong)", description: "Hover/focus border" },
      { name: "--border-dashed", value: "var(--border-dashed)", description: "Special/dashed" },
    ],
  },
  {
    category: "Tints",
    items: [
      { name: "--blue-tint", value: "var(--blue-tint)", description: "Icon bg, callouts" },
      { name: "--blue-tint-strong", value: "var(--blue-tint-strong)", description: "Stronger blue tint" },
    ],
  },
  {
    category: "Code blocks",
    items: [
      { name: "--code-bg", value: "var(--code-bg)", description: "Code block background" },
      { name: "--code-text", value: "var(--code-text)", description: "Code block text" },
      { name: "--code-kw", value: "var(--code-kw)", description: "Keywords" },
      { name: "--code-str", value: "var(--code-str)", description: "Strings" },
      { name: "--code-cmt", value: "var(--code-cmt)", description: "Comments" },
      { name: "--code-fn", value: "var(--code-fn)", description: "Functions" },
      { name: "--code-num", value: "var(--code-num)", description: "Numbers" },
      { name: "--code-prop", value: "var(--code-prop)", description: "Properties" },
    ],
  },
];

const SPACING = [
  { name: "--space-xs", px: "4px" },
  { name: "--space-sm", px: "8px" },
  { name: "--space-md", px: "16px" },
  { name: "--space-lg", px: "24px" },
  { name: "--space-xl", px: "32px" },
  { name: "--space-2xl", px: "48px" },
  { name: "--space-3xl", px: "64px" },
  { name: "--space-4xl", px: "96px" },
  { name: "--space-5xl", px: "128px" },
];

const RADII = [
  { name: "--radius-sm", px: "6px" },
  { name: "--radius-md", px: "10px" },
  { name: "--radius", px: "14px" },
  { name: "--radius-lg", px: "20px" },
  { name: "--radius-pill", px: "9999px" },
];

const SHADOWS = [
  { name: "--shadow-sm" },
  { name: "--shadow" },
  { name: "--shadow-card" },
  { name: "--shadow-strong" },
  { name: "--shadow-glow" },
  { name: "--shadow-glow-lg" },
];

const TYPOGRAPHY = [
  { name: "--text-xs", size: "11.5px" },
  { name: "--text-sm", size: "13px" },
  { name: "--text-base", size: "14.4px" },
  { name: "--text-md", size: "16px" },
  { name: "--text-lg", size: "18.4px" },
  { name: "--text-xl", size: "22.4px" },
  { name: "--text-2xl", size: "28.8px" },
  { name: "--text-3xl", size: "38.4px" },
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
          border-bottom: 1px solid var(--border);
        }
        dc-theme-showcase .ts-header h1 {
          font-size: var(--text-5xl); font-weight: var(--font-extrabold);
          color: var(--heading); letter-spacing: var(--tracking-tight);
          margin-bottom: 1rem;
        }
        dc-theme-showcase .ts-header p {
          color: var(--muted); font-size: var(--text-lg);
          max-width: 640px; margin: 0 auto 2rem;
        }
        dc-theme-showcase .ts-header .ts-actions {
          display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;
        }

        dc-theme-showcase .ts-section {
          padding: var(--space-4xl) var(--space-xl);
          border-bottom: 1px solid var(--border);
        }
        dc-theme-showcase .ts-section:nth-child(even) {
          background: var(--bg-alt);
        }
        dc-theme-showcase .ts-section > .container { max-width: 1120px; margin: 0 auto; }
        dc-theme-showcase .ts-label {
          font-size: var(--text-xs); font-weight: var(--font-bold);
          color: var(--blue); text-transform: uppercase;
          letter-spacing: var(--tracking-wider); margin-bottom: var(--space-sm);
        }
        dc-theme-showcase .ts-title {
          font-size: var(--text-3xl); font-weight: var(--font-extrabold);
          color: var(--heading); letter-spacing: var(--tracking-tight);
          margin-bottom: var(--space-sm);
        }
        dc-theme-showcase .ts-sub {
          color: var(--muted); font-size: var(--text-md);
          max-width: 640px; margin-bottom: var(--space-2xl);
        }

        /* Swatches */
        dc-theme-showcase .ts-swatch-category {
          margin-bottom: var(--space-2xl);
        }
        dc-theme-showcase .ts-swatch-category h3 {
          font-size: var(--text-lg); font-weight: var(--font-bold);
          color: var(--heading); margin-bottom: var(--space-md);
        }
        dc-theme-showcase .ts-swatch-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: var(--space-md);
        }
        dc-theme-showcase .ts-swatch {
          background: var(--card-bg); border: 1px solid var(--border);
          border-radius: var(--radius); overflow: hidden;
          transition: var(--transition);
          cursor: pointer;
        }
        dc-theme-showcase .ts-swatch:hover {
          border-color: var(--border-strong);
          transform: translateY(-2px);
          box-shadow: var(--shadow);
        }
        dc-theme-showcase .ts-swatch-preview {
          height: 80px;
          border-bottom: 1px solid var(--border);
        }
        dc-theme-showcase .ts-swatch-info {
          padding: var(--space-md);
        }
        dc-theme-showcase .ts-swatch-name {
          font-family: var(--font-mono); font-size: var(--text-sm);
          color: var(--sky); font-weight: var(--font-semibold);
          margin-bottom: var(--space-xs);
        }
        dc-theme-showcase .ts-swatch-desc {
          font-size: var(--text-xs); color: var(--muted);
        }

        /* Spacing ruler */
        dc-theme-showcase .ts-spacing-row {
          display: flex; align-items: center; gap: var(--space-md);
          margin-bottom: var(--space-sm);
        }
        dc-theme-showcase .ts-spacing-label {
          font-family: var(--font-mono); font-size: var(--text-sm);
          color: var(--sky); min-width: 140px;
        }
        dc-theme-showcase .ts-spacing-px {
          color: var(--muted); font-size: var(--text-xs);
          font-family: var(--font-mono); min-width: 60px;
        }
        dc-theme-showcase .ts-spacing-bar {
          height: 20px; background: var(--blue-tint-strong);
          border: 1px solid var(--blue);
          border-radius: var(--radius-sm);
        }

        /* Radii */
        dc-theme-showcase .ts-radius-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: var(--space-lg);
        }
        dc-theme-showcase .ts-radius-item { text-align: center; }
        dc-theme-showcase .ts-radius-box {
          width: 100%; height: 100px;
          background: var(--blue-tint);
          border: 1px solid var(--blue);
          margin-bottom: var(--space-sm);
        }
        dc-theme-showcase .ts-radius-name {
          font-family: var(--font-mono); font-size: var(--text-xs);
          color: var(--sky);
        }
        dc-theme-showcase .ts-radius-px {
          color: var(--muted); font-size: var(--text-xs); display: block;
        }

        /* Shadows */
        dc-theme-showcase .ts-shadow-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: var(--space-xl);
        }
        dc-theme-showcase .ts-shadow-item {
          background: var(--card-bg);
          border: 1px solid var(--border);
          padding: var(--space-xl);
          border-radius: var(--radius);
          text-align: center;
        }
        dc-theme-showcase .ts-shadow-name {
          font-family: var(--font-mono); font-size: var(--text-sm);
          color: var(--sky);
        }

        /* Typography scale */
        dc-theme-showcase .ts-type-row {
          display: flex; align-items: baseline; gap: var(--space-lg);
          padding: var(--space-sm) 0;
          border-bottom: 1px solid var(--border);
        }
        dc-theme-showcase .ts-type-name {
          font-family: var(--font-mono); font-size: var(--text-sm);
          color: var(--sky); min-width: 140px;
        }
        dc-theme-showcase .ts-type-size {
          color: var(--muted); font-size: var(--text-xs);
          font-family: var(--font-mono); min-width: 60px;
        }
        dc-theme-showcase .ts-type-sample {
          color: var(--heading); font-weight: var(--font-semibold);
          flex: 1;
        }

        /* Components */
        dc-theme-showcase .ts-components {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: var(--space-xl);
        }
        dc-theme-showcase .ts-component-demo {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: var(--space-xl);
        }
        dc-theme-showcase .ts-component-demo h4 {
          font-size: var(--text-sm); color: var(--muted);
          font-weight: var(--font-semibold); text-transform: uppercase;
          letter-spacing: var(--tracking-wider);
          margin-bottom: var(--space-md);
        }
        dc-theme-showcase .ts-component-demo-row {
          display: flex; gap: var(--space-sm); flex-wrap: wrap;
          align-items: center;
        }

        /* Code snippet */
        dc-theme-showcase .ts-snippet {
          background: var(--code-bg);
          border: 1px solid var(--code-border);
          border-radius: var(--radius);
          padding: var(--space-lg);
          overflow-x: auto;
          margin-top: var(--space-xl);
        }
        dc-theme-showcase .ts-snippet pre {
          font-family: var(--font-mono);
          font-size: var(--text-sm);
          color: var(--code-text);
          line-height: var(--leading-normal);
        }
        dc-theme-showcase .ts-snippet .hl {
          color: var(--code-kw);
        }
        dc-theme-showcase .ts-snippet .str {
          color: var(--code-str);
        }

        @media (max-width: 640px) {
          dc-theme-showcase .ts-header { padding: 80px 1rem 40px; }
          dc-theme-showcase .ts-section { padding: var(--space-3xl) var(--space-md); }
          dc-theme-showcase .ts-header h1 { font-size: 2rem; }
          dc-theme-showcase .ts-spacing-label { min-width: 100px; font-size: var(--text-xs); }
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

          <h3 style="color: var(--heading); font-size: var(--text-lg); margin-bottom: var(--space-sm);">
            1. Import from the CDN
          </h3>
          <div class="ts-snippet">
            <pre>&lt;<span class="hl">link</span> <span class="hl">rel</span>=<span class="str">"stylesheet"</span>
      <span class="hl">href</span>=<span class="str">"https://dicode-ayo.github.io/dicode-site/theme.css"</span>&gt;</pre>
          </div>

          <h3 style="color: var(--heading); font-size: var(--text-lg); margin: var(--space-xl) 0 var(--space-sm);">
            2. Set the theme on <code>&lt;html&gt;</code>
          </h3>
          <div class="ts-snippet">
            <pre><span class="hl">document</span>.documentElement.setAttribute(<span class="str">"data-theme"</span>, <span class="str">"dark"</span>);
<span class="hl">document</span>.documentElement.setAttribute(<span class="str">"data-theme"</span>, <span class="str">"light"</span>);</pre>
          </div>

          <h3 style="color: var(--heading); font-size: var(--text-lg); margin: var(--space-xl) 0 var(--space-sm);">
            3. Use the tokens in your CSS
          </h3>
          <div class="ts-snippet">
            <pre>.my-button {
  <span class="hl">background</span>: <span class="str">var(--blue)</span>;
  <span class="hl">color</span>: <span class="str">var(--heading)</span>;
  <span class="hl">padding</span>: <span class="str">var(--space-sm) var(--space-lg)</span>;
  <span class="hl">border-radius</span>: <span class="str">var(--radius-md)</span>;
  <span class="hl">transition</span>: <span class="str">var(--transition)</span>;
  <span class="hl">box-shadow</span>: <span class="str">var(--shadow-glow)</span>;
}</pre>
          </div>
        </div>
      </section>
    `;
  }
}
