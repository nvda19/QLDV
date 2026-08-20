const memberPartyRepository = require("../../repositories/member/memberParty.repository");
const memberRepository = require("../../repositories/member/member.repository");
const {
  validateWritePermission,
} = require("../../domain/policies/member.policy");
const { resolveQuyetDinh } = require("../decision/decisionResolver.service");
const { saveUploadFile } = require("../files/attachmentUpload.service");
const {
  deleteFile,
} = require("../../infrastructure/storage/fileStorage.service");
const { ROLES } = require("../../domain/constants/member.constants");

// CRUD cho từng bản đánh giá xếp loại của 1 đảng viên.

/**
 * Kiểm tra dữ liệu 1 bản đánh giá xếp loại trước khi lưu — năm hợp lệ, mức xếp loại không bỏ trống.
 * @param {object} data - Dữ liệu đánh giá
 * @param {number} data.year - Năm đánh giá
 * @param {string} data.rank - Mức xếp loại
 * @returns {void}
 */
const validateEvaluation = (data) => {
  if (!data.year) throw new Error("Năm đánh giá là bắt buộc");
  const yr = parseInt(data.year, 10);
  if (isNaN(yr) || yr < 1930 || yr > new Date().getFullYear() + 1) {
    throw new Error("Năm đánh giá không hợp lệ");
  }
  if (!data.rank || data.rank.trim() === "") {
    throw new Error("Mức xếp loại đánh giá là bắt buộc");
  }
};

/**
 * Tạo bản đánh giá nháp đầu tiên cho 1 năm — luôn ở trạng thái DRAFT, Bí thư nộp sau.
 * @param {string} memberId - ID đảng viên
 * @param {object} data - Dữ liệu đánh giá (year, rank, comment, thông tin quyết định nếu có)
 * @param {object} file - File quyết định đính kèm (nếu có)
 * @param {object} user - Người thực hiện thao tác
 * @returns {Promise<object>} Bản đánh giá vừa tạo
 */
const addEvaluation = async (memberId, data, file, user) => {
  const member = await validateWritePermission(memberId, user);
  validateEvaluation(data);

  // Nếu năm nay đảng viên bị kỷ luật (dò trong text KyLuat) thì bắt buộc phải xếp Không hoàn thành,
  // không cho chọn mức khác
  const disciplineInfo = await memberRepository.findRewardDiscipline(memberId);
  if (disciplineInfo && disciplineInfo.KyLuat) {
    const yearStr = parseInt(data.year, 10).toString();
    if (disciplineInfo.KyLuat.includes(yearStr)) {
      if (
        data.rank !== "Không hoàn thành" &&
        data.rank !== "Không hoàn thành nhiệm vụ"
      ) {
        throw new Error(
          `Đảng viên bị kỷ luật trong năm ${yearStr} (thông tin kỷ luật: "${disciplineInfo.KyLuat}"). Bắt buộc phải xếp loại "Không hoàn thành nhiệm vụ".`,
        );
      }
    }
  }

  // Không cho tạo đánh giá của năm cũ hơn/bằng năm đã đánh giá gần nhất — tránh chèn ngược lịch sử
  const lastEval = await memberPartyRepository.findLastEvaluation(memberId);
  if (lastEval) {
    if (parseInt(data.year, 10) <= lastEval.Nam) {
      throw new Error(
        `Năm đánh giá mới (${data.year}) phải lớn hơn năm đánh giá gần nhất (${lastEval.Nam})!`,
      );
    }
  }

  const resolved = await resolveQuyetDinh(null, data, file, "KHEN_THUONG");
  let SoQuyetDinh = resolved.SoQuyetDinh || data.SoQuyetDinh || null;
  let TaiLieuUrl = resolved.TaiLieuUrl;
  let TaiLieuName = resolved.TaiLieuName;
  let QuyetDinhId = resolved.QuyetDinhId;

  const evaluation = await memberPartyRepository.createEvaluation({
    DangVienId: memberId,
    Nam: parseInt(data.year, 10),
    XepLoai: data.rank,
    NhanXet: data.comment || "",
    TrangThai: "DRAFT",
    LyDoTuChoi: null,
    SoQuyetDinh,
    QuyetDinhId,
  });

  return {
    id: evaluation.Id,
    memberId: evaluation.DangVienId,
    year: evaluation.Nam,
    rank: evaluation.XepLoai,
    comment: evaluation.NhanXet,
    status: evaluation.TrangThai,
    rejectReason: evaluation.LyDoTuChoi,
    SoQuyetDinh: evaluation.SoQuyetDinh,
    QuyetDinhId: evaluation.QuyetDinhId,
  };
};

