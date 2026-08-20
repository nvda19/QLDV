const decisionRepository = require("../../src/repositories/decision.repository");
const { deleteFile } = require("../../src/infrastructure/storage/fileStorage.service");
const { saveUploadFile } = require("../../src/services/files/attachmentUpload.service");
const mapper = require("../../src/domain/mappers/decision.mapper");

jest.mock("../../src/repositories/decision.repository", () => ({
  findAll: jest.fn(),
  findByIdWithRelations: jest.fn(),
  findByDecisionNumber: jest.fn(),
  create: jest.fn(),
  linkUnlinkedRecords: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  syncAndLinkRecords: jest.fn(),
  remove: jest.fn(),
}));

jest.mock("../../src/infrastructure/storage/fileStorage.service", () => ({
  deleteFile: jest.fn(),
}));

jest.mock("../../src/services/files/attachmentUpload.service", () => ({
  saveUploadFile: jest.fn(),
}));

jest.mock("../../src/domain/mappers/decision.mapper", () => ({
  mapToFrontend: jest.fn((x) => x),
  mapListToFrontend: jest.fn((x) => x),
  mapToDb: jest.fn((x) => x),
}));

const {
  getAllDecisions,
  getDecisionById,
  createDecision,
  updateDecision,
  deleteDecision,
} = require("../../src/services/decision/decision.service");

