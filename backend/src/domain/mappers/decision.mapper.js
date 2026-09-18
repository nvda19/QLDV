/**
 * Ánh xạ một Quyết định từ định dạng DB sang định dạng frontend (camelCase)
 * @param {Object} qd Bản ghi quyết định lấy từ Prisma
 * @returns {Object} Đối tượng quyết định đã ánh xạ, sẵn để trả về frontend
 */
const mapToFrontend = (qd) => {
  if (!qd) return null;
  return {
    id: qd.id !== undefined ? qd.id : qd.Id,
    soQuyetDinh: qd.soQuyetDinh !== undefined ? qd.soQuyetDinh : qd.SoQuyetDinh,
    tenQuyetDinh: qd.tenQuyetDinh !== undefined ? qd.tenQuyetDinh : qd.TenQuyetDinh,
    loaiQuyetDinh: qd.loaiQuyetDinh !== undefined ? qd.loaiQuyetDinh : qd.LoaiQuyetDinh,
    ngayBanHanh: qd.ngayBanHanh !== undefined ? qd.ngayBanHanh : qd.NgayBanHanh,
    taiLieuUrl: qd.taiLieuUrl !== undefined ? qd.taiLieuUrl : qd.TaiLieuUrl,
    taiLieuName: qd.taiLieuName !== undefined ? qd.taiLieuName : qd.TaiLieuName,
    createdAt: qd.createdAt !== undefined ? qd.createdAt : qd.CreatedAt,
    updatedAt: qd.updatedAt !== undefined ? qd.updatedAt : qd.UpdatedAt,
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
  SoQuyetDinh: p.soQuyetDinh !== undefined ? p.soQuyetDinh : p.SoQuyetDinh,
  TenQuyetDinh: p.tenQuyetDinh !== undefined ? p.tenQuyetDinh : p.TenQuyetDinh,
  LoaiQuyetDinh: p.loaiQuyetDinh !== undefined ? p.loaiQuyetDinh : p.LoaiQuyetDinh,
  NgayBanHanh: p.ngayBanHanh !== undefined ? p.ngayBanHanh : p.NgayBanHanh,
  deleteAttachment: p.deleteAttachment,
});

module.exports = { mapToFrontend, mapListToFrontend, mapToDb };
