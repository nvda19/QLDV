const memberRepository = require("../../repositories/member/member.repository");
const memberPartyRepository = require("../../repositories/member/memberParty.repository");
const { logAction } = require("../../infrastructure/audit/auditLogger");
const orgRepository = require("../../repositories/org.repository");
const notificationService = require("../notification.service");
const { ROLES } = require("../../domain/constants/member.constants");
const { resolveQuyetDinh } = require("../decision/decisionResolver.service");
const { isEligibleForEvaluation } = require("../../domain/utils/evaluationEligibility.util");
const prisma = require("../../infrastructure/database/prisma");

// Các thao tác ghi cho xếp loại đánh giá theo cả chi bộ (nộp / duyệt / từ chối / thu hồi).
// Đọc số liệu, thống kê thì xem evaluationQuery.service.js.

/**
 * Bí thư gửi đề xuất xếp loại của cả chi bộ lên cấp trên duyệt.
 * Trước khi cho gửi phải chắc chắn: mọi đảng viên đủ điều kiện đã có đánh giá nháp,
 * và lý lịch của họ không thiếu thông tin bắt buộc — nếu không sẽ báo lỗi nêu rõ ai còn thiếu gì.
 * @param {string} orgId - ID chi bộ
 * @param {number} year - Năm đánh giá
 * @param {object} user - Người thực hiện (phải là Bí thư của đúng chi bộ này)
 * @returns {Promise<object>} Kết quả cập nhật (số bản ghi chuyển sang PENDING)
 */
