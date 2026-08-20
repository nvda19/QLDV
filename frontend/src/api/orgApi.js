import axiosClient from './axiosClient';

const orgApi = {
  /**
   * Lấy danh sách tất cả tổ chức Đảng.
   * GET /api/organizations
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  getAll() {
    return axiosClient.get('/api/organizations');
  },

  /**
   * Tạo mới tổ chức Đảng.
   * POST /api/organizations
   * @param {Object} data - Dữ liệu tổ chức cần tạo
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  create(data) {
    return axiosClient.post('/api/organizations', data);
  },

  /**
   * Cập nhật tổ chức Đảng theo id.
   * PUT /api/organizations/:id
   * @param {string|number} id - Id tổ chức Đảng
   * @param {Object} data - Dữ liệu cập nhật
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  update(id, data) {
    return axiosClient.put(`/api/organizations/${id}`, data);
  },

  /**
   * Xóa tổ chức Đảng theo id.
   * DELETE /api/organizations/:id
   * @param {string|number} id - Id tổ chức Đảng
   * @returns {Promise<Object>} Response API dạng { success, message }
   */
  delete(id) {
    return axiosClient.delete(`/api/organizations/${id}`);
  },

  // --- Nhóm API xếp loại chi bộ ---
  /**
   * Nộp đề xuất xếp loại chi bộ của tổ chức Đảng.
   * POST /api/organizations/:id/evaluations/submit
   * @param {string|number} id - Id tổ chức Đảng
   * @param {Object} data - Dữ liệu đề xuất xếp loại
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  submitEvaluations(id, data) {
    return axiosClient.post(`/api/organizations/${id}/evaluations/submit`, data);
  },

  /**
   * Duyệt đề xuất xếp loại chi bộ (kèm file quyết định).
   * POST /api/organizations/:id/evaluations/approve
   * @param {string|number} id - Id tổ chức Đảng
   * @param {FormData} formData - Dữ liệu duyệt kèm file đính kèm
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  approveEvaluations(id, formData) {
    return axiosClient.post(`/api/organizations/${id}/evaluations/approve`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Từ chối đề xuất xếp loại chi bộ.
   * POST /api/organizations/:id/evaluations/reject
   * @param {string|number} id - Id tổ chức Đảng
   * @param {Object} data - Lý do/dữ liệu từ chối
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  rejectEvaluations(id, data) {
    return axiosClient.post(`/api/organizations/${id}/evaluations/reject`, data);
  },

  /**
   * Lấy cảnh báo liên quan xếp loại chi bộ theo năm.
   * GET /api/organizations/:id/evaluations/warnings
   * @param {string|number} id - Id tổ chức Đảng
   * @param {string|number} year - Năm cần lấy cảnh báo
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  getEvaluationWarnings(id, year) {
    return axiosClient.get(`/api/organizations/${id}/evaluations/warnings`, { params: { year } });
  },

  /**
   * Lấy tổng hợp số liệu xếp loại đánh giá đảng viên toàn phạm vi (nhiều tổ chức) theo năm.
   * GET /api/organizations/evaluations/overview
   * @param {string|number} year - Năm đánh giá
   * @param {string|number} [orgId] - Id tổ chức Đảng muốn lọc thêm (tùy chọn)
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  getEvaluationOverview(year, orgId) {
    return axiosClient.get('/api/organizations/evaluations/overview', { params: { year, orgId } });
  },

  /**
   * Hoàn tác (rollback) xếp loại chi bộ đã duyệt.
   * POST /api/organizations/:id/evaluations/rollback
   * @param {string|number} id - Id tổ chức Đảng
   * @param {Object} data - Dữ liệu hoàn tác
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  rollbackEvaluations(id, data) {
    return axiosClient.post(`/api/organizations/${id}/evaluations/rollback`, data);
  },
};

export default orgApi;
