const {
  mapToFrontend,
  mapListToFrontend,
  mapToDb,
} = require("../../../src/domain/mappers/decision.mapper");

describe("decision.mapper", () => {
  describe("mapToFrontend", () => {
    test("trả về null nếu input falsy", () => {
      expect(mapToFrontend(null)).toBeNull();
      expect(mapToFrontend(undefined)).toBeNull();
    });

    test("map chính xác các trường từ DB sang camelCase frontend", () => {
      const qd = {
        Id: "qd1",
        SoQuyetDinh: "01/QD",
        TenQuyetDinh: "Quyết định khen thưởng",
        LoaiQuyetDinh: "KHEN_THUONG",
        NgayBanHanh: new Date("2024-01-01"),
        TaiLieuUrl: "/url/a.pdf",
        TaiLieuName: "a.pdf",
        CreatedAt: "2024-01-01T00:00:00Z",
        UpdatedAt: "2024-01-01T01:00:00Z",
      };

      const result = mapToFrontend(qd);

      expect(result).toEqual({
        id: "qd1",
        soQuyetDinh: "01/QD",
        tenQuyetDinh: "Quyết định khen thưởng",
        loaiQuyetDinh: "KHEN_THUONG",
        ngayBanHanh: qd.NgayBanHanh,
        taiLieuUrl: "/url/a.pdf",
        taiLieuName: "a.pdf",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T01:00:00Z",
      });
    });
  });

  describe("mapListToFrontend", () => {
    test("trả về mảng rỗng nếu đầu vào rỗng", () => {
      expect(mapListToFrontend()).toEqual([]);
      expect(mapListToFrontend([])).toEqual([]);
    });

    test("map danh sách các bản ghi chính xác", () => {
      const list = [{ Id: "qd1", SoQuyetDinh: "01/QD" }, { Id: "qd2", SoQuyetDinh: "02/QD" }];
      const result = mapListToFrontend(list);

      expect(result.length).toBe(2);
      expect(result[0].id).toBe("qd1");
      expect(result[1].id).toBe("qd2");
    });
  });

  describe("mapToDb", () => {
    test("map chính xác từ frontend payload sang database shape", () => {
      const payload = {
        soQuyetDinh: "01/QD",
        tenQuyetDinh: "Quyết định",
        loaiQuyetDinh: "KHEN_THUONG",
        ngayBanHanh: "2024-01-01",
        deleteAttachment: true,
      };

      const result = mapToDb(payload);

      expect(result).toEqual({
        SoQuyetDinh: "01/QD",
        TenQuyetDinh: "Quyết định",
        LoaiQuyetDinh: "KHEN_THUONG",
        NgayBanHanh: "2024-01-01",
        deleteAttachment: true,
      });
    });

    test("map với object rỗng mặc định", () => {
      const result = mapToDb();
      expect(result).toEqual({
        SoQuyetDinh: undefined,
        TenQuyetDinh: undefined,
        LoaiQuyetDinh: undefined,
        NgayBanHanh: undefined,
        deleteAttachment: undefined,
      });
    });
  });
});
