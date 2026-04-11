const TripModel = require("../model/TripModel");

exports.triggerEmergencySocket = async ({ tripId, latitude, longitude }, io) => {
  try {
    const trip = await TripModel.findOne({ tripId });

    if (!trip) return;

    // Update DB
    trip.status = "Emergency";
    trip.sosTriggered = true;
    trip.sosLocation = { lat: latitude, lon: longitude };
    trip.emergencyTriggeredAt = new Date();
    await trip.save();

    // Emit to all clients connected
    io.emit("SOS_TRIGGERED", {
      tripId: trip.tripId,
      traveler: trip.traveler,
      location: trip.sosLocation,
      timestamp: trip.emergencyTriggeredAt,
    });

    console.log(`🚨 SOS triggered for trip ${trip.tripId}`);
  } catch (err) {
    console.error("Socket SOS error:", err);
  }
};