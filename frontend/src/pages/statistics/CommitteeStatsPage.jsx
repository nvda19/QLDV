import { useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { FiFileText, FiFilter } from "../../components/icons";
import toast from "react-hot-toast";
import memberApi from "../../api/memberApi";
import orgApi from "../../api/orgApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import GlassSelect from "../../components/common/GlassSelect";
import PageHeader from "../../components/common/PageHeader";
import { computeCommitteeStats } from "../../utils/statistics/committeeHelpers";
import { useAuth } from "../../contexts/AuthContext";
import { ROLES } from "../../utils/constants";

export default function CommitteeStatsPage() {
  const { user } = useAuth();

  if (user && user.role !== ROLES.CAN_BO_CHINH_TRI) {
    return <Navigate to="/" replace />;
  }
  const currentYear = new Date().getFullYear();
  const [members, setMembers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(() =>
    user?.role === ROLES.BI_THU ? user.orgId || "" : "",
  );
  const [loading, setLoading] = useState(true);

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
      // Không tải được thì để mảng rỗng, giao diện tự hiển thị trạng thái "không có dữ liệu"
    } finally {
      setLoading(false);
    }
  };

  // Bí thư không tự chọn đơn vị khác, nên gán sẵn đơn vị của họ ngay khi có dữ liệu người dùng
  useEffect(() => {
    if (user && user.role === ROLES.BI_THU && user.orgId && !selectedOrgId) {
      setSelectedOrgId(user.orgId);
    }
  }, [user, selectedOrgId]);

  // Cán bộ chính trị được xem toàn bộ đảng bộ, còn lại chỉ giới hạn trong đơn vị mình và cấp dưới
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

  const activeOrgId =
    selectedOrgId || (user?.role === ROLES.BI_THU ? user.orgId : "");

  const {
    committeeMembers,
    committeeCount,
    avgAge,
    avgPartyAge,
    theoryPct,
    postgraduatePct,
    advancedTheoryCount,
    postgraduateCount,
    rankList,
  } = useMemo(() => {
    return computeCommitteeStats(members, organizations, activeOrgId);
  }, [members, organizations, activeOrgId]);

  const handleExportExcel = () => {
    if (committeeCount === 0) {
      toast.error("Không có dữ liệu để xuất.");
      return;
    }

    const orgName = selectedOrgId
      ? organizations.find((o) => o.id === selectedOrgId)?.name || "Đơn vị"
      : "Toàn Đảng bộ";

    const today = new Date();
    const reportDateText = `ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

    let memberRows = "";
    committeeMembers.forEach((m, idx) => {
      const birthYear = new Date(m.NgaySinh).getFullYear();
      const age = currentYear - birthYear;
      const joinYear = m.NgayVaoDang
        ? new Date(m.NgayVaoDang).getFullYear()
        : currentYear;
      const partyAge = currentYear - joinYear;
      const mOrgName =
        organizations.find((o) => o.id === m.ToChucDangId)?.name ||
        m.ToChucDang?.Ten ||
        "—";

      memberRows += `<tr>
        <td class="center">${idx + 1}</td>
        <td>${m.HoTenDangDung}</td>
        <td>${m.committeeRole}</td>
        <td>${mOrgName}</td>
        <td class="center">${m.CapBac|| "—"}</td>
        <td class="center">${age} tuổi (${birthYear})</td>
        <td class="center">${partyAge} năm</td>
        <td>${m.HocVi || m.GiaoDucDaiHoc || "Cử nhân"}</td>
        <td>${m.LyLuanChinhTri || "Sơ cấp"}</td>
      </tr>`;
    });

    let rankRows = "";
    rankList.forEach(([label, count], idx) => {
      const pct =
        committeeCount > 0 ? Math.round((count / committeeCount) * 100) : 0;
      rankRows += `<tr>
        <td class="center">${idx + 1}</td>
        <td>${label}</td>
        <td class="right">${count}</td>
        <td class="right">${pct}%</td>
      </tr>`;
    });

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Thống kê Cấp ủy</x:Name>
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
          table { border-collapse: collapse; width: 100%; margin-bottom: 25px; }
          th, td { border: 1px solid #000; padding: 6px 8px; font-size: 13px; white-space: nowrap; }
          th { background-color: #dcdcdc; font-weight: bold; text-align: center; }
          h3 { font-size: 14px; font-weight: bold; margin-top: 25px; margin-bottom: 10px; text-transform: uppercase; }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .section { background-color: #f2f2f2; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="title">BÁO CÁO THỐNG KÊ NHÂN SỰ CẤP ỦY ĐẢNG</div>
        <div class="subtitle">Đơn vị: ${orgName} &nbsp;|&nbsp; Năm báo cáo: ${currentYear}</div>
        <div class="report-date">Hiện có đến ${reportDateText}</div>

        <h3>1. DANH SÁCH CHI TIẾT NHÂN SỰ CẤP ỦY ĐẢNG</h3>
        <table>
          <colgroup>
            <col style="width:50px;">
            <col style="width:170px;">
            <col style="width:160px;">
            <col style="width:190px;">
            <col style="width:100px;">
            <col style="width:150px;">
            <col style="width:90px;">
            <col style="width:140px;">
            <col style="width:120px;">
          </colgroup>
          <thead>
            <tr>
              <th>STT</th>
              <th>Họ và tên</th>
              <th>Chức vụ Cấp ủy</th>
              <th>Đơn vị</th>
              <th>Cấp bậc</th>
              <th>Tuổi đời (Năm sinh)</th>
              <th>Tuổi Đảng</th>
              <th>Học vị / Chuyên môn</th>
              <th>Lý luận Chính trị</th>
            </tr>
          </thead>
          <tbody>
            ${memberRows}
          </tbody>
        </table>

        <h3>2. CƠ CẤU CẤP BẬC QUÂN HÀM CẤP ỦY</h3>
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Cấp bậc</th>
              <th>Số lượng</th>
              <th>Tỷ lệ (%)</th>
            </tr>
          </thead>
          <tbody>
            ${rankRows}
          </tbody>
        </table>

        <table style="width:1170px;">
          <colgroup>
            <col style="width:585px;">
            <col style="width:585px;">
          </colgroup>
          <tr>
            <td style="border:none; padding:10px 0 4px 0; text-align:center; vertical-align:top;"></td>
            <td style="border:none; padding:10px 0 4px 0; text-align:center; vertical-align:top; font-style:italic; font-size:13px;">Ngày.......... tháng .......... năm..............</td>
          </tr>
          <tr>
            <td style="border:none; padding:4px 0; text-align:center; vertical-align:top; font-weight:bold; font-size:14px; text-transform:uppercase;">NGƯỜI LẬP BÁO CÁO</td>
            <td style="border:none; padding:4px 0; text-align:center; vertical-align:top; font-weight:bold; font-size:14px; text-transform:uppercase;">NGƯỜI DUYỆT BÁO CÁO</td>
          </tr>
          <tr>
            <td style="border:none; padding:4px 0; text-align:center; vertical-align:top; font-style:italic; font-size:12px; color:#555;">(Ký, ghi rõ họ tên)</td>
            <td style="border:none; padding:4px 0; text-align:center; vertical-align:top; font-style:italic; font-size:12px; color:#555;">(Ký, ghi rõ họ tên, đóng dấu)</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Bao_cao_Nhan_su_Cap_uy_${orgName.replace(/\s+/g, "_")}_${currentYear}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Xuất file Excel báo cáo Cấp ủy thành công!");
  };

  if (loading) return <LoadingSpinner />;

  const orgOptions = allowedOrganizations.map((org) => ({
    id: org.id,
    name: org.name,
  }));

  return (
    <div className="page animate-fade-in">
      <PageHeader
        title="Báo cáo & Thống kê Cấp ủy Đảng"
        subtitle="Theo dõi, phân tích chất lượng và cơ cấu đội ngũ cấp ủy lãnh đạo, Bí thư, Phó Bí thư các Chi bộ."
        actions={
          <div
            style={{
              display: "flex",
              gap: "var(--spacing-md)",
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div
              className="form-group"
              style={{ minWidth: "250px", margin: 0 }}
            >
              <label
                className="form-label"
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <FiFilter /> Lọc theo Đảng bộ/Chi bộ:
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
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>Xuất báo cáo</span>
              <FiFileText />
            </button>
          </div>
        }
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-xl)",
          marginBottom: "var(--spacing-xl)",
        }}
      >
        {/* Lưới thẻ thông tin từng cấp ủy viên/chỉ huy */}
        <div>
          <h3
            style={{
              marginBottom: "var(--spacing-md)",
              color: "var(--color-text-primary)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            Đội ngũ Cấp ủy Chỉ huy ({committeeCount})
          </h3>

          {committeeCount === 0 ? (
            <div
              className="card"
              style={{ padding: "var(--spacing-2xl)", textAlign: "center" }}
            >
              <p className="text-muted">
                Không tìm thấy Cấp ủy viên nào trong đơn vị này.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: "var(--spacing-md)",
              }}
            >
              {committeeMembers.map((m) => {
                const birthDate = m.NgaySinh ? new Date(m.NgaySinh) : null;
                const birthYear =
                  birthDate && !isNaN(birthDate.getTime())
                    ? birthDate.getFullYear()
                    : null;
                const age = birthYear ? currentYear - birthYear : null;

                const joinDate = m.NgayVaoDang ? new Date(m.NgayVaoDang) : null;
                const joinYear =
                  joinDate && !isNaN(joinDate.getTime())
                    ? joinDate.getFullYear()
                    : null;
                const partyAge = joinYear ? currentYear - joinYear : null;
                const mOrgName =
                  organizations.find((o) => o.id === m.ToChucDangId)?.name ||
                  m.ToChucDang?.Ten ||
                  "—";

                return (
                  <div
                    key={m.id}
                    className="card animate-fade-in"
                    style={{
                      borderLeft:
                        m.committeeLevel <= 2
                          ? "4px solid var(--color-accent)"
                          : m.committeeLevel === 3
                            ? "4px solid var(--color-info)"
                            : m.committeeLevel <= 5
                              ? "4px solid var(--color-success)"
                              : m.committeeLevel === 6
                                ? "4px solid #a3b899"
                                : "4px solid var(--color-border)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Nhãn nhỏ ghi chức vụ, đặt góc thẻ để nhận diện nhanh */}
                    <div
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        padding: "1px 6px",
                        borderRadius: "8px",
                        fontSize: "8px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        background:
                          m.committeeLevel <= 2
                            ? "rgba(16, 185, 129, 0.15)"
                            : m.committeeLevel === 3
                              ? "rgba(58, 110, 165, 0.15)"
                              : m.committeeLevel <= 5
                                ? "rgba(58, 143, 92, 0.15)"
                                : m.committeeLevel === 6
                                  ? "rgba(163, 184, 153, 0.15)"
                                  : "rgba(255,255,255,0.05)",
                        color:
                          m.committeeLevel <= 2
                            ? "var(--color-accent)"
                            : m.committeeLevel === 3
                              ? "var(--color-info)"
                              : m.committeeLevel <= 5
                                ? "var(--color-success)"
                                : m.committeeLevel === 6
                                  ? "#a3b899"
                                  : "var(--color-text-secondary)",
                        border:
                          m.committeeLevel <= 2
                            ? "1px solid var(--color-accent)"
                            : m.committeeLevel === 3
                              ? "1px solid var(--color-info)"
                              : m.committeeLevel <= 5
                                ? "1px solid var(--color-success)"
                                : m.committeeLevel === 6
                                  ? "1px solid rgba(163, 184, 153, 0.5)"
                                  : "1px solid var(--color-border)",
                      }}
                    >
                      {m.committeeRole}
                    </div>

                    <div style={{ padding: "14px" }}>
                      <h4
                        style={{
                          fontSize: "14px",
                          color: "var(--color-text-primary)",
                          marginBottom: "4px",
                          fontWeight: "bold",
                          maxWidth: "65%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={m.HoTenDangDung}
                      >
                        {m.HoTenDangDung}
                      </h4>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "12px",
                          marginBottom: "8px",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--color-accent)",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                          title={m.committeeTitle}
                        >
                          {m.committeeTitle}
                        </span>
                        <span
                          style={{
                            color: "var(--color-text-muted)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            textAlign: "right",
                            flex: 1,
                          }}
                          title={mOrgName}
                        >
                          {mOrgName}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          borderTop: "1px solid var(--color-border)",
                          paddingTop: "10px",
                          fontSize: "12px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span className="text-muted" style={{ whiteSpace: "nowrap" }}>Cấp bậc:</span>
                          <span
                            style={{
                              fontWeight: 600,
                              color: "var(--color-text-primary)",
                            }}
                          >
                            {m.CapBac|| "—"}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span className="text-muted" style={{ whiteSpace: "nowrap" }}>Tuổi đời:</span>
                          <span style={{ fontWeight: 600 }}>
                            {age !== null ? `${age} tuổi` : "—"}{" "}
                            {birthYear ? `(${birthYear})` : ""}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span className="text-muted" style={{ whiteSpace: "nowrap" }}>Tuổi Đảng:</span>
                          <span
                            style={{
                              fontWeight: 600,
                              color: "var(--color-accent)",
                            }}
                          >
                            {partyAge !== null ? `${partyAge} năm` : "—"}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span className="text-muted" style={{ whiteSpace: "nowrap" }}>Học vị/Chuyên môn:</span>
                          <span
                            style={{
                              fontWeight: 600,
                              textAlign: "right",
                              maxWidth: "200px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={m.GiaoDucDaiHoc || m.HocVi || "Đại học"}
                          >
                            {m.HocVi || m.GiaoDucDaiHoc || "Cử nhân"}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span className="text-muted" style={{ whiteSpace: "nowrap" }}>Lý luận Chính trị:</span>
                          <span
                            style={{
                              fontWeight: 600,
                              color: m.LyLuanChinhTri?.includes("Cao cấp")
                                ? "var(--color-success)"
                                : "var(--color-text-primary)",
                            }}
                          >
                            {m.LyLuanChinhTri || "Sơ cấp"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bảng nhỏ thống kê cơ cấu cấp bậc quân hàm của đội ngũ cấp ủy */}
        <div className="card" style={{ maxWidth: "340px" }}>
          <div className="card-header" style={{ padding: "10px 14px" }}>
            <h3 className="card-title" style={{ fontSize: "14px", fontWeight: "bold", margin: 0 }}>Cấp bậc Cấp ủy</h3>
          </div>
          <div style={{ padding: "14px" }}>
            {rankList.length === 0 ? (
              <p className="text-muted text-center" style={{ fontSize: "12px" }}>Chưa có thông tin</p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {rankList.map(([label, count]) => {
                  const pct =
                    committeeCount > 0
                      ? Math.round((count / committeeCount) * 100)
                      : 0;
                  return (
                    <div key={label}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "12px",
                          marginBottom: "4px",
                        }}
                      >
                        <span
                          className="badge badge-olive"
                          style={{ fontSize: "11px", padding: "1px 5px" }}
                        >
                          {label}
                        </span>
                        <span className="font-bold" style={{ fontSize: "12px" }}>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div
                        style={{
                          height: "5px",
                          background: "var(--color-bg-tertiary)",
                          borderRadius: "2px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: "#a3b899",
                            borderRadius: "2px",
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
