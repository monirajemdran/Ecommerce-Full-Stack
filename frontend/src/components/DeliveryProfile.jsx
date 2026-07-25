import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const DeliveryProfile = () => {
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", vehicleNumber: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get("http://localhost:5000/api/delivery/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile({
        name: res.data.name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        vehicleNumber: res.data.vehicleNumber || ""
      });
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
      await axios.put("http://localhost:5000/api/delivery/profile", {
        name: profile.name,
        phone: profile.phone,
        vehicleNumber: profile.vehicleNumber
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update localStorage user name too
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userObj = JSON.parse(userStr);
        userObj.name = profile.name;
        localStorage.setItem("user", JSON.stringify(userObj));
      }

      Swal.fire({ icon: "success", title: "Profile Updated!", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Error", "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
    background: "white",
    boxSizing: "border-box"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontWeight: "600",
    fontSize: "14px",
    color: "#334155"
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div>
      <h3 style={{ marginBottom: "5px" }}>Profile Management</h3>
      <p style={{ color: "#64748b", marginBottom: "24px" }}>Keep your personal and vehicle details up to date.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>

        {/* --- Profile Form --- */}
        <div style={{ background: "white", padding: "24px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <h4 style={{ margin: "0 0 20px 0", color: "#0f172a", borderBottom: "2px solid #f1f5f9", paddingBottom: "10px" }}>
            Personal Details
          </h4>
          <form onSubmit={handleSave}>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                style={inputStyle}
                placeholder="Your full name"
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                value={profile.email}
                disabled
                style={{ ...inputStyle, background: "#f8fafc", color: "#64748b", cursor: "not-allowed" }}
              />
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: "4px 0 0 0" }}>Email cannot be changed.</p>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Phone Number</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={e => setProfile({ ...profile, phone: e.target.value })}
                style={inputStyle}
                placeholder="+91 98765 43210"
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Vehicle Number</label>
              <input
                type="text"
                value={profile.vehicleNumber}
                onChange={e => setProfile({ ...profile, vehicleNumber: e.target.value })}
                style={inputStyle}
                placeholder="e.g. MH-12-AB-1234"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                width: "100%",
                padding: "12px",
                background: saving ? "#94a3b8" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                fontSize: "15px",
                cursor: saving ? "not-allowed" : "pointer",
                transition: "background 0.3s"
              }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* --- Info Panel --- */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "linear-gradient(135deg, #1e293b, #334155)", color: "white", padding: "24px", borderRadius: "10px" }}>
            <h4 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>Account Info</h4>
            <p style={{ margin: "0 0 10px 0", fontSize: "14px", opacity: 0.8 }}>Role</p>
            <span style={{ background: "#3b82f6", padding: "4px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold" }}>
              🚚 Delivery Partner
            </span>
          </div>

          <div style={{ background: "white", padding: "24px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h4 style={{ margin: "0 0 16px 0", color: "#0f172a" }}>Quick Details</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "#f8fafc", borderRadius: "6px" }}>
                <span style={{ color: "#64748b", fontSize: "14px" }}>Name</span>
                <span style={{ fontWeight: "600", fontSize: "14px" }}>{profile.name || "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "#f8fafc", borderRadius: "6px" }}>
                <span style={{ color: "#64748b", fontSize: "14px" }}>Phone</span>
                <span style={{ fontWeight: "600", fontSize: "14px" }}>{profile.phone || "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "#f8fafc", borderRadius: "6px" }}>
                <span style={{ color: "#64748b", fontSize: "14px" }}>Vehicle</span>
                <span style={{ fontWeight: "600", fontSize: "14px" }}>{profile.vehicleNumber || "—"}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DeliveryProfile;
