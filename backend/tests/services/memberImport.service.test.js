/**
 * Unit test cho memberImport.service — điều phối import hàng loạt từ Excel/ZIP.
 * `extractExcelData` được mock (đã có test riêng ở memberImportParser.test.js);
 * các hàm parse thuần khác (parseDate/parseBoolean/parseTableCell/parseDateRange)
 * để chạy THẬT vì được dùng trực tiếp trong logic nội bộ `mapExcelRowToDomain`.
 * `generateFailedRowsExcel` (dựng file Excel lỗi bằng ExcelJS) không được test
 * sâu ở đây — cần một buffer .xlsx gốc thật, ngoài phạm vi test service này.
 */
jest.mock("../../src/infrastructure/excel/memberImportParser", () => ({
  ...jest.requireActual("../../src/infrastructure/excel/memberImportParser"),
  extractExcelData: jest.fn(),
}));
jest.mock("../../src/infrastructure/storage/importFileStorage.service", () => ({
  saveImportAttachment: jest.fn(),
}));
jest.mock("../../src/repositories/member/member.repository", () => ({
  findById: jest.fn(),
}));
jest.mock("../../src/repositories/member/memberParty.repository", () => ({
  createEvaluation: jest.fn(),
}));
jest.mock("../../src/repositories/member/memberHistory.repository", () => ({
  createWorkHistory: jest.fn(),
  createTraining: jest.fn(),
  createRankHistory: jest.fn(),
}));
jest.mock("../../src/domain/mappers/member.mapper", () => ({
  mapToFrontend: jest.fn(),
}));
jest.mock("../../src/repositories/org.repository", () => ({
  findAll: jest.fn(),
}));
jest.mock("../../src/services/member/member.service", () => ({
  saveDangVien: jest.fn(),
}));
jest.mock("../../src/infrastructure/database/prisma", () => ({
  dangVien: { findFirst: jest.fn() },
}));

const AdmZip = require("adm-zip");
const { extractExcelData } = require("../../src/infrastructure/excel/memberImportParser");
const memberRepository = require("../../src/repositories/member/member.repository");
const orgRepository = require("../../src/repositories/org.repository");
const { mapToFrontend } = require("../../src/domain/mappers/member.mapper");
const { saveDangVien } = require("../../src/services/member/member.service");
const prisma = require("../../src/infrastructure/database/prisma");
const { ROLES } = require("../../src/domain/constants/member.constants");
const { bulkImportMembers } = require("../../src/services/member/memberImport.service");

beforeEach(() => {
  jest.clearAllMocks();
  prisma.dangVien.findFirst.mockResolvedValue(null);
  orgRepository.findAll.mockResolvedValue([]);
  memberRepository.findById.mockResolvedValue({ Id: "m-new" });
  mapToFrontend.mockImplementation((dv) => ({ id: dv?.Id, __mapped: true }));
});

const canBoUser = { role: ROLES.CAN_BO_CHINH_TRI, orgId: "org1" };

