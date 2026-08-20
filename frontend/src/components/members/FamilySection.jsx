import React from "react";

export default function FamilySection({
  formData,
  handleChange,
  handleAddFamilyMember,
  handleRemoveFamilyMember,
  handleFamilyMemberChange,
}) {
  return (
    <>
      {/* Khối 7 - các đặc điểm liên quan lịch sử bản thân đảng viên */}
      <fieldset className="form-fieldset">
        <legend>Đặc điểm lịch sử bản thân (Mục 31)</legend>
        <div className="form-grid">
          <div className="form-group form-full">
            <label className="form-label" htmlFor="bixoaten">
              Bị xóa tên trong danh sách đảng viên (nếu có ghi rõ lý do, ngày
              tháng...)
            </label>
            <textarea
              id="bixoaten"
              name="bixoaten"
              className="form-input"
              style={{ width: "100%", resize: "none", minHeight: "38px", padding: "8px 12px", boxSizing: "border-box", overflowY: "hidden" }}
              placeholder="VD: Không"
              value={formData.bixoaten}
              onChange={handleChange}
            />
          </div>

          {/* 31a - dành cho trường hợp được kết nạp lại vào Đảng */}
          <div
            className="form-group form-full"
            style={{
              border: "1px dashed var(--color-border)",
              padding: "var(--spacing-md)",
              borderRadius: "var(--radius-md)",
              marginTop: "var(--spacing-sm)",
            }}
          >
            <h4
              style={{
                fontSize: "var(--font-size-base)",
                color: "var(--color-accent)",
                marginBottom: "var(--spacing-md)",
                textTransform: "uppercase",
              }}
            >
              a) Được kết nạp lại vào Đảng
            </h4>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="ngayVaoDang2">
                  Ngày vào Đảng lần thứ 2
                </label>
                <input
                  id="ngayVaoDang2"
                  name="ngayVaoDang2"
                  type="date"
                  className="form-input"
                  value={formData.ngayVaoDang2}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="chiBoVaoDang2">
                  Tại chi bộ lần 2
                </label>
                <input
                  id="chiBoVaoDang2"
                  name="chiBoVaoDang2"
                  type="text"
                  className="form-input"
                  placeholder="Nhập chi bộ kết nạp lần 2"
                  value={formData.chiBoVaoDang2}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="nguoiGioiThieu1_2">
                  Người giới thiệu lần 2 (người 1)
                </label>
                <input
                  id="nguoiGioiThieu1_2"
                  name="nguoiGioiThieu1_2"
                  type="text"
                  className="form-input"
                  placeholder="Họ tên người giới thiệu"
                  value={formData.nguoiGioiThieu1_2}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="chucVuNGT1_2">
                  Cấp bậc, chức vụ, đơn vị NGT 1
                </label>
                <input
                  id="chucVuNGT1_2"
                  name="chucVuNGT1_2"
                  type="text"
                  className="form-input"
                  placeholder="Nhập chức vụ người giới thiệu 1"
                  value={formData.chucVuNGT1_2}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="nguoiGioiThieu2_2">
                  Người giới thiệu lần 2 (người 2)
                </label>
                <input
                  id="nguoiGioiThieu2_2"
                  name="nguoiGioiThieu2_2"
                  type="text"
                  className="form-input"
                  placeholder="Họ tên người giới thiệu 2"
                  value={formData.nguoiGioiThieu2_2}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="chucVuNGT2_2">
                  Cấp bậc, chức vụ, đơn vị NGT 2
                </label>
                <input
                  id="chucVuNGT2_2"
                  name="chucVuNGT2_2"
                  type="text"
                  className="form-input"
                  placeholder="Nhập chức vụ người giới thiệu 2"
                  value={formData.chucVuNGT2_2}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ngayChinhThuc2">
                  Ngày chính thức lần thứ 2
                </label>
                <input
                  id="ngayChinhThuc2"
                  name="ngayChinhThuc2"
                  type="date"
                  className="form-input"
                  value={formData.ngayChinhThuc2}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="chiBoChinhThuc2">
                  Tại chi bộ chính thức lần 2
                </label>
                <input
                  id="chiBoChinhThuc2"
                  name="chiBoChinhThuc2"
                  type="text"
                  className="form-input"
                  placeholder="Nhập chi bộ chính thức"
                  value={formData.chiBoChinhThuc2}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* 31b - dành cho trường hợp khôi phục đảng tịch */}
          <div
            className="form-group form-full"
            style={{
              border: "1px dashed var(--color-border)",
              padding: "var(--spacing-md)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <h4
              style={{
                fontSize: "var(--font-size-base)",
                color: "var(--color-accent)",
                marginBottom: "var(--spacing-md)",
                textTransform: "uppercase",
              }}
            >
              b) Khôi phục đảng tịch
            </h4>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="ngayKhoiPhuc">
                  Ngày được khôi phục đảng tịch
                </label>
                <input
                  id="ngayKhoiPhuc"
                  name="ngayKhoiPhuc"
                  type="date"
                  className="form-input"
                  value={formData.ngayKhoiPhuc}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="chiBoKhoiPhuc">
                  Tại chi bộ khôi phục
                </label>
                <input
                  id="chiBoKhoiPhuc"
                  name="chiBoKhoiPhuc"
                  type="text"
                  className="form-input"
                  placeholder="Nhập chi bộ khôi phục"
                  value={formData.chiBoKhoiPhuc}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-group form-full">
            <label className="form-label" htmlFor="xuLyPhapLuat">
              c) Bị bắt, bị tù (ngày tháng năm, chính quyền nào xử lý, hình
              thức, nơi thi hành án...)
            </label>
            <textarea
              id="xuLyPhapLuat"
              name="xuLyPhapLuat"
              className="form-input"
              style={{ width: "100%", resize: "none", minHeight: "38px", padding: "8px 12px", boxSizing: "border-box", overflowY: "hidden" }}
              placeholder="VD: Không"
              value={formData.xuLyPhapLuat}
              onChange={handleChange}
            />
          </div>
          <div className="form-group form-full">
            <label className="form-label" htmlFor="cheDocU">
              d) Bản thân có làm việc trong chế độ cũ (thời gian, chức vụ, nơi
              làm việc...)
            </label>
            <textarea
              id="cheDocU"
              name="cheDocU"
              className="form-input"
              style={{ width: "100%", resize: "none", minHeight: "38px", padding: "8px 12px", boxSizing: "border-box", overflowY: "hidden" }}
              placeholder="VD: Không"
              value={formData.cheDocU}
              onChange={handleChange}
            />
          </div>
        </div>
      </fieldset>

      {/* Khối 8 - khai báo các mối quan hệ với nước ngoài (nếu có) */}
      <fieldset className="form-fieldset">
        <legend>Quan hệ với nước ngoài (Mục 32)</legend>
        <div className="form-grid">
          <div className="form-group form-full">
            <label className="form-label" htmlFor="foreignTravel">
              Đã đi nước ngoài (nước nào, lý do, thời gian...)
            </label>
            <textarea
              id="foreignTravel"
              name="foreignTravel"
              className="form-input"
              style={{ width: "100%", resize: "none", minHeight: "38px", padding: "8px 12px", boxSizing: "border-box", overflowY: "hidden" }}
              placeholder="VD: Đi nghiên cứu sinh tại Úc (2014-2018)"
              value={formData.foreignTravel}
              onChange={handleChange}
            />
          </div>
          <div className="form-group form-full">
            <label className="form-label" htmlFor="foreignOrgs">
              Tham gia hoặc có quan hệ với các tổ chức chính trị, kinh tế, xã
              hội nước ngoài
            </label>
            <textarea
              id="foreignOrgs"
              name="foreignOrgs"
              className="form-input"
              style={{ width: "100%", resize: "none", minHeight: "38px", padding: "8px 12px", boxSizing: "border-box", overflowY: "hidden" }}
              placeholder="VD: Không"
              value={formData.foreignOrgs}
              onChange={handleChange}
            />
          </div>
          <div className="form-group form-full">
            <label className="form-label" htmlFor="foreignRelatives">
              Có người thân ở nước ngoài (tên người, quan hệ gì, ở nước nào, làm
              gì...)
            </label>
            <textarea
              id="foreignRelatives"
              name="foreignRelatives"
              className="form-input"
              style={{ width: "100%", resize: "none", minHeight: "38px", padding: "8px 12px", boxSizing: "border-box", overflowY: "hidden" }}
              placeholder="VD: Không"
              value={formData.foreignRelatives}
              onChange={handleChange}
            />
          </div>
        </div>
      </fieldset>

      {/* Khối 9 - bảng kê thân nhân trong gia đình */}
      <fieldset className="form-fieldset">
        <legend>Quan hệ gia đình (Mục 33)</legend>
        <p
          className="text-muted"
          style={{
            marginBottom: "var(--spacing-md)",
            fontSize: "var(--font-size-sm)",
          }}
        >
          Khai cha, mẹ đẻ, cha, mẹ vợ (chồng), vợ (chồng), các con, anh chị em
          ruột.
        </p>

        <div
          className="table-container"
          style={{ marginBottom: "var(--spacing-md)" }}
        >
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: "15%" }}>Mối quan hệ</th>
                <th style={{ width: "20%" }}>Họ và tên</th>
                <th style={{ width: "12%" }}>Năm sinh</th>
                <th style={{ width: "43%" }}>
                  Quê quán, nơi ở hiện nay (trong, ngoài nước), nghề nghiệp,
                  chức danh, chức vụ, đơn vị công tác
                </th>
                <th style={{ width: "10%" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {formData.quanHeGiaDinh.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="center-text text-muted"
                    style={{ padding: "var(--spacing-md)" }}
                  >
                    Chưa thêm thông tin thân nhân. Nhấn "Thêm người thân" để bắt
                    đầu.
                  </td>
                </tr>
              ) : (
                formData.quanHeGiaDinh.map((rel, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        type="text"
                        className="form-input form-input-sm"
                        style={{ width: "100%", boxSizing: "border-box" }}
                        placeholder="VD: Bố đẻ, Vợ..."
                        value={rel.quanHe}
                        onChange={(e) =>
                          handleFamilyMemberChange(
                            idx,
                            "quanHe",
                            e.target.value,
                          )
                        }
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-input form-input-sm"
                        style={{ width: "100%", boxSizing: "border-box" }}
                        placeholder="Nhập họ tên"
                        value={rel.hoTen}
                        onChange={(e) =>
                          handleFamilyMemberChange(idx, "hoTen", e.target.value)
                        }
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-input form-input-sm"
                        style={{ width: "100%", boxSizing: "border-box" }}
                        placeholder="Năm sinh"
                        value={rel.namSinh}
                        onChange={(e) =>
                          handleFamilyMemberChange(
                            idx,
                            "namSinh",
                            e.target.value,
                          )
                        }
                        required
                      />
                    </td>
                    <td>
                      <textarea
                        className="form-input form-input-sm"
                        style={{
                          width: "100%",
                          resize: "none",
                          minHeight: "36px",
                          padding: "6px 8px",
                          boxSizing: "border-box",
                          overflowY: "hidden",
                        }}
                        placeholder="Quê quán, nghề nghiệp, nơi ở..."
                        value={rel.thongTin}
                        onChange={(e) =>
                          handleFamilyMemberChange(
                            idx,
                            "thongTin",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleRemoveFamilyMember(idx)}
                        style={{
                          color: "var(--color-error)",
                          borderColor: "var(--color-error)",
                          padding: "var(--spacing-xs) var(--spacing-sm)",
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

        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handleAddFamilyMember}
          style={{ gap: "var(--spacing-xs)" }}
        >
          Thêm người thân
        </button>
      </fieldset>
    </>
  );
}
