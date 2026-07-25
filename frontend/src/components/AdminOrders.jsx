import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./AdminTables.css";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get("http://localhost:5000/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);

      // Fetch all delivery partners (online + offline, we show status)
      const partnersRes = await axios.get("http://localhost:5000/api/admin/delivery-partners", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeliveryPartners(partnersRes.data);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("userToken");
      await axios.put(`http://localhost:5000/api/admin/orders/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({
        icon: "success",
        title: "Status Updated",
        text: `Order status changed to ${newStatus}`,
        timer: 1500,
        showConfirmButton: false
      });
      fetchOrders();
    } catch (err) {
      Swal.fire("Error", "Failed to update status", "error");
    }
  };

  const handleSendNotification = async (buyerName, orderId) => {
    const { value: message } = await Swal.fire({
      title: 'Send Notification',
      input: 'textarea',
      inputLabel: `Message for ${buyerName || "Customer"}`,
      inputPlaceholder: 'Type your notification message here...',
      showCancelButton: true,
      confirmButtonText: 'Send Push/Email',
      confirmButtonColor: '#3b82f6',
    });

    if (message) {
      Swal.fire({
        icon: 'success',
        title: 'Notification Sent!',
        text: `Message successfully sent for Order #${orderId.substring(0,8)}`,
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  // Mark as Shipped = Pick online delivery partner + assign order to them
  const handleMarkAsShipped = async (orderId, buyerName) => {
    // Get only online partners
    const onlinePartners = deliveryPartners.filter(dp => dp.available === true);

    if (onlinePartners.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Online Drivers",
        text: "No delivery partners are currently online. Please wait until a partner comes online to ship this order.",
        confirmButtonColor: "#f59e0b"
      });
      return;
    }

    // Build options for SweetAlert dropdown
    const partnerOptions = {};
    onlinePartners.forEach(dp => {
      partnerOptions[dp._id] = `${dp.name || dp.email} (${dp.vehicleNumber || "No Vehicle"})`;
    });

    const { value: selectedPartnerId } = await Swal.fire({
      title: "Assign Delivery Partner",
      input: "select",
      inputOptions: partnerOptions,
      inputPlaceholder: "Select an online driver",
      showCancelButton: true,
      confirmButtonText: "Ship & Assign",
      confirmButtonColor: "#10b981",
      inputValidator: (value) => {
        if (!value) return "You must select a delivery partner!";
      }
    });

    if (!selectedPartnerId) return;

    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.put(`http://localhost:5000/api/admin/orders/${orderId}/assign`, {
        deliveryPartnerId: selectedPartnerId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const assignedPartner = onlinePartners.find(dp => dp._id === selectedPartnerId);

      Swal.fire({
        icon: "success",
        title: "Order Shipped & Assigned! 🚚",
        html: `
          <div style="text-align:left; font-size:14px; line-height:1.8">
            <p><strong>Customer:</strong> ${buyerName}</p>
            <p><strong>Driver:</strong> ${assignedPartner?.name || "Partner"}</p>
            <p><strong>Vehicle:</strong> ${assignedPartner?.vehicleNumber || "—"}</p>
            <p><strong>Delivery OTP:</strong> <span style="background:#fef3c7;padding:2px 10px;border-radius:4px;font-weight:bold;letter-spacing:2px">${res.data.otp || "Generated"}</span></p>
          </div>
        `,
        confirmButtonColor: "#10b981"
      });

      fetchOrders();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to assign partner", "error");
    }
  };

  const handleAssignPartner = async (orderId, partnerId) => {
    if (!partnerId) return;
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.put(`http://localhost:5000/api/admin/orders/${orderId}/assign`, {
        deliveryPartnerId: partnerId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({
        icon: "success",
        title: "Partner Assigned!",
        html: `Driver assigned. <strong>Delivery OTP:</strong> ${res.data.otp}`,
        timer: 2500,
        showConfirmButton: false
      });
      fetchOrders();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to assign partner", "error");
    }
  };

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="admin-table-container">
      <h2>Order Management</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Products</th>
            <th>Total Price</th>
            <th>Status</th>
            <th>Notification</th>
            <th>Assign Driver</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            const groupedOrders = [];
            const groupMap = {};
            orders.forEach(o => {
              const key = o.buyerOTP || o._id;
              if (!groupMap[key]) {
                groupMap[key] = [];
                groupedOrders.push(groupMap[key]);
              }
              groupMap[key].push(o);
            });

            return groupedOrders.map((group) =>
              group.map((o, idx) => {
                const totalPrice = o.items ? o.items.reduce((acc, p) => acc + (p.price * p.quantity), 0) : (o.totalPrice || 0);
                const firstItemImage = o.items && o.items.length > 0 ? o.items[0].productImage : "https://via.placeholder.com/50";
                const assignedPartner = deliveryPartners.find(dp => dp._id === o.deliveryPartnerId);
                return (
                  <tr key={o._id} style={idx > 0 ? { borderTop: "1px dashed #e2e8f0" } : {}}>
                    <td>
                      <img src={firstItemImage} alt="Order Item" className="product-thumb" />
                    </td>
                    {idx === 0 && (
                      <>
                        <td rowSpan={group.length} style={{ verticalAlign: "middle", borderBottom: "1px solid #cbd5e1" }}>
                          {group[0]._id}...
                          {group[0].deliveryMethod === "Express Delivery" && (
                            <span style={{ display: "block", color: "#d97706", backgroundColor: "#fef3c7", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold", marginTop: "4px", textAlign: "center" }}>
                              ⚡ Express
                            </span>
                          )}
                        </td>
                        <td rowSpan={group.length} style={{ verticalAlign: "middle", borderBottom: "1px solid #cbd5e1" }}>{group[0].buyerName || "Unknown"}</td>
                      </>
                    )}
                    <td>{o.items ? o.items.length : 0} items</td>
                    <td>₹{totalPrice}</td>
                    <td>
                      <span className={`status-badge ${o.status ? o.status.toLowerCase().replace(/\s+/g, '-') : "pending"}`}>
                        {o.status || "Pending"}
                      </span>
                    </td>
                    <td>
                      {(() => {
                        const sisterOrders = group;
                        const allDispatched = sisterOrders.every(other => 
                          other.status !== "Order Placed" && other.status !== "Pending"
                        );

                        if (!allDispatched) {
                          return (
                            <button 
                              className="delete-btn" 
                              style={{ backgroundColor: "#9ca3af", cursor: "not-allowed" }}
                              disabled
                            >
                              Waiting...
                            </button>
                          );
                        }

                        if (o.status === "Order Dispatched") {
                          return (
                            <button 
                              className="delete-btn" 
                              style={{ backgroundColor: "#10b981" }}
                              onClick={() => handleMarkAsShipped(o._id, o.buyerName)}
                            >
                              Ship & Assign 🚚
                            </button>
                          );
                        }

                        return (
                          <button 
                            className="delete-btn" 
                            style={{ backgroundColor: "#8b5cf6" }}
                            onClick={() => handleSendNotification(o.buyerName, o._id)}
                          >
                            Notify User
                          </button>
                        );
                      })()}
                    </td>
                    <td>
                      {assignedPartner ? (
                        <div style={{ fontSize: "12px" }}>
                          <span style={{ fontWeight: "bold" }}>{assignedPartner.name}</span>
                          <br />
                          <span style={{ color: assignedPartner.available ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                            {assignedPartner.available ? "🟢 Online" : "🔴 Offline"}
                          </span>
                        </div>
                      ) : (
                        <select 
                          value="" 
                          onChange={(e) => handleAssignPartner(o._id, e.target.value)}
                          className="status-select"
                          style={{ width: "130px" }}
                        >
                          <option value="">Unassigned</option>
                          {deliveryPartners.filter(dp => dp.available).map(dp => (
                            <option key={dp._id} value={dp._id}>
                              🟢 {dp.name || dp.email}
                            </option>
                          ))}
                          {deliveryPartners.filter(dp => !dp.available).map(dp => (
                            <option key={dp._id} value={dp._id} disabled>
                              🔴 {dp.name || dp.email} (Offline)
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      <select 
                        value={o.status || "Pending"} 
                        onChange={(e) => handleStatusChange(o._id, e.target.value)}
                        className="status-select"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                );
              })
            );
          })()}
        </tbody>
      </table>
    </div>
  );
};

export default AdminOrders;
