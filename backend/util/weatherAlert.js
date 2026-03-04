const checkWeatherAlert = (weatherData) => {
  if (
    !weatherData ||
    !weatherData.list ||
    weatherData.list.length === 0
  ) {
    console.log("Invalid weather data");
    return null;
  }

  const forecast = weatherData.list[0];
  const weatherMain = forecast.weather[0].main;
  const description = forecast.weather[0].description;
  const temp = forecast.main.temp;

  console.log("Weather Condition:", weatherMain);
  console.log("Temperature:", temp);

  // 🔥 Check multiple bad conditions
  const badConditions = [
    "Rain",
    "Thunderstorm",
    "Snow",
    "Drizzle",
    "Squall",
    "Tornado",
  ];

  if (badConditions.includes(weatherMain)) {
    return `⚠️ Bad Weather Alert: ${description} expected at your destination.`;
  }

  if (temp >= 38) {
    return `⚠️ Heat Alert: Temperature may reach ${temp}°C.`;
  }

  return null;
};

module.exports = { checkWeatherAlert };