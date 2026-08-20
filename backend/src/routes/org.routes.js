const express = require("express");
const router = express.Router();
const orgController = require("../controllers/org.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const { auditContextMiddleware } = require("../infrastructure/audit/auditContext");
const { ROLES } = require("../domain/constants/member.constants");
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.get("/", authenticate, auditContextMiddleware, orgController.getAll);

router.post(
  "/",
  authenticate,
  auditContextMiddleware,
  authorize([ROLES.CAN_BO_CHINH_TRI]),
  orgController.create,
);
router.put(
  "/:id",
  authenticate,
  auditContextMiddleware,
  authorize([ROLES.CAN_BO_CHINH_TRI]),
  orgController.update,
);
router.delete(
  "/:id",
  authenticate,
  auditContextMiddleware,
  authorize([ROLES.CAN_BO_CHINH_TRI]),
  orgController.remove,
);

router.get(
  "/evaluations/overview",
  authenticate,
  auditContextMiddleware,
  authorize([ROLES.BI_THU, ROLES.CAN_BO_CHINH_TRI]),
  orgController.getEvaluationOverview,
);

router.post(
  "/:id/evaluations/submit",
  authenticate,
  auditContextMiddleware,
  authorize([ROLES.BI_THU]),
  orgController.submitEvaluations,
);
router.post(
  "/:id/evaluations/approve",
  authenticate,
  auditContextMiddleware,
  authorize([ROLES.CAN_BO_CHINH_TRI]),
  upload.single("file"),
  orgController.approveEvaluations,
);
router.post(
  "/:id/evaluations/reject",
  authenticate,
  auditContextMiddleware,
  authorize([ROLES.CAN_BO_CHINH_TRI]),
  orgController.rejectEvaluations,
);

router.get(
  "/:id/evaluations/warnings",
  authenticate,
  auditContextMiddleware,
  authorize([ROLES.BI_THU, ROLES.CAN_BO_CHINH_TRI]),
  orgController.getEvaluationWarnings,
);

router.post(
  "/:id/evaluations/rollback",
  authenticate,
  auditContextMiddleware,
  authorize([ROLES.BI_THU]),
  orgController.rollbackEvaluations,
);

module.exports = router;
