const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

/**
 * Gọi pg_dump để sao lưu database, thông tin kết nối lấy trực tiếp từ DATABASE_URL
 * chứ không cần cấu hình riêng. Sau khi sao lưu xong sẽ dọn luôn các file backup
 * quá 7 ngày để thư mục backups không phình to theo thời gian.
 */
const runBackup = async () => {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("Chưa cấu hình biến môi trường DATABASE_URL.");
    }

    // Tách user/password/host/port/database/sslmode từ chuỗi kết nối Postgres.
    // Dùng URL thay vì regex thủ công vì mật khẩu/host có thể chứa ký tự đặc biệt
    // (vd "@") và connection string của Neon luôn kèm query string (?sslmode=require).
    let user, password, host, port, database, sslmode;
    try {
      const parsed = new URL(connectionString);
      user = decodeURIComponent(parsed.username);
      password = decodeURIComponent(parsed.password);
      host = parsed.hostname;
      port = parsed.port || "5432";
      database = parsed.pathname.replace(/^\//, "");
      sslmode = parsed.searchParams.get("sslmode");
      if (!user || !host || !database) {
        throw new Error("invalid");
      }
    } catch (e) {
      throw new Error("Định dạng DATABASE_URL không hợp lệ.");
    }

    const backupDir = path.join(__dirname, "../../../backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup_${database}_${timestamp}.backup`;
    const backupPath = path.join(backupDir, fileName);

    // Máy chạy Windows thường không có pg_dump trong PATH nên thử vài vị trí cài đặt phổ biến trước
    const possiblePaths = [
      "C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe",
      "C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe",
      "pg_dump",
    ];

    let pgDumpPath = "pg_dump";
    for (const p of possiblePaths) {
      if (p === "pg_dump" || fs.existsSync(p)) {
        pgDumpPath = p;
        break;
      }
    }

    // Dùng format custom (-F c) của pg_dump vì nó nén sẵn và cho phép pg_restore chọn lọc bảng khi cần
    const cmd = `"${pgDumpPath}" -h ${host} -p ${port} -U ${user} -F c -b -v -f "${backupPath}" ${database}`;
    console.log(`[BackupService] Đang thực hiện sao lưu DB...`);

    const env = { ...process.env, PGPASSWORD: password };
    if (sslmode) {
      // Neon bắt buộc SSL (sslmode=require) - pg_dump/pg_restore đọc cấu hình SSL qua PGSSLMODE
      env.PGSSLMODE = sslmode;
    }

    return new Promise((resolve, reject) => {
      exec(cmd, { env }, (error, stdout, stderr) => {
        if (error) {
          console.error(`[BackupService] Lỗi khi sao lưu:`, error.message);
          return reject(error);
        }
        console.log(
          `[BackupService] File sao lưu đã được ghi thành công: ${backupPath}`,
        );

        // Xóa file cũ quá hạn giữ, lỗi ở bước này không nên làm hỏng kết quả backup vừa xong
        try {
          const files = fs.readdirSync(backupDir);
          const now = Date.now();
          const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

          for (const file of files) {
            const filePath = path.join(backupDir, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > MAX_AGE) {
              fs.unlinkSync(filePath);
              console.log(`[BackupService] Đã xóa file sao lưu cũ: ${file}`);
            }
          }
        } catch (cleanupError) {
          console.error(
            `[BackupService] Lỗi dọn dẹp file cũ:`,
            cleanupError.message,
          );
        }

        resolve(backupPath);
      });
    });
  } catch (err) {
    console.error(`[BackupService] Tiến trình sao lưu thất bại:`, err.message);
    throw err;
  }
};

module.exports = { runBackup };
