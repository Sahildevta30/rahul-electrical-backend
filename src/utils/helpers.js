// Generate order number: REW-YYYYMMDD-XXXX
const generateOrderNumber = () => {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `REW-${date}-${rand}`;
};

// Generate booking number: BKG-XXXXXX
const generateBookingNumber = () =>
  `BKG-${Math.floor(100000 + Math.random() * 900000)}`;

// Slugify
const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Paginate query helper
const paginate = (page = 1, limit = 20) => {
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  return { limit: l, offset: (p - 1) * l, page: p };
};

const apiResponse = (res, status, data, message = '') =>
  res.status(status).json({ success: status < 400, message, data });

const apiError = (res, status, message) =>
  res.status(status).json({ success: false, message, data: null });

module.exports = { generateOrderNumber, generateBookingNumber, slugify, paginate, apiResponse, apiError };
