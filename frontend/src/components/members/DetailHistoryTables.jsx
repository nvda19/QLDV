import { FiEye } from '../icons';
import { formatDate, formatMonthYear } from '../../utils/helpers';

function renderHuyHieuDang(val) {
  const options = [
    "30 năm", "40 năm", "45 năm", "50 năm", "55 năm",
    "60 năm", "65 năm", "70 năm", "75 năm", "80 năm",
  ];
  return (
    <span
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        gap: "8px 12px",
        alignItems: "baseline",
        marginTop: "5px",
      }}
    >
      {options.map((opt) => {
        const isChecked = val && String(val).toLowerCase().includes(opt.toLowerCase());
        return (
          <span key={opt} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            {opt}{" "}
            <span className="font-bold" style={{ fontSize: "12pt" }}>
              {isChecked ? "☑" : "☐"}
            </span>
          </span>
        );
      })}
    </span>
  );
}

const showVal = (val) => {
  if (val === 0 || val === '0') return '0';
  if (val === false) return 'Không';
  if (!val || String(val).trim() === '' || val === '—') return '.......';
  return val;
};

const formatXepLoai = (rating) => {
  if (!rating) return "—";
  const r = String(rating).trim();
  
  if (r === "Xuất sắc" || r.toLowerCase() === "xuất sắc") {
    return "Hoàn thành xuất sắc nhiệm vụ";
  }
  if (r === "Tốt" || r.toLowerCase() === "tốt") {
    return "Hoàn thành tốt nhiệm vụ";
  }
  if (r === "Khá" || r.toLowerCase() === "khá" || r === "Hoàn thành" || r.toLowerCase() === "hoàn thành") {
    return "Hoàn thành nhiệm vụ";
  }
  if (r === "Trung bình" || r.toLowerCase() === "trung bình" || r === "Không hoàn thành" || r.toLowerCase() === "không hoàn thành") {
    return "Không hoàn thành nhiệm vụ";
  }
  return r;
};

