import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import Swal from "sweetalert2";
import "./ProductDetails.css";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user"));
  
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Scroll to top when product changes
    window.scrollTo(0, 0);
    setLoading(true);

    const fetchDetails = async () => {
      try {
        // Fetch Product
        const productRes = await axios.get(`http://localhost:5000/api/products/${id}`);
        setProduct(productRes.data);

        // Fetch Reviews
        const reviewsRes = await axios.get(`http://localhost:5000/api/reviews/product/${id}`);
        setReviews(reviewsRes.data);

        // Fetch Related Products (same category)
        const allProductsRes = await axios.get("http://localhost:5000/api/products");
        const categoryMatch = allProductsRes.data.filter(
          (p) => p.category === productRes.data.category && p._id !== id
        );
        setRelatedProducts(categoryMatch.slice(0, 4)); // Show top 4

      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Product Not Found",
          text: "The product you are looking for does not exist or has been removed."
        });
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, navigate]);

  const discount =
    product?.originalPrice && product?.discountPrice
      ? Math.round(
          ((product.originalPrice - product.discountPrice) / product.originalPrice) * 100
        )
      : 0;

  const addToCart = async () => {
    if (!currentUser) {
      Swal.fire({ icon: "info", title: "Login Required 💖", text: "Please login or register to add products to cart." });
      return;
    }
    if (currentUser.role === "seller") {
      Swal.fire({ icon: "warning", title: "Seller Account", text: "Sellers cannot purchase products." });
      return;
    }
    try {
      await axios.post("http://localhost:5000/api/cart/add", { userId: currentUser._id, productId: product._id });
      Swal.fire({ icon: "success", title: "Added To Cart 🛒", confirmButtonColor: "#ff1493" });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error Adding Product" });
    }
  };

  const addToWishlist = async () => {
    if (!currentUser) {
      Swal.fire({ icon: "info", title: "Login Required" });
      return;
    }
    try {
      await axios.post("http://localhost:5000/api/wishlist/add", { userId: currentUser._id, productId: product._id });
      Swal.fire({ icon: "success", title: "Added To Wishlist ❤️" });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error" });
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading Product Details...</div>;
  }

  if (!product) return null;

  return (
    <>
      <Navbar />
      <div className="product-details-container">
        
        {/* Top Section - Product Info */}
        <div className="product-details-top">
          <div className="pd-image-section">
            <img src={product.image} alt={product.name} />
          </div>
          <div className="pd-info-section">
            <h1 className="pd-title">{product.name}</h1>
            <p className="pd-category">Category: <span>{product.category}</span></p>
            <p className="pd-seller">Seller: <span>{product.sellerName || "Unknown"}</span></p>

            <div className="pd-price-box">
              {product.isOffer && product.discountPrice ? (
                <>
                  <span className="pd-discount-price">₹{product.discountPrice}</span>
                  <span className="pd-original-price">₹{product.originalPrice}</span>
                  <span className="pd-discount-badge">{discount}% OFF</span>
                </>
              ) : (
                <span className="pd-discount-price">₹{product.originalPrice || 0}</span>
              )}
            </div>

            <div className="pd-attributes">
              <p><strong>Color:</strong> {product.color || "N/A"}</p>
              <p><strong>Size:</strong> {product.size || "N/A"}</p>
            </div>

            <div className="pd-actions">
              {product.stock <= 0 ? (
                <button className="pd-out-btn" disabled>Out Of Stock</button>
              ) : (
                <>
                  <p className="pd-stock">Stock: {product.stock} available</p>
                  <div className="pd-btn-group">
                    <button className="pd-cart-btn" onClick={addToCart}>Add to Cart</button>
                    <button className="pd-wish-btn" onClick={addToWishlist}>Add to Wishlist</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="pd-reviews-section">
          <h2>Product Reviews ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <p className="no-reviews">No reviews yet for this product.</p>
          ) : (
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review._id} className="review-card">
                  <div className="review-header">
                    <span className="review-user">{review.userId?.name || "Anonymous"}</span>
                    <span className="review-rating">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                  </div>
                  <p className="review-text">"{review.comment}"</p>
                  <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="pd-related-section">
            <h2>Related Products</h2>
            <div className="related-products-grid">
              {relatedProducts.map((p) => (
                <ProductCard key={p._id} product={p} openCheckout={() => navigate(`/product/${p._id}`)} />
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default ProductDetails;
