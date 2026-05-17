// backend/middleware/authMiddleware.js
// -----------------------------------------------------------
// Simple API key middleware.
// The main backend service must include the shared secret in
// the X-API-Key header for every request to this blockchain module.
// -----------------------------------------------------------

const API_SECRET = process.env.API_SECRET_KEY;

function requireApiKey(req, res, next) {
    const providedKey = req.headers["x-api-key"];

    if (!API_SECRET) {
        // If no secret configured, warn and allow in development only
        if (process.env.NODE_ENV === "development") {
            console.warn("⚠️  API_SECRET_KEY not set — skipping auth (dev mode only)");
            return next();
        }
        return res.status(500).json({ error: "Server misconfiguration: API secret not set." });
    }

    if (!providedKey || providedKey !== API_SECRET) {
        return res.status(401).json({
            error: "Unauthorized",
            message: "Valid X-API-Key header required.",
        });
    }

    next();
}

module.exports = { requireApiKey };
