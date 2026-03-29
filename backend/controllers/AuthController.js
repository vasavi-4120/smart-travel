const jwt = require("jsonwebtoken");
const axios = require("axios");
const User = require("../model/UserModel");
const { createSecretToken } = require("../util/SecretToken");
const bcrypt = require("bcryptjs");
const sendEmail = require("../util/sendEmail");
// const sendSMS = require("../util/sendSMS");
const crypto = require("crypto"); // Standard Node.js module
const twilio = require('twilio'); //for mobile notifications

// Initialize Twilio
const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

module.exports.Signup = async (req, res) => {
  try {
    const { email, password, username, contact, address } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ message: "User already exists" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      email,
      password,
      username,
      contact,
      address,
      verificationToken,
    });

    // // --- SEND EMAIL LOGIC ---
    // const message = `Hello ${username},\n\nWelcome to Smart Travel! Your account has been created successfully.`;
    // await sendEmail(user.email, "Welcome to Smart Travel!", message);
    // // ------------------------

    const welcomeTemplate = (username, link) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
    <h2 style="color: #7c3aed; text-align: center;">Welcome to Smart Travel, ${username}!</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
      We're excited to have you on board. Before you start planning your next adventure, please verify your email address to secure your account.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${link}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
        Verify My Account
      </a>
    </div>
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      If you didn't create an account, you can safely ignore this email.
    </p>
  </div>
`;
    const link = `http://localhost:8000/api/auth/verify/${verificationToken}`;
    await sendEmail(
      user.email,
      "Verify your Smart Travel Account",
      welcomeTemplate(username, link),
    );

    // Send Welcome SMS
    // if (contact) {
    //   client.messages.create({
    //     body: `Hi ${username}, welcome to Smart Travel! Your account has been successfully created. Explore the world with us!`,
    //     from: process.env.TWILIO_PHONE_NUMBER,
    //     to: `+91${contact}` // for India
    //   })
    //   .then(message => console.log("Signup SMS Sent. SID:", message.sid))
    //   .catch(err => console.error("Twilio Signup SMS Error:", err.message));
    // }

    const token = createSecretToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    res.status(201).json({
      success: true,
      message: "User signed up successfully",
      user,
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({
      success: false,
      message: "Error during signup",
      error: error.message,
    });
  }
};

module.exports.Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "Incorrect email or password" });
    }

    const auth = await bcrypt.compare(password, user.password);
    if (!auth) {
      return res.json({ message: "Incorrect email or password" });
    }

    // ✅ LOGIN EMAIL TEMPLATE
    const loginTemplate = (username, time) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
        <h2 style="color: #16a34a; text-align: center;">Login Alert - Smart Travel</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hi <strong>${username}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 16px;">
          A new login was detected on your Smart Travel account.
        </p>
        <p style="color: #4b5563; font-size: 16px;">
          <strong>Date & Time:</strong> ${time}
        </p>
        <p style="color: #ef4444; font-size: 14px;">
          If this wasn't you, please reset your password immediately.
        </p>
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Stay safe,<br/>Smart Travel Team
        </p>
      </div>
    `;

    // ✅ SEND LOGIN EMAIL
    await sendEmail(
      user.email,
      "Smart Travel Login Alert",
      loginTemplate(user.username, new Date().toLocaleString())
    );

    const token = createSecretToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.Logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });
  res.json({ message: "Logged out" });
};

module.exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password"); // Don't send password
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports.updateProfile = async (req, res) => {
  try {
    const { username, contact, address } = req.body;

    // Create an update object dynamically
    const updateFields = {};
    if (username) updateFields.username = username;
    if (contact) updateFields.contact = contact;
    if (address) updateFields.address = address;

    if (req.file) {
      updateFields.profileImage = {
        // url: req.file.path,
        url: req.file.path.replace(/\\/g, "/"),
        public_id: req.file.filename,
      };
    }

    // Force the update using $set
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true },
    );

    if (!updatedUser) {
      console.log("No user found with that ID!");
      return res
        .status(404)
        .json({ success: false, message: "User not found in DB" });
    }

    // console.log("FORCE UPDATED IN DB:", updatedUser);

    res.status(200).json({
      success: true,
      message: "Profile updated!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("SAVE ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports.VerifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Find user with this token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Update user status
    user.isVerified = true;
    user.verificationToken = undefined; // Clear the token
    await user.save();

    res.status(200).send("<h1>Email Verified Successfully!</h1><p>You can now log in.</p>");
  } catch (error) {
    res.status(500).json({ message: "Verification failed" });
  }
};

module.exports.GetCurrentUser = async (req, res) => {
  const token = req.cookies.token; 
  if (!token) {
    return res.status(401).json({ user: null }); // This is what you're seeing
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) return res.status(404).json({ user: null });
    
    // This MUST match what your React context expects (res.data.user)
    res.status(200).json({ user }); 
  } catch (err) {
    res.status(401).json({ user: null });
  }
};
