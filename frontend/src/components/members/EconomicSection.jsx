import React from 'react';

export default function EconomicSection({ formData, handleChange }) {
  return (
    <fieldset className="form-fieldset">
      <legend>Hoàn cảnh kinh tế của bản thân và gia đình (Mục 34)</legend>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="totalIncome">
            Tổng thu nhập của hộ gia đình (trong 1 năm) (đồng)
          </label>
          <input
            id="totalIncome"
            name="totalIncome"
            type="text"
            className="form-input"
            placeholder="VD: 120.000.000"
            value={formData.totalIncome}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="perCapitaIncome">
            Bình quân 1 người/hộ (đồng)
          </label>
          <input
            id="perCapitaIncome"
            name="perCapitaIncome"
            type="text"
            className="form-input"
            placeholder="VD: 30.000.000"
            value={formData.perCapitaIncome}
            onChange={handleChange}
          />
        </div>

        {/* Nhà được cấp hoặc đi thuê */}
        <div className="form-group">
          <label className="form-label" htmlFor="houseRent">
            Nhà ở được cấp, được thuê: loại nhà
          </label>
          <input
            id="houseRent"
            name="houseRent"
            type="text"
            className="form-input"
            placeholder="VD: Nhà thuê công vụ cấp 3"
            value={formData.houseRent}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="houseRentArea">
            Diện tích sử dụng nhà thuê (m²)
          </label>
          <input
            id="houseRentArea"
            name="houseRentArea"
            type="text"
            className="form-input"
            placeholder="VD: 75"
            value={formData.houseRentArea}
            onChange={handleChange}
          />
        </div>

        {/* Nhà tự mua hoặc tự xây */}
        <div className="form-group">
          <label className="form-label" htmlFor="houseOwned">
            Nhà tự mua, tự xây: loại nhà
          </label>
          <input
            id="houseOwned"
            name="houseOwned"
            type="text"
            className="form-input"
            placeholder="VD: Nhà tự xây cấp 4"
            value={formData.houseOwned}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="houseOwnedArea">
            Diện tích sử dụng nhà riêng (m²)
          </label>
          <input
            id="houseOwnedArea"
            name="houseOwnedArea"
            type="text"
            className="form-input"
            placeholder="VD: 120"
            value={formData.houseOwnedArea}
            onChange={handleChange}
          />
        </div>

        {/* Thông tin đất đai sở hữu */}
        <div className="form-group">
          <label className="form-label" htmlFor="landAllocated">
            Đất ở được cấp (m2)
          </label>
          <input
            id="landAllocated"
            name="landAllocated"
            type="text"
            className="form-input"
            placeholder="VD: 100"
            value={formData.landAllocated}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="landOwned">
            Đất ở tự mua (m2)
          </label>
          <input
            id="landOwned"
            name="landOwned"
            type="text"
            className="form-input"
            placeholder="VD: 150"
            value={formData.landOwned}
            onChange={handleChange}
          />
        </div>

        {/* Các hoạt động kinh doanh, sản xuất nếu có */}
        <div className="form-group form-full">
          <label className="form-label" htmlFor="economicActivity">
            Hoạt động kinh tế (kinh doanh, trang trại, lao động thuê mướn...)
          </label>
          <textarea
            id="economicActivity"
            name="economicActivity"
            className="form-input"
            style={{ width: "100%", resize: "none", minHeight: "38px", padding: "8px 12px", boxSizing: "border-box", overflowY: "hidden" }}
            placeholder="VD: Kinh doanh dịch vụ ăn uống"
            value={formData.economicActivity}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="farmArea">
            Diện tích đất kinh doanh trang trại (m2)
          </label>
          <input
            id="farmArea"
            name="farmArea"
            type="text"
            className="form-input"
            placeholder="VD: 1000"
            value={formData.farmArea}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="hiredLabor">
            Số lao động thuê mướn (người)
          </label>
          <input
            id="hiredLabor"
            name="hiredLabor"
            type="text"
            className="form-input"
            placeholder="VD: 5"
            value={formData.hiredLabor}
            onChange={handleChange}
          />
        </div>

        {/* Tài sản giá trị lớn khác trong gia đình */}
        <div className="form-group">
          <label className="form-label" htmlFor="valuableAssets">
            Những tài sản có giá trị lớn (50 triệu đồng trở lên)
          </label>
          <textarea
            id="valuableAssets"
            name="valuableAssets"
            className="form-input"
            style={{ width: "100%", resize: "none", minHeight: "38px", padding: "8px 12px", boxSizing: "border-box", overflowY: "hidden" }}
            placeholder="VD: Xe ô tô Mazda 3, sổ tiết kiệm"
            value={formData.valuableAssets}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="assetValue">
            Tổng giá trị các tài sản lớn (đồng)
          </label>
          <input
            id="assetValue"
            name="assetValue"
            type="text"
            className="form-input"
            placeholder="VD: 600.000.000"
            value={formData.assetValue}
            onChange={handleChange}
          />
        </div>
      </div>
    </fieldset>
  );
}
