import React from 'react';

export default function MilitarySection({ formData, handleChange, errors }) {
  return (
    <fieldset className="form-fieldset">
      <legend>
        Tuyển dụng, Đoàn & Quân ngũ (Mục 15-18)
      </legend>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="ngayTuyenDung">
            <span className="section-number">15)</span> Ngày được tuyển dụng làm cán bộ, công chức, viên chức
          </label>
          <input
            id="ngayTuyenDung"
            name="ngayTuyenDung"
            type="date"
            className="form-input"
            value={formData.ngayTuyenDung || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="coQuanTuyenDung">
            Cơ quan tuyển dụng
          </label>
          <input
            id="coQuanTuyenDung"
            name="coQuanTuyenDung"
            type="text"
            className="form-input"
            placeholder="Nhập cơ quan tuyển dụng"
            value={formData.coQuanTuyenDung || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ngayVaoDoan">
            <span className="section-number">16)</span> Ngày vào Đoàn TNCS Hồ Chí Minh
          </label>
          <input
            id="ngayVaoDoan"
            name="ngayVaoDoan"
            type="date"
            className="form-input"
            value={formData.ngayVaoDoan || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="toChucXaHoi">
            <span className="section-number">17)</span> Tham gia các tổ chức xã hội khác
          </label>
          <input
            id="toChucXaHoi"
            name="toChucXaHoi"
            type="text"
            className="form-input"
            placeholder="Nhập tổ chức xã hội tham gia"
            value={formData.toChucXaHoi || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ngayNhapNgu">
            <span className="section-number">18)</span> Ngày nhập ngũ
          </label>
          <input
            id="ngayNhapNgu"
            name="ngayNhapNgu"
            type="date"
            className="form-input"
            value={formData.ngayNhapNgu || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ngayXuatNgu">
            Ngày xuất ngũ, chuyển ngành
          </label>
          <input
            id="ngayXuatNgu"
            name="ngayXuatNgu"
            type="date"
            className="form-input"
            value={formData.ngayXuatNgu || ''}
            onChange={handleChange}
          />
          {errors?.ngayXuatNgu && <div className="form-error">{errors.ngayXuatNgu}</div>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ngayTaiNgu">
            Ngày tái ngũ
          </label>
          <input
            id="ngayTaiNgu"
            name="ngayTaiNgu"
            type="date"
            className="form-input"
            value={formData.ngayTaiNgu || ''}
            onChange={handleChange}
          />
        </div>
      </div>
    </fieldset>
  );
}
