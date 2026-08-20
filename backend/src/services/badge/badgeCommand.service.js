const prisma = require("../../infrastructure/database/prisma");
const badgeRepository = require("../../repositories/badge.repository");
const {
  validateWritePermission,
} = require("../../domain/policies/member.policy");
const { resolveQuyetDinh } = require("../decision/decisionResolver.service");
const { ROLES } = require("../../domain/constants/member.constants");

/**
 * Cán bộ tự tay thêm một đề nghị tặng Huy hiệu Đảng cho đảng viên (ngoài các đề nghị
 * do hệ thống tự phát hiện theo mốc năm tuổi Đảng).
 */
const proposeBadge = async (memberId, data, user) => {
  await validateWritePermission(memberId, user);

  if (!data.LoaiDeXuat || !data.MocHuyHieu) {
    throw new Error("Loại đề xuất và mốc Huy hiệu là bắt buộc");
  }

  const moc = parseInt(data.MocHuyHieu, 10);
  if (isNaN(moc)) throw new Error("Mốc Huy hiệu không hợp lệ");

  return prisma.$transaction(async (tx) => {
    // advisory lock theo memberId — nếu 2 request tạo đề nghị cùng lúc cho cùng
    // đảng viên thì request sau phải đợi request trước commit xong mới được check trùng
    const existing = await badgeRepository.lockAndCheckExisting(
      memberId,
      moc,
      ["DRAFT", "PENDING", "APPROVED"],
      tx,
    );
    if (existing) {
      throw new Error(
        `Đã tồn tại đề nghị hoặc quyết định cho mốc ${moc} năm tuổi Đảng.`,
      );
    }

    return badgeRepository.create(
      {
        DangVienId: memberId,
        LoaiDeXuat: data.LoaiDeXuat,
        MocHuyHieu: moc,
        TrangThai: "DRAFT",
        NguoiDeXuatId: user.userId,
      },
      tx,
    );
  });
};

/**
 * Loại một đề nghị nháp khỏi danh sách.
 * Chỉ đổi trạng thái sang DISMISSED chứ không xóa bản ghi, nên vẫn khôi phục lại được sau này.
 * @param {string} proposalId - ID của đề nghị
 * @param {object} user - Thông tin người dùng hiện tại
 * @returns {Promise<object>} - Bản ghi đề nghị sau khi cập nhật
 */
const dismissProposal = async (proposalId, user) => {
  if (!proposalId) throw new Error("ID đề nghị là bắt buộc");

  const proposal = await badgeRepository.findById(proposalId);
  if (!proposal) throw new Error("Không tìm thấy đề nghị");

  await validateWritePermission(proposal.DangVienId, user);

  if (proposal.TrangThai !== "DRAFT") {
    throw new Error("Chỉ có thể xóa đề nghị đang ở trong danh sách (chưa gửi)");
  }

  return badgeRepository.update(proposalId, { TrangThai: "DISMISSED" });
};

/**
 * Khôi phục đề nghị đã loại khỏi danh sách
 * @param {string} proposalId - ID của đề nghị
 * @param {object} user - Thông tin người dùng hiện tại
 * @returns {Promise<object>} - Bản ghi đề nghị sau khi khôi phục
 */
const restoreProposal = async (proposalId, user) => {
  if (!proposalId) throw new Error("ID đề nghị là bắt buộc");

  const proposal = await badgeRepository.findById(proposalId);
  if (!proposal) throw new Error("Không tìm thấy đề nghị");

  await validateWritePermission(proposal.DangVienId, user);

  if (proposal.TrangThai !== "DISMISSED") {
    throw new Error("Chỉ có thể khôi phục đề nghị đã loại khỏi danh sách");
  }

  return badgeRepository.update(proposalId, { TrangThai: "DRAFT" });
};

/**
 * Gắn quyết định trao tặng (số quyết định, ngày ban hành, file scan) và số huy hiệu
 * vào một đề nghị đã có. Cán bộ chính trị được thao tác trên mọi đảng viên; Bí thư
 * vẫn phải qua policy để đảm bảo chỉ sửa được đảng viên chi bộ mình.
 */
const updateBadgeDecision = async (memberId, data, file, user) => {
  if (user.role === ROLES.BI_THU) {
    await validateWritePermission(memberId, user);
  }

  const proposalId = data.ProposalId || data.Id || data.proposalId;
  if (!proposalId) throw new Error("ID đề xuất/quyết định là bắt buộc");

  const proposal = await badgeRepository.findById(proposalId);
  if (!proposal) throw new Error("Không tìm thấy thông tin Huy hiệu");
  if (proposal.DangVienId !== memberId) throw new Error("Đảng viên không khớp");

  const resolved = await resolveQuyetDinh(
    null,
    {
      QuyetDinhId: data.QuyetDinhId || null,
      SoQuyetDinh: data.SoQuyetDinhCaNhan || data.SoQuyetDinh || null,
      TenQuyetDinh: data.TenQuyetDinh || null,
      NgayBanHanh: data.NgayQuyetDinh || null,
    },
    file,
    "HUY_HIEU_DANG",
  );

  let SoQuyetDinhCaNhan =
    resolved.SoQuyetDinh ||
    data.SoQuyetDinhCaNhan ||
    proposal.SoQuyetDinhCaNhan;
  let QuyetDinhId = resolved.QuyetDinhId || proposal.QuyetDinhId;

  const updateData = { QuyetDinhId };
  if (data.SoHuyHieu !== undefined) updateData.SoHuyHieu = data.SoHuyHieu;
  if (data.SoQuyetDinhCaNhan !== undefined)
    updateData.SoQuyetDinhCaNhan = SoQuyetDinhCaNhan;
  if (data.SoQuyetDinhTapThe !== undefined)
    updateData.SoQuyetDinhTapThe = data.SoQuyetDinhTapThe;
  if (data.NgayQuyetDinh !== undefined) {
    updateData.NgayQuyetDinh = data.NgayQuyetDinh
      ? new Date(data.NgayQuyetDinh)
      : null;
  }

  return badgeRepository.update(proposalId, updateData);
};

module.exports = {
  proposeBadge,
  dismissProposal,
  restoreProposal,
  updateBadgeDecision,
};
