const express = require("express");
const router = express.Router();
const sc = require("../controllers/settingsController");
const protect = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

router.get("/", sc.getSettings);
router.put("/", protect, admin, sc.updateSettings);

module.exports = router;
