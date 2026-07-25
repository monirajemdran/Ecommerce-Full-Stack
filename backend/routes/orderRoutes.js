const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

const cleanAddress = (address) => {
  if (!address) return "";
  return address
    .replace(/\n/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/-\d{6}/, "")
    .trim();
};

const hasValidLocation = (location) =>
  Number.isFinite(location?.latitude) &&
  Number.isFinite(location?.longitude);

const toTrackingPoint = (label, user, address) => {
  const resolvedAddress = cleanAddress(address || user?.address);
  const location = user?.location;

  return {
    label,
    name: user?.name || label,
    address: resolvedAddress || user?.address || "Unknown",
    latitude: hasValidLocation(location) ? Number(location.latitude) : null,
    longitude: hasValidLocation(location) ? Number(location.longitude) : null
  };
};
// CANCEL ORDER
router.put("/:id/cancel", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "Delivered" || order.deliveryStatus === "Delivered") {
      return res.status(400).json({ message: "Cannot cancel a delivered order. Please request a return instead." });
    }

    if (order.status === "Cancelled") {
      return res.status(400).json({ message: "Order is already cancelled." });
    }

    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    order.status = "Cancelled";
    order.cancelledAt = new Date();
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json(err);
  }
});

const processReturnRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "Delivered" && order.deliveryStatus !== "Delivered") {
      return res.status(400).json({ message: "Return is allowed only after delivery." });
    }

    if (order.status === "Return Requested") {
      return res.status(400).json({ message: "A return request already exists for this order." });
    }

    order.status = "Return Requested";
    order.returnReason = reason || "No reason provided";
    order.returnRequestedAt = new Date();
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json(err);
  }
};

router.put("/:id/return", processReturnRequest);
router.post("/:id/return", processReturnRequest);

// PLACE ORDER
router.post("/add", async (req, res) => {
  try {
    const { buyerId, buyerName, buyerEmail, buyerMobile, buyerAddress, items, paymentMethod, paymentDetails, deliveryMethod } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: "No items" });

    const itemsBySeller = {};

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({ message: `Issue with product ${product?.name || item.productId}` });
      }
      const seller = await User.findById(product.sellerId);

      // Check if product is an offer and coupon code matches
      const isOffer = product.isOffer === true;
      const correctCoupon = product.couponCode && item.couponCode && (product.couponCode.trim().toLowerCase() === item.couponCode.trim().toLowerCase());
      
      let itemPrice = product.originalPrice;
      if (isOffer) {
        if (product.couponCode) {
          if (correctCoupon || !item.couponCode) {
            itemPrice = product.discountPrice;
          }
        } else {
          itemPrice = product.discountPrice;
        }
      }

      // Add 20% surcharge if Express Delivery is chosen
      if (deliveryMethod === "Express Delivery") {
        itemPrice = Math.round(itemPrice * 1.20 * 100) / 100;
      }

      if (!itemsBySeller[product.sellerId]) {
        itemsBySeller[product.sellerId] = {
          orderItems: [],
          totalOrderPrice: 0
        };
      }

      itemsBySeller[product.sellerId].orderItems.push({
        productId: product._id,
        productName: product.name,
        productImage: product.image,
        quantity: item.quantity,
        price: itemPrice,
        sellerId: product.sellerId,
        sellerName: product.sellerName || "Seller",
        sellerEmail: seller?.email || "N/A",
        sellerMobile: seller?.mobile || "N/A",
        sellerAddress: seller?.address || "N/A"
      });
      itemsBySeller[product.sellerId].totalOrderPrice += itemPrice * item.quantity;

      product.stock -= item.quantity;
      await product.save();
    }

    const buyerOTP = Math.floor(1000 + Math.random() * 9000).toString();
    const paymentStatus = (paymentMethod === "UPI / QR" || paymentMethod === "Card" || paymentMethod === "Razorpay") ? "Paid" : "Pending";

    const createdOrders = [];
    const admin = await User.findOne({ role: "admin" });
    for (const sellerId in itemsBySeller) {
      const group = itemsBySeller[sellerId];
      const order = await Order.create({
        items: group.orderItems,
        seller: sellerId,
        buyer: buyerId,
        admin: admin?._id,
        totalPrice: group.totalOrderPrice,
        buyerId, buyerName, buyerEmail, buyerMobile, buyerAddress, paymentMethod,
        buyerOTP,
        paymentStatus,
        paymentDetails,
        deliveryMethod: deliveryMethod || "Standard Delivery"
      });
      createdOrders.push(order);
    }

    // Return the first order so the frontend can read the buyerOTP correctly
    res.json(createdOrders[0]);
  } catch (err) {
    res.status(500).json(err);
  }
});

