const prisma = require("../../infrastructure/database/prisma");

/**
 * Định nghĩa các quan hệ lồng nhau cần nạp đầy đủ khi truy vấn hồ sơ Đảng viên (dùng cho phiếu đảng viên)
 */
const dangVienDetailInclude = {
  toChucDang: true,
  lyLichCaNhan: true,
  thongTinVaoDang: true,
  trinhDoHocVan: true,
  tuyenDungQuanNgu: true,
  sucKhoeChinhSach: true,
  khenThuongKyLuat: { include: { quyetDinh: true } },
  dacDiemLyLich: true,
  danhSachQuanHeGiaDinh: true,
  danhSachCongTac: { orderBy: { tuThangNam: "desc" } },
  danhSachDaoTao: { orderBy: { tuNgay: "desc" } },
  danhSachDanhGia: { include: { quyetDinh: true }, orderBy: { nam: "desc" } },
  danhSachQuanHam: {
    include: { quyetDinh: true },
    orderBy: { ngayHieuLuc: "desc" },
  },
  danhSachTaiLieu: true,
};

/**
 * Định nghĩa các quan hệ lồng nhau cơ bản cần nạp khi truy vấn danh sách Đảng viên (dùng cho danh sách)
 */
const dangVienListInclude = {
  toChucDang: true,
  lyLichCaNhan: true,
  thongTinVaoDang: true,
  tuyenDungQuanNgu: true,
  khenThuongKyLuat: { include: { quyetDinh: true } },
  danhSachDanhGia: { include: { quyetDinh: true }, orderBy: { nam: "desc" } },
  danhSachQuanHam: { include: { quyetDinh: true }, orderBy: { ngayHieuLuc: "desc" } },
  danhSachDaoTao: { orderBy: { tuNgay: "desc" } },
};

