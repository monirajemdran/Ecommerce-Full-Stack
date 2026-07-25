const express = require("express");

const Cart = require("../models/Cart");

const router = express.Router();


// ADD TO CART (specific route first)
router.post("/add", async (req, res) => {

  try {

    const { userId, productId } = req.body;

    const existing = await Cart.findOne({
      userId,
      productId
    });

    if (existing) {

      existing.quantity += 1;

      await existing.save();

      return res.json(existing);
    }

    const cart = await Cart.create({

      userId,
      productId,
      quantity: 1

    });

    res.json(cart);

  } catch (err) {

    console.log(err);

    res.status(500).json(err);

  }

});


// UPDATE QUANTITY
router.put("/:id", async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (isNaN(quantity) || quantity < 1) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const cart = await Cart.findByIdAndUpdate(
      req.params.id,
      { quantity: parseInt(quantity) },
      { new: true }
    ).populate("productId");

    if (!cart) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.json(cart);
  } catch (err) {
    console.log("Cart Update Error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});


// GET USER CART
router.get("/:userId", async (req, res) => {

  try {

    const cartItems = await Cart.find({

      userId: req.params.userId

    }).populate("productId");

    res.json(cartItems);

  } catch (err) {

    console.log(err);

    res.status(500).json(err);

  }

});


// DELETE ITEM
router.delete("/:id", async (req, res) => {
  try {
    await Cart.findByIdAndDelete(req.params.id);
    res.json({ message: "Item Removed" });
  } catch (err) {
    res.status(500).json(err);
  }
});


// CLEAR USER CART
router.delete("/user/:userId", async (req, res) => {
  try {
    await Cart.deleteMany({ userId: req.params.userId });
    res.json({ message: "Cart Cleared" });
  } catch (err) {
    res.status(500).json(err);
  }
});


module.exports = router;