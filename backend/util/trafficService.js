// const axios = require("axios");

// const getTrafficData = async (start, end) => {
//   try {
//     const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&departure_time=now&traffic_model=best_guess&key=${process.env.GOOGLE_MAPS_API_KEY}`;

//     const res = await axios.get(url);

//     const route = res.data.routes?.[0];
//     if (!route) return null;

//     const leg = route.legs[0];

//     return {
//       distance: leg.distance.value, // meters
//       duration: leg.duration.value, // normal time
//       duration_in_traffic: leg.duration_in_traffic?.value || leg.duration.value,
//     };

//   } catch (err) {
//     console.error("❌ Google Traffic Error:", err.response?.data || err.message);
//     return null;
//   }
// };

// module.exports = { getTrafficData };

const axios = require("axios");

const getTrafficData = async (start, end) => {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${start.lng},${start.lat};${end.lng},${end.lat}?annotations=congestion,duration&overview=full&geometries=geojson&access_token=${process.env.MAPBOX_TOKEN}`;

    const response = await axios.get(url);

    const route = response.data.routes?.[0];
    if (!route) return null;

    const congestion = route.legs?.[0]?.annotation?.congestion || [];

    // ✅ DEBUG LOGS
    // console.log("🚗 Raw congestion:", congestion.slice(0, 20));

    return {
      congestion,
      distance: route.distance,
      duration: route.duration,
    };

  } catch (err) {
    console.error("❌ Traffic API Error:", err.response?.data || err.message);
    return null;
  }
};

module.exports = { getTrafficData };