/**
 * Unit test cho tầng service tổ chức Đảng — mock toàn bộ repository,
 * chỉ kiểm tra logic nghiệp vụ (validate trùng tên, ràng buộc xóa, map DTO).
 */
jest.mock("../../src/repositories/org.repository", () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  countMembers: jest.fn(),
}));

const orgRepository = require("../../src/repositories/org.repository");
const {
  getAllOrgs,
  createOrg,
  updateOrg,
  deleteOrg,
} = require("../../src/services/org.service");

afterEach(() => {
  jest.clearAllMocks();
});

describe("getAllOrgs", () => {
  test("map field DB (tiếng Việt) sang DTO frontend (camelCase)", async () => {
    orgRepository.findAll.mockResolvedValue([
      { Id: "1", Ten: "Chi bộ A", ToChucChaId: null, CreatedAt: "2024-01-01" },
    ]);

    const result = await getAllOrgs();

    expect(result).toEqual([
      { id: "1", name: "Chi bộ A", parentId: null, createdAt: "2024-01-01" },
    ]);
  });
});

describe("createOrg", () => {
  test("tên đã tồn tại -> ném lỗi, không tạo mới", async () => {
    orgRepository.findByName.mockResolvedValue({ Id: "x" });

    await expect(createOrg({ name: "Chi bộ A" }, {})).rejects.toThrow(
      "đã tồn tại",
    );
    expect(orgRepository.create).not.toHaveBeenCalled();
  });

  test("tên chưa tồn tại -> tạo thành công", async () => {
    orgRepository.findByName.mockResolvedValue(null);
    orgRepository.create.mockResolvedValue({
      Id: "2",
      Ten: "Chi bộ B",
      ToChucChaId: "1",
      CreatedAt: "now",
    });

    const result = await createOrg({ name: "Chi bộ B", parentId: "1" }, {});

    expect(orgRepository.create).toHaveBeenCalledWith({
      name: "Chi bộ B",
      parentId: "1",
    });
    expect(result).toEqual({
      id: "2",
      name: "Chi bộ B",
      parentId: "1",
      createdAt: "now",
    });
  });
});

describe("updateOrg", () => {
  test("không tìm thấy tổ chức -> ném lỗi", async () => {
    orgRepository.findById.mockResolvedValue(null);

    await expect(updateOrg("1", { name: "X" }, {})).rejects.toThrow(
      "Không tìm thấy",
    );
  });

  test("đổi tên trùng với tổ chức khác -> ném lỗi", async () => {
    orgRepository.findById.mockResolvedValue({ Id: "1", Ten: "Cũ" });
    orgRepository.findByName.mockResolvedValue({ Id: "2" });

    await expect(updateOrg("1", { name: "Mới" }, {})).rejects.toThrow(
      "trùng",
    );
  });

  test("giữ nguyên tên cũ -> không kiểm tra trùng tên", async () => {
    orgRepository.findById.mockResolvedValue({ Id: "1", Ten: "Cũ" });
    orgRepository.update.mockResolvedValue({
      Id: "1",
      Ten: "Cũ",
      ToChucChaId: null,
      CreatedAt: "now",
    });

    await updateOrg("1", { name: "Cũ" }, {});

    expect(orgRepository.findByName).not.toHaveBeenCalled();
  });

  test("cập nhật thành công với tên mới hợp lệ", async () => {
    orgRepository.findById.mockResolvedValue({ Id: "1", Ten: "Cũ" });
    orgRepository.findByName.mockResolvedValue(null);
    orgRepository.update.mockResolvedValue({
      Id: "1",
      Ten: "Mới",
      ToChucChaId: null,
      CreatedAt: "now",
    });

    const result = await updateOrg("1", { name: "Mới" }, {});

    expect(result).toEqual({
      id: "1",
      name: "Mới",
      parentId: null,
      createdAt: "now",
    });
  });
});

describe("deleteOrg", () => {
  test("còn đảng viên sinh hoạt -> ném lỗi, không xóa", async () => {
    orgRepository.countMembers.mockResolvedValue(3);

    await expect(deleteOrg("1", {})).rejects.toThrow("Không thể xóa");
    expect(orgRepository.delete).not.toHaveBeenCalled();
  });

  test("không tìm thấy tổ chức -> ném lỗi", async () => {
    orgRepository.countMembers.mockResolvedValue(0);
    orgRepository.findById.mockResolvedValue(null);

    await expect(deleteOrg("1", {})).rejects.toThrow("Không tìm thấy");
  });

  test("xóa thành công khi không còn đảng viên", async () => {
    orgRepository.countMembers.mockResolvedValue(0);
    orgRepository.findById.mockResolvedValue({ Id: "1" });
    orgRepository.delete.mockResolvedValue({});

    const result = await deleteOrg("1", {});

    expect(result).toEqual({ message: "Xóa thành công." });
    expect(orgRepository.delete).toHaveBeenCalledWith("1");
  });
});
