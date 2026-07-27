import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./AdminTables.css";

const AdminReturns = () => {
  const [returns, setReturns] = useState([]);
  const [deliveryPartners, setDeliveryPartners] = useState([]);

  useEffect(() => {
    fetchReturns();
    fetchDeliveryPartners();
  }, []);

  const fetchReturns = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get("https://shopverse-m5i8.onrender.com/api/returns", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReturns(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDeliveryPartners = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get("https://shopverse-m5i8.onrender.com/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const partners = res.data.filter(u => u.role === "delivery");
      setDeliveryPartners(partners);
    } catch (err) {
      console.error(err);
    }
  };

  const assignPickup = async (returnId, partnerId) => {
    try {
      const token = localStorage.getItem("userToken");
      await axios.put(`https://shopverse-m5i8.onrender.com/api/returns/${returnId}/assign-pickup`, 
        { deliveryPartnerId: partnerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire("Assigned", "Pickup assigned successfully", "success");
      fetchReturns();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to assign pickup", "error");
    } 
  };

  const handleRefund = async (ret) => {
    const product = ret.productId;
    const basePrice = product?.isOffer ? (product.discountPrice || product.originalPrice || 0) : (product?.originalPrice || 0);
    const amount = basePrice * (ret.quantity || 1);
    
    const { value: upiId } = await Swal.fire({
      title: 'Issue Refund via UPI',
      input: 'text',
      inputLabel: `Enter Buyer's UPI ID to refund ₹${amount}`,
      inputPlaceholder: 'e.g., buyer@okaxis',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value || !value.includes('@')) {
          return 'Please enter a valid UPI ID!'
        }
      }
    });

    if (upiId) {
      Swal.fire({
        title: 'Processing Refund...',
        html: `Transferring ₹${amount} to ${upiId}...`,
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

      try {
        const token = localStorage.getItem("userToken");
        await axios.put(`https://shopverse-m5i8.onrender.com/api/returns/${ret._id}/status`, 
          { status: 'RefundCompleted', adminNotes: `Refunded ₹${amount} via UPI (${upiId})` },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        Swal.fire('Refund Successful! 🎉', `₹${amount} sent to ${upiId}`, 'success');
        fetchReturns();
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Refund processing failed.', 'error');
      }
    }
  };

  const isTrackStepDone = (status, step) => {
    if (step === "buyer") return true;
    if (step === "delivery") return ["PickupAssigned", "PickupCompleted", "ReturnReceived", "RefundCompleted"].includes(status);
    if (step === "admin") return ["PickupCompleted", "ReturnReceived", "RefundCompleted"].includes(status);
    if (step === "seller") return ["ReturnReceived", "RefundCompleted"].includes(status);
    return false;
  };

  const renderTrackMap = (ret) => {
    const steps = [
      ["buyer", "Buyer"],
      ["delivery", "Delivery Partner"],
      ["admin", "Admin"],
      ["seller", "Seller"],
    ];

    return (
      <div className="return-track-map" aria-label="Return pickup track map">
        {steps.map(([key, label], index) => (
          <div key={key} className={`return-track-step ${isTrackStepDone(ret.status, key) ? "done" : ""}`}>
            <span>{index + 1}</span>
            <p>{label}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="admin-table-container">
      <h3>Manage Returns & Pickups</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Return ID</th>
            <th>Product</th>
            <th>Reason</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {returns.map((ret) => (
            <tr key={ret._id}>
              <td>{ret._id.substring(0, 8)}...</td>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <img src={ret.productId?.image} alt="" style={{ width: "40px", height: "40px", borderRadius: "4px" }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: "bold", fontSize: "13px" }}>{ret.productId?.name}</p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>Seller: {ret.sellerId?.name}</p>
                  </div>
                </div>
              </td>
              <td>
                <p style={{ margin: 0, fontSize: "13px" }}>{ret.reason}</p>
                <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>{ret.description}</p>
              </td>
              <td>
                  <span>{
                    (function(){
                      const product = ret.productId;
                      const basePrice = product?.isOffer ? (product.discountPrice || product.originalPrice || 0) : (product?.originalPrice || 0);
                      return basePrice * (ret.quantity || 1);
                    })()
                  }</span>
              </td>
              <td>
                <span className={`status-badge ${ret.status === "ReturnRequested" ? "pending" : "active"}`}>
                  {ret.status === "PickupCompleted" ? "Out for Return" :
                   ret.status === "ReturnReceived" ? "Returned to Seller" :
                   ret.status === "PickupAssigned" ? "Pickup Assigned" :
                   ret.status === "RefundCompleted" ? "Refunded" :
                   ret.status}
                </span>
                {renderTrackMap(ret)}
              </td>
              <td>
                {ret.status === "ReturnApproved" ? (
                  <div style={{ display: "flex", gap: "5px" }}>
                    <select id={`partner-${ret._id}`} style={{ padding: "4px", borderRadius: "4px", border: "1px solid #ccc" }}>
                      <option value="">Select Partner</option>
                      {deliveryPartners.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => {
                        const pid = document.getElementById(`partner-${ret._id}`).value;
                        if (!pid) return Swal.fire("Error", "Select a partner", "error");
                        assignPickup(ret._id, pid);
                      }}
                      style={{ background: "#2563eb", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Assign Pickup
                    </button>
                  </div>
                ) : ret.status === "PickupAssigned" ? (
                  <p style={{ margin: 0, fontSize: "13px", color: "#16a34a", fontWeight: "bold" }}>Pickup Assigned: {ret.deliveryPartnerId?.name}</p>
                ) : ret.status === "PickupCompleted" ? (
                  <p style={{ margin: 0, fontSize: "13px", color: "#eab308", fontWeight: "bold" }}>Out for Return (with {ret.deliveryPartnerId?.name})</p>
                ) : ret.status === "ReturnReceived" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <p style={{ margin: 0, fontSize: "13px", color: "#10b981", fontWeight: "bold" }}>Returned to Seller</p>
                    <button 
                      onClick={() => handleRefund(ret)}
                      style={{ background: "#8b5cf6", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}
                    >
                      Issue Refund (UPI)
                    </button>
                  </div>
                ) : ret.status === "RefundCompleted" ? (
                  <p style={{ margin: 0, fontSize: "13px", color: "#8b5cf6", fontWeight: "bold" }}>Refund Completed via UPI</p>
                ) : ret.status === "ReturnRejected" ? (
                  <p style={{ margin: 0, fontSize: "13px", color: "#ef4444", fontWeight: "bold" }}>Rejected</p>
                ) : (
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Waiting for approval</p>
                )}
              </td>
            </tr>
          ))}
          {returns.length === 0 && (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>No returns found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminReturns;

