const prisma = require("../../infrastructure/database/prisma");

function attachWorkHistoryAliases(item) {
  if (!item) return null;
  item.Id = item.id;
  item.DangVienId = item.dangVienId;
  item.TuThangNam = item.tuThangNam;
  item.DenThangNam = item.denThangNam;
  item.LamGiChucVuDonVi = item.lamGiChucVuDonVi;
  return item;
}

function mapWorkHistoryDataToDb(data = {}) {
  const mapped = {};
  if (data.id !== undefined || data.Id !== undefined) mapped.id = data.id !== undefined ? data.id : data.Id;
  if (data.dangVienId !== undefined || data.DangVienId !== undefined) mapped.dangVienId = data.dangVienId !== undefined ? data.dangVienId : data.DangVienId;
  if (data.tuThangNam !== undefined || data.TuThangNam !== undefined) {
    const val = data.tuThangNam !== undefined ? data.tuThangNam : data.TuThangNam;
    mapped.tuThangNam = val ? new Date(val) : undefined;
  }
  if (data.denThangNam !== undefined || data.DenThangNam !== undefined) {
    const val = data.denThangNam !== undefined ? data.denThangNam : data.DenThangNam;
    mapped.denThangNam = val ? new Date(val) : null;
  }
  if (data.lamGiChucVuDonVi !== undefined || data.LamGiChucVuDonVi !== undefined) {
    mapped.lamGiChucVuDonVi = data.lamGiChucVuDonVi !== undefined ? data.lamGiChucVuDonVi : data.LamGiChucVuDonVi;
  }
  return mapped;
}

function attachTrainingAliases(item) {
  if (!item) return null;
  item.Id = item.id;
  item.DangVienId = item.dangVienId;
  item.TenTruong = item.tenTruong;
  item.NganhHoc = item.nganhHoc;
  item.TuNgay = item.tuNgay;
  item.DenNgay = item.denNgay;
  item.HinhThuc = item.hinhThuc;
  item.VanBang = item.vanBang;
  item.VanBangCert = item.vanBang;
  item.TaiLieuUrl = item.taiLieuUrl;
  return item;
}

function mapTrainingDataToDb(data = {}) {
  const mapped = {};
  if (data.id !== undefined || data.Id !== undefined) mapped.id = data.id !== undefined ? data.id : data.Id;
  if (data.dangVienId !== undefined || data.DangVienId !== undefined) mapped.dangVienId = data.dangVienId !== undefined ? data.dangVienId : data.DangVienId;
  if (data.tenTruong !== undefined || data.TenTruong !== undefined) mapped.tenTruong = data.tenTruong !== undefined ? data.tenTruong : data.TenTruong;
  if (data.nganhHoc !== undefined || data.NganhHoc !== undefined) mapped.nganhHoc = data.nganhHoc !== undefined ? data.nganhHoc : data.NganhHoc;
  if (data.tuNgay !== undefined || data.TuNgay !== undefined) {
    const val = data.tuNgay !== undefined ? data.tuNgay : data.TuNgay;
    mapped.tuNgay = val ? new Date(val) : undefined;
  }
  if (data.denNgay !== undefined || data.DenNgay !== undefined) {
    const val = data.denNgay !== undefined ? data.denNgay : data.DenNgay;
    mapped.denNgay = val ? new Date(val) : undefined;
  }
  if (data.hinhThuc !== undefined || data.HinhThuc !== undefined) mapped.hinhThuc = data.hinhThuc !== undefined ? data.hinhThuc : data.HinhThuc;
  if (data.vanBang !== undefined || data.VanBang !== undefined || data.vanBangCert !== undefined || data.VanBangCert !== undefined) {
    mapped.vanBang = data.vanBang !== undefined ? data.vanBang : data.VanBang !== undefined ? data.VanBang : data.vanBangCert !== undefined ? data.vanBangCert : data.VanBangCert;
  }
  if (data.taiLieuUrl !== undefined || data.TaiLieuUrl !== undefined) mapped.taiLieuUrl = data.taiLieuUrl !== undefined ? data.taiLieuUrl : data.TaiLieuUrl;
  return mapped;
}

function attachRankAliases(item) {
  if (!item) return null;
  item.Id = item.id;
  item.DangVienId = item.dangVienId;
  item.CapBac = item.capBac;
  item.ChucVu = item.chucVu;
  item.DonVi = item.donVi;
  item.NgayHieuLuc = item.ngayHieuLuc;
  item.SoQuyetDinh = item.soQuyetDinh;
  item.QuyetDinhId = item.quyetDinhId;
  item.CreatedAt = item.createdAt;
  if (item.quyetDinh) item.QuyetDinh = item.quyetDinh;
  return item;
}

