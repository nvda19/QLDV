const path = require("path");
const AdmZip = require("adm-zip");
const ExcelJS = require("exceljs");
const prisma = require("../../infrastructure/database/prisma");
const {
  extractExcelData,
  parseDate,
  parseBoolean,
  parseTableCell,
  parseDateRange,
} = require("../../infrastructure/excel/memberImportParser");
const {
  saveImportAttachment,
} = require("../../infrastructure/storage/importFileStorage.service");
const memberRepository = require("../../repositories/member/member.repository");
const memberPartyRepository = require("../../repositories/member/memberParty.repository");
const memberHistoryRepository = require("../../repositories/member/memberHistory.repository");
const { mapToFrontend } = require("../../domain/mappers/member.mapper");
const orgRepository = require("../../repositories/org.repository");
const { saveDangVien } = require("./member.service");
const { ROLES } = require("../../domain/constants/member.constants");

/**
 * Tìm kiếm đảng viên bị trùng trong cơ sở dữ liệu.
 * Dò theo thứ tự ưu tiên: số lý lịch > số thẻ đảng viên > (họ tên + ngày sinh) — chỉ cần
 * khớp 1 tiêu chí là coi như trùng, trả về ngay bản ghi cũ để service quyết định ghi đè hay bỏ qua.
 * @param {Object} flatData - Dữ liệu lý lịch đảng viên đã chuẩn hóa
 * @returns {Promise<Object|null>} - Bản ghi trùng hoặc null
 */
const findDuplicateMember = async (flatData) => {
  const { SoLyLich, SoTheDangVien, HoTenDangDung, HoTenKhaiSinh, NgaySinh } = flatData;

  if (SoLyLich && SoLyLich.trim() !== "") {
    const existing = await prisma.dangVien.findFirst({
      where: {
        SoLyLich: SoLyLich.trim(),
        DeletedAt: null,
      },
      include: {
        LyLichCaNhan: true,
        ToChucDang: true,
      },
    });
    if (existing) return { member: existing, field: "Số lý lịch", value: SoLyLich.trim() };
  }

  if (SoTheDangVien && SoTheDangVien.trim() !== "") {
    const existing = await prisma.dangVien.findFirst({
      where: {
        SoTheDangVien: SoTheDangVien.trim(),
        DeletedAt: null,
      },
      include: {
        LyLichCaNhan: true,
        ToChucDang: true,
      },
    });
    if (existing) return { member: existing, field: "Số thẻ Đảng viên", value: SoTheDangVien.trim() };
  }

  const name = HoTenDangDung || HoTenKhaiSinh;
  if (name && NgaySinh) {
    const dob = new Date(NgaySinh);
    if (!isNaN(dob.getTime())) {
      const startOfDay = new Date(dob);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dob);
      endOfDay.setHours(23, 59, 59, 999);
      
      const existing = await prisma.dangVien.findFirst({
        where: {
          DeletedAt: null,
          LyLichCaNhan: {
            NgaySinh: {
              gte: startOfDay,
              lte: endOfDay,
            },
            OR: [
              { HoTenDangDung: { equals: name.trim(), mode: "insensitive" } },
              { HoTenKhaiSinh: { equals: name.trim(), mode: "insensitive" } },
            ]
          }
        },
        include: {
          LyLichCaNhan: true,
          ToChucDang: true,
        }
      });
      if (existing) {
        return {
          member: existing,
          field: "Họ tên và Ngày sinh",
          value: `${name.trim()} (${dob.toLocaleDateString("vi-VN")})`
        };
      }
    }
  }

  return null;
};

/**
 * Sinh lại file Excel chỉ gồm các dòng import lỗi/trùng, giữ nguyên header gốc
 * để người dùng sửa rồi import lại luôn, khỏi phải lọc tay từ file ban đầu.
 */
