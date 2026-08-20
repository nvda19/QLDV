/**
 * Unit test cho badgeScheduler.service — dùng fake timers để không phải chờ
 * thời gian thật (mặc định delay 1 phút, chu kỳ lặp 24 giờ).
 */
jest.mock("../../src/services/badge/badgeDetection.service", () => ({
  scanAndNotify: jest.fn(),
}));

describe("startBadgeScheduler", () => {
  let badgeDetectionService;
  let startBadgeScheduler;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
    badgeDetectionService = require("../../src/services/badge/badgeDetection.service");
    badgeDetectionService.scanAndNotify.mockReset();
    ({
      startBadgeScheduler,
    } = require("../../src/services/badge/badgeScheduler.service"));
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test("chưa tới thời gian delay -> chưa quét lần nào", () => {
    startBadgeScheduler();
    expect(badgeDetectionService.scanAndNotify).not.toHaveBeenCalled();
  });

  test("sau delay chỉ định -> gọi scanAndNotify() không tham số", async () => {
    badgeDetectionService.scanAndNotify.mockResolvedValue({
      scanned: 5,
      suggested: 1,
    });

    startBadgeScheduler(1000);
    await jest.advanceTimersByTimeAsync(1000);

    expect(badgeDetectionService.scanAndNotify).toHaveBeenCalledTimes(1);
    expect(badgeDetectionService.scanAndNotify).toHaveBeenCalledWith();
  });

  test("sau đó lặp lại mỗi 24 giờ", async () => {
    badgeDetectionService.scanAndNotify.mockResolvedValue({
      scanned: 0,
      suggested: 0,
    });

    startBadgeScheduler(0);
    await jest.advanceTimersByTimeAsync(0);
    expect(badgeDetectionService.scanAndNotify).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
    expect(badgeDetectionService.scanAndNotify).toHaveBeenCalledTimes(2);
  });

  test("gọi startBadgeScheduler 2 lần liên tiếp -> chỉ tạo 1 lịch lặp (bảo vệ bởi biến timer)", () => {
    const setIntervalSpy = jest.spyOn(global, "setInterval");

    startBadgeScheduler(1000);
    startBadgeScheduler(1000);

    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    setIntervalSpy.mockRestore();
  });

  test("scanAndNotify ném lỗi -> không làm crash tiến trình (lỗi được bắt trong runScan)", async () => {
    badgeDetectionService.scanAndNotify.mockRejectedValue(new Error("Lỗi DB"));
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    startBadgeScheduler(0);
    await jest.advanceTimersByTimeAsync(0);

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
