const prisma = require("../infrastructure/database/prisma");

/**
 * Repository cho bảng nhật ký hệ thống
 */
class AuditRepository {
  /**
   * Tạo nhật ký hệ thống
   * Lưu ý: dùng để ghi log thủ công (qua `infrastructure/audit/auditLogger.logAction`) cho các
   * thao tác không phải CRUD chuẩn; log CRUD trên các model thuộc `AUDITED_MODELS` đã được
   * Prisma extension tự động ghi, không cần gọi repository này.
   * @param {Object} data Dữ liệu nhật ký hệ thống
   * @returns {Promise<Object>} Bản ghi nhật ký hệ thống vừa tạo
   */
  async create(data) {
    return prisma.nhatKyHeThong.create({
      data: {
        NguoiDungId: data.userId,
        HanhDong: data.action,
        TenBang: data.tableName,
        BanGhiId: data.recordId,
        GiaTriCu: data.oldValue || undefined,
        GiaTriMoi: data.newValue || undefined,
        DiaChiIp: data.ipAddress || undefined,
      },
    });
  }
}

module.exports = new AuditRepository();
