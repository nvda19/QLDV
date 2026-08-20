const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  HeadingLevel,
  VerticalAlign,
  BorderStyle,
} = require("docx");
const memberRepository = require("../../repositories/member/member.repository");
const orgRepository = require("../../repositories/org.repository");
const { mapToFrontend } = require("../../domain/mappers/member.mapper");

// --- Các hàm tiện ích định dạng văn bản ---
/**
 * Định dạng ngày tháng sang chuỗi "dd/MM/yyyy".
 * @param {string | Date} date - Ngày tháng cần định dạng.
 * @returns {string} Chuỗi ngày tháng định dạng hoặc "..........".
 */
function fmtDate(date) {
  if (!date) return "..........";
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

/**
 * Chuyển giá trị sang chuỗi, thay thế null/undefined/"" bằng "..........".
 * @param {*} val - Giá trị cần chuyển.
 * @returns {string} Chuỗi đã xử lý.
 */
function v(val) {
  if (val === null || val === undefined || val === "") return "..........";
  return String(val);
}

const BORDER_NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const BORDER_THIN = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const CELL_MARGINS = { top: 60, bottom: 60, left: 100, right: 100 };

/**
 * Tạo Paragraph với cấu hình mặc định.
 * @param {string} text - Nội dung văn bản.
 * @param {Object} [opts={}] - Tùy chọn cấu hình.
 * @param {number} [opts.spaceAfter=80] - Khoảng cách sau đoạn văn.
 * @param {number} [opts.spaceBefore=0] - Khoảng cách trước đoạn văn.
 * @param {AlignmentType} [opts.align=AlignmentType.LEFT] - Căn lề.
 * @param {boolean} [opts.bold=false] - In đậm.
 * @param {number} [opts.size=22] - Kích thước font.
 * @param {string} [opts.font="Times New Roman"] - Font chữ.
 * @param {boolean} [opts.underline] - Gạch chân.
 * @returns {Paragraph} Đối tượng Paragraph.
 */
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.spaceAfter ?? 80, before: opts.spaceBefore ?? 0 },
    alignment: opts.align ?? AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        bold: opts.bold ?? false,
        size: opts.size ?? 22,
        font: opts.font ?? "Times New Roman",
        underline: opts.underline ? {} : undefined,
      }),
    ],
  });
}

/**
 * Tạo một dòng Label-Value.
 * @param {string} label - Nhãn.
 * @param {*} value - Giá trị.
 * @param {Object} [opts={}] - Tùy chọn.
 * @param {number} [opts.spaceAfter=60] - Khoảng cách sau đoạn văn.
 * @returns {Paragraph} Đối tượng Paragraph.
 */
function labelValue(label, value, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.spaceAfter ?? 60 },
    children: [
      new TextRun({
        text: label,
        bold: true,
        size: 22,
        font: "Times New Roman",
      }),
      new TextRun({ text: " " + v(value), size: 22, font: "Times New Roman" }),
    ],
  });
}

/**
 * Tạo tiêu đề mục.
 * @param {string} text - Nội dung tiêu đề.
 * @returns {Paragraph} Đối tượng Paragraph.
 */
function sectionTitle(text) {
  return new Paragraph({
    spacing: { before: 160, after: 60 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 22,
        font: "Times New Roman",
        underline: {},
      }),
    ],
  });
}

/**
 * Tạo một ô trong bảng.
 * @param {string} text - Nội dung ô.
 * @param {Object} [opts={}] - Tùy chọn.
 * @param {number} [opts.width] - Chiều rộng ô.
 * @param {boolean} [opts.header] - Là ô tiêu đề.
 * @param {AlignmentType} [opts.align] - Căn lề.
 * @param {boolean} [opts.bold] - In đậm.
 * @param {number} [opts.size] - Kích thước font.
 * @returns {TableCell} Đối tượng TableCell.
 */
