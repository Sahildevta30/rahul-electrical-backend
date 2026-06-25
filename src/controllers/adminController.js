const { query } = require('../config/db');
const { apiResponse, apiError } = require('../utils/helpers');

// GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  const [products, orders, bookings, revenue, lowStock, customers, recentOrders, recentBookings] = await Promise.all([
    query('SELECT COUNT(*) FROM products WHERE is_active=true'),
    query('SELECT COUNT(*) FROM orders'),
    query("SELECT COUNT(*) FROM service_bookings WHERE status NOT IN ('completed','cancelled')"),
    query("SELECT COALESCE(SUM(total_amount),0) AS total FROM orders WHERE payment_status='paid' OR payment_method='cod'"),
    query('SELECT COUNT(*) FROM products WHERE stock <= min_stock AND is_active=true'),
    query('SELECT COUNT(*) FROM users WHERE role=\'customer\''),
    query(`SELECT o.*, u.name AS customer_name, u.phone AS customer_phone
           FROM orders o LEFT JOIN users u ON o.user_id=u.id
           ORDER BY o.created_at DESC LIMIT 5`),
    query(`SELECT * FROM service_bookings WHERE status NOT IN ('completed','cancelled')
           ORDER BY created_at DESC LIMIT 5`),
  ]);

  return apiResponse(res, 200, {
    stats: {
      total_products:  parseInt(products.rows[0].count),
      total_orders:    parseInt(orders.rows[0].count),
      active_bookings: parseInt(bookings.rows[0].count),
      total_revenue:   parseFloat(revenue.rows[0].total),
      low_stock_items: parseInt(lowStock.rows[0].count),
      total_customers: parseInt(customers.rows[0].count),
    },
    recent_orders:   recentOrders.rows,
    recent_bookings: recentBookings.rows,
  });
};

// GET /api/admin/customers
exports.getCustomers = async (req, res) => {
  const result = await query(`
    SELECT u.id, u.name, u.phone, u.email, u.created_at,
      COUNT(DISTINCT o.id) AS order_count,
      COUNT(DISTINCT b.id) AS booking_count,
      COALESCE(SUM(o.total_amount),0) AS total_spend
    FROM users u
    LEFT JOIN orders o ON o.user_id=u.id
    LEFT JOIN service_bookings b ON b.user_id=u.id
    WHERE u.role='customer'
    GROUP BY u.id ORDER BY u.created_at DESC`);
  return apiResponse(res, 200, result.rows);
};

// GET /api/admin/customers/:id
exports.getCustomer = async (req, res) => {
  const user = await query('SELECT id,name,phone,email,created_at FROM users WHERE id=$1', [req.params.id]);
  if (!user.rows.length) return apiError(res, 404, 'Customer not found');
  const orders = await query('SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC', [req.params.id]);
  const bookings = await query('SELECT * FROM service_bookings WHERE user_id=$1 ORDER BY created_at DESC', [req.params.id]);
  return apiResponse(res, 200, { ...user.rows[0], orders: orders.rows, bookings: bookings.rows });
};

// GET /api/admin/inventory
exports.getInventory = async (req, res) => {
  const result = await query(`
    SELECT p.id, p.name, p.sku, p.stock, p.min_stock, c.name AS category,
      CASE
        WHEN p.stock = 0 THEN 'out_of_stock'
        WHEN p.stock <= p.min_stock THEN 'low_stock'
        ELSE 'in_stock'
      END AS stock_status
    FROM products p
    LEFT JOIN categories c ON p.category_id=c.id
    WHERE p.is_active=true ORDER BY p.stock ASC`);
  return apiResponse(res, 200, result.rows);
};

// PUT /api/admin/inventory/:id
exports.updateStock = async (req, res) => {
  const { stock, min_stock } = req.body;
  const result = await query(
    'UPDATE products SET stock=COALESCE($1,stock), min_stock=COALESCE($2,min_stock) WHERE id=$3 RETURNING id,name,stock,min_stock',
    [stock, min_stock, req.params.id]);
  if (!result.rows.length) return apiError(res, 404, 'Product not found');
  return apiResponse(res, 200, result.rows[0], 'Stock updated');
};

// GET /api/admin/revenue  (monthly chart data)
exports.getRevenue = async (req, res) => {
  const result = await query(`
    SELECT TO_CHAR(created_at,'YYYY-MM') AS month,
      COUNT(*) AS order_count,
      SUM(total_amount) AS revenue
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '12 months'
    GROUP BY month ORDER BY month ASC`);
  return apiResponse(res, 200, result.rows);
};
