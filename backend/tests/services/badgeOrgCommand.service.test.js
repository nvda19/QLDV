const badgeRepository = require("../../src/repositories/badge.repository");
const orgRepository = require("../../src/repositories/org.repository");
const memberRepository = require("../../src/repositories/member/member.repository");
const { logAction } = require("../../src/infrastructure/audit/auditLogger");
const { getDescendantOrgIds } = require("../../src/domain/utils/orgTree");
const { resolveQuyetDinh } = require("../../src/services/decision/decisionResolver.service");
const { syncBadgeMilestone } = require("../../src/services/badge/badgeMilestoneSync.service");
const badgeNotificationService = require("../../src/services/badge/badgeNotification.service");
const { ROLES } = require("../../src/domain/constants/member.constants");

jest.mock("../../src/repositories/badge.repository", () => ({
  findMany: jest.fn(),
  updateMany: jest.fn(),
}));

jest.mock("../../src/repositories/org.repository", () => ({
  findAll: jest.fn(),
}));

jest.mock("../../src/repositories/member/member.repository", () => ({
  findManyIds: jest.fn(),
}));

jest.mock("../../src/infrastructure/audit/auditLogger", () => ({
  logAction: jest.fn(),
}));

jest.mock("../../src/domain/utils/orgTree", () => ({
  getDescendantOrgIds: jest.fn(),
}));

jest.mock("../../src/services/decision/decisionResolver.service", () => ({
  resolveQuyetDinh: jest.fn(),
}));

jest.mock("../../src/services/badge/badgeMilestoneSync.service", () => ({
  syncBadgeMilestone: jest.fn(),
}));

jest.mock("../../src/services/badge/badgeNotification.service", () => ({
  notifyOrgSubmitToCanBo: jest.fn(),
  notifyOrgResultToBiThu: jest.fn(),
}));

jest.mock("../../src/infrastructure/database/prisma", () => ({
  $transaction: jest.fn((callback) => callback({})),
}));

const {
  submitOrgBadges,
  approveOrgBadges,
  rejectOrgBadges,
} = require("../../src/services/badge/badgeOrgCommand.service");

