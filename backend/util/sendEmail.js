const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (email, subject, htmlContent) => {
  try {
    const info = await transporter.sendMail({
      from: `"Smart Travel ✈️" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", info.response);
  } catch (error) {
    console.error("Email Error:", error);
  }
};
const sendEmergencyEmail = async (emails, lat, lng, places) => {
  try {
    const locationLink = `https://www.google.com/maps?q=${lat},${lng}`;

    const placeList = places.map(p => `
      <li>${p.text} - ${p.place_name}</li>
    `).join("");

    const htmlContent = `
      <h2>🚨 Emergency Alert - Tourist Safety System</h2>
      <p><b>User needs immediate help!</b></p>

      <h3>📍 Live Location:</h3>
      <a href="${locationLink}" target="_blank">View on Google Maps</a>

      <h3>🏥 Nearby Help Services:</h3>
      <ul>${placeList}</ul>

      <p>Please take immediate action.</p>
    `;

    await transporter.sendMail({
      from: `"Smart Travel ✈️" <${process.env.EMAIL_USER}>`,
      to: Array.isArray(emails) ? emails.join(",") : emails,
      subject: "🚨 SOS Emergency Alert",
      html: htmlContent,
    });

    console.log("✅ Emergency email sent");
  } catch (error) {
    console.error("Email Error:", error);
  }
};

module.exports = { sendEmail, sendEmergencyEmail };
