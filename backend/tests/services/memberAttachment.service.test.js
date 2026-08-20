/**
 * Unit test cho memberAttachment.service — tài liệu scan đính kèm hồ sơ gốc
 * và tệp văn bằng/chứng chỉ đính kèm quá trình đào tạo.
 */
jest.mock("../../src/repositories/member/memberHistory.repository", () => ({
  findTrainingById: jest.fn(),
  updateTraining: jest.fn(),
}));
jest.mock("../../src/repositories/member/memberAttachment.repository", () => ({
  createAttachment: jest.fn(),
  findAttachmentByMemberAndId: jest.fn(),
  deleteAttachment: jest.fn(),
}));
jest.mock("../../src/domain/policies/member.policy", () => ({
  validateWritePermission: jest.fn(),
}));
jest.mock("../../src/infrastructure/storage/fileStorage.service", () => ({
  deleteFile: jest.fn(),
}));
jest.mock("../../src/services/files/attachmentUpload.service", () => ({
  saveUploadFile: jest.fn(),
}));

const memberHistoryRepository = require("../../src/repositories/member/memberHistory.repository");
const memberAttachmentRepository = require("../../src/repositories/member/memberAttachment.repository");
const { validateWritePermission } = require("../../src/domain/policies/member.policy");
const { deleteFile } = require("../../src/infrastructure/storage/fileStorage.service");
const { saveUploadFile } = require("../../src/services/files/attachmentUpload.service");
const {
  addAttachment,
  deleteAttachment,
  uploadTrainingAttachment,
  deleteTrainingAttachment,
} = require("../../src/services/member/memberAttachment.service");

beforeEach(() => {
  jest.clearAllMocks();
  validateWritePermission.mockResolvedValue({ Id: "m1" });
});

describe("addAttachment", () => {
  test("không có quyền ghi -> ném lỗi, không upload file", async () => {
    validateWritePermission.mockRejectedValue(new Error("Không có quyền"));

    await expect(
      addAttachment("m1", { originalname: "a.pdf" }, {}, {}),
    ).rejects.toThrow("Không có quyền");
    expect(saveUploadFile).not.toHaveBeenCalled();
  });

  test("thành công -> tạo bản ghi đính kèm với đúng thông tin file", async () => {
    saveUploadFile.mockResolvedValue({ FileUrl: "/uploads/attachments/a.pdf", FileType: "pdf" });
    memberAttachmentRepository.createAttachment.mockResolvedValue({
      Id: "att1",
      DangVienId: "m1",
      TenTaiLieu: "Sơ yếu lý lịch",
      LoaiTaiLieu: "SO_YEU_LY_LICH",
      FileUrl: "/uploads/attachments/a.pdf",
      FileType: "pdf",
      CreatedAt: new Date("2024-01-01"),
    });

    const result = await addAttachment(
      "m1",
      { originalname: "a.pdf" },
      { TenTaiLieu: "Sơ yếu lý lịch", LoaiTaiLieu: "SO_YEU_LY_LICH" },
      {},
    );

    expect(memberAttachmentRepository.createAttachment).toHaveBeenCalledWith(
      expect.objectContaining({
        DangVienId: "m1",
        TenTaiLieu: "Sơ yếu lý lịch",
        LoaiTaiLieu: "SO_YEU_LY_LICH",
      }),
    );
    expect(result.id).toBe("att1");
  });

  test("không truyền tên/loại tài liệu -> dùng tên file gốc và loại mặc định KHAC", async () => {
    saveUploadFile.mockResolvedValue({ FileUrl: "/uploads/attachments/b.png", FileType: "png" });
    memberAttachmentRepository.createAttachment.mockResolvedValue({
      Id: "att2",
      DangVienId: "m1",
      TenTaiLieu: "b.png",
      LoaiTaiLieu: "KHAC",
    });

    await addAttachment("m1", { originalname: "b.png" }, {}, {});

    expect(memberAttachmentRepository.createAttachment).toHaveBeenCalledWith(
      expect.objectContaining({ TenTaiLieu: "b.png", LoaiTaiLieu: "KHAC" }),
    );
  });
});

