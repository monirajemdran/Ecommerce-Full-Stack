import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./SellerDashboard.css";
import Navbar from "../components/Navbar";

function SellerDashboard() {

  const user =
    JSON.parse(localStorage.getItem("user"));

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [editingId, setEditingId] =
    useState(null);

  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    image: "",
    color: "",
    size: "",
    category: "",
    originalPrice: "",
    discountPrice: "",
    stock: "",
    offerEndTime: "",
    isOffer: false
  });

  // FETCH PRODUCTS

  const fetchProducts = async () => {

    const res = await axios.get(
      "http://localhost:5000/api/products"
    );

    setProducts(
      res.data.filter(
        (item) =>
          item.sellerId?.toString() ===
          user._id
      )
    );
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/products/categories");
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {

    fetchProducts();
    fetchCategories();

  }, []);

  // RESET FORM

  const resetForm = () => {

    setForm({
      name: "",
      image: "",
      color: "",
      size: "",
      category: "",
      originalPrice: "",
      discountPrice: "",
      stock: "",
      offerEndTime: "",
      isOffer: false
    });
  };

  // ADD PRODUCT

  const addProduct = async () => {

    if (!form.name || !form.image || !form.originalPrice) {
      return Swal.fire("Error", "Please provide product name, image, and price.", "error");
    }

    try {

      const data = new FormData();

      data.append("name", form.name);
      if (form.image instanceof File) {
        data.append("image", form.image);
      }
      data.append("color", form.color);
      data.append("size", form.size);
      data.append("category", form.category);
      data.append(
        "originalPrice",
        form.originalPrice
      );
      data.append(
        "discountPrice",
        form.discountPrice
      );
      data.append("stock", form.stock);
      data.append(
        "offerEndTime",
        form.offerEndTime
      );
      data.append("isOffer", form.isOffer);
      data.append(
  "sellerId",
  user._id
);

   data.append(
  "sellerName",
  user.name
);
      await axios.post(
        "http://localhost:5000/api/products/add",
        data
      );

      Swal.fire(
        "Pending Approval",
        "Product has been submitted for admin approval.",
        "success"
      );

      resetForm();

      fetchProducts();

    } catch (err) {

      console.log(err);

    }
  };

  // UPDATE PRODUCT

  const updateProduct = async () => {

    try {

      const data = new FormData();

      data.append("name", form.name);
      data.append("color", form.color);
      data.append("size", form.size);
      data.append("category", form.category);
      data.append(
        "originalPrice",
        form.originalPrice
      );
      data.append(
        "discountPrice",
        form.discountPrice
      );
      data.append("stock", form.stock);
      data.append(
        "offerEndTime",
        form.offerEndTime
      );
      data.append("isOffer", form.isOffer);
      data.append(
  "sellerId",
  user._id
);

data.append(
  "sellerName",
  user.name
);

      if (form.image instanceof File) {

        data.append("image", form.image);

      }

      await axios.put(
        `http://localhost:5000/api/products/${editingId}`,
        data
      );

      Swal.fire(
        "Updated",
        "Product Updated Successfully",
        "success"
      );

      setEditingId(null);

      resetForm();

      fetchProducts();

    } catch (err) {

      console.log(err);

    }
  };

  // DELETE PRODUCT

  const deleteProduct = async (id) => {

    await axios.delete(
      `http://localhost:5000/api/products/${id}`
    );

    fetchProducts();
  };

  return (

    <div className="seller-page">

      <Navbar />

      <h1 className="title">
        Seller Dashboard
      </h1>

      {/* FORM */}

      <div className="form-box">

        {/* PRODUCT NAME */}

        <input
          placeholder="Product Name"
          value={form.name}
          onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value
            })
          }
        />

        {/* PRODUCT TYPE SELECT */}
        <select
          value={form.isOffer ? "offer" : "regular"}
          onChange={(e) =>
            setForm({
              ...form,
              isOffer: e.target.value === "offer"
            })
          }
        >
          <option value="regular">Regular Product (No Offer)</option>
          <option value="offer">Offer Product (Discounted)</option>
        </select>

        {form.isOffer ? (
          <>
            {/* ORIGINAL PRICE */}
            <input
              placeholder="Original Price"
              value={form.originalPrice}
              onChange={(e) =>
                setForm({
                  ...form,
                  originalPrice: e.target.value
                })
              }
            />

            {/* DISCOUNT PRICE */}
            <input
              placeholder="Offer/Discount Price"
              value={form.discountPrice}
              onChange={(e) =>
                setForm({
                  ...form,
                  discountPrice: e.target.value
                })
              }
            />

            {/* OFFER END */}
            <input
              type="datetime-local"
              value={form.offerEndTime}
              onChange={(e) =>
                setForm({
                  ...form,
                  offerEndTime: e.target.value
                })
              }
            />
          </>
        ) : (
          <>
            {/* SINGLE PRICE */}
            <input
              placeholder="Price"
              value={form.originalPrice}
              onChange={(e) =>
                setForm({
                  ...form,
                  originalPrice: e.target.value,
                  discountPrice: ""
                })
              }
            />
          </>
        )}

        {/* STOCK */}

        <input
          placeholder="Stock"
          value={form.stock}
          onChange={(e) =>
            setForm({
              ...form,
              stock: e.target.value
            })
          }
        />

        {/* IMAGE */}

        <input
          type="file"
          onChange={(e) =>
            setForm({
              ...form,
              image: e.target.files[0]
            })
          }
        />

        {/* IMAGE PREVIEW */}

        {form.image && (

          <img
            className="preview-img"
            src={
              form.image instanceof File
                ? URL.createObjectURL(
                    form.image
                  )
                : form.image
            }
            alt="preview"
          />

        )}

        {/* COLOR DROPDOWN */}

        <select
          value={form.color}
          onChange={(e) =>
            setForm({
              ...form,
              color: e.target.value
            })
          }
        >

          <option value="">
            Select Color
          </option>

          <option value="Red">Red</option>
          <option value="Blue">Blue</option>
          <option value="Black">Black</option>
          <option value="White">White</option>
          <option value="Green">Green</option>
          <option value="Yellow">Yellow</option>
          <option value="Pink">Pink</option>
          <option value="Purple">Purple</option>
          <option value="Orange">Orange</option>
          <option value="Brown">Brown</option>
          <option value="Gray">Gray</option>
          <option value="Silver">Silver</option>
          <option value="Gold">Gold</option>
          <option value="Maroon">Maroon</option>
          <option value="Navy Blue">
            Navy Blue
          </option>
          <option value="Sky Blue">
            Sky Blue
          </option>
          <option value="Royal Blue">
            Royal Blue
          </option>
          <option value="Olive">Olive</option>
          <option value="Mint Green">
            Mint Green
          </option>
          <option value="Lime">Lime</option>
          <option value="Teal">Teal</option>
          <option value="Turquoise">
            Turquoise
          </option>
          <option value="Lavender">
            Lavender
          </option>
          <option value="Peach">Peach</option>
          <option value="Cream">Cream</option>
          <option value="Beige">Beige</option>
          <option value="Mustard">
            Mustard
          </option>
          <option value="Magenta">
            Magenta
          </option>
          <option value="Coral">Coral</option>
          <option value="Chocolate">
            Chocolate
          </option>

        </select>

        {/* SIZE DROPDOWN */}

        <select
          value={form.size}
          onChange={(e) =>
            setForm({
              ...form,
              size: e.target.value
            })
          }
        >

          <option value="">
            Select Size
          </option>

          <option value="XS">XS</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
          <option value="XXL">XXL</option>

        </select>

        {/* CATEGORY */}

        <select
          value={form.category}
          onChange={(e) =>
            setForm({
              ...form,
              category: e.target.value
            })
          }
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* BUTTONS */}

        {!editingId ? (

          <button
            className="main-btn"
            onClick={addProduct}
          >
            Add Product
          </button>

        ) : (

          <button
            className="main-btn"
            onClick={updateProduct}
          >
            Update Product
          </button>

        )}

      </div>

      {/* SEARCH */}

      <div className="top-controls">

        <input
          className="search-box"
          placeholder="Search Product"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

      </div>

      {/* PRODUCTS */}

      <div className="products-grid">

        {products
          .filter((item) =>
            (item?.name || "")
              .toLowerCase()
              .includes(
                search.toLowerCase()
              )
          )
          .map((item) => (

            <div
              className="product-card"
              key={item._id}
            >

              <img
                src={item.image}
                alt=""
              />

              <h2>{item.name}</h2>

              <h3>
                ₹ {item.discountPrice}
              </h3>

              <p
                style={{
                  textDecoration:
                    "line-through"
                }}
              >
                ₹ {item.originalPrice}
              </p>

              <p>
                Color : {item.color}
              </p>

              <p>
                Size : {item.size}
              </p>

              <p>
                Stock : {item.stock}
              </p>

              <p>
                Category : {item.category}
              </p>

              <div className="btn-box">

                <button
                  className="edit-btn"
                  onClick={() => {

                    setEditingId(
                      item._id
                    );

                    setForm({
                      name: item.name,
                      image: item.image,
                      color: item.color,
                      size: item.size,
                      category:
                        item.category,
                      originalPrice:
                        item.originalPrice,
                      discountPrice:
                        item.discountPrice,
                      stock: item.stock,
                      offerEndTime:
                        item.offerEndTime,
                      isOffer: item.isOffer || false
                    });

                  }}
                >
                  Edit
                </button>

                <button
                  className="delete-btn"
                  onClick={() =>
                    deleteProduct(item._id)
                  }
                >
                  Delete
                </button>

              </div>

            </div>

          ))}

            </div>

      {/* EDIT MODAL */}

      {
        editingId && (

          <div className="modal-overlay">

            <div className="modal-box">

              <h2>Edit Product</h2>

              <input
                placeholder="Product Name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name:e.target.value
                  })
                }
              />

              {/* PRODUCT TYPE SELECT */}
              <select
                value={form.isOffer ? "offer" : "regular"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    isOffer: e.target.value === "offer"
                  })
                }
              >
                <option value="regular">Regular Product (No Offer)</option>
                <option value="offer">Offer Product (Discounted)</option>
              </select>

              {form.isOffer ? (
                <>
                  {/* ORIGINAL PRICE */}
                  <input
                    placeholder="Original Price"
                    value={form.originalPrice}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        originalPrice: e.target.value
                      })
                    }
                  />

                  {/* DISCOUNT PRICE */}
                  <input
                    placeholder="Offer/Discount Price"
                    value={form.discountPrice}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        discountPrice: e.target.value
                      })
                    }
                  />

                  {/* OFFER END */}
                  <input
                    type="datetime-local"
                    value={form.offerEndTime}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        offerEndTime: e.target.value
                      })
                    }
                  />
                </>
              ) : (
                <>
                  {/* SINGLE PRICE */}
                  <input
                    placeholder="Price"
                    value={form.originalPrice}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        originalPrice: e.target.value,
                        discountPrice: ""
                      })
                    }
                  />
                </>
              )}

              <input
                placeholder="Stock"
                value={form.stock}
                onChange={(e) =>
                  setForm({
                    ...form,
                    stock: e.target.value
                  })
                }
              />

              {/* IMAGE */}

              <input
                type="file"
                onChange={(e) =>
                  setForm({
                    ...form,
                    image:e.target.files[0]
                  })
                }
              />

              {/* IMAGE PREVIEW */}

              {form.image && (

                <img
                  className="preview-img"
                  src={
                    form.image instanceof File
                      ? URL.createObjectURL(
                          form.image
                        )
                      : form.image
                  }
                  alt=""
                />

              )}

              {/* COLOR */}

              <select
                value={form.color}
                onChange={(e) =>
                  setForm({
                    ...form,
                    color:e.target.value
                  })
                }
              >

                <option value="">
                  Select Color
                </option>

                <option value="Red">Red</option>
                <option value="Blue">Blue</option>
                <option value="Black">Black</option>
                <option value="White">White</option>
                <option value="Green">Green</option>

              </select>

              {/* SIZE */}

              <select
                value={form.size}
                onChange={(e) =>
                  setForm({
                    ...form,
                    size:e.target.value
                  })
                }
              >

                <option value="">
                  Select Size
                </option>

                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>

              </select>

              {/* CATEGORY */}

              <select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category:e.target.value
                  })
                }
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {/* BUTTONS */}

              <div className="modal-btns">

  <button
    className="update-btn"
    onClick={updateProduct}
  >
    Update Product
  </button>

  <button
    className="cancel-btn"
    onClick={() => {

      setEditingId(null);

      resetForm();

    }}
  >
    Cancel
  </button>

</div>

            </div>

          </div>

        )
      }

    </div>
  );
}

export default SellerDashboard;