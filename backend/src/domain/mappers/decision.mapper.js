/**
 * Ánh xạ một Quyết định từ định dạng DB (PascalCase) sang định dạng frontend (camelCase)
 * @param {Object} qd Bản ghi quyết định lấy từ Prisma
 * @returns {Object} Đối tượng quyết định đã ánh xạ, sẵn để trả về frontend
 */
const mapToFrontend = (qd) => {
  if (!qd) return null;
  return {
    id: qd.Id,
    soQuyetDinh: qd.SoQuyetDinh,
    tenQuyetDinh: qd.TenQuyetDinh,
    loaiQuyetDinh: qd.LoaiQuyetDinh,
    ngayBanHanh: qd.NgayBanHanh,
    taiLieuUrl: qd.TaiLieuUrl,
    taiLieuName: qd.TaiLieuName,
    createdAt: qd.CreatedAt,
    updatedAt: qd.UpdatedAt,
  };
};

/**
 * Ánh xạ một danh sách Quyết định sang định dạng frontend
 * @param {Array<Object>} list Danh sách bản ghi quyết định
 * @returns {Array<Object>} Danh sách quyết định đã ánh xạ
 */
const mapListToFrontend = (list = []) => list.map(mapToFrontend);

/**
 * Ánh xạ dữ liệu quyết định từ payload frontend sang định dạng ghi xuống DB
 * @param {Object} p Dữ liệu quyết định gửi lên từ frontend
 * @returns {Object} Đối tượng quyết định theo đúng tên cột DB, dùng cho service ghi DB
 */
const mapToDb = (p = {}) => ({
  SoQuyetDinh: p.soQuyetDinh,
  TenQuyetDinh: p.tenQuyetDinh,
  LoaiQuyetDinh: p.loaiQuyetDinh,
  NgayBanHanh: p.ngayBanHanh,
  deleteAttachment: p.deleteAttachment,
});

module.exports = { mapToFrontend, mapListToFrontend, mapToDb };
