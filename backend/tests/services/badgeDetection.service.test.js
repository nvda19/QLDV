const badgeRepository = require("../../src/repositories/badge.repository");
const memberRepository = require("../../src/repositories/member/member.repository");
const orgRepository = require("../../src/repositories/org.repository");
const userRepository = require("../../src/repositories/user.repository");
const { getEligibleMilestones } = require("../../src/domain/constants/badge.constants");
const { getDescendantOrgIds } = require("../../src/domain/utils/orgTree");
const { notifyEligibleToBiThu } = require("../../src/services/badge/badgeNotification.service");
const { ROLES } = require("../../src/domain/constants/member.constants");

jest.mock("../../src/repositories/badge.repository", () => ({
  findMany: jest.fn(),
  createMany: jest.fn(),
}));

jest.mock("../../src/repositories/member/member.repository", () => ({
  findAllWithInclude: jest.fn(),
}));

jest.mock("../../src/repositories/org.repository", () => ({
  findAll: jest.fn(),
}));

jest.mock("../../src/repositories/user.repository", () => ({
  findAll: jest.fn(),
}));

jest.mock("../../src/domain/constants/badge.constants", () => ({
  getEligibleMilestones: jest.fn(),
}));

jest.mock("../../src/domain/utils/orgTree", () => ({
  getDescendantOrgIds: jest.fn(),
}));

jest.mock("../../src/services/badge/badgeNotification.service", () => ({
  notifyEligibleToBiThu: jest.fn(),
}));

const { scanAndNotify } = require("../../src/services/badge/badgeDetection.service");

describe("badgeDetection.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("scanAndNotify -> trả về scanned:0 nếu không có đảng viên", async () => {
    orgRepository.findAll.mockResolvedValueOnce([]);
    memberRepository.findAllWithInclude.mockResolvedValueOnce([]);

    const result = await scanAndNotify();

    expect(result).toEqual({ scanned: 0, suggested: 0 });
    expect(badgeRepository.createMany).not.toHaveBeenCalled();
  });

  test("scanAndNotify -> quét và phát hiện đảng viên đủ niên hạn, tạo nháp và gửi thông báo", async () => {
    const mockOrgs = [
      { Id: "org1", Ten: "Chi bộ A", ToChucChaId: null },
      { Id: "org2", Ten: "Tổ đảng B", ToChucChaId: "org1" },
    ];
    orgRepository.findAll.mockResolvedValueOnce(mockOrgs);

    const mockMembers = [
      {
        Id: "m1",
        ToChucDangId: "org2",
        ThongTinVaoDang: { NgayVaoDang: "1994-05-01" },
        KhenThuongKyLuat: { HuyHieuDang: "" },
      },
    ];
    memberRepository.findAllWithInclude.mockResolvedValueOnce(mockMembers);

    // Mocks existing badge proposals to avoid duplication
    badgeRepository.findMany.mockResolvedValueOnce([]);

    // Mocks users to identify Secretaries and their orgs
    userRepository.findAll.mockResolvedValueOnce([
      { Id: "u-bt", ToChucDangId: "org1", VaiTro: ROLES.BI_THU }, // Bí thư phụ trách org1 (chi bộ cha của org2)
    ]);

    // getEligibleMilestones returns 30 years milestone
    getEligibleMilestones.mockReturnValueOnce([{ milestone: 30 }]);

    const result = await scanAndNotify();

    expect(badgeRepository.createMany).toHaveBeenCalledWith([
      {
        DangVienId: "m1",
        LoaiDeXuat: "CAP_MOI",
        MocHuyHieu: 30,
        TrangThai: "DRAFT",
        NguoiDeXuatId: null,
      },
    ]);

    expect(notifyEligibleToBiThu).toHaveBeenCalledWith(
      "org1",
      "Chi bộ A",
      [{ DangVienId: "m1", MocHuyHieu: 30 }]
    );

    expect(result).toEqual({ scanned: 1, suggested: 1 });
  });

  test("scanAndNotify -> lọc theo phạm vi của Bí thư nếu được truyền user", async () => {
    const mockOrgs = [
      { Id: "org1", Ten: "Chi bộ A" },
      { Id: "org2", Ten: "Chi bộ B" },
    ];
    orgRepository.findAll.mockResolvedValueOnce(mockOrgs);
    getDescendantOrgIds.mockReturnValueOnce(["org1"]); // Bí thư ở org1 chỉ quản lý org1
    memberRepository.findAllWithInclude.mockResolvedValueOnce([]);

    const biThuUser = { role: ROLES.BI_THU, orgId: "org1" };
    await scanAndNotify(biThuUser);

    expect(memberRepository.findAllWithInclude).toHaveBeenCalledWith(
      { ToChucDangId: { in: ["org1"] } },
      expect.any(Object)
    );
  });

  test("scanAndNotify -> bỏ qua mốc huy hiệu đã có đề xuất xử lý", async () => {
    const mockOrgs = [{ Id: "org1", Ten: "Chi bộ A", ToChucChaId: null }];
    orgRepository.findAll.mockResolvedValueOnce(mockOrgs);
    memberRepository.findAllWithInclude.mockResolvedValueOnce([
      { Id: "m1", ToChucDangId: "org1", ThongTinVaoDang: { NgayVaoDang: "1994-05-01" }, KhenThuongKyLuat: { HuyHieuDang: "" } }
    ]);
    // Trùng mốc 30 tuổi Đảng đã có sẵn
    badgeRepository.findMany.mockResolvedValueOnce([{ DangVienId: "m1", MocHuyHieu: 30 }]);
    userRepository.findAll.mockResolvedValueOnce([]);
    getEligibleMilestones.mockReturnValueOnce([]); // Trả về rỗng vì mốc 30 đã bị loại trừ trong getEligibleMilestones thật

    const result = await scanAndNotify();

    expect(getEligibleMilestones).toHaveBeenCalledWith(
      "1994-05-01",
      expect.any(Set),
      "",
      expect.any(Date)
    );
    const passedSet = getEligibleMilestones.mock.calls[0][1];
    expect(passedSet.has(30)).toBe(true); // Đảm bảo mốc 30 tuổi Đảng đã xử lý được đưa vào Set

    expect(badgeRepository.createMany).not.toHaveBeenCalled();
    expect(result).toEqual({ scanned: 1, suggested: 0 });
  });

  test("scanAndNotify -> bắt lỗi try...catch khi gửi thông báo lỗi", async () => {
    const mockOrgs = [{ Id: "org1", Ten: "Chi bộ A", ToChucChaId: null }];
    orgRepository.findAll.mockResolvedValueOnce(mockOrgs);
    memberRepository.findAllWithInclude.mockResolvedValueOnce([
      { Id: "m1", ToChucDangId: "org1", ThongTinVaoDang: { NgayVaoDang: "1994-05-01" }, KhenThuongKyLuat: { HuyHieuDang: "" } }
    ]);
    badgeRepository.findMany.mockResolvedValueOnce([]);
    userRepository.findAll.mockResolvedValueOnce([{ Id: "u-bt", ToChucDangId: "org1", VaiTro: ROLES.BI_THU }]);
    getEligibleMilestones.mockReturnValueOnce([{ milestone: 30 }]);

    // Ném lỗi khi thông báo
    notifyEligibleToBiThu.mockRejectedValueOnce(new Error("Lỗi"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const result = await scanAndNotify();

    expect(result).toEqual({ scanned: 1, suggested: 1 });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
