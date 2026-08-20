import { useState, useEffect, useMemo } from "react";
import { ROLES } from "../../utils/constants";
import {
  FiUsers,
  FiActivity,
  FiFileText,
  FiAward,
  FiCalendar,
  FiClock,
  FiFilter,
} from "../../components/icons";
import toast from "react-hot-toast";

import memberApi from "../../api/memberApi";
import orgApi from "../../api/orgApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import GlassSelect from "../../components/common/GlassSelect";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../contexts/AuthContext";

const getRankAtYear = (member, year) => {
  if (!member.LichSuQuanHam || member.LichSuQuanHam.length === 0) {
    return member.CapBac || "—";
  }
  const targetDate = new Date(`${year}-12-31T23:59:59.999Z`);
  const pastHistories = member.LichSuQuanHam.filter(
    (h) => h.NgayHieuLuc && new Date(h.NgayHieuLuc) <= targetDate,
  );
  if (pastHistories.length === 0) {
    const sorted = [...member.LichSuQuanHam].sort(
      (a, b) => new Date(a.NgayHieuLuc) - new Date(b.NgayHieuLuc),
    );
    return sorted[0]?.CapBac || member.CapBac || "—";
  }
  const sorted = [...pastHistories].sort(
    (a, b) => new Date(b.NgayHieuLuc) - new Date(a.NgayHieuLuc),
  );
  return sorted[0].CapBac || "—";
};

const shortenEvaluationRank = (rank) => {
  if (!rank) return "";
  const trimmed = rank.trim();

  if (
    trimmed === "Hoàn thành xuất sắc nhiệm vụ" ||
    trimmed === "Xuất sắc" ||
    trimmed.toLowerCase().includes("xuất sắc")
  ) {
    return "HTSXNV";
  }
  if (
    trimmed === "Hoàn thành tốt nhiệm vụ" ||
    trimmed === "Tốt" ||
    trimmed.toLowerCase().includes("tốt")
  ) {
    return "HTTNV";
  }
  if (
    trimmed === "Hoàn thành nhiệm vụ" ||
    trimmed === "Hoàn thành" ||
    trimmed.toLowerCase().includes("hoàn thành")
  ) {
    if (trimmed.toLowerCase().includes("không")) {
      return "KHTNV";
    }
    return "HTNV";
  }
  if (
    trimmed === "Không hoàn thành nhiệm vụ" ||
    trimmed === "Không hoàn thành" ||
    trimmed.toLowerCase().includes("không hoàn thành")
  ) {
    return "KHTNV";
  }
  return rank;
};

