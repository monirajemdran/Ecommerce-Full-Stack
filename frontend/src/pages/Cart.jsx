import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./Cart.css";
import CheckoutModal from "../components/CheckoutModal";
import Navbar from "../components/Navbar";

function Cart() {
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));

  // GET CART
  const getCart = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/cart/${user._id}`);
      setCart(res.data);
    } catch (err) {
      console.error("Failed to load cart:", err);
    }
  };

  useEffect(() => {
    getCart();
  }, []);

  // REMOVE ITEM
  const removeItem = async (id) => {
    await axios.delete(`http://localhost:5000/api/cart/${id}`);
    Swal.fire({ icon: "success", title: "Item Removed" });
    getCart();
  };

  // UPDATE QUANTITY
  const updateQuantity = async (id, newQty) => {
    if (isNaN(newQty) || newQty < 1) return;
    try {
      await axios.put(`http://localhost:5000/api/cart/${id}`, { quantity: newQty });
      getCart();
    } catch (err) {
      console.error("Cart update failed:", err);
    }
  };

  // CALCULATE TOTAL
  const totalPrice = cart.reduce((sum, item) => {
    return sum + (item.productId.discountPrice * item.quantity);
  }, 0);

  // BUY NOW
  const buyNow = (item = null) => {
    if (!item && cart.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Cart Empty",
        text: "Please add items to cart before checkout"
      });
      return;
    }

    if (item) {
      // Clear pendingItems, pass this single item
      localStorage.setItem("pendingItems", JSON.stringify([]));
      localStorage.setItem("initialQty", item.quantity.toString());
      setSelectedItem(item);
    } else {
      // Map other items to pendingItems and pass the first item
      const firstItem = cart[0];
      const restItems = cart.slice(1).map(cItem => ({
        _id: cItem._id,
        productId: cItem.productId,
        quantity: cItem.quantity,
        couponCode: ""
      }));
      localStorage.setItem("pendingItems", JSON.stringify(restItems));
      localStorage.setItem("initialQty", firstItem.quantity.toString());
      setSelectedItem(null);
    }
    setShowCheckout(true);
  };

  // ON SUCCESSFUL CHECKOUT
  const handleCheckoutSuccess = async () => {
    try {
      if (selectedItem) {
        // Clear specific checkout item from database
        await axios.delete(`http://localhost:5000/api/cart/${selectedItem._id}`);
      } else {
        // Clear whole cart from database for this user
        await axios.delete(`http://localhost:5000/api/cart/user/${user._id}`);
      }
      setSelectedItem(null);
      getCart();
    } catch (err) {
      console.error("Failed to clear cart:", err);
    }
  };

  return (
    <div className="cart-page">
      <Navbar/>
      <h1 className="cart-title">My Cart 🛒</h1>
      {cart.length === 0 && (
        <div className="empty-cart">
          <h2>Cart Is Empty 💔</h2>
        </div>
      )}

      {cart.map((item) => (
        <div key={item._id} className="cart-card">
          <img
            src={item.productId.image}
            alt=""
            className="cart-image"
          />

          <div className="cart-details">
            <h2>{item.productId.name}</h2>

            <p className="cart-price">
              ₹ {item.productId.discountPrice}
            </p>

            <div className="cart-qty-section">
              <label>Qty:</label>
              <div className="qty-btns">
                <button 
                  className="qty-btn"
                  onClick={() => updateQuantity(item._id, item.quantity - 1)}
                >-</button>
                <input 
                  type="number" 
                  min="1" 
                  value={item.quantity} 
                  className="cart-qty-input"
                  onChange={(e) => updateQuantity(item._id, parseInt(e.target.value))}
                />
                <button 
                  className="qty-btn"
                  onClick={() => updateQuantity(item._id, item.quantity + 1)}
                >+</button>
              </div>
            </div>

            <div className="cart-item-actions">
              <button 
                className="buy-now-item-btn"
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
        </div>
      ))}

      {cart.length > 0 && (
        <div className="cart-summary">
          <h3>Order Summary</h3>
          <p className="summary-total">
            Total: ₹ {totalPrice}
          </p>
          <button 
            className="buy-btn"
            onClick={() => buyNow()}
          >
            Buy All Now 💳
          </button>
        </div>
      )}

      {/* INTEGRATED FULL PAYMENT GATEWAY SIMULATION CHECKOUT MODAL */}
      {showCheckout && (
        <CheckoutModal
          show={showCheckout}
          setShow={setShowCheckout}
          product={selectedItem ? selectedItem.productId : cart[0]?.productId}
          currentUser={user}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  );
}

export default Cart;