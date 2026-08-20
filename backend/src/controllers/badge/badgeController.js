const badgeQueryService = require("../../services/badge/badgeQuery.service");
const badgeCommandService = require("../../services/badge/badgeCommand.service");
const badgeOfflineImportService = require("../../services/badge/badgeOfflineImport.service");
const badgeDetectionService = require("../../services/badge/badgeDetection.service");

// Lấy toàn bộ đề xuất Huy hiệu Đảng theo quyền hạn
const getBadgeProposals = async (req, res, next) => {
  try {
    const proposals = await badgeQueryService.getBadgeProposals(req.user);
    res.status(200).json({ success: true, data: proposals });
  } catch (error) {
    next(error);
  }
};

// Quét niên hạn và sinh đề xuất nháp cho đảng viên đủ tuổi Đảng
const scanBadgeEligibility = async (req, res, next) => {
  try {
    const result = await badgeDetectionService.scanAndNotify(req.user);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Đề xuất Huy hiệu Đảng thủ công cho đảng viên lẻ
const proposeBadge = async (req, res, next) => {
  try {
    const proposal = await badgeCommandService.proposeBadge(
      req.params.id,
      req.body,
      req.user,
    );
    res.status(201).json({ success: true, data: proposal });
  } catch (error) {
    next(error);
  }
};

// Loại một đề xuất nháp khỏi danh sách đề nghị
const dismissBadgeProposal = async (req, res, next) => {
  try {
    const result = await badgeCommandService.dismissProposal(
      req.body.proposalId,
      req.user,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Khôi phục đề xuất nháp đã bị loại
const restoreBadgeProposal = async (req, res, next) => {
  try {
    const result = await badgeCommandService.restoreProposal(
      req.body.proposalId,
      req.user,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Cập nhật số huy hiệu và tệp đính kèm quyết định cá nhân
const updateBadgeDecision = async (req, res, next) => {
  try {
    const result = await badgeCommandService.updateBadgeDecision(
      req.params.id,
      req.body,
      req.file,
      req.user,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Nhập đề xuất ngoại tuyến theo cả danh sách
const importProposalsOffline = async (req, res, next) => {
  try {
    const result = await badgeOfflineImportService.importProposalsOffline(
      req.body.proposals,
      req.user,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Ghi nhận hàng loạt quyết định phê duyệt được nhập ngoại tuyến (không qua luồng duyệt online)
const importDecisionsOffline = async (req, res, next) => {
  try {
    const result = await badgeOfflineImportService.importDecisionsOffline(
      req.body.decisions,
      req.user,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBadgeProposals,
  scanBadgeEligibility,
  proposeBadge,
  dismissBadgeProposal,
  restoreBadgeProposal,
  updateBadgeDecision,
  importProposalsOffline,
  importDecisionsOffline,
};
