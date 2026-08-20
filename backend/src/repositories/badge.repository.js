const prisma = require("../infrastructure/database/prisma");

/**
 * Repository cho bảng đề xuất Huy hiệu Đảng
 */
class BadgeRepository {
  /**
   * Tìm nhiều đề xuất Huy hiệu Đảng theo điều kiện
   * @param {Object} where Điều kiện tìm kiếm
   * @param {Object} options Tùy chọn truy vấn bổ sung (orderBy, include, ...)
   * @returns {Promise<Array<Object>>} Danh sách đề xuất Huy hiệu Đảng
   */
  findMany(where = {}, options = {}) {
    return prisma.deXuatHuyHieu.findMany({ where, ...options });
  }

  /**
   * Tìm một đề xuất Huy hiệu Đảng theo ID
   * @param {string} id ID của đề xuất Huy hiệu Đảng
   * @returns {Promise<Object|null>} Đề xuất Huy hiệu Đảng tương ứng, hoặc null nếu không tìm thấy
   */
  findById(id) {
    return prisma.deXuatHuyHieu.findUnique({ where: { Id: id } });
  }

  /**
   * Tìm đề xuất Huy hiệu Đảng đầu tiên khớp điều kiện
   * @param {Object} where Điều kiện tìm kiếm
   * @param {Object} [tx] Prisma transaction client, dùng khi gọi trong 1 transaction ngoài
   * @returns {Promise<Object|null>} Đề xuất Huy hiệu Đảng đầu tiên khớp điều kiện, hoặc null
   */
  findFirst(where, tx = null) {
    const client = tx || prisma;
    return client.deXuatHuyHieu.findFirst({ where });
  }

  /**
   * Tạo mới một đề xuất Huy hiệu Đảng
   * @param {Object} data Dữ liệu đề xuất Huy hiệu Đảng
   * @param {Object} [tx] Prisma transaction client, dùng khi gọi trong 1 transaction ngoài
   * @returns {Promise<Object>} Đề xuất Huy hiệu Đảng vừa tạo
   */
  create(data, tx = null) {
    const client = tx || prisma;
    return client.deXuatHuyHieu.create({ data });
  }

  /**
   * Khóa advisory theo memberId (chặn 2 request tạo đề nghị cùng lúc cho cùng 1 đảng viên)
   * rồi kiểm tra xem đã có đề nghị/quyết định nào cho mốc này chưa — phải chạy trong
   * 1 transaction (truyền tx) để khóa có hiệu lực đến hết transaction.
   * @param {string} memberId ID Đảng viên
   * @param {number} moc Mốc huy hiệu (số năm tuổi Đảng)
   * @param {Array<string>} statuses Danh sách trạng thái coi là "đã tồn tại"
   * @param {Object} tx Prisma transaction client
   * @returns {Promise<Object|null>} Đề nghị đã tồn tại khớp mốc, hoặc null nếu chưa có
   */
  async lockAndCheckExisting(memberId, moc, statuses, tx) {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${memberId}))`;
    return tx.deXuatHuyHieu.findFirst({
      where: {
        DangVienId: memberId,
        MocHuyHieu: moc,
        TrangThai: { in: statuses },
      },
    });
  }

  /**
   * Tạo hàng loạt đề xuất Huy hiệu Đảng
   * @param {Array<Object>} data Danh sách dữ liệu đề xuất Huy hiệu Đảng
   * @returns {Promise<Object>} Kết quả tạo hàng loạt (số bản ghi đã tạo)
   */
  createMany(data) {
    return prisma.deXuatHuyHieu.createMany({ data });
  }

  /**
   * Cập nhật một đề xuất Huy hiệu Đảng theo ID
   * @param {string} id ID của đề xuất Huy hiệu Đảng
   * @param {Object} data Dữ liệu cần cập nhật
   * @returns {Promise<Object>} Đề xuất Huy hiệu Đảng sau khi cập nhật
   */
  update(id, data) {
    return prisma.deXuatHuyHieu.update({ where: { Id: id }, data });
  }

  /**
   * Cập nhật hàng loạt đề xuất Huy hiệu Đảng theo điều kiện
   * @param {Object} where Điều kiện áp dụng
   * @param {Object} data Dữ liệu cần cập nhật
   * @param {Object} [tx] Prisma transaction client, dùng khi gọi trong 1 transaction ngoài
   * @returns {Promise<Object>} Kết quả cập nhật hàng loạt (số bản ghi bị ảnh hưởng)
   */
  updateMany(where, data, tx = null) {
    const client = tx || prisma;
    return client.deXuatHuyHieu.updateMany({ where, data });
  }
}

module.exports = new BadgeRepository();
