// Tiến trình quét tự động xét niên hạn Huy hiệu Đảng định kỳ
const badgeDetectionService = require("./badgeDetection.service");

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const INITIAL_DELAY_MS = 60 * 1000; // Đợi 1 phút sau khi khởi động server mới quét

let timer = null;

/**
 * Quét và gửi thông báo đề nghị Huy hiệu Đảng đến hạn.
 * @returns {Promise<void>}
 */
const runScan = async () => {
  try {
    const result = await badgeDetectionService.scanAndNotify();
    console.log(
      `[BadgeScheduler] Kết quả quét Huy hiệu Đảng: phát hiện ${result.suggested} đề nghị mới / ${result.scanned} Đảng viên`,
    );
  } catch (err) {
    console.error("[BadgeScheduler] Gặp lỗi khi quét:", err.message);
  }
};

/**
 * Bắt đầu tiến trình quét định kỳ Huy hiệu Đảng (chạy 1 lần sau delayMs, rồi lặp mỗi ngày).
 * @param {number} delayMs - Thời gian chờ trước lần quét đầu tiên (ms)
 * @returns {void}
 */
const startBadgeScheduler = (delayMs = INITIAL_DELAY_MS) => {
  if (timer) return; // đã chạy rồi thì thôi, tránh set nhiều interval chồng nhau
  setTimeout(runScan, delayMs);
  timer = setInterval(runScan, ONE_DAY_MS);
  if (timer.unref) timer.unref(); // không giữ process sống chỉ vì cái interval này
};

module.exports = { startBadgeScheduler };
