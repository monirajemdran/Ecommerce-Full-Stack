import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { FaBars, FaBoxOpen, FaChartLine, FaClock, FaTimes, FaTruck, FaUsers } from "react-icons/fa";
import "./AdminDashboard.css";
import AdminProducts from "../components/AdminProducts";
import AdminOrders from "../components/AdminOrders";
import AdminUsers from "../components/AdminUsers";
import AdminCategories from "../components/AdminCategories";
import AdminSellers from "../components/AdminSellers";
import AdminPayments from "../components/AdminPayments";
import AdminReviews from "../components/AdminReviews";
import AdminOffers from "../components/AdminOffers";
import AdminBanners from "../components/AdminBanners";
import AdminReports from "../components/AdminReports";
import AdminSettings from "../components/AdminSettings";
import AdminDeliveryPartners from "../components/AdminDeliveryPartners";
import AdminComplaints from "../components/AdminComplaints";
import AdminChats from "../components/AdminChats";
import AdminReturns from "../components/AdminReturns";
import Navbar from "../components/Navbar";
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    users: 0,
    sellers: 0,
    buyers: 0,
    products: 0,
    orders: 0,
    revenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    activeDeliveries: 0,
    revenueTrend: []
  });
  const [dashboardOrders, setDashboardOrders] = useState([]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role !== "admin") {
        Swal.fire("Access Denied", "Only admins can access this page.", "error");
        navigate("/");
      } else {
        fetchStats();
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const labelAdminTables = () => {
      document.querySelectorAll(".admin-main table").forEach((table) => {
        const headers = Array.from(table.querySelectorAll("thead th")).map((th) => th.textContent.trim());
        table.querySelectorAll("tbody tr").forEach((row) => {
          Array.from(row.children).forEach((cell, index) => {
            if (headers[index]) cell.setAttribute("data-label", headers[index]);
          });
        });
      });
    };

    const timeoutId = window.setTimeout(labelAdminTables, 0);
    const target = document.querySelector(".admin-main");
    const observer = target ? new MutationObserver(labelAdminTables) : null;
    observer?.observe(target, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(timeoutId);
      observer?.disconnect();
    };
  }, [activeTab, dashboardOrders]);

  const selectTab = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, ordersRes] = await Promise.all([
        axios.get("http://localhost:5000/api/admin/stats", { headers }),
        axios.get("http://localhost:5000/api/admin/orders", { headers })
      ]);
      setStats(statsRes.data);
      setDashboardOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const getOrderTotal = (order) => {
    const savedTotal = Number(order?.totalPrice) || 0;
    if (savedTotal > 0) return savedTotal;

    return (order?.items || []).reduce((total, item) => {
      return total + ((Number(item?.price) || 0) * (Number(item?.quantity) || 0));
    }, 0);
  };

  const isCancelledOrder = (order) =>
    order?.status === "Cancelled" || order?.deliveryStatus === "Cancelled";

  const isDeliveredOrder = (order) =>
    order?.status === "Delivered" || order?.deliveryStatus === "Delivered";

  const buildRevenueTrend = (orders) => {
    const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
    const now = new Date();
    const trend = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      return {
        month: monthFormatter.format(date),
        revenue: 0,
        orders: 0
      };
    });

    orders.forEach((order) => {
      const createdAt = order?.createdAt ? new Date(order.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return;

      const diffMonths = (now.getFullYear() - createdAt.getFullYear()) * 12 + (now.getMonth() - createdAt.getMonth());
      if (diffMonths < 0 || diffMonths > 5 || isCancelledOrder(order)) return;

      const index = 5 - diffMonths;
      trend[index].revenue += getOrderTotal(order);
      trend[index].orders += 1;
    });

    return trend;
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("user");
    navigate("/login");
    window.location.reload();
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        const formatPrice = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
        const hasOrderRows = dashboardOrders.length > 0;
        const computedRevenue = hasOrderRows
          ? dashboardOrders.reduce((total, order) => isCancelledOrder(order) ? total : total + getOrderTotal(order), 0)
          : stats.revenue || 0;
        const computedOrders = hasOrderRows ? dashboardOrders.length : stats.orders || 0;
        const computedPendingOrders = hasOrderRows
          ? dashboardOrders.filter((order) => !isDeliveredOrder(order) && !isCancelledOrder(order)).length
          : stats.pendingOrders || 0;
        const computedDeliveredOrders = hasOrderRows
          ? dashboardOrders.filter(isDeliveredOrder).length
          : stats.deliveredOrders || 0;
        const computedActiveDeliveries = hasOrderRows
          ? dashboardOrders.filter((order) => ["Pending", "Out for Delivery"].includes(order.deliveryStatus)).length
          : stats.activeDeliveries || 0;
        const chartData = hasOrderRows
          ? buildRevenueTrend(dashboardOrders)
          : (stats.revenueTrend?.length ? stats.revenueTrend : buildRevenueTrend([]));
        const completionRate = computedOrders ? Math.round((computedDeliveredOrders / computedOrders) * 100) : 0;
        const pendingRate = computedOrders ? Math.round((computedPendingOrders / computedOrders) * 100) : 0;
        const avgOrderValue = computedOrders ? Math.round(computedRevenue / computedOrders) : 0;
        const dashboardCards = [
          { label: "Total Users", value: stats.users, icon: <FaUsers />, tone: "blue" },
          { label: "Total Products", value: stats.products, icon: <FaBoxOpen />, tone: "green" },
          { label: "Pending Orders", value: computedPendingOrders, icon: <FaClock />, tone: "amber" },
          { label: "Total Revenue", value: formatPrice(computedRevenue), icon: <FaChartLine />, tone: "rose" }
        ];
        const orderStats = [
          { label: "Total Orders", value: computedOrders },
          { label: "Delivered", value: computedDeliveredOrders },
          { label: "Active Delivery", value: computedActiveDeliveries },
          { label: "Average Order", value: formatPrice(avgOrderValue) }
        ];
        return (
          <div className="admin-overview dashboard-style active-dashboard">
            <div className="dashboard-hero">
              <div>
                <span className="dashboard-eyebrow">Live store control</span>
                <h2>Admin Performance Dashboard</h2>
                <p>Revenue, order movement, and delivery activity are updated from your database.</p>
              </div>
              <button className="refresh-dashboard-btn" onClick={fetchStats}>Refresh Stats</button>
            </div>

            <div className="summary-cards modern-summary">
              {dashboardCards.map((card) => (
                <div className={`summary-card summary-card-${card.tone}`} key={card.label}>
                  <div className="summary-icon">{card.icon}</div>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </div>
              ))}
            </div>

            <div className="dashboard-panels modern-panels">
              <div className="panel-left revenue-panel">
                <div className="panel-header">
                  <div>
                    <h3>Income Graph</h3>
                    <span>Monthly revenue from orders</span>
                  </div>
                  <strong>{formatPrice(computedRevenue)}</strong>
                </div>
                <div className="income-chart active-chart">
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={chartData} margin={{ top: 12, right: 24, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={(value) => `₹${value}`} />
                      <Tooltip formatter={(value, name) => [name === "revenue" ? formatPrice(value) : value, name === "revenue" ? "Revenue" : "Orders"]} />
                      <Area type="monotone" dataKey="revenue" stroke="#0284c7" strokeWidth={4} fill="url(#revenueFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="panel-right live-panel">
                <div className="detail-card status-focus">
                  <span className="panel-kicker">Order Health</span>
                  <h4>{completionRate}% Delivered</h4>
                  <div className="progress-track">
                    <div style={{ width: `${completionRate}%` }}></div>
                  </div>
                  <p>{computedDeliveredOrders} delivered from {computedOrders} total orders.</p>
                </div>
                <div className="detail-card delivery-focus">
                  <div className="delivery-icon"><FaTruck /></div>
                  <h4>{computedActiveDeliveries} Active Deliveries</h4>
                  <p>{pendingRate}% of orders still need action.</p>
                </div>
              </div>
            </div>

            <div className="metric-row active-metrics">
              {orderStats.map((item) => (
                <div className="metric-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="bottom-panels">
              <div className="expense-card">
                <div>
                  <h4>Business Split</h4>
                  <p>Quick view of store participation and order progress.</p>
                </div>
                <div className="expense-stats">
                  <div><strong>{stats.sellers}</strong><span>Sellers</span></div>
                  <div><strong>{stats.buyers}</strong><span>Buyers</span></div>
                  <div><strong>{pendingRate}%</strong><span>Pending</span></div>
                </div>
              </div>
              <div className="message-card">
                <h4>Action Center</h4>
                <p>Review pending orders, assign delivery partners, and refresh offers from the sidebar to keep the store moving.</p>
              </div>
            </div>
          </div>
        );
      case "Products":
        return <AdminProducts />;
      case "Orders":
        return <AdminOrders />;
      case "Returns":
        return <AdminReturns />;
      case "Users":
        return <AdminUsers />;
      case "Sellers":
        return <AdminSellers />;
      case "Delivery Partners":
        return <AdminDeliveryPartners />;
      case "Transactions":
        return <AdminPayments />;
      case "Categories":
        return <AdminCategories />;
      case "Banners":
        return <AdminBanners />;
      case "Offers":
        return <AdminOffers />;
      case "Reviews":
        return <AdminReviews />;
      case "Reports":
        return <AdminReports />;
      case "Settings":
        return <AdminSettings />;
      case "Complaints":
        return <AdminComplaints />;
      case "Chats":
        return <AdminChats />;
      default:
        return <div><h2>Welcome Admin</h2></div>;
    }
  };

  return (
   <div>
    <div><Navbar/></div>
    <div className="admin-container">
      {isSidebarOpen && (
        <button
          className="admin-sidebar-backdrop"
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close admin menu"
        />
      )}
      
      <div className={`admin-sidebar ${isSidebarOpen ? "mobile-open" : ""}`}>
        <div className="admin-sidebar-head">
          <h2 className="admin-logo">Admin Panel</h2>
          <button
            className="admin-sidebar-close"
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close admin menu"
          >
            <FaTimes />
          </button>
        </div>
        <ul>
          {["Dashboard", "Products", "Orders", "Returns", "Users", "Sellers", "Delivery Partners", "Transactions", "Categories", "Banners", "Offers", "Reviews", "Reports", "Complaints", "Chats", "Settings"].map(tab => (
            <li 
              key={tab} 
              className={activeTab === tab ? "active" : ""}
              onClick={() => selectTab(tab)}
            >
              {tab}
            </li>
          ))}
          <li onClick={handleLogout} className="logout-btn">Logout</li>
        </ul>
      </div>
      <div className="admin-main">
        <div className="admin-header">
          <button
            className="admin-mobile-menu-btn"
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open admin menu"
          >
            <FaBars />
          </button>
          <h2>Admin Dashboard - {activeTab}</h2>
        </div>
        <div className="admin-content">
          {renderContent()}
        </div>
      </div>
    </div>
    </div>
  );
};

export default AdminDashboard;
