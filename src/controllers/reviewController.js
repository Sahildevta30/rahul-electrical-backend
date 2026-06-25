const pool = require("../config/db");

// ── Create review ─────────────────────────────────────────────
exports.createReview = async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;

    if (!product_id || !rating) {
      return res.status(400).json({ message: "Product and rating required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be 1-5" });
    }

    // Check if user already reviewed this product
    const exists = await pool.query(
      "SELECT id FROM reviews WHERE user_id=$1 AND product_id=$2",
      [req.user.id, product_id]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({ message: "You already reviewed this product" });
    }

    const result = await pool.query(
      "INSERT INTO reviews (user_id, product_id, rating, comment) VALUES ($1,$2,$3,$4) RETURNING *",
      [req.user.id, product_id, rating, comment]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to create review" });
  }
};

// ── Admin: Get all reviews ────────────────────────────────────
exports.getAllReviews = async (req, res) => {
  try {
    const { approved } = req.query;
    const params = [];
    let where = "";

    if (approved !== undefined) {
      params.push(approved === "true");
      where = `WHERE r.approved=$1`;
    }

    const result = await pool.query(
      `SELECT r.*, u.name AS user_name, p.name AS product_name
       FROM reviews r
       LEFT JOIN users u ON u.id=r.user_id
       LEFT JOIN products p ON p.id=r.product_id
       ${where}
       ORDER BY r.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

// ── Admin: Approve / hide / delete review ─────────────────────
exports.moderateReview = async (req, res) => {
  try {
    const { action } = req.body; // "approve" | "hide" | "delete"

    if (action === "delete") {
      await pool.query("DELETE FROM reviews WHERE id=$1", [req.params.id]);
      return res.json({ message: "Review deleted" });
    }

    const approved = action === "approve";
    const result = await pool.query(
      "UPDATE reviews SET approved=$1 WHERE id=$2 RETURNING *",
      [approved, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to moderate review" });
  }
};
