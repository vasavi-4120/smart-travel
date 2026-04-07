const axios = require("axios");

const getDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;

  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const getNearbyPlaces = async (lat, lng, type) => {
  try {
    let query = "";

    if (type === "hospital") query = "hospital";
    else if (type === "police") query = "police station";

    const res = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: query,
          format: "json",
          limit: 10, // 🔥 increase results
          lat: lat,
          lon: lng,
          addressdetails: 1,
          bounded: 1,
          viewbox: `${lng - 0.1},${lat - 0.1},${lng + 0.1},${lat + 0.1}`,
        },
        headers: {
          "User-Agent": "tourist-safety-app",
        },
      }
    );

    // 🔥 ADD DISTANCE + SORT HERE
    const sorted = res.data
      .map((place) => {
        const placeLat = parseFloat(place.lat);
        const placeLon = parseFloat(place.lon);

        const distance = getDistance(lat, lng, placeLat, placeLon);

        return {
          ...place,
          distance,
        };
      })
      .sort((a, b) => a.distance - b.distance);

    return sorted;
  } catch (err) {
    console.error("OSM Error:", err.message);
    return [];
  }
};

module.exports = { getNearbyPlaces, getDistance };

// const axios = require("axios");

// const getNearbyPlaces = async (lng, lat, type) => {
//   try {
//     const bbox = [lng - 0.1, lat - 0.1, lng + 0.1, lat + 0.1].join(",");
//     const res = await axios.get(
//       `https://api.mapbox.com/geocoding/v5/mapbox.places/${type}.json`,
//       {
//         params: {
//           proximity: `${lng},${lat}`, // bias
//           // bbox: "68,6,97,37", // ✅ India bounding box
//           // bbox,
//           country: "in",
//           // types: "poi",
//           limit: 10,
//           access_token: process.env.MAPBOX_TOKEN,
//         },
//       },
//     );

//     return res.data.features;
//   } catch (error) {
//     console.error("Map Service Error:", error.message);
//     return [];
//   }
// };

// module.exports = { getNearbyPlaces };
