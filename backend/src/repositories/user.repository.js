const prisma = require("../infrastructure/database/prisma");
const { ROLES } = require("../domain/constants/member.constants");

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

    if (role) where.VaiTro = role;
    if (status) where.TrangThai = status;
    if (orgId) where.ToChucDangId = orgId;

    if (search) {
      where.OR = [
        { TenDangNhap: { contains: search, mode: "insensitive" } },
        { HoTen: { contains: search, mode: "insensitive" } },
      ];
    }

    return prisma.nguoiDung.findMany({
      where,
      include: {
        ToChucDang: {
          select: {
            Id: true,
            Ten: true,
          },
        },
      },
      orderBy: {
        CreatedAt: "desc",
      },
    });
  }

  /**
   * Tìm người dùng theo ID
   * @param {string} id ID của người dùng
   * @param {boolean} includeOrg Có bao gồm thông tin tổ chức Đảng không
   * @returns {Promise<Object|null>} Đối tượng người dùng hoặc null nếu không tìm thấy
   */
  async findById(id, includeOrg = false) {
    return prisma.nguoiDung.findUnique({
      where: { Id: id },
      include: includeOrg ? { ToChucDang: true } : undefined,
    });
  }

  /**
   * Tìm người dùng theo tên đăng nhập
   * @param {string} username Tên đăng nhập
   * @returns {Promise<Object|null>} Đối tượng người dùng hoặc null nếu không tìm thấy
   */
  async findByUsername(username) {
    return prisma.nguoiDung.findUnique({
      where: { TenDangNhap: username },
    });
  }

  /**
   * Tạo tài khoản người dùng
   * @param {Object} data Dữ liệu tài khoản
   * @returns {Promise<Object>} Đối tượng tài khoản đã tạo
   */
  async create(data) {
    return prisma.nguoiDung.create({
      data,
      include: {
        ToChucDang: true,
      },
    });
  }

  /**
   * Cập nhật tài khoản người dùng
   * @param {string} id ID của tài khoản
   * @param {Object} data Dữ liệu cập nhật
   * @returns {Promise<Object>} Đối tượng tài khoản đã cập nhật
   */
  async update(id, data) {
    return prisma.nguoiDung.update({
      where: { Id: id },
      data,
      include: {
        ToChucDang: true,
      },
    });
  }

  /**
   * Xóa tài khoản người dùng
   * @param {string} id ID của tài khoản
   * @returns {Promise<Object>} Đối tượng tài khoản đã xóa
   */
  async delete(id) {
    return prisma.nguoiDung.delete({
      where: { Id: id },
    });
  }

  /**
   * Tăng số lần đăng nhập sai mật khẩu
   * Lưu ý: tự động khóa tài khoản (`TrangThai = LOCKED`) khi số lần sai đạt ngưỡng 5,
   * để chặn tấn công brute-force khi đăng nhập.
   * @param {string} id ID của tài khoản
   * @returns {Promise<Object>} Đối tượng tài khoản sau khi cập nhật (có thể đã bị khóa)
   */
  async incrementFailedAttempts(id) {
    const updatedUser = await prisma.nguoiDung.update({
      where: { Id: id },
      data: {
        SoLanSaiMatKhau: {
          increment: 1,
        },
      },
      include: { ToChucDang: true },
    });

    if (
      updatedUser.SoLanSaiMatKhau >= 5 &&
      updatedUser.TrangThai !== "LOCKED"
    ) {
      return prisma.nguoiDung.update({
        where: { Id: id },
        data: { TrangThai: "LOCKED" },
        include: { ToChucDang: true },
      });
    }

    return updatedUser;
  }

  /**
   * Tìm ID của tất cả Cán bộ chính trị đang hoạt động
   * @returns {Promise<Array<string>>} Danh sách ID cán bộ chính trị
   */
  async findPoliticalOfficerIds() {
    const users = await prisma.nguoiDung.findMany({
      where: { VaiTro: ROLES.CAN_BO_CHINH_TRI, TrangThai: "ACTIVE" },
      select: { Id: true },
    });
    return users.map((u) => u.Id);
  }

  /**
   * Tìm ID của các Bí thư thuộc một Tổ chức Đảng cụ thể
   * @param {string} orgId ID của Tổ chức Đảng
   * @returns {Promise<Array<string>>} Danh sách ID Bí thư
   */
  async findSecretaryOfOrgIds(orgId) {
    const users = await prisma.nguoiDung.findMany({
      where: { VaiTro: ROLES.BI_THU, ToChucDangId: orgId, TrangThai: "ACTIVE" },
      select: { Id: true },
    });
    return users.map((u) => u.Id);
  }
}

module.exports = new UserRepository();
