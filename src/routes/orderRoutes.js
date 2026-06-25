const express = require("express");
const router = express.Router();
const oc = require("../controllers/orderController");
const protect = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

// Customer
router.post("/", protect, oc.createOrder);
router.get("/my", protect, oc.getMyOrders);
router.get("/:id", protect, oc.getOrder);

// Admin
router.get("/", protect, admin, oc.getAllOrders);
router.put("/:id/status", protect, admin, oc.updateOrderStatus);
router.get("/admin/dashboard", protect, admin, oc.getDashboardStats);

module.exports = router;
