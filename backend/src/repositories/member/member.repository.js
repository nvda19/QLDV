const prisma = require("../../infrastructure/database/prisma");

/**
 * Định nghĩa các quan hệ lồng nhau cần nạp đầy đủ khi truy vấn hồ sơ Đảng viên (dùng cho phiếu đảng viên)
 * @returns {Object} Đối tượng chứa các quan hệ lồng nhau đầy đủ của Đảng viên (11 bảng con)
 */
const dangVienDetailInclude = {
  ToChucDang: true,
  LyLichCaNhan: true,
  ThongTinVaoDang: true,
  TrinhDoHocVan: true,
  TuyenDungQuanNgu: true,
  SucKhoeChinhSach: true,
  KhenThuongKyLuat: { include: { QuyetDinh: true } },
  DacDiemLyLich: true,
  DanhSachQuanHeGiaDinh: true,
  DanhSachCongTac: { orderBy: { TuThangNam: "desc" } },
  DanhSachDaoTao: { orderBy: { TuNgay: "desc" } },
  DanhSachDanhGia: { include: { QuyetDinh: true }, orderBy: { Nam: "desc" } },
  DanhSachQuanHam: {
    include: { QuyetDinh: true },
    orderBy: { NgayHieuLuc: "desc" },
  },
  DanhSachTaiLieu: true,
};

/**
 * Định nghĩa các quan hệ lồng nhau cơ bản cần nạp khi truy vấn danh sách Đảng viên (dùng cho danh sách)
 * Lưu ý: bỏ bớt vài bảng con ít dùng ở màn danh sách (DacDiemLyLich, DanhSachQuanHeGiaDinh...)
 * so với `dangVienDetailInclude` để tránh nạp thừa dữ liệu khi hiển thị nhiều dòng.
 * @returns {Object} Đối tượng chứa các quan hệ lồng nhau cơ bản của Đảng viên
 */
const dangVienListInclude = {
  ToChucDang: true,
  LyLichCaNhan: true,
  ThongTinVaoDang: true,
  TuyenDungQuanNgu: true,
  KhenThuongKyLuat: { include: { QuyetDinh: true } },
  DanhSachDanhGia: { include: { QuyetDinh: true }, orderBy: { Nam: "desc" } },
  DanhSachQuanHam: { include: { QuyetDinh: true }, orderBy: { NgayHieuLuc: "desc" } },
  DanhSachDaoTao: { orderBy: { TuNgay: "desc" } },
};

/**
 * Tương tác cơ sở dữ liệu cho hồ sơ Đảng viên và các phần liên quan
 */
class MemberRepository {
  get include() {
    return dangVienListInclude;
  }
  get detailInclude() {
    return dangVienDetailInclude;
  }

  /**
   * Tìm tất cả Đảng viên với include cơ bản (dùng cho danh sách)
   * @param {Object} where Điều kiện tìm kiếm
   * @returns {Promise<Array<Object>>} Danh sách Đảng viên
   */
  async findAll(where = {}) {
    return prisma.dangVien.findMany({ where, include: dangVienListInclude });
  }

  /**
   * Tìm tất cả Đảng viên với include tùy chỉnh do caller truyền vào
   * @param {Object} where Điều kiện tìm kiếm
   * @param {Object} include Các quan hệ cần nạp
   * @returns {Promise<Array<Object>>} Danh sách Đảng viên
   */
  async findAllWithInclude(where = {}, include) {
    const query = { where };
    if (include && Object.keys(include).length > 0) query.include = include;
    return prisma.dangVien.findMany(query);
  }

  /**
   * Tìm Đảng viên theo ID (gồm đầy đủ 11 bảng con liên quan)
   * @param {string} id ID của Đảng viên
   * @returns {Promise<Object|null>} Đối tượng Đảng viên hoặc null nếu không tìm thấy
   */
  async findById(id) {
    return prisma.dangVien.findUnique({
      where: { Id: id },
      include: dangVienDetailInclude,
    });
  }

