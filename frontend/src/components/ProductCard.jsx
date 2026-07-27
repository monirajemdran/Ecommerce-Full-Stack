 import { useState } from "react";
import Swal from "sweetalert2";
import "./ProductCard.css";
import axios from "axios";
import { FaHeart } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

function ProductCard({

  product,

  openCheckout

}) {

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();



  const discount =
    product?.originalPrice && product?.discountPrice
      ? Math.round(
          ((product.originalPrice - product.discountPrice) /
            product.originalPrice) *
            100
        )
      : 0;

  // ADD TO CART
  const addToCart = async () => {

  if (!currentUser) {

    Swal.fire({
      icon: "info",
      title: "Login Required 💖",
      text: "Please login or register to add products to cart.",
      confirmButtonColor: "#ff1493"
    });

    return;
  }

  if (currentUser.role === "seller") {

    Swal.fire({
      icon: "warning",
      title: "Seller Account",
      text: "Sellers cannot purchase products.",
      confirmButtonColor: "#ff1493"
    });

    return;
  }

  try {

    await axios.post(
      "https://shopverse-m5i8.onrender.com/api/cart/add",
      {
        userId: currentUser._id,
        productId: product._id
      }
    );

    Swal.fire({
      icon: "success",
      title: "Added To Cart 🛒",
      confirmButtonColor: "#ff1493"
    });

  } catch (err) {

    Swal.fire({
      icon: "error",
      title: "Error Adding Product"
    });

  }

};
// ADD TO WISHLIST
const addToWishlist = async () => {

  if (!currentUser) {

    Swal.fire({
      icon: "info",
      title: "Login Required"
    });

    return;
  }

  try {

    await axios.post(
  "https://shopverse-m5i8.onrender.com/api/wishlist/add",
  {
    userId: currentUser._id,
    productId: product._id
  }
);

    Swal.fire({
      icon: "success",
      title: "Added To Wishlist ❤️"
    });

  } catch (err) {

    Swal.fire({
      icon: "error",
      title: "Error"
    });

  }

};

  // BUY NOW
  

  return (

    <div className="product-card">
        <div className="wishlist-icon">

          <FaHeart onClick={addToWishlist}/>
         </div>
      <Link to={`/product/${product?._id}`}>
        <img src={product?.image} alt="" style={{ cursor: "pointer" }} />
      </Link>

      <div className="product-details">

        <Link to={`/product/${product?._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3>{product?.name}</h3>
        </Link>

        {/* Rating star badge mock */}
        <div className="rating-badge">
          {product?.rating || 4.3} ★
        </div>

        <div className="price-box">
          {product?.isOffer && product?.discountPrice ? (
            <>
              <span className="discount-price">₹{product.discountPrice}</span>
              <span className="original-price">₹{product.originalPrice}</span>
              <span className="discount-percentage">{discount}% off</span>
            </>
          ) : (
            <span className="discount-price">₹{product?.originalPrice || 0}</span>
          )}
        </div>

        <p>Color : {product?.color}</p>
        <p>Size : {product?.size}</p>
        <p>Category : {product?.category}</p>

        {product?.stock <= 0 ? (

          <button className="out-btn" disabled>
            Out Of Stock
          </button>

        ) : (

          <>
            <p className="stock-text">
              Stock : {product?.stock}
            </p>

            <button className="cart-btn" onClick={addToCart}>
              Add To Cart
            </button>

            <button
  className="buy-btn"
  onClick={() =>
    openCheckout(product)
  }
>
  Buy Now
</button>
          </>
        )}

        {/* ✅ CHECKOUT MODAL */}
       

      </div>

    </div>
  );
}

export default ProductCard;
