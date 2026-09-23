const express = require("express");
const router = express.Router();
const memberController = require("../controllers/member/member.controller");
const evalController = require("../controllers/member/memberEvaluation.controller");
const orgController = require("../controllers/org.controller");
const badgeController = require("../controllers/badge/badgeController");
const badgeOrgController = require("../controllers/badge/badgeOrg.controller");
const rankController = require("../controllers/member/memberRank.controller");
const attachController = require("../controllers/member/memberAttachment.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const {
  auditContextMiddleware,
} = require("../infrastructure/audit/auditContext");
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});
const { ROLES } = require("../domain/constants/member.constants");

// Tất cả các route yêu cầu xác thực & ghi nhận ngữ cảnh audit log
router.use(authenticate);
router.use(auditContextMiddleware);

// =========================================================================
// I. CÁC ROUTE CHUNG & HỆ THỐNG (Không chứa tham số :id ở cấp 1)
// =========================================================================

// 1. Quản lý hồ sơ chung & Nhập/Xuất Excel
router.get("/import-template", memberController.downloadImportTemplate);
router.post(
  "/import",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  upload.array("files"),
  memberController.importMembers,
);
router.get("/", memberController.getAllMembers);
router.post(
  "/",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  memberController.createMember,
);

// 2. Đánh giá xếp loại theo tổ chức (Chi bộ)
router.get(
  "/org/:orgId/warnings",
  authorize(ROLES.CAN_BO_CHINH_TRI),
  orgController.getEvaluationWarnings,
);
router.post(
  "/org/:orgId/submit",
  authorize(ROLES.BI_THU),
  orgController.submitEvaluations,
);
router.post(
  "/org/:orgId/approve",
  authorize(ROLES.CAN_BO_CHINH_TRI),
  upload.single("file"),
  orgController.approveEvaluations,
);
router.post(
  "/org/:orgId/reject",
  authorize(ROLES.CAN_BO_CHINH_TRI),
  orgController.rejectEvaluations,
);

// 3. Đề xuất Huy hiệu Đảng theo tổ chức & Nhập offline từ Excel/Zip
router.get("/badges/proposals", badgeController.getBadgeProposals);
router.post(
  "/badges/scan",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  badgeController.scanBadgeEligibility,
);
router.post(
  "/badges/import-proposals-offline",
  authorize(ROLES.CAN_BO_CHINH_TRI),
  badgeController.importProposalsOffline,
);
router.post(
  "/badges/import-decisions-offline",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  badgeController.importDecisionsOffline,
);
router.post(
  "/badges/org/:orgId/submit",
  authorize(ROLES.BI_THU),
  badgeOrgController.submitOrgBadges,
);
router.post(
  "/badges/org/:orgId/approve",
  authorize(ROLES.CAN_BO_CHINH_TRI),
  upload.single("file"),
  badgeOrgController.approveOrgBadges,
);
router.post(
  "/badges/org/:orgId/reject",
  authorize(ROLES.CAN_BO_CHINH_TRI),
  badgeOrgController.rejectOrgBadges,
);
router.post(
  "/badges/milestone/:mocHuyHieu/approve",
  authorize(ROLES.CAN_BO_CHINH_TRI),
  upload.single("file"),
  badgeOrgController.approveMilestoneBadges,
);
router.post(
  "/badges/milestone/:mocHuyHieu/reject",
  authorize(ROLES.CAN_BO_CHINH_TRI),
  badgeOrgController.rejectMilestoneBadges,
);

// =========================================================================
// II. CÁC ROUTE CÁ NHÂN ĐẢNG VIÊN (Bắt đầu với tham số :id ở cấp 1)
// =========================================================================

// 1. CRUD Thông tin cá nhân Đảng viên chi tiết
router.get("/:id", memberController.getMemberById);
router.put(
  "/:id",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  memberController.updateMember,
);
router.delete(
  "/:id",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  memberController.deleteMember,
);
router.get("/:id/export-word", memberController.exportMemberWord);

// 2. Lịch sử phong thăng quân hàm
router.post(
  "/:id/rank-history",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  upload.single("file"),
  rankController.addRankHistory,
);
router.put(
  "/:id/rank-history/:rankId",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  upload.single("file"),
  rankController.updateRankHistory,
);
router.delete(
  "/:id/rank-history/:rankId",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  rankController.deleteRankHistory,
);

// 3. Đánh giá xếp loại Đảng viên hàng năm
router.post(
  "/:id/evaluations",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  upload.single("file"),
  evalController.addEvaluation,
);
router.put(
  "/:id/evaluations/:evalId",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  upload.single("file"),
  evalController.updateEvaluation,
);
router.delete(
  "/:id/evaluations/:evalId",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  evalController.deleteEvaluation,
);
router.put(
  "/:id/evaluations/:evalId/approve",
  authorize(ROLES.CAN_BO_CHINH_TRI),
  evalController.approveEvaluation,
);
router.put(
  "/:id/evaluations/:evalId/reject",
  authorize(ROLES.CAN_BO_CHINH_TRI),
  evalController.rejectEvaluation,
);

// 4. Đề xuất Huy hiệu Đảng cá nhân
router.post(
  "/:id/badges/propose",
  authorize(ROLES.BI_THU),
  badgeController.proposeBadge,
);
router.post(
  "/:id/badges/dismiss",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  badgeController.dismissBadgeProposal,
);
router.post(
  "/:id/badges/restore",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  badgeController.restoreBadgeProposal,
);
router.put(
  "/:id/badges/update-file",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  upload.single("file"),
  badgeController.updateBadgeDecision,
);

// 5. Quản lý tài liệu đính kèm lý lịch & đào tạo
router.post(
  "/:id/attachments",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  upload.single("file"),
  attachController.uploadAttachment,
);
router.delete(
  "/:id/attachments/:attachmentId",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  attachController.deleteAttachment,
);
router.post(
  "/:id/training/:trainingId/attachment",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  upload.single("file"),
  attachController.uploadTrainingAttachment,
);
router.delete(
  "/:id/training/:trainingId/attachment",
  authorize(ROLES.CAN_BO_CHINH_TRI, ROLES.BI_THU),
  attachController.deleteTrainingAttachment,
);

module.exports = router;
