const memberRepository = require("../../repositories/member/member.repository");
const orgRepository = require("../../repositories/org.repository");
const {
  ROLES,
  EVALUATION_RANKS,
  EXCELLENT_RANK_THRESHOLD_PCT,
} = require("../../domain/constants/member.constants");
const {
  isEligibleForEvaluation,
} = require("../../domain/utils/evaluationEligibility.util");
const {
  mapMemberEvaluationRow,
} = require("../../domain/mappers/memberEvaluation.mapper");
const { getDescendantOrgIds } = require("../../domain/utils/orgTree");

// Truy vấn/thống kê xếp loại đánh giá đảng viên — không đụng vào dữ liệu, chỉ đọc và tổng hợp.

/**
 * Tính phần trăm làm tròn, trả về 0 nếu mẫu số bằng 0 (khỏi phải check chia-cho-0 ở chỗ gọi).
 * @param {number} count - Tử số
 * @param {number} total - Mẫu số
 * @returns {number} Phần trăm đã làm tròn
 */
const pct = (count, total) =>
  total > 0 ? Math.round((count / total) * 100) : 0;

/**
 * Đếm số đánh giá theo từng mức xếp loại.
 * @param {Array<object>} evaluations - Danh sách bản ghi đánh giá (đã lọc theo năm)
 * @returns {object} Đếm theo từng mức: { xuatSac, tot, hoanThanh, khongHoanThanh }
 */
const countByRank = (evaluations) => {
  const counts = { xuatSac: 0, tot: 0, hoanThanh: 0, khongHoanThanh: 0 };
  evaluations.forEach((e) => {
    if (e.XepLoai === EVALUATION_RANKS.XUAT_SAC) counts.xuatSac++;
    else if (e.XepLoai === EVALUATION_RANKS.TOT) counts.tot++;
    else if (e.XepLoai === EVALUATION_RANKS.HOAN_THANH) counts.hoanThanh++;
    else if (e.XepLoai === EVALUATION_RANKS.KHONG_HOAN_THANH)
      counts.khongHoanThanh++;
  });
  return counts;
};

/**
 * Sinh cảnh báo cơ cấu xếp loại của 1 chi bộ: tỷ lệ Xuất sắc vượt ngưỡng quy định,
 * và còn sót người chưa được xếp loại.
 * @param {object} counts - Đếm theo từng mức xếp loại (từ countByRank)
 * @param {number} totalEligible - Tổng số đảng viên đủ điều kiện đánh giá
 * @param {number} totalEvaluated - Tổng số đảng viên đã có đánh giá
 * @returns {Array<object>} Danh sách cảnh báo { level, message, detail }
 */
const buildWarnings = (counts, totalEligible, totalEvaluated) => {
  const warnings = [];
  const pctXuatSac = pct(counts.xuatSac, totalEvaluated);

  if (pctXuatSac > EXCELLENT_RANK_THRESHOLD_PCT) {
    warnings.push({
      level: "WARNING",
      message: `Tỷ lệ "Hoàn thành Xuất sắc nhiệm vụ" (${pctXuatSac}%) vượt ngưỡng quy định (≤ ${EXCELLENT_RANK_THRESHOLD_PCT}%)`,
      detail: `${counts.xuatSac}/${totalEvaluated} đảng viên được xếp loại Xuất sắc`,
    });
  }
  if (totalEvaluated < totalEligible) {
    warnings.push({
      level: "INFO",
      message: `Còn ${totalEligible - totalEvaluated} đảng viên chưa được xếp loại`,
      detail: `Đã xếp loại ${totalEvaluated}/${totalEligible} đảng viên`,
    });
  }
  return warnings;
};

/**
 * Xác định phạm vi tổ chức mà người dùng được phép xem, có ép theo orgIdFilter nếu hợp lệ.
 * Bí thư chỉ được xem chi bộ mình + các chi bộ con; Cán bộ chính trị xem toàn bộ. Nếu client
 * truyền thêm orgIdFilter thì thu hẹp tiếp trong phạm vi trên — không cho vượt ra ngoài, kể cả
 * khi Bí thư cố tình gửi orgId của đơn vị khác lên.
 * @param {Array<object>} allOrgs - Toàn bộ tổ chức Đảng
 * @param {object} user - Thông tin người dùng (role, orgId)
 * @param {string|undefined} orgIdFilter - ID tổ chức muốn lọc thêm (tùy chọn)
 * @returns {Array<string>} Danh sách ID tổ chức trong phạm vi được phép
 */
