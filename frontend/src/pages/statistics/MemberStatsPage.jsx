import { useState, useEffect, useMemo } from "react";
import {
  FiTrendingUp,
  FiUsers,
  FiFileText,
  FiBarChart2,
  FiTable,
  FiCalendar,
  FiFilter,
  FiRefreshCw,
  FiPlus,
  FiEye,
  FiTrash,
} from "../../components/icons";
import toast from "react-hot-toast";

import memberApi from "../../api/memberApi";
import orgApi from "../../api/orgApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import YearFilter from "../../components/statistics/YearFilter";
import StatsBarChart from "../../components/statistics/StatsBarChart";
import GlassSelect from "../../components/common/GlassSelect";
import StatsTable from "../../components/statistics/StatsTable";
import PageHeader from "../../components/common/PageHeader";
import {
  getTemplates,
  getDefaultTemplate,
} from "../../utils/statistics/reportRegistry";
import customReport, {
  CUSTOM_FIELDS,
} from "../../utils/statistics/templates/customReport";
import {
  ETHNICITIES,
  RELIGIONS,
} from "../../utils/statistics/templates/mau6TKCT";
import { STANDARD_RANKS, PARTY_POSITIONS, ROLES } from "../../utils/constants";
import { useAuth } from "../../contexts/AuthContext";
import {
  fileToBase64,
  renderUploadedTemplateHtml,
  exportUploadedTemplate,
} from "../../utils/statistics/excelTemplateHelper";

export const FILTERABLE_FIELDS = [
  { value: "ethnic", label: "Dân tộc" },
  { value: "religion", label: "Tôn giáo" },
  { value: "joinPeriod", label: "Ngày vào đảng" },
  { value: "tuoiDoi", label: "Tuổi đời" },
  { value: "trinhDoGDPT", label: "Trình độ giáo dục phổ thông" },
  { value: "trinhDoNghiepVu", label: "Trình độ nghiệp vụ" },
  { value: "hocHam", label: "Chức danh khoa học" },
  { value: "lyLuanChinhTri", label: "Trình độ lý luận chính trị" },
  { value: "tuoiDang", label: "Tuổi đảng" },
  { value: "rank", label: "Cấp bậc quân hàm" },
  { value: "chucVuDang", label: "Chức vụ Đảng" },
  { value: "khenThuong", label: "Khen thưởng" },
  { value: "kyLuat", label: "Kỷ luật" },
];

const getFieldOptions = (field) => {
  switch (field) {
    case "gender":
      return ["Nam", "Nữ"];
    case "mienSinhHoat":
      return ["Có", "Không"];
    case "joinPeriod":
      return [
        "Từ 30/4/1975 về trước",
        "Từ 1/5/1975 đến 31/12/1985",
        "Từ 1/1/1986 đến 31/12/1996",
        "Từ 1/1/1997 đến 31/12/2010",
        "Từ 1/1/2011 đến nay",
      ];
    case "tuoiDoi":
      return [
        "Từ 18 đến 30 tuổi",
        "Từ 31 đến 40 tuổi",
        "Từ 41 đến 50 tuổi",
        "Từ 51 đến 60 tuổi",
        "Từ 61 tuổi trở lên",
      ];
    case "trinhDoGDPT":
      return ["Tiểu học", "Trung học cơ sở", "Trung học phổ thông"];
    case "trinhDoNghiepVu":
      return [
        "Sơ cấp",
        "Trung học CN",
        "Cao đẳng",
        "Đại học",
        "Thạc sĩ",
        "Tiến sĩ",
        "Tiến sĩ khoa học",
      ];
    case "hocHam":
      return ["Phó giáo sư", "Giáo sư"];
    case "lyLuanChinhTri":
      return ["cử nhân, cao cấp", "trung cấp", "sơ cấp", "cơ sở"];
    case "tuoiDang":
      return [
        "dưới 30 năm",
        "từ 30 năm đến 40 năm",
        "từ 40 năm đến 50 năm",
        "từ 50 năm trở lên",
      ];
    case "rank":
      return STANDARD_RANKS;
    case "chucVuDang":
      return ["Không có", ...PARTY_POSITIONS];
    default:
      return null;
  }
};

const getFieldPlaceholder = (field) => {
  switch (field) {
    case "gender":
      return "— Chọn giới tính —";
    case "mienSinhHoat":
      return "— Chọn miễn sinh hoạt —";
    case "joinPeriod":
      return "— Chọn thời gian vào đảng —";
    case "tuoiDoi":
      return "— Chọn độ tuổi —";
    case "trinhDoGDPT":
      return "— Chọn trình độ GDPT —";
    case "trinhDoNghiepVu":
      return "— Chọn trình độ nghiệp vụ —";
    case "hocHam":
      return "— Chọn chức danh khoa học —";
    case "lyLuanChinhTri":
      return "— Chọn lý luận chính trị —";
    case "tuoiDang":
      return "— Chọn tuổi đảng —";
    case "rank":
      return "— Chọn cấp bậc —";
    case "chucVuDang":
      return "— Chọn chức vụ —";
    default:
      return "Chọn...";
  }
};

