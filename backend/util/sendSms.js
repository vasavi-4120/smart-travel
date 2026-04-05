const twilio = require("twilio");

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const sendSMS = async (phoneNumbers, lat, lng) => {
  const link = `https://www.google.com/maps?q=${lat},${lng}`;

  for (let number of phoneNumbers) {
  try {
    await client.messages.create({
      body: `🚨 SOS Alert! User needs help. Location: ${link}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${number}`,
    });
    console.log(`SMS sent successfully to ${number}`);
  } catch (err) {
    console.error(`Failed to send SMS to ${number}:`, err.message);
  }
}
};

module.exports = { sendSMS };
