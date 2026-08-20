/**
 * Unit test cho memberEvaluation.service — đánh giá xếp loại đảng viên hàng năm.
 * `prisma` được require nội bộ trong hàm (lazy require) nhưng vẫn phải mock ở
 * mức module vì jest.mock chặn tại thời điểm require, bất kể vị trí gọi.
 */
jest.mock("../../src/repositories/member/memberParty.repository", () => ({
  createEvaluation: jest.fn(),
  findEvaluationById: jest.fn(),
  updateEvaluation: jest.fn(),
  updateManyEvaluations: jest.fn(),
  deleteEvaluation: jest.fn(),
  findLastEvaluation: jest.fn(),
}));
jest.mock("../../src/repositories/member/member.repository", () => ({
  findRewardDiscipline: jest.fn(),
}));
jest.mock("../../src/domain/policies/member.policy", () => ({
  validateWritePermission: jest.fn(),
}));
jest.mock("../../src/services/decision/decisionResolver.service", () => ({
  resolveQuyetDinh: jest.fn(),
}));
jest.mock("../../src/services/files/attachmentUpload.service", () => ({
  saveUploadFile: jest.fn(),
}));
jest.mock("../../src/infrastructure/storage/fileStorage.service", () => ({
  deleteFile: jest.fn(),
}));

const memberPartyRepository = require("../../src/repositories/member/memberParty.repository");
const memberRepository = require("../../src/repositories/member/member.repository");
const { validateWritePermission } = require("../../src/domain/policies/member.policy");
const { resolveQuyetDinh } = require("../../src/services/decision/decisionResolver.service");
const { ROLES } = require("../../src/domain/constants/member.constants");
const {
  validateEvaluation,
  addEvaluation,
  updateEvaluation,
  deleteEvaluation,
  approveEvaluation,
  rejectEvaluation,
} = require("../../src/services/evaluation/evaluation.service");

beforeEach(() => {
  jest.clearAllMocks();
  validateWritePermission.mockResolvedValue({ Id: "m1" });
  memberRepository.findRewardDiscipline.mockResolvedValue(null);
  memberPartyRepository.findLastEvaluation.mockResolvedValue(null);
  resolveQuyetDinh.mockResolvedValue({
    SoQuyetDinh: null,
    TaiLieuUrl: null,
    TaiLieuName: null,
    QuyetDinhId: null,
  });
});

describe("validateEvaluation", () => {
  test("thiếu năm -> ném lỗi", () => {
    expect(() => validateEvaluation({ rank: "Tốt" })).toThrow("Năm đánh giá là bắt buộc");
  });

  test("năm không hợp lệ (trước 1930) -> ném lỗi", () => {
    expect(() => validateEvaluation({ year: 1900, rank: "Tốt" })).toThrow(
      "Năm đánh giá không hợp lệ",
    );
  });

  test("thiếu mức xếp loại -> ném lỗi", () => {
    expect(() => validateEvaluation({ year: 2023, rank: "" })).toThrow(
      "Mức xếp loại đánh giá là bắt buộc",
    );
  });

  test("dữ liệu hợp lệ -> không ném lỗi", () => {
    expect(() => validateEvaluation({ year: 2023, rank: "Hoàn thành tốt" })).not.toThrow();
  });
});