describe("decision.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllDecisions", () => {
    test("lấy tất cả quyết định, có lọc theo LoaiQuyetDinh nếu truyền vào", async () => {
      decisionRepository.findAll.mockResolvedValueOnce([{ Id: "qd1", LoaiQuyetDinh: "KHEN_THUONG" }]);

      const result = await getAllDecisions({ LoaiQuyetDinh: "KHEN_THUONG" });

      expect(decisionRepository.findAll).toHaveBeenCalledWith({ LoaiQuyetDinh: "KHEN_THUONG" });
      expect(mapper.mapListToFrontend).toHaveBeenCalled();
      expect(result).toEqual([{ Id: "qd1", LoaiQuyetDinh: "KHEN_THUONG" }]);
    });
  });

  describe("getDecisionById", () => {
    test("ném lỗi nếu không tìm thấy quyết định", async () => {
      decisionRepository.findByIdWithRelations.mockResolvedValueOnce(null);
      await expect(getDecisionById("qd1")).rejects.toThrow("Không tìm thấy thông tin quyết định");
    });

    test("trả về chi tiết quyết định đã map", async () => {
      decisionRepository.findByIdWithRelations.mockResolvedValueOnce({ Id: "qd1" });
      const result = await getDecisionById("qd1");
      expect(result).toEqual({ Id: "qd1" });
    });
  });

  describe("createDecision", () => {
    test("ném lỗi nếu thiếu Số, Loại hoặc Ngày ban hành", async () => {
      await expect(createDecision({ TenQuyetDinh: "A" })).rejects.toThrow("Số quyết định là bắt buộc");
      await expect(createDecision({ SoQuyetDinh: "01/QD" })).rejects.toThrow("Loại quyết định là bắt buộc");
      await expect(createDecision({ SoQuyetDinh: "01/QD", LoaiQuyetDinh: "KHEN_THUONG" })).rejects.toThrow("Ngày ban hành là bắt buộc");
    });

    test("ném lỗi nếu số quyết định đã tồn tại", async () => {
      decisionRepository.findByDecisionNumber.mockResolvedValueOnce({ Id: "existing" });
      await expect(
        createDecision({ SoQuyetDinh: "01/QD", LoaiQuyetDinh: "KHEN_THUONG", NgayBanHanh: "2024-01-01" })
      ).rejects.toThrow("đã tồn tại trên hệ thống");
    });

    test("tạo quyết định thành công không kèm file và kích hoạt liên kết record cũ", async () => {
      decisionRepository.findByDecisionNumber.mockResolvedValueOnce(null);
      decisionRepository.create.mockResolvedValueOnce({ Id: "qd1", SoQuyetDinh: "01/QD" });

      const payload = { SoQuyetDinh: "01/QD", LoaiQuyetDinh: "KHEN_THUONG", NgayBanHanh: "2024-01-01" };
      const result = await createDecision(payload, null);

      expect(saveUploadFile).not.toHaveBeenCalled();
      expect(decisionRepository.create).toHaveBeenCalledWith({
        SoQuyetDinh: "01/QD",
        TenQuyetDinh: null,
        LoaiQuyetDinh: "KHEN_THUONG",
        NgayBanHanh: new Date("2024-01-01"),
        TaiLieuUrl: null,
        TaiLieuName: null,
      });
      expect(decisionRepository.linkUnlinkedRecords).toHaveBeenCalledWith("qd1", "01/QD");
      expect(result).toEqual({ Id: "qd1", SoQuyetDinh: "01/QD" });
    });

    test("tạo quyết định thành công có kèm file", async () => {
      decisionRepository.findByDecisionNumber.mockResolvedValueOnce(null);
      saveUploadFile.mockResolvedValueOnce({ FileUrl: "/url/a.pdf", fileName: "a.pdf" });
      decisionRepository.create.mockResolvedValueOnce({ Id: "qd1", SoQuyetDinh: "01/QD" });

      const payload = { SoQuyetDinh: "01/QD", LoaiQuyetDinh: "KHEN_THUONG", NgayBanHanh: "2024-01-01" };
      const fakeFile = { originalname: "a.pdf" };

      await createDecision(payload, fakeFile);

      expect(saveUploadFile).toHaveBeenCalledWith(expect.any(String), fakeFile);
      expect(decisionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          TaiLieuUrl: "/url/a.pdf",
          TaiLieuName: "a.pdf",
        })
      );
    });
  });

  describe("updateDecision", () => {
    test("ném lỗi nếu không tìm thấy quyết định để cập nhật", async () => {
      decisionRepository.findById.mockResolvedValueOnce(null);
      await expect(updateDecision("qd1", {})).rejects.toThrow("Không tìm thấy thông tin quyết định");
    });

    test("ném lỗi nếu thay đổi số quyết định trùng số khác", async () => {
      decisionRepository.findById.mockResolvedValueOnce({ Id: "qd1", SoQuyetDinh: "01/QD" });
      decisionRepository.findByDecisionNumber.mockResolvedValueOnce({ Id: "qd2", SoQuyetDinh: "02/QD" });

      await expect(updateDecision("qd1", { SoQuyetDinh: "02/QD" })).rejects.toThrow("đã tồn tại");
    });

    test("cập nhật thành công, xóa file cũ nếu có yêu cầu hoặc tải lên file mới", async () => {
      decisionRepository.findById.mockResolvedValueOnce({
        Id: "qd1",
        SoQuyetDinh: "01/QD",
        TaiLieuUrl: "/url/old.pdf",
      });
      decisionRepository.update.mockResolvedValueOnce({ Id: "qd1", SoQuyetDinh: "01/QD-new" });

      const payload = { SoQuyetDinh: "01/QD-new", deleteAttachment: true };
      const result = await updateDecision("qd1", payload, null);

      expect(deleteFile).toHaveBeenCalledWith("/url/old.pdf");
      expect(decisionRepository.update).toHaveBeenCalledWith("qd1", expect.objectContaining({
        SoQuyetDinh: "01/QD-new",
        TaiLieuUrl: null,
        TaiLieuName: null,
      }));
      expect(decisionRepository.syncAndLinkRecords).toHaveBeenCalledWith("qd1", "01/QD-new");
      expect(result.SoQuyetDinh).toBe("01/QD-new");
    });

    test("cập nhật thành công có upload file mới", async () => {
      decisionRepository.findById.mockResolvedValueOnce({
        Id: "qd1",
        SoQuyetDinh: "01/QD",
      });
      saveUploadFile.mockResolvedValueOnce({ FileUrl: "/url/new.pdf", fileName: "new.pdf" });
      decisionRepository.update.mockResolvedValueOnce({ Id: "qd1", SoQuyetDinh: "01/QD" });

      const result = await updateDecision("qd1", { SoQuyetDinh: "01/QD" }, { originalname: "new.pdf" });

      expect(saveUploadFile).toHaveBeenCalled();
      expect(decisionRepository.update).toHaveBeenCalledWith("qd1", expect.objectContaining({
        TaiLieuUrl: "/url/new.pdf",
        TaiLieuName: "new.pdf",
      }));
    });

    test("cập nhật thành công dù xóa file cũ ném lỗi", async () => {
      decisionRepository.findById.mockResolvedValueOnce({
        Id: "qd1",
        SoQuyetDinh: "01/QD",
        TaiLieuUrl: "/url/old.pdf",
      });
      deleteFile.mockRejectedValueOnce(new Error("File not found on disk"));
      decisionRepository.update.mockResolvedValueOnce({ Id: "qd1", SoQuyetDinh: "01/QD" });
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await updateDecision("qd1", { deleteAttachment: true }, null);

      expect(deleteFile).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("deleteDecision", () => {
    test("ném lỗi nếu không tìm thấy quyết định", async () => {
      decisionRepository.findById.mockResolvedValueOnce(null);
      await expect(deleteDecision("qd1")).rejects.toThrow("Không tìm thấy quyết định");
    });

    test("xóa thành công và dọn dẹp file đính kèm trên disk", async () => {
      decisionRepository.findById.mockResolvedValueOnce({
        Id: "qd1",
        TaiLieuUrl: "/url/to/delete.pdf",
      });

      const result = await deleteDecision("qd1");

      expect(deleteFile).toHaveBeenCalledWith("/url/to/delete.pdf");
      expect(decisionRepository.remove).toHaveBeenCalledWith("qd1");
      expect(result).toBe(true);
    });

    test("xóa thành công kể cả khi xóa file đính kèm trên disk ném lỗi", async () => {
      decisionRepository.findById.mockResolvedValueOnce({
        Id: "qd1",
        TaiLieuUrl: "/url/to/delete.pdf",
      });
      deleteFile.mockRejectedValueOnce(new Error("Delete failed"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const result = await deleteDecision("qd1");

      expect(deleteFile).toHaveBeenCalled();
      expect(decisionRepository.remove).toHaveBeenCalledWith("qd1");
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
