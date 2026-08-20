const badgeRepository = require("../../src/repositories/badge.repository");
const { validateWritePermission } = require("../../src/domain/policies/member.policy");
const { resolveQuyetDinh } = require("../../src/services/decision/decisionResolver.service");
const { ROLES } = require("../../src/domain/constants/member.constants");

jest.mock("../../src/repositories/badge.repository", () => ({
  findFirst: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  lockAndCheckExisting: jest.fn(),
}));

jest.mock("../../src/domain/policies/member.policy", () => ({
  validateWritePermission: jest.fn(),
}));

jest.mock("../../src/services/decision/decisionResolver.service", () => ({
  resolveQuyetDinh: jest.fn(),
}));

jest.mock("../../src/infrastructure/database/prisma", () => ({
  $transaction: jest.fn((callback) => callback({})),
}));

const {
  proposeBadge,
  dismissProposal,
  restoreProposal,
  updateBadgeDecision,
} = require("../../src/services/badge/badgeCommand.service");

describe("badgeCommand.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("proposeBadge", () => {
    const user = { userId: "user1", role: ROLES.BI_THU };

    test("ném lỗi nếu thiếu LoaiDeXuat hoặc MocHuyHieu", async () => {
      validateWritePermission.mockResolvedValueOnce();
      await expect(
        proposeBadge("m1", { MocHuyHieu: 30 }, user)
      ).rejects.toThrow("Loại đề xuất và mốc Huy hiệu là bắt buộc");
    });

    test("ném lỗi nếu MocHuyHieu không hợp lệ", async () => {
      validateWritePermission.mockResolvedValueOnce();
      await expect(
        proposeBadge("m1", { LoaiDeXuat: "CAP_MOI", MocHuyHieu: "abc" }, user)
      ).rejects.toThrow("Mốc Huy hiệu không hợp lệ");
    });

    test("ném lỗi nếu đã tồn tại đề nghị cùng mốc đang xử lý hoặc đã duyệt", async () => {
      validateWritePermission.mockResolvedValueOnce();
      badgeRepository.lockAndCheckExisting.mockResolvedValueOnce({ Id: "b1" });

      await expect(
        proposeBadge("m1", { LoaiDeXuat: "CAP_MOI", MocHuyHieu: 30 }, user)
      ).rejects.toThrow("Đã tồn tại đề nghị hoặc quyết định cho mốc 30 năm tuổi Đảng");
    });

    test("tạo đề nghị thành công ở dạng DRAFT", async () => {
      validateWritePermission.mockResolvedValueOnce();
      badgeRepository.lockAndCheckExisting.mockResolvedValueOnce(null);
      badgeRepository.create.mockResolvedValueOnce({ Id: "b1", TrangThai: "DRAFT" });

      const result = await proposeBadge("m1", { LoaiDeXuat: "CAP_MOI", MocHuyHieu: 30 }, user);

      expect(validateWritePermission).toHaveBeenCalledWith("m1", user);
      expect(badgeRepository.lockAndCheckExisting).toHaveBeenCalledWith(
        "m1",
        30,
        ["DRAFT", "PENDING", "APPROVED"],
        expect.any(Object),
      );
      expect(badgeRepository.create).toHaveBeenCalledWith(
        {
          DangVienId: "m1",
          LoaiDeXuat: "CAP_MOI",
          MocHuyHieu: 30,
          TrangThai: "DRAFT",
          NguoiDeXuatId: "user1",
        },
        expect.any(Object),
      );
      expect(result).toEqual({ Id: "b1", TrangThai: "DRAFT" });
    });
  });

  describe("dismissProposal", () => {
    const user = { userId: "user1" };

    test("ném lỗi nếu thiếu proposalId", async () => {
      await expect(dismissProposal(null, user)).rejects.toThrow("ID đề nghị là bắt buộc");
    });

    test("ném lỗi nếu không tìm thấy đề nghị", async () => {
      badgeRepository.findById.mockResolvedValueOnce(null);
      await expect(dismissProposal("b1", user)).rejects.toThrow("Không tìm thấy đề nghị");
    });

    test("ném lỗi nếu trạng thái đề nghị không phải DRAFT", async () => {
      badgeRepository.findById.mockResolvedValueOnce({ Id: "b1", DangVienId: "m1", TrangThai: "PENDING" });
      validateWritePermission.mockResolvedValueOnce();

      await expect(dismissProposal("b1", user)).rejects.toThrow("Chỉ có thể xóa đề nghị đang ở trong danh sách (chưa gửi)");
    });

    test("loại đề nghị thành công sang DISMISSED", async () => {
      badgeRepository.findById.mockResolvedValueOnce({ Id: "b1", DangVienId: "m1", TrangThai: "DRAFT" });
      validateWritePermission.mockResolvedValueOnce();
      badgeRepository.update.mockResolvedValueOnce({ Id: "b1", TrangThai: "DISMISSED" });

      const result = await dismissProposal("b1", user);

      expect(validateWritePermission).toHaveBeenCalledWith("m1", user);
      expect(badgeRepository.update).toHaveBeenCalledWith("b1", { TrangThai: "DISMISSED" });
      expect(result.TrangThai).toBe("DISMISSED");
    });
  });

  describe("restoreProposal", () => {
    const user = { userId: "user1" };

    test("ném lỗi nếu trạng thái đề nghị không phải DISMISSED", async () => {
      badgeRepository.findById.mockResolvedValueOnce({ Id: "b1", DangVienId: "m1", TrangThai: "DRAFT" });
      validateWritePermission.mockResolvedValueOnce();

      await expect(restoreProposal("b1", user)).rejects.toThrow("Chỉ có thể khôi phục đề nghị đã loại khỏi danh sách");
    });

    test("khôi phục thành công sang DRAFT", async () => {
      badgeRepository.findById.mockResolvedValueOnce({ Id: "b1", DangVienId: "m1", TrangThai: "DISMISSED" });
      validateWritePermission.mockResolvedValueOnce();
      badgeRepository.update.mockResolvedValueOnce({ Id: "b1", TrangThai: "DRAFT" });

      const result = await restoreProposal("b1", user);

      expect(badgeRepository.update).toHaveBeenCalledWith("b1", { TrangThai: "DRAFT" });
      expect(result.TrangThai).toBe("DRAFT");
    });
  });

  describe("updateBadgeDecision", () => {
    const user = { userId: "user1", role: ROLES.CAN_BO_CHINH_TRI };

    test("ném lỗi nếu thiếu ProposalId", async () => {
      await expect(updateBadgeDecision("m1", {}, null, user)).rejects.toThrow("ID đề xuất/quyết định là bắt buộc");
    });

    test("ném lỗi nếu không tìm thấy đề xuất", async () => {
      badgeRepository.findById.mockResolvedValueOnce(null);
      await expect(updateBadgeDecision("m1", { ProposalId: "b1" }, null, user)).rejects.toThrow("Không tìm thấy thông tin Huy hiệu");
    });

    test("ném lỗi nếu đảng viên không khớp", async () => {
      badgeRepository.findById.mockResolvedValueOnce({ Id: "b1", DangVienId: "m2" });
      await expect(updateBadgeDecision("m1", { ProposalId: "b1" }, null, user)).rejects.toThrow("Đảng viên không khớp");
    });

    test("cập nhật thông tin quyết định thành công và map SoQuyetDinhTapThe", async () => {
      badgeRepository.findById.mockResolvedValueOnce({
        Id: "b1",
        DangVienId: "m1",
        SoQuyetDinhCaNhan: "old-qd",
        QuyetDinhId: "old-id",
      });
      resolveQuyetDinh.mockResolvedValueOnce({
        QuyetDinhId: "qd-resolved",
        SoQuyetDinh: "NEW-01/QD",
      });
      badgeRepository.update.mockResolvedValueOnce({ Id: "b1", QuyetDinhId: "qd-resolved" });

      const payload = {
        ProposalId: "b1",
        SoHuyHieu: "SHH-999",
        SoQuyetDinhCaNhan: "NEW-01/QD",
        SoQuyetDinhTapThe: "TAPTHE-99",
        NgayQuyetDinh: "2024-05-01",
      };

      const result = await updateBadgeDecision("m1", payload, null, user);

      expect(resolveQuyetDinh).toHaveBeenCalled();
      expect(badgeRepository.update).toHaveBeenCalledWith("b1", {
        QuyetDinhId: "qd-resolved",
        SoHuyHieu: "SHH-999",
        SoQuyetDinhCaNhan: "NEW-01/QD",
        SoQuyetDinhTapThe: "TAPTHE-99",
        NgayQuyetDinh: new Date("2024-05-01"),
      });
      expect(result.QuyetDinhId).toBe("qd-resolved");
    });

    test("cập nhật thông tin quyết định thành công bởi Bí thư (cần check write permission)", async () => {
      const biThuUser = { userId: "user-bt", role: ROLES.BI_THU };
      badgeRepository.findById.mockResolvedValueOnce({
        Id: "b1",
        DangVienId: "m1",
      });
      resolveQuyetDinh.mockResolvedValueOnce({
        QuyetDinhId: "qd-resolved",
      });
      badgeRepository.update.mockResolvedValueOnce({ Id: "b1" });
      validateWritePermission.mockResolvedValueOnce();

      await updateBadgeDecision("m1", { ProposalId: "b1" }, null, biThuUser);

      expect(validateWritePermission).toHaveBeenCalledWith("m1", biThuUser);
      expect(badgeRepository.update).toHaveBeenCalled();
    });
  });
});
