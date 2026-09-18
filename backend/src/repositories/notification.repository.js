const prisma = require("../infrastructure/database/prisma");

function attachNotificationAliases(n) {
  if (!n) return null;
  n.Id = n.id;
  n.NguoiNhanId = n.nguoiNhanId;
  n.NguoiGuiId = n.nguoiGuiId;
  n.Loai = n.loai;
  n.TieuDe = n.tieuDe;
  n.NoiDung = n.noiDung;
  n.DuongDan = n.duongDan;
  n.DaDoc = n.daDoc;
  n.Metadata = n.metadata;
  n.CreatedAt = n.createdAt;
  if (n.nguoiGui) {
    n.nguoiGui.Id = n.nguoiGui.id;
    n.nguoiGui.HoTen = n.nguoiGui.hoTen;
    n.nguoiGui.TenDangNhap = n.nguoiGui.tenDangNhap;
    n.nguoiGui.VaiTro = n.nguoiGui.vaiTro;
    n.NguoiGui = n.nguoiGui;
  }
  return n;
}

function mapNotificationDataToDb(data = {}) {
  const mapped = {};
  if (data.id !== undefined || data.Id !== undefined) mapped.id = data.id !== undefined ? data.id : data.Id;
  if (data.nguoiNhanId !== undefined || data.NguoiNhanId !== undefined) mapped.nguoiNhanId = data.nguoiNhanId !== undefined ? data.nguoiNhanId : data.NguoiNhanId;
  if (data.nguoiGuiId !== undefined || data.NguoiGuiId !== undefined) mapped.nguoiGuiId = data.nguoiGuiId !== undefined ? data.nguoiGuiId : data.NguoiGuiId;
  if (data.loai !== undefined || data.Loai !== undefined) mapped.loai = data.loai !== undefined ? data.loai : data.Loai;
  if (data.tieuDe !== undefined || data.TieuDe !== undefined) mapped.tieuDe = data.tieuDe !== undefined ? data.tieuDe : data.TieuDe;
  if (data.noiDung !== undefined || data.NoiDung !== undefined) mapped.noiDung = data.noiDung !== undefined ? data.noiDung : data.NoiDung;
  if (data.duongDan !== undefined || data.DuongDan !== undefined) mapped.duongDan = data.duongDan !== undefined ? data.duongDan : data.DuongDan;
  if (data.daDoc !== undefined || data.DaDoc !== undefined) mapped.daDoc = data.daDoc !== undefined ? data.daDoc : data.DaDoc;
  if (data.metadata !== undefined || data.Metadata !== undefined) mapped.metadata = data.metadata !== undefined ? data.metadata : data.Metadata;
  return mapped;
}

function mapNotificationWhere(where = {}) {
  const mapped = { ...where };
  if (mapped.Id !== undefined) {
    mapped.id = mapped.Id;
    delete mapped.Id;
  }
  if (mapped.NguoiNhanId !== undefined) {
    mapped.nguoiNhanId = mapped.NguoiNhanId;
    delete mapped.NguoiNhanId;
  }
  if (mapped.NguoiGuiId !== undefined) {
    mapped.nguoiGuiId = mapped.NguoiGuiId;
    delete mapped.NguoiGuiId;
  }
  if (mapped.DaDoc !== undefined) {
    mapped.daDoc = mapped.DaDoc;
    delete mapped.DaDoc;
  }
  if (mapped.Loai !== undefined) {
    mapped.loai = mapped.Loai;
    delete mapped.Loai;
  }
  return mapped;
}

function mapNotificationInclude(include) {
  if (!include) return undefined;
  const mapped = {};
  if (include.NguoiGui || include.nguoiGui) {
    const orig = include.NguoiGui || include.nguoiGui;
    if (orig.select) {
      mapped.nguoiGui = {
        select: {
          id: orig.select.id ?? orig.select.Id ?? true,
          hoTen: orig.select.hoTen ?? orig.select.HoTen ?? true,
          tenDangNhap: orig.select.tenDangNhap ?? orig.select.TenDangNhap ?? true,
          vaiTro: orig.select.vaiTro ?? orig.select.VaiTro ?? true,
        },
      };
    } else {
      mapped.nguoiGui = orig;
    }
  }
  if (include.NguoiNhan || include.nguoiNhan) {
    mapped.nguoiNhan = include.NguoiNhan || include.nguoiNhan;
  }
  return mapped;
}

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
    const list = await prisma.thongBao.findMany({
      where: mapNotificationWhere(where),
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: mapNotificationInclude(include),
    });
    return list.map(attachNotificationAliases);
  }

  /**
   * Đếm số lượng thông báo theo điều kiện
   * @param {Object} where Điều kiện đếm
   * @returns {Promise<number>} Số lượng thông báo
   */
  async count(where) {
    return prisma.thongBao.count({ where: mapNotificationWhere(where) });
  }

  /**
   * Tìm thông báo theo ID
   * @param {string|number} id ID của thông báo
   * @returns {Promise<Object|null>} Đối tượng thông báo hoặc null nếu không tìm thấy
   */
  async findById(id) {
    const parsedId = typeof id === "string" && !isNaN(Number(id)) ? parseInt(id, 10) : id;
    const n = await prisma.thongBao.findUnique({
      where: { id: parsedId },
    });
    return attachNotificationAliases(n);
  }

  /**
   * Cập nhật thông báo
   * @param {string|number} id ID của thông báo
   * @param {Object} data Dữ liệu cập nhật
   * @returns {Promise<Object>} Đối tượng thông báo đã cập nhật
   */
  async update(id, data) {
    const parsedId = typeof id === "string" && !isNaN(Number(id)) ? parseInt(id, 10) : id;
    const n = await prisma.thongBao.update({
      where: { id: parsedId },
      data: mapNotificationDataToDb(data),
    });
    return attachNotificationAliases(n);
  }

  /**
   * Cập nhật nhiều thông báo theo điều kiện
   * @param {Object} where Điều kiện cập nhật
   * @param {Object} data Dữ liệu cập nhật
   * @returns {Promise<Object>} Kết quả cập nhật (số bản ghi bị ảnh hưởng)
   */
  async updateMany(where, data) {
    return prisma.thongBao.updateMany({
      where: mapNotificationWhere(where),
      data: mapNotificationDataToDb(data),
    });
  }

  /**
   * Tạo thông báo
   * @param {Object} data Dữ liệu thông báo
   * @returns {Promise<Object>} Đối tượng thông báo đã tạo
   */
  async create(data) {
    const n = await prisma.thongBao.create({ data: mapNotificationDataToDb(data) });
    return attachNotificationAliases(n);
  }

  /**
   * Tạo nhiều thông báo
   * @param {Array<Object>} data Mảng dữ liệu thông báo
   * @returns {Promise<number>} Số lượng thông báo đã tạo
   */
  async createMany(data) {
    return prisma.thongBao.createMany({ data: data.map(mapNotificationDataToDb) });
  }
}

module.exports = new NotificationRepository();
