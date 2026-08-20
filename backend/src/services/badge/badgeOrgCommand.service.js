const prisma = require("../../infrastructure/database/prisma");
const badgeRepository = require("../../repositories/badge.repository");
const orgRepository = require("../../repositories/org.repository");
const memberRepository = require("../../repositories/member/member.repository");
const { logAction } = require("../../infrastructure/audit/auditLogger");
const { getDescendantOrgIds } = require("../../domain/utils/orgTree");
const { resolveQuyetDinh } = require("../decision/decisionResolver.service");
const { syncBadgeMilestone } = require("./badgeMilestoneSync.service");
const badgeNotificationService = require("./badgeNotification.service");
const { ROLES } = require("../../domain/constants/member.constants");

/**
 * Gom các đề nghị huy hiệu theo trạng thái trong phạm vi 1 tổ chức và các cấp dưới —
 * dùng chung cho cả 3 thao tác nộp/duyệt/từ chối theo lô bên dưới.
 * @param {string} orgId - ID tổ chức
 * @param {string} TrangThai - Trạng thái đề nghị cần lọc
 * @param {number|null} [mocHuyHieu] - Lọc thêm theo mốc huy hiệu (nếu duyệt/từ chối riêng từng mốc)
 * @returns {Promise<{proposals: Array<object>, org: object, scopeIds: Array<string>}>}
 */
const collectProposals = async (orgId, TrangThai, mocHuyHieu = null) => {
  const allOrgs = await orgRepository.findAll();
  const scopeIds = getDescendantOrgIds(allOrgs, orgId);
  const members = await memberRepository.findManyIds({
    ToChucDangId: { in: scopeIds },
  });
  const memberIds = members.map((m) => m.Id);
  const where = {
    DangVienId: { in: memberIds },
    TrangThai,
  };
  const moc = mocHuyHieu !== null && mocHuyHieu !== undefined && mocHuyHieu !== ""
    ? parseInt(mocHuyHieu, 10)
    : null;
  if (moc !== null && !isNaN(moc)) where.MocHuyHieu = moc;
  const proposals = memberIds.length ? await badgeRepository.findMany(where) : [];
  return { proposals, org: allOrgs.find((o) => o.Id === orgId), scopeIds };
};

/**
 * Bí thư gửi hàng loạt đề xuất huy hiệu (đang DRAFT) của đơn vị lên cấp trên duyệt.
 * @param {string} orgId - ID tổ chức
 * @param {object} user - Người thực hiện (phải là Bí thư của đúng tổ chức này)
 * @returns {Promise<{count: number}>} Số đề nghị đã chuyển sang PENDING
 */
const submitOrgBadges = async (orgId, user) => {
  if (user.role !== ROLES.BI_THU) {
    throw new Error("Chỉ Bí thư mới được gửi danh sách đề nghị của tổ chức!");
  }
  const allOrgs = await orgRepository.findAll();
  const myScope = getDescendantOrgIds(allOrgs, user.orgId);
  if (!myScope.includes(orgId)) {
    throw new Error("Bạn không có quyền gửi đề nghị cho tổ chức khác!");
  }

  const { proposals, org } = await collectProposals(orgId, "DRAFT");
  if (proposals.length === 0) {
    throw new Error("Không có đề nghị nào trong danh sách để gửi!");
  }

  const ids = proposals.map((p) => p.Id);
  const result = await badgeRepository.updateMany(
    { Id: { in: ids } },
    { TrangThai: "PENDING", NguoiDeXuatId: user.userId },
  );

  await logAction(
    user.userId,
    "SUBMIT_ORG_BADGES",
    "DE_XUAT_HUY_HIEU",
    orgId,
    null,
    { count: result.count },
  );

  try {
    await badgeNotificationService.notifyOrgSubmitToCanBo({
      senderId: user.userId,
      orgName: org?.Ten,
      count: result.count,
    });
  } catch (err) {
    console.error("[BadgeOrg] Lỗi gửi thông báo:", err.message);
  }

  return { count: result.count };
};

