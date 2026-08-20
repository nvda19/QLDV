// Các mốc năm tuổi Đảng được xét tặng Huy hiệu Đảng
const BADGE_MILESTONES = [30, 40, 45, 50, 55, 60, 65, 70, 75, 80];

// Các đợt trao tặng Huy hiệu cố định hằng năm (3/2, 19/5, 2/9, 7/11)
const CEREMONY_DATES = [
  { month: 1, day: 3 }, // 3/2 (Tháng 1 đại diện cho tháng 2 trong JS Date)
  { month: 4, day: 19 }, // 19/5
  { month: 8, day: 2 }, // 2/9
  { month: 10, day: 7 }, // 7/11
];

// Thời gian tối đa được trình đề nghị trước khi đến đợt trao tặng chính thức (tháng)
const ELIGIBILITY_WINDOW_MONTHS = 5;

const ELIGIBILITY_TYPE = {
  ALREADY_PASSED: "ALREADY_PASSED", // Đã vượt quá mốc thời gian nhưng chưa được trao
  UPCOMING_CEREMONY: "UPCOMING_CEREMONY", // Sắp đủ điều kiện vào đợt trao tặng tới
};

/**
 * Tính số tháng chênh lệch giữa hai mốc thời gian, chỉ so theo năm/tháng (bỏ qua ngày trong tháng)
 * @param {Date} later Thời điểm sau
 * @param {Date} earlier Thời điểm trước
 * @returns {number} Số tháng chênh lệch
 */
const diffInMonths = (later, earlier) =>
  (later.getFullYear() - earlier.getFullYear()) * 12 +
  (later.getMonth() - earlier.getMonth());

/**
 * Liệt kê các đợt lễ trao Huy hiệu Đảng sắp tới, tính cả năm hiện tại lẫn năm kế tiếp
 * để không bỏ sót trường hợp còn vài tháng nữa là sang đợt đầu năm sau
 * @param {Date} now Thời điểm hiện tại
 * @returns {Array<Date>} Danh sách ngày của các đợt lễ sắp diễn ra, đã sắp xếp tăng dần
 */
const getUpcomingCeremonies = (now) => {
  const year = now.getFullYear();
  return [year, year + 1]
    .flatMap((y) => CEREMONY_DATES.map((c) => new Date(y, c.month, c.day)))
    .filter((d) => d >= now)
    .sort((a, b) => a - b);
};

/**
 * Rà từng mốc năm tuổi Đảng, trả về những mốc mà đảng viên đã đủ điều kiện nhận Huy hiệu Đảng
 * (đã vượt mốc mà chưa xử lý, hoặc sắp chạm mốc đúng vào một đợt lễ nằm trong khoảng thời gian cho phép)
 * @param {string|Date} NgayVaoDang Ngày vào Đảng
 * @param {Set<number>} handledMilestones Các mốc huy hiệu đã được xử lý/trao trước đó
 * @param {string} currentBadgeStr Chuỗi mô tả huy hiệu hiện có của đảng viên
 * @param {Date} now Thời điểm hiện tại
 * @returns {Array<{milestone: number, type: string, ceremonyDate: Date|null, monthsToCeremony: number}>} Danh sách mốc huy hiệu đủ điều kiện
 */
const getEligibleMilestones = (
  NgayVaoDang,
  handledMilestones,
  currentBadgeStr,
  now,
) => {
  if (!NgayVaoDang) return [];
  const joinDate = new Date(NgayVaoDang);
  if (isNaN(joinDate.getTime())) return [];

  const ceremonies = getUpcomingCeremonies(now);
  const monthsToday = diffInMonths(now, joinDate);
  const result = [];

  for (const milestone of BADGE_MILESTONES) {
    if (handledMilestones && handledMilestones.has(milestone)) continue;
    if (currentBadgeStr && currentBadgeStr.includes(`${milestone} năm`))
      continue;

    const milestoneMonths = milestone * 12;

    // Đã qua mốc niên hạn nhưng chưa làm thủ tục nhận
    if (monthsToday >= milestoneMonths) {
      result.push({
        milestone,
        type: ELIGIBILITY_TYPE.ALREADY_PASSED,
        ceremonyDate: null,
        monthsToCeremony: 0,
      });
      continue;
    }

    // Sắp đạt mốc niên hạn đúng đợt lễ tiếp theo
    for (const ceremony of ceremonies) {
      if (diffInMonths(ceremony, joinDate) >= milestoneMonths) {
        const monthsToCeremony = diffInMonths(ceremony, now);
        if (monthsToCeremony <= ELIGIBILITY_WINDOW_MONTHS) {
          result.push({
            milestone,
            type: ELIGIBILITY_TYPE.UPCOMING_CEREMONY,
            ceremonyDate: ceremony,
            monthsToCeremony,
          });
        }
        break;
      }
    }
  }

  return result;
};

module.exports = {
  BADGE_MILESTONES,
  CEREMONY_DATES,
  ELIGIBILITY_WINDOW_MONTHS,
  ELIGIBILITY_TYPE,
  getUpcomingCeremonies,
  getEligibleMilestones,
};
