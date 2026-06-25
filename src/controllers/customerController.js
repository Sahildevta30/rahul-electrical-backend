const pool = require("../config/db");

// ── Admin: Get all customers ──────────────────────────────────
exports.getAllCustomers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = "WHERE u.role = 'customer'";

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (u.name ILIKE $${params.length} OR u.phone ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
    }

    params.push(limit, offset);

    const result = await pool.query(
      `SELECT u.id, u.name, u.phone, u.email, u.created_at,
              COUNT(DISTINCT o.id) AS order_count,
              COUNT(DISTINCT sb.id) AS booking_count,
              COALESCE(SUM(o.total_amount), 0) AS total_spend
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id
       LEFT JOIN service_bookings sb ON sb.user_id = u.id
       ${where}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch customers" });
  }
};

// ── Admin: Get customer profile ───────────────────────────────
exports.getCustomerProfile = async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT id, name, phone, email, created_at FROM users WHERE id=$1",
      [req.params.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const [orders, bookings] = await Promise.all([
      pool.query(
        "SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10",
        [req.params.id]
      ),
      pool.query(
        "SELECT * FROM service_bookings WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10",
        [req.params.id]
      ),
    ]);

    res.json({
      ...user.rows[0],
      orders: orders.rows,
      bookings: bookings.rows,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch customer" });
  }
};

// ── Address management ────────────────────────────────────────
exports.getAddresses = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM addresses WHERE user_id=$1 ORDER BY is_default DESC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch addresses" });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const { label, name, phone, address, city, pincode, is_default } = req.body;

    if (is_default) {
      await pool.query(
        "UPDATE addresses SET is_default=false WHERE user_id=$1",
        [req.user.id]
      );
    }

    const result = await pool.query(
      `INSERT INTO addresses (user_id, label, name, phone, address, city, pincode, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, label, name, phone, address, city, pincode, is_default || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to add address" });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM addresses WHERE id=$1 AND user_id=$2",
      [req.params.id, req.user.id]
    );
    res.json({ message: "Address deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete address" });
  }
};
