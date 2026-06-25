const express = require("express");
const router = express.Router();
const ic = require("../controllers/inventoryController");
const sc = require("../controllers/settingsController");
const protect = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

router.get("/", protect, admin, ic.getInventory);
router.put("/:id/stock", protect, admin, ic.updateStock);

module.exports = router;
