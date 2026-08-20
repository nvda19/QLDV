const memberRankService = require("../../services/member/memberRank.service");

// Thêm lịch sử thăng phong quân hàm cho đảng viên
const addRankHistory = async (req, res, next) => {
  try {
    const history = await memberRankService.addRankHistory(req.params.id, req.body, req.file, req.user);
    res.status(201).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

// Cập nhật lịch sử quân hàm của đảng viên
const updateRankHistory = async (req, res, next) => {
  try {
    const history = await memberRankService.updateRankHistory(
      req.params.id,
      req.params.rankId,
      req.body,
      req.file,
      req.user
    );
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

// Xóa một bản ghi lịch sử quân hàm
const deleteRankHistory = async (req, res, next) => {
  try {
    await memberRankService.deleteRankHistory(req.params.id, req.params.rankId, req.user);
    res.status(200).json({ success: true, message: "Xóa lịch sử quân hàm thành công" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addRankHistory,
  updateRankHistory,
  deleteRankHistory,
};
