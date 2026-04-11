const twilio = require("twilio");

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const sendSMS = async (number, message) => {
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${number}`,
    });

    console.log(`✅ SMS sent to ${number}`);
  } catch (err) {
    console.error(`❌ SMS failed to ${number}:`, err.message);
  }
};

// const sendLocationSMS = async (number, userName, trackingLink, tripId) => {
//   try {
//     const message = `${userName} is currently on a trip.
// Live location: ${trackingLink}
// Trip ID: ${tripId}`;

//     await client.messages.create({
//       body: message,
//       from: process.env.TWILIO_PHONE_NUMBER,
//       to: `+91${number}`,
//     });

//     console.log(`📍 Location SMS sent to ${number}`);
//   } catch (err) {
//     console.error("❌ Location SMS Error:", err.message);
//   }
// };

const formatNumber = (num) => {
  const cleanNum = num.toString().replace(/\D/g, ""); // Remove non-digits
  return cleanNum.startsWith("91") ? `+${cleanNum}` : `+91${cleanNum}`;
};

const sendLocationSMS = async (numbers, userName, trackingLink, tripId) => {
  // Ensure we are working with an array even if a single string is passed
  const phoneList = Array.isArray(numbers) ? numbers : [numbers];

  const message = `📍 SmartTravel: ${userName} is on a trip. 
Live Tracking: ${trackingLink}
Trip ID: ${tripId}`;

  const results = phoneList.map(async (number) => {
    try {
      if (!number) return;

      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formatNumber(number),
      });
      console.log(`✅ Location SMS sent to ${number}`);
    } catch (err) {
      console.error(`❌ Location SMS failed for ${number}:`, err.message);
    }
  });

  await Promise.all(results);
};

module.exports = { sendSMS, sendLocationSMS };

// const twilio = require("twilio");

// const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// const sendSMS = async (phoneNumbers, lat, lng) => {
//   const link = `https://www.google.com/maps?q=${lat},${lng}`;

//   for (let number of phoneNumbers) {
//   try {
//     await client.messages.create({
//       body: `🚨 SOS Alert! User needs help. Location: ${link}`,
//       from: process.env.TWILIO_PHONE_NUMBER,
//       to: `+91${number}`,
//     });
//     console.log(`SMS sent successfully to ${number}`);
//   } catch (err) {
//     console.error(`Failed to send SMS to ${number}:`, err.message);
//   }
// }
// };

// module.exports = { sendSMS };
