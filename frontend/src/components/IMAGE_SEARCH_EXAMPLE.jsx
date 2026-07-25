// EXAMPLE: How to integrate image search into ChatbotWidget.jsx
// This shows how to use the image search API when a user uploads an image

import axios from 'axios';

// At the top of ChatbotWidget.jsx, import the image search service
// import { searchProductsByImage } from '@/services/imageSearchService';

// Or use it directly with axios in the handleProductInquiry function:

/*
const handleProductInquiry = async (text, file) => {
  try {
    // If user uploaded an image, search by image
    if (file) {
      const formData = new FormData();
      formData.append("image", file);

      try {
        const imageSearchRes = await axios.post(
          "http://localhost:5000/api/images/search",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        const imageResults = imageSearchRes.data.results;
        
        if (imageResults && imageResults.length > 0) {
          const availableProducts = imageResults.filter(p => p.stock > 0);
          
          if (availableProducts.length > 0) {
            setSearchResults(availableProducts);
            setSearchIndex(0);
            addBotMessage(
              `🖼️ Found ${availableProducts.length} similar products based on your image:`,
              []
            );
            showProductCarousel(availableProducts, 0);
            return;
          }
        }
      } catch (imageSearchErr) {
        console.error("Image search error:", imageSearchErr);
        addBotMessage(
          "Could not search by image. Trying text search instead...",
          []
        );
      }
    }

    // Fallback to text search if no file or image search failed
    let searchQuery = text || (file ? file.name : "");
    const res = await axios.get(
      `http://localhost:5000/api/products?search=${searchQuery}`
    );
    const products = res.data;
    
    if (products && products.length > 0) {
      const availableProducts = products.filter(p => p.stock > 0);
      const unavailableProducts = products.filter(p => p.stock <= 0);
      
      if (availableProducts.length > 0) {
        setSearchResults(availableProducts);
        setSearchIndex(0);
        addBotMessage(`Found ${availableProducts.length} product(s) matching "${searchQuery}":`, []);
        showProductCarousel(availableProducts, 0);
      } else if (unavailableProducts.length > 0) {
        setSearchResults(unavailableProducts);
        setSearchIndex(0);
        addBotMessage(
          `The product "${searchQuery}" is currently out of stock. Here are the matching products (unavailable):`,
          ["Show Related Products", "Main Menu"],
          null,
          unavailableProducts.slice(0, 3)
        );
        setStep("SHOW_RELATED");
      }
    } else {
      addBotMessage(`No products found for "${searchQuery}". Fetching related items...`, []);
      try {
        const relatedRes = await axios.get(
          `http://localhost:5000/api/products?category=dress&limit=5`
        );
        const relatedProducts = relatedRes.data?.filter(p => p.stock > 0) || [];
        
        if (relatedProducts.length > 0) {
          setSearchResults(relatedProducts);
          setSearchIndex(0);
          addBotMessage(
            `No exact match found. Here are some related dress products available:`,
            ["Cancel Search"],
            null,
            relatedProducts.slice(0, 3)
          );
          setStep("PRODUCT_SELECTION");
        } else {
          addBotMessage("No products available at the moment. Please try again later.", [
            "Main Menu"
          ]);
        }
      } catch (relatedErr) {
        addBotMessage("Could not fetch related products. Please try searching again.", [
          "Main Menu"
        ]);
      }
    }
  } catch (err) {
    addBotMessage("Error searching product. Please try again.", ["Main Menu"]);
  }
};
*/

// FIND SIMILAR PRODUCTS EXAMPLE:
// If you want to add a "Show Similar Products" feature for a selected product:

/*
const showSimilarProducts = async (productId) => {
  try {
    const response = await axios.get(
      `http://localhost:5000/api/images/similar/${productId}?threshold=40&limit=6`
    );
    
    const similarProducts = response.data.results.filter(p => p.stock > 0);
    
    if (similarProducts.length > 0) {
      setSearchResults(similarProducts);
      setSearchIndex(0);
      addBotMessage(
        `Found similar products based on image comparison:`,
        ["Cancel Search"],
        null,
        similarProducts.slice(0, 3)
      );
      setStep("PRODUCT_SELECTION");
    } else {
      addBotMessage("No similar products found.", ["Main Menu"]);
    }
  } catch (error) {
    console.error("Error finding similar products:", error);
    addBotMessage("Could not find similar products. Please try again.", ["Main Menu"]);
  }
};
*/

export default "Integration example - See comments above";
