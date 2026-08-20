const userRepository = require("../../src/repositories/user.repository");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

jest.mock("../../src/repositories/user.repository", () => ({
  findByUsername: jest.fn(),
  incrementFailedAttempts: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "mocked_signed_token"),
  verify: jest.fn(),
}));

jest.mock("../../src/infrastructure/config/env", () => ({
  jwtSecret: "jwt-secret-test",
  jwtRefreshSecret: "jwt-refresh-secret-test",
}));

const {
  login,
  refreshAccessToken,
  getMe,
  logout,
  changePassword,
} = require("../../src/services/auth.service");

describe("auth.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    test("ném lỗi nếu không tìm thấy người dùng", async () => {
      userRepository.findByUsername.mockResolvedValueOnce(null);
      await expect(login("username", "password")).rejects.toThrow("Tên đăng nhập hoặc mật khẩu không đúng");
    });

    test("ném lỗi nếu tài khoản bị khóa", async () => {
      userRepository.findByUsername.mockResolvedValueOnce({ TenDangNhap: "user", TrangThai: "LOCKED" });
      await expect(login("user", "password")).rejects.toThrow("Tài khoản của bạn đã bị khóa");
    });

    test("mật khẩu sai -> gọi incrementFailedAttempts và ném lỗi", async () => {
      userRepository.findByUsername.mockResolvedValueOnce({ Id: "u1", TenDangNhap: "user", TrangThai: "ACTIVE" });
      bcrypt.compare.mockResolvedValueOnce(false);

      await expect(login("user", "wrong-pass")).rejects.toThrow("Tên đăng nhập hoặc mật khẩu không đúng");
      expect(userRepository.incrementFailedAttempts).toHaveBeenCalledWith("u1");
    });

    test("mật khẩu đúng -> đăng nhập thành công, reset số lần sai, sinh token và lưu refresh token", async () => {
      const mockUser = {
        Id: "u1",
        TenDangNhap: "user",
        MatKhauHash: "hashed",
        TrangThai: "ACTIVE",
        HoTen: "Tên",
        VaiTro: "BI_THU",
        ToChucDangId: "org1",
        YeuCauDoiMatKhau: false,
      };
      userRepository.findByUsername.mockResolvedValueOnce(mockUser);
      bcrypt.compare.mockResolvedValueOnce(true);

      const result = await login("user", "Password123!");

      expect(userRepository.update).toHaveBeenCalledWith("u1", {
        SoLanSaiMatKhau: 0,
        RefreshToken: "mocked_signed_token",
      });
      expect(result.token).toBe("mocked_signed_token");
      expect(result.RefreshToken).toBe("mocked_signed_token");
      expect(result.user.username).toBe("user");
    });
  });

  describe("refreshAccessToken", () => {
    test("ném lỗi nếu không truyền Refresh Token", async () => {
      await expect(refreshAccessToken(null)).rejects.toThrow("Refresh token là bắt buộc");
    });

    test("ném lỗi nếu token verify lỗi hoặc không hợp lệ", async () => {
      jwt.verify.mockImplementationOnce(() => {
        throw new Error("Invalid token");
      });
      await expect(refreshAccessToken("invalid-token")).rejects.toThrow("Refresh token đã hết hạn hoặc không hợp lệ");
    });

    test("ném lỗi nếu người dùng không tồn tại", async () => {
      jwt.verify.mockReturnValueOnce({ userId: "u1" });
      userRepository.findById.mockResolvedValueOnce(null);

      await expect(refreshAccessToken("valid-token")).rejects.toThrow("Refresh token đã hết hạn hoặc không hợp lệ");
    });

    test("ném lỗi nếu refresh token bị thu hồi / không trùng khớp DB", async () => {
      jwt.verify.mockReturnValueOnce({ userId: "u1" });
      userRepository.findById.mockResolvedValueOnce({
        Id: "u1",
        RefreshToken: "db-token",
        TrangThai: "ACTIVE",
      });

      await expect(refreshAccessToken("different-token")).rejects.toThrow("Refresh token đã hết hạn hoặc không hợp lệ");
    });

    test("ném lỗi nếu tài khoản bị khóa trong DB", async () => {
      jwt.verify.mockReturnValueOnce({ userId: "u1" });
      userRepository.findById.mockResolvedValueOnce({
        Id: "u1",
        RefreshToken: "valid-token",
        TrangThai: "LOCKED",
      });

      await expect(refreshAccessToken("valid-token")).rejects.toThrow("Refresh token đã hết hạn hoặc không hợp lệ");
    });

    test("làm mới thành công và trả về Access Token mới", async () => {
      jwt.verify.mockReturnValueOnce({ userId: "u1" });
      userRepository.findById.mockResolvedValueOnce({
        Id: "u1",
        RefreshToken: "valid-refresh-token",
        TrangThai: "ACTIVE",
      });

      const result = await refreshAccessToken("valid-refresh-token");

      expect(result.token).toBe("mocked_signed_token");
    });
  });

  describe("getMe", () => {
    test("ném lỗi nếu không tìm thấy người dùng", async () => {
      userRepository.findById.mockResolvedValueOnce(null);
      await expect(getMe("u1")).rejects.toThrow("Không tìm thấy người dùng");
    });

    test("ném lỗi nếu tài khoản bị khóa", async () => {
      userRepository.findById.mockResolvedValueOnce({ Id: "u1", TrangThai: "LOCKED" });
      await expect(getMe("u1")).rejects.toThrow("Tài khoản đã bị khóa");
    });

    test("trả về thông tin cá nhân và chi bộ thành công", async () => {
      userRepository.findById.mockResolvedValueOnce({
        Id: "u1",
        TenDangNhap: "user",
        HoTen: "Tên A",
        VaiTro: "BI_THU",
        ToChucDangId: "org1",
        TrangThai: "ACTIVE",
        YeuCauDoiMatKhau: false,
        ToChucDang: { Id: "org1", Ten: "Chi bộ A", ToChucChaId: null },
      });

      const result = await getMe("u1");

      expect(result.id).toBe("u1");
      expect(result.organization.name).toBe("Chi bộ A");
    });
  });

  describe("logout", () => {
    test("xóa RefreshToken trong DB khi đăng xuất", async () => {
      userRepository.update.mockResolvedValueOnce({});
      const result = await logout("u1");
      expect(userRepository.update).toHaveBeenCalledWith("u1", { RefreshToken: null });
      expect(result).toBe(true);
    });

    test("ném lỗi nếu update DB ném lỗi khi đăng xuất", async () => {
      userRepository.update.mockRejectedValueOnce(new Error("Lỗi DB"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await expect(logout("u1")).rejects.toThrow("Đăng xuất thất bại");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("changePassword", () => {
    test("ném lỗi nếu thiếu mật khẩu mới", async () => {
      await expect(changePassword("u1", null)).rejects.toThrow("Mật khẩu mới là bắt buộc");
    });

    test("ném lỗi nếu mật khẩu mới yếu", async () => {
      await expect(changePassword("u1", "weak")).rejects.toThrow("Mật khẩu phải có độ dài tối thiểu 8 ký tự");
    });

    test("ném lỗi nếu người dùng không tồn tại", async () => {
      userRepository.findById.mockResolvedValueOnce(null);
      await expect(changePassword("u1", "NewPassword123!")).rejects.toThrow("Người dùng không tồn tại");
    });

    test("đổi mật khẩu thành công và gỡ cờ yêu cầu đổi", async () => {
      userRepository.findById.mockResolvedValueOnce({ Id: "u1" });
      bcrypt.hash.mockResolvedValueOnce("hashed_new");

      const result = await changePassword("u1", "NewPassword123!");

      expect(bcrypt.hash).toHaveBeenCalledWith("NewPassword123!", 10);
      expect(userRepository.update).toHaveBeenCalledWith("u1", {
        MatKhauHash: "hashed_new",
        YeuCauDoiMatKhau: false,
      });
      expect(result).toBe(true);
    });
  });
});
