const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { walletPaySchema } = require('../middleware/validate');
const { validate } = require('../middleware/validate');
const { paymentLimiter } = require('../middleware/rateLimiter');
const { logEvent } = require('../middleware/audit');

const router = express.Router();

module.exports = (db) => {
  // Ensure wallet tables exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      balance REAL DEFAULT 0,
      currency TEXT DEFAULT 'FJD',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      wallet_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      ride_id TEXT,
      balance_after REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Get wallet balance
  router.get('/', (req, res) => {
    const userId = req.user?.userId;
    let wallet = db.prepare('SELECT * FROM wallets WHERE user_id=?').get(userId);
    if (!wallet) {
      const id = uuidv4();
      db.prepare('INSERT INTO wallets (id, user_id, balance) VALUES (?,?,?)').run(id, userId, 0);
      wallet = db.prepare('SELECT * FROM wallets WHERE user_id=?').get(userId);
    }
    res.json({ balance: wallet.balance, currency: wallet.currency });
  });

  // Top up (mock mPaisa)
  router.post('/topup', paymentLimiter, (req, res) => {
    const userId = req.user?.userId;
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    let wallet = db.prepare('SELECT * FROM wallets WHERE user_id=?').get(userId);
    if (!wallet) {
      const id = uuidv4();
      db.prepare('INSERT INTO wallets (id, user_id, balance) VALUES (?,?,?)').run(id, userId, 0);
      wallet = db.prepare('SELECT * FROM wallets WHERE user_id=?').get(userId);
    }

    const newBalance = wallet.balance + amount;
    db.prepare('UPDATE wallets SET balance=? WHERE id=?').run(newBalance, wallet.id);

    const txId = uuidv4();
    db.prepare('INSERT INTO transactions (id, wallet_id, user_id, type, amount, description, balance_after) VALUES (?,?,?,?,?,?,?)')
      .run(txId, wallet.id, userId, 'top_up', amount, `mPaisa top-up FJ$${amount.toFixed(2)}`, newBalance);

    logEvent({ type: 'wallet_topup', userId, amount });
    res.json({ success: true, balance: newBalance, transactionId: txId });
  });

  // Pay for ride
  router.post('/pay', paymentLimiter, validate(walletPaySchema), (req, res) => {
    const userId = req.user?.userId;
    const { rideId, amount } = req.validated;

    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id=?').get(userId);
    if (!wallet || wallet.balance < amount) {
      return res.status(402).json({ error: 'Insufficient balance' });
    }

    const newBalance = wallet.balance - amount;
    db.prepare('UPDATE wallets SET balance=? WHERE id=?').run(newBalance, wallet.id);

    const txId = uuidv4();
    db.prepare('INSERT INTO transactions (id, wallet_id, user_id, type, amount, description, ride_id, balance_after) VALUES (?,?,?,?,?,?,?,?)')
      .run(txId, wallet.id, userId, 'ride_payment', -amount, `Ride payment`, rideId, newBalance);

    db.prepare('UPDATE rides SET payment_method=? WHERE id=?').run('mpaisa', rideId);
    logEvent({ type: 'wallet_payment', userId, amount, rideId });
    res.json({ success: true, balance: newBalance, transactionId: txId });
  });

  // Transaction history
  router.get('/transactions', (req, res) => {
    const userId = req.user?.userId;
    const { limit = 20, offset = 0 } = req.query;
    const txs = db.prepare('SELECT * FROM transactions WHERE user_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(userId, +limit, +offset);
    res.json(txs);
  });

  return router;
};
