const path = require("path");

// Blocklist định dạng file thực thi hoặc script độc hại
const FORBIDDEN_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".ps1",
  ".sh",
  ".js",
  ".php",
  ".py",
  ".rb",
  ".pl",
  ".vbs",
  ".msi",
  ".jar",
  ".dll",
]);

/**
 * Kiểm tra tính hợp lệ và an toàn của file upload
 * Lưu ý: chặn theo blocklist đuôi file thực thi/script (`FORBIDDEN_EXTENSIONS`) để giảm rủi ro
 * tải lên mã độc; mặc định giới hạn dung lượng 20MB nếu không truyền `maxSize`.
 * @param {string} filename Tên file
 * @param {number} size Kích thước file (byte)
 * @param {number} maxSize Kích thước tối đa cho phép (byte)
 * @returns {boolean} true nếu file hợp lệ
 */
const validateFileUpload = (filename, size, maxSize = 20 * 1024 * 1024) => {
  if (!filename) throw new Error("Tên file không hợp lệ.");

  const ext = path.extname(filename).toLowerCase();

  if (FORBIDDEN_EXTENSIONS.has(ext)) {
    throw new Error(`Định dạng file không được phép tải lên (${ext}).`);
  }

  if (size > maxSize) {
    throw new Error(
      `Kích thước file vượt quá giới hạn cho phép (${maxSize / 1024 / 1024}MB).`,
    );
  }

  return true;
};

module.exports = {
  validateFileUpload,
};
