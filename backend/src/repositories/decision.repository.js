const prisma = require("../infrastructure/database/prisma");

const decisionDetailInclude = {
  danhGiaDangViens: {
    include: { dangVien: { include: { lyLichCaNhan: true } } },
  },
  lichSuQuanHams: {
    include: { dangVien: { include: { lyLichCaNhan: true } } },
  },
  deXuatHuyHieus: {
    include: { dangVien: { include: { lyLichCaNhan: true } } },
  },
  khenThuongKyLuats: {
    include: { dangVien: { include: { lyLichCaNhan: true } } },
  },
};

/**
 * Gắn alias PascalCase lên object quyết định để tương thích ngược
 * @param {Object} qd 
 * @returns {Object}
 */
function attachDecisionAliases(qd) {
  if (!qd) return null;
  const id = qd.id !== undefined ? qd.id : qd.Id;
  const soQuyetDinh = qd.soQuyetDinh !== undefined ? qd.soQuyetDinh : qd.SoQuyetDinh;
  const tenQuyetDinh = qd.tenQuyetDinh !== undefined ? qd.tenQuyetDinh : qd.TenQuyetDinh;
  const loaiQuyetDinh = qd.loaiQuyetDinh !== undefined ? qd.loaiQuyetDinh : qd.LoaiQuyetDinh;
  const ngayBanHanh = qd.ngayBanHanh !== undefined ? qd.ngayBanHanh : qd.NgayBanHanh;
  const taiLieuUrl = qd.taiLieuUrl !== undefined ? qd.taiLieuUrl : qd.TaiLieuUrl;
  const taiLieuName = qd.taiLieuName !== undefined ? qd.taiLieuName : qd.TaiLieuName;
  const createdAt = qd.createdAt !== undefined ? qd.createdAt : qd.CreatedAt;
  const updatedAt = qd.updatedAt !== undefined ? qd.updatedAt : qd.UpdatedAt;

  qd.id = id;
  qd.Id = id;
  qd.soQuyetDinh = soQuyetDinh;
  qd.SoQuyetDinh = soQuyetDinh;
  qd.tenQuyetDinh = tenQuyetDinh;
  qd.TenQuyetDinh = tenQuyetDinh;
  qd.loaiQuyetDinh = loaiQuyetDinh;
  qd.LoaiQuyetDinh = loaiQuyetDinh;
  qd.ngayBanHanh = ngayBanHanh;
  qd.NgayBanHanh = ngayBanHanh;
  qd.taiLieuUrl = taiLieuUrl;
  qd.TaiLieuUrl = taiLieuUrl;
  qd.taiLieuName = taiLieuName;
  qd.TaiLieuName = taiLieuName;
  qd.createdAt = createdAt;
  qd.CreatedAt = createdAt;
  qd.updatedAt = updatedAt;
  qd.UpdatedAt = updatedAt;

  if (qd.danhGiaDangViens || qd.DanhGiaDangViens) {
    const list = qd.danhGiaDangViens || qd.DanhGiaDangViens;
    qd.danhGiaDangViens = list;
    qd.DanhGiaDangViens = list;
  }
  if (qd.lichSuQuanHams || qd.LichSuQuanHams) {
    const list = qd.lichSuQuanHams || qd.LichSuQuanHams;
    qd.lichSuQuanHams = list;
    qd.LichSuQuanHams = list;
  }
  if (qd.deXuatHuyHieus || qd.DeXuatHuyHieus) {
    const list = qd.deXuatHuyHieus || qd.DeXuatHuyHieus;
    qd.deXuatHuyHieus = list;
    qd.DeXuatHuyHieus = list;
  }
  if (qd.khenThuongKyLuats || qd.KhenThuongKyLuats) {
    const list = qd.khenThuongKyLuats || qd.KhenThuongKyLuats;
    qd.khenThuongKyLuats = list;
    qd.KhenThuongKyLuats = list;
  }
  return qd;
}

