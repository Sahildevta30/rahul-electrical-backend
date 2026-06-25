const express = require("express");
const router = express.Router();
const bc = require("../controllers/bookingController");
const protect = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

router.get("/service-types", bc.getServiceTypes);
router.post("/", protect, bc.createBooking);
router.get("/my", protect, bc.getMyBookings);
router.get("/", protect, admin, bc.getAllBookings);
router.put("/:id/status", protect, admin, bc.updateBookingStatus);

module.exports = router;
