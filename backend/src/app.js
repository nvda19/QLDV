require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const app = express();
const errorHandler = require("./middlewares/error.middleware");



app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Endpoint kiểm tra hoạt động hệ thống
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Endpoint reset & seed cơ sở dữ liệu (chỉ cho phép chạy ở môi trường development khi có quyền Cán bộ chính trị)
if (process.env.NODE_ENV === "development") {
  const { authenticate } = require("./middlewares/auth.middleware");
  const { authorize } = require("./middlewares/role.middleware");
  const { ROLES } = require("./domain/constants/member.constants");

  app.post("/api/reset-db", authenticate, authorize(ROLES.CAN_BO_CHINH_TRI), async (req, res, next) => {
    try {
      const { exec } = require("child_process");
      const path = require("path");
      const seedScript = path.join(__dirname, "../prisma/seed.js");
      
      exec(`node "${seedScript}"`, (error, stdout, stderr) => {
        if (error) {
          console.error("Lỗi khi chạy seed database:", stderr);
          return res.status(500).json({ success: false, error: error.message, details: stderr });
        }
        console.log("Seed database thành công:", stdout);
        res.json({ success: true, message: "Đã reset và seed cơ sở dữ liệu thành công!", output: stdout });
      });
    } catch (err) {
      next(err);
    }
  });
}

const authRoutes = require("./routes/auth.routes");
const orgRoutes = require("./routes/org.routes");
const memberRoutes = require("./routes/member.routes");
const userRoutes = require("./routes/user.routes");
const notificationRoutes = require("./routes/notification.routes");
const decisionRoutes = require("./routes/decision.routes");

app.use("/api/auth", authRoutes);
app.use("/api/organizations", orgRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/decisions", decisionRoutes);

// Phục vụ frontend static files trong môi trường production
const frontendPath = path.join(__dirname, "../public");
app.use(express.static(frontendPath));

// Fallback cho SPA: mọi route còn lại đều trả index.html, để React Router tự lo phần điều hướng
app.get(/.*/, (req, res) => {
  const indexPath = path.join(frontendPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({ message: "Không tìm thấy tài nguyên" });
    }
  });
});

// Middleware xử lý lỗi toàn cục (bắt buộc đặt cuối cùng)
app.use(errorHandler);

const {
  startBadgeScheduler,
} = require("./services/badge/badgeScheduler.service");
const fs = require("fs");
const https = require("https");
const http = require("http");

const PORT = process.env.PORT || 3000;
let server;

// Cấu hình HTTPS cục bộ nếu có chứng chỉ
try {
  const keyPath = path.join(__dirname, "../certs/key.pem");
  const certPath = path.join(__dirname, "../certs/cert.pem");

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    server = https.createServer(options, app);
    console.log("Khởi động server chạy HTTPS local...");
  } else {
    server = http.createServer(app);
    console.log("Không tìm thấy chứng chỉ HTTPS, chạy HTTP fallback...");
  }
} catch (error) {
  server = http.createServer(app);
  console.log("Lỗi khi load chứng chỉ, chạy HTTP fallback:", error.message);
}

server.listen(PORT, () => {
  console.log(`Server đang lắng nghe tại cổng ${PORT}`);

  // Chạy các lịch quét nền tự động nếu không phải môi trường kiểm thử
  if (process.env.NODE_ENV !== "test") {
    startBadgeScheduler();
    try {
      const {
        startBackupScheduler,
      } = require("./services/backup/backupScheduler.service");
      startBackupScheduler();
    } catch (err) {
      console.error(
        "Không thể khởi động tiến trình sao lưu tự động:",
        err.message,
      );
    }
  }
});

module.exports = app;
