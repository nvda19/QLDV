import React from 'react';
import { formatDate } from '../../utils/helpers';

const showVal = (val) => {
  if (val === 0 || val === '0') return '0';
  if (val === false) return 'Không';
  if (!val || String(val).trim() === '' || val === '—') return '.......';
  return val;
};

export default function DetailFamilyTable({ member }) {
  return (
    <>
      {/* Mục 31 - đặc điểm lịch sử bản thân đảng viên */}
      <div className="print-section-title" style={{ marginTop: "20px" }}>
        <span className="field-number">31)</span> ĐẶC ĐIỂM LỊCH SỬ BẢN THÂN
      </div>
      <div
        style={{
          paddingLeft: "32px",
          marginTop: "4px",
          lineHeight: "1.6",
        }}
      >
        <div>
          a) Được kết nạp lại vào Đảng:
          <div style={{ paddingLeft: "20px", marginTop: "4px" }}>
            <div>
              - Ngày vào Đảng lần thứ 2:{" "}
              <span className="underline-text">
                {showVal(formatDate(member.LichSuBanThan?.ngayVaoDang2))}
              </span>
            </div>
            <div style={{ paddingLeft: "10px" }}>
              Tại chi bộ:{" "}
              <span className="underline-text">
                {showVal(member.LichSuBanThan?.chiBoVaoDang2)}
              </span>
            </div>
            Người giới thiệu 1:{" "}
            <span className="underline-text">
              {showVal(member.LichSuBanThan?.nguoiGioiThieu1_2)}
            </span>
            <br />
            Cấp bậc, chức vụ, đơn vị:{" "}
            <span className="underline-text">
              {showVal(member.LichSuBanThan?.chucVuNGT1_2)}
            </span>
            <br />
            Người giới thiệu 2:{" "}
            <span className="underline-text">
              {showVal(member.LichSuBanThan?.nguoiGioiThieu2_2)}
            </span>
            <br />
            Cấp bậc, chức vụ, đơn vị:{" "}
            <span className="underline-text">
              {showVal(member.LichSuBanThan?.chucVuNGT2_2)}
            </span>
            <br />
            <div>
              - Ngày chính thức lần thứ 2:{" "}
              <span className="underline-text">
                {showVal(formatDate(member.LichSuBanThan?.ngayChinhThuc2))}
              </span>
            </div>
            <div style={{ paddingLeft: "10px" }}>
              Tại chi bộ:{" "}
              <span className="underline-text">
                {showVal(member.LichSuBanThan?.chiBoChinhThuc2)}
              </span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: "6px" }}>
          b) Ngày được khôi phục đảng tịch:{" "}
          <span className="underline-text">
            {showVal(formatDate(member.LichSuBanThan?.ngayKhoiPhuc))}
          </span>
          <br />
          Tại chi bộ:{" "}
          <span className="underline-text">
            {showVal(member.LichSuBanThan?.chiBoKhoiPhuc)}
          </span>
        </div>
        <div style={{ marginTop: "6px" }}>
          c) Bị bắt, bị tù{" "}
          <span style={{ fontStyle: "italic" }}>
            (ngày, tháng, năm; chính quyền nào xử lý; hình thức xử lý, nơi thi hành án)
          </span>
          :{" "}
          <span className="underline-text">
            {showVal(member.LichSuBanThan?.xuLyPhapLuat)}
          </span>
        </div>
        <div style={{ marginTop: "6px" }}>
          d) Bản thân có làm việc trong chế độ cũ{" "}
          <span style={{ fontStyle: "italic" }}>
            (ngày, tháng, năm; chức vụ; nơi làm việc)
          </span>
          :{" "}
          <span className="underline-text">
            {showVal(member.LichSuBanThan?.cheDocU)}
          </span>
        </div>
      </div>

      {/* Mục 32 - thông tin quan hệ với nước ngoài của bản thân */}
      <div className="print-section-title">
        <span className="field-number">32)</span> QUAN HỆ VỚI NƯỚC NGOÀI
      </div>
      <div
        style={{
          paddingLeft: "32px",
          marginTop: "4px",
          lineHeight: "1.6",
        }}
      >
        <div>
          a) Đã đi nước ngoài{" "}
          <span style={{ fontStyle: "italic" }}>
            (nước nào, lý do, thời gian ra nước ngoài...)
          </span>
          :{" "}
          <span className="underline-text">
            {showVal(member.QuanHeNuocNgoai?.foreignTravel)}
          </span>
        </div>
        <div style={{ marginTop: "4px" }}>
          b) Tham gia hoặc có quan hệ với các tổ chức chính trị, kinh tế, xã hội nào ở nước ngoài:{" "}
          <span className="underline-text">
            {showVal(member.QuanHeNuocNgoai?.foreignOrgs)}
          </span>
        </div>
        <div style={{ marginTop: "4px" }}>
          c) Có người thân ở nước ngoài{" "}
          <span style={{ fontStyle: "italic" }}>
            (tên người, quan hệ gì, ở nước nào ?)
          </span>
          :{" "}
          <span className="underline-text">
            {showVal(member.QuanHeNuocNgoai?.foreignRelatives)}
          </span>
        </div>
      </div>

      {/* Mục 33 - bảng kê quan hệ gia đình */}
      <div className="print-section-title">
        <span className="field-number">33)</span> QUAN HỆ GIA ĐÌNH
      </div>
      <div
        style={{
          fontStyle: "italic",
          marginBottom: "8px",
        }}
      >
        (Cha, mẹ đẻ; cha, mẹ vợ (chồng); vợ (chồng); các con; anh chị em ruột)
      </div>
      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: "15%", textAlign: "center" }}>Quan hệ</th>
            <th style={{ width: "22%", textAlign: "center" }}>HỌ VÀ TÊN</th>
            <th style={{ width: "10%", textAlign: "center" }}>Năm sinh</th>
            <th style={{ textAlign: "center" }}>
              Quê quán, nơi ở hiện nay (trong, ngoài nước), nghề nghiệp, chức danh, chức vụ, đơn vị công tác
            </th>
          </tr>
        </thead>
        <tbody>
          {!member.QuanHeGiaDinh || member.QuanHeGiaDinh.length === 0 ? (
            <tr>
              <td colSpan="4" className="center-text">
                Chưa có thông tin quan hệ gia đình
              </td>
            </tr>
          ) : (
            member.QuanHeGiaDinh.map((rel, i) => (
              <tr key={i}>
                <td>{rel.QuanHe}</td>
                <td className="uppercase">{rel.HoTen}</td>
                <td className="center-text">{rel.NamSinh}</td>
                <td style={{ whiteSpace: "pre-line" }}>{rel.ThongTin}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}
