const mongoose = require("mongoose");
const TripModel = require("../model/TripModel.js");
const User = require("../model/UserModel");
const {
  sendEmail,
  sendLocationEmail,
  sendPlacesEmail,
  sendEmergencyEmail,
} = require("../util/sendEmail");
const {
  sendSMS,
  sendEmergencySMS,
  sendLocationSMS,
  sendPlacesSMS,
} = require("../util/sendSms");
const { v4: uuidv4 } = require("uuid");
const serverUrl = process.env.SERVER_URL || "http://localhost:5173";
const axios = require("axios");
const { triggerEmergencySocket } = require("../sockets/sosSocket");
const { checkWeatherAlert } = require("../util/weatherAlert");
const { getWeatherData } = require("../util/weatherService.js");
const { getTrafficData } = require("../util/trafficService");
const { getTrafficStatus } = require("../util/trafficService");
const { checkAlerts } = require("../util/alertService");
const { getNearbyPlaces } = require("../util/mapService.js");
const { getTouristPlaces } = require("../util/placesService.js");
const { getDistance } = require("../util/mapService.js");
const TouristPlacesModel = require("../model/TouristPlacesModel.js");

// ===============================
// 🔧 HELPER FUNCTIONS
// ===============================
function combineDateAndTime(date, time) {
  if (!date || !time) return null;

  const dateObj = new Date(date);

  // ✅ Fix: Extract YYYY-MM-DD specifically in IST
  // toISOString() can return "yesterday" if it's early morning in India
  const dateStr = dateObj.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  // ✅ Fix: Create an absolute date by attaching the Indian offset (+05:30)
  return new Date(`${dateStr}T${time}:00+05:30`);
}

function updateTripStatus(trip) {
  const start = combineDateAndTime(trip.startDate, trip.startTime);
  const end = combineDateAndTime(trip.endDate, trip.endTime);
  const now = new Date(); // Current system time (UTC or Local, doesn't matter)

  if (!start || !end) return trip.status;

  // Comparison logic
  if (now < start) return "Pending";
  if (now >= start && now <= end) return "Active";
  return "Completed";
}