const resolveScopeOrgIds = (allOrgs, user, orgIdFilter) => {
  const baseScope =
    user.role === ROLES.BI_THU
      ? getDescendantOrgIds(allOrgs, user.orgId)
      : allOrgs.map((o) => o.Id);

  if (!orgIdFilter || !baseScope.includes(orgIdFilter)) {
    return baseScope;
  }
  const filterScope = getDescendantOrgIds(allOrgs, orgIdFilter);
  return baseScope.filter((id) => filterScope.includes(id));
};

/**
 * Cảnh báo cơ cấu xếp loại của 1 chi bộ trong 1 năm cụ thể (tỷ lệ Xuất sắc quá cao,
 * còn ai chưa được xếp loại...). Dùng cho màn hình chi tiết từng chi bộ.
 * @param {string} orgId - ID chi bộ
 * @param {number|string} year - Năm đánh giá
 * @returns {Promise<object>} Phân phối xếp loại và danh sách cảnh báo
 */
const getEvaluationWarnings = async (orgId, year) => {
  const parsedYear = parseInt(year, 10);
  if (isNaN(parsedYear)) throw new Error("Năm đánh giá không hợp lệ");

  const org = await orgRepository.findById(orgId);
  if (!org) throw new Error("Không tìm thấy tổ chức đảng");

  const members = await memberRepository.findAllWithInclude(
    { ToChucDangId: orgId },
    {
      DanhSachDanhGia: { where: { Nam: parsedYear } },
      ThongTinVaoDang: true,
      LyLichCaNhan: { select: { HoTenDangDung: true } },
    },
  );

  const eligibleMembers = members.filter((m) =>
    isEligibleForEvaluation(m.ThongTinVaoDang?.NgayVaoDang, parsedYear),
  );

  const evaluations = eligibleMembers
    .map((m) => m.DanhSachDanhGia[0])
    .filter(Boolean);
  const totalEvaluated = evaluations.length;
  const counts = countByRank(evaluations);
  const warnings = buildWarnings(
    counts,
    eligibleMembers.length,
    totalEvaluated,
  );

  return {
    orgId,
    orgName: org.Ten,
    year: parsedYear,
    totalMembers: eligibleMembers.length,
    totalEvaluated,
    distribution: {
      xuatSac: {
        count: counts.xuatSac,
        percent: pct(counts.xuatSac, totalEvaluated),
      },
      tot: { count: counts.tot, percent: pct(counts.tot, totalEvaluated) },
      hoanThanh: {
        count: counts.hoanThanh,
        percent: pct(counts.hoanThanh, totalEvaluated),
      },
      khongHoanThanh: {
        count: counts.khongHoanThanh,
        percent: pct(counts.khongHoanThanh, totalEvaluated),
      },
    },
    warnings,
  };
};

/**
 * Suy ra trạng thái hiển thị của cả chi bộ từ trạng thái các đánh giá thành viên bên trong.
 * Ưu tiên: tất cả đã APPROVED thì chi bộ coi như APPROVED; còn 1 cái REJECTED thôi cũng coi
 * cả chi bộ là REJECTED (phải sửa lại rồi nộp lại); còn PENDING thì đang chờ; mặc định DRAFT.
 * @param {Array<object>} evaluations - Đánh giá của các đảng viên đủ điều kiện trong chi bộ
 * @returns {string} DRAFT | PENDING | APPROVED | REJECTED
 */
const resolveOrgStatus = (evaluations) => {
  if (
    evaluations.length > 0 &&
    evaluations.every((e) => e.TrangThai === "APPROVED")
  ) {
    return "APPROVED";
  }
  if (evaluations.some((e) => e.TrangThai === "REJECTED")) {
    return "REJECTED";
  }
  if (evaluations.some((e) => e.TrangThai === "PENDING")) {
    return "PENDING";
  }
  return "DRAFT";
};

/**
 * Tổng hợp toàn bộ tình hình xếp loại đánh giá trong phạm vi người dùng được xem, cho 1 năm:
 * số liệu chung toàn phạm vi + chi tiết từng chi bộ (đảng viên đủ điều kiện, đánh giá, cảnh báo).
 * Đây là API chính cho trang "Xếp loại Đảng viên Hàng năm" — thay hẳn cho việc trước đây
 * frontend tự tải hết đảng viên rồi tự tính lấy.
 * @param {number|string} year - Năm đánh giá
 * @param {string|undefined} orgIdFilter - ID tổ chức muốn lọc thêm (tùy chọn)
 * @param {object} user - Người dùng hiện tại (role, orgId) — dùng để ép phạm vi xem
 * @returns {Promise<object>} { year, totals, organizations }
 */
