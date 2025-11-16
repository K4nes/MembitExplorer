// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
    server: {
        watch: {
            usePolling: true, // Enable polling for file changes
        },
        // Proxy configuration to handle CORS issues
        proxy: {
            "/api": {
                target: "https://api.membit.ai",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, "/v1"),
                secure: true,
            },
        },
    },
});
