const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER || 'noreply@pointbreakfiji.com';
const FROM_NAME = process.env.FROM_NAME || 'PointBreak Rides Fiji';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!SMTP_USER || !SMTP_PASS) {
    console.log('[Email] SMTP not configured — emails will be logged to console');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

async function sendEmail(to, subject, html) {
  const transport = getTransporter();
  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject,
    html,
  };

  if (!transport) {
    console.log(`[Email LOG] To: ${to} | Subject: ${subject}`);
    console.log(`[Email LOG] Body preview: ${html.replace(/<[^>]+>/g, '').substring(0, 120)}...`);
    return { logged: true };
  }

  try {
    const result = await transport.sendMail(mailOptions);
    console.log(`[Email] Sent to ${to} — MessageID: ${result.messageId}`);
    return { sent: true, messageId: result.messageId };
  } catch (err) {
    console.error(`[Email] Failed to send to ${to}:`, err.message);
    return { sent: false, error: err.message };
  }
}

function driverApprovedEmail(name, vehicleType, vehiclePlate) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:'Segoe UI',Tahoma,sans-serif">
<div style="max-width:480px;margin:0 auto;background:#111827;border-radius:16px;overflow:hidden;margin-top:20px;margin-bottom:20px;border:1px solid #2a3454">

  <div style="background:linear-gradient(135deg,#0077b6,#00b4d8);padding:30px;text-align:center">
    <div style="font-size:2.5rem;margin-bottom:8px">🚗</div>
    <h1 style="color:#fff;font-size:1.3rem;margin:0">Application Approved!</h1>
  </div>

  <div style="padding:30px">
    <p style="color:#e2e8f0;font-size:.95rem;line-height:1.6">
      Bula <b>${name}</b>! 🎉
    </p>
    <p style="color:#8892b0;font-size:.88rem;line-height:1.6">
      Great news! Your driver application for <b style="color:#00b4d8">PointBreak Rides Fiji</b> has been <b style="color:#10b981">approved</b> by our admin team.
    </p>

    <div style="background:#1a2236;border-radius:10px;padding:16px;margin:20px 0;border:1px solid #2a3454">
      <table style="width:100%;font-size:.82rem;color:#8892b0">
        <tr><td style="padding:4px 0">Vehicle Type</td><td style="text-align:right;color:#e2e8f0;font-weight:600">${vehicleType}</td></tr>
        <tr><td style="padding:4px 0">Plate Number</td><td style="text-align:right;color:#00b4d8;font-weight:600">${vehiclePlate}</td></tr>
        <tr><td style="padding:4px 0">Status</td><td style="text-align:right;color:#10b981;font-weight:600">✅ Active</td></tr>
      </table>
    </div>

    <p style="color:#8892b0;font-size:.85rem;line-height:1.6">
      You can now log in to the PointBreak app and start accepting rides. Make sure your vehicle is ready and your documents are up to date.
    </p>

    <div style="text-align:center;margin:24px 0">
      <a href="http://localhost:3001" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#0077b6,#00b4d8);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:.9rem">Open PointBreak App →</a>
    </div>

    <hr style="border:0;border-top:1px solid #2a3454;margin:20px 0">

    <p style="color:#8892b0;font-size:.75rem;text-align:center;line-height:1.5">
      PointBreak Rides Fiji 🏝️<br>
      Island transport reimagined for the Pacific<br>
      <a href="mailto:support@pointbreakfiji.com" style="color:#00b4d8">support@pointbreakfiji.com</a>
    </p>
  </div>
</div>
</body>
</html>`;
}

function driverRejectedEmail(name, reason) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:'Segoe UI',Tahoma,sans-serif">
<div style="max-width:480px;margin:0 auto;background:#111827;border-radius:16px;overflow:hidden;margin-top:20px;margin-bottom:20px;border:1px solid #2a3454">

  <div style="background:linear-gradient(135deg,#7f1d1d,#ef4444);padding:30px;text-align:center">
    <div style="font-size:2.5rem;margin-bottom:8px">📋</div>
    <h1 style="color:#fff;font-size:1.3rem;margin:0">Application Update</h1>
  </div>

  <div style="padding:30px">
    <p style="color:#e2e8f0;font-size:.95rem;line-height:1.6">
      Bula <b>${name}</b>,
    </p>
    <p style="color:#8892b0;font-size:.88rem;line-height:1.6">
      Thank you for applying to drive with <b style="color:#00b4d8">PointBreak Rides Fiji</b>. After reviewing your application, we're unable to approve it at this time.
    </p>

    ${reason ? `
    <div style="background:#1a2236;border-radius:10px;padding:16px;margin:20px 0;border:1px solid #2a3454">
      <p style="color:#ef4444;font-size:.8rem;font-weight:600;margin:0 0 4px">Reason:</p>
      <p style="color:#8892b0;font-size:.85rem;margin:0;line-height:1.5">${reason}</p>
    </div>` : ''}

    <p style="color:#8892b0;font-size:.85rem;line-height:1.6">
      You may reapply once you've addressed the issue above. If you believe this is an error, please contact our support team.
    </p>

    <div style="text-align:center;margin:24px 0">
      <a href="mailto:support@pointbreakfiji.com" style="display:inline-block;padding:12px 32px;background:rgba(0,180,216,0.15);color:#00b4d8;text-decoration:none;border-radius:8px;font-weight:600;font-size:.9rem;border:1px solid rgba(0,180,216,0.3)">Contact Support</a>
    </div>

    <hr style="border:0;border-top:1px solid #2a3454;margin:20px 0">

    <p style="color:#8892b0;font-size:.75rem;text-align:center;line-height:1.5">
      PointBreak Rides Fiji 🏝️<br>
      Island transport reimagined for the Pacific<br>
      <a href="mailto:support@pointbreakfiji.com" style="color:#00b4d8">support@pointbreakfiji.com</a>
    </p>
  </div>
</div>
</body>
</html>`;
}

module.exports = { sendEmail, driverApprovedEmail, driverRejectedEmail };
