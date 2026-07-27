import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaRobot, FaTimes, FaPaperPlane, FaImage } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './ChatbotWidget.css';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [step, setStep] = useState("MENU");
  const [orderData, setOrderData] = useState({
    product: null,
    qty: 1,
    address: "",
    delivery: "",
    payment: ""
  });
  const [returnOrderId, setReturnOrderId] = useState("");
  const [returnItem, setReturnItem] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  
  const [searchResults, setSearchResults] = useState([]);
  const [searchIndex, setSearchIndex] = useState(0);
  
  const chatEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      showMenu();
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addBotMessage = (text, options = [], image = null, productsList = null) => {
    setMessages(prev => [...prev, { sender: 'bot', text, options, image, productsList }]);
  };

  const addUserMessage = (text, image = null) => {
    setMessages(prev => [...prev, { sender: 'user', text, image }]);
  };

  const showMenu = () => {
    setStep("MENU");
    setReturnOrderId("");
    setReturnItem(null);
    setReturnReason("");
    addBotMessage("Welcome to Shop Support 👋\nHow can I help you?", [
      "1. Search/Book Product",
      "2. Order Status",
      "3. Return Product",
      "4. Contact Admin"
    ]);
  };

  const fetchOrderById = async (orderId) => {
    try {
      const res = await axios.get(`https://shopverse-m5i8.onrender.com/api/orders/${orderId}`);
      return res.data;
    } catch {
      return null;
    }
  };

  const handleMenuSelection = (text) => {
    if (text.includes("Search") || text.includes("Book") || text === "1") {
      setStep("PRODUCT_INQUIRY");
      addBotMessage("Please enter the product name or upload an image to search.");
    } else if (text.includes("Order Status") || text === "2") {
      setStep("TRACK_ORDER");
      addBotMessage("Enter Order ID to track your order.");
    } else if (text.includes("Return") || text === "3") {
      setStep("RETURN_PROMPT");
      addBotMessage("Enter your Order ID to initiate a return for a specific item.");
    } else if (text.includes("Contact Admin") || text === "4") {
      setStep("ESCALATE");
      addBotMessage("Connect to Admin Support?", ["Yes", "No"]);
    } else {
      addBotMessage("Please select a valid option.");
      showMenu();
    }
  };



  const showProductCarousel = (results, index) => {
    const batch = results.slice(index, index + 3);
    const hasNext = index + 3 < results.length;
    
    setStep("PRODUCT_SELECTION");
    
    const options = hasNext ? ["Next Products", "Cancel Search"] : ["Cancel Search"];
    
    addBotMessage("Here are some products we found. Click a product to select it:", options, null, batch);
  };

  const handleProductSelection = (product) => {
    addUserMessage(`Selected: ${product.name}`);
    setOrderData(prev => ({ ...prev, product }));
    
    const priceText = product.isOffer && product.discountPrice
      ? `₹${product.discountPrice} (Original: ₹${product.originalPrice})`
      : `₹${product.originalPrice}`;

    if (product.stock <= 0) {
      setStep("PRODUCT_UNAVAILABLE");
      addBotMessage(
        `❌ ${product.name}\nPrice: ${priceText}\n\n⚠️ This product is currently not available.\n\nWould you like to see similar products?`,
        ["Show Similar Products", "Main Menu"],
        product.image ? (product.image.startsWith('http') ? product.image : `https://shopverse-m5i8.onrender.com/${product.image}`) : null
      );
    } else {
      setStep("PRODUCT_OPTIONS");
      addBotMessage(
        `${product.name}\nPrice: ${priceText}\nStock: Available ✅\nSeller: ${product.sellerName || 'ABC Mobiles'}`,
        ["1. Buy Now", "2. Add to Cart", "3. Main Menu"],
        product.image ? (product.image.startsWith('http') ? product.image : `https://shopverse-m5i8.onrender.com/${product.image}`) : null
      );
    }
  };

  const handleProductInquiry = async (text, file) => {
    try {
      let products = [];
      let isImageSearch = false;

      if (file) {
        isImageSearch = true;
        addBotMessage("Analyzing your image to find similar products...");
        const formData = new FormData();
        formData.append("image", file);
        try {
          const response = await axios.post(
            "https://shopverse-m5i8.onrender.com/api/images/search",
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          products = response.data.results || [];
        } catch (err) {
          console.error("Image search error:", err);
          addBotMessage("Image search failed. Trying text search instead...");
        }
      }

      if (!isImageSearch || products.length === 0) {
        let searchQuery = text || (file ? file.name : "");
        const res = await axios.get(`https://shopverse-m5i8.onrender.com/api/products?search=${searchQuery}`);
        products = res.data;
      }
      
      if (products && products.length > 0) {
        const availableProducts = products.filter(p => p.stock > 0);
        const unavailableProducts = products.filter(p => p.stock <= 0);
        
        if (availableProducts.length > 0) {
          setSearchResults(availableProducts);
          setSearchIndex(0);
          addBotMessage(`Found ${availableProducts.length} product(s) matching your request:`, []);
          showProductCarousel(availableProducts, 0);
        } else if (unavailableProducts.length > 0) {
          setSearchResults(unavailableProducts);
          setSearchIndex(0);
          addBotMessage(
            `The matched products are currently out of stock. Here are the matches (unavailable):`,
            ["Show Related Products", "Main Menu"],
            null,
            unavailableProducts.slice(0, 3)
          );
          setStep("SHOW_RELATED");
        }
      } else {
        addBotMessage(`No products found matching your request.`, ["Cancel Search"]);
        setStep("PRODUCT_SELECTION");
      }
    } catch (err) {
      addBotMessage("Error searching product. Please try again.", ["Main Menu"]);
    }
  };

  const processFlow = async (text, file = null) => {
    // If it's an option choice like "1. Buy Now", we can strip the number
    const normalizedText = text.replace(/^\d+\.\s*/, '').trim();

    if (normalizedText === "Main Menu") {
      showMenu();
      return;
    }

    switch (step) {
      case "MENU":
        handleMenuSelection(normalizedText);
        break;
      
      case "PRODUCT_INQUIRY":
        handleProductInquiry(text, file);
        break;

      case "PRODUCT_SELECTION":
        if (normalizedText === "Next Products") {
          const nextIdx = searchIndex + 3;
          setSearchIndex(nextIdx);
          showProductCarousel(searchResults, nextIdx);
        } else if (normalizedText === "Cancel Search" || normalizedText === "Main Menu") {
          showMenu();
        } else {
          addBotMessage("Please click on a product above or choose an option.");
        }
        break;

      case "PRODUCT_UNAVAILABLE":
        if (normalizedText === "Show Similar Products") {
          try {
            const relatedRes = await axios.get(`https://shopverse-m5i8.onrender.com/api/products?category=dress&limit=6`);
            const relatedProducts = relatedRes.data?.filter(p => p.stock > 0) || [];
            
            if (relatedProducts.length > 0) {
              setSearchResults(relatedProducts);
              setSearchIndex(0);
              addBotMessage(`Here are similar dress products available:`, ["Cancel Search"], null, relatedProducts.slice(0, 3));
              setStep("PRODUCT_SELECTION");
            } else {
              addBotMessage("No similar products available. Try searching for something else.", ["Main Menu"]);
              setStep("MENU");
            }
          } catch (err) {
            addBotMessage("Error fetching similar products. Please try again.", ["Main Menu"]);
            setStep("MENU");
          }
        } else {
          showMenu();
        }
        break;

      case "SHOW_RELATED":
        if (normalizedText === "Show Related Products") {
          try {
            const relatedRes = await axios.get(`https://shopverse-m5i8.onrender.com/api/products?category=dress&limit=6`);
            const relatedProducts = relatedRes.data?.filter(p => p.stock > 0) || [];
            
            if (relatedProducts.length > 0) {
              setSearchResults(relatedProducts);
              setSearchIndex(0);
              addBotMessage(`Here are available dress products:`, ["Cancel Search"], null, relatedProducts.slice(0, 3));
              setStep("PRODUCT_SELECTION");
            } else {
              addBotMessage("No products available. Please try again later.", ["Main Menu"]);
              setStep("MENU");
            }
          } catch (err) {
            addBotMessage("Error fetching related products. Please try again.", ["Main Menu"]);
            setStep("MENU");
          }
        } else {
          showMenu();
        }
        break;

      case "PRODUCT_OPTIONS":
        if (normalizedText === "Buy Now" || normalizedText === "1") {
          if (orderData.product && orderData.product.stock <= 0) {
            addBotMessage("This product is out of stock and cannot be ordered.", ["Show Similar Products", "Main Menu"]);
            setStep("PRODUCT_UNAVAILABLE");
            break;
          }
          setStep("QTY");
          addBotMessage("How many quantities do you want?");
        } else if (normalizedText === "Add to Cart" || normalizedText === "2") {
          if (!user) {
            addBotMessage("Please login to add products to your cart.");
            return;
          }
          if (user.role === "seller") {
            addBotMessage("Sellers cannot add products to cart.");
            return;
          }
          try {
            await axios.post("https://shopverse-m5i8.onrender.com/api/cart/add", {
              userId: user._id,
              productId: orderData.product._id
            });
            addBotMessage("✅ Product added to cart! Check your cart page.", ["Main Menu"]);
          } catch (err) {
            addBotMessage("Error adding product to cart. Please try again.", ["Main Menu"]);
          }
        } else {
          showMenu();
        }
        break;

      case "QTY":
        const qty = parseInt(text);
        if (isNaN(qty) || qty <= 0) {
          addBotMessage("Please enter a valid quantity.");
        } else {
          const productPrice = orderData.product.isOffer && orderData.product.discountPrice
            ? orderData.product.discountPrice
            : orderData.product.originalPrice;
          const total = qty * productPrice;
          setOrderData(prev => ({ ...prev, qty }));
          setStep("ADDRESS");
          addBotMessage(`Product: ${orderData.product.name}\nQuantity: ${qty}\nTotal: ₹${total}\n\nProceed to checkout?`, ["Yes", "No"]);
        }
        break;

      case "ADDRESS":
        if (normalizedText.toLowerCase() === "yes") {
          setStep("DELIVERY");
          addBotMessage("Select Delivery Address", ["Home Address", "Add New Address"]);
        } else {
          addBotMessage("Order Cancelled.");
          showMenu();
        }
        break;

      case "DELIVERY":
        if (normalizedText === "Add New Address") {
          setStep("INPUT_ADDRESS");
          addBotMessage("Please type your full delivery address:");
        } else {
          const selectedAddr = normalizedText === "Home Address"
            ? (user?.address || "Home Address")
            : text;
          setOrderData(prev => ({ ...prev, address: selectedAddr }));
          setStep("DELIVERY_METHOD");
          addBotMessage("Choose Delivery Method", ["Standard Delivery (normal price)", "Express Delivery (20% of your producte cost added in your bill)"]);
        }
        break;

      case "INPUT_ADDRESS":
        setOrderData(prev => ({ ...prev, address: text }));
        setStep("DELIVERY_METHOD");
        addBotMessage("Choose Delivery Method", ["Standard Delivery", "Express Delivery"]);
        break;

      case "DELIVERY_METHOD": {
        const method = normalizedText.includes("Express") ? "Express Delivery" : "Standard Delivery";
        setOrderData(prev => ({ ...prev, deliveryMethod: method }));
        setStep("PAYMENT");
        addBotMessage("Choose Payment Method", ["UPI", "Cash on Delivery"]);
        break;
      }

      case "PAYMENT":
        {
          const paymentVal = normalizedText;
          if (paymentVal === "UPI") {
            setOrderData(prev => ({ ...prev, payment: "UPI" }));
            setStep("UPI_INPUT");
            addBotMessage("Please enter your UPI ID (e.g. name@paytm):");
          } else {
            const updatedOrderData = { ...orderData, payment: paymentVal };
            setOrderData(updatedOrderData);
            setStep("FINAL_CONFIRM");
            
            let unitPrice = updatedOrderData.product.isOffer && updatedOrderData.product.discountPrice
              ? updatedOrderData.product.discountPrice
              : updatedOrderData.product.originalPrice;
              
            if (updatedOrderData.deliveryMethod === "Express Delivery") {
              unitPrice = Math.round(unitPrice * 1.20 * 100) / 100;
            }
            const totalAmount = updatedOrderData.qty * unitPrice;
            
            const productImg = updatedOrderData.product.image
              ? (updatedOrderData.product.image.startsWith('http') ? updatedOrderData.product.image : `https://shopverse-m5i8.onrender.com/${updatedOrderData.product.image}`)
              : null;
            const summary = `Order Summary\n\nProduct: ${updatedOrderData.product.name}\nQuantity: ${updatedOrderData.qty}\nDelivery: ${updatedOrderData.deliveryMethod}\nAmount: ₹${totalAmount}\nAddress: ${updatedOrderData.address}\nPayment: ${paymentVal}\n\nConfirm Order?`;
            addBotMessage(summary, ["Confirm", "Cancel"], productImg);
          }
        }
        break;

      case "UPI_INPUT":
        {
          const upiId = text.trim();
          if (!upiId || !upiId.includes("@")) {
            addBotMessage("Invalid UPI ID. Please enter a valid UPI ID (e.g. name@paytm):");
            return;
          }
          setOrderData(prev => ({ ...prev, upiId }));
          
          addBotMessage("⏳ Processing UPI payment via Razorpay...");
          
          try {
            let productPrice = orderData.product.isOffer && orderData.product.discountPrice
              ? orderData.product.discountPrice
              : orderData.product.originalPrice;
            if (orderData.deliveryMethod === "Express Delivery") {
              productPrice = Math.round(productPrice * 1.20 * 100) / 100;
            }
            const totalAmount = orderData.qty * productPrice;
            
            const createRes = await axios.post("https://shopverse-m5i8.onrender.com/api/orders/razorpay/create", {
              amount: totalAmount
            });
            
            if (!createRes.data || !createRes.data.success) {
              throw new Error("Failed to create payment order");
            }
            
            const { orderId } = createRes.data;
            const mockPayId = "pay_" + Math.random().toString(36).substring(2, 15);
            const mockSignature = "sig_" + Math.random().toString(36).substring(2, 15);
            
            await axios.post("https://shopverse-m5i8.onrender.com/api/orders/razorpay/verify", {
              razorpay_order_id: orderId,
              razorpay_payment_id: mockPayId,
              razorpay_signature: mockSignature
            });
            
            if (!user) {
              addBotMessage("Please login to place an order.");
              return;
            }
            const orderPayload = {
              buyerId: user._id,
              buyerName: user.name,
              buyerEmail: user.email,
              buyerMobile: user.mobile,
              buyerAddress: orderData.address,
              paymentMethod: "UPI",
              deliveryMethod: orderData.deliveryMethod,
              items: [{
                productId: orderData.product._id,
                quantity: orderData.qty
              }],
              paymentDetails: {
                upiId: upiId,
                razorpayOrderId: orderId,
                razorpayPaymentId: mockPayId,
                razorpaySignature: mockSignature
              }
            };
            const res = await axios.post("https://shopverse-m5i8.onrender.com/api/orders/add", orderPayload);
            
            const productImg = orderData.product.image
              ? (orderData.product.image.startsWith('http') ? orderData.product.image : `https://shopverse-m5i8.onrender.com/${orderData.product.image}`)
              : null;
            addBotMessage(
              `✅ UPI Payment Successful!\n\n💰 ₹${totalAmount} paid via UPI (${upiId})\n\nOrder ID: ${res.data._id}\nOTP: ${res.data.buyerOTP || "N/A"}\nExpected Delivery: ${orderData.deliveryMethod === "Express Delivery" ? "Express (1-2 Days)" : "Standard (3-5 Days)"}`,
              ["Track Order", "Main Menu"],
              productImg
            );
            setStep("POST_ORDER");
            
          } catch (err) {
            addBotMessage("❌ UPI Payment failed. Please try again.", ["Main Menu"]);
            showMenu();
          }
        }
        break;

      case "FINAL_CONFIRM":
        if (normalizedText === "Confirm") {
          try {
            if (!user) {
               addBotMessage("Please login to place an order.");
               return;
            }
            const orderPayload = {
              buyerId: user._id,
              buyerName: user.name,
              buyerEmail: user.email,
              buyerMobile: user.mobile,
              buyerAddress: orderData.address,
              paymentMethod: orderData.payment,
              deliveryMethod: orderData.deliveryMethod,
              items: [{
                productId: orderData.product._id,
                quantity: orderData.qty
              }]
            };
            const res = await axios.post("https://shopverse-m5i8.onrender.com/api/orders/add", orderPayload);
            const productImg = orderData.product.image
              ? (orderData.product.image.startsWith('http') ? orderData.product.image : `https://shopverse-m5i8.onrender.com/${orderData.product.image}`)
              : null;
            addBotMessage(
              `✅ Order Placed Successfully\n\nOrder ID: ${res.data._id}\nOTP: ${res.data.buyerOTP || "N/A"}\nExpected Delivery: ${orderData.deliveryMethod === "Express Delivery" ? "Express (1-2 Days)" : "Standard (3-5 Days)"}`,
              ["Track Order", "Main Menu"],
              productImg
            );
            setStep("POST_ORDER");
          } catch(err) {
            addBotMessage("Error placing order. Try again.");
            showMenu();
          }
        } else {
          addBotMessage("Order Cancelled.");
          showMenu();
        }
        break;

      case "POST_ORDER":
         if (normalizedText === "Track Order") {
            setStep("TRACK_ORDER");
            addBotMessage("Enter Order ID to track your order.");
         } else {
            showMenu();
         }
         break;

      case "TRACK_ORDER":
        try {
          const res = await axios.get(`https://shopverse-m5i8.onrender.com/api/orders/${text.trim()}`);
          const order = res.data;

          const formatStep = (label, done, date) => {
            if (done) {
              return `✔ ${label}${date ? ` (${date})` : ""}`;
            }
            return `⏳ ${label}`;
          };

          const placedDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : null;
          const sellerAcceptedDate = order.sellerAcceptedAt ? new Date(order.sellerAcceptedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : null;
          const shippedDate = order.shippedAt ? new Date(order.shippedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : null;
          const deliveredDate = order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : null;

          const isAccepted = !!sellerAcceptedDate || order.status === "Order Dispatched" || order.status === "Shipped" || order.status === "Out for Delivery" || order.status === "Delivered";
          const isShipped = !!shippedDate || order.status === "Shipped" || order.status === "Out for Delivery" || order.status === "Delivered";
          const isDelivered = !!deliveredDate || order.status === "Delivered";

          addBotMessage(
            `Current Status for ${text}:\n\n${formatStep("Order Placed", true, placedDate)}\n${formatStep("Seller Accepted", isAccepted, sellerAcceptedDate)}\n${formatStep("Shipped", isShipped, shippedDate)}\n${formatStep("Delivered", isDelivered, deliveredDate)}`,
            ["Main Menu"]
          );
        } catch (err) {
          addBotMessage("Unable to fetch order status. Please ensure the Order ID is correct.", ["Main Menu"]);
        }
        setStep("MENU");
        break;

      case "RETURN_PROMPT": {
        const order = await fetchOrderById(text.trim());
        if (!order) {
          addBotMessage("Could not find that Order ID. Please check and try again.", ["Main Menu"]);
          setStep("MENU");
          break;
        }

        setReturnOrderId(order._id);

        const currentState = order.status || "Order Placed";
        const detailState = order.deliveryStatus && order.deliveryStatus !== currentState ? `${currentState} / ${order.deliveryStatus}` : currentState;

        if (order.status === "Delivered" || order.deliveryStatus === "Delivered") {
          // Show items in this order for item-level return
          const items = order.items || [];
          const returnableItems = items.filter(item => !item.isReturned);
          
          if (returnableItems.length === 0) {
            addBotMessage("All items in this order have already been returned.", ["Main Menu"]);
            setStep("MENU");
            break;
          }

          let itemList = "Select the item you want to return:\n\n";
          returnableItems.forEach((item, i) => {
            itemList += `${i + 1}. ${item.productName} (Qty: ${item.quantity}) - ₹${item.price}\n`;
          });

          // Store the returnable items temporarily in searchResults for access
          setSearchResults(returnableItems);
          setStep("RETURN_SELECT_ITEM");
          addBotMessage(itemList, returnableItems.map((item, i) => `${i + 1}. ${item.productName}`).concat(["Cancel"]));
        } else if (order.status === "Cancelled") {
          addBotMessage("This order is already cancelled and cannot be returned.", ["Main Menu"]);
          setStep("MENU");
        } else {
          addBotMessage(
            `This order is not delivered yet. Current state: ${detailState}.\n\nReturns are available only after delivery. If you want to stop this order now, select Cancel Order.`,
            ["Cancel Order", "Main Menu"]
          );
          setStep("RETURN_CANCEL_DECISION");
        }
        break;
      }

      case "RETURN_SELECT_ITEM": {
        if (normalizedText === "Cancel") {
          showMenu();
          break;
        }
        // Parse user selection (e.g. "1. T-Shirt" or just "1")
        const itemNum = parseInt(text) || parseInt(normalizedText);
        const returnableItems = searchResults;
        
        if (isNaN(itemNum) || itemNum < 1 || itemNum > returnableItems.length) {
          addBotMessage("Invalid selection. Please choose a valid item number.", returnableItems.map((item, i) => `${i + 1}. ${item.productName}`).concat(["Cancel"]));
          break;
        }

        const selectedItem = returnableItems[itemNum - 1];
        const productId = selectedItem.productId?._id || selectedItem.productId;
        setReturnItem({ ...selectedItem, productId });

        const imgUrl = selectedItem.productImage
          ? (selectedItem.productImage.startsWith('http') ? selectedItem.productImage : `https://shopverse-m5i8.onrender.com/${selectedItem.productImage}`)
          : null;

        setStep("RETURN_REASON");
        addBotMessage(
          `Returning: ${selectedItem.productName}\nQty: ${selectedItem.quantity}\n\nSelect the reason for return:`,
          [
            "Damaged Product",
            "Wrong Product Received",
            "Defective Product",
            "Missing Parts",
            "Size Issue",
            "Quality Not Good",
            "Other Reason"
          ],
          imgUrl
        );
        break;
      }

      case "RETURN_REASON":
        if (normalizedText === "Other Reason") {
          setStep("RETURN_OTHER_REASON");
          addBotMessage("Please type the reason for your return:");
          break;
        }
        setReturnReason(normalizedText);
        setStep("RETURN_DESCRIPTION");
        addBotMessage(`Reason: ${normalizedText}\n\nPlease describe the issue briefly (or type 'skip'):`);
        break;

      case "RETURN_OTHER_REASON":
        if (!text.trim()) {
          addBotMessage("Please type the reason for return.");
          break;
        }
        setReturnReason(text.trim());
        setStep("RETURN_DESCRIPTION");
        addBotMessage(`Reason: ${text.trim()}\n\nPlease describe the issue briefly (or type 'skip'):`);
        break;

      case "RETURN_DESCRIPTION":
      {
        const description = normalizedText.toLowerCase() === "skip" ? "" : text.trim();
        setStep("RETURN_IMAGE");
        addBotMessage(
          `Would you like to upload an image as proof? (Recommended for damaged/defective items)`,
          ["Skip Image", "Cancel Return"]
        );
        // Store description temporarily
        setOrderData(prev => ({ ...prev, returnDescription: description }));
        break;
      }

      case "RETURN_IMAGE":
        if (normalizedText === "Cancel Return") {
          showMenu();
          break;
        }
        if (normalizedText === "Skip Image" || file) {
          // Submit the return request
          if (!user?.token) {
            addBotMessage("Please login to submit a return request.", ["Main Menu"]);
            setStep("MENU");
            break;
          }

          addBotMessage("⏳ Submitting your return request...");

          try {
            const formData = new FormData();
            formData.append("orderId", returnOrderId);
            formData.append("productId", returnItem.productId);
            formData.append("reason", returnReason);
            formData.append("description", orderData.returnDescription || "");
            if (file) {
              formData.append("images", file);
            }

            await axios.post("https://shopverse-m5i8.onrender.com/api/returns/request", formData, {
              headers: { 
                "Content-Type": "multipart/form-data",
                "Authorization": `Bearer ${user.token}` 
              }
            });

            addBotMessage(
              `✅ Return request submitted successfully!\n\n📦 Product: ${returnItem.productName}\n📋 Reason: ${returnReason}\n\nThe seller will review your request within 24 hours.`,
              ["Main Menu"]
            );
            setStep("MENU");
          } catch (err) {
            const msg = err.response?.data?.message || "Could not submit return request. Please try again.";
            addBotMessage(`❌ ${msg}`, ["Main Menu"]);
            setStep("MENU");
          }
        } else {
          addBotMessage("Please use the image upload button (📷) to attach a photo, or click 'Skip Image'.", ["Skip Image", "Cancel Return"]);
        }
        break;

      case "RETURN_CANCEL_DECISION":
        if (normalizedText === "Cancel Order" || normalizedText === "Cancel") {
          try {
            await axios.put(`https://shopverse-m5i8.onrender.com/api/orders/${returnOrderId}/cancel`);
            addBotMessage("Order has been cancelled. It will now appear as Cancelled in your order history.", ["Main Menu"]);
          } catch (err) {
            addBotMessage(err.response?.data?.message || "Unable to cancel the order. Please try again.", ["Main Menu"]);
          }
        } else {
          addBotMessage("Okay, returning you to the main menu.", ["Main Menu"]);
        }
        setStep("MENU");
        break;

      case "ESCALATE":
        if (normalizedText.toLowerCase() === "yes") {
          addBotMessage("Admin joined the conversation. Redirecting you to chat support...");
          setTimeout(() => {
            navigate("/chat"); // Redirect to the actual BuyerChat page we built earlier
          }, 1500);
        } else {
          showMenu();
        }
        break;

      default:
        showMenu();
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const text = inputText;
    setInputText("");
    addUserMessage(text);
    processFlow(text);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create local URL for preview
      const imageUrl = URL.createObjectURL(file);
      addUserMessage("Uploaded Image: " + file.name, imageUrl);
      processFlow("", file);
    }
  };

  const handleOptionClick = (option) => {
    addUserMessage(option);
    processFlow(option);
  };

  return (
    <div className="chatbot-widget-container">
      {isOpen ? (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h4><FaRobot /> ShopBot</h4>
            <button
              type="button"
              className="chatbot-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat support"
              title="Close"
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.sender === 'bot' ? 'received' : 'sent'}`}>
                <div className="message-content">
                  {msg.image && <img src={msg.image} alt="upload" className="chat-image" />}
                  {msg.text && <p>{msg.text}</p>}
                </div>
                
                {msg.productsList && msg.productsList.length > 0 && (
                  <div className="bot-product-carousel">
                    {msg.productsList.map((prod, i) => (
                      <div key={i} className="bot-product-card" onClick={() => handleProductSelection(prod)}>
                        <img 
                          src={prod.image ? (prod.image.startsWith('http') ? prod.image : `https://shopverse-m5i8.onrender.com/${prod.image}`) : "https://via.placeholder.com/150"} 
                          alt={prod.name} 
                        />
                        <div className="bot-product-info">
                          <strong>{prod.name.substring(0, 20)}{prod.name.length > 20 ? '...' : ''}</strong>
                          <p>₹{prod.originalPrice}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {msg.options && msg.options.length > 0 && (
                  <div className="chat-options">
                    {msg.options.map((opt, i) => (
                      <button key={i} onClick={() => handleOptionClick(opt)} className="chat-option-btn">
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSend} className="chatbot-input">
            <label className="chat-upload-btn">
              <FaImage />
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
            <input 
              type="text" 
              placeholder="Type your message..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button type="submit" className="chat-send-btn"><FaPaperPlane /></button>
          </form>
        </div>
      ) : (
        <button className="chatbot-toggle-btn" onClick={() => setIsOpen(true)}>
          <FaRobot size={30} />
        </button>
      )}
    </div>
  );
};

export default ChatbotWidget;