describe("addEvaluation", () => {
  test("bị kỷ luật trong năm đánh giá, xếp loại khác 'Không hoàn thành' -> ném lỗi", async () => {
    memberRepository.findRewardDiscipline.mockResolvedValue({ KyLuat: "Kỷ luật năm 2023" });

    await expect(
      addEvaluation("m1", { year: 2023, rank: "Hoàn thành tốt" }, null, {}),
    ).rejects.toThrow("Bắt buộc phải xếp loại");
    expect(memberPartyRepository.createEvaluation).not.toHaveBeenCalled();
  });

  test("bị kỷ luật nhưng xếp loại đúng 'Không hoàn thành nhiệm vụ' -> cho phép tạo", async () => {
    memberRepository.findRewardDiscipline.mockResolvedValue({ KyLuat: "Kỷ luật năm 2023" });
    memberPartyRepository.createEvaluation.mockResolvedValue({
      Id: "ev1",
      DangVienId: "m1",
      Nam: 2023,
      XepLoai: "Không hoàn thành nhiệm vụ",
      NhanXet: "",
      TrangThai: "DRAFT",
      LyDoTuChoi: null,
    });

    await expect(
      addEvaluation("m1", { year: 2023, rank: "Không hoàn thành nhiệm vụ" }, null, {}),
    ).resolves.toEqual(expect.objectContaining({ status: "DRAFT" }));
  });

  test("năm đánh giá mới không lớn hơn năm đánh giá gần nhất -> ném lỗi", async () => {
    memberPartyRepository.findLastEvaluation.mockResolvedValue({ Nam: 2023 });

    await expect(
      addEvaluation("m1", { year: 2023, rank: "Tốt" }, null, {}),
    ).rejects.toThrow("phải lớn hơn năm đánh giá gần nhất");
  });

  test("dữ liệu hợp lệ -> tạo đánh giá mới ở trạng thái DRAFT", async () => {
    resolveQuyetDinh.mockResolvedValue({
      SoQuyetDinh: "01/QD",
      TaiLieuUrl: null,
      TaiLieuName: null,
      QuyetDinhId: "qd1",
    });
    memberPartyRepository.createEvaluation.mockResolvedValue({
      Id: "ev2",
      DangVienId: "m1",
      Nam: 2024,
      XepLoai: "Hoàn thành tốt",
      NhanXet: "",
      TrangThai: "DRAFT",
      LyDoTuChoi: null,
      SoQuyetDinh: "01/QD",
      QuyetDinhId: "qd1",
    });

    const result = await addEvaluation("m1", { year: 2024, rank: "Hoàn thành tốt" }, null, {});

    expect(memberPartyRepository.createEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({ TrangThai: "DRAFT", QuyetDinhId: "qd1" }),
    );
    expect(result.status).toBe("DRAFT");
  });

  test("không có quyền ghi -> ném lỗi, không tạo đánh giá", async () => {
    validateWritePermission.mockRejectedValue(new Error("Không có quyền"));

    await expect(addEvaluation("m1", { year: 2024, rank: "Tốt" }, null, {})).rejects.toThrow(
      "Không có quyền",
    );
    expect(memberPartyRepository.createEvaluation).not.toHaveBeenCalled();
  });
});