/**
 * Chuyển đổi payload data sang camelCase cho Prisma
 */
function mapDecisionDataToDb(data = {}) {
  const mapped = {};
  if (data.id !== undefined || data.Id !== undefined) mapped.id = data.id !== undefined ? data.id : data.Id;
  if (data.soQuyetDinh !== undefined || data.SoQuyetDinh !== undefined) mapped.soQuyetDinh = data.soQuyetDinh !== undefined ? data.soQuyetDinh : data.SoQuyetDinh;
  if (data.tenQuyetDinh !== undefined || data.TenQuyetDinh !== undefined) mapped.tenQuyetDinh = data.tenQuyetDinh !== undefined ? data.tenQuyetDinh : data.TenQuyetDinh;
  if (data.loaiQuyetDinh !== undefined || data.LoaiQuyetDinh !== undefined) mapped.loaiQuyetDinh = data.loaiQuyetDinh !== undefined ? data.loaiQuyetDinh : data.LoaiQuyetDinh;
  if (data.ngayBanHanh !== undefined || data.NgayBanHanh !== undefined) mapped.ngayBanHanh = data.ngayBanHanh !== undefined ? data.ngayBanHanh : data.NgayBanHanh;
  if (data.taiLieuUrl !== undefined || data.TaiLieuUrl !== undefined) mapped.taiLieuUrl = data.taiLieuUrl !== undefined ? data.taiLieuUrl : data.TaiLieuUrl;
  if (data.taiLieuName !== undefined || data.TaiLieuName !== undefined) mapped.taiLieuName = data.taiLieuName !== undefined ? data.taiLieuName : data.TaiLieuName;
  return mapped;
}

/**
 * Chuyển đổi điều kiện tìm kiếm where sang camelCase cho Prisma
 */
