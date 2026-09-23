const decisionRepository = require("../../repositories/decision.repository");
const {
  deleteFile,
} = require("../../infrastructure/storage/fileStorage.service");
const { saveUploadFile } = require("../files/attachmentUpload.service");
const {
  mapToFrontend,
  mapListToFrontend,
  mapToDb,
} = require("../../domain/mappers/decision.mapper");
const { ROLES } = require("../../domain/constants/member.constants");
const crypto = require("crypto");

/**
 * Lấy danh sách toàn bộ quyết định
 * @param {object} query - Truy vấn
 * @param {object} [user] - Thông tin người dùng đăng nhập
 * @returns {Promise<Array<object>>} - Danh sách quyết định
 */
const getAllDecisions = async (query = {}, user = null) => {
  const where = {};
  if (query.LoaiQuyetDinh) {
    where.LoaiQuyetDinh = query.LoaiQuyetDinh;
  }
  if (query.loaiQuyetDinh) {
    where.loaiQuyetDinh = query.loaiQuyetDinh;
  }

  // Nếu là Đảng viên, chỉ xem các quyết định liên quan đến bản thân
  if (user && user.role === ROLES.DANG_VIEN) {
    const memberId = user.memberId || user.dangVienId;
    if (!memberId) {
      return [];
    }
    where.OR = [
      { danhGiaDangViens: { some: { dangVienId: memberId } } },
      { lichSuQuanHams: { some: { dangVienId: memberId } } },
      { deXuatHuyHieus: { some: { dangVienId: memberId } } },
      { khenThuongKyLuats: { some: { dangVienId: memberId } } },
    ];
  }

  const decisions = await decisionRepository.findAll(where);
  return mapListToFrontend(decisions);
};

/**
 * Chi tiết quyết định theo ID
 * @param {string} id - ID của quyết định
 * @param {object} [user] - Thông tin người dùng đăng nhập
 * @returns {Promise<object>} - Thông tin quyết định
 */
const getDecisionById = async (id, user = null) => {
  const decision = await decisionRepository.findByIdWithRelations(id);
  if (!decision) {
    throw new Error("Không tìm thấy thông tin quyết định");
  }

  // Đảng viên chỉ được xem quyết định liên quan đến chính mình
  if (user && user.role === ROLES.DANG_VIEN) {
    const memberId = user.memberId || user.dangVienId;
    const isRelated =
      decision.danhGiaDangViens?.some((d) => (d.dangVienId || d.DangVienId) === memberId) ||
      decision.lichSuQuanHams?.some((h) => (h.dangVienId || h.DangVienId) === memberId) ||
      decision.deXuatHuyHieus?.some((x) => (x.dangVienId || x.DangVienId) === memberId) ||
      decision.khenThuongKyLuats?.some((k) => (k.dangVienId || k.DangVienId) === memberId);

    if (!isRelated) {
      const error = new Error("Bạn không có quyền truy cập quyết định này");
      error.statusCode = 403;
      throw error;
    }
  }

  return mapToFrontend(decision);
};

/**
 * Tạo quyết định mới. Số quyết định là duy nhất trên toàn hệ thống nên phải
 * kiểm tra trùng trước khi ghi; sau khi tạo xong sẽ quét lại các bản ghi
 * lịch sử (thăng quân hàm, xếp loại, huy hiệu...) từng ghi Số quyết định này
 * nhưng chưa liên kết được vì lúc đó quyết định chưa tồn tại.
 */
