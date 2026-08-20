const memberHistoryRepository = require("../../repositories/member/memberHistory.repository");
const { STANDARD_RANKS } = require("../../domain/constants/member.constants");
const {
  validateWritePermission,
} = require("../../domain/policies/member.policy");
const {
  deleteFile,
} = require("../../infrastructure/storage/fileStorage.service");
const {
  validateRankHistory,
} = require("../../domain/validators/member.validation");
const decisionRepository = require("../../repositories/decision.repository");
const { resolveQuyetDinh } = require("../decision/decisionResolver.service");
const { saveUploadFile } = require("../files/attachmentUpload.service");

/**
 * Thêm lịch sử thăng phong quân hàm
 * @param {string} memberId - ID của đảng viên
 * @param {object} data - Dữ liệu thăng phong quân hàm
 * @param {object} file - Tệp đính kèm
 * @param {object} user - Thông tin người dùng
 * @returns {Promise<object>} - Lịch sử thăng quân hàm mới tạo
 */
const addRankHistory = async (memberId, data, file, user) => {
  const member = await validateWritePermission(memberId, user);

  // Quyết định phong quân hàm có thể đã tồn tại (nhập số QĐ) hoặc kèm file mới upload —
  // decisionResolver lo việc tìm/tạo bản ghi QuyetDinh tương ứng, ở đây chỉ dùng kết quả.
  const resolved = await resolveQuyetDinh(null, data, file, "THANG_HAM");
  let SoQuyetDinh =
    resolved.SoQuyetDinh || data.SoQuyetDinh || data.decisionNumber;
  let QuyetDinhId = resolved.QuyetDinhId;

  data.decisionNumber = SoQuyetDinh;
  validateRankHistory(STANDARD_RANKS, data);

  // Nếu có quyết định gắn kèm thì lấy ngày hiệu lực theo ngày ban hành QĐ, ưu tiên hơn ngày
  // người dùng tự nhập, để tránh lệch giữa hồ sơ và quyết định gốc.
  let NgayHieuLuc = new Date(data.NgayHieuLuc || data.effectiveDate);
  if (QuyetDinhId) {
    const qd = await decisionRepository.findById(QuyetDinhId);
    if (qd && qd.NgayBanHanh) {
      NgayHieuLuc = qd.NgayBanHanh;
    }
  }

  const history = await memberHistoryRepository.createRankHistory({
    DangVienId: memberId,
    CapBac: data.CapBac || data.rank,
    ChucVu: data.ChucVu,
    DonVi: data.DonVi || data.unit || "",
    NgayHieuLuc,
    SoQuyetDinh: SoQuyetDinh,
    QuyetDinhId,
  });

  return {
    id: history.Id,
    memberId: history.DangVienId,
    rank: history.CapBac,
    ChucVu: history.ChucVu,
    unit: history.DonVi,
    effectiveDate: history.NgayHieuLuc,
    decisionNumber: history.SoQuyetDinh,
    QuyetDinhId: history.QuyetDinhId,
    CreatedAt: history.CreatedAt,
  };
};

/**
 * Cập nhật lịch sử thăng phong quân hàm
 * @param {string} memberId - ID của đảng viên
 * @param {string} rankId - ID của lịch sử thăng phong quân hàm
 * @param {object} data - Dữ liệu thăng phong quân hàm
 * @param {object} file - Tệp đính kèm
 * @param {object} user - Thông tin người dùng
 * @returns {Promise<object>} - Lịch sử thăng quân hàm sau cập nhật
 */
const updateRankHistory = async (memberId, rankId, data, file, user) => {
  const member = await validateWritePermission(memberId, user);
  const oldHistory = await memberHistoryRepository.findRankHistoryById(rankId);
  if (!oldHistory) throw new Error("Không tìm thấy lịch sử quân hàm");
  if (oldHistory.DangVienId !== memberId) {
    throw new Error("Bản ghi quân hàm không thuộc đảng viên này");
  }

  // Cho phép sửa quyết định gắn kèm; nếu không gửi gì mới thì giữ nguyên QĐ cũ.
  const resolved = await resolveQuyetDinh(null, data, file, "THANG_HAM");
  let SoQuyetDinh =
    resolved.SoQuyetDinh ||
    data.SoQuyetDinh ||
    data.decisionNumber ||
    oldHistory.SoQuyetDinh;
  let QuyetDinhId = resolved.QuyetDinhId || oldHistory.QuyetDinhId;

  data.decisionNumber = SoQuyetDinh;
  validateRankHistory(STANDARD_RANKS, data);

  // undefined nghĩa là không đổi ngày hiệu lực hiện có; chỉ tính lại khi có input mới hoặc QĐ mới.
  let NgayHieuLuc =
    data.NgayHieuLuc || data.effectiveDate
      ? new Date(data.NgayHieuLuc || data.effectiveDate)
      : undefined;
  if (QuyetDinhId) {
    const qd = await decisionRepository.findById(QuyetDinhId);
    if (qd && qd.NgayBanHanh) {
      NgayHieuLuc = qd.NgayBanHanh;
    }
  }

  const history = await memberHistoryRepository.updateRankHistory(rankId, {
    CapBac: data.CapBac || data.rank,
    ChucVu: data.ChucVu,
    DonVi: data.DonVi || data.unit || "",
    NgayHieuLuc,
    SoQuyetDinh: SoQuyetDinh,
    QuyetDinhId,
  });

  return {
    id: history.Id,
    memberId: history.DangVienId,
    rank: history.CapBac,
    ChucVu: history.ChucVu,
    unit: history.DonVi,
    effectiveDate: history.NgayHieuLuc,
    decisionNumber: history.SoQuyetDinh,
    QuyetDinhId: history.QuyetDinhId,
    CreatedAt: history.CreatedAt,
  };
};

/**
 * Xóa lịch sử thăng phong quân hàm
 * @param {string} memberId - ID của đảng viên
 * @param {string} rankId - ID của lịch sử thăng phong quân hàm
 * @param {object} user - Thông tin người dùng
 * @returns {Promise<void>}
 */
const deleteRankHistory = async (memberId, rankId, user) => {
  const member = await validateWritePermission(memberId, user);
  const oldHistory = await memberHistoryRepository.findRankHistoryById(rankId);
  if (!oldHistory) throw new Error("Không tìm thấy lịch sử quân hàm");
  if (oldHistory.DangVienId !== memberId) {
    throw new Error("Bản ghi quân hàm không thuộc đảng viên này");
  }

  await memberHistoryRepository.deleteRankHistory(rankId);
};

module.exports = {
  addRankHistory,
  updateRankHistory,
  deleteRankHistory,
};
