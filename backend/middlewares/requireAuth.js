const requireAuth = (req, res, next) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Please login first.",
    });
  }
  next();
};

module.exports = requireAuth;