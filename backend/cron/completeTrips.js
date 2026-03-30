const cron = require("node-cron");
const mongoose = require("mongoose");
const TripModel = require("../model/TripModel");
const { combineDateAndTime } = require("../controllers/tripController");

cron.schedule("*/5 * * * *", async () => {
  try {
    const trips = await TripModel.find({ status: "Active" });

    let count = 0;

    for (let trip of trips) {
      const end = combineDateAndTime(trip.endDate, trip.endTime);

      if (end && new Date() > end) {
        trip.status = "Completed";
        await trip.save();
        count++;
      }
    }

    if (count > 0) {
      console.log(`${count} trips marked as Completed`);
    }

  } catch (err) {
    console.error("Trip completion error:", err.message);
  }
});

// Runs every 5 minutes
// cron.schedule("*/5 * * * *", async () => {
//   try {
//     const now = new Date();

//     const result = await TripModel.updateMany(
//       {
//         endDate: { $lte: now },
//         status: "Active",
//       },
//       {
//         $set: { status: "Completed" },
//       }
//     );

//     // if (result.modifiedCount > 0) {
//     //   console.log(`${result.modifiedCount} trips marked as Completed`);
//     // }

//   } catch (err) {
//     console.error("Trip completion error:", err.message);
//   }
// });



