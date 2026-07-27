import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./AdminTables.css";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get("https://shopverse-m5i8.onrender.com/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      const token = localStorage.getItem("userToken");
      await axios.put(`https://shopverse-m5i8.onrender.com/api/admin/users/${id}/role`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({
        icon: "success",
        title: "Role Updated",
        text: `User role changed to ${newRole}`,
        timer: 1500,
        showConfirmButton: false
      });
      fetchUsers();
    } catch (err) {
      Swal.fire("Error", "Failed to update role", "error");
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Delete User?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete them!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("userToken");
          await axios.delete(`https://shopverse-m5i8.onrender.com/api/admin/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          Swal.fire("Deleted!", "User has been removed.", "success");
          fetchUsers();
        } catch (err) {
          Swal.fire("Error", "Failed to delete user", "error");
        }
      }
    });
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="admin-table-container">
      <h2>User Management</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Profile</th>
            <th>Name</th>
            <th>Email</th>
            <th>Mobile</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>
                <img 
                  src={u.profileImage || "https://via.placeholder.com/50"} 
                  alt={u.name} 
                  className="product-thumb" 
                  style={{ borderRadius: "50%" }}
                />
              </td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.mobile || "N/A"}</td>
              <td>
                <select 
                  value={u.role} 
                  onChange={(e) => handleRoleChange(u._id, e.target.value)}
                  className="status-select"
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                </select>
              </td>
              <td>
                <button className="delete-btn" onClick={() => handleDelete(u._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsers;

