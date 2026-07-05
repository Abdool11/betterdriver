import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    globals: true,
    env: {
      MOODLE_URL: "https://learning.transportactiongroup.com",
      MOODLE_TOKEN: "service-token",
    },
  },
});
