import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  // TanStack Start builds a Nitro server bundle. On Netlify, Nitro detects the
  // NETLIFY env var and emits the Netlify preset automatically, so there is
  // nothing host specific to configure here.
  plugins: [tanstackStart(), react(), tailwindcss()],
});
