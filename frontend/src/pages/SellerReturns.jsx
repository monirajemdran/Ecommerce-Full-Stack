import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Navbar from "../components/Navbar";

function SellerReturns() {
  const [returns, setReturns] = useState([]);
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    if (!user?._id || !user?.token) return;
    try {
      const res = await axios.get("http://localhost:5000/api/returns/seller", {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setReturns(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (returnId, newStatus) => {
    try {
      const { value: adminNotes } = await Swal.fire({
        title: `Confirm ${newStatus.replace("Return", "")}`,
        input: 'textarea',
        inputLabel: 'Notes (Optional)',
        inputPlaceholder: 'Enter any remarks...',
        showCancelButton: true
      });

      if (adminNotes !== undefined) {
        await axios.put(`http://localhost:5000/api/returns/${returnId}/status`, 
          { status: newStatus, adminNotes },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        Swal.fire("Updated", "Return status updated successfully.", "success");
        fetchReturns();
      }
    } catch (err) {
      Swal.fire("Error", "Could not update status", "error");
      console.error(err);
    }
  };

  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ padding: "40px 5%" }}>
        <h1 style={{ fontSize: "24px", color: "#1e293b", marginBottom: "20px" }}>Manage Returns</h1>
        
        {returns.length === 0 ? (
          <p style={{ color: "#64748b" }}>No return requests found.</p>
        ) : (
          <div style={{ display: "grid", gap: "20px" }}>
            {returns.map((ret) => (
              <div key={ret._id} style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <img src={ret.productId?.image} alt="" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "4px" }} />
                <div style={{ flex: 1, minWidth: "250px" }}>
                  <h3 style={{ margin: "0 0 10px 0", color: "#334155" }}>{ret.productId?.name} (Qty: {ret.quantity})</h3>
                  <p style={{ margin: "5px 0", fontSize: "14px", color: "#475569" }}><strong>Reason:</strong> {ret.reason}</p>
                  <p style={{ margin: "5px 0", fontSize: "14px", color: "#475569" }}><strong>Description:</strong> {ret.description}</p>
                  <p style={{ margin: "5px 0", fontSize: "14px", color: "#475569" }}><strong>Buyer:</strong> {ret.buyerId?.name} ({ret.buyerId?.email})</p>
                  <div style={{ marginTop: "10px" }}>
                    <span style={{ 
                      background: ret.status === "ReturnReceived" ? "#dcfce7" : ret.status === "PickupCompleted" ? "#fef3c7" : "#e0e7ff", 
                      color: ret.status === "ReturnReceived" ? "#166534" : ret.status === "PickupCompleted" ? "#92400e" : "#3730a3", 
                      padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" 
                    }}>
                      {ret.status === "PickupCompleted" ? "Out for Return (With Delivery Partner)" :
                       ret.status === "ReturnReceived" ? "Item Returned to You" :
                       ret.status === "PickupAssigned" ? "Pickup Agent Assigned" :
                       ret.status}
                    </span>
                  </div>
                </div>

                <div style={{ minWidth: "150px" }}>
                  <p style={{ margin: "0 0 5px 0", fontSize: "13px", fontWeight: "bold", color: "#64748b" }}>Buyer Images:</p>
                  <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                    {ret.images?.map((img, i) => (
                      <a key={i} href={`http://localhost:5000/${img}`} target="_blank" rel="noreferrer">
                        <img src={`http://localhost:5000/${img}`} alt="" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
                      </a>
                    ))}
                    {!ret.images?.length && <span style={{ fontSize: "12px", color: "#94a3b8" }}>No images provided</span>}
                  </div>
                  
                  {ret.status === "ReturnRequested" && (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button onClick={() => updateStatus(ret._id, "ReturnApproved")} style={{ background: "#22c55e", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Approve</button>
                      <button onClick={() => updateStatus(ret._id, "ReturnRejected")} style={{ background: "#ef4444", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Reject</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerReturns;
