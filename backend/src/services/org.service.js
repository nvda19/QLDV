const orgRepository = require("../repositories/org.repository");

/**
 * Lấy danh sách toàn bộ tổ chức Đảng.
 * @returns {Promise<Array<Object>>}
 */
const getAllOrgs = async () => {
  const list = await orgRepository.findAll();
  return list.map((o) => ({
    id: o.Id,
    name: o.Ten,
    parentId: o.ToChucChaId,
    createdAt: o.CreatedAt,
  }));
};

/**
 * Tạo tổ chức Đảng mới. Tên không được trùng với tổ chức đã có.
 * @param {Object} data
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const createOrg = async (data, user) => {
  const exists = await orgRepository.findByName(data.name);
  if (exists) {
    throw new Error("Tên chi bộ/đảng bộ đã tồn tại.");
  }

  const newOrg = await orgRepository.create(data);

  return {
    id: newOrg.Id,
    name: newOrg.Ten,
    parentId: newOrg.ToChucChaId,
    createdAt: newOrg.CreatedAt,
  };
};

/**
 * Cập nhật thông tin tổ chức Đảng.
 * @param {string} id
 * @param {Object} data
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const updateOrg = async (id, data, user) => {
  const oldOrg = await orgRepository.findById(id);
  if (!oldOrg) {
    throw new Error("Không tìm thấy tổ chức.");
  }

  // Chỉ kiểm tra trùng tên khi thực sự đổi tên, tránh false positive với chính bản ghi đang sửa.
  if (data.name && data.name !== oldOrg.Ten) {
    const exists = await orgRepository.findByName(data.name);
    if (exists) {
      throw new Error("Tên tổ chức mới đã bị trùng.");
    }
  }

  const updatedOrg = await orgRepository.update(id, data);

  return {
    id: updatedOrg.Id,
    name: updatedOrg.Ten,
    parentId: updatedOrg.ToChucChaId,
    createdAt: updatedOrg.CreatedAt,
  };
};

/**
 * Xóa tổ chức Đảng.
 * @param {string} id
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const deleteOrg = async (id, user) => {
  // Còn đảng viên sinh hoạt tại đây thì không cho xóa, tránh mồ côi dữ liệu.
  const memberCount = await orgRepository.countMembers(id);
  if (memberCount > 0) {
    throw new Error(
      "Không thể xóa: Vẫn còn đảng viên đang sinh hoạt tại tổ chức này.",
    );
  }

  const orgToDelete = await orgRepository.findById(id);
  if (!orgToDelete) {
    throw new Error("Không tìm thấy tổ chức.");
  }

  await orgRepository.delete(id);
  return { message: "Xóa thành công." };
};

module.exports = { getAllOrgs, createOrg, updateOrg, deleteOrg };