const getEvaluationOverview = async (year, orgIdFilter, user) => {
  const parsedYear = parseInt(year, 10);
  if (isNaN(parsedYear)) throw new Error("Năm đánh giá không hợp lệ");

  const allOrgs = await orgRepository.findAll();
  const scopeIds = resolveScopeOrgIds(allOrgs, user, orgIdFilter);

  const members = await memberRepository.findAllWithInclude(
    { ToChucDangId: { in: scopeIds } },
    {
      LyLichCaNhan: { select: { HoTenDangDung: true } },
      ThongTinVaoDang: { select: { NgayVaoDang: true } },
      TuyenDungQuanNgu: { select: { CapBac: true } },
      DanhSachDanhGia: {
        where: { Nam: parsedYear },
        include: { QuyetDinh: true },
      },
    },
  );

  const eligibleMembers = members.filter((m) =>
    isEligibleForEvaluation(m.ThongTinVaoDang?.NgayVaoDang, parsedYear),
  );

  // Gom đảng viên về theo từng chi bộ để tính số liệu riêng cho mỗi đơn vị
  const membersByOrg = new Map();
  eligibleMembers.forEach((m) => {
    if (!membersByOrg.has(m.ToChucDangId)) membersByOrg.set(m.ToChucDangId, []);
    membersByOrg.get(m.ToChucDangId).push(m);
  });

  const organizations = allOrgs
    // Chi bộ nào không có đảng viên đủ điều kiện trong năm này thì bỏ qua luôn, không hiện ra
    .filter((org) => membersByOrg.has(org.Id))
    .map((org) => {
      const orgMembers = membersByOrg.get(org.Id);
      const rows = orgMembers.map(mapMemberEvaluationRow);
      const evaluations = rows.map((r) => r.evaluation).filter(Boolean);
      const totalMembers = rows.length;
      const totalEvaluated = evaluations.length;
      const counts = countByRank(evaluations);
      // Lấy đại 1 lý do từ chối để hiện lên card của chi bộ (thường cả chi bộ bị từ chối cùng 1 lý do)
      const commonRejectReason =
        evaluations.map((e) => e.LyDoTuChoi).find(Boolean) || null;

      return {
        id: org.Id,
        name: org.Ten,
        status: resolveOrgStatus(evaluations),
        totalMembers,
        totalEvaluated,
        counts: {
          xuatSac: {
            count: counts.xuatSac,
            percent: pct(counts.xuatSac, totalMembers),
          },
          tot: { count: counts.tot, percent: pct(counts.tot, totalMembers) },
          hoanThanh: {
            count: counts.hoanThanh,
            percent: pct(counts.hoanThanh, totalMembers),
          },
          khongHoanThanh: {
            count: counts.khongHoanThanh,
            percent: pct(counts.khongHoanThanh, totalMembers),
          },
        },
        commonRejectReason,
        warnings: buildWarnings(counts, totalMembers, totalEvaluated),
        members: rows,
      };
    });

  // Cộng dồn lại từ các chi bộ đã tính ở trên, không phải query lại DB
  const totalMembers = eligibleMembers.length;
  const allEvaluations = organizations.flatMap((org) =>
    org.members.map((r) => r.evaluation).filter(Boolean),
  );
  const totalEvaluated = allEvaluations.length;
  const totalCounts = countByRank(allEvaluations);
  const totalPendingApproval = allEvaluations.filter(
    (e) => e.TrangThai === "PENDING",
  ).length;
  const totalUnevaluated =
    totalMembers -
    totalCounts.xuatSac -
    totalCounts.tot -
    totalCounts.hoanThanh -
    totalCounts.khongHoanThanh;

  return {
    year: parsedYear,
    totals: {
      totalMembers,
      totalEvaluated,
      countExcellent: totalCounts.xuatSac,
      countGood: totalCounts.tot,
      countCompleted: totalCounts.hoanThanh,
      countFailed: totalCounts.khongHoanThanh,
      countUnevaluated: totalUnevaluated,
      countPendingApproval: totalPendingApproval,
      pctExcellent: pct(totalCounts.xuatSac, totalMembers),
      pctGood: pct(totalCounts.tot, totalMembers),
      pctCompleted: pct(totalCounts.hoanThanh, totalMembers),
      pctFailed: pct(totalCounts.khongHoanThanh, totalMembers),
      pctUnevaluated: pct(totalUnevaluated, totalMembers),
    },
    organizations,
  };
};

module.exports = { getEvaluationWarnings, getEvaluationOverview };
