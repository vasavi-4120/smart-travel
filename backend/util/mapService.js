const axios = require("axios");

const getNearbyPlaces = async (lng, lat, type) => {
  try {
    const bbox = [lng - 0.1, lat - 0.1, lng + 0.1, lat + 0.1].join(",");
    const res = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${type}.json`,
      {
        params: {
          proximity: `${lng},${lat}`, // bias
          // bbox: "68,6,97,37", // ✅ India bounding box
          bbox,
          // country: "in",
          types: "poi",
          limit: 10,
          access_token: process.env.MAPBOX_TOKEN,
        },
      },
    );

    return res.data.features;
  } catch (error) {
    console.error("Map Service Error:", error.message);
    return [];
  }
};

module.exports = { getNearbyPlaces };
