const notificationService = require("../services/notification.service");

// Lấy danh sách thông báo của người dùng đăng nhập
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const result = await notificationService.getNotifications(req.user.userId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      unreadOnly: unreadOnly === "true"
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Lấy số lượng thông báo chưa đọc
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.userId);
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

// Đánh dấu một thông báo cụ thể là đã đọc
const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(parseInt(req.params.id, 10), req.user.userId);
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// Đánh dấu toàn bộ thông báo của người dùng là đã đọc
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
