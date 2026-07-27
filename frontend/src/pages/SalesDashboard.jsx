import { useEffect, useState } from "react";
import axios from "axios";
import "./SalesDashboard.css";
import Navbar from "../components/Navbar";
function SalesDashboard() {

  const user = JSON.parse(localStorage.getItem("user"));

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const prodRes = await axios.get("https://shopverse-m5i8.onrender.com/api/products");
      const sellerProducts = prodRes.data.filter(p => p.sellerId === user._id);
      setProducts(sellerProducts);

      const orderRes = await axios.get(`https://shopverse-m5i8.onrender.com/api/orders/seller/${user._id}`);
      setOrders(orderRes.data);
    } catch (err) {
      console.log(err);
    }
  };

  const calculateProductStats = (productId) => {
    let orderCount = 0;
    let earned = 0;

    orders.forEach(o => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach(item => {
          const itemProdId = item.productId?._id || item.productId;
          if (itemProdId === productId) {
            orderCount += item.quantity;
            earned += (item.price || 0) * item.quantity;
          }
        });
      }
    });

    return { orderCount, earned };
  };

  const grandTotal = products.reduce((sum, item) => {
    const { earned } = calculateProductStats(item._id);
    return sum + earned;
  }, 0);

  return (

    <div className="dashboard">
      <Navbar/>

      <h1>📊 Sales Dashboard</h1>

      {/* TABLE */}
      <div className="table-section">

        <table className="sales-table">

          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Orders</th>
              
              <th>Total Earned</th>
            </tr>
          </thead>

          <tbody>

            {products.map((item) => {
              const { orderCount, earned } = calculateProductStats(item._id);
              const balance = item.stock-orderCount;

              return (

                <tr key={item._id}>

                  {/* IMAGE */}
                  <td>
                    <img
                      src={item.image}
                      alt=""
                      className="table-img"
                    />
                  </td>

                  {/* NAME */}
                  <td>{item.name}</td>

                  {/* PRICE */}
                  <td>₹ {item.discountPrice}</td>

                  {/* STOCK */}
                  <td>{item.stock}</td>

                  {/* ORDERS */}
                  <td>{orderCount}</td>

                  

                  {/* EARNED */}
                  <td>₹ {earned}</td>

                </tr>

              );

            })}

          </tbody>


        </table>
        <div className="sales-mobile-list">
          {products.map((item) => {
            const { orderCount, earned } = calculateProductStats(item._id);

            return (
              <article key={item._id} className="sales-mobile-card">
                <div className="sales-mobile-product">
                  <img src={item.image} alt="" className="table-img" />
                  <div>
                    <span className="sales-mobile-label">Product</span>
                    <strong>{item.name}</strong>
                  </div>
                </div>
                <div className="sales-mobile-stats">
                  <div>
                    <span className="sales-mobile-label">Price</span>
                    <p>Rs. {item.discountPrice}</p>
                  </div>
                  <div>
                    <span className="sales-mobile-label">Stock</span>
                    <p>{item.stock}</p>
                  </div>
                  <div>
                    <span className="sales-mobile-label">Orders</span>
                    <p>{orderCount}</p>
                  </div>
                  <div>
                    <span className="sales-mobile-label">Total Earned</span>
                    <p className="sales-earned">Rs. {earned}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {/* GRAND TOTAL */}
<div className="grand-total">

  <h2>💰 Grand Total Earnings</h2>

  <h1>₹ {grandTotal}</h1>

</div>

      </div>

    </div>

  );
}

export default SalesDashboard;

