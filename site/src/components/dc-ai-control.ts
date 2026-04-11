import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("dc-ai-control")
export class DcAiControl extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-ai-control .flow-diagram {
          display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 1rem;
          margin-top: 0;
        }
        dc-ai-control .flow-box {
          background: var(--card-bg); border: 1px solid var(--border);
          border-radius: 10px; padding: 1rem 1.4rem; text-align: center;
          min-width: 160px;
        }
        dc-ai-control .flow-box h4 { font-size: .85rem; font-weight: 700; color: #fff; margin-bottom: .3rem; }
        dc-ai-control .flow-box p { font-size: .78rem; color: var(--muted); line-height: 1.4; }
        dc-ai-control .flow-arrow { color: var(--blue); font-size: 1.5rem; font-weight: 700; flex-shrink: 0; }
        @media (max-width: 640px) {
          dc-ai-control .flow-diagram { flex-direction: column; gap: .6rem; }
          dc-ai-control .flow-arrow { transform: rotate(90deg); }
          dc-ai-control .flow-box { min-width: 140px; padding: .8rem 1rem; }
        }
      </style>
      <section id="ai-control" style="background: var(--navy);">
        <div class="container">
          <p class="section-label reveal">AI In Control</p>
          <h2 class="section-title reveal">AI writes code. You approve it.</h2>
          <p class="section-sub reveal">Build as many AI-powered tasks as you want. Each one is just a task with dicode.run_task(). Use dicode to bind AI tools together through chaining and webhooks.</p>

          <div class="reveal" style="background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 2rem; margin-bottom: 2.5rem;">
            <h3 style="color: #fff; font-size: 1.15rem; font-weight: 700; margin-bottom: .75rem;">Real example: AI-Powered PR Review Bot</h3>
            <p style="color: var(--muted); font-size: .9rem; line-height: 1.7; margin-bottom: 1.5rem;">A GitHub App that monitors PRs on your tasks repo, runs an AI code review on each change, posts review comments, and sends a Slack notification. All built as 3 chained dicode tasks — no custom infrastructure.</p>

            <div class="flow-diagram">
              <div class="flow-box">
                <h4>Task 1: Webhook</h4>
                <p>GitHub sends PR event<br>via webhook relay</p>
              </div>
              <div class="flow-arrow">&rarr;</div>
              <div class="flow-box" style="border-color: rgba(13,110,253,.4);">
                <h4>Task 2: AI Review</h4>
                <p>Claude reviews the diff,<br>generates comments</p>
              </div>
              <div class="flow-arrow">&rarr;</div>
              <div class="flow-box">
                <h4>Task 3: Notify</h4>
                <p>Posts to GitHub PR<br>+ Slack channel</p>
              </div>
            </div>
          </div>

          <div class="features-grid stagger">
            <div class="feature-card">
              <div class="feature-icon">&#x1F916;</div>
              <h3>AI Generates, You Approve</h3>
              <p>AI writes code, you review and approve. Or have another AI review it — use dicode's MCP server to wire up an AI reviewer that checks quality before tasks go live.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">&#x1F9E9;</div>
              <h3>MCP Server Built In</h3>
              <p>Expose dicode as an MCP server. AI agents can list tasks, read code, trigger runs, and control dev mode today. Write, validate, test, and deploy tasks autonomously — coming soon. Works with Claude Code, Cursor, and any MCP-compatible agent.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">&#x1F50C;</div>
              <h3>Turn Tasks Into MCP Tools</h3>
              <p>Any task — or combination of tasks — becomes an MCP tool that other agents can discover and call. A Slack notifier task becomes a Slack tool. A deploy pipeline becomes a deploy tool. Build once, expose to every AI agent in your organization.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">&#x1F517;</div>
              <h3>Chain AI With Everything</h3>
              <p>Use dicode to bind AI tools together through chaining and webhooks. Build complex AI workflows from simple, composable tasks — each one inspectable, testable, and replaceable.</p>
            </div>
          </div>
        </div>
      </section>
    `;
  }
}
