import { useState, useEffect } from "react";
import {
  FiCheckSquare,
  FiEdit,
  FiTrash2,
  FiSave,
  FiX,
  FiAlertCircle,
  FiThumbsUp,
  FiThumbsDown,
  FiEye,
  FiSend,
  FiLock,
  FiCheckCircle,
} from "../../components/icons";
import toast from "react-hot-toast"; // Thư viện hiển thị thông báo toast (thành công/lỗi)
import { useAuth } from "../../contexts/AuthContext"; // Hook lấy thông tin user đang đăng nhập
import { useConfirm } from "../../contexts/ConfirmContext"; // Hook sử dụng ConfirmModal dùng chung
import { ROLES } from "../../utils/constants"; // Hằng số vai trò: BI_THU, CAN_BO_CHINH_TRI
import memberApi from "../../api/memberApi"; // API xử lý đánh giá từng đảng viên
import orgApi from "../../api/orgApi"; // API xử lý đánh giá theo lô (toàn chi bộ)
import decisionApi from "../../api/decisionApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import GlassSelect from "../../components/common/GlassSelect"; // Component dropdown kiểu glassmorphism
import DecisionFormFields, {
  createDecisionFormState,
  appendDecisionFormData,
} from "../../components/common/DecisionFormFields";
import PageHeader from "../../components/common/PageHeader";
import DecisionPreviewModal from "../../components/common/DecisionPreviewModal";

