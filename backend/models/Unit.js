const mongoose = require("mongoose");

const UnitSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true 
  },
  totalHoursRequired: { 
    type: Number, 
    default: 50 
  }
});

module.exports = mongoose.model("Unit", UnitSchema);