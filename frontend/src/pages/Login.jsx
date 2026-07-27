import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { swalError, swalSuccessModal, swalSuccess } from "../utils/swal";
import BuyerHome from "./BuyerHome";
import Navbar from "../components/Navbar";
import "./Login.css";
import img1 from "../assets/hs1.jpg";
import img2 from "../assets/s4.jpg";
import img3 from "../assets/s5.png";
import img4 from "../assets/s6.avif";

function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    if (!email?.trim()) {
      await swalError('Please enter your email');
      return;
    }
    if (!password?.trim()) {
      await swalError('Please enter your password');
      return;
    }
    try {
      const res = await axios.post(
        "https://shopverse-m5i8.onrender.com/api/users/login",
        { email, password }
      );

      localStorage.setItem(
        "userToken",
        res.data.token
      );

      const loggedInUser = {
        ...res.data.user,
        token: res.data.token
      };

      localStorage.setItem(
        "user",
        JSON.stringify(loggedInUser)
      );

      // Check role and redirect
      if (res.data.user.role === "admin") {
        await swalSuccessModal("Redirecting to Dashboard", `Welcome Admin!`);
        navigate("/admin");
      } else if (res.data.user.role === "delivery") {
        await swalSuccessModal("Redirecting to Dashboard", `Welcome Delivery Partner!`);
        navigate("/delivery");
      } else if (res.data.user.role === "seller") {
        navigate("/seller");
      } else {
        await swalSuccessModal("Login Successful", `Success`);
        navigate("/buyer");
      }

      window.location.reload();
    } catch (err) {
      console.error("Login failed:", err);
      swalError(err.response?.data?.message || 'Please check your credentials!');
    }
  };

  return (

  <div>

    <Navbar />

    <div className="login-page">
      <div className="auth-shell login-shell">
        <div className="auth-visual">
          <img src={img1} alt="Featured fashion" className="auth-main-img" />
          {/* <div className="auth-floating-img auth-img-one">
            <img src={img2} alt="New collection" />
          </div>
          <div className="auth-floating-img auth-img-two">
            <img src={img4} alt="Shopping style" />
          </div>
          <div className="auth-floating-img auth-img-three">
            <img src={img3} alt="Premium pick" />
          </div> */}
          <div className="auth-visual-copy">
            <span>Fresh arrivals daily</span>
            <h2>Shop smarter, track faster.</h2>
            <p>Login to manage orders, wishlist picks, recommendations, and delivery updates.</p>
          </div>
        </div>

      <div className="login-container">

        <h1>LOGIN</h1>

        <input
          placeholder="Enter Email"
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          type="password"
          placeholder="Enter Password"
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button onClick={login}>

          Login

        </button>

        <p>

          No account?

          <Link to="/register">

            Register

          </Link>

        </p>

      </div>
      </div>

    </div>

  </div>
);
}

export default Login;

