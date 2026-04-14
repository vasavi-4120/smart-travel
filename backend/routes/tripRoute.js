const express = require("express");
const router = express.Router();

const {
  registerTrip,
  getUserTrips,
  getTripById,
  trackLocation,
  cancelTrip,
  deleteTrip,
  geocodeLocation,
  updateLocation,
  getActiveTrip,
  triggerEmergency,
  EmergencyMap,
  checkTrafficAndSendAlert,
  touristPlaces,
  sendPreferredPlaces
} = require("../controllers/tripController");

const { userVerification } = require("../middlewares/AuthMiddleware");
const  requireAuth  = require("../middlewares/requireAuth");

// ===============================
// ✅ ACTION ROUTES
// ===============================
router.post("/register", userVerification, registerTrip);
router.post("/trackLocation", userVerification, trackLocation);
router.post("/location", userVerification, updateLocation);
router.post("/alert", userVerification, checkTrafficAndSendAlert);
router.post("/send-preferred-places", userVerification, sendPreferredPlaces);

// ===============================
// ✅ UPDATE ROUTES
// ===============================
router.put("/cancel-trip/:tripId", userVerification, cancelTrip);
router.delete("/delete-trip/:tripId", userVerification, deleteTrip);
router.put("/trigger-emergency/:tripId", userVerification, triggerEmergency);

// ===============================
// ✅ FETCH ROUTES
// ===============================
router.get("/myTrip", userVerification,requireAuth, getUserTrips);
router.get("/active", userVerification,requireAuth, getActiveTrip);
router.get("/geocode", userVerification, geocodeLocation);
router.get("/places", userVerification, touristPlaces);

// 🔴 ALWAYS KEEP LAST
router.get("/:tripId", userVerification, getTripById);
router.get("/sos/:tripId", userVerification, EmergencyMap);

module.exports = router;