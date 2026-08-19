import { defineConfig } from "vitest/config";
import path from "path";

import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));

  return {
    test: {
      globals: true,
      environment: "node",
      setupFiles: ["./vitest.setup.ts"],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
