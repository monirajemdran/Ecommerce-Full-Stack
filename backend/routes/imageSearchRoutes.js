const router = require("express").Router();
const multer = require("multer");
const imageSearchController = require("../controllers/imageSearchController");

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  }
});

// POST: Search by uploaded image
router.post("/search", upload.single("image"), imageSearchController.searchByImage);

// GET: Find similar products by product ID
router.get("/similar/:productId", imageSearchController.findSimilarProducts);

// GET: Get image hash for a specific product
router.get("/hash/:productId", imageSearchController.getProductImageHash);

module.exports = router;
