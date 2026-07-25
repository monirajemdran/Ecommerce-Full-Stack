// models/Order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      productName: String,
      productImage: String,
      quantity: Number,
      price: Number,
      sellerId: String,
      sellerName: String,
      sellerEmail: String,
      sellerMobile: String,
      sellerAddress: String,
      itemStatus: { type: String, default: "Pending" },
      isReturned: { type: Boolean, default: false }
    }
  ],
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  totalPrice: Number,
  buyerId: String,
  buyerName: String,
  buyerEmail: String,
  buyerMobile: String,
  buyerAddress: String,
  status: { type: String, default: "Order Placed" },
  paymentMethod: { type: String, default: "Cash on Delivery" },
  paymentStatus: { type: String, default: "Pending" },
  paymentDetails: { type: Object },
  deliveryMethod: { type: String, default: "Standard Delivery" },
  deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deliveryStatus: { type: String, default: "Pending" },
  sellerAcceptedAt: Date,
  shippedAt: Date,
  outForDeliveryAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  returnRequestedAt: Date,
  returnReason: String,
  deliveryOTP: String,
  buyerOTP: String,
  amountCollected: { type: Boolean, default: false }
}, { timestamps: true });


module.exports = mongoose.model("Order", orderSchema);