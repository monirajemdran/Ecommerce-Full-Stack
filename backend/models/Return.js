const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  reason: {
    type: String,
    required: true
  },
  description: String,
  images: [String],
  status: {
    type: String,
    enum: [
      "ReturnRequested",
      "ReturnApproved",
      "ReturnRejected",
      "PickupAssigned",
      "PickupCompleted",
      "ReturnReceived",
      "RefundInitiated",
      "RefundCompleted",
      "ReplacementShipped",
      "ReplacementDelivered"
    ],
    default: "ReturnRequested"
  },
  deliveryPartnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: Date,
  pickupDate: Date,
  refundAmount: Number,
  adminNotes: String
}, { timestamps: true });

module.exports = mongoose.model("Return", returnSchema);
