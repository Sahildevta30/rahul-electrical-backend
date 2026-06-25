const express = require("express");
const router = express.Router();
const pc = require("../controllers/productController");
const protect = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const { upload } = require("../config/cloudinary");

// Public
router.get("/", pc.getProducts);
router.get("/categories", pc.getCategories);
router.get("/:slug", pc.getProductBySlug);

// Admin
router.post("/categories", protect, admin, pc.createCategory);
router.post("/", protect, admin, upload.single("image"), pc.createProduct);
router.put("/:id", protect, admin, upload.single("image"), pc.updateProduct);
router.delete("/:id", protect, admin, pc.deleteProduct);

module.exports = router;
