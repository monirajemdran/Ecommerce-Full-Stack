const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");
const User = require("../models/User");

// Public: buyer submits a review (purchase history)
router.post("/", async (req, res) => {
  try {
    const { productId, userId, rating, comment, sellerName, sellerEmail } = req.body;

    if (!productId || !userId) {
      return res.status(400).json({ message: "productId and userId are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid product or user id" });
    }

    const r = Number(rating);
    if (!Number.isFinite(r) || r < 1 || r > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const text = (comment || "").trim();
    if (!text) {
      return res.status(400).json({ message: "Review text is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existing = await Review.findOne({ productId, userId });
    if (existing) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    let resolvedSellerName =
      (sellerName && String(sellerName).trim()) || (product.sellerName || "") || "";
    let resolvedSellerEmail =
      sellerEmail && String(sellerEmail).trim() ? String(sellerEmail).trim() : "";

    if ((!resolvedSellerEmail || !resolvedSellerName) && product.sellerId) {
      const sellerUser = await User.findById(product.sellerId).select("name email");
      if (sellerUser) {
        if (!resolvedSellerName) resolvedSellerName = sellerUser.name || "";
        if (!resolvedSellerEmail) resolvedSellerEmail = sellerUser.email || "";
      }
    }

    const review = new Review({
      productId,
      userId,
      rating: Math.round(r),
      comment: text,
      sellerName: resolvedSellerName,
      sellerEmail: resolvedSellerEmail,
    });

    await review.save();
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// Get reviews for a specific product
router.get("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product id" });
    }
    const reviews = await Review.find({ productId, isHidden: false })
      .populate("userId", "name")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

module.exports = router;
