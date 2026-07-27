import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaBoxOpen } from "react-icons/fa";

const DeliveryReturns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get("https://shopverse-m5i8.onrender.com/api/returns/delivery", {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Exclude ones already completed if you want, but for now we'll show all
      setReturns(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (returnId, newStatus) => {
    try {
      const token = localStorage.getItem("userToken");
      await axios.put(`https://shopverse-m5i8.onrender.com/api/returns/${returnId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire({
        icon: "success",
        title: "Status Updated! 🎉",
        text: `Return pickup successfully marked as ${newStatus}.`,
        confirmButtonColor: "#10b981"
      });
      fetchReturns();
    } catch (err) {
      Swal.fire("Error", "Could not update status", "error");
      console.error(err);
    }
  };

  const openMap = (address) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  const handleContact = (action, phoneOrEmail) => {
    if (action === "call") {
      window.location.href = `tel:${phoneOrEmail}`;
    }
  };

  const getReturnStepState = (ret, step) => {
    const status = ret.status || "PickupAssigned";
    if (step === "buyer") return "completed";
    if (step === "delivery") return ["PickupAssigned", "PickupCompleted", "ReturnReceived", "RefundCompleted"].includes(status) ? "completed" : "pending";
    if (step === "admin") return ["PickupCompleted", "ReturnReceived", "RefundCompleted"].includes(status) ? "completed" : "pending";
    if (step === "seller") return ["ReturnReceived", "RefundCompleted"].includes(status) ? "completed" : "pending";
    return "pending";
  };

  const renderReturnTrackMap = (ret) => {
    const steps = [
      { key: "buyer", label: "Buyer", detail: "Pickup from customer" },
      { key: "delivery", label: "Delivery Partner", detail: ret.deliveryPartnerId?.name || "Pickup agent" },
      { key: "admin", label: "Admin", detail: "Return verified" },
      { key: "seller", label: "Seller", detail: "Return received" },
    ];

    return (
      <div style={{ margin: "14px 0", padding: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
        <p style={{ margin: "0 0 10px 0", fontWeight: "bold", color: "#334155" }}>Return Pickup Track Map</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "8px" }}>
          {steps.map((step, index) => {
            const completed = getReturnStepState(ret, step.key) === "completed";
            return (
              <div key={step.key} style={{ position: "relative", padding: "10px", borderRadius: "6px", background: completed ? "#dcfce7" : "#ffffff", border: `1px solid ${completed ? "#86efac" : "#cbd5e1"}` }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px", borderRadius: "50%", background: completed ? "#16a34a" : "#cbd5e1", color: "#ffffff", fontSize: "12px", fontWeight: "bold" }}>
                  {index + 1}
                </span>
                <p style={{ margin: "8px 0 3px", fontWeight: "bold", color: "#0f172a", fontSize: "13px" }}>{step.label}</p>
                <p style={{ margin: 0, color: "#64748b", fontSize: "12px" }}>{step.detail}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) return <div>Loading assigned return pickups...</div>;

  return (
    <div>
      <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}><FaBoxOpen color="#6366f1" /> Assigned Return Pickups</h3>
      <div style={{ display: "grid", gap: "20px" }}>
        {returns.map(ret => (
          <div key={ret._id} style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", marginBottom: "15px" }}>
              <h4 style={{ margin: 0 }}>
                Return #{ret._id.substring(0, 8)}
                <span style={{ marginLeft: "8px", background: "#fef3c7", color: "#d97706", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
                  🔄 Pickup
                </span>
              </h4>
              <span style={{ background: "#e0e7ff", color: "#4f46e5", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
                {ret.status === "PickupCompleted" ? "Picked Up" :
                 ret.status === "ReturnReceived" ? "Returned" :
                 ret.status === "PickupAssigned" ? "Assigned" :
                 ret.status || "Assigned"}
              </span>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              {/* Left Column: Buyer (Pickup From) */}
              <div>
                <p style={{ margin: "0 0 10px 0", fontWeight: "bold", color: "#3b82f6" }}>📦 Pickup From (Buyer)</p>
                <p><strong>Customer:</strong> {ret.buyerId?.name}</p>
                <p><strong>Mobile:</strong> {ret.buyerId?.mobile}</p>
                <p><strong>Product:</strong> {ret.productId?.name || "N/A"}</p>
                <p><strong>Quantity:</strong> {ret.quantity || 1}</p>
                <p><strong>Reason:</strong> {ret.reason || "N/A"}</p>
                <p><strong>Address:</strong> {ret.orderId?.buyerAddress}</p>
                <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                  <button onClick={() => openMap(ret.orderId?.buyerAddress || "")} style={{ background: "#3b82f6", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>Open Maps 🗺️</button>
                  <button onClick={() => handleContact('call', ret.buyerId?.mobile)} style={{ background: "#10b981", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>Call 📞</button>
                </div>
              </div>
              
              {/* Right Column: Seller (Return To) & Status Update */}
              <div>
                <div style={{ background: "#f0fdf4", padding: "10px", borderRadius: "4px", border: "1px solid #bbf7d0", marginBottom: "15px" }}>
                  <p style={{ margin: "0 0 10px 0", fontWeight: "bold", color: "#16a34a" }}>🏪 Return To (Seller)</p>
                  <p><strong>Seller:</strong> {ret.sellerId?.name}</p>
                  <p><strong>Mobile:</strong> {ret.sellerId?.mobile || "N/A"}</p>
                  <p><strong>Address:</strong> {ret.sellerId?.address || "Address not provided"}</p>
                  <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                    <button onClick={() => openMap(ret.sellerId?.address || "")} style={{ background: "#3b82f6", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>Open Maps 🗺️</button>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "4px" }}>
                  <p style={{ margin: "0 0 10px 0", fontWeight: "bold" }}>Update Progress</p>
                  <select 
                    value={ret.status} 
                    onChange={(e) => handleUpdateStatus(ret._id, e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", marginBottom: "10px" }}
                  >
                    <option value="PickupAssigned">Pickup Assigned</option>
                    <option value="PickupCompleted">Mark as Picked Up</option>
                    <option value="ReturnReceived">Mark as Returned to Seller</option>
                  </select>
                </div>
              </div>
            </div>
            {renderReturnTrackMap(ret)}
          </div>
        ))}
        {returns.length === 0 && <p>You have no assigned return pickups right now.</p>}
      </div>
    </div>
  );
};

export default DeliveryReturns;

