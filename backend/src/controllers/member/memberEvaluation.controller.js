const memberEvaluationService = require("../../services/evaluation/evaluation.service");

// Thêm mới đánh giá xếp loại cá nhân cho đảng viên
const addEvaluation = async (req, res, next) => {
  try {
    const evaluation = await memberEvaluationService.addEvaluation(req.params.id, req.body, req.file, req.user);
    res.status(201).json({ success: true, data: evaluation });
  } catch (error) {
    next(error);
  }
};

// Cập nhật đánh giá xếp loại cá nhân
const updateEvaluation = async (req, res, next) => {
  try {
    const evaluation = await memberEvaluationService.updateEvaluation(
      req.params.id,
      req.params.evalId,
      req.body,
      req.file,
      req.user
    );
    res.status(200).json({ success: true, data: evaluation });
  } catch (error) {
    next(error);
  }
};

// Xóa một bản ghi đánh giá xếp loại
const deleteEvaluation = async (req, res, next) => {
  try {
    await memberEvaluationService.deleteEvaluation(req.params.id, req.params.evalId, req.user);
    res.status(200).json({ success: true, message: "Xóa đánh giá xếp loại thành công" });
  } catch (error) {
    next(error);
  }
};

// Phê duyệt đánh giá cá nhân (Cán bộ chính trị)
const approveEvaluation = async (req, res, next) => {
  try {
    const evaluation = await memberEvaluationService.approveEvaluation(
      req.params.id,
      req.params.evalId,
      req.user
    );
    res.status(200).json({ success: true, data: evaluation });
  } catch (error) {
    next(error);
  }
};

// Từ chối phê duyệt đánh giá cá nhân (Cán bộ chính trị)
const rejectEvaluation = async (req, res, next) => {
  try {
    const evaluation = await memberEvaluationService.rejectEvaluation(
      req.params.id,
      req.params.evalId,
      req.body,
      req.user
    );
    res.status(200).json({ success: true, data: evaluation });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addEvaluation,
  updateEvaluation,
  deleteEvaluation,
  approveEvaluation,
  rejectEvaluation,
};
