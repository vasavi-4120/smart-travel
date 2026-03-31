const { getWeatherData } = require("./weatherService");
const { getTrafficData } = require("./trafficService");
const User = require("../model/UserModel");
const sendEmail = require("../util/sendEmail");

// const checkAlerts = async (trip) => {
//   try {
//     const start = trip.liveLocation || trip.from;
//     const end = trip.to;

//     // ✅ SAFETY CHECK
//     if (!start?.lat || !start?.lng || !end?.lat || !end?.lng) {
//       console.log("❌ Missing or invalid coordinates");
//       return;
//     }

//     // ✅ FETCH DATA IN PARALLEL
//     const [weatherData, trafficData] = await Promise.all([
//       getWeatherData(start.lat, start.lng),
//       getTrafficData(start, end),
//     ]);

//     const user = await User.findById(trip.userId);
//     if (!user) return;

//     let alerts = [];

//     // ======================
//     // 🌦 WEATHER ALERT
//     // ======================
//     if (weatherData) {
//       const weatherCondition =
//         weatherData.weather?.[0]?.description || "Unknown";
//       const temperature = weatherData.main?.temp || "N/A";
//       const feelsLike = weatherData.main?.feels_like || "N/A";
//       const humidity = weatherData.main?.humidity || "N/A";
//       const windSpeed = weatherData.wind?.speed || "N/A";
//       const icon = weatherData.weather?.[0]?.icon;

//       const iconUrl = icon
//         ? `http://openweathermap.org/img/wn/${icon}@2x.png`
//         : "";

//       if (trip.lastWeatherCondition !== weatherCondition) {
//         alerts.push(`
//           <div style="background:#eef6ff; padding:15px; border-radius:10px;">
//             <h3>🌦 Weather Update</h3>
//             <p><img src="${iconUrl}" /></p>
//             <p><strong>Condition:</strong> ${weatherCondition}</p>
//             <p><strong>Temperature:</strong> ${temperature}°C</p>
//             <p><strong>Feels Like:</strong> ${feelsLike}°C</p>
//             <p><strong>Humidity:</strong> ${humidity}%</p>
//             <p><strong>Wind:</strong> ${windSpeed} m/s</p>

//             <p style="color:#27ae60;">
//               ${
//                 temperature > 30
//                   ? "Stay hydrated 🥤"
//                   : "Weather is comfortable 😊"
//               }
//             </p>
//           </div>
//         `);

//         trip.lastWeatherCondition = weatherCondition;
//       }
//     }

//     // ======================
//     // 🚗 TRAFFIC ALERT (FINAL FIX)
//     // ======================
//     if (trafficData) {
//       const congestionArray = trafficData.congestion || [];

//       // ✅ remove "unknown"
//       const valid = congestionArray.filter(c => c !== "unknown");

//       let trafficStatus = "No Live Traffic ⚪";

//       if (valid.length === 0) {
//         trafficStatus = "Traffic data unavailable ⚪";
//       } else if (valid.includes("heavy")) {
//         trafficStatus = "Heavy Traffic 🚨";
//       } else if (valid.includes("moderate")) {
//         trafficStatus = "Moderate Traffic ⚠️";
//       } else if (valid.includes("low")) {
//         trafficStatus = "Light Traffic 🟢";
//       }

//       // ✅ avoid duplicate email spam
//       if (trip.lastTrafficAlert !== trafficStatus) {
//         alerts.push(`
//           <div style="background:#fff8e6; padding:15px; border-radius:10px;">
//             <h3>🚗 Traffic Update</h3>
//             <p><strong>Status:</strong> ${trafficStatus}</p>
//             <p><strong>Distance:</strong> ${(trafficData.distance / 1000).toFixed(2)} km</p>
//             <p><strong>Time:</strong> ${(trafficData.duration / 60).toFixed(1)} mins</p>
//           </div>
//         `);

//         trip.lastTrafficAlert = trafficStatus;
//       }
//     }

// //     if (trafficData) {
// //   const normalTime = trafficData.duration;
// //   const trafficTime = trafficData.duration_in_traffic;

// //   const delay = trafficTime - normalTime;

// //   let trafficStatus = "Smooth Traffic 🟢";

// //   if (delay > 900) {
// //     trafficStatus = "Heavy Traffic 🚨"; // >15 min delay
// //   } else if (delay > 300) {
// //     trafficStatus = "Moderate Traffic ⚠️"; // >5 min delay
// //   }

