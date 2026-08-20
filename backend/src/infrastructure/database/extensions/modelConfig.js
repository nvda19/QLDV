// Danh sách model nào được audit log / soft delete tự động qua Prisma extension.
// Thêm model mới vào đây thì phải nhớ check schema có cột DeletedAt (cho soft delete) không.

const AUDITED_MODELS = new Set([
  "DangVien",
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
  "ToChucDang",
  "NguoiDung",
]);

const SOFT_DELETE_MODELS = new Set(["TaiLieuDinhKem", "ThongBao", "DangVien"]);

module.exports = { AUDITED_MODELS, SOFT_DELETE_MODELS };