function attachDangVienAliases(dv) {
  if (!dv) return null;
  dv.Id = dv.id;
  dv.ToChucDangId = dv.toChucDangId;
  dv.SoLyLich = dv.soLyLich;
  dv.SoTheDangVien = dv.soTheDangVien;
  dv.TrangThai = dv.trangThai;
  dv.CreatedAt = dv.createdAt;
  dv.UpdatedAt = dv.updatedAt;
  dv.DeletedAt = dv.deletedAt;
  dv.DeletedBy = dv.deletedBy;

  if (dv.toChucDang) {
    dv.ToChucDang = dv.toChucDang;
    dv.toChucDang.Id = dv.toChucDang.id;
    dv.toChucDang.Ten = dv.toChucDang.ten;
    dv.toChucDang.ToChucChaId = dv.toChucDang.toChucChaId;
    dv.toChucDang.ParentId = dv.toChucDang.toChucChaId;
  }
  if (dv.lyLichCaNhan) {
    dv.LyLichCaNhan = dv.lyLichCaNhan;
    dv.lyLichCaNhan.DangVienId = dv.lyLichCaNhan.dangVienId;
    dv.lyLichCaNhan.HoTenDangDung = dv.lyLichCaNhan.hoTenDangDung;
    dv.lyLichCaNhan.HoTenKhaiSinh = dv.lyLichCaNhan.hoTenKhaiSinh;
    dv.lyLichCaNhan.GioiTinh = dv.lyLichCaNhan.gioiTinh;
    dv.lyLichCaNhan.NgaySinh = dv.lyLichCaNhan.ngaySinh;
    dv.lyLichCaNhan.NoiSinh = dv.lyLichCaNhan.noiSinh;
    dv.lyLichCaNhan.QueQuan = dv.lyLichCaNhan.queQuan;
    dv.lyLichCaNhan.NoiThuongTru = dv.lyLichCaNhan.noiThuongTru;
    dv.lyLichCaNhan.NoiTamTru = dv.lyLichCaNhan.noiTamTru;
    dv.lyLichCaNhan.DanToc = dv.lyLichCaNhan.danToc;
    dv.lyLichCaNhan.TonGiao = dv.lyLichCaNhan.tonGiao;
    dv.lyLichCaNhan.ThanhPhanGiaDinh = dv.lyLichCaNhan.thanhPhanGiaDinh;
    dv.lyLichCaNhan.NgheNghiepHienNay = dv.lyLichCaNhan.ngheNghiepHienNay;
    dv.lyLichCaNhan.NgheNghiepKhiVaoDang = dv.lyLichCaNhan.ngheNghiepKhiVaoDang;
    dv.lyLichCaNhan.SoCMND = dv.lyLichCaNhan.soCMND;
    dv.lyLichCaNhan.SoCMTQD = dv.lyLichCaNhan.soCMTQD;
  }
  if (dv.thongTinVaoDang) {
    dv.ThongTinVaoDang = dv.thongTinVaoDang;
    dv.thongTinVaoDang.DangVienId = dv.thongTinVaoDang.dangVienId;
    dv.thongTinVaoDang.NgayVaoDang = dv.thongTinVaoDang.ngayVaoDang;
    dv.thongTinVaoDang.ChiBoVaoDang = dv.thongTinVaoDang.chiBoVaoDang;
    dv.thongTinVaoDang.NguoiGioiThieu1 = dv.thongTinVaoDang.nguoiGioiThieu1;
    dv.thongTinVaoDang.ChucVuNGT1 = dv.thongTinVaoDang.chucVuNGT1;
    dv.thongTinVaoDang.NguoiGioiThieu2 = dv.thongTinVaoDang.nguoiGioiThieu2;
    dv.thongTinVaoDang.ChucVuNGT2 = dv.thongTinVaoDang.chucVuNGT2;
    dv.thongTinVaoDang.NgayQuyetDinhKetNap = dv.thongTinVaoDang.ngayQuyetDinhKetNap;
    dv.thongTinVaoDang.NgayChinhThuc = dv.thongTinVaoDang.ngayChinhThuc;
    dv.thongTinVaoDang.ChiBoChinhThuc = dv.thongTinVaoDang.chiBoChinhThuc;
    dv.thongTinVaoDang.NoiSinhHoatDang = dv.thongTinVaoDang.noiSinhHoatDang;
    dv.thongTinVaoDang.ChucVuDang = dv.thongTinVaoDang.chucVuDang;
    dv.thongTinVaoDang.NgayVaoDoan = dv.thongTinVaoDang.ngayVaoDoan;
    dv.thongTinVaoDang.ToChucXaHoi = dv.thongTinVaoDang.toChucXaHoi;
    dv.thongTinVaoDang.NgayMienCongTac = dv.thongTinVaoDang.ngayMienCongTac;
  }
  if (dv.trinhDoHocVan) {
    dv.TrinhDoHocVan = dv.trinhDoHocVan;
    dv.trinhDoHocVan.DangVienId = dv.trinhDoHocVan.dangVienId;
    dv.trinhDoHocVan.GiaoDucPhoThong = dv.trinhDoHocVan.giaoDucPhoThong;
    dv.trinhDoHocVan.GiaoDucNgheNghiep = dv.trinhDoHocVan.giaoDucNgheNghiep;
    dv.trinhDoHocVan.GiaoDucDaiHoc = dv.trinhDoHocVan.giaoDucDaiHoc;
    dv.trinhDoHocVan.HocVi = dv.trinhDoHocVan.hocVi;
    dv.trinhDoHocVan.HocHam = dv.trinhDoHocVan.hocHam;
    dv.trinhDoHocVan.LyLuanChinhTri = dv.trinhDoHocVan.lyLuanChinhTri;
    dv.trinhDoHocVan.NgoaiNgu = dv.trinhDoHocVan.ngoaiNgu;
    dv.trinhDoHocVan.TinHoc = dv.trinhDoHocVan.tinHoc;
  }
  if (dv.tuyenDungQuanNgu) {
    dv.TuyenDungQuanNgu = dv.tuyenDungQuanNgu;
    dv.tuyenDungQuanNgu.DangVienId = dv.tuyenDungQuanNgu.dangVienId;
    dv.tuyenDungQuanNgu.NgayTuyenDung = dv.tuyenDungQuanNgu.ngayTuyenDung;
    dv.tuyenDungQuanNgu.CoQuanTuyenDung = dv.tuyenDungQuanNgu.coQuanTuyenDung;
    dv.tuyenDungQuanNgu.NgayNhapNgu = dv.tuyenDungQuanNgu.ngayNhapNgu;
    dv.tuyenDungQuanNgu.NgayXuatNgu = dv.tuyenDungQuanNgu.ngayXuatNgu;
    dv.tuyenDungQuanNgu.NgayTaiNgu = dv.tuyenDungQuanNgu.ngayTaiNgu;
    dv.tuyenDungQuanNgu.CapBac = dv.tuyenDungQuanNgu.capBac;
    dv.tuyenDungQuanNgu.CongViecChinh = dv.tuyenDungQuanNgu.congViecChinh;
  }
  if (dv.sucKhoeChinhSach) {
    dv.SucKhoeChinhSach = dv.sucKhoeChinhSach;
    dv.sucKhoeChinhSach.DangVienId = dv.sucKhoeChinhSach.dangVienId;
    dv.sucKhoeChinhSach.TinhTrangSucKhoe = dv.sucKhoeChinhSach.tinhTrangSucKhoe;
    dv.sucKhoeChinhSach.ThuongBinhLoai = dv.sucKhoeChinhSach.thuongBinhLoai;
    dv.sucKhoeChinhSach.GiaDinhLietSy = dv.sucKhoeChinhSach.giaDinhLietSy;
    dv.sucKhoeChinhSach.GiaDinhCoCong = dv.sucKhoeChinhSach.giaDinhCoCong;
  }
  if (dv.khenThuongKyLuat) {
    dv.KhenThuongKyLuat = dv.khenThuongKyLuat;
    dv.khenThuongKyLuat.DangVienId = dv.khenThuongKyLuat.dangVienId;
    dv.khenThuongKyLuat.KhenThuong = dv.khenThuongKyLuat.khenThuong;
    dv.khenThuongKyLuat.HuyHieuDang = dv.khenThuongKyLuat.huyHieuDang;
    dv.khenThuongKyLuat.DanhHieuPhongTang = dv.khenThuongKyLuat.danhHieuPhongTang;
    dv.khenThuongKyLuat.KyLuat = dv.khenThuongKyLuat.kyLuat;
    dv.khenThuongKyLuat.QuyetDinhId = dv.khenThuongKyLuat.quyetDinhId;
    if (dv.khenThuongKyLuat.quyetDinh) {
      dv.khenThuongKyLuat.QuyetDinh = dv.khenThuongKyLuat.quyetDinh;
      dv.khenThuongKyLuat.quyetDinh.Id = dv.khenThuongKyLuat.quyetDinh.id;
      dv.khenThuongKyLuat.quyetDinh.SoQuyetDinh = dv.khenThuongKyLuat.quyetDinh.soQuyetDinh;
      dv.khenThuongKyLuat.quyetDinh.TenQuyetDinh = dv.khenThuongKyLuat.quyetDinh.tenQuyetDinh;
      dv.khenThuongKyLuat.quyetDinh.NgayBanHanh = dv.khenThuongKyLuat.quyetDinh.ngayBanHanh;
      dv.khenThuongKyLuat.quyetDinh.TaiLieuUrl = dv.khenThuongKyLuat.quyetDinh.taiLieuUrl;
      dv.khenThuongKyLuat.quyetDinh.TaiLieuName = dv.khenThuongKyLuat.quyetDinh.taiLieuName;
    }
  }
  if (dv.dacDiemLyLich) {
    dv.DacDiemLyLich = dv.dacDiemLyLich;
    dv.dacDiemLyLich.DangVienId = dv.dacDiemLyLich.dangVienId;
    dv.dacDiemLyLich.LichSuBanThan = dv.dacDiemLyLich.lichSuBanThan;
    dv.dacDiemLyLich.QuanHeNuocNgoai = dv.dacDiemLyLich.quanHeNuocNgoai;
    dv.dacDiemLyLich.HoanCanhKinhTe = dv.dacDiemLyLich.hoanCanhKinhTe;
  }
  if (dv.danhSachQuanHeGiaDinh) {
    dv.DanhSachQuanHeGiaDinh = dv.danhSachQuanHeGiaDinh.map((item) => {
      item.Id = item.id;
      item.DangVienId = item.dangVienId;
      item.QuanHe = item.quanHe;
      item.HoTen = item.hoTen;
      item.NamSinh = item.namSinh;
      item.ThongTin = item.thongTin;
      return item;
    });
  }
  if (dv.danhSachCongTac) {
    dv.DanhSachCongTac = dv.danhSachCongTac.map((item) => {
      item.Id = item.id;
      item.DangVienId = item.dangVienId;
      item.TuThangNam = item.tuThangNam;
      item.DenThangNam = item.denThangNam;
      item.LamGiChucVuDonVi = item.lamGiChucVuDonVi;
      return item;
    });
  }
  if (dv.danhSachDaoTao) {
    dv.DanhSachDaoTao = dv.danhSachDaoTao.map((item) => {
      item.Id = item.id;
      item.DangVienId = item.dangVienId;
      item.TenTruong = item.tenTruong;
      item.NganhHoc = item.nganhHoc;
      item.TuNgay = item.tuNgay;
      item.DenNgay = item.denNgay;
      item.HinhThuc = item.hinhThuc;
      item.VanBang = item.vanBang;
      item.VanBangCert = item.vanBang;
      item.TaiLieuUrl = item.taiLieuUrl;
      return item;
    });
  }
  if (dv.danhSachDanhGia) {
    dv.DanhSachDanhGia = dv.danhSachDanhGia.map((item) => {
      item.Id = item.id;
      item.DangVienId = item.dangVienId;
      item.Nam = item.nam;
      item.XepLoai = item.xepLoai;
      item.NhanXet = item.nhanXet;
      item.TrangThai = item.trangThai;
      item.LyDoTuChoi = item.lyDoTuChoi;
      item.SoQuyetDinh = item.soQuyetDinh;
      item.QuyetDinhId = item.quyetDinhId;
      if (item.quyetDinh) {
        item.QuyetDinh = item.quyetDinh;
        item.quyetDinh.Id = item.quyetDinh.id;
        item.quyetDinh.SoQuyetDinh = item.quyetDinh.soQuyetDinh;
      }
      return item;
    });
  }
  if (dv.danhSachQuanHam) {
    dv.DanhSachQuanHam = dv.danhSachQuanHam.map((item) => {
      item.Id = item.id;
      item.DangVienId = item.dangVienId;
      item.CapBac = item.capBac;
      item.ChucVu = item.chucVu;
      item.DonVi = item.donVi;
      item.NgayHieuLuc = item.ngayHieuLuc;
      item.SoQuyetDinh = item.soQuyetDinh;
      item.QuyetDinhId = item.quyetDinhId;
      if (item.quyetDinh) item.QuyetDinh = item.quyetDinh;
      return item;
    });
  }
  if (dv.danhSachTaiLieu) {
    dv.DanhSachTaiLieu = dv.danhSachTaiLieu.map((item) => {
      item.Id = item.id;
      item.DangVienId = item.dangVienId;
      item.TenTaiLieu = item.tenTaiLieu;
      item.LoaiTaiLieu = item.loaiTaiLieu;
      item.FileUrl = item.fileUrl;
      item.FileType = item.fileType;
      return item;
    });
  }
  return dv;
}

