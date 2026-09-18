const prisma = require("../../infrastructure/database/prisma");

function mapPartyInfoDataToDb(data = {}) {
  const mapped = {};
  if (data.dangVienId !== undefined || data.DangVienId !== undefined) mapped.dangVienId = data.dangVienId !== undefined ? data.dangVienId : data.DangVienId;
  if (data.ngayVaoDang !== undefined || data.NgayVaoDang !== undefined) {
    const val = data.ngayVaoDang !== undefined ? data.ngayVaoDang : data.NgayVaoDang;
    mapped.ngayVaoDang = val ? new Date(val) : null;
  }
  if (data.chiBoVaoDang !== undefined || data.ChiBoVaoDang !== undefined) mapped.chiBoVaoDang = data.chiBoVaoDang !== undefined ? data.chiBoVaoDang : data.ChiBoVaoDang;
  if (data.nguoiGioiThieu1 !== undefined || data.NguoiGioiThieu1 !== undefined) mapped.nguoiGioiThieu1 = data.nguoiGioiThieu1 !== undefined ? data.nguoiGioiThieu1 : data.NguoiGioiThieu1;
  if (data.chucVuNGT1 !== undefined || data.ChucVuNGT1 !== undefined) mapped.chucVuNGT1 = data.chucVuNGT1 !== undefined ? data.chucVuNGT1 : data.ChucVuNGT1;
  if (data.nguoiGioiThieu2 !== undefined || data.NguoiGioiThieu2 !== undefined) mapped.nguoiGioiThieu2 = data.nguoiGioiThieu2 !== undefined ? data.nguoiGioiThieu2 : data.NguoiGioiThieu2;
  if (data.chucVuNGT2 !== undefined || data.ChucVuNGT2 !== undefined) mapped.chucVuNGT2 = data.chucVuNGT2 !== undefined ? data.chucVuNGT2 : data.ChucVuNGT2;
  if (data.ngayQuyetDinhKetNap !== undefined || data.NgayQuyetDinhKetNap !== undefined) {
    const val = data.ngayQuyetDinhKetNap !== undefined ? data.ngayQuyetDinhKetNap : data.NgayQuyetDinhKetNap;
    mapped.ngayQuyetDinhKetNap = val ? new Date(val) : null;
  }
  if (data.ngayChinhThuc !== undefined || data.NgayChinhThuc !== undefined) {
    const val = data.ngayChinhThuc !== undefined ? data.ngayChinhThuc : data.NgayChinhThuc;
    mapped.ngayChinhThuc = val ? new Date(val) : null;
  }
  if (data.chiBoChinhThuc !== undefined || data.ChiBoChinhThuc !== undefined) mapped.chiBoChinhThuc = data.chiBoChinhThuc !== undefined ? data.chiBoChinhThuc : data.ChiBoChinhThuc;
  if (data.noiSinhHoatDang !== undefined || data.NoiSinhHoatDang !== undefined) mapped.noiSinhHoatDang = data.noiSinhHoatDang !== undefined ? data.noiSinhHoatDang : data.NoiSinhHoatDang;
  if (data.chucVuDang !== undefined || data.ChucVuDang !== undefined) mapped.chucVuDang = data.chucVuDang !== undefined ? data.chucVuDang : data.ChucVuDang;
  if (data.ngayVaoDoan !== undefined || data.NgayVaoDoan !== undefined) {
    const val = data.ngayVaoDoan !== undefined ? data.ngayVaoDoan : data.NgayVaoDoan;
    mapped.ngayVaoDoan = val ? new Date(val) : null;
  }
  if (data.toChucXaHoi !== undefined || data.ToChucXaHoi !== undefined) mapped.toChucXaHoi = data.toChucXaHoi !== undefined ? data.toChucXaHoi : data.ToChucXaHoi;
  if (data.ngayMienCongTac !== undefined || data.NgayMienCongTac !== undefined) {
    const val = data.ngayMienCongTac !== undefined ? data.ngayMienCongTac : data.NgayMienCongTac;
    mapped.ngayMienCongTac = val ? new Date(val) : null;
  }
  return mapped;
}

