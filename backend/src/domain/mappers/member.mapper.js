/**
 * Dò ngược cây tổ chức Đảng từ orgId lên tới gốc để lấy tên đầy đủ 3 cấp
 * @param {string} orgId ID của tổ chức Đảng cần lấy phân cấp
 * @param {Map<string, Object>} orgMap Map các tổ chức Đảng, dùng để tra cứu nhanh
 * @returns {Object} Đối tượng chứa tên tổ chức ở cấp 1, cấp 2, cấp 3
 */
const getOrgHierarchy = (orgId, orgMap) => {
  if (!orgId || !orgMap) return { level1: "", level2: "", level3: "" };
  let currentId = orgId;
  const pathArr = [];
  while (currentId) {
    const org = orgMap.get(currentId);
    if (!org) break;
    pathArr.push(org.ten || org.Ten);
    currentId = org.toChucChaId !== undefined ? org.toChucChaId : org.ToChucChaId !== undefined ? org.ToChucChaId : org.ParentId;
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
 * Ánh xạ dữ liệu Đảng viên sang định dạng frontend
 * Cung cấp cả camelCase và PascalCase để đảm bảo 100% tương thích ngược
 * @param {Object} dv Bản ghi Đảng viên kèm các quan hệ đã include
 * @param {Map<string, Object>} orgMap Map tổ chức Đảng, dùng để suy ra phân cấp tổ chức
 * @returns {Object} Đối tượng Đảng viên đã ánh xạ
 */
const mapToFrontend = (dv, orgMap = null) => {
  if (!dv) return null;

  const caNhan = dv.lyLichCaNhan || dv.LyLichCaNhan || {};
  const vaoDang = dv.thongTinVaoDang || dv.ThongTinVaoDang || {};
  const hocVan = dv.trinhDoHocVan || dv.TrinhDoHocVan || {};
  const quanNgu = dv.tuyenDungQuanNgu || dv.TuyenDungQuanNgu || {};
  const sucKhoe = dv.sucKhoeChinhSach || dv.SucKhoeChinhSach || {};
  const khen = dv.khenThuongKyLuat || dv.KhenThuongKyLuat || {};
  const dacDiem = dv.dacDiemLyLich || dv.DacDiemLyLich || {};
  const toChuc = dv.toChucDang || dv.ToChucDang;

  const id = dv.id || dv.Id;
  const toChucDangId = dv.toChucDangId || dv.ToChucDangId;
  const soLyLich = dv.soLyLich !== undefined ? dv.soLyLich : dv.SoLyLich;
  const soTheDangVien = dv.soTheDangVien !== undefined ? dv.soTheDangVien : dv.SoTheDangVien;
  const trangThai = dv.trangThai || dv.TrangThai;
  const createdAt = dv.createdAt || dv.CreatedAt;
  const updatedAt = dv.updatedAt || dv.UpdatedAt;

  const hoTenDangDung = caNhan.hoTenDangDung || caNhan.HoTenDangDung || "";
  const hoTenKhaiSinh = caNhan.hoTenKhaiSinh || caNhan.HoTenKhaiSinh || "";
  const gioiTinh = caNhan.gioiTinh || caNhan.GioiTinh || "Nam";
  const ngaySinh = caNhan.ngaySinh || caNhan.NgaySinh;
  const noiSinh = caNhan.noiSinh || caNhan.NoiSinh || "";
  const queQuan = caNhan.queQuan || caNhan.QueQuan || "";
  const noiThuongTru = caNhan.noiThuongTru || caNhan.NoiThuongTru || "";
  const noiTamTru = caNhan.noiTamTru || caNhan.NoiTamTru || "";
  const danToc = caNhan.danToc || caNhan.DanToc || "";
  const tonGiao = caNhan.tonGiao || caNhan.TonGiao || "";
  const thanhPhanGiaDinh = caNhan.thanhPhanGiaDinh || caNhan.ThanhPhanGiaDinh || "";
  const ngheNghiepHienNay = caNhan.ngheNghiepHienNay || caNhan.NgheNghiepHienNay || "";
  const ngheNghiepKhiVaoDang = caNhan.ngheNghiepKhiVaoDang || caNhan.NgheNghiepKhiVaoDang || "";
  const soCMND = caNhan.soCMND || caNhan.SoCMND || "";
  const soCMTQD = caNhan.soCMTQD || caNhan.SoCMTQD || "";

  const ngayVaoDang = vaoDang.ngayVaoDang || vaoDang.NgayVaoDang;
  const chiBoVaoDang = vaoDang.chiBoVaoDang || vaoDang.ChiBoVaoDang || "";
  const nguoiGioiThieu1 = vaoDang.nguoiGioiThieu1 || vaoDang.NguoiGioiThieu1 || "";
  const chucVuNGT1 = vaoDang.chucVuNGT1 || vaoDang.ChucVuNGT1 || "";
  const nguoiGioiThieu2 = vaoDang.nguoiGioiThieu2 || vaoDang.NguoiGioiThieu2 || "";
  const chucVuNGT2 = vaoDang.chucVuNGT2 || vaoDang.ChucVuNGT2 || "";
  const ngayQuyetDinhKetNap = vaoDang.ngayQuyetDinhKetNap || vaoDang.NgayQuyetDinhKetNap;
  const ngayChinhThuc = vaoDang.ngayChinhThuc || vaoDang.NgayChinhThuc;
  const chiBoChinhThuc = vaoDang.chiBoChinhThuc || vaoDang.ChiBoChinhThuc || "";
  const noiSinhHoatDang = vaoDang.noiSinhHoatDang || vaoDang.NoiSinhHoatDang || "";
  const chucVuDang = vaoDang.chucVuDang || vaoDang.ChucVuDang || "";
  const ngayVaoDoan = vaoDang.ngayVaoDoan || vaoDang.NgayVaoDoan;
  const toChucXaHoi = vaoDang.toChucXaHoi || vaoDang.ToChucXaHoi || "";
  const ngayMienCongTac = vaoDang.ngayMienCongTac || vaoDang.NgayMienCongTac;

  const ngayTuyenDung = quanNgu.ngayTuyenDung || quanNgu.NgayTuyenDung;
  const coQuanTuyenDung = quanNgu.coQuanTuyenDung || quanNgu.CoQuanTuyenDung || "";
  const ngayNhapNgu = quanNgu.ngayNhapNgu || quanNgu.NgayNhapNgu;
  const ngayXuatNgu = quanNgu.ngayXuatNgu || quanNgu.NgayXuatNgu;
  const ngayTaiNgu = quanNgu.ngayTaiNgu || quanNgu.NgayTaiNgu;
  const capBac = quanNgu.capBac || quanNgu.CapBac || "";
  const congViecChinh = quanNgu.congViecChinh || quanNgu.CongViecChinh || "";

  const giaoDucPhoThong = hocVan.giaoDucPhoThong || hocVan.GiaoDucPhoThong || "";
  const giaoDucNgheNghiep = hocVan.giaoDucNgheNghiep || hocVan.GiaoDucNgheNghiep || "";
  const giaoDucDaiHoc = hocVan.giaoDucDaiHoc || hocVan.GiaoDucDaiHoc || "";
  const hocVi = hocVan.hocVi || hocVan.HocVi || "";
  const hocHam = hocVan.hocHam || hocVan.HocHam || "";
  const lyLuanChinhTri = hocVan.lyLuanChinhTri || hocVan.LyLuanChinhTri || "";
  const ngoaiNgu = hocVan.ngoaiNgu || hocVan.NgoaiNgu || "";
  const tinHoc = hocVan.tinHoc || hocVan.TinHoc || "";

  const tinhTrangSucKhoe = sucKhoe.tinhTrangSucKhoe || sucKhoe.TinhTrangSucKhoe || "";
  const thuongBinhLoai = sucKhoe.thuongBinhLoai || sucKhoe.ThuongBinhLoai || "";
  const giaDinhLietSy = sucKhoe.giaDinhLietSy ?? sucKhoe.GiaDinhLietSy ?? false;
  const giaDinhCoCong = sucKhoe.giaDinhCoCong ?? sucKhoe.GiaDinhCoCong ?? false;

  const khenThuong = khen.khenThuong || khen.KhenThuong || "";
  const huyHieuDang = khen.huyHieuDang || khen.HuyHieuDang || "";
  const danhHieuPhongTang = khen.danhHieuPhongTang || khen.DanhHieuPhongTang || "";
  const kyLuat = khen.kyLuat || khen.KyLuat || "";

  const qdKhen = khen.quyetDinh || khen.QuyetDinh;
  const quyetDinhKhenThuong = qdKhen
    ? {
        id: qdKhen.id || qdKhen.Id,
        Id: qdKhen.id || qdKhen.Id,
        soQuyetDinh: qdKhen.soQuyetDinh || qdKhen.SoQuyetDinh,
        SoQuyetDinh: qdKhen.soQuyetDinh || qdKhen.SoQuyetDinh,
        tenQuyetDinh: qdKhen.tenQuyetDinh || qdKhen.TenQuyetDinh,
        TenQuyetDinh: qdKhen.tenQuyetDinh || qdKhen.TenQuyetDinh,
        ngayBanHanh: qdKhen.ngayBanHanh || qdKhen.NgayBanHanh,
        NgayBanHanh: qdKhen.ngayBanHanh || qdKhen.NgayBanHanh,
        taiLieuUrl: qdKhen.taiLieuUrl || qdKhen.TaiLieuUrl,
        TaiLieuUrl: qdKhen.taiLieuUrl || qdKhen.TaiLieuUrl,
        taiLieuName: qdKhen.taiLieuName || qdKhen.TaiLieuName,
        TaiLieuName: qdKhen.taiLieuName || qdKhen.TaiLieuName,
      }
    : null;

  const lichSuBanThan = dacDiem.lichSuBanThan || dacDiem.LichSuBanThan || {};
  const quanHeNuocNgoai = dacDiem.quanHeNuocNgoai || dacDiem.QuanHeNuocNgoai || {};
  const hoanCanhKinhTe = dacDiem.hoanCanhKinhTe || dacDiem.HoanCanhKinhTe || {};

  const toChucDangMapped = toChuc
    ? {
        id: toChuc.id || toChuc.Id,
        Id: toChuc.id || toChuc.Id,
        ten: toChuc.ten || toChuc.Ten,
        Ten: toChuc.ten || toChuc.Ten,
        parentId: toChuc.toChucChaId !== undefined ? toChuc.toChucChaId : toChuc.ParentId,
        ParentId: toChuc.toChucChaId !== undefined ? toChuc.toChucChaId : toChuc.ParentId,
        ...getOrgHierarchy(toChucDangId, orgMap),
      }
    : null;

  const quanHeGiaDinh = dv.danhSachQuanHeGiaDinh || dv.DanhSachQuanHeGiaDinh || [];
  const quaTrinhCongTac = dv.danhSachCongTac || dv.DanhSachCongTac || [];
  const rawDaoTao = dv.danhSachDaoTao || dv.DanhSachDaoTao || [];
  const quaTrinhDaoTao = rawDaoTao.map((item) => ({
    ...item,
    VanBangCert: item.VanBangChungChi || item.vanBangChungChi || item.vanBang || item.VanBangCert,
  }));
  const danhGiaDangVien = dv.danhSachDanhGia || dv.DanhSachDanhGia || [];
  const lichSuQuanHam = dv.danhSachQuanHam || dv.DanhSachQuanHam || [];
  const taiLieuDinhKem = dv.danhSachTaiLieu || dv.DanhSachTaiLieu || [];

  return {
    id,
    Id: id,
    toChucDangId,
    ToChucDangId: toChucDangId,
    toChucDang: toChucDangMapped,
    ToChucDang: toChucDangMapped,

    soLyLich,
    SoLyLich: soLyLich,
    soTheDangVien,
    SoTheDangVien: soTheDangVien,
    trangThai,
    TrangThai: trangThai,
    createdAt,
    CreatedAt: createdAt,
    updatedAt,
    UpdatedAt: updatedAt,

    hoTenDangDung,
    HoTenDangDung: hoTenDangDung,
    hoTenKhaiSinh,
    HoTenKhaiSinh: hoTenKhaiSinh,
    gioiTinh,
    GioiTinh: gioiTinh,
    ngaySinh,
    NgaySinh: ngaySinh,
    noiSinh,
    NoiSinh: noiSinh,
    queQuan,
    QueQuan: queQuan,
    noiThuongTru,
    NoiThuongTru: noiThuongTru,
    noiTamTru,
    NoiTamTru: noiTamTru,
    danToc,
    DanToc: danToc,
    tonGiao,
    TonGiao: tonGiao,
    thanhPhanGiaDinh,
    ThanhPhanGiaDinh: thanhPhanGiaDinh,
    ngheNghiepHienNay,
    NgheNghiepHienNay: ngheNghiepHienNay,
    ngheNghiepKhiVaoDang,
    NgheNghiepKhiVaoDang: ngheNghiepKhiVaoDang,

    ngayVaoDang,
    NgayVaoDang: ngayVaoDang,
    chiBoVaoDang,
    ChiBoVaoDang: chiBoVaoDang,
    nguoiGioiThieu1,
    NguoiGioiThieu1: nguoiGioiThieu1,
    chucVuNGT1,
    ChucVuNGT1: chucVuNGT1,
    nguoiGioiThieu2,
    NguoiGioiThieu2: nguoiGioiThieu2,
    chucVuNGT2,
    ChucVuNGT2: chucVuNGT2,
    ngayQuyetDinhKetNap,
    NgayQuyetDinhKetNap: ngayQuyetDinhKetNap,
    ngayChinhThuc,
    NgayChinhThuc: ngayChinhThuc,
    chiBoChinhThuc,
    ChiBoChinhThuc: chiBoChinhThuc,
    noiSinhHoatDang,
    NoiSinhHoatDang: noiSinhHoatDang,
    chucVuDang,
    ChucVuDang: chucVuDang,
    ngayVaoDoan,
    NgayVaoDoan: ngayVaoDoan,
    toChucXaHoi,
    ToChucXaHoi: toChucXaHoi,
    ngayMienCongTac,
    NgayMienCongTac: ngayMienCongTac,

    ngayTuyenDung,
    NgayTuyenDung: ngayTuyenDung,
    coQuanTuyenDung,
    CoQuanTuyenDung: coQuanTuyenDung,
    ngayNhapNgu,
    NgayNhapNgu: ngayNhapNgu,
    ngayXuatNgu,
    NgayXuatNgu: ngayXuatNgu,
    ngayTaiNgu,
    NgayTaiNgu: ngayTaiNgu,
    capBac,
    CapBac: capBac,
    congViecChinh,
    CongViecChinh: congViecChinh,

    giaoDucPhoThong,
    GiaoDucPhoThong: giaoDucPhoThong,
    giaoDucNgheNghiep,
    GiaoDucNgheNghiep: giaoDucNgheNghiep,
    giaoDucDaiHoc,
    GiaoDucDaiHoc: giaoDucDaiHoc,
    hocVi,
    HocVi: hocVi,
    hocHam,
    HocHam: hocHam,
    lyLuanChinhTri,
    LyLuanChinhTri: lyLuanChinhTri,
    ngoaiNgu,
    NgoaiNgu: ngoaiNgu,
    tinHoc,
    TinHoc: tinHoc,

    tinhTrangSucKhoe,
    TinhTrangSucKhoe: tinhTrangSucKhoe,
    thuongBinhLoai,
    ThuongBinhLoai: thuongBinhLoai,
    giaDinhLietSy,
    GiaDinhLietSy: giaDinhLietSy,
    giaDinhCoCong,
    GiaDinhCoCong: giaDinhCoCong,
    soCMND,
    SoCMND: soCMND,
    soCMTQD,
    SoCMTQD: soCMTQD,

    khenThuong,
    KhenThuong: khenThuong,
    huyHieuDang,
    HuyHieuDang: huyHieuDang,
    danhHieuPhongTang,
    DanhHieuPhongTang: danhHieuPhongTang,
    kyLuat,
    KyLuat: kyLuat,
    quyetDinhKhenThuong,
    QuyetDinhKhenThuong: quyetDinhKhenThuong,

    lichSuBanThan,
    LichSuBanThan: lichSuBanThan,
    quanHeNuocNgoai,
    QuanHeNuocNgoai: quanHeNuocNgoai,
    hoanCanhKinhTe,
    HoanCanhKinhTe: hoanCanhKinhTe,

    quanHeGiaDinh,
    QuanHeGiaDinh: quanHeGiaDinh,
    quaTrinhCongTac,
    QuaTrinhCongTac: quaTrinhCongTac,
    quaTrinhDaoTao,
    QuaTrinhDaoTao: quaTrinhDaoTao,
    danhGiaDangVien,
    DanhGiaDangVien: danhGiaDangVien,
    lichSuQuanHam,
    LichSuQuanHam: lichSuQuanHam,
    taiLieuDinhKem,
    TaiLieuDinhKem: taiLieuDinhKem,
  };
};

module.exports = {
  mapToFrontend,
  getOrgHierarchy,
};