/**
 * Sửa 1 bản đánh giá đã có. Bí thư chỉ sửa được khi còn DRAFT/REJECTED — đã nộp/đã duyệt
 * thì khóa. Cán bộ chính trị thì sửa được cả khi đang PENDING (tự chỉnh trước khi duyệt),
 * và sửa không làm thay đổi trạng thái hiện tại.
 * @param {string} memberId - ID đảng viên
 * @param {string} evalId - ID bản đánh giá cần sửa
 * @param {object} data - Dữ liệu cập nhật
 * @param {object} file - File quyết định đính kèm (nếu có)
 * @param {object} user - Người thực hiện thao tác
 * @returns {Promise<object>} Bản đánh giá sau khi cập nhật
 */
const updateEvaluation = async (memberId, evalId, data, file, user) => {
  const member = await validateWritePermission(memberId, user);
  const oldEval = await memberPartyRepository.findEvaluationById(evalId);
  if (!oldEval) throw new Error("Không tìm thấy thông tin đánh giá xếp loại");
  if (oldEval.DangVienId !== memberId) {
    throw new Error("Bản ghi đánh giá không thuộc đảng viên này");
  }

  if (
    user.role === ROLES.BI_THU &&
    (oldEval.TrangThai === "APPROVED" || oldEval.TrangThai === "PENDING")
  ) {
    throw new Error(
      "Đánh giá đã được phê duyệt hoặc đang chờ duyệt, không thể chỉnh sửa!",
    );
  }

  const evalYear = data.year ? parseInt(data.year, 10) : oldEval.Nam;
  const evalRank = data.rank || oldEval.XepLoai;

  validateEvaluation({
    ...oldEval,
    year: evalYear,
    rank: evalRank,
  });

  // Giống lúc tạo mới: bị kỷ luật năm đó thì bắt buộc Không hoàn thành
  const disciplineInfo = await memberRepository.findRewardDiscipline(memberId);
  if (disciplineInfo && disciplineInfo.KyLuat) {
    const yearStr = evalYear.toString();
    if (disciplineInfo.KyLuat.includes(yearStr)) {
      if (
        evalRank !== "Không hoàn thành" &&
        evalRank !== "Không hoàn thành nhiệm vụ"
      ) {
        throw new Error(
          `Đảng viên bị kỷ luật trong năm ${yearStr} (thông tin kỷ luật: "${disciplineInfo.KyLuat}"). Bắt buộc phải xếp loại "Không hoàn thành nhiệm vụ".`,
        );
      }
    }
  }

  // Bí thư sửa xong thì đưa về DRAFT (phải nộp lại từ đầu); Cán bộ chính trị sửa thì giữ nguyên trạng thái
  const TrangThai = user.role === ROLES.BI_THU ? "DRAFT" : oldEval.TrangThai;
  const LyDoTuChoi = user.role === ROLES.BI_THU ? null : oldEval.LyDoTuChoi;

  const resolved = await resolveQuyetDinh(null, data, file, "KHEN_THUONG");
  let SoQuyetDinh =
    resolved.SoQuyetDinh || data.SoQuyetDinh || oldEval.SoQuyetDinh;
  let TaiLieuUrl = resolved.TaiLieuUrl || oldEval.TaiLieuUrl;
  let TaiLieuName = resolved.TaiLieuName || oldEval.TaiLieuName;
  let QuyetDinhId = resolved.QuyetDinhId || oldEval.QuyetDinhId;

  const evaluation = await memberPartyRepository.updateEvaluation(evalId, {
    Nam: data.year ? parseInt(data.year, 10) : undefined,
    XepLoai: data.rank,
    NhanXet: data.comment !== undefined ? data.comment : undefined,
    TrangThai,
    LyDoTuChoi,
    SoQuyetDinh,
    QuyetDinhId,
  });

  return {
    id: evaluation.Id,
    memberId: evaluation.DangVienId,
    year: evaluation.Nam,
    rank: evaluation.XepLoai,
    comment: evaluation.NhanXet,
    status: evaluation.TrangThai,
    rejectReason: evaluation.LyDoTuChoi,
    SoQuyetDinh: evaluation.SoQuyetDinh,
    QuyetDinhId: evaluation.QuyetDinhId,
  };
};

/**
 * Xóa 1 bản đánh giá — chỉ xóa được khi chưa nộp/chưa duyệt.
 * @param {string} memberId - ID đảng viên
 * @param {string} evalId - ID bản đánh giá cần xóa
 * @param {object} user - Người thực hiện thao tác
 * @returns {Promise<void>}
 */
