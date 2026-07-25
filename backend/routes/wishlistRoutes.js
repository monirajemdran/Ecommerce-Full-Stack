const express = require("express");

const Wishlist = require("../models/Wishlist");

const router = express.Router();


// TEST ROUTE
router.get("/test", (req, res) => {

  res.send("Wishlist Route Working");

});


// ADD TO WISHLIST
router.post("/add", async (req, res) => {

  try {

    const { userId, productId } = req.body;

    const existing = await Wishlist.findOne({

      userId,
      productId

    });

    if (existing) {

      return res.json({
        message: "Already Added"
      });

    }

    const wishlist = await Wishlist.create({

      userId,
      productId

    });

    res.json(wishlist);

  } catch (err) {

    console.log(err);

    res.status(500).json(err);

  }

});


// GET USER WISHLIST
router.get("/:userId", async (req, res) => {
  try {
    const items = await Wishlist.find({
      userId: req.params.userId
    }).populate("productId");

    const validItems = items.filter((item) => item.productId);
    const orphanedIds = items
      .filter((item) => !item.productId)
      .map((item) => item._id);

    if (orphanedIds.length > 0) {
      await Wishlist.deleteMany({ _id: { $in: orphanedIds } });
    }

    res.json(validItems);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch wishlist" });
  }
});


// DELETE WISHLIST ITEM
router.delete("/:id", async (req, res) => {

  try {

    await Wishlist.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message: "Removed"
    });

  } catch (err) {

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

    const item = await Wishlist.findByIdAndUpdate(
      req.params.id,
      { quantity: parseInt(quantity) },
      { new: true }
    ).populate("productId");

    if (!item) {
      return res.status(404).json({ message: "Wishlist item not found" });
    }

    res.json(item);
  } catch (err) {
    console.log("Wishlist Update Error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});


module.exports = router;