const generateFailedRowsExcel = async (originalBuffer, failedRows) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(originalBuffer);
  const worksheet = workbook.worksheets[0];
  
  const headers = [];
  worksheet.getRow(2).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = cell.value ? String(cell.value) : "";
  });

  const rowCount = worksheet.rowCount;
  if (rowCount >= 3) {
    for (let i = rowCount; i >= 3; i--) {
      worksheet.spliceRows(i, 1);
    }
  }
  
  failedRows.forEach((failedRowObj) => {
    const rowArray = [];
    headers.forEach((header, index) => {
      if (header) {
        rowArray[index] = failedRowObj[header] !== undefined ? failedRowObj[header] : null;
      } else {
        rowArray[index] = null;
      }
    });
    worksheet.addRow(rowArray);
  });

  // Tự co giãn độ rộng cột theo nội dung dài nhất (kể cả khi có xuống dòng)
  worksheet.columns.forEach((column) => {
    let maxLen = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const val = cell.value ? String(cell.value) : "";
      const lines = val.split("\n");
      lines.forEach(line => {
        if (line.length > maxLen) {
          maxLen = line.length;
        }
      });
    });
    column.width = Math.max(maxLen + 4, 12);
  });

  // Tương tự, giãn chiều cao dòng cho đủ số dòng text bên trong ô
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    let maxLines = 1;
    row.eachCell({ includeEmpty: true }, (cell) => {
      if (cell.value) {
        const val = String(cell.value);
        const lines = val.split("\n").length;
        if (lines > maxLines) {
          maxLines = lines;
        }
      }
    });
    row.height = maxLines * 18 + 5;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer.toString("base64");
};

/**
 * Import hàng loạt đảng viên từ Excel, có thể kèm ZIP chứa tài liệu đính kèm
 * (đào tạo, đánh giá, quân hàm...) hoặc gửi rời từng file qua otherFiles.
 * Chạy tuần tự từng dòng vì còn phải dò trùng và tra cứu tổ chức theo tên,
 * không song song hoá được. Trả về kết quả từng dòng cùng file Excel các dòng lỗi
 * (nếu có) để người dùng tải về sửa và import lại.
 */
