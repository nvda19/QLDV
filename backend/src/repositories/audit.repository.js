const prisma = require("../infrastructure/database/prisma");

/**
 * Repository cho bảng nhật ký hệ thống
 */
class AuditRepository {
  /**
   * Tạo nhật ký hệ thống
   * @param {Object} data Dữ liệu nhật ký hệ thống
   * @returns {Promise<Object>} Bản ghi nhật ký hệ thống vừa tạo
   */
  async create(data) {
    return prisma.nhatKyHeThong.create({
      data: {
        nguoiDungId: data.userId || data.nguoiDungId || data.NguoiDungId,
        hanhDong: data.action || data.hanhDong || data.HanhDong,
        tenBang: data.tableName || data.tenBang || data.TenBang,
        banGhiId: String(data.recordId !== undefined ? data.recordId : data.banGhiId !== undefined ? data.banGhiId : data.BanGhiId),
        giaTriCu: data.oldValue !== undefined ? data.oldValue : data.giaTriCu !== undefined ? data.giaTriCu : data.GiaTriCu || undefined,
        giaTriMoi: data.newValue !== undefined ? data.newValue : data.giaTriMoi !== undefined ? data.giaTriMoi : data.GiaTriMoi || undefined,
        diaChiIp: data.ipAddress || data.diaChiIp || data.DiaChiIp || undefined,
      },
    });
  }
}

module.exports = new AuditRepository();
