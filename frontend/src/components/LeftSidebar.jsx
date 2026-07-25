import React from "react";
import { FaTimes, FaFilter } from "react-icons/fa";
import "./LeftSidebar.css";

function LeftSidebar({
  isOpen,
  onClose,
  selectedSize,
  setSelectedSize,
  selectedColor,
  setSelectedColor,
  maxPrice,
  setMaxPrice,
  categories = [],
  selectedCategory,
  setSelectedCategory
}) {
  if (!isOpen) return null;

  return (
    <div className="filter-sidebar-overlay">
      <div className="filter-sidebar-content">
        <div className="sidebar-header">
          <h2><FaFilter /> Filters</h2>
          <button className="close-sidebar" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="sidebar-body">
          {/* SIZE FILTER */}
          <div className="filter-group">
            <h4>Size</h4>
            <div className="size-grid">
              {["XS", "S", "M", "L", "XL", "XXL", ""].map((size) => (
                <button
                  key={size}
                  className={selectedSize === size ? "active-size" : ""}
                  onClick={() => setSelectedSize(size)}
                >
                  {size || "All"}
                </button>
              ))}
            </div>
          </div>

          {/* COLOR FILTER */}
          <div className="filter-group">
            <h4>Color</h4>
            <select
              className="sidebar-dropdown"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
            >
              <option value="">All Colors</option>
              {["Red", "Blue", "Black", "White", "Green", "Yellow", "Pink", "Purple", "Orange", "Brown", "Gray", "Silver", "Gold", "Maroon", "Navy Blue", "Sky Blue", "Royal Blue", "Olive", "Mint Green", "Lime", "Teal", "Turquoise", "Lavender", "Peach", "Cream", "Beige", "Mustard", "Magenta", "Coral", "Chocolate"].map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>

          {/* PRICE FILTER */}
          <div className="filter-group">
            <h4>Price Range (Up to ₹{maxPrice})</h4>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="sidebar-slider"
            />
            <div className="price-display">₹ {maxPrice}</div>
          </div>

          {/* CATEGORIES */}
          <div className="filter-group">
            <h4>Category</h4>
            <select className="sidebar-dropdown" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <button className="clear-all-btn" onClick={() => {
            setSelectedSize("");
            setSelectedColor("");
            setMaxPrice(5000);
            setSelectedCategory("");
          }}>
            Clear All Filters
          </button>
        </div>
      </div>
    </div>
  );
}

export default LeftSidebar;
