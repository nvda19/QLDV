/**
 * Unit test cho decisionResolver.service — `prismaInstance` được truyền qua
 * tham số (dependency injection) nên không cần jest.mock module prisma, chỉ
 * cần truyền một object giả đúng shape (`quyetDinh.findUnique/create`).
 */
jest.mock("../../src/services/files/attachmentUpload.service", () => ({
  saveUploadFile: jest.fn(),
}));

const { saveUploadFile } = require("../../src/services/files/attachmentUpload.service");
const { resolveQuyetDinh } = require("../../src/services/decision/decisionResolver.service");

const makePrismaMock = () => ({
  quyetDinh: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("resolveQuyetDinh", () => {
  test("có QuyetDinhId hợp lệ và tồn tại -> dùng lại, không tạo mới", async () => {
    const prisma = makePrismaMock();
    prisma.quyetDinh.findUnique.mockResolvedValueOnce({
      id: "qd1",
      soQuyetDinh: "01/QD",
      taiLieuUrl: "/uploads/attachments/a.pdf",
      taiLieuName: "a.pdf",
    });

    const result = await resolveQuyetDinh(prisma, { QuyetDinhId: "qd1" }, null, "KHEN_THUONG");

    expect(prisma.quyetDinh.findUnique).toHaveBeenCalledWith({ where: { id: "qd1" } });
    expect(prisma.quyetDinh.create).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      QuyetDinhId: "qd1",
      quyetDinhId: "qd1",
      SoQuyetDinh: "01/QD",
      soQuyetDinh: "01/QD",
      TaiLieuUrl: "/uploads/attachments/a.pdf",
      taiLieuUrl: "/uploads/attachments/a.pdf",
      TaiLieuName: "a.pdf",
      taiLieuName: "a.pdf",
    });
  });

  test("QuyetDinhId rỗng/'null'/'undefined' -> bỏ qua nhánh tra theo Id", async () => {
    const prisma = makePrismaMock();
    prisma.quyetDinh.findUnique.mockResolvedValueOnce(null);

    const result = await resolveQuyetDinh(
      prisma,
      { QuyetDinhId: "undefined", SoQuyetDinh: "" },
      null,
      "KHEN_THUONG",
    );

    expect(result).toMatchObject({
      QuyetDinhId: null,
      quyetDinhId: null,
      SoQuyetDinh: null,
      soQuyetDinh: null,
      TaiLieuUrl: null,
      taiLieuUrl: null,
      TaiLieuName: null,
      taiLieuName: null,
    });
  });

  test("QuyetDinhId không tồn tại trong DB nhưng có SoQuyetDinh trùng -> tái sử dụng theo SoQuyetDinh", async () => {
    const prisma = makePrismaMock();
    prisma.quyetDinh.findUnique
      .mockResolvedValueOnce(null) // tra theo Id -> không có
      .mockResolvedValueOnce({
        id: "qd2",
        soQuyetDinh: "02/QD",
        taiLieuUrl: null,
        taiLieuName: null,
      });

    const result = await resolveQuyetDinh(
      prisma,
      { QuyetDinhId: "khong-ton-tai", SoQuyetDinh: "02/QD" },
      null,
      "KY_LUAT",
    );

    expect(prisma.quyetDinh.create).not.toHaveBeenCalled();
    expect(result.QuyetDinhId).toBe("qd2");
    expect(result.quyetDinhId).toBe("qd2");
    expect(result.TaiLieuUrl).toBeNull();
  });

  test("không tìm thấy theo Id lẫn SoQuyetDinh, không có file -> tạo mới quyết định không đính kèm", async () => {
    const prisma = makePrismaMock();
    prisma.quyetDinh.findUnique.mockResolvedValueOnce(null);
    prisma.quyetDinh.create.mockResolvedValueOnce({
      id: "qd-moi",
      soQuyetDinh: "03/QD",
      taiLieuUrl: null,
      taiLieuName: null,
    });

    const result = await resolveQuyetDinh(
      prisma,
      { SoQuyetDinh: "03/QD", TenQuyetDinh: "Quyết định khen thưởng" },
      null,
      "KHEN_THUONG",
    );

    expect(saveUploadFile).not.toHaveBeenCalled();
    expect(prisma.quyetDinh.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          soQuyetDinh: "03/QD",
          tenQuyetDinh: "Quyết định khen thưởng",
          loaiQuyetDinh: "KHEN_THUONG",
          taiLieuUrl: null,
          taiLieuName: null,
        }),
      }),
    );
    expect(result.QuyetDinhId).toBe("qd-moi");
    expect(result.quyetDinhId).toBe("qd-moi");
  });

  test("không tìm thấy, có file đính kèm -> upload file trước khi tạo quyết định mới", async () => {
    const prisma = makePrismaMock();
    prisma.quyetDinh.findUnique.mockResolvedValueOnce(null);
    saveUploadFile.mockResolvedValueOnce({
      fileUrl: "/uploads/attachments/qd.pdf",
      fileName: "qd.pdf",
    });
    prisma.quyetDinh.create.mockResolvedValueOnce({
      id: "qd-moi-2",
      soQuyetDinh: "04/QD",
      taiLieuUrl: "/uploads/attachments/qd.pdf",
      taiLieuName: "qd.pdf",
    });
    const fakeFile = { originalname: "qd.pdf", buffer: Buffer.from("x") };

    const result = await resolveQuyetDinh(
      prisma,
      { SoQuyetDinh: "04/QD" },
      fakeFile,
      "KHEN_THUONG",
    );

    expect(saveUploadFile).toHaveBeenCalledWith(expect.any(String), fakeFile);
    expect(result.TaiLieuUrl).toBe("/uploads/attachments/qd.pdf");
    expect(result.taiLieuUrl).toBe("/uploads/attachments/qd.pdf");
  });

  test("không có QuyetDinhId lẫn SoQuyetDinh -> trả về object rỗng, không tạo/tra cứu gì", async () => {
    const prisma = makePrismaMock();

    const result = await resolveQuyetDinh(prisma, {}, null, "KHEN_THUONG");

    expect(prisma.quyetDinh.findUnique).not.toHaveBeenCalled();
    expect(prisma.quyetDinh.create).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      QuyetDinhId: null,
      quyetDinhId: null,
      SoQuyetDinh: null,
      soQuyetDinh: null,
      TaiLieuUrl: null,
      taiLieuUrl: null,
      TaiLieuName: null,
      taiLieuName: null,
    });
  });

  test("thiếu TenQuyetDinh -> tự sinh tên mặc định theo SoQuyetDinh", async () => {
    const prisma = makePrismaMock();
    prisma.quyetDinh.findUnique.mockResolvedValueOnce(null);
    prisma.quyetDinh.create.mockResolvedValueOnce({
      id: "qd-x",
      soQuyetDinh: "05/QD",
      taiLieuUrl: null,
      taiLieuName: null,
    });

    await resolveQuyetDinh(prisma, { SoQuyetDinh: "05/QD" }, null, "KHEN_THUONG");

    expect(prisma.quyetDinh.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenQuyetDinh: "Quyết định số 05/QD" }),
      }),
    );
  });
});
