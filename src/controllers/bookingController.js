const pool = require("../config/db");

const SERVICE_TYPES = [
  "Motor Rewinding",
  "Transformer Repair",
  "House Wiring",
  "Pump Installation",
  "Fan Repair",
  "Industrial Maintenance",
  "Other",
];

// ── Create booking ────────────────────────────────────────────
exports.createBooking = async (req, res) => {
  try {
    const {
      service_type, description, address, city,
      pincode, preferred_date, preferred_time,
    } = req.body;

    if (!service_type || !address) {
      return res.status(400).json({ message: "Service type and address required" });
    }

    const result = await pool.query(
      `INSERT INTO service_bookings
        (user_id, service_type, description, address, city, pincode, preferred_date, preferred_time)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [req.user.id, service_type, description, address, city, pincode, preferred_date, preferred_time]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create booking" });
  }
};

// ── Get my bookings ───────────────────────────────────────────
exports.getMyBookings = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM service_bookings WHERE user_id=$1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

// ── Admin: Get all bookings ───────────────────────────────────
exports.getAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = "";

    if (status) {
      params.push(status);
      where = `WHERE sb.status = $${params.length}`;
    }

    params.push(limit, offset);

    const result = await pool.query(
      `SELECT sb.*, u.name AS customer_name, u.phone AS customer_phone, u.email AS customer_email,
              t.name AS technician_name
       FROM service_bookings sb
       LEFT JOIN users u ON u.id = sb.user_id
       LEFT JOIN users t ON t.id = sb.assigned_technician
       ${where}
       ORDER BY sb.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

// ── Admin: Update booking status ──────────────────────────────
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, admin_notes, assigned_technician } = req.body;
    const validStatuses = ["pending", "assigned", "in_progress", "completed", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const result = await pool.query(
      `UPDATE service_bookings
       SET status=$1, admin_notes=COALESCE($2,admin_notes),
           assigned_technician=COALESCE($3,assigned_technician), updated_at=NOW()
       WHERE id=$4 RETURNING *`,
      [status, admin_notes, assigned_technician, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to update booking" });
  }
};

// ── Get service types ─────────────────────────────────────────
exports.getServiceTypes = async (req, res) => {
  res.json(SERVICE_TYPES);
};
