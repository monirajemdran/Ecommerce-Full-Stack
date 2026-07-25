// AdminReports.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

import "./AdminTables.css";

const COLORS = [
  "#4f46e5",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
];

const AdminReports = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
    const token = localStorage.getItem("userToken");

    const [statsRes, ordersRes] = await Promise.all([
      axios.get("http://localhost:5000/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get("http://localhost:5000/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
    ]);
    setStats(statsRes.data);
    setOrders(ordersRes.data);
    setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "50px",
          fontWeight: "bold",
        }}
      >
        Loading Reports...
      </div>
    );
  }

  // Compute order status from fetched orders
  const deliveredOrdersCount = orders.filter((o) => o.status === "Delivered").length;
  const pendingOrdersCount = orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled").length;
  const cancelledOrdersCount = orders.filter((o) => o.status === "Cancelled").length;
  const orderStatusData = [
    { name: "Delivered", value: deliveredOrdersCount },
    { name: "Pending", value: pendingOrdersCount },
    { name: "Cancelled", value: cancelledOrdersCount },
  ];

    // Payment Method calculations based on fetched orders
  const paymentMethodData = Object.entries(orders.reduce((acc, order) => {
    const method = order.paymentMethod || "Other";
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {})).map(([name, value]) => ({ name, value }));

  // Ensure orders array exists for downstream calculations (will be empty if not provided)


  // ================================
  // USER DEMOGRAPHICS
  // ================================

  const userGrowthData = [
    {
      name: "Buyers",
      count: stats.buyers || 0,
    },
    {
      name: "Sellers",
      count: stats.sellers || 0,
    },
  ];

  // ================================
  // ORDER STATUS PIE CHART
  // ================================



  // ================================
  // PAYMENT METHOD PIE CHART
  // ================================



  // ================================
  // MONTHLY ANALYTICS
  // ================================

  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(0, i).toLocaleString("default", {
      month: "short",
    }),
    revenue: 0,
    delivered: 0,
    pending: 0,
  }));

  orders.forEach((order) => {
    const d = new Date(order.createdAt);

    const monthIndex = d.getMonth();

    monthlyData[monthIndex].revenue += order.totalPrice || 0;

    if (order.status === "Delivered") {
      monthlyData[monthIndex].delivered += 1;
    } else if (order.status !== "Cancelled") {
      monthlyData[monthIndex].pending += 1;
    }
  });

  // ================================
  // WEEKLY ANALYTICS
  // ================================

  const weeklyData = [
    {
      week: "Week 1",
      revenue: 0,
    },
    {
      week: "Week 2",
      revenue: 0,
    },
    {
      week: "Week 3",
      revenue: 0,
    },
    {
      week: "Week 4",
      revenue: 0,
    },
  ];

  orders.forEach((order) => {
    const day = new Date(order.createdAt).getDate();

    let weekIndex = 0;

    if (day <= 7) {
      weekIndex = 0;
    } else if (day <= 14) {
      weekIndex = 1;
    } else if (day <= 21) {
      weekIndex = 2;
    } else {
      weekIndex = 3;
    }

    weeklyData[weekIndex].revenue += order.totalPrice || 0;
  });

  // ================================
  // YEARLY ANALYTICS
  // ================================

  const yearlyData = {};

  orders.forEach((order) => {
    const year = new Date(order.createdAt).getFullYear();

    if (!yearlyData[year]) {
      yearlyData[year] = {
        year,
        revenue: 0,
        delivered: 0,
        pending: 0,
      };
    }

    yearlyData[year].revenue += order.totalPrice || 0;

    if (order.status === "Delivered") {
      yearlyData[year].delivered += 1;
    } else if (order.status !== "Cancelled") {
      yearlyData[year].pending += 1;
    }
  });

  const yearlyChartData = Object.values(yearlyData);

  // ================================
  // TOTAL REVENUE
  // ================================

  const totalRevenue = stats.revenue || 0;

  const paidRevenue = orders
    .filter(
      (o) =>
        o.paymentStatus === "Paid" ||
        o.paymentStatus === "Completed"
    )
    .reduce((acc, item) => acc + (item.totalPrice || 0), 0);

  const pendingRevenue = orders
    .filter(
      (o) =>
        o.paymentStatus === "Pending"
    )
    .reduce((acc, item) => acc + (item.totalPrice || 0), 0);

  return (
    <div className="admin-table-container">

      <h2
        style={{
          marginBottom: "25px",
        }}
      >
        Analytics & Reports
      </h2>

      {/* ============================= */}
      {/* OVERVIEW CARDS */}
      {/* ============================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >

        <div className="report-card">
          <h4>Total Revenue</h4>
          <h2>₹{totalRevenue.toLocaleString()}</h2>
        </div>

        <div className="report-card">
          <h4>Completed Revenue</h4>
          <h2>₹{paidRevenue.toLocaleString()}</h2>
        </div>

        <div className="report-card">
          <h4>Pending Revenue</h4>
          <h2>₹{pendingRevenue.toLocaleString()}</h2>
        </div>

        <div className="report-card">
          <h4>Total Orders</h4>
          <h2>{orders.length}</h2>
        </div>

      </div>

      {/* ============================= */}
      {/* CHART GRID */}
      {/* ============================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}
      >

        {/* USER DEMOGRAPHICS */}

        <div className="chart-box">
          <h3>User Demographics</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="count"
                fill="#4f46e5"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ORDER STATUS */}

        <div className="chart-box">
          <h3>Order Status Overview</h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatusData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {orderStatusData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip />

              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* MONTHLY REVENUE */}

        <div
          className="chart-box"
          style={{
            gridColumn: "span 2",
          }}
        >
          <h3>Monthly Revenue Trend</h3>

          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip
                formatter={(value) => `₹${value}`}
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={4}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* DELIVERED VS PENDING */}

        <div className="chart-box">
          <h3>Delivered vs Pending Orders</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="delivered"
                fill="#22c55e"
              />

              <Bar
                dataKey="pending"
                fill="#f59e0b"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* WEEKLY REVENUE */}

        <div className="chart-box">
          <h3>Weekly Revenue</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="week" />

              <YAxis />

              <Tooltip
                formatter={(value) => `₹${value}`}
              />

              <Bar
                dataKey="revenue"
                fill="#3b82f6"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* YEARLY ANALYTICS */}

        <div
          className="chart-box"
          style={{
            gridColumn: "span 2",
          }}
        >
          <h3>Yearly Analytics</h3>

          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={yearlyChartData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="year" />

              <YAxis />

              <Tooltip />

              <Legend />

              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#8b5cf6"
                strokeWidth={4}
              />

              <Line
                type="monotone"
                dataKey="delivered"
                stroke="#22c55e"
              />

              <Line
                type="monotone"
                dataKey="pending"
                stroke="#f59e0b"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* PAYMENT METHOD ANALYTICS */}

        <div
          className="chart-box"
          style={{
            gridColumn: "span 2",
          }}
        >
          <h3>Payment Method Analytics</h3>

          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={paymentMethodData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {paymentMethodData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip />

              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
};

export default AdminReports;
// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { 
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
//   PieChart, Pie, Cell, LineChart, Line
// } from "recharts";
// import "./AdminTables.css";

// const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

// const AdminReports = () => {
//   const [stats, setStats] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchStats();
//   }, []);

//   const fetchStats = async () => {
//     try {
//       const token = localStorage.getItem("userToken");
//       // Fetching the general stats to use for our charts. 
//       // In a real app, you would have dedicated analytical routes (like orders by month).
//       const res = await axios.get("http://localhost:5000/api/admin/stats", {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setStats(res.data);
//       setLoading(false);
//     } catch (err) {
//       console.error(err);
//       setLoading(false);
//     }
//   };

//   if (loading || !stats) return <div>Loading reports...</div>;

//   // Mock data generation for charts based on actual counts
//   const userGrowthData = [
//     { name: "Buyers", count: stats.buyers },
//     { name: "Sellers", count: stats.sellers }
//   ];

//   const orderStatusData = [
//     { name: "Pending", value: stats.pendingOrders },
//     { name: "Delivered", value: stats.deliveredOrders },
//     { name: "Other", value: stats.orders - (stats.pendingOrders + stats.deliveredOrders) }
//   ];

//   // Dummy monthly data to demonstrate Line Chart capability
//   const monthlyRevenue = [
//     { month: "Jan", revenue: 4000 },
//     { month: "Feb", revenue: 3000 },
//     { month: "Mar", revenue: 2000 },
//     { month: "Apr", revenue: 2780 },
//     { month: "May", revenue: 1890 },
//     { month: "Jun", revenue: 2390 },
//     { month: "Jul", revenue: stats.revenue > 0 ? stats.revenue : 3490 }, // Inject real if available
//   ];

//   return (
//     <div className="admin-table-container">
//       <h2>Analytics & Reports</h2>
      
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
        
//         {/* BAR CHART: User Demographics */}
//         <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "8px" }}>
//           <h3 style={{ textAlign: "center", color: "#334155", marginBottom: "15px" }}>User Demographics</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart data={userGrowthData}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="name" />
//               <YAxis />
//               <Tooltip />
//               <Legend />
//               <Bar dataKey="count" fill="#8884d8" name="Total Users" />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>

//         {/* PIE CHART: Order Status Overview */}
//         <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "8px" }}>
//           <h3 style={{ textAlign: "center", color: "#334155", marginBottom: "15px" }}>Order Status</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <PieChart>
//               <Pie
//                 data={orderStatusData}
//                 cx="50%"
//                 cy="50%"
//                 labelLine={false}
//                 outerRadius={100}
//                 fill="#8884d8"
//                 dataKey="value"
//                 label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
//               >
//                 {orderStatusData.map((entry, index) => (
//                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                 ))}
//               </Pie>
//               <Tooltip />
//             </PieChart>
//           </ResponsiveContainer>
//         </div>

//         {/* LINE GRAPH: Monthly Revenue Trend */}
//         <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "8px", gridColumn: "span 2" }}>
//           <h3 style={{ textAlign: "center", color: "#334155", marginBottom: "15px" }}>Revenue Trend (Monthly)</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <LineChart data={monthlyRevenue}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="month" />
//               <YAxis />
//               <Tooltip formatter={(value) => `₹${value}`} />
//               <Legend />
//               <Line type="monotone" dataKey="revenue" stroke="#10b981" activeDot={{ r: 8 }} name="Revenue (₹)" strokeWidth={3} />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>

//       </div>
//     </div>
//   );
// };

// export default AdminReports;
