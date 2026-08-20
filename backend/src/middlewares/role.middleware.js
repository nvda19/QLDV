/**
 * Phân quyền truy cập theo vai trò (RBAC)
 * @param {...string} roles Danh sách vai trò được phép
 * @returns {Function} Middleware phân quyền
 */
const authorize = (...args) => {
  const allowedRoles = args.flat();
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền thực hiện hành động này" });
    }
    next();
  };
};

module.exports = { authorize };
