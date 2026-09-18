const prisma = require("../infrastructure/database/prisma");

/**
 * Gắn alias PascalCase lên object tổ chức Đảng để tương thích ngược
 * @param {Object} org 
 * @returns {Object}
 */
function attachOrgAliases(org) {
  if (!org) return null;
  org.Id = org.id;
  org.Ten = org.ten;
  org.ToChucChaId = org.toChucChaId;
  org.ParentId = org.toChucChaId;
  org.CreatedAt = org.createdAt;
  return org;
}

/**
 * Repository cho bảng tổ chức Đảng
 */
class OrgRepository {
  /**
   * Tìm tất cả tổ chức Đảng
   * @returns {Promise<Array<Object>>} Mảng các tổ chức Đảng
   */
  async findAll() {
    const orgs = await prisma.toChucDang.findMany({
      orderBy: { ten: "asc" },
    });
    return orgs.map(attachOrgAliases);
  }

  /**
   * Tìm tổ chức Đảng theo ID
   * @param {string} id ID của tổ chức Đảng
   * @returns {Promise<Object|null>} Đối tượng tổ chức Đảng hoặc null nếu không tìm thấy
   */
  async findById(id) {
    const org = await prisma.toChucDang.findUnique({
      where: { id },
    });
    return attachOrgAliases(org);
  }

  /**
   * Tìm tổ chức Đảng theo tên
   * @param {string} name Tên tổ chức Đảng
   * @returns {Promise<Object|null>} Đối tượng tổ chức Đảng hoặc null nếu không tìm thấy
   */
  async findByName(name) {
    const org = await prisma.toChucDang.findUnique({
      where: { ten: name },
    });
    return attachOrgAliases(org);
  }

  /**
   * Tạo tổ chức Đảng
   * @param {Object} data Dữ liệu tổ chức Đảng
   * @returns {Promise<Object>} Đối tượng tổ chức Đảng đã tạo
   */
  async create(data) {
    const ten = data.name !== undefined ? data.name : data.ten !== undefined ? data.ten : data.Ten;
    const toChucChaId = data.parentId !== undefined ? data.parentId : data.toChucChaId !== undefined ? data.toChucChaId : data.ToChucChaId ?? null;
    const org = await prisma.toChucDang.create({
      data: {
        ten,
        toChucChaId,
      },
    });
    return attachOrgAliases(org);
  }

  /**
   * Cập nhật tổ chức Đảng
   * @param {string} id ID của tổ chức Đảng
   * @param {Object} data Dữ liệu tổ chức Đảng
   * @returns {Promise<Object>} Đối tượng tổ chức Đảng đã cập nhật
   */
  async update(id, data) {
    const updateData = {};
    if (data.name !== undefined || data.ten !== undefined || data.Ten !== undefined) {
      updateData.ten = data.name !== undefined ? data.name : data.ten !== undefined ? data.ten : data.Ten;
    }
    if (data.parentId !== undefined || data.toChucChaId !== undefined || data.ToChucChaId !== undefined) {
      updateData.toChucChaId = data.parentId !== undefined ? data.parentId : data.toChucChaId !== undefined ? data.toChucChaId : data.ToChucChaId;
    }

    const org = await prisma.toChucDang.update({
      where: { id },
      data: updateData,
    });
    return attachOrgAliases(org);
  }

  /**
   * Xóa tổ chức Đảng
   * @param {string} id ID của tổ chức Đảng
   * @returns {Promise<Object>} Đối tượng tổ chức Đảng đã xóa
   */
  async delete(id) {
    const org = await prisma.toChucDang.delete({
      where: { id },
    });
    return attachOrgAliases(org);
  }

  /**
   * Đếm số Đảng viên thuộc một tổ chức Đảng
   * @param {string} orgId ID của tổ chức Đảng
   * @returns {Promise<number>} Số lượng Đảng viên trong tổ chức Đảng
   */
  async countMembers(orgId) {
    return prisma.dangVien.count({
      where: { toChucDangId: orgId },
    });
  }
}

module.exports = new OrgRepository();
