import React from "react";

const showVal = (val) => {
  if (val === 0 || val === "0") return "0";
  if (val === false) return "Không";
  if (!val || String(val).trim() === "" || val === "—") return ".......";
  return val;
};

export default function DetailEconomicInfo({ member }) {
  return (
    <>
      <div className="print-section-title">
        <span className="field-number">34)</span> HOÀN CẢNH KINH TẾ CỦA BẢN THÂN
        VÀ GIA ĐÌNH
      </div>
      <div className="field-block">
        <ul
          className="sub-fields"
          style={{
            listStyleType: "none",
            paddingLeft: "32px",
            lineHeight: "1.7",
          }}
        >
          <li>
            - Tổng thu nhập của hộ gia đình (trong 1 năm):{" "}
            <span className="underline-text">
              {showVal(member.HoanCanhKinhTe?.totalIncome)}
            </span>{" "}
            đồng
          </li>
          <li style={{ marginTop: "4px" }}>
            Bình quân 1 người/hộ:{" "}
            <span className="underline-text">
              {showVal(member.HoanCanhKinhTe?.perCapitaIncome)}
            </span>{" "}
            đồng
          </li>
          <li style={{ display: "block", marginTop: "4px" }}>
            - Nhà ở:
            <div style={{ paddingLeft: "20px" }}>
              + Được cấp, được thuê, loại nhà:{" "}
              <span className="underline-text">
                {showVal(member.HoanCanhKinhTe?.houseRent)}
              </span>
              , tổng diện tích sử dụng:{" "}
              <span className="underline-text">
                {showVal(member.HoanCanhKinhTe?.houseRentArea)}
                {member.HoanCanhKinhTe?.houseRentArea &&
                  member.HoanCanhKinhTe?.houseRentArea !== "—" &&
                  " m2"}
              </span>
              <br />+ Nhà tự mua, tự xây, loại nhà:{" "}
              <span className="underline-text">
                {showVal(member.HoanCanhKinhTe?.houseOwned)}
              </span>
              {member.HoanCanhKinhTe?.houseOwnedArea && (
                <>
                  , diện tích sử dụng:{" "}
                  <span className="underline-text">
                    {showVal(member.HoanCanhKinhTe?.houseOwnedArea)}
                    {member.HoanCanhKinhTe?.houseOwnedArea !== "—" && " m2"}
                  </span>
                </>
              )}
            </div>
          </li>
          <li style={{ display: "block", marginTop: "4px" }}>
            - Đất ở:
            <div style={{ paddingLeft: "20px" }}>
              + Đất được cấp:{" "}
              <span className="underline-text">
                {showVal(member.HoanCanhKinhTe?.landAllocated)}
                {member.HoanCanhKinhTe?.landAllocated &&
                  member.HoanCanhKinhTe?.landAllocated !== "—" &&
                  " m2"}
              </span>
              <br />+ Đất tự mua:{" "}
              <span className="underline-text">
                {showVal(member.HoanCanhKinhTe?.landOwned)}
                {member.HoanCanhKinhTe?.landOwned &&
                  member.HoanCanhKinhTe?.landOwned !== "—" &&
                  " m2"}
              </span>
            </div>
          </li>
          <li style={{ display: "block", marginTop: "4px" }}>
            - Hoạt động kinh tế:{" "}
            <span className="underline-text">
              {showVal(member.HoanCanhKinhTe?.economicActivity)}
            </span>
            {member.HoanCanhKinhTe?.farmArea && (
              <>
                , đất trang trại:{" "}
                <span className="underline-text">
                  {showVal(member.HoanCanhKinhTe?.farmArea)}
                  {member.HoanCanhKinhTe?.farmArea !== "—" && " m2"}
                </span>
              </>
            )}
            {member.HoanCanhKinhTe?.hiredLabor && (
              <>
                , lao động thuê mướn:{" "}
                <span className="underline-text">
                  {showVal(member.HoanCanhKinhTe?.hiredLabor)}
                  {member.HoanCanhKinhTe?.hiredLabor !== "—" && " người"}
                </span>
              </>
            )}
          </li>
          <li style={{ display: "block", marginTop: "4px" }}>
            - Những tài sản có giá trị (50 triệu đồng trở lên) :{" "}
            <span className="underline-text">
              {showVal(member.HoanCanhKinhTe?.valuableAssets)}
            </span>
            {member.HoanCanhKinhTe?.assetValue && (
              <>
                , giá trị:{" "}
                <span className="underline-text">
                  {showVal(member.HoanCanhKinhTe?.assetValue)}
                  {member.HoanCanhKinhTe?.assetValue !== "—" && " đồng"}
                </span>
              </>
            )}
          </li>
        </ul>
      </div>

      {/* Khối chữ ký xác nhận, chỉ hiện khi in */}
      <div className="print-signatures print-only-item">
        <div className="sig-block">
          <div
            className="sig-title font-bold"
            style={{
              display: "block",
              height: "auto",
              marginBottom: "4px",
            }}
          >
            XÁC NHẬN CỦA CHI ỦY CHI BỘ
            <div
              style={{
                fontWeight: "normal",
                marginTop: "3px",
              }}
            >
              …………………………………
            </div>
            <div style={{ fontWeight: "normal" }}>…………………………………</div>
          </div>
          <div className="sig-date" style={{ marginTop: "6px" }}>
            Ngày … tháng …. năm ……
          </div>
          <div className="sig-space" style={{ height: "55px" }}></div>
          <div className="sig-footer font-bold">
            (Chức vụ, ký ghi rõ họ tên)
          </div>
        </div>
        <div className="sig-block">
          <div
            className="sig-title font-bold"
            style={{
              display: "block",
              height: "auto",
              marginBottom: "4px",
            }}
          >
            NGƯỜI KHAI
            <div
              style={{
                fontWeight: "normal",
                fontStyle: "italic",
                marginTop: "3px",
                lineHeight: "1.3",
              }}
            >
              Tôi xin cam đoan những lời khai
              <br />
              trên đây là đúng sự thật
            </div>
          </div>
          <div className="sig-date" style={{ marginTop: "6px" }}>
            Ngày … tháng …. năm ……
          </div>
          <div className="sig-space" style={{ height: "55px" }}></div>
          <div className="sig-footer font-bold">(Ký ghi rõ họ tên)</div>
        </div>
        <div className="sig-block">
          <div
            className="sig-title font-bold"
            style={{
              display: "block",
              height: "auto",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                fontWeight: "normal",
                fontStyle: "italic",
                marginBottom: "3px",
              }}
            >
              ……, ngày … tháng … năm …
            </div>
            XÁC NHẬN CỦA CẤP UỶ CƠ SỞ
          </div>
          <div className="sig-date" style={{ visibility: "hidden" }}>
            Ngày … tháng …. năm ……
          </div>
          <div className="sig-space" style={{ height: "55px" }}></div>
          <div className="sig-footer font-bold">
            (Chức vụ, ký, đóng dấu, ghi rõ họ và tên)
          </div>
        </div>
      </div>
    </>
  );
}
