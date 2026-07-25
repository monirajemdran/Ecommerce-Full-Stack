const express = require("express");
const router = express.Router();
const returnController = require("../controllers/returnController");
const protect = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

// Set up multer for return images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/returns/");
  },
  filename: function (req, file, cb) {
    cb(null, "return-" + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Buyer Routes
router.post("/request", protect, upload.array("images", 3), returnController.requestReturn);
router.get("/buyer", protect, returnController.getBuyerReturns);

// Seller Routes
router.get("/seller", protect, returnController.getSellerReturns);
router.put("/:returnId/status", protect, returnController.updateReturnStatus);

// Delivery Routes
router.get("/delivery", protect, returnController.getDeliveryReturns);

// Admin Routes (Can share update status, but also specific assignment)
router.get("/", protect, returnController.getAllReturns);
router.put("/:returnId/assign-pickup", protect, returnController.assignPickup);

module.exports = router;
