const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { auditContextMiddleware } = require("../infrastructure/audit/auditContext");

router.use(authenticate);
router.use(auditContextMiddleware);

router.get("/", notificationController.getNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.put("/read-all", notificationController.markAllAsRead);
router.put("/:id/read", notificationController.markAsRead);

module.exports = router;