export default function DetailHistoryTables({
  member,
  employments,
  trainings,
  rankHistories,
  evaluations,
  setPreviewDoc
}) {
  return (
    <>
      {/* Mục 23 - tóm tắt quá trình công tác của đảng viên */}
      <div className="print-section-title">
        <span className="field-number">23)</span> TÓM TẮT QUÁ TRÌNH HOẠT ĐỘNG VÀ CÔNG TÁC
      </div>
      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: "35%", textAlign: "center" }}>
              Từ tháng, năm đến tháng, năm
            </th>
            <th style={{ textAlign: "center" }}>
              Cấp bậc, chức vụ, đơn vị công tác (Đảng, chính quyền, đoàn thể, kinh tế, văn hóa, xã hội…)
            </th>
          </tr>
        </thead>
        <tbody>
          {employments.length === 0 ? (
            <tr>
              <td colSpan="2" className="center-text">
                Chưa có quá trình hoạt động
              </td>
            </tr>
          ) : (
            employments.map((emp, i) => (
              <tr key={i}>
                <td className="center-text">
                  {formatMonthYear(emp.TuThangNam)} -{" "}
                  {emp.DenThangNam ? formatMonthYear(emp.DenThangNam) : "Hiện nay"}
                </td>
                <td>{emp.LamGiChucVuDonVi || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Mục 24 - các đợt đào tạo, bồi dưỡng đã tham gia */}
      <div className="print-section-title">
        <span className="field-number">24)</span> ĐÀO TẠO, BỒI DƯỠNG VỀ CHUYÊN MÔN, NGHIỆP VỤ, LÝ LUẬN CHÍNH TRỊ, NGOẠI NGỮ
      </div>
      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: "20%", textAlign: "center" }}>Tên trường</th>
            <th style={{ width: "20%", textAlign: "center" }}>Ngành học hoặc tên lớp học</th>
            <th style={{ width: "20%", textAlign: "center" }}>Từ tháng/năm đến tháng/năm</th>
            <th style={{ width: "15%", textAlign: "center" }}>Hình thức học</th>
            <th style={{ width: "15%", textAlign: "center" }}>Văn bằng, chứng chỉ, trình độ gì</th>
            <th style={{ width: "10%", textAlign: "center" }} className="no-print">Tài liệu đính kèm</th>
          </tr>
        </thead>
        <tbody>
          {trainings.length === 0 ? (
            <tr>
              <td colSpan="6" className="center-text">
                Chưa có quá trình đào tạo
              </td>
            </tr>
          ) : (
            trainings.map((t, i) => (
              <tr key={i}>
                <td>{t.TenTruong}</td>
                <td>{t.NganhHoc}</td>
                <td className="center-text">
                  {formatMonthYear(t.TuNgay)} -{" "}
                  {t.DenNgay ? formatMonthYear(t.DenNgay) : "Hiện nay"}
                </td>
                <td className="center-text">{t.HinhThuc}</td>
                <td>{t.VanBangCert || "—"}</td>
                <td className="center-text no-print">
                  {t.TaiLieuUrl ? (
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() =>
                        setPreviewDoc({
                          name: t.TaiLieuName || t.VanBangCert || "Scan văn bằng",
                          fileUrl: t.TaiLieuUrl,
                          fileType: t.TaiLieuUrl.endsWith(".pdf") ? "pdf" : "image",
                        })
                      }
                      style={{
                        padding: "2px 6px",
                        fontSize: "8pt",
                        height: "24px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        cursor: "pointer",
                      }}
                      title="Xem bản scan văn bằng"
                    >
                      Xem <FiEye size={10} />
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Các mục 25-28: khen thưởng, huy hiệu Đảng, danh hiệu và kỷ luật (nếu có) */}
      <div className="print-paper-fields" style={{ marginTop: "8px" }}>
        <div className="field-block">
          <span className="field-number">25)</span> Khen thưởng{" "}
          <span className="font-normal">(Huân chương, huy chương, bằng khen)</span>:{" "}
          <span className="underline-text">
            {showVal(member?.KhenThuong)}
          </span>
          {member?.QuyetDinhKhenThuong?.Id && member?.KhenThuong && member.KhenThuong !== "—" && (
            <button
              type="button"
              className="btn btn-outline btn-xs no-print"
              style={{
                marginLeft: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                verticalAlign: "middle",
                padding: "2px 6px",
                fontSize: "11px",
                height: "22px",
                lineHeight: "1",
                cursor: "pointer"
              }}
              onClick={() =>
                setPreviewDoc({
                  quyetDinhId: member.QuyetDinhKhenThuong.Id,
                })
              }
            >
              QĐ số {member.QuyetDinhKhenThuong.SoQuyetDinh}
            </button>
          )}
        </div>
        <div className="field-block">
          <span className="field-number">26)</span> Đã được tặng HH Đảng:{" "}
          {renderHuyHieuDang(member?.HuyHieuDang)}
        </div>
        <div className="field-block">
          <span className="field-number">27)</span> Danh hiệu được phong:{" "}
          <span className="underline-text">
            {showVal(member?.DanhHieuPhongTang)}
          </span>
        </div>
        <div className="field-block">
          <span className="field-number">28)</span> Kỷ luật{" "}
          <span className="font-normal">(Đảng, chính quyền, pháp luật)</span>:{" "}
          <span className="underline-text">
            {showVal(member?.KyLuat)}
          </span>
          {member?.QuyetDinhKhenThuong?.Id && member?.KyLuat && member.KyLuat !== "—" && (
            <button
              type="button"
              className="btn btn-outline btn-xs no-print"
              style={{
                marginLeft: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                verticalAlign: "middle",
                padding: "2px 6px",
                fontSize: "11px",
                height: "22px",
                lineHeight: "1",
                cursor: "pointer"
              }}
              onClick={() =>
                setPreviewDoc({
                  quyetDinhId: member.QuyetDinhKhenThuong.Id,
                })
              }
            >
              QĐ số {member.QuyetDinhKhenThuong.SoQuyetDinh}
            </button>
          )}
        </div>
      </div>

      {/* Mục 29 - kết quả xếp loại đảng viên qua các năm */}
      <div className="print-section-title" style={{ marginTop: "20px" }}>
        <span>
          <span className="field-number">29)</span> XẾP LOẠI ĐẢNG VIÊN HÀNG NĂM
        </span>
      </div>
      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: "15%", textAlign: "center" }}>Năm</th>
            <th style={{ width: "45%", textAlign: "center" }}>Xếp loại</th>
            <th style={{ width: "20%", textAlign: "center" }} className="no-print">Trạng thái</th>
            <th style={{ width: "20%", textAlign: "center" }}>Số quyết định</th>
          </tr>
        </thead>
        <tbody>
          {evaluations.length === 0 ? (
            <tr>
              <td colSpan="4" className="center-text">
                Chưa có xếp loại hàng năm
              </td>
            </tr>
          ) : (
            evaluations.map((ev) => (
              <tr key={ev.Id}>
                <td className="center-text">{ev.Nam}</td>
                <td>
                  <span>{formatXepLoai(ev.XepLoai)}</span>
                </td>
                <td className="center-text no-print">
                  <span
                    className={`badge ${
                      ev.TrangThai === "APPROVED"
                        ? "badge-olive"
                        : ev.TrangThai === "PENDING"
                        ? "badge-gold"
                        : "badge-danger"
                    }`}
                  >
                    {ev.TrangThai === "APPROVED"
                      ? "Đã duyệt"
                      : ev.TrangThai === "PENDING"
                      ? "Chờ duyệt"
                      : "Nháp / Từ chối"}
                  </span>
                </td>
                <td className="center-text">
                  {(ev.QuyetDinhId || ev.QuyetDinh?.Id) ? (
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--color-accent)', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 'inherit', fontWeight: 'normal' }}
                      onClick={() =>
                        setPreviewDoc({
                          quyetDinhId: ev.QuyetDinhId || ev.QuyetDinh?.Id,
                          soQuyetDinh: ev.QuyetDinh?.SoQuyetDinh || ev.SoQuyetDinh,
                          name: ev.QuyetDinh?.TenQuyetDinh || `QĐ Xếp loại năm ${ev.Nam}`,
                          fileUrl: ev.QuyetDinh?.TaiLieuUrl || ev.TaiLieuUrl,
                          fileType: (ev.QuyetDinh?.TaiLieuUrl || ev.TaiLieuUrl || '').endsWith(".pdf") ? "pdf" : "image"
                        })
                      }
                    >
                      {ev.QuyetDinh?.SoQuyetDinh || ev.SoQuyetDinh}
                    </button>
                  ) : (ev.SoQuyetDinh || ev.QuyetDinh?.SoQuyetDinh) ? (
                    <span>{ev.SoQuyetDinh || ev.QuyetDinh?.SoQuyetDinh}</span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Mục 30 - lịch sử phong, thăng quân hàm */}
      <div className="print-section-title" style={{ marginTop: "20px" }}>
        <span>
          <span className="field-number">30)</span> PHONG / THĂNG QUÂN HÀM
        </span>
      </div>
      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: "20%", textAlign: "center" }}>Cấp bậc</th>
            <th style={{ width: "20%", textAlign: "center" }}>Chức vụ</th>
            <th style={{ width: "20%", textAlign: "center" }}>Đơn vị</th>
            <th style={{ width: "15%", textAlign: "center" }}>Ngày hiệu lực</th>
            <th style={{ width: "25%", textAlign: "center" }}>Số quyết định</th>
          </tr>
        </thead>
        <tbody>
          {rankHistories.length === 0 ? (
            <tr>
              <td colSpan="5" className="center-text">
                Chưa có lịch sử thăng quân hàm
              </td>
            </tr>
          ) : (
            rankHistories.map((rh) => (
              <tr key={rh.Id}>
                <td>
                  <span className="font-bold">{rh.CapBac}</span>
                </td>
                <td>{rh.ChucVu || "—"}</td>
                <td>{rh.DonVi || "—"}</td>
                <td className="center-text">{formatDate(rh.NgayHieuLuc)}</td>
                <td>
                  {(rh.QuyetDinhId || rh.QuyetDinh?.Id) ? (
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--color-accent)', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 'inherit', fontWeight: 'bold' }}
                      onClick={() =>
                        setPreviewDoc({
                          quyetDinhId: rh.QuyetDinhId || rh.QuyetDinh?.Id,
                          soQuyetDinh: rh.QuyetDinh?.SoQuyetDinh || rh.SoQuyetDinh,
                          name: rh.QuyetDinh?.TenQuyetDinh || `QĐ Thăng quân hàm ${rh.CapBac}`,
                          fileUrl: rh.QuyetDinh?.TaiLieuUrl || rh.TaiLieuUrl,
                          fileType: (rh.QuyetDinh?.TaiLieuUrl || rh.TaiLieuUrl || '').endsWith(".pdf") ? "pdf" : "image"
                        })
                      }
                    >
                      {rh.QuyetDinh?.SoQuyetDinh || rh.SoQuyetDinh}
                    </button>
                  ) : (rh.SoQuyetDinh || rh.QuyetDinh?.SoQuyetDinh) ? (
                    <span>{rh.SoQuyetDinh || rh.QuyetDinh?.SoQuyetDinh}</span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}
