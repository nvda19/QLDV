const userRepository = require("../repositories/user.repository");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  jwtSecret: JWT_SECRET,
  jwtRefreshSecret: JWT_REFRESH_SECRET,
} = require("../infrastructure/config/env");

/**
 * Tạo access token cho người dùng.
 * Sống ngắn (1h) để giảm thiệt hại nếu token bị lộ; hết hạn thì dùng refresh token cấp lại.
 * @param {Object} user
 * @returns {string}
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id || user.Id,
      role: user.vaiTro || user.VaiTro,
      orgId: user.toChucDangId || user.ToChucDangId,
      memberId: user.dangVienId || user.DangVienId || null,
    },
    JWT_SECRET,
    { expiresIn: "1h" },
  );
};

/**
 * Tạo refresh token cho người dùng.
 * Sống dài hơn (7 ngày), được lưu vào cột `RefreshToken` trong DB và đối chiếu mỗi lần
 * làm mới access token hoặc bị xóa khi logout — nhờ đó có thể thu hồi phiên đăng nhập bất cứ lúc nào.
 * @param {Object} user
 * @returns {string}
 */
const generateRefreshToken = (user) => {
  return jwt.sign({ userId: user.Id }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

/**
 * Đăng nhập, tự động khóa tài khoản nếu sai mật khẩu quá số lần cho phép.
 * Lưu ý: ngưỡng khóa tài khoản (5 lần sai liên tiếp) được xử lý ở
 * `userRepository.incrementFailedAttempts`, không lặp logic đếm ở đây.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<Object>}
 */
const login = async (username, password) => {
  const user = await userRepository.findByUsername(username);
  if (!user) {
    throw new Error("Tên đăng nhập hoặc mật khẩu không đúng.");
  }

  if (user.TrangThai !== "ACTIVE") {
    throw new Error(
      "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Cán bộ chính trị.",
    );
  }

  const isMatch = await bcrypt.compare(password, user.MatKhauHash);
  if (!isMatch) {
    await userRepository.incrementFailedAttempts(user.Id);
    throw new Error("Tên đăng nhập hoặc mật khẩu không đúng.");
  }

  const accessToken = generateAccessToken(user);
  const RefreshToken = generateRefreshToken(user);

  await userRepository.update(user.Id, {
    SoLanSaiMatKhau: 0,
    RefreshToken,
  });

  return {
    token: accessToken,
    RefreshToken,
    user: {
      id: user.Id,
      username: user.TenDangNhap,
      HoTen: user.HoTen,
      role: user.VaiTro,
      orgId: user.ToChucDangId,
      memberId: user.DangVienId || user.dangVienId || null,
      status: user.TrangThai,
      mustChangePassword: user.YeuCauDoiMatKhau,
    },
  };
};

/**
 * Cấp lại access token từ refresh token.
 * Lưu ý: refresh token gửi lên phải trùng khớp với `RefreshToken` đang lưu trong DB —
 * cho phép thu hồi (logout) làm vô hiệu các refresh token cũ dù chưa hết hạn.
 * @param {string} refreshTokenInput
 * @returns {Promise<Object>}
 */
const refreshAccessToken = async (refreshTokenInput) => {
  if (!refreshTokenInput) {
    throw new Error("Refresh token là bắt buộc.");
  }

  try {
    const decoded = jwt.verify(refreshTokenInput, JWT_REFRESH_SECRET);

    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      throw new Error("Người dùng không tồn tại.");
    }

    if (user.RefreshToken !== refreshTokenInput) {
      throw new Error("Refresh token không hợp lệ hoặc đã bị thu hồi.");
    }

    if (user.TrangThai !== "ACTIVE") {
      throw new Error("Tài khoản đã bị khóa.");
    }

    const newAccessToken = generateAccessToken(user);

    return { token: newAccessToken };
  } catch (error) {
    throw new Error(
      "Refresh token đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.",
    );
  }
};

/**
 * Lấy thông tin người dùng hiện tại, kèm tổ chức Đảng trực thuộc (nếu có).
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const getMe = async (userId) => {
  const user = await userRepository.findById(userId, true);
  if (!user) {
    throw new Error("Không tìm thấy người dùng.");
  }

  if (user.TrangThai !== "ACTIVE") {
    throw new Error("Tài khoản đã bị khóa.");
  }

  return {
    id: user.Id,
    username: user.TenDangNhap,
    HoTen: user.HoTen,
    role: user.VaiTro,
    orgId: user.ToChucDangId,
    memberId: user.DangVienId || user.dangVienId || null,
    status: user.TrangThai,
    mustChangePassword: user.YeuCauDoiMatKhau,
    organization: user.ToChucDang
      ? {
          id: user.ToChucDang.Id,
          name: user.ToChucDang.Ten,
          ParentId: user.ToChucDang.ToChucChaId,
        }
      : null,
    member: user.DangVien || user.dangVien || null,
  };
};

/**
 * Đăng xuất bằng cách xóa refresh token đang lưu — token cũ sẽ không dùng để cấp mới được nữa.
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
const logout = async (userId) => {
  try {
    await userRepository.update(userId, { RefreshToken: null });
    return true;
  } catch (error) {
    console.error("Lỗi khi đăng xuất:", error);
    throw new Error("Đăng xuất thất bại");
  }
};

/**
 * Đổi mật khẩu người dùng.
 * @param {string} userId
 * @param {string} newPassword
 * @returns {Promise<boolean>}
 */
const changePassword = async (userId, newPassword) => {
  if (!newPassword) {
    throw new Error("Mật khẩu mới là bắt buộc.");
  }

  const validatePassword = (password) => {
    if (!password || password.length < 8) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return hasUpper && hasLower && hasDigit && hasSpecial;
  };

  if (!validatePassword(newPassword)) {
    throw new Error(
      "Mật khẩu phải có độ dài tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.",
    );
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    throw new Error("Người dùng không tồn tại.");
  }

  const matKhauHash = await bcrypt.hash(newPassword, 10);
  await userRepository.update(userId, {
    MatKhauHash: matKhauHash,
    YeuCauDoiMatKhau: false,
  });

  return true;
};

module.exports = { login, getMe, refreshAccessToken, logout, changePassword };
