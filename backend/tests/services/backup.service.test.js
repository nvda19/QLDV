/**
 * Unit test cho backup.service — mock toàn bộ `child_process` và `fs` để
 * KHÔNG bao giờ chạy pg_dump thật hay đụng vào ổ đĩa thật.
 */
jest.mock("child_process", () => ({
  exec: jest.fn(),
}));
jest.mock("fs", () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

const { exec } = require("child_process");
const fs = require("fs");
const { runBackup } = require("../../src/services/backup/backup.service");

const ORIGINAL_ENV = process.env.DATABASE_URL;

afterEach(() => {
  jest.clearAllMocks();
  process.env.DATABASE_URL = ORIGINAL_ENV;
});

describe("runBackup", () => {
  test("thiếu DATABASE_URL -> ném lỗi, không gọi exec", async () => {
    delete process.env.DATABASE_URL;

    await expect(runBackup()).rejects.toThrow(
      "Chưa cấu hình biến môi trường DATABASE_URL.",
    );
    expect(exec).not.toHaveBeenCalled();
  });

  test("DATABASE_URL sai định dạng -> ném lỗi", async () => {
    process.env.DATABASE_URL = "khong-phai-connection-string";

    await expect(runBackup()).rejects.toThrow(
      "Định dạng DATABASE_URL không hợp lệ.",
    );
    expect(exec).not.toHaveBeenCalled();
  });

  test("chạy pg_dump thành công -> trả về đường dẫn file backup và dọn file cũ >7 ngày", async () => {
    process.env.DATABASE_URL =
      "postgresql://myuser:mypass@localhost:5432/qldv_db";
    fs.existsSync.mockReturnValue(true); // backupDir đã tồn tại + pg_dump path đầu tiên "tồn tại"
    exec.mockImplementation((cmd, opts, cb) => cb(null, "ok", ""));

    const now = Date.now();
    const OLD_FILE = "backup_old.backup";
    const NEW_FILE = "backup_new.backup";
    fs.readdirSync.mockReturnValue([OLD_FILE, NEW_FILE]);
    fs.statSync.mockImplementation((filePath) => {
      if (filePath.includes(OLD_FILE)) {
        return { mtimeMs: now - 8 * 24 * 60 * 60 * 1000 }; // 8 ngày trước
      }
      return { mtimeMs: now - 1 * 24 * 60 * 60 * 1000 }; // 1 ngày trước
    });

    const result = await runBackup();

    expect(typeof result).toBe("string");
    expect(result).toMatch(/backup_qldv_db_.*\.backup$/);
    expect(fs.unlinkSync).toHaveBeenCalledTimes(1);
    expect(fs.unlinkSync.mock.calls[0][0]).toContain(OLD_FILE);
  });

  test("thư mục backups chưa tồn tại -> tạo mới trước khi backup", async () => {
    process.env.DATABASE_URL =
      "postgresql://myuser:mypass@localhost:5432/qldv_db";
    fs.existsSync.mockReturnValue(false);
    fs.readdirSync.mockReturnValue([]);
    exec.mockImplementation((cmd, opts, cb) => cb(null, "ok", ""));

    await runBackup();

    expect(fs.mkdirSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ recursive: true }),
    );
  });

  test("exec báo lỗi (pg_dump thất bại) -> reject đúng lỗi đó", async () => {
    process.env.DATABASE_URL =
      "postgresql://myuser:mypass@localhost:5432/qldv_db";
    fs.existsSync.mockReturnValue(true);
    const dumpError = new Error("pg_dump: command not found");
    exec.mockImplementation((cmd, opts, cb) => cb(dumpError));

    await expect(runBackup()).rejects.toThrow("pg_dump: command not found");
    expect(fs.readdirSync).not.toHaveBeenCalled();
  });

  test("lỗi khi dọn file cũ (readdirSync throw) -> vẫn resolve đường dẫn backup (không làm hỏng kết quả)", async () => {
    process.env.DATABASE_URL =
      "postgresql://myuser:mypass@localhost:5432/qldv_db";
    fs.existsSync.mockReturnValue(true);
    exec.mockImplementation((cmd, opts, cb) => cb(null, "ok", ""));
    fs.readdirSync.mockImplementation(() => {
      throw new Error("Không đọc được thư mục");
    });
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const result = await runBackup();

    expect(typeof result).toBe("string");
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  test("PGPASSWORD trong biến môi trường truyền cho exec khớp mật khẩu trong DATABASE_URL", async () => {
    process.env.DATABASE_URL =
      "postgresql://myuser:s3cr3t@localhost:5432/qldv_db";
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue([]);
    exec.mockImplementation((cmd, opts, cb) => cb(null, "ok", ""));

    await runBackup();

    const execOpts = exec.mock.calls[0][1];
    expect(execOpts.env.PGPASSWORD).toBe("s3cr3t");
  });
});