/**
 * Cán bộ chính trị duyệt cả loạt đề nghị đang PENDING của 1 tổ chức, gắn kèm 1 quyết định
 * chung cho toàn bộ đợt duyệt này. Nếu truyền kèm MocHuyHieu thì chỉ duyệt riêng các đề nghị
 * của mốc đó (mỗi mốc huy hiệu duyệt bằng 1 quyết định riêng), không đụng tới mốc khác.
 * @param {string} orgId - ID tổ chức
 * @param {object} data - Thông tin quyết định (dùng lại quyết định có sẵn hoặc tạo mới), có thể kèm MocHuyHieu để duyệt riêng 1 mốc
 * @param {object} file - File quyết định đính kèm (nếu tạo mới)
 * @param {object} user - Người thực hiện (phải là Cán bộ chính trị)
 * @returns {Promise<{count: number}>} Số đề nghị đã chuyển sang APPROVED
 */
const approveOrgBadges = async (orgId, data, file, user) => {
  if (user.role !== ROLES.CAN_BO_CHINH_TRI) {
    throw new Error("Bạn không có quyền phê duyệt trao tặng Huy hiệu Đảng!");
  }

  const { proposals, org } = await collectProposals(orgId, "PENDING", data?.MocHuyHieu);
  if (proposals.length === 0) {
    throw new Error("Không có đề nghị chờ duyệt nào của tổ chức này!");
  }

  let resultCount = 0;

  await prisma.$transaction(async (tx) => {
    const resolved = await resolveQuyetDinh(
      tx,
      {
        QuyetDinhId: data.QuyetDinhId || null,
        SoQuyetDinh: data.SoQuyetDinh || null,
        TenQuyetDinh: data.TenQuyetDinh || null,
        NgayBanHanh: data.NgayBanHanh || null,
      },
      file,
      "HUY_HIEU_DANG",
    );

    const QuyetDinhId = resolved.QuyetDinhId;

    const ids = proposals.map((p) => p.Id);
    const updateResult = await badgeRepository.updateMany(
      { Id: { in: ids } },
      {
        TrangThai: "APPROVED",
        SoQuyetDinhTapThe: resolved.SoQuyetDinh || data.SoQuyetDinh || null,
        NgayQuyetDinh: data.NgayBanHanh
          ? new Date(data.NgayBanHanh)
          : new Date(),
        QuyetDinhId,
        NguoiDuyetId: user.userId,
      },
      tx,
    );

    resultCount = updateResult.count;

    // Đồng bộ mốc huy hiệu vào hồ sơ từng đảng viên (tuần tự để tránh lost-update
    // khi cùng một đảng viên có nhiều mốc huy hiệu được duyệt trong cùng một đợt)
    for (const p of proposals) {
      await syncBadgeMilestone(p.DangVienId, p.MocHuyHieu, tx);
    }
  });

  await logAction(
    user.userId,
    "APPROVE_ORG_BADGES",
    "DE_XUAT_HUY_HIEU",
    orgId,
    null,
    { count: resultCount },
  );

  try {
    await badgeNotificationService.notifyOrgResultToBiThu({
      orgId,
      senderId: user.userId,
      orgName: org?.Ten,
      count: resultCount,
      approved: true,
    });
  } catch (err) {
    console.error("[BadgeOrg] Lỗi gửi thông báo:", err.message);
  }

  return { count: resultCount };
};

/**
 * Cán bộ chính trị từ chối cả loạt đề nghị đang PENDING của 1 tổ chức. Nếu truyền kèm
 * mocHuyHieu thì chỉ từ chối riêng các đề nghị của mốc đó.
 * @param {string} orgId - ID tổ chức
 * @param {string} rejectReason - Lý do từ chối (bắt buộc)
 * @param {object} user - Người thực hiện (phải là Cán bộ chính trị)
 * @param {number|null} [mocHuyHieu] - Mốc huy hiệu cần từ chối riêng (bỏ trống thì từ chối cả tổ chức)
 * @returns {Promise<{count: number}>} Số đề nghị đã chuyển sang REJECTED
 */
