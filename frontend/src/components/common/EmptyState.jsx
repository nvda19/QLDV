import { FiInbox } from '../icons';

export default function EmptyState({
  icon: Icon = FiInbox,
  title = 'Không có dữ liệu',
  message = 'Chưa có dữ liệu nào được tìm thấy.',
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
    </div>
  );
}
