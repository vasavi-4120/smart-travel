const User = require("../model/UserModel");
require("dotenv").config();
const jwt = require("jsonwebtoken");

exports.userVerification = async (req, res, next) => { // Added next
  try {
    const token = req.cookies.token;
    // console.log("Token from cookie:", token); // Debugging log

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
  } 
    catch (error) {
  if (error.name === "JsonWebTokenError") {
    console.error("JWT ERROR:", error.message);
    return res.status(401).json({ message: "Invalid token" });
  }

  if (error.name === "TokenExpiredError") {
    console.error("JWT EXPIRED:", error.message);
    return res.status(401).json({ message: "Token expired" });
  }

  // 🔥 This is your REAL error
  console.error("DB ERROR:", error.message);
  return res.status(500).json({ message: "Database error" });
}
  
};

