const router = require("express").Router();

const User = require("../models/User");
const geocodeAddress = require("../utils/geocode");

const bcrypt = require("bcryptjs");

const multer = require("multer");

const path = require("path");

const jwt = require("jsonwebtoken");

const getLocationFromAddress = async (address) => {
  if (!address) return undefined;

  const coords = await geocodeAddress(address);
  console.log("Geocode user address:", address, coords);

  if (!coords) return undefined;

  return {
    latitude: Number(coords.latitude),
    longitude: Number(coords.longitude)
  };
};

// MULTER STORAGE

const storage = multer.diskStorage({

  destination: (req, file, cb) => {

    cb(null, "uploads/");

  },

  filename: (req, file, cb) => {

    cb(
      null,
      Date.now() + path.extname(file.originalname)
    );

  }

});

const upload = multer({
  storage
});


// ================= REGISTER =================

router.post(
  "/register",
  upload.single("profileImage"),

  async (req, res) => {

    try {

      const {
        name,
        email,
        password,
        role,
        mobile,
        address,
        landmark
      } = req.body;

      // CHECK USER

      const existingUser =
        await User.findOne({ email });

      if (existingUser) {

        return res.status(400).json({
          message: "User already exists"
        });

      }

      // HASH PASSWORD

      const hashedPassword =
        await bcrypt.hash(password, 10);

      const location = await getLocationFromAddress(address);

      const user = new User({

        name,
        email,
        password: hashedPassword,
        role,
        mobile,
        address,
        landmark,

        ...(location ? { location } : {}),

        profileImage:
          req.file
            ? "http://localhost:5000/uploads/" +
              req.file.filename
            : ""

      });

      await user.save();

      res.status(201).json({
        success: true,
        user
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        success: false,
        message: err.message
      });

    }

  }
);


// ================= LOGIN =================

router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    // FIND USER

    const user =
      await User.findOne({ email });

    if (!user) {

      return res.status(400).json({
        message: "User Not Found"
      });

    }

    // CHECK PASSWORD

    const validPassword =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!validPassword) {

      return res.status(400).json({
        message: "Wrong Password"
      });

    }

    // TOKEN

    const token = jwt.sign(

      {
        id: user._id,
        role: user.role
      },

      process.env.JWT_SECRET

    );

    res.json({
      success: true,
      token,
      user
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});


// ================= UPDATE PROFILE =================

router.put(
  "/update/:id",

  upload.single("profileImage"),

  async (req, res) => {

    try {

      const {
        name,
        email,
        mobile,
        address,
        landmark
      } = req.body;

      const updateData = {};

      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (mobile !== undefined) updateData.mobile = mobile;
      if (address !== undefined) updateData.address = address;
      if (landmark !== undefined) updateData.landmark = landmark;

      const location = await getLocationFromAddress(address);
      if (location) updateData.location = location;

      // IMAGE UPDATE

      if (req.file) {

        updateData.profileImage =
          "http://localhost:5000/uploads/" +
          req.file.filename;

      }

      // UPDATE USER

      const updatedUser =
        await User.findByIdAndUpdate(

          req.params.id,

          updateData,

          { new: true }

        );

      if (!updatedUser) {

        return res.status(404).json({
          message: "User not found"
        });

      }

      res.json({
        success: true,
        user: updatedUser
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        success: false,
        message: err.message
      });

    }

  }
);

module.exports = router;
