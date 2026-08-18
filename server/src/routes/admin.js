const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { logEvent } = require('../middleware/audit');

const router = express.Router();

module.exports = (db) => {
  // Dashboard stats
  router.get('/stats', authMiddleware, roleMiddleware('admin'), (req, res) => {
    const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const totalDrivers = db.prepare('SELECT COUNT(*) as c FROM providers').get().c;
    const activeRides = db.prepare("SELECT COUNT(*) as c FROM rides WHERE status IN ('searching','matched','accepted','in_progress')").get().c;
    const completedToday = db.prepare("SELECT COUNT(*) as c FROM rides WHERE status='completed' AND date(completed_at)=date('now')").get().c;
    const revenue = db.prepare("SELECT COALESCE(SUM(price_fjd),0) as total FROM rides WHERE status='completed' AND date(completed_at)=date('now')").get().total;
    const applications = db.prepare('SELECT COUNT(*) as c FROM driver_applications').get().c;
    const posts = db.prepare('SELECT COUNT(*) as c FROM posts').get().c;
    const reviews = db.prepare('SELECT COUNT(*) as c FROM destination_reviews').get().c;
    const notifications = db.prepare('SELECT COUNT(*) as c FROM notifications').get().c;

    res.json({ users: totalUsers, drivers: totalDrivers, totalUsers, totalDrivers, activeRides, completedToday, revenue: +revenue.toFixed(2), applications, posts, reviews, notifications });
  });

  // All rides
  router.get('/rides', authMiddleware, roleMiddleware('admin'), (req, res) => {
    const { status, limit = 50 } = req.query;
    let q = 'SELECT * FROM rides WHERE 1=1';
    const params = [];
    if (status) { q += ' AND status=?'; params.push(status); }
    q += ' ORDER BY created_at DESC LIMIT ?';
    params.push(+limit);
    const rides = db.prepare(q).all(...params);
    rides.forEach(r => {
      if (r.provider_id) r.provider = db.prepare('SELECT * FROM providers WHERE id=?').get(r.provider_id);
      r.rider = db.prepare('SELECT * FROM users WHERE id=?').get(r.rider_id);
    });
    res.json(rides);
  });

  // All drivers
  router.get('/drivers', authMiddleware, roleMiddleware('admin'), (req, res) => {
    const drivers = db.prepare('SELECT * FROM providers ORDER BY created_at DESC').all();
    res.json(drivers);
  });

  // All users
  router.get('/users', authMiddleware, roleMiddleware('admin'), (req, res) => {
    const { role, limit = 100 } = req.query;
    let q = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    if (role) { q += ' AND role=?'; params.push(role); }
    q += ' ORDER BY created_at DESC LIMIT ?';
    params.push(+limit);
    const users = db.prepare(q).all(...params);
    res.json(users);
  });

  // Update user
  router.put('/users/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
    const { name, email, role } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (name !== undefined) db.prepare('UPDATE users SET name=? WHERE id=?').run(name, req.params.id);
    if (email !== undefined) db.prepare('UPDATE users SET email=? WHERE id=?').run(email, req.params.id);
    if (role !== undefined) db.prepare('UPDATE users SET role=? WHERE id=?').run(role, req.params.id);
    logEvent({ type: 'admin_user_update', userId: req.user?.userId, targetId: req.params.id, data: req.body });
    res.json({ success: true });
  });

  // Delete user
  router.delete('/users/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
    logEvent({ type: 'admin_user_delete', userId: req.user?.userId, targetId: req.params.id });
    res.json({ success: true });
  });

  // Update driver
  router.put('/drivers/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
    const { name, vehicle_name, vehicle_plate, capacity, mode, vehicle_type, license_no, available, lat, lng } = req.body;
    const driver = db.prepare('SELECT * FROM providers WHERE id=?').get(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    if (name !== undefined) db.prepare('UPDATE providers SET name=? WHERE id=?').run(name, req.params.id);
    if (vehicle_name !== undefined) db.prepare('UPDATE providers SET vehicle_name=? WHERE id=?').run(vehicle_name, req.params.id);
    if (vehicle_plate !== undefined) db.prepare('UPDATE providers SET vehicle_plate=? WHERE id=?').run(vehicle_plate, req.params.id);
    if (capacity !== undefined) db.prepare('UPDATE providers SET capacity=? WHERE id=?').run(capacity, req.params.id);
    if (mode !== undefined) db.prepare('UPDATE providers SET mode=? WHERE id=?').run(mode, req.params.id);
    if (vehicle_type !== undefined) db.prepare('UPDATE providers SET vehicle_type=? WHERE id=?').run(vehicle_type, req.params.id);
    if (license_no !== undefined) db.prepare('UPDATE providers SET license_no=? WHERE id=?').run(license_no, req.params.id);
    if (available !== undefined) db.prepare('UPDATE providers SET available=? WHERE id=?').run(available ? 1 : 0, req.params.id);
    if (lat !== undefined && lng !== undefined) db.prepare('UPDATE providers SET lat=?, lng=? WHERE id=?').run(lat, lng, req.params.id);
    logEvent({ type: 'admin_driver_update', userId: req.user?.userId, targetId: req.params.id, data: req.body });
    res.json({ success: true });
  });

  // Delete driver
  router.delete('/drivers/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
    const driver = db.prepare('SELECT * FROM providers WHERE id=?').get(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    db.prepare('DELETE FROM providers WHERE id=?').run(req.params.id);
    logEvent({ type: 'admin_driver_delete', userId: req.user?.userId, targetId: req.params.id });
    res.json({ success: true });
  });

  // Pricing config
  router.get('/pricing', (req, res) => {
    const vehicles = {
      land: {
        bula: { base: 3.00, perKm: 1.20, perMin: 0.30, min: 5.00, cap: 4 },
        taxi: { base: 5.00, perKm: 2.00, perMin: 0.50, min: 8.00, cap: 4 },
        suv: { base: 10.00, perKm: 3.50, perMin: 0.80, min: 15.00, cap: 7 },
        bula_bus: { base: 2.00, perKm: 0.80, perMin: 0.20, min: 3.00, cap: 14 },
      },
      sea: {
        water_taxi: { base: 15.00, perKm: 4.50, perMin: 1.20, min: 25.00, cap: 8 },
        ferry: { base: 89.00, perKm: 2.50, perMin: 0.80, min: 89.00, cap: 50, features: ['life-jacket', 'cafe', 'restroom', 'deck', 'wifi', 'bar'] },
        charter: { base: 50.00, perKm: 8.00, perMin: 2.00, min: 80.00, cap: 12 },
        catamaran: { base: 35.00, perKm: 6.00, perMin: 1.50, min: 60.00, cap: 20 },
      },
    };
    const zoneMultipliers = { nadi: 1.2, suva: 1.1, lautoka: 1.0, 'coral-coast': 1.0, mamanuca: 1.5, yasawa: 1.5, 'vanua-levu': 1.0, taveuni: 1.0, kadavu: 1.3, beqa: 1.3, denarau: 1.2, ovalau: 1.0 };
    const surgeRules = { night: 1.5, rushHour: 1.3, normal: 1.0 };
    res.json({ vehicles, zoneMultipliers, surgeRules });
  });

  // Update pricing
  router.put('/pricing', authMiddleware, roleMiddleware('admin'), (req, res) => {
    const { vehicles, zoneMultipliers, surgeRules } = req.body;
    logEvent({ type: 'pricing_update', userId: req.user?.userId, data: req.body });
    res.json({ success: true, message: 'Pricing updated' });
  });

  // Revenue analytics
  router.get('/revenue', authMiddleware, roleMiddleware('admin'), (req, res) => {
    const allCompleted = db.prepare("SELECT * FROM rides WHERE status='completed' ORDER BY completed_at DESC").all();
    const today = new Date().toISOString().split('T')[0];
    const todayRides = allCompleted.filter(r => r.completed_at?.startsWith(today));
    const totalRevenue = allCompleted.reduce((s, r) => s + (r.price_fjd || 0), 0);
    const todayRevenue = todayRides.reduce((s, r) => s + (r.price_fjd || 0), 0);
    const avgFare = allCompleted.length ? totalRevenue / allCompleted.length : 0;

    const byDate = {};
    allCompleted.forEach(r => {
      const d = r.completed_at?.split('T')[0] || 'unknown';
      if (!byDate[d]) byDate[d] = { rides: 0, revenue: 0 };
      byDate[d].rides++;
      byDate[d].revenue += r.price_fjd || 0;
    });

    res.json({
      totalRevenue: +totalRevenue.toFixed(2),
      todayRevenue: +todayRevenue.toFixed(2),
      avgFare: +avgFare.toFixed(2),
      totalCompleted: allCompleted.length,
      dailyBreakdown: Object.entries(byDate).sort((a,b) => b[0].localeCompare(a[0])).map(([date, data]) => ({
        date, rides: data.rides, revenue: +data.revenue.toFixed(2), avgFare: +(data.revenue / data.rides).toFixed(2)
      }))
    });
  });

  return router;
};