function attachPartyInfoAliases(info) {
  if (!info) return null;
  info.DangVienId = info.dangVienId;
  info.NgayVaoDang = info.ngayVaoDang;
  info.ChiBoVaoDang = info.chiBoVaoDang;
  info.NguoiGioiThieu1 = info.nguoiGioiThieu1;
  info.ChucVuNGT1 = info.chucVuNGT1;
  info.NguoiGioiThieu2 = info.nguoiGioiThieu2;
  info.ChucVuNGT2 = info.chucVuNGT2;
  info.NgayQuyetDinhKetNap = info.ngayQuyetDinhKetNap;
  info.NgayChinhThuc = info.ngayChinhThuc;
  info.ChiBoChinhThuc = info.chiBoChinhThuc;
  info.NoiSinhHoatDang = info.noiSinhHoatDang;
  info.ChucVuDang = info.chucVuDang;
  info.NgayVaoDoan = info.ngayVaoDoan;
  info.ToChucXaHoi = info.toChucXaHoi;
  info.NgayMienCongTac = info.ngayMienCongTac;
  return info;
}

function attachEvaluationAliases(ev) {
  if (!ev) return null;
  ev.Id = ev.id;
  ev.DangVienId = ev.dangVienId;
  ev.Nam = ev.nam;
  ev.XepLoai = ev.xepLoai;
  ev.NhanXet = ev.nhanXet;
  ev.TrangThai = ev.trangThai;
  ev.LyDoTuChoi = ev.lyDoTuChoi;
  ev.SoQuyetDinh = ev.soQuyetDinh;
  ev.QuyetDinhId = ev.quyetDinhId;
  if (ev.dangVien) {
    ev.DangVien = ev.dangVien;
    ev.dangVien.Id = ev.dangVien.id;
    if (ev.dangVien.lyLichCaNhan) ev.dangVien.LyLichCaNhan = ev.dangVien.lyLichCaNhan;
    if (ev.dangVien.toChucDang) ev.dangVien.ToChucDang = ev.dangVien.toChucDang;
  }
  if (ev.quyetDinh) {
    ev.QuyetDinh = ev.quyetDinh;
    ev.quyetDinh.Id = ev.quyetDinh.id;
    ev.quyetDinh.SoQuyetDinh = ev.quyetDinh.soQuyetDinh;
  }
  return ev;
}

function mapEvaluationDataToDb(data = {}) {
  const mapped = {};
  if (data.id !== undefined || data.Id !== undefined) mapped.id = data.id !== undefined ? data.id : data.Id;
  if (data.dangVienId !== undefined || data.DangVienId !== undefined) mapped.dangVienId = data.dangVienId !== undefined ? data.dangVienId : data.DangVienId;
  if (data.nam !== undefined || data.Nam !== undefined) {
    const val = data.nam !== undefined ? data.nam : data.Nam;
    mapped.nam = parseInt(val, 10);
  }
  if (data.xepLoai !== undefined || data.XepLoai !== undefined) mapped.xepLoai = data.xepLoai !== undefined ? data.xepLoai : data.XepLoai;
  if (data.nhanXet !== undefined || data.NhanXet !== undefined) mapped.nhanXet = data.nhanXet !== undefined ? data.nhanXet : data.NhanXet;
  if (data.trangThai !== undefined || data.TrangThai !== undefined) mapped.trangThai = data.trangThai !== undefined ? data.trangThai : data.TrangThai;
  if (data.lyDoTuChoi !== undefined || data.LyDoTuChoi !== undefined) mapped.lyDoTuChoi = data.lyDoTuChoi !== undefined ? data.lyDoTuChoi : data.LyDoTuChoi;
  if (data.soQuyetDinh !== undefined || data.SoQuyetDinh !== undefined) mapped.soQuyetDinh = data.soQuyetDinh !== undefined ? data.soQuyetDinh : data.SoQuyetDinh;
  if (data.quyetDinhId !== undefined || data.QuyetDinhId !== undefined) mapped.quyetDinhId = data.quyetDinhId !== undefined ? data.quyetDinhId : data.QuyetDinhId;
  return mapped;
}

