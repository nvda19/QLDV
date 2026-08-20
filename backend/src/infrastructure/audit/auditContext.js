const { AsyncLocalStorage } = require("node:async_hooks");

const auditStore = new AsyncLocalStorage();

/**
 * Middleware gắn vào đầu request pipeline, lưu actorId/ipAddress vào AsyncLocalStorage
 * cho toàn bộ vòng đời request. Nhờ vậy các extension Prisma (auditWriter...) chạy sâu
 * bên trong service/repository vẫn lấy được ai đang thao tác mà không cần truyền userId
 * xuyên qua từng hàm.
 * @param {Object} req - Đối tượng yêu cầu HTTP
 * @param {Object} res - Đối tượng phản hồi HTTP
 * @param {Function} next - Hàm chuyển sang middleware tiếp theo
 * @returns {void}
 */
const auditContextMiddleware = (req, res, next) => {
  const context = {
    actorId: req.user?.userId || null,
    ipAddress:
      req.ip ||
      req.headers["x-forwarded-for"] || // khi chạy sau proxy/load balancer thì req.ip không chính xác
      req.connection?.remoteAddress || // fallback lấy thẳng từ socket
      null,
  };
  auditStore.run(context, next);
};

/**
 * Lấy ngữ cảnh ghi nhật ký hiện tại từ AsyncLocalStorage. Gọi ngoài request (không có
 * store đang chạy) sẽ trả object rỗng thay vì undefined, để nơi gọi không phải kiểm tra
 * null liên tục.
 * @returns {Object} Ngữ cảnh ghi nhật ký
 */
const getAuditContext = () => auditStore.getStore() || {};

module.exports = { auditContextMiddleware, getAuditContext };
