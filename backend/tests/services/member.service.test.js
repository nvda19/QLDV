/**
 * Unit test cho member.service — service lớn nhất, CRUD hồ sơ đảng viên.
 * Chỉ test qua 6 hàm export; các helper nội bộ (saveRootEntity,
 * upsertProfileSections, syncMemberCollections, assertUniqueIdentifiers)
 * được kiểm chứng gián tiếp qua hành vi của các hàm public.
 */
jest.mock("../../src/repositories/member/member.repository", () => ({
  findFirst: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  upsertPersonalInfo: jest.fn(),
  upsertAcademicLevel: jest.fn(),
  upsertMilitaryRecruitment: jest.fn(),
  upsertHealthPolicy: jest.fn(),
  upsertRewardDiscipline: jest.fn(),
  upsertBackgroundFeatures: jest.fn(),
  findById: jest.fn(),
  createFamilyRelation: jest.fn(),
  updateFamilyRelation: jest.fn(),
  deleteFamilyRelation: jest.fn(),
  findAuditLogs: jest.fn(),
  findAllWithInclude: jest.fn(),
  include: { fakeInclude: true },
  delete: jest.fn(),
}));
jest.mock("../../src/repositories/member/memberParty.repository", () => ({
  upsertPartyInfo: jest.fn(),
  createEvaluation: jest.fn(),
  updateEvaluation: jest.fn(),
  deleteEvaluation: jest.fn(),
}));
jest.mock("../../src/repositories/member/memberHistory.repository", () => ({
  createWorkHistory: jest.fn(),
  updateWorkHistory: jest.fn(),
  deleteWorkHistory: jest.fn(),
  createTraining: jest.fn(),
  updateTraining: jest.fn(),
  deleteTraining: jest.fn(),
  createRankHistory: jest.fn(),
  updateRankHistory: jest.fn(),
  deleteRankHistory: jest.fn(),
}));
jest.mock("../../src/repositories/org.repository", () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
}));
jest.mock("../../src/domain/policies/member.policy", () => ({
  validateWritePermission: jest.fn(),
}));
jest.mock("../../src/domain/mappers/member.mapper", () => ({
  mapToFrontend: jest.fn(),
}));
jest.mock("../../src/infrastructure/database/prisma", () => ({
  quyetDinh: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
}));
jest.mock("../../src/domain/validators/member.validation", () => ({
  validateMemberInput: jest.fn((data) => {
    if (!data || (!data.HoTenDangDung && !data.HoTenKhaiSinh)) {
      throw new Error("Họ và tên là bắt buộc");
    }
  }),
}));

const memberRepository = require("../../src/repositories/member/member.repository");
const memberPartyRepository = require("../../src/repositories/member/memberParty.repository");
const memberHistoryRepository = require("../../src/repositories/member/memberHistory.repository");
const orgRepository = require("../../src/repositories/org.repository");
const { validateWritePermission } = require("../../src/domain/policies/member.policy");
const { mapToFrontend } = require("../../src/domain/mappers/member.mapper");
const prisma = require("../../src/infrastructure/database/prisma");
const { ROLES } = require("../../src/domain/constants/member.constants");
const {
  saveDangVien,
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
} = require("../../src/services/member/member.service");

const validMemberData = (overrides = {}) => ({
  HoTenDangDung: "Nguyễn Văn A",
  NgaySinh: "1990-01-01",
  GioiTinh: "Nam",
  SoLyLich: "SLL-100",
  SoTheDangVien: "SDV-100",
  ...overrides,
});

const emptyExistingMember = () => ({
  DanhSachQuanHeGiaDinh: [],
  DanhSachCongTac: [],
  DanhSachDaoTao: [],
  DanhSachQuanHam: [],
  DanhSachDanhGia: [],
});

beforeEach(() => {
  jest.clearAllMocks();
  memberRepository.findFirst.mockResolvedValue(null);
  memberRepository.upsertPersonalInfo.mockResolvedValue({});
  memberRepository.upsertAcademicLevel.mockResolvedValue({});
  memberRepository.upsertMilitaryRecruitment.mockResolvedValue({});
  memberRepository.upsertHealthPolicy.mockResolvedValue({});
  memberRepository.upsertRewardDiscipline.mockResolvedValue({});
  memberRepository.upsertBackgroundFeatures.mockResolvedValue({});
  memberPartyRepository.upsertPartyInfo.mockResolvedValue({});
  memberRepository.findById.mockResolvedValue(emptyExistingMember());
  mapToFrontend.mockImplementation((dv) => ({ id: dv?.Id, __mapped: true }));
});

