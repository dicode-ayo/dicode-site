import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

/** Each example is a horizontal flow of steps with animated connectors */
interface FlowStep {
  icon: string;
  label: string;
  sub: string;
  /** Color accent for the step bubble */
  accent?: string;
}

interface Example {
  title: string;
  steps: FlowStep[];
  /** Duration of the traveling dot animation in seconds */
  dur: number;
  /** Delay before the dot starts (stagger between examples) */
  delay: number;
}

const EXAMPLES: Example[] = [
  {
    title: "PR lands \u2192 AI reviews \u2192 Slack notifies",
    steps: [
      { icon: "\uD83D\uDCE8", label: "GitHub Webhook", sub: "PR opened on your repo" },
      { icon: "\uD83E\uDD16", label: "AI Review", sub: "Claude reads the diff,\ngenerates comments" },
      { icon: "\u2705", label: "Post Review", sub: "Comments posted\non the PR" },
      { icon: "\uD83D\uDCAC", label: "Slack Notify", sub: "Team gets a summary\nin #code-review" },
    ],
    dur: 6,
    delay: 0,
  },
  {
    title: "API goes down \u2192 AI diagnoses \u2192 fix deployed",
    steps: [
      { icon: "\u274C", label: "Health Check Fails", sub: "Cron task detects\n502 on api.example.com" },
      { icon: "\uD83D\uDD0D", label: "AI Investigates", sub: "Reads logs, checks\nrecent deploys" },
      { icon: "\uD83D\uDD27", label: "AI Patches", sub: "Generates fix,\ncommits to git" },
      { icon: "\uD83D\uDE80", label: "Auto-Deploy", sub: "Reconciler picks up\nfix — live in seconds" },
    ],
    dur: 7,
    delay: 2,
  },
  {
    title: "Sensor triggers \u2192 process data \u2192 light turns on",
    steps: [
      { icon: "\uD83C\uDF21\uFE0F", label: "IoT Sensor", sub: "Temperature threshold\ncrossed at 6pm" },
      { icon: "\u2699\uFE0F", label: "Process Data", sub: "Task evaluates rules,\nchecks schedule" },
      { icon: "\uD83D\uDCA1", label: "Smart Home", sub: "Calls Hue API —\nliving room light on" },
      { icon: "\uD83D\uDCF1", label: "Push Notify", sub: "ntfy sends alert\nto your phone" },
    ],
    dur: 6,
    delay: 4,
  },
];

/** Geometry for the SVG flow connector */
const BOX_W = 130;       // visual box width
const GAP = 56;           // gap between boxes (for the arrow area)
const FLOW_W = EXAMPLES[0].steps.length * BOX_W + (EXAMPLES[0].steps.length - 1) * GAP;
const SVG_H = 8;          // connector height (just a line)
const STEP_PITCH = BOX_W + GAP; // center-to-center distance between steps

function flowPath(stepCount: number): string {
  const startX = BOX_W / 2;
  const endX = startX + (stepCount - 1) * STEP_PITCH;
  return `M${startX} 4 L${endX} 4`;
}

