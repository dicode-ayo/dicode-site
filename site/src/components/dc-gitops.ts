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
        dc-gitops .gitops-compare {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 3rem;
        }
        dc-gitops .gitops-side {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.6rem;
        }
        dc-gitops .gitops-side.bad { opacity: .8; }
        dc-gitops .gitops-side.good { border-color: rgba(13,110,253,.4); }
        dc-gitops .gitops-side h4 {
          font-size: .8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .06em;
          margin-bottom: 1rem;
        }
        dc-gitops .gitops-side.bad h4 { color: var(--muted); }
        dc-gitops .gitops-side.good h4 { color: var(--sky); }
        dc-gitops .gitops-side ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: .5rem;
        }
        dc-gitops .gitops-side li {
          font-size: .85rem;
          color: var(--text);
          line-height: 1.5;
          padding-left: 1.6rem;
          position: relative;
        }
        dc-gitops .gitops-side li::before {
          position: absolute;
          left: 0;
          font-family: 'Fira Code', 'Cascadia Code', monospace;
          font-size: .75rem;
        }
        dc-gitops .gitops-side.bad li::before { content: '\u251C\u2500'; color: var(--muted); }
        dc-gitops .gitops-side.bad li:last-child::before { content: '\u2514\u2500'; }
        dc-gitops .gitops-side.good li::before { content: '\u251C\u2500'; color: var(--green); }
        dc-gitops .gitops-side.good li:last-child::before { content: '\u2514\u2500'; }

        dc-gitops .argo-table {
          width: 100%;
          border-collapse: collapse;
          font-size: .82rem;
        }
        dc-gitops .argo-table th {
          padding: .7rem .8rem;
          color: var(--muted);
          font-weight: 600;
          font-size: .75rem;
          text-transform: uppercase;
          letter-spacing: .05em;
          text-align: left;
        }
        dc-gitops .argo-table th:last-child { color: var(--sky); }
        dc-gitops .argo-table thead tr { border-bottom: 2px solid var(--border); }
        dc-gitops .argo-table tbody tr { border-bottom: 1px solid var(--border); }
        dc-gitops .argo-table tbody tr:last-child { border-bottom: none; }
        dc-gitops .argo-table td {
          padding: .5rem .8rem;
          color: var(--text);
          font-size: .82rem;
        }
        @media (max-width: 640px) {
          dc-gitops .gitops-compare { grid-template-columns: 1fr; }
          dc-gitops .argo-table { font-size: .72rem; }
          dc-gitops .argo-table th, dc-gitops .argo-table td { padding: .4rem .5rem; }
        }
      </style>
      <section id="gitops" style="background: var(--bg);">
        <div class="container">
          <p class="section-label reveal">Declarative DevOps</p>
          <h2 class="section-title reveal">What's in git is what's running</h2>
          <p class="section-sub reveal">
            No drift. No mystery. No "where did that script go?"
            Your git repo IS the desired state. dicode reconciles it automatically &mdash;
            the same model as ArgoCD, without the cluster.
          </p>

          <div class="gitops-compare stagger">
            <div class="gitops-side bad">
              <h4>Traditional automation</h4>
              <ul>
                <li>SSH into server</li>
                <li>Edit crontab (hope you remember the syntax)</li>
                <li>Create a script somewhere (/opt? ~/scripts? /tmp?)</li>
                <li>Set env vars in .bashrc? .env? systemd?</li>
                <li>Forget about it for 6 months</li>
                <li>Server dies &mdash; "What was running on that box?"</li>
                <li>Rebuild from memory and tears</li>
              </ul>
            </div>
            <div class="gitops-side good">
              <h4>dicode</h4>
              <ul>
                <li>task.yaml in git (declarative, reviewed, versioned)</li>
                <li>Save a file &mdash; live in 100ms (fsnotify)</li>
                <li>git push &mdash; live in under 1 second (webhook)</li>
                <li>New server? Clone + ./dicoded &mdash; identical setup</li>
                <li>Server dies &mdash; clone repo anywhere, same result</li>
                <li>git log &mdash; full history of what ran and when</li>
                <li>Permissions, secrets, triggers &mdash; all in the manifest</li>
                <li>Zero drift, zero surprises</li>
              </ul>
            </div>
          </div>

          <div class="reveal" style="overflow-x: auto;">
            <table class="argo-table">
              <thead>
                <tr>
                  <th></th>
                  <th>ArgoCD (Kubernetes)</th>
                  <th>dicode (everywhere else)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Watches</td>
                  <td>Git for K8s manifests</td>
                  <td>Git for task.yaml files</td>
                </tr>
                <tr>
                  <td>Reconciles</td>
                  <td>Desired vs actual cluster state</td>
                  <td>Desired vs actual task registry</td>
                </tr>
                <tr>
                  <td>Drift detection</td>
                  <td>Continuous sync</td>
                  <td>Hash-based change detection + auto-reload</td>
                </tr>
                <tr>
                  <td>Requires</td>
                  <td>Kubernetes cluster</td>
                  <td>One binary</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="reveal" style="text-align:center; margin-top:2rem;">
            <a href="/docs/concepts/sources" style="color:var(--sky); text-decoration:none; font-size:.85rem; font-weight:600;">Sources & TaskSets docs &rarr;</a>
            &nbsp;&middot;&nbsp;
            <a href="/docs/concepts/sharing" style="color:var(--sky); text-decoration:none; font-size:.85rem; font-weight:600;">Task Sharing &rarr;</a>
          </p>
        </div>
      </section>
    `;
  }
}
