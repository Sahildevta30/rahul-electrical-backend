const express = require("express");
const router = express.Router();
const pc = require("../controllers/productController");
const protect = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const { upload } = require("../config/cloudinary");

// Public
router.get("/categories", pc.getCategories);
router.get("/:slug", pc.getProductBySlug);
router.get("/", pc.getProducts);

// Admin
router.post("/", protect, admin, upload.single("image"), pc.createProduct);
router.put("/:id", protect, admin, upload.single("image"), pc.updateProduct);
router.delete("/:id", protect, admin, pc.deleteProduct);
router.post("/categories", protect, admin, pc.createCategory);

module.exports = router;