function mapDangVienWhere(where = {}) {
  const mapped = {};
  for (const [key, val] of Object.entries(where || {})) {
    if (key === "Id" || key === "id") mapped.id = val;
    else if (key === "ToChucDangId" || key === "toChucDangId") mapped.toChucDangId = val;
    else if (key === "SoLyLich" || key === "soLyLich") mapped.soLyLich = val;
    else if (key === "SoTheDangVien" || key === "soTheDangVien") mapped.soTheDangVien = val;
    else if (key === "TrangThai" || key === "trangThai") mapped.trangThai = val;
    else if (key === "DeletedAt" || key === "deletedAt") mapped.deletedAt = val;
    else if (key === "LyLichCaNhan" || key === "lyLichCaNhan") mapped.lyLichCaNhan = val;
    else if (key === "ThongTinVaoDang" || key === "thongTinVaoDang") mapped.thongTinVaoDang = val;
    else if (key === "OR" && Array.isArray(val)) {
      mapped.OR = val.map(mapDangVienWhere);
    } else if (key === "AND" && Array.isArray(val)) {
      mapped.AND = val.map(mapDangVienWhere);
    } else if (key === "NOT" && Array.isArray(val)) {
      mapped.NOT = val.map(mapDangVienWhere);
    } else mapped[key] = val;
  }
  return mapped;
}

