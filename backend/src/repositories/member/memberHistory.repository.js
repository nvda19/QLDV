const prisma = require("../../infrastructure/database/prisma");

/**
 * Repository cho các bảng lịch sử của Đảng viên
 */
class MemberHistoryRepository {
  /**
   * Xóa nhiều lịch sử công tác
   * @param {string} DangVienId ID của Đảng viên
   * @returns {Promise<number>} Số lượng lịch sử công tác đã xóa
   */
  async deleteManyWorkHistory(DangVienId) {
    return prisma.quaTrinhCongTac.deleteMany({ where: { DangVienId } });
  }

  /**
   * Tạo nhiều lịch sử công tác
   * @param {Array<Object>} data Mảng dữ liệu lịch sử công tác
   * @returns {Promise<number>} Số lượng lịch sử công tác đã tạo
   */
  async createManyWorkHistory(data) {
    return prisma.quaTrinhCongTac.createMany({ data });
  }

  /**
   * Tạo mới lịch sử công tác
   * @param {Object} data Dữ liệu lịch sử công tác
   * @returns {Promise<Object>} Đối tượng lịch sử công tác đã tạo
   */
  async createWorkHistory(data) {
    return prisma.quaTrinhCongTac.create({ data });
  }

  /**
   * Cập nhật lịch sử công tác
   * @param {string} id ID của lịch sử công tác
   * @param {Object} data Dữ liệu lịch sử công tác
   * @returns {Promise<Object>} Đối tượng lịch sử công tác đã cập nhật
   */
  async updateWorkHistory(id, data) {
    return prisma.quaTrinhCongTac.update({ where: { Id: id }, data });
  }

  /**
   * Xóa lịch sử công tác
   * @param {string} id ID của lịch sử công tác
   * @returns {Promise<Object>} Đối tượng lịch sử công tác đã xóa
   */
  async deleteWorkHistory(id) {
    return prisma.quaTrinhCongTac.delete({ where: { Id: id } });
  }

  // Quá trình đào tạo (QuaTrinhDaoTao)
  /**
   * Xóa nhiều lịch sử đào tạo
   * @param {string} DangVienId ID của Đảng viên
   * @returns {Promise<number>} Số lượng lịch sử đào tạo đã xóa
   */
  async deleteManyTrainingHistory(DangVienId) {
    return prisma.quaTrinhDaoTao.deleteMany({ where: { DangVienId } });
  }

  /**
   * Tạo nhiều lịch sử đào tạo
   * @param {Array<Object>} data Mảng dữ liệu lịch sử đào tạo
   * @returns {Promise<number>} Số lượng lịch sử đào tạo đã tạo
   */
  async createManyTrainingHistory(data) {
    return prisma.quaTrinhDaoTao.createMany({ data });
  }

  /**
   * Tìm lịch sử đào tạo theo ID
   * @param {string} id ID của lịch sử đào tạo
   * @returns {Promise<Object|null>} Đối tượng lịch sử đào tạo hoặc null nếu không tìm thấy
   */
  async findTrainingById(id) {
    return prisma.quaTrinhDaoTao.findUnique({ where: { Id: id } });
  }

  /**
   * Cập nhật lịch sử đào tạo
   * @param {string} id ID của lịch sử đào tạo
   * @param {Object} data Dữ liệu lịch sử đào tạo
   * @returns {Promise<Object>} Đối tượng lịch sử đào tạo đã cập nhật
   */
  async updateTraining(id, data) {
    return prisma.quaTrinhDaoTao.update({ where: { Id: id }, data });
  }

  /**
   * Tạo mới lịch sử đào tạo
   * @param {Object} data Dữ liệu lịch sử đào tạo
   * @returns {Promise<Object>} Đối tượng lịch sử đào tạo đã tạo
   */
  async createTraining(data) {
    return prisma.quaTrinhDaoTao.create({ data });
  }

  /**
   * Xóa lịch sử đào tạo
   * @param {string} id ID của lịch sử đào tạo
   * @returns {Promise<Object>} Đối tượng lịch sử đào tạo đã xóa
   */
  async deleteTraining(id) {
    return prisma.quaTrinhDaoTao.delete({ where: { Id: id } });
  }

  // Lịch sử quân hàm (LichSuQuanHam)
  /**
   * Xóa nhiều lịch sử quân hàm
   * @param {string} DangVienId ID của Đảng viên
   * @returns {Promise<number>} Số lượng lịch sử quân hàm đã xóa
   */
  async deleteManyRankHistory(DangVienId) {
    return prisma.lichSuQuanHam.deleteMany({ where: { DangVienId } });
  }

  /**
   * Tạo nhiều lịch sử quân hàm
   * @param {Array<Object>} data Mảng dữ liệu lịch sử quân hàm
   * @returns {Promise<number>} Số lượng lịch sử quân hàm đã tạo
   */
  async createManyRankHistory(data) {
    return prisma.lichSuQuanHam.createMany({ data });
  }

  /**
   * Tạo mới lịch sử quân hàm
   * @param {Object} data Dữ liệu lịch sử quân hàm
   * @returns {Promise<Object>} Đối tượng lịch sử quân hàm đã tạo
   */
  async createRankHistory(data) {
    return prisma.lichSuQuanHam.create({ data });
  }

  /**
   * Tìm lịch sử quân hàm theo ID
   * @param {string} id ID của lịch sử quân hàm
   * @returns {Promise<Object|null>} Đối tượng lịch sử quân hàm hoặc null nếu không tìm thấy
   */
  async findRankHistoryById(id) {
    return prisma.lichSuQuanHam.findUnique({ where: { Id: id } });
  }

  /**
   * Cập nhật lịch sử quân hàm
   * @param {string} id ID của lịch sử quân hàm
   * @param {Object} data Dữ liệu lịch sử quân hàm
   * @returns {Promise<Object>} Đối tượng lịch sử quân hàm đã cập nhật
   */
  async updateRankHistory(id, data) {
    return prisma.lichSuQuanHam.update({ where: { Id: id }, data });
  }

  /**
   * Xóa lịch sử quân hàm
   * @param {string} id ID của lịch sử quân hàm
   * @returns {Promise<Object>} Đối tượng lịch sử quân hàm đã xóa
   */
  async deleteRankHistory(id) {
    return prisma.lichSuQuanHam.delete({ where: { Id: id } });
  }
}

module.exports = new MemberHistoryRepository();