describe("badgeOrgCommand.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("submitOrgBadges", () => {
    const user = { userId: "user1", role: ROLES.BI_THU, orgId: "org1" };

    test("ném lỗi nếu không phải BI_THU", async () => {
      await expect(
        submitOrgBadges("org1", { ...user, role: ROLES.CAN_BO_CHINH_TRI })
      ).rejects.toThrow("Chỉ Bí thư mới được gửi danh sách đề nghị của tổ chức!");
    });

    test("ném lỗi nếu gửi đề nghị cho tổ chức ngoài phạm vi", async () => {
      orgRepository.findAll.mockResolvedValueOnce([{ Id: "org1" }, { Id: "org2" }]);
      getDescendantOrgIds.mockReturnValueOnce(["org1"]); // scope của user chỉ có org1

      await expect(
        submitOrgBadges("org2", user)
      ).rejects.toThrow("Bạn không có quyền gửi đề nghị cho tổ chức khác!");
    });

    test("ném lỗi nếu không có đề nghị DRAFT", async () => {
      orgRepository.findAll.mockResolvedValue([{ Id: "org1", Ten: "Chi bộ A" }]);
      getDescendantOrgIds.mockReturnValueOnce(["org1"]);
      memberRepository.findManyIds.mockResolvedValueOnce([{ Id: "m1" }]);
      badgeRepository.findMany.mockResolvedValueOnce([]); // không có proposals nào

      await expect(
        submitOrgBadges("org1", user)
      ).rejects.toThrow("Không có đề nghị nào trong danh sách để gửi!");
    });

    test("gửi thành công -> cập nhật trạng thái PENDING, ghi log và thông báo", async () => {
      orgRepository.findAll.mockResolvedValue([{ Id: "org1", Ten: "Chi bộ A" }]);
      getDescendantOrgIds.mockReturnValueOnce(["org1"]);
      memberRepository.findManyIds.mockResolvedValueOnce([{ Id: "m1" }]);
      badgeRepository.findMany.mockResolvedValueOnce([{ Id: "b1", DangVienId: "m1", MocHuyHieu: 30 }]);
      badgeRepository.updateMany.mockResolvedValueOnce({ count: 1 });

      const result = await submitOrgBadges("org1", user);

      expect(badgeRepository.updateMany).toHaveBeenCalledWith(
        { Id: { in: ["b1"] } },
        { TrangThai: "PENDING", NguoiDeXuatId: "user1" }
      );
      expect(logAction).toHaveBeenCalledWith("user1", "SUBMIT_ORG_BADGES", "DE_XUAT_HUY_HIEU", "org1", null, { count: 1 });
      expect(badgeNotificationService.notifyOrgSubmitToCanBo).toHaveBeenCalledWith({
        senderId: "user1",
        orgName: "Chi bộ A",
        count: 1,
      });
      expect(result).toEqual({ count: 1 });
    });

    test("gửi thành công nhưng gặp lỗi gửi thông báo -> vẫn trả về kết quả", async () => {
      orgRepository.findAll.mockResolvedValue([{ Id: "org1", Ten: "Chi bộ A" }]);
      getDescendantOrgIds.mockReturnValueOnce(["org1"]);
      memberRepository.findManyIds.mockResolvedValueOnce([{ Id: "m1" }]);
      badgeRepository.findMany.mockResolvedValueOnce([{ Id: "b1", DangVienId: "m1", MocHuyHieu: 30 }]);
      badgeRepository.updateMany.mockResolvedValueOnce({ count: 1 });
      badgeNotificationService.notifyOrgSubmitToCanBo.mockRejectedValueOnce(new Error("Lỗi"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const result = await submitOrgBadges("org1", user);
      expect(result).toEqual({ count: 1 });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("approveOrgBadges", () => {
    const user = { userId: "user1", role: ROLES.CAN_BO_CHINH_TRI };

    test("ném lỗi nếu không phải CAN_BO_CHINH_TRI", async () => {
      await expect(
        approveOrgBadges("org1", {}, null, { ...user, role: ROLES.BI_THU })
      ).rejects.toThrow("Bạn không có quyền phê duyệt trao tặng Huy hiệu Đảng!");
    });

    test("ném lỗi nếu không có đề xuất PENDING", async () => {
      orgRepository.findAll.mockResolvedValueOnce([{ Id: "org1" }]);
      getDescendantOrgIds.mockReturnValueOnce(["org1"]);
      memberRepository.findManyIds.mockResolvedValueOnce([{ Id: "m1" }]);
      badgeRepository.findMany.mockResolvedValueOnce([]); // không có đề xuất nào chờ duyệt

      await expect(
        approveOrgBadges("org1", {}, null, user)
      ).rejects.toThrow("Không có đề nghị chờ duyệt nào của tổ chức này!");
    });

    test("phê duyệt thành công -> lưu quyết định tập thể, cập nhật APPROVED và đồng bộ mốc", async () => {
      orgRepository.findAll.mockResolvedValueOnce([{ Id: "org1", Ten: "Chi bộ A" }]);
      getDescendantOrgIds.mockReturnValueOnce(["org1"]);
      memberRepository.findManyIds.mockResolvedValueOnce([{ Id: "m1" }]);
      badgeRepository.findMany.mockResolvedValueOnce([{ Id: "b1", DangVienId: "m1", MocHuyHieu: 30 }]);
      resolveQuyetDinh.mockResolvedValueOnce({ QuyetDinhId: "qd1", SoQuyetDinh: "01/QD" });
      badgeRepository.updateMany.mockResolvedValueOnce({ count: 1 });

      const result = await approveOrgBadges("org1", { SoQuyetDinh: "01/QD", NgayBanHanh: "2024-05-01" }, null, user);

      expect(resolveQuyetDinh).toHaveBeenCalled();
      expect(badgeRepository.updateMany).toHaveBeenCalledWith(
        { Id: { in: ["b1"] } },
        {
          TrangThai: "APPROVED",
          SoQuyetDinhTapThe: "01/QD",
          NgayQuyetDinh: new Date("2024-05-01"),
          QuyetDinhId: "qd1",
          NguoiDuyetId: "user1",
        },
        expect.any(Object),
      );
      expect(syncBadgeMilestone).toHaveBeenCalledWith("m1", 30, expect.any(Object));
      expect(logAction).toHaveBeenCalledWith("user1", "APPROVE_ORG_BADGES", "DE_XUAT_HUY_HIEU", "org1", null, { count: 1 });
      expect(badgeNotificationService.notifyOrgResultToBiThu).toHaveBeenCalledWith({
        orgId: "org1",
        senderId: "user1",
        orgName: "Chi bộ A",
        count: 1,
        approved: true,
      });
      expect(result).toEqual({ count: 1 });
    });

    test("phê duyệt thành công nhưng gặp lỗi gửi thông báo -> vẫn trả về kết quả", async () => {
      orgRepository.findAll.mockResolvedValueOnce([{ Id: "org1", Ten: "Chi bộ A" }]);
      getDescendantOrgIds.mockReturnValueOnce(["org1"]);
      memberRepository.findManyIds.mockResolvedValueOnce([{ Id: "m1" }]);
      badgeRepository.findMany.mockResolvedValueOnce([{ Id: "b1", DangVienId: "m1", MocHuyHieu: 30 }]);
      resolveQuyetDinh.mockResolvedValueOnce({ QuyetDinhId: "qd1", SoQuyetDinh: "01/QD" });
      badgeRepository.updateMany.mockResolvedValueOnce({ count: 1 });
      badgeNotificationService.notifyOrgResultToBiThu.mockRejectedValueOnce(new Error("Lỗi"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const result = await approveOrgBadges("org1", { SoQuyetDinh: "01/QD", NgayBanHanh: "2024-05-01" }, null, user);
      expect(result).toEqual({ count: 1 });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("rejectOrgBadges", () => {
    const user = { userId: "user1", role: ROLES.CAN_BO_CHINH_TRI };

    test("ném lỗi nếu không phải CAN_BO_CHINH_TRI", async () => {
      await expect(
        rejectOrgBadges("org1", "lý do", { ...user, role: ROLES.BI_THU })
      ).rejects.toThrow("Bạn không có quyền từ chối phê duyệt Huy hiệu Đảng!");
    });

    test("ném lỗi nếu lý do từ chối rỗng", async () => {
      await expect(
        rejectOrgBadges("org1", " ", user)
      ).rejects.toThrow("Lý do từ chối là bắt buộc");
    });

    test("ném lỗi nếu không có đề xuất PENDING nào", async () => {
      orgRepository.findAll.mockResolvedValueOnce([{ Id: "org1" }]);
      getDescendantOrgIds.mockReturnValueOnce(["org1"]);
      memberRepository.findManyIds.mockResolvedValueOnce([{ Id: "m1" }]);
      badgeRepository.findMany.mockResolvedValueOnce([]); // Rỗng

      await expect(
        rejectOrgBadges("org1", "Hồ sơ lỗi", user)
      ).rejects.toThrow("Không có đề nghị chờ duyệt nào của tổ chức này!");
    });

    test("từ chối phê duyệt thành công -> cập nhật REJECTED và thông báo", async () => {
      orgRepository.findAll.mockResolvedValueOnce([{ Id: "org1", Ten: "Chi bộ A" }]);
      getDescendantOrgIds.mockReturnValueOnce(["org1"]);
      memberRepository.findManyIds.mockResolvedValueOnce([{ Id: "m1" }]);
      badgeRepository.findMany.mockResolvedValueOnce([{ Id: "b1", DangVienId: "m1", MocHuyHieu: 30 }]);
      badgeRepository.updateMany.mockResolvedValueOnce({ count: 1 });

      const result = await rejectOrgBadges("org1", "Thiếu hồ sơ đính kèm", user);

      expect(badgeRepository.updateMany).toHaveBeenCalledWith(
        { Id: { in: ["b1"] } },
        { TrangThai: "REJECTED", LyDoTuChoi: "Thiếu hồ sơ đính kèm" }
      );
      expect(logAction).toHaveBeenCalledWith("user1", "REJECT_ORG_BADGES", "DE_XUAT_HUY_HIEU", "org1", null, { count: 1, rejectReason: "Thiếu hồ sơ đính kèm" });
      expect(badgeNotificationService.notifyOrgResultToBiThu).toHaveBeenCalledWith({
        orgId: "org1",
        senderId: "user1",
        orgName: "Chi bộ A",
        count: 1,
        approved: false,
        reason: "Thiếu hồ sơ đính kèm",
      });
      expect(result).toEqual({ count: 1 });
    });

    test("từ chối thành công nhưng gặp lỗi gửi thông báo -> vẫn trả về kết quả", async () => {
      orgRepository.findAll.mockResolvedValueOnce([{ Id: "org1", Ten: "Chi bộ A" }]);
      getDescendantOrgIds.mockReturnValueOnce(["org1"]);
      memberRepository.findManyIds.mockResolvedValueOnce([{ Id: "m1" }]);
      badgeRepository.findMany.mockResolvedValueOnce([{ Id: "b1", DangVienId: "m1", MocHuyHieu: 30 }]);
      badgeRepository.updateMany.mockResolvedValueOnce({ count: 1 });
      badgeNotificationService.notifyOrgResultToBiThu.mockRejectedValueOnce(new Error("Lỗi"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const result = await rejectOrgBadges("org1", "Thiếu hồ sơ", user);
      expect(result).toEqual({ count: 1 });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
