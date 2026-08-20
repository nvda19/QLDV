const express = require("express");
const router = express.Router();
const decisionController = require("../controllers/decision.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const { auditContextMiddleware } = require("../infrastructure/audit/auditContext");
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});
const { ROLES } = require("../domain/constants/member.constants");

router.use(authenticate);
router.use(auditContextMiddleware);

router.get(
  "/",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  decisionController.getAllDecisions
);

router.get(
  "/:id",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  decisionController.getDecisionById
);

router.post(
  "/",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  upload.single("file"),
  decisionController.createDecision
);

router.put(
  "/:id",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  upload.single("file"),
  decisionController.updateDecision
);

router.delete(
  "/:id",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  decisionController.deleteDecision
);

module.exports = router;
