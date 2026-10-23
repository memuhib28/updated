import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: "./",
  test: { include: ["tests/core.test.ts", "tests/db.test.ts"] },
} as any);
