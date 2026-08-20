const path = require("path");
const fs = require("fs");

const UPLOAD_ROOT = path.join(__dirname, "../../../uploads");
const ATTACHMENTS_DIR = path.join(UPLOAD_ROOT, "attachments");

/**
 * Lưu tệp tải lên vào thư mục lưu trữ cục bộ. Dùng cho file đính kèm của đảng viên - lưu
 * xuống ổ đĩa local, không dùng cloud storage.
 * @param {Buffer} buffer Buffer chứa dữ liệu file
 * @param {string} originalName Tên gốc của file
 * @param {string} memberId ID của Đảng viên
 * @returns {Object} Đối tượng chứa thông tin file đã lưu
 */
async function uploadFile(buffer, originalName, memberId) {
  const uploadDir = ATTACHMENTS_DIR;
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext = path.extname(originalName).toLowerCase();
  const FileType = ext.replace(".", "") || "bin";
  // Ghép memberId + timestamp + số random để tránh trùng tên khi nhiều người cùng upload
  const uniqueName = `${memberId}_${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`;
  const savePath = path.join(uploadDir, uniqueName);

  fs.writeFileSync(savePath, buffer);

  return {
    FileUrl: `/uploads/attachments/${uniqueName}`,
    FileType,
    fileName: originalName,
  };
}

/**
 * Xóa tệp khỏi ổ đĩa cứng vật lý. Chỉ xóa nếu URL nằm trong /uploads/ (phòng trường hợp
 * FileUrl trỏ ra ngoài do dữ liệu cũ/lỗi); lỗi xóa thì log lại chứ không throw, vì hàm
 * này thường được gọi kèm theo việc xóa bản ghi DB, không nên làm fail cả transaction.
 * @param {string} FileUrl URL của file cần xóa
 */
async function deleteFile(FileUrl) {
  if (!FileUrl) return;

  try {
    if (FileUrl.startsWith("/uploads/")) {
      const resolvedPath = path.resolve(
        UPLOAD_ROOT,
        FileUrl.replace(/^\/uploads[/\\]?/, ""),
      );
      if (!resolvedPath.startsWith(path.resolve(UPLOAD_ROOT))) {
        console.warn(`[Security] Chặn đường dẫn file không hợp lệ: ${FileUrl}`);
        return;
      }
      if (fs.existsSync(resolvedPath)) {
        fs.unlinkSync(resolvedPath);
        console.log(`Successfully deleted file: ${resolvedPath}`);
      }
    }
  } catch (error) {
    console.error(`Failed to delete file (${FileUrl}):`, error);
  }
}

module.exports = {
  uploadFile,
  deleteFile,
  UPLOAD_ROOT,
  ATTACHMENTS_DIR,
};
