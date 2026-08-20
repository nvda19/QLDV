const {
  uploadFile,
} = require("../../infrastructure/storage/fileStorage.service");
const {
  validateFileUpload,
} = require("../../domain/validators/file.validation");

/**
 * Helper dùng chung cho mọi chỗ có upload file đính kèm (quyết định, tài liệu...) —
 * validate định dạng/dung lượng trước rồi mới lưu, tránh lặp lại 2 bước này ở từng service.
 * @param {string} ownerId - ID của thực thể sở hữu file (dùng đặt tên/thư mục lưu)
 * @param {object} file - File từ multer (buffer, originalname, size...)
 * @returns {Promise<object>} Thông tin file đã lưu (đường dẫn, tên...)
 */
const saveUploadFile = async (ownerId, file) => {
  validateFileUpload(file.originalname, file.size || file.buffer?.length || 0);
  return uploadFile(file.buffer, file.originalname, ownerId);
};

module.exports = { saveUploadFile };