// //   if (trip.lastTrafficAlert !== trafficStatus) {
// //     alerts.push(`
// //       <div style="background:#fff8e6; padding:15px; border-radius:10px;">
// //         <h3>🚗 Traffic Update (Google)</h3>
// //         <p><strong>Status:</strong> ${trafficStatus}</p>
// //         <p><strong>Distance:</strong> ${(trafficData.distance / 1000).toFixed(2)} km</p>
// //         <p><strong>Normal Time:</strong> ${(normalTime / 60).toFixed(1)} mins</p>
// //         <p><strong>With Traffic:</strong> ${(trafficTime / 60).toFixed(1)} mins</p>
// //         <p><strong>Delay:</strong> ${(delay / 60).toFixed(1)} mins</p>
// //       </div>
// //     `);

// //     trip.lastTrafficAlert = trafficStatus;
// //   }
// // }

//     // ======================
//     // 📧 SEND EMAIL
//     // ======================
//     if (alerts.length > 0) {
//       await sendEmail(
//         user.email,
//         "🚨 Smart Travel Alert Update",
//         `
//         <div style="font-family:Segoe UI,Arial; background:#f4f6f9; padding:20px;">

//           <div style="max-width:600px; margin:auto; background:#fff; border-radius:12px; overflow:hidden;">

//             <!-- HEADER -->
//             <div style="background:linear-gradient(135deg,#4facfe,#00f2fe); color:white; padding:20px; text-align:center;">
//               <h2>🚨 Live Travel Alert</h2>
//             </div>

//             <!-- ROUTE -->
//             <div style="padding:20px;">
//               <p><strong>📍 Route:</strong> ${trip.from.name} → ${trip.to.name}</p>
//               <p style="color:#888;">${new Date().toLocaleString()}</p>
//             </div>

//             <!-- ALERTS -->
//             <div style="padding:0 20px;">
//               ${alerts.join("<br/>")}
//             </div>

//             <!-- TIPS -->
//             <div style="padding:20px;">
//               <h3>💡 Travel Tips</h3>
//               <ul>
//                 <li>Check alternate routes 🚦</li>
//                 <li>Carry essentials 🧳</li>
//                 <li>Drive safely 🌧</li>
//               </ul>
//             </div>

//             <!-- FOOTER -->
//             <div style="background:#f1f1f1; padding:10px; text-align:center; font-size:12px;">
//               Smart Tourist Safety System 🚀
//             </div>

//           </div>
//         </div>
//         `
//       );

//       await trip.save();
//       console.log("✅ Alert email sent!");
//     }

//   } catch (err) {
//     console.error("❌ Alert Service Error:", err.message);
//   }
// };

