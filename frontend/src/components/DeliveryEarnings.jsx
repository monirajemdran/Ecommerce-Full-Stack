import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";

const COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const DeliveryEarnings = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get("https://shopverse-m5i8.onrender.com/api/delivery/earnings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const cardStyle = (color) => ({
    background: color,
    color: "white",
    padding: "20px 24px",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.12)"
  });

  if (loading) return <div>Loading earnings...</div>;

  return (
    <div>
      <h3 style={{ marginBottom: "5px" }}>Earnings Management</h3>
      <p style={{ color: "#64748b", marginBottom: "24px" }}>Track your daily income and payout history.</p>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "30px" }}>
        <div style={cardStyle("linear-gradient(135deg,#10b981,#059669)")}>
          <p style={{ margin: "0 0 6px 0", opacity: 0.85, fontSize: "13px" }}>Total Earnings</p>
          <h2 style={{ margin: 0, fontSize: "28px" }}>₹{data?.totalEarnings || 0}</h2>
        </div>
        <div style={cardStyle("linear-gradient(135deg,#3b82f6,#2563eb)")}>
          <p style={{ margin: "0 0 6px 0", opacity: 0.85, fontSize: "13px" }}>Today's Earnings</p>
          <h2 style={{ margin: 0, fontSize: "28px" }}>₹{data?.todayEarnings || 0}</h2>
        </div>
        <div style={cardStyle("linear-gradient(135deg,#8b5cf6,#6d28d9)")}>
          <p style={{ margin: "0 0 6px 0", opacity: 0.85, fontSize: "13px" }}>This Week</p>
          <h2 style={{ margin: 0, fontSize: "28px" }}>₹{data?.weeklyEarnings || 0}</h2>
        </div>
        <div style={cardStyle("linear-gradient(135deg,#f59e0b,#d97706)")}>
          <p style={{ margin: "0 0 6px 0", opacity: 0.85, fontSize: "13px" }}>Total Deliveries</p>
          <h2 style={{ margin: 0, fontSize: "28px" }}>{data?.totalDeliveries || 0}</h2>
        </div>
      </div>

      {/* Day-by-day Bar Chart */}
      <div style={{ background: "white", padding: "24px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <h4 style={{ margin: "0 0 20px 0", color: "#0f172a" }}>Day-by-Day Earnings (₹50 per delivery)</h4>

        {data?.dailyBreakdown && data.dailyBreakdown.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.dailyBreakdown} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 13 }} />
              <YAxis tickFormatter={v => `₹${v}`} tick={{ fontSize: 13 }} />
              <Tooltip
                formatter={(value) => [`₹${value}`, "Earnings"]}
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {data.dailyBreakdown.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
            <p style={{ fontSize: "16px" }}>No delivery earnings yet.</p>
            <p style={{ fontSize: "13px" }}>Complete deliveries to start tracking earnings here.</p>
          </div>
        )}
      </div>

      {/* Day-by-day Table */}
      {data?.dailyBreakdown && data.dailyBreakdown.length > 0 && (
        <div style={{ background: "white", padding: "24px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginTop: "20px" }}>
          <h4 style={{ margin: "0 0 16px 0", color: "#0f172a" }}>Daily Breakdown</h4>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", color: "#64748b", fontWeight: "600", borderBottom: "1px solid #e2e8f0" }}>Date</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", color: "#64748b", fontWeight: "600", borderBottom: "1px solid #e2e8f0" }}>Deliveries</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", color: "#64748b", fontWeight: "600", borderBottom: "1px solid #e2e8f0" }}>Earnings</th>
              </tr>
            </thead>
            <tbody>
              {data.dailyBreakdown.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontSize: "14px", fontWeight: "500" }}>{row.date}</td>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: "#3b82f6", fontWeight: "600" }}>{row.amount / 50} deliveries</td>
                  <td style={{ padding: "12px 16px", fontSize: "14px" }}>
                    <span style={{ background: "#d1fae5", color: "#059669", padding: "4px 10px", borderRadius: "20px", fontWeight: "bold" }}>
                      ₹{row.amount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DeliveryEarnings;

