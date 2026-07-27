import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { 
  FaHome, FaShoppingCart, FaHeart, FaBox, 
  FaUserEdit, FaSignOutAlt, FaEnvelope, 
  FaPhone, FaMapMarkerAlt, FaChartLine, FaStore, FaSearch, FaFilter, FaCreditCard, FaComments
  , FaBars
} from "react-icons/fa";


import "./Navbar.css";
import { swalSuccess, swalError, swalSuccessModal } from "../utils/swal";

function Navbar({ searchQuery, onSearch, toggleFilters }) {

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [showProfile, setShowProfile] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
    address: user?.address || "",
    landmark: user?.landmark || "",
    profileImage: null
  });

  const handleUpdate = async () => {
    try {
      const formData = new FormData();
      formData.append("name", editForm.name);
      formData.append("email", editForm.email);
      formData.append("mobile", editForm.mobile);
      formData.append("address", editForm.address);
      formData.append("landmark", editForm.landmark);
      if (editForm.profileImage) {
        formData.append("profileImage", editForm.profileImage);
      }

      const res = await axios.put(`https://shopverse-m5i8.onrender.com/api/users/update/${user._id}`, formData);
      if (res.data.success) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        swalSuccess("Profile Updated! ✨");
        setShowEdit(false);
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      swalError("Update failed.");
    }
  };

  const logout = async () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userToken");
    await swalSuccessModal("Logged Out Successfully");
    navigate("/");
  };

  return (
    <nav className="navbar">
      {toggleFilters && (
        <button
          type="button"
          className="nav-menu-btn"
          onClick={toggleFilters}
          aria-label="Open filters menu"
          title="Filters"
        >
          <FaBars />
        </button>
      )}
      {/* LOGO & SEARCH */}
      <div className="logo-search-container">
        <h1 className="fashion-logo">
          <span className="fashion-logo-main">
            <FaStore className="fashion-logo-icon" aria-hidden />
            <span>FASHION STORE</span>
          </span>
          <span className="fashion-logo-tagline">Explore Plus ✦</span>
        </h1>
        {onSearch && (
          <div className="nav-search-container">
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
            />
            <FaSearch className="nav-search-icon" />
            {toggleFilters && (
              <button className="nav-filter-btn" onClick={toggleFilters} title="Filters" type="button">
                <FaFilter />Filter
              </button>
            )}
            
          </div>

        )}
      </div>

      {/* NAV LINKS */}
      <div className="nav-links">
        {user?.role === "seller" && <Link to="/seller"><FaUserEdit /> Seller Panel</Link>}
       
       
      </div>
      <div> <Link to="/" className="register-btn">🏠Home</Link></div>
      {/* PROFILE (Far Right) */}
      <div className="profile-container">
        {user ? (
          <>
            <div className="profile-circle" onClick={() => setShowProfile(!showProfile)}>
              {user.profileImage ? (
                <img src={user.profileImage.startsWith('http') ? user.profileImage : `https://shopverse-m5i8.onrender.com/${user.profileImage}`} alt="avatar" className="nav-avatar" />
              ) : (
                user.name?.charAt(0).toUpperCase()
              )}
            </div>
            <span className="profile-name" onClick={() => setShowProfile(!showProfile)}>{user.name}</span>


            {showProfile && (
              <div className="profile-dropdown">
                <img src={user.profileImage ? (user.profileImage.startsWith('http') ? user.profileImage : `https://shopverse-m5i8.onrender.com/${user.profileImage}`) : "https://i.imgur.com/6VBx3io.png"} alt="profile" className="profile-pic" />
                <h3>{user.name}</h3>
                <p><FaEnvelope className="nav-icon" /> {user.email}</p>
                <p><FaPhone className="nav-icon" /> {user.mobile}</p>
                <p><FaHome className="nav-icon" /> {user.address}</p>
                {user.role === "buyer" && <p><FaMapMarkerAlt className="nav-icon" /> {user.landmark}</p>}
                <hr />
                {user.role === "buyer" ? (
                  <>
                    <button className="profile-btn"><Link to="/orders"><FaBox className="btn-icon" /> My Orders</Link></button>
                    <button className="profile-btn"><Link to="/transactions"><FaCreditCard className="btn-icon" /> Transactions</Link></button>
                    <button className="profile-btn"><Link to="/wishlist"><FaHeart className="btn-icon" /> Wishlist</Link></button>
                    <button className="profile-btn"><Link to="/cart"><FaShoppingCart className="btn-icon" /> Cart</Link></button>
                    <button className="profile-btn"><Link to="/offers"><FaHeart className="btn-icon" /> Offers</Link></button>
                    <button className="profile-btn"><Link to="/chat"><FaComments className="btn-icon" /> Chat Support</Link></button>
                  </>
                ) : user.role === "seller" ? (
                  <>
                    <button className="profile-btn"><Link to="/sales-dashboard"><FaChartLine className="btn-icon" /> Sales Dashboard</Link></button>
                    <button className="profile-btn"><Link to="/orders-received"><FaBox className="btn-icon" /> Orders Received</Link></button>
                    <button className="profile-btn"><Link to="/seller-returns"><FaBox className="btn-icon" /> Returns</Link></button>
                  </>
                ) : user.role === "admin" ? (
                  <>
                    <button className="profile-btn"><Link to="/admin"><FaBox className="btn-icon" /> Admin Dashboard</Link></button>
                    
                  </>
                ) : (
                  <>
                    <button className="profile-btn"><Link to="/delivery"><FaChartLine className="btn-icon" /> Delivery Dashboard</Link></button>
                    
                  </>
                )}
                {/* {user.role === "buyer" ? (
                  <>
                    <button className="profile-btn"><Link to="/orders"><FaBox className="btn-icon" /> My Orders</Link></button>
                    <button className="profile-btn"><Link to="/transactions"><FaCreditCard className="btn-icon" /> Transactions</Link></button>
                    <button className="profile-btn"><Link to="/wishlist"><FaHeart className="btn-icon" /> Wishlist</Link></button>
                    <button className="profile-btn"><Link to="/cart"><FaShoppingCart className="btn-icon" /> Cart</Link></button>
                    <button className="profile-btn"><Link to="/offers"><FaHeart className="btn-icon" /> Offers</Link></button>
                  </>
                ) : (
                  <>
                    <button className="profile-btn"><Link to="/sales-dashboard"><FaChartLine className="btn-icon" /> Sales Dashboard</Link></button>
                    <button className="profile-btn"><Link to="/orders-received"><FaBox className="btn-icon" /> Orders Received</Link></button>
                  </>
                )} */}
                

                <button className="profile-btn" onClick={() => setShowEdit(true)}><FaUserEdit className="btn-icon" /> Edit Profile</button>
                <button className="logout-btn" onClick={logout}><FaSignOutAlt className="btn-icon" /> Logout</button>
              </div>
            )}
          </>
        ) : (
          <div className="auth-buttons">
            
            <Link to="/login" className="login-btn">Login</Link>
            <Link to="/register" className="register-btn">Register</Link>
          </div>
        )}
      </div>


      {/* EDIT PROFILE MODAL */}
      {showEdit && (
        <div className="edit-modal-overlay">
          <div className="edit-modal-box">
            <h2>Edit Profile <FaUserEdit /></h2>
            <label>Name</label>
            <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
            <label>Email</label>
            <input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
            <label>Mobile</label>
            <input type="text" value={editForm.mobile} onChange={(e) => setEditForm({...editForm, mobile: e.target.value})} />
            <label>Address</label>
            <input type="text" value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} />
            <label>Landmark</label>
            <input type="text" value={editForm.landmark} onChange={(e) => setEditForm({...editForm, landmark: e.target.value})} />
            <label>Profile Picture</label>
            <input type="file" onChange={(e) => setEditForm({...editForm, profileImage: e.target.files[0]})} />
            <div className="edit-modal-btns">
              <button className="save-btn" onClick={handleUpdate}>Save Changes</button>
              <button className="close-btn" onClick={() => setShowEdit(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
  

