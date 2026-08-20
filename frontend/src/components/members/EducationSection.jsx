import React from 'react';

export default function EducationSection({ formData, handleChange }) {
  return (
    <fieldset className="form-fieldset">
      <legend>
        Trình độ học vấn & Chuyên môn (Mục 19)
      </legend>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="trinhDoGDPT">
            <span className="section-number">19)</span> Giáo dục phổ thông (VD: 12/12)
          </label>
          <input
            id="trinhDoGDPT"
            name="trinhDoGDPT"
            type="text"
            className="form-input"
            placeholder="VD: 12/12"
            value={formData.trinhDoGDPT || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="trinhDoGDNN">
            Chuyên môn nghiệp vụ
          </label>
          <input
            id="trinhDoGDNN"
            name="trinhDoGDNN"
            type="text"
            className="form-input"
            placeholder="VD: Cử nhân, Kỹ sư, Trung cấp..."
            value={formData.trinhDoGDNN || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="trinhDoDHSauDH">
            Giáo dục đại học và sau đại học
          </label>
          <input
            id="trinhDoDHSauDH"
            name="trinhDoDHSauDH"
            type="text"
            className="form-input"
            placeholder="VD: Cử nhân, Thạc sĩ..."
            value={formData.trinhDoDHSauDH || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="hocVi">
            Học vị
          </label>
          <input
            id="hocVi"
            name="hocVi"
            type="text"
            className="form-input"
            placeholder="VD: Tiến sĩ"
            value={formData.hocVi || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="hocHam">
            Học hàm
          </label>
          <input
            id="hocHam"
            name="hocHam"
            type="text"
            className="form-input"
            placeholder="VD: Phó Giáo sư"
            value={formData.hocHam || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="lyLuanChinhTri">
            Lý luận chính trị
          </label>
          <input
            id="lyLuanChinhTri"
            name="lyLuanChinhTri"
            type="text"
            className="form-input"
            placeholder="VD: Sơ cấp, Trung cấp, Cao cấp"
            value={formData.lyLuanChinhTri || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ngoaiNgu">
            Ngoại ngữ
          </label>
          <input
            id="ngoaiNgu"
            name="ngoaiNgu"
            type="text"
            className="form-input"
            placeholder="VD: Tiếng Anh B2"
            value={formData.ngoaiNgu || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="tinHoc">
            Tin học
          </label>
          <input
            id="tinHoc"
            name="tinHoc"
            type="text"
            className="form-input"
            placeholder="VD: IC3, MOS..."
            value={formData.tinHoc || ''}
            onChange={handleChange}
          />
        </div>
      </div>
    </fieldset>
  );
}
