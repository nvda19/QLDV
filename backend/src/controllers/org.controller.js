const orgService = require("../services/org.service");
const orgEvaluationCommandService = require("../services/evaluation/evaluationCommand.service");
const orgEvaluationQueryService = require("../services/evaluation/evaluationQuery.service");

// Lấy danh sách toàn bộ tổ chức đảng (chi bộ, đảng bộ)
const getAll = async (req, res, next) => {
  try {
    const orgs = await orgService.getAllOrgs();
    res.json({ success: true, data: orgs });
  } catch (error) {
    next(error);
  }
};

// Tạo tổ chức đảng mới
const create = async (req, res, next) => {
  try {
    const org = await orgService.createOrg(req.body, req.user);
    res.status(201).json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
};

// Cập nhật thông tin tổ chức đảng
const update = async (req, res, next) => {
  try {
    const org = await orgService.updateOrg(req.params.id, req.body, req.user);
    res.json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
};

// Xóa tổ chức đảng
const remove = async (req, res, next) => {
  try {
    const result = await orgService.deleteOrg(req.params.id, req.user);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// Bí thư nộp đề xuất xếp loại chi bộ
const submitEvaluations = async (req, res, next) => {
  try {
    const orgId = req.params.id || req.params.orgId;
    const year = req.body.year || req.query.year;
    const result = await orgEvaluationCommandService.submitOrgEvaluations(
      orgId,
      year,
      req.user
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Cán bộ chính trị phê duyệt đề xuất xếp loại chi bộ
const approveEvaluations = async (req, res, next) => {
  try {
    const orgId = req.params.id || req.params.orgId;
    const year = req.body?.year || req.query?.year;
    const result = await orgEvaluationCommandService.approveOrgEvaluations(
      orgId,
      year,
      req.body,
      req.file,
      req.user,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Cán bộ chính trị từ chối đề xuất xếp loại chi bộ
const rejectEvaluations = async (req, res, next) => {
  try {
    const orgId = req.params.id || req.params.orgId;
    const year = req.body.year || req.query.year;
    const result = await orgEvaluationCommandService.rejectOrgEvaluations(
      orgId,
      year,
      req.body.rejectReason,
      req.user
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Lấy cảnh báo kiểm tra tỷ lệ xếp loại chi bộ
const getEvaluationWarnings = async (req, res, next) => {
  try {
    const orgId = req.params.id || req.params.orgId;
    const year = req.query.year;
    const result = await orgEvaluationQueryService.getEvaluationWarnings(
      orgId,
      year
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Bí thư thu hồi (rollback) đề xuất xếp loại chi bộ
const rollbackEvaluations = async (req, res, next) => {
  try {
    const orgId = req.params.id || req.params.orgId;
    const year = req.body.year || req.query.year;
    const result = await orgEvaluationCommandService.rollbackOrgEvaluations(
      orgId,
      year,
      req.user
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Lấy tổng hợp số liệu xếp loại đánh giá đảng viên toàn phạm vi (nhiều tổ chức) theo năm
const getEvaluationOverview = async (req, res, next) => {
  try {
    const { year, orgId } = req.query;
    const result = await orgEvaluationQueryService.getEvaluationOverview(
      year,
      orgId,
      req.user,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  create,
  update,
  remove,
  submitEvaluations,
  approveEvaluations,
  rejectEvaluations,
  getEvaluationWarnings,
  rollbackEvaluations,
  getEvaluationOverview,
};