const submitOrgEvaluations = async (orgId, year, user) => {
  if (user.role !== ROLES.BI_THU)
    throw new Error("Chỉ Bí thư mới có quyền gửi đề xuất chi bộ!");
  if (user.orgId !== orgId)
    throw new Error("Bạn không có quyền thao tác trên chi bộ khác!");

  const parsedYear = parseInt(year, 10);
  if (isNaN(parsedYear)) throw new Error("Năm đánh giá không hợp lệ");

  const members = await memberRepository.findAllWithInclude(
    {
      ToChucDangId: orgId,
    },
    {
      DanhSachDanhGia: { where: { Nam: parsedYear } },
      ThongTinVaoDang: true,
      LyLichCaNhan: true,
    },
  );

  if (members.length === 0)
    throw new Error("Chi bộ chưa có đảng viên nào để đánh giá!");

  // Đảng viên phải kết nạp tối thiểu 6 tháng mới đủ điều kiện đánh giá
  const eligibleMembers = members.filter((m) =>
    isEligibleForEvaluation(m.ThongTinVaoDang?.NgayVaoDang, parsedYear),
  );

  if (eligibleMembers.length === 0)
    throw new Error(
      `Không có đảng viên đủ điều kiện đánh giá năm ${parsedYear}!`,
    );

  // Rà lý lịch từng người, gom hết chỗ thiếu lại rồi báo 1 lần cho Bí thư biết cần bổ sung gì
  const invalidMembers = [];
  eligibleMembers.forEach((m) => {
    const missing = [];
    if (!m.LyLichCaNhan?.HoTenKhaiSinh && !m.LyLichCaNhan?.HoTenDangDung)
      missing.push("Họ tên");
    if (!m.LyLichCaNhan?.NgaySinh) missing.push("Ngày sinh");
    if (!m.LyLichCaNhan?.GioiTinh) missing.push("Giới tính");
    if (!m.LyLichCaNhan?.QueQuan) missing.push("Quê quán");
    if (!m.LyLichCaNhan?.DanToc) missing.push("Dân tộc");
    if (!m.ThongTinVaoDang?.NgayVaoDang) {
      missing.push("Ngày vào Đảng");
    }

    // Đảng viên dự bị (dưới 12 tháng từ ngày kết nạp) thì chưa bắt buộc phải có Số thẻ và Ngày chính thức
    let isProbationary = true;
    if (m.ThongTinVaoDang && m.ThongTinVaoDang.NgayVaoDang) {
      const joinDate = new Date(m.ThongTinVaoDang.NgayVaoDang);
      const evalDate = new Date(parsedYear, 11, 31);
      const diffMonths =
        (evalDate.getFullYear() - joinDate.getFullYear()) * 12 +
        (evalDate.getMonth() - joinDate.getMonth());
      if (diffMonths >= 12) {
        isProbationary = false;
      }
    }

    if (!isProbationary) {
      if (!m.SoTheDangVien) missing.push("Số thẻ đảng viên");
      if (!m.ThongTinVaoDang?.NgayChinhThuc) missing.push("Ngày chính thức");
    }

    if (missing.length > 0) {
      invalidMembers.push(
        `${m.LyLichCaNhan?.HoTenDangDung || "Đảng viên chưa có tên"} (thiếu: ${missing.join(", ")})`,
      );
    }
  });

  if (invalidMembers.length > 0) {
    const error = new Error(
      `Không thể gửi đề xuất do một số đồng chí chưa hoàn thiện thông tin lý lịch bắt buộc: ${invalidMembers.join("; ")}`,
    );
    error.statusCode = 400;
    throw error;
  }

  // Chưa đánh giá nháp hết cho toàn bộ đảng viên đủ điều kiện thì chưa cho gửi
  const missingMembers = eligibleMembers.filter(
    (m) => m.DanhSachDanhGia.length === 0,
  );
  if (missingMembers.length > 0) {
    const names = missingMembers
      .map((m) => m.LyLichCaNhan?.HoTenDangDung || "Không tên")
      .join(", ");
    throw new Error(`Chưa hoàn thành đánh giá nháp cho các đồng chí: ${names}`);
  }

  // Mọi thứ ổn -> khóa lại và chuyển sang chờ cấp trên duyệt
  const updatedResult = await memberPartyRepository.updateManyEvaluations(
    {
      DangVienId: { in: eligibleMembers.map((m) => m.Id) },
      Nam: parsedYear,
      TrangThai: { in: ["DRAFT", "REJECTED"] },
    },
    {
      TrangThai: "PENDING",
      LyDoTuChoi: null,
    },
  );

  await logAction(
    user.userId,
    "SUBMIT_ORG_EVALUATIONS",
    "DANH_GIA_DANG_VIEN",
    orgId,
    null,
    { year: parsedYear, count: updatedResult.count },
  );

  // Báo cho Cán bộ chính trị biết có đề xuất mới cần xét — lỗi ở bước này không nên làm hỏng cả thao tác nộp
  try {
    const org = await orgRepository.findById(orgId);
    const canBoIds = await notificationService.getAllCanBoChinhTriIds();
    if (canBoIds.length > 0) {
      await notificationService.createBulkNotifications(canBoIds, {
        senderId: user.userId,
        type: "EVALUATION_SUBMITTED",
        title: `${org?.Ten || "Chi bộ"} đã gửi đề xuất xếp loại năm ${parsedYear}`,
        content: `${org?.Ten || "Chi bộ"} đã hoàn thành xếp loại ${updatedResult.count} đảng viên và gửi lên để xét duyệt.`,
        link: "/evaluations",
        Metadata: {
          orgId,
          orgName: org?.Ten,
          year: parsedYear,
          memberCount: updatedResult.count,
        },
      });
    }
  } catch (err) {
    console.error("Lỗi gửi thông báo:", err.message);
  }

  return updatedResult;
};

/**
 * Cán bộ chính trị duyệt toàn bộ đề xuất xếp loại của 1 chi bộ, gắn kèm quyết định
 * (dùng lại quyết định có sẵn hoặc tạo mới, chung cho cả chi bộ trong lần duyệt này).
 * @param {string} orgId - ID chi bộ
 * @param {number} year - Năm đánh giá
 * @param {object} data - Thông tin quyết định (QuyetDinhId có sẵn, hoặc SoQuyetDinh/TenQuyetDinh/NgayBanHanh để tạo mới)
 * @param {object} file - File quyết định đính kèm (nếu tạo mới)
 * @param {object} user - Người thực hiện (phải là Cán bộ chính trị)
 * @returns {Promise<object>} Kết quả cập nhật (số bản ghi chuyển sang APPROVED)
 */
