const userRepository = require("../../src/repositories/user.repository");
const orgRepository = require("../../src/repositories/org.repository");
const bcrypt = require("bcryptjs");
const { ROLES } = require("../../src/domain/constants/member.constants");

jest.mock("../../src/repositories/user.repository", () => ({
  findAll: jest.fn(),
  findByUsername: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}));

jest.mock("../../src/repositories/org.repository", () => ({
  findById: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

const {
  getAllUsers,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
} = require("../../src/services/user.service");

describe("user.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllUsers", () => {
    test("lấy danh sách user và map sang camelCase thành công", async () => {
      userRepository.findAll.mockResolvedValueOnce([
        {
          Id: "u1",
          TenDangNhap: "admin",
          HoTen: "Quản trị viên",
          VaiTro: ROLES.CAN_BO_CHINH_TRI,
          ToChucDangId: null,
          ToChucDang: null,
          TrangThai: "ACTIVE",
          CreatedAt: "2024-01-01",
        },
      ]);

      const result = await getAllUsers({});

      expect(result).toEqual([
        {
          id: "u1",
          username: "admin",
          hoTen: "Quản trị viên",
          role: ROLES.CAN_BO_CHINH_TRI,
          orgId: null,
          orgName: null,
          status: "ACTIVE",
          createdAt: "2024-01-01",
        },
      ]);
    });
  });

  describe("createUser", () => {
    const validUser = {
      username: "testuser",
      password: "Password123!",
      hoTen: "Nguyễn Văn Test",
      role: ROLES.CAN_BO_CHINH_TRI,
    };

    test("ném lỗi nếu thiếu các trường bắt buộc", async () => {
      await expect(createUser({ username: "a" })).rejects.toThrow("Vui lòng nhập đầy đủ");
    });

    test("ném lỗi nếu mật khẩu yếu", async () => {
      await expect(
        createUser({ ...validUser, password: "123" })
      ).rejects.toThrow("Mật khẩu phải có độ dài tối thiểu 8 ký tự");
    });

    test("ném lỗi nếu tên đăng nhập đã được sử dụng", async () => {
      userRepository.findByUsername.mockResolvedValueOnce({ Id: "existing" });
      await expect(createUser(validUser)).rejects.toThrow("Username đã được sử dụng");
    });

    test("ném lỗi nếu tạo Bí thư (BI_THU) nhưng không gắn với Tổ chức Đảng", async () => {
      userRepository.findByUsername.mockResolvedValueOnce(null);
      await expect(
        createUser({ ...validUser, role: ROLES.BI_THU, orgId: null })
      ).rejects.toThrow("Bí thư bắt buộc phải được gắn với một Tổ chức Đảng");
    });

    test("ném lỗi nếu Tổ chức Đảng không tồn tại", async () => {
      userRepository.findByUsername.mockResolvedValueOnce(null);
      orgRepository.findById.mockResolvedValueOnce(null);

      await expect(
        createUser({ ...validUser, role: ROLES.BI_THU, orgId: "invalid-org" })
      ).rejects.toThrow("Tổ chức Đảng không tồn tại");
    });

    test("tạo thành công tài khoản hợp lệ", async () => {
      userRepository.findByUsername.mockResolvedValueOnce(null);
      bcrypt.hash.mockResolvedValueOnce("hashed_password");
      userRepository.create.mockResolvedValueOnce({
        Id: "u2",
        TenDangNhap: "testuser",
        HoTen: "Nguyễn Văn Test",
        VaiTro: ROLES.CAN_BO_CHINH_TRI,
        ToChucDangId: null,
        TrangThai: "ACTIVE",
        CreatedAt: "now",
      });

      const result = await createUser(validUser);

      expect(bcrypt.hash).toHaveBeenCalledWith("Password123!", 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        TenDangNhap: "testuser",
        MatKhauHash: "hashed_password",
        HoTen: "Nguyễn Văn Test",
        VaiTro: ROLES.CAN_BO_CHINH_TRI,
        ToChucDangId: null,
        TrangThai: "ACTIVE",
      });
      expect(result.id).toBe("u2");
    });
  });

  describe("updateUser", () => {
    test("ném lỗi nếu không tìm thấy tài khoản để cập nhật", async () => {
      userRepository.findById.mockResolvedValueOnce(null);
      await expect(updateUser("u1", {}, "current")).rejects.toThrow("Không tìm thấy tài khoản");
    });

    test("ném lỗi nếu tự khóa tài khoản của chính mình", async () => {
      userRepository.findById.mockResolvedValueOnce({ Id: "u1", VaiTro: ROLES.CAN_BO_CHINH_TRI });
      await expect(
        updateUser("u1", { status: "LOCKED" }, "u1")
      ).rejects.toThrow("Bạn không thể khóa tài khoản của chính mình");
    });

    test("ném lỗi nếu chuyển role sang Bí thư nhưng không có Tổ chức Đảng", async () => {
      userRepository.findById.mockResolvedValueOnce({ Id: "u1", VaiTro: ROLES.CAN_BO_CHINH_TRI });
      await expect(
        updateUser("u1", { role: ROLES.BI_THU, orgId: null }, "current")
      ).rejects.toThrow("Bí thư bắt buộc phải được gắn với một Tổ chức Đảng");
    });

    test("cập nhật thông tin thành công", async () => {
      userRepository.findById.mockResolvedValueOnce({ Id: "u1", VaiTro: ROLES.CAN_BO_CHINH_TRI, HoTen: "Cũ" });
      userRepository.update.mockResolvedValueOnce({
        Id: "u1",
        TenDangNhap: "u1",
        HoTen: "Mới",
        VaiTro: ROLES.CAN_BO_CHINH_TRI,
        ToChucDangId: null,
        TrangThai: "ACTIVE",
      });

      const result = await updateUser("u1", { hoTen: "Mới" }, "current");

      expect(userRepository.update).toHaveBeenCalledWith("u1", expect.objectContaining({
        HoTen: "Mới",
      }));
      expect(result.hoTen).toBe("Mới");
    });

    test("ném lỗi nếu Tổ chức Đảng mới không tồn tại", async () => {
      userRepository.findById.mockResolvedValueOnce({ Id: "u1", VaiTro: ROLES.CAN_BO_CHINH_TRI });
      orgRepository.findById.mockResolvedValueOnce(null);

      await expect(
        updateUser("u1", { orgId: "invalid-org" }, "current")
      ).rejects.toThrow("Tổ chức Đảng không tồn tại");
    });
  });

  describe("changePassword", () => {
    test("ném lỗi nếu không tìm thấy tài khoản người dùng", async () => {
      userRepository.findById.mockResolvedValueOnce(null);
      await expect(changePassword("u1", "Password123!")).rejects.toThrow("Không tìm thấy tài khoản người dùng");
    });

    test("ném lỗi nếu mật khẩu mới yếu", async () => {
      userRepository.findById.mockResolvedValueOnce({ Id: "u1" });
      await expect(changePassword("u1", "123")).rejects.toThrow("Mật khẩu phải có độ dài tối thiểu 8 ký tự");
    });

    test("đổi mật khẩu thành công", async () => {
      userRepository.findById.mockResolvedValueOnce({ Id: "u1" });
      bcrypt.hash.mockResolvedValueOnce("new_hashed");

      const result = await changePassword("u1", "Password123!");

      expect(bcrypt.hash).toHaveBeenCalledWith("Password123!", 10);
      expect(userRepository.update).toHaveBeenCalledWith("u1", { MatKhauHash: "new_hashed" });
      expect(result).toBe(true);
    });
  });

  describe("deleteUser", () => {
    test("ném lỗi nếu không tìm thấy tài khoản người dùng", async () => {
      userRepository.findById.mockResolvedValueOnce(null);
      await expect(deleteUser("u1", "current")).rejects.toThrow("Không tìm thấy tài khoản người dùng");
    });

    test("ném lỗi nếu tự xóa chính mình", async () => {
      userRepository.findById.mockResolvedValueOnce({ Id: "u1" });
      await expect(deleteUser("u1", "u1")).rejects.toThrow("Bạn không thể tự xóa tài khoản của chính mình");
    });

    test("xóa thành công tài khoản khác", async () => {
      userRepository.findById.mockResolvedValueOnce({ Id: "u2" });

      const result = await deleteUser("u2", "u1");

      expect(userRepository.delete).toHaveBeenCalledWith("u2");
      expect(result).toBe(true);
    });
  });
});
