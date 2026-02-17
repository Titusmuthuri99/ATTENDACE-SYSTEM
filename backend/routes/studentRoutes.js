const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const multer = require("multer");

// 1. Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); 
  }
});

// 2. Define upload (MUST BE HERE)
const upload = multer({ storage: storage });

// Get all students
router.get("/", async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Error fetching students", error });
  }
});

// 3. Use it in the route (Add student with photo)
router.post("/", upload.single("photo"), async (req, res) => {
  try {
    const { name, rollNumber } = req.body;
    
    // We store the path so the frontend can find the file
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : "";

    const student = await Student.create({ 
      name, 
      rollNumber, 
      photoUrl 
    });

    res.status(201).json(student);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error creating student", error });
  }
});

// Update attendance
router.put("/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.present = !student.present;
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(400).json({ message: "Error updating attendance", error });
  }
});

// Example logic for the backend report route
router.get("/semester-report/:unitId", async (req, res) => {
  const { unitId } = req.params;
  const students = await Student.find();
  const report = await Promise.all(students.map(async (student) => {
    const records = await Attendance.find({ studentId: student._id, unitId });
    const totalHours = records.reduce((acc, rec) => acc + rec.hours, 0);
    return { ...student._doc, totalHours, percentage: (totalHours / 50) * 100 };
  }));
  res.json(report);
});

const Attendance = require("../models/Attendance"); // Ensure you created this model

// Mark attendance and credit hours
router.post("/mark-present", async (req, res) => {
  const { studentId, unitId, hours } = req.body;
  try {
    // 1. Create the historical record
    const newRecord = new Attendance({
      studentId,
      unitId,
      hours: hours || 2 // Default to 2 hours per session
    });
    await newRecord.save();

    // 2. Calculate new totals for this student in this unit
    const records = await Attendance.find({ studentId, unitId });
    const totalHours = records.reduce((acc, rec) => acc + rec.hours, 0);
    const percentage = ((totalHours / 50) * 100).toFixed(1);

    res.json({ totalHours, percentage });
  } catch (error) {
    res.status(500).json({ message: "Error recording attendance", error });
  }
});

module.exports = router;