function mapDangVienDataToDb(data = {}) {
  const mapped = {};
  if (data.id !== undefined || data.Id !== undefined) mapped.id = data.id !== undefined ? data.id : data.Id;
  if (data.toChucDangId !== undefined || data.ToChucDangId !== undefined) mapped.toChucDangId = data.toChucDangId !== undefined ? data.toChucDangId : data.ToChucDangId;
  if (data.soLyLich !== undefined || data.SoLyLich !== undefined) mapped.soLyLich = data.soLyLich !== undefined ? data.soLyLich : data.SoLyLich;
  if (data.soTheDangVien !== undefined || data.SoTheDangVien !== undefined) mapped.soTheDangVien = data.soTheDangVien !== undefined ? data.soTheDangVien : data.SoTheDangVien;
  if (data.trangThai !== undefined || data.TrangThai !== undefined) mapped.trangThai = data.trangThai !== undefined ? data.trangThai : data.TrangThai;
  if (data.toChucDang !== undefined || data.ToChucDang !== undefined) {
    const org = data.toChucDang !== undefined ? data.toChucDang : data.ToChucDang;
    if (org && org.connect) {
      mapped.toChucDang = {
        connect: {
          id: org.connect.id || org.connect.Id,
        },
      };
    } else {
      mapped.toChucDang = org;
    }
  }
  return mapped;
}

function mapPersonalInfoDataToDb(data = {}) {
  const mapped = {};
  const mapKey = (k1, k2, transform) => {
    if (data[k1] !== undefined || data[k2] !== undefined) {
      const v = data[k1] !== undefined ? data[k1] : data[k2];
      mapped[k1] = transform ? transform(v) : v;
    }
  };
  mapKey("dangVienId", "DangVienId");
  mapKey("hoTenDangDung", "HoTenDangDung");
  mapKey("hoTenKhaiSinh", "HoTenKhaiSinh");
  mapKey("gioiTinh", "GioiTinh");
  mapKey("ngaySinh", "NgaySinh", (v) => (v ? new Date(v) : undefined));
  mapKey("noiSinh", "NoiSinh");
  mapKey("queQuan", "QueQuan");
  mapKey("noiThuongTru", "NoiThuongTru");
  mapKey("noiTamTru", "NoiTamTru");
  mapKey("danToc", "DanToc");
  mapKey("tonGiao", "TonGiao");
  mapKey("thanhPhanGiaDinh", "ThanhPhanGiaDinh");
  mapKey("ngheNghiepHienNay", "NgheNghiepHienNay");
  mapKey("ngheNghiepKhiVaoDang", "NgheNghiepKhiVaoDang");
  mapKey("soCMND", "SoCMND");
  mapKey("soCMTQD", "SoCMTQD");
  return mapped;
}

