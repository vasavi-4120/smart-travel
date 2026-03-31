const axios = require("axios");

const getWeatherData = async (lat, lon) => {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      {
        params: {
          lat,
          lon,
          appid: process.env.WEATHER_API_KEY,
          units: "metric",
        },
      }
    );
    
    // console.log("Weather Data:", response.data);
    return response.data;
  
  } catch (error) {
    console.error("Weather API Error:", error.message);
    return null;
  }
};

module.exports = { getWeatherData };