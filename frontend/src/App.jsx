import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BuyerHome from "./pages/BuyerHome";
import SellerDashboard from "./pages/SellerDashboard";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import SalesDashboard from "./pages/SalesDashboard";
import OrderHistory from "./pages/OrderHistory";
import OrderDetails from "./pages/OrderDetails";
import OrderReceived from "./pages/OrderReceived";
import SellerReturns from "./pages/SellerReturns";
import AddMore from "./pages/AddMore";
import AdminDashboard from "./pages/AdminDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import OffersPage from "./pages/OffersPage";
import TransactionHistory from "./pages/TransactionHistory";
import ProductDetails from "./pages/ProductDetails";
import BuyerChat from "./pages/BuyerChat";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/buyer" element={<BuyerHome />} />

        <Route path="/seller" element={<SellerDashboard />} />

        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />

        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/orders/:id" element={<OrderDetails />} />
         <Route path="/sales-dashboard" element={<SalesDashboard />} />
         <Route path="/orders-received" element={<OrderReceived />} />
         <Route path="/seller-returns" element={<SellerReturns />} />
         <Route path="/add-more" element={<AddMore />} />
         <Route path="/admin" element={<AdminDashboard />} />
         <Route path="/delivery" element={<DeliveryDashboard />} />
         <Route path="/offers" element={<OffersPage />} />
         <Route path="/transactions" element={<TransactionHistory />} />
         <Route path="/product/:id" element={<ProductDetails />} />
         <Route path="/chat" element={<BuyerChat />} />

      </Routes>


    </BrowserRouter>
  );
}

export default App;
