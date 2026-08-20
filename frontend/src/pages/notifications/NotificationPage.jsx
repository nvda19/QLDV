import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  FiBell,
  FiCheckCircle,
  FiXCircle,
  FiSend,
  FiAward,
  FiCheck,
  FiMail,
} from '../../components/icons';
import toast from 'react-hot-toast';
import notificationApi from '../../api/notificationApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import PageHeader from '../../components/common/PageHeader';

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay === 1) return 'Hôm qua';
  if (diffDay < 30) return `${diffDay} ngày trước`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} tháng trước`;
  return `${Math.floor(diffMonth / 12)} năm trước`;
}

const NOTIFICATION_CONFIG = {
  EVALUATION_SUBMITTED: {
    icon: FiSend,
    borderColor: '#1e40af',
    bgColor: 'rgba(30, 64, 175, 0.08)',
    iconColor: '#1e40af',
    label: 'Đã gửi xếp loại',
  },
  EVALUATION_APPROVED: {
    icon: FiCheckCircle,
    borderColor: '#3a8f5c',
    bgColor: 'rgba(58, 143, 92, 0.08)',
    iconColor: '#3a8f5c',
    label: 'Đã phê duyệt',
  },
  EVALUATION_REJECTED: {
    icon: FiXCircle,
    borderColor: '#c44545',
    bgColor: 'rgba(196, 69, 69, 0.08)',
    iconColor: '#c44545',
    label: 'Từ chối xếp loại',
  },
  BADGE_ELIGIBLE: {
    icon: FiAward,
    borderColor: '#b8860b',
    bgColor: 'rgba(197, 160, 89, 0.12)',
    iconColor: '#b8860b',
    label: 'Đủ điều kiện huy hiệu',
  },
  BADGE_PROPOSED: {
    icon: FiSend,
    borderColor: '#1e40af',
    bgColor: 'rgba(30, 64, 175, 0.08)',
    iconColor: '#1e40af',
    label: 'Đề nghị huy hiệu',
  },
  BADGE_APPROVED: {
    icon: FiCheckCircle,
    borderColor: '#3a8f5c',
    bgColor: 'rgba(58, 143, 92, 0.08)',
    iconColor: '#3a8f5c',
    label: 'Duyệt huy hiệu',
  },
  BADGE_REJECTED: {
    icon: FiXCircle,
    borderColor: '#c44545',
    bgColor: 'rgba(196, 69, 69, 0.08)',
    iconColor: '#c44545',
    label: 'Từ chối huy hiệu',
  },
  SYSTEM: {
    icon: FiBell,
    borderColor: '#4a90d9',
    bgColor: 'rgba(74, 144, 217, 0.08)',
    iconColor: '#4a90d9',
    label: 'Hệ thống',
  },
};

function getNotificationConfig(type) {
  return NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.SYSTEM;
}

const FILTER_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'unread', label: 'Chưa đọc' },
];

export default function NotificationPage() {
  const navigate = useNavigate();
  const { refreshCount } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      // Backend nhận tham số "unreadOnly" (trước đây FE gửi "unread" nên bộ lọc không có tác dụng)
      if (filter === 'unread') params.unreadOnly = true;
      const res = await notificationApi.getAll(params);
      const data = res.data || {};
      setNotifications(data.notifications || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error('Không thể tải danh sách thông báo.');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleFilterChange = (key) => {
    setFilter(key);
    setPage(1);
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await notificationApi.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
        // Đồng bộ badge ở Header & Sidebar ngay lập tức
        refreshCount();
      }
      if (notification.link) {
        navigate(notification.link);
      }
    } catch {
      toast.error('Có lỗi xảy ra.');
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      refreshCount();
      toast.success('Đã đánh dấu tất cả đã đọc.');
    } catch {
      toast.error('Không thể đánh dấu đã đọc.');
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="page animate-fade-in">
      <PageHeader
        title="Thông báo"
        actions={
          unreadCount > 0 ? (
            <button
              className="btn btn-outline"
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>{markingAll ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}</span>
              <FiCheck />
            </button>
          ) : null
        }
      />

      {/* Tab lọc theo trạng thái đọc */}
      <div style={{
        display: 'flex',
        gap: 'var(--spacing-xs)',
        marginBottom: 'var(--spacing-lg)',
      }}>
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`btn ${filter === tab.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleFilterChange(tab.key)}
            style={{
              padding: '8px 20px',
              fontSize: 'var(--font-size-sm)',
              borderRadius: '20px',
              transition: 'all 0.2s ease',
            }}
          >
            <span>{tab.label}</span>
            {tab.key === 'unread' ? <FiMail style={{ marginLeft: '6px' }} /> : null}
          </button>
        ))}
      </div>

      {/* Danh sách thông báo */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            {filter === 'all' ? 'Tất cả thông báo' : 'Thông báo chưa đọc'}
          </h3>
          <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
            {notifications.length} thông báo
          </span>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={FiBell}
            title="Không có thông báo"
            message={
              filter === 'unread'
                ? 'Bạn đã đọc tất cả thông báo. Tuyệt vời!'
                : 'Chưa có thông báo nào được gửi đến bạn.'
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {notifications.map((notification) => {
              const config = getNotificationConfig(notification.type);
              const IconComponent = config.icon;
              const isUnread = !notification.isRead;

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--spacing-md)',
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    borderLeft: `4px solid ${config.borderColor}`,
                    background: isUnread
                      ? 'rgba(255, 255, 255, 0.04)'
                      : 'transparent',
                    cursor: notification.link ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isUnread
                      ? 'rgba(255, 255, 255, 0.04)'
                      : 'transparent';
                  }}
                >
                  {/* Biểu tượng loại thông báo */}
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: config.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: `1px solid ${config.borderColor}33`,
                  }}>
                    <IconComponent
                      style={{ fontSize: '18px', color: config.iconColor }}
                    />
                  </div>

                  {/* Nội dung thông báo */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}>
                      <span style={{
                        fontWeight: isUnread ? '600' : '500',
                        fontSize: 'var(--font-size-sm)',
                        color: isUnread ? 'var(--color-text)' : 'var(--color-text-muted)',
                      }}>
                        {notification.title}
                      </span>
                      {isUnread && (
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: config.borderColor,
                          flexShrink: 0,
                        }} />
                      )}
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-muted)',
                      lineHeight: 1.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {notification.content}
                    </p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm)',
                      marginTop: '6px',
                    }}>
                      <span style={{
                        fontSize: '11px',
                        color: 'var(--color-text-muted)',
                        opacity: 0.7,
                      }}>
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                      <span className="badge" style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        background: config.bgColor,
                        color: config.iconColor,
                        border: `1px solid ${config.borderColor}33`,
                      }}>
                        {config.label}
                      </span>
                    </div>
                  </div>

                  {/* Biểu tượng trạng thái đã đọc/chưa đọc */}
                  <div style={{
                    flexShrink: 0,
                    color: isUnread ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    opacity: isUnread ? 1 : 0.4,
                    marginTop: '2px',
                  }}>
                    <FiMail size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Phân trang */}
        {!loading && totalPages > 1 && (
          <div style={{
            padding: 'var(--spacing-md) var(--spacing-lg)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          }}>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