describe("saveDangVien", () => {
  test("dữ liệu không hợp lệ (thiếu họ tên) -> ném lỗi, không tạo bản ghi", async () => {
    await expect(
      saveDangVien(validMemberData({ HoTenDangDung: "" }), "org1", true, null),
    ).rejects.toThrow("Họ và tên là bắt buộc");
    expect(memberRepository.create).not.toHaveBeenCalled();
  });

  test("SoLyLich đã tồn tại khi tạo mới -> ném lỗi, không tạo bản ghi", async () => {
    memberRepository.findFirst.mockResolvedValueOnce({ Id: "khac" });

    await expect(
      saveDangVien(validMemberData(), "org1", true, null),
    ).rejects.toThrow('Số lý lịch "SLL-100" đã tồn tại');
    expect(memberRepository.create).not.toHaveBeenCalled();
  });

  test("SoTheDangVien đã tồn tại khi cập nhật (loại trừ chính bản ghi đang sửa)", async () => {
    memberRepository.findFirst
      .mockResolvedValueOnce(null) // check SoLyLich -> ok
      .mockResolvedValueOnce({ Id: "khac" }); // check SoTheDangVien -> trùng

    await expect(
      saveDangVien(validMemberData(), "org1", false, "m1"),
    ).rejects.toThrow('Số thẻ Đảng viên "SDV-100" đã tồn tại');

    expect(memberRepository.findFirst).toHaveBeenNthCalledWith(2, {
      where: { SoTheDangVien: "SDV-100", Id: { not: "m1" } },
    });
  });

  test("tạo mới thành công -> TrangThai mặc định HOAT_DONG khi không truyền", async () => {
    memberRepository.create.mockResolvedValue({ Id: "new-id" });

    const result = await saveDangVien(
      validMemberData(),
      "org1",
      true,
      null,
    );

    expect(memberRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        TrangThai: "HOAT_DONG",
        ToChucDang: { connect: { Id: "org1" } },
      }),
    );
    expect(result).toEqual({ Id: "new-id" });
  });

  test("cập nhật hồ sơ hiện có -> gọi memberRepository.update, không gọi create", async () => {
    memberRepository.update.mockResolvedValue({ Id: "m1" });

    await saveDangVien(validMemberData(), "org1", false, "m1");

    expect(memberRepository.update).toHaveBeenCalledWith(
      "m1",
      expect.objectContaining({ SoLyLich: "SLL-100" }),
    );
    expect(memberRepository.create).not.toHaveBeenCalled();
  });

  // Lưu ý (characterization test): update không truyền TrangThai vẫn bị ép về
  // "HOAT_DONG" — hành vi hiện tại của code, có thể vô tình ghi đè trạng thái
  // (nghỉ/từ trần...) nếu caller không gửi kèm field này.
  test("[ghi nhận hành vi hiện tại] update thiếu TrangThai -> vẫn bị set về HOAT_DONG", async () => {
    memberRepository.update.mockResolvedValue({ Id: "m1" });

    await saveDangVien(validMemberData(), "org1", false, "m1");

    expect(memberRepository.update).toHaveBeenCalledWith(
      "m1",
      expect.objectContaining({ TrangThai: "HOAT_DONG" }),
    );
  });

  test("đồng bộ quan hệ gia đình: thêm mới bản ghi chưa có Id + xóa bản ghi không còn trong danh sách mới", async () => {
    memberRepository.create.mockResolvedValue({ Id: "new-id" });
    memberRepository.findById.mockResolvedValue({
      ...emptyExistingMember(),
      DanhSachQuanHeGiaDinh: [{ Id: "old1", QuanHe: "Cha" }],
    });

    await saveDangVien(
      validMemberData({
        QuanHeGiaDinh: [{ QuanHe: "Mẹ", HoTen: "Bà B", NamSinh: 1960 }],
      }),
      "org1",
      true,
      null,
    );

    expect(memberRepository.createFamilyRelation).toHaveBeenCalledTimes(1);
    expect(memberRepository.deleteFamilyRelation).toHaveBeenCalledWith("old1");
    expect(memberRepository.updateFamilyRelation).not.toHaveBeenCalled();
  });

  test("đồng bộ đánh giá: SoQuyetDinh trùng khớp quyết định có sẵn -> gắn đúng QuyetDinhId", async () => {
    memberRepository.create.mockResolvedValue({ Id: "new-id" });
    prisma.quyetDinh.findFirst.mockResolvedValue({
      Id: "qd1",
      SoQuyetDinh: "01/QD",
    });

    await saveDangVien(
      validMemberData({
        DanhGiaDangVien: [
          { Nam: 2023, XepLoai: "Hoàn thành tốt", SoQuyetDinh: "01/QD" },
        ],
      }),
      "org1",
      true,
      null,
    );

    expect(memberPartyRepository.createEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({ QuyetDinhId: "qd1", SoQuyetDinh: "01/QD" }),
    );
  });
});

