import axiosClient from './axiosClient';

const memberApi = {
  /**
   * Lấy danh sách tất cả đảng viên.
   * GET /api/members
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  getAll() {
    return axiosClient.get('/api/members');
  },

  /**
   * Lấy chi tiết một đảng viên theo id.
   * GET /api/members/:id
   * @param {string|number} id - Id đảng viên
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  getById(id) {
    return axiosClient.get(`/api/members/${id}`);
  },

  /**
   * Tạo mới đảng viên.
   * POST /api/members
   * @param {Object} data - Dữ liệu đảng viên cần tạo
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  create(data) {
    return axiosClient.post('/api/members', data);
  },

  /**
   * Cập nhật thông tin đảng viên theo id.
   * PUT /api/members/:id
   * @param {string|number} id - Id đảng viên
   * @param {Object} data - Dữ liệu cập nhật
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  update(id, data) {
    return axiosClient.put(`/api/members/${id}`, data);
  },

  /**
   * Xóa đảng viên theo id.
   * DELETE /api/members/:id
   * @param {string|number} id - Id đảng viên
   * @returns {Promise<Object>} Response API dạng { success, message }
   */
  deleteMember(id) {
    return axiosClient.delete(`/api/members/${id}`);
  },

  /**
   * Nhập danh sách đảng viên từ file Excel.
   * POST /api/members/import
   * @param {File|File[]|FileList} files - File hoặc danh sách file Excel cần import
   * @param {boolean} [overwriteDuplicates=false] - Có ghi đè bản ghi trùng lặp hay không
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  importExcel(files, overwriteDuplicates = false) {
    const formData = new FormData();
    if (files) {
      if (files instanceof FileList || Array.isArray(files)) {
        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i]);
        }
      } else {
        formData.append('files', files);
      }
    }
    if (overwriteDuplicates) {
      formData.append('overwriteDuplicates', 'true');
    }
    return axiosClient.post('/api/members/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Tải file mẫu Excel dùng để import đảng viên hàng loạt.
   * GET /api/members/import-template
   * @returns {Promise<Blob>} Nội dung file mẫu dạng blob
   */
  downloadTemplate() {
    return axiosClient.get('/api/members/import-template', {
      responseType: 'blob',
    });
  },

  /**
   * Xuất hồ sơ đảng viên ra file Word.
   * GET /api/members/:id/export-word
   * @param {string|number} id - Id đảng viên
   * @returns {Promise<Blob>} Nội dung file Word dạng blob
   */
  downloadWord(id) {
    return axiosClient.get(`/api/members/${id}/export-word`, {
      responseType: 'blob',
    });
  },

  // --- Nhóm API lịch sử quân hàm ---
  /**
   * Thêm một bản ghi lịch sử quân hàm cho đảng viên.
   * POST /api/members/:memberId/rank-history
   * @param {string|number} memberId - Id đảng viên
   * @param {Object} data - Dữ liệu lịch sử quân hàm
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  addRankHistory(memberId, data) {
    return axiosClient.post(`/api/members/${memberId}/rank-history`, data);
  },

  /**
   * Cập nhật một bản ghi lịch sử quân hàm của đảng viên.
   * PUT /api/members/:memberId/rank-history/:rankId
   * @param {string|number} memberId - Id đảng viên
   * @param {string|number} rankId - Id bản ghi quân hàm
   * @param {Object} data - Dữ liệu cập nhật
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  updateRankHistory(memberId, rankId, data) {
    return axiosClient.put(`/api/members/${memberId}/rank-history/${rankId}`, data);
  },

  /**
   * Xóa một bản ghi lịch sử quân hàm của đảng viên.
   * DELETE /api/members/:memberId/rank-history/:rankId
   * @param {string|number} memberId - Id đảng viên
   * @param {string|number} rankId - Id bản ghi quân hàm
   * @returns {Promise<Object>} Response API dạng { success, message }
   */
  deleteRankHistory(memberId, rankId) {
    return axiosClient.delete(`/api/members/${memberId}/rank-history/${rankId}`);
  },

  // --- Nhóm API đánh giá xếp loại cá nhân ---
  /**
   * Thêm bản đánh giá xếp loại cá nhân cho đảng viên.
   * POST /api/members/:memberId/evaluations
   * @param {string|number} memberId - Id đảng viên
   * @param {Object|FormData} data - Dữ liệu đánh giá (FormData nếu có file đính kèm)
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  addEvaluation(memberId, data) {
    const isFormData = data instanceof FormData;
    return axiosClient.post(`/api/members/${memberId}/evaluations`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    });
  },

  /**
   * Cập nhật bản đánh giá xếp loại cá nhân của đảng viên.
   * PUT /api/members/:memberId/evaluations/:evalId
   * @param {string|number} memberId - Id đảng viên
   * @param {string|number} evalId - Id bản đánh giá
   * @param {Object|FormData} data - Dữ liệu cập nhật (FormData nếu có file đính kèm)
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  updateEvaluation(memberId, evalId, data) {
    const isFormData = data instanceof FormData;
    return axiosClient.put(`/api/members/${memberId}/evaluations/${evalId}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    });
  },

  /**
   * Xóa bản đánh giá xếp loại cá nhân của đảng viên.
   * DELETE /api/members/:memberId/evaluations/:evalId
   * @param {string|number} memberId - Id đảng viên
   * @param {string|number} evalId - Id bản đánh giá
   * @returns {Promise<Object>} Response API dạng { success, message }
   */
  deleteEvaluation(memberId, evalId) {
    return axiosClient.delete(`/api/members/${memberId}/evaluations/${evalId}`);
  },

  /**
   * Duyệt bản đánh giá xếp loại cá nhân của đảng viên.
   * PUT /api/members/:memberId/evaluations/:evalId/approve
   * @param {string|number} memberId - Id đảng viên
   * @param {string|number} evalId - Id bản đánh giá
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  approveEvaluation(memberId, evalId) {
    return axiosClient.put(`/api/members/${memberId}/evaluations/${evalId}/approve`);
  },

  /**
   * Từ chối bản đánh giá xếp loại cá nhân của đảng viên.
   * PUT /api/members/:memberId/evaluations/:evalId/reject
   * @param {string|number} memberId - Id đảng viên
   * @param {string|number} evalId - Id bản đánh giá
   * @param {Object} data - Lý do/dữ liệu từ chối
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  rejectEvaluation(memberId, evalId, data) {
    return axiosClient.put(`/api/members/${memberId}/evaluations/${evalId}/reject`, data);
  },

  // --- Nhóm API huy hiệu Đảng ---
  /**
   * Lấy danh sách đề xuất huy hiệu Đảng.
   * GET /api/members/badges/proposals
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  getBadgeProposals() {
    return axiosClient.get('/api/members/badges/proposals');
  },

  /**
   * Quét toàn bộ đảng viên đủ điều kiện nhận huy hiệu Đảng.
   * POST /api/members/badges/scan
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  scanBadgeEligibility() {
    return axiosClient.post('/api/members/badges/scan');
  },

  /**
   * Đề xuất huy hiệu Đảng cho một đảng viên.
   * POST /api/members/:memberId/badges/propose
   * @param {string|number} memberId - Id đảng viên
   * @param {Object} data - Dữ liệu đề xuất
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  proposeBadge(memberId, data) {
    return axiosClient.post(`/api/members/${memberId}/badges/propose`, data);
  },

  /**
   * Nộp danh sách đề xuất huy hiệu Đảng của một tổ chức Đảng.
   * POST /api/members/badges/org/:orgId/submit
   * @param {string|number} orgId - Id tổ chức Đảng
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  submitOrgBadges(orgId) {
    return axiosClient.post(`/api/members/badges/org/${orgId}/submit`);
  },

  /**
   * Bỏ (dismiss) một đề xuất huy hiệu Đảng của đảng viên.
   * POST /api/members/:memberId/badges/dismiss
   * @param {string|number} memberId - Id đảng viên
   * @param {string|number} proposalId - Id đề xuất huy hiệu
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  dismissBadgeProposal(memberId, proposalId) {
    return axiosClient.post(`/api/members/${memberId}/badges/dismiss`, { proposalId });
  },

  /**
   * Khôi phục một đề xuất huy hiệu Đảng đã bị bỏ.
   * POST /api/members/:memberId/badges/restore
   * @param {string|number} memberId - Id đảng viên
   * @param {string|number} proposalId - Id đề xuất huy hiệu
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  restoreBadgeProposal(memberId, proposalId) {
    return axiosClient.post(`/api/members/${memberId}/badges/restore`, { proposalId });
  },

  /**
   * Duyệt danh sách đề xuất huy hiệu Đảng của một tổ chức Đảng (kèm file quyết định).
   * POST /api/members/badges/org/:orgId/approve
   * @param {string|number} orgId - Id tổ chức Đảng
   * @param {FormData} formData - Dữ liệu duyệt kèm file đính kèm
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  approveOrgBadges(orgId, formData) {
    return axiosClient.post(`/api/members/badges/org/${orgId}/approve`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Từ chối danh sách đề xuất huy hiệu Đảng của một tổ chức Đảng.
   * POST /api/members/badges/org/:orgId/reject
   * @param {string|number} orgId - Id tổ chức Đảng
   * @param {Object} data - Lý do/dữ liệu từ chối
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  rejectOrgBadges(orgId, data) {
    return axiosClient.post(`/api/members/badges/org/${orgId}/reject`, data);
  },

  /**
   * Duyệt toàn bộ đề xuất huy hiệu Đảng của 1 mốc huy hiệu, gộp chung mọi tổ chức Đảng.
   * POST /api/members/badges/milestone/:mocHuyHieu/approve
   * @param {number} mocHuyHieu - Mốc huy hiệu (số năm tuổi Đảng)
   * @param {FormData} formData - Dữ liệu duyệt kèm file đính kèm
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  approveMilestoneBadges(mocHuyHieu, formData) {
    return axiosClient.post(`/api/members/badges/milestone/${mocHuyHieu}/approve`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Từ chối toàn bộ đề xuất huy hiệu Đảng của 1 mốc huy hiệu, gộp chung mọi tổ chức Đảng.
   * POST /api/members/badges/milestone/:mocHuyHieu/reject
   * @param {number} mocHuyHieu - Mốc huy hiệu (số năm tuổi Đảng)
   * @param {Object} data - Lý do từ chối
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  rejectMilestoneBadges(mocHuyHieu, data) {
    return axiosClient.post(`/api/members/badges/milestone/${mocHuyHieu}/reject`, data);
  },

  /**
   * Cập nhật file quyết định huy hiệu Đảng của đảng viên.
   * PUT /api/members/:memberId/badges/update-file
   * @param {string|number} memberId - Id đảng viên
   * @param {FormData} formData - File quyết định cần cập nhật
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  updateBadgeDecision(memberId, formData) {
    return axiosClient.put(`/api/members/${memberId}/badges/update-file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Import offline danh sách đề xuất huy hiệu Đảng.
   * POST /api/members/badges/import-proposals-offline
   * @param {Array<Object>} proposals - Danh sách đề xuất cần import
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  importProposalsOffline(proposals) {
    return axiosClient.post('/api/members/badges/import-proposals-offline', { proposals });
  },

  /**
   * Import offline danh sách quyết định huy hiệu Đảng.
   * POST /api/members/badges/import-decisions-offline
   * @param {Array<Object>} decisions - Danh sách quyết định cần import
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  importDecisionsOffline(decisions) {
    return axiosClient.post('/api/members/badges/import-decisions-offline', { decisions });
  },

  /**
   * Tải lên file đính kèm cho hồ sơ đảng viên.
   * POST /api/members/:memberId/attachments
   * @param {string|number} memberId - Id đảng viên
   * @param {FormData} formData - File đính kèm cần tải lên
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  uploadAttachment(memberId, formData) {
    return axiosClient.post(`/api/members/${memberId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Xóa file đính kèm của hồ sơ đảng viên.
   * DELETE /api/members/:memberId/attachments/:attachmentId
   * @param {string|number} memberId - Id đảng viên
   * @param {string|number} attachmentId - Id file đính kèm
   * @returns {Promise<Object>} Response API dạng { success, message }
   */
  deleteAttachment(memberId, attachmentId) {
    return axiosClient.delete(`/api/members/${memberId}/attachments/${attachmentId}`);
  },

  /**
   * Tải lên file đính kèm cho một mục đào tạo của đảng viên.
   * POST /api/members/:memberId/training/:trainingId/attachment
   * @param {string|number} memberId - Id đảng viên
   * @param {string|number} trainingId - Id mục đào tạo
   * @param {File} file - File cần tải lên
   * @returns {Promise<Object>} Response API dạng { success, data }
   */
  uploadTrainingAttachment(memberId, trainingId, file) {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post(`/api/members/${memberId}/training/${trainingId}/attachment`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Xóa file đính kèm của một mục đào tạo của đảng viên.
   * DELETE /api/members/:memberId/training/:trainingId/attachment
   * @param {string|number} memberId - Id đảng viên
   * @param {string|number} trainingId - Id mục đào tạo
   * @returns {Promise<Object>} Response API dạng { success, message }
   */
  deleteTrainingAttachment(memberId, trainingId) {
    return axiosClient.delete(`/api/members/${memberId}/training/${trainingId}/attachment`);
  },
};

export default memberApi;
