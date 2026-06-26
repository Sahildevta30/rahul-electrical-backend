require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ name: "Rahul Electrical Works API", version: "1.0.0", status: "running" });
});

try { app.use("/api/auth", require("./routes/authRoutes")); } catch(e) { console.error("authRoutes error:", e.message); }
try { app.use("/api/products", require("./routes/productRoutes")); } catch(e) { console.error("productRoutes error:", e.message); }
try { app.use("/api/orders", require("./routes/orderRoutes")); } catch(e) { console.error("orderRoutes error:", e.message); }
try { app.use("/api/bookings", require("./routes/bookingRoutes")); } catch(e) { console.error("bookingRoutes error:", e.message); }
try { app.use("/api/reviews", require("./routes/reviewRoutes")); } catch(e) { console.error("reviewRoutes error:", e.message); }
try { app.use("/api/customers", require("./routes/customerRoutes")); } catch(e) { console.error("customerRoutes error:", e.message); }
try { app.use("/api/inventory", require("./routes/inventoryRoutes")); } catch(e) { console.error("inventoryRoutes error:", e.message); }
try { app.use("/api/settings", require("./routes/settingsRoutes")); } catch(e) { console.error("settingsRoutes error:", e.message); }

try {
  const protect = require("./middleware/authMiddleware");
  const admin = require("./middleware/adminMiddleware");
  const { getDashboardStats } = require("./controllers/orderController");
  app.get("/api/dashboard", protect, admin, getDashboardStats);
} catch(e) { console.error("dashboard error:", e.message); }

app.use((req, res) => res.status(404).json({ message: "Route not found" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));