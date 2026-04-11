import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: resolve(__dirname),
  base: "/dicode-site/",
  build: {
    outDir: resolve(__dirname, "../docs"),
    emptyOutDir: false,
  },
});
