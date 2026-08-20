import React from 'react';
import { formatDate } from '../../utils/helpers';

const showVal = (val) => {
  if (val === 0 || val === '0') return '0';
  if (val === false) return 'Không';
  if (!val || String(val).trim() === '' || val === '—') return '.......';
  return val;
};

export default function DetailPersonalInfo({ member }) {
  return (
    <>
      <div className="print-paper-fields">
        <div className="field-row-2col">
          <div>
            <span className="field-number">01)</span> Họ và tên khai sinh:{" "}
            <span className="underline-text font-bold uppercase">
              {showVal(member.HoTenKhaiSinh || member.HoTenDangDung)}
            </span>
          </div>
          <div>
            <span className="field-number">02)</span> Nam, nữ:{" "}
            <span className="underline-text">{showVal(member.GioiTinh)}</span>
          </div>
        </div>
        <div className="field-row-2col">
          <div>
            <span className="field-number">03)</span> Họ và tên đang dùng:{" "}
            <span className="underline-text font-bold">
              {showVal(member.HoTenDangDung)}
            </span>
          </div>
          <div>
            <span className="field-number">04)</span> Sinh ngày:{" "}
            <span className="underline-text">{showVal(formatDate(member.NgaySinh))}</span>
          </div>
        </div>
        <div className="field-row">
          <span className="field-number">05)</span> Nơi sinh:{" "}
          <span className="underline-text">{showVal(member.NoiSinh)}</span>
        </div>
        <div className="field-row">
          <span className="field-number">06)</span> Quê quán:{" "}
          <span className="underline-text">{showVal(member.QueQuan)}</span>
        </div>
        <div className="field-row">
          <span className="field-number">07)</span> Nơi đăng ký hộ khẩu thường trú:{" "}
          <span className="underline-text">{showVal(member.NoiThuongTru)}</span>
        </div>
        <div className="field-row" style={{ paddingLeft: "32px" }}>
          Nơi tạm trú hiện nay:{" "}
          <span className="underline-text">{showVal(member.NoiTamTru)}</span>
        </div>
        <div className="field-row-2col">
          <div>
            <span className="field-number">08)</span> Dân tộc:{" "}
            <span className="underline-text">{showVal(member.DanToc)}</span>
          </div>
          <div>
            <span className="field-number">09)</span> Tôn giáo:{" "}
            <span className="underline-text">{showVal(member.TonGiao)}</span>
          </div>
        </div>
        <div className="field-row">
          <span className="field-number">10)</span> Thành phần gia đình:{" "}
          <span className="underline-text">{showVal(member.ThanhPhanGiaDinh)}</span>
        </div>
        <div className="field-row">
          <span className="field-number">11)</span> Nghề nghiệp của bản thân khi vào Đảng:{" "}
          <span className="underline-text">{showVal(member.NgheNghiepKhiVaoDang)}</span>
        </div>
        <div className="field-row">
          <span className="field-number">12)</span> Cấp bậc:{" "}
          <span className="underline-text">{showVal(member.CapBac)}</span>
        </div>
        <div className="field-row" style={{ paddingLeft: "32px" }}>
          Công việc chính đang làm:{" "}
          <span className="underline-text">{showVal(member.CongViecChinh)}</span>
        </div>
      </div>
    </>
  );
}
