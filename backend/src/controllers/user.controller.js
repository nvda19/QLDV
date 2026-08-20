const userService = require("../services/user.service");

// Lấy danh sách toàn bộ tài khoản người dùng
const getAllUsers = async (req, res, next) => {
  try {
    const { search, role, status, orgId } = req.query;
    const users = await userService.getAllUsers({
      search,
      role,
      status,
      orgId,
    });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// Khởi tạo một tài khoản người dùng mới
const createUser = async (req, res, next) => {
  try {
    const newUser = await userService.createUser(req.body);
    res
      .status(201)
      .json({
        success: true,
        data: newUser,
        message: "Tạo tài khoản người dùng thành công.",
      });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Cập nhật thông tin tài khoản người dùng
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.userId; // cần cho audit log, ghi lại ai là người thực hiện thay đổi
    const updatedUser = await userService.updateUser(
      id,
      req.body,
      currentUserId,
    );
    res.json({
      success: true,
      data: updatedUser,
      message: "Cập nhật tài khoản người dùng thành công.",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Đổi mật khẩu tài khoản người dùng
const changePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng cung cấp mật khẩu mới." });
    }
    await userService.changePassword(id, password);
    res.json({ success: true, message: "Đổi mật khẩu tài khoản thành công." });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Xóa một tài khoản người dùng (chặn tự xóa bản thân)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.userId;
    await userService.deleteUser(id, currentUserId);
    res.json({
      success: true,
      message: "Xóa tài khoản người dùng thành công.",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
};
