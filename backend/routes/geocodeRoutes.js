const express = require("express");
const router = express.Router();
const geocodeAddress = require("../utils/geocode");

// GET /api/utils/geocode?address=...
router.get("/geocode", async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) return res.status(400).json({ message: "address query param required" });
    const coords = await geocodeAddress(address);
    if (!coords) return res.status(404).json({ message: "Could not geocode address" });
    // Ensure numeric values
    const out = { latitude: Number(coords.latitude), longitude: Number(coords.longitude) };
    res.json(out);
  } catch (err) {
    console.error("Geocode route error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