const approveOrgEvaluations = async (orgId, year, data, file, user) => {
  if (user.role !== ROLES.CAN_BO_CHINH_TRI)
    throw new Error("Bạn không có quyền phê duyệt đánh giá chi bộ!");
  const parsedYear = parseInt(year, 10);
  if (isNaN(parsedYear)) throw new Error("Năm đánh giá không hợp lệ");

  const members = await memberRepository.findAllWithInclude(
    { ToChucDangId: orgId },
    {},
  );
  if (members.length === 0) throw new Error("Chi bộ không có đảng viên!");

  let updatedResult;

  await prisma.$transaction(async (tx) => {
    const resolved = await resolveQuyetDinh(
      tx,
      {
        QuyetDinhId: data?.QuyetDinhId || null,
        SoQuyetDinh: data?.SoQuyetDinh || null,
        TenQuyetDinh: data?.TenQuyetDinh || null,
        NgayBanHanh: data?.NgayBanHanh || null,
      },
      file,
      "KHEN_THUONG",
    );

    updatedResult = await memberPartyRepository.updateManyEvaluations(
      {
        DangVienId: { in: members.map((m) => m.Id) },
        Nam: parsedYear,
        TrangThai: "PENDING",
      },
      {
        TrangThai: "APPROVED",
        LyDoTuChoi: null,
        QuyetDinhId: resolved.QuyetDinhId || null,
        SoQuyetDinh: resolved.SoQuyetDinh || null,
      },
      tx,
    );
  });

  await logAction(
    user.userId,
    "APPROVE_ORG_EVALUATIONS",
    "DANH_GIA_DANG_VIEN",
    orgId,
    null,
    { year: parsedYear, count: updatedResult.count },
  );

  try {
    const org = await orgRepository.findById(orgId);
    const biThuIds = await notificationService.getBiThuOfOrg(orgId);
    if (biThuIds.length > 0) {
      await notificationService.createBulkNotifications(biThuIds, {
        senderId: user.userId,
        type: "EVALUATION_APPROVED",
        title: `Đề xuất xếp loại năm ${parsedYear} đã được phê duyệt`,
        content: `Phòng Chính trị đã phê duyệt toàn bộ đề xuất của ${org?.Ten}.`,
        link: "/evaluations",
        Metadata: {
          orgId,
          orgName: org?.Ten,
          year: parsedYear,
          memberCount: updatedResult.count,
        },
      });
    }
  } catch (err) {
    console.error("Lỗi gửi thông báo:", err.message);
  }

  return updatedResult;
};

/**
 * Cán bộ chính trị từ chối cả đề xuất của chi bộ (đang PENDING hoặc đã APPROVED), trả về
 * cho Bí thư sửa lại. Lý do từ chối là bắt buộc, không được để trống.
 * @param {string} orgId - ID chi bộ
 * @param {number} year - Năm đánh giá
 * @param {string} rejectReason - Lý do từ chối
 * @param {object} user - Người thực hiện (phải là Cán bộ chính trị)
 * @returns {Promise<object>} Kết quả cập nhật (số bản ghi chuyển sang REJECTED)
 */
