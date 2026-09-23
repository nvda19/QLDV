import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { ROLES } from "../../utils/constants";
import { formatDate } from "../../utils/helpers";
import memberApi from "../../api/memberApi";
import orgApi from "../../api/orgApi";
import decisionApi from "../../api/decisionApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import PageHeader from "../../components/common/PageHeader";
import DecisionPreviewModal from "../../components/common/DecisionPreviewModal";
import DecisionFormFields, {
  createDecisionFormState,
  appendDecisionFormData,
} from "../../components/common/DecisionFormFields";
import GlassSearch from "../../components/common/GlassSearch";

const BADGE_MILESTONES = [30, 40, 45, 50, 55, 60, 65, 70, 75, 80];

const loaiDeXuatLabel = (v) => {
  if (v === "CAP_MOI") return "Cấp mới";
  if (v === "CAP_LAI") return "Cấp lại";
  if (v === "TRUY_TANG") return "Truy tặng";
  return v || "";
};

const getDiffMonths = (d1, d2) =>
  (d1.getFullYear() - d2.getFullYear()) * 12 + d1.getMonth() - d2.getMonth();

const getCeremonies = () => {
  const now = new Date();
  const y = now.getFullYear();
  return [
    new Date(y, 1, 3),
    new Date(y, 4, 19),
    new Date(y, 8, 2),
    new Date(y, 10, 7),
    new Date(y + 1, 1, 3),
    new Date(y + 1, 4, 19),
    new Date(y + 1, 8, 2),
    new Date(y + 1, 10, 7),
  ]
    .filter((c) => c >= now)
    .sort((a, b) => a - b);
};

const getTargetCeremony = (ngayVaoDangStr, milestone) => {
  if (!ngayVaoDangStr) return null;
  const ngayVaoDang = new Date(ngayVaoDangStr);
  if (isNaN(ngayVaoDang.getTime())) return null;
  const milestoneMonths = milestone * 12;
  for (const c of getCeremonies()) {
    if (getDiffMonths(c, ngayVaoDang) >= milestoneMonths) return c;
  }
  return null;
};