export default function MemberEvaluationPage() {
  // ====== KHAI BÁO STATE ======

  const { user } = useAuth(); // Lấy thông tin user từ context (userId, role, orgId)
  const { confirm } = useConfirm(); // Hộp thoại xác nhận dùng chung
  const [organizations, setOrganizations] = useState([]); // Danh sách tổ chức đảng (cây phân cấp)
  const [selectedOrgId, setSelectedOrgId] = useState(""); // ID tổ chức đang được lọc hiển thị
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Năm đánh giá đang chọn
  const [loading, setLoading] = useState(true); // Trạng thái loading toàn trang

  // Tổng hợp số liệu xếp loại đánh giá (tổng quan + từng chi bộ) lấy từ backend
  // GET /api/organizations/evaluations/overview — thay cho việc tự tính ở frontend
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  // Bộ lọc trạng thái: ALL (tất cả), UNEVALUATED (chưa đánh giá), EVALUATED (đã đánh giá)
  const [statusFilter, setStatusFilter] = useState("ALL");

  // ====== STATE CHO MODAL CHI TIẾT ĐÁNH GIÁ ======
  const [modalOpen, setModalOpen] = useState(false); // Hiển thị/ẩn modal
  const [modalLoading, setModalLoading] = useState(false); // Loading khi lưu trong modal
  const [evalTargetMember, setEvalTargetMember] = useState(null); // Đảng viên đang xem/sửa trong modal (dòng gọn từ overview)
  // Hồ sơ đầy đủ (kèm toàn bộ lịch sử DanhGiaDangVien) của đảng viên đang mở modal,
  // tải riêng theo yêu cầu (chỉ khi mở modal) để tra cứu đính kèm quyết định của các năm khác
  const [evalTargetDetail, setEvalTargetDetail] = useState(null);
  // Form data trong modal — chứa thông tin đánh giá đang chỉnh sửa
  const [evalForm, setEvalForm] = useState({
    id: null, // null = tạo mới, có giá trị = cập nhật
    year: new Date().getFullYear(),
    rank: "Tốt", // Mức xếp loại mặc định
    comment: "", // Nhận xét của chi bộ
    status: "DRAFT", // Trạng thái hiện tại
    rejectReason: "", // Lý do từ chối (nếu bị REJECTED)
  });

  // ====== STATE CHO LUỒNG TỪ CHỐI TỪNG ĐẢNG VIÊN ======
  const [showRejectForm, setShowRejectForm] = useState(false); // Hiện form nhập lý do từ chối
  const [rejectReason, setRejectReason] = useState(""); // Lý do từ chối cá nhân

  // ====== STATE CHO LUỒNG TỪ CHỐI CẢ CHI BỘ (BATCH) ======
  const [batchRejectOpen, setBatchRejectOpen] = useState(false); // Hiện modal từ chối hàng loạt
  const [batchRejectReason, setBatchRejectReason] = useState(""); // Lý do từ chối cả chi bộ
  const [rejectTargetOrg, setRejectTargetOrg] = useState(null); // Tổ chức đang bị từ chối

  // ====== STATE CHO LUỒNG PHÊ DUYỆT CẢ CHI BỘ (BATCH APPROVE) ======
  const [batchApproveOpen, setBatchApproveOpen] = useState(false);
  const [approveTargetOrg, setApproveTargetOrg] = useState(null);
  const [batchApproveSubmitting, setBatchApproveSubmitting] = useState(false);
  // Form quyết định trong modal phê duyệt
  const [baDecisionForm, setBaDecisionForm] = useState(createDecisionFormState());
  const [baExistingDecisions, setBaExistingDecisions] = useState([]);

  // ====== STATE CHO QUYẾT ĐỊNH ======
  const [existingDecisions, setExistingDecisions] = useState([]);
  const [isExistingDecision, setIsExistingDecision] = useState(false);
  const [quyetDinhId, setQuyetDinhId] = useState('');
  const [soQuyetDinh, setSoQuyetDinh] = useState('');
  const [tenQuyetDinh, setTenQuyetDinh] = useState('');
  const [ngayBanHanh, setNgayBanHanh] = useState('');
  const [decisionFile, setDecisionFile] = useState(null);
  const [deleteAttachment, setDeleteAttachment] = useState(false);

  const [previewDecisionId, setPreviewDecisionId] = useState(null);
  const [previewDecision, setPreviewDecision] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Xác định user hiện tại có phải Bí thư không (ảnh hưởng toàn bộ giao diện)
  const isBiThu = user?.role === ROLES.BI_THU;

  // Lưu trữ nhận xét tạm thời trên giao diện (chưa gửi API) — key là memberId
  // Dùng để tránh mất nội dung đang gõ khi component re-render
  const [localComments, setLocalComments] = useState({});

  // Reset nhận xét tạm khi đổi năm đánh giá (vì dữ liệu nhận xét theo năm)
  useEffect(() => {
    setLocalComments({});
  }, [selectedYear]);

  // ====== HOOKS KHỞI TẠO DỮ LIỆU ======

  // Tải dữ liệu ban đầu khi component mount lần đầu
  useEffect(() => {
    fetchData();
  }, []);

  // Bí thư bị khóa cứng vào chi bộ của mình, không được chọn chi bộ khác
  useEffect(() => {
    if (isBiThu && user?.orgId) {
      setSelectedOrgId(user.orgId);
    }
  }, [user, isBiThu]);

  // Khi mở modal phê duyệt → tải danh sách quyết định loại KHEN_THUONG để người dùng chọn
  useEffect(() => {
    if (batchApproveOpen) {
      decisionApi.getAll({ loaiQuyetDinh: 'KHEN_THUONG' })
        .then((res) => setBaExistingDecisions(res.data || []))
        .catch(() => setBaExistingDecisions([]));
    }
  }, [batchApproveOpen]);

  /**
   * fetchOverview - Tải tổng hợp số liệu xếp loại đánh giá (tổng quan + từng chi bộ)
   * từ backend. Chỉ phụ thuộc năm/tổ chức lọc — không cần tải lại organizations/decisions.
   */
  const fetchOverview = async () => {
    try {
      setOverviewLoading(true);
      const res = await orgApi.getEvaluationOverview(
        selectedYear,
        selectedOrgId || undefined,
      );
      setOverview(res.data || null);
    } catch (err) {
      toast.error("Không thể tải số liệu xếp loại đánh giá.");
    } finally {
      setOverviewLoading(false);
    }
  };

  // Mỗi khi đổi năm hoặc tổ chức lọc → tải lại tổng hợp số liệu từ backend
  useEffect(() => {
    fetchOverview();
  }, [selectedYear, selectedOrgId]);

  // ====== CÁC HÀM XỬ LÝ NGHIỆP VỤ HÀNG LOẠT (BATCH) ======

  /**
   * handleBatchSubmit - BÍ THƯ nộp toàn bộ đề xuất xếp loại của chi bộ lên cấp trên
   * Chuyển trạng thái: DRAFT/REJECTED → PENDING (khóa chỉnh sửa)
   * @param {string|null} orgId - ID chi bộ (null = dùng selectedOrgId hiện tại)
   */
  const handleBatchSubmit = async (orgId = null) => {
    const targetOrgId = orgId || selectedOrgId;
    if (!targetOrgId) return;
    const orgName =
      organizations.find((o) => o.id === targetOrgId)?.name || "Chi bộ";
    
    // Hiện hộp thoại xác nhận trước khi nộp (hành động không thể hoàn tác dễ dàng)
    const isConfirmed = await confirm({
      title: "Gửi đề xuất xếp loại",
      message: `Đồng chí có chắc chắn muốn gửi toàn bộ đề xuất xếp loại năm ${selectedYear} của ${orgName} lên cấp trên xét duyệt? Sau khi gửi, hồ sơ sẽ bị khóa.`,
      confirmText: "Gửi đề xuất",
      variant: "primary",
    });
    if (!isConfirmed) return;

    setLoading(true);
    try {
      // POST /api/organizations/:id/evaluations/submit → chuyển tất cả DRAFT→PENDING
      await orgApi.submitEvaluations(targetOrgId, { year: selectedYear });
      toast.success(
        `Đã gửi toàn bộ đề xuất xếp loại của ${orgName} lên cấp trên thành công.`,
      );
      await fetchData(); // Reload dữ liệu để cập nhật trạng thái mới
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể gửi đề xuất.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * handleBatchRollback - BÍ THƯ thu hồi báo cáo xếp loại về DRAFT để chỉnh sửa
   * @param {string|null} orgId - ID chi bộ
   */
  const handleBatchRollback = async (orgId = null) => {
    const targetOrgId = orgId || selectedOrgId;
    if (!targetOrgId) return;
    const orgName =
      organizations.find((o) => o.id === targetOrgId)?.name || "Chi bộ";

    const isConfirmed = await confirm({
      title: "Thu hồi đề xuất xếp loại",
      message: `Đồng chí có chắc chắn muốn thu hồi toàn bộ báo cáo xếp loại năm ${selectedYear} của ${orgName}? Sau khi thu hồi, báo cáo sẽ trở về trạng thái Nháp để đồng chí có thể chỉnh sửa lại.`,
      confirmText: "Thu hồi",
      variant: "warning",
    });
    if (!isConfirmed) return;

    setLoading(true);
    try {
      await orgApi.rollbackEvaluations(targetOrgId, { year: selectedYear });
      toast.success(`Đã thu hồi báo cáo xếp loại của ${orgName} về trạng thái Nháp thành công.`);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể thu hồi báo cáo.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * handleBatchApprove - Mở modal phê duyệt (có form quyết định) thay vì gọi API trực tiếp
   */
  const handleBatchApprove = (orgId = null) => {
    const targetOrgId = orgId || selectedOrgId;
    if (!targetOrgId) return;
    const org = organizations.find((o) => o.id === targetOrgId);
    setApproveTargetOrg(org || { id: targetOrgId, name: "Chi bộ" });
    setBaDecisionForm(createDecisionFormState());
    setBatchApproveOpen(true);
  };

  /**
   * handleBatchApproveSubmit - Gửi phê duyệt kèm quyết định lên server
   */
  const handleBatchApproveSubmit = async (e) => {
    e.preventDefault();
    if (!approveTargetOrg) return;

    const fd = new FormData();
    fd.append("year", selectedYear);
    appendDecisionFormData(fd, baDecisionForm);

    setBatchApproveSubmitting(true);
    try {
      await orgApi.approveEvaluations(approveTargetOrg.id, fd);
      toast.success(`Đã phê duyệt xếp loại đánh giá của ${approveTargetOrg.name} thành công.`);
      setBatchApproveOpen(false);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể phê duyệt.");
    } finally {
      setBatchApproveSubmitting(false);
    }
  };

  /**
   * handleBatchReject - CÁN BỘ CHÍNH TRỊ từ chối toàn bộ đề xuất của chi bộ
   * Chuyển trạng thái: PENDING → REJECTED (kèm lý do, trả về cho Bí thư sửa lại)
   * Được gọi khi submit form trong modal "Từ chối phê duyệt Chi bộ"
   */
  const handleBatchReject = async (e) => {
    e.preventDefault(); // Ngăn form submit mặc định reload trang
    const targetOrgId = rejectTargetOrg?.id;
    if (!targetOrgId) return;
    if (!batchRejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }
    const orgName = rejectTargetOrg?.name || "Chi bộ";

    setLoading(true);
    try {
      // POST /api/organizations/:id/evaluations/reject → chuyển tất cả PENDING→REJECTED
      await orgApi.rejectEvaluations(targetOrgId, {
        year: selectedYear,
        rejectReason: batchRejectReason, // Lý do từ chối bắt buộc phải có
      });
      toast.success(`Đã từ chối phê duyệt đề xuất xếp loại của ${orgName}.`);
      // Reset state modal từ chối
      setBatchRejectOpen(false);
      setBatchRejectReason("");
      setRejectTargetOrg(null);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể từ chối.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * fetchData - Tải danh sách tổ chức + quyết định tham chiếu, và tải lại tổng hợp
   * số liệu xếp loại đánh giá (overview) — gọi lại sau mỗi thao tác ghi để đồng bộ hiển thị.
   * Gọi song song các API (Promise.all) để tối ưu tốc độ.
   * @param {boolean} silent - true = không hiện loading spinner (dùng khi refresh ngầm sau action)
   */
  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [orgsRes, decisionsRes] = await Promise.all([
        orgApi.getAll(), // GET /api/organizations → trả về cây tổ chức
        decisionApi.getAll({ loaiQuyetDinh: 'KHEN_THUONG' }),
        fetchOverview(), // Tải lại tổng hợp số liệu xếp loại đánh giá song song
      ]);
      setOrganizations(orgsRes.data || []);
      setExistingDecisions(decisionsRes.data || []);
      // fetchOverview() đã tự setOverview bên trong, không cần xử lý kết quả ở đây
    } catch {
      toast.error("Không thể tải danh sách dữ liệu đánh giá.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // ====== CÁC HÀM XỬ LÝ ĐÁNH GIÁ CÁ NHÂN (INLINE TRÊN BẢNG) ======

  /**
   * handleSelectRank - Xử lý khi BÍ THƯ chọn xếp loại từ dropdown trên bảng
   * 3 trường hợp:
   *  1. Đã có đánh giá + chọn "Trống" → Xóa đánh giá (chỉ khi chưa duyệt)
   *  2. Đã có đánh giá + chọn mức mới → Cập nhật mức xếp loại
   *  3. Chưa có đánh giá + chọn mức → Tạo mới đánh giá DRAFT
   * @param {object} member - Dòng đảng viên từ overview (Id, HoTenDangDung, evaluation)
   * @param {string} rank - Mức xếp loại được chọn ("NONE" = xóa)
   */
  const handleSelectRank = async (member, rank) => {
    const ev = member.evaluation; // Đánh giá năm hiện tại (đã có sẵn từ overview)

    try {
      if (ev) {
        // ĐÃ CÓ đánh giá cho năm này
        if (!rank || rank === "NONE") {
          // Chọn trống = yêu cầu xóa đánh giá
          if (ev.TrangThai === "APPROVED" || ev.TrangThai === "PENDING") {
            toast.error(
              "Đánh giá đã được phê duyệt hoặc đang chờ duyệt, không thể xóa!",
            );
            return;
          }
          const isConfirmed = await confirm({
            title: "Xóa xếp loại Đảng viên",
            message: `Bạn có chắc chắn muốn xóa xếp loại năm ${selectedYear} của đồng chí ${member.HoTenDangDung}?`,
            confirmText: "Xóa",
            variant: "danger",
          });
          if (isConfirmed) {
            await memberApi.deleteEvaluation(member.Id, ev.Id); // DELETE /api/members/:id/evaluations/:evalId
            toast.success(`Đã xóa xếp loại của đồng chí ${member.HoTenDangDung}`);
            await fetchData(true); // Refresh ngầm (silent=true, không hiện loading spinner)
          }
        } else {
          // Cập nhật sang mức xếp loại mới
          await memberApi.updateEvaluation(member.Id, ev.Id, {
            year: selectedYear,
            rank: rank,
            comment: ev.NhanXet || "", // Giữ nguyên nhận xét cũ
          });
          toast.success(`Đã cập nhật xếp loại cho đồng chí ${member.HoTenDangDung}`);
          await fetchData(true);
        }
      } else {
        // CHƯA CÓ đánh giá → tạo mới bản nháp (DRAFT)
        if (!rank || rank === "NONE") return; // Bỏ qua nếu chọn trống khi chưa có gì
        await memberApi.addEvaluation(member.Id, {
          year: selectedYear,
          rank: rank,
          comment: "", // Nhận xét để trống, Bí thư sẽ nhập sau
        });
        toast.success(`Đã thiết lập xếp loại cho đồng chí ${member.HoTenDangDung}`);
        await fetchData(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể lưu xếp loại.");
      await fetchData(true); // Refresh để đồng bộ lại dữ liệu nếu lỗi
    }
  };

  /**
   * handleCommentBlur - Lưu nhận xét khi input mất focus (onBlur)
   * Nếu chưa có đánh giá, tự động tạo mới với xếp loại mặc định "Tốt"
   * Cách này cho phép Bí thư gõ nhận xét trước rồi chọn xếp loại sau
   * @param {object} member - Dòng đảng viên từ overview (Id, HoTenDangDung, evaluation)
   * @param {string} comment - Nội dung nhận xét mới
   */
  const handleCommentBlur = async (member, comment) => {
    const ev = member.evaluation; // Đánh giá năm hiện tại (đã có sẵn từ overview)
    const oldComment = ev?.NhanXet || "";
    if (comment === oldComment) return; // Không thay đổi → bỏ qua, tránh gọi API thừa

    try {
      if (ev) {
        // Đã có đánh giá → cập nhật nhận xét, giữ nguyên mức xếp loại
        await memberApi.updateEvaluation(member.Id, ev.Id, {
          year: selectedYear,
          rank: ev.XepLoai, // Giữ nguyên xếp loại cũ
          comment: comment,
        });
        toast.success(`Đã cập nhật nhận xét cho đồng chí ${member.HoTenDangDung}`);
        await fetchData(true);
      } else {
        if (!comment.trim()) return; // Không tạo đánh giá nếu nhận xét trống
        // Chưa có đánh giá → tự động tạo mới với xếp loại mặc định "Tốt"
        await memberApi.addEvaluation(member.Id, {
          year: selectedYear,
          rank: "Tốt", // Mặc định = Tốt, Bí thư có thể đổi sau
          comment: comment,
        });
        toast.success(
          `Đã tự động đặt xếp loại 'Tốt' và lưu nhận xét cho đồng chí ${member.HoTenDangDung}`,
        );
        await fetchData(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể lưu nhận xét.");
      await fetchData(true);
    }
  };

  /**
   * getEvaluationForYear - Tìm bản ghi đánh giá của đảng viên cho năm cụ thể
   * Dữ liệu evaluations[] đã được nhúng sẵn trong mỗi member object từ API getAll()
   * @returns {Object|null} - Bản ghi đánh giá hoặc null nếu chưa có
   */
  const getEvaluationForYear = (member, year) => {
    const evals = member.DanhGiaDangVien || [];
    return (
      evals.find((e) => parseInt(e.Nam, 10) === parseInt(year, 10)) || null
    );
  };

  // ====== SỐ LIỆU HIỂN THỊ — LẤY TỪ overview (backend), KHÔNG TỰ TÍNH Ở FRONTEND ======

  // Tổng quan toàn phạm vi (đã được backend tính sẵn theo năm/tổ chức đang lọc)
  const totals = overview?.totals || {
    totalMembers: 0,
    totalEvaluated: 0,
    countExcellent: 0,
    countGood: 0,
    countCompleted: 0,
    countFailed: 0,
    countUnevaluated: 0,
    countPendingApproval: 0,
    pctExcellent: 0,
    pctGood: 0,
    pctCompleted: 0,
    pctFailed: 0,
    pctUnevaluated: 0,
  };
  // Tách sẵn từng trường để JSX bên dưới đọc trực tiếp (giữ nguyên tên như trước khi refactor)
  const {
    totalMembers,
    countExcellent,
    countGood,
    countCompleted,
    countFailed,
    countUnevaluated,
    countPendingApproval,
    pctExcellent,
    pctGood,
    pctCompleted,
    pctFailed,
    pctUnevaluated,
  } = totals;

  /**
   * filterMembersByStatus - Lọc dòng đảng viên (đã tải sẵn từ overview) theo trạng thái
   * đánh giá đang chọn ở dropdown. Đây là lọc hiển thị trên dữ liệu đã có, không phải phép
   * tính thống kê, nên xử lý ngay ở client để đổi bộ lọc không cần gọi lại API.
   * @param {Array<object>} rows - Danh sách dòng đảng viên của 1 chi bộ (overview.organizations[].members)
   * @returns {Array<object>} - Danh sách đã lọc theo statusFilter
   */
  const filterMembersByStatus = (rows) =>
    rows.filter((m) => {
      if (statusFilter === "UNEVALUATED") return m.evaluation === null;
      if (statusFilter === "EVALUATED") return m.evaluation !== null;
      return true;
    });

  // Danh sách chi bộ cần hiển thị (đã lọc theo phạm vi + có đảng viên đủ điều kiện, do backend trả về)
  const displayOrgs = overview?.organizations || [];

  const handlePreviewDecisionClick = (ev, member) => {
    if (ev.QuyetDinhId) {
      setPreviewDecisionId(ev.QuyetDinhId);
      setPreviewDecision(null);
      setPreviewModalOpen(true);
    } else {
      setPreviewDecision({
        soQuyetDinh: ev.SoQuyetDinh || 'Chưa có',
        tenQuyetDinh: ev.QuyetDinh?.TenQuyetDinh || `Quyết định xếp loại đảng viên năm ${ev.Nam} cho đ/c ${member?.HoTenDangDung || ''}`,
        loaiQuyetDinh: 'KHEN_THUONG',
        ngayBanHanh: ev.QuyetDinh?.NgayBanHanh || `${ev.Nam}-12-31`,
        taiLieuUrl: ev.QuyetDinh?.TaiLieuUrl || ev.TaiLieuUrl,
        taiLieuName: ev.QuyetDinh?.TaiLieuName || ev.TaiLieuName
      });
      setPreviewDecisionId(null);
      setPreviewModalOpen(true);
    }
  };

  /**
   * openEvaluationModal - Mở modal xem/sửa đánh giá xếp loại của 1 đảng viên
   * `member` là dòng gọn từ overview (Id, HoTenDangDung, evaluation của selectedYear).
   * Đồng thời tải riêng hồ sơ đầy đủ (toàn bộ lịch sử DanhGiaDangVien) để phục vụ
   * tra cứu đính kèm quyết định khi người dùng đổi "Năm đánh giá" sang năm khác trong modal.
   * @param {object} member - Dòng đảng viên từ overview
   */
  const openEvaluationModal = async (member) => {
    const ev = member.evaluation; // Đánh giá năm hiện tại (đã có sẵn từ overview)
    setEvalTargetMember(member);
    setEvalTargetDetail(null);
    setShowRejectForm(false);
    setRejectReason("");
    setDecisionFile(null);
    setDeleteAttachment(false);

    if (ev) {
      setEvalForm({
        id: ev.Id,
        year: parseInt(ev.Nam, 10),
        rank: ev.XepLoai,
        comment: ev.NhanXet || "",
        status: ev.TrangThai || "DRAFT",
        rejectReason: ev.LyDoTuChoi || "",
      });
      setQuyetDinhId(ev.QuyetDinhId || "");
      setSoQuyetDinh(ev.SoQuyetDinh || "");
      setIsExistingDecision(!!ev.QuyetDinhId);
      setTenQuyetDinh("");
      setNgayBanHanh("");
    } else {
      setEvalForm({
        id: null,
        year: parseInt(selectedYear, 10),
        rank: "Tốt",
        comment: "",
        status: "DRAFT",
        rejectReason: "",
      });
      setQuyetDinhId("");
      setSoQuyetDinh("");
      setIsExistingDecision(false);
      setTenQuyetDinh("");
      setNgayBanHanh("");
    }
    setModalOpen(true);

    try {
      const res = await memberApi.getById(member.Id);
      setEvalTargetDetail(res.data);
    } catch (err) {
      // Chỉ ảnh hưởng tra cứu đính kèm quyết định của năm khác trong modal, không chặn luồng chính
      console.error("Không thể tải hồ sơ chi tiết đảng viên:", err);
    }
  };

  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    if (!evalTargetMember) return;

    setModalLoading(true);
    const formData = new FormData();
    formData.append("year", evalForm.year);
    formData.append("rank", evalForm.rank);
    formData.append("comment", evalForm.comment);

    if (isExistingDecision) {
      formData.append("quyetDinhId", quyetDinhId);
    } else {
      formData.append("soQuyetDinh", soQuyetDinh);
      formData.append("tenQuyetDinh", tenQuyetDinh);
      if (ngayBanHanh) formData.append("ngayBanHanh", ngayBanHanh);
      if (decisionFile) {
        formData.append("file", decisionFile);
      }
      if (deleteAttachment) {
        formData.append("deleteAttachment", true);
      }
    }

    try {
      if (evalForm.id) {
        // Bí thư hoặc Cán bộ chính trị cập nhật xếp loại nháp
        await memberApi.updateEvaluation(evalTargetMember.Id, evalForm.id, formData);
        toast.success(
          `Cập nhật đánh giá nháp năm ${evalForm.year} thành công.`,
        );
      } else {
        // Tạo mới nháp
        await memberApi.addEvaluation(evalTargetMember.Id, formData);
        toast.success(`Lập đánh giá nháp năm ${evalForm.year} thành công.`);
      }
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      toast.error(err.message || "Không thể lưu đánh giá.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteEvaluation = async () => {
    if (!evalTargetMember || !evalForm.id) return;
    if (evalForm.status === "PENDING" || evalForm.status === "APPROVED") {
      toast.error("Đánh giá đang chờ duyệt hoặc đã duyệt, không thể xóa!");
      return;
    }
    const isConfirmed = await confirm({
      title: "Xóa đánh giá nháp",
      message: `Bạn có chắc chắn muốn xóa đánh giá nháp năm ${evalForm.year} của đồng chí ${evalTargetMember.HoTenDangDung}?`,
      confirmText: "Xóa",
      variant: "danger",
    });
    if (!isConfirmed) return;

    setModalLoading(true);
    try {
      await memberApi.deleteEvaluation(evalTargetMember.Id, evalForm.id);
      toast.success("Đã xóa xếp loại đánh giá.");
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể xóa đánh giá.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!evalTargetMember || !evalForm.id) return;
    setModalLoading(true);

    const formData = new FormData();
    formData.append("year", evalForm.year);
    formData.append("rank", evalForm.rank);
    formData.append("comment", evalForm.comment);

    if (isExistingDecision) {
      formData.append("quyetDinhId", quyetDinhId);
    } else {
      formData.append("soQuyetDinh", soQuyetDinh);
      formData.append("tenQuyetDinh", tenQuyetDinh);
      if (ngayBanHanh) formData.append("ngayBanHanh", ngayBanHanh);
      if (decisionFile) {
        formData.append("file", decisionFile);
      }
      if (deleteAttachment) {
        formData.append("deleteAttachment", true);
      }
    }

    try {
      // Đầu tiên lưu các chỉnh sửa (nếu cán bộ chỉnh trị sửa trực tiếp xếp loại/nhận xét trước khi duyệt)
      await memberApi.updateEvaluation(evalTargetMember.Id, evalForm.id, formData);
      // Phê duyệt
      await memberApi.approveEvaluation(evalTargetMember.Id, evalForm.id);
      toast.success(
        `Đã phê duyệt kết quả xếp loại năm ${evalForm.year} của đồng chí ${evalTargetMember.HoTenDangDung}.`,
      );
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      toast.error(err.message || "Không thể phê duyệt.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!evalTargetMember || !evalForm.id) return;
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }
    setModalLoading(true);
    try {
      await memberApi.rejectEvaluation(evalTargetMember.Id, evalForm.id, {
        rejectReason,
      });
      toast.success(
        `Đã từ chối phê duyệt xếp loại của đồng chí ${evalTargetMember.HoTenDangDung}.`,
      );
      setModalOpen(false);
      setShowRejectForm(false);
      setRejectReason("");
      await fetchData();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể từ chối phê duyệt.",
      );
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const years = [2026, 2025, 2024, 2023, 2022, 2021];
  const orgOptions = organizations.map((org) => ({
    id: org.id,
    name: org.name,
  }));

  return (
    <div className="page animate-fade-in">
      <PageHeader
        title="Xếp loại Đảng viên Hàng năm"
        subtitle={
          isBiThu
            ? "Lập, đề xuất và chỉnh sửa đánh giá xếp loại đảng viên chi bộ phục vụ xem xét phê duyệt."
            : "Thẩm định, điều chỉnh trực tiếp và phê duyệt hoặc từ chối đề xuất xếp loại đảng viên toàn đơn vị."
        }
        actions={
          <div
            style={{
              display: "flex",
              gap: "var(--spacing-md)",
              alignItems: "center",
            }}
          >
            <div
              className="form-group"
              style={{ margin: 0, minWidth: "130px" }}
            >
              <label
                className="form-label"
                style={{ fontSize: "11px", marginBottom: "2px" }}
              >
                Chọn Năm:
              </label>
              <GlassSelect
                value={selectedYear}
                onChange={(val) => setSelectedYear(parseInt(val, 10))}
                options={years}
                showEmptyOption={false}
                style={{ width: "100%" }}
              />
            </div>

            <div
              className="form-group"
              style={{ margin: 0, minWidth: "280px" }}
            >
              <label
                className="form-label"
                style={{ fontSize: "11px", marginBottom: "2px" }}
              >
                Lọc theo đơn vị:
              </label>
              <GlassSelect
                value={selectedOrgId}
                onChange={setSelectedOrgId}
                options={orgOptions}
                placeholder="Toàn Đảng bộ (Tất cả)"
                disabled={isBiThu}
                style={{ width: "100%" }}
              />
            </div>
          </div>
        }
      />

      {/* Tổng hợp phân bố xếp loại và biểu đồ trực quan */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: "var(--spacing-xl)",
          marginBottom: "var(--spacing-xl)",
        }}
      >
        {/* Ô số liệu tổng quan */}
        <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "var(--spacing-xl)",
          }}
        >
          <h4
            style={{
              color: "var(--color-text-secondary)",
              fontSize: "var(--font-size-sm)",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            Tổng quan Năm {selectedYear}
          </h4>
          <h2
            style={{
              fontSize: "var(--font-size-3xl)",
              color: "var(--color-accent)",
              marginBottom: "6px",
            }}
          >
            {totalMembers - countUnevaluated}{" "}
            <span
              style={{
                fontSize: "var(--font-size-lg)",
                color: "var(--color-text-primary)",
              }}
            >
              / {totalMembers}
            </span>
          </h2>
          <p
            className="text-muted"
            style={{
              fontSize: "var(--font-size-sm)",
              marginBottom: "var(--spacing-md)",
            }}
          >
            Đảng viên đã được lập đề xuất xếp loại.
          </p>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "rgba(58, 143, 92, 0.1)",
                border: "1px solid rgba(58, 143, 92, 0.2)",
                borderRadius: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-secondary)",
                }}
              >
                Đạt Tốt trở lên:
              </span>
              <strong style={{ color: "var(--color-success)" }}>
                {countExcellent + countGood}
              </strong>
            </div>

            {!isBiThu && countPendingApproval > 0 && (
              <div
                className="animate-pulse"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "rgba(30, 64, 175, 0.15)",
                  border: "1px solid var(--color-accent)",
                  borderRadius: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--color-accent)",
                  }}
                >
                  Chờ phê duyệt:
                </span>
                <strong style={{ color: "var(--color-accent)" }}>
                  {countPendingApproval} đ/c
                </strong>
              </div>
            )}
          </div>
        </div>

        {/* Biểu đồ thanh ngang thể hiện tỉ lệ từng mức xếp loại */}
        <div className="card" style={{ padding: "var(--spacing-lg)" }}>
          <h3
            className="card-title"
            style={{ marginBottom: "var(--spacing-md)" }}
          >
            Biểu đồ Cơ cấu Xếp loại
          </h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-md)",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "var(--font-size-sm)",
                  marginBottom: "4px",
                }}
              >
                <span>Hoàn thành xuất sắc nhiệm vụ</span>
                <span className="font-bold text-accent">
                  {countExcellent} đồng chí ({pctExcellent}%)
                </span>
              </div>
              <div
                style={{
                  height: "8px",
                  background: "var(--color-bg-tertiary)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pctExcellent}%`,
                    height: "100%",
                    background: "var(--color-accent)",
                    borderRadius: "4px",
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "var(--font-size-sm)",
                  marginBottom: "4px",
                }}
              >
                <span>Hoàn thành tốt nhiệm vụ</span>
                <span className="font-bold text-success">
                  {countGood} đồng chí ({pctGood}%)
                </span>
              </div>
              <div
                style={{
                  height: "8px",
                  background: "var(--color-bg-tertiary)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pctGood}%`,
                    height: "100%",
                    background: "var(--color-success)",
                    borderRadius: "4px",
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "var(--font-size-sm)",
                  marginBottom: "4px",
                }}
              >
                <span>Hoàn thành nhiệm vụ</span>
                <span className="font-bold text-info">
                  {countCompleted} đồng chí ({pctCompleted}%)
                </span>
              </div>
              <div
                style={{
                  height: "8px",
                  background: "var(--color-bg-tertiary)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pctCompleted}%`,
                    height: "100%",
                    background: "var(--color-info)",
                    borderRadius: "4px",
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "var(--font-size-sm)",
                  marginBottom: "4px",
                }}
              >
                <span>Không hoàn thành nhiệm vụ</span>
                <span className="font-bold text-danger">
                  {countFailed} đồng chí ({pctFailed}%)
                </span>
              </div>
              <div
                style={{
                  height: "8px",
                  background: "var(--color-bg-tertiary)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pctFailed}%`,
                    height: "100%",
                    background: "var(--color-error)",
                    borderRadius: "4px",
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "var(--font-size-sm)",
                  marginBottom: "4px",
                }}
              >
                <span className="text-muted">Chưa đánh giá</span>
                <span className="font-bold text-muted">
                  {countUnevaluated} đồng chí ({pctUnevaluated}%)
                </span>
              </div>
              <div
                style={{
                  height: "8px",
                  background: "var(--color-bg-tertiary)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pctUnevaluated}%`,
                    height: "100%",
                    background: "var(--color-border)",
                    borderRadius: "4px",
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách thẻ theo từng đơn vị chi bộ */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-xl)",
          marginBottom: "var(--spacing-xl)",
        }}
      >
        {displayOrgs.length === 0 ? (
          <div
            className="card"
            style={{
              padding: "var(--spacing-2xl)",
              textAlign: "center",
              color: "var(--color-text-muted)",
            }}
          >
            Không có đơn vị nào có đảng viên đủ điều kiện đánh giá trong năm{" "}
            {selectedYear}.
          </div>
        ) : (
          displayOrgs.map((org) => {
            // Toàn bộ số liệu của chi bộ (totalMembers, totalEvaluated, status, warnings,
            // commonRejectReason, members) đã được backend tính sẵn trong overview.
            // Ở đây chỉ lọc hiển thị theo statusFilter (bộ lọc UI, không phải thống kê).
            const displayOrgMembers = filterMembersByStatus(org.members);
            const totalOrgMembers = org.totalMembers;
            const totalOrgEvaluated = org.totalEvaluated;
            const orgStatus = org.status; // DRAFT, PENDING, APPROVED, REJECTED
            const orgWarnings = org.warnings;
            const commonRejectReason = org.commonRejectReason;

            // Ánh xạ trạng thái sang nhãn/màu hiển thị (thuần trình bày, không phải nghiệp vụ)
            const STATUS_PRESENTATION = {
              APPROVED: {
                label: "Đã phê duyệt",
                color: "var(--color-success)",
                bg: "rgba(58, 143, 92, 0.1)",
                border: "1px solid rgba(58, 143, 92, 0.2)",
              },
              REJECTED: {
                label: "Yêu cầu hiệu chỉnh (Revision)",
                color: "var(--color-error)",
                bg: "rgba(196, 69, 69, 0.1)",
                border: "1px solid rgba(196, 69, 69, 0.2)",
              },
              PENDING: {
                label: "Chờ duyệt",
                color: "var(--color-accent)",
                bg: "rgba(30, 64, 175, 0.1)",
                border: "1px solid rgba(30, 64, 175, 0.2)",
              },
              DRAFT: {
                label: "Đang lập hồ sơ (Nháp)",
                color: "var(--color-text-secondary)",
                bg: "var(--color-bg-secondary)",
                border: "1px solid var(--color-border)",
              },
            };
            const { label: statusLabel, color: statusColor, bg: statusBg, border: statusBorder } =
              STATUS_PRESENTATION[orgStatus] || STATUS_PRESENTATION.DRAFT;

            return (
              <div
                className="card"
                key={org.id}
                style={{
                  borderLeft: `4px solid ${
                    orgStatus === "APPROVED"
                      ? "var(--color-success)"
                      : orgStatus === "PENDING"
                        ? "var(--color-accent)"
                        : orgStatus === "REJECTED"
                          ? "var(--color-error)"
                          : "var(--color-border)"
                  }`,
                  padding: "var(--spacing-lg)",
                }}
              >
                {/* Header đơn vị */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "var(--spacing-md)",
                    marginBottom: "var(--spacing-md)",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "var(--font-size-lg)",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span>{org.name}</span>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: statusColor,
                          background: statusBg,
                          border: statusBorder,
                        }}
                      >
                        {statusLabel}
                      </span>
                    </h3>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--color-text-secondary)",
                        marginTop: "4px",
                      }}
                    >
                      Tiến độ xếp loại:{" "}
                      <strong>
                        {totalOrgEvaluated}/{totalOrgMembers}
                      </strong>{" "}
                      đảng viên (
                      {totalOrgMembers > 0
                        ? Math.round(
                            (totalOrgEvaluated / totalOrgMembers) * 100,
                          )
                        : 0}
                      %)
                    </div>
                  </div>

                  {/* Nhóm nút thao tác hàng loạt cho cả đơn vị */}
                  <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
                    {isBiThu
                      ? // Nút dành cho Bí thư — chỉ thao tác được với chi bộ mình phụ trách
                        org.id === user.orgId && (
                          <>
                            {(orgStatus === "DRAFT" || orgStatus === "REJECTED") && (
                              <button
                                className="btn btn-primary"
                                onClick={() => handleBatchSubmit(org.id)}
                                disabled={
                                  loading || totalOrgEvaluated < totalOrgMembers
                                }
                                title={
                                  totalOrgEvaluated < totalOrgMembers
                                    ? "Phải hoàn thành đánh giá cho tất cả đảng viên trong chi bộ trước khi nộp!"
                                    : "Nộp đề xuất xếp loại chi bộ lên cấp trên xét duyệt"
                                }
                              >
                                Nộp báo cáo ({totalOrgEvaluated}/{totalOrgMembers})
                              </button>
                            )}
                            {(orgStatus === "PENDING" || orgStatus === "APPROVED") && (
                              <button
                                className="btn btn-danger"
                                onClick={() => handleBatchRollback(org.id)}
                                disabled={loading}
                                title="Thu hồi báo cáo về trạng thái Nháp để sửa đổi"
                              >
                                Thu hồi báo cáo
                              </button>
                            )}
                          </>
                        )
                      : // Nút dành cho Cán bộ chính trị — thẩm định và phê duyệt/từ chối
                        (orgStatus === "PENDING" || orgStatus === "APPROVED") && (
                          <>
                            <button
                              className="btn btn-danger"
                              onClick={() => {
                                setRejectTargetOrg(org);
                                setBatchRejectOpen(true);
                              }}
                              disabled={loading}
                              style={{
                                background: "rgba(196, 69, 69, 0.2)",
                                color: "var(--color-error)",
                                border: "1px solid var(--color-error)",
                              }}
                            >
                              {orgStatus === "APPROVED" ? "Hủy trạng thái phê duyệt" : "Từ chối phê duyệt"}
                            </button>
                            {orgStatus === "PENDING" && (
                              <button
                                className="btn btn-success"
                                onClick={() => handleBatchApprove(org.id)}
                                disabled={loading}
                                style={{
                                  background: "var(--color-success)",
                                  color: "#fff",
                                }}
                              >
                                Phê duyệt đơn vị
                              </button>
                            )}
                          </>
                        )}
                  </div>
                </div>

                {/* Bảng hiển thị lý do từ chối chung của chi bộ */}
                {orgStatus === "REJECTED" && commonRejectReason && (
                  <div
                    style={{
                      padding: "12px",
                      background: "rgba(196, 69, 69, 0.08)",
                      border: "1px solid rgba(196, 69, 69, 0.2)",
                      borderRadius: "6px",
                      marginBottom: "var(--spacing-md)",
                      color: "var(--color-error)",
                      fontSize: "12px",
                      display: "flex",
                      gap: "8px",
                      alignItems: "flex-start",
                    }}
                  >
                    <FiAlertCircle
                      style={{
                        flexShrink: 0,
                        marginTop: "2px",
                        fontSize: "16px",
                      }}
                    />
                    <div>
                      <strong>
                        Đề xuất của chi bộ bị từ chối phê duyệt với lý do:
                      </strong>
                      <p style={{ margin: "4px 0 0 0", fontStyle: "italic" }}>
                        "{commonRejectReason}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Khu vực cảnh báo cơ cấu xếp loại của đơn vị này */}
                {orgWarnings.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      marginBottom: "var(--spacing-md)",
                      padding: "12px",
                      background: "var(--color-bg-tertiary)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "6px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        textTransform: "uppercase",
                        color: "var(--color-text-secondary)",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <FiAlertCircle /> Cảnh báo cơ cấu xếp loại (
                      {orgWarnings.length})
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: "4px",
                      }}
                    >
                      {orgWarnings.map((warning, idx) => (
                        <div
                          key={idx}
                          style={{
                            fontSize: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            color:
                              warning.level === "CRITICAL"
                                ? "var(--color-error)"
                                : "var(--color-accent)",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background:
                                warning.level === "CRITICAL"
                                  ? "var(--color-error)"
                                  : "var(--color-accent)",
                            }}
                          ></span>
                          <span>
                            <strong>{warning.message}:</strong> {warning.detail}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bảng danh sách đảng viên của đơn vị này */}
                <div className="table-container" style={{ margin: 0 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: "60px" }}>STT</th>
                        <th>Đảng viên</th>
                        <th>Số thẻ ĐV</th>
                        <th>Cấp bậc</th>
                        <th style={{ width: "220px" }}>Kết quả Xếp loại</th>
                        <th>Trạng thái duyệt</th>
                        <th>Quyết định</th>
                        <th>Nhận xét của Chi bộ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayOrgMembers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            style={{
                              textAlign: "center",
                              padding: "var(--spacing-lg)",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            Không có đảng viên nào phù hợp bộ lọc trong chi bộ
                            này.
                          </td>
                        </tr>
                      ) : (
                        displayOrgMembers.map((m, idx) => {
                          const ev = m.evaluation;
                          const isEditable =
                            isBiThu &&
                            org.id === user.orgId &&
                            (!ev ||
                              (ev.TrangThai !== "APPROVED" &&
                                ev.TrangThai !== "PENDING"));

                          return (
                            <tr key={m.Id}>
                              <td>{idx + 1}</td>
                              <td>
                                <div
                                  onClick={() => openEvaluationModal(m)}
                                  style={{
                                    fontWeight: 600,
                                    color: "var(--color-accent)",
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                  }}
                                  title="Xem chi tiết hồ sơ đánh giá"
                                >
                                  {m.HoTenDangDung}
                                </div>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: "var(--color-text-secondary)",
                                  }}
                                >
                                  Lý lịch: {m.SoLyLich || "—"}
                                </div>
                              </td>
                              <td>
                                <code style={{ color: "var(--color-accent)" }}>
                                  {m.SoTheDangVien || "—"}
                                </code>
                              </td>
                              <td>{m.CapBac || "—"}</td>
                              <td>
                                {isEditable ? (
                                  <GlassSelect
                                    value={ev ? ev.XepLoai : "NONE"}
                                    onChange={(val) => handleSelectRank(m, val)}
                                    disabled={loading}
                                    options={[
                                      { id: "NONE", name: "Chọn xếp loại" },
                                      {
                                        id: "Xuất sắc",
                                        name: "Hoàn thành Xuất sắc",
                                      },
                                      { id: "Tốt", name: "Hoàn thành Tốt" },
                                      { id: "Hoàn thành", name: "Hoàn thành" },
                                      {
                                        id: "Không hoàn thành",
                                        name: "Không Hoàn thành",
                                      },
                                    ]}
                                    showEmptyOption={false}
                                    style={{ width: "180px" }}
                                  />
                                ) : ev ? (
                                  <span
                                    style={{
                                      display: "inline-block",
                                      padding: "4px 10px",
                                      borderRadius: "12px",
                                      fontSize: "11px",
                                      fontWeight: "bold",
                                      background:
                                        ev.XepLoai === "Xuất sắc"
                                          ? "rgba(30, 64, 175, 0.15)"
                                          : ev.XepLoai === "Tốt"
                                            ? "rgba(58, 143, 92, 0.15)"
                                            : ev.XepLoai === "Hoàn thành"
                                              ? "rgba(69, 128, 196, 0.15)"
                                              : "rgba(196, 69, 69, 0.15)",
                                      color:
                                        ev.XepLoai === "Xuất sắc"
                                          ? "var(--color-accent)"
                                          : ev.XepLoai === "Tốt"
                                            ? "var(--color-success)"
                                            : ev.XepLoai === "Hoàn thành"
                                              ? "var(--color-info)"
                                              : "var(--color-error)",
                                      border:
                                        ev.XepLoai === "Xuất sắc"
                                          ? "1px solid var(--color-accent)"
                                          : ev.XepLoai === "Tốt"
                                            ? "1px solid var(--color-success)"
                                            : ev.XepLoai === "Hoàn thành"
                                              ? "1px solid var(--color-info)"
                                              : "1px solid var(--color-error)",
                                    }}
                                  >
                                    {ev.XepLoai === "Xuất sắc" &&
                                      "Hoàn thành Xuất sắc"}
                                    {ev.XepLoai === "Tốt" && "Hoàn thành Tốt"}
                                    {ev.XepLoai === "Hoàn thành" && "Hoàn thành"}
                                    {ev.XepLoai === "Không hoàn thành" &&
                                      "Không Hoàn thành"}
                                  </span>
                                ) : (
                                  <span
                                    className="text-muted"
                                    style={{
                                      fontStyle: "italic",
                                      fontSize: "var(--font-size-xs)",
                                    }}
                                  >
                                    Chưa đề xuất
                                  </span>
                                )}
                              </td>
                              <td>
                                {ev ? (
                                  <span
                                    title={
                                      ev.TrangThai === "REJECTED"
                                        ? `Lý do từ chối: ${ev.LyDoTuChoi}`
                                        : ""
                                    }
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      padding: "2px 8px",
                                      borderRadius: "4px",
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      background:
                                        ev.TrangThai === "APPROVED"
                                          ? "rgba(58, 143, 92, 0.15)"
                                          : ev.TrangThai === "REJECTED"
                                            ? "rgba(196, 69, 69, 0.15)"
                                            : "rgba(30, 64, 175, 0.15)",
                                      color:
                                        ev.TrangThai === "APPROVED"
                                          ? "var(--color-success)"
                                          : ev.TrangThai === "REJECTED"
                                            ? "var(--color-error)"
                                            : "var(--color-accent)",
                                      cursor:
                                        ev.TrangThai === "REJECTED"
                                          ? "help"
                                          : "default",
                                    }}
                                  >
                                    {ev.TrangThai === "APPROVED" && "Đã duyệt"}
                                    {ev.TrangThai === "REJECTED" && (
                                      <>
                                        <FiAlertCircle /> Yêu cầu hiệu chỉnh
                                      </>
                                    )}
                                    {ev.TrangThai === "PENDING" && "Chờ duyệt"}
                                  </span>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>
                              <td>
                                {ev && (ev.QuyetDinhId || ev.QuyetDinh?.Id) ? (
                                  <span
                                    onClick={() => handlePreviewDecisionClick(ev, m)}
                                    style={{
                                      color: "var(--color-accent)",
                                      textDecoration: "underline",
                                      cursor: "pointer",
                                      fontWeight: 500
                                    }}
                                    title="Xem chi tiết quyết định"
                                  >
                                    {ev.SoQuyetDinh || ev.QuyetDinh?.SoQuyetDinh}
                                  </span>
                                ) : ev && (ev.SoQuyetDinh || ev.QuyetDinh?.SoQuyetDinh) ? (
                                  <span>{ev.SoQuyetDinh || ev.QuyetDinh?.SoQuyetDinh}</span>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>
                              <td>
                                {isEditable ? (
                                  <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Nhập nhận xét chi tiết..."
                                    value={
                                      localComments[m.Id] !== undefined
                                        ? localComments[m.Id]
                                        : ev?.NhanXet || ""
                                    }
                                    onChange={(e) =>
                                      setLocalComments({
                                        ...localComments,
                                        [m.Id]: e.target.value,
                                      })
                                    }
                                    onBlur={(e) =>
                                      handleCommentBlur(m, e.target.value)
                                    }
                                    disabled={loading}
                                    style={{
                                      width: "100%",
                                      padding: "4px 8px",
                                      fontSize: "12px",
                                      height: "32px",
                                    }}
                                  />
                                ) : (
                                  <span
                                    style={{ fontSize: "var(--font-size-sm)" }}
                                    title={ev?.NhanXet || ""}
                                  >
                                    {ev?.NhanXet || "—"}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal xem/sửa và thẩm định chi tiết đánh giá xếp loại */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "520px", width: "90%" }}>
            <div className="modal-header">
              <h3
                className="modal-title"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <FiCheckSquare style={{ color: "var(--color-accent)" }} />
                {isBiThu
                  ? evalForm.status === "APPROVED"
                    ? "Thông tin Xếp loại (Đã phê duyệt)"
                    : evalForm.id
                      ? "Sửa đề xuất Xếp loại"
                      : "Lập đề xuất Xếp loại"
                  : "Phê duyệt & Thẩm định Xếp loại"}
              </h3>
              <button className="btn-close" onClick={() => setModalOpen(false)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSaveEvaluation}>
              <div
                className="modal-body"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--spacing-md)",
                }}
              >
                {/* Thẻ thông tin nhanh của đảng viên trong modal */}
                <div
                  style={{
                    padding: "12px",
                    background: "var(--color-bg-tertiary)",
                    borderRadius: "6px",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--color-text-secondary)",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Đảng viên
                  </div>
                  <div
                    style={{
                      fontSize: "var(--font-size-md)",
                      fontWeight: "bold",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {evalTargetMember?.HoTenDangDung}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "6px",
                      fontSize: "11px",
                      marginTop: "6px",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    <span>
                      Cấp bậc:{" "}
                      <strong style={{ color: "var(--color-accent)" }}>
                        {evalTargetMember?.rank}
                      </strong>
                    </span>
                    <span>
                      Số thẻ ĐV:{" "}
                      <strong style={{ color: "var(--color-text-primary)" }}>
                        {evalTargetMember?.SoTheDangVien || "—"}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Hiển thị lý do từ chối khi trạng thái là REJECTED */}
                {evalForm.status === "REJECTED" && evalForm.rejectReason && (
                  <div
                    style={{
                      padding: "12px",
                      background: "rgba(196, 69, 69, 0.1)",
                      border: "1px solid rgba(196, 69, 69, 0.3)",
                      borderRadius: "6px",
                      color: "var(--color-error)",
                      display: "flex",
                      gap: "8px",
                      alignItems: "flex-start",
                    }}
                  >
                    <FiAlertCircle
                      style={{
                        flexShrink: 0,
                        marginTop: "2px",
                        fontSize: "16px",
                      }}
                    />
                    <div style={{ fontSize: "12px" }}>
                      <strong>Cấp trên từ chối phê duyệt với lý do:</strong>
                      <p style={{ marginTop: "4px", fontStyle: "italic" }}>
                        "{evalForm.rejectReason}"
                      </p>
                      <p
                        style={{
                          marginTop: "6px",
                          fontSize: "10px",
                          opacity: 0.8,
                        }}
                      >
                        Vui lòng chỉnh sửa lại thông tin bên dưới và bấm lưu để
                        gửi lại yêu cầu duyệt.
                      </p>
                    </div>
                  </div>
                )}

                {/* Thông báo khóa hồ sơ cho Bí thư khi đã được phê duyệt */}
                {isBiThu && evalForm.status === "APPROVED" && (
                  <div
                    style={{
                      padding: "12px",
                      background: "rgba(58, 143, 92, 0.1)",
                      border: "1px solid rgba(58, 143, 92, 0.3)",
                      borderRadius: "6px",
                      color: "var(--color-success)",
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <FiThumbsUp style={{ fontSize: "16px" }} />
                    <span style={{ fontSize: "12px" }}>
                      Xếp loại này đã được{" "}
                      <strong>Cán bộ chính trị phê duyệt</strong>. Hồ sơ đã bị
                      khóa để bảo toàn dữ liệu.
                    </span>
                  </div>
                )}

                {/* Thông báo khóa hồ sơ cho Bí thư khi đang chờ duyệt */}
                {isBiThu && evalForm.status === "PENDING" && (
                  <div
                    style={{
                      padding: "12px",
                      background: "rgba(30, 64, 175, 0.1)",
                      border: "1px solid rgba(30, 64, 175, 0.3)",
                      borderRadius: "6px",
                      color: "var(--color-accent)",
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <FiLock style={{ fontSize: "16px" }} />
                    <span style={{ fontSize: "12px" }}>
                      Xếp loại này đã được{" "}
                      <strong>đệ trình lên cấp trên phê duyệt</strong> và hiện
                      đang bị khóa chỉnh sửa.
                    </span>
                  </div>
                )}

                {/* Các trường nhập liệu của form */}
                <div className="form-group">
                  <label className="form-label">Năm đánh giá:</label>
                  <GlassSelect
                    value={evalForm.year}
                    onChange={(val) =>
                      setEvalForm({ ...evalForm, year: parseInt(val, 10) })
                    }
                    options={years}
                    showEmptyOption={false}
                    disabled={
                      modalLoading ||
                      !isBiThu ||
                      (isBiThu &&
                        (evalForm.status === "APPROVED" ||
                          evalForm.status === "PENDING"))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Xếp loại chất lượng đề xuất:
                  </label>
                  <GlassSelect
                    value={evalForm.rank}
                    onChange={(val) => setEvalForm({ ...evalForm, rank: val })}
                    options={[
                      {
                        id: "Xuất sắc",
                        name: "Hoàn thành xuất sắc nhiệm vụ (Tối đa 20%)",
                      },
                      { id: "Tốt", name: "Hoàn thành tốt nhiệm vụ" },
                      { id: "Hoàn thành", name: "Hoàn thành nhiệm vụ" },
                      {
                        id: "Không hoàn thành",
                        name: "Không hoàn thành nhiệm vụ",
                      },
                    ]}
                    showEmptyOption={false}
                    disabled={
                      modalLoading ||
                      !isBiThu ||
                      (isBiThu &&
                        (evalForm.status === "APPROVED" ||
                          evalForm.status === "PENDING"))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Nhận xét chi tiết của Chi bộ:
                  </label>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Ghi nhận ưu khuyết điểm nổi bật, kết quả công tác chính trị, chuyên môn quân ngũ..."
                    value={evalForm.comment}
                    onChange={(e) =>
                      setEvalForm({ ...evalForm, comment: e.target.value })
                    }
                    disabled={
                      modalLoading ||
                      !isBiThu ||
                      (isBiThu &&
                        (evalForm.status === "APPROVED" ||
                          evalForm.status === "PENDING"))
                    }
                    style={{ resize: "vertical" }}
                  ></textarea>
                </div>

                {/* Quyết định xếp loại */}
                <div style={{ marginTop: 'var(--spacing-md)', borderTop: '1px dashed var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isExistingDecision}
                        onChange={(e) => setIsExistingDecision(e.target.checked)}
                        disabled={
                          modalLoading ||
                          (isBiThu &&
                            (evalForm.status === "APPROVED" ||
                              evalForm.status === "PENDING"))
                        }
                        style={{ width: 'auto', marginRight: '4px' }}
                      />
                      Liên kết Quyết định có sẵn từ hệ thống
                    </label>
                  </div>

                  {isExistingDecision ? (
                    <div className="form-group">
                      <label className="form-label">Chọn quyết định khen thưởng / xếp loại *</label>
                      <select
                        className="form-select"
                        value={quyetDinhId}
                        onChange={(e) => setQuyetDinhId(e.target.value)}
                        disabled={
                          modalLoading ||
                          (isBiThu &&
                            (evalForm.status === "APPROVED" ||
                              evalForm.status === "PENDING"))
                        }
                      >
                        <option value="">-- Chọn quyết định --</option>
                        {existingDecisions.map((qd) => (
                          <option key={qd.id} value={qd.id}>
                            Số: {qd.soQuyetDinh} - {qd.tenQuyetDinh || 'Quyết định không tên'} ({new Date(qd.ngayBanHanh).toLocaleDateString('vi-VN')})
                          </option>
                        ))}
                      </select>
                      {quyetDinhId && (
                        <div style={{ marginTop: '6px' }}>
                          <span
                            onClick={() => {
                              const qd = existingDecisions.find(d => d.id === quyetDinhId);
                              if (qd) {
                                setPreviewDecisionId(qd.id);
                                setPreviewDecision(null);
                                setPreviewModalOpen(true);
                              }
                            }}
                            style={{
                              color: "var(--color-accent)",
                              textDecoration: "underline",
                              cursor: "pointer",
                              fontSize: "12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <FiEye /> Xem trước quyết định được chọn
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="form-group">
                        <label className="form-label">Số quyết định khen thưởng / xếp loại:</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ví dụ: 204-QĐ/HV"
                          value={soQuyetDinh}
                          onChange={(e) => setSoQuyetDinh(e.target.value)}
                          disabled={
                            modalLoading ||
                            (isBiThu &&
                              (evalForm.status === "APPROVED" ||
                                evalForm.status === "PENDING"))
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Tên / Trích yếu quyết định:</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ví dụ: Quyết định xếp loại đảng viên năm 2026"
                          value={tenQuyetDinh}
                          onChange={(e) => setTenQuyetDinh(e.target.value)}
                          disabled={
                            modalLoading ||
                            (isBiThu &&
                              (evalForm.status === "APPROVED" ||
                                evalForm.status === "PENDING"))
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Ngày ban hành:</label>
                        <input
                          type="date"
                          className="form-input"
                          value={ngayBanHanh}
                          onChange={(e) => setNgayBanHanh(e.target.value)}
                          disabled={
                            modalLoading ||
                            (isBiThu &&
                              (evalForm.status === "APPROVED" ||
                                evalForm.status === "PENDING"))
                          }
                        />
                      </div>

                      {evalTargetDetail && getEvaluationForYear(evalTargetDetail, evalForm.year)?.taiLieuUrl && !deleteAttachment ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(58, 143, 92, 0.1)', borderRadius: '4px', border: '1px solid rgba(58, 143, 92, 0.2)', marginBottom: '16px' }}>
                          <span
                            onClick={() => {
                              const ev = getEvaluationForYear(evalTargetDetail, evalForm.year);
                              if (ev) {
                                handlePreviewDecisionClick(ev, evalTargetMember);
                              }
                            }}
                            style={{
                              fontSize: '12px',
                              color: 'var(--color-success)',
                              fontWeight: 600,
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            📎 Đã đính kèm: {getEvaluationForYear(evalTargetDetail, evalForm.year)?.taiLieuName || 'quyết định'} (Bấm để xem)
                          </span>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--color-error)', border: '1px solid var(--color-error)', padding: '4px 8px' }}
                            disabled={
                              modalLoading ||
                              (isBiThu &&
                                (evalForm.status === "APPROVED" ||
                                  evalForm.status === "PENDING"))
                            }
                            onClick={() => setDeleteAttachment(true)}
                          >
                            Xóa file
                          </button>
                        </div>
                      ) : (
                        <div className="form-group">
                          <label className="form-label">Tải lên quyết định (PDF / Ảnh):</label>
                          <input
                            type="file"
                            className="form-input"
                            onChange={(e) => setDecisionFile(e.target.files?.[0] || null)}
                            accept=".pdf,.png,.jpg,.jpeg"
                            disabled={
                              modalLoading ||
                              (isBiThu &&
                                (evalForm.status === "APPROVED" ||
                                  evalForm.status === "PENDING"))
                            }
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div
                className="modal-footer"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "var(--spacing-md)",
                }}
              >
                <div>
                  {isBiThu &&
                    evalForm.id &&
                    evalForm.status !== "APPROVED" &&
                    evalForm.status !== "PENDING" && (
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={handleDeleteEvaluation}
                        disabled={modalLoading}
                        style={{ padding: "8px 16px" }}
                      >
                        Xóa đề xuất
                      </button>
                    )}
                </div>

                <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setModalOpen(false)}
                    disabled={modalLoading}
                  >
                    Đóng
                  </button>

                  {isBiThu &&
                    evalForm.status !== "APPROVED" &&
                    evalForm.status !== "PENDING" && (
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={modalLoading}
                      >
                        {modalLoading ? "Đang lưu..." : "Lưu bản nháp"}
                      </button>
                    )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal từ chối cả chi bộ (dành cho Cán bộ chính trị) */}
      {batchRejectOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "480px", width: "90%" }}>
            <div className="modal-header">
              <h3
                className="modal-title"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "var(--color-error)",
                }}
              >
                <FiThumbsDown style={{ color: "var(--color-error)" }} />
                Từ chối phê duyệt Chi bộ
              </h3>
              <button
                className="btn-close"
                onClick={() => {
                  setBatchRejectOpen(false);
                  setBatchRejectReason("");
                  setRejectTargetOrg(null);
                }}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleBatchReject}>
              <div
                className="modal-body"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--spacing-md)",
                }}
              >
                <div
                  style={{
                    padding: "12px",
                    background: "rgba(196, 69, 69, 0.08)",
                    border: "1px solid rgba(196, 69, 69, 0.2)",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Đồng chí đang thực hiện từ chối phê duyệt đề xuất xếp loại của
                  chi bộ <strong>{rejectTargetOrg?.name}</strong> năm{" "}
                  {selectedYear}. Yêu cầu này sẽ gửi trả hồ sơ về trạng thái
                  chỉnh sửa để chi bộ hoàn thiện lại.
                </div>

                <div className="form-group">
                  <label
                    className="form-label"
                    style={{ color: "var(--color-error)", fontWeight: 600 }}
                  >
                    Lý do từ chối cả Chi bộ:
                  </label>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Nhập lý do chi tiết từ chối phê duyệt hoặc chỉ thị khắc phục chỉnh sửa cho Bí thư chi bộ..."
                    value={batchRejectReason}
                    onChange={(e) => setBatchRejectReason(e.target.value)}
                    required
                    style={{ resize: "vertical" }}
                  ></textarea>
                </div>
              </div>

              <div
                className="modal-footer"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "var(--spacing-sm)",
                  marginTop: "var(--spacing-md)",
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setBatchRejectOpen(false);
                    setBatchRejectReason("");
                    setRejectTargetOrg(null);
                  }}
                  disabled={loading}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={loading || !batchRejectReason.trim()}
                >
                  Xác nhận từ chối cả Chi bộ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL PHÊ DUYỆT CẢ CHI BỘ (kèm Quyết định) ===== */}
      {batchApproveOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '560px', width: '90%' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiCheckCircle style={{ color: 'var(--color-success)' }} />
                Phê duyệt xếp loại Chi bộ
              </h3>
              <button
                className="btn-close"
                onClick={() => setBatchApproveOpen(false)}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleBatchApproveSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {/* Thông tin chi bộ */}
                <div style={{
                  padding: '12px',
                  background: 'rgba(58, 143, 92, 0.08)',
                  border: '1px solid rgba(58, 143, 92, 0.25)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                }}>
                  Phê duyệt toàn bộ xếp loại năm <strong>{selectedYear}</strong> của chi bộ{' '}
                  <strong>{approveTargetOrg?.name}</strong>. Thao tác này không thể hoàn tác.
                </div>

                <DecisionFormFields
                  value={baDecisionForm}
                  onChange={(patch) => setBaDecisionForm((f) => ({ ...f, ...patch }))}
                  existingDecisions={baExistingDecisions}
                  emptyDecisionsMessage="Chưa có quyết định loại xếp loại nào trong hệ thống."
                  disabled={batchApproveSubmitting}
                />

                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '-4px' }}>
                  Quyết định là tùy chọn — có thể bỏ qua và phê duyệt trước, cập nhật sau.
                </p>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setBatchApproveOpen(false)}
                  disabled={batchApproveSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={batchApproveSubmitting || (baDecisionForm.isExisting && !baDecisionForm.quyetDinhId)}
                  style={{ background: 'var(--color-success)', color: '#fff' }}
                >
                  {batchApproveSubmitting ? 'Đang xử lý...' : 'Xác nhận phê duyệt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal xem trước nội dung quyết định */}
      <DecisionPreviewModal
        isOpen={previewModalOpen}
        decisionId={previewDecisionId}
        decision={previewDecision}
        onClose={() => {
          setPreviewModalOpen(false);
          setPreviewDecisionId(null);
          setPreviewDecision(null);
        }}
      />
    </div>
  );
}
