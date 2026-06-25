const pool = require("../config/db");

// ── Create order ──────────────────────────────────────────────
exports.createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      items,                 // [{product_id, quantity}]
      payment_method = "cod",
      shipping_name,
      shipping_phone,
      shipping_address,
      shipping_city,
      shipping_pincode,
      notes,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in order" });
    }

    // Verify stock and calculate total
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await client.query(
        "SELECT id, name, price, stock FROM products WHERE id=$1 AND is_active=true",
        [item.product_id]
      );

      if (product.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: `Product ${item.product_id} not found` });
      }

      const p = product.rows[0];
      if (p.stock < item.quantity) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: `Insufficient stock for ${p.name}` });
      }

      total += p.price * item.quantity;
      orderItems.push({ ...item, price: p.price, name: p.name });
    }

    // Create order
    const order = await client.query(
      `INSERT INTO orders
        (user_id, total_amount, payment_method, shipping_name, shipping_phone,
         shipping_address, shipping_city, shipping_pincode, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        req.user.id, total, payment_method,
        shipping_name, shipping_phone, shipping_address,
        shipping_city, shipping_pincode, notes,
      ]
    );

    const orderId = order.rows[0].id;

    // Insert order items and decrement stock
    for (const item of orderItems) {
      await client.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1,$2,$3,$4)",
        [orderId, item.product_id, item.quantity, item.price]
      );
      await client.query(
        "UPDATE products SET stock = stock - $1 WHERE id=$2",
        [item.quantity, item.product_id]
      );
    }

    // Initial status history
    await client.query(
      "INSERT INTO order_status_history (order_id, status, note) VALUES ($1,$2,$3)",
      [orderId, "pending", "Order placed"]
    );

    await client.query("COMMIT");
    res.status(201).json({ order: order.rows[0], items: orderItems });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Failed to create order" });
  } finally {
    client.release();
  }
};

// ── Get my orders ─────────────────────────────────────────────
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await pool.query(
      `SELECT o.*,
              JSON_AGG(JSON_BUILD_OBJECT(
                'id', oi.id, 'product_id', oi.product_id, 'quantity', oi.quantity,
                'price', oi.price, 'name', p.name, 'image_url', p.image_url
              )) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(orders.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// ── Get single order ──────────────────────────────────────────
exports.getOrder = async (req, res) => {
  try {
    const order = await pool.query(
      `SELECT o.*,
              JSON_AGG(JSON_BUILD_OBJECT(
                'id', oi.id, 'product_id', oi.product_id, 'quantity', oi.quantity,
                'price', oi.price, 'name', p.name, 'image_url', p.image_url
              )) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE o.id = $1 AND (o.user_id = $2 OR $3 = 'admin')
       GROUP BY o.id`,
      [req.params.id, req.user.id, req.user.role]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const history = await pool.query(
      "SELECT * FROM order_status_history WHERE order_id=$1 ORDER BY created_at ASC",
      [req.params.id]
    );

    res.json({ ...order.rows[0], history: history.rows });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

// ── Admin: Get all orders ─────────────────────────────────────
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [limit, offset];
    let where = "";

    if (status) {
      params.unshift(status);
      where = "WHERE o.order_status = $1";
    }

    const orders = await pool.query(
      `SELECT o.*, u.name AS customer_name, u.phone AS customer_phone,
              COUNT(oi.id) AS item_count
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       ${where}
       GROUP BY o.id, u.name, u.phone
       ORDER BY o.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json(orders.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// ── Admin: Update order status ────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ["pending","confirmed","packed","shipped","delivered","cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const result = await pool.query(
      "UPDATE orders SET order_status=$1, updated_at=NOW() WHERE id=$2 RETURNING *",
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    await pool.query(
      "INSERT INTO order_status_history (order_id, status, note, updated_by) VALUES ($1,$2,$3,$4)",
      [req.params.id, status, note, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to update order" });
  }
};

// ── Admin: Dashboard stats ────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const [products, orders, revenue, bookings, lowStock, recentOrders, recentBookings] =
      await Promise.all([
        pool.query("SELECT COUNT(*) FROM products WHERE is_active=true"),
        pool.query("SELECT COUNT(*) FROM orders"),
        pool.query("SELECT COALESCE(SUM(total_amount),0) AS total FROM orders WHERE payment_status='paid'"),
        pool.query("SELECT COUNT(*) FROM service_bookings"),
        pool.query(
          `SELECT COUNT(*) FROM products p
           LEFT JOIN inventory i ON i.product_id = p.id
           WHERE p.stock <= COALESCE(i.min_stock, 10) AND p.is_active=true`
        ),
        pool.query(
          `SELECT o.id, o.total_amount, o.order_status, o.created_at,
                  u.name AS customer_name
           FROM orders o LEFT JOIN users u ON u.id=o.user_id
           ORDER BY o.created_at DESC LIMIT 5`
        ),
        pool.query(
          `SELECT sb.*, u.name AS customer_name, u.phone AS customer_phone
           FROM service_bookings sb LEFT JOIN users u ON u.id=sb.user_id
           ORDER BY sb.created_at DESC LIMIT 5`
        ),
      ]);

    res.json({
      total_products: parseInt(products.rows[0].count),
      total_orders: parseInt(orders.rows[0].count),
      total_revenue: parseFloat(revenue.rows[0].total),
      total_bookings: parseInt(bookings.rows[0].count),
      low_stock_count: parseInt(lowStock.rows[0].count),
      recent_orders: recentOrders.rows,
      recent_bookings: recentBookings.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};
