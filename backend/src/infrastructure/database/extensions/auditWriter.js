// Các hàm helper để Prisma extension ghi log thao tác vào bảng NhatKyHeThong
const { randomUUID } = require("node:crypto");

/**
 * So key-by-key giữa bản ghi cũ và mới, bỏ qua các cột tự sinh (updatedAt, deletedAt...)
 * vì chúng đổi liên tục và không mang ý nghĩa nghiệp vụ. Trả về null nếu không có gì thay
 * đổi thực sự - tránh ghi log rác khi Prisma gọi update nhưng dữ liệu giống hệt.
 * @param {*} oldData Dữ liệu cũ
 * @param {*} newData Dữ liệu mới
 * @returns {Object} Đối tượng chứa dữ liệu cũ và mới đã so sánh
 */
function computeDiff(oldData, newData) {
  if (!oldData || !newData) return { oldDiff: oldData, newDiff: newData };
  const oldDiff = {};
  const newDiff = {};
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  for (const key of allKeys) {
    if (
      key === "updatedAt" ||
      key === "createdAt" ||
      key === "deletedAt" ||
      key === "deletedBy"
    ) {
      continue;
    }
    const oldVal = oldData[key];
    const newVal = newData[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      oldDiff[key] = oldVal !== undefined ? oldVal : null;
      newDiff[key] = newVal !== undefined ? newVal : null;
    }
  }

  if (Object.keys(newDiff).length === 0) return null;
  return { oldDiff, newDiff };
}

/**
 * Ẩn thông tin nhạy cảm (mật khẩu, hash) và lọc bớt các object quan hệ lồng nhau không
 * cần thiết trước khi ghi vào log - log chỉ cần biết cái gì đổi, không cần dump cả cây
 * quan hệ.
 * @param {*} data Dữ liệu cần ẩn thông tin nhạy cảm
 * @returns {*} Dữ liệu đã ẩn thông tin nhạy cảm
 */
function sanitizeData(data) {
  if (!data || typeof data !== "object") return data;
  const sanitized = {};

  for (const [key, value] of Object.entries(data)) {
    // Che thông tin mật khẩu
    if (
      key.toLowerCase().includes("matkhau") ||
      key.toLowerCase().includes("password") ||
      key.toLowerCase().includes("hash")
    ) {
      sanitized[key] = "[MASKED]";
      continue;
    }

    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      // Object không có Id (không phải quan hệ Prisma) hoặc là mấy trường JSON đặc thù
      // (lịch sử bản thân, quan hệ nước ngoài, hoàn cảnh kinh tế) thì vẫn giữ lại nguyên vẹn
      if (
        !value.Id ||
        key === "lichSuBanThan" ||
        key === "quanHeNuocNgoai" ||
        key === "hoanCanhKinhTe"
      ) {
        sanitized[key] = value;
      }
      continue;
    }
    sanitized[key] = value;
  }
  return sanitized;
}

/**
 * Ghi trực tiếp log vào DB thông qua câu lệnh SQL thô, thay vì gọi
 * prisma.nhatKyHeThong.create() - vì hàm này chạy bên trong extension, gọi lại model
 * Prisma đã bọc extension dễ gây đệ quy vô hạn. Lỗi ghi log chỉ log ra console, không
 * throw, để không làm fail thao tác chính của người dùng.
 * @param {*} prismaInstance Instance Prisma
 * @param {*} actorId ID người dùng thực hiện hành động
 * @param {*} action Hành động đã thực hiện
 * @param {*} entityName Tên bảng bị tác động
 * @param {*} entityId ID bản ghi bị tác động
 * @param {*} oldData Dữ liệu cũ của bản ghi
 * @param {*} newData Dữ liệu mới của bản ghi
 * @param {*} ipAddress Địa chỉ IP của người dùng thực hiện hành động
 */
async function writeAuditLog(
  prismaInstance,
  actorId,
  action,
  entityName,
  entityId,
  oldData,
  newData,
  ipAddress,
) {
  try {
    const id = randomUUID();
    const now = new Date();
    await prismaInstance.$executeRawUnsafe(
      `INSERT INTO "NhatKyHeThong" ("id", "nguoiDungId", "hanhDong", "tenBang", "banGhiId", "giaTriCu", "giaTriMoi", "diaChiIp", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      id,
      actorId,
      action,
      entityName,
      entityId,
      oldData ? JSON.stringify(oldData) : null,
      newData ? JSON.stringify(newData) : null,
      ipAddress || null,
      now,
    );
  } catch (err) {
    console.error("[AuditLog] Ghi log thất bại:", err.message);
  }
}

/**
 * Trích xuất ID từ điều kiện truy vấn. Query update/delete không phải lúc nào cũng where
 * theo Id - có thể where theo DangVienId, Ten hay TenDangNhap tùy model. Cố lấy ra cái gì
 * gần giống định danh nhất để lưu vào cột banGhiId, không tìm được thì fallback dump cả
 * where ra JSON cho có dấu vết.
 * @param {*} where Điều kiện truy vấn
 * @returns {string} ID của bản ghi
 */
function extractIdFromWhere(where) {
  if (!where) return "unknown";
  if (where.Id) return where.Id;
  if (where.DangVienId) return where.DangVienId;
  if (where.Ten) return where.Ten;
  if (where.TenDangNhap) return where.TenDangNhap;
  return JSON.stringify(where);
}

/**
 * Lấy model accessor từ Prisma instance, đổi PascalCase (tên model Prisma) sang camelCase
 * (tên property trên PrismaClient) để gọi thẳng vào model gốc chưa bị extension bọc lại.
 * @param {*} basePrisma Instance Prisma
 * @param {string} modelName Tên model
 * @returns {*} Model accessor
 */
function getBaseModelAccessor(basePrisma, modelName) {
  const accessorName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  return basePrisma[accessorName];
}

module.exports = {
  computeDiff,
  sanitizeData,
  writeAuditLog,
  extractIdFromWhere,
  getBaseModelAccessor,
};
