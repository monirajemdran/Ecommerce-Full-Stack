import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./AdminTables.css";

const AdminSellers = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get("https://shopverse-m5i8.onrender.com/api/admin/sellers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSellers(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("userToken");
      await axios.put(`https://shopverse-m5i8.onrender.com/api/admin/sellers/${id}/status`, { sellerStatus: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({
        icon: "success",
        title: "Status Updated",
        text: `Seller status changed to ${newStatus}`,
        timer: 1500,
        showConfirmButton: false
      });
      fetchSellers();
    } catch (err) {
      Swal.fire("Error", "Failed to update seller status", "error");
    }
  };

  if (loading) return <div>Loading sellers...</div>;

  return (
    <div className="admin-table-container">
      <h2>Seller Management</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Profile</th>
            <th>Name</th>
            <th>Email</th>
            <th>Mobile</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sellers.map(s => (
            <tr key={s._id}>
              <td>
                <img 
                  src={s.profileImage || "https://via.placeholder.com/50"} 
                  alt={s.name} 
                  className="product-thumb" 
                  style={{ borderRadius: "50%" }}
                />
              </td>
              <td>{s.name}</td>
              <td>{s.email}</td>
              <td>{s.mobile || "N/A"}</td>
              <td>
                <span className={`status-badge ${s.sellerStatus === "Approved" ? "delivered" : s.sellerStatus === "Rejected" ? "cancelled" : "pending"}`}>
                  {s.sellerStatus || "Approved"}
                </span>
              </td>
              <td>
                <select 
                  value={s.sellerStatus || "Approved"} 
                  onChange={(e) => handleStatusChange(s._id, e.target.value)}
                  className="status-select"
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </td>
            </tr>
          ))}
          {sellers.length === 0 && (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>No sellers found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminSellers;