  /**
   * Tìm danh sách ID Đảng viên khớp điều kiện (chỉ lấy cột Id, dùng khi chỉ cần lọc phạm vi)
   * @param {Object} where Điều kiện tìm kiếm
   * @returns {Promise<Array<{Id: string}>>} Danh sách Id Đảng viên
   */
  async findManyIds(where = {}) {
    return prisma.dangVien.findMany({ where, select: { Id: true } });
  }

  /**
   * Lấy thông tin Khen thưởng - Kỷ luật của 1 Đảng viên
   * @param {string} DangVienId ID của Đảng viên
   * @returns {Promise<Object|null>} Đối tượng Khen thưởng - Kỷ luật, hoặc null nếu chưa có
   */
  async findRewardDiscipline(DangVienId) {
    return prisma.khenThuongKyLuat.findUnique({
      where: { DangVienId },
      select: { KyLuat: true },
    });
  }

  /**
   * Tìm Đảng viên đầu tiên khớp điều kiện
   * Lưu ý: cho phép gọi kiểu `findFirst(where)` hoặc `findFirst({ where, ... })` khi caller
   * cần truyền thêm option Prisma khác (orderBy, select...) mà không phải thêm tham số riêng.
   * @param {Object} whereOrQuery Điều kiện tìm kiếm, hoặc cả object query Prisma
   * @returns {Promise<Object|null>} Đối tượng Đảng viên đầu tiên khớp điều kiện, hoặc null
   */
  async findFirst(whereOrQuery) {
    if (whereOrQuery && whereOrQuery.where) {
      return prisma.dangVien.findFirst(whereOrQuery);
    }
    return prisma.dangVien.findFirst({ where: whereOrQuery });
  }

  /**
   * Tạo mới Đảng viên
   * @param {Object} data Dữ liệu Đảng viên
   * @returns {Promise<Object>} Đối tượng Đảng viên đã tạo
   */
  async create(data) {
    return prisma.dangVien.create({ data, include: dangVienDetailInclude });
  }

  /**
   * Cập nhật Đảng viên
   * @param {string} id ID của Đảng viên
   * @param {Object} data Dữ liệu cập nhật
   * @returns {Promise<Object>} Đối tượng Đảng viên đã cập nhật
   */
  async update(id, data) {
    return prisma.dangVien.update({
      where: { Id: id },
      data,
      include: dangVienDetailInclude,
    });
  }

  /**
   * Xóa Đảng viên
   * @param {string} id ID của Đảng viên
   * @returns {Promise<Object>} Đối tượng Đảng viên đã xóa
   */
  async delete(id) {
    return prisma.dangVien.delete({ where: { Id: id } });
  }

  /**
   * Upsert thông tin Lý lịch cá nhân
   * @param {string} DangVienId ID của Đảng viên
   * @param {Object} data Dữ liệu Lý lịch cá nhân
   * @returns {Promise<Object>} Đối tượng Lý lịch cá nhân đã tạo/cập nhật
   */
  async upsertPersonalInfo(DangVienId, data) {
    return prisma.lyLichCaNhan.upsert({
      where: { DangVienId },
      create: { DangVienId, ...data },
      update: data,
    });
  }

  /**
   * Upsert thông tin Trình độ học vấn
   * @param {string} DangVienId ID của Đảng viên
   * @param {Object} data Dữ liệu Trình độ học vấn
   * @returns {Promise<Object>} Đối tượng Trình độ học vấn đã tạo/cập nhật
   */
  async upsertAcademicLevel(DangVienId, data) {
    return prisma.trinhDoHocVan.upsert({
      where: { DangVienId },
      create: { DangVienId, ...data },
      update: data,
    });
  }

  /**
   * Upsert thông tin Tuyển dụng quân sự
   * @param {string} DangVienId ID của Đảng viên
   * @param {Object} data Dữ liệu Tuyển dụng quân sự
   * @returns {Promise<Object>} Đối tượng Tuyển dụng quân sự đã tạo/cập nhật
   */
  async upsertMilitaryRecruitment(DangVienId, data) {
    return prisma.tuyenDungQuanNgu.upsert({
      where: { DangVienId },
      create: { DangVienId, ...data },
      update: data,
    });
  }

