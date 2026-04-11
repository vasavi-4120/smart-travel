const cron = require("node-cron");

const mongoose = require("mongoose");

const TripModel = require("../model/TripModel");

const { combineDateAndTime } = require("../controllers/tripController");

cron.schedule("*/15 * * * *", async () => {
  try {
    if (mongoose.connection.readyState !== 1) return;

    const now = new Date();
    console.log(`⏱️ Cron Triggered: ${now.toISOString()}`);

    const result = await TripModel.updateMany(
      {
        // 1. FILTER: Only look for trips that COULD transition
        status: { $in: ["Pending", "Active"] },
        sosTriggered: false, // Double-check: SOS must be false
        cancelledAt: { $exists: false }
      },
      [
        {
          $set: {
            computedStart: {
              $dateFromString: {
                dateString: {
                  $concat: [
                    { $dateToString: { format: "%Y-%m-%d", date: "$startDate" } },
                    "T", "$startTime", ":00Z"
                  ]
                }
              }
            },
            computedEnd: {
              $dateFromString: {
                dateString: {
                  $concat: [
                    { $dateToString: { format: "%Y-%m-%d", date: "$endDate" } },
                    "T", "$endTime", ":00Z"
                  ]
                }
              }
            }
          }
        },
        {
          $set: {
            status: {
              $switch: {
                branches: [
                  // 🚨 EMERGENCY PROTECTION: If SOS was triggered during this 
                  // calculation, keep it as "Emergency" (or current status)
                  { 
                    case: { $eq: ["$sosTriggered", true] }, 
                    then: "$status" 
                  },
                  // 🟢 Active -> Completed
                  { 
                    case: { 
                      $and: [
                        { $eq: ["$status", "Active"] }, 
                        { $gte: [now, "$computedEnd"] }
                      ] 
                    }, 
                    then: "Completed" 
                  },
                  // 🟡 Pending -> Active
                  { 
                    case: { 
                      $and: [
                        { $eq: ["$status", "Pending"] }, 
                        { $gte: [now, "$computedStart"] }
                      ] 
                    }, 
                    then: "Active" 
                  }
                ],
                default: "$status"
              }
            }
          }
        },
        { $unset: ["computedStart", "computedEnd"] }
      ],
      {} 
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Cron Success: ${result.modifiedCount} statuses transitioned.`);
    }
  } catch (err) {
    console.error("❌ Cron Execution Error:", err.message);
  }
});
// cron.schedule("*/15 * * * *", async () => {
//   try {
//     if (mongoose.connection.readyState !== 1) return;
//     const now = new Date();

//     const result = await TripModel.updateMany(
//       {
//         // 🛡️ SECURITY FILTER: Only touch trips that aren't locked
//         status: { $in: ["Pending", "Active"] },
//         sosTriggered: { $ne: true },
//         cancelledAt: { $exists: false }
//       },
//       [
//         {
//           $set: {
//             // 1. Calculate Start and End ISO strings
//             computedStart: {
//               $dateFromString: {
//                 dateString: {
//                   $concat: [
//                     { $dateToString: { format: "%Y-%m-%d", date: "$startDate" } },
//                     "T", "$startTime", ":00Z"
//                   ]
//                 }
//               }
//             },
//             computedEnd: {
//               $dateFromString: {
//                 dateString: {
//                   $concat: [
//                     { $dateToString: { format: "%Y-%m-%d", date: "$endDate" } },
//                     "T", "$endTime", ":00Z"
//                   ]
//                 }
//               }
//             }
//           }
//         },
//         {
//           $set: {
//             status: {
//               $switch: {
//                 branches: [
//                   // 🟢 If Active and time is up -> Completed
//                   { 
//                     case: { 
//                       $and: [
//                         { $eq: ["$status", "Active"] }, 
//                         { $gte: [now, "$computedEnd"] }
//                       ] 
//                     }, 
//                     then: "Completed" 
//                   },
//                   // 🟡 If Pending and time to start -> Active
//                   { 
//                     case: { 
//                       $and: [
//                         { $eq: ["$status", "Pending"] }, 
//                         { $gte: [now, "$computedStart"] }
//                       ] 
//                     }, 
//                     then: "Active" 
//                   }
//                 ],
//                 default: "$status" // Keep current status if no conditions met
//               }
//             }
//           }
//         },
//         {
//           // 🧹 Cleanup: Remove the temporary calculation fields from the document
//           $unset: ["computedStart", "computedEnd"]
//         }
//       ]
//     );

//     console.log(`⏱️ Cron Job: Processed ${result.matchedCount} trips. Updated ${result.modifiedCount}.`);
//   } catch (err) {
//     console.error("❌ Cron Status Error:", err.message);
//   }
// });