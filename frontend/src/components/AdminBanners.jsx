import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./AdminBanners.css";
import "./AdminTables.css";

const API = "http://localhost:5000/api/admin";

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [discount, setDiscount] = useState("");
  const [coupon, setCoupon] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewSlide, setPreviewSlide] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const activeBanners = banners.filter((b) => b.isActive && b.image);

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (activeBanners.length === 0) return;
    const interval = setInterval(() => {
      setPreviewSlide((prev) => (prev + 1) % activeBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const fetchBanners = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get(`${API}/banners`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBanners(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load banners", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !imageFile) {
      Swal.fire("Error", "Title and image are required", "error");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("discountPercentage", discount || 0);
    formData.append("couponCode", coupon);
    formData.append("image", imageFile);

    setSubmitting(true);
    try {
      const token = localStorage.getItem("userToken");
      await axios.post(`${API}/banners`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      Swal.fire({ icon: "success", title: "Banner added to slider", timer: 1500, showConfirmButton: false });
      setTitle("");
      setDiscount("");
      setCoupon("");
      setImageFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      e.target.reset();
      fetchBanners();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to upload banner", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem("userToken");
      await axios.put(
        `${API}/banners/${id}/status`,
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBanners();
    } catch {
      Swal.fire("Error", "Failed to update banner status", "error");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Banner?",
      text: "This will remove it from the home slider.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete",
    });
    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("userToken");
      await axios.delete(`${API}/banners/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire("Deleted", "Banner removed from slider", "success");
      fetchBanners();
    } catch {
      Swal.fire("Error", "Failed to delete banner", "error");
    }
  };

  if (loading) return <div className="admin-table-container">Loading banners...</div>;

  return (
    <div className="admin-table-container admin-banners-page">
      <h2>Homepage Slider Banners</h2>
      <p className="admin-banners-hint">
        Upload images here. Active banners appear in the slider on the store home page.
      </p>

      <div className="admin-banners-layout">
        <form className="banner-upload-form" onSubmit={handleSubmit}>
          <h3>Add New Banner</h3>
          <input
            type="text"
            placeholder="Banner title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Discount % (optional)"
            value={discount}
            min="0"
            max="100"
            onChange={(e) => setDiscount(e.target.value)}
          />
          <input
            type="text"
            placeholder="Coupon code (optional)"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
          />
          <label className="banner-file-label">
            <span>Choose banner image</span>
            <input type="file" accept="image/*" onChange={handleImageChange} required />
          </label>
          {previewUrl && (
            <div className="banner-local-preview">
              <img src={previewUrl} alt="Selected preview" />
              <span>New upload preview</span>
            </div>
          )}
          <button type="submit" className="banner-upload-btn" disabled={submitting}>
            {submitting ? "Uploading..." : "Upload & Add to Slider"}
          </button>
        </form>

        <div className="admin-slider-preview-wrap">
          <h3>Slider Preview (active banners)</h3>
          <div className="admin-slider-container">
            {activeBanners.length > 0 ? (
              <>
                <img
                  src={activeBanners[previewSlide]?.image}
                  alt={activeBanners[previewSlide]?.title}
                  className="admin-slider-image"
                />
                <div className="admin-slider-controls">
                  {activeBanners.map((_, idx) => (
                    <span
                      key={idx}
                      className={`admin-slider-dot ${previewSlide === idx ? "active" : ""}`}
                      onClick={() => setPreviewSlide(idx)}
                    />
                  ))}
                </div>
                <div className="admin-slider-caption">
                  {activeBanners[previewSlide]?.title}
                </div>
              </>
            ) : (
              <div className="admin-slider-empty">No active banners yet. Upload one above.</div>
            )}
          </div>
        </div>
      </div>

      <h3 style={{ marginTop: "32px" }}>All Banners</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Preview</th>
            <th>Title</th>
            <th>Discount</th>
            <th>Coupon</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {banners.map((b) => (
            <tr key={b._id} style={{ opacity: b.isActive ? 1 : 0.6 }}>
              <td>
                {b.image ? (
                  <img src={b.image} alt={b.title} className="product-thumb" style={{ width: "100px", height: "56px", objectFit: "cover", borderRadius: "8px" }} />
                ) : (
                  "—"
                )}
              </td>
              <td style={{ fontWeight: "bold" }}>{b.title}</td>
              <td>{b.discountPercentage || 0}% Off</td>
              <td>{b.couponCode || "None"}</td>
              <td>
                <span className={`status-badge ${b.isActive ? "delivered" : "cancelled"}`}>
                  {b.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td>
                <button
                  className="delete-btn"
                  style={{ backgroundColor: b.isActive ? "#f59e0b" : "#10b981", marginRight: "10px" }}
                  onClick={() => handleToggleStatus(b._id, b.isActive)}
                >
                  {b.isActive ? "Deactivate" : "Activate"}
                </button>
                <br/>
                <button className="delete-btn" onClick={() => handleDelete(b._id)}>Delete</button>
              </td>
            </tr>
          ))}
          {banners.length === 0 && (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                No banners yet. Upload an image to add your first slider banner.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminBanners;
