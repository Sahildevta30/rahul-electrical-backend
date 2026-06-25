const pool = require("../config/db");
const slugify = require("../utils/slug");
const { cloudinary } = require("../config/cloudinary");

// ── Get all products (with filters) ──────────────────────────
exports.getProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      min_price,
      max_price,
      sort = "created_at",
      order = "DESC",
      page = 1,
      limit = 20,
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = ["p.is_active = true"];
    const params = [];

    if (category) {
      params.push(category);
      conditions.push(`c.slug = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
    }
    if (min_price) {
      params.push(min_price);
      conditions.push(`p.price >= $${params.length}`);
    }
    if (max_price) {
      params.push(max_price);
      conditions.push(`p.price <= $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const allowedSort = ["price", "name", "created_at", "stock"];
    const sortCol = allowedSort.includes(sort) ? `p.${sort}` : "p.created_at";
    const sortDir = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    params.push(limit, offset);

    const query = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug,
             COALESCE(AVG(r.rating), 0)::NUMERIC(3,1) AS avg_rating,
             COUNT(r.id) AS review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN reviews r ON r.product_id = p.id AND r.approved = true
      ${where}
      GROUP BY p.id, c.name, c.slug
      ORDER BY ${sortCol} ${sortDir}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const countQuery = `
      SELECT COUNT(*) FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${where}
    `;

    const [products, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2)),
    ]);

    res.json({
      products: products.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// ── Get single product by slug ────────────────────────────────
exports.getProductBySlug = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
              COALESCE(AVG(r.rating),0)::NUMERIC(3,1) AS avg_rating,
              COUNT(r.id) AS review_count
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN reviews r ON r.product_id = p.id AND r.approved = true
       WHERE p.slug = $1 AND p.is_active = true
       GROUP BY p.id, c.name, c.slug`,
      [req.params.slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get reviews
    const reviews = await pool.query(
      `SELECT r.*, u.name AS user_name FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1 AND r.approved = true
       ORDER BY r.created_at DESC LIMIT 10`,
      [result.rows[0].id]
    );

    res.json({ ...result.rows[0], reviews: reviews.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

// ── Admin: Create product ─────────────────────────────────────
exports.createProduct = async (req, res) => {
  try {
    const {
      name, category_id, description, specifications,
      sku, brand, price, stock, meta_title, meta_description,
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price required" });
    }

    let slug = slugify(name);
    // Ensure unique slug
    const existing = await pool.query("SELECT id FROM products WHERE slug LIKE $1", [`${slug}%`]);
    if (existing.rows.length > 0) slug = `${slug}-${existing.rows.length}`;

    const image_url = req.file ? req.file.path : null;

    const result = await pool.query(
      `INSERT INTO products
        (name, slug, category_id, description, specifications, sku, brand,
         price, stock, image_url, meta_title, meta_description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        name, slug, category_id, description,
        specifications ? JSON.stringify(specifications) : "{}",
        sku, brand, price, stock || 0,
        image_url, meta_title, meta_description,
      ]
    );

    // Auto-create inventory record
    await pool.query(
      "INSERT INTO inventory (product_id) VALUES ($1) ON CONFLICT DO NOTHING",
      [result.rows[0].id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create product" });
  }
};

// ── Admin: Update product ─────────────────────────────────────
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, category_id, description, specifications,
      sku, brand, price, stock, is_active, meta_title, meta_description,
    } = req.body;

    const image_url = req.file ? req.file.path : undefined;

    const fields = [];
    const values = [];
    let idx = 1;

    const set = (col, val) => {
      if (val !== undefined) {
        fields.push(`${col}=$${idx++}`);
        values.push(val);
      }
    };

    set("name", name);
    set("category_id", category_id);
    set("description", description);
    set("specifications", specifications ? JSON.stringify(specifications) : undefined);
    set("sku", sku);
    set("brand", brand);
    set("price", price);
    set("stock", stock);
    set("is_active", is_active);
    set("image_url", image_url);
    set("meta_title", meta_title);
    set("meta_description", meta_description);

    if (name) {
      fields.push(`slug=$${idx++}`);
      values.push(slugify(name));
    }

    fields.push(`updated_at=NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE products SET ${fields.join(",")} WHERE id=$${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update product" });
  }
};

// ── Admin: Delete product ─────────────────────────────────────
exports.deleteProduct = async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE products SET is_active=false WHERE id=$1 RETURNING id",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete product" });
  }
};

// ── Get categories ────────────────────────────────────────────
exports.getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.is_active = true
       GROUP BY c.id ORDER BY c.name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

// ── Admin: Create category ────────────────────────────────────
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });
    const slug = slugify(name);
    const result = await pool.query(
      "INSERT INTO categories (name, slug) VALUES ($1,$2) RETURNING *",
      [name, slug]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to create category" });
  }
};
