const notificationRepository = require("../repositories/notification.repository");
const userRepository = require("../repositories/user.repository");

/**
 * Lấy danh sách thông báo của một người dùng, có phân trang và tùy chọn chỉ lấy chưa đọc.
 * @param {string} userId
 * @param {Object} options
 * @param {number} options.page
 * @param {number} options.limit
 * @param {boolean} options.unreadOnly
 * @returns {Promise<Object>}
 */
const getNotifications = async (
  userId,
  { page = 1, limit = 20, unreadOnly = false } = {},
) => {
  const where = { NguoiNhanId: userId };
  if (unreadOnly) {
    where.DaDoc = false;
  }

  const [notifications, total] = await Promise.all([
    notificationRepository.findMany(where, (page - 1) * limit, limit, {
      NguoiGui: {
        select: { Id: true, HoTen: true, TenDangNhap: true, VaiTro: true },
      },
    }),
    notificationRepository.count(where),
  ]);

  return {
    notifications: notifications.map(mapToFrontend),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Đếm số thông báo chưa đọc của người dùng — dùng để hiển thị số badge trên icon chuông.
 * @param {string} userId
 * @returns {Promise<number>}
 */
const getUnreadCount = async (userId) => {
  return notificationRepository.count({
    NguoiNhanId: userId,
    DaDoc: false,
  });
};

/**
 * Đánh dấu một thông báo là đã đọc.
 * Lưu ý: kiểm tra `NguoiNhanId` phải trùng `userId` gọi hàm — chặn người dùng đánh dấu
 * đã đọc thông báo của người khác.
 * @param {string} notificationId
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await notificationRepository.findById(notificationId);
  if (!notification) throw new Error("Không tìm thấy thông báo");
  if (notification.NguoiNhanId !== userId) {
    throw new Error("Bạn không có quyền thao tác trên thông báo này");
  }

  const updated = await notificationRepository.update(notificationId, {
    DaDoc: true,
  });
  return mapToFrontend(updated);
};

/**
 * Đánh dấu toàn bộ thông báo chưa đọc của một người dùng là đã đọc.
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const markAllAsRead = async (userId) => {
  const result = await notificationRepository.updateMany(
    {
      NguoiNhanId: userId,
      DaDoc: false,
    },
    { DaDoc: true },
  );
  return { count: result.count };
};

/**
 * Tạo một thông báo đơn lẻ.
 * @param {string} recipientId
 * @param {string} senderId
 * @param {string} type
 * @param {string} title
 * @param {string} content
 * @param {string} link
 * @param {Object} Metadata
 * @returns {Promise<Object>}
 */
const createNotification = async ({
  recipientId,
  senderId,
  type,
  title,
  content,
  link,
  Metadata,
}) => {
  const notification = await notificationRepository.create({
    NguoiNhanId: recipientId,
    NguoiGuiId: senderId || null,
    Loai: type,
    TieuDe: title,
    NoiDung: content,
    DuongDan: link || null,
    Metadata: Metadata || null,
  });
  return notification;
};

/**
 * Tạo hàng loạt thông báo, mỗi người nhận một bản ghi (vd: báo toàn bộ Bí thư chi bộ).
 * @param {string[]} recipientIds
 * @param {Object} options
 * @param {string} options.senderId
 * @param {string} options.type
 * @param {string} options.title
 * @param {string} options.content
 * @param {string} options.link
 * @param {Object} options.Metadata
 * @returns {Promise<Object>}
 */
const createBulkNotifications = async (
  recipientIds,
  { senderId, type, title, content, link, Metadata },
) => {
  if (!recipientIds || recipientIds.length === 0) return [];

  const data = recipientIds.map((recipientId) => ({
    NguoiNhanId: recipientId,
    NguoiGuiId: senderId || null,
    Loai: type,
    TieuDe: title,
    NoiDung: content,
    DuongDan: link || null,
    Metadata: Metadata || null,
  }));

  const result = await notificationRepository.createMany(data);
  return result;
};

/**
 * Lấy danh sách id của toàn bộ cán bộ chính trị.
 * @returns {Promise<string[]>}
 */
const getAllCanBoChinhTriIds = async () => {
  return userRepository.findPoliticalOfficerIds();
};

/**
 * Lấy danh sách id các Bí thư thuộc một tổ chức Đảng.
 * @param {string} orgId
 * @returns {Promise<string[]>}
 */
const getBiThuOfOrg = async (orgId) => {
  return userRepository.findSecretaryOfOrgIds(orgId);
};

/**
 * Map bản ghi thông báo trong DB sang shape trả về cho frontend.
 * @param {Object} n
 * @returns {Object}
 */
const mapToFrontend = (n) => ({
  id: n.Id,
  recipientId: n.NguoiNhanId,
  senderId: n.NguoiGuiId,
  senderName: n.NguoiGui?.HoTen || n.NguoiGui?.TenDangNhap || null,
  type: n.Loai,
  title: n.TieuDe,
  content: n.NoiDung,
  link: n.DuongDan,
  isRead: n.DaDoc,
  metadata: n.Metadata,
  createdAt: n.CreatedAt,
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
  createBulkNotifications,
  getAllCanBoChinhTriIds,
  getBiThuOfOrg,
};
