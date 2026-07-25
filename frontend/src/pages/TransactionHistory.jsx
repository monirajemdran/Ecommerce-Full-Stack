import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaCreditCard, FaReceipt, FaMoneyBillWave, FaClock, FaCheckCircle, FaWallet, FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./TransactionHistory.css";

function TransactionHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (user) {
      axios.get(`http://localhost:5000/api/orders/buyer/${user._id}`)
        .then(res => {
          setOrders(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, []);

  const totalSpent = orders
    .filter(o => o.paymentStatus === "Paid" || o.amountCollected)
    .reduce((acc, o) => acc + (o.totalPrice || 0), 0);

  const onlinePaymentsCount = orders
    .filter(o => o.paymentMethod === "Razorpay" || o.paymentMethod === "UPI / QR" || o.paymentMethod === "Card")
    .length;

  const codPendingCount = orders
    .filter(o => o.paymentMethod === "Cash on Delivery" && !o.amountCollected)
    .length;

  const handleShowInvoice = (order) => {
    const itemsHtml = order.items.map(item => `
      <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f1f5f9; font-size:13px; color:#475569;">
        <span>${item.productName} (x${item.quantity})</span>
        <span style="font-weight:bold; color:#0f172a;">₹${(item.price || 0) * item.quantity}</span>
      </div>
    `).join('');

    Swal.fire({
      title: `<div style="font-size:18px; font-weight:800; color:#0f172a;"><img src="https://razorpay.com/favicon.png" style="width:20px;height:20px;margin-right:8px;" />Transaction Invoice</div>`,
      html: `
        <div style="text-align:left; font-family:sans-serif; padding:10px 5px;">
          <div style="background:#f8fafc; padding:15px; border-radius:12px; margin-bottom:15px; border:1px solid #e2e8f0;">
            <p style="margin:0 0 4px 0; font-size:11px; color:#64748b;">TRANSACTION ID</p>
            <p style="margin:0 0 10px 0; font-weight:bold; font-size:13px; color:#0f172a; word-break:break-all;">${order.paymentDetails?.razorpayPaymentId || "TXN_" + order._id.substring(0, 12).toUpperCase()}</p>
            
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <p style="margin:0; font-size:11px; color:#64748b;">DATE</p>
                <p style="margin:0; font-weight:bold; font-size:12px; color:#0f172a;">${new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div style="text-align:right;">
                <p style="margin:0; font-size:11px; color:#64748b;">PAYMENT MODE</p>
                <p style="margin:0; font-weight:bold; font-size:12px; color:#3b82f6;">${order.paymentMethod}</p>
              </div>
            </div>
          </div>

          <p style="margin:0 0 8px 0; font-size:12px; font-weight:bold; color:#475569; text-transform:uppercase; letter-spacing:0.5px;">Purchased Products</p>
          <div style="max-height:150px; overflow-y:auto; margin-bottom:15px;">
            ${itemsHtml}
          </div>

          <div style="display:flex; justify-content:space-between; padding-top:10px; border-top:2px dashed #e2e8f0; font-size:15px; font-weight:bold; color:#0f172a;">
            <span>Grand Total:</span>
            <span style="color:#10b981; font-size:17px;">₹${order.totalPrice}</span>
          </div>

          <div style="margin-top:15px; background:#f0fdf4; padding:8px 12px; border-radius:6px; border:1px solid #bbf7d0; text-align:center; font-size:12px; color:#166534; font-weight:bold;">
            Payment Status: ${order.paymentStatus === 'Paid' || order.amountCollected ? '✅ SUCCESS / PAID' : '⏳ PENDING COD'}
          </div>
        </div>
      `,
      confirmButtonText: "Print / Close",
      confirmButtonColor: "#2563eb"
    });
  };

  if (loading) {
    return (
      <div className="txn-page">
        <Navbar />
        <div style={{ textAlign: "center", padding: "100px 20px" }}>
          <div className="spinner" style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #3b82f6", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", margin: "0 auto 20px" }}></div>
          <p style={{ color: "#64748b", fontWeight: "bold" }}>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="txn-page">
      <Navbar />
      <div className="txn-container">
        <div className="txn-header">
          {/* <Link to="/buyer" className="back-link"><FaArrowLeft /> Back to Shop</Link> */}
          <h1 className="page-title">Transaction History <FaWallet style={{ color: "#3b82f6" }} /></h1>
          <p className="page-subtitle">Track and manage all your secure online payments and orders.</p>
        </div>

        {/* Analytics Section */}
        <div className="txn-stats-grid">
          <div className="txn-stat-card total-spent">
            <div className="card-icon"><FaMoneyBillWave /></div>
            <div className="card-info">
              <h3>Total Money Spent</h3>
              <p>₹{totalSpent.toFixed(2)}</p>
            </div>
          </div>
          <div className="txn-stat-card online-count">
            <div className="card-icon"><FaCreditCard /></div>
            <div className="card-info">
              <h3>Online Payments</h3>
              <p>{onlinePaymentsCount} Transactions</p>
            </div>
          </div>
          <div className="txn-stat-card pending-cod">
            <div className="card-icon"><FaClock /></div>
            <div className="card-info">
              <h3>COD Pending Collection</h3>
              <p>{codPendingCount} Orders</p>
            </div>
          </div>
        </div>

        {/* Transaction Cards List */}
        <div className="txn-list-section">
          <h2>Recent Transactions</h2>
          <div className="txn-cards-grid">
            {orders.map(o => {
              const isPaid = o.paymentStatus === "Paid" || o.amountCollected;
              const isRazorpay = o.paymentMethod === "Razorpay";
              
              return (
                <div className={`txn-row-card ${isPaid ? 'paid-card' : 'pending-card'}`} key={o._id}>
                  <div className="txn-card-left">
                    <div className="txn-icon-wrapper">
                      {isRazorpay ? (
                        <img src="https://razorpay.com/favicon.png" alt="R" className="rzp-icon" />
                      ) : (
                        <FaWallet className="txn-card-icon" />
                      )}
                    </div>
                    <div className="txn-info-main">
                      <h3>
                        Order #{o._id.substring(0, 8).toUpperCase()}
                        {isRazorpay && <span className="rzp-badge">Razorpay</span>}
                      </h3>
                      <p className="txn-date">{new Date(o.createdAt).toLocaleString()}</p>
                      <div className="txn-items-summary">
                        {o.items?.map((it, index) => (
                          <span key={index} className="txn-item-tag">{it.productName} (x{it.quantity})</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="txn-card-right">
                    <div className="txn-amount-status">
                      <p className="txn-price">₹{o.totalPrice}</p>
                      <span className={`txn-status-badge ${isPaid ? 'status-paid' : 'status-pending'}`}>
                        {isPaid ? <><FaCheckCircle /> Success</> : <><FaClock /> Pending Collection</>}
                      </span>
                    </div>
                    <button className="receipt-btn" onClick={() => handleShowInvoice(o)}>
                      Invoice <FaReceipt />
                    </button>
                  </div>
                </div>
              );
            })}

            {orders.length === 0 && (
              <div className="txn-empty-state">
                <FaReceipt size={50} style={{ color: "#cbd5e1", marginBottom: "15px" }} />
                <h3>No Transactions Found</h3>
                <p>You haven't completed any transaction yet. Start browsing products to place an order!</p>
                <Link to="/buyer" className="shop-now-btn">Shop Now</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransactionHistory;
