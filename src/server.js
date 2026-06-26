require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({
  origin: "*",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth",      require("./routes/authRoutes"));
app.use("/api/products",  require("./routes/productRoutes"));
app.use("/api/orders",    require("./routes/orderRoutes"));
app.use("/api/bookings",  require("./routes/bookingRoutes"));
app.use("/api/reviews",   require("./routes/reviewRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/inventory", require("./routes/inventoryRoutes"));
app.use("/api/settings",  require("./routes/settingsRoutes"));

const protect = require("./middleware/authMiddleware");
const admin   = require("./middleware/adminMiddleware");
const { getDashboardStats } = require("./controllers/orderController");
app.get("/api/dashboard", protect, admin, getDashboardStats);

app.get("/",(req,res)=>{
  res.json({
    name: "Rahul Electrical Works API",
    version: "1.0.0",
    status: "running",
  });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Rahul Electrical Works API running on port ${PORT}`);
});