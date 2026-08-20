import axiosClient from './axiosClient';

const userApi = {
  /**
   * Lấy danh sách người dùng trong hệ thống, có hỗ trợ tham số lọc.
   * GET /api/users
   * @param {Object} [params] - Tham số truy vấn/lọc danh sách
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  getAll(params) {
    return axiosClient.get('/api/users', { params });
  },

  /**
   * Tạo mới người dùng.
   * POST /api/users
   * @param {Object} data - Dữ liệu người dùng cần tạo
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  create(data) {
    return axiosClient.post('/api/users', data);
  },

  /**
   * Cập nhật thông tin người dùng theo id.
   * PUT /api/users/:id
   * @param {string|number} id - Id người dùng
   * @param {Object} data - Dữ liệu cập nhật
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  update(id, data) {
    return axiosClient.put(`/api/users/${id}`, data);
  },

  /**
   * Đổi mật khẩu cho một người dùng theo id.
   * PUT /api/users/:id/change-password
   * @param {string|number} id - Id người dùng
   * @param {string} password - Mật khẩu mới
   * @returns {Promise<Object>} Response API dạng { success, message }
   */
  changePassword(id, password) {
    return axiosClient.put(`/api/users/${id}/change-password`, { password });
  },

  /**
   * Xóa người dùng theo id.
   * DELETE /api/users/:id
   * @param {string|number} id - Id người dùng
   * @returns {Promise<Object>} Response API dạng { success, message }
   */
  delete(id) {
    return axiosClient.delete(`/api/users/${id}`);
  },
};

export default userApi;
