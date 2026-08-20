const memberAttachmentService = require("../../services/member/memberAttachment.service");

// Tải lên tài liệu scan đính kèm hồ sơ đảng viên
const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) throw new Error("Vui lòng tải lên file tài liệu đính kèm");
    const attachment = await memberAttachmentService.addAttachment(req.params.id, req.file, req.body, req.user);
    res.status(201).json({ success: true, data: attachment });
  } catch (error) {
    next(error);
  }
};

// Xóa tài liệu đính kèm hồ sơ đảng viên
const deleteAttachment = async (req, res, next) => {
  try {
    const result = await memberAttachmentService.deleteAttachment(req.params.id, req.params.attachmentId, req.user);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// Đính kèm bằng cấp scan cho quá trình đào tạo
const uploadTrainingAttachment = async (req, res, next) => {
  try {
    if (!req.file) throw new Error("Vui lòng chọn tệp văn bằng đính kèm");
    const training = await memberAttachmentService.uploadTrainingAttachment(req.params.id, req.params.trainingId, req.file, req.user);
    res.status(200).json({ success: true, data: training });
  } catch (error) {
    next(error);
  }
};

// Gỡ đính kèm bằng cấp của quá trình đào tạo
const deleteTrainingAttachment = async (req, res, next) => {
  try {
    const training = await memberAttachmentService.deleteTrainingAttachment(req.params.id, req.params.trainingId, req.user);
    res.status(200).json({ success: true, data: training });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadAttachment,
  deleteAttachment,
  uploadTrainingAttachment,
  deleteTrainingAttachment,
};
