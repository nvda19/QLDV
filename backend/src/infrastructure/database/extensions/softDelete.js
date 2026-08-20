/**
 * Thêm điều kiện lọc soft delete vào query. Tự động thêm DeletedAt: null vào where, trừ
 * khi caller đã tự chỉ định DeletedAt (ví dụ muốn query cả bản ghi đã xóa thì truyền
 * where.DeletedAt rõ ràng, hàm này sẽ không đụng vào).
 * @param {*} where Điều kiện truy vấn
 * @returns {*} Điều kiện truy vấn đã thêm lọc soft delete
 */
function addSoftDeleteFilter(where) {
  if (!where) return { DeletedAt: null };
  // Nếu query truyền DeletedAt cụ thể thì tôn trọng tham số đó
  if (where.DeletedAt !== undefined) return where;
  return { ...where, DeletedAt: null };
}

const MODELS_WITH_DANGVIEN_RELATION = new Set([
  "LyLichCaNhan",
  "ThongTinVaoDang",
  "TrinhDoHocVan",
  "TuyenDungQuanNgu",
  "SucKhoeChinhSach",
  "KhenThuongKyLuat",
  "DacDiemLyLich",
  "QuanHeGiaDinh",
  "QuaTrinhCongTac",
  "QuaTrinhDaoTao",
  "LichSuQuanHam",
  "DanhGiaDangVien",
  "TaiLieuDinhKem",
  "DeXuatHuyHieu",
]);

/**
 * Thêm điều kiện lọc soft delete của Đảng viên vào quan hệ của bảng con. Các bảng con
 * (LyLichCaNhan, QuaTrinhCongTac...) đều trỏ về một DangVien - nếu DangVien cha đã bị
 * soft delete thì query bảng con cũng phải ẩn theo, nếu không dữ liệu "mồ côi" vẫn lộ ra.
 * @param {string} model Tên model
 * @param {*} where Điều kiện truy vấn
 * @returns {*} Điều kiện truy vấn đã thêm lọc soft delete Đảng viên
 */
function addSoftDeleteRelationFilter(model, where) {
  if (!MODELS_WITH_DANGVIEN_RELATION.has(model)) return where;
  if (!where) return { DangVien: { DeletedAt: null } };
  if (where.DangVien && where.DangVien.DeletedAt !== undefined) return where;
  return {
    ...where,
    DangVien: where.DangVien
      ? { ...where.DangVien, DeletedAt: null }
      : { DeletedAt: null },
  };
}

module.exports = { addSoftDeleteFilter, addSoftDeleteRelationFilter };
