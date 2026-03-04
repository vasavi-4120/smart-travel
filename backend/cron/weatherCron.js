const cron = require("node-cron");
const { getWeatherData } = require("./util/weatherService");
const sendEmail = require("./util/sendEmail");
const TripModel = require("../model/TripModel");
const UserModel = require("../model/UserModel");

cron.schedule("0 8 * * *", async () => {
  console.log("Running daily weather check...");

  const trips = await TripModel.find({ status: "Active" });

  for (let trip of trips) {
    const weatherData = await getWeatherData(trip.lat, trip.lon);
    const alertMessage = checkWeatherAlert(weatherData);

    if (alertMessage) {
      const user = await UserModel.findById(trip.userId);

      await sendEmail(
        user.email,
        "Daily Weather Alert",
        `<p>${alertMessage} for your trip to ${trip.destination}</p>`
      );
    }
  }
});