const notificationService = require("../../src/services/notification.service");
const {
  notifyEligibleToBiThu,
  notifyOrgSubmitToCanBo,
  notifyOrgResultToBiThu,
  BADGE_NOTI,
} = require("../../src/services/badge/badgeNotification.service");

jest.mock("../../src/services/notification.service", () => ({
  getBiThuOfOrg: jest.fn(),
  getAllCanBoChinhTriIds: jest.fn(),
  createBulkNotifications: jest.fn(),
}));

describe("badgeNotification.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("notifyEligibleToBiThu", () => {
    test("thoát sớm nếu orgId rỗng hoặc cases rỗng", async () => {
      await notifyEligibleToBiThu(null, "Chi bộ A", []);
      expect(notificationService.getBiThuOfOrg).not.toHaveBeenCalled();
    });

    test("thoát sớm nếu không tìm thấy Bí thư nào trong chi bộ", async () => {
      notificationService.getBiThuOfOrg.mockResolvedValueOnce([]);
      await notifyEligibleToBiThu("org1", "Chi bộ A", [{ DangVienId: "m1" }]);
      expect(notificationService.createBulkNotifications).not.toHaveBeenCalled();
    });

    test("gửi thông báo thành công cho danh sách Bí thư", async () => {
      notificationService.getBiThuOfOrg.mockResolvedValueOnce(["bt1", "bt2"]);

      await notifyEligibleToBiThu("org1", "Chi bộ A", [{ DangVienId: "m1" }, { DangVienId: "m2" }]);

      expect(notificationService.createBulkNotifications).toHaveBeenCalledWith(
        ["bt1", "bt2"],
        expect.objectContaining({
          type: BADGE_NOTI.ELIGIBLE,
          title: "2 đảng viên đủ điều kiện xét tặng Huy hiệu Đảng",
          Metadata: { orgId: "org1", orgName: "Chi bộ A", count: 2 },
        })
      );
    });
  });

  describe("notifyOrgSubmitToCanBo", () => {
    test("thoát sớm nếu không có cán bộ chính trị nào", async () => {
      notificationService.getAllCanBoChinhTriIds.mockResolvedValueOnce([]);
      await notifyOrgSubmitToCanBo({ senderId: "u1", orgName: "Chi bộ A", count: 5 });
      expect(notificationService.createBulkNotifications).not.toHaveBeenCalled();
    });

    test("gửi thông báo thành công cho cán bộ chính trị", async () => {
      notificationService.getAllCanBoChinhTriIds.mockResolvedValueOnce(["cb1"]);

      await notifyOrgSubmitToCanBo({ senderId: "u1", orgName: "Chi bộ A", count: 5 });

      expect(notificationService.createBulkNotifications).toHaveBeenCalledWith(
        ["cb1"],
        expect.objectContaining({
          senderId: "u1",
          type: BADGE_NOTI.PROPOSED,
          title: "Chi bộ A gửi đề nghị xét tặng Huy hiệu Đảng",
          Metadata: { orgName: "Chi bộ A", count: 5 },
        })
      );
    });
  });

  describe("notifyOrgResultToBiThu", () => {
    test("thoát sớm nếu thiếu orgId", async () => {
      await notifyOrgResultToBiThu({ orgId: null });
      expect(notificationService.getBiThuOfOrg).not.toHaveBeenCalled();
    });

    test("gửi thông báo phê duyệt thành công", async () => {
      notificationService.getBiThuOfOrg.mockResolvedValueOnce(["bt1"]);

      await notifyOrgResultToBiThu({
        orgId: "org1",
        senderId: "cb1",
        orgName: "Chi bộ A",
        count: 3,
        approved: true,
      });

      expect(notificationService.createBulkNotifications).toHaveBeenCalledWith(
        ["bt1"],
        expect.objectContaining({
          type: BADGE_NOTI.APPROVED,
          title: "Danh sách Huy hiệu Đảng của Chi bộ A đã được phê duyệt",
          Metadata: expect.objectContaining({ approved: true }),
        })
      );
    });

    test("gửi thông báo từ chối kèm lý do thành công", async () => {
      notificationService.getBiThuOfOrg.mockResolvedValueOnce(["bt1"]);

      await notifyOrgResultToBiThu({
        orgId: "org1",
        senderId: "cb1",
        orgName: "Chi bộ A",
        count: 3,
        approved: false,
        reason: "Hồ sơ không đúng",
      });

      expect(notificationService.createBulkNotifications).toHaveBeenCalledWith(
        ["bt1"],
        expect.objectContaining({
          type: BADGE_NOTI.REJECTED,
          title: "Danh sách Huy hiệu Đảng của Chi bộ A bị từ chối",
          content: expect.stringContaining("Lý do: \"Hồ sơ không đúng\""),
          Metadata: expect.objectContaining({ approved: false, reason: "Hồ sơ không đúng" }),
        })
      );
    });

    test("thoát sớm nếu không tìm thấy Bí thư", async () => {
      notificationService.getBiThuOfOrg.mockResolvedValueOnce([]);
      await notifyOrgResultToBiThu({ orgId: "org1", approved: true });
      expect(notificationService.createBulkNotifications).not.toHaveBeenCalled();
    });

    test("gửi thông báo với thông tin trống (phát sinh giá trị mặc định)", async () => {
      notificationService.getBiThuOfOrg.mockResolvedValueOnce(["bt1"]);

      await notifyOrgResultToBiThu({
        orgId: "org1",
        senderId: null,
        orgName: null,
        count: 1,
        approved: true,
      });

      expect(notificationService.createBulkNotifications).toHaveBeenCalledWith(
        ["bt1"],
        expect.objectContaining({
          title: "Danh sách Huy hiệu Đảng của chi bộ đã được phê duyệt",
          senderId: null,
          Metadata: expect.objectContaining({ orgName: null, reason: null }),
        })
      );
    });
  });

  describe("additional edge cases", () => {
    test("notifyEligibleToBiThu với orgName rỗng", async () => {
      notificationService.getBiThuOfOrg.mockResolvedValueOnce(["bt1"]);
      await notifyEligibleToBiThu("org1", null, [{ DangVienId: "m1" }]);
      expect(notificationService.createBulkNotifications).toHaveBeenCalledWith(
        ["bt1"],
        expect.objectContaining({
          Metadata: { orgId: "org1", orgName: null, count: 1 }
        })
      );
    });

    test("notifyOrgSubmitToCanBo với thông tin trống", async () => {
      notificationService.getAllCanBoChinhTriIds.mockResolvedValueOnce(["cb1"]);
      await notifyOrgSubmitToCanBo({ senderId: null, orgName: null, count: 2 });
      expect(notificationService.createBulkNotifications).toHaveBeenCalledWith(
        ["cb1"],
        expect.objectContaining({
          senderId: null,
          title: "Chi bộ gửi đề nghị xét tặng Huy hiệu Đảng",
          Metadata: { orgName: null, count: 2 }
        })
      );
    });
  });
});
