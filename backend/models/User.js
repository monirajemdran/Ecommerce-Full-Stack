const mongoose = require("mongoose");

const geocodeAddress = require("../utils/geocode");

const hasValidLocation = (location) =>
  Number.isFinite(location?.latitude) &&
  Number.isFinite(location?.longitude);

const userSchema =
  new mongoose.Schema({

    name: String,

    email: {
      type: String,
      unique: true,
      required: true
    },

    password: String,

    mobile: String,

    address: String,

    landmark: String,

    profileImage: String,
    
    location: {
      latitude: Number,
      longitude: Number,
    },

    role: {
      type: String,
      enum: ["buyer", "seller", "admin", "delivery"],
      default: "buyer"
    },
    
    sellerStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Approved"
    },

    vehicleNumber: String,
    earnings: { type: Number, default: 0 },
    available: { type: Boolean, default: true }

  });

// When a user's address is set or updated, attempt to geocode and store numeric coordinates.
userSchema.pre("save", async function () {
  if (this.isModified("address") && this.address && !hasValidLocation(this.location)) {
    const coords = await geocodeAddress(this.address);
    if (coords) {
      this.location = { latitude: Number(coords.latitude), longitude: Number(coords.longitude) };
    } else {
      // leave existing location as-is if geocoding failed
    }
  }
});

// For updates performed via findOneAndUpdate / findByIdAndUpdate, capture address changes
userSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();
  if (!update) return;

  const address = update.address || (update.$set && update.$set.address);
  const location = update.location || (update.$set && update.$set.location);

  if (address && !hasValidLocation(location)) {
    const coords = await geocodeAddress(address);
    if (coords) {
      // ensure the update will set numeric location
      if (!update.$set) update.$set = {};
      update.$set.location = { latitude: Number(coords.latitude), longitude: Number(coords.longitude) };
      this.setUpdate(update);
    }
  }
});

module.exports =
  mongoose.model("User", userSchema);
