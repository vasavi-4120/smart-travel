
// Replace mock functions with real API calls
export async function fetchCrimeIndex(lat, lon) {
  // call your crime API here
  // return value 0..100
  return 30 + Math.round(Math.random() * 30); // mock
}

export async function fetchCrowdDensity(lat, lon) {
  // call crowd-sensing API (e.g., Google Mobility, camera analytics)
  return 20 + Math.round(Math.random() * 60); // mock
}

export async function fetchWeatherRisk(lat, lon) {
  // call OpenWeather or other; convert weather severity to 0..100
  return Math.round(Math.random() * 40); // mock (0 = calm, 100 = severe)
}
