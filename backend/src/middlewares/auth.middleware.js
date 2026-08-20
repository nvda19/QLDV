const jwt = require("jsonwebtoken");
const { jwtSecret: JWT_SECRET } = require("../infrastructure/config/env");

/**
 * Xác thực token JWT gửi kèm trong header Authorization (dạng Bearer),
 * giải mã và gắn payload vào req.user trước khi chuyển sang middleware tiếp theo.
 * @returns {Promise<void>}
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Vui lòng cung cấp token hợp lệ" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token đã hết hạn" });
    }
    return res.status(403).json({ message: "Token không hợp lệ" });
  }
};

module.exports = { authenticate };
