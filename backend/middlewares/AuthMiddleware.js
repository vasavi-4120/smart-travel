const User = require("../model/UserModel");
require("dotenv").config();
const jwt = require("jsonwebtoken");

exports.userVerification = async (req, res, next) => { // Added next
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Use the correct Secret Key from your .env (JWT_SECRET or TOKEN_KEY)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // IMPORTANT: Attach user to the request object
    req.user = user; 
    
    // Move to the next function (Multer or your Controller)
    next(); 
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

// const User = require("../model/UserModel");
// require("dotenv").config();
// const jwt = require("jsonwebtoken");

// exports.userVerification = async (req, res, next) => {
//   try {
//     let token;

//     // 1️⃣ Check Authorization header
//     if (req.headers.authorization?.startsWith("Bearer ")) {
//       token = req.headers.authorization.split(" ")[1];
//     }

//     // 2️⃣ If not in header, check cookies (optional fallback)
//     if (!token && req.cookies?.token) {
//       token = req.cookies.token;
//     }

//     if (!token) {
//       return res.status(401).json({ message: "Not authenticated" });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const user = await User.findById(decoded.id).select("-password");

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     req.user = user;
//     next();

//   } catch (error) {
//     console.error("Auth Error:", error.message);
//     return res.status(401).json({ message: "Invalid token" });
//   }
// };

// const User = require("../model/UserModel");
// require("dotenv").config();
// const jwt = require("jsonwebtoken");

// exports.userVerification = async (req, res) => {
//   try {
//     const token = req.cookies.token;

//     if (!token) {
//       return res.status(401).json({ message: "Not authenticated" });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const user = await User.findById(decoded.id).select("-password");

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.status(200).json({
//       success: true,
//       user
//     });
//   } catch (error) {
//     res.status(401).json({ message: "Invalid token" });
//   }
// };
