// Map 1 bản ghi DanhGiaDangVien (đã include QuyetDinh) cho danh sách tổng hợp.
// Cố tình giữ nguyên tên field PascalCase như Prisma trả về, vì modal sửa/xem
// quyết định bên frontend đang đọc thẳng từ member.DanhGiaDangVien theo tên này.
const mapEvaluation = (evaluation) => {
  if (!evaluation) return null;
  return {
    Id: evaluation.Id,
    Nam: evaluation.Nam,
    XepLoai: evaluation.XepLoai,
    NhanXet: evaluation.NhanXet,
    TrangThai: evaluation.TrangThai,
    LyDoTuChoi: evaluation.LyDoTuChoi,
    SoQuyetDinh: evaluation.SoQuyetDinh,
    QuyetDinhId: evaluation.QuyetDinhId,
    QuyetDinh: evaluation.QuyetDinh
      ? {
          Id: evaluation.QuyetDinh.Id,
          SoQuyetDinh: evaluation.QuyetDinh.SoQuyetDinh,
          TenQuyetDinh: evaluation.QuyetDinh.TenQuyetDinh,
          NgayBanHanh: evaluation.QuyetDinh.NgayBanHanh,
          TaiLieuUrl: evaluation.QuyetDinh.TaiLieuUrl,
          TaiLieuName: evaluation.QuyetDinh.TaiLieuName,
        }
      : null,
  };
};

// Rút gọn 1 đảng viên (đã include sẵn DanhSachDanhGia lọc theo năm) thành 1 dòng cho bảng
// tổng hợp xếp loại — chỉ lấy field cần hiển thị, đánh giá của năm đó luôn là phần tử [0].
const mapMemberEvaluationRow = (member) => {
  return {
    Id: member.Id,
    HoTenDangDung: member.LyLichCaNhan?.HoTenDangDung || "",
    SoLyLich: member.SoLyLich || "",
    SoTheDangVien: member.SoTheDangVien || "",
    CapBac: member.TuyenDungQuanNgu?.CapBac || "",
    evaluation: mapEvaluation((member.DanhSachDanhGia || [])[0]),
  };
};

module.exports = { mapEvaluation, mapMemberEvaluationRow };
