const express = require("express");
const router = express.Router();
const wc = require("../controllers/wishlistController");
const protect = require("../middleware/authMiddleware");

router.get("/", protect, wc.getWishlist);
router.post("/", protect, wc.addToWishlist);
router.delete("/:productId", protect, wc.removeFromWishlist);

module.exports = router;
