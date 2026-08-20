import mau6TKCT from './mau6TKCT';

export const CUSTOM_FIELDS = [
  { value: 'ethnic', label: 'Dân tộc' },
  { value: 'religion', label: 'Tôn giáo' },
  { value: 'joinPeriod', label: 'Ngày vào đảng' },
  { value: 'tuoiDoi', label: 'Tuổi đời' },
  { value: 'trinhDoGDPT', label: 'Trình độ giáo dục phổ thông' },
  { value: 'trinhDoNghiepVu', label: 'Trình độ nghiệp vụ' },
  { value: 'hocHam', label: 'Chức danh khoa học' },
  { value: 'lyLuanChinhTri', label: 'Trình độ lý luận chính trị' },
  { value: 'tuoiDang', label: 'Tuổi đảng' },
];

const customReport = {
  id: 'custom_report',
  name: 'Thống kê tùy biến',
  description: 'Thống kê linh hoạt theo các tiêu chí trong hồ sơ',
  isCustom: false,
  defaultFilters: [],

  computeStats(allMembers, options) {
    return mau6TKCT.computeStats(allMembers, options);
  },

  exportToExcel(stats) {
    return mau6TKCT.exportToExcel(stats);
  },
};

export default customReport;
