const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, htmlContent) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Smart Travel ✈️" <${process.env.EMAIL_USER}>`, 
      to: email,
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Email Error:", error);
  }
};

module.exports = sendEmail;

// const nodemailer = require("nodemailer");

// // Create the transporter ONCE at the top level
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   pool: true, // This enables connection pooling for multiple users
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// const sendEmail = async (email, subject, text) => {
//   try {
//     // Send without re-authenticating every single time
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: subject,
//       text: text,
//     });
//   } catch (error) {
//     console.error("EMAIL_ERROR:", error);
//     // Don't throw error here, so the signup process doesn't break
//   }
// };

// module.exports = sendEmail;