function mapAcademicDataToDb(data = {}) {
  const mapped = {};
  const mapKey = (k1, k2) => {
    if (data[k1] !== undefined || data[k2] !== undefined) {
      mapped[k1] = data[k1] !== undefined ? data[k1] : data[k2];
    }
  };
  mapKey("dangVienId", "DangVienId");
  mapKey("giaoDucPhoThong", "GiaoDucPhoThong");
  mapKey("giaoDucNgheNghiep", "GiaoDucNgheNghiep");
  mapKey("giaoDucDaiHoc", "GiaoDucDaiHoc");
  mapKey("hocVi", "HocVi");
  mapKey("hocHam", "HocHam");
  mapKey("lyLuanChinhTri", "LyLuanChinhTri");
  mapKey("ngoaiNgu", "NgoaiNgu");
  mapKey("tinHoc", "TinHoc");
  return mapped;
}

function mapMilitaryDataToDb(data = {}) {
  const mapped = {};
  const mapKey = (k1, k2, transform) => {
    if (data[k1] !== undefined || data[k2] !== undefined) {
      const v = data[k1] !== undefined ? data[k1] : data[k2];
      mapped[k1] = transform ? transform(v) : v;
    }
  };
  mapKey("dangVienId", "DangVienId");
  mapKey("ngayTuyenDung", "NgayTuyenDung", (v) => (v ? new Date(v) : null));
  mapKey("coQuanTuyenDung", "CoQuanTuyenDung");
  mapKey("ngayNhapNgu", "NgayNhapNgu", (v) => (v ? new Date(v) : null));
  mapKey("ngayXuatNgu", "NgayXuatNgu", (v) => (v ? new Date(v) : null));
  mapKey("ngayTaiNgu", "NgayTaiNgu", (v) => (v ? new Date(v) : null));
  mapKey("capBac", "CapBac");
  mapKey("congViecChinh", "CongViecChinh");
  return mapped;
}

function mapHealthPolicyDataToDb(data = {}) {
  const mapped = {};
  const mapKey = (k1, k2) => {
    if (data[k1] !== undefined || data[k2] !== undefined) {
      mapped[k1] = data[k1] !== undefined ? data[k1] : data[k2];
    }
  };
  mapKey("dangVienId", "DangVienId");
  mapKey("tinhTrangSucKhoe", "TinhTrangSucKhoe");
  mapKey("thuongBinhLoai", "ThuongBinhLoai");
  mapKey("giaDinhLietSy", "GiaDinhLietSy");
  mapKey("giaDinhCoCong", "GiaDinhCoCong");
  return mapped;
}

function mapRewardDisciplineDataToDb(data = {}) {
  const mapped = {};
  const mapKey = (k1, k2) => {
    if (data[k1] !== undefined || data[k2] !== undefined) {
      mapped[k1] = data[k1] !== undefined ? data[k1] : data[k2];
    }
  };
  mapKey("dangVienId", "DangVienId");
  mapKey("khenThuong", "KhenThuong");
  mapKey("huyHieuDang", "HuyHieuDang");
  mapKey("danhHieuPhongTang", "DanhHieuPhongTang");
  mapKey("kyLuat", "KyLuat");
  mapKey("quyetDinhId", "QuyetDinhId");
  return mapped;
}

function mapBackgroundFeaturesDataToDb(data = {}) {
  const mapped = {};
  const mapKey = (k1, k2) => {
    if (data[k1] !== undefined || data[k2] !== undefined) {
      mapped[k1] = data[k1] !== undefined ? data[k1] : data[k2];
    }
  };
  mapKey("dangVienId", "DangVienId");
  mapKey("lichSuBanThan", "LichSuBanThan");
  mapKey("quanHeNuocNgoai", "QuanHeNuocNgoai");
  mapKey("hoanCanhKinhTe", "HoanCanhKinhTe");
  return mapped;
}

function mapFamilyRelationDataToDb(data = {}) {
  const mapped = {};
  const mapKey = (k1, k2) => {
    if (data[k1] !== undefined || data[k2] !== undefined) {
      mapped[k1] = data[k1] !== undefined ? data[k1] : data[k2];
    }
  };
  mapKey("id", "Id");
  mapKey("dangVienId", "DangVienId");
  mapKey("quanHe", "QuanHe");
  mapKey("hoTen", "HoTen");
  mapKey("namSinh", "NamSinh");
  mapKey("thongTin", "ThongTin");
  return mapped;
}

