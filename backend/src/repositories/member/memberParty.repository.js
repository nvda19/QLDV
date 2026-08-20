const prisma = require("../../infrastructure/database/prisma");

/**
 * Repository cho các bảng Đảng vụ (Vào Đảng, Đánh giá xếp loại)
 */
class MemberPartyRepository {
  /**
   * Upsert thông tin vào Đảng
   * @param {string} DangVienId ID của Đảng viên
   * @param {Object} data Dữ liệu thông tin vào Đảng
   * @returns {Promise<Object>} Đối tượng thông tin vào Đảng đã tạo/cập nhật
   */
  async upsertPartyInfo(DangVienId, data) {
    return prisma.thongTinVaoDang.upsert({
      where: { DangVienId },
      create: { DangVienId, ...data },
      update: data,
    });
  }

  /**
   * Tìm nhiều đánh giá Đảng viên theo điều kiện
   * @param {Object} where Điều kiện tìm kiếm
   * @returns {Promise<Array<Object>>} Danh sách đánh giá Đảng viên
   */
  async findEvaluations(where) {
    return prisma.danhGiaDangVien.findMany({
      where,
      include: {
        DangVien: { include: { LyLichCaNhan: true, ToChucDang: true } },
        QuyetDinh: true,
      },
      orderBy: { Nam: "desc" },
    });
  }

  /**
   * Tìm đánh giá Đảng viên theo ID
   * @param {string} id ID của đánh giá
   * @returns {Promise<Object|null>} Đối tượng đánh giá hoặc null nếu không tìm thấy
   */
  async findEvaluationById(id) {
    return prisma.danhGiaDangVien.findUnique({
      where: { Id: id },
      include: { DangVien: { include: { ToChucDang: true } } },
    });
  }

  /**
   * Tạo đánh giá Đảng viên
   * @param {Object} data Dữ liệu đánh giá Đảng viên
   * @returns {Promise<Object>} Đối tượng đánh giá Đảng viên đã tạo
   */
  async createEvaluation(data) {
    return prisma.danhGiaDangVien.create({ data });
  }

  /**
   * Cập nhật đánh giá Đảng viên
   * @param {string} id ID của đánh giá
   * @param {Object} data Dữ liệu cập nhật
   * @returns {Promise<Object>} Đối tượng đánh giá đã cập nhật
   */
  async updateEvaluation(id, data) {
    return prisma.danhGiaDangVien.update({ where: { Id: id }, data });
  }

  /**
   * Cập nhật nhiều đánh giá Đảng viên theo điều kiện
   * @param {Object} where Điều kiện cập nhật
   * @param {Object} data Dữ liệu cập nhật
   * @param {Object} [tx] Prisma transaction client, dùng khi gọi trong 1 transaction ngoài
   * @returns {Promise<Object>} Kết quả cập nhật (số bản ghi bị ảnh hưởng)
   */
  async updateManyEvaluations(where, data, tx = null) {
    const client = tx || prisma;
    return client.danhGiaDangVien.updateMany({ where, data });
  }

  /**
   * Tìm bản đánh giá gần nhất (năm lớn nhất) của 1 Đảng viên
   * @param {string} DangVienId ID của Đảng viên
   * @returns {Promise<Object|null>} Bản đánh giá gần nhất, hoặc null nếu chưa có
   */
  async findLastEvaluation(DangVienId) {
    return prisma.danhGiaDangVien.findFirst({
      where: { DangVienId },
      orderBy: { Nam: "desc" },
    });
  }

  /**
   * Đếm số đánh giá Đảng viên theo điều kiện
   * @param {Object} where Điều kiện tìm kiếm
   * @returns {Promise<number>} Số lượng bản ghi thoả điều kiện
   */
  async countEvaluations(where) {
    return prisma.danhGiaDangVien.count({ where });
  }

  /**
   * Xóa đánh giá Đảng viên
   * @param {string} id ID của đánh giá
   * @returns {Promise<Object>} Đối tượng đánh giá đã xóa
   */
  async deleteEvaluation(id) {
    return prisma.danhGiaDangVien.delete({ where: { Id: id } });
  }

  /**
   * Xóa nhiều đánh giá Đảng viên theo ID Đảng viên
   * @param {string} DangVienId ID của Đảng viên
   * @returns {Promise<Object>} Kết quả xóa (số bản ghi bị xóa)
   */
  async deleteManyEvaluations(DangVienId) {
    return prisma.danhGiaDangVien.deleteMany({ where: { DangVienId } });
  }

  /**
   * Tạo nhiều đánh giá Đảng viên
   * @param {Array<Object>} data Mảng dữ liệu đánh giá Đảng viên
   * @returns {Promise<Object>} Kết quả tạo (số bản ghi đã tạo)
   */
  async createManyEvaluations(data) {
    return prisma.danhGiaDangVien.createMany({ data });
  }
}

module.exports = new MemberPartyRepository();
