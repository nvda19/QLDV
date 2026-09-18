const prisma = require("../../infrastructure/database/prisma");

function attachAttachmentAliases(att) {
  if (!att) return null;
  att.Id = att.id;
  att.DangVienId = att.dangVienId;
  att.TenTaiLieu = att.tenTaiLieu;
  att.LoaiTaiLieu = att.loaiTaiLieu;
  att.FileUrl = att.fileUrl;
  att.FileType = att.fileType;
  att.CreatedAt = att.createdAt;
  att.DeletedAt = att.deletedAt;
  att.DeletedBy = att.deletedBy;
  return att;
}

function mapAttachmentDataToDb(data = {}) {
  const mapped = {};
  if (data.id !== undefined || data.Id !== undefined) mapped.id = data.id !== undefined ? data.id : data.Id;
  if (data.dangVienId !== undefined || data.DangVienId !== undefined) mapped.dangVienId = data.dangVienId !== undefined ? data.dangVienId : data.DangVienId;
  if (data.tenTaiLieu !== undefined || data.TenTaiLieu !== undefined) mapped.tenTaiLieu = data.tenTaiLieu !== undefined ? data.tenTaiLieu : data.TenTaiLieu;
  if (data.loaiTaiLieu !== undefined || data.LoaiTaiLieu !== undefined) mapped.loaiTaiLieu = data.loaiTaiLieu !== undefined ? data.loaiTaiLieu : data.LoaiTaiLieu;
  if (data.fileUrl !== undefined || data.FileUrl !== undefined) mapped.fileUrl = data.fileUrl !== undefined ? data.fileUrl : data.FileUrl;
  if (data.fileType !== undefined || data.FileType !== undefined) mapped.fileType = data.fileType !== undefined ? data.fileType : data.FileType;
  return mapped;
}

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
    const att = await prisma.taiLieuDinhKem.create({ data: mapAttachmentDataToDb(data) });
    return attachAttachmentAliases(att);
  }

  /**
   * Tìm file đính kèm theo ID
   * @param {string} id ID của file đính kèm
   * @returns {Promise<Object|null>} Đối tượng file đính kèm hoặc null nếu không tìm thấy
   */
  async findAttachmentById(id) {
    const att = await prisma.taiLieuDinhKem.findUnique({ where: { id } });
    return attachAttachmentAliases(att);
  }

  /**
   * Tìm file đính kèm theo Đảng viên và ID file
   * @param {string} memberId ID của Đảng viên
   * @param {string} attachmentId ID của file đính kèm
   * @returns {Promise<Object|null>} Đối tượng file đính kèm hoặc null nếu không tìm thấy
   */
  async findAttachmentByMemberAndId(memberId, attachmentId) {
    const att = await prisma.taiLieuDinhKem.findFirst({
      where: { id: attachmentId, dangVienId: memberId },
    });
    return attachAttachmentAliases(att);
  }

  /**
   * Xóa file đính kèm
   * @param {string} id ID của file đính kèm
   * @returns {Promise<Object>} Đối tượng file đính kèm đã xóa
   */
  async deleteAttachment(id) {
    const att = await prisma.taiLieuDinhKem.delete({ where: { id } });
    return attachAttachmentAliases(att);
  }
}

module.exports = new MemberAttachmentRepository();
