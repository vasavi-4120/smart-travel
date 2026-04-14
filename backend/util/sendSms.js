const axios = require("axios");

// 🌐 Replace with your phone IP
const BASE_URL = "http://192.168.122.1:8080/send-sms";

// ✅ Single SMS
const sendSMS = async (number, message) => {
  try {
    const response = await axios.post(BASE_URL, {
      phone: number,
      message: message,
    });

    console.log(`✅ SMS sent to ${number}`, response.data);
  } catch (err) {
    console.error(
      `❌ SMS failed to ${number}:`,
      err.response?.data || err.message,
    );
  }
};

// ✅ Multiple numbers (your original logic)
const sendLocationSMS = async (numbers, userName, trackingLink, tripId) => {
  const phoneList = Array.isArray(numbers) ? numbers : [numbers];

  const message = `📍 SmartTravel: ${userName} is on a trip.
Track: ${trackingLink}
Trip ID: ${tripId}`;

  const results = phoneList.map(async (number) => {
    try {
      await axios.post(BASE_URL, {
        phone: number,
        message: message,
      });

      console.log(`✅ Location SMS sent to ${number}`);
    } catch (err) {
      console.error(
        `❌ Location SMS failed for ${number}:`,
        err.response?.data || err.message,
      );
    }
  });

  await Promise.all(results);
};

const sendPlacesSMS = async (numbers, places, lat, lng) => {
  try {
    const locationLink = `https://www.google.com/maps?q=${lat},${lng}`;

    // 📍 Keep it SHORT (SMS limit!)
    const placeText = places
      .slice(0, 3) // only top 3 places
      .map((p, i) => `${i + 1}. ${p.name} (${p.distance}km)`)
      .join("\n");

    const message = `🌍 Nearby Places:

📍 Your Location:
${locationLink}

✨ Top Places:
${placeText}`;

    const phoneList = Array.isArray(numbers) ? numbers : [numbers];

    const results = phoneList.map(async (number) => {
      try {
        await axios.post(BASE_URL, {
          phone: number,
          message: message,
        });

        console.log(`✅ Places SMS sent to ${number}`);
      } catch (err) {
        console.error(`❌ SMS failed to ${number}:`, err.message);
      }
    });

    await Promise.all(results);
  } catch (error) {
    console.error("❌ Places SMS Error:", error);
  }
};

const sendEmergencySMS = async (numbers, lat, lng, places) => {
  try {
    const locationLink = `https://www.google.com/maps?q=${lat},${lng}`;

    // 📍 Format nearby places (short for SMS)
    const placeText = places
      .slice(0, 2) // limit to 2 places (SMS length!)
      .map((p, i) => `${i + 1}. ${p.name} (${p.distance}km)`)
      .join("\n");

    const message = `🚨 EMERGENCY ALERT!
User needs help.

📍 Location:
${locationLink}

🏥 Nearby:
${placeText}`;

    const phoneList = Array.isArray(numbers) ? numbers : [numbers];

    const results = phoneList.map(async (number) => {
      try {
        await axios.post(BASE_URL, {
          phone: number,
          message: message,
        });

        console.log(`✅ SMS sent to ${number}`);
      } catch (err) {
        console.error(`❌ SMS failed to ${number}:`, err.message);
      }
    });

    await Promise.all(results);
  } catch (error) {
    console.error("❌ Emergency SMS Error:", error);
  }
};

module.exports = { sendSMS, sendLocationSMS, sendPlacesSMS, sendEmergencySMS };