describe("updateEvaluation", () => {
  test("không tìm thấy đánh giá -> ném lỗi", async () => {
    memberPartyRepository.findEvaluationById.mockResolvedValue(null);

    await expect(
      updateEvaluation("m1", "ev-x", { year: 2024 }, null, { role: ROLES.BI_THU }),
    ).rejects.toThrow("Không tìm thấy thông tin đánh giá xếp loại");
  });

  test("BI_THU sửa đánh giá đã PENDING -> ném lỗi", async () => {
    memberPartyRepository.findEvaluationById.mockResolvedValue({
      Id: "ev1",
      DangVienId: "m1",
      Nam: 2023,
      XepLoai: "Tốt",
      TrangThai: "PENDING",
    });

    await expect(
      updateEvaluation("m1", "ev1", { rank: "Khá" }, null, { role: ROLES.BI_THU }),
    ).rejects.toThrow("không thể chỉnh sửa");
  });

  test("CAN_BO_CHINH_TRI sửa đánh giá đã APPROVED -> được phép, giữ nguyên TrangThai", async () => {
    memberPartyRepository.findEvaluationById.mockResolvedValue({
      Id: "ev1",
      DangVienId: "m1",
      Nam: 2023,
      XepLoai: "Tốt",
      TrangThai: "APPROVED",
      LyDoTuChoi: null,
    });
    memberPartyRepository.updateEvaluation.mockResolvedValue({
      Id: "ev1",
      DangVienId: "m1",
      Nam: 2023,
      XepLoai: "Khá",
      TrangThai: "APPROVED",
      LyDoTuChoi: null,
    });

    await updateEvaluation("m1", "ev1", { rank: "Khá" }, null, {
      role: ROLES.CAN_BO_CHINH_TRI,
    });

    expect(memberPartyRepository.updateEvaluation).toHaveBeenCalledWith(
      "ev1",
      expect.objectContaining({ TrangThai: "APPROVED" }),
    );
  });

  test("BI_THU sửa đánh giá DRAFT -> đặt lại TrangThai=DRAFT, LyDoTuChoi=null", async () => {
    memberPartyRepository.findEvaluationById.mockResolvedValue({
      Id: "ev1",
      DangVienId: "m1",
      Nam: 2023,
      XepLoai: "Tốt",
      TrangThai: "REJECTED",
      LyDoTuChoi: "Chưa đạt",
    });
    memberPartyRepository.updateEvaluation.mockResolvedValue({
      Id: "ev1",
      DangVienId: "m1",
      Nam: 2023,
      XepLoai: "Khá",
      TrangThai: "DRAFT",
      LyDoTuChoi: null,
    });

    const result = await updateEvaluation("m1", "ev1", { rank: "Khá" }, null, {
      role: ROLES.BI_THU,
    });

    expect(memberPartyRepository.updateEvaluation).toHaveBeenCalledWith(
      "ev1",
      expect.objectContaining({ TrangThai: "DRAFT", LyDoTuChoi: null }),
    );
    expect(result.status).toBe("DRAFT");
  });
});

describe("deleteEvaluation", () => {
  test("không tìm thấy -> ném lỗi", async () => {
    memberPartyRepository.findEvaluationById.mockResolvedValue(null);

    await expect(
      deleteEvaluation("m1", "ev-x", { role: ROLES.BI_THU }),
    ).rejects.toThrow("Không tìm thấy thông tin đánh giá xếp loại");
  });

  test("BI_THU xóa đánh giá đã APPROVED -> ném lỗi", async () => {
    memberPartyRepository.findEvaluationById.mockResolvedValue({
      Id: "ev1",
      DangVienId: "m1",
      TrangThai: "APPROVED",
    });

    await expect(
      deleteEvaluation("m1", "ev1", { role: ROLES.BI_THU }),
    ).rejects.toThrow("không thể xóa");
    expect(memberPartyRepository.deleteEvaluation).not.toHaveBeenCalled();
  });

  test("xóa đánh giá DRAFT -> thành công", async () => {
    memberPartyRepository.findEvaluationById.mockResolvedValue({
      Id: "ev1",
      DangVienId: "m1",
      TrangThai: "DRAFT",
    });

    await deleteEvaluation("m1", "ev1", { role: ROLES.BI_THU });

    expect(memberPartyRepository.deleteEvaluation).toHaveBeenCalledWith("ev1");
  });
});

