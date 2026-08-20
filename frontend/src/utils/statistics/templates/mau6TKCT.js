/**
 * ============================================================
 * MẪU 6-TKCT — mẫu báo cáo thống kê đội ngũ đảng viên
 * theo đúng biểu mẫu của Ban Tổ chức Trung ương.
 *
 * File này dựng 3 bảng số liệu cho báo cáo:
 * Bảng 1: Thống kê tổng hợp (35 chỉ tiêu)
 * Bảng 2: Phân theo dân tộc (56) và tôn giáo (7)
 * Bảng 3: Phân theo tuổi Đảng (4 nhóm)
 * ============================================================
 */

import {
  filterMembersByYear,
  countBy,
  computeAverage,
  pct,
  yoyRatio,
  getAge,
  getPartyAge,
  isDuBi,
  isMienCongTac,
  isEthnicMinority,
  isReligious,
  classifyGDPT,
  classifyChuyenMon,
  classifyChucDanhKH,
  classifyLLCT,
  classifyJoinPeriod,
  buildChartData,
} from "../reportHelpers";

// ── Constants ─────────────────────────────────────────────

export const ETHNICITIES = [
  "Kinh",
  "Tày",
  "Thái",
  "Hoa",
  "Khơ-me",
  "Mường",
  "Nùng",
  "Mông",
  "Dao",
  "Gia-Rai",
  "Ê-Đê",
  "Ngái",
  "Ba Na",
  "Xơ Đăng",
  "Sán Chay (Cao Lan)",
  "Cơ Ho",
  "Chăm",
  "Sán Dìu",
  "Hrê",
  "Mnông",
  "Ra Glai",
  "Xtiêng",
  "Bru-Vân Kiều",
  "Thổ",
  "Giáy",
  "Cơ Tu",
  "Giẻ-Triêng",
  "Mạ",
  "Khơ Mú",
  "Co",
  "Tà Ôi",
  "Chơ-Ro",
  "Kháng",
  "Xinh Mun",
  "Hà Nhì",
  "Chu-Ru",
  "Lào",
  "La Chí",
  "La Ha",
  "Phù Lá",
  "La Hủ",
  "Lự",
  "Lô Lô",
  "Chứt",
  "Mảng",
  "Pà Thẻn",
  "Co Lao",
  "Cống",
  "Bố Y",
  "Si La",
  "Pu Péo",
  "Brâu",
  "Ơ-Đu",
  "Rơ Măm",
  "Quốc tịch gốc nước ngoài",
  "Dân tộc khác",
];

export const RELIGIONS = [
  "Đạo Thiên chúa",
  "Đạo Tin lành",
  "Đạo Phật",
  "Đạo Cao đài",
  "Đạo Hòa hảo",
  "Đạo Hồi",
  "Các đạo khác",
];

// ── Table 1: Main Statistics ──────────────────────────────

