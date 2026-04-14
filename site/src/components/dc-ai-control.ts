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
        dc-ai-control .flow-box h4 { font-size: .85rem; font-weight: 700; color: var(--heading); margin-bottom: .3rem; }
        dc-ai-control .flow-box p { font-size: .78rem; color: var(--muted); line-height: 1.4; }
        dc-ai-control .flow-arrow {
          color: var(--blue); font-size: 1.5rem; font-weight: 700; flex-shrink: 0;
          line-height: 1;
          display: flex; align-items: center; justify-content: center;
        }
        dc-ai-control .flow-arrow::before { content: "→"; }
        @media (max-width: 900px) {
          dc-ai-control .flow-diagram { flex-direction: column; gap: var(--space-md); }
          dc-ai-control .flow-arrow::before { content: "↓"; }
          dc-ai-control .flow-box { min-width: 140px; padding: .8rem 1rem; width: 100%; max-width: 100%; }
        }
      </style>
      <section id="ai-control" style="background: var(--bg);">
        <div class="container">
          <p class="section-label reveal">AI In Control</p>
          <h2 class="section-title reveal">Chat with an agent that runs your tasks.</h2>
          <p class="section-sub reveal">A built-in chat page where the model can call every task you've written as a tool. Ask a question, get an answer backed by real data — not a hallucination. Works with any OpenAI-compatible provider you choose.</p>

          <div class="reveal" style="background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 2rem; margin-bottom: 2.5rem;">
            <h3 style="color: var(--heading); font-size: 1.15rem; font-weight: 700; margin-bottom: .75rem;">Real example: AI-Powered PR Review Bot</h3>
            <p style="color: var(--muted); font-size: .9rem; line-height: 1.7; margin-bottom: 1.5rem;">A GitHub App that monitors PRs on your tasks repo, runs an AI code review on each change, posts review comments, and sends a Slack notification. All built as 3 chained dicode tasks — no custom infrastructure.</p>

            <div class="flow-diagram">
              <div class="flow-box">
                <h4>Task 1: Webhook</h4>
                <p>GitHub sends PR event<br>via webhook relay</p>
              </div>
              <div class="flow-arrow"></div>
              <div class="flow-box" style="border-color: rgba(13,110,253,.4);">
                <h4>Task 2: AI Review</h4>
                <p>Claude reviews the diff,<br>generates comments</p>
              </div>
              <div class="flow-arrow"></div>
              <div class="flow-box">
                <h4>Task 3: Notify</h4>
                <p>Posts to GitHub PR<br>+ Slack channel</p>
              </div>
            </div>
          </div>

          <div class="features-grid stagger">
            <div class="feature-card">
              <div class="feature-icon">&#x1F4AC;</div>
              <h3>Built-In AI Agent</h3>
              <p>Ships with an ai-agent task you open like any other webhook UI. Persistent sessions, lazy history compaction, and a tool-use loop that invokes your tasks automatically. Zero setup beyond picking a provider.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">&#x1F50C;</div>
              <h3>Every Task Is A Tool</h3>
              <p>The agent discovers your registered tasks and exposes them as callable tools using each task's declared params as the schema. Ask "list my failed runs from last week" and the agent calls the right task — no glue code.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">&#x1F4DA;</div>
              <h3>Skills As Markdown</h3>
              <p>Drop markdown files into tasks/skills/ and the agent loads them into its system prompt on demand. Teach it your domain, your runbooks, your conventions — durable context that survives across sessions.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">&#x1F916;</div>
              <h3>Bring Your Own Provider</h3>
              <p>Works with OpenAI, Anthropic, Ollama, Groq, OpenRouter, LM Studio, Together — anything that speaks the OpenAI API. Switch providers by editing one line of task config. Free local models work the same as paid cloud ones.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">&#x1F9E9;</div>
              <h3>MCP Server Built In</h3>
              <p>Expose dicode as an MCP server. AI agents can list tasks, read code, trigger runs, and control dev mode today. Write, validate, test, and deploy tasks autonomously — coming soon. Works with Claude Code, Cursor, and any MCP-compatible agent.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">&#x2728;</div>
              <h3>AI Generates Tasks Too</h3>
              <p>Separate from the agent: describe what you want to automate in plain English and dicode writes the task, commits it to git, and reloads it live. The two features complement each other — one authors, one operates.</p>
            </div>
          </div>
        </div>
      </section>
    `;
  }
}