const bulkImportMembers = async (
  fileBuffer,
  originalName,
  otherFiles = [],
  user,
  options = {},
) => {
  let finalFileBuffer = fileBuffer;
  let zipEntriesMap = new Map();
  let directFilesMap = new Map();
  let isZip = false;
  let isMultiple = otherFiles && otherFiles.length > 0;

  if (originalName && originalName.toLowerCase().endsWith(".zip")) {
    isZip = true;
    const zip = new AdmZip(fileBuffer);
    const zipEntries = zip.getEntries();
    let excelEntry = null;
    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;
      const baseName = path.basename(entry.entryName).toLowerCase().trim();
      zipEntriesMap.set(baseName, entry);
      if (baseName.endsWith(".xlsx") || baseName.endsWith(".xls")) {
        excelEntry = entry;
      }
    }
    if (!excelEntry) {
      throw new Error("Không tìm thấy file dữ liệu Excel trong tệp ZIP.");
    }
    finalFileBuffer = excelEntry.getData();
  } else if (isMultiple) {
    for (const file of otherFiles) {
      const baseName = path.basename(file.originalname).toLowerCase().trim();
      directFilesMap.set(baseName, file);
    }
  }

  const data = await extractExcelData(finalFileBuffer);
  const hasMultipleDecisions = data.some((r) => "Số quyết định_1" in r);
  if (!data || data.length === 0) {
    throw new Error("File Excel không có dữ liệu.");
  }

  const allOrgs = await orgRepository.findAll();
  const orgMap = new Map(allOrgs.map((o) => [o.Id, o]));
  const orgNameMap = new Map(
    allOrgs.map((o) => [o.Ten.toLowerCase().trim(), o]),
  );
  const results = [];
  let index = 0;

  for (const row of data) {
    const excelRow = index + 3; // 2 dòng đầu file là tiêu đề, dữ liệu thực bắt đầu từ dòng 3
    if (
      !row["Họ tên đang dùng"] &&
      !row["Họ tên khai sinh"] &&
      !row["Số lý lịch"]
    ) {
      index++;
      results.push({ status: "skipped" });
      continue;
    }

    try {
      const targetOrgId = await determineOrgId(
        row["Nơi sinh hoạt Đảng"],
        orgNameMap,
        user,
      );
      const flatData = mapExcelRowToDomain(row, targetOrgId);

      const duplicateInfo = await findDuplicateMember(flatData);

      let dv;
      let isUpdate = false;
      if (duplicateInfo) {
        if (options.overwriteDuplicates) {
          // Người dùng đã bật tuỳ chọn ghi đè -> cập nhật vào đúng hồ sơ cũ thay vì tạo mới
          dv = await saveDangVien(flatData, targetOrgId, false, duplicateInfo.member.Id);
          isUpdate = true;
        } else {
          // Mặc định không ghi đè, chỉ báo trùng cho người dùng tự quyết định
          results.push({
            status: "duplicate",
            error: `Hồ sơ trùng lặp (${duplicateInfo.field}: ${duplicateInfo.value}) với đảng viên "${duplicateInfo.member.LyLichCaNhan?.HoTenDangDung || "Không tên"}" thuộc đơn vị "${duplicateInfo.member.ToChucDang?.Ten || "Chưa rõ"}".`,
            rowName: row["Họ tên đang dùng"] || row["Họ tên khai sinh"] || "Không tên",
            excelRow,
            SoLyLich: row["Số lý lịch"] || "Chưa nhập",
          });
          index++;
          continue;
        }
      } else {
        dv = await saveDangVien(flatData, targetOrgId, true, null);
      }

      await processHistoricalData(dv.Id, row, {
        zipEntriesMap,
        directFilesMap,
        isZip,
        isMultiple,
        hasMultipleDecisions,
      });

      const created = await memberRepository.findById(dv.Id);
      results.push({
        status: isUpdate ? "updated" : "success",
        member: mapToFrontend(created, orgMap),
      });
    } catch (err) {
      results.push({
        status: "error",
        error: err.message,
        rowName:
          row["Họ tên đang dùng"] || row["Họ tên khai sinh"] || "Không tên",
        excelRow,
        SoLyLich: row["Số lý lịch"] || "Chưa nhập",
      });
    }
    index++;
  }

  // Chỉ những dòng lỗi hoặc trùng mới cần đưa vào file Excel trả về cho người dùng sửa
  const failedRows = [];
  results.forEach((res, idx) => {
    if (res.status === "error" || res.status === "duplicate") {
      failedRows.push(data[idx]);
    }
  });

  let failedExcelBase64 = null;
  if (failedRows.length > 0) {
    try {
      failedExcelBase64 = await generateFailedRowsExcel(finalFileBuffer, failedRows);
    } catch (e) {
      console.error("Lỗi khi sinh file Excel hồ sơ lỗi:", e);
    }
  }

  const finalResults = results.filter((r) => r.status !== "skipped");

  return {
    results: finalResults,
    failedExcelBase64,
    summary: {
      total: finalResults.length,
      successCount: finalResults.filter((r) => r.status === "success").length,
      updatedCount: finalResults.filter((r) => r.status === "updated").length,
      duplicateCount: finalResults.filter((r) => r.status === "duplicate").length,
      errorCount: finalResults.filter((r) => r.status === "error").length,
    },
  };
};

/**
 * Xác định ID tổ chức đảng từ tên hiển thị sinh hoạt, đồng thời kiểm tra quyền import
 * theo đúng phân cấp quản lý (giống validateWritePermission ở member.policy.js):
 * - Bí thư: nơi sinh hoạt Đảng ghi trong file PHẢI đúng bằng chi bộ mình đang phụ trách,
 *   không được nhập cho bất kỳ đơn vị nào khác.
 * - Cán bộ chính trị: chỉ được nhập cho đảng bộ cao nhất (tổ chức không có tổ chức cha),
 *   không được nhập cho các đảng bộ/chi bộ trực thuộc.
 * Bỏ trống cột "Nơi sinh hoạt Đảng" thì mặc định lấy tổ chức của chính user đang import
 * (luôn hợp lệ với chính họ nên không cần kiểm tra thêm).
 * @param {string} noiSinhHoat - Tên tổ chức đảng sinh hoạt
 * @param {Map<string, Object>} orgNameMap - Map tên tổ chức đảng (đã lowercase, trim) sang tổ chức
 * @param {Object} user - Thông tin người dùng (role, orgId)
 * @returns {string} - ID tổ chức đảng
 */
