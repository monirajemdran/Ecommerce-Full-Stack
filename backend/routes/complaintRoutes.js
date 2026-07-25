const express = require("express");
const router = express.Router();
const Complaint = require("../models/Complaint");

// Submit a new complaint
router.post("/submit", async (req, res) => {
  try {
    const { email, message } = req.body;
    if (!email || !message) {
      return res.status(400).json({ error: "Email and message are required" });
    }
    const newComplaint = new Complaint({ email, message });
    await newComplaint.save();
    res.status(201).json({ message: "Complaint submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all complaints for admin
router.get("/all", async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.status(200).json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update complaint status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.status(200).json(complaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