function tableCell(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.header ? { fill: "EEEEEE" } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: CELL_MARGINS,
    borders: {
      top: BORDER_THIN,
      bottom: BORDER_THIN,
      left: BORDER_THIN,
      right: BORDER_THIN,
    },
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        children: [
          new TextRun({
            text: v(text),
            bold: opts.bold ?? opts.header ?? false,
            size: 20,
            font: "Times New Roman",
          }),
        ],
      }),
    ],
  });
}

/**
 * Tạo một hàng trong bảng.
 * @param {TableCell[]} cells - Mảng các ô.
 * @param {Object} [opts={}] - Tùy chọn.
 * @param {boolean} [opts.header] - Là hàng tiêu đề.
 * @returns {TableRow} Đối tượng TableRow.
 */
function tableRow(cells, opts = {}) {
  return new TableRow({ children: cells, tableHeader: opts.header ?? false });
}

/**
 * Tạo một hàng trống.
 * @param {number} colCount - Số cột.
 * @returns {TableRow} Đối tượng TableRow.
 */
function emptyRow(colCount) {
  return tableRow(Array.from({ length: colCount }, () => tableCell("")));
}

// --- Logic: Xuất dữ liệu Đảng viên ra file docx ---

/**
 * Xuất dữ liệu một Đảng viên ra file docx
 * @param {string} memberId - ID của Đảng viên cần xuất.
 * @returns {Promise<Buffer>} Buffer chứa nội dung file docx.
 */
