import axiosClient from './axiosClient';

const decisionApi = {
  /**
   * Lấy danh sách quyết định, có thể kèm tham số lọc.
   * GET /api/decisions
   * @param {Object} [params] - Tham số truy vấn/lọc danh sách
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  getAll(params) {
    return axiosClient.get('/api/decisions', { params });
  },

  /**
   * Lấy chi tiết một quyết định theo id.
   * GET /api/decisions/:id
   * @param {string|number} id - Id quyết định
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  getById(id) {
    return axiosClient.get(`/api/decisions/${id}`);
  },

  /**
   * Tạo mới quyết định (kèm file đính kèm).
   * POST /api/decisions
   * @param {FormData} formData - Dữ liệu quyết định kèm file đính kèm
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  create(formData) {
    return axiosClient.post('/api/decisions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Cập nhật quyết định theo id (kèm file đính kèm).
   * PUT /api/decisions/:id
   * @param {string|number} id - Id quyết định
   * @param {FormData} formData - Dữ liệu cập nhật kèm file đính kèm
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  update(id, formData) {
    return axiosClient.put(`/api/decisions/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Xóa quyết định theo id.
   * DELETE /api/decisions/:id
   * @param {string|number} id - Id quyết định
   * @returns {Promise<Object>} Response API dạng { success, message }
   */
  delete(id) {
    return axiosClient.delete(`/api/decisions/${id}`);
  },
};

export default decisionApi;
