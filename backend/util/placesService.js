const axios = require("axios");

// 📍 Distance
const getDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// 🎯 TYPE → OSM TAGS
const typeQueries = {
  tourist: `
    node["tourism"="attraction"];
    way["tourism"="attraction"];
    relation["tourism"="attraction"];
  `,
  temple: `
    node["amenity"="place_of_worship"];
    way["amenity"="place_of_worship"];
  `,
  museum: `
    node["tourism"="museum"];
    way["tourism"="museum"];
  `,
  park: `
    node["leisure"="park"];
    way["leisure"="park"];
  `,
  restaurant: `
    node["amenity"="restaurant"];
    way["amenity"="restaurant"];
  `,
  hotel: `
    node["tourism"="hotel"];
    way["tourism"="hotel"];
  `,
};

// 🎯 TYPE → NOMINATIM SEARCH
const nominatimKeywords = {
  tourist: "tourist attraction",
  temple: "hindu temple",
  museum: "museum",
  park: "park",
  restaurant: "restaurant",
  hotel: "hotel",
};

// ===============================
// 🚀 MAIN FUNCTION
// ===============================
const getTouristPlaces = async (lat, lng, selectedType = "tourist") => {
  try {
    // ============================
    // 1️⃣ TRY OVERPASS
    // ============================
    const queryType = typeQueries[selectedType];

    // const query = `
    //   [out:json][timeout:10];
    //   (
    //     ${queryType}(around:3000,${lat},${lng});
    //   );
    //   out body;
    // `;
    const query = `
  [out:json][timeout:15];
  (
    ${queryType.replaceAll(";", `(around:3000,${lat},${lng});`)}
  );
  out body;
`;

    try {
      const res = await axios.post(
        "https://overpass-api.de/api/interpreter",
        query,
        { headers: { "Content-Type": "text/plain" }, timeout: 8000 },
      );

      const elements = res.data.elements;

      if (elements?.length) {
        return elements
          .map((p) => {
            if (!p.tags?.name) return null;

            return {
              name: p.tags.name,
              lat: p.lat,
              lng: p.lon,
              type: selectedType,
              distance: Number(getDistance(lat, lng, p.lat, p.lon).toFixed(2)),
              mapLink: `https://www.google.com/maps?q=${p.lat},${p.lon}`,
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 10);
      }
    } catch (err) {
      console.log("⚠ Overpass failed → switching to Nominatim");
    }

    // ============================
    // 2️⃣ NOMINATIM (FIXED)
    // ============================
    const keyword = nominatimKeywords[selectedType];

    const nominatimRes = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: keyword,
          format: "json",
          limit: 10,
          viewbox: `${lng - 0.05},${lat + 0.05},${lng + 0.05},${lat - 0.05}`,
          bounded: 1,
        },
        headers: {
          "User-Agent": "SmartTravelApp/1.0",
        },
      },
    );

    if (nominatimRes.data?.length) {
      return nominatimRes.data
        .map((p) => {
          const placeLat = parseFloat(p.lat);
          const placeLng = parseFloat(p.lon);

          return {
            // name: p.display_name,
            name: p.display_name.split(",")[0],
            lat: placeLat,
            lng: placeLng,
            type: selectedType,
            distance: Number(
              getDistance(lat, lng, placeLat, placeLng).toFixed(2),
            ),
            mapLink: `https://www.google.com/maps?q=${placeLat},${placeLng}`,
          };
        })
        .sort((a, b) => a.distance - b.distance);
    }

    console.log("Overpass elements:", elements?.length);
    console.log("Nominatim results:", nominatimRes.data?.length);

    // ============================
    // 3️⃣ FINAL FALLBACK
    // ============================
    return [
      {
        name: `Nearby ${selectedType}`,
        lat,
        lng,
        type: selectedType,
        distance: 0,
        mapLink: `https://www.google.com/maps?q=${lat},${lng}`,
      },
    ];
  } catch (err) {
    console.error("❌ FINAL ERROR:", err.message);

    return [
      {
        name: `Nearby ${selectedType}`,
        lat,
        lng,
        type: selectedType,
        distance: 0,
        mapLink: `https://www.google.com/maps?q=${lat},${lng}`,
      },
    ];
  }
};

module.exports = { getTouristPlaces };
