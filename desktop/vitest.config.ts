import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Redirect electron-only modules to test mocks (not available outside Electron)
      "electron-store": path.resolve(__dirname, "__mocks__/electron-store.js"),
      electron: path.resolve(__dirname, "__mocks__/electron.js"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    exclude: ["__tests__/e2e/**", "node_modules/**"],
    setupFiles: ["__tests__/setup/vitest.setup.tsx"],
    server: {
      deps: {
        // Force these modules through Vitest's transform so resolve.alias applies
        inline: ["electron-store", "electron"],
      },
    },
  },
});
