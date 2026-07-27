import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

function AdminBannerUpload() {
  const [title, setTitle] = useState("");
  const [discount, setDiscount] = useState(0);
  const [coupon, setCoupon] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !imageFile) {
      Swal.fire({ icon: "error", title: "Missing fields", text: "Title and image are required" });
      return;
    }
    const formData = new FormData();
    formData.append("title", title);
    formData.append("discountPercentage", discount);
    formData.append("couponCode", coupon);
    formData.append("image", imageFile);

    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.post("https://shopverse-m5i8.onrender.com/api/admin/banners", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (res.data.success) {
        Swal.fire({ icon: "success", title: "Banner added", timer: 1500 });
        // Reset fields
        setTitle("");
        setDiscount(0);
        setCoupon("");
        setImageFile(null);
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.message || err.message });
    }
  };

  return (
    <div className="admin-banner-upload">
      <h2>Upload New Slider Banner</h2>
      <form onSubmit={handleSubmit} className="banner-form">
        <input
          type="text"
          placeholder="Banner Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Discount %"
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
        />
        <input
          type="text"
          placeholder="Coupon Code (optional)"
          value={coupon}
          onChange={(e) => setCoupon(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
          required
        />
        <button type="submit">Upload Banner</button>
      </form>
    </div>
  );
}

export default AdminBannerUpload;

