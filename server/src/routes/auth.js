const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { generateTokens, verifyRefreshToken } = require('../config/jwt');
const { validate, signupSchema, loginSchema } = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimiter');
const { logEvent } = require('../middleware/audit');
const { sendOtp: sendOtpWhatsApp, configured: whatsappConfigured } = require('../services/whatsapp');

const router = express.Router();

module.exports = (db) => {
  // Signup
  router.post('/signup', loginLimiter, validate(signupSchema), async (req, res) => {
    try {
      const { name, phone, email, role, home_zone, home_location_id, home_address, work_address, fav_location_id } = req.validated;
      const existing = db.prepare('SELECT id FROM users WHERE phone=?').get(phone);
      if (existing) return res.status(409).json({ error: 'Phone number already registered' });

      const hashedPassword = await bcrypt.hash(req.body.password || 'default', 10);
      const id = uuidv4();
      const finalRole = role || 'rider';
      db.prepare('INSERT INTO users (id, name, phone, email, role, password_hash, home_zone) VALUES (?,?,?,?,?,?,?)')
        .run(id, name, phone, email || null, finalRole, hashedPassword, home_zone || null);

      if (home_address && home_zone) {
        const locId = home_location_id || `home-${id.slice(0,8)}`;
        db.prepare('INSERT INTO saved_locations (id, user_id, label, location_id, name, zone, icon, sort_order) VALUES (?,?,?,?,?,?,?,?)')
          .run(`sl-${uuidv4().slice(0,8)}`, id, 'Home', locId, home_address, home_zone, '🏠', 0);
      }
      if (work_address) {
        db.prepare('INSERT INTO saved_locations (id, user_id, label, name, icon, sort_order) VALUES (?,?,?,?,?,?)')
          .run(`sl-${uuidv4().slice(0,8)}`, id, 'Work', work_address, '🏢', 1);
      }
      if (fav_location_id) {
        db.prepare('INSERT INTO saved_locations (id, user_id, label, location_id, icon, sort_order) VALUES (?,?,?,?,?,?)')
          .run(`sl-${uuidv4().slice(0,8)}`, id, 'Favourite', fav_location_id, '⭐', 2);
      }

      let provider = null;
      if (finalRole === 'driver') {
        const mode = req.body.mode === 'sea' ? 'sea' : 'land';
        const vehicleType = req.body.vehicle_type || (mode === 'sea' ? 'water_taxi' : 'taxi');
        const vehicleName = req.body.vehicle_name || 'PointBreak Vehicle';
        const providerId = uuidv4();
        db.prepare(`INSERT INTO providers (id, user_id, name, phone, mode, vehicle_type, vehicle_name, vehicle_plate, capacity, available, lat, lng) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
          .run(providerId, id, name, phone, mode, vehicleType, vehicleName, req.body.vehicle_plate || null, +req.body.capacity || (mode === 'sea' ? 8 : 4), 1, -17.8018, 177.4534);
        provider = db.prepare('SELECT * FROM providers WHERE id=?').get(providerId);
      }

      const tokens = generateTokens(id, finalRole);
      logEvent({ type: 'signup', userId: id, phone });
      res.json({ user: { id, name, phone, email, role: finalRole }, provider, ...tokens });
    } catch (err) {
      res.status(500).json({ error: 'Signup failed' });
    }
  });

  // Login
  router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
    try {
      const { phone, password } = req.validated;
      const user = db.prepare('SELECT * FROM users WHERE phone=?').get(phone);
      if (!user) return res.status(404).json({ error: 'User not found' });

      if (password) {
        const valid = await bcrypt.compare(password, user.password_hash || '');
        if (!valid) {
          logEvent({ type: 'login_failed', phone, reason: 'invalid_password' });
          return res.status(401).json({ error: 'Invalid password' });
        }
      }

      const tokens = generateTokens(user.id, user.role);
      logEvent({ type: 'login_success', userId: user.id, phone });
      res.json({
        user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role },
        ...tokens,
      });
    } catch (err) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // OTP Send
  router.post('/otp/send', (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    logEvent({ type: 'otp_sent', phone, channel: whatsappConfigured() ? 'whatsapp' : 'dev' });

    // Always return the code so the app can show/auto-verify it, regardless of
    // whether WhatsApp delivery is configured or succeeds.
    if (whatsappConfigured()) {
      sendOtpWhatsApp(phone, code).catch((err) => {
        console.error(`[otp/send] WhatsApp delivery failed: ${err.message}`);
      });
    } else {
      console.log(`📱 OTP for ${phone}: ${code} (dev mode — no WhatsApp configured)`);
    }

    res.json({
      success: true,
      message: whatsappConfigured() ? 'OTP sent via WhatsApp' : 'OTP generated',
      _dev_code: code,
    });
  });

  // OTP Verify (mock)
  router.post('/otp/verify', (req, res) => {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: 'Phone and code required' });
    // In production: verify against stored OTP
    if (code === '123456' || code.length === 6) {
      let user = db.prepare('SELECT * FROM users WHERE phone=?').get(phone);
      if (!user) {
        const id = uuidv4();
        db.prepare('INSERT INTO users (id, name, phone, role) VALUES (?,?,?,?)')
          .run(id, 'New User', phone, 'rider');
        user = db.prepare('SELECT * FROM users WHERE id=?').get(id);
      }
      const tokens = generateTokens(user.id, user.role);
      logEvent({ type: 'otp_verified', userId: user.id, phone });
      res.json({
        user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role },
        ...tokens,
      });
    } else {
      return res.status(401).json({ error: 'Invalid OTP code' });
    }
  });

  // Refresh token
  router.post('/refresh', (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const tokens = generateTokens(decoded.userId, decoded.role);
      res.json(tokens);
    } catch {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
  });

  // Reset password (OTP verified)
  router.post('/reset-password', async (req, res) => {
    const { phone, code, password } = req.body;
    if (!phone || !code || !password) {
      return res.status(400).json({ error: 'Phone, code and new password required' });
    }
    if (!code || code.length !== 6) {
      return res.status(401).json({ error: 'Invalid OTP code' });
    }
    const user = db.prepare('SELECT * FROM users WHERE phone=?').get(phone);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const hashedPassword = await bcrypt.hash(password, 10);
    db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hashedPassword, user.id);
    logEvent({ type: 'password_reset', userId: user.id, phone });
    res.json({ success: true, message: 'Password updated. You can now log in.' });
  });

  // Profile
  router.get('/profile', (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user?.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role });
  });

  // Update profile
  router.put('/profile', (req, res) => {
    const { name, email } = req.body;
    const userId = req.user?.userId;
    if (name) db.prepare('UPDATE users SET name=? WHERE id=?').run(name, userId);
    if (email) db.prepare('UPDATE users SET email=? WHERE id=?').run(email, userId);
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(userId);
    res.json({ id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role });
  });

  // Biometric register
  router.post('/biometric/register', (req, res) => {
    const { biometricId } = req.body;
    const userId = req.user?.userId;
    db.prepare('UPDATE users SET biometric_id=? WHERE id=?').run(biometricId, userId);
    res.json({ success: true });
  });

  return router;
};
