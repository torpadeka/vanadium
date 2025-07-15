import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import { defineConfig } from "vite";
import environment from "vite-plugin-environment";
import forwardTrailingSlash from "./forward-trailing-slash";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

dotenv.config();

// Custom middleware to conditionally apply headers
function conditionalHeaders() {
    return {
        name: "conditional-headers",
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                // Apply headers only for WebContainer-related routes (e.g., /z9 or /z9/preview)
                const webContainerRoutes = ["/z9"]; // Adjust based on your routing
                const isWebContainerRoute = webContainerRoutes.some((route) =>
                    req.url.startsWith(route)
                );

                if (isWebContainerRoute) {
                    // Apply headers for WebContainer routes
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
            "/api": {
                target: "http://127.0.0.1:4943",
                changeOrigin: true,
            },
        },
        // Remove headers from here
    },
    plugins: [
        react(),
        environment("all", { prefix: "CANISTER_" }),
        environment("all", { prefix: "DFX_" }),
        tailwindcss(),
        forwardTrailingSlash(),
        conditionalHeaders(), // Add custom middleware
    ],
    cacheDir: "../node_modules/.vite",
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
