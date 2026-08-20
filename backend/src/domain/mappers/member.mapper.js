/**
 * Dò ngược cây tổ chức Đảng từ orgId lên tới gốc để lấy tên đầy đủ 3 cấp
 * (chi bộ, đảng bộ cơ sở, đảng bộ cấp trên). orgMap phải được build sẵn từ trước (1 query duy nhất,
 * không findById từng cấp) để tránh N+1 khi ánh xạ cả danh sách đảng viên.
 * @param {number} orgId ID của tổ chức Đảng cần lấy phân cấp
 * @param {Map<number, Object>} orgMap Map các tổ chức Đảng, dùng để tra cứu nhanh
 * @returns {Object} Đối tượng chứa tên tổ chức ở cấp 1, cấp 2, cấp 3
 */
const getOrgHierarchy = (orgId, orgMap) => {
  if (!orgId || !orgMap) return { level1: "", level2: "", level3: "" };
  let currentId = orgId;
  const pathArr = [];
  while (currentId) {
    const org = orgMap.get(currentId);
    if (!org) break;
    pathArr.push(org.Ten);
    currentId = org.ToChucChaId !== undefined ? org.ToChucChaId : org.ParentId;
  }
  pathArr.reverse();

  let level1 = "";
  let level2 = "";
  let level3 = "";

  if (pathArr.length === 1) {
    level3 = pathArr[0];
  } else if (pathArr.length === 2) {
    level1 = pathArr[0];
    level3 = pathArr[1];
  } else if (pathArr.length >= 3) {
    level1 = pathArr[0];
    level2 = pathArr[1];
    level3 = pathArr[2];
  }

  return { level1, level2, level3 };
};

/**
 * Ánh xạ dữ liệu Đảng viên sang định dạng frontend — gom các bảng con của DangVien
 * (LyLichCaNhan, ThongTinVaoDang, ...) thành một object phẳng để frontend dùng trực tiếp,
 * không cần biết cấu trúc quan hệ ở DB
 * @param {Object} dv Bản ghi Đảng viên kèm các quan hệ đã include
 * @param {Map<number, Object>} orgMap Map tổ chức Đảng, dùng để suy ra phân cấp tổ chức
 * @returns {Object} Đối tượng Đảng viên đã ánh xạ
 */