const DANG_VIEN_RELATION_KEYS = {
  tochucdang: "toChucDang",
  lylichcanhan: "lyLichCaNhan",
  thongtinvaodang: "thongTinVaoDang",
  trinhdohocvan: "trinhDoHocVan",
  tuyendungquanngu: "tuyenDungQuanNgu",
  suckhoechinhsach: "sucKhoeChinhSach",
  khenthuongkyluat: "khenThuongKyLuat",
  dacdiemlylich: "dacDiemLyLich",
  danhsachquanhegiadinh: "danhSachQuanHeGiaDinh",
  danhsachcongtac: "danhSachCongTac",
  danhsachdaotao: "danhSachDaoTao",
  danhsachquanham: "danhSachQuanHam",
  danhsachdanhgia: "danhSachDanhGia",
  danhsachtailieu: "danhSachTaiLieu",
  danhsachhuyhieu: "danhSachHuyHieu",
};

function mapDangVienInclude(include) {
  if (!include || typeof include !== "object") return include;
  const mapped = {};
  for (const [key, val] of Object.entries(include)) {
    const canonicalKey =
      DANG_VIEN_RELATION_KEYS[key.toLowerCase()] ||
      (key.charAt(0).toLowerCase() + key.slice(1));

    if (typeof val === "boolean") {
      mapped[canonicalKey] = val;
    } else if (val && typeof val === "object") {
      const relationConfig = {};
      if (val.select) {
        relationConfig.select = {};
        for (const [sKey, sVal] of Object.entries(val.select)) {
          const camelSKey = sKey.charAt(0).toLowerCase() + sKey.slice(1);
          relationConfig.select[camelSKey] = sVal;
        }
      }
      if (val.include) {
        relationConfig.include = {};
        for (const [iKey, iVal] of Object.entries(val.include)) {
          const camelIKey = iKey.charAt(0).toLowerCase() + iKey.slice(1);
          relationConfig.include[camelIKey] = iVal;
        }
      }
      if (val.where) {
        relationConfig.where = {};
        for (const [wKey, wVal] of Object.entries(val.where)) {
          const camelWKey = wKey.charAt(0).toLowerCase() + wKey.slice(1);
          relationConfig.where[camelWKey] = wVal;
        }
      }
      if (val.orderBy) {
        if (Array.isArray(val.orderBy)) {
          relationConfig.orderBy = val.orderBy.map((item) => {
            const o = {};
            for (const [oKey, oVal] of Object.entries(item)) {
              o[oKey.charAt(0).toLowerCase() + oKey.slice(1)] = oVal;
            }
            return o;
          });
        } else if (typeof val.orderBy === "object") {
          relationConfig.orderBy = {};
          for (const [oKey, oVal] of Object.entries(val.orderBy)) {
            relationConfig.orderBy[oKey.charAt(0).toLowerCase() + oKey.slice(1)] = oVal;
          }
        }
      }
      mapped[canonicalKey] = relationConfig;
    } else {
      mapped[canonicalKey] = val;
    }
  }
  return mapped;
}

/**
 * Tương tác cơ sở dữ liệu cho hồ sơ Đảng viên và các phần liên quan
 */
class MemberRepository {
  get include() {
    return dangVienListInclude;
  }
  get detailInclude() {
    return dangVienDetailInclude;
  }

  /**
   * Tìm tất cả Đảng viên với include cơ bản (dùng cho danh sách)
   * @param {Object} where Điều kiện tìm kiếm
   * @returns {Promise<Array<Object>>} Danh sách Đảng viên
   */
  async findAll(where = {}) {
    const list = await prisma.dangVien.findMany({ where: mapDangVienWhere(where), include: dangVienListInclude });
    return list.map(attachDangVienAliases);
  }

  /**
   * Tìm tất cả Đảng viên với include tùy chỉnh do caller truyền vào
   * @param {Object} where Điều kiện tìm kiếm
   * @param {Object} include Các quan hệ cần nạp
   * @returns {Promise<Array<Object>>} Danh sách Đảng viên
   */
  async findAllWithInclude(where = {}, include) {
    const query = { where: mapDangVienWhere(where) };
    if (include && Object.keys(include).length > 0) query.include = mapDangVienInclude(include);
    const list = await prisma.dangVien.findMany(query);
    return list.map(attachDangVienAliases);
  }

  /**
   * Tìm Đảng viên theo ID (gồm đầy đủ 11 bảng con liên quan)
   * @param {string} id ID của Đảng viên
   * @returns {Promise<Object|null>} Đối tượng Đảng viên hoặc null nếu không tìm thấy
   */
  async findById(id) {
    const dv = await prisma.dangVien.findUnique({
      where: { id },
      include: dangVienDetailInclude,
    });
    return attachDangVienAliases(dv);
  }

  /**
   * Tìm danh sách ID Đảng viên khớp điều kiện
   * @param {Object} where Điều kiện tìm kiếm
   * @returns {Promise<Array<{Id: string, id: string}>>} Danh sách Id Đảng viên
   */
  async findManyIds(where = {}) {
    const list = await prisma.dangVien.findMany({ where: mapDangVienWhere(where), select: { id: true } });
    return list.map((item) => ({ id: item.id, Id: item.id }));
  }

