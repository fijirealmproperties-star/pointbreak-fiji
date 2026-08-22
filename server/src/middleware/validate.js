const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  req.validated = result.data;
  next();
};

const signupSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(7).max(15),
  email: z.string().email().optional(),
  role: z.enum(['rider', 'driver', 'provider']).optional(),
  home_zone: z.string().optional(),
  home_location_id: z.string().optional(),
  home_address: z.string().optional(),
  work_address: z.string().optional(),
  fav_location_id: z.string().optional(),
});

const loginSchema = z.object({
  phone: z.string().min(7),
  password: z.string().min(4).optional(),
});

const rideSchema = z.object({
  rider_id: z.string().uuid(),
  mode: z.enum(['land', 'sea']),
  pickup_lat: z.number().min(-90).max(90),
  pickup_lng: z.number().min(-180).max(180),
  dropoff_lat: z.number().min(-90).max(90),
  dropoff_lng: z.number().min(-180).max(180),
  vehicle_type: z.string(),
  passengers: z.number().min(1).max(20).optional(),
  pickup_name: z.string().optional(),
  dropoff_name: z.string().optional(),
  scheduled_time: z.string().optional(),
});

const walletPaySchema = z.object({
  rideId: z.string().uuid(),
  amount: z.number().positive(),
});

const aiChatSchema = z.object({
  message: z.string().min(1).max(500),
  conversationId: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

module.exports = { validate, signupSchema, loginSchema, rideSchema, walletPaySchema, aiChatSchema };
