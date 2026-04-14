const { model } = require("mongoose");

const { touristPlaceSchema } = require("../schemas/TouristPlacesSchema");

const TouristPlacesModel = model("touristPlace", touristPlaceSchema);

module.exports =  TouristPlacesModel ;
