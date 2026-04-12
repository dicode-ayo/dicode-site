import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("dc-gitops")
export class DcGitops extends LitElement {
  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        dc-gitops .gitops-visual {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          flex-wrap: wrap;
          margin-top: 2rem;
        }
        dc-gitops .gitops-node {
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          min-width: 180px;
          flex: 1;
          max-width: 240px;
        }
        dc-gitops .gitops-node .node-icon {
          font-size: 2rem;
          margin-bottom: .5rem;
        }
        dc-gitops .gitops-node h4 {
          margin: 0 0 .5rem;
          color: var(--heading);
        }
        dc-gitops .gitops-node p {
          margin: 0;
          color: var(--muted);
          font-size: .9rem;
        }
        dc-gitops .gitops-arrow {
          font-size: 2rem;
          color: var(--sky);
          font-weight: bold;
        }
        @media (max-width: 768px) {
          dc-gitops .gitops-visual {
            flex-direction: column;
          }
          dc-gitops .gitops-arrow {
            transform: rotate(90deg);
          }
        }
      </style>
      <section id="gitops" style="background: var(--bg);">
        <div class="container">
          <p class="section-label reveal">True GitOps</p>
          <h2 class="section-title reveal">Everything lives in git</h2>
          <p class="section-sub reveal">A <strong style="color:var(--sky)">TaskSet</strong> manifest maps tasks from anywhere — your own repo, a community store, shared team repos — into one unified automation surface. Push a change, it's live in seconds. The same pattern as ArgoCD and Flux — but for automation tasks.</p>

          <div class="code-block reveal" style="max-width: 600px; margin: 0 auto 3rem;">
            <div class="code-header">
              <div class="dot"></div><div class="dot"></div><div class="dot"></div>
              <span class="filename">taskset.yaml</span>
            </div>
            <pre><code><span class="kw">apiVersion</span>: dicode/v1
<span class="kw">kind</span>: TaskSet
<span class="kw">metadata</span>:
  <span class="prop">name</span>: <span class="str">my-infra</span>

<span class="kw">spec</span>:
  <span class="prop">entries</span>:
    <span class="cmt"># Your own tasks</span>
    <span class="prop">pr-digest</span>:
      <span class="kw">ref</span>: { <span class="prop">path</span>: <span class="str">./tasks/pr-digest</span> }

    <span class="cmt"># Community store task</span>
    <span class="prop">slack-alerts</span>:
      <span class="kw">ref</span>: { <span class="prop">url</span>: <span class="str">github.com/dicode-community/tasks</span>, <span class="prop">path</span>: <span class="str">slack-alerts</span> }

    <span class="cmt"># Shared team repo</span>
    <span class="prop">deploy</span>:
      <span class="kw">ref</span>: { <span class="prop">url</span>: <span class="str">github.com/my-org/shared-ops</span>, <span class="prop">path</span>: <span class="str">deploy</span> }

    <span class="cmt"># Nested TaskSet — compose hierarchies</span>
    <span class="prop">monitoring</span>:
      <span class="kw">ref</span>: { <span class="prop">path</span>: <span class="str">./monitoring/taskset.yaml</span> }</code></pre>
          </div>

          <div class="gitops-visual stagger">
            <div class="gitops-node">
              <div class="node-icon">💻</div>
              <h4>Your Laptop</h4>
              <p>Edit locally, instant reload<br>via fsnotify (~100ms)</p>
            </div>
            <div class="gitops-arrow">→</div>
            <div class="gitops-node">
              <div class="node-icon">🖥️</div>
              <h4>Self-Hosted</h4>
              <p>Docker, Kubernetes,<br>bare metal — same code</p>
            </div>
            <div class="gitops-arrow">→</div>
            <div class="gitops-node">
              <div class="node-icon">☁️</div>
              <h4>dicode.app Cloud</h4>
              <p>Managed, zero changes<br>needed to migrate</p>
            </div>
          </div>

          <div class="features-grid stagger" style="margin-top: 3rem;">
            <div class="feature-card">
              <div class="feature-icon">🔄</div>
              <h3>Auto-Reconciliation</h3>
              <p>dicode watches all sources, computes content hashes, and reconciles. Add, update, or remove tasks without restarting anything.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🗂️</div>
              <h3>TaskSet Composition</h3>
              <p>Map tasks from multiple git repos, local directories, and community stores into one namespace. Nested TaskSets, override inheritance, namespace-scoped IDs like <code style="color:var(--sky)">infra/deploy</code>.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔁</div>
              <h3>Fully Portable</h3>
              <p>Works on your laptop, same code on Docker/Kubernetes, same code on cloud. Zero config changes between environments. Git permissions control access.</p>
            </div>
          </div>
        </div>
      </section>
    `;
  }
}