const checkAlerts = async (trip) => {
  try {
    const start = trip.liveLocation || trip.from;
    const end = trip.to;

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
    // if (weatherData) {
    //   const weatherCondition =
    //     weatherData.weather?.[0]?.description || "Unknown";

    //   // ✅ convert Kelvin → Celsius
    //   const temperature = weatherData.main?.temp
    //     ? (weatherData.main.temp - 273.15).toFixed(1)
    //     : "N/A";

    //   const feelsLike = weatherData.main?.feels_like
    //     ? (weatherData.main.feels_like - 273.15).toFixed(1)
    //     : "N/A";

    //   const humidity = weatherData.main?.humidity || "N/A";
    //   const windSpeed = weatherData.wind?.speed || "N/A";

    //   const icon = weatherData.weather?.[0]?.icon;
    //   const iconUrl = icon
    //     ? `http://openweathermap.org/img/wn/${icon}@2x.png`
    //     : "";

    //   if (trip.lastWeatherCondition !== weatherCondition) {
    //     alerts.push(`
    //       <div style="background:#eef6ff; padding:15px; border-radius:10px;">
    //         <h3>🌦 Weather Update</h3>
    //         <p><img src="${iconUrl}" /></p>
    //         <p><strong>Condition:</strong> ${weatherCondition}</p>
    //         <p><strong>Temperature:</strong> ${temperature}°C</p>
    //         <p><strong>Feels Like:</strong> ${feelsLike}°C</p>
    //         <p><strong>Humidity:</strong> ${humidity}%</p>
    //         <p><strong>Wind:</strong> ${windSpeed} m/s</p>
    //       </div>
    //     `);

    //     trip.lastWeatherCondition = weatherCondition;
    //   }
    // }

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

    if (trafficData) {
      const congestionArray = trafficData.congestion || [];
      const valid = congestionArray.filter((c) => c !== "unknown");

      let trafficStatus = "No Live Traffic ⚪";
      let trafficColor = "#95a5a6"; // default gray

      if (valid.length === 0) {
        trafficStatus = "Traffic data unavailable ⚪";
        trafficColor = "#95a5a6";
      } else if (valid.includes("heavy")) {
        trafficStatus = "Heavy Traffic 🚨";
        trafficColor = "#e74c3c"; // red
      } else if (valid.includes("moderate")) {
        trafficStatus = "Moderate Traffic ⚠️";
        trafficColor = "#f39c12"; // orange
      } else if (valid.includes("low")) {
        trafficStatus = "Light Traffic 🟢";
        trafficColor = "#27ae60"; // green
      }

      const trafficIcons = {
        heavy: "https://cdn-icons-png.flaticon.com/512/1532/1532544.png",
        moderate: "https://cdn-icons-png.flaticon.com/512/1532/1532534.png",
        light: "https://cdn-icons-png.flaticon.com/512/1532/1532528.png",
      };

      const iconUrl =
        trafficIcons[trafficStatus.toLowerCase()] ||
        "https://cdn-icons-png.flaticon.com/512/1532/1532560.png";

      if (trip.lastTrafficAlert !== trafficStatus) {
        alerts.push(`
      <div style="background:#fff8e6; padding:20px; border-radius:12px; margin-bottom:10px; display:flex; align-items:center;">
        <!-- Icon -->
        <div style="flex-shrink:0; margin-right:15px;">
  <img src={iconUrl} alt="Traffic/Weather" style={{ width: 80, height: 80 }} />
</div>

        <!-- Traffic Info -->
        <div style="flex-grow:1; font-family:Segoe UI, Arial;">
          <h3 style="margin:0; color:${trafficColor};">🚗 Traffic Update</h3>
          <p style="margin:5px 0;"><strong>Status:</strong> ${trafficStatus}</p>
          <p style="margin:5px 0;"><strong>Distance:</strong> ${(trafficData.distance / 1000).toFixed(1)} km</p>
          <p style="margin:5px 0;"><strong>Time:</strong> ${(trafficData.duration / 60).toFixed(1)} mins</p>
        </div>
      </div>
    `);

        trip.lastTrafficAlert = trafficStatus;
      }
    }

    //     if (weatherData) {
    //   const weatherCondition = weatherData.weather?.[0]?.description || "Unknown";

    //   const temperature = weatherData.main?.temp?.toFixed(1) || "N/A";
    //   const feelsLike = weatherData.main?.feels_like?.toFixed(1) || "N/A";
    //   const humidity = weatherData.main?.humidity || "N/A";
    //   const windSpeed = weatherData.wind?.speed || "N/A";

    //   const icon = weatherData.weather?.[0]?.icon;
    //   const iconUrl = icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : "";

    //   if (trip.lastWeatherCondition !== weatherCondition) {
    //     alerts.push(`
    //       <div style="background:#eef6ff; padding:15px; border-radius:10px;">
    //         <h3>🌦 Weather Update</h3>
    //         <p><img src="${iconUrl}" /></p>
    //         <p><strong>Condition:</strong> ${weatherCondition}</p>
    //         <p><strong>Temperature:</strong> ${temperature}°C</p>
    //         <p><strong>Feels Like:</strong> ${feelsLike}°C</p>
    //         <p><strong>Humidity:</strong> ${humidity}%</p>
    //         <p><strong>Wind:</strong> ${windSpeed} m/s</p>
    //       </div>
    //     `);

    //     trip.lastWeatherCondition = weatherCondition;
    //   }
    // }

    // ======================
    // 🚗 TRAFFIC ALERT (SMART LOGIC)
    // ======================
    if (trafficData) {
      const congestionArray = trafficData.congestion || [];

      const valid = congestionArray.filter((c) => c !== "unknown");

      let trafficStatus = "No Traffic Data ⚪";

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

      if (trip.lastTrafficAlert !== trafficStatus) {
        alerts.push(`
          <div style="background:#fff8e6; padding:15px; border-radius:10px;">
            <h3>🚗 Traffic Update</h3>
            <p><strong>Status:</strong> ${trafficStatus}</p>
            <p><strong>Distance:</strong> ${
              trafficData.distance
                ? (trafficData.distance / 1000).toFixed(2)
                : "N/A"
            } km</p>
            <p><strong>Time:</strong> ${
              trafficData.duration
                ? (trafficData.duration / 60).toFixed(1)
                : "N/A"
            } mins</p>
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
        user.email,
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
