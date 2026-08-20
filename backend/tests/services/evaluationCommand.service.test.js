const memberRepository = require("../../src/repositories/member/member.repository");
const memberPartyRepository = require("../../src/repositories/member/memberParty.repository");
const { logAction } = require("../../src/infrastructure/audit/auditLogger");
const orgRepository = require("../../src/repositories/org.repository");
const notificationService = require("../../src/services/notification.service");
const { resolveQuyetDinh } = require("../../src/services/decision/decisionResolver.service");
const prisma = require("../../src/infrastructure/database/prisma");
const { ROLES } = require("../../src/domain/constants/member.constants");

jest.mock("../../src/repositories/member/member.repository", () => ({
  findAllWithInclude: jest.fn(),
}));

jest.mock("../../src/repositories/member/memberParty.repository", () => ({
  updateManyEvaluations: jest.fn(),
  countEvaluations: jest.fn(),
}));

jest.mock("../../src/infrastructure/audit/auditLogger", () => ({
  logAction: jest.fn(),
}));

jest.mock("../../src/repositories/org.repository", () => ({
  findById: jest.fn(),
}));

jest.mock("../../src/services/notification.service", () => ({
  getAllCanBoChinhTriIds: jest.fn(),
  getBiThuOfOrg: jest.fn(),
  createBulkNotifications: jest.fn(),
}));

jest.mock("../../src/services/decision/decisionResolver.service", () => ({
  resolveQuyetDinh: jest.fn(),
}));

const mockUpdateMany = jest.fn();
jest.mock("../../src/infrastructure/database/prisma", () => ({
  $transaction: jest.fn((callback) => callback({
    danhGiaDangVien: {
      updateMany: mockUpdateMany,
    },
  })),
}));

const {
  submitOrgEvaluations,
  approveOrgEvaluations,
  rejectOrgEvaluations,
  rollbackOrgEvaluations,
} = require("../../src/services/evaluation/evaluationCommand.service");

