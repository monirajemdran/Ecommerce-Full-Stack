import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./AdminTables.css";

const AdminOffers = () => {
  // State for new offer product form
  const [newTitle, setNewTitle] = useState('');
  const [newOriginalPrice, setNewOriginalPrice] = useState('');
  const [newDiscountPrice, setNewDiscountPrice] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);

  // Existing states
  const [offerProducts, setOfferProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOfferProducts();
  }, []);

  const fetchOfferProducts = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get("https://shopverse-m5i8.onrender.com/api/admin/products", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOfferProducts(res.data.filter(p => p.isOffer));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProduct = async (id) => {
    const { value: couponCode } = await Swal.fire({
      title: "Approve Offer Product",
      input: "text",
      inputLabel: "Enter a Coupon Code (optional)",
      inputPlaceholder: "e.g., SUMMER50",
      showCancelButton: true
    });

    if (couponCode !== undefined) {
      try {
        const token = localStorage.getItem("userToken");
        await axios.put(
          `https://shopverse-m5i8.onrender.com/api/admin/products/${id}/approve`,
          { couponCode },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire("Approved!", "Offer Product has been approved.", "success");
        fetchOfferProducts();
      } catch (err) {
        Swal.fire("Error", "Failed to approve product", "error");
      }
    }
  };

  const handleUpdateCouponCode = async (id, currentCoupon) => {
    const { value: couponCode } = await Swal.fire({
      title: "Add/Update Coupon Code",
      input: "text",
      inputLabel: "Enter a Coupon Code",
      inputValue: currentCoupon || "",
      inputPlaceholder: "e.g., SUMMER50",
      showCancelButton: true
    });

    if (couponCode !== undefined) {
      try {
        const token = localStorage.getItem("userToken");
        await axios.put(
          `https://shopverse-m5i8.onrender.com/api/admin/products/${id}/coupon`,
          { couponCode },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire("Success", "Coupon code updated successfully.", "success");
        fetchOfferProducts();
      } catch (err) {
        Swal.fire("Error", "Failed to update coupon code", "error");
      }
    }
  };

  const handleDeleteProduct = async (id) => {
    Swal.fire({
      title: "Delete Product?",
      text: "Are you sure you want to delete this offer product?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("userToken");
          await axios.delete(`https://shopverse-m5i8.onrender.com/api/admin/products/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          Swal.fire("Deleted!", "Product has been deleted.", "success");
          fetchOfferProducts();
        } catch (err) {
          Swal.fire("Error", "Failed to delete product", "error");
        }
      }
    });
  };

  // Handler for new offer image selection
  const handleNewImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewImageFile(file);
    if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    setNewImagePreview(URL.createObjectURL(file));
  };

  // Submit new offer product
  const handleAddOffer = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newOriginalPrice || !newDiscountPrice || !newImageFile) {
      Swal.fire("Error", "All fields are required.", "error");
      return;
    }
    const formData = new FormData();
    formData.append("title", newTitle.trim());
    formData.append("originalPrice", newOriginalPrice);
    formData.append("discountPrice", newDiscountPrice);
    formData.append("image", newImageFile);
    formData.append("isOffer", true);
    setSubmittingOffer(true);
    try {
      const token = localStorage.getItem("userToken");
      await axios.post(`https://shopverse-m5i8.onrender.com/api/admin/products`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      Swal.fire({ icon: "success", title: "Offer added", timer: 1500, showConfirmButton: false });
      // Reset form fields
      setNewTitle("");
      setNewOriginalPrice("");
      setNewDiscountPrice("");
      setNewImageFile(null);
      if (newImagePreview) URL.revokeObjectURL(newImagePreview);
      setNewImagePreview("");
      fetchOfferProducts();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to add offer", "error");
    } finally {
      setSubmittingOffer(false);
    }
  };

  if (loading) return <div>Loading offers...</div>;

  return (
    <div className="admin-table-container">
      <h2>Offer Products Approvals</h2>
      <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "-8px" }}>
        Manage seller offer products. For homepage slider images, use the Banners tab.
      </p>

      {/* New Offer Product Form */}
      <form className="offer-form" onSubmit={handleAddOffer} style={{ marginBottom: "24px", display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <input type="text" placeholder="Product Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
        <input type="number" placeholder="Original Price" value={newOriginalPrice} onChange={(e) => setNewOriginalPrice(e.target.value)} required />
        <input type="number" placeholder="Discount Price" value={newDiscountPrice} onChange={(e) => setNewDiscountPrice(e.target.value)} required />
        <label className="offer-file-label" style={{ cursor: "pointer", background: "#f3f4f6", padding: "8px", borderRadius: "4px", textAlign: "center" }}>
          <span>{newImageFile ? newImageFile.name : "Choose Image"}</span>
          <input type="file" accept="image/*" onChange={handleNewImageChange} style={{ display: "none" }} required />
        </label>
        {newImagePreview && (
          <div style={{ gridColumn: "span 2" }}>
            <img src={newImagePreview} alt="Preview" style={{ width: "100%", maxHeight: "150px", objectFit: "cover", borderRadius: "4px" }} />
          </div>
        )}
        <button type="submit" disabled={submittingOffer} style={{ gridColumn: "span 2", padding: "8px", background: "#10b981", color: "white", border: "none", borderRadius: "4px" }}>
          {submittingOffer ? "Adding..." : "Add Offer Product"}
        </button>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Name</th>
            <th>Seller</th>
            <th>Original / Offer Price</th>
            <th>Coupon Code</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {offerProducts.map(p => (
            <tr key={p._id}>
              <td><img src={p.image} alt={p.name} className="product-thumb" style={{ width: "60px", borderRadius: "8px" }} /></td>
              <td style={{ fontWeight: "bold" }}>{p.name}</td>
              <td>{p.sellerName || "Unknown"}</td>
              <td>₹{p.originalPrice} / <span style={{ color: "#10b981", fontWeight: "bold" }}>₹{p.discountPrice}</span></td>
              <td>{p.couponCode || "None"}</td>
              <td>
                <span className={`status-badge ${p.approved ? "delivered" : "pending"}`}>
                  {p.approved ? "Approved" : "Pending"}
                </span>
              </td>
              <td>
                <button 
                  className="delete-btn" 
                  style={{ backgroundColor: "#3b82f6", marginRight: "10px" }}
                  onClick={() => handleUpdateCouponCode(p._id, p.couponCode)}
                >
                  Add Coupon Code
                </button>
                <br/>
                {!p.approved && (
                  <button 
                    className="delete-btn" 
                    style={{ backgroundColor: "#10b981", marginRight: "10px" }}
                    onClick={() => handleApproveProduct(p._id)}
                  >
                    Approve
                  </button>
                )}
                <button className="delete-btn" onClick={() => handleDeleteProduct(p._id)}>Delete</button>
              </td>
            </tr>
          ))}
          {offerProducts.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>No offer products found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminOffers;

