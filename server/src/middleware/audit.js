const crypto = require('crypto');

const auditLog = [];

const logEvent = (event) => {
  const entry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...event,
  };
  auditLog.push(entry);
  // In production: write to database
  if (auditLog.length > 10000) auditLog.shift();
  return entry;
};

const auditMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logEvent({
      type: 'api_request',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: Date.now() - start,
      userId: req.user?.userId || null,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });
  next();
};

module.exports = { logEvent, auditMiddleware, auditLog };
