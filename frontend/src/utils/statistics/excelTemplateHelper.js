import ExcelJS from "exceljs";

// Đọc một File do người dùng chọn và mã hóa nội dung sang chuỗi Base64 để lưu tạm/gửi lên server
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
}

// Làm ngược lại fileToBase64: giải mã chuỗi Base64 thành ArrayBuffer để ExcelJS có thể mở workbook
export function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Lấy ra chuỗi hiển thị thực tế của một ô, xử lý cả các kiểu giá trị đặc biệt của ExcelJS (ngày tháng, rich text, công thức)
function getCellDisplayValue(cell) {
  const v = cell.value;
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toLocaleDateString("vi-VN");
  if (typeof v === "object") {
    if (v.richText) return v.richText.map((r) => r.text).join("");
    if (v.result !== undefined) return String(v.result);
    if (v.text !== undefined) return v.text;
    if (v.formula) return v.result !== undefined ? String(v.result) : "";
    return String(v);
  }
  return String(v);
}

// Dựng lại sheet đầu tiên của file Excel mẫu thành một bảng HTML để người dùng xem trước trước khi xuất
export async function renderUploadedTemplateHtml(template) {
  try {
    if (!template || !template.fileData) {
      return '<p class="text-muted">Không có dữ liệu mẫu.</p>';
    }

    const arrayBuffer = base64ToArrayBuffer(template.fileData);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.worksheets[0];

    let html = '<table border="1" style="border-collapse:collapse;width:100%;font-size:0.8rem;">';
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      html += "<tr>";
      row.eachCell({ includeEmpty: true }, (cell) => {
        const val = getCellDisplayValue(cell);
        const escaped = val
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        html += `<td style="padding:4px 6px;border:1px solid #ccc;">${escaped}</td>`;
      });
      html += "</tr>";
    });
    html += "</table>";

    return `<div class="excel-preview-table-wrapper">${html}</div>`;
  } catch (error) {
    console.error("Lỗi khi hiển thị preview Excel:", error);
    return `<p class="text-error">Không thể hiển thị bản xem trước Excel: ${error.message}</p>`;
  }
}

// Duyệt qua toàn bộ ô trong mẫu Excel, thay các placeholder dạng {{...}} bằng số liệu thống kê thực tế rồi xuất file cho người dùng tải về
export async function exportUploadedTemplate(template, stats, filteredMembers = []) {
  try {
    if (!template || !template.fileData) {
      throw new Error("Dữ liệu tệp tin mẫu không tồn tại.");
    }

    const arrayBuffer = base64ToArrayBuffer(template.fileData);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    workbook.worksheets.forEach((worksheet) => {
      worksheet.eachRow({ includeEmpty: false }, (row) => {
        row.eachCell({ includeEmpty: false }, (cell) => {
          let val = "";
          if (typeof cell.value === "string") {
            val = cell.value;
          } else if (
            cell.value &&
            typeof cell.value === "object" &&
            cell.value.richText
          ) {
            val = cell.value.richText.map((r) => r.text).join("");
          } else {
            return;
          }

          val = val.replace(/\{\{total\}\}/gi, stats.totalMembers ?? 0);
          val = val.replace(/\{\{tong_so\}\}/gi, stats.totalMembers ?? 0);

          val = val.replace(/\{\{avg_age\}\}/gi, stats.avgAge ?? 0);
          val = val.replace(/\{\{tuoi_tb\}\}/gi, stats.avgAge ?? 0);

          val = val.replace(/\{\{female_count\}\}/gi, stats.femaleCount ?? 0);
          val = val.replace(/\{\{female_pct\}\}/gi, stats.femalePct ?? 0);
          val = val.replace(/\{\{nu_so_luong\}\}/gi, stats.femaleCount ?? 0);
          val = val.replace(/\{\{nu_ti_le\}\}/gi, stats.femalePct ?? 0);

          val = val.replace(
            /\{\{male_count\}\}/gi,
            (stats.totalMembers ?? 0) - (stats.femaleCount ?? 0),
          );
          val = val.replace(
            /\{\{nam_so_luong\}\}/gi,
            (stats.totalMembers ?? 0) - (stats.femaleCount ?? 0),
          );

          const malePct =
            stats.totalMembers > 0
              ? Math.round(
                  ((stats.totalMembers - stats.femaleCount) /
                    stats.totalMembers) *
                    100,
                )
              : 0;
          val = val.replace(/\{\{male_pct\}\}/gi, malePct);
          val = val.replace(/\{\{nam_ti_le\}\}/gi, malePct);

          val = val.replace(
            /\{\{org_name\}\}/gi,
            stats.orgName || "Toàn Đảng bộ",
          );
          val = val.replace(
            /\{\{don_vi\}\}/gi,
            stats.orgName || "Toàn Đảng bộ",
          );

          val = val.replace(
            /\{\{report_year\}\}/gi,
            stats.reportYear ?? new Date().getFullYear(),
          );
          val = val.replace(
            /\{\{nam_bao_cao\}\}/gi,
            stats.reportYear ?? new Date().getFullYear(),
          );
          val = val.replace(
            /\{\{comparison_year\}\}/gi,
            stats.comparisonYear ?? new Date().getFullYear() - 1,
          );
          val = val.replace(
            /\{\{nam_so_sanh\}\}/gi,
            stats.comparisonYear ?? new Date().getFullYear() - 1,
          );

          const fieldRegex = /\{\{field:([^:]+):([^}]+)\}\}/g;
          let match;
          while ((match = fieldRegex.exec(val)) !== null) {
            const field = match[1].trim();
            const targetVal = match[2].trim().toLowerCase();
            const count = filteredMembers.filter(
              (m) =>
                String(m[field] || "")
                  .trim()
                  .toLowerCase() === targetVal,
            ).length;
            val = val.replace(match[0], count);
          }

          const pctRegex = /\{\{pct:([^:]+):([^}]+)\}\}/g;
          while ((match = pctRegex.exec(val)) !== null) {
            const field = match[1].trim();
            const targetVal = match[2].trim().toLowerCase();
            const count = filteredMembers.filter(
              (m) =>
                String(m[field] || "")
                  .trim()
                  .toLowerCase() === targetVal,
            ).length;
            const percentage =
              stats.totalMembers > 0
                ? Math.round((count / stats.totalMembers) * 100)
                : 0;
            val = val.replace(match[0], percentage);
          }

          if (val !== "" && !isNaN(Number(val))) {
            cell.value = Number(val);
          } else {
            cell.value = val;
          }
        });
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `BaoCao_${template.name}_${stats.reportYear}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Lỗi khi xuất báo cáo Excel từ mẫu tải lên:", error);
    throw new Error(`Lỗi Xuất báo cáo: ${error.message}`);
  }
}
