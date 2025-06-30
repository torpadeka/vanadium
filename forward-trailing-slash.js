export default () => ({
    name: "forward-to-trailing-slash",
    configureServer: (server) => {
        server.middlewares.use((req, res, next) => {
            if (!req.url) {
                return next();
            }

            const requestURL = new URL(req.url, `http://${req.headers.host}`);
            // Skip URLs that start with /api to avoid modifying API requests
            if (requestURL.pathname.startsWith("/api")) {
                return next();
            }

            // Apply trailing slash only to non-API routes
            if (/^\/(?:[^@]+\/)*[^@./]+$/g.test(requestURL.pathname)) {
                requestURL.pathname += "/";
                res.writeHead(301, { Location: requestURL.toString() });
                return res.end();
            }

            return next();
        });
    },
});
