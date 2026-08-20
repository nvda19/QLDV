import axiosClient from './axiosClient';

const authApi = {
  /**
   * Đăng nhập hệ thống bằng tên đăng nhập và mật khẩu.
   * POST /api/auth/login
   * @param {string} username - Tên đăng nhập
   * @param {string} password - Mật khẩu
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  login(username, password) {
    return axiosClient.post('/api/auth/login', { username, password });
  },

  /**
   * Lấy thông tin người dùng hiện tại đang đăng nhập.
   * GET /api/auth/me
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  getMe() {
    return axiosClient.get('/api/auth/me');
  },

  /**
   * Đăng xuất khỏi hệ thống.
   * POST /api/auth/logout
   * @returns {Promise<Object>} Response API dạng { success, message }
   */
  logout() {
    return axiosClient.post('/api/auth/logout');
  },

  /**
   * Đổi mật khẩu cho người dùng hiện tại.
   * PUT /api/auth/change-password
   * @param {string} newPassword - Mật khẩu mới
   * @returns {Promise<Object>} Response API dạng { success, message }
   */
  changePassword(newPassword) {
    return axiosClient.put('/api/auth/change-password', { newPassword });
  }
};

export default authApi;

