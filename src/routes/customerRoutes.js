const express = require("express");
const router = express.Router();
const cc = require("../controllers/customerController");
const protect = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

// Customer own addresses
router.get("/addresses", protect, cc.getAddresses);
router.post("/addresses", protect, cc.addAddress);
router.delete("/addresses/:id", protect, cc.deleteAddress);

// Admin
router.get("/", protect, admin, cc.getAllCustomers);
router.get("/:id", protect, admin, cc.getCustomerProfile);

module.exports = router;
