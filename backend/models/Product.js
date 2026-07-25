const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({

  name: {
    type: String
  },

  // sellerId: { type: String },

sellerName:{type:String},

  

  originalPrice: {
    type: Number
  },

  discountPrice: {
    type: Number
  },
  offerPercentage:{
  type:Number,
  default:0
},

  stock: {
    type: Number,
    default: 0
  },

  image: {
    type: String
  },

  color: {
    type: String
  },

  size: {
    type: String
  },

  category: {
    type: String
  },

  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  offerEndTime:{
    type:String
  },
  approved: {
    type: Boolean,
    default: false
  },
  isOffer: {
    type: Boolean,
    default: false
  },
  couponCode: {
    type: String,
    default: ""
  }
});

module.exports = mongoose.model(
  "Product",
  ProductSchema
);