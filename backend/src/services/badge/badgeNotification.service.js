const notificationService = require("../notification.service");

const BADGE_NOTI = {
  ELIGIBLE: "BADGE_ELIGIBLE",
  PROPOSED: "BADGE_PROPOSED",
  APPROVED: "BADGE_APPROVED",
  REJECTED: "BADGE_REJECTED",
};

/**
 * Thông báo hệ thống cho Bí thư về các đảng viên đủ điều kiện niên hạn.
 * Báo để Bí thư vào xem và gửi đề nghị lên trên.
 * @param {string} orgId - ID của tổ chức
 * @param {string} orgName - Tên của tổ chức
 * @param {Array<object>} cases - Danh sách các đảng viên đủ điều kiện
 * @returns {Promise<void>}
 */
const notifyEligibleToBiThu = async (orgId, orgName, cases) => {
  if (!orgId || !cases || cases.length === 0) return;
  const biThuIds = await notificationService.getBiThuOfOrg(orgId);
  if (biThuIds.length === 0) return;

  await notificationService.createBulkNotifications(biThuIds, {
    senderId: null,
    type: BADGE_NOTI.ELIGIBLE,
    title: `${cases.length} đảng viên đủ điều kiện xét tặng Huy hiệu Đảng`,
    content: `Hệ thống đề nghị xem xét đưa ${cases.length} trường hợp vào danh sách đề nghị xét tặng Huy hiệu Đảng.`,
    link: "/badges",
    Metadata: { orgId, orgName: orgName || null, count: cases.length },
  });
};

/**
 * Thông báo cho Cán bộ chính trị khi Bí thư trình danh sách lên.
 * @param {object} data - Thông tin gửi thông báo
 * @param {string} data.senderId - ID người gửi
 * @param {string} data.orgName - Tên của tổ chức
 * @param {number} data.count - Số lượng đề nghị
 * @returns {Promise<void>}
 */
const notifyOrgSubmitToCanBo = async ({ senderId, orgName, count }) => {
  const ids = await notificationService.getAllCanBoChinhTriIds();
  if (ids.length === 0) return;

  await notificationService.createBulkNotifications(ids, {
    senderId: senderId || null,
    type: BADGE_NOTI.PROPOSED,
    title: `${orgName || "Chi bộ"} gửi đề nghị xét tặng Huy hiệu Đảng`,
    content: `${orgName || "Chi bộ"} đã gửi danh sách ${count} đề nghị xét tặng Huy hiệu Đảng để chờ phê duyệt.`,
    link: "/badges",
    Metadata: { orgName: orgName || null, count },
  });
};

/**
 * Thông báo kết quả phê duyệt/từ chối từ Cán bộ chính trị về cho các Bí thư.
 * Kèm lý do nếu bị từ chối để họ biết đường bổ sung/sửa hồ sơ.
 * @param {object} data - Thông tin gửi thông báo
 * @param {string} data.orgId - ID của tổ chức
 * @param {string} data.senderId - ID người gửi
 * @param {string} data.orgName - Tên của tổ chức
 * @param {number} data.count - Số lượng đề nghị
 * @param {boolean} data.approved - Trạng thái phê duyệt
 * @param {string} data.reason - Lý do từ chối
 * @returns {Promise<void>}
 */
const notifyOrgResultToBiThu = async ({
  orgId,
  senderId,
  orgName,
  count,
  approved,
  reason,
}) => {
  if (!orgId) return;
  const biThuIds = await notificationService.getBiThuOfOrg(orgId);
  if (biThuIds.length === 0) return;

  const title = approved
    ? `Danh sách Huy hiệu Đảng của ${orgName || "chi bộ"} đã được phê duyệt`
    : `Danh sách Huy hiệu Đảng của ${orgName || "chi bộ"} bị từ chối`;
  const content = approved
    ? `${count} đề nghị xét tặng Huy hiệu Đảng đã được phê duyệt.`
    : `${count} đề nghị xét tặng Huy hiệu Đảng bị từ chối. Lý do: "${reason}".`;

  await notificationService.createBulkNotifications(biThuIds, {
    senderId: senderId || null,
    type: approved ? BADGE_NOTI.APPROVED : BADGE_NOTI.REJECTED,
    title,
    content,
    link: "/badges",
    Metadata: {
      orgId,
      orgName: orgName || null,
      count,
      approved,
      reason: reason || null,
    },
  });
};

module.exports = {
  BADGE_NOTI,
  notifyEligibleToBiThu,
  notifyOrgSubmitToCanBo,
  notifyOrgResultToBiThu,
};
