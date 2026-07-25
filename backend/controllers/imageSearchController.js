const sharp = require("sharp");
const { imageHash } = require("image-hash");
const fs = require("fs").promises;
const path = require("path");
const Product = require("../models/Product");
const axios = require("axios");

// Compute perceptual hash for an image buffer
const computeImageHash = (imageBuffer) => {
  return new Promise((resolve, reject) => {
    imageHash({ data: imageBuffer, ext: 'image/png' }, 16, true, (error, hash) => {
      if (error) return reject(error);
      resolve(hash);
    });
  });
};

// Calculate Hamming distance between two hashes
const hammingDistance = (hash1, hash2) => {
  let dist = 0;
  const len = Math.min(hash1.length, hash2.length);
  for (let i = 0; i < len; i++) {
    if (hash1[i] !== hash2[i]) dist += 1;
  }
  return dist;
};

// Process image from URL or local file path
const processImageToBuffer = async (imagePath) => {
  try {
    if (imagePath.startsWith("http")) {
      const response = await axios.get(imagePath, { responseType: "arraybuffer" });
      return Buffer.from(response.data);
    } else {
      const fullPath = path.join(__dirname, "..", imagePath.replace("http://localhost:5000/", ""));
      return await fs.readFile(fullPath);
    }
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
};

// Normalize image for comparison
const normalizeImage = async (imageBuffer) => {
  try {
    return await sharp(imageBuffer)
      .resize(256, 256, { fit: "cover" })
      .grayscale()
      .toFormat("png")
      .toBuffer();
  } catch (error) {
    console.error("Error normalizing image:", error);
    throw error;
  }
};

// Search for similar products by image
exports.searchByImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const queryImageBuffer = req.file.buffer;
    const normalizedQuery = await normalizeImage(queryImageBuffer);
    const queryHash = await computeImageHash(normalizedQuery);

    // Get all products with images
    const products = await Product.find({ image: { $exists: true, $ne: null } });

    // Calculate similarity for each product
    const resultsWithDistance = await Promise.all(
      products.map(async (product) => {
        try {
          const productImageBuffer = await processImageToBuffer(product.image);
          const normalizedProduct = await normalizeImage(productImageBuffer);
          const productHash = await computeImageHash(normalizedProduct);
          const distance = hammingDistance(queryHash, productHash);

          return {
            ...product.toObject(),
            similarity: Math.max(0, 100 - distance * 2),
            distance
          };
        } catch (error) {
          console.error(`Error processing product ${product._id}:`, error);
          return {
            ...product.toObject(),
            similarity: 0,
            distance: Infinity
          };
        }
      })
    );

    // Sort by similarity (highest first) and filter out very dissimilar products
    const sortedResults = resultsWithDistance
      .filter((product) => product.similarity >= 30)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);

    res.json({
      message: "Image search completed",
      results: sortedResults
    });
  } catch (error) {
    console.error("Error in searchByImage:", error);
    res.status(500).json({ message: "Error searching for similar images", error: error.message });
  }
};

// Search for similar products by product ID and image
exports.findSimilarProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const { threshold = 30, limit = 10 } = req.query;

    const referenceProduct = await Product.findById(productId);
    if (!referenceProduct || !referenceProduct.image) {
      return res.status(404).json({ message: "Product or product image not found" });
    }

    // Process reference product image
    const referenceImageBuffer = await processImageToBuffer(referenceProduct.image);
    const normalizedReference = await normalizeImage(referenceImageBuffer);
    const referenceHash = await computeImageHash(normalizedReference);

    // Get all other products with images
    const products = await Product.find({
      _id: { $ne: productId },
      image: { $exists: true, $ne: null }
    });

    // Calculate similarity for each product
    const resultsWithDistance = await Promise.all(
      products.map(async (product) => {
        try {
          const productImageBuffer = await processImageToBuffer(product.image);
          const normalizedProduct = await normalizeImage(productImageBuffer);
          const productHash = await computeImageHash(normalizedProduct);
          const distance = hammingDistance(referenceHash, productHash);

          return {
            ...product.toObject(),
            similarity: Math.max(0, 100 - distance * 2),
            distance
          };
        } catch (error) {
          console.error(`Error processing product ${product._id}:`, error);
          return {
            ...product.toObject(),
            similarity: 0,
            distance: Infinity
          };
        }
      })
    );

    // Sort by similarity and apply threshold
    const sortedResults = resultsWithDistance
      .filter((product) => product.similarity >= parseInt(threshold))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, parseInt(limit));

    res.json({
      referenceProduct: {
        _id: referenceProduct._id,
        name: referenceProduct.name
      },
      message: `Found ${sortedResults.length} similar products`,
      results: sortedResults
    });
  } catch (error) {
    console.error("Error in findSimilarProducts:", error);
    res.status(500).json({ message: "Error finding similar products", error: error.message });
  }
};

// Get image hash for a product
exports.getProductImageHash = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product || !product.image) {
      return res.status(404).json({ message: "Product or product image not found" });
    }

    const imageBuffer = await processImageToBuffer(product.image);
    const normalizedImage = await normalizeImage(imageBuffer);
    const hash = await computeImageHash(normalizedImage);

    res.json({
      productId: product._id,
      productName: product.name,
      hash: hash,
      message: "Image hash computed successfully"
    });
  } catch (error) {
    console.error("Error in getProductImageHash:", error);
    res.status(500).json({ message: "Error computing image hash", error: error.message });
  }
};
