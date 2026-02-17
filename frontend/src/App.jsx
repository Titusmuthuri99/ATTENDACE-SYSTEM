import { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import "./App.css";

function App() {
  // --- 1. STATE DECLARATIONS ---
  const [view, setView] = useState("dashboard"); // Controls which page is shown
  const [students, setStudents] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]); // Added for Profile View

  const [unitName, setUnitName] = useState("");
  const [unitCode, setUnitCode] = useState("");

  const API_BASE = "http://localhost:5000/api";

  // --- 2. DATA FETCHING ---
  useEffect(() => {
    fetchData();
  }, [selectedUnit]);

  const fetchData = async () => {
    try {
      const unitRes = await axios.get(`${API_BASE}/units`);
      setUnits(unitRes.data);

      const url = selectedUnit ? `${API_BASE}/students/report/${selectedUnit}` : `${API_BASE}/students`;
      const studentRes = await axios.get(url);
      setStudents(studentRes.data);
      
      // Also fetch all attendance records for the profile view
      const attendanceRes = await axios.get(`${API_BASE}/attendance`); 
      setAttendanceRecords(attendanceRes.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  // --- 3. EVENT HANDLERS ---
  const addUnit = async () => {
    if (!unitName || !unitCode) return alert("Enter Unit Name and Code");
    try {
      const res = await axios.post(`${API_BASE}/units`, { name: unitName, code: unitCode });
      setUnits([...units, res.data]);
      setUnitName(""); setUnitCode("");
      alert("Unit Added Successfully!");
      setView("dashboard"); // Redirect to dashboard after adding
    } catch (err) {
      alert("Failed to add unit.");
    }
  };

  const handleMarkPresent = async (studentId) => {
    if (!selectedUnit) return alert("Please select a Unit first!");
    try {
      await axios.post(`${API_BASE}/students/mark-present`, {
        studentId,
        unitId: selectedUnit,
        hours: 2
      });
      alert("Attendance recorded (+2 Hours)");
      fetchData(); 
    } catch (err) { console.error(err); }
  };

  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wsname]);
      
      data.forEach(async (row) => {
        try {
          await axios.post(`${API_BASE}/students`, { name: row.Name, rollNumber: row.RollNumber });
        } catch (err) { console.error(err); }
      });
      alert("Bulk Upload Complete!");
      fetchData();
    };
    reader.readAsBinaryString(file);
  };

  const deleteStudent = async (id) => {
    if (window.confirm("Delete student record?")) {
      await axios.delete(`${API_BASE}/students/${id}`);
      setStudents(students.filter(s => s._id !== id));
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- 4. RENDER HELPER ---
  // This helps clean up the main return block
  const renderContent = () => {
    if (selectedStudentProfile) {
      return (
        <div className="profile-view fade-in">
          <button className="btn-back" onClick={() => setSelectedStudentProfile(null)}>← Back to List</button>
          <div className="profile-header card">
            <div className="profile-avatar">{selectedStudentProfile.name.charAt(0)}</div>
            <div>
              <h2>{selectedStudentProfile.name}</h2>
              <p>Roll Number: <strong>{selectedStudentProfile.rollNumber}</strong></p>
            </div>
          </div>
          <div className="attendance-history card">
            <h3>Detailed Attendance History</h3>
            <table>
              <thead>
                <tr><th>Date</th><th>Unit</th><th>Hours</th><th>Status</th></tr>
              </thead>
              <tbody>
                {attendanceRecords
                  .filter(rec => rec.studentId === selectedStudentProfile._id)
                  .map((record, index) => (
                    <tr key={index}>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                      <td>{units.find(u => u._id === record.unitId)?.name || "N/A"}</td>
                      <td>{record.hours}h</td>
                      <td><span className="status-present">Present</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    switch (view) {
      case "dashboard":
        return (
          <div className="fade-in">
            <div className="stats-grid">
              <div className="stat-card"><h3>{students.length}</h3><p>Total Students</p></div>
              <div className="stat-card"><h3>{units.length}</h3><p>Total Units</p></div>
            </div>
            <div className="card full-width">
              <div className="table-header">
                <h3>Live Attendance Table</h3>
                <input className="search-input" placeholder="Search..." onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <table>
                <thead>
                  <tr><th>Student</th><th>Progress</th><th>Attendance</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => (
                    <tr key={student._id}>
                      <td className="user-cell" onClick={() => setSelectedStudentProfile(student)}>
                        <img src={`https://ui-avatars.com/api/?name=${student.name}`} alt="avatar" />
                        <div><p className="name-link">{student.name}</p><p className="roll">{student.rollNumber}</p></div>
                      </td>
                      <td>
                        <div className="progress-bg"><div className="progress-fill" style={{ width: `${student.percentage || 0}%` }}></div></div>
                        <small>{student.totalHours || 0} / 50 Hrs</small>
                      </td>
                      <td><button className="btn-present" onClick={() => handleMarkPresent(student._id)}>Mark Present</button></td>
                      <td><button className="btn-delete" onClick={() => deleteStudent(student._id)}>🗑️</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "units":
        return (
          <div className="centered-form fade-in">
            <div className="card unit-form">
              <h3>Register New Unit</h3>
              <input placeholder="Unit Name" value={unitName} onChange={(e) => setUnitName(e.target.value)} />
              <input placeholder="Unit Code" value={unitCode} onChange={(e) => setUnitCode(e.target.value)} />
              <button className="btn-primary" onClick={addUnit}>Save Unit</button>
            </div>
          </div>
        );
      case "students":
        return (
          <div className="fade-in">
             <div className="card">
                <h3>Bulk Student Import</h3>
                <p>Upload Excel file with Name and RollNumber columns.</p>
                <input type="file" onChange={handleBulkUpload} className="file-input" />
             </div>
          </div>
        );
      default: return null;
    }
  };

  // --- 5. MAIN LAYOUT ---
  return (
    <div className="app-container">
      <nav className="sidebar">
        <h2>UniAttend</h2>
        <ul>
          <li className={view === "dashboard" ? "active" : ""} onClick={() => {setView("dashboard"); setSelectedStudentProfile(null)}}>📊 Dashboard</li>
          <li className={view === "units" ? "active" : ""} onClick={() => {setView("units"); setSelectedStudentProfile(null)}}>📚 Register Units</li>
          <li className={view === "students" ? "active" : ""} onClick={() => {setView("students"); setSelectedStudentProfile(null)}}>👥 Student Import</li>
        </ul>
      </nav>

      <main className="content">
        <header className="content-header">
          <h1>{selectedStudentProfile ? "Student Profile" : view.toUpperCase()}</h1>
          <div className="header-actions">
            <select className="unit-select" value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
              <option value="">-- All Units --</option>
              {units.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </div>
        </header>
        <div className="view-container">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;