describe("getAllMembers", () => {
  beforeEach(() => {
    memberRepository.findAuditLogs.mockResolvedValue([]);
    orgRepository.findAll.mockResolvedValue([{ Id: "o1", Ten: "Org1" }]);
  });

  test("CAN_BO_CHINH_TRI -> lấy toàn bộ đảng viên, không lọc theo tổ chức", async () => {
    memberRepository.findAllWithInclude.mockResolvedValue([
      { Id: "m1", ToChucDangId: "o1", CreatedAt: new Date("2020-01-01") },
    ]);

    const result = await getAllMembers({ role: ROLES.CAN_BO_CHINH_TRI });

    expect(memberRepository.findAllWithInclude).toHaveBeenCalledWith(
      {},
      memberRepository.include,
    );
    expect(result[0].orgHistory).toEqual([
      { date: new Date("2020-01-01").toISOString(), orgId: "o1" },
    ]);
  });

  test("BI_THU -> lọc theo tổ chức của user (kèm lịch sử điều chuyển qua audit log)", async () => {
    memberRepository.findAllWithInclude.mockResolvedValue([]);

    await getAllMembers({ role: ROLES.BI_THU, orgId: "orgX" });

    expect(memberRepository.findAllWithInclude).toHaveBeenCalledWith(
      {
        OR: [{ ToChucDangId: "orgX" }, { Id: { in: [] } }],
      },
      memberRepository.include,
    );
  });

  test("orgHistory ghi nhận điều chuyển tổ chức theo audit log CREATE rồi UPDATE", async () => {
    memberRepository.findAuditLogs.mockResolvedValue([
      {
        BanGhiId: "m1",
        HanhDong: "CREATE",
        CreatedAt: new Date("2020-01-01"),
        GiaTriMoi: { ToChucDangId: "o1" },
      },
      {
        BanGhiId: "m1",
        HanhDong: "UPDATE",
        CreatedAt: new Date("2021-06-01"),
        GiaTriCu: { ToChucDangId: "o1" },
        GiaTriMoi: { ToChucDangId: "o2" },
      },
    ]);
    memberRepository.findAllWithInclude.mockResolvedValue([
      { Id: "m1", ToChucDangId: "o2", CreatedAt: new Date("2020-01-01") },
    ]);

    const result = await getAllMembers({ role: ROLES.CAN_BO_CHINH_TRI });

    expect(result[0].orgHistory).toEqual([
      { date: new Date("2020-01-01").toISOString(), orgId: "o1" },
      { date: new Date("2021-06-01").toISOString(), orgId: "o2" },
    ]);
  });
});

describe("getMemberById", () => {
  beforeEach(() => {
    orgRepository.findAll.mockResolvedValue([{ Id: "o1", Ten: "Org1" }]);
  });

  test("không tìm thấy đảng viên -> ném lỗi", async () => {
    memberRepository.findById.mockResolvedValueOnce(null);

    await expect(
      getMemberById("khong-ton-tai", { role: ROLES.CAN_BO_CHINH_TRI }),
    ).rejects.toThrow("Không tìm thấy đảng viên");
  });

  test("BI_THU xem hồ sơ của tổ chức khác -> ném lỗi cấm truy cập", async () => {
    memberRepository.findById.mockResolvedValueOnce({ Id: "m1", ToChucDangId: "o1" });

    await expect(
      getMemberById("m1", { role: ROLES.BI_THU, orgId: "o2" }),
    ).rejects.toThrow("Bạn không có quyền xem hồ sơ của đơn vị khác");
  });

  test("BI_THU xem đúng hồ sơ tổ chức mình -> trả về dữ liệu map thành công", async () => {
    memberRepository.findById.mockResolvedValueOnce({ Id: "m1", ToChucDangId: "o1" });

    const result = await getMemberById("m1", { role: ROLES.BI_THU, orgId: "o1" });

    expect(result).toEqual({ id: "m1", __mapped: true });
  });

  test("CAN_BO_CHINH_TRI xem hồ sơ bất kỳ tổ chức nào -> không bị chặn", async () => {
    memberRepository.findById.mockResolvedValueOnce({ Id: "m1", ToChucDangId: "o-khac" });

    await expect(
      getMemberById("m1", { role: ROLES.CAN_BO_CHINH_TRI, orgId: "o1" }),
    ).resolves.toEqual({ id: "m1", __mapped: true });
  });
});

