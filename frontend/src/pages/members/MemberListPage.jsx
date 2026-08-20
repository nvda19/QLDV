import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiTrash2,
  FiAlertTriangle,
  FiChevronDown,
} from "../../components/icons";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { ROLES, ITEMS_PER_PAGE } from "../../utils/constants";
import { formatDate, downloadBlob } from "../../utils/helpers";
import memberApi from "../../api/memberApi";
import orgApi from "../../api/orgApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import ConfirmModal from "../../components/common/ConfirmModal";
import DetailPersonalInfo from "../../components/members/DetailPersonalInfo";
import DetailPartyInfo from "../../components/members/DetailPartyInfo";
import DetailHistoryTables from "../../components/members/DetailHistoryTables";
import DetailFamilyTable from "../../components/members/DetailFamilyTable";
import DetailEconomicInfo from "../../components/members/DetailEconomicInfo";
import PageHeader from "../../components/common/PageHeader";
import DecisionPreviewModal from "../../components/common/DecisionPreviewModal";
import GlassSelect from "../../components/common/GlassSelect";
import GlassSearch from "../../components/common/GlassSearch";

const renderSplitBoxes = (val, group1Len, group2Len) => {
  const cleanVal = String(val || "").replace(/[^0-9A-Za-z-]/g, ""); // Chỉ giữ lại chữ và số
  const chars = cleanVal.split("");

  const makeGroup = (start, len) => {
    const cells = [];
    for (let i = 0; i < len; i++) {
      const idx = start + i;
      cells.push(
        <span
          key={i}
          style={{
            display: "inline-block",
            width: "12px",
            height: "16px",
            border: "1px solid #111111",
            textAlign: "center",
            lineHeight: "16px",
            fontSize: "9.5pt",
            fontFamily: '"Times New Roman", Times, serif',
            fontWeight: "bold",
            marginLeft: i === 0 ? "0" : "-1px",
            color: "#000000",
          }}
        >
          {chars[idx] || ""}
        </span>,
      );
    }
    return <span style={{ display: "inline-flex" }}>{cells}</span>;
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        marginLeft: "6px",
      }}
    >
      {makeGroup(0, group1Len)}
      {group2Len > 0 && makeGroup(group1Len, group2Len)}
    </span>
  );
};

const showVal = (val) => {
  if (val === 0 || val === "0") return "0";
  if (val === false) return "Không";
  if (!val || String(val).trim() === "" || val === "—") return ".......";
  return val;
};

const cleanOrgName = (name) => {
  if (!name) return "";
  return name
    .replace(/^(Đảng bộ|Đảng bộ|Chi bộ cơ sở|Chi bộ bộ phận|Chi bộ)\s+/i, "")
    .trim();
};

// Quy đổi cấp bậc quân hàm sang số thứ tự để tiện so sánh khi sắp xếp
const getRankPriority = (rank) => {
  if (!rank) return 999;
  const r = rank.trim();

  // Nhóm sĩ quan
  if (r === "Đại tướng") return 1;
  if (r === "Thượng tướng") return 2;
  if (r === "Trung tướng") return 3;
  if (r === "Thiếu tướng") return 4;
  if (r === "Đại tá") return 5;
  if (r === "Thượng tá") return 6;
  if (r === "Trung tá") return 7;
  if (r === "Thiếu tá") return 8;
  if (r === "Đại úy") return 9;
  if (r === "Thượng úy") return 10;
  if (r === "Trung úy") return 11;
  if (r === "Thiếu úy") return 12;

  // Nhóm quân nhân chuyên nghiệp (QNCN)
  if (r === "Thượng tá QNCN") return 20;
  if (r === "Trung tá QNCN") return 21;
  if (r === "Thiếu tá QNCN") return 22;
  if (r === "Đại úy QNCN") return 23;
  if (r === "Thượng úy QNCN") return 24;
  if (r === "Trung úy QNCN") return 25;
  if (r === "Thiếu úy QNCN") return 26;
  if (r === "Chuẩn úy QNCN") return 27;

  // Nhóm học viên / hạ sĩ quan / binh sĩ
  if (r === "Thượng sĩ") return 30;
  if (r === "Trung sĩ") return 31;
  if (r === "Hạ sĩ") return 32;
  if (r === "Binh nhất") return 33;
  if (r === "Binh nhì") return 34;
  if (
    r.toLowerCase().includes("học viên") ||
    r.toLowerCase().includes("hoc vien")
  )
    return 35;

  if (r.toLowerCase().includes("qncn")) return 29;

  return 100; // Trường hợp còn lại xếp cuối cùng
};

const getPartyPositionPriority = (pos) => {
  if (!pos) return 999;
  const p = pos.toLowerCase().trim();

  if (p.includes("bí thư Đảng bộ") || p.includes("btđu")) return 1;
  if (p.includes("phó bí thư Đảng bộ") || p.includes("pbtđu")) return 2;
  if (p.includes("Đảng bộ viên") || p.includes("đuv")) return 3;
  if (p.includes("bí thư chi bộ") || p.includes("btcb") || p.includes("bí thư"))
    return 4;
  if (
    p.includes("phó bí thư chi bộ") ||
    p.includes("pbtcb") ||
    p.includes("phó bí thư")
  )
    return 5;
  if (
    p.includes("chi ủy viên") ||
    p.includes("cuv") ||
    p.includes("cấp ủy viên") ||
    p.includes("ủy viên ban chấp hành")
  )
    return 6;

  return 100;
};

