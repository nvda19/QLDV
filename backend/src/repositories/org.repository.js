const prisma = require("../infrastructure/database/prisma");

/**
 * Repository cho bảng tổ chức Đảng
 */
class OrgRepository {
  /**
   * Tìm tất cả tổ chức Đảng
   * @returns {Promise<Array<Object>>} Mảng các tổ chức Đảng
   */
  async findAll() {
    return prisma.toChucDang.findMany({
      orderBy: { Ten: "asc" },
    });
  }

  /**
   * Tìm tổ chức Đảng theo ID
   * @param {string} id ID của tổ chức Đảng
   * @returns {Promise<Object|null>} Đối tượng tổ chức Đảng hoặc null nếu không tìm thấy
   */
  async findById(id) {
    return prisma.toChucDang.findUnique({
      where: { Id: id },
    });
  }

  /**
   * Tìm tổ chức Đảng theo tên
   * @param {string} name Tên tổ chức Đảng
   * @returns {Promise<Object|null>} Đối tượng tổ chức Đảng hoặc null nếu không tìm thấy
   */
  async findByName(name) {
    return prisma.toChucDang.findUnique({
      where: { Ten: name },
    });
  }

  /**
   * Tạo tổ chức Đảng
   * @param {Object} data Dữ liệu tổ chức Đảng
   * @returns {Promise<Object>} Đối tượng tổ chức Đảng đã tạo
   */
  async create(data) {
    return prisma.toChucDang.create({
      data: {
        Ten: data.name,
        ToChucChaId: data.parentId ?? null,
      },
    });
  }

  /**
   * Cập nhật tổ chức Đảng
   * @param {string} id ID của tổ chức Đảng
   * @param {Object} data Dữ liệu tổ chức Đảng
   * @returns {Promise<Object>} Đối tượng tổ chức Đảng đã cập nhật
   */
  async update(id, data) {
    return prisma.toChucDang.update({
      where: { Id: id },
      data: {
        Ten: data.name !== undefined ? data.name : undefined,
        ToChucChaId: data.parentId !== undefined ? data.parentId : undefined,
      },
    });
  }

  /**
   * Xóa tổ chức Đảng
   * @param {string} id ID của tổ chức Đảng
   * @returns {Promise<Object>} Đối tượng tổ chức Đảng đã xóa
   */
  async delete(id) {
    return prisma.toChucDang.delete({
      where: { Id: id },
    });
  }

  /**
   * Đếm số Đảng viên thuộc một tổ chức Đảng
   * @param {string} orgId ID của tổ chức Đảng
   * @returns {Promise<number>} Số lượng Đảng viên trong tổ chức Đảng
   */
  async countMembers(orgId) {
    return prisma.dangVien.count({
      where: { ToChucDangId: orgId },
    });
  }
}

module.exports = new OrgRepository();
