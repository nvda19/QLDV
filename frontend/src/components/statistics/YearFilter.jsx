import { useState } from 'react';
import GlassSelect from '../common/GlassSelect';

/**
 * YearFilter — ô chọn năm báo cáo bắt buộc phải có trên các trang thống kê;
 * khi chọn năm báo cáo, năm so sánh sẽ tự động lấy là năm liền trước.
 *
 * Props:
 *   - onChange({ reportYear, comparisonYear }) — được gọi mỗi khi người dùng đổi năm
 *   - defaultYear — năm khởi tạo ban đầu (mặc định là năm hiện tại)
 */
export default function YearFilter({ onChange, defaultYear }) {
  const currentYear = new Date().getFullYear();
  const initialYear = defaultYear || currentYear;

  const [singleYear, setSingleYear] = useState(initialYear);

  // Tạo danh sách các năm để chọn, tính lùi từ năm hiện tại về 1950
  const yearOptions = [];
  for (let y = currentYear; y >= 1950; y--) {
    yearOptions.push(y);
  }

  const handleSingleYearChange = (year) => {
    setSingleYear(year);
    onChange({ reportYear: year, comparisonYear: year - 1 });
  };

  return (
    <div className="year-filter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
      <label className="stats-filter-label" style={{ margin: 0, fontWeight: 600 }}>
        Năm báo cáo
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <GlassSelect
          value={singleYear}
          onChange={(val) => handleSingleYearChange(Number(val))}
          options={yearOptions}
          showEmptyOption={false}
          style={{ width: '120px' }}
        />
      </div>
    </div>
  );
}
