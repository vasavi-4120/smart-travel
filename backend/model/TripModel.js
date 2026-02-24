const { model } = require("mongoose");

const { TripSchema } = require("../schemas/TripSchema");

const TripModel = model("trip", TripSchema);

module.exports =  TripModel ;
