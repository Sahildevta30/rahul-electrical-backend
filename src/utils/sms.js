// Transactional SMS for order/booking status updates via 2Factor.in.
//
// IMPORTANT — requires DLT registration + approved templates on 2factor.in.
// Approved template (Order): "Dear Customer, Rahul Electrical Works confirms
// your order with Order ID #VAR1#. Your order status is #VAR2#. Thank you
// for choosing Rahul Electrical Works."
// The message sent MUST match the approved template text exactly (only the
// #VAR#-marked parts change), or 2Factor will reject the send.

/**
 * Send a transactional SMS via 2Factor.in's TRANS_SMS module.
 * Never throws — logs and returns false on any failure (e.g. missing
 * config, or template/sender not yet approved).
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

  // Normalize to 10-digit local number with 91 prefix, as 2Factor expects.
  const digits = String(phone).replace(/\D/g, "");
  const local10 = digits.length > 10 ? digits.slice(-10) : digits;
  const to = `91${local10}`;

  try {
    const body = new URLSearchParams({
      module: "TRANS_SMS",
      apikey: process.env.OTP_API_KEY,
      to,
      from: process.env.SMS_SENDER_ID,
      msg: message,
    });

    const response = await fetch("https://2factor.in/API/R1/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const data = await response.json();
    if (data.Status !== "Success") {
      console.error("SMS send failed: 2Factor.in response:", data);
      return false;
    }
    console.log(`SMS accepted by 2Factor.in — Details/SessionID: ${data.Details}, to: ${to}`);
    return true;
  } catch (err) {
    console.error("SMS send failed:", err.message);
    return false;
  }
}

// ── Message builders — text MUST exactly match the DLT-approved template ──

function orderStatusSMS({ orderId, status }) {
  const shortId = String(orderId).slice(0, 8);
  const statusLabels = {
    pending: "Received", confirmed: "Confirmed", packed: "Packed",
    shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
  };
  return `Dear Customer, Rahul Electrical Works confirms your order with Order ID ${shortId}. Your order status is ${statusLabels[status] || status}. Thank you for choosing Rahul Electrical Works.`;
}

function bookingStatusSMS({ serviceType, status }) {
  const statusLabels = {
    pending: "Received", assigned: "Technician Assigned",
    in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled",
  };
  // NOTE: This uses the SAME approved template pattern as orders for now
  // (Order ID slot repurposed as service type). Once a dedicated booking
  // template is approved, update this to match its exact text.
  return `Dear Customer, Rahul Electrical Works confirms your order with Order ID ${serviceType}. Your order status is ${statusLabels[status] || status}. Thank you for choosing Rahul Electrical Works.`;
}

module.exports = { sendSMS, orderStatusSMS, bookingStatusSMS };
