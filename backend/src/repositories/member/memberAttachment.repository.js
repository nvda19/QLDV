const prisma = require("../../infrastructure/database/prisma");

/**
 * Repository cho bảng Tài liệu đính kèm (tệp scan)
 */
class MemberAttachmentRepository {
  /**
   * Tạo mới file đính kèm
   * @param {Object} data Dữ liệu file đính kèm
   * @returns {Promise<Object>} Đối tượng file đính kèm đã tạo
   */
  async createAttachment(data) {
    return prisma.taiLieuDinhKem.create({ data });
  }

  /**
   * Tìm file đính kèm theo ID
   * @param {string} id ID của file đính kèm
   * @returns {Promise<Object|null>} Đối tượng file đính kèm hoặc null nếu không tìm thấy
   */
  async findAttachmentById(id) {
    return prisma.taiLieuDinhKem.findUnique({ where: { Id: id } });
  }

  /**
   * Tìm file đính kèm theo Đảng viên và ID file
   * Lưu ý: luôn kèm điều kiện `DangVienId` để tránh trường hợp một đảng viên xem/xóa được
   * file đính kèm thuộc hồ sơ của đảng viên khác.
   * @param {string} memberId ID của Đảng viên
   * @param {string} attachmentId ID của file đính kèm
   * @returns {Promise<Object|null>} Đối tượng file đính kèm hoặc null nếu không tìm thấy
   */
  async findAttachmentByMemberAndId(memberId, attachmentId) {
    return prisma.taiLieuDinhKem.findFirst({
      where: { Id: attachmentId, DangVienId: memberId },
    });
  }

  /**
   * Xóa file đính kèm
   * @param {string} id ID của file đính kèm
   * @returns {Promise<Object>} Đối tượng file đính kèm đã xóa
   */
  async deleteAttachment(id) {
    return prisma.taiLieuDinhKem.delete({ where: { Id: id } });
  }
}

module.exports = new MemberAttachmentRepository();
