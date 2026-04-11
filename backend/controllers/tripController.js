const mongoose = require("mongoose");
const TripModel = require("../model/TripModel.js");
const User = require("../model/UserModel");
const {
  sendEmail,
  sendLocationEmail,
  sendEmergencyEmail,
} = require("../util/sendEmail");
const { sendSMS, sendLocationSMS } = require("../util/sendSms");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const { triggerEmergencySocket } = require("../sockets/sosSocket");
const { checkWeatherAlert } = require("../util/weatherAlert");
const { getWeatherData } = require("../util/weatherService.js");
const { getTrafficData } = require("../util/trafficService");
const { getTrafficStatus } = require("../util/trafficService");
const { checkAlerts } = require("../util/alertService");
const { getNearbyPlaces } = require("../util/mapService.js");
const { getDistance } = require("../util/mapService.js");

// ===============================
// 🔧 HELPER FUNCTIONS
// ===============================

const updateTripStatus = (trip) => {
  if (trip.sosTriggered === true || trip.status === "Emergency")
    return "Emergency";

  if (
    // trip.status === "Emergency" ||
    trip.status === "Cancelled" ||
    trip.status === "Completed"
  ) {
    return trip.status;
  }

  const start = combineDateAndTime(trip.startDate, trip.startTime);
  const end = combineDateAndTime(trip.endDate, trip.endTime);

  if (!start || !end) return trip.status;

  const now = new Date();

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
exports.calculateStatus = calculateStatus;

const getEmergencyNumbers = (contactDetails) => {
  const numbers = [];

  if (contactDetails.mobileNumber) {
    numbers.push(contactDetails.mobileNumber);
  }

  if (contactDetails.emergencyContact1) {
    numbers.push(contactDetails.emergencyContact1);
  }

  if (contactDetails.emergencyContact2) {
    numbers.push(contactDetails.emergencyContact2);
  }

  if (contactDetails.relationshipContact) {
    numbers.push(contactDetails.relationshipContact);
  }

  return numbers;
};
const getEmergencyEmails = (contactDetails) => {
  const emails = [];

  if (contactDetails.emergencyemail1) {
    emails.push(contactDetails.emergencyemail1);
  }

  if (contactDetails.emergencyemail2) {
    emails.push(contactDetails.emergencyemail2);
  }

  if (contactDetails.relationshipemail) {
    emails.push(contactDetails.relationshipemail);
  }

  return emails;
};

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
    // ✅ Check if user is logged in
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login first.",
      });
    }

    const trips = await TripModel.find({ userId: req.user._id });

    const updatedTrips = await Promise.all(
      trips.map(async (trip) => {
        if (trip.sosTriggered) {
          trip.status = "Emergency";
          await trip.save();
          return trip;
        }

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

    // const trips = await TripModel.find({ userId: req.user._id }).lean();

    // const updatedTrips = trips.map((trip) => {
    //   if (trip.sosTriggered) {
    //     return { ...trip, status: "Emergency" };
    //   }

    //   if (["Cancelled", "Emergency", "Completed"].includes(trip.status)) {
    //     return trip;
    //   }

    //   const start = combineDateAndTime(trip.startDate, trip.startTime);
    //   const end = combineDateAndTime(trip.endDate, trip.endTime);

    //   const realTimeStatus =
    //     start && end ? calculateStatus(start, end) : trip.status;

    //   return { ...trip, status: realTimeStatus }; // ✅ no DB write
    // });

    res.json(updatedTrips);
  } catch (error) {
    console.error("GetUserTrips Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
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

// ============================================================================
// 📍 TRACK LOCATION + ALERTS + WITH SOCKET IO
//     traffic and weather alerts are triggered here for real-time updates
// ============================================================================
exports.trackLocation = async (req, res) => {
  try {
    const { tripId, lat, lng } = req.body;

    if (!tripId || lat === undefined || lng === undefined) {
      return res.status(400).json({ message: "Missing location data" });
    }

    const trip = await TripModel.findOne({
      tripId,
      userId: req.user._id,
    });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // 🚨 EMERGENCY LOCK
    if (trip.sosTriggered) {
      if (trip.status !== "Emergency") {
        trip.status = "Emergency";
        await trip.save();
      }

      return res.status(200).json({
        message: "🚨 Emergency active. Tracking locked.",
      });
    }

    if (trip.status === "Cancelled") {
      return res.status(200).json({
        message: "Trip cancelled. No tracking allowed.",
      });
    }

    // 🔄 STATUS UPDATE
    const newStatus = updateTripStatus(trip);

    // if (!["Cancelled", "Completed", "Emergency"].includes(trip.status)) {
    //   trip.status = newStatus;
    // }
    if (trip.status !== newStatus) {
      trip.status = newStatus;
      // No need to wait for the final save below, but it helps to be explicit
    }

    // 🛑 STOP IF COMPLETED
    if (trip.status === "Completed") {
      await trip.save();

      return res.status(400).json({
        message: "Trip completed. Tracking stopped.",
      });
    }

    // 📍 SAVE LOCATION
    trip.liveLocation = { lat, lng };
    trip.locationHistory.push({
      lat,
      lng,
      timestamp: new Date(),
    });

    await trip.save();

    // 📡 SOCKET
    const io = req.app.get("io");
    if (io) {
      io.to(tripId).emit("LIVE_LOCATION_UPDATE", {
        tripId,
        lat,
        lng,
        timestamp: new Date(),
      });
    }

    // ⚠ ALERTS
    // try {
    //   await checkAlerts(trip);
    // } catch (err) {
    //   console.error("Alert error:", err);
    // }

    const travelerName = trip.traveler?.name || "Traveler";
    const primaryEmail = trip.traveler?.email;
    const contactDetails = trip.contactDetails || {};
    const phoneNumbers = getEmergencyNumbers(contactDetails);
    const emailAddresses = getEmergencyEmails(contactDetails);
    const validEmails = emailAddresses.filter(Boolean);

    // if (trip.status === "Active") {
    //   const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    //   // await sendLocationSMS(phoneNumbers, travelerName, googleMapsUrl, trip.tripId);

    //   if (
    //     !trip.lastLocationEmailTime ||
    //     Date.now() - trip.lastLocationEmailTime > 900000
    //   ) {
    //     await Promise.all([
    //       primaryEmail &&
    //         sendLocationEmail(
    //           primaryEmail,
    //           travelerName,
    //           googleMapsUrl,
    //           trip.tripId,
    //         ),
    //       ...emailAddresses.map((email) =>
    //         sendLocationEmail(email, travelerName, googleMapsUrl, trip.tripId),
    //       ),
    //     ]);

    //     trip.lastLocationEmailTime = Date.now();
    //     await trip.save();
    //   }
    // }

    if (trip.status === "Active" && !trip.locationShared) {
      const updated = await TripModel.findOneAndUpdate(
        { _id: trip._id, locationShared: false },
        { $set: { locationShared: true } },
        { new: true },
      );

      if (updated) {
        const trackingLink = `http://localhost:5173/track/${trip.tripId}`;

        await sendLocationSMS(
          phoneNumbers,
          travelerName,
          trackingLink,
          trip.tripId,
        );

        await Promise.all([
          primaryEmail &&
            sendLocationEmail(
              primaryEmail,
              travelerName,
              trackingLink,
              trip.tripId,
            ),
          ...validEmails.map((email) =>
            sendLocationEmail(email, travelerName, trackingLink, trip.tripId),
          ),
        ]);
      }
    }

    // 🌦 WEATHER (async)
    getWeatherData(lat, lng).catch(() => {});

    return res.status(200).json({
      message: "Location stored & broadcasted",
    });
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

    if (!["Cancelled", "Emergency", "Completed"].includes(trip.status)) {
      const status = calculateStatus(start, end);

      if (trip.status !== status) {
        trip.status = status;
        await trip.save();
      }
    }

    if (["Active", "Emergency"].includes(trip.status)) {
      activeTrip = trip;
      break;
    }
  }

  if (!activeTrip) {
    return res.status(204).json({ message: "No active trip" });
  }

  // res.json({
  //   tripId: activeTrip.tripId,
  //   start: activeTrip.liveLocation || activeTrip.from,
  //   end: activeTrip.to,
  //   status: activeTrip.status,
  // });
  res.json({
    tripId: activeTrip.tripId,
    from: {
      lat: activeTrip.liveLocation?.lat || activeTrip.from.lat,
      lng: activeTrip.liveLocation?.lng || activeTrip.from.lng,
    },
    to: {
      lat: activeTrip.to.lat,
      lng: activeTrip.to.lng,
    },
    liveLocation: activeTrip.liveLocation || null,
    status: activeTrip.status,
    sosPlaces: activeTrip.sosPlaces || [],
    sosLocation: activeTrip.sosLocation || null,
    liveLocation: activeTrip.liveLocation || null,
  });
  // res.json({
  //   tripId: activeTrip.tripId,
  //   start: {
  //     lat: activeTrip.liveLocation?.lat || activeTrip.from.lat,
  //     lng: activeTrip.liveLocation?.lng || activeTrip.from.lng,
  //   },
  //   end: {
  //     lat: activeTrip.to.lat,
  //     lng: activeTrip.to.lng,
  //   },
  //   status: activeTrip.status,
  //   sosPlaces: activeTrip.sosPlaces || [],
  //   sosLocation: activeTrip.sosLocation || null,
  //   liveLocation: activeTrip.liveLocation || null,
  // });
};

exports.getTripById = async (req, res) => {
  try {
    const trip = await TripModel.findOne({ tripId: req.params.tripId });

    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    if (trip.sosTriggered) {
      trip.status = "Emergency";
      await trip.save();
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
      start: {
        lat: trip.liveLocation?.lat || trip.from?.lat,
        lng: trip.liveLocation?.lng || trip.from?.lng,
        name: trip.from?.name || "Start Location", // ✅ always send name
      },
      end: {
        lat: trip.to?.lat,
        lng: trip.to?.lng,
        name: trip.to?.name || "Destination", // ✅ always send name
      },
      history: trip.locationHistory || [],
      status: trip.status,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// controllers/tripController.js
exports.deleteTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await TripModel.findOneAndDelete({ tripId });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    res.json({ message: "Trip deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting trip" });
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

    if (!tripId || lat === undefined || lng === undefined) {
      return res.status(400).json({ message: "tripId, lat, lng required" });
    }

    const trip = await TripModel.findOne({
      tripId,
      userId: req.user._id,
    });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // 🚨 EMERGENCY LOCK
    if (trip.sosTriggered) {
      if (trip.status !== "Emergency") {
        trip.status = "Emergency";
        await trip.save();
      }

      return res.status(200).json({
        message: "🚨 Emergency active. Location updates blocked.",
      });
    }

    // 📍 SAFE ARRAY INIT
    if (!trip.locationHistory) {
      trip.locationHistory = [];
    }

    // 📍 UPDATE LOCATION
    trip.liveLocation = { lat, lng };
    trip.locationHistory.push({
      lat,
      lng,
      timestamp: new Date(),
    });

    await trip.save();

    // 📡 SOCKET
    const io = req.app.get("io");

    if (io) {
      io.to(tripId).emit("LIVE_LOCATION_UPDATE", {
        tripId,
        lat,
        lng,
        timestamp: new Date(),
      });
    }

    res.status(200).json({
      message: "Location updated & broadcasted",
    });
  } catch (error) {
    console.error("Update Location Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// 🚨 EMERGENCY
// ===============================

exports.triggerEmergency = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Location is required" });
    }

    const existingTrip = await TripModel.findOne({ tripId });
    if (!existingTrip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // ===============================
    // 🏥 GET NEARBY PLACES FIRST
    // ===============================
    const hospitals =
      (await getNearbyPlaces(latitude, longitude, "hospital")) || [];

    const police = (await getNearbyPlaces(latitude, longitude, "police")) || [];

    const combined = [...hospitals, ...police];

    // const uniquePlaces = Array.from(
    //   new Map(combined.map((p) => [p.display_name, p])).values(),
    // );

    // // const sortedPlaces = uniquePlaces.sort(
    // //   (a, b) => (a.distance || 999) - (b.distance || 999),
    // // );
    // const sortedPlaces = uniquePlaces
    //   .filter((p) => p.lat && (p.lon || p.lng)) // remove invalid coords
    //   .sort((a, b) => a.distance - b.distance);

    // const nearestHospital = sortedPlaces.find((p) =>
    //   p.display_name?.toLowerCase().includes("hospital"),
    // );

    // const nearestPolice = sortedPlaces.find((p) =>
    //   p.display_name?.toLowerCase().includes("police"),
    // );

    // const remaining = sortedPlaces.filter(
    //   (p) => p !== nearestHospital && p !== nearestPolice,
    // );

    // const nearestPlaces = [
    //   nearestHospital,
    //   nearestPolice,
    //   ...remaining.slice(0, 10),
    // ].filter(Boolean);

    // const formattedPlaces = nearestPlaces.map((place) => ({
    //   name: place.display_name?.split(",")[0] || "Unknown",
    //   address: place.display_name || "Unknown",
    //   distance: place.distance ? place.distance.toFixed(2) : "N/A",
    //   lat: Number(place.lat) || 0,
    //   lng: Number(place.lon || place.lng),
    //   type: place.display_name?.toLowerCase().includes("police")
    //     ? "police"
    //     : place.display_name?.toLowerCase().includes("hospital")
    //       ? "hospital"
    //       : "other",
    // }));

    const uniquePlaces = Array.from(
      new Map(combined.map((p) => [p.display_name, p])).values(),
    );

    const sortedPlaces = uniquePlaces
      // .filter((p) => p.lat && (p.lon || p.lng))
      // .filter((p) => p.lat && p.lon)
      .filter((p) => {
        const lat = parseFloat(p.lat);
        const lon = parseFloat(p.lon);

        return (
          !isNaN(lat) &&
          !isNaN(lon) &&
          lat !== 0 &&
          lon !== 0 &&
          lat >= -90 &&
          lat <= 90 &&
          lon >= -180 &&
          lon <= 180
        );
      })
      .sort((a, b) => a.distance - b.distance);

    const isHospital = (p) =>
      p.display_name?.toLowerCase().includes("hospital");

    const isPolice = (p) => p.display_name?.toLowerCase().includes("police");

    const nearestHospital = sortedPlaces.find(isHospital);
    const nearestPolice = sortedPlaces.find(isPolice);

    const remaining = sortedPlaces.filter(
      (p) => p !== nearestHospital && p !== nearestPolice,
    );

    const nearestPlaces = [
      nearestHospital,
      nearestPolice,
      ...remaining.slice(0, 10),
    ].filter(Boolean);

    // const formattedPlaces = nearestPlaces.map((place) => ({
    //   name: place.display_name?.split(",")[0] || "Unknown",
    //   address: place.display_name || "Unknown",
    //   distance: place.distance.toFixed(2),
    //   lat: Number(place.lat),
    //   // lng: Number(place.lon || place.lng),
    //   lng: parseFloat(place.lon),
    //   // lng: place.lon ? parseFloat(place.lon) : null, // ✅ FIXED
    //   type: isPolice(place)
    //     ? "police"
    //     : isHospital(place)
    //       ? "hospital"
    //       : "other",
    // }));
    const formattedPlaces = nearestPlaces.map((place) => {
      const lat = parseFloat(place.lat);
      const lng = parseFloat(place.lon);

      return {
        name: place.display_name?.split(",")[0] || "Unknown",
        address: place.display_name || "Unknown",
        distance: place.distance?.toFixed(2) || "N/A",

        lat: isNaN(lat) ? null : lat,
        lng: isNaN(lng) ? null : lng,

        type: isPolice(place)
          ? "police"
          : isHospital(place)
            ? "hospital"
            : "other",
      };
    });
    console.log("SOS PLACES:", formattedPlaces);

    // ===============================
    // ✅ UPDATE TRIP (NOW SAFE)
    // ===============================
    // const updatedTrip = await TripModel.findOneAndUpdate(
    //   { tripId },
    //   {
    //     status: "Emergency",
    //     emergencyTriggeredAt: new Date(),
    //     sosTriggered: true,
    //     sosPlaces: formattedPlaces,
    //     sosLocation: {
    //       lat: latitude,
    //       lng: longitude,
    //     },
    //   },
    //   { new: true },
    // );

    // console.log("✅ Trip updated:", updatedTrip.status);
    const updatedTrip = await TripModel.findOneAndUpdate(
      { tripId },
      {
        $set: {
          // Use $set to be explicit
          status: "Emergency",
          emergencyTriggeredAt: new Date(),
          sosTriggered: true,
          sosPlaces: formattedPlaces,
          sosLocation: { lat: latitude, lng: longitude },
        },
      },
      { new: true, runValidators: false }, // runValidators: false helps if date logic is failing
    );

    console.log(
      "Database Update Result:",
      updatedTrip.status,
      "SOS Flag:",
      updatedTrip.sosTriggered,
    );

    // ===============================
    // 📡 SOCKET EMIT
    // ===============================
    const io = req.app.get("io");
    if (io) {
      io.to(tripId).emit("SOS_TRIGGERED", {
        tripId: updatedTrip.tripId,
        traveler: updatedTrip.traveler,
        location: updatedTrip.sosLocation,
        timestamp: updatedTrip.emergencyTriggeredAt,
        nearbyPlaces: formattedPlaces,
      });
    }

    const contactDetails = updatedTrip.contactDetails || {};
    const phoneNumbers = getEmergencyNumbers(contactDetails);
    const emailAddresses = getEmergencyEmails(contactDetails);
    const primaryEmail = updatedTrip.traveler?.email;

    // console.log("📞 Emergency numbers:", phoneNumbers);
    // console.log("📧 Emergency emails:", emailAddresses);

    // await sendSMS(phoneNumbers, latitude, longitude);

    await Promise.all([
      sendEmergencyEmail(primaryEmail, latitude, longitude, formattedPlaces),
      // ...emailAddresses.map((email) =>
      //   sendEmergencyEmail(email, latitude, longitude, formattedPlaces),
      // ),
    ]);

    res.json({
      message: "🚨 Emergency triggered successfully",
      trip: updatedTrip,
      nearbyPlaces: formattedPlaces,
    });
  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({
      message: "Error triggering emergency",
      error: err.message,
    });
  }
};

exports.EmergencyMap = async (req, res) => {
  try {
    const trip = await TripModel.findOne({
      tripId: req.params.tripId,
      userId: req.user._id, // 🔒 SECURITY CHECK
    });

    if (!trip) {
      return res.status(403).json({
        message: "Unauthorized or trip not found",
      });
    }

    res.json({
      sosLocation: trip.sosLocation,
      sosPlaces: trip.sosPlaces || [],
      status: trip.status,
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

    // ✅ FIX START LOCATION
    const start =
      trip.liveLocation?.lat && trip.liveLocation?.lng
        ? trip.liveLocation
        : trip.from;

    const end = trip.to;

    // ✅ VALIDATION
    if (
      !start?.lat ||
      !start?.lng ||
      !end?.lat ||
      !end?.lng ||
      isNaN(start.lat) ||
      isNaN(start.lng) ||
      isNaN(end.lat) ||
      isNaN(end.lng)
    ) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    const traffic = await getTrafficData(start, end);

    if (!traffic) {
      return res.json({ message: "No traffic data available" });
    }

    // ✅ SINGLE SOURCE OF TRUTH
    const { status: trafficStatus, color: trafficColor } =
      getTrafficStatus(traffic);

    const user = trip.traveler?.email;

    // ❗ SAFETY CHECK
    if (!user) {
      return res.json({ message: "User email not found" });
    }

    // ❗ SEND ONLY FOR IMPORTANT ALERTS
    if (
      (trafficStatus.includes("Heavy") || trafficStatus.includes("Moderate")) &&
      trip.lastTrafficAlert !== trafficStatus
    ) {
      const trafficIcons = {
        heavy:
          "https://res.cloudinary.com/daw1ro6q2/image/upload/v1775469110/Heavy_traffic_icon_vakvzb.png",
        moderate:
          "https://res.cloudinary.com/daw1ro6q2/image/upload/v1775469097/Moderate_traffic_icon_xiyigl.png",
        light:
          "https://res.cloudinary.com/daw1ro6q2/image/upload/v1775469074/Light_traffic_icon_njmqo5.png",
      };

      let trafficKey = "light";
      if (trafficStatus.includes("Heavy")) trafficKey = "heavy";
      else if (trafficStatus.includes("Moderate")) trafficKey = "moderate";

      const iconUrl = trafficIcons[trafficKey];

      // await sendEmail(
      //   user,
      //   "🚨 Smart Travel Alert Update",
      //   `
      //   <div style="font-family:Segoe UI,Arial; background:#f4f6f9; padding:20px;">
      //     <div style="max-width:600px; margin:auto; background:#fff; border-radius:12px;">

      //       <!-- HEADER -->
      //       <div style="background:#4facfe; color:white; padding:20px; text-align:center;">
      //         <h2>🚨 Live Traffic Alert</h2>
      //       </div>

      //       <!-- ROUTE -->
      //       <div style="padding:20px;">
      //         <p><strong>📍 Route:</strong> ${trip.from.name} → ${trip.to.name}</p>
      //         <p>${new Date().toLocaleString()}</p>
      //       </div>

      //       <!-- ALERT CARD -->
      //       <div style="padding:20px;">
      //         <div style="background:#fff8e6; padding:20px; border-radius:12px; display:flex; align-items:center;">

      //           <div style="margin-right:15px;">
      //             <img src="${iconUrl}" style="width:80px;height:80px;" />
      //           </div>

      //           <div>
      //             <h3 style="margin:0; color:${trafficColor};">🚗 Traffic Update</h3>
      //             <p><strong>Status:</strong> ${trafficStatus}</p>
      //             <p><strong>Distance:</strong> ${(traffic.distance / 1000).toFixed(1)} km</p>
      //             <p><strong>Time:</strong> ${(traffic.duration / 60).toFixed(1)} mins</p>
      //           </div>

      //         </div>
      //       </div>

      //       <!-- TIPS -->
      //       <div style="padding:20px;">
      //         <h3>💡 Tips</h3>
      //         <ul>
      //           <li>Check alternate routes 🚦</li>
      //           <li>Drive safely 🚗</li>
      //         </ul>
      //       </div>

      //     </div>
      //   </div>
      //   `
      // );

      trip.lastTrafficAlert = trafficStatus;
      await trip.save();
    }

    return res.json({
      alert: trafficStatus,
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
