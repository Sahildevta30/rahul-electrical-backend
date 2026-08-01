// Transactional SMS for order/booking status updates via 2Factor.in.
//
// IMPORTANT — requires DLT registration on 2factor.in before this works:
//   1. Register your Entity (business PAN/GST) on 2Factor's DLT section
//   2. Register a Sender ID (6 letters, e.g. RAHULE)
//   3. Register the exact message template(s) below and get them approved
//   4. Add SMS_SENDER_ID env var on Render with your approved sender ID
//
// Until DLT is approved, sendSMS() will fail gracefully (logs + returns
// false) and never breaks order/booking creation or status updates.

/**
 * Send a transactional SMS. Never throws — logs and returns false on any
 * failure (e.g. OTP_API_KEY/SMS_SENDER_ID not configured, or DLT template
 * not yet approved).
 */
async function sendSMS(phone, message) {
  if (!phone) return false;

  if (process.env.NODE_ENV !== "production") {
    console.log(`📱 [DEV SMS to ${phone}]: ${message}`);
    return true;
  }

  if (!process.env.OTP_API_KEY || !process.env.SMS_SENDER_ID) {
    console.error("SMS not sent: OTP_API_KEY/SMS_SENDER_ID not configured.");
    return false;
  }

  try {
    const url = `https://2factor.in/API/V1/${process.env.OTP_API_KEY}/ADDON_SERVICES/SEND/TSMS?From=${process.env.SMS_SENDER_ID}&To=${phone}&Msg=${encodeURIComponent(message)}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.Status !== "Success") {
      console.error("SMS send failed: 2Factor.in response:", data);
      return false;
    }
    return true;
  } catch (err) {
    console.error("SMS send failed:", err.message);
    return false;
  }
}

// ── Message builders (keep text SHORT and matching your DLT-approved template exactly) ──

function orderStatusSMS({ orderId, status, note }) {
  const shortId = String(orderId).slice(0, 8);
  const statusLabels = {
    pending: "received", confirmed: "confirmed", packed: "packed",
    shipped: "shipped", delivered: "delivered", cancelled: "cancelled",
  };
  let msg = `Rahul Electrical Works: Your order #${shortId} is now ${statusLabels[status] || status}.`;
  if (note) msg += ` ${note}`;
  msg += ` Track at our website.`;
  return msg;
}

function bookingStatusSMS({ serviceType, status, note }) {
  const statusLabels = {
    pending: "received", assigned: "technician assigned",
    in_progress: "in progress", completed: "completed", cancelled: "cancelled",
  };
  let msg = `Rahul Electrical Works: Your booking (${serviceType}) is now ${statusLabels[status] || status}.`;
  if (note) msg += ` ${note}`;
  return msg;
}

module.exports = { sendSMS, orderStatusSMS, bookingStatusSMS };