  /**
   * Lấy thông tin Khen thưởng - Kỷ luật của 1 Đảng viên
   * @param {string} dangVienId ID của Đảng viên
   * @returns {Promise<Object|null>} Đối tượng Khen thưởng - Kỷ luật, hoặc null nếu chưa có
   */
  async findRewardDiscipline(dangVienId) {
    const item = await prisma.khenThuongKyLuat.findUnique({
      where: { dangVienId },
      select: { kyLuat: true },
    });
    if (!item) return null;
    return { kyLuat: item.kyLuat, KyLuat: item.kyLuat };
  }

  /**
   * Tìm Đảng viên đầu tiên khớp điều kiện
   * @param {Object} whereOrQuery Điều kiện tìm kiếm, hoặc cả object query Prisma
   * @returns {Promise<Object|null>} Đối tượng Đảng viên đầu tiên khớp điều kiện, hoặc null
   */
  async findFirst(whereOrQuery) {
    let dv;
    if (whereOrQuery && whereOrQuery.where) {
      dv = await prisma.dangVien.findFirst({ ...whereOrQuery, where: mapDangVienWhere(whereOrQuery.where) });
    } else {
      dv = await prisma.dangVien.findFirst({ where: mapDangVienWhere(whereOrQuery) });
    }
    return attachDangVienAliases(dv);
  }

  /**
   * Tạo mới Đảng viên
   * @param {Object} data Dữ liệu Đảng viên
   * @returns {Promise<Object>} Đối tượng Đảng viên đã tạo
   */
  async create(data) {
    const dv = await prisma.dangVien.create({
      data: mapDangVienDataToDb(data),
      include: dangVienDetailInclude,
    });
    return attachDangVienAliases(dv);
  }

  /**
   * Cập nhật Đảng viên
   * @param {string} id ID của Đảng viên
   * @param {Object} data Dữ liệu cập nhật
   * @returns {Promise<Object>} Đối tượng Đảng viên đã cập nhật
   */
  async update(id, data) {
    const dv = await prisma.dangVien.update({
      where: { id },
      data: mapDangVienDataToDb(data),
      include: dangVienDetailInclude,
    });
    return attachDangVienAliases(dv);
  }

  /**
   * Xóa Đảng viên
   * @param {string} id ID của Đảng viên
   * @returns {Promise<Object>} Đối tượng Đảng viên đã xóa
   */
  async delete(id) {
    const dv = await prisma.dangVien.delete({ where: { id } });
    return attachDangVienAliases(dv);
  }

  /**
   * Upsert thông tin Lý lịch cá nhân
   * @param {string} dangVienId ID của Đảng viên
   * @param {Object} data Dữ liệu Lý lịch cá nhân
   * @returns {Promise<Object>} Đối tượng Lý lịch cá nhân đã tạo/cập nhật
   */
  async upsertPersonalInfo(dangVienId, data) {
    const dbData = mapPersonalInfoDataToDb(data);
    return prisma.lyLichCaNhan.upsert({
      where: { dangVienId },
      create: { dangVienId, ...dbData },
      update: dbData,
    });
  }

  /**
   * Upsert thông tin Trình độ học vấn
   * @param {string} dangVienId ID của Đảng viên
   * @param {Object} data Dữ liệu Trình độ học vấn
   * @returns {Promise<Object>} Đối tượng Trình độ học vấn đã tạo/cập nhật
   */
  async upsertAcademicLevel(dangVienId, data) {
    const dbData = mapAcademicDataToDb(data);
    return prisma.trinhDoHocVan.upsert({
      where: { dangVienId },
      create: { dangVienId, ...dbData },
      update: dbData,
    });
  }

  /**
   * Upsert thông tin Tuyển dụng quân sự
   * @param {string} dangVienId ID của Đảng viên
   * @param {Object} data Dữ liệu Tuyển dụng quân sự
   * @returns {Promise<Object>} Đối tượng Tuyển dụng quân sự đã tạo/cập nhật
   */
  async upsertMilitaryRecruitment(dangVienId, data) {
    const dbData = mapMilitaryDataToDb(data);
    return prisma.tuyenDungQuanNgu.upsert({
      where: { dangVienId },
      create: { dangVienId, ...dbData },
      update: dbData,
    });
  }

  /**
   * Upsert thông tin Sức khỏe - Chính sách
   * @param {string} dangVienId ID của Đảng viên
   * @param {Object} data Dữ liệu Sức khỏe - Chính sách
   * @returns {Promise<Object>} Đối tượng Sức khỏe - Chính sách đã tạo/cập nhật
   */
  async upsertHealthPolicy(dangVienId, data) {
    const dbData = mapHealthPolicyDataToDb(data);
    return prisma.sucKhoeChinhSach.upsert({
      where: { dangVienId },
      create: { dangVienId, ...dbData },
      update: dbData,
    });
  }

