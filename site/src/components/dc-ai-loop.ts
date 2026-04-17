import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

/** Pentagon layout parameters */
const RING_W = 640;       // container width
const RING_H = 580;       // container height
const CX = RING_W / 2;   // center X = 320
const CY = RING_H / 2;   // center Y = 290
const R = 180;            // radius — distance from center to each node bubble center
const BUBBLE = 52;        // bubble diameter
const NODE_W = 120;       // node element width (includes label text)

/** Stages around the pentagon, starting at top (-90deg), clockwise in 72deg steps */
const STAGES = [
  { num: 1, icon: "\u270F\uFE0F", label: "Create",   line1: "Describe in English.", line2: "AI generates code." },
  { num: 2, icon: "\u2705",       label: "Validate",  line1: "Checks syntax,", line2: "permissions, patterns." },
  { num: 3, icon: "\uD83D\uDE80", label: "Deploy",    line1: "Git commit = live.", line2: "Zero human steps." },
  { num: 4, icon: "\uD83D\uDCE1", label: "Monitor",   line1: "Watches runs, detects", line2: "failures & drift." },
  { num: 5, icon: "\uD83D\uDD27", label: "Fix",       line1: "AI diagnoses, patches,", line2: "redeploys automatically." },
];

/** Compute (x, y) for a point on the ring at a given angle (degrees) */
function pos(angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Math.round(CX + R * Math.cos(rad)),
    y: Math.round(CY + R * Math.sin(rad)),
  };
}

/** Build SVG path string connecting all pentagon vertices */
function pentagonPath(): string {
  const points = STAGES.map((_, i) => {
    const { x, y } = pos(-90 + i * 72);
    return `${x} ${y}`;
  });
  return `M${points.join(" L")} Z`;
}

const PATH = pentagonPath();
const COORDS = STAGES.map((_, i) => pos(-90 + i * 72));

// Ring track insets: circle of radius R centered at (CX, CY)
const TRACK_TOP = CY - R;
const TRACK_BOTTOM = RING_H - (CY + R);
const TRACK_LEFT = CX - R;
const TRACK_RIGHT = RING_W - (CX + R);