describe("createMember", () => {
  beforeEach(() => {
    orgRepository.findAll.mockResolvedValue([{ Id: "orgX", Ten: "Org X" }]);
    memberRepository.create.mockResolvedValue({ Id: "new-id" });
    memberRepository.findById.mockResolvedValue({
      ...emptyExistingMember(),
      Id: "new-id",
    });
  });

  test("CAN_BO_CHINH_TRI không thuộc đơn vị gốc (còn tổ chức cha) -> ném lỗi", async () => {
    orgRepository.findById.mockResolvedValue({ Id: "orgX", ToChucChaId: "parent" });

    await expect(
      createMember(validMemberData(), { role: ROLES.CAN_BO_CHINH_TRI, orgId: "orgX" }),
    ).rejects.toThrow("Bạn không có quyền thêm hồ sơ mới");
    expect(memberRepository.create).not.toHaveBeenCalled();
  });

  test("CAN_BO_CHINH_TRI thuộc đơn vị gốc (không có tổ chức cha) -> tạo thành công", async () => {
    orgRepository.findById.mockResolvedValue({ Id: "orgX", ToChucChaId: null });

    const result = await createMember(validMemberData(), {
      role: ROLES.CAN_BO_CHINH_TRI,
      orgId: "orgX",
    });

    expect(memberRepository.create).toHaveBeenCalled();
    expect(result).toEqual({ id: "new-id", __mapped: true });
  });

  test("BI_THU tạo mới -> không bị áp ràng buộc tổ chức gốc", async () => {
    orgRepository.findById.mockResolvedValue(null);

    await expect(
      createMember(validMemberData(), { role: ROLES.BI_THU, orgId: "orgX" }),
    ).resolves.toEqual({ id: "new-id", __mapped: true });
  });
});

describe("updateMember", () => {
  beforeEach(() => {
    orgRepository.findAll.mockResolvedValue([]);
    memberRepository.update.mockResolvedValue({ Id: "m1" });
    memberRepository.findById.mockResolvedValue({
      ...emptyExistingMember(),
      Id: "m1",
    });
  });

  test("có quyền ghi -> lưu dữ liệu vào đúng tổ chức hiện tại của member", async () => {
    validateWritePermission.mockResolvedValue({ ToChucDangId: "orgY" });

    await updateMember("m1", validMemberData(), { role: ROLES.BI_THU, orgId: "orgY" });

    expect(memberRepository.update).toHaveBeenCalledWith(
      "m1",
      expect.objectContaining({ ToChucDang: { connect: { Id: "orgY" } } }),
    );
  });

  test("không đủ quyền ghi -> ném lỗi, không cập nhật", async () => {
    validateWritePermission.mockRejectedValue(new Error("Không có quyền"));

    await expect(
      updateMember("m1", validMemberData(), { role: ROLES.BI_THU, orgId: "orgY" }),
    ).rejects.toThrow("Không có quyền");
    expect(memberRepository.update).not.toHaveBeenCalled();
  });
});

describe("deleteMember", () => {
  test("có quyền -> gọi memberRepository.delete với đúng memberId", async () => {
    validateWritePermission.mockResolvedValue({ Id: "m1" });

    await deleteMember("m1", { role: ROLES.BI_THU, orgId: "orgY" });

    expect(memberRepository.delete).toHaveBeenCalledWith("m1");
  });

  test("không đủ quyền -> ném lỗi, không xóa", async () => {
    validateWritePermission.mockRejectedValue(new Error("Không có quyền"));

    await expect(
      deleteMember("m1", { role: ROLES.BI_THU, orgId: "orgY" }),
    ).rejects.toThrow("Không có quyền");
    expect(memberRepository.delete).not.toHaveBeenCalled();
  });
});
