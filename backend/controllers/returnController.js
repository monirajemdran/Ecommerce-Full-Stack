const Return = require("../models/Return");
const Order = require("../models/Order");
const User = require("../models/User");

// 1. Buyer: Request a Return for a specific item
exports.getAllReturns = async (req, res) => {
  try {
    const returns = await Return.find()
      .populate("productId", "name image originalPrice discountPrice isOffer")
      .populate("sellerId", "name email mobile address")
      .populate("buyerId", "name email mobile")
      .populate("deliveryPartnerId", "name mobile")
      .populate("orderId", "buyerAddress");
    res.json(returns);
  } catch (error) {
    console.error("Error fetching all returns:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.requestReturn = async (req, res) => {
  try {
    const { orderId, productId, reason, description } = req.body;
    const buyerId = req.user.id; // assuming auth middleware sets req.user

    // Fetch the order and verify the buyer owns it
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.buyerId.toString() !== buyerId) {
      return res.status(403).json({ message: "Unauthorized to return this order" });
    }

    // Find the specific item in the order
    const itemIndex = order.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex === -1) return res.status(404).json({ message: "Product not found in this order" });
    
    const item = order.items[itemIndex];

    // Check if a return already exists
    const existingReturn = await Return.findOne({ orderId, productId });
    if (existingReturn) {
      return res.status(400).json({ message: "Return already requested for this item" });
    }

    // Handle image uploads (assuming multer puts them in req.files)
    const images = req.files ? req.files.map(file => file.path.replace(/\\/g, '/')) : [];

    const newReturn = new Return({
      orderId,
      buyerId,
      sellerId: item.sellerId,
      productId,
      quantity: item.quantity,
      reason,
      description,
      images
    });

    await newReturn.save();

    // Update item status in the order
    order.items[itemIndex].itemStatus = "Return Requested";
    order.items[itemIndex].isReturned = true;
    await order.save();

    res.status(201).json({ message: "Return requested successfully", returnRequest: newReturn });
  } catch (error) {
    console.error("Error requesting return:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 2. Buyer: Get all their returns
exports.getBuyerReturns = async (req, res) => {
  try {
    const returns = await Return.find({ buyerId: req.user.id })
      .populate("productId", "name image price")
      .populate("sellerId", "name")
      .populate("orderId", "createdAt");
    res.json(returns);
  } catch (error) {
    console.error("Error fetching buyer returns:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 3. Seller: Get all returns assigned to them
exports.getSellerReturns = async (req, res) => {
  try {
    const returns = await Return.find({ sellerId: req.user.id })
      .populate("productId", "name image price")
      .populate("buyerId", "name email mobile")
      .populate("orderId", "createdAt buyerAddress");
    res.json(returns);
  } catch (error) {
    console.error("Error fetching seller returns:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 4. Seller/Admin: Update Return Status (Approve/Reject)
exports.updateReturnStatus = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { status, adminNotes } = req.body;

    const returnRequest = await Return.findById(returnId);
    if (!returnRequest) return res.status(404).json({ message: "Return not found" });

    // Assuming seller or admin
    returnRequest.status = status;
    if (adminNotes) returnRequest.adminNotes = adminNotes;
    
    if (status === "ReturnApproved") {
      returnRequest.approvedAt = new Date();
    }

    await returnRequest.save();

    // Also sync with Order itemStatus
    const order = await Order.findById(returnRequest.orderId);
    if (order) {
      const itemIndex = order.items.findIndex(item => item.productId.toString() === returnRequest.productId.toString());
      if (itemIndex !== -1) {
        order.items[itemIndex].itemStatus = status;
        await order.save();
      }
    }

    res.json({ message: `Return status updated to ${status}`, returnRequest });
  } catch (error) {
    console.error("Error updating return status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 5. Admin: Assign Delivery Partner for Pickup
exports.assignPickup = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { deliveryPartnerId } = req.body;

    const returnRequest = await Return.findById(returnId);
    if (!returnRequest) return res.status(404).json({ message: "Return not found" });

    returnRequest.deliveryPartnerId = deliveryPartnerId;
    returnRequest.status = "PickupAssigned";
    await returnRequest.save();

    // Sync with order
    const order = await Order.findById(returnRequest.orderId);
    if (order) {
      const itemIndex = order.items.findIndex(item => item.productId.toString() === returnRequest.productId.toString());
      if (itemIndex !== -1) {
        order.items[itemIndex].itemStatus = "PickupAssigned";
        await order.save();
      }
    }

    res.json({ message: "Pickup assigned to delivery partner", returnRequest });
  } catch (error) {
    console.error("Error assigning pickup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 6. Delivery: Get returns assigned for pickup
exports.getDeliveryReturns = async (req, res) => {
  try {
    const returns = await Return.find({ deliveryPartnerId: req.user.id })
      .populate("productId", "name image price")
      .populate("sellerId", "name email mobile address")
      .populate("buyerId", "name email mobile")
      .populate("orderId", "buyerAddress createdAt");
    res.json(returns);
  } catch (error) {
    console.error("Error fetching delivery returns:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
