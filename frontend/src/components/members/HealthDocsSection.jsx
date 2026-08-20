import React from 'react';

export default function HealthDocsSection({ formData, handleChange }) {
  return (
    <fieldset className="form-fieldset">
      <legend>
        Sức khỏe, Giấy tờ & Miễn sinh hoạt (Mục 20-22)
      </legend>
      <div className="form-grid">
        {/* Nhóm mục 20 - tình trạng sức khỏe và các chế độ ưu tiên liên quan gia đình */}
        <div className="form-group">
          <label className="form-label" htmlFor="sucKhoe">
            <span className="section-number">20)</span> Tình trạng sức khỏe bản thân
          </label>
          <input
            id="sucKhoe"
            name="sucKhoe"
            type="text"
            className="form-input"
            placeholder="VD: Tốt, Khá..."
            value={formData.sucKhoe || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="thuongBinhLoai">
            Thương binh loại
          </label>
          <input
            id="thuongBinhLoai"
            name="thuongBinhLoai"
            type="text"
            className="form-input"
            placeholder="VD: 1/4, 2/4..."
            value={formData.thuongBinhLoai || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <div className="form-checkbox-group">
            <input
              id="giadinhLietSy"
              name="giadinhLietSy"
              type="checkbox"
              checked={formData.giadinhLietSy || false}
              onChange={handleChange}
            />
            <label htmlFor="giadinhLietSy">Gia đình liệt sỹ</label>
          </div>
        </div>
        <div className="form-group">
          <div className="form-checkbox-group">
            <input
              id="giadinhCoCong"
              name="giadinhCoCong"
              type="checkbox"
              checked={formData.giadinhCoCong || false}
              onChange={handleChange}
            />
            <label htmlFor="giadinhCoCong">Gia đình có công với cách mạng</label>
          </div>
        </div>

        {/* Mục 21 - các giấy tờ tùy thân, gồm CMND/CCCD và chứng minh thư Quân đội nếu có */}
        <div className="form-group">
          <label className="form-label" htmlFor="soCMND">
            <span className="section-number">21)</span> Số chứng minh nhân dân (hoặc thẻ CCCD)
          </label>
          <input
            id="soCMND"
            name="soCMND"
            type="text"
            className="form-input"
            placeholder="Nhập số CMND/CCCD"
            value={formData.soCMND || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="soCMTQD">
            Số chứng minh thư Quân đội (nếu có)
          </label>
          <input
            id="soCMTQD"
            name="soCMTQD"
            type="text"
            className="form-input"
            placeholder="Nhập số chứng minh thư Quân đội"
            value={formData.soCMTQD || ''}
            onChange={handleChange}
          />
        </div>

        {/* Mục 22 - thời điểm được miễn công tác, sinh hoạt Đảng (nếu thuộc diện này) */}
        <div className="form-group">
          <label className="form-label" htmlFor="ngayMienCongTac">
            <span className="section-number">22)</span> Được miễn công tác và sinh hoạt Đảng ngày
          </label>
          <input
            id="ngayMienCongTac"
            name="ngayMienCongTac"
            type="date"
            className="form-input"
            value={formData.ngayMienCongTac || ''}
            onChange={handleChange}
          />
        </div>
      </div>
    </fieldset>
  );
}
