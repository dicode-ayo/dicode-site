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
          display: inline-flex; align-items: center; gap: var(--space-sm);
          background: rgba(13,110,253,.15); border: 1px solid var(--border-dashed);
          color: var(--sky); font-size: .8rem; font-weight: var(--font-semibold); letter-spacing: var(--tracking-wide);
          padding: .35rem .9rem; border-radius: var(--radius-pill); margin-bottom: 1.8rem; text-transform: uppercase;
        }
        dc-hero .hero-badge .dot { width: 6px; height: 6px; border-radius: var(--radius-full); background: var(--green); animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
        dc-hero h1 {
          font-size: clamp(2.6rem, 6vw, 4.5rem); font-weight: var(--font-extrabold); line-height: 1.08;
          letter-spacing: var(--tracking-tight); color: var(--heading); max-width: 860px;
        }
        dc-hero h1 em { font-style: normal; color: var(--sky); }
        dc-hero .hero-sub { margin-top: 1.4rem; font-size: clamp(1rem, 2.5vw, 1.25rem); color: var(--muted); max-width: 600px; line-height: 1.7; }
        dc-hero .hero-actions { display: flex; gap: var(--space-md); margin-top: 2.4rem; flex-wrap: wrap; justify-content: center; }

        /* Timeline */
        dc-hero .hero-timeline {
          margin-top: 3.5rem; max-width: 680px; width: 100%; text-align: left;
          background: var(--code-bg); border: 1px solid var(--code-border);
          border-radius: var(--radius); padding: 1.4rem 1.6rem;
          font-family: 'Fira Code', 'Cascadia Code', monospace; font-size: var(--text-sm);
        }
        dc-hero .tl-row {
          display: grid; grid-template-columns: 52px 1fr; gap: var(--space-sm);
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
        /* Staggered row entrance */
        dc-hero .tl-row {
          opacity: 0;
          transform: translateY(8px);
          animation: tl-row-in .5s ease forwards;
        }
        dc-hero .tl-row:nth-child(1)  { animation-delay: .4s; }
        dc-hero .tl-row:nth-child(2)  { animation-delay: 1.2s; }
        dc-hero .tl-row:nth-child(3)  { animation-delay: 1.8s; }
        /* after separator */
        dc-hero .tl-row:nth-child(5)  { animation-delay: 2.8s; }
        dc-hero .tl-row:nth-child(6)  { animation-delay: 3.8s; }
        dc-hero .tl-row:nth-child(7)  { animation-delay: 4.4s; }
        dc-hero .tl-row:nth-child(8)  { animation-delay: 5.0s; }
        dc-hero .tl-row:nth-child(9)  { animation-delay: 5.6s; }
        dc-hero .tl-row:nth-child(10) { animation-delay: 6.2s; }
        dc-hero .tl-sep {
          opacity: 0;
          animation: tl-row-in .4s ease forwards 2.4s;
        }
        @keyframes tl-row-in {
          to { opacity: 1; transform: translateY(0); }
        }

        /* Fail row flash */
        dc-hero .tl-fail {
          animation: tl-row-in .5s ease forwards 3.8s, tl-flash .6s ease 4.0s;
        }
        @keyframes tl-flash {
          0%, 100% { background: transparent; }
          30% { background: rgba(239, 68, 68, .12); }
        }

        dc-hero .cursor { display: inline-block; width: 8px; height: 1em; background: var(--blue); animation: blink 1s step-end infinite; vertical-align: text-bottom; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

        @media (max-width: 640px) {
          dc-hero #hero { padding: 100px 1rem 60px; min-height: auto; }
          dc-hero h1 { font-size: 2rem; }
          dc-hero .hero-sub { font-size: .95rem; }
          dc-hero .hero-actions { flex-direction: column; align-items: center; }
          dc-hero .hero-timeline { font-size: var(--text-xs); padding: 1rem; margin-top: 2rem; }
          dc-hero .tl-row { grid-template-columns: 44px 1fr; }
          dc-hero .hero-badge { font-size: .7rem; }
        }
      </style>
      <section id="hero">
        <div class="hero-badge"><span class="dot"></span> Free &amp; open source</div>
        <h1>You describe it. <em>AI builds, ships, and fixes it.</em></h1>
        <p class="hero-sub">
          AI creates your automations from plain English, versions them in git,
          and fixes them when they break. One binary, zero infrastructure.
        </p>
        <div class="hero-actions">
          <a class="btn-primary" href="#download">Download free</a>
          <a class="btn-ghost" href="/docs/">Read the docs</a>
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
