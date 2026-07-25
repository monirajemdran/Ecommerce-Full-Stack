import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/complaints/all");
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/complaints/${id}/status`, { status: "Resolved" });
      Swal.fire("Success", "Complaint marked as resolved", "success");
      fetchComplaints();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update complaint", "error");
    }
  };

  return (
    <div className="admin-complaints-container">
      <h2>User Complaints</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Message</th>
            <th>Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {complaints.map(c => (
            <tr key={c._id}>
              <td>{c.email}</td>
              <td>{c.message}</td>
              <td>{new Date(c.createdAt).toLocaleDateString()}</td>
              <td style={{ color: c.status === "Pending" ? "red" : "green" }}>{c.status}</td>
              <td>
                {c.status === "Pending" && (
                  <button onClick={() => handleResolve(c._id)} className="resolve-btn" style={{ background: "green", color: "white", padding: "5px 10px", border: "none", borderRadius: "4px", cursor: "pointer" }}>Resolve</button>
                )}
              </td>
            </tr>
          ))}
          {complaints.length === 0 && (
            <tr>
              <td colSpan="5">No complaints found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminComplaints;
