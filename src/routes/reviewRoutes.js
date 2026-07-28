const express = require("express");
const router = express.Router();
const rc = require("../controllers/reviewController");
const protect = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

router.post("/", protect, rc.createReview);
router.post("/general", rc.createGeneralReview);
router.get("/public", rc.getPublicReviews);
router.get("/", protect, admin, rc.getAllReviews);
router.put("/:id", protect, admin, rc.moderateReview);

module.exports = router;
