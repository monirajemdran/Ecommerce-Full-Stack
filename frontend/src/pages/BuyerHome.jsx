import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import OfferSection from "../components/OfferSection";
import BuyerPromoBanner from "../components/BuyerPromoBanner";
import BuyerVibeStrip from "../components/BuyerVibeStrip";
import CheckoutModal from "../components/CheckoutModal";
import LeftSidebar from "../components/LeftSidebar";
import ChatbotWidget from "../components/ChatbotWidget";
import "./BuyerHome.css";

function BuyerHome() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // FILTER STATES
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();

  useEffect(() => {
    axios.get("https://shopverse-m5i8.onrender.com/api/products")
      .then(res => setProducts(res.data.filter(item => item.approved !== false)));

    axios.get("https://shopverse-m5i8.onrender.com/api/products/categories")
      .then(res => setCategories(res.data));

    if (location.state?.autoOpen) {
      const savedProduct = JSON.parse(localStorage.getItem("lastCheckoutProduct"));
      if (savedProduct) {
        setSelectedProduct(savedProduct);
        setShowCheckout(true);
      }
    }

    if (location.state?.selectedCategory) {
      setSelectedCategory(location.state.selectedCategory);
    }
  }, [location]);

  const openCheckout = (product) => {
    setSelectedProduct(product);
    setShowCheckout(true);
  };

  const filteredProducts = products.filter(item => {
    const priceToCompare = Number(item.discountPrice || item.originalPrice || 0);
    return (
      (selectedColor ? item.color === selectedColor : true) &&
      (selectedSize ? item.size === selectedSize : true) &&
      (selectedCategory ? item.category === selectedCategory : true) &&
      (priceToCompare <= maxPrice) &&
      (searchQuery ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) : true)
    );
  });

  return (
    <div className="buyer-home-container">
      <Navbar 
        searchQuery={searchQuery} 
        onSearch={setSearchQuery} 
        toggleFilters={() => setIsSidebarOpen(true)} 
      />  
     
      <LeftSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        selectedSize={selectedSize}
        setSelectedSize={setSelectedSize}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      <div className="buyer-full-bleed">
        <BuyerPromoBanner />
        <div className="buyer-offers-wrap">
          <OfferSection products={products} />
        </div>
        <BuyerVibeStrip />
      </div>

      <div className="main-content-area">
        <div className="products-grid-wrapper">
          <div className="products-row">
            {filteredProducts.map(item => (
              <div key={item._id} onClick={() => setSelectedProduct(item)}>
                <ProductCard product={item} openCheckout={openCheckout} />
                 
              </div>
              
              
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="no-results">
              <h3>No products found matching your filters.</h3>
              <br/>
              <br/>
              <button className="btnclearall" onClick={() => {
                 setSelectedSize(""); setSelectedColor(""); setMaxPrice(5000);
                 setSelectedCategory("");
                 setSearchQuery("");
              }}>Clear All Filters</button>
            </div>
          )}
        </div>
        <br/>
        <br/>
        <button className="btnclearall" onClick={() => {
                 setSelectedSize(""); setSelectedColor(""); setMaxPrice(5000);
                 setSelectedCategory("");
                 setSearchQuery("");
              }}>Clear All Filters</button>
      </div>

      {showCheckout && selectedProduct && (
        <CheckoutModal 
          show={showCheckout} 
          setShow={setShowCheckout} 
          product={selectedProduct} 
          currentUser={currentUser} 
        />
      )}
      
      <ChatbotWidget />
    </div>
  );
}

export default BuyerHome;