function mapEvaluationWhere(where = {}) {
  if (!where || typeof where !== "object") return where;
  const mapped = {};
  for (const [key, value] of Object.entries(where)) {
    if (key === "OR" || key === "AND" || key === "NOT") {
      if (Array.isArray(value)) {
        mapped[key] = value.map(mapEvaluationWhere);
      } else {
        mapped[key] = mapEvaluationWhere(value);
      }
    } else if (key === "DangVien" || key === "dangVien") {
      if (value && typeof value === "object") {
        const dvWhere = {};
        for (const [dk, dv] of Object.entries(value)) {
          if (dk === "ToChucDangId" || dk === "toChucDangId") dvWhere.toChucDangId = dv;
          else if (dk === "Id" || dk === "id") dvWhere.id = dv;
          else if (dk === "DeletedAt" || dk === "deletedAt") dvWhere.deletedAt = dv;
          else dvWhere[dk.charAt(0).toLowerCase() + dk.slice(1)] = dv;
        }
        mapped.dangVien = dvWhere;
      } else {
        mapped.dangVien = value;
      }
    } else if (key === "QuyetDinh" || key === "quyetDinh") {
      if (value && typeof value === "object") {
        const qdWhere = {};
        for (const [qk, qv] of Object.entries(value)) {
          if (qk === "Id" || qk === "id") qdWhere.id = qv;
          else if (qk === "SoQuyetDinh" || qk === "soQuyetDinh") qdWhere.soQuyetDinh = qv;
          else qdWhere[qk.charAt(0).toLowerCase() + qk.slice(1)] = qv;
        }
        mapped.quyetDinh = qdWhere;
      } else {
        mapped.quyetDinh = value;
      }
    } else if (key === "Id" || key === "id") {
      mapped.id = value;
    } else if (key === "DangVienId" || key === "dangVienId") {
      mapped.dangVienId = value;
    } else if (key === "Nam" || key === "nam") {
      mapped.nam = value;
    } else if (key === "TrangThai" || key === "trangThai") {
      mapped.trangThai = value;
    } else if (key === "XepLoai" || key === "xepLoai") {
      mapped.xepLoai = value;
    } else if (key === "LyDoTuChoi" || key === "lyDoTuChoi") {
      mapped.lyDoTuChoi = value;
    } else if (key === "SoQuyetDinh" || key === "soQuyetDinh") {
      mapped.soQuyetDinh = value;
    } else if (key === "QuyetDinhId" || key === "quyetDinhId") {
      mapped.quyetDinhId = value;
    } else {
      mapped[key] = value;
    }
  }
  return mapped;
}

/**
 * Repository cho các bảng Đảng vụ (Vào Đảng, Đánh giá xếp loại)
 */
class MemberPartyRepository {
  /**
   * Upsert thông tin vào Đảng
   * @param {string} dangVienId ID của Đảng viên
   * @param {Object} data Dữ liệu thông tin vào Đảng
   * @returns {Promise<Object>} Đối tượng thông tin vào Đảng đã tạo/cập nhật
   */
  async upsertPartyInfo(dangVienId, data) {
    const dbData = mapPartyInfoDataToDb(data);
    const info = await prisma.thongTinVaoDang.upsert({
      where: { dangVienId },
      create: { dangVienId, ...dbData },
      update: dbData,
    });
    return attachPartyInfoAliases(info);
  }

