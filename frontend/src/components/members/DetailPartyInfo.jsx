import React from 'react';
import { formatDate } from '../../utils/helpers';

const showVal = (val) => {
  if (val === 0 || val === '0') return '0';
  if (val === false) return 'Không';
  if (!val || String(val).trim() === '' || val === '—') return '.......';
  return val;
};

export default function DetailPartyInfo({ member }) {
  return (
    <>
      <div className="print-paper-fields">
        <div className="field-block">
          <div className="field-row">
            <span className="field-number">13)</span> Ngày vào Đảng:{" "}
            <span className="underline-text">
              {showVal(formatDate(member.NgayVaoDang))}
            </span>
          </div>
          <div className="field-row" style={{ paddingLeft: "32px" }}>
            Tại Chi bộ:{" "}
            <span className="underline-text">
              {showVal(member.ChiBoVaoDang)}
            </span>
          </div>
          <div
            style={{
              paddingLeft: "32px",
              marginTop: "4px",
              lineHeight: "1.6",
            }}
          >
            Người giới thiệu thứ 1:{" "}
            <span className="underline-text">
              {showVal(member.NguoiGioiThieu1)}
            </span>
            <br />
            Cấp bậc, Chức vụ, đơn vị:{" "}
            <span className="underline-text">
              {showVal(member.ChucVuNGT1)}
            </span>
            <br />
            Người giới thiệu thứ 2:{" "}
            <span className="underline-text">
              {showVal(member.NguoiGioiThieu2)}
            </span>
            <br />
            Cấp bậc, Chức vụ, đơn vị:{" "}
            <span className="underline-text">
              {showVal(member.ChucVuNGT2)}
            </span>
            <br />
            <div className="field-row">
              Ngày chính thức:{" "}
              <span className="underline-text">
                {showVal(formatDate(member.NgayChinhThuc))}
              </span>
            </div>
            <div className="field-row">
              Tại Chi bộ:{" "}
              <span className="underline-text">
                {showVal(member.ChiBoChinhThuc)}
              </span>
            </div>
          </div>
        </div>

        <div className="field-row">
          <span className="field-number">14)</span> Nơi sinh hoạt Đảng hiện nay:{" "}
          <span className="underline-text">
            {showVal(member.NoiSinhHoatDang)}
          </span>
        </div>
        <div className="field-row" style={{ paddingLeft: "32px" }}>
          Chức vụ Đảng:{" "}
          <span className="underline-text">
            {showVal(member.ChucVuDang)}
          </span>
        </div>
        <div className="field-row">
          <span className="field-number">15)</span> Ngày được tuyển dụng làm cán bộ, công chức:{" "}
          <span className="underline-text">
            {showVal(formatDate(member.NgayTuyenDung))}
          </span>
        </div>
        <div className="field-row" style={{ paddingLeft: "32px" }}>
          Cơ quan tuyển dụng:{" "}
          <span className="underline-text">
            {showVal(member.CoQuanTuyenDung)}
          </span>
        </div>
        <div className="field-row">
          <span className="field-number">16)</span> Ngày vào Đoàn TNCS Hồ Chí Minh:{" "}
          <span className="underline-text">
            {showVal(formatDate(member.NgayVaoDoan))}
          </span>
        </div>
        <div className="field-row">
          <span className="field-number">17)</span> Tham gia các tổ chức xã hội khác:{" "}
          <span className="underline-text">
            {showVal(member.ToChucXaHoi)}
          </span>
        </div>
        <div className="field-row">
          <span className="field-number">18)</span> Ngày nhập ngũ:{" "}
          <span className="underline-text">
            {showVal(formatDate(member.NgayNhapNgu))}
          </span>
        </div>
        <div className="field-row" style={{ paddingLeft: "32px" }}>
          Ngày xuất ngũ, chuyển ngành:{" "}
          <span className="underline-text">
            {showVal(formatDate(member.NgayXuatNgu))}
          </span>
        </div>
        <div className="field-row" style={{ paddingLeft: "32px" }}>
          Ngày tái ngũ:{" "}
          <span className="underline-text">
            {showVal(formatDate(member.NgayTaiNgu))}
          </span>
        </div>

        <div className="field-block">
          <span className="field-number">19)</span> Trình độ học vấn:
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4px 20px",
              paddingLeft: "32px",
              marginTop: "4px",
            }}
          >
            <div>
              - Giáo dục phổ thông:{" "}
              <span className="underline-text">
                {showVal(member.GiaoDucPhoThong)}
              </span>
            </div>
            <div>
              - Chuyên môn nghiệp vụ:{" "}
              <span className="underline-text">
                {showVal(member.GiaoDucNgheNghiep)}
              </span>
            </div>
            <div>
              - Lý luận chính trị:{" "}
              <span className="underline-text">
                {showVal(member.LyLuanChinhTri)}
              </span>
            </div>
            <div>
              - Ngoại ngữ:{" "}
              <span className="underline-text">
                {showVal(member.NgoaiNgu)}
              </span>
            </div>
            <div>
              - Học vị:{" "}
              <span className="underline-text">
                {showVal(member.HocVi)}
              </span>
            </div>
            <div>
              - Học hàm:{" "}
              <span className="underline-text">
                {showVal(member.HocHam)}
              </span>
            </div>
          </div>
        </div>

        {/* Nhóm mục 20-22: sức khỏe, số CMND/CMTQĐ và diện được miễn công tác, sinh hoạt Đảng */}
        <div className="field-row-2col" style={{ marginTop: "10px" }}>
          <div>
            <span className="field-number">20)</span> Tình trạng sức khỏe bản thân:{" "}
            <span className="underline-text">
              {showVal(member.TinhTrangSucKhoe)}
            </span>
          </div>
          <div>
            Thương binh loại:{" "}
            <span className="underline-text">
              {showVal(member.ThuongBinhLoai)}
            </span>
          </div>
        </div>
        <div className="field-row" style={{ paddingLeft: "32px" }}>
          Gia đình liệt sỹ:{" "}
          <span
            className="font-bold"
            style={{ fontFamily: "inherit", marginRight: "30px" }}
          >
            {member.GiaDinhLietSy ? "☑" : "☐"}
          </span>
          Gia đình có công với CM:{" "}
          <span className="font-bold" style={{ fontFamily: "inherit" }}>
            {member.GiaDinhCoCong ? "☑" : "☐"}
          </span>
        </div>
        <div className="field-row-2col">
          <div>
            <span className="field-number">21)</span> Số chứng minh ND (CCCD):{" "}
            <span className="underline-text">
              {showVal(member.SoCMND)}
            </span>
          </div>
          <div>
            Số CMTQĐ:{" "}
            <span className="underline-text">
              {showVal(member.SoCMTQD)}
            </span>
          </div>
        </div>
        <div className="field-row">
          <span className="field-number">22)</span> Được miễn công tác và SHĐ ngày:{" "}
          <span className="underline-text">
            {showVal(formatDate(member.NgayMienCongTac))}
          </span>
        </div>
      </div>
    </>
  );
}
