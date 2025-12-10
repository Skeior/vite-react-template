import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
  server: {
    proxy: {
      "/rental": "http://127.0.0.1:8787",
      "/trip": "http://127.0.0.1:8787",
      "/admin": "http://127.0.0.1:8787",
    },
  },
});
