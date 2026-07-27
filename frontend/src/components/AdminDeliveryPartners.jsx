import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./AdminTables.css";
import "./AdminDeliveryPartners.css";

const AdminDeliveryPartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [available, setAvailable] = useState(true);
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get("https://shopverse-m5i8.onrender.com/api/admin/delivery-partners", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPartners(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditMode(false);
    setSelectedPartnerId(null);
    setName("");
    setEmail("");
    setPassword("");
    setMobile("");
    setVehicleNumber("");
    setAvailable(true);
    setAddress("");
    setLandmark("");
    setShowModal(true);
  };

  const openEditModal = (dp) => {
    setEditMode(true);
    setSelectedPartnerId(dp._id);
    setName(dp.name || "");
    setEmail(dp.email || "");
    setPassword(""); // Keep password blank unless they want to change it
    setMobile(dp.mobile || "");
    setVehicleNumber(dp.vehicleNumber || "");
    setAvailable(dp.available !== undefined ? dp.available : true);
    setAddress(dp.address || "");
    setLandmark(dp.landmark || "");
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("userToken");

    try {
      if (editMode) {
        // Edit Partner
        const payload = { name, email, mobile, vehicleNumber, available };
        if (password.trim() !== "") {
          payload.password = password;
        }

        await axios.put(`https://shopverse-m5i8.onrender.com/api/admin/delivery-partners/${selectedPartnerId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        Swal.fire({
          icon: "success",
          title: "Partner Updated",
          text: "Delivery partner details updated successfully!",
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        // Add Partner
        if (!password) {
          Swal.fire("Error", "Password is required for a new partner", "error");
          return;
        }

        const payload = { name, email, password, mobile, vehicleNumber, address, landmark };
        await axios.post("https://shopverse-m5i8.onrender.com/api/admin/delivery-partners", payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        Swal.fire({
          icon: "success",
          title: "Partner Registered",
          text: "New delivery partner registered successfully!",
          timer: 1500,
          showConfirmButton: false
        });
      }

      setShowModal(false);
      fetchPartners();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Operation failed", "error");
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Delete Partner?",
      text: "This action will remove the delivery partner from the system!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#3b82f6",
      confirmButtonText: "Yes, delete partner!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("userToken");
          await axios.delete(`https://shopverse-m5i8.onrender.com/api/admin/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          Swal.fire("Deleted!", "Delivery partner has been removed.", "success");
          fetchPartners();
        } catch (err) {
          Swal.fire("Error", "Failed to delete partner.", "error");
        }
      }
    });
  };

  const toggleAvailability = async (dp) => {
    try {
      const token = localStorage.getItem("userToken");
      const nextStatus = !dp.available;
      await axios.put(`https://shopverse-m5i8.onrender.com/api/admin/delivery-partners/${dp._id}`, {
        available: nextStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({
        icon: "success",
        title: "Status Toggle",
        text: `Driver status marked as ${nextStatus ? 'Online' : 'Offline'}`,
        timer: 1000,
        showConfirmButton: false
      });
      fetchPartners();
    } catch (err) {
      Swal.fire("Error", "Failed to update availability status.", "error");
    }
  };

  // Stats calculation
  const totalDrivers = partners.length;
  const onlineDrivers = partners.filter(p => p.available).length;
  const offlineDrivers = totalDrivers - onlineDrivers;
  const totalEarnings = partners.reduce((sum, p) => sum + (p.earnings || 0), 0);

  if (loading) return <div className="admin-loading" style={{ padding: "30px", textAlign: "center", fontSize: "16px", color: "#64748b" }}>Loading delivery partners...</div>;

  return (
    <div className="admin-table-container">
      <div className="delivery-header-section">
        <div>
          <h2 style={{ fontSize: "24px", color: "#1e293b", margin: 0, fontWeight: 700 }}>Delivery Partner Management</h2>
          <p className="subtitle" style={{ margin: "5px 0 0 0", fontSize: "14px", color: "#64748b" }}>Manage, monitor, and register your delivery fleet</p>
        </div>
        <button className="add-partner-btn" onClick={openAddModal}>
          <span className="btn-icon">+</span> Add New Partner
        </button>
      </div>

      {/* Summary Cards */}
      <div className="delivery-stats-grid">
        <div className="delivery-stat-card total-fleet">
          <div className="card-icon">🚚</div>
          <div className="card-info">
            <h3>Total Fleet</h3>
            <p>{totalDrivers}</p>
          </div>
        </div>
        <div className="delivery-stat-card online">
          <div className="card-icon">🟢</div>
          <div className="card-info">
            <h3>Online Drivers</h3>
            <p>{onlineDrivers}</p>
          </div>
        </div>
        <div className="delivery-stat-card offline">
          <div className="card-icon">🔴</div>
          <div className="card-info">
            <h3>Offline Drivers</h3>
            <p>{offlineDrivers}</p>
          </div>
        </div>
        <div className="delivery-stat-card earnings">
          <div className="card-icon">₹</div>
          <div className="card-info">
            <h3>Total Pay-out</h3>
            <p>₹{totalEarnings}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Profile</th>
            <th>Name</th>
            <th>Contact Details</th>
            <th>Vehicle No</th>
            <th>Earnings</th>
            <th>Availability</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {partners.map(dp => (
            <tr key={dp._id} className="driver-row">
              <td>
                <div className="driver-profile-pic-container">
                  <img 
                    src={dp.profileImage || "https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(dp.name || dp._id)} 
                    alt={dp.name} 
                    className="driver-thumb"
                  />
                </div>
              </td>
              <td>
                <div className="driver-name-cell">
                  <span className="driver-name">{dp.name}</span>
                  <span className="driver-role-tag">Driver</span>
                </div>
              </td>
              <td>
                <div className="driver-contact-cell">
                  <span className="driver-email">✉ {dp.email}</span>
                  <span className="driver-mobile">📞 {dp.mobile || "N/A"}</span>
                </div>
              </td>
              <td>
                <span className="vehicle-badge">{dp.vehicleNumber || "No Vehicle Assigned"}</span>
              </td>
              <td>
                <span className="driver-earnings-val">₹{dp.earnings || 0}</span>
              </td>
              <td>
                <div className="toggle-container" onClick={() => toggleAvailability(dp)}>
                  <div className={`status-badge-premium ${dp.available ? "online" : "offline"}`}>
                    {dp.available ? "🟢 Online" : "🔴 Offline"}
                  </div>
                  <span className="toggle-help-text">Click to switch</span>
                </div>
              </td>
              <td>
                <div className="actions-cell">
                  <button className="edit-btn" onClick={() => openEditModal(dp)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(dp._id)}>Remove</button>
                </div>
              </td>
            </tr>
          ))}
          {partners.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", padding: "40px 20px" }}>
                <div className="no-drivers-state">
                  <p className="no-drivers-icon">🚚❌</p>
                  <p style={{ margin: "5px 0 15px 0", color: "#64748b", fontSize: "15px" }}>No delivery partners registered yet.</p>
                  <button className="add-partner-btn-small" onClick={openAddModal}>Register your first driver</button>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modern Slide-In/Fade Modal Form */}
      {showModal && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-content">
            <div className="modal-header">
              <h3>{editMode ? "📝 Edit Delivery Partner" : "➕ Register New Delivery Partner"}</h3>
              <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleFormSubmit} className="modal-form">
              <div className="form-group-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Enter full name" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="Enter email address" 
                    required 
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Password {editMode && <span className="password-help-note">(Leave blank to keep current)</span>}</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder={editMode ? "Enter new password" : "Enter account password"} 
                    required={!editMode} 
                  />
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input 
                    type="tel" 
                    value={mobile} 
                    onChange={(e) => setMobile(e.target.value)} 
                    placeholder="Enter mobile number" 
                    required 
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Vehicle Number</label>
                  <input 
                    type="text" 
                    value={vehicleNumber} 
                    onChange={(e) => setVehicleNumber(e.target.value)} 
                    placeholder="e.g. MH-12-AB-1234" 
                    required 
                  />
                </div>
                
                {editMode && (
                  <div className="form-group">
                    <label>Fleet Availability</label>
                    <select 
                      value={available ? "true" : "false"} 
                      onChange={(e) => setAvailable(e.target.value === "true")}
                      className="status-select-form"
                    >
                      <option value="true">🟢 Online (Active & Available)</option>
                      <option value="false">🔴 Offline (Away & Unavailable)</option>
                    </select>
                  </div>
                )}
              </div>

              {!editMode && (
                <>
                  <div className="form-group">
                    <label>Residential Address (Optional)</label>
                    <input 
                      type="text" 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)} 
                      placeholder="Street address, City" 
                    />
                  </div>

                  <div className="form-group">
                    <label>Landmark (Optional)</label>
                    <input 
                      type="text" 
                      value={landmark} 
                      onChange={(e) => setLandmark(e.target.value)} 
                      placeholder="Near building, park or mall" 
                    />
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn">{editMode ? "Save Changes" : "Register Partner"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDeliveryPartners;

