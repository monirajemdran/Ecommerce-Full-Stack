import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaStar } from "react-icons/fa";
import "./AdminTables.css";

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get("https://shopverse-m5i8.onrender.com/api/admin/reviews", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleToggleHide = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem("userToken");
      await axios.put(`https://shopverse-m5i8.onrender.com/api/admin/reviews/${id}/hide`, { isHidden: !currentStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({
        icon: "success",
        title: !currentStatus ? "Review Hidden" : "Review Visible",
        timer: 1500,
        showConfirmButton: false
      });
      fetchReviews();
    } catch (err) {
      Swal.fire("Error", "Failed to update review status", "error");
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Delete Review?",
      text: "This cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("userToken");
          await axios.delete(`https://shopverse-m5i8.onrender.com/api/admin/reviews/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          Swal.fire("Deleted!", "Review removed.", "success");
          fetchReviews();
        } catch (err) {
          Swal.fire("Error", "Failed to delete review", "error");
        }
      }
    });
  };

  if (loading) return <div>Loading reviews...</div>;

  return (
    <div className="admin-table-container">
      <h2>Review Management</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Buyer</th>
            <th>Seller</th>
            <th>Rating</th>
            <th>Comment</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map(r => (
            <tr key={r._id} style={{ opacity: r.isHidden ? 0.6 : 1 }}>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {r.productId?.image && (
                    <img
                      src={r.productId.image}
                      alt=""
                      style={{
                        width: 44,
                        height: 44,
                        objectFit: "contain",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        background: "#f8fafc",
                      }}
                    />
                  )}
                  <span style={{ fontWeight: 600 }}>
                    {r.productId ? r.productId.name : "Unknown"}
                  </span>
                </div>
              </td>
              <td>
                <div style={{ fontWeight: 600 }}>
                  {r.userId ? r.userId.name : "Unknown"}
                </div>
                {r.userId?.email && (
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    {r.userId.email}
                  </div>
                )}
              </td>
              <td>
                <div style={{ fontWeight: 600, fontSize: "13px" }}>
                  {r.sellerName || r.productId?.sellerName || "—"}
                </div>
                {r.sellerEmail && (
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    {r.sellerEmail}
                  </div>
                )}
              </td>
              <td>
                <span style={{ display: "inline-flex", gap: "3px", alignItems: "center" }} aria-label={`${r.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      style={{
                        color: star <= (r.rating || 0) ? "#fbbf24" : "#e5e7eb",
                        fontSize: "16px",
                      }}
                    />
                  ))}
                </span>
              </td>
              <td style={{ maxWidth: "280px", fontSize: "13px", color: "#334155" }}>{r.comment}</td>
              <td>
                <span className={`status-badge ${r.isHidden ? "cancelled" : "delivered"}`}>
                  {r.isHidden ? "Hidden" : "Visible"}
                </span>
              </td>
              <td>
                <button 
                  className="delete-btn" 
                  style={{ backgroundColor: r.isHidden ? "#10b981" : "#f59e0b", marginRight: "10px" }}
                  onClick={() => handleToggleHide(r._id, r.isHidden)}
                >
                  {r.isHidden ? "Unhide" : "Hide"}
                </button>
                <button className="delete-btn" onClick={() => handleDelete(r._id)}>Delete</button>
              </td>
            </tr>
          ))}
          {reviews.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>No reviews found on the platform.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminReviews;

