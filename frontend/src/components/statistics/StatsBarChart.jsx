/**
 * StatsBarChart — biểu đồ cột ngang dùng chung cho các trang thống kê,
 * mỗi hàng tương ứng một nhãn kèm thanh tỷ lệ trực quan.
 *
 * Props:
 *   - data: Mảng dữ liệu dạng { label: string, count: number, pct: number }
 *   - color: Màu của thanh cột (mặc định lấy theo màu accent của theme)
 *   - unit: Đơn vị hiển thị sau số đếm, ví dụ 'đồng chí'
 *   - maxItems: Giới hạn số dòng hiển thị (mặc định hiển thị hết)
 *   - showPct: Có hiển thị thêm tỷ lệ phần trăm hay không (mặc định có)
 */
export default function StatsBarChart({
  data = [],
  color = 'var(--color-accent)',
  unit = '',
  maxItems,
  showPct = true,
}) {
  const displayData = maxItems ? data.slice(0, maxItems) : data;

  if (displayData.length === 0) {
    return <p className="text-muted" style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>Chưa có dữ liệu</p>;
  }

  return (
    <div className="stats-bar-chart">
      {displayData.map((item) => (
        <div key={item.label} className="stats-bar-row">
          <div className="stats-bar-meta">
            <span className="stats-bar-label">{item.label}</span>
            <span className="stats-bar-value" style={{ color }}>
              {item.count}
              {unit ? ` ${unit}` : ''}
              {showPct ? ` (${item.pct}%)` : ''}
            </span>
          </div>
          <div className="stats-bar-track">
            <div
              className="stats-bar-fill"
              style={{
                width: `${Math.max(item.pct, 1)}%`,
                background: color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
