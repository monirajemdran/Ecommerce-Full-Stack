import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./AdminTables.css";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get("https://shopverse-m5i8.onrender.com/api/admin/products", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem("userToken");
      await axios.put(`https://shopverse-m5i8.onrender.com/api/admin/products/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({
        title: "Approved!",
        text: "Product is now live for buyers.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });
      fetchProducts();
    } catch (err) {
      Swal.fire("Error!", "Failed to approve product.", "error");
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("userToken");
          await axios.delete(`https://shopverse-m5i8.onrender.com/api/admin/products/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          Swal.fire("Deleted!", "Product has been deleted.", "success");
          fetchProducts();
        } catch (err) {
          Swal.fire("Error!", "Failed to delete product.", "error");
        }
      }
    });
  };

  if (loading) return <div>Loading products...</div>;

  return (
    <div className="admin-table-container">
      <h2>Product Management</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Seller</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p._id}>
              <td><img src={p.image} alt={p.name} className="product-thumb" /></td>
              <td>{p.name}</td>
              <td>{p.category}</td>
              <td>₹{p.discountPrice || p.originalPrice || 0}</td>
              <td>{p.stock !== undefined ? p.stock : "N/A"}</td>
              <td>{p.sellerName || "Unknown"}</td>
              <td>
                {p.approved !== false ? (
                  <span className="status-badge approved">Approved</span>
                ) : (
                  <div className="status-action-box">
                    <span className="status-badge pending">Pending</span>
                    <button className="approve-btn" onClick={() => handleApprove(p._id)}>
                      Approve
                    </button>
                  </div>
                )}
              </td>
              <td>
                <button className="delete-btn" onClick={() => handleDelete(p._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminProducts;

