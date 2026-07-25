import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { swalSuccessModal,swalSuccess } from "../utils/swal";
import "./Register.css";
import shopImage from "../assets/f1.jpg";
import styleImage from "../assets/s7.jpg";
import productImage from "../assets/s8.jpg";

function Register() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
  name: "",
  email: "",
  password: "",
  mobile: "",
  address: "",
  landmark: "",
  role: "buyer",
  profileImage: ""
});

  const submit = async () => {

  try {

    const data = new FormData();

    data.append("name", form.name);

    data.append("email", form.email);

    data.append("password", form.password);

    data.append("mobile", form.mobile);

    data.append("address", form.address);

    data.append("landmark", form.landmark);

    data.append("role", form.role);

    data.append(
      "profileImage",
      form.profileImage
    );

    await axios.post(
      "http://localhost:5000/api/users/register",
      data
    );
    await swalSuccessModal("Registration Successful", `Success`);
    navigate("/login");
    // swalSuccess("Registered Successfully");

  } catch(err) {

    console.log(err);
     if (err.response?.data?.message) {

      // alert(err.response.data.message);
       await swalSuccessModal(err.response.data.message, `failed`);

    } else {

      // alert(
      //   "User already registered. Try another email or go to Login."
      // );
      await swalSuccessModal("User already registered. Try another email or go to Login.", `failed`);

    }

  }

};

  return (

  <div>

    <Navbar />

    <div className="register-page">

      <div className="auth-shell register-shell">

      <div className="register-container">

        <h1>REGISTER</h1>

        <Link
          to="/"
          className="home-link"
        >
          🏠 Home
        </Link>

        <input
          placeholder="Enter Name"

          onChange={(e)=>

            setForm({
              ...form,
              name:e.target.value
            })
          }
        />

        <input
          placeholder="Enter Email"

          onChange={(e)=>

            setForm({
              ...form,
              email:e.target.value
            })
          }
        />

        <input
          type="password"

          placeholder="Enter Password"

          onChange={(e)=>

            setForm({
              ...form,
              password:e.target.value
            })
          }
        />

        <select

          onChange={(e)=>

            setForm({
              ...form,
              role:e.target.value
            })
          }
        >

          <option value="buyer">
            Buyer
          </option>

          <option value="seller">
            Seller
          </option>

        </select>
        <input
  type="text"
  placeholder="Mobile Number"
  value={form.mobile}
  onChange={(e) =>
    setForm({
      ...form,
      mobile: e.target.value
    })
  }
/>

<input
  type="text"
  placeholder="Home Address"
  value={form.address}
  onChange={(e) =>
    setForm({
      ...form,
      address: e.target.value
    })
  }
/>

<input
  type="text"
  placeholder="Landmark"
  value={form.landmark}
  onChange={(e) =>
    setForm({
      ...form,
      landmark: e.target.value
    })
  }
/>

<input
  type="file"
  onChange={(e) =>
    setForm({
      ...form,
      profileImage: e.target.files[0]
    })
  }
/>

        <button onClick={submit}>

          Register

        </button>

      </div>

      <div className="register-visual">
        <img src={shopImage} alt="Online shopping" className="register-main-img" />
        <div className="register-copy">
          <span>Start your shopping journey</span>
          <h2>Create your account in minutes.</h2>
          <p>Buyers can discover deals, and sellers can start listing products from the same place.</p>
        </div>
        <div className="register-mini-grid">
          {/* <img src={styleImage} alt="Style product" />
          <img src={productImage} alt="Featured product" /> */}
          
        </div>
      </div>

      </div>

    </div>

  </div>
);
}

export default Register;
