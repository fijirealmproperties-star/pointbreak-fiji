const jwt = require('jsonwebtoken');

const isProd = process.env.NODE_ENV === 'production';

// Prefer env vars. If not set, generate strong random secrets so the server
// can always boot, but warn loudly — auto-generated secrets are not stable
// across restarts (existing sessions will be invalidated) and are not
// suitable for a real production deployment.
const randomSecret = () =>
  require('crypto').randomBytes(48).toString('base64');

const JWT_SECRET = process.env.JWT_SECRET || randomSecret();
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || randomSecret();

if (isProd && (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET)) {
  console.warn(
    '[jwt] WARNING: JWT_SECRET / JWT_REFRESH_SECRET are not set. ' +
    'Using auto-generated secrets. Sessions will reset on restart and ' +
    'tokens are not forgeable-but-stable. Set both env vars in production.'
  );
}

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '30d';

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign({ userId, role }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  return { accessToken, refreshToken };
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

module.exports = { generateTokens, verifyAccessToken, verifyRefreshToken, JWT_SECRET, JWT_REFRESH_SECRET };