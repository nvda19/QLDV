const path = require("path");
const fs = require("fs");
const { ATTACHMENTS_DIR } = require("./fileStorage.service");

/**
 * Lưu tài liệu đính kèm giải nén từ file ZIP hoặc upload hàng loạt trong quá trình import.
 * Khi import Excel hàng loạt, đảng viên có thể đính kèm tài liệu theo 2 kiểu: nén chung
 * vào một file ZIP, hoặc upload rời từng file cùng lúc với file Excel - hàm này xử lý
 * chung cả hai kiểu, dựa vào isZip/isMultiple để biết nên tìm buffer ở map nào.
 * @param {Map<string, Object>} zipEntriesMap Map chứa các file giải nén từ ZIP
 * @param {Map<string, Object>} directFilesMap Map chứa các file tải lên hàng loạt
 * @param {string} filename Tên file cần lưu
 * @param {string} memberId ID của Đảng viên
 * @param {boolean} isZip Xác định file có phải từ ZIP không
 * @param {boolean} isMultiple Xác định file có phải tải lên hàng loạt không
 * @returns {Object} Đối tượng chứa thông tin file đã lưu
 */
const saveImportAttachment = (
  zipEntriesMap,
  directFilesMap,
  filename,
  memberId,
  isZip,
  isMultiple,
) => {
  // 1. Chuẩn hóa tên file đầu vào để tìm kiếm
  if (!filename) return null;
  const cleanName = filename.trim().toLowerCase();

  // 2. Tìm và lấy dữ liệu nhị phân (buffer) từ file ZIP hoặc tải lên trực tiếp
  let buffer = null;
  if (isZip) {
    const entry = zipEntriesMap.get(cleanName);
    if (entry) buffer = entry.getData();
  } else if (isMultiple) {
    const file = directFilesMap.get(cleanName);
    if (file) buffer = file.buffer;
  }

  // 3. Kiểm tra dữ liệu và chuẩn bị thư mục lưu trữ đĩa cứng
  if (!buffer) return null;

  const ext = path.extname(filename).toLowerCase();
  const uploadDir = ATTACHMENTS_DIR;
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // 4. Tạo tên file độc nhất, ghi xuống đĩa cứng và trả về thông tin URL ảo
  const uniqueName = `${memberId}_import_${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`;
  const savePath = path.join(uploadDir, uniqueName);
  fs.writeFileSync(savePath, buffer);

  return {
    FileUrl: `/uploads/attachments/${uniqueName}`,
    fileName: filename.trim(),
  };
};

module.exports = {
  saveImportAttachment,
};