function computeTable1(members, reportYear) {
  const total = members.length;
  return [
    {
      sectionHeader: null,
      rows: [
        {
          label: "Đảng viên trong danh sách có đến kỳ báo cáo",
          value: total,
          isTotal: true,
        },
      ],
    },
    {
      sectionHeader: "Trong đó",
      rows: [
        {
          label: "Dự bị",
          value: countBy(members, (m) => isDuBi(m, reportYear)),
        },
        {
          label: "Phụ nữ",
          value: countBy(members, (m) => m.GioiTinh === "Nữ"),
        },
        {
          label: "Dân tộc ít người",
          value: countBy(members, isEthnicMinority),
        },
        { label: "Tôn giáo", value: countBy(members, isReligious) },
        { label: "Giới thiệu về nơi cư trú theo QĐ76/BCT", value: 0 },
        {
          label: "Được miễn công tác sinh hoạt Đảng",
          value: countBy(members, isMienCongTac),
        },
      ],
    },
    {
      sectionHeader: "Vào Đảng",
      rows: [
        {
          label: "Từ 30/4/1975 về trước",
          value: countBy(
            members,
            (m) => classifyJoinPeriod(m) === "BEFORE_1975",
          ),
        },
        {
          label: "Từ 1/5/1975 đến 31/12/1985",
          value: countBy(members, (m) => classifyJoinPeriod(m) === "1975_1985"),
        },
        {
          label: "Từ 1/1/1986 đến 31/12/1996",
          value: countBy(members, (m) => classifyJoinPeriod(m) === "1986_1996"),
        },
        {
          label: "Từ 1/1/1997 đến 31/12/2010",
          value: countBy(members, (m) => classifyJoinPeriod(m) === "1997_2010"),
        },
        {
          label: "Từ 1/1/2011 đến nay",
          value: countBy(members, (m) => classifyJoinPeriod(m) === "2011_NOW"),
        },
      ],
    },
    {
      sectionHeader: "Tuổi đời",
      rows: [
        {
          label: "Từ 18 đến 30 tuổi",
          value: countBy(members, (m) => {
            const a = getAge(m, reportYear);
            return a != null && a >= 18 && a <= 30;
          }),
        },
        {
          label: "Từ 31 đến 40 tuổi",
          value: countBy(members, (m) => {
            const a = getAge(m, reportYear);
            return a != null && a >= 31 && a <= 40;
          }),
        },
        {
          label: "Từ 41 đến 50 tuổi",
          value: countBy(members, (m) => {
            const a = getAge(m, reportYear);
            return a != null && a >= 41 && a <= 50;
          }),
        },
        {
          label: "Từ 51 đến 60 tuổi",
          value: countBy(members, (m) => {
            const a = getAge(m, reportYear);
            return a != null && a >= 51 && a <= 60;
          }),
        },
        {
          label: "Từ 61 tuổi trở lên",
          value: countBy(members, (m) => {
            const a = getAge(m, reportYear);
            return a != null && a >= 61;
          }),
        },
        {
          label: "* Tuổi bình quân",
          value: computeAverage(members, (m) => getAge(m, reportYear)),
          isAverage: true,
        },
      ],
    },
    {
      sectionHeader: "Trình độ GD phổ thông",
      rows: [
        {
          label: "Tiểu học",
          value: countBy(
            members,
            (m) => classifyGDPT(m.GiaoDucPhoThong) === "TH",
          ),
        },
        {
          label: "Trung học cơ sở",
          value: countBy(
            members,
            (m) => classifyGDPT(m.GiaoDucPhoThong) === "THCS",
          ),
        },
        {
          label: "Trung học phổ thông",
          value: countBy(
            members,
            (m) => classifyGDPT(m.GiaoDucPhoThong) === "THPT",
          ),
        },
      ],
    },
    {
      sectionHeader: "Trình độ chuyên môn nghiệp vụ",
      rows: [
        {
          label: "Sơ cấp",
          value: countBy(members, (m) => classifyChuyenMon(m) === "SC"),
        },
        {
          label: "Trung học CN",
          value: countBy(members, (m) => classifyChuyenMon(m) === "THCN"),
        },
        {
          label: "Cao đẳng",
          value: countBy(members, (m) => classifyChuyenMon(m) === "CD"),
        },
        {
          label: "Đại học",
          value: countBy(members, (m) => classifyChuyenMon(m) === "DH"),
        },
        {
          label: "Thạc sĩ",
          value: countBy(members, (m) => classifyChuyenMon(m) === "ThS"),
        },
        {
          label: "Tiến sĩ",
          value: countBy(members, (m) => classifyChuyenMon(m) === "TS"),
        },
        {
          label: "Tiến sĩ khoa học",
          value: countBy(members, (m) => classifyChuyenMon(m) === "TSKH"),
        },
      ],
    },
    {
      sectionHeader: "Chức danh KH",
      rows: [
        {
          label: "Phó giáo sư",
          value: countBy(members, (m) => classifyChucDanhKH(m) === "PGS"),
        },
        {
          label: "Giáo sư",
          value: countBy(members, (m) => classifyChucDanhKH(m) === "GS"),
        },
      ],
    },
    {
      sectionHeader: "Trình độ lý luận chính trị",
      rows: [
        {
          label: "Cử nhân, cao cấp",
          value: countBy(members, (m) => classifyLLCT(m) === "CN_CC"),
        },
        {
          label: "Trung cấp",
          value: countBy(members, (m) => classifyLLCT(m) === "TC"),
        },
        {
          label: "Sơ cấp",
          value: countBy(members, (m) => classifyLLCT(m) === "SC"),
        },
        {
          label: "Cơ sở",
          value: countBy(members, (m) => classifyLLCT(m) === "CS"),
        },
      ],
    },
  ];
}

