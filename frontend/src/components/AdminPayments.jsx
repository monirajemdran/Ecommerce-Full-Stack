import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaMoneyBillWave, FaCreditCard, FaSearch, FaFilter, FaListAlt, FaCalendarAlt, FaUser } from "react-icons/fa";
import "./AdminTables.css";

const AdminPayments = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Date/Time Filter state
  const [weekFilter, setWeekFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get("https://shopverse-m5i8.onrender.com/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
      setFilteredOrders(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const getWeekOfMonth = (date) => {
    const day = date.getDate();
    if (day <= 7) return "1";
    if (day <= 14) return "2";
    if (day <= 21) return "3";
    if (day <= 28) return "4";
    return "5";
  };

  // Run filters whenever dependencies change
  useEffect(() => {
    let result = orders;

    // Search query filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(o => 
        o._id.toLowerCase().includes(query) || 
        (o.buyerName && o.buyerName.toLowerCase().includes(query)) ||
        (o.buyerEmail && o.buyerEmail.toLowerCase().includes(query))
      );
    }

    // Payment Method filter
    if (methodFilter !== "All") {
      result = result.filter(o => o.paymentMethod === methodFilter);
    }

    // Payment Status filter
    if (statusFilter !== "All") {
      if (statusFilter === "Paid") {
        result = result.filter(o => o.paymentStatus === "Paid" || o.amountCollected === true);
      } else if (statusFilter === "Pending") {
        result = result.filter(o => o.paymentStatus === "Pending" && o.amountCollected !== true);
      } else {
        result = result.filter(o => o.paymentStatus === statusFilter);
      }
    }

    // Date Week filter
    if (weekFilter !== "All") {
      result = result.filter(o => {
        const d = new Date(o.createdAt);
        return getWeekOfMonth(d) === weekFilter;
      });
    }

    // Date Month filter
    if (monthFilter !== "All") {
      result = result.filter(o => {
        const d = new Date(o.createdAt);
        return d.getMonth().toString() === monthFilter;
      });
    }

    // Date Year filter
    if (yearFilter !== "All") {
      result = result.filter(o => {
        const d = new Date(o.createdAt);
        return d.getFullYear().toString() === yearFilter;
      });
    }

    setFilteredOrders(result);
  }, [searchQuery, methodFilter, statusFilter, weekFilter, monthFilter, yearFilter, orders]);

  const handlePaymentStatusChange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("userToken");
      
      // If we mark a COD order as Completed, also sync amountCollected to true
      let updatePayload = { paymentStatus: newStatus };
      if (newStatus === "Completed" || newStatus === "Paid") {
        updatePayload.amountCollected = true;
      }

      await axios.put(`https://shopverse-m5i8.onrender.com/api/admin/orders/${id}/payment`, updatePayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire({
        icon: "success",
        title: "Payment Status Updated",
        text: `Transaction status marked as ${newStatus}`,
        timer: 1500,
        showConfirmButton: false
      });
      fetchPayments();
    } catch (err) {
      Swal.fire("Error", "Failed to update payment status", "error");
    }
  };

  // Stats calculators
  const grossRevenue = orders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
  
  const prepaidRevenue = orders
    .filter(o => o.paymentMethod === "Razorpay" || o.paymentMethod === "UPI / QR" || o.paymentMethod === "Card")
    .reduce((acc, o) => acc + (o.totalPrice || 0), 0);

  const codCollectedRevenue = orders
    .filter(o => o.paymentMethod === "Cash on Delivery" && o.amountCollected)
    .reduce((acc, o) => acc + (o.totalPrice || 0), 0);

  const codPendingRevenue = orders
    .filter(o => o.paymentMethod === "Cash on Delivery" && !o.amountCollected)
    .reduce((acc, o) => acc + (o.totalPrice || 0), 0);

  // Completed amount for the CURRENT filtered subset of orders
  const completedFilteredRevenue = filteredOrders
    .filter(o => o.paymentStatus === "Paid" || o.amountCollected === true)
    .reduce((acc, o) => acc + (o.totalPrice || 0), 0);

  const downloadExcel = () => {
    // Generate headers
    const headers = [
      "Order ID",
      "Date",
      "Buyer Name",
      "Buyer Email",
      "Payment Method",
      "Payment Status",
      "Total Price (INR)",
      "Products Purchased"
    ];

    // Map filtered orders to rows
    const rows = filteredOrders.map(o => {
      const itemsList = o.items ? o.items.map(it => `${it.productName} (x${it.quantity})`).join(" | ") : "";
      const isPaid = o.paymentStatus === "Paid" || o.amountCollected === true;
      return [
        o._id,
        new Date(o.createdAt).toLocaleString().replace(/,/g, " "),
        o.buyerName ? o.buyerName.replace(/,/g, " ") : "",
        o.buyerEmail ? o.buyerEmail.replace(/,/g, " ") : "",
        o.paymentMethod ? o.paymentMethod.replace(/,/g, " ") : "",
        isPaid ? "Paid" : (o.paymentStatus || "Pending"),
        o.totalPrice || 0,
        `"${itemsList.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    const timestamp = new Date().toISOString().substring(0, 10);
    link.setAttribute("download", `Transactions_Report_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: "success",
      title: "Excel File Downloaded! 📊",
      text: "Filtered transaction history has been downloaded as an Excel-compatible CSV file.",
      timer: 2000,
      showConfirmButton: false
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px 20px" }}>
        <div className="spinner" style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #4f46e5", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", margin: "0 auto 15px" }}></div>
        <p style={{ color: "#64748b", fontWeight: "bold" }}>Loading transaction logs...</p>
      </div>
    );
  }

  return (
    <div className="admin-table-container" style={{ padding: "10px" }}>
      
      {/* Analytics Overview Panels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "15px", marginBottom: "25px" }}>
        <div style={{ background: "linear-gradient(135deg, #4f46e5, #4338ca)", color: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(79,70,229,0.15)" }}>
          <p style={{ margin: "0 0 4px 0", fontSize: "12px", opacity: 0.8, textTransform: "uppercase", fontWeight: "bold", letterSpacing: "0.5px" }}>Gross Platform Volume</p>
          <h3 style={{ margin: 0, fontSize: "24px", fontWeight: "800" }}>₹{grossRevenue.toLocaleString()}</h3>
        </div>
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "bold", letterSpacing: "0.5px" }}>Prepaid Online Revenue</p>
          <h3 style={{ margin: 0, fontSize: "24px", fontWeight: "800", color: "#2563eb" }}>₹{prepaidRevenue.toLocaleString()}</h3>
        </div>
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "bold", letterSpacing: "0.5px" }}>COD Cash Collected</p>
          <h3 style={{ margin: 0, fontSize: "24px", fontWeight: "800", color: "#16a34a" }}>₹{codCollectedRevenue.toLocaleString()}</h3>
        </div>
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "bold", letterSpacing: "0.5px" }}>COD Cash Pending</p>
          <h3 style={{ margin: 0, fontSize: "24px", fontWeight: "800", color: "#ca8a04" }}>₹{codPendingRevenue.toLocaleString()}</h3>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
        <h2>System Transaction History</h2>
        
        {/* Live Search and Filters panel */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <FaSearch style={{ position: "absolute", left: "10px", color: "#94a3b8" }} />
            <input 
              type="text" 
              placeholder="Search Buyer / Order ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "8px 12px 8px 32px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                width: "200px"
              }}
            />
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "white" }}
          >
            <option value="All">All Methods</option>
            <option value="Razorpay">Razorpay</option>
            <option value="Cash on Delivery">Cash on Delivery</option>
            <option value="UPI / QR">UPI / QR</option>
            <option value="Card">Debit / Credit Card</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "white" }}
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid / Completed</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Date-based Filters & Excel Export Row */}
      <div style={{
        background: "#ffffff",
        padding: "16px 20px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
        marginBottom: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px"
      }}>
        {/* Dropdowns */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>Time Filter:</span>
          
          <select
            value={weekFilter}
            onChange={(e) => setWeekFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "white", fontWeight: "600" }}
          >
            <option value="All">All Weeks</option>
            <option value="1">Week 1 (1st - 7th)</option>
            <option value="2">Week 2 (8th - 14th)</option>
            <option value="3">Week 3 (15th - 21st)</option>
            <option value="4">Week 4 (22nd - 28th)</option>
            <option value="5">Week 5 (29th - 31st)</option>
          </select>

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "white", fontWeight: "600" }}
          >
            <option value="All">All Months</option>
            <option value="0">January</option>
            <option value="1">February</option>
            <option value="2">March</option>
            <option value="3">April</option>
            <option value="4">May</option>
            <option value="5">June</option>
            <option value="6">July</option>
            <option value="7">August</option>
            <option value="8">September</option>
            <option value="9">October</option>
            <option value="10">November</option>
            <option value="11">December</option>
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "white", fontWeight: "600" }}
          >
            <option value="All">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>

        {/* Filtered Paid Sum & Download Excel Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
          <div style={{
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#065f46",
            fontWeight: "800",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px"
          }}>
            💵 Filtered Completed Amount: <span style={{ fontSize: "15px", color: "#047857" }}>₹{completedFilteredRevenue.toLocaleString()}</span>
          </div>

          <button
            onClick={downloadExcel}
            style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(16,185,129,0.2)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.filter = "brightness(1.1)"}
            onMouseOut={(e) => e.currentTarget.style.filter = "none"}
          >
            📊 Download Excel Report
          </button>
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Order / Trans ID</th>
            <th>Date</th>
            <th>Buyer</th>
            <th>Gross Value</th>
            <th>Payment Method</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            const groupedOrders = [];
            const groupMap = {};
            filteredOrders.forEach(o => {
              const key = o.buyerOTP || o._id;
              if (!groupMap[key]) {
                groupMap[key] = [];
                groupedOrders.push(groupMap[key]);
              }
              groupMap[key].push(o);
            });

            return groupedOrders.map(group => 
              group.map((o, idx) => {
                const totalPrice = o.items ? o.items.reduce((acc, p) => acc + (p.price * p.quantity), 0) : (o.totalPrice || 0);
                const isPaid = o.paymentStatus === "Paid" || o.amountCollected === true;
                const isRazorpay = o.paymentMethod === "Razorpay";
                const razorpayTxnId = o.paymentDetails?.razorpayPaymentId;

                return (
                  <tr key={o._id} style={idx > 0 ? { borderTop: "1px dashed #e2e8f0" } : {}}>
                    {idx === 0 && (
                      <>
                        <td rowSpan={group.length} style={{ verticalAlign: "middle", borderBottom: "1px solid #cbd5e1" }}>
                          <div style={{ fontWeight: "600" }}>#{group[0]._id.toUpperCase()}</div>
                          {razorpayTxnId && (
                            <div style={{ fontSize: "10px", color: "#3b82f6", fontWeight: "bold", marginTop: "2px", wordBreak: "break-all" }}>
                              RPY: {razorpayTxnId.substring(0, 15)}
                            </div>
                          )}
                        </td>
                        <td rowSpan={group.length} style={{ verticalAlign: "middle", borderBottom: "1px solid #cbd5e1" }}>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            <FaCalendarAlt style={{ marginRight: "4px", fontSize: "10px" }} />
                            {new Date(group[0].createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td rowSpan={group.length} style={{ verticalAlign: "middle", borderBottom: "1px solid #cbd5e1" }}>
                          <div style={{ fontWeight: "600", fontSize: "13px" }}>
                            <FaUser style={{ marginRight: "4px", fontSize: "10px", color: "#94a3b8" }} />
                            {group[0].buyerName || "Buyer ID " + group[0].buyerId?.substring(0, 6)}
                          </div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{group[0].buyerEmail}</div>
                        </td>
                      </>
                    )}
                    <td style={{ fontWeight: "800", color: "#0f172a" }}>₹{totalPrice.toFixed(2)}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {isRazorpay ? (
                          <span style={{ background: "#eff6ff", color: "#1e40af", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", border: "1px solid #bfdbfe", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <img src="https://razorpay.com/favicon.png" style={{ width: "12px", height: "12px" }} alt="" /> Razorpay
                          </span>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#475569" }}>{o.paymentMethod || "COD"}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${isPaid ? "delivered" : o.paymentStatus === "Failed" ? "cancelled" : "pending"}`}>
                        {isPaid ? "Paid / Completed" : (o.paymentStatus || "Pending")}
                      </span>
                    </td>
                    <td>
                      <select 
                        value={o.paymentStatus || "Pending"} 
                        onChange={(e) => handlePaymentStatusChange(o._id, e.target.value)}
                        className="status-select"
                        style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "12px" }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Completed">Completed</option>
                        <option value="Failed">Failed</option>
                        <option value="Refunded">Refunded</option>
                      </select>
                    </td>
                  </tr>
                );
              })
            );
          })()}
          {filteredOrders.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>No matching transactions found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPayments;

