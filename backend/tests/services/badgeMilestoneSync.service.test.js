const prisma = require("../../src/infrastructure/database/prisma");
const { syncBadgeMilestone } = require("../../src/services/badge/badgeMilestoneSync.service");

// Mock default prisma client
jest.mock("../../src/infrastructure/database/prisma", () => ({
  dangVien: {
    findUnique: jest.fn(),
  },
  khenThuongKyLuat: {
    upsert: jest.fn(),
  },
}));

describe("badgeMilestoneSync.service", () => {
  let mockTx;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock transaction client
    mockTx = {
      dangVien: {
        findUnique: jest.fn(),
      },
      khenThuongKyLuat: {
        upsert: jest.fn(),
      },
    };
  });

  test("thoát sớm nếu không tìm thấy đảng viên", async () => {
    mockTx.dangVien.findUnique.mockResolvedValueOnce(null);

    await syncBadgeMilestone("m1", 30, mockTx);

    expect(mockTx.dangVien.findUnique).toHaveBeenCalledWith({
      where: { Id: "m1" },
      include: { KhenThuongKyLuat: true },
    });
    expect(mockTx.khenThuongKyLuat.upsert).not.toHaveBeenCalled();
  });

  test("set HuyHieuDang trực tiếp nếu chưa có", async () => {
    mockTx.dangVien.findUnique.mockResolvedValueOnce({
      Id: "m1",
      KhenThuongKyLuat: null,
    });

    await syncBadgeMilestone("m1", 30, mockTx);

    expect(mockTx.khenThuongKyLuat.upsert).toHaveBeenCalledWith({
      where: { DangVienId: "m1" },
      create: { DangVienId: "m1", HuyHieuDang: "30 năm tuổi Đảng" },
      update: { HuyHieuDang: "30 năm tuổi Đảng" },
    });
  });

  test("set HuyHieuDang trực tiếp nếu HuyHieuDang hiện tại là 'Chưa'", async () => {
    mockTx.dangVien.findUnique.mockResolvedValueOnce({
      Id: "m1",
      KhenThuongKyLuat: { HuyHieuDang: "Chưa" },
    });

    await syncBadgeMilestone("m1", 40, mockTx);

    expect(mockTx.khenThuongKyLuat.upsert).toHaveBeenCalledWith({
      where: { DangVienId: "m1" },
      create: { DangVienId: "m1", HuyHieuDang: "40 năm tuổi Đảng" },
      update: { HuyHieuDang: "40 năm tuổi Đảng" },
    });
  });

  test("nối tiếp mốc mới bằng dấu phẩy nếu chưa có mốc này", async () => {
    mockTx.dangVien.findUnique.mockResolvedValueOnce({
      Id: "m1",
      KhenThuongKyLuat: { HuyHieuDang: "30 năm tuổi Đảng" },
    });

    await syncBadgeMilestone("m1", 40, mockTx);

    expect(mockTx.khenThuongKyLuat.upsert).toHaveBeenCalledWith({
      where: { DangVienId: "m1" },
      create: { DangVienId: "m1", HuyHieuDang: "30 năm tuổi Đảng, 40 năm tuổi Đảng" },
      update: { HuyHieuDang: "30 năm tuổi Đảng, 40 năm tuổi Đảng" },
    });
  });

  test("giữ nguyên nếu mốc này đã tồn tại trong chuỗi", async () => {
    mockTx.dangVien.findUnique.mockResolvedValueOnce({
      Id: "m1",
      KhenThuongKyLuat: { HuyHieuDang: "30 năm tuổi Đảng, 40 năm tuổi Đảng" },
    });

    await syncBadgeMilestone("m1", 30, mockTx);

    expect(mockTx.khenThuongKyLuat.upsert).toHaveBeenCalledWith({
      where: { DangVienId: "m1" },
      create: { DangVienId: "m1", HuyHieuDang: "30 năm tuổi Đảng, 40 năm tuổi Đảng" },
      update: { HuyHieuDang: "30 năm tuổi Đảng, 40 năm tuổi Đảng" },
    });
  });

  test("sử dụng client prisma mặc định nếu không truyền tx", async () => {
    prisma.dangVien.findUnique.mockResolvedValueOnce(null);

    await syncBadgeMilestone("m1", 30);

    expect(prisma.dangVien.findUnique).toHaveBeenCalled();
  });
});
