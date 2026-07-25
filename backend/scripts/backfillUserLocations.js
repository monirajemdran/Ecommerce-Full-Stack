require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");
const geocodeAddress = require("../utils/geocode");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const hasValidLocation = (user) =>
  Number.isFinite(user.location?.latitude) &&
  Number.isFinite(user.location?.longitude);

async function backfillUserLocations() {
  const forceAll = process.argv.includes("--all");

  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL is missing from .env");
  }

  await mongoose.connect(process.env.MONGO_URL);
  console.log("MongoDB Connected");

  const users = await User.find({ address: { $exists: true, $ne: "" } }).select(
    "name email address location"
  );

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users) {
    if (!forceAll && hasValidLocation(user)) {
      skipped += 1;
      continue;
    }

    const coords = await geocodeAddress(user.address);

    if (!coords) {
      failed += 1;
      console.log(`No coordinates found for ${user.email || user._id}: ${user.address}`);
      await delay(1000);
      continue;
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          location: {
            latitude: Number(coords.latitude),
            longitude: Number(coords.longitude),
          },
        },
      }
    );

    updated += 1;
    console.log(
      `Updated ${user.email || user._id}: ${coords.latitude}, ${coords.longitude}`
    );

    await delay(1000);
  }

  console.log(`Done. Updated: ${updated}, skipped: ${skipped}, failed: ${failed}`);
}

backfillUserLocations()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
