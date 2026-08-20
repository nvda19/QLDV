const prisma = require("../infrastructure/database/prisma");

/**
 * Repository cho bảng thông báo
 */
class NotificationRepository {
  /**
   * Tìm nhiều thông báo theo điều kiện, có phân trang
   * @param {Object} where Điều kiện tìm kiếm
   * @param {number} skip Số lượng bản ghi bỏ qua
   * @param {number} take Số lượng bản ghi lấy
   * @param {Object} include Quan hệ cần include
   * @returns {Promise<Array<Object>>} Danh sách thông báo
   */
  async findMany(where, skip, take, include) {
    return prisma.thongBao.findMany({
      where,
      orderBy: { CreatedAt: "desc" },
      skip,
      take,
      include,
    });
  }

  /**
   * Đếm số lượng thông báo theo điều kiện
   * @param {Object} where Điều kiện đếm
   * @returns {Promise<number>} Số lượng thông báo
   */
  async count(where) {
    return prisma.thongBao.count({ where });
  }

  /**
   * Tìm thông báo theo ID
   * @param {string} id ID của thông báo
   * @returns {Promise<Object|null>} Đối tượng thông báo hoặc null nếu không tìm thấy
   */
  async findById(id) {
    return prisma.thongBao.findUnique({
      where: { Id: id },
    });
  }

  /**
   * Cập nhật thông báo
   * @param {string} id ID của thông báo
   * @param {Object} data Dữ liệu cập nhật
   * @returns {Promise<Object>} Đối tượng thông báo đã cập nhật
   */
  async update(id, data) {
    return prisma.thongBao.update({
      where: { Id: id },
      data,
    });
  }

  /**
   * Cập nhật nhiều thông báo theo điều kiện
   * @param {Object} where Điều kiện cập nhật
   * @param {Object} data Dữ liệu cập nhật
   * @returns {Promise<Object>} Kết quả cập nhật (số bản ghi bị ảnh hưởng)
   */
  async updateMany(where, data) {
    return prisma.thongBao.updateMany({
      where,
      data,
    });
  }

  /**
   * Tạo thông báo
   * @param {Object} data Dữ liệu thông báo
   * @returns {Promise<Object>} Đối tượng thông báo đã tạo
   */
  async create(data) {
    return prisma.thongBao.create({ data });
  }

  /**
   * Tạo nhiều thông báo
   * @param {Array<Object>} data Mảng dữ liệu thông báo
   * @returns {Promise<number>} Số lượng thông báo đã tạo
   */
  async createMany(data) {
    return prisma.thongBao.createMany({ data });
  }
}

module.exports = new NotificationRepository();
