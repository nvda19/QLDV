import React from 'react';
import { GENDER_OPTIONS, STANDARD_RANKS } from '../../utils/constants';
import GlassSelect from '../common/GlassSelect';

export default function PersonalInfoSection({ formData, handleChange, errors }) {
  return (
    <fieldset className="form-fieldset">
      <legend>
        Thông tin lý lịch & Cơ bản (Mục 01-12)
      </legend>
      
      {/* Hàng đầu: số lý lịch, số thẻ Đảng viên và trạng thái sinh hoạt hiện tại */}
      <div className="form-grid" style={{ borderBottom: '1px dashed var(--color-border)', paddingBottom: '15px', marginBottom: '15px' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="soLyLich">Số lý lịch</label>
          <input
            id="soLyLich"
            name="soLyLich"
            type="text"
            className="form-input"
            placeholder="Nhập số lý lịch"
            value={formData.soLyLich || ''}
            onChange={handleChange}
          />
          {errors.soLyLich && <div className="form-error">{errors.soLyLich}</div>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="soTheDangVien">Số thẻ Đảng viên</label>
          <input
            id="soTheDangVien"
            name="soTheDangVien"
            type="text"
            className="form-input"
            placeholder="Nhập số thẻ Đảng viên"
            value={formData.soTheDangVien || ''}
            onChange={handleChange}
          />
          {errors.soTheDangVien && <div className="form-error">{errors.soTheDangVien}</div>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="trangThai">Trạng thái hoạt động</label>
          <GlassSelect
            value={formData.trangThai || 'HOAT_DONG'}
            onChange={(val) => handleChange({ target: { name: 'trangThai', value: val } })}
            options={[
              { id: 'HOAT_DONG', name: 'Đang sinh hoạt (HOẠT ĐỘNG)' },
              { id: 'MIEN_SINH_HOAT', name: 'Miễn sinh hoạt dã ngoại/miễn công tác' },
              { id: 'QUA_DOI', name: 'Đã qua đời' },
              { id: 'RA_DANG', name: 'Đã ra khỏi Đảng' }
            ]}
            showEmptyOption={false}
          />
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="birthName">
            <span className="section-number">01)</span> Họ và tên khai sinh (viết chữ in hoa) *
          </label>
          <input
            id="birthName"
            name="birthName"
            type="text"
            className="form-input"
            placeholder="Nhập họ và tên khai sinh"
            value={formData.birthName || ''}
            onChange={handleChange}
          />
          {errors.birthName && <div className="form-error">{errors.birthName}</div>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="gender">
            <span className="section-number">02)</span> Nam, nữ *
          </label>
          <GlassSelect
            value={formData.gender || ''}
            onChange={(val) => handleChange({ target: { name: 'gender', value: val } })}
            options={GENDER_OPTIONS}
            placeholder="Chọn giới tính"
          />
          {errors.gender && <div className="form-error">{errors.gender}</div>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="fullName">
            <span className="section-number">03)</span> Họ và tên đang dùng *
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            className="form-input"
            placeholder="Nhập họ và tên đang dùng"
            value={formData.fullName || ''}
            onChange={handleChange}
          />
          {errors.fullName && <div className="form-error">{errors.fullName}</div>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="dob">
            <span className="section-number">04)</span> Sinh ngày <span className="required-mark">*</span>
          </label>
          <input
            id="dob"
            name="dob"
            type="date"
            className="form-input"
            value={formData.dob || ''}
            onChange={handleChange}
          />
          {errors.dob && <div className="form-error">{errors.dob}</div>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="placeOfBirth">
            <span className="section-number">05)</span> Nơi sinh
          </label>
          <input
            id="placeOfBirth"
            name="placeOfBirth"
            type="text"
            className="form-input"
            placeholder="Nhập nơi sinh"
            value={formData.placeOfBirth || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="hometown">
            <span className="section-number">06)</span> Quê quán
          </label>
          <input
            id="hometown"
            name="hometown"
            type="text"
            className="form-input"
            placeholder="Nhập quê quán"
            value={formData.hometown || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="residence">
            <span className="section-number">07)</span> Nơi đăng ký hộ khẩu thường trú
          </label>
          <input
            id="residence"
            name="residence"
            type="text"
            className="form-input"
            placeholder="Nhập nơi đăng ký HK thường trú"
            value={formData.residence || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="temporaryResidence">
            <span className="section-number">07)</span> Nơi tạm trú hiện nay
          </label>
          <input
            id="temporaryResidence"
            name="temporaryResidence"
            type="text"
            className="form-input"
            placeholder="Nhập nơi tạm trú hiện nay"
            value={formData.temporaryResidence || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ethnic">
            <span className="section-number">08)</span> Dân tộc
          </label>
          <input
            id="ethnic"
            name="ethnic"
            type="text"
            className="form-input"
            placeholder="Nhập dân tộc"
            value={formData.ethnic || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="religion">
            <span className="section-number">09)</span> Tôn giáo
          </label>
          <input
            id="religion"
            name="religion"
            type="text"
            className="form-input"
            placeholder="Nhập tôn giáo"
            value={formData.religion || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="familyBackground">
            <span className="section-number">10)</span> Thành phần gia đình xuất thân
          </label>
          <input
            id="familyBackground"
            name="familyBackground"
            type="text"
            className="form-input"
            placeholder="Nhập thành phần gia đình"
            value={formData.familyBackground || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ngheNghiepKhiVaoDang">
            <span className="section-number">11)</span> Nghề nghiệp của bản thân khi vào Đảng
          </label>
          <input
            id="ngheNghiepKhiVaoDang"
            name="ngheNghiepKhiVaoDang"
            type="text"
            className="form-input"
            placeholder="Nhập nghề nghiệp khi vào Đảng"
            value={formData.ngheNghiepKhiVaoDang || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="occupation">
            Nghề nghiệp hiện nay
          </label>
          <input
            id="occupation"
            name="occupation"
            type="text"
            className="form-input"
            placeholder="Nhập nghề nghiệp hiện nay"
            value={formData.occupation || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="rank">
            <span className="section-number">12)</span> Cấp bậc (quân hàm, ngạch, chức vụ...)
          </label>
          <GlassSelect
            value={formData.rank || ''}
            onChange={(val) => handleChange({ target: { name: 'rank', value: val } })}
            options={STANDARD_RANKS}
            placeholder="Chọn cấp bậc"
          />
        </div>
        <div className="form-group form-full">
          <label className="form-label" htmlFor="congViecChinhDangLam">
            <span className="section-number">12)</span> Công việc chính đang làm
          </label>
          <input
            id="congViecChinhDangLam"
            name="congViecChinhDangLam"
            type="text"
            className="form-input"
            placeholder="Nhập công việc chính đang làm"
            value={formData.congViecChinhDangLam || ''}
            onChange={handleChange}
          />
        </div>
      </div>
    </fieldset>
  );
}
