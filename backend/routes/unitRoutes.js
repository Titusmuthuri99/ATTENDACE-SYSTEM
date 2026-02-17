const express = require("express");
const router = express.Router();
// Ensure the "U" is capital if your file is "Unit.js"
const Unit = require("../models/Unit"); 



// Get all units
router.get("/", async (req, res) => {
  try {
    const units = await Unit.find();
    res.json(units);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new unit
router.post("/", async (req, res) => {
  const { name, code } = req.body;
  const unit = new Unit({ name, code });
  try {
    const newUnit = await unit.save();
    res.status(201).json(newUnit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;