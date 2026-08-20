const { runBackup } = require("./backup.service");

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const INITIAL_DELAY_MS = 2 * 60 * 1000; // đợi server ổn định rồi mới chạy lần backup đầu

let timer = null;

// Bọc runBackup lại để lỗi backup không làm crash cả tiến trình server
const triggerBackup = async () => {
  try {
    console.log("[BackupScheduler] Bắt đầu tác vụ sao lưu tự động...");
    await runBackup();
    console.log("[BackupScheduler] Sao lưu tự động hoàn thành.");
  } catch (err) {
    console.error(
      "[BackupScheduler] Gặp lỗi khi sao lưu hàng ngày:",
      err.message,
    );
  }
};

/**
 * Khởi động tác vụ sao lưu tự động
 * Lưu ý: chờ `INITIAL_DELAY_MS` (2 phút) sau khi khởi động mới chạy lần đầu để tránh
 * tranh chấp tài nguyên với quá trình khởi động server; mặc định lặp lại mỗi 24h.
 * Gọi nhiều lần không có tác dụng (timer đã tồn tại thì bỏ qua) để tránh chạy trùng lịch.
 * @param {number} interval - Khoảng thời gian giữa các lần sao lưu
 * @returns {void}
 */
const startBackupScheduler = (interval = ONE_DAY_MS) => {
  if (timer) return;

  setTimeout(triggerBackup, INITIAL_DELAY_MS);
  timer = setInterval(triggerBackup, interval);
  if (timer.unref) timer.unref(); // Không chặn kết thúc tiến trình

  console.log(
    "[BackupScheduler] Đã kích hoạt tác vụ sao lưu tự động hàng ngày.",
  );
};

module.exports = { startBackupScheduler };
