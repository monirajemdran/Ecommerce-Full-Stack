import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaBox, FaCheckCircle, FaRocket, FaFilter, FaFileExcel, FaFilePdf } from "react-icons/fa";
import Navbar from "../components/Navbar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./OrderReceived.css";

function OrderReceived() {
  const [orders, setOrders] = useState([]);

  // Filter state
  const [filterType, setFilterType] = useState("all"); // all | day | week | month | year
  const [filterDay, setFilterDay]     = useState("");    // specific date  (YYYY-MM-DD)
  const [filterWeek, setFilterWeek]   = useState("");    // 1..5
  const [filterMonth, setFilterMonth] = useState("");    // 1..12
  const [filterYear, setFilterYear]   = useState(new Date().getFullYear().toString());

  const seller = JSON.parse(localStorage.getItem("user"));

  const fetchOrders = () => {
    axios
      .get(`https://shopverse-m5i8.onrender.com/api/orders/seller/${seller._id}`)
      .then((res) => setOrders(res.data));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const acceptOrder = async (order) => {
    try {
      const id = order._id;
      await axios.put(`https://shopverse-m5i8.onrender.com/api/orders/${id}/status`, {
        status: "Order Dispatched",
      });
      setOrders(
        orders.map((o) =>
          o._id === id ? { ...o, status: "Order Dispatched" } : o
        )
      );
      Swal.fire({
        title: "Order Dispatched! 🚀",
        text: `The status for ${order.buyerName}'s order has been updated.`,
        icon: "success",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "The server could not update the order status.",
      });
    }
  };

  /* ── Filter Logic ─────────────────────────────────── */
  const filteredOrders = orders.filter((order) => {
    if (filterType === "all") return true;

    const orderDate = order.createdAt
      ? new Date(order.createdAt)
      : null;
    if (!orderDate) return false;

    const selectedYear = parseInt(filterYear) || new Date().getFullYear();

    if (filterType === "year") {
      return orderDate.getFullYear() === selectedYear;
    }

    if (filterType === "month") {
      if (!filterMonth) return orderDate.getFullYear() === selectedYear;
      return (
        orderDate.getFullYear() === selectedYear &&
        orderDate.getMonth() + 1 === parseInt(filterMonth)
      );
    }

    if (filterType === "week") {
      if (!filterWeek) return true;
      const now = new Date();
      const weekNum = parseInt(filterWeek);
      const dayOfMonth = orderDate.getDate();
      const weekOfMonth = Math.ceil(dayOfMonth / 7);
      return (
        orderDate.getFullYear() === now.getFullYear() &&
        orderDate.getMonth() === now.getMonth() &&
        weekOfMonth === weekNum
      );
    }

    if (filterType === "day") {
      if (!filterDay) return true;
      const chosen = new Date(filterDay);
      return (
        orderDate.getFullYear() === chosen.getFullYear() &&
        orderDate.getMonth() === chosen.getMonth() &&
        orderDate.getDate() === chosen.getDate()
      );
    }

    return true;
  });

  /* ── Helper ─────────────────────────────────── */
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  /* ── Download Excel (CSV with BOM) ─────────── */
  const downloadExcel = () => {
    if (filteredOrders.length === 0) {
      Swal.fire({ icon: "warning", title: "No orders to export" });
      return;
    }
    const bom = "\uFEFF";
    const header = ["Order ID", "Date", "Buyer Name", "Mobile", "Email", "Address", "Items", "Total (₹)", "Status"];
    const rows = filteredOrders.map((o) => [
      o._id,
      o.createdAt ? new Date(o.createdAt).toLocaleString("en-IN") : "-",
      o.buyerName || "-",
      o.buyerMobile || "-",
      o.buyerEmail || "-",
      o.buyerAddress || "-",
      (o.items || []).filter(i => i.sellerId === seller._id).map(i => `${i.productName} x${i.quantity}`).join(" | "),
      (o.items || []).filter(i => i.sellerId === seller._id).reduce((sum, i) => sum + (i.price * i.quantity), 0),
      o.status || "Order Placed",
    ]);
    const csv = bom + [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_received_${filterType}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Download PDF ───────────────────────────── */
  const downloadPdf = () => {
    if (filteredOrders.length === 0) {
      Swal.fire({ icon: "warning", title: "No orders to export" });
      return;
    }
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.setTextColor(40, 116, 240);
    doc.text(`Orders Received Report`, 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Filter: ${filterType.toUpperCase()}  |  Total: ${filteredOrders.length} orders  |  Generated: ${new Date().toLocaleString("en-IN")}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [["Order ID", "Date", "Buyer", "Mobile", "Items", "Total (₹)", "Status"]],
      body: filteredOrders.map((o) => [
        o._id.substring(0, 10) + "...",
        o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN") : "-",
        o.buyerName || "-",
        o.buyerMobile || "-",
        (o.items || []).filter(i => i.sellerId === seller._id).map(i => `${i.productName} x${i.quantity}`).join(", "),
        `₹${(o.items || []).filter(i => i.sellerId === seller._id).reduce((sum, i) => sum + (i.price * i.quantity), 0)}`,
        o.status || "Order Placed",
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [40, 116, 240], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [241, 243, 246] },
      columnStyles: { 4: { cellWidth: 60 } },
    });
    doc.save(`orders_received_${filterType}_${Date.now()}.pdf`);
  };

  return (
    <div className="orders-page">
      <Navbar />
      <div style={{ padding: "20px 5% 0" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#212121", margin: "0 0 16px 0" }}>
          Orders Received <FaBox style={{ marginLeft: "8px", verticalAlign: "middle" }} />
        </h1>

        {/* ── FILTER BAR ── */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          background: "#ffffff",
          border: "1px solid #e0e0e0",
          borderRadius: "2px",
          padding: "16px",
          marginBottom: "20px",
          boxShadow: "0 1px 8px 0 rgba(0,0,0,.06)",
        }}>
          <FaFilter style={{ color: "#2874f0", fontSize: "14px" }} />
          <strong style={{ fontSize: "13px", color: "#212121" }}>Filter By:</strong>

          {/* Filter Type Dropdown */}
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setFilterDay(""); setFilterWeek(""); setFilterMonth(""); }}
            style={selStyle}
          >
            <option value="all">All Orders</option>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>

          {/* Week dropdown (only for week) */}
          {filterType === "week" && (
            <select value={filterWeek} onChange={(e) => setFilterWeek(e.target.value)} style={selStyle}>
              <option value="">-- Select Week --</option>
              <option value="1">Week 1 (1–7)</option>
              <option value="2">Week 2 (8–14)</option>
              <option value="3">Week 3 (15–21)</option>
              <option value="4">Week 4 (22–28)</option>
              <option value="5">Week 5 (29+)</option>
            </select>
          )}

          {/* Month dropdown (only for month) */}
          {filterType === "month" && (
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={selStyle}>
              <option value="">-- Select Month --</option>
              {months.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          )}

          {/* Year dropdown (only for year) */}
          {filterType === "year" && (
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} style={selStyle}>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}

          {/* Date picker (only for day) */}
          {filterType === "day" && (
            <input
              type="date"
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              style={{ ...selStyle, padding: "7px 10px" }}
            />
          )}

          {/* Result count badge */}
          {/* Right side: count + download buttons */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{
              background: "#eff6ff",
              color: "#2874f0",
              padding: "4px 12px",
              borderRadius: "2px",
              fontWeight: 700,
              fontSize: "12px",
            }}>
              {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
            </span>

            {/* Download Excel */}
            <button
              onClick={downloadExcel}
              title="Download Excel"
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "7px 14px", border: "none", borderRadius: "2px",
                background: "#217346", color: "#ffffff", fontWeight: 700,
                fontSize: "12px", cursor: "pointer", textTransform: "uppercase",
              }}
            >
              <FaFileExcel /> Excel
            </button>

            {/* Download PDF */}
            <button
              onClick={downloadPdf}
              title="Download PDF"
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "7px 14px", border: "none", borderRadius: "2px",
                background: "#d32f2f", color: "#ffffff", fontWeight: 700,
                fontSize: "12px", cursor: "pointer", textTransform: "uppercase",
              }}
            >
              <FaFilePdf /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── ORDER CARDS ── */}
      <div className="orders-grid" style={{ padding: "0 5% 40px" }}>
        {filteredOrders.map((order) => (
          <div className="order-card" key={order._id}>
            <div className="order-header">
              <h3>
                ID: {order._id.substring(0, 8)}...
                {order.deliveryMethod === "Express Delivery" && (
                  <span style={{ marginLeft: "8px", background: "#fef3c7", color: "#d97706", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" }}>
                    ⚡ Express
                  </span>
                )}
              </h3>
              <span className={`status-badge-seller ${order.status?.toLowerCase().replace(/\s+/g, "-")}`}>
                {order.status || "Order Placed"}
              </span>
            </div>
            <div className="buyer-info">
              <p><strong>Buyer:</strong> {order.buyerName}</p>
              <p><strong>Address:</strong> {order.buyerAddress}</p>
              <p><strong>Mobile:</strong> {order.buyerMobile}</p>
              <p><strong>Email:</strong> {order.buyerEmail}</p>
              {order.buyerLandmark && <p><strong>Landmark:</strong> {order.buyerLandmark}</p>}
              {order.buyerPincode && <p><strong>Pincode:</strong> {order.buyerPincode}</p>}
              {order.createdAt && (
                <p style={{ fontSize: "11px", color: "#878787", marginTop: "4px" }}>
                  🕒 {new Date(order.createdAt).toLocaleString("en-IN")}
                </p>
              )}
            </div>
            <div className="order-items-list">
              {order.items
                ?.filter((item) => item.sellerId === seller._id)
                .map((item, idx) => (
                  <div key={idx} className="order-item-detail">
                    <img src={item.productImage} alt="" className="item-img" />
                    <div className="item-info">
                      <h4>{item.productName}</h4>
                      <p>Qty: {item.quantity} × ₹{item.price}</p>
                      <p style={{ color: "#388e3c", fontWeight: "bold", fontSize: "12px" }}>
                        Stock Left: {item.productId?.stock ?? "N/A"}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
            <div className="order-footer">
              <h3>Total: ₹ {
                order.items
                  ?.filter((item) => item.sellerId === seller._id)
                  .reduce((acc, item) => acc + (item.price * item.quantity), 0)
              }</h3>
              <div className="seller-actions">
                {order.status === "Order Placed" || order.status === "Pending" ? (
                  <button className="accept-btn" onClick={() => acceptOrder(order)}>
                    Accept Order <FaCheckCircle style={{ marginLeft: "5px" }} />
                  </button>
                ) : order.status === "Order Dispatched" ? (
                  <span style={{ color: "#2874f0", fontWeight: "bold", fontSize: "13px" }}>
                    <FaRocket /> Dispatched
                  </span>
                ) : (
                  <span style={{ color: "#64748b", fontWeight: "bold", fontSize: "13px" }}>
                    {order.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredOrders.length === 0 && (
          <p style={{ color: "#878787", fontSize: "15px", padding: "20px 0" }}>
            No orders found for the selected filter.
          </p>
        )}
      </div>
    </div>
  );
}

// Shared select style
const selStyle = {
  padding: "8px 12px",
  borderRadius: "2px",
  border: "1px solid #cbd5e1",
  fontSize: "13px",
  color: "#212121",
  background: "#ffffff",
  outline: "none",
  cursor: "pointer",
};

export default OrderReceived;
