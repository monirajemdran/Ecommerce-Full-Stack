const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  email: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, default: "Pending" }, // Pending, Resolved
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Complaint", complaintSchema);