const determineOrgId = async (noiSinhHoat, orgNameMap, user) => {
  if (!noiSinhHoat || String(noiSinhHoat).trim() === "") {
    return user.orgId;
  }

  const matchedOrg = orgNameMap.get(String(noiSinhHoat).toLowerCase().trim());
  if (!matchedOrg) {
    throw new Error(
      `Nơi sinh hoạt Đảng "${noiSinhHoat}" không tồn tại trong hệ thống`,
    );
  }

  if (user.role === ROLES.BI_THU) {
    if (matchedOrg.Id !== user.orgId) {
      throw new Error(
        `Không có quyền import vào đơn vị khác: "${matchedOrg.Ten}" không phải chi bộ bạn đang phụ trách.`,
      );
    }
  } else if (user.role === ROLES.CAN_BO_CHINH_TRI) {
    if (matchedOrg.ToChucChaId !== null && matchedOrg.ToChucChaId !== undefined) {
      throw new Error(
        `Cán bộ chính trị không có quyền import cho đảng bộ/chi bộ trực thuộc: "${matchedOrg.Ten}".`,
      );
    }
  }

  return matchedOrg.Id;
};

/**
 * Ánh xạ các cột của dòng Excel sang object lưu trữ.
 * Vài field có 2 tên cột khả dĩ do mẫu Excel từng đổi tiêu đề (vd "Từ tháng năm..._1"),
 * nên phải fallback qua cột cũ nếu cột mới trống.
 * @param {Object} row - Dòng dữ liệu Excel
 * @param {string} targetOrgId - ID tổ chức đảng đích
 * @returns {Object} - Object chứa dữ liệu đã ánh xạ
 */