@customElement("dc-ai-loop")
export class DcAiLoop extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    // Build SVG content as a static string (all values are compile-time constants, no user input)
    const svgContent = `
      <path d="${PATH}" stroke="var(--border)" stroke-width="1.5" stroke-dasharray="8 5" fill="none" opacity=".35"/>
      <circle r="4" fill="var(--blue)" opacity=".9">
        <animateMotion dur="10s" repeatCount="indefinite" path="${PATH}"/>
      </circle>
      <circle r="3" fill="var(--sky)" opacity=".5">
        <animateMotion dur="10s" repeatCount="indefinite" begin="5s" path="${PATH}"/>
      </circle>
    `;

    return html`
      <style>
        /* ── Ring layout ── */
        dc-ai-loop .loop-ring {
          position: relative;
          width: ${RING_W}px;
          height: ${RING_H}px;
          margin: 0 auto 3rem;
          max-width: 100%;
        }

        /* Dashed ring track — centered circle of radius ${R}px */
        dc-ai-loop .ring-track {
          position: absolute;
          top: ${TRACK_TOP}px; bottom: ${TRACK_BOTTOM}px;
          left: ${TRACK_LEFT}px; right: ${TRACK_RIGHT}px;
          border: 2px dashed var(--border);
          border-radius: 50%;
          animation: al-ring-spin 40s linear infinite;
        }
        @keyframes al-ring-spin { to { transform: rotate(360deg); } }

        /* Glowing orbit sweep */
        dc-ai-loop .ring-glow {
          position: absolute;
          top: ${TRACK_TOP - 4}px; bottom: ${TRACK_BOTTOM - 4}px;
          left: ${TRACK_LEFT - 4}px; right: ${TRACK_RIGHT - 4}px;
          border-radius: 50%;
          border: 2px solid transparent;
          background: conic-gradient(from 0deg, transparent 0%, var(--blue) 20%, transparent 40%) border-box;
          -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: al-glow-spin 6s linear infinite;
          opacity: .5;
        }
        @keyframes al-glow-spin { to { transform: rotate(360deg); } }

        /* Center label */
        dc-ai-loop .ring-center {
          position: absolute;
          top: ${CY}px; left: ${CX}px;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 2;
        }
        dc-ai-loop .ring-center .loop-icon {
          font-size: 2rem;
          animation: al-center-pulse 3s ease-in-out infinite;
        }
        @keyframes al-center-pulse {
          0%, 100% { transform: scale(1); opacity: .7; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        dc-ai-loop .ring-center p {
          color: var(--muted);
          font-size: .72rem;
          margin-top: .2rem;
          letter-spacing: .04em;
        }

        /* SVG connector layer */
        dc-ai-loop .ring-svg {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }

        /* ── Stage nodes ── */
        dc-ai-loop .loop-node {
          position: absolute;
          width: ${NODE_W}px;
          text-align: center;
          z-index: 3;
          /* Offset so the bubble center sits exactly on the coordinate */
          margin-left: ${-NODE_W / 2}px;
          margin-top: ${-BUBBLE / 2}px;
        }
        dc-ai-loop .loop-node .node-bubble {
          width: ${BUBBLE}px; height: ${BUBBLE}px;
          border-radius: 50%;
          background: var(--card-bg);
          border: 2px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto .4rem;
          font-size: 1.2rem;
          position: relative;
        }
        dc-ai-loop .loop-node .node-num {
          position: absolute;
          top: -5px; right: -5px;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: var(--blue);
          color: #fff;
          font-size: .6rem;
          font-weight: 800;
          display: flex; align-items: center; justify-content: center;
        }
        dc-ai-loop .loop-node h4 {
          font-size: .8rem;
          font-weight: 700;
          color: var(--heading);
          margin-bottom: .1rem;
        }
        dc-ai-loop .loop-node p {
          font-size: .65rem;
          color: var(--muted);
          line-height: 1.3;
        }

        /* Sequential glow animation */
        dc-ai-loop .n1 .node-bubble { animation: al-node-glow 10s ease-in-out infinite 0s; }
        dc-ai-loop .n2 .node-bubble { animation: al-node-glow 10s ease-in-out infinite 2s; }
        dc-ai-loop .n3 .node-bubble { animation: al-node-glow 10s ease-in-out infinite 4s; }
        dc-ai-loop .n4 .node-bubble { animation: al-node-glow 10s ease-in-out infinite 6s; }
        dc-ai-loop .n5 .node-bubble { animation: al-node-glow 10s ease-in-out infinite 8s; }

        @keyframes al-node-glow {
          0%, 16%, 100% {
            border-color: var(--border);
            box-shadow: none;
            transform: scale(1);
          }
          6%, 12% {
            border-color: var(--blue);
            box-shadow: 0 0 18px rgba(13,110,253,.45), 0 0 36px rgba(13,110,253,.15);
            transform: scale(1.1);
          }
        }

        /* ── Under the hood cards ── */
        dc-ai-loop .ai-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.2rem;
          margin-top: 2.5rem;
        }
        dc-ai-loop .ai-detail {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.4rem;
        }
        dc-ai-loop .ai-detail h4 {
          font-size: .85rem;
          font-weight: 700;
          color: var(--heading);
          margin-bottom: .4rem;
          display: flex;
          align-items: center;
          gap: .4rem;
        }
        dc-ai-loop .ai-detail h4 span { font-size: 1.1rem; }
        dc-ai-loop .ai-detail p {
          color: var(--muted);
          font-size: .8rem;
          line-height: 1.55;
        }
        dc-ai-loop .ai-detail code {
          color: var(--sky);
          font-family: 'Fira Code', 'Cascadia Code', monospace;
          font-size: .72rem;
          background: var(--blue-tint);
          padding: 1px 4px;
          border-radius: 3px;
        }

        /* ── Inline examples ── */
        dc-ai-loop .ai-examples {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.2rem;
        }
        dc-ai-loop .ai-example {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.4rem;
          overflow: hidden;
        }
        dc-ai-loop .example-title {
          font-size: .78rem;
          font-weight: 700;
          color: var(--heading);
          margin-bottom: 1rem;
          text-align: center;
        }
        dc-ai-loop .example-flow {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: .4rem;
        }
        dc-ai-loop .ex-step {
          text-align: center;
          font-size: .65rem;
          color: var(--muted);
          line-height: 1.35;
          flex: 1;
          min-width: 0;
        }
        dc-ai-loop .ex-step strong {
          color: var(--heading);
          font-size: .7rem;
          display: block;
          margin-bottom: .15rem;
        }
        dc-ai-loop .ex-bubble {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: var(--bg);
          border: 2px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto .35rem;
          font-size: 1.1rem;
        }
        dc-ai-loop .ex-arrow {
          flex-shrink: 0;
          width: 20px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--sky);
          font-size: .9rem;
        }
        dc-ai-loop .ex-arrow::before { content: "\u2192"; }

        @media (max-width: 900px) {
          dc-ai-loop .ai-examples { grid-template-columns: 1fr; }
        }

        /* ── Responsive — scale the whole ring down on small screens ── */
        @media (max-width: 680px) {
          dc-ai-loop .loop-ring {
            transform: scale(0.52);
            transform-origin: top center;
            height: ${Math.round(RING_H * 0.52)}px;
            margin-bottom: 1rem;
          }
        }
        @media (max-width: 380px) {
          dc-ai-loop .loop-ring {
            transform: scale(0.44);
            height: ${Math.round(RING_H * 0.44)}px;
          }
        }
      </style>
      <section id="ai-loop" style="background: var(--bg);">
        <div class="container">
          <p class="section-label reveal">The AI Loop</p>
          <h2 class="section-title reveal">A task kernel where AI is at every stage</h2>
          <p class="section-sub reveal">
            Others stop at "AI helps you write code." dicode puts AI at every stage &mdash;
            create, validate, deploy, monitor, fix. A continuous loop from natural language
            to self-healing automation. Every step is a git commit you can review.
          </p>

          <div class="loop-ring reveal">
            <div class="ring-track"></div>
            <div class="ring-glow"></div>

            <svg class="ring-svg" viewBox="0 0 ${RING_W} ${RING_H}" fill="none">
              ${unsafeHTML(svgContent)}
            </svg>

            <div class="ring-center">
              <div class="loop-icon">&#x267B;</div>
              <p>Continuous loop</p>
            </div>

            ${STAGES.map((s, i) => {
              const { x, y } = COORDS[i];
              return html`
                <div class="loop-node n${s.num}" style="left:${x}px;top:${y}px;">
                  <div class="node-bubble">
                    <span class="node-num">${s.num}</span>
                    ${s.icon}
                  </div>
                  <h4>${s.label}</h4>
                  <p>${s.line1}<br>${s.line2}</p>
                </div>
              `;
            })}
          </div>

          <div class="ai-details stagger">
            <div class="ai-detail">
              <h4><span>&#x1F9E0;</span> Bring your own LLM</h4>
              <p>
                Any OpenAI-compatible API. OpenAI, Claude, Ollama (free, local),
                Groq, Together, OpenRouter. Set one env var and go.
              </p>
            </div>
            <div class="ai-detail">
              <h4><span>&#x1F4B0;</span> You control the cost</h4>
              <p>
                BYO API key &mdash; dicode never touches your billing.
                Free local model for dev, cloud model for prod.
                Switch with one line in <code>dicode.yaml</code>.
              </p>
            </div>
            <div class="ai-detail">
              <h4><span>&#x1F6E1;&#xFE0F;</span> Guardrails built in</h4>
              <p>
                Every AI change = a git commit. Require review before deploy,
                auto-revert on failure, or run fully autonomous. The dial is yours.
              </p>
            </div>
            <div class="ai-detail">
              <h4><span>&#x1F504;</span> When AI is wrong</h4>
              <p>
                The fix is a commit. If it breaks, the monitor catches it &mdash;
                same as a human mistake. <code>git revert</code> is one command away.
              </p>
            </div>
          </div>

          <!-- Real-world flow examples -->
          <h3 class="section-label reveal" style="margin-top:3rem;">See it in action</h3>

          <div class="ai-examples stagger">
            <div class="ai-example">
              <div class="example-title">PR lands &#x2192; AI reviews &#x2192; Slack notifies</div>
              <div class="example-flow">
                <div class="ex-step"><div class="ex-bubble">&#x1F4E8;</div><strong>Webhook</strong><br>GitHub PR event<br>via relay URL</div>
                <div class="ex-arrow"></div>
                <div class="ex-step"><div class="ex-bubble">&#x1F916;</div><strong>AI Review</strong><br>Claude reads diff,<br>generates comments</div>
                <div class="ex-arrow"></div>
                <div class="ex-step"><div class="ex-bubble">&#x2705;</div><strong>Post</strong><br>Comments on PR<br>+ Slack summary</div>
              </div>
            </div>

            <div class="ai-example">
              <div class="example-title">API down &#x2192; AI diagnoses &#x2192; auto-fix deployed</div>
              <div class="example-flow">
                <div class="ex-step"><div class="ex-bubble">&#x274C;</div><strong>Health check</strong><br>Cron detects 502<br>on your endpoint</div>
                <div class="ex-arrow"></div>
                <div class="ex-step"><div class="ex-bubble">&#x1F527;</div><strong>AI patches</strong><br>Reads logs, generates<br>fix, commits to git</div>
                <div class="ex-arrow"></div>
                <div class="ex-step"><div class="ex-bubble">&#x1F680;</div><strong>Auto-deploy</strong><br>Reconciler picks up<br>fix &mdash; live in seconds</div>
              </div>
            </div>

            <div class="ai-example">
              <div class="example-title">Sensor triggers &#x2192; process data &#x2192; light turns on</div>
              <div class="example-flow">
                <div class="ex-step"><div class="ex-bubble">&#x1F321;&#xFE0F;</div><strong>IoT webhook</strong><br>Temperature crosses<br>threshold at 6pm</div>
                <div class="ex-arrow"></div>
                <div class="ex-step"><div class="ex-bubble">&#x2699;&#xFE0F;</div><strong>Process</strong><br>Task evaluates rules,<br>checks schedule</div>
                <div class="ex-arrow"></div>
                <div class="ex-step"><div class="ex-bubble">&#x1F4A1;</div><strong>Smart home</strong><br>Calls Hue API &mdash;<br>living room light on</div>
              </div>
            </div>
          </div>

          <!-- Relay callout -->
          <div class="ai-detail reveal" style="margin-top:2rem; border-color: rgba(13,110,253,.3); text-align:center;">
            <h4><span>&#x1F310;</span> Every task gets a public URL &mdash; no ngrok needed</h4>
            <p>
              Built-in webhook relay gives each task a stable public endpoint behind any NAT or firewall.
              ECDSA-authenticated, ECIES-encrypted. No accounts, no config, no monthly bill.
              Your IoT sensor, GitHub webhook, or Stripe event reaches your laptop instantly.
            </p>
          </div>

          <p class="reveal" style="text-align:center; margin-top:2rem;">
            <a href="/docs/concepts/ai-agent" style="color:var(--sky); text-decoration:none; font-size:.85rem; font-weight:600;">AI Agent docs &rarr;</a>
            &nbsp;&middot;&nbsp;
            <a href="/docs/concepts/relay" style="color:var(--sky); text-decoration:none; font-size:.85rem; font-weight:600;">Webhook Relay docs &rarr;</a>
            &nbsp;&middot;&nbsp;
            <a href="/docs/concepts/hot-reload" style="color:var(--sky); text-decoration:none; font-size:.85rem; font-weight:600;">Hot Reload docs &rarr;</a>
          </p>
        </div>
      </section>
    `;
  }
}
