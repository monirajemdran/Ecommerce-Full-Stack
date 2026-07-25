const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const bcrypt = require("bcryptjs");
const Banner = require("../models/Banner");
const jwt = require("jsonwebtoken");
const upload = require("../middleware/upload");
const geocodeAddress = require("../utils/geocode");

// Admin Verification Middleware
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access Denied: No Token Provided" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (verified.role !== "admin") {
      return res.status(403).json({ message: "Access Denied: Admins Only" });
    }
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

const Setting = require("../models/Setting");

router.get("/settings", async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/banners/active", async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use(verifyAdmin);
router.get("/stats", async (req, res) => {
  try {
    const users = await User.countDocuments({ role: { $ne: "admin" } });
    const sellers = await User.countDocuments({ role: "seller" });
    const buyers = await User.countDocuments({ role: "buyer" });
    const products = await Product.countDocuments();
    const allOrders = await Order.find();

    const getOrderTotal = (order) => {
      const itemsTotal = Array.isArray(order.items)
        ? order.items.reduce((total, item) => total + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0)
        : 0;
      const savedTotal = Number(order.totalPrice) || 0;

      return savedTotal > 0 ? savedTotal : itemsTotal;
    };

    const orders = allOrders.length;
    const revenue = allOrders.reduce((acc, order) => {
      const isCancelled = order.status === "Cancelled" || order.deliveryStatus === "Cancelled";
      return isCancelled ? acc : acc + getOrderTotal(order);
    }, 0);

    const pendingOrders = allOrders.filter((order) => {
      const status = order.status || "";
      const deliveryStatus = order.deliveryStatus || "";
      return status !== "Delivered" &&
        deliveryStatus !== "Delivered" &&
        status !== "Cancelled" &&
        deliveryStatus !== "Cancelled";
    }).length;
    const deliveredOrders = allOrders.filter((order) =>
      order.status === "Delivered" || order.deliveryStatus === "Delivered"
    ).length;

    const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
    const now = new Date();
    const revenueTrend = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      return {
        month: monthFormatter.format(date),
        revenue: 0,
        orders: 0
      };
    });

    allOrders.forEach((order) => {
      const createdAt = order.createdAt ? new Date(order.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return;
      const diffMonths = (now.getFullYear() - createdAt.getFullYear()) * 12 + (now.getMonth() - createdAt.getMonth());
      if (diffMonths < 0 || diffMonths > 5) return;

      const trendIndex = 5 - diffMonths;
      revenueTrend[trendIndex].revenue += getOrderTotal(order);
      revenueTrend[trendIndex].orders += 1;
    });

    const activeDeliveries = allOrders.filter((order) =>
      ["Pending", "Out for Delivery"].includes(order.deliveryStatus)
    ).length;

    res.json({
      users,
      sellers,
      buyers,
      products,
      orders,
      revenue,
      pendingOrders,
      deliveredOrders,
      activeDeliveries,
      revenueTrend
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// === PRODUCT MANAGEMENT ===

router.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// === ORDER MANAGEMENT ===

router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const updateData = { status };
    if (status === "Shipped") {
      updateData.shippedAt = new Date();
    }
    const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/orders/:id/assign", async (req, res) => {
  try {
    const { deliveryPartnerId } = req.body;
    
    // Check if delivery partner is online
    const partner = await User.findById(deliveryPartnerId);
    if (!partner || partner.role !== "delivery") {
      return res.status(400).json({ message: "Invalid delivery partner." });
    }
    if (!partner.available) {
      return res.status(400).json({ message: "This delivery partner is currently offline. Only online partners can be assigned." });
    }
    
    // Generate OTP for secure delivery
    const deliveryOTP = Math.floor(1000 + Math.random() * 9000).toString(); 
    
    const order = await Order.findByIdAndUpdate(
      req.params.id, 
      { deliveryPartnerId, deliveryPartner: deliveryPartnerId, deliveryOTP, deliveryStatus: "Pending", status: "Shipped", shippedAt: new Date() }, 
      { new: true }
    );
    res.json({ success: true, order, otp: deliveryOTP });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get online delivery partners only
router.get("/delivery-partners", async (req, res) => {
  try {
    const partners = await User.find({ role: "delivery" }).select("-password");
    res.json(partners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new delivery partner
router.post("/delivery-partners", async (req, res) => {
  try {
    const { name, email, password, mobile, vehicleNumber, address, landmark } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use by another account." });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);

    // geocode and coerce coordinates to Number for storage
    let locationObj = null;
    if (address) {
      const coords = await geocodeAddress(address);
      console.log("Geocode new delivery partner (adminRoutes):", address, coords);
      if (coords) locationObj = { latitude: Number(coords.latitude), longitude: Number(coords.longitude) };
    }

    const partner = new User({
      name,
      email,
      password: hashedPassword,
      mobile,
      vehicleNumber,
      address,
      landmark,
      role: "delivery",
      earnings: 0,
      available: true,
      location: locationObj
    });

    await partner.save();
    
    const partnerResponse = await User.findById(partner._id).select("-password");
    res.status(201).json({ success: true, partner: partnerResponse });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update delivery partner details
router.put("/delivery-partners/:id", async (req, res) => {
  try {
    const { name, email, mobile, vehicleNumber, address, landmark, available, password } = req.body;
    const updateData = { name, email, mobile, vehicleNumber, address, landmark, available };
    if (address) {
      const coords = await geocodeAddress(address);
      console.log("Geocode update delivery partner (adminRoutes):", address, coords);
      updateData.location = coords ? { latitude: Number(coords.latitude), longitude: Number(coords.longitude) } : null;
    }
    
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    const partner = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select("-password");
    
    if (!partner || partner.role !== "delivery") {
      return res.status(404).json({ message: "Delivery partner not found." });
    }
    
    res.json({ success: true, partner });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// === USER MANAGEMENT ===

router.get("/users", async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// === CATEGORY MANAGEMENT ===
const Category = require("../models/Category");

router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/categories", upload.single("image"), async (req, res) => {
  try {
    const { name, description } = req.body;
    let image = "";
    if (req.file) {
      image = `http://localhost:5000/uploads/${req.file.filename}`;
    }
    const category = new Category({ name, description, image });
    await category.save();
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/categories/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, description } = req.body;
    const updateData = { name, description };
    if (req.file) {
      updateData.image = `http://localhost:5000/uploads/${req.file.filename}`;
    }
    const category = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/categories/:id", async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// === SELLER MANAGEMENT ===

router.get("/sellers", async (req, res) => {
  try {
    const sellers = await User.find({ role: "seller" });
    res.json(sellers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/sellers/:id/status", async (req, res) => {
  try {
    const { sellerStatus } = req.body;
    const seller = await User.findByIdAndUpdate(req.params.id, { sellerStatus }, { new: true });
    res.json({ success: true, seller });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// === PAYMENT MANAGEMENT ===
// Using orders since payments are linked to orders
router.put("/orders/:id/payment", async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { paymentStatus }, { new: true });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// === REVIEW MANAGEMENT ===
const Review = require("../models/Review");

router.get("/reviews", async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("productId", "name image sellerName")
      .populate("userId", "name email");
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/reviews/:id/hide", async (req, res) => {
  try {
    const { isHidden } = req.body;
    const review = await Review.findByIdAndUpdate(req.params.id, { isHidden }, { new: true });
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/reviews/:id", async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// === BANNER & OFFER MANAGEMENT ===

router.get("/banners", async (req, res) => {
  try {
    const banners = await Banner.find();
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/banners", upload.single("image"), async (req, res) => {
  try {
    const { title, discountPercentage, couponCode } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: "Banner image is required" });
    }
    const image = `http://localhost:5000/uploads/${req.file.filename}`;
    const banner = new Banner({ title, image, discountPercentage, couponCode });
    await banner.save();
    res.json({ success: true, banner });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/banners/:id/status", async (req, res) => {
  try {
    const { isActive } = req.body;
    const banner = await Banner.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    res.json({ success: true, banner });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/banners/:id", async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Banner deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// === SETTING MANAGEMENT ===

router.put("/settings", upload.single("qrImage"), async (req, res) => {
  try {
    const { platformName, supportEmail, contactPhone, address, maintenanceMode, sellerCommission } = req.body;
    let settings = await Setting.findOne();
    
    if (!settings) {
      settings = new Setting();
    }
    
    settings.platformName = platformName !== undefined ? platformName : settings.platformName;
    settings.supportEmail = supportEmail !== undefined ? supportEmail : settings.supportEmail;
    settings.contactPhone = contactPhone !== undefined ? contactPhone : settings.contactPhone;
    settings.address = address !== undefined ? address : settings.address;
    settings.maintenanceMode = maintenanceMode !== undefined ? maintenanceMode : settings.maintenanceMode;
    settings.sellerCommission = sellerCommission !== undefined ? sellerCommission : settings.sellerCommission;
    
    if (req.file) {
      settings.qrImage = "http://localhost:5000/uploads/" + req.file.filename;
    }
    
    await settings.save();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// === PRODUCT MANAGEMENT ===
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/products/:id/approve", async (req, res) => {
  try {
    const { couponCode } = req.body;
    const updateData = { approved: true };
    if (couponCode !== undefined) {
      updateData.couponCode = couponCode;
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Automatically create a Banner if it's an approved offer product
    if (product.isOffer && product.approved) {
      let discountPct = 0;
      if (product.originalPrice && product.discountPrice) {
        discountPct = Math.round(((product.originalPrice - product.discountPrice) / product.originalPrice) * 100);
      }
      const existingBanner = await Banner.findOne({ title: product.name });
      if (!existingBanner) {
        const banner = new Banner({
          title: product.name,
          image: product.image,
          discountPercentage: discountPct,
          couponCode: product.couponCode || "",
          isActive: true
        });
        await banner.save();
      }
    }

    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/products/:id/coupon", async (req, res) => {
  try {
    const { couponCode } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { couponCode },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // If product is already approved and is an offer, also update/create the banner
    if (product.isOffer && product.approved) {
      let banner = await Banner.findOne({ title: product.name });
      if (banner) {
        banner.couponCode = couponCode;
        await banner.save();
      } else {
        let discountPct = 0;
        if (product.originalPrice && product.discountPrice) {
          discountPct = Math.round(((product.originalPrice - product.discountPrice) / product.originalPrice) * 100);
        }
        banner = new Banner({
          title: product.name,
          image: product.image,
          discountPercentage: discountPct,
          couponCode: couponCode || "",
          isActive: true
        });
        await banner.save();
      }
    }

    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