function mapDecisionWhere(where = {}) {
  const mapped = { ...where };
  if (mapped.LoaiQuyetDinh !== undefined) {
    mapped.loaiQuyetDinh = mapped.LoaiQuyetDinh;
    delete mapped.LoaiQuyetDinh;
  }
  if (mapped.SoQuyetDinh !== undefined) {
    mapped.soQuyetDinh = mapped.SoQuyetDinh;
    delete mapped.SoQuyetDinh;
  }
  if (mapped.Id !== undefined) {
    mapped.id = mapped.Id;
    delete mapped.Id;
  }
  return mapped;
}

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
    const qds = await prisma.quyetDinh.findMany({ where: mapDecisionWhere(where), orderBy: { createdAt: "desc" } });
    return qds.map(attachDecisionAliases);
  }

  /**
   * Tìm một quyết định theo ID, kèm đầy đủ các quan hệ (đánh giá, quân hàm, huy hiệu)
   * @param {string} id ID của quyết định
   * @returns {Promise<Object|null>} Quyết định kèm quan hệ, hoặc null nếu không tìm thấy
   */
  async findByIdWithRelations(id) {
    const qd = await prisma.quyetDinh.findUnique({
      where: { id },
      include: decisionDetailInclude,
    });
    return attachDecisionAliases(qd);
  }

  /**
   * Tìm một quyết định theo ID
   * @param {string} id ID của quyết định
   * @param {Object} [tx] Prisma transaction client, dùng khi gọi trong 1 transaction ngoài
   * @returns {Promise<Object|null>} Quyết định tương ứng, hoặc null nếu không tìm thấy
   */
  async findById(id, tx = null) {
    const client = tx || prisma;
    const qd = await client.quyetDinh.findUnique({ where: { id } });
    return attachDecisionAliases(qd);
  }

  /**
   * Tìm một quyết định theo số quyết định
   * @param {string} soQuyetDinh Số quyết định
   * @param {Object} [tx] Prisma transaction client, dùng khi gọi trong 1 transaction ngoài
   * @returns {Promise<Object|null>} Quyết định tương ứng, hoặc null nếu không tìm thấy
   */
  async findByDecisionNumber(soQuyetDinh, tx = null) {
    const client = tx || prisma;
    const qd = await client.quyetDinh.findUnique({ where: { soQuyetDinh } });
    return attachDecisionAliases(qd);
  }

  /**
   * Tạo mới một quyết định
   * @param {Object} data Dữ liệu quyết định
   * @param {Object} [tx] Prisma transaction client, dùng khi gọi trong 1 transaction ngoài
   * @returns {Promise<Object>} Quyết định vừa tạo
   */
  async create(data, tx = null) {
    const client = tx || prisma;
    const qd = await client.quyetDinh.create({ data: mapDecisionDataToDb(data) });
    return attachDecisionAliases(qd);
  }

  /**
   * Cập nhật một quyết định theo ID
   * @param {string} id ID của quyết định
   * @param {Object} data Dữ liệu cần cập nhật
   * @returns {Promise<Object>} Quyết định sau khi cập nhật
   */
  async update(id, data) {
    const qd = await prisma.quyetDinh.update({ where: { id }, data: mapDecisionDataToDb(data) });
    return attachDecisionAliases(qd);
  }

  /**
   * Xóa một quyết định theo ID
   * @param {string} id ID của quyết định
   * @returns {Promise<Object>} Quyết định vừa bị xóa
   */
  async remove(id) {
    const qd = await prisma.quyetDinh.delete({ where: { id } });
    return attachDecisionAliases(qd);
  }

  /**
   * Gắn lại quyetDinhId cho các bản ghi cũ chỉ có soQuyetDinh dạng text mà chưa liên kết
   * @param {string} decisionId ID của quyết định
   * @param {string} soQuyetDinh Số quyết định
   * @returns {Promise<Array<Object>>} Kết quả liên kết của từng nhóm bản ghi
   */
  async linkUnlinkedRecords(decisionId, soQuyetDinh) {
    return Promise.all([
      prisma.lichSuQuanHam.updateMany({
        where: { soQuyetDinh, quyetDinhId: null },
        data: { quyetDinhId: decisionId },
      }),
      prisma.danhGiaDangVien.updateMany({
        where: { soQuyetDinh, quyetDinhId: null },
        data: { quyetDinhId: decisionId },
      }),
      prisma.deXuatHuyHieu.updateMany({
        where: { soQuyetDinhCaNhan: soQuyetDinh, quyetDinhId: null },
        data: { quyetDinhId: decisionId },
      }),
    ]);
  }

  /**
   * Đồng bộ số quyết định mới sang các bản ghi liên quan
   * @param {string} decisionId ID của quyết định
   * @param {string} soQuyetDinh Số quyết định
   * @returns {Promise<Array<Object>>} Kết quả đồng bộ và liên kết của từng nhóm bản ghi
   */
  async syncAndLinkRecords(decisionId, soQuyetDinh) {
    return Promise.all([
      prisma.lichSuQuanHam.updateMany({
        where: { quyetDinhId: decisionId },
        data: { soQuyetDinh },
      }),
      prisma.danhGiaDangVien.updateMany({
        where: { quyetDinhId: decisionId },
        data: { soQuyetDinh },
      }),
      prisma.deXuatHuyHieu.updateMany({
        where: { quyetDinhId: decisionId },
        data: { soQuyetDinhCaNhan: soQuyetDinh },
      }),
      prisma.lichSuQuanHam.updateMany({
        where: { soQuyetDinh, quyetDinhId: null },
        data: { quyetDinhId: decisionId },
      }),
      prisma.danhGiaDangVien.updateMany({
        where: { soQuyetDinh, quyetDinhId: null },
        data: { quyetDinhId: decisionId },
      }),
      prisma.deXuatHuyHieu.updateMany({
        where: { soQuyetDinhCaNhan: soQuyetDinh, quyetDinhId: null },
        data: { quyetDinhId: decisionId },
      }),
    ]);
  }
}

module.exports = new DecisionRepository();
