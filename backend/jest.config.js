/**
 * Cấu hình Jest cho backend.
 * Chỉ chạy test trong thư mục tests/ (đơn vị THUẦN — mapper, validator, parser,
 * cây tổ chức) làm lưới an toàn cho các bước refactor. Không kết nối DB.
 */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  // Không quét node_modules / prisma client sinh tự động.
  modulePathIgnorePatterns: ["<rootDir>/node_modules/"],
};
