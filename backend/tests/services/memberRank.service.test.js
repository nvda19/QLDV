/**
 * Unit test cho memberRank.service — quản lý lịch sử thăng quân hàm.
 * `validateRankHistory`/`STANDARD_RANKS` là hàm/constant thuần, để chạy thật.
 */
jest.mock("../../src/repositories/member/memberHistory.repository", () => ({
  createRankHistory: jest.fn(),
  updateRankHistory: jest.fn(),
  deleteRankHistory: jest.fn(),
  findRankHistoryById: jest.fn(),
}));
jest.mock("../../src/domain/policies/member.policy", () => ({
  validateWritePermission: jest.fn(),
}));
jest.mock("../../src/infrastructure/storage/fileStorage.service", () => ({
  deleteFile: jest.fn(),
}));
jest.mock("../../src/infrastructure/database/prisma", () => ({
  quyetDinh: { findUnique: jest.fn() },
}));
jest.mock("../../src/services/decision/decisionResolver.service", () => ({
  resolveQuyetDinh: jest.fn(),
}));
jest.mock("../../src/services/files/attachmentUpload.service", () => ({
  saveUploadFile: jest.fn(),
}));

const memberHistoryRepository = require("../../src/repositories/member/memberHistory.repository");
const { validateWritePermission } = require("../../src/domain/policies/member.policy");
const prisma = require("../../src/infrastructure/database/prisma");
const { resolveQuyetDinh } = require("../../src/services/decision/decisionResolver.service");
const {
  addRankHistory,
  updateRankHistory,
  deleteRankHistory,
} = require("../../src/services/member/memberRank.service");

beforeEach(() => {
  jest.clearAllMocks();
  validateWritePermission.mockResolvedValue({ Id: "m1" });
});

describe("addRankHistory", () => {
  test("không có quyết định đính kèm và thiếu số quyết định -> ném lỗi validate, không tạo bản ghi", async () => {
    resolveQuyetDinh.mockResolvedValue({
      QuyetDinhId: null,
      SoQuyetDinh: null,
      TaiLieuUrl: null,
      TaiLieuName: null,
    });

    await expect(
      addRankHistory("m1", { CapBac: "Thiếu úy", effectiveDate: "2020-01-01" }, null, {}),
    ).rejects.toThrow("Số quyết định thăng quân hàm là bắt buộc");
    expect(memberHistoryRepository.createRankHistory).not.toHaveBeenCalled();
  });

  test("cấp bậc không nằm trong danh mục chuẩn -> ném lỗi", async () => {
    resolveQuyetDinh.mockResolvedValue({
      QuyetDinhId: null,
      SoQuyetDinh: "01/QD",
      TaiLieuUrl: null,
      TaiLieuName: null,
    });

    await expect(
      addRankHistory(
        "m1",
        { CapBac: "Cấp bậc không tồn tại", effectiveDate: "2020-01-01", SoQuyetDinh: "01/QD" },
        null,
        {},
      ),
    ).rejects.toThrow("Cấp bậc quân hàm không hợp lệ");
  });

  test("dữ liệu hợp lệ, có QuyetDinhId -> lấy NgayHieuLuc từ ngày ban hành quyết định", async () => {
    resolveQuyetDinh.mockResolvedValue({
      QuyetDinhId: "qd1",
      SoQuyetDinh: "01/QD",
      TaiLieuUrl: null,
      TaiLieuName: null,
    });
    prisma.quyetDinh.findUnique.mockResolvedValue({
      Id: "qd1",
      NgayBanHanh: new Date("2019-05-01"),
    });
    memberHistoryRepository.createRankHistory.mockResolvedValue({
      Id: "rh1",
      DangVienId: "m1",
      CapBac: "Thiếu úy",
      ChucVu: "Đội trưởng",
      DonVi: "Đội 1",
      NgayHieuLuc: new Date("2019-05-01"),
      SoQuyetDinh: "01/QD",
      QuyetDinhId: "qd1",
      CreatedAt: new Date("2020-01-01"),
    });

    const result = await addRankHistory(
      "m1",
      { CapBac: "Thiếu úy", effectiveDate: "2020-01-01", SoQuyetDinh: "01/QD" },
      null,
      {},
    );

    expect(memberHistoryRepository.createRankHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        DangVienId: "m1",
        NgayHieuLuc: new Date("2019-05-01"),
        QuyetDinhId: "qd1",
      }),
    );
    expect(result.QuyetDinhId).toBe("qd1");
  });

  test("không có quyền ghi -> ném lỗi, không gọi resolveQuyetDinh", async () => {
    validateWritePermission.mockRejectedValue(new Error("Không có quyền"));

    await expect(
      addRankHistory("m1", { CapBac: "Thiếu úy" }, null, {}),
    ).rejects.toThrow("Không có quyền");
    expect(resolveQuyetDinh).not.toHaveBeenCalled();
  });
});

