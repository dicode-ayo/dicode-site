import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("dc-ai-how")
export class DcAiHow extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-ai-how .ai-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        dc-ai-how .ai-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.6rem;
        }
        dc-ai-how .ai-card h3 {
          font-size: .95rem;
          font-weight: 700;
          color: var(--heading);
          margin-bottom: .5rem;
          display: flex;
          align-items: center;
          gap: .5rem;
        }
        dc-ai-how .ai-card h3 span { font-size: 1.2rem; }
        dc-ai-how .ai-card p {
          color: var(--muted);
          font-size: .85rem;
          line-height: 1.6;
        }
        dc-ai-how .ai-card code {
          color: var(--sky);
          font-family: 'Fira Code', 'Cascadia Code', monospace;
          font-size: .78rem;
          background: var(--blue-tint);
          padding: 1px 5px;
          border-radius: 4px;
        }
        dc-ai-how .ai-card ul {
          list-style: none;
          margin-top: .5rem;
          display: flex;
          flex-direction: column;
          gap: .3rem;
        }
        dc-ai-how .ai-card li {
          font-size: .82rem;
          color: var(--text);
          padding-left: 1.2rem;
          position: relative;
          line-height: 1.5;
        }
        dc-ai-how .ai-card li::before {
          content: '\u2713';
          position: absolute;
          left: 0;
          color: var(--green);
          font-weight: 700;
        }
        @media (max-width: 640px) {
          dc-ai-how .ai-cards { grid-template-columns: 1fr; gap: 1rem; }
          dc-ai-how .ai-card { padding: 1.2rem; }
        }
      </style>
      <section id="ai-how" style="background: var(--bg-alt);">
        <div class="container">
          <p class="section-label reveal">Under the Hood</p>
          <h2 class="section-title reveal">How the AI actually works</h2>
          <p class="section-sub reveal">
            No magic. No lock-in. You bring the model, you see every prompt,
            and every AI action is a git commit you can revert.
          </p>

          <div class="ai-cards stagger">
            <div class="ai-card">
              <h3><span>&#x1F9E0;</span> Bring your own LLM</h3>
              <p>
                Works with any OpenAI-compatible API. Set one env var and go.
              </p>
              <ul>
                <li>OpenAI (GPT-4o, o1)</li>
                <li>Anthropic (Claude)</li>
                <li>Ollama, LM Studio (free, local)</li>
                <li>Groq, Together, OpenRouter</li>
              </ul>
            </div>

            <div class="ai-card">
              <h3><span>&#x1F4B0;</span> You control the cost</h3>
              <p>
                BYO API key &mdash; dicode never touches your billing.
                Use a free local model for dev, a cloud model for prod.
                The <code>ai.model</code> field in config switches in one line.
              </p>
            </div>

            <div class="ai-card">
              <h3><span>&#x1F6E1;&#xFE0F;</span> Guardrails built in</h3>
              <p>
                Every AI-generated change is a git commit with a clear diff.
                You can require review before deploy, auto-revert on failure,
                or let AI run fully autonomous. The dial is yours.
              </p>
              <ul>
                <li>AI changes = git commits (reviewable, revertable)</li>
                <li>Permissions sandbox limits what AI can touch</li>
                <li>Run history logs every decision</li>
              </ul>
            </div>

            <div class="ai-card">
              <h3><span>&#x1F504;</span> What happens when AI is wrong?</h3>
              <p>
                The fix is a commit. If the fix breaks things, the next run fails,
                and the monitoring loop catches it &mdash; same as a human mistake.
                <code>git revert</code> is always one command away.
                The AI agent itself is a task you can replace or tune.
              </p>
            </div>
          </div>
        </div>
      </section>
    `;
  }
}