const mapExcelRowToDomain = (row, targetOrgId) => {
  const badges = [
    "30 năm",
    "40 năm",
    "45 năm",
    "50 năm",
    "55 năm",
    "60 năm",
    "65 năm",
    "70 năm",
    "75 năm",
    "80 năm",
  ].filter((yr) => parseBoolean(row[yr]));

  return {
    SoLyLich: String(row["Số lý lịch"] || ""),
    SoTheDangVien: String(row["Số thẻ Đảng viên"] || ""),
    TrangThai: "HOAT_DONG",
    HoTenDangDung: row["Họ tên đang dùng"] || row["Họ tên khai sinh"] || "",
    HoTenKhaiSinh: row["Họ tên khai sinh"] || row["Họ tên đang dùng"] || "",
    GioiTinh: row["Giới tính"] || "Nam",
    NgaySinh: parseDate(row["Ngày sinh"]),
    NoiSinh: row["Nơi sinh"] || "",
    QueQuan: row["Quê quan"] || "",
    NoiThuongTru: row["Địa chỉ thường trú"] || "",
    NoiTamTru: row["Nơi tạm trú"] || "",
    DanToc: row["Dân tộc"] || "",
    TonGiao: row["Tôn giáo"] || "",
    ThanhPhanGiaDinh: row["Thành phần gia đình"] || "",
    NgheNghiepHienNay: row["Công việc hiện tại"] || "",
    NgheNghiepKhiVaoDang: row["Nghề nghiệp khi vào Đảng"] || "",
    NgayVaoDang: parseDate(row["Ngày vào Đảng"]),
    ChiBoVaoDang: row["Nơi vào Đảng"] || "",
    NguoiGioiThieu1: row["Người giới thiệu 1"] || "",
    ChucVuNGT1: row["Cấp bậc, chức vụ, đơn vị NGT1"] || "",
    NguoiGioiThieu2: row["Người giới thiệu 2"] || "",
    ChucVuNGT2: row["Cấp bậc, chức vụ, đơn vị NGT2"] || "",
    NgayChinhThuc: parseDate(row["Ngày chính thức"]),
    ChiBoChinhThuc: row["Nơi vào Đảng chính  thức"] || "",
    NoiSinhHoatDang: row["Nơi sinh hoạt Đảng"] || "",
    ChucVuDang: row["Chức vụ Đảng"] || "",
    NgayVaoDoan: parseDate(row["Ngày vào Đoàn"]),
    ToChucXaHoi: row["Tham gia các tổ chức xã hội"] || "",
    GiaoDucPhoThong: row["Giáo dục phổ thông"] || "",
    GiaoDucNgheNghiep: row["Chuyên môn nghiệp vụ"] || "",
    LyLuanChinhTri: row["Lý luận chính trị"] || "",
    NgoaiNgu: row["Ngoại ngữ"] || "",
    HocVi: row["Học vị"] || "",
    HocHam: row["Học hàm"] || "",
    NgayTuyenDung: parseDate(row["Ngày tuyển dụng"]),
    CoQuanTuyenDung: row["Cơ quan tuyển dụng"] || "",
    NgayNhapNgu: parseDate(row["Ngày nhập ngũ"]),
    NgayXuatNgu: parseDate(row["Ngày xuất ngũ/chuyển ngành"]),
    NgayTaiNgu: parseDate(row["Ngày tái ngũ"]),
    CapBac: row["Cấp bậc"] || "",
    CongViecChinh: row["Công việc hiện tại"] || "",
    TinhTrangSucKhoe: row["Tình trạng sức khỏe"] || "",
    ThuongBinhLoai: row["Thương binh loại"] || "",
    GiaDinhLietSy: parseBoolean(row["Gia đình liệt sĩ"]),
    GiaDinhCoCong: parseBoolean(row["Gia đình có công với CM"]),
    SoCMND: row["CCCD_CMND"] || "",
    SoCMTQD: row["Số chứng minh thư QĐ"] || "",
    NgayMienCongTac: parseDate(row["Ngày miễn công tác và SHĐ"]),
    KhenThuong: row["Khen thưởng (bằng khen trở lên)"] || "",
    HuyHieuDang: badges.join(", "),
    DanhHieuPhongTang: row["Danh hiệu được phong"] || "",
    KyLuat: row["Kỷ luật (Đảng, chính quyền, đoàn thể,…)"] || "",
    LichSuBanThan: {
      ngayVaoDang2: parseDate(row["Ngày vào Đảng lần 2"]),
      chiBoVaoDang2: row["Nơi vào Đảng lần 2"] || "",
      nguoiGioiThieu1_2: row["Người giới thiệu 1_1"] || "",
      chucVuNGT1_2: row["Cấp bậc, chức vụ, đơn vị NGT1_1"] || "",
      nguoiGioiThieu2_2: row["Người giới thiệu 2_1"] || "",
      chucVuNGT2_2: row["Cấp bậc, chức vụ, đơn vị NGT2_1"] || "",
      ngayChinhThuc2: parseDate(row["Ngày chính thức lần 2"]),
      chiBoChinhThuc2: row["Nơi vào Đảng chính  thức lần 2"] || "",
      ngayKhoiPhuc: parseDate(row["Ngày khôi phục Đảng tịch"]),
      chiBoKhoiPhuc: row["Nơi khôi phục Đảng tịch (tại Chi bộ)"] || "",
      xuLyPhapLuat:
        row[
          "Bị bắt, bị tù (ngày tháng năm, chính quyền nào xử lý, hình thức xử lý, nơi thi hành án)"
        ] || "",
      cheDocU:
        row[
          "Bản thân làm việc trong chế độ cũ (ngày tháng năm, chức vụ, nơi làm việc)"
        ] || "",
    },
    QuanHeNuocNgoai: {
      foreignTravel: row["Đã đi nước ngoài (nước nào, lý do, thời gian)"] || "",
      foreignOrgs:
        row["Tham gia hoặc có quan hệ với các tổ chức nước ngoài"] || "",
      foreignRelatives:
        row["Có thân nhân ở nước ngoài (tên, quan hệ, nước nào)"] || "",
    },
    HoanCanhKinhTe: {
      totalIncome: String(
        row["Tổng thu nhập gia đình trong 1 năm (đồng)"] || "",
      ),
      perCapitaIncome: String(row["bình quân 1 người/hộ (đồng)"] || ""),
      houseRent: row["Được cấp, được thuê, loại nhà "] || "",
      houseRentArea: String(row["Diện tích sử dụng (m^2)"] || ""),
      houseOwned: row["Nhà tự mua, tự xây, loại nhà "] || "",
      houseOwnedArea: String(row["Diện tích sử dụng (m^2)_1"] || ""),
      landAllocated: String(row["Đất được cấp (m^2)"] || ""),
      landOwned: String(row["Đất tự mua (m^2)"] || ""),
      economicActivity: row["Hoạt động kinh tế"] || "",
      farmArea: String(row["Diện tích đất kinh doanh trang trại"] || ""),
      hiredLabor: String(row["Số lao động thuê mướn (người)"] || ""),
      valuableAssets:
        row["Những tài sản có giá trị (50 triệu đồng trở lên)"] || "",
      assetValue: String(row["Giá trị (đồng)"] || ""),
    },
    QuanHeGiaDinh: parseQuanHeGiaDinh(row),
  };
};