const createDecision = async (payload, file) => {
  const data = mapToDb(payload);
  if (!data.SoQuyetDinh || data.SoQuyetDinh.trim() === "") {
    throw new Error("Số quyết định là bắt buộc");
  }
  if (!data.LoaiQuyetDinh || data.LoaiQuyetDinh.trim() === "") {
    throw new Error("Loại quyết định là bắt buộc");
  }
  if (!data.NgayBanHanh) {
    throw new Error("Ngày ban hành là bắt buộc");
  }

  const existing = await decisionRepository.findByDecisionNumber(data.SoQuyetDinh);
  if (existing) {
    throw new Error(
      `Số quyết định "${data.SoQuyetDinh}" đã tồn tại trên hệ thống.`,
    );
  }

  let TaiLieuUrl = null;
  let TaiLieuName = null;

  if (file) {
    const tempId = crypto.randomUUID();
    const saved = await saveUploadFile(tempId, file);
    TaiLieuUrl = saved.FileUrl;
    TaiLieuName = saved.fileName;
  }

  const decision = await decisionRepository.create({
    SoQuyetDinh: data.SoQuyetDinh,
    TenQuyetDinh: data.TenQuyetDinh || null,
    LoaiQuyetDinh: data.LoaiQuyetDinh,
    NgayBanHanh: new Date(data.NgayBanHanh),
    TaiLieuUrl,
    TaiLieuName,
  });

  await decisionRepository.linkUnlinkedRecords(
    decision.Id,
    decision.SoQuyetDinh,
  );
  return mapToFrontend(decision);
};

/**
 * Cập nhật thông tin quyết định
 * @param {string} id - ID của quyết định
 * @param {object} payload - Dữ liệu cập nhật
 * @param {object} file - Tệp đính kèm mới (nếu có)
 * @returns {Promise<object>} - Thông tin quyết định sau khi cập nhật
 */
const updateDecision = async (id, payload, file) => {
  const data = mapToDb(payload);
  const oldDecision = await decisionRepository.findById(id);
  if (!oldDecision) {
    throw new Error("Không tìm thấy thông tin quyết định");
  }

  if (data.SoQuyetDinh && data.SoQuyetDinh !== oldDecision.SoQuyetDinh) {
    const existing = await decisionRepository.findByDecisionNumber(
      data.SoQuyetDinh,
    );
    if (existing) {
      throw new Error(`Số quyết định "${data.SoQuyetDinh}" đã tồn tại.`);
    }
  }

  let TaiLieuUrl = oldDecision.TaiLieuUrl;
  let TaiLieuName = oldDecision.TaiLieuName;

  if (
    data.deleteAttachment === "true" ||
    data.deleteAttachment === true ||
    file
  ) {
    if (oldDecision.TaiLieuUrl) {
      try {
        await deleteFile(oldDecision.TaiLieuUrl);
      } catch (err) {
        console.error("Lỗi khi xóa file cũ:", err);
      }
    }
    TaiLieuUrl = null;
    TaiLieuName = null;
  }

  if (file) {
    const saved = await saveUploadFile(id, file);
    TaiLieuUrl = saved.FileUrl;
    TaiLieuName = saved.fileName;
  }

  const updated = await decisionRepository.update(id, {
    SoQuyetDinh: data.SoQuyetDinh !== undefined ? data.SoQuyetDinh : undefined,
    TenQuyetDinh:
      data.TenQuyetDinh !== undefined ? data.TenQuyetDinh : undefined,
    LoaiQuyetDinh:
      data.LoaiQuyetDinh !== undefined ? data.LoaiQuyetDinh : undefined,
    NgayBanHanh:
      data.NgayBanHanh !== undefined ? new Date(data.NgayBanHanh) : undefined,
    TaiLieuUrl,
    TaiLieuName,
  });

  // Đổi Số quyết định thì phải gỡ liên kết cũ và tìm lại các bản ghi khớp số mới
  if (data.SoQuyetDinh) {
    await decisionRepository.syncAndLinkRecords(
      updated.Id,
      updated.SoQuyetDinh,
    );
  }

  return mapToFrontend(updated);
};

/**
 * Xóa quyết định
 * @param {string} id - ID của quyết định
 * @returns {Promise<boolean>} - Kết quả xóa
 */
const deleteDecision = async (id) => {
  const decision = await decisionRepository.findById(id);
  if (!decision) {
    throw new Error("Không tìm thấy quyết định");
  }

  if (decision.TaiLieuUrl) {
    try {
      await deleteFile(decision.TaiLieuUrl);
    } catch (err) {
      console.error(err);
    }
  }

  await decisionRepository.remove(id);
  return true;
};

module.exports = {
  getAllDecisions,
  getDecisionById,
  createDecision,
  updateDecision,
  deleteDecision,
};