function mapRankDataToDb(data = {}) {
  const mapped = {};
  if (data.id !== undefined || data.Id !== undefined) mapped.id = data.id !== undefined ? data.id : data.Id;
  if (data.dangVienId !== undefined || data.DangVienId !== undefined) mapped.dangVienId = data.dangVienId !== undefined ? data.dangVienId : data.DangVienId;
  if (data.capBac !== undefined || data.CapBac !== undefined) mapped.capBac = data.capBac !== undefined ? data.capBac : data.CapBac;
  if (data.chucVu !== undefined || data.ChucVu !== undefined) mapped.chucVu = data.chucVu !== undefined ? data.chucVu : data.ChucVu;
  if (data.donVi !== undefined || data.DonVi !== undefined) mapped.donVi = data.donVi !== undefined ? data.donVi : data.DonVi;
  if (data.ngayHieuLuc !== undefined || data.NgayHieuLuc !== undefined) {
    const val = data.ngayHieuLuc !== undefined ? data.ngayHieuLuc : data.NgayHieuLuc;
    mapped.ngayHieuLuc = val ? new Date(val) : undefined;
  }
  if (data.soQuyetDinh !== undefined || data.SoQuyetDinh !== undefined) mapped.soQuyetDinh = data.soQuyetDinh !== undefined ? data.soQuyetDinh : data.SoQuyetDinh;
  if (data.quyetDinhId !== undefined || data.QuyetDinhId !== undefined) mapped.quyetDinhId = data.quyetDinhId !== undefined ? data.quyetDinhId : data.QuyetDinhId;
  return mapped;
}

/**
 * Repository cho các bảng lịch sử của Đảng viên
 */
class MemberHistoryRepository {
  /**
   * Xóa nhiều lịch sử công tác
   * @param {string} dangVienId ID của Đảng viên
   * @returns {Promise<number>} Số lượng lịch sử công tác đã xóa
   */
  async deleteManyWorkHistory(dangVienId) {
    return prisma.quaTrinhCongTac.deleteMany({ where: { dangVienId } });
  }

  /**
   * Tạo nhiều lịch sử công tác
   * @param {Array<Object>} data Mảng dữ liệu lịch sử công tác
   * @returns {Promise<number>} Số lượng lịch sử công tác đã tạo
   */
  async createManyWorkHistory(data) {
    return prisma.quaTrinhCongTac.createMany({ data: data.map(mapWorkHistoryDataToDb) });
  }

  /**
   * Tạo mới lịch sử công tác
   * @param {Object} data Dữ liệu lịch sử công tác
   * @returns {Promise<Object>} Đối tượng lịch sử công tác đã tạo
   */
  async createWorkHistory(data) {
    const item = await prisma.quaTrinhCongTac.create({ data: mapWorkHistoryDataToDb(data) });
    return attachWorkHistoryAliases(item);
  }

  /**
   * Cập nhật lịch sử công tác
   * @param {string} id ID của lịch sử công tác
   * @param {Object} data Dữ liệu lịch sử công tác
   * @returns {Promise<Object>} Đối tượng lịch sử công tác đã cập nhật
   */
  async updateWorkHistory(id, data) {
    const item = await prisma.quaTrinhCongTac.update({ where: { id }, data: mapWorkHistoryDataToDb(data) });
    return attachWorkHistoryAliases(item);
  }

  /**
   * Xóa lịch sử công tác
   * @param {string} id ID của lịch sử công tác
   * @returns {Promise<Object>} Đối tượng lịch sử công tác đã xóa
   */
  async deleteWorkHistory(id) {
    const item = await prisma.quaTrinhCongTac.delete({ where: { id } });
    return attachWorkHistoryAliases(item);
  }

  // Quá trình đào tạo (QuaTrinhDaoTao)
  /**
   * Xóa nhiều lịch sử đào tạo
   * @param {string} dangVienId ID của Đảng viên
   * @returns {Promise<number>} Số lượng lịch sử đào tạo đã xóa
   */
  async deleteManyTrainingHistory(dangVienId) {
    return prisma.quaTrinhDaoTao.deleteMany({ where: { dangVienId } });
  }