export default function MemberStatsPage() {
  const { user } = useAuth();
  // Danh sách đảng viên và tổ chức lấy từ API, dùng chung cho mọi bảng/biểu đồ bên dưới
  const [members, setMembers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Các tiêu chí lọc: đơn vị, năm báo cáo/năm so sánh
  const currentYear = new Date().getFullYear();
  const [selectedOrgId, setSelectedOrgId] = useState(() =>
    user?.role === ROLES.BI_THU ? user.orgId || "" : "",
  );
  const [yearFilter, setYearFilter] = useState({
    reportYear: currentYear,
    comparisonYear: currentYear - 1,
  });

  // Mẫu báo cáo (mẫu có sẵn + mẫu Excel người dùng tự tải lên)
  const [customTemplates, setCustomTemplates] = useState(() => {
    const saved = localStorage.getItem("custom_report_templates");
    return saved ? JSON.parse(saved) : [];
  });

  const templates = useMemo(() => {
    const builtIn = getTemplates();
    const mappedCustom = customTemplates.map((ct) => ({
      id: ct.id,
      name: ct.name,
      description: ct.description || "Mẫu báo cáo tải lên từ file Excel",
      defaultFilters: ct.defaultFilters || [],
      isUploaded: true,
      fileName: ct.fileName,
      fileData: ct.fileData,
      computeStats(allMembers, options) {
        return customReport.computeStats(allMembers, options);
      },
    }));
    return [...builtIn, ...mappedCustom];
  }, [customTemplates]);

  const defaultTemplate = getDefaultTemplate();
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    defaultTemplate.id,
  );
  const selectedTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const availableFilterFields = useMemo(() => {
    const mau6Fields = [
      "ethnic",
      "religion",
      "joinPeriod",
      "tuoiDoi",
      "trinhDoGDPT",
      "trinhDoNghiepVu",
      "hocHam",
      "lyLuanChinhTri",
      "tuoiDang",
    ];
    return FILTERABLE_FIELDS.filter((f) => mau6Fields.includes(f.value));
  }, []);

  // Modal xem trước mẫu báo cáo trước khi xuất
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTemplateId, setPreviewTemplateId] = useState("");

  // Modal tải lên mẫu Excel do người dùng cung cấp
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Danh sách các điều kiện lọc do người dùng thêm vào, khởi tạo theo bộ lọc mặc định của mẫu đang chọn
  const [dynamicFilters, setDynamicFilters] = useState(() => {
    if (defaultTemplate && defaultTemplate.defaultFilters) {
      return defaultTemplate.defaultFilters
        .filter(
          (f) => f.field !== "choNghiHuuMatSuc" && f.field !== "choNghiHuu",
        )
        .map((f, i) => ({
          id: Date.now() + i,
          field: f.field,
          operator: f.operator,
          value: f.value,
        }));
    }
    return [];
  });

  // Khi đổi mẫu báo cáo thì nạp lại luôn bộ lọc mặc định đi kèm mẫu đó, tránh giữ lại điều kiện lọc của mẫu cũ không còn phù hợp
  const handleSelectTemplate = (template) => {
    setSelectedTemplateId(template.id);
    if (template.defaultFilters) {
      const newFilters = template.defaultFilters
        .filter(
          (f) => f.field !== "choNghiHuuMatSuc" && f.field !== "choNghiHuu",
        )
        .map((f, i) => ({
          id: Date.now() + i,
          field: f.field,
          operator: f.operator,
          value: f.value,
        }));
      setDynamicFilters(newFilters);
    } else {
      setDynamicFilters([]);
    }
  };

  // Chuyển đổi giữa xem biểu đồ và xem bảng số liệu
  const [activeTab, setActiveTab] = useState("charts");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Nạp danh sách đảng viên và tổ chức ngay khi vào trang
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersRes, orgsRes] = await Promise.all([
        memberApi.getAll(),
        orgApi.getAll(),
      ]);
      setMembers(membersRes.data || []);
      setOrganizations(orgsRes.data || []);
    } catch {
      toast.error("Không thể tải dữ liệu báo cáo thống kê.");
    } finally {
      setLoading(false);
    }
  };

  // Duyệt cây tổ chức để gom ID của một đơn vị và toàn bộ đơn vị trực thuộc nó, phục vụ lọc theo phạm vi cơ quan
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

  const allowedOrganizations = useMemo(() => {
    if (!user) return [];
    if (user.role === ROLES.CAN_BO_CHINH_TRI) return organizations;

    // Bí thư chỉ được xem đơn vị mình phụ trách và cấp dưới, không thấy toàn bộ đảng bộ
    const allowedIds = [];
    const findDescendants = (id) => {
      allowedIds.push(id);
      organizations.forEach((o) => {
        if (o.parentId === id) {
          findDescendants(o.id);
        }
      });
    };
    if (user.orgId) {
      findDescendants(user.orgId);
    }
    return organizations.filter((o) => allowedIds.includes(o.id));
  }, [organizations, user]);

  useEffect(() => {
    if (user && user.role === ROLES.BI_THU && user.orgId && !selectedOrgId) {
      setSelectedOrgId(user.orgId);
    }
  }, [user, selectedOrgId]);

  const filteredMembers = useMemo(() => {
    let list = members;
    const activeOrgId =
      selectedOrgId || (user?.role === ROLES.BI_THU ? user.orgId : "");

    const refYear = yearFilter.reportYear || new Date().getFullYear();

    if (activeOrgId) {
      const orgIds = getSubOrgIds(activeOrgId);
      list = list.filter((m) => {
        const targetDate = new Date(`${refYear}-12-31T23:59:59.999Z`);
        let mOrgId = m.ToChucDangId;
        if (m.orgHistory && m.orgHistory.length > 0) {
          const historicalEntries = m.orgHistory.filter(
            (h) => new Date(h.date) <= targetDate,
          );
          if (historicalEntries.length > 0) {
            mOrgId = historicalEntries[historicalEntries.length - 1].orgId;
          } else {
            return false;
          }
        } else {
          const joinedDate = m.NgayVaoDang
            ? new Date(m.NgayVaoDang)
            : m.CreatedAt
              ? new Date(m.CreatedAt)
              : null;
          if (joinedDate && joinedDate > targetDate) {
            return false;
          }
        }
        return orgIds.includes(mOrgId);
      });
    } else {
      list = list.filter((m) => {
        const targetDate = new Date(`${refYear}-12-31T23:59:59.999Z`);
        if (m.orgHistory && m.orgHistory.length > 0) {
          const historicalEntries = m.orgHistory.filter(
            (h) => new Date(h.date) <= targetDate,
          );
          if (historicalEntries.length === 0) {
            return false;
          }
        } else {
          const joinedDate = m.NgayVaoDang
            ? new Date(m.NgayVaoDang)
            : m.CreatedAt
              ? new Date(m.CreatedAt)
              : null;
          if (joinedDate && joinedDate > targetDate) {
            return false;
          }
        }
        return true;
      });
    }

    // Lần lượt áp từng điều kiện lọc động mà người dùng đã thêm lên danh sách còn lại
    dynamicFilters.forEach((filter) => {
      const { field, operator, value } = filter;
      if (!field || operator === "all") return;

      list = list.filter((m) => {
        const memberVal = String(m[field] || "")
          .trim()
          .toLowerCase();
        const targetVal = String(value || "")
          .trim()
          .toLowerCase();

        const selectFields = [
          "gender",
          "mienSinhHoat",
          "joinPeriod",
          "tuoiDoi",
          "trinhDoGDPT",
          "trinhDoNghiepVu",
          "hocHam",
          "lyLuanChinhTri",
          "tuoiDang",
          "rank",
          "chucVuDang",
        ];
        const isSelectField = selectFields.includes(field);

        if (targetVal === "") {
          if (isSelectField) {
            // Chưa chọn giá trị trong dropdown thì coi như không lọc theo trường này
            return true;
          } else {
            // Với ô nhập tay để trống, hiểu là chỉ cần đảng viên có dữ liệu ở trường đó
            return memberVal !== "";
          }
        }

        // Từ đây là các trường cần quy đổi/so khớp riêng chứ không thể so sánh chuỗi trực tiếp
        if (field === "mienSinhHoat") {
          const isExempt =
            !!m.NgayMienCongTac || m.TrangThai === "MIEN_SINH_HOAT";
          return targetVal === "có" ? isExempt : !isExempt;
        }

        if (field === "joinPeriod") {
          if (!m.NgayVaoDang) return false;
          const joinDate = new Date(m.NgayVaoDang);
          let mPeriod = "";
          if (joinDate <= new Date("1975-04-30")) {
            mPeriod = "Từ 30/4/1975 về trước";
          } else if (joinDate <= new Date("1985-12-31")) {
            mPeriod = "Từ 1/5/1975 đến 31/12/1985";
          } else if (joinDate <= new Date("1996-12-31")) {
            mPeriod = "Từ 1/1/1986 đến 31/12/1996";
          } else if (joinDate <= new Date("2010-12-31")) {
            mPeriod = "Từ 1/1/1997 đến 31/12/2010";
          } else {
            mPeriod = "Từ 1/1/2011 đến nay";
          }
          return mPeriod.toLowerCase() === targetVal;
        }

        if (field === "tuoiDoi") {
          if (!m.NgaySinh) return false;
          const age = refYear - new Date(m.NgaySinh).getFullYear();
          let mAgeRange = "";
          if (age >= 18 && age <= 30) {
            mAgeRange = "Từ 18 đến 30 tuổi";
          } else if (age >= 31 && age <= 40) {
            mAgeRange = "Từ 31 đến 40 tuổi";
          } else if (age >= 41 && age <= 50) {
            mAgeRange = "Từ 41 đến 50 tuổi";
          } else if (age >= 51 && age <= 60) {
            mAgeRange = "Từ 51 đến 60 tuổi";
          } else if (age >= 61) {
            mAgeRange = "Từ 61 tuổi trở lên";
          }
          return mAgeRange.toLowerCase() === targetVal;
        }

        if (field === "tuoiDang") {
          if (!m.NgayVaoDang) return false;
          const partyAge = refYear - new Date(m.NgayVaoDang).getFullYear();
          let mPartyAgeRange = "";
          if (partyAge < 30) {
            mPartyAgeRange = "dưới 30 năm";
          } else if (partyAge >= 30 && partyAge < 40) {
            mPartyAgeRange = "từ 30 năm đến 40 năm";
          } else if (partyAge >= 40 && partyAge < 50) {
            mPartyAgeRange = "từ 40 năm đến 50 năm";
          } else if (partyAge >= 50) {
            mPartyAgeRange = "từ 50 năm trở lên";
          }
          return mPartyAgeRange.toLowerCase() === targetVal;
        }

        if (field === "trinhDoGDPT") {
          const lowerVal = (m.GiaoDucPhoThong || "").toLowerCase().trim();
          let level = "";
          if (
            lowerVal.includes("trung học phổ thông") ||
            lowerVal.includes("thpt") ||
            lowerVal === "12/12" ||
            lowerVal.includes("10/10")
          ) {
            level = "trung học phổ thông";
          } else if (
            lowerVal.includes("trung học cơ sở") ||
            lowerVal.includes("thcs") ||
            lowerVal === "9/12" ||
            lowerVal.includes("7/10")
          ) {
            level = "trung học cơ sở";
          } else if (
            lowerVal.includes("tiểu học") ||
            lowerVal === "5/12" ||
            lowerVal.includes("th")
          ) {
            level = "tiểu học";
          } else {
            const match = lowerVal.match(/(\d+)\/12/);
            if (match) {
              const num = parseInt(match[1]);
              if (num >= 10) level = "trung học phổ thông";
              else if (num >= 6) level = "trung học cơ sở";
              else level = "tiểu học";
            }
          }
          return level === targetVal;
        }

        if (field === "trinhDoNghiepVu") {
          const hocVi = (m.HocVi || "").toLowerCase();
          const dhSauDH = (m.GiaoDucDaiHoc || "").toLowerCase();
          const gdnn = (m.trinhDoGDNN || "").toLowerCase();

          let level = "";
          if (
            hocVi.includes("tiến sĩ khoa học") ||
            hocVi.includes("tiến sỹ khoa học")
          )
            level = "tiến sĩ khoa học";
          else if (hocVi.includes("tiến sĩ") || hocVi.includes("tiến sỹ"))
            level = "tiến sĩ";
          else if (hocVi.includes("thạc sĩ") || hocVi.includes("thạc sỹ"))
            level = "thạc sĩ";
          else if (
            dhSauDH.includes("đại học") ||
            hocVi.includes("cử nhân") ||
            hocVi.includes("kỹ sư")
          )
            level = "đại học";
          else if (dhSauDH.includes("cao đẳng") || gdnn.includes("cao đẳng"))
            level = "cao đẳng";
          else if (
            gdnn.includes("trung cấp") ||
            gdnn.includes("trung học chuyên nghiệp") ||
            gdnn.includes("trung học cn")
          )
            level = "trung học cn";
          else if (gdnn.includes("sơ cấp")) level = "sơ cấp";

          return level === targetVal;
        }

        if (field === "hocHam") {
          const lowerVal = (m.HocHam || "").toLowerCase();
          let level = "";
          if (lowerVal.includes("phó giáo sư") || lowerVal.includes("pgs"))
            level = "phó giáo sư";
          else if (lowerVal.includes("giáo sư") || lowerVal.includes("gs"))
            level = "giáo sư";
          return level === targetVal;
        }

        if (field === "lyLuanChinhTri") {
          const lowerVal = (m.LyLuanChinhTri || "").toLowerCase();
          let level = "";
          if (lowerVal.includes("cử nhân") || lowerVal.includes("cao cấp"))
            level = "cử nhân, cao cấp";
          else if (lowerVal.includes("trung cấp")) level = "trung cấp";
          else if (lowerVal.includes("sơ cấp")) level = "sơ cấp";
          else if (lowerVal.includes("cơ sở")) level = "cơ sở";
          return level === targetVal;
        }

        if (field === "chucVuDang") {
          if (targetVal === "không có") {
            return memberVal === "" || memberVal === "không có";
          }
          const cleanMember = memberVal.replace(/\s*\([^)]*\)/g, "").trim();
          const cleanTarget = targetVal.replace(/\s*\([^)]*\)/g, "").trim();
          const memberAbbr = (memberVal.match(/\(([^)]+)\)/)?.[1] || "").trim();
          const targetAbbr = (targetVal.match(/\(([^)]+)\)/)?.[1] || "").trim();

          return (
            memberVal === targetVal ||
            cleanMember === cleanTarget ||
            (cleanTarget && cleanMember.includes(cleanTarget)) ||
            (targetAbbr && cleanMember.includes(targetAbbr)) ||
            (targetAbbr && memberVal.includes(targetAbbr)) ||
            (memberAbbr && targetVal.includes(memberAbbr))
          );
        }

        if (field === "khenThuong") {
          const raw = m.KhenThuong;
          if (targetVal === "không có") {
            if (!raw || String(raw).trim() === "") return true;
            const rewards = String(raw)
              .split(";")
              .map((r) => r.trim())
              .filter(Boolean);
            const hasMatchingReward = rewards.some((reward) => {
              const years = (reward.match(/\b\d{4}\b/g) || []).map(Number);
              return years.some((y) => y === refYear);
            });
            return !hasMatchingReward;
          }

          if (!raw || String(raw).trim() === "") return false;
          const rewards = String(raw)
            .split(";")
            .map((r) => r.trim())
            .filter(Boolean);

          return rewards.some((reward) => {
            const years = (reward.match(/\b\d{4}\b/g) || []).map(Number);
            const matchesYear = years.some((y) => y === refYear);
            if (!matchesYear) return false;

            const cleanLabel = reward
              .replace(/\s*\([^)]*\b\d{4}\b[^)]*\)/g, "")
              .trim()
              .toLowerCase();
            return cleanLabel.includes(targetVal);
          });
        }

        if (field === "ethnic") {
          const standardEthnicities = ETHNICITIES.filter(
            (e) => e !== "Dân tộc khác",
          ).map((e) => e.toLowerCase());
          const isFilterValStandard = standardEthnicities.includes(targetVal);
          const isMemberValStandard = standardEthnicities.includes(memberVal);
          if (isFilterValStandard) {
            return memberVal === targetVal;
          } else {
            return !isMemberValStandard && memberVal !== "";
          }
        }

        if (field === "religion") {
          if (targetVal === "không" || targetVal === "không có") {
            return (
              memberVal === "" ||
              memberVal === "không" ||
              memberVal === "không có"
            );
          }
          const standardReligions = RELIGIONS.filter(
            (r) => r !== "Các đạo khác",
          ).map((r) => r.toLowerCase().replace("đạo ", ""));
          const matchedStd = standardReligions.find(
            (std) => targetVal.includes(std) || std.includes(targetVal),
          );
          const memberClean = memberVal.replace("đạo ", "");
          const matchedMemberStd = standardReligions.find((std) =>
            memberClean.includes(std),
          );
          if (matchedStd) {
            return memberClean.includes(matchedStd);
          } else {
            return (
              !matchedMemberStd &&
              memberVal !== "" &&
              memberVal !== "không" &&
              memberVal !== "không có"
            );
          }
        }

        if (isSelectField) {
          return memberVal === targetVal;
        } else {
          return memberVal.includes(targetVal);
        }
      });
    });

    return list;
  }, [
    members,
    selectedOrgId,
    organizations,
    dynamicFilters,
    yearFilter.reportYear,
  ]);

  // Giao lại cho mẫu báo cáo đang chọn tự tính số liệu, vì mỗi mẫu có cách gộp nhóm khác nhau
  const stats = useMemo(() => {
    if (members.length === 0 && !loading) return null;
    const orgName = selectedOrgId
      ? organizations.find((o) => o.id === selectedOrgId)?.name || "Đơn vị"
      : "Toàn Đảng bộ";

    return selectedTemplate.computeStats(filteredMembers, {
      reportYear: yearFilter.reportYear,
      comparisonYear: yearFilter.comparisonYear,
      orgName,
      dynamicFilters: dynamicFilters,
    });
  }, [
    members,
    filteredMembers,
    yearFilter,
    selectedTemplate,
    selectedTemplateId,
    selectedOrgId,
    organizations,
    loading,
    dynamicFilters,
  ]);

  // Xuất báo cáo ra file Excel, tách riêng nhánh xử lý cho mẫu tải lên vì cần điền vào đúng khung mẫu gốc
  const handleExportExcel = async () => {
    if (!stats) {
      toast.error("Không có dữ liệu để xuất báo cáo.");
      return;
    }
    if (selectedTemplate.isUploaded) {
      try {
        await exportUploadedTemplate(selectedTemplate, stats, filteredMembers);
        toast.success(`Đã xuất báo cáo ${selectedTemplate.name} thành công!`);
      } catch (error) {
        toast.error(`Lỗi khi xuất báo cáo: ${error.message}`);
      }
    } else {
      selectedTemplate.exportToExcel(stats);
      toast.success(`Đã xuất báo cáo ${selectedTemplate.name} thành công!`);
    }
  };

  // Chưa có dữ liệu thì chỉ hiện vòng xoay chờ, không render giao diện chính
  if (loading) return <LoadingSpinner />;

  return (
    <div className="page animate-fade-in">
      {/* Tiêu đề trang */}
      <PageHeader
        title="Báo cáo & Thống kê Đảng viên"
        subtitle={`Phân tích cơ cấu, thâm niên, trình độ theo quy định ${selectedTemplate.name}`}
      />

      {/* Khối chứa bộ lọc và các tùy chọn xuất báo cáo */}
      <div
        className="card"
        style={{
          marginBottom: "var(--spacing-xl)",
          padding: "var(--spacing-lg)",
          position: "relative",
          zIndex: 20,
        }}
      >
        {/* Thanh chọn năm và đơn vị */}
        <div
          className="stats-filter-bar"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "var(--spacing-md)",
            marginBottom: "var(--spacing-lg)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "var(--spacing-md)",
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            {/* Chọn năm báo cáo và năm để so sánh */}
            <YearFilter defaultYear={currentYear} onChange={setYearFilter} />

            {/* Chọn phạm vi đơn vị thống kê */}
            <div
              className="stats-filter-group"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                alignItems: "flex-start",
              }}
            >
              <label
                className="stats-filter-label"
                style={{ fontWeight: 600, margin: 0 }}
              >
                Đơn vị
              </label>
              <GlassSelect
                value={selectedOrgId}
                onChange={setSelectedOrgId}
                options={allowedOrganizations.map((org) => ({
                  id: org.id,
                  name: org.parentId ? `├─ ${org.name}` : org.name,
                }))}
                placeholder="— Toàn Đảng bộ —"
                showEmptyOption={user?.role === ROLES.CAN_BO_CHINH_TRI}
                style={{ minWidth: "200px" }}
              />
            </div>
          </div>

          {/* Nút xuất báo cáo đặt lệch phải cho dễ thao tác */}
          <div>
            <button
              className="btn btn-accent"
              onClick={handleExportExcel}
              style={{
                height: "38px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                padding: "0 20px",
                borderRadius: "20px",
              }}
            >
              <FiFileText style={{ marginRight: "6px" }} /> Xuất báo cáo
            </button>
          </div>
        </div>

        {/* Bảng điều kiện lọc động, luôn hiển thị để người dùng dễ tinh chỉnh mà không cần bấm mở */}
        <div
          className="card"
          style={{
            marginTop: "var(--spacing-md)",
            padding: "var(--spacing-lg)",
            border: "1px solid var(--color-border)",
            background: "var(--color-bg-secondary)",
            boxShadow: "var(--shadow-md)",
            marginBottom: "var(--spacing-xl)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          {/* Nhãn và danh sách các mẫu báo cáo để chọn */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "var(--spacing-lg)",
              flexWrap: "wrap",
              gap: "var(--spacing-md)",
              borderBottom: "1px dashed var(--color-border)",
              paddingBottom: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "var(--spacing-md)",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span
                className="stats-filter-label"
                style={{
                  margin: 0,
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                }}
              >
                Bộ lọc tiêu chí:
              </span>

              {/* Từng mẫu hiển thị dạng nút bo tròn, kèm nút mắt để xem trước */}
              <div
                style={{
                  display: "flex",
                  gap: "var(--spacing-sm)",
                  flexWrap: "wrap",
                }}
              >
                {templates.map((t) => {
                  const isActive = selectedTemplateId === t.id;
                  return (
                    <div
                      key={t.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        background: isActive
                          ? "var(--color-accent)"
                          : "var(--color-bg-tertiary)",
                        borderRadius: "20px",
                        padding: "2px 4px 2px 12px",
                        border: isActive
                          ? "1px solid var(--color-accent)"
                          : "1px solid var(--color-border)",
                        transition: "all 0.2s ease",
                        boxShadow: isActive
                          ? "0 0 8px rgba(var(--color-accent-rgb), 0.2)"
                          : "none",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectTemplate(t)}
                        style={{
                          background: "none",
                          border: "none",
                          color: isActive
                            ? "#000000"
                            : "var(--color-text-primary)",
                          fontWeight: "bold",
                          fontSize: "var(--font-size-xs)",
                          cursor: "pointer",
                          padding: "4px 6px 4px 0",
                          outline: "none",
                        }}
                      >
                        {t.id === "custom_report" ? "Tùy chỉnh" : t.name}
                      </button>
                      <button
                        type="button"
                        title={`Xem trước định dạng ${t.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTemplateId(t.id);
                          setIsPreviewOpen(true);
                        }}
                        style={{
                          background: isActive
                            ? "rgba(0,0,0,0.15)"
                            : "rgba(255,255,255,0.08)",
                          border: "none",
                          borderRadius: "50%",
                          width: "22px",
                          height: "22px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isActive ? "#000000" : "var(--color-accent)",
                          cursor: "pointer",
                          marginLeft: "4px",
                          fontSize: "0.8rem",
                          outline: "none",
                          transition: "all 0.2s",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = "scale(1.1)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        <FiEye />
                      </button>
                    </div>
                  );
                })}

                {/* Nút mở modal tải mẫu Excel riêng của đơn vị lên hệ thống */}
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px dashed var(--color-accent)",
                    borderRadius: "20px",
                    padding: "4px 12px",
                    color: "var(--color-accent)",
                    fontWeight: "bold",
                    fontSize: "var(--font-size-xs)",
                    cursor: "pointer",
                    outline: "none",
                    transition: "all 0.2s",
                    height: "28px",
                    alignSelf: "center",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background =
                      "rgba(16, 185, 129, 0.2)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background =
                      "rgba(16, 185, 129, 0.1)";
                  }}
                  title="Tải lên tệp Excel mẫu để bổ sung vào danh sách mẫu báo cáo"
                >
                  <span>Tải lên mẫu Excel</span>
                  <FiPlus style={{ fontSize: "0.8rem" }} />
                </button>
              </div>
            </div>

            {/* Chỉ hiện khi đang có ít nhất một điều kiện lọc để xóa */}
            {dynamicFilters.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: "4px 12px",
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-error)",
                  borderColor: "rgba(235, 94, 85, 0.2)",
                  borderRadius: "20px",
                }}
                onClick={() => setDynamicFilters([])}
              >
                <span>Xóa hết bộ lọc</span>
                <FiRefreshCw style={{ marginLeft: "4px" }} />
              </button>
            )}
          </div>

          {/* Danh sách các dòng điều kiện lọc đã thêm, hoặc thông báo trống nếu chưa lọc gì */}
          {dynamicFilters.length === 0 ? (
            <p
              className="text-muted"
              style={{
                margin: 0,
                fontSize: "var(--font-size-xs)",
                textAlign: "center",
                padding: "var(--spacing-md)",
              }}
            >
              Chưa áp dụng bộ lọc nào. Hãy nhấn "+" để bắt đầu lọc dữ liệu theo
              bất kỳ thuộc tính nào.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: "var(--spacing-sm)",
                marginBottom: "var(--spacing-md)",
              }}
            >
              {dynamicFilters.map((filter, index) => (
                <div
                  key={filter.id}
                  style={{
                    display: "flex",
                    gap: "6px",
                    alignItems: "center",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--color-border)",
                    padding: "6px 10px",
                    borderRadius: "12px",
                    width: "100%",
                    flexWrap: "nowrap",
                    minWidth: 0,
                  }}
                >
                  {/* Chọn trường dữ liệu cần lọc */}
                  <div
                    style={{
                      flex:
                        filter.operator === "select"
                          ? "1 1 120px"
                          : "1 1 180px",
                      minWidth: filter.operator === "select" ? "90px" : "140px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <GlassSelect
                      value={filter.field}
                      onChange={(val) => {
                        const updated = [...dynamicFilters];
                        updated[index].field = val;
                        updated[index].value = "";
                        setDynamicFilters(updated);
                      }}
                      options={availableFilterFields}
                      showEmptyOption={false}
                      size="small"
                      style={{ minWidth: "0", width: "100%" }}
                    />
                  </div>

                  {/* Chọn kiểu điều kiện: lấy tất cả hay lọc theo giá trị cụ thể */}
                  <div
                    style={{ width: "110px", minWidth: "110px", flexShrink: 0 }}
                  >
                    <GlassSelect
                      value={filter.operator}
                      onChange={(val) => {
                        const updated = [...dynamicFilters];
                        updated[index].operator = val;
                        if (val === "all") {
                          updated[index].value = "";
                        }
                        setDynamicFilters(updated);
                      }}
                      options={[
                        { id: "all", name: "Tất cả" },
                        { id: "select", name: "Chọn/Nhập" },
                      ]}
                      showEmptyOption={false}
                      size="small"
                      style={{ minWidth: "0", width: "100%" }}
                    />
                  </div>

                  {/* Nhập giá trị lọc: dropdown nếu trường có danh sách cố định, ô nhập tay nếu không */}
                  {filter.operator === "select" && (
                    <div
                      style={{
                        flex: "1.2 1 130px",
                        minWidth: "100px",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {getFieldOptions(filter.field) ? (
                        <GlassSelect
                          value={filter.value}
                          onChange={(val) => {
                            const updated = [...dynamicFilters];
                            updated[index].value = val;
                            setDynamicFilters(updated);
                          }}
                          options={getFieldOptions(filter.field)}
                          placeholder={getFieldPlaceholder(filter.field)}
                          size="small"
                          style={{ minWidth: "0", width: "100%" }}
                        />
                      ) : (
                        <input
                          type="text"
                          placeholder="Nhập..."
                          value={filter.value}
                          onChange={(e) => {
                            const updated = [...dynamicFilters];
                            updated[index].value = e.target.value;
                            setDynamicFilters(updated);
                          }}
                          style={{
                            borderRadius: "var(--radius-md)",
                            backgroundColor: "#ffffff",
                            color: "#1a1f2e",
                            border: "1px solid var(--color-border)",
                            padding: "4px 10px",
                            height: "32px",
                            fontSize: "var(--font-size-xs)",
                            width: "100%",
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      )}
                    </div>
                  )}

                  {/* Nút xóa riêng dòng điều kiện này */}
                  <button
                    type="button"
                    onClick={() => {
                      setDynamicFilters(
                        dynamicFilters.filter((f) => f.id !== filter.id),
                      );
                    }}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "rgba(196, 69, 69, 0.1)",
                      border: "1px solid rgba(196, 69, 69, 0.3)",
                      color: "var(--color-error)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      outline: "none",
                      flexShrink: 0,
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "var(--color-error)";
                      e.currentTarget.style.color = "#ffffff";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background =
                        "rgba(196, 69, 69, 0.1)";
                      e.currentTarget.style.color = "var(--color-error)";
                    }}
                    title="Xóa điều kiện"
                  >
                    <FiTrash style={{ fontSize: "0.8rem" }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Nút "+" để thêm dòng điều kiện lọc mới, mặc định là lọc theo giới tính */}
          <div style={{ display: "flex", marginTop: "var(--spacing-md)" }}>
            <button
              type="button"
              onClick={() => {
                setDynamicFilters([
                  ...dynamicFilters,
                  {
                    id: Date.now(),
                    field: "gender",
                    operator: "select",
                    value: "",
                  },
                ]);
              }}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "#ffffff",
                border: "none",
                color: "#000000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "1.2rem",
                boxShadow: "var(--shadow-md)",
                transition: "all 0.2s",
                outline: "none",
              }}
              title="Thêm điều kiện lọc"
              onMouseOver={(e) => {
                e.currentTarget.style.background = "var(--color-accent)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "#ffffff";
              }}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Mẫu tùy chỉnh hiển thị trực tiếp bảng số liệu, các mẫu chuẩn còn lại thì có thêm tab biểu đồ */}
      {selectedTemplateId === "custom_report" ? (
        dynamicFilters.length === 0 ? (
          <div
            className="card animate-fade-in"
            style={{
              padding: "var(--spacing-2xl)",
              textAlign: "center",
              marginTop: "var(--spacing-lg)",
            }}
          >
            <FiFilter
              style={{
                fontSize: "2.5rem",
                color: "var(--color-accent)",
                marginBottom: "var(--spacing-md)",
                opacity: 0.7,
                margin: "0 auto var(--spacing-md) auto",
              }}
            />
            <h3
              style={{
                fontSize: "var(--font-size-lg)",
                color: "var(--color-text-primary)",
                marginBottom: "8px",
              }}
            >
              Chưa chọn tiêu chí thống kê
            </h3>
            <p
              className="text-muted"
              style={{ margin: 0, fontSize: "var(--font-size-sm)" }}
            >
              Vui lòng nhấn nút{" "}
              <strong style={{ color: "var(--color-accent)" }}>"+"</strong> ở
              trên để thêm tiêu chí thống kê tùy chọn.
            </p>
          </div>
        ) : stats ? (
          <div style={{ marginTop: "var(--spacing-lg)" }}>
            <StatsTable
              totalMembers={stats.totalMembers}
              prevTotal={stats.prevTotal}
              table1={stats.table1}
              table2={stats.table2}
              table3={stats.table3}
              reportYear={stats.reportYear}
              comparisonYear={stats.comparisonYear}
            />
          </div>
        ) : (
          <div
            className="card"
            style={{
              padding: "var(--spacing-2xl)",
              textAlign: "center",
              marginTop: "var(--spacing-lg)",
            }}
          >
            <p className="text-muted">
              Không có dữ liệu đảng viên để thống kê.
            </p>
          </div>
        )
      ) : (
        <>
          {/* Chuyển đổi giữa xem biểu đồ và bảng chi tiết */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === "charts" ? "active" : ""}`}
              onClick={() => setActiveTab("charts")}
            >
              <FiBarChart2 style={{ marginRight: "6px" }} /> Biểu đồ
            </button>
            <button
              className={`tab ${activeTab === "table" ? "active" : ""}`}
              onClick={() => setActiveTab("table")}
            >
              <FiTable style={{ marginRight: "6px" }} /> Bảng chi tiết
            </button>
          </div>

          {/* Chỉ render bảng/biểu đồ khi đã tính được số liệu */}
          {stats ? (
            <div className="tab-content">
              {activeTab === "charts" ? (
                <ChartsView
                  stats={stats}
                  isCustom={selectedTemplate.isCustom}
                  dynamicFilters={dynamicFilters}
                  filteredMembers={filteredMembers}
                />
              ) : (
                <StatsTable
                  totalMembers={stats.totalMembers}
                  prevTotal={stats.prevTotal}
                  table1={stats.table1}
                  table2={stats.table2}
                  table3={stats.table3}
                  reportYear={stats.reportYear}
                  comparisonYear={stats.comparisonYear}
                />
              )}
            </div>
          ) : (
            <div
              className="card"
              style={{ padding: "var(--spacing-2xl)", textAlign: "center" }}
            >
              <p className="text-muted">
                Không có dữ liệu đảng viên để thống kê.
              </p>
            </div>
          )}
        </>
      )}

      <TemplatePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        templateId={previewTemplateId}
        templates={templates}
      />

      <UploadTemplateModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={() => {
          const saved = localStorage.getItem("custom_report_templates");
          setCustomTemplates(saved ? JSON.parse(saved) : []);
        }}
      />
    </div>
  );
}

// Khu vực hiển thị các biểu đồ thống kê, tách riêng khỏi component chính vì logic tính phân bố theo từng trường khá dài

function ChartsView({
  stats,
  isCustom,
  dynamicFilters = [],
  filteredMembers = [],
}) {
  const { charts, totalMembers } = stats;

  const activeFields = dynamicFilters
    .map((f) => f.field)
    .filter(
      (field) =>
        field && field !== "choNghiHuuMatSuc" && field !== "choNghiHuu",
    );
  const hasActiveFilters = activeFields.length > 0;

  const FIELD_LABELS = {
    gender: "Giới tính",
    ethnic: "Dân tộc",
    religion: "Tôn giáo",
    mienSinhHoat: "Miễn sinh hoạt",
    joinPeriod: "Ngày vào đảng",
    tuoiDoi: "Tuổi đời",
    trinhDoGDPT: "Trình độ giáo dục phổ thông",
    trinhDoNghiepVu: "Trình độ nghiệp vụ",
    hocHam: "Chức danh khoa học",
    lyLuanChinhTri: "Trình độ lý luận chính trị",
    tuoiDang: "Tuổi đảng",
    rank: "Cấp bậc quân hàm",
    chucVuDang: "Chức vụ Đảng",
    khenThuong: "Khen thưởng",
    kyLuat: "Kỷ luật",
  };

  const getFieldDistribution = (membersList, fieldName) => {
    const counts = {};
    const refYear = stats.reportYear || new Date().getFullYear();

    membersList.forEach((m) => {
      let val = "";
      if (fieldName === "mienSinhHoat") {
        val =
          !!m.NgayMienCongTac || m.TrangThai === "MIEN_SINH_HOAT"
            ? "Có"
            : "Không";
      } else if (fieldName === "joinPeriod") {
        if (!m.NgayVaoDang) {
          val = "Chưa cập nhật";
        } else {
          const joinDate = new Date(m.NgayVaoDang);
          if (joinDate <= new Date("1975-04-30")) val = "Từ 30/4/1975 về trước";
          else if (joinDate <= new Date("1985-12-31"))
            val = "Từ 1/5/1975 đến 31/12/1985";
          else if (joinDate <= new Date("1996-12-31"))
            val = "Từ 1/1/1986 đến 31/12/1996";
          else if (joinDate <= new Date("2010-12-31"))
            val = "Từ 1/1/1997 đến 31/12/2010";
          else val = "Từ 1/1/2011 đến nay";
        }
      } else if (fieldName === "tuoiDoi") {
        if (!m.NgaySinh) {
          val = "Chưa cập nhật";
        } else {
          const age = refYear - new Date(m.NgaySinh).getFullYear();
          if (age >= 18 && age <= 30) val = "Từ 18 đến 30 tuổi";
          else if (age >= 31 && age <= 40) val = "Từ 31 đến 40 tuổi";
          else if (age >= 41 && age <= 50) val = "Từ 41 đến 50 tuổi";
          else if (age >= 51 && age <= 60) val = "Từ 51 đến 60 tuổi";
          else val = "Từ 61 tuổi trở lên";
        }
      } else if (fieldName === "tuoiDang") {
        if (!m.NgayVaoDang) {
          val = "Chưa cập nhật";
        } else {
          const partyAge = refYear - new Date(m.NgayVaoDang).getFullYear();
          if (partyAge < 30) val = "dưới 30 năm";
          else if (partyAge >= 30 && partyAge < 40)
            val = "từ 30 năm đến 40 năm";
          else if (partyAge >= 40 && partyAge < 50)
            val = "từ 40 năm đến 50 năm";
          else val = "từ 50 năm trở lên";
        }
      } else if (fieldName === "trinhDoGDPT") {
        const lowerVal = (m.GiaoDucPhoThong || "").toLowerCase().trim();
        if (
          lowerVal.includes("trung học phổ thông") ||
          lowerVal.includes("thpt") ||
          lowerVal === "12/12" ||
          lowerVal.includes("10/10")
        ) {
          val = "Trung học phổ thông";
        } else if (
          lowerVal.includes("trung học cơ sở") ||
          lowerVal.includes("thcs") ||
          lowerVal === "9/12" ||
          lowerVal.includes("7/10")
        ) {
          val = "Trung học cơ sở";
        } else if (
          lowerVal.includes("tiểu học") ||
          lowerVal === "5/12" ||
          lowerVal.includes("th")
        ) {
          val = "Tiểu học";
        } else {
          const match = lowerVal.match(/(\d+)\/12/);
          if (match) {
            const num = parseInt(match[1]);
            if (num >= 10) val = "Trung học phổ thông";
            else if (num >= 6) val = "Trung học cơ sở";
            else val = "Tiểu học";
          } else {
            val = m.GiaoDucPhoThong || "Chưa cập nhật";
          }
        }
      } else if (fieldName === "trinhDoNghiepVu") {
        const hocVi = (m.HocVi || "").toLowerCase();
        const dhSauDH = (m.GiaoDucDaiHoc || "").toLowerCase();
        const gdnn = (m.trinhDoGDNN || "").toLowerCase();

        if (
          hocVi.includes("tiến sĩ khoa học") ||
          hocVi.includes("tiến sỹ khoa học")
        )
          val = "Tiến sĩ khoa học";
        else if (hocVi.includes("tiến sĩ") || hocVi.includes("tiến sỹ"))
          val = "Tiến sĩ";
        else if (hocVi.includes("thạc sĩ") || hocVi.includes("thạc sỹ"))
          val = "Thạc sĩ";
        else if (
          dhSauDH.includes("đại học") ||
          hocVi.includes("cử nhân") ||
          hocVi.includes("kỹ sư")
        )
          val = "Đại học";
        else if (dhSauDH.includes("cao đẳng") || gdnn.includes("cao đẳng"))
          val = "Cao đẳng";
        else if (
          gdnn.includes("trung cấp") ||
          gdnn.includes("trung học chuyên nghiệp") ||
          gdnn.includes("trung học cn")
        )
          val = "Trung học CN";
        else if (gdnn.includes("sơ cấp")) val = "Sơ cấp";
        else val = "Chưa cập nhật";
      } else if (fieldName === "hocHam") {
        const lowerVal = (m.HocHam || "").toLowerCase();
        if (lowerVal.includes("phó giáo sư") || lowerVal.includes("pgs"))
          val = "Phó giáo sư";
        else if (lowerVal.includes("giáo sư") || lowerVal.includes("gs"))
          val = "Giáo sư";
        else val = "Không có";
      } else if (fieldName === "lyLuanChinhTri") {
        const lowerVal = (m.LyLuanChinhTri || "").toLowerCase();
        if (lowerVal.includes("cử nhân") || lowerVal.includes("cao cấp"))
          val = "cử nhân, cao cấp";
        else if (lowerVal.includes("trung cấp")) val = "trung cấp";
        else if (lowerVal.includes("sơ cấp")) val = "sơ cấp";
        else if (lowerVal.includes("cơ sở")) val = "cơ sở";
        else val = "Chưa cập nhật";
      } else if (fieldName === "khenThuong") {
        const raw = m.KhenThuong;
        if (!raw || String(raw).trim() === "") {
          counts["Không có"] = (counts["Không có"] || 0) + 1;
        } else {
          const rewards = String(raw)
            .split(";")
            .map((r) => r.trim())
            .filter(Boolean);
          let hasMatchingReward = false;
          rewards.forEach((reward) => {
            const years = (reward.match(/\b\d{4}\b/g) || []).map(Number);
            const matches = years.some((y) => y === refYear);
            if (matches) {
              const cleanLabel =
                reward.replace(/\s*\([^)]*\b\d{4}\b[^)]*\)/g, "").trim() ||
                "Không có";
              counts[cleanLabel] = (counts[cleanLabel] || 0) + 1;
              hasMatchingReward = true;
            }
          });
          if (!hasMatchingReward) {
            counts["Không có"] = (counts["Không có"] || 0) + 1;
          }
        }
        return;
      } else {
        const raw = m[fieldName];
        if (raw === undefined || raw === null || String(raw).trim() === "") {
          val = fieldName === "chucVuDang" ? "Không có" : "Chưa cập nhật";
        } else {
          val = String(raw).trim();
        }
      }

      counts[val] = (counts[val] || 0) + 1;
    });

    const total = membersList.length;
    const dataList = Object.keys(counts).map((key) => ({
      label: key,
      count: counts[key],
      pct: total > 0 ? Math.round((counts[key] / total) * 100) : 0,
    }));

    dataList.sort((a, b) => b.count - a.count);
    return dataList;
  };

  const baselineFields = [
    "gender",
    "rank",
    "hocVi",
    "giaoDucPhoThong",
    "lyLuanChinhTri",
    "ethnic",
  ];
  const otherActiveFields = activeFields.filter(
    (f) =>
      !baselineFields.includes(f) &&
      f !== "choNghiHuuMatSuc" &&
      f !== "choNghiHuu",
  );

  // Nhóm biểu đồ nền tảng luôn hiển thị mặc định (giới tính, cấp bậc, học vị...), không phụ thuộc bộ lọc động
  const renderGenderChart = () => (
    <div className="card animate-fade-in">
      <div className="card-header">
        <h3 className="card-title">Cơ cấu Giới tính</h3>
      </div>
      <div style={{ padding: "var(--spacing-lg)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "var(--spacing-xs)",
          }}
        >
          <span style={{ fontWeight: 600, color: "var(--color-accent)" }}>
            Nam: {charts.gender.male} ({charts.gender.malePct}%)
          </span>
          <span style={{ fontWeight: 600, color: "var(--color-success)" }}>
            Nữ: {charts.gender.female} ({charts.gender.femalePct}%)
          </span>
        </div>
        <div
          style={{
            display: "flex",
            height: "24px",
            borderRadius: "12px",
            overflow: "hidden",
            background: "var(--color-bg-tertiary)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              width: `${charts.gender.malePct}%`,
              background: "var(--color-accent)",
              transition: "width 0.5s ease-out",
            }}
          />
          <div
            style={{
              width: `${charts.gender.femalePct}%`,
              background: "var(--color-success)",
              transition: "width 0.5s ease-out",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: "var(--spacing-md)",
            marginTop: "var(--spacing-md)",
            fontSize: "var(--font-size-xs)",
          }}
        >
          <LegendItem color="var(--color-accent)" label="Nam" />
          <LegendItem color="var(--color-success)" label="Nữ" />
        </div>
      </div>
    </div>
  );

  const renderAgeChart = () => (
    <div className="card animate-fade-in">
      <div className="card-header">
        <h3 className="card-title">Cơ cấu Độ tuổi đời</h3>
      </div>
      <div style={{ padding: "var(--spacing-lg)" }}>
        <StatsBarChart data={charts.ageGroups} color="var(--color-accent)" />
      </div>
    </div>
  );

  const renderPartyAgeChart = () => (
    <div className="card animate-fade-in">
      <div className="card-header">
        <h3 className="card-title">Cơ cấu Tuổi Đảng</h3>
      </div>
      <div style={{ padding: "var(--spacing-lg)" }}>
        <StatsBarChart
          data={charts.partyAgeGroups}
          color="var(--color-success)"
        />
      </div>
    </div>
  );

  const renderRankChart = () => (
    <div className="card animate-fade-in">
      <div className="card-header">
        <h3 className="card-title">Cơ cấu Cấp bậc Quân hàm</h3>
      </div>
      <div
        style={{
          padding: "var(--spacing-lg)",
          maxHeight: "350px",
          overflowY: "auto",
        }}
      >
        <StatsBarChart data={charts.rankChart} color="#a3b899" />
      </div>
    </div>
  );

  const renderEducationChart = () => (
    <div className="card animate-fade-in">
      <div className="card-header">
        <h3 className="card-title">Trình độ Chuyên môn</h3>
      </div>
      <div style={{ padding: "var(--spacing-lg)" }}>
        <StatsBarChart
          data={charts.educationChart}
          color="var(--color-accent)"
        />
      </div>
    </div>
  );

  const renderPoliticalChart = () => (
    <div className="card animate-fade-in">
      <div className="card-header">
        <h3 className="card-title">Trình độ Lý luận Chính trị</h3>
      </div>
      <div style={{ padding: "var(--spacing-lg)" }}>
        <StatsBarChart data={charts.politicalChart} color="var(--color-info)" />
      </div>
    </div>
  );

  const renderEthnicChart = (fullWidth = false) => (
    <div
      className="card animate-fade-in"
      style={fullWidth ? { gridColumn: "span 2" } : {}}
    >
      <div className="card-header">
        <h3 className="card-title">Cơ cấu Dân tộc</h3>
      </div>
      <div
        style={{
          padding: "var(--spacing-lg)",
          maxHeight: "400px",
          overflowY: "auto",
        }}
      >
        <StatsBarChart
          data={charts.ethnicChart}
          color="var(--color-accent)"
          maxItems={10}
        />
        {charts.ethnicChart.length > 10 && (
          <p
            className="text-muted"
            style={{
              marginTop: "var(--spacing-md)",
              fontSize: "var(--font-size-xs)",
              textAlign: "center",
            }}
          >
            Hiển thị top 10 dân tộc. Xem đầy đủ trong tab "Bảng chi tiết".
          </p>
        )}
      </div>
    </div>
  );

  if (hasActiveFilters) {
    return (
      <div className="stats-charts-grid">
        {activeFields.includes("gender") && renderGenderChart()}
        {activeFields.includes("rank") && renderRankChart()}
        {(activeFields.includes("hocVi") ||
          activeFields.includes("giaoDucPhoThong")) &&
          renderEducationChart()}
        {activeFields.includes("lyLuanChinhTri") && renderPoliticalChart()}
        {activeFields.includes("ethnic") && renderEthnicChart()}

        {/* Với các trường lọc còn lại không nằm trong nhóm nền tảng, tự sinh thêm biểu đồ cột tương ứng */}
        {otherActiveFields.map((field) => {
          const data = getFieldDistribution(filteredMembers, field);
          const label = FIELD_LABELS[field] || field;
          return (
            <div className="card animate-fade-in" key={field}>
              <div className="card-header">
                <h3 className="card-title">Cơ cấu {label}</h3>
              </div>
              <div style={{ padding: "var(--spacing-lg)" }}>
                <StatsBarChart data={data} color="var(--color-accent)" />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Chưa lọc gì thì hiển thị bộ biểu đồ tổng quan mặc định theo bố cục cố định
  return (
    <>
      <div className="stats-charts-grid">
        {renderGenderChart()}
        {renderAgeChart()}
      </div>

      <div
        className="stats-charts-grid"
        style={{ marginTop: "var(--spacing-xl)" }}
      >
        {renderPartyAgeChart()}
        {renderRankChart()}
      </div>

      <div
        className="stats-charts-grid"
        style={{ marginTop: "var(--spacing-xl)" }}
      >
        {renderEducationChart()}
        {renderPoliticalChart()}
      </div>

      <div style={{ marginTop: "var(--spacing-xl)" }}>
        {renderEthnicChart(true)}
      </div>
    </>
  );
}

// Các thành phần dùng chung cho nhiều nơi trong trang (chú thích màu, modal xem trước mẫu...)

function LegendItem({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span
        style={{
          display: "inline-block",
          width: "12px",
          height: "12px",
          borderRadius: "3px",
          background: color,
        }}
      />
      <span>{label}</span>
    </div>
  );
}

function TemplatePreviewModal({ isOpen, onClose, templateId, templates = [] }) {
  const [pdfExists, setPdfExists] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [uploadedHtml, setUploadedHtml] = useState("");

  const matchedTemplate = templates.find((t) => t.id === templateId);

  useEffect(() => {
    if (!isOpen || !matchedTemplate?.isUploaded) {
      setUploadedHtml("");
      return;
    }
    renderUploadedTemplateHtml(matchedTemplate).then(setUploadedHtml);
  }, [isOpen, templateId]);

  useEffect(() => {
    if (!isOpen || !templateId) {
      setPdfExists(false);
      return;
    }

    // Các file PDF mẫu được backend lưu sẵn trong thư mục uploads/report_templates/
    const pdfFileName =
      templateId === "mau_6_tkct" ? "mau_so_6_tkct" : templateId;
    const pdfPath = `/uploads/report_templates/${pdfFileName}.pdf`;

    // Gửi HEAD request để kiểm tra PDF có tồn tại không, tránh phải tải cả file chỉ để biết có hay không
    fetch(pdfPath, { method: "HEAD" })
      .then((res) => {
        if (res.ok) {
          setPdfExists(true);
          setPdfUrl(pdfPath);
        } else {
          setPdfExists(false);
        }
      })
      .catch(() => {
        setPdfExists(false);
      });
  }, [isOpen, templateId]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(5px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--color-bg-secondary, #1e251c)",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
          width: "90%",
          maxWidth: "750px",
          padding: "24px",
          boxShadow: "var(--shadow-lg)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--color-border)",
            paddingBottom: "12px",
            marginBottom: "16px",
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "var(--color-accent)",
              fontSize: "1.25rem",
              fontWeight: 600,
            }}
          >
            Mẫu báo cáo:{" "}
            {templateId === "mau_6_tkct"
              ? "Mẫu 6-TKCT"
              : templateId === "mau_12_btc"
                ? "Mẫu 12-BTC"
                : templateId === "mau_15_dv"
                  ? "Mẫu 15-ĐV"
                  : matchedTemplate?.name || "Thống kê tùy biến"}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              outline: "none",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ fontSize: "var(--font-size-sm)", lineHeight: 1.6 }}>
          {pdfExists ? (
            /* Hiển thị PDF bằng iframe, dùng chung cách làm với phần xem tệp đính kèm hồ sơ đảng viên */
            <div
              style={{
                width: "100%",
                height: "65vh",
                minHeight: "450px",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                overflow: "hidden",
                background: "var(--color-bg-tertiary)",
              }}
            >
              <iframe
                src={pdfUrl}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
                title="Bản xem trước PDF"
              />
            </div>
          ) : (
            /* Chưa có PDF thì tạm dùng bản dựng lại bằng HTML/bảng Excel để người dùng vẫn hình dung được mẫu */
            <>
              {/* Dựng lại giao diện bảng tính Excel của mẫu tải lên theo dữ liệu thực tế */}
              {matchedTemplate && matchedTemplate.isUploaded && (
                <div>
                  <p className="text-muted" style={{ marginBottom: "16px" }}>
                    Bản xem trước của tệp mẫu Excel "{matchedTemplate.name}" (
                    {matchedTemplate.fileName}):
                  </p>
                  <div
                    style={{
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      padding: "16px",
                      background: "var(--color-bg-tertiary)",
                      overflowX: "auto",
                      maxHeight: "400px",
                      overflowY: "auto",
                    }}
                    dangerouslySetInnerHTML={{
                      __html:
                        uploadedHtml ||
                        '<p class="text-muted">Đang tải bản xem trước...</p>',
                    }}
                  />
                </div>
              )}

              {templateId === "mau_6_tkct" && (
                <div>
                  <p className="text-muted" style={{ marginBottom: "16px" }}>
                    Mẫu báo cáo 6-TKCT của Ban Tổ chức Trung ương biên soạn bảng
                    biểu chi tiết gồm 3 phần dữ liệu chính:
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    {/* Xem trước Bảng 1 - tổng hợp đội ngũ đảng viên */}
                    <div
                      style={{
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                        padding: "12px",
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <h4
                        style={{
                          color: "var(--color-accent)",
                          margin: "0 0 8px 0",
                          fontSize: "0.9rem",
                        }}
                      >
                        Bảng 1: Thống kê tổng hợp đội ngũ đảng viên
                      </h4>
                      <table
                        style={{
                          width: "100%",
                          fontSize: "0.8rem",
                          borderCollapse: "collapse",
                          textAlign: "left",
                        }}
                      >
                        <thead>
                          <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                            <th
                              style={{
                                padding: "6px",
                                border: "1px solid var(--color-border)",
                              }}
                            >
                              Chỉ tiêu thống kê
                            </th>
                            <th
                              style={{
                                padding: "6px",
                                border: "1px solid var(--color-border)",
                                width: "80px",
                                textAlign: "right",
                              }}
                            >
                              Kỳ này
                            </th>
                            <th
                              style={{
                                padding: "6px",
                                border: "1px solid var(--color-border)",
                                width: "80px",
                                textAlign: "right",
                              }}
                            >
                              Kỳ trước
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td
                              style={{
                                padding: "6px",
                                border: "1px solid var(--color-border)",
                              }}
                            >
                              1. Tổng số đảng viên
                            </td>
                            <td
                              style={{
                                padding: "6px",
                                border: "1px solid var(--color-border)",
                                textAlign: "right",
                              }}
                            >
                              ...
                            </td>
                            <td
                              style={{
                                padding: "6px",
                                border: "1px solid var(--color-border)",
                                textAlign: "right",
                              }}
                            >
                              ...
                            </td>
                          </tr>
                          <tr>
                            <td
                              style={{
                                padding: "6px",
                                border: "1px solid var(--color-border)",
                                paddingLeft: "15px",
                              }}
                            >
                              - Trong đó: Đảng viên dự bị
                            </td>
                            <td
                              style={{
                                padding: "6px",
                                border: "1px solid var(--color-border)",
                                textAlign: "right",
                              }}
                            >
                              ...
                            </td>
                            <td
                              style={{
                                padding: "6px",
                                border: "1px solid var(--color-border)",
                                textAlign: "right",
                              }}
                            >
                              ...
                            </td>
                          </tr>
                          <tr>
                            <td
                              style={{
                                padding: "6px",
                                border: "1px solid var(--color-border)",
                              }}
                            >
                              2. Trình độ học vấn, chuyên môn
                            </td>
                            <td
                              style={{
                                padding: "6px",
                                border: "1px solid var(--color-border)",
                                textAlign: "right",
                              }}
                            >
                              ...
                            </td>
                            <td
                              style={{
                                padding: "6px",
                                border: "1px solid var(--color-border)",
                                textAlign: "right",
                              }}
                            >
                              ...
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Xem trước Bảng 2 - cơ cấu dân tộc và tôn giáo */}
                    <div
                      style={{
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                        padding: "12px",
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <h4
                        style={{
                          color: "var(--color-accent)",
                          margin: "0 0 8px 0",
                          fontSize: "0.9rem",
                        }}
                      >
                        Bảng 2: Thống kê cơ cấu Dân tộc & Tôn giáo
                      </h4>
                      <p
                        className="text-muted"
                        style={{ margin: 0, fontSize: "0.8rem" }}
                      >
                        Phân tích chi tiết số lượng và tỷ lệ % đảng viên thuộc
                        56 dân tộc Việt Nam và 7 hệ tôn giáo chính.
                      </p>
                    </div>

                    {/* Xem trước Bảng 3 - phân loại theo tuổi Đảng */}
                    <div
                      style={{
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                        padding: "12px",
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <h4
                        style={{
                          color: "var(--color-accent)",
                          margin: "0 0 8px 0",
                          fontSize: "0.9rem",
                        }}
                      >
                        Bảng 3: Phân loại theo Tuổi Đảng
                      </h4>
                      <p
                        className="text-muted"
                        style={{ margin: 0, fontSize: "0.8rem" }}
                      >
                        Phân nhóm đảng viên theo thâm niên sinh hoạt Đảng: Dưới
                        5 năm, từ 5-10 năm, từ 10-30 năm, và trên 30 năm.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {templateId === "mau_12_btc" && (
                <div>
                  <p className="text-muted" style={{ marginBottom: "16px" }}>
                    Mẫu báo cáo 12-BTC thống kê cơ cấu quân nhân chuyên nghiệp
                    (QNCN) trong chi bộ/đảng bộ:
                  </p>

                  <div
                    style={{
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      padding: "12px",
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <h4
                      style={{
                        color: "var(--color-accent)",
                        margin: "0 0 8px 0",
                        fontSize: "0.9rem",
                      }}
                    >
                      Bảng thống kê quân nhân chuyên nghiệp
                    </h4>
                    <table
                      style={{
                        width: "100%",
                        fontSize: "0.8rem",
                        borderCollapse: "collapse",
                        textAlign: "left",
                      }}
                    >
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                          <th
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            Cấp bậc QNCN
                          </th>
                          <th
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              width: "80px",
                              textAlign: "right",
                            }}
                          >
                            Kỳ này
                          </th>
                          <th
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              width: "80px",
                              textAlign: "right",
                            }}
                          >
                            Tỷ lệ %
                          </th>
                          <th
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              width: "80px",
                              textAlign: "right",
                            }}
                          >
                            Kỳ trước
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            Thượng tá QNCN
                          </td>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              textAlign: "right",
                            }}
                          >
                            ...
                          </td>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              textAlign: "right",
                            }}
                          >
                            ...
                          </td>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              textAlign: "right",
                            }}
                          >
                            ...
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            Trung tá QNCN
                          </td>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              textAlign: "right",
                            }}
                          >
                            ...
                          </td>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              textAlign: "right",
                            }}
                          >
                            ...
                          </td>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              textAlign: "right",
                            }}
                          >
                            ...
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            Thiếu tá QNCN
                          </td>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              textAlign: "right",
                            }}
                          >
                            ...
                          </td>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              textAlign: "right",
                            }}
                          >
                            ...
                          </td>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              textAlign: "right",
                            }}
                          >
                            ...
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {templateId === "mau_15_dv" && (
                <div>
                  <p className="text-muted" style={{ marginBottom: "16px" }}>
                    Mẫu báo cáo 15-ĐV thống kê danh sách và thành tích khen
                    thưởng của các đảng viên có thành tích xuất sắc:
                  </p>

                  <div
                    style={{
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      padding: "12px",
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <h4
                      style={{
                        color: "var(--color-accent)",
                        margin: "0 0 8px 0",
                        fontSize: "0.9rem",
                      }}
                    >
                      Bảng tổng hợp khen thưởng đảng viên
                    </h4>
                    <table
                      style={{
                        width: "100%",
                        fontSize: "0.8rem",
                        borderCollapse: "collapse",
                        textAlign: "left",
                      }}
                    >
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                          <th
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            Hình thức khen thưởng
                          </th>
                          <th
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              width: "80px",
                              textAlign: "right",
                            }}
                          >
                            Số lượng
                          </th>
                          <th
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              width: "120px",
                            }}
                          >
                            Ghi chú
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            Bằng khen của Bộ Quốc phòng
                          </td>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              textAlign: "right",
                            }}
                          >
                            ...
                          </td>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            Ghi nhận thành tích năm
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            Chiến sĩ thi đua cấp Tổng cục
                          </td>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              textAlign: "right",
                            }}
                          >
                            ...
                          </td>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            Ghi nhận hoàn thành xuất sắc
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {(templateId === "custom_report" ||
                (templateId !== "mau_6_tkct" &&
                  templateId !== "mau_12_btc" &&
                  templateId !== "mau_15_dv" &&
                  !matchedTemplate?.isUploaded)) && (
                <div>
                  <p className="text-muted" style={{ marginBottom: "16px" }}>
                    Báo cáo Thống kê tùy biến cho phép xuất dữ liệu cơ cấu động
                    và so sánh cùng kỳ năm ngoái của tiêu chí được chọn:
                  </p>

                  <div
                    style={{
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      padding: "12px",
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <h4
                      style={{
                        color: "var(--color-accent)",
                        margin: "0 0 8px 0",
                        fontSize: "0.9rem",
                      }}
                    >
                      Bảng thống kê tùy biến (Ví dụ tiêu chí: Cấp bậc)
                    </h4>
                    <table
                      style={{
                        width: "100%",
                        fontSize: "0.8rem",
                        borderCollapse: "collapse",
                        textAlign: "left",
                      }}
                    >
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                          <th
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            Cấp bậc
                          </th>
                          <th
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              width: "70px",
                              textAlign: "right",
                            }}
                          >
                            Kỳ này
                          </th>
                          <th
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              width: "70px",
                              textAlign: "right",
                            }}
                          >
                            Tỷ lệ %
                          </th>
                          <th
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              width: "80px",
                              textAlign: "right",
                            }}
                          >
                            Kỳ trước
                          </th>
                          <th
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              width: "80px",
                              textAlign: "right",
                            }}
                          >
                            So sánh YoY
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            Thiếu tá
                          </td>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              textAlign: "right",
                            }}
                          >
                            ...
                          </td>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              textAlign: "right",
                            }}
                          >
                            ...
                          </td>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              textAlign: "right",
                            }}
                          >
                            ...
                          </td>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              textAlign: "right",
                            }}
                          >
                            ...
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            Đại úy
                          </td>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              textAlign: "right",
                            }}
                          >
                            ...
                          </td>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              textAlign: "right",
                            }}
                          >
                            ...
                          </td>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              textAlign: "right",
                            }}
                          >
                            ...
                          </td>
                          <td
                            style={{
                              padding: "6px",
                              border: "1px solid var(--color-border)",
                              textAlign: "right",
                            }}
                          >
                            ...
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "20px",
            borderTop: "1px solid var(--color-border)",
            paddingTop: "16px",
          }}
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {pdfExists && (
              <a
                href={pdfUrl}
                download={`${templateId}.pdf`}
                className="btn btn-accent"
                style={{
                  padding: "8px 16px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "var(--font-size-sm)",
                  borderRadius: "20px",
                }}
              >
                <FiFileText /> Tải bản PDF mẫu (.pdf)
              </a>
            )}
            {templateId === "mau_6_tkct" && (
              <a
                href="/mau_so_6_tkct.docx"
                download="mau_so_6_tkct.docx"
                className="btn btn-secondary"
                style={{
                  padding: "8px 16px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "var(--font-size-sm)",
                  borderRadius: "20px",
                }}
              >
                <FiFileText /> Tải mẫu tệp gốc (.docx)
              </a>
            )}
            {matchedTemplate && matchedTemplate.isUploaded && (
              <button
                onClick={() => {
                  const binaryString = window.atob(matchedTemplate.fileData);
                  const len = binaryString.length;
                  const bytes = new Uint8Array(len);
                  for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  const blob = new Blob([bytes.buffer], {
                    type: "application/octet-stream",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = matchedTemplate.fileName;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="btn btn-secondary"
                style={{
                  padding: "8px 16px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "var(--font-size-sm)",
                  borderRadius: "20px",
                }}
              >
                <FiFileText /> Tải mẫu tệp gốc (.xlsx)
              </button>
            )}
          </div>
          <button
            className="btn btn-primary"
            onClick={onClose}
            style={{ borderRadius: "20px" }}
          >
            Đóng xem trước
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal cho phép người dùng tải lên một tệp Excel làm mẫu báo cáo riêng của đơn vị

function UploadTemplateModal({ isOpen, onClose, onUploadSuccess }) {
  const [templateName, setTemplateName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith(".xlsx")) {
        toast.error("Vui lòng chỉ tải lên tệp tin định dạng Excel (.xlsx)");
        return;
      }
      setSelectedFile(file);
      if (!templateName) {
        setTemplateName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!templateName.trim()) {
      toast.error("Vui lòng nhập tên mẫu báo cáo.");
      return;
    }
    if (!selectedFile) {
      toast.error("Vui lòng chọn tệp tin Excel mẫu.");
      return;
    }

    try {
      setUploading(true);
      const base64Data = await fileToBase64(selectedFile);

      const newTemplate = {
        id: `uploaded_${Date.now()}`,
        name: templateName.trim(),
        fileName: selectedFile.name,
        fileData: base64Data,
        defaultFilters: [],
        description: `Mẫu báo cáo tải lên từ file ${selectedFile.name}`,
      };

      const saved = localStorage.getItem("custom_report_templates");
      const templates = saved ? JSON.parse(saved) : [];
      templates.push(newTemplate);

      localStorage.setItem(
        "custom_report_templates",
        JSON.stringify(templates),
      );

      toast.success("Tải lên và lưu mẫu báo cáo Excel thành công!");
      onUploadSuccess();
      setTemplateName("");
      setSelectedFile(null);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(`Không thể xử lý tệp Excel: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(5px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--color-bg-secondary, #1e251c)",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
          width: "90%",
          maxWidth: "550px",
          padding: "24px",
          boxShadow: "var(--shadow-lg)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--color-border)",
            paddingBottom: "12px",
            marginBottom: "16px",
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "var(--color-accent)",
              fontSize: "1.25rem",
              fontWeight: 600,
            }}
          >
            Tải lên mẫu báo cáo Excel (.xlsx)
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              outline: "none",
            }}
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div className="form-group">
            <label
              className="form-label"
              style={{
                fontWeight: 600,
                display: "block",
                marginBottom: "6px",
                fontSize: "var(--font-size-xs)",
                textTransform: "uppercase",
                color: "var(--color-text-muted)",
              }}
            >
              Tên mẫu báo cáo:
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ví dụ: Thống kê chi bộ quý II"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              style={{ borderRadius: "20px" }}
            />
          </div>

          <div className="form-group">
            <label
              className="form-label"
              style={{
                fontWeight: 600,
                display: "block",
                marginBottom: "6px",
                fontSize: "var(--font-size-xs)",
                textTransform: "uppercase",
                color: "var(--color-text-muted)",
              }}
            >
              Chọn tệp tin mẫu (.xlsx):
            </label>
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              style={{ display: "block", width: "100%", fontSize: "0.85rem" }}
            />
          </div>

          <div
            style={{
              background: "var(--color-bg-tertiary)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "var(--font-size-xs)",
              lineHeight: 1.5,
            }}
          >
            <h4
              style={{
                color: "var(--color-accent)",
                margin: "0 0 6px 0",
                fontSize: "var(--font-size-xs)",
              }}
            >
              Hướng dẫn sử dụng placeholder trong Excel:
            </h4>
            <ul
              style={{
                paddingLeft: "16px",
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                color: "var(--color-text-secondary)",
              }}
            >
              <li>
                <code>{"{{tong_so}}"}</code> hoặc <code>{"{{total}}"}</code>:
                Tổng số đảng viên.
              </li>
              <li>
                <code>{"{{nu_so_luong}}"}</code> hoặc{" "}
                <code>{"{{female_count}}"}</code>: Số đảng viên nữ.
              </li>
              <li>
                <code>{"{{nu_ti_le}}"}</code> hoặc{" "}
                <code>{"{{female_pct}}"}</code>: Tỷ lệ % đảng viên nữ.
              </li>
              <li>
                <code>{"{{field:gender:Nam}}"}</code>: Đếm đảng viên có giới
                tính Nam.
              </li>
              <li>
                <code>{"{{field:rank:Trung tá QNCN}}"}</code>: Đếm đảng viên có
                cấp bậc Trung tá QNCN.
              </li>
              <li>
                <code>{"{{pct:trangThai:HOAT_DONG}}"}</code>: Tính tỷ lệ % đảng
                viên đang hoạt động.
              </li>
            </ul>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: "12px",
              borderTop: "1px solid var(--color-border)",
              paddingTop: "16px",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={uploading}
              style={{ borderRadius: "20px" }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="btn btn-accent"
              disabled={uploading}
              style={{ borderRadius: "20px" }}
            >
              {uploading ? "Đang xử lý..." : "Lưu mẫu báo cáo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
