// Vai trò người dùng
const ROLES = Object.freeze({
  BI_THU: "BI_THU",
  CAN_BO_CHINH_TRI: "CAN_BO_CHINH_TRI",
  DANG_VIEN: "DANG_VIEN",
});

// Trạng thái phê duyệt dùng cho đánh giá xếp loại & đề xuất huy hiệu.
const EVALUATION_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
});

// Trạng thái sinh hoạt của đảng viên
const MEMBER_STATUS = Object.freeze({
  HOAT_DONG: "HOAT_DONG",
  MIEN_SINH_HOAT: "MIEN_SINH_HOAT",
});

const STANDARD_RANKS = [
  // Sĩ quan
  "Thiếu úy",
  "Trung úy",
  "Thượng úy",
  "Đại úy",
  "Thiếu tá",
  "Trung tá",
  "Thượng tá",
  "Đại tá",
  "Thiếu tướng",
  "Trung tướng",
  "Thượng tướng",
  "Đại tướng",
  // Quân nhân chuyên nghiệp
  "Chuẩn úy QNCN",
  "Thiếu úy QNCN",
  "Trung úy QNCN",
  "Thượng úy QNCN",
  "Đại úy QNCN",
  "Thiếu tá QNCN",
  "Trung tá QNCN",
  "Thượng tá QNCN",
  // Hạ sỹ quan, binh sĩ
  "Binh nhì",
  "Binh nhất",
  "Hạ sỹ",
  "Trung sỹ",
  "Thượng sỹ",
];

// Các mức xếp loại đánh giá đảng viên hàng năm
const EVALUATION_RANKS = Object.freeze({
  XUAT_SAC: "Xuất sắc",
  TOT: "Tốt",
  HOAN_THANH: "Hoàn thành",
  KHONG_HOAN_THANH: "Không hoàn thành",
});

// Ngưỡng tỷ lệ % xếp loại "Xuất sắc" tối đa cho phép trong 1 chi bộ (quy định Ban Tổ chức Trung ương)
const EXCELLENT_RANK_THRESHOLD_PCT = 20;

module.exports = {
  ROLES,
  EVALUATION_STATUS,
  MEMBER_STATUS,
  STANDARD_RANKS,
  EVALUATION_RANKS,
  EXCELLENT_RANK_THRESHOLD_PCT,
};
