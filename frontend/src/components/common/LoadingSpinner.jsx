export default function LoadingSpinner({ text = 'Đang tải dữ liệu...' }) {
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <p className="spinner-text">{text}</p>
    </div>
  );
}
