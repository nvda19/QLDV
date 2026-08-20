/**
 * Unit test cho attachmentUpload.service — wrapper validate + upload file.
 */
jest.mock("../../src/infrastructure/storage/fileStorage.service", () => ({
  uploadFile: jest.fn(),
}));
jest.mock("../../src/domain/validators/file.validation", () => ({
  validateFileUpload: jest.fn(),
}));

const { uploadFile } = require("../../src/infrastructure/storage/fileStorage.service");
const { validateFileUpload } = require("../../src/domain/validators/file.validation");
const { saveUploadFile } = require("../../src/services/files/attachmentUpload.service");

afterEach(() => {
  jest.clearAllMocks();
});

describe("saveUploadFile", () => {
  test("validate ném lỗi -> không gọi uploadFile", async () => {
    validateFileUpload.mockImplementation(() => {
      throw new Error("Định dạng file không hợp lệ");
    });
    const file = { originalname: "a.exe", size: 100 };

    await expect(saveUploadFile("owner1", file)).rejects.toThrow(
      "Định dạng file không hợp lệ",
    );
    expect(uploadFile).not.toHaveBeenCalled();
  });

  test("validate hợp lệ -> gọi uploadFile với đúng buffer/tên/owner", async () => {
    validateFileUpload.mockImplementation(() => {});
    uploadFile.mockResolvedValue({ FileUrl: "/uploads/attachments/x.pdf", fileName: "x.pdf" });
    const file = { originalname: "x.pdf", size: 123, buffer: Buffer.from("data") };

    const result = await saveUploadFile("owner1", file);

    expect(validateFileUpload).toHaveBeenCalledWith("x.pdf", 123);
    expect(uploadFile).toHaveBeenCalledWith(file.buffer, "x.pdf", "owner1");
    expect(result).toEqual({ FileUrl: "/uploads/attachments/x.pdf", fileName: "x.pdf" });
  });

  test("thiếu size nhưng có buffer -> dùng buffer.length làm size khi validate", async () => {
    validateFileUpload.mockImplementation(() => {});
    uploadFile.mockResolvedValue({ FileUrl: "/uploads/attachments/y.png", fileName: "y.png" });
    const file = { originalname: "y.png", buffer: Buffer.from("abcde") };

    await saveUploadFile("owner2", file);

    expect(validateFileUpload).toHaveBeenCalledWith("y.png", 5);
  });
});