/**
 * Phân tách dữ liệu nhiều mối quan hệ gia đình (ghép dòng).
 * Mỗi ô "Quan hệ"/"Họ tên"/... có thể chứa nhiều dòng ghép lại (mỗi dòng 1 người thân),
 * nên phải tách theo dòng rồi ghép lại theo chỉ số tương ứng thành từng bản ghi.
 * @param {Object} row - Dòng dữ liệu Excel
 * @returns {Array<Object>} - Mảng các mối quan hệ gia đình
 */
const parseQuanHeGiaDinh = (row) => {
  const relations = parseTableCell(row["Quan hệ"]);
  const names = parseTableCell(row["Họ tên"]);
  const years = parseTableCell(row["Năm sinh"]);
  const infos = parseTableCell(
    row[
      "Quê quán, nơi ở hiện nay, nghề nghiệp, chức danh, chức vụ, đơn vị công tác"
    ],
  );
  const count = Math.max(
    relations.length,
    names.length,
    years.length,
    infos.length,
  );
  const result = [];
  for (let i = 0; i < count; i++) {
    if (relations[i] || names[i]) {
      result.push({
        QuanHe: relations[i] || "",
        HoTen: names[i] || "",
        NamSinh: String(years[i] || ""),
        ThongTin: infos[i] || "",
      });
    }
  }
  return result;
};

/**
 * Ghi các thông tin quan hệ 1-nhiều của đảng viên: quá trình công tác, đào tạo,
 * đánh giá xếp loại hàng năm, lịch sử thăng quân hàm. Mỗi ô Excel tương ứng có thể
 * ghép nhiều dòng nên phải tách rồi tạo từng bản ghi lịch sử một, kèm đính kèm nếu có.
 */
