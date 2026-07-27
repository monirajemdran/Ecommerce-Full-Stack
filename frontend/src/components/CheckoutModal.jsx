import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import { 
  FaShoppingCart, FaPlus, FaCreditCard, 
  FaTrash, FaMoneyBillWave, FaMobileAlt, 
  FaWallet 
} from "react-icons/fa";
import "./CheckoutModal.css";

function CheckoutModal({ 
  show, 
  setShow, 
  product, 
  currentUser,
  onSuccess
}) {
  const [qty, setQty] = useState(1);
  const [currentRemoved, setCurrentRemoved] = useState(false);
  const [pendingItems, setPendingItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  
  // Coupon State
  const [couponInput, setCouponInput] = useState("");
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [couponStatus, setCouponStatus] = useState(null); // null, 'valid', 'invalid'

  // UPI State
  const [upiId, setUpiId] = useState("");

  // Card State
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Razorpay Simulation State
  const [showRzpSimulation, setShowRzpSimulation] = useState(false);
  const [rzpOrderId, setRzpOrderId] = useState("");
  const [rzpAmount, setRzpAmount] = useState(0);
  const [rzpUpiInput, setRzpUpiInput] = useState("");
  const [rzpCardNo, setRzpCardNo] = useState("");
  const [rzpCardExp, setRzpCardExp] = useState("");
  const [rzpCardCvvVal, setRzpCardCvvVal] = useState("");
  const [rzpMethod, setRzpMethod] = useState("selection");

  const navigate = useNavigate();

  useEffect(() => {
    if (show && product) {
      const saved = JSON.parse(localStorage.getItem("pendingItems") || "[]");
      setPendingItems(saved);
      setCouponInput("");
      setIsCouponApplied(false);
      setCouponStatus(null);

      const initialQty = Number(localStorage.getItem("initialQty") || "1");
      setQty(initialQty);
      localStorage.removeItem("initialQty");

      // Check if current product is already in the "Added Items" list
      const isAlreadyAdded = saved.some(item => item.productId._id === product._id);
      if (isAlreadyAdded) {
        setCurrentRemoved(true);
      } else {
        setCurrentRemoved(false);
      }
    }
  }, [show, product]);


  if (!show) return null;

  const handleApplyCoupon = () => {
    if (!product || !product.isOffer) return;
    const correctCoupon = product.couponCode && couponInput && (product.couponCode.trim().toLowerCase() === couponInput.trim().toLowerCase());
    
    if (correctCoupon) {
      setIsCouponApplied(true);
      setCouponStatus("valid");
      Swal.fire({
        icon: "success",
        title: "Coupon Applied! 🎉",
        text: "Offer price has been activated.",
        timer: 1500,
        showConfirmButton: false
      });
    } else {
      setIsCouponApplied(false);
      setCouponStatus("invalid");
      Swal.fire({
        icon: "error",
        title: "Invalid Coupon Code ✗",
        text: "Using original price for this product.",
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  // ADD TO LIST & NAVIGATE
  const goToAddMore = () => {
    if (!currentRemoved && product && product.isOffer && couponStatus === null) {
      Swal.fire({
        icon: "warning",
        title: "Coupon Verification Required ✗",
        text: "Please enter and apply/verify the coupon code first! (If you don't have a code, click Apply to continue with the original price.)",
        confirmButtonColor: "#ec4899"
      });
      return;
    }
    if (!currentRemoved) {
      const newItem = {
        _id: Date.now().toString(),
        productId: product,
        quantity: qty,
        couponCode: isCouponApplied ? couponInput : ""
      };
      const updated = [...pendingItems, newItem];
      localStorage.setItem("pendingItems", JSON.stringify(updated));
      localStorage.setItem("lastCheckoutProduct", JSON.stringify(product));
    }
    setShow(false);
    navigate("/add-more");
  };

  const removePendingItem = (id) => {
    const updated = pendingItems.filter(item => item._id !== id);
    setPendingItems(updated);
    localStorage.setItem("pendingItems", JSON.stringify(updated));
  };

  const handleRazorpaySuccess = async (response, allItems) => {
    try {
      Swal.fire({
        title: 'Verifying Signature...',
        html: 'Securing transaction with Razorpay API.',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

      const verifyRes = await axios.post("https://shopverse-m5i8.onrender.com/api/orders/razorpay/verify", {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature
      });

      if (verifyRes.data && verifyRes.data.success) {
        const orderRes = await axios.post("https://shopverse-m5i8.onrender.com/api/orders/add", {
          buyerId: currentUser._id, buyerName: currentUser.name, buyerEmail: currentUser.email,
          buyerMobile: currentUser.mobile, buyerAddress: currentUser.address, items: allItems,
          paymentMethod: "Razorpay",
          paymentDetails: {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          }
        });

        const generatedOTP = orderRes.data.buyerOTP || "N/A";
        
        localStorage.removeItem("pendingItems");
        localStorage.removeItem("lastCheckoutProduct");
        setPendingItems([]);
        setQty(1);
        setShow(false);
        setShowRzpSimulation(false);
        if (onSuccess) onSuccess();
        setUpiId("");
        setCardNumber("");
        setCardHolder("");
        setCardExpiry("");
        setCardCvv("");

        Swal.fire({
          icon: "success",
          title: "Razorpay Payment Verified! 🎉",
          html: `<div style="text-align: center; font-family: sans-serif;">
                   <p style="font-size: 15px; font-weight: bold; color: #10b981;">Order Placed Successfully via Razorpay!</p>
                   <p style="font-size: 14px; margin-top: 10px;">Your Confirmation OTP is:</p>
                   <div style="font-size: 26px; font-weight: 800; letter-spacing: 4px; padding: 10px 20px; border: 2px dashed #10b981; border-radius: 8px; display: inline-block; color: #10b981; margin: 10px 0; background: #ecfdf5;">${generatedOTP}</div>
                   <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">Please show this OTP to the delivery partner during delivery.</p>
                 </div>`,
          confirmButtonColor: "#3b82f6",
          confirmButtonText: "View Purchase History"
        }).then(() => {
          navigate("/orders");
        });
      }
    } catch (verifyError) {
      Swal.fire("Verification Failed", "Razorpay payment verification rejected by server.", "error");
    }
  };

  const getCheckoutItemsPayload = () => {
    const allItems = [
      ...pendingItems.map(item => ({ 
        productId: item.productId._id, 
        quantity: item.quantity,
        couponCode: item.couponCode || ""
      })),
    ];
    if (!currentRemoved && product) {
      allItems.push({ 
        productId: product._id, 
        quantity: Number(qty),
        couponCode: isCouponApplied ? couponInput : ""
      });
    }
    return allItems;
  };

  const submitRzpUpi = () => {
    if (!rzpUpiInput || !rzpUpiInput.includes('@')) {
      Swal.fire({ icon: "warning", title: "Invalid UPI ID", text: "Please enter a valid UPI ID (e.g. name@upi)" });
      return;
    }
    const mockPayId = "pay_" + Math.random().toString(36).substring(2, 15);
    const mockSignature = "sig_" + Math.random().toString(36).substring(2, 15);
    const allItems = getCheckoutItemsPayload();
    handleRazorpaySuccess({
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: mockPayId,
      razorpay_signature: mockSignature
    }, allItems);
  };

  const submitRzpCard = () => {
    if (!rzpCardNo || rzpCardNo.length !== 16) {
      Swal.fire({ icon: "warning", title: "Invalid Card Number", text: "Card number must be exactly 16 digits." });
      return;
    }
    if (!rzpCardExp || !/^\d{2}\/\d{2}$/.test(rzpCardExp)) {
      Swal.fire({ icon: "warning", title: "Invalid Expiry", text: "Please enter in MM/YY format." });
      return;
    }
    if (!rzpCardCvvVal || rzpCardCvvVal.length !== 3) {
      Swal.fire({ icon: "warning", title: "Invalid CVV", text: "Please enter 3-digit security code." });
      return;
    }
    const mockPayId = "pay_" + Math.random().toString(36).substring(2, 15);
    const mockSignature = "sig_" + Math.random().toString(36).substring(2, 15);
    const allItems = getCheckoutItemsPayload();
    handleRazorpaySuccess({
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: mockPayId,
      razorpay_signature: mockSignature
    }, allItems);
  };

  const confirmBuy = async () => {
    if (!currentRemoved && product && product.isOffer && couponStatus === null) {
      Swal.fire({
        icon: "warning",
        title: "Coupon Verification Required ✗",
        text: "Please enter and apply/verify the coupon code first! (If you don't have a code, click Apply to continue with the original price.)",
        confirmButtonColor: "#ec4899"
      });
      return;
    }

    // Payment validation checks
    if (paymentMethod === "UPI / QR") {
      if (!upiId || !upiId.includes("@")) {
        Swal.fire({
          icon: "warning",
          title: "Invalid UPI ID ✗",
          text: "Please enter a valid UPI ID (e.g. customer@okaxis) to complete the payment.",
          confirmButtonColor: "#ec4899"
        });
        return;
      }
    }

    if (paymentMethod === "Card") {
      if (!cardHolder || cardHolder.trim().length < 3) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Cardholder Name ✗",
          text: "Please enter the cardholder's full name.",
          confirmButtonColor: "#ec4899"
        });
        return;
      }
      if (!cardNumber || cardNumber.length !== 16) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Card Number ✗",
          text: "Please enter a valid 16-digit debit/credit card number.",
          confirmButtonColor: "#ec4899"
        });
        return;
      }
      if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Expiry Date ✗",
          text: "Please enter expiration date in MM/YY format.",
          confirmButtonColor: "#ec4899"
        });
        return;
      }
      if (!cardCvv || cardCvv.length !== 3) {
        Swal.fire({
          icon: "warning",
          title: "Invalid CVV ✗",
          text: "Please enter the 3-digit card security code (CVV).",
          confirmButtonColor: "#ec4899"
        });
        return;
      }
    }

    const loadScript = (src) => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    try {
      const allItems = [
        ...pendingItems.map(item => ({ 
          productId: item.productId._id, 
          quantity: item.quantity,
          couponCode: item.couponCode || ""
        })),
      ];
      
      if (!currentRemoved) {
        allItems.push({ 
          productId: product._id, 
          quantity: Number(qty),
          couponCode: isCouponApplied ? couponInput : ""
        });
      }

      if (allItems.length === 0) {
         Swal.fire({ icon: "warning", title: "No items to order" });
         return;
      }

      // Razorpay Payment Method Flow
      if (paymentMethod === "Razorpay") {
        try {
          Swal.fire({
            title: 'Initializing Razorpay Order...',
            html: 'Setting up secure checkout session.',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
          });

          const totalAmount = pendingTotal + currentTotal;
          const createRes = await axios.post("https://shopverse-m5i8.onrender.com/api/orders/razorpay/create", {
            amount: totalAmount
          });

          if (!createRes.data || !createRes.data.success) {
            throw new Error("Unable to create Razorpay Order ID");
          }

          const { orderId, keyId } = createRes.data;

          const isScriptLoaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");

          const triggerMockPayment = () => {
            setRzpOrderId(orderId);
            setRzpAmount(totalAmount);
            setRzpMethod("selection");
            setShowRzpSimulation(true);
            Swal.close();
          };

          if (isScriptLoaded && keyId && !keyId.startsWith("rzp_test_mockKeyId")) {
            const options = {
              key: keyId,
              amount: Math.round(totalAmount * 100),
              currency: "INR",
              name: "My E-Commerce",
              description: "E-Commerce Secure Checkout",
              order_id: orderId,
              handler: (resp) => handleRazorpaySuccess(resp, allItems),
              prefill: {
                name: currentUser.name,
                email: currentUser.email,
                contact: currentUser.mobile
              },
              theme: {
                color: "#3b82f6"
              }
            };
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (resp) {
              Swal.fire("Payment Failed", resp.error.description || "The transaction has failed.", "error");
            });
            rzp.open();
          } else {
            triggerMockPayment();
          }

        } catch (err) {
          Swal.fire("Initialization Failed", err.message || "Failed to contact Razorpay API", "error");
        }
        return;
      }

      // Construct payment details
      const paymentDetails = {};
      if (paymentMethod === "UPI / QR") {
        paymentDetails.upiId = upiId;
      } else if (paymentMethod === "Card") {
        paymentDetails.cardholderName = cardHolder;
        paymentDetails.cardNumberMasked = `**** **** **** ${cardNumber.slice(-4)}`;
        paymentDetails.cardExpiry = cardExpiry;
      }

      // Show processing loader for prepaid payments to make it feel premium
      if (paymentMethod !== "Cash on Delivery") {
        Swal.fire({
          title: 'Processing Payment...',
          html: 'Connecting securely with your bank. Please do not close this window.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
      }

      const res = await axios.post("https://shopverse-m5i8.onrender.com/api/orders/add", {
        buyerId: currentUser._id, buyerName: currentUser.name, buyerEmail: currentUser.email,
        buyerMobile: currentUser.mobile, buyerAddress: currentUser.address, items: allItems,
        paymentMethod: paymentMethod,
        paymentDetails: paymentDetails
      });
      
      const generatedOTP = res.data.buyerOTP || "N/A";
      
      // Success
      localStorage.removeItem("pendingItems");
      localStorage.removeItem("lastCheckoutProduct");
      
      Swal.fire({
        title: 'Order Placed! 💖',
        html: `
          <div style="font-size:15px; line-height:1.6; text-align:center;">
            <p>Successfully paid via <strong>${paymentMethod}</strong>.</p>
            <div style="margin: 15px 0; padding: 12px; background: #fff1f2; border: 1px dashed #fda4af; border-radius: 8px; display: inline-block;">
              <span style="display:block; font-size:12px; color:#e11d48; font-weight:bold; margin-bottom:4px;">YOUR CONFIRMATION OTP</span>
              <span style="font-size: 24px; font-weight: 800; color: #be123c; letter-spacing: 2px;">${generatedOTP}</span>
            </div>
            <p style="font-size:12px; color:#475569; margin: 0;">Provide this OTP to the delivery partner when they arrive!</p>
          </div>
        `,
        icon: 'success',
        background: '#fff5fa',
        color: '#ff1493',
        confirmButtonColor: '#ff1493'
      });

      setShow(false);
      setCurrentRemoved(false);
      if (onSuccess) onSuccess();
    } catch (err) { 
      console.error(err); 
      const errorMsg = err.response?.data?.message || 'Something went wrong while placing your order.';
      Swal.fire({
        icon: 'error',
        title: 'Order Failed',
        text: errorMsg
      });
    }
  };

  // Price calculations based on coupon validity
  const getProductPrice = (prod, isApplied) => {
    if (prod.isOffer) {
      return isApplied ? (prod.discountPrice || 0) : (prod.originalPrice || 0);
    }
    return prod.originalPrice || 0;
  };

  const pendingTotal = pendingItems.reduce((sum, item) => {
    const itemPrice = (item.productId.isOffer && item.couponCode) ? (item.productId.discountPrice || 0) : (item.productId.originalPrice || 0);
    return sum + (itemPrice * item.quantity);
  }, 0);

  const currentPrice = product ? getProductPrice(product, isCouponApplied) : 0;
  const currentTotal = currentRemoved ? 0 : (currentPrice * qty);

  return (
    <div className="modal-overlay" style={{ display: "flex", gap: "25px", alignItems: "center", justifyContent: "center", flexWrap: "wrap", padding: "20px", boxSizing: "border-box" }}>
      <div className="modal-box">
        <h2 className="modal-title">Checkout <FaShoppingCart style={{marginLeft: '10px'}} /></h2>
        
        <div className="checkout-items-scroll">
          {pendingItems.length > 0 && (
            <div className="pending-space">
              <h4 className="space-label">Added Items</h4>
              {pendingItems.map((item) => {
                const itemPrice = (item.productId.isOffer && item.couponCode) ? (item.productId.discountPrice || 0) : (item.productId.originalPrice || 0);
                return (
                  <div key={item._id} className="checkout-item-row pending-item-row">
                     <img src={item.productId.image} alt="" className="mini-img" />
                     <div className="item-details">
                       <p>{item.productId.name}</p>
                       <p>Qty: {item.quantity} | ₹{itemPrice * item.quantity}</p>
                       {item.productId.isOffer && (
                         <span style={{ fontSize: "0.8rem", color: item.couponCode ? "#10b981" : "#ef4444", fontWeight: "bold" }}>
                           {item.couponCode ? "Offer Price Applied" : "Original Price"}
                         </span>
                       )}
                     </div>
                     <button className="remove-item-btn" onClick={() => removePendingItem(item._id)}>
                       <FaTrash />
                     </button>
                  </div>
                );
              })}
            </div>
          )}

          {!currentRemoved && (
            <>
              <div className="checkout-item-row current-item-row">
                <img src={product?.image} alt="" className="mini-img" />
                <div className="item-details">
                  <p><strong>{product?.name}</strong></p>
                  <div className="qty-picker">
                    <span>Qty: </span>
                    <input type="number" min="1" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
                  </div>
                  <p className="item-price-small">Price: ₹{currentPrice * qty}</p>
                  {product?.isOffer && (
                    <span style={{ fontSize: "0.85rem", color: isCouponApplied ? "#10b981" : "#ef4444", display: "block", marginTop: "2px", fontWeight: "bold" }}>
                      {isCouponApplied ? "Offer Price Applied" : "Original Price (Enter correct coupon code for offer price)"}
                    </span>
                  )}
                </div>
                <button className="remove-item-btn" onClick={() => setCurrentRemoved(true)}>
                  <FaTrash />
                </button>
              </div>

              {product?.isOffer && (
                <div className="coupon-code-section" style={{
                  padding: "15px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px dashed #cbd5e1",
                  marginTop: "10px",
                  marginBottom: "15px"
                }}>
                  <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px", fontSize: "0.95rem", color: "#475569" }}>
                    Have a Coupon Code for this Offer?
                  </label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input 
                      type="text" 
                      placeholder="Enter Coupon Code" 
                      value={couponInput} 
                      onChange={(e) => setCouponInput(e.target.value)} 
                      style={{
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        flexGrow: 1,
                        fontSize: "0.9rem"
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={handleApplyCoupon}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        backgroundColor: "#ec4899",
                        color: "white",
                        border: "none",
                        fontWeight: "bold",
                        cursor: "pointer",
                        fontSize: "0.9rem"
                      }}
                    >
                      Apply
                    </button>
                  </div>
                  {couponStatus && (
                    <p style={{
                      marginTop: "8px",
                      fontSize: "0.85rem",
                      fontWeight: "bold",
                      marginBottom: "0",
                      color: couponStatus === "valid" ? "#10b981" : "#ef4444"
                    }}>
                      {couponStatus === "valid" ? "✓ Coupon applied! Offer price activated." : "✗ Invalid coupon code. Original price applied."}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* PAYMENT METHOD SELECTION */}
        <div className="payment-method-section">
          <h4>Select Payment Method</h4>
          <div className="payment-options">
            <label className={`pay-option ${paymentMethod === 'Cash on Delivery' ? 'active' : ''}`}>
              <input 
                type="radio" 
                name="payment" 
                value="Cash on Delivery" 
                checked={paymentMethod === 'Cash on Delivery'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <FaMoneyBillWave /> Cash On Delivery
            </label>

            <label className={`pay-option ${paymentMethod === 'UPI / QR' ? 'active' : ''}`}>
              <input 
                type="radio" 
                name="payment" 
                value="UPI / QR" 
                checked={paymentMethod === 'UPI / QR'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <FaMobileAlt /> UPI / QR
            </label>

            <label className={`pay-option ${paymentMethod === 'Card' ? 'active' : ''}`}>
              <input 
                type="radio" 
                name="payment" 
                value="Card" 
                checked={paymentMethod === 'Card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <FaWallet /> Debit / Credit Card
            </label>

            <label className={`pay-option ${paymentMethod === 'Razorpay' ? 'active' : ''}`}>
              <input 
                type="radio" 
                name="payment" 
                value="Razorpay" 
                checked={paymentMethod === 'Razorpay'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <FaCreditCard /> Razorpay Gateway
            </label>
          </div>

          {/* Dynamic Payment Details Forms */}
          {paymentMethod === 'UPI / QR' && (
            <div className="payment-details-form upi-form" style={{
              background: "#fafafa",
              padding: "15px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              marginTop: "15px",
              textAlign: "center"
            }}>
              <p style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: "bold", color: "#374151" }}>Enter your UPI ID to complete payment in your app</p>

              <input 
                type="text" 
                placeholder="Enter UPI ID (e.g. name@upi)" 
                value={upiId} 
                onChange={(e) => setUpiId(e.target.value)} 
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  textAlign: "center",
                  boxSizing: "border-box"
                }}
              />
            </div>
          )}

          {paymentMethod === 'Card' && (
            <div className="payment-details-form card-form" style={{
              background: "#fafafa",
              padding: "15px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              marginTop: "15px",
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}>
              <p style={{ margin: "0 0 5px 0", fontSize: "13px", fontWeight: "bold", color: "#374151" }}>Enter Debit / Credit Card Details</p>
              
              <input 
                type="text" 
                placeholder="Cardholder Name" 
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  boxSizing: "border-box"
                }}
              />

              <input 
                type="text" 
                placeholder="Card Number (16 Digits)" 
                value={cardNumber}
                maxLength="16"
                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  boxSizing: "border-box"
                }}
              />

              <div style={{ display: "flex", gap: "10px" }}>
                <input 
                  type="text" 
                  placeholder="Expiry (MM/YY)" 
                  value={cardExpiry}
                  maxLength="5"
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.length > 2) {
                      val = val.substring(0, 2) + '/' + val.substring(2, 4);
                    }
                    setCardExpiry(val);
                  }}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    flex: 1,
                    boxSizing: "border-box",
                    textAlign: "center"
                  }}
                />
                <input 
                  type="password" 
                  placeholder="CVV" 
                  value={cardCvv}
                  maxLength="3"
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    flex: 1,
                    boxSizing: "border-box",
                    textAlign: "center"
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="checkout-summary">
           <h3>Grand Total: ₹{pendingTotal + currentTotal}</h3>
        </div>

        <div className="modal-actions">
          <button className="confirm-btn" onClick={confirmBuy}>Confirm Order <FaCreditCard style={{marginLeft: '5px'}} /></button>
          <button className="add-more-btn" onClick={goToAddMore}>Add More <FaPlus style={{marginLeft: '5px'}} /></button>
          <button className="cancel-btn" onClick={() => {
            localStorage.removeItem("pendingItems");
            localStorage.removeItem("lastCheckoutProduct");
            setShow(false);
            setCurrentRemoved(false);
            setShowRzpSimulation(false);
            setPendingItems([]);
            setUpiId("");
            setCardNumber("");
            setCardHolder("");
            setCardExpiry("");
            setCardCvv("");
          }}>Close</button>

        </div>
      </div>

      {showRzpSimulation && (
        <div className="rzp-sim-box" style={{
          width: "360px",
          background: "#ffffff",
          borderRadius: "20px",
          boxShadow: "0 15px 50px rgba(0,0,0,0.3)",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          fontFamily: "sans-serif",
          transition: "all 0.3s ease-out"
        }}>
          {/* Header */}
          <div style={{
            background: "#0b2545",
            padding: "20px",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <img src="https://razorpay.com/favicon.png" style={{ width: "24px", height: "24px" }} alt="Razorpay" />
              <span style={{ fontWeight: "800", fontSize: "16px", letterSpacing: "0.5px" }}>Razorpay Secure</span>
            </div>
            <span style={{
              background: "#1e3a8a",
              color: "#38bdf8",
              fontSize: "10px",
              fontWeight: "bold",
              padding: "4px 8px",
              borderRadius: "4px",
              textTransform: "uppercase"
            }}>TEST MODE</span>
          </div>

          {/* Amount info */}
          <div style={{
            background: "#f8fafc",
            padding: "15px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <p style={{ margin: "0", fontSize: "10px", color: "#64748b", fontWeight: "bold" }}>ORDER ID</p>
              <p style={{ margin: "0", fontSize: "12px", color: "#0f172a", fontWeight: "bold", wordBreak: "break-all" }}>{rzpOrderId}</p>
            </div>
            <div style={{ textAlign: "right", minWidth: "80px" }}>
              <p style={{ margin: "0", fontSize: "10px", color: "#64748b", fontWeight: "bold" }}>AMOUNT</p>
              <p style={{ margin: "0", fontSize: "16px", color: "#2563eb", fontWeight: "800" }}>₹{rzpAmount.toFixed(2)}</p>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "20px" }}>
            {rzpMethod === "selection" && (
              <div>
                <p style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: "bold", color: "#475569" }}>Select Payment Option</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button 
                    onClick={() => setRzpMethod("upi")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "14px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "10px",
                      background: "#ffffff",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "bold",
                      color: "#1e293b",
                      transition: "0.2s"
                    }}
                  >
                    <span>📱 Pay via UPI (Mock Transfer)</span>
                    <span style={{ color: "#059669", fontSize: "10px", background: "#ecfdf5", padding: "2px 6px", borderRadius: "4px" }}>INSTANT</span>
                  </button>

                  <button 
                    onClick={() => setRzpMethod("card")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "14px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "10px",
                      background: "#ffffff",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "bold",
                      color: "#1e293b",
                      transition: "0.2s"
                    }}
                  >
                    <span>💳 Pay via Debit/Credit Card (Mock)</span>
                    <span style={{ color: "#2563eb", fontSize: "10px", background: "#eff6ff", padding: "2px 6px", borderRadius: "4px" }}>SECURE</span>
                  </button>
                </div>
              </div>
            )}

            {rzpMethod === "upi" && (
              <div>
                <p style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: "bold", color: "#475569" }}>Enter UPI ID</p>
                <input 
                  type="text" 
                  placeholder="Enter UPI ID (e.g. name@paytm)" 
                  value={rzpUpiInput}
                  onChange={(e) => setRzpUpiInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                    marginBottom: "15px",
                    fontSize: "13px"
                  }}
                />
                <div style={{ display: "flex", gap: "10px" }}>
                  <button 
                    onClick={() => setRzpMethod("selection")}
                    style={{ flex: 1, padding: "12px", background: "#e2e8f0", color: "#475569", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}
                  >
                    Back
                  </button>
                  <button 
                    onClick={submitRzpUpi}
                    style={{ flex: 2, padding: "12px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}
                  >
                    Complete Payment
                  </button>
                </div>
              </div>
            )}

            {rzpMethod === "card" && (
              <div>
                <p style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: "bold", color: "#475569" }}>Enter Card Details</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "15px" }}>
                  <input 
                    type="text" 
                    placeholder="Card Number (16 Digits)" 
                    value={rzpCardNo}
                    maxLength="16"
                    onChange={(e) => setRzpCardNo(e.target.value.replace(/\D/g, ''))}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      boxSizing: "border-box",
                      fontSize: "13px"
                    }}
                  />
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input 
                      type="text" 
                      placeholder="MM/YY" 
                      value={rzpCardExp}
                      maxLength="5"
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length > 2) {
                          val = val.substring(0, 2) + '/' + val.substring(2, 4);
                        }
                        setRzpCardExp(val);
                      }}
                      style={{
                        width: "50%",
                        padding: "12px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        boxSizing: "border-box",
                        fontSize: "13px"
                      }}
                    />
                    <input 
                      type="password" 
                      placeholder="CVV" 
                      value={rzpCardCvvVal}
                      maxLength="3"
                      onChange={(e) => setRzpCardCvvVal(e.target.value.replace(/\D/g, ''))}
                      style={{
                        width: "50%",
                        padding: "12px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        boxSizing: "border-box",
                        fontSize: "13px"
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button 
                    onClick={() => setRzpMethod("selection")}
                    style={{ flex: 1, padding: "12px", background: "#e2e8f0", color: "#475569", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}
                  >
                    Back
                  </button>
                  <button 
                    onClick={submitRzpCard}
                    style={{ flex: 2, padding: "12px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            background: "#f8fafc",
            padding: "15px",
            textAlign: "center",
            fontSize: "11px",
            color: "#94a3b8",
            borderTop: "1px solid #e2e8f0",
            fontWeight: "500"
          }}>
            🔒 PCI-DSS Compliant • Secure 256-bit SSL
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckoutModal;
