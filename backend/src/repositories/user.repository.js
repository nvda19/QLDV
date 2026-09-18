const prisma = require("../infrastructure/database/prisma");
const { ROLES } = require("../domain/constants/member.constants");

/**
 * Gắn alias PascalCase lên object người dùng để tương thích ngược
 * @param {Object} u 
 * @returns {Object}
 */
function attachUserAliases(u) {
  if (!u) return null;
  u.Id = u.id;
  u.TenDangNhap = u.tenDangNhap;
  u.MatKhauHash = u.matKhauHash;
  u.VaiTro = u.vaiTro;
  u.ToChucDangId = u.toChucDangId;
  u.HoTen = u.hoTen;
  u.TrangThai = u.trangThai;
  u.SoLanSaiMatKhau = u.soLanSaiMatKhau;
  u.YeuCauDoiMatKhau = u.yeuCauDoiMatKhau;
  u.RefreshToken = u.refreshToken;
  u.CreatedAt = u.createdAt;
  if (u.toChucDang) {
    u.toChucDang.Id = u.toChucDang.id;
    u.toChucDang.Ten = u.toChucDang.ten;
    u.toChucDang.ToChucChaId = u.toChucDang.toChucChaId;
    u.ToChucDang = u.toChucDang;
  }
  return u;
}

/**
 * Chuyển đổi payload data sang camelCase cho Prisma
 */
function mapUserDataToDb(data = {}) {
  const mapped = {};
  if (data.tenDangNhap !== undefined || data.TenDangNhap !== undefined) {
    mapped.tenDangNhap = data.tenDangNhap !== undefined ? data.tenDangNhap : data.TenDangNhap;
  }
  if (data.matKhauHash !== undefined || data.MatKhauHash !== undefined) {
    mapped.matKhauHash = data.matKhauHash !== undefined ? data.matKhauHash : data.MatKhauHash;
  }
  if (data.hoTen !== undefined || data.HoTen !== undefined) {
    mapped.hoTen = data.hoTen !== undefined ? data.hoTen : data.HoTen;
  }
  if (data.vaiTro !== undefined || data.VaiTro !== undefined) {
    mapped.vaiTro = data.vaiTro !== undefined ? data.vaiTro : data.VaiTro;
  }
  if (data.toChucDangId !== undefined || data.ToChucDangId !== undefined) {
    mapped.toChucDangId = data.toChucDangId !== undefined ? data.toChucDangId : data.ToChucDangId;
  }
  if (data.trangThai !== undefined || data.TrangThai !== undefined) {
    mapped.trangThai = data.trangThai !== undefined ? data.trangThai : data.TrangThai;
  }
  if (data.soLanSaiMatKhau !== undefined || data.SoLanSaiMatKhau !== undefined) {
    mapped.soLanSaiMatKhau = data.soLanSaiMatKhau !== undefined ? data.soLanSaiMatKhau : data.SoLanSaiMatKhau;
  }
  if (data.yeuCauDoiMatKhau !== undefined || data.YeuCauDoiMatKhau !== undefined) {
    mapped.yeuCauDoiMatKhau = data.yeuCauDoiMatKhau !== undefined ? data.yeuCauDoiMatKhau : data.YeuCauDoiMatKhau;
  }
  if (data.refreshToken !== undefined || data.RefreshToken !== undefined) {
    mapped.refreshToken = data.refreshToken !== undefined ? data.refreshToken : data.RefreshToken;
  }
  return mapped;
}

/**
 * Repository cho bảng người dùng
 */
