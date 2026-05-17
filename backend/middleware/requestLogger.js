/**
 * requestLogger.js
 * Simple middleware to log all incoming API requests.
 */
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
};

module.exports = requestLogger;