const compareMembers = (a, b) => {
  // Ưu tiên 1: chức vụ Đảng
  const pA_pos = getPartyPositionPriority(a.ChucVuDang);
  const pB_pos = getPartyPositionPriority(b.ChucVuDang);
  if (pA_pos !== pB_pos) {
    return pA_pos - pB_pos;
  }

  // Ưu tiên 2: cấp bậc quân hàm
  const pA_rank = getRankPriority(a.CapBac);
  const pB_rank = getRankPriority(b.CapBac);
  if (pA_rank !== pB_rank) {
    return pA_rank - pB_rank;
  }

  // Còn lại thì so sánh theo họ tên (bảng chữ cái tiếng Việt)
  return (a.HoTenDangDung || "").localeCompare(b.HoTenDangDung || "", "vi", {
    sensitivity: "base",
  });
};

export default function MemberListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [importErrors, setImportErrors] = useState([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [failedExcelBase64, setFailedExcelBase64] = useState(null);
  const [importDuplicates, setImportDuplicates] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState(null);

  // Các state phục vụ layout chia đôi: cây tổ chức dạng accordion bên trái, hồ sơ chi tiết bên phải
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberLoading, setMemberLoading] = useState(false);
  const [expandedOrgs, setExpandedOrgs] = useState({});
  const [previewDoc, setPreviewDoc] = useState(null);

  const isBiThu = user?.role === ROLES.BI_THU;
  const isCanBo = user?.role === ROLES.CAN_BO_CHINH_TRI;
  const canWrite = isBiThu || isCanBo;

  useEffect(() => {
    fetchMembers();
    fetchOrganizations();
  }, []);

  // Mỗi khi đổi đảng viên đang chọn thì gọi API lấy lại hồ sơ đầy đủ
  useEffect(() => {
    if (!selectedMemberId) {
      setSelectedMember(null);
      return;
    }
    const fetchSelectedMember = async () => {
      try {
        setMemberLoading(true);
        const res = await memberApi.getById(selectedMemberId);
        setSelectedMember(res.data);
      } catch (err) {
        toast.error("Không thể tải thông tin chi tiết đảng viên.");
      } finally {
        setMemberLoading(false);
      }
    };
    fetchSelectedMember();
  }, [selectedMemberId]);

  const fetchOrganizations = async () => {
    try {
      const res = await orgApi.getAll();
      setOrganizations(res.data || []);
    } catch (err) {
      console.error("Không thể tải danh sách tổ chức Đảng:", err);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await memberApi.getAll();
      setMembers(res.data || []);
    } catch (err) {
      toast.error("Không thể tải danh sách đảng viên.");
    } finally {
      setLoading(false);
    }
  };

  // Lọc danh sách theo từ khóa tìm kiếm và tổ chức đảng đang chọn
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.HoTenDangDung?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.SoLyLich?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.SoTheDangVien?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOrg = selectedOrgId ? m.ToChucDangId === selectedOrgId : true;

    return matchesSearch && matchesOrg;
  });

  // Áp lại thứ tự ưu tiên: chức vụ Đảng, quân hàm rồi mới đến tên
  const sortedFilteredMembers = [...filteredMembers].sort(compareMembers);

  // Cắt danh sách theo trang hiện tại
  const totalPages = Math.ceil(sortedFilteredMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = sortedFilteredMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Đổi từ khóa hay đổi tổ chức lọc thì quay về trang đầu tiên
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedOrgId]);

  const isMemberMatchSearch = (m) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      m.HoTenDangDung?.toLowerCase().includes(term) ||
      m.SoLyLich?.toLowerCase().includes(term) ||
      m.SoTheDangVien?.toLowerCase().includes(term)
    );
  };

  // Duyệt đệ quy cây tổ chức, lọc và đếm số đảng viên khớp từ khóa ở từng nhánh
  const filterAndCountTree = (node) => {
    // Những đảng viên trực thuộc node này mà khớp từ khóa
    const matchedDirectMembers = (node.members || []).filter(
      isMemberMatchSearch,
    );

    // Gọi lại chính hàm này cho từng tổ chức con
    const processedChildren = (node.children || [])
      .map((child) => filterAndCountTree(child))
      // Khi đang tìm kiếm thì ẩn bớt các nhánh con không có kết quả nào
      .filter((child) => !searchTerm || child.totalMatchedCount > 0);

    // Cộng dồn số lượng khớp của node hiện tại với các node con
    const totalMatchedCount =
      matchedDirectMembers.length +
      processedChildren.reduce(
        (sum, child) => sum + child.totalMatchedCount,
        0,
      );

    return {
      ...node,
      // Sắp xếp lại danh sách đảng viên khớp theo cùng quy tắc ưu tiên
      matchedMembers: [...matchedDirectMembers].sort(compareMembers),
      children: processedChildren,
      totalMatchedCount,
    };
  };

  // Dựng cây phân cấp tổ chức Đảng rồi gán từng đảng viên vào đúng nhánh
  const buildOrgTree = () => {
    // Bước 1: dựng map tra cứu nhanh theo id tổ chức
    const orgMap = {};
    organizations.forEach((org) => {
      orgMap[org.id] = { ...org, children: [], members: [] };
    });

    // Bước 2: đưa từng đảng viên vào đúng tổ chức đang quản lý
    members.forEach((m) => {
      if (orgMap[m.ToChucDangId]) {
        orgMap[m.ToChucDangId].members.push(m);
      }
    });

    // Bước 3: nối các tổ chức lại thành cây cha - con
    const rootOrgs = [];
    organizations.forEach((org) => {
      const node = orgMap[org.id];
      if (!node.parentId || !orgMap[node.parentId]) {
        rootOrgs.push(node);
      } else {
        orgMap[node.parentId].children.push(node);
      }
    });

    // Bước 4: nếu người dùng chỉ được xem/đang lọc theo một tổ chức cụ thể thì thu gọn cây về đúng nhánh đó
    let selectedRoots = rootOrgs;
    if (isBiThu) {
      const selectedNode = orgMap[user?.orgId];
      selectedRoots = selectedNode ? [selectedNode] : [];
    } else if (selectedOrgId) {
      const selectedNode = orgMap[selectedOrgId];
      selectedRoots = selectedNode ? [selectedNode] : [];
    }

    // Bước 5: áp bộ lọc đệ quy lên từng cây gốc còn lại
    return selectedRoots.map((root) => filterAndCountTree(root));
  };

  // Cây tổ chức sau khi đã lọc theo từ khóa và tổ chức đang chọn
  const processedOrgTree = buildOrgTree();

  // Sau khi tải xong dữ liệu, tự động chọn sẵn một đảng viên để hiển thị hồ sơ
  useEffect(() => {
    if (
      members.length > 0 &&
      !selectedMemberId &&
      processedOrgTree.length > 0
    ) {
      const findFirstMember = (nodes) => {
        for (const node of nodes) {
          if (node.matchedMembers && node.matchedMembers.length > 0) {
            return node.matchedMembers[0].Id;
          }
          if (node.children && node.children.length > 0) {
            const foundId = findFirstMember(node.children);
            if (foundId) return foundId;
          }
        }
        return null;
      };

      const firstId = findFirstMember(processedOrgTree);
      if (firstId) {
        setSelectedMemberId(firstId);
      } else {
        setSelectedMemberId(members[0].Id);
      }
    }
  }, [members, processedOrgTree, selectedMemberId]);

  const toggleOrg = (orgId) => {
    setExpandedOrgs((prev) => ({
      ...prev,
      [orgId]: prev[orgId] === undefined ? false : !prev[orgId],
    }));
  };

  const isOrgExpanded = (orgId) => {
    return expandedOrgs[orgId] !== false; // mặc định mở, trừ khi người dùng đã đóng lại
  };

  // Render một node của cây tổ chức, gọi đệ quy xuống các node con
  const renderOrgNode = (orgNode, level = 0) => {
    // Không có kết quả khớp ở cả node này lẫn các nhánh con thì ẩn hẳn, đỡ rối giao diện
    if (searchTerm && orgNode.totalMatchedCount === 0) {
      return null;
    }

    const expanded = isOrgExpanded(orgNode.id);
    const hasMembers =
      orgNode.matchedMembers && orgNode.matchedMembers.length > 0;
    const hasChildren = orgNode.children && orgNode.children.length > 0;

    return (
      <div
        key={orgNode.id}
        className="tree-node"
        style={{ marginBottom: "12px" }}
      >
        <div
          className="tree-org-header"
          onClick={() => toggleOrg(orgNode.id)}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            background:
              "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
            borderRadius: "var(--radius-md)",
            color: "#ffffff",
            userSelect: "none",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="tree-org-name" style={{ fontWeight: 600 }}>
              {orgNode.name}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                fontSize: "13px",
                color: "var(--color-gold-light)",
                fontWeight: "normal",
              }}
            >
              ({orgNode.matchedMembers.length} đảng viên)
            </span>
            <span
              style={{
                display: "inline-flex",
                transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
                transition: "transform var(--transition-fast)",
                color: "var(--color-gold)",
                fontSize: "16px",
              }}
            >
              <FiChevronDown />
            </span>
          </div>
        </div>

        {expanded && (
          <div
            className="tree-node-content"
            style={{ paddingLeft: "4px", marginTop: "6px" }}
          >
            {hasMembers && (
              <div
                className="tree-members-list"
                style={{ marginBottom: "8px", overflowX: "auto" }}
              >
                <table
                  className="compact-table table"
                  style={{ width: "100%", tableLayout: "auto" }}
                >
                  <thead>
                    <tr>
                      <th style={{ width: "30px", padding: "4px 6px" }}>STT</th>
                      <th style={{ padding: "4px 6px" }}>Họ tên</th>
                      <th style={{ padding: "4px 6px" }}>Cấp bậc</th>
                      <th style={{ padding: "4px 6px" }}>Chức vụ Đảng</th>
                      {isBiThu && (
                        <th
                          style={{ width: "40px", padding: "4px 6px" }}
                          className="no-print"
                        >
                          Thao tác
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {orgNode.matchedMembers.map((member, idx) => {
                      const isSelected = member.Id === selectedMemberId;
                      return (
                        <tr
                          key={member.Id}
                          className={`clickable ${isSelected ? "active-row" : ""}`}
                          onClick={() => setSelectedMemberId(member.Id)}
                          style={{
                            cursor: "pointer",
                            backgroundColor: isSelected
                              ? "rgba(30, 64, 175, 0.08)"
                              : "transparent",
                            fontWeight: isSelected ? "600" : "normal",
                          }}
                        >
                          <td style={{ padding: "4px 6px" }}>{idx + 1}</td>
                          <td
                            style={{
                              color: isSelected
                                ? "var(--color-accent)"
                                : "inherit",
                              padding: "4px 6px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {member.HoTenDangDung}
                          </td>
                          <td
                            style={{ padding: "4px 6px", whiteSpace: "nowrap" }}
                          >
                            {member.CapBac || "—"}
                          </td>
                          <td
                            style={{ padding: "4px 6px", whiteSpace: "nowrap" }}
                          >
                            {member.ChucVuDang || "—"}
                          </td>
                          {isBiThu && (
                            <td
                              className="no-print"
                              onClick={(e) => e.stopPropagation()}
                              style={{ padding: "4px 6px" }}
                            >
                              <div className="table-actions">
                                {member.ToChucDangId === user?.orgId && (
                                  <button
                                    className="btn-icon"
                                    title="Xóa"
                                    onClick={() => setDeleteTarget(member)}
                                    style={{
                                      color: "var(--color-error)",
                                      padding: "4px",
                                    }}
                                  >
                                    <FiTrash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {hasChildren && (
              <div className="tree-children" style={{ marginTop: "6px" }}>
                {orgNode.children.map((child) =>
                  renderOrgNode(child, level + 1),
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await memberApi.deleteMember(deleteTarget.Id);
      toast.success("Đã xóa đảng viên thành công.");
      setMembers((prev) => prev.filter((m) => m.Id !== deleteTarget.Id));
    } catch (err) {
      toast.error("Không thể xóa đảng viên.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleImport = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadedFiles(files);
    setImporting(true);
    try {
      const res = await memberApi.importExcel(files, false);
      const data = res.data;
      const results = data?.results || [];
      const summary = data?.summary || {
        total: results.length,
        successCount: results.filter((r) => r.status === "success").length,
        updatedCount: results.filter((r) => r.status === "updated").length,
        duplicateCount: results.filter((r) => r.status === "duplicate").length,
        errorCount: results.filter((r) => r.status === "error").length,
      };

      const errors = results.filter((r) => r.status === "error");
      const duplicates = results.filter((r) => r.status === "duplicate");

      setImportSummary(summary);
      setImportErrors(errors);
      setImportDuplicates(duplicates);
      setFailedExcelBase64(data?.failedExcelBase64 || null);
      setShowErrorModal(true);

      if (summary.errorCount > 0 || summary.duplicateCount > 0) {
        if (summary.successCount > 0) {
          toast.success(
            `Đã import thành công ${summary.successCount} đảng viên. Phát hiện lỗi hoặc trùng lặp ở một số dòng.`,
          );
        } else {
          toast.error(
            "Không có hồ sơ nào được lưu thành công do lỗi hoặc trùng lặp.",
          );
        }
      } else {
        toast.success(
          `Import danh sách thành công! Đã lưu ${summary.successCount} đảng viên.`,
        );
      }
      await fetchMembers();
    } catch (err) {
      toast.error(err.message || "Import thất bại.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImportOverwrite = async () => {
    if (!uploadedFiles) return;
    setImporting(true);
    try {
      const res = await memberApi.importExcel(uploadedFiles, true);
      const data = res.data;
      const results = data?.results || [];
      const summary = data?.summary || {
        total: results.length,
        successCount: results.filter((r) => r.status === "success").length,
        updatedCount: results.filter((r) => r.status === "updated").length,
        duplicateCount: results.filter((r) => r.status === "duplicate").length,
        errorCount: results.filter((r) => r.status === "error").length,
      };

      const errors = results.filter((r) => r.status === "error");
      const duplicates = results.filter((r) => r.status === "duplicate");

      setImportSummary(summary);
      setImportErrors(errors);
      setImportDuplicates(duplicates);
      setFailedExcelBase64(data?.failedExcelBase64 || null);

      toast.success(
        `Ghi đè thành công! Đã lưu mới ${summary.successCount} và cập nhật ${summary.updatedCount} hồ sơ trùng lặp.`,
      );
      await fetchMembers();
    } catch (err) {
      toast.error(err.message || "Ghi đè import thất bại.");
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadFailedExcel = () => {
    if (!failedExcelBase64) return;
    try {
      const byteCharacters = atob(failedExcelBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(blob, "Ho_So_Loi_Import.xlsx");
      toast.success("Tải xuống tệp Excel hồ sơ lỗi thành công!");
    } catch (err) {
      toast.error("Không thể tải xuống tệp Excel lỗi.");
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await memberApi.downloadTemplate();
      const blob =
        res instanceof Blob
          ? res
          : new Blob([res], {
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
      downloadBlob(blob, "Mau_Import_DangVien.xlsx");
      toast.success("Tải xuống file Excel import mẫu thành công!");
    } catch (err) {
      toast.error("Không thể tải file Excel mẫu.");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page">
      <PageHeader
        title="Danh sách Đảng viên"
        noPrint
        actions={
          canWrite ? (
            <>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/members/new")}
                style={{ boxShadow: "var(--shadow-sm)" }}
              >
                Thêm mới
              </button>
              <button
                className="btn btn-outline"
                onClick={handleDownloadTemplate}
                disabled={importing}
                title="Tải file mẫu Excel dùng để import"
                style={{ boxShadow: "var(--shadow-sm)" }}
              >
                Tải file nhập hàng loạt
              </button>
              <div className="file-input-wrapper">
                <button
                  className="btn btn-outline"
                  disabled={importing}
                  title="Chọn file Excel (.xlsx) cùng các file đính kèm trực tiếp (hoặc file nén .zip)"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                >
                  {importing ? "Đang import..." : "Nhập hàng loạt"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.zip,image/*,application/pdf"
                  onChange={handleImport}
                  disabled={importing}
                  multiple
                />
              </div>
            </>
          ) : null
        }
      />

      {/* Bố cục chia đôi màn hình theo đúng thiết kế wireframe */}
      <div
        className="split-layout"
        style={{
          display: "grid",
          gridTemplateColumns: "45% 55%",
          gap: "20px",
          alignItems: "start",
          marginTop: "16px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Cột trái: bộ lọc và cây tổ chức dạng accordion, ẩn khi in */}
        <div
          className="org-tree-container no-print"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            maxHeight: "calc(100vh - 150px)",
            paddingRight: "5px",
          }}
        >
          {/* Khu vực tìm kiếm và lọc theo tổ chức */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              width: "100%",
            }}
          >
            <GlassSearch
              placeholder="Họ tên, số lý lịch, số thẻ..."
              value={searchTerm}
              onChange={setSearchTerm}
              style={{ flex: 1, width: "100%" }}
            />
            {isCanBo && (
              <GlassSelect
                value={selectedOrgId}
                onChange={setSelectedOrgId}
                options={organizations}
                placeholder="Tất cả tổ chức"
                size="small"
                style={{
                  width: "100%",
                  flex: 1,
                  boxShadow: "var(--shadow-sm)",
                  borderRadius: "var(--radius-md)",
                }}
              />
            )}
          </div>

          {/* Danh sách cây tổ chức dạng accordion, hoặc trạng thái rỗng nếu không có kết quả */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              overflowY: "auto",
              maxHeight: "calc(100vh - 210px)",
              paddingRight: "5px",
            }}
          >
            {filteredMembers.length === 0 ? (
              <div style={{ padding: "20px 0" }}>
                <EmptyState
                  icon={FiUsers}
                  title="Không tìm thấy đảng viên"
                  message={
                    searchTerm
                      ? "Không có kết quả phù hợp với từ khóa tìm kiếm."
                      : "Chưa có đảng viên nào trong hệ thống."
                  }
                />
              </div>
            ) : (
              processedOrgTree.map((org) => renderOrgNode(org))
            )}
          </div>
        </div>

        {/* Cột phải: hồ sơ chi tiết dạng phiếu/lý lịch đảng viên khổ A4 */}
        <div
          className="profile-detail-column"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            maxHeight: "calc(100vh - 150px)",
          }}
        >
          {/* Thanh nút thao tác, chỉ hiện trên web chứ không in ra */}
          <div
            className="card no-print"
            style={{
              padding: "10px 18px",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ display: "flex", gap: "10px" }}>
              {selectedMember && (
                <>
                  {((isBiThu && selectedMember.ToChucDangId === user?.orgId) ||
                    (isCanBo &&
                      selectedMember.ToChucDang?.ParentId === null)) && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() =>
                        navigate(`/members/${selectedMember.Id}/edit`)
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "var(--shadow-sm)",
                      }}
                    >
                      <span>Chỉnh sửa hồ sơ Đảng viên</span>
                    </button>
                  )}
                  <button
                    className="btn btn-accent btn-sm"
                    onClick={() => window.print()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <span>In phiếu Đảng viên</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Nội dung hồ sơ, trình bày như tờ giấy A4 */}
          {memberLoading ? (
            <div
              className="card"
              style={{
                padding: "50px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <LoadingSpinner />
            </div>
          ) : !selectedMember ? (
            <div
              className="card"
              style={{ padding: "50px", textAlign: "center" }}
            >
              <EmptyState
                icon={FiUsers}
                title="Chưa chọn đảng viên"
                message="Vui lòng chọn một đảng viên từ danh sách bên trái để hiển thị chi tiết phiếu lý lịch."
              />
            </div>
          ) : (
            <div
              className="print-paper-container"
              style={{
                padding: "0",
                backgroundColor: "transparent",
                border: "none",
                boxShadow: "none",
                maxHeight: "calc(100vh - 220px)",
                overflowY: "auto",
                boxSizing: "border-box",
              }}
            >
              <div
                className="print-paper"
                style={{
                  margin: "0 auto",
                  padding: "15mm 10mm",
                  width: "100%",
                  maxWidth: "210mm",
                  boxSizing: "border-box",
                }}
              >
                {/* Phần tiêu đề chỉ dùng khi xem trên web, không xuất hiện lúc in */}
                <div
                  className="print-paper-header no-print"
                  style={{
                    borderBottom: "none",
                    paddingBottom: 0,
                    marginBottom: "20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      fontSize: "10pt",
                      lineHeight: "1.4",
                      marginBottom: "5px",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    <div style={{ textAlign: "left", minWidth: "180px" }}>
                      <div>
                        SỐ LÝ LỊCH:{" "}
                        <span className="font-bold">
                          {selectedMember.SoLyLich || "..................."}
                        </span>
                      </div>
                      <div>
                        SỐ THẺ ĐẢNG VIÊN:{" "}
                        <span className="font-bold">
                          {selectedMember.SoTheDangVien ||
                            "..................."}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      width: "100%",
                    }}
                  >
                    <div
                      className="print-paper-title"
                      style={{
                        fontSize: "20pt",
                        color: "var(--color-text-primary)",
                        fontWeight: "bold",
                        margin: 0,
                        lineHeight: 1.2,
                      }}
                    >
                      PHIẾU ĐẢNG VIÊN
                    </div>
                  </div>
                </div>

                {/* Phần tiêu đề riêng dành cho bản in ra giấy/PDF, theo đúng mẫu phiếu chính thức */}
                <div
                  className="print-paper-header print-only-item"
                  style={{
                    borderBottom: "none",
                    paddingBottom: 0,
                    marginBottom: "25px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                  }}
                >
                  {/* Dòng tiêu ngữ quốc gia ở trên cùng */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      width: "100%",
                      marginBottom: "5px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12pt",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        textDecoration: "underline",
                        color: "#000000",
                      }}
                    >
                      ĐẢNG CỘNG SẢN VIỆT NAM
                    </div>
                  </div>

                  {/* Khối số lý lịch/số thẻ, nằm dưới tiêu ngữ và căn về bên phải */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      width: "100%",
                      marginBottom: "15px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        fontSize: "9.5pt",
                        lineHeight: "1.4",
                        color: "#000000",
                        paddingRight: "5px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: "4px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span
                          style={{
                            width: "140px",
                            textAlign: "left",
                            display: "inline-block",
                            fontWeight: "normal",
                          }}
                        >
                          SỐ LÝ LỊCH:
                        </span>
                        {renderSplitBoxes(selectedMember.SoLyLich, 6, 3)}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span
                          style={{
                            width: "140px",
                            textAlign: "left",
                            display: "inline-block",
                            fontWeight: "normal",
                          }}
                        >
                          SỐ THẺ ĐẢNG VIÊN:
                        </span>
                        {renderSplitBoxes(selectedMember.SoTheDangVien, 2, 6)}
                      </div>
                    </div>
                  </div>

                  {/* Khối giữa chia làm ba cột, có khoảng cách đều giữa các cột */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                      marginTop: "12px",
                    }}
                  >
                    {/* Cột 1 (40% bên trái): thông tin phân cấp tổ chức Đảng */}
                    <div
                      style={{
                        width: "40%",
                        fontSize: "10pt",
                        lineHeight: "1.5",
                        fontFamily: '"Times New Roman", Times, serif',
                        color: "#000000",
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "bold",
                          textAlign: "center",
                          width: "100%",
                          marginBottom: "8px",
                        }}
                      >
                        ĐẢNG BỘ QUÂN ĐỘI
                      </div>
                      <div style={{ marginBottom: "2px" }}>
                        <span>ĐẢNG BỘ: </span>
                        <span
                          style={{
                            borderBottom: "1px solid #111111",
                            fontWeight: "bold",
                          }}
                        >
                          {showVal(
                            cleanOrgName(selectedMember.ToChucDang?.level1),
                          )}
                        </span>
                      </div>
                      <div style={{ marginBottom: "2px" }}>
                        <span>ĐẢNG BỘ: </span>
                        <span
                          style={{
                            borderBottom: "1px solid #111111",
                            fontWeight: "bold",
                          }}
                        >
                          {showVal(
                            cleanOrgName(selectedMember.ToChucDang?.level2),
                          )}
                        </span>
                      </div>
                      <div style={{ marginBottom: "2px" }}>
                        <span>ĐẢNG BỘ, CHI BỘ CƠ SỞ: </span>
                        <span
                          style={{
                            borderBottom: "1px solid #111111",
                            fontWeight: "bold",
                          }}
                        >
                          {showVal(
                            cleanOrgName(
                              selectedMember.ToChucDang?.level3 ||
                                selectedMember.ToChucDang?.Ten,
                            ),
                          )}
                        </span>
                      </div>
                      <div style={{ marginBottom: "2px" }}>
                        <span>ĐẢNG BỘ BỘ PHẬN: </span>
                        <span
                          style={{
                            borderBottom: "1px solid #111111",
                            fontWeight: "bold",
                          }}
                        >
                          {showVal(null)}
                        </span>
                      </div>
                      <div style={{ marginBottom: "2px" }}>
                        <span>CHI BỘ: </span>
                        <span
                          style={{
                            borderBottom: "1px solid #111111",
                            fontWeight: "bold",
                          }}
                        >
                          {showVal(
                            cleanOrgName(selectedMember.ToChucDang?.Ten),
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Cột 2 (32% ở giữa): tiêu đề lớn "PHIẾU ĐẢNG VIÊN" */}
                    <div
                      style={{
                        width: "32%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "28pt",
                          fontWeight: "bold",
                          textAlign: "center",
                          lineHeight: "1.1",
                          color: "#000000",
                          letterSpacing: "2px",
                        }}
                      >
                        PHIẾU
                        <br />
                        ĐẢNG VIÊN
                      </div>
                    </div>

                    {/* Cột 3 (28% bên phải): khung dán ảnh 3x4 */}
                    <div
                      style={{
                        width: "28%",
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <div
                        style={{
                          width: "30mm",
                          height: "40mm",
                          border: "1px solid #111111",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10pt",
                          backgroundColor: "#ffffff",
                          color: "#000000",
                          lineHeight: "1.3",
                        }}
                      >
                        <div>Ảnh</div>
                        <div>(3x4)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Các khối thông tin chi tiết còn lại của hồ sơ */}
                <DetailPersonalInfo member={selectedMember} />
                <DetailPartyInfo member={selectedMember} />
                <DetailHistoryTables
                  member={selectedMember}
                  employments={selectedMember.QuaTrinhCongTac || []}
                  trainings={selectedMember.QuaTrinhDaoTao || []}
                  rankHistories={selectedMember.LichSuQuanHam || []}
                  evaluations={selectedMember.DanhGiaDangVien || []}
                  setPreviewDoc={setPreviewDoc}
                />
                <DetailFamilyTable member={selectedMember} />
                <DetailEconomicInfo member={selectedMember} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hộp thoại xác nhận xóa đảng viên */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Xóa đảng viên"
        message={`Bạn có chắc chắn muốn xóa đảng viên "${deleteTarget?.HoTenDangDung}"? Thao tác này không thể hoàn tác.`}
        confirmText="Xóa"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      {/* Modal xem trước quyết định/tài liệu đính kèm */}
      <DecisionPreviewModal
        isOpen={!!previewDoc}
        decisionId={previewDoc?.quyetDinhId}
        decision={
          previewDoc?.quyetDinhId
            ? null
            : previewDoc
              ? {
                  soQuyetDinh: previewDoc.soQuyetDinh || "Tài liệu",
                  tenQuyetDinh: previewDoc.name || "Xem chi tiết",
                  loaiQuyetDinh:
                    previewDoc.loaiQuyetDinh || "Văn bản / Chứng chỉ",
                  ngayBanHanh: previewDoc.ngayBanHanh || new Date(),
                  taiLieuUrl: previewDoc.fileUrl,
                  taiLieuName: previewDoc.name,
                }
              : null
        }
        onClose={() => setPreviewDoc(null)}
      />

      {/* Modal hiển thị kết quả và lỗi chi tiết sau khi import Excel */}
      {showErrorModal && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="modal-content glass-card"
            style={{
              backgroundColor: "var(--color-bg-secondary, #1e251a)",
              border: "1px solid var(--color-border, #4d5d43)",
              borderRadius: "12px",
              maxWidth: "850px",
              width: "90%",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              animation: "modalSlideIn 0.3s ease",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div
              className="modal-header"
              style={{
                borderBottom: "1px solid var(--color-border)",
                paddingBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h3
                style={{
                  color: "var(--color-primary-light, #7ba05b)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  margin: 0,
                  fontSize: "1.25rem",
                  fontWeight: 600,
                }}
              >
                <FiAlertTriangle
                  style={{
                    fontSize: "1.4rem",
                    color: "var(--color-warning, #f1c40f)",
                  }}
                />
                Kết quả nhập dữ liệu đảng viên hàng loạt
              </h3>
              <button
                onClick={() => setShowErrorModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                }}
              >
                ✕
              </button>
            </div>

            <div
              className="modal-body"
              style={{
                maxHeight: "450px",
                overflowY: "auto",
                padding: "16px 0",
                fontSize: "0.9rem",
                lineHeight: 1.5,
              }}
            >
              {/* Bảng tổng hợp số liệu import: tổng, thêm mới, ghi đè, lỗi */}
              {importSummary && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "12px",
                    marginBottom: "20px",
                    backgroundColor: "rgba(0,0,0,0.2)",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--color-text-secondary)",
                        textTransform: "uppercase",
                      }}
                    >
                      Tổng cộng
                    </div>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "var(--color-text)",
                      }}
                    >
                      {importSummary.total}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#2ecc71",
                        textTransform: "uppercase",
                      }}
                    >
                      Thêm mới
                    </div>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#2ecc71",
                      }}
                    >
                      {importSummary.successCount}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#3498db",
                        textTransform: "uppercase",
                      }}
                    >
                      Ghi đè
                    </div>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#3498db",
                      }}
                    >
                      {importSummary.updatedCount}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--color-error)",
                        textTransform: "uppercase",
                      }}
                    >
                      Lỗi & Trùng
                    </div>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "var(--color-error)",
                      }}
                    >
                      {importSummary.errorCount + importSummary.duplicateCount}
                    </div>
                  </div>
                </div>
              )}

              {/* Bảng liệt kê các dòng dữ liệu bị lỗi validate */}
              {importErrors.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <h4
                    style={{
                      margin: "0 0 10px 0",
                      color: "var(--color-error)",
                    }}
                  >
                    Danh sách hồ sơ bị lỗi định dạng / vi phạm validate:
                  </h4>
                  <div
                    className="table-container"
                    style={{
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      overflow: "hidden",
                      maxHeight: "180px",
                      overflowY: "auto",
                    }}
                  >
                    <table
                      className="table"
                      style={{ margin: 0, width: "100%" }}
                    >
                      <thead
                        style={{
                          position: "sticky",
                          top: 0,
                          backgroundColor: "var(--color-bg-secondary)",
                          zIndex: 1,
                        }}
                      >
                        <tr>
                          <th style={{ width: "100px", padding: "10px" }}>
                            Dòng Excel
                          </th>
                          <th style={{ width: "150px", padding: "10px" }}>
                            Số lý lịch
                          </th>
                          <th style={{ width: "180px", padding: "10px" }}>
                            Họ tên
                          </th>
                          <th style={{ padding: "10px" }}>
                            Chi tiết lỗi vi phạm
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {importErrors.map((err, idx) => (
                          <tr key={idx}>
                            <td
                              style={{
                                fontWeight: 600,
                                color: "var(--color-primary-light)",
                                padding: "10px",
                                textAlign: "center",
                              }}
                            >
                              Dòng {err.excelRow}
                            </td>
                            <td style={{ padding: "10px" }}>{err.SoLyLich}</td>
                            <td style={{ fontWeight: 500, padding: "10px" }}>
                              {err.rowName}
                            </td>
                            <td
                              style={{
                                color: "var(--color-error)",
                                padding: "10px",
                              }}
                            >
                              {err.error}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bảng cảnh báo các hồ sơ bị trùng với dữ liệu đã có */}
              {importDuplicates.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <h4
                    style={{
                      margin: "0 0 10px 0",
                      color: "var(--color-warning)",
                    }}
                  >
                    Danh sách hồ sơ đã tồn tại trong hệ thống (Trùng lặp):
                  </h4>
                  <div
                    className="table-container"
                    style={{
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      overflow: "hidden",
                      maxHeight: "180px",
                      overflowY: "auto",
                    }}
                  >
                    <table
                      className="table"
                      style={{ margin: 0, width: "100%" }}
                    >
                      <thead
                        style={{
                          position: "sticky",
                          top: 0,
                          backgroundColor: "var(--color-bg-secondary)",
                          zIndex: 1,
                        }}
                      >
                        <tr>
                          <th style={{ width: "100px", padding: "10px" }}>
                            Dòng Excel
                          </th>
                          <th style={{ width: "150px", padding: "10px" }}>
                            Số lý lịch
                          </th>
                          <th style={{ width: "180px", padding: "10px" }}>
                            Họ tên
                          </th>
                          <th style={{ padding: "10px" }}>
                            Cảnh báo trùng lặp
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {importDuplicates.map((err, idx) => (
                          <tr key={idx}>
                            <td
                              style={{
                                fontWeight: 600,
                                color: "var(--color-primary-light)",
                                padding: "10px",
                                textAlign: "center",
                              }}
                            >
                              Dòng {err.excelRow}
                            </td>
                            <td style={{ padding: "10px" }}>{err.SoLyLich}</td>
                            <td style={{ fontWeight: 500, padding: "10px" }}>
                              {err.rowName}
                            </td>
                            <td
                              style={{
                                color: "var(--color-warning)",
                                padding: "10px",
                              }}
                            >
                              {err.error}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div
                    style={{
                      marginTop: "15px",
                      padding: "12px",
                      backgroundColor: "rgba(241, 196, 15, 0.1)",
                      border: "1px solid var(--color-warning, #f1c40f)",
                      borderRadius: "6px",
                      color: "var(--color-text)",
                      fontSize: "13px",
                    }}
                  >
                    ⚠️ <strong>Đồng chí lưu ý:</strong> Phát hiện các hồ sơ
                    trùng lặp ở trên. Nhấn nút{" "}
                    <strong>"Cập nhật (Ghi đè)"</strong> dưới đây nếu muốn ghi
                    đè toàn bộ dữ liệu mới của các hồ sơ này vào cơ sở dữ liệu.
                  </div>
                </div>
              )}
            </div>

            <div
              className="modal-footer"
              style={{
                borderTop: "1px solid var(--color-border)",
                paddingTop: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                {failedExcelBase64 && (
                  <button
                    className="btn btn-outline"
                    onClick={handleDownloadFailedExcel}
                    style={{
                      borderColor: "var(--color-error)",
                      color: "var(--color-error)",
                    }}
                  >
                    Tải file Excel hồ sơ lỗi
                  </button>
                )}
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                {importDuplicates.length > 0 && (
                  <button
                    className="btn btn-primary"
                    onClick={handleImportOverwrite}
                    style={{
                      backgroundColor: "#2980b9",
                      borderColor: "#2980b9",
                    }}
                    disabled={importing}
                  >
                    {importing ? "Đang xử lý..." : "Cập nhật (Ghi đè)"}
                  </button>
                )}
                <button
                  className="btn btn-outline"
                  onClick={() => setShowErrorModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
