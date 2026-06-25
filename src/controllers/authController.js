const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { generateToken } = require("../utils/jwt");
const { generateOTP, sendOTP } = require("../utils/otp");

// ── Register with email/password ──────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password required" });
    }

    const exists = await pool.query(
      "SELECT id FROM users WHERE email=$1 OR phone=$2",
      [email, phone]
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({ message: "Email or phone already registered" });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone)
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone, role`,
      [name, email, hash, phone]
    );

    const user = result.rows[0];
    const token = generateToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
};

// ── Login with email/password ─────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1 AND is_active=true",
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);
    const { password_hash, otp, otp_expires_at, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};

// ── Send OTP to phone ─────────────────────────────────────────
exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "Phone required" });

    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await pool.query(
      `INSERT INTO users (phone, otp, otp_expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (phone) DO UPDATE SET otp=$2, otp_expires_at=$3`,
      [phone, otp, expires]
    );

    await sendOTP(phone, otp);
    res.json({ message: "OTP sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

// ── Verify OTP ────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp, name } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: "Phone and OTP required" });

    const result = await pool.query(
      "SELECT * FROM users WHERE phone=$1",
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Phone not found" });
    }

    const user = result.rows[0];

    if (user.otp !== otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(401).json({ message: "OTP expired" });
    }

    // Clear OTP and optionally set name
    const updated = await pool.query(
      `UPDATE users SET otp=NULL, otp_expires_at=NULL, name=COALESCE(name,$2)
       WHERE phone=$1 RETURNING id, name, phone, email, role`,
      [phone, name || user.name]
    );

    const token = generateToken(updated.rows[0]);
    res.json({ token, user: updated.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "OTP verification failed" });
  }
};

// ── Get current user ──────────────────────────────────────────
exports.me = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, phone, email, role, created_at FROM users WHERE id=$1",
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

// ── Update profile ────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const result = await pool.query(
      `UPDATE users SET name=COALESCE($1,name), email=COALESCE($2,email)
       WHERE id=$3 RETURNING id, name, email, phone, role`,
      [name, email, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};
