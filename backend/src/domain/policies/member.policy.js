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
  const member = await memberRepository.findById(memberId);
  if (!member) throw new Error("Không tìm thấy đảng viên");

  if (user.role === ROLES.BI_THU) {
    // Bí thư: Chỉ được quyền chỉnh sửa đảng viên trong chi bộ mình trực tiếp phụ trách
    if (member.ToChucDangId !== user.orgId) {
      throw new Error("Bạn không có quyền chỉnh sửa hồ sơ thuộc đơn vị khác");
    }
  } else if (user.role === ROLES.CAN_BO_CHINH_TRI) {
    // Cán bộ chính trị: Chỉ được chỉnh sửa hồ sơ của cấp Đảng bộ, không chỉnh sửa trực tiếp cấp Chi bộ dưới
    if (member.ToChucDang?.ToChucChaId !== null) {
      throw new Error(
        "Bạn không có quyền chỉnh sửa hồ sơ thuộc các chi bộ trực thuộc",
      );
    }
  }
  return member;
};

module.exports = {
  validateWritePermission,
};
