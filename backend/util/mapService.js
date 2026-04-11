const axios = require("axios");

const getDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;

  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const getNearbyPlaces = async (lat, lng, type) => {
  try {
    let query = "";

    if (type === "hospital") query = "hospital";
    else if (type === "police") query = "police";

    const res = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: query,
        format: "json",
        limit: 20,
        addressdetails: 1,
        viewbox: `${lng - 0.1},${lat - 0.1},${lng + 0.1},${lat + 0.1}`,
        bounded: 1,
      },
      headers: {
        "User-Agent": "tourist-safety-app",
      },
    });

    // ✅ FILTER BY DISTANCE MANUALLY (STRICT)
    const nearby = res.data
      .map((place) => {
        const placeLat = parseFloat(place.lat);
        const placeLng = parseFloat(place.lon);

        const distance = getDistance(lat, lng, placeLat, placeLng);

        return { ...place, distance };
      })
      .filter((place) => place.distance <= 50) // 🔥 only within 50 km
      .sort((a, b) => a.distance - b.distance);

    return nearby;
  } catch (err) {
    console.error("OSM Error:", err.message);
    return [];
  }
};

module.exports = { getNearbyPlaces, getDistance };
