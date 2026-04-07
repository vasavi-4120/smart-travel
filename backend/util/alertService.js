const { getWeatherData } = require("./weatherService");
const { getTrafficData } = require("./trafficService");
const User = require("../model/UserModel");
const { sendEmail } = require("../util/sendEmail");

// const heavy = require("../public/heavy.png");
// const moderate = require("../public/moderate.png");
// const light = require("../public/light.png");
// const defaulttraffic = require("../public/defaulttraffic.png");

const checkAlerts = async (trip) => {
  try {
    const start = trip.liveLocation || trip.from;
    const end = trip.to;
    const backendBase = process.env.BASE_URL || "http://localhost:8000";

    if (!start?.lat || !start?.lng || !end?.lat || !end?.lng) {
      console.log("❌ Missing coordinates");
      return;
    }

    const [weatherData, trafficData] = await Promise.all([
      getWeatherData(start.lat, start.lng),
      getTrafficData(start, end),
    ]);

    // const user = await User.findById(trip.userId);
    const user = trip.traveler?.email;
    if (!user) return;

    let alerts = [];

    // ======================
    // 🌦 WEATHER ALERT (FIXED)
    // ======================
    
    if (weatherData) {
      const weatherCondition =
        weatherData.weather?.[0]?.description || "Unknown";

      const temperature = weatherData.main?.temp
        ? weatherData.main.temp.toFixed(1)
        : "N/A";
      const feelsLike = weatherData.main?.feels_like
        ? weatherData.main.feels_like.toFixed(1)
        : "N/A";
      const humidity = weatherData.main?.humidity || "N/A";
      const windSpeed = weatherData.wind?.speed || "N/A";

      // Map OpenWeather description to custom SVG icons
      const weatherIconsMap = {
        "clear sky": "https://openweathermap.org/img/wn/01d@2x.png",
        "few clouds": "https://openweathermap.org/img/wn/02d@2x.png",
        "scattered clouds": "https://openweathermap.org/img/wn/03d@2x.png",
        "broken clouds": "https://openweathermap.org/img/wn/04d@2x.png",
        "shower rain": "https://openweathermap.org/img/wn/09d@2x.png",
        rain: "https://openweathermap.org/img/wn/10d@2x.png",
        thunderstorm: "https://openweathermap.org/img/wn/11d@2x.png",
        snow: "https://openweathermap.org/img/wn/13d@2x.png",
        mist: "https://openweathermap.org/img/wn/50d@2x.png",
      };

      const iconUrl =
        weatherIconsMap[weatherCondition.toLowerCase()] ||
        "https://openweathermap.org/img/wn/01d@2x.png"; // fallback

      if (trip.lastWeatherCondition !== weatherCondition) {
        alerts.push(`
      <div style="background:#eef6ff; padding:20px; border-radius:12px; margin-bottom:10px; display:flex; align-items:center;">
        <!-- Icon -->
        <div style="flex-shrink:0; margin-right:15px;">
          <img src="${iconUrl}" alt="${weatherCondition}" style="width:80px; height:80px;" />
        </div>

        <!-- Weather Info -->
        <div style="flex-grow:1; font-family:Segoe UI, Arial;">
          <h3 style="margin:0; color:#3498db;">🌦 Weather Update</h3>
          <p style="margin:5px 0;"><strong>Condition:</strong> ${weatherCondition}</p>
          <p style="margin:5px 0;"><strong>Temperature:</strong> ${temperature}°C</p>
          <p style="margin:5px 0;"><strong>Feels Like:</strong> ${feelsLike}°C</p>
          <p style="margin:5px 0;"><strong>Humidity:</strong> ${humidity}%</p>
          <p style="margin:5px 0;"><strong>Wind:</strong> ${windSpeed} m/s</p>
        </div>
      </div>
    `);

        trip.lastWeatherCondition = weatherCondition;
      }
    }

    // ======================
    // 🚗 TRAFFIC ALERT (SMART LOGIC)
    // ======================

     if (trafficData) {
  const congestionArray = trafficData.congestion || [];
  const valid = congestionArray.filter((c) => c !== "unknown");

  let trafficStatus = "No Traffic Data ⚪";
  let trafficColor = "#95a5a6";

  if (valid.length > 0) {
    const heavyCount = valid.filter((c) => c === "heavy").length;
    const moderateCount = valid.filter((c) => c === "moderate").length;

    const total = valid.length;

    const heavyRatio = heavyCount / total;
    const moderateRatio = moderateCount / total;

    if (heavyRatio > 0.3) {
      trafficStatus = "Heavy Traffic 🚨";
    } else if (moderateRatio > 0.3) {
      trafficStatus = "Moderate Traffic ⚠️";
    } else {
      trafficStatus = "Light Traffic 🟢";
    }
  }

  // ✅ SET COLOR
  if (trafficStatus.includes("Heavy")) {
    trafficColor = "#e74c3c";
  } else if (trafficStatus.includes("Moderate")) {
    trafficColor = "#f39c12";
  } else if (trafficStatus.includes("Light")) {
    trafficColor = "#27ae60";
  }

  // ✅ ICON MAP
  const trafficIcons = {
    heavy: "https://res.cloudinary.com/daw1ro6q2/image/upload/v1775469110/Heavy_traffic_icon_vakvzb.png",
    moderate: "https://res.cloudinary.com/daw1ro6q2/image/upload/v1775469097/Moderate_traffic_icon_xiyigl.png",
    light: "https://res.cloudinary.com/daw1ro6q2/image/upload/v1775469074/Light_traffic_icon_njmqo5.png",
  };

// console.log("Serving images from:", backendBase);

  // ✅ FIX KEY
  let trafficKey = "light";
  if (trafficStatus.includes("Heavy")) trafficKey = "heavy";
  else if (trafficStatus.includes("Moderate")) trafficKey = "moderate";

  const iconUrl = trafficIcons[trafficKey] || "https://res.cloudinary.com/daw1ro6q2/image/upload/v1775469122/defaulttraffic_ixzuxz.png";

  // ✅ ALERT
  if (trip.lastTrafficAlert !== trafficStatus) {
    alerts.push(`
      <div style="background:#fff8e6; padding:20px; border-radius:12px; margin-bottom:10px; display:flex; align-items:center;">
        
        <div style="flex-shrink:0; margin-right:15px;">
          <img src="${iconUrl}" style="width:80px;height:80px;" />
        </div>

        <div style="flex-grow:1; font-family:Segoe UI, Arial;">
          <h3 style="margin:0; color:${trafficColor};">🚗 Traffic Update</h3>
          <p><strong>Status:</strong> ${trafficStatus}</p>
          <p><strong>Distance:</strong> ${(trafficData.distance / 1000).toFixed(1)} km</p>
          <p><strong>Time:</strong> ${(trafficData.duration / 60).toFixed(1)} mins</p>
        </div>

      </div>
    `);

    trip.lastTrafficAlert = trafficStatus;
  }
}

    // ======================
    // 📧 SEND EMAIL (ONLY IF NEEDED)
    // ======================
    if (alerts.length > 0) {
      await sendEmail(
        // user.email,
        user,
        "🚨 Smart Travel Alert Update",
        `
        <div style="font-family:Segoe UI,Arial; background:#f4f6f9; padding:20px;">
          <div style="max-width:600px; margin:auto; background:#fff; border-radius:12px;">
            
            <div style="background:#4facfe; color:white; padding:20px; text-align:center;">
              <h2>🚨 Live Travel Alert</h2>
            </div>

            <div style="padding:20px;">
              <p><strong>📍 Route:</strong> ${trip.from.name} → ${trip.to.name}</p>
              <p>${new Date().toLocaleString()}</p>
            </div>

            <div style="padding:20px;">
              ${alerts.join("<br/>")}
            </div>

            <div style="padding:20px;">
              <h3>💡 Tips</h3>
              <ul>
                <li>Check alternate routes 🚦</li>
                <li>Drive safely 🚗</li>
              </ul>
            </div>

          </div>
        </div>
        `,
      );

      await trip.save();
      console.log("✅ Alert email sent!");
    }
  } catch (err) {
    console.error("❌ Alert Service Error:", err.message);
  }
};

module.exports = { checkAlerts };
