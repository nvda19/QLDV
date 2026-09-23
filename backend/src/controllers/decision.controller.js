const decisionService = require("../services/decision/decision.service");

// Lấy danh sách toàn bộ văn bản quyết định
const getAllDecisions = async (req, res, next) => {
  try {
    const decisions = await decisionService.getAllDecisions(req.query, req.user);
    res.status(200).json({ success: true, data: decisions });
  } catch (error) {
    next(error);
  }
};

// Chi tiết quyết định theo ID
const getDecisionById = async (req, res, next) => {
  try {
    const decision = await decisionService.getDecisionById(req.params.id, req.user);
    res.status(200).json({ success: true, data: decision });
  } catch (error) {
    next(error);
  }
};

// Đăng ký/Tải lên văn bản quyết định mới
const createDecision = async (req, res, next) => {
  try {
    const decision = await decisionService.createDecision(req.body, req.file);
    res.status(201).json({ success: true, data: decision });
  } catch (error) {
    next(error);
  }
};

// Cập nhật thông tin quyết định
const updateDecision = async (req, res, next) => {
  try {
    const decision = await decisionService.updateDecision(req.params.id, req.body, req.file);
    res.status(200).json({ success: true, data: decision });
  } catch (error) {
    next(error);
  }
};

// Xóa văn bản quyết định
const deleteDecision = async (req, res, next) => {
  try {
    await decisionService.deleteDecision(req.params.id);
    res.status(200).json({ success: true, message: "Xóa quyết định thành công" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDecisions,
  getDecisionById,
  createDecision,
  updateDecision,
  deleteDecision
};
