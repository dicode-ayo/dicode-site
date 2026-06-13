import { defineConfig } from "vitepress";

export default defineConfig({
  title: "dicode",
  description: "Documentation for the dicode task orchestrator",
  base: "/docs/",
  outDir: "../docs/docs",
  cleanUrls: true,
  sitemap: {
    hostname: "https://dicode.app/docs/",
  },

  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    // OpenGraph (per-page og:title and og:description come from frontmatter)
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "dicode docs" }],
    ["meta", { property: "og:locale", content: "en_US" }],
    ["meta", { property: "og:image", content: "https://dicode.app/og-image.png" }],
    ["meta", { property: "og:image:width", content: "1200" }],
    ["meta", { property: "og:image:height", content: "630" }],
    ["meta", { property: "og:image:alt", content: "dicode — You describe it. AI builds, ships, and fixes it. Open source, free forever." }],
    // Twitter / X / Slack / Discord / LinkedIn link previews
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:image", content: "https://dicode.app/og-image.png" }],
  ],

  transformPageData(pageData) {
    const cleanPath = pageData.relativePath
      .replace(/(^|\/)index\.md$/, "$1")
      .replace(/\.md$/, "");
    const url = `https://dicode.app/docs/${cleanPath}`;
    pageData.frontmatter.head ??= [];
    pageData.frontmatter.head.push(
      ["link", { rel: "canonical", href: url }],
      ["meta", { property: "og:url", content: url }],
    );
  },

  themeConfig: {
    logo: undefined,
    siteTitle: "dicode docs",

    nav: [
      { text: "Home", link: "/" },
      { text: "Getting Started", link: "/getting-started/" },
      { text: "Concepts", link: "/concepts/tasks" },
      { text: "Examples", link: "/examples/cron-task" },
      { text: "GitHub", link: "https://github.com/dicode-ayo/dicode-core" },
    ],

    sidebar: [
      {
        text: "Getting Started",
        items: [
          { text: "Installation & Quickstart", link: "/getting-started/" },
          { text: "Your First Task", link: "/getting-started/first-task" },
          { text: "Configuration", link: "/getting-started/configuration" },
        ],
      },
      {
        text: "Concepts",
        items: [
          { text: "Tasks", link: "/concepts/tasks" },
          { text: "Runtimes", link: "/concepts/runtimes" },
          { text: "Triggers", link: "/concepts/triggers" },
          { text: "Pipelines", link: "/concepts/pipelines" },
          { text: "SDK Globals", link: "/concepts/sdk" },
          { text: "Secrets", link: "/concepts/secrets" },
          { text: "Sources & TaskSets", link: "/concepts/sources" },
          { text: "Task Sharing & Registry", link: "/concepts/sharing" },
          { text: "Hot Reload & Dev Workflow", link: "/concepts/hot-reload" },
          { text: "Webhook Relay", link: "/concepts/relay" },
          { text: "AI Agent", link: "/concepts/ai-agent" },
          { text: "Auto-fix Loop", link: "/concepts/auto-fix" },
          { text: "MCP Server", link: "/concepts/mcp-server" },
          { text: "Security & Audit Log", link: "/concepts/security" },
        ],
      },
      {
        text: "Examples",
        items: [
          { text: "Cron Task (TypeScript)", link: "/examples/cron-task" },
          { text: "Webhook with UI", link: "/examples/webhook-task" },
          { text: "Docker Task", link: "/examples/docker-task" },
          { text: "Throwaway UIs", link: "/examples/throwaway-ui" },
        ],
      },
    ],

    outline: {
      level: [2, 3],
      label: "On this page",
    },

    search: {
      provider: "local",
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/dicode-ayo/dicode-core" },
    ],

    editLink: {
      pattern: "https://github.com/dicode-ayo/dicode-site/edit/main/docs-src/:path",
      text: "Edit this page on GitHub",
    },
  },
});
