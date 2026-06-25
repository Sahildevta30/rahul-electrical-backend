const pool = require("../config/db");

exports.getSettings = async (req, res) => {
  try {
    const result = await pool.query("SELECT key, value FROM settings");
    const settings = {};
    result.rows.forEach((r) => (settings[r.key] = r.value));
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch settings" });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body; // { key: value, ... }
    const promises = Object.entries(updates).map(([key, value]) =>
      pool.query(
        `INSERT INTO settings (key, value) VALUES ($1,$2)
         ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW()`,
        [key, value]
      )
    );
    await Promise.all(promises);
    res.json({ message: "Settings updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update settings" });
  }
};
