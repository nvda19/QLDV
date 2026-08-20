/**
 * Unit test cho memberExport.service — dựng file Word thật bằng thư viện `docx`
 * (không mock docx). Chỉ mock nguồn dữ liệu: memberRepository, orgRepository.
 */
jest.mock("../../src/repositories/member/member.repository", () => ({
  findById: jest.fn(),
}));
jest.mock("../../src/repositories/org.repository", () => ({
  findAll: jest.fn(),
}));

const memberRepository = require("../../src/repositories/member/member.repository");
const orgRepository = require("../../src/repositories/org.repository");
const { exportMemberToWord } = require("../../src/services/member/memberExport.service");

afterEach(() => {
  jest.clearAllMocks();
});

const fullMemberRaw = {
  Id: "m1",
  ToChucDangId: "org3",
  SoLyLich: "SLL-001",
  SoTheDangVien: "SDV-001",
  TrangThai: "HOAT_DONG",
  ToChucDang: { Id: "org3", Ten: "Chi bộ 3", ToChucChaId: "org2" },
  LyLichCaNhan: {
    HoTenDangDung: "Nguyễn Văn A",
    HoTenKhaiSinh: "Nguyễn Văn A",
    GioiTinh: "Nam",
    NgaySinh: "1980-05-01",
    NoiSinh: "Hà Nội",
    QueQuan: "Hà Nội",
    NoiThuongTru: "Hà Nội",
    NoiTamTru: "Hà Nội",
    DanToc: "Kinh",
    TonGiao: "Không",
    ThanhPhanGiaDinh: "Công nhân",
    NgheNghiepHienNay: "Kỹ sư",
    NgheNghiepKhiVaoDang: "Sinh viên",
    SoCMND: "001080000123",
    SoCMTQD: "",
  },
  ThongTinVaoDang: {
    NgayVaoDang: "2005-01-01",
    ChiBoVaoDang: "Chi bộ A",
    NguoiGioiThieu1: "Trần Văn B",
    ChucVuNGT1: "Bí thư",
    NguoiGioiThieu2: "Lê Văn C",
    ChucVuNGT2: "Phó bí thư",
    NgayQuyetDinhKetNap: "2005-01-01",
    NgayChinhThuc: "2006-01-01",
    ChiBoChinhThuc: "Chi bộ A",
    NoiSinhHoatDang: "Chi bộ 3",
    ChucVuDang: "Đảng viên",
    NgayVaoDoan: "1998-01-01",
    ToChucXaHoi: "Công đoàn",
    NgayMienCongTac: "2020-01-01",
  },
  TrinhDoHocVan: {
    GiaoDucPhoThong: "12/12",
    GiaoDucDaiHoc: "Đại học",
    HocVi: "Cử nhân",
    HocHam: "",
    LyLuanChinhTri: "Trung cấp",
    NgoaiNgu: "Anh văn B",
    TinHoc: "Văn phòng",
  },
  TuyenDungQuanNgu: {
    NgayTuyenDung: "2003-01-01",
    CoQuanTuyenDung: "Sở Nội vụ",
    NgayNhapNgu: "2001-01-01",
    NgayXuatNgu: "2003-01-01",
    CapBac: "Thượng úy",
    CongViecChinh: "Chuyên viên",
  },
  SucKhoeChinhSach: {
    TinhTrangSucKhoe: "Tốt",
    GiaDinhLietSy: true,
    GiaDinhCoCong: false,
  },
  KhenThuongKyLuat: {
    KhenThuong: "Chiến sĩ thi đua",
    HuyHieuDang: "30 năm tuổi Đảng",
    DanhHieuPhongTang: "",
    KyLuat: "",
  },
  DacDiemLyLich: {},
  DanhSachQuanHeGiaDinh: [
    { QuanHe: "Cha", HoTen: "Nguyễn Văn X", NamSinh: 1950, ThongTin: "Hà Nội" },
  ],
  DanhSachCongTac: [
    {
      TuThangNam: "2000-01-01",
      DenThangNam: "2005-01-01",
      LamGiChucVuDonVi: "Nhân viên",
    },
  ],
  DanhSachDaoTao: [
    {
      TenTruong: "Đại học Quốc gia",
      NganhHoc: "CNTT",
      TuNgay: "2001-01-01",
      DenNgay: "2005-01-01",
      HinhThuc: "Chính quy",
      VanBangChungChi: "Cử nhân",
    },
  ],
  DanhSachDanhGia: [
    { Nam: 2023, XepLoai: "Hoàn thành tốt", NhanXet: "Tốt", TrangThai: "APPROVED" },
  ],
  DanhSachQuanHam: [
    {
      CapBac: "Thượng úy",
      ChucVu: "Đội trưởng",
      DonVi: "Đội 1",
      NgayHieuLuc: "2010-01-01",
      SoQuyetDinh: "QD-01",
    },
  ],
};

const orgList = [
  { Id: "org1", Ten: "Đảng bộ cấp trên", ToChucChaId: null },
  { Id: "org2", Ten: "Đảng bộ cơ sở", ToChucChaId: "org1" },
  { Id: "org3", Ten: "Chi bộ 3", ToChucChaId: "org2" },
];

describe("exportMemberToWord", () => {
  test("không tìm thấy đảng viên -> ném lỗi, không gọi orgRepository", async () => {
    memberRepository.findById.mockResolvedValue(null);

    await expect(exportMemberToWord("khong-ton-tai")).rejects.toThrow(
      "Không tìm thấy đảng viên",
    );
    expect(orgRepository.findAll).not.toHaveBeenCalled();
  });

  test("dữ liệu đầy đủ -> trả về Buffer chứa nội dung file docx", async () => {
    memberRepository.findById.mockResolvedValue(fullMemberRaw);
    orgRepository.findAll.mockResolvedValue(orgList);

    const result = await exportMemberToWord("m1");

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(memberRepository.findById).toHaveBeenCalledWith("m1");
  });

  test("thiếu toàn bộ trường tùy chọn / mảng rỗng -> không throw, vẫn trả về Buffer", async () => {
    const minimalRaw = {
      Id: "m2",
      ToChucDangId: null,
      SoLyLich: null,
      SoTheDangVien: null,
      ToChucDang: null,
      DanhSachQuanHeGiaDinh: [],
      DanhSachCongTac: [],
      DanhSachDaoTao: [],
      DanhSachDanhGia: [],
      DanhSachQuanHam: [],
    };
    memberRepository.findById.mockResolvedValue(minimalRaw);
    orgRepository.findAll.mockResolvedValue([]);

    const result = await exportMemberToWord("m2");

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test("thiếu ToChucDang (null) -> vẫn dựng được văn bản, không lỗi truy cập thuộc tính", async () => {
    memberRepository.findById.mockResolvedValue({
      ...fullMemberRaw,
      ToChucDang: null,
      ToChucDangId: null,
    });
    orgRepository.findAll.mockResolvedValue(orgList);

    await expect(exportMemberToWord("m1")).resolves.toBeInstanceOf(Buffer);
  });

  test("GiaDinhLietSy/GiaDinhCoCong không có (undefined) -> không throw", async () => {
    memberRepository.findById.mockResolvedValue({
      ...fullMemberRaw,
      SucKhoeChinhSach: {},
      NgayMienCongTac: undefined,
    });
    orgRepository.findAll.mockResolvedValue(orgList);

    await expect(exportMemberToWord("m1")).resolves.toBeInstanceOf(Buffer);
  });
});
