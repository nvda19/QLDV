/**
 * Middleware xử lý lỗi tập trung, đặt cuối chuỗi middleware của Express
 * để bắt mọi lỗi ném ra từ controller/service và trả về response JSON thống nhất.
 * @returns {void}
 */
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Header đã gửi rồi thì không thể set lại status/response, đành đẩy tiếp cho Express xử lý
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Lỗi hệ thống nội bộ",
  });
};

module.exports = errorHandler;