const rejectOrgEvaluations = async (orgId, year, rejectReason, user) => {
  if (user.role !== ROLES.CAN_BO_CHINH_TRI)
    throw new Error("Bạn không có quyền từ chối phê duyệt đánh giá chi bộ!");
  if (!rejectReason || rejectReason.trim() === "")
    throw new Error("Lý do từ chối là bắt buộc");

  const parsedYear = parseInt(year, 10);
  if (isNaN(parsedYear)) throw new Error("Năm đánh giá không hợp lệ");

  const members = await memberRepository.findAllWithInclude(
    { ToChucDangId: orgId },
    {},
  );
  const updatedResult = await memberPartyRepository.updateManyEvaluations(
    {
      DangVienId: { in: members.map((m) => m.Id) },
      Nam: parsedYear,
      TrangThai: { in: ["PENDING", "APPROVED"] },
    },
    {
      TrangThai: "REJECTED",
      LyDoTuChoi: rejectReason,
      QuyetDinhId: null,
      SoQuyetDinh: null,
    },
  );

  await logAction(
    user.userId,
    "REJECT_ORG_EVALUATIONS",
    "DANH_GIA_DANG_VIEN",
    orgId,
    null,
    { year: parsedYear, rejectReason, count: updatedResult.count },
  );

  try {
    const org = await orgRepository.findById(orgId);
    const biThuIds = await notificationService.getBiThuOfOrg(orgId);
    if (biThuIds.length > 0) {
      await notificationService.createBulkNotifications(biThuIds, {
        senderId: user.userId,
        type: "EVALUATION_REJECTED",
        title: `Đề xuất xếp loại năm ${parsedYear} của ${org?.Ten} bị từ chối`,
        content: `Lý do: "${rejectReason}". Vui lòng điều chỉnh lại.`,
        link: "/evaluations",
        Metadata: { orgId, orgName: org?.Ten, year: parsedYear, rejectReason },
      });
    }
  } catch (err) {
    console.error("Lỗi gửi thông báo:", err.message);
  }

  return updatedResult;
};

/**
 * Bí thư rút lại đề xuất đang chờ duyệt, đưa về DRAFT để sửa tiếp.
 * Chỉ được thu hồi khi chưa có ai trong chi bộ được duyệt — đã duyệt rồi thì thôi, không cho rút nữa.
 * @param {string} orgId - ID chi bộ
 * @param {number} year - Năm đánh giá
 * @param {object} user - Người thực hiện (phải là Bí thư của đúng chi bộ này)
 * @returns {Promise<object>} Kết quả cập nhật (số bản ghi chuyển về DRAFT)
 */
const rollbackOrgEvaluations = async (orgId, year, user) => {
  if (user.role !== ROLES.BI_THU)
    throw new Error("Chỉ Bí thư mới có quyền thu hồi đề xuất chi bộ!");
  if (user.orgId !== orgId)
    throw new Error("Bạn không có quyền thao tác trên chi bộ khác!");

  const parsedYear = parseInt(year, 10);
  if (isNaN(parsedYear)) throw new Error("Năm đánh giá không hợp lệ");

  const members = await memberRepository.findAllWithInclude(
    { ToChucDangId: orgId },
    {},
  );

  if (members.length === 0) throw new Error("Chi bộ không có đảng viên!");

  const hasApproved = await memberPartyRepository.countEvaluations({
    DangVienId: { in: members.map((m) => m.Id) },
    Nam: parsedYear,
    TrangThai: "APPROVED",
  });
  if (hasApproved > 0)
    throw new Error(
      "Đề xuất đã được phê duyệt, Bí thư không thể thu hồi. Chỉ có thể thu hồi khi đề xuất đang chờ phê duyệt!",
    );

  const updatedResult = await memberPartyRepository.updateManyEvaluations(
    {
      DangVienId: { in: members.map((m) => m.Id) },
      Nam: parsedYear,
      TrangThai: "PENDING",
    },
    {
      TrangThai: "DRAFT",
      LyDoTuChoi: null,
      QuyetDinhId: null,
      SoQuyetDinh: null,
    },
  );

  if (updatedResult.count === 0)
    throw new Error(
      "Không thể thu hồi: đề xuất đã được phê duyệt/từ chối hoặc không còn ở trạng thái chờ phê duyệt.",
    );

  await logAction(
    user.userId,
    "ROLLBACK_ORG_EVALUATIONS",
    "DANH_GIA_DANG_VIEN",
    orgId,
    null,
    { year: parsedYear, count: updatedResult.count },
  );

  return updatedResult;
};

module.exports = {
  submitOrgEvaluations,
  approveOrgEvaluations,
  rejectOrgEvaluations,
  rollbackOrgEvaluations,
};
