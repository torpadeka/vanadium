import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import { defineConfig } from "vite";
import environment from "vite-plugin-environment";
import forwardTrailingSlash from "./forward-trailing-slash";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

dotenv.config();

export default defineConfig({
    root: "src",
    build: {
        outDir: "../dist",
        emptyOutDir: true,
        sourcemap: true,
    },
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: "globalThis",
            },
        },
    },
    server: {
        proxy: {
            "/api": {
                target: "http://127.0.0.1:4943",
                changeOrigin: true,
            },
        },
        headers: {
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Opener-Policy": "same-origin",
        },
    },
    plugins: [
        react(),
        environment("all", { prefix: "CANISTER_" }),
        environment("all", { prefix: "DFX_" }),
        tailwindcss(),
        forwardTrailingSlash(),
    ],
    cacheDir: "../node_modules/.vite",
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});