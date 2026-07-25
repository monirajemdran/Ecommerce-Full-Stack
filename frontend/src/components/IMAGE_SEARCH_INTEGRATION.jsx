// ===================================
// READY-TO-USE IMAGE SEARCH INTEGRATION
// Add this to your ChatbotWidget.jsx
// ===================================

// 1. Import at the top (already have axios)
// import axios from 'axios';

// 2. Add this function to the ChatbotWidget component
// (replaces or enhances the existing handleImageUpload function)

const handleImageUploadWithSearch = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Show user they uploaded an image
  const imageUrl = URL.createObjectURL(file);
  addUserMessage("Uploaded Image: " + file.name, imageUrl);

  // Show loading message
  addBotMessage("🔍 Searching for similar products in our catalog...");

  try {
    // Create FormData for image upload
    const formData = new FormData();
    formData.append("image", file);

    // Call the image search API
    const response = await axios.post(
      "http://localhost:5000/api/images/search",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000 // 30 second timeout for image processing
      }
    );

    const allResults = response.data.results || [];
    
    // Filter only available products
    const availableProducts = allResults.filter((p) => p.stock > 0);

    if (availableProducts.length > 0) {
      // Sort by similarity (highest first)
      availableProducts.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

      setSearchResults(availableProducts);
      setSearchIndex(0);

      // Show results summary
      const similarityText = availableProducts[0].similarity
        ? ` (${Math.round(availableProducts[0].similarity)}% match)`
        : "";

      addBotMessage(
        `✅ Found ${availableProducts.length} similar product(s)${similarityText}:`,
        []
      );

      // Display carousel
      showProductCarousel(availableProducts, 0);
      setStep("PRODUCT_SELECTION");
    } else {
      const unavailableCount = allResults.length;

      if (unavailableCount > 0) {
        addBotMessage(
          `Found ${unavailableCount} matching product(s) but they are out of stock. Would you like to see related products instead?`,
          ["Show Related Products", "Main Menu"]
        );
        setSearchResults(allResults);
        setSearchIndex(0);
        setStep("SHOW_RELATED");
      } else {
        addBotMessage(
          "No matching products found in our catalog. Let me find some related items for you...",
          []
        );

        try {
          // Fallback: show related products
          const relatedRes = await axios.get(
            "http://localhost:5000/api/products?category=dress&limit=6"
          );
          const relatedProducts = relatedRes.data?.filter((p) => p.stock > 0) || [];

          if (relatedProducts.length > 0) {
            setSearchResults(relatedProducts);
            setSearchIndex(0);
            addBotMessage(
              `Here are some popular products you might like:`,
              ["Cancel Search"],
              null,
              relatedProducts.slice(0, 3)
            );
            setStep("PRODUCT_SELECTION");
          } else {
            addBotMessage(
              "Sorry, no products available at the moment. Please try again later.",
              ["Main Menu"]
            );
          }
        } catch (relatedErr) {
          console.error("Error fetching related products:", relatedErr);
          addBotMessage(
            "Could not find related products. Please try text search instead.",
            ["Main Menu"]
          );
        }
      }
    }
  } catch (error) {
    console.error("Image search error:", error);

    // Error handling
    if (error.code === "ECONNABORTED") {
      addBotMessage(
        "Image processing took too long. Switching to text search...",
        []
      );
    } else if (error.response?.status === 400) {
      addBotMessage(
        "Invalid image file. Please upload a valid image (JPG, PNG, etc.)",
        ["Main Menu"]
      );
    } else if (error.response?.status === 500) {
      addBotMessage(
        "Server error while processing image. Please try again later.",
        ["Main Menu"]
      );
    } else {
      addBotMessage(
        "Could not search by image. Please describe the product instead.",
        ["Main Menu"]
      );
    }

    setStep("MENU");
  }
};

// 3. Update the existing handleImageUpload function to use this new one:
// Replace the current handleImageUpload with:
/*
const handleImageUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    handleImageUploadWithSearch(e); // Call the new enhanced function
  }
};
*/

// ===================================
// BONUS: Add "Show Similar Products" button to products
// ===================================

// Add this function to show similar products for a selected product:

const showSimilarProductsForItem = async (productId) => {
  addBotMessage("🔎 Finding visually similar products...");

  try {
    const response = await axios.get(
      `http://localhost:5000/api/images/similar/${productId}?threshold=40&limit=6`
    );

    const similarProducts = response.data.results.filter((p) => p.stock > 0);

    if (similarProducts.length > 0) {
      setSearchResults(similarProducts);
      setSearchIndex(0);
      addBotMessage(
        `Found ${similarProducts.length} similar product(s) based on visual comparison:`,
        []
      );
      showProductCarousel(similarProducts, 0);
      setStep("PRODUCT_SELECTION");
    } else {
      addBotMessage(
        "No similar products found. Try searching for something else.",
        ["Main Menu"]
      );
    }
  } catch (error) {
    console.error("Error finding similar products:", error);
    addBotMessage(
      "Could not find similar products. Please try again.",
      ["Main Menu"]
    );
  }
};

// ===================================
// How to use in your chatbot flow:
// ===================================

/*
1. In PRODUCT_INQUIRY step, the chatbot now supports:
   - Text search: "Find me a red shirt"
   - Image search: User uploads image, bot finds similar

2. In PRODUCT_OPTIONS step, you could add:
   - New option: "3. Show Similar Products"
   - Call: showSimilarProductsForItem(orderData.product._id)

3. Similarity scoring:
   - 90-100%: Exact or very similar
   - 70-89%: Similar style/color
   - 50-69%: Related category
   - Below 50%: Loosely related (filtered out by default)

4. User experience flow:
   User uploads shirt image
   → Image processed for similarity
   → Top 10 matching products shown
   → User clicks one to buy
   → Order flow continues normally
*/

// ===================================
// API Response Example:
// ===================================

/*
{
  "message": "Image search completed",
  "results": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Red Cotton T-Shirt",
      "image": "http://localhost:5000/uploads/shirt1.jpg",
      "originalPrice": 500,
      "discountPrice": 400,
      "stock": 15,
      "similarity": 98,
      "distance": 1,
      "category": "shirts",
      "color": "red",
      "size": "M"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Red Polo Shirt",
      "image": "http://localhost:5000/uploads/shirt2.jpg",
      "originalPrice": 650,
      "discountPrice": 550,
      "stock": 8,
      "similarity": 85,
      "distance": 4,
      "category": "shirts",
      "color": "red",
      "size": "L"
    }
  ]
}
*/

export default "Integration ready! Copy the functions above into ChatbotWidget.jsx";
