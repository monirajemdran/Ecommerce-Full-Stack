import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import CheckoutModal from "../components/CheckoutModal";
import "./OffersPage.css";

function OffersPage() {
  const [products, setProducts] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    axios
      .get("https://shopverse-m5i8.onrender.com/api/products")
      .then((res) => {
        // Filter specifically for offer products that have been approved
        const offerProducts = res.data.filter(
          (item) => item.isOffer === true && item.approved === true
        );
        setProducts(offerProducts);
      })
      .catch((err) => console.error(err));
  }, []);

  const openCheckout = (product) => {
    setSelectedProduct(product);
    setShowCheckout(true);
  };

  const filteredProducts = products.filter((item) =>
    searchQuery
      ? item.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="offers-page-container">
      <Navbar
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
      />

      <div className="offers-content-area animate-fade-in">
        <div className="offers-header">
          <h1 className="offers-title">
            Exclusive Deals & Offers 🎁
          </h1>
          <p className="offers-subtitle">
            Unbeatable discounts, verified promo codes, and handpicked collections just for you!
          </p>
          <div className="header-decoration-bar"></div>
        </div>

        <div className="products-grid-wrapper">
          <div className="offers-products-grid">
            {filteredProducts.map((item, index) => (
              <div 
                key={item._id} 
                className="offer-card-wrapper animate-card-appear" 
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="offer-card-inner">
                  <ProductCard product={item} openCheckout={openCheckout} />
                  {item.couponCode && (
                    <div className="offer-coupon-badge">
                      <span className="coupon-icon">🏷️</span>
                      <span className="coupon-label">USE CODE:</span>
                      <span className="coupon-value">{item.couponCode}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="no-offers-results animate-fade-in">
              <div className="no-offers-icon">🛍️</div>
              <h3>No active offer products found matching your search.</h3>
              <p>Check back soon for exclusive deals!</p>
            </div>
          )}
        </div>
      </div>

      {showCheckout && selectedProduct && (
        <CheckoutModal
          show={showCheckout}
          setShow={setShowCheckout}
          product={selectedProduct}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

export default OffersPage;

