const express = require("express");
const router = express.Router();
const { registerTrip,getUserTrips,getTripById,trackLocation,cancelTrip,geocodeLocation } = require("../controllers/tripController");
const { userVerification } = require("../middlewares/AuthMiddleware");

// POST /api/trips/register
router.put("/cancel-trip/:tripId",userVerification, cancelTrip);
router.post("/register",userVerification, registerTrip);
router.post("/trackLocation",userVerification, trackLocation);
router.get("/myTrip", userVerification, getUserTrips);
router.get("/geocode", userVerification, geocodeLocation);
router.get("/:id",userVerification, getTripById);

module.exports = router;