const processHistoricalData = async (memberId, row, context) => {
  const {
    zipEntriesMap,
    directFilesMap,
    isZip,
    isMultiple,
    hasMultipleDecisions,
  } = context;

  // Quá trình công tác
  const ctDates = parseTableCell(row["Từ tháng năm đến tháng năm"]);
  const ctWorks = parseTableCell(
    row["Cấp bậc, chức vụ, đơn vị công tác (Đảng, chính quyền, đoàn thể,...)"],
  );
  for (let i = 0; i < Math.max(ctDates.length, ctWorks.length); i++) {
    if (ctDates[i] || ctWorks[i]) {
      const range = parseDateRange(ctDates[i]);
      await memberHistoryRepository.createWorkHistory({
        DangVienId: memberId,
        TuThangNam: range.start || new Date(),
        DenThangNam: range.end || null,
        LamGiChucVuDonVi: ctWorks[i] || "Chưa rõ",
      });
    }
  }

  // Quá trình đào tạo, có thể kèm file văn bằng/chứng chỉ đính kèm
  const dtSchools = parseTableCell(row["Tên trường"]);
  const dtCourses = parseTableCell(row["Ngành học hoặc tên lớp học"]);
  const dtDates = parseTableCell(
    row["Từ tháng năm đến tháng năm_1"] || row["Từ tháng năm đến tháng năm"],
  );
  const dtTypes = parseTableCell(row["Hình thức học"]);
  const dtCerts = parseTableCell(row["Văn bằng, chứng chỉ"]);
  const dtFiles = parseTableCell(
    row["Tài liệu đào tạo (Tên file đính kèm)"] ||
      row["Tài liệu đính kèm\r\n(Ctrl + K, Existing File or Web Page)"],
  );
  for (
    let i = 0;
    i < Math.max(dtSchools.length, dtCourses.length, dtDates.length);
    i++
  ) {
    if (dtSchools[i] || dtCourses[i]) {
      const range = parseDateRange(dtDates[i]);
      const attachment = saveImportAttachment(
        zipEntriesMap,
        directFilesMap,
        dtFiles[i],
        memberId,
        isZip,
        isMultiple,
      );
      await memberHistoryRepository.createTraining({
        DangVienId: memberId,
        TenTruong: dtSchools[i] || "Chưa rõ",
        NganhHoc: dtCourses[i] || "",
        TuNgay: range.start || new Date(),
        DenNgay: range.end || new Date(),
        HinhThuc: dtTypes[i] || "Chính quy",
        VanBangCert: dtCerts[i] || "",
        TaiLieuUrl: attachment?.FileUrl,
        TaiLieuName: attachment?.fileName,
      });
    }
  }

  // Đánh giá xếp loại hàng năm; các bản ghi import coi như đã được duyệt sẵn
  const dgDecisions = hasMultipleDecisions
    ? parseTableCell(row["Số quyết định"])
    : [];
  const dgYears = parseTableCell(row["Năm"]);
  const dgRanks = parseTableCell(row["Xếp loại"]);
  const dgFiles = parseTableCell(
    row["Tài liệu xếp loại (Tên file đính kèm)"] ||
      row["Tài liệu đính kèm\r\n(Ctrl + K, Existing File or Web Page)_1"],
  );
  for (let i = 0; i < Math.max(dgYears.length, dgRanks.length); i++) {
    if (dgYears[i] || dgRanks[i]) {
      const attachment = saveImportAttachment(
        zipEntriesMap,
        directFilesMap,
        dgFiles[i],
        memberId,
        isZip,
        isMultiple,
      );
      await memberPartyRepository.createEvaluation({
        DangVienId: memberId,
        Nam: parseInt(dgYears[i], 10) || new Date().getFullYear(),
        XepLoai: dgRanks[i] || "Chưa rõ",
        NhanXet: "Import tự động từ Excel",
        TrangThai: "APPROVED",
        SoQuyetDinh: dgDecisions[i] || null,
        TaiLieuUrl: attachment?.FileUrl,
        TaiLieuName: attachment?.fileName,
      });
    }
  }

  // Lịch sử thăng quân hàm
  const qhRanks = parseTableCell(row["Cấp bậc_1"]);
  const qhPos = parseTableCell(row["Chức vụ"]);
  const qhUnits = parseTableCell(row["Đơn vị"]);
  const qhDates = parseTableCell(row["Ngày hiệu lực"] || row["Ngày hiệu kực"]);
  const qhDec = parseTableCell(
    hasMultipleDecisions ? row["Số quyết định_1"] : row["Số quyết định"],
  );
  const qhFiles = parseTableCell(
    row["Tài liệu thăng quân hàm (Tên file đính kèm)"] ||
      row["Tài liệu đính kèm\r\n(Ctrl + K, Existing File or Web Page)_2"],
  );
  for (let i = 0; i < Math.max(qhRanks.length, qhDec.length); i++) {
    if (qhRanks[i] || qhDec[i]) {
      const attachment = saveImportAttachment(
        zipEntriesMap,
        directFilesMap,
        qhFiles[i],
        memberId,
        isZip,
        isMultiple,
      );
      await memberHistoryRepository.createRankHistory({
        DangVienId: memberId,
        CapBac: qhRanks[i] || "Binh nhì",
        ChucVu: qhPos[i] || "",
        DonVi: qhUnits[i] || "",
        NgayHieuLuc: parseDate(qhDates[i]) || new Date(),
        SoQuyetDinh: qhDec[i] || "QĐ-Import",
        TaiLieuUrl: attachment?.FileUrl,
        TaiLieuName: attachment?.fileName,
      });
    }
  }
};

module.exports = { bulkImportMembers };
