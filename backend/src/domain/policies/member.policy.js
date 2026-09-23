const memberRepository = require("../../repositories/member/member.repository");
const { ROLES } = require("../constants/member.constants");

/**
 * Kiểm tra quyền ghi/chỉnh sửa hồ sơ đảng viên theo phân cấp quản lý của từng vai trò
 * @param {number} memberId ID của đảng viên cần kiểm tra
 * @param {Object} user Thông tin người dùng đang thao tác
 * @returns {Promise<Object>} Bản ghi đảng viên, trả về luôn để service khỏi phải truy vấn lại
 * @throws {Error} Nếu không tìm thấy đảng viên hoặc user không có quyền chỉnh sửa
 */
const validateWritePermission = async (memberId, user) => {
  if (user.role === ROLES.DANG_VIEN) {
    throw new Error("Đảng viên chỉ có quyền xem, không được chỉnh sửa hồ sơ.");
  }

  const member = await memberRepository.findById(memberId);
  if (!member) throw new Error("Không tìm thấy đảng viên");

  if (user.role === ROLES.BI_THU) {
    // Bí thư: Chỉ được quyền chỉnh sửa đảng viên trong chi bộ mình trực tiếp phụ trách
    const orgId = member.ToChucDangId || member.toChucDangId;
    if (orgId !== user.orgId) {
      throw new Error("Bạn không có quyền chỉnh sửa hồ sơ thuộc đơn vị khác");
    }
  } else if (user.role === ROLES.CAN_BO_CHINH_TRI) {
    // Cán bộ chính trị: Có toàn quyền quản trị, chỉnh sửa tất cả đảng viên trong hệ thống
  }
  return member;
};

/**
 * Kiểm tra quyền đọc/xem hồ sơ đảng viên theo phân cấp quản lý của từng vai trò
 * @param {string} memberId ID của đảng viên cần kiểm tra
 * @param {Object} user Thông tin người dùng đang thao tác
 * @returns {Promise<Object>} Bản ghi đảng viên
 * @throws {Error} Nếu user không có quyền đọc hồ sơ
 */
const validateReadPermission = async (memberId, user) => {
  const member = await memberRepository.findById(memberId);
  if (!member) throw new Error("Không tìm thấy đảng viên");

  if (user.role === ROLES.DANG_VIEN) {
    // Đảng viên chỉ được xem hồ sơ của chính mình
    if (!user.memberId || user.memberId !== memberId) {
      throw new Error("Bạn chỉ có quyền xem hồ sơ của chính bản thân mình");
    }
  } else if (user.role === ROLES.BI_THU) {
    // Bí thư chỉ được xem đảng viên trong chi bộ mình (hoặc có trong lịch sử chi bộ)
    const orgId = member.ToChucDangId || member.toChucDangId;
    if (orgId !== user.orgId) {
      const auditLogs = await memberRepository.findAuditLogs({
        TenBang: "DANG_VIEN",
        BanGhiId: memberId,
      });
      const belonged = auditLogs.some((log) => {
        const c1 = log.GiaTriCu?.ToChucDangId || log.giaTriCu?.toChucDangId;
        const c2 = log.GiaTriMoi?.ToChucDangId || log.giaTriMoi?.toChucDangId;
        return c1 === user.orgId || c2 === user.orgId;
      });
      if (!belonged) {
        throw new Error("Bạn không có quyền xem hồ sơ đảng viên thuộc đơn vị khác");
      }
    }
  }
  return member;
};

module.exports = {
  validateWritePermission,
  validateReadPermission,
};
