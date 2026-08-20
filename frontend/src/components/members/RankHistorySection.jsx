import React from 'react';
import toast from 'react-hot-toast';
import { STANDARD_RANKS } from '../../utils/constants';
import memberApi from '../../api/memberApi';
import GlassSelect from '../common/GlassSelect';

export default function RankHistorySection({
  formData,
  handleAddRankHistory,
  handleRemoveRankHistory,
  handleRankHistoryChange,
  isEdit,
  id
}) {
  return (
    <fieldset className="form-fieldset">
      <legend>Lịch sử phong, thăng quân hàm (Mục 30)</legend>
      <div className="table-container" style={{ marginBottom: 'var(--spacing-md)', position: 'relative', zIndex: 3 }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '20%' }}>Cấp bậc</th>
              <th style={{ width: '20%' }}>Chức vụ lúc thăng</th>
              <th style={{ width: '25%' }}>Đơn vị</th>
              <th style={{ width: '15%' }}>Ngày hiệu lực</th>
              <th style={{ width: '15%' }}>Số quyết định</th>
              <th style={{ width: '5%' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {formData.rankHistories.length === 0 ? (
              <tr>
                <td colSpan="6" className="center-text text-muted" style={{ padding: 'var(--spacing-md)' }}>
                  Chưa có lịch sử quân hàm. Nhấn "Thêm quân hàm" để bắt đầu.
                </td>
              </tr>
            ) : (
              formData.rankHistories.map((rh, idx) => (
                <tr key={idx}>
                  <td>
                    <GlassSelect
                      value={rh.rank}
                      onChange={(val) => handleRankHistoryChange(idx, 'rank', val)}
                      options={STANDARD_RANKS}
                      placeholder="Cấp bậc"
                      size="small"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-input form-input-sm"
                      placeholder="Chức vụ"
                      value={rh.chucVu}
                      onChange={(e) => handleRankHistoryChange(idx, 'chucVu', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-input form-input-sm"
                      placeholder="Đơn vị"
                      value={rh.unit}
                      onChange={(e) => handleRankHistoryChange(idx, 'unit', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      className="form-input form-input-sm"
                      value={rh.effectiveDate}
                      onChange={(e) => handleRankHistoryChange(idx, 'effectiveDate', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-input form-input-sm"
                      placeholder="VD: 142/QĐ"
                      value={rh.decisionNumber}
                      onChange={(e) => handleRankHistoryChange(idx, 'decisionNumber', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleRemoveRankHistory(idx)}
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
      <button type="button" className="btn btn-outline btn-sm" onClick={handleAddRankHistory}>
        Thêm quân hàm
      </button>
    </fieldset>
  );
}