// ── Table 2: Ethnicity + Religion ─────────────────────────

function computeTable2(members) {
  const total = members.length;

  // Đếm số lượng thực tế theo từng dân tộc, dữ liệu không khớp danh mục chuẩn thì xếp vào "Dân tộc khác"
  const ethnicDist = {};
  const standardEthnicities = ETHNICITIES.filter((e) => e !== "Dân tộc khác");

  members.forEach((m) => {
    const e = (m.DanToc || "").trim();
    if (!e) return;
    const matched = standardEthnicities.find(
      (std) => std.toLowerCase() === e.toLowerCase(),
    );
    if (matched) {
      ethnicDist[matched] = (ethnicDist[matched] || 0) + 1;
    } else {
      ethnicDist["Dân tộc khác"] = (ethnicDist["Dân tộc khác"] || 0) + 1;
    }
  });

  const ethnicRows = ETHNICITIES.map((name, idx) => ({
    label: `${idx + 1}. ${name}`,
    rawLabel: name,
    value: ethnicDist[name] || 0,
    pctValue: pct(ethnicDist[name] || 0, total),
  }));

  // Đếm số lượng thực tế theo từng tôn giáo, khớp theo từ khóa trong tên đạo
  const religionDist = {};
  members.forEach((m) => {
    const r = (m.TonGiao || "").trim().toLowerCase();
    if (!r || r === "không") return;
    let matched = false;
    for (const std of RELIGIONS) {
      const keyword = std.replace("Đạo ", "").toLowerCase();
      if (r.includes(keyword)) {
        religionDist[std] = (religionDist[std] || 0) + 1;
        matched = true;
        break;
      }
    }
    if (!matched) {
      religionDist["Các đạo khác"] = (religionDist["Các đạo khác"] || 0) + 1;
    }
  });

  const religionRows = RELIGIONS.map((name, idx) => ({
    label: `${idx + 1}. ${name}`,
    rawLabel: name,
    value: religionDist[name] || 0,
    pctValue: pct(religionDist[name] || 0, total),
  }));

  return { ethnicRows, religionRows };
}

// ── Table 3: Party Age ────────────────────────────────────

function computeTable3(members, reportYear) {
  const total = members.length;
  const groups = [
    { label: "Dưới 30 năm tuổi đảng", min: 0, max: 29 },
    { label: "Từ 30 năm đến dưới 40 năm tuổi đảng", min: 30, max: 39 },
    { label: "Từ 40 năm đến dưới 50 năm tuổi đảng", min: 40, max: 49 },
    { label: "Từ 50 năm tuổi đảng trở lên", min: 50, max: 999 },
  ];

  return groups.map((g) => ({
    label: g.label,
    value: countBy(members, (m) => {
      const pa = getPartyAge(m, reportYear);
      return pa != null && pa >= g.min && pa <= g.max;
    }),
  }));
}

// ── Excel Export ───────────────────────────────────────────

