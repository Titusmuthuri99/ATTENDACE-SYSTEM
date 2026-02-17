const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");

// 1. Config & Database
dotenv.config();
const app = express(); // DEFINED FIRST
connectDB();

// 2. Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 3. Routes
// Make sure these files exist in the routes folder!
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/units", require("./routes/unitRoutes"));

// 4. Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});