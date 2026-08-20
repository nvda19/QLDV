const ExcelJS = require("exceljs");

/**
 * Chuẩn hóa định dạng ngày tháng từ ô Excel sang đối tượng Date của JS. Người dùng nhập
 * ngày tháng đủ kiểu (số serial Excel, "dd/mm/yyyy", "mm/yyyy", chỉ năm, "yyyy-mm-dd"...)
 * nên hàm thử lần lượt từng định dạng quen thuộc trước khi đành để new Date() tự đoán.
 * Không parse được thì trả null thay vì throw, để một dòng lỗi không làm sập cả import.
 * @param {*} val Giá trị cần chuẩn hóa
 * @returns {Date} Đối tượng Date đã chuẩn hóa
 */
const parseDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === "number") {
    // Excel lưu ngày dạng số ngày kể từ 1900 (lệch 1 ngày do bug leap year huyền thoại của Excel),
    // 25569 là số ngày từ mốc Excel đến epoch Unix (1/1/1970)
    return new Date((val - 25569) * 86400 * 1000);
  }
  let str = String(val).trim();
  if (!str) return null;

  if (/^\d{1,2}\.\d{4}$/.test(str) || /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(str)) {
    str = str.replace(/\./g, "/");
  }

  if (/^\d{4}$/.test(str)) {
    const y = parseInt(str, 10);
    if (!isNaN(y)) return new Date(y, 0, 1);
  }

  const dmy = str.split("/");
  if (dmy.length === 3) {
    const d = parseInt(dmy[0], 10);
    const m = parseInt(dmy[1], 10) - 1;
    const y = parseInt(dmy[2], 10);
    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) return new Date(y, m, d);
  } else if (dmy.length === 2) {
    const m = parseInt(dmy[0], 10) - 1;
    const y = parseInt(dmy[1], 10);
    if (!isNaN(m) && !isNaN(y)) return new Date(y, m, 1);
  }

  const ymd = str.split("-");
  if (ymd.length === 3) {
    const y = parseInt(ymd[0], 10);
    const m = parseInt(ymd[1], 10) - 1;
    const d = parseInt(ymd[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m, d);
  } else if (ymd.length === 2) {
    const part1 = parseInt(ymd[0], 10);
    const part2 = parseInt(ymd[1], 10);
    if (!isNaN(part1) && !isNaN(part2)) {
      if (part1 > 1000) return new Date(part1, part2 - 1, 1);
      else return new Date(part2, part1 - 1, 1);
    }
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Trích xuất giá trị boolean từ các ký tự đánh dấu (x, yes, có, ☑) - người dùng thường
 * đánh dấu ô checkbox trong Excel theo mấy kiểu này.
 * @param {*} val Giá trị cần trích xuất
 * @returns {boolean} Giá trị boolean đã trích xuất
 */
const parseBoolean = (val) => {
  if (!val) return false;
  if (typeof val === "boolean") return val;
  const str = String(val).toLowerCase().trim();
  return (
    str === "true" ||
    str === "1" ||
    str === "x" ||
    str === "☑" ||
    str === "yes" ||
    str === "có"
  );
};

/**
 * Tách khoảng thời gian bắt đầu và kết thúc (cho quá trình công tác, đào tạo). Dùng cho
 * các cột kiểu "2015 - 2018" hoặc "01/2015 đến 03/2018" - thử tách theo vài dấu phân cách
 * phổ biến, gặp cái nào trước thì dùng cái đó.
 * @param {*} val Giá trị cần tách
 * @returns {{start: Date, end: Date}} Đối tượng chứa khoảng thời gian đã tách
 */
const parseDateRange = (val) => {
  if (!val) return { start: null, end: null };
  const str = String(val).trim();
  if (!str) return { start: null, end: null };

  const separators = ["-", "đến", "to", "→"];
  let parts = [str];
  for (const sep of separators) {
    if (str.includes(sep)) {
      parts = str.split(sep);
      break;
    }
  }

  const start = parseDate(parts[0].trim());
  const end = parts.length > 1 ? parseDate(parts[1].trim()) : null;
  return { start, end };
};

/**
 * Phân tích dòng trong một ô Excel (cho các ô nhiều dòng dữ liệu 1-nhiều). Một số cột
 * (khen thưởng kỷ luật, quan hệ gia đình...) người dùng nhập nhiều dòng trong một ô Excel
 * (Alt+Enter), mỗi dòng là một bản ghi con - tách ra thành mảng, bỏ mấy dòng trắng thừa
 * ở cuối.
 * @param {*} cellValue Giá trị ô Excel
 * @returns {Array<string>} Mảng các dòng đã phân tích
 */
const parseTableCell = (cellValue) => {
  if (cellValue === undefined || cellValue === null) return [];
  if (Array.isArray(cellValue)) return cellValue;

  const str = String(cellValue);
  let lines = str.split(/\r?\n/).map((line) => line.trim());
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines;
};

/**
 * Lấy giá trị thực tế của một ô Excel (giải quyết công thức, rich text). cell.value của
 * ExcelJS không phải lúc nào cũng là giá trị thô - ô có công thức thì value là object
 * {formula, result}, ô rich text (nhiều màu/định dạng trong một ô) thì value là
 * {richText: [...]}. Hàm này bóc hết các trường hợp đó để lấy ra giá trị "sạch" dùng
 * được luôn.
 * @param {*} cell Giá trị ô Excel
 * @returns {*} Giá trị đã trích xuất
 */
const getCellVal = (cell) => {
  if (!cell) return null;
  const v = cell.value;
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v;
  if (typeof v === "object") {
    if (v.richText) return v.richText.map((r) => r.text).join(""); // ghép các đoạn rich text lại thành 1 chuỗi thường
    if (v.result !== undefined) return v.result;
    if (v.text !== undefined) return v.text;
    return String(v);
  }
  return v;
};

/**
 * Đọc file Excel bằng ExcelJS và chuyển đổi thành mảng đối tượng. Mỗi dòng dữ liệu được
 * chuyển thành object { tênCột: giá trị }; bỏ qua dòng 1 (tiêu đề gốc/hướng dẫn), dòng
 * ngay sau đó được coi là dòng chứa tên cột thật.
 * @param {Buffer} buffer Buffer chứa dữ liệu file Excel
 * @returns {Promise<Array<Object>>} Mảng các đối tượng đã trích xuất
 */
const extractExcelData = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];

  const allRows = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const cells = [];
    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cells[colNum - 1] = getCellVal(cell);
    });
    allRows.push(cells);
  });

  if (allRows.length === 0) return [];

  const headers = allRows[0].map((v) => (v != null ? String(v) : ""));
  const result = [];
  for (let i = 1; i < allRows.length; i++) {
    const cells = allRows[i];
    const obj = {};
    headers.forEach((header, j) => {
      if (header) {
        obj[header] = cells[j] !== undefined ? cells[j] : null;
      }
    });
    result.push(obj);
  }
  return result;
};

module.exports = {
  parseDate,
  parseBoolean,
  parseDateRange,
  parseTableCell,
  extractExcelData,
};
