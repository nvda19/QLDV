/**
 * Kiểm tra tính hợp lệ của hồ sơ đảng viên trước khi ghi DB
 * Lưu ý: chấp nhận cả field tiếng Anh (từ payload API) lẫn PascalCase gốc (khi service gọi
 * lại từ dữ liệu đã map), nên mỗi field đều thử lần lượt cả 2 tên.
 * @param {Object} data Dữ liệu hồ sơ đảng viên cần kiểm tra
 * @throws {Error} Nếu dữ liệu không hợp lệ
 */
const validateMemberInput = (data) => {
  const fullName = data.fullName !== undefined ? data.fullName : data.HoTenDangDung;
  if (!fullName || fullName.trim() === "") {
    throw new Error("Họ và tên là bắt buộc");
  }

  const dob = data.dob !== undefined ? data.dob : data.NgaySinh;
  if (!dob) throw new Error("Ngày sinh là bắt buộc");

  const dobDate = new Date(dob);
  if (dobDate > new Date()) {
    throw new Error("Ngày sinh không được là ngày trong tương lai");
  }

  const gender = data.gender !== undefined ? data.gender : data.GioiTinh;
  if (!gender) throw new Error("Giới tính là bắt buộc");

  const ngayVaoDang = data.ngayVaoDang !== undefined ? data.ngayVaoDang : data.NgayVaoDang;
  if (ngayVaoDang) {
    const ngayVaoDangDate = new Date(ngayVaoDang);
    if (ngayVaoDangDate <= dobDate) {
      throw new Error("Ngày vào Đảng phải sau ngày sinh.");
    }

    // Ràng buộc tuổi khi kết nạp Đảng phải đủ từ 18 tuổi trở lên
    const ageAtJoining = ngayVaoDangDate.getFullYear() - dobDate.getFullYear();
    const monthDiff = ngayVaoDangDate.getMonth() - dobDate.getMonth();
    const dayDiff = ngayVaoDangDate.getDate() - dobDate.getDate();
    const isUnder18 =
      ageAtJoining < 18 ||
      (ageAtJoining === 18 &&
        (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)));
    if (isUnder18) {
      throw new Error(
        "Đảng viên phải từ đủ 18 tuổi trở lên tại thời điểm vào Đảng.",
      );
    }

    const ngayChinhThuc = data.ngayChinhThuc !== undefined ? data.ngayChinhThuc : data.NgayChinhThuc;
    if (ngayChinhThuc) {
      const ngayChinhThucDate = new Date(ngayChinhThuc);
      if (ngayChinhThucDate < ngayVaoDangDate) {
        throw new Error(
          "Ngày vào Đảng chính thức phải sau ngày vào Đảng dự bị.",
        );
      }

      // Thời gian dự bị thử thách tối thiểu là 1 năm (12 tháng)
      const diffTime = Math.abs(ngayChinhThucDate - ngayVaoDangDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 365) {
        throw new Error(
          "Ngày vào Đảng chính thức phải cách ngày vào Đảng dự bị ít nhất 1 năm (12 tháng).",
        );
      }
    }
  }

  // Kiểm tra Số thẻ Đảng viên
  const soTheDangVien = data.soTheDangVien !== undefined ? data.soTheDangVien : data.SoTheDangVien;
  if (soTheDangVien && String(soTheDangVien).trim() !== "") {
    const cardNo = String(soTheDangVien).trim();
    const regex = /^\d{2}\.\d{6}$/;
    if (!regex.test(cardNo)) {
      throw new Error("Số thẻ Đảng viên phải gồm 8 chữ số chia làm 2 nhóm, ngăn cách bằng dấu chấm (VD: 30.000010)");
    }
    const parts = cardNo.split('.');
    const suffixNum = parseInt(parts[1], 10);
    if (suffixNum < 1 || suffixNum > 999999) {
      throw new Error("Cụm số thứ hai của số thẻ Đảng viên phải nằm trong khoảng từ 000001 đến 999999");
    }
  }

  // Kiểm tra Số lý lịch
  const soLyLich = data.soLyLich !== undefined ? data.soLyLich : data.SoLyLich;
  if (soLyLich && String(soLyLich).trim() !== "") {
    const resumeNo = String(soLyLich).trim().toUpperCase();
    const match = resumeNo.match(/^([A-Z]{2,3})[-/. ]?(\d{6}|\d{8})$/) || 
                  resumeNo.match(/^(\d{6}|\d{8})[-/. ]?([A-Z]{2,3})$/);
                  
    if (!match) {
      throw new Error("Số lý lịch không đúng định dạng. Định dạng chuẩn: 6 hoặc 8 chữ số kèm 2-3 chữ ký hiệu (Ví dụ: 000001-HN hoặc HN-000001)");
    }
    
    let numStr, abbr;
    if (isNaN(Number(match[1]))) {
      abbr = match[1];
      numStr = match[2];
    } else {
      numStr = match[1];
      abbr = match[2];
    }
    
    const num = parseInt(numStr, 10);
    const numLen = numStr.length;
    
    if (numLen === 8) {
      if (num < 72000001 || num > 72009999) {
        throw new Error("Cụm số lý lịch 8 chữ số (Đảng bộ Ngoài nước) phải nằm trong khoảng từ 72000001 đến 72009999");
      }
    } else if (numLen === 6) {
      const isCentralOrPolice = ['CATW', 'CA', 'CCQ', 'TW', 'CCQTW'].includes(abbr);
      if (isCentralOrPolice) {
        if (num < 1 || num > 99999) {
          throw new Error(`Cụm số lý lịch của Đảng bộ ${abbr} phải nằm trong khoảng từ 000001 đến 099999`);
        }
      } else {
        if (num < 1 || num > 999999) {
          throw new Error("Cụm số lý lịch 6 chữ số phải nằm trong khoảng từ 000001 đến 999999");
        }
      }
    } else {
      throw new Error("Số lý lịch không hợp lệ. Cụm số lý lịch phải gồm 6 chữ số (hoặc 8 chữ số đối với Đảng bộ Ngoài nước)");
    }
  }
};

/**
 * Kiểm tra tính hợp lệ của một lần thăng quân hàm
 * Lưu ý: danh mục cấp bậc chuẩn được truyền vào từ ngoài (không import trực tiếp từ constants)
 * để tránh phụ thuộc vòng giữa validator và nơi gọi.
 * @param {Array<string>} STANDARD_RANKS Danh sách các cấp bậc quân hàm chuẩn
 * @param {Object} data Dữ liệu lịch sử thăng quân hàm cần kiểm tra
 * @throws {Error} Nếu dữ liệu không hợp lệ
 */
const validateRankHistory = (STANDARD_RANKS, data) => {
  if (!data.decisionNumber) {
    throw new Error("Số quyết định thăng quân hàm là bắt buộc");
  }
  if (new Date(data.effectiveDate) > new Date()) {
    throw new Error("Ngày thăng quân hàm không được là ngày trong tương lai");
  }
  if (!STANDARD_RANKS.includes(data.CapBac || data.rank)) {
    throw new Error(
      "Cấp bậc quân hàm không hợp lệ. Phải chọn từ danh mục chuẩn.",
    );
  }
};

module.exports = {
  validateMemberInput,
  validateRankHistory,
};
