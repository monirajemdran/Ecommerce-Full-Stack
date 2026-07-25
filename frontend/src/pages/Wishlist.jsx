import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./Wishlist.css";
import CheckoutModal from "../components/CheckoutModal";
import Navbar from "../components/Navbar";
function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));

  // GET WISHLIST
  const getWishlist = async () => {
    if (!user?._id) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/wishlist/${user._id}`);
      const items = (res.data || []).filter((item) => item?.productId);
      setWishlist(items);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getWishlist();
  }, []);

  // REMOVE ITEM
  const removeItem = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/wishlist/${id}`);
      Swal.fire({
        icon: "success",
        title: "Removed From Wishlist ❤️"
      });
      getWishlist();
    } catch (err) {
      console.log(err);
    }
  };

  // UPDATE QUANTITY
  const updateQuantity = async (id, newQty) => {
    if (isNaN(newQty) || newQty < 1) return;
    try {
      await axios.put(`http://localhost:5000/api/wishlist/${id}`, { quantity: newQty });
      getWishlist();
    } catch (err) {
      console.error("Wishlist update failed:", err);
    }
  };

  // BUY NOW
  const buyNow = (item) => {
    if (!item?.productId) {
      Swal.fire({
        icon: "warning",
        title: "Product unavailable",
        text: "This product is no longer available. Removing from wishlist.",
        confirmButtonColor: "#D9744B"
      });
      removeItem(item._id);
      return;
    }

    if (!user) {
      Swal.fire({
        icon: "info",
        title: "Login Required 💖",
        text: "Please login or register to buy products.",
        confirmButtonColor: "#D9744B"
      });
      return;
    }

    if (user.role === "seller") {
      Swal.fire({
        icon: "warning",
        title: "Seller Account",
        text: "Sellers cannot purchase products.",
        confirmButtonColor: "#D9744B"
      });
      return;
    }

    // Setup initialQty & pendingItems
    localStorage.setItem("pendingItems", JSON.stringify([]));
    localStorage.setItem("initialQty", (item.quantity || 1).toString());
    setSelectedItem(item);
    setShowCheckout(true);
  };

  // ON SUCCESSFUL CHECKOUT
  const handleCheckoutSuccess = async () => {
    try {
      if (selectedItem) {
        // Remove item from database wishlist after successful purchase
        await axios.delete(`http://localhost:5000/api/wishlist/${selectedItem._id}`);
      }
      setSelectedItem(null);
      getWishlist();
    } catch (err) {
      console.error("Failed to delete wishlist item:", err);
    }
  };

  return (
    <div className="wishlist-page">
      <Navbar/>
      <h1 className="wishlist-title">My Wishlist ❤️</h1>

      {wishlist.length === 0 ? (
        <div className="empty-box">
          <h2>No Wishlist Products 💔</h2>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((item) => {
            const product = item.productId;
            if (!product) return null;

            return (
            <div className="wishlist-card" key={item._id}>
              <img
                src={product.image || "https://via.placeholder.com/200?text=No+Image"}
                alt={product.name || "Product"}
              />

              <h2>{product.name}</h2>

              <p className="price">
                ₹ {product.discountPrice || product.originalPrice || 0}
              </p>

              <div className="wishlist-qty-section">
                <label>Qty:</label>
                <div className="qty-btns">
                  <button 
                    className="qty-btn"
                    onClick={() => updateQuantity(item._id, (item.quantity || 1) - 1)}
                  >-</button>
                  <input 
                    type="number" 
                    min="1" 
                    value={item.quantity || 1} 
                    className="wishlist-qty-input"
                    onChange={(e) => updateQuantity(item._id, parseInt(e.target.value))}
                  />
                  <button 
                    className="qty-btn"
                    onClick={() => updateQuantity(item._id, (item.quantity || 1) + 1)}
                  >+</button>
                </div>
              </div>

              <div className="wishlist-buttons">
                <button
                  className="buy-btn"
                  onClick={() => buyNow(item)}
                >
                  Buy Now
                </button>

                <button
                  className="remove-btn"
                  onClick={() => removeItem(item._id)}
                >
                  Remove
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* INTEGRATED FULL PAYMENT GATEWAY SIMULATION CHECKOUT MODAL */}
      {showCheckout && selectedItem?.productId && (
        <CheckoutModal
          show={showCheckout}
          setShow={setShowCheckout}
          product={selectedItem.productId}
          currentUser={user}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  );
}

export default Wishlist;