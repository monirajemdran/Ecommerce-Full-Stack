const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  sellerName: { type: String, default: "" },
  sellerEmail: { type: String, default: "" },
  isHidden: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);
