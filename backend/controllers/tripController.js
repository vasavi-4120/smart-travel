const mongoose = require("mongoose");
const TripModel = require("../model/TripModel.js");
const User = require("../model/UserModel");
const sendEmail = require("../util/sendEmail");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const { checkWeatherAlert } = require("../util/weatherAlert");
const { getWeatherData } = require("../util/weatherService.js");
const { getTrafficData } = require("../util/trafficService");
const { checkAlerts } = require("../util/alertService");

// ===============================
// 🔧 HELPER FUNCTIONS
// ===============================

const updateTripStatus = (trip) => {
  const now = new Date();

  // 🚨 Highest priority
  if (trip.status === "Emergency") {
    return "Emergency";
  }

  // ❌ Do not override these
  if (trip.status === "Cancelled" || trip.status === "Completed") {
    return trip.status;
  }

  const start = combineDateAndTime(trip.startDate, trip.startTime);
  const end = combineDateAndTime(trip.endDate, trip.endTime);

  if (!start || !end) return trip.status;

  if (now < start) return "Pending";
  if (now >= start && now <= end) return "Active";
  return "Completed";
};

function combineDateAndTime(date, time) {
  if (!date || !time) return null;

  const [hours, minutes] = time.split(":");

  const combined = new Date(date); // already UTC internally
  combined.setHours(Number(hours));
  combined.setMinutes(Number(minutes));
  combined.setSeconds(0);
  combined.setMilliseconds(0);

  return combined;
}
exports.combineDateAndTime = combineDateAndTime;

function calculateStatus(start, end) {
  const now = new Date();

  if (now < start) return "Pending";
  if (now >= start && now <= end) return "Active";
  return "Completed";
}

// ===============================
// 🚀 REGISTER TRIP
// ===============================
exports.registerTrip = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userId = req.user._id;

    const {
      traveler,
      contactDetails,
      proof,
      from,
      to,
      accommodation,
      purposeOfWork,
      meansOfTransport,
      startDate,
      endDate,
      startTime,
      endTime,
      peopleTravel,
      numberOfDaysStaying,
    } = req.body;

    // ✅ Validate location objects
    if (
      !from?.name ||
      !from?.lat ||
      !from?.lng ||
      !to?.name ||
      !to?.lat ||
      !to?.lng
    ) {
      return res.status(400).json({
        message: "Valid From and To locations with coordinates are required",
      });
    }

    from.lat = Number(from.lat);
    from.lng = Number(from.lng);
    to.lat = Number(to.lat);
    to.lng = Number(to.lng);

    const newTrip = new TripModel({
      tripId: uuidv4(),
      userId: req.user._id,

      traveler,
      contactDetails,
      proof,
      from,
      to,
      accommodation,
      purposeOfWork,
      meansOfTransport,
      startDate,
      endDate,
      startTime,
      endTime,
      peopleTravel,
      numberOfDaysStaying,

      status: "Pending",
    });

    await newTrip.save();

    res.status(201).json({
      message: "Trip registered successfully",
      trip: newTrip,
    });

    setTimeout(async () => {
      try {
        console.log("Weather email process started...");

        const weatherData = await getWeatherData(to.lat, to.lng);

        if (!weatherData) {
          console.log("Weather data not available");
          return;
        }

        // const user = await User.findById(userId);
        //         const emails = [newTrip.traveler?.email, req.user?.email].filter(Boolean);

        // for (const email of emails) {
        //   await sendEmail(email, "Weather Update for Your Upcoming Trip", emailTemplate);
        // }

        const user = newTrip.traveler?.email;
        if (!user) {
          console.log("User not found");
          return;
        }

        const weatherCondition = weatherData.weather?.[0]?.main || "Unknown";
        const temperature = weatherData.main?.temp || "N/A";
        const feelsLike = weatherData.main?.feels_like || "N/A";
        const humidity = weatherData.main?.humidity || "N/A";
        const windSpeed = weatherData.wind?.speed || "N/A";
        const icon = weatherData.weather?.[0]?.icon;

        // ✅ Now create icon URL
        const iconUrl = `http://openweathermap.org/img/wn/${icon}@2x.png`;

        const emailTemplate = `
  <div style="font-family: Arial; padding: 20px; background: #f5f7fa; border-radius: 10px;">
    
    <h2 style="color: #2c3e50;">
      🌤 <img src="${iconUrl}" alt="weather icon" />
      Weather Update for Your Trip
    </h2>
    
    <p><strong>📍 Destination:</strong> ${to.name}</p>
    <p><strong>📅 Date:</strong> ${new Date().toLocaleDateString()}</p>
    
    <hr/>

    <p><strong>🌡 Temperature:</strong> ${temperature}°C</p>
    <p><strong>🤔 Feels Like:</strong> ${feelsLike}°C</p>
    <p><strong>☁ Condition:</strong> ${weatherCondition}</p>
    <p><strong>💧 Humidity:</strong> ${humidity}%</p>
    <p><strong>🌬 Wind Speed:</strong> ${windSpeed} m/s</p>

    <hr/>

    <p style="color: #27ae60;"><strong>🧳 Travel Tip:</strong> ${
      temperature > 30
        ? "Stay hydrated and wear light clothing."
        : "Carry a light jacket for comfort."
    }</p>

    <p style="color: #e74c3c;"><strong>⚠ Safety Tip:</strong> ${
      weatherCondition.toLowerCase().includes("rain")
        ? "Carry an umbrella and be cautious on roads."
        : "Weather is clear, safe to travel."
    }</p>

    <br/>

    <p style="text-align:center; color: #7f8c8d;">
      Have a safe and happy journey! ✈😊
    </p>
  </div>
`;

        await sendEmail(
          // user.email,
          user,
          "Weather Update for Your Upcoming Trip",
          emailTemplate,
        );

        console.log("Weather email sent successfully");
      } catch (err) {
        console.error("Weather email error:", err);
      }
    }, 1000);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

