import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FaBars, FaTimes } from "react-icons/fa";
import "./DeliveryDashboard.css";
import "../components/AdminTables.css";
import DeliveryAssignedOrders from "../components/DeliveryAssignedOrders";
import DeliveryHistory from "../components/DeliveryHistory";
import DeliveryEarnings from "../components/DeliveryEarnings";
import DeliveryProfile from "../components/DeliveryProfile";
import DeliveryReturns from "../components/DeliveryReturns";
import Navbar from "../components/Navbar";
const NAV_ITEMS = [
  { label: "Dashboard",        icon: "🏠" },
  { label: "Assigned Orders",  icon: "📦" },
  { label: "Return Pickups",   icon: "🔄" },
  { label: "Delivery History", icon: "📋" },
  { label: "Earnings",         icon: "💰" },
  { label: "Profile",          icon: "👤" },
];

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [partnerName, setPartnerName] = useState("Partner");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role !== "delivery") {
        Swal.fire("Access Denied", "Only delivery partners can access this page.", "error");
        navigate("/");
      } else {
        setPartnerName(user.name || "Partner");
        fetchStats();
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const labelDeliveryTables = () => {
      document.querySelectorAll(".delivery-main table").forEach((table) => {
        const headers = Array.from(table.querySelectorAll("thead th")).map((th) => th.textContent.trim());
        table.querySelectorAll("tbody tr").forEach((row) => {
          Array.from(row.children).forEach((cell, index) => {
            if (headers[index]) cell.setAttribute("data-label", headers[index]);
          });
        });
      });
    };

    const timeoutId = window.setTimeout(labelDeliveryTables, 0);
    const target = document.querySelector(".delivery-main");
    const observer = target ? new MutationObserver(labelDeliveryTables) : null;
    observer?.observe(target, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(timeoutId);
      observer?.disconnect();
    };
  }, [activeTab, stats]);

  const selectTab = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get("https://shopverse-m5i8.onrender.com/api/delivery/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to sign out?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, Logout"
    }).then(result => {
      if (result.isConfirmed) {
        localStorage.removeItem("userToken");
        localStorage.removeItem("user");
        navigate("/login");
        window.location.reload();
      }
    });
  };

  const toggleAvailability = async () => {
    if (!stats) return;
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.put("https://shopverse-m5i8.onrender.com/api/delivery/availability", { available: !stats.available }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats({ ...stats, available: res.data.available });
    } catch (err) {
      console.error("Failed to toggle availability", err);
    }
  };

  const statCards = [
    { label: "Pending Deliveries", value: stats?.pending ?? "—",          icon: "⏳", bg: "#fff7ed", iconBg: "#fed7aa", color: "#ea580c" },
    { label: "Today's Deliveries", value: stats?.todaysDeliveries ?? "—", icon: "🚀", bg: "#f0fdf4", iconBg: "#bbf7d0", color: "#16a34a" },
    { label: "Total Completed",    value: stats?.completed ?? "—",         icon: "✅", bg: "#eff6ff", iconBg: "#bfdbfe", color: "#2563eb" },
    { label: "Total Earnings",     value: `₹${stats?.earnings ?? 0}`,      icon: "💵", bg: "#fdf4ff", iconBg: "#e9d5ff", color: "#7c3aed" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return (
          <div>
            {/* Welcome Banner */}
            <div style={{
              background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
              borderRadius: "16px",
              padding: "28px 32px",
              color: "white",
              marginBottom: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <h2 style={{ margin: "0 0 6px 0", fontSize: "24px", fontWeight: 800 }}>
                  👋 Hello, {partnerName}!
                </h2>
                <p style={{ margin: 0, opacity: 0.85, fontSize: "14px" }}>
                  {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
              {/* Availability toggle in banner */}
              <div style={{ background: "rgba(255,255,255,0.15)", padding: "12px 20px", borderRadius: "50px", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", gap: "10px" }}>
                <span className={`availability-dot ${stats?.available ? "online" : "offline"}`}></span>
                <span style={{ fontSize: "13px", fontWeight: 700 }}>
                  {stats?.available ? "Online" : "Offline"}
                </span>
                <label className="switch">
                  <input type="checkbox" checked={stats?.available || false} onChange={toggleAvailability} />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="delivery-stats-grid">
              {statCards.map((card, i) => (
                <div className="delivery-stat-card" key={i} style={{ background: card.bg }}>
                  <div className="stat-icon-box" style={{ background: card.iconBg }}>
                    {card.icon}
                  </div>
                  <div className="stat-text">
                    <h4 style={{ color: card.color }}>{card.label}</h4>
                    <p style={{ color: card.color }}>{card.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <h3 style={{ margin: "0 0 16px 0", color: "#0f172a", fontSize: "16px", fontWeight: 700 }}>Quick Actions</h3>
            <div className="quick-actions">
              <button className="action-btn" style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)" }} onClick={() => selectTab("Assigned Orders")}>
                <span>📦</span>
                <span>View Orders</span>
              </button>
              <button className="action-btn" style={{ background: "linear-gradient(135deg,#10b981,#059669)" }} onClick={() => selectTab("Delivery History")}>
                <span>📋</span>
                <span>My History</span>
              </button>
              <button className="action-btn" style={{ background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" }} onClick={() => selectTab("Earnings")}>
                <span>💰</span>
                <span>Earnings</span>
              </button>
              <button className="action-btn" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }} onClick={() => selectTab("Profile")}>
                <span>👤</span>
                <span>My Profile</span>
              </button>
            </div>

            {/* Offline Warning */}
            {stats && !stats.available && (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "12px", padding: "16px 20px", marginTop: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "24px" }}>⚠️</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: "#b91c1c" }}>You are currently Offline</p>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#ef4444" }}>No new orders will be assigned to you. Toggle the switch above to go Online.</p>
                </div>
              </div>
            )}
          </div>
        );
      case "Assigned Orders":  return <DeliveryAssignedOrders />;
      case "Return Pickups":   return <DeliveryReturns />;
      case "Delivery History": return <DeliveryHistory />;
      case "Earnings":         return <DeliveryEarnings />;
      case "Profile":          return <DeliveryProfile />;
      default:                 return null;
    }
  };

  return (
    <div>
      <div><Navbar/></div>
    <div className="delivery-container">
      <button
        className="delivery-mobile-menu-btn"
        type="button"
        onClick={() => setIsSidebarOpen(true)}
        aria-label="Open delivery menu"
      >
        <FaBars />
      </button>
      {isSidebarOpen && (
        <button
          className="delivery-sidebar-backdrop"
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close delivery menu"
        />
      )}
      
      {/* ── SIDEBAR ── */}
      <div className={`delivery-sidebar ${isSidebarOpen ? "mobile-open" : ""}`}>
        <div className="delivery-logo-wrap">
          <h2 className="delivery-logo">🚚 <span>Flash</span> Deliver</h2>
          <p className="delivery-partner-name">Welcome, {partnerName}</p>
          <button
            className="delivery-sidebar-close"
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close delivery menu"
          >
            <FaTimes />
          </button>
        </div>

        <nav>
          <ul>
            {NAV_ITEMS.map(({ label, icon }) => (
              <li
                key={label}
                className={activeTab === label ? "active" : ""}
                onClick={() => selectTab(label)}
              >
                <span className="nav-icon">{icon}</span>
                {label}
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-bottom">
          <div className="logout-nav-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            Logout
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="delivery-main">
        <div className="delivery-header">
          <h2>
            {NAV_ITEMS.find(n => n.label === activeTab)?.icon} {activeTab}
          </h2>
          <div className="header-availability">
            <span className={`availability-dot ${stats?.available ? "online" : "offline"}`}></span>
            <span className="availability-label" style={{ color: stats?.available ? "#10b981" : "#ef4444" }}>
              {stats?.available ? "Online" : "Offline"}
            </span>
          </div>
        </div>
        <div className="delivery-content">
          {renderContent()}
        </div>
      </div>
    </div>
    </div>
  );
};

export default DeliveryDashboard;