function generateExcelHtml(stats) {
  const { reportYear, comparisonYear, orgName, table1, table2, table3 } = stats;

  const getReportDateString = (year) => {
    const currentYear = new Date().getFullYear();
    if (year === currentYear) {
      const today = new Date();
      return `ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;
    }
    return `ngày 31 tháng 12 năm ${year}`;
  };

  // Dựng HTML cho từng dòng của Bảng 1
  let table1Rows = "";
  table1.forEach((section) => {
    if (section.sectionHeader) {
      table1Rows += `<tr class="section"><td>${section.sectionHeader}</td><td colspan="3"></td></tr>`;
    }
    section.rows.forEach((row) => {
      const cls = row.isTotal ? ' class="bold total-row"' : "";
      const label = section.sectionHeader
        ? `&nbsp;&nbsp;${row.label}`
        : row.label;
      table1Rows += `<tr${cls}>
        <td>${label}</td>
        <td class="right">${row.value}</td>
        <td class="right">${row.previous ?? ""}</td>
        <td class="right">${row.ratio ?? ""}</td>
      </tr>`;
    });
  });

  // Chỉ dựng khối Bảng 2 khi có dữ liệu dân tộc hoặc tôn giáo để hiển thị
  let table2Block = "";
  if (
    table2 &&
    (table2.ethnicRows?.length > 0 || table2.religionRows?.length > 0)
  ) {
    let table2Rows = "";
    if (table2.ethnicRows?.length > 0) {
      table2Rows += `<tr class="section"><td colspan="3">DÂN TỘC / TÔN GIÁO</td></tr>`;
      table2Rows += `<tr class="section"><td colspan="3">ĐẢNG VIÊN CHIA THEO DÂN TỘC</td></tr>`;
      table2.ethnicRows.forEach((row) => {
        table2Rows += `<tr><td>${row.label}</td><td class="right">${row.value}</td><td class="right">${row.pctValue}%</td></tr>`;
      });
    }
    if (table2.religionRows?.length > 0) {
      table2Rows += `<tr class="section"><td colspan="3">ĐẢNG VIÊN TRONG CÁC TÔN GIÁO</td></tr>`;
      table2.religionRows.forEach((row) => {
        table2Rows += `<tr><td>${row.label}</td><td class="right">${row.value}</td><td class="right">${row.pctValue}%</td></tr>`;
      });
    }

    table2Block = `
      <table><tr><td colspan="3" style="border:none;"></td></tr></table>
      <div class="section-title">BẢNG 2: ĐẢNG VIÊN CHIA THEO DÂN TỘC, TÔN GIÁO</div>
      <table>
        <thead><tr>
          <th style="width:340px;">DÂN TỘC / TÔN GIÁO</th>
          <th style="width:120px;">Tổng số</th>
          <th style="width:110px;">Tỷ lệ</th>
        </tr></thead>
        <tbody>${table2Rows}</tbody>
      </table>
    `;
  }

  // Chỉ dựng khối Bảng 3 khi có dữ liệu tuổi Đảng để hiển thị
  let table3Block = "";
  if (table3 && table3.length > 0) {
    let table3Rows = "";
    table3.forEach((row) => {
      table3Rows += `<tr><td>${row.label}</td><td class="right">${row.value}</td><td class="right">${row.previous ?? ""}</td><td class="right">${row.ratio ?? ""}</td></tr>`;
    });

    table3Block = `
      <table><tr><td colspan="4" style="border:none;"></td></tr></table>
      <div class="section-title">BẢNG 3: TUỔI ĐẢNG</div>
      <table>
        <thead><tr>
          <th style="width:340px;">NHÓM TUỔI ĐẢNG</th>
          <th style="width:120px;">Kỳ này</th>
          <th style="width:120px;">Cùng kỳ năm trước</th>
          <th style="width:130px;">Tỷ lệ</th>
        </tr></thead>
        <tbody>${table3Rows}</tbody>
      </table>
    `;
  }

  const fromYear = Math.min(reportYear, comparisonYear || reportYear);
  const toYear = Math.max(reportYear, comparisonYear || reportYear);
  const timeRangeText =
    fromYear === toYear
      ? `Năm ${fromYear}`
      : `Từ năm ${fromYear} đến năm ${toYear}`;

  // Bảng cuối cùng thực sự được render quyết định số cột dùng để chia đôi
  // và merge ô ký tên, để khối ký nằm khớp đúng lưới cột phía trên.
  const lastTableCols = table3Block ? 4 : table2Block ? 3 : 4;
  const leftSpan = Math.ceil(lastTableCols / 2);
  const rightSpan = lastTableCols - leftSpan;
  const signatureRowsHtml = `
        <tr>
          <td style="border:none; padding:10px 0 4px 0; text-align:center; vertical-align:top;" colspan="${leftSpan}"></td>
          <td style="border:none; padding:10px 0 4px 0; text-align:center; vertical-align:top; font-style:italic; font-size:13px;" colspan="${rightSpan}">Ngày.......... tháng .......... năm..............</td>
        </tr>
        <tr>
          <td style="border:none; padding:4px 0; text-align:center; vertical-align:top; font-weight:bold; font-size:14px; text-transform:uppercase;" colspan="${leftSpan}">NGƯỜI LẬP BÁO CÁO</td>
          <td style="border:none; padding:4px 0; text-align:center; vertical-align:top; font-weight:bold; font-size:14px; text-transform:uppercase;" colspan="${rightSpan}">NGƯỜI DUYỆT BÁO CÁO</td>
        </tr>
        <tr>
          <td style="border:none; padding:4px 0; text-align:center; vertical-align:top; font-style:italic; font-size:12px; color:#555;" colspan="${leftSpan}">(Ký, ghi rõ họ tên)</td>
          <td style="border:none; padding:4px 0; text-align:center; vertical-align:top; font-style:italic; font-size:12px; color:#555;" colspan="${rightSpan}">(Ký, ghi rõ họ tên, đóng dấu)</td>
        </tr>`;

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 13px; }
        .report-header { text-align: center; margin-bottom: 10px; }
        .report-title { font-weight: bold; font-size: 16px; text-transform: uppercase; margin: 8px 0 4px 0; }
        .report-subtitle { font-weight: bold; font-size: 13px; margin: 4px 0; }
        .report-date { font-style: italic; font-size: 12px; margin: 4px 0 16px 0; }
        .section-title { font-weight: bold; font-size: 14px; text-transform: uppercase; margin: 12px 0 8px 0; border-left: 4px solid #333; padding-left: 8px; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 5px; }
        th, td { border: 1px solid #000; padding: 5px 8px; font-size: 12px; word-wrap: break-word; }
        th { background-color: #d9d9d9; font-weight: bold; text-align: center; vertical-align: middle; }
        td { vertical-align: middle; }
        .section { background-color: #f2f2f2; font-weight: bold; }
        .bold { font-weight: bold; }
        .total-row { background-color: #fff2cc; font-weight: bold; }
        .right { text-align: right; }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div class="report-title">BÁO CÁO THỐNG KÊ HOẠT ĐỘNG ĐẢNG VIÊN</div>
        <div class="report-subtitle">Mẫu 6-TKCT &nbsp;|&nbsp; Đơn vị: ${orgName} &nbsp;|&nbsp; Thời gian: ${timeRangeText}</div>
        <div class="report-date">Hiện có đến ${getReportDateString(reportYear)}</div>
      </div>

      <table><tr><td colspan="4" style="border:none;"></td></tr></table>

      <div class="section-title">BẢNG 1: THỐNG KÊ TỔNG HỢP ĐỘI NGŨ ĐẢNG VIÊN</div>
      <table>
        <thead><tr>
          <th style="width:340px;">NỘI DUNG THỐNG KÊ</th>
          <th style="width:120px;">Kỳ này</th>
          <th style="width:120px;">Cùng kỳ năm trước</th>
          <th style="width:130px;">Tỷ lệ năm báo cáo so với năm trước</th>
        </tr></thead>
        <tbody>${table1Rows}</tbody>
      </table>

      ${table2Block}

      ${table3Block}
    </body>
    </html>
  `.replace(/<\/tbody>(?![\s\S]*<\/tbody>)/, `${signatureRowsHtml}\n      </tbody>`);
}

// ── Template Export ────────────────────────────────────────

const mau6TKCT = {
  id: "mau_6_tkct",
  name: "Mẫu 6-TKCT",
  description: "Thống kê đội ngũ đảng viên (Ban Tổ chức Trung ương)",
  defaultFilters: [
    { field: "ethnic", operator: "all", value: "" },
    { field: "religion", operator: "all", value: "" },
    { field: "joinPeriod", operator: "all", value: "" },
    { field: "tuoiDoi", operator: "all", value: "" },
    { field: "trinhDoGDPT", operator: "all", value: "" },
    { field: "trinhDoNghiepVu", operator: "all", value: "" },
    { field: "hocHam", operator: "all", value: "" },
    { field: "lyLuanChinhTri", operator: "all", value: "" },
    { field: "tuoiDang", operator: "all", value: "" },
  ],

  /**
   * Tính toàn bộ số liệu thống kê cho mẫu báo cáo này, bao gồm cả so sánh với năm trước.
   * @param {Array} allMembers - Danh sách đảng viên đã được lọc theo tổ chức từ trước
   * @param {{ reportYear: number, comparisonYear: number, orgName: string }} options - Năm báo cáo, năm so sánh và tên đơn vị
   * @returns {Object} Đối tượng chứa đầy đủ số liệu của cả 3 bảng cùng dữ liệu biểu đồ
   */
  computeStats(
    allMembers,
    { reportYear, comparisonYear, orgName, dynamicFilters = [] },
  ) {
    const currentMembers = filterMembersByYear(allMembers, reportYear);
    const previousMembers = filterMembersByYear(allMembers, comparisonYear);

    const activeFields = new Set((dynamicFilters || []).map((f) => f.field));

    const getSelectValue = (field) => {
      const f = (dynamicFilters || []).find(
        (x) => x.field === field && x.operator === "select",
      );
      return f && f.value ? f.value.trim() : null;
    };

    // Tính Bảng 1 cho cả năm báo cáo lẫn năm so sánh để đối chiếu
    const currentT1 = computeTable1(currentMembers, reportYear);
    const previousT1 = computeTable1(previousMembers, comparisonYear);

    const table1 = currentT1
      .map((section, si) => {
        const prevSection = previousT1[si];

        // Phần đầu tiên (si === 0) là tổng số đảng viên, luôn hiển thị bất kể bộ lọc
        if (si === 0) {
          return {
            ...section,
            rows: section.rows.map((row, ri) => {
              const prevRow = prevSection?.rows[ri];
              return {
                ...row,
                previous: prevRow?.value ?? 0,
                ratio: yoyRatio(row.value, prevRow?.value ?? 0),
              };
            }),
          };
        }

        // Phần thứ hai (si === 1) là mục "Trong đó" — mỗi dòng có điều kiện hiển thị riêng
        if (si === 1) {
          const rows = [];
          section.rows.forEach((row, ri) => {
            const prevRow = prevSection?.rows[ri];
            let showRow = false;

            if (row.label === "Dự bị") showRow = true;
            if (row.label === "Phụ nữ") showRow = true;
            if (row.label === "Dân tộc ít người")
              showRow = activeFields.has("ethnic");
            if (row.label === "Tôn giáo")
              showRow = activeFields.has("religion");
            if (row.label === "Giới thiệu về nơi cư trú theo QĐ76/BCT")
              showRow = true;
            if (row.label === "Được miễn công tác sinh hoạt Đảng")
              showRow = true;

            if (showRow) {
              rows.push({
                ...row,
                previous: prevRow?.value ?? 0,
                ratio: yoyRatio(row.value, prevRow?.value ?? 0),
              });
            }
          });

          if (rows.length === 0) return null;
          return {
            ...section,
            rows,
          };
        }

        // Các phần còn lại chỉ hiển thị nếu người dùng có bật bộ lọc tương ứng
        let showSection = false;
        let fieldKey = "";
        if (section.sectionHeader === "Vào Đảng") {
          showSection = activeFields.has("joinPeriod");
          fieldKey = "joinPeriod";
        }
        if (section.sectionHeader === "Tuổi đời") {
          showSection = activeFields.has("tuoiDoi");
          fieldKey = "tuoiDoi";
        }
        if (section.sectionHeader === "Trình độ GD phổ thông") {
          showSection = activeFields.has("trinhDoGDPT");
          fieldKey = "trinhDoGDPT";
        }
        if (section.sectionHeader === "Trình độ chuyên môn nghiệp vụ") {
          showSection = activeFields.has("trinhDoNghiepVu");
          fieldKey = "trinhDoNghiepVu";
        }
        if (section.sectionHeader === "Chức danh KH") {
          showSection = activeFields.has("hocHam");
          fieldKey = "hocHam";
        }
        if (section.sectionHeader === "Trình độ lý luận chính trị") {
          showSection = activeFields.has("lyLuanChinhTri");
          fieldKey = "lyLuanChinhTri";
        }

        if (!showSection) return null;

        let rows = section.rows;
        const selectVal = getSelectValue(fieldKey);
        if (selectVal) {
          rows = rows.filter((row) => {
            if (row.isAverage) return false;
            return row.label.toLowerCase() === selectVal.toLowerCase();
          });
        }

        return {
          ...section,
          rows: rows.map((row) => {
            const prevRow = prevSection?.rows.find(
              (pr) => pr.label === row.label,
            );
            return {
              ...row,
              previous: prevRow?.value ?? 0,
              ratio: row.isAverage
                ? `${prevRow?.value ?? 0} tuổi`
                : yoyRatio(row.value, prevRow?.value ?? 0),
            };
          }),
        };
      })
      .filter(Boolean);

    // Tính Bảng 2 (dân tộc, tôn giáo) nếu người dùng có chọn các tiêu chí này
    const showEthnic = activeFields.has("ethnic");
    const showReligion = activeFields.has("religion");

    let ethnicRows = showEthnic ? computeTable2(currentMembers).ethnicRows : [];
    const ethnicSelectVal = getSelectValue("ethnic");
    if (showEthnic && ethnicSelectVal) {
      const standardList = ETHNICITIES.filter((e) => e !== "Dân tộc khác").map(
        (e) => e.toLowerCase(),
      );
      if (standardList.includes(ethnicSelectVal.toLowerCase())) {
        ethnicRows = ethnicRows.filter(
          (row) => row.rawLabel.toLowerCase() === ethnicSelectVal.toLowerCase(),
        );
      } else {
        ethnicRows = ethnicRows.filter(
          (row) => row.rawLabel === "Dân tộc khác",
        );
      }
    }

    let religionRows = showReligion
      ? computeTable2(currentMembers).religionRows
      : [];
    const religionSelectVal = getSelectValue("religion");
    if (showReligion && religionSelectVal) {
      const standardList = RELIGIONS.filter((r) => r !== "Các đạo khác").map(
        (r) => r.toLowerCase().replace("đạo ", ""),
      );
      const matchedStd = standardList.find(
        (std) =>
          religionSelectVal.toLowerCase().includes(std) ||
          std.includes(religionSelectVal.toLowerCase()),
      );
      if (matchedStd) {
        religionRows = religionRows.filter(
          (row) =>
            row.rawLabel.toLowerCase().replace("đạo ", "") === matchedStd,
        );
      } else {
        religionRows = religionRows.filter(
          (row) => row.rawLabel === "Các đạo khác",
        );
      }
    }

    const table2 = {
      ethnicRows,
      religionRows,
    };

    // Tính Bảng 3 (tuổi Đảng) cho cả năm báo cáo lẫn năm so sánh, nếu có bật tiêu chí này
    const showTable3 = activeFields.has("tuoiDang");
    let currentT3 = showTable3 ? computeTable3(currentMembers, reportYear) : [];
    let previousT3 = showTable3
      ? computeTable3(previousMembers, comparisonYear)
      : [];
    const tuoiDangSelectVal = getSelectValue("tuoiDang");
    if (showTable3 && tuoiDangSelectVal) {
      currentT3 = currentT3.filter(
        (row) => row.label.toLowerCase() === tuoiDangSelectVal.toLowerCase(),
      );
      previousT3 = previousT3.filter(
        (row) => row.label.toLowerCase() === tuoiDangSelectVal.toLowerCase(),
      );
    }

    const table3 = currentT3.map((row) => {
      const prevRow = previousT3.find((pr) => pr.label === row.label);
      return {
        ...row,
        previous: prevRow?.value ?? 0,
        ratio: yoyRatio(row.value, prevRow?.value ?? 0),
      };
    });

    // Các số liệu tổng quan hiển thị ở phần đầu báo cáo
    const totalMembers = currentMembers.length;
    const prevTotal = previousMembers.length;
    const avgAge = computeAverage(currentMembers, (m) => getAge(m, reportYear));
    const femaleCount = countBy(currentMembers, (m) => m.GioiTinh === "Nữ");

    // Số liệu riêng phục vụ vẽ biểu đồ trên giao diện
    const charts = buildChartData(currentMembers, reportYear);

    return {
      reportYear,
      comparisonYear,
      orgName: orgName || "Toàn Đảng bộ",
      totalMembers,
      prevTotal,
      avgAge,
      femaleCount,
      femalePct: pct(femaleCount, totalMembers),
      table1,
      table2,
      table3,
      charts,
    };
  },

  /**
   * Xuất số liệu thống kê ra file Excel, thực chất là dựng file HTML rồi đặt
   * đuôi .xls — cách này Excel vẫn mở và hiển thị đúng định dạng bảng biểu.
   */
  exportToExcel(stats) {
    const html = generateExcelHtml(stats);
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Mau_6_TKCT_${stats.orgName.replace(/\s+/g, "_")}_${stats.reportYear}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};

export default mau6TKCT;
