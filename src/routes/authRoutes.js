const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");

router.post("/register", auth.register);
router.post("/login", auth.login);
router.post("/send-otp", auth.sendOtp);
router.post("/verify-otp", auth.verifyOtp);
router.get("/me", protect, auth.me);
router.put("/profile", protect, auth.updateProfile);

module.exports = router;
