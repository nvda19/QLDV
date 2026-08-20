const badgeRepository = require("../../repositories/badge.repository");
const memberRepository = require("../../repositories/member/member.repository");
const orgRepository = require("../../repositories/org.repository");
const userRepository = require("../../repositories/user.repository");
const {
  getEligibleMilestones,
} = require("../../domain/constants/badge.constants");
const { getDescendantOrgIds } = require("../../domain/utils/orgTree");
const { notifyEligibleToBiThu } = require("./badgeNotification.service");
const { ROLES } = require("../../domain/constants/member.constants");

/**
 * Tìm tổ chức có Bí thư phụ trách.
 * Đảng viên có thể thuộc một tổ chức con chưa có Bí thư riêng, nên phải leo dần
 * lên cha cho tới khi gặp tổ chức nào có Bí thư thì dừng — để biết gửi thông báo cho ai.
 * @param {string} orgId - ID của tổ chức
 * @param {Map<string, object>} orgById - Map tổ chức theo ID
 * @param {Set<string>} biThuOrgIds - Set ID tổ chức có Bí thư
 * @returns {string|null} - ID tổ chức có Bí thư hoặc null
 */
const resolveBiThuOrgId = (orgId, orgById, biThuOrgIds) => {
  let cur = orgId;
  const visited = new Set();
  while (cur && !visited.has(cur)) {
    if (biThuOrgIds.has(cur)) return cur;
    visited.add(cur);
    cur = orgById.get(cur)?.ToChucChaId || null;
  }
  return null;
};

/**
 * Rà toàn bộ (hoặc phạm vi chi bộ nếu là Bí thư gọi) đảng viên, so ngày vào Đảng với
 * các mốc huy hiệu để tìm ai vừa đủ niên hạn mà chưa có đề nghị/huy hiệu ở mốc đó,
 * tự tạo đề nghị nháp và gộp báo cho Bí thư phụ trách. Dùng cho cron quét định kỳ
 * lẫn khi cán bộ bấm quét thủ công.
 */
const scanAndNotify = async (user = null) => {
  const now = new Date();
  const allOrgs = await orgRepository.findAll();

  let where = {};
  if (user && user.role === ROLES.BI_THU) {
    where = { ToChucDangId: { in: getDescendantOrgIds(allOrgs, user.orgId) } };
  }

  const members = await memberRepository.findAllWithInclude(where, {
    ThongTinVaoDang: true,
    KhenThuongKyLuat: true,
  });
  if (members.length === 0) return { scanned: 0, suggested: 0 };

  const memberIds = members.map((m) => m.Id);
  const existing = await badgeRepository.findMany(
    { DangVienId: { in: memberIds } },
    { select: { DangVienId: true, MocHuyHieu: true } },
  );
  const handledByMember = new Map();
  existing.forEach((e) => {
    if (!handledByMember.has(e.DangVienId))
      handledByMember.set(e.DangVienId, new Set());
    handledByMember.get(e.DangVienId).add(e.MocHuyHieu);
  });

  const orgById = new Map(allOrgs.map((o) => [o.Id, o]));
  const biThuUsers = await userRepository.findAll({ role: ROLES.BI_THU });
  const biThuOrgIds = new Set(
    biThuUsers.map((u) => u.ToChucDangId).filter(Boolean),
  );

  const drafts = [];
  const casesByBiThuOrg = new Map();

  for (const m of members) {
    const NgayVaoDang = m.ThongTinVaoDang?.NgayVaoDang;
    if (!NgayVaoDang) continue;

    const handled = handledByMember.get(m.Id) || new Set();
    const currentBadge = m.KhenThuongKyLuat?.HuyHieuDang || "";
    const eligible = getEligibleMilestones(
      NgayVaoDang,
      handled,
      currentBadge,
      now,
    );
    if (eligible.length === 0) continue;

    const biThuOrgId =
      resolveBiThuOrgId(m.ToChucDangId, orgById, biThuOrgIds) || m.ToChucDangId;

    for (const e of eligible) {
      drafts.push({
        DangVienId: m.Id,
        LoaiDeXuat: "CAP_MOI",
        MocHuyHieu: e.milestone,
        TrangThai: "DRAFT",
        NguoiDeXuatId: null,
      });
      if (!casesByBiThuOrg.has(biThuOrgId)) casesByBiThuOrg.set(biThuOrgId, []);
      casesByBiThuOrg
        .get(biThuOrgId)
        .push({ DangVienId: m.Id, MocHuyHieu: e.milestone });
    }
  }

  if (drafts.length > 0) {
    await badgeRepository.createMany(drafts);
  }

  // Mỗi Bí thư chỉ nhận một thông báo tổng hợp thay vì bị spam theo từng đảng viên;
  // lỗi gửi thông báo của một Bí thư không được làm hỏng cả lượt quét
  for (const [biThuOrgId, cases] of casesByBiThuOrg.entries()) {
    try {
      await notifyEligibleToBiThu(
        biThuOrgId,
        orgById.get(biThuOrgId)?.Ten,
        cases,
      );
    } catch (err) {
      console.error("[BadgeDetection] Lỗi gửi thông báo:", err.message);
    }
  }

  return { scanned: members.length, suggested: drafts.length };
};

module.exports = { scanAndNotify };