async function exportMemberToWord(memberId) {
  const raw = await memberRepository.findById(memberId);
  if (!raw) throw new Error("Không tìm thấy đảng viên");

  const orgs = await orgRepository.findAll();
  const orgMap = new Map(orgs.map((o) => [o.Id, o]));
  const m = mapToFrontend(raw, orgMap);

  const orgName = m.ToChucDang?.Ten || "";
  const orgLevel2 = m.ToChucDang?.level2 || "";
  const orgLevel1 = m.ToChucDang?.level1 || "";

  // 1. Tiêu đề và thông tin tổ chức Đảng
  const headerSection = [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: `SỐ LÝ LỊCH: `,
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({ text: v(m.SoLyLich), size: 22, font: "Times New Roman" }),
        new TextRun({
          text: `     SỐ THẺ ĐẢNG VIÊN: `,
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: v(m.SoTheDangVien),
          size: 22,
          font: "Times New Roman",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({ text: orgLevel1, size: 22, font: "Times New Roman" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: orgLevel2 || orgName,
          size: 22,
          font: "Times New Roman",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 80 },
      children: [
        new TextRun({
          text: "PHIẾU ĐẢNG VIÊN",
          bold: true,
          size: 36,
          font: "Times New Roman",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `Chi bộ: ${v(orgName)}`,
          size: 22,
          font: "Times New Roman",
        }),
      ],
    }),
  ];

  // 2. Lý lịch cá nhân
  const personalInfo = [
    sectionTitle("I. THÔNG TIN CÁ NHÂN"),
    labelValue("01) Họ và tên khai sinh:", m.HoTenKhaiSinh),
    labelValue("     Họ và tên đang dùng:", m.HoTenDangDung),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "02) Giới tính: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({ text: v(m.GioiTinh), size: 22, font: "Times New Roman" }),
        new TextRun({
          text: "        03) Dân tộc: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({ text: v(m.DanToc), size: 22, font: "Times New Roman" }),
        new TextRun({
          text: "        Tôn giáo: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({ text: v(m.TonGiao), size: 22, font: "Times New Roman" }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "04) Sinh ngày: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: fmtDate(m.NgaySinh),
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: "        Nơi sinh: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({ text: v(m.NoiSinh), size: 22, font: "Times New Roman" }),
      ],
    }),
    labelValue("05) Quê quán:", m.QueQuan),
    labelValue("06) Nơi đăng ký hộ khẩu thường trú:", m.NoiThuongTru),
    labelValue("     Nơi tạm trú hiện nay:", m.NoiTamTru),
    labelValue("07) Thành phần gia đình:", m.ThanhPhanGiaDinh),
    labelValue("08) Nghề nghiệp khi vào Đảng:", m.NgheNghiepKhiVaoDang),
    labelValue("     Nghề nghiệp hiện nay:", m.NgheNghiepHienNay),
  ];

  // 3. Thông tin quân ngũ
  const militaryInfo = [
    sectionTitle("II. QUÂN NGŨ & TUYỂN DỤNG"),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "09) Cấp bậc: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({ text: v(m.CapBac), size: 22, font: "Times New Roman" }),
        new TextRun({
          text: "        Công việc chính: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: v(m.CongViecChinh),
          size: 22,
          font: "Times New Roman",
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "10) Ngày tuyển dụng: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: fmtDate(m.NgayTuyenDung),
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: "        Cơ quan: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: v(m.CoQuanTuyenDung),
          size: 22,
          font: "Times New Roman",
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "11) Ngày nhập ngũ: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: fmtDate(m.NgayNhapNgu),
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: "        Ngày xuất ngũ: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: fmtDate(m.NgayXuatNgu),
          size: 22,
          font: "Times New Roman",
        }),
      ],
    }),
  ];

  // 4. Trình độ học vấn
  const educationInfo = [
    sectionTitle("III. TRÌNH ĐỘ"),
    labelValue("12) Giáo dục phổ thông:", m.GiaoDucPhoThong),
    labelValue("     Giáo dục đại học:", m.GiaoDucDaiHoc),
    labelValue("     Học vị:", m.HocVi),
    labelValue("     Học hàm:", m.HocHam),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "     Lý luận chính trị: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: v(m.LyLuanChinhTri),
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: "        Ngoại ngữ: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({ text: v(m.NgoaiNgu), size: 22, font: "Times New Roman" }),
        new TextRun({
          text: "        Tin học: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({ text: v(m.TinHoc), size: 22, font: "Times New Roman" }),
      ],
    }),
  ];

  // 5. Quá trình vào Đảng
  const partyInfo = [
    sectionTitle("IV. THÔNG TIN VÀO ĐẢNG"),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "13) Ngày vào Đảng: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: fmtDate(m.NgayVaoDang),
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: "   Tại chi bộ: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: v(m.ChiBoVaoDang),
          size: 22,
          font: "Times New Roman",
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "     Người giới thiệu 1: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: v(m.NguoiGioiThieu1),
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({ text: " — ", size: 22, font: "Times New Roman" }),
        new TextRun({
          text: v(m.ChucVuNGT1),
          size: 22,
          font: "Times New Roman",
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "     Người giới thiệu 2: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: v(m.NguoiGioiThieu2),
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({ text: " — ", size: 22, font: "Times New Roman" }),
        new TextRun({
          text: v(m.ChucVuNGT2),
          size: 22,
          font: "Times New Roman",
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "     Ngày quyết định kết nạp: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: fmtDate(m.NgayQuyetDinhKetNap),
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: "   Ngày chính thức: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: fmtDate(m.NgayChinhThuc),
          size: 22,
          font: "Times New Roman",
        }),
      ],
    }),
    labelValue("     Chi bộ chính thức:", m.ChiBoChinhThuc),
    labelValue("     Nơi sinh hoạt Đảng hiện tại:", m.NoiSinhHoatDang),
    labelValue("     Chức vụ Đảng:", m.ChucVuDang),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "14) Ngày vào Đoàn: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: fmtDate(m.NgayVaoDoan),
          size: 22,
          font: "Times New Roman",
        }),
      ],
    }),
    labelValue("15) Tổ chức xã hội:", m.ToChucXaHoi),
  ];

  // 6. Tình trạng sức khỏe & chính sách
  const healthInfo = [
    sectionTitle("V. SỨC KHỎE & GIẤY TỜ"),
    labelValue("16) Tình trạng sức khỏe:", m.TinhTrangSucKhoe),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "     Số CMND/CCCD: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({ text: v(m.SoCMND), size: 22, font: "Times New Roman" }),
        new TextRun({
          text: "        Số CMTQD: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({ text: v(m.SoCMTQD), size: 22, font: "Times New Roman" }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "     Gia đình liệt sỹ: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: m.GiaDinhLietSy ? "Có" : "Không",
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: "        Gia đình có công: ",
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
        new TextRun({
          text: m.GiaDinhCoCong ? "Có" : "Không",
          size: 22,
          font: "Times New Roman",
        }),
      ],
    }),
    ...(m.NgayMienCongTac
      ? [labelValue("     Ngày miễn công tác:", fmtDate(m.NgayMienCongTac))]
      : []),
  ];

  // 7. Khen thưởng & Kỷ luật
  const rewardInfo = [
    sectionTitle("VI. KHEN THƯỞNG & KỶ LUẬT"),
    labelValue("17) Khen thưởng:", m.KhenThuong),
    labelValue("     Huy hiệu Đảng:", m.HuyHieuDang),
    labelValue("     Danh hiệu được phong:", m.DanhHieuPhongTang),
    labelValue("18) Kỷ luật:", m.KyLuat),
  ];

  // 8. Quan hệ gia đình
  const familyTableRows = [
    tableRow(
      [
        tableCell("Quan hệ", { header: true, width: 1200 }),
        tableCell("Họ và tên", { header: true, width: 2000 }),
        tableCell("Năm sinh", { header: true, width: 900 }),
        tableCell("Quê quán / Nơi ở / Nghề nghiệp / Đơn vị", { header: true }),
      ],
      { header: true },
    ),
    ...((m.QuanHeGiaDinh || []).length > 0
      ? (m.QuanHeGiaDinh || []).map((qh) =>
          tableRow([
            tableCell(qh.QuanHe, { width: 1200 }),
            tableCell(qh.HoTen, { width: 2000 }),
            tableCell(qh.NamSinh, { width: 900 }),
            tableCell(qh.ThongTin),
          ]),
        )
      : [emptyRow(4)]),
  ];

  const familyTable = [
    sectionTitle("VII. QUAN HỆ GIA ĐÌNH"),
    new Table({
      width: { size: 9000, type: WidthType.DXA },
      rows: familyTableRows,
    }),
  ];

  // 9. Quá trình công tác
  const workTableRows = [
    tableRow(
      [
        tableCell("Từ tháng/năm", { header: true, width: 1400 }),
        tableCell("Đến tháng/năm", { header: true, width: 1400 }),
        tableCell("Làm gì, chức vụ, đơn vị", { header: true }),
      ],
      { header: true },
    ),
    ...((m.QuaTrinhCongTac || []).length > 0
      ? [...(m.QuaTrinhCongTac || [])]
          .reverse()
          .map((qt) =>
            tableRow([
              tableCell(fmtDate(qt.TuThangNam), { width: 1400 }),
              tableCell(fmtDate(qt.DenThangNam), { width: 1400 }),
              tableCell(qt.LamGiChucVuDonVi),
            ]),
          )
      : [emptyRow(3)]),
  ];

  const workTable = [
    sectionTitle("VIII. QUÁ TRÌNH CÔNG TÁC"),
    new Table({
      width: { size: 9000, type: WidthType.DXA },
      rows: workTableRows,
    }),
  ];

  // 10. Đào tạo, bồi dưỡng
  const trainingTableRows = [
    tableRow(
      [
        tableCell("Trường / Cơ sở", { header: true, width: 2200 }),
        tableCell("Ngành học / Lớp", { header: true, width: 2000 }),
        tableCell("Từ ngày", { header: true, width: 1200 }),
        tableCell("Đến ngày", { header: true, width: 1200 }),
        tableCell("Hình thức", { header: true, width: 1200 }),
        tableCell("Văn bằng", { header: true }),
      ],
      { header: true },
    ),
    ...((m.QuaTrinhDaoTao || []).length > 0
      ? [...(m.QuaTrinhDaoTao || [])]
          .reverse()
          .map((dt) =>
            tableRow([
              tableCell(dt.TenTruong, { width: 2200 }),
              tableCell(dt.NganhHoc, { width: 2000 }),
              tableCell(fmtDate(dt.TuNgay), { width: 1200 }),
              tableCell(fmtDate(dt.DenNgay), { width: 1200 }),
              tableCell(dt.HinhThuc, { width: 1200 }),
              tableCell(dt.VanBangCert),
            ]),
          )
      : [emptyRow(6)]),
  ];

  const trainingTable = [
    sectionTitle("IX. QUÁ TRÌNH ĐÀO TẠO BỒI DƯỠNG"),
    new Table({
      width: { size: 9000, type: WidthType.DXA },
      rows: trainingTableRows,
    }),
  ];

  // 11. Lịch sử quân hàm
  const rankTableRows = [
    tableRow(
      [
        tableCell("Cấp bậc", { header: true, width: 1400 }),
        tableCell("Chức vụ", { header: true, width: 2000 }),
        tableCell("Đơn vị", { header: true, width: 2200 }),
        tableCell("Ngày hiệu lực", { header: true, width: 1300 }),
        tableCell("Số quyết định", { header: true }),
      ],
      { header: true },
    ),
    ...((m.LichSuQuanHam || []).length > 0
      ? [...(m.LichSuQuanHam || [])]
          .reverse()
          .map((rh) =>
            tableRow([
              tableCell(rh.CapBac, { width: 1400 }),
              tableCell(rh.ChucVu, { width: 2000 }),
              tableCell(rh.DonVi, { width: 2200 }),
              tableCell(fmtDate(rh.NgayHieuLuc), { width: 1300 }),
              tableCell(rh.SoQuyetDinh),
            ]),
          )
      : [emptyRow(5)]),
  ];

  const rankTable = [
    sectionTitle("XII. LỊCH SỬ QUÂN HÀM"),
    new Table({
      width: { size: 9000, type: WidthType.DXA },
      rows: rankTableRows,
    }),
  ];

  // 12. Đánh giá xếp loại hàng năm
  const evalTableRows = [
    tableRow(
      [
        tableCell("Năm", { header: true, width: 800 }),
        tableCell("Xếp loại", { header: true, width: 2000 }),
        tableCell("Nhận xét", { header: true }),
        tableCell("Trạng thái", { header: true, width: 1400 }),
      ],
      { header: true },
    ),
    ...((m.DanhGiaDangVien || []).length > 0
      ? (m.DanhGiaDangVien || []).map((dg) =>
          tableRow([
            tableCell(String(dg.Nam), { width: 800 }),
            tableCell(dg.XepLoai, { width: 2000 }),
            tableCell(dg.NhanXet),
            tableCell(dg.TrangThai, { width: 1400 }),
          ]),
        )
      : [emptyRow(4)]),
  ];

  const evalTable = [
    sectionTitle("XI. ĐÁNH GIÁ XẾP LOẠI HÀNG NĂM"),
    new Table({
      width: { size: 9000, type: WidthType.DXA },
      rows: evalTableRows,
    }),
  ];

  // 13. Khởi tạo Document cấu trúc
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Times New Roman", size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 1080, right: 720 },
          },
        },
        children: [
          ...headerSection,
          ...personalInfo,
          ...militaryInfo,
          ...educationInfo,
          ...partyInfo,
          ...healthInfo,
          ...rewardInfo,
          ...familyTable,
          p(""),
          ...workTable,
          p(""),
          ...trainingTable,
          p(""),
          ...rankTable,
          p(""),
          ...evalTable,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

module.exports = { exportMemberToWord };
