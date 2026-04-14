import { execSync } from "node:child_process";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

function getGitCommit() {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? "0.1.0"),
    __APP_COMMIT__: JSON.stringify(process.env.VITE_APP_COMMIT ?? getGitCommit())
  },
  server: {
    host: "0.0.0.0",
    port: 5173
  },
  test: {
    environment: "jsdom",
    setupFiles: []
  }
});
