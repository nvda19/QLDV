const badgeOrgCommandService = require("../../services/badge/badgeOrgCommand.service");

// Bí thư nộp đề xuất tặng Huy hiệu Đảng cho cả chi bộ
const submitOrgBadges = async (req, res, next) => {
  try {
    const result = await badgeOrgCommandService.submitOrgBadges(req.params.orgId, req.user);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Cán bộ chính trị phê duyệt danh sách đề xuất của chi bộ
const approveOrgBadges = async (req, res, next) => {
  try {
    const result = await badgeOrgCommandService.approveOrgBadges(req.params.orgId, req.body, req.file, req.user);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Cán bộ chính trị từ chối danh sách đề xuất của chi bộ
const rejectOrgBadges = async (req, res, next) => {
  try {
    const result = await badgeOrgCommandService.rejectOrgBadges(req.params.orgId, req.body.rejectReason, req.user, req.body.mocHuyHieu);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Cán bộ chính trị phê duyệt toàn bộ đề nghị của 1 mốc huy hiệu, gộp chung mọi tổ chức Đảng
const approveMilestoneBadges = async (req, res, next) => {
  try {
    const result = await badgeOrgCommandService.approveMilestoneBadges(req.params.mocHuyHieu, req.body, req.file, req.user);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Cán bộ chính trị từ chối toàn bộ đề nghị của 1 mốc huy hiệu, gộp chung mọi tổ chức Đảng
const rejectMilestoneBadges = async (req, res, next) => {
  try {
    const result = await badgeOrgCommandService.rejectMilestoneBadges(req.params.mocHuyHieu, req.body.rejectReason, req.user);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitOrgBadges,
  approveOrgBadges,
  rejectOrgBadges,
  approveMilestoneBadges,
  rejectMilestoneBadges,
};
