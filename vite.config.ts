import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import istanbul from "vite-plugin-istanbul";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enableE2ECoverage = process.env.E2E_COVERAGE === "true";
const plugins = [TanStackRouterVite(), react(), tailwindcss()];

if (enableE2ECoverage) {
  plugins.push(
    istanbul({
      cypress: false,
      exclude: [
        "node_modules",
        "__tests__",
        "src/routeTree.gen.ts",
        "src/types/**",
      ],
      extension: [".ts", ".tsx"],
      include: "src/**/*",
      requireEnv: false,
    })
  );
}

// https://vite.dev/config/
export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
