const memberRepository = require("../../src/repositories/member/member.repository");
const orgRepository = require("../../src/repositories/org.repository");

jest.mock("../../src/repositories/member/member.repository", () => ({
  findAllWithInclude: jest.fn(),
}));

jest.mock("../../src/repositories/org.repository", () => ({
  findById: jest.fn(),
  findAll: jest.fn(),
}));

const {
  getEvaluationWarnings,
} = require("../../src/services/evaluation/evaluationQuery.service");

describe("evaluationQuery.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getEvaluationWarnings", () => {
    test("ném lỗi nếu không tìm thấy tổ chức đảng", async () => {
      orgRepository.findById.mockResolvedValueOnce(null);
      await expect(getEvaluationWarnings("org1", 2024)).rejects.toThrow("Không tìm thấy tổ chức đảng");
    });

    test("tính toán phân phối chính xác cho toàn bộ các mức xếp loại (Xuất sắc, Tốt, Hoàn thành, Không hoàn thành)", async () => {
      orgRepository.findById.mockResolvedValueOnce({ Ten: "Chi bộ A" });
      memberRepository.findAllWithInclude.mockResolvedValueOnce([
        { Id: "m1", ThongTinVaoDang: { NgayVaoDang: "2020-01-01" }, DanhSachDanhGia: [{ XepLoai: "Xuất sắc" }] },
        { Id: "m2", ThongTinVaoDang: { NgayVaoDang: "2020-01-01" }, DanhSachDanhGia: [{ XepLoai: "Tốt" }] },
        { Id: "m3", ThongTinVaoDang: { NgayVaoDang: "2020-01-01" }, DanhSachDanhGia: [{ XepLoai: "Hoàn thành" }] },
        { Id: "m4", ThongTinVaoDang: { NgayVaoDang: "2020-01-01" }, DanhSachDanhGia: [{ XepLoai: "Không hoàn thành" }] },
        { Id: "m5", ThongTinVaoDang: { NgayVaoDang: "2020-01-01" }, DanhSachDanhGia: [] }, // Còn 1 người chưa đánh giá
        { Id: "m6", ThongTinVaoDang: null, DanhSachDanhGia: [{ XepLoai: "Tốt" }] }, // Bị lọc bỏ vì thiếu NgayVaoDang
      ]);

      const result = await getEvaluationWarnings("org1", 2024);

      expect(result.totalMembers).toBe(5);
      expect(result.totalEvaluated).toBe(4);
      expect(result.distribution.xuatSac.count).toBe(1);
      expect(result.distribution.xuatSac.percent).toBe(25);
      expect(result.distribution.tot.count).toBe(1);
      expect(result.distribution.tot.percent).toBe(25);
      expect(result.distribution.hoanThanh.count).toBe(1);
      expect(result.distribution.hoanThanh.percent).toBe(25);
      expect(result.distribution.khongHoanThanh.count).toBe(1);
      expect(result.distribution.khongHoanThanh.percent).toBe(25);
      // 25% xuất sắc (>20%) -> cảnh báo WARNING, còn 1/5 chưa đánh giá -> thêm cảnh báo INFO
      expect(result.warnings).toContainEqual(
        expect.objectContaining({ level: "WARNING" }),
      );
      expect(result.warnings).toContainEqual(
        expect.objectContaining({ level: "INFO" }),
      );
      expect(result.warnings.length).toBe(2);
    });

    test("không cảnh báo tỷ lệ xuất sắc nếu <= 20%, và không cảnh báo thiếu đánh giá nếu đã đánh giá hết", async () => {
      orgRepository.findById.mockResolvedValueOnce({ Ten: "Chi bộ A" });
      memberRepository.findAllWithInclude.mockResolvedValueOnce([
        { Id: "m1", ThongTinVaoDang: { NgayVaoDang: "2020-01-01" }, DanhSachDanhGia: [{ XepLoai: "Xuất sắc" }] },
        { Id: "m2", ThongTinVaoDang: { NgayVaoDang: "2020-01-01" }, DanhSachDanhGia: [{ XepLoai: "Tốt" }] },
        { Id: "m3", ThongTinVaoDang: { NgayVaoDang: "2020-01-01" }, DanhSachDanhGia: [{ XepLoai: "Tốt" }] },
        { Id: "m4", ThongTinVaoDang: { NgayVaoDang: "2020-01-01" }, DanhSachDanhGia: [{ XepLoai: "Tốt" }] },
        { Id: "m5", ThongTinVaoDang: { NgayVaoDang: "2020-01-01" }, DanhSachDanhGia: [{ XepLoai: "Tốt" }] },
      ]); // 1/5 = 20% Xuất sắc (vừa bằng ngưỡng), cả 5 đều đã đánh giá

      const result = await getEvaluationWarnings("org1", 2024);
      expect(result.warnings.length).toBe(0);
    });

    test("còn người chưa đánh giá nhưng tỷ lệ xuất sắc không vượt ngưỡng -> chỉ cảnh báo INFO", async () => {
      orgRepository.findById.mockResolvedValueOnce({ Ten: "Chi bộ A" });
      memberRepository.findAllWithInclude.mockResolvedValueOnce([
        { Id: "m1", ThongTinVaoDang: { NgayVaoDang: "2020-01-01" }, DanhSachDanhGia: [{ XepLoai: "Tốt" }] },
        { Id: "m2", ThongTinVaoDang: { NgayVaoDang: "2020-01-01" }, DanhSachDanhGia: [] },
      ]);

      const result = await getEvaluationWarnings("org1", 2024);
      expect(result.warnings).toEqual([
        expect.objectContaining({ level: "INFO" }),
      ]);
    });
  });
});
