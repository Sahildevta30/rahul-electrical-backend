const pool = require("../config/db");

// ── Get inventory with stock status ──────────────────────────
exports.getInventory = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.sku, p.stock, p.image_url,
              c.name AS category_name,
              i.min_stock,
              CASE
                WHEN p.stock = 0 THEN 'out_of_stock'
                WHEN p.stock <= COALESCE(i.min_stock, 10) THEN 'low_stock'
                ELSE 'in_stock'
              END AS stock_status
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN inventory i ON i.product_id = p.id
       WHERE p.is_active = true
       ORDER BY p.stock ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch inventory" });
  }
};

// ── Update stock ──────────────────────────────────────────────
exports.updateStock = async (req, res) => {
  try {
    const { stock, min_stock } = req.body;
    const { id } = req.params;

    if (stock !== undefined) {
      await pool.query(
        "UPDATE products SET stock=$1, updated_at=NOW() WHERE id=$2",
        [stock, id]
      );
    }

    if (min_stock !== undefined) {
      await pool.query(
        `INSERT INTO inventory (product_id, min_stock)
         VALUES ($1,$2)
         ON CONFLICT (product_id) DO UPDATE SET min_stock=$2, updated_at=NOW()`,
        [id, min_stock]
      );
    }

    res.json({ message: "Stock updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update stock" });
  }
};
