require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const seedSuperAdmin = require("./src/utils/seedAdmin");

// Initialize Express app
const app = express();

// Connect to Database and seed Super Admin
connectDB().then(() => seedSuperAdmin());

// Middleware
app.use(express.json());
app.use(cors());

// ─── Import Routes ──────────────────────────────────────────────
const authRoutes = require("./src/modules/core/routes/authRoutes");
const coreRoutes = require("./src/modules/core/routes/coreRoutes");
const billingRoutes = require("./src/modules/finance/routes/billingRoutes");
const gateRoutes = require("./src/modules/security/routes/gateRoutes");
const opsRoutes = require("./src/modules/operations/routes/opsRoutes");
const facilityRoutes = require("./src/modules/facilities/routes/facilityRoutes");
const dashboardRoutes = require("./src/modules/core/routes/dashboardRoutes");

// ─── Mount Routes ───────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/core", coreRoutes);
app.use("/api/finance", billingRoutes);
app.use("/api/security", gateRoutes);
app.use("/api/ops", opsRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Basic health-check
app.get("/", (req, res) => {
  res.json({ success: true, message: "Nakshatra SaaS API is running..." });
});

// ─── Global Error Handler ───────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    data: null,
  });
});

// Port configuration
const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
