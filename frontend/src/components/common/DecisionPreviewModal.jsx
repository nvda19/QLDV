import { useState, useEffect } from 'react';
import { FiX, FiFileText, FiDownload, FiInfo, FiCalendar, FiTag } from '../icons';
import decisionApi from '../../api/decisionApi';
import LoadingSpinner from './LoadingSpinner';

const LOAI_QUYET_DINH_MAP = {
  KHEN_THUONG: 'Khen thưởng / Xếp loại',
  THANG_HAM: 'Thăng cấp quân hàm',
  HUY_HIEU_DANG: 'Trao tặng Huy hiệu Đảng',
};

export default function DecisionPreviewModal({ isOpen, decisionId, decision, onClose }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setData(null);
      return;
    }

    if (decision) {
      setData(decision);
      return;
    }

    if (decisionId) {
      const fetchDecision = async () => {
        try {
          setLoading(true);
          const res = await decisionApi.getById(decisionId);
          setData(res.data);
        } catch (err) {
          console.error('Lỗi khi tải chi tiết quyết định:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchDecision();
    }
  }, [isOpen, decisionId, decision]);

  if (!isOpen) return null;

  const getFileExtension = (url) => {
    if (!url) return '';
    return url.split('.').pop().toLowerCase();
  };

  const fileExt = data ? getFileExtension(data.taiLieuUrl) : '';
  const isPdf = fileExt === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(fileExt);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal animate-scale-in" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '850px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 'var(--spacing-lg)' }}
      >
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <FiFileText style={{ color: 'var(--color-accent)' }} /> 
            Chi tiết Quyết định {data?.soQuyetDinh ? `#${data.soQuyetDinh}` : ''}
          </h3>
          <button 
            className="btn-close btn-icon" 
            onClick={onClose}
            style={{ padding: '4px', fontSize: '20px' }}
          >
            <FiX />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-2xl)' }}>
            <LoadingSpinner />
          </div>
        ) : !data ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-muted)' }}>
            <FiInfo style={{ fontSize: '32px', marginBottom: '8px' }} />
            <p>Không tìm thấy dữ liệu quyết định hoặc chưa có quyết định liên kết.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', flex: 1, overflow: 'hidden' }}>
            {/* Khối thông tin chung của quyết định: loại, số hiệu, ngày ban hành */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              padding: '12px var(--spacing-md)',
              background: 'var(--color-bg-tertiary)',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: 'var(--font-size-sm)'
            }}>
              <div>
                <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <FiTag /> Loại quyết định:
                </span>
                <strong>{LOAI_QUYET_DINH_MAP[data.loaiQuyetDinh] || data.loaiQuyetDinh}</strong>
              </div>
              <div>
                <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <FiFileText /> Số quyết định:
                </span>
                <strong>{data.soQuyetDinh}</strong>
              </div>
              <div>
                <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <FiCalendar /> Ngày ban hành:
                </span>
                <strong>{new Date(data.ngayBanHanh).toLocaleDateString('vi-VN')}</strong>
              </div>
            </div>

            {data.tenQuyetDinh && (
              <div style={{ fontSize: 'var(--font-size-sm)', padding: '0 4px' }}>
                <span className="text-muted">Tên / Trích yếu:</span> <strong style={{ color: 'var(--color-text-primary)' }}>{data.tenQuyetDinh}</strong>
              </div>
            )}

            {/* Khu vực xem trước tệp văn bản đính kèm (PDF/ảnh) hoặc nút tải về nếu không xem trước được */}
            <div style={{ flex: 1, minHeight: '350px', background: '#121824', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
              {data.taiLieuUrl ? (
                isPdf ? (
                  <iframe
                    src={`${data.taiLieuUrl}#toolbar=0&navpanes=0`}
                    title={`PDF Preview ${data.soQuyetDinh}`}
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                  />
                ) : isImage ? (
                  <div style={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
                    <img
                      src={data.taiLieuUrl}
                      alt={`Quyết định ${data.soQuyetDinh}`}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }}
                    />
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: '#fff' }}>
                    <FiFileText style={{ fontSize: '48px', color: 'var(--color-accent)', marginBottom: '16px' }} />
                    <p style={{ marginBottom: '16px' }}>Định dạng file không hỗ trợ xem trước trực tiếp.</p>
                    <a
                      href={data.taiLieuUrl}
                      download={data.taiLieuName || `QuyetDinh_${data.soQuyetDinh}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary"
                    >
                      <FiDownload /> Tải xuống văn bản ({data.taiLieuName || 'Tệp đính kèm'})
                    </a>
                  </div>
                )
              ) : (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'rgba(255,255,255,0.4)' }}>
                  <FiFileText style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <p>Quyết định này chưa được đính kèm tệp tin văn bản scan.</p>
                </div>
              )}
            </div>

            {/* Các nút thao tác cuối modal */}
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
              {data.taiLieuUrl && (
                <a
                  href={data.taiLieuUrl}
                  download={data.taiLieuName || `QuyetDinh_${data.soQuyetDinh}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <FiDownload /> Tải xuống tệp
                </a>
              )}
              <button className="btn btn-primary" onClick={onClose}>
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
