import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "../pages/AdminDashboard.css"; // Reuse table styles or create DeliveryTables.css

const routeLabels = ["Seller", "Admin", "Delivery Partner", "Buyer"];
const routeColors = ["#f97316", "#2563eb", "#10b981", "#ec4899"];

const createRouteIcon = (index) =>
  L.divIcon({
    className: "delivery-route-marker",
    html: `<div style="
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: ${routeColors[index] || "#111827"};
      color: white;
      border: 3px solid white;
      box-shadow: 0 6px 16px rgba(15,23,42,.28);
      display: grid;
      place-items: center;
      font-size: 13px;
      font-weight: 800;
    ">${index + 1}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14]
  });

const FitRouteBounds = ({ positions }) => {
  const map = useMap();

  useEffect(() => {
    if (!positions.length) return;
    map.fitBounds(positions, { padding: [42, 42] });
  }, [map, positions]);

  return null;
};

const DeliveryAssignedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  const selectedOrder = orders.find(o => o._id === trackingOrderId);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!trackingOrderId) {
      setTrackingData(null);
      setTrackingError("");
      return;
    }

    const fetchTracking = async () => {
      try {
        setTrackingLoading(true);
        setTrackingError("");
        const res = await axios.get(`https://shopverse-m5i8.onrender.com/api/orders/tracking/${trackingOrderId}`);
        setTrackingData(res.data);
      } catch (err) {
        console.error(err);
        setTrackingError(err.response?.data?.message || "Unable to load tracking map.");
      } finally {
        setTrackingLoading(false);
      }
    };

    fetchTracking();
  }, [trackingOrderId]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get("https://shopverse-m5i8.onrender.com/api/delivery/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter out 'Delivered' from assigned view
      const activeOrders = res.data.filter(o => o.deliveryStatus !== "Delivered");
      setOrders(activeOrders);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    if (newStatus === "Delivered") {
      // Trigger double OTP verification
      const { value: formValues } = await Swal.fire({
        title: 'Verify Delivery OTPs 🔑',
        html: `
          <div style="text-align:left; font-size:14px; margin-bottom:15px;">
            <label style="font-weight:bold; display:block; margin-bottom:5px;">1. Delivery Partner OTP (from Admin):</label>
            <input id="swal-otp1" class="swal2-input" placeholder="Enter Delivery OTP" style="margin-top:0; width:90%; padding: 8px 12px; height: 40px; box-sizing: border-box;">
          </div>
          <div style="text-align:left; font-size:14px;">
            <label style="font-weight:bold; display:block; margin-bottom:5px;">2. Customer Confirmation OTP:</label>
            <input id="swal-otp2" class="swal2-input" placeholder="Enter Customer OTP" style="margin-top:0; width:90%; padding: 8px 12px; height: 40px; box-sizing: border-box;">
          </div>
        `,
        focusConfirm: false,
        preConfirm: () => {
          const otp1 = document.getElementById('swal-otp1').value;
          const otp2 = document.getElementById('swal-otp2').value;
          if (!otp1 || !otp2) {
            Swal.showValidationMessage('Please enter both OTP codes!');
            return false;
          }
          return [otp1, otp2];
        },
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#64748b'
      });

      if (!formValues) return;

      const [deliveryOtp, buyerOtp] = formValues;
      updateStatusAPI(orderId, newStatus, deliveryOtp, buyerOtp);
    } else {
      updateStatusAPI(orderId, newStatus);
    }
  };

  const updateStatusAPI = async (orderId, status, otp = null, buyerOtp = null) => {
    try {
      const token = localStorage.getItem("userToken");
      await axios.put(`https://shopverse-m5i8.onrender.com/api/delivery/orders/${orderId}/status`, { status, otp, buyerOtp }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({
        icon: "success",
        title: "Delivery Confirmed! 🎉",
        text: `Order successfully marked as ${status}.`,
        confirmButtonColor: "#10b981"
      });
      fetchOrders();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to update status", "error");
    }
  };

  const getBuyerLocation = (order) => {
    const latitude = Number(order?.buyer?.location?.latitude);
    const longitude = Number(order?.buyer?.location?.longitude);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude };
    }

    return null;
  };

  const openMap = (order) => {
    const buyerLocation = getBuyerLocation(order);
    const query = buyerLocation
      ? `${buyerLocation.latitude},${buyerLocation.longitude}`
      : `${order.buyerAddress || ""} ${order.buyerPincode || ""}`.trim();

    if (!query) {
      Swal.fire("Location Missing", "Buyer location is not saved in the database.", "warning");
      return;
    }

    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
  };

  const openTrackingMap = (orderId) => {
    setTrackingOrderId(trackingOrderId === orderId ? null : orderId);
  };

  const handleContact = (action, phoneOrEmail) => {
    if (action === "call") {
      window.location.href = `tel:${phoneOrEmail}`;
    } else {
      window.location.href = `mailto:${phoneOrEmail}`;
    }
  };

  const handleAmountCollected = async (orderId, amount, buyerName) => {
    const result = await Swal.fire({
      title: "Confirm Cash Collection",
      html: `
        <div style="text-align:left; line-height:1.8; font-size:14px">
          <p><strong>Customer:</strong> ${buyerName}</p>
          <p><strong>Amount:</strong> <span style="color:#059669; font-weight:800; font-size:18px">₹${amount}</span></p>
        </div>
        <p style="font-size:13px; color:#64748b; margin-top:10px">Have you collected the full amount from the customer?</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Collected ✅",
      cancelButtonText: "Not Yet",
      confirmButtonColor: "#10b981"
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("userToken");
        await axios.put(`https://shopverse-m5i8.onrender.com/api/delivery/orders/${orderId}/collect`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire({
          icon: "success",
          title: "Amount Collected! 💵",
          text: `₹${amount} marked as collected from ${buyerName}.`,
          timer: 2000,
          showConfirmButton: false
        });
        fetchOrders();
      } catch (err) {
        Swal.fire("Error", err.response?.data?.message || "Failed to update", "error");
      }
    }
  };

  if (loading) return <div>Loading assigned orders...</div>;

  return (
    <div>
      <h3>Assigned Deliveries</h3>
      <div style={{ display: "grid", gap: "20px" }}>
        {orders.map(o => (
          <div key={o._id} style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", marginBottom: "15px" }}>
              <h4 style={{ margin: 0 }}>
                Order #{o._id}
                {o.deliveryMethod === "Express Delivery" && (
                  <span style={{ marginLeft: "8px", background: "#fef3c7", color: "#d97706", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
                    ⚡ Express
                  </span>
                )}
              </h4>
              <span style={{ background: "#fef3c7", color: "#d97706", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
                {o.deliveryStatus || "Pending Pickup"}
              </span>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <p><strong>Customer:</strong> {o.buyerName}</p>
                <p><strong>Mobile:</strong> {o.buyerMobile}</p>
                <p><strong>ProductName:</strong> {o.items[0]?.productName || "N/A"}</p>
                <p><strong>Quantity:</strong> {o.items[0]?.quantity || "N/A"}</p>
                <p><strong>Price:</strong> ₹{o.items[0]?.price ? (o.items[0].price * o.items[0].quantity).toLocaleString("en-IN") : "N/A"}</p>
                <p><strong>Size:</strong> {o.items[0]?.size || "N/A"}</p>
                <p><strong>Amount Collected:</strong> {o.amountCollected ? "Yes" : "No"}</p>
                <p><strong>Payment Method:</strong> {o.paymentMethod}</p>
                <p><strong>Address:</strong> {o.buyerAddress}, {o.buyerPincode}</p>
                <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                  <button onClick={() => openMap(o)} style={{ background: "#3b82f6", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>Google Maps 📍</button>
                  <button onClick={() => openTrackingMap(o._id)} style={{ background: "#ff1493", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>
                    {trackingOrderId === o._id ? "Close Map ❌" : "Track Map 🗺️"}
                  </button>
                  <button onClick={() => handleContact('call', o.buyerMobile)} style={{ background: "#10b981", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>Call 📞</button>
                </div>
              </div>
              
              <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "4px" }}>
                <p style={{ margin: "0 0 10px 0", fontWeight: "bold" }}>Update Progress</p>
                {o.deliveryOTP && (
                  <div style={{ 
                    background: "#eff6ff", 
                    border: "1px dashed #bfdbfe", 
                    borderRadius: "6px", 
                    padding: "6px 10px", 
                    marginBottom: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <span style={{ fontSize: "11px", color: "#1e40af", fontWeight: 700 }}>DELIVERY OTP:</span>
                    <span style={{ fontSize: "15px", color: "#1d4ed8", fontWeight: 800, letterSpacing: "1px" }}>{o.deliveryOTP}</span>
                  </div>
                )}
                <select 
                  value={o.deliveryStatus} 
                  onChange={(e) => handleUpdateStatus(o._id, e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", marginBottom: "10px" }}
                >
                  <option value="Pending">Pending Pickup</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Mark as Delivered</option>
                  <option value="Failed Delivery">Failed Delivery</option>
                  <option value="Returned">Return to Seller</option>
                </select>
                <p style={{ fontSize: "12px", color: "#64748b" }}>* Both OTPs required for marking Delivered.</p>
              </div>
            </div>

            {/* Amount Collected Section */}
            {o.paymentMethod === "Razorpay" ? (
              <div style={{ marginTop: "16px", padding: "14px 18px", background: "linear-gradient(135deg, #eff6ff, #f8fafc)", borderRadius: "8px", border: "1px solid #bfdbfe", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#1e3a8a", fontWeight: 700 }}>Prepaid Order</p>
                  <p style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#1e40af" }}>₹{o.totalPrice || 0}</p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>Paid via: {o.paymentMethod}</p>
                </div>
                <div style={{
                  background: "#dbeafe",
                  color: "#1e40af",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: 800,
                  fontSize: "14px",
                  border: "1px solid #93c5fd"
                }}>
                  ✅ Paid Online
                </div>
              </div>
            ) : (
              <div style={{ marginTop: "16px", padding: "14px 18px", background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)", borderRadius: "8px", border: "1px solid #bbf7d0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Amount to Collect</p>
                  <p style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#059669" }}>₹{o.totalPrice || 0}</p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>Payment: {o.paymentMethod || "Cash on Delivery"}</p>
                </div>
                <button
                  onClick={() => handleAmountCollected(o._id, o.totalPrice, o.buyerName)}
                  disabled={o.amountCollected}
                  style={{
                    background: o.amountCollected ? "#d1d5db" : "linear-gradient(135deg, #10b981, #059669)",
                    color: "white",
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: o.amountCollected ? "not-allowed" : "pointer",
                    boxShadow: o.amountCollected ? "none" : "0 4px 12px rgba(16,185,129,0.3)",
                    transition: "all 0.2s"
                  }}
                >
                  {o.amountCollected ? "✅ Collected" : "💵 Amount Collected"}
                </button>
              </div>
            )}

          </div>
        ))}
        {orders.length === 0 && <p>You have no assigned orders right now.</p>}
      </div>

      {trackingOrderId && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            width: "90%",
            maxWidth: "800px",
            maxHeight: "90vh",
            overflowY: "auto",
            position: "relative"
          }}>
            <button 
              onClick={() => setTrackingOrderId(null)}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                cursor: "pointer",
                fontWeight: "bold",
                zIndex: 1000
              }}
            >
              X
            </button>
            <h2 style={{ marginTop: 0 }}>Live Tracking Map 🗺️</h2>
            {trackingLoading ? (
              <div style={{ padding: 12 }}>Loading route from database...</div>
            ) : trackingError ? (
              <div style={{ padding: 12, color: "#b91c1c" }}>{trackingError}</div>
            ) : selectedOrder && trackingData?.route ? (
              (() => {
                const route = routeLabels.map((label, index) => {
                  const point = trackingData.route.find(item => item.label === label) || trackingData.route[index] || {};
                  return { ...point, label };
                });
                const validRoute = route.filter(point => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
                const positions = validRoute.map(point => [point.latitude, point.longitude]);
                const center = positions[0] || [20.5937, 78.9629];

                return (
                  <div>
                    <div style={{ height: "430px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                      {positions.length > 0 ? (
                        <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }}>
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <FitRouteBounds positions={positions} />
                          {validRoute.map((point) => (
                            <Marker
                              key={point.label}
                              position={[point.latitude, point.longitude]}
                              icon={createRouteIcon(routeLabels.indexOf(point.label))}
                            >
                              <Popup>
                                <strong>{point.label}</strong>
                                <br />
                                {point.name}
                                <br />
                                {point.address}
                                <br />
                                {point.latitude}, {point.longitude}
                              </Popup>
                            </Marker>
                          ))}
                          {positions.length > 1 && (
                            <Polyline positions={positions} pathOptions={{ color: "#ff1493", weight: 5, opacity: 0.8 }} />
                          )}
                        </MapContainer>
                      ) : (
                        <div style={{ padding: 16 }}>No saved coordinates found for this route.</div>
                      )}
                    </div>

                    <div style={{ display: "grid", gap: "8px", marginTop: "14px" }}>
                      {route.map((point, index) => {
                        const hasLocation = Number.isFinite(point.latitude) && Number.isFinite(point.longitude);
                        return (
                          <div key={point.label} style={{ display: "grid", gridTemplateColumns: "34px 150px 1fr", gap: "10px", alignItems: "start", padding: "10px", background: "#f8fafc", borderRadius: "8px" }}>
                            <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: routeColors[index], color: "white", display: "grid", placeItems: "center", fontWeight: 800 }}>{index + 1}</span>
                            <strong>{point.label}</strong>
                            <span>
                              {point.address || "Address not available"}
                              <br />
                              <small style={{ color: hasLocation ? "#047857" : "#b91c1c" }}>
                                {hasLocation ? `${point.latitude}, ${point.longitude}` : "Coordinates not saved in DB"}
                              </small>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div style={{ padding: 12 }}>Order information is not available.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryAssignedOrders;

