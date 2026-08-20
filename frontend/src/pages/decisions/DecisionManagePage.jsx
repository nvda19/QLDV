import { useState, useEffect, useRef } from 'react';
import {
  FiFileText,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiCalendar,
  FiPaperclip,
  FiX,
  FiEye,
  FiDownload,
} from '../../components/icons';
import toast from 'react-hot-toast';
import decisionApi from '../../api/decisionApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import PageHeader from '../../components/common/PageHeader';
import DecisionPreviewModal from '../../components/common/DecisionPreviewModal';
import GlassSelect from '../../components/common/GlassSelect';
import GlassSearch from '../../components/common/GlassSearch';

const LOAI_QUYET_DINH_OPTIONS = [
  { id: 'KHEN_THUONG', name: 'Khen thưởng / Xếp loại' },
  { id: 'THANG_HAM', name: 'Thăng cấp quân hàm' },
  { id: 'HUY_HIEU_DANG', name: 'Trao tặng Huy hiệu Đảng' },
];

const LOAI_QUYET_DINH_LABELS = LOAI_QUYET_DINH_OPTIONS.reduce((acc, o) => {
  acc[o.id] = o.name;
  return acc;
}, {});

export default function DecisionManagePage() {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc danh sách
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Trạng thái các modal thêm/sửa
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingDecision, setEditingDecision] = useState(null);
  const [formData, setFormData] = useState({
    soQuyetDinh: '',
    tenQuyetDinh: '',
    loaiQuyetDinh: 'KHEN_THUONG',
    ngayBanHanh: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [deleteAttachment, setDeleteAttachment] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal xác nhận xóa
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Modal xem trước tài liệu
  const [previewTargetId, setPreviewTargetId] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDecisions();
  }, [typeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDecisions();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchDecisions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search; // Gửi kèm từ khóa để backend tự lọc trước
      if (typeFilter) params.loaiQuyetDinh = typeFilter;

      const res = await decisionApi.getAll(params);

      // Lọc lại lần nữa ở client để chắc chắn khớp cả trong trích yếu, phòng khi backend chưa tìm sâu trong nội dung
      let data = res.data || [];
      if (search) {
        const query = search.toLowerCase();
        data = data.filter(
          (d) =>
            d.soQuyetDinh?.toLowerCase().includes(query) ||
            d.tenQuyetDinh?.toLowerCase().includes(query)
        );
      }
      
      setDecisions(data);
    } catch {
      toast.error('Không thể tải danh sách quyết định.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('');
  };

  const handleOpenAddModal = () => {
    setEditingDecision(null);
    setFormData({
      soQuyetDinh: '',
      tenQuyetDinh: '',
      loaiQuyetDinh: 'KHEN_THUONG',
      ngayBanHanh: new Date().toISOString().split('T')[0],
    });
    setSelectedFile(null);
    setDeleteAttachment(false);
    setShowFormModal(true);
  };

  const handleOpenEditModal = (d) => {
    setEditingDecision(d);
    setFormData({
      soQuyetDinh: d.soQuyetDinh,
      tenQuyetDinh: d.tenQuyetDinh || '',
      loaiQuyetDinh: d.loaiQuyetDinh,
      ngayBanHanh: d.ngayBanHanh ? d.ngayBanHanh.split('T')[0] : '',
    });
    setSelectedFile(null);
    setDeleteAttachment(false);
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.soQuyetDinh.trim()) {
      toast.error('Số quyết định không được để trống.');
      return;
    }
    if (!formData.ngayBanHanh) {
      toast.error('Ngày ban hành là bắt buộc.');
      return;
    }

    const multipartData = new FormData();
    multipartData.append('soQuyetDinh', formData.soQuyetDinh.trim());
    multipartData.append('tenQuyetDinh', formData.tenQuyetDinh.trim());
    multipartData.append('loaiQuyetDinh', formData.loaiQuyetDinh);
    multipartData.append('ngayBanHanh', formData.ngayBanHanh);

    if (selectedFile) {
      multipartData.append('file', selectedFile);
    }
    if (deleteAttachment) {
      multipartData.append('deleteAttachment', true);
    }

    setSaving(true);
    try {
      if (editingDecision) {
        await decisionApi.update(editingDecision.id, multipartData);
        toast.success('Cập nhật quyết định thành công.');
      } else {
        await decisionApi.create(multipartData);
        toast.success('Tạo quyết định mới thành công.');
      }
      setShowFormModal(false);
      fetchDecisions();
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await decisionApi.delete(deleteTarget.id);
      toast.success('Đã xóa quyết định thành công.');
      fetchDecisions();
    } catch (err) {
      toast.error(err.message || 'Không thể xóa quyết định.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleOpenPreview = (id) => {
    setPreviewTargetId(id);
    setShowPreviewModal(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  return (
    <div className="page animate-fade-in">
      <PageHeader
        title="Quản lý quyết định"
        subtitle="Hệ thống lưu trữ, liên kết các văn bản quyết định (Khen thưởng, Thăng hàm, Huy hiệu) sử dụng chung cho nhiều đảng viên."
        actions={
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <FiPlus /> Thêm Quyết định
          </button>
        }
      />

      {/* Khối bộ lọc tìm kiếm */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)', position: 'relative', zIndex: 20 }}>
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', alignItems: 'flex-end', gap: 'var(--spacing-md)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tìm kiếm quyết định</label>
            <GlassSearch
              placeholder="Số quyết định, trích yếu..."
              value={search}
              onChange={setSearch}
              width="100%"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Loại quyết định</label>
            <GlassSelect
              value={typeFilter}
              onChange={setTypeFilter}
              options={LOAI_QUYET_DINH_OPTIONS}
              placeholder="Tất cả loại quyết định"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleClearFilters}
              style={{ width: '100%', height: '38px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <FiX /> Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Bảng danh sách quyết định */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Danh sách quyết định hiện có</h3>
          <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
            Tổng số: {decisions.length} bản ghi
          </span>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : decisions.length === 0 ? (
          <EmptyState
            icon={FiFileText}
            title="Không tìm thấy quyết định nào"
            message="Chưa có quyết định nào được tạo hoặc không có kết quả phù hợp."
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>STT</th>
                  <th>Số quyết định</th>
                  <th>Loại quyết định</th>
                  <th>Trích yếu / Tên quyết định</th>
                  <th>Ngày ban hành</th>
                  <th>Tài liệu đính kèm</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {decisions.map((d, index) => (
                  <tr key={d.id}>
                    <td>{index + 1}</td>
                    <td>
                      <button
                        className="btn-link"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-accent)',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: 'inherit',
                          textDecoration: 'underline'
                        }}
                        onClick={() => handleOpenPreview(d.id)}
                      >
                        {d.soQuyetDinh}
                      </button>
                    </td>
                    <td>
                      {LOAI_QUYET_DINH_LABELS[d.loaiQuyetDinh] || d.loaiQuyetDinh}
                    </td>
                    <td style={{ maxWidth: '280px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {d.tenQuyetDinh || <span className="text-muted">Chưa cập nhật tên</span>}
                    </td>
                    <td>{formatDate(d.ngayBanHanh)}</td>
                    <td>
                      {d.taiLieuUrl ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11px', textTransform: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleOpenPreview(d.id)}
                          >
                            <FiEye /> Xem
                          </button>
                          <a
                            href={d.taiLieuUrl}
                            download={d.taiLieuName || `QuyetDinh_${d.soQuyetDinh}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11px', textTransform: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <FiDownload /> Tải
                          </a>
                        </div>
                      ) : (
                        <span className="text-muted" style={{ fontStyle: 'italic' }}>Chưa có file</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          className="btn-icon"
                          title="Chỉnh sửa thông tin quyết định"
                          onClick={() => handleOpenEditModal(d)}
                        >
                          <FiEdit />
                        </button>
                        <button
                          className="btn-icon"
                          title="Xóa quyết định"
                          onClick={() => setDeleteTarget(d)}
                          style={{ color: 'var(--color-error)' }}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal thêm mới / chỉnh sửa quyết định */}
      {showFormModal && (
        <div className="modal-overlay" onClick={() => setShowFormModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', width: '90%' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
              <h3 className="modal-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiFileText style={{ color: 'var(--color-accent)' }} />
                {editingDecision ? 'Chỉnh sửa Quyết định' : 'Thêm Quyết định mới'}
              </h3>
              <button className="btn-icon" onClick={() => setShowFormModal(false)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Loại Quyết định *</label>
                  <select
                    className="form-select"
                    value={formData.loaiQuyetDinh}
                    onChange={(e) => setFormData((f) => ({ ...f, loaiQuyetDinh: e.target.value }))}
                    disabled={!!editingDecision}
                  >
                    {LOAI_QUYET_DINH_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Số quyết định *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ví dụ: 104-QĐ/HV, 12/QĐ-ĐU..."
                    value={formData.soQuyetDinh}
                    onChange={(e) => setFormData((f) => ({ ...f, soQuyetDinh: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tên / Trích yếu nội dung quyết định</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Nhập tên quyết định hoặc tóm tắt nội dung..."
                    value={formData.tenQuyetDinh}
                    onChange={(e) => setFormData((f) => ({ ...f, tenQuyetDinh: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Ngày ban hành *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.ngayBanHanh}
                    onChange={(e) => setFormData((f) => ({ ...f, ngayBanHanh: e.target.value }))}
                    required
                  />
                </div>

                {editingDecision && editingDecision.taiLieuUrl && !deleteAttachment ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(58, 143, 92, 0.1)',
                    border: '1px solid rgba(58, 143, 92, 0.2)',
                    borderRadius: '6px'
                  }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiPaperclip /> Đã đính kèm: {editingDecision.taiLieuName || 'File đính kèm'}
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ color: 'var(--color-error)', border: '1px solid var(--color-error)', padding: '4px 8px' }}
                      onClick={() => setDeleteAttachment(true)}
                    >
                      Xóa tệp
                    </button>
                  </div>
                ) : (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Tải lên văn bản đính kèm (PDF / Ảnh)</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="form-input"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      accept=".pdf,.png,.jpg,.jpeg"
                    />
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      Hỗ trợ định dạng PDF hoặc ảnh scan quyết định (tối đa 10MB)
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-xl)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowFormModal(false)}
                  disabled={saving}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa quyết định */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Xóa Quyết định"
        message={`Bạn có chắc muốn xóa quyết định số "${deleteTarget?.soQuyetDinh}" khỏi hệ thống? Lưu ý: Việc này sẽ gỡ bỏ mối liên kết quyết định khỏi các hồ sơ đảng viên liên quan.`}
        confirmText="Xóa quyết định"
        onConfirm={handleDeleteSubmit}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
        variant="danger"
      />

      {/* Modal xem trước file đính kèm */}
      <DecisionPreviewModal
        isOpen={showPreviewModal}
        decisionId={previewTargetId}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewTargetId(null);
        }}
      />
    </div>
  );
}
