/**
 * errorHandler.js
 * Global error handling middleware.
 * Must be registered LAST in Express app.use() chain.
 */
const errorHandler = (err, req, res, next) => {
  console.error("[ErrorHandler]", err.message);
  res.status(500).json({
    error:   err.message || "Internal server error",
    status:  "failed",
  });
};

module.exports = errorHandler;
