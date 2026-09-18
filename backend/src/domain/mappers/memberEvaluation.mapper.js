// Map 1 bản ghi DanhGiaDangVien (đã include QuyetDinh) cho danh sách tổng hợp.
// Hỗ trợ cả camelCase lẫn PascalCase để frontend và backend đều tương thích hoàn hảo.
const mapEvaluation = (evaluation) => {
  if (!evaluation) return null;
  const id = evaluation.id || evaluation.Id;
  const nam = evaluation.nam !== undefined ? evaluation.nam : evaluation.Nam;
  const xepLoai = evaluation.xepLoai || evaluation.XepLoai;
  const nhanXet = evaluation.nhanXet || evaluation.NhanXet;
  const trangThai = evaluation.trangThai || evaluation.TrangThai;
  const lyDoTuChoi = evaluation.lyDoTuChoi || evaluation.LyDoTuChoi;
  const soQuyetDinh = evaluation.soQuyetDinh || evaluation.SoQuyetDinh;
  const quyetDinhId = evaluation.quyetDinhId || evaluation.QuyetDinhId;
  const qd = evaluation.quyetDinh || evaluation.QuyetDinh;

  const qdMapped = qd
    ? {
        id: qd.id || qd.Id,
        Id: qd.id || qd.Id,
        soQuyetDinh: qd.soQuyetDinh || qd.SoQuyetDinh,
        SoQuyetDinh: qd.soQuyetDinh || qd.SoQuyetDinh,
        tenQuyetDinh: qd.tenQuyetDinh || qd.TenQuyetDinh,
        TenQuyetDinh: qd.tenQuyetDinh || qd.TenQuyetDinh,
        ngayBanHanh: qd.ngayBanHanh || qd.NgayBanHanh,
        NgayBanHanh: qd.ngayBanHanh || qd.NgayBanHanh,
        taiLieuUrl: qd.taiLieuUrl || qd.TaiLieuUrl,
        TaiLieuUrl: qd.taiLieuUrl || qd.TaiLieuUrl,
        taiLieuName: qd.taiLieuName || qd.TaiLieuName,
        TaiLieuName: qd.taiLieuName || qd.TaiLieuName,
      }
    : null;

  return {
    id,
    Id: id,
    nam,
    Nam: nam,
    xepLoai,
    XepLoai: xepLoai,
    nhanXet,
    NhanXet: nhanXet,
    trangThai,
    TrangThai: trangThai,
    lyDoTuChoi,
    LyDoTuChoi: lyDoTuChoi,
    soQuyetDinh,
    SoQuyetDinh: soQuyetDinh,
    quyetDinhId,
    QuyetDinhId: quyetDinhId,
    quyetDinh: qdMapped,
    QuyetDinh: qdMapped,
  };
};

// Rút gọn 1 đảng viên (đã include sẵn DanhSachDanhGia lọc theo năm) thành 1 dòng cho bảng
// tổng hợp xếp loại — chỉ lấy field cần hiển thị, đánh giá của năm đó luôn là phần tử [0].
const mapMemberEvaluationRow = (member) => {
  const caNhan = member.lyLichCaNhan || member.LyLichCaNhan || {};
  const quanNgu = member.tuyenDungQuanNgu || member.TuyenDungQuanNgu || {};
  const list = member.danhSachDanhGia || member.DanhSachDanhGia || [];
  const id = member.id || member.Id;
  const hoTenDangDung = caNhan.hoTenDangDung || caNhan.HoTenDangDung || "";
  const soLyLich = member.soLyLich || member.SoLyLich || "";
  const soTheDangVien = member.soTheDangVien || member.SoTheDangVien || "";
  const capBac = quanNgu.capBac || quanNgu.CapBac || "";

  return {
    id,
    Id: id,
    hoTenDangDung,
    HoTenDangDung: hoTenDangDung,
    soLyLich,
    SoLyLich: soLyLich,
    soTheDangVien,
    SoTheDangVien: soTheDangVien,
    capBac,
    CapBac: capBac,
    evaluation: mapEvaluation(list[0]),
  };
};

module.exports = { mapEvaluation, mapMemberEvaluationRow };
