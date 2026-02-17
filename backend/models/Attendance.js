const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Student", 
    required: true 
  },
  unitId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Unit", 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  hours: { 
    type: Number, 
    default: 2 // Assuming each session is 2 hours
  }
});

module.exports = mongoose.model("Attendance", AttendanceSchema);