const rejectOrgBadges = async (orgId, rejectReason, user, mocHuyHieu = null) => {
  if (user.role !== ROLES.CAN_BO_CHINH_TRI) {
    throw new Error("Bạn không có quyền từ chối phê duyệt Huy hiệu Đảng!");
  }
  if (!rejectReason || rejectReason.trim() === "") {
    throw new Error("Lý do từ chối là bắt buộc");
  }

  const { proposals, org } = await collectProposals(orgId, "PENDING", mocHuyHieu);
  if (proposals.length === 0) {
    throw new Error("Không có đề nghị chờ duyệt nào của tổ chức này!");
  }

  const ids = proposals.map((p) => p.Id);
  const result = await badgeRepository.updateMany(
    { Id: { in: ids } },
    { TrangThai: "REJECTED", LyDoTuChoi: rejectReason },
  );

  await logAction(
    user.userId,
    "REJECT_ORG_BADGES",
    "DE_XUAT_HUY_HIEU",
    orgId,
    null,
    { count: result.count, rejectReason },
  );

  try {
    await badgeNotificationService.notifyOrgResultToBiThu({
      orgId,
      senderId: user.userId,
      orgName: org?.Ten,
      count: result.count,
      approved: false,
      reason: rejectReason,
    });
  } catch (err) {
    console.error("[BadgeOrg] Lỗi gửi thông báo:", err.message);
  }

  return { count: result.count };
};

/**
 * Báo kết quả duyệt/từ chối cho Bí thư từng chi bộ liên quan, khi danh sách đề nghị
 * (đã xử lý xong) trải trên nhiều chi bộ khác nhau (trường hợp duyệt/từ chối theo mốc,
 * gộp chung toàn hệ thống thay vì theo 1 tổ chức).
 * @param {Array<object>} proposals - Danh sách đề nghị đã xử lý (cần có DangVienId)
 * @param {object} user - Người thực hiện
 * @param {boolean} approved - true nếu duyệt, false nếu từ chối
 * @param {string} [rejectReason] - Lý do từ chối (nếu approved = false)
 * @returns {Promise<void>}
 */
const notifyResultByOrg = async (proposals, user, approved, rejectReason) => {
  const allOrgs = await orgRepository.findAll();
  const memberIds = [...new Set(proposals.map((p) => p.DangVienId))];
  const members = await memberRepository.findAllWithInclude(
    { Id: { in: memberIds } },
    {},
  );
  const memberOrgMap = new Map(members.map((m) => [m.Id, m.ToChucDangId]));

  const countByOrg = new Map();
  proposals.forEach((p) => {
    const orgId = memberOrgMap.get(p.DangVienId);
    if (!orgId) return;
    countByOrg.set(orgId, (countByOrg.get(orgId) || 0) + 1);
  });

  for (const [orgId, count] of countByOrg.entries()) {
    const org = allOrgs.find((o) => o.Id === orgId);
    await badgeNotificationService.notifyOrgResultToBiThu({
      orgId,
      senderId: user.userId,
      orgName: org?.Ten,
      count,
      approved,
      reason: rejectReason,
    });
  }
};

/**
 * Cán bộ chính trị duyệt toàn bộ đề nghị đang PENDING của 1 mốc huy hiệu, gộp chung mọi
 * tổ chức Đảng (không tách theo từng chi bộ) — dùng 1 quyết định chung cho cả đợt.
 * @param {number} mocHuyHieu - Mốc huy hiệu cần duyệt
 * @param {object} data - Thông tin quyết định (dùng lại quyết định có sẵn hoặc tạo mới)
 * @param {object} file - File quyết định đính kèm (nếu tạo mới)
 * @param {object} user - Người thực hiện (phải là Cán bộ chính trị)
 * @returns {Promise<{count: number}>} Số đề nghị đã chuyển sang APPROVED
 */
