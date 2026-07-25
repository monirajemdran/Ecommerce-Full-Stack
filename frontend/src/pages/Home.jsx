import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import "./Home.css";
import AdminComplaints from "../components/AdminComplaints";
import AdminBannerUpload from "../components/AdminBannerUpload";
import ChatbotWidget from "../components/ChatbotWidget";

const BRANDS = [
  { name: "Nike", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg" },
  { name: "Adidas", logo: "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg" },
  { name: "Puma", logo: "https://upload.wikimedia.org/wikipedia/commons/8/88/Puma_Logo.svg" },
  { name: "Reebok", logo: "https://upload.wikimedia.org/wikipedia/commons/1/11/Reebok_2014_logo.svg" },
  { name: "Under Armour", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Under_armour_logo.svg" },
  { name: "RamRaj", logo: "https://ui-avatars.com/api/?name=RamRaj&background=F4F1EA&color=2C3E35&size=256&bold=true&format=svg" },
];

const brandLogoFallback = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F4F1EA&color=2C3E35&size=256&bold=true&format=svg`;

function Home() {
  const navigate = useNavigate();
  const [sliderImages, setSliderImages] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [categories, setCategories] = useState([]);
  const [rotation, setRotation] = useState(0);
  const [activeTab, setActiveTab] = useState("Store");

  const [complaint, setComplaint] = useState({ email: "", message: "" });
  const [user, setUser] = useState(null);
  const [siteSettings, setSiteSettings] = useState({
    platformName: "LuxeCart",
    supportEmail: "support@luxecart.com",
    contactPhone: "",
    address: "",
  });
 const [showProfile, setShowProfile] = useState(false);
  useEffect(() => {
    // Fetch active banner images for homepage slider
    axios.get("http://localhost:5000/api/admin/banners/active")
      .then(res => {
        const urls = res.data.map(b => b.image).filter(Boolean);
        setSliderImages(urls);
      })
      .catch(err => console.error(err));
      
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (loggedInUser) setUser(loggedInUser);

    axios.get("http://localhost:5000/api/products/categories")
      .then(res => setCategories(res.data))
      .catch(err => console.log(err));

    axios.get("http://localhost:5000/api/admin/settings")
      .then(res => {
        setSiteSettings({
          platformName: res.data.platformName || "LuxeCart",
          supportEmail: res.data.supportEmail || "support@luxecart.com",
          contactPhone: res.data.contactPhone || "",
          address: res.data.address || "",
        });
      })
      .catch(err => console.error(err));
  }, []);

  // Image Slider Auto Move
  useEffect(() => {
    if (sliderImages.length === 0) return;
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 4000);
    return () => clearInterval(slideInterval);
  }, [sliderImages]);

  // Circle Auto Rotate
  useEffect(() => {
    const rotateInterval = setInterval(() => {
      setRotation(prev => prev + 0.3); // Slow rotation
    }, 30);
    return () => clearInterval(rotateInterval);
  }, []);

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/complaints/submit", complaint);
      Swal.fire("Success", "Your complaint has been submitted successfully.", "success");
      setComplaint({ email: "", message: "" });
    } catch (err) {
      Swal.fire("Error", "Failed to submit complaint.", "error");
    }
  };

  const handleCategoryClick = (categoryName) => {
    navigate(`/buyer`, { state: { selectedCategory: categoryName } });
  };

  const getActiveCategory = () => {
    if (!categories.length) return null;
    let minDiff = Infinity;
    let activeCat = null;
    categories.forEach((cat, i) => {
      const angle =
  rotation +
  (360 / categories.length) * i -
  90;
      const normalized = ((angle % 360) + 360) % 360;
      const diff = Math.min(
  Math.abs(normalized - 270),
  360 - Math.abs(normalized - 270)
);
      if (diff < minDiff) {
        minDiff = diff;
        activeCat = cat;
      }
    });
    return activeCat;
  };
  const activeCategory = getActiveCategory();

  const renderContent = () => {
    switch (activeTab) {
      case "Complaints":
        return <AdminComplaints />;
      case "Banners":
        return <AdminBannerUpload />;
      default:
        return (
          <>
            {/* IMAGE SLIDER */}
            <div className="slider-container">
              <AnimatePresence mode="wait">
                {sliderImages.length > 0 && (
                  <motion.img
                    key={currentSlide}
                    src={sliderImages[currentSlide]}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="slider-image"
                    alt="Trending Fashion"
                  />
                )}
              </AnimatePresence>
              <div className="slider-controls">
                {sliderImages.map((_, idx) => (
                  <span 
                    key={idx} 
                    className={`dot ${currentSlide === idx ? "active" : ""}`}
                    onClick={() => setCurrentSlide(idx)}
                  />
                ))}
              </div>
              <div className="slider-overlay">
                <h1 className="hero-title">Discover the Trend</h1>
              </div>
            </div>

            {/* ATTRACTIVE SENTENCES */}
            <div className="about-section">
              <h2>Elevate Your Style with Us</h2>
              <p>
                Welcome to the ultimate fashion destination. Explore our exclusive collections tailored to bring out your inner confidence. 
                Experience premium quality, cutting-edge trends, and unmatched comfort. We bring the world's most sought-after styles right to your doorstep.
              </p>
            </div>

            {/* CIRCULAR CATEGORIES */}
            <div className="categories-section">
              <h2>Shop By Category</h2>
              <p className="drag-hint">Click a category to view!</p>
              <div className="circle-container">
                {activeCategory && (
                    <motion.div className="center-display-card" onClick={() => handleCategoryClick(activeCategory.name)} whileHover={{ scale: 1.05, x: "-50%", y: "-50%" }} initial={{ opacity: 0.5, scale: 0.8, x: "-50%", y: "-50%" }} animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }} transition={{ duration: 0.3 }}>
                      <div className="center-image-wrapper" style={{ position: "relative" }}>
                        <img
                          src={activeCategory.image || "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=200"}
                          alt={activeCategory.name}
                          style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                        />
                        <div className="center-overlay">
                          <h3>{activeCategory.name}</h3>
                          <button>Shop Now</button>
                        </div>
                      </div>
                    </motion.div>
                )}
                {categories.map((cat, i) => {
                  const angle = rotation + (360 / categories.length) * i;
                  const normalizedAngle = ((angle % 360) + 360) % 360;
                  const isCenter = normalizedAngle > 70 && normalizedAngle < 110;
                  const rad = (angle * Math.PI) / 180;
                  const radius = window.innerWidth > 768 ? 220 : 180;
                  const x = Math.cos(rad) * radius;
                  const y = Math.sin(rad) * radius;
                  return (
                    <motion.div
                      key={cat._id || i}
                      className={`category-card ${isCenter ? "active-ring-item" : ""}`}
                      style={{
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${isCenter ? 1.1 : 1})`,
                        zIndex: isCenter ? 10 : 1
                      }}
                      onClick={(e) => { e.stopPropagation(); handleCategoryClick(cat.name); }}
                    >
                      <div className="cat-image-wrapper">
                        <img src={cat.image || "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=200"} alt={cat.name} />
                      </div>
                      <h3>{cat.name}</h3>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* BRANDS SECTION */}
            <div className="brands-section">
              <h2>Top Brands Available Here</h2>
              <div className="brands-grid">
                {BRANDS.map((brand, i) => (
                  <div key={i} className="brand-card">
                    <img src={brand.logo} alt={brand.name} />
                  </div>
                ))}
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <div className="logo" onClick={() => setActiveTab("Store")}>LuxeCart</div>
        {user && user.role === "admin" && (
          <div className="admin-tabs">
            <button onClick={() => setActiveTab("Store")}>Store</button>
            <button onClick={() => setActiveTab("Complaints")}>Complaints</button>
            <button onClick={() => setActiveTab("Banners")}>Banners</button>
          </div>
        )}
        <div className="auth-links">
          {user ? (
            <span className="welcome-text">Welcome, {user.name}</span>
          ) : (
            <>
              <Link to="/login" className="btn-login">Login</Link>
              <Link to="/register" className="btn-register">Register</Link>
            </>
          )}
        </div>
      </div>

      {renderContent()}

      <footer className="footer-container">
        <div className="footer-content">
          <div className="footer-info">
            <h3>Contact Us</h3>
            {siteSettings.contactPhone && (
              <p><strong>Mobile:</strong> <a href={`tel:${siteSettings.contactPhone.replace(/\s/g, "")}`}>{siteSettings.contactPhone}</a></p>
            )}
            <p><strong>Email:</strong> <a href={`mailto:${siteSettings.supportEmail}`}>{siteSettings.supportEmail}</a></p>
            {siteSettings.address && (
              <p className="footer-address"><strong>Address:</strong> {siteSettings.address}</p>
            )}
          </div>
          <div className="footer-links">
            <h3>Categories</h3>
            {categories.length > 0 ? (
              <ul>
                {categories.map((cat) => (
                  <li key={cat._id || cat.name} onClick={() => handleCategoryClick(cat.name)}>
                    {cat.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="footer-empty">No categories available</p>
            )}
          </div>
          <div className="footer-complaints">
            <h3>Have a Complaint?</h3>
            <form onSubmit={handleComplaintSubmit} className="complaint-form">
              <input
  type="email"
  placeholder="Your Email"
  value={complaint.email}
  onChange={e => setComplaint({ ...complaint, email: e.target.value })}
  required
/>
<textarea
  placeholder="Write your complaint here..."
  value={complaint.message}
  onChange={e => setComplaint({ ...complaint, message: e.target.value })}
  required
/>
              <button type="submit">Submit Complaint</button>
            </form>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 {siteSettings.platformName}. All rights reserved.</p>
        </div>
      </footer>

      <ChatbotWidget />

    </div>
  );
}

export default Home;