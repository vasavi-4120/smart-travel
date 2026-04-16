const cron = require("node-cron");
const mongoose = require("mongoose");
const TripModel = require("../model/TripModel");
const {
  updateTripStatus,
  combineDateAndTime,
} = require("../controllers/tripController");

module.exports = (io) => {
  console.log("⏰ completeTrips cron initialized");

  cron.schedule("*/1 * * * *", async () => {
    try {
      if (mongoose.connection.readyState !== 1) {
        console.log("completeTrips cron skipped because MongoDB is not ready", mongoose.connection.readyState);
        return;
      }

      console.log("completeTrips cron running", new Date().toISOString());

      const trips = await TripModel.find({
        status: { $nin: ["Cancelled", "Completed", "Emergency"] },
      });

      let modified = 0;

      for (const trip of trips) {
        const start = combineDateAndTime(trip.startDate, trip.startTime);
        const end = combineDateAndTime(trip.endDate, trip.endTime);

        const newStatus = updateTripStatus(trip); // ✅ FIXED

        console.log(`🔄 Trip ${trip.tripId}: current=${trip.status}, computed=${newStatus}, start=${start}, end=${end}, now=${new Date().toISOString()}`);

        if (!newStatus) {
          console.log(`⚠️ Skipping trip ${trip.tripId}: no newStatus`);
          continue; // safety
        }

        if (trip.status !== newStatus) {
          console.log(`📝 Updating trip ${trip.tripId} from ${trip.status} to ${newStatus}`);
          await TripModel.updateOne(
            { _id: trip._id },
            { $set: { status: newStatus } }
          );

          modified++;

          if (io) {
            io.emit("TRIP_STATUS_UPDATED", {
              tripId: trip.tripId,
              status: newStatus,
            });
            console.log(`📡 Emitted status update for trip ${trip.tripId}`);
          }
        } else {
          console.log(`✅ No change needed for trip ${trip.tripId}`);
        }
      }

      if (modified > 0) {
        console.log(`✅ Cron updated ${modified} trips`);
      }
    } catch (err) {
      console.error("❌ Cron error:", err);
    }
  });
};