const approveMilestoneBadges = async (mocHuyHieu, data, file, user) => {
  if (user.role !== ROLES.CAN_BO_CHINH_TRI) {
    throw new Error("Bạn không có quyền phê duyệt trao tặng Huy hiệu Đảng!");
  }
  const moc = parseInt(mocHuyHieu, 10);
  if (isNaN(moc)) throw new Error("Mốc Huy hiệu không hợp lệ");

  const proposals = await badgeRepository.findMany({
    MocHuyHieu: moc,
    TrangThai: "PENDING",
  });
  if (proposals.length === 0) {
    throw new Error("Không có đề nghị chờ duyệt nào của mốc này!");
  }

  let resultCount = 0;

  await prisma.$transaction(async (tx) => {
    const resolved = await resolveQuyetDinh(
      tx,
      {
        QuyetDinhId: data.QuyetDinhId || null,
        SoQuyetDinh: data.SoQuyetDinh || null,
        TenQuyetDinh: data.TenQuyetDinh || null,
        NgayBanHanh: data.NgayBanHanh || null,
      },
      file,
      "HUY_HIEU_DANG",
    );

    const QuyetDinhId = resolved.QuyetDinhId;

    const ids = proposals.map((p) => p.Id);
    const updateResult = await badgeRepository.updateMany(
      { Id: { in: ids } },
      {
        TrangThai: "APPROVED",
        SoQuyetDinhTapThe: resolved.SoQuyetDinh || data.SoQuyetDinh || null,
        NgayQuyetDinh: data.NgayBanHanh
          ? new Date(data.NgayBanHanh)
          : new Date(),
        QuyetDinhId,
        NguoiDuyetId: user.userId,
      },
      tx,
    );

    resultCount = updateResult.count;

    for (const p of proposals) {
      await syncBadgeMilestone(p.DangVienId, p.MocHuyHieu, tx);
    }
  });

  await logAction(
    user.userId,
    "APPROVE_MILESTONE_BADGES",
    "DE_XUAT_HUY_HIEU",
    null,
    null,
    { mocHuyHieu: moc, count: resultCount },
  );

  // Đề nghị của mốc này có thể trải nhiều chi bộ khác nhau — gom theo từng chi bộ để
  // báo kết quả đúng cho từng Bí thư liên quan.
  try {
    await notifyResultByOrg(proposals, user, true);
  } catch (err) {
    console.error("[BadgeOrg] Lỗi gửi thông báo:", err.message);
  }

  return { count: resultCount };
};

/**
 * Cán bộ chính trị từ chối toàn bộ đề nghị đang PENDING của 1 mốc huy hiệu, gộp chung
 * mọi tổ chức Đảng.
 * @param {number} mocHuyHieu - Mốc huy hiệu cần từ chối
 * @param {string} rejectReason - Lý do từ chối (bắt buộc)
 * @param {object} user - Người thực hiện (phải là Cán bộ chính trị)
 * @returns {Promise<{count: number}>} Số đề nghị đã chuyển sang REJECTED
 */
const rejectMilestoneBadges = async (mocHuyHieu, rejectReason, user) => {
  if (user.role !== ROLES.CAN_BO_CHINH_TRI) {
    throw new Error("Bạn không có quyền từ chối phê duyệt Huy hiệu Đảng!");
  }
  if (!rejectReason || rejectReason.trim() === "") {
    throw new Error("Lý do từ chối là bắt buộc");
  }
  const moc = parseInt(mocHuyHieu, 10);
  if (isNaN(moc)) throw new Error("Mốc Huy hiệu không hợp lệ");

  const proposals = await badgeRepository.findMany({
    MocHuyHieu: moc,
    TrangThai: "PENDING",
  });
  if (proposals.length === 0) {
    throw new Error("Không có đề nghị chờ duyệt nào của mốc này!");
  }

  const ids = proposals.map((p) => p.Id);
  const result = await badgeRepository.updateMany(
    { Id: { in: ids } },
    { TrangThai: "REJECTED", LyDoTuChoi: rejectReason },
  );

  await logAction(
    user.userId,
    "REJECT_MILESTONE_BADGES",
    "DE_XUAT_HUY_HIEU",
    null,
    null,
    { mocHuyHieu: moc, count: result.count, rejectReason },
  );

  try {
    await notifyResultByOrg(proposals, user, false, rejectReason);
  } catch (err) {
    console.error("[BadgeOrg] Lỗi gửi thông báo:", err.message);
  }

  return { count: result.count };
};

module.exports = {
  submitOrgBadges,
  approveOrgBadges,
  rejectOrgBadges,
  approveMilestoneBadges,
  rejectMilestoneBadges,
};
