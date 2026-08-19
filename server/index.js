const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const { apiLimiter } = require('./src/middleware/rateLimiter');
const { authMiddleware } = require('./src/middleware/auth');
const { auditMiddleware } = require('./src/middleware/audit');

const PORT = process.env.PORT || 3001;

// ── Pacific Locations ────────────────────────────────────────
const LOCATIONS = [
  // ── NADI TOWN & SURROUNDINGS ───────────────────────────
  { id: 'nadi-airport', name: 'Nadi International Airport', lat: -17.7553, lng: 177.4432, zone: 'nadi', modes: ['land','sea'], icon: '✈️' },
  { id: 'nadi-town', name: 'Nadi Town Centre', lat: -17.8018, lng: 177.4534, zone: 'nadi', modes: ['land'], icon: '🏙️' },
  { id: 'nadi-market', name: 'Nadi Municipal Market', lat: -17.8025, lng: 177.4528, zone: 'nadi', modes: ['land'], icon: '🏪' },
  { id: 'nadi-hospital', name: 'Nadi Hospital', lat: -17.7980, lng: 177.4490, zone: 'nadi', modes: ['land'], icon: '🏥' },
  { id: 'tappoo-city-nadi', name: 'Tappoo City Nadi', lat: -17.7993, lng: 177.4503, zone: 'nadi', modes: ['land'], icon: '🛍️' },
  { id: 'jacks-nadi', name: "Jack's of Fiji Nadi", lat: -17.8000, lng: 177.4520, zone: 'nadi', modes: ['land'], icon: '🛍️' },
  { id: 'prouds-nadi', name: 'Prouds Duty Free Nadi', lat: -17.7990, lng: 177.4510, zone: 'nadi', modes: ['land'], icon: '💎' },
  { id: 'mcdonalds-nadi', name: "McDonald's Nadi", lat: -17.8005, lng: 177.4515, zone: 'nadi', modes: ['land'], icon: '🍔' },
  { id: 'burger-king-nadi', name: 'Burger King Nadi', lat: -17.8002, lng: 177.4510, zone: 'nadi', modes: ['land'], icon: '🍔' },
  { id: 'bsp-nadi', name: 'BSP Bank Nadi', lat: -17.8010, lng: 177.4530, zone: 'nadi', modes: ['land'], icon: '🏦' },
  { id: 'anz-nadi', name: 'ANZ Bank Nadi', lat: -17.8015, lng: 177.4535, zone: 'nadi', modes: ['land'], icon: '🏦' },
  { id: 'westpac-nadi', name: 'Westpac Bank Nadi', lat: -17.8012, lng: 177.4525, zone: 'nadi', modes: ['land'], icon: '🏦' },
  { id: 'baroda-nadi', name: 'Bank of Baroda Nadi', lat: -17.8005, lng: 177.4520, zone: 'nadi', modes: ['land'], icon: '🏦' },
  { id: 'novotel-nadi', name: 'Novotel Nadi', lat: -17.7663, lng: 177.4620, zone: 'nadi', modes: ['land'], icon: '🏨' },
  { id: 'tanoa-intl', name: 'Tanoa International Hotel', lat: -17.7617, lng: 177.4652, zone: 'nadi', modes: ['land'], icon: '🏨' },
  { id: 'raffles-gateway', name: 'Raffles Gateway Hotel', lat: -17.7530, lng: 177.4460, zone: 'nadi', modes: ['land'], icon: '🏨' },
  { id: 'fiji-gateway', name: 'Fiji Gateway Hotel', lat: -17.7527, lng: 177.4552, zone: 'nadi', modes: ['land'], icon: '🏨' },
  { id: 'crowne-nadi', name: 'Crowne Plaza Fiji Nadi Bay', lat: -17.7656, lng: 177.4301, zone: 'nadi', modes: ['land'], icon: '🏨' },
  { id: 'club-fiji', name: 'Club Fiji Resort', lat: -17.7732, lng: 177.4124, zone: 'nadi', modes: ['land','sea'], icon: '🏖️' },
  { id: 'wyndham-wailoaloa', name: 'Wyndham Garden Wailoaloa Beach', lat: -17.7650, lng: 177.4266, zone: 'nadi', modes: ['land'], icon: '🏨' },
  { id: 'ramada-wailoaloa', name: 'Ramada Suites Wailoaloa', lat: -17.7650, lng: 177.4279, zone: 'nadi', modes: ['land'], icon: '🏨' },
  { id: 'fiji-airlines-hq', name: 'Fiji Airways Head Office', lat: -17.7560, lng: 177.4445, zone: 'nadi', modes: ['land'], icon: '✈️' },
  { id: 'tokatoka', name: 'Tokatoka Resort Hotel', lat: -17.7518, lng: 177.4548, zone: 'nadi', modes: ['land'], icon: '🏨' },

  // ── DENARAU ISLAND ─────────────────────────────────────
  { id: 'denarau-marina', name: 'Denarau Marina', lat: -17.7768, lng: 177.6541, zone: 'denarau', modes: ['land','sea'], icon: '⛵' },
  { id: 'port-denarau', name: 'Port Denarau', lat: -17.7770, lng: 177.6550, zone: 'denarau', modes: ['land','sea'], icon: '🚢' },
  { id: 'hilton-denarau', name: 'Hilton Fiji Beach Resort & Spa', lat: -17.7750, lng: 177.6720, zone: 'denarau', modes: ['land'], icon: '🏨' },
  { id: 'sofitel-denarau', name: 'Sofitel Fiji Resort & Spa', lat: -17.7748, lng: 177.6697, zone: 'denarau', modes: ['land'], icon: '🏨' },
  { id: 'radisson-denarau', name: 'Radisson Blu Resort Fiji', lat: -17.7738, lng: 177.6709, zone: 'denarau', modes: ['land'], icon: '🏨' },
  { id: 'westin-denarau', name: 'The Westin Denarau Island Resort', lat: -17.7730, lng: 177.6685, zone: 'denarau', modes: ['land'], icon: '🏨' },
  { id: 'sheraton-denarau', name: 'Sheraton Fiji Golf & Beach Resort', lat: -17.7743, lng: 177.6710, zone: 'denarau', modes: ['land'], icon: '🏨' },
  { id: 'sheraton-villas', name: 'Sheraton Denarau Villas', lat: -17.7740, lng: 177.6690, zone: 'denarau', modes: ['land'], icon: '🏨' },
  { id: 'palms-denarau', name: 'The Palms Denarau', lat: -17.7735, lng: 177.6695, zone: 'denarau', modes: ['land'], icon: '🏨' },
  { id: 'denarau-golf', name: 'Denarau Golf & Racquet Club', lat: -17.7725, lng: 177.6725, zone: 'denarau', modes: ['land'], icon: '⛳' },
  { id: 'hard-rock-denarau', name: 'Hard Rock Cafe Denarau', lat: -17.7760, lng: 177.6545, zone: 'denarau', modes: ['land'], icon: '🎸' },
  { id: 'bonefish', name: 'Bonefish Seafood Restaurant', lat: -17.7765, lng: 177.6548, zone: 'denarau', modes: ['land'], icon: '🐟' },
  { id: 'cantina-denarau', name: 'Cantina Grill & Bar', lat: -17.7762, lng: 177.6552, zone: 'denarau', modes: ['land'], icon: '🌮' },
  { id: 'indigo-denarau', name: 'Indigo Indian Restaurant', lat: -17.7763, lng: 177.6543, zone: 'denarau', modes: ['land'], icon: '🍛' },
  { id: 'lazzy-beans-denarau', name: 'Lazy Beans Cafe Denarau', lat: -17.7766, lng: 177.6555, zone: 'denarau', modes: ['land'], icon: '☕' },

  // ── NAISOSO ─────────────────────────────────────────────
  { id: 'naisoso', name: 'Naisoso Island', lat: -17.7700, lng: 177.6400, zone: 'nadi', modes: ['land','sea'], icon: '🏝️' },

  // ── SONAISALI & MOMI BAY ───────────────────────────────
  { id: 'sonaisali', name: 'DoubleTree by Hilton Sonaisali', lat: -17.8309, lng: 177.3562, zone: 'nadi', modes: ['land'], icon: '🏨' },
  { id: 'fiji-marina-momi', name: 'Fiji Marriott Resort Momi Bay', lat: -17.9349, lng: 177.2610, zone: 'nadi', modes: ['land'], icon: '🏨' },
  { id: 'first-landing', name: 'First Landing Beach Resort', lat: -17.6794, lng: 177.3854, zone: 'nadi', modes: ['land'], icon: '🏖️' },
  { id: 'vuda-point', name: 'Vuda Point Marina', lat: -17.6820, lng: 177.3200, zone: 'nadi', modes: ['land','sea'], icon: '⚓' },
  { id: 'momi-battery', name: 'Momi Battery Historic Park', lat: -17.7380, lng: 177.3420, zone: 'nadi', modes: ['land'], icon: '🏛️' },
  { id: 'nadi-bay', name: 'Nadi Bay Beach', lat: -17.7690, lng: 177.4200, zone: 'nadi', modes: ['land','sea'], icon: '🏖️' },

  // ── SUVA CITY ──────────────────────────────────────────
  { id: 'suva-city', name: 'Suva City Centre', lat: -18.1495, lng: 178.4258, zone: 'suva', modes: ['land','sea'], icon: '🏛️' },
  { id: 'suva-harbour', name: 'Suva Harbour', lat: -18.1333, lng: 178.4167, zone: 'suva', modes: ['land','sea'], icon: '⚓' },
  { id: 'nausori-airport', name: 'Nausori Airport', lat: -18.0433, lng: 178.5592, zone: 'suva', modes: ['land'], icon: '✈️' },
  { id: 'grand-pacific', name: 'Grand Pacific Hotel', lat: -18.1469, lng: 178.4225, zone: 'suva', modes: ['land'], icon: '🏨' },
  { id: 'holiday-inn-suva', name: 'Holiday Inn Suva', lat: -18.1419, lng: 178.4227, zone: 'suva', modes: ['land'], icon: '🏨' },
  { id: 'tanoa-plaza-suva', name: 'Tanoa Plaza Hotel Suva', lat: -18.1327, lng: 178.4210, zone: 'suva', modes: ['land'], icon: '🏨' },
  { id: 'novotel-suva', name: 'Novotel Suva Lami Bay', lat: -18.1079, lng: 178.3963, zone: 'suva', modes: ['land'], icon: '🏨' },
  { id: 'five-princes', name: 'Five Princes Hotel', lat: -18.1261, lng: 178.4391, zone: 'suva', modes: ['land'], icon: '🏨' },
  { id: 'usp', name: 'University of the South Pacific', lat: -18.1490, lng: 178.4445, zone: 'suva', modes: ['land'], icon: '🎓' },
  { id: 'fnu', name: 'Fiji National University', lat: -18.1002, lng: 178.4794, zone: 'suva', modes: ['land'], icon: '🎓' },
  { id: 'suva-market', name: 'Suva Municipal Market', lat: -18.1361, lng: 178.4247, zone: 'suva', modes: ['land'], icon: '🏪' },
  { id: 'fiji-parliament', name: 'Fiji Parliament', lat: -18.1458, lng: 178.4244, zone: 'suva', modes: ['land'], icon: '🏛️' },
  { id: 'tappoo-suva', name: 'Tappoo City Suva', lat: -18.1415, lng: 178.4400, zone: 'suva', modes: ['land'], icon: '🛍️' },
  { id: 'jacks-suva', name: "Jack's of Fiji Suva", lat: -18.1418, lng: 178.4410, zone: 'suva', modes: ['land'], icon: '🛍️' },
  { id: 'courts-suva', name: 'Courts Suva', lat: -18.1420, lng: 178.4415, zone: 'suva', modes: ['land'], icon: '🏬' },
  { id: 'damodar-city', name: 'Damodar City Suva', lat: -18.1425, lng: 178.4410, zone: 'suva', modes: ['land'], icon: '🏬' },
  { id: 'mhcc-suva', name: 'MHCC Suva', lat: -18.1422, lng: 178.4408, zone: 'suva', modes: ['land'], icon: '🏬' },
  { id: 'newworld-suva', name: 'Newworld Suva', lat: -18.1420, lng: 178.4405, zone: 'suva', modes: ['land'], icon: '🛒' },
  { id: 'foodcity-suva', name: 'Foodcity Suva', lat: -18.1405, lng: 178.4395, zone: 'suva', modes: ['land'], icon: '🛒' },
  { id: 'fresh-choice-suva', name: 'Fresh Choice Suva', lat: -18.1395, lng: 178.4390, zone: 'suva', modes: ['land'], icon: '🛒' },
  { id: 'bsp-suva', name: 'BSP Bank Suva', lat: -18.1418, lng: 178.4405, zone: 'suva', modes: ['land'], icon: '🏦' },
  { id: 'anz-suva', name: 'ANZ Bank Suva', lat: -18.1415, lng: 178.4400, zone: 'suva', modes: ['land'], icon: '🏦' },
  { id: 'westpac-suva', name: 'Westpac Bank Suva', lat: -18.1416, lng: 178.4398, zone: 'suva', modes: ['land'], icon: '🏦' },
  { id: 'cwm-hospital', name: 'CWM Hospital Suva', lat: -18.1347, lng: 178.4336, zone: 'suva', modes: ['land'], icon: '🏥' },
  { id: 'suva-council', name: 'Suva City Council', lat: -18.1414, lng: 178.4231, zone: 'suva', modes: ['land'], icon: '🏛️' },
  { id: 'governmnet-bldg', name: 'Government Buildings Suva', lat: -18.1459, lng: 178.4244, zone: 'suva', modes: ['land'], icon: '🏛️' },
  { id: 'toberua', name: 'Toberua Island Resort', lat: -17.9750, lng: 178.7050, zone: 'suva', modes: ['sea'], icon: '🏝️' },
  { id: 'rainforest-eco', name: 'Rainforest Eco Lodge', lat: -18.0579, lng: 178.4573, zone: 'suva', modes: ['land'], icon: '🌿' },

  // ── LAUTOKA & BA ───────────────────────────────────────
  { id: 'lautoka-city', name: 'Lautoka City', lat: -17.6168, lng: 177.4515, zone: 'lautoka', modes: ['land','sea'], icon: '🏭' },
  { id: 'lautoka-sugar', name: 'Lautoka Sugar Mill', lat: -17.6150, lng: 177.4500, zone: 'lautoka', modes: ['land'], icon: '🏭' },
  { id: 'lautoka-market', name: 'Lautoka Municipal Market', lat: -17.6160, lng: 177.4512, zone: 'lautoka', modes: ['land'], icon: '🏪' },
  { id: 'tappoo-lautoka', name: 'Tappoo City Lautoka', lat: -17.6162, lng: 177.4510, zone: 'lautoka', modes: ['land'], icon: '🛍️' },
  { id: 'jacks-lautoka', name: "Jack's of Fiji Lautoka", lat: -17.6165, lng: 177.4512, zone: 'lautoka', modes: ['land'], icon: '🛍️' },
  { id: 'bsp-lautoka', name: 'BSP Bank Lautoka', lat: -17.6160, lng: 177.4508, zone: 'lautoka', modes: ['land'], icon: '🏦' },
  { id: 'lautoka-hospital', name: 'Lautoka Hospital', lat: -17.6155, lng: 177.4495, zone: 'lautoka', modes: ['land'], icon: '🏥' },
  { id: 'ba-town', name: 'Ba Town Centre', lat: -17.5340, lng: 177.6670, zone: 'lautoka', modes: ['land'], icon: '🏘️' },
  { id: 'tavua', name: 'Tavua Town', lat: -17.3920, lng: 178.0700, zone: 'lautoka', modes: ['land'], icon: '🏘️' },
  { id: 'rakiraki', name: 'Rakiraki Town', lat: -17.3540, lng: 178.1760, zone: 'lautoka', modes: ['land'], icon: '🏘️' },
  { id: 'volivoli', name: 'Volivoli Beach Resort', lat: -17.3830, lng: 178.1330, zone: 'lautoka', modes: ['land','sea'], icon: '🏖️' },
  { id: 'wananavu', name: 'Wananavu Beach Resort', lat: -17.3500, lng: 178.1500, zone: 'lautoka', modes: ['land','sea'], icon: '🏖️' },

  // ── CORAL COAST ────────────────────────────────────────
  { id: 'sigatoka-town', name: 'Sigatoka Town', lat: -18.1434, lng: 177.5076, zone: 'coral', modes: ['land'], icon: '🌳' },
  { id: 'sigatoka-market', name: 'Sigatoka Market', lat: -18.1440, lng: 177.5080, zone: 'coral', modes: ['land'], icon: '🏪' },
  { id: 'sigatoka-river', name: 'Sigatoka River Safari', lat: -18.1500, lng: 177.5000, zone: 'coral', modes: ['land'], icon: '🛶' },
  { id: 'coral-coast-main', name: 'Coral Coast', lat: -18.2787, lng: 177.9310, zone: 'coral', modes: ['land','sea'], icon: '🐚' },
  { id: 'pacific-harbour', name: 'Pacific Harbour', lat: -18.2650, lng: 178.0553, zone: 'coral', modes: ['land','sea'], icon: '🎣' },
  { id: 'intercon-coral', name: 'InterContinental Fiji Golf Resort', lat: -18.1136, lng: 177.3333, zone: 'coral', modes: ['land'], icon: '🏨' },
  { id: 'outrigger', name: 'Outrigger Fiji Beach Resort', lat: -18.1788, lng: 177.5527, zone: 'coral', modes: ['land'], icon: '🏨' },
  { id: 'naviti-resort', name: 'The Naviti Resort', lat: -18.2012, lng: 177.6945, zone: 'coral', modes: ['land'], icon: '🏨' },
  { id: 'warwick-fiji', name: 'Warwick Fiji Resort & Spa', lat: -18.2200, lng: 177.7374, zone: 'coral', modes: ['land'], icon: '🏨' },
  { id: 'yatule', name: 'Yatule Resort & Spa', lat: -18.1043, lng: 177.3212, zone: 'coral', modes: ['land'], icon: '🏨' },
  { id: 'fiji-hideaway', name: 'Fiji Hideaway Resort & Spa', lat: -18.1966, lng: 177.6512, zone: 'coral', modes: ['land'], icon: '🏨' },
  { id: 'tambua-sands', name: 'Tambua Sands Beach Resort', lat: -18.1917, lng: 177.6283, zone: 'coral', modes: ['land'], icon: '🏖️' },
  { id: 'natadola', name: 'Natadola Beach Resort', lat: -18.1065, lng: 177.3216, zone: 'coral', modes: ['land','sea'], icon: '🏖️' },
  { id: 'nanuku', name: 'Nanuku Resort Fiji', lat: -18.2550, lng: 178.0500, zone: 'coral', modes: ['land'], icon: '🏨' },
  { id: 'pearl-resort', name: 'The Pearl Resort & Spa Fiji', lat: -18.2600, lng: 178.0450, zone: 'coral', modes: ['land'], icon: '🏨' },
  { id: 'uprising', name: 'Uprising Beach Resort', lat: -18.2580, lng: 178.0480, zone: 'coral', modes: ['land','sea'], icon: '🏖️' },
  { id: 'baravi', name: 'Baravi Handicraft & Cafe', lat: -18.1450, lng: 177.5080, zone: 'coral', modes: ['land'], icon: '☕' },
  { id: 'coral-coast-ss', name: 'Coral Coast Service Station', lat: -18.2200, lng: 177.7150, zone: 'coral', modes: ['land'], icon: '⛽' },

  // ── MAMANUCA ISLANDS ───────────────────────────────────
  { id: 'mamanucas', name: 'Mamanuca Islands', lat: -17.6833, lng: 177.0833, zone: 'mamanuca', modes: ['sea'], icon: '🏝️' },
  { id: 'yanuca', name: 'Shangri-La Yanuca Island', lat: -17.7667, lng: 177.1167, zone: 'mamanuca', modes: ['sea'], icon: '🌴' },
  { id: 'malolo', name: 'Malolo Island Resort', lat: -17.7449, lng: 177.1692, zone: 'mamanuca', modes: ['sea'], icon: '🏝️' },
  { id: 'tokoriki', name: 'Tokoriki Island Resort', lat: -17.5759, lng: 177.0888, zone: 'mamanuca', modes: ['sea'], icon: '🌺' },
  { id: 'mana-island', name: 'Mana Island Resort & Spa', lat: -17.6732, lng: 177.1077, zone: 'mamanuca', modes: ['sea'], icon: '🏝️' },
  { id: 'matamanoa', name: 'Matamanoa Island Resort', lat: -17.6380, lng: 177.0656, zone: 'mamanuca', modes: ['sea'], icon: '🌺' },
  { id: 'tadrai', name: 'Tadrai Island Resort', lat: -17.6600, lng: 177.0500, zone: 'mamanuca', modes: ['sea'], icon: '🌺' },
  { id: 'vomo', name: 'Vomo Island Fiji', lat: -17.4951, lng: 177.2661, zone: 'mamanuca', modes: ['sea'], icon: '🌴' },
  { id: 'castaway', name: 'Castaway Island Fiji', lat: -17.7339, lng: 177.1276, zone: 'mamanuca', modes: ['sea'], icon: '🏝️' },
  { id: 'lomani', name: 'Lomani Island Resort', lat: -17.7747, lng: 177.1959, zone: 'mamanuca', modes: ['sea'], icon: '🌺' },
  { id: 'likuliku', name: 'Likuliku Lagoon Resort', lat: -17.7392, lng: 177.1486, zone: 'mamanuca', modes: ['sea'], icon: '🌺' },
  { id: 'plantation-island', name: 'Plantation Island Resort', lat: -17.7771, lng: 177.1896, zone: 'mamanuca', modes: ['sea'], icon: '🏝️' },
  { id: 'musket-cove', name: 'Musket Cove Island Resort', lat: -17.7737, lng: 177.1946, zone: 'mamanuca', modes: ['sea'], icon: '⛵' },
  { id: 'beachcomber', name: 'Beachcomber Island Resort', lat: -17.6570, lng: 177.2520, zone: 'mamanuca', modes: ['sea'], icon: '🏖️' },
  { id: 'treasure-island', name: 'Treasure Island Resort', lat: -17.6554, lng: 177.2654, zone: 'mamanuca', modes: ['sea'], icon: '🏝️' },
  { id: 'tropica', name: 'Tropica Island Resort', lat: -17.7533, lng: 177.1547, zone: 'mamanuca', modes: ['sea'], icon: '🌴' },
  { id: 'six-senses', name: 'Six Senses Fiji', lat: -17.7584, lng: 177.1589, zone: 'mamanuca', modes: ['sea'], icon: '🏨' },
  { id: 'sheraton-tokoriki', name: 'Sheraton Resort Tokoriki Island', lat: -17.5759, lng: 177.0888, zone: 'mamanuca', modes: ['sea'], icon: '🏨' },
  { id: 'turtle-island', name: 'Turtle Island Fiji', lat: -16.9654, lng: 177.3707, zone: 'mamanuca', modes: ['sea'], icon: '🐢' },
  { id: 'tavarua', name: 'Tavarua Island Resort', lat: -16.8300, lng: 177.2100, zone: 'mamanuca', modes: ['sea'], icon: '🌊' },
  { id: 'como-laucala', name: 'COMO Laucala Island', lat: -16.8500, lng: 179.7200, zone: 'mamanuca', modes: ['sea'], icon: '🏨' },
  { id: 'wakaya', name: 'The Wakaya Club & Spa', lat: -17.7200, lng: 179.1200, zone: 'mamanuca', modes: ['sea'], icon: '🏨' },

  // ── YASAWA ISLANDS ─────────────────────────────────────
  { id: 'yasawa', name: 'Yasawa Islands', lat: -16.9000, lng: 177.3500, zone: 'yasawa', modes: ['sea'], icon: '🏝️' },
  { id: 'blue-lagoon', name: 'Blue Lagoon Beach Resort', lat: -16.9430, lng: 177.3682, zone: 'yasawa', modes: ['sea'], icon: '🏖️' },
  { id: 'octopus-resort', name: 'Octopus Resort', lat: -17.2760, lng: 177.1043, zone: 'yasawa', modes: ['sea'], icon: '🐙' },
  { id: 'yasawa-resort', name: 'Yasawa Island Resort & Spa', lat: -16.9200, lng: 177.3300, zone: 'yasawa', modes: ['sea'], icon: '🏨' },
  { id: 'barefoot-kuata', name: 'Barefoot Kuata Island Resort', lat: -17.3800, lng: 177.1500, zone: 'yasawa', modes: ['sea'], icon: '🏖️' },
  { id: 'waya-island', name: 'Waya Island Resort', lat: -17.2946, lng: 177.1290, zone: 'yasawa', modes: ['sea'], icon: '🌺' },
  { id: 'mantaray', name: 'Mantaray Island Resort', lat: -17.1759, lng: 177.1845, zone: 'yasawa', modes: ['sea'], icon: '🐠' },
  { id: 'nanuya', name: 'Nanuya Island Resort', lat: -16.9565, lng: 177.3764, zone: 'yasawa', modes: ['sea'], icon: '🏨' },
  { id: 'navutu-stars', name: 'Navutu Stars Resort', lat: -16.9884, lng: 177.3415, zone: 'yasawa', modes: ['sea'], icon: '⭐' },
  { id: 'paradise-cove', name: 'Paradise Cove Resort', lat: -16.8950, lng: 177.3520, zone: 'yasawa', modes: ['sea'], icon: '🏖️' },
  { id: 'coconut-beach', name: 'Coconut Beach Resort', lat: -16.9100, lng: 177.3650, zone: 'yasawa', modes: ['sea'], icon: '🌴' },
  { id: 'naqalia', name: 'Naqalia Lodge', lat: -17.3530, lng: 177.1400, zone: 'yasawa', modes: ['sea'], icon: '🌿' },
  { id: 'viwa-island', name: 'Viwa Island Resort', lat: -16.9000, lng: 177.3400, zone: 'yasawa', modes: ['sea'], icon: '🏨' },
  { id: 'oarsmans', name: "Oarsman's Bay Lodge", lat: -16.9100, lng: 177.3300, zone: 'yasawa', modes: ['sea'], icon: '🚣' },

  // ── VANUA LEVU ─────────────────────────────────────────
  { id: 'labasa', name: 'Labasa Town', lat: -16.4333, lng: 179.3333, zone: 'vanua-levu', modes: ['land','sea'], icon: '🌾' },
  { id: 'savusavu-town', name: 'Savusavu Town', lat: -16.8167, lng: 179.2667, zone: 'vanua-levu', modes: ['land','sea'], icon: '🌺' },
  { id: 'jm-cousteau', name: 'Jean-Michel Cousteau Resort', lat: -16.8102, lng: 179.2877, zone: 'vanua-levu', modes: ['land'], icon: '🏨' },
  { id: 'namale', name: 'Namale Resort & Spa', lat: -16.8020, lng: 179.3718, zone: 'vanua-levu', modes: ['land'], icon: '🏨' },
  { id: 'copra-sheds', name: 'Copra Sheds Lodge & Marina', lat: -16.8150, lng: 179.2650, zone: 'vanua-levu', modes: ['land','sea'], icon: '⚓' },
  { id: 'hotsprings', name: 'Savusavu Hot Springs Hotel', lat: -16.8170, lng: 179.2670, zone: 'vanua-levu', modes: ['land'], icon: '♨️' },
  { id: 'koro-sun', name: 'Koro Sun Resort & Spa', lat: -16.7900, lng: 179.2700, zone: 'vanua-levu', modes: ['land'], icon: '🏨' },
  { id: 'daku-fiji', name: 'Daku Fiji Resort', lat: -16.8200, lng: 179.2680, zone: 'vanua-levu', modes: ['land'], icon: '🏨' },
  { id: 'viani-bay', name: 'Viani Bay Resort', lat: -16.8300, lng: 179.2600, zone: 'vanua-levu', modes: ['land','sea'], icon: '🏖️' },
  { id: 'remote-resort', name: 'The Remote Resort Fiji Islands', lat: -16.7950, lng: 179.2750, zone: 'vanua-levu', modes: ['land'], icon: '🏨' },
  { id: 'nukubati', name: 'Nukubati Island Resort', lat: -16.3500, lng: 179.3200, zone: 'vanua-levu', modes: ['sea'], icon: '🏝️' },
  { id: 'vatuvara', name: 'Vatuvara Private Islands', lat: -16.4200, lng: 179.1500, zone: 'vanua-levu', modes: ['sea'], icon: '🏨' },

  // ── TAVEUNI ────────────────────────────────────────────
  { id: 'taveuni-island', name: 'Taveuni Island', lat: -16.9500, lng: -179.9167, zone: 'taveuni', modes: ['sea'], icon: '🌿' },
  { id: 'matangi', name: 'Matangi Private Island Resort', lat: -16.7333, lng: -179.7508, zone: 'taveuni', modes: ['sea'], icon: '🏨' },
  { id: 'qamea', name: 'Qamea Resort & Spa', lat: -16.7524, lng: -179.7918, zone: 'taveuni', modes: ['sea'], icon: '🏨' },
  { id: 'taveuni-palms', name: 'Taveuni Palms Resort', lat: -16.6892, lng: -179.8833, zone: 'taveuni', modes: ['sea'], icon: '🏨' },
  { id: 'paradise-taveuni', name: 'Paradise Taveuni', lat: -16.9345, lng: -179.9012, zone: 'taveuni', modes: ['sea'], icon: '🏨' },
  { id: 'bouma-park', name: 'Bouma National Heritage Park', lat: -16.9200, lng: -179.8900, zone: 'taveuni', modes: ['sea'], icon: '🌿' },
  { id: 'tides-reach', name: 'Tides Reach Resort', lat: -16.9450, lng: -179.9080, zone: 'taveuni', modes: ['sea'], icon: '🏖️' },
  { id: 'the-pointe', name: 'The Pointe Taveuni', lat: -16.9420, lng: -179.9120, zone: 'taveuni', modes: ['sea'], icon: '🏨' },
  { id: 'dolphin-bay', name: 'Dolphin Bay Divers Retreat', lat: -16.9280, lng: -179.8950, zone: 'taveuni', modes: ['sea'], icon: '🐬' },
  { id: 'aroha', name: 'Aroha Taveuni', lat: -16.9320, lng: -179.8980, zone: 'taveuni', modes: ['sea'], icon: '🌺' },

  // ── KADAVU ─────────────────────────────────────────────
  { id: 'kadavu-island', name: 'Kadavu Island', lat: -18.9167, lng: 178.2000, zone: 'kadavu', modes: ['sea'], icon: '🤿' },
  { id: 'matava', name: 'Matava Eco Resort', lat: -19.0454, lng: 178.3990, zone: 'kadavu', modes: ['sea'], icon: '🌿' },
  { id: 'kadavu-beach', name: 'Kadavu Beach Resort', lat: -18.9100, lng: 178.1900, zone: 'kadavu', modes: ['sea'], icon: '🏖️' },
  { id: 'on-island', name: 'Ono Island Resort', lat: -18.9000, lng: 178.1800, zone: 'kadavu', modes: ['sea'], icon: '🏝️' },

  // ── BEQA ───────────────────────────────────────────────
  { id: 'beqa-lagoon', name: 'Beqa Lagoon', lat: -18.3667, lng: 178.1333, zone: 'beqa', modes: ['sea'], icon: '🦈' },
  { id: 'beqa-lagoon-resort', name: 'Beqa Lagoon Resort', lat: -18.3600, lng: 178.1300, zone: 'beqa', modes: ['sea'], icon: '🏨' },
  { id: 'lalati', name: 'Lalati Resort & Spa', lat: -18.2800, lng: 178.0700, zone: 'beqa', modes: ['sea'], icon: '🏨' },
  { id: 'waidroka', name: 'Waidroka Bay Resort', lat: -18.2750, lng: 178.0650, zone: 'beqa', modes: ['sea'], icon: '🏖️' },
  { id: 'royal-davui', name: 'Royal Davui Island Resort', lat: -18.3400, lng: 178.1200, zone: 'beqa', modes: ['sea'], icon: '🏨' },
  { id: 'savasi', name: 'Savasi Island Resort', lat: -18.1800, lng: 178.4100, zone: 'beqa', modes: ['sea'], icon: '🏨' },

  // ── OVALAU ─────────────────────────────────────────────
  { id: 'levuka', name: 'Levuka Historic Town', lat: -17.6833, lng: 178.8333, zone: 'ovalau', modes: ['sea'], icon: '🏛️' },
  { id: 'ovalau', name: 'Ovalau Island', lat: -17.6800, lng: 178.8300, zone: 'ovalau', modes: ['sea'], icon: '🏝️' },

  // ── NEW 2025-2026 DEVELOPMENTS ──────────────────────────
  { id: 'damodar-city-nadi', name: 'Damodar City Nadi (New $80M Development)', lat: -17.8015, lng: 177.4530, zone: 'nadi', modes: ['land'], icon: '🏗️' },
  { id: 'racecourse-hotel-ba', name: 'Racecourse Hotels & Apartments Ba (New $25M)', lat: -17.5340, lng: 177.6670, zone: 'lautoka', modes: ['land'], icon: '🏗️' },
  { id: 'innovation-hub', name: 'Fiji Innovation Hub (RBF Suva)', lat: -18.1435, lng: 178.4315, zone: 'suva', modes: ['land'], icon: '💡' },
  { id: 'skills-hub', name: 'Pacific Australia Skills Hub (Walu Bay)', lat: -18.1360, lng: 178.4160, zone: 'suva', modes: ['land'], icon: '🔧' },
  { id: 'sim-centre', name: 'Healthcare Simulation Centre (US$9.8M)', lat: -18.1460, lng: 178.4330, zone: 'suva', modes: ['land'], icon: '🏥' },
  { id: 'damodar-city-labasa', name: 'Damodar City Labasa ($60M)', lat: -16.4333, lng: 179.3333, zone: 'vanua-levu', modes: ['land'], icon: '🏬' },
];

