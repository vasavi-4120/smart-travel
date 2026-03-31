const cron = require("node-cron");
const mongoose = require("mongoose");
const TripModel = require("../model/TripModel");
const { combineDateAndTime } = require("../controllers/tripController");

// cron.schedule("*/5 * * * *", async () => {
//   try {
//     const trips = await TripModel.find({ status: "Active" });

//     let count = 0;

//     for (let trip of trips) {
//       const end = combineDateAndTime(trip.endDate, trip.endTime);

//       if (end && new Date() > end) {
//         trip.status = "Completed";
//         await trip.save();
//         count++;
//       }
//     }

//     if (count > 0) {
//       console.log(`${count} trips marked as Completed`);
//     }

//   } catch (err) {
//     console.error("Trip completion error:", err.message);
//   }
// });

cron.schedule("*/5 * * * *", async () => {
  try {
    if (mongoose.connection.readyState !== 1) return;

    const trips = await TripModel.find({ status: "Active" });

    const bulkOps = [];

    for (let trip of trips) {
      const end = combineDateAndTime(trip.endDate, trip.endTime);

      if (end && new Date() > end) {
        bulkOps.push({
          updateOne: {
            filter: { _id: trip._id },
            update: { status: "Completed" },
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      await TripModel.bulkWrite(bulkOps);
      console.log(`${bulkOps.length} trips marked as Completed`);
    }

  } catch (err) {
    console.error("Trip completion error:", err.message);
  }
});



