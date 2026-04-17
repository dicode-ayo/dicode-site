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
          font-size: clamp(2.6rem, 6vw, 4.5rem); font-weight: 800; line-height: 1.08;
          letter-spacing: -.03em; color: var(--heading); max-width: 860px;
        }
        dc-hero h1 em { font-style: normal; color: var(--sky); }
        dc-hero .hero-sub { margin-top: 1.4rem; font-size: clamp(1rem, 2.5vw, 1.25rem); color: var(--muted); max-width: 600px; line-height: 1.7; }
        dc-hero .hero-actions { display: flex; gap: 1rem; margin-top: 2.4rem; flex-wrap: wrap; justify-content: center; }

        /* Timeline */
        dc-hero .hero-timeline {
          margin-top: 3.5rem; max-width: 680px; width: 100%; text-align: left;
          background: var(--code-bg); border: 1px solid var(--code-border);
          border-radius: var(--radius); padding: 1.4rem 1.6rem;
          font-family: 'Fira Code', 'Cascadia Code', monospace; font-size: .82rem;
        }
        dc-hero .tl-row {
          display: grid; grid-template-columns: 52px 1fr; gap: .5rem;
          padding: .35rem 0; line-height: 1.5;
        }
        dc-hero .tl-time { color: var(--muted); font-size: .75rem; flex-shrink: 0; padding-top: 1px; }
        dc-hero .tl-event { color: var(--code-text); }
        dc-hero .tl-event em { font-style: normal; color: var(--sky); }
        dc-hero .tl-sep {
          border: none; border-top: 1px solid var(--code-border);
          margin: .5rem 0;
        }
        dc-hero .tl-ok { color: var(--green); }
        dc-hero .tl-fail { color: #ef4444; }
        dc-hero .tl-ai { color: var(--sky); }
        dc-hero .tl-notify { color: var(--yellow); }
        dc-hero .cursor { display: inline-block; width: 8px; height: 1em; background: var(--blue); animation: blink 1s step-end infinite; vertical-align: text-bottom; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

        @media (max-width: 640px) {
          dc-hero #hero { padding: 100px 1rem 60px; min-height: auto; }
          dc-hero h1 { font-size: 2rem; }
          dc-hero .hero-sub { font-size: .95rem; }
          dc-hero .hero-actions { flex-direction: column; align-items: center; }
          dc-hero .hero-timeline { font-size: .72rem; padding: 1rem; margin-top: 2rem; }
          dc-hero .tl-row { grid-template-columns: 44px 1fr; }
          dc-hero .hero-badge { font-size: .7rem; }
        }
      </style>
      <section id="hero">
        <div class="hero-badge"><span class="dot"></span> Free &amp; open source</div>
        <h1>You describe it. <em>AI builds, ships, and fixes it.</em></h1>
        <p class="hero-sub">
          A task kernel where AI creates your automations, git versions them,
          and a single binary runs them. No infrastructure. No deploy steps.
          Every task is replaceable, every change is auditable, and AI
          monitors and fixes failures while you sleep.
        </p>
        <div class="hero-actions">
          <a class="btn-primary" href="#download">Download free</a>
          <a class="btn-ghost" href="/docs/getting-started/">Read the docs</a>
        </div>
        <div class="hero-timeline">
          <div class="tl-row">
            <span class="tl-time">10:00</span>
            <span class="tl-event">You: <em>"Monitor api.example.com every 5 min, alert on Slack if down"</em></span>
          </div>
          <div class="tl-row">
            <span class="tl-time">10:01</span>
            <span class="tl-event tl-ok">&#10003; AI generated task.yaml + task.ts &mdash; committed to git</span>
          </div>
          <div class="tl-row">
            <span class="tl-time">10:01</span>
            <span class="tl-event tl-ok">&#10003; Validated &middot; deployed &middot; first run scheduled</span>
          </div>
          <hr class="tl-sep" />
          <div class="tl-row">
            <span class="tl-time">10:05</span>
            <span class="tl-event tl-ok">&#10003; Run #1: 200 OK (143ms)</span>
          </div>
          <div class="tl-row">
            <span class="tl-time">10:15</span>
            <span class="tl-event tl-fail">&#10007; Run #3: Connection timeout</span>
          </div>
          <div class="tl-row">
            <span class="tl-time">10:15</span>
            <span class="tl-event tl-notify">&#9888; Slack: "api.example.com is down"</span>
          </div>
          <div class="tl-row">
            <span class="tl-time">10:16</span>
            <span class="tl-event tl-ai">&#9881; AI: redirect detected &mdash; updating endpoint + adding retry</span>
          </div>
          <div class="tl-row">
            <span class="tl-time">10:16</span>
            <span class="tl-event tl-ok">&#10003; Fix committed &middot; redeployed automatically</span>
          </div>
          <div class="tl-row">
            <span class="tl-time">10:20</span>
            <span class="tl-event tl-ok">&#10003; Run #4: 200 OK (167ms) &mdash; recovered</span>
          </div>
          <span class="cursor"></span>
        </div>
      </section>
    `;
  }
}
