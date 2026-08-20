import React from 'react';
import GlassSelect from '../common/GlassSelect';

export default function EvaluationsSection({
  formData,
  handleChange,
  handleAddEvaluation,
  handleRemoveEvaluation,
  handleEvaluationChange,
  isEdit,
  id,
  setFormData,
  errors = {}
}) {
  return (
    <>
      {/* Khối 6: thông tin khen thưởng, kỷ luật */}
      <fieldset className="form-fieldset">
        <legend>
          Khen thưởng & Kỷ luật (Mục 25-28)
        </legend>
        <div className="form-grid">
          <div className="form-group form-full">
            <label className="form-label" htmlFor="khenThuong">
              <span className="section-number">25)</span> Khen thưởng
            </label>
            <input
              id="khenThuong"
              name="khenThuong"
              type="text"
              className="form-input"
              placeholder="Nhập thông tin khen thưởng"
              value={formData.khenThuong}
              onChange={handleChange}
            />
          </div>
          <div className="form-group form-full">
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
              <span className="section-number">26)</span> Huy hiệu Đảng
            </label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px 20px',
                padding: '12px 16px',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: '6px',
                border: '1px solid var(--color-border)'
              }}
            >
              {[
                "30 năm",
                "40 năm",
                "45 năm",
                "50 năm",
                "55 năm",
                "60 năm",
                "65 năm",
                "70 năm",
                "75 năm",
                "80 năm"
              ].map((opt) => {
                const isChecked = formData.huyhieuDang
                  ? formData.huyhieuDang.toLowerCase().includes(opt.toLowerCase())
                  : false;
                return (
                  <label
                    key={opt}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '10pt',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        let currentValues = formData.huyhieuDang
                          ? formData.huyhieuDang.split(',').map((s) => s.trim()).filter(Boolean)
                          : [];
                        currentValues = currentValues.filter((val) => val.toLowerCase() !== 'chưa');
                        if (e.target.checked) {
                          if (!currentValues.some((val) => val.toLowerCase() === opt.toLowerCase())) {
                            currentValues.push(opt);
                          }
                        } else {
                          currentValues = currentValues.filter((val) => val.toLowerCase() !== opt.toLowerCase());
                        }
                        setFormData((prev) => ({
                          ...prev,
                          huyhieuDang: currentValues.length > 0 ? currentValues.join(', ') : 'Chưa'
                        }));
                      }}
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="danhHieu">
              <span className="section-number">27)</span> Danh hiệu
            </label>
            <input
              id="danhHieu"
              name="danhHieu"
              type="text"
              className="form-input"
              placeholder="Nhập danh hiệu"
              value={formData.danhHieu}
              onChange={handleChange}
            />
          </div>
          <div className="form-group form-full">
            <label className="form-label" htmlFor="kyLuat">
              <span className="section-number">28)</span> Kỷ luật
            </label>
            <input
              id="kyLuat"
              name="kyLuat"
              type="text"
              className="form-input"
              placeholder="Nhập thông tin kỷ luật (nếu có)"
              value={formData.kyLuat}
              onChange={handleChange}
            />
          </div>
          <div className="form-group form-full">
            <label className="form-label" htmlFor="soQuyetDinhKhenThuong">
              Số quyết định (Khen thưởng/Kỷ luật)
            </label>
            <input
              id="soQuyetDinhKhenThuong"
              name="soQuyetDinhKhenThuong"
              type="text"
              className="form-input"
              placeholder="Nhập đúng số quyết định đã tạo ở trang Quản lý quyết định để liên kết"
              value={formData.soQuyetDinhKhenThuong}
              onChange={handleChange}
            />
          </div>
        </div>
      </fieldset>

      {/* Khối 29: bảng xếp loại đảng viên theo từng năm */}
      <fieldset className="form-fieldset">
        <legend>Xếp loại đảng viên hàng năm (Mục 29)</legend>
        <div className="table-container" style={{ marginBottom: 'var(--spacing-md)' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Năm</th>
                <th style={{ width: '35%' }}>Mức xếp loại</th>
                <th style={{ width: '20%' }}>Trạng thái duyệt</th>
                <th style={{ width: '20%' }}>Số quyết định</th>
                <th style={{ width: '10%' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {formData.evaluations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="center-text text-muted" style={{ padding: 'var(--spacing-md)' }}>
                    Chưa có thông tin xếp loại. Nhấn "Thêm xếp loại" để bắt đầu.
                  </td>
                </tr>
              ) : (
                formData.evaluations.map((ev, idx) => {
                  const isApprovedDBRecord = Boolean(ev.id) && ev.status === 'APPROVED';
                  return (
                    <tr key={idx}>
                      <td>
                        <input
                          type="number"
                          className="form-input form-input-sm"
                          min="1950"
                          max="2100"
                          value={ev.year}
                          onChange={(e) =>
                            handleEvaluationChange(idx, 'year', parseInt(e.target.value, 10))
                          }
                          disabled={isApprovedDBRecord}
                          required
                        />
                      </td>
                      <td>
                        <GlassSelect
                          value={ev.rank}
                          onChange={(val) => handleEvaluationChange(idx, 'rank', val)}
                          options={[
                            { id: "Xuất sắc", name: "Hoàn thành Xuất sắc" },
                            { id: "Tốt", name: "Hoàn thành Tốt" },
                            { id: "Hoàn thành", name: "Hoàn thành" },
                            { id: "Không hoàn thành", name: "Không Hoàn thành" }
                          ]}
                          showEmptyOption={false}
                          size="small"
                          disabled={isApprovedDBRecord}
                        />
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            ev.status === 'APPROVED'
                              ? 'badge-olive'
                              : ev.status === 'PENDING'
                              ? 'badge-gold'
                              : 'badge-danger'
                          }`}
                        >
                          {ev.status === 'APPROVED'
                            ? 'Đã duyệt'
                            : ev.status === 'PENDING'
                            ? 'Chờ duyệt'
                            : 'Nháp / Từ chối'}
                        </span>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-input form-input-sm"
                          placeholder="VD: 142/QĐ"
                          value={ev.soQuyetDinh || ''}
                          onChange={(e) => handleEvaluationChange(idx, 'soQuyetDinh', e.target.value)}
                          disabled={isApprovedDBRecord}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            const isApprovedOrPending = ev.status === 'APPROVED' || ev.status === 'PENDING';
                            if (isApprovedOrPending) {
                              if (window.confirm(`Xếp loại năm ${ev.year} đang ở trạng thái ${ev.status === 'APPROVED' ? 'Đã duyệt' : 'Chờ duyệt'}. Bạn có chắc chắn muốn xóa đánh giá này không?`)) {
                                handleRemoveEvaluation(idx);
                              }
                            } else {
                              handleRemoveEvaluation(idx);
                            }
                          }}
                          style={{
                            color: 'var(--color-error)',
                            borderColor: 'var(--color-error)',
                            padding: 'var(--spacing-xs) var(--spacing-sm)'
                          }}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {errors.evaluations && (
          <div style={{ color: 'var(--color-error)', fontSize: '9.5pt', marginBottom: 'var(--spacing-md)', fontWeight: 500 }}>
            ⚠️ {errors.evaluations}
          </div>
        )}
        
        <button type="button" className="btn btn-outline btn-sm" onClick={handleAddEvaluation}>
          Thêm xếp loại
        </button>
      </fieldset>
    </>
  );
}
