const badgeRepository = require("../../src/repositories/badge.repository");
const { validateWritePermission } = require("../../src/domain/policies/member.policy");
const { syncBadgeMilestone } = require("../../src/services/badge/badgeMilestoneSync.service");
const { ROLES } = require("../../src/domain/constants/member.constants");

jest.mock("../../src/repositories/badge.repository", () => ({
  findFirst: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
}));

jest.mock("../../src/domain/policies/member.policy", () => ({
  validateWritePermission: jest.fn(),
}));

jest.mock("../../src/services/badge/badgeMilestoneSync.service", () => ({
  syncBadgeMilestone: jest.fn(),
}));

const {
  importProposalsOffline,
  importDecisionsOffline,
} = require("../../src/services/badge/badgeOfflineImport.service");

describe("badgeOfflineImport.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("importProposalsOffline", () => {
    const user = { userId: "user1", role: ROLES.CAN_BO_CHINH_TRI };

    test("ném lỗi nếu không phải CAN_BO_CHINH_TRI", async () => {
      await expect(
        importProposalsOffline([], { ...user, role: ROLES.BI_THU })
      ).rejects.toThrow("Chỉ Cán bộ chính trị mới có quyền nhập đề xuất ngoại tuyến!");
    });

    test("nhập thành công các đề xuất chưa tồn tại và bỏ qua đề xuất đã có hoặc không hợp lệ", async () => {
      badgeRepository.findFirst
        .mockResolvedValueOnce({ Id: "existing-1" }) // proposal 1 đã tồn tại
        .mockResolvedValueOnce(null); // proposal 2 chưa tồn tại

      const proposals = [
        { DangVienId: "m1", LoaiDeXuat: "CAP_MOI", MocHuyHieu: 30 },
        { DangVienId: "", LoaiDeXuat: "CAP_MOI", MocHuyHieu: 35 }, // Thiếu DangVienId -> bỏ qua
        { DangVienId: "m2", LoaiDeXuat: "CAP_MOI", MocHuyHieu: 40 },
      ];

      const result = await importProposalsOffline(proposals, user);

      expect(badgeRepository.create).toHaveBeenCalledTimes(1);
      expect(badgeRepository.create).toHaveBeenCalledWith({
        DangVienId: "m2",
        LoaiDeXuat: "CAP_MOI",
        MocHuyHieu: 40,
        TrangThai: "PENDING",
        NguoiDeXuatId: "user1",
      });
      expect(result).toEqual({ success: true, count: 1 });
    });
  });

  describe("importDecisionsOffline", () => {
    const user = { userId: "user1", role: ROLES.CAN_BO_CHINH_TRI };

    test("tạo mới quyết định phê duyệt nếu proposal không tồn tại và gán giá trị mặc định", async () => {
      badgeRepository.findById.mockResolvedValueOnce(null);

      const decisions = [
        {
          Id: "b1",
          DangVienId: "m1",
          MocHuyHieu: 30, // Không truyền NgayQuyetDinh, SoHuyHieu...
        },
      ];

      const result = await importDecisionsOffline(decisions, user);

      expect(badgeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          Id: "b1",
          DangVienId: "m1",
          MocHuyHieu: 30,
          TrangThai: "APPROVED",
          SoHuyHieu: null,
          SoQuyetDinhCaNhan: null,
          SoQuyetDinhTapThe: null,
          NgayQuyetDinh: expect.any(Date),
        })
      );
      expect(syncBadgeMilestone).toHaveBeenCalledWith("m1", 30);
      expect(result).toEqual({ success: true, count: 1 });
    });

    test("cập nhật quyết định phê duyệt nếu proposal đã tồn tại và xử lý NgayQuyetDinh mặc định", async () => {
      badgeRepository.findById.mockResolvedValueOnce({ Id: "b1", TrangThai: "PENDING" });

      const decisions = [
        {
          Id: "", // Thiếu Id -> bỏ qua
          DangVienId: "m1",
          MocHuyHieu: 30,
        },
        {
          Id: "b1",
          DangVienId: "m1",
          MocHuyHieu: 30,
          SoHuyHieu: "SHH-111",
          SoQuyetDinhCaNhan: "QD-111",
          // Không truyền NgayQuyetDinh
        },
      ];

      const result = await importDecisionsOffline(decisions, user);

      expect(badgeRepository.update).toHaveBeenCalledWith("b1", {
        TrangThai: "APPROVED",
        SoHuyHieu: "SHH-111",
        SoQuyetDinhCaNhan: "QD-111",
        SoQuyetDinhTapThe: undefined,
        NgayQuyetDinh: expect.any(Date),
        TaiLieuUrl: undefined,
        TaiLieuName: undefined,
        NguoiDuyetId: undefined,
      });
      expect(syncBadgeMilestone).toHaveBeenCalledWith("m1", 30);
      expect(result).toEqual({ success: true, count: 1 });
    });

    test("nếu user là BI_THU, kiểm tra quyền ghi trước khi import và bỏ qua nếu không có quyền", async () => {
      const biThuUser = { userId: "user-bt", role: ROLES.BI_THU };
      validateWritePermission.mockRejectedValueOnce(new Error("No permission"));

      const decisions = [
        {
          Id: "b1",
          DangVienId: "m1",
          MocHuyHieu: 30,
        },
      ];

      const result = await importDecisionsOffline(decisions, biThuUser);

      expect(validateWritePermission).toHaveBeenCalledWith("m1", biThuUser);
      expect(badgeRepository.create).not.toHaveBeenCalled();
      expect(badgeRepository.update).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true, count: 0 });
    });
  });
});