exports.getUserTrips = async (req, res) => {
  try {
    const trips = await TripModel.find({ userId: req.user._id });

    const updatedTrips = await Promise.all(
      trips.map(async (trip) => {
        // 🛑 If already cancelled, don't touch it
        // if (trip.status === "Cancelled") {
        //   return trip;
        // }

        if (["Cancelled", "Emergency", "Completed"].includes(trip.status)) {
          return trip;
        }

        const start = combineDateAndTime(trip.startDate, trip.startTime);
        const end = combineDateAndTime(trip.endDate, trip.endTime);

        const realTimeStatus =
          start && end ? calculateStatus(start, end) : trip.status;

        if (trip.status !== realTimeStatus) {
          trip.status = realTimeStatus;
          await trip.save();
        }

        return trip;
      }),
    );

    res.json(updatedTrips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ❌ CANCEL TRIP
// ===============================
exports.cancelTrip = async (req, res) => {
  try {
    const { tripId } = req.params; // or req.params.id depending on your route
    const { reason } = req.body;

    console.log("=== CANCEL TRIP DEBUG ===");
    console.log("Params:", req.params);
    console.log("Body:", req.body);
    console.log("TripId:", tripId);
    console.log("Reason:", reason);
    console.log("User:", req.user?._id);
    console.log("========================");

    // Validate inputs
    if (!tripId) {
      return res.status(400).json({
        message: "Trip ID is required",
      });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    // Find the trip
    const trip = await TripModel.findOne({
      tripId: tripId,
      userId: req.user._id,
    });

    console.log("Found trip:", trip ? "Yes" : "No");

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    console.log("Current trip status:", trip.status);

    // Check if already cancelled
    if (trip.status === "Cancelled") {
      return res.status(400).json({
        message: "Trip already cancelled",
        trip: trip,
      });
    }

    // Update the trip
    trip.status = "Cancelled";
    trip.cancelledAt = new Date();
    trip.cancelReason = reason || "No reason provided";

    // Save with validation disabled temporarily for testing
    const savedTrip = await trip.save({ validateBeforeSave: false });

    console.log("Save result:", {
      status: savedTrip.status,
      cancelledAt: savedTrip.cancelledAt,
      cancelReason: savedTrip.cancelReason,
    });

    res.status(200).json({
      message: "Trip cancelled successfully",
      trip: savedTrip,
    });
  } catch (error) {
    console.error("Cancel trip error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    res.status(500).json({
      message: "Failed to cancel trip",
      error: error.message,
    });
  }
};

// ===============================
// 📍 TRACK LOCATION + ALERTS
// ===============================
exports.trackLocation = async (req, res) => {
  try {
    const { tripId, lat, lng } = req.body;

    const trip = await TripModel.findOne({
      tripId,
      userId: req.user._id,
    });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (trip.status === "Cancelled") {
      return res.status(200).json({
        message: "Trip already cancelled. No tracking allowed.",
      });
    }

    // if (trip.status !== "Cancelled")
    if (!["Cancelled", "Emergency", "Completed"].includes(trip.status)) {
      const newStatus = updateTripStatus(trip);

      if (trip.locationHistory.length === 0 && newStatus === "Completed") {
        trip.status = "Pending";
      } else {
        trip.status = newStatus;
      }
    }

    const start = combineDateAndTime(trip.startDate, trip.startTime);
    const end = combineDateAndTime(trip.endDate, trip.endTime);

    const realTimeStatus =
      start && end ? calculateStatus(start, end) : trip.status;

    if (
      !["Cancelled", "Emergency"].includes(trip.status) &&
      realTimeStatus === "Completed"
    ) {
      trip.status = "Completed";
      await trip.save();
      return res.status(400).json({
        message: "Trip completed. Tracking stopped.",
      });
    }

    // ✅ Save location
    trip.liveLocation = { lat, lng };
    trip.locationHistory.push({
      lat,
      lng,
      timestamp: new Date(),
    });

    await trip.save();
    try {
      await checkAlerts(trip);
    } catch (err) {
      console.error("Alert error:", err);
    }

    // ===============================
    // 🌦 WEATHER ALERT LOGIC ADDED
    // ===============================

    // 🌦 GET CURRENT WEATHER
    const weatherData = await getWeatherData(lat, lng);

    if (!weatherData) {
      return res.status(200).json({ message: "Location stored" });
    }

    // const weatherCondition = weatherData.weather?.[0]?.main || "Unknown";
    const weatherCondition = weatherData.weather?.[0]?.description || "Unknown";
    const temperature = weatherData.main?.temp || "N/A";

    console.log("Current Weather:", weatherCondition);

    // ✅ SEND EMAIL ONLY IF WEATHER CHANGED
    // if (trip.lastWeatherCondition !== weatherCondition) {
    //   console.log("Weather changed! Sending email...");

    //   const user = await User.findById(trip.userId);

    //   if (user) {
    //     await sendEmail(
    //       user.email,
    //       "🌦 Live Weather Update",
    //       `
    //   <div style="font-family: Arial; padding: 20px;">
    //     <h2>Weather Update During Your Trip</h2>
    //     <p><strong>Location:</strong> ${lat}, ${lng}</p>
    //     <p><strong>Condition:</strong> ${weatherCondition}</p>
    //     <p><strong>Temperature:</strong> ${temperature}°C</p>
    //     <p>Travel safely!</p>
    //   </div>
    //   `,
    //     );

    //     console.log("Weather update email sent!");

    //     // ✅ Update last weather condition
    //     trip.lastWeatherCondition = weatherCondition;
    //     await trip.save();
    //   }
    // }

    res.status(200).json({ message: "Location stored" });
  } catch (error) {
    console.error("Track Location Error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getActiveTrip = async (req, res) => {
  const trips = await TripModel.find({ userId: req.user._id });

  let activeTrip = null;

  for (let trip of trips) {
    const start = combineDateAndTime(trip.startDate, trip.startTime);
    const end = combineDateAndTime(trip.endDate, trip.endTime);

    // const status = calculateStatus(start, end);

    // if (trip.status !== status) {
    //   trip.status = status;
    //   await trip.save();
    // }

    if (!["Cancelled", "Emergency", "Completed"].includes(trip.status)) {
      const status = calculateStatus(start, end);

      if (trip.status !== status) {
        trip.status = status;
        await trip.save();
      }
    }

    if (trip.status === "Active") {
      activeTrip = trip;
      break;
    }
  }

  if (!activeTrip) {
    return res.status(204).json({ message: "No active trip" });
  }

  res.json({
    tripId: activeTrip.tripId,
    start: activeTrip.liveLocation || activeTrip.from,
    end: activeTrip.to,
    status: activeTrip.status,
  });
};

exports.getTripById = async (req, res) => {
  try {
    const trip = await TripModel.findOne({ tripId: req.params.tripId });

    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // ✅ Don't override cancelled
    // if (trip.status !== "Cancelled")
    if (!["Cancelled", "Emergency", "Completed"].includes(trip.status)) {
      const newStatus = updateTripStatus(trip);

      if (trip.status !== newStatus) {
        trip.status = newStatus;
        await trip.save();
      }
    }

    res.status(200).json({
      start: trip.liveLocation || trip.from, // fallback
      end: trip.to,
      history: trip.locationHistory || [],
      status: trip.status,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const cache = {};

exports.geocodeLocation = async (req, res) => {
  try {
    const { place } = req.query;

    if (!place) {
      return res.status(400).json({ message: "Place is required" });
    }

    if (cache[place]) {
      console.log("Cache hit");
      return res.json(cache[place]);
    }

    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: place,
          format: "json",
          limit: 1,
        },
        headers: {
          "User-Agent": "SmartTouristApp/1.0",
        },
      },
    );

    if (response.data.length === 0) {
      return res.status(404).json({ message: "Location not found" });
    }

    const result = {
      lat: Number(response.data[0].lat),
      lng: Number(response.data[0].lon),
    };

    cache[place] = result; // ✅ store in cache

    res.json(result);
  } catch (error) {
    console.error("Geocode Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { tripId, lat, lng } = req.body;

    // console.log("BODY:", req.body);
    // console.log("TOKEN USER:", req.user._id);

    const trip = await TripModel.findOne({ tripId });

    // console.log("DB TRIP:", trip);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found by tripId" });
    }

    if (trip.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "User mismatch",
        tripUser: trip.userId,
        tokenUser: req.user._id,
      });
    }

    trip.liveLocation = { lat, lng };
    trip.locationHistory.push({ lat, lng, timestamp: new Date() });

    await trip.save();

    res.status(200).json({ message: "Location Updated" });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// 🚨 EMERGENCY
// ===============================
exports.triggerEmergency = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await TripModel.findOneAndUpdate(
      { tripId },
      {
        status: "Emergency",
        emergencyTriggeredAt: new Date(),
      },
      { new: true },
    );

    res.json({
      message: "Emergency triggered!",
      trip,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//for mapbox traffic data, not used currently
exports.checkTrafficAndSendAlert = async (req, res) => {
  try {
    const { tripId } = req.body;

    if (!tripId) {
      return res.status(400).json({ message: "TripId is required" });
    }

    const trip = await TripModel.findOne({
      tripId,
      userId: req.user._id,
    });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const start = trip.liveLocation || trip.from;
    const end = trip.to;

    if (!start?.lat || !start?.lng || !end?.lat || !end?.lng) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    const traffic = await getTrafficData(start, end);

    if (!traffic) {
      return res.json({ message: "No traffic data available" });
    }

    // ✅ FIXED ALERT LOGIC
    let alert = "Smooth";

    if (traffic.congestion?.some((c) => c === "heavy")) {
      alert = "Heavy Traffic 🚨";
    } else if (traffic.congestion?.some((c) => c === "moderate")) {
      alert = "Moderate Traffic ⚠️";
    } else if (traffic.congestion?.length > 0) {
      alert = "Light Traffic 🟢";
    }

    // console.log("Traffic Raw Data:", traffic);

    // ✅ SEND EMAIL ONLY IF HEAVY
    if (alert === "Heavy Traffic 🚨") {
      // const user = await User.findById(trip.userId);
      const user = trip.traveler?.email;

      if (user && trip.lastTrafficAlert !== alert) {
        await sendEmail(
          user.email,
          "🚨 Traffic Alert on Your Route",
          `
          <div style="font-family: Arial; padding: 20px;">
            <h2>🚗 Traffic Alert</h2>
            <p><strong>Route:</strong> ${trip.from.name} → ${trip.to.name}</p>
            <p><strong>Status:</strong> ${alert}</p>
            <p><strong>Distance:</strong> ${(traffic.distance / 1000).toFixed(2)} km</p>
            <p><strong>Estimated Time:</strong> ${(traffic.duration / 60).toFixed(1)} mins</p>
            <p style="color:red;">⚠ Please consider alternate routes</p>
          </div>
          `,
        );

        trip.lastTrafficAlert = alert;
        await trip.save();

        console.log("✅ Traffic alert email sent!");
      }
    }

    return res.json({
      alert,
      distance: (traffic.distance / 1000).toFixed(2),
      duration: (traffic.duration / 60).toFixed(1),
    });
  } catch (err) {
    console.error("❌ Traffic Alert Error:", err);

    return res.status(500).json({
      message: "Traffic API failed",
      error: err.message,
    });
  }
};