const formatCeremony = (d) =>
  `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

export default function BadgeEvaluationPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);

  const isBiThu = user?.role === ROLES.BI_THU;
  const isCanBo = user?.role === ROLES.CAN_BO_CHINH_TRI;

  const [activeTab, setActiveTab] = useState(isCanBo ? "pending" : "suggested");

  // Modal đề nghị thủ công (tạo DRAFT)
  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState("");
  const [loaiDeXuat, setLoaiDeXuat] = useState("CAP_MOI");

  // Phê duyệt / từ chối theo tổ chức
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveDecisionForm, setApproveDecisionForm] = useState(
    createDecisionFormState(),
  );
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Cập nhật quyết định / số huy hiệu cho từng đảng viên (sau khi duyệt)
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedUpdateProposal, setSelectedUpdateProposal] = useState(null);
  const [soHuyHieuUpdate, setSoHuyHieuUpdate] = useState("");
  const [soQuyetDinhCaNhanUpdate, setSoQuyetDinhCaNhanUpdate] = useState("");
  const [soQuyetDinhTapTheUpdate, setSoQuyetDinhTapTheUpdate] = useState("");
  const [ngayQuyetDinhUpdate, setNgayQuyetDinhUpdate] = useState("");
  const [updateFile, setUpdateFile] = useState(null);
  const [deleteAttachmentFlag, setDeleteAttachmentFlag] = useState(false);
  const [quyetDinhIdUpdate, setQuyetDinhIdUpdate] = useState("");
  const [isExistingDecisionUpdate, setIsExistingDecisionUpdate] =
    useState(false);

  const [existingDecisions, setExistingDecisions] = useState([]);
  const [previewDecisionId, setPreviewDecisionId] = useState(null);
  const [previewDecision, setPreviewDecision] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const offlineInputRef = useRef(null);
  const updateFileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersRes, orgsRes, proposalsRes, decisionsRes] =
        await Promise.all([
          memberApi.getAll(),
          orgApi.getAll(),
          memberApi.getBadgeProposals(),
          decisionApi.getAll({ loaiQuyetDinh: "HUY_HIEU_DANG" }),
        ]);
      setMembers(membersRes.data || []);
      setOrganizations(orgsRes.data || []);
      setProposals(proposalsRes.data || []);
      setExistingDecisions(decisionsRes.data || []);
    } catch {
      toast.error("Không thể tải danh sách thâm niên tuổi Đảng và đề nghị.");
    } finally {
      setLoading(false);
    }
  };

  const getSubOrgIds = (orgId) => {
    const ids = [orgId];
    const findChildren = (id) => {
      organizations.forEach((o) => {
        if (o.parentId === id) {
          ids.push(o.id);
          findChildren(o.id);
        }
      });
    };
    findChildren(orgId);
    return ids;
  };

  const matchesSearch = (name, card) =>
    (name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (card && card.includes(searchTerm));

  const inScope = (orgId) =>
    !isBiThu || getSubOrgIds(user.orgId).includes(orgId);

  const inScopeMembers = isBiThu
    ? members.filter((m) => getSubOrgIds(user.orgId).includes(m.ToChucDangId))
    : members;

  const memberById = new Map(members.map((m) => [m.Id, m]));

  // DRAFT — danh sách đề nghị (nhóm theo đợt trao tặng)
  const draftItems = proposals.filter(
    (p) =>
      p.TrangThai === "DRAFT" &&
      inScope(p.ToChucDangId) &&
      matchesSearch(p.HoTenDangDung, p.SoTheDangVien),
  );
  const ceremonyGroupsMap = new Map();
  draftItems.forEach((p) => {
    const m = memberById.get(p.DangVienId);
    const ceremony = m ? getTargetCeremony(m.NgayVaoDang, p.MocHuyHieu) : null;
    const key = ceremony ? ceremony.getTime() : "unknown";
    if (!ceremonyGroupsMap.has(key))
      ceremonyGroupsMap.set(key, { date: ceremony, items: [] });
    ceremonyGroupsMap.get(key).items.push(p);
  });
  const ceremonyGroups = [...ceremonyGroupsMap.values()].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date - b.date;
  });

  const dismissedList = proposals.filter(
    (p) =>
      p.TrangThai === "DISMISSED" &&
      inScope(p.ToChucDangId) &&
      matchesSearch(p.HoTenDangDung, p.SoTheDangVien),
  );

  // PENDING — chỉ tách riêng theo mốc huy hiệu (30, 40, 45 năm...), gộp chung mọi tổ
  // chức Đảng trong cùng 1 mốc (mỗi mốc duyệt/từ chối độc lập bằng 1 quyết định riêng)
  const pendingList = proposals.filter(
    (p) =>
      p.TrangThai === "PENDING" &&
      inScope(p.ToChucDangId) &&
      matchesSearch(p.HoTenDangDung, p.SoTheDangVien),
  );
  const pendingByMocMap = new Map();
  pendingList.forEach((p) => {
    if (!pendingByMocMap.has(p.MocHuyHieu))
      pendingByMocMap.set(p.MocHuyHieu, {
        mocHuyHieu: p.MocHuyHieu,
        items: [],
      });
    pendingByMocMap.get(p.MocHuyHieu).items.push(p);
  });
  const pendingGroups = [...pendingByMocMap.values()].sort(
    (a, b) => a.mocHuyHieu - b.mocHuyHieu,
  );

  const approvedList = proposals.filter(
    (p) =>
      p.TrangThai === "APPROVED" &&
      inScope(p.ToChucDangId) &&
      matchesSearch(p.HoTenDangDung, p.SoTheDangVien),
  );
  const rejectedList = proposals.filter(
    (p) =>
      p.TrangThai === "REJECTED" &&
      inScope(p.ToChucDangId) &&
      matchesSearch(p.HoTenDangDung, p.SoTheDangVien),
  );

  const honorList = inScopeMembers.filter((m) => {
    const badge = (m.HuyHieuDang || "").trim();
    const hasBadge = badge !== "" && badge !== "Chưa" && badge !== "Không";
    return (
      hasBadge ||
      proposals.some((p) => p.DangVienId === m.Id && p.TrangThai === "APPROVED")
    );
  });

  // --- Các thao tác xử lý đề nghị ---

  const handleScan = async () => {
    setActionLoading(true);
    try {
      const res = await memberApi.scanBadgeEligibility();
      const count = res.data?.suggested ?? 0;
      toast.success(
        count > 0
          ? `Hệ thống phát hiện ${count} trường hợp mới đủ điều kiện.`
          : "Không có trường hợp mới đủ điều kiện.",
      );
      await fetchData();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Có lỗi khi kiểm tra điều kiện.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitOrg = async () => {
    if (draftItems.length === 0) {
      toast.error("Danh sách đề nghị đang trống.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await memberApi.submitOrgBadges(user.orgId);
      toast.success(
        `Đã gửi ${res.data?.count ?? draftItems.length} đề nghị của chi bộ lên cấp trên.`,
      );
      await fetchData();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Có lỗi khi gửi danh sách đề nghị.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismissSuggestion = async (proposal) => {
    setActionLoading(true);
    try {
      await memberApi.dismissBadgeProposal(proposal.DangVienId, proposal.Id);
      toast.success(
        `Đã xóa đ/c ${proposal.HoTenDangDung} khỏi danh sách đề nghị.`,
      );
      await fetchData();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Có lỗi khi xóa khỏi danh sách.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreSuggestion = async (proposal) => {
    setActionLoading(true);
    try {
      await memberApi.restoreBadgeProposal(proposal.DangVienId, proposal.Id);
      toast.success(`Đã khôi phục đề nghị của đ/c ${proposal.HoTenDangDung}.`);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi khi khôi phục.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPropose = () => {
    setSelectedMemberId("");
    setSelectedMilestone("");
    setLoaiDeXuat("CAP_MOI");
    setProposeModalOpen(true);
  };

  const handleProposeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) {
      toast.error("Vui lòng chọn đảng viên.");
      return;
    }
    if (!selectedMilestone) {
      toast.error("Vui lòng chọn mốc Huy hiệu đề nghị.");
      return;
    }
    setActionLoading(true);
    try {
      const member = memberById.get(selectedMemberId);
      await memberApi.proposeBadge(selectedMemberId, {
        loaiDeXuat,
        mocHuyHieu: selectedMilestone,
      });
      toast.success(
        `Đã thêm đ/c ${member?.HoTenDangDung || ""} (Huy hiệu ${selectedMilestone} năm) vào danh sách đề nghị.`,
      );
      setProposeModalOpen(false);
      await fetchData();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Có lỗi xảy ra khi thêm đề nghị.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenApproveOrg = (group) => {
    setSelectedOrg(group);
    setApproveDecisionForm({
      ...createDecisionFormState(),
      ngayBanHanh: new Date().toISOString().split("T")[0],
    });
    setApproveModalOpen(true);
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    const formData = new FormData();
    appendDecisionFormData(formData, approveDecisionForm);
    try {
      const res = await memberApi.approveMilestoneBadges(selectedOrg.mocHuyHieu, formData);
      toast.success(
        `Đã phê duyệt ${res.data?.count ?? selectedOrg.items.length} đề nghị Huy hiệu ${selectedOrg.mocHuyHieu} năm.`,
      );
      setApproveModalOpen(false);
      await fetchData();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Có lỗi xảy ra khi phê duyệt.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRejectOrg = (group) => {
    setSelectedOrg(group);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.error("Lý do từ chối không được để trống.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await memberApi.rejectMilestoneBadges(selectedOrg.mocHuyHieu, {
        rejectReason,
      });
      toast.success(
        `Đã từ chối ${res.data?.count ?? selectedOrg.items.length} đề nghị Huy hiệu ${selectedOrg.mocHuyHieu} năm.`,
      );
      setRejectModalOpen(false);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi từ chối.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenUpdate = (proposal) => {
    setSelectedUpdateProposal(proposal);
    setSoHuyHieuUpdate(proposal.SoHuyHieu || "");
    setSoQuyetDinhCaNhanUpdate(proposal.SoQuyetDinhCaNhan || "");
    setSoQuyetDinhTapTheUpdate(proposal.SoQuyetDinhTapThe || "");
    setNgayQuyetDinhUpdate(
      proposal.NgayQuyetDinh
        ? new Date(proposal.NgayQuyetDinh).toISOString().split("T")[0]
        : "",
    );
    setUpdateFile(null);
    setDeleteAttachmentFlag(false);
    setQuyetDinhIdUpdate(proposal.QuyetDinhId || "");
    setIsExistingDecisionUpdate(!!proposal.QuyetDinhId);
    setUpdateModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    const formData = new FormData();
    formData.append("ProposalId", selectedUpdateProposal.Id);
    formData.append("SoHuyHieu", soHuyHieuUpdate);
    if (isExistingDecisionUpdate) {
      formData.append("QuyetDinhId", quyetDinhIdUpdate);
    } else {
      formData.append("SoQuyetDinhCaNhan", soQuyetDinhCaNhanUpdate);
      formData.append("SoQuyetDinhTapThe", soQuyetDinhTapTheUpdate);
      formData.append("NgayQuyetDinh", ngayQuyetDinhUpdate);
      formData.append(
        "deleteAttachment",
        deleteAttachmentFlag ? "true" : "false",
      );
      if (updateFile) formData.append("file", updateFile);
    }
    try {
      await memberApi.updateBadgeDecision(
        selectedUpdateProposal.DangVienId,
        formData,
      );
      toast.success("Cập nhật tài liệu quyết định thành công.");
      setUpdateModalOpen(false);
      await fetchData();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Có lỗi xảy ra khi cập nhật quyết định.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handlePreviewDecisionClick = (p) => {
    if (p.QuyetDinhId) {
      setPreviewDecisionId(p.QuyetDinhId);
      setPreviewDecision(null);
      setPreviewModalOpen(true);
    } else {
      setPreviewDecision({
        soQuyetDinh: p.SoQuyetDinhTapThe || p.SoQuyetDinhCaNhan || "Chưa có",
        tenQuyetDinh: `Quyết định trao Huy hiệu cho đ/c ${p.HoTenDangDung}`,
        loaiQuyetDinh: "HUY_HIEU_DANG",
        ngayBanHanh: p.NgayQuyetDinh,
        taiLieuUrl: p.QuyetDinh?.TaiLieuUrl || p.TaiLieuUrl,
        taiLieuName: p.QuyetDinh?.TaiLieuName || p.TaiLieuName,
      });
      setPreviewDecisionId(null);
      setPreviewModalOpen(true);
    }
  };

  // --- Xuất/nhập dữ liệu để làm việc ngoại tuyến ---

  const handleExportProposalsOffline = () => {
    const proposalsToExport = proposals
      .filter((p) => p.TrangThai === "PENDING" && inScope(p.ToChucDangId))
      .map((p) => ({
        id: p.Id,
        memberId: p.DangVienId,
        loaiDeXuat: p.LoaiDeXuat,
        mocHuyHieu: p.MocHuyHieu,
        nguoiDeXuatId: p.NguoiDeXuatId,
      }));
    if (proposalsToExport.length === 0) {
      toast.error("Không có đề nghị nào đang chờ duyệt để xuất tệp tin.");
      return;
    }
    const dataStr = JSON.stringify(
      {
        type: "PROPOSALS_OFFLINE",
        exportDate: new Date().toISOString(),
        proposals: proposalsToExport,
      },
      null,
      2,
    );
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `de_nghi_huy_hieu_offline_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(
      `Đã xuất ${proposalsToExport.length} đề nghị ngoại tuyến thành công.`,
    );
  };

  const handleExportDecisionsOffline = () => {
    const decisionsToExport = proposals
      .filter((p) => p.TrangThai === "APPROVED")
      .map((p) => ({
        id: p.Id,
        memberId: p.DangVienId,
        loaiDeXuat: p.LoaiDeXuat,
        mocHuyHieu: p.MocHuyHieu,
        soHuyHieu: p.SoHuyHieu,
        soQuyetDinhCaNhan: p.SoQuyetDinhCaNhan,
        soQuyetDinhTapThe: p.SoQuyetDinhTapThe,
        ngayQuyetDinh: p.NgayQuyetDinh,
        taiLieuUrl: p.QuyetDinh?.TaiLieuUrl || p.TaiLieuUrl,
        taiLieuName: p.QuyetDinh?.TaiLieuName || p.TaiLieuName,
        nguoiDuyetId: p.nguoiDuyetId,
      }));
    if (decisionsToExport.length === 0) {
      toast.error(
        "Không có quyết định đã phê duyệt nào để kết xuất ngoại tuyến.",
      );
      return;
    }
    const dataStr = JSON.stringify(
      {
        type: "DECISIONS_OFFLINE",
        exportDate: new Date().toISOString(),
        decisions: decisionsToExport,
      },
      null,
      2,
    );
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `phe_duyet_huy_hieu_offline_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(
      `Đã xuất ${decisionsToExport.length} quyết định phê duyệt ngoại tuyến.`,
    );
  };

  const handleOfflineFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileReader = new FileReader();
    fileReader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result);
        if (isCanBo && data.type === "PROPOSALS_OFFLINE") {
          setActionLoading(true);
          const res = await memberApi.importProposalsOffline(data.proposals);
          toast.success(
            `Nhập thành công ${res.data.count} đề nghị ngoại tuyến của cấp dưới.`,
          );
          await fetchData();
        } else if (isBiThu && data.type === "DECISIONS_OFFLINE") {
          setActionLoading(true);
          const res = await memberApi.importDecisionsOffline(data.decisions);
          toast.success(
            `Đồng bộ thành công ${res.data.count} quyết định từ cấp trên.`,
          );
          await fetchData();
        } else {
          toast.error(
            "Tệp tin dữ liệu không khớp với thẩm quyền vai trò của bạn.",
          );
        }
      } catch (err) {
        toast.error(
          err.response?.data?.message ||
            "Lỗi khi nhập tệp tin dữ liệu ngoại tuyến.",
        );
      } finally {
        setActionLoading(false);
        if (offlineInputRef.current) offlineInputRef.current.value = "";
      }
    };
    fileReader.readAsText(file);
  };

  if (loading) return <LoadingSpinner />;

  const emptyCellStyle = {
    textAlign: "center",
    padding: "var(--spacing-2xl)",
    color: "var(--color-text-muted)",
  };
  const groupHeaderStyle = {
    padding: "10px var(--spacing-lg)",
    background: "rgba(27, 46, 79, 0.04)",
    borderLeft: "3px solid var(--color-accent)",
    fontWeight: 600,
    color: "var(--color-text-primary)",
    fontSize: "var(--font-size-sm)",
  };

  return (
    <div className="page animate-fade-in">
      <PageHeader
        title="Xét tặng Huy hiệu Đảng"
        subtitle={
          isBiThu
            ? "Hệ thống tự phát hiện theo từng đợt trao tặng. Bí thư gửi cả danh sách của chi bộ lên cấp trên."
            : "Thẩm định và phê duyệt/từ chối cả danh sách của từng tổ chức Đảng bằng một quyết định chung."
        }
        actions={
          <div
            style={{
              display: "flex",
              gap: "var(--spacing-sm)",
              alignItems: "center",
            }}
          >
            <GlassSearch
              placeholder="Tìm theo tên hoặc số thẻ"
              value={searchTerm}
              onChange={setSearchTerm}
              width="220px"
            />
            <button
              className="btn btn-outline btn-sm"
              onClick={handleScan}
              disabled={actionLoading}
              title="Yêu cầu hệ thống kiểm tra điều kiện ngay"
            >
              {actionLoading ? "Đang kiểm tra" : "Kiểm tra điều kiện"}
            </button>
            {isBiThu && (
              <button
                className="btn btn-outline btn-sm"
                onClick={handleOpenPropose}
                title="Thêm đề nghị thủ công (Cấp lại / Truy tặng)"
              >
                Đề nghị thủ công
              </button>
            )}
            {isBiThu ? (
              <>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleExportProposalsOffline}
                  title="Kết xuất đề nghị ngoại tuyến gửi lên cấp trên"
                >
                  Xuất đề nghị
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => offlineInputRef.current?.click()}
                  title="Đồng bộ kết quả phê duyệt ngoại tuyến từ cấp trên"
                >
                  Đồng bộ kết quả
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => offlineInputRef.current?.click()}
                  title="Tải lên tệp đề nghị ngoại tuyến từ chi bộ gửi lên"
                >
                  Nhập đề nghị
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleExportDecisionsOffline}
                  title="Kết xuất kết quả phê duyệt gửi trả lại chi bộ"
                >
                  Xuất quyết định
                </button>
              </>
            )}
            <input
              type="file"
              ref={offlineInputRef}
              style={{ display: "none" }}
              accept=".json"
              onChange={handleOfflineFileChange}
            />
          </div>
        }
      />

      {isBiThu && (
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(243, 244, 246, 0.85) 100%)",
            backdropFilter: "var(--backdrop-blur)",
            borderRadius: "var(--radius-lg)",
            padding: "20px var(--spacing-xl)",
            marginBottom: "var(--spacing-xl)",
            boxShadow: "var(--shadow-sm)",
            border: "1px solid rgba(197, 160, 89, 0.35)",
          }}
        >
          <h3
            style={{
              color: "var(--color-primary)",
              fontSize: "var(--font-size-sm)",
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: "14px",
              letterSpacing: "0.8px",
            }}
          >
            Bảng vàng danh dự chi bộ
          </h3>
          {honorList.length === 0 ? (
            <p
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "var(--font-size-sm)",
                margin: 0,
                fontStyle: "italic",
              }}
            >
              Chi bộ hiện tại chưa ghi nhận đảng viên nào được trao tặng Huy
              hiệu Đảng.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "12px",
                marginTop: "10px",
              }}
            >
              {honorList.map((h) => (
                <div
                  key={h.Id}
                  style={{
                    background: "rgba(255, 255, 255, 0.8)",
                    border: "1px solid rgba(197, 160, 89, 0.25)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 14px",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div
                    style={{
                      color: "var(--color-text-primary)",
                      fontWeight: 600,
                      fontSize: "13px",
                    }}
                  >
                    {h.HoTenDangDung}
                  </div>
                  <div
                    style={{
                      color: "var(--color-gold-dark)",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    {h.HuyHieuDang || "Đã phê duyệt trao"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="tabs" style={{ marginBottom: "var(--spacing-lg)" }}>
        <button
          className={`tab ${activeTab === "suggested" ? "active" : ""}`}
          onClick={() => setActiveTab("suggested")}
        >
          Danh sách đề nghị ({draftItems.length})
        </button>
        <button
          className={`tab ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          Chờ phê duyệt ({pendingList.length})
        </button>
        <button
          className={`tab ${activeTab === "approved" ? "active" : ""}`}
          onClick={() => setActiveTab("approved")}
        >
          Quyết định đã duyệt ({approvedList.length})
        </button>
        <button
          className={`tab ${activeTab === "rejected" ? "active" : ""}`}
          onClick={() => setActiveTab("rejected")}
        >
          Bị từ chối ({rejectedList.length})
        </button>
      </div>

      <div className="card">
        {/* Tab: Danh sách đề nghị (DRAFT) nhóm theo đợt trao tặng */}
        {activeTab === "suggested" && (
          <div>
            <div
              className="card-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 className="card-title">
                Danh sách đề nghị xét tặng theo đợt trao tặng
              </h3>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-md)",
                }}
              >
                {dismissedList.length > 0 && (
                  <button
                    className="btn-link"
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--color-text-secondary)",
                      cursor: "pointer",
                      fontSize: "var(--font-size-xs)",
                      textDecoration: "underline",
                    }}
                    onClick={() => setShowDismissed((v) => !v)}
                  >
                    {showDismissed
                      ? "Ẩn mục đã loại"
                      : `Hiện mục đã loại (${dismissedList.length})`}
                  </button>
                )}
                {isBiThu && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSubmitOrg}
                    disabled={actionLoading || draftItems.length === 0}
                    title="Gửi toàn bộ danh sách đề nghị của chi bộ lên cấp trên"
                  >
                    Gửi toàn bộ đề nghị của chi bộ ({draftItems.length})
                  </button>
                )}
              </div>
            </div>

            {ceremonyGroups.length === 0 ? (
              <div style={emptyCellStyle}>
                Chưa có đề nghị nào. Nhấn "Kiểm tra điều kiện" để hệ thống quét
                và phát hiện đảng viên đủ niên hạn.
              </div>
            ) : (
              ceremonyGroups.map((group) => (
                <div
                  key={group.date ? group.date.getTime() : "unknown"}
                  style={{ marginBottom: "var(--spacing-lg)" }}
                >
                  <div style={groupHeaderStyle}>
                    {group.date
                      ? `Đợt trao tặng ngày ${formatCeremony(group.date)}`
                      : "Chưa xác định đợt trao tặng"}
                    <span
                      className="text-muted"
                      style={{
                        fontWeight: 400,
                        marginLeft: "8px",
                        fontSize: "var(--font-size-xs)",
                      }}
                    >
                      ({group.items.length} đề nghị)
                    </span>
                  </div>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th style={{ width: "60px" }}>STT</th>
                          <th>Đảng viên</th>
                          <th>Đơn vị Đảng</th>
                          <th>Mốc đề nghị</th>
                          <th>Ngày phát hiện</th>
                          <th style={{ width: "160px", textAlign: "center" }}>
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((p, idx) => (
                          <tr key={p.Id}>
                            <td>{idx + 1}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>
                                {p.HoTenDangDung}
                              </div>
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "var(--color-text-secondary)",
                                }}
                              >
                                Thẻ: {p.SoTheDangVien || "-"}
                              </div>
                            </td>
                            <td>{p.TenToChucDang}</td>
                            <td>
                              <span
                                style={{
                                  fontWeight: "bold",
                                  color: "var(--color-accent)",
                                }}
                              >
                                Huy hiệu {p.MocHuyHieu} năm
                              </span>
                            </td>
                            <td>{formatDate(p.CreatedAt)}</td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                className="btn btn-sm"
                                style={{
                                  background: "rgba(185, 28, 28, 0.1)",
                                  color: "var(--color-error)",
                                  borderColor: "rgba(185, 28, 28, 0.2)",
                                  boxShadow: "none",
                                }}
                                onClick={() => handleDismissSuggestion(p)}
                                disabled={actionLoading}
                              >
                                Xóa khỏi danh sách
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}

            {showDismissed && dismissedList.length > 0 && (
              <div style={{ marginTop: "var(--spacing-lg)" }}>
                <div
                  style={{
                    ...groupHeaderStyle,
                    background: "rgba(148, 163, 184, 0.08)",
                    borderLeft: "3px solid var(--color-text-muted)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Đã loại khỏi danh sách ({dismissedList.length})
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: "60px" }}>STT</th>
                        <th>Đảng viên</th>
                        <th>Đơn vị Đảng</th>
                        <th>Mốc đề nghị</th>
                        <th style={{ width: "140px", textAlign: "center" }}>
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dismissedList.map((p, idx) => (
                        <tr key={p.Id}>
                          <td>{idx + 1}</td>
                          <td>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "var(--color-text-secondary)",
                              }}
                            >
                              {p.HoTenDangDung}
                            </div>
                          </td>
                          <td>{p.TenToChucDang}</td>
                          <td>Huy hiệu {p.MocHuyHieu} năm</td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => handleRestoreSuggestion(p)}
                              disabled={actionLoading}
                            >
                              Khôi phục
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Chờ phê duyệt — gom theo tổ chức Đảng */}
        {activeTab === "pending" && (
          <div>
            <div
              className="card-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 className="card-title">
                Danh sách đề nghị chờ phê duyệt theo mốc huy hiệu
              </h3>
              <span
                className="text-muted"
                style={{ fontSize: "var(--font-size-xs)" }}
              >
                Tổng số: {pendingList.length} đề nghị
              </span>
            </div>

            {pendingGroups.length === 0 ? (
              <div style={emptyCellStyle}>
                Không có đề nghị nào đang chờ duyệt.
              </div>
            ) : (
              pendingGroups.map((group) => (
                <div
                  key={group.mocHuyHieu}
                  style={{ marginBottom: "var(--spacing-lg)" }}
                >
                  <div
                    style={{
                      ...groupHeaderStyle,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>
                      <span
                        style={{
                          color: "var(--color-accent)",
                          fontWeight: "bold",
                        }}
                      >
                        Huy hiệu {group.mocHuyHieu} năm
                      </span>
                      <span
                        className="text-muted"
                        style={{
                          fontWeight: 400,
                          marginLeft: "8px",
                          fontSize: "var(--font-size-xs)",
                        }}
                      >
                        ({group.items.length} đề nghị)
                      </span>
                    </span>
                    {isCanBo && (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="btn btn-sm"
                          style={{
                            background: "rgba(185, 28, 28, 0.1)",
                            color: "var(--color-error)",
                            borderColor: "rgba(185, 28, 28, 0.2)",
                            boxShadow: "none",
                          }}
                          onClick={() => handleOpenRejectOrg(group)}
                        >
                          Từ chối
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--color-success) 0%, #166534 100%)",
                            color: "#ffffff",
                            borderColor: "var(--color-success)",
                            boxShadow: "0 2px 6px rgba(22, 101, 52, 0.2)",
                          }}
                          onClick={() => handleOpenApproveOrg(group)}
                        >
                          Phê duyệt
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th style={{ width: "60px" }}>STT</th>
                          <th>Đảng viên</th>
                          <th>Tổ chức Đảng</th>
                          <th>Loại đề nghị</th>
                          <th>Ngày gửi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((p, idx) => (
                          <tr key={p.Id}>
                            <td>{idx + 1}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>
                                {p.HoTenDangDung}
                              </div>
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "var(--color-text-secondary)",
                                }}
                              >
                                Thẻ: {p.SoTheDangVien || "-"}
                              </div>
                            </td>
                            <td>{p.TenToChucDang || "-"}</td>
                            <td>{loaiDeXuatLabel(p.LoaiDeXuat)}</td>
                            <td>{formatDate(p.CreatedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Đã phê duyệt */}
        {activeTab === "approved" && (
          <div>
            <div
              className="card-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 className="card-title">
                Quyết định trao tặng Huy hiệu Đảng đã được phê duyệt
              </h3>
              <span
                className="text-muted"
                style={{ fontSize: "var(--font-size-xs)" }}
              >
                Tổng số: {approvedList.length} quyết định
              </span>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: "60px" }}>STT</th>
                    <th>Đảng viên</th>
                    <th>Đơn vị Đảng</th>
                    <th>Mốc trao tặng</th>
                    <th>Số Huy hiệu</th>
                    <th>Số Quyết định</th>
                    <th>Ngày quyết định</th>
                    <th>Tài liệu</th>
                    <th style={{ width: "120px", textAlign: "center" }}>
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {approvedList.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={emptyCellStyle}>
                        Chưa có quyết định Huy hiệu nào được phê duyệt.
                      </td>
                    </tr>
                  ) : (
                    approvedList.map((p, idx) => (
                      <tr key={p.Id}>
                        <td>{idx + 1}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>
                            {p.HoTenDangDung}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            Thẻ: {p.SoTheDangVien || "-"}
                          </div>
                        </td>
                        <td>{p.TenToChucDang}</td>
                        <td>
                          <span
                            style={{
                              fontWeight: "bold",
                              color: "var(--color-accent)",
                            }}
                          >
                            {p.MocHuyHieu} năm tuổi Đảng
                          </span>
                        </td>
                        <td>
                          <code>{p.SoHuyHieu || "-"}</code>
                        </td>
                        <td>
                          {p.QuyetDinh?.SoQuyetDinh ||
                          p.SoQuyetDinhTapThe ||
                          p.SoQuyetDinhCaNhan ? (
                            <button
                              className="btn-link"
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--color-accent)",
                                fontWeight: "bold",
                                cursor: "pointer",
                                padding: 0,
                                textDecoration: "underline",
                                textAlign: "left",
                              }}
                              onClick={() => handlePreviewDecisionClick(p)}
                            >
                              {p.QuyetDinh?.SoQuyetDinh ||
                                p.SoQuyetDinhTapThe ||
                                p.SoQuyetDinhCaNhan}
                            </button>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>{formatDate(p.NgayQuyetDinh)}</td>
                        <td>
                          {p.QuyetDinh?.TaiLieuUrl || p.TaiLieuUrl ? (
                            <button
                              className="btn-link"
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--color-accent)",
                                fontWeight: "600",
                                cursor: "pointer",
                                padding: 0,
                                textDecoration: "underline",
                              }}
                              onClick={() => handlePreviewDecisionClick(p)}
                            >
                              {p.QuyetDinh?.TaiLieuName ||
                                p.TaiLieuName ||
                                "Xem quyết định"}
                            </button>
                          ) : (
                            <span
                              className="text-muted"
                              style={{ fontStyle: "italic" }}
                            >
                              Chưa đính kèm
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                            onClick={() => handleOpenUpdate(p)}
                            title="Điền số huy hiệu / cập nhật quyết định cho cá nhân"
                          >
                            Cập nhật
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Bị từ chối */}
        {activeTab === "rejected" && (
          <div>
            <div
              className="card-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 className="card-title">Các đề nghị bị từ chối phê duyệt</h3>
              <span
                className="text-muted"
                style={{ fontSize: "var(--font-size-xs)" }}
              >
                Tổng số: {rejectedList.length}
              </span>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: "60px" }}>STT</th>
                    <th>Đảng viên</th>
                    <th>Đơn vị Đảng</th>
                    <th>Mốc đề nghị</th>
                    <th>Lý do từ chối</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {rejectedList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={emptyCellStyle}>
                        Không có đề nghị nào bị từ chối.
                      </td>
                    </tr>
                  ) : (
                    rejectedList.map((p, idx) => (
                      <tr key={p.Id}>
                        <td>{idx + 1}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>
                            {p.HoTenDangDung}
                          </div>
                        </td>
                        <td>{p.TenToChucDang}</td>
                        <td>
                          <strong>Huy hiệu {p.MocHuyHieu} năm</strong>
                        </td>
                        <td
                          style={{
                            color: "var(--color-error)",
                            fontStyle: "italic",
                          }}
                        >
                          {p.LyDoTuChoi}
                        </td>
                        <td>{formatDate(p.CreatedAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Đề nghị thủ công (tạo DRAFT) */}
      {proposeModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setProposeModalOpen(false)}
        >
          <div
            className="modal animate-scale-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "480px", width: "90%" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                Thêm đề nghị vào danh sách (thủ công)
              </h3>
              <button
                className="btn-close"
                onClick={() => setProposeModalOpen(false)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleProposeSubmit}>
              <div
                className="modal-body"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--spacing-md)",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Chọn đảng viên</label>
                  <select
                    className="form-select"
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    required
                  >
                    <option value="">Chọn đảng viên</option>
                    {inScopeMembers
                      .filter((m) => m.NgayVaoDang)
                      .map((m) => (
                        <option key={m.Id} value={m.Id}>
                          {m.HoTenDangDung}{" "}
                          {m.SoTheDangVien ? `- ${m.SoTheDangVien}` : ""}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Chọn mốc đề nghị Huy hiệu Đảng
                  </label>
                  <select
                    className="form-select"
                    value={selectedMilestone}
                    onChange={(e) =>
                      setSelectedMilestone(parseInt(e.target.value, 10))
                    }
                    required
                  >
                    <option value="">Chọn mốc Huy hiệu</option>
                    {BADGE_MILESTONES.map((mil) => (
                      <option key={mil} value={mil}>
                        Huy hiệu {mil} năm tuổi Đảng
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Loại đề nghị xét tặng</label>
                  <select
                    className="form-select"
                    value={loaiDeXuat}
                    onChange={(e) => setLoaiDeXuat(e.target.value)}
                    required
                  >
                    <option value="CAP_MOI">Cấp mới (Đạt thâm niên)</option>
                    <option value="CAP_LAI">
                      Cấp lại (Bị mất, hỏng, cấp đổi)
                    </option>
                    <option value="TRUY_TANG">
                      Truy tặng (Cho đảng viên đã qua đời)
                    </option>
                  </select>
                </div>
              </div>
              <div
                className="modal-footer"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "var(--spacing-sm)",
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setProposeModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Đang thêm" : "Thêm vào danh sách"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Phê duyệt cả danh sách của tổ chức */}
      {approveModalOpen && selectedOrg && (
        <div
          className="modal-overlay"
          onClick={() => setApproveModalOpen(false)}
        >
          <div
            className="modal animate-scale-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "520px", width: "90%" }}
          >
            <div className="modal-header">
              <h3
                className="modal-title"
                style={{ color: "var(--color-success)" }}
              >
                Phê duyệt danh sách Huy hiệu Đảng
              </h3>
              <button
                className="btn-close"
                onClick={() => setApproveModalOpen(false)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleApproveSubmit}>
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
                    padding: "14px",
                    background: "rgba(27, 46, 79, 0.03)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid rgba(148, 163, 184, 0.25)",
                  }}
                >
                  <div style={{ color: "var(--color-text-primary)" }}>
                    Mốc huy hiệu:{" "}
                    <strong
                      style={{ color: "var(--color-accent)", fontWeight: 600 }}
                    >
                      {selectedOrg.mocHuyHieu} năm
                    </strong>
                  </div>
                  <div style={{ color: "var(--color-text-primary)" }}>
                    Số đề nghị trong danh sách:{" "}
                    <strong
                      style={{
                        color: "var(--color-gold-dark)",
                        fontWeight: 600,
                      }}
                    >
                      {selectedOrg.items.length}
                    </strong>
                  </div>
                  <div
                    style={{
                      fontSize: "var(--font-size-xs)",
                      color: "var(--color-text-secondary)",
                      marginTop: "4px",
                    }}
                  >
                    Một quyết định chung áp dụng cho cả danh sách. Số Huy hiệu
                    của từng đảng viên có thể bổ sung sau ở tab "Quyết định đã
                    duyệt".
                  </div>
                </div>

                <DecisionFormFields
                  value={approveDecisionForm}
                  onChange={(patch) =>
                    setApproveDecisionForm((f) => ({ ...f, ...patch }))
                  }
                  existingDecisions={existingDecisions}
                  emptyDecisionsMessage="Chưa có quyết định huy hiệu Đảng nào trong hệ thống."
                  showTenQuyetDinh={false}
                  requireNewFields
                  disabled={actionLoading}
                />
              </div>
              <div
                className="modal-footer"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "var(--spacing-sm)",
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setApproveModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-success) 0%, #166534 100%)",
                    color: "#ffffff",
                    border: "none",
                    boxShadow: "0 2px 6px rgba(22, 101, 52, 0.2)",
                  }}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? "Đang phê duyệt"
                    : `Phê duyệt ${selectedOrg.items.length} đề nghị`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Từ chối cả danh sách của tổ chức */}
      {rejectModalOpen && selectedOrg && (
        <div
          className="modal-overlay"
          onClick={() => setRejectModalOpen(false)}
        >
          <div
            className="modal animate-scale-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "450px", width: "90%" }}
          >
            <div className="modal-header">
              <h3
                className="modal-title"
                style={{ color: "var(--color-error)" }}
              >
                Từ chối danh sách Huy hiệu Đảng
              </h3>
              <button
                className="btn-close"
                onClick={() => setRejectModalOpen(false)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleRejectSubmit}>
              <div
                className="modal-body"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--spacing-md)",
                }}
              >
                <div>
                  Đồng chí đang từ chối{" "}
                  <strong>{selectedOrg.items.length}</strong> đề nghị Huy hiệu{" "}
                  <strong>{selectedOrg.mocHuyHieu} năm</strong> (gộp mọi tổ chức
                  Đảng).
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Lý do từ chối (áp dụng cho cả danh sách)
                  </label>
                  <textarea
                    className="form-input"
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Nhập lý do chi tiết từ chối"
                    required
                  />
                </div>
              </div>
              <div
                className="modal-footer"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "var(--spacing-sm)",
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setRejectModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Đang xử lý" : "Xác nhận từ chối"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cập nhật quyết định / số huy hiệu cá nhân */}
      {updateModalOpen && selectedUpdateProposal && (
        <div
          className="modal-overlay"
          onClick={() => setUpdateModalOpen(false)}
        >
          <div
            className="modal animate-scale-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "520px", width: "90%" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Cập nhật quyết định trao tặng</h3>
              <button
                className="btn-close"
                onClick={() => setUpdateModalOpen(false)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit}>
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
                    padding: "14px",
                    background: "rgba(27, 46, 79, 0.03)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid rgba(148, 163, 184, 0.25)",
                  }}
                >
                  <div style={{ color: "var(--color-text-primary)" }}>
                    Đảng viên:{" "}
                    <strong style={{ fontWeight: 600 }}>
                      {selectedUpdateProposal.HoTenDangDung}
                    </strong>
                  </div>
                  <div style={{ color: "var(--color-text-primary)" }}>
                    Huy hiệu:{" "}
                    <strong
                      style={{
                        color: "var(--color-gold-dark)",
                        fontWeight: 600,
                      }}
                    >
                      {selectedUpdateProposal.MocHuyHieu} năm tuổi Đảng
                    </strong>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Số Huy hiệu Đảng (cá nhân)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={soHuyHieuUpdate}
                    onChange={(e) => setSoHuyHieuUpdate(e.target.value)}
                    placeholder="Ví dụ: HH-30-12345"
                  />
                </div>
                <div
                  className="form-group"
                  style={{ marginBottom: "var(--spacing-md)" }}
                >
                  <label
                    className="form-label"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      textTransform: "none",
                      fontWeight: 500,
                      fontSize: "var(--font-size-base)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isExistingDecisionUpdate}
                      onChange={(e) =>
                        setIsExistingDecisionUpdate(e.target.checked)
                      }
                      style={{
                        width: "16px",
                        height: "16px",
                        accentColor: "var(--color-accent)",
                        cursor: "pointer",
                      }}
                    />
                    Liên kết Quyết định đã ban hành trên hệ thống
                  </label>
                </div>
                {isExistingDecisionUpdate ? (
                  <div className="form-group">
                    <label className="form-label">
                      Chọn quyết định trong danh sách
                    </label>
                    <select
                      className="form-select"
                      value={quyetDinhIdUpdate}
                      onChange={(e) => setQuyetDinhIdUpdate(e.target.value)}
                      required
                    >
                      <option value="">Chọn quyết định</option>
                      {existingDecisions.map((qd) => (
                        <option key={qd.id} value={qd.id}>
                          Số: {qd.soQuyetDinh} -{" "}
                          {qd.tenQuyetDinh || "Quyết định không tên"} (
                          {new Date(qd.ngayBanHanh).toLocaleDateString("vi-VN")}
                          )
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">
                        Số Quyết định cá nhân
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={soQuyetDinhCaNhanUpdate}
                        onChange={(e) =>
                          setSoQuyetDinhCaNhanUpdate(e.target.value)
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        Số Quyết định tập thể
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={soQuyetDinhTapTheUpdate}
                        onChange={(e) =>
                          setSoQuyetDinhTapTheUpdate(e.target.value)
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ngày quyết định</label>
                      <input
                        type="date"
                        className="form-input"
                        value={ngayQuyetDinhUpdate}
                        onChange={(e) => setNgayQuyetDinhUpdate(e.target.value)}
                      />
                    </div>
                    {selectedUpdateProposal.taiLieuUrl &&
                    !deleteAttachmentFlag ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px",
                          background: "rgba(58, 143, 92, 0.1)",
                          borderRadius: "4px",
                          border: "1px solid rgba(58, 143, 92, 0.2)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            color: "var(--color-success)",
                            fontWeight: 600,
                          }}
                        >
                          Đã đính kèm:{" "}
                          {selectedUpdateProposal.taiLieuName || "quyết định"}
                        </span>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{
                            color: "var(--color-error)",
                            border: "1px solid var(--color-error)",
                            padding: "4px 8px",
                          }}
                          onClick={() => setDeleteAttachmentFlag(true)}
                        >
                          Xóa file đính kèm
                        </button>
                      </div>
                    ) : (
                      <div className="form-group">
                        <label className="form-label">
                          Tải lên văn bản quyết định mới
                        </label>
                        <div
                          style={{
                            border: "2px dashed rgba(148, 163, 184, 0.35)",
                            borderRadius: "var(--radius-md)",
                            padding: "16px",
                            textAlign: "center",
                            background: "rgba(255, 255, 255, 0.40)",
                            cursor: "pointer",
                          }}
                          onClick={() => updateFileInputRef.current?.click()}
                        >
                          <input
                            type="file"
                            ref={updateFileInputRef}
                            style={{ display: "none" }}
                            onChange={(e) =>
                              setUpdateFile(e.target.files?.[0] || null)
                            }
                            accept=".pdf,.png,.jpg,.jpeg"
                          />
                          <div
                            style={{
                              fontSize: "var(--font-size-sm)",
                              fontWeight: 600,
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            {updateFile
                              ? `Đã chọn: ${updateFile.name}`
                              : "Nhấn để chọn tệp quyết định đính kèm mới"}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--color-text-muted)",
                              marginTop: "4px",
                            }}
                          >
                            Hỗ trợ PDF, JPG, PNG (tối đa 10MB)
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div
                className="modal-footer"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "var(--spacing-sm)",
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setUpdateModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Đang cập nhật" : "Cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
