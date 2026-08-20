const authService = require("../services/auth.service");

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Vui lòng nhập username và password.",
        });
    }
    const { token, RefreshToken, user } = await authService.login(
      username,
      password,
    );
    res.json({
      success: true,
      data: {
        token,
        refreshToken: RefreshToken,
        RefreshToken,
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Cấp access token mới từ refresh token; lỗi ở đây trả thẳng 401 thay vì next()
// vì client cần phân biệt rõ "refresh token hỏng" để redirect về trang login
const RefreshToken = async (req, res, next) => {
  try {
    const tokenInput = req.body.refreshToken || req.body.RefreshToken;

    if (!tokenInput) {
      return res
        .status(400)
        .json({ success: false, message: "Refresh token là bắt buộc." });
    }
    const { token } = await authService.refreshAccessToken(tokenInput);
    res.json({ success: true, data: { token } });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.userId);
    res.json({ success: true, message: "Đăng xuất thành công." });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    await authService.changePassword(req.user.userId, newPassword);
    res.json({ success: true, message: "Đổi mật khẩu thành công." });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getMe, RefreshToken, logout, changePassword };