  /**
   * Tìm nhiều đánh giá Đảng viên theo điều kiện
   * @param {Object} where Điều kiện tìm kiếm
   * @returns {Promise<Array<Object>>} Danh sách đánh giá Đảng viên
   */
  async findEvaluations(where) {
    const evs = await prisma.danhGiaDangVien.findMany({
      where: mapEvaluationWhere(where),
      include: {
        dangVien: { include: { lyLichCaNhan: true, toChucDang: true } },
        quyetDinh: true,
      },
      orderBy: { nam: "desc" },
    });
    return evs.map(attachEvaluationAliases);
  }

  /**
   * Tìm đánh giá Đảng viên theo ID
   * @param {string} id ID của đánh giá
   * @returns {Promise<Object|null>} Đối tượng đánh giá hoặc null nếu không tìm thấy
   */
  async findEvaluationById(id) {
    const ev = await prisma.danhGiaDangVien.findUnique({
      where: { id },
      include: { dangVien: { include: { toChucDang: true } } },
    });
    return attachEvaluationAliases(ev);
  }

  /**
   * Tạo đánh giá Đảng viên
   * @param {Object} data Dữ liệu đánh giá Đảng viên
   * @returns {Promise<Object>} Đối tượng đánh giá Đảng viên đã tạo
   */
  async createEvaluation(data) {
    const ev = await prisma.danhGiaDangVien.create({ data: mapEvaluationDataToDb(data) });
    return attachEvaluationAliases(ev);
  }

  /**
   * Cập nhật đánh giá Đảng viên
   * @param {string} id ID của đánh giá
   * @param {Object} data Dữ liệu cập nhật
   * @returns {Promise<Object>} Đối tượng đánh giá đã cập nhật
   */
  async updateEvaluation(id, data) {
    const ev = await prisma.danhGiaDangVien.update({ where: { id }, data: mapEvaluationDataToDb(data) });
    return attachEvaluationAliases(ev);
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
    return client.danhGiaDangVien.updateMany({ where: mapEvaluationWhere(where), data: mapEvaluationDataToDb(data) });
  }

  /**
   * Tìm bản đánh giá gần nhất (năm lớn nhất) của 1 Đảng viên
   * @param {string} dangVienId ID của Đảng viên
   * @returns {Promise<Object|null>} Bản đánh giá gần nhất, hoặc null nếu chưa có
   */
  async findLastEvaluation(dangVienId) {
    const ev = await prisma.danhGiaDangVien.findFirst({
      where: { dangVienId },
      orderBy: { nam: "desc" },
    });
    return attachEvaluationAliases(ev);
  }

  /**
   * Đếm số đánh giá Đảng viên theo điều kiện
   * @param {Object} where Điều kiện tìm kiếm
   * @returns {Promise<number>} Số lượng bản ghi thoả điều kiện
   */
  async countEvaluations(where) {
    return prisma.danhGiaDangVien.count({ where: mapEvaluationWhere(where) });
  }

  /**
   * Xóa đánh giá Đảng viên
   * @param {string} id ID của đánh giá
   * @returns {Promise<Object>} Đối tượng đánh giá đã xóa
   */
  async deleteEvaluation(id) {
    const ev = await prisma.danhGiaDangVien.delete({ where: { id } });
    return attachEvaluationAliases(ev);
  }

  /**
   * Xóa nhiều đánh giá Đảng viên theo ID Đảng viên
   * @param {string} dangVienId ID của Đảng viên
   * @returns {Promise<Object>} Kết quả xóa (số bản ghi bị xóa)
   */
  async deleteManyEvaluations(dangVienId) {
    return prisma.danhGiaDangVien.deleteMany({ where: { dangVienId } });
  }

  /**
   * Tạo nhiều đánh giá Đảng viên
   * @param {Array<Object>} data Mảng dữ liệu đánh giá Đảng viên
   * @returns {Promise<Object>} Kết quả tạo (số bản ghi đã tạo)
   */
  async createManyEvaluations(data) {
    return prisma.danhGiaDangVien.createMany({ data: data.map(mapEvaluationDataToDb) });
  }
}

module.exports = new MemberPartyRepository();
