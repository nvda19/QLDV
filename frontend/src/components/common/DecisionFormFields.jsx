import GlassSelect from './GlassSelect';

/**
 * Component dùng chung cho các modal có bước phê duyệt kèm quyết định
 * (xếp loại đảng viên, huy hiệu Đảng, ...) — gom logic chọn giữa "dùng
 * quyết định có sẵn" và "tạo quyết định mới" về một chỗ duy nhất, tránh
 * lặp lại ở từng modal.
 *
 * @param {object} value - Trạng thái hiện tại: { isExisting, quyetDinhId, soQuyetDinh, tenQuyetDinh, ngayBanHanh, file }
 * @param {(patch: object) => void} onChange - Callback nhận một patch để gộp vào value hiện tại
 * @param {Array<{id:string, soQuyetDinh:string, tenQuyetDinh?:string, ngayBanHanh?:string}>} existingDecisions - Danh sách quyết định có sẵn để chọn
 */
export default function DecisionFormFields({
  value,
  onChange,
  existingDecisions = [],
  emptyDecisionsMessage = 'Chưa có quyết định nào trong hệ thống.',
  showTenQuyetDinh = true,
  requireNewFields = false,
  disabled = false,
}) {
  const { isExisting, quyetDinhId, soQuyetDinh, tenQuyetDinh, ngayBanHanh, file } = value;

  return (
    <>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          className={`btn btn-sm ${!isExisting ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => onChange({ isExisting: false })}
          disabled={disabled}
        >
          Tạo Quyết định mới
        </button>
        <button
          type="button"
          className={`btn btn-sm ${isExisting ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => onChange({ isExisting: true })}
          disabled={disabled}
        >
          Dùng Quyết định đã có
        </button>
      </div>

      {isExisting ? (
        <div className="form-group">
          <label className="form-label">
            Chọn Quyết định <span style={{ color: 'var(--color-error)' }}>*</span>
          </label>
          <GlassSelect
            value={quyetDinhId}
            onChange={(id) => onChange({ quyetDinhId: id })}
            options={existingDecisions.map((d) => ({
              id: d.id,
              name: `${d.soQuyetDinh} — ${d.tenQuyetDinh || ''}`,
            }))}
            placeholder="Chọn quyết định..."
            disabled={disabled}
            style={{ width: '100%' }}
          />
          {existingDecisions.length === 0 && (
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {emptyDecisionsMessage}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div className="form-group">
              <label className="form-label">Số Quyết định</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: 123/QĐ-ĐU"
                value={soQuyetDinh}
                onChange={(e) => onChange({ soQuyetDinh: e.target.value })}
                required={requireNewFields}
                disabled={disabled}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ngày ban hành</label>
              <input
                type="date"
                className="form-input"
                value={ngayBanHanh}
                onChange={(e) => onChange({ ngayBanHanh: e.target.value })}
                required={requireNewFields}
                disabled={disabled}
              />
            </div>
          </div>

          {showTenQuyetDinh && (
            <div className="form-group">
              <label className="form-label">Tên Quyết định</label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: Quyết định xếp loại đảng viên năm 2026"
                value={tenQuyetDinh}
                onChange={(e) => onChange({ tenQuyetDinh: e.target.value })}
                disabled={disabled}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Tệp đính kèm</label>
            <input
              type="file"
              className="form-input"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => onChange({ file: e.target.files?.[0] || null })}
              disabled={disabled}
            />
            {file && (
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Đã chọn: {file.name}
              </p>
            )}
          </div>
        </>
      )}
    </>
  );
}

export const createDecisionFormState = () => ({
  isExisting: false,
  quyetDinhId: '',
  soQuyetDinh: '',
  tenQuyetDinh: '',
  ngayBanHanh: '',
  file: null,
});

/**
 * Chuyển state của form quyết định (do createDecisionFormState tạo ra) thành
 * các field PascalCase mà backend (resolveQuyetDinh) mong đợi, rồi append vào FormData.
 * @param {FormData} fd - Đối tượng FormData cần append thêm dữ liệu vào
 * @param {object} state - State hiện tại của form quyết định
 */
export const appendDecisionFormData = (fd, state) => {
  if (state.isExisting && state.quyetDinhId) {
    fd.append('QuyetDinhId', state.quyetDinhId);
    return;
  }
  if (state.soQuyetDinh?.trim()) fd.append('SoQuyetDinh', state.soQuyetDinh.trim());
  if (state.tenQuyetDinh?.trim()) fd.append('TenQuyetDinh', state.tenQuyetDinh.trim());
  if (state.ngayBanHanh) fd.append('NgayBanHanh', state.ngayBanHanh);
  if (state.file) fd.append('file', state.file);
};
