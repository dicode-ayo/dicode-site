import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("dc-hero")
export class DcHero extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-hero #hero {
          min-height: 100vh; display: flex; flex-direction: column; align-items: center;
          justify-content: center; text-align: center; padding: 120px 2rem 80px;
          position: relative; overflow: hidden;
        }
        dc-hero #hero::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 80% 60% at 50% -10%, var(--hero-glow-1) 0%, transparent 70%),
                      radial-gradient(ellipse 50% 40% at 80% 80%, var(--hero-glow-2) 0%, transparent 60%);
          pointer-events: none;
        }
        dc-hero .hero-badge {
          display: inline-flex; align-items: center; gap: .5rem;
          background: rgba(13,110,253,.15); border: 1px solid rgba(13,110,253,.4);
          color: var(--sky); font-size: .8rem; font-weight: 600; letter-spacing: .06em;
          padding: .35rem .9rem; border-radius: 100px; margin-bottom: 1.8rem; text-transform: uppercase;
        }
        dc-hero .hero-badge .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
        dc-hero h1 {
          font-size: clamp(2.6rem, 6vw, 5rem); font-weight: 800; line-height: 1.08;
          letter-spacing: -.03em; color: var(--heading); max-width: 820px;
        }
        dc-hero h1 em { font-style: normal; color: var(--sky); }
        dc-hero .hero-sub { margin-top: 1.4rem; font-size: clamp(1rem, 2.5vw, 1.25rem); color: var(--muted); max-width: 560px; line-height: 1.7; }
        dc-hero .hero-actions { display: flex; gap: 1rem; margin-top: 2.4rem; flex-wrap: wrap; justify-content: center; }
        dc-hero .hero-prompt {
          margin-top: 3.5rem; background: var(--code-bg); border: 1px solid var(--code-border);
          border-radius: var(--radius); padding: 1.2rem 1.6rem; text-align: left;
          max-width: 640px; width: 100%; font-family: 'Fira Code', 'Cascadia Code', monospace; font-size: .875rem; position: relative;
        }
        dc-hero .hero-prompt::before {
          content: 'dicode generate'; position: absolute; top: -10px; left: 18px;
          background: var(--blue); color: #fff; font-size: .72rem; font-weight: 700;
          letter-spacing: .05em; text-transform: uppercase; padding: .2rem .6rem; border-radius: 6px;
        }
        dc-hero .prompt-line { display: flex; gap: .75rem; align-items: flex-start; }
        dc-hero .prompt-icon { color: var(--blue); flex-shrink: 0; margin-top: 2px; }
        dc-hero .prompt-text { color: var(--code-text); line-height: 1.5; }
        dc-hero .prompt-output { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--code-border); }
        dc-hero .out-line { color: var(--green); font-size: .82rem; }
        dc-hero .out-line::before { content: '\u2713 '; }
        dc-hero .cursor { display: inline-block; width: 8px; height: 1em; background: var(--blue); animation: blink 1s step-end infinite; vertical-align: text-bottom; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @media (max-width: 640px) {
          dc-hero #hero { padding: 100px 1rem 60px; min-height: auto; }
          dc-hero h1 { font-size: 2rem; }
          dc-hero .hero-sub { font-size: .95rem; }
          dc-hero .hero-actions { flex-direction: column; align-items: center; }
          dc-hero .hero-prompt { font-size: .78rem; padding: 1rem; margin-top: 2rem; }
          dc-hero .hero-badge { font-size: .7rem; }
        }
      </style>
      <section id="hero">
        <div class="hero-badge"><span class="dot"></span> Now in public beta</div>
        <h1>Automate anything with <em>plain English</em></h1>
        <p class="hero-sub">
          Describe what you want. AI generates validated automation code. Run it locally, sync via GitOps, iterate in real time.
        </p>
        <div class="hero-actions">
          <a class="btn-primary" href="#download">Download free</a>
          <a class="btn-ghost" href="/dicode-site/docs/">Read the docs</a>
        </div>
        <div class="hero-prompt">
          <div class="prompt-line">
            <span class="prompt-icon">&#10095;</span>
            <span class="prompt-text">"Send me a Slack message every morning with yesterday's GitHub commits across all my repos"</span>
          </div>
          <div class="prompt-output">
            <div class="out-line">Generated task.yaml + task.ts</div>
            <div class="out-line">Validated schema &amp; types</div>
            <div class="out-line">Task live in ~100ms</div>
          </div>
          <span class="cursor"></span>
        </div>
      </section>
    `;
  }
}
