const router = require("express").Router();
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const upload = require("../middleware/upload");

// GET CATEGORIES
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

// ADD PRODUCT
router.post(

  "/add",

  upload.single("image"),

  async (req, res) => {

    try {
      if (!req.file) {
        return res.status(400).json({ message: "Product image is required" });
      }

      req.body.image =
        "http://localhost:5000/uploads/" +
        req.file.filename;

      // Compute offer details only for offer products
      if (req.body.isOffer === 'true' || req.body.isOffer === true) {
        const original = Number(req.body.originalPrice);
        const discount = Number(req.body.discountPrice);
        req.body.offerPercentage = Math.round(((original - discount) / original) * 100);
      } else {
        // Regular product: set discountPrice same as original and no offer percentage
        req.body.discountPrice = req.body.originalPrice;
        req.body.offerPercentage = 0;
      }

      // ✅ ADD THESE

      req.body.sellerId =

        req.body.sellerId;

      req.body.sellerName =

        req.body.sellerName;

      // ✅ CREATE PRODUCT

      const product =

        new Product(req.body);

      await product.save();

      res.json(product);

    } catch (error) {

      console.log(error);

      res.status(500).json(error);

    }

  }

);


// GET PRODUCTS

router.get("/", async (req, res) => {

  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = { name: { $regex: search, $options: "i" } };
    }

    const products = await Product.find(query);

    res.json(products);

  } catch (error) {

    console.log(error);

    res.status(500).json(error);

  }

});

// GET SINGLE PRODUCT (e.g. review modal enrichment, product details)
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

// UPDATE PRODUCT

router.put(
  "/:id",
  upload.single("image"),
  async (req, res) => {

    try {
      const oldProduct =
await Product.findById(
  req.params.id
);

      if (req.file) {

        req.body.image =
          "http://localhost:5000/uploads/" +
          req.file.filename;

      }else {

        // KEEP OLD IMAGE
        req.body.image =
          oldProduct.image;

      }
      if(
  req.body.originalPrice &&
  req.body.discountPrice
){

  const original =
    Number(req.body.originalPrice);

  const discount =
    Number(req.body.discountPrice);

  req.body.offerPercentage =
    Math.round(
      (
        (original - discount)
        / original
      ) * 100
    );

}
      const updatedProduct =
        await Product.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true }
        );

      res.json(updatedProduct);

    } catch (error) {

      console.log(error);

      res.status(500).json(error);

    }

  }
);
//quantity update after order placed
router.put("/reduce-stock/:id", async (req, res) => {
  try {

    const { qty } = req.body;

    const product = await Product.findById(req.params.id);

    product.stock = product.stock - qty;

    if (product.stock < 0) product.stock = 0;

    await product.save();

    res.json(product);

  } catch (err) {
    res.status(500).json(err);
  }
});

// DELETE PRODUCT

router.delete("/:id", async (req, res) => {

  try {

    await Product.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message: "Product Deleted"
    });

  } catch (error) {

    console.log(error);

    res.status(500).json(error);

  }

});


module.exports = router;