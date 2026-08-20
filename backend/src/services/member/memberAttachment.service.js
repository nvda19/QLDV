const memberHistoryRepository = require("../../repositories/member/memberHistory.repository");
const memberAttachmentRepository = require("../../repositories/member/memberAttachment.repository");
const {
  validateWritePermission,
} = require("../../domain/policies/member.policy");
const {
  deleteFile,
} = require("../../infrastructure/storage/fileStorage.service");
const { saveUploadFile } = require("../files/attachmentUpload.service");

/**
 * Đính kèm bản scan tài liệu gốc (sơ yếu lý lịch, quyết định kết nạp...) vào hồ sơ đảng viên.
 * @param {string} memberId - ID của đảng viên
 * @param {object} file - Tệp đính kèm
 * @param {object} body - Thông tin tài liệu
 * @param {object} user - Thông tin người dùng
 * @returns {Promise<object>} - Kết quả thêm mới
 */
const addAttachment = async (memberId, file, body, user) => {
  await validateWritePermission(memberId, user);

  const saved = await saveUploadFile(memberId, file);

  const attachment = await memberAttachmentRepository.createAttachment({
    DangVienId: memberId,
    TenTaiLieu: body.TenTaiLieu || file.originalname,
    LoaiTaiLieu: body.LoaiTaiLieu || "KHAC",
    FileUrl: saved.FileUrl,
    FileType: saved.FileType,
  });

  return {
    id: attachment.Id,
    memberId: attachment.DangVienId,
    name: attachment.TenTaiLieu,
    type: attachment.LoaiTaiLieu,
    FileUrl: attachment.FileUrl,
    FileType: attachment.FileType,
    CreatedAt: attachment.CreatedAt,
  };
};

/**
 * Xóa tài liệu scan đính kèm hồ sơ gốc
 * @param {string} memberId - ID của đảng viên
 * @param {string} attachmentId - ID của tài liệu đính kèm
 * @param {object} user - Thông tin người dùng
 * @returns {Promise<object>} - Kết quả xóa
 */
const deleteAttachment = async (memberId, attachmentId, user) => {
  await validateWritePermission(memberId, user);

  const attachment =
    await memberAttachmentRepository.findAttachmentByMemberAndId(
      memberId,
      attachmentId,
    );
  if (!attachment) {
    throw new Error("Không tìm thấy tài liệu đính kèm");
  }

  // Xóa file vật lý trước khi xóa bản ghi, tránh rác trên ổ đĩa nếu sau này rollback DB.
  if (attachment.FileUrl) {
    await deleteFile(attachment.FileUrl);
  }

  await memberAttachmentRepository.deleteAttachment(attachmentId);
  return { success: true, message: "Xóa tài liệu đính kèm thành công" };
};

/**
 * Tải lên tệp văn bằng/chứng chỉ đính kèm cho quá trình đào tạo.
 * Lưu ý: mỗi mốc đào tạo chỉ giữ 1 file, nên upload file mới thì phải dọn file cũ trước.
 * @param {string} memberId - ID của đảng viên
 * @param {string} trainingId - ID của quá trình đào tạo
 * @param {object} file - Tệp đính kèm
 * @param {object} user - Thông tin người dùng
 * @returns {Promise<object>} - Kết quả tải lên
 */
const uploadTrainingAttachment = async (memberId, trainingId, file, user) => {
  await validateWritePermission(memberId, user);

  const training = await memberHistoryRepository.findTrainingById(trainingId);
  if (!training) {
    throw new Error("Không tìm thấy quá trình đào tạo");
  }

  if (training.TaiLieuUrl) {
    await deleteFile(training.TaiLieuUrl);
  }

  const saved = await saveUploadFile(memberId, file);

  return memberHistoryRepository.updateTraining(trainingId, {
    TaiLieuUrl: saved.FileUrl,
    TaiLieuName: saved.fileName,
  });
};

/**
 * Gỡ bỏ tệp văn bằng/chứng chỉ đính kèm của quá trình đào tạo
 * @param {string} memberId - ID của đảng viên
 * @param {string} trainingId - ID của quá trình đào tạo
 * @param {object} user - Thông tin người dùng
 * @returns {Promise<object>} - Kết quả xóa
 */
const deleteTrainingAttachment = async (memberId, trainingId, user) => {
  await validateWritePermission(memberId, user);

  const training = await memberHistoryRepository.findTrainingById(trainingId);
  if (!training) {
    throw new Error("Không tìm thấy quá trình đào tạo");
  }

  if (training.TaiLieuUrl) {
    await deleteFile(training.TaiLieuUrl);
  }

  return memberHistoryRepository.updateTraining(trainingId, {
    TaiLieuUrl: null,
    TaiLieuName: null,
  });
};

module.exports = {
  addAttachment,
  deleteAttachment,
  uploadTrainingAttachment,
  deleteTrainingAttachment,
};
