const Product = require("../models/Product");

exports.getProducts = async (req, res) => {
  const products = await Product.find();

  res.json(products);
};

exports.addProduct = async (req, res) => {

  const product = await Product.create(req.body);

  res.json(product);
};
// const addProduct = async () => {

//   await axios.post(
//     "http://localhost:5000/api/products/add",
//     {
//       ...form,
//       sellerId: user._id
//     }
//   );

//   Swal.fire({
//     title: "Success!",
//     text: "Product Added Successfully",
//     icon: "success"
//   });

//   fetchProducts();
// };