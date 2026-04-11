const jwt = require("jsonwebtoken");
const {
  Signup,
  Login,
  Logout,
  updateProfile,
  getProfile,
  VerifyEmail,
  GetCurrentUser,
} = require("../controllers/AuthController");
const { userVerification } = require("../middlewares/AuthMiddleware");
const  requireAuth  = require("../middlewares/requireAuth");
const router = require("express").Router();

const multer = require("multer");
const upload = require("../middlewares/upload");
// const upload = multer({ dest: "uploads/" });

router.post("/signup", Signup);
router.post("/login", Login);
router.post("/logout", Logout);
router.get("/verify", userVerification, (req, res) => {
  res.status(200).json({ status: true, user: req.user });
});
router.put(
  "/updateProfile",
  userVerification,
  upload.single("profileImage"),
  updateProfile,
);
router.get("/getProfile", userVerification,requireAuth, getProfile);
router.get("/verify/:token", VerifyEmail);
router.get("/me", GetCurrentUser);
// router.get("/me", userVerification,requireAuth, GetCurrentUser);

module.exports = router;