const deleteEvaluation = async (memberId, evalId, user) => {
  const member = await validateWritePermission(memberId, user);
  const oldEval = await memberPartyRepository.findEvaluationById(evalId);
  if (!oldEval) throw new Error("Không tìm thấy thông tin đánh giá xếp loại");
  if (oldEval.DangVienId !== memberId) {
    throw new Error("Bản ghi đánh giá không thuộc đảng viên này");
  }

  if (
    user.role === ROLES.BI_THU &&
    (oldEval.TrangThai === "APPROVED" || oldEval.TrangThai === "PENDING")
  ) {
    throw new Error(
      "Đánh giá đã được phê duyệt hoặc đang chờ duyệt, không thể xóa!",
    );
  }

  await memberPartyRepository.deleteEvaluation(evalId);
};

/**
 * Duyệt riêng 1 bản đánh giá (khác với duyệt cả chi bộ ở evaluationCommand.service.js).
 * Chỉ duyệt được khi còn PENDING — check bằng updateManyEvaluations với điều kiện where
 * để tránh trường hợp 2 người cùng bấm duyệt 1 lúc (race condition).
 * @param {string} memberId - ID đảng viên
 * @param {string} evalId - ID bản đánh giá cần duyệt
 * @param {object} user - Người thực hiện thao tác
 * @returns {Promise<object>} Bản đánh giá sau khi duyệt
 */
const approveEvaluation = async (memberId, evalId, user) => {
  if (user.role !== ROLES.CAN_BO_CHINH_TRI) {
    throw new Error("Bạn không có quyền phê duyệt đánh giá!");
  }
  const oldEval = await memberPartyRepository.findEvaluationById(evalId);
  if (!oldEval) throw new Error("Không tìm thấy thông tin đánh giá xếp loại");
  if (oldEval.DangVienId !== memberId) {
    throw new Error("Bản ghi đánh giá không thuộc đảng viên này");
  }

  const updated = await memberPartyRepository.updateManyEvaluations(
    { Id: evalId, TrangThai: "PENDING" },
    { TrangThai: "APPROVED", LyDoTuChoi: null },
  );
  if (updated.count === 0)
    throw new Error(
      "Đánh giá không còn ở trạng thái chờ duyệt (có thể đã được xử lý bởi thao tác khác)!",
    );

  const evaluation = await memberPartyRepository.findEvaluationById(evalId);

  return {
    id: evaluation.Id,
    memberId: evaluation.DangVienId,
    year: evaluation.Nam,
    rank: evaluation.XepLoai,
    comment: evaluation.NhanXet,
    status: evaluation.TrangThai,
    rejectReason: evaluation.LyDoTuChoi,
    SoQuyetDinh: evaluation.SoQuyetDinh,
  };
};

/**
 * Từ chối riêng 1 bản đánh giá, kèm lý do — Bí thư sửa lại sau khi bị từ chối.
 * @param {string} memberId - ID đảng viên
 * @param {string} evalId - ID bản đánh giá cần từ chối
 * @param {object} data - Dữ liệu, gồm `rejectReason` bắt buộc
 * @param {object} user - Người thực hiện thao tác
 * @returns {Promise<object>} Bản đánh giá sau khi từ chối
 */
const rejectEvaluation = async (memberId, evalId, data, user) => {
  if (user.role !== ROLES.CAN_BO_CHINH_TRI) {
    throw new Error("Bạn không có quyền từ chối phê duyệt đánh giá!");
  }
  if (!data.rejectReason || data.rejectReason.trim() === "") {
    throw new Error("Lý do từ chối là bắt buộc");
  }
  const oldEval = await memberPartyRepository.findEvaluationById(evalId);
  if (!oldEval) throw new Error("Không tìm thấy thông tin đánh giá xếp loại");
  if (oldEval.DangVienId !== memberId) {
    throw new Error("Bản ghi đánh giá không thuộc đảng viên này");
  }

  const updated = await memberPartyRepository.updateManyEvaluations(
    { Id: evalId, TrangThai: { in: ["PENDING", "APPROVED"] } },
    { TrangThai: "REJECTED", LyDoTuChoi: data.rejectReason },
  );
  if (updated.count === 0)
    throw new Error(
      "Đánh giá không còn ở trạng thái có thể từ chối (có thể đã được xử lý bởi thao tác khác)!",
    );

  const evaluation = await memberPartyRepository.findEvaluationById(evalId);

  return {
    id: evaluation.Id,
    memberId: evaluation.DangVienId,
    year: evaluation.Nam,
    rank: evaluation.XepLoai,
    comment: evaluation.NhanXet,
    status: evaluation.TrangThai,
    rejectReason: evaluation.LyDoTuChoi,
    SoQuyetDinh: evaluation.SoQuyetDinh,
  };
};

module.exports = {
  validateEvaluation,
  addEvaluation,
  updateEvaluation,
  deleteEvaluation,
  approveEvaluation,
  rejectEvaluation,
};
