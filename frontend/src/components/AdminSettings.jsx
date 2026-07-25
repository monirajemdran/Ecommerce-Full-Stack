import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaTimes } from "react-icons/fa";
import "./AdminTables.css";

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    platformName: "",
    supportEmail: "",
    contactPhone: "",
    address: "",
    maintenanceMode: false,
    sellerCommission: 10,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get("http://localhost:5000/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("userToken");
      const payload = {
        platformName: settings.platformName,
        supportEmail: settings.supportEmail,
        contactPhone: settings.contactPhone,
        address: settings.address,
        maintenanceMode: settings.maintenanceMode,
        sellerCommission: Number(settings.sellerCommission) || 0,
      };

      const res = await axios.put("http://localhost:5000/api/admin/settings", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      setSettings(res.data.settings);

      Swal.fire({
        icon: "success",
        title: "Settings Saved",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire("Error", "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value
    });
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="admin-table-container">
      <h2>Platform Settings</h2>
      <p style={{ color: "#64748b", marginBottom: "20px" }}>Manage global application settings and configuration.</p>
      
      <form onSubmit={handleSave} style={{ maxWidth: "600px", background: "#f8fafc", padding: "20px", borderRadius: "8px" }}>
        
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#334155" }}>Platform Name</label>
          <input 
            type="text" 
            name="platformName" 
            value={settings.platformName} 
            onChange={handleChange} 
            className="status-select" 
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#334155" }}>Support Email</label>
          <input 
            type="email" 
            name="supportEmail" 
            value={settings.supportEmail} 
            onChange={handleChange} 
            className="status-select" 
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#334155" }}>Contact Phone / Mobile</label>
          <input 
            type="text" 
            name="contactPhone" 
            value={settings.contactPhone} 
            onChange={handleChange} 
            className="status-select" 
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#334155" }}>Store Address</label>
          <textarea
            name="address"
            value={settings.address || ""}
            onChange={handleChange}
            className="status-select"
            style={{ width: "100%", padding: "10px", minHeight: "80px", resize: "vertical" }}
            placeholder="Street, city, state, pin code"
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#334155" }}>Seller Commission Rate (%)</label>
          <input 
            type="number" 
            name="sellerCommission" 
            value={settings.sellerCommission} 
            onChange={handleChange} 
            className="status-select" 
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div className="settings-checkbox-row">
          <input 
            type="checkbox" 
            name="maintenanceMode" 
            checked={settings.maintenanceMode} 
            onChange={handleChange} 
            id="maintenanceMode"
          />
          <label htmlFor="maintenanceMode">
            Enable Maintenance Mode (Restricts access to buyers/sellers)
          </label>
          {settings.maintenanceMode && (
            <button
              type="button"
              className="checkbox-clear-btn"
              onClick={() => setSettings({ ...settings, maintenanceMode: false })}
              aria-label="Disable maintenance mode"
              title="Disable maintenance mode"
            >
              <FaTimes />
            </button>
          )}
        </div>

        <button 
          type="submit" 
          className="delete-btn" 
          style={{ backgroundColor: "#3b82f6", width: "100%", padding: "12px", fontSize: "16px" }}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>

      </form>
    </div>
  );
};

export default AdminSettings;