  /**
   * Tạo nhiều lịch sử đào tạo
   * @param {Array<Object>} data Mảng dữ liệu lịch sử đào tạo
   * @returns {Promise<number>} Số lượng lịch sử đào tạo đã tạo
   */
  async createManyTrainingHistory(data) {
    return prisma.quaTrinhDaoTao.createMany({ data: data.map(mapTrainingDataToDb) });
  }

  /**
   * Tìm lịch sử đào tạo theo ID
   * @param {string} id ID của lịch sử đào tạo
   * @returns {Promise<Object|null>} Đối tượng lịch sử đào tạo hoặc null nếu không tìm thấy
   */
  async findTrainingById(id) {
    const item = await prisma.quaTrinhDaoTao.findUnique({ where: { id } });
    return attachTrainingAliases(item);
  }

  /**
   * Cập nhật lịch sử đào tạo
   * @param {string} id ID của lịch sử đào tạo
   * @param {Object} data Dữ liệu lịch sử đào tạo
   * @returns {Promise<Object>} Đối tượng lịch sử đào tạo đã cập nhật
   */
  async updateTraining(id, data) {
    const item = await prisma.quaTrinhDaoTao.update({ where: { id }, data: mapTrainingDataToDb(data) });
    return attachTrainingAliases(item);
  }

  /**
   * Tạo mới lịch sử đào tạo
   * @param {Object} data Dữ liệu lịch sử đào tạo
   * @returns {Promise<Object>} Đối tượng lịch sử đào tạo đã tạo
   */
  async createTraining(data) {
    const item = await prisma.quaTrinhDaoTao.create({ data: mapTrainingDataToDb(data) });
    return attachTrainingAliases(item);
  }

  /**
   * Xóa lịch sử đào tạo
   * @param {string} id ID của lịch sử đào tạo
   * @returns {Promise<Object>} Đối tượng lịch sử đào tạo đã xóa
   */
  async deleteTraining(id) {
    const item = await prisma.quaTrinhDaoTao.delete({ where: { id } });
    return attachTrainingAliases(item);
  }

  // Lịch sử quân hàm (LichSuQuanHam)
  /**
   * Xóa nhiều lịch sử quân hàm
   * @param {string} dangVienId ID của Đảng viên
   * @returns {Promise<number>} Số lượng lịch sử quân hàm đã xóa
   */
  async deleteManyRankHistory(dangVienId) {
    return prisma.lichSuQuanHam.deleteMany({ where: { dangVienId } });
  }

  /**
   * Tạo nhiều lịch sử quân hàm
   * @param {Array<Object>} data Mảng dữ liệu lịch sử quân hàm
   * @returns {Promise<number>} Số lượng lịch sử quân hàm đã tạo
   */
  async createManyRankHistory(data) {
    return prisma.lichSuQuanHam.createMany({ data: data.map(mapRankDataToDb) });
  }

  /**
   * Tạo mới lịch sử quân hàm
   * @param {Object} data Dữ liệu lịch sử quân hàm
   * @returns {Promise<Object>} Đối tượng lịch sử quân hàm đã tạo
   */
  async createRankHistory(data) {
    const item = await prisma.lichSuQuanHam.create({ data: mapRankDataToDb(data) });
    return attachRankAliases(item);
  }

  /**
   * Tìm lịch sử quân hàm theo ID
   * @param {string} id ID của lịch sử quân hàm
   * @returns {Promise<Object|null>} Đối tượng lịch sử quân hàm hoặc null nếu không tìm thấy
   */
  async findRankHistoryById(id) {
    const item = await prisma.lichSuQuanHam.findUnique({ where: { id } });
    return attachRankAliases(item);
  }

  /**
   * Cập nhật lịch sử quân hàm
   * @param {string} id ID của lịch sử quân hàm
   * @param {Object} data Dữ liệu lịch sử quân hàm
   * @returns {Promise<Object>} Đối tượng lịch sử quân hàm đã cập nhật
   */
  async updateRankHistory(id, data) {
    const item = await prisma.lichSuQuanHam.update({ where: { id }, data: mapRankDataToDb(data) });
    return attachRankAliases(item);
  }

  /**
   * Xóa lịch sử quân hàm
   * @param {string} id ID của lịch sử quân hàm
   * @returns {Promise<Object>} Đối tượng lịch sử quân hàm đã xóa
   */
  async deleteRankHistory(id) {
    const item = await prisma.lichSuQuanHam.delete({ where: { id } });
    return attachRankAliases(item);
  }
}

module.exports = new MemberHistoryRepository();
