import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  base: "./",
  build: {
    outDir: join(__dirname, "dist"),
    emptyOutDir: true,
  },
  plugins: [react()],
  server: {
    port: 5173,
  },
});
