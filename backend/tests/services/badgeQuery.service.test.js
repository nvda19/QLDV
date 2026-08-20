const badgeRepository = require("../../src/repositories/badge.repository");
const orgRepository = require("../../src/repositories/org.repository");
const { ROLES } = require("../../src/domain/constants/member.constants");

jest.mock("../../src/repositories/badge.repository", () => ({
  findMany: jest.fn(),
}));

jest.mock("../../src/repositories/org.repository", () => ({
  findAll: jest.fn(),
}));

const { getBadgeProposals } = require("../../src/services/badge/badgeQuery.service");

describe("badgeQuery.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockDbProposals = [
    {
      Id: "b1",
      DangVienId: "m1",
      LoaiDeXuat: "CAP_MOI",
      MocHuyHieu: 30,
      TrangThai: "PENDING",
      SoHuyHieu: null,
      SoQuyetDinhCaNhan: null,
      SoQuyetDinhTapThe: null,
      NgayQuyetDinh: null,
      LyDoTuChoi: null,
      TaiLieuUrl: null,
      TaiLieuName: null,
      QuyetDinhId: null,
      QuyetDinh: null,
      CreatedAt: "2024-01-01",
      DangVien: {
        SoTheDangVien: "123456",
        ToChucDangId: "org1",
        LyLichCaNhan: { HoTenDangDung: "Nguyễn Văn A" },
        ToChucDang: { Ten: "Chi bộ A" },
      },
    },
  ];

  test("getBadgeProposals -> trả về danh sách đề nghị đã được map thành công (dành cho Cán bộ)", async () => {
    badgeRepository.findMany.mockResolvedValueOnce(mockDbProposals);
    const user = { role: ROLES.CAN_BO_CHINH_TRI };

    const result = await getBadgeProposals(user);

    expect(badgeRepository.findMany).toHaveBeenCalledWith({}, expect.any(Object));
    expect(result).toEqual([
      {
        Id: "b1",
        DangVienId: "m1",
        HoTenDangDung: "Nguyễn Văn A",
        SoTheDangVien: "123456",
        ToChucDangId: "org1",
        TenToChucDang: "Chi bộ A",
        LoaiDeXuat: "CAP_MOI",
        MocHuyHieu: 30,
        TrangThai: "PENDING",
        SoHuyHieu: null,
        SoQuyetDinhCaNhan: null,
        SoQuyetDinhTapThe: null,
        NgayQuyetDinh: null,
        LyDoTuChoi: null,
        TaiLieuUrl: null,
        TaiLieuName: null,
        QuyetDinhId: null,
        QuyetDinh: null,
        CreatedAt: "2024-01-01",
      },
    ]);
  });

  test("getBadgeProposals -> lọc đệ quy các chi bộ trực thuộc đối với Bí thư", async () => {
    orgRepository.findAll.mockResolvedValueOnce([
      { Id: "org1", ToChucChaId: null },
      { Id: "org2", ToChucChaId: "org1" },
      { Id: "org3", ToChucChaId: "org2" },
      { Id: "org_other", ToChucChaId: null },
    ]);
    badgeRepository.findMany.mockResolvedValueOnce([]);

    const user = { role: ROLES.BI_THU, orgId: "org1" };
    await getBadgeProposals(user);

    // expect where filter to query org1, org2, org3
    expect(badgeRepository.findMany).toHaveBeenCalledWith(
      {
        DangVien: {
          ToChucDangId: { in: ["org1", "org2", "org3"] },
        },
      },
      expect.any(Object)
    );
  });
});
