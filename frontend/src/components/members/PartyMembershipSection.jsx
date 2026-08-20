import React from 'react';
import { PARTY_POSITIONS } from '../../utils/constants';
import GlassSelect from '../common/GlassSelect';

export default function PartyMembershipSection({ formData, handleChange, errors }) {
  return (
    <fieldset className="form-fieldset">
      <legend>
        Thông tin vào Đảng & Sinh hoạt hiện nay (Mục 13-14)
      </legend>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="ngayVaoDang">
            <span className="section-number">13)</span> Ngày vào Đảng (dự bị)
          </label>
          <input
            id="ngayVaoDang"
            name="ngayVaoDang"
            type="date"
            className="form-input"
            value={formData.ngayVaoDang || ''}
            onChange={handleChange}
          />
          {errors?.ngayVaoDang && <div className="form-error">{errors.ngayVaoDang}</div>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="chiBoVaoDang">
            Tại Chi bộ
          </label>
          <input
            id="chiBoVaoDang"
            name="chiBoVaoDang"
            type="text"
            className="form-input"
            placeholder="Nhập chi bộ vào Đảng"
            value={formData.chiBoVaoDang || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="nguoiGioiThieu1">
            Người giới thiệu thứ 1 (Họ tên)
          </label>
          <input
            id="nguoiGioiThieu1"
            name="nguoiGioiThieu1"
            type="text"
            className="form-input"
            placeholder="Họ tên người giới thiệu 1"
            value={formData.nguoiGioiThieu1 || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="chucVuNGT1">
            Cấp bậc, chức vụ, đơn vị (lúc đó) của NGT 1
          </label>
          <input
            id="chucVuNGT1"
            name="chucVuNGT1"
            type="text"
            className="form-input"
            placeholder="Cấp bậc, chức vụ, đơn vị NGT 1"
            value={formData.chucVuNGT1 || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="nguoiGioiThieu2">
            Người giới thiệu thứ 2 (Họ tên)
          </label>
          <input
            id="nguoiGioiThieu2"
            name="nguoiGioiThieu2"
            type="text"
            className="form-input"
            placeholder="Họ tên người giới thiệu 2"
            value={formData.nguoiGioiThieu2 || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="chucVuNGT2">
            Cấp bậc, chức vụ, đơn vị (lúc đó) của NGT 2
          </label>
          <input
            id="chucVuNGT2"
            name="chucVuNGT2"
            type="text"
            className="form-input"
            placeholder="Cấp bậc, chức vụ, đơn vị NGT 2"
            value={formData.chucVuNGT2 || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ngayQuyetDinhKetNap">
            Ngày quyết định kết nạp
          </label>
          <input
            id="ngayQuyetDinhKetNap"
            name="ngayQuyetDinhKetNap"
            type="date"
            className="form-input"
            value={formData.ngayQuyetDinhKetNap || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ngayChinhThuc">
            Ngày chính thức
          </label>
          <input
            id="ngayChinhThuc"
            name="ngayChinhThuc"
            type="date"
            className="form-input"
            value={formData.ngayChinhThuc || ''}
            onChange={handleChange}
          />
          {errors?.ngayChinhThuc && <div className="form-error">{errors.ngayChinhThuc}</div>}
        </div>
        <div className="form-group form-full">
          <label className="form-label" htmlFor="chiBoChinhThuc">
            Tại Chi bộ chính thức
          </label>
          <input
            id="chiBoChinhThuc"
            name="chiBoChinhThuc"
            type="text"
            className="form-input"
            placeholder="Nhập chi bộ chính thức"
            value={formData.chiBoChinhThuc || ''}
            onChange={handleChange}
          />
        </div>

        {/* Từ đây trở xuống là nhóm mục 14, ghi nhận nơi sinh hoạt và chức vụ Đảng hiện tại */}
        <div className="form-group">
          <label className="form-label" htmlFor="noiSinhHoatDang">
            <span className="section-number">14)</span> Nơi sinh hoạt Đảng hiện nay
          </label>
          <input
            id="noiSinhHoatDang"
            name="noiSinhHoatDang"
            type="text"
            className="form-input"
            placeholder="Nhập nơi sinh hoạt Đảng hiện nay"
            value={formData.noiSinhHoatDang || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="chucVuDang">
            Chức vụ Đảng
          </label>
          <GlassSelect
            value={formData.chucVuDang || ''}
            onChange={(val) => handleChange({ target: { name: 'chucVuDang', value: val } })}
            options={PARTY_POSITIONS}
            placeholder="Không có / Đảng viên thường"
          />
        </div>
      </div>
    </fieldset>
  );
}
