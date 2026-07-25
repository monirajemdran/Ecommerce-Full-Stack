import React, { useState, useEffect } from "react";
import axios from "axios";

const DeliveryHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get("http://localhost:5000/api/delivery/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter only finished statuses
      const pastOrders = res.data.filter(o => 
        ["Delivered", "Failed Delivery", "Returned"].includes(o.deliveryStatus)
      );
      setHistory(pastOrders);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading history...</div>;

  return (
    <div>
      <h3>Delivery History</h3>
      <p style={{ color: "#64748b", marginBottom: "20px" }}>A complete log of your past deliveries and returns.</p>
      
      <div style={{ display: "grid", gap: "15px" }}>
        {history.map(o => (
          <div key={o._id} style={{ background: "white", padding: "15px 20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            
            <div>
              <h4 style={{ margin: "0 0 5px 0" }}>Order #{o._id}</h4>
              <p><strong>Product Name:</strong> {o.items[0]?.productName || "N/A"}</p>
              <p><strong>Address:</strong> {o.buyerAddress}, {o.buyerPincode}</p>
              <p><strong>Phone:</strong> {o.buyerMobile}</p>
              <p><strong>Payment Method:</strong> {o.paymentMethod}</p>
              <p style={{ margin: 0, fontSize: "14px", color: "#475569" }}>
                <strong>Customer:</strong> {o.buyerName} | <strong>Date:</strong> {new Date(o.updatedAt).toLocaleDateString()}
              </p>
            </div>
            
            <div style={{ textAlign: "right" }}>
              <span style={{ 
                padding: "6px 12px", 
                borderRadius: "20px", 
                fontSize: "12px", 
                fontWeight: "bold",
                backgroundColor: o.deliveryStatus === "Delivered" ? "#d1fae5" : "#fee2e2",
                color: o.deliveryStatus === "Delivered" ? "#059669" : "#b91c1c"
              }}>
                {o.deliveryStatus}
              </span>
              <p style={{ margin: "5px 0 0 0", fontSize: "14px", fontWeight: "bold" }}>₹{o.totalPrice}</p>
            </div>

          </div>
        ))}
        {history.length === 0 && (
          <div style={{ padding: "30px", textAlign: "center", background: "white", borderRadius: "8px" }}>
            You haven't completed any deliveries yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryHistory;