describe("approveEvaluation", () => {
  test("không phải CAN_BO_CHINH_TRI -> ném lỗi", async () => {
    await expect(
      approveEvaluation("m1", "ev1", { role: ROLES.BI_THU }),
    ).rejects.toThrow("Bạn không có quyền phê duyệt đánh giá");
  });

  test("không tìm thấy đánh giá -> ném lỗi", async () => {
    memberPartyRepository.findEvaluationById.mockResolvedValue(null);

    await expect(
      approveEvaluation("m1", "ev-x", { role: ROLES.CAN_BO_CHINH_TRI }),
    ).rejects.toThrow("Không tìm thấy thông tin đánh giá xếp loại");
  });

  test("hợp lệ -> phê duyệt, xóa lý do từ chối cũ", async () => {
    memberPartyRepository.findEvaluationById.mockResolvedValue({
      Id: "ev1",
      DangVienId: "m1",
      Nam: 2023,
      XepLoai: "Tốt",
      TrangThai: "APPROVED",
      LyDoTuChoi: null,
    });
    memberPartyRepository.updateManyEvaluations.mockResolvedValue({ count: 1 });

    const result = await approveEvaluation("m1", "ev1", { role: ROLES.CAN_BO_CHINH_TRI });

    expect(memberPartyRepository.updateManyEvaluations).toHaveBeenCalledWith(
      { Id: "ev1", TrangThai: "PENDING" },
      { TrangThai: "APPROVED", LyDoTuChoi: null },
    );
    expect(result.status).toBe("APPROVED");
  });

  test("đánh giá không còn ở trạng thái chờ duyệt -> ném lỗi", async () => {
    memberPartyRepository.findEvaluationById.mockResolvedValue({ Id: "ev1", DangVienId: "m1" });
    memberPartyRepository.updateManyEvaluations.mockResolvedValue({ count: 0 });

    await expect(
      approveEvaluation("m1", "ev1", { role: ROLES.CAN_BO_CHINH_TRI }),
    ).rejects.toThrow("Đánh giá không còn ở trạng thái chờ duyệt");
  });
});

describe("rejectEvaluation", () => {
  test("không phải CAN_BO_CHINH_TRI -> ném lỗi", async () => {
    await expect(
      rejectEvaluation("m1", "ev1", { rejectReason: "Chưa đạt" }, { role: ROLES.BI_THU }),
    ).rejects.toThrow("Bạn không có quyền từ chối phê duyệt đánh giá");
  });

  test("thiếu lý do từ chối -> ném lỗi", async () => {
    await expect(
      rejectEvaluation("m1", "ev1", { rejectReason: "" }, { role: ROLES.CAN_BO_CHINH_TRI }),
    ).rejects.toThrow("Lý do từ chối là bắt buộc");
  });

  test("không tìm thấy đánh giá -> ném lỗi", async () => {
    memberPartyRepository.findEvaluationById.mockResolvedValue(null);

    await expect(
      rejectEvaluation(
        "m1",
        "ev-x",
        { rejectReason: "Chưa đạt" },
        { role: ROLES.CAN_BO_CHINH_TRI },
      ),
    ).rejects.toThrow("Không tìm thấy thông tin đánh giá xếp loại");
  });

  test("hợp lệ -> từ chối kèm lý do", async () => {
    memberPartyRepository.findEvaluationById.mockResolvedValue({
      Id: "ev1",
      DangVienId: "m1",
      Nam: 2023,
      XepLoai: "Tốt",
      TrangThai: "REJECTED",
      LyDoTuChoi: "Chưa đạt tiêu chuẩn",
    });
    memberPartyRepository.updateManyEvaluations.mockResolvedValue({ count: 1 });

    const result = await rejectEvaluation(
      "m1",
      "ev1",
      { rejectReason: "Chưa đạt tiêu chuẩn" },
      { role: ROLES.CAN_BO_CHINH_TRI },
    );

    expect(memberPartyRepository.updateManyEvaluations).toHaveBeenCalledWith(
      { Id: "ev1", TrangThai: { in: ["PENDING", "APPROVED"] } },
      { TrangThai: "REJECTED", LyDoTuChoi: "Chưa đạt tiêu chuẩn" },
    );
    expect(result.rejectReason).toBe("Chưa đạt tiêu chuẩn");
  });

  test("đánh giá không còn ở trạng thái có thể từ chối -> ném lỗi", async () => {
    memberPartyRepository.findEvaluationById.mockResolvedValue({ Id: "ev1", DangVienId: "m1" });
    memberPartyRepository.updateManyEvaluations.mockResolvedValue({ count: 0 });

    await expect(
      rejectEvaluation(
        "m1",
        "ev1",
        { rejectReason: "Chưa đạt tiêu chuẩn" },
        { role: ROLES.CAN_BO_CHINH_TRI },
      ),
    ).rejects.toThrow("Đánh giá không còn ở trạng thái có thể từ chối");
  });
});
