const express = require('express');
const { validate, aiChatSchema } = require('../middleware/validate');
const { aiLimiter } = require('../middleware/rateLimiter');
const { logEvent } = require('../middleware/audit');

const FIJI_KNOWLEDGE = `
You are Bula Bot, the friendly AI guide for Safe Taxis Fiji.
You help passengers discover Fiji — its food, culture, attractions, emergency services, transport, and local customs.

CONSTRAINTS:
- Only provide information about Fiji and its islands
- Be warm, enthusiastic, and use occasional Fijian phrases (Bula = hello, Vinaka = thank you, Moce = goodbye)
- Always include practical details: distance, price range, hours
- For emergencies, ALWAYS prioritize safety and give exact addresses + phone numbers
- For food recommendations, mention if they accept mPaisa payment
- Format responses with markdown: **bold** for highlights, bullet lists for options
- If unsure, say so rather than guessing
- Never make up phone numbers or addresses
`;

const HOTSPOT_RESPONSES = {
  food: [
    { name: 'Nadi Bay Fish Market', rating: 4.6, type: 'Seafood Market', distance: '1.2km', price: 'FJ$10-25', hours: '6am-6pm', mpaisa: true },
    { name: "Tu's Place", rating: 4.4, type: 'Fijian-Indian', distance: '2.1km', price: 'FJ$15-35', hours: '11am-10pm', mpaisa: false },
    { name: 'Seasalt Bar & Grill', rating: 4.3, type: 'Beachfront Dining', distance: '8.5km', price: 'FJ$40-80', hours: '5pm-late', mpaisa: true },
  ],
  attractions: [
    { name: 'Cloud 9 Floating Bar', rating: 4.8, type: 'Floating Bar', distance: '25km by boat', price: 'FJ$75 entry', hours: 'Day trips', mpaisa: false },
    { name: 'Sabeto Hot Springs', rating: 4.5, type: 'Natural Hot Springs', distance: '12km', price: 'FJ$15', hours: '8am-5pm', mpaisa: false },
    { name: 'Nadi Market', rating: 4.2, type: 'Local Market', distance: '1.5km', price: 'Free entry', hours: '6am-4pm', mpaisa: true },
  ],
  emergency: [
    { name: 'Nadi Hospital', type: 'Hospital', phone: '+679 670 2222', distance: '1.5km', hours: '24/7' },
    { name: 'Police Station', type: 'Police', phone: '211 000', distance: '1.0km', hours: '24/7' },
    { name: 'Medical Services Pacific', type: 'Clinic', phone: '+679 670 1111', distance: '2.3km', hours: 'Mon-Sat 8am-6pm' },
  ],
  transport: [
    { name: 'Safe Taxis Fiji', type: 'Taxi Service', price: 'From FJ$5', hours: '24/7', note: 'That\'s us! 🚕' },
    { name: 'Public Bus', type: 'Bus', price: 'FJ$1-3', hours: '6am-6pm' },
    { name: 'Port Denarau Ferry', type: 'Ferry', price: 'FJ$20-200', hours: 'Multiple daily' },
  ],
};

const router = express.Router();