const VEHICLES = {
  land: {
    bula:     { name: 'Bula Ride',       emoji: '🚙', desc: 'Affordable island hopper', cap: 4, base: 3.00, perKm: 1.20, perMin: 0.30, min: 5.00, features: ['ac', 'music', 'phone-charger'] },
    taxi:     { name: 'Island Taxi',      emoji: '🚕', desc: 'Comfortable sedan ride', cap: 4, base: 5.00, perKm: 2.00, perMin: 0.50, min: 8.00, features: ['ac', 'music', 'phone-charger', 'wifi', 'water'] },
    suv:      { name: 'Resort Transfer',  emoji: '🚐', desc: 'Spacious group transport', cap: 7, base: 10.00, perKm: 3.50, perMin: 0.80, min: 15.00, features: ['ac', 'music', 'phone-charger', 'wifi', 'water', 'luggage'] },
    bula_bus: { name: 'Bula Bus',         emoji: '🚌', desc: 'Shared minibus rides', cap: 14, base: 2.00, perKm: 0.80, perMin: 0.20, min: 3.00, features: ['ac', 'music'] },
  },
  sea: {
    water_taxi: { name: 'Water Taxi',      emoji: '🚤', desc: 'Fast inter-island speedboat', cap: 8, base: 15.00, perKm: 4.50, perMin: 1.20, min: 25.00, features: ['life-jacket', 'snorkel-gear', 'cooler'] },
    ferry:      { name: 'Island Ferry',    emoji: '⛴️', desc: 'South Seas ferry service', cap: 50, base: 89.00, perKm: 2.50, perMin: 0.80, min: 89.00, features: ['life-jacket', 'cafe', 'restroom', 'deck', 'wifi', 'bar'] },
    charter:    { name: 'Island Charter',  emoji: '🛥️', desc: 'Private boat charter', cap: 12, base: 50.00, perKm: 8.00, perMin: 2.00, min: 80.00, features: ['life-jacket', 'snorkel-gear', 'cooler', 'fishing-gear', 'sun-deck', 'captain'] },
    catamaran:  { name: 'Pacific Catamaran', emoji: '⛵', desc: 'Luxury catamaran transfer', cap: 20, base: 35.00, perKm: 6.00, perMin: 1.50, min: 60.00, features: ['life-jacket', 'snorkel-gear', 'cooler', 'sun-deck', 'bar', 'captain', 'cabin'] },
  },
};

