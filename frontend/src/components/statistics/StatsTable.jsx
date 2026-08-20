/**
 * StatsTable — dựng bảng báo cáo chính thức đúng theo bố cục của Mẫu 6-TKCT.
 *
 * Props:
 *   - table1: Mảng các phần (section) kèm dòng dữ liệu, lấy từ template.computeStats
 *   - table2: { ethnicRows, religionRows } — số liệu dân tộc và tôn giáo
 *   - table3: Mảng các dòng theo nhóm tuổi Đảng
 *   - reportYear: Năm báo cáo
 *   - comparisonYear: Năm dùng để so sánh
 */
export default function StatsTable({
  table1,
  table2,
  table3,
  reportYear,
  comparisonYear,
}) {
  const getReportDateString = (year) => {
    const currentYear = new Date().getFullYear();
    if (year === currentYear) {
      const today = new Date();
      return `ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;
    }
    return `ngày 31 tháng 12 năm ${year}`;
  };

  if (!table1 || table1.length === 0) {
    return (
      <div className="card animate-fade-in" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
        <p className="text-muted">Chưa chọn tiêu chí nào để hiển thị thống kê.</p>
      </div>
    );
  }

  return (
    <div className="stats-table-container">
      {/* ── Bảng 1: Thống kê tổng hợp ── */}
      <h3 className="stats-table-title">
        THỐNG KÊ ĐỘI NGŨ ĐẢNG VIÊN
        <span className="stats-table-subtitle">
          Hiện có đến {getReportDateString(reportYear)}
        </span>
      </h3>

      <div className="table-container">
        <table className="table stats-formal-table">
          <thead>
            <tr>
              <th style={{ width: "40%" }}>NỘI DUNG THỐNG KÊ</th>
              <th style={{ width: "20%" }} className="text-right">Kỳ này ({reportYear})</th>
              <th style={{ width: "20%" }} className="text-right">
                Cùng kỳ năm trước ({comparisonYear})
              </th>
              <th style={{ width: "20%" }} className="text-right">Tỷ lệ so sánh</th>
            </tr>
          </thead>
          <tbody>
            {table1.map((section, si) => (
              <TableSection key={si} section={section} />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Bảng 2: Dân tộc + Tôn giáo ── */}
      {table2 && (table2.ethnicRows?.length > 0 || table2.religionRows?.length > 0) && (
        <>
          <h3
            className="stats-table-title"
            style={{ marginTop: "var(--spacing-2xl)" }}
          >
            ĐẢNG VIÊN CHIA THEO DÂN TỘC, TÔN GIÁO
          </h3>

          <div className="table-container">
            <table className="table stats-formal-table">
              <thead>
                <tr>
                  <th style={{ width: "50%" }}>DÂN TỘC / TÔN GIÁO</th>
                  <th style={{ width: "25%" }} className="text-right">Tổng số</th>
                  <th style={{ width: "25%" }} className="text-right">Tỷ lệ (%)</th>
                </tr>
              </thead>
              <tbody>
                {table2.ethnicRows?.length > 0 && (
                  <>
                    <tr className="stats-section-header">
                      <td colSpan="3">ĐẢNG VIÊN CHIA THEO DÂN TỘC</td>
                    </tr>
                    {table2.ethnicRows.map((row) => (
                      <tr
                        key={row.label}
                        className={row.value > 0 ? "" : "stats-row-zero"}
                      >
                        <td>{row.label}</td>
                        <td className="text-right">{row.value}</td>
                        <td className="text-right">{row.pctValue}%</td>
                      </tr>
                    ))}
                  </>
                )}

                {table2.religionRows?.length > 0 && (
                  <>
                    {/* Tiêu đề của phần tôn giáo */}
                    <tr className="stats-section-header">
                      <td colSpan="3">ĐẢNG VIÊN TRONG CÁC TÔN GIÁO</td>
                    </tr>
                    {table2.religionRows.map((row) => (
                      <tr
                        key={row.label}
                        className={row.value > 0 ? "" : "stats-row-zero"}
                      >
                        <td>{row.label}</td>
                        <td className="text-right">{row.value}</td>
                        <td className="text-right">{row.pctValue}%</td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Bảng 3: Tuổi Đảng ── */}
      {table3 && table3.length > 0 && (
        <>
          <h3
            className="stats-table-title"
            style={{ marginTop: "var(--spacing-2xl)" }}
          >
            TUỔI ĐẢNG
          </h3>

          <div className="table-container">
            <table className="table stats-formal-table">
              <thead>
                <tr>
                  <th style={{ width: "40%" }}>TUỔI ĐẢNG</th>
                  <th style={{ width: "20%" }} className="text-right">Kỳ này ({reportYear})</th>
                  <th style={{ width: "20%" }} className="text-right">
                    Cùng kỳ năm trước ({comparisonYear})
                  </th>
                  <th style={{ width: "20%" }} className="text-right">Tỷ lệ so sánh</th>
                </tr>
              </thead>
              <tbody>
                {table3.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td className="text-right">{row.value}</td>
                    <td className="text-right">{row.previous}</td>
                    <td className="text-right">{row.ratio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Dựng một phần (section) trong bảng, gồm tiêu đề phần (nếu có) và các dòng dữ liệu bên dưới.
 */
function TableSection({ section }) {
  return (
    <>
      {section.sectionHeader && (
        <tr className="stats-section-header">
          <td>{section.sectionHeader}</td>
          <td colSpan="3"></td>
        </tr>
      )}
      {section.rows.map((row) => {
        const isTotal = row.isTotal;
        const isAvg = row.isAverage;
        return (
          <tr
            key={row.label}
            className={
              isTotal ? "stats-row-total" : isAvg ? "stats-row-avg" : ""
            }
          >
            <td
              style={
                section.sectionHeader ? { paddingLeft: "28px" } : undefined
              }
            >
              {row.label}
            </td>
            <td className="text-right">
              {isAvg ? `${row.value} tuổi` : row.value}
            </td>
            <td className="text-right">
              {isAvg ? `${row.previous} tuổi` : row.previous}
            </td>
            <td className="text-right">{row.ratio}</td>
          </tr>
        );
      })}
    </>
  );
}
