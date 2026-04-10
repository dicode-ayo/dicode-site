import { defineConfig } from "vitepress";

export default defineConfig({
  title: "dicode",
  description: "Documentation for the dicode task orchestrator",
  base: "/docs/",
  outDir: "../docs/docs",
  cleanUrls: true,

  head: [
    ["link", { rel: "icon", href: "/docs/favicon.ico" }],
  ],

  themeConfig: {
    logo: undefined,
    siteTitle: "dicode docs",

    nav: [
      { text: "Home", link: "https://dicode-ayo.github.io/dicode-site/" },
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
          { text: "SDK Globals", link: "/concepts/sdk" },
          { text: "Secrets", link: "/concepts/secrets" },
          { text: "Sources & TaskSets", link: "/concepts/sources" },
          { text: "Webhook Relay", link: "/concepts/relay" },
        ],
      },
      {
        text: "Examples",
        items: [
          { text: "Cron Task (TypeScript)", link: "/examples/cron-task" },
          { text: "Webhook with UI", link: "/examples/webhook-task" },
          { text: "Docker Task", link: "/examples/docker-task" },
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