export default function ActivityStatsPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(() =>
    user?.role === ROLES.BI_THU ? user.orgId || "" : "",
  );
  const [loading, setLoading] = useState(true);

  // Các state cho bộ lọc thời gian và tiêu chí thống kê
  const currentYear = new Date().getFullYear();
  const [yearMode, setYearMode] = useState("single"); // "single": chọn 1 năm, "range": chọn khoảng năm
  const [singleYear, setSingleYear] = useState(currentYear);
  const [startYear, setStartYear] = useState(currentYear - 2);
  const [endYear, setEndYear] = useState(currentYear);
  const [filterActivity, setFilterActivity] = useState("ALL");

  useEffect(() => {
    fetchData();
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
      toast.error("Không thể tải dữ liệu báo cáo thống kê hoạt động.");
    } finally {
      setLoading(false);
    }
  };

  // Danh sách năm để chọn, tránh lặp vô hạn nên chặn mốc từ 1990 trở về
  const yearOptions = useMemo(() => {
    const list = [];
    for (let y = currentYear; y >= 1990; y--) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  // Các tổ chức được phép lọc cho Bí thư với bảo vệ chu kỳ
  const allowedOrganizations = useMemo(() => {
    if (!user) return [];
    if (user.role === ROLES.CAN_BO_CHINH_TRI) return organizations;

    const allowedIds = [];
    const visited = new Set();
    const findDescendants = (id) => {
      if (visited.has(id)) return;
      visited.add(id);
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

  // Đồng bộ selectedOrgId cho Bí thư
  useEffect(() => {
    if (user && user.role === ROLES.BI_THU && user.orgId && !selectedOrgId) {
      setSelectedOrgId(user.orgId);
    }
  }, [user, selectedOrgId]);

  // Tìm kiếm các tổ chức con an toàn với bộ theo dõi đã truy cập
  const getSubOrgIds = (orgId) => {
    const ids = [orgId];
    const visited = new Set([orgId]);
    const findChildren = (id) => {
      organizations.forEach((o) => {
        if (o.parentId === id && !visited.has(o.id)) {
          visited.add(o.id);
          ids.push(o.id);
          findChildren(o.id);
        }
      });
    };
    findChildren(orgId);
    return ids;
  };

  // Lọc thành viên theo cơ cấu tổ chức và theo thời điểm lịch sử (nếu đảng viên có lịch sử chuyển công tác -> lấy bản ghi orgHistory gần nhất)
  const filteredMembers = useMemo(() => {
    const targetOrgId =
      selectedOrgId || (user?.role === ROLES.BI_THU ? user.orgId : "");
    const refYear = yearMode === "single" ? singleYear : endYear;
    const targetDate = new Date(`${refYear}-12-31T23:59:59.999Z`);

    let list = members;
    if (targetOrgId) {
      const orgIds = getSubOrgIds(targetOrgId);
      list = list.filter((m) => {
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

    // Lọc theo năm vào đảng so với năm tham chiếu
    return list.filter((m) => {
      if (m.NgayVaoDang) {
        return new Date(m.NgayVaoDang).getFullYear() <= refYear;
      }
      if (m.CreatedAt) {
        return new Date(m.CreatedAt).getFullYear() <= refYear;
      }
      return true;
    });
  }, [
    members,
    selectedOrgId,
    organizations,
    yearMode,
    singleYear,
    endYear,
    user,
  ]);

  // Tính toán số liệu thống kê động
  const rangeStats = useMemo(() => {
    const sYear = yearMode === "single" ? singleYear : startYear;
    const eYear = yearMode === "single" ? singleYear : endYear;

    let newAdmittedCount = 0;
    let rewardedCount = 0;
    let disciplinedCount = 0;
    let rankPromotionCount = 0;
    let trainingCount = 0;

    filteredMembers.forEach((m) => {
      // 1. Đảng viên mới
      if (m.NgayVaoDang) {
        const y = new Date(m.NgayVaoDang).getFullYear();
        if (y >= sYear && y <= eYear) {
          newAdmittedCount++;
        }
      }

      // 2. Khen thưởng
      const rawReward = m.KhenThuong;
      if (rawReward) {
        const rewards = String(rawReward)
          .split(";")
          .map((r) => r.trim())
          .filter(Boolean);
        const hasRewardInRange = rewards.some((r) => {
          const years = (r.match(/\b\d{4}\b/g) || []).map(Number);
          return years.some((y) => y >= sYear && y <= eYear);
        });
        if (hasRewardInRange) {
          rewardedCount++;
        }
      }

      // 3. Kỷ luật
      const rawDisc = m.KyLuat;
      if (rawDisc) {
        const disciplines = String(rawDisc)
          .split(";")
          .map((d) => d.trim())
          .filter(Boolean);
        const hasDiscInRange = disciplines.some((d) => {
          const years = (d.match(/\b\d{4}\b/g) || []).map(Number);
          return years.some((y) => y >= sYear && y <= eYear);
        });
        if (hasDiscInRange) {
          disciplinedCount++;
        }
      }

      // 4. Thăng cấp
      if (Array.isArray(m.LichSuQuanHam)) {
        const hasPromotionInRange = m.LichSuQuanHam.some((r) => {
          if (r.NgayHieuLuc) {
            const y = new Date(r.NgayHieuLuc).getFullYear();
            return y >= sYear && y <= eYear;
          }
          return false;
        });
        if (hasPromotionInRange) {
          rankPromotionCount++;
        }
      }

      // 5. Đào tạo
      if (Array.isArray(m.QuaTrinhDaoTao)) {
        const hasTrainingInRange = m.QuaTrinhDaoTao.some((t) => {
          const startY = t.TuNgay ? new Date(t.TuNgay).getFullYear() : null;
          const endY = t.DenNgay ? new Date(t.DenNgay).getFullYear() : null;
          return (
            (startY && startY >= sYear && startY <= eYear) ||
            (endY && endY >= sYear && endY <= eYear)
          );
        });
        if (hasTrainingInRange) {
          trainingCount++;
        }
      }
    });

    return {
      newAdmittedCount,
      rewardedCount,
      disciplinedCount,
      rankPromotionCount,
      trainingCount,
    };
  }, [filteredMembers, yearMode, singleYear, startYear, endYear]);



  // Helper để tách các hình thức khen thưởng/kỷ luật một cách thông minh theo dấu phẩy và chấm phẩy (bỏ qua dấu phẩy bên trong dấu ngoặc đơn)
  const splitAwards = (str) => {
    if (!str) return [];
    const rawParts = String(str)
      .split(/(?:;|[\r\n]+|,(?![^(]*\)))/g)
      .map((p) => p.trim())
      .filter(Boolean);
    const parts = [];
    for (let i = 0; i < rawParts.length; i++) {
      const current = rawParts[i];
      const isJustYear = /^\s*(?:năm|và)?\s*\d{4}\s*$/i.test(current);
      if (isJustYear && parts.length > 0) {
        parts[parts.length - 1] += ", " + current;
      } else {
        parts.push(current);
      }
    }
    return parts;
  };

  // Loại bỏ cụm năm (vd "năm 2023, 2024") còn sót lại cuối chuỗi sau khi đã bỏ ngoặc đơn,
  // vì splitAwards() gộp các mốc năm rời rạc vào cuối đoạn text liền trước nó.
  const stripTrailingYears = (str) =>
    str
      .replace(/\s*(?:năm\s+)?\d{4}(?:\s*,\s*\d{4})*\s*$/i, "")
      .replace(/[,;]\s*$/, "")
      .trim();

  // Trích xuất danh sách thành viên theo loại hoạt động
  const getMembersWithActivityType = (type) => {
    const sYear = yearMode === "single" ? singleYear : startYear;
    const eYear = yearMode === "single" ? singleYear : endYear;
    const result = [];

    filteredMembers.forEach((m) => {
      let activities = [];

      if (type === "EVALUATION" && Array.isArray(m.DanhGiaDangVien)) {
        m.DanhGiaDangVien.forEach((ev) => {
          if (
            ev.Nam >= sYear &&
            ev.Nam <= eYear &&
            ev.TrangThai === "APPROVED"
          ) {
            activities.push({
              type: "EVALUATION",
              year: ev.Nam,
              label: `${shortenEvaluationRank(ev.XepLoai)} (${ev.Nam})`,
              decision: ev.QuyetDinh || ev.SoQuyetDinh
                ? { soQuyetDinh: ev.SoQuyetDinh || ev.QuyetDinh?.SoQuyetDinh }
                : null,
            });
          }
        });
      }

      if (type === "REWARD_DISCIPLINE") {
        if (m.KhenThuong) {
          const rewards = splitAwards(m.KhenThuong);
          rewards.forEach((r) => {
            const years = (r.match(/\b\d{4}\b/g) || []).map(Number);
            const rewardClean = stripTrailingYears(
              r.replace(/\s*\([^)]*\)/g, ""),
            );
            years.forEach((y) => {
              if (y >= sYear && y <= eYear && rewardClean) {
                activities.push({
                  type: "REWARD_DISCIPLINE",
                  subType: "REWARD",
                  year: y,
                  label: `${rewardClean} (${y})`,
                });
              }
            });
          });
        }

        if (m.KyLuat) {
          const disciplines = splitAwards(m.KyLuat);
          disciplines.forEach((d) => {
            const years = (d.match(/\b\d{4}\b/g) || []).map(Number);
            const discClean = stripTrailingYears(
              d.replace(/\s*\([^)]*\)/g, ""),
            );
            years.forEach((y) => {
              if (y >= sYear && y <= eYear && discClean) {
                activities.push({
                  type: "REWARD_DISCIPLINE",
                  subType: "DISCIPLINE",
                  year: y,
                  label: `${discClean} (${y})`,
                });
              }
            });
          });
        }
      }

      if (type === "RANK_PROMOTION" && Array.isArray(m.LichSuQuanHam)) {
        m.LichSuQuanHam.forEach((r) => {
          if (r.NgayHieuLuc) {
            const y = new Date(r.NgayHieuLuc).getFullYear();
            if (y >= sYear && y <= eYear) {
              activities.push({
                type: "RANK_PROMOTION",
                year: y,
                label: `Thăng lên ${r.CapBac} (${y})`,
                decision: r.QuyetDinh || r.SoQuyetDinh
                  ? { soQuyetDinh: r.SoQuyetDinh || r.QuyetDinh?.SoQuyetDinh }
                  : null,
              });
            }
          }
        });
      }

      // Sắp xếp hoạt động theo năm giảm dần
      activities.sort((a, b) => b.year - a.year);

      // Loại bỏ các hoạt động trùng lặp với cùng một nhãn
      const uniqueActivities = [];
      const seenLabels = new Set();
      activities.forEach((act) => {
        if (!seenLabels.has(act.label)) {
          seenLabels.add(act.label);
          uniqueActivities.push(act);
        }
      });

      if (uniqueActivities.length > 0) {
        result.push({
          member: m,
          activities: uniqueActivities,
          // Quyết định dùng chung cho cả nhóm (chỉ áp dụng cho Khen thưởng/Kỷ luật gộp,
          // vì bảng KhenThuongKyLuat chỉ có 1 khóa ngoại QuyetDinh cho cả đảng viên)
          decision:
            type === "REWARD_DISCIPLINE"
              ? m.QuyetDinhKhenThuong
                ? { soQuyetDinh: m.QuyetDinhKhenThuong.SoQuyetDinh }
                : null
              : null,
        });
      }
    });

    return result;
  };

  const evaluationMembers = useMemo(
    () => getMembersWithActivityType("EVALUATION"),
    [filteredMembers, yearMode, singleYear, startYear, endYear],
  );
  const rewardDisciplineMembers = useMemo(
    () => getMembersWithActivityType("REWARD_DISCIPLINE"),
    [filteredMembers, yearMode, singleYear, startYear, endYear],
  );
  const rankPromotionMembers = useMemo(
    () => getMembersWithActivityType("RANK_PROMOTION"),
    [filteredMembers, yearMode, singleYear, startYear, endYear],
  );

  const uniqueActiveCount = useMemo(() => {
    const ids = new Set();
    if (filterActivity === "ALL" || filterActivity === "EVALUATION") {
      evaluationMembers.forEach((m) => ids.add(m.member.Id));
    }
    if (filterActivity === "ALL" || filterActivity === "REWARD_DISCIPLINE") {
      rewardDisciplineMembers.forEach((m) => ids.add(m.member.Id));
    }
    if (filterActivity === "ALL" || filterActivity === "RANK_PROMOTION") {
      rankPromotionMembers.forEach((m) => ids.add(m.member.Id));
    }
    return ids.size;
  }, [
    filterActivity,
    evaluationMembers,
    rewardDisciplineMembers,
    rankPromotionMembers,
  ]);

  // Xuất Excel định dạng XML-HTML
  const handleExportExcel = () => {
    const hasData =
      (filterActivity === "ALL" &&
        (evaluationMembers.length > 0 ||
          rewardDisciplineMembers.length > 0 ||
          rankPromotionMembers.length > 0)) ||
      (filterActivity === "EVALUATION" && evaluationMembers.length > 0) ||
      (filterActivity === "REWARD_DISCIPLINE" &&
        rewardDisciplineMembers.length > 0) ||
      (filterActivity === "RANK_PROMOTION" && rankPromotionMembers.length > 0);

    if (!hasData) {
      toast.error("Không có dữ liệu phù hợp tiêu chí để xuất.");
      return;
    }

    const orgName = selectedOrgId
      ? organizations.find((o) => o.id === selectedOrgId)?.name || "Đơn vị"
      : "Toàn Đảng bộ";
    const yearText =
      yearMode === "single"
        ? `Năm ${singleYear}`
        : `Từ năm ${startYear} đến năm ${endYear}`;
    const refYear = yearMode === "single" ? singleYear : endYear;

    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1;
    const todayYear = today.getFullYear();
    const reportDateText =
      refYear === todayYear
        ? `ngày ${todayDay} tháng ${todayMonth} năm ${todayYear}`
        : `ngày 31 tháng 12 năm ${refYear}`;

    let tableIndex = 1;
    let excelTablesHtml = "";

    const generateExcelTableHtml = (title, list, type) => {
      if (filterActivity !== "ALL" && filterActivity !== type) {
        return "";
      }
      if (filterActivity === "ALL" && list.length === 0) {
        return "";
      }

      // Khen thưởng/Kỷ luật gộp chỉ có 1 quyết định dùng chung cho cả đảng viên
      // (bảng KhenThuongKyLuat chỉ có 1 khóa ngoại QuyetDinh) → merge theo rowspan
      // như các cột Họ tên/Chi bộ/Cấp bậc/Chức vụ. Xếp loại/Phong-thăng quân hàm thì
      // mỗi hoạt động có quyết định riêng, hiển thị song song theo từng dòng.
      const isGroupDecision = type === "REWARD_DISCIPLINE";

      let rows = "";
      if (list.length === 0) {
        rows = `<tr><td colspan="7" class="center text-muted">Không có dữ liệu ghi nhận</td></tr>`;
      } else {
        list.forEach((item, idx) => {
          const { member, activities, decision } = item;
          const mRank = getRankAtYear(member, refYear);
          const rowspan = activities.length;
          const groupDecisionCell = `<td rowspan="${rowspan}">${decision?.soQuyetDinh || "—"}</td>`;

          if (rowspan === 0) {
            rows += `<tr>
              <td class="center">1</td>
              <td>${member.HoTenDangDung}</td>
              <td>${member.ToChucDang?.Ten || "—"}</td>
              <td>${mRank}</td>
              <td>${member.ChucVuDang || "Không có"}</td>
              <td>—</td>
              <td>—</td>
            </tr>`;
          } else {
            // Dòng hoạt động đầu tiên bao gồm các ô rowspan
            const firstAct = activities[0];
            rows += `<tr>
              <td class="center" rowspan="${rowspan}">${idx + 1}</td>
              <td rowspan="${rowspan}">${member.HoTenDangDung}</td>
              <td rowspan="${rowspan}">${member.ToChucDang?.Ten || "—"}</td>
              <td rowspan="${rowspan}">${mRank}</td>
              <td rowspan="${rowspan}">${member.ChucVuDang || "Không có"}</td>
              <td>${firstAct.label}</td>
              ${isGroupDecision ? groupDecisionCell : `<td>${firstAct.decision?.soQuyetDinh || "—"}</td>`}
            </tr>`;

            // Các dòng hoạt động tiếp theo chỉ chứa ô hoạt động (+ ô quyết định riêng nếu không gộp)
            for (let i = 1; i < rowspan; i++) {
              rows += `<tr>
                <td>${activities[i].label}</td>
                ${isGroupDecision ? "" : `<td>${activities[i].decision?.soQuyetDinh || "—"}</td>`}
              </tr>`;
            }
          }
        });
      }

      const tableHtml = `
        <h3>${tableIndex++}. ${title}</h3>
        <table>
          <thead>
            <tr>
              <th class="center">STT</th>
              <th>Họ và tên</th>
              <th>Đơn vị / Chi bộ</th>
              <th>Cấp bậc quân hàm</th>
              <th>Chức vụ Đảng</th>
              <th>Chi tiết hoạt động</th>
              <th>Quyết định</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
      return tableHtml;
    };

    excelTablesHtml += generateExcelTableHtml(
      "Danh sách Đảng viên xếp loại",
      evaluationMembers,
      "EVALUATION",
    );
    excelTablesHtml += generateExcelTableHtml(
      "Danh sách Đảng viên được khen thưởng / kỷ luật",
      rewardDisciplineMembers,
      "REWARD_DISCIPLINE",
    );
    excelTablesHtml += generateExcelTableHtml(
      "Danh sách Đảng viên được phong/thăng quân hàm",
      rankPromotionMembers,
      "RANK_PROMOTION",
    );

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Thống kê Hoạt động</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta charset="utf-8">
        <style>
          body { font-family: 'Times New Roman', serif; }
          .title { text-align: center; font-weight: bold; font-size: 20px; text-transform: uppercase; margin: 20px 0 4px 0; }
          .subtitle { text-align: center; font-weight: bold; font-size: 13px; margin: 4px 0; }
          .report-date { text-align: center; font-style: italic; font-size: 12px; margin: 4px 0 16px 0; }
          h3 { font-size: 14px; font-weight: bold; margin-top: 25px; margin-bottom: 10px; text-transform: uppercase; }
          table { border-collapse: collapse; margin-bottom: 25px; }
          tr { mso-height-source: auto; }
          th, td { border: 1px solid #000; padding: 6px 8px; font-size: 13px; vertical-align: middle; white-space: nowrap; }
          th { background-color: #dcdcdc; font-weight: bold; text-align: center; }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .section { background-color: #f2f2f2; font-weight: bold; }
          .text-muted { color: #6c757d; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="title">BÁO CÁO THỐNG KÊ HOẠT ĐỘNG ĐẢNG VIÊN</div>
        <div class="subtitle">Đơn vị: ${orgName} &nbsp;|&nbsp; Thời gian: ${yearText}</div>
        <div class="report-date">Hiện có đến ${reportDateText}</div>

        ${excelTablesHtml}
      </body>
      </html>
    `.replace(
      /<\/tbody>(?![\s\S]*<\/tbody>)/,
      `
            <tr>
              <td style="border:none; padding:10px 0 4px 0; text-align:center; vertical-align:top; white-space:normal;" colspan="4"></td>
              <td style="border:none; padding:10px 0 4px 0; text-align:center; vertical-align:top; white-space:normal; font-style:italic; font-size:13px;" colspan="3">Ngày.......... tháng .......... năm..............</td>
            </tr>
            <tr>
              <td style="border:none; padding:4px 0; text-align:center; vertical-align:top; white-space:normal; font-weight:bold; font-size:14px; text-transform:uppercase;" colspan="4">NGƯỜI LẬP BÁO CÁO</td>
              <td style="border:none; padding:4px 0; text-align:center; vertical-align:top; white-space:normal; font-weight:bold; font-size:14px; text-transform:uppercase;" colspan="3">NGƯỜI DUYỆT BÁO CÁO</td>
            </tr>
            <tr>
              <td style="border:none; padding:4px 0; text-align:center; vertical-align:top; white-space:normal; font-style:italic; font-size:12px; color:#555;" colspan="4">(Ký, ghi rõ họ tên)</td>
              <td style="border:none; padding:4px 0; text-align:center; vertical-align:top; white-space:normal; font-style:italic; font-size:12px; color:#555;" colspan="3">(Ký, ghi rõ họ tên, đóng dấu)</td>
            </tr>
          </tbody>`,
    );

    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const downloadName = `Bao_cao_Hoat_dong_Dang_vien_${orgName.replace(/\s+/g, "_")}_${yearText.replace(/\s+/g, "_")}.xls`;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Xuất file Excel báo cáo hoạt động thành công!");
  };

  if (loading) return <LoadingSpinner />;

  const orgOptions = allowedOrganizations.map((org) => ({
    id: org.id,
    name: org.name,
  }));

  const yearModeOptions = [
    { id: "single", name: "Năm nhất định" },
    { id: "range", name: "Khoảng năm" },
  ];

  const criteriaOptions = [
    { id: "ALL", name: "Tất cả hoạt động" },
    { id: "EVALUATION", name: "Xếp loại Đảng viên" },
    { id: "REWARD_DISCIPLINE", name: "Khen thưởng / Kỷ luật" },
    { id: "RANK_PROMOTION", name: "Phong/thăng quân hàm" },
  ];

  const renderActivityTable = (title, list, type, badgeClass, emptyMsg) => {
    if (filterActivity !== "ALL" && filterActivity !== type) {
      return null;
    }
    if (filterActivity === "ALL" && list.length === 0) {
      return null;
    }

    return (
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <h4
          style={{
            fontSize: "15px",
            fontWeight: 600,
            marginBottom: "var(--spacing-md)",
            color: "var(--color-text-primary)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            borderLeft: "3px solid var(--color-accent)",
            paddingLeft: "10px",
          }}
        >
          {title}
          <span
            className="badge badge-info"
            style={{ marginLeft: "auto", fontSize: "11px" }}
          >
            {list.length} đồng chí
          </span>
        </h4>
        <div className="table-container">
          <table
            className="table"
            style={{ tableLayout: "fixed", width: "100%" }}
          >
            <thead>
              <tr>
                <th style={{ width: "60px" }} className="center">
                  STT
                </th>
                <th style={{ width: "180px" }}>Họ và tên</th>
                <th style={{ width: "220px" }}>Chi bộ / Đơn vị</th>
                <th style={{ width: "160px" }}>Cấp bậc quân hàm</th>
                <th style={{ width: "160px" }}>Chức vụ Đảng</th>
                <th>Chi tiết hoạt động</th>
                <th style={{ width: "160px" }}>Quyết định</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="center text-muted"
                    style={{ padding: "15px" }}
                  >
                    {emptyMsg}
                  </td>
                </tr>
              ) : (
                list.map((item, idx) => {
                  const refYear = yearMode === "single" ? singleYear : endYear;
                  const displayRank = getRankAtYear(item.member, refYear);
                  // Khen thưởng/Kỷ luật gộp chỉ có 1 quyết định dùng chung cho cả đảng viên;
                  // Xếp loại/Phong-thăng quân hàm thì mỗi hoạt động có quyết định riêng.
                  const isGroupDecision = type === "REWARD_DISCIPLINE";
                  return (
                    <tr key={item.member.Id}>
                      <td className="center">{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>
                        {item.member.HoTenDangDung}
                      </td>
                      <td>{item.member.ToChucDang?.Ten || "—"}</td>
                      <td>{displayRank}</td>
                      <td>{item.member.ChucVuDang || "Không có"}</td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "4px",
                            flexDirection: "column",
                            alignItems: "flex-start",
                          }}
                        >
                          {item.activities.map((act, i) => (
                            <div
                              key={i}
                              style={{
                                fontSize: "12px",
                                color:
                                  act.subType === "DISCIPLINE"
                                    ? "var(--color-error)"
                                    : "var(--color-text-primary)",
                                lineHeight: "1.4",
                              }}
                            >
                              {item.activities.length > 1
                                ? `• ${act.label}`
                                : act.label}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        {isGroupDecision ? (
                          <span style={{ fontSize: "12px" }}>
                            {item.decision?.soQuyetDinh || "—"}
                          </span>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              gap: "4px",
                              flexDirection: "column",
                              alignItems: "flex-start",
                            }}
                          >
                            {item.activities.map((act, i) => (
                              <div
                                key={i}
                                style={{
                                  fontSize: "12px",
                                  lineHeight: "1.4",
                                }}
                              >
                                {act.decision?.soQuyetDinh || "—"}
                              </div>
                            ))}
                          </div>
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
  };

  return (
    <div className="page animate-fade-in">
      <PageHeader
        title="Báo cáo & Thống kê Hoạt động Đảng viên"
        subtitle="Theo dõi, đánh giá các hoạt động xây dựng đảng, khen thưởng kỷ luật, bồi dưỡng đào tạo, thăng quân hàm và xếp loại."
      />

      {/* Bảng điều khiển các bộ lọc */}
      <div
        className="card"
        style={{
          padding: "var(--spacing-lg)",
          marginBottom: "var(--spacing-xl)",
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border)",
          position: "relative",
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "var(--spacing-lg)",
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {/* Chọn đơn vị */}
          <div className="form-group" style={{ minWidth: "260px", margin: 0 }}>
            <label
              className="form-label"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontWeight: 600,
              }}
            >
              <FiFilter /> Đơn vị:
            </label>
            <GlassSelect
              value={selectedOrgId}
              onChange={setSelectedOrgId}
              options={orgOptions}
              placeholder={
                user?.role === ROLES.CAN_BO_CHINH_TRI
                  ? "Toàn Đảng bộ (Tất cả)"
                  : "Chọn đơn vị"
              }
              showEmptyOption={user?.role === ROLES.CAN_BO_CHINH_TRI}
              style={{ width: "100%" }}
            />
          </div>

          {/* Chọn chế độ thời gian */}
          <div className="form-group" style={{ minWidth: "170px", margin: 0 }}>
            <label
              className="form-label"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontWeight: 600,
              }}
            >
              <FiCalendar /> Chế độ chọn năm:
            </label>
            <GlassSelect
              value={yearMode}
              onChange={setYearMode}
              options={yearModeOptions}
              showEmptyOption={false}
              style={{ width: "100%" }}
            />
          </div>

          {/* Ô chọn năm, đổi theo chế độ single/range */}
          {yearMode === "single" ? (
            <div
              className="form-group"
              style={{ minWidth: "130px", margin: 0 }}
            >
              <label className="form-label" style={{ fontWeight: 600 }}>
                Chọn năm:
              </label>
              <GlassSelect
                value={singleYear}
                onChange={setSingleYear}
                options={yearOptions}
                showEmptyOption={false}
                style={{ width: "100%" }}
              />
            </div>
          ) : (
            <>
              <div
                className="form-group"
                style={{ minWidth: "130px", margin: 0 }}
              >
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Từ năm:
                </label>
                <GlassSelect
                  value={startYear}
                  onChange={setStartYear}
                  options={yearOptions}
                  showEmptyOption={false}
                  style={{ width: "100%" }}
                />
              </div>
              <div
                className="form-group"
                style={{ minWidth: "130px", margin: 0 }}
              >
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Đến năm:
                </label>
                <GlassSelect
                  value={endYear}
                  onChange={setEndYear}
                  options={yearOptions.filter((y) => y >= startYear)}
                  showEmptyOption={false}
                  style={{ width: "100%" }}
                />
              </div>
            </>
          )}

          {/* Lọc theo tiêu chí hoạt động */}
          <div className="form-group" style={{ minWidth: "220px", margin: 0 }}>
            <label
              className="form-label"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontWeight: 600,
              }}
            >
              <FiFilter /> Tiêu chí thống kê:
            </label>
            <GlassSelect
              value={filterActivity}
              onChange={setFilterActivity}
              options={criteriaOptions}
              showEmptyOption={false}
              style={{ width: "100%" }}
            />
          </div>

          {/* Nút xuất báo cáo */}
          <button
            className="btn btn-accent"
            style={{
              height: "38px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              borderRadius: "20px",
              padding: "0 20px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
            onClick={handleExportExcel}
          >
            Xuất báo cáo <FiFileText />
          </button>
        </div>
      </div>



      {/* Bảng chi tiết danh sách đảng viên có hoạt động */}
      <div className="card" style={{ marginBottom: "var(--spacing-xl)" }}>
        <div
          className="card-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            className="card-title"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <FiActivity style={{ color: "var(--color-accent)" }} />
            Danh sách hoạt động ghi nhận (
            {yearMode === "single" ? singleYear : `${startYear}–${endYear}`})
          </h3>
          <span className="badge badge-info">{uniqueActiveCount} đồng chí</span>
        </div>
        <div style={{ padding: "var(--spacing-lg)" }}>
          {uniqueActiveCount === 0 ? (
            <p className="text-muted text-center" style={{ padding: "30px" }}>
              Không có hoạt động nào ghi nhận phù hợp với tiêu chí lọc.
            </p>
          ) : (
            <>
              {renderActivityTable(
                "Danh sách Đảng viên xếp loại",
                evaluationMembers,
                "EVALUATION",
                "badge-olive",
                "Không có hoạt động xếp loại",
              )}
              {renderActivityTable(
                "Danh sách Đảng viên được khen thưởng / kỷ luật",
                rewardDisciplineMembers,
                "REWARD_DISCIPLINE",
                "badge-info",
                "Không có hoạt động khen thưởng / kỷ luật",
              )}
              {renderActivityTable(
                "Danh sách Đảng viên được phong/thăng quân hàm",
                rankPromotionMembers,
                "RANK_PROMOTION",
                "badge-olive",
                "Không có hoạt động thăng quân hàm",
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
