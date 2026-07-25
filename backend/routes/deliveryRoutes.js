const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Order = require("../models/Order");
const jwt = require("jsonwebtoken");

// Delivery Middleware
const verifyDelivery = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No Token Provided" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (verified.role !== "delivery") {
      return res.status(403).json({ message: "Access Denied: Delivery Partners Only" });
    }
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

router.use(verifyDelivery);

// 1. Get Delivery Stats (Overview)
router.get("/stats", async (req, res) => {
  try {
    const partnerId = req.user.id;
    const partner = await User.findById(partnerId);
    
    const assignedOrders = await Order.countDocuments({ deliveryPartnerId: partnerId, deliveryStatus: { $in: ["Pending", "Out for Delivery"] } });
    const deliveredOrders = await Order.countDocuments({ deliveryPartnerId: partnerId, deliveryStatus: "Delivered" });
    
    // Simplistic today logic
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todaysDeliveries = await Order.countDocuments({ 
      deliveryPartnerId: partnerId, 
      deliveryStatus: "Delivered",
      deliveredAt: { $gte: startOfToday }
    });

    res.json({
      pending: assignedOrders,
      completed: deliveredOrders,
      todaysDeliveries,
      earnings: partner.earnings || 0,
      available: partner.available
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Get Assigned Orders
router.get("/orders", async (req, res) => {
  try {
    const partnerId = req.user.id;
    const orders = await Order.find({ deliveryPartnerId: partnerId })
      .populate("buyer", "name email mobile address location")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Update Order Status (With OTP check for Delivered)
router.put("/orders/:id/status", async (req, res) => {
  try {
    const { status, otp, buyerOtp } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) return res.status(404).json({ message: "Order not found" });

    // OTP Verification
    if (status === "Delivered") {
      if (!otp || otp !== order.deliveryOTP || !buyerOtp || buyerOtp !== order.buyerOTP) {
        return res.status(400).json({ message: "Invalid OTPs. Both Delivery OTP and Customer Confirmation OTP must be correct." });
      }
      order.deliveredAt = new Date();
      order.status = "Delivered"; // Also update main status
      
      // Credit earnings to partner
      const partner = await User.findById(req.user.id);
      if (partner) {
        partner.earnings += 50; // Add ₹50 per delivery (Example)
        await partner.save();
      }
    }

    order.deliveryStatus = status;
    if (status === "Out for Delivery") {
      order.status = "Out for Delivery";
      order.outForDeliveryAt = new Date();
    }
    if (status === "Failed Delivery" || status === "Returned") order.status = status;

    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Toggle Availability Status
router.put("/availability", async (req, res) => {
  try {
    const { available } = req.body;
    const partner = await User.findByIdAndUpdate(req.user.id, { available }, { new: true });
    res.json({ success: true, available: partner.available });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4b. Mark Amount as Collected
router.put("/orders/:id/collect", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    
    order.amountCollected = true;
    order.paymentStatus = "Collected";
    await order.save();
    
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Update Profile / Vehicle Number
router.put("/profile", async (req, res) => {
  try {
    const { name, phone, vehicleNumber } = req.body;
    const partner = await User.findByIdAndUpdate(req.user.id, { name, phone, vehicleNumber }, { new: true });
    res.json({ success: true, partner });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. Get Profile
router.get("/profile", async (req, res) => {
  try {
    const partner = await User.findById(req.user.id).select("-password");
    res.json(partner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 7. Earnings - Day-by-day breakdown
router.get("/earnings", async (req, res) => {
  try {
    const partnerId = req.user.id;
    const partner = await User.findById(partnerId);

    // Delivered orders for this partner
    const deliveredOrders = await Order.find({
      deliveryPartnerId: partnerId,
      deliveryStatus: "Delivered"
    }).sort({ deliveredAt: 1 });

    // Build day-by-day map
    const earningsMap = {};
    deliveredOrders.forEach(order => {
      const date = order.deliveredAt
        ? new Date(order.deliveredAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
        : "Unknown";
      earningsMap[date] = (earningsMap[date] || 0) + 50; // ₹50 per delivery
    });

    const dailyBreakdown = Object.entries(earningsMap).map(([date, amount]) => ({ date, amount }));

    // Today's earnings
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayCount = deliveredOrders.filter(o => o.deliveredAt && new Date(o.deliveredAt) >= startOfToday).length;

    // Weekly earnings
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const weekCount = deliveredOrders.filter(o => o.deliveredAt && new Date(o.deliveredAt) >= startOfWeek).length;

    res.json({
      totalEarnings: partner.earnings || 0,
      todayEarnings: todayCount * 50,
      weeklyEarnings: weekCount * 50,
      totalDeliveries: deliveredOrders.length,
      dailyBreakdown
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
