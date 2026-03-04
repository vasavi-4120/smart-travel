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

module.exports = sendEmail;

