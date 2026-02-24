const TripModel = require("../model/TripModel.js");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

exports.registerTrip = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const {
      traveler,
      contactDetails,
      proof,
      from,
      to,
      meansofTransport,
      startDate,
      endDate,
      startTime,
      endTime,
      peopleTravel,
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
      meansofTransport,
      startDate,
      endDate,
      startTime,
      endTime,
      peopleTravel,

      status: "Active",
    });

    await newTrip.save();

    res.status(201).json({
      message: "Trip registered successfully",
      trip: newTrip,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

// function combineDateAndTime(date, time) {
//   if (!date || !time) return null;

//   return new Date(`${date.toISOString().split("T")[0]}T${time}:00+05:30`);
// }

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

function calculateStatus(start, end) {
  const now = new Date();

  if (now < start) return "Pending";
  if (now >= start && now <= end) return "Active";
  return "Completed";
}

exports.getUserTrips = async (req, res) => {
  try {
    const trips = await TripModel.find({ userId: req.user._id });

    const updatedTrips = await Promise.all(
      trips.map(async (trip) => {
        // 🛑 If already cancelled, don't touch it
        if (trip.status === "Cancelled") {
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

// exports.cancelTrip = async (req, res) => {
//   try {
//     const { tripId } = req.params;
//     const { reason } = req.body;

//     const trip = await TripModel.findOne({
//       tripId,
//       userId: req.user._id,
//     });

//     if (!trip) {
//       return res.status(404).json({ message: "Trip not found" });
//     }

//     if (trip.status === "Cancelled") {
//       await trip.save();
//       return res.status(400).json({ message: "Trip already cancelled" });
//     }

//     console.log("REQ USER:", req.user);
//     console.log("PARAM ID:", tripId);

//     trip.status = "Cancelled";
//     trip.cancelledAt = new Date();
//     trip.cancelReason = reason;

//     await trip.save();

//     console.log("Trip saved with status:", trip.status);

//     res.status(200).json({
//       message: "Trip cancelled successfully",
//       trip,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: error.message });
//   }
// };

exports.cancelTrip = async (req, res) => {
  try {
    const { tripId } = req.params; // or req.params.id depending on your route
    const { reason } = req.body;

    console.log('=== CANCEL TRIP DEBUG ===');
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    console.log('TripId:', tripId);
    console.log('Reason:', reason);
    console.log('User:', req.user?._id);
    console.log('========================');

    // Validate inputs
    if (!tripId) {
      return res.status(400).json({ 
        message: "Trip ID is required" 
      });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        message: "User not authenticated" 
      });
    }

    // Find the trip
    const trip = await TripModel.findOne({
      tripId: tripId,
      userId: req.user._id,
    });

    console.log('Found trip:', trip ? 'Yes' : 'No');
    
    if (!trip) {
      return res.status(404).json({ 
        message: "Trip not found" 
      });
    }

    console.log('Current trip status:', trip.status);

    // Check if already cancelled
    if (trip.status === "Cancelled") {
      return res.status(400).json({ 
        message: "Trip already cancelled",
        trip: trip 
      });
    }

    // Update the trip
    trip.status = "Cancelled";
    trip.cancelledAt = new Date();
    trip.cancelReason = reason || 'No reason provided';

    // Save with validation disabled temporarily for testing
    const savedTrip = await trip.save({ validateBeforeSave: false });
    
    console.log('Save result:', {
      status: savedTrip.status,
      cancelledAt: savedTrip.cancelledAt,
      cancelReason: savedTrip.cancelReason
    });

    res.status(200).json({
      message: "Trip cancelled successfully",
      trip: savedTrip
    });

  } catch (error) {
    console.error('Cancel trip error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({ 
      message: "Failed to cancel trip", 
      error: error.message 
    });
  }
};

// exports.cancelTrip = async (req, res) => {
//   try {
//     const { tripId } = req.params;
//     const { reason } = req.body;

//     console.log('Cancelling trip:', tripId);
//     console.log('User:', req.user._id);
//     console.log('Reason:', reason);

//     const trip = await TripModel.findOne({
//       tripId: tripId,
//       userId: req.user._id,
//     });

//     if (!trip) {
//       return res.status(404).json({ message: "Trip not found" });
//     }

//     // Check if already cancelled
//     if (trip.status === "Cancelled") {
//       return res.status(400).json({ 
//         message: "Trip already cancelled",
//         trip: trip 
//       });
//     }

//     // Check if trip can be cancelled (optional)
//     const startDateTime = combineDateAndTime(trip.startDate, trip.startTime);
//     const now = new Date();
    
//     if (now > startDateTime) {
//       return res.status(400).json({ 
//         message: "Cannot cancel trip that has already started" 
//       });
//     }

//     // Update the trip
//     trip.status = "Cancelled";
//     trip.cancelledAt = new Date();
//     trip.cancelReason = reason || 'No reason provided';

//     // Save the trip
//     const savedTrip = await trip.save();
    
//     console.log('Trip cancelled successfully:', {
//       tripId: savedTrip.tripId,
//       status: savedTrip.status,
//       cancelledAt: savedTrip.cancelledAt,
//       cancelReason: savedTrip.cancelReason
//     });

//     res.status(200).json({
//       message: "Trip cancelled successfully",
//       trip: {
//         tripId: savedTrip.tripId,
//         status: savedTrip.status,
//         cancelledAt: savedTrip.cancelledAt,
//         cancelReason: savedTrip.cancelReason,
//         from: savedTrip.from,
//         to: savedTrip.to,
//         startDate: savedTrip.startDate,
//         startTime: savedTrip.startTime
//       }
//     });

//   } catch (error) {
//     console.error('Cancel trip error:', error);
//     res.status(500).json({ 
//       message: "Failed to cancel trip", 
//       error: error.message 
//     });
//   }
// };

// exports.trackLocation = async (req, res) => {
//   try {
//     const { tripId, lat, lng } = req.body;

//     const trip = await TripModel.findOne({
//       tripId,
//       userId: req.user._id,
//     });

//     if (!trip) {
//       return res.status(404).json({ message: "Trip not found" });
//     }

//     // 🛑 STOP if cancelled
//     if (trip.status === "Cancelled") {
//       return res.status(400).json({
//         message: "Trip cancelled. Tracking stopped.",
//       });
//     }

//     const start = combineDateAndTime(trip.startDate, trip.startTime);
//     const end = combineDateAndTime(trip.endDate, trip.endTime);

//     const realTimeStatus =
//       start && end ? calculateStatus(start, end) : trip.status;

//     if (realTimeStatus === "Completed") {
//       trip.status = "Completed";
//       await trip.save();
//       return res.status(400).json({
//         message: "Trip completed. Tracking stopped.",
//       });
//     }

//     trip.liveLocation = { lat, lng };
//     trip.locationHistory.push({
//       lat,
//       lng,
//       timestamp: new Date(),
//     });

//     trip.status = realTimeStatus;

//     await trip.save();

//     res.status(200).json({ message: "Location stored" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

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

    // 🛑 HARD STOP if Cancelled
    if (trip.status === "Cancelled") {
      return res.status(200).json({
        message: "Trip already cancelled. No tracking allowed.",
      });
    }

    const start = combineDateAndTime(trip.startDate, trip.startTime);
    const end = combineDateAndTime(trip.endDate, trip.endTime);

    const realTimeStatus =
      start && end ? calculateStatus(start, end) : trip.status;

    // ✅ Only change to Completed
    if (realTimeStatus === "Completed") {
      trip.status = "Completed";
      await trip.save();
      return res.status(400).json({
        message: "Trip completed. Tracking stopped.",
      });
    }

    // ❌ REMOVE THIS LINE:
    // trip.status = realTimeStatus;

    trip.liveLocation = { lat, lng };
    trip.locationHistory.push({
      lat,
      lng,
      timestamp: new Date(),
    });

    await trip.save();

    res.status(200).json({ message: "Location stored" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTripById = async (req, res) => {
  try {
    const trip = await TripModel.findOne({ tripId: req.params.id });
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }
    res.status(200).json(trip);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const cache = {};

exports.geocodeLocation = async (req, res) => {
  try {
    const { place } = req.query;

    if (cache[place]) {
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

    res.json({
      lat: response.data[0].lat,
      lng: response.data[0].lon,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
