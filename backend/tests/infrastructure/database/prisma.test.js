let capturedExtension = null;
const mockBasePrisma = {
  $extends: jest.fn((ext) => {
    capturedExtension = ext;
    return {
      dangVien: {
        findUnique: (args) => ext.query.$allModels.findUnique({
          model: "DangVien",
          args,
          query: mockBasePrisma.dangVien.findUnique,
        }),
        findFirst: (args) => ext.query.$allModels.findFirst({
          model: "DangVien",
          args,
          query: mockBasePrisma.dangVien.findFirst,
        }),
        findMany: (args) => ext.query.$allModels.findMany({
          model: "DangVien",
          args,
          query: mockBasePrisma.dangVien.findMany,
        }),
        delete: (args) => ext.query.$allModels.delete({
          model: "DangVien",
          args,
          query: mockBasePrisma.dangVien.delete,
        }),
        deleteMany: (args) => ext.query.$allModels.deleteMany({
          model: "DangVien",
          args,
          query: mockBasePrisma.dangVien.deleteMany,
        }),
      },
      deXuatHuyHieu: {
        findUnique: (args) => ext.query.$allModels.findUnique({
          model: "DeXuatHuyHieu",
          args,
          query: mockBasePrisma.deXuatHuyHieu.findUnique,
        }),
        findFirst: (args) => ext.query.$allModels.findFirst({
          model: "DeXuatHuyHieu",
          args,
          query: mockBasePrisma.deXuatHuyHieu.findFirst,
        }),
        findMany: (args) => ext.query.$allModels.findMany({
          model: "DeXuatHuyHieu",
          args,
          query: mockBasePrisma.deXuatHuyHieu.findMany,
        }),
      },
    };
  }),
  dangVien: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  deXuatHuyHieu: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
};

jest.mock("../../../src/infrastructure/database/prisma.client", () => ({
  basePrisma: mockBasePrisma,
}));

jest.mock("../../../src/infrastructure/database/extensions/auditWriter", () => {
  const original = jest.requireActual("../../../src/infrastructure/database/extensions/auditWriter");
  return {
    ...original,
    writeAuditLog: jest.fn(),
  };
});

const prisma = require("../../../src/infrastructure/database/prisma");

describe("Prisma Soft Delete Client Extension", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("DangVien Model (Soft Delete Enabled)", () => {
    test("delete -> chuyển đổi thành update soft delete", async () => {
      mockBasePrisma.dangVien.update.mockResolvedValueOnce({ id: "m1", deletedAt: new Date() });

      const result = await prisma.dangVien.delete({
        where: { id: "m1" },
      });

      expect(mockBasePrisma.dangVien.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "m1" },
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
            deletedBy: "system",
          }),
        })
      );
    });

    test("deleteMany -> chuyển đổi thành updateMany soft delete", async () => {
      mockBasePrisma.dangVien.updateMany.mockResolvedValueOnce({ count: 2 });

      const result = await prisma.dangVien.deleteMany({
        where: { toChucDangId: "org1" },
      });

      expect(mockBasePrisma.dangVien.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { toChucDangId: "org1" },
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
            deletedBy: "system",
          }),
        })
      );
    });

    test("findUnique -> chuyển hướng sang findFirst và tự động lọc deletedAt: null", async () => {
      mockBasePrisma.dangVien.findFirst.mockResolvedValueOnce({ id: "m1", deletedAt: null });

      const result = await prisma.dangVien.findUnique({
        where: { id: "m1" },
      });

      expect(mockBasePrisma.dangVien.findFirst).toHaveBeenCalledWith({
        where: { id: "m1", deletedAt: null },
      });
      expect(result.id).toBe("m1");
    });

    test("findFirst -> tự động lọc deletedAt: null", async () => {
      mockBasePrisma.dangVien.findFirst.mockResolvedValueOnce({ id: "m2" });

      await prisma.dangVien.findFirst({
        where: { soTheDangVien: "123" },
      });

      expect(mockBasePrisma.dangVien.findFirst).toHaveBeenCalledWith({
        where: { soTheDangVien: "123", deletedAt: null },
      });
    });

    test("findMany -> tự động lọc deletedAt: null", async () => {
      mockBasePrisma.dangVien.findMany.mockResolvedValueOnce([]);

      await prisma.dangVien.findMany({
        where: { toChucDangId: "org1" },
      });

      expect(mockBasePrisma.dangVien.findMany).toHaveBeenCalledWith({
        where: { toChucDangId: "org1", deletedAt: null },
      });
    });
  });

  describe("DeXuatHuyHieu Model (Child relation of DangVien)", () => {
    test("findMany -> tự động lồng bộ lọc soft delete của DangVien", async () => {
      mockBasePrisma.deXuatHuyHieu.findMany.mockResolvedValueOnce([]);

      await prisma.deXuatHuyHieu.findMany({
        where: { trangThai: "PENDING" },
      });

      expect(mockBasePrisma.deXuatHuyHieu.findMany).toHaveBeenCalledWith({
        where: {
          trangThai: "PENDING",
          dangVien: { deletedAt: null },
        },
      });
    });

    test("findFirst -> tự động lồng bộ lọc soft delete của DangVien", async () => {
      mockBasePrisma.deXuatHuyHieu.findFirst.mockResolvedValueOnce(null);

      await prisma.deXuatHuyHieu.findFirst({
        where: { id: "b1" },
      });

      expect(mockBasePrisma.deXuatHuyHieu.findFirst).toHaveBeenCalledWith({
        where: {
          id: "b1",
          dangVien: { deletedAt: null },
        },
      });
    });

    test("findUnique -> tự động lồng bộ lọc soft delete của DangVien", async () => {
      mockBasePrisma.deXuatHuyHieu.findUnique.mockResolvedValueOnce(null);

      await prisma.deXuatHuyHieu.findUnique({
        where: { id: "b1" },
      });

      expect(mockBasePrisma.deXuatHuyHieu.findUnique).toHaveBeenCalledWith({
        where: {
          id: "b1",
          dangVien: { deletedAt: null },
        },
      });
    });
  });
});
