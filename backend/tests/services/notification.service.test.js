const notificationRepository = require("../../src/repositories/notification.repository");
const userRepository = require("../../src/repositories/user.repository");

jest.mock("../../src/repositories/notification.repository", () => ({
  findMany: jest.fn(),
  count: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
}));

jest.mock("../../src/repositories/user.repository", () => ({
  findPoliticalOfficerIds: jest.fn(),
  findSecretaryOfOrgIds: jest.fn(),
}));

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
  createBulkNotifications,
  getAllCanBoChinhTriIds,
  getBiThuOfOrg,
} = require("../../src/services/notification.service");

describe("notification.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getNotifications", () => {
    test("lấy danh sách thông báo phân trang thành công", async () => {
      notificationRepository.findMany.mockResolvedValueOnce([
        {
          Id: "n1",
          NguoiNhanId: "user1",
          NguoiGuiId: "sender1",
          NguoiGui: { HoTen: "Người gửi A" },
          Loai: "INFO",
          TieuDe: "Tiêu đề",
          NoiDung: "Nội dung",
          DuongDan: null,
          DaDoc: false,
          Metadata: null,
          CreatedAt: "2024-01-01",
        },
      ]);
      notificationRepository.count.mockResolvedValueOnce(1);

      const result = await getNotifications("user1", { page: 1, limit: 10 });

      expect(notificationRepository.findMany).toHaveBeenCalledWith(
        { NguoiNhanId: "user1" },
        0,
        10,
        expect.any(Object)
      );
      expect(result.notifications).toEqual([
        {
          id: "n1",
          recipientId: "user1",
          senderId: "sender1",
          senderName: "Người gửi A",
          type: "INFO",
          title: "Tiêu đề",
          content: "Nội dung",
          link: null,
          isRead: false,
          metadata: null,
          createdAt: "2024-01-01",
        },
      ]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    test("lọc chỉ thông báo chưa đọc nếu unreadOnly = true", async () => {
      notificationRepository.findMany.mockResolvedValueOnce([]);
      notificationRepository.count.mockResolvedValueOnce(0);

      await getNotifications("user1", { unreadOnly: true });

      expect(notificationRepository.findMany).toHaveBeenCalledWith(
        { NguoiNhanId: "user1", DaDoc: false },
        expect.any(Number),
        expect.any(Number),
        expect.any(Object)
      );
    });
  });

  describe("getUnreadCount", () => {
    test("trả về số lượng thông báo chưa đọc", async () => {
      notificationRepository.count.mockResolvedValueOnce(5);

      const count = await getUnreadCount("user1");

      expect(notificationRepository.count).toHaveBeenCalledWith({
        NguoiNhanId: "user1",
        DaDoc: false,
      });
      expect(count).toBe(5);
    });
  });

  describe("markAsRead", () => {
    test("ném lỗi nếu không tìm thấy thông báo", async () => {
      notificationRepository.findById.mockResolvedValueOnce(null);
      await expect(markAsRead("n1", "user1")).rejects.toThrow("Không tìm thấy thông báo");
    });

    test("ném lỗi nếu người nhận không trùng với user đăng nhập", async () => {
      notificationRepository.findById.mockResolvedValueOnce({ Id: "n1", NguoiNhanId: "user_other" });
      await expect(markAsRead("n1", "user1")).rejects.toThrow("Bạn không có quyền thao tác trên thông báo này");
    });

    test("đánh dấu đã đọc thành công", async () => {
      notificationRepository.findById.mockResolvedValueOnce({ Id: "n1", NguoiNhanId: "user1", DaDoc: false });
      notificationRepository.update.mockResolvedValueOnce({ Id: "n1", NguoiNhanId: "user1", DaDoc: true });

      const result = await markAsRead("n1", "user1");

      expect(notificationRepository.update).toHaveBeenCalledWith("n1", { DaDoc: true });
      expect(result.isRead).toBe(true);
    });
  });

  describe("markAllAsRead", () => {
    test("đánh dấu đã đọc toàn bộ thông báo chưa đọc", async () => {
      notificationRepository.updateMany.mockResolvedValueOnce({ count: 3 });

      const result = await markAllAsRead("user1");

      expect(notificationRepository.updateMany).toHaveBeenCalledWith(
        { NguoiNhanId: "user1", DaDoc: false },
        { DaDoc: true }
      );
      expect(result).toEqual({ count: 3 });
    });
  });

  describe("createNotification", () => {
    test("tạo thông báo đơn lẻ thành công", async () => {
      notificationRepository.create.mockResolvedValueOnce({ Id: "n1" });

      const payload = {
        recipientId: "user1",
        senderId: "sender1",
        type: "INFO",
        title: "T",
        content: "C",
      };
      const result = await createNotification(payload);

      expect(notificationRepository.create).toHaveBeenCalledWith({
        NguoiNhanId: "user1",
        NguoiGuiId: "sender1",
        Loai: "INFO",
        TieuDe: "T",
        NoiDung: "C",
        DuongDan: null,
        Metadata: null,
      });
      expect(result).toEqual({ Id: "n1" });
    });
  });

  describe("createBulkNotifications", () => {
    test("trả về mảng rỗng nếu mảng người nhận rỗng", async () => {
      const result = await createBulkNotifications([], {});
      expect(result).toEqual([]);
      expect(notificationRepository.createMany).not.toHaveBeenCalled();
    });

    test("tạo hàng loạt thông báo thành công", async () => {
      notificationRepository.createMany.mockResolvedValueOnce({ count: 2 });

      const payload = { senderId: "sender1", type: "INFO", title: "T", content: "C" };
      const result = await createBulkNotifications(["u1", "u2"], payload);

      expect(notificationRepository.createMany).toHaveBeenCalledWith([
        { NguoiNhanId: "u1", NguoiGuiId: "sender1", Loai: "INFO", TieuDe: "T", NoiDung: "C", DuongDan: null, Metadata: null },
        { NguoiNhanId: "u2", NguoiGuiId: "sender1", Loai: "INFO", TieuDe: "T", NoiDung: "C", DuongDan: null, Metadata: null },
      ]);
      expect(result).toEqual({ count: 2 });
    });
  });

  describe("user getters", () => {
    test("getAllCanBoChinhTriIds -> trả về danh sách ID cán bộ", async () => {
      userRepository.findPoliticalOfficerIds.mockResolvedValueOnce(["cb1", "cb2"]);
      const result = await getAllCanBoChinhTriIds();
      expect(result).toEqual(["cb1", "cb2"]);
    });

    test("getBiThuOfOrg -> trả về danh sách ID Bí thư của chi bộ", async () => {
      userRepository.findSecretaryOfOrgIds.mockResolvedValueOnce(["bt1"]);
      const result = await getBiThuOfOrg("org1");
      expect(result).toEqual(["bt1"]);
    });
  });
});
