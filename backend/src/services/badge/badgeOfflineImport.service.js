const badgeRepository = require("../../repositories/badge.repository");
const {
  validateWritePermission,
} = require("../../domain/policies/member.policy");
const { syncBadgeMilestone } = require("./badgeMilestoneSync.service");
const { ROLES } = require("../../domain/constants/member.constants");

/**
 * Import đề nghị huy hiệu từ nguồn ngoại tuyến (đã xử lý thủ công ngoài hệ thống từ trước,
 * giờ nhập lại vào DB cho đồng bộ) — tạo thẳng ở trạng thái PENDING.
 * @param {Array<object>} proposalsArray - Mảng đề nghị cần import
 * @param {object} user - Người thực hiện (phải là Cán bộ chính trị)
 * @returns {Promise<{success: boolean, count: number}>} Số đề nghị đã import
 */
const importProposalsOffline = async (proposalsArray, user) => {
  if (user.role !== ROLES.CAN_BO_CHINH_TRI) {
    throw new Error(
      "Chỉ Cán bộ chính trị mới có quyền nhập đề xuất ngoại tuyến!",
    );
  }
  if (!Array.isArray(proposalsArray)) {
    return { success: true, count: 0 };
  }
  let importCount = 0;

  for (const p of proposalsArray) {
    const memberId = p.DangVienId || p.memberId;
    if (!memberId || !p.LoaiDeXuat || !p.MocHuyHieu) continue;
    const moc = parseInt(p.MocHuyHieu, 10);

    // Bỏ qua nếu đảng viên này đã có đề nghị cho đúng mốc đó rồi, tránh tạo trùng khi import lại
    const existing = await badgeRepository.findFirst({
      DangVienId: memberId,
      MocHuyHieu: moc,
      TrangThai: { in: ["PENDING", "APPROVED"] },
    });

    if (!existing) {
      await badgeRepository.create({
        DangVienId: memberId,
        LoaiDeXuat: p.LoaiDeXuat,
        MocHuyHieu: moc,
        TrangThai: "PENDING",
        NguoiDeXuatId: p.NguoiDeXuatId || user.userId,
      });
      importCount++;
    }
  }

  return { success: true, count: importCount };
};

/**
 * Nhập kết quả đã phê duyệt ngoại tuyến — nếu đề nghị chưa tồn tại thì tạo mới luôn ở
 * trạng thái APPROVED, có rồi thì chỉ update; sau đó đồng bộ mốc huy hiệu vào hồ sơ đảng viên.
 * @param {Array<object>} decisionsArray - Mảng kết quả phê duyệt cần import
 * @param {object} user - Người thực hiện thao tác
 * @returns {Promise<{success: boolean, count: number}>} Số bản ghi đã import
 */
const importDecisionsOffline = async (decisionsArray, user) => {
  if (!Array.isArray(decisionsArray)) {
    return { success: true, count: 0 };
  }
  let importCount = 0;

  for (const d of decisionsArray) {
    const proposalId = d.Id || d.id;
    const memberId = d.DangVienId || d.memberId;
    if (!proposalId || !memberId || !d.MocHuyHieu) continue;

    // Bí thư chỉ được import cho đảng viên chi bộ mình — không đủ quyền thì bỏ qua bản ghi này, import tiếp phần còn lại
    if (user.role === ROLES.BI_THU) {
      try {
        await validateWritePermission(memberId, user);
      } catch {
        continue;
      }
    }

    let proposal = await badgeRepository.findById(proposalId);

    if (!proposal) {
      proposal = await badgeRepository.create({
        Id: proposalId,
        DangVienId: memberId,
        LoaiDeXuat: d.LoaiDeXuat || "CAP_MOI",
        MocHuyHieu: parseInt(d.MocHuyHieu, 10),
        TrangThai: "APPROVED",
        SoHuyHieu: d.SoHuyHieu || null,
        SoQuyetDinhCaNhan: d.SoQuyetDinhCaNhan || null,
        SoQuyetDinhTapThe: d.SoQuyetDinhTapThe || null,
        NgayQuyetDinh: d.NgayQuyetDinh ? new Date(d.NgayQuyetDinh) : new Date(),
        QuyetDinhId: d.QuyetDinhId || null,
        NguoiDuyetId: d.NguoiDuyetId,
      });
      importCount++;
    } else {
      await badgeRepository.update(proposalId, {
        TrangThai: "APPROVED",
        SoHuyHieu: d.SoHuyHieu,
        SoQuyetDinhCaNhan: d.SoQuyetDinhCaNhan,
        SoQuyetDinhTapThe: d.SoQuyetDinhTapThe,
        NgayQuyetDinh: d.NgayQuyetDinh ? new Date(d.NgayQuyetDinh) : new Date(),
        QuyetDinhId: d.QuyetDinhId !== undefined ? d.QuyetDinhId : proposal.QuyetDinhId,
        NguoiDuyetId: d.NguoiDuyetId || proposal.NguoiDuyetId,
      });
      importCount++;
    }

    await syncBadgeMilestone(memberId, d.MocHuyHieu);
  }

  return { success: true, count: importCount };
};

module.exports = {
  importProposalsOffline,
  importDecisionsOffline,
};
