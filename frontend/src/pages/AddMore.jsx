import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";
import { FaPlus, FaArrowLeft, FaMagic } from "react-icons/fa";
import "./AddMore.css";

function AddMore() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingItems, setPendingItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch products
    axios.get("http://localhost:5000/api/products")
      .then(res => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    // Load existing pending items
    const saved = JSON.parse(localStorage.getItem("pendingItems") || "[]");
    setPendingItems(saved);
  }, []);

  const addToPending = (product) => {
    const newItem = {
      _id: Date.now().toString(),
      productId: product,
      quantity: 1
    };
    const updated = [...pendingItems, newItem];
    setPendingItems(updated);
    localStorage.setItem("pendingItems", JSON.stringify(updated));

    Swal.fire({
      icon: 'success',
      title: 'Added!',
      text: `${product.name} added to your checkout list.`,
      timer: 1000,
      showConfirmButton: false,
      background: '#fff5fa'
    });
  };

  if (loading) return <div className="loader">Loading Styles... <FaMagic className="spin" /></div>;

  return (
    <div className="add-more-container">
      <Navbar />
      
      <div className="add-more-hero">
        <h1>Discover More <FaMagic style={{marginLeft: '10px'}} /></h1>
        <p>Your Selection: <strong>{pendingItems.length}</strong> items</p>
      </div>

      <div className="add-more-grid">
        {products.map(product => (
          <div key={product._id} className="add-more-card">
            <div className="card-image-wrap">
              <img src={product.image} alt={product.name} />
              <div className="overlay">
                <button onClick={() => addToPending(product)}><FaPlus /> Add</button>
              </div>
            </div>
            <div className="card-info">
              <h3>{product.name}</h3>
              <p className="price">₹{product.discountPrice}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="sticky-footer">
        <button className="finish-btn" onClick={() => navigate("/buyer", { state: { autoOpen: true } })}>
          <FaArrowLeft style={{marginRight: '10px'}} /> Return to Checkout
        </button>
      </div>

    </div>
  );
}

export default AddMore;
