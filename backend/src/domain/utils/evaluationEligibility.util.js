// Đảng viên phải vào Đảng tối thiểu 6 tháng mới được xếp loại đánh giá năm.
// Nếu đang đánh giá cho năm hiện tại (chưa qua 31/12) thì mốc so sánh là ngày hôm nay,
// còn năm đã qua thì tính đủ tới 31/12 của năm đó.
const isEligibleForEvaluation = (ngayVaoDang, year) => {
  if (!ngayVaoDang) return false;
  const joinDate = new Date(ngayVaoDang);
  const yearEnd = new Date(year, 11, 31);
  const now = new Date();
  const evalDate = now < yearEnd ? now : yearEnd;
  const diffMonths =
    (evalDate.getFullYear() - joinDate.getFullYear()) * 12 +
    (evalDate.getMonth() - joinDate.getMonth());
  return diffMonths >= 6;
};

module.exports = { isEligibleForEvaluation };
