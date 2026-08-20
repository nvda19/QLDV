const auditRepository = require("../../repositories/audit.repository");
const { getAuditContext } = require("./auditContext");

/**
 * Ghi nhật ký hành động thủ công cho các tác vụ nghiệp vụ đặc biệt, dùng khi thao tác
 * không đi qua audit extension tự động của Prisma. Lỗi bên trong bị nuốt luôn - ghi log
 * thất bại không được phép làm gãy luồng nghiệp vụ chính.
 * @param {string} userId ID người dùng thực hiện hành động
 * @param {string} action Hành động đã thực hiện
 * @param {string} tableName Tên bảng bị tác động
 * @param {string} recordId ID bản ghi bị tác động
 * @param {string} oldValue Giá trị cũ của bản ghi
 * @param {string} newValue Giá trị mới của bản ghi
 * @return{Promise<void>}
 */
const logAction = async (
  userId,
  action,
  tableName,
  recordId,
  oldValue,
  newValue,
) => {
  try {
    const { ipAddress } = getAuditContext();

    await auditRepository.create({
      userId,
      action,
      tableName,
      recordId,
      oldValue,
      newValue,
      ipAddress: ipAddress || null,
    });
  } catch (err) {
    console.error("Lỗi khi ghi nhật ký hệ thống:", err);
  }
};

module.exports = { logAction };
