/**
 * Characterization tests cho reportHelpers — bộ phân loại THUẦN (giáo dục, LLCT,
 * học hàm, giai đoạn vào Đảng, tuổi...). Đây là "nguồn chân lý" mà Phase 4 sẽ gom
 * các bản trùng lặp về. Chốt hành vi trước.
 */
import { describe, test, expect } from "vitest";
import {
  classifyGDPT,
  classifyChuyenMon,
  classifyChucDanhKH,
  classifyLLCT,
  classifyJoinPeriod,
  getAge,
  getPartyAge,
  filterMembersByYear,
  pct,
  getDistribution,
} from "../src/utils/statistics/reportHelpers";

describe("classifyGDPT", () => {
  test.each([
    ["12/12", "THPT"],
    ["9/12", "THCS"],
    ["5/12", "TH"],
    ["Trung học phổ thông", "THPT"],
    ["10/12", "THPT"],
    ["7/12", "THCS"],
    ["3/12", "TH"],
  ])("%s -> %s", (input, expected) => {
    expect(classifyGDPT(input)).toBe(expected);
  });
  test("rỗng -> null", () => expect(classifyGDPT(null)).toBeNull());
});

describe("classifyChuyenMon", () => {
  test("Tiến sĩ khoa học được ưu tiên trước Tiến sĩ", () => {
    expect(classifyChuyenMon({ hocVi: "Tiến sĩ khoa học" })).toBe("TSKH");
  });
  test.each([
    [{ hocVi: "Tiến sĩ" }, "TS"],
    [{ hocVi: "Thạc sĩ" }, "ThS"],
    [{ trinhDoDHSauDH: "Đại học" }, "DH"],
    [{ trinhDoGDNN: "Cao đẳng" }, "CD"],
    [{ trinhDoGDNN: "Trung cấp" }, "THCN"],
    [{ trinhDoGDNN: "Sơ cấp" }, "SC"],
  ])("%o -> %s", (member, expected) => {
    expect(classifyChuyenMon(member)).toBe(expected);
  });
  test("không có dữ liệu -> null", () => expect(classifyChuyenMon({})).toBeNull());
});

describe("classifyChucDanhKH", () => {
  test("Phó giáo sư ưu tiên trước Giáo sư", () => {
    expect(classifyChucDanhKH({ hocHam: "Phó giáo sư" })).toBe("PGS");
    expect(classifyChucDanhKH({ hocHam: "Giáo sư" })).toBe("GS");
  });
  test("trống -> null", () => expect(classifyChucDanhKH({})).toBeNull());
});

describe("classifyLLCT", () => {
  test.each([
    [{ lyLuanChinhTri: "Cao cấp" }, "CN_CC"],
    [{ lyLuanChinhTri: "Cử nhân" }, "CN_CC"],
    [{ lyLuanChinhTri: "Trung cấp" }, "TC"],
    [{ lyLuanChinhTri: "Sơ cấp" }, "SC"],
    [{ lyLuanChinhTri: "Cơ sở" }, "CS"],
  ])("%o -> %s", (member, expected) => {
    expect(classifyLLCT(member)).toBe(expected);
  });
});

describe("classifyJoinPeriod", () => {
  test.each([
    ["1970-01-01", "BEFORE_1975"],
    ["1980-01-01", "1975_1985"],
    ["1990-01-01", "1986_1996"],
    ["2005-01-01", "1997_2010"],
    ["2020-01-01", "2011_NOW"],
  ])("%s -> %s", (date, expected) => {
    expect(classifyJoinPeriod({ ngayVaoDang: date })).toBe(expected);
  });
  test("không có ngày vào Đảng -> null", () => {
    expect(classifyJoinPeriod({})).toBeNull();
  });
});

describe("getAge / getPartyAge", () => {
  test("tuổi đời theo năm tham chiếu", () => {
    expect(getAge({ dob: "1990-01-01" }, 2020)).toBe(30);
    expect(getAge({}, 2020)).toBeNull();
  });
  test("tuổi đảng theo năm tham chiếu", () => {
    expect(getPartyAge({ ngayVaoDang: "2000-01-01" }, 2020)).toBe(20);
    expect(getPartyAge({}, 2020)).toBeNull();
  });
});

describe("filterMembersByYear", () => {
  const members = [
    { id: "1", ngayVaoDang: "2010-01-01" },
    { id: "2", ngayVaoDang: "2025-01-01" },
    { id: "3", createdAt: "2018-01-01" },
  ];
  test("không có năm -> trả nguyên danh sách", () => {
    expect(filterMembersByYear(members, null)).toBe(members);
  });
  test("lọc theo năm vào Đảng/khởi tạo <= reportYear", () => {
    const r = filterMembersByYear(members, 2020).map((m) => m.id);
    expect(r).toContain("1");
    expect(r).toContain("3");
    expect(r).not.toContain("2");
  });
});

describe("pct", () => {
  test("tổng 0 -> 0", () => expect(pct(5, 0)).toBe(0));
  test("phần trăm 1 chữ số thập phân", () => {
    expect(pct(1, 4)).toBe(25);
    expect(pct(1, 3)).toBe(33.3);
  });
});

describe("getDistribution", () => {
  test("đếm và sắp theo số lượng giảm dần", () => {
    const members = [{ rank: "A" }, { rank: "A" }, { rank: "B" }, {}];
    const dist = getDistribution(members, "rank", "Không có");
    expect(dist[0]).toEqual(["A", 2]);
    expect(dist).toContainEqual(["B", 1]);
    expect(dist).toContainEqual(["Không có", 1]);
  });
});
