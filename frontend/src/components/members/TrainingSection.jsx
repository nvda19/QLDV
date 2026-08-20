import React from 'react';
import toast from 'react-hot-toast';
import memberApi from '../../api/memberApi';
import GlassSelect from '../common/GlassSelect';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function TrainingSection({
  formData,
  handleAddTraining,
  handleRemoveTraining,
  handleTrainingChange,
  isEdit,
  id
}) {
  const { confirm } = useConfirm();
  return (
    <fieldset className="form-fieldset">
      <legend>Đào tạo, bồi dưỡng về chuyên môn, nghiệp vụ, lý luận chính trị, ngoại ngữ (Mục 24)</legend>
      <div className="table-container" style={{ marginBottom: 'var(--spacing-md)' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '20%' }}>Tên trường</th>
              <th style={{ width: '18%' }}>Ngành/Lớp học</th>
              <th style={{ width: '15%' }}>Từ tháng/năm</th>
              <th style={{ width: '15%' }}>Đến tháng/năm</th>
              <th style={{ width: '12%' }}>Hình thức</th>
              <th style={{ width: '12%' }}>Văn bằng/Chứng chỉ</th>
              <th style={{ width: '12%' }}>Tài liệu đính kèm</th>
              <th style={{ width: '8%' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {formData.trainings.length === 0 ? (
              <tr>
                <td colSpan="8" className="center-text text-muted" style={{ padding: 'var(--spacing-md)' }}>
                  Chưa thêm quá trình đào tạo. Nhấn "Thêm quá trình đào tạo" để bắt đầu.
                </td>
              </tr>
            ) : (
              formData.trainings.map((t, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="text"
                      className="form-input form-input-sm"
                      placeholder="Tên trường"
                      value={t.schoolName || ''}
                      onChange={(e) => handleTrainingChange(idx, 'schoolName', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-input form-input-sm"
                      placeholder="Ngành học"
                      value={t.courseName || ''}
                      onChange={(e) => handleTrainingChange(idx, 'courseName', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="month"
                      className="form-input form-input-sm"
                      value={t.fromDate || ''}
                      onChange={(e) => handleTrainingChange(idx, 'fromDate', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="month"
                      className="form-input form-input-sm"
                      value={t.toDate || ''}
                      onChange={(e) => handleTrainingChange(idx, 'toDate', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <GlassSelect
                      value={t.type || 'Chính quy'}
                      onChange={(val) => handleTrainingChange(idx, 'type', val)}
                      options={[
                        { id: 'Chính quy', name: 'Chính quy' },
                        { id: 'Vừa làm vừa học', name: 'Vừa làm vừa học' },
                        { id: 'Từ xa', name: 'Từ xa' },
                        { id: 'Khác', name: 'Khác' }
                      ]}
                      showEmptyOption={false}
                      size="small"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-input form-input-sm"
                      placeholder="VD: Cử nhân"
                      value={t.certificate || ''}
                      onChange={(e) => handleTrainingChange(idx, 'certificate', e.target.value)}
                    />
                  </td>
                  <td>
                    {isEdit && id ? (
                      t.taiLieuUrl ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                          <span
                            className="text-accent"
                            style={{
                              fontSize: '7.5pt',
                              maxWidth: '75px',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap'
                            }}
                            title={t.taiLieuName}
                          >
                            {t.taiLieuName || 'Đã đính kèm'}
                          </span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <a
                              href={t.taiLieuUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline btn-xs"
                              style={{ fontSize: '7pt', padding: '1px 4px' }}
                            >
                              Xem
                            </a>
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              onClick={async () => {
                                const isConfirmed = await confirm({
                                  title: "Xóa tệp scan",
                                  message: "Đồng chí chắc chắn muốn xóa tệp scan?",
                                  confirmText: "Xóa",
                                  variant: "danger",
                                });
                                if (isConfirmed) {
                                  handleTrainingChange(idx, 'taiLieuUrl', '');
                                  handleTrainingChange(idx, 'taiLieuName', '');
                                  toast.success("Đã xóa file tạm thời, hãy nhấn Cập nhật để áp dụng.");
                                }
                              }}
                              style={{
                                fontSize: '7pt',
                                color: 'var(--color-error)',
                                borderColor: 'var(--color-error)',
                                padding: '1px 3px'
                              }}
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="btn btn-outline btn-xs" style={{ cursor: 'pointer', fontSize: '7.5pt', padding: '2px 4px' }}>
                          Tải lên
                          <input
                            type="file"
                            style={{ display: 'none' }}
                            accept=".pdf,image/*"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const formDataUpload = new FormData();
                                formDataUpload.append("file", file);
                                toast.loading("Đang tải lên...", { id: `upload-tr-${idx}` });
                                try {
                                  const res = await memberApi.uploadAttachment(id, formDataUpload);
                                  handleTrainingChange(idx, 'taiLieuUrl', res.data?.fileUrl);
                                  handleTrainingChange(idx, 'taiLieuName', res.data?.name || file.name);
                                  toast.success("Tải lên thành công.", { id: `upload-tr-${idx}` });
                                } catch {
                                  toast.error("Tải lên thất bại.", { id: `upload-tr-${idx}` });
                                }
                              }
                            }}
                          />
                        </label>
                      )
                    ) : (
                      <span className="text-muted" style={{ fontSize: '7.5pt' }}>Lưu trước</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleRemoveTraining(idx)}
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
      <button type="button" className="btn btn-outline btn-sm" onClick={handleAddTraining}>
        Thêm quá trình đào tạo
      </button>
    </fieldset>
  );
}
