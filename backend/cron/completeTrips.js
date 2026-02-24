const cron = require("node-cron");
const mongoose = require("mongoose");
const TripModel = require("../model/TripModel");

// Runs every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  try {
    const now = new Date();

    const result = await TripModel.updateMany(
      {
        endDate: { $lte: now },
        status: "Active",
      },
      {
        $set: { status: "Completed" },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`${result.modifiedCount} trips marked as Completed`);
    }

  } catch (err) {
    console.error("Trip completion error:", err.message);
  }
});



