import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaTruck, FaCheckCircle, FaTimesCircle, FaBoxOpen, FaMapMarkedAlt } from "react-icons/fa";
import Navbar from "../components/Navbar";
import "./OrderHistory.css";

function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/orders/${id}`);
        setOrder(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Order not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const sellerInfo = () => {
    if (!order?.items?.length) return null;
    const uniqueSellers = Array.from(new Map(order.items.map(item => [item.sellerId, { sellerName: item.sellerName, sellerEmail: item.sellerEmail }])).values());
    return uniqueSellers;
  };

  return (
    <div className="orders-page">
      <Navbar />
      <div className="orders-container">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft style={{ marginRight: "8px" }} /> Back to Orders
        </button>

        {loading ? (
          <div className="order-detail-card">Loading order details...</div>
        ) : error ? (
          <div className="order-detail-card error-card">{error}</div>
        ) : (
          <>
            <div className="order-detail-card">
              <div className="order-detail-header">
                <div>
                  <h2>Order #{order._id}</h2>
                  <p className="order-detail-subtitle">Placed on {formatDate(order.createdAt)}</p>
                </div>
                <div className="order-detail-tag">{order.deliveryMethod || "Standard Delivery"}</div>
              </div>

              <div className="order-detail-grid">
                <div className="order-detail-box">
                  <span className="box-label">Order Status</span>
                  <p className="box-value">{order.status || "Order Placed"}</p>
                </div>
                <div className="order-detail-box">
                  <span className="box-label">Payment</span>
                  <p className="box-value">{order.paymentMethod || "COD"}</p>
                </div>
                <div className="order-detail-box">
                  <span className="box-label">Total Paid</span>
                  <p className="box-value">₹{order.totalPrice || 0}</p>
                </div>
              </div>

              <div className="order-detail-box full-width">
                <span className="box-label">Delivery Address</span>
                <p className="box-value">{order.buyerAddress || "Not available"}</p>
              </div>

              {sellerInfo()?.length > 0 && (
                <div className="order-detail-box full-width seller-box">
                  <span className="box-label">Seller{sellerInfo().length > 1 ? "s" : ""}</span>
                  {sellerInfo().map((seller, idx) => (
                    <div key={idx} className="seller-row">
                      <p className="box-value">{seller.sellerName || "Seller"}</p>
                      <span>{seller.sellerEmail || "—"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="order-detail-card">
              <h3>Product Details</h3>
              <div className="order-detail-table-wrap">
                <table className="order-detail-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="product-cell">
                          <img src={item.productImage || "https://via.placeholder.com/80"} alt={item.productName} />
                          <div>
                            <strong>{item.productName}</strong>
                            <p>{item.sellerName || "Seller"}</p>
                          </div>
                        </td>
                        <td>{item.quantity}</td>
                        <td>₹{item.price}</td>
                        <td>₹{item.price * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="order-detail-card">
              <h3>Order Timeline</h3>
              <div className="order-timeline">
                <div className="timeline-step completed">
                  <div className="timeline-icon"><FaCheckCircle /></div>
                  <div>
                    <strong>Order Placed</strong>
                    <p>{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <div className={`timeline-step ${order.sellerAcceptedAt ? "completed" : "pending"}`}>
                  <div className="timeline-icon"><FaTruck /></div>
                  <div>
                    <strong>Seller Accepted</strong>
                    <p>{order.sellerAcceptedAt ? formatDate(order.sellerAcceptedAt) : "Pending"}</p>
                  </div>
                </div>
                <div className={`timeline-step ${order.shippedAt ? "completed" : "pending"}`}>
                  <div className="timeline-icon"><FaTruck /></div>
                  <div>
                    <strong>Shipped</strong>
                    <p>{order.shippedAt ? formatDate(order.shippedAt) : "Pending"}</p>
                  </div>
                </div>
                <div className={`timeline-step ${order.deliveredAt ? "completed" : "pending"}`}>
                  <div className="timeline-icon"><FaBoxOpen /></div>
                  <div>
                    <strong>Delivered</strong>
                    <p>{order.deliveredAt ? formatDate(order.deliveredAt) : "Pending"}</p>
                  </div>
                </div>
                {order.status === "Cancelled" && (
                  <div className="timeline-step cancelled">
                    <div className="timeline-icon"><FaTimesCircle /></div>
                    <div>
                      <strong>Cancelled</strong>
                      <p>{formatDate(order.cancelledAt)}</p>
                    </div>
                  </div>
                )}
                {order.status === "Return Requested" && (
                  <div className="timeline-step warning">
                    <div className="timeline-icon"><FaTimesCircle /></div>
                    <div>
                      <strong>Return Requested</strong>
                      <p>{formatDate(order.returnRequestedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="order-detail-card" style={{ padding: "20px" }}>
              <h3><FaMapMarkedAlt style={{ marginRight: "10px", color: "#ff1493" }} />Live Tracking</h3>
              <div style={{ padding: "12px", background: "#fff5f7", borderRadius: 6 }}>
                Live tracking has been removed. Use the delivery details or open the delivery address in Maps.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default OrderDetails;