describe("bulkImportMembers", () => {
  test("file Excel không có dữ liệu -> ném lỗi", async () => {
    extractExcelData.mockResolvedValue([]);

    await expect(
      bulkImportMembers(Buffer.from(""), "file.xlsx", [], canBoUser),
    ).rejects.toThrow("File Excel không có dữ liệu.");
  });

  test("file ZIP không chứa file Excel nào -> ném lỗi", async () => {
    const zip = new AdmZip();
    zip.addFile("readme.txt", Buffer.from("khong phai excel"));
    const zipBuffer = zip.toBuffer();

    await expect(
      bulkImportMembers(zipBuffer, "import.zip", [], canBoUser),
    ).rejects.toThrow("Không tìm thấy file dữ liệu Excel trong tệp ZIP.");
  });

  test("dòng hợp lệ, không trùng lặp -> tạo mới thành công", async () => {
    extractExcelData.mockResolvedValue([
      { "Họ tên đang dùng": "Nguyễn Văn A", "Số lý lịch": "SLL1" },
    ]);
    saveDangVien.mockResolvedValue({ Id: "m-new" });

    const result = await bulkImportMembers(
      Buffer.from(""),
      "file.xlsx",
      [],
      canBoUser,
    );

    expect(saveDangVien).toHaveBeenCalledWith(
      expect.objectContaining({ SoLyLich: "SLL1" }),
      "org1",
      true,
      null,
    );
    expect(result.summary).toEqual(
      expect.objectContaining({ total: 1, successCount: 1, errorCount: 0 }),
    );
    expect(result.results[0]).toEqual({
      status: "success",
      member: { id: "m-new", __mapped: true },
    });
  });

  test("dòng trống (thiếu cả 3 trường định danh) -> bị bỏ qua, không tính vào kết quả cuối", async () => {
    extractExcelData.mockResolvedValue([
      {},
      { "Họ tên đang dùng": "Nguyễn Văn B", "Số lý lịch": "SLL2" },
    ]);
    saveDangVien.mockResolvedValue({ Id: "m-new" });

    const result = await bulkImportMembers(
      Buffer.from(""),
      "file.xlsx",
      [],
      canBoUser,
    );

    expect(result.summary.total).toBe(1);
    expect(saveDangVien).toHaveBeenCalledTimes(1);
  });

  test("phát hiện trùng Số lý lịch, không bật overwriteDuplicates -> đánh dấu duplicate, không tạo mới", async () => {
    extractExcelData.mockResolvedValue([
      { "Họ tên đang dùng": "Nguyễn Văn C", "Số lý lịch": "SLL-TRUNG" },
    ]);
    prisma.dangVien.findFirst.mockResolvedValueOnce({
      Id: "existing1",
      LyLichCaNhan: { HoTenDangDung: "Người cũ" },
      ToChucDang: { Ten: "Chi bộ X" },
    });

    const result = await bulkImportMembers(
      Buffer.from(""),
      "file.xlsx",
      [],
      canBoUser,
      { overwriteDuplicates: false },
    );

    expect(saveDangVien).not.toHaveBeenCalled();
    expect(result.results[0].status).toBe("duplicate");
    expect(result.summary.duplicateCount).toBe(1);
  });

  test("phát hiện trùng Số lý lịch, overwriteDuplicates=true -> cập nhật hồ sơ cũ thay vì tạo mới", async () => {
    extractExcelData.mockResolvedValue([
      { "Họ tên đang dùng": "Nguyễn Văn D", "Số lý lịch": "SLL-TRUNG2" },
    ]);
    prisma.dangVien.findFirst.mockResolvedValueOnce({
      Id: "existing2",
      LyLichCaNhan: { HoTenDangDung: "Người cũ 2" },
      ToChucDang: { Ten: "Chi bộ Y" },
    });
    saveDangVien.mockResolvedValue({ Id: "existing2" });

    const result = await bulkImportMembers(
      Buffer.from(""),
      "file.xlsx",
      [],
      canBoUser,
      { overwriteDuplicates: true },
    );

    expect(saveDangVien).toHaveBeenCalledWith(
      expect.anything(),
      "org1",
      false,
      "existing2",
    );
    expect(result.results[0].status).toBe("updated");
    expect(result.summary.updatedCount).toBe(1);
  });

  test("BI_THU import vào tổ chức khác qua tên trong file -> lỗi bị bắt riêng theo dòng, không dừng cả batch", async () => {
    orgRepository.findAll.mockResolvedValue([
      { Id: "orgKhac", Ten: "Chi bộ Khác", ToChucChaId: "p" },
    ]);
    extractExcelData.mockResolvedValue([
      {
        "Họ tên đang dùng": "Nguyễn Văn E",
        "Số lý lịch": "SLL5",
        "Nơi sinh hoạt Đảng": "Chi bộ Khác",
      },
    ]);

    const result = await bulkImportMembers(
      Buffer.from(""),
      "file.xlsx",
      [],
      { role: ROLES.BI_THU, orgId: "orgMine" },
    );

    expect(saveDangVien).not.toHaveBeenCalled();
    expect(result.results[0].status).toBe("error");
    expect(result.results[0].error).toMatch("Không có quyền import vào đơn vị khác");
    expect(result.summary.errorCount).toBe(1);
  });

  test("BI_THU import đúng chi bộ mình phụ trách qua tên trong file -> lưu thành công", async () => {
    orgRepository.findAll.mockResolvedValue([
      { Id: "orgMine", Ten: "Chi bộ Của Tôi", ToChucChaId: "p" },
    ]);
    extractExcelData.mockResolvedValue([
      {
        "Họ tên đang dùng": "Nguyễn Văn G",
        "Số lý lịch": "SLL7",
        "Nơi sinh hoạt Đảng": "Chi bộ Của Tôi",
      },
    ]);
    saveDangVien.mockResolvedValue({ Id: "m-new" });

    const result = await bulkImportMembers(
      Buffer.from(""),
      "file.xlsx",
      [],
      { role: ROLES.BI_THU, orgId: "orgMine" },
    );

    expect(saveDangVien).toHaveBeenCalledWith(
      expect.objectContaining({ SoLyLich: "SLL7" }),
      "orgMine",
      true,
      null,
    );
    expect(result.results[0].status).toBe("success");
  });

  test("CAN_BO_CHINH_TRI import cho chi bộ trực thuộc -> lỗi, không cho lưu", async () => {
    orgRepository.findAll.mockResolvedValue([
      { Id: "orgCon", Ten: "Chi bộ Trực Thuộc", ToChucChaId: "org1" },
    ]);
    extractExcelData.mockResolvedValue([
      {
        "Họ tên đang dùng": "Nguyễn Văn H",
        "Số lý lịch": "SLL8",
        "Nơi sinh hoạt Đảng": "Chi bộ Trực Thuộc",
      },
    ]);

    const result = await bulkImportMembers(
      Buffer.from(""),
      "file.xlsx",
      [],
      canBoUser,
    );

    expect(saveDangVien).not.toHaveBeenCalled();
    expect(result.results[0].status).toBe("error");
    expect(result.results[0].error).toMatch(
      "không có quyền import cho đảng bộ/chi bộ trực thuộc",
    );
    expect(result.summary.errorCount).toBe(1);
  });

  test("CAN_BO_CHINH_TRI import cho đảng bộ cao nhất (không có tổ chức cha) -> lưu thành công", async () => {
    orgRepository.findAll.mockResolvedValue([
      { Id: "org1", Ten: "Đảng bộ Cao Nhất", ToChucChaId: null },
    ]);
    extractExcelData.mockResolvedValue([
      {
        "Họ tên đang dùng": "Nguyễn Văn I",
        "Số lý lịch": "SLL9",
        "Nơi sinh hoạt Đảng": "Đảng bộ Cao Nhất",
      },
    ]);
    saveDangVien.mockResolvedValue({ Id: "m-new" });

    const result = await bulkImportMembers(
      Buffer.from(""),
      "file.xlsx",
      [],
      canBoUser,
    );

    expect(saveDangVien).toHaveBeenCalledWith(
      expect.objectContaining({ SoLyLich: "SLL9" }),
      "org1",
      true,
      null,
    );
    expect(result.results[0].status).toBe("success");
  });

  test("không có dòng lỗi/trùng -> không sinh file Excel lỗi (failedExcelBase64 = null)", async () => {
    extractExcelData.mockResolvedValue([
      { "Họ tên đang dùng": "Nguyễn Văn F", "Số lý lịch": "SLL6" },
    ]);
    saveDangVien.mockResolvedValue({ Id: "m-new" });

    const result = await bulkImportMembers(
      Buffer.from(""),
      "file.xlsx",
      [],
      canBoUser,
    );

    expect(result.failedExcelBase64).toBeNull();
  });
});