const FEATURE_LABELS = {
  'ac': { icon: '❄️', label: 'A/C' },
  'music': { icon: '🎵', label: 'Music' },
  'phone-charger': { icon: '🔌', label: 'Charger' },
  'wifi': { icon: '📶', label: 'WiFi' },
  'water': { icon: '💧', label: 'Water' },
  'luggage': { icon: '🧳', label: 'Luggage' },
  'life-jacket': { icon: '🦺', label: 'Life Jacket' },
  'snorkel-gear': { icon: '🤿', label: 'Snorkel' },
  'cooler': { icon: '🧊', label: 'Cooler' },
  'fishing-gear': { icon: '🎣', label: 'Fishing' },
  'sun-deck': { icon: '☀️', label: 'Sun Deck' },
  'captain': { icon: '👨‍✈️', label: 'Captain' },
  'cafe': { icon: '☕', label: 'Café' },
  'restroom': { icon: '🚻', label: 'Restroom' },
  'deck': { icon: '🛳️', label: 'Deck' },
  'bar': { icon: '🍸', label: 'Bar' },
  'cabin': { icon: '🛏️', label: 'Cabin' },
};

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function getSurge(zone) {
  const h = new Date().getUTCHours() + 12;
  const hour = h % 24;
  const base = { nadi: 1.2, suva: 1.1, coral: 1.0, lautoka: 1.0, mamanuca: 1.5, yasawa: 1.5, 'vanua-levu': 1.0, taveuni: 1.0, kadavu: 1.3, beqa: 1.3, denarau: 1.2, ovalau: 1.0 }[zone] || 1.0;
  if (hour >= 22 || hour < 5) return base * 1.5;
  if (hour >= 7 && hour < 9) return base * 1.3;
  if (hour >= 16 && hour < 19) return base * 1.3;
  return base;
}