  /**
   * Upsert thông tin Khen thưởng - Kỷ luật
   * @param {string} dangVienId ID của Đảng viên
   * @param {Object} data Dữ liệu Khen thưởng - Kỷ luật
   * @returns {Promise<Object>} Đối tượng Khen thưởng - Kỷ luật đã tạo/cập nhật
   */
  async upsertRewardDiscipline(dangVienId, data) {
    const dbData = mapRewardDisciplineDataToDb(data);
    return prisma.khenThuongKyLuat.upsert({
      where: { dangVienId },
      create: { dangVienId, ...dbData },
      update: dbData,
    });
  }

  /**
   * Upsert đặc điểm lý lịch
   * @param {string} dangVienId ID của Đảng viên
   * @param {Object} data Dữ liệu đặc điểm lý lịch
   * @returns {Promise<Object>} Đối tượng Đặc điểm lý lịch đã tạo/cập nhật
   */
  async upsertBackgroundFeatures(dangVienId, data) {
    const dbData = mapBackgroundFeaturesDataToDb(data);
    return prisma.dacDiemLyLich.upsert({
      where: { dangVienId },
      create: { dangVienId, ...dbData },
      update: dbData,
    });
  }

  /**
   * Xóa toàn bộ quan hệ gia đình của một Đảng viên
   * @param {string} dangVienId ID của Đảng viên
   * @returns {Promise<number>} Số lượng quan hệ gia đình đã xóa
   */
  async deleteManyFamilyRelations(dangVienId) {
    return prisma.quanHeGiaDinh.deleteMany({ where: { dangVienId } });
  }

  /**
   * Tạo hàng loạt quan hệ gia đình
   * @param {Array<Object>} data Danh sách dữ liệu quan hệ gia đình
   * @returns {Promise<number>} Số lượng quan hệ gia đình đã tạo
   */
  async createManyFamilyRelations(data) {
    return prisma.quanHeGiaDinh.createMany({ data: data.map(mapFamilyRelationDataToDb) });
  }

  /**
   * Tạo mới một quan hệ gia đình
   * @param {Object} data Dữ liệu quan hệ gia đình
   * @returns {Promise<Object>} Đối tượng quan hệ gia đình đã tạo
   */
  async createFamilyRelation(data) {
    return prisma.quanHeGiaDinh.create({ data: mapFamilyRelationDataToDb(data) });
  }

  /**
   * Cập nhật quan hệ gia đình
   * @param {string} id ID của quan hệ gia đình
   * @param {Object} data Dữ liệu cập nhật
   * @returns {Promise<Object>} Đối tượng quan hệ gia đình đã cập nhật
   */
  async updateFamilyRelation(id, data) {
    return prisma.quanHeGiaDinh.update({ where: { id }, data: mapFamilyRelationDataToDb(data) });
  }

  /**
   * Xóa một quan hệ gia đình
   * @param {string} id ID của quan hệ gia đình
   * @returns {Promise<Object>} Đối tượng quan hệ gia đình đã xóa
   */
  async deleteFamilyRelation(id) {
    return prisma.quanHeGiaDinh.delete({ where: { id } });
  }

  /**
   * Tìm nhật ký hệ thống theo điều kiện
   * @param {Object} where Điều kiện tìm kiếm
   * @returns {Promise<Array<Object>>} Danh sách nhật ký hệ thống, sắp xếp theo thời gian tạo tăng dần
   */
  async findAuditLogs(where) {
    const mappedWhere = {};
    for (const [k, v] of Object.entries(where || {})) {
      if (k === "TenBang" || k === "tenBang") mappedWhere.tenBang = v;
      else if (k === "BanGhiId" || k === "banGhiId") mappedWhere.banGhiId = v;
      else if (k === "NguoiDungId" || k === "nguoiDungId") mappedWhere.nguoiDungId = v;
      else if (k === "HanhDong" || k === "hanhDong") mappedWhere.hanhDong = v;
      else if (k === "OR" && Array.isArray(v)) mappedWhere.OR = v;
      else if (k === "AND" && Array.isArray(v)) mappedWhere.AND = v;
      else mappedWhere[k] = v;
    }
    const logs = await prisma.nhatKyHeThong.findMany({
      where: mappedWhere,
      orderBy: { createdAt: "asc" },
    });
    return logs.map((log) => {
      log.Id = log.id;
      log.NguoiDungId = log.nguoiDungId;
      log.HanhDong = log.hanhDong;
      log.TenBang = log.tenBang;
      log.BanGhiId = log.banGhiId;
      log.GiaTriCu = log.giaTriCu;
      log.GiaTriMoi = log.giaTriMoi;
      log.DiaChiIp = log.diaChiIp;
      log.CreatedAt = log.createdAt;
      return log;
    });
  }
}

module.exports = new MemberRepository();
