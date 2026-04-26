import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { Connect } from "vite";
import {
  existsSync,
  createReadStream,
  readdirSync,
  mkdirSync,
  copyFileSync,
} from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/model-api": {
        target: "https://bu-dining.onrender.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/model-api/, ""),
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    {
      name: "manager-dev-redirect",
      configureServer(server) {
        server.middlewares.use((req: Connect.IncomingMessage, _res, next) => {
          if (req.url === "/manager" || req.url === "/manager/") {
            req.url = "/manager.html";
          }
          next();
        });
      },
    },
    {
      // Serve model/*.csv as /data/* in dev; copy them to dist/data/ on build.
      // This avoids committing a duplicate 20 MB swipes CSV under public/data/.
      name: "serve-model-data",
      configureServer(server) {
        server.middlewares.use(
          (req: Connect.IncomingMessage, res: any, next: () => void) => {
            if (req.url?.startsWith("/data/")) {
              const fileName = req.url.slice(6);
              const filePath = path.resolve(__dirname, "model", fileName);
              if (fileName.endsWith(".csv") && existsSync(filePath)) {
                res.setHeader("Content-Type", "text/csv; charset=utf-8");
                createReadStream(filePath).pipe(res);
                return;
              }
            }
            next();
          }
        );
      },
      writeBundle() {
        const srcDir = path.resolve(__dirname, "model");
        const destDir = path.resolve(__dirname, "dist", "data");
        mkdirSync(destDir, { recursive: true });
        readdirSync(srcDir)
          .filter((f) => f.endsWith(".csv"))
          .forEach((f) =>
            copyFileSync(path.join(srcDir, f), path.join(destDir, f))
          );
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        manager: path.resolve(__dirname, "manager.html"),
      },
    },
  },
}));
