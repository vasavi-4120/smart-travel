const express = require("express");
const router = express.Router();
const {
  registerTrip,
  getUserTrips,
  getTripById,
  trackLocation,
  cancelTrip,
  geocodeLocation,
  updateLocation,
  getActiveTrip,
  triggerEmergency,
} = require("../controllers/tripController");
const { userVerification } = require("../middlewares/AuthMiddleware");

// POST /api/trips/register
router.put("/cancel-trip/:tripId", userVerification, cancelTrip);
router.put("/trigger-emergency/:tripId", userVerification, triggerEmergency);
router.post("/register", userVerification, registerTrip);
router.post("/trackLocation", userVerification, trackLocation);
router.get("/myTrip", userVerification, getUserTrips);
router.get("/geocode", userVerification, geocodeLocation);
router.get("/active", userVerification, getActiveTrip);
router.get("/:tripId", userVerification, getTripById);
router.post("/location", userVerification, updateLocation);

module.exports = router;
