// Gom hết secret/env nhạy cảm về một chỗ, tránh rải process.env.X khắp nơi trong code
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

// Chỉ dùng khi chạy local, không bao giờ được rơi vào production (resolveSecret sẽ throw nếu thiếu)
const DEV_FALLBACKS = {
  JWT_SECRET: "dev-secret-key-123",
  JWT_REFRESH_SECRET: "dev-refresh-secret-key-456",
  DATA_ENCRYPTION_KEY: "dev-secret-key-1234567890123456",
};

const resolveSecret = (name) => {
  const value = process.env[name];
  if (value) return value;
  if (isProduction) {
    throw new Error(
      `[config] Thiếu biến môi trường bắt buộc "${name}" trên production.`,
    );
  }
  console.warn(
    `[config] Chưa cấu hình "${name}" - sử dụng cấu hình mặc định (DEV).`,
  );
  return DEV_FALLBACKS[name];
};

const jwtSecret = resolveSecret("JWT_SECRET");
const jwtRefreshSecret = resolveSecret("JWT_REFRESH_SECRET");

// Thứ tự ưu tiên: DATA_ENCRYPTION_KEY riêng -> dùng tạm JWT_SECRET -> fallback dev.
// Lưu ý: đổi key này sau khi đã có dữ liệu mã hóa trong DB thì coi như mất khả năng giải mã dữ liệu cũ.
const dataEncryptionKey =
  process.env.DATA_ENCRYPTION_KEY ||
  process.env.JWT_SECRET ||
  (isProduction
    ? resolveSecret("DATA_ENCRYPTION_KEY")
    : DEV_FALLBACKS.DATA_ENCRYPTION_KEY);

module.exports = {
  isProduction,
  jwtSecret,
  jwtRefreshSecret,
  dataEncryptionKey,
};
