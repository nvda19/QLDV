const {
  mapToFrontend,
  getOrgHierarchy,
} = require("../../../src/domain/mappers/member.mapper");

describe("member.mapper", () => {
  describe("getOrgHierarchy", () => {
    test("trả về các cấp rỗng nếu thiếu orgId hoặc orgMap", () => {
      expect(getOrgHierarchy(null, null)).toEqual({ level1: "", level2: "", level3: "" });
      expect(getOrgHierarchy("org1", null)).toEqual({ level1: "", level2: "", level3: "" });
    });

    test("trả về các cấp rỗng nếu không tìm thấy orgId trong map", () => {
      const map = new Map();
      expect(getOrgHierarchy("org-invalid", map)).toEqual({ level1: "", level2: "", level3: "" });
    });

    test("path length = 1 -> chỉ có level3", () => {
      const map = new Map([
        ["org1", { Ten: "Chi bộ A", ToChucChaId: null }],
      ]);

      expect(getOrgHierarchy("org1", map)).toEqual({
        level1: "",
        level2: "",
        level3: "Chi bộ A",
      });
    });

    test("path length = 2 -> có level1 và level3", () => {
      const map = new Map([
        ["org1", { Ten: "Đảng bộ cấp trên", ToChucChaId: null }],
        ["org2", { Ten: "Chi bộ B", ToChucChaId: "org1" }],
      ]);

      expect(getOrgHierarchy("org2", map)).toEqual({
        level1: "Đảng bộ cấp trên",
        level2: "",
        level3: "Chi bộ B",
      });
    });

    test("path length = 3 -> có level1, level2 và level3", () => {
      const map = new Map([
        ["org1", { Ten: "Đảng bộ cấp 1", ToChucChaId: null }],
        ["org2", { Ten: "Đảng bộ bộ phận 2", ParentId: "org1" }], // check ToChucChaId hoặc ParentId
        ["org3", { Ten: "Chi bộ C", ToChucChaId: "org2" }],
      ]);

      expect(getOrgHierarchy("org3", map)).toEqual({
        level1: "Đảng bộ cấp 1",
        level2: "Đảng bộ bộ phận 2",
        level3: "Chi bộ C",
      });
    });

    test("path length >= 4 -> lấy 3 cấp đầu tiên sau khi reverse", () => {
      const map = new Map([
        ["org1", { Ten: "Đảng bộ cấp 1", ToChucChaId: null }],
        ["org2", { Ten: "Đảng bộ cấp 2", ToChucChaId: "org1" }],
        ["org3", { Ten: "Đảng bộ cấp 3", ToChucChaId: "org2" }],
        ["org4", { Ten: "Chi bộ D", ToChucChaId: "org3" }],
      ]);

      expect(getOrgHierarchy("org4", map)).toEqual({
        level1: "Đảng bộ cấp 1",
        level2: "Đảng bộ cấp 2",
        level3: "Đảng bộ cấp 3",
      });
    });
  });

  describe("mapToFrontend", () => {
    test("trả về null nếu input falsy", () => {
      expect(mapToFrontend(null)).toBeNull();
      expect(mapToFrontend(undefined)).toBeNull();
    });

    test("map chính xác các trường con và danh sách mảng liên kết", () => {
      const dv = {
        Id: "dv1",
        SoLyLich: "100",
        SoTheDangVien: "30.000001",
        TrangThai: "HOAT_DONG",
        ToChucDangId: "org1",
        ToChucDang: { Id: "org1", Ten: "Chi bộ A", ToChucChaId: null },
        LyLichCaNhan: {
          HoTenDangDung: "Nguyễn Văn A",
          HoTenKhaiSinh: "Nguyễn Văn A",
          GioiTinh: "Nam",
          NgaySinh: "1990-01-01",
          NoiSinh: "Hà Nội",
          QueQuan: "Hà Nội",
          NoiThuongTru: "Hà Nội",
          NoiTamTru: "Hà Nội",
          DanToc: "Kinh",
          TonGiao: "Không",
          ThanhPhanGiaDinh: "Bần nông",
          NgheNghiepHienNay: "Cán bộ",
          NgheNghiepKhiVaoDang: "Sinh viên",
          SoCMND: "123456789",
          SoCMTQD: "QD-123",
        },
        ThongTinVaoDang: {
          NgayVaoDang: "2015-01-01",
          ChiBoVaoDang: "Chi bộ Sinh viên",
          NguoiGioiThieu1: "Nguyễn Văn B",
          ChucVuNGT1: "Bí thư",
          NguoiGioiThieu2: "Nguyễn Văn C",
          ChucVuNGT2: "Phó bí thư",
          NgayQuyetDinhKetNap: "2014-12-30",
          NgayChinhThuc: "2016-01-01",
          ChiBoChinhThuc: "Chi bộ A",
          NoiSinhHoatDang: "Chi bộ A",
          ChucVuDang: "Đảng viên",
          NgayVaoDoan: "2005-01-01",
          ToChucXaHoi: "Hội cựu sinh viên",
          NgayMienCongTac: "2030-01-01",
        },
        TuyenDungQuanNgu: {
          NgayTuyenDung: "2018-01-01",
          CoQuanTuyenDung: "Bộ Quốc phòng",
          NgayNhapNgu: "2018-01-01",
          NgayXuatNgu: "2020-01-01",
          NgayTaiNgu: null,
          CapBac: "Trung úy",
          CongViecChinh: "Kỹ sư",
        },
        TrinhDoHocVan: {
          GiaoDucPhoThong: "12/12",
          GiaoDucNgheNghiep: "Không",
          GiaoDucDaiHoc: "Cử nhân",
          HocVi: "Cử nhân",
          HocHam: "Không",
          LyLuanChinhTri: "Sơ cấp",
          NgoaiNgu: "Tiếng Anh",
          TinHoc: "Bằng B",
        },
        SucKhoeChinhSach: {
          TinhTrangSucKhoe: "Tốt",
          ThuongBinhLoai: "Không",
          GiaDinhLietSy: false,
          GiaDinhCoCong: true,
        },
        KhenThuongKyLuat: {
          KhenThuong: "Bằng khen",
          HuyHieuDang: "30 năm",
          DanhHieuPhongTang: "Chiến sĩ thi đua",
          KyLuat: "Không",
        },
        DacDiemLyLich: {
          LichSuBanThan: { details: "Lịch sử" },
          QuanHeNuocNgoai: { details: "Quan hệ" },
          HoanCanhKinhTe: { details: "Kinh tế" },
        },
        DanhSachQuanHeGiaDinh: [{ Id: "qh1", QuanHe: "Cha" }],
        DanhSachCongTac: [{ Id: "ct1", NoiCongTac: "Chi bộ A" }],
        DanhSachDaoTao: [{ Id: "dt1", VanBangChungChi: "Cử nhân CNTT" }],
        DanhSachDanhGia: [{ Id: "dg1", Nam: 2024, XepLoai: "Tốt" }],
        DanhSachQuanHam: [{ Id: "qh2", QuanHam: "Trung úy" }],
        DanhSachTaiLieu: [{ Id: "tl1", TenFile: "cv.pdf" }],
        CreatedAt: "2024-01-01T00:00:00Z",
        UpdatedAt: "2024-01-01T01:00:00Z",
      };

      const orgMap = new Map([
        ["org1", { Ten: "Chi bộ A", ToChucChaId: null }],
      ]);

      const result = mapToFrontend(dv, orgMap);

      expect(result.Id).toBe("dv1");
      expect(result.ToChucDang.level3).toBe("Chi bộ A");
      expect(result.HoTenDangDung).toBe("Nguyễn Văn A");
      expect(result.NgayVaoDang).toBe("2015-01-01");
      expect(result.CapBac).toBe("Trung úy");
      expect(result.GiaoDucDaiHoc).toBe("Cử nhân");
      expect(result.GiaDinhCoCong).toBe(true);
      expect(result.HuyHieuDang).toBe("30 năm");
      expect(result.LichSuBanThan).toEqual({ details: "Lịch sử" });
      expect(result.QuanHeGiaDinh).toEqual([{ Id: "qh1", QuanHe: "Cha" }]);
      expect(result.QuaTrinhDaoTao).toEqual([{ Id: "dt1", VanBangChungChi: "Cử nhân CNTT", VanBangCert: "Cử nhân CNTT" }]);
    });

    test("trả về các mảng rỗng mặc định và các giá trị mặc định nếu thiếu thông tin chi tiết", () => {
      const dv = {
        Id: "dv2",
        ToChucDangId: null,
        ToChucDang: null,
      };

      const result = mapToFrontend(dv);

      expect(result.HoTenDangDung).toBe("");
      expect(result.GioiTinh).toBe("Nam");
      expect(result.GiaDinhLietSy).toBe(false);
      expect(result.QuanHeGiaDinh).toEqual([]);
      expect(result.QuaTrinhDaoTao).toEqual([]);
      expect(result.ToChucDang).toBeNull();
    });
  });
});