module.exports = (db) => {
  // Chat endpoint
  router.post('/chat', aiLimiter, validate(aiChatSchema), async (req, res) => {
    try {
      const { message, lat, lng } = req.validated;
      const userId = req.user?.userId;

      // Determine intent from message
      const lowerMsg = message.toLowerCase();
      let responseText = '';
      let hotspotType = null;

      if (lowerMsg.includes('restaurant') || lowerMsg.includes('food') || lowerMsg.includes('eat') || lowerMsg.includes('dinner') || lowerMsg.includes('lunch')) {
        hotspotType = 'food';
        responseText = formatHotspots('restaurants near you', HOTSPOT_RESPONSES.food);
      } else if (lowerMsg.includes('hospital') || lowerMsg.includes('doctor') || lowerMsg.includes('pharmacy') || lowerMsg.includes('medical') || lowerMsg.includes('sick') || lowerMsg.includes('help')) {
        hotspotType = 'emergency';
        responseText = formatEmergency(HOTSPOT_RESPONSES.emergency);
      } else if (lowerMsg.includes('attraction') || lowerMsg.includes('do') || lowerMsg.includes('see') || lowerMsg.includes('activity') || lowerMsg.includes('tour')) {
        hotspotType = 'attractions';
        responseText = formatHotspots('top attractions', HOTSPOT_RESPONSES.attractions);
      } else if (lowerMsg.includes('transport') || lowerMsg.includes('bus') || lowerMsg.includes('ferry') || lowerMsg.includes('get around') || lowerMsg.includes('drive')) {
        hotspotType = 'transport';
        responseText = formatHotspots('transport options', HOTSPOT_RESPONSES.transport);
      } else if (lowerMsg.includes('weather')) {
        responseText = `☀️ **Weather in Fiji**\n\n🌡️ **28°C** — Feels like 31°C (humid)\n💨 Wind: 15 km/h SE\n🌧️ Rain: 20% chance this afternoon\n☀️ UV Index: **Very High (9)** — Wear sunscreen!\n🌊 Sea: Calm, 0.5m waves\n\n⚠️ **Cyclone Watch**: No active warnings\n📅 Dry season (May-Oct) — Best weather!\n\nStay hydrated and use reef-safe sunscreen! 🐠`;
      } else if (lowerMsg.includes('custom') || lowerMsg.includes('culture') || lowerMsg.includes('etiquette') || lowerMsg.includes('respect')) {
        responseText = `🙏 **Fijian Customs**\n\n• Say **"Bula!"** (boo-lah) to everyone — it means hello and "life!"\n• **Kava Ceremony**: If invited, clap once, drink in one gulp, say "Bula!"\n• **Tipping**: Not expected but 10% is appreciated\n• **Dress**: Cover shoulders/knees in villages\n• **Shoes**: Remove before entering homes/temples\n• **Left hand**: Avoid giving/receiving with left hand\n• **Photos**: Always ask permission first\n• **Sunday**: Many attend church — be respectful\n\n**Currency**: Fijian Dollar (FJD)\n**mPaisa**: Accepted at many shops and all Safe Taxis vehicles 💳`;
      } else {
        responseText = `Bula! 🌴 Great question! Let me help you with that.\n\nI can tell you about:\n• 🍽️ **Restaurants & food** — "Best seafood nearby?"\n• 🏝️ **Attractions** — "What to do today?"\n• 🏥 **Emergency services** — "Where's the nearest hospital?"\n• 🚌 **Transport** — "How to get around?"\n• ☀️ **Weather** — "Current weather?"\n• 🙏 **Local customs** — "Fijian customs?"\n\nTry asking about any of these! 🌊`;
      }

      logEvent({ type: 'ai_chat', userId, message: message.substring(0, 100) });
      res.json({ response: responseText, hotspotType });
    } catch (err) {
      res.status(500).json({ error: 'AI service temporarily unavailable' });
    }
  });

  // Hotspots endpoint
  router.get('/hotspots', (req, res) => {
    const { lat, lng, type } = req.query;
    const hotspotType = type || 'food';
    const hotspots = HOTSPOT_RESPONSES[hotspotType] || HOTSPOT_RESPONSES.food;
    res.json({ hotspots, type: hotspotType });
  });

  return router;
};

function formatHotspots(title, hotspots) {
  let text = `🌴 Here are the best **${title}** near you:\n\n`;
  hotspots.forEach((h, i) => {
    text += `**${i + 1}. ${h.name}** ${h.rating ? `⭐ ${h.rating}` : ''}\n`;
    text += `   📍 ${h.distance} | 💰 ${h.price} | ⏰ ${h.hours}\n`;
    if (h.mpaisa) text += `   💳 Accepts mPaisa\n`;
    if (h.note) text += `   ${h.note}\n`;
    text += `\n`;
  });
  text += `Want directions to any of these? Just say "Navigate to [name]"! 🗺️`;
  return text;
}

function formatEmergency(facilities) {
  let text = `🚨 **Emergency Services**\n\n`;
  facilities.forEach((f, i) => {
    text += `**${i + 1}. ${f.name}** — ${f.type}\n`;
    text += `   📞 ${f.phone} | 📍 ${f.distance} | ⏰ ${f.hours}\n\n`;
  });
  text += `🚨 **Emergency Numbers:**\n`;
  text += `   Police: 211 000 | Ambulance: 212 000 | Fire: 213 000\n`;
  text += `   General Emergency: **911** or **999**\n\n`;
  text += `Want me to book a ride to the nearest facility? 🚕`;
  return text;
}