function calcPrice(mode, vType, distKm, durMin, surge) {
  const v = VEHICLES[mode]?.[vType];
  if (!v) return null;
  let price = v.base + v.perKm * distKm + v.perMin * durMin;
  price *= surge;
  return Math.max(price, v.min);
}

function findZone(lat, lng) {
  let best = { zone: 'nadi', dist: Infinity };
  for (const loc of LOCATIONS) {
    const d = haversine(lat, lng, loc.lat, loc.lng);
    if (d < best.dist) best = { zone: loc.zone, dist: d };
  }
  return best.zone;
}

// ── Main async bootstrap ─────────────────────────────────────
async function startServer() {
  const Database = require('./src/config/database');
  const dataDir = process.env.DATA_DIR || __dirname;
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const db = new Database(path.join(dataDir, 'pointbreak.db'));
  await db.ready;

  const authRoutes = require('./src/routes/auth');
  const walletRoutes = require('./src/routes/wallet');
  const aiRoutes = require('./src/routes/ai');
  const adminRoutes = require('./src/routes/admin');

  // ── Schema ────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE,
      email TEXT, role TEXT DEFAULT 'rider', password_hash TEXT,
      biometric_id TEXT, emergency_contact TEXT, profile_photo TEXT,
      home_zone TEXT, home_location_id TEXT, home_lat REAL, home_lng REAL,
      work_zone TEXT, work_location_id TEXT, work_lat REAL, work_lng REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS saved_locations (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, label TEXT NOT NULL,
      location_id TEXT, name TEXT, lat REAL, lng REAL, zone TEXT,
      icon TEXT DEFAULT '📍', sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS driver_applications (
      id TEXT PRIMARY KEY, user_id TEXT, name TEXT NOT NULL, phone TEXT NOT NULL,
      email TEXT, dob TEXT, address TEXT,
      vehicle_type TEXT NOT NULL, vehicle_make TEXT, vehicle_model TEXT,
      vehicle_year INTEGER, vehicle_color TEXT, vehicle_plate TEXT,
      license_no TEXT, license_expiry TEXT,
      insurance_provider TEXT, insurance_policy TEXT, insurance_expiry TEXT,
      mode TEXT DEFAULT 'land',
      status TEXT DEFAULT 'pending', reviewed_by TEXT, reviewed_at DATETIME,
      admin_notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL,
      body TEXT NOT NULL, type TEXT DEFAULT 'info',
      read INTEGER DEFAULT 0, data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY, notifications INTEGER DEFAULT 1,
      location_sharing INTEGER DEFAULT 1, dark_mode INTEGER DEFAULT 1,
      language TEXT DEFAULT 'en', currency TEXT DEFAULT 'FJD',
      country TEXT DEFAULT 'FJ',
      sound_enabled INTEGER DEFAULT 1, vibration INTEGER DEFAULT 1,
      auto_accept_rides INTEGER DEFAULT 0, radius_km REAL DEFAULT 5.0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, location_id TEXT,
      location_name TEXT, zone TEXT,
      title TEXT NOT NULL, story TEXT, rating INTEGER,
      photos TEXT, likes_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS post_likes (
      id TEXT PRIMARY KEY, post_id TEXT NOT NULL, user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS post_comments (
      id TEXT PRIMARY KEY, post_id TEXT NOT NULL, user_id TEXT NOT NULL,
      user_name TEXT, comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS destination_reviews (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, location_id TEXT NOT NULL,
      user_name TEXT, rating INTEGER NOT NULL, title TEXT, review TEXT,
      photos TEXT, visit_date TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS providers (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
      phone TEXT NOT NULL, mode TEXT NOT NULL, vehicle_type TEXT NOT NULL,
      vehicle_name TEXT NOT NULL, vehicle_plate TEXT, capacity INTEGER DEFAULT 4,
      rating REAL DEFAULT 5.0, total_rides INTEGER DEFAULT 0,
      lat REAL DEFAULT -17.8106, lng REAL DEFAULT 177.9512,
      available INTEGER DEFAULT 1, license_no TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS rides (
      id TEXT PRIMARY KEY, rider_id TEXT NOT NULL, provider_id TEXT,
      mode TEXT NOT NULL, status TEXT DEFAULT 'searching',
      pickup_lat REAL NOT NULL, pickup_lng REAL NOT NULL, pickup_name TEXT,
      dropoff_lat REAL NOT NULL, dropoff_lng REAL NOT NULL, dropoff_name TEXT,
      vehicle_type TEXT NOT NULL, price_fjd REAL, distance_km REAL,
      duration_min REAL, surge REAL DEFAULT 1.0, passengers INTEGER DEFAULT 1,
      rating INTEGER, review TEXT, payment_method TEXT DEFAULT 'cash',
      scheduled_time TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      accepted_at DATETIME, started_at DATETIME, completed_at DATETIME
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY, ride_id TEXT NOT NULL, provider_id TEXT NOT NULL,
      rider_id TEXT NOT NULL, rating INTEGER NOT NULL, review TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE,
      balance REAL DEFAULT 0, currency TEXT DEFAULT 'FJD',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY, wallet_id TEXT NOT NULL, user_id TEXT NOT NULL,
      type TEXT NOT NULL, amount REAL NOT NULL, description TEXT,
      ride_id TEXT, balance_after REAL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ── Seed ──────────────────────────────────────────────────
  const count = db.prepare('SELECT COUNT(*) as c FROM providers').get();
  if (count && count.c === 0) {
    const demoUserId = 'demo-user-001';
    const demoDriverId = 'demo-driver-001';

    // Demo rider account
    db.prepare('INSERT OR IGNORE INTO users (id, name, phone, email, role) VALUES (?,?,?,?,?)')
      .run(demoUserId, 'Demo User', '+6799990001', 'demo@pointbreak.fj', 'rider');

    // Demo driver account (linked to the provider below)
    db.prepare('INSERT OR IGNORE INTO users (id, name, phone, email, role) VALUES (?,?,?,?,?)')
      .run(demoDriverId, 'Demo Captain', '+6799990002', 'captain@pointbreak.fj', 'driver');

    // One provider at Nadi International Airport, linked to the demo driver
    db.prepare(`INSERT INTO providers (id, user_id, name, phone, mode, vehicle_type, vehicle_name, vehicle_plate, capacity, rating, total_rides, lat, lng, available) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(uuidv4(), demoDriverId, 'Demo Captain', '+6799990002', 'land', 'taxi', 'Island Taxi', 'PB001', 4, 5.0, 0, -17.7553, 177.4432, 1);

    console.log('🌴 PointBreak Fiji seed: 1 driver at Nadi Airport, demo rider + demo driver');
  }

  // ── Express App ───────────────────────────────────────────
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  app.set('trust proxy', true);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning', 'Cache-Control', 'Pragma'],
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb', type: ['application/json', 'text/plain'] }));
  app.use(apiLimiter);
  app.use(auditMiddleware);

  // ── Serve Web Frontend ──────────────────────────────────
  app.use(express.static(path.join(__dirname, '..', 'web')));
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  // ── Socket.IO ─────────────────────────────────────────────
  const providerSockets = new Map();
  const riderSockets = new Map();

  io.on('connection', (socket) => {
    socket.on('provider:join', (providerId) => {
      providerSockets.set(providerId, socket.id);
      socket.join(`provider:${providerId}`);
    });
    socket.on('rider:join', (riderId) => {
      riderSockets.set(riderId, socket.id);
      socket.join(`rider:${riderId}`);
    });
    socket.on('ride:track', (rideId) => socket.join(`ride:${rideId}`));
    socket.on('provider:location', ({ providerId, lat, lng }) => {
      db.prepare('UPDATE providers SET lat=?, lng=? WHERE id=?').run(lat, lng, providerId);
      io.emit('provider:moved', { providerId, lat, lng });
    });
    socket.on('disconnect', () => {
      for (const [id, sid] of providerSockets) {
        if (sid === socket.id) {
          providerSockets.delete(id);
          db.prepare('UPDATE providers SET available=0 WHERE id=?').run(id);
        }
      }
    });
  });

  // ── Routes ────────────────────────────────────────────────
  app.use('/api/auth', authRoutes(db));
  app.use('/api/wallet', authMiddleware, walletRoutes(db));
  app.use('/api/ai', authMiddleware, aiRoutes(db));
  app.use('/api/admin', adminRoutes(db));

  app.get('/api/locations', (_req, res) => res.json(LOCATIONS));
  app.get('/api/vehicles', (_req, res) => res.json(VEHICLES));

  app.get('/api/users/:id/saved-locations', (req, res) => {
    const rows = db.prepare('SELECT * FROM saved_locations WHERE user_id=? ORDER BY sort_order').all(req.params.id);
    res.json(rows);
  });
  app.post('/api/users/:id/saved-locations', (req, res) => {
    const { label, location_id, name, lat, lng, zone, icon } = req.body;
    const slId = `sl-${Date.now().toString(36)}`;
    db.prepare('INSERT INTO saved_locations (id, user_id, label, location_id, name, lat, lng, zone, icon, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(slId, req.params.id, label, location_id || null, name, lat || null, lng || null, zone || null, icon || '📍', 3);
    res.json({ id: slId, label, location_id, name, lat, lng, zone, icon });
  });
  app.delete('/api/users/:id/saved-locations/:slId', (req, res) => {
    db.prepare('DELETE FROM saved_locations WHERE id=? AND user_id=?').run(req.params.slId, req.params.id);
    res.json({ ok: true });
  });

  // ── DRIVER APPLICATIONS ────────────────────────────────
  app.post('/api/driver-applications', (req, res) => {
    const d = req.body;
    const id = `da-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
    db.prepare(`INSERT INTO driver_applications (id, user_id, name, phone, email, dob, address, vehicle_type, vehicle_make, vehicle_model, vehicle_year, vehicle_color, vehicle_plate, license_no, license_expiry, insurance_provider, insurance_policy, insurance_expiry, mode, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, d.user_id || null, d.name, d.phone, d.email || null, d.dob || null, d.address || null, d.vehicle_type, d.vehicle_make || null, d.vehicle_model || null, d.vehicle_year || null, d.vehicle_color || null, d.vehicle_plate, d.license_no, d.license_expiry || null, d.insurance_provider || null, d.insurance_policy || null, d.insurance_expiry || null, d.mode || 'land', 'pending');
    res.json({ id, status: 'pending', message: 'Application submitted' });
  });
  app.get('/api/driver-applications', (req, res) => {
    const { status } = req.query;
    let q = 'SELECT * FROM driver_applications';
    const p = [];
    if (status) { q += ' WHERE status=?'; p.push(status); }
    q += ' ORDER BY created_at DESC';
    res.json(db.prepare(q).all(...p));
  });
  const { sendEmail, driverApprovedEmail, driverRejectedEmail } = require('./src/utils/email');

  app.put('/api/driver-applications/:id/approve', (req, res) => {
    const app = db.prepare('SELECT * FROM driver_applications WHERE id=?').get(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });
    db.prepare("UPDATE driver_applications SET status='approved', reviewed_at=CURRENT_TIMESTAMP, admin_notes=? WHERE id=?").run(req.body.notes || null, req.params.id);
    const userId = app.user_id || `driver-${Date.now().toString(36)}`;
    if (!app.user_id) {
      const hashedPw = require('bcrypt').hashSync('default', 10);
      db.prepare('INSERT OR IGNORE INTO users (id, name, phone, email, role, password_hash) VALUES (?,?,?,?,?,?)').run(userId, app.name, app.phone, app.email, 'driver', hashedPw);
    }
    const provId = `prov-${Date.now().toString(36)}`;
    db.prepare(`INSERT INTO providers (id, user_id, name, phone, mode, vehicle_type, vehicle_name, vehicle_plate, capacity, available, lat, lng) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(provId, userId, app.name, app.phone, app.mode, app.vehicle_type, `${app.vehicle_make||''} ${app.vehicle_model||''}`.trim() || 'PointBreak Vehicle', app.vehicle_plate, 4, 1, -17.8018, 177.4534);
    db.prepare('INSERT INTO notifications (id, user_id, title, body, type) VALUES (?,?,?,?,?)').run(`notif-${Date.now().toString(36)}`, userId, '🎉 Application Approved!', `Congratulations ${app.name}! Your driver application has been approved. You can now start accepting rides on PointBreak.`, 'approval');
    if (app.email) {
      sendEmail(app.email, '🎉 Your PointBreak Driver Application is Approved!', driverApprovedEmail(app.name, app.vehicle_type, app.vehicle_plate))
        .catch(e => console.error('[Email] Approval send failed:', e.message));
    }
    res.json({ ok: true, provider_id: provId });
  });
  app.put('/api/driver-applications/:id/reject', (req, res) => {
    db.prepare("UPDATE driver_applications SET status='rejected', reviewed_at=CURRENT_TIMESTAMP, admin_notes=? WHERE id=?").run(req.body.notes || '', req.params.id);
    const app = db.prepare('SELECT * FROM driver_applications WHERE id=?').get(req.params.id);
    if (app && app.user_id) {
      db.prepare('INSERT INTO notifications (id, user_id, title, body, type) VALUES (?,?,?,?,?)').run(`notif-${Date.now().toString(36)}`, app.user_id, '❌ Application Update', `Dear ${app.name}, your driver application was not approved at this time. Reason: ${req.body.notes || 'Not specified'}. You may reapply.`, 'rejection');
    }
    if (app && app.email) {
      sendEmail(app.email, 'PointBreak Driver Application Update', driverRejectedEmail(app.name, req.body.notes))
        .catch(e => console.error('[Email] Rejection send failed:', e.message));
    }
    res.json({ ok: true });
  });

  // ── NOTIFICATIONS ──────────────────────────────────────
  app.get('/api/users/:id/notifications', (req, res) => {
    const rows = db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(req.params.id);
    res.json(rows);
  });
  app.put('/api/notifications/:id/read', (req, res) => {
    db.prepare('UPDATE notifications SET read=1 WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  });
  app.put('/api/users/:id/notifications/read-all', (req, res) => {
    db.prepare('UPDATE notifications SET read=1 WHERE user_id=?').run(req.params.id);
    res.json({ ok: true });
  });

  // ── USER SETTINGS ──────────────────────────────────────
  app.get('/api/users/:id/settings', (req, res) => {
    let s = db.prepare('SELECT * FROM user_settings WHERE user_id=?').get(req.params.id);
    if (!s) { db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(req.params.id); s = db.prepare('SELECT * FROM user_settings WHERE user_id=?').get(req.params.id); }
    res.json(s);
  });
  app.put('/api/users/:id/settings', (req, res) => {
    const u = req.body;
    const cols = ['notifications','location_sharing','dark_mode','language','currency','sound_enabled','vibration','auto_accept_rides','radius_km'];
    const sets = cols.filter(c => u[c] !== undefined).map(c => `${c}=?`);
    if (sets.length === 0) return res.json({ ok: true });
    const vals = cols.filter(c => u[c] !== undefined).map(c => u[c]);
    db.prepare(`UPDATE user_settings SET ${sets.join(',')}, updated_at=CURRENT_TIMESTAMP WHERE user_id=?`).run(...vals, req.params.id);
    res.json({ ok: true });
  });

  // ── SOCIAL FEED ────────────────────────────────────────
  app.post('/api/posts', (req, res) => {
    const { user_id, location_id, location_name, zone, title, story, rating, photos } = req.body;
    const id = `post-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,5)}`;
    db.prepare('INSERT INTO posts (id, user_id, location_id, location_name, zone, title, story, rating, photos) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(id, user_id, location_id || null, location_name || null, zone || null, title, story || null, rating || null, JSON.stringify(photos || []));
    res.json({ id, status: 'posted' });
  });
  app.get('/api/posts', (req, res) => {
    const { location_id, user_id, limit: lim } = req.query;
    let q = 'SELECT p.*, u.name as author_name FROM posts p LEFT JOIN users u ON p.user_id = u.id';
    const conds = [], vals = [];
    if (location_id) { conds.push('p.location_id=?'); vals.push(location_id); }
    if (user_id) { conds.push('p.user_id=?'); vals.push(user_id); }
    if (conds.length) q += ' WHERE ' + conds.join(' AND ');
    q += ` ORDER BY p.created_at DESC LIMIT ${parseInt(lim) || 50}`;
    res.json(db.prepare(q).all(...vals));
  });
  app.post('/api/posts/:id/like', (req, res) => {
    const { user_id } = req.body;
    try {
      db.prepare('INSERT INTO post_likes (id, post_id, user_id) VALUES (?,?,?)').run(`like-${Date.now().toString(36)}`, req.params.id, user_id);
      db.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id=?').run(req.params.id);
      res.json({ ok: true, liked: true });
    } catch { res.json({ ok: true, liked: false, msg: 'Already liked' }); }
  });
  app.delete('/api/posts/:id/like', (req, res) => {
    const { user_id } = req.query;
    db.prepare('DELETE FROM post_likes WHERE post_id=? AND user_id=?').run(req.params.id, user_id);
    db.prepare('UPDATE posts SET likes_count = MAX(0, likes_count - 1) WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  });
  app.post('/api/posts/:id/comments', (req, res) => {
    const { user_id, user_name, comment } = req.body;
    const cid = `cmt-${Date.now().toString(36)}`;
    db.prepare('INSERT INTO post_comments (id, post_id, user_id, user_name, comment) VALUES (?,?,?,?,?)').run(cid, req.params.id, user_id, user_name, comment);
    res.json({ id: cid });
  });
  app.get('/api/posts/:id/comments', (req, res) => {
    res.json(db.prepare('SELECT * FROM post_comments WHERE post_id=? ORDER BY created_at ASC').all(req.params.id));
  });

  // ── DESTINATION REVIEWS ────────────────────────────────
  app.post('/api/reviews', (req, res) => {
    const { user_id, location_id, user_name, rating, title, review, photos, visit_date } = req.body;
    const id = `rev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,5)}`;
    db.prepare('INSERT INTO destination_reviews (id, user_id, location_id, user_name, rating, title, review, photos, visit_date) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(id, user_id, location_id, user_name, rating, title || null, review || null, JSON.stringify(photos || []), visit_date || null);
    res.json({ id, status: 'reviewed' });
  });
  app.get('/api/reviews', (req, res) => {
    const { location_id } = req.query;
    let q = 'SELECT r.*, u.name as author_name FROM destination_reviews r LEFT JOIN users u ON r.user_id = u.id';
    if (location_id) q += ' WHERE r.location_id=?';
    q += ' ORDER BY r.created_at DESC';
    res.json(location_id ? db.prepare(q).all(location_id) : db.prepare(q).all());
  });
  app.get('/api/reviews/stats/:locationId', (req, res) => {
    const stats = db.prepare('SELECT COUNT(*) as count, AVG(rating) as avg_rating FROM destination_reviews WHERE location_id=?').get(req.params.locationId);
    res.json(stats);
  });

  // ── FILE UPLOAD (photos) ───────────────────────────────
  const fs = require('fs');
  const uploadDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  app.post('/api/upload', express.raw({ type: 'image/*', limit: '10mb' }), (req, res) => {
    const ext = req.headers['content-type']?.includes('png') ? '.png' : '.jpg';
    const filename = `photo-${Date.now().toString(36)}${ext}`;
    fs.writeFileSync(path.join(uploadDir, filename), req.body);
    res.json({ url: `/uploads/${filename}`, filename });
  });

  app.post('/api/test-email', async (req, res) => {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: 'Email required' });
    const result = await sendEmail(to, '🏝️ PointBreak Test Email', `
      <div style="font-family:sans-serif;padding:20px;max-width:400px;margin:0 auto;background:#111827;border-radius:12px;color:#e2e8f0">
        <h2 style="color:#00b4d8">✅ Email Working!</h2>
        <p>This is a test email from PointBreak Rides Fiji admin panel.</p>
        <p style="color:#8892b0;font-size:.85rem">If you received this, SMTP is configured correctly.</p>
        <hr style="border-color:#2a3454;margin:16px 0">
        <p style="color:#8892b0;font-size:.75rem">PointBreak Rides Fiji 🏝️</p>
      </div>
    `);
    res.json(result);
  });

  app.get('/api/providers', (req, res) => {
    const { mode, vehicle_type, lat, lng } = req.query;
    let q = 'SELECT * FROM providers WHERE available=1';
    const p = [];
    if (mode) { q += ' AND mode=?'; p.push(mode); }
    if (vehicle_type) { q += ' AND vehicle_type=?'; p.push(vehicle_type); }
    const rows = db.prepare(q).all(...p);
    if (lat && lng) {
      rows.forEach(r => { r.distance_km = haversine(+lat, +lng, r.lat, r.lng); });
      rows.sort((a,b) => a.distance_km - b.distance_km);
    }
    res.json(rows);
  });

  // ── Driver profile (authenticated) ───────────────────────
  app.post('/api/providers/register', authMiddleware, (req, res) => {
    const existing = db.prepare('SELECT * FROM providers WHERE user_id=?').get(req.user.userId);
    if (existing) return res.json(existing);
    const { mode, vehicle_type, vehicle_name, vehicle_plate, capacity, license_no } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    db.prepare('UPDATE users SET role=? WHERE id=?').run('driver', req.user.userId);
    const id = uuidv4();
    db.prepare(`INSERT INTO providers (id,user_id,name,phone,mode,vehicle_type,vehicle_name,vehicle_plate,capacity,rating,total_rides,lat,lng,available,license_no) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, req.user.userId, user.name, user.phone, mode||'land', vehicle_type||'taxi', vehicle_name||'Island Taxi', vehicle_plate||'PB-'+Math.floor(Math.random()*900+100), capacity||4, 5.0, 0, -17.7553, 177.4432, 1, license_no||null);
    const provider = db.prepare('SELECT * FROM providers WHERE id=?').get(id);
    res.json(provider);
  });

  app.get('/api/providers/me', authMiddleware, (req, res) => {
    const p = db.prepare('SELECT * FROM providers WHERE user_id=?').get(req.user.userId);
    p ? res.json(p) : res.status(404).json({ error: 'No driver profile yet' });
  });

  app.put('/api/providers/me', authMiddleware, (req, res) => {
    const p = db.prepare('SELECT * FROM providers WHERE user_id=?').get(req.user.userId);
    if (!p) return res.status(404).json({ error: 'No driver profile yet' });
    const { available, lat, lng } = req.body;
    if (available !== undefined) db.prepare('UPDATE providers SET available=? WHERE id=?').run(available ? 1 : 0, p.id);
    if (lat !== undefined && lng !== undefined) db.prepare('UPDATE providers SET lat=?, lng=? WHERE id=?').run(+lat, +lng, p.id);
    res.json(db.prepare('SELECT * FROM providers WHERE id=?').get(p.id));
  });

  app.get('/api/providers/:id', (req, res) => {
    const d = db.prepare('SELECT * FROM providers WHERE id=?').get(req.params.id);
    d ? res.json(d) : res.status(404).json({ error: 'Not found' });
  });


  app.get('/api/estimate', (req, res) => {
    const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, mode } = req.query;
    if (!pickup_lat || !pickup_lng || !dropoff_lat || !dropoff_lng) return res.status(400).json({ error: 'Coordinates required' });
    const lat1=+pickup_lat, lng1=+pickup_lng, lat2=+dropoff_lat, lng2=+dropoff_lng;
    const dist = haversine(lat1,lng1,lat2,lng2);
    const dur = dist * 2.5;
    const zone = findZone(lat1,lng1);
    const surge = getSurge(zone);
    const estimates = {};
    const modes = mode ? [mode] : ['land','sea'];
    for (const m of modes) {
      for (const [k,v] of Object.entries(VEHICLES[m]||{})) {
        estimates[k] = { ...v, type: k, mode: m, price: +calcPrice(m, k, dist, dur, surge).toFixed(2), distance_km: +dist.toFixed(2), duration_min: Math.round(dur) };
      }
    }
    res.json({ estimates, surge, zone, distance_km: +dist.toFixed(2), duration_min: Math.round(dur) });
  });

  app.post('/api/rides', (req, res) => {
    const { rider_id, mode, pickup_lat, pickup_lng, pickup_name, dropoff_lat, dropoff_lng, dropoff_name, vehicle_type, passengers, scheduled_time } = req.body;
    if (!rider_id || !pickup_lat || !dropoff_lat || !mode || !vehicle_type) return res.status(400).json({ error: 'Missing fields' });
    const lat1=+pickup_lat, lng1=+pickup_lng, lat2=+dropoff_lat, lng2=+dropoff_lng;
    const dist = haversine(lat1,lng1,lat2,lng2);
    const dur = dist * 2.5;
    const zone = findZone(lat1,lng1);
    const surge = getSurge(zone);
    const price = calcPrice(mode, vehicle_type, dist, dur, surge);

    // Find nearest available provider — try exact vehicle type first, then any in same mode
    let nearest = db.prepare(`SELECT *, ((lat-?)*(lat-?)+(lng-?)*(lng-?)) as dist_sq FROM providers WHERE available=1 AND mode=? AND vehicle_type=? ORDER BY dist_sq ASC LIMIT 1`).get(lat1, lat1, lng1, lng1, mode, vehicle_type);
    if (!nearest) {
      nearest = db.prepare(`SELECT *, ((lat-?)*(lat-?)+(lng-?)*(lng-?)) as dist_sq FROM providers WHERE available=1 AND mode=? ORDER BY dist_sq ASC LIMIT 1`).get(lat1, lat1, lng1, lng1, mode);
    }

    const rideId = uuidv4();
    db.prepare(`INSERT INTO rides (id,rider_id,provider_id,mode,status,pickup_lat,pickup_lng,pickup_name,dropoff_lat,dropoff_lng,dropoff_name,vehicle_type,price_fjd,distance_km,duration_min,surge,passengers,scheduled_time) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(rideId, rider_id, nearest?.id||null, mode, nearest?'matched':'searching', lat1, lng1, pickup_name||'', lat2, lng2, dropoff_name||'', vehicle_type, +price.toFixed(2), +dist.toFixed(2), Math.round(dur), surge, passengers||1, scheduled_time||null);
    if (nearest) {
      db.prepare('UPDATE providers SET available=0 WHERE id=?').run(nearest.id);
      const sId = providerSockets.get(nearest.id);
      if (sId) io.to(sId).emit('ride:new', { rideId, ...req.body, price });
    }
    const ride = db.prepare('SELECT * FROM rides WHERE id=?').get(rideId);
    res.json(ride);
  });

  // Create a test ride for a specific driver (for demo/testing purposes)
  app.post('/api/rides/test', (req, res) => {
    const { provider_id, mode, vehicle_type } = req.body;
    if (!provider_id) return res.status(400).json({ error: 'Missing provider_id' });
    const provider = db.prepare('SELECT * FROM providers WHERE id=?').get(provider_id);
    if (!provider) return res.status(404).json({ error: 'Provider not found' });
    const m = mode || provider.mode || 'land';
    const vt = vehicle_type || provider.vehicle_type || 'taxi';
    const pickup = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    let dropoff = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    while (dropoff.id === pickup.id) dropoff = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    const dist = haversine(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
    const dur = dist * 2.5;
    const zone = findZone(pickup.lat, pickup.lng);
    const surge = getSurge(zone);
    const price = calcPrice(m, vt, dist, dur, surge);
    const rideId = uuidv4();
    db.prepare(`INSERT INTO rides (id,rider_id,provider_id,mode,status,pickup_lat,pickup_lng,pickup_name,dropoff_lat,dropoff_lng,dropoff_name,vehicle_type,price_fjd,distance_km,duration_min,surge,passengers) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(rideId, 'demo-user-001', provider_id, m, 'matched', pickup.lat, pickup.lng, pickup.name, dropoff.lat, dropoff.lng, dropoff.name, vt, +price.toFixed(2), +dist.toFixed(2), Math.round(dur), surge, 1);
    const ride = db.prepare('SELECT * FROM rides WHERE id=?').get(rideId);
    const sId = providerSockets.get(provider_id);
    if (sId) io.to(sId).emit('ride:new', { rideId, mode:m, pickup_name:pickup.name, dropoff_name:dropoff.name, vehicle_type:vt, price });
    res.json(ride);
  });

  app.put('/api/rides/:id/accept', (req, res) => {
    const { provider_id } = req.body;
    const ride = db.prepare('SELECT * FROM rides WHERE id=?').get(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Not found' });
    db.prepare('UPDATE rides SET provider_id=?, status=?, accepted_at=CURRENT_TIMESTAMP WHERE id=?').run(provider_id, 'accepted', ride.id);
    db.prepare('UPDATE providers SET available=0 WHERE id=?').run(provider_id);
    const rSid = riderSockets.get(ride.rider_id);
    if (rSid) io.to(rSid).emit('ride:accepted', { rideId: ride.id, provider_id });
    io.to(`ride:${ride.id}`).emit('ride:status', { rideId: ride.id, status: 'accepted' });
    const prov = db.prepare('SELECT * FROM providers WHERE id=?').get(provider_id);
    res.json({ success: true, provider: prov });
  });

  app.put('/api/rides/:id/start', (req, res) => {
    const ride = db.prepare('SELECT * FROM rides WHERE id=?').get(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Not found' });
    db.prepare('UPDATE rides SET status=?, started_at=CURRENT_TIMESTAMP WHERE id=?').run('in_progress', ride.id);
    io.to(`ride:${ride.id}`).emit('ride:status', { rideId: ride.id, status: 'in_progress' });
    const rSid = riderSockets.get(ride.rider_id);
    if (rSid) io.to(rSid).emit('ride:status', { rideId: ride.id, status: 'in_progress' });
    res.json({ success: true });
  });

  app.put('/api/rides/:id/complete', (req, res) => {
    const ride = db.prepare('SELECT * FROM rides WHERE id=?').get(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Not found' });
    db.prepare('UPDATE rides SET status=?, completed_at=CURRENT_TIMESTAMP WHERE id=?').run('completed', ride.id);
    db.prepare('UPDATE providers SET available=1, total_rides=total_rides+1 WHERE id=?').run(ride.provider_id);
    io.to(`ride:${ride.id}`).emit('ride:status', { rideId: ride.id, status: 'completed' });
    const rSid = riderSockets.get(ride.rider_id);
    if (rSid) io.to(rSid).emit('ride:status', { rideId: ride.id, status: 'completed' });
    res.json({ success: true });
  });

  app.put('/api/rides/:id/cancel', (req, res) => {
    const ride = db.prepare('SELECT * FROM rides WHERE id=?').get(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Not found' });
    db.prepare('UPDATE rides SET status=? WHERE id=?').run('cancelled', ride.id);
    if (ride.provider_id) db.prepare('UPDATE providers SET available=1 WHERE id=?').run(ride.provider_id);
    io.to(`ride:${ride.id}`).emit('ride:status', { rideId: ride.id, status: 'cancelled' });
    res.json({ success: true });
  });

  app.put('/api/rides/:id/rate', (req, res) => {
    const { rider_id, rating, review } = req.body;
    const ride = db.prepare('SELECT * FROM rides WHERE id=?').get(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Not found' });
    db.prepare('UPDATE rides SET rating=?, review=? WHERE id=?').run(rating, review||null, ride.id);
    db.prepare('INSERT INTO reviews (id,ride_id,provider_id,rider_id,rating,review) VALUES (?,?,?,?,?,?)').run(uuidv4(), ride.id, ride.provider_id, rider_id, rating, review||null);
    const avg = db.prepare('SELECT AVG(rating) as avg FROM reviews WHERE provider_id=?').get(ride.provider_id);
    db.prepare('UPDATE providers SET rating=? WHERE id=?').run(+(avg.avg||5).toFixed(1), ride.provider_id);
    res.json({ success: true });
  });

  app.get('/api/rides', (req, res) => {
    const { rider_id, provider_id, status } = req.query;
    let q = 'SELECT * FROM rides WHERE 1=1';
    const p = [];
    if (rider_id) { q += ' AND rider_id=?'; p.push(rider_id); }
    if (provider_id) { q += ' AND provider_id=?'; p.push(provider_id); }
    if (status) { q += ' AND status=?'; p.push(status); }
    q += ' ORDER BY created_at DESC LIMIT 50';
    const rows = db.prepare(q).all(...p);
    rows.forEach(r => {
      if (r.provider_id) r.provider = db.prepare('SELECT * FROM providers WHERE id=?').get(r.provider_id);
    });
    res.json(rows);
  });

  app.get('/api/rides/:id', (req, res) => {
    const r = db.prepare('SELECT * FROM rides WHERE id=?').get(req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    if (r.provider_id) r.provider = db.prepare('SELECT * FROM providers WHERE id=?').get(r.provider_id);
    res.json(r);
  });

  app.get('/api/users/:id', (req, res) => {
    const u = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
    u ? res.json({ id: u.id, name: u.name, phone: u.phone, email: u.email, role: u.role, emergency_contact: u.emergency_contact }) : res.status(404).json({ error: 'Not found' });
  });

  // ── SOS / Emergency ──────────────────────────────────────
  app.post('/api/sos', (req, res) => {
    const { ride_id, user_id, location } = req.body;
    const sosId = uuidv4();
    db.exec(`CREATE TABLE IF NOT EXISTS sos_alerts (
      id TEXT PRIMARY KEY, ride_id TEXT, user_id TEXT,
      lat REAL, lng REAL, status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.prepare('INSERT INTO sos_alerts (id, ride_id, user_id, lat, lng) VALUES (?,?,?,?,?)')
      .run(sosId, ride_id || null, user_id || null, location?.lat || null, location?.lng || null);

    if (ride_id) {
      const ride = db.prepare('SELECT * FROM rides WHERE id=?').get(ride_id);
      if (ride?.provider_id) {
        const sId = providerSockets.get(ride.provider_id);
        if (sId) io.to(sId).emit('sos:alert', { rideId: ride_id, sosId });
      }
      io.emit('sos:alert', { rideId: ride_id, sosId, location });
    }
    console.log(`🚨 SOS ALERT: ride=${ride_id}, user=${user_id}`);
    logEvent({ type: 'sos_alert', ride_id, user_id, location });
    res.json({ success: true, sosId, message: 'Emergency alert sent' });
  });

  // ── Ride Sharing ─────────────────────────────────────────
  app.get('/api/rides/:id/share', (req, res) => {
    const ride = db.prepare('SELECT * FROM rides WHERE id=?').get(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    const provider = ride.provider_id ? db.prepare('SELECT * FROM providers WHERE id=?').get(ride.provider_id) : null;
    res.json({
      ride: {
        id: ride.id,
        status: ride.status,
        pickup_name: ride.pickup_name,
        dropoff_name: ride.dropoff_name,
        mode: ride.mode,
        vehicle_type: ride.vehicle_type,
        price_fjd: ride.price_fjd,
        distance_km: ride.distance_km,
        created_at: ride.created_at,
        provider_name: provider?.name || 'Assigning...',
        provider_plate: provider?.vehicle_plate || '',
        provider_vehicle: provider?.vehicle_name || '',
      },
    });
  });

  // ── Decline Ride ─────────────────────────────────────────
  app.put('/api/rides/:id/decline', (req, res) => {
    const { provider_id } = req.body;
    const ride = db.prepare('SELECT * FROM rides WHERE id=?').get(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Not found' });

    db.exec(`CREATE TABLE IF NOT EXISTS ride_declines (
      id TEXT PRIMARY KEY, ride_id TEXT NOT NULL, provider_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.prepare('INSERT INTO ride_declines (id, ride_id, provider_id) VALUES (?,?,?)')
      .run(uuidv4(), ride.id, provider_id);

    if (ride.provider_id === provider_id) {
      db.prepare('UPDATE rides SET provider_id=NULL, status=? WHERE id=?').run('searching', ride.id);
      db.prepare('UPDATE providers SET available=1 WHERE id=?').run(provider_id);

      const nearest = db.prepare(`SELECT * FROM providers WHERE available=1 AND mode=? AND vehicle_type=? AND id NOT IN (SELECT provider_id FROM ride_declines WHERE ride_id=?) ORDER BY ((lat-?)*(lat-?)+(lng-?)*(lng-?)) ASC LIMIT 1`)
        .get(ride.mode, ride.vehicle_type, ride.id, ride.pickup_lat, ride.pickup_lat, ride.pickup_lng, ride.pickup_lng);
      if (nearest) {
        db.prepare('UPDATE rides SET provider_id=?, status=? WHERE id=?').run(nearest.id, 'matched', ride.id);
        db.prepare('UPDATE providers SET available=0 WHERE id=?').run(nearest.id);
        const sId = providerSockets.get(nearest.id);
        if (sId) io.to(sId).emit('ride:new', { rideId: ride.id, ...ride });
      }
    }
    res.json({ success: true });
  });

  // ── Driver Earnings ──────────────────────────────────────
  app.get('/api/providers/:id/earnings', (req, res) => {
    const provider = db.prepare('SELECT * FROM providers WHERE id=?').get(req.params.id);
    if (!provider) return res.status(404).json({ error: 'Not found' });

    const allRides = db.prepare("SELECT * FROM rides WHERE provider_id=? AND status='completed' ORDER BY completed_at DESC").all(req.params.id);

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now - 7 * 86400000).toISOString().split('T')[0];
    const monthAgo = new Date(now - 30 * 86400000).toISOString().split('T')[0];

    const todayRides = allRides.filter(r => r.completed_at?.startsWith(today));
    const weekRides = allRides.filter(r => r.completed_at >= weekAgo);
    const monthRides = allRides.filter(r => r.completed_at >= monthAgo);

    const sumEarnings = (rides) => rides.reduce((s, r) => s + (r.price_fjd || 0), 0);

    const dailyBreakdown = {};
    allRides.forEach(r => {
      const day = r.completed_at?.split('T')[0] || 'unknown';
      if (!dailyBreakdown[day]) dailyBreakdown[day] = { rides: 0, earnings: 0 };
      dailyBreakdown[day].rides++;
      dailyBreakdown[day].earnings += r.price_fjd || 0;
    });

    res.json({
      provider: { name: provider.name, vehicle_name: provider.vehicle_name, rating: provider.rating },
      summary: {
        total: { rides: allRides.length, earnings: +sumEarnings(allRides).toFixed(2) },
        today: { rides: todayRides.length, earnings: +sumEarnings(todayRides).toFixed(2) },
        week: { rides: weekRides.length, earnings: +sumEarnings(weekRides).toFixed(2) },
        month: { rides: monthRides.length, earnings: +sumEarnings(monthRides).toFixed(2) },
      },
      recentRides: allRides.slice(0, 20).map(r => ({
        id: r.id, pickup_name: r.pickup_name, dropoff_name: r.dropoff_name,
        price_fjd: r.price_fjd, distance_km: r.distance_km,
        completed_at: r.completed_at, rating: r.rating,
      })),
      dailyBreakdown: Object.entries(dailyBreakdown).slice(-30).map(([date, data]) => ({
        date, ...data, earnings: +data.earnings.toFixed(2),
      })),
    });
  });

  // ── Static ride share page ───────────────────────────────
  app.get('/ride/:id', (req, res) => {
    const ride = db.prepare('SELECT * FROM rides WHERE id=?').get(req.params.id);
    if (!ride) return res.status(404).send('Ride not found');
    const provider = ride.provider_id ? db.prepare('SELECT * FROM providers WHERE id=?').get(ride.provider_id) : null;
    res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PointBreak Rides Fiji — Ride Status</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Poppins',sans-serif;background:#fef9ef;color:#1a1a2e}
.header{background:linear-gradient(135deg,#0a1628,#0077b6,#00b4d8);padding:24px;color:#fff;text-align:center}
.header h1{font-size:1.4rem;font-weight:800}.header p{font-size:.85rem;opacity:.8;margin-top:4px}
#map{height:300px;width:100%}
.info{padding:20px;max-width:500px;margin:0 auto}
.status{display:inline-flex;align-items:center;gap:6px;padding:6px 16px;border-radius:999px;font-size:.8rem;font-weight:600;margin:12px 0}
.status-completed{background:#d1fae5;color:#059669}.status-in_progress{background:#dbeafe;color:#1d4ed8}
.status-accepted{background:#fef3c7;color:#d97706}.status-searching{background:#fee2e2;color:#dc2626}
.status-matched{background:#e0e7ff;color:#4f46e5}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:.9rem}
.row span:first-child{color:#6b7280}.row span:last-child{font-weight:600}
.footer{text-align:center;padding:20px;color:#6b7280;font-size:.8rem}
</style></head><body>
<div class="header"><h1>🏄 PointBreak Rides Fiji</h1><p>Live ride tracking</p></div>
<div id="map"></div>
<div class="info">
<div class="status status-${ride.status}">${ride.status.replace('_',' ')}</div>
<div class="row"><span>Route</span><span>${ride.pickup_name || 'Pickup'} → ${ride.dropoff_name || 'Destination'}</span></div>
<div class="row"><span>Mode</span><span>${ride.mode === 'sea' ? '🚤 Sea' : '🚗 Land'}</span></div>
<div class="row"><span>Distance</span><span>${ride.distance_km} km</span></div>
<div class="row"><span>Fare</span><span>FJD $${ride.price_fjd?.toFixed(2)}</span></div>
${provider ? `<div class="row"><span>Driver</span><span>${provider.name} (${provider.vehicle_plate})</span></div>` : ''}
<div class="row"><span>Booked</span><span>${new Date(ride.created_at).toLocaleString()}</span></div>
</div>
<div class="footer">Powered by PointBreak Rides Fiji 🏄</div>
<script>
var map=L.map('map').setView([${ride.pickup_lat},${ride.pickup_lng}],11);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{attribution:'&copy; CARTO'}).addTo(map);
L.marker([${ride.pickup_lat},${ride.pickup_lng}]).addTo(map).bindPopup('📍 Pickup').openPopup();
L.marker([${ride.dropoff_lat},${ride.dropoff_lng}]).addTo(map).bindPopup('🏁 Destination');
L.polyline([[${ride.pickup_lat},${ride.pickup_lng}],[${ride.dropoff_lat},${ride.dropoff_lng}]],{color:'#00b4d8',weight:3,dashArray:'8 4'}).addTo(map);
</script></body></html>`);
  });

  // ── Provider earnings API (public route) ─────────────────
  app.get('/api/providers/:id/stats', (req, res) => {
    const provider = db.prepare('SELECT * FROM providers WHERE id=?').get(req.params.id);
    if (!provider) return res.status(404).json({ error: 'Not found' });
    const totalRides = db.prepare("SELECT COUNT(*) as c FROM rides WHERE provider_id=? AND status='completed'").get(req.params.id).c;
    const avgRating = db.prepare("SELECT AVG(rating) as avg FROM reviews WHERE provider_id=?").get(req.params.id)?.avg || 5.0;
    const todayEarnings = db.prepare("SELECT COALESCE(SUM(price_fjd),0) as total FROM rides WHERE provider_id=? AND status='completed' AND date(completed_at)=date('now')").get(req.params.id).total;
    res.json({ total_rides: totalRides, rating: +avgRating.toFixed(1), today_earnings: +todayEarnings.toFixed(2) });
  });

  // ── Start ─────────────────────────────────────────────────
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🌴 PointBreak Rides Fiji — Server running!`);
    console.log(`\n   🌐 Web App:   http://localhost:${PORT}`);
    console.log(`   📡 API:       http://localhost:${PORT}/api`);
    console.log(`   🛡️  Security:  Helmet, rate limiting, JWT, audit logging\n`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
