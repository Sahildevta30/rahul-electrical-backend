const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) return null;
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
  return transporter;
}

const SHOP_NAME = "Rahul Electrical Works";
const BRAND_COLOR = "#eab308";

function wrapTemplate(title, bodyHtml) {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; background: #fff;">
    <div style="background: #111827; padding: 20px; text-align: center;">
      <span style="color: ${BRAND_COLOR}; font-size: 20px; font-weight: bold;">⚡ ${SHOP_NAME}</span>
    </div>
    <div style="padding: 24px; color: #111827;">
      <h2 style="margin-top:0;">${title}</h2>
      ${bodyHtml}
    </div>
    <div style="background: #f3f4f6; padding: 16px; text-align: center; font-size: 12px; color: #6b7280;">
      ${SHOP_NAME} · Brajrajnagar, Jharsuguda, Odisha<br/>
      📞 9124312684 / 8895626074
    </div>
  </div>`;
}

/**
 * Send an email. Never throws — logs and returns false on any failure
 * (e.g. EMAIL_USER/EMAIL_APP_PASSWORD not configured yet).
 */
async function sendEmail(to, subject, html) {
  if (!to) return false;
  const t = getTransporter();
  if (!t) {
    console.error("Email not sent: EMAIL_USER/EMAIL_APP_PASSWORD not configured.");
    return false;
  }
  try {
    await t.sendMail({
      from: `"${SHOP_NAME}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("Email send failed:", err.message);
    return false;
  }
}

// ── Templates ──────────────────────────────────────────────────

function orderConfirmationEmail({ order, items, customerName }) {
  const itemRows = items
    .map((i) => `<tr><td style="padding:6px 0;">${i.name} × ${i.quantity}</td><td style="text-align:right;">₹${(i.price * i.quantity).toFixed(2)}</td></tr>`)
    .join("");
  return wrapTemplate(
    "Order Confirmed! 🎉",
    `<p>Hi ${customerName || "there"},</p>
     <p>Thanks for your order — we've received it and will start processing shortly.</p>
     <table style="width:100%; border-collapse: collapse; margin: 16px 0;">${itemRows}
       <tr><td style="padding-top:10px; font-weight:bold; border-top:1px solid #e5e7eb;">Total</td>
           <td style="padding-top:10px; font-weight:bold; text-align:right; border-top:1px solid #e5e7eb;">₹${order.total_amount}</td></tr>
     </table>
     <p style="font-size:13px; color:#6b7280;">Order ID: ${order.id}<br/>Payment: ${order.payment_method?.toUpperCase()}</p>
     <p>We'll notify you as your order status updates. You can also check your order anytime in "My Account" on our website.</p>`
  );
}

function orderStatusUpdateEmail({ order, status, note, customerName }) {
  const statusLabels = {
    pending: "Pending", confirmed: "Confirmed", packed: "Packed",
    shipped: "Shipped / Out for Delivery", delivered: "Delivered", cancelled: "Cancelled",
  };
  return wrapTemplate(
    `Order Update: ${statusLabels[status] || status}`,
    `<p>Hi ${customerName || "there"},</p>
     <p>Your order <strong>#${String(order.id).slice(0, 8)}</strong> status has been updated to:</p>
     <p style="font-size:18px; font-weight:bold; color:${BRAND_COLOR};">${statusLabels[status] || status}</p>
     ${note ? `<p style="background:#f9fafb; padding:10px; border-radius:8px;">🚚 ${note}</p>` : ""}
     <p>Total: ₹${order.total_amount}</p>`
  );
}

function bookingConfirmationEmail({ booking, customerName }) {
  return wrapTemplate(
    "Booking Received! 🔧",
    `<p>Hi ${customerName || "there"},</p>
     <p>We've received your service booking request:</p>
     <p><strong>Service:</strong> ${booking.service_type}<br/>
        <strong>Address:</strong> ${booking.address}${booking.city ? `, ${booking.city}` : ""}<br/>
        ${booking.preferred_date ? `<strong>Preferred Date:</strong> ${booking.preferred_date}<br/>` : ""}
     </p>
     <p>We'll contact you shortly to confirm the appointment.</p>`
  );
}

function bookingStatusUpdateEmail({ booking, status, note, customerName }) {
  const statusLabels = {
    pending: "Pending", assigned: "Technician Assigned",
    in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled",
  };
  return wrapTemplate(
    `Booking Update: ${statusLabels[status] || status}`,
    `<p>Hi ${customerName || "there"},</p>
     <p>Your service booking (<strong>${booking.service_type}</strong>) status has been updated to:</p>
     <p style="font-size:18px; font-weight:bold; color:${BRAND_COLOR};">${statusLabels[status] || status}</p>
     ${note ? `<p style="background:#f9fafb; padding:10px; border-radius:8px;">🔧 ${note}</p>` : ""}`
  );
}

function newOrderOwnerNotification({ order, items, customerName, customerPhone }) {
  const itemRows = items.map((i) => `${i.name} × ${i.quantity}`).join(", ");
  return wrapTemplate(
    "🛎️ New Order Received",
    `<p>New order from <strong>${customerName || "a customer"}</strong> (${customerPhone || "no phone"}).</p>
     <p><strong>Items:</strong> ${itemRows}</p>
     <p><strong>Total:</strong> ₹${order.total_amount} (${order.payment_method?.toUpperCase()})</p>
     <p><strong>Delivery to:</strong> ${order.shipping_address}, ${order.shipping_city || ""} ${order.shipping_pincode || ""}</p>
     <p>Check the admin panel to confirm and process this order.</p>`
  );
}

function newBookingOwnerNotification({ booking, customerName, customerPhone }) {
  return wrapTemplate(
    "🛎️ New Service Booking",
    `<p>New booking from <strong>${customerName || "a customer"}</strong> (${customerPhone || "no phone"}).</p>
     <p><strong>Service:</strong> ${booking.service_type}<br/>
        <strong>Address:</strong> ${booking.address}${booking.city ? `, ${booking.city}` : ""}<br/>
        ${booking.preferred_date ? `<strong>Preferred Date:</strong> ${booking.preferred_date}<br/>` : ""}
     </p>
     <p>Check the admin panel to assign a technician.</p>`
  );
}

module.exports = {
  sendEmail,
  orderConfirmationEmail,
  orderStatusUpdateEmail,
  bookingConfirmationEmail,
  bookingStatusUpdateEmail,
  newOrderOwnerNotification,
  newBookingOwnerNotification,
};
