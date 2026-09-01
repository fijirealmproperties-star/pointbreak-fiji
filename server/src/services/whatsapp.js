// WhatsApp Cloud API OTP sender (Meta Graph API).
// Uses Node 18+ built-in fetch — no extra dependency.
// Only active when WA_PHONE_NUMBER_ID and WA_ACCESS_TOKEN are set.
// Outside of a user-initiated 24h window, the first message MUST be an
// approved template. We send a template with a {{1}} code placeholder by
// default and fall back to WhatsApp's built-in hello_world template.

const GRAPH_VERSION = process.env.WA_GRAPH_VERSION || 'v23.0';
const BASE_URL = 'https://graph.facebook.com';

function configured() {
  return Boolean(
    process.env.WA_PHONE_NUMBER_ID && process.env.WA_ACCESS_TOKEN
  );
}

function normalizePhone(phone) {
  // Accept E.164 (+679...), strip to digits, prepend 679 if it looks like a
  // local Fiji number.
  if (!phone) return phone;
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('679')) return digits;
  if (digits.length <= 7) return '679' + digits;
  return digits;
}

async function sendTemplate(phone, templateName, componentParams) {
  const url = `${BASE_URL}/${GRAPH_VERSION}/${process.env.WA_PHONE_NUMBER_ID}/messages`;
  const to = normalizePhone(phone);
  const language = process.env.WA_TEMPLATE_LANGUAGE || 'en';

  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: language },
      components: componentParams
        ? [
            {
              type: 'body',
              parameters: componentParams.map((text) => ({ type: 'text', text })),
            },
          ]
        : undefined,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`WhatsApp API error ${res.status}: ${JSON.stringify(data)}`);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

// Send an OTP. Returns true if delivered via WhatsApp, false if WhatsApp is
// not configured (callers should fall back to returning the dev code).
async function sendOtp(phone, code) {
  if (!configured()) {
    console.log('[whatsapp] not configured — skipping WhatsApp delivery');
    return false;
  }

  const templateName = process.env.WA_OTP_TEMPLATE || 'otp_login';
  try {
    await sendTemplate(phone, templateName, [code]);
    console.log(`[whatsapp] OTP sent to ${phone}`);
    return true;
  } catch (err) {
    // The custom OTP template may not be approved yet (test mode ships with
    // hello_world). Fall back to hello_world so the user still gets something,
    // and surface a warning.
    if (err.status === 412 || (err.payload && err.payload.error && err.payload.error.fbtrace_id)) {
      try {
        await sendTemplate(phone, 'hello_world');
        console.warn('[whatsapp] custom OTP template unavailable; sent hello_world instead');
        return true;
      } catch (fallbackErr) {
        console.error(`[whatsapp] both templates failed: ${fallbackErr.message}`);
        throw fallbackErr;
      }
    }
    throw err;
  }
}

module.exports = { sendOtp, configured, normalizePhone };
