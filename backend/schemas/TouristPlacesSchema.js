// models/TouristPlace.js
const mongoose = require("mongoose");

const touristPlaceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", index: true },

  sharedPlaces: { type: Boolean, default: false },

  touristPlaces: [
    {
      name: String,
      lat: Number,
      lng: Number,
      type: String,
      distance: Number,
      sourceLat: Number,
      sourceLng: Number,
    },
  ],
  // touristPlaces : {
  //   touristPlace: [ {
  //     name: String,
  //     lat: Number,
  //     lng: Number,
  //     type: String,
  //     distance: Number,
  //     sourceLat: Number,
  //     sourceLng: Number,
  //   }, ],
  //   temple: [ {
  //     name: String,
  //     lat: Number,
  //     lng: Number,
  //     type: String,
  //     distance: Number,
  //     sourceLat: Number,
  //     sourceLng: Number,
  //   }, ],
  //   museum: [ {
  //     name: String,
  //     lat: Number,
  //     lng: Number,
  //     type: String,
  //     distance: Number,
  //     sourceLat: Number,
  //     sourceLng: Number,
  //   }, ],
  //   park: [ {
  //     name: String,
  //     lat: Number,
  //     lng: Number,
  //     type: String,
  //     distance: Number,
  //     sourceLat: Number,
  //     sourceLng: Number,
  //   }, ],
  //   hotel: [ {
  //     name: String,
  //     lat: Number,
  //     lng: Number,
  //     type: String,
  //     distance: Number,
  //     sourceLat: Number,
  //     sourceLng: Number,
  //   }, ],
  // restaurant: [ {
  //     name: String,
  //     lat: Number,
  //     lng: Number,
  //     type: String,
  //     distance: Number,
  //     sourceLat: Number,
  //     sourceLng: Number,
  //   }, ],
  // },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = { touristPlaceSchema };