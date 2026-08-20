import React from 'react';

export default function WorkHistorySection({
  formData,
  handleAddEmployment,
  handleRemoveEmployment,
  handleEmploymentChange
}) {
  return (
    <fieldset className="form-fieldset">
      <legend>Tóm tắt quá trình hoạt động và công tác (Mục 23)</legend>
      <div className="table-container" style={{ marginBottom: 'var(--spacing-md)' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '20%' }}>Từ tháng/năm</th>
              <th style={{ width: '20%' }}>Đến tháng/năm</th>
              <th>Cấp bậc, chức vụ, đơn vị công tác</th>
              <th style={{ width: '10%' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {formData.employments.length === 0 ? (
              <tr>
                <td colSpan="4" className="center-text text-muted" style={{ padding: 'var(--spacing-md)' }}>
                  Chưa thêm quá trình công tác. Nhấn "Thêm quá trình hoạt động" để bắt đầu.
                </td>
              </tr>
            ) : (
              formData.employments.map((emp, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="month"
                      className="form-input form-input-sm"
                      value={emp.startDate}
                      onChange={(e) => handleEmploymentChange(idx, 'startDate', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="month"
                      className="form-input form-input-sm"
                      value={emp.endDate}
                      onChange={(e) => handleEmploymentChange(idx, 'endDate', e.target.value)}
                      placeholder="Hiện nay"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-input form-input-sm"
                      placeholder="Nhập cấp bậc, chức vụ, đơn vị..."
                      value={emp.capBacChucVuDonVi}
                      onChange={(e) => handleEmploymentChange(idx, 'capBacChucVuDonVi', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleRemoveEmployment(idx)}
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
              ))
            )}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn btn-outline btn-sm" onClick={handleAddEmployment}>
        Thêm quá trình hoạt động
      </button>
    </fieldset>
  );
}