describe("updateRankHistory", () => {
  test("không tìm thấy lịch sử quân hàm -> ném lỗi", async () => {
    memberHistoryRepository.findRankHistoryById.mockResolvedValue(null);

    await expect(
      updateRankHistory("m1", "rh-khong-ton-tai", { CapBac: "Thiếu úy" }, null, {}),
    ).rejects.toThrow("Không tìm thấy lịch sử quân hàm");
  });

  test("không truyền số quyết định mới -> giữ lại SoQuyetDinh/QuyetDinhId cũ", async () => {
    memberHistoryRepository.findRankHistoryById.mockResolvedValue({
      Id: "rh1",
      DangVienId: "m1",
      SoQuyetDinh: "02/QD-CU",
      QuyetDinhId: "qd-cu",
    });
    resolveQuyetDinh.mockResolvedValue({
      QuyetDinhId: null,
      SoQuyetDinh: null,
      TaiLieuUrl: null,
      TaiLieuName: null,
    });
    memberHistoryRepository.updateRankHistory.mockResolvedValue({
      Id: "rh1",
      DangVienId: "m1",
      CapBac: "Trung úy",
      SoQuyetDinh: "02/QD-CU",
      QuyetDinhId: "qd-cu",
      NgayHieuLuc: new Date("2021-01-01"),
      CreatedAt: new Date(),
    });

    await updateRankHistory("m1", "rh1", { CapBac: "Trung úy" }, null, {});

    expect(memberHistoryRepository.updateRankHistory).toHaveBeenCalledWith(
      "rh1",
      expect.objectContaining({ SoQuyetDinh: "02/QD-CU", QuyetDinhId: "qd-cu" }),
    );
  });
});

describe("deleteRankHistory", () => {
  test("không tìm thấy -> ném lỗi, không xóa", async () => {
    memberHistoryRepository.findRankHistoryById.mockResolvedValue(null);

    await expect(deleteRankHistory("m1", "rh-x", {})).rejects.toThrow(
      "Không tìm thấy lịch sử quân hàm",
    );
    expect(memberHistoryRepository.deleteRankHistory).not.toHaveBeenCalled();
  });

  test("tìm thấy -> xóa thành công", async () => {
    memberHistoryRepository.findRankHistoryById.mockResolvedValue({ Id: "rh1", DangVienId: "m1" });

    await deleteRankHistory("m1", "rh1", {});

    expect(memberHistoryRepository.deleteRankHistory).toHaveBeenCalledWith("rh1");
  });

  test("không có quyền -> ném lỗi, không truy vấn lịch sử", async () => {
    validateWritePermission.mockRejectedValue(new Error("Không có quyền"));

    await expect(deleteRankHistory("m1", "rh1", {})).rejects.toThrow("Không có quyền");
    expect(memberHistoryRepository.findRankHistoryById).not.toHaveBeenCalled();
  });
});