describe("deleteAttachment", () => {
  test("không tìm thấy tài liệu -> ném lỗi", async () => {
    memberAttachmentRepository.findAttachmentByMemberAndId.mockResolvedValue(null);

    await expect(deleteAttachment("m1", "att-x", {})).rejects.toThrow(
      "Không tìm thấy tài liệu đính kèm",
    );
    expect(deleteFile).not.toHaveBeenCalled();
  });

  test("tìm thấy, có FileUrl -> xóa file vật lý trước khi xóa bản ghi", async () => {
    memberAttachmentRepository.findAttachmentByMemberAndId.mockResolvedValue({
      Id: "att1",
      FileUrl: "/uploads/attachments/a.pdf",
    });

    const result = await deleteAttachment("m1", "att1", {});

    expect(deleteFile).toHaveBeenCalledWith("/uploads/attachments/a.pdf");
    expect(memberAttachmentRepository.deleteAttachment).toHaveBeenCalledWith("att1");
    expect(result).toEqual({ success: true, message: "Xóa tài liệu đính kèm thành công" });
  });

  test("tìm thấy nhưng không có FileUrl -> không gọi deleteFile", async () => {
    memberAttachmentRepository.findAttachmentByMemberAndId.mockResolvedValue({
      Id: "att2",
      FileUrl: null,
    });

    await deleteAttachment("m1", "att2", {});

    expect(deleteFile).not.toHaveBeenCalled();
    expect(memberAttachmentRepository.deleteAttachment).toHaveBeenCalledWith("att2");
  });
});

describe("uploadTrainingAttachment", () => {
  test("không tìm thấy quá trình đào tạo -> ném lỗi", async () => {
    memberHistoryRepository.findTrainingById.mockResolvedValue(null);

    await expect(
      uploadTrainingAttachment("m1", "t-x", { originalname: "c.pdf" }, {}),
    ).rejects.toThrow("Không tìm thấy quá trình đào tạo");
  });

  test("đã có tệp cũ -> xóa tệp cũ trước khi lưu tệp mới", async () => {
    memberHistoryRepository.findTrainingById.mockResolvedValue({
      Id: "t1",
      TaiLieuUrl: "/uploads/attachments/old.pdf",
    });
    saveUploadFile.mockResolvedValue({ FileUrl: "/uploads/attachments/new.pdf", fileName: "new.pdf" });
    memberHistoryRepository.updateTraining.mockResolvedValue({ Id: "t1" });

    await uploadTrainingAttachment("m1", "t1", { originalname: "new.pdf" }, {});

    expect(deleteFile).toHaveBeenCalledWith("/uploads/attachments/old.pdf");
    expect(memberHistoryRepository.updateTraining).toHaveBeenCalledWith("t1", {
      TaiLieuUrl: "/uploads/attachments/new.pdf",
      TaiLieuName: "new.pdf",
    });
  });

  test("chưa có tệp cũ -> không gọi deleteFile", async () => {
    memberHistoryRepository.findTrainingById.mockResolvedValue({ Id: "t2", TaiLieuUrl: null });
    saveUploadFile.mockResolvedValue({ FileUrl: "/uploads/attachments/x.pdf", fileName: "x.pdf" });

    await uploadTrainingAttachment("m1", "t2", { originalname: "x.pdf" }, {});

    expect(deleteFile).not.toHaveBeenCalled();
  });
});

describe("deleteTrainingAttachment", () => {
  test("không tìm thấy quá trình đào tạo -> ném lỗi", async () => {
    memberHistoryRepository.findTrainingById.mockResolvedValue(null);

    await expect(deleteTrainingAttachment("m1", "t-x", {})).rejects.toThrow(
      "Không tìm thấy quá trình đào tạo",
    );
  });

  test("có tệp đính kèm -> xóa file vật lý và gỡ liên kết (set null)", async () => {
    memberHistoryRepository.findTrainingById.mockResolvedValue({
      Id: "t1",
      TaiLieuUrl: "/uploads/attachments/old.pdf",
    });

    await deleteTrainingAttachment("m1", "t1", {});

    expect(deleteFile).toHaveBeenCalledWith("/uploads/attachments/old.pdf");
    expect(memberHistoryRepository.updateTraining).toHaveBeenCalledWith("t1", {
      TaiLieuUrl: null,
      TaiLieuName: null,
    });
  });
});