function normalizeStatus(status) {
  if (!status) return status;
  const lower = String(status).toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

// function combineDateAndTime(date, time) {
//   if (!date || !time) return null;

//   const dateObj = new Date(date);
//   const dateStr = dateObj.toISOString().slice(0, 10);

//   return new Date(`${dateStr}T${time}:00+05:30`);
// }
exports.combineDateAndTime = combineDateAndTime;
exports.normalizeStatus = normalizeStatus;

// function updateTripStatus(trip) {
//   const start = combineDateAndTime(trip.startDate, trip.startTime);
//   const end = combineDateAndTime(trip.endDate, trip.endTime);

//   const now = new Date();

//   if (!start || !end) {
//     console.log("❌ Missing date/time:", trip.tripId);
//     return trip.status; // ✅ NEVER return undefined
//   }

//   if (now < start) return "Pending";
//   if (now >= start && now <= end) return "Active";
//   return "Completed"; // ✅ ALWAYS return something
// }
exports.updateTripStatus = updateTripStatus;

// function combineDateAndTime(date, time) {
//   if (!date || !time) return null;

//   const dateObj = new Date(date);
//   const dateStr = dateObj.toISOString().slice(0, 10);

//   // Create a full IST datetime string explicitly so parsing is consistent.
//   const dateTimeString = `${dateStr}T${time}:00+05:30`;
//   const combined = new Date(dateTimeString);

//   return Number.isNaN(combined.getTime()) ? null : combined;
// }
// exports.combineDateAndTime = combineDateAndTime;

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

// exports.getUserTrips = async (req, res) => {
//   try {
//     // 🔐 Auth check
//     if (!req.user || !req.user._id) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized. Please login first.",
//       });
//     }

//     const trips = await TripModel.find({ userId: req.user._id });

//     const updatedTrips = await Promise.all(
//       trips.map(async (trip) => {
//         let newStatus = trip.status;

//         // 🚨 Emergency always overrides everything
//         if (trip.sosTriggered) {
//           newStatus = "Emergency";
//         } else {
//           newStatus = updateTripStatus(trip);
//         }

//         // 💾 Update DB only if changed
//         if (trip.status !== newStatus) {
//           await TripModel.updateOne(
//             { _id: trip._id },
//             { $set: { status: newStatus } }
//           );

//           // 📡 Emit once per change
//           const io = req.app.get("io");
//           if (io) {
//             io.emit("TRIP_STATUS_REFRESH");
//           }
//         }

//         return {
//           ...trip.toObject(),
//           status: newStatus,
//         };
//       })
//     );

//     return res.json(updatedTrips);
//   } catch (error) {
//     console.error("GetUserTrips Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// exports.getUserTrips = async (req, res) => {
//   try {
//     if (!req.user || !req.user._id) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized. Please login first.",
//       });
//     }

//     // ❌ No status calculation here
//     const trips = await TripModel.find({ userId: req.user._id });

//     return res.json(trips);
//   } catch (error) {
//     console.error("GetUserTrips Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };
exports.getUserTrips = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    // 1. Fetch all trips for the user
    const trips = await TripModel.find({ userId: req.user._id });

    // 2. Map through trips to check and update status in real-time
    const updatedTrips = await Promise.all(
      trips.map(async (trip) => {
        // 🚫 Skip calculation for "Locked" states
        const currentStatus = normalizeStatus(trip.status);
        if (["Cancelled", "Emergency", "Completed"].includes(currentStatus)) {
          trip.status = currentStatus;
          return trip;
        }

        const computedStatus = normalizeStatus(updateTripStatus(trip)); // Using our IST-aware function

        // 🔄 Normalize returned status and write changes only when needed
        if (currentStatus !== computedStatus) {
          trip.status = computedStatus;
          await TripModel.updateOne(
            { _id: trip._id },
            { $set: { status: computedStatus } },
          );
        } else {
          trip.status = computedStatus;
        }

        return trip;
      }),
    );

    return res.json(updatedTrips);
  } catch (error) {
    console.error("GetUserTrips Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
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

    const io = req.app.get("io");
    if (io) {
      io.to(trip.tripId).emit("TRIP_STATUS_UPDATED", savedTrip);
    }

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
// exports.trackLocation = async (req, res) => {
//   try {
//     const { tripId, lat, lng } = req.body;

//     if (!tripId || lat === undefined || lng === undefined) {
//       return res.status(400).json({ message: "Missing location data" });
//     }

//     const trip = await TripModel.findOne({
//       tripId,
//       userId: req.user._id,
//     });

//     if (!trip) {
//       return res.status(404).json({ message: "Trip not found" });
//     }

//     // 🚨 Emergency lock (read-only, no update here)
//     if (trip.status === "Emergency") {
//       return res.status(200).json({
//         message: "🚨 Emergency active. Tracking locked.",
//       });
//     }

//     // ❌ Cancelled check
//     if (trip.status === "Cancelled") {
//       return res.status(200).json({
//         message: "Trip cancelled. No tracking allowed.",
//       });
//     }

//     // 🛑 Stop if completed
//     if (trip.status === "Completed") {
//       return res.status(200).json({
//         message: "Trip completed. Tracking stopped.",
//       });
//     }

//     // 📍 LOCATION UPDATE ONLY
//     trip.liveLocation = { lat, lng };

//     if (!trip.locationHistory) {
//       trip.locationHistory = [];
//     }

//     trip.locationHistory.push({
//       lat,
//       lng,
//       timestamp: new Date(),
//     });

//     // await trip.save();

//     // 📡 SOCKET LIVE LOCATION ONLY
//     const io = req.app.get("io");
//     if (io) {
//       io.to(tripId).emit("LIVE_LOCATION_UPDATE", {
//         tripId,
//         lat,
//         lng,
//         timestamp: new Date(),
//       });
//     }

//     // ⚠ ALERTS
//     try {
//       await checkAlerts(trip);
//     } catch (err) {
//       console.error("Alert error:", err);
//     }

//     // 👤 CONTACTS
//     const travelerName = trip.traveler?.name || "Traveler";
//     const primaryEmail = trip.traveler?.email;
//     const contactDetails = trip.contactDetails || {};

//     const phoneNumbers = getEmergencyNumbers(contactDetails);
//     const emailAddresses = getEmergencyEmails(contactDetails);
//     const validEmails = emailAddresses.filter(Boolean);

//     // 📩 SHARE TRACKING LINK ONCE (based on existing status)
//     if (trip.status === "Active" && !trip.locationShared) {
//       const updated = await TripModel.findOneAndUpdate(
//         { _id: trip._id, locationShared: false },
//         { $set: { locationShared: true } },
//         { new: true },
//       );

//       if (updated) {
//         const trackingLink = `${serverUrl}/track/${trip.tripId}`;

//         await sendLocationSMS(
//           phoneNumbers,
//           travelerName,
//           trackingLink,
//           trip.tripId,
//         );

//         await Promise.all([
//           primaryEmail &&
//             sendLocationEmail(
//               primaryEmail,
//               travelerName,
//               trackingLink,
//               trip.tripId,
//             ),
//           ...validEmails.map((email) =>
//             sendLocationEmail(email, travelerName, trackingLink, trip.tripId),
//           ),
//         ]);
//       }
//     }

//     // 🌦 FIRE AND FORGET WEATHER
//     getWeatherData(lat, lng).catch(() => {});

//     return res.status(200).json({
//       message: "Location stored & broadcasted",
//     });
//   } catch (error) {
//     console.error("Track Location Error:", error);
//     res.status(500).json({ error: error.message });
//   }
// };
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

    // --- 🔄 REAL-TIME STATUS UPDATE ---
    // Calculate what the status SHOULD be based on the Indian Clock
    const oldStatus = trip.status;
    const computedStatus = updateTripStatus(trip);

    // Only update the DB if the status has actually changed
    // We skip this if the trip is in a "Locked" state like Emergency or Cancelled
    if (
      !["Emergency", "Cancelled"].includes(oldStatus) &&
      oldStatus !== computedStatus
    ) {
      trip.status = computedStatus;
      // Note: We'll save this later along with the location update

      // Notify the frontend that the status flipped (e.g., Pending -> Active)
      const io = req.app.get("io");
      if (io) {
        // io.to(tripId).emit("TRIP_STATUS_UPDATED", { tripId, status: computedStatus });
        io.to(tripId).emit("TRIP_STATUS_UPDATED", trip);
      }
    }

    // 🚨 Emergency lock
    if (trip.status === "Emergency") {
      return res
        .status(200)
        .json({ message: "🚨 Emergency active. Tracking locked." });
    }

    // ❌ Cancelled check
    if (trip.status === "Cancelled") {
      return res
        .status(200)
        .json({ message: "Trip cancelled. No tracking allowed." });
    }

    // 🛑 Stop if completed
    if (trip.status === "Completed") {
      // Save the final status if it just changed to Completed
      if (oldStatus !== "Completed") await trip.save();
      return res
        .status(200)
        .json({ message: "Trip completed. Tracking stopped." });
    }

    // 📍 LOCATION UPDATE
    trip.liveLocation = { lat, lng };

    if (!trip.locationHistory) {
      trip.locationHistory = [];
    }

    trip.locationHistory.push({
      lat,
      lng,
      timestamp: new Date(),
    });

    // ✅ CRITICAL: Save the status and location changes to DB
    await trip.save();

    // 📡 SOCKET LIVE LOCATION
    const io = req.app.get("io");
    if (io) {
      io.to(tripId).emit("LIVE_LOCATION_UPDATE", {
        tripId,
        lat,
        lng,
        timestamp: new Date(),
      });
    }

    // ⚠ ALERTS (Pass the updated trip object)
    try {
      await checkAlerts(trip);
    } catch (err) {
      console.error("Alert error:", err);
    }

    // 👤 CONTACTS & SHARING
    const travelerName = trip.traveler?.name || "Traveler";
    const primaryEmail = trip.traveler?.email;
    const contactDetails = trip.contactDetails || {};

    const phoneNumbers = getEmergencyNumbers(contactDetails);
    const emailAddresses = getEmergencyEmails(contactDetails);
    const validEmails = emailAddresses.filter(Boolean);

    // 📩 SHARE TRACKING LINK
    // Now this works even if the trip was "Pending" a second ago!
    if (trip.status === "Active" && !trip.locationShared) {
      const updated = await TripModel.findOneAndUpdate(
        { _id: trip._id, locationShared: false },
        { $set: { locationShared: true } },
        { new: true },
      );

      if (updated) {
        const trackingLink = `${serverUrl}/track/${trip.tripId}`;
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

    getWeatherData(lat, lng).catch(() => {});

    return res.status(200).json({
      message: "Location stored & status updated",
      currentStatus: trip.status,
    });
  } catch (error) {
    console.error("Track Location Error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getActiveTrip = async (req, res) => {
  try {
    // 1. Fetch all trips that aren't finalized
    const trips = await TripModel.find({
      userId: req.user._id,
      status: { $nin: ["Cancelled", "Completed"] },
    });

    let activeTrip = null;

    for (let trip of trips) {
      // 🚨 Emergency trip is priority 1: always return immediately
      if (trip.status === "Emergency") {
        activeTrip = trip;
        break;
      }

      // 🔄 RECALCULATE STATUS (The "On-Demand" Fix)
      // Check if current time in IST means this trip should change state
      const oldStatus = trip.status;
      const computedStatus = updateTripStatus(trip);

      if (oldStatus !== computedStatus) {
        trip.status = computedStatus;
        // Update the database so other controllers see the new status
        const result = await TripModel.updateOne(
          { _id: trip._id },
          { $set: { status: computedStatus } },
        );

        console.log("🧠 UPDATE RESULT:", result);
        // Optional: Emit socket if status changed to keep UI in sync
        const io = req.app.get("io");
        if (io) {
          io.to(trip.tripId).emit("TRIP_STATUS_UPDATED", trip);
        }
      }

      // 🎯 Pick the first trip that is now officially "Active"
      if (trip.status === "Active") {
        activeTrip = trip;
        break;
      }
    }

    if (!activeTrip) {
      return res.status(200).json({
        message: "No active trip",
        trip: null,
      });
    }

    // 2. Return the active/emergency trip details
    return res.json({
      tripId: activeTrip.tripId,
      from: {
        lat: activeTrip.liveLocation?.lat || activeTrip.from?.lat,
        lng: activeTrip.liveLocation?.lng || activeTrip.from?.lng,
        name: activeTrip.from?.name || "Start Location",
      },
      to: {
        lat: activeTrip.to?.lat,
        lng: activeTrip.to?.lng,
        name: activeTrip.to?.name || "Destination",
      },
      liveLocation: activeTrip.liveLocation || null,
      status: activeTrip.status,
      sosPlaces: activeTrip.sosPlaces || [],
      sosLocation: activeTrip.sosLocation || null,
    });
  } catch (err) {
    console.error("getActiveTrip Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getTripById = async (req, res) => {
  try {
    const trip = await TripModel.findOne({ tripId: req.params.tripId });

    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // 🔄 RECALCULATE STATUS ON-DEMAND
    // This ensures emergency contacts see the real-time status (Active/Completed)
    // even if the traveler hasn't opened their app lately.
    const oldStatus = trip.status;
    const computedStatus = updateTripStatus(trip);

    if (
      !["Emergency", "Cancelled"].includes(oldStatus) &&
      oldStatus !== computedStatus
    ) {
      trip.status = computedStatus;

      // Persist the change so the database stays accurate
      // await TripModel.updateOne(
      //   { _id: trip._id },
      //   { $set: { status: computedStatus } }
      // );

      const result = await TripModel.updateOne(
        { _id: trip._id },
        { $set: { status: computedStatus } },
      );

      console.log("🧠 UPDATE RESULT:", result);

      // Notify any active listeners (like the traveler or other contacts) via Socket
      const io = req.app.get("io");
      if (io) {
        io.to(trip.tripId).emit("TRIP_STATUS_UPDATED", trip);
      }
    }

    // Return the response with the most up-to-date status
    return res.json({
      start: {
        lat: trip.liveLocation?.lat || trip.from?.lat,
        lng: trip.liveLocation?.lng || trip.from?.lng,
        name: trip.from?.name || "Start Location",
      },
      end: {
        lat: trip.to?.lat,
        lng: trip.to?.lng,
        name: trip.to?.name || "Destination",
      },
      history: trip.locationHistory || [],
      status: trip.status,
      // Useful for tracking views:
      liveLocation: trip.liveLocation || null,
      lastUpdated: new Date(),
    });
  } catch (err) {
    console.error("getTripById Error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// exports.getTripById = async (req, res) => {
//   try {
//     const trip = await TripModel.findOne({ tripId: req.params.tripId });

//     if (!trip) {
//       return res.status(404).json({ error: "Trip not found" });
//     }

//     let currentStatus = trip.status;

//     // 🚨 SOS override (highest priority)
//     if (trip.sosTriggered) {
//       currentStatus = "Emergency";

//       if (trip.status !== "Emergency") {
//         await TripModel.updateOne(
//           { _id: trip._id },
//           { $set: { status: "Emergency" } }
//         );

//         // Emit status update
//         const io = req.app.get("io");
//         if (io) {
//           io.to(trip.tripId).emit("TRIP_STATUS_UPDATED", {
//             ...trip.toObject(),
//             status: "Emergency",
//           });
//         }
//       }
//     }

//     // 🔄 Normal status update
//     else if (!["Cancelled", "Emergency", "Completed"].includes(trip.status)) {
//       const newStatus = updateTripStatus(trip);

//       if (trip.status !== newStatus) {
//         currentStatus = newStatus;

//         await TripModel.updateOne(
//           { _id: trip._id },
//           { $set: { status: newStatus } }
//         );

//         // Emit status update
//         const io = req.app.get("io");
//         if (io) {
//           io.to(trip.tripId).emit("TRIP_STATUS_UPDATED", {
//             ...trip.toObject(),
//             status: newStatus,
//           });
//         }
//       }
//     }

//     return res.status(200).json({
//       start: {
//         lat: trip.liveLocation?.lat || trip.from?.lat,
//         lng: trip.liveLocation?.lng || trip.from?.lng,
//         name: trip.from?.name || "Start Location",
//       },
//       end: {
//         lat: trip.to?.lat,
//         lng: trip.to?.lng,
//         name: trip.to?.name || "Destination",
//       },
//       history: trip.locationHistory || [],
//       status: currentStatus,
//     });
//   } catch (error) {
//     return res.status(400).json({ error: error.message });
//   }
// };

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

      io.to(tripId).emit("TRIP_STATUS_UPDATED", updatedTrip);
    }

    const contactDetails = updatedTrip.contactDetails || {};
    const phoneNumbers = getEmergencyNumbers(contactDetails);
    const emailAddresses = getEmergencyEmails(contactDetails);
    const primaryEmail = updatedTrip.traveler?.email;

    // console.log("📞 Emergency numbers:", phoneNumbers);
    // console.log("📧 Emergency emails:", emailAddresses);

    await sendEmergencySMS(phoneNumbers, latitude, longitude, formattedPlaces);

    await Promise.all([
      sendEmergencyEmail(primaryEmail, latitude, longitude, formattedPlaces),
      ...emailAddresses.map((email) =>
        sendEmergencyEmail(email, latitude, longitude, formattedPlaces),
      ),
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

      // trip.lastTrafficAlert = trafficStatus;
      // await trip.save();
      await TripModel.updateOne(
        { _id: trip._id },
        { $set: { lastTrafficAlert: trafficStatus } },
      );
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

// exports.touristPlaces = async (req, res) => {
//   try {
//     const { lat, lng, tripId, type } = req.query;

//     if (!lat || !lng || !tripId || !type) {
//       return res.status(400).json({
//         message: "lat, lng, tripId & type required",
//       });
//     }

//     const numLat = Number(lat);
//     const numLng = Number(lng);
//     const userId = req.user._id;

//     let existingDoc = await TouristPlacesModel.findOne({
//       userId,
//       tripId,
//     });

//     // ✅ Return from DB if exists
//     if (existingDoc) {
//       const filtered = existingDoc.touristPlaces.filter((p) => p.type === type);

//       if (filtered.length > 0) {
//         return res.json({
//           message: "Fetched from DB",
//           places: filtered,
//         });
//       }
//     }

//     // ✅ Fetch from API
//     const places = await getTouristPlaces(numLat, numLng, type);
//     const newPlaces = places.filter(
//       (p) =>
//         !existingDoc.touristPlaces.some(
//           (ep) => ep.name === p.name && ep.type === type,
//         ),
//     );

//     let updatedDoc;

//     if (existingDoc) {
//       // existingDoc.touristPlaces.push(
//       //   ...places.map((p) => ({
//       //     name: p.name,
//       //     lat: p.lat,
//       //     lng: p.lng,
//       //     type,
//       //     distance: Number(p.distance),
//       //     sourceLat: numLat,
//       //     sourceLng: numLng,
//       //   }))
//       // );
//       existingDoc.touristPlaces.push(
//         ...newPlaces.map((p) => ({
//           name: p.name,
//           lat: p.lat,
//           lng: p.lng,
//           type,
//           distance: Number(p.distance),
//           sourceLat: numLat,
//           sourceLng: numLng,
//         })),
//       );

//       updatedDoc = await existingDoc.save();
//     } else {
//       updatedDoc = await TouristPlacesModel.create({
//         userId,
//         tripId,
//         touristPlaces: places.map((p) => ({
//           name: p.name,
//           lat: p.lat,
//           lng: p.lng,
//           type,
//           distance: Number(p.distance),
//           sourceLat: numLat,
//           sourceLng: numLng,
//         })),
//       });
//     }

//     const filtered = updatedDoc.touristPlaces.filter((p) => p.type === type);

//     res.json({
//       message: "Fetched & saved",
//       places: filtered,
//     });
//   } catch (error) {
//     console.error("Tourist Places Error:", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

exports.touristPlaces = async (req, res) => {
  try {
    const { lat, lng, tripId, type } = req.query;

    if (!lat || !lng || !tripId || !type) {
      return res.status(400).json({
        message: "lat, lng, tripId & type required",
      });
    }

    const numLat = Number(lat);
    const numLng = Number(lng);
    const userId = req.user._id;

    let existingDoc = await TouristPlacesModel.findOne({
      userId,
      tripId,
    });

    // ✅ If already exists → return filtered
    if (existingDoc) {
      const filtered = existingDoc.touristPlaces.filter((p) => p.type === type);

      if (filtered.length > 0) {
        return res.json({
          message: "Fetched from DB",
          places: filtered,
        });
      }
    }

    // ✅ Fetch from API
    const places = await getTouristPlaces(numLat, numLng, type);

    if (!places || places.length === 0) {
      return res.json({ message: "No places found" });
    }

    let updatedDoc;

    if (existingDoc) {
      // ✅ REMOVE DUPLICATES SAFELY
      const newPlaces = places.filter(
        (p) =>
          !existingDoc.touristPlaces.some(
            (ep) => ep.name === p.name && ep.type === type,
          ),
      );

      existingDoc.touristPlaces.push(
        ...newPlaces.map((p) => ({
          name: p.name,
          lat: p.lat,
          lng: p.lng,
          type,
          distance: Number(p.distance),
          sourceLat: numLat,
          sourceLng: numLng,
        })),
      );

      updatedDoc = await existingDoc.save();
    } else {
      // ✅ CREATE NEW DOC
      updatedDoc = await TouristPlacesModel.create({
        userId,
        tripId,
        touristPlaces: places.map((p) => ({
          name: p.name,
          lat: p.lat,
          lng: p.lng,
          type,
          distance: Number(p.distance),
          sourceLat: numLat,
          sourceLng: numLng,
        })),
      });
    }

    const filtered = updatedDoc.touristPlaces.filter((p) => p.type === type);

    res.json({
      message: "Fetched & saved",
      places: filtered,
    });
  } catch (error) {
    console.error("Tourist Places Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.sendPreferredPlaces = async (req, res) => {
  try {
    const { lat, lng, type, tripId } = req.body;

    if (!lat || !lng || !type || !tripId) {
      return res.status(400).json({ message: "Missing data" });
    }

    const trip = await TripModel.findOne({ tripId });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const email = trip.traveler?.email;

    // ✅ FIXED HERE
    const places = await getTouristPlaces(lat, lng, type);

    if (!places || places.length === 0) {
      return res.json({ message: "No places found" });
    }

    await sendPlacesEmail(email, places, lat, lng);

    res.json({
      message: `✅ ${type} places sent to email`,
      count: places.length,
    });
  } catch (error) {
    console.error("Send Preferred Places Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