// RAZORPAY INTEGRATION ENDPOINTS
const crypto = require("crypto");
const Razorpay = require("razorpay");

router.post("/razorpay/create", async (req, res) => {
  try {
    const { amount } = req.body;
    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_mockKeyId123";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "mockKeySecret123";
    
    let orderId;
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const instance = new Razorpay({
          key_id: keyId,
          key_secret: keySecret
        });
        const rzpOrder = await instance.orders.create({
          amount: Math.round(amount * 100), // in paise
          currency: "INR",
          receipt: `receipt_${Date.now()}`
        });
        orderId = rzpOrder.id;
      } catch (sdkError) {
        console.error("Razorpay SDK Error, falling back to mock:", sdkError);
        orderId = "order_" + Math.random().toString(36).substring(2, 15);
      }
    } else {
      orderId = "order_" + Math.random().toString(36).substring(2, 15);
    }
    
    res.json({
      success: true,
      orderId,
      amount: amount,
      keyId
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/razorpay/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "mockKeySecret123";
    
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.json({ success: true, message: "Mock verification successful" });
    }
    
    const hmac = crypto.createHmac("sha256", keySecret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");
    
    if (generated_signature === razorpay_signature) {
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Signature verification failed" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/buyer/:id", async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.params.id }).populate("items.productId").sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json(err); }
});

router.get("/seller/:id", async (req, res) => {
  try {
    const orders = await Order.find({ "items.sellerId": req.params.id }).populate("items.productId").sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json(err); }
});

router.get("/tracking/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("seller")
      .populate("buyer")
      .populate("admin")
      .populate("deliveryPartner")
      .populate("deliveryPartnerId");

    if (!order) return res.status(404).json({ message: "Order not found" });

    const seller = order.seller || (
      order.items?.[0]?.sellerId ? await User.findById(order.items[0].sellerId) : null
    );
    const admin = order.admin || await User.findOne({ role: "admin" });
    const deliveryPartner = order.deliveryPartner || order.deliveryPartnerId;
    const buyer = order.buyer || (order.buyerId ? await User.findById(order.buyerId) : null);

    const sellerAddr = seller?.address || order.items[0]?.sellerAddress;
    const adminAddr = admin?.address;
    const deliveryAddr = deliveryPartner?.address;
    const buyerAddr = buyer?.address || order.buyerAddress;

    const route = [
      toTrackingPoint("Seller", seller, sellerAddr),
      toTrackingPoint("Admin", admin, adminAddr),
      toTrackingPoint("Delivery Partner", deliveryPartner, deliveryAddr),
      toTrackingPoint("Buyer", buyer, buyerAddr)
    ];

    res.json({
      route,
      seller: route[0],
      admin: route[1],
      deliveryPartner: route[2],
      buyer: route[3],
      status: order.status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.productId");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const updateData = { status };

    if (status === "Order Dispatched") {
      updateData.sellerAcceptedAt = new Date();
    }

    if (status === "Shipped") {
      updateData.shippedAt = new Date();
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/", async (req, res) => {

  try {
    const orders = await Order.find().populate("items.productId");
    res.json(orders);
  } catch (err) { res.status(500).json(err); }
});

module.exports = router;
