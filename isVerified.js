module.exports = (req, res, next) => {
  if (!req.user || !req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: "OTP verification required."
    });
  }
  next();
};
