/**
 * Characterization tests cho utils/helpers (hàm thuần: format ngày, cây tổ chức,
 * initials). Chốt hành vi trước khi tách God Component ở Phase 6.
 */
import { describe, test, expect } from "vitest";
import {
  formatDate,
  formatMonthYear,
  formatDateForInput,
  buildOrgTree,
  flattenOrgTree,
  getInitials,
} from "../src/utils/helpers";

describe("formatDate", () => {
  test("rỗng/không hợp lệ -> '—'", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("")).toBe("—");
    expect(formatDate("không-phải-ngày")).toBe("—");
  });
  test("định dạng DD/MM/YYYY", () => {
    expect(formatDate("2020-06-05")).toBe("05/06/2020");
  });
});

describe("formatMonthYear", () => {
  test("rỗng -> '—'", () => {
    expect(formatMonthYear(null)).toBe("—");
  });
  test("định dạng MM/YYYY", () => {
    expect(formatMonthYear("2020-06-05")).toBe("06/2020");
  });
});

describe("formatDateForInput", () => {
  test("rỗng -> ''", () => {
    expect(formatDateForInput(null)).toBe("");
    expect(formatDateForInput("xyz")).toBe("");
  });
  test("định dạng YYYY-MM-DD", () => {
    expect(formatDateForInput("2020-06-05T10:00:00")).toBe("2020-06-05");
  });
});

describe("buildOrgTree + flattenOrgTree", () => {
  const flat = [
    { id: "root", name: "Gốc", parentId: null },
    { id: "a", name: "A", parentId: "root" },
    { id: "b", name: "B", parentId: "root" },
    { id: "a1", name: "A1", parentId: "a" },
  ];

  test("danh sách rỗng -> []", () => {
    expect(buildOrgTree([])).toEqual([]);
    expect(buildOrgTree(null)).toEqual([]);
  });

  test("dựng cây với children lồng nhau", () => {
    const tree = buildOrgTree(flat);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe("root");
    expect(tree[0].children.map((c) => c.id).sort()).toEqual(["a", "b"]);
    const a = tree[0].children.find((c) => c.id === "a");
    expect(a.children.map((c) => c.id)).toEqual(["a1"]);
  });

  test("làm phẳng cây kèm level để thụt lề", () => {
    const tree = buildOrgTree(flat);
    const flatBack = flattenOrgTree(tree);
    const byId = Object.fromEntries(flatBack.map((n) => [n.id, n.level]));
    expect(byId.root).toBe(0);
    expect(byId.a).toBe(1);
    expect(byId.a1).toBe(2);
    expect(flatBack).toHaveLength(4);
  });
});

describe("getInitials", () => {
  test("rỗng / chỉ khoảng trắng -> '?'", () => {
    expect(getInitials(null)).toBe("?");
    expect(getInitials("")).toBe("?");
    expect(getInitials("   ")).toBe("?"); // trước đây ném lỗi
  });
  test("một từ -> chữ cái đầu viết hoa", () => {
    expect(getInitials("an")).toBe("A");
  });
  test("nhiều từ -> chữ đầu của từ đầu + từ cuối", () => {
    expect(getInitials("Nguyễn Văn An")).toBe("NA");
  });
});