describe("evaluationCommand.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("submitOrgEvaluations", () => {
    const user = { userId: "user1", role: ROLES.BI_THU, orgId: "org1" };

    test("ném lỗi nếu role không phải BI_THU", async () => {
      await expect(
        submitOrgEvaluations("org1", 2024, { ...user, role: ROLES.CAN_BO_CHINH_TRI })
      ).rejects.toThrow("Chỉ Bí thư mới có quyền gửi đề xuất chi bộ!");
    });

    test("ném lỗi nếu thao tác trên chi bộ khác", async () => {
      await expect(
        submitOrgEvaluations("org2", 2024, user)
      ).rejects.toThrow("Bạn không có quyền thao tác trên chi bộ khác!");
    });

    test("ném lỗi nếu năm đánh giá không hợp lệ", async () => {
      await expect(
        submitOrgEvaluations("org1", "abc", user)
      ).rejects.toThrow("Năm đánh giá không hợp lệ");
    });

    test("ném lỗi nếu chi bộ chưa có đảng viên nào", async () => {
      memberRepository.findAllWithInclude.mockResolvedValueOnce([]);
      await expect(
        submitOrgEvaluations("org1", 2024, user)
      ).rejects.toThrow("Chi bộ chưa có đảng viên nào để đánh giá!");
    });

    test("ném lỗi nếu không có đảng viên đủ điều kiện (kết nạp chưa đủ 6 tháng hoặc thiếu ThongTinVaoDang)", async () => {
      memberRepository.findAllWithInclude.mockResolvedValueOnce([
        {
          Id: "m1",
          ThongTinVaoDang: null, // Không có thông tin -> không đủ điều kiện
        },
        {
          Id: "m2",
          ThongTinVaoDang: { NgayVaoDang: "2024-10-01" }, // Mới 2 tháng -> không đủ điều kiện
        },
      ]);

      await expect(
        submitOrgEvaluations("org1", 2024, user)
      ).rejects.toThrow("Không có đảng viên đủ điều kiện đánh giá năm 2024!");
    });

    test("ném lỗi nếu thiếu lý lịch bắt buộc cho đảng viên chính thức (thiếu SoTheDangVien, HoTen, QueQuan, DanToc)", async () => {
      memberRepository.findAllWithInclude.mockResolvedValueOnce([
        {
          Id: "m1",
          ThongTinVaoDang: { NgayVaoDang: "2020-01-01", NgayChinhThuc: null },
          LyLichCaNhan: { HoTenDangDung: "", HoTenKhaiSinh: "", NgaySinh: null, GioiTinh: null, QueQuan: null, DanToc: null },
          SoTheDangVien: null,
          DanhSachDanhGia: [],
        },
      ]);

      await expect(
        submitOrgEvaluations("org1", 2024, user)
      ).rejects.toThrow("Đảng viên chưa có tên");
    });

    test("đảng viên dự bị (dưới 12 tháng) thì không cần kiểm tra Số thẻ và Ngày chính thức", async () => {
      memberRepository.findAllWithInclude.mockResolvedValueOnce([
        {
          Id: "m1",
          ThongTinVaoDang: { NgayVaoDang: "2024-05-01", NgayChinhThuc: null }, // 7 tháng từ ngày kết nạp (dự bị)
          LyLichCaNhan: { HoTenDangDung: "Đảng viên dự bị", NgaySinh: "1995-01-01", GioiTinh: "Nam", QueQuan: "HN", DanToc: "Kinh" },
          SoTheDangVien: null, // Không có số thẻ nhưng vì là dự bị nên vẫn hợp lệ
          DanhSachDanhGia: [{ Id: "e1", XepLoai: "Tốt" }],
        },
      ]);
      memberPartyRepository.updateManyEvaluations.mockResolvedValueOnce({ count: 1 });
      orgRepository.findById.mockResolvedValueOnce({ Ten: "Chi bộ A" });
      notificationService.getAllCanBoChinhTriIds.mockResolvedValueOnce(["cb1"]);

      const result = await submitOrgEvaluations("org1", 2024, user);
      expect(result).toEqual({ count: 1 });
    });

    test("ném lỗi nếu chưa hoàn thành đánh giá nháp cho đảng viên đủ điều kiện", async () => {
      memberRepository.findAllWithInclude.mockResolvedValueOnce([
        {
          Id: "m1",
          ThongTinVaoDang: { NgayVaoDang: "2020-01-01", NgayChinhThuc: "2021-01-01" },
          LyLichCaNhan: { HoTenDangDung: "Nguyễn Văn A", NgaySinh: "1990-01-01", GioiTinh: "Nam", QueQuan: "HN", DanToc: "Kinh" },
          SoTheDangVien: "123",
          DanhSachDanhGia: [], // trống -> chưa đánh giá nháp
        },
      ]);

      await expect(
        submitOrgEvaluations("org1", 2024, user)
      ).rejects.toThrow("Chưa hoàn thành đánh giá nháp");
    });

    test("gửi thành công -> cập nhật trạng thái PENDING, ghi log và gửi thông báo", async () => {
      memberRepository.findAllWithInclude.mockResolvedValueOnce([
        {
          Id: "m1",
          ThongTinVaoDang: { NgayVaoDang: "2020-01-01", NgayChinhThuc: "2021-01-01" },
          LyLichCaNhan: { HoTenDangDung: "Nguyễn Văn A", NgaySinh: "1990-01-01", GioiTinh: "Nam", QueQuan: "HN", DanToc: "Kinh" },
          SoTheDangVien: "123",
          DanhSachDanhGia: [{ Id: "e1", XepLoai: "Tốt" }],
        },
      ]);
      memberPartyRepository.updateManyEvaluations.mockResolvedValueOnce({ count: 1 });
      orgRepository.findById.mockResolvedValueOnce({ Ten: "Chi bộ A" });
      notificationService.getAllCanBoChinhTriIds.mockResolvedValueOnce(["cb1"]);

      const result = await submitOrgEvaluations("org1", 2024, user);

      expect(memberPartyRepository.updateManyEvaluations).toHaveBeenCalledWith(
        { DangVienId: { in: ["m1"] }, Nam: 2024, TrangThai: { in: ["DRAFT", "REJECTED"] } },
        { TrangThai: "PENDING", LyDoTuChoi: null }
      );
      expect(logAction).toHaveBeenCalledWith("user1", "SUBMIT_ORG_EVALUATIONS", "DANH_GIA_DANG_VIEN", "org1", null, { year: 2024, count: 1 });
      expect(notificationService.createBulkNotifications).toHaveBeenCalled();
      expect(result).toEqual({ count: 1 });
    });

    test("gửi thành công nhưng gặp lỗi gửi thông báo -> vẫn trả về kết quả bình thường (không lỗi)", async () => {
      memberRepository.findAllWithInclude.mockResolvedValueOnce([
        {
          Id: "m1",
          ThongTinVaoDang: { NgayVaoDang: "2020-01-01", NgayChinhThuc: "2021-01-01" },
          LyLichCaNhan: { HoTenDangDung: "Nguyễn Văn A", NgaySinh: "1990-01-01", GioiTinh: "Nam", QueQuan: "HN", DanToc: "Kinh" },
          SoTheDangVien: "123",
          DanhSachDanhGia: [{ Id: "e1", XepLoai: "Tốt" }],
        },
      ]);
      memberPartyRepository.updateManyEvaluations.mockResolvedValueOnce({ count: 1 });
      orgRepository.findById.mockResolvedValueOnce({ Ten: "Chi bộ A" });
      notificationService.getAllCanBoChinhTriIds.mockRejectedValueOnce(new Error("Lỗi mạng")); // Throws in notification
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const result = await submitOrgEvaluations("org1", 2024, user);

      expect(result).toEqual({ count: 1 });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("approveOrgEvaluations", () => {
    const user = { userId: "user1", role: ROLES.CAN_BO_CHINH_TRI };

    test("ném lỗi nếu role không phải CAN_BO_CHINH_TRI", async () => {
      await expect(
        approveOrgEvaluations("org1", 2024, {}, null, { ...user, role: ROLES.BI_THU })
      ).rejects.toThrow("Bạn không có quyền phê duyệt đánh giá chi bộ!");
    });

    test("ném lỗi nếu chi bộ không có đảng viên", async () => {
      memberRepository.findAllWithInclude.mockResolvedValueOnce([]);
      await expect(
        approveOrgEvaluations("org1", 2024, {}, null, user)
      ).rejects.toThrow("Chi bộ không có đảng viên!");
    });

    test("phê duyệt thành công -> lưu quyết định và cập nhật APPROVED", async () => {
      memberRepository.findAllWithInclude.mockResolvedValueOnce([{ Id: "m1" }]);
      resolveQuyetDinh.mockResolvedValueOnce({ QuyetDinhId: "qd1", SoQuyetDinh: "01/QD" });
      memberPartyRepository.updateManyEvaluations.mockResolvedValueOnce({ count: 1 });
      orgRepository.findById.mockResolvedValueOnce({ Ten: "Chi bộ A" });
      notificationService.getBiThuOfOrg.mockResolvedValueOnce(["bt1"]);

      const result = await approveOrgEvaluations("org1", 2024, { SoQuyetDinh: "01/QD" }, null, user);

      expect(resolveQuyetDinh).toHaveBeenCalled();
      expect(memberPartyRepository.updateManyEvaluations).toHaveBeenCalledWith(
        { DangVienId: { in: ["m1"] }, Nam: 2024, TrangThai: "PENDING" },
        { TrangThai: "APPROVED", LyDoTuChoi: null, QuyetDinhId: "qd1", SoQuyetDinh: "01/QD" },
        expect.anything()
      );
      expect(logAction).toHaveBeenCalledWith("user1", "APPROVE_ORG_EVALUATIONS", "DANH_GIA_DANG_VIEN", "org1", null, { year: 2024, count: 1 });
      expect(notificationService.createBulkNotifications).toHaveBeenCalled();
      expect(result).toEqual({ count: 1 });
    });

    test("phê duyệt thành công nhưng gặp lỗi gửi thông báo -> vẫn hoạt động bình thường", async () => {
      memberRepository.findAllWithInclude.mockResolvedValueOnce([{ Id: "m1" }]);
      resolveQuyetDinh.mockResolvedValueOnce({ QuyetDinhId: "qd1", SoQuyetDinh: "01/QD" });
      memberPartyRepository.updateManyEvaluations.mockResolvedValueOnce({ count: 1 });
      orgRepository.findById.mockResolvedValueOnce({ Ten: "Chi bộ A" });
      notificationService.getBiThuOfOrg.mockRejectedValueOnce(new Error("Lỗi"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const result = await approveOrgEvaluations("org1", 2024, { SoQuyetDinh: "01/QD" }, null, user);

      expect(result).toEqual({ count: 1 });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("rejectOrgEvaluations", () => {
    const user = { userId: "user1", role: ROLES.CAN_BO_CHINH_TRI };

    test("ném lỗi nếu role không phải CAN_BO_CHINH_TRI", async () => {
      await expect(
        rejectOrgEvaluations("org1", 2024, "Lý do", { ...user, role: ROLES.BI_THU })
      ).rejects.toThrow("Bạn không có quyền từ chối phê duyệt đánh giá chi bộ!");
    });

    test("ném lỗi nếu lý do rỗng", async () => {
      await expect(
        rejectOrgEvaluations("org1", 2024, " ", user)
      ).rejects.toThrow("Lý do từ chối là bắt buộc");
    });

    test("từ chối thành công -> cập nhật trạng thái REJECTED", async () => {
      memberRepository.findAllWithInclude.mockResolvedValueOnce([{ Id: "m1" }]);
      memberPartyRepository.updateManyEvaluations.mockResolvedValueOnce({ count: 1 });
      orgRepository.findById.mockResolvedValueOnce({ Ten: "Chi bộ A" });
      notificationService.getBiThuOfOrg.mockResolvedValueOnce(["bt1"]);

      const result = await rejectOrgEvaluations("org1", 2024, "Sai sót số liệu", user);

      expect(memberPartyRepository.updateManyEvaluations).toHaveBeenCalledWith(
        { DangVienId: { in: ["m1"] }, Nam: 2024, TrangThai: { in: ["PENDING", "APPROVED"] } },
        { TrangThai: "REJECTED", LyDoTuChoi: "Sai sót số liệu", QuyetDinhId: null, SoQuyetDinh: null }
      );
      expect(logAction).toHaveBeenCalledWith("user1", "REJECT_ORG_EVALUATIONS", "DANH_GIA_DANG_VIEN", "org1", null, { year: 2024, rejectReason: "Sai sót số liệu", count: 1 });
      expect(result).toEqual({ count: 1 });
    });

    test("từ chối thành công nhưng gặp lỗi gửi thông báo -> vẫn trả về kết quả", async () => {
      memberRepository.findAllWithInclude.mockResolvedValueOnce([{ Id: "m1" }]);
      memberPartyRepository.updateManyEvaluations.mockResolvedValueOnce({ count: 1 });
      orgRepository.findById.mockResolvedValueOnce({ Ten: "Chi bộ A" });
      notificationService.getBiThuOfOrg.mockRejectedValueOnce(new Error("Lỗi"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const result = await rejectOrgEvaluations("org1", 2024, "Lý do", user);

      expect(result).toEqual({ count: 1 });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("rollbackOrgEvaluations", () => {
    const user = { userId: "user1", role: ROLES.BI_THU, orgId: "org1" };

    test("ném lỗi nếu role không phải BI_THU", async () => {
      await expect(
        rollbackOrgEvaluations("org1", 2024, { ...user, role: ROLES.CAN_BO_CHINH_TRI })
      ).rejects.toThrow("Chỉ Bí thư mới có quyền thu hồi đề xuất chi bộ!");
    });

    test("ném lỗi nếu thao tác trên chi bộ khác", async () => {
      await expect(
        rollbackOrgEvaluations("org2", 2024, user)
      ).rejects.toThrow("Bạn không có quyền thao tác trên chi bộ khác!");
    });

    test("ném lỗi nếu chi bộ không có đảng viên", async () => {
      memberRepository.findAllWithInclude.mockResolvedValueOnce([]);
      await expect(
        rollbackOrgEvaluations("org1", 2024, user)
      ).rejects.toThrow("Chi bộ không có đảng viên!");
    });

    test("thu hồi thành công -> cập nhật trạng thái về DRAFT", async () => {
      memberRepository.findAllWithInclude.mockResolvedValueOnce([{ Id: "m1" }]);
      memberPartyRepository.updateManyEvaluations.mockResolvedValueOnce({ count: 1 });

      const result = await rollbackOrgEvaluations("org1", 2024, user);

      expect(memberPartyRepository.updateManyEvaluations).toHaveBeenCalledWith(
        { DangVienId: { in: ["m1"] }, Nam: 2024, TrangThai: "PENDING" },
        { TrangThai: "DRAFT", LyDoTuChoi: null, QuyetDinhId: null, SoQuyetDinh: null }
      );
      expect(logAction).toHaveBeenCalledWith("user1", "ROLLBACK_ORG_EVALUATIONS", "DANH_GIA_DANG_VIEN", "org1", null, { year: 2024, count: 1 });
      expect(result).toEqual({ count: 1 });
    });
  });
});