@customElement("dc-ai-examples")
export class DcAiExamples extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-ai-examples .examples-list {
          display: flex;
          flex-direction: column;
          gap: 3.5rem;
        }

        /* ── Single example ── */
        dc-ai-examples .example {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 2rem 2.5rem;
          overflow: hidden;
        }
        dc-ai-examples .example-title {
          font-size: .85rem;
          font-weight: 700;
          color: var(--heading);
          margin-bottom: 1.5rem;
          text-align: center;
          letter-spacing: -.01em;
        }

        /* ── Flow row ── */
        dc-ai-examples .flow-row {
          position: relative;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: ${GAP}px;
        }

        /* SVG connector behind the steps */
        dc-ai-examples .flow-connector {
          position: absolute;
          top: 28px; /* half of bubble (56px / 2) */
          left: 0;
          right: 0;
          height: ${SVG_H}px;
          z-index: 0;
          pointer-events: none;
        }
        dc-ai-examples .flow-connector svg {
          width: 100%;
          height: 100%;
        }

        /* ── Step ── */
        dc-ai-examples .flow-step {
          width: ${BOX_W}px;
          text-align: center;
          position: relative;
          z-index: 1;
          flex-shrink: 0;
        }
        dc-ai-examples .flow-step .step-bubble {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: var(--bg);
          border: 2px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto .5rem;
          font-size: 1.4rem;
          transition: border-color .3s, box-shadow .3s;
        }
        dc-ai-examples .flow-step h4 {
          font-size: .78rem;
          font-weight: 700;
          color: var(--heading);
          margin-bottom: .15rem;
        }
        dc-ai-examples .flow-step p {
          font-size: .65rem;
          color: var(--muted);
          line-height: 1.35;
          white-space: pre-line;
        }

        /* Arrow between steps (pure CSS) */
        dc-ai-examples .flow-arrow {
          flex-shrink: 0;
          width: ${GAP}px;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 56px; /* align with bubble */
          position: relative;
          z-index: 1;
        }
        dc-ai-examples .flow-arrow::before {
          content: '';
          display: block;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, var(--border), var(--sky), var(--border));
          position: relative;
        }
        dc-ai-examples .flow-arrow::after {
          content: '';
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 0; height: 0;
          border-top: 5px solid transparent;
          border-bottom: 5px solid transparent;
          border-left: 8px solid var(--sky);
        }

        /* Traveling dot on each flow */
        dc-ai-examples .flow-dot {
          position: absolute;
          top: 25px; /* centered on the connector line */
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--blue);
          box-shadow: 0 0 10px rgba(13,110,253,.6);
          z-index: 2;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }

        /* Each example gets a different animation */
        dc-ai-examples .example:nth-child(1) .flow-dot { animation: al-dot-flow1 6s ease-in-out infinite 0s; }
        dc-ai-examples .example:nth-child(2) .flow-dot { animation: al-dot-flow2 7s ease-in-out infinite 2s; }
        dc-ai-examples .example:nth-child(3) .flow-dot { animation: al-dot-flow3 6s ease-in-out infinite 4s; }

        @keyframes al-dot-flow1 {
          0%, 5%   { left: 0%; opacity: 0; }
          10%      { opacity: 1; }
          90%      { opacity: 1; }
          95%, 100% { left: 95%; opacity: 0; }
        }
        @keyframes al-dot-flow2 {
          0%, 5%   { left: 0%; opacity: 0; }
          10%      { opacity: 1; }
          90%      { opacity: 1; }
          95%, 100% { left: 95%; opacity: 0; }
        }
        @keyframes al-dot-flow3 {
          0%, 5%   { left: 0%; opacity: 0; }
          10%      { opacity: 1; }
          90%      { opacity: 1; }
          95%, 100% { left: 95%; opacity: 0; }
        }

        /* Step glow when dot passes — use animation delays synced to dot */
        dc-ai-examples .example:nth-child(1) .flow-step:nth-child(1) .step-bubble { animation: al-step-flash 6s ease-in-out infinite 0.3s; }
        dc-ai-examples .example:nth-child(1) .flow-step:nth-child(2) .step-bubble { animation: al-step-flash 6s ease-in-out infinite 1.8s; }
        dc-ai-examples .example:nth-child(1) .flow-step:nth-child(3) .step-bubble { animation: al-step-flash 6s ease-in-out infinite 3.3s; }
        dc-ai-examples .example:nth-child(1) .flow-step:nth-child(4) .step-bubble { animation: al-step-flash 6s ease-in-out infinite 4.8s; }

        dc-ai-examples .example:nth-child(2) .flow-step:nth-child(1) .step-bubble { animation: al-step-flash 7s ease-in-out infinite 2.3s; }
        dc-ai-examples .example:nth-child(2) .flow-step:nth-child(2) .step-bubble { animation: al-step-flash 7s ease-in-out infinite 3.8s; }
        dc-ai-examples .example:nth-child(2) .flow-step:nth-child(3) .step-bubble { animation: al-step-flash 7s ease-in-out infinite 5.3s; }
        dc-ai-examples .example:nth-child(2) .flow-step:nth-child(4) .step-bubble { animation: al-step-flash 7s ease-in-out infinite 6.5s; }

        dc-ai-examples .example:nth-child(3) .flow-step:nth-child(1) .step-bubble { animation: al-step-flash 6s ease-in-out infinite 4.3s; }
        dc-ai-examples .example:nth-child(3) .flow-step:nth-child(2) .step-bubble { animation: al-step-flash 6s ease-in-out infinite 5.8s; }
        dc-ai-examples .example:nth-child(3) .flow-step:nth-child(3) .step-bubble { animation: al-step-flash 6s ease-in-out infinite 7.3s; }
        dc-ai-examples .example:nth-child(3) .flow-step:nth-child(4) .step-bubble { animation: al-step-flash 6s ease-in-out infinite 8.8s; }

        @keyframes al-step-flash {
          0%, 8%, 100% {
            border-color: var(--border);
            box-shadow: none;
          }
          3%, 5% {
            border-color: var(--blue);
            box-shadow: 0 0 14px rgba(13,110,253,.4);
          }
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          dc-ai-examples .example { padding: 1.5rem 1rem; }
          dc-ai-examples .flow-row { gap: ${Math.round(GAP * 0.5)}px; }
          dc-ai-examples .flow-step { width: 100px; }
          dc-ai-examples .flow-step .step-bubble { width: 44px; height: 44px; font-size: 1.1rem; }
          dc-ai-examples .flow-step h4 { font-size: .7rem; }
          dc-ai-examples .flow-step p { font-size: .58rem; }
          dc-ai-examples .flow-arrow { width: ${Math.round(GAP * 0.5)}px; height: 44px; }
        }
        @media (max-width: 640px) {
          dc-ai-examples .flow-row {
            flex-wrap: wrap;
            gap: .5rem;
          }
          dc-ai-examples .flow-arrow { display: none; }
          dc-ai-examples .flow-step { width: calc(50% - .5rem); }
          dc-ai-examples .flow-dot { display: none; }
          dc-ai-examples .flow-connector { display: none; }
        }
      </style>
      <section id="ai-examples" style="background: var(--bg-alt);">
        <div class="container">
          <p class="section-label reveal">Real-World Flows</p>
          <h2 class="section-title reveal">See the loop in action</h2>
          <p class="section-sub reveal">
            Every flow is built from tasks chained together. AI handles the intelligence.
            Git versions every step. You watch it happen.
          </p>

          <div class="examples-list stagger">
            ${EXAMPLES.map(
              (ex) => html`
                <div class="example">
                  <div class="example-title">${ex.title}</div>
                  <div class="flow-row">
                    <div class="flow-dot"></div>
                    ${ex.steps.map(
                      (step, i) => html`
                        ${i > 0
                          ? html`<div class="flow-arrow"></div>`
                          : ""}
                        <div class="flow-step">
                          <div class="step-bubble">${step.icon}</div>
                          <h4>${step.label}</h4>
                          <p>${step.sub}</p>
                        </div>
                      `,
                    )}
                  </div>
                </div>
              `,
            )}
          </div>
        </div>
      </section>
    `;
  }
}
