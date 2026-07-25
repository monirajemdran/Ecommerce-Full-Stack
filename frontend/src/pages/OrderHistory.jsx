import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { FaShoppingBag, FaTimesCircle, FaBoxOpen, FaStar } from "react-icons/fa";
import Navbar from "../components/Navbar";
import "./OrderHistory.css";

function getProductIdFromItem(item) {
  if (!item?.productId) return null;
  if (typeof item.productId === "object" && item.productId._id) {
    return item.productId._id;
  }
  return item.productId;
}

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [reviewModal, setReviewModal] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const navigate = useNavigate();
  const [reviewRating, setReviewRating] = useState(5);
  const [sendingReview, setSendingReview] = useState(false);

  const [returnModal, setReturnModal] = useState(null);
  const [returnReason, setReturnReason] = useState("Damaged Product");
  const [returnDescription, setReturnDescription] = useState("");
  const [returnImages, setReturnImages] = useState([]);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const fetchOrders = () => {
    if (!user?._id) return;
    axios
      .get(`http://localhost:5000/api/orders/buyer/${user._id}`)
      .then((res) => setOrders(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const cancelOrder = async (id) => {
    try {
      const result = await Swal.fire({
        title: "Cancel Order?",
        text: "This will mark the order as cancelled in your history.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ff1493",
        cancelButtonColor: "#000",
        confirmButtonText: "Yes, cancel it!",
      });

      if (result.isConfirmed) {
        const res = await axios.put(`http://localhost:5000/api/orders/${id}/cancel`);
        setOrders(orders.map((order) => (order._id === id ? res.data : order)));
        Swal.fire("Cancelled!", "Your order has been marked as Cancelled.", "success");
      }
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Could not cancel the order.", "error");
      console.error(err);
    }
  };

  const openReviewModal = async (order, item) => {
    const productId = getProductIdFromItem(item);
    if (!productId) {
      Swal.fire("Unavailable", "This line item has no product link for a review.", "info");
      return;
    }
    let merged = { ...item };
    if (!merged.sellerName || !merged.sellerEmail) {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/products/${productId}`
        );
        merged = {
          ...merged,
          sellerName: merged.sellerName || res.data?.sellerName || "—",
          sellerEmail: merged.sellerEmail || res.data?.sellerEmail || "—",
        };
      } catch {
        merged = {
          ...merged,
          sellerName: merged.sellerName || "—",
          sellerEmail: merged.sellerEmail || "—",
        };
      }
    }
    setReviewModal({ order, item: merged });
    setReviewText("");
    setReviewRating(5);
  };

  const closeReviewModal = () => {
    setReviewModal(null);
    setReviewText("");
    setReviewRating(5);
    setSendingReview(false);
  };

  const openReturnModal = (order, item) => {
    setReturnModal({ order, item });
    setReturnReason("Damaged Product");
    setReturnDescription("");
    setReturnImages([]);
  };

  const closeReturnModal = () => {
    setReturnModal(null);
    setReturnReason("Damaged Product");
    setReturnDescription("");
    setReturnImages([]);
    setSubmittingReturn(false);
  };

  const handleReturnImageChange = (e) => {
    if (e.target.files) {
      setReturnImages(Array.from(e.target.files));
    }
  };

  const submitReturn = async (e) => {
    e.preventDefault();
    if (!user?._id || !user?.token || !returnModal) return;
    const productId = getProductIdFromItem(returnModal.item);
    if (!productId) return;
    
    setSubmittingReturn(true);
    try {
      const formData = new FormData();
      formData.append("orderId", returnModal.order._id);
      formData.append("productId", productId);
      formData.append("reason", returnReason);
      formData.append("description", returnDescription);
      returnImages.forEach((img) => formData.append("images", img));

      await axios.post("http://localhost:5000/api/returns/request", formData, {
        headers: { "Content-Type": "multipart/form-data", "Authorization": `Bearer ${user.token}` } 
      });

      Swal.fire("Return Requested", "Your return request has been submitted successfully.", "success");
      closeReturnModal();
      fetchOrders(); // Refresh to update item status
    } catch (err) {
      const msg = err.response?.data?.message || "Could not submit return request.";
      Swal.fire("Error", msg, "error");
    } finally {
      setSubmittingReturn(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user?._id || !reviewModal) return;
    const productId = getProductIdFromItem(reviewModal.item);
    if (!productId) return;
    const trimmed = reviewText.trim();
    if (!trimmed) {
      Swal.fire("Required", "Please write your review.", "warning");
      return;
    }

    setSendingReview(true);
    try {
      await axios.post("http://localhost:5000/api/reviews", {
        productId,
        userId: user._id,
        rating: Number(reviewRating),
        comment: trimmed,
        sellerName: reviewModal.item.sellerName || "",
        sellerEmail: reviewModal.item.sellerEmail || "",
      });
      Swal.fire({
        icon: "success",
        title: "Review sent",
        text: "Your review will appear in admin review management.",
        timer: 2000,
        showConfirmButton: false,
      });
      closeReviewModal();
    } catch (err) {
      const msg = err.response?.data?.message || "Could not submit review.";
      Swal.fire("Error", msg, "error");
    } finally {
      setSendingReview(false);
    }
  };

  if (!user) {
    return (
      <div className="orders-page">
        <Navbar />
        <div className="orders-container">
          <p className="empty-msg">Please log in to view your purchase history.</p>
        </div>
      </div>
    );
  }

  const modalBuyerName =
    reviewModal?.order?.buyerName || user.name || "—";
  const modalBuyerEmail =
    reviewModal?.order?.buyerEmail || user.email || "—";
  const groupedOrders = [];
  const groupMap = {};
  orders.forEach((o) => {
    const key = o.buyerOTP || o._id;
    if (!groupMap[key]) {
      groupMap[key] = [];
      groupedOrders.push(groupMap[key]);
    }
    groupMap[key].push(o);
  });

  return (
    <div className="orders-page">
      <Navbar />
      <div className="orders-container">
        <h1 className="page-title">
          My Purchase History{" "}
          <FaShoppingBag style={{ color: "#ff1493" }} />
        </h1>

        <div className="table-responsive">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Products</th>
                <th>Quantity</th>
                <th>Total Price</th>
                <th>Status</th>
                <th>Confirmation OTP</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {groupedOrders.map((group) =>
                  group.map((order, idx) => (
                    <tr key={order._id} style={idx > 0 ? { borderTop: "1px dashed #e2e8f0" } : {}}>
                      {idx === 0 && (
                        <>
                          <td className="order-id" rowSpan={group.length} style={{ verticalAlign: "middle", borderBottom: "1px solid #cbd5e1" }}>
                            <div className="seller-info-cell">
                              <div><strong>Seller:</strong> {order.items?.[0]?.sellerName || "Seller"}</div>
                              <div className="seller-email">{order.items?.[0]?.sellerEmail || "—"}</div>
                            </div>
                            <div className="order-id-text">#{group[0]._id}</div>
                            {group[0].deliveryMethod === "Express Delivery" && (
                              <span style={{ display: "block", color: "#d97706", backgroundColor: "#fef3c7", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold", marginTop: "4px", textAlign: "center" }}>
                                ⚡ Express
                              </span>
                            )}
                          </td>
                          <td rowSpan={group.length} style={{ verticalAlign: "middle", borderBottom: "1px solid #cbd5e1" }}>{new Date(group[0].createdAt).toLocaleDateString()}</td>
                        </>
                      )}
                      <td className="products-cell">
                        <div className="mini-products-list">
                          {order.items?.map((item, i) => (
                            <div key={i} className="mini-item">
                              <div className="mini-item-left">
                                <img
                                  src={item.productImage}
                                  alt=""
                                  className="table-img"
                                />
                                <button
                                  type="button"
                                  className="order-item-link"
                                  onClick={() => navigate(`/orders/${order._id}`)}
                                >
                                  {item.productName}
                                </button>
                              </div>
                              <button
                                type="button"
                                className="review-open-btn"
                                onClick={() => openReviewModal(order, item)}
                              >
                                Reviews
                              </button>
                              {order.status === "Delivered" && !item.isReturned && (
                                <button 
                                  type="button" 
                                  style={{ marginLeft: "10px", background: "#ef4444", color: "white", padding: "4px 8px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}
                                  onClick={() => openReturnModal(order, item)}
                                >
                                  Return Product
                                </button>
                              )}
                              {item.isReturned && (
                                <div style={{ marginLeft: "10px", fontSize: "0.8rem", color: "#d97706", fontWeight: "bold", padding: "4px 8px", background: "#fef3c7", borderRadius: "4px" }}>
                                  {item.itemStatus}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="view-order-btn"
                          onClick={() => navigate(`/orders/${order._id}`)}
                        >
                          View Order Details
                        </button>
                      </td>
                      <td>
                        {order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0} Items
                      </td>
                      <td className="price-bold">₹ {order.totalPrice}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            order.status === "Pending" || !order.status
                              ? "order-placed"
                              : order.status.toLowerCase().replace(/\s+/g, "-")
                          }`}
                        >
                          {order.status === "Pending" || !order.status
                            ? "Order Placed"
                            : order.status}
                        </span>
                      </td>
                      {idx === 0 && (
                        <td rowSpan={group.length} style={{ verticalAlign: "middle", borderBottom: "1px solid #cbd5e1" }}>
                          <span
                            className="otp-badge"
                            style={{
                              background: "#fff1f2",
                              border: "1px dashed #fda4af",
                              color: "#be123c",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontWeight: "800",
                              fontSize: "0.95rem",
                              letterSpacing: "1px",
                            }}
                          >
                            {group[0].buyerOTP || "N/A"}
                          </span>
                        </td>
                      )}
                      <td>
                        {(order.status !== "Delivered" && order.status !== "Cancelled" && order.status !== "Return Requested") ? (
                          <button
                            className="cancel-row-btn"
                            onClick={() => cancelOrder(order._id)}
                          >
                            Cancel <FaTimesCircle />
                          </button>
                        ) : (
                          <span style={{ fontSize: "0.9rem", color: "#64748b" }}>
                            {order.status === "Cancelled" ? "Cancelled" : "Not cancellable"}
                          </span>
                        )}
                        {order.deliveredAt && (
                          <div className="delivered-date">
                            Delivered: {new Date(order.deliveredAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-msg">
                    <FaBoxOpen
                      size={40}
                      style={{ display: "block", margin: "0 auto 10px" }}
                    />
                    No orders found yet. Start shopping!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="orders-mobile-list">
          {groupedOrders.map((group) =>
            group.map((order, idx) => (
              <article key={order._id} className="order-mobile-card">
                <div className="order-mobile-head">
                  <div>
                    <span className="order-mobile-label">Order ID</span>
                    <strong>#{order._id}</strong>
                  </div>
                  <span
                    className={`status-badge ${
                      order.status === "Pending" || !order.status
                        ? "order-placed"
                        : order.status.toLowerCase().replace(/\s+/g, "-")
                    }`}
                  >
                    {order.status === "Pending" || !order.status
                      ? "Order Placed"
                      : order.status}
                  </span>
                </div>

                <div className="order-mobile-meta">
                  <div>
                    <span className="order-mobile-label">Seller</span>
                    <p>{order.items?.[0]?.sellerName || "Seller"}</p>
                    <small>{order.items?.[0]?.sellerEmail || "N/A"}</small>
                  </div>
                  <div>
                    <span className="order-mobile-label">Date</span>
                    <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  {idx === 0 && (
                    <div>
                      <span className="order-mobile-label">OTP</span>
                      <p className="otp-badge">{group[0].buyerOTP || "N/A"}</p>
                    </div>
                  )}
                  <div>
                    <span className="order-mobile-label">Total</span>
                    <p className="price-bold">Rs. {order.totalPrice}</p>
                  </div>
                </div>

                <div className="mini-products-list">
                  {order.items?.map((item, i) => (
                    <div key={i} className="mini-item mobile">
                      <div className="mini-item-left">
                        <img src={item.productImage} alt="" className="table-img" />
                        <button
                          type="button"
                          className="order-item-link"
                          onClick={() => navigate(`/orders/${order._id}`)}
                        >
                          {item.productName}
                        </button>
                      </div>
                      <div className="order-mobile-actions">
                        <button
                          type="button"
                          className="review-open-btn"
                          onClick={() => openReviewModal(order, item)}
                        >
                          Reviews
                        </button>
                        {order.status === "Delivered" && !item.isReturned && (
                          <button
                            type="button"
                            className="return-open-btn"
                            onClick={() => openReturnModal(order, item)}
                          >
                            Return Product
                          </button>
                        )}
                        {item.isReturned && (
                          <span className="return-status-chip">{item.itemStatus}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-mobile-footer">
                  <button
                    type="button"
                    className="view-order-btn"
                    onClick={() => navigate(`/orders/${order._id}`)}
                  >
                    View Order Details
                  </button>
                  {(order.status !== "Delivered" && order.status !== "Cancelled" && order.status !== "Return Requested") ? (
                    <button
                      className="cancel-row-btn"
                      onClick={() => cancelOrder(order._id)}
                    >
                      Cancel <FaTimesCircle />
                    </button>
                  ) : (
                    <span className="order-mobile-note">
                      {order.status === "Cancelled" ? "Cancelled" : "Not cancellable"}
                    </span>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {reviewModal && (
        <div className="review-modal-overlay" onClick={closeReviewModal}>
          <div
            className="review-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
          >
            <button
              type="button"
              className="review-modal-close"
              onClick={closeReviewModal}
              aria-label="Close"
            >
              ×
            </button>
            <h2 id="review-modal-title" className="review-modal-title">
              Write a review
            </h2>

            <div className="review-modal-product">
              <img
                src={reviewModal.item.productImage}
                alt=""
                className="review-modal-img"
              />
              <div>
                <p className="review-modal-label">Product</p>
                <p className="review-modal-product-name">
                  {reviewModal.item.productName}
                </p>
              </div>
            </div>

            <div className="review-modal-buyer">
              <div>
                <p className="review-modal-label">Buyer name</p>
                <p className="review-modal-value">{modalBuyerName}</p>
              </div>
              <div>
                <p className="review-modal-label">Buyer email</p>
                <p className="review-modal-value">{modalBuyerEmail}</p>
              </div>
            </div>

            <div className="review-modal-seller">
              <div>
                <p className="review-modal-label">Seller name</p>
                <p className="review-modal-value">
                  {reviewModal.item.sellerName || "—"}
                </p>
              </div>
              <div>
                <p className="review-modal-label">Seller email</p>
                <p className="review-modal-value">
                  {reviewModal.item.sellerEmail || "—"}
                </p>
              </div>
            </div>

            <form onSubmit={submitReview} className="review-modal-form">
              <label className="review-modal-label" htmlFor="review-rating">
                Star rating (1–5)
              </label>
              <select
                id="review-rating"
                className="review-modal-select"
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
              >
                <option value={1}>1 star</option>
                <option value={2}>2 stars</option>
                <option value={3}>3 stars</option>
                <option value={4}>4 stars</option>
                <option value={5}>5 stars</option>
              </select>

              <div className="review-modal-star-preview" aria-hidden>
                {[1, 2, 3, 4, 5].map((n) => (
                  <FaStar
                    key={n}
                    style={{
                      color: n <= reviewRating ? "#fbbf24" : "#e5e7eb",
                      fontSize: "22px",
                    }}
                  />
                ))}
              </div>

              <label className="review-modal-label" htmlFor="review-comment">
                Your review
              </label>
              <textarea
                id="review-comment"
                className="review-modal-textarea"
                rows={4}
                placeholder="Share your experience with this product…"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />

              <div className="review-modal-actions">
                <button
                  type="button"
                  className="review-modal-btn secondary"
                  onClick={closeReviewModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="review-modal-btn primary"
                  disabled={sendingReview}
                >
                  {sendingReview ? "Sending…" : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {returnModal && (
        <div className="review-modal-overlay" onClick={closeReturnModal}>
          <div className="review-modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: "20px" }}>
            <button type="button" className="review-modal-close" onClick={closeReturnModal}>×</button>
            <h2 className="review-modal-title">Return Product</h2>

            <div className="review-modal-product" style={{ marginBottom: "15px" }}>
              <img src={returnModal.item.productImage} alt="" className="review-modal-img" />
              <div>
                <p className="review-modal-product-name">{returnModal.item.productName}</p>
                <p className="review-modal-label" style={{ marginTop: "5px" }}>Seller: {returnModal.item.sellerName || "—"}</p>
              </div>
            </div>

            <form onSubmit={submitReturn} className="review-modal-form">
              <label className="review-modal-label">Reason for Return</label>
              <select 
                className="review-modal-select" 
                value={returnReason} 
                onChange={(e) => setReturnReason(e.target.value)}
                style={{ marginBottom: "15px", padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
              >
                <option value="Damaged Product">Damaged Product</option>
                <option value="Wrong Product Received">Wrong Product Received</option>
                <option value="Defective Product">Defective Product</option>
                <option value="Missing Parts">Missing Parts</option>
                <option value="Size Issue">Size Issue</option>
                <option value="Quality Not Good">Quality Not Good</option>
                <option value="Other Reason">Other Reason</option>
              </select>

              <label className="review-modal-label">Description / Comments</label>
              <textarea
                className="review-modal-textarea"
                rows={3}
                placeholder="Explain the issue..."
                value={returnDescription}
                onChange={(e) => setReturnDescription(e.target.value)}
                style={{ marginBottom: "15px", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", width: "100%" }}
                required
              />

              <label className="review-modal-label">Upload Images (Max 3)</label>
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleReturnImageChange} 
                style={{ marginBottom: "20px", display: "block" }}
              />

              <div className="review-modal-actions">
                <button type="button" className="review-modal-btn secondary" onClick={closeReturnModal}>Cancel</button>
                <button type="submit" className="review-modal-btn primary" style={{ background: "#ef4444" }} disabled={submittingReturn}>
                  {submittingReturn ? "Submitting..." : "Submit Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderHistory;
