export type Role = "rider" | "driver" | "admin";

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zone: string;
  modes: ("land" | "sea")[];
  icon: string;
}

export type RideMode = "land" | "sea";

export interface Vehicle {
  name: string;
  emoji: string;
  desc: string;
  cap: number;
  base: number;
  perKm: number;
  perMin: number;
  min: number;
  type: string;
  mode: RideMode;
  price: number;
  distance_km: number;
  duration_min: number;
}

export interface VehicleCatalog {
  land: Record<string, Omit<Vehicle, "type" | "mode" | "price" | "distance_km" | "duration_min">>;
  sea: Record<string, Omit<Vehicle, "type" | "mode" | "price" | "distance_km" | "duration_min">>;
}

export interface EstimateResponse {
  estimates: Record<string, Vehicle>;
  surge: number;
  zone: string;
  distance_km: number;
  duration_min: number;
}

export interface Provider {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  mode: RideMode;
  vehicle_type: string;
  vehicle_name: string;
  vehicle_plate?: string;
  capacity: number;
  rating: number;
  total_rides: number;
  lat: number;
  lng: number;
  available: number;
  license_no?: string;
  distance_km?: number;
}

export type RideStatus =
  | "searching"
  | "matched"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Ride {
  id: string;
  rider_id: string;
  provider_id?: string | null;
  mode: RideMode;
  status: RideStatus;
  pickup_lat: number;
  pickup_lng: number;
  pickup_name?: string;
  dropoff_lat: number;
  dropoff_lng: number;
  dropoff_name?: string;
  vehicle_type: string;
  price_fjd?: number;
  distance_km?: number;
  duration_min?: number;
  surge: number;
  passengers: number;
  rating?: number;
  review?: string;
  payment_method?: string;
  scheduled_time?: string | null;
  created_at: string;
  accepted_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  provider?: Provider | null;
  rider?: { id: string; name: string; phone: string } | null;
}

export interface ProviderStats {
  total_rides: number;
  rating: number;
  today_earnings: number;
}

export interface EarningsResponse {
  provider: { name: string; vehicle_name: string; rating: number };
  summary: {
    total: { rides: number; earnings: number };
    today: { rides: number; earnings: number };
    week: { rides: number; earnings: number };
    month: { rides: number; earnings: number };
  };
  recentRides: Array<{
    id: string;
    pickup_name: string;
    dropoff_name: string;
    price_fjd: number;
    distance_km: number;
    completed_at: string;
    rating?: number;
  }>;
  dailyBreakdown: Array<{ date: string; rides: number; earnings: number }>;
}

export interface Wallet {
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: string;
  amount: number;
  description?: string;
  ride_id?: string;
  balance_after?: number;
  created_at: string;
}

export interface ChatRequest {
  message: string;
  lat?: number;
  lng?: number;
}

export interface ChatResponse {
  response: string;
  hotspotType?: string | null;
}
