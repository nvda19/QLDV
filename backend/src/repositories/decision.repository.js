const prisma = require("../infrastructure/database/prisma");

// Include dùng cho màn xem chi tiết quyết định — kéo theo cả 3 loại bản ghi có thể
// gắn với 1 quyết định (đánh giá, thăng quân hàm, đề xuất huy hiệu), mỗi cái kèm tên đảng viên
const decisionDetailInclude = {
  DanhGiaDangViens: {
    include: { DangVien: { include: { LyLichCaNhan: true } } },
  },
  LichSuQuanHams: {
    include: { DangVien: { include: { LyLichCaNhan: true } } },
  },
  DeXuatHuyHieus: {
    include: { DangVien: { include: { LyLichCaNhan: true } } },
  },
};

/**
 * Repository cho bảng quyết định
 */
class DecisionRepository {
  /**
   * Tìm nhiều quyết định theo điều kiện
   * @param {Object} where Điều kiện tìm kiếm
   * @returns {Promise<Array<Object>>} Danh sách quyết định
   */
  async findAll(where = {}) {
    return prisma.quyetDinh.findMany({ where, orderBy: { CreatedAt: "desc" } });
  }

  /**
   * Tìm một quyết định theo ID, kèm đầy đủ các quan hệ (đánh giá, quân hàm, huy hiệu)
   * @param {string} id ID của quyết định
   * @returns {Promise<Object|null>} Quyết định kèm quan hệ, hoặc null nếu không tìm thấy
   */
  async findByIdWithRelations(id) {
    return prisma.quyetDinh.findUnique({
      where: { Id: id },
      include: decisionDetailInclude,
    });
  }

  /**
   * Tìm một quyết định theo ID
   * @param {string} id ID của quyết định
   * @param {Object} [tx] Prisma transaction client, dùng khi gọi trong 1 transaction ngoài
   * @returns {Promise<Object|null>} Quyết định tương ứng, hoặc null nếu không tìm thấy
   */
  async findById(id, tx = null) {
    const client = tx || prisma;
    return client.quyetDinh.findUnique({ where: { Id: id } });
  }

  /**
   * Tìm một quyết định theo số quyết định
   * @param {string} SoQuyetDinh Số quyết định
   * @param {Object} [tx] Prisma transaction client, dùng khi gọi trong 1 transaction ngoài
   * @returns {Promise<Object|null>} Quyết định tương ứng, hoặc null nếu không tìm thấy
   */
  async findByDecisionNumber(SoQuyetDinh, tx = null) {
    const client = tx || prisma;
    return client.quyetDinh.findUnique({ where: { SoQuyetDinh } });
  }

  /**
   * Tạo mới một quyết định
   * @param {Object} data Dữ liệu quyết định
   * @param {Object} [tx] Prisma transaction client, dùng khi gọi trong 1 transaction ngoài
   * @returns {Promise<Object>} Quyết định vừa tạo
   */
  async create(data, tx = null) {
    const client = tx || prisma;
    return client.quyetDinh.create({ data });
  }

  /**
   * Cập nhật một quyết định theo ID
   * @param {string} id ID của quyết định
   * @param {Object} data Dữ liệu cần cập nhật
   * @returns {Promise<Object>} Quyết định sau khi cập nhật
   */
  async update(id, data) {
    return prisma.quyetDinh.update({ where: { Id: id }, data });
  }

  /**
   * Xóa một quyết định theo ID
   * @param {string} id ID của quyết định
   * @returns {Promise<Object>} Quyết định vừa bị xóa
   */
  async remove(id) {
    return prisma.quyetDinh.delete({ where: { Id: id } });
  }

  /**
   * Gắn lại QuyetDinhId cho các bản ghi cũ chỉ có SoQuyetDinh dạng text mà chưa liên kết
   * Lưu ý: xử lý trường hợp lịch sử quân hàm/đánh giá/đề xuất huy hiệu được nhập trước, chỉ ghi
   * số quyết định dạng text — khi văn bản quyết định chính thức được tạo sau, tự khớp lại quan hệ.
   * @param {string} decisionId ID của quyết định
   * @param {string} SoQuyetDinh Số quyết định
   * @returns {Promise<Array<Object>>} Kết quả liên kết của từng nhóm bản ghi
   */
  async linkUnlinkedRecords(decisionId, SoQuyetDinh) {
    return Promise.all([
      prisma.lichSuQuanHam.updateMany({
        where: { SoQuyetDinh, QuyetDinhId: null },
        data: { QuyetDinhId: decisionId },
      }),
      prisma.danhGiaDangVien.updateMany({
        where: { SoQuyetDinh, QuyetDinhId: null },
        data: { QuyetDinhId: decisionId },
      }),
      prisma.deXuatHuyHieu.updateMany({
        where: { SoQuyetDinhCaNhan: SoQuyetDinh, QuyetDinhId: null },
        data: { QuyetDinhId: decisionId },
      }),
    ]);
  }

  /**
   * Đồng bộ số quyết định mới sang các bản ghi liên quan
   * Lưu ý: chạy cả 2 chiều — cập nhật SoQuyetDinh cho các bản ghi đã gắn QuyetDinhId, đồng thời
   * liên kết thêm các bản ghi chưa gắn nhưng trùng SoQuyetDinh mới, để dữ liệu không lệch nhau
   * khi người dùng đổi số quyết định.
   * @param {string} decisionId ID của quyết định
   * @param {string} SoQuyetDinh Số quyết định
   * @returns {Promise<Array<Object>>} Kết quả đồng bộ và liên kết của từng nhóm bản ghi
   */
  async syncAndLinkRecords(decisionId, SoQuyetDinh) {
    return Promise.all([
      prisma.lichSuQuanHam.updateMany({
        where: { QuyetDinhId: decisionId },
        data: { SoQuyetDinh },
      }),
      prisma.danhGiaDangVien.updateMany({
        where: { QuyetDinhId: decisionId },
        data: { SoQuyetDinh },
      }),
      prisma.deXuatHuyHieu.updateMany({
        where: { QuyetDinhId: decisionId },
        data: { SoQuyetDinhCaNhan: SoQuyetDinh },
      }),
      prisma.lichSuQuanHam.updateMany({
        where: { SoQuyetDinh, QuyetDinhId: null },
        data: { QuyetDinhId: decisionId },
      }),
      prisma.danhGiaDangVien.updateMany({
        where: { SoQuyetDinh, QuyetDinhId: null },
        data: { QuyetDinhId: decisionId },
      }),
      prisma.deXuatHuyHieu.updateMany({
        where: { SoQuyetDinhCaNhan: SoQuyetDinh, QuyetDinhId: null },
        data: { QuyetDinhId: decisionId },
      }),
    ]);
  }
}

module.exports = new DecisionRepository();
