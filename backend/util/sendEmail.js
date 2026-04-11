const nodemailer = require("nodemailer");
const TripModel = require("../model/TripModel");

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // MUST be App Password
  },
  connectionTimeout: 10000,
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

const sendLocationEmail = async (to, userName, trackingLink, tripId) => {
  try {
    const trip = await TripModel.findOne({ tripId });

    if (!trip) {
      console.error("Trip not found for location email");
      return;
    }
    const mailOptions = {
      from: `"Smart Travel ✈️" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Location Alert: ${userName} is on a trip`,
      html: `
        <p>${userName} is currently on a trip.<p>
        <p><strong>📍 Route:</strong> ${trip.from.name} → ${trip.to.name}</p>
        </p>Their live location:</p>
        <a href="${trackingLink}" target="_blank">View Location</a>
        <p>Trip ID: ${tripId}</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Location email sent:", info.response);
  } catch (err) {
    console.error("Email Error:", err);
  }
};

// <a href="${locationUrl}" target="_blank">View Location</a>


const sendEmergencyEmail = async (emails, lat, lng, places) => {
  try {
    const locationLink = `https://www.google.com/maps?q=${lat},${lng}`;

    const placeList = places.map(p => `
      <li>
        <b>${p.name}</b><br/>
        ${p.address}<br/>
        📍 Distance: ${p.distance} km<br/>
        <a href="https://www.google.com/maps?q=${p.lat},${p.lon}" target="_blank">
          View Location
        </a>
      </li>
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
    console.error("❌ Email Error:", error);
  }
};

module.exports = { sendEmail, sendLocationEmail, sendEmergencyEmail };
