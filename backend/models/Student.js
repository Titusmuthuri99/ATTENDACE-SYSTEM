const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  rollNumber: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("Student", StudentSchema);