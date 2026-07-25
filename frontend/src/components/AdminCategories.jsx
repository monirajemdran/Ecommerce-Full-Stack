import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./AdminTables.css";

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get("http://localhost:5000/api/admin/categories", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName) return Swal.fire("Error", "Category name is required", "error");

    setUploading(true);
    try {
      const token = localStorage.getItem("userToken");
      const formData = new FormData();
      formData.append("name", newCatName);
      formData.append("description", newCatDesc);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      await axios.post("http://localhost:5000/api/admin/categories", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      Swal.fire({
        icon: "success",
        title: "Category Added",
        timer: 1500,
        showConfirmButton: false
      });
      setNewCatName("");
      setNewCatDesc("");
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchCategories();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to add category", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateImage = async (categoryId) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const token = localStorage.getItem("userToken");
        const formData = new FormData();
        formData.append("image", file);
        // Send existing fields so they don't get overwritten
        const cat = categories.find(c => c._id === categoryId);
        if (cat) {
          formData.append("name", cat.name);
          formData.append("description", cat.description || "");
        }

        await axios.put(`http://localhost:5000/api/admin/categories/${categoryId}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        });
        Swal.fire({
          icon: "success",
          title: "Image Updated!",
          timer: 1200,
          showConfirmButton: false
        });
        fetchCategories();
      } catch (err) {
        Swal.fire("Error", "Failed to update image", "error");
      }
    };
    fileInput.click();
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Delete Category?",
      text: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("userToken");
          await axios.delete(`http://localhost:5000/api/admin/categories/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          Swal.fire("Deleted!", "Category has been removed.", "success");
          fetchCategories();
        } catch (err) {
          Swal.fire("Error", "Failed to delete category", "error");
        }
      }
    });
  };

  if (loading) return <div>Loading categories...</div>;

  return (
    <div className="admin-table-container">
      <h2>Category Management</h2>
      <p style={{ color: "#64748b", marginBottom: "20px" }}>Add categories with images — these appear as category circles on the homepage.</p>

      {/* ADD CATEGORY FORM */}
      <form onSubmit={handleAddCategory} style={{
        marginBottom: "30px",
        background: "#f8fafc",
        padding: "20px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0"
      }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1", minWidth: "180px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#334155", fontSize: "13px" }}>Category Name *</label>
            <input
              type="text"
              placeholder="e.g. Electronics"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="status-select"
              style={{ padding: "10px 12px", width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ flex: "1.5", minWidth: "200px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#334155", fontSize: "13px" }}>Description</label>
            <input
              type="text"
              placeholder="Brief description (optional)"
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
              className="status-select"
              style={{ padding: "10px 12px", width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ minWidth: "200px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#334155", fontSize: "13px" }}>Category Image</label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              style={{
                padding: "8px",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                background: "#fff",
                cursor: "pointer",
                width: "100%",
                boxSizing: "border-box",
                fontSize: "13px"
              }}
            />
          </div>
          {imagePreview && (
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "3px solid #3b82f6",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(59,130,246,0.3)"
            }}>
              <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <button
            type="submit"
            className="delete-btn"
            disabled={uploading}
            style={{
              backgroundColor: "#3b82f6",
              padding: "10px 24px",
              whiteSpace: "nowrap",
              opacity: uploading ? 0.6 : 1
            }}
          >
            {uploading ? "Uploading..." : "➕ Add Category"}
          </button>
        </div>
      </form>

      {/* CATEGORIES TABLE */}
      <table className="admin-table">
        <thead>
          <tr>
            <th style={{ width: "80px" }}>Image</th>
            <th>Name</th>
            <th>Description</th>
            <th style={{ width: "200px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(c => (
            <tr key={c._id}>
              <td>
                <div style={{
                  width: "55px",
                  height: "55px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: c.image ? "3px solid #3b82f6" : "3px dashed #cbd5e1",
                  margin: "0 auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: c.image ? "transparent" : "#f1f5f9",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: c.image ? "0 2px 8px rgba(59,130,246,0.2)" : "none"
                }}
                  onClick={() => handleUpdateImage(c._id)}
                  title="Click to change image"
                >
                  {c.image ? (
                    <img src={c.image} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: "20px", color: "#94a3b8" }}>📷</span>
                  )}
                </div>
              </td>
              <td style={{ fontWeight: "bold" }}>{c.name}</td>
              <td>{c.description || "N/A"}</td>
              <td>
                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                  <button
                    className="delete-btn"
                    style={{ backgroundColor: "#3b82f6", fontSize: "12px", padding: "6px 12px" }}
                    onClick={() => handleUpdateImage(c._id)}
                  >
                    🖼️ Change Image
                  </button>
                  <button
                    className="delete-btn"
                    style={{ fontSize: "12px", padding: "6px 12px" }}
                    onClick={() => handleDelete(c._id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {categories.length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>No categories found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminCategories;
