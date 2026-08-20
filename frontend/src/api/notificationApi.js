import axiosClient from './axiosClient';

const notificationApi = {
  /**
   * Lấy danh sách thông báo của người dùng hiện tại, có thể truyền tham số lọc.
   * GET /api/notifications
   * @param {Object} [params={}] - Tham số truy vấn/lọc danh sách
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  getAll(params = {}) {
    return axiosClient.get('/api/notifications', { params });
  },
  /**
   * Lấy số lượng thông báo chưa đọc.
   * GET /api/notifications/unread-count
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  getUnreadCount() {
    return axiosClient.get('/api/notifications/unread-count');
  },
  /**
   * Đánh dấu một thông báo đã đọc.
   * PUT /api/notifications/:id/read
   * @param {string|number} id - Id thông báo
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  markAsRead(id) {
    return axiosClient.put(`/api/notifications/${id}/read`);
  },
  /**
   * Đánh dấu tất cả thông báo đã đọc.
   * PUT /api/notifications/read-all
   * @returns {Promise<Object>} Response API dạng { success, message }
   */
  markAllAsRead() {
    return axiosClient.put('/api/notifications/read-all');
  },
};

export default notificationApi;
