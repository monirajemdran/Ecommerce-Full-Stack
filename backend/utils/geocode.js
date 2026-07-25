const axios = require("axios");

async function geocodeAddress(address) {
  try {
    if (!address) return null;

    const normalizedAddress = address
      .replace(/\n/g, " ")
      .replace(/[–—]/g, "-")
      .replace(/\s+-\s+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const simplifyAddress = (addr) => {
      let simplified = addr;
      simplified = simplified.replace(/^(office\s+(no\.?|number)\s*\d+|office|flat|apt|suite|unit)\b[\s,]*/i, "");
      simplified = simplified.replace(/\b(main\s+road|road|street|st|lane|ln|avenue|ave|highway|hwy)\b/gi, "");
      simplified = simplified.replace(/\s+/g, " ").trim();
      return simplified;
    };

    const addressCandidates = [normalizedAddress];
    const simplifiedAddress = simplifyAddress(normalizedAddress);
    if (simplifiedAddress && simplifiedAddress !== normalizedAddress) {
      addressCandidates.push(simplifiedAddress);
    }

    const parts = normalizedAddress.split(",").map((part) => part.trim()).filter(Boolean);
    if (parts.length > 3) {
      addressCandidates.push(parts.slice(1).join(", "));
      addressCandidates.push(parts.slice(-3).join(", "));
    }

    for (const candidate of addressCandidates) {
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            q: candidate,
            format: "json",
            limit: 1,
            countrycodes: "in",
          },
          headers: {
            "User-Agent": "ShoppingApp/1.0",
          },
        }
      );

      if (response.data.length > 0) {
        return {
          latitude: parseFloat(response.data[0].lat),
          longitude: parseFloat(response.data[0].lon),
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Geocoding Error:", error.message);
    return null;
  }
}

module.exports = geocodeAddress;
