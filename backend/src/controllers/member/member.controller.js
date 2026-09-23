const memberService = require("../../services/member/member.service");
const memberImportService = require("../../services/member/memberImport.service");
const memberExportService = require("../../services/member/memberExport.service");
const path = require("path");
const ExcelJS = require("exceljs");

// Lấy danh sách toàn bộ đảng viên theo phân quyền người dùng
const getAllMembers = async (req, res, next) => {
  try {
    const members = await memberService.getAllMembers(req.user);
    res.json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
};

// Lấy chi tiết hồ sơ đảng viên theo ID
const getMemberById = async (req, res, next) => {
  try {
    const member = await memberService.getMemberById(req.params.id, req.user);
    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

// Tạo mới một hồ sơ đảng viên
const createMember = async (req, res, next) => {
  try {
    const member = await memberService.createMember(req.body, req.user);
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

// Cập nhật thông tin hồ sơ đảng viên
const updateMember = async (req, res, next) => {
  try {
    const member = await memberService.updateMember(
      req.params.id,
      req.body,
      req.user,
    );
    res.status(200).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

// Xóa hồ sơ đảng viên (sao lưu ra Excel trước khi xóa cứng)
const deleteMember = async (req, res, next) => {
  try {
    await memberService.deleteMember(req.params.id, req.user);
    res.json({ success: true, message: "Xóa đảng viên thành công" });
  } catch (error) {
    next(error);
  }
};

// Tải xuống file Excel biểu mẫu mẫu để nhập liệu hàng loạt
const downloadImportTemplate = async (req, res, next) => {
  try {
    const filePath = path.join(
      __dirname,
      "../../infrastructure/assets/Mau_Nhap_hang_loat_DangVien.xlsx",
    );
    res.download(filePath, "Mau_Import_DangVien.xlsx");
  } catch (error) {
    next(error);
  }
};

// Nhập dữ liệu đảng viên hàng loạt từ tệp Excel hoặc file nén ZIP
const importMembers = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new Error("Vui lòng tải lên file dữ liệu");
    }

    const excelFile = req.files.find((f) => {
      const name = f.originalname.toLowerCase();
      return (
        name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".zip")
      );
    });

    if (!excelFile) {
      throw new Error("Không tìm thấy file dữ liệu hợp lệ");
    }

    const overwriteDuplicates = req.body.overwriteDuplicates === "true" || req.body.overwriteDuplicates === true;

    const result = await memberImportService.bulkImportMembers(
      excelFile.buffer,
      excelFile.originalname,
      req.files.filter((f) => f !== excelFile), // các file còn lại là bản scan PDF/ảnh quyết định, để service tự ánh xạ vào từng hồ sơ
      req.user,
      { overwriteDuplicates }
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const {
  validateReadPermission,
} = require("../../domain/policies/member.policy");

// Xuất phiếu đảng viên ra file Word (.docx) theo biểu mẫu chuẩn
const exportMemberWord = async (req, res, next) => {
  try {
    await validateReadPermission(req.params.id, req.user);
    const buffer = await memberExportService.exportMemberToWord(req.params.id);
    const fileName = `Phieu_DangVien_${req.params.id}.docx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  importMembers,
  downloadImportTemplate,
  exportMemberWord,
};