  /**
   * Upsert thông tin Sức khỏe - Chính sách
   * @param {string} DangVienId ID của Đảng viên
   * @param {Object} data Dữ liệu Sức khỏe - Chính sách
   * @returns {Promise<Object>} Đối tượng Sức khỏe - Chính sách đã tạo/cập nhật
   */
  async upsertHealthPolicy(DangVienId, data) {
    return prisma.sucKhoeChinhSach.upsert({
      where: { DangVienId },
      create: { DangVienId, ...data },
      update: data,
    });
  }

  /**
   * Upsert thông tin Khen thưởng - Kỷ luật
   * @param {string} DangVienId ID của Đảng viên
   * @param {Object} data Dữ liệu Khen thưởng - Kỷ luật
   * @returns {Promise<Object>} Đối tượng Khen thưởng - Kỷ luật đã tạo/cập nhật
   */
  async upsertRewardDiscipline(DangVienId, data) {
    return prisma.khenThuongKyLuat.upsert({
      where: { DangVienId },
      create: { DangVienId, ...data },
      update: data,
    });
  }

  /**
   * Upsert đặc điểm lý lịch
   * @param {string} DangVienId ID của Đảng viên
   * @param {Object} data Dữ liệu đặc điểm lý lịch
   * @returns {Promise<Object>} Đối tượng Đặc điểm lý lịch đã tạo/cập nhật
   */
  async upsertBackgroundFeatures(DangVienId, data) {
    return prisma.dacDiemLyLich.upsert({
      where: { DangVienId },
      create: { DangVienId, ...data },
      update: data,
    });
  }

  /**
   * Xóa toàn bộ quan hệ gia đình của một Đảng viên
   * @param {string} DangVienId ID của Đảng viên
   * @returns {Promise<number>} Số lượng quan hệ gia đình đã xóa
   */
  async deleteManyFamilyRelations(DangVienId) {
    return prisma.quanHeGiaDinh.deleteMany({ where: { DangVienId } });
  }

  /**
   * Tạo hàng loạt quan hệ gia đình
   * @param {Array<Object>} data Danh sách dữ liệu quan hệ gia đình
   * @returns {Promise<number>} Số lượng quan hệ gia đình đã tạo
   */
  async createManyFamilyRelations(data) {
    return prisma.quanHeGiaDinh.createMany({ data });
  }

  /**
   * Tạo mới một quan hệ gia đình
   * @param {Object} data Dữ liệu quan hệ gia đình
   * @returns {Promise<Object>} Đối tượng quan hệ gia đình đã tạo
   */
  async createFamilyRelation(data) {
    return prisma.quanHeGiaDinh.create({ data });
  }

  /**
   * Cập nhật quan hệ gia đình
   * @param {string} id ID của quan hệ gia đình
   * @param {Object} data Dữ liệu cập nhật
   * @returns {Promise<Object>} Đối tượng quan hệ gia đình đã cập nhật
   */
  async updateFamilyRelation(id, data) {
    return prisma.quanHeGiaDinh.update({ where: { Id: id }, data });
  }

  /**
   * Xóa một quan hệ gia đình
   * @param {string} id ID của quan hệ gia đình
   * @returns {Promise<Object>} Đối tượng quan hệ gia đình đã xóa
   */
  async deleteFamilyRelation(id) {
    return prisma.quanHeGiaDinh.delete({ where: { Id: id } });
  }

  /**
   * Tìm nhật ký hệ thống theo điều kiện
   * @param {Object} where Điều kiện tìm kiếm
   * @returns {Promise<Array<Object>>} Danh sách nhật ký hệ thống, sắp xếp theo thời gian tạo tăng dần
   */
  async findAuditLogs(where) {
    return prisma.nhatKyHeThong.findMany({
      where,
      orderBy: { CreatedAt: "asc" },
    });
  }
}

module.exports = new MemberRepository();
