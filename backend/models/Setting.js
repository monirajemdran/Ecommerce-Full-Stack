const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  platformName: { type: String, default: "My E-Commerce" },
  supportEmail: { type: String, default: "support@ecommerce.com" },
  contactPhone: { type: String, default: "+1 234 567 8900" },
  address: { type: String, default: "123 Commerce Street, Business City, 10001" },
  maintenanceMode: { type: Boolean, default: false },
  sellerCommission: { type: Number, default: 10 }, // percentage
}, { timestamps: true });

module.exports = mongoose.model("Setting", settingSchema);