class UserRepository {
  /**
   * Tìm nhiều người dùng theo bộ lọc
   * @param {Object} filters Bộ lọc tìm kiếm
   * @returns {Promise<Array<Object>>} Danh sách người dùng
   */
  async findAll(filters = {}) {
    const { search, role, status, orgId } = filters;
    const where = {};

    if (role) where.vaiTro = role;
    if (status) where.trangThai = status;
    if (orgId) where.toChucDangId = orgId;

    if (search) {
      where.OR = [
        { tenDangNhap: { contains: search, mode: "insensitive" } },
        { hoTen: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.nguoiDung.findMany({
      where,
      include: {
        toChucDang: {
          select: {
            id: true,
            ten: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return users.map(attachUserAliases);
  }

  /**
   * Tìm người dùng theo ID
   * @param {string} id ID của người dùng
   * @param {boolean} includeOrg Có bao gồm thông tin tổ chức Đảng không
   * @returns {Promise<Object|null>} Đối tượng người dùng hoặc null nếu không tìm thấy
   */
  async findById(id, includeOrg = false) {
    const user = await prisma.nguoiDung.findUnique({
      where: { id },
      include: includeOrg ? { toChucDang: true } : undefined,
    });
    return attachUserAliases(user);
  }

  /**
   * Tìm người dùng theo tên đăng nhập
   * @param {string} username Tên đăng nhập
   * @returns {Promise<Object|null>} Đối tượng người dùng hoặc null nếu không tìm thấy
   */
  async findByUsername(username) {
    const user = await prisma.nguoiDung.findUnique({
      where: { tenDangNhap: username },
    });
    return attachUserAliases(user);
  }

  /**
   * Tạo tài khoản người dùng
   * @param {Object} data Dữ liệu tài khoản
   * @returns {Promise<Object>} Đối tượng tài khoản đã tạo
   */
  async create(data) {
    const user = await prisma.nguoiDung.create({
      data: mapUserDataToDb(data),
      include: {
        toChucDang: true,
      },
    });
    return attachUserAliases(user);
  }

  /**
   * Cập nhật tài khoản người dùng
   * @param {string} id ID của tài khoản
   * @param {Object} data Dữ liệu cập nhật
   * @returns {Promise<Object>} Đối tượng tài khoản đã cập nhật
   */
  async update(id, data) {
    const user = await prisma.nguoiDung.update({
      where: { id },
      data: mapUserDataToDb(data),
      include: {
        toChucDang: true,
      },
    });
    return attachUserAliases(user);
  }

  /**
   * Xóa tài khoản người dùng
   * @param {string} id ID của tài khoản
   * @returns {Promise<Object>} Đối tượng tài khoản đã xóa
   */
  async delete(id) {
    const user = await prisma.nguoiDung.delete({
      where: { id },
    });
    return attachUserAliases(user);
  }

  /**
   * Tăng số lần đăng nhập sai mật khẩu
   * @param {string} id ID của tài khoản
   * @returns {Promise<Object>} Đối tượng tài khoản sau khi cập nhật (có thể đã bị khóa)
   */
  async incrementFailedAttempts(id) {
    const updatedUser = await prisma.nguoiDung.update({
      where: { id },
      data: {
        soLanSaiMatKhau: {
          increment: 1,
        },
      },
      include: { toChucDang: true },
    });

    if (
      updatedUser.soLanSaiMatKhau >= 5 &&
      updatedUser.trangThai !== "LOCKED"
    ) {
      const lockedUser = await prisma.nguoiDung.update({
        where: { id },
        data: { trangThai: "LOCKED" },
        include: { toChucDang: true },
      });
      return attachUserAliases(lockedUser);
    }

    return attachUserAliases(updatedUser);
  }

  /**
   * Tìm ID của tất cả Cán bộ chính trị đang hoạt động
   * @returns {Promise<Array<string>>} Danh sách ID cán bộ chính trị
   */
  async findPoliticalOfficerIds() {
    const users = await prisma.nguoiDung.findMany({
      where: { vaiTro: ROLES.CAN_BO_CHINH_TRI, trangThai: "ACTIVE" },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  /**
   * Tìm ID của các Bí thư thuộc một Tổ chức Đảng cụ thể
   * @param {string} orgId ID của Tổ chức Đảng
   * @returns {Promise<Array<string>>} Danh sách ID Bí thư
   */
  async findSecretaryOfOrgIds(orgId) {
    const users = await prisma.nguoiDung.findMany({
      where: { vaiTro: ROLES.BI_THU, toChucDangId: orgId, trangThai: "ACTIVE" },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }
}

module.exports = new UserRepository();
