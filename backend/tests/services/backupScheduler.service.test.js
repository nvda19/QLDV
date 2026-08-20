jest.mock("../../src/services/backup/backup.service", () => ({
  runBackup: jest.fn(),
}));

describe("startBackupScheduler", () => {
  let backupService;
  let startBackupScheduler;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
    backupService = require("../../src/services/backup/backup.service");
    backupService.runBackup.mockReset();
    ({
      startBackupScheduler,
    } = require("../../src/services/backup/backupScheduler.service"));
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test("không chạy backup ngay lập tức (chờ 2 phút delay)", () => {
    startBackupScheduler();
    expect(backupService.runBackup).not.toHaveBeenCalled();
  });

  test("sau 2 phút delay khởi động -> gọi runBackup lần đầu", async () => {
    backupService.runBackup.mockResolvedValueOnce("/path/to/backup.backup");

    startBackupScheduler();
    await jest.advanceTimersByTimeAsync(2 * 60 * 1000); // 2 phút delay

    expect(backupService.runBackup).toHaveBeenCalledTimes(1);
  });

  test("lặp lại mỗi 24 giờ sau đó", async () => {
    backupService.runBackup.mockResolvedValue("/path/to/backup.backup");

    startBackupScheduler();
    await jest.advanceTimersByTimeAsync(2 * 60 * 1000); // Lần đầu
    expect(backupService.runBackup).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(24 * 60 * 60 * 1000); // Lặp lại lần 2
    expect(backupService.runBackup).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(24 * 60 * 60 * 1000); // Lặp lại lần 3
    expect(backupService.runBackup).toHaveBeenCalledTimes(3);
  });

  test("chỉ tạo một timer duy nhất khi gọi startBackupScheduler nhiều lần", () => {
    const setTimeoutSpy = jest.spyOn(global, "setTimeout");
    const setIntervalSpy = jest.spyOn(global, "setInterval");

    startBackupScheduler();
    startBackupScheduler(); // Gọi lần 2 sẽ bị bỏ qua vì đã có timer

    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);

    setTimeoutSpy.mockRestore();
    setIntervalSpy.mockRestore();
  });

  test("runBackup ném lỗi -> bắt lỗi và không làm crash tiến trình", async () => {
    backupService.runBackup.mockRejectedValueOnce(new Error("Lỗi DB"));
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    startBackupScheduler();
    await jest.advanceTimersByTimeAsync(2 * 60 * 1000);

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