const mapToFrontend = (dv, orgMap = null) => {
  if (!dv) return null;

  const caNhan = dv.LyLichCaNhan || {};
  const vaoDang = dv.ThongTinVaoDang || {};
  const hocVan = dv.TrinhDoHocVan || {};
  const quanNgu = dv.TuyenDungQuanNgu || {};
  const sucKhoe = dv.SucKhoeChinhSach || {};
  const khen = dv.KhenThuongKyLuat || {};
  const dacDiem = dv.DacDiemLyLich || {};

  return {
    Id: dv.Id,
    ToChucDangId: dv.ToChucDangId,
    ToChucDang: dv.ToChucDang
      ? {
          Id: dv.ToChucDang.Id,
          Ten: dv.ToChucDang.Ten,
          ParentId: dv.ToChucDang.ToChucChaId,
          ...getOrgHierarchy(dv.ToChucDangId, orgMap),
        }
      : null,

    SoLyLich: dv.SoLyLich,
    SoTheDangVien: dv.SoTheDangVien,
    TrangThai: dv.TrangThai,
    CreatedAt: dv.CreatedAt,
    UpdatedAt: dv.UpdatedAt,

    HoTenDangDung: caNhan.HoTenDangDung || "",
    HoTenKhaiSinh: caNhan.HoTenKhaiSinh || "",
    GioiTinh: caNhan.GioiTinh || "Nam",
    NgaySinh: caNhan.NgaySinh,
    NoiSinh: caNhan.NoiSinh || "",
    QueQuan: caNhan.QueQuan || "",
    NoiThuongTru: caNhan.NoiThuongTru || "",
    NoiTamTru: caNhan.NoiTamTru || "",
    DanToc: caNhan.DanToc || "",
    TonGiao: caNhan.TonGiao || "",
    ThanhPhanGiaDinh: caNhan.ThanhPhanGiaDinh || "",
    NgheNghiepHienNay: caNhan.NgheNghiepHienNay || "",
    NgheNghiepKhiVaoDang: caNhan.NgheNghiepKhiVaoDang || "",

    NgayVaoDang: vaoDang.NgayVaoDang,
    ChiBoVaoDang: vaoDang.ChiBoVaoDang || "",
    NguoiGioiThieu1: vaoDang.NguoiGioiThieu1 || "",
    ChucVuNGT1: vaoDang.ChucVuNGT1 || "",
    NguoiGioiThieu2: vaoDang.NguoiGioiThieu2 || "",
    ChucVuNGT2: vaoDang.ChucVuNGT2 || "",
    NgayQuyetDinhKetNap: vaoDang.NgayQuyetDinhKetNap,
    NgayChinhThuc: vaoDang.NgayChinhThuc,
    ChiBoChinhThuc: vaoDang.ChiBoChinhThuc || "",
    NoiSinhHoatDang: vaoDang.NoiSinhHoatDang || "",
    ChucVuDang: vaoDang.ChucVuDang || "",
    NgayVaoDoan: vaoDang.NgayVaoDoan,
    ToChucXaHoi: vaoDang.ToChucXaHoi || "",

    NgayTuyenDung: quanNgu.NgayTuyenDung,
    CoQuanTuyenDung: quanNgu.CoQuanTuyenDung || "",
    NgayNhapNgu: quanNgu.NgayNhapNgu,
    NgayXuatNgu: quanNgu.NgayXuatNgu,
    NgayTaiNgu: quanNgu.NgayTaiNgu,
    CapBac: quanNgu.CapBac || "",
    CongViecChinh: quanNgu.CongViecChinh || "",

    GiaoDucPhoThong: hocVan.GiaoDucPhoThong || "",
    GiaoDucNgheNghiep: hocVan.GiaoDucNgheNghiep || "",
    GiaoDucDaiHoc: hocVan.GiaoDucDaiHoc || "",
    HocVi: hocVan.HocVi || "",
    HocHam: hocVan.HocHam || "",
    LyLuanChinhTri: hocVan.LyLuanChinhTri || "",
    NgoaiNgu: hocVan.NgoaiNgu || "",
    TinHoc: hocVan.TinHoc || "",

    TinhTrangSucKhoe: sucKhoe.TinhTrangSucKhoe || "",
    ThuongBinhLoai: sucKhoe.ThuongBinhLoai || "",
    GiaDinhLietSy: sucKhoe.GiaDinhLietSy || false,
    GiaDinhCoCong: sucKhoe.GiaDinhCoCong || false,
    SoCMND: caNhan.SoCMND || "",
    SoCMTQD: caNhan.SoCMTQD || "",
    NgayMienCongTac: vaoDang.NgayMienCongTac,

    KhenThuong: khen.KhenThuong || "",
    HuyHieuDang: khen.HuyHieuDang || "",
    DanhHieuPhongTang: khen.DanhHieuPhongTang || "",
    KyLuat: khen.KyLuat || "",
    QuyetDinhKhenThuong: khen.QuyetDinh
      ? {
          Id: khen.QuyetDinh.Id,
          SoQuyetDinh: khen.QuyetDinh.SoQuyetDinh,
          TenQuyetDinh: khen.QuyetDinh.TenQuyetDinh,
          NgayBanHanh: khen.QuyetDinh.NgayBanHanh,
          TaiLieuUrl: khen.QuyetDinh.TaiLieuUrl,
          TaiLieuName: khen.QuyetDinh.TaiLieuName,
        }
      : null,

    LichSuBanThan: dacDiem.LichSuBanThan || {},
    QuanHeNuocNgoai: dacDiem.QuanHeNuocNgoai || {},
    HoanCanhKinhTe: dacDiem.HoanCanhKinhTe || {},

    QuanHeGiaDinh: dv.DanhSachQuanHeGiaDinh || [],
    QuaTrinhCongTac: dv.DanhSachCongTac || [],
    QuaTrinhDaoTao: (dv.DanhSachDaoTao || []).map((item) => ({
      ...item,
      VanBangCert: item.VanBangChungChi,
    })),
    DanhGiaDangVien: dv.DanhSachDanhGia || [],
    LichSuQuanHam: dv.DanhSachQuanHam || [],
    TaiLieuDinhKem: dv.DanhSachTaiLieu || [],
  };
};

module.exports = {
  mapToFrontend,
  getOrgHierarchy,
};
