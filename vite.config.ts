import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import { defineConfig } from "vite";
import environment from "vite-plugin-environment";
import forwardTrailingSlash from "./forward-trailing-slash";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

dotenv.config();

function conditionalHeaders() {
    return {
        name: "conditional-headers",
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                // Apply headers only for WebContainer-related routes (e.g., /z9)
                const webContainerRoutes = ["/z9"];
                const isWebContainerRoute = webContainerRoutes.some((route) =>
                    req.url.startsWith(route)
                );

                if (isWebContainerRoute) {
                    // Apply headers for StackBlitz WebContainer routes
                    res.setHeader(
                        "Cross-Origin-Embedder-Policy",
                        "require-corp"
                    );
                    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
                }
                next();
            });
        },
    };
}

export default defineConfig({
    root: "src",
    build: {
        outDir: "../dist",
        emptyOutDir: true,
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
            "/api/openai": {
                target: "https://darre-m9zcxamt-eastus2.services.ai.azure.com",
                changeOrigin: true,
                rewrite: (path) =>
                    path.replace(
                        /^\/api\/openai/,
                        "/models/chat/completions?api-version=2024-05-01-preview"
                    ),
                headers: {
                    Authorization: `Bearer 5z4ZNhmP1uWKwZRmQamd5txWgK7L3yvG86pVsyrP5fXjAehEH63OJQQJ99BDACHYHv6XJ3w3AAAAACOGxPz1`,
                    "Content-Type": "application/json",
                },
            },
            "/api": {
                target: "http://127.0.0.1:4943",
                changeOrigin: true,
            },
        },
    },
    plugins: [
        react(),
        environment("all", { prefix: "CANISTER_" }),
        environment("all", { prefix: "DFX_" }),
        tailwindcss(),
        forwardTrailingSlash(),
        conditionalHeaders(),
    ],
    cacheDir: "../node_modules/.vite",
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
