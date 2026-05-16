const jwt = require("jsonwebtoken");

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Chưa đăng nhập."
    });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "change-this-secret-key"
    );

    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn."
    });
  }
}

module.exports = {
  authRequired
};