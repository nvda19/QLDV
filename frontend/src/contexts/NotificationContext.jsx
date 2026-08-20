import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import notificationApi from '../api/notificationApi';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationApi.getUnreadCount();
      setUnreadCount(res.data?.count ?? 0);
    } catch {
      // Bỏ qua lỗi, không cần báo cho người dùng vì đây chỉ là cập nhật ngầm
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    refreshCount();
    const interval = setInterval(refreshCount, 15000);

    // Khi người dùng chuyển từ tab khác trở lại, cập nhật lại số thông báo chưa đọc ngay
    const handleVisibility = () => {
      if (!document.hidden) refreshCount();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, refreshCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount, refreshCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
