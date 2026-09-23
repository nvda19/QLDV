jest.mock("../../src/infrastructure/database/prisma", () => ({
  nguoiDung: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const prisma = require("../../src/infrastructure/database/prisma");
const userRepository = require("../../src/repositories/user.repository");

describe("UserRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findByMemberId", () => {
    test("trả về null nếu dangVienId falsy", async () => {
      const res = await userRepository.findByMemberId(null);
      expect(res).toBeNull();
      expect(prisma.nguoiDung.findFirst).not.toHaveBeenCalled();
    });

    test("gọi findFirst với dangVienId và include hợp lệ, không bị lỗi userInclude", async () => {
      prisma.nguoiDung.findFirst.mockResolvedValueOnce({
        id: "u1",
        tenDangNhap: "dangvien1",
        hoTen: "Nguyễn Văn A",
        vaiTro: "DANG_VIEN",
        dangVienId: "dv1",
        toChucDang: { id: "org1", ten: "Chi bộ 1" },
        dangVien: { id: "dv1", lyLichCaNhan: { hoTenDangDung: "Nguyễn Văn A" } },
      });

      const user = await userRepository.findByMemberId("dv1");

      expect(prisma.nguoiDung.findFirst).toHaveBeenCalledWith({
        where: { dangVienId: "dv1" },
        include: expect.any(Object),
      });
      expect(user).toBeDefined();
      expect(user.Id).toBe("u1");
      expect(user.DangVienId).toBe("dv1");
      expect(user.DangVien).toBeDefined();
    });
  });

  describe("findById", () => {
    test("gọi findUnique với id", async () => {
      prisma.nguoiDung.findUnique.mockResolvedValueOnce({
        id: "u1",
        tenDangNhap: "user1",
      });

      const user = await userRepository.findById("u1");
      expect(prisma.nguoiDung.findUnique).toHaveBeenCalledWith({
        where: { id: "u1" },
        include: expect.any(Object),
      });
      expect(user.Id).toBe("u1");
    });
  });

  describe("findByUsername", () => {
    test("gọi findUnique với tenDangNhap", async () => {
      prisma.nguoiDung.findUnique.mockResolvedValueOnce({
        id: "u1",
        tenDangNhap: "user1",
      });

      const user = await userRepository.findByUsername("user1");
      expect(prisma.nguoiDung.findUnique).toHaveBeenCalledWith({
        where: { tenDangNhap: "user1" },
        include: expect.any(Object),
      });
      expect(user.TenDangNhap).toBe("user1");
    });
  });

  describe("create", () => {
    test("gọi create với data đã map", async () => {
      prisma.nguoiDung.create.mockResolvedValueOnce({
        id: "u2",
        tenDangNhap: "newuser",
        vaiTro: "DANG_VIEN",
      });

      const user = await userRepository.create({
        TenDangNhap: "newuser",
        VaiTro: "DANG_VIEN",
      });

      expect(prisma.nguoiDung.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenDangNhap: "newuser",
          vaiTro: "DANG_VIEN",
        }),
        include: expect.any(Object),
      });
      expect(user.Id).toBe("u2");
    });
  });
});
